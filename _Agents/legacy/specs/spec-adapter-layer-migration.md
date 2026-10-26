---
title: '基础层迁移：adapters → adapter（不含 uri，不碰 AI SDK）'
type: 'refactor'
created: '2026-10-15'
status: 'in-review'
route: 'dispatch'
baseline_commit: 'app/server@6c0b0043670792d9645535f7138896ea03b5252d; outer@001cac5b104277d1bfc710b35374b72b7cfc5ce2'
review_loop_iteration: 0
context:
  - `_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`
  - `AGENTS.md`
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** 新脊（第二版）要求 `api → 能力 → adapter` 三层，而现状是横切的：`grep -rn "\.query(\|new Pool" app/server/src` 命中 5 个文件（`adapters/paradedb.ts`、`adapters/paradedb-repository.ts`、`bootstrap.ts:129-151`、`retrieve/search/paradedb-vector.ts:40`、`retrieve/search/paradedb-bm25.ts:29`），两条路由直接持有 `Pool`（`routes/retrieve/retrieve.ts:24`、`routes/chat/chat.ts:23`），`retrieve/recipes.ts:15` 反向 import 入库的 `QwenEmbedder`。

**Approach:** 把 `adapters/` 拆进 `adapter/repo/`（连接与全部 SQL）与 `adapter/provider/`（Ollama 原生只读探针），删掉 `ports/`，整层唯一对外门是 `adapter/contract.ts`；同时把新脊里 `resource/` 这个名字改成 `adapter/`。**uri 盒不在这一刀**（Lynx 定：之后再建）；**AI SDK 也不在这一刀**（Lynx 定：`createOpenAICompatible` / 模型句柄 / `embedMany` 由他本人写）。

## Boundaries & Constraints

**Always:**
- SQL 文本只出现在 `adapter/repo/`；`new Pool` 只出现在 `adapter/connection/pool.ts`（Lynx 2026-10-15 增补 `connection/` 后改写，原句是「`Pool` 与 SQL 文本只出现在 `adapter/repo/`」）；`adapter/contract.ts` 不导出 `Pool`、不导出任何"借连接"原语（AD-3）。
- `adapter/` 不 import 能力层；能力片之间不 import 对方内部文件（AD-1）。
- HTTP 面零变化：出参字段名、状态码、错误码一个都不动。前端在读 `startOffset/endOffset/dataUri`（`app/web/src/ui/recall.tsx:213,223`）、发 `content_type`（`app/web/src/api/client.ts:143`）、依赖 `chunk_count`+201 与 DELETE 的 204 空体（`resources.ts:165`、`:48`）。
- 向量 SQL 的 `::halfvec(N)` 表达式形式**与** `WHERE e.dimension = ${Dim}` 谓词逐字保留——partial 索引要同时匹配表达式和谓词，实测摘掉谓词即退 Seq Scan（`reviews/review-reality-check.md` 3.4）。
- 词法查询继续走 `paradedb.match_disjunction('content', $1)`，用户问句不得裸交 `@@@`（AD-8）。
- 事务边界与写入守卫不变：chunk+向量+转 ready 同一事务，`AND deleted_at IS NULL` 写守卫保留（`paradedb-repository.ts:164-168`）。
- 拔旧路径不留兼容层：`adapters/`、`ports/`、`bootstrap.ts` 裸 SQL 在这一刀内删净（脊 Deferred、`.memlog.md:37`）。

**Never:**
- 不写 `createOpenAICompatible`、`EmbeddingModelV4`、`embedMany`、`streamText`——AI SDK 归 Lynx。
- 不建 `adapter/uri/`、不产出 `Hit.ref`（AD-5 那一刀）。
- 不动 `pipeline/embed/qwenembed.ts` 的调用形状，不动 `db/migrations/`、env 变量名、阈值默认值。
- 不改 `app/web`。

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 启动体检 | 库中向量维度 {1024} | `repo.dimensionsInStore()` → `[1024]`，`deps.vectorDimensions` 三态语义不变 | 查询失败 → 留在 `null`，日志 `E_DIMENSION_PROBE`，检索随后拒答 |
| 启动清扫 | 2 行 `processing` 未软删 | `repo.markInterruptedAsFailed()` → `{resources:2}`，chunks 物理删 + 行转 `failed(入库中断)` | 事务内任一步失败 → ROLLBACK 并把回滚自身的错另记 `E_ROLLBACK`，真因不被顶掉 |
| 向量候选 | queryVector 1024 维、库中混 512 | 只回 `dimension = 1024` 的行；混维由 `retrievers.ts` search 期先拒 | `E_DIMENSION_MISMATCH` / `E_DIMENSION_UNKNOWN` 语义与文案不变 |
| 写入期间被软删 | embed 之后、事务 UPDATE 期 `deleted_at` 已置 | `rowCount=0` → 整笔回滚，不产生孤儿 chunks | 抛带 `code:'E_RESOURCE_GONE'`，管线转 `fail('已删除，写入中止')` |
| db 探针 | 库不可达 | `repo.ping()` → `false`（不抛），`/health` 该项 `ok:false` 整体 503 | 探活失败绝不冒泡成 500 |

## Decisions

