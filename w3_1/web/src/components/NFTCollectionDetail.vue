<template>
  <div class="collection-detail">
    <el-page-header @back="goBack" :content="collection.name">
    </el-page-header>
    <el-row class="collection-header">
      <el-col :span="4">
        <el-avatar :size="100" :src="collection.iconUrl"></el-avatar>
      </el-col>
      <el-col :span="20">
        <h1>
          <a :href="getExplorerUrl('token', collection.address)" target="_blank" rel="noopener noreferrer">
            {{ collection.name }}
          </a>
        </h1>
        <p>合约地址: 
          <a :href="getExplorerUrl('address', collection.address)" target="_blank" rel="noopener noreferrer">
            {{ collection.address }}
          </a>
        </p>
        <p v-if="collection.floorPrice && collection.tokenSymbol">地板价: {{ formatPrice(collection.floorPrice) }} {{ collection.tokenSymbol }}</p>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="6" v-for="nft in nfts" :key="nft.id">
        <router-link :to="`/nft/${collection.address}/${nft.id}`" class="nft-link">
          <el-card :body-style="{ padding: '0px' }" shadow="hover">
            <img :src="nft.imageUrl" class="image" :alt="nft.name">
            <div style="padding: 14px;">
              <span>{{ collection.name }} #{{ nft.id }} - {{ nft.name }}</span>
              <div class="bottom">
                <span v-if="nft.price">{{ formatPrice(nft.price) }} {{ collection.tokenSymbol }}</span>
                <span v-else>&nbsp;</span>
              </div>
            </div>
          </el-card>
        </router-link>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { getNFTImageUrl, getTokenInfo, getNFTName, getNFTTokenIconURI, getIPFSUrl } from '../utils/nftUtils';
import NFTABI from '../contracts/NFT.json';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const collection = ref({});
    const nfts = ref([]);

    const fetchCollectionDetails = async () => {
      try {
        const collectionAddress = route.params.address;
        const rawOrders = await store.dispatch("fetchOrders");
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const nftContract = new ethers.Contract(collectionAddress, NFTABI.abi, provider);
        
        const name = await getNFTName(collectionAddress);
        const tokenIconURI = await getNFTTokenIconURI(collectionAddress);
        const iconUrl = getIPFSUrl(tokenIconURI);

        collection.value = {
          address: collectionAddress,
          name,
          iconUrl,
          floorPrice: ethers.constants.MaxUint256,
          tokenSymbol: ''
        };

        // 获取所有 NFT 的 TokenURI
        const tokenURIList = await nftContract.getTokenURIList();
        
        // 获取每个 NFT 的详细信息
        nfts.value = await Promise.all(tokenURIList.map(async (tokenURI, index) => {
          const metadata = await fetchMetadata(tokenURI);
          const imageUrl = await getNFTImageUrl(collectionAddress, index);
          const order = rawOrders.find(o => 
            o.nft === collectionAddress && 
            ethers.BigNumber.from(o.tokenId).eq(ethers.BigNumber.from(index)) &&
            o.status._hex === '0x00'
          );

          if (order && order.price) {
            const price = ethers.BigNumber.from(order.price);
            if (price.lt(collection.value.floorPrice)) {
              collection.value.floorPrice = price;
            }
            if (!collection.value.tokenSymbol) {
              const tokenInfo = await getTokenInfo(order.token);
              collection.value.tokenSymbol = tokenInfo.symbol;
            }
          }

          return {
            id: index,
            name: metadata.name,
            imageUrl: imageUrl,
            price: order ? order.price : null
          };
        }));

        if (collection.value.floorPrice.eq(ethers.constants.MaxUint256)) {
          collection.value.floorPrice = null;
        }

      } catch (error) {
        console.error('获取集合详情失败:', error);
      }
    };

    const fetchMetadata = async (tokenURI) => {
      try {
        const response = await fetch(getIPFSUrl(tokenURI));
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      } catch (error) {
        console.error('获取元数据失败:', error);
        return { name: 'Unknown' };
      }
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

    const goBack = () => {
      router.push('/');
    };

    const getExplorerUrl = (type, address) => {
      // 这里使用 Mumbai 测试网的浏览器 URL，您可以根据需要更改
      const baseUrl = 'https://amoy.polygonscan.com';
      switch (type) {
        case 'token':
          return `${baseUrl}/token/${address}`;
        case 'address':
          return `${baseUrl}/address/${address}`;
        default:
          return baseUrl;
      }
    };

    onMounted(fetchCollectionDetails);

    return {
      collection,
      nfts,
      formatPrice,
      goBack,
      getExplorerUrl
    };
  }
};
</script>

<style scoped>
.collection-detail {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.collection-header {
  margin: 20px 0;
}

.image {
  width: 100%;
  display: block;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
}

.el-card {
  margin-bottom: 20px;
}

.nft-link {
  text-decoration: none;
  color: inherit;
}

a {
  color: #409EFF;
  text-decoration: none;
}

a:hover {
  text-decoration: none; /* 移除悬浮时的下划线 */
}
</style>