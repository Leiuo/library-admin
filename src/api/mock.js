// 初始化默认数据
const STORAGE_KEYS = {
    BOOKS: 'library_books',
    READERS: 'library_readers',
    BORROWS: 'library_borrows'
};

function initMockData() {
    // 图书
    if (!localStorage.getItem(STORAGE_KEYS.BOOKS)) {
        const books = [
            { id: 1, title: 'Javascript高级程序设计', author: 'Nicholas C. Zakas', publisher: '人民邮电出版社', status: 0 },  // status: 0 可借, 1 借出
            { id: 2, title: 'Vue.js设计与实现', author: '尤雨溪', publisher: '人民邮电出版社', status: 0 },
            { id: 3, title: 'CSS揭秘', author: 'Lea Verou', publisher: '人民邮电出版社', status: 0 },
            { id: 4, title: '深入理解ES6', author: 'Nicholas C. Zakas', publisher: '电子工业出版社', status: 0 },
            { id: 5, title: '时间简史', author: 'Stephen Hawking', publisher: '北京联合出版公司', status: 0 }
        ];
        localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    }

    // 借阅记录 (status 0借出中 1已归还)
    if (!localStorage.getItem(STORAGE_KEYS.BORROWS)) {
        const borrows = [
            { id: 1, bookId: 3, readerId: 1, borrowDate: '2025-04-01', dueDate: '2025-04-15', status: 1 },
            { id: 2, bookId: 1, readerId: 2, borrowDate: '2025-04-10', dueDate: '2025-04-24', status: 1 },
            { id: 3, bookId: 4, readerId: 3, borrowDate: '2026-05-12', dueDate: '2026-05-25', status: 0 }
        ];
        localStorage.setItem(STORAGE_KEYS.BORROWS, JSON.stringify(borrows));
    }

    // 读者
    if (!localStorage.getItem(STORAGE_KEYS.READERS)) {
        const readers = [
            { id: 1, cardNo: 'R001', name: '张三', phone: '13324523561' },
            { id: 2, cardNo: 'R002', name: '李四', phone: '15544672422' },
            { id: 3, cardNo: 'R003', name: '王五', phone: '19768754545' }
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

// 根据借阅状态动态获取图书数据
export const getBooks = () => {
    let books = getData(STORAGE_KEYS.BOOKS);
    const borrows = getData(STORAGE_KEYS.BORROWS);
    books.forEach(book => {
        const hasBorrow = borrows.some(borrow => borrow.bookId === book.id && !borrow.status);
        if (hasBorrow) {
            book.status = 1;
        }
    });

    return Promise.resolve(books);
}

export const addBook = (book) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    const newId = books.length ? Math.max(...books.map(b => b.id)) + 1 : 1;
    const newBook = { ...book, id: newId, status: 0 };
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
    const hasActiveBorrow = borrows.some(b => b.bookId === id && b.status === 0);
    if (hasActiveBorrow) {
        return Promise.reject(new Error('该书尚有未归还的借阅，不能删除'));
    }
    let books = getData(STORAGE_KEYS.BOOKS);
    books = books.filter(b => b.id !== id);
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve();
}


// -------------------- 借阅模块 --------------------
export const getBorrows = () => {
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

    if (borrowId === -1) {
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
        book.status = 0;
        setData(STORAGE_KEYS.BOOKS, books);
    }

    return Promise.resolve();
}

// 新增借阅
export const addBorrow = (bookId, readerId, borrowDate, dueDate) => {
    const books = getData(STORAGE_KEYS.BOOKS);
    const book = books.find(book => book.id === bookId);
    if (!book) return Promise.reject(new Error('图书不存在'));
    if (book.status) return Promise.reject(new Error('图书已被借出'));

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

    // 修改图书状态为借出
    book.status = 1;
    setData(STORAGE_KEYS.BOOKS, books);
    return Promise.resolve(newBorrow);
}


// -------------------- 读者模块 --------------------
export const getReaders = () => Promise.resolve(getData(STORAGE_KEYS.READERS))

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
        console.log('readers[idx]:', readers[idx]);
        console.log('updatedData:', updatedData);
        // readers[idx] = [...readers[idx], ...updatedData];
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