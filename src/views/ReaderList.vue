<template>
    <div class="readerlist-container">
        <div class="top-button">
            <el-input v-model="searchKeyword" placeholder="按借书证号/姓名搜索" clearable />
            <el-button type="primary" @click="fetchReaders">搜索</el-button>
            <el-button type="success" @click="openReaderDialog">+ 新增读者</el-button>
            <el-button type="warning" @click="openImportDialog">批量导入</el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedIds.length === 0">
                批量删除 {{ selectedIds.length ? `(${selectedIds.length})` : '' }}
            </el-button>
        </div>

        <transition name="undo-fade">
            <div v-if="undoState" class="undo-bar">
                <span>{{ undoState.message }}</span>
                <el-button link type="primary" @click="handleUndo">撤销</el-button>
                <el-icon class="undo-close" @click="clearUndo">
                    <Close />
                </el-icon>
            </div>
        </transition>

        <div class="table-wrapper">
            <el-table :data="paginatedReaders" border stripe v-loading="loading"
                @selection-change="handleSelectionChange">
                <el-table-column type="selection" width="50" />
                <el-table-column prop="id" label="ID" width="60" />
                <el-table-column prop="cardNo" label="借书证号" />
                <el-table-column prop="name" label="姓名" />
                <el-table-column prop="phone" label="电话" />
                <el-table-column label="操作" width="180">
                    <template #default="{ row }">
                        <el-button link type="success" @click="goBorrowHistory(row)">借阅历史</el-button>
                        <el-button link type="primary" @click="openEditDialog(row)">编辑</el-button>
                        <el-button link type="danger" @click="handleDelete(row.id)">删除</el-button>
                    </template>
                </el-table-column>
            </el-table>
            <div class="pagination-wrapper">
                <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize"
                    :page-sizes="[10, 20, 50]" :total="readers.length" layout="total, sizes, prev, pager, next, jumper"
                    background />
            </div>
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

        <!-- 批量导入对话框 -->
        <el-dialog v-model="importDialogVisible" title="批量导入读者" width="40%">
            <div class="import-tips">
                <p>支持 CSV 或 JSON 文件格式，每行一条记录。</p>
                <p>CSV 列顺序：借书证号, 姓名, 电话</p>
                <el-button link type="primary" @click="downloadReaderTemplate">下载 CSV 模板</el-button>
            </div>
            <el-upload ref="uploadRef" :auto-upload="false" :limit="1" accept=".csv,.json" :on-change="handleFileChange"
                :on-remove="() => { importFile = null; }" drag>
                <el-icon class="el-icon--upload"><upload-filled /></el-icon>
                <div class="el-upload__text">拖拽文件到此处 或 <em>点击上传</em></div>
            </el-upload>
            <div v-if="previewData.length" class="preview-table">
                <p>预览（共 {{ previewData.length }} 条）</p>
                <el-table :data="previewData.slice(0, 5)" border size="small" max-height="200">
                    <el-table-column prop="cardNo" label="借书证号" />
                    <el-table-column prop="name" label="姓名" />
                    <el-table-column prop="phone" label="电话" />
                </el-table>
                <p v-if="previewData.length > 5" class="preview-more">...还有 {{ previewData.length - 5 }} 条</p>
            </div>
            <template #footer>
                <el-button @click="importDialogVisible = false">取消</el-button>
                <el-button type="primary" @click="submitImport" :disabled="!importFile">确认导入</el-button>
            </template>
        </el-dialog>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { ElMessage, ElMessageBox } from 'element-plus';
import { UploadFilled, Close } from '@element-plus/icons-vue';
import { getReaders, addReader, updateReader, deleteReader, deleteReaders, importReaders } from '../api/mock';
import { useRouter } from 'vue-router';

const router = useRouter();

const searchKeyword = ref('');
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

const currentPage = ref(1);
const pageSize = ref(10);
let paginatedReaders = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredReaders.value.slice(start, start + pageSize.value);
});

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

// 根据关键词筛选读者
const filteredReaders = computed(() => {
    let res = readers.value;

    if (searchKeyword.value) {
        const keyword = searchKeyword.value.toLowerCase();
        res = res.filter((reader) => {
            return reader.cardNo.toLowerCase().includes(keyword) || reader.name.toLowerCase().includes(keyword);
        });
    }

    return res;
});

const openReaderDialog = () => {
    dialogTitle.value = '新增读者';
    editingId = null;
    readerForm.value = {
        cardNo: '',
        name: '',
        phone: ''
    };
    if (readerFormRef.value) {
        readerFormRef.value.resetFields();
    }
    dialogVisible.value = true;
}

