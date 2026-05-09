<template>
  <div class="templates-container">
    <div class="glass-card">
      <div class="card-header">
        <div class="header-left">
          <div class="title-icon">
            <el-icon :size="24"><Notebook /></el-icon>
          </div>
          <div>
            <h2>📝 自定义题库</h2>
            <p>创建题目模板，一键生成练习</p>
          </div>
        </div>
        <el-button type="primary" @click="showCreateDialog = true" class="gradient-btn">
          <el-icon><Plus /></el-icon>
          新建模板
        </el-button>
      </div>

      <el-divider style="margin: 0" />

      <!-- 模板列表 -->
      <div class="template-list" v-loading="loading">
        <el-empty v-if="!loading && templates.length === 0" description="还没有模板，点击上方按钮创建" :image-size="160" />

        <div class="template-grid">
          <div v-for="tpl in templates" :key="tpl.id" class="template-card">
            <div class="template-info">
              <h3>{{ tpl.name }}</h3>
              <div class="template-meta">
                <el-tag size="small" type="info">{{ tpl.question_count || 10 }} 题</el-tag>
                <el-tag v-if="tpl.difficulty_distribution" size="small">
                  {{ parseDifficulty(tpl.difficulty_distribution) }}
                </el-tag>
              </div>
              <p class="template-desc" v-if="tpl.knowledge_point_ids">
                知识点: {{ parseKnowledgePoints(tpl.knowledge_point_ids) }}
              </p>
            </div>
            <div class="template-actions">
              <el-button type="primary" size="small" @click="generateFromTemplate(tpl)" :loading="generatingId === tpl.id">
                <el-icon><MagicStick /></el-icon>
                生成练习
              </el-button>
              <el-button size="small" @click="editTemplate(tpl)">
                <el-icon><Edit /></el-icon>
                编辑
              </el-button>
              <el-button type="danger" size="small" text @click="deleteTemplate(tpl)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 生成结果 -->
      <el-dialog v-model="showGenerated" title="📝 生成的练习" width="800px">
        <div v-if="generatedContent" class="generated-content" v-html="renderedContent"></div>
        <template #footer>
          <el-button @click="showGenerated = false">关闭</el-button>
          <el-button type="primary" @click="copyGenerated">复制内容</el-button>
        </template>
      </el-dialog>
    </div>

    <!-- 创建/编辑对话框 -->
    <el-dialog v-model="showCreateDialog" :title="editingId ? '编辑模板' : '新建模板'" width="560px" :close-on-click-modal="false">
      <el-form :model="templateForm" label-width="120px">
        <el-form-item label="模板名称">
          <el-input v-model="templateForm.name" placeholder="例如：高等数学期中复习" />
        </el-form-item>
        <el-form-item label="题目数量">
          <el-input-number v-model="templateForm.questionCount" :min="1" :max="50" />
        </el-form-item>
        <el-form-item label="难度分布">
          <div class="difficulty-sliders">
            <div class="slider-item">
              <span>简单</span>
              <el-slider v-model="templateForm.difficultyDistribution.easy" :max="100" />
            </div>
            <div class="slider-item">
              <span>中等</span>
              <el-slider v-model="templateForm.difficultyDistribution.medium" :max="100" />
            </div>
            <div class="slider-item">
              <span>困难</span>
              <el-slider v-model="templateForm.difficultyDistribution.hard" :max="100" />
            </div>
          </div>
        </el-form-item>
        <el-form-item label="题型比例">
          <div class="difficulty-sliders">
            <div class="slider-item">
              <span>选择题</span>
              <el-slider v-model="templateForm.questionTypeRatio.choice" :max="100" />
            </div>
            <div class="slider-item">
              <span>填空题</span>
              <el-slider v-model="templateForm.questionTypeRatio.fill" :max="100" />
            </div>
            <div class="slider-item">
              <span>解答题</span>
              <el-slider v-model="templateForm.questionTypeRatio.essay" :max="100" />
            </div>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate" :loading="saving">
          {{ editingId ? '保存修改' : '创建模板' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Notebook, Plus, MagicStick, Edit, Delete } from '@element-plus/icons-vue'
import MarkdownIt from 'markdown-it'
import { exerciseTemplateApi } from '@/api'

const md = new MarkdownIt()
const loading = ref(false)
const saving = ref(false)
const templates = ref([])
const showCreateDialog = ref(false)
const showGenerated = ref(false)
const generatedContent = ref('')
const editingId = ref(null)
const generatingId = ref(null)

const templateForm = ref({
  name: '',
  questionCount: 10,
  difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
  questionTypeRatio: { choice: 50, fill: 30, essay: 20 }
})

const renderedContent = computed(() => {
  return generatedContent.value ? md.render(generatedContent.value) : ''
})

const parseDifficulty = (dist) => {
  try {
    const d = typeof dist === 'string' ? JSON.parse(dist) : dist
    return `简${d.easy || 0}% 中${d.medium || 0}% 难${d.hard || 0}%`
  } catch { return '默认' }
}

const parseKnowledgePoints = (ids) => {
  try {
    const arr = typeof ids === 'string' ? JSON.parse(ids) : ids
    return arr.length > 0 ? `${arr.length} 个知识点` : '未指定'
  } catch { return '未指定' }
}

const loadTemplates = async () => {
  loading.value = true
  try {
    const res = await exerciseTemplateApi.getList()
    if (res?.success) {
      templates.value = res.data || []
    }
  } catch (error) {
    console.error('加载模板失败:', error)
  } finally {
    loading.value = false
  }
}

const saveTemplate = async () => {
  if (!templateForm.value.name.trim()) {
    ElMessage.warning('请输入模板名称')
    return
  }
  saving.value = true
  try {
    const data = {
      name: templateForm.value.name,
      questionCount: templateForm.value.questionCount,
      difficultyDistribution: templateForm.value.difficultyDistribution,
      questionTypeRatio: templateForm.value.questionTypeRatio
    }
    let res
    if (editingId.value) {
      res = await exerciseTemplateApi.update(editingId.value, data)
    } else {
      res = await exerciseTemplateApi.create(data)
    }
    if (res?.success) {
      ElMessage.success(editingId.value ? '修改成功' : '创建成功')
      showCreateDialog.value = false
      editingId.value = null
      templateForm.value = {
        name: '',
        questionCount: 10,
        difficultyDistribution: { easy: 30, medium: 50, hard: 20 },
        questionTypeRatio: { choice: 50, fill: 30, essay: 20 }
      }
      await loadTemplates()
    }
  } catch (error) {
    ElMessage.error('保存失败: ' + error.message)
  } finally {
    saving.value = false
  }
}

const editTemplate = (tpl) => {
  editingId.value = tpl.id
  templateForm.value = {
    name: tpl.name,
    questionCount: tpl.question_count || 10,
    difficultyDistribution: (() => { try { return typeof tpl.difficulty_distribution === 'string' ? JSON.parse(tpl.difficulty_distribution) : tpl.difficulty_distribution || { easy: 30, medium: 50, hard: 20 } } catch { return { easy: 30, medium: 50, hard: 20 } } })(),
    questionTypeRatio: (() => { try { return typeof tpl.question_type_ratio === 'string' ? JSON.parse(tpl.question_type_ratio) : tpl.question_type_ratio || { choice: 50, fill: 30, essay: 20 } } catch { return { choice: 50, fill: 30, essay: 20 } } })()
  }
  showCreateDialog.value = true
}

const deleteTemplate = async (tpl) => {
  try {
    await ElMessageBox.confirm(`确定删除模板"${tpl.name}"？`, '确认删除', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await exerciseTemplateApi.delete(tpl.id)
    ElMessage.success('已删除')
    await loadTemplates()
  } catch (e) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

const generateFromTemplate = async (tpl) => {
  generatingId.value = tpl.id
  try {
    const res = await exerciseTemplateApi.generateFromTemplate(tpl.id)
    if (res?.success) {
      generatedContent.value = res.data?.content || res.data?.exercises || JSON.stringify(res.data, null, 2)
      showGenerated.value = true
    }
  } catch (error) {
    ElMessage.error('生成失败: ' + error.message)
  } finally {
    generatingId.value = null
  }
}

const copyGenerated = () => {
  navigator.clipboard.writeText(generatedContent.value)
  ElMessage.success('已复制')
}

onMounted(loadTemplates)
</script>

<style scoped>
.templates-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  animation: fadeInUp 0.6s ease;
}

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

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 24px 12px;
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
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(246, 211, 101, 0.4);
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

.gradient-btn {
  background: linear-gradient(135deg, #f6d365 0%, #fda085 100%);
  border: none;
  box-shadow: 0 4px 16px rgba(246, 211, 101, 0.3);
}

.template-list {
  padding: 20px 24px;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
}

.template-card {
  background: rgba(248, 250, 252, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.3s ease;
}

.template-card:hover {
  border-color: rgba(246, 211, 101, 0.4);
  box-shadow: 0 4px 16px rgba(246, 211, 101, 0.15);
}

.template-info h3 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: #2d3748;
}

.template-meta {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.template-desc {
  font-size: 13px;
  color: #718096;
  margin: 8px 0 0 0;
}

.template-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.06);
}

.difficulty-sliders {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.slider-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.slider-item span {
  min-width: 50px;
  font-size: 13px;
  color: #718096;
}

.slider-item .el-slider {
  flex: 1;
}

.generated-content {
  max-height: 500px;
  overflow-y: auto;
  line-height: 1.8;
}

.generated-content :deep(pre) {
  background: #1a202c;
  color: #e2e8f0;
  padding: 16px;
  border-radius: 8px;
  overflow-x: auto;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
