<template>
  <el-menu mode="horizontal" router class="nav-menu">
    <el-menu-item index="/" class="logo-item">
      <img src="../assets/opensea-logo.svg" alt="OpenSea Logo" class="logo-image" />
      <span class="logo-text">NFTMarket</span>
    </el-menu-item>
    
    <el-autocomplete
      v-model="searchQuery"
      :fetch-suggestions="querySearch"
      placeholder="搜索 NFT 系列"
      class="search-input"
      @select="handleSelect"
    >
      <template #default="{ item }">
        <div class="search-result-item">
          <el-avatar :size="30" :src="item.iconUrl"></el-avatar>
          <div class="search-result-info">
            <span>{{ item.name }}</span>
            <span class="search-result-supply">{{ item.supply }} 项目</span>
          </div>
        </div>
      </template>
    </el-autocomplete>

    <el-menu-item index="/mint-nft">
      <el-icon><Plus /></el-icon>
      铸造 NFT
    </el-menu-item>
  </el-menu>
</template>

<script>
import { ref } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ethers } from 'ethers'
import { getNFTName, getNFTTokenIconURI, getIPFSUrl } from '../utils/nftUtils'
import NFTABI from '../contracts/NFT.json'

export default {
  name: 'NavBar',
  components: {
    Plus
  },
  setup() {
    const router = useRouter()
    const searchQuery = ref('')

    const querySearch = async (queryString, cb) => {
      if (ethers.utils.isAddress(queryString)) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum)
          const nftContract = new ethers.Contract(queryString, NFTABI.abi, provider)
          
          const name = await getNFTName(queryString)
          const tokenIconURI = await getNFTTokenIconURI(queryString)
          const iconUrl = getIPFSUrl(tokenIconURI)
          const supply = await nftContract.totalSupply()

          cb([{
            value: name,
            name,
            iconUrl,
            supply: supply.toString(),
            address: queryString
          }])
        } catch (error) {
          console.error('查询 NFT 系列失败:', error)
          cb([])
        }
      } else {
        // 这里可以添加其他搜索逻辑，比如从后端 API 获取匹配的 NFT 系列
        cb([])
      }
    }

    const handleSelect = (item) => {
      router.push(`/collection/${item.address}`)
    }

    return {
      searchQuery,
      querySearch,
      handleSelect
    }
  }
}
</script>

<style scoped>
.nav-menu {
  display: flex;
  align-items: center;
}

.logo-item {
  display: flex;
  align-items: center;
}

.logo-image {
  height: 30px;
  margin-right: 10px;
}

.logo-text {
  font-size: 18px;
  font-weight: bold;
}

.search-input {
  flex: 1;
  max-width: 500px;
  margin: 0 20px;
}

.search-result-item {
  display: flex;
  align-items: center;
}

.search-result-info {
  display: flex;
  flex-direction: column;
  margin-left: 10px;
}

.search-result-supply {
  font-size: 12px;
  color: #999;
}
</style>