<template>
    <el-container style="height: 100%;">
        <!-- 移动端遮罩层 -->
        <div v-if="isMobile && !isCollapse" class="aside-overlay" @click="isCollapse = true"></div>

        <el-aside class="layout-aside" :class="{ 'aside-mobile-open': isMobile && !isCollapse }"
            :width="isMobile || !isCollapse ? '220px' : '66px'">
            <div class="aside-title">
                <el-icon size="24">
                    <Reading />
                </el-icon>
                <h3 v-if="isMobile || !isCollapse">图书馆管理系统</h3>
            </div>
            <el-menu :default-active="$route.path" :collapse="!isMobile && isCollapse" :collapse-transition="false"
                router background-color="#0f172a" text-color="#94a3b8" active-text-color="#2dd4bf" class="aside-menu"
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
                    <el-icon size="20" @click="toggleCollapse">
                        <Expand v-if="isCollapse" />
                        <Fold v-else />
                    </el-icon>
                    <el-breadcrumb separator="|" class="header-breadcrumb">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                            {{ item.title }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right">
                    <el-icon size="20" class="theme-toggle" @click="themeStore.toggle()">
                        <Sunny v-if="themeStore.isDark" />
                        <Moon v-else />
                    </el-icon>
                    <div class="userInfo">
                        <el-avatar :src="userStore.user_avatar" :size="30" />
                        <span class="user-name">{{ userStore.user_name }}</span>
                    </div>
                    <el-button type="danger" size="small" @click="logout">退出登录</el-button>
                </div>
            </el-header>
            <el-main>
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
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { DataLine, Setting, DocumentChecked, Money, Sunny, Moon } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';

const userStore = useUserStore();
const themeStore = useThemeStore();
const route = useRoute();
const router = useRouter();

const isCollapse = ref(false);
const isMobile = ref(window.innerWidth < 768);

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
    background-color: #0f172a;
    transition: width 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    z-index: 1000;
    position: relative;

    .aside-title {
        color: #fff;
        height: 30px;
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
        margin: 20px 0;

        h3 {
            white-space: nowrap;
        }
    }

    .aside-menu {
        border-right: none;

        > .el-menu-item,
        .el-sub-menu .el-menu-item {
            border-left: 5px solid transparent;

            &:hover {
                background-color: rgba(45, 212, 191, 0.1);
            }

            &:focus,
            &.is-active {
                border-left: 5px solid #2dd4bf;
                background-color: rgba(45, 212, 191, 0.1);
            }
        }
    }

    .aside-footer {
        position: absolute;
        bottom: 10px;
        left: 40%;

        .version {
            color: #64748b;
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
        background-color: #f1f5f9;
    }
}

.layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #e2e8f0;

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
        }
    }

    .header-right {
        display: flex;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;

        .theme-toggle {
            cursor: pointer;
            color: #94a3b8;
            transition: color 0.3s;

            &:hover {
                color: #f59e0b;
            }
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
                color: #606266;
                font-size: 12px;

                &:hover {
                    color: #0d9488;
                    cursor: pointer;
                }
            }
        }

        .el-button {
            border-radius: 4px;
        }
    }
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

<style lang="less">
html.dark {
    .layout-aside {
        .aside-title {
            color: #e2e8f0;
        }

        .version {
            color: #94a3b8;
        }
    }

    .layout-header {
        background-color: #1e293b;
        border-bottom-color: #334155;
    }

    .layout-right .el-main {
        background-color: #0f172a;
    }

    .layout-header .header-right .theme-toggle {
        color: #cbd5e1;

        &:hover {
            color: #f59e0b;
        }
    }

    .layout-header .header-right .user-name {
        color: #cbd5e1 !important;
    }

    .header-breadcrumb .el-breadcrumb__inner {
        color: #94a3b8;
    }
}
</style>
