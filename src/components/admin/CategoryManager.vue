<template>
  <div class="site-manager">
    <!-- 管理头部 -->
    <div class="manager-header">
      <h2>🌐 站点管理</h2>
      <div class="header-actions">
        <select v-model="selectedCategoryId" class="category-filter">
          <option value="">所有分类</option>
          <option v-for="category in localCategories" :key="category.id" :value="category.id">
            {{ category.icon }} {{ category.name }}
          </option>
        </select>
        <button @click="openAddModal" class="add-btn">➕ 添加站点</button>
        <button @click="handleSave" :disabled="loading" class="save-btn">
          {{ loading ? '保存中...' : '💾 保存到GitHub' }}
        </button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-bar">
      <div class="stat-item">
        <span class="stat-number">{{ totalSites }}</span>
        <span class="stat-label">总站点数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ localCategories.length }}</span>
        <span class="stat-label">分类数</span>
      </div>
      <div class="stat-item">
        <span class="stat-number">{{ filteredSites.length }}</span>
        <span class="stat-label">当前显示</span>
      </div>
      <div class="stat-info">
        💡 提示：v2.5.4 已优化智能抓取逻辑，只要名称或描述为空即可触发 AI 自动填充。
      </div>
    </div>

    <!-- 站点网格列表 -->
    <div class="sites-container">
      <draggable
        v-model="currentPageSites"
        v-bind="dragOptions"
        @end="onDragEnd"
        item-key="id"
        tag="div"
        class="admin-sites-grid"
      >
        <template #item="{ element: site }">
          <div class="admin-site-card-wrapper">
            <!-- 拖动手柄 -->
            <div class="admin-drag-handle" v-if="selectedCategoryId" title="拖拽排序">⋮⋮</div>
            
            <!-- 站点卡片主体 -->
            <div class="site-card">
              <div class="site-icon">
                <div v-if="isSvg(site.icon)" v-html="site.icon" class="svg-icon-wrapper"></div>
                <img v-else :src="ensureIcon(site.icon)" :alt="site.name" @error="handleImageError">
              </div>
              <div class="site-info">
                <h3 class="site-name">{{ site.name }}</h3>
                <p class="site-description">{{ site.description || '暂无描述' }}</p>
              </div>

              <!-- 操作遮罩层 -->
              <div class="card-admin-actions">
                <button @click.stop="editSite(site)" class="mini-btn edit" title="编辑">✏️</button>
                <button @click.stop="deleteSite(site)" class="mini-btn delete" title="删除">🗑️</button>
              </div>
            </div>
          </div>
        </template>
      </draggable>
    </div>

    <!-- 添加/编辑弹窗 -->
    <div v-if="showAddModal || editingSite" class="modal-overlay">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ editingSite ? '编辑站点' : '添加站点' }}</h3>
          <button @click="closeModal" class="close-btn" :disabled="isFetchingInfo">✕</button>
        </div>
        <form @submit.prevent="saveSite" class="site-form">
          <div class="form-row">
            <div class="form-group">
              <label>站点名称 *:</label>
              <input v-model="formData.name" required placeholder="请输入名称" class="form-input">
            </div>
            <div class="form-group">
              <label>所属分类 *:</label>
              <select v-model="formData.categoryId" required class="form-input">
                <option v-for="category in localCategories" :key="category.id" :value="category.id">
                  {{ category.icon }} {{ category.name }}
                </option>
              </select>
            </div>
          </div>
          <div class="form-group">
            <label>站点地址 *:</label>
            <div class="url-input-group">
              <input v-model="formData.url" type="url" required placeholder="https://" class="form-input">
            </div>
          </div>
          <div class="form-group">
            <label>站点描述:</label>
            <textarea v-model="formData.description" class="form-textarea" rows="2" placeholder="简短描述"></textarea>
          </div>
          <div class="form-group">
            <label>站点图标与信息自检:</label>
            <div class="icon-input-group">
              <input v-model="formData.icon" class="form-input" placeholder="图标地址或 SVG">
              <button 
                type="button" 
                @click="smartFetchInfo" 
                class="auto-icon-btn" 
                :disabled="isFetchingInfo || !formData.url"
              >
                <span v-if="isFetchingInfo">⏳ 抓取中...</span>
                <span v-else>🔍 智能获取</span>
              </button>
            </div>
            <div class="icon-preview-box">
               <div v-if="isSvg(formData.icon)" v-html="formData.icon" class="svg-preview"></div>
               <img v-else :src="ensureIcon(formData.icon)" alt="预览" @error="handleImageError">
            </div>
            <p class="hint-text">名称或描述留空时，将利用 AI 自动识别并拆分站点信息</p>
          </div>
          <div class="form-actions">
            <button type="button" @click="closeModal" class="cancel-btn" :disabled="isFetchingInfo">取消</button>
            <button type="submit" class="submit-btn" :disabled="isFetchingInfo">{{ editingSite ? '更新' : '添加' }}</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'

