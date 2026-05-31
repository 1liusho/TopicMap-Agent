# Research Lineage Agent 产品规格

## 1. 项目名称

Research Lineage Agent

中文名：研究脉络智能体。

## 2. 一句话定义

一个面向本科生、研究生和课题组的垂直科研文献智能体。用户从一个研究 topic 出发，系统自动检索高质量论文，抽取技术实体、性能指标和证据句，生成可追溯的技术血缘图谱、指标对比表和研究空白建议。

## 3. 核心定位

本项目不是普通论文搜索引擎，也不是泛用聊天机器人。它要解决的核心问题是：

> 帮用户更快理解一个方向的技术演化，并形成可验证、可追溯的研究判断。

首期只做 1-3 个垂直工程方向，优先选择有明确结构、指标和技术路线的领域：

- 天线 / 微波 / 超表面
- 材料
- 电池

## 4. 实现约束：基于 OpenClaw 构建

本项目基于 OpenClaw 的开源 Agent runtime 做领域化封装，不从零实现通用 Agent 框架。

OpenClaw 承担：

- Agent gateway。
- 会话入口。
- skills / plugins 加载。
- 多渠道交互。
- 工具调用编排。

Research Lineage Agent 承担：

- 学术检索源适配。
- 论文去重和排序。
- 文献结构化抽取。
- 证据句追溯。
- 技术血缘图谱。
- 中文调研报告。
- 用户人工校正闭环。

首期实现方式：

1. 先做 OpenClaw workspace skill：`research-lineage`。
2. 再做可独立运行的 Research Pipeline CLI / API。
3. 当 CLI / API 稳定后，再考虑把工具能力封装成 OpenClaw code plugin。

原则：

- 不直接魔改 OpenClaw 核心。
- 不把科研业务逻辑写死在 skill prompt 里。
- skill 负责流程编排和行为约束，pipeline 负责可测试的检索、抽取、图谱和报告。

第一个 Demo topic 固定为：

> 谐振腔天线 / Fabry-Perot cavity antenna，2020-2026 年，一区期刊，生成技术血缘图、性能指标表和 5 个潜在创新方向。

## 5. 背景问题

学生做文献调研时常见痛点：

1. 不知道关键词怎么扩展，容易漏掉英文同义词、缩写、上位概念和下位概念。
2. 搜到很多论文，但不知道哪些是真正核心，哪些只是相似主题。
3. 很难看清技术路线：谁改进了谁，哪个结构解决了哪个问题，当前 bottleneck 是什么。
4. 综述图、技术路线图和指标表通常需要手工整理，耗时很长。
5. AI 总结容易胡编，缺少原文证据和可追溯来源。
6. 新生做开题时，不知道自己的 idea 是否已有类似工作，也不知道创新点该落在哪里。

## 6. 目标用户

### 核心用户

- 研一 / 研二学生：刚进入方向，需要快速建立文献地图。
- 高年级研究生：准备开题、写综述、写 introduction、找创新点。
- 本科生科研训练 / 毕设学生：需要低门槛理解一个 topic。

### 次级用户

- 导师 / 课题组负责人：想快速了解学生调研质量。
- 学术社团 / 创新竞赛团队：需要快速做技术路线分析。

## 7. 使用场景

### 场景 1：开题前调研

用户输入“谐振腔天线，近五年，中科院一区”，系统输出高质量论文清单、技术脉络图、指标对比和可选创新方向。

### 场景 2：写综述 / 论文 introduction

用户输入一个 topic，系统按技术路线分组论文，并生成“发展脉络段落 + 可追溯引用”。

### 场景 3：判断 idea 是否新

用户输入自己的方案，例如“PRS + PB 编码 + 偏振可重构 FPCA”，系统在图谱中查找相似组合，提示已做工作、差异点和潜在新颖性。

### 场景 4：组会汇报

系统导出一页技术路线图、一张指标表、一份 Markdown / PPT 提纲。

## 8. 版本目标

### V0-pre：OpenClaw 底座验证

