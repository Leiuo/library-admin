// 图书 API
import { request } from './client'

export const getBooks = () => request<any[]>('/api/books')
export const addBook = (book: any) => request<any>('/api/books', { method: 'POST', body: JSON.stringify(book) })
export const updateBook = (id: number, data: any) => request<any>(`/api/books/${id}`, { method: 'PUT', body: JSON.stringify(data) })
export const deleteBook = (id: number) => request(`/api/books/${id}`, { method: 'DELETE' })
export const deleteBooks = (ids: number[]) => request('/api/books/batch-delete', { method: 'POST', body: JSON.stringify({ ids }) })
export const importBooks = (bookList: any[]) => request('/api/books/import', { method: 'POST', body: JSON.stringify({ books: bookList }) })
