<template>
  <div class="mint-nft-container">
    <h1>铸造 NFT</h1>
    <el-row :gutter="20">
      <el-col :span="12">
        <div class="upload-container">
          <el-upload
            class="avatar-uploader"
            action="#"
            :show-file-list="false"
            :on-change="handleAvatarChange"
            :auto-upload="false"
          >
            <div v-if="imageUrl" class="image-preview">
              <img :src="imageUrl" class="avatar" />
            </div>
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </div>
      </el-col>
      <el-col :span="12">
        <el-form :model="nftForm" label-width="120px">
          <el-form-item label="NFT 合约地址">
            <el-input v-model="nftForm.contractAddress"></el-input>
            <el-button @click="showDeployForm = !showDeployForm" type="text">
              {{ showDeployForm ? '隐藏' : '部署新合约' }}
            </el-button>
          </el-form-item>
          
          <!-- 部署新合约的表单 -->
          <div v-if="showDeployForm" class="deploy-form">
            <el-form-item label="系列名称">
              <el-input v-model="deployForm.name"></el-input>
            </el-form-item>
            <el-form-item label="系列代号">
              <el-input v-model="deployForm.symbol"></el-input>
            </el-form-item>
            <el-form-item label="系列图标">
              <el-upload
                class="avatar-uploader"
                action="#"
                :show-file-list="false"
                :on-change="handleIconChange"
                :auto-upload="false"
              >
                <img v-if="deployForm.iconUrl" :src="deployForm.iconUrl" class="avatar">
                <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="deployNFTContract" :loading="deploying">
                部署合约
              </el-button>
            </el-form-item>
          </div>

          <el-form-item label="名称">
            <el-input v-model="nftForm.title"></el-input>
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="nftForm.description"></el-input>
          </el-form-item>
          <el-form-item label="版本">
            <el-input v-model="nftForm.version"></el-input>
          </el-form-item>
          <el-form-item label="属性">
            <div class="attributes-container">
              <div v-for="(attr, index) in nftForm.attributes" :key="index" class="attribute-item">
                <el-input v-model="attr.trait_type" placeholder="特征类型" class="attribute-input"></el-input>
                <el-input v-model="attr.value" placeholder="值" class="attribute-input"></el-input>
                <el-button @click="removeAttribute(index)" type="danger" circle class="attribute-button">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <el-button @click="addAttribute" type="primary" circle class="attribute-button add-button" style="margin-top: -3px;">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="铸造后创建订单">
            <el-switch v-model="nftForm.createOrder"></el-switch>
          </el-form-item>
          
          <el-form-item v-if="nftForm.createOrder" label="订单价格">
            <el-input v-model="nftForm.orderPrice" type="number" placeholder="请输入订单价格"></el-input>
          </el-form-item>
          
          <el-form-item v-if="nftForm.createOrder" label="支付代币地址">
            <el-input v-model="nftForm.paymentToken" placeholder="请输入支付代币地址"></el-input>
          </el-form-item>
        </el-form>
        <div style="text-align: right;">
          <el-button type="primary" @click="mintNFT">铸造 NFT</el-button>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { PinataSDK } from "pinata-web3";
import { ethers } from 'ethers';
import NFTABI from '../contracts/NFT.json'; // 确保你有这个 ABI 文件
import { initContract, deployNFTContract as deployNewNFTContract, createOrderWithApprove } from '../utils/contract';

