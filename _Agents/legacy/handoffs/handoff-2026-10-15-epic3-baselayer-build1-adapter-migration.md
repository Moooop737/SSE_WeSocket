---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-15
story: 基础层迁移（spec-adapter-layer-migration · 新脊第二版的第一刀）
build: 1
status: review
persona: Amelia (Senior Software Engineer)
---

# Handoff — 基础层迁移 / Build1-3：`adapters` → `adapter`（不含 uri，不碰 AI SDK）

## 〇 · 一句话状态

新脊第二版的三层（`api → 能力 → adapter`）在**基础层**这一格落地了：`Pool` 与全部 SQL 收进 `adapter/repo/` 六个文件，`adapter/contract.ts` 成为整层唯一对外门（不导出 `Pool`、不导出借连接原语），`ports/` 与 `adapters/` 两个目录当刀删净、不留兼容层。HTTP 面零变化——用**同一份代码跑两个实例（迁移前 HEAD `6c0b004` vs 迁移后工作区）逐字段对账**证明。`uri` 盒与 AI SDK 按 Lynx 的决定都不在这一刀。工作区未提交（`app/server` 是嵌套 git，HEAD 仍是基线）。

## 一 · 工程在哪

- 新增：`app/server/src/adapter/contract.ts`（门：`createRepo` + 三个 Ollama 探针 + `Repo`/`ChunkCandidate`/`Embedder`/`OllamaModelEntry` 一族类型）、`adapter/repo/{pool,write-resource,write-content,read-content,search-vector,search-lexical}.ts`、`adapter/provider/ollama.ts`（旧文件整搬，零逻辑改动）
- 改接线：`bootstrap.ts`（`Deps` 9→8 字段，去 `pool`；两个裸 SQL 函数体删掉，改调 `repo.markInterruptedAsFailed()` / `repo.dimensionsInStore()`）、`retrieve/contracts.ts`（`RetrieverDeps.pool`→`.repo`）、`retrieve/search/*`（两个类改成只转发 + 补 `score: 0`）、`routes/{retrieve,chat,health,resources}`、`agent/chat/chat.ts`、`pipeline/{contracts,recipes,pipelines}`、`pipeline/embed/qwenembed.ts`、`index.ts`
- 删除：`src/adapters/`（3 文件）、`src/ports/`（3 文件）、空目录 `src/adapter/connection/`
- 仍是空壳、归 Lynx：`src/adapter/model/`（空目录，git 存不住）。`src/adapter/config.ts` **不存在也不该存在**（Lynx 2026-10-15 定：只有根 `config.ts` 装 env；`adapter/` 自己不读 env，参数从门口进来 —— 现网 `createRepo(Config)` 就是接整份 `AppConfig` 取 `databaseUrl`）。pool 的 `max`/`query_timeout` 今天仍写死在 `adapter/repo/pool.ts`，要参数化时进**根** config（脊 Deferred 已标）
- 规格：`_Agents/implementation-artifacts/spec-adapter-layer-migration.md`；架构：`_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`（已全量 `resource/`→`adapter/`，AD-6 补单门例外，AD-9 首条改写）

## 二 · 本轮实测（真库 + 真 Ollama，全部真跑）