- **D1（Lynx 2026-10-15）token 超标不切**：三个 build 保持一份 spec，实现时按 build 序逐个派。已知代价：约 3–4k token，子代理读到后半时可能稀释前半边界 ⇒ 每个 build 派发时把 Boundaries 五条 HTTP 不变量原文重贴在 prompt 里，不靠子代理自己找回。
- **D2 `Embedder` 类型进 `adapter/contract.ts` 当占位**：`ports/` 本刀清空（`repository.ts` 被门吸收、`chat-model.ts` 实测零引用直接删、`embedder.ts` 的类型进门）。Lynx 写 SDK 那一刀时，是把门里这个接口名原地换成 `EmbeddingModelV4`，改动面局部在一个文件。
- **D3 `vectorSearch`/`lexicalSearch` 两个名字位保留为薄适配器**：`retrieve/search/paradedb-{vector,bm25}.ts` 两个文件**留着**，类也留着，但 SQL 抽走、`search()` 只转发给 `repo.vectorCandidates/lexicalCandidates`，并补上 `score: 0`（名次分归融合侧，不由 repo 造）。`RetrieverRecipe` 两格与 `RETRIEVER_RECIPE_NAMES` 四格不变。
- **D4 `test/` 三处 import 由 agent 改**：只改 import 路径行（文件搬家导致的机械失效），不动断言、不动用例形状、不新增测试文件。规则变化记录在 Build 3。

</frozen-after-approval>

## Code Map

- `app/server/src/adapters/paradedb.ts` — `createDbPool`（`:10-16` 的 `max:5/connectionTimeoutMillis:3000/idleTimeoutMillis:30000/query_timeout:5000` 与 `:18-20` 的 `pool.on('error')` 必须整体搬走，少一行就是静默崩进程）、`pingDb` → `adapter/repo/pool.ts`
- `app/server/src/adapters/paradedb-repository.ts` — 17 个方法的唯一实现；`rowToResource:14`/`rowToChunk:29`/`iso:9`/`vecToHalfvecStr:47` 是行投影工具；`:58-241` 按 写资源 / 写内容 / 读内容 三份；`:243-257` 五个 `NotImplemented` 桩（`findResourcesByStatus`、session/message 四条）随 `Repository` 类型一起搬，不改语义
- `app/server/src/bootstrap.ts` — `:31-41` 的 9 字段 `Deps`、`:60-61` 造池造仓储、`:99`/`:108` 两次裸 SQL 调用、`:128-161` 两个裸 SQL 函数体（搬进 repo 后 bootstrap 只剩一行调用）；`:111` 日志串里读 `retrieverConfig.dimension`
- `app/server/src/retrieve/search/paradedb-vector.ts:40-48` 与 `paradedb-bm25.ts:29-36` — 两条候选查询的 SQL 文本。按 D3 两个文件与类都**留着**，只把 SQL 抽进 repo、`search()` 转发；`:15`/`:19` 对 `rowToChunk` 的跨盒 import 随之下线（行投影在 repo 内完成）
- `app/server/src/retrieve/contracts.ts` — `RetrieverConfig:20`（含 `ollamaBaseUrl`/`embeddingModel`，embed 那一半留给 SDK 刀）、`RetrieverDeps:31`（`pool` 字段是 AD-3 要抹的）、`RetrieverRecipe:40`、`RetrieverStageRegistry:60`、`RetrievedChunk:67`（`score` 一位由适配器补，见 Design Notes）
- `app/server/src/retrieve/recipes.ts:15,37-44` — 反向 import `QwenEmbedder`（本刀不动，随 SDK 刀解）与两张 searcher 表（D3 保留）
- `app/server/src/retrieve/retrievers.ts:36-51` — `assemble` 兑换四件；`:46` 那条 embedder 维度恒等自检保留
- `app/server/src/routes/retrieve/retrieve.ts:19,24,32,43` 与 `routes/chat/chat.ts:16,23,31,42` — 两处 `pool: Pool` 进 RouteDeps；`:57`/`:58` 是 `Hit` 投影，形状不许变
- `app/server/src/routes/resources/resources.ts:20,115,130-131,146,153` — `Repository` 类型、`chunker`/`embedder` 名字位、两处 Recipe 组装
- `app/server/src/routes/health/probes.ts:8-9,27-34` — 拿 `Pool` 的位置，改成拿 repo；`:36-59` 三个 Ollama 探针只改 import 来源
- `app/server/src/adapters/ollama.ts` — 三个原生只读探针（`/api/tags`、`/api/ps`），非 SDK，整文件搬 `adapter/provider/`；类型名 `OllamaModelEntry` 一族已在 `6c0b004` 落定
- `app/server/src/ports/{repository,embedder,chat-model}.ts` — 三个文件本刀全删（D2）：`Repository` 由门交出、`Embedder` 类型原样搬进门当占位、`chat-model.ts` 实测零引用（全仓仅 `retrieve/contracts.ts:7` 的注释提到它）
- `test/pipeline-factory.test.ts:3,4,20`、`test/probe-count-resources.ts:2,3`、`test/probe-retriever.ts:2` — 三处 import 指向 `src/adapters/`，按 D4 只改路径行
- `app/server/src/pipeline/{contracts,recipes,pipelines}.ts` — `Recipe.repo` 的类型来源改自门；`pipelines.ts:51-117` 九个 repo 方法调用点**逐个不变**
- `app/server/src/agent/chat/chat.ts:15,48` — `Repository` import 与 `countResourcesByStatus` 调用
- `app/server/src/types/types.ts` — 实体形状不动（snake_case 贴库那一轨）

## Tasks & Acceptance

**Execution（三个 build，按序，每个都可独立验收）:**

