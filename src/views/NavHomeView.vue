<template>
  <!-- 锁定界面 -->
  <div v-if="isLocked && !isUnlocked" class="lock-container">
    <div class="lock-box">
      <h1>🔐 访问验证</h1>
      <!-- 2026-03-30 v2.3.4 视觉校准：手机端卡片高度改为 60px，保持双列精致紧凑布局 -->
      <p class="lock-description">此导航站已启用访问保护</p>
      <form @submit.prevent="handleUnlock">
        <div class="form-group">
          <label for="unlock-password">请输入访问密钥:</label>
          <input
            id="unlock-password"
            type="password"
            v-model="unlockPassword"
            placeholder="请输入访问密钥"
            required
            class="form-input"
          />
        </div>
        <button type="submit" class="unlock-btn" :disabled="unlocking">
          {{ unlocking ? '验证中...' : '进入导航' }}
        </button>
      </form>
      <div v-if="unlockError" class="error-message">
        {{ unlockError }}
      </div>
    </div>
  </div>

  <!-- 正常导航界面 -->
  <div v-else class="nav-home">
    <!-- 左侧边栏 -->
    <aside class="sidebar">
      <!-- Logo区域 -->
      <div class="logo-section">
        <!-- 🌟 侧边栏 Logo 替换为自定义图片 -->
        <img src="/logo.png" class="logo" alt="Logo">
        <h1 class="site-title">{{ title || '8972导航' }}</h1>
      </div>

      <!-- 分类导航 -->
      <nav class="category-nav">
        <h2 class="nav-title">分类导航</h2>
        <ul class="category-list">
          <li
            v-for="category in categories"
            :key="category.id"
            class="category-item"
            @click="scrollToCategory(category.id)"
          >
            <span class="category-icon">{{ category.icon }}</span>
            <span class="category-name">{{ category.name }}</span>
          </li>
        </ul>
      </nav>

      <!-- 左侧边栏底部信息 -->
      <div class="sidebar-footer">
        <a
          href="https://89729981.xyz"
          target="_blank"
          rel="noopener noreferrer"
          class="github-link"
          title="点击访问资源库"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
          </svg>
          <span>站长的资源库</span>
        </a>
      </div>
    </aside>

    <!-- 右侧主内容区 -->
    <main class="main-content">
      <!-- 顶部搜索栏 -->
      <header class="search-header">
        <div class="search-container">
          <div class="search-engine-selector">
            <img :src="searchEngines[selectedEngine].icon" :alt="selectedEngine" class="engine-logo" />
            <select v-model="selectedEngine" class="engine-select">
              <option value="google">Google</option>
              <option value="baidu">Baidu</option>
              <option value="bing">Bing</option>
              <option value="duckduckgo">DuckDuckGo</option>
            </select>
          </div>
          <input
            type="text"
            v-model="searchQuery"
            :placeholder="searchEngines[selectedEngine].placeholder"
            class="search-input"
            @keyup.enter="handleSearch"
          />
        </div>

        <!-- 主题切换按钮 -->
        <button class="theme-toggle-btn" @click="themeStore.toggleTheme" :title="themeStore.isDarkMode ? '切换到日间模式' : '切换到夜间模式'">
          <svg v-if="!themeStore.isDarkMode" width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 18C8.68629 18 6 15.3137 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3137 15.3137 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16ZM11 1H13V4H11V1ZM11 20H13V23H11V20ZM3.51472 4.92893L4.92893 3.51472L7.05025 5.63604L5.63604 7.05025L3.51472 4.92893ZM16.9497 18.364L18.364 16.9497L20.4853 19.0711L19.0711 20.4853L16.9497 18.364ZM19.0711 3.51472L20.4853 4.92893L18.364 7.05025L16.9497 5.63604L19.0711 3.51472ZM5.63604 16.9497L7.05025 18.364L4.92893 20.4853L3.51472 19.0711L5.63604 16.9497ZM23 11V13H20V11H23ZM4 11V13H1V11H4Z"/>
          </svg>
          <svg v-else width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M10 7C10 10.866 13.134 14 17 14C18.9584 14 20.729 13.1957 21.9995 11.8995C22 11.933 22 11.9665 22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C12.0335 2 12.067 2 12.1005 2.00049C10.8043 3.27098 10 5.04157 10 7ZM4 12C4 16.4183 7.58172 20 12 20C15.0583 20 17.7158 18.2839 19.062 15.7621C18.3945 15.9187 17.7035 16 17 16C12.0294 16 8 11.9706 8 7C8 6.29648 8.08133 5.60547 8.2379 4.938C5.71611 6.28423 4 8.9417 4 12Z"/>
          </svg>
        </button>

        <!-- 移动端菜单按钮 -->
        <button class="mobile-menu-btn" @click="toggleMobileMenu">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 12H21M3 6H21M3 18H21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- 移动端分类菜单 -->
        <div class="mobile-menu" :class="{ active: showMobileMenu }">
          <div class="mobile-menu-header">
            <div class="header-left">
              <h3>分类导航</h3>
            </div>
            <button class="close-btn" @click="closeMobileMenu">×</button>
          </div>
          <ul class="mobile-category-list">
            <li
              v-for="category in categories"
              :key="category.id"
              class="mobile-category-item"
              @click="scrollToCategoryMobile(category.id)"
            >
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </li>
          </ul>
        </div>

        <!-- 移动端菜单遮罩 -->
        <div class="mobile-menu-overlay" :class="{ active: showMobileMenu }" @click="closeMobileMenu"></div>
      </header>

      <!-- 导航内容区 -->
      <div class="content-area">
        <!-- 加载状态 -->
        <div v-if="loading" class="loading">
          <div class="loading-spinner"></div>
          <p>加载中...</p>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="error">
          <p>{{ error }}</p>
          <button @click="fetchCategories" class="retry-btn">重试</button>
        </div>

        <!-- 分类内容 -->
        <div v-else class="categories-container">
          <section
            v-for="category in categories"
            :key="category.id"
            class="category-section"
            :id="`category-${category.id}`"
          >
            <h2 class="category-title">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.name }}</span>
            </h2>

            <div class="sites-grid">
              <a
                v-for="site in category.sites"
                :key="site.id"
                :href="site.url"
                target="_blank"
                rel="noopener noreferrer"
                class="site-card"
              >
                <div class="site-icon">
                  <div v-if="site.icon && site.icon.includes('<svg')" v-html="site.icon" class="svg-icon-wrapper"></div>
                  <img v-else :src="site.icon || '/logo.png'" :alt="site.name" @error="handleImageError" />
                </div>
                <div class="site-info">
                  <h3 class="site-name">{{ site.name }}</h3>
                  <p class="site-description">{{ site.description }}</p>
                </div>
              </a>
            </div>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useNavigation } from '@/apis/useNavigation.js'
