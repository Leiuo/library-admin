<template>
    <el-container style="height: 100%;">
        <el-aside class="layout-aside" :width="isCollapse ? '66px' : '220px'">
            <div class="aside-title">
                <el-icon size="24">
                    <Reading />
                </el-icon>
                <h3 v-if="!isCollapse">图书馆管理系统</h3>
            </div>
            <el-menu :default-active="$route.path" :collapse="isCollapse" :collapse-transition="false" router
                background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff" class="aside-menu">
                <el-menu-item index="/dashboard">
                    <el-icon>
                        <DataLine />
                    </el-icon>
                    <span v-if="!isCollapse">数据统计</span>
                </el-menu-item>
                <el-menu-item index="/books">
                    <el-icon>
                        <Management />
                    </el-icon>
                    <span v-if="!isCollapse">图书管理</span>
                </el-menu-item>
                <el-menu-item index="/borrows">
                    <el-icon>
                        <Stamp />
                    </el-icon>
                    <span v-if="!isCollapse">借阅管理</span>
                </el-menu-item>
                <el-menu-item index="/readers">
                    <el-icon>
                        <User />
                    </el-icon>
                    <span v-if="!isCollapse">读者管理</span>
                </el-menu-item>
            </el-menu>
        </el-aside>

        <el-container>
            <el-header class="layout-header">
                <div class="header-left">
                    <el-icon size="20" @click="toggleCollapse">
                        <Expand v-if="isCollapse" />
                        <Fold v-else />
                    </el-icon>
                    <el-breadcrumb separator="|">
                        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
                        <el-breadcrumb-item v-for="item in breadcrumbs" :key="item.path">
                            {{ item.title }}
                        </el-breadcrumb-item>
                    </el-breadcrumb>
                </div>
                <div class="header-right">
                    <span>{{ userStore.user_name }}</span>
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
import { useRoute, useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import { DataLine } from '@element-plus/icons-vue';

const userStore = useUserStore();
const route = useRoute();
const router = useRouter();

const isCollapse = ref(false);

const logout = () => {
    userStore.logout();
    router.push('/login');
}

const toggleCollapse = () => {
    isCollapse.value = !isCollapse.value;
}

const breadcrumbs = computed(() => {
    const matched = route.matched.filter(item => item.meta?.title);
    return matched.map(item => ({
        path: item.path,
        title: item.meta.title
    }));
})
</script>

<style lang="less" scoped>
.layout-aside {
    background-color: #304156;
    transition: width 0.3s ease;
    white-space: nowrap;

    .aside-title {
        color: #fff;
        height: 30px;
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: center;
        margin: 20px 0;
    }

    .aside-menu {
        border-right: none;
    }
}

.layout-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #ddd;

    .header-left {
        display: flex;
        gap: 20px;
        align-items: center;

        .el-icon {
            cursor: pointer;
        }
    }

    .header-right {
        span {
            margin-right: 16px
        }
    }
}
</style>