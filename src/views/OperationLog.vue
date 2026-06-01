<template>
    <div class="log-container">
        <div class="search-area">
            <el-select v-model="actionFilter" placeholder="操作类型" clearable style="width: 140px;">
                <el-option v-for="a in actionOptions" :key="a.value" :label="a.label" :value="a.value" />
            </el-select>
            <el-input v-model="keyword" placeholder="搜索目标/详情" clearable @keyup.enter="refresh" style="width: 200px;" />
            <div class="date-picker-wrap">
                <el-date-picker
                    v-model="dateRange"
                    type="daterange"
                    range-separator="至"
                    start-placeholder="开始日期"
                    end-placeholder="结束日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                />
            </div>
            <el-button type="primary" @click="refresh">搜索</el-button>
            <el-popconfirm title="确定要清空所有操作日志吗？" @confirm="handleClear">
                <template #reference>
                    <el-button type="danger" plain>清空日志</el-button>
                </template>
            </el-popconfirm>
        </div>

        <div class="table-wrapper">
            <el-table :data="paginatedLogs" border stripe v-loading="loading" max-height="calc(100vh - 260px)">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="time" label="操作时间" width="170" />
                <el-table-column prop="operator" label="操作人" width="110" />
                <el-table-column prop="action" label="操作类型" width="120">
                    <template #default="{ row }">
                        <el-tag :type="actionTagType(row.action)" size="small">
                            {{ actionLabel(row.action) }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="target" label="操作对象" min-width="160" show-overflow-tooltip />
                <el-table-column prop="detail" label="详情" min-width="120" show-overflow-tooltip />
            </el-table>
            <div class="pagination-wrapper">
                <el-pagination
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]"
                    :total="filteredLogs.length"
                    layout="total, sizes, prev, pager, next, jumper"
                    background
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getLogs, clearLogs } from '../api/mock';
import { ElMessage } from 'element-plus';

const logs = ref([]);
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);

const actionFilter = ref('');
const keyword = ref('');
const dateRange = ref(null);

const actionOptions = [
    { label: '新增图书', value: 'add_book' },
    { label: '编辑图书', value: 'edit_book' },
    { label: '删除图书', value: 'delete_book' },
    { label: '批量导入图书', value: 'import_books' },
    { label: '借书', value: 'borrow' },
    { label: '归还', value: 'return' },
    { label: '编辑借阅', value: 'edit_borrow' },
    { label: '删除借阅', value: 'delete_borrow' },
    { label: '新增读者', value: 'add_reader' },
    { label: '编辑读者', value: 'edit_reader' },
    { label: '删除读者', value: 'delete_reader' },
    { label: '批量导入读者', value: 'import_readers' },
    { label: '新增管理员', value: 'add_admin' },
    { label: '编辑管理员', value: 'edit_admin' },
    { label: '删除管理员', value: 'delete_admin' },
    { label: '保存设置', value: 'save_settings' },
    { label: '缴纳罚款', value: 'pay_fine' }
];

const actionLabel = (action) => {
    const found = actionOptions.find(a => a.value === action);
    return found ? found.label : action;
};

const actionTagType = (action) => {
    if (action.includes('delete')) return 'danger';
    if (action.includes('add') || action.includes('import') || action === 'borrow') return 'success';
    if (action.includes('edit') || action === 'return') return 'warning';
    if (action === 'pay_fine') return 'success';
    return 'info';
};

const filteredLogs = computed(() => {
    let result = logs.value;

    if (actionFilter.value) {
        result = result.filter(l => l.action === actionFilter.value);
    }

    if (keyword.value) {
        const kw = keyword.value.toLowerCase();
        result = result.filter(l =>
            (l.target && l.target.toLowerCase().includes(kw)) ||
            (l.detail && l.detail.toLowerCase().includes(kw))
        );
    }

    if (dateRange.value && dateRange.value.length === 2) {
        const [start, end] = dateRange.value;
        result = result.filter(l => {
            const d = l.time.split(' ')[0];
            return d >= start && d <= end;
        });
    }

    return result;
});

const paginatedLogs = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredLogs.value.slice(start, start + pageSize.value);
});

watch([actionFilter, keyword, dateRange], () => { currentPage.value = 1; });

const refresh = async () => {
    loading.value = true;
    try {
        logs.value = await getLogs();
    } catch {
        ElMessage.error('获取日志失败');
    } finally {
        loading.value = false;
    }
};

const handleClear = async () => {
    await clearLogs();
    ElMessage.success('日志已清空');
    await refresh();
};

onMounted(refresh);
</script>

<style lang="less" scoped>
.log-container {
    .search-area {
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;

        .date-picker-wrap {
            width: 320px;

            :deep(.el-date-editor) {
                width: 100% !important;
            }
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
}

@media (max-width: 767px) {
    .log-container .search-area {
        .el-input, .el-select, .date-picker-wrap {
            width: 100% !important;
        }
    }
}
</style>
