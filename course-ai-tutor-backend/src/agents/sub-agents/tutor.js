import { chat } from '../AIService.js'
import { buildUserContext, formatContextForPrompt } from '../UserContext.js'
import { getSystemPrompt, buildMessages } from '../prompts/index.js'
import { getToolDefinitions, executeTool } from '../ToolRegistry.js'

/**
 * 教学智能体 — 针对性讲解知识点
 */
export async function execute(userId, userInput, history = [], options = {}) {
  const userContext = buildUserContext(userId)
  const userContextStr = formatContextForPrompt(userContext, options.kbContent || '')
  const systemPrompt = getSystemPrompt('tutor')

  // 注入会话上下文
  let enhancedInput = userInput
  if (options.sessionMode) {
    enhancedInput = `[当前模式: ${options.sessionMode}]\n${userInput}`
  }
  if (options.extraContext) {
    enhancedInput = `${options.extraContext}\n\n${enhancedInput}`
  }

  const { system, messages } = buildMessages(systemPrompt, userContextStr, enhancedInput, history)

  const tools = getToolDefinitions()
  return runToolLoop(system, messages, userId, tools)
}

async function runToolLoop(system, messages, userId, tools) {
  const maxTurns = 5
  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await chat(messages, { system, tools })

    // 检查是否有 tool_use
    const toolUses = response.content.filter(c => c.type === 'tool_use')
    if (toolUses.length === 0) {
      // 没有工具调用，返回文本回复
      const textBlock = response.content.find(c => c.type === 'text')
      return textBlock ? textBlock.text : ''
    }

    // 执行工具
    const toolResults = []
    for (const toolUse of toolUses) {
      try {
        const result = await executeTool(toolUse.name, toolUse.input, userId)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: JSON.stringify(result)
        })
      } catch (err) {
        toolResults.push({
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: `工具执行错误: ${err.message}`
        })
      }
    }

    // 将本轮交互加入消息历史
    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
  }

  // 超过最大轮数，返回最后一条文本
  const lastText = messages
    .filter(m => Array.isArray(m.content))
    .flatMap(m => m.content)
    .filter(c => c.type === 'text')
    .pop()
  return lastText ? lastText.text : '处理超时，请稍后重试'
}
