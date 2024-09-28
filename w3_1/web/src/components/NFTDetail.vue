<template>
  <div class="nft-detail">
    <el-page-header @back="goBack" :content="nft.title || 'NFT 详情'"></el-page-header>
    
    <el-row :gutter="20" class="mt-4">
      <el-col :span="12">
        <div class="nft-image-container">
          <el-image :src="nft.image" fit="cover" class="nft-image"></el-image>
        </div>
      </el-col>
      <el-col :span="12">
        <h2>{{ nft.title }}</h2>
        <p>{{ nft.description }}</p>
        <p>当前所有者: 
          <el-link :href="`https://amoy.polygonscan.com/address/${nft.owner}`" target="_blank">
            {{ shortenAddress(nft.owner) }}
          </el-link>
        </p>
        <p>当前价格: {{ formatPrice(nft.price) }} {{ nft.tokenSymbol }}</p>
        
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

    <h3 class="mt-4">转移记录</h3>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useStore } from 'vuex';
import { ethers } from 'ethers';
import { getNFTImageUrl, getTokenInfo } from '../utils/nftUtils';
import NFTMarketABI from '../contracts/NFTMarket-abi.json';
import NFTMarketAddress from '../contracts/NFTMarket-address.json';
import NFTABI from '../contracts/NFT.json';

export default {
  setup() {
    const route = useRoute();
    const router = useRouter();
    const store = useStore();
    const nft = ref({});
    const transferHistory = ref([]);

    const fetchNFTDetails = async () => {
      try {
        const { collectionAddress, tokenId } = route.params;
        const rawOrders = await store.dispatch("fetchOrders");
        const order = rawOrders.find(o => o.nft === collectionAddress && ethers.BigNumber.from(o.tokenId).eq(ethers.BigNumber.from(tokenId)));
        
        if (order) {
          const tokenInfo = await getTokenInfo(order.token);
          const tokenURI = await getTokenURI(collectionAddress, tokenId);
          console.log(tokenURI);
          const metadata = await fetchMetadata(tokenURI);
          console.log(metadata);
          const imageUrl = await getNFTImageUrl(collectionAddress, tokenId);
          console.log(imageUrl);
        
          
          nft.value = {
            ...metadata,
            image: imageUrl,
            owner: order.seller,
            price: order.price,
            tokenSymbol: tokenInfo.symbol
          };

          await fetchTransferHistory(collectionAddress, tokenId);
        }
      } catch (error) {
        console.error('获取 NFT 详情失败:', error);
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
      const marketContract = new ethers.Contract(NFTMarketAddress.address, NFTMarketABI.abi, provider);

      const transferFilter = nftContract.filters.Transfer(null, null, tokenId);
      const transferEvents = await nftContract.queryFilter(transferFilter);

      let orderCreatedEvents = [];
      let orderCancelledEvents = [];
      let orderSuccessfulEvents = [];

      // 尝试获取市场合约事件
      try {
        if (marketContract.filters.OrderCreated) {
          const orderCreatedFilter = marketContract.filters.OrderCreated();
          orderCreatedEvents = await marketContract.queryFilter(orderCreatedFilter);
        }
        if (marketContract.filters.OrderCancelled) {
          const orderCancelledFilter = marketContract.filters.OrderCancelled();
          orderCancelledEvents = await marketContract.queryFilter(orderCancelledFilter);
        }
        if (marketContract.filters.OrderSuccessful) {
          const orderSuccessfulFilter = marketContract.filters.OrderSuccessful();
          orderSuccessfulEvents = await marketContract.queryFilter(orderSuccessfulFilter);
        }
      } catch (error) {
        console.error('获取市场合约事件失败:', error);
      }

      const allEvents = [
        ...transferEvents.map(e => ({ ...e, event: 'Transfer' })),
        ...orderCreatedEvents
          .filter(e => e.args && e.args.nft === nftAddress && e.args.tokenId && e.args.tokenId.toString() === tokenId.toString())
          .map(e => ({ ...e, event: 'OrderCreated' })),
        ...orderCancelledEvents
          .filter(e => e.args && e.args.nft === nftAddress && e.args.tokenId && e.args.tokenId.toString() === tokenId.toString())
          .map(e => ({ ...e, event: 'OrderCancelled' })),
        ...orderSuccessfulEvents
          .filter(e => e.args && e.args.nft === nftAddress && e.args.tokenId && e.args.tokenId.toString() === tokenId.toString())
          .map(e => ({ ...e, event: 'OrderSuccessful' }))
      ].sort((a, b) => b.blockNumber - a.blockNumber);

      transferHistory.value = await Promise.all(allEvents.map(async (event) => {
        const block = await provider.getBlock(event.blockNumber);
        return {
          event: event.event,
          from: event.args.from || event.args.seller || 'N/A',
          to: event.args.to || event.args.buyer || 'N/A',
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

    onMounted(fetchNFTDetails);

    return {
      nft,
      transferHistory,
      formatPrice,
      formatDate,
      goBack,
      shortenAddress
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
  padding-bottom: 100%; /* 创建一个1:1的宽高比 */
  position: relative;
  overflow: hidden;
}

.nft-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover; /* 确保图像填满容器并保持比例 */
}

.attribute-card {
  margin-bottom: 10px;
  text-align: center;
}

.mt-4 {
  margin-top: 1rem;
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
</style>