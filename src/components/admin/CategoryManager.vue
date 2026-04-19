<template>
  <div class="category-manager">
    <!-- 管理头部 -->
    <div class="manager-header">
      <h2>💻 前台管理</h2>
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
        💡 提示：v2.5.10 已支持站点在分类间拖拽迁移，点击站点图标可直接编辑。
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
              <!-- 🌟 重新设计的头部行：信息与操作并排 -->
              <div class="category-header-row" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                <div class="category-info" style="display: flex; align-items: center;">
                  <span class="category-icon-display">{{ category.icon }}</span>
                  <div class="category-text">
                    <h3 class="category-name">{{ category.name }}</h3>
                    <p class="category-meta">{{ category.sites?.length || 0 }} 个站点 (拖拽可排序/跨分类移动)</p>
                  </div>
                </div>

                <div class="action-buttons">
                  <button @click="moveUp(index)" :disabled="index === 0" class="arrow-btn" title="上移">⬆️</button>
                  <button @click="moveDown(index)" :disabled="index === localCategories.length - 1" class="arrow-btn" title="下移">⬇️</button>
                  <button @click="openAddSiteModal(category)" class="add-site-btn">➕ 加站点</button>
                  <button @click="editCategory(category)" class="edit-btn">✏️ 编辑</button>
                  <button @click="deleteCategory(category)" class="delete-btn">🗑️ 删除</button>
                </div>
              </div>

              <!-- 🌟 预览区域：支持拖拽排序与编辑 -->
              <draggable 
                v-model="category.sites" 
                group="sites" 
                item-key="id"
                animation="200"
                @end="syncToParent"
                class="category-sites-preview"
                ghost-class="site-ghost"
              >
                <template #item="{ element: site }">
                  <div class="mini-site-tag interactive" @click.stop="openEditSiteModal(category, site)">
                    <div class="mini-site-icon">
                      <div v-if="isSvg(site.icon)" v-html="site.icon" class="svg-mini-wrapper"></div>
                      <img v-else :src="ensureIcon(site.icon)" :alt="site.name" @error="handleImageError">
                    </div>
                    <span class="mini-site-name">{{ site.name }}</span>
                    <button class="site-delete-badge" @click.stop="deleteSite(category, site.id)">×</button>
                  </div>
                </template>
              </draggable>
              <div v-if="!category.sites || category.sites.length === 0" class="empty-category-hint">此分类下暂无站点，可从其他分类拖入</div>
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
            <label>分类图标 * (输入或点击下方图标):</label>
            <div class="icon-input-wrapper">
              <input v-model="formData.icon" required placeholder="粘贴 Emoji 或点击下方" class="form-input icon-input">
              <span class="icon-preview-box">{{ formData.icon }}</span>
            </div>
            
            <!-- 🌟 预设 50 个 Emoji 选择面板 -->
            <div class="emoji-selector-panel">
              <span 
                v-for="emoji in commonEmojis" 
                :key="emoji" 
                class="emoji-option"
                @click="formData.icon = emoji"
                :class="{ active: formData.icon === emoji }"
              >
                {{ emoji }}
              </span>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">{{ editingCategory ? '更新分类' : '立即添加' }}</button>
          </div>
        </form>
      </div>
    </div>

    <!-- 🌟 站点编辑/添加弹窗 (UI 复用分类 Modal) -->
    <div v-if="showSiteModal" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ isAddingSite ? '添加站点' : '编辑站点' }}</h3>
          <button @click="closeSiteModal" class="close-btn">✕</button>
        </div>
        <form @submit.prevent="saveSite" class="category-form">
          <div class="form-group">
            <label>目标分类:</label>
            <div class="category-lock-display">{{ activeCategory?.name }}</div>
          </div>
          <div class="form-group">
            <label>站点名称 *:</label>
            <input v-model="siteFormData.name" required placeholder="名称" class="form-input">
          </div>
          <div class="form-group">
            <label>链接 URL *:</label>
            <input v-model="siteFormData.url" required placeholder="https://..." class="form-input">
          </div>
          <div class="form-group">
            <label>站点图标 (URL或SVG):</label>
            <textarea v-model="siteFormData.icon" placeholder="图标链接或 <svg>..." class="form-input text-area"></textarea>
          </div>
          <div class="form-group">
            <label>描述:</label>
            <input v-model="siteFormData.description" placeholder="简单介绍" class="form-input">
          </div>
          <div class="form-actions">
            <button type="button" @click="closeSiteModal" class="cancel-btn">取消</button>
            <button type="submit" class="submit-btn">确定保存</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, computed } from 'vue'
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

