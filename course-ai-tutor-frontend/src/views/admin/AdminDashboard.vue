<template>
  <div class="admin-container">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">
              <span class="title-emoji">🔧</span>
            </div>
            <div>
              <h2>系统管理后台</h2>
              <p>用户管理、安全管控、数据分析</p>
            </div>
          </div>
          <el-tag v-if="maintenanceMode" type="danger" effect="dark" size="large">
            ⚠️ 维护中
          </el-tag>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="admin-tabs" @tab-click="onTabChange">
        <!-- 实时大盘 -->
        <el-tab-pane label="📊 实时大盘" name="dashboard">
          <div class="tab-content">
            <el-row :gutter="20" class="stats-row">
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">👥</div>
                  <div>
                    <div class="stat-value">{{ dashboardData.totalUsers }}</div>
                    <div class="stat-label">总用户数</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-icon" style="background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)">🟢</div>
                  <div>
                    <div class="stat-value">{{ dashboardData.onlineCount }}</div>
                    <div class="stat-label">在线用户</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-icon" style="background: linear-gradient(135deg, #f6d365 0%, #fda085 100%)">📚</div>
                  <div>
                    <div class="stat-value">{{ dashboardData.todayStudyHours }}h</div>
                    <div class="stat-label">今日学习</div>
                  </div>
                </div>
              </el-col>
              <el-col :span="6">
                <div class="stat-card">
                  <div class="stat-icon" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%)">🚫</div>
                  <div>
                    <div class="stat-value">{{ dashboardData.bannedCount }}</div>
                    <div class="stat-label">封禁用户</div>
                  </div>
                </div>
              </el-col>
            </el-row>

            <el-row :gutter="20" style="margin-top: 20px">
              <el-col :span="8">
                <el-card class="monitor-card">
                  <div class="monitor-header">📡 API 调用量</div>
                  <div class="monitor-value">{{ dashboardData.apiCalls.toLocaleString() }}</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="monitor-card">
                  <div class="monitor-header">⏱️ 平均响应</div>
                  <div class="monitor-value">{{ dashboardData.avgResponseTime }}ms</div>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="monitor-card">
                  <div class="monitor-header">❌ 错误率</div>
                  <div class="monitor-value">{{ dashboardData.errorRate }}%</div>
                </el-card>
              </el-col>
            </el-row>

            <el-divider />
            <h3>🤖 AI 系统分析</h3>
            <el-input v-model="aiQuery" type="textarea" :rows="3" placeholder="输入你想了解的系统信息..." class="gradient-input" />
            <div class="ai-actions">
              <el-button type="primary" :loading="aiLoading" @click="runAIAnalysis">🤖 {{ aiLoading ? '分析中...' : '开始分析' }}</el-button>
            </div>
            <div v-if="aiResult" class="ai-result" v-html="renderedAIResult"></div>
          </div>
        </el-tab-pane>

        <!-- 用户管理 -->
        <el-tab-pane label="👥 用户管理" name="users">
          <div class="tab-content">
            <div class="toolbar">
              <el-input v-model="userFilter.keyword" placeholder="搜索用户名/邮箱" clearable style="width: 250px" @change="loadUsers">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-select v-model="userFilter.role" placeholder="全部角色" clearable style="width: 150px" @change="loadUsers">
                <el-option label="学生" value="student" />
                <el-option label="教师" value="teacher" />
                <el-option label="管理员" value="admin" />
                <el-option label="子管理员" value="sub_admin" />
              </el-select>
              <el-button type="primary" @click="showUserDialog = 'add'"><el-icon><Plus /></el-icon> 新建用户</el-button>
            </div>

            <el-table :data="users" style="width: 100%" v-loading="userLoading">
              <el-table-column prop="id" label="ID" width="60" align="center" />
              <el-table-column prop="username" label="用户名" width="140" />
              <el-table-column prop="email" label="邮箱" width="200" />
              <el-table-column prop="role" label="角色" width="120" align="center">
                <template #default="{ row }">
                  <el-tag :type="roleType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="status" label="状态" width="90" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">{{ row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="280" align="center">
                <template #default="{ row }">
                  <el-button size="small" @click="editUser(row)">编辑</el-button>
                  <el-button size="small" :type="row.status === '正常' ? 'danger' : 'success'" @click="toggleUserBan(row)">
                    {{ row.status === '正常' ? '封禁' : '解封' }}
                  </el-button>
                  <el-button size="small" type="danger" @click="deleteUser(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 子管理员与权限 -->
        <el-tab-pane label="🔑 子管理员" name="subadmins">
          <div class="tab-content">
            <div class="toolbar">
              <el-button type="primary" @click="showSubAdminDialog = true"><el-icon><Plus /></el-icon> 新建子管理员</el-button>
            </div>
            <el-table :data="subAdmins">
              <el-table-column prop="id" label="ID" width="60" align="center" />
              <el-table-column prop="username" label="用户名" width="140" />
              <el-table-column prop="email" label="邮箱" width="200" />
              <el-table-column prop="role" label="角色" width="120" align="center">
                <template #default="{ row }">
                  <el-tag type="warning" size="small">{{ row.role === 'admin' ? '主管理员' : '子管理员' }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="permissions" label="权限" min-width="300">
                <template #default="{ row }">
                  <el-tag v-for="p in row.permissions" :key="p" size="small" style="margin-right: 4px">{{ permLabel(p) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button size="small" @click="editSubAdmin(row)">编辑权限</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 操作日志 -->
        <el-tab-pane label="📋 操作日志" name="logs">
          <div class="tab-content">
            <div class="toolbar">
              <el-input v-model="logFilter.operator" placeholder="搜索操作人" clearable style="width: 200px" @change="loadLogs">
                <template #prefix><el-icon><Search /></el-icon></template>
              </el-input>
              <el-button @click="loadLogs"><el-icon><Refresh /></el-icon> 刷新</el-button>
            </div>
            <el-table :data="logs" v-loading="logLoading">
              <el-table-column prop="id" label="ID" width="60" align="center" />
              <el-table-column prop="operator" label="操作人" width="120" />
              <el-table-column prop="action" label="操作" width="130" />
              <el-table-column prop="target" label="目标" width="200" />
              <el-table-column prop="detail" label="详情" min-width="250" show-overflow-tooltip />
              <el-table-column prop="time" label="时间" width="180">
                <template #default="{ row }">
                  {{ formatTime(row.time) }}
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 通知与禁言 -->
        <el-tab-pane label="📢 通知管理" name="notifications">
          <div class="tab-content">
            <div class="toolbar">
              <el-button type="primary" @click="showNotifDialog = true"><el-icon><Plus /></el-icon> 发布通知</el-button>
            </div>
            <el-table :data="notifications">
              <el-table-column prop="id" label="ID" width="60" align="center" />
              <el-table-column prop="title" label="标题" width="200" />
              <el-table-column prop="type" label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="notifType(row.type)" size="small">{{ notifLabel(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="target" label="目标" width="120" align="center" />
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag type="success" size="small">{{ row.status === 'published' ? '已发布' : row.status }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="时间" width="180">
                <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
              </el-table-column>
              <el-table-column label="操作" width="120" align="center">
                <template #default="{ row }">
                  <el-button size="small" type="danger" @click="deleteNotification(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 教学资源 -->
        <el-tab-pane label="📚 教学资源" name="resources">
          <div class="tab-content">
            <div class="toolbar">
              <el-button type="primary" @click="showResourceDialog = true"><el-icon><Plus /></el-icon> 添加资源</el-button>
            </div>
            <el-table :data="resources">
              <el-table-column prop="id" label="ID" width="60" align="center" />
              <el-table-column prop="title" label="标题" min-width="250" />
              <el-table-column prop="type" label="类型" width="100" align="center">
                <template #default="{ row }">
                  <el-tag size="small">{{ resTypeLabel(row.type) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="author" label="作者" width="120" />
              <el-table-column prop="status" label="状态" width="100" align="center">
                <template #default="{ row }">
                  <el-tag :type="row.status === 'published' ? 'success' : 'warning'" size="small">
                    {{ row.status === 'published' ? '已发布' : '审核中' }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="createdAt" label="创建时间" width="130" />
              <el-table-column label="操作" width="200" align="center">
                <template #default="{ row }">
                  <el-button size="small" @click="toggleResourceStatus(row)">{{ row.status === 'published' ? '下架' : '发布' }}</el-button>
                  <el-button size="small" type="danger" @click="deleteResource(row)">删除</el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 学情报表 -->
        <el-tab-pane label="📈 学情报表" name="learning">
          <div class="tab-content">
            <el-table :data="learningData" v-loading="learningLoading">
              <el-table-column prop="name" label="学生" width="100" />
              <el-table-column prop="studyHours" label="学习时长(h)" width="130" align="center" />
              <el-table-column prop="progress" label="进度(%)" width="120" align="center">
                <template #default="{ row }">
                  <el-progress :percentage="row.progress" :stroke-width="12" :color="row.progress >= 80 ? '#43e97b' : '#fda085'" />
                </template>
              </el-table-column>
              <el-table-column prop="weakPoints" label="薄弱知识点" min-width="250" />
              <el-table-column prop="avgScore" label="平均分" width="100" align="center">
                <template #default="{ row }">
                  <span :style="{ color: row.avgScore >= 85 ? '#43e97b' : '#f5576c', fontWeight: 'bold' }">{{ row.avgScore }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </el-tab-pane>

        <!-- 安全中心 -->
        <el-tab-pane label="🛡️ 安全中心" name="security">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <h3>敏感词管理</h3>
                <div class="toolbar">
                  <el-input v-model="newWord" placeholder="添加敏感词" style="width: 200px" @keydown.enter="addSensitiveWord">
                    <template #append><el-button @click="addSensitiveWord">添加</el-button></template>
                  </el-input>
                </div>
                <div class="word-list">
                  <el-tag v-for="(w, i) in securityData.sensitiveWords" :key="i" closable type="danger" @close="removeSensitiveWord(w)" class="word-tag">
                    {{ w }}
                  </el-tag>
                  <el-empty v-if="securityData.sensitiveWords.length === 0" description="暂无敏感词" :image-size="80" />
                </div>
              </el-col>
              <el-col :span="12">
                <h3>IP 黑名单</h3>
                <div class="toolbar">
                  <el-input v-model="newIP" placeholder="IP 地址" style="width: 180px" />
                  <el-input v-model="newIPReason" placeholder="封禁原因" style="width: 180px; margin-left: 10px" @keydown.enter="addIPBlacklist" />
                  <el-button @click="addIPBlacklist" style="margin-left: 10px">添加</el-button>
                </div>
                <div class="word-list">
                  <el-tag v-for="(ip, i) in securityData.ipBlacklist" :key="i" closable type="warning" @close="removeIPBlacklist(ip)" class="word-tag">
                    {{ ip }}
                  </el-tag>
                  <el-empty v-if="securityData.ipBlacklist.length === 0" description="暂无黑名单" :image-size="80" />
                </div>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <!-- 系统设置 -->
        <el-tab-pane label="⚙️ 系统设置" name="settings">
          <div class="tab-content">
            <el-form :model="settings" label-width="120px">
              <el-form-item label="系统名称">
                <el-input v-model="settings.systemName" />
              </el-form-item>
              <el-form-item label="用户协议">
                <el-input v-model="settings.agreement" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item label="隐私条款">
                <el-input v-model="settings.privacyPolicy" type="textarea" :rows="4" />
              </el-form-item>
              <el-form-item label="维护模式">
                <el-switch v-model="settings.maintenanceMode" active-text="开启" inactive-text="关闭" @change="toggleMaintenance" />
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="saveSettings">保存设置</el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <!-- 数据管理 -->
        <el-tab-pane label="💾 数据管理" name="data">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="8">
                <el-card class="data-card">
                  <div class="data-icon">📦</div>
                  <h3>数据备份</h3>
                  <p>导出当前所有数据到备份文件</p>
                  <el-button type="primary" @click="backupData" :loading="backupLoading">立即备份</el-button>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="data-card">
                  <div class="data-icon">📥</div>
                  <h3>数据恢复</h3>
                  <p>从备份文件恢复数据</p>
                  <el-upload :before-upload="handleRestore" accept=".json" :auto-upload="false" :show-file-list="false">
                    <el-button>选择备份文件</el-button>
                  </el-upload>
                </el-card>
              </el-col>
              <el-col :span="8">
                <el-card class="data-card">
                  <div class="data-icon">🔄</div>
                  <h3>版本信息</h3>
                  <p>当前版本: v2.0.0</p>
                  <p>模型: qwen3.6-plus</p>
                  <el-button type="info" disabled>检查更新</el-button>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 用户编辑/新建对话框 -->
    <el-dialog v-model="showUserDialogVisible" :title="showUserDialog === 'add' ? '新建用户' : '编辑用户'" width="500px">
      <el-form :model="userForm" label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="userForm.username" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="userForm.email" />
        </el-form-item>
        <el-form-item label="密码" v-if="showUserDialog === 'add'">
          <el-input v-model="userForm.password" type="password" placeholder="默认: 123456" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="userForm.role" style="width: 100%">
            <el-option label="学生" value="student" />
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUserDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveUser" :loading="userSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 子管理员对话框 -->
    <el-dialog v-model="showSubAdminDialog" :title="editingSubAdmin ? '编辑权限' : '新建子管理员'" width="500px">
      <el-form label-width="80px">
        <el-form-item label="用户名">
          <el-input v-model="subAdminForm.username" :disabled="!!editingSubAdmin" />
        </el-form-item>
        <el-form-item label="邮箱" v-if="!editingSubAdmin">
          <el-input v-model="subAdminForm.email" />
        </el-form-item>
        <el-form-item label="权限">
          <el-checkbox-group v-model="subAdminForm.permissions">
            <el-checkbox value="users">用户管理</el-checkbox>
            <el-checkbox value="logs">操作日志</el-checkbox>
            <el-checkbox value="resources">教学资源</el-checkbox>
            <el-checkbox value="notifications">通知管理</el-checkbox>
            <el-checkbox value="dashboard">实时大盘</el-checkbox>
            <el-checkbox value="security">安全中心</el-checkbox>
            <el-checkbox value="settings">系统设置</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSubAdminDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSubAdmin" :loading="subAdminSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 通知对话框 -->
    <el-dialog v-model="showNotifDialog" title="发布通知" width="500px">
      <el-form :model="notifForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="notifForm.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="notifForm.type" style="width: 100%">
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="重要" value="danger" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标"><el-input v-model="notifForm.target" placeholder="all 或指定用户" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="notifForm.content" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNotifDialog = false">取消</el-button>
        <el-button type="primary" @click="saveNotification">发布</el-button>
      </template>
    </el-dialog>

    <!-- 资源对话框 -->
    <el-dialog v-model="showResourceDialog" title="添加资源" width="500px">
      <el-form :model="resourceForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="resourceForm.title" /></el-form-item>
        <el-form-item label="类型">
          <el-select v-model="resourceForm.type" style="width: 100%">
            <el-option label="课程" value="course" />
            <el-option label="文档" value="document" />
            <el-option label="练习" value="exercise" />
          </el-select>
        </el-form-item>
        <el-form-item label="作者"><el-input v-model="resourceForm.author" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showResourceDialog = false">取消</el-button>
        <el-button type="primary" @click="saveResource">添加</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import MarkdownIt from 'markdown-it'
import { adminApi, extractContent } from '@/api'

const md = new MarkdownIt()
const activeTab = ref('dashboard')
const maintenanceMode = ref(false)

// 实时大盘
const dashboardData = reactive({ totalUsers: 0, studentCount: 0, teacherCount: 0, onlineCount: 0, bannedCount: 0, apiCalls: 0, avgResponseTime: 0, errorRate: 0, todayActive: 0, todayStudyHours: 0 })
const aiQuery = ref('')
const aiLoading = ref(false)
const aiResult = ref(null)
const renderedAIResult = computed(() => aiResult.value ? md.render(aiResult.value) : '')

// 用户管理
const users = ref([])
const userLoading = ref(false)
const userSaving = ref(false)
const userFilter = reactive({ role: '', keyword: '' })
const showUserDialog = ref(false)
const showUserDialogVisible = computed({ get: () => !!showUserDialog.value, set: (v) => { if (!v) showUserDialog.value = false } })
const userForm = reactive({ id: null, username: '', email: '', password: '', role: 'student' })

// 子管理员
const subAdmins = ref([])
const showSubAdminDialog = ref(false)
const subAdminSaving = ref(false)
const editingSubAdmin = ref(null)
const subAdminForm = reactive({ username: '', email: '', permissions: [] })

// 操作日志
const logs = ref([])
const logLoading = ref(false)
const logFilter = reactive({ operator: '' })

// 通知
const notifications = ref([])
const showNotifDialog = ref(false)
const notifForm = reactive({ title: '', type: 'info', target: 'all', content: '' })

// 教学资源
const resources = ref([])
const showResourceDialog = ref(false)
const resourceForm = reactive({ title: '', type: 'course', author: '' })

// 学情报表
const learningData = ref([])
const learningLoading = ref(false)

// 安全中心
const securityData = reactive({ sensitiveWords: [], ipBlacklist: [] })
const newWord = ref('')
const newIP = ref('')
const newIPReason = ref('')

// 系统设置
const settings = reactive({ systemName: '', agreement: '', privacyPolicy: '', maintenanceMode: false })

// 数据管理
const backupLoading = ref(false)

// 工具函数
const roleType = (role) => ({ admin: 'danger', teacher: 'warning', student: '' }[role] || 'info')
const roleLabel = (role) => ({ admin: '管理员', teacher: '教师', student: '学生', sub_admin: '子管理员' }[role] || role)
const permLabel = (p) => ({ users: '用户管理', logs: '操作日志', resources: '教学资源', notifications: '通知管理', dashboard: '实时大盘', security: '安全中心', settings: '系统设置' }[p] || p)
const notifType = (t) => ({ info: '', warning: 'warning', danger: 'danger' }[t] || 'info')
const notifLabel = (t) => ({ info: '信息', warning: '警告', danger: '重要' }[t] || t)
const resTypeLabel = (t) => ({ course: '课程', document: '文档', exercise: '练习' }[t] || t)
const formatTime = (t) => t ? new Date(t).toLocaleString('zh-CN') : '-'

// 加载数据
const loadDashboard = async () => {
  try {
    const res = await adminApi.getDashboard()
    Object.assign(dashboardData, res.data)
  } catch { /* skip */ }
}

const loadUsers = async () => {
  userLoading.value = true
  try {
    const res = await adminApi.getUsers({ role: userFilter.role, keyword: userFilter.keyword })
    users.value = res.data
  } catch { /* skip */ } finally { userLoading.value = false }
}

const loadLogs = async () => {
  logLoading.value = true
  try {
    const res = await adminApi.getLogs({ operator: logFilter.operator, page: 1, limit: 50 })
    logs.value = res.data
  } catch { /* skip */ } finally { logLoading.value = false }
}

const loadNotifications = async () => {
  try {
    const res = await adminApi.getNotifications()
    notifications.value = res.data
  } catch { /* skip */ }
}

const loadResources = async () => {
  try {
    const res = await adminApi.getResources()
    resources.value = res.data
  } catch { /* skip */ }
}

const loadLearningStats = async () => {
  learningLoading.value = true
  try {
    const res = await adminApi.getLearningStats()
    learningData.value = res.data
  } catch { /* skip */ } finally { learningLoading.value = false }
}

const loadSecurity = async () => {
  try {
    const res = await adminApi.getSecurity()
    securityData.sensitiveWords = res.data.sensitiveWords
    securityData.ipBlacklist = res.data.ipBlacklist
  } catch { /* skip */ }
}

const loadSettings = async () => {
  try {
    const res = await adminApi.getSettings()
    Object.assign(settings, res.data)
    maintenanceMode.value = res.data.maintenanceMode
  } catch { /* skip */ }
}

const loadSubAdmins = async () => {
  try {
    const res = await adminApi.getSubAdmins()
    subAdmins.value = res.data
  } catch { /* skip */ }
}

const onTabChange = (tab) => {
  switch (tab.paneName) {
    case 'dashboard': loadDashboard(); break
    case 'users': loadUsers(); break
    case 'logs': loadLogs(); break
    case 'notifications': loadNotifications(); break
    case 'resources': loadResources(); break
    case 'learning': loadLearningStats(); break
    case 'security': loadSecurity(); break
    case 'settings': loadSettings(); break
    case 'subadmins': loadSubAdmins(); break
    case 'data': break
  }
}

// 用户操作
const editUser = (row) => {
  showUserDialog.value = 'edit'
  Object.assign(userForm, { id: row.id, username: row.username, email: row.email, password: '', role: row.role })
}

const saveUser = async () => {
  if (!userForm.username) { ElMessage.warning('请输入用户名'); return }
  userSaving.value = true
  try {
    if (showUserDialog.value === 'add') {
      await adminApi.createUser(userForm)
      ElMessage.success('用户创建成功')
    } else {
      await adminApi.updateUser(userForm.id, { username: userForm.username, email: userForm.email, role: userForm.role })
      ElMessage.success('用户已更新')
    }
    showUserDialog.value = false
    loadUsers()
  } catch (e) { ElMessage.error(e.response?.data?.message || '操作失败') } finally { userSaving.value = false }
}

const toggleUserBan = async (row) => {
  try {
    await adminApi.toggleBan(row.id)
    ElMessage.success(`${row.status === '正常' ? '已封禁' : '已解封'} ${row.username}`)
    loadUsers()
  } catch { /* skip */ }
}

const deleteUser = async (row) => {
  try {
    await ElMessageBox.confirm(`确定删除用户 ${row.username}？`, '确认删除', { type: 'warning' })
    await adminApi.deleteUser(row.id)
    ElMessage.success('已删除')
    loadUsers()
  } catch { /* skip */ }
}

// 子管理员操作
const editSubAdmin = (row) => {
  editingSubAdmin.value = row
  subAdminForm.username = row.username
  subAdminForm.email = row.email
  subAdminForm.permissions = [...row.permissions]
  showSubAdminDialog.value = true
}

const saveSubAdmin = async () => {
  if (!subAdminForm.username) { ElMessage.warning('请输入用户名'); return }
  subAdminSaving.value = true
  try {
    if (editingSubAdmin.value) {
      await adminApi.updateSubAdmin(editingSubAdmin.value.id, { permissions: subAdminForm.permissions })
      ElMessage.success('权限已更新')
    } else {
      await adminApi.createSubAdmin(subAdminForm)
      ElMessage.success('子管理员创建成功')
    }
    showSubAdminDialog.value = false
    loadSubAdmins()
  } catch (e) { ElMessage.error(e.response?.data?.message || '操作失败') } finally { subAdminSaving.value = false }
}

// 通知操作
const saveNotification = async () => {
  if (!notifForm.title) { ElMessage.warning('请输入标题'); return }
  try {
    await adminApi.createNotification(notifForm)
    ElMessage.success('通知已发布')
    showNotifDialog.value = false
    loadNotifications()
    Object.assign(notifForm, { title: '', content: '', type: 'info', target: 'all' })
  } catch { /* skip */ }
}

const deleteNotification = async (row) => {
  try {
    await adminApi.deleteNotification(row.id)
    ElMessage.success('已删除')
    loadNotifications()
  } catch { /* skip */ }
}

// 资源操作
const saveResource = async () => {
  if (!resourceForm.title) { ElMessage.warning('请输入标题'); return }
  try {
    await adminApi.createResource(resourceForm)
    ElMessage.success('资源已添加')
    showResourceDialog.value = false
    loadResources()
    Object.assign(resourceForm, { title: '', type: 'course', author: '' })
  } catch { /* skip */ }
}

const toggleResourceStatus = async (row) => {
  try {
    await adminApi.updateResource(row.id, { status: row.status === 'published' ? 'review' : 'published' })
    ElMessage.success(`已${row.status === 'published' ? '下架' : '发布'}`)
    loadResources()
  } catch { /* skip */ }
}

const deleteResource = async (row) => {
  try {
    await adminApi.deleteResource(row.id)
    ElMessage.success('已删除')
    loadResources()
  } catch { /* skip */ }
}

// 安全操作
const addSensitiveWord = async () => {
  if (!newWord.value) return
  try {
    await adminApi.addSensitiveWord(newWord.value)
    newWord.value = ''
    loadSecurity()
  } catch { /* skip */ }
}

const removeSensitiveWord = async (word) => {
  try { await adminApi.removeSensitiveWord(word); loadSecurity() } catch { /* skip */ }
}

const addIPBlacklist = async () => {
  if (!newIP.value) return
  try {
    await adminApi.addIPBlacklist(newIP.value, newIPReason.value)
    newIP.value = ''; newIPReason.value = ''
    loadSecurity()
  } catch { /* skip */ }
}

const removeIPBlacklist = async (ip) => {
  try { await adminApi.removeIPBlacklist(ip); loadSecurity() } catch { /* skip */ }
}

// 系统设置
const saveSettings = async () => {
  try {
    await adminApi.updateSettings(settings)
    ElMessage.success('设置已保存')
    loadSettings()
  } catch { /* skip */ }
}

const toggleMaintenance = async () => {
  try {
    await adminApi.toggleMaintenance(settings.maintenanceMode)
    ElMessage.success(settings.maintenanceMode ? '维护模式已开启' : '维护模式已关闭')
  } catch { /* skip */ }
}

// AI 分析
const runAIAnalysis = async () => {
  if (!aiQuery.value.trim()) { ElMessage.warning('请输入分析内容'); return }
  aiLoading.value = true
  try {
    const res = await adminApi.aiAnalysis(aiQuery.value)
    aiResult.value = extractContent(res) || res.data || '分析完成，暂无详细信息。'
  } catch (e) { ElMessage.error('AI 分析失败'); aiResult.value = '无法连接到 AI 服务，请联系管理员检查系统状态。' } finally { aiLoading.value = false }
}

// 数据备份/恢复
const backupData = async () => {
  backupLoading.value = true
  try {
    const res = await adminApi.backup()
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `backup_${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
    ElMessage.success('备份已下载')
  } catch (e) { ElMessage.error('备份失败') } finally { backupLoading.value = false }
}

const handleRestore = (file) => {
  const reader = new FileReader()
  reader.onload = async (e) => {
    try {
      const backup = JSON.parse(e.target.result)
      await adminApi.restore(backup)
      ElMessage.success('数据已恢复')
    } catch { ElMessage.error('备份文件格式错误') }
  }
  reader.readAsText(file)
  return false
}

// 初始化
onMounted(() => {
  loadDashboard()
  loadUsers()
})
</script>

<style scoped>
.admin-container { max-width: 1400px; margin: 0 auto; animation: fadeInUp 0.6s ease; }
.glass-card {
  background: rgba(255, 255, 255, 0.95); backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
.card-header { display: flex; justify-content: space-between; align-items: center; }
.header-left { display: flex; align-items: center; gap: 16px; }
.title-icon { width: 50px; height: 50px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: white; box-shadow: 0 4px 12px rgba(240, 147, 251, 0.4); font-size: 28px; }
.card-header h2 { margin: 0 0 4px 0; font-size: 20px; color: #2d3748; }
.card-header p { margin: 0; font-size: 13px; color: #718096; }

/* Tabs */
.admin-tabs { margin-top: 16px; }
.admin-tabs :deep(.el-tabs__item) { font-size: 15px; padding: 12px 24px; }
.tab-content { padding: 8px 4px; }

/* Toolbar */
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; align-items: center; flex-wrap: wrap; }

/* Stats */
.stats-row { margin-bottom: 16px; }
.stat-card { display: flex; align-items: center; gap: 16px; padding: 24px; background: rgba(255,255,255,0.8); border-radius: 16px; border: 1px solid rgba(0,0,0,0.05); transition: all 0.3s ease; }
.stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
.stat-icon { font-size: 32px; width: 56px; height: 56px; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: white; flex-shrink: 0; }
.stat-value { font-size: 28px; font-weight: 700; color: #2d3748; }
.stat-label { font-size: 13px; color: #718096; }

/* Monitor */
.monitor-card { text-align: center; padding: 24px; border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; }
.monitor-header { font-size: 14px; color: #718096; margin-bottom: 8px; }
.monitor-value { font-size: 32px; font-weight: 700; color: #2d3748; }

/* AI */
.ai-actions { margin-top: 12px; }
.ai-result { margin-top: 20px; background: white; padding: 24px; border-radius: 12px; line-height: 1.8; color: #4a5568; }
.ai-result :deep(h3) { color: #2d3748; margin-top: 16px; }

/* Security */
.word-list { display: flex; flex-wrap: wrap; gap: 8px; min-height: 100px; padding: 12px 0; }
.word-tag { margin: 0; }

/* Data */
.data-card { text-align: center; padding: 32px 24px; }
.data-icon { font-size: 48px; margin-bottom: 16px; }
.data-card h3 { margin: 8px 0; color: #2d3748; }
.data-card p { color: #718096; font-size: 13px; margin-bottom: 16px; }

.gradient-input :deep(.el-textarea__wrapper) {
  background: white; box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  border: 2px solid rgba(240, 147, 251, 0.2);
}

@keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>
