/**
 * 8972 导航站 - Git 自动化推送脚本
 * 用途：解决下载 ZIP 包后缺少 .git 文件夹，快速初始化并推送到 GitHub
 * 适配：已适配 ESM 模式 (Type: module)
 * 修复：确保每次运行都强制校准本地分支名，解决 main/main 不匹配问题
 * 使用方法：在终端运行 `node push.js`
 */

import { execSync } from 'child_process';
import fs from 'fs';

// --- 配置区域 ---
const CONFIG = {
  remoteUrl: 'https://github.com/wliuy/8972dh.git', // 你的仓库地址
  branch: 'main', // 目标分支名
  commitMsg: 'style: 同步后台站点管理UI并支持SVG图标'
};

function run(command) {
  try {
    console.log(`\x1b[36m正在执行: ${command}\x1b[0m`);
    // 执行命令并将结果实时输出到控制台
    execSync(command, { stdio: 'inherit' });
  } catch (error) {
    // 捕获异常，但不中断后续简单的逻辑
    return false;
  }
  return true;
}

async function start() {
  console.log('\x1b[33m🚀 开始执行自动化推送...\x1b[0m\n');

  // 1. 检查并初始化 Git
  if (!fs.existsSync('.git')) {
    console.log('检测到尚未初始化 Git，正在初始化...');
    run('git init');
  }

  // 🌟 核心修复：无论是否新建 .git，每次都强制校准本地分支名为 CONFIG.branch
  // 这样能确保本地的分支叫 main，从而匹配最后的 push main 命令
  run(`git branch -M ${CONFIG.branch}`);

  // 2. 尝试添加远程仓库地址
  // 如果已存在会提示 error，脚本会自动跳过继续执行
  run(`git remote add origin ${CONFIG.remoteUrl}`);

  // 3. 添加所有文件
  run('git add .');

  // 4. 提交
  console.log('正在创建提交记录...');
  try {
    execSync(`git commit -m "${CONFIG.commitMsg}"`, { stdio: 'inherit' });
  } catch (e) {
    console.log('\x1b[32m提示：没有检测到新改动，无需提交。\x1b[0m');
  }

  // 5. 推送
  console.log(`\n\x1b[35m正在推送到 GitHub (${CONFIG.branch})...\x1b[0m`);
  
  // 使用 -f (强制) 推送，覆盖云端仓库为当前本地最新代码
  const success = run(`git push -f origin ${CONFIG.branch}`);

  if (success) {
    console.log('\n\x1b[32m🎉 推送成功！EdgeOne 应该已经开始自动构建了。\x1b[0m');
  } else {
    console.log('\n\x1b[31m❌ 推送失败，请检查网络或 GitHub 登录状态。\x1b[0m');
    console.log('\x1b[33m提示：如果提示权限错误，请检查是否已在浏览器登录 GitHub 或配置了 Token。\x1b[0m');
  }
}

start();