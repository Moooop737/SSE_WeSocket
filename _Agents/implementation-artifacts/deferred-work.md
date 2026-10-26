# Deferred Work — Knowledge Copilot

> 来自各轮 code review / retrospective 的已知但本轮不动的项。每条记来源与"什么证据能定论"。
>
> **2026-10-24 分配**：每条 deferred 都归到目标 story 或阶段；**先看「去向索引」，再看批次正文（正文只放证据）**。P1 已收口、Epic 3 已收口；P2 未开工。

## 去向索引（2026-10-24）

> 开工/收口时按本表取条目；批次正文是证据，不在这里重复判定。P2 的逐格 OQ 仍住 `epics.md`（`OQ-4.x-n` / `OQ-5.x-n`），本表只收 deferred。

| 去向 | 从这里接手 |
|---|---|
| **P2 · 4.4 聊天 Markdown / 引用** | 前端只取最后一条 `tool-retrieve` part；`hits` 缺 `chunkId` 会抛；`chat-thread` 二次 `plain` + `indexOf`；`/ask` 状态机三处；标题截断切 emoji；来源删除提示待 Lynx 手测；`find-field` 焦点 |
| **P2 · 4.5 / Epic 5** | 表格导出、MinIO、上传的未决项以 `epics.md` 的 `OQ-4.5-*` / `OQ-5.*` 为准；本文件暂无额外条目 |
| **P2 · 跨格（无 story）** | D3：`/resources/stats`、chunks 分页+内容搜索、资源浏览页消费方——已建，但不属于 3.2–3.4 / Epic 4/5 的 AC；单独记账，别混进验收；PWA B 案（安卓沉浸模式 + 贴边 safe-area） |
| **P3 · 主线（Agent loop / 检索硬化）** | ReAct 两工具位；Agent loop 与 `agent/{skill,persona,mcp}`；三态提示不可区分；入库不校验向量长度；向量检索不按 model 过滤；topK schema 无默认；embed 无超时/取消；中断不落 assistant；Story 2.2 超时三旋钮；config 维度列表；检索未加 `status='ready'` 谓词；minSimilarity/BM25 标定；AD-6 依赖反向；`adapter/uri` + `Hit.ref`；D6 三处手抄 |
| **P3 · 工程项（批量/队列/启动/长文档）** | 批量入库+后台队列+跨进程取消；多行 INSERT 分批；`rollbackOrLog` 收敛；`chunks.deleted_at` 前提；`cleanUpOnBoot` 时间下界；`I_MODELS` 日志在构造器；`Ingest.batch` sink；`traces`/`trace_stages` 保留策略 |
| **P3 · 观测硬化** | D1 观测面板范围；错误路径未真跑；`E_STAGE` 分码；`traces` 写端点未收；旧 Langfuse 根 trace；`dimension_check` 在 stage 外；`resource_id` 回填晚；stage 时间字段；running trace 清扫；Langfuse Map 泄漏；`finishTrace` payloads；`read.ts` Dropped 计数；软删会话标题不一致；分页无稳定次级排序；Langfuse 读超时三层数字不一致；前端 run-observability 竞态/树环/toolCallId/头注释/重复 hash/串行 await；阶段面板手测；3.2 依赖偏差 |
| **跨阶段 · 测试基础设施** | `test/` 被 gitignore；`legacy.test.ts` 被排除；无 `typecheck` 脚本；Epic 2/3 的验证缺口；hydrate 测试与实现不一致 |
| **跨阶段 · API 契约 / 错误码** | `POST /sessions` 坏 JSON；OpenAPI 读取在 try 外；`/chat` 流内错误无稳定 code；`/chat` 500 vs 200；会话 DELETE 语义；`not-a-uuid` 500；404 码 `NOT_FOUND`；`/resources/stats` 未进 OpenAPI；3.1 nullable 混用 |
| **跨阶段 · 文档 / 流程** | SPINE Structural Seed；Epic 1 retro 7 条；3.1 LEARNING 段；D1 的正式范围变更；P2 产品面夹带记账 |
| **P4 / P5 / 未排期** | P4 Generative UI；P5 MCP/多模态/部署；eval/prompt；sandbox（P3 后）；tenant（最后）；代码图/代码 RAG（另立 Epic）；PDF/Word/Excel/EPUB（backlog）；服务端 artifact（P2 4.5 的 Deferred）；健康探针 version 明细 / chat provider 探针（2026-10-25） |
| **已解决 / 作废** | AD-1 v1 箭头、AC 行号、两路皆空死分支、资料不足信号、DI 改造、AI SDK 接入、env setup、`trace_stage_id` 文档漂移、`kbtrace` 文档漂移、3.2/3.3/3.4 的代码提交、Epic 3 review 收口 |

## Deferred from: 2026-10-25 PWA 主屏入口 A 案（standalone）— 归 P2 工程项（无 story）

- **B 案：安卓沉浸模式 + 贴边安全区** — A 案只做 standalone；`display: fullscreen` 在 iOS 会回退，`viewport-fit=cover` 要连带改 `--spacing-header`、`/ask` 的 `calc` 与 repo-guard 断言，故本轮不做。定论证据：先真机确认 A 案（无地址栏、状态栏保留）是否够用；要做时按 summary 里列的页头 / 输入区 / 抽屉 / 横屏四块逐块量 `env(safe-area-inset-*)`，并同步改 header token 与测试。来源与验证见 `app/web/Agent/summary/summary-2026-10-25-pwa-standalone.md`。

## Deferred from: code review of epic1-story2-build3 (2026-10-13)

