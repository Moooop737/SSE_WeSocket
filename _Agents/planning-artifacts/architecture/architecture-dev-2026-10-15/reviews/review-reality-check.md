---
review: 'REALITY CHECK'
target: _Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md
reviewer: 'reality-check lens'
date: '2026-10-15'
method: '逐条对着实物验证：package.json / node_modules 的 .d.ts 与 .js / db/migrations / app/server/src / app/web/src，并对远端 ParadeDB 真跑只读探针（SELECT、EXPLAIN、VALUES 参数上限、临时表 + ROLLBACK 的索引维度探针）；只有 pgvector 上游文档类问题才走 web（web 取回被拦，已注明）'
statuses: 'CONFIRMED / REFUTED / PARTIAL / UNVERIFIABLE'
---

# REALITY CHECK — Architecture Spine（第二版）

**结论：技术骨架大体站得住（AI SDK 实物、pg 的 `<=>`、`::halfvec(N)` 字面量、partial HNSW 表达式索引、`match_disjunction`、65535 协议上限全部实测为真），但 6 条「实测事实」里有 4 条数字或表述在实物前塌了：AD-9 想从 SDK 句柄上读 `dimensions`（该属性不存在）、多行 INSERT 的 5900 块上限（实物两条语句各自算，真实上限 ≈10900）、`N ≤ 4000` 说成 pgvector 物理上限（那是 HNSW 索引上限，halfvec 值到 16000）、AD-8 的「4 条静默 0 命中」（刚才真跑是 3 条）。另外「对外接口契约」一节把 4 处形状钉死成与现网相反的样子（`probes[]`/`contentType`/`chunkCount`/`{deleted:true}`），其中 `chunkCount` 还与脊自己那条 snake/camel 双轨规则打架。**

统计：CONFIRMED 34 · PARTIAL 6 · REFUTED 12 · UNVERIFIABLE 2（共 54 条被验断言，按脊的 Stack / SDK 面 / SQL 面 / 第一版实况引用 / 对外契约 / 不可确认 六节逐条过）。

---

## 1 · Stack 表 vs `app/server/package.json`

| # | 断言 | 状态 | 证据 |
|---|---|---|---|
| 1.1 | 13 行列出的 range 与 `package.json` 逐字一致 | **CONFIRMED** | `app/server/package.json:17-35`（`ai ^7.0.139`、`@ai-sdk/openai-compatible ^3.0.68`、`hono ^4.13.13`、`@hono/node-server ^2.1.4`、`pg ^8.23.1`、`typescript ^7.0.2`、`@types/node ^26.6.5`、`vitest ^5.0.3`、`@vitest/ui ^5.0.3`、`tsx ^4.23.15`、`jsdom ^30.1.2`、`@mozilla/readability ^0.6.0`、`turndown ^7.2.4`）。node_modules 里实装版本与 range 相符：ai=7.0.139、openai-compatible=3.0.68、hono=4.13.13、pg=8.23.1、typescript=7.0.2、@types/node=26.6.5、vitest=5.0.3、tsx=4.23.15、jsdom=30.1.2、readability=0.6.0、turndown=7.2.4 |
| 1.2 | 「抓取解析栈」= jsdom + readability + turndown | **REFUTED（不完整）** | 实际解析链还用了 `turndown-plugin-gfm ^1.0.2`（`app/server/package.json:25`，且真在跑：`src/pipeline/parse/html-parser.ts:10` import、`:28` `td.use(gfm)`）。脊说「精确版本取自 package.json 实读」却漏了第四件，且它是 GFM 表格转 Markdown 的关键，不是可选项 |
| 1.3 | 行名写「Node + TypeScript」，但全表没有 Node 版本 | **PARTIAL** | `app/server/package.json` 无 `engines`；仓库无 `.nvmrc`。脊 173 行的 `require(esm)` 说法是 **Node 版本相关**的（该能力 Node ≥20.19/22.12 才有），而仓库里没有任何地方把 Node 钉住 ⇒ 这条"实测可加载"不可从仓库复现。本机实为 Node v26.10.0 |
| 1.4 | ParadeDB 行：「Docker … `paradedb/paradedb`」 | **UNVERIFIABLE** | 本仓库**没有**自己的 compose/运行定义。全仓唯一的镜像字符串在第三方参考树里：`WeKnora-main/docker-compose.dev.yml:5` = `paradedb/paradedb:v0.22.6-pg17`（不是本项目的运行方式）。真跑的库是远端 Tailscale 主机（`app/server/.env:1` = `…@100.111.110.60:5432/ragdb`），实测 `SELECT version()` = **PostgreSQL 17.9**、`pg_extension.vector` = **pgvector 0.8.1**。⇒ 脊这一行既没钉 tag、也没写"连的是远端"，与本文件其它处（如 169 行 Ollama 明写「远端主机」）口径不一致 |
| 1.5 | Ollama 行：「本地 embedding 与临时对话上游 / 远端主机 `:11434`」 | **CONFIRMED（措辞略拧）** | `app/server/.env:3` `OLLAMA_BASE_URL=http://100.103.104.50:11434`（远端 Tailscale IP）。"本地"读作"自建、非云 API"成立，但与 embedding 文件头注释「本地 Ollama」（`src/pipeline/embed/qwenembed.ts:2`）连起来会让人以为 127.0.0.1 |
| 1.6 | 注 173：`package.json` 是 `type: commonjs` 而 `ai@7` 为 ESM-only，靠 Node `require(esm)` 实测可加载 | **CONFIRMED（本次复测为真）** | `app/server/package.json:15` `"type": "commonjs"`；`node_modules/ai/package.json` `"type": "module"`、exports 只有 `import`。实跑 `node -e "require('ai')"`：成功，`streamText/embedMany/embed` 均为 function；`require('@ai-sdk/openai-compatible')` 同样成功（`createOpenAICompatible` = function）。⇒ 说明 `ai` 无 top-level await，CJS 侧可用 |
| 1.7 | （背景）SDK 已装但尚未进代码 | **CONFIRMED** | `grep -rn "from 'ai'\|require('ai')" app/server/src` **零命中**；`createOpenAICompatible` 在 src 中零命中。⇒ AD-4 的两条 `grep` 核对目前**空转通过**（不是"结构好"的证据，是"还没接"的证据） |

