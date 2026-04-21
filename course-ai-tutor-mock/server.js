import express from 'express'
import cors from 'cors'
import fetch from 'node-fetch'
import { createServer } from 'http'
import { WebSocketServer } from 'ws'

// 导入 OpenClaw 技能
import { handleMessage, getAgentStatus, getAgentList, updatePerformance, getMoodState, getMoodHistory } from '../openclaw-skills/skill-agent-manager/index.js';
import { skill as companionSkill } from '../openclaw-skills/skill-companion/index.js';
import { moodService } from '../openclaw-skills/shared/mood-service.js';

const app = express()
const PORT = 8081
const RAG_SERVICE_URL = 'http://localhost:8083/api'

app.use(cors())
app.use(express.json())

// 创建 HTTP 服务器和 WebSocket 服务器
const server = createServer(app)
const wss = new WebSocketServer({ server, path: '/ws/battle' })

// 存储在线玩家
const players = new Map()
const battleRooms = new Map()

// ============================================
// OpenClaw 智能体 API（替换原 mock 响应）
// ============================================

// 统一智能体请求入口
app.post('/api/agent/request', async (req, res) => {
  const { type, content, context, userId, knowledgeBaseId } = req.body
  console.log(`🤖 收到${type}请求 from user ${userId}:`, content)

  try {
    // 构建用户消息
    const message = buildUserMessage(type, content, context)

    // 调用 OpenClaw Agent Manager（使用 type 参数直接路由）
    const result = await handleMessage({
      message: content || '你好',
      userId: String(userId || '1'),
      context: { type, content, context, knowledgeBaseId },
      type // 显式传递 type 用于直接路由
    })

    // 附加 RAG 检索结果（如果可用）
    if (content && type !== 'chat') {
      try {
        const ragResults = await retrieveFromRAG(content, knowledgeBaseId)
        if (ragResults.length > 0) {
          result.ragResults = ragResults
          result.hasKnowledgeBase = true
        }
      } catch (e) {
        // RAG 不可用，忽略
      }
    }

    res.json(result)
  } catch (error) {
    console.error('智能体请求失败:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      agentType: type || 'unknown'
    })
  }
})

// 聊天接口（陪伴智能体）
app.post('/api/agent/chat', async (req, res) => {
  const { userId, message } = req.body
  console.log(`💬 收到聊天请求 from user ${userId}:`, message)

  try {
    const result = await companionSkill.actions.chat({
      userId: String(userId || '1'),
      message: message || ''
    })
    res.json(result)
  } catch (error) {
    console.error('聊天请求失败:', error)
    res.status(500).json({
      success: false,
      error: error.message,
      agentType: 'companion'
    })
  }
})

// 获取智能体状态
app.get('/api/agent/status', async (req, res) => {
  try {
    const status = await getAgentStatus()
    res.json({
      status: 'ok',
      ...status,
      battle: {
        websocket: wss.clients.size > 0 ? 'online' : 'online',
        rooms: battleRooms.size
      }
    })
  } catch (error) {
    res.json({ status: 'error', message: error.message })
  }
})

// 获取智能体列表
app.get('/api/agent/list', async (req, res) => {
  try {
    const list = await getAgentList()
    res.json(list)
  } catch (error) {
    res.json([])
  }
})

// ============================================
// 情绪状态 API
// ============================================