- **`legacy.test.ts` 被 vitest 排除，chunk 偏移与 `chunk_index` 稠密唯一性断言从不执行** (`app/server/vitest.config.ts:8`) — pre-existing：Lynx 已定「旧 node:test 暂留、之后统一重构」。风险落点是 `paradedb-repository.ts:140-153` 靠 `chunk_index` 配对向量、Story 2.3 靠 `start_offset/end_offset` 定位引用。定论证据：把该文件用 `node --test` 跑一次看是否全绿。
- **ARCHITECTURE-SPINE AD-1 的依赖箭头与实现不符** (`_Agents/legacy/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md` AD-1) — 实现是 2026-10-13 Lynx 亲自定的「四段全走 StageRegistry、embedder 也在其中（构造时吃 config）」，并推翻了 2026-10-10「不做按名字查表的注册中心」；缺的是文档补记（建议在 AD-1 写「StageRegistry 是 pipeline 层唯一允许 `new` 适配器的位置」）。修法是改 spec，故 defer。
- **单事务多行 INSERT 无分批** (`app/server/src/adapter/repo/write-content.ts`，原 `adapters/paradedb-repository.ts:126-158`) — 撞 Postgres 65535 单语句参数上限的量级**不是 5900 块**：chunks 每条 6 参 ⇒ ≈10,922，embeddings 每条 5 参 ⇒ ≈13,107（两条语句各算各的；5900 来自旧 review 把 6+5 当一条，见 `reviews/review-reality-check.md` 3.7）。`query_timeout:5000` 会先到。P1 抓网页文章达不到该量级；等真喂长文档再分批或改 `unnest`。

## Deferred from: epic1-story4 build2 取消信号落地 (2026-10-13) — 三碎片合一个 story，归 P3 工程项

Lynx 定：下面三件**不再分开拖**，合成一刀做，落点是 **PRD §7 · P3 工程项**（已写入 `prd.md` P3 子条与 `addendum.md` C 表的「P3 工程项」行）。**Redis 只在这一刀进**。

- **批量入库（多文件一次提交）** — 现在 `POST /resources` 一次一条，且请求要等到 ready 才返回。`Pipeline.batch(KBData[])` 早已实现但没有任何端点调用，接口位现成。定论证据：真丢 10 个文件进去，看 `app/server/src/adapters/paradedb.ts:12` 的 `pool.max=5` 和 Ollama 吞吐先到哪条上限。
- **入库改后台队列（不占 HTTP 请求）** — 与上一条同一刀。顺带解掉这轮"客户端断连不再取消"留下的账：一个没人在等的请求，现在仍会一路跑到 ready 才返回。
- **跨进程取消** — P1 的取消开关住在 `app/server/src/pipeline/inflight.ts` 的进程内 `Map`，第二个进程或重启后即失效（`POST /resources/:id/abort` 那时诚实回 `409 E_NOT_ABORTABLE` 并提示改用 DELETE，属设计内）。队列化之后取消 = 从队列撤任务，`InflightRegistry` 这一层可整体退役。
  - **别走回头路**：Redis 存不了 `AbortController`（进程内活对象，序列化即失效），跨进程只能传"取消意图"，收到的一方仍要按自己手里那个开关。这是 2026-10-13 否掉「把 in-flight Map 搬进 Redis」的理由。WeKnora 的 Redis 也印证了这个分工——它是 asynq 任务队列（`WeKnora-main/docker-compose.yml:556`、`internal/router/task_inspector.go`），不是取消信箱。

## Deferred from: Story 2.1 检索与拒答设计 (2026-10-14)

- **拒答判定的正解是 ReAct（模型调工具表态）** — Lynx 2026-10-14 定；**2026-10-21 Story 2.6 已交付 `tool-retrieve`**：模型拿到 hits / 0 命中 / 工具错误后自己收场，后端不再需要机器可辨的"资料不足"信号。若将来要把「答/不答」做成可评测字段，再给 `answerWithEvidence` / `noAnswerInKnowledgeBase` 两个工具位；当前不做。
  - 为什么它才是正解：实测证明**相似度分数区分不了「库里有没有这个主题」**——库里已无 WeKnora 部署内容，`WeKnora 怎么部署` 仍拿到全库最高的 `sim=0.5502`，比含糊问句 `是什么`（0.5023）还高；垃圾串 `abcdEfgh` 多喂两篇文档后从 0.4061 涨到 0.4589，顶穿了 0.42 下限。所以「够不够依据」是语义判断，任何数字阈值都拦不住。
  - P1 现在怎么做（2.6 之后的 as-built）：检索只负责「别漏」，捞回来的都当候选；0 命中时工具返回空 hits，模型按 instructions 说"知识库没有答案"；有命中则由模型判资料是否足够。
  - P3 补法：给模型两个工具位 `answerWithEvidence` / `noAnswerInKnowledgeBase`，调用哪个即判定 —— 届时把 P1 的判定信号（固定话术匹配或首行标记）**整体拔掉**，不留兼容层。
  - 定论证据：真打一次 `deepseek-chat` 带 `tools` 的请求，看返回里 `tool_calls` 是否稳定出现（此家的 function calling 尚未实测，不凭文档承诺）。
- **`minSimilarity` / BM25 阈值都依赖语料分布，P1 交付的默认值不是标定值** — 上面那条实测就是证据：同一句垃圾串在 27 块单文档 vs 多篇混合语料下，top1 相似度差 0.05+。落码定位是「只兜字符噪声」：`RETRIEVAL_MIN_SIMILARITY` 实际交付默认 **0.42**（Lynx 2026-10-14 拍），BM25 只去 `score=0`，不承诺语义过滤能力。0.35 只是当时的建议值、未采用 —— 评审 P8 就是把这处两处真相抹平。定论证据：等真实资料灌到几十篇量级，重跑 `app/server/test/probe-retriever.ts` 看分布再调。
- ~~**`AC: epics.md:187` 那句「低于默认下限 ⇒ 未找到」与实现各说一半**~~ — **2026-10-24 已改**：`epics.md` Story 2.1 的 AC 已改为「检索 0 命中 ⇒ 未找到；有命中交模型判断；阈值只兜字符噪声」。
- ~~**[未决] 模型「资料不足」这个判定，后端怎么机器可辨地读出来**~~ — **2026-10-21 已消解**：2.6 把检索工具化后，判定由模型在工具结果上直接完成，后端不需要读信号。两个候选（固定话术 / 首行标记）仅留作历史；若将来做 eval 再另立 story。

