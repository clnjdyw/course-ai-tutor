<template>
  <div class="error-boundary">
    <div class="error-content">
      <el-icon class="error-icon"><CircleCloseFilled /></el-icon>
      <h2 class="error-title">出现了一些问题</h2>
      <p class="error-message">{{ message }}</p>
      <el-button type="primary" @click="handleRetry" :loading="retrying">
        <el-icon><Refresh /></el-icon>
        重试
      </el-button>
      <el-button @click="handleGoHome">
        <el-icon><HomeFilled /></el-icon>
        返回首页
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCloseFilled, Refresh, HomeFilled } from '@element-plus/icons-vue'

const props = defineProps({
  message: {
    type: String,
    default: '加载失败，请检查网络连接后重试'
  },
  error: {
    type: Error,
    default: null
  }
})

const emit = defineEmits(['retry'])
const router = useRouter()
const retrying = ref(false)

const handleRetry = async () => {
  retrying.value = true
  try {
    emit('retry')
  } finally {
    retrying.value = false
  }
}

const handleGoHome = () => {
  router.push('/')
}
</script>

<style scoped>
.error-boundary {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  padding: 40px 20px;
}

.error-content {
  text-align: center;
  max-width: 500px;
}

.error-icon {
  font-size: 64px;
  color: #f56c6c;
  margin-bottom: 20px;
}

.error-title {
  font-size: 24px;
  color: #303133;
  margin-bottom: 12px;
}

.error-message {
  font-size: 14px;
  color: #909399;
  margin-bottom: 30px;
  line-height: 1.6;
}

.error-boundary .el-button {
  margin: 0 8px;
}
</style>
