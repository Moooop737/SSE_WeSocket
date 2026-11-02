
---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md
  - _Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md
  - _Agents/legacy/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md   # v1，仅历史；AD 编号一律以 v2 为准
---

# Knowledge Copilot - Epic Breakdown（P1 MVP + P2 方向 + 评测支线）

## Overview

本文件把 P1 的需求（PRD FR-1…FR-12）、架构不变量（ARCHITECTURE-SPINE AD-1…AD-11）拆成可实现的故事。项目单人自用、以学习 Vercel AI SDK 为第一目标。UI 走 `app/web` 的 Geist 设计系统（见 UX Design Requirements）。

**2026-10-24：P1（Epic 1–3）已收口**，Epic 1/2/3 全部 story `done`；同日追加 P2 的 Epic 4/5（方向级，详细 AC 待 story 开工前补）。

**2026-10-28：立 Epic 7「评测（eval）」**，定位为 P3 前置工程支线（Lynx 拍）；载体当天从 Langfuse Datasets / Experiments 改为**本地表 + 自建 `/evals` 面板**；旧 Epic 6（文件 URI）已于 2026-10-27 取消并折回 Story 5.2，本文件不复用该号。

**2026-10-29：立 Epic 8「Agent 工具箱」**（Lynx 拍），P2 最后一个 epic、纯增量：给 agent 加 `resource`、`codebase` 两只只读工具与 `meta`（只改当前会话标题）一只低风险写工具，并把工具层做成可扩展形状，为 P3 Agent loop 铺路。loop 编排、联网工具、AST、其他写操作、代码 RAG 都不在本格；`stopWhen(5)` 保持不动。

> **AD 编号口径**：本文件提到的 AD-1…AD-11 一律指 2026-10-15 版 SPINE。v1 已归档，同号不同义（例：v2 AD-11 才是本地安全边界）。

## Requirements Inventory

### Functional Requirements

- FR-1: 提交网页 URL → 抓取静态正文入库为 Resource；入库后才失败建 `失败` Resource，输入非法直接拒绝不建。（UJ-1）
- FR-2: 粘贴/导入 Markdown/纯文本入库为 Resource；空内容或前端判定非文本时拒绝（后端不做编码启发式）。（UJ-2）
- FR-3: 解析正文并切分为 ≥1 个 Chunk，Chunk 保留回溯到 Resource 的定位；0 Chunk → `失败(内容为空)`。
- FR-4: 为每个 Chunk 生成 Embedding 并写入检索索引，使其可被检索命中。
- FR-5: 查看知识库 Resource 列表及状态；删除 Resource（软删、后续检索不再命中；历史引用快照仍可看、标「来源已删除」；删除处理中项取消任务清孤儿）。
- FR-6: 提问 → 检索相关 Chunk → 仅依据检索内容生成回答；0 命中/空库/空查询各有明确处理，不编造；有命中时由模型判断资料是否足够。
- FR-7: 同一 Session 内多轮上下文；追问须重新检索（查询改写），不复述上一轮作依据。
- FR-8: 回答按 token 流式输出；流中断时标"回答未完整"、引用仅在 sources 完整接收后可点击。
- FR-9: 提问后到首 token 前有可见 Loading；错误/中断/超时有可理解提示。
- FR-10: 回答附 Citation，且每个 Citation 必须映射到本轮真实命中的具体 Chunk（非仅 Resource 级）。
- FR-11: Citation 可发起 Source Ref 跳转看原文片段/源位置；无源粘贴内容自动生成来源标识。
- FR-12: 默认仅本地（127.0.0.1）监听；Provider API Key 仅服务端；对外演示用只读/临时实例。

### NonFunctional Requirements

- NFR-1: 流式体验——首个可交互反馈尽量快，但不以牺牲引用准确换延迟（对齐 SM-C1）。
- NFR-2: 答案可信度——有依据问题正确且带可核对引用（SM-2，MVP 口径：关键事实能对应引用 Chunk 原文）。
- NFR-3: 入库成功率——符合 P1 抓取范围的来源入库"已就绪"比例 ≥80%（SM-3）。
- NFR-4: 安全——单人自用但守本地边界：不外泄收藏内容与密钥（FR-12）。
- NFR-5: 可演进——实现须为 P2–P5 预留接口（检索策略不硬编码进生成路径、Provider/存储走端口抽象）。
- NFR-6: 一致性——查询向量与入库向量须同模型、同 `dimension`（维度由所接模型决定，当前 1024），不符即报错、不回退静默作答；存储不设维度上限（AD-4）。

**NFR → Story 追溯：** NFR-1→2.2｜NFR-2→2.1, 2.3｜NFR-3→1.2（3.3/3.4 补度量）｜NFR-4→1.1｜NFR-5→1.1（接口形状由 AD-1 / AD-4 / AD-6 承接，`ports/` 已随架构 v2 作废）｜NFR-6→1.1, 2.1。

### Additional Requirements（来自架构 ARCHITECTURE-SPINE，仅列需 Story 落实项）

> 原块是 v1 SPINE 的逐条转写，已与 v2 编号和 as-built 脱节；这里只留需要 Story 自己落实的部分，其余直接看 SPINE。

- **分层与门**：`routes → 能力（ingest / retrieve / agent）→ adapter`；能力片之间只经 `contract.ts`，基础层只有 `adapter/contract.ts` 一道门（AD-1、AD-6）。
- **库访问**：只有 `adapter/repo/` 写 SQL、`adapter/connection/pool.ts` 建池；路由不直查库（AD-3）。hono-crud 的四表 CRUD 是 2026-10-22 的具名例外，尚未写进 AD。
- **向量**：`halfvec` 不定长列 + 按 `dimension` 分建 partial HNSW（当前只建 1024；其他维度 seq scan、结果仍正确）；维度是模型属性，不符显式失败（AD-9）。
- **混合检索**：向量 + BM25，RRF 名次融合；用户问句必须走 `match_disjunction`，不得裸交给 `@@@`（AD-8）。
- **Provider / model**：`adapter/provider/` 是唯一造客户端处，`adapter/model/` 唯一兑换 SDK 句柄处；`streamText` 住 `agent/`，`embedMany` 封装住 `adapter/model/`（AD-4）。
- **本地安全**：仅 `127.0.0.1`；Key 只从服务端 env 读（AD-11）。
- **基础设施**：ParadeDB 本地 Docker；Ollama 跑嵌入；无 starter 模板，Greenfield 在 Story 1.1 手动 scaffold。
- **一致性约定**：主键 UUID、时间 UTC ISO8601、错误 `{code,message}`；目录与命名见 SPINE「Consistency Conventions」。
- **as-built 补充（2026-10-24）**：入口目录实际是 `routes/`（SPINE 里的 `api/` 是设计名）；`ports/` 不存在，接口形状住 `adapter/contract.ts` 与各盒 `contract.ts`。

### UX Design Requirements

- 无独立 UX 规范文档。`app/web` 已形成 Geist 风格的设计系统（纸/光/呼吸三层、token 四档、`Agent/summary/` 记口径），P1 验收只要求功能可用，视觉细节由 Lynx 浏览器手测。
- 早期「不设视觉/token 体系」的说法已作废（2026-10-24 对账；原 retro 项 epic-1-retro-4 由此关闭）。

### FR Coverage Map

- FR-1: Story 1.2 - URL 抓取入库（含失败/校验/幂等）
- FR-2: Story 1.3 - Markdown/纯文本导入
- FR-3: Story 1.2 - 解析与分块（含 0 Chunk 失败）
- FR-4: Story 1.2 - 向量化并写入检索索引（Ollama Qwen3 1024 维）
- FR-5: Story 1.4 - 列表/软删（处理中取消）；降级 AC 见 Story 2.3
- FR-6: Story 2.1 - 混合检索问答（含相关性下限/空库/空查询）
- FR-6 生成半: Story 2.6 - 检索工具化（回答依据工具返回的 Chunk；2.1 划走给 2.2 的"生成仅依据 Chunk 的回答"那一半，2.2 只交付了流式，依据这一半由本格接上）
- FR-7: Story 2.5 - 会话内多轮（查询改写 + 重检索）
- FR-8: Story 2.2 - 流式输出（含中断保护）
- FR-9: Story 2.2 - Loading 与错误/超时提示
- FR-10: Story 2.3 - 引用标记（映射真实命中 Chunk）
- FR-11: Story 2.4 - 原文回链 Source Ref
- FR-12: Story 1.1 - 本地安全边界 + fail-fast（127.0.0.1 + Key env）
- Epic 3: 无新增 FR（P1.x 工程支线：观测与 trace）
- Epic 4: 无新增 P1 FR（P2：结构化输出与渲染）
- Epic 5: 无新增 P1 FR（P2：文件与存储）
- Epic 7: 无新增 P1 FR（P3 前置工程支线：评测，服务 SM-2 / NFR-2）

## Epic List

### Epic 1: 搭好底座，把资源变成可查知识库
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-12

### Epic 2: 向知识库提问，得到带引用、可回原文的流式回答
**FRs covered:** FR-6, FR-7, FR-8, FR-9, FR-10, FR-11

### Epic 3: 让链路可见 — 观测与 trace
**Covers:** 无新增 FR；P1.x 工程支线，为 NFR-3/NFR-5 提供度量与演进底座

### Epic 4: 结构化输出与渲染（P2 主线）
**Covers:** 无新增 P1 FR；P2 能力项（资源画像 + Markdown/表格渲染 + 表格导出）

### Epic 5: 文件与存储（P2 工程支线）
**Covers:** 无新增 P1 FR；MinIO 原始文件归档、文件上传、代码库 ZIP（仅文件管理）

### Epic 7: 评测（eval）（P3 前置工程支线）
**Covers:** 无新增 P1 FR；本地表 + 自建 `/evals` 面板，把 SM-2 的人工抽样升级为可复现指标，为 P3 Agent loop / 联网工具改动提供前后对照

### Epic 8: Agent 工具箱（P2 收尾）
**Covers:** 无新增 P1 FR；给 agent 扩两只只读工具（`resource` / `codebase`）+ 一只会话改名工具（`meta`），并把工具层做成可扩展形状，为 P3 Agent loop 铺底

> **2026-10-24 追加**：Epic 4/5 为 P2 方向级条目；本文件只写到方向与未决项，详细 AC 在 story 开工前再补。Epic 3 收口后再开工。
>
> **2026-10-28 追加**：Epic 7 为 P3 前置工程支线（评测），同为方向级；每格开工前按 §二 收口 `OQ-7.x-n` 并补详细 AC。
>
> **2026-10-29 追加**：Epic 8 为 P2 最后一个 epic（纯增量），详细 AC 已写在本节；每格开工前只需收口对应的 `OQ-8.x-n`。

---

## Epic 1: 搭好底座，把资源变成可查知识库
本地能跑起来，往知识库添加网页 URL / Markdown 笔记，并查看、删除资源（带清晰入库状态）。

### Story 1.1: 本地骨架 + 基础设施 + 安全边界
**Implements:** FR-12（+ NFR-4/5/6 的地基）

As a 项目所有者 Lynx（单人开发者），
I want 在本地把 Hono 后端 + Vite/React 前端跑起来并连上 ParadeDB 和 Ollama，
So that 后续入库/问答有可运行的地基，且不泄露内容与密钥。

**Acceptance Criteria:**

**Given** 仓库刚 scaffold（Hono + Node 后端、Vite + React + TS 前端）
**When** 本地启动开发服务
**Then** 后端仅监听 `127.0.0.1`，健康检查端点返回 200
**And** 迁移包含 `resources/chunks/embeddings/sessions/messages` **全部 5 张表**（业务 Story 不再动态建表，AD-2）
**And** ~~`ports/` 下存在 `Repository / Retriever / Embedder / ChatModel` 四个接口文件（可仅导出类型），能编译（NFR-5）~~ **2026-10-15 架构 v2 起作废**：`ports/` 不再存在，接口形状住 `adapter/contract.ts` 与各能力盒的 `contract.ts`（AD-6）；NFR-5 的“可演进”由 AD-1 / AD-4 / AD-6 承接。
**And** ParadeDB（Docker，含 pgvector + `pg_search`/BM25）连接成功、Ollama 嵌入端点可达（对字符串返回 1024 维向量）
**When** 必需的 DeepSeek/百炼 API Key 环境变量缺失
**Then** 启动阶段 fail-fast 并明确提示缺哪个 Key（不等首次请求才 401/500）
**When** ParadeDB 或 Ollama 不可达
**Then** 健康检查返回明确 degraded/error 状态，拒绝后续入库/问答而非静默超时
**And** DeepSeek/百炼 API Key 仅从服务端环境变量读取，不在前端构建产物中暴露
**And** 应用启动时扫描 `resources` 中 `status='处理中'` 的记录，转为 `失败(入库中断)` 并清理其残余部分 Chunk（无孤儿向量）

### Story 1.2: 添加网页 URL 入库
**Implements:** FR-1, FR-3, FR-4

As a Lynx，
I want 粘贴一个文章 URL 就把它抓取、分块、向量化入库，
So that 这篇资源能后续在问答中被检索到。

**Acceptance Criteria:**

**Given** 应用已运行、Story 1.1 迁移已建表
**When** 提交一个有效且可静态抓取正文的 URL
**Then** 经 Repository 端口写入该 Resource，状态从 `处理中` → `已就绪`；每个 Chunk 写入 `halfvec` 向量（`dimension` 记实际维度，当前 1024）+ BM25 可检索内容
**And** Chunk 保留可回溯到 Resource 的定位信息（`chunk_index`/起止）
**And** 入库管线入口支持取消信号（AbortController），供 Story 1.4 取消进行中的 fetch/embed 并丢弃未完成 Chunk
**When** 解析后得到 0 个 Chunk
**Then** Resource 转 `失败(内容为空)`，不进入 `已就绪`
**When** embed 步骤对任一 Chunk 失败（如 Ollama OOM）
**Then** Resource 转 `失败(embedding_error)`，清理或标记已写 Chunk，不留下"已就绪但缺向量"
**When** 同一 URL 已存在为 Resource
**Then** 按幂等策略处理（拒绝或更新，二选一），不产生重复 Resource/Chunk

> **2026-10-24 对账**：as-built 只拒绝 `processing` / `ready` 的同 URL（`findActiveBySource`，返回 409 `E_DUPLICATE`）；`failed` 可重抓；`uri.canonicalize()` 尚未落地，当前按原文 URL 相等判重。
**When** 提交非法/空/非 P1 支持类型的输入
**Then** 直接拒绝并提示，不创建 Resource
**When** 已进入入库后才失败（不可访问/抓取为空）
**Then** 创建一个 `失败` Resource 附原因，其余资源不受影响
**And** 命中 JS 渲染/反爬来源时提示"可能抓不全"，不阻断其他入库

### Story 1.3: 导入 Markdown / 纯文本
**Implements:** FR-2

As a Lynx，
I want 把本地笔记或粘贴的 Markdown/纯文本加入知识库，
So that 我的笔记也能被问答检索。

**Acceptance Criteria:**

**Given** 应用已运行
**When** 粘贴或导入 Markdown/纯文本内容
**Then** 跳过 fetch，内容直接进入 parse → chunk → embed → 写；复用 Story 1.2 的 chunk/embed/写三段
**And** `markdown` 与 `plaintext` 在 P1 **共用同一条 parse 分支**（正文原样交分块器，代码块/表格由 legacy 分块器的保护段兜住）；`content_type` 仅作存档与后续分支的预留位，不改变当前处理路径
**When** 内容无效
**Then** 在**创建 Resource 行之前**拒绝、不创建 Resource；P1 的「无效」只有两种 —— body 非合法 JSON 对象（`E_BAD_JSON`）、`content` 为空白串（`E_EMPTY_CONTENT`）
**And** **不做内容级「不可读/编码异常」启发式检测**：类型判定归前端（文件按后缀名、粘贴由用户自选 markdown / plaintext，图片等非文本由前端 accept 与后缀名挡在上传层），后端只收到字符串、不猜内容质量
**And** 粘贴内容**不去重**（同一段粘两次 = 两条 Resource）；无来源内容的 `data_uri` 保持自动生成的 uuid urn，其展示语义属 FR-11

### Story 1.4: 知识库查看与删除
**Implements:** FR-5

As a Lynx，
I want 看到库里有哪些资源及各自状态，并能删除，
So that 我能管理自己的知识库。

**Acceptance Criteria:**

**Given** 已有若干 Resource
**When** 打开知识库区
**Then** 列出 Resource 及其 `处理中/已就绪/失败` 状态
**When** 删除某个 Resource
**Then** 软删（标记 `deleted_at`）并从检索索引移除其 Chunk/Embedding，后续检索不再命中；供历史引用降级所需的快照在写入时已内嵌于 messages（不依赖被删的 Chunk 行）
**And** 删除 `处理中` 的 Resource 时，通过 Story 1.2 的取消信号中断入库任务，待当前 DB 事务完成/回滚后清理部分 Chunk（无孤儿向量，无竞态）

---

## Epic 2: 向知识库提问，得到带引用、可回原文的流式回答
用自然语言提问 → 混合检索 → 逐字流式、只依据资源作答，支持多轮追问，回答带引用、可点击回原文片段。

### Story 2.1: 混合检索问答（基础）
**Implements:** FR-6

As a Lynx，
I want 提问后基于知识库检索得到只依据资源的回答，
So that 我能快速找回资源里的内容且不被编造。

**Acceptance Criteria:**

**Given** 知识库已有已就绪的 Resource
**When** 提交一个有依据的问题
**Then** 混合检索（向量 HNSW + ParadeDB BM25）命中相关 Chunk，生成仅依据这些 Chunk 的回答；经 Repository 端口写入 `sessions`/`messages`
**And** 查询向量与入库向量须同模型、同 `dimension`；**维度不符返回明确错误并拒绝作答，不回退 BM25-only 静默作答**；若查询维度**未建 partial 索引**则走 seq scan，结果仍正确、不视为错误（AD-4/NFR-6）
**When** 检索 0 命中
**Then** 回复"知识库中未找到相关内容"，不作答
**And** 有命中时由模型判断资料是否足够；阈值只兜字符噪声（as-built `RETRIEVAL_MIN_SIMILARITY=0.42`、BM25 只去 0 分；2026-10-14 Lynx 拍）
**When** 知识库为空
**Then** 提示"尚未添加任何资源"（区别于"未找到相关内容"）；**"为空"= 未软删的行为 0，含"全部已删除"这一情形**，不另设第三种话术（2026-10-14 Lynx 定，评审 D5）
**When** 存在 Resource 但无已就绪的（全为处理中/失败）
**Then** 提示"暂无可用资源（X 条入库失败/处理中）"，区别于"尚未添加"
**When** 空/纯空白提问
**Then** 拒绝并提示

