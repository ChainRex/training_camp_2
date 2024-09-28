import { createStore } from 'vuex';
import { getOrders } from '../utils/contract';

export default createStore({
    state: {
        orders: [],
    },
    mutations: {
        setOrders(state, orders) {
            state.orders = orders;
        },
    },
    actions: {
        async fetchOrders({ commit }) {
            try {
                const orders = await getOrders();
                commit('setOrders', orders);
                return orders;  // 确保返回订单数组
            } catch (error) {
                console.error('获取订单失败:', error);
                throw error;
            }
        },
    },
});