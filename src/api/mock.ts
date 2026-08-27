// ============================================================
// Mock 后端 —— 使用 axios 拦截器模拟所有 /api/* 接口
// 数据持久化到 localStorage，无 Service Worker 依赖
// ============================================================
import type { AxiosRequestConfig, AxiosResponse } from 'axios'

// -------------------- localStorage 工具 --------------------
const delay = (ms?: number) =>
    new Promise<void>((resolve) => setTimeout(resolve, ms ?? 200 + Math.random() * 400))

function getData<T = any>(key: string): T[] {
    try {
        return JSON.parse(localStorage.getItem(key) || '[]')
    } catch {
        return [] as T[]
    }
}
function setData<T = any>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data))
}
function getObject<T = any>(key: string): T | null {
    try {
        const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null
    } catch {
        return null
    }
}
function setObject<T = any>(key: string, data: T): void {
    localStorage.setItem(key, JSON.stringify(data))
}
function nextId<T extends { id: number }>(list: T[]): number {
    return list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1
}

// -------------------- 响应格式 --------------------
const ok = (data: any) => ({
    status: 200,
    data: {
        code: 200,
        data,
        message: 'ok'
    }
})
const fail = (message: string, status = 400) => ({
    status,
    data: {
        code: status,
        message
    }
})

// -------------------- Storage Keys --------------------
const KEYS = {
    BOOKS: 'library_books',
    READERS: 'library_readers',
    BORROWS: 'library_borrows',
    SETTINGS: 'library_settings',
    ADMINS: 'library_admins',
    CATEGORIES: 'library_categories',
    ANNOUNCEMENTS: 'library_announcements',
    LOGS: 'library_logs',
    FINE_PAID: 'library_fine_paid',
}

