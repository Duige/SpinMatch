# 🚀 SpinMatch GitHub 部署版本

## 📋 版本说明

这是 SpinMatch 乒乓球社区平台的 **GitHub 友好版本**，已优化用于：
- ✅ GitHub 仓库上传
- ✅ Vercel 快速部署  
- ✅ 小文件大小（约 800KB）
- ✅ 34 个文件（而非原始的 220+ 文件）

## 🎬 视频文件处理

**原始问题：**
- 原版包含 180+ 个视频文件（每个 1-4MB）
- 总大小超过 GitHub 100MB 单文件限制
- 上传会失败

**解决方案：**
- 🗂 所有视频文件已移至 `assets-backup/` 目录（在原项目中）
- 🎯 只保留必要的代码和小资源文件
- 🎥 网站会在没有视频时显示友好提示

## 📂 文件结构

```
spinmatch-github/
├── frontend/
│   ├── pages/          # 6个HTML页面
│   ├── styles/         # 9个CSS文件
│   ├── scripts/        # 14个JS文件
│   └── assets/         # 只包含logo.svg
├── vercel.json         # Vercel配置
├── package.json        # 项目配置
├── README.md           # 项目说明
└── .gitignore          # Git忽略规则

总计：34 个文件，约 800KB
```

## 🔧 快速部署步骤

### 方法一：GitHub + Vercel Dashboard
1. 将 `spinmatch-github` 文件夹内容上传到 GitHub 新仓库
2. 访问 [vercel.com](https://vercel.com)
3. 点击 "Import Project" → 选择你的 GitHub 仓库
4. 保持默认设置，点击 "Deploy"

### 方法二：拖拽部署
1. 将整个 `spinmatch-github` 文件夹拖拽到 [vercel.com](https://vercel.com)
2. 等待自动部署完成

## 🎯 生产环境添加视频

部署成功后，如需添加视频：
1. 使用云存储服务（如阿里云 OSS、腾讯云 COS）
2. 修改 JS 中的视频路径指向云存储
3. 或通过 Vercel 的静态文件上传功能

## ⚡ 特点

- 🚀 **超快上传**：文件少，速度快
- 💾 **小体积**：不到 1MB 
- 🔒 **完整功能**：包含所有认证系统和页面
- 🎨 **统一UI**：所有页面风格一致
- 📱 **响应式**：支持手机和桌面

## 🆘 常见问题

**Q: 为什么没有视频背景？**
A: 为了通过 GitHub 限制，视频文件已移除。部署后可添加云存储视频。

**Q: 功能完整吗？**
A: 是的！所有页面、样式、脚本都包含，只是暂时没有视频文件。

**Q: 如何恢复视频？**
A: 从原项目的 `assets-backup/` 文件夹手动上传到云存储或 Vercel。

---

✨ **现在您可以轻松将此版本上传到 GitHub，然后部署到 Vercel！** 