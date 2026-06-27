// MSW 请求处理器 —— 拦截 fetch 请求并返回 localStorage 数据
import { http, HttpResponse, delay } from 'msw'
import { initAllData, KEYS } from './data'
import { getData, setData, getObject, setObject, nextId } from './storage'

// 统一响应格式
const ok = (data: any) => HttpResponse.json({ code: 200, data, message: 'ok' })
const fail = (message: string, code = 400) => HttpResponse.json({ code, message }, { status: code })
const serverError = (message: string) => HttpResponse.json({ code: 500, message }, { status: 500 })

// 初始化数据
initAllData()

// ===================== 图书 =====================
export const bookHandlers = [
    http.get('/api/books', async () => {
        await delay()
        return ok(getData(KEYS.BOOKS))
    }),

    http.post('/api/books', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const books = getData(KEYS.BOOKS)
        const newBook = { ...body, id: nextId(books), quantity: body.quantity ?? 1 }
        books.push(newBook)
        setData(KEYS.BOOKS, books)
        return ok(newBook)
    }),

    http.put('/api/books/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const books = getData(KEYS.BOOKS)
        const idx = books.findIndex((b: any) => b.id === id)
        if (idx === -1) return fail('图书不存在')
        books[idx] = { ...books[idx], ...body }
        setData(KEYS.BOOKS, books)
        return ok(books[idx])
    }),

    http.delete('/api/books/:id', async ({ params }) => {
        await delay()
        const id = Number(params.id)
        const borrows = getData(KEYS.BORROWS)
        if (borrows.some((b: any) => b.bookId === id && b.status === 0)) {
            return fail('该书尚有未归还的借阅，不能删除')
        }
        let books = getData(KEYS.BOOKS)
        books = books.filter((b: any) => b.id !== id)
        setData(KEYS.BOOKS, books)
        return ok(null)
    }),

    http.post('/api/books/batch-delete', async ({ request }) => {
        await delay()
        const { ids } = (await request.json()) as any
        const borrows = getData(KEYS.BORROWS)
        const books = getData(KEYS.BOOKS)
        const failed: number[] = []
        ids.forEach((id: number) => {
            if (borrows.some((b: any) => b.bookId === id && b.status === 0)) failed.push(id)
        })
        if (failed.length) {
            const titles = books.filter((b: any) => failed.includes(b.id)).map((b: any) => b.title).join('、')
            return fail(`《${titles}》尚有未归还的借阅，不能删除`)
        }
        setData(KEYS.BOOKS, books.filter((b: any) => !ids.includes(b.id)))
        return ok(ids.length)
    }),

    http.post('/api/books/import', async ({ request }) => {
        await delay()
        const { books: bookList } = (await request.json()) as any
        const books = getData(KEYS.BOOKS)
        let maxId = nextId(books) - 1
        const newBooks = bookList.map((b: any, i: number) => ({
            ...b,
            id: maxId + i + 1,
            quantity: Number(b.quantity) || 0,
        }))
        books.push(...newBooks)
        setData(KEYS.BOOKS, books)
        return ok(newBooks.length)
    }),
]