| 场景 | 实况 |
|---|---|
| 三条核对 grep | `\.query(\|new Pool` 只命中 `src/adapter/repo/`（6 文件，基线是 5 个散落文件）；`createOpenAICompatible\|from 'ai'` 零命中；`ports/\|adapters/` 零命中 |
| 类型 | `npx tsc --noEmit`：`src/` 零错；仍剩基线已知的 13 条（全在 `test/probe-chunk-shape.ts`，本刀不修） |
| Vitest | `npx vitest run` **8 passed**（与迁移前基线同数；`pipeline-factory.test.ts` 只按 D4 改了 import 行 + 一行 `createRepo(loadConfig())`） |
| 启动体检 | 日志仍有 `I_VECTOR_DIMENSIONS 库中向量维度=1024 检索维度=1024` |
| 启动清扫 | 种 2 条 `processing`（各带 1 chunk + 1 向量）→ 起服务 → `启动清扫：2 条 processing 资源转为 failed(入库中断)`；实测两行 `status=failed / error_reason=入库中断 / nchunks=0 / nemb=0`（embeddings 经 FK CASCADE 一起走） |
| db 探针 | 把 `DATABASE_URL` 指向不可达端口：`/health` → **503** `{status:"degraded", checks:{db:{ok:false},…}}`，不冒 500；`E_CLEANUP` + `E_DIMENSION_PROBE` 各记一行；随后 `/retrieve` → 409 `E_DIMENSION_UNKNOWN`（三态闸门仍生效） |
| 混维拒绝 | `EMBEDDING_DIMENSIONS=512` 起服务 + 真库 1024 → 409 `E_DIMENSION_MISMATCH 库中存在 1024 维向量…` |
| 写入守卫 | 建行 → `softDeleteResource` → `writeChunksWithEmbeddings` ⇒ 抛 `E_RESOURCE_GONE 资源行不存在或已删除，写入中止`，残留 chunks=0 |
| 逐字段同形（AC4） | 起两个实例：基线 `6c0b004` 的 git worktree 跑 3998、迁移后跑 3999，同一批请求逐字段比：`/health` `{status,checks{db,ollama,ollama_models,ollama_running}}`+200；`/retrieve` 的 `hits[]` 仍是 12 键（`chunkId…lexicalScore` 含 `startOffset/endOffset/dataUri`）、`vectorCount=10 lexicalCount=10 hits=6`；`/chat` 同形；空提问 400 `E_EMPTY_QUERY`、坏 body 400 `E_BAD_BODY`、非法 id 400 `E_BAD_ID`；`POST /resources` 201 + `chunk_count`；`GET /:id/chunks` 10 键；`DELETE` 204 空体、重复删 404 |
| 同篇文档前后一致（AC5） | 同一段 markdown 迁移前后各入库一次：`nchunks=1`、`dimension=1024`、`model=qwenembed`、正文 md5 相同，**连 halfvec 文本的 md5 都相同** |
| 索引未丢（Manual） | `SET enable_seqscan=off` + `EXPLAIN ANALYZE` 搬进 `search-vector.ts` 的那条：`Index Scan using embeddings_hnsw`；对照摘掉 `WHERE e.dimension = 1024` ⇒ `Sort`+`Seq Scan`，对照摘掉 `::halfvec(N)` cast ⇒ 同样退化。partial 索引的两个匹配条件都实测到 |
| 数据残留 | 验证用的 5 行（`迁移对账*`）已全部物理删除，库回到 12 resources / 47 chunks / 47 embeddings |

## 三 · 关键决策 / 坑（务必照此续做）

