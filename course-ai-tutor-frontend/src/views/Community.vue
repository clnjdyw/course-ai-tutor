<template>
  <div class="community-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">
              <el-icon :size="24"><ChatDotRound /></el-icon>
            </div>
            <div>
              <h2>💬 学习社区</h2>
              <p>与同学交流学习心得</p>
            </div>
          </div>
          <el-button type="primary" @click="showCreate = true" class="gradient-btn">
            <el-icon><Plus /></el-icon>
            发帖
          </el-button>
        </div>
      </template>

      <!-- Tab 切换 -->
      <el-tabs v-model="activeTab" class="community-tabs">
        <el-tab-pane label="帖子讨论" name="posts">
          <!-- 帖子列表 -->
          <div v-loading="loading" class="post-list">
            <div v-for="post in posts" :key="post.id" class="post-card">
              <div class="post-header">
                <el-avatar :size="36" class="post-avatar">{{ (post.author_username || post.username || 'U')[0] }}</el-avatar>
                <div class="post-meta">
                  <span class="post-author">{{ post.author_username || post.username || '匿名' }}</span>
                  <span class="post-time">{{ formatTime(post.created_at || post.createdAt) }}</span>
                </div>
              </div>
              <h3 class="post-title" @click="viewPost(post)">{{ post.title }}</h3>
              <p class="post-excerpt">{{ (post.content || '').substring(0, 150) }}{{ (post.content || '').length > 150 ? '...' : '' }}</p>
              <div class="post-actions">
                <el-button text size="small" @click="likePost(post)">
                  <span>👍</span> {{ post.likes || 0 }}
                </el-button>
                <el-button text size="small" @click="viewPost(post)">
                  <span>💬</span> {{ post.comment_count || post.comments_count || 0 }}
                </el-button>
              </div>
            </div>
            <el-empty v-if="posts.length === 0 && !loading" description="暂无帖子，快来发第一帖吧！" />
          </div>
        </el-tab-pane>

        <el-tab-pane label="学习小组" name="groups">
          <div class="groups-header">
            <el-button type="primary" @click="showCreateGroup = true" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              创建小组
            </el-button>
          </div>
          <div v-loading="groupsLoading" class="groups-grid">
            <el-card v-for="group in groups" :key="group.id" class="group-card glass-card" shadow="hover">
              <div class="group-info">
                <h3 class="group-name">{{ group.name }}</h3>
                <p class="group-desc">{{ group.description || '暂无描述' }}</p>
                <div class="group-meta">
                  <span class="group-owner">👤 {{ group.owner || group.owner_username || '未知' }}</span>
                  <span class="group-members">👥 {{ group.member_count || group.members_count || 0 }}/{{ group.max_members || group.maxMembers || '∞' }}</span>
                </div>
              </div>
              <el-button type="primary" size="small" class="gradient-btn join-btn"
                @click="joinGroup(group)" :loading="joiningGroupId === group.id">
                加入小组
              </el-button>
            </el-card>
            <el-empty v-if="groups.length === 0 && !groupsLoading" description="暂无小组，快来创建第一个吧！" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 发帖对话框 -->
    <el-dialog v-model="showCreate" title="发布帖子" width="600px">
      <el-form :model="newPost" label-width="60px">
        <el-form-item label="标题">
          <el-input v-model="newPost.title" placeholder="输入帖子标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="newPost.content" type="textarea" :rows="6" placeholder="分享你的学习心得..." />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreate = false">取消</el-button>
        <el-button type="primary" @click="submitPost" :loading="submitting">发布</el-button>
      </template>
    </el-dialog>

    <!-- 帖子详情对话框 -->
    <el-dialog v-model="showDetail" :title="currentPost?.title || '帖子详情'" width="700px">
      <div v-if="currentPost" class="post-detail">
        <p class="detail-content">{{ currentPost.content }}</p>
        <el-divider />
        <h4>评论 ({{ comments.length }})</h4>
        <div class="comment-list">
          <div v-for="c in comments" :key="c.id" class="comment-item">
            <span class="comment-author">{{ c.username || '匿名' }}:</span>
            <span class="comment-text">{{ c.content }}</span>
          </div>
          <el-empty v-if="comments.length === 0" description="暂无评论" :image-size="60" />
        </div>
        <div class="comment-input">
          <el-input v-model="newComment" placeholder="写下你的评论..." @keyup.enter="submitComment">
            <template #append>
              <el-button @click="submitComment">发送</el-button>
            </template>
          </el-input>
        </div>
      </div>
    </el-dialog>

    <!-- 创建小组对话框 -->
    <el-dialog v-model="showCreateGroup" title="创建学习小组" width="500px">
      <el-form :model="newGroup" label-width="80px">
        <el-form-item label="小组名称">
          <el-input v-model="newGroup.name" placeholder="输入小组名称" />
        </el-form-item>
        <el-form-item label="小组描述">
          <el-input v-model="newGroup.description" type="textarea" :rows="3" placeholder="描述小组的学习方向和目标..." />
        </el-form-item>
        <el-form-item label="最大人数">
          <el-input-number v-model="newGroup.maxMembers" :min="2" :max="100" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateGroup = false">取消</el-button>
        <el-button type="primary" @click="submitGroup" :loading="groupSubmitting">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { ChatDotRound, Plus } from '@element-plus/icons-vue'
import { communityApi } from '@/api'

const loading = ref(false)
const posts = ref([])
const showCreate = ref(false)
const showDetail = ref(false)
const submitting = ref(false)
const currentPost = ref(null)
const comments = ref([])
const newComment = ref('')
const newPost = ref({ title: '', content: '' })

