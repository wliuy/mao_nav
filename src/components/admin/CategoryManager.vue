<template>
  <div class="category-manager">
    <!-- 管理头部 -->
    <div class="manager-header">
      <h2>📁 分类管理</h2>
      <div class="header-actions">
        <button @click="openAddModal" class="add-btn">➕ 添加分类</button>
        <button @click="handleSave" :disabled="loading" class="save-btn">
          {{ loading ? '保存中...' : '💾 保存到GitHub' }}
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
       <div class="stat-info">
        💡 提示：v2.3.8 修复按钮文字显示问题，回归左图右字横向精致布局。
      </div>
    </div>

    <!-- 分类列表主体 -->
    <div class="category-list">
      <draggable 
        v-model="localCategories" 
        item-key="id" 
        handle=".drag-handle"
        animation="200"
        @end="syncToParent"
        class="category-draggable-area"
      >
        <template #item="{ element: category, index }">
          <div class="category-item-card">
            <!-- 左侧拖拽手柄 -->
            <div class="drag-handle" title="按住拖动排序">⋮⋮</div>

            <div class="category-main-content">
              <div class="category-info">
                <span class="category-icon-display">{{ category.icon }}</span>
                <div class="category-text">
                  <h3 class="category-name">{{ category.name }}</h3>
                  <p class="category-meta">{{ category.sites?.length || 0 }} 个站点 → 管理具体站点请前往“站点管理”</p>
                </div>
              </div>

              <!-- 🌟 预览区域：仅展示图标，增加熔断防止闪烁 -->
              <div class="category-sites-preview" v-if="category.sites && category.sites.length > 0">
                <div v-for="site in category.sites" :key="site.id" class="mini-site-tag">
                  <div class="mini-site-icon">
                    <!-- SVG 渲染 -->
                    <div v-if="isSvg(site.icon)" v-html="site.icon" class="svg-mini-wrapper"></div>
                    <!-- 图片渲染，带逻辑统一与熔断处理 -->
                    <img v-else :src="ensureIcon(site.icon)" :alt="site.name" @error="handleImageError">
                  </div>
                  <span class="mini-site-name">{{ site.name }}</span>
                </div>
              </div>
              <div v-else class="empty-category-hint">此分类下暂无站点</div>
            </div>

            <!-- 右侧操作栏 -->
            <div class="category-actions">
              <div class="rank-badge">排序指数: {{ index }}</div>
              <div class="action-buttons">
                <button @click="moveUp(index)" :disabled="index === 0" class="arrow-btn" title="上移">⬆️</button>
                <button @click="moveDown(index)" :disabled="index === localCategories.length - 1" class="arrow-btn" title="下移">⬇️</button>
                <button @click="editCategory(category)" class="edit-btn">✏️ 编辑</button>
                <button @click="deleteCategory(category)" class="delete-btn">🗑️ 删除</button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 添加/编辑分类弹窗 -->
    <div v-if="showAddModal || editingCategory" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingCategory ? '编辑分类' : '添加分类' }}</h3>
          <button @click="closeModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="saveCategory" class="category-form">
          <div class="form-group">
            <label>分类名称 *:</label>
            <input v-model="formData.name" required placeholder="例如：常用工具" class="form-input">
          </div>
          <div class="form-group">
            <label>分类图标 (Emoji) *:</label>
            <input v-model="formData.icon" required placeholder="粘贴一个 Emoji，如 🛠️" class="form-input">
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">{{ editingCategory ? '更新分类' : '立即添加' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update', 'save'])
const localCategories = ref([])
const showAddModal = ref(false)
const editingCategory = ref(null)
const formData = ref({ name: '', icon: '' })

// 同步父组件传入的分类数据
watch(() => props.categories, (val) => {
  localCategories.value = JSON.parse(JSON.stringify(val))
}, { immediate: true, deep: true })

const syncToParent = () => emit('update', localCategories.value)

// 🌟 辅助逻辑：识别 SVG 代码
const isSvg = (icon) => icon && icon.trim().toLowerCase().startsWith('<svg')

