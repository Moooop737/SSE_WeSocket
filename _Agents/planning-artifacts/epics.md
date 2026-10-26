
---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md
  - _Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md
  - _Agents/legacy/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md   # v1，仅历史；AD 编号一律以 v2 为准
---

# Knowledge Copilot - Epic Breakdown（P1 MVP + P2 方向）

## Overview

本文件把 P1 的需求（PRD FR-1…FR-12）、架构不变量（ARCHITECTURE-SPINE AD-1…AD-11）拆成可实现的故事。项目单人自用、以学习 Vercel AI SDK 为第一目标。UI 走 `app/web` 的 Geist 设计系统（见 UX Design Requirements）。

**2026-10-24：P1（Epic 1–3）已收口**，Epic 1/2/3 全部 story `done`；同日追加 P2 的 Epic 4/5（方向级，详细 AC 待 story 开工前补）。

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

> **2026-10-24 追加**：Epic 4/5 为 P2 方向级条目；本文件只写到方向与未决项，详细 AC 在 story 开工前再补。Epic 3 收口后再开工。

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
> **不在本 Epic**：反馈、golden set、recall@k/MRR、LLM-as-judge 等 evaluation 能力——先只把 observation 做扎实，评测另立 Epic。
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
**Then** 迁移已落好 `traces`：`trace_id`（text 主键）、`session_id`、`resource_id`、`route`、`http_status`、`started_at`、`ended_at`、`duration_ms`、`status`、`error_code`、`langfuse_trace_id`、`created_at`、`payloads`（2026-10-22 增）
**And** `session_id` 与 `resource_id` 是请求级关联键：chat 填前者、ingest 填后者，其余为 null，不在明细表重复
**And** `route` 存 `METHOD + 匹配到的路由模板`（如 `POST /chat`、`POST /resources`、`GET /resources`、`POST /retrieve`），不存带 id 的原始 path
**And** 没有 `observation_kind`/`parent_observation_id`/`attributes`；3.1 只写公共行，3.2/3.3/3.4 只写明细，不再建表/加列
**And** 索引：`(started_at desc)`、`(session_id, started_at desc)`、`(resource_id, started_at desc)`、`(route, started_at desc)`；`trace_id` 是 text（UUID 或 OTel 32 位 hex）

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
**Then** 列：`id`（uuid PK；原 `trace_stage_id`，2026-10-22 主键统一改名）、`trace_id`（text FK）、`stage`（text）、`input`（jsonb）、`output`（jsonb）、`duration_ms`（integer）、`status`（text）、`created_at`（timestamptz）
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
**And** 本 story 不做 golden set、recall@k/MRR、feedback/score；这些 evaluation 能力另立 Epic，不塞进 observation
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
**Acceptance Criteria:** 待开工前补。

**方向**
- 回答正文改为 Markdown 渲染：GFM 表格、列表、代码块、标题、链接；用户消息与 reasoning 仍按纯文本。
- 引用规则沿用现状并在本格补齐：`[n]` 与 `[8 位 chunkId]` 都认、按正文首次出现顺序编号、数字名次不跨轮、8 位 id 可跨轮。**代码块与行内码里的标号不算引用是目标行为**——as-built 的 `plain()` 目前会保留代码内容，Build 1 要补解析规则并加用例钉住。
- 安全默认：不启用 raw HTML；链接加 `target`/`rel`；远程图片不加载（只留 alt/链接）。
- 流式期间最后一段可能是不完整 Markdown（半截表格/围栏）：未结束时按纯文本或容错渲染，结束后再解析。
- Build 1 先做 citation 自定义节点的尖刺，再决定插件实现。

**Depends:** 无（与画像独立）

**Open questions:**
- `OQ-4.4-1` 自定义 citation 节点能否稳定穿过 react-markdown 的 `components` 映射。
- `OQ-4.4-2` 单换行是否保留（`remark-breaks`）。
- `OQ-4.4-3` 图片、脚注、任务列表是否进入首期。
- `OQ-4.4-4` 流式半截 Markdown 的渲染策略（纯文本兜底 / 容错解析）。

**Deferred:** 语法高亮、数学公式、Mermaid、回答级 Markdown 下载；把回答改成 JSON part / Generative UI（P4）。

### Story 4.5: 表格渲染与 CSV 下载

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- GFM 表格真渲染；表头旁「下载 CSV」；流式期间不显示按钮，流成功结束且表格闭合后才可下载。
- CSV 带 UTF-8 BOM、引号/换行转义、文件名取表头；对以 `= + - @` 开头的单元格做公式注入防护（前缀单引号）。

**Depends:** 4.4

**Open questions:**
- `OQ-4.5-1` 首期只做 CSV，还是同时给 Markdown / Excel。
- `OQ-4.5-2` 是否需要「整条回答导出为 .md」。
- `OQ-4.5-3` 表头为空/重名/含文件系统非法字符时的文件名规则。

**Deferred:** 服务端生成文件、落 MinIO、再给下载链接的 artifact 模式。

> **Epic 4 · 未决项汇总**：逐格 OQ/Deferred 见上；不在 P2 的能力见文末「P2 · 未决项」。本节不再另抄一份。

---

## Epic 5: 文件与存储（P2 工程支线）

> **阶段定位（2026-10-24）**：为资源和代码库补「原始文件」层。Epic 5 只做文件管理，不做代码分析、不做代码 RAG。
> **边界**：不改入库分块/检索语义；不接 PDF/Word 等新格式；不做 AST/依赖图；不做批量上传/后台队列；不做 tenant。
> **依赖轨道**：轨 A · 资源文件 5.1 → 5.2 → 5.3；轨 B · 代码库 ZIP 5.1 → 5.4。两轨独立。
> **Story 粒度（2026-10-24 拆）**：4 格都是方向级；开工前补详细 AC 并收口 OQ/Deferred。代码库文件树/预览是否进首期留在 5.4 的 OQ，不单独建 story。

