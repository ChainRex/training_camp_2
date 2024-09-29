<template>
  <el-menu mode="horizontal" router class="nav-menu">
    <el-menu-item index="/" class="logo-item">
      <img src="../assets/opensea-logo.svg" alt="OpenSea Logo" class="logo-image" />
      <span class="logo-text">NFTMarket</span>
    </el-menu-item>
    <el-menu-item index="/create-order">创建订单</el-menu-item>
  </el-menu>
</template>

<script>
export default {
  name: 'NavBar'
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
</style>