<template>
  <div class="admin-dashboard">
    <el-card class="glass-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <div class="header-left">
            <div class="title-icon" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%)">
              <el-icon :size="24"><Setting /></el-icon>
            </div>
            <div>
              <h2>管理员控制面板</h2>
              <p>系统管理与数据监控</p>
            </div>
          </div>
          <el-button type="primary" @click="handleRefresh" :loading="loading" class="gradient-btn">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="admin-tabs">
        <!-- ==================== 数据概览 ==================== -->
        <el-tab-pane label="数据概览" name="overview">
          <div class="overview-grid">
            <div class="overview-card">
              <div class="card-icon" style="background: linear-gradient(135deg, #667eea, #764ba2)">
                <el-icon :size="28"><User /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overview.totalUsers }}</div>
                <div class="card-label">总用户数</div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon" style="background: linear-gradient(135deg, #43e97b, #38f9d7)">
                <el-icon :size="28"><UserFilled /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overview.activeUsers }}</div>
                <div class="card-label">活跃用户</div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon" style="background: linear-gradient(135deg, #f093fb, #f5576c)">
                <el-icon :size="28"><Document /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overview.totalExercises }}</div>
                <div class="card-label">总练习数</div>
              </div>
            </div>

            <div class="overview-card">
              <div class="card-icon" style="background: linear-gradient(135deg, #f6d365, #fda085)">
                <el-icon :size="28"><TrendCharts /></el-icon>
              </div>
              <div class="card-info">
                <div class="card-value">{{ overview.avgScore }}%</div>
                <div class="card-label">平均分数</div>
              </div>
            </div>
          </div>

          <!-- AI 分析区域 -->
          <el-card class="analysis-card" style="margin-top: 24px">
            <template #header>
              <div class="analysis-header">
                <span>AI 系统分析</span>
                <el-button
                  type="primary"
                  :loading="aiLoading"
                  @click="runAiAnalysis"
                  class="gradient-btn"
                  size="small"
                >
                  <el-icon><MagicStick /></el-icon>
                  运行分析
                </el-button>
              </div>
            </template>
            <div v-if="aiResult" class="ai-result" v-html="formatAiResult(aiResult)"></div>
            <el-empty v-else description="点击上方按钮运行 AI 系统分析" :image-size="80" />
          </el-card>
        </el-tab-pane>

        <!-- ==================== 用户管理 ==================== -->
        <el-tab-pane label="用户管理" name="users">
          <div class="users-toolbar">
            <el-input
              v-model="userSearch"
              placeholder="搜索用户名或邮箱"
              clearable
              style="width: 280px"
              @clear="fetchUsers"
              @keyup.enter="fetchUsers"
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
            <el-button type="primary" @click="showAddUserDialog" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              新增用户
            </el-button>
          </div>

          <el-table
            :data="filteredUsers"
            v-loading="usersLoading"
            stripe
            style="width: 100%"
            class="gradient-table"
            empty-text="暂无用户数据"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
            <el-table-column prop="level" label="等级" width="80" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">Lv.{{ row.level || 1 }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="role" label="角色" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.role === 'admin' ? 'danger' : 'success'" size="small">
                  {{ row.role === 'admin' ? '管理员' : '普通用户' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.banned ? 'danger' : 'success'" size="small">
                  {{ row.banned ? '已封禁' : '正常' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button
                  :type="row.banned ? 'success' : 'warning'"
                  size="small"
                  link
                  @click="handleToggleBan(row)"
                >
                  {{ row.banned ? '解封' : '封禁' }}
                </el-button>
                <el-popconfirm
                  title="确定要删除该用户吗？此操作不可恢复。"
                  confirm-button-text="删除"
                  cancel-button-text="取消"
                  @confirm="handleDeleteUser(row)"
                >
                  <template #reference>
                    <el-button type="danger" size="small" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ==================== 系统设置 ==================== -->
        <el-tab-pane label="系统设置" name="settings">
          <el-form
            :model="settingsForm"
            label-width="140px"
            v-loading="settingsLoading"
            class="settings-form"
          >
            <el-form-item label="站点名称">
              <el-input v-model="settingsForm.siteName" placeholder="请输入站点名称" />
            </el-form-item>
            <el-form-item label="允许注册">
              <el-switch v-model="settingsForm.allowRegister" />
            </el-form-item>
            <el-form-item label="维护模式">
              <el-switch v-model="settingsForm.maintenance" />
            </el-form-item>
            <el-form-item label="最大上传大小 (MB)">
              <el-input-number v-model="settingsForm.maxUploadSize" :min="1" :max="100" />
            </el-form-item>
            <el-form-item label="AI 分析模型">
              <el-select v-model="settingsForm.aiModel" placeholder="选择模型">
                <el-option label="默认模型" value="default" />
                <el-option label="高级模型" value="advanced" />
              </el-select>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="saveSettings" :loading="settingsSaving" class="gradient-btn">
                <el-icon><Check /></el-icon>
                保存设置
              </el-button>
            </el-form-item>
          </el-form>

          <el-divider />

          <div class="backup-section">
            <h3>数据备份与恢复</h3>
            <div class="backup-actions">
              <el-button
                type="primary"
                :loading="backupLoading"
                @click="handleBackup"
                class="gradient-btn"
              >
                <el-icon><Download /></el-icon>
                备份数据
              </el-button>
              <el-upload
                :show-file-list="false"
                :before-upload="handleRestore"
                accept=".json,.zip"
              >
                <el-button :loading="restoreLoading">
                  <el-icon><Upload /></el-icon>
                  恢复数据
                </el-button>
              </el-upload>
            </div>
          </div>
        </el-tab-pane>
        <!-- ==================== 子管理员 ==================== -->
        <el-tab-pane label="子管理员" name="sub-admins">
          <div class="tab-toolbar">
            <el-button type="primary" @click="showAddSubAdminDialog" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              新增子管理员
            </el-button>
          </div>

          <el-table
            :data="subAdmins"
            v-loading="subAdminsLoading"
            stripe
            style="width: 100%"
            class="gradient-table"
            empty-text="暂无子管理员"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="username" label="用户名" min-width="120" />
            <el-table-column prop="email" label="邮箱" min-width="180" />
            <el-table-column prop="role" label="角色" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="warning" size="small">{{ row.role || '普通管理员' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'active' ? 'success' : 'danger'" size="small">
                  {{ row.status === 'active' ? '启用' : '禁用' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditSubAdminDialog(row)">
                  编辑
                </el-button>
                <el-popconfirm title="确定要删除该子管理员吗？" @confirm="handleDeleteSubAdmin(row)">
                  <template #reference>
                    <el-button type="danger" size="small" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ==================== 操作日志 ==================== -->
        <el-tab-pane label="操作日志" name="logs">
          <el-table
            :data="logs"
            v-loading="logsLoading"
            stripe
            style="width: 100%"
            class="gradient-table"
            empty-text="暂无操作日志"
          >
            <el-table-column prop="admin_id" label="管理员ID" width="100" />
            <el-table-column prop="action" label="操作" width="140" />
            <el-table-column prop="target" label="目标" min-width="140" />
            <el-table-column prop="details" label="详情" min-width="200" show-overflow-tooltip />
            <el-table-column prop="created_at" label="时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination-wrapper">
            <el-pagination
              v-model:current-page="logPage"
              :page-size="logPageSize"
              :total="logTotal"
              layout="total, prev, pager, next"
              @current-change="fetchLogs"
            />
          </div>
        </el-tab-pane>

        <!-- ==================== 通知管理 ==================== -->
        <el-tab-pane label="通知管理" name="notifications">
          <div class="tab-toolbar">
            <el-button type="primary" @click="showAddNotificationDialog" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              发布通知
            </el-button>
          </div>

          <el-table
            :data="notifications"
            v-loading="notificationsLoading"
            stripe
            style="width: 100%"
            class="gradient-table"
            empty-text="暂无通知"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="title" label="标题" min-width="200" />
            <el-table-column prop="content" label="内容" min-width="250" show-overflow-tooltip />
            <el-table-column prop="type" label="类型" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="getNotificationType(row.type)" size="small">{{ row.type || 'info' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="发布时间" width="180">
              <template #default="{ row }">
                {{ formatDate(row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-popconfirm title="确定要删除该通知吗？" @confirm="handleDeleteNotification(row)">
                  <template #reference>
                    <el-button type="danger" size="small" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ==================== 资源管理 ==================== -->
        <el-tab-pane label="资源管理" name="resources">
          <div class="tab-toolbar">
            <el-button type="primary" @click="showAddResourceDialog" class="gradient-btn">
              <el-icon><Plus /></el-icon>
              新增资源
            </el-button>
          </div>

          <el-table
            :data="resources"
            v-loading="resourcesLoading"
            stripe
            style="width: 100%"
            class="gradient-table"
            empty-text="暂无资源"
          >
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="type" label="类型" width="120" align="center">
              <template #default="{ row }">
                <el-tag type="info" size="small">{{ row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
            <el-table-column prop="url" label="链接" min-width="200" show-overflow-tooltip />
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditResourceDialog(row)">
                  编辑
                </el-button>
                <el-popconfirm title="确定要删除该资源吗？" @confirm="handleDeleteResource(row)">
                  <template #reference>
                    <el-button type="danger" size="small" link>删除</el-button>
                  </template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- ==================== 安全设置 ==================== -->
        <el-tab-pane label="安全设置" name="security">
          <div class="security-sections">
            <!-- 敏感词管理 -->
            <el-card class="security-card" shadow="never">
              <template #header>
                <div class="security-header">
                  <el-icon :size="18"><Warning /></el-icon>
                  <span>敏感词管理</span>
                </div>
              </template>
              <div class="security-input-row">
                <el-input
                  v-model="newSensitiveWord"
                  placeholder="输入敏感词"
                  style="width: 240px"
                  @keyup.enter="handleAddSensitiveWord"
                />
                <el-button type="primary" @click="handleAddSensitiveWord" :loading="sensitiveWordLoading" class="gradient-btn">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </div>
              <div class="word-list">
                <el-tag
                  v-for="word in sensitiveWords"
                  :key="word"
                  closable
                  type="danger"
                  size="small"
                  class="word-tag"
                  @close="handleRemoveSensitiveWord(word)"
                >
                  {{ word }}
                </el-tag>
                <el-empty v-if="sensitiveWords.length === 0" description="暂无敏感词" :image-size="60" />
              </div>
            </el-card>

            <!-- IP 黑名单 -->
            <el-card class="security-card" shadow="never">
              <template #header>
                <div class="security-header">
                  <el-icon :size="18"><Shield /></el-icon>
                  <span>IP 黑名单</span>
                </div>
              </template>
              <div class="ip-input-row">
                <el-input v-model="newIP.ip" placeholder="IP 地址" style="width: 180px" />
                <el-input v-model="newIP.reason" placeholder="封禁原因" style="width: 200px" />
                <el-button type="primary" @click="handleAddIPBlacklist" :loading="ipBlacklistLoading" class="gradient-btn">
                  <el-icon><Plus /></el-icon>
                  添加
                </el-button>
              </div>
              <el-table
                :data="ipBlacklist"
                stripe
                style="width: 100%; margin-top: 12px"
                class="gradient-table"
                empty-text="暂无黑名单记录"
              >
                <el-table-column prop="ip" label="IP 地址" min-width="160" />
                <el-table-column prop="reason" label="原因" min-width="200" />
                <el-table-column prop="created_at" label="添加时间" width="180">
                  <template #default="{ row }">
                    {{ formatDate(row.created_at) }}
                  </template>
                </el-table-column>
                <el-table-column label="操作" width="100" align="center">
                  <template #default="{ row }">
                    <el-popconfirm title="确定要移除该IP吗？" @confirm="handleRemoveIPBlacklist(row.ip)">
                      <template #reference>
                        <el-button type="danger" size="small" link>移除</el-button>
                      </template>
                    </el-popconfirm>
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </div>
        </el-tab-pane>

        <!-- ==================== 维护模式 ==================== -->
        <el-tab-pane label="维护模式" name="maintenance">
          <div class="maintenance-container">
            <el-card class="maintenance-card" shadow="never">
              <template #header>
                <div class="maintenance-header">
                  <el-icon :size="24"><Tools /></el-icon>
                  <span>维护模式控制</span>
                </div>
              </template>

              <div class="maintenance-status">
                <el-tag
                  :type="maintenanceEnabled ? 'danger' : 'success'"
                  size="large"
                  effect="dark"
                >
                  {{ maintenanceEnabled ? '维护中' : '正常运行' }}
                </el-tag>
              </div>

              <div class="maintenance-toggle">
                <span class="toggle-label">开启维护模式</span>
                <el-switch
                  v-model="maintenanceEnabled"
                  @change="handleToggleMaintenance"
                  :loading="maintenanceLoading"
                  active-color="#f56c6c"
                  inactive-color="#67c23a"
                />
              </div>

              <el-alert
                v-if="maintenanceEnabled"
                title="系统正处于维护模式，普通用户将无法访问"
                type="warning"
                :closable="false"
                show-icon
                style="margin-top: 20px"
              />
              <el-alert
                v-else
                title="系统运行正常，所有服务可用"
                type="success"
                :closable="false"
                show-icon
                style="margin-top: 20px"
              />
            </el-card>
          </div>
        </el-tab-pane>

        <!-- ==================== 课程管理 ==================== -->
        <el-tab-pane label="课程管理" name="courses">
          <div class="tab-toolbar">
            <el-input v-model="courseSearch" placeholder="搜索课程名称" clearable style="width: 240px" @clear="fetchCourses" @keyup.enter="fetchCourses">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddCourseDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增课程</el-button>
          </div>
          <el-table :data="courseList" v-loading="courseLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无课程数据">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="title" label="课程名称" min-width="180" />
            <el-table-column prop="category" label="分类" width="120" align="center" />
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">{{ row.status || '草稿' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditCourseDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该课程吗？" @confirm="handleDeleteCourse(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="coursePage" :page-size="coursePageSize" :total="courseTotal" layout="total, prev, pager, next" @current-change="fetchCourses" />
          </div>
        </el-tab-pane>

        <!-- ==================== 知识点管理 ==================== -->
        <el-tab-pane label="知识点管理" name="knowledge-points">
          <div class="tab-toolbar">
            <el-input v-model="kpSearch" placeholder="搜索知识点" clearable style="width: 240px" @clear="fetchKnowledgePoints" @keyup.enter="fetchKnowledgePoints">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddKpDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增知识点</el-button>
          </div>
          <el-table :data="kpList" v-loading="kpLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无知识点">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="courseId" label="所属课程" width="100" align="center" />
            <el-table-column prop="title" label="知识点" min-width="180" />
            <el-table-column prop="difficulty" label="难度" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.difficulty === 'hard' ? 'danger' : row.difficulty === 'medium' ? 'warning' : 'success'" size="small">{{ row.difficulty || 'easy' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditKpDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该知识点吗？" @confirm="handleDeleteKp(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="kpPage" :page-size="kpPageSize" :total="kpTotal" layout="total, prev, pager, next" @current-change="fetchKnowledgePoints" />
          </div>
        </el-tab-pane>

        <!-- ==================== 练习题库 ==================== -->
        <el-tab-pane label="练习题库" name="exercises">
          <div class="tab-toolbar">
            <el-input v-model="exerciseSearch" placeholder="搜索题目" clearable style="width: 240px" @clear="fetchExercises" @keyup.enter="fetchExercises">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddExerciseDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增题目</el-button>
          </div>
          <el-table :data="exerciseList" v-loading="exerciseLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无题目">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="type" label="类型" width="100" align="center" />
            <el-table-column prop="difficulty" label="难度" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.difficulty === 'hard' ? 'danger' : row.difficulty === 'medium' ? 'warning' : 'success'" size="small">{{ row.difficulty || 'easy' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditExerciseDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该题目吗？" @confirm="handleDeleteExercise(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="exercisePage" :page-size="exercisePageSize" :total="exerciseTotal" layout="total, prev, pager, next" @current-change="fetchExercises" />
          </div>
        </el-tab-pane>

        <!-- ==================== 学习笔记 ==================== -->
        <el-tab-pane label="学习笔记" name="notes">
          <div class="tab-toolbar">
            <el-input v-model="noteSearch" placeholder="搜索笔记标题" clearable style="width: 240px" @clear="fetchNotes" @keyup.enter="fetchNotes">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddNoteDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增笔记</el-button>
          </div>
          <el-table :data="noteList" v-loading="noteLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无学习笔记">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="isPublic" label="公开" width="80" align="center">
              <template #default="{ row }">
                <el-tag :type="row.isPublic ? 'success' : 'info'" size="small">{{ row.isPublic ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="views" label="浏览量" width="100" align="center" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditNoteDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该笔记吗？" @confirm="handleDeleteNote(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="notePage" :page-size="notePageSize" :total="noteTotal" layout="total, prev, pager, next" @current-change="fetchNotes" />
          </div>
        </el-tab-pane>

        <!-- ==================== 错题本 ==================== -->
        <el-tab-pane label="错题本" name="wrong-questions">
          <div class="tab-toolbar">
            <el-input v-model="wqSearch" placeholder="搜索用户ID" clearable style="width: 240px" @clear="fetchWrongQuestions" @keyup.enter="fetchWrongQuestions">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddWqDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增记录</el-button>
          </div>
          <el-table :data="wqList" v-loading="wqLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无错题记录">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="mastered" label="已掌握" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.mastered ? 'success' : 'warning'" size="small">{{ row.mastered ? '是' : '否' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="reviewCount" label="复习次数" width="100" align="center" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditWqDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该记录吗？" @confirm="handleDeleteWq(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="wqPage" :page-size="wqPageSize" :total="wqTotal" layout="total, prev, pager, next" @current-change="fetchWrongQuestions" />
          </div>
        </el-tab-pane>

        <!-- ==================== 学习计划 ==================== -->
        <el-tab-pane label="学习计划" name="study-plans">
          <div class="tab-toolbar">
            <el-input v-model="spSearch" placeholder="搜索用户ID" clearable style="width: 240px" @clear="fetchStudyPlans" @keyup.enter="fetchStudyPlans">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddSpDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增计划</el-button>
          </div>
          <el-table :data="spList" v-loading="spLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无学习计划">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="goal" label="目标" min-width="180" />
            <el-table-column prop="progress" label="进度" width="100" align="center">
              <template #default="{ row }">{{ row.progress ?? 0 }}%</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100" align="center">
              <template #default="{ row }">
                <el-tag :type="row.status === 'completed' ? 'success' : row.status === 'cancelled' ? 'danger' : 'primary'" size="small">{{ row.status || '进行中' }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditSpDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该计划吗？" @confirm="handleDeleteSp(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="spPage" :page-size="spPageSize" :total="spTotal" layout="total, prev, pager, next" @current-change="fetchStudyPlans" />
          </div>
        </el-tab-pane>

        <!-- ==================== 对话记录 ==================== -->
        <el-tab-pane label="对话记录" name="conversations">
          <div class="tab-toolbar">
            <el-input v-model="convSearch" placeholder="搜索用户ID或话题" clearable style="width: 240px" @clear="fetchConversations" @keyup.enter="fetchConversations">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddConvDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增记录</el-button>
          </div>
          <el-table :data="convList" v-loading="convLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无对话记录">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="agentType" label="智能体类型" width="140" align="center" />
            <el-table-column prop="topic" label="话题" min-width="180" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditConvDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该记录吗？" @confirm="handleDeleteConv(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="convPage" :page-size="convPageSize" :total="convTotal" layout="total, prev, pager, next" @current-change="fetchConversations" />
          </div>
        </el-tab-pane>

        <!-- ==================== 社区帖子 ==================== -->
        <el-tab-pane label="社区帖子" name="community-posts">
          <div class="tab-toolbar">
            <el-input v-model="postSearch" placeholder="搜索帖子标题" clearable style="width: 240px" @clear="fetchCommunityPosts" @keyup.enter="fetchCommunityPosts">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddPostDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增帖子</el-button>
          </div>
          <el-table :data="postList" v-loading="postLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无社区帖子">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="title" label="标题" min-width="180" />
            <el-table-column prop="type" label="类型" width="100" align="center" />
            <el-table-column prop="views" label="浏览量" width="100" align="center" />
            <el-table-column prop="created_at" label="创建时间" width="180">
              <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditPostDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该帖子吗？" @confirm="handleDeletePost(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="postPage" :page-size="postPageSize" :total="postTotal" layout="total, prev, pager, next" @current-change="fetchCommunityPosts" />
          </div>
        </el-tab-pane>

        <!-- ==================== 成就管理 ==================== -->
        <el-tab-pane label="成就管理" name="achievements">
          <div class="tab-toolbar">
            <el-input v-model="achSearch" placeholder="搜索成就名称" clearable style="width: 240px" @clear="fetchAchievements" @keyup.enter="fetchAchievements">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
            <el-button type="primary" @click="showAddAchDialog" class="gradient-btn"><el-icon><Plus /></el-icon>新增成就</el-button>
          </div>
          <el-table :data="achList" v-loading="achLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无成就数据">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="code" label="编码" width="140" />
            <el-table-column prop="name" label="名称" min-width="150" />
            <el-table-column prop="category" label="分类" width="120" align="center" />
            <el-table-column prop="points" label="积分" width="80" align="center" />
            <el-table-column prop="icon" label="图标" width="100" align="center" />
            <el-table-column label="操作" width="180" align="center" fixed="right">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="showEditAchDialog(row)">编辑</el-button>
                <el-popconfirm title="确定要删除该成就吗？" @confirm="handleDeleteAch(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="achPage" :page-size="achPageSize" :total="achTotal" layout="total, prev, pager, next" @current-change="fetchAchievements" />
          </div>
        </el-tab-pane>

        <!-- ==================== 学习会话 ==================== -->
        <el-tab-pane label="学习会话" name="sessions">
          <div class="tab-toolbar">
            <el-input v-model="sessionSearch" placeholder="搜索用户ID" clearable style="width: 240px" @clear="fetchSessions" @keyup.enter="fetchSessions">
              <template #prefix><el-icon><Search /></el-icon></template>
            </el-input>
          </div>
          <el-table :data="sessionList" v-loading="sessionLoading" stripe style="width: 100%" class="gradient-table" empty-text="暂无学习会话">
            <el-table-column prop="id" label="ID" width="70" />
            <el-table-column prop="userId" label="用户ID" width="100" align="center" />
            <el-table-column prop="activityType" label="活动类型" width="140" align="center" />
            <el-table-column prop="duration" label="时长(秒)" width="100" align="center" />
            <el-table-column prop="startTime" label="开始时间" width="180">
              <template #default="{ row }">{{ formatDate(row.startTime) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="100" align="center" fixed="right">
              <template #default="{ row }">
                <el-popconfirm title="确定要删除该会话吗？" @confirm="handleDeleteSession(row)">
                  <template #reference><el-button type="danger" size="small" link>删除</el-button></template>
                </el-popconfirm>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="sessionPage" :page-size="sessionPageSize" :total="sessionTotal" layout="total, prev, pager, next" @current-change="fetchSessions" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <!-- 新增用户对话框 -->
    <el-dialog v-model="addUserVisible" title="新增用户" width="460px" destroy-on-close>
      <el-form :model="addUserForm" label-width="80px" :rules="addUserRules" ref="addUserFormRef">
        <el-form-item label="用户名" prop="username">
          <el-input v-model="addUserForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="addUserForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码" prop="password">
          <el-input v-model="addUserForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="addUserForm.role" style="width: 100%">
            <el-option label="普通用户" value="user" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="addUserVisible = false">取消</el-button>
        <el-button type="primary" :loading="addUserLoading" @click="handleAddUser" class="gradient-btn">
          确认创建
        </el-button>
      </template>
    </el-dialog>

    <!-- 子管理员对话框 -->
    <el-dialog v-model="subAdminDialogVisible" :title="subAdminDialogTitle" width="460px" destroy-on-close>
      <el-form :model="subAdminForm" label-width="80px">
        <el-form-item v-if="!subAdminEditing" label="用户名" prop="username">
          <el-input v-model="subAdminForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item v-if="!subAdminEditing" label="邮箱">
          <el-input v-model="subAdminForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item v-if="!subAdminEditing" label="密码">
          <el-input v-model="subAdminForm.password" type="password" show-password placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="subAdminForm.role" style="width: 100%">
            <el-option label="普通管理员" value="admin" />
            <el-option label="超级管理员" value="super_admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="subAdminForm.status" style="width: 100%">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="disabled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="subAdminDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="subAdminDialogLoading" @click="handleSaveSubAdmin" class="gradient-btn">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 通知对话框 -->
    <el-dialog v-model="notificationDialogVisible" title="发布通知" width="500px" destroy-on-close>
      <el-form :model="notificationForm" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="notificationForm.title" placeholder="请输入通知标题" />
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="notificationForm.content" type="textarea" :rows="4" placeholder="请输入通知内容" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="notificationForm.type" style="width: 100%">
            <el-option label="信息" value="info" />
            <el-option label="警告" value="warning" />
            <el-option label="错误" value="error" />
            <el-option label="成功" value="success" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="notificationDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="notificationDialogLoading" @click="handleCreateNotification" class="gradient-btn">
          发布
        </el-button>
      </template>
    </el-dialog>

    <!-- 资源对话框 -->
    <el-dialog v-model="resourceDialogVisible" :title="resourceDialogTitle" width="500px" destroy-on-close>
      <el-form :model="resourceForm" label-width="80px">
        <el-form-item label="名称">
          <el-input v-model="resourceForm.name" placeholder="请输入资源名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="resourceForm.type" style="width: 100%">
            <el-option label="文档" value="document" />
            <el-option label="视频" value="video" />
            <el-option label="工具" value="tool" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="resourceForm.description" type="textarea" :rows="3" placeholder="请输入描述" />
        </el-form-item>
        <el-form-item label="链接">
          <el-input v-model="resourceForm.url" placeholder="请输入资源链接" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="resourceDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="resourceDialogLoading" @click="handleSaveResource" class="gradient-btn">
          确认
        </el-button>
      </template>
    </el-dialog>

    <!-- 课程管理对话框 -->
    <el-dialog v-model="courseDialogVisible" :title="courseDialogTitle" width="520px" destroy-on-close>
      <el-form :model="courseForm" label-width="80px">
        <el-form-item label="课程名称"><el-input v-model="courseForm.title" placeholder="请输入课程名称" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="courseForm.description" type="textarea" :rows="3" placeholder="请输入描述" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="courseForm.category" placeholder="请输入分类" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="courseForm.status" style="width: 100%">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
        <el-form-item label="封面链接"><el-input v-model="courseForm.coverUrl" placeholder="请输入封面链接" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="courseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="courseDialogLoading" @click="handleSaveCourse" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 知识点管理对话框 -->
    <el-dialog v-model="kpDialogVisible" :title="kpDialogTitle" width="520px" destroy-on-close>
      <el-form :model="kpForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="kpForm.title" placeholder="请输入知识点标题" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="kpForm.description" type="textarea" :rows="3" placeholder="请输入描述" /></el-form-item>
        <el-form-item label="难度">
          <el-select v-model="kpForm.difficulty" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="所属课程"><el-input-number v-model="kpForm.courseId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="kpForm.content" type="textarea" :rows="4" placeholder="请输入内容" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="kpDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="kpDialogLoading" @click="handleSaveKp" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 练习题库对话框 -->
    <el-dialog v-model="exerciseDialogVisible" :title="exerciseDialogTitle" width="560px" destroy-on-close>
      <el-form :model="exerciseForm" label-width="80px">
        <el-form-item label="题目"><el-input v-model="exerciseForm.question" type="textarea" :rows="3" placeholder="请输入题目" /></el-form-item>
        <el-form-item label="答案"><el-input v-model="exerciseForm.answer" type="textarea" :rows="3" placeholder="请输入答案" /></el-form-item>
        <el-form-item label="解析"><el-input v-model="exerciseForm.explanation" type="textarea" :rows="3" placeholder="请输入解析" /></el-form-item>
        <el-form-item label="难度">
          <el-select v-model="exerciseForm.difficulty" style="width: 100%">
            <el-option label="简单" value="easy" />
            <el-option label="中等" value="medium" />
            <el-option label="困难" value="hard" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型"><el-input v-model="exerciseForm.type" placeholder="如：choice, fill, essay" /></el-form-item>
        <el-form-item label="所属课程"><el-input-number v-model="exerciseForm.courseId" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="exerciseDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="exerciseDialogLoading" @click="handleSaveExercise" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 学习笔记对话框 -->
    <el-dialog v-model="noteDialogVisible" :title="noteDialogTitle" width="520px" destroy-on-close>
      <el-form :model="noteForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="noteForm.title" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="noteForm.content" type="textarea" :rows="5" placeholder="请输入内容" /></el-form-item>
        <el-form-item label="公开">
          <el-switch v-model="noteForm.isPublic" />
        </el-form-item>
        <el-form-item label="所属课程"><el-input-number v-model="noteForm.courseId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="知识点ID"><el-input-number v-model="noteForm.knowledgePointId" :min="0" style="width: 100%" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="noteDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="noteDialogLoading" @click="handleSaveNote" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 错题本对话框 -->
    <el-dialog v-model="wqDialogVisible" :title="wqDialogTitle" width="460px" destroy-on-close>
      <el-form :model="wqForm" label-width="80px">
        <el-form-item label="用户ID"><el-input-number v-model="wqForm.userId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="题目ID"><el-input-number v-model="wqForm.exerciseId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="已掌握">
          <el-switch v-model="wqForm.mastered" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wqDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="wqDialogLoading" @click="handleSaveWq" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 学习计划对话框 -->
    <el-dialog v-model="spDialogVisible" :title="spDialogTitle" width="520px" destroy-on-close>
      <el-form :model="spForm" label-width="80px">
        <el-form-item label="用户ID"><el-input-number v-model="spForm.userId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="目标"><el-input v-model="spForm.goal" placeholder="请输入学习目标" /></el-form-item>
        <el-form-item label="计划"><el-input v-model="spForm.schedule" type="textarea" :rows="3" placeholder="请输入学习计划" /></el-form-item>
        <el-form-item label="进度(%)"><el-input-number v-model="spForm.progress" :min="0" :max="100" style="width: 100%" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="spForm.status" style="width: 100%">
            <el-option label="进行中" value="active" />
            <el-option label="已完成" value="completed" />
            <el-option label="已取消" value="cancelled" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="spDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="spDialogLoading" @click="handleSaveSp" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 对话记录对话框 -->
    <el-dialog v-model="convDialogVisible" :title="convDialogTitle" width="460px" destroy-on-close>
      <el-form :model="convForm" label-width="80px">
        <el-form-item label="用户ID"><el-input-number v-model="convForm.userId" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="智能体类型"><el-input v-model="convForm.agentType" placeholder="如：tutor, helper" /></el-form-item>
        <el-form-item label="话题"><el-input v-model="convForm.topic" placeholder="请输入话题" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="convDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="convDialogLoading" @click="handleSaveConv" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 社区帖子对话框 -->
    <el-dialog v-model="postDialogVisible" :title="postDialogTitle" width="520px" destroy-on-close>
      <el-form :model="postForm" label-width="80px">
        <el-form-item label="标题"><el-input v-model="postForm.title" placeholder="请输入标题" /></el-form-item>
        <el-form-item label="内容"><el-input v-model="postForm.content" type="textarea" :rows="4" placeholder="请输入内容" /></el-form-item>
        <el-form-item label="类型"><el-input v-model="postForm.type" placeholder="如：question, discussion" /></el-form-item>
        <el-form-item label="标签"><el-input v-model="postForm.tags" placeholder="逗号分隔的标签" /></el-form-item>
        <el-form-item label="状态">
          <el-select v-model="postForm.status" style="width: 100%">
            <el-option label="已发布" value="published" />
            <el-option label="草稿" value="draft" />
            <el-option label="已隐藏" value="hidden" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="postDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="postDialogLoading" @click="handleSavePost" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>

    <!-- 成就管理对话框 -->
    <el-dialog v-model="achDialogVisible" :title="achDialogTitle" width="500px" destroy-on-close>
      <el-form :model="achForm" label-width="80px">
        <el-form-item label="编码"><el-input v-model="achForm.code" placeholder="唯一编码" /></el-form-item>
        <el-form-item label="名称"><el-input v-model="achForm.name" placeholder="成就名称" /></el-form-item>
        <el-form-item label="描述"><el-input v-model="achForm.description" type="textarea" :rows="3" placeholder="成就描述" /></el-form-item>
        <el-form-item label="分类"><el-input v-model="achForm.category" placeholder="分类" /></el-form-item>
        <el-form-item label="积分"><el-input-number v-model="achForm.points" :min="0" style="width: 100%" /></el-form-item>
        <el-form-item label="图标"><el-input v-model="achForm.icon" placeholder="图标标识" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="achDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="achDialogLoading" @click="handleSaveAch" class="gradient-btn">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Setting, Refresh, User, UserFilled, Document, TrendCharts,
  MagicStick, Search, Plus, Check, Download, Upload,
  Lock, Bell, Tools, WarningFilled, Warning,
  School, Edit, ChatDotRound, Posts, Trophy, Timer, Memo, Collection, ChatLineSquare
} from '@element-plus/icons-vue'
import { adminApi } from '@/api'

const activeTab = ref('overview')
const loading = ref(false)

// ==================== 数据概览 ====================
const overview = reactive({
  totalUsers: 0,
  activeUsers: 0,
  totalExercises: 0,
  avgScore: 0
})

const aiLoading = ref(false)
const aiResult = ref('')

async function fetchOverview() {
  try {
    const [dashboardRes, statsRes] = await Promise.all([
      adminApi.getDashboard().catch(() => null),
      adminApi.getLearningStats().catch(() => null)
    ])

    if (dashboardRes?.success) {
      const d = dashboardRes.data || {}
      overview.totalUsers = d.totalUsers ?? d.userCount ?? 0
      overview.activeUsers = d.activeUsers ?? d.activeCount ?? 0
      overview.totalExercises = d.totalExercises ?? d.exerciseCount ?? 0
      overview.avgScore = d.avgScore != null ? Math.round(d.avgScore) : 0
    }

    if (statsRes?.success && !dashboardRes?.success) {
      const s = statsRes.data || {}
      overview.totalUsers = s.totalUsers ?? 0
      overview.activeUsers = s.activeUsers ?? 0
      overview.totalExercises = s.totalExercises ?? 0
      overview.avgScore = s.avgScore != null ? Math.round(s.avgScore) : 0
    }
  } catch (err) {
    console.error('获取概览数据失败:', err)
  }
}

async function runAiAnalysis() {
  aiLoading.value = true
  aiResult.value = ''
  try {
    const res = await adminApi.aiAnalysis('请分析当前系统的整体运行状况，包括用户活跃度、学习效果、系统健康度等，并给出优化建议。')
    if (res?.success) {
      aiResult.value = res.data?.analysis || res.data?.content || res.data?.message || JSON.stringify(res.data)
    } else {
      ElMessage.error(res?.message || 'AI 分析失败')
    }
  } catch (err) {
    ElMessage.error('AI 分析请求失败')
    console.error(err)
  } finally {
    aiLoading.value = false
  }
}

function formatAiResult(text) {
  if (!text) return ''
  return text
    .replace(/\n/g, '<br>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
}

// ==================== 用户管理 ====================
const usersLoading = ref(false)
const users = ref([])
const userSearch = ref('')

const addUserVisible = ref(false)
const addUserLoading = ref(false)
const addUserFormRef = ref(null)
const addUserForm = reactive({
  username: '',
  email: '',
  password: '',
  role: 'user'
})
const addUserRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入有效的邮箱地址', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少 6 个字符', trigger: 'blur' }
  ],
  role: [{ required: true, message: '请选择角色', trigger: 'change' }]
}

const filteredUsers = computed(() => {
  if (!userSearch.value) return users.value
  const keyword = userSearch.value.toLowerCase()
  return users.value.filter(u =>
    (u.username || '').toLowerCase().includes(keyword) ||
    (u.email || '').toLowerCase().includes(keyword)
  )
})

async function fetchUsers() {
  usersLoading.value = true
  try {
    const res = await adminApi.getUsers()
    if (res?.success) {
      users.value = Array.isArray(res.data) ? res.data : (res.data?.list || res.data?.users || [])
    } else {
      users.value = []
    }
  } catch (err) {
    console.error('获取用户列表失败:', err)
    users.value = []
  } finally {
    usersLoading.value = false
  }
}

function showAddUserDialog() {
  addUserForm.username = ''
  addUserForm.email = ''
  addUserForm.password = ''
  addUserForm.role = 'user'
  addUserVisible.value = true
}

async function handleAddUser() {
  if (!addUserFormRef.value) return
  try {
    await addUserFormRef.value.validate()
  } catch {
    return
  }

  addUserLoading.value = true
  try {
    const res = await adminApi.createUser({
      username: addUserForm.username,
      email: addUserForm.email,
      password: addUserForm.password,
      role: addUserForm.role
    })
    if (res?.success) {
      ElMessage.success('用户创建成功')
      addUserVisible.value = false
      await fetchUsers()
    } else {
      ElMessage.error(res?.message || '创建失败')
    }
  } catch (err) {
    ElMessage.error('创建用户失败')
    console.error(err)
  } finally {
    addUserLoading.value = false
  }
}

async function handleToggleBan(user) {
  const action = user.banned ? '解封' : '封禁'
  try {
    await ElMessageBox.confirm(`确定要${action}用户 "${user.username}" 吗？`, '确认操作', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return
  }

  try {
    const res = await adminApi.toggleBan(user.id, !user.banned)
    if (res?.success) {
      ElMessage.success(`已${action}`)
      await fetchUsers()
    } else {
      ElMessage.error(res?.message || `${action}失败`)
    }
  } catch (err) {
    ElMessage.error(`${action}操作失败`)
    console.error(err)
  }
}

async function handleDeleteUser(user) {
  try {
    const res = await adminApi.deleteUser(user.id)
    if (res?.success) {
      ElMessage.success('用户已删除')
      await fetchUsers()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除用户失败')
    console.error(err)
  }
}

// ==================== 系统设置 ====================
const settingsLoading = ref(false)
const settingsSaving = ref(false)
const settingsForm = reactive({
  siteName: '',
  allowRegister: true,
  maintenance: false,
  maxUploadSize: 10,
  aiModel: 'default'
})

async function fetchSettings() {
  settingsLoading.value = true
  try {
    const res = await adminApi.getSettings()
    if (res?.success && res.data) {
      const d = res.data
      settingsForm.siteName = d.siteName ?? ''
      settingsForm.allowRegister = d.allowRegister ?? true
      settingsForm.maintenance = d.maintenance ?? false
      settingsForm.maxUploadSize = d.maxUploadSize ?? 10
      settingsForm.aiModel = d.aiModel ?? 'default'
    }
  } catch (err) {
    console.error('获取设置失败:', err)
  } finally {
    settingsLoading.value = false
  }
}

async function saveSettings() {
  settingsSaving.value = true
  try {
    const payload = {
      siteName: settingsForm.siteName,
      allowRegister: settingsForm.allowRegister,
      maintenance: settingsForm.maintenance,
      maxUploadSize: settingsForm.maxUploadSize,
      aiModel: settingsForm.aiModel
    }
    const res = await adminApi.updateSettings(payload)
    if (res?.success) {
      ElMessage.success('设置已保存')
    } else {
      ElMessage.error(res?.message || '保存失败')
    }
  } catch (err) {
    ElMessage.error('保存设置失败')
    console.error(err)
  } finally {
    settingsSaving.value = false
  }
}

// ==================== 备份与恢复 ====================
const backupLoading = ref(false)
const restoreLoading = ref(false)

async function handleBackup() {
  backupLoading.value = true
  try {
    const res = await adminApi.backup()
    if (res?.success) {
      ElMessage.success('备份任务已启动')
      // 如果后端返回备份文件数据，触发下载
      if (res.data) {
        const blob = new Blob(
          [typeof res.data === 'string' ? res.data : JSON.stringify(res.data)],
          { type: 'application/json' }
        )
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
      }
    } else {
      ElMessage.error(res?.message || '备份失败')
    }
  } catch (err) {
    ElMessage.error('备份操作失败')
    console.error(err)
  } finally {
    backupLoading.value = false
  }
}

async function handleRestore(file) {
  try {
    await ElMessageBox.confirm('恢复数据将覆盖当前系统数据，确定要继续吗？', '确认恢复', {
      confirmButtonText: '确定恢复',
      cancelButtonText: '取消',
      type: 'warning'
    })
  } catch {
    return false
  }

  restoreLoading.value = true
  try {
    const text = await file.text()
    let backupData
    try {
      backupData = JSON.parse(text)
    } catch {
      backupData = text
    }

    const res = await adminApi.restore(backupData)
    if (res?.success) {
      ElMessage.success('数据恢复成功')
    } else {
      ElMessage.error(res?.message || '恢复失败')
    }
  } catch (err) {
    ElMessage.error('数据恢复失败')
    console.error(err)
  } finally {
    restoreLoading.value = false
  }

  return false // 阻止 el-upload 默认上传行为
}

// ==================== 子管理员 ====================
const subAdminsLoading = ref(false)
const subAdmins = ref([])
const subAdminDialogVisible = ref(false)
const subAdminDialogLoading = ref(false)
const subAdminEditing = ref(false)
const subAdminForm = reactive({ id: null, username: '', email: '', password: '', role: 'admin', status: 'active' })

const subAdminDialogTitle = computed(() => subAdminEditing.value ? '编辑子管理员' : '新增子管理员')

async function fetchSubAdmins() {
  subAdminsLoading.value = true
  try {
    const res = await adminApi.getSubAdmins()
    if (res?.success) {
      subAdmins.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    } else {
      subAdmins.value = []
    }
  } catch (err) {
    console.error('获取子管理员列表失败:', err)
    subAdmins.value = []
  } finally {
    subAdminsLoading.value = false
  }
}

function showAddSubAdminDialog() {
  subAdminEditing.value = false
  subAdminForm.id = null
  subAdminForm.username = ''
  subAdminForm.email = ''
  subAdminForm.password = ''
  subAdminForm.role = 'admin'
  subAdminForm.status = 'active'
  subAdminDialogVisible.value = true
}

function showEditSubAdminDialog(row) {
  subAdminEditing.value = true
  subAdminForm.id = row.id
  subAdminForm.username = row.username || ''
  subAdminForm.email = row.email || ''
  subAdminForm.password = ''
  subAdminForm.role = row.role || 'admin'
  subAdminForm.status = row.status || 'active'
  subAdminDialogVisible.value = true
}

async function handleSaveSubAdmin() {
  subAdminDialogLoading.value = true
  try {
    let res
    if (subAdminEditing.value) {
      res = await adminApi.updateSubAdmin(subAdminForm.id, {
        role: subAdminForm.role,
        status: subAdminForm.status
      })
    } else {
      res = await adminApi.createSubAdmin({
        username: subAdminForm.username,
        email: subAdminForm.email,
        password: subAdminForm.password
      })
    }
    if (res?.success) {
      ElMessage.success(subAdminEditing.value ? '更新成功' : '创建成功')
      subAdminDialogVisible.value = false
      await fetchSubAdmins()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    subAdminDialogLoading.value = false
  }
}

async function handleDeleteSubAdmin(row) {
  try {
    const res = await adminApi.updateSubAdmin(row.id, { status: 'disabled' })
    if (res?.success) {
      ElMessage.success('已禁用该子管理员')
      await fetchSubAdmins()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  }
}

// ==================== 操作日志 ====================
const logsLoading = ref(false)
const logs = ref([])
const logPage = ref(1)
const logPageSize = ref(20)
const logTotal = ref(0)

async function fetchLogs() {
  logsLoading.value = true
  try {
    const res = await adminApi.getLogs(logPageSize.value, (logPage.value - 1) * logPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      logs.value = Array.isArray(data) ? data : (data.list || data.logs || [])
      logTotal.value = data.total ?? data.count ?? logs.value.length
    } else {
      logs.value = []
    }
  } catch (err) {
    console.error('获取操作日志失败:', err)
    logs.value = []
  } finally {
    logsLoading.value = false
  }
}

// ==================== 通知管理 ====================
const notificationsLoading = ref(false)
const notifications = ref([])
const notificationDialogVisible = ref(false)
const notificationDialogLoading = ref(false)
const notificationForm = reactive({ title: '', content: '', type: 'info' })

async function fetchNotifications() {
  notificationsLoading.value = true
  try {
    const res = await adminApi.getNotifications()
    if (res?.success) {
      notifications.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    } else {
      notifications.value = []
    }
  } catch (err) {
    console.error('获取通知列表失败:', err)
    notifications.value = []
  } finally {
    notificationsLoading.value = false
  }
}

function showAddNotificationDialog() {
  notificationForm.title = ''
  notificationForm.content = ''
  notificationForm.type = 'info'
  notificationDialogVisible.value = true
}

function getNotificationType(type) {
  const map = { info: '', warning: 'warning', error: 'danger', success: 'success' }
  return map[type] || 'info'
}

async function handleCreateNotification() {
  if (!notificationForm.title || !notificationForm.content) {
    ElMessage.warning('请填写标题和内容')
    return
  }
  notificationDialogLoading.value = true
  try {
    const res = await adminApi.createNotification({
      title: notificationForm.title,
      content: notificationForm.content,
      type: notificationForm.type
    })
    if (res?.success) {
      ElMessage.success('通知已发布')
      notificationDialogVisible.value = false
      await fetchNotifications()
    } else {
      ElMessage.error(res?.message || '发布失败')
    }
  } catch (err) {
    ElMessage.error('发布失败')
    console.error(err)
  } finally {
    notificationDialogLoading.value = false
  }
}

async function handleDeleteNotification(row) {
  try {
    const res = await adminApi.deleteNotification(row.id)
    if (res?.success) {
      ElMessage.success('通知已删除')
      await fetchNotifications()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 资源管理 ====================
const resourcesLoading = ref(false)
const resources = ref([])
const resourceDialogVisible = ref(false)
const resourceDialogLoading = ref(false)
const resourceEditing = ref(false)
const resourceForm = reactive({ id: null, name: '', type: 'document', description: '', url: '' })

const resourceDialogTitle = computed(() => resourceEditing.value ? '编辑资源' : '新增资源')

async function fetchResources() {
  resourcesLoading.value = true
  try {
    const res = await adminApi.getResources()
    if (res?.success) {
      resources.value = Array.isArray(res.data) ? res.data : (res.data?.list || [])
    } else {
      resources.value = []
    }
  } catch (err) {
    console.error('获取资源列表失败:', err)
    resources.value = []
  } finally {
    resourcesLoading.value = false
  }
}

function showAddResourceDialog() {
  resourceEditing.value = false
  resourceForm.id = null
  resourceForm.name = ''
  resourceForm.type = 'document'
  resourceForm.description = ''
  resourceForm.url = ''
  resourceDialogVisible.value = true
}

function showEditResourceDialog(row) {
  resourceEditing.value = true
  resourceForm.id = row.id
  resourceForm.name = row.name || ''
  resourceForm.type = row.type || 'document'
  resourceForm.description = row.description || ''
  resourceForm.url = row.url || ''
  resourceDialogVisible.value = true
}

async function handleSaveResource() {
  if (!resourceForm.name) {
    ElMessage.warning('请填写资源名称')
    return
  }
  resourceDialogLoading.value = true
  try {
    let res
    if (resourceEditing.value) {
      res = await adminApi.updateResource(resourceForm.id, {
        name: resourceForm.name,
        type: resourceForm.type,
        description: resourceForm.description,
        url: resourceForm.url
      })
    } else {
      res = await adminApi.createResource({
        name: resourceForm.name,
        type: resourceForm.type,
        description: resourceForm.description,
        url: resourceForm.url
      })
    }
    if (res?.success) {
      ElMessage.success(resourceEditing.value ? '更新成功' : '创建成功')
      resourceDialogVisible.value = false
      await fetchResources()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    resourceDialogLoading.value = false
  }
}

async function handleDeleteResource(row) {
  try {
    const res = await adminApi.deleteResource(row.id)
    if (res?.success) {
      ElMessage.success('资源已删除')
      await fetchResources()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 安全设置 ====================
const sensitiveWords = ref([])
const sensitiveWordLoading = ref(false)
const newSensitiveWord = ref('')

const ipBlacklist = ref([])
const ipBlacklistLoading = ref(false)
const newIP = reactive({ ip: '', reason: '' })

async function fetchSecurity() {
  try {
    const res = await adminApi.getSecurity()
    if (res?.success) {
      const data = res.data || {}
      sensitiveWords.value = data.sensitiveWords || data.sensitive_words || []
      ipBlacklist.value = data.ipBlacklist || data.ip_blacklist || []
    }
  } catch (err) {
    console.error('获取安全设置失败:', err)
  }
}

async function handleAddSensitiveWord() {
  const word = newSensitiveWord.value.trim()
  if (!word) {
    ElMessage.warning('请输入敏感词')
    return
  }
  sensitiveWordLoading.value = true
  try {
    const res = await adminApi.addSensitiveWord(word)
    if (res?.success) {
      ElMessage.success('敏感词已添加')
      newSensitiveWord.value = ''
      await fetchSecurity()
    } else {
      ElMessage.error(res?.message || '添加失败')
    }
  } catch (err) {
    ElMessage.error('添加失败')
    console.error(err)
  } finally {
    sensitiveWordLoading.value = false
  }
}

async function handleRemoveSensitiveWord(word) {
  try {
    const res = await adminApi.removeSensitiveWord(word)
    if (res?.success) {
      ElMessage.success('敏感词已移除')
      await fetchSecurity()
    } else {
      ElMessage.error(res?.message || '移除失败')
    }
  } catch (err) {
    ElMessage.error('移除失败')
    console.error(err)
  }
}

async function handleAddIPBlacklist() {
  if (!newIP.ip) {
    ElMessage.warning('请输入IP地址')
    return
  }
  ipBlacklistLoading.value = true
  try {
    const res = await adminApi.addIPBlacklist({ ip: newIP.ip, reason: newIP.reason })
    if (res?.success) {
      ElMessage.success('IP已加入黑名单')
      newIP.ip = ''
      newIP.reason = ''
      await fetchSecurity()
    } else {
      ElMessage.error(res?.message || '添加失败')
    }
  } catch (err) {
    ElMessage.error('添加失败')
    console.error(err)
  } finally {
    ipBlacklistLoading.value = false
  }
}

async function handleRemoveIPBlacklist(ip) {
  try {
    const res = await adminApi.removeIPBlacklist(ip)
    if (res?.success) {
      ElMessage.success('IP已从黑名单移除')
      await fetchSecurity()
    } else {
      ElMessage.error(res?.message || '移除失败')
    }
  } catch (err) {
    ElMessage.error('移除失败')
    console.error(err)
  }
}

// ==================== 维护模式 ====================
const maintenanceEnabled = ref(false)
const maintenanceLoading = ref(false)

async function fetchMaintenanceStatus() {
  try {
    const res = await adminApi.getSecurity()
    if (res?.success && res.data) {
      const data = res.data
      maintenanceEnabled.value = data.maintenance ?? data.maintenanceMode ?? false
    }
  } catch (err) {
    console.error('获取维护状态失败:', err)
  }
}

async function handleToggleMaintenance() {
  maintenanceLoading.value = true
  try {
    const res = await adminApi.toggleMaintenance(maintenanceEnabled.value)
    if (res?.success) {
      ElMessage.success(maintenanceEnabled.value ? '已开启维护模式' : '已关闭维护模式')
    } else {
      // revert on failure
      maintenanceEnabled.value = !maintenanceEnabled.value
      ElMessage.error(res?.message || '切换失败')
    }
  } catch (err) {
    maintenanceEnabled.value = !maintenanceEnabled.value
    ElMessage.error('切换失败')
    console.error(err)
  } finally {
    maintenanceLoading.value = false
  }
}

// ==================== 课程管理 ====================
const courseLoading = ref(false)
const courseList = ref([])
const courseSearch = ref('')
const coursePage = ref(1)
const coursePageSize = ref(20)
const courseTotal = ref(0)
const courseDialogVisible = ref(false)
const courseDialogLoading = ref(false)
const courseEditing = ref(false)
const courseForm = reactive({ id: null, title: '', description: '', category: '', status: 'draft', coverUrl: '' })

const courseDialogTitle = computed(() => courseEditing.value ? '编辑课程' : '新增课程')

async function fetchCourses() {
  courseLoading.value = true
  try {
    const res = await adminApi.getCourses(coursePage.value, coursePageSize.value)
    if (res?.success) {
      const data = res.data || {}
      courseList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      courseTotal.value = data.total ?? data.count ?? courseList.value.length
    } else {
      courseList.value = []
    }
  } catch (err) {
    console.error('获取课程列表失败:', err)
    courseList.value = []
  } finally {
    courseLoading.value = false
  }
}

function showAddCourseDialog() {
  courseEditing.value = false
  courseForm.id = null
  courseForm.title = ''
  courseForm.description = ''
  courseForm.category = ''
  courseForm.status = 'draft'
  courseForm.coverUrl = ''
  courseDialogVisible.value = true
}

function showEditCourseDialog(row) {
  courseEditing.value = true
  courseForm.id = row.id
  courseForm.title = row.title || ''
  courseForm.description = row.description || ''
  courseForm.category = row.category || ''
  courseForm.status = row.status || 'draft'
  courseForm.coverUrl = row.coverUrl || ''
  courseDialogVisible.value = true
}

async function handleSaveCourse() {
  courseDialogLoading.value = true
  try {
    let res
    if (courseEditing.value) {
      res = await adminApi.updateCourse(courseForm.id, courseForm)
    } else {
      res = await adminApi.createCourse(courseForm)
    }
    if (res?.success) {
      ElMessage.success(courseEditing.value ? '更新成功' : '创建成功')
      courseDialogVisible.value = false
      await fetchCourses()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    courseDialogLoading.value = false
  }
}

async function handleDeleteCourse(row) {
  try {
    const res = await adminApi.deleteCourse(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchCourses()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 知识点管理 ====================
const kpLoading = ref(false)
const kpList = ref([])
const kpSearch = ref('')
const kpPage = ref(1)
const kpPageSize = ref(20)
const kpTotal = ref(0)
const kpDialogVisible = ref(false)
const kpDialogLoading = ref(false)
const kpEditing = ref(false)
const kpForm = reactive({ id: null, title: '', description: '', difficulty: 'easy', courseId: 0, content: '' })

const kpDialogTitle = computed(() => kpEditing.value ? '编辑知识点' : '新增知识点')

async function fetchKnowledgePoints() {
  kpLoading.value = true
  try {
    const res = await adminApi.getKnowledgePoints(kpPage.value, kpPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      kpList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      kpTotal.value = data.total ?? data.count ?? kpList.value.length
    } else {
      kpList.value = []
    }
  } catch (err) {
    console.error('获取知识点列表失败:', err)
    kpList.value = []
  } finally {
    kpLoading.value = false
  }
}

function showAddKpDialog() {
  kpEditing.value = false
  kpForm.id = null
  kpForm.title = ''
  kpForm.description = ''
  kpForm.difficulty = 'easy'
  kpForm.courseId = 0
  kpForm.content = ''
  kpDialogVisible.value = true
}

function showEditKpDialog(row) {
  kpEditing.value = true
  kpForm.id = row.id
  kpForm.title = row.title || ''
  kpForm.description = row.description || ''
  kpForm.difficulty = row.difficulty || 'easy'
  kpForm.courseId = row.courseId || 0
  kpForm.content = row.content || ''
  kpDialogVisible.value = true
}

async function handleSaveKp() {
  kpDialogLoading.value = true
  try {
    let res
    if (kpEditing.value) {
      res = await adminApi.updateKnowledgePoint(kpForm.id, kpForm)
    } else {
      res = await adminApi.createKnowledgePoint(kpForm)
    }
    if (res?.success) {
      ElMessage.success(kpEditing.value ? '更新成功' : '创建成功')
      kpDialogVisible.value = false
      await fetchKnowledgePoints()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    kpDialogLoading.value = false
  }
}

async function handleDeleteKp(row) {
  try {
    const res = await adminApi.deleteKnowledgePoint(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchKnowledgePoints()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 练习题库 ====================
const exerciseLoading = ref(false)
const exerciseList = ref([])
const exerciseSearch = ref('')
const exercisePage = ref(1)
const exercisePageSize = ref(20)
const exerciseTotal = ref(0)
const exerciseDialogVisible = ref(false)
const exerciseDialogLoading = ref(false)
const exerciseEditing = ref(false)
const exerciseForm = reactive({ id: null, question: '', answer: '', explanation: '', difficulty: 'easy', type: 'choice', courseId: 0 })

const exerciseDialogTitle = computed(() => exerciseEditing.value ? '编辑题目' : '新增题目')

async function fetchExercises() {
  exerciseLoading.value = true
  try {
    const res = await adminApi.getExercises(exercisePage.value, exercisePageSize.value)
    if (res?.success) {
      const data = res.data || {}
      exerciseList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      exerciseTotal.value = data.total ?? data.count ?? exerciseList.value.length
    } else {
      exerciseList.value = []
    }
  } catch (err) {
    console.error('获取练习列表失败:', err)
    exerciseList.value = []
  } finally {
    exerciseLoading.value = false
  }
}

function showAddExerciseDialog() {
  exerciseEditing.value = false
  exerciseForm.id = null
  exerciseForm.question = ''
  exerciseForm.answer = ''
  exerciseForm.explanation = ''
  exerciseForm.difficulty = 'easy'
  exerciseForm.type = 'choice'
  exerciseForm.courseId = 0
  exerciseDialogVisible.value = true
}

function showEditExerciseDialog(row) {
  exerciseEditing.value = true
  exerciseForm.id = row.id
  exerciseForm.question = row.question || ''
  exerciseForm.answer = row.answer || ''
  exerciseForm.explanation = row.explanation || ''
  exerciseForm.difficulty = row.difficulty || 'easy'
  exerciseForm.type = row.type || 'choice'
  exerciseForm.courseId = row.courseId || 0
  exerciseDialogVisible.value = true
}

async function handleSaveExercise() {
  exerciseDialogLoading.value = true
  try {
    let res
    if (exerciseEditing.value) {
      res = await adminApi.updateExercise(exerciseForm.id, exerciseForm)
    } else {
      res = await adminApi.createExercise(exerciseForm)
    }
    if (res?.success) {
      ElMessage.success(exerciseEditing.value ? '更新成功' : '创建成功')
      exerciseDialogVisible.value = false
      await fetchExercises()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    exerciseDialogLoading.value = false
  }
}

async function handleDeleteExercise(row) {
  try {
    const res = await adminApi.deleteExercise(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchExercises()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 学习笔记 ====================
const noteLoading = ref(false)
const noteList = ref([])
const noteSearch = ref('')
const notePage = ref(1)
const notePageSize = ref(20)
const noteTotal = ref(0)
const noteDialogVisible = ref(false)
const noteDialogLoading = ref(false)
const noteEditing = ref(false)
const noteForm = reactive({ id: null, title: '', content: '', isPublic: false, courseId: 0, knowledgePointId: 0 })

const noteDialogTitle = computed(() => noteEditing.value ? '编辑笔记' : '新增笔记')

async function fetchNotes() {
  noteLoading.value = true
  try {
    const res = await adminApi.getAdminNotes(notePage.value, notePageSize.value)
    if (res?.success) {
      const data = res.data || {}
      noteList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      noteTotal.value = data.total ?? data.count ?? noteList.value.length
    } else {
      noteList.value = []
    }
  } catch (err) {
    console.error('获取笔记列表失败:', err)
    noteList.value = []
  } finally {
    noteLoading.value = false
  }
}

function showAddNoteDialog() {
  noteEditing.value = false
  noteForm.id = null
  noteForm.title = ''
  noteForm.content = ''
  noteForm.isPublic = false
  noteForm.courseId = 0
  noteForm.knowledgePointId = 0
  noteDialogVisible.value = true
}

function showEditNoteDialog(row) {
  noteEditing.value = true
  noteForm.id = row.id
  noteForm.title = row.title || ''
  noteForm.content = row.content || ''
  noteForm.isPublic = row.isPublic || false
  noteForm.courseId = row.courseId || 0
  noteForm.knowledgePointId = row.knowledgePointId || 0
  noteDialogVisible.value = true
}

async function handleSaveNote() {
  noteDialogLoading.value = true
  try {
    let res
    if (noteEditing.value) {
      res = await adminApi.updateNote(noteForm.id, noteForm)
    } else {
      res = await adminApi.createNote(noteForm)
    }
    if (res?.success) {
      ElMessage.success(noteEditing.value ? '更新成功' : '创建成功')
      noteDialogVisible.value = false
      await fetchNotes()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    noteDialogLoading.value = false
  }
}

async function handleDeleteNote(row) {
  try {
    const res = await adminApi.deleteNote(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchNotes()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 错题本 ====================
const wqLoading = ref(false)
const wqList = ref([])
const wqSearch = ref('')
const wqPage = ref(1)
const wqPageSize = ref(20)
const wqTotal = ref(0)
const wqDialogVisible = ref(false)
const wqDialogLoading = ref(false)
const wqEditing = ref(false)
const wqForm = reactive({ id: null, userId: 0, exerciseId: 0, mastered: false })

const wqDialogTitle = computed(() => wqEditing.value ? '编辑错题记录' : '新增错题记录')

async function fetchWrongQuestions() {
  wqLoading.value = true
  try {
    const res = await adminApi.getWrongQuestions(wqPage.value, wqPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      wqList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      wqTotal.value = data.total ?? data.count ?? wqList.value.length
    } else {
      wqList.value = []
    }
  } catch (err) {
    console.error('获取错题列表失败:', err)
    wqList.value = []
  } finally {
    wqLoading.value = false
  }
}

function showAddWqDialog() {
  wqEditing.value = false
  wqForm.id = null
  wqForm.userId = 0
  wqForm.exerciseId = 0
  wqForm.mastered = false
  wqDialogVisible.value = true
}

function showEditWqDialog(row) {
  wqEditing.value = true
  wqForm.id = row.id
  wqForm.userId = row.userId || 0
  wqForm.exerciseId = row.exerciseId || 0
  wqForm.mastered = row.mastered || false
  wqDialogVisible.value = true
}

async function handleSaveWq() {
  wqDialogLoading.value = true
  try {
    let res
    if (wqEditing.value) {
      res = await adminApi.updateWrongQuestion(wqForm.id, wqForm)
    } else {
      res = await adminApi.createWrongQuestion(wqForm)
    }
    if (res?.success) {
      ElMessage.success(wqEditing.value ? '更新成功' : '创建成功')
      wqDialogVisible.value = false
      await fetchWrongQuestions()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    wqDialogLoading.value = false
  }
}

async function handleDeleteWq(row) {
  try {
    const res = await adminApi.deleteWrongQuestion(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchWrongQuestions()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 学习计划 ====================
const spLoading = ref(false)
const spList = ref([])
const spSearch = ref('')
const spPage = ref(1)
const spPageSize = ref(20)
const spTotal = ref(0)
const spDialogVisible = ref(false)
const spDialogLoading = ref(false)
const spEditing = ref(false)
const spForm = reactive({ id: null, userId: 0, goal: '', schedule: '', progress: 0, status: 'active' })

const spDialogTitle = computed(() => spEditing.value ? '编辑学习计划' : '新增学习计划')

async function fetchStudyPlans() {
  spLoading.value = true
  try {
    const res = await adminApi.getStudyPlans(spPage.value, spPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      spList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      spTotal.value = data.total ?? data.count ?? spList.value.length
    } else {
      spList.value = []
    }
  } catch (err) {
    console.error('获取学习计划列表失败:', err)
    spList.value = []
  } finally {
    spLoading.value = false
  }
}

function showAddSpDialog() {
  spEditing.value = false
  spForm.id = null
  spForm.userId = 0
  spForm.goal = ''
  spForm.schedule = ''
  spForm.progress = 0
  spForm.status = 'active'
  spDialogVisible.value = true
}

function showEditSpDialog(row) {
  spEditing.value = true
  spForm.id = row.id
  spForm.userId = row.userId || 0
  spForm.goal = row.goal || ''
  spForm.schedule = row.schedule || ''
  spForm.progress = row.progress ?? 0
  spForm.status = row.status || 'active'
  spDialogVisible.value = true
}

async function handleSaveSp() {
  spDialogLoading.value = true
  try {
    let res
    if (spEditing.value) {
      res = await adminApi.updateStudyPlan(spForm.id, spForm)
    } else {
      res = await adminApi.createStudyPlan(spForm)
    }
    if (res?.success) {
      ElMessage.success(spEditing.value ? '更新成功' : '创建成功')
      spDialogVisible.value = false
      await fetchStudyPlans()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    spDialogLoading.value = false
  }
}

async function handleDeleteSp(row) {
  try {
    const res = await adminApi.deleteStudyPlan(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchStudyPlans()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 对话记录 ====================
const convLoading = ref(false)
const convList = ref([])
const convSearch = ref('')
const convPage = ref(1)
const convPageSize = ref(20)
const convTotal = ref(0)
const convDialogVisible = ref(false)
const convDialogLoading = ref(false)
const convEditing = ref(false)
const convForm = reactive({ id: null, userId: 0, agentType: '', topic: '' })

const convDialogTitle = computed(() => convEditing.value ? '编辑对话记录' : '新增对话记录')

async function fetchConversations() {
  convLoading.value = true
  try {
    const res = await adminApi.getConversations(convPage.value, convPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      convList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      convTotal.value = data.total ?? data.count ?? convList.value.length
    } else {
      convList.value = []
    }
  } catch (err) {
    console.error('获取对话列表失败:', err)
    convList.value = []
  } finally {
    convLoading.value = false
  }
}

function showAddConvDialog() {
  convEditing.value = false
  convForm.id = null
  convForm.userId = 0
  convForm.agentType = ''
  convForm.topic = ''
  convDialogVisible.value = true
}

function showEditConvDialog(row) {
  convEditing.value = true
  convForm.id = row.id
  convForm.userId = row.userId || 0
  convForm.agentType = row.agentType || ''
  convForm.topic = row.topic || ''
  convDialogVisible.value = true
}

async function handleSaveConv() {
  convDialogLoading.value = true
  try {
    let res
    if (convEditing.value) {
      res = await adminApi.updateConversation(convForm.id, convForm)
    } else {
      res = await adminApi.createConversation(convForm)
    }
    if (res?.success) {
      ElMessage.success(convEditing.value ? '更新成功' : '创建成功')
      convDialogVisible.value = false
      await fetchConversations()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    convDialogLoading.value = false
  }
}

async function handleDeleteConv(row) {
  try {
    const res = await adminApi.deleteConversation(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchConversations()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 社区帖子 ====================
const postLoading = ref(false)
const postList = ref([])
const postSearch = ref('')
const postPage = ref(1)
const postPageSize = ref(20)
const postTotal = ref(0)
const postDialogVisible = ref(false)
const postDialogLoading = ref(false)
const postEditing = ref(false)
const postForm = reactive({ id: null, title: '', content: '', type: '', tags: '', status: 'draft' })

const postDialogTitle = computed(() => postEditing.value ? '编辑帖子' : '新增帖子')

async function fetchCommunityPosts() {
  postLoading.value = true
  try {
    const res = await adminApi.getCommunityPosts(postPage.value, postPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      postList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      postTotal.value = data.total ?? data.count ?? postList.value.length
    } else {
      postList.value = []
    }
  } catch (err) {
    console.error('获取帖子列表失败:', err)
    postList.value = []
  } finally {
    postLoading.value = false
  }
}

function showAddPostDialog() {
  postEditing.value = false
  postForm.id = null
  postForm.title = ''
  postForm.content = ''
  postForm.type = ''
  postForm.tags = ''
  postForm.status = 'draft'
  postDialogVisible.value = true
}

function showEditPostDialog(row) {
  postEditing.value = true
  postForm.id = row.id
  postForm.title = row.title || ''
  postForm.content = row.content || ''
  postForm.type = row.type || ''
  postForm.tags = row.tags || ''
  postForm.status = row.status || 'draft'
  postDialogVisible.value = true
}

async function handleSavePost() {
  postDialogLoading.value = true
  try {
    let res
    if (postEditing.value) {
      res = await adminApi.updateCommunityPost(postForm.id, postForm)
    } else {
      res = await adminApi.createCommunityPost(postForm)
    }
    if (res?.success) {
      ElMessage.success(postEditing.value ? '更新成功' : '创建成功')
      postDialogVisible.value = false
      await fetchCommunityPosts()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    postDialogLoading.value = false
  }
}

async function handleDeletePost(row) {
  try {
    const res = await adminApi.deleteCommunityPost(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchCommunityPosts()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 成就管理 ====================
const achLoading = ref(false)
const achList = ref([])
const achSearch = ref('')
const achPage = ref(1)
const achPageSize = ref(20)
const achTotal = ref(0)
const achDialogVisible = ref(false)
const achDialogLoading = ref(false)
const achEditing = ref(false)
const achForm = reactive({ id: null, code: '', name: '', description: '', category: '', points: 0, icon: '' })

const achDialogTitle = computed(() => achEditing.value ? '编辑成就' : '新增成就')

async function fetchAchievements() {
  achLoading.value = true
  try {
    const res = await adminApi.getAchievements(achPage.value, achPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      achList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      achTotal.value = data.total ?? data.count ?? achList.value.length
    } else {
      achList.value = []
    }
  } catch (err) {
    console.error('获取成就列表失败:', err)
    achList.value = []
  } finally {
    achLoading.value = false
  }
}

function showAddAchDialog() {
  achEditing.value = false
  achForm.id = null
  achForm.code = ''
  achForm.name = ''
  achForm.description = ''
  achForm.category = ''
  achForm.points = 0
  achForm.icon = ''
  achDialogVisible.value = true
}

function showEditAchDialog(row) {
  achEditing.value = true
  achForm.id = row.id
  achForm.code = row.code || ''
  achForm.name = row.name || ''
  achForm.description = row.description || ''
  achForm.category = row.category || ''
  achForm.points = row.points ?? 0
  achForm.icon = row.icon || ''
  achDialogVisible.value = true
}

async function handleSaveAch() {
  achDialogLoading.value = true
  try {
    let res
    if (achEditing.value) {
      res = await adminApi.updateAchievement(achForm.id, achForm)
    } else {
      res = await adminApi.createAchievement(achForm)
    }
    if (res?.success) {
      ElMessage.success(achEditing.value ? '更新成功' : '创建成功')
      achDialogVisible.value = false
      await fetchAchievements()
    } else {
      ElMessage.error(res?.message || '操作失败')
    }
  } catch (err) {
    ElMessage.error('操作失败')
    console.error(err)
  } finally {
    achDialogLoading.value = false
  }
}

async function handleDeleteAch(row) {
  try {
    const res = await adminApi.deleteAchievement(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchAchievements()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 学习会话 (只读) ====================
const sessionLoading = ref(false)
const sessionList = ref([])
const sessionSearch = ref('')
const sessionPage = ref(1)
const sessionPageSize = ref(20)
const sessionTotal = ref(0)

async function fetchSessions() {
  sessionLoading.value = true
  try {
    const res = await adminApi.getSessions(sessionPage.value, sessionPageSize.value)
    if (res?.success) {
      const data = res.data || {}
      sessionList.value = Array.isArray(data) ? data : (data.list || data.records || [])
      sessionTotal.value = data.total ?? data.count ?? sessionList.value.length
    } else {
      sessionList.value = []
    }
  } catch (err) {
    console.error('获取学习会话列表失败:', err)
    sessionList.value = []
  } finally {
    sessionLoading.value = false
  }
}

async function handleDeleteSession(row) {
  try {
    const res = await adminApi.deleteSession(row.id)
    if (res?.success) {
      ElMessage.success('已删除')
      await fetchSessions()
    } else {
      ElMessage.error(res?.message || '删除失败')
    }
  } catch (err) {
    ElMessage.error('删除失败')
    console.error(err)
  }
}

// ==================== 工具函数 ====================
function formatDate(dateStr) {
  if (!dateStr) return '-'
  try {
    return new Date(dateStr).toLocaleString('zh-CN')
  } catch {
    return dateStr
  }
}

// ==================== 初始化 ====================
async function handleRefresh() {
  loading.value = true
  try {
    await Promise.all([
      fetchOverview(),
      fetchUsers(),
      fetchSettings(),
      fetchSubAdmins(),
      fetchLogs(),
      fetchNotifications(),
      fetchResources(),
      fetchSecurity(),
      fetchMaintenanceStatus(),
      fetchCourses(),
      fetchKnowledgePoints(),
      fetchExercises(),
      fetchNotes(),
      fetchWrongQuestions(),
      fetchStudyPlans(),
      fetchConversations(),
      fetchCommunityPosts(),
      fetchAchievements(),
      fetchSessions()
    ])
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  handleRefresh()
})
</script>

<style scoped>
.admin-dashboard {
  animation: fadeInUp 0.6s ease;
}

.glass-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

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
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
}

.admin-tabs {
  margin-top: 10px;
}

/* 概览卡片 */
.overview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.overview-card {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(248, 250, 252, 0.8) 100%);
  border-radius: 12px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.overview-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

.card-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.card-info {
  flex: 1;
}

.card-value {
  font-size: 32px;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.card-label {
  font-size: 14px;
  color: #718096;
  margin-top: 4px;
}

/* AI 分析 */
.analysis-card {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.analysis-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.ai-result {
  font-size: 14px;
  line-height: 1.8;
  color: #2d3748;
  padding: 12px 16px;
  background: rgba(102, 126, 234, 0.04);
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.ai-result :deep(code) {
  background: rgba(102, 126, 234, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
}

/* 用户管理 */
.users-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.gradient-table :deep(.el-table__header th) {
  background: linear-gradient(135deg, rgba(102, 126, 234, 0.05) 0%, rgba(118, 75, 162, 0.05) 100%);
  color: #2d3748;
  font-weight: 600;
}

.gradient-table :deep(.el-table__row:hover) {
  background: rgba(102, 126, 234, 0.05);
}

/* 系统设置 */
.settings-form {
  max-width: 600px;
}

.backup-section {
  margin-top: 8px;
}

.backup-section h3 {
  margin: 0 0 16px 0;
  font-size: 16px;
  color: #2d3748;
}

.backup-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

.backup-actions {
  display: flex;
  gap: 16px;
  align-items: center;
}

/* ==================== 新增 tab 通用样式 ==================== */
.tab-toolbar {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* ==================== 安全设置 ==================== */
.security-sections {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.security-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.security-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2d3748;
}

.security-input-row,
.ip-input-row {
  display: flex;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.word-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 16px;
}

.word-tag {
  margin: 0;
}

/* ==================== 维护模式 ==================== */
.maintenance-container {
  max-width: 600px;
  margin: 0 auto;
}

.maintenance-card {
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: 12px;
}

.maintenance-header {
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  font-size: 16px;
  color: #2d3748;
}

.maintenance-status {
  text-align: center;
  padding: 20px 0;
}

.maintenance-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.toggle-label {
  font-size: 15px;
  color: #2d3748;
  font-weight: 500;
}

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

/* 响应式 */
@media (max-width: 1200px) {
  .overview-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .overview-grid {
    grid-template-columns: 1fr;
  }

  .users-toolbar {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
