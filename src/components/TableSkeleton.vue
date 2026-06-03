<template>
    <div class="table-skeleton">
        <div class="skeleton-header">
            <div v-for="(w, i) in colWidths" :key="'h' + i"
                class="skeleton-cell" :style="{ width: w }" />
        </div>
        <div v-for="r in rows" :key="r" class="skeleton-row"
            :style="{ animationDelay: `${(r - 1) * 0.06}s` }">
            <div v-for="(w, i) in colWidths" :key="i"
                class="skeleton-cell" :style="{ width: w }" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    rows: { type: Number, default: 8 },
    cols: { type: Number, default: 5 }
});

// 生成略有参差的列宽，模拟真实表格
const colWidths = computed(() => {
    const base = 100 / props.cols;
    return Array.from({ length: props.cols }, (_, i) => {
        const variance = (Math.sin(i * 2.7) * 12 + 8);
        return `${base + variance}px`;
    });
});
</script>

<style lang="less" scoped>
.table-skeleton {
    padding: 4px 0;

    .skeleton-header,
    .skeleton-row {
        display: flex;
        gap: 12px;
        padding: 0 4px;
    }

    .skeleton-header {
        margin-bottom: 10px;

        .skeleton-cell {
            height: 18px;
            border-radius: 4px;
            opacity: 0.5;
        }
    }

    .skeleton-row {
        margin-bottom: 8px;
        animation: skeleton-pulse 1.6s ease-in-out infinite;

        .skeleton-cell {
            height: 14px;
            border-radius: 4px;
            opacity: 0.35;
        }
    }

    .skeleton-cell {
        background: #e2e8f0;
        border-radius: 4px;
    }
}

@keyframes skeleton-pulse {
    0%, 100% { opacity: 0.35; }
    50%      { opacity: 0.7; }
}
</style>

<style lang="less">
html.dark .table-skeleton .skeleton-cell {
    background: #334155;
}
</style>
