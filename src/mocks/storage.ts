// localStorage 读写工具 + 模拟网络延迟

/** 模拟网络延迟 200-600ms */
export const delay = (ms?: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms ?? 200 + Math.random() * 400))

/** 读取 localStorage */
export function getData<T = any>(key: string): T[] {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
        return [] as T[]
    }
}

/** 写入 localStorage */
export function setData<T = any>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data))
}

/** 读单个对象 */
export function getObject<T = any>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key)
        return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}

/** 写单个对象 */
export function setObject<T = any>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data))
}

/** 生成新 ID */
export function nextId<T extends { id: number }>(list: T[]): number {
    return list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1
}
