<template>
  <div class="settings-container">
    <el-card class="glass-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">
              <el-icon :size="24"><Setting /></el-icon>
            </div>
            <div>
              <h2>⚙️ 系统设置</h2>
              <p>个性化您的学习体验</p>
            </div>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="通用设置" name="general">
          <el-form label-width="120px" size="large">
            <el-form-item label="主题模式">
              <el-radio-group v-model="settings.theme">
                <el-radio label="light">☀️ 明亮</el-radio>
                <el-radio label="dark">🌙 暗黑</el-radio>
                <el-radio label="auto">🔄 自动</el-radio>
              </el-radio-group>
            </el-form-item>

            <el-form-item label="语言">
              <el-select v-model="settings.language">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en" />
              </el-select>
            </el-form-item>

            <el-form-item label="通知设置">
              <el-switch v-model="settings.notifications" />
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="学习设置" name="learning">
          <el-form label-width="120px" size="large">
            <el-form-item label="每日目标">
              <el-input-number v-model="settings.dailyGoal" :min="1" :max="12" /> 小时
            </el-form-item>

            <el-form-item label="提醒时间">
              <el-time-picker v-model="settings.reminderTime" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="save-section">
        <el-button type="primary" @click="saveSettings" class="gradient-btn">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'

const activeTab = ref('general')

const settings = reactive({
  theme: 'light',
  language: 'zh-CN',
  notifications: true,
  dailyGoal: 2,
  reminderTime: new Date(2026, 2, 6, 9, 0)
})

const saveSettings = () => {
  ElMessage.success('设置已保存')
}
</script>

<style scoped>
.settings-container {
  max-width: 800px;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 16px;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.settings-tabs {
  margin-top: 20px;
}

.save-section {
  margin-top: 30px;
  text-align: center;
}

.gradient-btn {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
}
</style>
