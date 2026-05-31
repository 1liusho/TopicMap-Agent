# Research Lineage Agent 任务清单

这份任务清单的目标是把项目切成可验证的小步。每一项都应该有明确产物和完成标准。

## T0 文档与目录初始化

- [ ] 创建 `research-lineage-agent/` 项目目录。
- [ ] 创建 `docs/`、`skills/`、`data/`、`scripts/`、`tests/` 目录。
- [ ] 写入 `docs/spec.md`。
- [ ] 写入 `docs/plan.md`。
- [ ] 写入 `docs/tasks.md`。
- [ ] 写入 `docs/architecture.md`。
- [ ] 写入 `docs/openclaw-integration.md`。

完成标准：

- 五份文档存在。
- 文档明确 V0 CLI、V1 Web MVP、V1.5 PDF 证据增强。
- 文档明确 OpenClaw 是 Agent 底座，Research Pipeline 是独立核心能力。
- 第一个 Demo topic 明确为 Fabry-Perot cavity antenna。

## T0.5 OpenClaw 底座验证

- [ ] 确认本机 Node 版本满足 OpenClaw 要求。
- [ ] 安装并运行 OpenClaw。
- [ ] 完成 `openclaw onboard`。
- [ ] 验证 `openclaw gateway status`。
- [ ] 创建 `skills/research-lineage/SKILL.md`。
- [ ] 验证 `openclaw skills list` 能看到 `research-lineage`。
- [ ] 用 `openclaw agent --message "帮我调研谐振腔天线"` 测试触发。

完成标准：

- OpenClaw 能正常响应消息。
- `research-lineage` skill 能被加载。
- skill 能识别科研调研意图并按项目流程询问 topic、年份、领域和输出目标。
- 此阶段只做 mock，不接真实检索。

## T1 CLI 项目骨架

- [ ] 初始化 Python 包或脚本结构。
- [ ] 增加 CLI 入口，例如 `research-agent search`。
- [ ] 增加配置文件读取能力。
- [ ] 增加输出目录 `data/outputs/`。
- [ ] 增加 mock 输出，供 OpenClaw skill 先调用或引用。

完成标准：

- 本地可以运行 CLI。
- CLI 能读取 topic、年份范围、目标数量。
- CLI 能生成空的结果文件或 mock 结果。
- OpenClaw skill 可以把用户需求转成 CLI 所需参数。

## T2 标准数据模型

- [ ] 定义 `PaperCandidate`。
- [ ] 定义 `Paper`。
- [ ] 定义 `ProjectConfig`。
- [ ] 定义 `SearchResult`。
- [ ] 定义 `Extraction`。
- [ ] 定义 `EvidenceSpan`。
- [ ] 定义 `GraphNode` 和 `GraphEdge`。

完成标准：

- 所有数据模型有类型校验。
- 单元测试覆盖必填字段、可选字段和序列化。
- 后续模块统一使用这些模型，不直接传原始 API 响应。

## T3 OpenAlex 检索 Adapter

- [ ] 实现 OpenAlex 查询。
- [ ] 支持 topic 关键词。
- [ ] 支持年份范围。
- [ ] 支持最大返回数量。
- [ ] 将结果映射为 `PaperCandidate`。
- [ ] 保存 source metadata。

完成标准：

- 对 Demo topic 能返回论文。
- 返回结果包含 title、authors、year、doi、venue、abstract 或摘要替代字段。
- 网络或 API 错误有明确错误信息。

## T4 Semantic Scholar 检索 Adapter

- [ ] 实现 Semantic Scholar 查询。
- [ ] 支持 fields 参数控制。
- [ ] 支持年份范围。
- [ ] 将结果映射为 `PaperCandidate`。
- [ ] 处理 API 限流或失败。

完成标准：

- 对 Demo topic 能返回论文。
- 结果和 OpenAlex 可以进入同一合并流程。
- 有基础测试或 mock 测试。

## T5 Query Planner

- [ ] 根据 topic 生成英文关键词。
- [ ] 根据 topic 生成中文关键词。
- [ ] 生成缩写和全称候选。
- [ ] 生成可编辑检索式。
- [ ] 为 Demo topic 内置领域词表，例如 PRS、FSS、AMC、metasurface、RCS。

完成标准：

