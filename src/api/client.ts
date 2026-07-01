// API 请求封装 —— 基于 axios + mock 拦截器（无 Service Worker 依赖）
import axios from 'axios'
import { installMockInterceptor } from './mock'

const http = axios.create({
    baseURL: '',
    timeout: 10000,
})

// 安装 mock 拦截器（拦截所有 /api/* 请求直接返回 localStorage 数据）
installMockInterceptor(http)

// 添加认证头拦截器
http.interceptors.request.use((config) => {
    const token = localStorage.getItem('admin_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// 响应拦截器 —— 统一解包 { code, data, message }
http.interceptors.response.use(
    (response) => {
        const json = response.data
        if (json.code !== 200) {
            throw new Error(json.message || '请求失败')
        }
        return json.data
    },
    (error) => {
        // mock 拦截器抛出的错误（非 2xx 响应）
        if (error.response?.data) {
            const json = error.response.data
            throw new Error(json.message || '请求失败')
        }
        throw new Error(error.message || '网络错误')
    }
)

// 保持与原 fetch 版本兼容的函数签名
async function request<T = any>(url: string, options?: { method?: string; body?: string; headers?: Record<string, string> }): Promise<T> {
    const method = options?.method || 'GET'
    const data = options?.body ? JSON.parse(options.body) : undefined
    const headers = options?.headers || {}

    const response = await http.request({ url, method, data, headers })
    return response as T
}

export { request, http }
export type ApiResponse<T = any> = { code: number; data: T; message: string }
