<template>
    <div class="borrowlist-container">
        <div class="search-area">
            <el-input v-model="searchKeyword" placeholder="按书名搜索" clearable @keyup.enter="handleSearch" />
            <el-input v-model="readerKeyword" placeholder="按读者名搜索" clearable @keyup.enter="handleSearch" />
            <el-select v-model="statusFilter" placeholder="全部状态" clearable style="width: 130px;">
                <el-option label="借出中" value="borrowing" />
                <el-option label="逾期中" value="overdue" />
                <el-option label="已归还" value="returned" />
            </el-select>
            <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
            <el-button type="success" @click="openBorrowDialog">+ 借书</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <UndoBar :visible="!!undoState" :message="undoState?.message || ''"
            @undo="handleUndo" @close="clearUndo" />

        <div class="table-wrapper">
            <TableSkeleton v-if="loading" :rows="8" :cols="7" />
            <el-empty v-else-if="filteredBorrows.length === 0" description="暂无借阅记录" />
            <el-table v-else :data="paginatedBorrows" :row-class-name="rowClassName" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
                <el-table-column prop="id" label="记录ID" width="70" />
                <el-table-column prop="bookTitle" label="图书名称" />
                <el-table-column prop="readerName" label="借阅人" width="240" />
                <el-table-column prop="borrowDate" label="借书日期" width="120" />
                <el-table-column prop="dueDate" label="应还日期" width="120" />
                <el-table-column prop="status" label="状态" width="110">
                    <template #default="{ row }">
                        <el-tag :type="statusTagType(row)">
                            {{ statusText(row) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="逾期罚款" width="140">
                    <template #default="{ row }">
                        <span v-if="isOverdue(row)" class="fine-text">
                            {{ calcFine(row) }}
                        </span>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button v-if="row.status === 0" link type="danger"
                            @click="handleReturn(row.id)">归还</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div v-if="filteredBorrows.length > 0" class="pagination-wrapper">
                <PaginationBox
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :total="filteredBorrows.length"
                />
            </div>
        </div>

        <!-- 借阅对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="borrowForm" :rules="borrowRules" ref="borrowFormRef" label-width="80px">
                <el-form-item label="图书" prop="bookId">
                    <el-select v-model="borrowForm.bookId" placeholder="请选择图书" filterable>
                        <el-option v-for="book in availableBooks" :key="book.id"
                            :label="`${book.title} (${book.author}) [剩余${book.quantity}本]`" :value="book.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="读者" prop="readerId">
                    <el-select v-model="borrowForm.readerId" placeholder="请选择读者" filterable>
                        <el-option v-for="reader in readers" :key="reader.id"
                            :label="`${reader.name} (${reader.cardNo})`" :value="reader.id" />
                    </el-select>
                </el-form-item>
                <el-form-item label="借书日期" prop="borrowDate">
                    <el-date-picker v-model="borrowForm.borrowDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item label="应还日期" prop="dueDate">
                    <el-date-picker v-model="borrowForm.dueDate" type="date" placeholder="选择日期" format="YYYY-MM-DD"
                        value-format="YYYY-MM-DD" />
                </el-form-item>
                <el-form-item v-if="editingId" label="状态" prop="status">
                    <el-select v-model="borrowForm.status" placeholder="请选择状态">
                        <el-option label="借出中" :value="0" />
                        <el-option label="已归还" :value="1" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitBorrow">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import UndoBar from '../components/UndoBar.vue';
import PaginationBox from '../components/PaginationBox.vue';
import TableSkeleton from '../components/TableSkeleton.vue';
import { getBooks, getBorrows, returnBook, getReaders, addBorrow, updateBorrow, deleteBorrows, getSettings, addLog } from '../api/mock';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const borrows = ref([]);

const settings = ref({
    maxBorrowBooks: 5,
    borrowDuration: 30,
    overdueFinePerDay: 0.5
});

const loadSettings = async () => {
    try {
        const s = await getSettings();
        settings.value = s;
    } catch { /* use defaults */ }
};

// 搜索/筛选状态
const searchKeyword = ref('');
const readerKeyword = ref('');
const statusFilter = ref('');
const searchQuery = ref('');
const readerQuery = ref('');
const statusQuery = ref('');

const handleSearch = () => {
    searchQuery.value = searchKeyword.value;
    readerQuery.value = readerKeyword.value;
    statusQuery.value = statusFilter.value;
};

const dialogTitle = ref('');
const editingId = ref(null);

const loading = ref(false);  // 加载状态

const currentPage = ref(1);
const pageSize = ref(10);
// 判断借阅是否逾期（未归还 且 当前日期已过应还日期）
const today = new Date().toISOString().split('T')[0];
const isOverdue = (row) => row.status === 0 && row.dueDate < today;

const calcFine = (row) => {
    if (!isOverdue(row)) return '0 元';
    const days = Math.floor((new Date(today) - new Date(row.dueDate)) / (1000 * 60 * 60 * 24));
    const fine = (days * settings.value.overdueFinePerDay).toFixed(1);
    return `${days}天 / ${fine} 元`;
};

const filteredBorrows = computed(() => {
    let result = borrows.value;

    if (searchQuery.value) {
        const keyword = searchQuery.value.toLowerCase();
        result = result.filter(b => b.bookTitle && b.bookTitle.toLowerCase().includes(keyword));
    }

    if (readerQuery.value) {
        const keyword = readerQuery.value.toLowerCase();
        result = result.filter(b => b.readerName && b.readerName.toLowerCase().includes(keyword));
    }

    if (statusQuery.value) {
        if (statusQuery.value === 'borrowing') {
            result = result.filter(b => b.status === 0 && !isOverdue(b));
        } else if (statusQuery.value === 'overdue') {
            result = result.filter(b => isOverdue(b));
        } else if (statusQuery.value === 'returned') {
            result = result.filter(b => b.status === 1);
        }
    }

    return result;
});

const paginatedBorrows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredBorrows.value.slice(start, start + pageSize.value);
});
watch([searchQuery, readerQuery, statusQuery], () => { currentPage.value = 1; });
const statusText = (row) => {
    if (row.status === 1) return '已归还';
    return isOverdue(row) ? '逾期中' : '借出中';
};
const statusTagType = (row) => {
    if (row.status === 1) return 'info';
    return isOverdue(row) ? 'danger' : 'warning';
};
const rowClassName = ({ row }) => {
    return isOverdue(row) ? 'overdue-row' : '';
};