## Deferred from: code review of epic2-story2.1 (2026-10-14)

四层评审（blind-hunter / edge-case-hunter / verification-gap / acceptance-auditor）跑完、静态断言逐条回代码复核后的**记账项**。完整清单与被驳倒的条目在 `_Agents/planning-artifacts/epics.md` 的 Story 2.1 → `### Review Findings`。

- **Story 2.1 零 Vitest 覆盖，且 `test/` 进不了版本库** (`app/server/.gitignore`) — **已部分解决（2026-10-20）**：`retrieve-chain.test.ts` 已覆盖空/混维/limit/200；新增 `chat-tool-flow.test.ts`、`di-retriever-flow.test.ts`。`test/` 仍被忽略，且 `/chat` 的四条确定性提示还没有专门用例（见下方「`test/` 整个被忽略」条）。
- **检索吃到未就绪内容，靠的是入库侧的一条隐式不变量** (`app/server/src/pipeline/pipelines.ts:74`) — 两条检索 SQL 只加 `r.deleted_at IS NULL`，没有 `status='ready'`；今天不成立的情况被 `fail()` 先 `deleteChunksByResource` 兜住。修法是把它写进 SPINE（AD-3 或 AD-5）成为显式不变量，否则 Epic 2 之后任何入库侧改动都会让检索静默读到未就绪内容。deferred 理由：改 spec。
- **「两路皆空 ⇒ 未找到」是打不到的死分支** (`app/server/src/agent/chat/chat.ts:55`) — `match_disjunction` 是 token 取 OR，实测标点/垃圾问句命中 62/62 chunks，`lexicalCount` 恒 >0。这是 Lynx「拒答交模型判」那条决定的直接后果，不是缺陷；但 AC:187 的措辞要先改掉，否则验收的人会去撞一个不存在的门。deferred 理由：改 spec。

- **[评审 D1] 检索层绕开了 ports/adapters 的分层规矩，三处同因，本轮代码不动**（Lynx 2026-10-14 定：只记账）
  - ~~`app/server/src/retrieve/search/paradedb-vector.ts` / `paradedb-bm25.ts` 各持裸 `pg.Pool` 直查库，`bootstrap.probeVectorDimensions` 同样~~ **已解决（2026-10-15 基础层迁移 `spec-adapter-layer-migration`）**：两条候选查询收进 `adapter/repo/search-{vector,lexical}.ts` 的具名方法、体检改 `repo.dimensionsInStore()`，`grep -rn "\.query(\|new Pool" src` 现只命中 `adapter/repo/`。原判定保留：AD-2 原文是「任何模块不得绕过 Repository 端口直连数据库」。先例：`routes/health/probes.ts` 早就拿 pool（pre-existing），本 story 把它扩到了检索主路径。
  - `app/server/src/retrieve/recipes.ts` `import { QwenEmbedder } from '../pipeline/embed/qwenembed'` —— AD-1「两条路径不得互相依赖」被破；当初是为避开「挪进 `adapters/` 会动入库地基」，正撞 Epic 2 的冻结约束。
  - `ports/retriever.ts` 已删除，契约搬进 `retrieve/contracts.ts` —— 与 Story 1.1 的 AC（`epics.md` › Story 1.1 › Acceptance Criteria 的 `ports/` 条款）冲突。**2026-10-24 已处理**：该 AC 已标作废，由 AD-6 的「每盒一扇门」取代；`Pipeline` 可执行契约住 `ingest/contracts.ts`。
  - 定论证据：下一刀若动检索（BM25 阈值、rerank），要么把这三处归位到 `adapters/` + `ports/`（届时冻结约束已过期，因为入库地基真要改了），要么在 SPINE 给这条边开正式例外。别让它默默长成一楼一层的依赖。
- **[评审 D6] 命中响应体三处手抄，等 SDK `UIMessage` 地基消解**（Lynx 2026-10-14 定：不单独抽 mapper） — `routes/retrieve/retrieve.ts`、`routes/chat/chat.ts` 两份逐字段相同的映射 + 前端 `app/web/src/api.ts:57-70` 的第三份 mirror。2.2 把消息形状换成 AI SDK 的 `UIMessage`/`UIMessagePart`（含 `SourceUrlUIPart`/`SourceDocumentUIPart`）时，这三处应一起被取代；若 2.2 之后仍三份并存，就地抽公共序列化器。定论证据：2.2 落地后 grep `chunkId` 在几处出现。

## Deferred from: 基础层迁移 `spec-adapter-layer-migration`（2026-10-15）— 两条都归 **Lynx**

- **[owner: Lynx] `adapter/uri/` 盒（含 `Hit.ref`）** — 本轮只搬 `repo` 与 `provider`，`uri` 按 Lynx 2026-10-15 定「之后再建」。要收的四件事（脊 AD-5）：`mintResourceUri()`（现散在 `pipeline/pipelines.ts:60` 生成、`adapter/repo/write-content.ts` 事务内复制到 `chunks.resource_uri`）、`canonicalize()`（现是 `findActiveBySource` 的整串 URL 相等）、`composeChunkRef()`（现由两条路由各拼一次 `chunkId + startOffset/endOffset + dataUri`）、`resolveRef()` 的三态 `ok|deleted|unknown`（FR-5/FR-10 的「来源已删除」降级现在没有单一来源）。落这一刀时 `Hit` 才多出自带引用串的 `ref` 一位，`api/` 才彻底不 import 基础层。
  - 定论证据：`grep -rn "urn:kc:paste\|resource_uri" app/server/src` 从 3 处以上收敛到只有 `adapter/uri/` 与 `adapter/repo/`；`Hit.ref` 出现在 `/retrieve` 出参里且前端不再二次拼装。