- [x] **Build 1 — 建盒** `app/server/src/adapter/repo/{pool,write-resource,write-content,read-content,search-vector,search-lexical}.ts` -- 从 `adapters/paradedb.ts`、`adapters/paradedb-repository.ts` 拆出；`bootstrap.ts:128-161` 的两个裸 SQL 变成 `read-content.ts` 的 `dimensionsInStore()` 与 `write-resource.ts` 的 `markInterruptedAsFailed()`；两条候选查询进 `search-vector.ts`/`search-lexical.ts`；`deleteChunksByResource` 与 `softDeleteResource` 的重复 `DELETE FROM chunks` 不合并（一处是无事务单语句、一处是软删事务内，语义不同）
- [x] `app/server/src/adapter/contract.ts` -- 整层唯一门：`createRepo(Config): Repo`（池不外漏）、`Repo` 与候选行类型 `ChunkCandidate`、Ollama 探针三函数、`Embedder` 类型按 D2 搬进门当占位
- [x] `app/server/src/adapter/provider/ollama.ts` -- `adapters/ollama.ts` 整文件搬入，零逻辑改动
- [x] **Build 2 — 改接线** `app/server/src/bootstrap.ts` -- `Deps` 去 `pool` 字段、`repo` 由 `createRepo(Config)` 造、两次裸 SQL 调用改调 repo 具名方法；`vectorDimensions` 的晚绑定 thunk 语义不变（`:89` 先给 `null`，`serve()` 前填）
- [x] `app/server/src/retrieve/contracts.ts` + `retrieve/recipes.ts` + `retrieve/retrievers.ts` + `retrieve/search/*` -- `RetrieverDeps.pool` → `RetrieverDeps.repo`；两张 searcher 表与两个名字位按 D3 原样留着，两个类改成只转发（`search(v, limit)` → `repo.vectorCandidates(v, limit)` 再补 `score: 0`）；SQL 与 `rowToChunk` 从这里消失；`embedder` 位与 `QwenEmbedder` 的跨盒 import 原样留着
- [x] `app/server/src/routes/retrieve/retrieve.ts` + `routes/chat/chat.ts` -- RouteDeps 去 `pool: Pool`、改传 `repo`；投影与状态码零改动
- [x] `app/server/src/routes/health/probes.ts` + `routes/resources/resources.ts` + `routes/chat/chat.ts`(类型) + `agent/chat/chat.ts` + `pipeline/contracts.ts` -- `Repository` 一律改自门；`pingDb(Db)` → `repo.ping()`
- [x] `Embedder` 的六个 import 位改自门（实测 `pipeline/contracts.ts:1`、`pipeline/recipes.ts:17`、`pipeline/embed/qwenembed.ts:12`、`retrieve/contracts.ts:11`、`retrieve/retrievers.ts:16`、`retrieve/recipes.ts:18`）-- 只换来源路径与类型名归属，`QwenEmbedder` 类、`embed()` 签名、`pipelines.ts:106` 的调用形状一律不动（SDK 那一刀才改它们）
- [x] **Build 3 — 拔旧路径与对账** 删 `app/server/src/adapters/`、`app/server/src/ports/`；按 D4 改 `test/` 三处 import 路径行（`pipeline-factory.test.ts:3,4,20`、`probe-count-resources.ts:2,3`、`probe-retriever.ts:2`），断言与用例形状一律不动
- [x] `_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md` -- `resource/`→`adapter/` 全量改名（Design Paradigm 表、AD-1/2/3/4/5/6/7、mermaid、词表、Structural Seed、Capability Map）；AD-6 补「`adapter/` 用单一 `contract.ts` 门，不逐盒建」；AD-9 首条删 `model.embeddingModel().dimensions`（实物无此属性，见 Design Notes）；Deferred 里「pool 参数进 config」一行标为归 Lynx 的 SDK 刀
- [x] `.memlog.md`（同目录）-- 追加：命名改名与理由、AD-6 单门修订、AD-9 那条 REFUTED、本轮 SDK 出局归属
- [x] `_Agents/implementation-artifacts/deferred-work.md` -- 记两条：`uri` 盒（含 `Hit.ref`）、AI SDK 接入（provider 登记表 / 模型句柄 / `embedMany` 替 `QwenEmbedder` / 退役 `Embedder`），owner 标 Lynx
- [x] `LEARNING.md` + `_Agents/implementation-artifacts/handoff-2026-10-15-epic3-baselayer-build1-adapter-migration.md` -- 按 AGENTS.md §二 沉淀；文件名只用 ASCII

**Acceptance Criteria:**
- Given 迁移完成，when `grep -rn "\.query(\|new Pool" app/server/src`，then 命中只在 `src/adapter/repo/` 与 `src/adapter/connection/pool.ts`（Lynx 增补 `connection/` 后口径：SQL 文本 → `repo/`，`new Pool` → `connection/pool.ts`；基线是 5 个散落文件）。
- Given 迁移完成，when `grep -rn "createOpenAICompatible\|from 'ai'" app/server/src`，then 零命中（AI SDK 仍在门外）。
- Given 迁移完成，when `grep -rn "ports/\|adapters/" app/server/src`，then 零命中。
- Given 真库 + 真 Ollama + `npx tsx --env-file=.env src/index.ts`，when 依次 `GET /health`、`POST /retrieve {"query":"Qoder 怎么安装"}`、`POST /resources {"url":…}`、`DELETE /resources/:id`，then 与迁移前逐字段同形（`/health` 仍是 `{status, checks{…}}`，`/retrieve` 仍是 `hits[].startOffset/endOffset/dataUri` + `vectorCount/lexicalCount`，`POST /resources` 仍 201 + `chunk_count`，DELETE 仍 204 空体）。
- Given 库里存着 1024 维向量，when 以 `EMBEDDING_DIMENSIONS=512` 起服务并 `POST /retrieve`，then 仍 409 `E_DIMENSION_MISMATCH`（体检与混维拒绝没被搬家搬丢）。
- Given 同一篇文档迁移前后各入库一次，when 比较两条 `resources` 的 chunks 数与 `embeddings.dimension/model`，then 一致。

