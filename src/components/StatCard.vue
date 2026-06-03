<template>
    <el-card class="stat-card" shadow="hover">
        <div class="stat-icon" :class="color">
            <el-icon><component :is="icon" /></el-icon>
        </div>
        <div class="stat-info">
            <div class="stat-value">{{ value }}</div>
            <div class="stat-label">{{ label }}</div>
        </div>
    </el-card>
</template>

<script setup>
defineProps({
    icon: { type: [Object, Function], required: true },
    color: { type: String, default: 'blue', validator: v => ['blue', 'green', 'orange', 'purple', 'red'].includes(v) },
    value: { type: [String, Number], default: 0 },
    label: { type: String, default: '' }
});
</script>

<style lang="less" scoped>
.stat-card {
    flex: 1 1 180px;
    min-width: 140px;
    cursor: pointer;
    transition: transform 0.2s, border-color 0.2s;

    &:hover {
        transform: translateY(-3px);
        border-color: #90939975;
    }

    :deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 6px;
    }

    .stat-icon {
        width: 48px;
        height: 48px;
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex-shrink: 0;

        .el-icon {
            font-size: 28px;
            color: #fff;
            transition: transform 0.25s ease;
        }
    }

    &:hover .stat-icon .el-icon {
        transform: scale(1.12);
    }

    .blue   { background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); }
    .green  { background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%); }
    .orange { background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); }
    .purple { background: linear-gradient(135deg, #6366f1 0%, #818cf8 100%); }
    .red    { background: linear-gradient(135deg, #ef4444 0%, #f87171 100%); }

    .stat-info {
        text-align: center;

        .stat-value { font-size: 28px; font-weight: 600; }
        .stat-label { color: #909399; font-size: 13px; }
    }
}

@media (max-width: 1023px) {
    .stat-card {
        flex: 1 1 calc(50% - 4px);
        min-width: 150px;

        .stat-icon {
            width: 42px;
            height: 42px;
            border-radius: 10px;

            .el-icon { font-size: 24px; }
        }

        .stat-info .stat-value { font-size: 26px; }
    }
}

@media (max-width: 767px) {
    .stat-card {
        flex: 1 1 calc(50% - 3px);
        min-width: 0;

        .stat-icon {
            width: 36px;
            height: 36px;
            border-radius: 8px;

            .el-icon { font-size: 20px; }
        }

        .stat-info {
            .stat-value { font-size: 22px; }
            .stat-label { font-size: 12px; }
        }
    }
}
</style>

<style lang="less">
html.dark .stat-card .stat-label {
    color: #94a3b8;
}
</style>
