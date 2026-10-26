# 文档-代码双图谱 Spec

- 状态：设计稿（未实现）
- 日期：2026-10-23
- 范围：文档层、代码层、两层之间的连接
- 关联：`_Agents/planning-artifacts/epics.md`、`_Agents/dependency-graph/`（现有代码图演示）

## 1. 目标

1. **文档主导**：用户从文档进入，链路/结构/实体在文档侧阅读；代码图是下钻与事实核对。
2. **两层各自生成**：文档层从文档构建，代码层从 AST 构建，互不写入、互不依赖生成。
3. **连接靠图元素身份**：文档里的时序图/用例图/类图/活动图元素，按图种映射到代码符号；不建跨层关联表。
4. **可重跑**：Wiki 是派生视图，不是一次性生成物；文档或代码变化后，重建即可。
5. **无孤儿、无重复**：实体/概念有归属页和链接；同一主题只有一个 canonical 页。

## 2. 范围

### 做

- 文档侧四遍流程：连通 → 去重 → 结构 → 清理；
- 代码侧 AST 图：模块图、符号图、方法索引、路由索引；
- 图种映射：时序图、用例图、活动图、类图、组件图；
- 页面模型：`summary / entity / concept / synthesis / index / comparison`；
- 运行时解析、反向查询、失败降级。

### 不做

- 运行图 / trace 投影（已有 `/traces` 与观测）；
- 多租户、ACL、规则引擎、全量 GraphRAG；
- 自动修改文档或代码；
- 一次性页面固化、人工逐条维护跨层链接；
- 表格/流程图之外的其它自动图种。

## 3. 术语

| 术语 | 含义 |
|---|---|
| 文档源 | 入库的 resource / chunk；原文是唯一内容源 |
| 页面 | 文档侧的派生视图，有稳定 `slug` |
| 页面类型 | `summary / entity / concept / synthesis / index / comparison`，表示归属，不是渲染格式 |
| 图元素 | 页面内容里的图节点：`participant / message / usecase / step / class / component` |
| 代码符号 | 文件、目录、类、函数、方法、路由 |
| 代码图 | 从 AST 生成的模块图 / 符号图 |
| resolver | 把图元素解析到代码符号的运行时逻辑，不持久化结果 |
| canonical | 同一主题的唯一正本页 |
| 孤儿 | 没有任何 `in_links / out_links / source_refs` 的页面或实体 |

## 4. 页面模型

### 4.1 表

```
wiki_pages
  id
  slug                 -- 稳定 ID，如 synthesis/chat-request
  title
  page_type            -- summary | entity | concept | synthesis | index | comparison
  content              -- Markdown / Mermaid；派生内容可重建
  summary_text         -- 一句话摘要，列表/索引使用
  source_document_id   -- summary 专用：1 文件 1 页；其它类型为空
  canonical_page_id    -- 同主题指向唯一正本；自身是正本时为空
  folder_id
  source_refs          -- JSONB：文档 chunk / 代码符号引用
  last_edit_source     -- generated | user | agent（第一版只写 generated）
  created_at
  updated_at
  deleted_at
```

```
wiki_page_links
  source_page_id
  target_page_id
  relation             -- link | embed | part-of
```

- **一条边只存一行**；`in_links` / `out_links` 不落列，查询时按方向查。
- 唯一约束：
  - `slug` 在未删除页面内唯一；
  - `summary` 的 `source_document_id` 唯一（1 文件 1 summary）；
  - 同一 `canonical_page_id` 只允许一个正本（`canonical_page_id IS NULL` 且 `page_type` 相同的正本唯一；由应用层保证）。
- 内容从源重建；用户编辑第一版不做，保留 `last_edit_source` 字段。

### 4.2 页面类型与归属

| 类型 | 归属对象 | 唯一性 | 允许含链路 |
|---|---|---|---|
| `summary` | 一个文件 | 1 文件 1 页 | 可以；跨文件链路用 embed 引用 synthesis |
| `entity` | 一个实体 | 1 实体 1 页，去重合并 | 不写链路 |
| `concept` | 一个概念 | 1 概念 1 页，去重合并 | 不写链路 |
| `synthesis` | 一个跨文件主题/链路/架构 | 1 主题 1 页 | 是，链路正本 |
| `index` | 全库 | 1 页 | 否 |
| `comparison` | 一对对象 | 1 对 1 页 | 可选 |

## 5. 文档流程（四遍）

| 阶段 | 输入 | 动作 | 输出 | 约束 |
|---|---|---|---|---|
| Pass 1 连通 | 文档原文、chunk、Mermaid/结构块 | 抽实体/概念；建 summary/entity/concept 页；建 links | 页面 + 链接，图连通 | 每页至少 1 个来源、1 条链接；不允许孤儿 |
| Pass 2 去重 | 页面、链接 | 合并同名/同义实体/概念；迁移 links | 合并后的页面 | 先迁移链接再删页 |
| Pass 3 结构 | 文档中的链路/架构/结构块 | 抽 synthesis；实体/概念挂到 synthesis；图元素生成锚点 | synthesis + 结构链接 | 一主题一 canonical |
| Pass 4 清理 | 页面、链接 | 删除空 summary；连通检查 | 精简页面集 | 删除前确认实体/概念仍有链接 |

