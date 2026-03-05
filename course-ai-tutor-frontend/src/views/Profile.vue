<template>
  <div class="profile-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><User /></el-icon>
            </div>
            <div>
              <h2>👤 个人中心</h2>
              <p>管理您的个人信息和学习数据</p>
            </div>
          </div>
        </div>
      </template>

      <div class="profile-content">
        <el-row :gutter="30">
          <!-- 左侧信息 -->
          <el-col :span="10">
            <div class="profile-sidebar">
              <div class="avatar-section">
                <el-avatar :size="120" src="https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png" />
                <el-button type="primary" circle class="upload-btn">
                  <el-icon><Camera /></el-icon>
                </el-button>
              </div>

              <div class="user-info">
                <h3 class="username">用户</h3>
                <el-tag type="success" effect="dark">学习达人</el-tag>
              </div>

              <div class="stats-grid">
                <div class="stat-item">
                  <div class="stat-value">12</div>
                  <div class="stat-label">学习计划</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">48</div>
                  <div class="stat-label">学习时长</div>
                </div>
                <div class="stat-item">
                  <div class="stat-value">156</div>
                  <div class="stat-label">答题数</div>
                </div>
              </div>

              <div class="level-progress">
                <div class="level-header">
                  <span>当前等级</span>
                  <el-tag size="small">LV.5</el-tag>
                </div>
                <el-progress :percentage="65" :show-text="false" />
                <p class="level-tip">再学习 35% 即可升级</p>
              </div>
            </div>
          </el-col>

          <!-- 右侧表单 -->
          <el-col :span="14">
            <el-tabs v-model="activeTab" class="profile-tabs">
              <el-tab-pane label="基本信息" name="basic">
                <el-form :model="profileForm" label-width="100px" size="large">
                  <el-form-item label="用户名">
                    <el-input v-model="profileForm.username" class="gradient-input" />
                  </el-form-item>

                  <el-form-item label="邮箱">
                    <el-input v-model="profileForm.email" class="gradient-input">
                      <template #prefix>
                        <el-icon><Message /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="手机">
                    <el-input v-model="profileForm.phone" class="gradient-input">
                      <template #prefix>
                        <el-icon><Phone /></el-icon>
                      </template>
                    </el-input>
                  </el-form-item>

                  <el-form-item label="个性签名">
                    <el-input
                      v-model="profileForm.bio"
                      type="textarea"
                      :rows="3"
                      placeholder="介绍一下自己"
                      class="gradient-input"
                    />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="primary" @click="saveProfile" class="gradient-btn">
                      <el-icon><Check /></el-icon>
                      保存修改
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="账号安全" name="security">
                <el-form label-width="100px" size="large">
                  <el-form-item label="当前密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item label="新密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item label="确认密码">
                    <el-input type="password" class="gradient-input" />
                  </el-form-item>

                  <el-form-item>
                    <el-button type="warning" class="gradient-btn orange">
                      <el-icon><Lock /></el-icon>
                      修改密码
                    </el-button>
                  </el-form-item>
                </el-form>
              </el-tab-pane>

              <el-tab-pane label="学习数据" name="learning">
                <div class="learning-stats">
                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
                      <el-icon :size="24"><Document /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">12</div>
                      <div class="stat-label">进行中计划</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
                      <el-icon :size="24"><Clock /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">48h</div>
                      <div class="stat-label">总学习时长</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)">
                      <el-icon :size="24"><Trophy /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">85%</div>
                      <div class="stat-label">平均正确率</div>
                    </div>
                  </div>

                  <div class="stat-card">
                    <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
                      <el-icon :size="24"><Medal /></el-icon>
                    </div>
                    <div class="stat-info">
                      <div class="stat-value">5</div>
                      <div class="stat-label">获得徽章</div>
                    </div>
                  </div>
                </div>
              </el-tab-pane>
            </el-tabs>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { ElMessage, ElNotification } from 'element-plus'

const activeTab = ref('basic')

const profileForm = reactive({
  username: '用户',
  email: 'user@example.com',
  phone: '138****8888',
  bio: '热爱学习，追求进步'
})

const saveProfile = () => {
  ElNotification({
    title: '✅ 保存成功',
    message: '个人信息已更新',
    type: 'success',
    duration: 3000
  })
}
</script>

<style scoped>
.profile-container {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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

/* 侧边栏 */
.profile-sidebar {
  padding: 20px;
  text-align: center;
}

.avatar-section {
  position: relative;
  display: inline-block;
  margin-bottom: 20px;
}

.upload-btn {
  position: absolute;
  bottom: 0;
  right: 0;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.user-info {
  margin-bottom: 30px;
}

.username {
  margin: 12px 0;
  font-size: 24px;
  color: #2d3748;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 30px;
}

.stat-item {
  padding: 16px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.stat-value {
  font-size: 24px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 12px;
  color: #718096;
  margin-top: 4px;
}

/* 等级进度 */
.level-progress {
  padding: 20px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  border-radius: 12px;
  border: 1px solid rgba(102, 126, 234, 0.1);
}

.level-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  font-weight: 500;
}

.level-tip {
  margin: 8px 0 0 0;
  font-size: 12px;
  color: #718096;
  text-align: center;
}

/* 标签页 */
.profile-tabs {
  padding: 20px;
}

.profile-tabs :deep(.el-tabs__header) {
  background: rgba(102, 126, 234, 0.05);
  padding: 4px;
  border-radius: 12px;
  margin-bottom: 24px;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

/* 输入框 */
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(248, 250, 252, 0.8) 0%, rgba(255, 255, 255, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

/* 按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.3);
}

.gradient-btn.orange {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
}

/* 学习统计 */
.learning-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.stat-info {
  flex: 1;
}

.stat-info .stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #2d3748;
}

.stat-info .stat-label {
  font-size: 13px;
  color: #718096;
  margin-top: 4px;
}

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
