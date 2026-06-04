<template>
    <div class="announcement-container">
        <div class="toolbar">
            <div class="toolbar-left">
                <el-input v-model="searchKeyword" placeholder="搜索公告..." clearable @keyup.enter="handleSearch"
                    :prefix-icon="Search" class="search-input" />
                <el-select v-model="priorityFilter" placeholder="全部优先级" clearable style="width: 120px;">
                    <el-option label="紧急" value="urgent" />
                    <el-option label="重要" value="important" />
                    <el-option label="普通" value="normal" />
                </el-select>
                <el-button type="primary" @click="handleSearch">筛选</el-button>
            </div>
            <div class="toolbar-right">
                <el-button type="danger" plain @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                    批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
                </el-button>
                <el-button type="success" @click="openAddDialog">发布公告</el-button>
            </div>
        </div>

        <UndoBar :visible="!!undoState" :message="undoState?.message || ''"
            @undo="handleUndo" @close="clearUndo" />

        <!-- 统计条 -->
        <div class="stats-bar" v-if="!loading && filteredList.length">
            <span>共 <strong>{{ filteredList.length }}</strong> 条公告</span>
            <span class="stats-dot urgent">紧急 {{ urgentCount }}</span>
            <span class="stats-dot important">重要 {{ importantCount }}</span>
            <span class="stats-dot normal">普通 {{ normalCount }}</span>
        </div>

        <!-- 加载骨架 -->
        <div v-if="loading" class="card-list">
            <div v-for="i in 4" :key="i" class="card-skeleton">
                <div class="sk-bar"></div>
                <div class="sk-line w-60"></div>
                <div class="sk-line w-80"></div>
                <div class="sk-line w-40"></div>
            </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-else-if="filteredList.length === 0" description="暂无通知公告" />

        <!-- 卡片列表 -->
        <div v-else class="card-list">
            <div
                v-for="item in paginatedList"
                :key="item.id"
                class="announce-card"
                :class="['priority-' + item.priority, { selected: selectedIds.includes(item.id) }]"
            >
                <div class="card-check" @click.stop="toggleSelect(item.id)">
                    <el-checkbox :model-value="selectedIds.includes(item.id)" />
                </div>
                <div class="card-body" @click="openDetailDialog(item)">
                    <div class="card-header">
                        <span class="card-priority-dot" :class="item.priority"></span>
                        <span class="card-priority-label">{{ priorityLabel(item.priority) }}</span>
                        <span class="card-date">{{ item.publishDate }}</span>
                    </div>
                    <h3 class="card-title">{{ item.title }}</h3>
                    <p class="card-preview">{{ item.content }}</p>
                </div>
                <div class="card-actions">
                    <el-button link type="primary" @click.stop="openEditDialog(item)">编辑</el-button>
                    <el-button link type="danger" @click.stop="handleDelete(item.id)">删除</el-button>
                </div>
            </div>
        </div>

        <PaginationBox
            v-if="filteredList.length > 0"
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredList.length"
        />

        <!-- 新增/编辑对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="42%">
            <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="公告标题" prop="title">
                    <el-input v-model="form.title" placeholder="请输入公告标题" />
                </el-form-item>
                <el-form-item label="优先级" prop="priority">
                    <el-radio-group v-model="form.priority">
                        <el-radio value="normal">普通</el-radio>
                        <el-radio value="important">重要</el-radio>
                        <el-radio value="urgent">紧急</el-radio>
                    </el-radio-group>
                </el-form-item>
                <el-form-item label="公告内容" prop="content">
                    <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitForm">确定</el-button>
            </template>
        </el-dialog>

        <!-- 详情对话框 -->
        <el-dialog v-model="detailVisible" :title="detailData?.title" width="38%">
            <div v-if="detailData" class="detail-body">
                <div class="detail-meta">
                    <span class="card-priority-dot" :class="detailData.priority"></span>
                    <el-tag :type="priorityTag(detailData.priority)" size="small" effect="dark">
                        {{ priorityLabel(detailData.priority) }}
                    </el-tag>
                    <span class="detail-info">{{ detailData.publisher }} 发布于 {{ detailData.publishDate }}</span>
                </div>
                <div class="detail-content">{{ detailData.content }}</div>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { Search } from '@element-plus/icons-vue';
import UndoBar from '../components/UndoBar.vue';
import PaginationBox from '../components/PaginationBox.vue';
import { getAnnouncements, addAnnouncement, updateAnnouncement, deleteAnnouncement, deleteAnnouncements, addLog } from '../api/mock';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();

const priorityMap = { normal: '普通', important: '重要', urgent: '紧急' };
const priorityLabel = (p) => priorityMap[p] || '普通';
const priorityTag = (p) => p === 'urgent' ? 'danger' : p === 'important' ? 'warning' : 'info';

const searchKeyword = ref('');
const priorityFilter = ref('');
const searchQuery = ref('');
const priorityQuery = ref('');

const list = ref([]);
const loading = ref(false);

