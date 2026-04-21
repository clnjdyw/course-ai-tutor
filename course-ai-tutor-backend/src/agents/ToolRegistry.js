/**
 * 工具注册中心 - 管理所有可供 AI 调用的工具
 */

const tools = new Map()

/**
 * 注册工具
 */
export function registerTool(name, definition, handler) {
  tools.set(name, { definition, handler })
}

/**
 * 执行工具
 */
export async function executeTool(name, params, userId) {
  const tool = tools.get(name)
  if (!tool) {
    throw new Error(`工具不存在: ${name}`)
  }
  return tool.handler(params, userId)
}

/**
 * 获取所有工具定义（Anthropic tool format）
 */
export function getToolDefinitions() {
  const defs = []
  for (const [name, { definition }] of tools) {
    defs.push({
      name,
      description: definition.description,
      input_schema: definition.input_schema
    })
  }
  return defs
}

/**
 * 获取工具名称列表
 */
export function getToolNames() {
  return Array.from(tools.keys())
}

/**
 * 批量注册工具
 */
export function registerAll(toolList) {
  for (const tool of toolList) {
    registerTool(tool.name, tool.definition, tool.handler)
  }
}
