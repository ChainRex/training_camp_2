<template>
  <div class="collection-detail">
    <el-page-header @back="goBack" :content="collection.name">
    </el-page-header>
    <el-row class="collection-header">
      <el-col :span="4">
        <el-avatar :size="100" :src="collection.imageUrl"></el-avatar>
      </el-col>
      <el-col :span="20">
        <h1>{{ collection.name }}</h1>
        <p>合约地址: {{ collection.address }}</p>
        <p>地板价: {{ formatPrice(collection.floorPrice) }} {{ collection.tokenSymbol }}</p>
      </el-col>
    </el-row>
    <el-row :gutter="20">
      <el-col :span="6" v-for="nft in sortedNFTs" :key="nft.id">
        <router-link :to="`/nft/${collection.address}/${nft.id}`" class="nft-link">
          <el-card :body-style="{ padding: '0px' }" shadow="hover">
            <img :src="nft.imageUrl" class="image" :alt="nft.name">
            <div style="padding: 14px;">
              <span>{{ nft.name }} #{{ nft.id }}</span>
              <div class="bottom">
                <span>{{ formatPrice(nft.price) }} {{ collection.tokenSymbol }}</span>
              </div>
            </div>
          </el-card>
        </router-link>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { getNFTImageUrl, getTokenInfo, getNFTName } from '../utils/nftUtils';

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
        
        const collectionOrders = rawOrders.filter(order => order.nft === collectionAddress && order.status._hex === '0x00');
        
        if (collectionOrders.length > 0) {
          const firstOrder = collectionOrders[0];
          const tokenInfo = await getTokenInfo(firstOrder.token);
          const imageUrl = await getNFTImageUrl(collectionAddress, 0);
          const name = await getNFTName(collectionAddress);

          collection.value = {
            address: collectionAddress,
            name,
            imageUrl,
            floorPrice: ethers.BigNumber.from(firstOrder.price || '0'),
            tokenSymbol: tokenInfo.symbol
          };

          const nftMap = new Map();

          for (const order of collectionOrders) {
            if (!nftMap.has(order.tokenId)) {
              nftMap.set(order.tokenId, {
                id: order.tokenId,
                name: name,
                imageUrl: await getNFTImageUrl(collectionAddress, order.tokenId),
                price: order.price ? ethers.BigNumber.from(order.price) : ethers.BigNumber.from('0')
              });
            }
          }

          nfts.value = Array.from(nftMap.values());

          // 更新地板价
          nfts.value.forEach(nft => {
            if (nft.price.lt(collection.value.floorPrice)) {
              collection.value.floorPrice = nft.price;
            }
          });
        }
      } catch (error) {
        console.error('获取集合详情失败:', error);
      }
    };

    const sortedNFTs = computed(() => {
      return [...nfts.value].sort((a, b) => parseInt(a.id) - parseInt(b.id));
    });

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

    onMounted(fetchCollectionDetails);

    return {
      collection,
      sortedNFTs,
      formatPrice,
      goBack
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
</style>