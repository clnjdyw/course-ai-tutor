<template>
  <div class="notes-view">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon">
              <span class="icon-emoji">📝</span>
            </div>
            <div>
              <h2 v-if="activeNotesTab === 'my'">📝 我的笔记</h2>
              <h2 v-else>🏛️ 公开笔记广场</h2>
              <p v-if="activeNotesTab === 'my'">记录学习灵感与重点</p>
              <p v-else>浏览和互动社区公开笔记</p>
            </div>
          </div>
          <el-button v-if="activeNotesTab === 'my'" type="primary" size="large" @click="showCreateDialog = true" class="gradient-btn">
            <span class="btn-emoji">✨</span>
            新建笔记
          </el-button>
        </div>
      </template>

      <!-- Tab 切换 -->
      <div class="tab-bar">
        <el-button
          :type="activeNotesTab === 'my' ? 'primary' : ''"
          :class="['tab-btn', activeNotesTab === 'my' ? 'active' : '']"
          @click="switchTab('my')"
        >
          我的笔记
        </el-button>
        <el-button
          :type="activeNotesTab === 'public' ? 'primary' : ''"
          :class="['tab-btn', activeNotesTab === 'public' ? 'active' : '']"
          @click="switchTab('public')"
        >
          公开笔记广场
        </el-button>
      </div>

      <!-- 我的笔记 -->
      <div v-show="activeNotesTab === 'my'">
        <div class="notes-grid">
          <el-card v-for="(note, index) in notes" :key="note.id" class="note-card" shadow="hover" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="note-header">
              <h3>{{ note.title }}</h3>
              <div class="note-actions">
                <el-button type="primary" link @click="editNote(note)" size="large">✏️</el-button>
                <el-button type="danger" link @click="deleteNote(note.id)" size="large">🗑️</el-button>
              </div>
            </div>
            <div class="note-content" v-html="note.content"></div>
            <div class="note-footer">
              <span class="note-tags" v-if="note.tags">
                <el-tag v-for="tag in parseTags(note.tags)" :key="tag" size="small" class="tag-item">{{ tag }}</el-tag>
              </span>
              <span class="note-time">{{ formatDate(note.updated_at) }}</span>
            </div>
          </el-card>
        </div>

        <el-empty
          v-if="notes.length === 0"
          description="还没有笔记，点击上方按钮创建第一条笔记吧！"
          :image-size="200"
        >
          <template #image>
            <div class="empty-illustration">
              <span class="empty-emoji">📝</span>
            </div>
          </template>
        </el-empty>
      </div>

      <!-- 公开笔记广场 -->
      <div v-show="activeNotesTab === 'public'">
        <div class="notes-grid">
          <el-card v-for="(note, index) in publicNotes" :key="note.id" class="note-card" shadow="hover" :style="{ animationDelay: `${index * 0.1}s` }">
            <div class="note-header">
              <h3>{{ note.title }}</h3>
              <span class="note-author">@{{ note.username || '匿名用户' }}</span>
            </div>
            <div class="note-content">{{ truncateContent(note.content, 200) }}</div>
            <div class="note-footer">
              <span class="note-tags" v-if="note.tags">
                <el-tag v-for="tag in parseTags(note.tags)" :key="tag" size="small" class="tag-item">{{ tag }}</el-tag>
              </span>
            </div>
            <div class="note-stats">
              <el-button class="stat-btn" @click="likeNote(note.id)" size="small">
                ❤️ {{ note.like_count || 0 }}
              </el-button>
              <el-button class="stat-btn" @click="showComments(note)" size="small">
                💬 {{ note.comment_count || 0 }}
              </el-button>
              <span class="note-time">{{ formatDate(note.updated_at) }}</span>
            </div>
          </el-card>
        </div>

        <el-empty
          v-if="publicNotes.length === 0 && !publicLoading"
          description="还没有公开笔记"
          :image-size="200"
        >
          <template #image>
            <div class="empty-illustration">
              <span class="empty-emoji">📭</span>
            </div>
          </template>
        </el-empty>

        <div v-if="publicLoading" class="loading-text">加载中...</div>
      </div>
    </el-card>

    <!-- 创建/编辑笔记弹窗 -->
    <el-dialog
      v-model="showCreateDialog"
      :title="editingNote ? '编辑笔记' : '新建笔记'"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="formData" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="formData.title" placeholder="请输入笔记标题" class="gradient-input" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="formData.content" type="textarea" :rows="10" placeholder="请输入笔记内容" class="gradient-input" />
        </el-form-item>
        <el-form-item label="标签">
          <el-input v-model="formData.tagsInput" placeholder="例如：Java, Spring" class="gradient-input" />
        </el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="formData.isPublic" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="closeDialog" class="reset-btn">取消</el-button>
        <el-button type="primary" @click="saveNote" class="gradient-btn">保存</el-button>
      </template>
    </el-dialog>

    <!-- 评论弹窗 -->
    <el-dialog
      v-model="showCommentsDialog"
      :title="`评论 - ${currentCommentNote?.title || ''}`"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="comments-list">
        <el-empty v-if="comments.length === 0" description="暂无评论" :image-size="80" />
        <div v-for="(comment, idx) in comments" :key="comment.id" class="comment-item" :style="{ animationDelay: `${idx * 0.05}s` }">
          <div class="comment-author">@{{ comment.username || '匿名用户' }}</div>
          <div class="comment-content">{{ comment.content }}</div>
          <div class="comment-time">{{ formatDate(comment.created_at) }}</div>
        </div>
      </div>
      <template #footer>
        <div class="comment-input-area">
          <el-input
            v-model="newComment"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
            class="gradient-input"
            @keydown.ctrl.enter="submitComment"
          />
          <el-button type="primary" @click="submitComment" class="gradient-btn" style="margin-top: 8px;">
            发表评论
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { notesApi, notesApiExt } from '@/api'

