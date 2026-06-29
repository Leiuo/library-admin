// API 请求封装 —— 统一 fetch + 认证头 + 错误处理

const BASE_URL = '' // MSW 拦截，无需实际服务器

interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

// 等待 MSW Service Worker 就绪（最长等待 3 秒）
async function waitForMSW(): Promise<boolean> {
    if (navigator.serviceWorker?.controller) return true

    // SW 尚未控制页面，等待 registration
    const registration = await navigator.serviceWorker?.getRegistration()
    if (!registration?.active) {
        // 尝试等待 SW 激活
        const sw = registration?.waiting || registration?.installing
        if (!sw) return false
    }

    // 等待 controllerchange 事件（最多 3 秒）
    return new Promise((resolve) => {
        const timeout = setTimeout(() => resolve(false), 3000)
        navigator.serviceWorker.addEventListener('controllerchange', () => {
            clearTimeout(timeout)
            resolve(true)
        }, { once: true })
        // 如果已经有 controller，立即返回
        if (navigator.serviceWorker.controller) {
            clearTimeout(timeout)
            resolve(true)
        }
    })
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
    const contentType = res.headers.get('content-type') || ''
    if (!contentType.includes('application/json')) {
        if (retryOnSWLoss && !navigator.serviceWorker?.controller) {
            // SW 丢失，等待恢复后重试一次
            console.warn('[API] 检测到 Service Worker 丢失，等待恢复后重试...')
            const recovered = await waitForMSW()
            if (recovered) {
                return request<T>(url, options, false) // 只重试一次，防止死循环
            }
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