- 对“谐振腔天线”能生成 Fabry-Perot cavity antenna、FPCA、resonant cavity antenna 等关键词。
- Query Planner 输出结构化 JSON。
- 用户可以在 Web 阶段编辑这些关键词。

## T6 多源合并与去重

- [ ] 实现 DOI 标准化。
- [ ] 实现标题标准化。
- [ ] 实现 DOI 精确去重。
- [ ] 实现标题相似度去重。
- [ ] 合并同一论文的多个来源。

完成标准：

- 同一 DOI 的论文只保留一条。
- 标题大小写、标点差异不会造成明显重复。
- 合并后保留 source ids。
- 有单元测试覆盖重复 DOI、重复标题、不同年份同题等情况。

## T7 相关性排序与论文池导出

- [ ] 实现关键词命中分数。
- [ ] 实现年份分数。
- [ ] 实现引用数分数。
- [ ] 实现来源质量基础分。
- [ ] 组合为 `relevanceScore` 和 `qualityScore`。
- [ ] 导出 `papers.json`。
- [ ] 导出 `papers.csv`。

完成标准：

- Demo topic 返回至少 30 篇候选论文。
- 输出包含排序字段。
- top 20 可人工检查。

## T8 手动导入

- [ ] 支持 DOI 列表导入。
- [ ] 支持标题列表导入。
- [ ] 支持 BibTeX 导入。
- [ ] 支持 RIS 导入。
- [ ] 导入结果进入同一去重流程。

完成标准：

- 用户手动导入的论文不会和 API 结果重复展示。
- 导入失败时展示具体原因。

## T9 摘要级结构化抽取

- [ ] 设计抽取 JSON schema。
- [ ] 实现 prompt 模板。
- [ ] 实现 LLM provider 接口。
- [ ] 对 title + abstract 执行抽取。
- [ ] 抽取 methods、metrics、contributions、limitations、applications。
- [ ] 保存 evidence sentence。

完成标准：

- 每篇论文至少抽取 5 类字段。
- 抽取失败不会中断整个任务。
- 无证据字段标记低置信度。
- 抽取结果可缓存。

## T10 Markdown 报告生成

- [ ] 生成论文池概览。
- [ ] 生成技术路线分组。
- [ ] 生成技术实体表。
- [ ] 生成指标表。
- [ ] 生成 3-5 个研究空白建议。
- [ ] 生成引用列表。
- [ ] 导出 `report.md`。

完成标准：

- Demo topic 可生成 1500-3000 字中文报告。
- 报告结论包含来源标注。
- 无证据推断被标记为低置信度或建议性表述。

## T11 图谱数据生成

- [ ] 从抽取结果生成 `Paper` 节点。
- [ ] 生成 `Method` 节点。
- [ ] 生成 `Metric` 节点。
- [ ] 生成 `uses` 边。
- [ ] 生成 `targets` 边。
- [ ] 生成 `achieves` 边。
- [ ] 为每条边绑定 evidence span。

完成标准：

- 输出 `graph_nodes.json`。
- 输出 `graph_edges.json`。
- 每条边包含 confidence、source paper、evidence。
- 低证据边不会被高置信度展示。

## T12 Web 项目骨架

- [ ] 初始化 Next.js + TypeScript + Tailwind。
- [ ] 初始化 FastAPI。
- [ ] 保留 OpenClaw 作为首期 Agent 入口，不把 Web 当作唯一入口。
- [ ] 创建 `/` 首页。
- [ ] 创建 `/projects/new`。
- [ ] 创建 `/projects/:id/papers`。
- [ ] 创建 `/projects/:id/graph`。
- [ ] 创建 `/projects/:id/report`。
- [ ] 建立前后端 API 调用约定。

完成标准：

- Web 可以本地启动。
- 页面可访问。
- 可以创建 mock 项目并跳转到论文池。

## T13 任务配置页

- [ ] 实现 topic 输入。
- [ ] 实现研究目标输入。
- [ ] 实现学科方向选择。
- [ ] 实现年份范围选择。
- [ ] 展示 Query Planner 结果。
- [ ] 允许编辑关键词组。
- [ ] 点击确认后开始检索任务。

完成标准：

- 用户可以创建真实任务。
- 任务配置会保存。
- 页面显示任务状态。

## T14 论文池页面