const notes = ref([])
const showCreateDialog = ref(false)
const editingNote = ref(null)
const formData = ref({
  title: '',
  content: '',
  tagsInput: '',
  isPublic: false
})

// 公开笔记相关
const activeNotesTab = ref('my')
const publicNotes = ref([])
const publicLoading = ref(false)

// 评论相关
const showCommentsDialog = ref(false)
const currentCommentNote = ref(null)
const comments = ref([])
const newComment = ref('')

onMounted(async () => {
  await loadNotes()
})

async function loadNotes() {
  try {
    const response = await notesApi.getList()
    notes.value = response.data || []
  } catch (error) {
    console.error('加载笔记失败:', error)
  }
}

function parseTags(tagsStr) {
  try {
    return JSON.parse(tagsStr)
  } catch {
    return []
  }
}

function editNote(note) {
  editingNote.value = note
  formData.value = {
    title: note.title,
    content: note.content,
    tagsInput: note.tags ? parseTags(note.tags).join(', ') : '',
    isPublic: note.is_public === 1
  }
  showCreateDialog.value = true
}

async function saveNote() {
  try {
    const tags = formData.value.tagsInput
      ? formData.value.tagsInput.split(',').map(t => t.trim()).filter(t => t)
      : []

    const data = {
      title: formData.value.title,
      content: formData.value.content,
      tags,
      isPublic: formData.value.isPublic
    }

    if (editingNote.value) {
      await notesApi.update(editingNote.value.id, data)
    } else {
      await notesApi.create(data)
    }

    closeDialog()
    await loadNotes()
    ElMessage.success('笔记保存成功')
  } catch (error) {
    console.error('保存笔记失败:', error)
    ElMessage.error('保存失败')
  }
}

async function deleteNote(id) {
  try {
    await notesApi.delete(id)
    await loadNotes()
    ElMessage.success('笔记已删除')
  } catch (error) {
    console.error('删除笔记失败:', error)
    ElMessage.error('删除失败')
  }
}

function closeDialog() {
  showCreateDialog.value = false
  editingNote.value = null
  formData.value = {
    title: '',
    content: '',
    tagsInput: '',
    isPublic: false
  }
}

function formatDate(dateStr) {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN')
}

// Tab 切换
function switchTab(tab) {
  activeNotesTab.value = tab
  if (tab === 'public' && publicNotes.value.length === 0) {
    loadPublicNotes()
  }
}

// 加载公开笔记
async function loadPublicNotes() {
  publicLoading.value = true
  try {
    const response = await notesApiExt.getPublic({ page: 1, limit: 50 })
    publicNotes.value = response.data || []
  } catch (error) {
    console.error('加载公开笔记失败:', error)
    ElMessage.error('加载公开笔记失败')
  } finally {
    publicLoading.value = false
  }
}

// 点赞
async function likeNote(noteId) {
  try {
    await notesApiExt.like(noteId)
    // 刷新公开笔记列表
    await loadPublicNotes()
    ElMessage.success('点赞成功')
  } catch (error) {
    console.error('点赞失败:', error)
    ElMessage.error('点赞失败')
  }
}

// 显示评论
function showComments(note) {
  currentCommentNote.value = note
  newComment.value = ''
  showCommentsDialog.value = true
  loadComments(note.id)
}

// 加载评论
async function loadComments(noteId) {
  try {
    const response = await notesApiExt.getComments(noteId)
    comments.value = response.data || []
  } catch (error) {
    console.error('加载评论失败:', error)
  }
}

