<template>
  <div class="battle-view">
    <!-- 匹配大厅 -->
    <div v-if="gameState === 'lobby'" class="lobby-container">
      <div class="lobby-header">
        <h1 class="battle-title">🎮 PK 对战</h1>
        <p class="battle-subtitle">实时双人答题挑战</p>
      </div>

      <!-- 我的信息 -->
      <div class="player-card my-card">
        <div class="avatar">🧑‍🎓</div>
        <div class="info">
          <div class="name">{{ playerName }}</div>
          <div class="rating">⭐ 积分：{{ playerRating }}</div>
        </div>
        <div class="status-badge online">在线</div>
      </div>

      <!-- 开始匹配按钮 -->
      <div class="match-section">
        <button
          class="match-btn"
          :disabled="isMatching"
          @click="startMatching"
        >
          <span v-if="!isMatching">
            <span class="btn-icon">⚔️</span>
            开始匹配
          </span>
          <span v-else>
            <span class="spinner">🔍</span>
            匹配中...
          </span>
        </button>
      </div>

      <!-- 在线玩家列表 -->
      <div class="players-section">
        <h3 class="section-title">🎯 在线玩家</h3>
        <div class="players-list">
          <div
            v-for="player in onlinePlayers"
            :key="player.id"
            class="player-item"
            :class="{ 'is-me': player.id === myUserId }"
          >
            <span class="player-avatar">
              {{ player.id === myUserId ? '🧑‍🎓' : '👤' }}
            </span>
            <span class="player-name">{{ player.username }}</span>
            <span class="player-rating">⭐ {{ player.rating }}</span>
            <span class="player-status" :class="player.status">
              {{ player.status === 'online' ? '🟢' : '🟡' }}
            </span>
          </div>
        </div>
      </div>

      <!-- 对战记录 -->
      <div class="history-section">
        <h3 class="section-title">📜 对战记录</h3>
        <div class="history-list">
          <div v-for="(record, index) in battleHistory" :key="index" class="history-item">
            <span class="result-icon">{{ record.result === 'win' ? '🏆' : '💪' }}</span>
            <span class="result-text">{{ record.result === 'win' ? '胜利' : '惜败' }}</span>
            <span class="rating-change" :class="record.result === 'win' ? 'positive' : 'negative'">
              {{ record.result === 'win' ? '+' : '' }}{{ record.ratingChange }}
            </span>
          </div>
          <div v-if="battleHistory.length === 0" class="empty-history">
            还没有对战记录，开始第一场挑战吧！
          </div>
        </div>
      </div>
    </div>

    <!-- 匹配中 -->
    <div v-if="gameState === 'matching'" class="matching-container">
      <div class="matching-content">
        <div class="matching-animation">
          <div class="crystal-ball">🔮</div>
          <div class="matching-text">正在寻找对手...</div>
        </div>
        <div class="matching-info">
          <p>预计等待时间：<span class="wait-time">{{ waitTime }}秒</span></p>
          <p>当前在线：{{ onlinePlayers.length }} 人</p>
        </div>
        <button class="cancel-btn" @click="cancelMatching">取消匹配</button>
      </div>
    </div>

    <!-- 对战中 -->
    <div v-if="gameState === 'battling'" class="battle-container">
      <!-- 顶部信息栏 -->
      <div class="battle-header">
        <div class="battle-player" :class="{ active: myTurn }">
          <div class="bp-avatar">🧑‍🎓</div>
          <div class="bp-info">
            <div class="bp-name">{{ playerName }}</div>
            <div class="bp-score">得分：{{ myScore }}</div>
          </div>
          <div v-if="myTurn" class="turn-indicator">该你了</div>
        </div>

        <div class="vs-divider">
          <span class="vs-text">VS</span>
        </div>

        <div class="battle-player opponent" :class="{ active: opponentTurn }">
          <div class="bp-avatar">👤</div>
          <div class="bp-info">
            <div class="bp-name">{{ opponentName }}</div>
            <div class="bp-score">得分：{{ opponentScore }}</div>
          </div>
          <div v-if="opponentTurn" class="turn-indicator">思考中...</div>
        </div>
      </div>

      <!-- 题目区域 -->
      <div class="question-area">
        <div class="question-timer">
          <div class="timer-bar" :style="{ width: timerWidth + '%' }"></div>
        </div>
        <div class="question-content">
          <div class="question-type">
            <span class="type-badge">{{ currentQuestion?.type || '数学' }}</span>
          </div>
          <h2 class="question-text">{{ currentQuestion?.question || '题目加载中...' }}</h2>
        </div>
      </div>

      <!-- 选项区域 -->
      <div class="options-area">
        <button
          v-for="(option, index) in shuffledOptions"
          :key="index"
          class="option-btn"
          :class="{
            'selected': selectedAnswer === option,
            'correct': showResult && option === currentQuestion?.answer,
            'wrong': showResult && selectedAnswer === option && option !== currentQuestion?.answer
          }"
          :disabled="hasAnswered || showResult"
          @click="selectAnswer(option)"
        >
          <span class="option-letter">{{ String.fromCharCode(65 + index) }}</span>
          <span class="option-text">{{ option }}</span>
        </button>
      </div>

      <!-- 提交按钮 -->
      <div class="action-area">
        <button
          class="submit-btn"
          :disabled="selectedAnswer === null || hasAnswered"
          @click="submitAnswer"
        >
          提交答案
        </button>
      </div>

      <!-- 聊天区域 -->
      <div class="chat-area">
        <div class="chat-messages" ref="chatMessages">
          <div v-for="(msg, index) in chatMessages" :key="index" class="chat-message">
            <span class="chat-sender">{{ msg.username }}:</span>
            <span class="chat-content">{{ msg.message }}</span>
          </div>
        </div>
        <div class="chat-input-area">
          <input
            v-model="chatInput"
            type="text"
            placeholder="说点什么..."
            class="chat-input"
            @keyup.enter="sendChat"
          />
          <button class="send-btn" @click="sendChat">发送</button>
        </div>
      </div>
    </div>

    <!-- 对战结束 -->
    <div v-if="gameState === 'ended'" class="result-container">
      <div class="result-content">
        <div class="result-icon">
          {{ winner === myUserId ? '🏆' : '💪' }}
        </div>
        <h2 class="result-title">
          {{ winner === myUserId ? '恭喜你获胜！' : (winner === 'tie' ? '平局！' : '继续加油！') }}
        </h2>

        <div class="score-board">
          <div class="score-item my-score">
            <div class="score-avatar">🧑‍🎓</div>
            <div class="score-info">
              <div class="score-name">{{ playerName }}</div>
              <div class="score-value">{{ myFinalScore }}</div>
            </div>
          </div>
          <div class="score-divider">VS</div>
          <div class="score-item opponent-score">
            <div class="score-avatar">👤</div>
            <div class="score-info">
              <div class="score-name">{{ opponentName }}</div>
              <div class="score-value">{{ opponentFinalScore }}</div>
            </div>
          </div>
        </div>

        <div class="reward-section">
          <div class="reward-item">
            <span class="reward-icon">⭐</span>
            <span class="reward-label">积分变化</span>
            <span class="reward-value" :class="ratingChange >= 0 ? 'positive' : 'negative'">
              {{ ratingChange >= 0 ? '+' : '' }}{{ ratingChange }}
            </span>
          </div>
          <div class="reward-item">
            <span class="reward-icon">🏅</span>
            <span class="reward-label">经验值</span>
            <span class="reward-value">+{{ expGained }}</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class=" rematch-btn" @click="startMatching">再来一局</button>
          <button class="back-btn" @click="backToLobby">返回大厅</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'

