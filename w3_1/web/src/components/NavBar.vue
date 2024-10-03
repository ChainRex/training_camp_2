<template>
  <div>
    <nav class="navbar">
      <div class="nav-content">
        <div class="nav-left">
          <router-link to="/" class="logo-item">
            <img src="../assets/opensea-logo.svg" alt="NFTMarket Logo" class="logo-image" />
            <span class="logo-text">NFTMarket</span>
          </router-link>
          <a @click="handleMintClick" class="nav-link" style="cursor: pointer;">
            铸造
          </a>
        </div>

        <div class="nav-center">
          <div class="search-container">
            <div class="search-icon">
              <svg viewBox="0 0 24 24" width="24" height="24" role="img" style="fill: #8A939B;">
                <path d="M10 18a7.952 7.952 0 0 0 4.897-1.688l4.396 4.396 1.414-1.414-4.396-4.396A7.952 7.952 0 0 0 18 10c0-4.411-3.589-8-8-8s-8 3.589-8 8 3.589 8 8 8zm0-14c3.309 0 6 2.691 6 6s-2.691 6-6 6-6-2.691-6-6 2.691-6 6-6z"></path>
              </svg>
            </div>
            <input
              v-model="searchQuery"
              @input="handleSearch"
              type="text"
              placeholder="搜索"
              class="search-input"
            />
            <div v-if="isLoading" class="loading-spinner"></div>
          </div>
          <div v-if="searchResults.length > 0" class="search-results">
            <div
              v-for="item in searchResults"
              :key="item.address"
              class="search-result-item"
              @click="handleSelect(item)"
            >
              <img :src="item.iconUrl" alt="NFT Icon" class="result-icon" />
              <div class="result-info">
                <span class="result-name">{{ item.name }}</span>
                <span class="result-supply">{{ item.supply }} 项目</span>
              </div>
            </div>
          </div>
        </div>

        <div class="nav-right">
          <button @click="handleWalletAction" class="wallet-button">
            {{ isConnected ? '退出' : '连接钱包' }}
          </button>
        </div>
      </div>
    </nav>
    <div class="nav-spacer"></div>

    <!-- 新增：警告悬浮条 -->
    <div v-if="showWarning" class="warning-bar">
      <span v-if="!hasMetaMask">
        请安装 MetaMask 钱包。
        <a href="https://metamask.io/download.html" target="_blank" rel="noopener noreferrer">下载 MetaMask</a>
      </span>
      <span v-else-if="!isCorrectNetwork">
        请切换到 Polygon Amoy 测试网。（这可以加快加载速度以及进行交易）
        <a href="#" @click.prevent="switchNetwork">切换网络</a>
      </span>
      <button @click="closeWarning" class="close-warning">×</button>
    </div>

    <!-- 使用新的 WalletConnectModal 组件 -->
    <WalletConnectModal :show="showWalletModal" @update:show="showWalletModal = $event" />
  </div>
</template>

<script>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { ethers } from 'ethers'
import { getNFTName, getNFTTokenIconURI, getIPFSUrl } from '../utils/nftUtils'
import NFTABI from '../contracts/NFT.json'
import { useStore } from 'vuex'
import WalletConnectModal from './WalletConnectModal.vue'
import { clearProviderCache } from '../utils/contract'
import { ElMessage } from 'element-plus'

