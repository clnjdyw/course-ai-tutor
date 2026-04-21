/**
 * AI Service - 共享AI模型调用服务
 *
 * 使用 SiliconFlow API（OpenAI兼容接口）进行真正的AI调用。
 * 配置从 openclaw-skills/package.json 的 openclaw.ai 中读取。
 */

import fetch from 'node-fetch';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 读取 OpenClaw 配置
 */
function loadConfig() {
  const configPath = resolve(__dirname, '../package.json');
  const config = JSON.parse(readFileSync(configPath, 'utf-8'));
  return config.openclaw?.ai || {};
}

/**
 * 调用 AI 模型
 *
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @param {object} options - 可选参数
 * @param {number} options.temperature - 温度
 * @param {number} options.maxTokens - 最大token数
 * @param {string} options.model - 模型名称
 * @param {string} options.baseUrl - API地址
 * @param {string} options.apiKey - API密钥
 * @returns {Promise<string>} AI生成的内容
 */
export async function callAIModel(systemPrompt, userPrompt, options = {}) {
  const config = loadConfig();

  const baseUrl = options.baseUrl || config.baseUrl || 'https://coding.dashscope.aliyuncs.com/v1';
  const model = options.model || config.model || 'qwen3.6-plus';
  const temperature = options.temperature ?? config.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? config.maxTokens ?? 4096;
  const apiKey = options.apiKey || process.env.SILICONFLOW_API_KEY || config.apiKey;
  
  if (!apiKey) {
    throw new Error('缺少 API 密钥。请设置 SILICONFLOW_API_KEY 环境变量或在配置文件中提供 apiKey');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('AI API返回空响应');
  }

  return data.choices[0].message.content;
}

/**
 * 流式调用 AI 模型
 *
 * @param {string} systemPrompt - 系统提示词
 * @param {string} userPrompt - 用户提示词
 * @param {function} onChunk - 每收到一个chunk的回调
 * @param {object} options - 可选参数
 * @returns {Promise<string>} 完整响应内容
 */
export async function callAIModelStream(systemPrompt, userPrompt, onChunk, options = {}) {
  const config = loadConfig();

  const baseUrl = options.baseUrl || config.baseUrl || 'https://coding.dashscope.aliyuncs.com/v1';
  const model = options.model || config.model || 'qwen3.6-plus';
  const temperature = options.temperature ?? config.temperature ?? 0.7;
  const maxTokens = options.maxTokens ?? config.maxTokens ?? 4096;
  const apiKey = options.apiKey || process.env.SILICONFLOW_API_KEY || config.apiKey;
  
  if (!apiKey) {
    throw new Error('缺少 API 密钥。请设置 SILICONFLOW_API_KEY 环境变量或在配置文件中提供 apiKey');
  }

  const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature,
      max_tokens: maxTokens,
      stream: true
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API请求失败: ${response.status} ${response.statusText} - ${errorText}`);
  }

  let fullContent = '';
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n').filter(line => line.trim().startsWith('data: '));

    for (const line of lines) {
      const jsonStr = line.replace('data: ', '').trim();
      if (jsonStr === '[DONE]') continue;

      try {
        const json = JSON.parse(jsonStr);
        const content = json.choices?.[0]?.delta?.content;
        if (content) {
          fullContent += content;
          if (onChunk) onChunk(content, fullContent);
        }
      } catch (e) {
        // 跳过解析失败的行
      }
    }
  }

  return fullContent;
}

export const aiService = {
  callAIModel,
  callAIModelStream
};

export default aiService;
