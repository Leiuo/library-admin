// 初始化默认数据
const STORAGE_KEYS = {
    BOOKS: 'library_books',
    READERS: 'library_readers',
    BORROWS: 'library_borrows',
    SETTINGS: 'library_settings',
    ADMINS: 'library_admins'
};

function initMockData() {
    // 图书
    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
        const books = [  // quantity 表示图书数量
            { id: 1, title: 'Javascript高级程序设计', author: 'Nicholas C. Zakas', publisher: '人民邮电出版社', category: '科技编程', quantity: 6 },
            { id: 2, title: 'Vue.js设计与实现', author: '尤雨溪', publisher: '人民邮电出版社', category: '科技编程', quantity: 6 },
            { id: 3, title: 'CSS揭秘', author: 'Lea Verou', publisher: '人民邮电出版社', category: '科技编程', quantity: 6 },
            { id: 4, title: '深入理解ES6', author: 'Nicholas C. Zakas', publisher: '电子工业出版社', category: '科技编程', quantity: 6 },
            { id: 5, title: '时间简史', author: 'Stephen Hawking', publisher: '北京联合出版公司', category: '科学科普', quantity: 6 },
            { id: 6, title: '人类简史', author: 'Yuval Noah Harari', publisher: '中信出版社', category: '历史哲学', quantity: 6 }
        ];
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    }

    // 借阅记录 (status 0借出中 1已归还)
    if (!localStorage.getItem(STORAGE_KEYS.BORROWS)) {
        const borrows = [
            { id: 1, bookId: 3, readerId: 1, borrowDate: '2025-04-01', dueDate: '2025-04-15', status: 1 },
            { id: 2, bookId: 1, readerId: 2, borrowDate: '2025-04-10', dueDate: '2025-04-24', status: 1 },
            { id: 3, bookId: 4, readerId: 3, borrowDate: '2025-05-12', dueDate: '2025-05-19', status: 1 },
            { id: 4, bookId: 2, readerId: 4, borrowDate: '2025-06-01', dueDate: '2025-06-15', status: 1 },
            { id: 5, bookId: 5, readerId: 5, borrowDate: '2026-04-05', dueDate: '2026-04-19', status: 1 },
            { id: 6, bookId: 6, readerId: 6, borrowDate: '2026-04-10', dueDate: '2026-04-24', status: 1 },
            { id: 7, bookId: 1, readerId: 7, borrowDate: '2026-05-15', dueDate: '2026-05-20', status: 1 },
            { id: 8, bookId: 2, readerId: 8, borrowDate: '2026-05-20', dueDate: '2026-05-22', status: 1 },
            { id: 9, bookId: 3, readerId: 9, borrowDate: '2026-05-25', dueDate: '2026-06-09', status: 1 },
            { id: 10, bookId: 4, readerId: 10, borrowDate: '2026-05-30', dueDate: '2026-06-14', status: 1 }
        ];
        localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(borrows));
    }

    // 读者
    if (!localStorage.getItem(STORAGE_KEYS.READERS)) {
        const readers = [
            { id: 1, cardNo: 'R001', name: '唐三藏', phone: '13324523561' },
            { id: 2, cardNo: 'R002', name: '孙行者', phone: '15544672422' },
            { id: 3, cardNo: 'R003', name: '保罗·乔治', phone: '19768754545' },
            { id: 4, cardNo: 'R004', name: '唐纳德·特朗普', phone: '911-110' },
            { id: 5, cardNo: 'R005', name: '唐老鸭', phone: '15376234362' },
            { id: 6, cardNo: 'R006', name: '汤姆猫', phone: '41137324879' },
            { id: 7, cardNo: 'R007', name: '杰瑞鼠', phone: '13245678901' },
            { id: 8, cardNo: 'R008', name: '勒布朗·詹姆斯', phone: '19876543210' },
            { id: 9, cardNo: 'R009', name: '林黛玉', phone: '13987654321' },
            { id: 10, cardNo: 'R010', name: '萨勒芬妮', phone: '18812345678' }
        ];
        localStorage.setItem(STORAGE_KEYS.READERS, JSON.stringify(readers));
    }
}
initMockData();

// 辅助函数：读取数据
const getData = (key) => JSON.parse(localStorage.getItem(key)) || [];
const setData = (key, data) => localStorage.setItem(key, JSON.stringify(data));


// -------------------- 图书模块 --------------------
// export const getBooks = () => Promise.resolve(getData(STORAGE_KEYS.BOOKS))