> **2026-10-24 对账**：`/chat` 的 as-built 只有一句 instructions 让模型在 0 命中时说“知识库没有答案”；空库 / 全无 ready / 无相关内容这三种提示的**后端分流尚未实现**（`resourceCounts()` 没有调用点）。本 AC 仍是目标口径，缺口见 `deferred-work.md`「三态提示不可区分」。

### Review Findings（code review of Story 2.1，2026-10-14）

四层 lens、15 文件 / +594 −18；6 条 decision 全拍、9 条 patch 已修、3 条 defer 记账。完整明细（含 rejected 段）见 `_Agents/legacy/reviews/review-2026-10-14-epic2-story2-1-findings.md`。

- 关键决议：维度闸门改三态、`retrive/` 拼写修正、软删库不另设话术、命中响应体映射随 `UIMessage` 地基消解。
- 关键 defer：本 story 零 Vitest 覆盖、检索未加 `status='ready'` 谓词、两路皆空是死分支——均已进 `deferred-work.md`。

### Story 2.2: 流式输出与 Loading
**Implements:** FR-8, FR-9

As a Lynx，
I want 回答逐字流式出现并有加载反馈，
So that 长回答不必干等。

**Acceptance Criteria:**

**Given** Story 2.1 的问答可用
**When** 提问
**Then** 后端用 AI SDK UI Message Stream 输出，前端 `useChat` 逐字渲染
**And** `useChat` 预留 data part handler（本 Story 可仅接收不渲染），避免 Story 2.3 改动流消费逻辑
**And** 首个 token 前有可见 Loading
**When** 请求出错/中断/首 token 超时
**Then** 给出可理解提示（超时有上限）
**When** 两个连续 token 间隔超过 inter-token 超时
**Then** 视为流中断，标"回答未完整"并关闭连接
**When** 上一轮流未结束又发新提问
**Then** 取消前一条流（或等待/拒绝，三选一），不在同一 Session 交错两条流
**When** 流中途断开
**Then** 已产出部分标"回答未完整"；引用可点击的条件为前端已完整接收 `tool-retrieve` part 的 output 且命中带 `chunkId`（与入库无关）

> **2026-10-20 对账**：流式主体/前端接线已提交（`7895c31`）；超时条款（首 token / inter-token / 总时长）按 Lynx 2026-10-15 定案推后，`CHAT_TIMEOUT_*` 未落，见 `deferred-work.md`。

### Story 2.3: 引用标记与映射
**Implements:** FR-10, FR-5(降级)

As a Lynx，
I want 回答里的每个结论都能对应到具体出处，
So that 我能一眼核对原文。

**Acceptance Criteria:**

**Given** 流式问答已可用
**When** 生成有依据的回答
**Then** 模型在正文写命中 chunkId 的前 8 位（如 `[aefd870b]`），前端同时兼容 `[n]`；命中从同一条流里的 `tool-retrieve` part output 读取（原 `sources` data part 方案由 2.6 取代），每条映射到本轮真实返回的 Chunk；展示编号由界面按正文首次出现顺序重排，数字名次不跨轮、8 位 id 可跨轮（2026-10-21 as-built）
**And** 每个 Citation 必须映射到本轮真实命中的具体 Chunk（非仅 Resource 级）；模型自造索引视为无效
**When** 出现 `[n]` 但 n 超出本轮命中数组范围（越界索引）
**Then** 渲染为不可点击纯文本或标"引用异常"，前端不因找不到 chunkId 而报错
**When** 某 Resource 被删除
**Then** 历史回答中指向它的 Citation 仍可打开 message 内嵌快照，但抽屉/引用处标注"来源已删除"（2026-10-21 Lynx 拍：可看优先，不改为不可点击；不请求已删 Chunk）

> **2026-10-20 对账**：前端已按 `tool-retrieve` output 渲染引用/面板/抽屉（`ask.tsx`、`referencesOf`）。
> **2026-10-24 对账**：来源删除后的降级已于 2026-10-21 实现——`GET /resources/:id` 404 时抽屉仍渲染消息内快照并标「来源已删除」。

### Story 2.4: 原文回链 Source Ref
**Implements:** FR-11

As a Lynx，
I want 点击引用看到对应的原文片段，
So that 我确认出处无需重开原文。

**Acceptance Criteria:**

**Given** 回答带可解析的 Citation（其数据已在 Story 2.3 的 `tool-retrieve` output 随消息缓存在前端，无需二次请求）
**When** 点击某 Citation
**Then** 展示对应的原文片段 + 来源标识（URL/文件名）
**When** 来源是无文件名/无 URL 的粘贴内容
**Then** 自动生成来源标识（命名 + 时间/内容指纹）；内容指纹重复时追加序号/时间戳区分，保证 Source Ref 指向唯一 Resource
**And** 若引用的 chunkId 已不存在（后端被删），仍展示消息内快照并标注"来源已删除"，不返回 500（2026-10-21 Lynx 拍；原 410 条款作废）
**And** 字符级高亮为增强项，本 Story 不强制

> **2026-10-20 对账**：点引用/命中行开抽屉、显示 `content` + 块号/偏移 + `source` 已落。
> **2026-10-24 对账**：`chunkId` 已不存在时的 410 条款作废；现为快照可看 + 标「来源已删除」（2026-10-21 拍）。

### Story 2.5: 会话内多轮
**Implements:** FR-7

As a Lynx，
I want 在一个会话里基于上一轮继续追问，
So that 能逐步深化而不重复描述上下文。

**Acceptance Criteria:**

**Given** 同一 Session 已有一轮问答
**When** 发出指代型追问（如"第二个结论展开讲讲"）
**Then** 历史（最近 6 轮、只回灌 text parts）随请求交给模型，由模型自己把追问展开成独立检索 query 后调用 retrieve，回答基于新命中的 Chunk（2026-10-21 Lynx 拍：不另设查询改写调用，只提供一个 agent + 工具）
**When** 查询改写失败/返回与原始追问实质相同
**Then** 仍用原追问正常检索，无果走标准"未找到"，不报错（日志记改写未生效）
**And** 上一轮回答只作上下文，不作为引用依据
**When** 历史消息 token 接近模型上限
**Then** 截断最早轮次保留近 N 轮，或提示"会话过长，建议开始新会话"
**And** P1 支持多会话历史列表：后端 `GET /sessions` 已落，前端列表在 Build 3 接入；Session/Message 落 ParadeDB，重启后会话历史仍可用
**And** 会话标题可修改：`PATCH /sessions/{id}` 改 title；前端列表在 Build 3 接。

> **2026-10-21 范围扩展（Lynx 拍）**：P1 从“单个活跃 Session”扩为“支持多会话历史列表”；原句“不做多会话历史列表”作废，PRD FR-7 / §6.2 / Assumptions 已同步。

> **2026-10-21 对账**：多轮已落——`/chat` 收 `{query, sessionId}`，服务端按 sessionId 读库历史（只取 text parts、截断最近 6 轮）交给 `streamText`；user/assistant 消息经 `createMessage` 落库（parts 真源），前端切会话时从 `GET /sessions/{id}/messages` 恢复历史。真跑两轮实测：第二问「那 ef_construction 呢」由模型自己展开成完整检索词，无需额外改写调用。查询改写条款已按 Lynx 决议改为「模型自建检索词」。

---

### Story 2.6: 检索工具化（模型自己调用检索）
**Implements:** FR-6（生成半：回答依据检索到的 Chunk）；为 FR-10 换地基（"本轮真实命中" → "本轮工具返回的 Chunk"）

> **范围变更来源（2026-10-16，Lynx 拍）**：本 Story 是 PRD §7 **P3**「检索/联网升级为工具」里被**提前**的那一格。AGENTS.md §五 已改成「一处有期限的例外」。同属 P3 的 **Agent loop（多步循环）与 `agent/{skill,persona,mcp}`、`trace/` 那些空盒不在本 Story**，已记 `deferred-work.md`。
>
> **为什么这一格值得提前（实测前提）**：`app/server/src/routes/chat/chat.ts:37-39` 装配了 `retriever` 却没用，`agent/chat/chat.ts:15` 只把原始提问喂给 `streamText` —— 今天 `/chat` 的回答**不依据库**；`app/web/src/ui/ask.tsx:106` 的命中面板是前端另打 `POST /retrieve` 画的，与回答各走各的。2.1 划给"生成半"的那条线一直没接上，工具化正是接法之一。

As a Lynx，
I want 模型自己决定调用检索工具、并基于工具返回的 Chunk 作答，
So that 回答真依据我的知识库，同时练通 AI SDK 的 tool calling。

**Acceptance Criteria:**

**Given** `POST /chat` 的 body 为 `{query, sessionId}`（`sessionId` 必填，2.5 起；`limit` 已删；条数由模型 `topK` 决定）与状态码口径不变
**When** 提问
**Then** 服务端把检索注册成 tool 交给 `streamText`，模型执行工具后作答，回答内容依据工具返回的 Chunk
**And** 工具调用有界：`stopWhen: stepCountIs(5)`（最多 5 步 / 4 次检索往返，2026-10-21 Lynx 拍，原为 2）。允许模型换词重查，但不开无限循环、不串联其他工具。实物依据：`ai@7.0.141` 已删 `maxSteps`，`streamText` 默认 `stopWhen = isStepCount(1)`（`node_modules/ai/dist/index.js:8783`）——默认值下工具调完即停、答不出东西
**When** 空库 / 全无 ready / 库里没有相关内容
**Then** 三条确定性提示仍是 **200 答案体**（2.1 口径：拒答判据交给模型，阈值只兜字符噪声）
**When** 检索侧判 `E_DIMENSION_MISMATCH`（`E_DIMENSION_UNKNOWN` 已随 DI 改造退役）
**Then**（2026-10-16 Lynx 定案 D6，推翻原句"仍是 409"）`/chat` 回 **200**、错误以结构化 `{error:{code,message}}` 出现在 `tool-retrieve` 的 output 里、由模型带着那句原因收场——因为检索一进工具就发生在 SSE 首帧已发出之后，状态码是一次性的；`/retrieve` 那条路 409 照旧不变
**And** `POST /retrieve` 端点保留且行为不变（它仍是单独验检索的口子，且前端在用）
**And** 工具返回的 Chunk 随 UI Message Stream 的 parts 下发；`[n]` 标记与引用渲染归 Story 2.3（2026-10-20 前端已接）
**When** 模型未调用工具就直接作答
**Then** 回答不得假装依据知识库作答（提示词约束；是否用 `toolChoice` 强制，是实现取舍，见 spec 的 Decisions）

> **2026-10-21 范围调整（Lynx 拍）**：步数上限从 `stepCountIs(2)` 调到 `stepCountIs(5)`——允许模型在有界次数内换检索词重查；原「整趟只有一次工具往返」作废。Agent loop 的其余能力（skill/persona/mcp/trace、跨工具编排）仍不在 P1。

---

## Epic 3: 让链路可见 — 观测与 trace

> **范围说明（2026-10-21 立，2026-10-24 收口对账）**：PRD §7 的 P1–P5 没有观测阶段；本 Epic 按 **P1.x 工程支线**记账，不改变 P2–P5 的 AI SDK 能力主线，也不新增产品 FR。它填 `app/server/src/trace/{systemtrace,llmtrace}` 两只盒——`kbtrace/` 最终未建，3.3 的 stage runner/sink 合并进 `systemtrace/`（Story 3.3 标题里的 kbtrace 只作旧代号）。**as-built 已有本地 `/traces` 与 `/chats` 观测页**（`routes/observability.ts` + 前端），原句「不做产品内观测面板」按现状收窄为「不引入 Grafana/Prometheus、不做远程面板」；正式范围变更未走 correct-course，已记 `deferred-work.md`。
>
> **切法：endpoint 优先**。先做 Sentinel 式的**通用 endpoint 壳**：所有路由统一 entry/exit，一条 HTTP 请求一行 `traces`，只记公共字段；再按 endpoint 加明细——3.2 chat、3.3 retrieve、3.4 ingest。聊天里的 `retrieve` 工具**不单独开 trace、也不写本地 stage**，明细全在远程 Langfuse 的 tool span。
>
> **表（2026-10-21，按 endpoint 拆 + stage 合并；2026-10-22 增 payloads）**：本地 **2 张表**——`traces`（公共 11 列 + `langfuse_trace_id` + `payloads jsonb`，一次 endpoint 请求一行）+ `trace_stages`（1:N 阶段表，`input/output` 用 jsonb，形状按 stage 固定）。两张表已落在 `app/server/db/migrations/20261021150000_create_observation_tables.sql`；后续 story 只写数据，不再建表/加列，除非设计变更。**chat 的全部 trace（模型/step/tool/embed/检索）交给远程 Langfuse**，本地不建 `chat_traces`；本地只留 `/chat` 的 endpoint 公共行和 `langfuse_trace_id` 外链。`pipeline` 不落列：`trace_id` join `traces.route` 就知道是 retrieve 还是 ingest。不建 `observations`/`spans`/`retrieve_traces`/`ingest_traces`/`chat_traces`/`feedback`/`eval` 表。`trace_stages` 是**阶段专用**表，不是通用 attributes：只放 query/URL/ids/计数/分数，不写 chunk 正文、不写完整 embedding 向量。Langfuse 外部存储不算 app 迁移。
>
> **不在本 Epic**：反馈、golden set、recall@k/MRR、LLM-as-judge 等 evaluation 能力——先只把 observation 做扎实，评测另立 Epic（2026-10-28：已立为 Epic 7）。
>
> **顺序**：3.1 通用 endpoint 壳（middleware + repo + route + 公共列 + 日志 helper）→ 3.2 chat 专属 → 3.3 retrieve 专属 → 3.4 ingest 专属。
>
> **一致性不变式（2026-10-21 Lynx 拍）**：每个 stage 只能有一个 sink。**Langfuse 记录的绝不写 `trace_stages`；不被 Langfuse 记录的必须写 `trace_stages`。** 因此 chat 的 model/step/tool/retrieval/embed 全在 Langfuse，本地 `trace_stages` 为 0；`/retrieve` 与 `/resources` 的 stage 全在本地，且它们的 `embedMany` 必须显式传 `telemetry: { isEnabled: false }`，否则全局 Langfuse integration 会顺带记走，破坏不变式。sink 与 telemetry 同选：DB sink → `isEnabled:false`；Langfuse sink → 开启。**例外**：测试/未接线路径用 `NoopStageSink`，两边都不写；已接线的产品路径不得出现 no-op。
>
> **流式边界**：通用壳在 handler 返回 Response 时先按“到响应头”的耗时记一版；`/chat` 是 SSE，3.2 在流结束/中断时用整条流的耗时与最终状态覆盖同一行，不能把“返回 Response”当成最终结果。

### Story 3.1: 通用 endpoint trace（Sentinel 式壳）
**Implements:** 无 FR；观测地基（支撑 NFR-3/NFR-5）
**Depends:** 无（Epic 3 第一格）

As a Lynx，
I want 每个 endpoint 都自动有一条统一的入口/出口 trace，
So that 先能回答“哪个端点、多久、成没成”，不用为每个端点各写一套。

**Acceptance Criteria:**

**Given** 迁移已执行
**When** 查 `traces` 表
**Then** 迁移已落好 `traces`：`id`（uuid PK；2026-10-22 由 `trace_id` 改名，2026-10-30 由 text 收窄为 uuid）、`session_id`、`resource_id`、`route`、`http_status`、`started_at`、`ended_at`、`duration_ms`、`status`、`error_code`、`langfuse_trace_id`、`created_at`、`payloads`（2026-10-22 增）
**And** `session_id` 与 `resource_id` 是请求级关联键：chat 填前者、ingest 填后者，其余为 null，不在明细表重复
**And** `route` 存 `METHOD + 匹配到的路由模板`（如 `POST /chat`、`POST /resources`、`GET /resources`、`POST /retrieve`），不存带 id 的原始 path
**And** 没有 `observation_kind`/`parent_observation_id`/`attributes`；3.1 只写公共行，3.2/3.3/3.4 只写明细，不再建表/加列
**And** 索引：`(started_at desc)`、`(session_id, started_at desc)`、`(resource_id, started_at desc)`、`(route, started_at desc)`；`trace_id` 2026-10-30 由 text 收窄为 uuid（OTel 32 位 hex 只存 `langfuse_trace_id`）

**Given** 任意非跳过前缀的请求（`/health`、`/traces`、`/trace`、`/observability`、`/doc`；未匹配到 handler 的路径也不记）
**When** 请求进入
**Then** 写一行 `traces`：`trace_id`、`route`、`started_at`、`status='running'`
**And** 响应头带 `X-Trace-Id`；该请求的日志经 `systemtrace/log.ts` 的 helper 自动带同一个 `trace_id`
**When** handler 返回非流式 Response
**Then** 更新同一行的 `ended_at`/`duration_ms`/`http_status`/`status`（ok/error）/`error_code`
**When** handler 返回 SSE（`/chat`）
**Then** 先按响应头耗时更新 `duration_ms`/`http_status`/`status='ok'`；3.2 在流结束/中断时用整条流耗时与最终状态覆盖同一行
**And** 跳过前缀（`/health`、`/traces`、`/trace`、`/observability`、`/doc`）与未匹配路径自身不写 trace 行，避免读 trace 又产生 trace

**Given** trace 已写入
**When** `GET /traces/:traceId`
**Then** 3.1 先返回 `200 { trace: {...} }`；3.2 加 `chat`、3.3 加 `stages`，最终形状见 3.3
**When** traceId 不存在
**Then** `404 {code:'E_TRACE_NOT_FOUND', message:'观测不存在'}`
**When** `GET /traces?page=1&per_page=50`
**Then** 按 `started_at desc` 返回最近 N 条（`per_page` 默认 50、上限 200；2026-10-22 起由 hono-crud 的 list 提供，不再用 `limit`）

