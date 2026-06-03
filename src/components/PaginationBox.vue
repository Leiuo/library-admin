<template>
    <div class="pagination-wrapper">
        <el-pagination
            :current-page="currentPage"
            :page-size="pageSize"
            :page-sizes="[10, 20, 50]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            background
            @update:current-page="$emit('update:currentPage', $event)"
            @update:page-size="$emit('update:pageSize', $event)"
        />
    </div>
</template>

<script setup>
defineProps({
    currentPage: { type: Number, default: 1 },
    pageSize: { type: Number, default: 10 },
    total: { type: Number, default: 0 }
});

defineEmits(['update:currentPage', 'update:pageSize']);
</script>

<style lang="less" scoped>
.pagination-wrapper {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
}
</style>