// 游戏状态
const gameState = ref('lobby') // lobby, matching, battling, ended

// 用户信息
const myUserId = ref(localStorage.getItem('userId') || '')
const playerName = ref(localStorage.getItem('username') || '玩家' + Math.floor(Math.random() * 1000))
const playerRating = ref(parseInt(localStorage.getItem('userRating') || '1000'))
const myScore = ref(0)
const opponentScore = ref(0)
const myFinalScore = ref(0)
const opponentFinalScore = ref(0)

// 匹配
const isMatching = ref(false)
const waitTime = ref(3)

// 在线玩家
const onlinePlayers = ref([])

// 对战
const roomId = ref('')
const currentQuestion = ref(null)
const selectedAnswer = ref(null)
const shuffledOptions = ref([])
const hasAnswered = ref(false)
const showResult = ref(false)
const myTurn = ref(true)
const opponentTurn = ref(false)
const opponentName = ref('对手')

// 计时器
const timeLeft = ref(100)
const timerWidth = computed(() => timeLeft.value)

// 聊天
const chatMessages = ref([])
const chatInput = ref('')

// 对战记录
const battleHistory = ref([])

// 结算
const winner = ref('')
const ratingChange = ref(0)
const expGained = ref(0)

// WebSocket
let ws = null
let reconnectTimer = null

