# TopicMap-Agent

一个面向科研选题分析的本地化网站原型。当前版本已经打通了：

- 研究主题搜索入口
- 项目创建与检索计划生成
- 运行流程页
- 文献目录页
- 知识图谱页
- 研究报告页
- 与 OpenClaw Gateway 的网页助手桥接

这一版的目标不是“真实检索已经做完”，而是先把完整产品流程跑通，让团队可以围绕同一套界面、接口和数据结构继续迭代。

## 1. 当前已完成的功能

### 1.1 网站主流程

用户可以通过前端页面完成以下流程：

1. 在首页输入研究主题
2. 自动创建项目并生成 Query Planner
3. 进入运行流程页查看任务阶段
4. 跳转到文献目录页查看论文池
5. 跳转到知识图谱页查看研究脉络
6. 跳转到研究报告页查看摘要、研究空白和引用
7. 在页面内调用助手，结合当前项目上下文进行问答

### 1.2 前端页面

前端基于 Next.js App Router，当前主要页面包括：

- `/`：首页搜索入口
- `/projects/new`：高级配置 / 新建研究任务
- `/projects/[id]/run`：运行流程页
- `/projects/[id]/papers`：文献目录页
- `/projects/[id]/graph`：知识图谱页
- `/projects/[id]/report`：研究报告页
- `/api/assistant/message`：网页到助手的桥接接口

### 1.3 后端接口

后端基于 FastAPI，当前已实现：

- `POST /api/projects`
- `GET /api/projects`
- `GET /api/projects/{project_id}`
- `PATCH /api/projects/{project_id}`
- `POST /api/projects/{project_id}/plan-query`
- `GET /api/projects/{project_id}/plan-query`
- `POST /api/projects/{project_id}/run`
- `GET /api/projects/{project_id}/runs/latest`
- `GET /api/projects/{project_id}/papers`
- `PATCH /api/projects/{project_id}/papers/{paper_id}`
- `GET /api/projects/{project_id}/graph`
- `GET /api/projects/{project_id}/report`
- `POST /api/projects/{project_id}/report/regenerate`
- `GET /api/projects/{project_id}/exports/markdown`
- `GET /api/projects/{project_id}/exports/bibtex`

### 1.4 当前数据特性

当前流程是 **mock-first**：

- 检索计划为启发式生成
- 运行进度为模拟推进
- 论文池为主题种子数据生成
- 图谱和报告为规则驱动生成

这意味着：

- 产品演示和页面联调已经可用
- 后续还需要接入真实检索、去重、抽取、图谱构建和报告生成

## 2. 项目目录结构

```text
TopicMap_Agent/
  apps/
    web/                  # Next.js 前端
  services/
    api/                  # FastAPI 后端
  packages/
    core/                 # 共享 Python 数据模型
  docs/                   # PRD / 方案 / 架构文档
  data/
    projects/             # 本地 JSON 数据存储（默认不提交）
  html_SiQi/              # 前端伙伴提供的静态原型稿
```

## 3. 本地部署与体验

建议环境：

- Windows 10/11
- PowerShell
- Python 3.11+
- Node.js 20+
- npm 10+

### 3.1 启动后端

第一次启动时执行：

```powershell
cd D:\GitProject\TopicMap_Agent\services\api
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000
```

说明：

- 后端里的 `bootstrap.py` 会自动把 `packages/core` 加入 Python 路径
- 所以当前不需要单独手工安装 `packages/core`

后端健康检查：

```powershell
Invoke-RestMethod http://127.0.0.1:8000/healthz
```

### 3.2 启动前端

第一次启动时执行：

```powershell
cd D:\GitProject\TopicMap_Agent\apps\web
Copy-Item .env.local.example .env.local
npm install
npm run dev
```

前端默认访问：

- 前端网站：`http://127.0.0.1:3000`
- 后端接口：`http://127.0.0.1:8000`

### 3.3 打开网站体验

浏览器打开：

```text
http://127.0.0.1:3000
```

建议体验路径：

1. 首页输入研究主题
2. 进入运行流程页
3. 查看文献目录页
4. 查看知识图谱页
5. 查看研究报告页
6. 在图谱页 / 报告页调用助手

