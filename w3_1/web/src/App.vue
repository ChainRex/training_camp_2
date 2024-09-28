<template>
  <el-container class="layout-container">
    <el-header>
      <el-menu mode="horizontal" router>
        <el-menu-item index="/" class="logo">
          <img src="@/assets/opensea-logo.svg" alt="Logo" class="logo-image">
          NFTMarket
        </el-menu-item>
      </el-menu>
    </el-header>
    <el-main>
      <router-view></router-view>
    </el-main>
  </el-container>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
@import "element-plus/dist/index.css";

.layout-container {
  min-height: 100vh;
}

.el-header {
  padding: 0;
}

.logo {
  font-size: 1.5em;
  font-weight: bold;
}

.logo-image {
  height: 30px;
  margin-right: 10px;
}
</style>