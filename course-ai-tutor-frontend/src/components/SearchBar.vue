<template>
  <div class="search-bar">
    <el-input
      :model-value="keyword"
      placeholder="关键词搜索..."
      clearable
      class="search-input"
      @update:model-value="$emit('update:keyword', $event)"
      @keyup.enter="$emit('search')"
    >
      <template #prefix>
        <el-icon><Search /></el-icon>
      </template>
    </el-input>
    <el-date-picker
      :model-value="dateRange"
      type="daterange"
      range-separator="至"
      start-placeholder="开始日期"
      end-placeholder="结束日期"
      value-format="YYYY-MM-DD"
      class="date-picker"
      @update:model-value="$emit('update:dateRange', $event || [])"
    />
    <el-button type="primary" @click="$emit('search')">
      <el-icon><Search /></el-icon> 搜索
    </el-button>
    <el-button @click="$emit('reset')">
      <el-icon><RefreshLeft /></el-icon> 重置
    </el-button>
  </div>
</template>

<script setup>
import { Search, RefreshLeft } from '@element-plus/icons-vue'

defineProps(['keyword', 'dateRange'])
defineEmits(['update:keyword', 'update:dateRange', 'search', 'reset'])
</script>
