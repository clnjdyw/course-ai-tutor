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

      <!-- 开始匹配 -->
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

      <!-- 对战模式选择 -->
      <div class="mode-selection">
        <h3 class="section-title">🎯 选择对战模式</h3>
        <div class="mode-cards">
          <div class="mode-card" :class="{ active: battleMode === 'quick' }" @click="battleMode = 'quick'">
            <div class="mode-icon">⚡</div>
            <div class="mode-name">快速对战</div>
            <div class="mode-desc">5道题，快速匹配对手</div>
          </div>
          <div class="mode-card" :class="{ active: battleMode === 'practice' }" @click="battleMode = 'practice'">
            <div class="mode-icon">🎯</div>
            <div class="mode-name">练习模式</div>
            <div class="mode-desc">10道题，AI模拟对手</div>
          </div>
          <div class="mode-card" :class="{ active: battleMode === 'challenge' }" @click="battleMode = 'challenge'">
            <div class="mode-icon">🏆</div>
            <div class="mode-name">挑战模式</div>
            <div class="mode-desc">20道题，高难度挑战</div>
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

      <!-- 进度指示 -->
      <div class="progress-indicator">
        <div class="progress-text">第 {{ currentQuestionIndex + 1 }} / {{ totalQuestions }} 题</div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: ((currentQuestionIndex + 1) / totalQuestions * 100) + '%' }"></div>
        </div>
      </div>

      <!-- 题目区域 -->
      <div class="question-area">
        <div class="question-timer">
          <div class="timer-bar" :style="{ width: timerWidth + '%' }"></div>
        </div>
        <div class="question-content">
          <div class="question-type">
            <span class="type-badge">{{ currentQuestion?.type || '综合' }}</span>
            <span class="difficulty-badge" :class="currentQuestion?.difficulty">{{ getDifficultyText(currentQuestion?.difficulty) }}</span>
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
      <div class="action-area" v-if="!showResult">
        <button
          class="submit-btn"
          :disabled="selectedAnswer === null || hasAnswered"
          @click="submitAnswer"
        >
          提交答案
        </button>
      </div>

      <!-- 下一题按钮 -->
      <div class="action-area" v-if="showResult && currentQuestionIndex < totalQuestions - 1">
        <button class="submit-btn" @click="nextQuestion">
          下一题 →
        </button>
      </div>
    </div>

    <!-- 对战结束 -->
    <div v-if="gameState === 'ended'" class="result-container">
      <div class="result-content">
        <div class="result-icon">
          {{ winner === 'me' ? '🏆' : (winner === 'tie' ? '🤝' : '💪') }}
        </div>
        <h2 class="result-title">
          {{ winner === 'me' ? '恭喜你获胜！' : (winner === 'tie' ? '平局！' : '继续加油！') }}
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

        <!-- 答题详情 -->
        <div class="details-section">
          <div class="detail-item">
            <span class="detail-label">正确率</span>
            <span class="detail-value">{{ accuracy }}%</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">用时</span>
            <span class="detail-value">{{ battleDuration }}秒</span>
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

        <!-- 反馈评分 -->
        <div class="feedback-section">
          <h3 class="feedback-title">对本次对战的评分</h3>
          <div class="rating-stars">
            <span
              v-for="star in 5"
              :key="star"
              class="star"
              :class="{ active: userRating >= star }"
              @click="userRating = star"
            >
              ★
            </span>
          </div>
          <textarea
            v-model="feedbackText"
            class="feedback-textarea"
            placeholder="对本次对战的感受或建议（可选）"
            rows="3"
          ></textarea>
        </div>

        <div class="action-buttons">
          <button class="rematch-btn" @click="startMatching">再来一局</button>
          <button class="back-btn" @click="backToLobby">返回大厅</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { historyApi, feedbackApi, exerciseApi } from '@/api'

const gameState = ref('lobby')
const battleMode = ref('practice')

const myUserId = ref(localStorage.getItem('userId') || '1')
const playerName = ref(localStorage.getItem('username') || '玩家' + Math.floor(Math.random() * 1000))
const playerRating = ref(parseInt(localStorage.getItem('userRating') || '1000'))

const myScore = ref(0)
const opponentScore = ref(0)
const myFinalScore = ref(0)
const opponentFinalScore = ref(0)

const isMatching = ref(false)
const waitTime = ref(3)

const roomId = ref('')
const currentQuestion = ref(null)
const currentQuestionIndex = ref(0)
const selectedAnswer = ref(null)
const shuffledOptions = ref([])
const hasAnswered = ref(false)
const showResult = ref(false)
const myTurn = ref(true)
const opponentTurn = ref(false)
const opponentName = ref('AI对手')

