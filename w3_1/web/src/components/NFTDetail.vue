<template>
  <div class="nft-detail">
    <el-page-header @back="goBack" :content="nft.name || 'NFT 详情'">
      <template #icon>
        <el-icon class="page-header-icon"><Back /></el-icon>
      </template>
    </el-page-header>
    
    <el-row :gutter="20" class="mt-4">
      <el-col :span="12">
        <div class="nft-image-container">
          <div class="image-preview">
            <img :src="nft.image" class="avatar" :alt="nft.name">
          </div>
        </div>
      </el-col>
      <el-col :span="12">
        <h2>{{ nft.name }}</h2>
        <p>{{ nft.description }}</p>
        <p>当前所有者: 
          <el-link :href="`https://amoy.polygonscan.com/address/${nft.owner}`" target="_blank">
            {{ shortenAddress(nft.owner) }}
          </el-link>
        </p>
        <p v-if="nft.price">当前价格: {{ formatPrice(nft.price) }} {{ nft.tokenSymbol }}</p>
        
        <!-- 只在有活跃订单时显示按钮 -->
        <template v-if="nft.price">
          <el-button 
            v-if="isCurrentUserSeller" 
            type="info" 
            @click="cancelOrder"
          >
            <el-icon><Close /></el-icon>
            取消订单
          </el-button>
          <el-button 
            v-else
            type="primary" 
            @click="buyNFT"
          >
            <el-icon><ShoppingCart /></el-icon>
            购买
          </el-button>
        </template>
        <el-button 
          v-else-if="isCurrentUserOwner"
          type="primary" 
          @click="showSellDialog"
        >
          <el-icon><Sell /></el-icon>
          出售
        </el-button>

        <h3 class="mt-4">属性</h3>
        <el-row :gutter="10">
          <el-col :span="8" v-for="(attr, index) in nft.attributes" :key="index">
            <el-card class="attribute-card">
              <div>{{ attr.trait_type }}</div>
              <div>{{ attr.value }}</div>
            </el-card>
          </el-col>
        </el-row>
      </el-col>
    </el-row>

    <h3 class="mt-4">活动记录</h3>
    <el-table :data="transferHistory" style="width: 100%">
      <el-table-column prop="event" label="事件" width="120"></el-table-column>
      <el-table-column prop="from" label="从" width="200">
        <template #default="scope">
          <el-link :href="`https://amoy.polygonscan.com/address/${scope.row.from}`" target="_blank">
            {{ shortenAddress(scope.row.from) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="to" label="至" width="200">
        <template #default="scope">
          <el-link :href="`https://amoy.polygonscan.com/address/${scope.row.to}`" target="_blank">
            {{ shortenAddress(scope.row.to) }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="date" label="日期">
        <template #default="scope">
          <el-link :href="`https://amoy.polygonscan.com/tx/${scope.row.transactionHash}`" target="_blank">
            {{ formatDate(scope.row.date) }}
          </el-link>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增：出售对话框 -->
    <el-dialog
      v-model="sellDialogVisible"
      title="创建出售订单"
      width="30%"
    >
      <el-form :model="sellForm" label-width="120px">
        <el-form-item label="货币地址">
          <el-input v-model="sellForm.tokenAddress"></el-input>
        </el-form-item>
        <el-form-item label="价格">
          <el-input 
            v-model="sellForm.price" 
            type="number" 
            step="0.000000000000000001"
            min="0"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="sellDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="createOrder">
            确认
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { getNFTImageUrl, getTokenInfo } from '../utils/nftUtils';
import { cancelOrder as contractCancelOrder, buyNFT as contractBuyNFT, createOrderWithApprove } from '../utils/contract';
import NFTMarketAddress from '../contracts/NFTMarket-address.json';
import NFTABI from '../contracts/NFT.json';
import { ElMessage } from 'element-plus';
import { Back, Close, ShoppingCart, Sell } from '@element-plus/icons-vue';

export default {
  components: {
    Back,
    Close,
    ShoppingCart,
    Sell
  },
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const nft = ref({});
    const transferHistory = ref([]);
    const currentUserAddress = ref('');

    const isCurrentUserSeller = computed(() => {
      return nft.value.owner && currentUserAddress.value && 
             nft.value.owner.toLowerCase() === currentUserAddress.value.toLowerCase();
    });

    const sellDialogVisible = ref(false);
    const sellForm = ref({
      tokenAddress: '',
      price: ''
    });

    const isCurrentUserOwner = computed(() => {
      return nft.value.owner && currentUserAddress.value && 
             nft.value.owner.toLowerCase() === currentUserAddress.value.toLowerCase();
    });

    const showSellDialog = () => {
      sellDialogVisible.value = true;
    };

    const createOrder = async () => {
      if (!sellForm.value.tokenAddress || !sellForm.value.price) {
        ElMessage.warning('请填写所有必要的信息');
        return;
      }
      if (parseFloat(sellForm.value.price) <= 0) {
        ElMessage.warning('价格必须大于 0');
        return;
      }
      try {
        const { collectionAddress, tokenId } = route.params;
        await createOrderWithApprove(
          collectionAddress,
          tokenId,
          sellForm.value.tokenAddress,
          sellForm.value.price.toString()
        );
        ElMessage.success('订单创建成功');
        sellDialogVisible.value = false;
        await fetchNFTDetails(); // 刷新 NFT 详情
      } catch (error) {
        console.error('创建订单失败:', error);
        ElMessage.error('创建订单失败: ' + error.message);
      }
    };

    const fetchNFTDetails = async () => {
      try {
        const { collectionAddress, tokenId } = route.params;
        
        // 直接从 NFT 合约获取所有者信息
        const currentOwner = await getNFTOwner(collectionAddress, tokenId);
        console.log('当前 NFT 所有者:', currentOwner);

        // 强制刷新 Vuex 中的订单数据
        await store.dispatch("fetchOrders", { force: true });
        
        const rawOrders = store.state.orders;
        const activeOrder = rawOrders.find(o => 
          o.nft === collectionAddress && 
          ethers.BigNumber.from(o.tokenId).eq(ethers.BigNumber.from(tokenId)) &&
          o.status._hex === '0x00'  // 只查找未售出的订单
        );
        
        const tokenURI = await getTokenURI(collectionAddress, tokenId);
        console.log('Token URI:', tokenURI);
        const metadata = await fetchMetadata(tokenURI);
        console.log('Metadata:', metadata);
        const imageUrl = await getNFTImageUrl(collectionAddress, tokenId);
        console.log('Image URL:', imageUrl);

        nft.value = {
          ...metadata,
          image: imageUrl,
          owner: currentOwner,
          collectionAddress,
          tokenId
        };

        if (activeOrder) {
          const tokenInfo = await getTokenInfo(activeOrder.token);
          nft.value = {
            ...nft.value,
            price: activeOrder.price,
            tokenSymbol: tokenInfo.symbol,
            tokenName: tokenInfo.name,
            token: activeOrder.token,
            orderId: activeOrder.id,
            seller: activeOrder.seller
          };
        }

        await fetchTransferHistory(collectionAddress, tokenId);
        
        console.log('更新后的 NFT 详情:', nft.value);
      } catch (error) {
        console.error('获取 NFT 详情失败:', error);
        ElMessage.error('获取 NFT 详情失败: ' + error.message);
      }
    };

    const getTokenURI = async (nftAddress, tokenId) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(nftAddress, NFTABI.abi, provider);
      return await nftContract.tokenURI(tokenId);
    };

    const fetchMetadata = async (tokenURI) => {
      try {
        // 定义 IPFS 网关列表
        const IPFS_GATEWAYS = [
          'https://gateway.pinata.cloud/ipfs/',
        ];

        let metadata;
        for (const gateway of IPFS_GATEWAYS) {
          try {
            // 如果 tokenURI 是 IPFS URL，将其转换为 HTTP URL
            const url = tokenURI.replace('ipfs://', gateway);
            console.log('Trying to fetch metadata from:', url);
            const response = await fetch(url);
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            metadata = await response.json();
            console.log('Metadata fetched successfully:', metadata);
            break; // 如果成功获取元数据，跳出循环
          } catch (error) {
            console.error(`Failed to fetch metadata from ${gateway}:`, error);
          }
        }

        if (!metadata) {
          throw new Error('Failed to fetch metadata from all gateways');
        }

        return metadata;
      } catch (error) {
        console.error('获取或解析元数据失败:', error);
        return {
          name: 'Unknown',
          description: 'Metadata unavailable',
          attributes: []
        };
      }
    };

    const fetchTransferHistory = async (nftAddress, tokenId) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(nftAddress, NFTABI.abi, provider);

      const transferFilter = nftContract.filters.Transfer(null, null, tokenId);
      const transferEvents = await nftContract.queryFilter(transferFilter);

      const allEvents = transferEvents.sort((a, b) => b.blockNumber - a.blockNumber);

      transferHistory.value = await Promise.all(allEvents.map(async (event) => {
        const block = await provider.getBlock(event.blockNumber);
        return {
          event: event.args.from === ethers.constants.AddressZero ? 'Mint' : 'Transfer',
          from: event.args.from,
          to: event.args.to,
          date: new Date(block.timestamp * 1000),
          transactionHash: event.transactionHash
        };
      }));
    };

    const formatPrice = (price) => {
      if (!price) return 'N/A';
      try {
        return ethers.utils.formatEther(price);
      } catch (error) {
        console.error('格式化价格失败:', error, price);
        return 'Error';
      }
    };

    const formatDate = (date) => {
      return date.toLocaleString();
    };

    const goBack = () => {
      router.back();
    };

    const shortenAddress = (address) => {
      if (!address) return 'N/A';
      return `${address.slice(0, 6)}...`;
    };

    const getCurrentUserAddress = async () => {
      if (typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        currentUserAddress.value = await signer.getAddress();
      }
    };

    const cancelOrder = async () => {
      try {
        const { collectionAddress, tokenId } = route.params;
        const rawOrders = await store.dispatch("fetchOrders");
        const orderIndex = rawOrders.findIndex(o => 
          o.nft === collectionAddress && 
          ethers.BigNumber.from(o.tokenId).eq(ethers.BigNumber.from(tokenId)) &&
          o.status._hex === '0x00'
        );

        if (orderIndex === -1) {
          throw new Error('找不到当前 NFT 的活跃订单');
        }
        console.log('取消订单索引:', orderIndex);
        await contractCancelOrder(orderIndex);
        ElMessage.success('订单已成功取消');
        await fetchNFTDetails(); // 刷新 NFT 详情
      } catch (error) {
        console.error('取消订单失败:', error);
        ElMessage.error('取消订单失败: ' + error.message);
      }
    };

    const getSignature = async (order, deadline) => {
      console.log('开始获取签名，订单信息：', order);
      
      if (!order || !order.token || !order.tokenName) {
        console.error('订单信息不完整:', order);
        throw new Error('订单信息不完整，无法生成签名');
      }

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      const domain = {
        name: order.tokenName,
        version: '1',
        chainId: 80002, // Polygon Mumbai 测试网的 chainId
        verifyingContract: order.token
      };

      console.log('Domain 信息:', domain);

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      try {
        const tokenContract = new ethers.Contract(
          order.token,
          ['function nonces(address owner) view returns (uint256)'],
          provider
        );

        const signerAddress = await signer.getAddress();
        console.log('签名者地址:', signerAddress);

        const nonce = await tokenContract.nonces(signerAddress);
        console.log('Nonce:', nonce.toString());

        const value = {
          owner: signerAddress,
          spender: NFTMarketAddress.address,
          value: order.price,
          nonce: nonce,
          deadline: deadline
        };

        console.log('签名数据:', value);

        const signature = await signer._signTypedData(domain, types, value);
        console.log('签名成功:', signature);
        return ethers.utils.splitSignature(signature);
      } catch (error) {
        console.error("签名过程中出错:", error);
        throw new Error("签名失: " + error.message);
      }
    };

    const buyNFT = async () => {
      try {
        const { collectionAddress, tokenId } = route.params;
        const rawOrders = await store.dispatch("fetchOrders");
        const originalOrder = rawOrders.find(o => 
          o.nft === collectionAddress && 
          ethers.BigNumber.from(o.tokenId).eq(ethers.BigNumber.from(tokenId)) &&
          o.status._hex === '0x00'
        );

        if (!originalOrder) {
          throw new Error('找不到当前 NFT 的活跃订单');
        }

        console.log('找到的订单:', originalOrder);

        // 创建一个新的对象，包含原始订单的所有属性
        const order = { ...originalOrder };

        // 确保 order 对象包含所有必要的信息
        if (!order.token || !order.tokenName) {
          const tokenInfo = await getTokenInfo(order.token);
          order.tokenName = tokenInfo.name;
        }

        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
        const { v, r, s } = await getSignature(order, deadline);
        
        const orderIndex = rawOrders.indexOf(originalOrder);

        console.log('准备购买 NFT，参数:', {
          orderIndex,
          deadline,
          v,
          r,
          s
        });

        const tx = await contractBuyNFT(orderIndex, deadline, v, r, s);
        ElMessage.success('NFT 购买交易已提交，等待确认...');
        
        // 等待交易被确认
        await tx.wait();
        
        ElMessage.success('NFT 购买成功，正在更新详情...');
        
        // 等待一段时间后再刷新 NFT 详情，以确保区块链数据已更新
        setTimeout(async () => {
          await fetchNFTDetails();
          ElMessage.success('NFT 详情已更新');
        }, 5000); // 等待 5 秒后刷新
      } catch (error) {
        console.error('购买 NFT 失败:', error);
        ElMessage.error('购买 NFT 失败: ' + error.message);
      }
    };

    // 新增函数：直接从 NFT 合约获取所有者信息
    const getNFTOwner = async (nftAddress, tokenId) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const nftContract = new ethers.Contract(nftAddress, ['function ownerOf(uint256 tokenId) view returns (address)'], provider);
      return await nftContract.ownerOf(tokenId);
    };

    onMounted(async () => {
      await getCurrentUserAddress();
      await fetchNFTDetails();
    });

    return {
      nft,
      transferHistory,
      formatPrice,
      formatDate,
      goBack,
      shortenAddress,
      isCurrentUserSeller,
      cancelOrder,
      buyNFT,
      isCurrentUserOwner,
      sellDialogVisible,
      sellForm,
      showSellDialog,
      createOrder
    };
  }
};
</script>

<style scoped>
.nft-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.nft-image-container {
  width: 100%;
  padding-top: 100%; /* 创建一个正方形容器 */
  position: relative;
  overflow: hidden;
  border: 1px solid #d9d9d9; /* 添加灰色边框 */
  border-radius: 6px; /* 可选：添加圆角 */
}

.image-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff; /* 改为纯白色背景 */
}

.avatar {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.mt-4 {
  margin-top: 1rem;
}

.attribute-card {
  margin-bottom: 10px;
  text-align: center;
}

.el-table {
  margin-top: 1rem;
  width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .el-table {
    font-size: 12px;
  }
  
  .el-table .el-table__cell {
    padding: 5px;
  }
}

.el-table .el-table__cell {
  padding: 8px 0;
}

.el-button {
  margin-top: 20px;
}

.el-button .el-icon {
  margin-right: 8px;
}

.page-header-icon {
  margin-right: 8px;
}

.el-link {
  text-decoration: none;
}

.el-link:hover {
  text-decoration: none;
}
</style>