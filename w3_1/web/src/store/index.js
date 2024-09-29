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
        async fetchOrders({ commit }, { force = false } = {}) {
            if (this.state.orders.length > 0 && !force) {
                return this.state.orders;
            }
            const orders = await getOrders();
            commit('setOrders', orders);
            return orders;
        },
        // ... 其他 actions
    },
});