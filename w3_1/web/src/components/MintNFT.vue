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
            <img v-if="imageUrl" :src="imageUrl" class="avatar" />
            <el-icon v-else class="avatar-uploader-icon"><Plus /></el-icon>
          </el-upload>
        </div>
      </el-col>
      <el-col :span="12">
        <el-form :model="nftForm" label-width="120px">
          <el-form-item label="NFT 合约地址">
            <el-input v-model="nftForm.contractAddress"></el-input>
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="nftForm.title"></el-input>
          </el-form-item>
          <el-form-item label="描述">
            <el-input type="textarea" v-model="nftForm.description"></el-input>
          </el-form-item>
          <el-form-item label="版本">
            <el-input v-model="nftForm.version"></el-input>
          </el-form-item>
          <el-form-item label="属性">
            <div v-for="(attr, index) in nftForm.attributes" :key="index" class="attribute-item">
              <el-input v-model="attr.trait_type" placeholder="特征类型" class="attribute-input"></el-input>
              <el-input v-model="attr.value" placeholder="值" class="attribute-input"></el-input>
              <el-button @click="removeAttribute(index)" type="danger" circle>
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
            <el-button @click="addAttribute" type="primary" circle>
              <el-icon><Plus /></el-icon>
            </el-button>
          </el-form-item>
        </el-form>
        <el-button type="primary" @click="mintNFT">铸造 NFT</el-button>
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
      attributes: []
    });

    let pinata;

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
        
        await tx.wait();
        
        ElMessage.success('NFT 铸造成功！');

        // 重置表单
        nftForm.title = '';
        nftForm.description = '';
        nftForm.version = '';
        nftForm.attributes = [];
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

    return {
      imageUrl,
      nftForm,
      handleAvatarChange,
      addAttribute,
      removeAttribute,
      mintNFT
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
  height: 400px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.avatar {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
}

.attribute-item {
  display: flex;
  margin-bottom: 10px;
}

.attribute-input {
  margin-right: 10px;
}
</style>