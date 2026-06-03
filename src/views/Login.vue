<template>
    <div class="login-container">
        <div class="theme-switch" @click="themeStore.toggle()">
            <el-icon size="20">
                <Sunny v-if="themeStore.isDark" />
                <Moon v-else />
            </el-icon>
        </div>

        <div class="brand-panel">
            <div class="brand-glow brand-glow--top"></div>
            <div class="brand-glow brand-glow--bottom"></div>
            <div class="brand-content">
                <div class="brand-logo">
                    <svg viewBox="0 0 44 44" width="72" height="72" fill="none">
                        <rect x="2" y="8" width="40" height="30" rx="4" fill="url(#login-logo-grad)" />
                        <rect x="6" y="12" width="14" height="22" rx="2" fill="#fff" opacity="0.95" />
                        <rect x="22" y="12" width="16" height="22" rx="2" fill="#fff" opacity="0.8" />
                        <line x1="13" y1="17" x2="17" y2="17" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <line x1="13" y1="21" x2="17" y2="21" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <line x1="13" y1="25" x2="16" y2="25" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="17" x2="32" y2="17" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="21" x2="33" y2="21" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <line x1="27" y1="25" x2="31" y2="25" stroke="#94a3b8" stroke-width="1" stroke-linecap="round" />
                        <defs>
                            <linearGradient id="login-logo-grad" x1="0" y1="0" x2="44" y2="44">
                                <stop offset="0%" stop-color="#0d9488" />
                                <stop offset="100%" stop-color="#2dd4bf" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>
                <h2 class="brand-name">LibraryAdmin</h2>
                <div class="brand-divider"></div>
                <p class="brand-slogan">图书馆后台管理系统</p>
            </div>
        </div>

        <div class="form-container">
            <div class="form-header">
                <h2 class="form-title">欢迎登录</h2>
                <p class="form-subtitle">使用您的账户以访问控制面板</p>
            </div>

            <el-form ref="loginFormRef" :model="loginForm" :rules="rules" size="large" class="login-form"
                @keyup.enter="handleLogin">
                <el-form-item prop="username">
                    <label class="field-label">用户名</label>
                    <el-input v-model="loginForm.username" placeholder="输入您的用户名" prefix-icon="User" />
                </el-form-item>

                <el-form-item prop="password">
                    <label class="field-label">密码</label>
                    <el-input v-model="loginForm.password" type="password" placeholder="输入您的密码" show-password prefix-icon="Lock" />
                </el-form-item>

                <el-form-item>
                    <el-button type="primary" :loading="loading" class="submit-btn" @click="handleLogin"
                        style="width: 100%;">
                        登录
                    </el-button>
                </el-form-item>
            </el-form>

            <div class="tip">
                <span class="tip-dot" />
                用户名：任意用户名 / 密码：123456
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { useThemeStore } from '../stores/theme';
import { ElMessage } from 'element-plus';
import { Sunny, Moon } from '@element-plus/icons-vue';
import { getAdmins } from '../api/mock';

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

const loginForm = reactive({
    username: 'LEI',
    password: 'qiuyue@080701'
});

const loginFormRef = ref(null);

const rules = {
    username: [
        { required: true, message: '请输入用户名', trigger: 'blur' },
        { min: 3, max: 10, message: '用户名为 3 到 10 个字符', trigger: 'blur' }
    ],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 6, max: 20, message: '密码为 6 到 20 个字符', trigger: 'blur' }
    ]
}

const loading = ref(false);

const handleLogin = async () => {
    // console.log(loginFormRef.value);
    await loginFormRef.value.validate();  // 等待表单校验通过
    loading.value = true;

    // 尝试登录
    try {
        await userStore.login(loginForm.username, loginForm.password);
        ElMessage.success('登录成功');
        router.push('/');
    } catch (error) {
        ElMessage.error(error.message);
    } finally {
        loading.value = false;
    }
}
</script>

