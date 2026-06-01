import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { verifyLogin } from "../api/mock";

export const useUserStore = defineStore('user', () => {
    let token = ref(localStorage.getItem('admin_token') || '');
    let user_name = ref(localStorage.getItem('admin_username') || '');
    let user_role = ref(localStorage.getItem('admin_role') || '');
    const user_avatar = ref('https://i.pravatar.cc/150?img=3');

    const isLoggedIn = computed(() => !!token.value);
    const isSuper = computed(() => user_role.value === 'super');

    const login = async (username, password) => {
        const admin = await verifyLogin(username, password);
        token.value = 'mock_token-' + Date.now();
        user_name.value = admin.username;
        user_role.value = admin.role;
        user_avatar.value = `https://i.pravatar.cc/150?img=${Math.floor(Math.random() * 100)}`;
        localStorage.setItem('admin_token', token.value);
        localStorage.setItem('admin_username', user_name.value);
        localStorage.setItem('admin_role', user_role.value);
        localStorage.setItem('admin_user_avatar', user_avatar.value);
        return { success: true };
    };

    const logout = () => {
        token.value = '';
        user_name.value = '';
        user_role.value = '';
        user_avatar.value = 'https://i.pravatar.cc/150?img=3';
        localStorage.removeItem('admin_token');
        localStorage.removeItem('admin_username');
        localStorage.removeItem('admin_role');
        localStorage.removeItem('admin_user_avatar');
    };


    return {
        token,
        user_name,
        user_role,
        user_avatar,
        isLoggedIn,
        isSuper,
        login,
        logout
    }
})