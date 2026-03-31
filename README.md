# 🚀 8972 导航 (8972 Nav)

> 一个极致简洁、响应式适配、支持云端同步的个人导航站。

## ✨ 核心特性

* **🖥️ PC 端深度优化** - 卡片高度固定 90px，支持 11px 字号的 3 行站点介绍，图标自适应高度并垂直居中。
* **📱 手机端精致布局** - 采用 1 行 2 列紧凑布局，卡片高度 60px，极致利用屏幕空间。
* **🛠️ 全功能管理后台** - 支持分类排序、站点增删改、系统标题及搜索引擎设置。
* **📱 后台移动端适配** - 管理菜单在手机端自动转为横向滑动 Tab，单手操作更顺滑。
* **🔐 访问保护** - 内置访问密钥验证（`VITE_OPEN_LOCK`），保护个人收藏的私密性。
* **☁️ 云端自动同步** - 配合 GitHub Token，后台修改实时同步至仓库。
* **🚀 一键推送脚本** - 内置 `push.js`，本地开发完后仅需一行命令即可全站同步到 GitHub。

## 🛠️ 技术栈

* **框架**: Vue 3 (Composition API)
* **状态管理**: Pinia
* **路由**: Vue Router
* **构建工具**: Vite
* **部署推荐**: GitHub Pages / EdgeOne / Vercel / Cloudflare Pages

---

## 🚀 快速开始

### 1. 环境配置
在项目根目录创建 `.env` 文件（注意：此文件包含敏感信息，默认已被 `.gitignore` 忽略，请勿推送到公开仓库）：

```env
# 管理员登录后台的密钥
VITE_ADMIN_PASSWORD=你的后台登录密码

# GitHub API 配置（用于后台管理系统直接读写数据）
VITE_GITHUB_TOKEN=你的GitHub_Fine_grained_Token
VITE_GITHUB_OWNER=wliuy
VITE_GITHUB_REPO=8972dh
VITE_GITHUB_BRANCH=main

# 访问锁定（留空则不启用，若填入内容，则首页访问前需验证此密码）
VITE_OPEN_LOCK=
```

### 2. 本地开发

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 3. 同步到 GitHub
当你修改了本地代码（如 UI 调整、脚本更新）后，在终端运行：

```bash
node push.js
```
此脚本会自动执行 `git init`（若无）、`add`、`commit` 及 `force push`，将代码强制同步到 GitHub `main` 分支。

---

## 📂 项目结构

```text
8972dh-main/
├── src/
│   ├── apis/            # 核心接口层
│   │   ├── useGitHubAPI.js    # 云端同步大脑 (处理 GitHub 读写)
│   │   └── useNavigation.js   # 前台数据驱动 (负责首页数据加载)
│   ├── components/      # 后台功能组件
│   │   └── admin/
│   │       ├── CategoryManager.vue # 分类管理 (Emoji选择、排序)
│   │       ├── SiteManager.vue     # 站点管理 (AI抓取、增删改)
│   │       └── SystemSettings.vue   # 系统设置 (标题、Logo、搜索)
│   ├── mock/
│   │   └── mock_data.js       # 核心数据库 (所有站点数据的归宿)
│   ├── stores/
│   │   └── counter.js         # 全局状态 (主题色、网站标题同步)
│   ├── views/           # 页面视图层
│   │   ├── NavHomeView.vue    # 前台首页 (用户看到的导航网格)
│   │   └── AdminView.vue      # 后台主框架 (管理员登录与Tab调度)
│   └── App.vue          # 根组件 (全站入口)
├── public/              # 静态资源 (存放 logo.png)
├── push.js              # 运维工具 (本地代码推送到 GitHub)
└── .env                 # 核心配置 (存放密码与 GitHub Token)
```

## 🎯 UI 规范说明

为了保持全站视觉的一致性，项目遵循以下设计规范：

* **PC 站点卡片**：高度 90px，内边距 8px 14px，文字垂直居中。
* **手机站点卡片**：高度 60px，双列排列，描述文字强制显示 1 行。
* **站点图标**：强制 1:1 正方形，高度 100% 自适应卡片高度。
* **熔断机制**：若图标加载失败，系统将自动回退显示 `/logo.png` 或占位背景，防止页面闪烁。

## 🤝 维护建议

* **在线维护**：登录 `/admin` 页面，完成修改后点击“保存到 GitHub”，云端会自动构建。
* **离线维护**：直接编辑 `src/mock/mock_data.js`，完成后运行 `node push.js` 同步。

> ⭐ 如果这个导航站对你有帮助，欢迎在使用过程中记录你的优化想法！