**Given** traces 写入/更新失败（如库不可达/表缺失）
**When** 业务请求正常
**Then** 业务响应不变；只记一行 `E_TRACE_WRITE`，不把 500 冒给客户端
**And** traces 公共字段只存计数/耗时/状态/模型名等元数据；`payloads` 仅按下方 2026-10-22 规则记录，不存 chunk/answer 正文与 Key

**And** Repo 写读都经 `Repo` 端口（`adapter/contract.ts` 的方法 + `adapter/repo/` 实现），路由不直查库；至少 `insertTrace` / `finishTrace` / `getTrace` / `listTraceStages`。**2026-10-22 例外**：四表 CRUD 由 `routes/crud.ts` 的 hono-crud 提供（traces 的 list/create/update/delete 在其中），这是一处尚未写进 AD-3 的具名例外。
**And** 3.1 只写 `traces` 的公共行；3.2/3.3/3.4 只写明细，不建表/加列；`trace_stages` 与 `langfuse_trace_id` 已在迁移中
**And** `traces` 公共表 11 列 + `langfuse_trace_id` + `payloads`；`trace_stages` 一行一个 stage；新增公共列必须能用于筛选/排序/对比
**And** 真跑验收：`curl -i POST /chat` 取 `X-Trace-Id` → `GET /traces/:id` 回读；`GET /traces?per_page=5` 能看到最近请求；`/health` 不产生行；psql 核对；不新建测试文件（测试是否补归 Lynx）

> **2026-10-22 设计变更（payloads）**：`traces` 增加 `payloads jsonb`。失败请求（`>=400`）记 request/response 两侧；成功只对 `POST /sessions`、`PATCH /sessions/:id` 记 request，`POST /resources` 只留元数据（`url/content_type/title/chunker/content_length`），`content` 正文不落。`/chat`、`/retrieve`、`/traces*`、`/health`、`/doc` 永不记。单侧 body 上限 3KB，超出/非 JSON 只留 `omitted` 标记；headers 只记白名单（request: content-type/content-length/accept/user-agent/origin；response: content-type/content-length/cache-control），Key/Cookie 永不落库。`GET /traces` 列表不返回 `payloads`，`GET /traces/:id` 返回。

### Story 3.2: chat endpoint trace（llmtrace）
**Implements:** 无 FR；AI SDK telemetry 练习
**Depends:** 3.1；session 归因等 2.5

As a Lynx，
I want `/chat` 的全部 trace 交给远程 Langfuse，
So that 模型、step、token、工具、检索明细都在 Langfuse 看，本地只留一条 endpoint 公共行和外链。

**Acceptance Criteria:**

**Given** Langfuse 三件套（`LANGFUSE_PUBLIC_KEY/SECRET_KEY/BASE_URL`）未配置
**When** 启动并 `POST /chat`
**Then** Langfuse 导出关闭；本地 `traces` 只写公共行，没有 chat 明细；启动只多一行 `I_TRACE_EXPORT_DISABLED`，不阻塞启动

**Given** Langfuse 已配置
**When** 一次带 `retrieve` 工具调用的 `/chat` 完成
**Then** Langfuse 里出现一条 trace：root（`functionId='chat'`）→ step → model call → tool `retrieve` → 可选 embed；模型、step、token、工具入参/输出、检索明细全部在 Langfuse
**And** 3.2 在流结束/中断/出错时用整条流的值覆盖 3.1 先写的那一行：`ended_at`/`duration_ms`/`status`（ok/error/cancelled）/`error_code`；不是通用壳在返回 Response 时写
**And** 把 Langfuse 的 trace id 写回 `traces.langfuse_trace_id`；`GET /traces/:id` 的 `trace` 对象能读到它，聊天明细去 Langfuse 看
**And** 本地 `trace_id` 是 3.1 的 endpoint trace id，不拿它去改 Langfuse 的 trace id；跨系统关联只靠 `traces.langfuse_trace_id`
**And** 有 2.5 的 sessionId 时，本地 trace 可按 session 过滤；没有时不伪造
**And** 不打印 Key；Langfuse 不可达时 `/chat` 正常返回，导出失败只记一行警告

**And** 启动装配只在 `src/index.ts` 最前面 import 一次；测试/脚本 import 业务模块不会顺手注册
**And** 依赖用 `@langfuse/vercel-ai-sdk@6` + `@langfuse/otel@6` + `@opentelemetry/sdk-trace-node`（或官方 `sdk-node`）；不退到已废弃的 `langfuse-vercel`

> **2026-10-24 review 注**：as-built 实际用 `@opentelemetry/sdk-trace@2.12` + `@opentelemetry/context-async-hooks`，未用 `sdk-node`。代价是 3.3 要手动补 `AsyncLocalStorageContextManager`；差异已记 `deferred-work.md`。
**And** `langfuse_trace_id` 已在迁移中（可空）；3.2 只写它，不建 `chat_traces`，也不写 `trace_stages`
**And** chat 的 `embedMany` 保持 telemetry 开启；retrieval 的 5 个 stage 由 Langfuse sink 记为 tool span 下的 child spans，本地 `trace_stages` 0 行
**And** `/chat` 里的 `retrieve` 工具只回写 Langfuse 的 tool span，不另开本地 trace

> **D1（2026-10-21 Lynx 拍）**：chat 全量交**远程 Langfuse**，本地不建 chat 明细表。代价：chat 的 prompt、命中、回答、工具输入输出会离开本机，FR-12 的本地边界按此决定放开；要遮敏用 Langfuse `mask`，要收回就改自建或关 `recordInputs/recordOutputs`。
>
> **写入口径（2026-10-21 收窄）**：本地 `traces` 只存 endpoint 公共摘要 + `langfuse_trace_id`；**不落 chat span 树、不落 chat 明细**。Langfuse 是 chat 的唯一明细来源；本地不从 Langfuse 回读。
>
> **字段归属**：本地 `trace_stages` 只服务 `/retrieve` 与 `/resources`；chat 的检索/模型/工具明细都在 Langfuse，不写本地 stage 表。
>
> **2026-10-22 实现注**：AI SDK 的根 span 不设全局 active，且要到流消费时才创建；`getActiveTraceId()` 与 `propagateAttributes` 在流外都不可靠。最终由自定义 `SpanProcessor` 在根 span（`gen_ai.agent.name='chat'`）`onStart` 时用 ALS 的本地 trace_id 查 sessionId，直接写 `session.id` / `langfuse.trace.name` / tags / metadata，并捕获 `langfuse_trace_id`。Langfuse Cloud v3 的 `/api/public/traces/{id}` 已弃用（2026-11-16 移除），观测回读改用 `/api/public/v2/observations`。业务模块经 `trace/llmtrace/bridge.ts` 使用 Langfuse，真实 OTel 实现只在 `src/index.ts` 启动时装配，测试 import 业务模块不会加载 OTel。

> **2026-10-24 收口**：四镜头 code review 完成；findings 见 `_Agents/implementation-artifacts/review-2026-10-24-epic3.md`。本轮按 Lynx「仅 review」不改代码，Epic 3 按已知问题收口。

### Story 3.3: retrieve endpoint trace（kbtrace 旧代号；实际住 systemtrace）
**Implements:** 无 FR；检索观测（不做 evaluation）
**Depends:** 3.1；检索工具口径以 2.6 收口为准

As a Lynx，
I want `/retrieve` 按阶段记录输入/输出，
So that 我能按 `dimension_check → embed_query → vector_recall → bm25_recall → rrf_fusion` 还原一次检索。

**Acceptance Criteria:**

**Given** 迁移已执行
**When** 查 `trace_stages` 表
**Then** 列：`id`（uuid PK；原 `trace_stage_id`，2026-10-22 主键统一改名）、`trace_id`（uuid FK；2026-10-30 由 text 收窄）、`stage`（text）、`input`（jsonb）、`output`（jsonb）、`duration_ms`（integer）、`status`（text）、`created_at`（timestamptz）
**And** 本 story 只服务 `POST /retrieve`；`stage` 至少覆盖 `dimension_check|embed_query|vector_recall|bm25_recall|rrf_fusion`；索引 `(trace_id, created_at)`
**And** 不落 `pipeline`/`attempt`：`trace_id` join `traces.route` 就知道是 retrieve；`/retrieve` 一次请求只有一条检索流水线
**And** `input/output` 是阶段专用 payload：不写 chunk 正文、不写完整 embedding 向量；形状按下表固定

**Given** 一次 `POST /retrieve`
**When** 检索执行
**Then** 每个实际执行的 stage 写一行，`trace_id` 指向 3.1 的端点行
**And** `GET /traces/:id` 的最终形状为 `{ trace, stages:[...] }`；`stages` 按 `created_at` 排序
**When** stage 抛错（如 `E_DIMENSION_MISMATCH`）
**Then** 该 stage `status='error'`，后续 stage 不写；端点行由 3.1 的通用错误路径收口

**And** stage 埋点在 `Retriever.search`（能力层），不在 `/retrieve` 路由：`/retrieve` 路由注入 DB sink 写 `trace_stages`；chat tool 注入 Langfuse/OTel sink，把**全部 5 个** retrieve stages 写成 chat trace 下的 child spans（不是只留一个 tool span 壳）
**And** `/retrieve` 的 `embedMany` 传 `telemetry: { isEnabled: false }`，所以 Langfuse 里没有这条 embed/stage；本地 `trace_stages` 恰好 5 行
**And** chat tool 的 `embedMany` 保持 telemetry 开启；本地 `trace_stages` 0 行。父 trace 是 `/chat` 的 endpoint 行（`traces.langfuse_trace_id` 指向 Langfuse）
**And** sink 与 telemetry 同选，按 Epic 3 引言的硬约束（DB sink → `isEnabled:false`；Langfuse sink → 开启；no-op 仅限测试/未接线）
**And** 如果以后要在本地看 chat tool 的检索 stages，就切回 DB sink，并需要 `attempt` 区分同一 chat 的多次 retrieve；当前按“chat 全交 Langfuse”不做

**Stage input/output 固定形状：**

| stage | input | output |
|---|---|---|
| `dimension_check` | `{expected_dimension, stored_dimensions}` | `{foreign_dimensions}` |
| `embed_query` | `{query, model_id, dimensions}` | `{dimension, vector_hash}` |
| `vector_recall` | `{vector_hash, top_k, min_similarity, dimension}` | `{candidates:[{chunk_id, similarity, rank}]}` |
| `bm25_recall` | `{query, top_k}` | `{candidates:[{chunk_id, lexical_score, rank}]}` |
| `rrf_fusion` | `{vector:[{chunk_id,rank}], lexical:[{chunk_id,rank}], k}` | `{hits:[{chunk_id, rrf_score}], vector_count, lexical_count}` |

**And** 当前代码里 BM25 召回与 BM25 打分在同一段 SQL（`ParadeDbBm25Search` 只过滤 `lexicalScore>0`），所以没有独立的 `bm25` stage；要拆得往 adapter 埋点，另拍
**And** `rrf_fusion.output.hits` 就是最终输出；不另记一条空的 `output` stage，避免重复
**And** 不建 `retrieval_count/hit_count/top_similarity` 汇总列；需要汇总时从 stage 行算
**And** `trace_stages` 已在迁移中；3.3 只写它（3.4 复用），不建 `retrieve_traces` 独立表
**And** 本 story 不做 golden set、recall@k/MRR、feedback/score；这些 evaluation 能力另立 Epic（2026-10-28：已立为 Epic 7），不塞进 observation
**And** 不改 `RETRIEVAL_MIN_SIMILARITY` 等阈值默认值；这里只记录实际发生的检索

> **2026-10-23 实现注**：stage 由 `Retriever.search` 的 5 段 runner 产出，sink 由 caller 传：`/retrieve` → DB sink（本地 `trace_stages`、embed telemetry off）；chat tool → Langfuse sink（tool span 下的 child spans、telemetry on）。`/traces/:id` 改自定义读返回 `{trace, stages}`（原 hono-crud read 移除）。OTel 除 TracerProvider 外还必须注册 `AsyncLocalStorageContextManager`，否则 tool span 不是 active context，stage span 会被导成独立根 trace。前端 `/traces` 抽屉改读 `{trace, stages}`。

> **2026-10-24 收口**：四镜头 code review 完成；findings 见 `_Agents/implementation-artifacts/review-2026-10-24-epic3.md`。本轮按 Lynx「仅 review」不改代码，Epic 3 按已知问题收口。

### Story 3.4: ingest endpoint trace（systemtrace）
**Implements:** 无 FR；支撑 NFR-3 可度量
**Depends:** 3.1、3.3（复用 `trace_stages`）

As a Lynx，
I want `/resources` 的 endpoint trace 按 fetch/parse/chunk/embed/write 记录输入/输出与耗时，
So that 入库慢/失败时能直接看到停在哪一段、每段产出了什么。

**Acceptance Criteria:**

**Given** 3.3 的 `trace_stages` 已存在
**When** 查 `trace_stages`
**Then** 复用同一套列：`id`（原 `trace_stage_id`）、`trace_id`、`stage`、`input`、`output`、`duration_ms`、`status`、`created_at`
**And** 本 story 只服务 `POST /resources`；`stage` 至少覆盖 `fetch|parse|chunk|embed|write`；索引 `(trace_id, created_at)` 复用 3.3
**And** 不落 `pipeline`/`attempt`：`trace_id` join `traces.route` 就知道是 ingest；一次入库只有一条流水线
**And** `input/output` 是阶段专用 payload：不写抓取正文/chunk 正文、不写完整 embedding 向量；形状按下表固定

**Given** `POST /resources` 完成（成功或失败）
**When** 请求结束
**Then** 同一个 `trace_id` 下按实际执行顺序写 stage 行；`traces.resource_id` 指向该 Resource
**And** `GET /traces/:id` 的 `stages` 按 `created_at` 排序；`trace.route='POST /resources'` 表明这是 ingest 流水线；失败 stage 的 `status='error'`、`output` 带 `error_code/message`，后续 stage 不写
**And** `GET /resources` 列表请求只有 3.1 的通用行，不写 `trace_stages`

**Stage input/output 固定形状：**

| stage | input | output |
|---|---|---|
| `fetch` | `{url}` | `{final_url, content_type, content_length, http_status}` |
| `parse` | `{content_type, content_length}` | `{title, markdown_length}` |
| `chunk` | `{markdown_length}` | `{chunk_count, total_chars}` |
| `embed` | `{chunk_count, model_id, dimensions}` | `{embedding_count, dimension}` |
| `write` | `{chunk_count}` | `{chunk_count}` |

**And** `traces.resource_id` 是入库请求的关联键；`POST /resources` 的 handler 在创建 Resource 后写回公共行
**And** 五段耗时不再另写日志；`trace_stages` 是唯一来源；`systemtrace/log.ts` 只负责请求边界/错误日志（3.1）
**And** ingest 的 `embedMany` 传 `telemetry: { isEnabled: false }`，Langfuse 里没有 ingest embed/stage；本地 `trace_stages` 恰好 5 行
**And** 迁移已建 `trace_stages`；本 story 不建表，也不建 `ingest_traces`
**And** 真跑验收：`POST /resources` 一个真 URL → `GET /traces/:id` 的 `stages` 看到五段与输入/输出；失败时看 `status='error'` 的 stage；用一条 SQL 能算某时间窗 `POST /resources` 的入库成功率
**And** 不做全量 OTel 自动埋点、不做 Grafana/Prometheus、不记录正文/Key

> **2026-10-23 实现注**：`Ingest.run(Data, Signal, { sink })` 增加 caller sink；`POST /resources` 用 DB sink、ingest 的 `embedChunks` 显式 `telemetry:{isEnabled:false}`；创建 Resource 后由 handler 回填 `traces.resource_id`。五段 stage 复用通用 `runStage`/`StageSink`，失败 stage 写 `status='error'` + `output={error_code,message}`，后续 stage 不写。`/traces/:id` 已返回 `{trace,stages}`。

> **2026-10-24 收口**：四镜头 code review 完成；findings 见 `_Agents/implementation-artifacts/review-2026-10-24-epic3.md`。本轮按 Lynx「仅 review」不改代码，Epic 3 按已知问题收口。

---

## Epic 4: 结构化输出与渲染（P2 主线）

> **阶段定位（2026-10-24）**：PRD §7 的 P2 原写「多轮会话管理 + 结构化输出」。多轮已在 P1 Story 2.5 交付；P3 的「检索工具化」也已由 Story 2.6 提前交付。本 Epic 只承接结构化输出，并给它两个真实出口：
> ① 资源画像（服务端结构化数据，`generateText + Output.object`）；② 聊天 Markdown/GFM 表格（客户端渲染 + CSV 导出）。
> **边界**：不改入库/检索主链路；不做 eval、prompt 管理、sandbox、tenant；不引入 Agent loop；不把聊天回答改成 JSON part 或 Generative UI（P4）。
> **依赖轨道**：轨 A · 资源画像 4.1 → 4.2 → 4.3；轨 B · 响应渲染 4.4 → 4.5。两轨独立，可按任意顺序开工；项目节奏仍是一次一格。
> **Story 粒度（2026-10-24 拆）**：5 格都只有方向级；每格开工前必须按 AGENTS.md §二 补齐详细 AC 并逐条收口 OQ/Deferred。OQ 编号格式 `OQ-4.x-n`。

### Story 4.1: 资源画像的数据形状与归一化

**Implements:** P2 能力项（无 P1 FR）
**Acceptance Criteria:** 待开工前补（门槛见 AGENTS.md §二）。

**方向**
- 迁移给 `resources` 加 `profile jsonb`；领域类型与持久化形状分开。
- 定义画像 schema（字段暂按 WeKnora 五项，最终字段集待拍；上限待定）与本地归一化（trim、按码点截断、topics 去重/封顶）。
- 只做数据层与纯函数；不调模型、不开端点。

**Depends:** 无

**Open questions:**
- `OQ-4.1-1` 字段集与各字段上限。
- `OQ-4.1-2` 空画像 / 部分字段的合法形状（null、空数组、缺字段怎么区分）。
- `OQ-4.1-3` `profile` 住 `resources` 单列还是独立表；资源软删后画像随行保留还是清空。

**Deferred:** 画像入检索索引、画像驱动的检索过滤。

