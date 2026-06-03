<template>
    <el-container style="height: 100%;">
        <!-- 移动端遮罩层 -->
        <div v-if="isMobile && !isCollapse" class="aside-overlay" @click="isCollapse = true"></div>

        <el-aside class="layout-aside" :class="{ 'aside-mobile-open': isMobile && !isCollapse }"
            :width="isMobile || !isCollapse ? '220px' : '66px'">
            <div class="aside-title">
                <div class="logo-mark">
                    <svg viewBox="0 0 44 44" width="36" height="36" fill="none">
                        <rect x="2" y="8" width="40" height="30" rx="4" fill="url(#logo-grad)" />
                        <rect x="6" y="12" width="14" height="22" rx="2" fill="#fff" opacity="0.95" />
                        <rect x="22" y="12" width="16" height="22" rx="2" fill="#fff" opacity="0.8" />
                        <line x1="13" y1="17" x2="17" y2="17" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <line x1="13" y1="21" x2="17" y2="21" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <line x1="13" y1="25" x2="16" y2="25" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="17" x2="32" y2="17" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="21" x2="33" y2="21" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="25" x2="31" y2="25" stroke="var(--sidebar-text)" stroke-width="1" stroke-linecap="round" />
                        <defs>
                            <linearGradient id="logo-grad" x1="0" y1="0" x2="44" y2="44">
                                <stop offset="0%" stop-color="var(--sidebar-logo-start)" />
                                <stop offset="100%" stop-color="var(--sidebar-logo-end)" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <div v-if="isMobile || !isCollapse" class="title-text">
                    <div class="title-main">LibraryAdmin</div>
                    <div class="title-sub">图书馆管理系统</div>
                </div>
            </div>
            <el-menu :default-active="$route.path" :collapse="!isMobile && isCollapse" :collapse-transition="false"
                router class="aside-menu"
                @select="onMenuSelect">
                <el-menu-item index="/dashboard">
                    <el-icon>
                        <DataLine />
                    </el-icon>
                    <span>数据统计</span>
                </el-menu-item>
                <el-menu-item index="/books">
                    <el-icon>
                        <Management />
                    </el-icon>
                    <span>图书管理</span>
                </el-menu-item>
                <el-menu-item index="/borrows">
                    <el-icon>
                        <Stamp />
                    </el-icon>
                    <span>借阅管理</span>
                </el-menu-item>
                <el-menu-item index="/fines">
                    <el-icon>
                        <Money />
                    </el-icon>
                    <span>罚款管理</span>
                </el-menu-item>
                <el-menu-item index="/readers">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span>读者管理</span>
                </el-menu-item>
                <el-sub-menu index="/settings">
                    <template #title>
                        <el-icon>
                            <Setting />
                        </el-icon>
                        <span>系统设置</span>
                    </template>
                    <el-menu-item index="/settings/basic">
                        <span>基本设置</span>
                    </el-menu-item>
                    <el-menu-item index="/settings/admins">
                        <span>管理员设置</span>
                    </el-menu-item>
                </el-sub-menu>
                <el-menu-item index="/logs">
                    <el-icon>
                        <DocumentChecked />
                    </el-icon>
                    <span>操作日志</span>
                </el-menu-item>
            </el-menu>
            <div class="aside-footer">
                <span class="version">v 1.1.0</span>
            </div>
        </el-aside>

        <el-container class="layout-right">
            <el-header class="layout-header">
                <div class="header-left">
                    <span class="toggle-icon" :key="isCollapse">
                        <el-icon size="20" @click="toggleCollapse">
                            <Expand v-if="isCollapse" />
                            <Fold v-else />
                        </el-icon>
                    </span>
                    <el-breadcrumb separator="|" class="header-breadcrumb">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                            {{ item.title }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right">
                    <span class="theme-toggle" :key="themeStore.isDark">
                        <el-icon size="20" @click="themeStore.toggle()">
                            <Sunny v-if="themeStore.isDark" />
                            <Moon v-else />
                        </el-icon>
                    </span>
                    <div class="userInfo">
                        <el-avatar :src="userStore.user_avatar" :size="30" />
                        <span class="user-name">{{ userStore.user_name }}</span>
                    </div>
                    <el-button type="danger" size="small" @click="logout">退出登录</el-button>
                </div>
            </el-header>
            <el-main>
                <div class="main-header">
                    <transition-group name="tag-slide" tag="div" class="tags-wrapper">
                        <el-tag v-for="tag in dynamicTags" :key="tag.path" closable :disable-transitions="false"
                            :effect="route.path === tag.path ? 'dark' : 'plain'"
                            :type="route.path === tag.path ? 'primary' : 'info'" @close="handleClose(tag)"
                            @click="handleClick(tag)" size="large">
                            {{ tag.title }}
                        </el-tag>
                    </transition-group>
                </div>

                <!-- <router-view /> -->

                <!-- <transition name="fade" mode="out-in">
                    <router-view />
                </transition> -->

                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </el-main>
        </el-container>
    </el-container>
</template>

<script setup>
import { useUserStore } from '../stores/user';
import { useThemeStore } from '../stores/theme';
import { useRoute, useRouter } from 'vue-router';
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { DataLine, Setting, DocumentChecked, Money, Sunny, Moon } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const themeStore = useThemeStore();
const route = useRoute();
const router = useRouter();

const isCollapse = ref(false);
const isMobile = ref(window.innerWidth < 768);

const dynamicTags = ref([]);

watch(
    () => route.path,
    (newPath) => {
        let title = route.meta?.title;
        if (!title) return;
        if (dynamicTags.value.some(tag => tag.path === newPath)) return;
        if (route.query.name) {
            title = `${route.query.name} ${title}`;
        }
        dynamicTags.value.push({ title, path: newPath, fullPath: route.fullPath });
    },
    { immediate: true }
);

const handleClose = (tag) => {
    const tags = dynamicTags.value;
    const index = tags.indexOf(tag);
    tags.splice(index, 1);

    if (tag.path === route.path) {
        if (tags.length > 0) {
            const nextTab = tags[Math.min(index, tags.length - 1)];
            router.push(nextTab.fullPath || nextTab.path);
        } else {
            router.push('/dashboard');
        }
    }
};

const handleClick = (tag) => {
    router.push(tag.fullPath || tag.path);
};


const handleWindowResize = () => {
    isMobile.value = window.innerWidth < 768;
    if (isMobile.value) {
        isCollapse.value = true;
    }
};

onMounted(() => {
    window.addEventListener('resize', handleWindowResize);
    if (isMobile.value) {
        isCollapse.value = true;
    }
});

onUnmounted(() => {
    window.removeEventListener('resize', handleWindowResize);
});

const logout = () => {
    ElMessageBox.confirm('确定要退出登录吗？', '提示', { type: 'warning' }).then(() => {
        userStore.logout();
        router.push('/login');
    }).catch(() => {
        // 取消操作，不执行任何动作
    });
};

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value;
    // 桌面端侧边栏切换后，触发图表 resize
    if (!isMobile.value) {
        setTimeout(() => {
            window.dispatchEvent(new Event('resize'));
        }, 350);
    }
};