## 4. OpenClaw Gateway 接入

本项目支持三种助手模式：

- `mock`
- `proxy`
- `gateway`

当前最推荐本地开发时使用 `gateway`。

### 4.1 配置方式

在 `apps/web/.env.local` 中配置：

```env
NEXT_PUBLIC_RESEARCH_API_BASE_URL=http://127.0.0.1:8000
OPENCLAW_BRIDGE_MODE=gateway
OPENCLAW_GATEWAY_WS_URL=ws://127.0.0.1:18789
OPENCLAW_GATEWAY_TOKEN=your_gateway_token
OPENCLAW_GATEWAY_AGENT_ID=main
OPENCLAW_GATEWAY_SESSION_KEY=
OPENCLAW_GATEWAY_SESSION_KEY_PREFIX=research-lineage
OPENCLAW_GATEWAY_TIMEOUT_SECONDS=120
OPENCLAW_GATEWAY_SCOPES=operator.read,operator.write,operator.admin
OPENCLAW_GATEWAY_THINKING=
OPENCLAW_GATEWAY_MODEL=
```

### 4.2 Gateway 健康检查

```powershell
Invoke-RestMethod http://127.0.0.1:18789/healthz
```

正常返回类似：

```json
{"ok":true,"status":"live"}
```

### 4.3 注意事项

- `.env.local` 只用于本机开发
- 不要把真实 token、API key、identity 文件提交到 GitHub
- 如果只想跑网站主流程、不想接助手，可以把 `OPENCLAW_BRIDGE_MODE` 改为 `mock`

## 5. GitHub 协作说明

当前目录 `D:\GitProject\TopicMap_Agent` 还不是 Git 仓库。  
如果要把这份项目通过 Git 更新到：

[1liusho/TopicMap-Agent](https://github.com/1liusho/TopicMap-Agent)

请在 PowerShell 中执行：

### 5.1 初始化本地 Git 仓库

```powershell
cd D:\GitProject\TopicMap_Agent
git init
git branch -M main
git remote add origin https://github.com/1liusho/TopicMap-Agent.git
```

### 5.2 检查远程仓库

```powershell
git remote -v
```

正常应看到：

```text
origin  https://github.com/1liusho/TopicMap-Agent.git (fetch)
origin  https://github.com/1liusho/TopicMap-Agent.git (push)
```

### 5.3 提交本地改动

```powershell
git add .
git commit -m "feat: rebuild research workflow website and docs"
```

### 5.4 推送到 GitHub

如果远程仓库是空仓库，直接执行：

```powershell
git push -u origin main
```

如果远程仓库已经有你之前网页上传的内容，建议先执行：

```powershell
git fetch origin
git pull origin main --allow-unrelated-histories
```

如果出现冲突，先解决冲突，再执行：

```powershell
git push -u origin main
```

### 5.5 团队协作建议

建议使用下面的分支策略：

- `main`：稳定版本
- `dev`：日常集成分支
- `feature/...`：每个功能一个分支

推荐流程：

1. 从 `dev` 拉新分支
2. 本地开发
3. 提交并推送
4. 发 Pull Request
5. Code Review 后合并

## 6. 需要特别避免提交到仓库的文件

这些文件或目录不要上传到 GitHub：

- `.env`
- `.env.local`
- `.venv/`
- `node_modules/`
- `.next/`
- `__pycache__/`
- `*.log`
- 本机 OpenClaw token / identity / state
- 本地缓存数据

当前 `.gitignore` 已经排除了大部分本地环境文件和运行产物。

## 7. 下一步建议

从产品迭代角度，建议接下来做这几件事：

1. 把 `services/api` 完整迁到这份新目录自己的运行环境中
2. 用真实检索替换 mock 论文池
3. 给知识图谱页加入更真实的节点布局和关系过滤
4. 把研究报告和图谱、论文池做更强联动
5. 补充用户登录、项目分享、多人协作等能力

---

如果你是第一次接手这个项目，最简单的本地启动顺序就是：

1. 启动 FastAPI 后端
2. 启动 Next.js 前端
3. 可选：启动 OpenClaw Gateway
4. 打开 `http://127.0.0.1:3000`

到这里就可以完整体验当前产品原型。
