import { createRouter, createWebHistory } from 'vue-router'
import HomePage from '../views/HomePage.vue'
import NFTCollectionDetail from '../components/NFTCollectionDetail.vue'
import NFTDetail from '../components/NFTDetail.vue'
import CreateOrder from '../views/CreateOrder.vue'

const routes = [
    {
        path: '/',
        name: 'Home',
        component: HomePage
    },
    {
        path: '/collection/:address',
        name: 'CollectionDetail',
        component: NFTCollectionDetail
    },
    {
        path: '/nft/:collectionAddress/:tokenId',
        name: 'NFTDetail',
        component: NFTDetail
    },
    {
        path: '/create-order',
        name: 'CreateOrder',
        component: CreateOrder
    }
]

const router = createRouter({
    history: createWebHistory(process.env.BASE_URL),
    routes
})

export default router