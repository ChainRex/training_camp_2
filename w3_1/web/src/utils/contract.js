import { ethers } from 'ethers';
import contractAddress from '../contracts/NFTMarket-address.json';
import contractABI from '../contracts/NFTMarket-abi.json';

const address = contractAddress.address;
const abi = contractABI.abi;

let provider;
let signer;
let contract;

export async function initContract() {
    if (typeof window.ethereum !== 'undefined') {
        provider = new ethers.providers.Web3Provider(window.ethereum);

        // 检查网络
        const network = await provider.getNetwork();
        console.log('当前网络:', network);

        if (network.chainId !== 80002) {
            console.error('请切换到 Polygon Mumbai 测试网');
            throw new Error('错误的网络');
        }

        await provider.send("eth_requestAccounts", []);
        signer = provider.getSigner();
        contract = new ethers.Contract(address, abi, signer);

        console.log('合约初始化完成');
    } else {
        console.error('请安装MetaMask!');
        throw new Error('未检测到 MetaMask');
    }
}

export async function createOrder(nft, tokenId, token, price) {
    if (!contract) await initContract();
    const tx = await contract.createOrder(nft, tokenId, token, ethers.utils.parseEther(price));
    await tx.wait();
}

export async function cancelOrder(orderId) {
    if (!contract) await initContract();

    try {
        console.log('正在取消订单...');
        const tx = await contract.cancelOrder(orderId);
        await tx.wait();
        console.log('订单已成功取消');
        return true;
    } catch (error) {
        console.error('取消订单失败:', error);
        throw error;
    }
}

export async function buyNFT(index, deadline, v, r, s) {
    if (!contract) await initContract();
    const tx = await contract.buyNFT(index, deadline, v, r, s);
    await tx.wait();
}

export async function getOrders() {
    if (!contract) await initContract();

    console.log('合约地址:', contract.address);

    try {
        // 使用新的 getOrders 方法
        const orders = await contract.getOrders();
        console.log('获取到的订单:', orders);
        return orders;
    } catch (error) {
        console.error('获取订单时出错:', error);
        throw error;
    }
}

export async function createOrderWithApprove(nft, tokenId, token, price) {
    if (!contract) await initContract();

    // 创建 NFT 合约实例
    const nftContract = new ethers.Contract(nft, [
        'function approve(address to, uint256 tokenId) public',
        'function getApproved(uint256 tokenId) public view returns (address)'
    ], signer);

    // 检查是否已经授权
    const approvedAddress = await nftContract.getApproved(tokenId);

    if (approvedAddress !== address) {
        // 如果未授权，先进行授权
        console.log('正在授权 NFT...');
        const approveTx = await nftContract.approve(address, tokenId);
        await approveTx.wait();
        console.log('NFT 已授权');
    }

    // 创建订单
    console.log('正在创建订单...');
    const priceInWei = ethers.utils.parseUnits(price, 18);
    const createOrderTx = await contract.createOrder(nft, tokenId, token, priceInWei);
    await createOrderTx.wait();
    console.log('订单已创建');
}