// 获取图书列表 
export const getBooks = () => {
    initMockData();
    let books = getData(STORAGE_KEYS.BOOKS);
    return Promise.resolve(books);
}

export const addBook = (book) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    const newId = books.length ? Math.max(...books.map(b => b.id)) + 1 : 1;
    const newBook = { ...book, id: newId, quantity: book.quantity };  // 新增图书的剩余数量初始为其总数量
    books.push(newBook);
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve(newBook);
}

export const updateBook = (id, updatedData) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    const index = books.findIndex(b => b.id === id);
    if (index !== -1) {
        books[index] = { ...books[index], ...updatedData };
        setData(STORAGE_KEYS.BOOKS, books);
        return Promise.resolve(books[index]);
    }
    return Promise.reject(new Error('图书不存在'));
}

export const deleteBook = (id) => {
    // 检查是否存在未归还的借阅记录关联此书
    const borrows = getData(STORAGE_KEYS.BORROWS);
    let books = getData(STORAGE_KEYS.BOOKS);
    const hasActiveBorrow = borrows.some(b => b.bookId === id && b.status === 0);
    if (hasActiveBorrow) {
        return Promise.reject(new Error('该书尚有未归还的借阅，不能删除'));
    }
    books = books.filter(b => b.id !== id);
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve();
}

export const deleteBooks = (ids) => {
    const borrows = getData(STORAGE_KEYS.BORROWS);
    let books = getData(STORAGE_KEYS.BOOKS);
    const failedIds = [];
    ids.forEach(id => {
        const hasActiveBorrow = borrows.some(b => b.bookId === id && b.status === 0);
        if (hasActiveBorrow) {
            failedIds.push(id);
        }
    });
    if (failedIds.length) {
        const titles = books.filter(b => failedIds.includes(b.id)).map(b => b.title).join('、');
        return Promise.reject(new Error(`《${titles}》尚有未归还的借阅，不能删除`));
    }
    books = books.filter(b => !ids.includes(b.id));
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve(ids.length);
}

export const importBooks = (bookList) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    let maxId = books.length ? Math.max(...books.map(b => b.id)) : 0;
    const newBooks = bookList.map((book, i) => ({
        ...book,
        id: maxId + i + 1,
        quantity: Number(book.quantity) || 0
    }));
    books.push(...newBooks);
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve(newBooks.length);
}


// -------------------- 借阅模块 --------------------
export const getBorrows = () => {
    initMockData();
    const borrows = getData(STORAGE_KEYS.BORROWS);
    const books = getData(STORAGE_KEYS.BOOKS);
    const readers = getData(STORAGE_KEYS.READERS);

    // 关联书名、读者名
    const matched = borrows.map(borrow => ({
        ...borrow,
        // status: 1 - books.find(book => book.id === borrow.bookId)?.status,
        bookTitle: books.find(book => book.id === borrow.bookId)?.title || '未知',
        readerName: readers.find(reader => reader.id === borrow.readerId)?.name || '未知',
        readerCard: readers.find(reader => reader.id === borrow.readerId)?.cardNo || ''
    }));

    return Promise.resolve(matched);
}

// 归还图书
export const returnBook = (borrowId) => {
    let borrows = getData(STORAGE_KEYS.BORROWS);
    const borrowIdx = borrows.findIndex(borrow => borrow.id === borrowId);

    if (borrowIdx === -1) {
        return Promise.reject(new Error('借阅记录不存在'));
    } else if (borrows[borrowIdx].status === 1) {
        return Promise.reject(new Error('该图书已归还'));
    }

    // 修改借阅状态为已归还，更新本地存储
    borrows[borrowIdx].status = 1;
    setData(STORAGE_KEYS.BORROWS, borrows);

    // 修改对应图书状态为可借
    const books = getData(STORAGE_KEYS.BOOKS);
    const book = books.find(book => book.id === borrows[borrowIdx].bookId);
    if (book) {
        book.quantity += 1;  // 归还后图书剩余数量加 1
        setData(STORAGE_KEYS.BOOKS, books);
    }

    return Promise.resolve();
}