- **[owner: Lynx] AI SDK 接入（provider 登记表 / 模型句柄 / `embedMany` 替 `QwenEmbedder` / 退役 `Embedder`）** — 本轮 Never 名单明确排除：不写 `createOpenAICompatible`、不写 `EmbeddingModelV4`、不写 `embedMany`/`streamText`（`grep -rn "createOpenAICompatible\|from 'ai'" app/server/src` 仍零命中）。随这一刀一起落的还有 `adapter/model/`（现空目录），以及把门里 `Embedder` 占位接口（`adapter/contract.ts`，按 D2 从旧 `ports/embedder.ts` 搬进）原地换成 SDK 句柄类型 —— 那时六个 import 位（`pipeline/{contracts,recipes}`、`pipeline/embed/qwenembed`、`retrieve/{contracts,recipes,retrievers}`）一起退役。pool 的 `max`/`query_timeout` 要参数化时落**根** `config.ts`（Lynx 2026-10-15 定：不设 `adapter/config.ts`，基础层自己不装 env、参数从门口进）。
  - 前置实测（memlog 仍记为 assumption）：Ollama 的 OpenAI 兼容 `/v1` 上 `embedding` 那条没跑过（只实测过 chat），先跑探针再换；换完要复测 MRL 截维仍返回预期维度（`.d.ts:243` 的 `doEmbed` 收 `dimensions`）。
  - 定论证据：`adapter/provider/` 成为全系统唯一 `createOpenAICompatible()` 落点（AD-4 的核对 grep 从"空转通过"变成真有命中）；`pipeline/embed/qwenembed.ts` 的自写 fetch 退役。


## Deferred from: 基础层迁移 `spec-adapter-layer-migration` review (2026-10-15) — 五条，都是 review 判「真但不是本刀能收」

- source_spec: `_Agents/legacy/specs/spec-adapter-layer-migration.md`
  summary: 检索链（两条候选查询 → stage 补 score → 路由投影）与启动期三条保证（`markInterruptedAsFailed` / `dimensionsInStore` 三态 / `ping` 失败侧）没有任何进版本库的自动断言。
  evidence: review 实测过破坏性演示——把 `contract.ts` 的 `Limit` 与 `Dim` 换位、或把 `match_disjunction` 换成裸 `@@@`、或摘掉 `WHERE e.dimension = N`，`npx vitest run` 仍然 8 passed（`vitest list` 只有 `http-html-parser` 与 `pipeline-factory` 两份，都不构造 searcher）。Lynx 2026-10-15 判定本轮以「逐字搬家 + 人工真跑」记覆盖、不新建测试文件，故本刀不补。**能定论的证据**：`test/` 被 `app/server/.gitignore:3` 忽略 ⇒ 任何断言都进不了版本库、验收无法从 commit 复跑；要收这条得先决定是解除忽略还是另设 `src/**/*.test.ts` 位。
- source_spec: `_Agents/legacy/specs/spec-adapter-layer-migration.md`
  summary: 仓库里没有任何命令跑 `tsc --noEmit`（`package.json:6-11` 只有 test/test:ui/dev/start，无 CI 目录），而本刀的编译期门（21 个手写 `Repo` 闭包接线、`RetrievedChunk extends ChunkCandidate`）只有编译器能守。
  evidence: 实测 `npm test` 对类型错误零反应；本轮 review 期间同树的 `adapter/provider/registry.ts` 一度把 `src/` 编译搞红而 `npm test` 仍全绿。**能定论的证据**：加 `"typecheck": "tsc --noEmit"` 一行并处理 `test/probe-chunk-shape.ts` 的 13 条已知错（显式豁免或修），之后 `grep -c '^src/'` 才有判据。
- source_spec: `_Agents/legacy/specs/spec-adapter-layer-migration.md`
  summary: `rollbackOrLog()` 只被 `write-resource.ts` 的三处采纳，`write-content.ts:76` 仍留着逐字相同的内联副本。
  evidence: 两处行为今天完全相同（回滚失败另记 `E_ROLLBACK`、不顶掉真因），纯粹是收敛没做完；helper 目前是 `write-resource.ts` 的私有函数，复用要先决定它落哪个文件。`grep -rn E_ROLLBACK app/server` 零命中，没有任何断言守着这一面。建议随下一刀动 `write-content`（Story 2.2 落库侧本来就要动）一起收。
- source_spec: `_Agents/legacy/specs/spec-adapter-layer-migration.md`
  summary: `chunks.deleted_at` 列存在但全库没有任何代码写它，两条候选查询因此只带 `r.deleted_at IS NULL`——若将来出现 chunk 级软删，检索会静默命中已删块。
  evidence: `getChunksByResource` 带 `c.deleted_at IS NULL`、两条候选查询不带，这个不对称是对的（chunks 只物理删：`DELETE FROM chunks` + embeddings FK CASCADE），但没有任何东西钉住「无人写 `chunks.deleted_at`」这个前提。迁移前同样如此，本刀没让它变差。**能定论的证据**：一条 `SELECT count(*) FROM chunks WHERE deleted_at IS NOT NULL` = 0 的库级核对，或一个 CHECK/触发器。
- source_spec: `_Agents/legacy/specs/spec-adapter-layer-migration.md`
  summary: ~~Vitest 用例不加载 `.env`（`test/pipeline-factory.test.ts` 自带 `loadEnv()` helper），任何在 import 期读 env 的模块在测试里拿到的是 `undefined`，且没有断言会因此变红。~~ **已解决（2026-10-20）**：`vitest.config.ts` 加 `setupFiles: ['./test/setup-env.ts']`；provider 登记表在 import 期读 env 也能拿到 `.env`。
  evidence: 迁移前 `config.ts` 只在 `loadConfig()` 被调用时读 env，所以这条边从没被踩过；本刀之后若有人在 `adapter/` 里写 import 期取 env 的代码就会踩。直接关联 Lynx 的 SDK 那一刀（provider 登记表最自然的写法就是模块加载期建表）。**能定论的证据**：`vitest.config.ts` 加 `setupFiles` 载 `.env`，或约定「env 只在函数体内读」。