<style lang="less" scoped>
.theme-switch {
    position: absolute;
    top: 20px;
    right: 20px;
    z-index: 10;
    cursor: pointer;
    color: #94a3b8;
    transition: color 0.3s;
    &:hover { color: #f59e0b; }
}

.login-container {
    height: 100%;
    display: flex;

    .brand-panel {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        background:
            radial-gradient(circle, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
            linear-gradient(160deg, #0f172a 0%, #0c2333 45%, #0a1628 100%);
        background-size: 28px 28px, 100% 100%;

        .brand-glow {
            position: absolute;
            border-radius: 50%;
            pointer-events: none;

            &--top {
                width: 360px;
                height: 360px;
                background: radial-gradient(circle, rgba(13, 148, 136, 0.12), transparent 70%);
                top: -100px;
                right: -80px;
            }

            &--bottom {
                width: 280px;
                height: 280px;
                background: radial-gradient(circle, rgba(45, 212, 191, 0.08), transparent 70%);
                bottom: -80px;
                left: -60px;
            }
        }

        .brand-content {
            position: relative;
            z-index: 1;
            text-align: center;

            .brand-logo {
                margin-bottom: 28px;
                filter: drop-shadow(0 8px 24px rgba(13, 148, 136, 0.3));
                animation: fadeInUp 0.5s ease backwards;
            }

            .brand-name {
                color: #fff;
                font-size: 44px;
                font-weight: 800;
                letter-spacing: -1.5px;
                line-height: 1.15;
                margin: 0;
                animation: fadeInUp 0.5s 0.1s ease backwards;
            }

            .brand-divider {
                width: 40px;
                height: 3px;
                background: linear-gradient(90deg, #0d9488, #2dd4bf);
                border-radius: 2px;
                margin: 20px auto;
                animation: fadeInUp 0.5s 0.18s ease backwards;
            }

            .brand-slogan {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.6;
                margin: 0;
                animation: fadeInUp 0.5s 0.24s ease backwards;
            }
        }
    }

@media (max-width: 767px) {
    .login-container {
        flex-direction: column;

        .brand-panel {
            flex: 0 0 200px;

            .brand-logo svg {
                width: 48px;
                height: 48px;
            }

            .brand-name { font-size: 28px; }
            .brand-divider { margin: 14px auto; }
            .brand-slogan { font-size: 13px; }
        }

        .form-container {
            width: 100%;
            padding: 32px 24px;
            justify-content: flex-start;
            gap: 24px;
        }
    }
}

    .form-container {
        width: 480px;
        padding: 60px;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;

        .form-header {
            animation: fadeInUp 0.5s 0.3s ease backwards;
            .form-title {
                font-size: 28px;
                font-weight: bold;
                margin-bottom: 8px;
            }

            .form-subtitle {
                color: #64748b;
                font-size: 14px;
            }
        }

        .login-form {
            animation: fadeInUp 0.5s 0.38s ease backwards;
            width: 100%;

            .field-label {
                font-size: 13px;
                color: #334155;
            }

            .submit-btn {
                width: 100%;
                height: 44px;
                font-size: 16px;
                border-radius: 8px;
                background: #0d9488;

                &:hover {
                    background: #0f766e;
                }
            }
        }

        .tip {
            font-size: 12px;
            background: #f8fafc;
            animation: fadeInUp 0.5s 0.44s ease backwards;
            color: #64748b;
            border: 1px solid #e2e8f0;
            padding: 10px 15px;
            border-radius: 8px;
            display: flex;
            gap: 8px;
            align-items: center;

            .tip-dot {
                width: 5px;
                height: 5px;
                border-radius: 50%;
                background-color: #0d9488;
            }
        }
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(18px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>

<style lang="less">
html.dark {
    .login-container .form-container {
        background: #1e293b;
    }

    .login-container .form-header {
        .form-title { color: #f1f5f9; }
        .form-subtitle { color: #94a3b8; }
    }

    .login-container .field-label {
        color: #e2e8f0 !important;
    }

    .login-container .form-container .tip {
        background: #0f172a !important;
        border-color: #334155 !important;
        color: #cbd5e1 !important;
    }

    .login-container .brand-panel {
        background:
            radial-gradient(circle, rgba(148, 163, 184, 0.04) 1px, transparent 1px),
            linear-gradient(160deg, #020617 0%, #06121f 45%, #020617 100%);
        background-size: 28px 28px, 100% 100%;

        .brand-glow--top {
            background: radial-gradient(circle, rgba(13, 148, 136, 0.08), transparent 70%);
        }
        .brand-glow--bottom {
            background: radial-gradient(circle, rgba(45, 212, 191, 0.05), transparent 70%);
        }
    }

    .theme-switch {
        color: #cbd5e1;
        &:hover { color: #f59e0b; }
    }
}
</style>