import { createApp } from 'vue'
// import './style.css'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import 'element-plus/theme-chalk/dark/css-vars.css'
import router from './router/index.js'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import zhCn from 'element-plus/es/locale/lang/zh-cn' // 引入中文语言包
import App from './App.vue'

let worker = null

async function startMSW() {
    // 启动 MSW（开发 & 生产均启用，拦截所有 /api/* 请求）
    const { worker: mswWorker } = await import('./mocks/browser')
    worker = mswWorker
    await worker.start({
        serviceWorker: {
            url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
        },
        onUnhandledRequest: 'bypass',
        quiet: true,
    })
    console.log('[MSW] Mock Service Worker 已启动')
}

// 检查 Service Worker 是否仍在控制页面（休眠唤醒后 SW 可能已被浏览器终止）
function isSWActive() {
    return !!navigator.serviceWorker.controller
}

// 页面可见性变化时（如休眠唤醒），检查并恢复 MSW
async function handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
        if (!isSWActive()) {
            console.warn('[MSW] Service Worker 已丢失（可能因休眠/挂起），正在重新注册...')
            try {
                await startMSW()
                console.log('[MSW] Service Worker 恢复成功')
            } catch (e) {
                console.error('[MSW] Service Worker 恢复失败，请刷新页面', e)
            }
        }
    }
}

async function bootstrap() {
    await startMSW()

    // 监听页面可见性变化，处理休眠唤醒后 SW 丢失的问题
    document.addEventListener('visibilitychange', handleVisibilityChange)

    const app = createApp(App)
    for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
        app.component(key, component)
    }
    const pinia = createPinia()
    app.use(pinia)
    app.use(router)
    app.use(ElementPlus, { locale: zhCn }) // Element Plus 全局设置为中文
    app.mount('#app')
}

bootstrap()