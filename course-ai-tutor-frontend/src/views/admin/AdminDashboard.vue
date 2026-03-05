<template>
  <div class="admin-container">
    <el-card class="glass-card">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="24"><Monitor /></el-icon>
            </div>
            <div>
              <h2>🔧 后台管理</h2>
              <p>系统管理与监控</p>
            </div>
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <el-col :span="6">
          <div class="admin-menu">
            <el-menu default-active="1" class="admin-menu-list">
              <el-menu-item index="1">
                <el-icon><DataAnalysis /></el-icon>
                <span>系统概览</span>
              </el-menu-item>
              <el-menu-item index="2">
                <el-icon><User /></el-icon>
                <span>用户管理</span>
              </el-menu-item>
              <el-menu-item index="3">
                <el-icon><Document /></el-icon>
                <span>课程管理</span>
              </el-menu-item>
              <el-menu-item index="4">
                <el-icon><Setting /></el-icon>
                <span>系统配置</span>
              </el-menu-item>
            </el-menu>
          </div>
        </el-col>

        <el-col :span="18">
          <div class="admin-content">
            <h3>系统概览</h3>
            <el-row :gutter="20" class="stats-grid">
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-value">1,234</div>
                  <div class="stat-label">用户总数</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-value">56</div>
                  <div class="stat-label">课程数量</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="stat-card">
                  <div class="stat-value">99.9%</div>
                  <div class="stat-label">系统可用性</div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup>
// 后台管理组件
</script>

<style scoped>
.admin-container {
  max-width: 1400px;
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

.admin-menu {
  border-right: 1px solid rgba(0, 0, 0, 0.05);
  padding-right: 20px;
}

.admin-menu-list {
  border: none;
  background: transparent;
}

.admin-menu-list .el-menu-item {
  border-radius: 8px;
  margin-bottom: 8px;
}

.admin-menu-list .el-menu-item:hover {
  background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%);
}

.admin-menu-list .el-menu-item.is-active {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.admin-content {
  padding: 20px;
}

.admin-content h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  color: #2d3748;
}

.stats-grid {
  margin-top: 20px;
}

.stat-card {
  text-align: center;
  padding: 30px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 12px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 14px;
  color: #718096;
  margin-top: 8px;
}
</style>
