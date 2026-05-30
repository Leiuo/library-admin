<template>
    <div class="login-container">
        <div class="theme-switch" @click="themeStore.toggle()">
            <el-icon size="20">
                <Sunny v-if="themeStore.isDark" />
                <Moon v-else />
            </el-icon>
        </div>

        <div class="brand-panel">
            <div class="brand-content">
                <div class="brand-marker" />
                <h2 class="brand-name">Library Admin</h2>
                <p class="brand-slogan">
                    图书馆后台管理系统<br>
                    为您的图书馆提供高效便捷的管理工具
                </p>
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

const router = useRouter();
const userStore = useUserStore();
const themeStore = useThemeStore();

const loginForm = reactive({
    username: 'admin',
    password: '123456'
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
        background: #0f172a;
        position: relative;

        .brand-content {
            .brand-marker {
                width: 32px;
                height: 3px;
                background: #0d9488;
                border-radius: 2px;
                margin-bottom: 15px;
            }

            .brand-name {
                color: #fff;
                font-size: 40px;
                margin-bottom: 32px;
                font-weight: 700;
                letter-spacing: -1.5px;
                line-height: 1.2;
            }

            .brand-slogan {
                color: #94a3b8;
                font-size: 15px;
                line-height: 1.7;
            }
        }
    }

    // .login-card {
    //     width: 450px;
    //     max-width: 90vw;
    //     border-radius: 10px;
    //     transition: transform 0.3s ease;

    //     &:hover {
    //         transform: translateY(-5px);
    //     }

    //     .card-header {
    //         display: flex;
    //         flex-direction: column;
    //         gap: 5px;
    //         text-align: center;
    //         margin-bottom: 20px;

    //         h2 {
    //             font-size: 22px;
    //         }

    //         p {
    //             font-size: 14px;
    //         }
    //     }

    //     .tip {
    //         text-align: center;
    //         font-size: 12px;
    //         color: #909399;
    //     }
    // }

    .form-container {
        width: 480px;
        padding: 60px;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;

        .form-header {
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
        background: #020617;
    }

    .theme-switch {
        color: #cbd5e1;
        &:hover { color: #f59e0b; }
    }
}
</style>