---

## 2 · AI SDK 实物 API 面

| # | 断言 | 状态 | 证据 |
|---|---|---|---|
| 2.1 | AD-4 / memlog:329：`createOpenAICompatible()` 返回 `OpenAICompatibleProvider extends ProviderV4`，其上挂 `chatModel`→`LanguageModelV4`、`embeddingModel`→`EmbeddingModelV4`、`imageModel`→`ImageModelV4` | **CONFIRMED** | `app/server/node_modules/@ai-sdk/openai-compatible/dist/index.d.ts:327`（`interface OpenAICompatibleProvider<…> extends ProviderV4`）、`:330` `chatModel(modelId): LanguageModelV4`、`:332` `embeddingModel(modelId): EmbeddingModelV4`、`:337` `imageModel(modelId): ImageModelV4`、`:409` 工厂签名。memlog 引的 327-338 行区间**准确** |
| 2.2 | Deferred 258：`doEmbed` 收 `dimensions`，「已在实物确认（`.d.ts:243`）」 | **CONFIRMED** | `…/openai-compatible/dist/index.d.ts:243` 正是 `doEmbed({ values, dimensions, headers, abortSignal, providerOptions })`；契约侧 `node_modules/@ai-sdk/provider/dist/index.d.ts:1741-1751`（`EmbeddingModelV4CallOptions.dimensions?: number`）。更关键：**参数真的进请求体**——`…/openai-compatible/dist/index.js:1266` `dimensions: compatibleOptions.dimensions ?? dimensions` ⇒ MRL 截维在 SDK 路径上表达得出来，QwenEmbedder 可退役这一条不只是类型上成立 |
| 2.3 | memlog:208-231：`OpenAICompatibleEmbeddingConfig` 有 `maxEmbeddingsPerCall` | **CONFIRMED** | 同名文件 `:208` 类型声明、`:212` `maxEmbeddingsPerCall?: number`、`:231` class getter |
| 2.4 | **AD-9 首条：「本次检索使用的维度取自 `model.embeddingModel().dimensions`」** | **REFUTED（实物上没有这个属性）** | `EmbeddingModelV4` 的全部成员在 `@ai-sdk/provider/dist/index.d.ts:1823-1857`：`specificationVersion`、`provider`、`modelId`、`maxEmbeddingsPerCall`、`supportsParallelCalls`、`doEmbed` —— **没有 `dimensions`**；`dimensions` 只作为 `doEmbed` 的**入参**存在（:1751）。`OpenAICompatibleEmbeddingModel` 实现类同样没有（index.d.ts:226-243）。⇒ 这条按 AD-4 的类型（`embeddingModel()` → `EmbeddingModelV4`）根本编译不过；维度只能来自 `resource/model` 自己的登记元信息（AD-4 后半句"并同时交出该模型的元信息（id、种类、维度）"其实已经给了正解），或由调用方传给 doEmbed 后回读 `embeddings[i].length`。AD-9 与 AD-4 在此互相矛盾，必须改写其一 |
| 2.5 | 契约表：`POST /chat` 走 UI Message Stream（SSE） | **CONFIRMED（能力存在，非现网）** | `node_modules/ai/dist/index.d.ts:3161` `toUIMessageStreamResponse(…): Response`；`streamText` 签名带 `timeout`、`onAbort`、`onError`（`:3762`）。Hono 侧此前有实测：`app/server/test/probe-sse-hono.ts:49` 直接 `return createUIMessageStreamResponse({stream})` |
| 2.6 | `embedMany` 在能力片调用（AD-4）能表达维度 | **CONFIRMED** | `node_modules/ai/dist/index.d.ts:7791` 解构含 `dimensions`，`:7805` `dimensions?: number` |
| 2.7 | Deferred 253：「同一网关上挂着 `imageModel()` ⇒ P5 只是多登记一类句柄」 | **CONFIRMED** | 见 2.1 的 `:337`；`OpenAICompatibleImageModel implements ImageModelV4` 在同文件 `:263`（`:267` `readonly maxImagesPerCall = 10`） |