// 连接 WebSocket
const connectWebSocket = () => {
  const wsUrl = `ws://localhost:8081/ws/battle`
  ws = new WebSocket(wsUrl)

  ws.onopen = () => {
    console.log('WebSocket 已连接')
    ElMessage.success('服务器已连接')
  }

  ws.onmessage = (event) => {
    const data = JSON.parse(event.data)
    handleServerMessage(data)
  }

  ws.onclose = () => {
    console.log('WebSocket 已断开')
    // 3 秒后重连
    reconnectTimer = setTimeout(() => {
      if (gameState.value !== 'battling') {
        connectWebSocket()
      }
    }, 3000)
  }

  ws.onerror = (error) => {
    console.error('WebSocket 错误:', error)
  }
}

// 处理服务器消息
const handleServerMessage = (data) => {
  console.log('收到消息:', data)

  switch (data.type) {
    case 'login_success':
      myUserId.value = data.userId
      onlinePlayers.value = data.players.filter(p => p.id !== data.userId)
      break

    case 'player_list':
      onlinePlayers.value = data.players.filter(p => p.id !== myUserId.value)
      break

    case 'waiting_for_opponent':
      roomId.value = data.roomId
      ElMessage.info('已找到房间，等待对手加入...')
      break

    case 'battle_start':
      gameState.value = 'battling'
      roomId.value = data.roomId
      currentQuestion.value = data.question
      shuffledOptions.value = [...data.question.options].sort(() => Math.random() - 0.5)
      opponentName.value = data.player1.userId === myUserId.value
        ? (data.player2.username || '对手')
        : (data.player1.username || '对手')
      myScore.value = 0
      opponentScore.value = 0
      hasAnswered.value = false
      showResult.value = false
      selectedAnswer.value = null
      timeLeft.value = 100
      startTimer()
      ElMessage.success('对战开始！')
      break

    case 'opponent_answered':
      opponentTurn.value = false
      if (data.isCorrect) {
        ElMessage.warning('对手答对了！')
      } else {
        ElMessage.info('对手答错了')
      }
      break

    case 'answer_result':
      hasAnswered.value = true
      showResult.value = true
      if (data.isCorrect) {
        myScore.value = 100
        ElMessage.success('答对了！+')
      } else {
        myScore.value = 0
        ElMessage.error('答错了')
      }
      break

    case 'battle_end':
      endBattle(data)
      break

    case 'chat_message':
      chatMessages.value.push({
        username: data.username,
        message: data.message
      })
      nextTick(() => {
        const chatEl = document.querySelector('.chat-messages')
        if (chatEl) chatEl.scrollTop = chatEl.scrollHeight
      })
      break

    case 'player_left':
      ElMessage.warning('对手离开了')
      setTimeout(() => {
        backToLobby()
      }, 2000)
      break
  }
}

