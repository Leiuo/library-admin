// 借阅 API
import { request } from './client'

export const getBorrows = () => request<any[]>('/api/borrows')
export const addBorrow = (bookId: number, readerId: number, borrowDate: string, dueDate: string) => request<any>('/api/borrows', { method: 'POST', body: JSON.stringify({ bookId, readerId, borrowDate, dueDate }) })
export const updateBorrow = (id: number, bookId: number, readerId: number, borrowDate: string, dueDate: string, status: number) => request<any>(`/api/borrows/${id}`, { method: 'PUT', body: JSON.stringify({ bookId, readerId, borrowDate, dueDate, status }) })
export const returnBook = (borrowId: number) => request(`/api/borrows/return/${borrowId}`, { method: 'POST' })
export const deleteBorrows = (ids: number[]) => request('/api/borrows/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
