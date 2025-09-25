# 扩展自动发布指南

## 概述
本文档说明如何使用 GitHub Actions 自动发布 VSCode Jieba 扩展到 VSCode Marketplace。

## 自动发布流程

### 触发条件
自动发布在以下情况下触发：
- **主要触发**：推送以 `v` 开头的标签到 `main` 分支（如 `v0.3.12`）
- **手动触发**：在 GitHub Actions 页面手动运行发布工作流

### 前置要求

#### 1. 配置 VSCode Marketplace 访问令牌
1. 访问 [Azure DevOps](https://dev.azure.com/) 并登录
2. 进入 Personal Access Tokens 页面
3. 创建新令牌，设置：
   - **名称**: `VSCode Marketplace`
   - **组织**: 选择 "All accessible organizations"
   - **有效期**: 建议 1 年
   - **权限**: 选择 "Marketplace" → "Publish"

4. 将生成的令牌添加到 GitHub Secrets：
   - 进入 GitHub 仓库 → Settings → Secrets and variables → Actions
   - 点击 "New repository secret"
   - **名称**: `VSCE_PAT`
   - **值**: 粘贴刚才生成的令牌

#### 2. 版本管理流程
发布新版本时，按以下步骤操作：

1. **更新版本号**
   ```bash
   # 编辑 package.json，更新 version 字段
   # 例如从 "0.3.11" 改为 "0.3.12"
   ```

2. **提交更改**
   ```bash
   git add package.json
   git commit -m "Bump version to 0.3.12"
   git push origin main
   ```

3. **创建并推送标签**
   ```bash
   # 创建附注标签（推荐）
   git tag -a v0.3.12 -m "Release version 0.3.12"
   
   # 推送标签到远程仓库
   git push origin v0.3.12
   ```