// ===================== 读者 =====================
export const readerHandlers = [
    http.get('/api/readers', async () => {
        await delay()
        return ok(getData(KEYS.READERS))
    }),

    http.post('/api/readers', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const readers = getData(KEYS.READERS)
        const newReader = { ...body, id: nextId(readers) }
        readers.push(newReader)
        setData(KEYS.READERS, readers)
        return ok(newReader)
    }),

    http.put('/api/readers/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const readers = getData(KEYS.READERS)
        const idx = readers.findIndex((r: any) => r.id === id)
        if (idx === -1) return fail('读者不存在')
        readers[idx] = { ...readers[idx], ...body }
        setData(KEYS.READERS, readers)
        return ok(readers[idx])
    }),

    http.delete('/api/readers/:id', async ({ params }) => {
        await delay()
        const id = Number(params.id)
        const borrows = getData(KEYS.BORROWS)
        if (borrows.some((b: any) => b.readerId === id && b.status === 0)) {
            return fail('该读者有尚未归还的图书，不能删除')
        }
        let readers = getData(KEYS.READERS)
        readers = readers.filter((r: any) => r.id !== id)
        setData(KEYS.READERS, readers)
        return ok(null)
    }),

    http.post('/api/readers/batch-delete', async ({ request }) => {
        await delay()
        const { ids } = (await request.json()) as any
        const borrows = getData(KEYS.BORROWS)
        const readers = getData(KEYS.READERS)
        const failed: number[] = []
        ids.forEach((id: number) => {
            if (borrows.some((b: any) => b.readerId === id && b.status === 0)) failed.push(id)
        })
        if (failed.length) {
            const names = readers.filter((r: any) => failed.includes(r.id)).map((r: any) => r.name).join('、')
            return fail(`${names} 有尚未归还的图书，不能删除`)
        }
        setData(KEYS.READERS, readers.filter((r: any) => !ids.includes(r.id)))
        return ok(ids.length)
    }),

    http.post('/api/readers/import', async ({ request }) => {
        await delay()
        const { readers: readerList } = (await request.json()) as any
        const readers = getData(KEYS.READERS)
        let maxId = nextId(readers) - 1
        const newReaders = readerList.map((r: any, i: number) => ({ ...r, id: maxId + i + 1 }))
        readers.push(...newReaders)
        setData(KEYS.READERS, readers)
        return ok(newReaders.length)
    }),
]

// ===================== 借阅 =====================
export const borrowHandlers = [
    http.get('/api/borrows', async () => {
        await delay()
        const borrows = getData(KEYS.BORROWS)
        const books = getData(KEYS.BOOKS)
        const readers = getData(KEYS.READERS)
        const matched = borrows.map((borrow: any) => ({
            ...borrow,
            bookTitle: books.find((b: any) => b.id === borrow.bookId)?.title || '未知',
            readerName: readers.find((r: any) => r.id === borrow.readerId)?.name || '未知',
            readerCard: readers.find((r: any) => r.id === borrow.readerId)?.cardNo || '',
        }))
        return ok(matched)
    }),

    http.post('/api/borrows/return/:id', async ({ params }) => {
        await delay()
        const id = Number(params.id)
        const borrows = getData(KEYS.BORROWS)
        const idx = borrows.findIndex((b: any) => b.id === id)
        if (idx === -1) return fail('借阅记录不存在')
        if (borrows[idx].status === 1) return fail('该图书已归还')
        borrows[idx].status = 1
        borrows[idx].returnDate = new Date().toISOString().split('T')[0]
        setData(KEYS.BORROWS, borrows)

        const books = getData(KEYS.BOOKS)
        const book = books.find((b: any) => b.id === borrows[idx].bookId)
        if (book) {
            book.quantity += 1
            setData(KEYS.BOOKS, books)
        }
        return ok(null)
    }),

    http.post('/api/borrows', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const { bookId, readerId, borrowDate, dueDate } = body

        const books = getData(KEYS.BOOKS)
        const book = books.find((b: any) => b.id === bookId)
        if (!book) return fail('图书不存在')
        if (book.quantity === 0) return fail('图书已被借完，无法借出')

        const readers = getData(KEYS.READERS)
        if (!readers.find((r: any) => r.id === readerId)) return fail('读者不存在')

        const borrows = getData(KEYS.BORROWS)
        const newBorrow = { id: nextId(borrows), bookId, readerId, borrowDate, dueDate, returnDate: null, status: 0 }
        borrows.push(newBorrow)
        setData(KEYS.BORROWS, borrows)
        book.quantity -= 1
        setData(KEYS.BOOKS, books)
        return ok(newBorrow)
    }),

    http.put('/api/borrows/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const { bookId, readerId, borrowDate, dueDate, status: newStatus } = body

        let borrows = getData(KEYS.BORROWS)
        const idx = borrows.findIndex((b: any) => b.id === id)
        if (idx === -1) return fail('借阅记录不存在')

        const oldBorrow = borrows[idx]
        let books = getData(KEYS.BOOKS)

        if (oldBorrow.bookId !== bookId) {
            const oldBook = books.find((b: any) => b.id === oldBorrow.bookId)
            const newBook = books.find((b: any) => b.id === bookId)
            if (!newBook) return fail('图书不存在')
            if (oldBorrow.status === 0) {
                if (newBook.quantity === 0 && newBook.id !== oldBorrow.bookId) {
                    return fail('该图书已被借完，无法借出')
                }
                if (oldBook) oldBook.quantity += 1
                newBook.quantity -= 1
            }
        }

        if (oldBorrow.status === 0 && newStatus === 1) {
            const book = books.find((b: any) => b.id === bookId)
            if (book) book.quantity += 1
            borrows[idx].returnDate = new Date().toISOString().split('T')[0]
        } else if (oldBorrow.status === 1 && newStatus === 0) {
            const book = books.find((b: any) => b.id === bookId)
            if (book && book.quantity === 0) return fail('该图书已被借完，无法重新借出')
            if (book) book.quantity -= 1
            borrows[idx].returnDate = null
        }

        setData(KEYS.BOOKS, books)
        borrows[idx] = { ...oldBorrow, bookId, readerId, borrowDate, dueDate, status: newStatus ?? oldBorrow.status }
        setData(KEYS.BORROWS, borrows)
        return ok(borrows[idx])
    }),

    http.post('/api/borrows/batch-delete', async ({ request }) => {
        await delay()
        const { ids } = (await request.json()) as any
        let borrows = getData(KEYS.BORROWS)
        const books = getData(KEYS.BOOKS)
        ids.forEach((id: number) => {
            const borrow = borrows.find((b: any) => b.id === id)
            if (borrow && borrow.status === 0) {
                const book = books.find((b: any) => b.id === borrow.bookId)
                if (book) book.quantity += 1
            }
        })
        setData(KEYS.BOOKS, books)
        borrows = borrows.filter((b: any) => !ids.includes(b.id))
        setData(KEYS.BORROWS, borrows)
        return ok(ids.length)
    }),
]

