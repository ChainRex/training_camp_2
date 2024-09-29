<template>
  <el-menu mode="horizontal" router class="nav-menu">
    <el-menu-item index="/" class="logo-item">
      <img src="../assets/opensea-logo.svg" alt="OpenSea Logo" class="logo-image" />
      <span class="logo-text">NFTMarket</span>
    </el-menu-item>
    <el-menu-item index="/create-order">
      <el-icon><Document /></el-icon>
      创建订单
    </el-menu-item>
    <el-menu-item index="/mint-nft">
      <el-icon><Plus /></el-icon>
      铸造 NFT
    </el-menu-item>
  </el-menu>
</template>

<script>
import { Document, Plus } from '@element-plus/icons-vue'

export default {
  name: 'NavBar',
  components: {
    Document,
    Plus
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
</style>