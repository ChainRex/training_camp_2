<template>
  <div>
    <h2>订单列表</h2>
    <p>当前账户: {{ currentAccount }}</p>
    <ul>
      <li v-for="(order, index) in orders" :key="index" class="order-item">
        <div class="order-details">
          NFT: {{ order.nft }}<br />
          Token ID: {{ order.tokenId }}<br />
          价格: {{ formatPrice(order.price) }} {{ order.tokenSymbol }}<br />
          货币地址: {{ order.token }}<br />
          货币名称: {{ order.tokenName }}<br />
          卖家: {{ order.seller }}<br />
          状态: {{ getStatusText(order.status) }}
        </div>
        <div class="order-actions">
          <button v-if="order.status._hex === '0x00'" @click="handleBuy(index)">
            购买
          </button>
          <button
            v-if="order.status._hex === '0x00' && isSeller(order.seller)"
            @click="handleCancel(index)"
          >
            取消订单
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { onMounted, ref } from "vue";
import { useStore } from "vuex";
import { ethers } from "ethers";
import { cancelOrder, buyNFT } from "../utils/contract";
import NFTMarketAddress from '../contracts/NFTMarket-address.json';

export default {
  setup() {
    const store = useStore();
    const orders = ref([]);
    const currentAccount = ref('');

    onMounted(async () => {
      try {
        console.log('开始获取订单');
        await fetchOrders();
        console.log('订单获取完成', orders.value);
        
        await updateCurrentAccount();
        
        window.ethereum.on('accountsChanged', async () => {
          await updateCurrentAccount();
        });
      } catch (error) {
        console.error("获取订单失败:", error);
        alert("获取订单失败，请检查网络连接并确保已连接到 Polygon Mumbai 测试网。");
      }
    });

    const updateCurrentAccount = async () => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      currentAccount.value = await signer.getAddress();
      console.log('当前账户:', currentAccount.value);
    };

    const fetchOrders = async () => {
      try {
        const rawOrders = await store.dispatch("fetchOrders");
        if (!rawOrders || !Array.isArray(rawOrders)) {
          console.error('获取到的订单数据无效:', rawOrders);
          return;
        }
        orders.value = await Promise.all(rawOrders.map(async (order) => {
          const tokenInfo = await getTokenInfo(order.token);
          return {
            ...order,
            tokenName: tokenInfo.name,
            tokenSymbol: tokenInfo.symbol
          };
        }));
      } catch (error) {
        console.error('获取订单失败:', error);
      }
    };

    const getTokenInfo = async (tokenAddress) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const tokenContract = new ethers.Contract(
        tokenAddress,
        ['function name() view returns (string)', 'function symbol() view returns (string)'],
        provider
      );

      try {
        const [name, symbol] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol()
        ]);
        return { name, symbol };
      } catch (error) {
        console.error('获取代币信息失败:', error);
        return { name: 'Unknown', symbol: 'Unknown' };
      }
    };

    const formatPrice = (price) => {
      return ethers.utils.formatEther(price);
    };

    const getStatusText = (status) => {
      const statusMap = {
        0: "未售出",
        1: "已售出",
        2: "已取消",
      };
      return statusMap[status] || "未知状态";
    };

    const isSeller = (seller) => {
      return seller.toLowerCase() === currentAccount.value.toLowerCase();
    };

    const getSignature = async (index, deadline) => {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const order = orders.value[index];
      
      const domain = {
        name: order.tokenName,
        version: '1',
        chainId: 80002, // Polygon Mumbai 测试网的 chainId
        verifyingContract: order.token
      };

      const types = {
        Permit: [
          { name: 'owner', type: 'address' },
          { name: 'spender', type: 'address' },
          { name: 'value', type: 'uint256' },
          { name: 'nonce', type: 'uint256' },
          { name: 'deadline', type: 'uint256' }
        ]
      };

      const tokenContract = new ethers.Contract(
        order.token,
        ['function nonces(address owner) view returns (uint256)'],
        provider
      );

      const nonce = await tokenContract.nonces(await signer.getAddress());

      const value = {
        owner: await signer.getAddress(),
        spender: NFTMarketAddress.address, // 使用导入的合约地址
        value: order.price,
        nonce: nonce,
        deadline: deadline
      };

      try {
        const signature = await signer._signTypedData(domain, types, value);
        return ethers.utils.splitSignature(signature);
      } catch (error) {
        console.error("签名失败:", error);
        throw new Error("用户取消了签名或签名失败");
      }
    };

    const handleBuy = async (index) => {
      try {
        const deadline = Math.floor(Date.now() / 1000) + 3600; // 1小时后过期
        const { v, r, s } = await getSignature(index, deadline);
        await buyNFT(index, deadline, v, r, s);
        alert("购买成功！");
        await fetchOrders(); // 重新获取订单列表
      } catch (error) {
        console.error("购买失败:", error);
        alert("购买失败，请查看控制台了解详情。");
      }
    };

    const handleCancel = async (index) => {
      try {
        await cancelOrder(index);
        alert("订单已取消！");
        store.dispatch("fetchOrders");
      } catch (error) {
        console.error("取消订单失败:", error);
        alert("取消订单失败，请查看控制台了解详情。");
      }
    };

    return {
      orders,
      currentAccount,
      formatPrice,
      getStatusText,
      handleBuy,
      handleCancel,
      isSeller,
    };
  },
};
</script>

<style scoped>
.order-item {
  margin-bottom: 20px;
  border: 1px solid #ccc;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.order-details {
  flex: 1;
}
.order-actions {
  display: flex;
  flex-direction: column;
}
.order-actions button {
  margin-top: 5px;
}
</style>