<template>
    <div class="dashboard-container">
        <!-- 统计卡片 -->
        <div class="stats-row" v-if="loading">
            <div v-for="i in 4" :key="i" class="skeleton-stat">
                <div class="skeleton-icon" />
                <div class="skeleton-line skeleton-line--lg" />
                <div class="skeleton-line skeleton-line--sm" />
            </div>
        </div>
        <div class="stats-row" v-else>
            <StatCard :icon="Notebook" color="blue" :value="stats.totalBooks || 0" label="目前馆藏总量" />
            <StatCard :icon="User" color="orange" :value="stats.totalReaders || 0" label="注册读者" />
            <StatCard :icon="Stamp" color="green" :value="stats.borrowedBooks || 0" label="总借阅数量" />
            <StatCard :icon="TrendCharts" color="purple" :value="stats.activeBorrows || 0" label="进行中借阅" />
        </div>

        <!-- 图表骨架 -->
        <template v-if="loading">
            <div class="charts-row charts-row--asymmetric">
                <div class="skeleton-chart skeleton-chart--wide" />
                <div class="skeleton-chart skeleton-chart--narrow" />
            </div>
            <div class="charts-row charts-row--three">
                <div class="skeleton-chart" v-for="i in 3" :key="i" />
            </div>
        </template>

        <!-- 真实图表 -->
        <template v-else>
            <div class="charts-row charts-row--asymmetric">
                <el-card class="chart-card chart-card--wide" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>月度借阅趋势</span>
                            <el-radio-group v-model="trendYear" size="small" @change="updateTrendChart">
                                <el-radio-button :label="2025">2025</el-radio-button>
                                <el-radio-button :label="2026">2026</el-radio-button>
                            </el-radio-group>
                        </div>
                    </template>
                    <div ref="trendChartRef" class="chart-container chart-container--tall"></div>
                </el-card>

                <el-card class="chart-card chart-card--narrow" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>图书状态分布</span>
                        </div>
                    </template>
                    <div ref="statusChartRef" class="chart-container chart-container--tall"></div>
                </el-card>
            </div>

            <div class="charts-row charts-row--three">
                <el-card class="chart-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>热门图书 TOP5</span>
                        </div>
                    </template>
                    <div ref="hotBooksChartRef" class="chart-container"></div>
                </el-card>

                <el-card class="chart-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>读者借阅排行 TOP5</span>
                        </div>
                    </template>
                    <div ref="topReadersChartRef" class="chart-container"></div>
                </el-card>

                <el-card class="chart-card" shadow="hover">
                    <template #header>
                        <div class="card-header">
                            <span>图书分类分布</span>
                        </div>
                    </template>
                    <div ref="categoryChartRef" class="chart-container"></div>
                </el-card>
            </div>
        </template>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted, onUnmounted, nextTick, watch } from 'vue';
import * as echarts from 'echarts';
import { getBooks, getBorrows, getReaders } from '../api/mock';
import { Notebook, User, Stamp, TrendCharts } from '@element-plus/icons-vue';
import StatCard from '../components/StatCard.vue';
import { useThemeStore } from '../stores/theme';

const themeStore = useThemeStore();

// 统计数据
const stats = reactive({
    totalBooks: 0,
    borrowedBooks: 0,
    totalReaders: 0,
    activeBorrows: 0
});

// 原始数据
const books = ref([]);
const borrows = ref([]);
const readers = ref([]);

const loading = ref(false);

// DOM 引用
const statusChartRef = ref(null);
const trendChartRef = ref(null);
const hotBooksChartRef = ref(null);
const topReadersChartRef = ref(null);
const categoryChartRef = ref(null);

// 图表实例
let statusChart = null;
let trendChart = null;
let hotBooksChart = null;
let topReadersChart = null;
let categoryChart = null;

const trendYear = ref(2026);  // 趋势图年份

// 计算统计数据
const computeStats = () => {
    stats.totalBooks = books.value.reduce((sum, book) => sum + book.quantity, 0);  // 馆藏总量为所有图书的数量之和
    stats.borrowedBooks = borrows.value.length;  // 总借阅数量为所有借阅记录的数量
    stats.totalReaders = readers.value.length;
    stats.activeBorrows = borrows.value.filter(borrow => borrow.status === 0).length;
};

