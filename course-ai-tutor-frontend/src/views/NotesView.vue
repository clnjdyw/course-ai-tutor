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
              <h2>📝 我的笔记</h2>
              <p>记录学习灵感与重点</p>
            </div>
          </div>
          <el-button type="primary" size="large" @click="showCreateDialog = true" class="gradient-btn">
            <span class="btn-emoji">✨</span>
            新建笔记
          </el-button>
        </div>
      </template>

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
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { notesApi } from '@/api'

const notes = ref([])
const showCreateDialog = ref(false)
const editingNote = ref(null)
const formData = ref({
  title: '',
  content: '',
  tagsInput: '',
  isPublic: false
})

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
