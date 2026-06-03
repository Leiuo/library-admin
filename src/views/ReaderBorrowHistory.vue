<template>
    <div class="history-container">
        <div class="history-header">
            <el-button type="success" @click="returnReader">返回读者列表</el-button>
            <p>{{ reader ? `${reader.name} (${reader.cardNo}) 的借阅历史` : '加载中...' }}</p>
        </div>

        <div class="history-stat">
            <StatCard :icon="Collection" color="blue" :value="stats.totalBorrows || 0" label="累计借阅" />
            <StatCard :icon="Reading" color="orange" :value="stats.activeBorrows || 0" label="借出中" />
            <StatCard :icon="CircleCheckFilled" color="green" :value="stats.returnedBorrows || 0" label="已归还" />
            <StatCard :icon="WarningFilled" color="red" :value="stats.overdue || 0" label="逾期中" />
        </div>

        <div class="table-wrapper">
            <TableSkeleton v-if="loading" :rows="8" :cols="5" />
            <el-empty v-else-if="filteredBorrows.length === 0" description="暂无借阅记录" />
            <el-table v-else :data="paginatedBorrowsRecords" border stripe :row-class-name="rowClassName">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="bookTitle" label="图书名称" />
                <el-table-column prop="borrowDate" label="借书日期" />
                <el-table-column prop="dueDate" label="应还日期" />
                <el-table-column prop="status" label="状态" width="110">
                    <template #default="{ row }">
                        <el-tag :type="statusTagType(row)">
                            {{ statusText(row) }}
                        </el-tag>
                    </template>
                </el-table-column>
            </el-table>
            <PaginationBox
                v-if="filteredBorrows.length > 0"
                v-model:current-page="currentPage"
                v-model:page-size="pageSize"
                :total="filteredBorrows.length"
            />
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getReaders, getBorrows } from '../api/mock';
import { ElMessage } from 'element-plus';
import { Collection, Reading, CircleCheckFilled, WarningFilled } from '@element-plus/icons-vue';
import StatCard from '../components/StatCard.vue';
import PaginationBox from '../components/PaginationBox.vue';
import TableSkeleton from '../components/TableSkeleton.vue';

const router = useRouter();
const route = useRoute();

const reader = ref(null);
const filteredBorrows = ref([]);

const loading = ref(false);

const stats = reactive({
    totalBorrows: 0,
    activeBorrows: 0,
    returnedBorrows: 0,
    overdue: 0
})
const computeStats = () => {
    stats.totalBorrows = filteredBorrows.value.length;
    stats.activeBorrows = filteredBorrows.value.filter(borrow => borrow.status === 0 && borrow.dueDate >= today).length;
    stats.returnedBorrows = filteredBorrows.value.filter(borrow => borrow.status === 1).length;
    stats.overdue = filteredBorrows.value.filter(borrow => borrow.status === 0 && borrow.dueDate < today).length;
}

const fetchReader = async () => {
    // console.log(route.params.id);
    const readerId = Number(route.params.id);
    const readers = await getReaders();
    reader.value = readers.find(r => r.id === readerId) || null;
};

const returnReader = () => {
    router.push('/readers');
};

const fetchFilteredBorrows = async () => {
    loading.value = true;
    try {
        const allBorrows = await getBorrows();
        const readerId = Number(route.params.id);
        filteredBorrows.value = allBorrows.filter((b) => {
            return b.readerId === readerId;
        })
        computeStats();
    } catch (error) {
        ElMessage.error('获取借阅列表失败');
    } finally {
        loading.value = false;
    }
}

const currentPage = ref(1);
const pageSize = ref(10);
const paginatedBorrowsRecords = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredBorrows.value.slice(start, start + pageSize.value);
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

onMounted(() => {
    fetchReader();
    fetchFilteredBorrows();
});

watch(() => route.params.id, () => {
    currentPage.value = 1;
    fetchReader();
    fetchFilteredBorrows();
});
</script>

<style lang="less" scoped>
.history-container {
    .history-header {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 16px;
    }

    .history-stat {
        display: flex;
        gap: 10px;
        margin-bottom: 24px;
    }

    .table-wrapper {
        overflow-x: auto;
    }

    :deep(.overdue-row) {
        background-color: rgba(161, 11, 11, 0.159) !important;
    }
}
</style>