### Story 4.2: 资源画像生成端点

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- `POST /resources/:id/profile`：ready 资源 → chunks 按 `start_offset/end_offset` **去重叠**重建正文 → 有界采样 → `generateText + Output.object` → 归一化 → 落 `resources.profile`。
- 失败不落库、资源仍 ready；重新生成覆盖；同步；客户端断开即 abort；生成有上界（超时）。
- 沿用 `CHAT_MODEL`；不新增 provider/model 配置。
- 生成能力住哪一格（`agent/` 新用例 vs `ingest/` vs 新 `profile/` 能力片）开工前定。

**Depends:** 4.1

**Open questions:**
- `OQ-4.2-1` 生成失败是否落状态（`profile_status` / 错误列 / 只返回错误）。
- `OQ-4.2-2` DeepSeek 空内容 / 半截 JSON / 拒答的处理（`Output.object` 的失败形态要实测）。
- `OQ-4.2-3` 采样上限（字符数 / 块数）与超时值。
- `OQ-4.2-4` 对不存在 / 非 UUID / 非 ready / 已软删资源的响应（400 / 404 / 409）。
- `OQ-4.2-5` 能力归属（哪一层负责调模型与归一化）。

**Deferred:** 自动生成 / 存量批量回填；摘要块入索引。

### Story 4.3: 资源画像展示

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- 资源详情展示 summary / gist / topics / doc_type / typical_question；无画像显示「生成画像」，有则「重新生成」。
- 生成中禁用按钮；失败给出可重试提示；不自动触发生成。

**Depends:** 4.2

**Open questions:**
- `OQ-4.3-1` 列表是否展示 gist/topics。
- `OQ-4.3-2` 空画像、失败、生成中的界面形态与可访问性播报。

### Story 4.4: 聊天 Markdown 渲染器

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-29 收口）:**

**Given** 一条助手回答含标题 / 列表 / 粗体 / 链接 / 行内码 / 围栏代码 / 表格 / 引用块
**When** 渲染
**Then** 结构按 GFM 渲染；用户消息与 reasoning 仍是纯文本
**And** 不解析 raw HTML（模型写的 `<script>` / `<img>` 不执行、不加载）
**And** 链接渲染为 `target="_blank" rel="noopener noreferrer"`；图片只留 alt / 链接，不发起远程请求
**And** 单换行按硬换行渲染（`remark-breaks`），与 as-built「每行一段」的观感一致

**Given** 正文里的 `[n]` 与 `[8 位 chunkId]`
**When** 渲染
**Then** 仍是同一套引用按钮：按首次出现顺序编号、数字名次不跨轮、8 位 id 可跨轮；点开仍是引用浮窗
**And** 围栏代码块与行内码里的 `[n]` **不算引用**（不出现按钮、不进右栏、不参与编号）
**And** 代码块内的 Markdown 语法原样显示（不被当格式解析）

**Given** 回答仍在流
**When** 每帧都按整段 Markdown 渲染
**Then** 半截表格渲染成一张（还不完整的）表、半截围栏渲染成 code，不把 ``` 或反引号漏到屏幕上；流结束后自然收敛成正式结构
**And** 流式期间引用编号稳定，不因末块解析抖动而重排

**Given** 一条 ` ```mermaid ` 围栏且流已结束
**When** 渲染
**Then** 懒加载 mermaid 渲染成图（初始化 `securityLevel: 'strict'` **且 `htmlLabels: false`**，不加载远程资源）
**And** 图源里出现 `htmlLabels` / `securityLevel` 的覆盖（`%%{init}%%` 或 frontmatter）→ 不渲染，回退代码块
**And** 产物里出现 `foreignObject` / `<img>` / `<image>` / `on*=` / `javascript:` → 回退代码块
**And** 解析 / 渲染失败时保留代码块 + 一行「无法渲染此图」
**And** 图旁有「导出 JPEG」（2026-10-29 Lynx 要）：按 2 倍栅格、单边封顶 4096px，先铺 `--color-canvas` 底色（跟随浅深档）再画，quality 0.92，文件名取会话标题；失败显示「导出失败」

**And** 其他围栏仍是代码块（语法高亮不在本格）

**And** 以上都有 jsdom 用例钉住（代码里的标号、raw HTML、单换行、半截块）；浏览器观感归 Lynx 手测

**方向**
- 渲染器 **react-markdown + remark-gfm + remark-breaks**（2026-10-29 Lynx 拍；实测约 50KB gz）。
- Mermaid 用**官方 mermaid**（2026-10-29 Lynx 拍）：按图种动态 import 懒加载；初始化 `securityLevel: 'strict'` **且 `htmlLabels: false`**。Build 1 实测：只设 strict 时 label 里的 `<img src="https://…">` 会被保留并真的发起远程请求，`%%{init:%%}` 与 frontmatter 都能把 `htmlLabels` 改回 true（两次都命中 `evil.example`）——所以按上面 AC 的三道闸执行；`htmlLabels: false` 下渲染约 30ms 且无 `<img>` / `<foreignObject>`。
- 引用节点方案（OQ-4.4-1 的尖刺）：remark 插件把标号变成 `[n](citation:n)` 链接，`components.a` 识别 `citation:` 协议渲染成现有按钮；`urlTransform` 放行该协议（react-markdown 默认只放行 http(s)/irc(s)/mailto/xmpp，已扒包确认）。尖刺不通过则退回"按段落切分、标号单独替换"。
- 回答正文的 `citedHits` 改为**跳过代码节点**的 Markdown 感知实现（纯函数，可单测），`/ask` 的右栏与气泡共用它。

**Depends:** 无（与画像独立）

**Open questions:**
- `OQ-4.4-1` → **已拍板 2026-10-29**：按上面的 "citation: 链接 + components.a" 方案做 Build 1 尖刺。
- `OQ-4.4-2` → **已拍板**：保留单换行（remark-breaks）。
- `OQ-4.4-3` → **已拍板**：任务列表随 GFM 进首期；脚注不进首期（转 deferred）；图片不加载、只留 alt / 链接。
- `OQ-4.4-4` → **已拍板（Build 1 实测 2026-10-29）**：整段每帧 Markdown（349 字符实测 0.44ms/次）。半截表格直接渲染成表、半截围栏直接渲染成 code，不露反引号；"已完成块 + 末块纯文本"反而会把 ``` 漏在屏幕上，弃用。

**Deferred:** 语法高亮、数学公式；把回答改成 JSON part / Generative UI（P4）。

### Story 4.5: 表格渲染与 CSV 下载

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-29 收口）:**

**Given** 回答里有 GFM 表格且流已结束
**When** 渲染
**Then** 表格真渲染（表头 / 对齐 / 单元格内引用按钮与链接照常）；宽表在容器内横向滚，不撑破对话流
**And** 表头旁有「下载 CSV」；流式期间不出现，流成功结束且表格闭合后才可点
**And** CSV：UTF-8 BOM；逗号 / 引号 / 换行按 RFC 4180 转义；`= + - @` 开头的单元格前置单引号
**And** 文件名取第一列表头：去 `/\:*?"<>|` 与控制字符、空白压 `-`、截 40；空或全非法 → `table`

