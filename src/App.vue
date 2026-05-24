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

.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>