---

## 3 · Postgres / ParadeDB / pgvector（远端真跑，只读）

探针方式：`node --env-file=.env` + `pg.Client`，只做 `SELECT` / `EXPLAIN` / 临时表 `ON COMMIT DROP` 且显式 `ROLLBACK`；未写入任何业务表。

| # | 断言 | 状态 | 证据 |
|---|---|---|---|
| 3.1 | AD-9：「`pg` 的 `<=>` 是**余弦距离**，相似度 = 1 − 距离」 | **CONFIRMED（真跑）** | 环境 PostgreSQL 17.9 / pgvector 0.8.1。`SELECT (embedding::halfvec(1024) <=> embedding::halfvec(1024))::float8` → **0**（距离，不是相似度）；`SELECT 1 - (… <=> …)` → **1**。同一条也写在实物注释 `src/retrieve/search/paradedb-vector.ts:3-4` |
| 3.2 | AD-9：「`::halfvec(N)` 的 `N` 在 SQL 里只能是字面量」 | **CONFIRMED（真跑，报错原话）** | 用绑定参数当 typemod：`SELECT embedding::halfvec($2) <=> $1::halfvec($2)` → `error: type modifiers must be simple constants or identifiers`。⇒ AD-9 把 `Number.isInteger` 说成"该处唯一的注入防线"是**成立的**（拼接不可避免） |
| 3.3 | AD-9：「不定长 `halfvec` 列 + 只为需要加速的维度各建一条 partial HNSW 表达式索引」 | **CONFIRMED** | 现网索引定义（`pg_indexes.indexdef`）：`CREATE INDEX embeddings_hnsw ON public.embeddings USING hnsw (((embedding)::halfvec(1024)) halfvec_cosine_ops) WITH (m='16', ef_construction='64') WHERE (dimension = 1024)`。列改不定长的迁移：`db/migrations/20261010054600_embeddings_mixed_dim_expression.sql:5-9`；`dimension` 改名后 partial 谓词自动跟随：`20261010060331_rename_embedding_dim_to_dimension.sql:2`，并有 `vector_dims()` 的真值 CHECK 兜住（`20261010070000_add_embeddings_dimension_check.sql:5-6`，`SELECT vector_dims(embedding)` 实测返回 1024） |
| 3.4 | AD-9：「命中索引的表达式**必须**是 `embedding::halfvec(N) <=> $1::halfvec(N)`」 | **PARTIAL（只说了一半）** | 真跑 `EXPLAIN`（本会话 `SET enable_seqscan=off`）：带 cast 且带 `WHERE dimension = 1024` ⇒ `Index Scan using embeddings_hnsw`；**去掉 cast**（`ORDER BY embedding <=> '…'`）⇒ 退回 `Seq Scan`（与断言一致）；但**保留 cast、去掉 `WHERE dimension = N` 谓词** ⇒ 同样 `Seq Scan`。⇒ partial 索引的谓词是第二个必须逐字命中的条件，脊里没写（现网代码是对的：`paradedb-vector.ts:46` 有 `WHERE e.dimension = ${Dim}`）。落 `repo/search-vector.ts` 时若"顺手"把这个 WHERE 当冗余业务谓词摘掉，就静默失去索引 |
| 3.5 | AD-9：「`N ≤ 4000` 是 pgvector 的**物理上限**，不是本地约定」 | **PARTIAL / 表述 REFUTED** | 真跑（临时表 + ROLLBACK）：`CREATE INDEX … USING hnsw ((v::halfvec(4000)) halfvec_cosine_ops)` 成功；`…halfvec(4097)…` → `error: column cannot have more than 4000 dimensions for hnsw index` ⇒ **4000 是 HNSW 索引的上限**。但**类型本身**的上限是 16000：`'…'::halfvec(4001)` 与 `halfvec(16000)` 均合法，`halfvec(16001)` → `dimensions for type halfvec cannot exceed 16000`。⇒ 脊另一句「列不设维度上限」与「N≤4000 是物理上限」并存会误导：4001–16000 维的模型**能存、永远不能建索引**，而 `config.ts:67` 现在恰好把 `EMBEDDING_DIMENSIONS` 的上界放到 **16000**。"未来加维度＝加索引"需要补一句维度可索引上限，否则 边界二 的"不预设上限"在这里是假的安全感 |
| 3.6 | Deferred 256 / memlog:19：「Postgres 单语句 65535 参数上限」 | **CONFIRMED（协议层为真）** | 真跑 `SELECT count(*) FROM (VALUES …)` 多行构造：6 参 ×10922 行 = **65532 参 OK**；65538 参与 72000 参均失败（`bind message has … parameter formats but 0 parameters`，即 Int16 计数溢出） |
| 3.7 | 同一句里的「约在 **5900 块**」 | **REFUTED（算术与实物不符）** | 实物的写入是**两条独立语句**，各算各的参数预算：`src/adapters/paradedb-repository.ts:136-141` 每条 chunk **6 参**（`:132-133`），`:156-160` 每条 embedding **5 参**（`:152-153`）。⇒ 上限是 `65535/6 ≈ 10922`（chunks，实测 10922 行通过）与 `65535/5 ≈ 13107`（embeddings），不是 5900。5900 的来源是把两条语句的 6+5=11 当成一条：`_Agents/legacy/reviews/review-2026-10-13-epic1-story2-build3-findings.md:95`（W3）、`deferred-work.md:9` —— 脊未经复核把旧结论搬了过来。**方向上偏保守（提早一倍的恐慌），但作为"留位不实现"的量化依据是错的** |
| 3.8 | AD-8：「词法查询必须走 `paradedb.match_disjunction`」 | **CONFIRMED（函数真存在、真跑）** | 本次真跑 8 条问句 × 4 种策略（`app/server/test/probe-bm25-strategies.ts:3-19`）：`c.content @@@ paradedb.match_disjunction('content', $1)` 全部可执行，`match_conjunction`、`parse(q, true)`、`paradedb.score(id)` 同样可执行。发现过程也留了痕：`LEARNING.md:228`（从 `pg_proc` 列出 217 个函数找到这三个）、`handoff-2026-10-14-…:43` |
| 3.9 | AD-8 括注：「实测 8 条里 **3 条抛错**」 | **CONFIRMED（复测仍 3）** | 裸串 `@@@ $1` 抛错 3 条：`it's a test`、`a:b`、`AND`，报错均为 `could not parse query string 'content:(…)'` |
| 3.10 | AD-8 括注：「**4 条静默 0 命中**」 | **REFUTED（复测是 3 条）** | 刚才真跑裸串策略：`设置入口：右上角` rows=0、`怎么安装 OR 卸载` rows=0、`rate*100` rows=0（3 条静默 0），而 `如何 "关闭" 或 启用 AND 逻辑` rows=3、`Qoder 怎么安装` rows=3。⇒ 8 = 3 抛错 + 3 静默 0 + 2 命中。同一段里「`match_conjunction` 8 条里 7 条为 0」今天复测是 **6/8**。这两个"实测数字"随语料漂移（库里现在是 Qoder 文档那批 62 chunks），脊把它们当**定量**证据写进 AD 正文，却没有日期与"可复跑"的指路 ⇒ 下一个 agent 复跑会发现对不上，进而怀疑整条 AD |
| 3.11 | memlog:13（被 `paradedb-vector.ts:3-4` 当作实现依据）：「相关性条件写进 SQL WHERE 会挡掉 HNSW 的 top-k 通道」 | **REFUTED（本次复测，附局限）** | 真跑 `EXPLAIN`（`enable_seqscan=off`）：`WHERE e.dimension=1024 AND 1 - (e.embedding::halfvec(1024) <=> '…'::halfvec(1024)) >= 0.42 ORDER BY …` ⇒ **仍是 `Index Scan using embeddings_hnsw`**（cost 112.32..117.25，rows 估计 14）。⇒ 至少"计划选择被挡掉"这句在这套 PG17/pgvector0.8.1 上不成立。局限：库只有 43 条向量，"过滤后 top-k 不够用需要多访问节点"这一层我没测（要大样本才能测）。**注意：这条被推翻的事实并不在脊正文里，但它驱动了现网把阈值过滤放到 TS 侧的写法，而 AD-8/AD-9 又把"阈值只用于兜字符噪声"当规则——下一轮施工时这条依据需要重新标定，别当成既成物理定律** |
| 3.12 | AD-10：「连接池复用连接 ⇒ RLS 身份必须事务内 `SET LOCAL`」 | **CONFIRMED（结构性）** | `src/adapters/paradedb.ts:9-16` 是 `new Pool({max:5,…})`，`pool.query()` 借出即还是同一条连接；现网确有"事务内多语句"写法（`paradedb-repository.ts:117-170`）。脊把这条列为"将来硬前提"是对的 |