const props = defineProps({
  categories: { type: Array, default: () => [] },
  initialSelectedCategoryId: { type: String, default: '' },
  loading: { type: Boolean, default: false }
})

const emit = defineEmits(['update', 'save'])

// Gemini API 配置
const apiKey = "";
const isFetchingInfo = ref(false);

const localCategories = ref([])
const selectedCategoryId = ref('')
const showAddModal = ref(false)
const editingSite = ref(null)

const formData = ref({ name: '', url: '', description: '', icon: '', categoryId: '' })

watch(() => props.categories, (val) => { 
  localCategories.value = JSON.parse(JSON.stringify(val)) 
}, { immediate: true, deep: true })

watch(() => props.initialSelectedCategoryId, (val) => { 
  if (val) selectedCategoryId.value = val 
}, { immediate: true })

const syncToParent = () => emit('update', localCategories.value)

const isSvg = (icon) => icon && icon.trim().toLowerCase().startsWith('<svg')

const ensureIcon = (icon) => {
  if (!icon || icon.trim() === '') return '/logo.png'
  return icon
}

const allSites = computed(() => {
  const sites = []
  localCategories.value.forEach(cat => {
    if (cat.sites) cat.sites.forEach(s => sites.push({ ...s, categoryId: cat.id }))
  })
  return sites
})

const totalSites = computed(() => allSites.value.length)
const filteredSites = computed(() => selectedCategoryId.value ? allSites.value.filter(s => s.categoryId === selectedCategoryId.value) : allSites.value)

const currentPageSites = computed({
  get() { return filteredSites.value },
  set(newSites) {
    if (!selectedCategoryId.value) return
    const cat = localCategories.value.find(c => c.id === selectedCategoryId.value)
    if (cat) {
      cat.sites = newSites.map(s => ({ ...s }))
      syncToParent()
    }
  }
})

const dragOptions = computed(() => ({
  animation: 250,
  group: "sites",
  disabled: !selectedCategoryId.value,
  ghostClass: "sortable-ghost",
  handle: ".admin-drag-handle"
}))

const editSite = (site) => {
  editingSite.value = site
  formData.value = { ...site }
}

const deleteSite = (site) => {
  if (confirm(`确定删除 "${site.name}" 吗？`)) {
    const cat = localCategories.value.find(c => c.id === site.categoryId)
    if (cat) {
      cat.sites = cat.sites.filter(s => s.id !== site.id)
      syncToParent()
    }
  }
}

const onDragEnd = () => console.log('排序已同步')

/**
 * 🌟 核心功能：智能抓取与解析 (v2.5.4)
 */
const smartFetchInfo = async () => {
  if (!formData.value.url) return;
  isFetchingInfo.value = true;

  try {
    const urlObj = new URL(formData.value.url);
    
    // 1. 同步抓取高清 Favicon
    if (!formData.value.icon || formData.value.icon === '/logo.png') {
       formData.value.icon = `https://www.google.com/s2/favicons?sz=128&domain=${urlObj.hostname}`;
    }

    // 2. 如果名称或描述为空，调用 Gemini 解析网站元数据
    if (!formData.value.name.trim() || !formData.value.description.trim()) {
      const siteInfo = await callGeminiSiteParser(formData.value.url);
      if (siteInfo) {
        // 仅在字段为空时填充
        if (!formData.value.name.trim()) {
          formData.value.name = siteInfo.name || '';
        }
        if (!formData.value.description.trim()) {
          formData.value.description = siteInfo.description || '';
        }
      }
    }
  } catch (e) {
    console.error('智能抓取失败:', e);
  } finally {
    isFetchingInfo.value = false;
  }
}

/**
 * 🌟 清理可能存在的 Markdown 代码块标签
 */
