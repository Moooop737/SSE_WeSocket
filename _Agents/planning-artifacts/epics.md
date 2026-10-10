---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories]
inputDocuments:
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md
  - _Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md
  - _Agents/planning-artifacts/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md
---

# Knowledge Copilot - Epic Breakdown（P1 MVP）

## Overview

本文件把 P1 的需求（PRD FR-1…FR-12）、架构不变量（ARCHITECTURE-SPINE AD-1…AD-8）拆成可实现的故事。项目单人自用、以学习 Vercel AI SDK 为第一目标。无独立 UX 规范，UI 走极简。

## Requirements Inventory

### Functional Requirements

- FR-1: 提交网页 URL → 抓取静态正文入库为 Resource；入库后才失败建 `失败` Resource，输入非法直接拒绝不建。（UJ-1）
- FR-2: 粘贴/导入 Markdown/纯文本入库为 Resource；空/编码异常拒绝。（UJ-2）
- FR-3: 解析正文并切分为 ≥1 个 Chunk，Chunk 保留回溯到 Resource 的定位；0 Chunk → `失败(内容为空)`。
- FR-4: 为每个 Chunk 生成 Embedding 并写入检索索引，使其可被检索命中。
- FR-5: 查看知识库 Resource 列表及状态；删除 Resource（软删、后续检索不再命中；历史引用降级为纯文本；删除处理中项取消任务清孤儿）。
- FR-6: 提问 → 检索相关 Chunk → 仅依据检索内容生成回答；未命中/低于相关性下限/空库/空查询各有明确处理，不编造。
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

**NFR → Story 追溯：** NFR-1→2.2｜NFR-2→2.1, 2.3｜NFR-3→1.2｜NFR-4→1.1｜NFR-5→1.1（ports 接口文件）｜NFR-6→1.1, 2.1。

### Additional Requirements（来自架构 ARCHITECTURE-SPINE，仅列需 Story 落实项）

- 分层：后端 `routes / orchestration / pipeline / ports / adapters`；前端 Vite+React 用 `useChat`（AD-1）。
- 存储写权唯一：只有 ParadeDB 适配器经 Repository 端口读写库；**建表走迁移，业务不动态建表**（AD-2）。
- 数据模型：`resources/chunks/embeddings/sessions/messages`，chunks 与 embeddings 分表，去 tenant（AD-3）。
- 向量：`halfvec` 不定长列 + 按 `dimension` 分建 partial HNSW（当前只建 1024 一条；无对应索引的维度退化为 seq scan，结果仍正确）；混合检索 向量 + ParadeDB `pg_search`/BM25（中文 Lindera）（AD-4/5）。
- 流式契约：AI SDK UI Message Stream；引用作 `sources` data part 先于/随答案下发，正文用 `[n]` 标记；MVP 不做断线重连（AD-6）。
- Provider：Embedding=本地 Ollama Qwen3-Embedding（1024 维）；对话=DeepSeek / 百炼（OpenAI 兼容，可切换）（AD-7）。
- 本地安全：仅 127.0.0.1，Key 存服务端 env（AD-8）。
- 基础设施：ParadeDB 本地 Docker；Ollama 本地跑嵌入模型。**无 starter 模板**，Greenfield 需在 Story 1.1 手动 scaffold（Hono + Vite）。
- 一致性约定：主键 UUID、时间 UTC ISO8601、错误 `{code,message}`、端口名词 + 适配器 `*Adapter`。

### UX Design Requirements

- 无独立 UX 设计规范。P1 仅需极简 Web 界面：一个入库/知识库区 + 一个问答区（含流式文本、Loading 态、引用面板可点击回原文）。UX-DR 从简，不设视觉/token 体系。

### FR Coverage Map

- FR-1: Story 1.2 - URL 抓取入库（含失败/校验/幂等）
- FR-2: Story 1.3 - Markdown/纯文本导入
- FR-3: Story 1.2 - 解析与分块（含 0 Chunk 失败）
- FR-4: Story 1.2 - 向量化并写入检索索引（Ollama Qwen3 1024 维）
- FR-5: Story 1.4 - 列表/软删（处理中取消）；降级 AC 见 Story 2.3
- FR-6: Story 2.1 - 混合检索问答（含相关性下限/空库/空查询）
- FR-7: Story 2.5 - 会话内多轮（查询改写 + 重检索）
- FR-8: Story 2.2 - 流式输出（含中断保护）
- FR-9: Story 2.2 - Loading 与错误/超时提示
- FR-10: Story 2.3 - 引用标记（映射真实命中 Chunk）
- FR-11: Story 2.4 - 原文回链 Source Ref
- FR-12: Story 1.1 - 本地安全边界 + fail-fast（127.0.0.1 + Key env）

