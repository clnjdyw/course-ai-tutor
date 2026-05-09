<template>
  <div class="history-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div>
              <h2>历史记录</h2>
              <p>查看所有学习活动的历史记录</p>
            </div>
          </div>
        </div>
      </template>

      <el-tabs v-model="activeTab" @tab-change="onTabChange" class="history-tabs">

        <!-- 学习规划 -->
        <el-tab-pane label="📋 学习规划" name="planner">
          <SearchBar v-model:keyword="search.keyword" v-model:dateRange="search.dateRange" @search="doSearch" @reset="doReset" />
          <HistoryList
            :items="plannerHistory"
            :loading="loading"
            :total="plannerTotal"
            :page="plannerPage"
            empty-text="暂无学习规划记录"
            @page-change="(p) => loadHistory('planner', p)"
          >
            <template #item="{ item }">
              <div class="history-item">
                <div class="item-header">
                  <span class="item-title">{{ item.goal || '学习规划' }}</span>
                  <el-tag size="small" :type="item.status === 'active' ? 'success' : 'info'">
                    {{ item.status === 'active' ? '进行中' : '已完成' }}
                  </el-tag>
                  <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                </div>
                <div v-if="item.planContent" class="item-preview" v-html="renderMd(item.planContent.substring(0, 200) + '...')" />
                <el-button size="small" text @click="expandItem(item, 'planner')">查看完整规划</el-button>
              </div>
            </template>
          </HistoryList>
        </el-tab-pane>

        <!-- 实时答疑 -->
        <el-tab-pane label="💬 实时答疑" name="helper">
          <SearchBar v-model:keyword="search.keyword" v-model:dateRange="search.dateRange" @search="doSearch" @reset="doReset" />
          <HistoryList
            :items="helperHistory"
            :loading="loading"
            :total="helperTotal"
            :page="helperPage"
            empty-text="暂无答疑记录"
            @page-change="(p) => loadHistory('helper', p)"
          >
            <template #item="{ item }">
              <ConversationItem :item="item" @expand="expandItem(item, 'helper')" />
            </template>
          </HistoryList>
        </el-tab-pane>

        <!-- 智能教学 -->
        <el-tab-pane label="🎓 智能教学" name="tutor">
          <SearchBar v-model:keyword="search.keyword" v-model:dateRange="search.dateRange" @search="doSearch" @reset="doReset" />
          <HistoryList
            :items="tutorHistory"
            :loading="loading"
            :total="tutorTotal"
            :page="tutorPage"
            empty-text="暂无教学记录"
            @page-change="(p) => loadHistory('tutor', p)"
          >
            <template #item="{ item }">
              <ConversationItem :item="item" @expand="expandItem(item, 'tutor')" />
            </template>
          </HistoryList>
        </el-tab-pane>

        <!-- 学习评估 -->
        <el-tab-pane label="📊 学习评估" name="evaluator">
          <SearchBar v-model:keyword="search.keyword" v-model:dateRange="search.dateRange" @search="doSearch" @reset="doReset" />
          <HistoryList
            :items="evaluatorHistory"
            :loading="loading"
            :total="evaluatorTotal"
            :page="evaluatorPage"
            empty-text="暂无评估记录"
            @page-change="(p) => loadHistory('evaluator', p)"
          >
            <template #item="{ item }">
              <ConversationItem :item="item" @expand="expandItem(item, 'evaluator')" />
            </template>
          </HistoryList>
        </el-tab-pane>

        <!-- PK 对战 -->
        <el-tab-pane label="⚔️ PK 对战" name="battle">
          <SearchBar v-model:keyword="search.keyword" v-model:dateRange="search.dateRange" @search="doSearch" @reset="doReset" />
          <div v-if="battleStats" class="battle-stats">
            <el-row :gutter="16">
              <el-col :span="8">
                <div class="stat-card win">
                  <div class="stat-value">{{ battleStats.wins }}</div>
                  <div class="stat-label">胜利</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card lose">
                  <div class="stat-value">{{ battleStats.losses }}</div>
                  <div class="stat-label">失败</div>
                </div>
              </el-col>
              <el-col :span="8">
                <div class="stat-card tie">
                  <div class="stat-value">{{ battleStats.ties }}</div>
                  <div class="stat-label">平局</div>
                </div>
              </el-col>
            </el-row>
          </div>

          <HistoryList
            :items="battleHistory"
            :loading="loading"
            :total="battleTotal"
            :page="battlePage"
            empty-text="暂无对战记录"
            @page-change="(p) => loadHistory('battle', p)"
          >
            <template #item="{ item }">
              <div class="history-item battle-item">
                <div class="item-header">
                  <span class="item-title">vs {{ item.opponentName || '匿名对手' }}</span>
                  <el-tag size="small" :type="resultTagType(item.result)">
                    {{ resultLabel(item.result) }}
                  </el-tag>
                  <span class="item-time">{{ formatTime(item.createdAt) }}</span>
                </div>
                <div class="battle-score">
                  <span class="my-score">我：{{ item.myScore }} 分</span>
                  <span class="vs-divider">VS</span>
                  <span class="opp-score">对手：{{ item.opponentScore }} 分</span>
                  <el-tag v-if="item.ratingChange" size="small" :type="item.ratingChange > 0 ? 'success' : 'danger'">
                    {{ item.ratingChange > 0 ? '+' : '' }}{{ item.ratingChange }} 分
                  </el-tag>
                </div>
              </div>
            </template>
          </HistoryList>
        </el-tab-pane>

      </el-tabs>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" :title="detailTitle" width="700px" top="5vh">
      <div class="detail-content" v-html="detailHtml" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, defineComponent, h } from 'vue'