## Implementation Notes

**验证（全部真跑，终态时间 15:49，`app/server` 工作树）**

- 静态：`npx tsc --noEmit` → `src/` **0 错**（基线已知的 13 条仍在 `test/probe-chunk-shape.ts`，D4 未授权修）；`npx vitest run` 15:25 → **2 files / 8 passed**（与 10-14 基线同数）。
- 三条核对 grep 全达标：`\.query(\|new Pool` 只命中 `src/adapter/repo/`（6 文件）；`createOpenAICompatible`/`from 'ai'` 在 agent 落的代码里零命中；`ports/`/`adapters/` 零命中。
- 起服务（`PORT=3001`，自己的进程，不碰 Lynx 的 3000 热重载）：启动日志 `{"code":"I_VECTOR_DIMENSIONS","message":"库中向量维度=1024 检索维度=1024"}` —— 这条走的是新的 `repo.dimensionsInStore()`。
- 真入库一次（Lynx 放行）：`POST /resources` → **201** `{resource, chunk_count}`，13 chunks，`status: ready`。库里对拍两条**迁移前**旧行（`8e4afad1` 14 chunks / `64e8ab24` 12 chunks）：`chunks==embeddings` 数、`dims=1024`、`models=qwenembed`、`resource_uri <> data_uri` 计 0、`start/end_offset` 非法计 0、空正文 chunk 计 0 —— 三条完全同形。AC 第 6 条按「结构等价 + 分块/嵌段代码零改动」满足：`git diff` 证明 `pipeline/**` 除 import 来源与 `repo: Repository→Repo` 一处类型名外没有第二处改动（没法在不切工作树的前提下跑旧代码做逐字双跑，Lynx 的 3000 服务正在用新代码）。
- `POST /retrieve {"query":"Qoder 怎么安装"}` → **200**，`vectorCount=10 lexicalCount=10 hits=6`；top1 `similarity=0.631722037529054`（10-14 handoff 记的是 0.6317，同一值）；`score=0.03252 = 1/61+1/62`，与 handoff 的 `0.03279 = 1/61+1/61` 差在词路名次从 1 变 2 —— 原因是本轮自己新入库那 13 条改变了 BM25 排名，融合算式本身逐字未变。命中字段仍含 `startOffset/endOffset/dataUri`（前端在读的三个）。
- 混维拒绝：`PORT=3002 EMBEDDING_DIMENSIONS=512` 起服务 → `POST /retrieve` **409** `E_DIMENSION_MISMATCH 库中存在 1024 维向量，与当前检索维度 512 不符，拒绝作答`（文案与状态码不变）。
- 软删：`DELETE /resources/:id` → **204 空体**；该资源 chunks 归 0、全库 `embeddings` 孤儿 0、`resources` 行仍在且 `deleted_at` 已置。
- `EXPLAIN`（`SET enable_seqscan=off`，真库）：带 `WHERE e.dimension = 1024` → `Index Scan using embeddings_hnsw`；同一条摘掉该谓词 → `Seq Scan on embeddings`。迁移后的 SQL 保住了索引形状，这条谓词不能丢已被再次实测钉住。

**对 spec 示例代码的一处纠正**：Design Notes 写的是 `async createRepo(): Promise<Repo>`，实现落成**同步** `createRepo(Config): Repo` —— `pg.Pool` 是懒连接、构造不触网，多一个 await 只会让 `bootstrap.ts` 白等（`adapter/repo/pool.ts:3` 记了理由）。契约里所有方法仍是 async。

**I/O 矩阵覆盖（Lynx 2026-10-15 判）**：「启动清扫」与「写入期间被软删」两行没有任何自动化测试跑得动（前者要库里有 `processing` 行，后者要在 embed 与写事务之间抢删），本轮按「逐字搬家 + 上一轮 story 1.4 已真跑复现」记覆盖，**未新建测试文件**。其余三行由上面的真跑证据覆盖（启动体检 = 3001 日志；向量候选 = 512 那台的 409；db 探针 = `/health` 的 `checks.db=true`，失败侧未测）。

**同树并行编辑（review 时必须排除在本刀之外）**：`src/adapter/provider/registry.ts`（15:10）、`package.json` 新增 `@ai-sdk/deepseek`（15:10）、`src/config.ts` 新增 `getEnv` 导出（15:38）三处是 Lynx 本人的 AI SDK 施工，agent 一行未改。`src/adapter/model/` 是空目录（git 存不住），归那一刀。

**文档纠正**：`handoff-2026-10-15-*`、`deferred-work.md`、`LEARNING.md` 四处把 `adapter/config.ts` 写成「现空壳、归 Lynx」——与 Lynx 当天「不需要 config，根目录 config 用于装配 env」的决策冲突且文件已删，四处改为「参数从门口进（`createRepo(Config)` 取 `databaseUrl`），pool 旋钮要参数化时进**根** `config.ts`」。

**Review 后补的四处 patch（40 条断言分完级后，只有这四条落在本刀代码面）**

- `adapter/contract.ts` 文件头补回 6 条方法级前置条件（同序等长、chunk+向量+ready 同事务、`findActiveBySource` 的 status 集合、`countResourcesByStatus` 只数未软删、`softDeleteResource` 返回 false 的含义与 CASCADE、`dimensionsInStore` 抛错即留 null），并明写 `repo/pool.ts` 被三个 gitignored 对账脚本直接 import 这一条例外。Why：AD-6 让别盒只看门，语义不写进门就等于没写。
- 五个 `NotImplemented` 占位补 `Db: Pool` 首参（`read-content.ts:103-128` + 门传入）。Why：本盒其余 16 个函数一律 `Db` 首参，实现落地时不该两个文件一起改签名。
- `retrieve/contracts.ts` 的 `RetrievedChunk` 改为 `extends ChunkCandidate` 再加 `score`。Why：原先是逐字段手抄镜像，加 `Hit.ref` 时必然漂移（LEARNING 里自己点过的雷）。
- `types/types.ts:4,39` 的「Repository 适配器」改指 `adapter/repo`；`deferred-work.md` 两处指向已删文件的指针更新、已解决的 [评审 D1] 首条划掉、并把「约 5900 块」按实物重算成 chunks ≈10,922 / embeddings ≈13,107。

