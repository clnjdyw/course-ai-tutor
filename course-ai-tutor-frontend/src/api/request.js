import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'

// 创建 axios 实例
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
const RAG_BASE_URL = import.meta.env.VITE_RAG_BASE_URL || 'http://localhost:8083/api'
const OPENCLAW_BASE_URL = import.meta.env.VITE_OPENCLAW_BASE_URL || 'http://localhost:8081/api'

const request = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000
})

// RAG 专用请求
const ragRequest = axios.create({
  baseURL: RAG_BASE_URL,
  timeout: 60000
})

// 请求拦截器
request.interceptors.request.use(
  config => {
    // 添加 Token
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // userId 由后端从 JWT token 中提取，不再在请求体中硬编码
    // 如果请求体中明确传入了 userId，则保留（兼容性）
    
    console.log('📡 API 请求:', config.method.toUpperCase(), config.url)
    return config
  },
  error => {
    console.error('❌ 请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器
request.interceptors.response.use(
  response => {
    console.log('✅ API 响应:', response.config.url, response.data)
    return response.data
  },
  error => {
    console.error('❌ 响应错误:', error)
    
    // 401 未授权，跳转到登录页
    if (error.response?.status === 401) {
      ElNotification({
        title: '未授权',
        message: '登录已过期，请重新登录',
        type: 'warning',
        duration: 3000
      })
      localStorage.removeItem('token')
      localStorage.removeItem('isLoggedIn')
      
      // 使用 window.location 而非 useRouter，避免在拦截器中使用 hook
      window.location.href = '/login'
    }
    
    // 显示错误消息
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    
    return Promise.reject(error)
  }
)

export default request
export { ragRequest }
