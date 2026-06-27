// API 请求封装 —— 统一 fetch + 认证头 + 错误处理

const BASE_URL = '' // MSW 拦截，无需实际服务器

interface ApiResponse<T = any> {
    code: number
    data: T
    message: string
}

async function request<T = any>(url: string, options: RequestInit = {}): Promise<T> {
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

    const json: ApiResponse<T> = await res.json()

    if (json.code !== 200) {
        throw new Error(json.message || '请求失败')
    }

    return json.data
}

export { request }
export type { ApiResponse }