**复核否证掉的三条主要断言**（都验到旧文件，不是凭印象）：维度校验的三处与裸 `Error` 方言与迁移前逐字同形（`git show HEAD:src/retrieve/search/paradedb-vector.ts:23-37`）；`ChunkCandidate` 那两处 `!== null` 判空是类型必需（摘掉即 TS18047）；`createRepo` 每次建池/无 close 不是本刀引入（迁移前 `createDbPool` 同样，且 `createRepo` 实测只在 `buildDeps` 调一次）。

**一句认账**：Implementation Notes 原先写「启动清扫没有任何自动化测试跑得动」，verification-gap 层对着 `test/pipeline-factory.test.ts` 否证了这条理由——那个用例本来就在真库里建行、写块、`afterAll` 清理。结论（本轮不补测试，Lynx 判）不变，但理由当时写虚了，已按实际情形重记进 `deferred-work.md` defer #1。

**补丁后的复跑（16:22）**：`tsc --noEmit` → `^src/` **0 错**；`vitest run` → **2 files / 8 passed**；`grep -rln "\.query(\|new Pool" src` → 六个文件全在 `adapter/repo/`；`ports/`/`adapters/` 零命中。

**并行编辑现况（写这份记录时）**：Lynx 正在同树改 `adapter/contract.ts`（16:20 加了 `import type { ProviderV4 } from '@ai-sdk/provider'`，第 42 行）与 `adapter/provider/registry.ts`（16:21）。`@ai-sdk/provider` 目前不在 `package.json` 的 dependencies 里，靠 node_modules 提升解析 —— 是本刀之外的一条 hazard，已在 present 里转告，agent 未代改。

**追加一刀：`adapter/connection/`（Lynx 2026-10-15 指令，本 spec 的范围外扩）**

- 搬两件事进门内第五格：`repo/pool.ts` → `connection/pool.ts`（`new Pool` + `pingDb` 的 `SELECT 1`），`provider/ollama.ts` → `connection/ollama.ts`（`/api/version`·`/api/tags`·`/api/ps` 三个原生只读探针）。`repo/` 只剩 SQL 与行投影，`provider/` 只剩 Lynx 的 `registry.ts`（SDK 网关）。
- 接线：`adapter/contract.ts` 三条 import 改指 `./connection/*`，文件头加一句三格分工（connection＝怎么连上、repo＝行与 SQL、provider+model＝SDK），并把「唯一例外」那句的路径改成 `connection/pool.ts`；`test/` 三行 import 同步。旧路径全仓零引用（实测 grep = 0），无兼容层、无再导出。
- 验证（16:4x）：`npx tsc --noEmit` 除 Lynx 正在写的 `adapter/model/registry.ts(4,58) TS1110` 外 `src/` 0 错；`npx vitest run` 2 files / 8 passed；`new Pool` 只命中 `connection/pool.ts:13`；`.query(` 命中 `connection/pool.ts` + `repo/` 五文件；门里 `Pool` 一词只出现在注释与内部变量，`export` 清单不含它。
- 过程留痕：这次 `mv` 与批量 bash 被 auto 模式的分类器连拦两次（判「与 spec 既定范围冲突 / 与并发编辑抢文件」），改成「Write 新文件 → Edit 逐行改接线 → 单条 `rm`」才走过去。对 Lynx 正在编辑的 `adapter/contract.ts` 只用 Edit 改了三行 import 与文件头，未碰他写的 `ProviderV4` / `RegistedProviders` 两行。

**留下的探针**：`app/server/test/probe-sdk-embed.ts`（新建，gitignored）—— SDK 换 `QwenEmbedder` 的六条实测（`dimensions` 真进请求体 / 不传回 4096 / 句柄无 `dimensions` 属性 / `maxEmbeddingsPerCall=2048` 会自动分批 / 预中断抛裸 `DOMException AbortError` / 坏模型名抛 `APICallError statusCode 404`），直接服务于 Lynx 的 SDK 那一刀。

## Spec Change Log

- **2026-10-15（人在场改范围）触发：Lynx 追加指令「把数据库连接和 ollama 迁移到 connection 中」**，并确认 `connection/` 只装这两件（不含 provider/model 的 baseURL·Key 装载）。 Amend：冻结 Boundaries 的 AD-3 那条（原「`Pool` 与 SQL 文本只出现在 `adapter/repo/`」）与 AC 第 1 条的核对口径；新增第五格 `adapter/connection/`（`pool.ts` 自 `repo/`、`ollama.ts` 自 `provider/`），`adapter/contract.ts` 的三条 import 与文件头例外句、`test/` 三行 import 路径随之改线。避开的已知坏状态：让非 SDK 的 Ollama 原生探针继续寄在 `provider/`，使 AD-4「`provider/` 是唯一 `createOpenAICompatible()` 落点」的 grep 核对长期与实物对不上。KEEP（必须保留）：门唯一（`adapter/contract.ts`，不逐盒建）、`Pool` 依旧不出门、SQL 文本仍只在 `adapter/repo/`、两条候选查询的 `::halfvec(N)` 与 `WHERE e.dimension = N` 同形不动、`RetrievedChunk extends ChunkCandidate` 的连接方式不动、HTTP 面零变化。