export default {
  name: 'NavBar',
  components: {
    WalletConnectModal
  },
  setup() {
    const router = useRouter()
    const searchQuery = ref('')
    const searchResults = ref([])
    const isLoading = ref(false)
    const store = useStore()
    const showWalletModal = ref(false)
    const showWarning = ref(true)
    const hasMetaMask = ref(false)
    const isCorrectNetwork = ref(false)

    const handleSearch = async () => {
      if (ethers.utils.isAddress(searchQuery.value)) {
        isLoading.value = true
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const nftContract = new ethers.Contract(searchQuery.value, NFTABI.abi, provider)
          
          const name = await getNFTName(searchQuery.value)
          const tokenIconURI = await getNFTTokenIconURI(searchQuery.value)
          const iconUrl = getIPFSUrl(tokenIconURI)
          const supply = await nftContract.totalSupply()

          searchResults.value = [{
            name,
            iconUrl,
            supply: supply.toString(),
            address: searchQuery.value
          }]
        } catch (error) {
          console.error('查询 NFT 系列失败:', error)
          searchResults.value = []
        } finally {
          isLoading.value = false
        }
      } else {
        // 这里可以添加其他搜索逻辑，比如从后端 API 获取匹配的 NFT 系列
        searchResults.value = []
      }
    }

    const handleSelect = (item) => {
      router.push(`/collection/${item.address}`)
      searchResults.value = []
      searchQuery.value = ''
    }

    const isConnected = computed(() => store.state.isWalletConnected)

    const handleWalletAction = async () => {
      if (isConnected.value) {
        await store.dispatch('disconnectWallet')
      } else {
        showWalletModal.value = true
      }
    }

    const handleMintClick = () => {
      if (isConnected.value) {
        router.push('/mint-nft')
      } else {
        showWalletModal.value = true
      }
    }

    const checkMetaMaskAndNetwork = async () => {
      hasMetaMask.value = typeof window.ethereum !== 'undefined'
      if (hasMetaMask.value) {
        const provider = new ethers.providers.Web3Provider(window.ethereum)
        const network = await provider.getNetwork()
        isCorrectNetwork.value = network.chainId === 80002 // Polygon Amoy 测试网的 chainId
        
        // 更新 store 中的钱包连接状态
        const signer = provider.getSigner()
        try {
          const address = await signer.getAddress()
          store.commit('setWalletConnection', true)
          store.commit('setCurrentUserAddress', address)
        } catch (error) {
          store.commit('setWalletConnection', false)
          store.commit('setCurrentUserAddress', '')
        }
      } else {
        store.commit('setWalletConnection', false)
        store.commit('setCurrentUserAddress', '')
      }
    }

    const switchNetwork = async () => {
      if (window.ethereum) {
        try {
          await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x13882' }], // 80002 in hexadecimal
          });
          ElMessage.success('网络切换成功');
          clearProviderCache(); // 清除缓存的 provider
          await checkMetaMaskAndNetwork(); // 重新检查网络状态
        } catch (error) {
          console.error('Failed to switch network:', error);
          if (error.code === 4902) {
            try {
              await window.ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x13882',
                  chainName: 'Polygon Amoy Testnet',
                  nativeCurrency: {
                    name: 'MATIC',
                    symbol: 'MATIC',
                    decimals: 18
                  },
                  rpcUrls: ['https://rpc-amoy.polygon.technology'],
                  blockExplorerUrls: ['https://amoy.polygonscan.com/']
                }],
              });
              ElMessage.success('网络添加成功');
              clearProviderCache(); // 清除缓存的 provider
              await checkMetaMaskAndNetwork(); // 重新检查网络状态
            } catch (addError) {
              console.error('Failed to add network:', addError);
              ElMessage.error('添加网络失败');
            }
          } else {
            ElMessage.error('切换网络失败');
          }
        }
      }
    }

    const closeWarning = () => {
      showWarning.value = false
    }

    const handleAccountsChanged = async (accounts) => {
      if (accounts.length === 0) {
        // 用户断开了钱包连接
        store.commit('setWalletConnection', false)
        store.commit('setCurrentUserAddress', '')
        ElMessage.warning('钱包已断开连接')
      } else {
        // 用户切换了账户
        store.commit('setWalletConnection', true)
        store.commit('setCurrentUserAddress', accounts[0])
        ElMessage.success('钱包账户已更新')
      }
      await checkMetaMaskAndNetwork()
    }

    const handleChainChanged = async (chainId) => {
      // 用户切换了网络
      clearProviderCache()
      await checkMetaMaskAndNetwork()
      if (chainId !== '0x13882') { // 80002 in hex
        ElMessage.warning('请切换到 Polygon Amoy 测试网')
      } else {
        ElMessage.success('已切换到 Polygon Amoy 测试网')
      }
    }

    onMounted(async () => {
      await checkMetaMaskAndNetwork()
      if (window.ethereum) {
        window.ethereum.on('accountsChanged', handleAccountsChanged)
        window.ethereum.on('chainChanged', handleChainChanged)
      }
    })

    onUnmounted(() => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        window.ethereum.removeListener('chainChanged', handleChainChanged)
      }
    })

    watch([hasMetaMask, isCorrectNetwork], () => {
      showWarning.value = !hasMetaMask.value || !isCorrectNetwork.value
    })

    return {
      searchQuery,
      searchResults,
      isLoading,
      handleSearch,
      handleSelect,
      showWalletModal,
      isConnected,
      handleWalletAction,
      handleMintClick,
      showWarning,
      hasMetaMask,
      isCorrectNetwork,
      switchNetwork,
      closeWarning
    }
  }
}
</script>

