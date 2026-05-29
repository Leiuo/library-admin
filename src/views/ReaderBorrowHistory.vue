<template>
    <div class="history-container">
        <div class="history-header">
            <el-button type="success" @click="returnReader">返回读者列表</el-button>
            <p>{{ reader ? `${reader.name} (${reader.cardNo}) 的借阅历史` : '加载中...' }}</p>
        </div>

        <div class="history-stat">
            <el-card class="stat-card total-borrow-card" shadow="hover">
                <div class="stat-icon blue">
                    <el-icon>
                        <Collection />
                    </el-icon>
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.totalBorrows || 0 }}</div>
                    <div class="stat-label">累计借阅</div>
                </div>
            </el-card>
            <el-card class="stat-card borrowing-card" shadow="hover">
                <div class="stat-icon orange">
                    <el-icon>
                        <Reading />
                    </el-icon>
                </div>
                <div class="stat-info">
                    <div class="stat-value">{{ stats.activeBorrows || 0 }}</div>
                    <div class="stat-label">借出中</div>
                </div>
            </el-card>
            <el-card class="stat-card returned-card" shadow="hover">
                <div class="stat-icon green">
                    <el-icon>
                        <CircleCheckFilled />
                    </el-icon>
                </div>
                <div class="stat-info">
                    <div class="stat-value returned-value">{{ stats.returnedBorrows || 0 }}</div>
                    <div class="stat-label returned-label">已归还</div>
                </div>
            </el-card>
            <el-card class="stat-card overdue-card" shadow="hover">
                <div class="stat-icon red">
                    <el-icon>
                        <WarningFilled />
                    </el-icon>
                </div>
                <div class="stat-info">
                    <div class="stat-value overdue-value">{{ stats.overdue || 0 }}</div>
                    <div class="stat-label overdue-label">逾期中</div>
                </div>
            </el-card>
        </div>

        <div class="table-wrapper">
            <el-table :data="paginatedBorrowsRecords" border stripe v-loading="loading" :row-class-name="rowClassName">
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
            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]" :total="filteredBorrows.length"
                    layout="total, sizes, prev, pager, next, jumper" background />
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, reactive, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getReaders, getBorrows } from '../api/mock';
import { ElMessage } from 'element-plus';

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
</script>

<style lang="less" scoped>
.history-container {
    .history-header {
        display: flex;
        gap: 20px;
        align-items: center;
        margin-bottom: 16px;
    }

    .total-borrow-card:hover,
    .borrowing-card:hover {
        border-color: #90939975;
    }

    .history-stat {
        display: flex;
        gap: 10px;
        margin-bottom: 24px;

        .stat-card {
            flex: 1;
            cursor: pointer;

            &:hover {
                transform: translateY(-3px);
            }

            :deep(.el-card__body) {
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
            }

            .stat-icon {
                width: 52px;
                height: 52px;
                border-radius: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 5px;

                .el-icon {
                    color: #fff;
                    font-size: 32px;
                }
            }

            .blue {
                background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%);
            }

            .green {
                background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);
            }

            .orange {
                background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);
            }

            .red {
                background: linear-gradient(135deg, #ef4444 0%, #f87171 100%);
            }

            .stat-info {
                text-align: center;

                .stat-value {
                    font-size: 32px;
                    font-weight: 600;
                }

                .stat-label {
                    color: #909399;
                    font-size: 14px;
                    margin-top: 5px;
                }

                .returned-value,
                .returned-label {
                    color: #22c55e;
                }

                .overdue-value,
                .overdue-label {
                    color: #ef4444;
                }
            }
        }

        .returned-card:hover {
            border-color: #22c55e62;
        }

        .overdue-card:hover {
            border-color: rgba(239, 68, 68, 0.3);
        }
    }

    .table-wrapper {
        overflow-x: auto;

        .pagination-wrapper {
            margin-top: 16px;
            display: flex;
            justify-content: flex-end;
        }
    }

    :deep(.overdue-row) {
        background-color: rgba(161, 11, 11, 0.159) !important;
    }
}
</style>
