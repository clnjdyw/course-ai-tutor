import axios from 'axios'
import { ElMessage, ElNotification } from 'element-plus'
import { useRouter } from 'vue-router'

// 创建 axios 实例
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8081/api'
const RAG_BASE_URL = import.meta.env.VITE_RAG_BASE_URL || 'http://localhost:8083/api'

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
    
    // 添加用户 ID
    const userId = localStorage.getItem('userId') || '1'
    if (config.data && !config.data.userId) {
      config.data.userId = parseInt(userId)
    }
    
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
      
      const router = useRouter()
      router.push('/login')
    }
    
    // 显示错误消息
    const message = error.response?.data?.message || error.message || '请求失败'
    ElMessage.error(message)
    
    return Promise.reject(error)
  }
)

export default request
export { ragRequest }
