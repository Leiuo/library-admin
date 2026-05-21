import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useUserStore = defineStore('user', () => {
    let token = ref(localStorage.getItem('admin_token') || '');
    let user_name = ref(localStorage.getItem('admin_username') || '');
    const user_avatar = ref('https://i.pravatar.cc/150?img=3');  // 模拟用户头像

    const isLoggedIn = computed(() => !!token.value);

    // 登录
    const login = (username, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (password === '123456') {
                    token.value = 'mock_token-' + Date.now();
                    user_name.value = username;
                    user_avatar.value = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 100)}`;
                    localStorage.setItem('admin_token', token.value);
                    localStorage.setItem('admin_username', user_name.value);
                    localStorage.setItem('admin_user_avatar', user_avatar.value);
                    resolve({ success: true });  // 登录成功
                } else {
                    reject(new Error('密码错误！默认密码都不知道？'));  // 登录失败，抛出错误
                }
            }, 500)
        })
    }

    // 登出，清除本地存储
    const logout = () => {
        token.value = '';
        user_name.value = '';
        user_avatar.value = 'https://i.pravatar.cc/150?img=3';
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_user_avatar');
        // localStorage.removeItem('library_books');
        // localStorage.removeItem('admin_borrows');
        // localStorage.removeItem('admin_readers');
    }


    return {
        token,
        user_name,
        user_avatar,
        isLoggedIn,
        login,
        logout
    }
})