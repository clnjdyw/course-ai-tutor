import { chat } from '../AIService.js'
import { buildUserContext, formatContextForPrompt } from '../UserContext.js'
import { getSystemPrompt, buildMessages } from '../prompts/index.js'
import { getToolDefinitions, executeTool } from '../ToolRegistry.js'

/**
 * 规划智能体 — 生成个性化学习计划和提醒
 */
export async function execute(userId, userInput, history = [], options = {}) {
  const userContext = buildUserContext(userId)
  const userContextStr = formatContextForPrompt(userContext, options.kbContent || '')
  const systemPrompt = getSystemPrompt('planner')

  let enhancedInput = userInput
  if (options.sessionMode) enhancedInput = `[当前模式: ${options.sessionMode}]\n${userInput}`
  if (options.extraContext) enhancedInput = `${options.extraContext}\n\n${enhancedInput}`

  const { system, messages } = buildMessages(systemPrompt, userContextStr, enhancedInput, history)

  const tools = getToolDefinitions()
  return runToolLoop(system, messages, userId, tools)
}

async function runToolLoop(system, messages, userId, tools) {
  const maxTurns = 8
  for (let turn = 0; turn < maxTurns; turn++) {
    const response = await chat(messages, { system, tools })

    const toolUses = response.content.filter(c => c.type === 'tool_use')
    if (toolUses.length === 0) {
      const textBlock = response.content.find(c => c.type === 'text')
      return textBlock ? textBlock.text : ''
    }

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

    messages.push({ role: 'assistant', content: response.content })
    messages.push({ role: 'user', content: toolResults })
  }

  const lastText = messages
    .filter(m => Array.isArray(m.content))
    .flatMap(m => m.content)
    .filter(c => c.type === 'text')
    .pop()
  return lastText ? lastText.text : '处理超时，请稍后重试'
}