**Given** 一条 ` ```csv ` 围栏且流已结束
**When** 渲染
**Then** 解析成表格（首行当表头）并给「下载 CSV」；引号里的逗号 / 换行与 `""` 转义按 RFC 4180 还原
**And** 解析不了（引号不闭合、中途冒引号、只有一列、超过 300 行）就退回代码块，不猜着修数据；列数不齐原样显示
**And** 流式期间仍是代码块

**Given** 一条完整回答
**When** 点「导出 .md」
**Then** 下载**整条回答的原始 Markdown**（全文，不只是表格），文件名由会话标题清洗得到
**And** 流式期间不出现该入口

**方向**
- CSV 与 .md 都在前端生成（Blob + `URL.createObjectURL`），不落服务端、不进 MinIO。
- 表格组件从 GFM 渲染出的 hast 节点取单元格文本（下载用纯文本），界面上的按钮与链接不受影响。

**Depends:** 4.4

**Open questions:**
- `OQ-4.5-1` → **已拍板**：首期只做 CSV；Excel / 其他格式转 deferred。
- `OQ-4.5-2` → **已拍板（Lynx 2026-10-29）**：要做「整条回答导出 .md」，要求整条都是 Markdown 原文。
- `OQ-4.5-3` → **已拍板**：文件名规则见上面的 AC。

**Deferred:** 服务端生成文件、落 MinIO、再给下载链接的 artifact 模式。

> **Epic 4 · 未决项汇总**：逐格 OQ/Deferred 见上；不在 P2 的能力见文末「P2 · 未决项」。本节不再另抄一份。

---

## Epic 5: 文件与存储（P2 工程支线）

> **2026-10-27 状态**：**Epic 5 已收口，5.1–5.4 全部 done**。5.2 原始归档/两段式 ingest/下载/恢复；5.3 资源批量（SHA-256 去重、整批两段式、已删除筛选/彻底删除、ready/失败重入库）；5.4 代码库 ZIP（独立域、不解压、文件树 + 预览、硬删）。四份 story 走读页均已补齐（`_Agents/walkthroughs/`）。

> **阶段定位（2026-10-24）**：为资源和代码库补「原始文件」层。Epic 5 只做文件管理，不做代码分析、不做代码 RAG。
> **边界**：不改入库分块/检索语义；不接 PDF/Word 等新格式；不做 AST/依赖图；不做批量上传/后台队列；不做 tenant。
> **依赖轨道**：轨 A · 资源文件 5.1 → 5.2 → 5.3；轨 B · 代码库 ZIP 5.1 → 5.4。两轨独立。
> **Story 粒度（2026-10-24 拆）**：4 格都是方向级；开工前补详细 AC 并收口 OQ/Deferred。代码库文件树/预览是否进首期留在 5.4 的 OQ，不单独建 story。

### Story 5.1: MinIO 适配器与配置

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-26 补）:**

**架构与归属**
**And** 新增 `app/server/src/adapter/storage/`，作为 AD-2 的第六类「对象存储」；AD-2 已同步改为六类
**And** 对外只经 `adapter/contract.ts` 交出 `ObjectStoreHandle`（`@singleton()`）与 `ObjectStore` 类型；别盒不 import `@aws-sdk/*`、不 import `adapter/storage/` 内部文件
**And** 本格不改表、不加迁移、不开路由、不接 ingest、不做前端

**契约（`ObjectStore`）**
**And** `put(Key, Body, ContentType)`：Body 为 `Uint8Array`（含 Buffer）
**And** `stat(Key)`：返回 `{ size, contentType, etag } | null`；对象不存在返回 null
**And** `get(Key, { range? })`：返回 `{ body: Readable, contentType, contentLength, etag } | null`；对象不存在返回 null
**And** `delete(Key)`：幂等；对象不存在也算成功
**And** `presignGet(Key, { expiresIn, responseContentDisposition?, responseContentType? })`：返回签名 URL；`expiresIn` 限 1–604800 秒
**And** `presignPut(Key, { expiresIn, contentType? })`：返回 PUT URL；给了 `contentType` 就把它签进 `X-Amz-SignedHeaders`，上传时必须带同一个值；`expiresIn` 限 1–604800 秒
**And** `ping()`：只读 `HeadBucket`，2 秒上界，不建桶（/health 用）
**And** `ensureBucket()`：`HeadBucket` 不存在则 `CreateBucket`；幂等，且有 3 秒上界
**And** 非「不存在」的失败统一抛 `ObjectStoreError`（`code='E_OBJECT_STORE'`），SDK 错误类型不泄出 adapter

**配置与启动**
**And** `AppConfig` 新增 `s3Endpoint / s3Bucket / s3AccessKeyId / s3SecretAccessKey / s3Region / s3ForcePathStyle`；前四项缺失走 `E_CONFIG_MISSING` + exit(1)，`S3_REGION` 默认 `us-east-1`，`S3_FORCE_PATH_STYLE` 默认 `true`
**And** `S3_ENDPOINT` 必须等于浏览器访问 MinIO 的同一个 host（presign 的 Host 必须一致）；当前 `.env` 用 `http://aliyun2c2g300mbps.tail8d0baa.ts.net:9000`
**And** 启动时在 `serve()` 前尝试 `ensureBucket()`：成功打 `I_OBJECT_STORE`；失败打 `W_OBJECT_STORE` 并继续启动，不阻塞
**And** `S3_ACCESS_KEY_ID` / `S3_SECRET_ACCESS_KEY` 不出现在任何日志、错误、trace payloads 里

**真跑验收**
**And** 对真实 MinIO 跑 `put → stat → get → delete`，内容与 Content-Type 一致；删后 `stat` 返回 null
**And** `presignGet` 的 URL 用 `curl -I` 得 200，带 `Accept-Ranges: bytes` 与（传了参数时）`Content-Disposition: attachment`
**And** 同一 URL 用 `curl -r 0-99` 得 206 + `Content-Range`
**And** `expiresIn=2` 的 URL 等 3 秒后请求得 403，证明 TTL 生效
**And** 用 IP 签名、用域名请求（或反过来）得 `SignatureDoesNotMatch`，证明 Host 约束
**And** `ensureBucket` 对不存在的临时桶能创建、再调一次仍成功
**And** `presignPut` 带 `contentType` 的 URL：正确类型 PUT 得 200、内容可读；换类型得 403
**And** `GET /health` 增加 `s3.bucket` 探针：真实 MinIO 下 `s3.bucket.ok=true`；MinIO 不可达时 `s3.ok=false`、整体 `degraded/503`
**And** `npx tsc --noEmit` 0 错；`npx vitest run` 全部通过（含既有 31 条）

**不做**
**And** 不做多桶、多后端、OSS/其它存储、预签名下载 UI、nginx、桶公开读；这些都不进 5.1

**OQ 收口（2026-10-26，Lynx 拍）:**
- `OQ-5.1-1` → `adapter/storage/` 第六类；开工前先改 AD-2（已改）
- `OQ-5.1-2` → 远程 MinIO：`aliyun2c2g300mbps`（Tailscale `100.113.172.47`），Docker，数据 `/data/minio`，Console `http://aliyun2c2g300mbps.tail8d0baa.ts.net:9001`；本机不装
- `OQ-5.1-3` → 自动建桶 + 失败只告警（不阻塞服务）；桶名 `kbfile`
- `OQ-5.1-4` → presigned URL，TTL 3600 秒，5.2 用 302 直连下载；`presignGet` 进本格契约，`get` 留给服务端读；presigned 从 P2 Deferred 解冻

**Depends:** 无

**Deferred:** 多存储后端、多桶（未排期）；~~预签名 URL~~ 已解冻进 5.1/5.2（2026-10-26，OQ-5.1-4）。

> **2026-10-26 收口**：实现 + review + 走读页完成；findings 见 `review-2026-10-26-epic5-story1.md`；页面 `_Agents/walkthroughs/epic5-story1-minio-adapter.html`。`/health` 维持全绿才 200（Lynx 拍板 A）；P1 专用用户 / `HeadBucket` 权限 → 5.2。

### Story 5.2: 资源原始归档、两段式入库与下载

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-27 as-built）:**

**数据与 URI**
**And** `resources.status` 为六态：`uploading / uploaded / processing / ready / upload_failed / process_failed`；默认 `uploading`
**And** `resources.content_type` 存 MIME（`text/html / text/markdown / text/plain`），不再存 `url / markdown / plaintext`
**And** `resources.storage_size_bytes` 存原始对象字节数；旧行可为 null
**And** 新资源 `data_uri = kc://oss/minio/<bucket>/<实际路径>`；路径保留文件名/相对目录，不加 `resources/<id>`；同名加短后缀
**And** `source` 只记外部来源：URL 存原始 URL，文件/粘贴存 null；`kc://` 内部归档地址只放 `data_uri`；`data_uri` 有 `kc://%` 唯一索引
**And** `chunks.resource_uri` 随 `data_uri`；不新增 `original_file_name / storage_content_type / storage_key` 列
**And** 旧 29 行资源已由 `20261026172000_truncate_existing_data.sql` 清空（sessions/messages 保留）；新数据从空库开始

**建资源 / 归档**
**And** `POST /resources` 只接受 `url` / `content` / `filename` 恰好一个；`filename` 仅 `.md/.markdown/.txt`，先返回 `{resource, upload:{url, method:'PUT', contentType}}`，不读文件字节
**And** 文件 `presignPut` 的 `Content-Type` 被签；前端直传 MinIO；文件行保持 `uploading`，等 ingest 的 `stat` 确认
**And** URL 走 http/https 抓取并写入 MinIO；重复 `source` 返回 409；空正文、不支持 MIME、超过 10 MiB 均转 `upload_failed`
**And** 粘贴只接受 `text/markdown` / `text/plain`，空正文/超限在建行前拒绝；成功直接 `uploaded`
**And** 归档失败在建行后转 `upload_failed` 并返回带 resource 的 422；输入错误 400；文件声明超限 413；未预期 500
**And** key 分配同时查 DB `data_uri` 与 MinIO `stat`；唯一索引兜底并发，冲突加短后缀

**ingest**
**And** `POST /resources/:id/ingest` 只处理 active 资源；`processing` / `ready` 返回 409；`uploading / uploaded / upload_failed / process_failed` 可重试
**And** 先 `stat` 原始对象：不存在 / 0 字节 / 超过 10 MiB / MIME 与资源不一致 → 删除错对象并转 `upload_failed`，返回 422
**And** 通过后写 size，状态 `uploaded → processing → ready`；失败 `process_failed`；返回 `{resource, chunk_count, warning?}`
**And** ingest 的 fetch 段从 MinIO 读 `data_uri`，不再抓 URL；不新增 `store` 段，3.4 的五段（fetch/parse/chunk/embed/write）口径不变
**And** 旧数据行或 `data_uri` 不是 `kc://` 时，ingest / download / restore 返回 `E_NO_ORIGINAL`，不做回填

**下载**
**And** `GET /resources/:id/original` 返回 302 到 1h presigned GET；302 与对象响应均 `Cache-Control: no-store`
**And** 对象响应强制 `attachment`（RFC 5987 `filename*=UTF-8''` + ASCII fallback）、资源 MIME、文件名取 key basename
**And** 原对象不存在 / 旧 URI / bucket 不一致 → 404 `E_NO_ORIGINAL`；不记 Location / 完整 presigned URL

**删除 / 恢复**
**And** `DELETE /resources/:id` 软删行、删 chunks（embeddings 随 FK），**保留 MinIO 原对象**
**And** `POST /resources/:id/restore` 只接软删行；先 `stat` 原对象，清 `deleted_at` 回 `uploaded` 并写 size；无原对象 409 `E_NO_ORIGINAL` 且行保持软删
**And** restore 不自动 ingest；前端随后调 `/ingest`

**前端**
**And** 入库页队列支持文字/网站/文件/文件夹；提交时文字/URL 走归档+ingest，文件走 presign PUT+ingest，文件夹按相对路径逐文件
**And** 资源页六状态筛选/徽标/状态分布；抽屉显示下载、开始/重试入库；删除后提供「恢复并重新入库」撤销条
**And** 状态分布六态；概览/图表仍用 ready/processing/failed 三档聚合映射
**And** 入库观测 RunWatch / `/ingest-runs` 按 `POST /resources/:id/ingest` 取 trace（归档 `POST /resources` 的 trace 0 段）；每完成一个文件/一次 ingest 刷新最近入库、六状态分布与 RunWatch

**真跑验收**
**And** 迁移 `20261026163000_resource_storage_lifecycle.sql`、`20261026172000_truncate_existing_data.sql` 已 applied（13/13）
**And** 真 MinIO + 真库集成：粘贴、URL、文件 presign PUT、缺对象、错类型、0 字节、restore、download 302、重复 ingest 409
**And** `npx tsc --noEmit` 0 错；后端 16 文件 / 89 条、前端 63 文件 / 594 条通过；前端 build 绿
**And** 浏览器手测待 Lynx：CORS 已实测放行（2026-10-27：MinIO 默认对任意 Origin 回 `200` + `Allow-Methods: PUT` + `Allow-Headers: Content-Type`，无签名 PUT 的 403 也带 ACAO，无需配桶 CORS；收紧 Origin 时再验）；唯一会挡的是 HTTPS 预览页直传 `http://MinIO` 的 mixed content，手测用 `http://localhost:5173` 规避

**不做**
**And** 资源/chunk/message/trace 的身份 URI、`data_uri` 回填、回收站列表、从 URL 自动重抓恢复、multipart 上传、批量队列、ZIP（5.4）、原文件版本/retention/purge

**OQ 收口（2026-10-27，Lynx 拍板/实现定）:**
- `OQ-5.2-1` → 归档失败硬失败 `upload_failed`，不做 warning 入库
- `OQ-5.2-2` → key 用实际路径；同名加后缀；类型/大小不符删对象；软删保留对象；对象删除失败只记日志
- `OQ-5.2-3` → 不新增 `store` 段；fetch 改为读 MinIO，3.4 仍是五段
- `OQ-5.2-4` → 无 `storage_key`；`data_uri` 就是文件 URI；缺失/旧 URI 统一 `E_NO_ORIGINAL`，不回填
- `OQ-5.2-5` → 文件上传用 presign PUT（非 multipart），前端直传 MinIO；原 5.3 的单文件上传已被本格覆盖；5.3 已重定义为资源批量 story

**Depends:** 5.1

**Deferred:** 回收站/软删列表（需 list-deleted 端点）；文件 PUT 失败后的 `uploading` 行清理（现靠 24h 启动清扫/手动删）；URL 页面标题覆盖 hostname 占位（需记录 title 是否用户显式提供）；从 `source` 自动重抓恢复；MinIO HTTPS/TLS 部署项（HTTPS 预览下 mixed content；CORS 实测默认放行，不再算部署前置）；5.3 合并决定；5.4 ZIP。

### Story 5.3: 资源批量：内容去重、整批上传/入库、回收站与重入库

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-27 方向级；开工前补详细 AC）:**

**内容哈希与去重（SHA-256）**
**And** `resources` 增 `content_hash` text；对非空 hash 建**全表唯一索引（含软删行）**；旧资源已在 2026-10-27 清空，不 backfill，只对新行算 hash
**And** 文件在浏览器算 SHA-256，URL/粘贴服务端算；哈希对象是**归档原始字节**（文件字节 / HTML / UTF-8 文本），不含文件名和标题
**And** **去重门在 DB 建行与 MinIO 写入之前**：命中时 `resources` 与 bucket 两边都不写；只有未命中才 create/put
**And** 进入上传阶段前，先对队列里所有文件算 SHA-256；同 hash 只留一项，其余标「队列内已存在」，**不 create、不 presign、不 PUT**
**And** 文件 presign PUT 完成后调用 `POST /resources/:id/confirm-upload`，服务端 stat/类型/大小门禁后转 `uploaded`；整批全部确认后再开始 ingest，阶段一每完成一项也回调 `onProgress`
**And** URL/粘贴先取内容/算 hash 再查重；命中**不写对象、不建行**（URL 仍可能为算 hash 抓一次）
**And** 建行/发 presign 前查重，原则是**hash 命中一律不重传对象**：
  - active 命中（不管状态）→ 返回已有 resource + duplicate 标记，前端只提示“库里有这个资源”并显示它的状态；**不自动 ingest、不等待、不新建、不上传**，用户去资源页处理
  - soft-deleted 命中且对象完整 → **直接恢复该 resource**（清 `deleted_at`、回 `uploaded`）并纳入后续 ingest，不重传对象
  - soft-deleted 命中但对象损坏/丢失 → 返回 `E_ORIGINAL_LOST`，引导去回收站彻底删除；彻底删除前不再上传
**And** 并发冲突由唯一索引兜底；客户端 hash 只用于早跳过，ingest 时服务端**强制复核**：对从 MinIO 读回的对象字节复算 SHA-256，不一致不进入 parse/chunk/embed，落 `process_failed`（`E_HASH_MISMATCH`）

**整批两段式（前端，无后端队列）**
**And** 上传队列先做文件 hash 预检并合并同内容项；对剩余唯一项执行 create + 上传/归档（文件 presign PUT；URL/粘贴归档；软删命中走恢复），收集 resource ids；**全部上传结束后**再逐个 ingest；active 命中只提示，不加入本批
**And** 单项失败不阻断其余；每完成一项 `onProgress`，页面刷新最近资源、六状态分布与 RunWatch
**And** 不建服务端任务表/worker/Redis/批量端点；刷新页面队列即丢

**批量删除（资源页，2026-10-27 补）**
**And** 资源页支持本页勾选与全选（全选在工具栏最左），活动资源出现「删除选中 n」两步确认；复用现有 `DELETE /resources/:id`，与逐条删除一样是软删
**And** 「已删除」筛选下同样显示 checkbox，支持批量恢复（restore→ingest）与批量彻底删除（purge，两步确认）
**And** 筛选 / 翻页 / 搜索变化时清空勾选；批量操作逐条执行、404 视为已不存在，完成后刷新列表与计数

**回收站 / 软删 / 彻底删除**
**And** 软删资源默认从活动列表隐藏；资源列表的状态筛选增加「已删除」，走 `GET /resources/deleted`（分页/搜索/排序）查看并恢复，不再单独做回收站卡/页签
**And** 彻底删除走 `DELETE /resources/:id/purge`，服务端只接软删行；active 行 409 `E_NOT_DELETED`
**And** restore 仍先 `stat` 原对象：完整则清 `deleted_at`、status `uploaded`，再 ingest；损坏 409 `E_NO_ORIGINAL`
**And** **彻底删除**只在「已删除」筛选内执行（两步确认）：先幂等删 MinIO 原对象，再删 `resources` 行（chunks/embeddings 随 FK），释放 `content_hash`；对象已经丢失也允许清行
**And** active 资源必须先软删再彻底删；不提供直接硬删 active（防误操作）

**重入库**
**And** `POST /resources/:id/ingest` 允许 `ready` 重跑；状态 `ready → processing`
**And** 写入事务里替换旧 chunks/embeddings（覆盖删掉），成功后 `ready`；失败 `process_failed`，旧 chunks/embeddings 不保留
**And** 资源页对 ready 显示“重新入库”；回收站恢复后可重新入库

**不做**
**And** 批量下载 / ZIP（2026-10-27 去掉，不在本格）；后端批量队列；代码库 ZIP（5.4）；直接硬删 active；PDF 等新格式。

**Open questions:**
- ~~`OQ-5.3-1` 旧资源 hash 回填~~ — **2026-10-27 Lynx 拍：旧资源直接清空（resources/chunks/embeddings），不做 hash 回填；sessions/messages 保留。**
- ~~`OQ-5.3-3` 重入库失败：旧 chunks 保留（避免搜索空窗）还是清掉转 process_failed~~ — **2026-10-27 Lynx 拍：覆盖删掉，失败 process_failed，旧 chunks/embeddings 不保留。**
- ~~`OQ-5.3-4` 客户端 hash 是否在 ingest 时强制复核；不一致如何处置~~ — **2026-10-27 拍：强制复核。storage fetcher 对 MinIO 读回的同一份 Buffer 复算 SHA-256，与 `resources.content_hash` 比对；不一致不 parse/chunk/embed，落 `process_failed`（`E_HASH_MISMATCH`）。不顺手删对象、不清 hash；对象生命周期清理归之后的 MinIO 薄层子系统。**
- ~~`OQ-5.3-5` 回收站列表的 API 形状（新端点 vs GET /resources 过滤）与硬删后的审计留痕~~ — **2026-10-27 拍：用新端点 `GET /resources/deleted?page=&per_page=&search=`（按 deleted_at 倒序）与 `DELETE /resources/:id/purge`；purge 只接软删行，先幂等删 MinIO 对象再删行，对象已丢失也允许清行；active 行 409 `E_NOT_DELETED`。硬删审计留痕归 P5（本轮只留 trace）。**

**Depends:** 5.2

> **as-built（2026-10-27）**：去重门 / ingest 完整性复核 / 前端 hash 预检+两段式 / 软删「已删除」筛选+彻底删除 / ready 重入库已全部落码；文件 PUT 后先 confirm-upload 转 uploaded 再统一 ingest；资源页单工具栏含全选、批量软删/恢复/彻底删除，已删除资源默认隐藏；后端 112/112、前端 612/612、build 绿。ready 重入库在写入事务里 `SELECT ... FOR UPDATE` 锁资源行、先删旧 chunks/embeddings 再插新；失败 `process_failed` 且旧 chunks 不保留，门禁失败也清旧 chunks。待 Lynx 浏览器验收 + story 走读页后转 done。

**Deferred:** 批量下载/ZIP（本轮去掉）；后端批量队列（P3）；硬删 audit/retention（P5）；批量软删（可选批次操作，待定）；purge/restore 并发行锁（5.3 收口后 / 未排期）。

### Story 5.4: 代码库 ZIP 上传与文件管理

**Implements:** P2 能力项
**Acceptance Criteria（2026-10-27 详细；Build 1–3）:**

**领域与数据**
**And** 新 `codebases` 表：`id uuid PK`、`title`、`original_filename`、`data_uri`、`content_type` 固定 `application/zip`、`status` check（`uploading / processing / ready / failed`）、`error_reason`、`storage_size_bytes`、`manifest jsonb NOT NULL DEFAULT '[]'`、`file_count int`、`declared_uncompressed_bytes bigint`、`created_at / updated_at`；无 `deleted_at`（硬删，不进资源回收站），无 `content_hash` 唯一索引；`data_uri` 唯一。
**And** `manifest` 是扁平条目数组：`path / entry_index / is_dir / compressed_size / uncompressed_size / compression_method`；树由 path 合成；不存正文。
**And** 迁移走 dbmate；`schema.ts` 由 `npm run db:schema` 重新生成，不手改生成文件。
**And** 新能力盒 `src/codebase/`（archive / zip-validate / reader / purge）与 `src/routes/codebases.ts`；repo 住 `adapter/repo/codebase.ts`，经 `adapter/contract.ts` 单一门交出；不复用 Resource/Repo 的资源领域方法。

**上传与校验**
**And** `POST /codebases` `{ filename, size?, title? }`：只收 `.zip`；size 若给必须 ≤ 104857600；签 `presignPut(application/zip)`；建 `uploading` 行；返回 `{ codebase, upload }`。
**And** `POST /codebases/:id/complete`：只接 `uploading`；stat 对象；缺失/0 字节/>100MB/类型不符 → 删错对象（若在）+ `failed` + 422；否则转 `processing`。
**And** complete 把 ZIP 下载到受控临时文件（≤100MB），用 `yauzl` 只读中央目录；**不解压条目、不写条目文件、不执行仓库内容**；finally 删临时文件。
**And** ZIP 校验拒绝：`..`、绝对路径、盘符、反斜杠、控制字符、空路径、规范化后重名、符号链接/设备/管道/套接字；默认忽略 `.git`、`node_modules`、`dist`、`build`（常量可维护）。
**And** 条目只存元数据；`entry_index` 用 yauzl 原始序号；`file_count` / `declared_uncompressed_bytes` 由清单求和。
**And** 校验成功写 manifest + status `ready`；失败删对象 + status `failed` + `error_reason`，行保留可看原因，可 DELETE 清行。
**And** 启动清扫：`processing → failed`（「校验中断」）；`uploading` 超过 24h → `failed`（与资源启动清扫同口径）。

**接口**
**And** `GET /codebases?page&per_page&search`：按 `created_at` 倒序；search title/original_filename；返回 `{ codebases, pagination }`。
**And** `GET /codebases/:id`：元数据，不含 manifest。
**And** `GET /codebases/:id/tree`：返回扁平 entries；前端合成树。
**And** `GET /codebases/:id/files/:entryIndex`：只接 ready；entryIndex 必须在 manifest；目录 400；流式读条目；默认 `inline`，`?download=1` 为 `attachment`；文本/代码 `text/plain; charset=utf-8` + `X-Content-Type-Options: nosniff`；实际解压字节超过 100MB 中止（413/422）；不落盘；不把 HTML/SVG 当页面执行。
**And** `GET /codebases/:id/original`：302 到 presigned GET 原 ZIP（`attachment` + `no-store`），不记 Location。
**And** `DELETE /codebases/:id`：`processing` 409；先幂等删 MinIO 对象，再删行；对象已丢失也允许清行；对象删除失败 500 且行保留；无软删/回收站。

**前端**
**And** 独立 `/codebases` 页面与导航入口；上传 ZIP（presign PUT → complete）、列表（状态/大小/文件数/时间）、详情文件树 + 预览、下载原 ZIP、删除两步确认。
**And** 预览文本/代码用 `<pre>`，不渲染 HTML/SVG；文件名/路径按文本转义；二进制显示「不可预览」+ 下载。
**And** 刷新页面不保留上传队列；不混入资源列表/资源回收站/状态分布。
**And** 前端测试覆盖 API 客户端、树构建、预览纯文本、删除两步、错误映射；不测像素。

**验证**
**And** 后端 Vitest 真 MinIO/DB + ZIP fixtures：正常树、重复路径、`..`、绝对路径、反斜杠、符号链接、对象缺失、>100MB 拒绝、preview 实际字节截断、删除清对象。
**And** `npx tsc --noEmit` 0、后端全量绿、前端 `npm test` / `npm run build` 绿。
**And** 浏览器手测由 Lynx：上传、树、预览、下载、删除、错误提示。

**不做**
**And** 解压到磁盘、执行仓库内容、AST/代码 RAG、Git 克隆、增量更新/版本对比、资源回收站、content_hash 去重、ZIP 批量下载。

**方向**
- 独立 `codebases` 领域，与知识库分离（2026-10-27 Lynx 拍），不进 `resources`、不进 ingest；上传 zip 存 MinIO 的独立前缀，**不做直接解压/不把条目落到文件系统**，只读条目清单（文件树是否首期展示见 OQ）、单文件按需流式读，下载原 zip，删除清对象；不复用 `resources.content_hash` 去重或资源回收站。
- 安全：拒绝 `..` / 绝对路径 / 符号链接 / 设备文件；**ZIP 上传限 100MB**；单条目读取按实际解压字节上限（同一个 100MB）截断，不信任中央目录虚报；不另设文件数/压缩比/深度细限额；拒绝反斜杠/盘符/重名条目；不执行仓库里的脚本或 hook。
- 文件树：上传校验成功后把**扁平条目清单**（path / entry_index / is_dir / compressed_size / uncompressed_size / compression_method）写进 `codebases.manifest` jsonb；列表与文件树读清单，不在每次请求时重新解析 ZIP；单文件按需读时用 entry_index 回到 ZIP 流。
- 单文件预览：首期文件树 + 预览都做；预览走 `GET /codebases/:id/files/:entryIndex`（`Content-Disposition: inline`），文本/代码统一按 `text/plain; charset=utf-8` + `X-Content-Type-Options: nosniff` 返回，前端用 `<pre>` 渲染；**绝不把 ZIP 条目当 HTML/SVG 内联执行**。二进制/图片首期给元信息 + 下载；图片内联预览若需要再加。
- 默认忽略 `.git`、`node_modules`、构建产物。

**Depends:** 5.1

**Open questions:**
- ~~`OQ-5.4-1` 「解压」是长期解压到受控工作区，还是只做安全校验 + 按条目读取（当前倾向后者）~~ — **2026-10-27 Lynx 拍：目前无沙箱，不能直接解压。5.4 不把条目解压到文件系统，也不执行任何仓库内容；ZIP 留在 MinIO，只做安全校验 + 条目清单 + 按条目流式读取。以后确需工作树 / AST / 执行时再上沙箱（P3 后另立）。**
- ~~`OQ-5.4-2` 限额具体值（zip 上传大小、总解压、文件数、单文件、压缩比、深度）~~ — **2026-10-27 Lynx 拍：不做那套细限额；只设 ZIP 上传 100MB 上限。实现时单条目读取按同一 100MB 实际解压字节截断，作为读接口的内存保护，不另设文件数/压缩比/深度限额。**
- ~~`OQ-5.4-3` 首期是否包含文件树/单文件预览，还是只做上传、列表、下载~~ — **2026-10-27 Lynx 拍：文件树 + 单文件预览都做。预览按需流式读条目（不落盘），文本/代码以纯文本渲染；二进制/图片首期给元信息 + 下载，图片内联预览若需要再加。**
- ~~`OQ-5.4-4` `codebases` 是新领域（新表 + 新能力盒 + 新路由）还是 `resources` 的 subtype；归属先拍~~ — **2026-10-27 Lynx 拍：代码与知识库分离。`codebases` 是独立领域：新表 + 新能力盒 + `/codebases` 路由，原 ZIP 存 MinIO 的独立前缀；不进 `resources`、不进 ingest、不写 chunks/embeddings、不进检索。只复用基础设施（DB/ObjectStore/config/日志/观测）。首期不把代码库混进资源列表或资源回收站；代码库自己的去重/删除语义另定。**

**Deferred:** AST 依赖图分析（接 `_Agents/dependency-graph/analyze.mjs`）→ 另立 Epic（代码图）；代码 RAG → 另立 Epic；Git URL 克隆 → 未排期；sandbox 执行 → P3 后；增量更新 / 版本对比 → 5.4 后续 / 未排期。单文件下载已由本轮预览接口 `?download=1` 覆盖，不再单列。

> **as-built（2026-10-27）**：Build 1/2/3 已落码：独立 `codebases` 表 + repo/archive/reader/purge + `/codebases` 六类端点；前端 `/codebases` 页面与「开发」导航入口。后端 112/112、前端 612/612、build 绿。走读页 `epic5-story4-codebases.html` 已补；Epic 5 已收口，5.4 done。

> **Epic 5 · 未决项汇总**：逐格 OQ/Deferred 见上；不在 P2 的能力见文末「P2 · 未决项」。本节不再另抄一份。

---

## Epic 7: 评测（eval）— 把「答得好不好」变成可复现的数字

> **2026-10-28 立格（Lynx 拍）**：P3 前置工程支线，不占 P3 主线的 AI SDK 能力点。P3 的 Agent loop + 联网工具会重塑回答链路；先建立可复现的度量，之后每次改动（loop、工具、检索参数）都有前后对照。同时把 PRD SM-2 的人工抽样口径升级为可重复指标。
>
> **载体当天改口径（2026-10-28，Lynx 拍）**：原定「Langfuse Datasets / Experiments 为载体」推翻，改为 **本地表 + 自建 `/evals` 工作站面板**。三条理由：① 运行配置、测评配置、配置快照都是自定义结构，Langfuse 的 dataset/experiment 装不下；② 面板要按 case 筛、按 run 并排、按配置回溯，都是关系型查询；③ 题集是产品数据，不锁在观测工具里。Langfuse 继续只做 trace 观测，不接 datasets。
>
> **编号**：不复用已取消的旧 Epic 6（文件 URI，2026-10-27 折回 Story 5.2），避免同号不同义。
>
> **评测对象边界**：只评知识库问答链路（检索 + 回答）；不评入库抽取质量、不评代码库、不评前端视觉。
>
> **工具边界**：不引入第三方 eval 框架（Ragas / promptfoo 等）；指标计算与判分住自己的代码。

**两个颗粒度（2026-10-28 拍）**

| 颗粒度 | 评什么 | 成本 | 判分 |
|---|---|---|---|
| **召回** | gold chunk 有没有进前 k | 秒级、零 LLM | 全自动 |
| **对话** | 回答对不对、引用有没有依据 | 分钟级、有 LLM 成本 | 断言 > HITL > judge |

颗粒度不单独选：**由测评配置是否含 judge 决定**——没配 judge 就只算召回，配了才去评回答。

**三个入口（侧栏「评测」组）**

| 路由 | 视图 | 三栏内容 |
|---|---|---|
| `/evals` | 运行 | 左 run 历史 · 中 逐条结果 · 右 case 详情 |
| `/evals-cases` | 题集 | 左 数据集 · 中 case 表 · 右 case 定义 |
| `/evals-configs` | 配置 | 左 配置清单 · 中 配置字段 · 右 用过它的 run |

**Run = 数据集 × 运行配置 × 测评配置（2026-10-28 拍）**
- 模型、k、temperature、rrf、vectorTopK、lexicalTopK、minSimilarity 全部归**运行配置**
- judge 模型、rubric 版本、指标集归**测评配置**
- 两种配置都是**整套命名预设**，不逐项勾选

**指标口径（2026-10-28 拍）**
- **全部百分比**：`recall@k = 命中 gold 数 / gold 总数`；`MRR = 1 / 名次`。
- **成败两极**：正例 gold 全中找到 = 满；负例一条都不命中 = 成功。部分命中不算失败，用百分比表达程度。
- **不做自动 diff**：两次 run 并排摆数字，变好退化由人看，系统不下判决。

**Epic 级 DoD**
**And** 对一个数据集，点一次「运行」就能跑出逐条结果与聚合百分比。
**And** 任意一次历史 run 都能打开当时的完整题集与配置快照。
**And** 同一数据集的两份 run 能并排看逐条数字。
**And** 删掉一个跑过 run 的数据集会被拒绝，先删关联 run 才允许。
**And** eval 不污染聊天历史与会话统计；共享模式下评测 trace 进主库但带 `/eval` 前缀，可按 route 过滤。

**UI 底座（2026-10-28 已落地，mock 只读）**
三个页面已按工作站三栏做出来，读 `app/web/src/lib/evals-demo.ts` 的假数据：`/evals`、`/evals-cases`、`/evals-configs`。接入真接口时只换数据来源，不改形状。

---

### Story 7.0: 评测连接（默认主库，可选隔离库）

**Implements:** 无 FR；为 Epic 7 提供「评测跑主库或独立库」的连接选择
**Depends:** 无

As a Lynx，
I want 评测默认直接跑在主库上，也能凭一份配置切到独立评测库，
So that 平时不折腾；不想让评测语料/实验影响生产检索时，一条配置就能隔离；以后要把「多知识库」做成功能时，这条连接抽象能直接延用。

**Acceptance Criteria:**

**Given** 没有 `EVAL_DATABASE_URL`
**When** 启动服务
**Then** 评测世界与主世界共用同一个 pg pool 与同一份数据（**共享模式**）；主应用照常启动
**And** `GET /eval/status` 返回 `{ mode: 'shared', reachable, corpus }`；评测三页照常可用，不因缺 URL 被禁用

**Given** 设置了 `EVAL_DATABASE_URL`
**When** 启动服务
**Then** 评测世界使用独立的 pg pool 连评测库（**隔离模式**）；主应用照常启动
**And** 评测库跑同一套 dbmate 迁移（表结构与主库一致）；`npm run eval:db:setup` 可建 `ragdb_eval` 并迁移
**And** 评测库的维度校验、partial HNSW 与主库同一条规则（AD-4 / AD-9），不做第二套语义

**Given** 隔离模式
**When** 往评测库灌语料
**Then** 走现有 ingest 链路，写入的是评测库的 resources / chunks / embeddings；`scripts/eval-seed.ts` 能把主库 ready 资源按份重灌过去（对象按新 key 复制，不共享主库对象）
**And** 主库与评测库互相看不见对方的数据：两边的资源列表与检索结果不交叉
**And** 连接池各管各的：评测跑批不会占满主库连接

**Given** 共享模式
**When** 评测跑批
**Then** 评测与主库共用连接与语料是显式取舍，不另做隔离；评测产生的资源/痕迹会出现在主库里，按 `/eval` 路由前缀可识别
**And** 主库的 `/ask`、`/resources`、`/retrieve` 行为不变

**Given** 评测产生 trace（任一模式）
**When** 看观测
**Then** trace 写进评测世界选中的那个库；route 带 `/eval` 前缀（或 `EVAL ...`），能按 route 过滤；不混进正常聊天统计
**And** 不加 `origin` 列

**方向**
- 评测世界 = 主世界换一个 pgpool：共享模式直接复用主库那套服务；隔离模式手工构造第二套。不把 repo 改造成多实例容器。
- 选择放 env（启动时定），不做 UI 热切换；`/eval/status` 只摆 mode 与计数。
- 之后要把多知识库做成产品功能时，这条连接抽象直接延用，不在 7.0 里提前做 namespace。

**Open questions（2026-10-28 已收口）**
- ~~`OQ-7.0-1` 评测库的库名与创建方式~~ → **隔离模式**用 `ragdb_eval`；`scripts/eval-db-setup.ts` + `npm run eval:db:setup` 一键建库并跑同一套 dbmate 迁移（`--no-dump-schema`）。连接串只走环境变量，不进 argv；共享模式不需要建库。
- ~~`OQ-7.0-2` eval trace 的标记放哪~~ → **两库同构：同一套迁移、同一套 traces 行为；评测 trace 写评测世界选中的库，标记沿用 route 前缀（`METHOD /eval/...`），不加 `origin` 列。** 主库端点壳跳过 `/eval*`，评测子应用自带一层 trace。
- ~~`OQ-7.0-3` 评测库的语料是否允许和主库重复~~ → **隔离模式允许两库各一份**（对象也复制成新 key）；共享模式天然同一份。`content_hash` 去重是库内作用域。

**Deferred:** 多知识库 / namespace → P3 之后作为独立功能；评测库的独立备份策略 → 未排期。

> **开工清单（2026-10-28，Lynx 拍）**：7.0 的 OQ 已全收口，可进 `ready-for-dev`。详细口径：
> - **模式选择**：`EVAL_DATABASE_URL` 是可选开关。不设 = 共享模式（评测世界直接用主库的 pool/repo/服务）；设了 = 隔离模式（第二个 pool + 一套同构服务）。两种模式主应用都照常启动；评测三页都不禁用。
> - **建库（只隔离模式）**：`npm run eval:db:setup` 读 `EVAL_DATABASE_URL`，缺库时连同实例的 `postgres` 库建 `ragdb_eval`，再用 dbmate 跑同一套迁移；重复执行幂等。
> - **装配**：评测世界 = 主世界换一个 pgpool。共享模式复用主库的 `PostgresRepo`/`RetrieverHandle`；隔离模式新增 `EvalDbHandle` + `EvalPostgresRepo`，`EvalAssembly` 用同一批服务类手工构造。共享 `ObjectStoreHandle` / `EmbeddingHandle` / `IngestFactory` / `InflightRegistry`；不改 Repo 为多实例容器。7.1 的 eval_* 表随同一套迁移走：共享模式在主库，隔离模式在评测库（setup 时跑同一套迁移）。
> - **出口**：7.0 只挂 `GET /eval/status` 与验证用的 `POST /eval/retrieve`（复用 `RetrieveRoute`）。不挂 `/eval/resources`：隔离语料用 `eval:seed`，避免两条写入口径；四表 CRUD、chat、codebases 不镜像。
> - **语料（只隔离模式）**：`scripts/eval-seed.ts` 把主库 `status='ready'` 且未软删的资源复制对象到评测库自己的 key（`keyForUpload`/`allocateKey`），建行后用现有 ingest 链路（storage fetcher → parse → chunk → embed → write）重灌；不共享主库对象，主库 purge 不影响评测。seed 前先 `markStaleOnBoot`。
> - **观测**：主库端点壳 `SKIP_PREFIXES` 加 `/eval`；评测子应用用 `createEndpointTrace(选中库的 repo)`，route 模板带 `/eval` 前缀，作为标记与过滤依据（`GET /traces?route=...` 已支持 route 过滤）；`/eval/status` 不记 trace。
> - **健康探针（2026-10-28 追加）**：`/health` 增加 `eval` 组；shared 恒 ok + `mode=shared`，isolated 真 ping + `mode=isolated`/reachable；隔离库不可达按现有全绿口径 degraded；前端健康页自动出第 4 张卡（骨架 3→4）。
> - **前端**：三个评测页读 `/eval/status`，在页头显示「共享主库 / 隔离库」徽标；不做缺库禁用。
> - **Deferred 去向**：多知识库 / namespace → P3 之后独立功能；评测库独立备份 → 未排期。本格不转出其他 deferred。

> **as-built（2026-10-28，review）**：shared/isolated 连接、`EvalRoute`、health eval 组、页头徽标、`eval:db:setup` / `eval:seed` 已落；后端 21 文件 124 tests、前端 73 文件 639 tests、build 绿；隔离库 45 篇 / 949 块与主库逐篇一致；走读页 `walkthroughs/epic7-story0-eval-connection.html`。Lynx 2026-10-28 判定完成（done）。

---

### Story 7.1: 题集与配置底座

**Implements:** 无 FR；服务 SM-2 / NFR-2（P3 前置工程支线）
**Depends:** 7.0（评测库）

As a Lynx，
I want 把题集、运行配置、测评配置存进自己的库并能在面板里维护，
So that 每次运行都引用同一份题集和同一套参数，题集改了也不影响历史运行。

**Acceptance Criteria:**

**Given** 迁移已执行
**When** 查库
**Then** 新增 `eval_datasets`（id / name / note / baseline_run_id）、`eval_cases`（id / dataset_id / case_key / level / query / negative / note / gold jsonb）、`eval_configs`（id / kind / name / config jsonb）+ `eval_runs` 最小骨架（见下条 AC）
**And** 运行配置与测评配置合并成一张表，配置体只放 `config` jsonb：run 的 `{model, k, temperature, rrf, vector_top_k, lexical_top_k, min_similarity}`、metric 的 `{judge_model, rubric, metrics}`；数值与模型合法性在 API 层校验，DB 只保 jsonb 是对象
**And** `eval_cases.gold` 存 `[{ data_uri, chunk_index, content_prefix }]`——用可读路径 + 块号定位，不存随机 uuid
**And** 一个 query 可以标多条 gold；负例的 gold 为空数组

**Given** `/evals-cases` 页面
**When** 新建 / 编辑 / 删除 case
**Then** 改动立刻落库，题集表与右栏定义同步刷新
**And** 复制数据集会带走全部 case 的深拷贝；复制单条 case 会以它为模板打开新建表单

**Given** 一个数据集已经跑过 run
**When** 尝试删除它
**Then** 拒绝并提示「先删掉关联的 N 次运行」
**And** 复制不受限制
**And** 7.1 的迁移同时建 `eval_runs` 最小骨架（id / dataset_id / status / created_at），只服务删除守卫与 `baseline_run_id` 指向；快照与逐条结果列由 7.2 在同表 ALTER 补上

**Given** 仓库里已有 `app/server/scripts/eval-cases.json`
**When** 跑一次种子导入
**Then** 那 15 条进入第一个数据集 `probe-2026-10-28`，`case_key` 沿用 L1-01…L5-03

**Given** `/evals-configs` 页面
**When** 新建 / 编辑 / 复制运行配置或测评配置
**Then** 名称为空时拒绝；`model` 必须是 `/models` 在册的键
**And** 改配置不影响任何历史 run——历史 run 读的是自己的快照

**方向**
- 导入导出：JSON 整包进出（数据集 + case），先 CLI 或按钮都行
- 数据集不做版本号：滚动更新，历史由 run 快照兜住

**Open questions（已收口）**
- `OQ-7.1-1` 相关性粒度 → **chunk 级**，一个 query 多条 gold；不做 resource 级
- `OQ-7.1-2` 题集来源 → 人工从现有 45 篇出题；LLM 只生成候选，入库前人工确认；首批 15 条已就位
- `OQ-7.1-3` 数据承载 → **本地表**（D1=A，2026-10-28 拍）
- `OQ-7.1-4` 数据集版本 → 不做版本号，**run 存快照**
- `OQ-7.1-5` runs 表归属 → **7.1 建最小骨架**（id / dataset_id / status / created_at），7.2 同表 ALTER 加快照与结果；删除守卫走 `dataset_id` 外键 RESTRICT + 计数提示；`baseline_run_id` 只是可空 uuid、不加外键（循环 FK 会让生成的 drizzle schema 推断崩），采纳基线时按同数据集校验

**Deferred:** 多标注者与一致性 → 不做（单人项目）；自动出题不经确认 → 未排期。

> **开工清单（2026-10-28，Lynx 拍）**：7.1 的 OQ 已全收口，可进 `ready-for-dev`。详细口径：
> - **表**：`eval_datasets` / `eval_cases` / `eval_configs` 三张 + `eval_runs` 最小骨架；配置体只放 `config` jsonb，run 与 metric 用 `kind` 区分；同一套 dbmate 迁移，主库与评测库各跑一次（评测库用 `npm run eval:db:setup`）。
> - **gold**：chunk 级，`[{ data_uri, chunk_index, content_prefix }]`；`content_prefix` 取块内容 trim 后前 80 字符。`eval-cases.json` 的 `path` 在**目标库**（共享=主库，隔离=评测库）里解析成 `data_uri`；找不到或不唯一即导入失败，不猜。
> - **API**：`/eval` 下自定义 Hono 路由（datasets / cases / configs(kind) + copy），不用 hono-crud——eval 表住「选中的库」，hono-crud 的 orm 固定主库。写入一律走 `EvalAssembly.repo`。校验：名称非空、`model` / `judge_model` 必须是 `/models` 在册键、配置数值合法、gold 形状。
> - **删除保护**：数据集有 run 时 409，提示关联 N 次运行；复制不受限（深拷贝全部 case）。
> - **case 复制**：只在前端以它为模板打开新建表单，不在后端建副本。
> - **种子**：`npm run eval:cases:import` 读 `scripts/eval-cases.json` → 数据集 `probe-2026-10-28`，`case_key` 沿用 L1-01…L5-03；按 (dataset_id, case_key) upsert。
> - **导出**：7.1 只做导入；JSON 导出 → 未排期（有需要再补）。
> - **前端**：`/evals-cases`、`/evals-configs` 接真接口，改动即落库并刷新；model 下拉读 `/models`；`/evals` 运行视图继续 mock（7.2/7.3 接）。
> - **Deferred 去向**：多标注者一致性 → 不做；自动出题不经确认 → 未排期。本格不转出其他 deferred。

> **as-built（2026-10-29，review）**：四表迁移已落（主库与 `ragdb_eval` 均 17 applied：`eval_datasets` / `eval_cases` / `eval_configs` / `eval_runs` 骨架）。`repo/eval.ts` + `Repo` 的 eval 段（共享/隔离两套 repo 自动可用）；`/eval` 下 datasets / cases / configs 自定义路由与校验（名称、gold 形状、负例空 gold、model / judge_model 在册、数值范围、数据集有 run 时 409）；`npm run eval:cases:import` 导入 15 条（18 个块级 gold、3 条负例，两库各验一次）；`/evals-cases` 与 `/evals-configs` 接真接口，`/evals` 运行视图仍 mock。后端 24 文件 135 tests、前端 675 tests、build 绿；走读页 `walkthroughs/epic7-story1-eval-datasets.html`。同日双镜头审查后修了后缀匹配、gold 归一化、配置上界、删除竞态与若干前端状态问题（详见 handoff）。关键偏离：`eval_run_configs` / `eval_metric_configs` 合并为 `eval_configs(kind, config jsonb)`（Lynx 2026-10-28 拍）；`baseline_run_id` 不挂外键（循环 FK 令生成的 drizzle schema TS7022）。

---

### Story 7.2: 发起检索评测

**Implements:** 无 FR；服务 SM-2 / NFR-2
**Depends:** 7.0、7.1

As a Lynx，
I want 选好数据集、运行配置、测评配置，点一下就跑完，看到每条 case 的名次与百分比，
So that 每次调整检索或模型之后，都有可比的数字。

**Acceptance Criteria:**

**Given** 数据集、运行配置、测评配置都已存在
**When** 在 `/evals` 点「运行评测」
**Then** 服务端建一条 run，状态 `queued` → `running` → `done | failed`
**And** 执行复用生产检索链路（`RetrieverHandle.retriever.search`，与 `/retrieve` 同一只），不另写一套检索
**And** 一次只跑一个 run，后来的进队列；排队中的可取消，运行中的可中止
**And** **失败不自动重试**——保留错误原因，人决定要不要再跑

**Given** run 开始执行
**When** 落库
**Then** 同一行 `eval_runs` 里冻结快照：题集逐条内容、运行配置全部参数、测评配置全部参数、embedding 模型与维度、语料规模
**And** 快照是只读副本，之后改题集或改配置都不影响它

**Given** run 跑完
**When** 看 `/evals` 中栏
**Then** 每条 case 一行：最好名次、命中数/总数、`recall@k` 百分比、MRR 百分比、耗时
**And** 顶部四格聚合：平均 recall、平均 MRR、失败数、总耗时，全部从明细算出来
**And** 三档颜色：`0%` 红（失败）／部分 黄 ／`100%` 绿

**Given** 一条负例被命中
**When** 判定这条 case
**Then** 记失败（负例的正确行为是一条都不命中）
**And** 正例只命中部分 gold 不算失败，显示部分百分比

**Given** 快照存在
**When** 从任意历史 run 打开「配置快照」
**Then** 能看到当时用的题集条数、运行配置、测评配置、embedding 模型与维度、跑的时间
**And** 提供「另存为新配置」，把快照里的参数存成一份新的运行配置 / 测评配置

**Open questions（已收口）**
- `OQ-7.2-1` 指标集与 k → 全部百分比：`recall@k`、MRR；k 来自运行配置
- `OQ-7.2-2` 入口 → `POST /eval/runs` + 面板按钮；CLI 可选
- `OQ-7.2-3` 预期 chunk 失效（资源被删、内容改了）→ 跑的时候按 `content_prefix` 校验，对不上记 `expected_chunk_missing`，该条按未命中算并在右栏标出来
- `OQ-7.2-4` 队列持久化 → **不持久化**：重启时排队中的直接丢，标为已取消；已完成的 run 不受影响

- `OQ-7.2-5` 逐条结果存储 → **`eval_runs.results jsonb`**（每项 `{case_key, negative, rank, matched, total, recall, mrr, missing_gold, duration_ms, error}`）；聚合与 7.3 对照在读取时算，不建 `eval_run_cases` 表
- `OQ-7.2-6` 每 run 参数 → 给 `SearchOptions` 加 `vectorTopK / lexicalTopK / minSimilarity / rrfK`（k 仍是 `limit`）；仍是一只 retriever，`/retrieve` 用缺省
- `OQ-7.2-7` 运行删除 → 只补后端 `DELETE /eval/runs/:id`（运行中 409「先中止」；删行时清空数据集的 `baseline_run_id`）；前端入口留到 7.3
- `OQ-7.2-8` 中止 → 在 case 之间检查；已写进 `results` 的行保留
- `OQ-7.2-9` case 级错误 → 该行记 `error`、按未命中算，run 继续；run 级异常才 `failed`
- `OQ-7.2-10` 测评配置 → 7.2 只冻结不执行（judge 属 7.4）；`model / temperature` 不参与检索评测，快照里标注

**Deferred:** 自动回归 / CI 门禁 → 后续；vector-only / lexical-only 模式对比 → 未排期。

> **开工清单（2026-10-29，Lynx 拍）**：`OQ-7.2-1..10` 已收口，可进 `in-progress`。详细口径：
> - **表**：`eval_runs` 加 8 列 —— `run_config_id` / `metric_config_id`（FK → `eval_configs`，`ON DELETE SET NULL`）、`snapshot jsonb`（输入：题集逐条 + 两份配置 + embedding 模型/维度 + 语料计数）、`results jsonb`（输出：逐条数字）、`started_at` / `ended_at` / `duration_ms` / `error_reason`。不建 `eval_run_cases`。
> - **参数映射**：`k` = 融合后条数；`vector_top_k / lexical_top_k` = 两路候选数；`min_similarity` = 向量阈值；`rrf` = RRF 的 k；`model / temperature` 只记录不生效（检索评测不调 LLM）。
> - **队列**：进程内单队列、串行；重启时 queued/running → cancelled（启动清扫）；失败不自动重试。
> - **快照**：POST 时冻结；空数据集 400。
> - **gold 失效**：`getChunkByDataUri` + `content_prefix` 前缀比对；缺失计入 `missing_gold`、按未命中算。
> - **API**：`POST /eval/runs`、`GET /eval/runs?dataset_id=`、`GET /eval/runs/:id`、`POST /eval/runs/:id/cancel`、`DELETE /eval/runs/:id`（后端 only）。
> - **前端**：`/evals` 全接真（数据集/配置下拉、run 历史、1.5s 轮询、逐条结果、四格聚合、详情/快照 + 另存为新配置、取消按钮）；对照 tab 留 7.3 空态；删掉 mock store 与「演示数据」标识。
> - **Deferred 去向**：自动回归 / CI → 后续；vector-only / lexical-only → 未排期。本格不转出其他 deferred。

> **as-built（2026-10-29，review）**：`eval_runs` 加 8 列（`snapshot` 输入 / `results` 输出 / 时间线 / 错误）；`EvalRunner` 进程内单队列串行、case 之间中止、启动清扫中断 run；`SearchOptions` 四个覆盖位让 run 快照参数落到同一只 retriever；`/eval/runs` 五个端点（发起/列表/详情/取消/删除）；运行页换真数据（1.5s 轮询、取消、逐条结果、详情/快照/另存）。真跑：probe 15 条 → done，recall 75.56% / MRR 53.45% / failed 3 / 18.2s；取消 202 → cancelled 保留 1 条；跑一半重启 → cancelled / 进程重启 保留 2 条；有 run 删数据集 409、删 run 后 204。后端 28 文件 154 tests、前端 85 文件 723 tests、build 绿；走读页 `walkthroughs/epic7-story2-eval-runs.html`。关键取舍：结果存 `results` jsonb（不建明细表）、每 run 参数走覆盖位、运行删除只做后端。

---

### Story 7.3: 对照与基线

**Implements:** 无 FR；服务 SM-2
**Depends:** 7.2

As a Lynx，
I want 把任意一次 run 钉在右边，和当前这次逐条并排看数字，
So that 改动前后差在哪一眼能看出来，而不用系统替我下结论。

**Acceptance Criteria:**

**Given** 某个数据集已经有一条「当前基线」
**When** 打开 `/evals`
**Then** 基线默认被钉在右栏「对照」tab
**And** 右栏可在「详情 / 对照」之间切换；选「对照」时逐条摆两次的 recall 百分比，同一顺序

**Given** 想换基线
**When** 在某次 run 上点「采纳为基线」
**Then** 该数据集的 `baseline_run_id` 指向它
**And** **不采纳就一直是旧基线**——run 跑完只是候选，不会自动改基线

**Given** 右栏是对照模式
**When** 看数字
**Then** 系统**不算**「变好 / 退化 / 新增 / 消失」，只把两列数字摆在一起

**Given** 两次 run 的 case 集合或配置不同
**When** 并排
**Then** 顶部并排两次 run 的总分（平均 recall / MRR），可直接比较
**And** 另给「相同条目」的平均分对比：只算两次 run 都有的 case，标出条数
**And** 不判断判法是否一致，也不出「不可比」提示

**Open questions（已收口）**
- `OQ-7.3-1` 基线范围 → **每个数据集一个**；换基线是显式动作
- `OQ-7.3-2` 对照呈现 → 右栏 tab 逐条并排；不做 diff 计算、不做趋势图

- `OQ-7.3-3` 可采纳范围 → **只允许 `done`**；queued/running/failed/cancelled 不可当基线
- `OQ-7.3-4` 默认 tab → 右栏默认仍是「详情」；进「对照」后基线自动钉住，不用再挑 run
- `OQ-7.3-5` 当前即基线 → 提示「当前这次就是基线」，不出两列相同数字；采纳按钮隐藏
- `OQ-7.3-6` 题集不同 → 以当前 run 的 `snapshot.cases` 顺序为准；基线缺的 case 显示「—」；不计算新增/消失
- `OQ-7.3-7` 判法不一致 → **不做一致性判断、不出黄条**；总分（两次 run 各自全部 case 的平均 recall / MRR）直接并排；另给「相同条目平均」（两次 run 都有的 case）对比并标条数
- `OQ-7.3-8` 删除入口 → 右栏顶部两步确认（第一下装填、4 秒内再按才真删）；不在左侧 run 行内嵌按钮

**Deferred:** 自动 diff、趋势图、跨数据集对比 → 未排期。

> **开工清单（2026-10-29，Lynx 拍）**：`OQ-7.3-1..8` 已收口，可进 `in-progress`。详细口径：
> - **API**：`PUT /eval/datasets/:id/baseline`，body `{run_id}`；数据集或 run 不存在 404、run 不属于该数据集 400、run 非 `done` 409；返回 `{dataset}`。
> - **前端**：对照 tab 拉基线 run 详情，按当前 run 的快照顺序并排 recall；顶部并排两次 run 的总分，另给「相同条目平均」（交集，标条数）；采纳按钮在右栏，仅 `done` 且非当前基线时显示；删除运行入口在右栏顶部。
> - **徽标**：基线徽标沿用运行列表（`baselineId`）；采纳/删除后重拉数据集、运行列表与详情。
> - **Deferred 去向**：7.2 转出的运行删除 UI 在本格做（后端已有 `DELETE /eval/runs/:id`，运行中 409）；7.1 转出的 gold 前端挑选/编辑归 7.4 / 未排期；自动回归 / CI 仍为后续；本格 Deferred 全部未排期。

> **as-built（2026-10-29，review）**：后端加 `PUT /eval/datasets/:id/baseline`（只接属于该数据集且 `done` 的 run；数据集/run 不存在 404、归属不符 400、非 done 409），repo 加 `setDatasetBaseline` 并接进 `Repo` 契约。前端对照 tab 拉基线详情，按当前 run 的快照顺序并排 recall；顶部并排两次 run 的总分（全部 case 的平均 recall/MRR），另给「相同条目 · N 条」平均（只算两次 run 都有的 case，不做 diff、不出判法一致性黄条）；当前 run 即基线时给提示且隐藏采纳；右栏新增「采纳为基线」与两步删除运行（第一下装填、4 秒内再按才删，运行中隐藏按钮、后端 409 兜底），删基线 run 后数据集 `baseline_run_id` 由后端自动清空。真跑（隔离库、临时数据集 1 条 case）：run done（recall 100% / MRR 50%）→ 采纳 200；排队中采纳 409 `E_EVAL_RUN_NOT_DONE`；跨数据集采纳 400 `E_EVAL_BASELINE_DATASET`；删基线 run 后 baseline 为 null；临时数据已清理。后端 155 tests（远端库抖动时 9 个失败文件重跑 49/49）、前端 85 文件 727 tests、tsc 0、build 绿；走读页 `walkthroughs/epic7-story3-baseline-compare.html`。

---

### Story 7.4: 答案评测（第二版）

**Implements:** 无 FR；服务 SM-2 / NFR-2
**Depends:** 7.1、7.2
**状态**：已收口（2026-10-29），待 Lynx 放行后进 `in-progress`。

**Acceptance Criteria（方向级）:**
**And** 每条 case 可写两组断言：必须出现（expect）、必须不出现（reject），全部满足才算通过
**And** 跑真实回答链路（与 `/chat` 同一套 prompt + retrieve 工具），记录回答与引用
**And** 断言判不了的才交给人（HITL）或 judge；三者分工：**断言 > HITL > judge**
**And** judge 用结构化输出给三维分数：groundedness / correctness / citation
**And** HITL：人判与机器判**并存**，算一致率；一致率低的那类题单独标出来
**And** 评测跑在隔离会话，不污染正常聊天与统计

**Open questions（已收口 2026-10-29）**
- `OQ-7.4-1` 断言匹配 → **子串（大小写不敏感）+ 每条可选正则开关**；断言条目 `{text, regex}`，正则保存时校验可编译
- `OQ-7.4-2` judge 模型 → **不设默认、不强制不同源**；评测配置显式选任意在册模型，null = 不跑 judge；先做结构化输出 spike
- `OQ-7.4-3` rubric → **配置存版本名，正文住代码**；建 run 时把版本名 + 解析后的正文一起冻进 snapshot
- `OQ-7.4-4` HITL → 人可以**改机器分**或**独立打分**；可以**修正错误的题面**（写回 `eval_cases`，当前 run 快照不变）；人判参与最终判定
- `OQ-7.4-5` 分数合成 → **断言硬门 + 取更严**：有断言必须全过；judge 与人判都存在时两者都 pass 才 pass；只有一个时用它；都没有且无断言 → `unscored`
- `OQ-7.4-6` run 类型 → **不加列，但发起时可显式选**：`POST /eval/runs` 接受 `mode: retrieval | answer` 并写进快照；不传时按旧规则推断（`judge_model` 非空或任一 case 有断言 → answer）；读路径优先用快照 mode

**Deferred:** 多次采样与置信区间 → 未排期；pairwise 对比 → 后续；人工标注平台 → 不做。

> **开工清单（2026-10-29，待 Lynx 放行）**：
> - **表**：`eval_cases` 加 `assertions jsonb`（`{expect, reject}`，条目 `{text, regex}`，默认空）；`eval_runs` 加 `human_results jsonb`（人判覆盖，机器结果保留用于一致率）；`results` 每条扩展 `answer / citations / assertion / judge`。两列迁移，两库同步。
> - **执行**：answer run 复用 `INSTRUCTIONS` + retrieve 工具，`generateText` 非流式、不写 `sessions` / `messages`；单队列、case 间中止、启动清扫沿用 7.2；judge 失败记行不杀 run。
> - **judge**：rubric v1 三维 0–2 + `verdict` / `reason`，`Output.object` 结构化输出；spike 覆盖 DeepSeek Flash 与 qwen-plus，记录解析成功率。
> - **判定**：断言硬门 + 取更严；`unscored` 单列，不计入 pass/fail。
> - **API**：case 增删改/复制/导入带 `assertions`；`PUT /eval/runs/:id/human` upsert 人判；运行详情返回 `human_results`；`POST /eval/runs` 接受可选 `mode`（2026-10-30 追加：显式选召回/对话，写进快照）。
> - **前端**：题集页断言编辑（子串/正则开关）；运行页按推断模式切换列与详情；人判编辑 + 修正题面；对照按模式分支，跨模式只提示不并排。
> - **一致率**：按 level 汇总；低于整体一致率的题组标出，不设绝对阈值。
> - **Deferred 去向**：多次采样 / 置信区间 → 未排期；pairwise → 后续；人工标注平台 → 不做；gold 前端挑选 → 未排期。

> **as-built（2026-10-29，review）**：`eval_cases.assertions`（`{expect,reject}`，条目 `{text,regex}`）与 `eval_runs.human_results` 两列迁移（两库均 applied）；case CRUD / 复制 / 导入带断言，正则保存时校验。模式用快照推断（`judge_model` 非空或任一 case 有断言 → answer），不加列。答案执行复用 `INSTRUCTIONS` + retrieve 工具走 `generateText`（不写 `sessions` / `messages`），逐条「回答 → 断言 → judge → 合成」；结果扩展 `answer / citations / assertion / judge / verdict`；rubric 版本名住配置、正文住代码，建 run 时连版本带正文冻进 snapshot。人判走 `PUT /eval/runs/:id/human`（按 case_key upsert，机器结果不覆盖），详情读取时重算 `final_verdict`；聚合新增 `summarizeAnswerResults`（断言/judge/人判一致率 + 按 level 汇总，低一致率题组标出）。前端：题集页断言编辑（子串/正则）、运行页按模式切换列与详情（回答/引用/断言/judge/人判）、修正题面写回题集、对照按模式分支（跨模式不并排）。真跑（隔离库、1 条 case）：37s done，回答 `0.42`、引用 5；断言过；judge 因回答没带 `[n]` 判 citation=0 → fail；人判 pass→fail 覆盖后一致率与 level 汇总正确；临时数据清理 204。后端 166 tests、前端 86 文件 735 tests、tsc 0、build 绿；走读页 `walkthroughs/epic7-story4-answer-eval.html`。

> **Epic 7 · 未决项汇总**：7.4 的 `OQ-7.4-1..6` 已收口（2026-10-29），待 Lynx 放行；7.0 已 done、7.1–7.3 均 `review`。

> **Code review（2026-10-29）**：Epic 7 全量 review 完成，findings 见 `_Agents/implementation-artifacts/review-2026-10-29-epic7.md`（D1–D3 已拍板转 patch；21 patch 已于 2026-10-30 全部落码 / 21 defer / 28 rejected）。

---

## Epic 8: Agent 工具箱（P2 收尾，为 P3 Agent loop 铺路）

> **2026-10-29 立格（Lynx 拍）**：P2 最后一个 epic，纯增量。目标不是做 loop，而是把「工具」这一层从单只扩到一组，并做成可扩展形状：P3 的 Agent loop 接上后，加工具不必再改机器。
>
> **边界**：两只只读工具 —— `resource`（知识库）与 `codebase`（代码库）；一只低风险写工具 —— `meta`（只改当前会话标题）。不碰其他写操作（资源/代码库改名、删除、主题/导航）、联网工具（P3 主线）、AST（未排期）、代码 RAG / 代码图；loop 编排与步预算调整不在本格，`stopWhen(5)` 保持不动。
>
> **引用边界**：`[n]` 引用仍只来自 `retrieve` 命中的 chunkId 前 8 位；`resource` / `codebase` 的文件用**正文内可点击的文件 chip** 引用（`file:` 链接，灰底 + 图标 + 文件名.扩展名，点开右侧抽屉看内容），不挂 `[n]`。OQ-8.1-1 已按此收口（2026-10-29）。
>
> **与 Epic 7 的关系**：不改评测的指标与表；答案评测**共用同一套 `buildAgentTools`**（无会话上下文，不下发 `meta`），Epic 8 收口时重跑一次并采纳为新基线（OQ-8.1-2 已收口，2026-10-29）。Epic 7 review 的「eval 直接 import agent 内部文件」项，2026-10-30 选了「扩展 registry 函数」方案后仍然存在，留到 retriever 层重写时一并处理。

### 三只工具的最终契约（2026-10-29 拍）

```ts
resource({
  ref: string,                 // UUID 或文件名（title / data_uri 原始文件名 / source 三面匹配）
  lines?: [number, number][]   // 闭区间、1-based、可多段；不给 = 前 80 行预览
})
→ {
  resource?: { id, title, fileName, source, status, content_type, size, created_at, updated_at, error_reason, chunkCount, ref }
  candidates?: [{ id, title, fileName, source, status, created_at, ref }]
  content?: { segments: [{ fromLine, toLine, text }], totalLines, truncated }
  error: { code, message } | null
}

codebase({
  ref?: string,                // 省略：只查清单→回 refs；带 path/match→用最新 ready 库
  path?: string,               // 目录=列条目；文件=读正文；配合 match=搜索范围
  match?: string,              // 字面量、大小写不敏感 → [{ path, fileName, line, text, ref }]
  lines?: [number, number][]   // 仅读文件时有效
})
→ {
  refs?: [{ id, title, original_filename, status, created_at }]
  codebase?: { id, title, original_filename, status, file_count, size }
  entries?: [{ path, is_dir, size }]
  matches?: [{ path, fileName, line, text, ref }]
  file?: { path, fileName, entryIndex, ref, totalLines, segments, truncated }
  candidates?: [{ codebase: { id, title }, path }]
  error: { code, message } | null
}

meta({
  title: string                // 本会话的新标题（trim 后 1..30 字符）
})
→ {
  sessionId: string
  title: string
  error: { code, message } | null
}
```

> `meta` 的 `sessionId` 由 `buildAgentTools` 按请求参数绑定，模型不传；无会话上下文（如评测答案跑）时不下发这只工具。
>
> `resource` / `codebase` 的 `ref` 形如 `file:resource/<id>` / `file:codebase/<id>/<entryIndex>`；模型引用时写 `[fileName](ref)`，前端把 `file:` 链接渲染成文件 chip。ref 由工具给，模型不得自造。

**实测依据（2026-10-29）**

- 块能无损拼回原文：主库 45 篇、连续块间 **0 空隙**、重叠 ≤80 字符；`text.slice(start_offset,end_offset) === content` 是分块器不变量。
- 现有代码库 1 个：`SSE_WeSocket-code-2026-10-27`，1493 条目（347 目录），9.2MB，`ready`；路径带根前缀 `SSE_WeSocket/`。
- `match` 必须整包取回内存扫：逐条目 Range GET 会变成约 1493 次请求（5.4 踩过同类坑）。
- 资源原文：URL 资源归档的是 HTML，chunks 上才是解析后文本；粘贴/上传文件原文 = 解析文本 ⇒ 行号一律以 chunks 铺回的文本为准。
- 会话标题当前只走 hono-crud `PATCH /sessions/:id`；Repo 没有 `updateSessionTitle`，需要在 adapter/repo 补一个方法。
- 前端会话标题住本地 store + PATCH；agent 改名后需要前端监听 `tool-meta` part 做本地同步，否则侧栏仍旧名。

**Epic 级 DoD**

**And** /chat 里模型能自己调用 `resource` 与 `codebase`，工具 part 在界面上可见。
**And** 工具错误一律 return `{code,message}`、不 throw；正文按行截断；输出同形给模型与前端。
**And** retrieve 的输入 / 输出 / 引用 / 右栏行为不变。
**And** INSTRUCTIONS 列出四只工具及使用条件，引用规则不松动。
**And** 前端能渲染任意 `tool-*` part（未知工具兜底），retrieve 专属视图保留。
**And** 正文里的 `file:` 引用渲染成灰底文件 chip，点击打开资源 / 代码库文件抽屉；未知 ref 原样显示。
**And** `meta` 只在有会话上下文时出现；改名后侧栏 / 页头标题即时更新，刷新后仍在。
**And** 评测口径按 OQ-8.1-2 落定，收口时跑一次基线。

---

### Story 8.1: 工具面底座 + `resource` 工具

**Implements:** 无新增 P1 FR；P2 收尾能力项（agent 工具面 + 知识库读取）

**Story 拆分（2026-10-29，Lynx 拍；sprint 里各占一条）**

| 子故事 | 范围 | 验收 |
|---|---|---|
| **8.1-A** 契约 + Repo + `resource` 核心 | `agent/tool/contracts.ts` 类型；`Repo.listChunksByResource`；定位 / candidates / 行切片 / 块拼回 / 错误契约 | 单测覆盖定位、行区间、拼回、错误；tsc 0 |
| **8.1-B** registry 多工具 + 接线 | `buildAgentTools(Retriever, Repo, Options)` 返回 `{retrieve, resource}`；ChatService 按请求调用，eval 传自己世界的两份；retrieve 回归 | 真跑一轮 retrieve，hits / 引用 / 右栏不变 |
| **8.1-C** INSTRUCTIONS 工具目录 | `retrieve` + `resource` 的使用条件（`file:` ref 规则并入 8.5） | prompt 审阅 + 真跑一次模型会调 resource |
| **8.1-D** 单测 + 真跑 | UUID / 文件名 / 两段区间；retrieve 回归；全量测试 | 8.1 可验收 |

**Acceptance Criteria**

- **[B]** `buildAgentTools(Retriever, Repo, Options)` 改为多工具装配（`retrieve` + `resource`），Retriever/Repo 由调用方按请求传入；ChatService 每请求调用，不再在构造期烧死工具表。
- **[B]** `eval/answer` 仍复用 `buildAgentTools`（函数边界）；`answerCase` 增加 `Repo` 参数，评测传自己世界的 Retriever/Repo（无会话上下文，不下发 `meta`），8.6 重跑基线（OQ-8.1-2 已收口）。Epic 7 review 的 AD-1（eval 直接 import agent 内部文件）继续留着，等 retriever 层重写时处理。
- **[A]** `resource` 定位：UUID 精确命中；否则在 `title` / `data_uri` 原始文件名 / `source` 三面做大小写不敏感子串匹配；多命中回 `candidates`（id/title/source/status/created_at），不读正文。
- **[A]** 只给 `ref`：回 metadata（含 `chunkCount`、`fileName`（data_uri 原始文件名，含扩展名）与 `ref`=`file:resource/<id>`）+ 前 80 行预览（`content` 非 null，`truncated` 表示是否还有更多）；给 `lines` 时只回请求区间。
- **[A]** `lines` 为闭区间数组：先按起点排序、合并重叠/相邻段；越界 clamp 到 `[1,totalLines]`；段数 ≤10、单次总行数 ≤300，超出按段序截断并标 `truncated`。
- **[A]** 正文用 chunks 按 `chunk_index` + `start_offset` 铺回原文；`text` 带行号前缀，`totalLines` 为全文行数。
- **[A]** 非 `ready` → metadata + `E_NOT_READY`；不存在 → `E_RESOURCE_NOT_FOUND`；软删资源不可见。
- **[A]** 工具内所有预期错误 return `{code,message}`，不 throw；非预期 bug 记 `E_TOOL_RESOURCE` 日志后照旧抛。
- **[C]** `INSTRUCTIONS` 改为工具目录式：本格先写 `retrieve` + `resource` 的使用条件（何时从 retrieve 升级到 resource、`lines` 闭区间、多候选收窄、错误与无命中分开），后续 story 加工具时同步追加；引用规则保持「[n] 只来自 retrieve hit 的 chunkId 前 8 位」。`file:` ref 规则并入 8.5，等 chip 渲染器落地再加。
- **[D]** 真跑：UUID 与文件名各一次、两段行区间；retrieve 一轮问答与改动前一致（hits / 引用 / 右栏）；tsc 0、后端测试全绿。

**Open questions（开工前收口）**

- OQ-8.1-1：**已收口（2026-10-29）**：`resource` / `codebase` 的文件用正文内 `file:` chip 引用（灰底 + 图标 + 文件名.扩展名，可点击），不挂 `[n]`；`[n]` 仍只来自 retrieve。
- OQ-8.1-2：**已收口（2026-10-29）**：答案评测与 chat 共用新工具集（无会话不下发 `meta`）；8.6 收口时重跑一次并采纳为新基线。
- OQ-8.1-3：**已收口（2026-10-29）**：前端通用 tool-call 行落在 8.2，不推后。
- OQ-8.1-4：**已收口（2026-10-29）**：`stopWhen(5)` 保持不动；步预算统一留到 P3 Agent loop 再调。
- OQ-8.1-5：**已收口（2026-10-29）**：新工具调用只走 AI SDK 遥测的 Langfuse span，不写 `trace_stages`；`/traces` 面板不显示新工具细节。

**Deferred**

- 写工具（建/删/改资源与代码库）→ 未排期；本 epic 只写 `meta` 一处会话标题。
- 独立 `listResources` → 不做；`resource` 的 metadata / `candidates` 已覆盖。

---

### Story 8.2: 前端通用 tool-call 行

**Implements:** 无新增 FR；前端工具可见性

**Acceptance Criteria**

- `ToolCalls` 对任意 `tool-*` part 渲染一行：工具名、状态（准备参数 / 运行中 / 成功 / 失败）、输入摘要、结果摘要（`resource`：候选数或行区间；`codebase`：条目数 / 匹配数 / 文件行数）。
- `retrieve` 保留现有专属展开视图（查询词、topK、两路计数、命中标题），行为不变。
- 未知工具兜底显示可展开的 JSON 摘要，不崩。
- 右栏引用与 `referencesOf` 不变（仍只读 `tool-retrieve`）。
- 测试覆盖：通用行三态、`resource` / `codebase` 摘要、未知工具兜底；前端全量测试绿；Lynx 浏览器手测。

**Deferred**

- 工具调用的专属可视化（命中列表 / 文件树 / 代码高亮）→ 未排期；本格只做通用行。

---

### Story 8.3: `codebase` 工具

**Implements:** 无新增 P1 FR；代码库只读访问

**Acceptance Criteria**

- `ref` 省略且无 `path` / `match` → 回 `refs` 清单（id/title/original_filename/status/created_at），按 `created_at` 降序，上限 100。
- `ref` 省略且有 `path` / `match` → 用最新创建的 `ready` 库；无 ready 库 → `E_NO_CODEBASE`。
- `ref` 命中：UUID / title / original_filename 子串；多命中回 `candidates`。
- `path` = 目录（含空串 / 根）→ 直接子项（文件 + 子目录），`entries` 上限 200 + `total`；目录不存在 → `E_DIR_NOT_FOUND`。
- `path` = 文件 → 正文；精确路径优先，不中按路径后缀 / basename 匹配；多命中回 `candidates`；解码上限 2MB；二进制 → `E_BINARY_FILE`；不存在 → `E_FILE_NOT_FOUND`。返回 `fileName` / `entryIndex` / `ref`=`file:codebase/<id>/<entryIndex>`；`matches` 每条也带 `fileName` / `ref`。
- `lines` 语义与 `resource` 同一 helper（闭区间、排序合并、clamp、段数/行数上限）。
- `match`：字面量、大小写不敏感；范围用 `path` 当目录前缀（不给 = 全库）；跳过二进制与单文件 >1MB；回 `[{path,line,text}]`，上限 50 + `total` / `truncated`；整包取回内存扫，ZIP >100MB → `E_TOO_LARGE_FOR_MATCH`。
- 路径匹配容忍缺少 ZIP 根前缀（现有库根为 `SSE_WeSocket/`）。
- `INSTRUCTIONS` 增加 `codebase` 的使用条件（何时看代码库、`path` / `match` 怎么传）；引用代码文件时用工具返回的 `ref` 写 `[fileName](ref)`。
- 真跑现有 1493 条目库：`refs` / `dir` / `file` / `match` 四种读法；记录 `match` 耗时。
- 工具错误一律 return，不 throw；非预期 bug 记 `E_TOOL_CODEBASE` 后照旧抛。

**Open questions（开工前收口）**

- OQ-8.3-1：**已收口（2026-10-29）**：`match` 做字面量、大小写不敏感；不做正则 / 大小写开关。

**Deferred**

- AST（文件大纲 / 符号搜索）→ 未排期（Lynx 2026-10-29「ast暂时不做了」）。
- 代码 RAG / 代码图 → 另立 Epic。

---

### Story 8.4: `meta` 工具（会话标题改名）

**Implements:** 无新增 P1 FR；agent 低风险写操作

**Acceptance Criteria**

- `sessionId` 由 `buildAgentTools` 按请求参数绑定，模型不传；无会话上下文（评测答案跑）时不下发 `meta`。
- `meta` 只改当前会话标题；`title` trim 后 1–30 字符，越界回 `E_BAD_TITLE`；会话不存在回 `E_SESSION_NOT_FOUND`。
- 写库走新增的 `Repo.updateSessionTitle`（adapter/repo，drizzle update）；不直连 ORM / SQL。
- 成功返回 `{ sessionId, title }`；失败一律 return `{code,message}`，非预期 bug 记 `E_TOOL_META` 后照旧抛。
- INSTRUCTIONS 增加 meta 的使用条件：仅在用户明确要求改当前会话标题时调用，不主动改。
- 前端：收到 `tool-meta` 的 `output-available` 后把本地会话 store 的标题同步为新值（侧栏 / 页头即时更新），不额外发 PATCH；刷新后从服务端读回仍是新标题。
- 真跑：新建会话 → 让模型改名 → 侧栏即时更新、刷新仍在；「帮我改个标题」应由模型调用 meta，而不是普通文本回答。
- tsc 0、后端 / 前端测试全绿。

**Open questions（开工前收口）**

- OQ-8.4-1：**已收口（2026-10-29）**：不做审批；会话改名低风险可逆，写工具审批留到 P3 讨论。

**Deferred**

- 其他 meta 动作（主题 / 视效 / 导航等本地 UI 偏好、资源 / 代码库改名、删除）→ 未排期。

---

### Story 8.5: 文件引用 chip + 文件抽屉

**Implements:** 无新增 P1 FR；回答内的文件引用

**Acceptance Criteria**

- `markdown-answer` 的 `AnswerLink` 识别 `file:` 协议：`file:resource/<uuid>` 与 `file:codebase/<uuid>/<entryIndex>`；非法 / 未知 ref 回退成纯文本，与 citation 对不上时同一口径。
- chip 样式：文件图标 + 文件名.扩展名、灰底、可点击；图标按扩展名映射（md/txt → `text`，代码 → `file`，表格 → `table`，缺省 `file`）。
- 点击 chip 打开 /ask 右侧抽屉：
  - resource：标题 + 来源 + 正文；正文按 `GET /resources/:id/chunks` 每页 100 块加载，可继续加载。
  - codebase：`GET /codebases/:id/files/:entryIndex` 文本，用 `<pre>` 渲染。
- 抽屉只读；加载中 / 失败有状态；关闭回聊天，不丢当前会话。
- 流式期间 chip 与引用按钮一样可点（数据来自工具 part 的 ref，不依赖正文完整）。
- `INSTRUCTIONS`：引用 `resource` / `codebase` 文件必须用工具返回的 `ref` 与文件名，不得自造；`[n]` 仍只用于 retrieve 命中。
- 测试：ref 解析 / 校验、chip 三态、未知 ref 回退、抽屉两数据源；Lynx 浏览器手测。

**Deferred**

- 点击后按引用行区间高亮 / 居中 → 未排期。

---

### Story 8.6: 收口（组合真跑 + 回归 + 走读页）

**Acceptance Criteria**

- 组合真跑 3 个场景：① 知识库问答里 `retrieve` 命中后用 `resource` 展开全文；② 代码问答走 `codebase` 的 `dir` / `file` / `match`；③ 会话改名走 `meta`，两域混合提问。
- 回归：retrieve 的 hits / 引用 / 右栏不变；答案评测共用工具集跑一次，并采纳为新基线（OQ-8.1-2）。
- 后端 / 前端全量测试绿、tsc 0、build 绿。
- 六份 story 走读页齐全；handoff、LEARNING、sprint-status 对账。

**Deferred**

- 多工具调用的端到端评测题集（跨域 case）→ 未排期；8.5 只做人工组合真跑。

---

## P2 · 未决项与后续阶段（2026-10-24）

> 这里只记「不在 Epic 4/5」的能力；逐条的 Open questions 在对应 Story 下。
>
> **2026-10-29 更新**：P2 收尾 Epic 8（Agent 工具箱）已立，见上；本节仍记不在 Epic 4/5/8 的能力。

**不在 P2**
- ~~eval~~ **2026-10-28 立为 Epic 7（P3 前置工程支线）**：本地表 + 自建 `/evals` 面板（原 Langfuse Datasets / Experiments 载体当天推翻），golden set + 检索指标 + LLM judge；范围与 OQ 见上文 Epic 7。
- prompt 管理：仍记 backlog，不排阶段。
- sandbox：P3 Agent loop 之后；最小版本是子进程 + 超时 + 断网 + 目录白名单。
- tenant / auth / RLS：最后再做；现在保持单用户，不加占位 `tenant_id`。
- 公网下载鉴权（登录 / 退出吊销、请求 IP 绑定、一次性 token、边缘反代）：**P5 部署阶段**；P2 只做私有桶 + tailnet + presigned 直连，不绑 IP、不做 token 表。
- 代码依赖图分析、代码 RAG：各自另立 Epic。
- PDF/Word/Excel 等格式、批量上传/后台队列（P3 工程项）。

**P3 工程项**
- **T1 供应商与模型配置入库**（2026-10-30，Lynx 拍：从临时支线移入 P3；standalone，不进 Epic 列表）：provider / model / API Key / 默认模型从 env 与编译期字面量迁到 DB；Key 用 AES-256-GCM 存密文，独立 `/config` 管理页与 `config:seed`。spec：`_Agents/implementation-artifacts/spec-t1-provider-model-config.md`；状态见 `sprint-status.yaml` 的 `standalone_stories`。