---

## 4 · 脊里当作论据引用的「第一版实况」（逐条 file:line）

| # | 引用 | 状态 | 证据 |
|---|---|---|---|
| 4.1 | AD-1：「5 个文件各自持有 SQL」 | **CONFIRMED（正好 5）** | `grep -rn "\.query(\|new Pool" app/server/src` 命中：`adapters/paradedb-repository.ts`、`adapters/paradedb.ts`（`:26` `SELECT 1`）、`bootstrap.ts`、`retrieve/search/paradedb-bm25.ts`、`retrieve/search/paradedb-vector.ts`。⇒ AD-3 那条核对 grep 的基线数字属实 |
| 4.2 | AD-1 / AD-1：「路由直接持有连接池」 | **CONFIRMED** | `src/routes/chat/chat.ts:16` import `Pool`、`:23` `pool: Pool`、`:31` 解构、`:42` 塞进 recipe；`src/routes/retrieve/retrieve.ts:19,24,43` 同 |
| 4.3 | AD-1：「检索目录反向 import 入库的 embedder」 | **CONFIRMED** | `src/retrieve/recipes.ts:15` `import { QwenEmbedder } from '../pipeline/embed/qwenembed'`（并有 `:4` 注释自认这是刻意的）；`src/retrieve/contracts.ts:11`、`src/retrieve/retrievers.ts:16` 也 import `ports/embedder` |
| 4.4 | AD-6：「`bootstrap.ts` 的 **9 字段** `Deps` 同时装 config、池、工厂、登记表与可后填的体检值」 | **CONFIRMED** | `src/bootstrap.ts:31-41`，字段恰为 9：`config pool repo inflight pipelineConfig pipelineFactory retrieverConfig retrieverFactory vectorDimensions`；"可后填体检值"= `:40` `vectorDimensions: number[] | null`（`:7` 注释即三态说明） |
| 4.5 | Deferred 259：「`bootstrap.ts` 裸 SQL」 | **CONFIRMED** | `src/bootstrap.ts:129`（`SELECT DISTINCT dimension FROM embeddings`，即 AD-9 的 `repo.dimensionsInStore()` 前身）、`:136-151`（重启清扫事务：`SELECT id FROM resources WHERE status='processing'`、`DELETE FROM chunks … ANY($1::uuid[])`、`UPDATE resources SET status='failed'`） |
| 4.6 | memlog:33 / 任务点名的「qwenembed.ts:31 打的是 `/v1/embeddings`」 | **REFUTED（行号差 1）** | 实际在 `src/pipeline/embed/qwenembed.ts:32`（`:31` 是空行）；`dimensions` 在 `:35`；端点名在文件头 `:2`。该文件确为 **46 行**（memlog 的"46 行"正确）。语义为真、指针不准 |
| 4.7 | memlog:35 / 任务点名的「`pipelines.ts:60` mints the uri」 | **CONFIRMED（行号精确）** | `src/pipeline/pipelines.ts:60` `data_uri: isUrl ? Data.url! : \`urn:kc:paste:${globalThis.crypto.randomUUID()}\`` ⇒ 脊 AD-5 的两种 uri 形式（URL 本身 / `urn:kc:paste:<uuid>`）与实物一致 |
| 4.8 | 「`chunks.resource_uri` 是 `resources.data_uri` 的写入时复制」 | **CONFIRMED** | `db/migrations/20261010025742_create_core_tables.sql:21` `resource_uri text NOT NULL`（无默认、无生成表达式）+ `src/adapters/paradedb-repository.ts:121-124` 在写入事务内 `SELECT data_uri FROM resources …`、`:126` 取值、`:133,137` 拷进每条 chunk。⇒ 脊 AD-5"复制在仓储"的说法成立，且这条冗余列的**一致性**风险（改 `data_uri` 不回溯）脊没提 |
| 4.9 | Deferred 257：「pool 的 `max`/`query_timeout` 今天写死在 `adapters/paradedb.ts:12-16`」 | **CONFIRMED** | `src/adapters/paradedb.ts:12` `max: 5`、`:13` `connectionTimeoutMillis: 3000`、`:14` `idleTimeoutMillis: 30000`、`:15` `query_timeout: 5000`（`:16` 是闭合括号，range 无碍） |
| 4.10 | AD-5：「一个概念散在多处……**落库在消息 jsonb**」 | **REFUTED（这一处还不存在）** | 全仓没有 `INSERT INTO messages`：`src/adapters/paradedb-repository.ts:252-254` `createMessage()` 直接 `throw new Error('NotImplemented: createMessage (Story 2.1)')`，`:255-257` `getMessagesBySession` 同样 NotImplemented。存在的只是**声明**：列 `sources jsonb`（`20261010025742_create_core_tables.sql:70`）、类型 `CitationSource{ marker, chunk_id, doc_title, data_uri, source, snippet }`（`src/types/types.ts:57-61`）、端口签名（`src/ports/repository.ts:31`）。⇒ 「五处」实为 **4 处已落地 + 1 处只声明**；作为 AD-5 的"防重演"论据，第五处目前是空头支票（不影响结论，影响可信度） |
| 4.11 | AD-5：「生成在管线、复制在仓储、带出在检索 SQL、投影在两条路由」 | **CONFIRMED** | 生成 `pipelines.ts:60`；复制 `paradedb-repository.ts:126`；带出 `retrieve/search/paradedb-vector.ts:41,56` 与 `paradedb-bm25.ts:30,45`；投影 `routes/retrieve/retrieve.ts:57` 与 `routes/chat/chat.ts:58`（两条路由）—— 恰好 4 处，加端口/类型声明则是 memlog:35 说的"5 处" |
| 4.12 | AD-11：「默认仅 `127.0.0.1` 监听（该值不进取舍、由根 `config.ts` 固定）」 | **CONFIRMED** | `src/config.ts:81` `host: '127.0.0.1'` 写死、非 env；`:5` 注释同口径。Key 侧 `:35-38,59-61` 只从 env 读 `DEEPSEEK_API_KEY`/`DASHSCOPE_API_KEY` |
| 4.13 | memlog:25「现状已有 `config.ts:32` `ChatModelConfig`(服务商模型)」 | **REFUTED（标识符不存在）** | 全仓（除第三方 `WeKnora-main`）grep `ChatModelConfig` **零命中**；`src/config.ts:32` 是 `ConfigError` 构造器里的 `}`。实物对应物是 `src/config.ts:17` `chatProvider: 'deepseek' | 'dashscope'` 与 `:35-38` `CHAT_KEY_BY_PROVIDER`。另一半论据为真：`src/ports/chat-model.ts:1` `export interface ChatModel`。⇒ 脊用"一个词三个意思"论证 AD-2 词表时，第三个意思引错了名字 |
| 4.14 | 词表：「`ports/` 与 `adapters/` 两个目录在本架构中不存在」→ 现状确有 | **CONFIRMED** | `src/ports/`（chat-model/embedder/repository）、`src/adapters/`（ollama/paradedb/paradedb-repository）；`retrieve/contracts.ts`、`pipeline/contracts.ts` 确为复数（memlog:28 说法成立） |

