<template>
    <div class="booklist-container">
        <div class="search-area">
            <el-input v-model="searchKeyword" placeholder="按书名/作者搜索" clearable />
            <el-button type="primary" @click="fetchBooks" class="search-btn">搜索</el-button>
            <el-button type="success" @click="openAddDialog">+ 新增图书</el-button>
            <el-button type="warning" @click="openImportDialog">批量导入</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <div class="table-wrapper">
            <el-table :data="paginatedBooks" border stripe v-loading="loading" @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
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
            <div class="pagination-wrapper">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="filteredBooks.length"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                />
            </div>
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

        <!-- 批量导入对话框 -->
        <el-dialog v-model="importDialogVisible" title="批量导入图书" width="40%">
            <div class="import-tips">
                <p>支持 CSV 或 JSON 文件格式，每行一条记录。</p>
                <p>CSV 列顺序：书名, 作者, 出版社, 数量</p>
                <el-button link type="primary" @click="downloadBookTemplate">下载 CSV 模板</el-button>
            </div>
            <el-upload
                ref="uploadRef"
                :auto-upload="false"
                :limit="1"
                accept=".csv,.json"
                :on-change="handleFileChange"
                :on-remove="() => { importFile = null; }"
                drag
            >
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="previewData.length" class="preview-table">
                <p>预览（共 {{ previewData.length }} 条）</p>
                <el-table :data="previewData.slice(0, 5)" border size="small" max-height="200">
                    <el-table-column prop="title" label="书名" />
                    <el-table-column prop="author" label="作者" />
                    <el-table-column prop="publisher" label="出版社" />
                    <el-table-column prop="quantity" label="数量" width="80" />
                </el-table>
                <p v-if="previewData.length > 5" class="preview-more">...还有 {{ previewData.length - 5 }} 条</p>
            </div>
            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitImport" :disabled="!importFile">确认导入</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import { getBooks, deleteBook, updateBook, addBook, deleteBooks, importBooks } from '../api/mock';

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

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedBooks = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredBooks.value.slice(start, start + pageSize.value);
});
watch(searchKeyword, () => { currentPage.value = 1; });

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

// 批量选择
const selectedIds = ref([]);
const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

// 批量删除
const handleBatchDelete = () => {
    if (!selectedIds.value.length) return;
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 本图书吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(async () => {
        try {
            const count = await deleteBooks(selectedIds.value);
            ElMessage.success(`成功删除 ${count} 本图书`);
            fetchBooks();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => {});
};

// 批量导入
const importDialogVisible = ref(false);
const importFile = ref(null);
const previewData = ref([]);
const uploadRef = ref(null);

const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
    });
};

const parseJSON = (text) => {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
};

const handleFileChange = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const isCSV = file.name.endsWith('.csv');
            const parsed = isCSV ? parseCSV(text) : parseJSON(text);
            if (!parsed.length) {
                ElMessage.warning('文件中没有有效数据');
                previewData.value = [];
                importFile.value = null;
                return;
            }
            previewData.value = parsed.map(item => ({
                title: item.title || item['书名'] || '',
                author: item.author || item['作者'] || '',
                publisher: item.publisher || item['出版社'] || '',
                quantity: Number(item.quantity ?? item['数量']) || 0
            }));
            importFile.value = file;
        } catch {
            ElMessage.error('文件格式错误，请检查文件内容');
            previewData.value = [];
            importFile.value = null;
        }
    };
    reader.readAsText(file.raw);
};

const openImportDialog = () => {
    importFile.value = null;
    previewData.value = [];
    importDialogVisible.value = true;
};

const submitImport = async () => {
    if (!previewData.value.length) return;
    try {
        const count = await importBooks(previewData.value);
        ElMessage.success(`成功导入 ${count} 本图书`);
        importDialogVisible.value = false;
        fetchBooks();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

const downloadBookTemplate = () => {
    const csvContent = 'title,author,publisher,quantity\n示例书名,示例作者,示例出版社,10';
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '图书导入模板.csv';
    link.click();
    URL.revokeObjectURL(link.href);
};

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

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
    }

    .import-tips {
        margin-bottom: 16px;
        p {
            margin: 4px 0;
            font-size: 14px;
            color: #666;
        }
    }

    .preview-table {
        margin-top: 16px;
        p {
            margin: 4px 0;
            font-size: 14px;
        }
        .preview-more {
            color: #999;
            text-align: center;
        }
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