## Epic List

### Epic 1: 搭好底座，把资源变成可查知识库
**FRs covered:** FR-1, FR-2, FR-3, FR-4, FR-5, FR-12

### Epic 2: 向知识库提问，得到带引用、可回原文的流式回答
**FRs covered:** FR-6, FR-7, FR-8, FR-9, FR-10, FR-11

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
**And** `ports/` 下存在 `Repository / Retriever / Embedder / ChatModel` 四个接口文件（可仅导出类型），能编译（NFR-5）
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
**Then** 跳过 fetch，内容直接进入 parse（Markdown 分支）→ chunk → embed → 写；复用 Story 1.2 的 chunk/embed/写三段，parse 源不同但分块策略一致
**When** 内容为空、编码异常或不可读
**Then** 拒绝入库并提示，不创建 Resource

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
**When** 未命中，或向量相似度与 BM25 得分均低于默认下限（如 cosine sim < 0.30 且 BM25 < 3.0，可 env 覆盖，交付须带默认可验证）
**Then** 回复"知识库中未找到相关内容"，不作答
**When** 知识库为空
**Then** 提示"尚未添加任何资源"（区别于"未找到相关内容"）
**When** 存在 Resource 但无已就绪的（全为处理中/失败）
**Then** 提示"暂无可用资源（X 条入库失败/处理中）"，区别于"尚未添加"
**When** 空/纯空白提问
**Then** 拒绝并提示

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
**Then** 已产出部分标"回答未完整"；引用可点击的条件为前端已完整接收 `sources` data part 且该 marker 的 `chunkId` 非空（与入库无关）

### Story 2.3: 引用标记与映射
**Implements:** FR-10, FR-5(降级)

As a Lynx，
I want 回答里的每个结论都能对应到具体出处，
So that 我能一眼核对原文。

**Acceptance Criteria:**

**Given** 流式问答已可用
**When** 生成有依据的回答
**Then** 正文用 `[n]` 标记，并通过 `sources` data part 下发 `[{marker,chunkId,docTitle,url,snippet}]`
**And** 每个 Citation 必须映射到本轮真实命中的具体 Chunk（非仅 Resource 级）；模型自造索引视为无效
**When** 出现 `[n]` 但 n 超出本轮 sources 数组范围（越界索引）
**Then** 渲染为不可点击纯文本或标"引用异常"，前端不因找不到 chunkId 而报错
**When** 某 Resource 被删除
**Then** 历史回答中指向它的 Citation 依据 message 内嵌快照降级为不可点击纯文本并标注"来源已删除"（补齐 Story 1.4，不请求已删 Chunk）

### Story 2.4: 原文回链 Source Ref
**Implements:** FR-11

As a Lynx，
I want 点击引用看到对应的原文片段，
So that 我确认出处无需重开原文。

**Acceptance Criteria:**

**Given** 回答带可解析的 Citation（其数据已在 Story 2.3 的 sources data part 缓存于前端，无需二次请求）
**When** 点击某 Citation
**Then** 展示对应的原文片段 + 来源标识（URL/文件名）
**When** 来源是无文件名/无 URL 的粘贴内容
**Then** 自动生成来源标识（命名 + 时间/内容指纹）；内容指纹重复时追加序号/时间戳区分，保证 Source Ref 指向唯一 Resource
**And** 若引用的 chunkId 已不存在（后端被删）则返回 410/降级标记，而非 500
**And** 字符级高亮为增强项，本 Story 不强制

### Story 2.5: 会话内多轮
**Implements:** FR-7

As a Lynx，
I want 在一个会话里基于上一轮继续追问，
So that 能逐步深化而不重复描述上下文。

**Acceptance Criteria:**

**Given** 同一 Session 已有一轮问答
**When** 发出指代型追问（如"第二个结论展开讲讲"）
**Then** orchestration 层做一次**查询改写**（单次轻量 LLM 调用，把追问 + 历史生成独立检索 query）后重新检索，回答基于新命中的 Chunk
**When** 查询改写失败/返回与原始追问实质相同
**Then** 仍用原追问正常检索，无果走标准"未找到"，不报错（日志记改写未生效）
**And** 上一轮回答只作上下文，不作为引用依据
**When** 历史消息 token 接近模型上限
**Then** 截断最早轮次保留近 N 轮，或提示"会话过长，建议开始新会话"
**And** P1 仅支持单个活跃 Session 的多轮，不做多会话历史列表；Session/Message 落 ParadeDB，重启后当前会话历史仍可用
