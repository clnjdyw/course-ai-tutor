import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.DASHSCOPE_API_KEY,
  baseURL: process.env.DASHSCOPE_BASE_URL
})

/**
 * 标准聊天调用
 */
export async function chat(messages, options = {}) {
  return client.messages.create({
    model: process.env.AI_MODEL || 'qwen3.6-plus',
    max_tokens: options.maxTokens || 4000,
    system: options.system,
    messages,
    tools: options.tools,
    temperature: options.temperature ?? 0.7
  })
}

/**
 * 流式聊天 — 通过回调逐块返回内容
 */
export async function chatStream(messages, options = {}, onChunk) {
  const stream = await client.messages.create({
    model: process.env.AI_MODEL || 'qwen3.6-plus',
    max_tokens: options.maxTokens || 4000,
    system: options.system,
    messages,
    tools: options.tools,
    temperature: options.temperature ?? 0.7,
    stream: true
  })

  let fullContent = ''
  for await (const event of stream) {
    if (event.type === 'content_block_delta' && event.delta?.text) {
      fullContent += event.delta.text
      onChunk(fullContent, false)
    }
  }
  onChunk(fullContent, true)
  return fullContent
}