const fetchBorrows = async () => {
    loading.value = true;
    try {
        borrows.value = await getBorrows();
    } catch (error) {
        ElMessage.error('获取借阅列表失败');
    } finally {
        loading.value = false;
    }
}

const handleReturn = (borrowId) => {
    const borrow = borrows.value.find(b => b.id === borrowId);
    returnBook(borrowId).then(() => {
        if (borrow) addLog(userStore.user_name, 'return', `《${borrow.bookTitle}》`, `借阅人: ${borrow.readerName}`);
        ElMessage.success('归还成功');
        fetchBorrows();
    }).catch(error => ElMessage.error(error.message));
};

const dialogVisible = ref(false);
const borrowForm = ref({
    bookId: '',
    readerId: '',
    borrowDate: '',
    dueDate: '',
    status: 0
});
const borrowFormRef = ref(null);
const borrowRules = {
    bookId: [{ required: true, message: '请选择图书', trigger: 'change' }],
    readerId: [{ required: true, message: '请选择读者', trigger: 'change' }],
    borrowDate: [{ required: true, message: '请选择借书日期', trigger: 'change' }],
    dueDate: [
        { required: true, message: '请选择应还日期', trigger: 'change' },
        // 自定义验证规则，确保应还日期不早于借书日期
        {
            validator: (rule, value, callback) => {
                if (!value) {
                    callback(new Error('请选择应还日期'));
                } else if (borrowForm.value.borrowDate && value < borrowForm.value.borrowDate) {
                    callback(new Error('应还日期不能早于借书日期'));
                } else {
                    callback();
                }
            },
            trigger: 'change'
        }
    ]
};

// 借书日期变化时，重新校验应还日期
watch(() => borrowForm.value.borrowDate, () => {
    if (borrowForm.value.dueDate && borrowFormRef.value) {
        borrowFormRef.value.validateField('dueDate');
    }
});

// 借书日期变化时，自动计算应还日期（仅新增模式）
watch(() => borrowForm.value.borrowDate, (val) => {
    if (!editingId.value && val) {
        const d = new Date(val);
        d.setDate(d.getDate() + settings.value.borrowDuration);
        borrowForm.value.dueDate = d.toISOString().split('T')[0];
        if (borrowFormRef.value) {
            borrowFormRef.value.validateField('dueDate');
        }
    }
});

// 选择读者时，检查是否已达最大借阅数量（新增模式下，或编辑时更换了读者）
watch(() => borrowForm.value.readerId, (val, oldVal) => {
    if (!val) return;
    const activeCount = borrows.value.filter(
        b => b.readerId === val && b.status === 0 && b.id !== editingId.value
    ).length;
    if (activeCount >= settings.value.maxBorrowBooks) {
        ElMessage.warning(`该读者当前已借 ${activeCount} 本，已达最大借阅上限（${settings.value.maxBorrowBooks}本）`);
        borrowForm.value.readerId = '';
    }
});

const availableBooks = ref([]);
const readers = ref([]);

// 获取可借图书和读者列表
const fetchSeletData = async (currentBookId = null) => {
    const allBooks = await getBooks();
    availableBooks.value = allBooks.filter(book => book.quantity > 0 || book.id === currentBookId);  // 可借图书为剩余数量大于 0 的图书，或者当前正在编辑的借阅记录的图书（如果有的话）

    if (currentBookId) {  // 编辑时需要将当前借阅的图书也加入可选列表（如果它当前不可借）
        const currentBook = allBooks.find(b => b.id === currentBookId);
        if (currentBook && !availableBooks.value.find(b => b.id === currentBookId)) {
            availableBooks.value.push(currentBook);
        }
    }
    readers.value = await getReaders();
}

