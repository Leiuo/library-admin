// API 请求封装 —— 统一 fetch + 认证头 + 错误处理

const BASE_URL = '' // MSW 拦截，无需实际服务器

interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

async function request<T = any>(url: string, options: RequestInit = {}, retryOnSWLoss = true): Promise<T> {
    const token = localStorage.getItem('admin_token') || ''

    const res = await fetch(`${BASE_URL}${url}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...options.headers,
        },
        body: options.body ?? undefined,
    })

    // 检测非 JSON 响应（MSW 未拦截时 GitHub Pages 返回 HTML 404 页面）
    // 注意：休眠唤醒后 navigator.serviceWorker.controller 可能仍是非 null 的过期引用，
    // 所以不能依赖它来判断 SW 是否存活，这里无条件重试一次
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
        if (retryOnSWLoss) {
            console.warn('[API] 响应非 JSON（MSW 可能未拦截），等待 500ms 后重试...')
            await new Promise(r => setTimeout(r, 500))
            return request<T>(url, options, false) // 只重试一次，防止死循环
        }
        throw new Error('服务连接异常：Mock Service Worker 未运行，请刷新页面后重试')
    }

    const json: ApiResponse<T> = await res.json()

    if (json.code !== 200) {
        throw new Error(json.message || '请求失败')
    }

    return json.data
}

export { request }
export type { ApiResponse }