目标是确认 OpenClaw 可以作为科研助手的 Agent 底座。

必须支持：

- 本地安装并运行 OpenClaw。
- 创建 `research-lineage` workspace skill。
- skill 能识别“科研调研 / 文献检索 / 技术血缘图”等用户意图。
- skill 能指导或调用本地 mock pipeline。

完成标准：

- `openclaw skills list` 能看到 `research-lineage`。
- 发送“帮我调研谐振腔天线”时，OpenClaw 能按科研调研流程响应。
- mock pipeline 能输出 `papers.json` 和 `report.md`。

### V0：CLI 检索原型

目标是在 OpenClaw skill 之外先验证核心科研能力，不做复杂界面。

必须支持：

- 输入 topic、年份范围、目标数量。
- 调用 OpenAlex 和 Semantic Scholar 获取候选论文。
- 合并、去重、排序论文。
- 输出 `papers.json`、`papers.csv`、`report.md`。

完成标准：

- 对 Demo topic 至少返回 30 篇候选论文。
- DOI 去重和标题相似去重可运行。
- 输出文件可被人工检查。

### V1：Web MVP

目标是完成一个可演示的 Web 应用闭环。

必须支持：

- Topic 输入和检索任务创建。
- 关键词自动扩展：中文、英文、缩写、同义词。
- 论文检索：OpenAlex、Semantic Scholar，后续补 Crossref、arXiv、IEEE 页面链接。
- 手动导入：DOI 列表、标题列表、BibTeX、RIS。
- 论文去重和元数据标准化。
- 年份、来源、关键词、研究方向、期刊 / 会议字段筛选。
- 摘要级结构化抽取。
- 技术实体表：结构、材料、方法、指标、应用场景。
- 技术血缘图：论文节点、技术节点、指标节点、证据边。
- Markdown 报告导出。
- 用户可保留 / 剔除论文，可修改或删除错误图谱关系。

### V1.5：PDF 与证据增强

在 V1 闭环跑通后增加：

- PDF 上传。
- PDF 正文解析。
- introduction、method、results、tables 抽取。
- 证据句定位到页码和段落位置。
- 低置信度标注。

## 9. 功能需求

### FR-01 Topic 任务创建

输入字段：

- Topic：必填，例如“谐振腔天线”。
- 研究目标：可选，例如“找近五年一区论文和技术演化”。
- 学科方向：可选，例如“天线 / 微波”。
- 时间范围：默认近五年。
- 文献类型：期刊、会议、预印本。
- 质量过滤：中科院分区、JCR 分区、CCF、影响因子、出版社。
- 输出偏好：综述、技术路线图、指标表、创新点。

验收标准：

- 用户可以创建任务。
- 系统保存任务配置。
- 用户可以看到系统生成的关键词组和检索式。

### FR-02 Query Planner

系统根据 topic 生成：

- 中文关键词。
- 英文关键词。
- 缩写和全称。
- 同义词。
- 上位 / 下位概念。
- 可编辑的检索式。

验收标准：

- 用户可查看并编辑关键词。
- 检索开始前必须经过用户确认。

### FR-03 多源论文检索

首期数据源：

- OpenAlex API。
- Semantic Scholar API。
- Crossref API。
- arXiv API。
- 用户手动导入 DOI / BibTeX / RIS / PDF。

补充数据源：

- 普通网页搜索只作为补充，不作为唯一证据源。
- IEEE 页面链接可保存，但不自动下载付费论文。

验收标准：

- 同一 topic 可从至少两个公开源返回论文。
- 每篇论文统一成标准 `Paper` 数据结构。
- 检索失败时有明确错误状态和可重试机制。

### FR-04 论文去重、排序和筛选

去重依据：

- DOI。
- 标题相似度。
- 作者 + 年份。

排序依据：

- topic 相关性。
- 年份。
- 引用数。
- 来源质量。
- 关键词命中。

筛选字段：

