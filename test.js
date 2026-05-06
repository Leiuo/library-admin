const books = [
    { id: 1, title: 'Javascript高级程序设计', author: 'Nicholas C. Zakas', publisher: '人民邮电出版社', status: 0 },  // status: 0 可借, 1 借出
    { id: 2, title: 'Vue.js设计与实现', author: '尤雨溪', publisher: '人民邮电出版社', status: 0 },
    { id: 3, title: 'CSS揭秘', author: 'Lea Verou', publisher: '人民邮电出版社', status: 0 },
    { id: 4, title: '深入理解ES6', author: 'Nicholas C. Zakas', publisher: '电子工业出版社', status: 0 },
    { id: 5, title: '时间简史', author: 'Stephen Hawking', publisher: '北京联合出版公司', status: 0 }
];

const borrows = [
    { id: 1, bookId: 3, readerId: 1, borrowDate: '2025-04-01', dueDate: '2025-04-15', status: 1 },
    { id: 2, bookId: 1, readerId: 2, borrowDate: '2025-04-10', dueDate: '2025-04-24', status: 1 },
    { id: 3, bookId: 4, readerId: 3, borrowDate: '2025-05-12', dueDate: '2025-05-25', status: 0 },
    { id: 4, bookId: 4, readerId: 2, borrowDate: '2026-05-1', dueDate: '2026-05-10', status: 0 }
];

const getHotBooksData = () => {
    const borrowCount = {};
    borrows.forEach(borrow => {
        borrowCount[borrow.bookId] = (borrowCount[borrow.bookId] || 0) + 1;
    });
    // console.log(borrowCount);

    const hotBooks = [];
    for (let bookId in borrowCount) {
        // console.log(bookId);
        const book = books.find(book => book.id === Number(bookId));
        console.log(book);
        if (book) {
            hotBooks.push({
                name: book.title,
                count: borrowCount[bookId]
            });
        }
    }
    hotBooks.sort((a, b) => b.count - a.count);  // 热门图书按借阅数目降序排列

    return hotBooks.slice(0, 5);  // 取前五个
};

const booksData = getHotBooksData();
console.log(booksData);