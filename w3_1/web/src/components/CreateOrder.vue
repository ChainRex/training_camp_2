<template>
  <div>
    <h2>创建订单</h2>
    <form @submit.prevent="handleSubmit">
      <input v-model="nft" placeholder="NFT 地址" required>
      <input v-model="tokenId" placeholder="Token ID" type="number" required>
      <input v-model="token" placeholder="代币地址" required>
      <input v-model="price" placeholder="价格" type="number" step="0.000000000000000001" required>
      <button type="submit">创建订单</button>
    </form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { createOrderWithApprove } from '../utils/contract';

export default {
  setup() {
    const nft = ref('');
    const tokenId = ref('');
    const token = ref('');
    const price = ref('');

    const handleSubmit = async () => {
      try {
        // 确保价格是字符串
        await createOrderWithApprove(nft.value, tokenId.value, token.value, price.value.toString());
        alert('订单创建成功！');
        // 清空表单
        nft.value = '';
        tokenId.value = '';
        token.value = '';
        price.value = '';
      } catch (error) {
        console.error('创建订单失败:', error);
        alert('创建订单失败，请查看控制台了解详情。');
      }
    };

    return {
      nft,
      tokenId,
      token,
      price,
      handleSubmit,
    };
  },
};
</script>