import { Clock } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { historyApi } from '@/api'
import SearchBar from '@/components/SearchBar.vue'

const md = new MarkdownIt()
const renderMd = (text) => md.render(text || '')

const activeTab = ref('planner')
const loading = ref(false)
const search = reactive({ keyword: '', dateRange: [] })

const plannerHistory = ref([])
const plannerTotal = ref(0)
const plannerPage = ref(0)

const helperHistory = ref([])
const helperTotal = ref(0)
const helperPage = ref(0)

const tutorHistory = ref([])
const tutorTotal = ref(0)
const tutorPage = ref(0)

const evaluatorHistory = ref([])
const evaluatorTotal = ref(0)
const evaluatorPage = ref(0)

const battleHistory = ref([])
const battleTotal = ref(0)
const battlePage = ref(0)
const battleStats = ref(null)

const showDetail = ref(false)
const detailTitle = ref('')
const detailHtml = ref('')

const buildFilters = () => {
  const f = {}
  if (search.keyword) f.keyword = search.keyword
  if (search.dateRange && search.dateRange.length === 2) {
    f.startDate = search.dateRange[0]
    f.endDate = search.dateRange[1]
  }
  return f
}

const loadHistory = async (type, page = 0) => {
  loading.value = true
  const filters = buildFilters()
  try {
    let res
    switch (type) {
      case 'planner':
        res = await historyApi.getPlannerHistory(page, 10, filters)
        if (res?.success) { plannerHistory.value = res.data || []; plannerTotal.value = res.total || 0; plannerPage.value = page }
        break
      case 'helper':
        res = await historyApi.getHelperHistory(page, 10, filters)
        if (res?.success) { helperHistory.value = res.data || []; helperTotal.value = res.total || 0; helperPage.value = page }
        break
      case 'tutor':
        res = await historyApi.getTutorHistory(page, 10, filters)
        if (res?.success) { tutorHistory.value = res.data || []; tutorTotal.value = res.total || 0; tutorPage.value = page }
        break
      case 'evaluator':
        res = await historyApi.getEvaluatorHistory(page, 10, filters)
        if (res?.success) { evaluatorHistory.value = res.data || []; evaluatorTotal.value = res.total || 0; evaluatorPage.value = page }
        break
      case 'battle':
        res = await historyApi.getBattleHistory(page, 10, filters)
        if (res?.success) { battleHistory.value = res.data || []; battleTotal.value = res.total || 0; battlePage.value = page; battleStats.value = res.stats || null }
        break
    }
  } catch (e) {
    console.error(`加载${type}历史失败:`, e)
  } finally {
    loading.value = false
  }
}

const onTabChange = (tab) => {
  search.keyword = ''
  search.dateRange = []
  loadHistory(tab)
}

const doSearch = () => loadHistory(activeTab.value, 0)
const doReset = () => { search.keyword = ''; search.dateRange = []; loadHistory(activeTab.value, 0) }

const expandItem = (item, type) => {
  if (type === 'planner') {
    detailTitle.value = item.goal || '学习规划'
    detailHtml.value = renderMd(item.planContent || item.schedule || '暂无内容')
  } else {
    detailTitle.value = item.topic || '对话记录'
    try {
      const messages = JSON.parse(item.messages || '[]')
      detailHtml.value = messages.map(m =>
        `<div class="msg-${m.role || m.type}">
          <strong>${m.role === 'user' || m.type === 'user' ? '我' : 'AI'}：</strong>
          ${renderMd(m.content || '')}
        </div>`
      ).join('<hr/>')
    } catch {
      detailHtml.value = renderMd(item.messages || '暂无内容')
    }
  }
  showDetail.value = true
}

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

