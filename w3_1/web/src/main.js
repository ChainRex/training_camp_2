import { createApp } from 'vue';
import App from './App.vue';
import store from './store';
import { createRouter, createWebHistory } from 'vue-router';
import HomePage from './views/HomePage.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        { path: '/', component: HomePage },
    ],
});

const app = createApp(App);
app.use(store);
app.use(router);
app.mount('#app');