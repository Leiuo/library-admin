<template>
    <div class="booklist-container">
        <div class="search-area">
            <el-input v-model="searchKeyword" placeholder="按书名/作者搜索" clearable />
            <el-button type="primary" @click="fetchBooks" class="search-btn">搜索</el-button>
            <el-button type="success" @click="openAddDialog">+ 新增图书</el-button>
        </div>

        <div class="table-wrapper">
            <el-table :data="filteredBooks" border stripe>
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="title" label="书名" />
                <el-table-column prop="author" label="作者" />
                <el-table-column prop="publisher" label="出版社" />
                <el-table-column prop="quantity" label="数量" width="80" />
                <el-table-column prop="status" label="状态" width="100">
                    <template #default="{ row }">
                        <el-tag :type="row.quantity > 0 ? 'success' : 'danger'">
                            {{ row.quantity > 0 ? '可借' : '不可借' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="bookForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="书名" prop="title">
                    <el-input v-model="bookForm.title" />
                </el-form-item>
                <el-form-item label="作者" prop="author">
                    <el-input v-model="bookForm.author" />
                </el-form-item>
                <el-form-item label="出版社" prop="publisher">
                    <el-input v-model="bookForm.publisher" />
                </el-form-item>
                <el-form-item label="数量" prop="quantity">
                    <el-input v-model.number="bookForm.quantity" type="number" min="0" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getBooks, deleteBook, updateBook, addBook } from '../api/mock';

const searchKeyword = ref('');
const books = ref([]);
const loading = ref(false);  // 加载状态，防止重复请求

const fetchBooks = async () => {
    loading.value = true;
    try {
        // console.log(await getBooks());
        books.value = await getBooks();
    } catch (error) {
        ElMessage.error('获取图书列表失败');
    } finally {
        loading.value = false;
    }
};

const filteredBooks = computed(() => {
    if (!searchKeyword.value) return books.value;

    const keyword = searchKeyword.value.toLowerCase();
    return books.value.filter(book =>
        book.title.toLowerCase().includes(keyword) || book.author.toLowerCase().includes(keyword)
    )
});

const dialogVisible = ref(false);
const dialogTitle = ref('');
const bookForm = ref({
    title: '',
    author: '',
    publisher: '',
    quantity: 0
});
const formRef = ref(null);
let editingId = null;  // 当前正在编辑的图书编号

const rules = {
    title: [{ required: true, message: '书名不能为空', tigger: 'blur' }],
    author: [{ required: true, message: '作者不能为空', tigger: 'blur' }],
    publisher: [{ required: true, message: '出版社不能为空', tigger: 'blur' }],
    quantity: [{ type: 'number', min: 0, message: '数量必须大于等于0', trigger: 'change' }]
};

const openAddDialog = () => {
    editingId = null;
    bookForm.value = { title: '', author: '', publisher: '', quantity: 0 };
    if (formRef.value) {
        formRef.value.resetFields();
    }
    dialogTitle.value = '新增图书';
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    dialogTitle.value = '编辑图书';
    bookForm.value = { title: row.title, author: row.author, publisher: row.publisher, quantity: row.quantity };
    editingId = row.id;
    dialogVisible.value = true;
};

const handleDelete = (id) => {
    // ElMessageBox.confirm('提示', '确定要删除该图书吗？');
    ElMessageBox.confirm('你确定要删除该图书吗？', '提示', {
        type: 'warning',
    }).then(async () => {
        try {
            await deleteBook(id);
            ElMessage.success('删除成功');
            fetchBooks();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => { });

};

const submitForm = async () => {
    // console.log(formRef);
    await formRef.value.validate();  // 等待表单校验通过

    try {
        if (editingId) {  // 如果是编辑图书，更新当前图书
            await updateBook(editingId, bookForm.value);
            ElMessage.success('更新成功');
        } else {  // 如果是新增图书，将图书加到列表中
            await addBook(bookForm.value);
            ElMessage.success('添加成功');
        }
    } catch (error) {
        ElMessage.error(error.message);
    }

    dialogVisible.value = false;  // 关闭对话框
    fetchBooks();
}

onMounted(() => {
    fetchBooks();
});
</script>

<style lang="less" scoped>
.booklist-container {
    .search-area {
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .el-input {
            width: 250px;
        }
    }

    .table-wrapper {
        overflow-x: auto;
    }
}

@media (max-width: 767px) {
    .booklist-container {
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