// -------------------- 种子数据初始化 --------------------
function initAllData() {
    // ---- 图书 ----
    if (!localStorage.getItem(KEYS.BOOKS)) {
        setData(KEYS.BOOKS, [
            { id: 1, title: 'JavaScript 高级程序设计（第4版）', author: 'Matt Frisbie', isbn: '978-7-115-54564-7', publisher: '人民邮电出版社', category: '前端开发', publishYear: 2020, quantity: 8 },
            { id: 2, title: 'Vue.js 设计与实现', author: '霍春阳', isbn: '978-7-115-57946-9', publisher: '人民邮电出版社', category: '前端开发', publishYear: 2022, quantity: 6 },
            { id: 3, title: 'CSS 揭秘', author: 'Lea Verou', isbn: '978-7-115-41694-0', publisher: '人民邮电出版社', category: '前端开发', publishYear: 2016, quantity: 5 },
            { id: 4, title: '深入理解 ES6', author: 'Nicholas C. Zakas', isbn: '978-7-121-28463-1', publisher: '电子工业出版社', category: '前端开发', publishYear: 2017, quantity: 6 },
            { id: 5, title: 'React 设计原理', author: '卡颂', isbn: '978-7-121-45890-3', publisher: '电子工业出版社', category: '前端开发', publishYear: 2023, quantity: 4 },
            { id: 6, title: '深入理解 Java 虚拟机（第3版）', author: '周志明', isbn: '978-7-111-64164-3', publisher: '机械工业出版社', category: '后端开发', publishYear: 2019, quantity: 7 },
            { id: 7, title: '高性能 MySQL（第4版）', author: 'Silvia Botros', isbn: '978-7-121-43524-1', publisher: '电子工业出版社', category: '后端开发', publishYear: 2022, quantity: 5 },
            { id: 8, title: 'Go 语言高级编程', author: '柴树杉', isbn: '978-7-111-61728-6', publisher: '机械工业出版社', category: '后端开发', publishYear: 2019, quantity: 6 },
            { id: 9, title: 'Python 核心编程（第3版）', author: 'Wesley Chun', isbn: '978-7-115-42125-8', publisher: '人民邮电出版社', category: '后端开发', publishYear: 2016, quantity: 5 },
            { id: 10, title: '深度学习', author: 'Ian Goodfellow', isbn: '978-7-115-46147-6', publisher: '人民邮电出版社', category: '人工智能', publishYear: 2017, quantity: 4 },
            { id: 11, title: '动手学深度学习（PyTorch 版）', author: 'Aston Zhang', isbn: '978-7-115-61232-1', publisher: '人民邮电出版社', category: '人工智能', publishYear: 2023, quantity: 6 },
            { id: 12, title: '活着', author: '余华', isbn: '978-7-5302-2153-3', publisher: '北京十月文艺出版社', category: '中国文学', publishYear: 2017, quantity: 10 },
            { id: 13, title: '三体', author: '刘慈欣', isbn: '978-7-5366-9396-0', publisher: '重庆出版社', category: '中国文学', publishYear: 2008, quantity: 8 },
            { id: 14, title: '红楼梦', author: '曹雪芹', isbn: '978-7-02-000220-7', publisher: '人民文学出版社', category: '中国文学', publishYear: 1996, quantity: 6 },
            { id: 15, title: '围城', author: '钱锺书', isbn: '978-7-02-007078-5', publisher: '人民文学出版社', category: '中国文学', publishYear: 1991, quantity: 7 },
            { id: 16, title: '百年孤独', author: '加西亚·马尔克斯', isbn: '978-7-5442-5911-6', publisher: '南海出版公司', category: '外国文学', publishYear: 2011, quantity: 8 },
            { id: 17, title: '挪威的森林', author: '村上春树', isbn: '978-7-5327-4292-9', publisher: '上海译文出版社', category: '外国文学', publishYear: 2007, quantity: 6 },
            { id: 18, title: '杀死一只知更鸟', author: 'Harper Lee', isbn: '978-7-5447-6272-3', publisher: '译林出版社', category: '外国文学', publishYear: 2017, quantity: 5 },
            { id: 19, title: '万历十五年', author: '黄仁宇', isbn: '978-7-101-05749-2', publisher: '中华书局', category: '中国历史', publishYear: 2007, quantity: 6 },
            { id: 20, title: '明朝那些事儿', author: '当年明月', isbn: '978-7-213-04633-1', publisher: '浙江人民出版社', category: '中国历史', publishYear: 2009, quantity: 9 },
            { id: 21, title: '苏菲的世界', author: 'Jostein Gaarder', isbn: '978-7-5063-9303-4', publisher: '作家出版社', category: '西方哲学', publishYear: 2017, quantity: 5 },
            { id: 22, title: '存在与时间', author: '海德格尔', isbn: '978-7-100-12017-3', publisher: '商务印书馆', category: '西方哲学', publishYear: 2016, quantity: 3 },
            { id: 23, title: '时间简史', author: 'Stephen Hawking', isbn: '978-7-5357-8742-2', publisher: '湖南科学技术出版社', category: '科学科普', publishYear: 2010, quantity: 6 },
            { id: 24, title: '上帝掷骰子吗？', author: '曹天元', isbn: '978-7-5596-1079-7', publisher: '北京联合出版公司', category: '科学科普', publishYear: 2019, quantity: 7 },
            { id: 25, title: '经济学原理：微观经济学分册', author: 'N. Gregory Mankiw', isbn: '978-7-301-25088-7', publisher: '北京大学出版社', category: '经济管理', publishYear: 2015, quantity: 6 },
            { id: 26, title: '从零开始做运营', author: '张亮', isbn: '978-7-5086-6393-8', publisher: '中信出版社', category: '经济管理', publishYear: 2018, quantity: 5 },
            { id: 27, title: '写给大家看的设计书（第4版）', author: 'Robin Williams', isbn: '978-7-115-40440-9', publisher: '人民邮电出版社', category: '艺术设计', publishYear: 2016, quantity: 6 },
            { id: 28, title: '设计的觉醒', author: '田中一光', isbn: '978-7-5633-8940-0', publisher: '广西师范大学出版社', category: '艺术设计', publishYear: 2009, quantity: 4 },
            { id: 29, title: '如何阅读一本书', author: 'Mortimer J. Adler', isbn: '978-7-100-10618-3', publisher: '商务印书馆', category: '教育学习', publishYear: 2014, quantity: 7 },
            { id: 30, title: '断舍离', author: '山下英子', isbn: '978-7-80763-780-6', publisher: '广西科学技术出版社', category: '生活百科', publishYear: 2013, quantity: 5 },
        ])
    }
    // ---- 读者 ----
    if (!localStorage.getItem(KEYS.READERS)) {
        setData(KEYS.READERS, [
            { id: 1, cardNo: 'R2024001', name: '张明远', email: 'mingyuan@example.com', phone: '13812345601', registeredAt: '2024-01-15' },
            { id: 2, cardNo: 'R2024002', name: '李晓芳', email: 'xiaofang@example.com', phone: '13812345602', registeredAt: '2024-02-20' },
            { id: 3, cardNo: 'R2024003', name: '王建国', email: 'jianguo@example.com', phone: '13812345603', registeredAt: '2024-03-10' },
            { id: 4, cardNo: 'R2024004', name: '陈思雨', email: 'siyu@example.com', phone: '13812345604', registeredAt: '2024-04-05' },
            { id: 5, cardNo: 'R2024005', name: '赵子涵', email: 'zihan@example.com', phone: '13812345605', registeredAt: '2024-04-18' },
            { id: 6, cardNo: 'R2024006', name: '孙浩然', email: 'haoran@example.com', phone: '13812345606', registeredAt: '2024-05-22' },
            { id: 7, cardNo: 'R2024007', name: '周雨桐', email: 'yutong@example.com', phone: '13812345607', registeredAt: '2024-06-08' },
            { id: 8, cardNo: 'R2024008', name: '吴天宇', email: 'tianyu@example.com', phone: '13812345608', registeredAt: '2024-07-14' },
            { id: 9, cardNo: 'R2024009', name: '郑诗涵', email: 'shihan@example.com', phone: '13812345609', registeredAt: '2024-08-30' },
            { id: 10, cardNo: 'R2024010', name: '钱一鸣', email: 'yiming@example.com', phone: '13812345610', registeredAt: '2024-09-15' },
            { id: 11, cardNo: 'R2024011', name: '沈嘉禾', email: 'jiahe@example.com', phone: '13812345611', registeredAt: '2024-10-01' },
            { id: 12, cardNo: 'R2024012', name: '韩雨萱', email: 'yuxuan@example.com', phone: '13812345612', registeredAt: '2024-10-28' },
            { id: 13, cardNo: 'R2024013', name: '杨启航', email: 'qihang@example.com', phone: '13812345613', registeredAt: '2024-11-11' },
            { id: 14, cardNo: 'R2024014', name: '朱晓晨', email: 'xiaochen@example.com', phone: '13812345614', registeredAt: '2024-12-03' },
            { id: 15, cardNo: 'R2024015', name: '马思远', email: 'siyuan@example.com', phone: '13812345615', registeredAt: '2025-01-07' },
            { id: 16, cardNo: 'R2024016', name: '刘心怡', email: 'xinyi@example.com', phone: '13812345616', registeredAt: '2025-02-14' },
            { id: 17, cardNo: 'R2024017', name: '黄子轩', email: 'zixuan@example.com', phone: '13812345617', registeredAt: '2025-03-20' },
            { id: 18, cardNo: 'R2024018', name: '林若溪', email: 'ruoxi@example.com', phone: '13812345618', registeredAt: '2025-04-08' },
            { id: 19, cardNo: 'R2024019', name: '何俊杰', email: 'junjie@example.com', phone: '13812345619', registeredAt: '2025-05-16' },
            { id: 20, cardNo: 'R2024020', name: '顾慧妍', email: 'huiyan@example.com', phone: '13812345620', registeredAt: '2025-06-01' },
        ])
    }
    // ---- 借阅 ----
    if (!localStorage.getItem(KEYS.BORROWS)) {
        setData(KEYS.BORROWS, [
            { id: 1, bookId: 3, readerId: 1, borrowDate: '2025-04-01', dueDate: '2025-04-15', returnDate: '2025-04-13', status: 1 },
            { id: 2, bookId: 1, readerId: 2, borrowDate: '2025-04-10', dueDate: '2025-04-24', returnDate: '2025-04-22', status: 1 },
            { id: 3, bookId: 4, readerId: 3, borrowDate: '2025-05-12', dueDate: '2025-05-19', returnDate: '2025-05-20', status: 1 },
            { id: 4, bookId: 12, readerId: 4, borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: '2025-06-10', status: 1 },
            { id: 5, bookId: 16, readerId: 5, borrowDate: '2025-06-05', dueDate: '2025-06-19', returnDate: '2025-06-18', status: 1 },
            { id: 6, bookId: 23, readerId: 6, borrowDate: '2025-06-10', dueDate: '2025-06-24', returnDate: '2025-06-24', status: 1 },
            { id: 7, bookId: 1, readerId: 7, borrowDate: '2025-06-15', dueDate: '2025-06-20', returnDate: '2025-06-19', status: 1 },
            { id: 8, bookId: 13, readerId: 8, borrowDate: '2025-06-20', dueDate: '2025-06-22', returnDate: null, status: 0 },
            { id: 9, bookId: 19, readerId: 9, borrowDate: '2025-06-22', dueDate: '2025-06-25', returnDate: null, status: 0 },
            { id: 10, bookId: 25, readerId: 10, borrowDate: '2025-06-23', dueDate: '2025-06-30', returnDate: null, status: 0 },
            { id: 11, bookId: 2, readerId: 11, borrowDate: '2025-06-24', dueDate: '2025-06-20', returnDate: null, status: 0 },
            { id: 12, bookId: 14, readerId: 12, borrowDate: '2025-06-25', dueDate: '2025-07-02', returnDate: null, status: 0 },
            { id: 13, bookId: 7, readerId: 13, borrowDate: '2025-05-01', dueDate: '2025-05-15', returnDate: '2025-05-12', status: 1 },
            { id: 14, bookId: 10, readerId: 14, borrowDate: '2025-05-08', dueDate: '2025-05-22', returnDate: '2025-05-25', status: 1 },
            { id: 15, bookId: 15, readerId: 15, borrowDate: '2025-05-15', dueDate: '2025-05-29', returnDate: '2025-06-01', status: 1 },
            { id: 16, bookId: 20, readerId: 16, borrowDate: '2025-05-20', dueDate: '2025-06-03', returnDate: '2025-06-02', status: 1 },
            { id: 17, bookId: 22, readerId: 17, borrowDate: '2025-06-01', dueDate: '2025-06-15', returnDate: '2025-06-16', status: 1 },
            { id: 18, bookId: 27, readerId: 18, borrowDate: '2025-06-05', dueDate: '2025-06-19', returnDate: '2025-06-17', status: 1 },
            { id: 19, bookId: 6, readerId: 19, borrowDate: '2025-06-08', dueDate: '2025-06-22', returnDate: null, status: 0 },
            { id: 20, bookId: 29, readerId: 20, borrowDate: '2025-06-10', dueDate: '2025-06-24', returnDate: '2025-06-23', status: 1 },
        ])
    }
    // ---- 分类 ----
    if (!localStorage.getItem(KEYS.CATEGORIES)) {
        setData(KEYS.CATEGORIES, [
            { id: 1, name: '文学小说', description: '中外文学名著及畅销小说', parentId: null },
            { id: 2, name: '中国文学', description: '中国古典及现当代文学', parentId: 1 },
            { id: 3, name: '外国文学', description: '外国经典及现代文学', parentId: 1 },
            { id: 4, name: '科技编程', description: '计算机科学与编程技术书籍', parentId: null },
            { id: 5, name: '前端开发', description: 'HTML/CSS/JavaScript/框架', parentId: 4 },
            { id: 6, name: '后端开发', description: '服务端语言与数据库技术', parentId: 4 },
            { id: 7, name: '人工智能', description: '机器学习与深度学习', parentId: 4 },
            { id: 8, name: '历史哲学', description: '历史研究与哲学思想著作', parentId: null },
            { id: 9, name: '中国历史', description: '中国古代及近现代历史', parentId: 8 },
            { id: 10, name: '西方哲学', description: '西方哲学思想与流派', parentId: 8 },
            { id: 11, name: '科学科普', description: '自然科学与科普读物', parentId: null },
            { id: 12, name: '经济管理', description: '经济学与管理学书籍', parentId: null },
            { id: 13, name: '艺术设计', description: '绘画、设计、音乐等艺术类', parentId: null },
            { id: 14, name: '教育学习', description: '教材教辅与学习参考书', parentId: null },
            { id: 15, name: '生活百科', description: '生活常识、健康养生等', parentId: null },
        ])
    }
    // ---- 管理员 ----
    if (!localStorage.getItem(KEYS.ADMINS)) {
        setData(KEYS.ADMINS, [
            { id: 1, username: 'admin', password: '123456', role: 'super', createdAt: '2024-01-01' },
            { id: 2, username: 'librarian', password: '123456', role: 'admin', createdAt: '2024-03-15' },
            { id: 3, username: 'LEI', password: 'qiuyue@080701', role: 'super', createdAt: '2024-06-01' },
        ])
    }
    // ---- 设置 ----
    if (!localStorage.getItem(KEYS.SETTINGS)) {
        setObject(KEYS.SETTINGS, {
            libraryName: '新华图书馆管理系统', libraryAddress: '北京市海淀区中关村南大街 5 号',
            libraryPhone: '010-62551234', openingHours: '周一至周五 8:00-21:00 / 周末 9:00-18:00',
            maxBorrowBooks: 5, borrowDuration: 30, renewalLimit: 2, overdueFinePerDay: 0.5,
        })
    }
    // ---- 公告 ----
    const now = new Date()
    const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    if (!localStorage.getItem(KEYS.ANNOUNCEMENTS)) {
        setData(KEYS.ANNOUNCEMENTS, [
            { id: 1, title: '欢迎使用新华图书馆管理系统', content: '系统已正式上线运行，各位管理员可进行图书借阅、读者管理等日常操作。如有问题请联系系统管理员。', priority: 'important', publishDate: '2024-01-01', publisher: '超级管理员' },
            { id: 2, title: '端午节开闭馆时间调整通知', content: '端午节期间（6月8日至6月10日），图书馆开放时间调整为 9:00-17:00，6月11日起恢复正常。', priority: 'urgent', publishDate: fmt(now), publisher: '超级管理员' },
            { id: 3, title: '六月新书上架公告', content: '本月新增科技编程类图书 5 本、文学小说类 3 本、历史哲学类 2 本，欢迎读者前来借阅。', priority: 'normal', publishDate: fmt(now), publisher: '超级管理员' },
        ])
    }
}

