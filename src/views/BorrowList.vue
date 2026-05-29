<template>
    <div class="borrowlist-container">
        <div class="top-button">
            <el-button type="primary" @click="openBorrowDialog">+ 借书</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <div class="table-wrapper">
            <el-table :data="paginatedBorrows" border stripe :row-class-name="rowClassName" v-loading="loading" @selection-change="handleSelectionChange">
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
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button v-if="row.status === 0" link type="danger"
                            @click="handleReturn(row.id)">归还</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-wrapper">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="borrows.length"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
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
import { ref, onMounted, computed, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBooks, getBorrows, returnBook, getReaders, addBorrow, updateBorrow, deleteBorrows } from '../api/mock';

const borrows = ref([]);
const dialogTitle = ref('');
const editingId = ref(null);

const loading = ref(false);  // 加载状态

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedBorrows = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return borrows.value.slice(start, start + pageSize.value);
});

// 判断借阅是否逾期（未归还 且 当前日期已过应还日期）
const today = new Date().toISOString().split('T')[0];
const isOverdue = (row) => row.status === 0 && row.dueDate < today;
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
    returnBook(borrowId).then(() => {
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
        // console.log('借书日期变化，重新校验应还日期');
        // console.log('borrowFormRef.value:', borrowFormRef.value);
        borrowFormRef.value.validateField('dueDate');
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
    await fetchSeletData();
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
            ElMessage.success('更新成功');
        } else {  // 否则调用新增接口
            await addBorrow(borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate);
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
            const count = await deleteBorrows(selectedIds.value);
            ElMessage.success(`成功删除 ${count} 条记录`);
            fetchBorrows();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => {});
};

onMounted(() => {
    fetchBorrows();
});
</script>

<style lang="less" scoped>
.borrowlist-container {
    .top-button {
        margin-bottom: 16px;
    }

    .table-wrapper {
        overflow-x: auto;
    }

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
    }

    :deep(.overdue-row) {
        background-color: rgba(161, 11, 11, 0.159) !important;
    }
}

@media (max-width: 767px) {
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