const timeLeft = ref(100)
const timerWidth = computed(() => timeLeft.value)

const battleHistory = ref([])
const winner = ref('')
const ratingChange = ref(0)
const expGained = ref(0)
const userRating = ref(0)
const feedbackText = ref('')
const battleDuration = ref(0)
const totalQuestions = ref(5)

const questionBank = ref([])
const battleResults = ref([])
let battleStartTime = null
let timer = null

const sampleQuestions = [
  {
    question: 'JavaScript 中 typeof null 的结果是什么？',
    options: ['null', 'undefined', 'object', 'number'],
    answer: 'object',
    type: 'JavaScript',
    difficulty: 'easy'
  },
  {
    question: 'Vue 3 中 ref 和 reactive 的区别是什么？',
    options: ['ref用于基本类型，reactive用于对象', 'ref用于对象，reactive用于基本类型', '两者没有区别', 'ref性能更好'],
    answer: 'ref用于基本类型，reactive用于对象',
    type: 'Vue',
    difficulty: 'medium'
  },
  {
    question: 'CSS 中 position: sticky 的行为是什么？',
    options: ['固定定位', '相对定位', '粘性定位，根据滚动位置在relative和fixed之间切换', '绝对定位'],
    answer: '粘性定位，根据滚动位置在relative和fixed之间切换',
    type: 'CSS',
    difficulty: 'medium'
  },
  {
    question: 'HTTP 状态码 304 表示什么？',
    options: ['请求成功', '资源未修改', '重定向', '服务器错误'],
    answer: '资源未修改',
    type: 'HTTP',
    difficulty: 'easy'
  },
  {
    question: 'React 中 useEffect 的清理函数什么时候执行？',
    options: ['组件挂载时', '组件更新时', '组件卸载时和下次效应执行前', '永远不会执行'],
    answer: '组件卸载时和下次效应执行前',
    type: 'React',
    difficulty: 'hard'
  },
  {
    question: 'Promise.all 和 Promise.race 的区别是什么？',
    options: ['没有区别', 'all等待所有，race等第一个完成', 'all更快', 'race等待所有'],
    answer: 'all等待所有，race等第一个完成',
    type: 'JavaScript',
    difficulty: 'medium'
  },
  {
    question: 'TypeScript 中 interface 和 type 的区别是什么？',
    options: ['没有区别', 'interface可以合并，type不行', 'type更灵活，支持联合类型', 'interface性能更好'],
    answer: 'type更灵活，支持联合类型',
    type: 'TypeScript',
    difficulty: 'hard'
  },
  {
    question: '浏览器本地存储中，localStorage 和 sessionStorage 的主要区别是什么？',
    options: ['容量不同', '生命周期不同，sessionStorage在标签页关闭后清除', '没有区别', 'localStorage更安全'],
    answer: '生命周期不同，sessionStorage在标签页关闭后清除',
    type: 'Web API',
    difficulty: 'easy'
  },
  {
    question: 'Node.js 中 Event Loop 的哪个阶段处理定时器？',
    options: ['poll', 'check', 'timers', 'close'],
    answer: 'timers',
    type: 'Node.js',
    difficulty: 'hard'
  },
  {
    question: 'CSS Grid 中 fr 单位代表什么？',
    options: ['固定像素', '剩余空间的比例单位', '百分比', '字体大小'],
    answer: '剩余空间的比例单位',
    type: 'CSS',
    difficulty: 'easy'
  }
]

function getDifficultyText(difficulty) {
  const map = { easy: '简单', medium: '中等', hard: '困难' }
  return map[difficulty] || '中等'
}

function shuffleArray(array) {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

async function loadQuestions() {
  const count = battleMode.value === 'quick' ? 5 : battleMode.value === 'practice' ? 10 : 20
  totalQuestions.value = count

  let questions = []
  try {
    const res = await exerciseApi.getRandom(count)
    if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
      questions = res.data.map(q => ({
        question: q.question,
        options: q.options?.length > 0 ? q.options : [q.answer],
        answer: q.answer,
        type: q.type || '综合',
        difficulty: q.difficulty || 'medium'
      }))
    }
  } catch (e) {
    console.warn('从题库获取题目失败，使用本地题库:', e)
  }

  // 回退到本地题库
  if (questions.length < count) {
    const fallback = [...sampleQuestions]
    while (questions.length < count) {
      const idx = Math.floor(Math.random() * fallback.length)
      questions.push(fallback[idx])
    }
  }

  questionBank.value = questions
  currentQuestionIndex.value = 0
  currentQuestion.value = questions[0]
  shuffledOptions.value = shuffleArray(questions[0].options)
}