// 提交评论
async function submitComment() {
  if (!newComment.value.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    await notesApiExt.addComment(currentCommentNote.value.id, { content: newComment.value })
    newComment.value = ''
    await loadComments(currentCommentNote.value.id)
    // 更新评论计数
    const note = publicNotes.value.find(n => n.id === currentCommentNote.value.id)
    if (note) {
      note.comment_count = (note.comment_count || 0) + 1
    }
    ElMessage.success('评论发表成功')
  } catch (error) {
    console.error('发表评论失败:', error)
    ElMessage.error('评论发表失败')
  }
}

function truncateContent(content, maxLen) {
  if (!content) return ''
  const text = content.replace(/<[^>]*>/g, '')
  return text.length > maxLen ? text.slice(0, maxLen) + '...' : text
}
</script>

<style scoped>
.notes-view {
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

/* 玻璃态卡片 */
.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.glass-card:hover {
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

/* 卡片头部 */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.title-icon {
  width: 50px;
  height: 50px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  font-size: 28px;
}

.icon-emoji {
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
}

.card-header h2 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: #2d3748;
}

.card-header p {
  margin: 0;
  font-size: 13px;
  color: #718096;
}

/* Tab 切换栏 */
.tab-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  padding: 4px;
  background: rgba(102, 126, 234, 0.06);
  border-radius: 12px;
  width: fit-content;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #718096;
  font-weight: 500;
  border-radius: 10px;
  transition: all 0.3s ease;
  padding: 8px 24px;
}

.tab-btn:hover {
  color: #667eea;
  background: rgba(102, 126, 234, 0.1);
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
}

/* 渐变输入框 */
.gradient-input :deep(.el-input__wrapper) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border: 2px solid rgba(102, 126, 234, 0.2);
  border-radius: 12px;
}

.gradient-input :deep(.el-input__wrapper:hover),
.gradient-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
  border-color: #667eea;
}

.gradient-input :deep(textarea.el-textarea__inner) {
  background: linear-gradient(135deg, rgba(240, 248, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border: none;
  box-shadow: none;
}

/* 渐变按钮 */
.gradient-btn {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
  border-radius: 12px;
  font-weight: 600;
}

.gradient-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(102, 126, 234, 0.5);
}

.reset-btn {
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid rgba(102, 126, 234, 0.3);
  color: #667eea;
  border-radius: 12px;
}

.reset-btn:hover {
  background: rgba(102, 126, 234, 0.2);
}

.btn-emoji {
  font-size: 20px;
  margin-right: 4px;
}

/* 笔记网格 */
.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.note-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  animation: fadeInUp 0.6s ease both;
}

.note-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.note-header h3 {
  margin: 0;
  font-size: 18px;
  color: #2d3748;
}

.note-author {
  font-size: 13px;
  color: #667eea;
  font-weight: 500;
}

.note-actions {
  display: flex;
  gap: 8px;
}

.note-content {
  color: #374151;
  line-height: 1.6;
  margin-bottom: 15px;
  max-height: 200px;
  overflow: hidden;
}

.note-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: #6b7280;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.note-tags {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.note-stats {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f0f0f0;
}

.stat-btn {
  background: rgba(102, 126, 234, 0.08);
  border: 1px solid rgba(102, 126, 234, 0.15);
  color: #667eea;
  border-radius: 8px;
  transition: all 0.3s ease;
}

.stat-btn:hover {
  background: rgba(102, 126, 234, 0.18);
  transform: translateY(-1px);
}

.note-time {
  margin-left: auto;
  font-size: 12px;
  color: #9ca3af;
}

.tag-item {
  border-radius: 6px;
}

/* 空状态 */
.empty-illustration {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%);
  border-radius: 50%;
  animation: pulse 2s infinite ease-in-out;
}

.empty-emoji {
  font-size: 80px;
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1));
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

/* 加载提示 */
.loading-text {
  text-align: center;
  padding: 24px;
  color: #718096;
  font-size: 14px;
}

/* 评论列表 */
.comments-list {
  max-height: 400px;
  overflow-y: auto;
  padding: 8px 0;
}

.comment-item {
  padding: 12px 16px;
  margin-bottom: 8px;
  background: rgba(102, 126, 234, 0.04);
  border-radius: 10px;
  border-left: 3px solid #667eea;
  animation: fadeInUp 0.4s ease both;
}

.comment-author {
  font-size: 13px;
  color: #667eea;
  font-weight: 600;
  margin-bottom: 6px;
}

.comment-content {
  font-size: 14px;
  color: #2d3748;
  line-height: 1.5;
  margin-bottom: 6px;
}

.comment-time {
  font-size: 11px;
  color: #9ca3af;
}

.comment-input-area {
  width: 100%;
}

/* 动画 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