// 🌟 辅助逻辑：确保图标有值，如果是空值或空格则直接返回 logo.png，防止无效请求
const ensureIcon = (icon) => {
  if (!icon || icon.trim() === '') return '/logo.png'
  return icon
}

// 🌟 核心逻辑：防止预览图加载失败导致的闪烁死循环
const handleImageError = (e) => { 
  if (e.target.dataset.tried === 'true') {
    // 熔断：如果 logo.png 也加载失败，直接隐藏图片并显示占位底色
    e.target.style.display = 'none';
    e.target.parentNode.style.backgroundColor = '#f0f2f5';
    return;
  }
  e.target.dataset.tried = 'true';
  e.target.src = '/logo.png'; 
}

const editCategory = (category) => {
  editingCategory.value = category
  formData.value = { ...category }
}

const deleteCategory = (category) => {
  if (!confirm(`确定要彻底删除分类 "${category.name}" 吗？该分类下的所有站点也将一并移除！`)) return
  localCategories.value = localCategories.value.filter(c => c.id !== category.id)
  syncToParent()
}

const saveCategory = () => {
  if (editingCategory.value) {
    const target = localCategories.value.find(c => c.id === editingCategory.value.id)
    if (target) {
      target.name = formData.value.name
      target.icon = formData.value.icon
    }
  } else {
    localCategories.value.push({ 
      id: `cat-${Date.now()}`, 
      name: formData.value.name, 
      icon: formData.value.icon, 
      sites: [] 
    })
  }
  syncToParent()
  closeModal()
}

const openAddModal = () => { showAddModal.value = true; formData.value = { name: '', icon: '' }; }
const closeModal = () => { showAddModal.value = false; editingCategory.value = null; }

const moveUp = (idx) => { 
  if (idx > 0) { 
    const i = localCategories.value.splice(idx, 1)[0]; 
    localCategories.value.splice(idx - 1, 0, i); 
    syncToParent(); 
  } 
}
const moveDown = (idx) => { 
  if (idx < localCategories.value.length - 1) { 
    const i = localCategories.value.splice(idx, 1)[0]; 
    localCategories.value.splice(idx + 1, 0, i); 
    syncToParent(); 
  } 
}

const handleSave = () => emit('save')
</script>

<style scoped>
.category-manager { padding: 10px 0; }
.manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-actions { display: flex; gap: 10px; }