// 获取用户情绪状态
app.get('/api/mood/state', async (req, res) => {
  const { userId } = req.query
  try {
    const result = await getMoodState({ userId: String(userId || '1') })
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 获取情绪历史
app.get('/api/mood/history', async (req, res) => {
  const { userId, limit } = req.query
  try {
    const result = await getMoodHistory({
      userId: String(userId || '1'),
      limit: parseInt(limit || '10')
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// 更新情绪表现
app.post('/api/mood/update', async (req, res) => {
  const { userId, correct, total, date } = req.body
  try {
    const result = await updatePerformance({
      userId: String(userId || '1'),
      correct: correct || 0,
      total: total || 0,
      date: date || new Date().toISOString()
    })
    res.json(result)
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})

// ============================================
// PK 对战 WebSocket（保持不变）
// ============================================

wss.on('connection', (ws, req) => {
  console.log('🎮 新玩家连接 WebSocket')

  let currentUserId = null
  let currentRoomId = null

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message)
      console.log('📩 收到消息:', data)

      switch (data.type) {
        case 'login':
          currentUserId = data.userId || `player_${Date.now()}`
          players.set(currentUserId, {
            ws,
            username: data.username || '玩家' + Math.floor(Math.random() * 1000),
            rating: data.rating || 1000,
            status: 'online'
          })
          ws.send(JSON.stringify({
            type: 'login_success',
            userId: currentUserId,
            players: Array.from(players.entries()).map(([id, p]) => ({
              id, username: p.username, rating: p.rating, status: p.status
            }))
          }))
          broadcastPlayerList()
          break

        case 'find_match':
          const roomId = findOrCreateMatch(currentUserId)
          if (roomId) {
            currentRoomId = roomId
            const room = battleRooms.get(roomId)
            if (room.player2) {
              startBattle(roomId)
            } else {
              ws.send(JSON.stringify({ type: 'waiting_for_opponent', roomId }))
            }
          } else {
            ws.send(JSON.stringify({ type: 'match_failed', reason: '暂无对手' }))
          }
          break

        case 'submit_answer':
          if (currentRoomId) {
            const result = submitAnswer(currentRoomId, currentUserId, data.answer)
            ws.send(JSON.stringify({ type: 'answer_result', ...result }))
            const room = battleRooms.get(currentRoomId)
            if (room && room.player1 && room.player2) {
              const opponentId = room.player1.userId === currentUserId ? room.player2.userId : room.player1.userId
              const opponent = players.get(opponentId)
              if (opponent && opponent.ws.readyState === 1) {
                opponent.ws.send(JSON.stringify({
                  type: 'opponent_answered',
                  isCorrect: result.isCorrect,
                  timeUsed: result.timeUsed
                }))
              }
            }
          }
          break

        case 'chat':
          if (currentRoomId) {
            broadcastToRoom(currentRoomId, {
              type: 'chat_message',
              userId: currentUserId,
              username: players.get(currentUserId)?.username || '玩家',
              message: data.message
            })
          }
          break

        case 'leave_room':
          if (currentRoomId) {
            leaveRoom(currentRoomId, currentUserId)
            currentRoomId = null
          }
          break
      }
    } catch (error) {
      console.error('处理消息失败:', error)
      ws.send(JSON.stringify({ type: 'error', message: error.message }))
    }
  })

  ws.on('close', () => {
    console.log('玩家断开连接')
    if (currentUserId) {
      players.delete(currentUserId)
      broadcastPlayerList()
    }
    if (currentRoomId) {
      leaveRoom(currentRoomId, currentUserId)
    }
  })
})

// PK 对战相关函数
function findOrCreateMatch(userId) {
  for (const [roomId, room] of battleRooms.entries()) {
    if (room.status === 'waiting' && room.player1.userId !== userId) {
      room.player2 = { userId, joinedAt: Date.now() }
      room.status = 'ready'
      return roomId
    }
  }
  const roomId = `battle_${Date.now()}`
  battleRooms.set(roomId, {
    player1: { userId, joinedAt: Date.now() },
    player2: null,
    question: null,
    answers: new Map(),
    startTime: null,
    status: 'waiting'
  })
  return roomId
}

function startBattle(roomId) {
  const room = battleRooms.get(roomId)
  if (!room || room.status !== 'ready') return

  room.status = 'active'
  room.startTime = Date.now()

  const a = Math.floor(Math.random() * 20) + 1
  const b = Math.floor(Math.random() * 20) + 1
  const isAddition = Math.random() > 0.5
  room.question = {
    type: 'math',
    question: isAddition ? `${a} + ${b} = ?` : `${Math.max(a, b)} - ${Math.min(a, b)} = ?`,
    answer: isAddition ? a + b : Math.max(a, b) - Math.min(a, b),
    options: generateOptions(isAddition ? a + b : Math.max(a, b) - Math.min(a, b))
  }

  const battleData = {
    type: 'battle_start',
    roomId,
    player1: room.player1,
    player2: room.player2,
    question: room.question
  }

  notifyRoom(roomId, battleData)
}

function generateOptions(correctAnswer) {
  const options = [correctAnswer]
  while (options.length < 4) {
    const wrong = correctAnswer + Math.floor(Math.random() * 10) - 5
    if (wrong !== correctAnswer && wrong > 0 && !options.includes(wrong)) {
      options.push(wrong)
    }
  }
  return options.sort(() => Math.random() - 0.5)
}

function submitAnswer(roomId, userId, answer) {
  const room = battleRooms.get(roomId)
  if (!room || room.status !== 'active') return { success: false }

  const isCorrect = parseInt(answer) === room.question.answer
  const timeUsed = Date.now() - room.startTime

  room.answers.set(userId, { answer, isCorrect, timeUsed })

  if (room.answers.size >= 2 || (room.player2 && room.answers.size >= 1 && Date.now() - room.startTime > 30000)) {
    endBattle(roomId)
  }

  return { success: true, isCorrect, correctAnswer: room.question.answer, timeUsed }
}

function endBattle(roomId) {
  const room = battleRooms.get(roomId)
  if (!room) return

  room.status = 'ended'

  let winner = null
  let loser = null

  for (const [userId, answerData] of room.answers.entries()) {
    if (answerData.isCorrect) {
      if (!winner || answerData.timeUsed < (room.answers.get(winner)?.timeUsed || Infinity)) {
        loser = winner
        winner = userId
      }
    }
  }

  notifyRoom(roomId, {
    type: 'battle_end',
    winner,
    loser,
    answers: Array.from(room.answers.entries()).map(([userId, data]) => ({
      userId, ...data
    }))
  })

  setTimeout(() => battleRooms.delete(roomId), 60000)
}

function leaveRoom(roomId, userId) {
  const room = battleRooms.get(roomId)
  if (!room) return

  if (room.player1?.userId === userId) {
    room.player1 = null
  } else if (room.player2?.userId === userId) {
    room.player2 = null
  }

  if (!room.player1 && !room.player2) {
    battleRooms.delete(roomId)
  } else {
    notifyRoom(roomId, { type: 'player_left', leftUserId: userId })
  }
}

function notifyRoom(roomId, data) {
  const room = battleRooms.get(roomId)
  if (!room) return

  const playerIds = [room.player1?.userId, room.player2?.userId].filter(Boolean)
  for (const playerId of playerIds) {
    const player = players.get(playerId)
    if (player && player.ws.readyState === 1) {
      player.ws.send(JSON.stringify(data))
    }
  }
}

function broadcastToRoom(roomId, data) {
  notifyRoom(roomId, data)
}

function broadcastPlayerList() {
  const message = JSON.stringify({
    type: 'player_list',
    players: Array.from(players.entries()).map(([id, p]) => ({
      id, username: p.username, rating: p.rating, status: p.status
    }))
  })
  players.forEach(({ ws }) => {
    if (ws.readyState === 1) {
      ws.send(message)
    }
  })
}

// PK 对战 HTTP 接口
app.post('/api/battle/create', (req, res) => {
  const { userId, username } = req.body
  const roomId = `battle_${Date.now()}`
  battleRooms.set(roomId, {
    player1: { userId, username: username || '玩家', joinedAt: Date.now() },
    player2: null,
    question: null,
    answers: new Map(),
    startTime: null,
    status: 'waiting'
  })
  res.json({ success: true, roomId })
})

app.get('/api/battle/:roomId', (req, res) => {
  const room = battleRooms.get(req.params.roomId)
  if (!room) {
    return res.json({ success: false, message: '房间不存在' })
  }
  res.json({
    success: true,
    room: {
      ...room,
      player1: room.player1,
      player2: room.player2,
      status: room.status
    }
  })
})

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    websocket: wss.clients.size,
    battleRooms: battleRooms.size
  })
})

// ============================================
// 辅助函数
// ============================================

/**
 * 将前端 type 转换为统一消息
 */
function buildUserMessage(type, content, context) {
  if (content) return content
  switch (type) {
    case 'teach': return '请帮我讲解知识点'
    case 'plan': return '请帮我制定学习计划'
    case 'help': return '请帮我解答问题'
    case 'evaluate': return '请帮我评估作业'
    case 'chat': return '你好'
    default: return content || '你好'
  }
}

/**
 * RAG 检索
 */
async function retrieveFromRAG(query, knowledgeBaseId = null, topK = 5) {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/retrieve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, knowledgeBaseId, topK, threshold: 0.7 })
    })
    const { data } = await response.json()
    return data.results || []
  } catch (error) {
    return []
  }
}

// 启动服务
const startPort = process.env.PORT || PORT
server.listen(startPort, '0.0.0.0', () => {
  console.log('========================================')
  console.log('   🚀 Course AI Tutor - OpenClaw Backend')
  console.log('========================================')
  console.log(`   服务地址：http://0.0.0.0:${startPort}`)
  console.log(`   本地访问：http://localhost:${startPort}`)
  console.log(`   API 前缀：/api`)
  console.log(`   WebSocket: ws://localhost:${startPort}/ws/battle`)
  console.log('========================================')
  console.log('✅ OpenClaw 智能体 API 已就绪')
  console.log('✅ 情绪反馈系统已启用')
  console.log('✅ PK 对战 WebSocket 已就绪')
  console.log('========================================')
})