### Story 5.1: MinIO 适配器与配置

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- 用 S3 API 接 MinIO（`@aws-sdk/client-s3` + `forcePathStyle`）；定义 ObjectStore 契约（put/get/delete/stat）。
- 加 `S3_*` 配置与 fail-fast；启动时 bucket 检查/创建；不打印密钥。
- 只做适配器与配置；不接 ingest、不开路由。

**Depends:** 无

**Open questions:**
- `OQ-5.1-1` ObjectStore 的架构归属：放 `adapter/` 属 AD-2 的**第六类**，开工前须先改 AD-2；若住能力片则不受 AD-2 约束。二选一，不默认。
- `OQ-5.1-2` 本机 MinIO 怎么起（当前 shell 无 docker/minio）。
- `OQ-5.1-3` bucket 自动创建还是预创建；启动检查是否阻塞服务。
- `OQ-5.1-4` 下载走后端代理还是 presigned（presigned 在 P2 Deferred 里，若要首期做需改边界）。

**Deferred:** 多存储后端、多桶、预签名 URL。

### Story 5.2: 资源原始归档与下载

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- `resources` 增加 `storage_key / storage_content_type / storage_size_bytes / original_file_name`。
- ingest 增加 `store` 段：URL 存原始 HTML、粘贴存原文；归档失败不阻断入库，以 warning 呈现（待确认）。
- `GET /resources/:id/original` 下载原文；`DELETE /resources/:id` 时清对象。
- **与 3.4 的衔接**：若 `store` 落成独立 stage，`StageName` 要加 `store`，Story 3.4 的「恰好 5 段」AC 与走读页同批改成 6 段；也可折进 `write` 段，二选一。
- 下载 URL 入库的原始 HTML 必须强制 `Content-Disposition: attachment` + `X-Content-Type-Options: nosniff`，不得同源 inline 打开。

**Depends:** 5.1

**Open questions:**
- `OQ-5.2-1` 归档失败走 warning 还是硬失败。
- `OQ-5.2-2` 对象 key / 文件名规则；删除对象失败怎么处理。
- `OQ-5.2-3` `store` 是独立 stage 还是折进 `write`（影响 3.4 的 AC/走读页）。
- `OQ-5.2-4` 无 `storage_key` 的资源请求原文返回什么（404 / 回填策略）。

**Deferred:** 原始文件版本/迁移；生成的表格/文件落 MinIO 的 artifact 模式。

### Story 5.3: Markdown / 纯文本文件上传

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- multipart 上传单个 `.md/.txt`（首期不做一次多文件，批量入库仍归 P3 工程项），复用现有 text parser；入库页增加「文件」模式；原文件按 5.2 归档。
- 前端 accept 与后端后缀校验同口径（`.md/.markdown/.txt`）。

**Depends:** 5.1、5.2

**Open questions:**
- `OQ-5.3-1` 单文件大小上限、编码校验、文件名/标题规则。

**Deferred:** 一次多文件上传（P3 批量）；PDF、Word、Excel、EPUB 等格式解析。

### Story 5.4: 代码库 ZIP 上传与文件管理

**Implements:** P2 能力项
**Acceptance Criteria:** 待开工前补。

**方向**
- 独立 `codebases` 领域，不进 `resources`、不进 ingest；上传 zip 存 MinIO，读条目清单（文件树是否首期展示见 OQ），单文件按需读，下载原 zip，删除清对象。
- 安全：拒绝 `..` / 绝对路径 / 符号链接 / 设备文件；限制总解压大小、文件数、单文件大小、压缩比、目录深度；**按实际解压字节计数**，不信任中央目录虚报；拒绝反斜杠/盘符/重名条目；不执行仓库里的脚本或 hook。
- 默认忽略 `.git`、`node_modules`、构建产物。

**Depends:** 5.1

**Open questions:**
- `OQ-5.4-1` 「解压」是长期解压到受控工作区，还是只做安全校验 + 按条目读取（当前倾向后者）。
- `OQ-5.4-2` 限额具体值（zip 上传大小、总解压、文件数、单文件、压缩比、深度）。
- `OQ-5.4-3` 首期是否包含文件树/单文件预览，还是只做上传、列表、下载。
- `OQ-5.4-4` `codebases` 是新领域（新表 + 新能力盒 + 新路由）还是 `resources` 的 subtype；归属先拍。

**Deferred:** AST 依赖图分析（接 `_Agents/dependency-graph/analyze.mjs`）；代码 RAG；Git URL 克隆；sandbox 执行；增量更新、版本对比、下载单文件。

> **Epic 5 · 未决项汇总**：逐格 OQ/Deferred 见上；不在 P2 的能力见文末「P2 · 未决项」。本节不再另抄一份。

---

## P2 · 未决项与后续阶段（2026-10-24）

> 这里只记「不在 Epic 4/5」的能力；逐条的 Open questions 在对应 Story 下。

**不在 P2**
- eval、prompt 管理：先记 backlog，不排阶段。
- sandbox：P3 Agent loop 之后；最小版本是子进程 + 超时 + 断网 + 目录白名单。
- tenant / auth / RLS：最后再做；现在保持单用户，不加占位 `tenant_id`。
- 代码依赖图分析、代码 RAG：各自另立 Epic。
- PDF/Word/Excel 等格式、批量上传/后台队列（P3 工程项）。