---

## 5 · 「对外接口契约」一节 vs 现网（脊自称"把后端承诺的形状钉死"）

这一节里的差异**不一定是错**（边界一声明前端出局、形状重定），但脊把它们写成"以下字段由…产出"的既成口径，未标"与现网不同、迁移当刀内"，而其中一条还违反脊自己的命名规则。

| # | 脊的断言 | 状态 | 现网实物 |
|---|---|---|---|
| 5.1 | `POST /retrieve` → `{ hits: Hit[], vectorCount, lexicalCount }` | **CONFIRMED** | `src/routes/retrieve/retrieve.ts:49,63`（同名 camel） |
| 5.2 | `Hit` 的 9 个沿用字段名 | **CONFIRMED（名称全部已存在）** | `retrieve.ts:50-62`：`chunkId resourceId chunkIndex docTitle source content score similarity lexicalScore`。新增 `ref`、`range`；删除 `startOffset/endOffset/dataUri` ⇒ **现网消费方在读这三者**：`app/web/src/api/client.ts:60`（`startOffset`）、`app/web/src/ui/recall.tsx:213,223`（`startOffset/endOffset` + `dataUri`）、`app/web/src/ui/ask.tsx:310`、`app/web/src/api/mock.ts:155`。脊没写这一刀怎么带 |
| 5.3 | `GET /health` → `{ status, probes[] }` | **REFUTED** | `src/routes/health/health.ts:40-43` 实为 `{ status, checks: Record<probeName, ProbeResult> }` —— 是**映射不是数组**，字段名也不同；`:44` 还带 200/503 双码。脊该行备注写「只移探针，不拆端点不分级」，读起来像在描述现状 |
| 5.4 | `POST /resources` 请求 `{ contentType, url?, content?, title? }` | **REFUTED vs 现网** | 现网读的是 `content_type`（`src/routes/resources/resources.ts:115` 解构、`:151` 错误文案「content_type 只能是 markdown 或 plaintext」），且**还接受两个脊未列的旋钮** `chunker`、`embedder`（`:115`、`:130-131`）。前端发的正是 `content_type`：`app/web/src/api/client.ts:143` |
| 5.5 | `POST /resources` 成功出参 `{ resource, chunkCount, warning? }` | **REFUTED，且违反脊自己的规则** | 现网 `src/routes/resources/resources.ts:165` 返回 `{ resource, chunk_count, warning? }` + **201**。脊的 Consistency Conventions「出参命名」条只允许两轨：贴库实体 snake_case、检索命中与引用 camelCase；`chunkCount` 两轨都不属，且与真发的 `chunk_count` 相反 |
| 5.6 | `DELETE /resources/:id` → `{ deleted: true }` | **REFUTED vs 现网** | 现网是 **204 空体**：`src/routes/resources/resources.ts:48` `c.body(null, 204)`；前端已按此写死（`app/web/src/api/client.ts:154` 注释「204 没有 body，别去 json()」、`:166` `requestNoContent`） |
| 5.7 | `POST /resources/:id/abort` → 202 | **CONFIRMED（部分）** | 现网 202 带 body `{message, resource_id}`（`resources.ts:71`）；另外**两条 409 分支脊没列**：`E_NOT_PROCESSING`（`:64`）、`E_NOT_INFLIGHT`（`:69`） |
| 5.8 | 错误码目录（10 个码） | **PARTIAL** | 其中 9 个在现网真实存在：`E_BAD_BODY`、`E_EMPTY_QUERY`、`E_DIMENSION_MISMATCH`、`E_DIMENSION_UNKNOWN`、`E_CONFIG_MISSING`、`E_CONFIG_INVALID`、`E_RESOURCE_GONE`、`E_CANCELLED`、`E_TIMEOUT`。**`E_UPSTREAM` 不存在**——脊自己已标「现状只落 500 + 日志，值得单列待实测」，诚实 ✅。但反向不完整：`grep -rhon "E_[A-Z_]*" app/server/src` 去重得 **43 个码**（如 `E_NOT_FOUND`、`E_DUPLICATE`、`E_BAD_ID`、`E_BAD_URL`、`E_AMBIGUOUS_INPUT`、`E_EMPTY_CONTENT`、`E_BAD_CONTENT_TYPE`、`E_UNKNOWN_STAGE`、`E_NOT_PROCESSING`、`E_NOT_INFLIGHT`、`E_POOL`、`E_MAX_SIZE`、`E_DIMENSION_PROBE` 等），脊说"错误码目录见本节"却没说这是**子集** |
| 5.9 | `POST /chat` 请求 `{query, sessionId?, limit?}` + SSE | **PARTIAL（现网差距最大的一格）** | 现网 `src/routes/chat/chat.ts:34` 只读 `{query, limit}`（**无 sessionId**），`:48-67` 返回**普通 JSON** `{answer, hits, vectorCount, lexicalCount}`；sessions/messages 落库未实现（4.10）。⇒ 从 JSON 翻成 UI Message Stream 是**换传输**，不是改字段；脊把它当一行表格写过去了。缓解事实：前端今天**并不调用 /chat**（`app/web/src/api/client.ts:106-188` 只有 `/health`、`/resources*`、`/retrieve`），所以爆炸半径主要在自己那份 Story 2.2 |
| 5.10 | AD-8「`retrieve/contract.ts` 交出自带 uri 引用串的命中 ⇒ `api/` 不需要 import 基础层」 | **CONFIRMED（前提为真）** | 现网 `RetrievedChunk` 已带 `dataUri`（`src/retrieve/contracts.ts:71`），路由只做投影（`retrieve.ts:57`），确实不需要 import 仓储；但两条路由**仍在 import `Pool`**（4.2）——那是 AD-3 要收的，不是这条 |
| 5.11 | AD-4 措辞「`provider/` 是全系统唯一 `createOpenAICompatible()` 落点」 | **CONFIRMED（结构上可行）** | 实物只有 `@ai-sdk/openai-compatible` 一个 OpenAI 兼容 provider 被装（2.1）；现网零调用（1.7），因此迁移无既有落点要拆 |
| 5.12 | AD-2/词表："`model` 一词只指 SDK 模型句柄（AI SDK 占词）" | **CONFIRMED（现网确有撞词）** | 现网同时存在 `Config.embeddingModel`（字符串模型名，`src/config.ts:15`；`retrieve/contracts.ts:28` 同）、`Embedding.model`（列名 `embeddings.model`，`migration:37`）、`ports/chat-model.ts:1` 的 `ChatModel` 端口（对象）。"AI SDK 占词"这条规则要生效，就得同时改掉 `embeddings.model`/`Config.embeddingModel` 这类**已落库**的名字——脊没提这个改动面（列名改名会动 partial 索引谓词以外的另一条 CHECK，见 3.3） |