// 开始匹配
const startMatching = () => {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    connectWebSocket()
  }

  // 登录
  ws.send(JSON.stringify({
    type: 'login',
    userId: localStorage.getItem('username') || 'player_' + Date.now(),
    username: playerName.value,
    rating: playerRating.value
  }))

  // 延迟发送匹配请求
  setTimeout(() => {
    ws.send(JSON.stringify({ type: 'find_match' }))
    isMatching.value = true
    gameState.value = 'matching'
    waitTime.value = 3

    // 模拟等待时间减少
    const waitInterval = setInterval(() => {
      if (waitTime.value > 0) {
        waitTime.value--
      } else {
        clearInterval(waitInterval)
      }
    }, 1000)
  }, 500)
}

// 取消匹配
const cancelMatching = () => {
  isMatching.value = false
  gameState.value = 'lobby'
}

// 选择答案
const selectAnswer = (option) => {
  if (hasAnswered.value) return
  selectedAnswer.value = option
}

// 提交答案
const submitAnswer = () => {
  if (selectedAnswer.value === null) return

  hasAnswered.value = true
  ws.send(JSON.stringify({
    type: 'submit_answer',
    answer: selectedAnswer.value
  }))

  // 3 秒后显示下一题或结束
  setTimeout(() => {
    // 简单起见，答题后直接结束
    ws.send(JSON.stringify({
      type: 'leave_room'
    }))
  }, 3000)
}

// 结束对战
const endBattle = (data) => {
  gameState.value = 'ended'
  winner.value = data.winner
  myFinalScore.value = myScore.value
  opponentFinalScore.value = opponentScore.value

  if (data.winner === myUserId.value) {
    ratingChange.value = Math.floor(Math.random() * 20) + 10
    playerRating.value += ratingChange.value
  } else {
    ratingChange.value = -Math.floor(Math.random() * 15) - 5
    playerRating.value = Math.max(0, playerRating.value + ratingChange.value)
  }

  expGained.value = data.winner === myUserId.value ? 50 : 20

  // 添加到历史记录
  battleHistory.value.unshift({
    result: data.winner === myUserId.value ? 'win' : 'loss',
    ratingChange: ratingChange.value
  })
}

// 返回大厅
const backToLobby = () => {
  if (ws) {
    ws.send(JSON.stringify({ type: 'leave_room' }))
  }
  gameState.value = 'lobby'
  myScore.value = 0
  opponentScore.value = 0
  currentQuestion.value = null
  chatMessages.value = []
}

// 发送聊天
const sendChat = () => {
  if (!chatInput.value.trim() || !ws) return

  ws.send(JSON.stringify({
    type: 'chat',
    message: chatInput.value.trim()
  }))
  chatInput.value = ''
}

// 计时器
const startTimer = () => {
  const timer = setInterval(() => {
    if (timeLeft.value > 0 && gameState.value === 'battling') {
      timeLeft.value -= 1
    } else {
      clearInterval(timer)
      if (!hasAnswered.value && gameState.value === 'battling') {
        // 超时自动提交
        submitAnswer()
      }
    }
  }, 100)
}

onMounted(() => {
  connectWebSocket()
})

onUnmounted(() => {
  if (ws) {
    ws.close()
  }
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
  }
})
</script>

<style scoped>
.battle-view {
  min-height: 100%;
  padding: 24px;
}

/* 匹配大厅 */
.lobby-container {
  max-width: 800px;
  margin: 0 auto;
}

.lobby-header {
  text-align: center;
  margin-bottom: 32px;
}

