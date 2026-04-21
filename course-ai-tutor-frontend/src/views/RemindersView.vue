<template>
  <div class="reminders-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
              <span class="icon-emoji">⏰</span>
            </div>
            <div>
              <h2>⏰ 学习提醒</h2>
              <p>不错过每一个重要时刻</p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="showCreateDialog = true" class="gradient-btn">
            <span class="btn-emoji">✨</span>
            新建提醒
          </el-button>
        </div>
      </template>

      <div class="reminders-list">
        <div v-for="(reminder, index) in reminders" :key="reminder.id" class="reminder-card" :style="{ animationDelay: `${index * 0.1}s` }">
          <div class="reminder-header">
            <h3>{{ reminder.title }}</h3>
            <el-tag
              :type="getStatusType(reminder.status)"
              effect="dark"
              size="small"
            >
              {{ getStatusText(reminder.status) }}
            </el-tag>
          </div>

          <p v-if="reminder.content" class="reminder-content">{{ reminder.content }}</p>

          <div class="reminder-footer">
            <div class="reminder-info">
              <span class="reminder-time">⏰ {{ formatDateTime(reminder.reminder_time) }}</span>
              <el-tag size="small" type="info" effect="plain">{{ getTypeText(reminder.reminder_type) }}</el-tag>
            </div>
            <div class="reminder-actions">
              <el-button
                v-if="reminder.status === 'pending'"
                type="success"
                @click="completeReminder(reminder.id)"
                size="small"
                class="gradient-btn"
              >
                完成
              </el-button>
              <el-button type="danger" @click="deleteReminder(reminder.id)" size="small" class="reset-btn">
                删除
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <el-empty
        v-if="reminders.length === 0"
        description="还没有提醒，点击上方按钮创建第一个学习提醒吧！"
        :image-size="200"
      >
        <template #image>
          <div class="empty-illustration">
            <span class="empty-emoji">⏰</span>
          </div>
        </template>
      </el-empty>
    </el-card>

    <!-- 创建提醒弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      title="新建提醒"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="请输入提醒标题" class="gradient-input" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="formData.content" type="textarea" :rows="4" placeholder="请输入提醒内容" class="gradient-input" />
        </el-form-item>
        <el-form-item label="时间">
          <el-date-picker
            v-model="formData.reminderTime"
            type="datetime"
            placeholder="选择提醒时间"
            class="full-width gradient-input"
            format="YYYY-MM-DD HH:mm"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="formData.reminderType" class="full-width gradient-input">
            <el-option label="📚 学习" value="study" />
            <el-option label="🔄 复习" value="review" />
            <el-option label="📝 考试" value="exam" />
            <el-option label="✍️ 作业" value="homework" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog" class="reset-btn">取消</el-button>
        <el-button type="primary" @click="saveReminder" class="gradient-btn">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { remindersApi } from '@/api'

const reminders = ref([])
const showCreateDialog = ref(false)
const formData = ref({
  title: '',
  content: '',
  reminderTime: null,
  reminderType: 'study'
})

onMounted(async () => {
  await loadReminders()
})

async function loadReminders() {
  try {
    const response = await remindersApi.getList()
    reminders.value = response.data || []
  } catch (error) {
    console.error('加载提醒失败:', error)
  }
}

async function saveReminder() {
  try {
    const timeStr = formData.value.reminderTime
      ? new Date(formData.value.reminderTime).toISOString()
      : ''

    await remindersApi.create({
      title: formData.value.title,
      content: formData.value.content,
      reminderTime: timeStr,
      reminderType: formData.value.reminderType
    })

    closeDialog()
    await loadReminders()
    ElMessage.success('提醒创建成功')
  } catch (error) {
    console.error('创建提醒失败:', error)
    ElMessage.error('创建失败')
  }
}

async function completeReminder(id) {
  try {
    await remindersApi.update(id, { status: 'completed' })
    await loadReminders()
    ElMessage.success('提醒已完成')
  } catch (error) {
    console.error('完成提醒失败:', error)
    ElMessage.error('操作失败')
  }
}

async function deleteReminder(id) {
  try {
    await remindersApi.delete(id)
    await loadReminders()
    ElMessage.success('提醒已删除')
  } catch (error) {
    console.error('删除提醒失败:', error)
    ElMessage.error('删除失败')
  }
}

function closeDialog() {
  showCreateDialog.value = false
  formData.value = {
    title: '',
    content: '',
    reminderTime: null,
    reminderType: 'study'
  }
}

function getStatusType(status) {
  const map = { pending: 'warning', completed: 'success', cancelled: 'info' }
  return map[status] || 'info'
}

function getStatusText(status) {
  const map = { pending: '待完成', completed: '已完成', cancelled: '已取消' }
  return map[status] || status
}

function getTypeText(type) {
  const map = { study: '📚 学习', review: '🔄 复习', exam: '📝 考试', homework: '✍️ 作业' }
  return map[type] || type
}

function formatDateTime(dateStr) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.reminders-view {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

.card-header p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

/* 渐变输入框 */
.gradient-input :deep(.el-input__wrapper),
.gradient-input :deep(.el-select__wrapper) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus),
.gradient-input :deep(.el-select__wrapper:hover),
.gradient-input :deep(.el-select__wrapper.is-focused) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.gradient-input :deep(textarea.el-textarea__inner) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border: none;
  box-shadow: none;
}

.full-width {
  width: 100%;
}

/* 渐变按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  border-radius: 12px;
  font-weight: 600;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.reset-btn {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  border-radius: 12px;
}

.reset-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.btn-emoji {
  font-size: 20px;
  margin-right: 4px;
}

/* 提醒列表 */
.reminders-list {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.reminder-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
}

.reminder-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.reminder-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.reminder-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.reminder-content {
  color: #374151;
  margin-bottom: 15px;
  line-height: 1.6;
}

.reminder-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 15px;
  border-top: 1px solid #e5e7eb;
}

.reminder-info {
  display: flex;
  gap: 20px;
  align-items: center;
}

.reminder-time {
  font-weight: 500;
  color: #4a5568;
}

.reminder-actions {
  display: flex;
  gap: 10px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