// 准备图书状态扇形图数据
const getStatusChartData = () => {
    const availableBooks = books.value.filter(book => book.quantity > 0);
    const availableValue = availableBooks.reduce((sum, book) => sum + book.quantity, 0);  // 可借数量为剩余数量大于 0 的图书的数量之和
    const borrowedValue = borrows.value.filter(borrow => borrow.status === 0).length;  // 借出数量为状态为 0 的借阅记录数

    return [
        { name: '可借', value: availableValue, itemStyle: { color: '#22c55e' } },
        { name: '借出', value: borrowedValue, itemStyle: { color: '#f59e0b' } }
    ];
};

// 绘制图书状态扇形图
const renderStatusChart = () => {
    if (!statusChartRef.value) return;
    if (statusChart) statusChart.dispose();
    statusChart = echarts.init(statusChartRef.value, themeStore.isDark ? 'dark' : undefined);
    const data = getStatusChartData();
    statusChart.setOption({
        // title: {
        //     text: 'Referer of a Website',
        //     subtext: 'Fake Data',
        //     left: 'center'
        // },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {d}% ({c}册)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            data: data.map(d => d.name)
        },
        series: [
            {
                // name: 'Access From',
                type: 'pie',
                radius: '55%',
                center: ['50%', '50%'],
                data,
                emphasis: {
                    scale: true
                },
                label: {
                    show: true,
                    formatter: '{b}: {d}%'
                }
            }
        ]
    });
};

// 准备月度借阅趋势的数据
const getMonthlyTrendData = (year) => {
    // 当年的所有借阅
    const yearBorrows = borrows.value.filter(borrow => {
        const borrowYear = Number(borrow.borrowDate.split('-')[0]);
        return borrowYear === year;
    });

    // 统计每个月的借阅数目
    const monthlyCount = Array(12).fill(0);
    yearBorrows.forEach(borrow => {
        const month = Number(borrow.borrowDate.split('-')[1]) - 1;
        monthlyCount[month]++;
    });

    return monthlyCount;
};

// 绘制月度借阅趋势折线图
const renderTrendChart = () => {
    if (!trendChartRef.value) return;
    if (trendChart) trendChart.dispose();
    trendChart = echarts.init(trendChartRef.value, themeStore.isDark ? 'dark' : undefined);

    const monthlyData = getMonthlyTrendData(trendYear.value);
    trendChart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'cross' }
        },
        xAxis: {
            type: 'category',
            data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        },
        yAxis: {
            type: 'value',
            name: '借阅次数'
        },
        series: [{
            type: 'line',
            data: monthlyData,
            smooth: true,
            lineStyle: {
                color: '#0d9488',
                width: 3
            },
            areaStyle: {
                opacity: 0.1,
                color: '#0d9488'
            },
            symbol: 'circle',
            symbolSize: 8,
            itemStyle: { color: '#0d9488' }
        }]
    });
};

// 更新趋势图
const updateTrendChart = () => {
    renderTrendChart();
};

// 准备热门图书 TOP5
const getHotBooksData = () => {
    const borrowCount = {};
    borrows.value.forEach(borrow => {
        // if (!borrowCount[borrow.bookId]) {
        //     borrowCount[borrow.bookId] = 0;
        // } else {
        //     borrowCount[borrow.bookId]++;
        // }

        borrowCount[borrow.bookId] = (borrowCount[borrow.bookId] || 0) + 1;
    });

    const hotBooks = [];
    for (let bookId in borrowCount) {
        const book = books.value.find(book => book.id === Number(bookId));
        if (book) {
            hotBooks.push({
                name: book.title,
                count: borrowCount[bookId]
            });
        }
    }
    hotBooks.sort((a, b) => b.count - a.count);  // 热门图书按借阅数目降序排列

    return hotBooks.slice(0, 5);  // 取前五个
};

// 绘制热门图书条形图
const renderHotBooksChart = () => {
    if (!hotBooksChartRef.value) return;
    if (hotBooksChart) hotBooksChart.dispose();
    hotBooksChart = echarts.init(hotBooksChartRef.value, themeStore.isDark ? 'dark' : undefined);

    const data = getHotBooksData();
    const names = data.map(d => d.name.length > 12 ? d.name.slice(0, 10) + '…' : d.name);
    const counts = data.map(d => d.count);

    hotBooksChart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '15%',
            right: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '借阅次数',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'category',
            data: names,
            axisLabel: {
                rotate: 0,
                fontSize: 11
            },
            name: '图书名',
            nameLocation: 'middle',
            nameGap: 120
        },
        series: [{
            type: 'bar',
            data: counts,
            itemStyle: {
                color: '#f59e0b',
                borderRadius: [0, 4, 4, 0]
            },
            label: {
                show: true,
                position: 'right'
            }
        }]
    })
};