- 年份。
- 来源。
- 期刊 / 会议。
- 是否有 DOI。
- 是否有摘要。
- 是否被用户保留。

验收标准：

- 对 Demo topic，去重准确率目标大于 95%。
- top 20 相关性人工通过率目标大于 80%。
- 用户可手动保留或剔除论文。

### FR-05 文献结构化抽取

每篇论文抽取字段：

- 基本信息：标题、作者、年份、期刊 / 会议、DOI、链接。
- 研究对象：天线类型、材料体系、算法任务等。
- 核心方法：结构设计、模型方法、实验方法。
- 技术实体：PRS、FSS、AMC、metasurface、liquid metal 等。
- 指标：增益、带宽、效率、尺寸、频段、RCS、精度等。
- 对比对象：baseline、prior work、传统方法。
- 主要贡献：1-3 条。
- 局限性：1-3 条。
- 未来工作：如论文中出现则抽取。
- 证据：原文句子、页码、段落位置。

首期策略：

- V1 先做标题、摘要和可用元数据抽取。
- V1.5 再做 PDF 正文证据定位。

验收标准：

- 每篇论文至少抽取 5 类字段。
- 抽取结果符合固定 JSON schema。
- 没有证据的结论必须标记为低置信度。

### FR-06 知识图谱

节点类型：

- `Paper`：论文。
- `Method`：方法 / 结构。
- `Metric`：性能指标。
- `Problem`：要解决的问题。
- `Application`：应用场景。
- `DatasetOrExperiment`：实验对象或数据集。
- `Claim`：论文主张。

边类型：

- `uses`：论文使用某技术。
- `improves`：技术 / 论文改进另一技术。
- `combines_with`：组合两种技术。
- `replaces`：替代某结构或方法。
- `targets`：面向某指标或问题。
- `achieves`：达到某性能结果。
- `compared_with`：与某 baseline 比较。
- `inherits_from`：技术血缘继承。
- `supports` / `contradicts`：结论支持或冲突。

每条边必须包含：

- 置信度。
- 证据句。
- 来源论文。
- 抽取方式：模型抽取、规则抽取、人工确认。

验收标准：

- 图谱边有可读证据句的比例目标大于 80%。
- 用户可以修改边类型或删除错误关系。
- 用户反馈会被保存。

### FR-07 技术血缘图

图谱视图：

- 时间轴视图：按年份展示技术演化。
- 技术树视图：从根技术展开分支。
- 论文网络视图：展示论文引用 / 相似关系。
- 指标对比表：展示性能随技术路线变化。
- 空白组合视图：显示尚未充分探索的技术组合。

首期 Web MVP 优先实现：

- React Flow 图谱。
- 节点详情面板。
- 边证据面板。
- PNG 导出。

验收标准：

- 点击节点可查看论文摘要、贡献和证据。
- 点击边可查看关系原因、证据句和置信度。
- 图谱可导出。

### FR-08 研究空白建议

系统输出：

- 已成熟路线。
- 近两年快速增长路线。
- 高性能但复杂度高的路线。
- 有明显 trade-off 的路线。
- 可能的组合创新。
- 需要小心的低新颖性方向。

每个建议包含：

- 建议标题。
- 依据：来自哪些论文、指标或图谱关系。
- 潜在创新点。
- 风险。
- 验证实验建议。

验收标准：

- 每个 topic 输出 3-5 条建议。
- 每条建议至少引用 2 篇来源论文或 1 条图谱证据链。
- 不允许把无证据推断写成确定结论。

### FR-09 报告导出

报告内容：

- Topic 和检索配置。
- 论文池摘要。
- 技术路线总结。
- 论文分组。
- 技术实体表。
- 指标表。
- 研究空白建议。
- 引用列表。

导出格式：

- Markdown：V1 必须支持。
- BibTeX：V1 目标支持。
- PNG：图谱页导出。
- PPT：后续版本支持。

验收标准：

- Demo topic 可生成 1500-3000 字中文调研报告。
- 报告中的关键结论有来源标注。

## 10. 页面需求

