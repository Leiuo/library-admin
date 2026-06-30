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
let mswRestarting = false // 防止并发重启

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

// 页面可见性变化时（如休眠唤醒），无条件重新注册 MSW
// 注意：休眠后 navigator.serviceWorker.controller 可能返回过期引用，
// 不能依赖它判断 SW 是否存活，所以直接重启
async function handleVisibilityChange() {
    if (document.visibilityState !== 'visible') return
    if (mswRestarting) return

    mswRestarting = true
    try {
        // 先尝试通过 getRegistration 获取真实的注册状态
        const reg = await navigator.serviceWorker?.getRegistration()
        if (reg) {
            // 强制更新 SW（浏览器会重新激活被终止的 SW）
            await reg.update()
            console.log('[MSW] Service Worker 已更新（休眠恢复）')
        } else {
            // 注册完全丢失，重新启动 MSW
            console.warn('[MSW] Service Worker 注册丢失，正在重新注册...')
            await startMSW()
            console.log('[MSW] Service Worker 恢复成功')
        }
    } catch (e) {
        console.warn('[MSW] 休眠恢复时 SW 更新失败，尝试完全重启...', e)
        try {
            await startMSW()
            console.log('[MSW] Service Worker 重启成功')
        } catch (e2) {
            console.error('[MSW] Service Worker 恢复失败，请刷新页面', e2)
        }
    } finally {
        mswRestarting = false
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