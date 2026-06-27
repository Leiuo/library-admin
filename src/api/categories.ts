// 分类 API
import { request } from './client'

export const getCategories = () => request<any[]>('/api/categories')
export const addCategory = (category: any) => request<any>('/api/categories', { method: 'POST', body: JSON.stringify(category) })
export const updateCategory = (id: number, data: any) => request<any>(`/api/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteCategory = (id: number) => request(`/api/categories/${id}`, { method: 'DELETE' })
export const deleteCategories = (ids: number[]) => request('/api/categories/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
