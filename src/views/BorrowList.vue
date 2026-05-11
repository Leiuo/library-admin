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
                    <el-button v-if="row.status === 0" link type="danger" @click="handleReturn(row.id)">归还</el-button>
                </template>
            </el-table-column>
        </el-table>

        <!-- 借书对话框 -->
        <el-dialog v-model="dialogVisible" title="借书" width="30%">
            <el-form :model="borrowForm" :rules="borrowRules" ref="borrowFormRef" label-width="80px">
                <el-form-item label="图书" prop="bookId">
                    <el-select v-model="borrowForm.bookId" placeholder="请选择可借图书" filterable>
                        <el-option v-for="book in availableBooks" :key="book.id"
                            :label="`${book.title} (${book.author})`" :value="book.id" />
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
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitBorrow">确认借书</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { getBooks, getBorrows, returnBook, getReaders, addBorrow } from '../api/mock';
import { fa } from 'element-plus/es/locale/index.mjs';

const borrows = ref([]);

const fetchBorrows = async () => {
    // console.log(await getBorrows());
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
    dueDate: ''
});
const borrowFormRef = ref(null);
const borrowRules = {
    bookId: [{ required: true, message: '请选择图书', trigger: 'change' }],
    readerId: [{ required: true, message: '请选择读者', trigger: 'change' }],
    borrowDate: [{ required: true, message: '请选择借书日期', trigger: 'change' }],
    dueDate: [{ required: true, message: '请选择应还日期', trigger: 'change' }]
};
const availableBooks = ref([]);  // status为0的可借图书
const readers = ref([]);

const fetchSeletData = async () => {
    const allBooks = await getBooks();
    availableBooks.value = allBooks.filter(book => book.status === 0);
    readers.value = await getReaders();
}

const openBorrowDialog = async () => {
    await fetchSeletData();
    borrowForm.value = {
        bookId: '',
        readerId: '',
        borrowDate: '',
        dueDate: ''
    };
    if (borrowFormRef.value) borrowFormRef.value.resetFields();
    dialogVisible.value = true;
};

const submitBorrow = async () => {
    // console.log(borrowFormRef.value);
    await borrowFormRef.value.validate();  // 等待表单校验
    try {
        // 尝试新增借阅
        await addBorrow(borrowForm.value.bookId, borrowForm.value.readerId, borrowForm.value.borrowDate, borrowForm.value.dueDate);
        ElMessage.success('借书成功');
        dialogVisible.value = false;  // 关闭对话框
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