<template>
  <div class="create-order">
    <h2>创建订单</h2>
    <el-form :model="orderForm" label-width="120px" @submit.prevent="createOrder">
      <el-form-item label="NFT 地址">
        <el-input v-model="orderForm.nftAddress"></el-input>
      </el-form-item>
      <el-form-item label="Token ID">
        <el-input v-model="orderForm.tokenId" type="number"></el-input>
      </el-form-item>
      <el-form-item label="货币地址">
        <el-input v-model="orderForm.tokenAddress"></el-input>
      </el-form-item>
      <el-form-item label="价格">
        <el-input v-model="orderForm.price" type="number"></el-input>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" native-type="submit">创建订单</el-button>
      </el-form-item>
    </el-form>
  </div>
</template>

<script>
import { ref } from 'vue';
import { createOrderWithApprove } from '../utils/contract';
import { ElMessage } from 'element-plus';

export default {
  name: 'CreateOrder',
  setup() {
    const orderForm = ref({
      nftAddress: '',
      tokenId: '',
      tokenAddress: '',
      price: ''
    });

    const createOrder = async () => {
      try {
        await createOrderWithApprove(
          orderForm.value.nftAddress,
          orderForm.value.tokenId,
          orderForm.value.tokenAddress,
          orderForm.value.price
        );
        ElMessage.success('订单创建成功');
      } catch (error) {
        console.error('创建订单失败:', error);
        ElMessage.error('创建订单失败: ' + error.message);
      }
    };

    return {
      orderForm,
      createOrder
    };
  }
}
</script>