// 新增借阅
export const addBorrow = (bookId, readerId, borrowDate, dueDate) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    const book = books.find(book => book.id === bookId);
    if (!book) return Promise.reject(new Error('图书不存在'));
    if (book.quantity === 0) return Promise.reject(new Error('图书已被借完，无法借出'));

    const readers = getData(STORAGE_KEYS.READERS);
    const reader = readers.find(reader => reader.id === readerId);
    if (!reader) return Promise.reject(new Error('读者不存在'));

    const borrows = getData(STORAGE_KEYS.BORROWS);
    const newId = borrows.length ? Math.max(...borrows.map(borrow => borrow.id)) + 1 : 1;
    const newBorrow = {
        id: newId,
        bookId,
        readerId,
        borrowDate,
        dueDate,
        status: 0
    };
    borrows.push(newBorrow);
    setData(STORAGE_KEYS.BORROWS, borrows);

    // 借出后图书剩余数量减 1
    book.quantity -= 1;
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve(newBorrow);
}

// 编辑借阅
export const updateBorrow = (id, bookId, readerId, borrowDate, dueDate, status) => {
    let borrows = getData(STORAGE_KEYS.BORROWS);
    const borrowIdx = borrows.findIndex(borrow => borrow.id === id);
    if (borrowIdx === -1) return Promise.reject(new Error('借阅记录不存在'));

    const oldBorrow = borrows[borrowIdx];
    let books = getData(STORAGE_KEYS.BOOKS);

    // 如果更换了图书，需要同步新旧图书的状态
    if (oldBorrow.bookId !== bookId) {
        const oldBook = books.find(b => b.id === oldBorrow.bookId);
        const newBook = books.find(b => b.id === bookId);
        if (!newBook) return Promise.reject(new Error('图书不存在'));

        // 只有当前借阅未归还时，才需要处理图书状态流转
        if (oldBorrow.status === 0) {
            if (newBook.quantity === 0 && newBook.id !== oldBorrow.bookId) {
                return Promise.reject(new Error('该图书已被借完，无法借出'));
            }
            if (oldBook) oldBook.quantity += 1;   // 旧书剩余数量加 1
            newBook.quantity -= 1;                  // 新书数量减 1
        }
    }

    // 如果归还状态发生变化，同步图书状态
    const oldStatus = oldBorrow.status;
    const newStatus = status !== undefined ? status : oldStatus;
    if (oldStatus === 0 && newStatus === 1) {  // 从借出改为归还
        const book = books.find(b => b.id === bookId);
        if (book) book.quantity += 1;  // 归还后图书剩余数量加 1
    } else if (oldStatus === 1 && newStatus === 0) {  // 从归还改为借出
        const book = books.find(b => b.id === bookId);
        if (book && book.quantity === 0) {
            return Promise.reject(new Error('该图书已被借完，无法重新借出'));
        }
        if (book) book.quantity -= 1;  // 重新借出
    }

    setData(STORAGE_KEYS.BOOKS, books);
    borrows[borrowIdx] = { ...oldBorrow, bookId, readerId, borrowDate, dueDate, status: newStatus };
    setData(STORAGE_KEYS.BORROWS, borrows);
    return Promise.resolve(borrows[borrowIdx]);
}

export const deleteBorrows = (ids) => {
    let borrows = getData(STORAGE_KEYS.BORROWS);
    const books = getData(STORAGE_KEYS.BOOKS);
    ids.forEach(id => {
        const borrow = borrows.find(b => b.id === id);
        if (borrow && borrow.status === 0) {
            const book = books.find(b => b.id === borrow.bookId);
            if (book) book.quantity += 1;
        }
    });
    setData(STORAGE_KEYS.BOOKS, books);
    borrows = borrows.filter(b => !ids.includes(b.id));
    setData(STORAGE_KEYS.BORROWS, borrows);
    return Promise.resolve(ids.length);
}


// -------------------- 读者模块 --------------------
export const getReaders = () => {
    initMockData();
    return Promise.resolve(getData(STORAGE_KEYS.READERS));
}

export const addReader = (reader) => {
    const readers = getData(STORAGE_KEYS.READERS);
    const newId = readers.length ? Math.max(...readers.map(reader => reader.id)) + 1 : 1;
    const newReader = { ...reader, id: newId };
    readers.push(newReader);
    setData(STORAGE_KEYS.READERS, readers);
    return Promise.resolve(newReader);
}

export const updateReader = (id, updatedData) => {
    const readers = getData(STORAGE_KEYS.READERS);
    const idx = readers.findIndex(reader => reader.id === id);

    if (idx !== -1) {
        readers[idx] = { ...readers[idx], ...updatedData };
        setData(STORAGE_KEYS.READERS, readers);
        return Promise.resolve(readers[idx]);
    }
    return Promise.reject(new Error('读者不存在'));
}

