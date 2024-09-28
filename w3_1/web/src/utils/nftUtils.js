import { ethers } from 'ethers';
import axios from 'axios';

const IPFS_GATEWAYS = [
    'https://gateway.pinata.cloud/ipfs/',
];

export const getNFTImageUrl = async (nftAddress, tokenId) => {
    try {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
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

export const getNFTName = async (nftAddress) => {
    const provider = new ethers.providers.Web3Provider(window.ethereum);
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