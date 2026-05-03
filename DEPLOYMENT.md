# 部署指南

本项目是一个 Next.js + Prisma + OpenAI 的全栈应用，推荐使用 **Vercel + Supabase** 进行部署。

## 推荐部署方案

### Vercel + Supabase (PostgreSQL)

**优势：**
- Vercel 是 Next.js 官方平台，零配置部署
- Supabase 提供 PostgreSQL 免费版（500MB）
- 自动 HTTPS、CDN 加速
- 持续集成，git push 自动部署

---

## 部署步骤

### 1. 数据库准备

#### 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com) 注册账号
2. 点击 "New Project" 创建新项目
3. 填写项目信息：
   - **Name**: qianren-skill
   - **Database Password**: 设置强密码（务必保存）
   - **Region**: 选择离你最近的区域
4. 等待项目创建完成（约 2 分钟）

#### 获取数据库连接字符串

1. 进入 Supabase 项目 → **Settings** → **Database**
2. 找到 **Connection string** → 选择 **URI** 格式
3. 复制连接字符串，格式类似：
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.xxx.supabase.co:5432/postgres
   ```
4. 将 `[YOUR-PASSWORD]` 替换为你设置的数据库密码

---

### 2. OpenAI API Key 准备

1. 访问 [platform.openai.com](https://platform.openai.com)
2. 登录后进入 **API Keys** 页面
3. 创建新的 API Key（如果没有的话）
4. 复制保存这个 Key

---

### 3. 代码调整

#### 数据库迁移

项目已配置为使用 PostgreSQL（在 `prisma/schema.prisma` 中）。

如果你之前使用 SQLite，需要：

1. **导出 SQLite 数据（可选）**
   ```bash
   npx prisma db push --skip-generate
   ```

2. **生成 PostgreSQL 迁移**
   ```bash
   DATABASE_URL="你的PostgreSQL连接字符串" npx prisma migrate dev --name init
   ```

3. **生成 Prisma Client**
   ```bash
   npx prisma generate
   ```

---

### 4. 部署到 Vercel

#### 方法一：通过 Vercel 网站部署（推荐）

1. 访问 [vercel.com](https://vercel.com) 注册账号（推荐用 GitHub 账号登录）
2. 点击 **Add New** → **Project**
3. 导入你的 `qianren-skill` GitHub 仓库
4. Vercel 会自动检测 Next.js 项目并配置构建命令
5. 点击 **Deploy**

#### 方法二：通过 Vercel CLI 部署

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录
vercel login

# 部署
vercel
```

---

### 5. 配置环境变量

在 Vercel 项目设置中配置环境变量：

1. 进入 Vercel 项目 → **Settings** → **Environment Variables**
2. 添加以下变量（在 Development、Preview、Production 三个环境都配置）：

   | 变量名 | 值 | 说明 |
   |--------|-----|------|
   | `DATABASE_URL` | 你的 Supabase 连接字符串 | PostgreSQL 数据库连接 |
   | `OPENAI_API_KEY` | 你的 OpenAI API Key | OpenAI API 密钥 |
   | `OPENAI_BASE_URL` | `https://api.openai.com/v1` | OpenAI API 地址（默认） |
   | `OPENAI_MODEL` | `gpt-4o-mini` | 使用的模型（默认） |

3. 配置完成后，点击 **Redeploy** 重新部署

---

### 6. 运行数据库迁移

部署后，需要运行数据库迁移来创建数据库表：

#### 方法一：在 Vercel 控制台运行

1. 进入 Vercel 项目 → **Deployments**
2. 点击最新部署的 **...** 菜单
3. 选择 **Open in Terminal**
4. 运行命令：
   ```bash
   npx prisma migrate deploy
   ```

#### 方法二：在本地运行（连接到生产数据库）

```bash
DATABASE_URL="你的生产数据库连接字符串" npx prisma migrate deploy
```

---

### 7. 验证部署

1. 访问 Vercel 提供的域名（如 `https://your-project.vercel.app`）
2. 测试创建角色、上传文件等功能
3. 确认数据能正常保存到 Supabase

---

## 备选部署方案

### Railway

**一键部署 Next.js + PostgreSQL**

1. 访问 [railway.app](https://railway.app)
2. 点击 "Deploy from GitHub repo"
3. 选择你的仓库
4. Railway 会自动检测 Next.js 并配置 PostgreSQL
5. 配置环境变量后部署

### Render

**免费额度充足，支持 PostgreSQL**

1. 访问 [render.com](https://render.com)
2. 创建 **Web Service** 连接 GitHub 仓库
3. 创建 **PostgreSQL** 数据库
4. 配置环境变量后部署

### 自建服务器

**阿里云/腾讯云 + Docker**

1. 准备一台云服务器（推荐 2 核 4GB）
2. 安装 Docker 和 Docker Compose
3. 使用以下 `docker-compose.yml`：

```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/qianren
      - OPENAI_API_KEY=your_key
    depends_on:
      - db
  
  db:
    image: postgres:15
    environment:
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=qianren
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

4. 运行：`docker-compose up -d`

---

## 常见问题

### Q: 为什么不使用 SQLite？

A: SQLite 是文件型数据库，不适合生产环境：
- Vercel 等无服务器平台无法持久化文件
- 并发写入性能差
- 无法实现高可用

### Q: 数据迁移失败怎么办？

A: 检查以下几点：
1. `DATABASE_URL` 是否正确配置
2. 数据库是否可访问
3. Prisma schema 是否有语法错误

### Q: 如何备份数据？

A: Supabase 提供自动备份，也可以手动导出：
```bash
pg_dump "你的连接字符串" > backup.sql
```

### Q: 如何自定义域名？

A: 在 Vercel 项目设置中：
1. 进入 **Settings** → **Domains**
2. 添加你的域名
3. 按照提示配置 DNS 记录

---

## 成本估算

### Vercel + Supabase（推荐）

| 服务 | 免费额度 | 超出费用 |
|------|---------|---------|
| Vercel | 100GB 带宽/月 | $20/100GB |
| Supabase | 500MB 数据库 | $25/8GB |
| **总计** | **完全免费** | **按需付费** |

### Railway

- 免费额度：$5/月
- 超出后按使用量计费

### 自建服务器

- 阿里云/腾讯云：约 ¥100-300/月（2核4GB）
- 需要自己维护和备份

---

## 安全建议

1. **不要提交敏感信息**：确保 `.env` 文件在 `.gitignore` 中
2. **使用环境变量**：API Key 和数据库密码必须通过环境变量配置
3. **定期更新依赖**：运行 `npm audit` 检查安全漏洞
4. **启用 HTTPS**：Vercel 自动提供，自建服务器需配置 SSL 证书

---

## 监控和维护

### 日志查看

- Vercel：项目 → Deployments → 查看构建日志
- Supabase：项目 → Logs → 查看数据库日志

### 性能监控

- Vercel Analytics：自动监控页面性能
- Supabase Dashboard：监控数据库性能

---

## 总结

推荐使用 **Vercel + Supabase** 部署方案，这是最简单、最稳定的选择：

1. ✅ 零配置，自动部署
2. ✅ 免费额度充足
3. ✅ 自动 HTTPS 和 CDN
4. ✅ 数据库自动备份
5. ✅ 持续集成支持

按照上述步骤操作，你可以在 10 分钟内完成部署。