export const deleteReader = (id) => {
    const borrows = getData(STORAGE_KEYS.BORROWS);
    const hasBorrow = borrows.some(borrow => borrow.readerId === id && !borrow.status);

    if (hasBorrow) return Promise.reject(new Error('该读者有尚未归还的图书，不能删除'));

    let readers = getData(STORAGE_KEYS.READERS);
    readers = readers.filter(reader => reader.id !== id);
    setData(STORAGE_KEYS.READERS, readers);
    return Promise.resolve();
}

export const deleteReaders = (ids) => {
    const borrows = getData(STORAGE_KEYS.BORROWS);
    let readers = getData(STORAGE_KEYS.READERS);
    const failedIds = [];
    ids.forEach(id => {
        if (borrows.some(b => b.readerId === id && !b.status)) {
            failedIds.push(id);
        }
    });
    if (failedIds.length) {
        const names = readers.filter(r => failedIds.includes(r.id)).map(r => r.name).join('、');
        return Promise.reject(new Error(`${names} 有尚未归还的图书，不能删除`));
    }
    readers = readers.filter(r => !ids.includes(r.id));
    setData(STORAGE_KEYS.READERS, readers);
    return Promise.resolve(ids.length);
}

export const importReaders = (readerList) => {
    const readers = getData(STORAGE_KEYS.READERS);
    let maxId = readers.length ? Math.max(...readers.map(r => r.id)) : 0;
    const newReaders = readerList.map((reader, i) => ({
        ...reader,
        id: maxId + i + 1
    }));
    readers.push(...newReaders);
    setData(STORAGE_KEYS.READERS, readers);
    return Promise.resolve(newReaders.length);
}


// -------------------- 系统设置模块 --------------------
const DEFAULT_SETTINGS = {
    libraryName: '图书馆管理系统',
    libraryAddress: '',
    libraryPhone: '',
    openingHours: '',
    maxBorrowBooks: 5,
    borrowDuration: 30,
    renewalLimit: 2,
    overdueFinePerDay: 0.5
};

function initSettings() {
    if (!localStorage.getItem(STORAGE_KEYS.SETTINGS)) {
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
    }
}
initSettings();

export const getSettings = () => {
    initSettings();
    return Promise.resolve(getData(STORAGE_KEYS.SETTINGS));
};

export const saveSettings = (settings) => {
    setData(STORAGE_KEYS.SETTINGS, settings);
    return Promise.resolve(settings);
};


// -------------------- 管理员模块 --------------------
function initAdmins() {
    if (!localStorage.getItem(STORAGE_KEYS.ADMINS)) {
        const admins = [
            { id: 1, username: 'admin', password: '123456', role: 'super', createdAt: '2026-05-01' }
        ];
        localStorage.setItem(STORAGE_KEYS.ADMINS, JSON.stringify(admins));
    }
}
initAdmins();

export const getAdmins = () => {
    initAdmins();
    return Promise.resolve(getData(STORAGE_KEYS.ADMINS).map(a => ({ ...a, password: '********' })));
};

export const addAdmin = (admin) => {
    const admins = getData(STORAGE_KEYS.ADMINS);
    if (admins.some(a => a.username === admin.username)) {
        return Promise.reject(new Error('该用户名已存在'));
    }
    const newId = admins.length ? Math.max(...admins.map(a => a.id)) + 1 : 1;
    const newAdmin = { ...admin, id: newId, createdAt: new Date().toISOString().split('T')[0] };
    admins.push(newAdmin);
    setData(STORAGE_KEYS.ADMINS, admins);
    return Promise.resolve({ ...newAdmin, password: '********' });
};

export const updateAdmin = (id, data) => {
    const admins = getData(STORAGE_KEYS.ADMINS);
    const idx = admins.findIndex(a => a.id === id);
    if (idx === -1) return Promise.reject(new Error('管理员不存在'));
    if (data.username && data.username !== admins[idx].username && admins.some(a => a.username === data.username)) {
        return Promise.reject(new Error('该用户名已存在'));
    }
    admins[idx] = { ...admins[idx], ...data };
    setData(STORAGE_KEYS.ADMINS, admins);
    return Promise.resolve({ ...admins[idx], password: '********' });
};

export const deleteAdmin = (id, currentUsername) => {
    const admins = getData(STORAGE_KEYS.ADMINS);
    if (admins.length <= 1) {
        return Promise.reject(new Error('至少保留一个管理员账号'));
    }
    const target = admins.find(a => a.id === id);
    if (!target) return Promise.reject(new Error('管理员不存在'));
    if (target.username === currentUsername) {
        return Promise.reject(new Error('不能删除自己'));
    }
    setData(STORAGE_KEYS.ADMINS, admins.filter(a => a.id !== id));
    return Promise.resolve();
};