/* 🌟 解决顶部按钮文字不显示问题 */
.add-btn { 
  background: #27ae60; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; 
  font-weight: 500; transition: background 0.2s; white-space: nowrap; flex-shrink: 0;
}
.add-btn:hover { background: #219150; }
.save-btn { 
  background: #3498db; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; 
  font-weight: 500; white-space: nowrap; flex-shrink: 0;
}
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.stats-bar { margin-bottom: 20px; padding: 12px 16px; background: #f8fafc; border: 1px solid #edf2f7; border-radius: 10px; font-size: 13px; color: #64748b; }

.category-item-card { display: flex; align-items: flex-start; background: white; border-radius: 14px; border: 1px solid #e2e8f0; padding: 20px; margin-bottom: 16px; transition: box-shadow 0.2s; }
.category-item-card:hover { box-shadow: 0 4px 15px rgba(0,0,0,0.05); }

.drag-handle { cursor: grab; padding: 8px 16px 8px 0; color: #cbd5e1; font-size: 22px; user-select: none; }
.category-main-content { flex: 1; min-width: 0; }

.category-info { display: flex; align-items: center; margin-bottom: 15px; }
.category-icon-display { font-size: 28px; margin-right: 15px; }
.category-name { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
.category-meta { font-size: 13px; color: #94a3b8; margin-top: 4px; }

/* 🌟 横向卡片网格布局 */
.category-sites-preview { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); 
  gap: 10px; 
  padding: 15px; 
  background: #f8fafc; 
  border-radius: 10px; 
  border: 1px dashed #e2e8f0; 
}

/* 🌟 回归精致横向布局 (左图右字) */
.mini-site-tag { 
  display: flex; 
  align-items: center; 
  background: white; 
  border: 1px solid #edf0f2; 
  border-radius: 6px; 
  height: 42px; 
  overflow: hidden; 
  transition: all 0.2s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.02);
}

.mini-site-icon { 
  height: 100%; 
  aspect-ratio: 1 / 1; 
  flex-shrink: 0; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  background: #fcfcfc;
  border-right: 1px solid #f1f5f9;
}

.mini-site-icon img, .svg-mini-wrapper :deep(svg) { 
  width: 100% !important; 
  height: 100% !important; 
  object-fit: cover !important; 
  display: block;
}

.mini-site-name { 
  flex: 1; 
  padding: 0 10px; 
  font-size: 11.5px; 
  font-weight: 500; 
  color: #4a5568; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}

.empty-category-hint { font-size: 13px; color: #cbd5e1; padding: 15px; font-style: italic; }

.category-actions { margin-left: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.rank-badge { background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.action-buttons { display: flex; gap: 8px; }

.arrow-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; cursor: pointer; transition: background 0.2s; }
.arrow-btn:hover:not(:disabled) { background: #f8fafc; }
.arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.edit-btn { background: #fff; color: #f39c12; border: 1px solid #f39c12; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.edit-btn:hover { background: #fcf3e8; }
.delete-btn { background: #fff; color: #e74c3c; border: 1px solid #e74c3c; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.delete-btn:hover { background: #fdf2f2; }

/* 弹窗样式保持稳定 */
.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; padding: 30px; border-radius: 16px; width: 450px; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }

.category-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 10px; }
.form-group label { font-size: 14px; font-weight: 600; color: #475569; }
.form-input { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: #3498db; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
.cancel-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; cursor: pointer; color: #64748b; font-weight: 500; }
.submit-btn { padding: 10px 25px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

/* 🌟 手机端深度适配 */
@media (max-width: 768px) {
  .manager-header { flex-direction: row; flex-wrap: nowrap; gap: 5px; }
  .manager-header h2 { font-size: 18px; margin-bottom: 0; white-space: nowrap; }
  .header-actions { gap: 5px; }
  .add-btn, .save-btn { padding: 8px 12px; font-size: 13px; }

  .category-item-card { padding: 12px; flex-direction: column; position: relative; }
  .drag-handle { width: 100%; text-align: center; padding: 4px 0 8px; font-size: 18px; border-bottom: 1px solid #f1f5f9; margin-bottom: 12px; }
  
  .category-info { margin-bottom: 10px; }
  .category-icon-display { font-size: 24px; margin-right: 10px; }
  .category-name { font-size: 16px; }
  
  /* 手机端预览网格：2列排列，确保文字可见 */
  .category-sites-preview { 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    padding: 10px; 
    border: none; 
    background: #f5f7fa; 
  }
  .mini-site-tag { height: 38px; border-radius: 4px; box-shadow: none; border-color: #edf2f7; }
  .mini-site-name { font-size: 10px; padding: 0 6px; }
  
  /* 🌟 核心修复：手机端操作按钮改为 2x2 网格，确保汉字完整显示 */
  .category-actions { margin-left: 0; width: 100%; align-items: stretch; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
  .rank-badge { margin-bottom: 10px; text-align: center; font-size: 10px; }
  
  .action-buttons { 
    display: grid; 
    grid-template-columns: 1fr 1fr; /* 2列布局 */
    gap: 8px; 
    width: 100%; 
  }
  .action-buttons button { 
    padding: 10px 0; 
    font-size: 14px; 
    width: 100%; 
    text-align: center; 
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .arrow-btn { background: #f8fafc; }
  
  .modal-content { width: 92%; padding: 20px; }
}

/* 🌟 超窄屏幕适配 */
@media (max-width: 360px) {
  .category-sites-preview { grid-template-columns: 1fr; }
  .action-buttons button { font-size: 12px; }
}
</style>