const openBorrowDialog = async () => {
    dialogTitle.value = '新增借阅';
    editingId.value = null;
    await Promise.all([fetchSeletData(), loadSettings()]);
    borrowForm.value = {
        bookId: '',
        readerId: '',
        borrowDate: '',
        dueDate: '',
        status: 0
    };
    if (borrowFormRef.value) borrowFormRef.value.resetFields();
    dialogVisible.value = true;
}

const openEditDialog = async (row) => {
    dialogTitle.value = '编辑借阅';
    await fetchSeletData(row.bookId);
    editingId.value = row.id;
    borrowForm.value = {
        bookId: row.bookId,
        readerId: row.readerId,
        borrowDate: row.borrowDate,
        dueDate: row.dueDate,
        status: row.status
    };
    if (borrowFormRef.value) borrowFormRef.value.resetFields();
    dialogVisible.value = true;
}

const submitBorrow = async () => {
    await borrowFormRef.value.validate();
    try {
        if (editingId.value) {  // 如果正在编辑，则调用更新接口
            await updateBorrow(editingId.value, borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate, borrowForm.value.status);
            addLog(userStore.user_name, 'edit_borrow', `记录#${editingId.value}`);
            ElMessage.success('更新成功');
        } else {  // 否则调用新增接口
            await addBorrow(borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate);
            const book = availableBooks.value.find(b => b.id === borrowForm.value.bookId);
            const reader = readers.value.find(r => r.id === borrowForm.value.readerId);
            if (book && reader) addLog(userStore.user_name, 'borrow', `《${book.title}》`, `借阅人: ${reader.name}`);
            ElMessage.success('借书成功');
        }
        dialogVisible.value = false;
        fetchBorrows();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

// 批量选择
const selectedIds = ref([]);
const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

// 批量删除
const handleBatchDelete = () => {
    if (!selectedIds.value.length) return;
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 条借阅记录吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(async () => {
        try {
            const rawBorrows = JSON.parse(localStorage.getItem('library_borrows')) || [];
            const deletedItems = rawBorrows.reduce((acc, b, i) => {
                if (selectedIds.value.includes(b.id)) acc.push({ item: b, index: i });
                return acc;
            }, []);
            const count = await deleteBorrows(selectedIds.value);
            addLog(userStore.user_name, 'delete_borrow', `${count} 条记录`);
            showUndo(`已删除 ${count} 条记录`, deletedItems);
            fetchBorrows();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => {});
};

// 撤销删除
const undoState = ref(null);
let undoTimer = null;

const showUndo = (message, deletedItems) => {
    clearUndo();
    undoState.value = { message, items: deletedItems };
    undoTimer = setTimeout(() => { undoState.value = null; }, 10000);
};

const clearUndo = () => {
    if (undoTimer) clearTimeout(undoTimer);
    undoState.value = null;
};

const handleUndo = () => {
    if (!undoState.value) return;
    const borrows = JSON.parse(localStorage.getItem('library_borrows')) || [];
    const books = JSON.parse(localStorage.getItem('library_books')) || [];

    const sorted = [...undoState.value.items].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
        borrows.splice(index, 0, item);
        if (item.status === 0) {
            const book = books.find(b => b.id === item.bookId);
            if (book) book.quantity -= 1;
        }
    }

    localStorage.setItem('library_borrows', JSON.stringify(borrows));
    localStorage.setItem('library_books', JSON.stringify(books));
    const restoredItems = undoState.value.items;
    const detail = restoredItems.length === 1
        ? `记录#${restoredItems[0].item.id}`
        : `${restoredItems.length} 条记录`;
    addLog(userStore.user_name, 'restore_borrow', detail);
    clearUndo();
    fetchBorrows();
    ElMessage.success('已撤销删除');
};

onMounted(() => {
    fetchBorrows();
    loadSettings();
});

onUnmounted(() => {
    clearUndo();
});
</script>

<style lang="less" scoped>
.borrowlist-container {
    .search-area {
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-input {
            width: 200px;
        }
    }

    .table-wrapper {
        overflow-x: auto;
    }


    .fine-text {
        color: #ef4444;
        font-weight: 500;
        font-size: 13px;
    }

    :deep(.overdue-row),
    :deep(.overdue-row > td) {
        background-color: rgba(161, 11, 11, 0.159) !important;
    }
}

@media (max-width: 767px) {
    .borrowlist-container {
        .search-area {
            .el-input {
                width: 100%;
            }
        }
    }

    :deep(.el-dialog) {
        width: 90% !important;
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    :deep(.el-dialog) {
        width: 60% !important;
    }
}
</style>