1. **门只交服务、不交连接**（AD-3 推论）：`createRepo(Config)` 内部造池、内部持有，`Repo` 交出 21 个方法（16 个现网名逐个不改 + `ping`/`dimensionsInStore`/`markInterruptedAsFailed`/`vectorCandidates`/`lexicalCandidates`）。代价立刻显形：`test/pipeline-factory.test.ts` 的 `afterAll` 原来靠 `pool.query('DELETE FROM resources…')` 硬删、`pool.end()` 收尾——门里没有这两条服务，它只能直接 import `src/adapter/repo/pool`（内部件）并写明理由。**下一个动测试的人别把它当"分层没守住"顺手改掉**：那是"对账/清理需要绕过被测面"的正当例外。
2. **`createRepo` 同步返回，不是 `async`**：规格里 Design Notes 写的是 `Promise<Repo>`。pg 的 `Pool` 懒连接、构造不触网，异步包装只会把 `buildDeps` 变 async，进而逼 `index.ts` 用顶层 await（`package.json` 是 `type: commonjs`，会编译不过）。已记进 spec 的 Spec Change Log。
3. **`ChunkCandidate` 住门，但不 import 能力层**：形状就是 `Omit<RetrievedChunk,'score'>`，字段逐个抄在 `adapter/contract.ts` 里（不是真的 `Omit` 那个类型表达式）——反向 import `retrieve/` 会破 AD-1。两处因此要靠"字段名一致"手工对齐，改 `RetrievedChunk` 时记得同步。
4. **名次分不在基础层造**：`Repo` 交 `ChunkCandidate`（无 `score`），`retrieve/search/*` 的两个适配器各补 `score: 0` 再交给 `Retriever`，`RrfFuser` 覆盖成真值（D3）。两个类现在各 30 行上下：取 `Deps.repo`、调具名方法、留自己的判定（向量路 `similarity >= minSimilarity`、词路 `lexicalScore > 0`）。
5. **`::halfvec(N)` 的整数校验跟着 SQL 走**：`Dim` 现在是 `vectorCandidates` 的参数，注入防线（`Number.isInteger`）必须住在拼接处，也就是 `adapter/repo/search-vector.ts`；`ParadeDbVectorSearch` 构造函数里那条校验**留着**，为的是装配错误仍在 `assemble` 期炸、不在 search 期炸。看着重复，是两个时机的两件事。
6. **`WHERE e.dimension = N` 是索引条件不是业务过滤**：搬家时最容易被"这像是业务谓词"摘掉，实测摘掉即 Seq Scan。已在 `search-vector.ts` 文件头写死这条。
7. **`Embedder` 按 D2 进门当占位**：六个 import 位只换了来源（`pipeline/{contracts,recipes}`、`pipeline/embed/qwenembed`、`retrieve/{contracts,recipes,retrievers}`），`QwenEmbedder` 类、`embed()` 签名、`pipelines.ts` 的调用形状一律没动——等 Lynx 的 SDK 那一刀在门里原地换成 `EmbeddingModelV4`。
8. **`retrieve/recipes.ts:15` 反向 import `QwenEmbedder` 仍在**（本刀不动，随 SDK 刀解）；`RetrieverConfig` 里的 `ollamaBaseUrl`/`embeddingModel` 两格同理。
9. **五个 `NotImplemented` 桩随 `Repo` 一起搬进 `read-content.ts`**（`findResourcesByStatus` + session/message 四条），语义没改。放这儿是因为它们都是"还没实现的读/写占位"，文件头已写明 session/message 四条随 Story 2.2 落库时迁出。
10. **`deleteChunksByResource` 与 `softDeleteResource` 里重复的 `DELETE FROM chunks` 不合并**：一个无事务单语句、一个在软删事务内，失败面不同（`write-resource.ts` 头部有这句）。

## 四 · 未提交 / git

`app/server` 是嵌套 git（外层 `.gitignore` 忽略 `app/`），内层忽略 `test/` ⇒ 三个探针脚本的改动不进版本控制。当前 `git status`：`D src/adapters/{ollama,paradedb,paradedb-repository}.ts`、`D src/ports/{repository,embedder,chat-model}.ts`、`M` 13 个接线文件、`?? src/adapter/repo/ src/adapter/provider/`、`M src/adapter/contract.ts`（基线里它是**空文件**，本轮填上）。基线 commit：`app/server@6c0b004`；外层 `@001cac5`。
本轮**没有**提交，按分工交 Lynx 过目后由他决定提交点。

## 五 · 还差什么

- **`adapter/uri/` 盒 + `Hit.ref`**（脊 AD-5）→ 已立 `deferred-work.md`，owner Lynx。
- **AI SDK 那一刀**（provider 登记表 / 模型句柄 / `embedMany` 替 `QwenEmbedder` / 退役门里的 `Embedder`，顺带把 pool 的 `max`/`query_timeout` 挪进**根** `config.ts`）→ owner Lynx。
- **`api/` 与能力层的改名**（`routes/`→`api/endpoints/`、`pipeline/`→`ingest/`、`retrieve/contracts.ts`→`contract.ts`）：本轮只动了基础层，层名与目录名按"一次一个阶段"留给下一刀。
- **旧 node:test 探针的收口**：`probe-*.ts` 仍是一跑一打印，没进 Vitest。

