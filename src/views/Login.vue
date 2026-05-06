<template>
    <div class="login-container">
        <el-card class="login-card">
            <div class="card-header">
                <h2>图书馆后台管理系统</h2>
                <p>欢迎登录</p>
            </div>
            <el-form :model="loginForm" :rules="rules" ref="loginFormRef">
                <el-form-item prop="username">
                    <el-input v-model="loginForm.username" placeholder="用户名" prefix-icon="User" />
                </el-form-item>
                <el-form-item prop="password">
                    <el-input v-model="loginForm.password" placeholder="密码" prefix-icon="Lock" show-password />
                </el-form-item>
                <el-form-item>
                    <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">登录</el-button>
                </el-form-item>
            </el-form>
            <div class="tip">
                用户名：任意用户名 / 密码：123456
            </div>
        </el-card>
    </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { useUserStore } from '../stores/user';
import { ElMessage } from 'element-plus';

const router = useRouter();
const userStore = useUserStore();

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
.login-container {
    height: 100%;
    background-color: rgb(222, 119, 231);
    display: flex;
    align-items: center;
    justify-content: center;

    .login-card {
        width: 450px;
        border-radius: 10px;
        transition: transform 0.3s ease;

        &:hover {
            transform: translateY(-5px);
        }

        .card-header {
            display: flex;
            flex-direction: column;
            gap: 5px;
            text-align: center;
            margin-bottom: 20px;

            h2 {
                font-size: 22px;
            }

            p {
                font-size: 14px;
            }
        }

        .tip {
            text-align: center;
            font-size: 12px;
            color: #909399;
        }
    }
}
</style>