function cleanJsonResponse(text) {
  if (!text) return "{}";
  // 移除 ```json 和 ``` 标签
  return text.replace(/```json\n?/, '').replace(/```\n?/, '').trim();
}

/**
 * 🌟 调用 Gemini 2.5 解析网站
 * 包含更严谨的拆分逻辑与容错
 */
async function callGeminiSiteParser(url) {
  const model = "gemini-2.5-flash-preview-09-2025";
  const systemPrompt = `你是一个专业的网站元数据提取专家。
  任务：提取该网站的正式名称和核心功能描述。
  
  关键规则：
  1. 如果网站标题包含 '|'、'-'、'—'、'_' 等分隔符，请将第一部分作为 name，其余部分作为 description。
  2. 例子：输入 "8972|资源站"，结果应为 name: "8972", description: "资源站"。
  3. 描述请尽量精炼（20字以内）。
  4. 必须只返回有效的 JSON 对象。`;
  
  const payload = {
    contents: [{ parts: [{ text: `请分析并提取此网站的信息：${url}` }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          description: { type: "STRING" }
        },
        required: ["name", "description"]
      }
    },
    tools: [{ google_search: {} }]
  };

  const fetchWithRetry = async (delay = 1000, retries = 5) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('API Request Failed');
      const result = await response.json();
      const rawText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      return JSON.parse(cleanJsonResponse(rawText));
    } catch (error) {
      if (retries > 0) {
        await new Promise(res => setTimeout(res, delay));
        return fetchWithRetry(delay * 2, retries - 1);
      }
      throw error;
    }
  };

  try {
    return await fetchWithRetry();
  } catch (err) {
    return null;
  }
}

const saveSite = () => {
  const targetCatId = formData.value.categoryId
  const targetCat = localCategories.value.find(c => c.id === targetCatId)
  if (!targetCat) return

  const isEditing = !!editingSite.value
  const siteId = isEditing ? editingSite.value.id : `site-${Date.now()}`

  const siteData = isEditing 
    ? { ...editingSite.value, ...formData.value, id: siteId }
    : { ...formData.value, id: siteId }
  
  delete siteData.categoryId

  if (isEditing) {
    let siteProcessed = false
    for (const cat of localCategories.value) {
      if (!cat.sites) continue
      const index = cat.sites.findIndex(s => s.id === siteId)
      if (index !== -1) {
        siteProcessed = true
        if (cat.id === targetCatId) {
          cat.sites.splice(index, 1, siteData)
        } else {
          cat.sites.splice(index, 1)
          if (!targetCat.sites) targetCat.sites = []
          targetCat.sites.push(siteData)
        }
        break 
      }
    }
    if (!siteProcessed) {
      if (!targetCat.sites) targetCat.sites = []
      targetCat.sites.push(siteData)
    }
  } else {
    if (!targetCat.sites) targetCat.sites = []
    targetCat.sites.push(siteData)
  }
  
  syncToParent()
  closeModal()
}

const openAddModal = () => {
  showAddModal.value = true
  formData.value = { name: '', url: '', description: '', icon: '', categoryId: selectedCategoryId.value || localCategories.value[0]?.id }
}

const closeModal = () => {
  if (isFetchingInfo.value) return;
  showAddModal.value = false
  editingSite.value = null
}

const handleImageError = (e) => { 
  if (e.target.dataset.tried === 'true') {
    e.target.style.display = 'none';
    e.target.parentNode.style.backgroundColor = '#f5f5f5';
    return;
  }
  e.target.dataset.tried = 'true';
  e.target.src = '/logo.png'; 
}

const handleSave = () => emit('save')
</script>

