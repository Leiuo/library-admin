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
    --el-color-primary: #0891b2;
    --el-color-primary-light-3: #67e8f9;
    --el-color-primary-light-5: #a5f3fc;
    --el-color-primary-light-7: #cffafe;
    --el-color-primary-light-8: #ecfeff;
    --el-color-primary-light-9: #ecfeff;
    --el-color-primary-dark-2: #0e7490;

    --el-color-success: #22c55e;
    --el-color-warning: #f59e0b;
    --el-color-danger: #ef4444;
    --el-color-info: #64748b;

    --el-border-radius-base: 8px;
    --el-border-radius-small: 4px;

    --el-bg-color-page: #f1f5f9;

    /* 侧边栏 — 浅色模式（清新简约） */
    --sidebar-bg: #ffffff;
    --sidebar-text: #64748b;
    --sidebar-text-active: #0891b2;
    --sidebar-text-main: #0f172a;
    --sidebar-border: #e2e8f0;
    --sidebar-hover-bg: #f0f9ff;
    --sidebar-active-border: #0891b2;
    --sidebar-logo-start: #0891b2;
    --sidebar-logo-end: #06b6d4;

    --sidebar-shadow: 1px 0 0 0 #f1f5f9, 0 0 20px rgba(0,0,0,0.03);
}

html.dark {
    /* 侧边栏 — 深色模式 */
    --sidebar-bg: #0f1823;
    --sidebar-text: #7c8aa2;
    --sidebar-text-active: #22d3ee;
    --sidebar-text-main: #e2e8f0;
    --sidebar-border: rgba(148, 163, 184, 0.1);
    --sidebar-hover-bg: rgba(34, 211, 238, 0.08);
    --sidebar-active-border: #22d3ee;
    --sidebar-logo-start: #06b6d4;
    --sidebar-logo-end: #22d3ee;
    --sidebar-shadow: none;
}


/* el-button primary 的 hover/active 状态 */
.el-button--primary {
    --el-button-hover-bg-color: #0e7490;
    --el-button-active-bg-color: #155e75;
    --el-button-bg-color: #0891b2;
    --el-button-border-color: #0891b2;
}

.el-button--primary:hover {
    background-color: #0e7490 !important;
    border-color: #0e7490 !important;
}

.el-button--primary:active {
    background-color: #155e75 !important;
    border-color: #155e75 !important;
}

/* ===== 微交互 ===== */

/* 按钮按下缩放 */
.el-button {
    transition: transform 0.15s ease, background-color 0.2s, border-color 0.2s !important;
}
.el-button:active {
    transform: scale(0.97);
}

/* ===== 表格简约化 ===== */
:root {
    --el-table-header-bg-color: #f8fafc;
    --el-table-row-hover-bg-color: #ecfeff;
}

.el-table {
    border-radius: 8px;
    overflow: hidden;
}

.el-table th.el-table__cell {
    font-weight: 500;
    font-size: 13px;
    letter-spacing: 0.02em;
    border-bottom: 1px solid #cbd5e1;
}

.el-table td.el-table__cell {
    border-bottom: 1px solid #e2e8f0;
}

.el-table__body tr:hover > td {
    background-color: #ecfeff !important;
}

/* 表格行 hover 平滑过渡 */
.el-table__body tr {
    transition: background-color 0.15s ease;
}

/* 暗色模式表格 */
html.dark .el-table th.el-table__cell {
    border-bottom-color: #334155;
}

html.dark .el-table td.el-table__cell {
    border-bottom-color: #1e293b;
}

html.dark .el-table__body tr:hover > td {
    background-color: rgba(8, 145, 178, 0.12) !important;
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
