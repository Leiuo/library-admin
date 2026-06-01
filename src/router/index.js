import { createRouter, createWebHashHistory } from "vue-router"
import { useUserStore } from "../stores/user"


const routes = [
    {
        path: '/login',
        name: 'Login',
        component: () => import('../views/Login.vue'),
        meta: { requiresAuth: false }
    },
    {
        path: '/',
        component: () => import('../views/Layout.vue'),
        meta: { requiresAuth: true },
        children: [
            {
                path: '',
                redirect: '/dashboard'
            },
            {
                path: 'books',
                name: 'BookList',
                component: () => import('../views/BookList.vue'),
                meta: { title: '图书管理', KeepAlive: false }
            },
            {
                path: 'borrows',
                name: 'BorrowList',
                component: () => import('../views/BorrowList.vue'),
                meta: { title: '借阅管理', KeepAlive: false }
            },
            {
                path: 'readers',
                name: 'ReaderList',
                component: () => import('../views/ReaderList.vue'),
                meta: { title: '读者管理', KeepAlive: false }
            },
            {
                path: 'dashboard',
                name: 'Dashboard',
                component: () => import('../views/Dashboard.vue'),
                meta: { title: '数据统计', KeepAlive: false }
            },
            {
                path: 'reader/:id/history',
                name: 'ReaderBorrowHistory',
                component: () => import('../views/ReaderBorrowHistory.vue'),
                meta: { title: '借阅历史', KeepAlive: false }
            },
            {
                path: 'settings',
                redirect: '/settings/basic',
                meta: { title: '系统设置' },
                children: [
                    {
                        path: 'basic',
                        name: 'BasicSettings',
                        component: () => import('../views/BasicSettings.vue'),
                        meta: { title: '基本设置', KeepAlive: false }
                    },
                    {
                        path: 'admins',
                        name: 'AdminManagement',
                        component: () => import('../views/AdminManagement.vue'),
                        meta: { title: '管理员设置', KeepAlive: false }
                    },
                ]
            },
            {
                path: 'logs',
                name: 'OperationLog',
                component: () => import('../views/OperationLog.vue'),
                meta: { title: '操作日志', KeepAlive: false }
            },
            {
                path: 'fines',
                name: 'FineManagement',
                component: () => import('../views/FineManagement.vue'),
                meta: { title: '罚款管理', KeepAlive: false }
            }
        ]
    },
    {
        path: '/:pathMatch(.*)*',  // 匹配所有未定义的路径
        name: '404',
        component: () => import('../views/404.vue'),
        meta: { requiresAuth: false }
    }
]

const router = createRouter({
    history: createWebHashHistory(),
    routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
    const userStore = useUserStore();

    if (to.meta.requiresAuth && !userStore.isLoggedIn) {  // 需要认证但未登录，重定向到登录页
        next('/login');
    } else if (to.path === '/login' && userStore.isLoggedIn) {  // 已登录但访问登录页，重定向到首页
        next('/');
    } else {  // 其他情况正常导航
        next();  // 继续导航到目标路由
    }
})

export default router