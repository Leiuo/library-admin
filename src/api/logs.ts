// 操作日志 API
import { request } from './client'

export const getLogs = () => request<any[]>('/api/logs')
export const addLog = (operator: string, action: string, target: string, detail = '') => request<any>('/api/logs', { method: 'POST', body: JSON.stringify({ operator, action, target, detail }) })
export const clearLogs = () => request('/api/logs', { method: 'DELETE' })