import { useThemeStore } from '@/stores/counter.js'
import googleLogo from '@/assets/goolge.png'
import baiduLogo from '@/assets/baidu.png'
import bingLogo from '@/assets/bing.png'
import duckLogo from '@/assets/duck.png'

const { categories, title, defaultSearchEngine, loading, error, fetchCategories } = useNavigation()
const themeStore = useThemeStore()

const searchQuery = ref('')
const selectedEngine = ref('bing')
const showMobileMenu = ref(false)

const isLocked = ref(false)
const isUnlocked = ref(false)
const unlockPassword = ref('')
const unlocking = ref(false)
const unlockError = ref('')

const searchEngines = {
  google: { url: 'https://www.google.com/search?q=', icon: googleLogo, placeholder: 'Google (点logo切换搜索引擎' },
  baidu: { url: 'https://www.baidu.com/s?wd=', icon: baiduLogo, placeholder: '百度一下(点logo切换搜索引擎' },
  bing: { url: 'https://www.bing.com/search?q=', icon: bingLogo, placeholder: 'Bing (点logo切换搜索引擎)' },
  duckduckgo: { url: 'https://duckduckgo.com/?q=', icon: duckLogo, placeholder: 'DuckDuckGo (点logo切换搜索引擎)' }
}

const smoothScrollTo = (container, targetTop, duration = 600) => {
  const startTop = container.scrollTop
  const distance = targetTop - startTop
  let startTime = null
  const animateScroll = (currentTime) => {
    if (startTime === null) startTime = currentTime
    const timeElapsed = currentTime - startTime
    const progress = Math.min(timeElapsed / duration, 1)
    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2
    container.scrollTop = startTop + distance * ease
    if (progress < 1) requestAnimationFrame(animateScroll)
  }
  requestAnimationFrame(animateScroll)
}