export default {
  name: 'MintNFT',
  components: {
    Plus,
    Delete
  },
  setup() {
    const imageUrl = ref('');
    const imageFile = ref(null);
    const nftForm = reactive({
      contractAddress: '',
      title: '',
      description: '',
      version: '',
      attributes: [],
      createOrder: false,
      orderPrice: '',
      paymentToken: ''
    });

    let pinata;

    const showDeployForm = ref(false);
    const deploying = ref(false);
    const deployForm = reactive({
      name: '',
      symbol: '',
      iconUrl: '',
    });

    onMounted(() => {
      console.log('Environment variables:', process.env);
      // 移除环境变量值的前后引号
      const pinataJwt = process.env.VUE_APP_PINATA_JWT.replace(/^['"](.*)['"]$/, '$1');
      if (!pinataJwt) {
        console.error('Pinata JWT is not defined in environment variables');
        ElMessage.error('Pinata configuration is missing. Please check your .env file.');
      } else {
        console.log('Pinata JWT:', pinataJwt.substring(0, 20) + '...'); // 只打印 JWT 的前 20 个字符
        try {
          pinata = new PinataSDK({
            pinataJwt: pinataJwt,
            pinataGateway: "https://gateway.pinata.cloud",
          });
          console.log('Pinata SDK initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Pinata SDK:', error);
          ElMessage.error('Failed to initialize Pinata SDK. Please check your configuration.');
        }
      }
    });

    const handleAvatarChange = async (file) => {
      if (!file) {
        return;
      }
      imageFile.value = file.raw;
      
      try {
        ElMessage.info('开始上传图片到 IPFS...');
        const result = await uploadToIPFS(file.raw);
        console.log('result', result);
        imageUrl.value = result;
        ElMessage.success('图片上传成功！');
      } catch (error) {
        console.error('上传图片失败:', error);
        ElMessage.error('上传图片失败: ' + error.message);
      }
    };

    const uploadToIPFS = async (file) => {
      if (!file) {
        throw new Error('请先选择图片');
      }

      if (!pinata) {
        throw new Error('Pinata SDK is not initialized');
      }

      try {
        console.log('Starting file upload to IPFS...');
        const result = await pinata.upload.file(file);
        console.log('File upload result:', result);
        return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      } catch (error) {
        console.error('Error during file upload:', error);
        throw error;
      }
    };

    const uploadMetadataToIPFS = async (metadata) => {
      if (!pinata) {
        throw new Error('Pinata SDK is not initialized');
      }

      try {
        console.log('Starting metadata upload to IPFS...');
        const result = await pinata.upload.json(metadata);
        console.log('Metadata upload result:', result);
        return `https://gateway.pinata.cloud/ipfs/${result.IpfsHash}`;
      } catch (error) {
        console.error('Error during metadata upload:', error);
        throw error;
      }
    };

    const mintNFT = async () => {
      try {
        if (!imageUrl.value) {
          throw new Error('请先上传图片');
        }

        // 创建元数据
        const metadata = {
          name: nftForm.title,
          description: nftForm.description,
          image: imageUrl.value,
          attributes: nftForm.attributes,
          version: nftForm.version
        };

        // 上传元数据到 IPFS
        const metadataUrl = await uploadMetadataToIPFS(metadata);
        console.log('Metadata URL:', metadataUrl);

        // 调用智能合约铸造 NFT
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        const signer = provider.getSigner();
        const nftContract = new ethers.Contract(nftForm.contractAddress, NFTABI.abi, signer);

        const tx = await nftContract.mint(await signer.getAddress(), metadataUrl);
        ElMessage.success('NFT 铸造交易已提交，等待确认...');
        
        const receipt = await tx.wait();
        
        ElMessage.success('NFT 铸造成功！');

        // 获取铸造的 NFT 的 tokenId
        const mintEvent = receipt.events.find(event => event.event === 'Transfer');
        const tokenId = mintEvent.args.tokenId.toString();

        // 如果用户选择了创建订单，则创建订单
        if (nftForm.createOrder) {
          try {
            await createOrderWithApprove(
              nftForm.contractAddress,
              tokenId,
              nftForm.paymentToken,
              nftForm.orderPrice
            );
            ElMessage.success('订单创建成功');
          } catch (error) {
            console.error('创建订单失败:', error);
            ElMessage.error('创建订单失败: ' + error.message);
          }
        }

        // 重置表单
        nftForm.title = '';
        nftForm.description = '';
        nftForm.version = '';
        nftForm.attributes = [];
        nftForm.createOrder = false;
        nftForm.orderPrice = '';
        nftForm.paymentToken = '';
        imageUrl.value = '';
        imageFile.value = null;

      } catch (error) {
        console.error('铸造 NFT 失败:', error);
        ElMessage.error('铸造 NFT 失败: ' + error.message);
      }
    };

    const addAttribute = () => {
      nftForm.attributes.push({ trait_type: '', value: '' });
    };

    const removeAttribute = (index) => {
      nftForm.attributes.splice(index, 1);
    };

    const handleIconChange = async (file) => {
      if (!file) return;
      try {
        ElMessage.info('开始上传系列图标到 IPFS...');
        const result = await uploadToIPFS(file.raw);
        deployForm.iconUrl = result;
        ElMessage.success('系列图标上传成功！');
      } catch (error) {
        console.error('上传系列图标失败:', error);
        ElMessage.error('上传系列图标失败: ' + error.message);
      }
    };

    const deployNFTContract = async () => {
      if (!deployForm.name || !deployForm.symbol || !deployForm.iconUrl) {
        ElMessage.error('请填写所有必要信息并上传系列图标');
        return;
      }

      deploying.value = true;
      try {
        await initContract(); // 初始化合约
        const newNFTAddress = await deployNewNFTContract(
          deployForm.name,
          deployForm.symbol,
          deployForm.iconUrl
        );

        nftForm.contractAddress = newNFTAddress;
        ElMessage.success(`NFT合约部署成功！地址: ${newNFTAddress}`);
        showDeployForm.value = false;
      } catch (error) {
        console.error('部署NFT合约失败:', error);
        ElMessage.error('部署NFT合约失败: ' + error.message);
      } finally {
        deploying.value = false;
      }
    };

    return {
      imageUrl,
      nftForm,
      handleAvatarChange,
      addAttribute,
      removeAttribute,
      mintNFT,
      showDeployForm,
      deployForm,
      deploying,
      handleIconChange,
      deployNFTContract,
    };
  }
};
</script>

<style scoped>
.mint-nft-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.upload-container {
  width: 100%;
  padding-top: 100%; /* 创建一个正方形容器 */
  position: relative;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  overflow: hidden;
}

.avatar-uploader {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.avatar-uploader .el-upload {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  line-height: 1;
}

.image-preview {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #ffffff;
}

.avatar {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.attribute-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  width: 100%;
}

.attribute-input {
  flex: 1;
  margin-right: 10px;
}

.attribute-button {
  flex-shrink: 0;
}

.add-button {
  margin-left: auto;
  margin-top: 10px;
}

/* 为了确保加号按钮与最后一个属性项对齐 */
.el-form-item:last-child {
  margin-bottom: 0;
}

.deploy-form {
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #ebeef5;
}

/* 为系列图标上传添加特定样式 */
.deploy-form .avatar-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.deploy-form .avatar-uploader .el-upload {
  width: 100%;
  height: 100%;
}

.deploy-form .avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  line-height: 100px;
  text-align: center;
}

.deploy-form .avatar {
  width: 100px;
  height: 100px;
  display: block;
}
</style>