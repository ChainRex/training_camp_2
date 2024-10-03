import { createStore } from 'vuex';
import { getOrders, initContract } from '../utils/contract';
import { ethers } from 'ethers';

export default createStore({
    state: {
        isWalletConnected: false,
        currentUserAddress: '',
        orders: [],
    },
    mutations: {
        setOrders(state, orders) {
            state.orders = orders;
        },
        setWalletConnection(state, isConnected) {
            state.isWalletConnected = isConnected;
        },
        setCurrentUserAddress(state, address) {
            state.currentUserAddress = address;
        },
    },
    actions: {
        async fetchOrders({ commit }, { force = false } = {}) {
            if (this.state.orders.length > 0 && !force) {
                return this.state.orders;
            }
            const orders = await getOrders();
            commit('setOrders', orders);
            return orders;
        },
        async checkWalletConnection({ commit }) {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const accounts = await provider.listAccounts();
                    if (accounts.length > 0) {
                        commit('setWalletConnection', true);
                        commit('setCurrentUserAddress', accounts[0]);
                        await initContract(true);
                        return true;
                    }
                } catch (error) {
                    console.error('检查钱包连接失败:', error);
                }
            }
            commit('setWalletConnection', false);
            commit('setCurrentUserAddress', '');
            return false;
        },
        async connectWallet({ commit }) {
            if (typeof window.ethereum !== 'undefined') {
                try {
                    await window.ethereum.request({ method: 'eth_requestAccounts' });
                    const provider = new ethers.providers.Web3Provider(window.ethereum);
                    const signer = provider.getSigner();
                    const address = await signer.getAddress();
                    commit('setWalletConnection', true);
                    commit('setCurrentUserAddress', address);
                    await initContract(true);
                    return true;
                } catch (error) {
                    console.error('连接钱包失败:', error);
                    return false;
                }
            } else {
                console.error('未检测到 MetaMask');
                return false;
            }
        },
        disconnectWallet({ commit }) {
            commit('setWalletConnection', false);
            commit('setCurrentUserAddress', '');
            console.log('已在应用中退出登录');
        },
    },
});