const startMatching = async () => {
  await submitBattleFeedback()
  isMatching.value = true
  gameState.value = 'matching'
  waitTime.value = 3
  
  const waitInterval = setInterval(() => {
    waitTime.value--
    if (waitTime.value <= 0) {
      clearInterval(waitInterval)
      startBattle()
    }
  }, 1000)
}

const cancelMatching = () => {
  isMatching.value = false
  gameState.value = 'lobby'
}

const startBattle = async () => {
  isMatching.value = false
  gameState.value = 'battling'

  opponentName.value = battleMode.value === 'practice' ? 'AI陪练' : '随机对手'

  myScore.value = 0
  opponentScore.value = 0
  hasAnswered.value = false
  showResult.value = false
  selectedAnswer.value = null
  timeLeft.value = 100
  userRating.value = 0
  feedbackText.value = ''
  battleResults.value = []

  await loadQuestions()
  startTimer()

  battleStartTime = Date.now()
  ElMessage.success('对战开始！')
}

const selectAnswer = (option) => {
  if (hasAnswered.value) return
  selectedAnswer.value = option
}

const submitAnswer = async () => {
  if (selectedAnswer.value === null) return

  hasAnswered.value = true
  showResult.value = true

  const isCorrect = selectedAnswer.value === currentQuestion.value.answer
  const score = isCorrect ? 100 : 0
  if (isCorrect) {
    myScore.value += 100
    ElMessage.success('答对了！+100分')
  } else {
    ElMessage.error('答错了')
  }

  // 提交答题结果到后端
  try {
    await exerciseApi.submit({
      questionId: currentQuestion.value?.id || 0,
      userAnswer: selectedAnswer.value,
      isCorrect,
      score
    })
    battleResults.value.push({
      questionId: currentQuestion.value?.id || 0,
      question: currentQuestion.value?.question || '',
      userAnswer: selectedAnswer.value,
      isCorrect,
      score
    })
  } catch (e) {
    console.warn('提交答题结果失败:', e)
  }

  opponentTurn.value = true
  setTimeout(() => {
    // 对手正确率基于题目难度：简单70%，中等50%，困难30%
    const diff = currentQuestion.value?.difficulty
    const opponentRate = diff === 'hard' ? 0.3 : diff === 'easy' ? 0.7 : 0.5
    const opponentCorrect = Math.random() < opponentRate
    if (opponentCorrect) {
      opponentScore.value += 100
    }
    opponentTurn.value = false
  }, 1500)
}

const nextQuestion = () => {
  currentQuestionIndex.value++
  
  if (currentQuestionIndex.value >= totalQuestions.value) {
    endBattle()
    return
  }
  
  currentQuestion.value = questionBank.value[currentQuestionIndex.value]
  shuffledOptions.value = shuffleArray(currentQuestion.value.options)
  selectedAnswer.value = null
  hasAnswered.value = false
  showResult.value = false
  timeLeft.value = 100
  
  startTimer()
}

const endBattle = () => {
  gameState.value = 'ended'
  
  if (battleStartTime) {
    battleDuration.value = Math.round((Date.now() - battleStartTime) / 1000)
  }
  
  myFinalScore.value = myScore.value
  opponentFinalScore.value = opponentScore.value
  
  const correctCount = Math.round(myScore.value / 100)
  const accuracyValue = Math.round((correctCount / totalQuestions.value) * 100)
  
  // 评分变化基于分差和正确率，而非随机
  const scoreDiff = myScore.value - opponentScore.value
  const accuracyPercent = Math.round((correctCount / totalQuestions.value) * 100)

  if (scoreDiff > 0) {
    winner.value = 'me'
    ratingChange.value = Math.max(5, Math.round(scoreDiff / 10 + accuracyPercent / 10))
    playerRating.value += ratingChange.value
  } else if (scoreDiff === 0) {
    winner.value = 'tie'
    ratingChange.value = 2
    playerRating.value += ratingChange.value
  } else {
    winner.value = 'opponent'
    ratingChange.value = -Math.max(3, Math.round(Math.abs(scoreDiff) / 10))
    playerRating.value = Math.max(0, playerRating.value + ratingChange.value)
  }

  // 经验值基于实际表现
  expGained.value = Math.round(correctCount * 10 + (winner.value === 'me' ? 20 : 0))
  
  localStorage.setItem('userRating', playerRating.value)
  
  const battleResult = winner.value === 'me' ? 'win' : (winner.value === 'tie' ? 'tie' : 'lose')
  battleHistory.value.unshift({
    result: battleResult,
    ratingChange: ratingChange.value
  })
  
  try {
    historyApi.saveBattleRecord({
      opponentName: opponentName.value || '匿名对手',
      roomId: roomId.value || '',
      myScore: myScore.value,
      opponentScore: opponentScore.value,
      result: battleResult,
      ratingChange: ratingChange.value,
      expGained: expGained.value,
      durationSeconds: battleDuration.value
    })
  } catch (e) {
    console.warn('保存对战记录失败:', e)
  }
  
  if (timer) clearInterval(timer)
}