const onMenuSelect = () => {
    if (isMobile.value) {
        isCollapse.value = true;
    }
};

const breadcrumbs = computed(() => {
    const matched = route.matched.filter(item => item.meta?.title);
    return matched.map(item => ({
        path: item.path,
        title: item.meta.title
    }));
});
</script>

<style lang="less" scoped>
.layout-aside {
    background-color: var(--sidebar-bg);
    transition: width 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    z-index: 1000;
    position: relative;

    .aside-title {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 22px 12px 18px;
        border-bottom: 1px solid var(--sidebar-border);

        .logo-mark {
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .title-text {
            min-width: 0;
            line-height: 1.25;
            overflow: hidden;

            .title-main {
                font-size: 16px;
                font-weight: 700;
                color: var(--sidebar-text-main);
                letter-spacing: -.3px;
                white-space: nowrap;
            }

            .title-sub {
                font-size: 11px;
                color: var(--sidebar-text);
                margin-top: 1px;
                white-space: nowrap;
            }
        }
    }

    .aside-menu {
        border-right: none;
        --el-menu-bg-color: var(--sidebar-bg);
        --el-menu-text-color: var(--sidebar-text);
        --el-menu-active-color: var(--sidebar-text-active);
        --el-menu-hover-bg-color: var(--sidebar-hover-bg);
        background-color: var(--sidebar-bg);

        >.el-menu-item,
        .el-sub-menu .el-menu-item {
            border-left: 5px solid transparent;

            .el-icon {
                transition: transform 0.25s ease;
            }

            &:hover {
                background-color: var(--sidebar-hover-bg);

                .el-icon { transform: scale(1.15); }
            }

            &:focus,
            &.is-active {
                border-left: 5px solid var(--sidebar-active-border);
                background-color: var(--sidebar-hover-bg);
            }
        }
    }

    .aside-footer {
        position: absolute;
        bottom: 10px;
        width: 100%;
        text-align: center;

        .version {
            color: var(--el-text-color-secondary);
            font-size: 12px;
        }
    }
}

.aside-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
}

