import { ref, watchEffect } from 'vue';
import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', () => {
    const isDark = ref(localStorage.getItem('theme') === 'dark');

    const toggle = () => {
        isDark.value = !isDark.value;
    };

    watchEffect(() => {
        localStorage.setItem('theme', isDark.value ? 'dark' : 'light');
        document.documentElement.classList.toggle('dark', isDark.value);
    });

    return { isDark, toggle };
});
