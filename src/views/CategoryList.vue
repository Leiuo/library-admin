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
            <el-empty v-else-if="flatDisplayList.length === 0" description="暂无分类数据" />
            <el-table v-else :data="flatDisplayList" row-key="id"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
                <el-table-column label="ID" width="100">
                    <template #default="{ row }">
                        <span :style="{ paddingLeft: row.level * 24 + 'px', whiteSpace: 'nowrap' }">
                            <span v-if="row.hasChildren" class="tree-toggle"
                                @click="toggleExpand(row.id)">
                                <el-icon :size="14">
                                    <ArrowRight v-if="!expandedIds.includes(row.id)" />
                                    <ArrowDown v-else />
                                </el-icon>
                            </span>
                            <span v-else class="tree-toggle tree-toggle--placeholder"></span>
                            {{ row.id }}
                        </span>
                    </template>
                </el-table-column>
                <el-table-column prop="name" label="分类名称" width="160">
                    <template #default="{ row }">
                        <el-tag :type="row.parentId == null ? 'primary' : 'info'">
                            {{ row.name }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
                <el-table-column prop="bookCount" label="不同图书数量" width="120" align="center" />
                <el-table-column label="操作" width="120">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="categoryForm" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="父分类" prop="parentId">
                    <el-tree-select
                        v-model="categoryForm.parentId"
                        :data="parentOptions"
                        :props="{ label: 'name', children: 'children', value: 'id' }"
                        placeholder="无（一级分类）"
                        clearable
                        check-strictly
                        value-key="id"
                        style="width: 100%"
                    />
                </el-form-item>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { ArrowRight, ArrowDown } from '@element-plus/icons-vue';
import UndoBar from '../components/UndoBar.vue';
import TableSkeleton from '../components/TableSkeleton.vue';
import { getCategories, addCategory, updateCategory, deleteCategory, deleteCategories } from '../api/categories';
import { addLog } from '../api/logs';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const searchKeyword = ref('');
const searchQuery = ref('');
const categories = ref([]);
const loading = ref(false);

const buildTree = (flatList) => {
    const map = {};
    const roots = [];
    flatList.forEach(item => {
        map[item.id] = { ...item, children: [] };
    });
    flatList.forEach(item => {
        if (item.parentId != null && map[item.parentId]) {
            map[item.parentId].children.push(map[item.id]);
        } else {
            roots.push(map[item.id]);
        }
    });
    return roots;
};

const getAncestorIds = (id, flatList) => {
    const ids = [];
    let current = flatList.find(c => c.id === id);
    while (current && current.parentId != null) {
        ids.push(current.parentId);
        current = flatList.find(c => c.id === current.parentId);
    }
    return ids;
};

const getDescendantIds = (id, flatList) => {
    const children = flatList.filter(c => c.parentId === id);
    return children.reduce((acc, c) => acc.concat(c.id, getDescendantIds(c.id, flatList)), []);
};

const fetchCategories = async () => {
    loading.value = true;
    try {
        categories.value = await getCategories();
        expandedIds.value = [];
    } catch (error) {
        ElMessage.error('获取分类列表失败');
    } finally {
        loading.value = false;
    }
};

const categoryTree = computed(() => buildTree(categories.value));

// 展开/折叠状态
const expandedIds = ref([]);

const toggleExpand = (id) => {
    const idx = expandedIds.value.indexOf(id);
    if (idx >= 0) {
        expandedIds.value.splice(idx, 1);
    } else {
        expandedIds.value.push(id);
    }
};

// 将树扁平化为显示列表，根据展开状态决定是否包含子节点
const flattenForDisplay = (nodes, level, result) => {
    nodes.forEach(node => {
        const hasChildren = node.children && node.children.length > 0;
        const { children, ...rest } = node;
        result.push({ ...rest, level, hasChildren });
        if (hasChildren && expandedIds.value.includes(node.id)) {
            flattenForDisplay(node.children, level + 1, result);
        }
    });
};

// 搜索过滤：收集匹配节点 + 祖先 + 子孙，然后构建过滤树再扁平化
const flatDisplayList = computed(() => {
    let sourceTree;
    if (searchQuery.value) {
        const keyword = searchQuery.value.toLowerCase();
        const matched = categories.value.filter(c => c.name.toLowerCase().includes(keyword));
        const matchedIds = new Set(matched.map(c => c.id));
        matched.forEach(c => {
            getAncestorIds(c.id, categories.value).forEach(id => matchedIds.add(id));
            getDescendantIds(c.id, categories.value).forEach(id => matchedIds.add(id));
        });
        sourceTree = buildTree(categories.value.filter(c => matchedIds.has(c.id)));
    } else {
        sourceTree = categoryTree.value;
    }

    const result = [];
    flattenForDisplay(sourceTree, 0, result);
    return result;
});

const handleSearch = () => {
    searchQuery.value = searchKeyword.value;
};

// ---- 新增 / 编辑对话框 ----
const dialogVisible = ref(false);
const dialogTitle = ref('');
const categoryForm = ref({ parentId: null, name: '', description: '' });
const formRef = ref(null);
let editingId = null;

const rules = {
    name: [{ required: true, message: '分类名称不能为空', trigger: 'blur' }]
};

const parentOptions = computed(() => {
    if (editingId == null) return categoryTree.value;
    const excludeIds = new Set([editingId, ...getDescendantIds(editingId, categories.value)]);
    const filterTree = (nodes) => {
        return nodes
            .filter(n => !excludeIds.has(n.id))
            .map(n => ({ ...n, children: filterTree(n.children || []) }));
    };
    return filterTree(JSON.parse(JSON.stringify(categoryTree.value)));
});

const openAddDialog = () => {
    editingId = null;
    categoryForm.value = { parentId: null, name: '', description: '' };
    if (formRef.value) formRef.value.resetFields();
    dialogTitle.value = '新增分类';
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    editingId = row.id;
    categoryForm.value = { parentId: row.parentId ?? null, name: row.name, description: row.description || '' };
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
        const data = {
            name: categoryForm.value.name,
            description: categoryForm.value.description,
            parentId: categoryForm.value.parentId || null
        };
        if (editingId) {
            await updateCategory(editingId, data);
            addLog(userStore.user_name, 'edit_category', categoryForm.value.name);
            ElMessage.success('更新成功');
        } else {
            await addCategory(data);
            addLog(userStore.user_name, 'add_category', categoryForm.value.name);
            ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        fetchCategories();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

// ---- 批量删除 ----
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

// ---- 撤销删除 ----
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

.tree-toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    cursor: pointer;
    color: #909399;
    vertical-align: middle;
    border-radius: 4px;
    transition: background 0.2s;

    &:hover {
        background: #e5e7eb;
        color: #303133;
    }

    &--placeholder {
        visibility: hidden;
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