// -------------------- URL 路径解析 --------------------
function matchPath(pattern: string, url: string): Record<string, string> | null {
    const patternParts = pattern.split('/')
    const urlParts = url.split('/')
    if (patternParts.length !== urlParts.length) return null
    const params: Record<string, string> = {}
    for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
            params[patternParts[i].slice(1)] = urlParts[i]
        } else if (patternParts[i] !== urlParts[i]) {
            return null
        }
    }
    return params
}

// -------------------- Mock 路由处理器 --------------------
async function handleMockRequest(config: AxiosRequestConfig): Promise<{ status: number; data: any }> {
    await delay()

    const method = (config.method || 'GET').toUpperCase()
    const url = config.url || ''
    const body = typeof config.data === 'string' ? JSON.parse(config.data || '{}') : (config.data || {})

    // 解析 URL 中的查询参数
    const queryIndex = url.indexOf('?')
    const path = queryIndex >= 0 ? url.slice(0, queryIndex) : url
    const queryString = queryIndex >= 0 ? url.slice(queryIndex + 1) : ''
    const queryParams: Record<string, string> = {}
    queryString.split('&').filter(Boolean).forEach(pair => {
        const [k, v] = pair.split('=')
        queryParams[k] = decodeURIComponent(v || '')
    })

    // ==================== 认证 ====================
    if (path === '/api/auth/login' && method === 'POST') {
        const admins = getData(KEYS.ADMINS)
        const admin = admins.find((a: any) => a.username === body.username && a.password === body.password)
        if (!admin) return fail('用户名或密码错误', 401)
        const token = 'mock_token_' + Date.now() + '_' + Math.random().toString(36).slice(2)
        return ok({
            id: admin.id,
            username: admin.username,
            role: admin.role,
            token
        })
    }

    // ==================== 图书 ====================
    if (path === '/api/books' && method === 'GET') return ok(getData(KEYS.BOOKS))
    if (path === '/api/books' && method === 'POST') {
        const books = getData(KEYS.BOOKS)
        const newBook = { ...body, id: nextId(books), quantity: body.quantity ?? 1 }
        books.push(newBook); setData(KEYS.BOOKS, books); return ok(newBook)
    }
    if (path === '/api/books/import' && method === 'POST') {
        const books = getData(KEYS.BOOKS)
        let maxId = nextId(books) - 1
        const newBooks = (body.books || []).map((b: any, i: number) => ({ ...b, id: maxId + i + 1, quantity: Number(b.quantity) || 0 }))
        books.push(...newBooks); setData(KEYS.BOOKS, books); return ok(newBooks.length)
    }
    if (path === '/api/books/batch-delete' && method === 'POST') {
        const ids: number[] = body.ids || []
        const borrows = getData(KEYS.BORROWS)
        const books = getData(KEYS.BOOKS)
        const failed: number[] = []
        ids.forEach(id => {
            if (borrows.some((b: any) => b.bookId === id && b.status === 0)) failed.push(id)
        })
        if (failed.length) {
            const titles = books.filter((b: any) => failed.includes(b.id)).map((b: any) => b.title).join('、')
            return fail(`《${titles}》尚有未归还的借阅，不能删除`)
        }
        setData(KEYS.BOOKS, books.filter((b: any) => !ids.includes(b.id)))
        return ok(ids.length)
    }

    const bookMatch = matchPath('/api/books/:id', path)
    if (bookMatch && method === 'PUT') {
        const id = Number(bookMatch.id)
        const books = getData(KEYS.BOOKS)
        const idx = books.findIndex((b: any) => b.id === id)
        if (idx === -1) return fail('图书不存在')
        books[idx] = { ...books[idx], ...body }
        setData(KEYS.BOOKS, books)
        return ok(books[idx])
    }
    if (bookMatch && method === 'DELETE') {
        const id = Number(bookMatch.id)
        const borrows = getData(KEYS.BORROWS)
        if (borrows.some((b: any) => b.bookId === id && b.status === 0)) return fail('该书尚有未归还的借阅，不能删除')
        let books = getData(KEYS.BOOKS)
        books = books.filter((b: any) => b.id !== id)
        setData(KEYS.BOOKS, books)
        return ok(null)
    }

    // ==================== 读者 ====================
    if (path === '/api/readers' && method === 'GET') return ok(getData(KEYS.READERS))
    if (path === '/api/readers' && method === 'POST') {
        const readers = getData(KEYS.READERS)
        const newReader = { ...body, id: nextId(readers) }
        readers.push(newReader)
        setData(KEYS.READERS, readers)
        return ok(newReader)
    }
    if (path === '/api/readers/import' && method === 'POST') {
        const readers = getData(KEYS.READERS)
        let maxId = nextId(readers) - 1
        const newReaders = (body.readers || []).map((r: any, i: number) => ({ ...r, id: maxId + i + 1 }))
        readers.push(...newReaders)
        setData(KEYS.READERS, readers)
        return ok(newReaders.length)
    }
    if (path === '/api/readers/batch-delete' && method === 'POST') {
        const ids: number[] = body.ids || []
        const borrows = getData(KEYS.BORROWS)
        const readers = getData(KEYS.READERS)
        const failed: number[] = []
        ids.forEach(id => { if (borrows.some((b: any) => b.readerId === id && b.status === 0)) failed.push(id) })
        if (failed.length) {
            const names = readers.filter((r: any) => failed.includes(r.id)).map((r: any) => r.name).join('、')
            return fail(`${names} 有尚未归还的图书，不能删除`)
        }
        setData(KEYS.READERS, readers.filter((r: any) => !ids.includes(r.id)))
        return ok(ids.length)
    }

    const readerMatch = matchPath('/api/readers/:id', path)
    if (readerMatch && method === 'PUT') {
        const id = Number(readerMatch.id)
        const readers = getData(KEYS.READERS)
        const idx = readers.findIndex((r: any) => r.id === id)
        if (idx === -1) return fail('读者不存在')
        readers[idx] = { ...readers[idx], ...body }
        setData(KEYS.READERS, readers)
        return ok(readers[idx])
    }
    if (readerMatch && method === 'DELETE') {
        const id = Number(readerMatch.id)
        const borrows = getData(KEYS.BORROWS)
        if (borrows.some((b: any) => b.readerId === id && b.status === 0)) return fail('该读者有尚未归还的图书，不能删除')
        let readers = getData(KEYS.READERS)
        readers = readers.filter((r: any) => r.id !== id)
        setData(KEYS.READERS, readers)
        return ok(null)
    }

    // ==================== 借阅 ====================
    if (path === '/api/borrows' && method === 'GET') {
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
    }
    if (path === '/api/borrows' && method === 'POST') {
        const { bookId, readerId, borrowDate, dueDate } = body
        const books = getData(KEYS.BOOKS)
        const book = books.find((b: any) => b.id === bookId)
        if (!book) return fail('图书不存在')
        if (book.quantity === 0) return fail('图书已被借完，无法借出')
        const readers = getData(KEYS.READERS)
        if (!readers.find((r: any) => r.id === readerId)) return fail('读者不存在')
        const borrows = getData(KEYS.BORROWS)
        const newBorrow = {
            id: nextId(borrows),
            bookId,
            readerId,
            borrowDate,
            dueDate,
            returnDate: null,
            status: 0
        }
        borrows.push(newBorrow)
        setData(KEYS.BORROWS, borrows)
        book.quantity -= 1
        setData(KEYS.BOOKS, books)
        return ok(newBorrow)
    }
    if (path === '/api/borrows/batch-delete' && method === 'POST') {
        const ids: number[] = body.ids || []
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
    }

    const borrowReturnMatch = matchPath('/api/borrows/return/:id', path)
    if (borrowReturnMatch && method === 'POST') {
        const id = Number(borrowReturnMatch.id)
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
            book.quantity += 1;
            setData(KEYS.BOOKS, books)
        }
        return ok(null)
    }

    const borrowMatch = matchPath('/api/borrows/:id', path)
    if (borrowMatch && method === 'PUT') {
        const id = Number(borrowMatch.id)
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
                if (newBook.quantity === 0 && newBook.id !== oldBorrow.bookId) return fail('该图书已被借完，无法借出')
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
        borrows[idx] = {
            ...oldBorrow,
            bookId,
            readerId,
            borrowDate,
            dueDate,
            status: newStatus ?? oldBorrow.status
        }
        setData(KEYS.BORROWS, borrows)
        return ok(borrows[idx])
    }

    // ==================== 分类 ====================
    if (path === '/api/categories' && method === 'GET') {
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
            return {
                ...cat,
                parentId: cat.parentId ?? null,
                bookCount: totalCount
            }
        }))
    }
    if (path === '/api/categories' && method === 'POST') {
        const categories = getData(KEYS.CATEGORIES)
        if (categories.some((c: any) => c.name === body.name)) return fail('该分类名称已存在')
        if (body.parentId != null && !categories.some((c: any) => c.id === body.parentId)) return fail('父分类不存在')
        const newCat = {
            ...body,
            parentId: body.parentId ?? null,
            id: nextId(categories)
        }
        categories.push(newCat)
        setData(KEYS.CATEGORIES, categories)
        return ok(newCat)
    }
    if (path === '/api/categories/batch-delete' && method === 'POST') {
        const ids: number[] = body.ids || []
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
    }

    const categoryMatch = matchPath('/api/categories/:id', path)
    if (categoryMatch && method === 'PUT') {
        const id = Number(categoryMatch.id)
        const categories = getData(KEYS.CATEGORIES)
        const idx = categories.findIndex((c: any) => c.id === id)
        if (idx === -1) return fail('分类不存在')
        if (body.name && body.name !== categories[idx].name && categories.some((c: any) => c.name === body.name)) return fail('该分类名称已存在')
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
            books.forEach((b: any) => {
                if (b.category === oldName) b.category = body.name
            })
            setData(KEYS.BOOKS, books)
        }
        return ok(categories[idx])
    }
    if (categoryMatch && method === 'DELETE') {
        const id = Number(categoryMatch.id)
        const categories = getData(KEYS.CATEGORIES)
        const target = categories.find((c: any) => c.id === id)
        if (!target) return fail('分类不存在')
        if (categories.some((c: any) => c.parentId === id)) return fail('该分类下有子分类，请先删除子分类')
        const books = getData(KEYS.BOOKS)
        if (books.some((b: any) => b.category === target.name)) return fail(`该分类下有 ${books.filter((b: any) => b.category === target.name).length} 本图书，不能删除`)
        setData(KEYS.CATEGORIES, categories.filter((c: any) => c.id !== id))
        return ok(null)
    }

    // ==================== 管理员 ====================
    if (path === '/api/admins' && method === 'GET') return ok(getData(KEYS.ADMINS).map((a: any) => ({ ...a, password: '********' })))
    if (path === '/api/admins' && method === 'POST') {
        const admins = getData(KEYS.ADMINS)
        if (admins.some((a: any) => a.username === body.username)) return fail('该用户名已存在')
        const newAdmin = { ...body, id: nextId(admins), createdAt: new Date().toISOString().split('T')[0] }
        admins.push(newAdmin); setData(KEYS.ADMINS, admins)
        return ok({
            ...newAdmin,
            password: '********'
        })
    }

    const adminMatch = matchPath('/api/admins/:id', path)
    if (adminMatch && method === 'PUT') {
        const id = Number(adminMatch.id)
        const admins = getData(KEYS.ADMINS)
        const idx = admins.findIndex((a: any) => a.id === id)
        if (idx === -1) return fail('管理员不存在')
        if (body.username && body.username !== admins[idx].username && admins.some((a: any) => a.username === body.username)) return fail('该用户名已存在')
        admins[idx] = { ...admins[idx], ...body }
        setData(KEYS.ADMINS, admins)
        return ok({
            ...admins[idx],
            password: '********'
        })
    }
    if (adminMatch && method === 'DELETE') {
        const id = Number(adminMatch.id)
        const currentUsername = queryParams.currentUsername || ''
        const admins = getData(KEYS.ADMINS)
        if (admins.length <= 1) return fail('至少保留一个管理员账号')
        const target = admins.find((a: any) => a.id === id)
        if (!target) return fail('管理员不存在')
        if (target.username === currentUsername) return fail('不能删除自己')
        setData(KEYS.ADMINS, admins.filter((a: any) => a.id !== id))
        return ok(null)
    }

    // ==================== 设置 ====================
    if (path === '/api/settings' && method === 'GET') return ok(getObject(KEYS.SETTINGS) || {})
    if (path === '/api/settings' && method === 'PUT') {
        setObject(KEYS.SETTINGS, body);
        return ok(body)
    }

    // ==================== 公告 ====================
    if (path === '/api/announcements' && method === 'GET') return ok(getData(KEYS.ANNOUNCEMENTS))
    if (path === '/api/announcements' && method === 'POST') {
        const list = getData(KEYS.ANNOUNCEMENTS)
        const item = {
            ...body,
            id: nextId(list)
        }
        list.push(item)
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(item)
    }
    if (path === '/api/announcements/batch-delete' && method === 'POST') {
        const ids: number[] = body.ids || []
        let list = getData(KEYS.ANNOUNCEMENTS)
        list = list.filter((a: any) => !ids.includes(a.id))
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(ids.length)
    }

    const announcementMatch = matchPath('/api/announcements/:id', path)
    if (announcementMatch && method === 'PUT') {
        const id = Number(announcementMatch.id)
        const list = getData(KEYS.ANNOUNCEMENTS)
        const idx = list.findIndex((a: any) => a.id === id)
        if (idx === -1) return fail('公告不存在')
        list[idx] = {
            ...list[idx],
            ...body
        }
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(list[idx])
    }
    if (announcementMatch && method === 'DELETE') {
        const id = Number(announcementMatch.id)
        let list = getData(KEYS.ANNOUNCEMENTS)
        list = list.filter((a: any) => a.id !== id)
        setData(KEYS.ANNOUNCEMENTS, list)
        return ok(null)
    }

    // ==================== 日志 ====================
    if (path === '/api/logs' && method === 'GET') return ok(getData(KEYS.LOGS))
    if (path === '/api/logs' && method === 'POST') {
        const logs = getData(KEYS.LOGS)
        const newLog = {
            ...body,
            id: nextId(logs),
            time: new Date().toLocaleString('zh-CN', { hour12: false })
        }
        logs.push(newLog)
        setData(KEYS.LOGS, logs)
        return ok(newLog)
    }
    if (path === '/api/logs' && method === 'DELETE') {
        setData(KEYS.LOGS, []);
        return ok(null)
    }

    // ==================== 罚款 ====================
    if (path === '/api/fines/paid' && method === 'GET') return ok(getData(KEYS.FINE_PAID))
    if (path === '/api/fines/pay' && method === 'POST') {
        const { borrowIds } = body
        const paid = getData(KEYS.FINE_PAID)
        borrowIds.forEach((id: number) => { if (!paid.includes(id)) paid.push(id) })
        setData(KEYS.FINE_PAID, paid)
        return ok(null)
    }
    if (path === '/api/fines/undo-pay' && method === 'POST') {
        const { borrowIds } = body
        let paid = getData(KEYS.FINE_PAID)
        paid = paid.filter((id: number) => !borrowIds.includes(id))
        setData(KEYS.FINE_PAID, paid)
        return ok(null)
    }

    // 未匹配的路由
    return {
        status: 404,
        data: {
            code: 404,
            message: `接口不存在: ${method} ${path}`
        }
    }
}