// ===================== 分类 =====================
export const categoryHandlers = [
    http.get('/api/categories', async () => {
        await delay()
        const categories = getData(KEYS.CATEGORIES)
        const books = getData(KEYS.BOOKS)
        const directCount: Record<number, number> = {}
        categories.forEach((cat: any) => {
            directCount[cat.id] = books.filter((b: any) => b.category === cat.name).length
        })
        const getDescendantIds = (parentId: number): number[] => {
            const children = categories.filter((c: any) => c.parentId === parentId)
            return children.reduce((acc: number[], c: any) => acc.concat(c.id, getDescendantIds(c.id)), [])
        }
        return ok(categories.map((cat: any) => {
            const allIds = [cat.id, ...getDescendantIds(cat.id)]
            const totalCount = allIds.reduce((sum, id) => sum + (directCount[id] || 0), 0)
            return { ...cat, parentId: cat.parentId ?? null, bookCount: totalCount }
        }))
    }),

    http.post('/api/categories', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const categories = getData(KEYS.CATEGORIES)
        if (categories.some((c: any) => c.name === body.name)) return fail('该分类名称已存在')
        if (body.parentId != null && !categories.some((c: any) => c.id === body.parentId)) return fail('父分类不存在')
        const newCat = { ...body, parentId: body.parentId ?? null, id: nextId(categories) }
        categories.push(newCat)
        setData(KEYS.CATEGORIES, categories)
        return ok(newCat)
    }),

    http.put('/api/categories/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const categories = getData(KEYS.CATEGORIES)
        const idx = categories.findIndex((c: any) => c.id === id)
        if (idx === -1) return fail('分类不存在')
        if (body.name && body.name !== categories[idx].name && categories.some((c: any) => c.name === body.name)) {
            return fail('该分类名称已存在')
        }
        if (body.parentId !== undefined && body.parentId != null) {
            if (body.parentId === id) return fail('不能将自己设为父分类')
            const getDescendantIds = (pid: number): number[] => {
                const children = categories.filter((c: any) => c.parentId === pid)
                return children.reduce((acc: number[], c: any) => acc.concat(c.id, getDescendantIds(c.id)), [])
            }
            if (getDescendantIds(id).includes(body.parentId)) return fail('不能将子分类设为父分类')
        }
        const oldName = categories[idx].name
        categories[idx] = { ...categories[idx], ...body }
        setData(KEYS.CATEGORIES, categories)

        if (body.name && body.name !== oldName) {
            const books = getData(KEYS.BOOKS)
            books.forEach((b: any) => { if (b.category === oldName) b.category = body.name })
            setData(KEYS.BOOKS, books)
        }
        return ok(categories[idx])
    }),

    http.delete('/api/categories/:id', async ({ params }) => {
        await delay()
        const id = Number(params.id)
        const categories = getData(KEYS.CATEGORIES)
        const target = categories.find((c: any) => c.id === id)
        if (!target) return fail('分类不存在')
        if (categories.some((c: any) => c.parentId === id)) return fail('该分类下有子分类，请先删除子分类')
        const books = getData(KEYS.BOOKS)
        if (books.some((b: any) => b.category === target.name)) {
            return fail(`该分类下有 ${books.filter((b: any) => b.category === target.name).length} 本图书，不能删除`)
        }
        setData(KEYS.CATEGORIES, categories.filter((c: any) => c.id !== id))
        return ok(null)
    }),

    http.post('/api/categories/batch-delete', async ({ request }) => {
        await delay()
        const { ids } = (await request.json()) as any
        const categories = getData(KEYS.CATEGORIES)
        const books = getData(KEYS.BOOKS)
        const failedNames: string[] = []
        ids.forEach((id: number) => {
            const cat = categories.find((c: any) => c.id === id)
            if (!cat) return
            if (categories.some((c: any) => c.parentId === id)) failedNames.push(`${cat.name}(有子分类)`)
            else if (books.some((b: any) => b.category === cat.name)) failedNames.push(cat.name)
        })
        if (failedNames.length) return fail(`分类"${failedNames.join('、')}"下尚有图书或子分类，不能删除`)
        setData(KEYS.CATEGORIES, categories.filter((c: any) => !ids.includes(c.id)))
        return ok(ids.length)
    }),
]