// 🌟 站点管理状态
const showSiteModal = ref(false)
const isAddingSite = ref(false)
const activeCategory = ref(null)
const editingSite = ref(null)
const siteFormData = ref({ name: '', url: '', description: '', icon: '' })

// 🌟 精选的 50 个常用 Emoji
const commonEmojis = [
  '⭐', '🔥', '🔗', '🛠️', '📁', '💻', '🎮', '🎬', '🎵', '📚', 
  '🎨', '🔍', '⚙️', '💼', '🏠', '🌍', '📱', '☁️', '💡', '🛍️', 
  '🍎', '🍵', '⚡', '🚀', '🎁', '📅', '💬', '🔐', '📸', '💰',
  '🤖', '🧪', '📡', '🧭', '🔨', '🛠️', '⚖️', '🔋', '📡', '📢',
  '📅', '📮', '🏷️', '📦', '🖊️', '🔭', '🧪', '🧬', '🛸', '🛰️'
]

// 同步父组件传入的分类数据
watch(() => props.categories, (val) => {
  localCategories.value = JSON.parse(JSON.stringify(val))
}, { immediate: true, deep: true })

const syncToParent = () => emit('update', localCategories.value)

// 辅助逻辑：识别 SVG 代码
const isSvg = (icon) => icon && icon.trim().toLowerCase().startsWith('<svg')

// 辅助逻辑：确保图标有值
const ensureIcon = (icon) => {
  if (!icon || icon.trim() === '') return '/logo.png'
  return icon
}

