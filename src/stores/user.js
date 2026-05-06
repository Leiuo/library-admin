import { defineStore } from "pinia";
import { computed } from "vue";

export const useUserStore = defineStore('user', () => {
    let token = localStorage.getItem('admin_token') || '';
    let user_name = localStorage.getItem('admin_username') || '';

    const isLoggedIn = computed(() => !!token);

    // 登录
    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (password === '123456') {
                    token = 'mock_token-' + Date.now();
                    user_name = username;
                    localStorage.setItem('admin_token', token);
                    localStorage.setItem('admin_username', user_name);
                    resolve({ sucsess: true });  // 登录成功
                } else {
                    reject(new Error('密码错误！默认密码都不知道？'));  // 登录失败，抛出错误
                }
            }, 500)
        })
    }

    // 登出，清除本地存储
    const logout = () => {
        token = '';
        user_name = '';
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        // localStorage.removeItem('library_books');
        // localStorage.removeItem('admin_borrows');
        // localStorage.removeItem('admin_readers');
    }


    return {
        token,
        user_name,
        isLoggedIn,
        login,
        logout
    }
})