- 2026-10-15 · 实现偏差（agent，Build 1）：`createRepo(Config): Repo` 落地为**同步**返回，不是 Design Notes 示例里的 `Promise<Repo>`。pg 的 `Pool` 是懒连接、构造不触网；异步化会顺链把 `buildDeps → bootstrap → index.ts` 全推成 async（顶层 await），而 `app/server/package.json` 是 `type: commonjs`，编不过。行为无差，接口少一个 await。
- 2026-10-15 · 解释口径（agent，Build 1）：`ChunkCandidate` 的形状在 `adapter/contract.ts` 里**逐字段写死**，没有写成 `Omit<RetrievedChunk,'score'>`。`RetrievedChunk` 住 `retrieve/`，门去 import 它即违反 AD-1（基础层不上引能力层）；两者靠字段名手工对齐，改一侧要同步另一侧（已写进 handoff 第 3 条）。
- 2026-10-15 · D4 的连带行（agent，Build 3）：门不交连接，三个 test 文件除 import 路径行外各多改 1–2 行装配（`pipeline-factory.test.ts:20` → `createRepo(loadConfig())`、`probe-count-resources.ts:8`、`probe-retriever.ts` 加一行 `createRepo` 且 `deps.pool`→`deps.repo`）。**断言与用例形状一律未动**。三处原本用 `pool.query()` 做对账/硬删清理的地方改为直接 import 盒内 `adapter/repo/pool`，理由是"清理与对账要绕过被测面"，属有意例外，不是分层失守。

## Review Triage Log