const submitBattleFeedback = async () => {
  if (userRating.value === 0) return
  try {
    const correctCount = battleResults.value.filter(r => r.isCorrect).length
    await feedbackApi.submit({
      rating: userRating.value,
      feedback: feedbackText.value || '',
      battleId: roomId.value || '',
      result: winner.value,
      totalQuestions: totalQuestions.value,
      correctCount,
      duration: battleDuration.value,
      mode: battleMode.value
    })
    ElMessage.success('反馈已提交')
  } catch (e) {
    console.warn('提交反馈失败:', e)
  }
}

const backToLobby = async () => {
  await submitBattleFeedback()
  gameState.value = 'lobby'
  myScore.value = 0
  opponentScore.value = 0
  currentQuestion.value = null
}

const startTimer = () => {
  if (timer) clearInterval(timer)
  
  timer = setInterval(() => {
    if (timeLeft.value > 0 && gameState.value === 'battling') {
      timeLeft.value -= 1
    } else {
      clearInterval(timer)
      if (!hasAnswered.value && gameState.value === 'battling') {
        submitAnswer()
      }
    }
  }, 100)
}

const accuracy = computed(() => {
  if (myFinalScore.value === 0) return 0
  return Math.round((myFinalScore.value / 100 / totalQuestions.value) * 100)
})

onMounted(() => {
  try {
    historyApi.getBattleHistory(0, 10).then(res => {
      if (res?.success && Array.isArray(res.data)) {
        battleHistory.value = res.data.map(record => ({
          result: record.result,
          ratingChange: record.ratingChange || 0
        }))
      }
    }).catch(() => {})
  } catch (e) {}
})
</script>

<style scoped>
.battle-view {
  min-height: 100%;
  padding: 24px;
}

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

.mode-selection {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 18px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 16px;
}

.mode-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.mode-card {
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 2px solid #e2e8f0;
  cursor: pointer;
  transition: all 0.3s ease;
  text-align: center;
}

.mode-card:hover {
  border-color: #667eea;
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.2);
}

.mode-card.active {
  border-color: #667eea;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
}

.mode-icon {
  font-size: 40px;
  margin-bottom: 12px;
}

.mode-name {
  font-size: 16px;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 8px;
}

.mode-desc {
  font-size: 13px;
  color: #718096;
}

.history-section {
  background: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 24px;
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

.empty-history {
  text-align: center;
  color: #a0aec0;
  padding: 20px;
}

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

@keyframes bounce {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
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

.progress-indicator {
  margin-bottom: 20px;
  text-align: center;
}

.progress-text {
  font-size: 14px;
  color: #718096;
  margin-bottom: 8px;
}

.progress-bar {
  height: 8px;
  background: #e2e8f0;
  border-radius: 4px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea, #764ba2);
  transition: width 0.3s ease;
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
  display: flex;
  justify-content: center;
  gap: 12px;
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

.difficulty-badge {
  display: inline-block;
  padding: 6px 16px;
  color: white;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 700;
}

.difficulty-badge.easy {
  background: #48bb78;
}

.difficulty-badge.medium {
  background: #f6ad55;
}

.difficulty-badge.hard {
  background: #f56565;
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

.details-section {
  display: flex;
  justify-content: center;
  gap: 32px;
  margin-bottom: 24px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 12px;
}

.detail-item {
  text-align: center;
}

.detail-label {
  font-size: 12px;
  color: #718096;
  display: block;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 24px;
  font-weight: 700;
  color: #2d3748;
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

.feedback-section {
  margin-bottom: 32px;
}

.feedback-title {
  font-size: 16px;
  color: #2d3748;
  margin-bottom: 12px;
}

.rating-stars {
  display: flex;
  justify-content: center;
  gap: 8px;
}

.star {
  font-size: 32px;
  color: #e2e8f0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.star:hover,
.star.active {
  color: #f6ad55;
  transform: scale(1.2);
}

.feedback-textarea {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  font-size: 14px;
  color: #2d3748;
  background: rgba(255, 255, 255, 0.8);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.feedback-textarea:focus {
  outline: none;
  border-color: #667eea;
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

  .mode-cards {
    grid-template-columns: 1fr;
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
