<template>
    <!-- <router-view /> -->

    <!-- <transition name="fade" mode="out-in">
        <router-view />
    </transition> -->

    <router-view v-slot="{ Component }">
        <transition name="fade" mode="out-in">
            <component :is="Component" />
        </transition>
    </router-view>
</template>

<script setup>
import { useThemeStore } from './stores/theme';
useThemeStore(); // 初始化时从 localStorage 恢复主题并应用 dark class
</script>

<style>
* {
    padding: 0;
    margin: 0;
    box-sizing: border-box;
}

html,
body,
#app {
    width: 100%;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

/* ===== Element Plus 主题色覆盖 ===== */
:root {
    --el-color-primary: #0d9488;
    --el-color-primary-light-3: #5eead4;
    --el-color-primary-light-5: #99f6e4;
    --el-color-primary-light-7: #ccfbf1;
    --el-color-primary-light-8: #f0fdfa;
    --el-color-primary-light-9: #f0fdfa;
    --el-color-primary-dark-2: #0f766e;

    --el-color-success: #22c55e;
    --el-color-warning: #f59e0b;
    --el-color-danger: #ef4444;
    --el-color-info: #64748b;

    --el-border-radius-base: 8px;
    --el-border-radius-small: 4px;

    --el-bg-color-page: #f1f5f9;
}

/* ===== 暗色模式 ===== */
html.dark {
    --el-bg-color-page: #0f172a;
    --el-bg-color: #1e293b;
    --el-bg-color-overlay: #1e293b;
    --el-color-white: #1e293b;
    --el-color-black: #e2e8f0;
    --el-border-color: #334155;
    --el-border-color-light: #334155;
    --el-border-color-lighter: #475569;
    --el-text-color-primary: #e2e8f0;
    --el-text-color-regular: #cbd5e1;
    --el-text-color-secondary: #94a3b8;
    --el-fill-color: #1e293b;
    --el-fill-color-blank: #1e293b;
    --el-fill-color-light: #334155;
    --el-fill-color-lighter: #1a2332;
    --el-fill-color-extra-light: #1a2332;
    --el-mask-color: rgba(0, 0, 0, 0.6);
    --el-table-tr-bg-color: #1e293b;
    --el-table-bg-color: #1e293b;
    --el-table-header-bg-color: #0f172a;
    --el-table-row-hover-bg-color: #334155;
    --el-table-border-color: #334155;
    color-scheme: dark;
}

html.dark .el-table {
    background-color: #1e293b;
}
html.dark .el-table__body tr > td {
    background-color: #1e293b;
}
html.dark .el-table__body tr:hover > td {
    background-color: #334155 !important;
}
html.dark .el-table th.el-table__cell {
    background-color: #0f172a;
}
html.dark .el-table__body tr.el-table__row--striped > td {
    background-color: #1a2332;
}
html.dark .el-pagination .el-pager li {
    background-color: #1e293b;
}
html.dark .el-pagination button {
    background-color: #1e293b;
}

/* 暗色模式下的标签 */
html.dark .el-tag--info {
    background-color: rgba(100, 116, 139, 0.18);
    border-color: rgba(100, 116, 139, 0.3);
    color: #cbd5e1;
}
html.dark .el-tag--success {
    background-color: rgba(34, 197, 94, 0.18);
    border-color: rgba(34, 197, 94, 0.3);
    color: #4ade80;
}
html.dark .el-tag--danger {
    background-color: rgba(239, 68, 68, 0.18);
    border-color: rgba(239, 68, 68, 0.3);
    color: #f87171;
}
html.dark .el-tag--warning {
    background-color: rgba(245, 158, 11, 0.18);
    border-color: rgba(245, 158, 11, 0.3);
    color: #fbbf24;
}

/* 暗色模式下的选择框 */
html.dark .el-checkbox__inner {
    background-color: #1e293b;
    border-color: #475569;
}

/* el-button primary 的 hover/active 状态 */
.el-button--primary {
    --el-button-hover-bg-color: #0f766e;
    --el-button-active-bg-color: #115e59;
    --el-button-bg-color: #0d9488;
    --el-button-border-color: #0d9488;
}

.el-button--primary:hover {
    background-color: #0f766e !important;
    border-color: #0f766e !important;
}

.el-button--primary:active {
    background-color: #115e59 !important;
    border-color: #115e59 !important;
}

/* ===== 微交互 ===== */

/* 按钮按下缩放 */
.el-button {
    transition: transform 0.15s ease, background-color 0.2s, border-color 0.2s !important;
}
.el-button:active {
    transform: scale(0.97);
}

/* 表格行 hover 平滑过渡 */
.el-table__body tr {
    transition: background-color 0.2s ease;
}

/* 对话框弹出: scale + fade */
.el-dialog {
    animation: dialog-in 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
}
@keyframes dialog-in {
    from {
        opacity: 0;
        transform: scale(0.93) translateY(12px);
    }
    to {
        opacity: 1;
        transform: scale(1) translateY(0);
    }
}

/* 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
    .el-button { transition: none !important; }
    .el-dialog { animation: none; }
    .el-table__body tr { transition: none; }
    *,
    *::before,
    *::after {
        animation-duration: 0.01ms !important;
    }
}

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
