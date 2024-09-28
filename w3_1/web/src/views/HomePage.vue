<template>
  <div>
    <h1>NFT 市场</h1>
    <CreateOrder />
    <OrderList />
  </div>
</template>

<script>
import CreateOrder from '../components/CreateOrder.vue';
import OrderList from '../components/OrderList.vue';

export default {
  name: 'HomePage', 
  components: {
    CreateOrder,
    OrderList,
  },
};
</script>