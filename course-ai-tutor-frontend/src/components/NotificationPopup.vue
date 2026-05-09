<template>
  <div></div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import { ElNotification } from 'element-plus'
import { notificationApi } from '../api/index.js'
import { useUserStore } from '../stores/user.js'

let checkInterval = null
let browserNotificationAllowed = false

onMounted(() => {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) return

  requestBrowserNotificationPermission()
  startCheckingReminders()
})

onUnmounted(() => {
  stopCheckingReminders()
})

function requestBrowserNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        browserNotificationAllowed = true
      }
    })
  }
}

function startCheckingReminders() {
  checkReminders()
  checkInterval = setInterval(checkReminders, 60000)
}

function stopCheckingReminders() {
  if (checkInterval) {
    clearInterval(checkInterval)
    checkInterval = null
  }
}

async function checkReminders() {
  try {
    const response = await notificationApi.getPending()
    if (response.success && response.data && response.data.length > 0) {
      for (const notification of response.data) {
        showNotification(notification)
        await notificationApi.markAsRead(notification.id)
      }
    }
  } catch (error) {
    console.error('检查提醒失败:', error)
  }
}

function showNotification(notification) {
  ElNotification({
    title: notification.title || '学习提醒',
    message: notification.content || '您有一条新的学习提醒',
    type: 'info',
    duration: 5000,
    position: 'top-right'
  })

  if (browserNotificationAllowed && 'Notification' in window) {
    new Notification(notification.title || '学习提醒', {
      body: notification.content || '您有一条新的学习提醒',
      icon: '/favicon.ico'
    })
  }
}
</script>