<style scoped>
.navbar {
  background-color: #ffffff;
  border-bottom: 1px solid #e5e8eb;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.nav-spacer {
  height: 72px; /* 与导航栏高度相同 */
}

.nav-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  height: 72px;
}

.nav-left, .nav-center, .nav-right {
  display: flex;
  align-items: center;
}

.nav-left {
  flex: 1;
}

.nav-center {
  flex: 2;
  justify-content: center;
  position: relative; /* 添加这行 */
}

.nav-right {
  flex: 1;
  justify-content: flex-end;
}

.logo-item {
  display: flex;
  align-items: center;
  text-decoration: none;
  color: inherit;
  margin-right: 20px;
}

.logo-image {
  height: 40px;
  margin-right: 10px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: #04111d;
}

.search-container {
  position: relative;
  width: 100%;
  max-width: 600px;
}

.search-icon {
  position: absolute;
  left: 12px;
  top: 60%;
  transform: translateY(-50%);
}

.search-input {
  width: 100%;
  padding: 12px 12px 12px 44px;
  border: 2px solid #e5e8eb;
  border-radius: 12px;
  font-size: 16px;
  color: #04111d;
  transition: all 0.2s ease;
  box-sizing: border-box; /* 添加这行 */
}

.search-input:focus {
  border-color: #2081e2;
  outline: none;
}

.search-results {
  position: absolute;
  top: calc(100% + 4px); /* 添加一点间距 */
  left: 2; 
  transform: none; /* 移除 transform */
  background-color: #ffffff;
  border: 2px solid #e5e8eb; /* 使用与搜索框相同的边框 */
  border-radius: 12px; /* 使用与搜索框相同的圆角 */
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  z-index: 10;
  width: 100%; /* 确保宽度为 100% */
  max-width: 600px;
  animation: fadeIn 0.3s ease-out;
  box-sizing: border-box; /* 添加这行 */
  margin-left: -2px; /* 添加这行，补偿边框宽度 */
  padding: 2px; /* 添加这行，确保内容不会紧贴边框 */
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.search-result-item {
  display: flex;
  align-items: center;
  padding: 12px;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.search-result-item:hover {
  background-color: #f8f9fa;
}

.result-icon {
  width: 40px;
  height: 40px;
  margin-right: 12px;
  border-radius: 50%;
}

.result-info {
  display: flex;
  flex-direction: column;
}

.result-name {
  font-weight: 600;
  color: #04111d;
}

.result-supply {
  font-size: 14px;
  color: #707a83;
}

.nav-link {
  color: #04111d;
  text-decoration: none;
  font-weight: 600;
  font-size: 16px;
  margin-left: 20px;
  transition: color 0.2s ease;
}

.nav-link:hover {
  color: #2081e2;
}

.loading-spinner {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid #e5e8eb;
  border-top: 2px solid #2081e2;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.wallet-button {
  background-color: #2081e2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.wallet-button:hover {
  background-color: #1868b7;
}

.warning-bar {
  position: fixed;
  top: 72px; /* 导航栏的高度 */
  left: 0;
  right: 0;
  background-color: #ffeeba;
  color: #856404;
  text-align: center;
  padding: 10px;
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.warning-bar a {
  color: #0056b3;
  text-decoration: underline;
  margin-left: 10px;
}

.close-warning {
  background: none;
  border: none;
  color: #856404;
  font-size: 20px;
  cursor: pointer;
  position: absolute;
  right: 10px;
  top: 50%;
  transform: translateY(-50%);
}
</style>