// 核心逻辑：防止预览图加载失败导致的闪烁死循环
const handleImageError = (e) => { 
  if (e.target.dataset.tried === 'true') {
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
  showAddModal.value = true
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

const openAddModal = () => { showAddModal.value = true; formData.value = { name: '', icon: '📁' }; }
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

// 🌟 站点操作逻辑
const openAddSiteModal = (category) => {
  activeCategory.value = category
  isAddingSite.value = true
  siteFormData.value = { name: '', url: '', description: '', icon: '' }
  showSiteModal.value = true
}

const openEditSiteModal = (category, site) => {
  activeCategory.value = category
  editingSite.value = site
  isAddingSite.value = false
  siteFormData.value = { ...site }
  showSiteModal.value = true
}

const closeSiteModal = () => { showSiteModal.value = false; editingSite.value = null; activeCategory.value = null; }

const saveSite = () => {
  const sites = activeCategory.value.sites
  if (isAddingSite.value) {
    sites.push({ id: `site-${Date.now()}`, ...siteFormData.value })
  } else {
    const idx = sites.findIndex(s => s.id === editingSite.value.id)
    if (idx !== -1) sites[idx] = { ...editingSite.value, ...siteFormData.value }
  }
  syncToParent(); closeSiteModal();
}

const deleteSite = (category, siteId) => {
  if (!confirm('确定移除该站点吗？')) return
  category.sites = category.sites.filter(s => s.id !== siteId)
  syncToParent()
}

const handleSave = () => emit('save')
</script>

<style scoped>
.category-manager { padding: 10px 0; }
.manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-actions { display: flex; gap: 10px; }

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

.category-info { display: flex; align-items: center; }
.category-icon-display { font-size: 28px; margin-right: 15px; }
.category-name { font-size: 18px; font-weight: 600; color: #1e293b; margin: 0; }
.category-meta { font-size: 13px; color: #94a3b8; margin-top: 4px; }

.category-sites-preview { 
  display: grid; 
  grid-template-columns: repeat(4, 1fr); 
  gap: 10px; 
  padding: 15px; 
  background: #f8fafc; 
  border-radius: 10px; 
  border: 1px dashed #e2e8f0; 
  min-height: 60px;
}

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
  position: relative;
}

.mini-site-tag.interactive { cursor: pointer; padding-right: 25px; }
.mini-site-tag.interactive:hover { border-color: #3498db; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }

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

.site-delete-badge {
  position: absolute; right: 4px; top: 50%; transform: translateY(-50%);
  background: #ff4d4f; color: white; border: none; border-radius: 50%;
  width: 16px; height: 16px; font-size: 12px; line-height: 1; cursor: pointer;
  opacity: 0; transition: opacity 0.2s;
}
.mini-site-tag:hover .site-delete-badge { opacity: 1; }

.site-ghost { opacity: 0.3; background: #e0e0e0 !important; }

.empty-category-hint { font-size: 13px; color: #cbd5e1; padding: 15px; font-style: italic; }

.category-actions { margin-left: 20px; display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
.rank-badge { background: #f1f5f9; color: #64748b; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 20px; }
.action-buttons { display: flex; gap: 8px; }

.arrow-btn { background: #fff; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 10px; cursor: pointer; transition: background 0.2s; }
.arrow-btn:hover:not(:disabled) { background: #f8fafc; }
.arrow-btn:disabled { opacity: 0.3; cursor: not-allowed; }

.add-site-btn { background: #fff; color: #27ae60; border: 1px solid #27ae60; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.add-site-btn:hover { background: #ebfbee; }

.edit-btn { background: #fff; color: #f39c12; border: 1px solid #f39c12; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.edit-btn:hover { background: #fcf3e8; }
.delete-btn { background: #fff; color: #e74c3c; border: 1px solid #e74c3c; padding: 6px 14px; border-radius: 6px; cursor: pointer; font-weight: 500; }
.delete-btn:hover { background: #fdf2f2; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; backdrop-filter: blur(4px); }
.modal-content { background: white; padding: 30px; border-radius: 16px; width: 480px; max-width: 95%; box-shadow: 0 10px 40px rgba(0,0,0,0.2); }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 25px; border-bottom: 1px solid #f1f5f9; padding-bottom: 15px; }
.close-btn { background: none; border: none; font-size: 24px; cursor: pointer; color: #94a3b8; }

.category-form { display: flex; flex-direction: column; gap: 20px; }
.form-group { display: flex; flex-direction: column; gap: 10px; }
.form-group label { font-size: 14px; font-weight: 600; color: #475569; }
.form-input { padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 10px; font-size: 15px; outline: none; transition: border-color 0.2s; }
.form-input:focus { border-color: #3498db; }
.text-area { min-height: 80px; font-family: monospace; font-size: 12px; }
.category-lock-display { padding: 12px; background: #f1f5f9; border-radius: 8px; color: #64748b; font-weight: 500; }

/* 🌟 Emoji 选择面板样式 */
.icon-input-wrapper { display: flex; gap: 10px; align-items: center; }
.icon-input { flex: 1; }
.icon-preview-box { width: 46px; height: 46px; background: #f8fafc; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-size: 24px; border: 1px solid #e2e8f0; flex-shrink: 0; }

.emoji-selector-panel { 
  display: grid; 
  grid-template-columns: repeat(auto-fill, minmax(36px, 1fr)); 
  gap: 8px; 
  padding: 15px; 
  background: #f8fafc; 
  border-radius: 12px; 
  border: 1px solid #edf2f7;
  max-height: 200px;
  overflow-y: auto;
  box-sizing: border-box;
}
.emoji-option { 
  cursor: pointer; font-size: 20px; text-align: center; padding: 6px; 
  border-radius: 8px; transition: all 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.emoji-option:hover { background: #e2e8f0; transform: scale(1.15); }
.emoji-option.active { background: #3498db; color: white; box-shadow: 0 2px 6px rgba(52, 152, 219, 0.3); }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 10px; padding-top: 20px; border-top: 1px solid #f1f5f9; }
.cancel-btn { padding: 10px 20px; border-radius: 8px; border: 1px solid #e2e8f0; background: #fff; color: #64748b; font-weight: 500; }
.submit-btn { padding: 10px 25px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600; }

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
  
  .category-sites-preview { 
    grid-template-columns: 1fr 1fr; 
    gap: 8px; 
    padding: 10px; 
    border: none; 
    background: #f5f7fa; 
  }
  .mini-site-tag { height: 38px; border-radius: 4px; box-shadow: none; border-color: #edf2f7; }
  .mini-site-name { font-size: 10px; padding: 0 6px; }

  .emoji-selector-panel { grid-template-columns: repeat(auto-fill, minmax(32px, 1fr)); padding: 10px; }
  
  .category-actions { margin-left: 0; width: 100%; align-items: stretch; margin-top: 12px; padding-top: 12px; border-top: 1px solid #f1f5f9; }
  .rank-badge { margin-bottom: 10px; text-align: center; font-size: 10px; }
  
  .action-buttons { 
    display: grid; 
    grid-template-columns: 1fr 1fr; 
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

@media (max-width: 360px) {
  .category-sites-preview { grid-template-columns: 1fr; }
  .action-buttons button { font-size: 12px; }
  .emoji-selector-panel { grid-template-columns: repeat(auto-fill, minmax(28px, 1fr)); }
}
</style>