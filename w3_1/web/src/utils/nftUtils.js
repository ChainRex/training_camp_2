import { ethers } from 'ethers';
import axios from 'axios';
import { getProvider } from './contract';

const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
];

export const getNFTImageUrl = async (nftAddress, tokenId) => {
    try {
        const provider = await getProvider();
        const nftContract = new ethers.Contract(
            nftAddress,
            ['function tokenURI(uint256 tokenId) view returns (string)'],
            provider
        );
        const tokenURI = await nftContract.tokenURI(tokenId);

        for (const gateway of IPFS_GATEWAYS) {
            try {
                const ipfsUrl = tokenURI.replace('ipfs://', gateway);
                const response = await axios.get(ipfsUrl, { timeout: 5000 });
                const metadata = response.data;
                return metadata.image.replace('ipfs://', gateway);
            } catch (error) {
                console.error(`使用网关 ${gateway} 获取失败:`, error);
            }
        }
        throw new Error('所有 IPFS 网关都失败了');
    } catch (error) {
        console.error('获取 NFT 图像 URL 失败:', error);
        return null;
    }
};

export const getTokenInfo = async (tokenAddress) => {
    const provider = await getProvider();
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

export const getNFTName = async (nftAddress) => {
    const provider = await getProvider();
    const nftContract = new ethers.Contract(
        nftAddress,
        ['function name() view returns (string)'],
        provider
    );

    try {
        return await nftContract.name();
    } catch (error) {
        console.error('获取 NFT 名称失败:', error);
        return 'Unknown Collection';
    }
};

export const getNFTTokenIconURI = async (nftAddress) => {
    const provider = await getProvider();
    const nftContract = new ethers.Contract(
        nftAddress,
        ['function tokenIconURI() view returns (string)'],
        provider
    );

    try {
        const tokenIconURI = await nftContract.tokenIconURI();
        return tokenIconURI;
    } catch (error) {
        console.error('获取 NFT tokenIconURI 失败:', error);
        return null;
    }
};

export const getIPFSUrl = (ipfsUri) => {
    if (!ipfsUri) return null;
    for (const gateway of IPFS_GATEWAYS) {
        if (ipfsUri.startsWith('ipfs://')) {
            return ipfsUri.replace('ipfs://', gateway);
        }
    }
    return ipfsUri; // 如果不是 ipfs:// 链接,则返回原始 URI
};