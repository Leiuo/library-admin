import { createRouter, createWebHashHistory } from "vue-router"
import { useUserStore } from "../stores/user"
import { KeepAlive } from "vue"


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
            }
        ]
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