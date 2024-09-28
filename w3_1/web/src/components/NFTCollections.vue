<template>
  <div class="nft-collections">
    <h2>NFT 系列</h2>
    <el-row :gutter="20">
      <el-col :span="6" v-for="(collection, index) in collections" :key="index">
        <el-card :body-style="{ padding: '0px' }" shadow="hover" class="collection-card">
          <router-link :to="`/collection/${collection.address}`" class="collection-link">
            <img :src="collection.imageUrl" class="image" :alt="collection.name">
            <div class="collection-info">
              <span class="collection-name">{{ collection.name }}</span>
              <div class="bottom">
                <span class="floor-price">地板价: {{ formatPrice(collection.floorPrice) }} {{ collection.tokenSymbol }}</span>
              </div>
            </div>
          </router-link>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useStore } from "vuex";
import { ethers } from 'ethers';
import { getNFTImageUrl, getTokenInfo, getNFTName } from '../utils/nftUtils';

export default {
  setup() {
    const store = useStore();
    const collections = ref([]);

    const fetchCollections = async () => {
      try {
        const rawOrders = await store.dispatch("fetchOrders");
        if (!rawOrders || !Array.isArray(rawOrders)) {
          console.error('获取到的订单数据无效:', rawOrders);
          return;
        }

        const collectionMap = new Map();

        for (const order of rawOrders) {
          if (!order.nft || !order.token || !order.price || order.status._hex !== '0x00') {
            continue; // 跳过不完整的订单或非出售状态的订单
          }

          try {
            const tokenInfo = await getTokenInfo(order.token);
            const imageUrl = await getNFTImageUrl(order.nft, order.tokenId);
            
            if (!collectionMap.has(order.nft)) {
              collectionMap.set(order.nft, {
                address: order.nft,
                name: await getNFTName(order.nft),
                floorPrice: ethers.BigNumber.from(order.price),
                tokenSymbol: tokenInfo.symbol,
                imageUrl: imageUrl
              });
            } else {
              const existingCollection = collectionMap.get(order.nft);
              const newPrice = ethers.BigNumber.from(order.price);
              if (newPrice.lt(existingCollection.floorPrice)) {
                existingCollection.floorPrice = newPrice;
              }
            }
          } catch (error) {
            console.error('处理订单时出错:', error, order);
          }
        }

        collections.value = Array.from(collectionMap.values());
      } catch (error) {
        console.error('获取 NFT 系列失败:', error);
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

    onMounted(fetchCollections);

    return {
      collections,
      formatPrice,
    };
  },
};
</script>

<style scoped>
.nft-collections {
  margin-top: 20px;
}

.collection-card {
  margin-bottom: 20px;
}

.collection-link {
  text-decoration: none;
  color: inherit;
  display: block;
}

.image {
  width: 100%;
  display: block;
}

.collection-info {
  padding: 14px;
}

.collection-name {
  font-weight: bold;
  color: #333;
}

.bottom {
  margin-top: 13px;
  line-height: 12px;
}

.floor-price {
  color: #666;
}
</style>