.layout-right {
    min-width: 0;
    overflow: hidden;

    :deep(.el-main) {
        background-color: var(--el-bg-color-page);
    }
}

.layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background-color: var(--el-bg-color);
    border-bottom: 1px solid var(--el-border-color);

    .toggle-icon {
        display: inline-flex;
        animation: icon-rotate 0.3s ease;
    }
    @keyframes icon-rotate {
        from { transform: rotate(0deg); }
        to   { transform: rotate(180deg); }
    }

    .header-left {
        display: flex;
        gap: 20px;
        align-items: center;
        min-width: 0;

        .el-icon {
            cursor: pointer;
            flex-shrink: 0;
        }

        .header-breadcrumb {
            min-width: 0;

            .el-breadcrumb__inner {
                transition: color 0.2s;
                &:hover { color: var(--el-color-primary); }
            }
        }
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;

        .theme-toggle {
            cursor: pointer;
            color: var(--el-text-color-secondary);
            display: inline-flex;
            animation: theme-spin 0.4s ease;

            &:hover { color: #f59e0b; }
        }
        @keyframes theme-spin {
            from { transform: rotate(0deg); }
            to   { transform: rotate(360deg); }
        }

        .userInfo {
            display: flex;
            align-items: center;
            gap: 10px;

            .el-avatar {
                transition: all 0.3s ease;
                flex-shrink: 0;
                cursor: pointer;

                &:hover {
                    transform: scale(1.02);
                }
            }

            .user-name {
                color: var(--el-text-color-regular);
                font-size: 12px;

                &:hover {
                    color: var(--el-color-primary);
                    cursor: pointer;
                }
            }
        }

        .el-button {
            border-radius: 4px;
        }
    }
}

.main-header {
    margin-bottom: 16px;

    .tags-wrapper {
        display: flex;
        gap: 8px;
    }

    .el-tag {
        font-size: 13px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;

        &:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
    }
}

/* 标签页过渡 */
.tag-slide-enter-active,
.tag-slide-leave-active {
    transition: all 0.25s ease;
}
.tag-slide-enter-from {
    opacity: 0;
    transform: translateY(-8px) scale(0.9);
}
.tag-slide-leave-to {
    opacity: 0;
    transform: translateY(4px) scale(0.95);
}

// 移动端：侧边栏变为覆盖式
@media (max-width: 767px) {
    .layout-aside {
        position: fixed;
        top: 0;
        left: 0;
        height: 100%;
        width: 220px !important;
        transform: translateX(-100%);
        transition: transform 0.3s ease;

        &.aside-mobile-open {
            transform: translateX(0);
        }
    }

    .layout-header {
        padding: 0 12px;

        .header-left {
            gap: 10px;

            .header-breadcrumb {
                display: none;
            }
        }

        .header-right .user-name {
            display: none;
        }
    }
}

// 平板端：侧边栏默认折叠
@media (min-width: 768px) and (max-width: 1023px) {
    .layout-header {
        padding: 0 16px;
    }
}
</style>