// -------------------- 导出 axios 拦截器安装函数 --------------------
export function installMockInterceptor(axiosInstance: any) {
    // 初始化种子数据
    initAllData()

    // 使用请求拦截器拦截所有 /api/* 请求，直接返回 mock 数据
    axiosInstance.interceptors.request.use(
        async (config: AxiosRequestConfig) => {
            const url = config.url || ''
            if (url.startsWith('/api/')) {
                const result = await handleMockRequest(config)
                // 用 adapter 短路请求，返回 mock 响应
                const mockResponse: AxiosResponse = {
                    data: result.data,
                    status: result.status,
                    statusText: result.status === 200 ? 'OK' : 'Error',
                    headers: { 'content-type': 'application/json' },
                    config,
                    request: {},
                }
                // 如果 mock 返回非 2xx，视为错误
                if (result.status >= 400) {
                    return Promise.reject({
                        response: mockResponse,
                        message: result.data?.message || '请求失败',
                    })
                }
                // 短路：直接 resolve mock 响应，不发真实请求
                config.adapter = () => Promise.resolve(mockResponse)
            }
            return config
        },
        (error: any) => Promise.reject(error)
    )

    console.log('[Mock] Axios mock 拦截器已安装（基于 localStorage，无 Service Worker 依赖）')
}
