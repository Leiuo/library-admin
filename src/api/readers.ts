// 读者 API
import { request } from './client'

export const getReaders = () => request<any[]>('/api/readers')
export const addReader = (reader: any) => request<any>('/api/readers', { method: 'POST', body: JSON.stringify(reader) })
export const updateReader = (id: number, data: any) => request<any>(`/api/readers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteReader = (id: number) => request(`/api/readers/${id}`, { method: 'DELETE' })
export const deleteReaders = (ids: number[]) => request('/api/readers/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
export const importReaders = (readerList: any[]) => request('/api/readers/import', { method: 'POST', body: JSON.stringify({ readers: readerList }) })
