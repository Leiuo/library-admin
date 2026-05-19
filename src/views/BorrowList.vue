<template>
    <div class="borrowlist-container">
        <div class="top-button">
            <el-button type="primary" @click="openBorrowDialog">+ 借书</el-button>
        </div>

        <el-table :data="borrows" border stripe>
            <el-table-column prop="id" label="记录ID" width="70" />
            <el-table-column prop="bookTitle" label="图书名称" />
            <el-table-column prop="readerName" label="借阅人" />
            <el-table-column prop="borrowDate" label="借书日期" width="120" />
            <el-table-column prop="dueDate" label="应还日期" width="120" />
            <el-table-column prop="status" label="状态" width="100">
                <template #default="{ row }">
                    <el-tag :type="row.status === 0 ? 'warning' : 'info'">
                        {{ row.status === 0 ? '借出中' : '已归还' }}
                    </el-tag>
                </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
                <template #default="{ row }">
                    <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                    <el-button v-if="row.status === 0" link type="danger" @click="handleReturn(row.id)">归还</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 借阅对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="borrowForm" :rules="borrowRules" ref="borrowFormRef" label-width="80px">
                <el-form-item label="图书" prop="bookId">
                    <el-select v-model="borrowForm.bookId" placeholder="请选择图书" filterable>
                        <el-option v-for="book in availableBooks" :key="book.id"
                            :label="`${book.title} (${book.author})${book.status === 1 ? ' [已借出]' : ''}`" :value="book.id" />
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
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBooks, getBorrows, returnBook, getReaders, addBorrow, updateBorrow } from '../api/mock';

const borrows = ref([]);
const dialogTitle = ref('');
const editingId = ref(null);

const fetchBorrows = async () => {
    borrows.value = await getBorrows();
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
    dueDate: [{ required: true, message: '请选择应还日期', trigger: 'change' }]
};
const availableBooks = ref([]);
const readers = ref([]);

const fetchSeletData = async (currentBookId = null) => {
    const allBooks = await getBooks();
    availableBooks.value = allBooks.filter(book => book.status === 0);
    // 编辑时，当前已借出的书也需要出现在下拉列表中
    if (currentBookId) {
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
        if (editingId.value) {
            await updateBorrow(editingId.value, borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate, borrowForm.value.status);
            ElMessage.success('更新成功');
        } else {
            await addBorrow(borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate);
            ElMessage.success('借书成功');
        }
        dialogVisible.value = false;
        fetchBorrows();
    } catch (error) {
        ElMessage.error(error.message);
    }
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
}
</style>