// ===================== 管理员 & 认证 =====================
export const adminHandlers = [
    http.get('/api/admins', async () => {
        await delay()
        return ok(getData(KEYS.ADMINS).map((a: any) => ({ ...a, password: '********' })))
    }),

    http.post('/api/admins', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const admins = getData(KEYS.ADMINS)
        if (admins.some((a: any) => a.username === body.username)) return fail('该用户名已存在')
        const newAdmin = { ...body, id: nextId(admins), createdAt: new Date().toISOString().split('T')[0] }
        admins.push(newAdmin)
        setData(KEYS.ADMINS, admins)
        return ok({ ...newAdmin, password: '********' })
    }),

    http.put('/api/admins/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const admins = getData(KEYS.ADMINS)
        const idx = admins.findIndex((a: any) => a.id === id)
        if (idx === -1) return fail('管理员不存在')
        if (body.username && body.username !== admins[idx].username && admins.some((a: any) => a.username === body.username)) {
            return fail('该用户名已存在')
        }
        admins[idx] = { ...admins[idx], ...body }
        setData(KEYS.ADMINS, admins)
        return ok({ ...admins[idx], password: '********' })
    }),

    http.delete('/api/admins/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const url = new URL(request.url)
        const currentUsername = url.searchParams.get('currentUsername') || ''
        const admins = getData(KEYS.ADMINS)
        if (admins.length <= 1) return fail('至少保留一个管理员账号')
        const target = admins.find((a: any) => a.id === id)
        if (!target) return fail('管理员不存在')
        if (target.username === currentUsername) return fail('不能删除自己')
        setData(KEYS.ADMINS, admins.filter((a: any) => a.id !== id))
        return ok(null)
    }),

    http.post('/api/auth/login', async ({ request }) => {
        await delay(500)
        const { username, password } = (await request.json()) as any
        const admins = getData(KEYS.ADMINS)
        const admin = admins.find((a: any) => a.username === username && a.password === password)
        if (!admin) return fail('用户名或密码错误', 401)
        const token = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).slice(2)
        return ok({ id: admin.id, username: admin.username, role: admin.role, token })
    }),
]

