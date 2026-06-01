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

## 8. 产品开发步骤简写

这一节是给协作伙伴快速扫一眼项目推进逻辑用的，重点是“先把产品链路跑通，再逐步替换成真实能力”。

### 8.1 第一阶段：把产品主流程做出来

先完成网站最核心的一条链：

1. 首页输入研究主题
2. 自动创建项目
3. 生成 Query Planner
4. 进入运行流程页
5. 进入文献目录页
6. 进入知识图谱页
7. 进入研究报告页
8. 接入网页助手

这一阶段的目标不是“检索最真实”，而是先让用户从入口到结果页能完整走通。

### 8.2 第二阶段：前后端结构稳定化

- 前端统一到 `apps/web`
- 后端统一到 `services/api`
- 数据结构统一到 `packages/core`
- 页面围绕同一项目 ID 串联
- 助手围绕同一项目上下文回答

### 8.3 第三阶段：能力逐步替换

把 mock-first 方案逐步替换成真实模块：

- 真实检索
- 真实去重
- 真实论文元数据补全
- 真实图谱抽取
- 真实研究报告生成

### 8.4 第四阶段：协作开发与上线准备

- 把代码同步到 GitHub 仓库
- 建立 `main / dev / feature` 分支流程
- 邀请前后端成员协作开发
- 补充部署文档、环境变量说明、问题排查说明

## 9. 附录：Codex 安装、API 配置与账号切换经验

这一节是结合本项目开发过程整理出来的经验说明。

### 9.1 Windows 上安装 Codex / 使用 Codex 桌面端

如果在 PowerShell 中遇到脚本执行限制，先执行：

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

如果命令执行后没有弹出确认窗口，通常表示当前环境已经接受了这项设置，或者 PowerShell 直接应用成功。

### 9.2 在 Codex 中配置 API 并登录使用

本项目实际使用过程中，网页助手和 OpenClaw 最终依赖的是本机可用的模型 API。

建议的排查顺序：

1. 先确认 API Key 已经配置到对应工具
2. 再确认模型供应商可连通
3. 最后确认 OpenClaw / Gateway 是否已成功读取该配置

如果网页助手没有回答，先不要默认认为前端坏了，优先排查：

- API Key 是否真的已配置
- OpenClaw Gateway 是否在线
- 前端 `.env.local` 是否还在

### 9.3 关于 CodexPlusPlus 切换账号后历史记录丢失

这是一个“本地状态目录 / 本地缓存上下文”问题，通常不是项目文件本身丢失。

建议处理思路：

1. 不要直接覆盖原来的工作目录
2. 切换账号前先备份本地项目目录
3. 确认是否切换到了新的本地应用数据目录
4. 如果历史线程看不到，先检查是否只是换了账号或换了本地缓存位置

对本项目来说，更稳妥的做法是：

- 所有真实代码和文档都进 GitHub
- 本地对话历史仅作为辅助，不作为唯一信息来源
- 关键方案、命令和踩坑过程都及时沉淀到 README / docs

## 10. 详写 1：本地利用 Docker 隔离环境部署 OpenClaw

这一节不重复讲 OpenClaw 本身是什么，只补充本项目里真正走通的做法。

### 10.1 基本思路

我们采用的是：

- OpenClaw 运行在 Docker 隔离环境中
- 当前产品网站通过本地 Gateway 与 OpenClaw 通信
- 网页端只调用自己的 Next.js 路由
- Next.js 再去桥接 OpenClaw Gateway

### 10.2 核心检查点

OpenClaw Docker 起来之后，重点检查：

1. Docker Desktop 已启动
2. OpenClaw gateway 容器已运行
3. `127.0.0.1:18789` 可以访问
4. 网页端 `.env.local` 中的 gateway 配置正确

最常用的健康检查命令：

```powershell
Invoke-RestMethod http://127.0.0.1:18789/healthz
```

如果返回：

```json
{"ok":true,"status":"live"}
```

说明 Gateway 处于可用状态。

### 10.3 本项目里与 OpenClaw 相关的关键环境变量

这几个最关键：

