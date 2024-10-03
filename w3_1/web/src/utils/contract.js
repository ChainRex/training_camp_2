import { ethers } from 'ethers';
import contractAddress from '../contracts/NFTMarket-address.json';
import contractABI from '../contracts/NFTMarket-abi.json';

const address = contractAddress.address;
const abi = contractABI.abi;

let provider;
let signer;
let contract;

const FALLBACK_RPC_URL = "https://polygon-amoy.g.alchemy.com/v2/oUhC0fClZFJKJ09zzWsqj65EFq3X01y0";

// 缓存的 provider 实例
let cachedProvider = null;

export async function getProvider() {
    console.log(cachedProvider);
    if (cachedProvider) {
        return cachedProvider;
    }

    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const network = await provider.getNetwork();
        if (network.chainId === 80002) {
            cachedProvider = provider;
            return cachedProvider;
        }
    }

    cachedProvider = new ethers.providers.JsonRpcProvider(FALLBACK_RPC_URL);
    return cachedProvider;
}

export async function initContract() {
    try {
        provider = await getProvider();
        contract = new ethers.Contract(address, abi, provider);
        return contract;
    } catch (error) {
        console.error('合约初始化失败:', error);
        throw error;
    }
}

export async function createOrder(nft, tokenId, token, price) {
    if (!contract) await initContract();
    if (!signer) throw new Error('需要连接钱包来创建订单');
    const tx = await contract.createOrder(nft, tokenId, token, ethers.utils.parseEther(price));
    await tx.wait();
}

export async function cancelOrder(orderId) {
    if (!contract) await initContract();
    if (!signer) throw new Error('需要连接钱包来取消订单');

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
    if (!signer) throw new Error('需要连接钱包来购买 NFT');
    const tx = await contract.buyNFT(index, deadline, v, r, s);
    await tx.wait();
}

export async function getOrders() {
    if (!contract) await initContract();

    console.log('合约地址:', contract.address);

    try {
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
    if (!signer) throw new Error('需要连接钱包来创建订单');

    const nftContract = new ethers.Contract(nft, [
        'function approve(address to, uint256 tokenId) public',
        'function getApproved(uint256 tokenId) public view returns (address)'
    ], signer);

    const approvedAddress = await nftContract.getApproved(tokenId);

    if (approvedAddress !== address) {
        console.log('正在授权 NFT...');
        const approveTx = await nftContract.approve(address, tokenId);
        await approveTx.wait();
        console.log('NFT 已授权');
    }

    console.log('正在创建订单...');
    const priceInWei = ethers.utils.parseUnits(price, 18);
    const createOrderTx = await contract.createOrder(nft, tokenId, token, priceInWei);
    await createOrderTx.wait();
    console.log('订单已创建');
}

export async function deployNFTContract(name, symbol, tokenIconURI) {
    if (!contract) await initContract();
    if (!signer) throw new Error('需要连接钱包来部署 NFT 合约');
    const tx = await contract.deployNFTContract(name, symbol, tokenIconURI);
    const receipt = await tx.wait();
    const deployedEvent = receipt.events.find(e => e.event === 'NFTContractDeployed');
    return deployedEvent.args.nftAddress;
}

export function clearProviderCache() {
    cachedProvider = null;
}