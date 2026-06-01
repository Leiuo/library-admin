<template>
    <div class="admin-container">
        <div class="toolbar">
            <el-button type="primary" @click="openAddDialog">
                <el-icon><Plus /></el-icon>
                添加管理员
            </el-button>
        </div>

        <div class="table-wrapper">
            <el-table :data="admins" border stripe v-loading="loading">
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="username" label="用户名" />
                <el-table-column prop="role" label="角色" width="120">
                    <template #default="{ row }">
                        <el-tag :type="row.role === 'super' ? 'danger' : 'info'" size="small">
                            {{ row.role === 'super' ? '超级管理员' : '普通管理员' }}
                        </el-tag>
                    </template>
                </el-table-column>
                <el-table-column prop="createdAt" label="创建时间" width="130" />
                <el-table-column label="操作" width="160">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <el-dialog v-model="dialogVisible" :title="editingId ? '编辑管理员' : '添加管理员'" width="420px">
            <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
                <el-form-item label="用户名" prop="username">
                    <el-input v-model="form.username" placeholder="请输入用户名" />
                </el-form-item>
                <el-form-item label="密码" :prop="editingId ? '' : 'password'">
                    <el-input v-model="form.password" placeholder="请输入密码" show-password />
                </el-form-item>
                <el-form-item label="角色" prop="role">
                    <el-select v-model="form.role" placeholder="请选择角色">
                        <el-option label="超级管理员" value="super" />
                        <el-option label="普通管理员" value="normal" />
                    </el-select>
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="handleSubmit" :loading="submitting">确认</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdmins, addAdmin, updateAdmin, deleteAdmin, addLog } from '../api/mock';
import { useUserStore } from '../stores/user';
import { Plus } from '@element-plus/icons-vue';
import { ElMessage, ElMessageBox } from 'element-plus';

const userStore = useUserStore();

const admins = ref([]);
const loading = ref(false);
const dialogVisible = ref(false);
const editingId = ref(null);
const submitting = ref(false);
const formRef = ref(null);

const form = ref({
    username: '',
    password: '',
    role: 'normal'
});

const rules = {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [
        { required: true, message: '请输入密码', trigger: 'blur' },
        { min: 4, message: '密码至少4位', trigger: 'blur' }
    ],
    role: [{ required: true, message: '请选择角色', trigger: 'change' }]
};

const fetchAdmins = async () => {
    loading.value = true;
    try {
        admins.value = await getAdmins();
    } catch {
        ElMessage.error('获取管理员列表失败');
    } finally {
        loading.value = false;
    }
};

const openAddDialog = () => {
    editingId.value = null;
    form.value = { username: '', password: '', role: 'normal' };
    if (formRef.value) formRef.value.resetFields();
    dialogVisible.value = true;
};

const openEditDialog = (row) => {
    editingId.value = row.id;
    form.value = { username: row.username, password: '', role: row.role };
    if (formRef.value) formRef.value.resetFields();
    dialogVisible.value = true;
};

const handleSubmit = async () => {
    const valid = await formRef.value?.validate().catch(() => false);
    if (!valid) return;

    submitting.value = true;
    try {
        const data = { role: form.value.role };
        if (form.value.password) data.password = form.value.password;
        data.username = form.value.username;

        if (editingId.value) {
            await updateAdmin(editingId.value, data);
            addLog(userStore.user_name, 'edit_admin', form.value.username);
            ElMessage.success('编辑成功');
        } else {
            await addAdmin(data);
            addLog(userStore.user_name, 'add_admin', form.value.username);
            ElMessage.success('添加成功');
        }
        dialogVisible.value = false;
        await fetchAdmins();
    } catch (error) {
        ElMessage.error(error.message);
    } finally {
        submitting.value = false;
    }
};

const handleDelete = (row) => {
    ElMessageBox.confirm(
        `确定要删除管理员"${row.username}"吗？`,
        '删除确认',
        { type: 'warning' }
    ).then(async () => {
        try {
            await deleteAdmin(row.id, userStore.user_name);
            addLog(userStore.user_name, 'delete_admin', row.username);
            ElMessage.success('删除成功');
            await fetchAdmins();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => {});
};

onMounted(() => {
    fetchAdmins();
});
</script>

<style lang="less" scoped>
.admin-container {
    max-width: 900px;

    .toolbar {
        margin-bottom: 16px;
    }

    .table-wrapper {
        overflow-x: auto;
    }
}

@media (max-width: 767px) {
    .admin-container {
        :deep(.el-dialog) {
            width: 90% !important;
        }
    }
}
</style>
