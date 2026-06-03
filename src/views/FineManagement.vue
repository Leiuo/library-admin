<template>
    <div class="fine-container">
        <!-- 统计卡片 -->
        <div class="stats-row">
            <StatCard :icon="WarningFilled" color="red" :value="stats.overdueCount" label="逾期借阅" />
            <StatCard :icon="Money" color="orange" :value="stats.unpaidAmount.toFixed(1)" label="未缴罚款（元）" />
            <StatCard :icon="CircleCheckFilled" color="green" :value="stats.paidAmount.toFixed(1)" label="已缴罚款（元）" />
        </div>

        <!-- 搜索/筛选 -->
        <div class="search-area">
            <el-select v-model="payFilter" placeholder="缴费状态" clearable style="width: 130px;">
                <el-option label="未缴纳" value="unpaid" />
                <el-option label="已缴纳" value="paid" />
            </el-select>
            <el-input v-model="keyword" placeholder="搜索书名/读者名" clearable style="width: 200px;" />
            <el-button type="primary" @click="payFilter = payFilter; keyword = keyword">搜索</el-button>
            <el-button type="warning" :disabled="selectedIds.length === 0" @click="handleBatchPay">
                缴纳罚款 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <!-- 表格 -->
        <div class="table-wrapper">
            <el-table :data="paginatedFines" border stripe v-loading="loading"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" :selectable="isUnpaid" />
                <el-table-column prop="bookTitle" label="图书名称" show-overflow-tooltip />
                <el-table-column prop="readerName" label="借阅人" width="140" />
                <el-table-column prop="dueDate" label="应还日期" width="120" />
                <el-table-column label="逾期天数" width="100">
                    <template #default="{ row }">
                        <span class="overdue-days">{{ row.daysOverdue }} 天</span>
                    </template>
                </el-table-column>
                <el-table-column label="罚款金额" width="120">
                    <template #default="{ row }">
                        <span class="fine-amount">{{ row.fineAmount.toFixed(1) }} 元</span>
                    </template>
                </el-table-column>
                <el-table-column label="缴费状态" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.paid ? 'success' : 'danger'" size="small">
                            {{ row.paid ? '已缴纳' : '未缴纳' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column label="操作" width="100">
                    <template #default="{ row }">
                        <el-button v-if="!row.paid" link type="primary" @click="handlePay(row)">
                            缴纳
                        </el-button>
                        <span v-else>-</span>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-wrapper">
                <PaginationBox
                    v-model:current-page="currentPage"
                    v-model:page-size="pageSize"
                    :total="filteredFines.length"
                />
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { getBorrows, getSettings, getPaidFines, payFines, addLog } from '../api/mock';
import { useUserStore } from '../stores/user';
import { WarningFilled, Money, CircleCheckFilled } from '@element-plus/icons-vue';
import StatCard from '../components/StatCard.vue';
import PaginationBox from '../components/PaginationBox.vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();

const loading = ref(false);
const borrows = ref([]);
const settings = ref({ overdueFinePerDay: 0.5 });
const paidIds = ref([]);

const payFilter = ref('');
const keyword = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const selectedIds = ref([]);

const today = new Date().toISOString().split('T')[0];

const fineData = computed(() => {
    return borrows.value
        .filter(b => b.status === 0 && b.dueDate < today)
        .map(b => {
            const days = Math.floor((new Date(today) - new Date(b.dueDate)) / (1000 * 60 * 60 * 24));
            return {
                ...b,
                daysOverdue: days,
                fineAmount: days * settings.value.overdueFinePerDay,
                paid: paidIds.value.includes(b.id)
            };
        });
});

const stats = computed(() => {
    const unpaid = fineData.value.filter(f => !f.paid);
    const paid = fineData.value.filter(f => f.paid);
    return {
        overdueCount: fineData.value.length,
        unpaidAmount: unpaid.reduce((sum, f) => sum + f.fineAmount, 0),
        paidAmount: paid.reduce((sum, f) => sum + f.fineAmount, 0)
    };
});

const filteredFines = computed(() => {
    let result = fineData.value;
    if (payFilter.value === 'unpaid') result = result.filter(f => !f.paid);
    if (payFilter.value === 'paid') result = result.filter(f => f.paid);
    if (keyword.value) {
        const kw = keyword.value.toLowerCase();
        result = result.filter(f =>
            f.bookTitle?.toLowerCase().includes(kw) ||
            f.readerName?.toLowerCase().includes(kw)
        );
    }
    return result;
});

const paginatedFines = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredFines.value.slice(start, start + pageSize.value);
});

watch([payFilter, keyword], () => { currentPage.value = 1; });

const isUnpaid = (row) => !row.paid;

const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

const fetchData = async () => {
    loading.value = true;
    try {
        const [b, s, p] = await Promise.all([getBorrows(), getSettings(), getPaidFines()]);
        borrows.value = b;
        settings.value = s;
        paidIds.value = p;
    } catch {
        ElMessage.error('获取数据失败');
    } finally {
        loading.value = false;
    }
};

const handlePay = async (row) => {
    await payFines([row.id]);
    addLog(userStore.user_name, 'pay_fine', `《${row.bookTitle}》`, `${row.fineAmount.toFixed(1)} 元`);
    ElMessage.success('罚款已缴纳');
    await fetchData();
};

const handleBatchPay = async () => {
    const toPay = fineData.value
        .filter(f => selectedIds.value.includes(f.id) && !f.paid);
    if (!toPay.length) return;
    const total = toPay.reduce((s, f) => s + f.fineAmount, 0);

    ElMessageBox.confirm(
        `确定缴纳 ${toPay.length} 笔罚款，共 ${total.toFixed(1)} 元吗？`,
        '批量缴纳',
        { type: 'warning' }
    ).then(async () => {
        await payFines(toPay.map(f => f.id));
        addLog(userStore.user_name, 'pay_fine', `${toPay.length} 笔`, `${total.toFixed(1)} 元`);
        ElMessage.success('罚款已缴纳');
        selectedIds.value = [];
        await fetchData();
    }).catch(() => {});
};

onMounted(fetchData);
</script>

<style lang="less" scoped>
.fine-container {
    .stats-row {
        display: flex;
        gap: 12px;
        margin-bottom: 20px;
        flex-wrap: wrap;

        // StatCard 样式已由组件自身管理
    }

    .search-area {
        margin-bottom: 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .table-wrapper {
        overflow-x: auto;
    }


    .overdue-days { color: #ef4444; font-weight: 500; }
    .fine-amount { color: #f59e0b; font-weight: 500; }
}

@media (max-width: 767px) {
    .fine-container {
        .stats-row {
            gap: 8px;
            // StatCard 响应式由组件自身管理
        }
        .search-area .el-input {
            width: 100% !important;
        }
    }
}
</style>
