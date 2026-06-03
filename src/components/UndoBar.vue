<template>
    <transition name="undo-fade">
        <div v-if="visible" class="undo-bar">
            <span>{{ message }}</span>
            <el-button link type="primary" @click="$emit('undo')">撤销</el-button>
            <el-icon class="undo-close" @click="$emit('close')"><Close /></el-icon>
        </div>
    </transition>
</template>

<script setup>
import { Close } from '@element-plus/icons-vue';

defineProps({
    visible: { type: Boolean, default: false },
    message: { type: String, default: '' }
});

defineEmits(['undo', 'close']);
</script>

<style lang="less" scoped>
.undo-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding: 10px 16px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    font-size: 14px;
    color: #065f46;

    .undo-close {
        margin-left: auto;
        cursor: pointer;
        color: #6b7280;

        &:hover { color: #374151; }
    }
}

.undo-fade-enter-active,
.undo-fade-leave-active {
    transition: all 0.3s ease;
}
.undo-fade-enter-from,
.undo-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>

<style lang="less">
html.dark .undo-bar {
    background: #064e3b;
    border-color: #065f46;
    color: #a7f3d0;
}
</style>