// 准备读者借阅排行 TOP5
const getTopReadersData = () => {
    const readerCount = new Map();
    borrows.value.forEach(b => {
        const count = readerCount.get(b.readerId) || 0;
        readerCount.set(b.readerId, count + 1);
    })

    const topReaders = [];
    readerCount.forEach((count, readerId) => {
        const reader = readers.value.find(r => r.id === readerId);
        if (reader) {
            topReaders.push({
                name: reader.name,
                cardNo: reader.cardNo,
                count
            });
        }
    })

    topReaders.sort((a, b) => b.count - a.count);
    return topReaders.slice(0, 5);
};

// 绘制读者排行条形图
const renderTopReadersChart = () => {
    if (!topReadersChartRef.value) return;
    if (topReadersChart) topReadersChart.dispose();
    topReadersChart = echarts.init(topReadersChartRef.value, themeStore.isDark ? 'dark' : undefined);

    const data = getTopReadersData();
    const names = data.map(d => `${d.name} (${d.cardNo})`);
    const counts = data.map(d => d.count);

    topReadersChart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' }
        },
        grid: {
            left: '20%',
            right: '5%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            name: '借阅次数',
            nameLocation: 'middle',
            nameGap: 30
        },
        yAxis: {
            type: 'category',
            data: names,
            axisLabel: { fontSize: 11 },
            name: '读者名',
            nameLocation: 'middle',
            nameGap: 120
        },
        series: [{
            type: 'bar',
            data: counts,
            itemStyle: {
                color: '#0d9488',
                borderRadius: [0, 4, 4, 0]
            },
            label: {
                show: true,
                position: 'right'
            }
        }]
    });
};

// 准备图书分类分布数据
const getCategoryData = () => {
    const categoryCount = {};
    books.value.forEach(book => {
        const cat = book.category || '未分类';
        categoryCount[cat] = (categoryCount[cat] || 0) + book.quantity;
    });
    const data = Object.entries(categoryCount).map(([name, value]) => ({ name, value }));
    data.sort((a, b) => b.value - a.value);
    return data;
};

// 绘制图书分类分布图
const renderCategoryChart = () => {
    if (!categoryChartRef.value) return;
    if (categoryChart) categoryChart.dispose();
    categoryChart = echarts.init(categoryChartRef.value, themeStore.isDark ? 'dark' : undefined);

    const data = getCategoryData();
    const names = data.map(d => d.name);
    const values = data.map(d => d.value);

    const colors = ['#0d9488', '#f59e0b', '#6366f1', '#22c55e', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];
    categoryChart.setOption({
        tooltip: {
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: '{b}: {c} 册'
        },
        grid: {
            left: '12%',
            right: '8%',
            containLabel: true
        },
        yAxis: {
            type: 'category',
            data: names,
            axisLabel: { fontSize: 12 }
        },
        xAxis: {
            type: 'value',
            name: '馆藏册数',
            nameLocation: 'middle',
            nameGap: 30
        },
        series: [{
            type: 'bar',
            data: values.map((v, i) => ({
                value: v,
                itemStyle: {
                    color: colors[i % colors.length],
                    borderRadius: [0, 4, 4, 0]
                }
            })),
            label: {
                show: true,
                position: 'right'
            }
        }]
    });
};

// 防抖 resize
let resizeTimer = null;
const handleResize = () => {
    // console.log('窗口 resize 事件触发');
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
        const charts = [statusChart, trendChart, hotBooksChart, topReadersChart, categoryChart];
        // console.log('图表实例状态:', charts.map(c => c ? (c.isDisposed?.() ? '已销毁' : '正常') : 'null'));
        charts.forEach(chart => {
            if (chart && !chart.isDisposed()) {
                // const dom = chart.getDom();
                // console.log(`图表容器尺寸: ${dom.offsetWidth}x${dom.offsetHeight}`);
                chart.resize();
            }
        });
    }, 100);
};

// 获取所有数据。并刷新所有图表
const fetchAllData = async () => {
    loading.value = true;
    try {
        books.value = await getBooks();
        borrows.value = await getBorrows();
        readers.value = await getReaders();
    } catch (error) {
        console.error('获取数据失败：', error);
    } finally {
        loading.value = false;
    }
    refreshAllCharts();
};

// 刷新所有图表
const refreshAllCharts = () => {
    computeStats();
    nextTick(() => {
        renderStatusChart();
        renderTrendChart();
        renderHotBooksChart();
        renderTopReadersChart();
        renderCategoryChart();
    });
};