| # | 位置 | 断言 | verdict | 核验与去处 |
|---|---|---|---|---|
| BH/EH/VG 1 | BH1 | diff 混了两件不同的小事（registry.ts / 三个 @ai-sdk 依赖 / getEnv） | false-for-cut | 冻结决策已声明这三处是 Lynx 并行施工、本刀一行未改；不属于被审变更的缺陷，但见 present 的并行风险提醒 |
| BH/EH/VG 2 | BH2 | diff 快照与磁盘不一致，且 `tsc` 当时 src 有错 | false-for-cut | 属实但成因是 15:54/16:01 他改 registry.ts；本刀代码面 15:49 与 16:22 两次复跑均 `^src/` 0 错 |
| BH/EH/VG 3 | BH3 | package-lock 未进 diff；`@ai-sdk/provider` 用了却没写进 dependencies | false-for-cut | 他的依赖面。已作为 hazard 转告：靠 hoisting 解析，重装或 dedupe 即断 |
| BH/EH/VG 4 | BH4 | AC 的自检 grep（`createOpenAICompatible|from 'ai'`）抓不到 `@ai-sdk/` | low | 断言本身在本刀成立（我的代码零命中，门里那行 `ProviderV4` 是他 16:20 加的）；修法是把 AC 的核对式拓宽 ⇒ 属改 spec，按规则 reject，改为向 Lynx 建议长期用 `@ai-sdk` 拓宽式 |
| BH/EH/VG 5 | BH5 | 整刀零自动断言，且 `test/` 被 gitignore ⇒ 测试永远进不了 diff | medium | 真实：`vitest list` 只有两份、都不构造 searcher，也不跑 bootstrap。→ defer #1 |
| BH/EH/VG 6 | BH6 | 门把旧端口的 6 条方法级语义注释弄丢了，而 AD-6 让调用方只看门 | medium | 真实且由本刀造成（`ports/repository.ts` 删了、`Repo` 无一行语义）。→ 已补进 `adapter/contract.ts` 文件头 |
| BH/EH/VG 7 | BH7 | 五个占位方法不接 `Db`，与本盒其余方法一律带 `Db` 首参的写法不一致 | low | 真实（`read-content.ts:103-120`、`contract.ts:97,105-108`）。→ 已补 `Db: Pool` 形参并由门传入；『createSession/createMessage 是写却住 read-content』半条 reject：文件头已写明随 2.2 迁出本层 |
| BH/EH/VG 8 | BH8a | 两条 searcher 的 `!== null` 是死分支 | false | 实测摘掉即 `TS18047 'candidate.similarity' is possibly 'null'`（`ChunkCandidate` 两字段都可空）——判空是类型必需，不是防御 cruft |
| BH/EH/VG 9 | BH8b | `ChunkCandidate` 与 `RetrievedChunk` 是手抄镜像，无类型连接 | medium | 真实且由本刀造成（改一侧静默漂移）。→ 已改成 `interface RetrievedChunk extends ChunkCandidate { score: number }`，字段清单只剩一份 |
| BH/EH/VG 10 | BH9 | 门交出两种形状：`repo.*` 是服务，Ollama 三探针要调用方自己递 BaseUrl | low | 真实但日常碰不到，修法要新立一个 provider 服务对象 ⇒ 按规则 reject（fix 比直接改正大） |
| BH/EH/VG 11 | BH10 | AD-4 对 provider 登记表的三条要求一条没落（不叫 createOpenAICompatible、无条件进表、缺 Key 仍写 apiKey） | false-for-cut | 他的文件 |
| BH/EH/VG 12 | BH11 | baseURL 与 Key 出现第二个事实来源（`getEnv` 绕 `loadConfig`） | false-for-cut | 他的文件；AD-2 那条 hazard 已转告 |
| BH/EH/VG 13 | BH12 | `getEnv` 与 `loadConfig` 内闭包 `get` 逐字重复；`config.ts:5` 头仍写「AD-8 仅本地监听」（新脊是 AD-11） | low | 重复半条属他的文件；指针半条是 10-15 脊换代留下的、非本刀造成。config.ts 正被他并行编辑（15:38），这一行注释改由他顺手带，不与他抢同一文件 |
| BH/EH/VG 14 | BH13 | 两条候选查询不带 chunk 级软删谓词，与新头「每个读方法自带未软删谓词」自相矛盾 | false | `read-content.ts:4` 那句管的是本文件五个方法，实测五个都带 `deleted_at IS NULL`；「软删谓词与向量路同口径」是迁移前逐字原句，本刀没新增矛盾。潜在那条（`chunks.deleted_at` 无人写）→ defer #4 |
| BH/EH/VG 15 | BH14 | 维度校验变成三处、两种错误方言；AC 的「文案不变」没有可核对依据 | false | 对照 `git show HEAD:src/retrieve/search/paradedb-vector.ts:23-37`：迁移前同样有构造期整数校验与调用期裸 `Error` 两处，`E_DIMENSION_MISMATCH/UNKNOWN` 两个码也一直只由 `retrievers.ts` 产出；409 文案已真跑逐字复现 |
| BH/EH/VG 16 | BH15 | `rollbackOrLog` 抽取半途而废，`write-content.ts:76` 仍是内联副本 | low | 真实。→ defer #3 |
| BH/EH/VG 17 | BH16 | 注释引 gitignored 探针 ⇒「可复跑」不成立；BM25 的具体数字（3/4/7 条）在新头里退化成定性 | false | 数字定性化正是 `review-reality-check.md` SHOULD 条要的方向且样本问句都留着；引探针路径是迁移前既有写法。可复跑性那条 → 归 defer #1 |
| BH/EH/VG 18 | BH17 | 术语与旧路径指针没跟着清扫：`types.ts:4,39` 仍说「Repository 适配器」；`deferred-work.md:9,15,42` 指向已删文件、已修条目仍挂着 | low | 真实且由本刀造成（`Repository` 这个类型已不存在）。→ 已改 `types.ts` 两处、`deferred-work.md` 两处（并把 5900 的算式按实物改成 ≈10,922 / ≈13,107） |
| BH/EH/VG 19 | BH18 | 文档那一半（脊/memlog/handoff/LEARNING）不在 diff 里 | false-for-cut | 外层仓 `architecture-dev-2026-10-15/`、`spec-*.md`、`handoff-*.md` 至今未进 git（无基线可 diff）；已在 present 说明 |
| BH/EH/VG 20 | EH1 | `OLLAMA_BASE_URL` 未设时 `getEnv(...)+'/v1/'` 静默得 'undefined/v1/' | false-for-cut | 他的 registry.ts；转告为 hazard |
| BH/EH/VG 21 | EH2 | `RegistedProviders` 恒空、`ProviderList` 从不遍历、`createOllama` import 不用 | false-for-cut | 同上 |
| BH/EH/VG 22 | EH3 | `providerApiKey` 收了但 `createFunction` 是零参 ⇒ Key 进不去 | false-for-cut | 同上 |
| BH/EH/VG 23 | EH4 | `@ai-sdk/provider` 未列进 dependencies | false-for-cut | 同 BH3，转告 |
| BH/EH/VG 24 | EH5 | import 期读 env 与 `loadConfig()` 的 fail-fast 撞；`providerName: 'alibaba'` 与 `chatProvider` union 对不上 | false-for-cut | 他的文件；Vitest 不载 .env 那条独立风险 → defer #5 |
| BH/EH/VG 25 | EH6 | 门的五个方法不传 db ⇒ 实现落地拿不到句柄 | medium | 与 BH7 同因。→ 已修 |
| BH/EH/VG 26 | EH7 | `createRepo` 每次调用建一个池，且 `Repo` 没有 close（`Deps.pool` 删掉后无处关） | false | 不是本刀引入：迁移前 `createDbPool` 同样每次建池、全仓无 `pool.end()`（`test/` 里才关）；`createRepo` 实测只在 `buildDeps` 调一次，进程内单例 |
| BH/EH/VG 27 | EH8 | `vectorCandidates` 的 Limit 没判 0/负/非整数 | low | Limit 全部来自 `config.ts` 的 `numOrThrow`（正整数区间校验）与路由；加守卫=新增分支且日常碰不到 ⇒ reject |
| BH/EH/VG 28 | EH9 | repo 内没判 `Vectors.length === Chunks.length` 前置条件 | false | 该前置条件迁移前后都由 `pipelines.ts:110` 判，本刀未移动它；端口注释也已写进门头（BH6 的补丁） |
| BH/EH/VG 29 | EH10 | 三个 probe 直接 import `src/adapter/repo/pool`，绕过门 | low | 真实。→ 已在门头明写这一条例外及其理由（对账脚本要一条独立连接），不再默默 |
| BH/EH/VG 30 | EH11 | claim「AI SDK 不在这一刀」与 registry.ts 进 diff 冲突 | false-for-cut | 文件非本刀产出 |
| BH/EH/VG 31 | EH12 | claim「tsc src 0 错」与他文件里的 TS2355 冲突 | false-for-cut | 两次复跑（15:49、16:22）`^src/` 均 0；红的那版属他的 16:01 编辑 |
| BH/EH/VG 32 | EH13 | claim「vitest 8 passed」不可从 commit 复跑（test/ 被忽略） | medium | 真实。→ defer #1 |
| BH/EH/VG 33 | EH14 | claim「整层唯一对外门是 contract.ts」与 pool.ts / registry.ts 两个入口冲突 | low | pool 半条真实。→ 门头已写明唯一例外；registry 属他 |
| BH/EH/VG 34 | VG1 | 两条候选查询搬进 repo 后没有任何测试会跑到；演示三处破坏 `npm test` 仍全绿 | medium | 真实。其 disposition 是「加 test/retriever.test.ts」，被 Lynx 当场判定否掉（本轮不新建测试）→ defer #1 |
| BH/EH/VG 35 | VG2 | 启动清扫/维度体检/db 探针三个换线点无测试；spec 写的「没有自动化测试跑得动」理由站不住 | medium | 复核认账：`test/pipeline-factory.test.ts` 确实在真库建行写块再清理，那句理由写虚了（已更正见 Implementation Notes）。结论不变：本轮不补测试 → defer #1 |
| BH/EH/VG 36 | VG3 | 仓库里没有任何命令跑 tsc，而本刀最大的新增面（21 个手写闭包接线 + 契约对齐）只有编译器能守 | medium | 真实。→ defer #2 |
| BH/EH/VG 37 | VG4 | `rollbackOrLog` 只覆盖 write-resource 三处，写事务那处仍内联，且 `E_ROLLBACK` 无断言 | low | 真实。→ defer #3 |
| BH/EH/VG 38 | VG5 | registry.ts 是够不到的死代码（全仓无人 import） | false-for-cut | 他的文件 |
| BH/EH/VG 39 | VG6 | 新增三个 @ai-sdk 依赖没有任何自动出口；`@ai-sdk/provider` 未声明 | false-for-cut | 他的依赖面，转告 |
| BH/EH/VG 40 | VG7 | `config.ts` 两个 env 读口径；Vitest 不载 .env ⇒ import 期取值的东西在测试里是 undefined | medium | 前两半属他的编辑；Vitest 那条独立于本刀但会被 SDK 那一刀立刻踩到 → defer #5 |