## Deferred from: Story 2.6 范围拆分 (2026-10-16) — P3 的另一半

- source_spec: none
  summary: Agent loop（多步循环）与 `src/agent/{skill,persona,prompt,mcp}`、`src/trace/` 空盒的填充——PRD §7 P3「引入 Agent loop」那一半。
  evidence: 范围门拆分，Lynx 2026-10-16 选「升级为正式范围变更，只做『检索变工具』」，明确 Agent loop 不在这一刀。实测现状：`src/agent/tool/{registry.ts,retrive-tool.ts}` 两份 0 字节空文件，`src/agent/{mcp,persona,prompt,skill}` 与 `src/trace` 各 0 文件（`find` 实测）；本刀只填 `agent/tool/`，其余不填也不删。2026-10-21 Lynx 把上限调到 5 步（有界重查），「一次工具往返」不再是边界；Agent loop 的其余能力仍不进，见 epics.md Story 2.6 的 2026-10-21 注。

## Deferred from: Story 2.6 规划讨论 (2026-10-16) — DI 改造，owner Lynx

- source_spec: `spec-2-6-retrieve-as-tool.md`（D1 定的顺序：先 2.6、后 DI）
  summary: 把 `bootstrap.ts` 手写的 `Deps`（9 格 + `buildDeps` 那 27 行）换成 DI 容器，注入的是**进程级单例工厂**（`repo`/`models`/`embedding`/`inflight`/`ingestFactory`/`retrieverFactory`），每请求仍从工厂 `assemble` 出新 Retriever。
  evidence: 实测改动面 6 个文件——`bootstrap.ts`、`index.ts:16-19`、`routes/chat/chat.ts:22,33,38`、`routes/retrieve/retrieve.ts:24,35`、`routes/resources/resources.ts:25`。能被容器吃掉的是 `buildDeps:78-97` 那 16 行（7 行 `Config.xxx → RetrieverConfig` 改名 + 9 行 return 罗列），`:73-77` 五行有语义、原样搬进 resolver。三条已知代价（都核过实物）：① **启动期 fail-fast 会掉**——缺注册是解析期才抛 `AwilixResolutionError`，`strict: true` 在 awilix 13.0.5 的 README:346-360 只列了三项生命周期检查、不查名字拼错，所以 `assertChatModel`（:51-59）与 `pickEmbeddingTarget`（:101-115）这两条 `exit(1)` 必须原样保留，容器只替换「造」不替换「验」；② **形参名成运行时契约**——PROXY（默认）与 CLASSIC 都按名字匹配（README:393-395 原句「Parses the function/constructor parameters, and matches them with registrations」，包内有 `lib/param-parser.js`），与 AGENTS §四「参数 PascalCase」正面冲突，动手前要定口径；③ **`vectorDimensions` 是唯一被 `startServer` 改写的格**（:96 先给 `null`、:132 填，注释 :11 的保证是「路由不可能读到半填状态」），进容器即成可变单例——要么留容器外，要么注册成 holder（`{ current: null }`）把那条保证搬过去。类型面反而可接受：`InferCradleFromResolvers`（README:883-900）让消费端写错键名在编译期就红。候选库实物（2026-10-16 npm）：awilix 13.0.5（dep 仅 `fast-glob`、无装饰器，与本仓函数式工厂最贴）、tsyringe 4.10.0（要 `reflect-metadata` + `experimentalDecorators`，最后发布 2025-04）、inversify 8.2.3（拆 4 个 `@inversifyjs/*` 子包）、typedi 0.10.0（2022-12 起停更）；`@hono/hooks`、`needlejs`、`@effect/ioc` 实测 404 不存在。配套要同步 SPINE AD-6 的 `Prevents`（那句正把 9 字段 `Deps` 当反面教材，改完可划掉）与 `.memlog.md`，并照上一刀的办法用两个实例做 HTTP 面逐字段对账。
  status: **已执行 2026-10-20**（tsyringe 路线，`Deps` 整删、八个 `@singleton()` 类、路由 `build()` 零参数）。当年列的三条代价里 ① 用「断言住进各自类的构造」兑现、② 随 class token 消失（不再有形参名匹配）、③ `vectorDimensions` 走的是第三条路：既不 holder 也不缓存，改为检索层每请求现查。SPINE AD-6 的 `Prevents` 与 `.memlog.md` 中 AD-6 已同步，`.memlog.md` 未动。

## Deferred from: DI 改造 code review (2026-10-20)

- source_spec: none（本轮 review：`bmad-review` 三 lens 跑 `git diff 0372d74..HEAD`）
  summary: 「先清后听」这条不变量目前只由 `index.ts` 末尾那层匿名 IIFE 承载；且 `await` 只关窄窗口，没有定义「哪些 `processing` 行算遗留」。
  evidence: 实测过窗口打开的那一半——`cleanUpOnBoot` 不 await 时，`markInterruptedAsFailed`（`adapter/repo/write-resource.ts:81-90`）会 `DELETE FROM chunks` + 把行标 `failed(入库中断)`，而刚提交的任务还在后台跑。await 修好之后窗口仍非零：一条 SELECT 与一次 INSERT 之间没有下界，30 秒的真任务照样可以被扫进去。**能定论的证据**：SQL 加时间/拥有者下界（如 `AND updated_at < <boot 时刻>`，或行上记 boot id），并补一条测试——先 INSERT 一条 processing 行，跑 `cleanUpOnBoot`，断言行仍是 processing 且 chunks 还在。当前所有 `*.test.ts` 里 `grep markInterruptedAsFailed|cleanUpOnBoot` 零命中。
- source_spec: none
  summary: `I_MODELS` 打在 `ModelRegistry` 的构造器里，构造与输出耦合。
  evidence: 任何一次 `container.resolve(ModelRegistry)`（含将来的 CLI、脚本、测试）都会向 stdout 吐一条启动横幅；断言日志的测试会因此变脆，且无法静默。**能定论的证据**：把它挪回根文件的启动序列，或给构造加静默开关并有一条测试断言「缺 `DEEPSEEK_API_KEY` 时这行清单里少一个句柄」——现在没有任何机器守卫，只有 `.env` 手改。
