import { ref } from 'vue';
import { ElMessage } from 'element-plus';

export const globalError = ref(null);

export function handleGlobalError(error) {
    console.error('Global error:', error);
    if (error.message && error.message.includes('Internal JSON-RPC error')) {
        globalError.value = {
            type: 'rpc',
            message: '当前 RPC 节点可能不稳定，请使用推荐的 RPC 节点以获得更好的体验。'
        };
        ElMessage.error('RPC 错误：请检查您的网络连接或切换到推荐的 RPC 节点');
    } else {
        globalError.value = {
            type: 'general',
            message: error.message
        };
        ElMessage.error(error.message);
    }
}

export function clearGlobalError() {
    globalError.value = null;
}