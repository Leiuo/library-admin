<template>
    <div class="booklist-container">
        <div class="search-area">
            <el-input v-model="searchKeyword" placeholder="按书名/作者搜索" clearable @keyup.enter="handleSearch" />
            <el-tree-select v-model="categoryFilter" :data="categoryTree"
                :props="{ label: 'name', children: 'children', value: 'name' }"
                placeholder="全部分类" clearable check-strictly style="width: 180px;" />
            <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
            <el-button type="success" @click="openAddDialog">+ 新增图书</el-button>
            <el-button type="warning" @click="openImportDialog">批量导入</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <UndoBar :visible="!!undoState" :message="undoState?.message || ''"
            @undo="handleUndo" @close="clearUndo" />

        <div class="table-wrapper">
            <TableSkeleton v-if="loading" :rows="8" :cols="6" />
            <el-empty v-else-if="filteredBooks.length === 0" description="暂无图书数据" />
            <el-table v-else :data="paginatedBooks"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="title" label="书名" />
                <el-table-column prop="author" label="作者" />
                <el-table-column prop="publisher" label="出版社" />
                <el-table-column label="分类" width="160">
                    <template #default="{ row }">
                        <span v-if="row.category" style="font-size: 13px;">
                            <el-tag size="small" type="primary" style="margin-right: 2px;">{{ getParentName(row.category) }}</el-tag>
                            <span v-if="getParentName(row.category) !== row.category" style="color: #909399;">/</span>
                            <el-tag v-if="getParentName(row.category) !== row.category" size="small" type="info" style="margin-left: 2px;">{{ row.category }}</el-tag>
                        </span>
                        <el-tag v-else size="small" type="info">未分类</el-tag>
                    </template>
                </el-table-column>
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
            <PaginationBox
                v-if="filteredBooks.length > 0"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="filteredBooks.length"
            />
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
                <el-form-item label="分类" prop="category">
                    <el-tree-select v-model="bookForm.category" :data="categoryTree"
                        :props="{ label: 'name', children: 'children', value: 'name' }"
                        placeholder="请选择分类" filterable allow-create check-strictly
                        style="width: 100%;" />
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
                <p>CSV 列顺序：书名, 作者, 出版社, 分类, 数量</p>
                <el-button link type="primary" @click="downloadBookTemplate">下载 CSV 模板</el-button>
            </div>
            <el-upload ref="uploadRef" :auto-upload="false" :limit="1" accept=".csv,.json" :on-change="handleFileChange"
                :on-remove="() => { importFile = null; }" drag>
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="previewData.length" class="preview-table">
                <p>预览（共 {{ previewData.length }} 条）</p>
                <el-table :data="previewData.slice(0, 5)" size="small" max-height="200">
                    <el-table-column prop="title" label="书名" />
                    <el-table-column prop="author" label="作者" />
                    <el-table-column prop="publisher" label="出版社" />
                    <el-table-column prop="category" label="分类" width="90" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled } from '@element-plus/icons-vue';
import UndoBar from '../components/UndoBar.vue';
import PaginationBox from '../components/PaginationBox.vue';
import TableSkeleton from '../components/TableSkeleton.vue';
import { getBooks, deleteBook, updateBook, addBook, deleteBooks, importBooks } from '../api/books';
import { getCategories } from '../api/categories';
import { addLog } from '../api/logs';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

// 分类从集中式分类数据和图书数据中合并提取
const centralCategories = ref([]);
const categories = computed(() => {
    const set = new Set(centralCategories.value.map(c => c.name));
    books.value.forEach(b => { if (b.category) set.add(b.category); });
    return [...set].sort();
});

// 分类树（用于 el-tree-select）
const categoryTree = computed(() => {
    const map = {};
    const roots = [];
    centralCategories.value.forEach(c => {
        map[c.id] = { ...c, children: [] };
    });
    centralCategories.value.forEach(c => {
        if (c.parentId != null && map[c.parentId]) {
            map[c.parentId].children.push(map[c.id]);
        } else {
            roots.push(map[c.id]);
        }
    });
    return roots;
});

// 获取某分类名称的父分类名称（没有父分类则返回自身）
const getParentName = (catName) => {
    const cat = centralCategories.value.find(c => c.name === catName);
    if (!cat || cat.parentId == null) return catName;
    const parent = centralCategories.value.find(c => c.id === cat.parentId);
    return parent ? parent.name : catName;
};

const searchKeyword = ref('');
const categoryFilter = ref('');
const searchQuery = ref('');
const categoryQuery = ref('');
const books = ref([]);
const loading = ref(false);  // 加载状态，防止重复请求

const handleSearch = () => {
    searchQuery.value = searchKeyword.value;
    categoryQuery.value = categoryFilter.value;
};