const goBorrowHistory = (row) => {
    console.log(`去到${row.name}的借阅历史`);
    router.push(`/reader/${row.id}/history`);

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
                const index = readers.value.findIndex(r => r.id === id);
                const reader = readers.value[index];
                await deleteReader(id);
                if (reader) showUndo(`已删除读者 ${reader.name}`, [{ item: reader, index }]);
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

// 批量选择
const selectedIds = ref([]);
const handleSelectionChange = (rows) => {
    selectedIds.value = rows.map(r => r.id);
};

// 批量删除
const handleBatchDelete = () => {
    if (!selectedIds.value.length) return;
    ElMessageBox.confirm(
        `确定要删除选中的 ${selectedIds.value.length} 位读者吗？`,
        '批量删除',
        { type: 'warning' }
    ).then(async () => {
        try {
            const deletedReaders = readers.value.reduce((acc, r, i) => {
                if (selectedIds.value.includes(r.id)) acc.push({ item: r, index: i });
                return acc;
            }, []);
            const count = await deleteReaders(selectedIds.value);
            showUndo(`已删除 ${count} 位读者`, deletedReaders);
            fetchReaders();
        } catch (error) {
            ElMessage.error(error.message);
        }
    }).catch(() => { });
};

// 撤销删除
const undoState = ref(null);
let undoTimer = null;

const showUndo = (message, deletedItems) => {
    clearUndo();
    undoState.value = { message, items: deletedItems };
    undoTimer = setTimeout(() => { undoState.value = null; }, 10000);
};

const clearUndo = () => {
    if (undoTimer) clearTimeout(undoTimer);
    undoState.value = null;
};

const handleUndo = () => {
    if (!undoState.value) return;
    const readers = JSON.parse(localStorage.getItem('library_readers')) || [];
    const sorted = [...undoState.value.items].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
        readers.splice(index, 0, item);
    }
    localStorage.setItem('library_readers', JSON.stringify(readers));
    clearUndo();
    fetchReaders();
    ElMessage.success('已撤销删除');
};

// 批量导入
const importDialogVisible = ref(false);
const importFile = ref(null);
const previewData = ref([]);
const uploadRef = ref(null);

const parseCSV = (text) => {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim());
    return lines.slice(1).filter(line => line.trim()).map(line => {
        const values = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        return row;
    });
};

const parseJSON = (text) => {
    const data = JSON.parse(text);
    return Array.isArray(data) ? data : [];
};

const handleFileChange = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const text = e.target.result;
            const isCSV = file.name.endsWith('.csv');
            const parsed = isCSV ? parseCSV(text) : parseJSON(text);
            if (!parsed.length) {
                ElMessage.warning('文件中没有有效数据');
                previewData.value = [];
                importFile.value = null;
                return;
            }
            previewData.value = parsed.map(item => ({
                cardNo: item.cardNo || item['借书证号'] || '',
                name: item.name || item['姓名'] || '',
                phone: item.phone || item['电话'] || ''
            }));
            importFile.value = file;
        } catch {
            ElMessage.error('文件格式错误，请检查文件内容');
            previewData.value = [];
            importFile.value = null;
        }
    };
    reader.readAsText(file.raw);
};

const openImportDialog = () => {
    importFile.value = null;
    previewData.value = [];
    if (uploadRef.value) {
        uploadRef.value.clearFiles();
    }
    importDialogVisible.value = true;
};

const submitImport = async () => {
    if (!previewData.value.length) return;
    try {
        const count = await importReaders(previewData.value);
        ElMessage.success(`成功导入 ${count} 位读者`);
        importDialogVisible.value = false;
        fetchReaders();
    } catch (error) {
        ElMessage.error(error.message);
    }
};

const downloadReaderTemplate = () => {
    const csvContent = 'cardNo,name,phone\nR011,示例姓名,13800138000';
    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '读者导入模板.csv';
    link.click();
    URL.revokeObjectURL(link.href);
};

onMounted(() => {
    fetchReaders();
});

onUnmounted(() => {
    clearUndo();
});
</script>

<style lang="less" scoped>
.undo-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    margin-bottom: 12px;
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    font-size: 14px;
    color: #065f46;

    .undo-close {
        margin-left: auto;
        cursor: pointer;
        color: #6b7280;

        &:hover {
            color: #374151;
        }
    }
}

.undo-fade-enter-active,
.undo-fade-leave-active {
    transition: all 0.3s ease;
}

.undo-fade-enter-from,
.undo-fade-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}

.readerlist-container {
    .top-button {
        margin-bottom: 16px;
        display: flex;
        gap: 8px;
        flex-wrap: wrap;

        .el-input {
            width: 250px;
        }
    }

    .table-wrapper {
        overflow-x: auto;
    }

    .pagination-wrapper {
        margin-top: 16px;
        display: flex;
        justify-content: flex-end;
    }

    .import-tips {
        margin-bottom: 16px;

        p {
            margin: 4px 0;
            font-size: 14px;
            color: #666;
        }
    }

    .preview-table {
        margin-top: 16px;

        p {
            margin: 4px 0;
            font-size: 14px;
        }

        .preview-more {
            color: #999;
            text-align: center;
        }
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