const resultTagType = (result) => ({ win: 'success', lose: 'danger', tie: 'warning' }[result] || 'info')
const resultLabel = (result) => ({ win: '胜利 🏆', lose: '失败', tie: '平局' }[result] || result)

// 搜索栏已移至 src/components/SearchBar.vue

// 通用列表组件
const HistoryList = defineComponent({
  props: ['items', 'loading', 'total', 'page', 'emptyText'],
  emits: ['page-change'],
  setup(props, { slots, emit }) {
    return () => h('div', { class: 'history-list' }, [
      props.loading
        ? h('div', { class: 'loading-wrap' }, [h('el-skeleton', { rows: 3, animated: true })])
        : props.items.length === 0
          ? h('el-empty', { description: props.emptyText })
          : h('div', props.items.map(item =>
              h('div', { class: 'history-card', key: item.id },
                slots.item ? slots.item({ item }) : null
              )
            )),
      props.total > 10
        ? h('el-pagination', {
            layout: 'prev, pager, next',
            total: props.total,
            pageSize: 10,
            currentPage: props.page + 1,
            class: 'pagination',
            onCurrentChange: (p) => emit('page-change', p - 1)
          })
        : null
    ])
  }
})

// 对话记录卡片组件
const ConversationItem = defineComponent({
  props: ['item'],
  emits: ['expand'],
  setup(props, { emit }) {
    return () => {
      let preview = ''
      try {
        const msgs = JSON.parse(props.item.messages || '[]')
        const first = msgs.find(m => m.role === 'user' || m.type === 'user')
        preview = first?.content?.substring(0, 100) || ''
      } catch { preview = '' }

      return h('div', { class: 'history-item' }, [
        h('div', { class: 'item-header' }, [
          h('span', { class: 'item-title' }, props.item.topic || '对话记录'),
          h('span', { class: 'item-time' }, formatTime(props.item.createdAt))
        ]),
        preview ? h('p', { class: 'item-preview-text' }, `问：${preview}...`) : null,
        h('el-button', { size: 'small', text: true, onClick: () => emit('expand') }, '查看完整对话')
      ])
    }
  }
})

onMounted(() => loadHistory('planner'))
</script>

<style scoped>
.history-container { max-width: 1000px; margin: 0 auto; animation: fadeInUp 0.5s ease; }

.glass-card {
  background: rgba(255,255,255,0.95);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0,0,0,0.1);
}

.card-header { display: flex; align-items: center; }
.header-left { display: flex; align-items: center; gap: 12px; }
.title-icon {
  width: 44px; height: 44px; border-radius: 12px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex; align-items: center; justify-content: center; color: white;
}

.history-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }

/* 搜索栏 */
.search-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}
.search-input { width: 200px; }
.date-picker { width: 280px; }

.history-list { min-height: 200px; }
.loading-wrap { padding: 20px; }

.history-card {
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 16px;
  margin-bottom: 12px;
  transition: box-shadow 0.2s;
}
.history-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

.item-header {
  display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px;
}
.item-title { font-weight: 600; color: #2d3748; flex: 1; }
.item-time { font-size: 12px; color: #a0aec0; margin-left: auto; }

.item-preview :deep(p) { margin: 0; font-size: 13px; color: #718096; line-height: 1.5; }
.item-preview-text { font-size: 13px; color: #718096; margin: 4px 0 8px; }

.battle-stats { margin-bottom: 20px; }
.stat-card {
  text-align: center; padding: 16px; border-radius: 10px;
  background: #f8fafc; border: 2px solid transparent;
}
.stat-card.win { border-color: #48bb78; }
.stat-card.lose { border-color: #fc8181; }
.stat-card.tie { border-color: #f6ad55; }
.stat-value { font-size: 28px; font-weight: 700; }
.stat-card.win .stat-value { color: #38a169; }
.stat-card.lose .stat-value { color: #e53e3e; }
.stat-card.tie .stat-value { color: #dd6b20; }
.stat-label { font-size: 13px; color: #718096; margin-top: 4px; }

.battle-item .battle-score {
  display: flex; align-items: center; gap: 12px;
  font-size: 14px; color: #4a5568; margin-top: 6px;
}
.my-score { font-weight: 600; color: #3182ce; }
.vs-divider { color: #a0aec0; font-weight: 700; }
.opp-score { font-weight: 600; color: #e53e3e; }

.pagination { margin-top: 16px; display: flex; justify-content: center; }

.detail-content :deep(p) { line-height: 1.8; }
.detail-content :deep(.msg-user), .detail-content :deep(.msg-assistant) { margin: 12px 0; }
.detail-content :deep(.msg-user strong) { color: #3182ce; }
.detail-content :deep(.msg-assistant strong) { color: #38a169; }

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
