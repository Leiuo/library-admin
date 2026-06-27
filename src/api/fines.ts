// 罚款管理 API
import { request } from './client'

export const getPaidFines = () => request<number[]>('/api/fines/paid')
export const payFines = (borrowIds: number[]) => request('/api/fines/pay', { method: 'POST', body: JSON.stringify({ borrowIds }) })
export const undoPayFines = (borrowIds: number[]) => request('/api/fines/undo-pay', { method: 'POST', body: JSON.stringify({ borrowIds }) })