const scrollToCategory = (categoryId) => {
  const element = document.getElementById(`category-${categoryId}`)
  const container = document.querySelector('.content-area')
  if (element && container) {
    const isMobile = window.innerWidth <= 768
    let targetTop = 0
    if (isMobile) {
      targetTop = element.offsetTop - 80
    } else {
      const searchHeader = document.querySelector('.search-header')
      targetTop = element.offsetTop - (searchHeader ? searchHeader.offsetHeight + 20 : 100)
    }
    smoothScrollTo(container, Math.max(0, targetTop), 600)
  }
}

const checkLockStatus = () => {
  const openLock = import.meta.env.VITE_OPEN_LOCK
  if (openLock && openLock.trim() !== '') {
    isLocked.value = true
    if (localStorage.getItem('nav_unlocked') === 'true') isUnlocked.value = true
  } else {
    isLocked.value = false; isUnlocked.value = true
  }
}

const handleUnlock = async () => {
  unlocking.value = true
  unlockError.value = ''
  try {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    if (!adminPassword) throw new Error('访问密钥未配置')
    if (unlockPassword.value === adminPassword) {
      isUnlocked.value = true
      localStorage.setItem('nav_unlocked', 'true')
      unlockPassword.value = ''
    } else {
      throw new Error('访问密钥错误，请重新输入')
    }
  } catch (error) {
    unlockError.value = error.message
  } finally {
    unlocking.value = false
  }
}

const handleSearch = () => {
  if (!searchQuery.value.trim()) return
  window.open(searchEngines[selectedEngine.value].url + encodeURIComponent(searchQuery.value), '_blank')
}

const handleImageError = (event) => {
  event.target.src = '/logo.png'
  event.target.onerror = null
}

const toggleMobileMenu = () => {
  showMobileMenu.value = !showMobileMenu.value
  document.body.style.overflow = showMobileMenu.value ? 'hidden' : ''
}

const closeMobileMenu = () => {
  showMobileMenu.value = false
  document.body.style.overflow = ''
}

const scrollToCategoryMobile = (categoryId) => {
  closeMobileMenu()
  setTimeout(() => scrollToCategory(categoryId), 200)
}

