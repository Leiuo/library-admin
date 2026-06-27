// 通知公告 API
import { request } from './client'

export const getAnnouncements = () => request<any[]>('/api/announcements')
export const addAnnouncement = (data: any) => request<any>('/api/announcements', { method: 'POST', body: JSON.stringify(data) })
export const updateAnnouncement = (id: number, data: any) => request<any>(`/api/announcements/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAnnouncement = (id: number) => request(`/api/announcements/${id}`, { method: 'DELETE' })
export const deleteAnnouncements = (ids: number[]) => request('/api/announcements/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