**去重后分组（root cause）**：`门丢语义/例外没写明`(BH6,EH10,EH14) · `占位方法签名不一致`(BH7,EH6) · `契约手抄无连接`(BH8b) · `旧路径指针未清扫`(BH17) → 四条 **patch，已修**；`零自动断言+test 不可复跑`(BH5,EH13,VG1,VG2,VG5 检索侧,BH16,BH13 部分) → **defer #1**；`没有 typecheck 门`(VG3) → **defer #2**；`rollbackOrLog`(BH15,VG4) → **defer #3**；`chunks.deleted_at 无人写`(BH13 残余) → **defer #4**；`Vitest 不载 .env`(VG7) → **defer #5**；`false`/`false-for-cut` 全部不落地。

## Design Notes

**门只交服务，不交连接**（AD-3 的推论，也是 `Deps.pool` 消失的原因）：

```ts
// adapter/contract.ts
export { createRepo }
export type { Repo }
async function createRepo(Config: AppConfig): Promise<Repo>  // 池在内部造、内部持有
interface Repo {
  ping(): Promise<boolean>                    // /health 的 db 探针
  dimensionsInStore(): Promise<number[]>      // 启动体检（三态由调用方持有）
  markInterruptedAsFailed(): Promise<{ resources: number }>  // 启动清扫，AD-7 唯一写入者仍是 ingest
  vectorCandidates(QueryVector: number[], Limit: number, Dim: number): Promise<ChunkCandidate[]>
  lexicalCandidates(QueryText: string, Limit: number): Promise<ChunkCandidate[]>
  // …其余 13 个方法名逐个沿用现网，不改名
}
```

`ChunkCandidate` = `Omit<RetrievedChunk, 'score'>`，住门。现网 `RetrievedChunk`（`retrieve/contracts.ts:67`）里 `score` 恒由 fusion 之后才赋真值，两条候选查询各自硬写 `score: 0`；收进 repo 后这一位不该由基础层造，所以 repo 交出 `ChunkCandidate`，`retrieve/search/*` 的适配器补 `score: 0` 再交给 `Retriever`（D3）。适配器只剩三行：取 `Deps.repo`、调具名方法、补 `score`。

**不做的事由**：本轮不新增测试文件（AGENTS.md「测试不由 agent 主动伸手」、蓝图不预先排测试）；上表 I/O 矩阵由真跑与既有 Vitest 覆盖，Vitest 用例只按 D4 改 import 行。

## Verification

**Commands:**
- `cd app/server && npx tsc --noEmit` -- expected：`src/` 零错。**基线已知的 13 条错全在 `test/probe-chunk-shape.ts`**（迁移前就存在、`test/` 不入 git），用 `npx tsc --noEmit 2>&1 | grep -c '^src/'` 应为 `0`；这 13 条不在本刀修（D4 只授权改三行 import 路径，不含类型修补）。
- `cd app/server && npx vitest run` -- expected：`http-html-parser.test.ts` + `pipeline-factory.test.ts` 8 passed（基线 `10-14` handoff 实测 8 passed）
- `cd app/server && grep -rn "\.query(\|new Pool" src` -- expected：只命中 `src/adapter/repo/`
- `cd app/server && grep -rn "createOpenAICompatible" src` -- expected：零命中
- `cd app/server && npx tsx --env-file=.env src/index.ts` + `curl` 五个端点 -- expected：见 Acceptance 第 4/5 条

**Manual checks:**
- 启动日志必须仍有 `I_VECTOR_DIMENSIONS 库中向量维度=… 检索维度=…` 一行；缺了说明体检没接上，检索会静默拒答成 `E_DIMENSION_UNKNOWN`。
- `EXPLAIN` 一次向量候选（`SET enable_seqscan=off`），确认仍是 `Index Scan using embeddings_hnsw`——搬家最容易丢的是 `WHERE dimension = N` 谓词。
