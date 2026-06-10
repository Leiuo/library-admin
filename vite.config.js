import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vite.dev/config/
export default defineConfig({
    plugins: [vue()],
    base: process.env.VERCEL ? '/' : '/library-admin/',
    server: {
        port: 3000,
        open: true
    }
})
