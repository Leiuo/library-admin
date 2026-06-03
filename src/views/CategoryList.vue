<template>
    <div class="category-container">
        <div class="search-area">
            <el-input v-model="searchKeyword" placeholder="按分类名称搜索" clearable @keyup.enter="handleSearch" />
            <el-button type="primary" @click="handleSearch" class="search-btn">搜索</el-button>
            <el-button type="success" @click="openAddDialog">+ 新增分类</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <UndoBar :visible="!!undoState" :message="undoState?.message || ''"
            @undo="handleUndo" @close="clearUndo" />

        <div class="table-wrapper">
            <TableSkeleton v-if="loading" :rows="8" :cols="4" />
            <el-empty v-else-if="filteredCategories.length === 0" description="暂无分类数据" />
            <el-table v-else :data="paginatedCategories" border stripe
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
                <el-table-column prop="id" label="ID" width="70" />
                <el-table-column prop="name" label="分类名称" width="140">
                    <template #default="{ row }">
                        <el-tag size="default" type="primary">{{ row.name }}</el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="bookCount" label="图书数量" width="100" align="center" />
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <PaginationBox
                v-if="filteredCategories.length > 0"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="filteredCategories.length"
            />
        </div>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="分类名称" prop="name">
                    <el-input v-model="categoryForm.name" placeholder="请输入分类名称" />
                </el-form-item>
                <el-form-item label="描述" prop="description">
                    <el-input v-model="categoryForm.description" placeholder="可选，分类描述说明" />
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
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import UndoBar from '../components/UndoBar.vue';
import PaginationBox from '../components/PaginationBox.vue';
import TableSkeleton from '../components/TableSkeleton.vue';
import { getCategories, addCategory, updateCategory, deleteCategory, deleteCategories, addLog } from '../api/mock';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const searchKeyword = ref('');
const searchQuery = ref('');
const categories = ref([]);
const loading = ref(false);

const handleSearch = () => {
    searchQuery.value = searchKeyword.value;
};

const fetchCategories = async () => {
    loading.value = true;
    try {
        categories.value = await getCategories();
    } catch (error) {
        ElMessage.error('获取分类列表失败');
    } finally {
        loading.value = false;
    }
};

const filteredCategories = computed(() => {
    if (!searchQuery.value) return categories.value;
    const keyword = searchQuery.value.toLowerCase();
    return categories.value.filter(c => c.name.toLowerCase().includes(keyword));
});

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedCategories = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredCategories.value.slice(start, start + pageSize.value);
});
watch(searchQuery, () => { currentPage.value = 1; });

const dialogVisible = ref(false);
const dialogTitle = ref('');
const categoryForm = ref({ name: '', description: '' });
const formRef = ref(null);
let editingId = null;

const rules = {
    name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }]
};

const openAddDialog = () => {
    editingId = null;
    categoryForm.value = { name: '', description: '' };
    if (formRef.value) formRef.value.resetFields();
    dialogTitle.value = '新增分类';
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    editingId = row.id;
    categoryForm.value = { name: row.name, description: row.description || '' };
    dialogTitle.value = '编辑分类';
    dialogVisible.value = true;
};

const handleDelete = (id) => {
    ElMessageBox.confirm('你确定要删除该分类吗？', '提示', { type: 'warning' })
        .then(async () => {
            try {
                const index = categories.value.findIndex(c => c.id === id);
                const cat = categories.value[index];
                await deleteCategory(id);
                if (cat) {
                    addLog(userStore.user_name, 'delete_category', cat.name);
                    showUndo(`已删除分类「${cat.name}」`, [{ item: cat, index }]);
                }
                fetchCategories();
            } catch (error) {
                ElMessage.error(error.message);
            }
        }).catch(() => { });
};

const submitForm = async () => {
    await formRef.value.validate();
    try {
        if (editingId) {
            await updateCategory(editingId, categoryForm.value);
            addLog(userStore.user_name, 'edit_category', categoryForm.value.name);
            ElMessage.success('更新成功');
        } else {
            await addCategory(categoryForm.value);
            addLog(userStore.user_name, 'add_category', categoryForm.value.name);
            ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        fetchCategories();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

const selectedIds = ref([]);
const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

const handleBatchDelete = () => {
    if (!selectedIds.value.length) return;
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 个分类吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(async () => {
        try {
            const deletedItems = categories.value.reduce((acc, c, i) => {
                if (selectedIds.value.includes(c.id)) acc.push({ item: c, index: i });
                return acc;
            }, []);
            const count = await deleteCategories(selectedIds.value);
            addLog(userStore.user_name, 'delete_category', `${count} 个分类`,
                deletedItems.map(d => d.item.name).join('、'));
            showUndo(`已删除 ${count} 个分类`, deletedItems);
            fetchCategories();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => { });
};

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
    const all = JSON.parse(localStorage.getItem('library_categories')) || [];
    const sorted = [...undoState.value.items].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
        all.splice(index, 0, item);
    }
    localStorage.setItem('library_categories', JSON.stringify(all));
    const restored = undoState.value.items;
    const detail = restored.length === 1
        ? restored[0].item.name
        : `${restored.length} 个分类`;
    addLog(userStore.user_name, 'restore_category', detail);
    clearUndo();
    fetchCategories();
    ElMessage.success('已撤销删除');
};

onMounted(() => {
    fetchCategories();
});

onUnmounted(() => {
    clearUndo();
});
</script>

<style lang="less" scoped>
.category-container {
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
    .category-container {
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
