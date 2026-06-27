// 认证 & 管理员 API
import { request } from './client'

export const verifyLogin = (username: string, password: string) =>
    request<{ id: number; username: string; role: string; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
    })

export const getAdmins = () => request<any[]>('/api/admins')
export const addAdmin = (admin: any) => request<any>('/api/admins', { method: 'POST', body: JSON.stringify(admin) })
export const updateAdmin = (id: number, data: any) => request<any>(`/api/admins/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteAdmin = (id: number, currentUsername: string) => request(`/api/admins/${id}?currentUsername=${encodeURIComponent(currentUsername)}`, { method: 'DELETE' })