- source_spec: none
  summary: ~~入库链路当前零自动验证。~~ **已解决（2026-10-20）**：`test/ingest-factory.test.ts` 已按 DI 改造修复，6 个用例全过；全量 vitest 8 文件 / 25 条通过。
  evidence: `npx vitest run test/ingest-factory.test.ts` 6/6；`npx vitest run` 25/25（`test/legacy/` 的旧探针已归档并从 tsc 排除）。
- source_spec: none
  summary: 库不可达时 `/chat` 变成 500，与 `routes/chat/chat.ts:3` 自己声明的「三条确定性提示都是 200 答案体」口径冲突。
  evidence: `E_DIMENSION_UNKNOWN` 这个 409 分支随启动缓存一起删除，`dimensionsInStore()` 抛错现在冒到路由 catch。**能定论的证据**：要么把它归入第四类确定性提示（200 答案体 + 「库暂时不可用」文案），要么在文件头明写例外并给前端一个错误态约定；两种都需要一条断言状态码的测试。`retrieve-chain.test.ts:83-107` 钉住了混维 409 与「embed 之前判定」，这条是它旁边没人管的分支。
- source_spec: none
  summary: `app/server/test/` 整个被内层 `.gitignore` 忽略——2026-10-20 整理后 active 8 文件 / 25 条全过（含新增 `chat-tool-flow.test.ts`、`di-retriever-flow.test.ts`、`ui-message-parts.test.ts`、`session-repo.test.ts`），但都不在版本控制里；共享真库因此文件级串行（`fileParallelism: false`）。
  evidence: 实测 `git status --short` 在 `test/*.test.ts` 存在时仍干净；`test/legacy/` 归档的一次性探针也不进版本库。**能定论的证据**：把 `*.test.ts` 纳入跟踪（`probe-*` 继续忽略），或在 SPINE 里明写「本仓无 CI，验证只在你这台机」。
- source_spec: none
  summary: SPINE 的 Structural Seed 整块是规划形状，与 as-built 大面积不符（不是本刀造成）。
  evidence: 该块写有 `api/`（从未存在，实际是 `routes/`）、`ingest/contract.ts`/`recipe.ts`/`task.ts`/`status.ts`（实际是 `contracts.ts`/`recipes.ts`/`ingest.ts`/`inflight.ts`）、`retrieve/guard.ts`/`fuse.ts`（实际是 `retrievers.ts`/`recipes.ts`/`fusion/`+`search/`）。本轮只改了根文件那一行，其余未动。**能定论的证据**：要么把 Seed 块整体重写成 as-built，要么给它加一句「本块是 SEED，实际以 `app/server/src/` 为准」——现在它读起来像事实。

## Deferred from: Story 2.6 as-built review (2026-10-20)

- **AD-6 依赖反向（`RetrieverHandle` / `RetrieverError`）— Lynx 定：只记账，不移动代码** — `app/server/src/adapter/contract.ts:56-58,239-255` 构造期 import `retrieve/retrievers` 与 `retrieve/recipes`；`agent/tool/retrieve.ts:14` 与 `routes/retrieve/retrieve.ts:14` 从实现文件取 `RetrieverError`。这是 Retriever 单例句柄的落地形状；若后续 `adapter` → `retrieve` 出现运行时环，按 AD-6 把 `RetrieverHandle` / `RetrieverError` 移回 `retrieve/contracts.ts` 或拆窄接口。定论证据：`grep -rn "RetrieverError\|RetrieverFactory\|RETRIEVER_RECIPE_NAMES" app/server/src/adapter app/server/src/agent/tool` 的落点收缩到 `contract.ts`。

## Deferred from: Epic 2 对账 (2026-10-20)

- **Story 2.2 超时条款未落** — AC 要求首 token / inter-token / 总时长超时；Lynx 2026-10-15 定「超时最后再加，先把 SDK 跑通」，`CHAT_TIMEOUT_*` 从 config 删除，`streamText` 仍无 `timeout`。定论证据：`grep -rn "CHAT_TIMEOUT\|firstChunkMs\|chunkMs\|totalMs" app/server/src` 零命中；真上游首块延迟样本拿到后再排一刀。
- **Story 2.3/2.4 来源删除提示未落** — 前端从 `tool-retrieve` output 的快照渲染 `[n]`/面板/抽屉。2026-10-21 Lynx 拍：**快照仍可看，只在抽屉/引用处标「来源已删除」，不禁止点击**；原 AC 的「不可点击纯文本 / 410」作废。2026-10-21 已实现：后端新增 `GET /resources/:id`（`getResource` 已过滤软删），前端打开抽屉时按需查、404 时显示「来源已删除 · 以下为回答时的快照」，内容照常可看。待 Lynx 手测：删一条被引用过的 Resource，回看历史回答、打开抽屉，提示出现且内容仍可读。`Message.sources` 列已删（2026-10-20）。

## Deferred from: Epic 2 review (2026-10-21) — P1/P2 backlog

> 2026-10-21 三镜头 review（adversarial / edge-case / verification-gap）的非 P0 发现。原始 48 条见 `review-2026-10-21-epic2-findings.json`；P0 已全部处理（stopWhen 文档化、resource/health/config 修复、来源删除提示、2.5 多轮）。