// ===================== 系统设置 =====================
export const settingsHandlers = [
    http.get('/api/settings', async () => {
        await delay()
        return ok(getObject(KEYS.SETTINGS) || {})
    }),

    http.put('/api/settings', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        setObject(KEYS.SETTINGS, body)
        return ok(body)
    }),
]

// ===================== 通知公告 =====================
export const announcementHandlers = [
    http.get('/api/announcements', async () => {
        await delay()
        return ok(getData(KEYS.ANNOUNCEMENTS))
    }),

    http.post('/api/announcements', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const list = getData(KEYS.ANNOUNCEMENTS)
        const item = { ...body, id: nextId(list) }
        list.push(item)
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(item)
    }),

    http.put('/api/announcements/:id', async ({ params, request }) => {
        await delay()
        const id = Number(params.id)
        const body: any = await request.json()
        const list = getData(KEYS.ANNOUNCEMENTS)
        const idx = list.findIndex((a: any) => a.id === id)
        if (idx === -1) return fail('公告不存在')
        list[idx] = { ...list[idx], ...body }
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(list[idx])
    }),

    http.post('/api/announcements/batch-delete', async ({ request }) => {
        await delay()
        const { ids } = (await request.json()) as any
        let list = getData(KEYS.ANNOUNCEMENTS)
        list = list.filter((a: any) => !ids.includes(a.id))
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(ids.length)
    }),
]

// 单独处理删除（因为 DELETE 需要 id 参数）
export const announcementDeleteHandler = http.delete('/api/announcements/:id', async ({ params }) => {
    await delay()
    const id = Number(params.id)
    let list = getData(KEYS.ANNOUNCEMENTS)
    list = list.filter((a: any) => a.id !== id)
    setData(KEYS.ANNOUNCEMENTS, list)
    return ok(null)
})

// ===================== 操作日志 =====================
export const logHandlers = [
    http.get('/api/logs', async () => {
        await delay()
        return ok(getData(KEYS.LOGS))
    }),

    http.post('/api/logs', async ({ request }) => {
        await delay()
        const body: any = await request.json()
        const logs = getData(KEYS.LOGS)
        const newLog = {
            ...body,
            id: nextId(logs),
            time: new Date().toLocaleString('zh-CN', { hour12: false }),
        }
        logs.push(newLog)
        setData(KEYS.LOGS, logs)
        return ok(newLog)
    }),

    http.delete('/api/logs', async () => {
        await delay()
        setData(KEYS.LOGS, [])
        return ok(null)
    }),
]

// ===================== 罚款管理 =====================
export const fineHandlers = [
    http.get('/api/fines/paid', async () => {
        await delay()
        return ok(getData(KEYS.FINE_PAID))
    }),

    http.post('/api/fines/pay', async ({ request }) => {
        await delay()
        const { borrowIds } = (await request.json()) as any
        const paid = getData(KEYS.FINE_PAID)
        borrowIds.forEach((id: number) => { if (!paid.includes(id)) paid.push(id) })
        setData(KEYS.FINE_PAID, paid)
        return ok(null)
    }),

    http.post('/api/fines/undo-pay', async ({ request }) => {
        await delay()
        const { borrowIds } = (await request.json()) as any
        let paid = getData(KEYS.FINE_PAID)
        paid = paid.filter((id: number) => !borrowIds.includes(id))
        setData(KEYS.FINE_PAID, paid)
        return ok(null)
    }),
]

// 汇总所有 handlers
export const handlers = [
    ...bookHandlers,
    ...readerHandlers,
    ...borrowHandlers,
    ...categoryHandlers,
    ...adminHandlers,
    ...settingsHandlers,
    ...announcementHandlers,
    announcementDeleteHandler,
    ...logHandlers,
    ...fineHandlers,
]