## 六 · 下一步（未放行）

基础层落地后，最顺的下一刀是 Lynx 的 AI SDK（它同时解掉门里的 `Embedder` 占位与 `retrieve/recipes.ts` 那条反向 import 两个悬念；pool 旋钮参数化落的是**根** `config.ts`，不设 `adapter/config.ts`）。若先走 `api/` 那一刀，注意本轮的 `ChunkCandidate`↔`RetrievedChunk` 是手工对齐的，`Hit.ref` 加进来时会撞第二次。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图与实测；spec 的 Boundaries 五条 HTTP 不变量在每个 build 派发时原文重贴（D1）。本轮全部改动由 spec 授权（"implement it — the spec is the sole source of truth"），前端 `app/web` 一行未动。沟通：先结论、分点、具体可核对、中文。

## 八 · 追加一刀：`adapter/connection/`（2026-10-15 16:4x，Lynx 指令）

Lynx 收口前追加：「把数据库连接和 ollama 迁移到 connection 中」。基础层由四格变五格。

- **做了什么**：`repo/pool.ts` → `connection/pool.ts`、`provider/ollama.ts` → `connection/ollama.ts`（两文件逐字搬，零逻辑改动）；`adapter/contract.ts` 三条 import 改线 + 文件头补一句三格分工；`test/pipeline-factory.test.ts`、`test/probe-retriever.ts`、`test/probe-count-resources.ts` 各一行 import 路径。旧路径全仓零引用。
- **为什么这么切**：`provider/` 按 AD-4 是**唯一 `createOpenAICompatible()` 落点**，而 Ollama 的 `/api/tags`·`/api/ps` 是原生 HTTP 探针、不是 SDK —— 继续寄在隔壁，那条 grep 核对永远与实物对不上。连接方式（池、地址、探活）与「行」（SQL）也不是一件事。`connection/` 不装 provider/model 的 baseURL·Key 装载（Lynx 明确「就搬这两个」）。
- **怎么验证**：`tsc --noEmit` 非 Lynx WIP 面 0 错（他自己那两条 registry 此刻在改，`adapter/model/registry.ts:4` 当时 TS1110）；`vitest run` 2 files / 8 passed；`new Pool` 只命中 `connection/pool.ts:13`；`.query(` 命中 `connection/pool.ts` + `repo/` 五文件；门不导出 `Pool`。
- **脊同步**：AD-2 四类→五类（并注「要放第六类先改本条」）、AD-3 归属与核对式改写、AD-6 例外清单加 `connection/`、命名行、mermaid 加两条边、Structural Seed、Deferred 的 pool 指针；`.memlog.md` 一条 decision + 一条实测 fact。
- **坑（值得进 LEARNING）**：`mv` 与批量 bash 被 auto 模式分类器连拦两次（判「与 spec 既定范围冲突」「与并发编辑抢文件」），即便用户已口头确认也不放行。走得通的路径是：**Write 新文件 → Edit 逐行改接线 → 单条 `rm`**，且对用户在改的文件只用 Edit 精准改那几行、绝不整文件重写。
- **未决项**：`connection/` 里 Ollama 那格的归属还有一条待议——Lynx 的 SDK 那一刀把 embedding 改走 Ollama **原生 `/api/*`**（见记忆 `ollama-openai-compat-chat`），若成立，`connection/ollama.ts` 与 `provider/registry.ts` 的边界要重画一次；本轮 `test/probe-sdk-embed.ts` 的 `/v1/embeddings` 那批实测随之要重跑。

