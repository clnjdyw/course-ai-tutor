import { getTutorSystemPrompt } from './tutor.js'
import { getHelperSystemPrompt } from './helper.js'
import { getPlannerSystemPrompt } from './planner.js'
import { getEvaluatorSystemPrompt } from './evaluator.js'
import { getCompanionSystemPrompt } from './companion.js'

const promptMap = {
  tutor: getTutorSystemPrompt,
  helper: getHelperSystemPrompt,
  planner: getPlannerSystemPrompt,
  evaluator: getEvaluatorSystemPrompt,
  companion: getCompanionSystemPrompt
}

/**
 * 获取指定智能体的 System Prompt
 */
export function getSystemPrompt(agentType) {
  const getter = promptMap[agentType]
  return getter ? getter() : getHelperSystemPrompt()
}

/**
 * 渲染完整的消息数组（system + user context + 用户输入）
 */
export function buildMessages(systemPrompt, userContextStr, userInput, history = []) {
  const messages = [
    { role: 'user', content: `以下是当前用户的学习信息：\n\n${userContextStr}` }
  ]

  // 添加历史对话（最多保留最近 6 轮）
  const recentHistory = history.slice(-6)
  for (const msg of recentHistory) {
    messages.push({ role: msg.role === 'ai' ? 'assistant' : msg.role, content: msg.content })
  }

  messages.push({ role: 'user', content: userInput })

  return { system: systemPrompt, messages }
}

export {
  getTutorSystemPrompt,
  getHelperSystemPrompt,
  getPlannerSystemPrompt,
  getEvaluatorSystemPrompt,
  getCompanionSystemPrompt
}
