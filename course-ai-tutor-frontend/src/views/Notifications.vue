<template>
  <div class="notifications-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div>
              <h2>🔔 通知中心</h2>
              <p>查看你的学习提醒和通知</p>
            </div>
          </div>
          <el-button @click="markAllRead" :disabled="notifications.length === 0">全部已读</el-button>
        </div>
      </template>

      <div v-if="notifications.length > 0" class="notification-list">
        <div v-for="item in notifications" :key="item.id" class="notification-item"
             :class="{ unread: !item.read }">
          <div class="notif-icon">
            <span>{{ item.type === 'reminder' ? '⏰' : item.type === 'achievement' ? '🏆' : '📢' }}</span>
          </div>
          <div class="notif-content">
            <div class="notif-title">{{ item.title || '通知' }}</div>
            <div class="notif-body">{{ item.message || item.content || '' }}</div>
            <div class="notif-time">{{ formatTime(item.created_at || item.createdAt) }}</div>
          </div>
          <el-button v-if="!item.read" size="small" @click="markRead(item.id)">已读</el-button>
        </div>
      </div>
      <el-empty v-else description="暂无通知" />

      <div class="browser-notify-section">
        <el-divider />
        <div class="browser-row">
          <span>浏览器通知：</span>
          <el-button v-if="browserPermission !== 'granted'" type="primary" size="small" @click="requestBrowserNotify">
            开启浏览器通知
          </el-button>
          <el-tag v-else type="success">已开启</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { notificationApi } from '@/api'

const notifications = ref([])
const browserPermission = ref(typeof Notification !== 'undefined' ? Notification.permission : 'default')

async function fetchNotifications() {
  try {
    const res = await notificationApi.getPending()
    if (res?.success) {
      notifications.value = Array.isArray(res.data) ? res.data : []
    }
  } catch {
    notifications.value = []
  }
}

async function markRead(id) {
  try {
    await notificationApi.markAsRead(id)
    notifications.value = notifications.value.filter(n => n.id !== id)
  } catch {
    ElMessage.error('操作失败')
  }
}

function markAllRead() {
  notifications.value.forEach(n => markRead(n.id))
}

async function requestBrowserNotify() {
  if (typeof Notification === 'undefined') {
    ElMessage.warning('当前浏览器不支持通知')
    return
  }
  const perm = await Notification.requestPermission()
  browserPermission.value = perm
  if (perm === 'granted') {
    ElMessage.success('浏览器通知已开启')
    new Notification('通知已开启', { body: '你将收到学习提醒通知' })
  }
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const now = new Date()
  const diff = (now - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)} 小时前`
  return d.toLocaleDateString()
}

onMounted(fetchNotifications)
</script>

<style scoped>
.notifications-container { max-width: 800px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.notification-list { display: flex; flex-direction: column; gap: 12px; }
.notification-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.3s; }
.notification-item.unread { background: #eef2ff; border-color: #c7d2fe; }
.notification-item:hover { transform: translateX(4px); }
.notif-icon { font-size: 24px; flex-shrink: 0; }
.notif-content { flex: 1; }
.notif-title { font-weight: 600; color: #2d3748; }
.notif-body { font-size: 13px; color: #718096; margin-top: 4px; }
.notif-time { font-size: 12px; color: #a0aec0; margin-top: 4px; }
.browser-notify-section { margin-top: 16px; }
.browser-row { display: flex; align-items: center; gap: 12px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