- `OPENCLAW_BRIDGE_MODE=gateway`
- `OPENCLAW_GATEWAY_WS_URL=ws://127.0.0.1:18789`
- `OPENCLAW_GATEWAY_TOKEN=...`
- `OPENCLAW_GATEWAY_AGENT_ID=main`

### 10.4 常见故障

#### 情况 1：网页助手 502

通常原因：

- Gateway 没启动
- Gateway 短暂不可用
- `.env.local` 被清掉
- Token 没读到

#### 情况 2：健康检查失败

优先排查：

- Docker 容器状态
- 端口映射是否存在
- Gateway 是否真的在监听 `18789`

#### 情况 3：网页能打开，但助手退回 mock

通常表示：

- 网页前端仍能工作
- 但真实 Gateway 配置没有生效

## 11. 详写 2：利用 vibe coding 开发开放产品的过程

这里的“vibe coding”不是指随意写代码，而是：

- 先通过对话把产品路径讲清楚
- 再用最小可运行版本把界面、接口、数据链打通
- 然后逐步替换脆弱或假的部分

### 11.1 本项目里的具体做法

这次开发过程基本是：

1. 先整理 PRD / spec / architecture / tasks
2. 再搭前后端最小骨架
3. 接着接 OpenClaw 助手桥接
4. 再把前端伙伴的静态页面迁进真实产品框架
5. 最后再补本地运行、GitHub 协作、README 文档

### 11.2 这种方式的优点

- 更快看到完整产品形态
- 更容易让团队对齐
- 前端、后端、助手、文档可以同步推进
- 每一步都能落地验证，而不是一直停留在脑图和 PRD

### 11.3 这种方式的注意点

- 很容易留下 mock 数据依赖
- 很容易把本地环境配置和真实源码混在一起
- 很容易只顾能跑，忘了写给协作者看的说明文档

所以这一版 README 的目的之一，就是把这条路径补清楚。

## 12. 详写 3：前后端开发如何在 GitHub 仓库上共同开发产品

这个项目比较适合采用统一仓库协作，而不是前后端拆成多个仓库。

### 12.1 推荐分支模型

- `main`：稳定版本
- `dev`：日常集成
- `feature/frontend-*`
- `feature/backend-*`
- `feature/openclaw-*`

### 12.2 推荐协作方式

#### 前端伙伴主要负责

- `apps/web`
- 页面布局
- 页面交互
- 视觉一致性
- 页面和接口之间的数据展示逻辑

#### 后端伙伴主要负责

- `services/api`
- 项目状态
- 检索计划
- 论文池生成
- 图谱生成
- 报告生成

#### 共同关注

- `packages/core`
- 数据模型
- API 契约
- README / docs

### 12.3 建议的 GitHub 流程

1. 从 `dev` 拉一个功能分支
2. 本地开发
3. 提交代码
4. 推送到 GitHub
5. 发 Pull Request
6. Code Review 后合并回 `dev`
7. 阶段稳定后再合并到 `main`

### 12.4 特别注意

不要把这些内容直接进仓库：

- `.env.local`
- 本机 token
- node_modules
- .venv
- 本地日志
- 本地 OpenClaw state

## 13. 第一版补充说明与前端已知问题

这是目前第一版产品已经暴露出来、后续需要继续修的点。

### 13.1 当前第一版已知问题

1. **只有文献目录页能返回流程页**  
   说明页面间导航还不完全统一，后续需要把流程页、图谱页、报告页的回链逻辑继续收紧。

2. **搜索到的文献数量还不够多，也不够全面**  
   当前论文池仍然以 mock / seed 数据为主，后续必须接入真实检索源与更完整的去重逻辑。

3. **知识图谱星球界面还不够美观，文献星球之间的连线重复度不高**  
   当前图谱页主要是先把“节点、边、详情面板、项目上下文”接起来，视觉层和图布局算法后续还要继续优化。

### 13.2 对应后续优化方向

- 补强页面导航闭环
- 增加更真实的论文池数据
- 提高图谱的可视化质量
- 增加方法之间、论文之间、研究空白之间的高价值连边
- 用更成熟的图布局方案替换当前简化版布局