const handleSearch = () => {
    searchQuery.value = searchKeyword.value;
    priorityQuery.value = priorityFilter.value;
};

const fetchList = async () => {
    loading.value = true;
    try {
        list.value = await getAnnouncements();
    } catch (error) {
        ElMessage.error('获取公告列表失败');
    } finally {
        loading.value = false;
    }
};

const filteredList = computed(() => {
    let result = list.value;
    if (searchQuery.value) {
        const kw = searchQuery.value.toLowerCase();
        result = result.filter(a => a.title.toLowerCase().includes(kw));
    }
    if (priorityQuery.value) {
        result = result.filter(a => a.priority === priorityQuery.value);
    }
    return result;
});

const urgentCount = computed(() => list.value.filter(a => a.priority === 'urgent').length);
const importantCount = computed(() => list.value.filter(a => a.priority === 'important').length);
const normalCount = computed(() => list.value.filter(a => a.priority === 'normal').length);

const currentPage = ref(1);
const pageSize = ref(6);
const paginatedList = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredList.value.slice(start, start + pageSize.value);
});
watch([searchQuery, priorityQuery], () => { currentPage.value = 1; });

const selectedIds = ref([]);
const toggleSelect = (id) => {
    const idx = selectedIds.value.indexOf(id);
    if (idx === -1) selectedIds.value.push(id);
    else selectedIds.value.splice(idx, 1);
};

const handleBatchDelete = () => {
    if (!selectedIds.value.length) return;
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 条公告吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(async () => {
        const deletedItems = list.value.reduce((acc, a, i) => {
            if (selectedIds.value.includes(a.id)) acc.push({ item: a, index: i });
            return acc;
        }, []);
        const count = await deleteAnnouncements(selectedIds.value);
        addLog(userStore.user_name, 'delete_announcement', `${count} 条公告`,
            deletedItems.map(d => d.item.title).join('、'));
        showUndo(`已删除 ${count} 条公告`, deletedItems);
        selectedIds.value = [];
        fetchList();
    }).catch(() => { });
};

// 详情
const detailVisible = ref(false);
const detailData = ref(null);
const openDetailDialog = (row) => {
    detailData.value = row;
    detailVisible.value = true;
};

// 新增/编辑
const dialogVisible = ref(false);
const dialogTitle = ref('');
const form = ref({ title: '', content: '', priority: 'normal' });
const formRef = ref(null);
let editingId = null;

const rules = {
    title: [{ required: true, message: '公告标题不能为空', trigger: 'blur' }],
    content: [{ required: true, message: '公告内容不能为空', trigger: 'blur' }],
    priority: [{ required: true, message: '请选择优先级', trigger: 'change' }]
};

const openAddDialog = () => {
    editingId = null;
    const today = new Date().toISOString().split('T')[0];
    form.value = { title: '', content: '', priority: 'normal', publishDate: today, publisher: userStore.user_name };
    if (formRef.value) formRef.value.resetFields();
    dialogTitle.value = '发布公告';
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    editingId = row.id;
    form.value = { title: row.title, content: row.content, priority: row.priority, publishDate: row.publishDate, publisher: row.publisher };
    dialogTitle.value = '编辑公告';
    dialogVisible.value = true;
};

const handleDelete = (id) => {
    ElMessageBox.confirm('确定要删除该公告吗？', '提示', { type: 'warning' })
        .then(async () => {
            const index = list.value.findIndex(a => a.id === id);
            const item = list.value[index];
            await deleteAnnouncement(id);
            if (item) {
                addLog(userStore.user_name, 'delete_announcement', `《${item.title}》`);
                showUndo(`已删除公告「${item.title}」`, [{ item, index }]);
            }
            fetchList();
        }).catch(() => { });
};

const submitForm = async () => {
    await formRef.value.validate();
    try {
        if (editingId) {
            await updateAnnouncement(editingId, form.value);
            addLog(userStore.user_name, 'edit_announcement', `《${form.value.title}》`);
            ElMessage.success('更新成功');
        } else {
            await addAnnouncement(form.value);
            addLog(userStore.user_name, 'add_announcement', `《${form.value.title}》`);
            ElMessage.success('发布成功');
        }
        dialogVisible.value = false;
        fetchList();
    } catch (error) {
        ElMessage.error(error.message);
    }
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
    const all = JSON.parse(localStorage.getItem('library_announcements')) || [];
    const sorted = [...undoState.value.items].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
        all.splice(index, 0, item);
    }
    localStorage.setItem('library_announcements', JSON.stringify(all));
    const restored = undoState.value.items;
    const detail = restored.length === 1
        ? `《${restored[0].item.title}》`
        : `${restored.length} 条公告`;
    addLog(userStore.user_name, 'restore_announcement', detail);
    clearUndo();
    fetchList();
    ElMessage.success('已撤销删除');
};

onMounted(() => {
    fetchList();
});

onUnmounted(() => {
    clearUndo();
});
</script>

