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

async function bootstrap() {
    // 开发环境启动 MSW 拦截
    if (import.meta.env.DEV) {
        const { worker } = await import('./mocks/browser')
        await worker.start({
            serviceWorker: {
                url: '/library-admin/mockServiceWorker.js',
            },
            onUnhandledRequest: 'bypass', // 未匹配的请求放行
            quiet: true,
        })
        console.log('[MSW] Mock Service Worker 已启动')
    }

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