---

## 6 · 脊断言存在、但我无法在本仓库/本次手段内确认的东西

1. **ParadeDB 的运行方式**（1.4）：脊写「Docker，`paradedb/paradedb`」，本仓库无 compose/Dockerfile/运行记录；真库在远端 Tailscale 主机上（PG 17.9 + pgvector 0.8.1）。**要么补一句"由谁在哪台机怎么起"，要么把 Version 列留空并标 SEED 未定**。
2. **`require(esm)` 的可移植性**（1.3）：本机 Node v26.10.0 实测通过，但仓库不钉 Node（无 engines、无 .nvmrc）。脊把"实测可加载"写成无条件事实；换台机器（Node 20.17 之类）就是 TypeError。**建议 Stack 表补一行 Node 下限**——这本来就是 `require(esm)` 的唯一前提。
3. **pgvector 上游文档**（3.5）：我尝试 `WebFetch` GitHub README（fetch failed）、`WebSearch` 被权限拦。最终用**远端真跑的临时表探针 + ROLLBACK** 拿到权威报错原文，结论比文档更硬：索引上限 4000、类型上限 16000。这条已不再是 UNVERIFIABLE，但记录一下手段。
4. **`E_UPSTREAM` 单列的价值**：脊自己标了"待实测"，我确认现网**无此码**（现网是 `E_CHAT`/`E_RETRIEVE`/`E_INGEST` 三个 500 + 日志：`routes/chat/chat.ts:76-77`、`routes/retrieve/retrieve.ts:75-76`、`routes/resources/resources.ts:168-169`）。这条属于"待做"，不算虚报 ✅。
5. **「一句提问只 embed 一次」**（契约表 `POST /chat` 备注）：我没在 `src/agent/chat/chat.ts` 里找到两次 embed 的路径，但**生成半尚未接**（5.9），因此该句是对尚未存在的代码的承诺，无法核对实物 ⇒ 记为 UNVERIFIABLE。