export const verifyLogin = (username, password) => {
    initAdmins();
    const admins = getData(STORAGE_KEYS.ADMINS);
    const admin = admins.find(a => a.username === username && a.password === password);
    if (!admin) return Promise.reject(new Error('用户名或密码错误'));
    return Promise.resolve({ id: admin.id, username: admin.username, role: admin.role });
};


// -------------------- 操作日志模块 --------------------
const STORAGE_LOG_KEY = 'library_logs';

export const addLog = (operator, action, target, detail = '') => {
    const logs = getData(STORAGE_LOG_KEY);
    const newLog = {
        id: logs.length ? Math.max(...logs.map(l => l.id)) + 1 : 1,
        operator,
        action,
        target,
        detail,
        time: new Date().toLocaleString('zh-CN', { hour12: false })
    };
    logs.push(newLog);
    setData(STORAGE_LOG_KEY, logs);
    return Promise.resolve(newLog);
};

export const getLogs = () => Promise.resolve(getData(STORAGE_LOG_KEY));

export const clearLogs = () => {
    setData(STORAGE_LOG_KEY, []);
    return Promise.resolve();
};


// -------------------- 分类管理模块 --------------------
const STORAGE_CATEGORIES_KEY = 'library_categories';

function initCategories() {
    if (!localStorage.getItem(STORAGE_CATEGORIES_KEY)) {
        const categories = [
            { id: 1, name: '文学小说', description: '中外文学名著及畅销小说' },
            { id: 2, name: '科技编程', description: '计算机科学与编程技术书籍' },
            { id: 3, name: '历史哲学', description: '历史研究与哲学思想著作' },
            { id: 4, name: '科学科普', description: '自然科学与科普读物' },
            { id: 5, name: '经济管理', description: '经济学与管理学书籍' },
            { id: 6, name: '艺术设计', description: '绘画、设计、音乐等艺术类' },
            { id: 7, name: '教育学习', description: '教材教辅与学习参考书' },
            { id: 8, name: '生活百科', description: '生活常识、健康养生等' }
        ];
        localStorage.setItem(STORAGE_CATEGORIES_KEY, JSON.stringify(categories));
    }
}
initCategories();

export const getCategories = () => {
    initCategories();
    const categories = getData(STORAGE_CATEGORIES_KEY);
    const books = getData(STORAGE_KEYS.BOOKS);
    return Promise.resolve(categories.map(cat => ({
        ...cat,
        bookCount: books.filter(b => b.category === cat.name).length
    })));
};

export const addCategory = (category) => {
    const categories = getData(STORAGE_CATEGORIES_KEY);
    if (categories.some(c => c.name === category.name)) {
        return Promise.reject(new Error('该分类名称已存在'));
    }
    const newId = categories.length ? Math.max(...categories.map(c => c.id)) + 1 : 1;
    const newCategory = { ...category, id: newId };
    categories.push(newCategory);
    setData(STORAGE_CATEGORIES_KEY, categories);
    return Promise.resolve(newCategory);
};

export const updateCategory = (id, data) => {
    const categories = getData(STORAGE_CATEGORIES_KEY);
    const idx = categories.findIndex(c => c.id === id);
    if (idx === -1) return Promise.reject(new Error('分类不存在'));
    if (data.name && data.name !== categories[idx].name && categories.some(c => c.name === data.name)) {
        return Promise.reject(new Error('该分类名称已存在'));
    }
    const oldName = categories[idx].name;
    categories[idx] = { ...categories[idx], ...data };
    setData(STORAGE_CATEGORIES_KEY, categories);

    // 同步更新图书中的分类名称
    if (data.name && data.name !== oldName) {
        const books = getData(STORAGE_KEYS.BOOKS);
        books.forEach(b => {
            if (b.category === oldName) b.category = data.name;
        });
        setData(STORAGE_KEYS.BOOKS, books);
    }
    return Promise.resolve(categories[idx]);
};

export const deleteCategory = (id) => {
    const categories = getData(STORAGE_CATEGORIES_KEY);
    const target = categories.find(c => c.id === id);
    if (!target) return Promise.reject(new Error('分类不存在'));
    const books = getData(STORAGE_KEYS.BOOKS);
    if (books.some(b => b.category === target.name)) {
        return Promise.reject(new Error(`该分类下有 ${books.filter(b => b.category === target.name).length} 本图书，不能删除`));
    }
    setData(STORAGE_CATEGORIES_KEY, categories.filter(c => c.id !== id));
    return Promise.resolve();
};

