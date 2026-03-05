import fetch from 'node-fetch'

/**
 * 获取文本的向量嵌入
 */
export async function getEmbedding(text) {
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
      return data.data[0].embedding
    }
    
    throw new Error('无法获取向量嵌入')
  } catch (error) {
    console.error('❌ 获取向量嵌入失败:', error.message)
    // 返回零向量作为降级方案
    return new Array(1024).fill(0)
  }
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