// Study group state
const activeTab = ref('posts')
const groups = ref([])
const groupsLoading = ref(false)
const showCreateGroup = ref(false)
const groupSubmitting = ref(false)
const joiningGroupId = ref(null)
const newGroup = ref({ name: '', description: '', maxMembers: 10 })

async function fetchPosts() {
  loading.value = true
  try {
    const res = await communityApi.getPosts()
    if (res?.success) {
      posts.value = res.data || []
    }
  } catch {
    posts.value = []
  } finally {
    loading.value = false
  }
}

async function submitPost() {
  if (!newPost.value.title || !newPost.value.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  submitting.value = true
  try {
    const res = await communityApi.createPost(newPost.value)
    if (res?.success) {
      ElMessage.success('发布成功')
      showCreate.value = false
      newPost.value = { title: '', content: '' }
      fetchPosts()
    }
  } catch {
    ElMessage.error('发布失败')
  } finally {
    submitting.value = false
  }
}

async function viewPost(post) {
  currentPost.value = post
  showDetail.value = true
  try {
    const res = await communityApi.getPost(post.id)
    if (res?.success) {
      currentPost.value = res.data
      comments.value = res.data?.comments || []
    }
  } catch {
    comments.value = []
  }
}

async function likePost(post) {
  try {
    await communityApi.likePost?.(post.id)
    post.likes = (post.likes || 0) + 1
  } catch {
    // ignore
  }
}

async function submitComment() {
  if (!newComment.value.trim()) return
  try {
    const res = await communityApi.addComment(currentPost.value.id, { content: newComment.value })
    if (res?.success) {
      comments.value.push({ id: Date.now(), content: newComment.value, username: '我' })
      newComment.value = ''
    }
  } catch {
    ElMessage.error('评论失败')
  }
}

function formatTime(t) {
  if (!t) return ''
  const d = new Date(t)
  const diff = (Date.now() - d) / 1000
  if (diff < 60) return '刚刚'
  if (diff < 3600) return `${Math.floor(diff / 60)}分钟前`
  if (diff < 86400) return `${Math.floor(diff / 3600)}小时前`
  return d.toLocaleDateString()
}

// Study group methods
async function fetchGroups() {
  groupsLoading.value = true
  try {
    const res = await communityApi.getGroups()
    if (res?.success) {
      groups.value = res.data || []
    }
  } catch {
    groups.value = []
  } finally {
    groupsLoading.value = false
  }
}

async function submitGroup() {
  if (!newGroup.value.name) {
    ElMessage.warning('请填写小组名称')
    return
  }
  groupSubmitting.value = true
  try {
    const res = await communityApi.createGroup({
      name: newGroup.value.name,
      description: newGroup.value.description,
      maxMembers: newGroup.value.maxMembers,
    })
    if (res?.success) {
      ElMessage.success('创建成功')
      showCreateGroup.value = false
      newGroup.value = { name: '', description: '', maxMembers: 10 }
      fetchGroups()
    }
  } catch {
    ElMessage.error('创建失败')
  } finally {
    groupSubmitting.value = false
  }
}

async function joinGroup(group) {
  const prevId = joiningGroupId.value
  joiningGroupId.value = group.id
  try {
    const res = await communityApi.joinGroup(group.id)
    if (res?.success) {
      ElMessage.success('加入成功')
      fetchGroups()
    }
  } catch {
    ElMessage.error('加入失败')
  } finally {
    joiningGroupId.value = prevId
  }
}

onMounted(() => { fetchPosts(); fetchGroups() })
</script>

<style scoped>
.community-container { max-width: 1000px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card { background: rgba(255,255,255,0.95); backdrop-filter: blur(10px); border-radius: 16px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; }
.gradient-btn { background: linear-gradient(135deg, #43e97b, #38f9d7); border: none; }
h2 { margin: 0 0 4px; font-size: 20px; color: #2d3748; }
p { margin: 0; font-size: 13px; color: #718096; }
.post-list { display: flex; flex-direction: column; gap: 16px; }
.post-card { padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.3s; }
.post-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.post-header { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.post-meta { display: flex; flex-direction: column; }
.post-author { font-weight: 600; color: #2d3748; font-size: 14px; }
.post-time { font-size: 12px; color: #a0aec0; }
.post-title { margin: 0 0 8px; font-size: 18px; color: #2d3748; cursor: pointer; }
.post-title:hover { color: #667eea; }
.post-excerpt { font-size: 14px; color: #718096; line-height: 1.6; margin: 0 0 12px; }
.post-actions { display: flex; gap: 16px; }
.detail-content { line-height: 1.8; color: #2d3748; white-space: pre-wrap; }
.comment-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px; }
.comment-item { padding: 12px; background: #f8fafc; border-radius: 8px; }
.comment-author { font-weight: 600; color: #2d3748; margin-right: 8px; }
.comment-text { color: #4a5568; }
.comment-input { margin-top: 12px; }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
.community-tabs { margin-top: 8px; }
.groups-header { display: flex; justify-content: flex-end; margin-bottom: 16px; }
.groups-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; min-height: 120px; }
.group-card { display: flex; flex-direction: column; justify-content: space-between; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0; transition: all 0.3s; }
.group-card:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
.group-name { margin: 0 0 8px; font-size: 16px; color: #2d3748; }
.group-desc { font-size: 13px; color: #718096; line-height: 1.5; margin: 0 0 12px; min-height: 40px; }
.group-meta { display: flex; gap: 12px; font-size: 12px; color: #a0aec0; }
.join-btn { align-self: flex-start; margin-top: 12px; }
</style>