- **入库不校验向量长度** — `ingest/ingest.ts` 用 `v.length` 写 dimension，从不与 `embedding.dimensions` 比对；兼容层失效回 4096 时会把异维行写成 ready，之后全站检索报混维。修法：写库前断言向量长度一致，不一致走 `fail()`。
- **向量检索不按 model 过滤** — `adapter/repo/search-vector.ts` 只按 dimension 过滤；换同维模型后两套几何空间静默混排。修法：SQL 加 `AND e.model = $n`，或启动/检索时比对模型并拒绝。
- **三态提示不可区分** — 空库 / 全无 ready / 有库未命中仍靠模型一句话；`countResourcesByStatus` 无调用点。修法：流前按计数分流（仍是 200 答案体）。
- **retrieve 的 topK schema 无默认值** — `.gt(3).lt(20)`，模型省略或给 3/20 直接校验失败。修法：`.int().min(1).max(20).default(6)` 或在 describe 写明范围。
- **POST /sessions 坏 JSON 吞成 `{}`** — `.catch(() => ({}))` 导致 201 建空会话；应 400 E_BAD_JSON。
- **openapi 读取在 try 外** — `src/index.ts` 的 readFile/parse 早于路由挂载且不在 try 内，坏 YAML = 未处理 rejection，整站起不来。修法：包进 try，失败记 E_OPENAPI 并跳过 `/doc`。
- **/chat 流内错误无稳定 code** — onError 压成固定文案，文档承诺的 500 E_CHAT 实际打不到；前端只能显示一句话。
- **前端引用只取最后一条 tool-retrieve part** — `api/chat.ts` 的 `reverse().find`；5 步上限下一次回答可能多次检索，正文引用更早一批会退化成纯文本、右栏只剩最后一批。修法：合并全部 tool part 的 hits 供引用解析（面板仍可只显示最新）。
- **hits 缺 chunkId 会抛** — `ChatThread.hitIndex` 直接 `chunkId.toLowerCase()`；旧载荷/字段漂移会让整页落错误边界。修法：边界过滤非法 hit。
- **/ask 状态机三处** — 提交前清空草稿但 stop 失败时这一问没发出（草稿丢失）；手动 stop 后 doneNote 仍播「回答已完成」；追问 submitted 期间右栏落回「还没问」空态；stuck 横幅无关闭、后续成功提问也不清。
- **chat-thread 二次 plain + `indexOf`** — `citedHits` 对已 plain 的 Text 再 plain，标号用 `indexOf`；幂等性一变就出现 `[0]` 或编号错位。
- **find-field 焦点** — `/resources` 未传 `InputRef` 时「清空过滤」无法把焦点还给输入框。
- **标题截断切 emoji** — `titleOf` 用 `slice`，可能切断代理对；改用 `[...str].slice()`。
- **embed 无超时/取消** — `EMBED_TIMEOUT_MS` 随旧类删除后，`embedMany` 没有 timeout/abortSignal；Ollama 挂起时检索无上界。
- **中断不落 assistant** — 已接受的最简口径；历史里会留孤立 user，半截标记只在内存。要补时在 onEnd 的 aborted 分支落部分 parts。
- **会话 DELETE 的语义与前端接线** — 2026-10-22 起 hono-crud 已提供 `DELETE /sessions/:id`（**硬删**，连带消息）；前端仍只写本机 tombstone。缺的不是端点，而是「软删 / 级联」口径与前端接线；要动时先定语义。
- **验证缺口（成批）** — `/sessions` 四端点、`/chat` 错误分支、2.6 的 D6 工具错误、0 命中、组装根 env fail-fast 均零用例；前端流用例是手搓 part、没有真实 SSE fixture；`/ask` 页面无行为用例。`app/server/test/` 仍被 `.gitignore` 忽略（既有 deferred）。
- **前端 hydrate 测试与实现不一致** — `sessions-hydrate-empty.test.ts` 期望「GET 空列表 → POST 一条」，当前 `sessions.ts` 空库只保留本机会话、不再 POST；规则已变，测试待按新口径改（2026-10-21 全量跑唯一红）。
- **config 的索引维度列表仍是 [2048,1024,512]** — 2026-10-21 已用 `includes` 修掉 1024 误报；但迁移只建了 1024 的 partial HNSW，512/2048 不会告警而实际走 seq scan。要准确应收敛为 `[1024]`，或先补对应维度的索引迁移。

## Deferred from: P2 epic planning (2026-10-24)

> 方向与逐格 Open questions 见 `_Agents/planning-artifacts/epics.md` Epic 4/5；这里只记「不排进 P2」的能力与跨格未决项。

### 不排进 P2

- **eval / prompt 管理** — 不进 P2，也不排具体阶段。eval 先做检索指标 + LLM judge；prompt 先做 typed registry + 版本；不照搬 WeKnora 的 Parquet/BLEU/ROUGE。
- **sandbox** — 放 P3 Agent loop 之后；最小版为子进程 + 超时 + 断网 + 目录白名单；技能包/终端/桌面不碰。
- **tenant / auth / RLS** — 最后再做；现在保持单用户，不加占位 `tenant_id`；真转多租户时统一迁移并改 PRD §5 非目标。
- **代码依赖图分析** — 从 ZIP 解压后跑 `_Agents/dependency-graph/analyze.mjs`；另立 Epic，不塞进 Epic 5。
- **代码 RAG** — 代码分块/检索/引用；另立 Epic，不复用文档分块策略。
- **PDF / Word / Excel / EPUB** — 格式 backlog；P2 只接 `.md/.txt`。
- **服务端生成文件 artifact（表格落 MinIO 再给链接）** — P2 先做客户端 CSV 导出。
- **批量上传 / 后台队列 / 跨进程取消** — 归 P3 工程项（Redis 作队列）。

### 跨格 Open questions（开工前要拍）

已全部编号并搬进 `_Agents/planning-artifacts/epics.md` 各 story 的 `OQ-4.x-n` / `OQ-5.x-n`（2026-10-24）。这里不再维护第二份；开工时按编号逐条回写结论与去向。

## Epic 3 收口缺口（2026-10-24，来自 3.2/3.3/3.4 handoff）

> 这些不是新发现，是 handoff 的「未决/注意」尚未进 deferred 的部分。3.2/3.3/3.4 已于 2026-10-24 收口；以下是已知问题，去向见顶部总表。

