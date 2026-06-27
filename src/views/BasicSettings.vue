<template>
    <div class="settings-container">
        <el-card class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>图书馆信息</span>
                </div>
            </template>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="settings-form">
                <el-form-item label="图书馆名称" prop="libraryName">
                    <el-input v-model="form.libraryName" placeholder="请输入图书馆名称" />
                </el-form-item>
                <el-form-item label="地址" prop="libraryAddress">
                    <el-input v-model="form.libraryAddress" placeholder="请输入图书馆地址" />
                </el-form-item>
                <el-form-item label="联系电话" prop="libraryPhone">
                    <el-input v-model="form.libraryPhone" placeholder="请输入联系电话" />
                </el-form-item>
                <el-form-item label="开放时间" prop="openingHours">
                    <el-input v-model="form.openingHours" placeholder="如：周一至周五 08:00-22:00" />
                </el-form-item>
            </el-form>
        </el-card>

        <el-card class="settings-card" shadow="hover">
            <template #header>
                <div class="card-header">
                    <span>借阅规则</span>
                </div>
            </template>
            <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="settings-form">
                <el-form-item label="最大借阅数量" prop="maxBorrowBooks">
                    <el-input-number v-model="form.maxBorrowBooks" :min="1" :max="20" :step="1" />
                    <span class="unit">本</span>
                </el-form-item>
                <el-form-item label="借阅天数" prop="borrowDuration">
                    <el-input-number v-model="form.borrowDuration" :min="7" :max="90" :step="1" />
                    <span class="unit">天</span>
                </el-form-item>
                <el-form-item label="续借次数上限" prop="renewalLimit">
                    <el-input-number v-model="form.renewalLimit" :min="0" :max="5" :step="1" />
                    <span class="unit">次</span>
                </el-form-item>
                <el-form-item label="逾期罚款" prop="overdueFinePerDay">
                    <el-input-number v-model="form.overdueFinePerDay" :min="0" :max="10" :step="0.1" :precision="1" />
                    <span class="unit">元/天</span>
                </el-form-item>
            </el-form>
        </el-card>

        <div class="save-row">
            <el-button type="primary" size="large" @click="handleSave" :loading="saving">
                <el-icon>
                    <Check />
                </el-icon>
                保存设置
            </el-button>
        </div>
    </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { getSettings, saveSettings } from '../api/settings';
import { addLog } from '../api/logs';
import { useUserStore } from '../stores/user';

const userStore = useUserStore();
import { Check } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';

const formRef = ref(null);
const saving = ref(false);

const form = reactive({
    libraryName: '',
    libraryAddress: '',
    libraryPhone: '',
    openingHours: '',
    maxBorrowBooks: 5,
    borrowDuration: 30,
    renewalLimit: 2,
    overdueFinePerDay: 0.5
});

const rules = {
    libraryName: [{ required: true, message: '请输入图书馆名称', trigger: 'blur' }],
    maxBorrowBooks: [{ required: true, message: '请设置最大借阅数量', trigger: 'blur' }],
    borrowDuration: [{ required: true, message: '请设置借阅天数', trigger: 'blur' }]
};

onMounted(async () => {
    const settings = await getSettings();
    Object.assign(form, {
        libraryName: settings.libraryName || '',
        libraryAddress: settings.libraryAddress || '',
        libraryPhone: settings.libraryPhone || '',
        openingHours: settings.openingHours || '',
        maxBorrowBooks: settings.maxBorrowBooks ?? 5,
        borrowDuration: settings.borrowDuration ?? 30,
        renewalLimit: settings.renewalLimit ?? 2,
        overdueFinePerDay: settings.overdueFinePerDay ?? 0.5
    });
});

const handleSave = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    saving.value = true;
    try {
        const all = await getSettings();
        const updated = { ...all, ...form };
        await saveSettings(updated);
        addLog(userStore.user_name, 'save_settings', '系统设置');
        ElMessage.success('保存成功');
    } catch {
        ElMessage.error('保存失败，请重试');
    } finally {
        saving.value = false;
    }
};
</script>

<style lang="less" scoped>
.settings-container {
    max-width: 720px;

    .settings-card {
        margin-bottom: 16px;

        .card-header {
            font-weight: 600;
            font-size: 15px;
        }
    }

    .save-row {
        margin-top: 24px;

        .el-icon {
            margin-right: 8px;
        }
    }
}

@media (max-width: 767px) {
    .settings-container {
        max-width: 100%;

        .settings-form {
            :deep(.el-form-item__label) {
                width: 90px !important;
            }
        }
    }
}
</style>