onMounted(() => {
    fetchAllData();
    window.addEventListener('resize', handleResize);  // 窗口尺寸变化时，重塑图表尺寸
});

watch(() => themeStore.isDark, () => {
    refreshAllCharts();
});

// 组件卸载时销毁图表
onUnmounted(() => {
    clearTimeout(resizeTimer);
    window.removeEventListener('resize', handleResize);
    [statusChart, trendChart, hotBooksChart, topReadersChart, categoryChart].forEach(chart => {
        chart && chart.dispose();
    })
})
</script>

<style lang="less" scoped>
.dashboard-container {
    .stats-row {
        display: flex;
        gap: 10px;
        margin-bottom: 24px;
        flex-wrap: wrap;

        // StatCard 样式已由组件自身管理
    }

    .charts-row {
        display: flex;
        gap: 16px;
        margin-bottom: 16px;
        flex-wrap: wrap;

        .chart-card {
            flex: 1;
            min-width: 0;

            .card-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-size: 15px;
                font-weight: 500;
            }

            .chart-container {
                width: 100%;
                height: 300px;
                min-width: 0;
                flex: 1;
                overflow: hidden;
            }

            .chart-container--tall {
                height: 340px;
            }
        }
    }

    .charts-row--asymmetric {
        .chart-card--wide   { flex: 2; min-width: 320px; }
        .chart-card--narrow { flex: 1; min-width: 240px; }
    }

    .charts-row--three {
        .chart-card { min-width: 260px; }
    }

    // 骨架屏
    .skeleton-stat {
        flex: 1 1 180px;
        min-width: 140px;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 10px;
        padding: 20px 16px;
        background: #fff;
        border-radius: 8px;
        border: 1px solid #e2e8f0;
        animation: skeleton-pulse 1.6s ease-in-out infinite;

        .skeleton-icon {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            background: #e2e8f0;
        }
    }

    .skeleton-line {
        height: 14px;
        border-radius: 4px;
        background: #e2e8f0;

        &--lg { width: 56px; height: 26px; border-radius: 6px; }
        &--sm { width: 80px; }
    }

    .skeleton-chart {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 8px;
        animation: skeleton-pulse 1.6s ease-in-out infinite;

        &--wide   { flex: 2; min-width: 320px; height: 368px; }
        &--narrow { flex: 1; min-width: 240px; height: 368px; }
    }

    .charts-row--three .skeleton-chart {
        flex: 1;
        min-width: 260px;
        height: 328px;
    }
}

@keyframes skeleton-pulse {
    0%, 100% { opacity: 0.4; }
    50%      { opacity: 0.75; }
}

// 平板
@media (max-width: 1023px) {
    .dashboard-container {
        .stats-row {
            gap: 8px;
            margin-bottom: 16px;
        }

        .charts-row {
            gap: 12px;
            margin-bottom: 12px;

            .chart-card {
                min-width: 300px;

                .chart-container { height: 280px; }
                .chart-container--tall { height: 300px; }
            }
        }

        .charts-row--asymmetric {
            .chart-card--wide,
            .chart-card--narrow {
                flex: 1 1 100%;
                min-width: 0;
            }
        }

        .skeleton-chart {
            &--wide, &--narrow { flex: 1 1 100%; min-width: 0; height: 300px; }
        }
        .charts-row--three .skeleton-chart {
            min-width: 0;
            height: 280px;
        }
    }
}

// 手机
@media (max-width: 767px) {
    .dashboard-container {
        .stats-row {
            gap: 6px;
            margin-bottom: 12px;
        }

        .charts-row {
            gap: 10px;
            margin-bottom: 10px;

            .chart-card {
                min-width: 0;
                flex: 1 1 100%;

                .chart-container { height: 250px; }
                .chart-container--tall { height: 260px; }
            }
        }

        .skeleton-chart {
            &--wide, &--narrow { flex: 1 1 100%; min-width: 0; height: 250px; }
        }
        .charts-row--three .skeleton-chart {
            flex: 1 1 100%;
            height: 220px;
        }
    }
}
</style>

<style lang="less">
html.dark {
    .dashboard-container {
        .skeleton-stat {
            background: #1e293b;
            border-color: #334155;

            .skeleton-icon,
            .skeleton-line { background: #334155; }
        }

        .skeleton-chart {
            background: #1e293b;
            border-color: #334155;
        }
    }
}
</style>