.battle-title {
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.battle-subtitle {
  font-size: 16px;
  color: #718096;
}

.player-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
  border-radius: 20px;
  border: 2px solid rgba(102, 126, 234, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.avatar {
  width: 70px;
  height: 70px;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.info {
  flex: 1;
}

.name {
  font-size: 20px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 4px;
}

.rating {
  font-size: 14px;
  color: #718096;
}

.status-badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
}

.status-badge.online {
  background: linear-gradient(135deg, #48bb78, #38a169);
  color: white;
}

.match-section {
  text-align: center;
  margin-bottom: 32px;
}

.match-btn {
  padding: 20px 60px;
  font-size: 22px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 20px;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.match-btn:hover:not(:disabled) {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(102, 126, 234, 0.5);
}

.match-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-icon {
  margin-right: 10px;
  font-size: 28px;
}

.spinner {
  animation: spin 1s linear infinite;
  display: inline-block;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
}

.players-section, .history-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.players-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.player-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 12px;
  transition: all 0.2s ease;
}

.player-item:hover {
  background: rgba(102, 126, 234, 0.1);
  transform: translateX(4px);
}

.player-item.is-me {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.15) 0%, rgba(118, 75, 162, 0.15) 100%);
  border: 1px solid rgba(102, 126, 234, 0.3);
}

.player-avatar {
  font-size: 24px;
}

.player-name {
  flex: 1;
  font-weight: 600;
  color: #2d3748;
}

.player-rating {
  font-size: 14px;
  color: #718096;
  margin-right: 12px;
}

.player-status {
  font-size: 12px;
}

.empty-history {
  text-align: center;
  color: #a0aec0;
  padding: 20px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.result-icon {
  font-size: 20px;
}

.result-text {
  font-weight: 600;
  color: #2d3748;
}

.rating-change {
  margin-left: auto;
  font-weight: 700;
}

.rating-change.positive {
  color: #48bb78;
}

.rating-change.negative {
  color: #f56565;
}

/* 匹配中 */
.matching-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.matching-content {
  text-align: center;
}

.matching-animation {
  margin-bottom: 24px;
}

.crystal-ball {
  font-size: 80px;
  animation: crystalPulse 2s ease-in-out infinite;
}

@keyframes crystalPulse {
  0%, 100% {
    transform: scale(1);
    filter: brightness(1);
  }
  50% {
    transform: scale(1.1);
    filter: brightness(1.3);
  }
}

.matching-text {
  font-size: 20px;
  color: #2d3748;
  margin-top: 16px;
}

.matching-info {
  color: #718096;
  margin-bottom: 24px;
}

.wait-time {
  color: #667eea;
  font-weight: 700;
}

.cancel-btn {
  padding: 12px 32px;
  font-size: 16px;
  color: #718096;
  background: white;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.cancel-btn:hover {
  border-color: #f56565;
  color: #f56565;
}

/* 对战中 */
.battle-container {
  max-width: 700px;
  margin: 0 auto;
}

.battle-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.battle-player {
  display: flex;
  align-items: center;
  gap: 12px;
  position: relative;
  transition: all 0.3s ease;
}

.battle-player.active {
  transform: scale(1.05);
}

.bp-avatar {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.bp-info {
  text-align: left;
}

.bp-name {
  font-weight: 700;
  color: #2d3748;
}

.bp-score {
  font-size: 14px;
  color: #718096;
}

.turn-indicator {
  position: absolute;
  top: -10px;
  right: -10px;
  background: linear-gradient(135deg, #f6ad55, #ed8936);
  color: white;
  padding: 4px 8px;
  border-radius: 8px;
  font-size: 11px;
  font-weight: 700;
  animation: bounce 0.5s ease-in-out infinite;
}

.vs-divider {
  position: relative;
}

.vs-text {
  font-size: 28px;
  font-weight: 800;
  background: linear-gradient(135deg, #f56565, #c53030);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.question-area {
  background: white;
  border-radius: 20px;
  padding: 24px;
  margin-bottom: 20px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.question-timer {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 20px;
}

.timer-bar {
  height: 100%;
  background: linear-gradient(90deg, #48bb78, #f56565);
  transition: width 0.1s linear;
}

.question-type {
  text-align: center;
  margin-bottom: 16px;
}

.type-badge {
  display: inline-block;
  padding: 6px 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.question-text {
  text-align: center;
  font-size: 26px;
  font-weight: 700;
  color: #2d3748;
  margin: 0;
}

.options-area {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 20px;
}

.option-btn {
  padding: 24px;
  background: white;
  border: 3px solid #e2e8f0;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
}

.option-btn:hover:not(:disabled) {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.05);
  transform: translateY(-2px);
}

.option-btn.selected {
  border-color: #667eea;
  background: rgba(102, 126, 234, 0.15);
}

.option-btn.correct {
  border-color: #48bb78;
  background: rgba(72, 187, 120, 0.2);
}

.option-btn.wrong {
  border-color: #f56565;
  background: rgba(245, 101, 101, 0.2);
}

.option-letter {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 16px;
  color: #4a5568;
}

.option-btn.selected .option-letter {
  background: #667eea;
  color: white;
}

.option-btn.correct .option-letter {
  background: #48bb78;
  color: white;
}

.option-btn.wrong .option-letter {
  background: #f56565;
  color: white;
}

.action-area {
  text-align: center;
  margin-bottom: 20px;
}

.submit-btn {
  padding: 16px 60px;
  font-size: 18px;
  font-weight: 700;
  color: white;
  background: linear-gradient(135deg, #667eea, #764ba2);
  border: none;
  border-radius: 16px;
  cursor: pointer;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.2s ease;
}

.submit-btn:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
}

.submit-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.chat-area {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
}

.chat-messages {
  height: 150px;
  overflow-y: auto;
  padding: 16px;
}

.chat-message {
  margin-bottom: 8px;
  font-size: 14px;
}

.chat-sender {
  font-weight: 700;
  color: #667eea;
  margin-right: 8px;
}

.chat-content {
  color: #4a5568;
}

.chat-input-area {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid #e2e8f0;
}

.chat-input {
  flex: 1;
  padding: 10px 16px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s ease;
}

.chat-input:focus {
  border-color: #667eea;
}

.send-btn {
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.send-btn:hover {
  transform: scale(1.05);
}

/* 对战结束 */
.result-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
}

.result-content {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  box-shadow: 0 8px 48px rgba(0, 0, 0, 0.15);
  max-width: 500px;
}

.result-icon {
  font-size: 100px;
  margin-bottom: 16px;
  animation: celebrate 0.6s ease-in-out infinite alternate;
}

@keyframes celebrate {
  from { transform: translateY(0) rotate(-5deg); }
  to { transform: translateY(-10px) rotate(5deg); }
}

.result-title {
  font-size: 28px;
  font-weight: 800;
  color: #2d3748;
  margin-bottom: 32px;
}

.score-board {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 16px;
}

.score-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: white;
  border-radius: 12px;
  min-width: 120px;
}

.score-avatar {
  font-size: 32px;
}

.score-info {
  text-align: left;
}

.score-name {
  font-size: 12px;
  color: #718096;
}

.score-value {
  font-size: 28px;
  font-weight: 800;
  color: #2d3748;
}

.score-divider {
  font-size: 20px;
  font-weight: 800;
  color: #a0aec0;
}

.reward-section {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-bottom: 32px;
}

.reward-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 24px;
  background: linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 165, 0, 0.15) 100%);
  border-radius: 16px;
  border: 2px solid rgba(255, 215, 0, 0.3);
}

.reward-icon {
  font-size: 32px;
}

.reward-label {
  font-size: 12px;
  color: #718096;
}

.reward-value {
  font-size: 24px;
  font-weight: 800;
}

.reward-value.positive {
  color: #48bb78;
}

.reward-value.negative {
  color: #f56565;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
}

.rematch-btn, .back-btn {
  padding: 16px 40px;
  font-size: 16px;
  font-weight: 700;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.rematch-btn {
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
}

.rematch-btn:hover {
  transform: translateY(-2px);
}

.back-btn {
  background: white;
  color: #4a5568;
  border: 2px solid #e2e8f0;
}

.back-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

/* 响应式 */
@media (max-width: 768px) {
  .options-area {
    grid-template-columns: 1fr;
  }

  .battle-header {
    flex-direction: column;
    gap: 16px;
  }

  .vs-divider {
    transform: rotate(90deg);
  }

  .reward-section {
    flex-direction: column;
    gap: 12px;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
