// 系统设置 API
import { request } from './client'

export const getSettings = () => request<any>('/api/settings')
export const saveSettings = (settings: any) => request<any>('/api/settings', { method: 'PUT', body: JSON.stringify(settings) })