const fetchBooks = async () => {
    loading.value = true;
    try {
        const [bookData, catData] = await Promise.all([getBooks(), getCategories()]);
        books.value = bookData;
        centralCategories.value = catData;
    } catch (error) {
        ElMessage.error('获取图书列表失败');
    } finally {
        loading.value = false;
    }
};

const filteredBooks = computed(() => {
    let result = books.value;

    if (searchQuery.value) {
        const keyword = searchQuery.value.toLowerCase();
        result = result.filter(book =>
            book.title.toLowerCase().includes(keyword) || book.author.toLowerCase().includes(keyword)
        );
    }

    if (categoryQuery.value) {
        result = result.filter(book => book.category === categoryQuery.value);
    }

    return result;
});

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedBooks = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredBooks.value.slice(start, start + pageSize.value);
});
watch([searchQuery, categoryQuery], () => { currentPage.value = 1; });

const dialogVisible = ref(false);
const dialogTitle = ref('');
const bookForm = ref({
    title: '',
    author: '',
    publisher: '',
    category: '',
    quantity: 0
});
const formRef = ref(null);
let editingId = null;  // 当前正在编辑的图书编号

const rules = {
    title: [{ required: true, message: '书名不能为空', trigger: 'blur' }],
    author: [{ required: true, message: '作者不能为空', trigger: 'blur' }],
    publisher: [{ required: true, message: '出版社不能为空', trigger: 'blur' }],
    quantity: [{ type: 'number', min: 0, message: '数量必须大于等于0', trigger: 'change' }]
};

const openAddDialog = () => {
    editingId = null;
    bookForm.value = { title: '', author: '', publisher: '', category: '', quantity: 0 };
    if (formRef.value) {
        formRef.value.resetFields();
    }
    dialogTitle.value = '新增图书';
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    dialogTitle.value = '编辑图书';
    bookForm.value = { title: row.title, author: row.author, publisher: row.publisher, category: row.category || '', quantity: row.quantity };
    editingId = row.id;
    dialogVisible.value = true;
};

const handleDelete = (id) => {
    ElMessageBox.confirm('你确定要删除该图书吗？', '提示', {
        type: 'warning',
    }).then(async () => {
        try {
            const index = books.value.findIndex(b => b.id === id);
            const book = books.value[index];
            await deleteBook(id);
            if (book) {
                addLog(userStore.user_name, 'delete_book', `《${book.title}》`);
                showUndo(`已删除《${book.title}》`, [{ item: book, index }]);
            }
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
            addLog(userStore.user_name, 'edit_book', `《${bookForm.value.title}》`);
            ElMessage.success('更新成功');
        } else {  // 如果是新增图书，将图书加到列表中
            await addBook(bookForm.value);
            addLog(userStore.user_name, 'add_book', `《${bookForm.value.title}》`);
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
    // console.log(selectedIds.value);
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
            const deletedBooks = books.value.reduce((acc, b, i) => {
                if (selectedIds.value.includes(b.id)) acc.push({ item: b, index: i });
                return acc;
            }, []);
            console.log("删掉的图书", deletedBooks);
            const count = await deleteBooks(selectedIds.value);
            addLog(userStore.user_name, 'delete_book', `${count} 本图书`,
                deletedBooks.map(d => `《${d.item.title}》`).join('、'));
            showUndo(`已删除 ${count} 本图书`, deletedBooks);
            fetchBooks();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => { });
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
    const books = JSON.parse(localStorage.getItem('library_books')) || [];
    const sorted = [...undoState.value.items].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
        books.splice(index, 0, item);
    }
    localStorage.setItem('library_books', JSON.stringify(books));
    const restoredItems = undoState.value.items;
    const detail = restoredItems.length === 1
        ? `《${restoredItems[0].item.title}》`
        : `${restoredItems.length} 本图书`;
    addLog(userStore.user_name, 'restore_book', detail);
    clearUndo();
    fetchBooks();
    ElMessage.success('已撤销删除');
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
                category: item.category || item['分类'] || '',
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
    if (uploadRef.value) {
        uploadRef.value.clearFiles();
    }
    importDialogVisible.value = true;
};

const submitImport = async () => {
    if (!previewData.value.length) return;
    try {
        const count = await importBooks(previewData.value);
        addLog(userStore.user_name, 'import_books', `${count} 本图书`);
        ElMessage.success(`成功导入 ${count} 本图书`);
        importDialogVisible.value = false;
        fetchBooks();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

const downloadBookTemplate = () => {
    const csvContent = 'title,author,publisher,category,quantity\n示例书名,示例作者,示例出版社,科技编程,10';
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


    .import-tips {
        margin-bottom: 16px;

        p {
            margin: 4px 0;
            font-size: 14px;
            color: var(--el-text-color-regular);
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