<style lang="less" scoped>
.announcement-container {
    max-width: 860px;
    margin: 0 auto;

    .toolbar {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 10px;
        margin-bottom: 20px;

        .toolbar-left {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .toolbar-right {
            display: flex;
            gap: 8px;
        }

        .search-input {
            width: 220px;
        }
    }

    .stats-bar {
        display: flex;
        align-items: center;
        gap: 18px;
        margin-bottom: 14px;
        font-size: 13px;
        color: var(--el-text-color-secondary);

        strong {
            color: var(--el-text-color-primary);
        }

        .stats-dot::before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 4px;
            vertical-align: middle;
            position: relative;
            top: -1px;
        }

        .stats-dot.urgent::before  { background: #ef4444; }
        .stats-dot.important::before { background: #f59e0b; }
        .stats-dot.normal::before    { background: #909399; }
    }
}

.card-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.announce-card {
    display: flex;
    align-items: stretch;
    background: var(--el-bg-color);
    border-radius: 10px;
    border: 1px solid var(--el-border-color);
    border-left: 4px solid #909399;
    transition: all .2s ease;
    overflow: hidden;

    &:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, .08);
    }

    &.selected {
        background: var(--el-color-primary-light-9);
    }

    &.priority-urgent {
        border-left-color: #ef4444;
    }
    &.priority-important {
        border-left-color: #f59e0b;
    }
    &.priority-normal {
        border-left-color: #909399;
    }

    .card-check {
        display: flex;
        align-items: flex-start;
        padding: 18px 0 0 14px;
        flex-shrink: 0;
    }

    .card-body {
        flex: 1;
        padding: 16px 20px;
        cursor: pointer;
        min-width: 0;
        touch-action: manipulation;
    }

    .card-header {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 8px;
    }

    .card-priority-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;

        &.urgent     { background: #ef4444; }
        &.important  { background: #f59e0b; }
        &.normal     { background: #909399; }
    }

    .card-priority-label {
        font-size: 12px;
        font-weight: 600;
        letter-spacing: .5px;
    }

    &.priority-urgent .card-priority-label    { color: #dc2626; }
    &.priority-important .card-priority-label { color: #d97706; }
    &.priority-normal .card-priority-label    { color: #6b7280; }

    .card-date {
        margin-left: auto;
        font-size: 12px;
        color: var(--el-text-color-placeholder);
    }

    .card-title {
        margin: 0 0 6px;
        font-size: 16px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        line-height: 1.4;
        display: -webkit-box;
        -webkit-line-clamp: 1;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-preview {
        margin: 0;
        font-size: 14px;
        color: var(--el-text-color-secondary);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .card-actions {
        display: flex;
        flex-direction: column;
        justify-content: center;
        gap: 2px;
        padding: 0 14px;
        flex-shrink: 0;
        border-left: 1px solid var(--el-border-color-lighter);
        opacity: 0;
        transition: opacity .2s;
    }

    &:hover .card-actions {
        opacity: 1;
    }
}

.card-skeleton {
    background: var(--el-bg-color);
    border-radius: 10px;
    border: 1px solid var(--el-border-color);
    padding: 20px 24px;

    .sk-bar {
        height: 18px;
        width: 24%;
        background: var(--el-fill-color);
        border-radius: 4px;
        margin-bottom: 14px;
        animation: sk-pulse 1.4s ease-in-out infinite;
    }

    .sk-line {
        height: 13px;
        background: var(--el-fill-color-light);
        border-radius: 3px;
        margin-bottom: 8px;
        animation: sk-pulse 1.4s ease-in-out infinite;

        &.w-60 { width: 60%; }
        &.w-80 { width: 80%; }
        &.w-40 { width: 40%; }
    }
}

@keyframes sk-pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: .4; }
}

@media (prefers-reduced-motion: reduce) {
    .announce-card {
        transition: none;
        &:hover { transform: none; }
    }
    .card-skeleton .sk-bar,
    .card-skeleton .sk-line {
        animation: none;
    }
}

.detail-body {
    .detail-meta {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 18px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--el-border-color);

        .detail-info {
            color: var(--el-text-color-secondary);
            font-size: 13px;
            margin-left: auto;
        }
    }

    .detail-content {
        line-height: 1.9;
        white-space: pre-wrap;
        color: var(--el-text-color-regular);
        font-size: 15px;
    }
}

@media (max-width: 767px) {
    .announcement-container {
        .toolbar {
            flex-direction: column;
            align-items: stretch;

            .toolbar-left {
                flex-wrap: wrap;
                .search-input { width: 100%; flex: 1; }
            }

            .toolbar-right {
                justify-content: flex-end;
            }
        }
    }

    .announce-card {
        .card-actions {
            opacity: 1;
            padding: 0 10px;

            .el-button {
                min-height: 44px;
                min-width: 44px;
            }
        }

        .card-body {
            padding: 14px;
        }

        .card-check {
            padding: 18px 0 0 10px;

            :deep(.el-checkbox) {
                min-height: 44px;
                min-width: 44px;
                display: flex;
                align-items: center;
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
