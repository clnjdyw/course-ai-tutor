import { chat } from './AIService.js'
import { buildUserContext, formatContextForPrompt, getWeakPoints } from './UserContext.js'
import { getSystemPrompt, buildMessages } from './prompts/index.js'
import { getToolDefinitions, executeTool } from './ToolRegistry.js'

/**
 * 多步骤自主规划智能体
 * 负责：薄弱点分析 → 学习路径规划 → 生成计划 → 创建提醒 → 生成练习
 */
class PlannerAgent {
  /**
   * 生成完整学习计划
   * 步骤：获取薄弱点 → 分析学习路径 → 生成计划 → 保存到数据库 → 创建提醒
   */
  async generatePlan(userId) {
    console.log('📋 开始生成学习计划...')

    // 步骤1: 获取用户上下文和薄弱点
    const ctx = buildUserContext(userId)
    const weakResult = await executeTool('get_weak_points', { userId }, userId)

    // 步骤2: 将薄弱点信息注入 AI 生成计划
    const userContextStr = formatContextForPrompt(ctx)
    const systemPrompt = getSystemPrompt('planner')
    const userInput = `请基于以下用户信息和学习薄弱点，制定一份详细的学习计划。\n\n用户信息：\n${userContextStr}\n\n薄弱知识点：\n${JSON.stringify(weakResult, null, 2)}\n\n请输出学习计划，并调用工具创建相应的提醒和练习。`

    const { system, messages } = buildMessages(systemPrompt, userContextStr, userInput)
    const tools = getToolDefinitions()

    return this.runToolLoop(system, messages, userId, tools)
  }

  /**
   * 自动复习错题
   * 步骤：获取错题 → 分析错误原因 → 生成讲解 → 生成相似题 → 更新掌握度
   */
  async autoReview(userId) {
    console.log('🔄 开始自动错题复习...')

    // 步骤1: 获取错题
    const wrongResult = await executeTool('query_wrong_questions', { userId, limit: 20, unmastered: true }, userId)

    if (!wrongResult.success || wrongResult.count === 0) {
      return { success: true, message: '暂无未掌握的错题，继续保持！' }
    }

    // 步骤2: 获取用户上下文
    const ctx = buildUserContext(userId)
    const userContextStr = formatContextForPrompt(ctx)
    const systemPrompt = getSystemPrompt('tutor')
    const userInput = `请对用户进行错题复习。以下是用户的错题列表：\n${JSON.stringify(wrongResult, null, 2)}\n\n请针对每道错题进行讲解，并生成相似练习题。完成后调用工具更新掌握度。`

    const { system, messages } = buildMessages(systemPrompt, userContextStr, userInput)
    const tools = getToolDefinitions()

    return this.runToolLoop(system, messages, userId, tools)
  }

  /**
   * 自适应学习调整
   * 根据用户最近学习反馈自动调整策略
   */
  async adaptiveLearning(userId) {
    console.log('🔄 开始自适应学习调整...')

    const progressResult = await executeTool('query_user_progress', { userId }, userId)
    const weakResult = await executeTool('get_weak_points', { userId }, userId)

    const ctx = buildUserContext(userId)
    const userContextStr = formatContextForPrompt(ctx)
    const systemPrompt = getSystemPrompt('planner')
    const userInput = `请根据用户最新的学习进度和薄弱点变化，调整学习策略。\n\n学习进度：\n${JSON.stringify(progressResult, null, 2)}\n\n薄弱知识点：\n${JSON.stringify(weakResult, null, 2)}\n\n请分析并调整学习计划。`

    const { system, messages } = buildMessages(systemPrompt, userContextStr, userInput)
    const tools = getToolDefinitions()

    return this.runToolLoop(system, messages, userId, tools)
  }

  /**
   * 通用工具循环
   */
  async runToolLoop(system, messages, userId, tools) {
    const maxTurns = 10
    const allToolResults = []

    for (let turn = 0; turn < maxTurns; turn++) {
      console.log(`  🔁 PlannerAgent 第 ${turn + 1} 轮...`)
      const response = await chat(messages, { system, tools })

      const toolUses = response.content.filter(c => c.type === 'tool_use')
      if (toolUses.length === 0) {
        const textBlock = response.content.find(c => c.type === 'text')
        const text = textBlock ? textBlock.text : 'AI 回复生成失败'
        return { success: true, content: text, toolCalls: allToolResults, turns: turn + 1 }
      }

      const toolResults = []
      for (const toolUse of toolUses) {
        try {
          const result = await executeTool(toolUse.name, toolUse.input, userId)
          allToolResults.push({ tool: toolUse.name, input: toolUse.input, result })
          toolResults.push({
            type: 'tool_result',
            tool_use_id: toolUse.id,
            content: JSON.stringify(result)
          })
        } catch (err) {
          console.error(`  ❌ 工具 ${toolUse.name} 执行失败:`, err.message)
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

    // 超时
    const lastText = messages
      .filter(m => Array.isArray(m.content))
      .flatMap(m => m.content)
      .filter(c => c.type === 'text')
      .pop()
    return {
      success: true,
      content: lastText ? lastText.text : '规划处理超时',
      toolCalls: allToolResults,
      turns: maxTurns,
      timedOut: true
    }
  }
}

export default new PlannerAgent()