onMounted(async () => {
  checkLockStatus()
  await fetchCategories()
  selectedEngine.value = defaultSearchEngine.value
})

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<style scoped>
/* 基础与锁定界面 */
.lock-container { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; display: flex; align-items: center; justify-content: center; background: #2c3e50; padding: 20px; z-index: 9999; }
.lock-box { background: white; padding: 40px; border-radius: 16px; box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1); width: 100%; max-width: 400px; text-align: center; }
.lock-box h1 { color: #2d3748; margin-bottom: 8px; font-size: 28px; font-weight: 600; }
.lock-description { color: #718096; margin-bottom: 30px; font-size: 16px; }
.lock-box .form-group { margin-bottom: 20px; text-align: left; }
.lock-box .form-group label { display: block; margin-bottom: 8px; color: #4a5568; font-weight: 500; font-size: 14px; }
.lock-box .form-input { width: 100%; padding: 12px 16px; border: 2px solid #e2e8f0; border-radius: 8px; font-size: 16px; transition: all 0.3s ease; background: #fff; }
.lock-box .form-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1); }
.unlock-btn { width: 100%; padding: 12px 24px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; margin-top: 10px; }
.unlock-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3); }
.unlock-btn:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
.lock-box .error-message { margin-top: 15px; padding: 12px; background: #fed7d7; color: #c53030; border-radius: 8px; font-size: 14px; border: 1px solid #feb2b2; }

.nav-home { display: flex; min-height: 100vh; background-color: #f5f7fa; }

/* 侧边栏 */
.sidebar { width: 280px; background-color: #2c3e50; color: white; padding: 0; box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1); height: 100vh; overflow: hidden; flex-shrink: 0; }
.logo-section { display: flex; align-items: center; padding-left: 20px; padding-top: 13px; padding-bottom: 13px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); }
.logo { width: 55px; height: 55px; border-radius: 12px; margin-right: 15px; object-fit: cover; }
.site-title { font-size: 24px; font-weight: 600; margin: 0; color: white; }
.category-nav { padding: 20px 0; height: calc(100vh - 180px); overflow-y: auto; }
.nav-title { font-size: 16px; font-weight: 600; margin: 0 20px 15px; color: #bdc3c7; text-transform: uppercase; letter-spacing: 1px; }
.category-list { list-style: none; padding: 0; margin: 0; }
.category-item { display: flex; align-items: center; padding: 12px 20px; cursor: pointer; transition: all 0.3s ease; position: relative; }
.category-item:hover { background-color: rgba(255, 255, 255, 0.1); box-shadow: inset 4px 0 0 #3498db; }
.category-icon { font-size: 18px; margin-right: 12px; width: 20px; text-align: center; }
.category-name { font-size: 15px; font-weight: 500; }
.sidebar-footer { padding: 20px; border-top: 1px solid rgba(255, 255, 255, 0.1); margin-top: auto; }
.github-link { display: flex; align-items: center; color: #bdc3c7; text-decoration: none; padding: 8px 12px; border-radius: 6px; transition: all 0.3s ease; font-size: 14px; }
.github-link:hover { background: rgba(255, 255, 255, 0.1); color: white; transform: translateY(-1px); }
.github-link svg { margin-right: 8px; transition: transform 0.3s ease; }
.github-link:hover svg { transform: scale(1.1); }

/* 主内容与搜索 */
.main-content { flex: 1; display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
.search-header { background: white; padding: 20px; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05); position: sticky; top: 0; z-index: 100; display: flex; align-items: center; gap: 15px; }
.search-container { display: flex; max-width: 600px; margin: 0 auto; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1); flex: 1; }
.search-engine-selector { position: relative; display: flex; align-items: center; background: #f8f9fa; border-right: 1px solid #e9ecef; transition: background-color 0.2s ease; }
.search-engine-selector:hover { background: #e9ecef; }
.engine-logo { width: 24px; height: 24px; margin: 8px; object-fit: contain; pointer-events: none; border-radius: 4px; }
.engine-select { position: absolute; top: 0; left: 0; width: 100%; height: 100%; opacity: 0; cursor: pointer; border: none; outline: none; background: transparent; }
.search-input { flex: 1; border: none; padding: 12px 16px; font-size: 16px; outline: none; background: white; }
.search-input::placeholder { color: #95a5a6; }

.mobile-menu-btn { display: none; background: none; border: none; color: #2c3e50; cursor: pointer; padding: 8px; border-radius: 4px; transition: background-color 0.2s ease; }
.mobile-menu-btn:hover { background: #f8f9fa; }
.mobile-menu { position: fixed; top: 0; right: -100%; width: 240px; height: 100vh; background: white; box-shadow: -2px 0 10px rgba(0, 0, 0, 0.1); z-index: 1001; transition: right 0.3s ease; overflow-y: auto; overflow-x: hidden; display: flex; flex-direction: column; }
.mobile-menu.active { right: 0; }
.mobile-menu-header { display: flex; justify-content: space-between; align-items: center; padding: 20px; border-bottom: 1px solid #e9ecef; background: #2c3e50; color: white; flex-shrink: 0; }
.header-left { display: flex; align-items: center; gap: 12px; }
.mobile-menu-header h3 { margin: 0; font-size: 18px; font-weight: 600; }
.close-btn { background: none; border: none; color: white; font-size: 24px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 4px; }
.mobile-category-list { list-style: none; padding: 0; margin: 0; flex: 1; overflow-y: auto; padding-bottom: 160px; }
.mobile-category-item { display: flex; align-items: center; padding: 16px 20px; cursor: pointer; border-bottom: 1px solid #f8f9fa; }
.mobile-category-item .category-icon { font-size: 20px; margin-right: 12px; width: 24px; text-align: center; }
.mobile-category-item .category-name { font-size: 16px; font-weight: 500; color: #2c3e50; }
.mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.5); z-index: 999; opacity: 0; visibility: hidden; transition: opacity 0.3s ease, visibility 0.3s ease; }
.mobile-menu-overlay.active { opacity: 1; visibility: visible; }

/* 内容容器与网格 */
.content-area { flex: 1; padding: 30px; padding-bottom: 400px; overflow-y: auto; }
.loading, .error { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 200px; color: #7f8c8d; }
.loading-spinner { width: 40px; height: 40px; border: 4px solid #ecf0f1; border-top: 4px solid #3498db; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.retry-btn { margin-top: 10px; padding: 8px 16px; background: #3498db; color: white; border: none; border-radius: 4px; cursor: pointer; }

.categories-container { max-width: 1200px; margin: 0 auto; }
.category-section { margin-bottom: 50px; }
.category-title { font-size: 32px; font-weight: 600; margin-bottom: 25px; color: #2c3e50; display: flex; align-items: center; }
.category-title .category-icon { font-size: 32px; margin-right: 16px; }
.category-title .category-name { margin-left: 10px; font-size: 26px; }

/* 🌟 PC端卡片网格 */
.sites-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 20px; }

/* 🌟 PC端卡片高度：锁定 90px */
.site-card {
  display: flex !important;
  align-items: stretch !important;
  background: white !important;
  border-radius: 12px;
  padding: 0 !important;
  text-decoration: none;
  color: inherit;
  transition: all 0.3s ease;
  border: 1px solid #e9ecef;
  position: relative;
  overflow: hidden;
  height: 90px !important;
}
.site-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15); }

/* 图标容器：PC端 90px */
.site-icon {
  aspect-ratio: 1 / 1 !important;
  height: 90px !important;
  width: 90px !important;
  flex-shrink: 0;
  background: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}
.site-icon img, .site-icon :deep(svg) { width: 100% !important; height: 100% !important; object-fit: cover !important; display: block; }

.site-info {
  flex: 1;
  min-width: 0;
  padding: 8px 14px !important;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
}
.site-name { font-size: 15px !important; font-weight: 600; margin: 0 0 2px 0 !important; color: #2c3e50; line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

/* 站点介绍：标准 11px，支持 3 行显示 */
.site-description {
  font-size: 11px !important;
  color: #7f8c8d;
  margin: 0;
  line-height: 1.4;
  white-space: normal !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 3 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 🌟 手机端适配：一行两列，高度 60px */
@media (max-width: 768px) {
  .sidebar { display: none; }
  .main-content { margin-left: 0; height: 100vh; height: 100svh; overflow: hidden; }
  .search-header { padding: 12px 15px; position: fixed; top: 0; left: 0; right: 0; z-index: 500; background: white; gap: 10px; }
  .content-area { padding: 15px 12px; padding-top: 85px; padding-bottom: 200px; }
  .mobile-menu-btn { display: block; }

  /* 网格保持 2 列 */
  .sites-grid { grid-template-columns: 1fr 1fr; gap: 10px; }
  
  /* 核心修改：手机端卡片高度改为 60px */
  .site-card { height: 60px !important; border-radius: 8px; }
  
  /* 图标同步设为 60x60 */
  .site-card .site-icon { width: 60px !important; height: 60px !important; }
  
  /* 手机端信息区极致紧凑 */
  .site-card .site-info { padding: 4px 10px !important; }
  .site-card .site-name { font-size: 13px !important; margin-bottom: 1px !important; }
  
  /* 60px 高度下，介绍文字强制缩减为 1 行 */
  .site-card .site-description { font-size: 9.5px !important; -webkit-line-clamp: 1 !important; }
  
  .category-title { font-size: 20px; margin-bottom: 12px; }
}

.theme-toggle-btn { background: none; border: none; color: #2c3e50; cursor: pointer; padding: 8px; border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-right: 10px; }
.theme-toggle-btn:hover { background: #f8f9fa; transform: scale(1.1); }

.dark .nav-home, .dark .content-area { background-color: #1a1a1a; }
.dark .sidebar, .dark .search-header, .dark .mobile-menu { background-color: #1e293b; color: #e2e8f0; }
.dark .theme-toggle-btn, .dark .mobile-menu-btn { color: #e2e8f0; }
.dark .site-card { background: #374151 !important; border: 1px solid #4b5563; color: #e2e8f0; }
.dark .site-name { color: #e2e8f0; }
.dark .site-description { color: #9ca3af; }
.dark .category-title { color: #e2e8f0; }
.dark .lock-container { background: #0f172a; }
.dark .lock-box { background: #1e293b; color: #e2e8f0; }
.dark .lock-box .form-input { background: #374151; border: 2px solid #4b5563; color: #e2e8f0; }
</style>