<style scoped>
.site-manager { padding: 10px 0; }
.manager-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.header-actions { display: flex; gap: 10px; }
.category-filter { padding: 8px; border: 1px solid #ddd; border-radius: 6px; font-size: 14px; background: #fff; }

.add-btn { background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.save-btn { background: #3498db; color: white; border: none; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-weight: 500; white-space: nowrap; flex-shrink: 0; }
.save-btn:disabled { opacity: 0.5; cursor: not-allowed; }

.stats-bar { display: flex; gap: 20px; margin-bottom: 20px; align-items: center; background: #fff; padding: 15px; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); flex-wrap: wrap; }
.stat-item { display: flex; flex-direction: column; align-items: center; }
.stat-number { font-size: 20px; font-weight: bold; color: #3498db; }
.stat-label { font-size: 12px; color: #999; }
.stat-info { font-size: 13px; color: #666; margin-left: auto; }

.admin-sites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 16px; }
.admin-site-card-wrapper { position: relative; }
.admin-drag-handle { position: absolute; left: -8px; top: 50%; transform: translateY(-50%); cursor: move; color: #ccc; font-size: 18px; z-index: 5; padding: 10px 4px; }

.site-card { display: flex; align-items: stretch; background: white; border-radius: 12px; border: 1px solid #eee; height: 90px; overflow: hidden; position: relative; transition: all 0.3s ease; }
.site-card:hover { box-shadow: 0 8px 20px rgba(0,0,0,0.1); border-color: #3498db; }

.site-icon { aspect-ratio: 1 / 1 !important; height: 100% !important; background: #fcfcfc; flex-shrink: 0; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
.site-icon img, .site-icon :deep(svg) { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block; }
.svg-icon-wrapper { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

.site-info { flex: 1; padding: 10px 14px; display: flex; flex-direction: column; justify-content: flex-start; min-width: 0; background: white; }
.site-name { font-size: 15px; font-weight: 600; margin: 2px 0; color: #333; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.site-description { font-size: 11px; color: #999; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }

.card-admin-actions { position: absolute; top: 0; right: 0; bottom: 0; left: 90px; background: rgba(255,255,255,0.9); display: flex; align-items: center; justify-content: center; gap: 15px; opacity: 0; transition: opacity 0.2s; backdrop-filter: blur(2px); }
.site-card:hover .card-admin-actions { opacity: 1; }

.mini-btn { border: none; width: 32px; height: 32px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: transform 0.2s; }
.mini-btn.edit { background: #f39c12; color: white; }
.mini-btn.delete { background: #e74c3c; color: white; }

.modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
.modal-content { background: white; padding: 25px; border-radius: 12px; width: 500px; max-width: 95%; }
.modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 1px solid #eee; padding-bottom: 15px; }
.close-btn { background: none; border: none; font-size: 20px; cursor: pointer; color: #94a3b8; }

.site-form { display: flex; flex-direction: column; gap: 15px; }
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; }
.form-group { display: flex; flex-direction: column; gap: 8px; }
.form-group label { font-size: 14px; font-weight: 500; color: #555; }
.form-input, .form-textarea { padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 14px; outline: none; }

.icon-input-group { display: flex; gap: 8px; }
.auto-icon-btn { background: #3498db; color: white; border: none; padding: 0 15px; border-radius: 8px; cursor: pointer; font-size: 13px; min-width: 100px; }
.auto-icon-btn:disabled { opacity: 0.6; cursor: not-allowed; }

.icon-preview-box { margin-top: 5px; width: 64px; height: 64px; border: 1px solid #eee; border-radius: 8px; overflow: hidden; display: flex; align-items: center; justify-content: center; background: #fafafa; position: relative; }
.icon-preview-box img, .svg-preview :deep(svg) { width: 100%; height: 100%; object-fit: contain; }

.hint-text { font-size: 11px; color: #999; margin: 4px 0; }

.form-actions { display: flex; justify-content: flex-end; gap: 12px; margin-top: 15px; }
.submit-btn { padding: 10px 25px; background: #27ae60; color: white; border: none; border-radius: 8px; cursor: pointer; }

@media (max-width: 768px) {
  .manager-header { flex-direction: column; align-items: flex-start; gap: 12px; }
  .header-actions { width: 100%; justify-content: flex-start; flex-wrap: wrap; }
  .category-filter { flex: 1; min-width: 120px; }
  .add-btn, .save-btn { flex: 1; text-align: center; }
  .stat-info { width: 100%; margin-top: 10px; text-align: left; }
  .admin-sites-grid { grid-template-columns: 1fr; gap: 12px; }
  .site-card { height: 80px; }
  .site-icon { height: 80px; width: 80px; }
  .card-admin-actions { position: relative; left: 0; width: 60px; height: 100%; opacity: 1; background: #f8fafc; border-left: 1px solid #eee; flex-direction: column; gap: 8px; padding: 0 5px; backdrop-filter: none; }
  .mini-btn { width: 30px; height: 30px; font-size: 14px; }
  .site-info { padding: 8px 12px; }
  .site-name { font-size: 14px; }
  .site-description { -webkit-line-clamp: 2; font-size: 10px; }
}
</style>