---

## 7 · 必须动的（triage：按"改了才不误导下一个 agent"排序）

| 级别 | 位置 | 动什么 |
|---|---|---|
| **MUST** | AD-9 首条（脊 129 行） | 删掉 `model.embeddingModel().dimensions`。改为：维度是 `resource/model/registry.ts` 登记的元信息（AD-4 已有位），检索前与 `repo.dimensionsInStore()` 比对；`EmbeddingModelV4` 实物不含该属性（`@ai-sdk/provider/dist/index.d.ts:1823-1857`） |
| **MUST** | Deferred 256 | 「约在 5900 块」→ 按实物两条语句分别算：chunks 6 参 ⇒ ≈10,900 块，embeddings 5 参 ⇒ ≈13,100 块；并说明 5,900 来自旧 review 把两者相加（`review-2026-10-13-…-build3-findings.md:95`） |
| **MUST** | AD-9 第三条（脊 131 行） | 补上第二个必要条件：查询还须带 `WHERE dimension = N` 谓词才能命中 partial 索引（真跑 EXPLAIN：去掉谓词即 Seq Scan）。否则有人会把这条谓词当冗余业务过滤摘掉 |
| **MUST** | AD-9 第四条（脊 132 行） | 「`N ≤ 4000` 是 pgvector 的物理上限」→ 改成「4000 是 **halfvec 的 HNSW 索引**上限，halfvec **值**可到 16000（`config.ts:67` 已按 16000 放行 env）」。⇒ 4001–16000 维能存不能索引，"未来加维度＝加索引"在这段区间是假的 |
| **MUST** | 契约表 health/resources 三行 + 出参命名 | 现网分别是 `{status, checks{…}}`、`content_type`、`chunk_count`+201、204 空体。要么按脊的新形状写并**明写"与 v1 不同，迁移当刀内"**，要么承认是描述现状（现在两头都不像） |
| **SHOULD** | AD-8 括注（脊 119 行） | 「4 条静默 0 命中」→ 复测为 3 条。整句改成定性（"若干条抛错、若干条静默 0"）并指路 `test/probe-bm25-strategies.ts` 让下一个人能复跑；别在 AD 正文里留随语料漂移的数字 |
| **SHOULD** | AD-5 Prevents（脊 94 行） | 「落库在消息 jsonb」这条**还没发生**（`paradedb-repository.ts:252` NotImplemented）。留着会被读成"已有五处"，改成"第五处即将随 sessions/messages 落库出现" |
| **SHOULD** | memlog:25 | `ChatModelConfig` 不存在，实际是 `config.ts:17 chatProvider` + `:35 CHAT_KEY_BY_PROVIDER`；"一个词三个意思"的论证仍成立但引错了样本 |
| **SHOULD** | memlog:33 | `qwenembed.ts:31` → `:32` |
| **SHOULD** | Stack 表 | 补 `turndown-plugin-gfm ^1.0.2`（真在用）；补 Node 下限（`require(esm)` 的唯一前提）；ParadeDB 那行写清是远端主机还是本地 Docker |
| **NICE** | 契约表 `POST /chat` | 传输从 JSON 换成 UI Message Stream 是**换协议**，值得单独一句代价说明（缓解：`app/web` 目前不调 /chat） |
| **NICE** | 词表 `model` 条 | 点名要一并改掉已落库的 `embeddings.model` 列与 `Config.embeddingModel`，否则规则会被现网字符串用法慢慢吃掉 |

---

## 8 · 复盘要点（值得进 `LEARNING.md`）

1. **"已真跑实测" 要带日期 + 可复跑指路。** 本次 6 条引用中 3 条数字与今天真跑不符（5900 块、4 条静默 0 命中、阈值写进 WHERE 挡索引）。定性结论都还在，定量都在漂。
2. **旧 review 的算术会被后来的文档当事实搬走。** 5,900 = 6+5 相加是上一轮 code review 造的，一路传到 deferred-work → memlog → 脊正文，谁都没重算——因为**看起来像实测**。
3. **partial 表达式索引有两个匹配条件（表达式 + 谓词），只写其一是个静默陷阱**，而且代价是"结果对、只是慢"，测试全绿。
4. **上限要说清是哪一层：值 / 索引 / 协议。** 16000（halfvec 值）、4000（halfvec HNSW 索引）、65535（单语句参数，Int16）三个数各自独立，脊里混成了一句"物理上限"。
5. **契约表若自称"钉死"，就得逐字段对着现网核。** 手写的四行差异（health、content_type、chunk_count、DELETE 204）都不是设计洞见，是没查。