export const deleteCategories = (ids) => {
    const categories = getData(STORAGE_CATEGORIES_KEY);
    const books = getData(STORAGE_KEYS.BOOKS);
    const failedNames = [];
    ids.forEach(id => {
        const cat = categories.find(c => c.id === id);
        if (cat && books.some(b => b.category === cat.name)) {
            failedNames.push(cat.name);
        }
    });
    if (failedNames.length) {
        return Promise.reject(new Error(`分类"${failedNames.join('、')}"下尚有图书，不能删除`));
    }
    setData(STORAGE_CATEGORIES_KEY, categories.filter(c => !ids.includes(c.id)));
    return Promise.resolve(ids.length);
};

// -------------------- 通知公告模块 --------------------
const STORAGE_ANNOUNCEMENTS_KEY = 'library_announcements';

function initAnnouncements() {
    if (!localStorage.getItem(STORAGE_ANNOUNCEMENTS_KEY)) {
        const now = new Date();
        const fmt = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        const announcements = [
            { id: 1, title: '欢迎使用图书馆管理系统', content: '系统已正式上线运行，各位管理员可进行图书借阅、读者管理等日常操作。如有问题请联系系统管理员。', priority: 'important', publishDate: fmt(now), publisher: '超级管理员' },
            { id: 2, title: '端午节开闭馆时间调整通知', content: '端午节期间（6月8日至6月10日），图书馆开放时间调整为 9:00-17:00，6月11日起恢复正常。', priority: 'urgent', publishDate: fmt(now), publisher: '超级管理员' },
            { id: 3, title: '六月新书上架公告', content: '本月新增科技编程类图书 12 本、文学小说类 8 本，欢迎读者前来借阅。', priority: 'normal', publishDate: fmt(now), publisher: '超级管理员' }
        ];
        localStorage.setItem(STORAGE_ANNOUNCEMENTS_KEY, JSON.stringify(announcements));
    }
}
initAnnouncements();

export const getAnnouncements = () => {
    initAnnouncements();
    return Promise.resolve(getData(STORAGE_ANNOUNCEMENTS_KEY));
};

export const addAnnouncement = (data) => {
    const list = getData(STORAGE_ANNOUNCEMENTS_KEY);
    const newId = list.length ? Math.max(...list.map(a => a.id)) + 1 : 1;
    const item = { ...data, id: newId };
    list.push(item);
    setData(STORAGE_ANNOUNCEMENTS_KEY, list);
    return Promise.resolve(item);
};

export const updateAnnouncement = (id, data) => {
    const list = getData(STORAGE_ANNOUNCEMENTS_KEY);
    const idx = list.findIndex(a => a.id === id);
    if (idx === -1) return Promise.reject(new Error('公告不存在'));
    list[idx] = { ...list[idx], ...data };
    setData(STORAGE_ANNOUNCEMENTS_KEY, list);
    return Promise.resolve(list[idx]);
};

export const deleteAnnouncement = (id) => {
    let list = getData(STORAGE_ANNOUNCEMENTS_KEY);
    list = list.filter(a => a.id !== id);
    setData(STORAGE_ANNOUNCEMENTS_KEY, list);
    return Promise.resolve();
};

export const deleteAnnouncements = (ids) => {
    let list = getData(STORAGE_ANNOUNCEMENTS_KEY);
    list = list.filter(a => !ids.includes(a.id));
    setData(STORAGE_ANNOUNCEMENTS_KEY, list);
    return Promise.resolve(ids.length);
};

// -------------------- 罚款管理模块 --------------------
const STORAGE_FINE_PAID_KEY = 'library_fine_paid';

export const getPaidFines = () => Promise.resolve(getData(STORAGE_FINE_PAID_KEY));

export const payFines = (borrowIds) => {
    const paid = getData(STORAGE_FINE_PAID_KEY);
    borrowIds.forEach(id => {
        if (!paid.includes(id)) paid.push(id);
    });
    setData(STORAGE_FINE_PAID_KEY, paid);
    return Promise.resolve();
};

export const undoPayFines = (borrowIds) => {
    let paid = getData(STORAGE_FINE_PAID_KEY);
    paid = paid.filter(id => !borrowIds.includes(id));
    setData(STORAGE_FINE_PAID_KEY, paid);
    return Promise.resolve();
};