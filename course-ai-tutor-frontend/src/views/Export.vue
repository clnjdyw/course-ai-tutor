<template>
  <div class="export-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
              <el-icon :size="24"><Download /></el-icon>
            </div>
            <div>
              <h2>📥 数据导出</h2>
              <p>导出你的学习数据</p>
            </div>
          </div>
        </div>
      </template>

      <el-form label-width="100px" size="large">
        <el-form-item label="数据类型">
          <el-checkbox-group v-model="selectedTypes">
            <el-checkbox label="records">学习记录</el-checkbox>
            <el-checkbox label="exercises">练习记录</el-checkbox>
            <el-checkbox label="wrong-questions">错题本</el-checkbox>
            <el-checkbox label="notes">笔记</el-checkbox>
          </el-checkbox-group>
        </el-form-item>

        <el-form-item label="导出格式">
          <el-radio-group v-model="format">
            <el-radio label="excel">Excel (.xlsx)</el-radio>
            <el-radio label="csv">CSV</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="日期范围">
          <el-date-picker v-model="dateRange" type="daterange" range-separator="至"
            start-placeholder="开始日期" end-placeholder="结束日期" />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" @click="doExport" :loading="exporting" class="gradient-btn">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </el-form-item>
      </el-form>

      <el-divider />
      <div class="export-info">
        <h4>说明</h4>
        <ul>
          <li>Excel 格式会将所有数据类型放在不同的工作表中</li>
          <li>CSV 格式每个数据类型单独下载一个文件</li>
          <li>选择日期范围可以只导出指定时间段的数据</li>
        </ul>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { exportApi } from '@/api'

const selectedTypes = ref(['records'])
const format = ref('excel')
const dateRange = ref([])
const exporting = ref(false)

async function doExport() {
  if (selectedTypes.value.length === 0) {
    ElMessage.warning('请至少选择一种数据类型')
    return
  }
  exporting.value = true
  try {
    const params = {
      types: selectedTypes.value.join(','),
      format: format.value
    }
    if (dateRange.value?.length === 2) {
      params.startDate = dateRange.value[0].toISOString()
      params.endDate = dateRange.value[1].toISOString()
    }

    const blob = format.value === 'excel'
      ? await exportApi.exportExcel()
      : await exportApi.exportCSV(params.types)
    if (blob) {
      // 触发下载
      const blobObj = new Blob([blob], {
        type: format.value === 'excel'
          ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          : 'text/csv'
      })
      const url = URL.createObjectURL(blobObj)
      const a = document.createElement('a')
      a.href = url
      a.download = `学习数据导出.${format.value === 'excel' ? 'xlsx' : 'csv'}`
      a.click()
      URL.revokeObjectURL(url)
      ElMessage.success('导出成功')
    } else {
      ElMessage.info('后端导出接口暂未就绪')
    }
  } catch (err) {
    console.error('导出失败:', err)
    ElMessage.error('导出失败，请稍后重试')
  } finally {
    exporting.value = false
  }
}
</script>

<style scoped>
.export-container { max-width: 800px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.gradient-btn { background: linear-gradient(135deg, #4facfe, #00f2fe); border: none; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.export-info { color: #718096; font-size: 14px; }
.export-info h4 { color: #2d3748; margin-bottom: 8px; }
.export-info ul { margin: 0; padding-left: 20px; }
.export-info li { margin-bottom: 4px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