- **`GET /resources/not-a-uuid` 回归为 500** — hono-crud 的 read 直接打 PG；旧自定义路由是 400 `E_BAD_ID`。修法：CRUD read 前加 UUID 校验，或统一错误映射。
- **hono-crud 的 404 错误码 `NOT_FOUND` 与自定义路由的 `E_*` 不一致** — 前端/文档的错误处理要兼容两套，或包一层统一。
- **`traces` 表仍开放 hono-crud 的 create/update/delete** — 3.3 只移除了 read；任何人可伪造/删除观测行。修法：traces 只开 list（保留自定义 `GET /:id`），或加写保护。
- **Langfuse 读侧与「不做产品内观测面板」的边界冲突** — `routes/observability.ts` 与前端 `/traces`、`/chats` 已读本地 trace + Langfuse；Epic 3 的范围说明仍写「不做产品内观测面板」。要么承认这块是本 Epic 的交付，要么拆成独立前端 item。
- **错误路径未真跑** — 3.2 的流内 `status='failed'`、Langfuse 不可达；3.3 的 stage 抛 `E_DIMENSION_MISMATCH`。代码有分支，但没有实测证据。
- **stage 错误码是通用 `E_STAGE`** — fetch/parse 失败无法区分；要分码需 fetcher/parser 自带 code。
- **`Ingest.batch` 的 sink 没有调用方** — 批量入库若以后要 trace，需要一条 trace 对应一条资源；当前 endpoint shell 只覆盖单条 `POST /resources`。
- **`traces` / `trace_stages` 没有保留/清理策略** — 会无界增长；要定 TTL、归档或手动清理。
- **前端阶段面板未浏览器手测** — 3.3/3.4 都注明由 Lynx 手测；打开 `/traces` 详情看 stages。
- **旧的无 context manager 时期 stage 根 trace 留在 Langfuse** — 新 trace 正确；旧数据不清理。
- **3.1 没有 LEARNING 段** — 3.2/3.3/3.4 有；`LEARNING.md` 索引已标缺口。
- ~~**3.2/3.3/3.4 代码未提交**~~ — **已提交 2026-10-24**：`app/server` `0eb374a p1`、`app/web` `66cfe4d p1`；两侧工作区干净。

## Deferred from: Epic 3 code review (2026-10-24)

> 详细 triage、证据与被驳回项见 `_Agents/implementation-artifacts/review-2026-10-24-epic3.md`。本轮按 Lynx「仅 review」不改代码，Epic 3 已按已知问题收口。

- **D1 观测面板范围**：Epic 3 原写「不做产品内观测面板」，as-built 已有 `/traces`、`/chats`、`run-observability`；已在 `epics.md` 按现状收窄为「不引入 Grafana/Prometheus、不做远程面板」，正式 correct-course 未走。
- ~~**D2 `kbtrace` 文档漂移**~~ — **已解决 2026-10-24**：`epics.md` 已改为两只盒（`llmtrace/` + `systemtrace/`），无代码动作。
- **D3 夹带 P2 产品面**：`GET /resources/stats`、chunks 分页+内容搜索、资源浏览页消费方与 3.2–3.4 AC 无关；单独记账，别算进 Epic 3 验收。
- **3.2 依赖偏差**：as-built 用 `@opentelemetry/sdk-trace` + `context-async-hooks`，未用 AC 写的 `sdk-node`；3.3 为此手动补了 `AsyncLocalStorageContextManager`。
- **观测保真度**：`dimension_check` 的 DB 查询在 stage 外（~56ms 不计入 stage，库不可达时无 stage 行）；`resource_id` 回填晚于 `run()` 结束（运行中/被杀资源关联不上）；stage 的 `started_at/ended_at` 前端声明但后端不返回（瀑布图只能用 `created_at - duration_ms` 近似）；`running` trace 无启动清扫（崩溃后永久「进行中」）；取消被记成 `E_STAGE`（与真故障不分）。
- **生命周期**：Langfuse 的 `Chats`/`TraceIds` 只在 `takeChatTraceId` 命中时清理，根 span 没抓到或 `onEnd` 没跑就留到进程结束；`finishTrace` 的 `payloads = $9` 无条件覆盖（chat 当前恒 null，无实际损失，留作隐患）。
- **契约**：`trace_stage_id` 已在 2026-10-22 改名为 `id`（`epics.md` 本轮已修）；`/resources/stats` 未进 OpenAPI；`doc.ts` 声明 3.1 却混用 3.0 的 `nullable`；`GET /resources/not-a-uuid` 仍是 500（hono-crud read 直接打 PG）。
- **前端行为**：`run-observability` 的静默失败会亮红条、翻页没有旧回包作废；`buildObservationTree` 无环保护；后端取的 `toolCallId` 前端没接；`/traces` 文件头「阶段表没有 HTTP 读侧」与实现相反；query vector 的 hash 每请求算两次；DB stage sink 在业务路径串行 await。
- **验证缺口（7 条）**：chat 收口、stage 行、端点壳 route/跳过、`?route=`/`?session_id=` 过滤、chunks 搜索/越界页、`/resources/stats`、Langfuse 写侧全部零测试。把对应实现删掉，现有测试仍全绿；`app/server/test/` 仍被 `.gitignore` 忽略。

## Deferred from: 2026-10-25 /health 按服务分组（非 story）

> 本次只做归类：平铺 4 探针 → `postgres` / `ollama` 两组；以下两件明确不做，去向均未排期。

- **`ollama.version` 只有布尔值，没有版本字符串** — 要显示 Ollama 版本号需改 `adapter/connection/ollama.ts` 的 `ollamaHealthCheck` 返回形状（现在只回 `res.ok`），会牵动探针契约。定论方式：先确认 /health 页是否真的需要版本号，再决定改 adapter 还是另发一次 `/api/version`。
- **chat provider（DeepSeek / 百炼）没有探针** — 本次是「缩减/归类」，不是扩服务面；加它要拍「探哪个端点、失败算不算 503」。定论方式：需要“外部模型 Key 有效”这个信号时再立项，不要顺手塞进 ollama 组。
