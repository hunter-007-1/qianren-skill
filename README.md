# Qianren Skill Web (MVP)

一个面向普通用户的 AI Web App：通过历史聊天记录和补充资料，生成“人物数字画像”，并基于画像继续沉浸式对话。

> 产品灵感来源于 `ex-skill`，但本项目不是命令行工具，而是可部署上线的网页应用。

## MVP 功能闭环

- 资料输入：上传 `txt/md/json/csv` + 粘贴文本
- 后端解析：统一提取纯文本，提供解析预览
- AI 分析：输出结构化 Persona / Memories / Style / Emotion / Relationship
- 结果持久化：将分析结果写入数据库
- 角色对话：聊天时自动注入人物设定并保持风格一致

## 技术栈

- 前端：`Next.js 16` (App Router) + `React` + `Tailwind CSS`
- 后端：`Route Handlers`（`app/api/**`）
- 数据库：`SQLite`
- ORM：`Prisma`
- 模型接入：`OpenAI 兼容接口`（环境变量配置）
- 部署：支持 `Vercel` / 任意 Node 平台

## 项目结构

```txt
app/
  page.tsx                    # 首页
  characters/new/page.tsx     # 文件导入 / 创建角色页
  analysis/[id]/page.tsx      # AI 分析页
  chat/[id]/page.tsx          # 聊天页
  api/**                      # 上传、分析、聊天 API

components/
  panel.tsx
  status-badge.tsx
  character-summary.tsx

lib/
  ai-client.ts                # OpenAI 客户端
  db.ts                       # Prisma Client
  file-parser.ts              # 文件解析服务
  prompts.ts                  # 分析/聊天 Prompt
  types.ts                    # 分析结构校验（zod）
  services/
    analysis-service.ts       # 分析服务
    chat-service.ts           # 聊天服务

prisma/
  schema.prisma
  migrations/**
```

## 环境变量

复制 `.env.example` 到 `.env`：

```bash
cp .env.example .env
```

`.env.example` 内容：

```env
DATABASE_URL="file:./dev.db"
OPENAI_API_KEY="your_api_key_here"
OPENAI_BASE_URL="https://api.openai.com/v1"
OPENAI_MODEL="gpt-4o-mini"
```

## 本地运行

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run dev
```

打开：`http://localhost:3000`

## 使用流程

1. 进入 `/characters/new` 上传资料并填写补充信息
2. 上传后查看解析预览，点击“开始 AI 分析”
3. 在 `/analysis/[id]` 查看结构化画像
4. 进入 `/chat/[id]` 与角色持续对话

## Prompt 设计

- 分析 Prompt：强制输出 JSON，字段固定为 `persona/memories/speakingStyle/emotionPattern/relationshipPattern`
- 聊天 Prompt：优先依据分析结果，信息不足时保守表达，避免脱离资料幻想

## 隐私与安全

- API Key 仅从环境变量读取，代码中无硬编码
- 页面明确提示：请勿上传敏感隐私数据
- 资料仅用于当前角色分析与聊天
- 对空输入、解析失败、模型失败均有错误处理

## 部署说明

### 部署到 Vercel

1. 将仓库推送到 Git 平台
2. 在 Vercel 导入项目
3. 配置环境变量：`DATABASE_URL`、`OPENAI_API_KEY`、`OPENAI_BASE_URL`、`OPENAI_MODEL`
4. 构建命令：`npm run build`
5. 若改用 PostgreSQL，将 `prisma/schema.prisma` 的 `provider` 调整为 `postgresql` 并更新 `DATABASE_URL`

### 部署到 Node 平台

```bash
npm install
npm run build
npm run start
```

## 说明

- 当前为 MVP，优先保证闭环可用与可部署
- 暂未实现多角色协作、复杂权限、音视频、长期记忆优化等高级能力