### 页面 1：首页 / 任务入口

核心是 topic 输入框，不做营销页。

路由建议：`/`

### 页面 2：检索配置页

展示自动扩展关键词、数据源和筛选条件，允许用户编辑。

路由建议：`/projects/new` 或 `/projects/:id/config`

### 页面 3：任务运行页

展示 Agent 阶段：检索、去重、筛选、抽取、建图、报告生成。

路由建议：`/projects/:id/run`

### 页面 4：论文池

表格列：

- 标题
- 年份
- 来源
- 期刊 / 会议
- DOI
- 相关性
- 引用数
- 是否有 PDF
- 保留 / 剔除

路由建议：`/projects/:id/papers`

### 页面 5：图谱页

布局：

- 左侧过滤器。
- 中间图谱。
- 右侧节点 / 边详情和证据。

路由建议：`/projects/:id/graph`

### 页面 6：报告页

包含技术路线总结、论文分组、指标表、研究空白、引用列表。

路由建议：`/projects/:id/report`

## 11. 数据模型

```ts
type Project = {
  id: string;
  topic: string;
  goal?: string;
  domain?: string;
  yearStart?: number;
  yearEnd?: number;
  sources: string[];
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
};

type Paper = {
  id: string;
  title: string;
  authors: string[];
  year?: number;
  venue?: string;
  doi?: string;
  abstract?: string;
  url?: string;
  citationCount?: number;
  sourceIds: string[];
  relevanceScore?: number;
  qualityScore?: number;
  isKept: boolean;
};

type Extraction = {
  id: string;
  paperId: string;
  methods: ExtractedItem[];
  metrics: ExtractedItem[];
  contributions: ExtractedItem[];
  limitations: ExtractedItem[];
  applications: ExtractedItem[];
  confidence: number;
};

type EvidenceSpan = {
  id: string;
  paperId: string;
  text: string;
  page?: number;
  section?: string;
  sourceType: "abstract" | "pdf" | "metadata";
};

type GraphNode = {
  id: string;
  projectId: string;
  type: "Paper" | "Method" | "Metric" | "Problem" | "Application" | "DatasetOrExperiment" | "Claim";
  label: string;
  properties: Record<string, unknown>;
};

type GraphEdge = {
  id: string;
  projectId: string;
  sourceNodeId: string;
  targetNodeId: string;
  type: string;
  confidence: number;
  evidenceSpanIds: string[];
  extractionMethod: "model" | "rule" | "human";
};
```

## 12. 非功能要求

- 页面文案为中文。
- 首期优先本地可运行，不依赖复杂云服务。
- 业务逻辑和 Agent 步骤必须可测试。
- 检索和抽取结果必须可缓存，避免重复消耗 API 和 LLM 成本。
- 所有动态学术质量信息必须标注来源和更新时间。
- 不能自动下载付费论文。
- 不能把摘要推断伪装成全文证据。
- 不能把低置信度关系展示成确定结论。

## 13. 范围外

V1 暂不做：

- 全学科通用高精度覆盖。
- 自动下载付费论文。
- 完整 Zotero / EndNote 双向同步。
- 自动生成正式投稿论文。
- 社交网络式社区功能。
- 管理员后台和多租户权限系统。
- 复杂团队协作空间。

## 14. 成功指标

校园内测指标：

- 30 名真实用户完成至少 1 次完整调研。
- 70% 用户认为输出能减少至少 50% 初筛时间。
- 单个 topic 的核心论文召回率达到人工基准的 80% 以上。
- 图谱边的人工可接受率达到 70% 以上。
- 证据句可追溯率达到 95% 以上。

技术验收指标：

- 每个验收 topic 至少返回 30 篇候选论文。
- 去重准确率大于 95%。
- top 20 相关性人工通过率大于 80%。
- 每篇论文至少抽取 5 类字段。
- 80% 图谱边有可读证据句。
- 生成一张可导出的技术血缘图。
- 生成一份 1500-3000 字中文调研报告。
