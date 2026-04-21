import fetch from 'node-fetch'
import crypto from 'crypto'

// LRU 缓存实现
class LRUCache {
  constructor(maxSize = 10000) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  get(key) {
    if (!this.cache.has(key)) return undefined
    
    // 移到末尾（最近使用）
    const value = this.cache.get(key)
    this.cache.delete(key)
    this.cache.set(key, value)
    
    return value
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key)
    } else if (this.cache.size >= this.maxSize) {
      // 删除最久未使用的（第一个）
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  has(key) {
    return this.cache.has(key)
  }
  
  get size() {
    return this.cache.size
  }
}

// 创建全局 embedding 缓存（最多 10000 条）
const embeddingCache = new LRUCache(10000)

/**
 * 计算文本的 MD5 哈希（用作缓存键）
 */
function hashText(text) {
  return crypto.createHash('md5').update(text).digest('hex')
}

/**
 * 获取文本的向量嵌入（带缓存）
 */
export async function getEmbedding(text) {
  // 生成缓存键
  const cacheKey = hashText(text)
  
  // 检查缓存
  const cached = embeddingCache.get(cacheKey)
  if (cached) {
    console.log(`💾 缓存命中: ${text.substring(0, 30)}...`)
    return cached
  }
  
  try {
    const response = await fetch('https://api.siliconflow.cn/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'BAAI/bge-large-zh-v1.5',
        input: text,
        encoding_format: 'float'
      })
    })
    
    const data = await response.json()
    
    if (data.data && data.data[0] && data.data[0].embedding) {
      const embedding = data.data[0].embedding
      
      // 存入缓存
      embeddingCache.set(cacheKey, embedding)
      
      return embedding
    }
    
    throw new Error('无法获取向量嵌入')
  } catch (error) {
    console.error('❌ 获取向量嵌入失败:', error.message)
    // 返回零向量作为降级方案
    return new Array(1024).fill(0)
  }
}

/**
 * 获取缓存统计信息
 */
export function getCacheStats() {
  return {
    size: embeddingCache.size,
    maxSize: 10000,
    usage: `${((embeddingCache.size / 10000) * 100).toFixed(1)}%`
  }
}

/**
 * 清空缓存
 */
export function clearCache() {
  embeddingCache.cache.clear()
  console.log('🗑️  Embedding 缓存已清空')
}

/**
 * 计算两个向量的余弦相似度
 */
export function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0)
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0))
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0))
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0
  
  return dotProduct / (magnitudeA * magnitudeB)
}

/**
 * 文本分块
 */
export function chunkText(text, chunkSize = 500, chunkOverlap = 50) {
  const chunks = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    
    chunks.push({
      content: chunk,
      start,
      end
    })
    
    start += chunkSize - chunkOverlap
  }
  
  return chunks
}

/**
 * 文本预处理
 */
export function preprocessText(text) {
  return text
    .replace(/\s+/g, ' ')           // 合并空白字符
    .replace(/[^\w\s\u4e00-\u9fa5.,!?;:()"'-]/g, '')  // 移除特殊字符（保留中文）
    .trim()
}