- [ ] 展示论文表格。
- [ ] 支持按年份筛选。
- [ ] 支持按来源筛选。
- [ ] 支持按关键词筛选。
- [ ] 支持保留 / 剔除。
- [ ] 支持查看摘要和元数据。

完成标准：

- Demo topic 的论文池可浏览和筛选。
- 用户操作会保存到项目状态。

## T15 图谱页面

- [ ] 集成 React Flow。
- [ ] 展示节点和边。
- [ ] 实现节点类型样式。
- [ ] 点击节点展示详情。
- [ ] 点击边展示证据。
- [ ] 支持按节点类型过滤。
- [ ] 支持导出 PNG。

完成标准：

- Demo topic 有可交互图谱。
- 图谱边证据可读。
- 用户能理解为什么系统生成这条关系。

## T16 图谱人工校正

- [ ] 支持修改边类型。
- [ ] 支持删除错误边。
- [ ] 支持标记低质量证据。
- [ ] 保存用户反馈。
- [ ] 反馈影响后续报告和图谱展示。

完成标准：

- 用户修改后刷新页面不丢失。
- 报告不会继续使用被删除的边作为依据。

## T17 报告页面

- [ ] 展示 Markdown 报告。
- [ ] 支持复制 Markdown。
- [ ] 支持下载 Markdown。
- [ ] 支持导出 BibTeX。
- [ ] 支持从报告跳转到论文或图谱边。

完成标准：

- 报告可直接用于组会材料初稿。
- 引用列表和论文池一致。

## T18 PDF 上传与解析

- [ ] 支持用户上传 PDF。
- [ ] 保存 PDF metadata。
- [ ] 用 PyMuPDF 提取文本。
- [ ] 按页保存 text chunks。
- [ ] 标记 section 候选。

完成标准：

- 用户上传 PDF 后，系统能展示页数和解析状态。
- 抽取结果能引用页码。

## T19 PDF 原文级证据抽取

- [ ] 对用户保留论文执行 PDF 深抽取。
- [ ] 抽取 introduction、method、results、tables。
- [ ] 为证据句保存 page 和 section。
- [ ] 摘要证据和 PDF 证据分开显示。

完成标准：

- 至少部分关键字段可追溯到页码。
- 没有 PDF 的论文仍可使用摘要级证据。

## T20 异步任务队列

- [ ] 引入 Redis。
- [ ] 引入 RQ 或 Celery。
- [ ] 将检索任务放入队列。
- [ ] 将抽取任务放入队列。
- [ ] 前端轮询或订阅任务状态。

完成标准：

- 长任务不会阻塞 Web 请求。
- 任务失败可查看错误原因。
- 可以重试失败阶段。

## T21 缓存与成本控制

- [ ] 缓存检索 API 结果。
- [ ] 缓存 LLM 抽取结果。
- [ ] 缓存 PDF 解析结果。
- [ ] 增加每个任务的 token / API 调用统计。
- [ ] 对 PDF 深抽取限制为用户保留论文。

完成标准：

- 重复运行同一 topic 不会重复调用全部外部服务。
- 成本数据可查看。

## T22 验收 topic 评测

- [ ] 创建 `谐振腔天线` 验收集。
- [ ] 创建 `钙钛矿太阳能电池稳定性` 验收集。
- [ ] 创建 `LLM Agent 评测` 验收集。
- [ ] 人工标注核心论文。
- [ ] 人工评估 top 20 相关性。
- [ ] 人工评估图谱边可接受率。

完成标准：

- 每个 topic 有评测结果。
- 可以计算召回率、去重准确率、top 20 通过率、图谱边可接受率。

## T23 内测准备

- [ ] 编写手动测试清单。
- [ ] 编写 3 分钟 Demo script。
- [ ] 准备样例输出。
- [ ] 增加错误提示和空状态。
- [ ] 收集用户反馈表。

完成标准：

- 可面向 20-30 名校内用户内测。
- 内测流程不依赖开发者现场手动修数据。

## 建议优先做的 5 件事

1. T0.5 OpenClaw 底座验证。
2. T1 CLI 项目骨架。
3. T3 OpenAlex 检索 Adapter。
4. T4 Semantic Scholar 检索 Adapter。
5. T6 多源合并与去重。

做完这 5 件事，项目就有了“OpenClaw 入口 + 真实论文检索 + 去重”的最小可验证闭环。随后再做 T9 / T10，把抽取和报告补成完整科研调研闭环。