### 5.1 幂等

- 每一遍可重复执行，不重复建页/建链接；
- 页面按 `slug` upsert；链接按 `(source_page_id, target_page_id, relation)` upsert；
- 删除使用软删（`deleted_at`），可在重建时恢复。

### 5.2 孤儿检查

页面满足以下任一条件即视为孤儿：

```
没有 source_refs
且没有 out_links
且没有 in_links
```

- 实体/概念不允许成为孤儿；
- summary 若成为孤儿，Pass 4 可直接删除；
- synthesis 若成为孤儿，保留并挂到 index，等后续来源。

### 5.3 触发

- 文档入库 / 编辑：重跑该文档的 Pass 1–4；
- 代码构建 / commit：只重建代码图，文档侧不重跑；
- 手动：全量或按文档重跑；
- 所有流程可中断、可重试；每次运行生成 `run_id` 便于观测。

## 6. 代码图流程

```
代码快照（commit / 工作区）
  → AST 解析
  → 模块图（目录 / 文件，import / export）
  → 符号图（函数 / 类 / 方法，call / new / render / ref）
  → 符号索引（全限定名、类方法、路由）
```

- 产物带 `code_revision`；
- 不依赖文档，可单独使用；
- 每次构建重建，不做跨版本合并；
- 方法必须进索引：`ChatService.ask` 即使不作为图节点，也要能被解析；
- 路由索引用于用例图/HTTP 边界映射。

## 7. 连接流程

### 7.1 图种映射

| 文档图元素 | 代码图元素 |
|---|---|
| 时序图 participant | 类 / 组件 |
| 时序图 message | 方法 / 函数 |
| 用例图 usecase | 路由 / 工具 / 公共 API |
| 活动图 step | 函数 / 分支 |
| 类图 class | 类 / 接口 |
| 组件图 component | 目录 / 模块 |

### 7.2 解析顺序

```
全限定 ID / 路径
  → 名称 / 别名
  → 文档上下文（同图其它元素、章节）
  → 代码邻域（调用者 / 被调用者）
  → 仍多候选 → 有界 LLM（可选，步数 ≤ 6）
  → 失败：external / unresolved
```

### 7.3 约束

- **不建关联表**：解析结果不落库；可选派生缓存，按 `document snapshot + code_revision` 失效；
- **失败不阻塞**：页面照常读，图元素标 `unresolved`；
- **external**：浏览器、HTTP 方法、外部服务等，不跳转；
- **代码变更不写文档**：重新解析锚点，不自动改页面；
- **文档变更不写代码**：只重建文档侧页面和链接；
- **反向查询**：代码节点 → 哪些页面/图元素引用它，运行时反查；
- **page 级引用不作为连接主路径**：连接以图元素为准；页面 refs 列表只是辅助视图。

## 8. 一致性

| 事件 | 文档侧 | 代码侧 | 连接 |
|---|---|---|---|
| 文档入库 / 编辑 | Pass 1–4 | 不变 | 重算该文档图元素 |
| 代码 commit / 构建 | 不变 | 重建 | 重算所有相关锚点 |
| 删除文档 | 软删来源、迁移 links | 不变 | 移除该来源的锚点 |
| 删除页面 | 迁移 links | 不变 | 无 |

- 两侧都不自动改写对方；
- 断链、unresolved 是正常状态，不是错误；
- 所有重建可重复执行。

## 9. 验收标准（可测试）

1. 同一实体从两篇文档抽取，Pass 2 后只有一页，`source_refs` 含两条，原链接全部迁移。
2. 删除空 summary 后，实体/概念仍能通过 synthesis 或代码图到达，不产生孤儿。
3. 时序图 `participant` / `message` 点击后跳到正确符号；找不到时显示 `unresolved` / `external`。
4. 代码图重建后，页面内容不自动改变；锚点重新解析。
5. 连续执行 Pass 1–4 两次，页面数与链接数不增加（幂等）。
6. `in_links` / `out_links` 由一条 link 双向查询得到，不存在两份链接数据。
7. resolver 结果可丢弃并重建；不依赖跨层关联表。
8. summary 与文件 1:1；同一文件不能生成两个 summary。

## 10. 待决

1. 方法是否作为代码图节点（当前只进索引）。
2. 连接失败是否启用有界 LLM 兜底。
3. 解析缓存是否落库，还是每次现算。
4. 页面人工编辑/修订是否纳入第一版。

## 11. 非目标

- 运行图、trace、Agent 执行图；
- 多租户、权限、审计；
- 自动修改文档/代码；
- 全量 WeKnora 特性（GraphRAG、Neo4j、asynq、skills/sandbox）。
