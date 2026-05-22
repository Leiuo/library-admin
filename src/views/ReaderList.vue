<template>
    <div class="readerlist-container">
        <div class="top-button">
            <el-button type="primary" @click="openReaderDialog">+ 新增读者</el-button>
        </div>

        <div class="table-wrapper">
            <el-table :data="readers" border stripe>
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="cardNo" label="借书证号" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="phone" label="电话" />
                <el-table-column label="操作" width="180">
                    <template #default="{ row }">
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
        </div>

        <!-- 读者对话框 -->
        <el-dialog v-model="dialogVisible" :title="dialogTitle" width="30%">
            <el-form :model="readerForm" :rules="readerRules" ref="readerFormRef" label-width="80px">
                <el-form-item label="借书证号" prop="cardNo">
                    <el-input v-model="readerForm.cardNo" />
                </el-form-item>
                <el-form-item label="姓名" prop="name">
                    <el-input v-model="readerForm.name" />
                </el-form-item>
                <el-form-item label="电话" prop="phone">
                    <el-input v-model="readerForm.phone" />
                </el-form-item>
            </el-form>
            <template #footer>
                <el-button @click="dialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitReader">确定</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { getReaders, addReader, updateReader, deleteReader } from '../api/mock';

const readers = ref([]);
const dialogVisible = ref(false);
const dialogTitle = ref('');
const readerFormRef = ref(null);
const readerForm = ref({
    cardNo: '',
    name: '',
    phone: ''
});
let editingId = null;

const loading = ref(false);  // 加载状态

const readerRules = {
    cardNo: [{ required: true, message: '借书证号不能为空', trigger: 'blur' }],
    name: [{ required: true, message: '姓名不能为空', trigger: 'blur' }],
    phone: [{ required: true, message: '电话不能为空', trigger: 'blur' }]
};

const fetchReaders = async () => {
    loading.value = true;
    try {
        // console.log(await getReaders());
        readers.value = await getReaders();
    } catch (error) {
        ElMessage.error('获取读者列表失败');
    } finally {
        loading.value = false;
    }
}

const openReaderDialog = () => {
    dialogTitle.value = '新增读者';
    readerForm.value = {
        cardNo: '',
        name: '',
        phone: ''
    };
    editingId = null;
    dialogVisible.value = true;
}

const openEditDialog = (row) => {
    dialogTitle.value = '编辑读者';
    // console.log(row);
    editingId = row.id;
    readerForm.value = {
        cardNo: row.cardNo,
        name: row.name,
        phone: row.phone
    };
    dialogVisible.value = true;
}

const handleDelete = (id) => {
    ElMessageBox.confirm('你确定要删除该读者吗？', '提示', { type: 'warning' })
        .then(async () => {
            try {
                await deleteReader(id);
                ElMessage.success('删除成功');
                fetchReaders();
            } catch (error) {
                ElMessage.error(error.message);
            }
        }).catch(() => { });
}

const submitReader = async () => {
    await readerFormRef.value.validate();

    if (editingId) {  // 如果是编辑读者
        await updateReader(editingId, readerForm.value);
        ElMessage.success('更新成功');
    } else {  // 如果是新增读者
        await addReader(readerForm.value);
        ElMessage.success('新增成功');
    }

    dialogVisible.value = false;  // 关闭对话框
    fetchReaders();  // 重新获取读者列表
};

onMounted(() => {
    fetchReaders();
});
</script>

<style lang="less" scoped>
.readerlist-container {
    .top-button {
        margin-bottom: 16px;
    }

    .table-wrapper {
        overflow-x: auto;
    }
}

@media (max-width: 767px) {
    :deep(.el-dialog) {
        width: 90% !important;
    }
}

@media (min-width: 768px) and (max-width: 1023px) {
    :deep(.el-dialog) {
        width: 60% !important;
    }
}
</style>