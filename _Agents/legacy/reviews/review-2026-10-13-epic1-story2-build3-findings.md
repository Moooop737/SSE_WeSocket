---
type: code-review-findings
project: Knowledge Copilot
date: 2026-10-13
story: 1.2（添加网页 URL 入库）
build: 3
review_target: app/server 未提交改动（Recipe→PipelineFactory 工厂重构 + repo 三方法 + 单 POST /resources）
review_mode: full
spec_file: _Agents/planning-artifacts/epics.md（Story 1.2 AC，109-133 行）
context_docs: _Agents/planning-artifacts/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md, AGENTS.md
diff_file: /tmp/review-2026-10-13-story1.2-build3-diff.patch
layers: blind-hunter, edge-case-hunter, verification-gap, acceptance-auditor
---

# Code Review Findings — Epic1 / Story1.2 / Build3

## 结论

主线（查重→建 processing→fetch→parse→回填标题→chunk→embed→同事务写→ready）已落地且真跑通 6 例，`tsc --noEmit` 全绿，旧路径拔干净（无残留引用）。但 **Story 1.2 的 AC 有 1 条整条未做、2 条只做一半**，且失败留痕相对被删的 `orchestration/ingest.ts` 是**倒退**（诊断信息与错误码被削平）。

分诊结果：**decision-needed 6 · patch 10 · defer 3 · rejected 11**。

所有条目都经过逐条核实（读调用方/守卫/迁移/消费端），已按核实结论给判决；判决为 `false` 的见文末 Rejected 附录。

---

## 一 · decision-needed（需 Lynx 拍板，未拍板前无法正确落码）

### D1 · 策略名缺省没有单一真源：`embedder` 缺省取的是模型 tag，`chunker` 缺省硬编码在路由 — medium

- 证据：`src/routes/resources/resources.ts:63-64`（`chunker → 'legacy'` 硬编码、`embedder → pipelineConfig.embeddingModel`）；`src/pipeline/recipes.ts:31-32`（注册表 embedders 只有字面键 `qwenembed`）；`src/pipeline/contracts.ts:16-22`（`PipelineConfig` 根本没有"缺省策略名"字段，而路由头 `resources.ts:4` 承诺"缺省走 pipelineConfig"）；`src/config.ts:44`（`EMBEDDING_MODEL` 只校验存在，值自由）。
- 实测核实：今天不炸**纯属巧合** —— `.env` 里 `EMBEDDING_MODEL=qwenembed` 恰好等于注册表键名。`src/routes/health/probes.ts` 明确接受 `qwenembed:latest` 这类带 tag 写法，所以一旦把 env 改成真实模型 id 或带 tag，**每个 `POST /resources` 都 400 `E_UNKNOWN_STAGE`**，而 `/health` 仍报 ok、`vitest run` 仍全绿（`test/pipeline-factory.test.ts:24` 硬写 `embedder:'qwenembed'`，绕开了生产缺省路径；`app/web/src/api.ts:90-101` 从不传 embedder ⇒ 生产只用缺省）。
- 附带：项目记忆定这条 body `embedder` 位是"校验位不是选择位"，并要求把该性质写进管线文件头说明；`src/pipeline/pipelines.ts:1-8` 与 `recipes.ts:1-5` 都没写。
- 可选项：(a) `PipelineConfig` 增缺省策略名字段，路由只读 config，模型 tag 与策略名彻底分家；(b) 注册表按模型 tag 建键；(c) 路由缺省硬编码 `'qwenembed'`、body 的 `embedder` 退回纯校验。

### D2 · AC「命中 JS 渲染/反爬来源 → 提示"可能抓不全"，不阻断其他」整条未实现，`Fetched.warning` 是死字段 — medium

- 违反：`epics.md:133`；亦撞 PRD FR-1 的"明确告知不支持"取向。
- 证据：`src/pipeline/contracts.ts:79` 声明 `warning?: string`，全仓（`server/src` + `web/src`）**无一处赋值、无一处读取**（`web` 里的 `warning` 是 UI 色调名，无关）。实际行为：JS 壳页解析出空正文 → `src/pipeline/pipelines.ts:66` `fail('解析后无正文')`，把"提示"变成**硬失败**，与 AC 的"提示 + 不阻断"语义相反；若正文非空但极薄，则静默 `ready`。
- 待拍板：判定信号怎么定（`raw` 长度阈值 / Readability 抽取命中率 / HTTP 状态或头特征），warning 走哪儿（`IngestResult` 新字段？201 body？Resource 列？），以及是否本 story 内做。

### D3 · 取消信号只覆盖 fetch，掐不掉 embed；Story 1.4 也拿不到可取消的句柄 — medium

- 违反：`epics.md:122`「支持取消信号（AbortController），供 Story 1.4 取消进行中的 **fetch/embed** 并丢弃未完成 Chunk」。
- 证据：`src/ports/embedder.ts:2` 的 `embed()` 签名没有 signal 位；`src/adapters/ollama-embedder.ts:26` 只用自己的 `AbortSignal.timeout(30_000)`；`src/pipeline/pipelines.ts:80` 调用时不传 `Signal`。abort 只能在 embed **返回之后**被 `:85` 发现，在飞的 Ollama 请求掐不掉。
- 更深一层：`POST /resources` 是请求内同步跑完，唯一信号源是 `c.req.raw.signal`（=客户端断连），进程内没有 `resourceId → AbortController` 注册表 ⇒ Story 1.4 的「删除处理中项 → 中断入库」目前没有抓手（该 AC 条款是本 story 的显式依赖项）。
- 同族已核实：`:85` 检查之后到 `:87` 提交之间存在 abort 窗口，仍会写完并转 `ready`。
- 可选项：(a) `Embedder` 端口加 signal 参数（改端口契约，本 story 兑现整条 AC）；(b) 本 story 只兑现"能掐 fetch"，把 embed 取消 + 任务句柄注册表明确推到 Story 1.4 并在 AC 上标注。

### D4 · 「非 P1 支持类型」的 URL 不会被前置拒绝（PDF/图片/JSON 照样建行）— medium

- 违反：`epics.md:129-130` / FR-1「输入非法（空、非法 URL 格式、非 P1 支持类型）时直接拒绝并提示，**不创建 Resource**」。
- 证据：`src/routes/resources/resources.ts:70-78` 只校验 URL 语法 + `http/https`；`src/pipeline/fetch/http-fetcher.ts:18-26` 拿到响应后不看 `Content-Type`，`await res.text()` 通吃二进制 ⇒ PDF/图片 URL 会建行、把二进制当文本抓，结局是"乱码入库转 ready"或"留一条 failed 行"，而不是 AC 要求的前置拒绝。
- 待拍板：这条 AC 的"非 P1 支持类型"指的是 URL 指向的 MIME 类型，还是只指请求体形态（file 上传之类）？若是前者，用哪种拒绝位（HEAD 预探 / GET 后按响应头判 / 接受建行后 failed 但在 reason 里写明"不支持的类型"）。

### D5 · 同 URL 查重是 TOCTOU，库里没有任何唯一索引 — medium

- 证据：`src/adapters/paradedb-repository.ts:97-105` 的 `findActiveBySource` 与 `createResource` 之间无锁无约束；`grep -in "unique" db/migrations/*.sql` → **全库无 UNIQUE**（只有 PK 与 `embeddings_dimension_matches` CHECK）。UI 双击/前端重试即可能建两条 ready 行 + 两套向量，重复引用要到 Epic 2 检索期才显形。
- 现状来源：上一轮"查重与建行之间竞态 → P1 不加唯一索引"是 agent 建议、记忆记录 Lynx **未逐条确认**（`story-1-2-remaining-scope`）。
- 待拍板：接受竞态（并在 handoff 里把这条转成已确认决策）／加 partial unique 索引 `resources(source) WHERE status IN ('ready','processing') AND deleted_at IS NULL`／改用 advisory lock。

### D6 · `app/server/.gitignore` 把整个 `test/` 忽略 ⇒ 本 build 的实跑证据不进版本控制 — medium

- 证据：`git check-ignore -v test/*.test.ts` → `.gitignore:3: test/`；`git ls-files test` 为空；本轮 review 只能靠 `git diff --no-index` 手工把 2 个测试文件塞进 diff 才看得见。
- 具体危害：本轮提交后另起一份 clone，`npm test` **跑 0 个用例且绿**；未来 retrospective / code review 读不到测试；本轮删掉的 `orchestration/ingest.ts` 在 `app/server` 历史里其实可恢复（外层 `app/` 被忽略但内层是独立 git 仓库，HEAD=`0226c85`），而它的替代测试反而不可恢复。
- 待拍板（`.gitignore` 归 Lynx，agent 不擅改）：放开 `test/`／还是把测试挪进 `src/**/*.test.ts`（`vitest.config.ts:7` 两种模式都 include）／还是维持现状并接受"测试只活在本地"。

---

## 二 · patch（修法明确、不需人类输入）

| # |  finding | 位置 | 判决 |
|---|---|---|---|
| P1 | `runOne` 的建行前两段（查重、`createResource`）在 `try` 之外：DB 抖动时绕过 `fail()` 留痕，且 `batch` 循环没有 per-item try ⇒ 整批 reject、已收集结果丢失、后续条目不跑。与已拍板语义「batch 每条独立、`runOne` 内部全 catch 不外抛」冲突。另：`batch` 中途 abort 时 `break` 使结果数组短于输入，调用方无法按下标回对。 | `src/pipeline/pipelines.ts:40-53,101-108` | medium |
| P2 | 失败路径把原因与错误对象一起削平（相对被删的 `orchestration/ingest.ts` 是倒退）：裸 `catch {` 不绑 err、不打日志；embed 的**写库**失败落在通用 catch ⇒ `error_reason='入库失败'` 而 AC 要求 `失败(embedding_error)`；`failure.code` 恒 `E_INGEST_FAILED`，前端 `App.tsx:384` 显示 `code · message` ⇒ 所有失败同一码；`fail()` 里两个 `.catch(()=>{})` 静默（若 status UPDATE 失败，行卡 `processing`，同 URL 之后一直 409，直到下次重启清扫）；`ROLLBACK` 自身抛错会顶掉原始错误（远程 Tailscale PG + `query_timeout:5000`，连接死掉是可达路径）。 | `pipelines.ts:55-59,81-83,87-96` / `paradedb-repository.ts:162-163` | medium |
| P3 | `ready` 不在写入事务内：`writeChunksWithEmbeddings` 已 COMMIT，随后单独 `updateResourceStatus('ready')`。这一步抛错或进程退出 ⇒ chunk+向量已落、行仍 `processing` ⇒ 下次启动 `cleanupInterruptedIngest` 把 chunk 删掉并转 `failed(入库中断)`，**一次已成功的入库被抹掉**（AC 担心的"就绪缺向量"的反向口子）。 | `pipelines.ts:87-92` + `bootstrap.ts:cleanupInterruptedIngest` | medium |
| P4 | HTTP 边界零测试、也从没冒烟：没有任何测试 import `createResourcesRoute`；`POST /resources` 的 201/409/422/400(`E_BAD_JSON`/`E_BAD_URL`/`E_BAD_CONTENT_TYPE`/`E_UNKNOWN_STAGE`) 分支、`GET /resources`、`GET /resources/:id/chunks` 全靠编译绿灯。**这正是 handoff build3 §六 定的下一步**；D1 那个"每个 POST 都 400"的地雷也只有在这一层才拦得住。 | `src/routes/resources/resources.ts:48-104` | medium |
| P5 | 本 build 的新行为只有 `peek` 没有 `expect`（三处，同一成因）：① 全仓没有任何一处读取 `embeddings` 表（`grep "FROM embeddings"` 只在 INSERT 里），"ready"从未被验证= "有向量"，FR-4 的 `dimension` 记实际维度无断言；② 标题回填（新端口方法 + 新管线步骤）只被 peek，返回值与库内行从未对比；③ 失败原因串（`embedding_error`/`内容为空`/`入库取消`）无断言，且 `fail('内容为空')` 分支从任何在跑的测试都到不了（空白正文在 `:66` 就被 `解析后无正文` 截住）。 | `test/pipeline-factory.test.ts:33,49,59,68,75` | medium |
| P6 | 纯空白 `content` 被报成「url 与 content 必须恰好给一个」：`resources.ts:57-58` 把给了但空白的 content 折成 `undefined`，`:59-61` 与"根本没给"塌进同一个 `E_AMBIGUOUS_INPUT`；被删的 `resources-text.ts` 原本给的是 `E_EMPTY_CONTENT: 内容不能为空`。AC 的"直接拒绝**并提示**"语义丢了（前端 `App.tsx:60-61` 挡在客户端，直连 API 才暴露）。 | `resources.ts:57-61` | low |
| P7 | 请求体是合法 JSON 但非对象（`null` / `5` / `[]`）时：`c.req.json()` 不抛 ⇒ 紧接着读 `b.url` 触发 TypeError，`src/index.ts` 没设 `onError` ⇒ 未捕获变成 500，而不是 400。系统边界的输入校验。 | `resources.ts:49-59` | low |
| P8 | 注册表查名会命中 `Object.prototype`：`fetchers[n]?.(c)` 对 `n='toString'` 拿到原型方法、对 `'constructor'` 拿到 `Object`，返回真值骗过 `need()`，之后 `fetcher.run` 不是函数 ⇒ 落进通用 catch 变成 422「入库失败」，而不是 400 `E_UNKNOWN_STAGE`。 | `src/pipeline/recipes.ts:35-38` | low |
| P9 | 契约里承诺的旋钮没人读：`PipelineConfig.chunkSize` / `fetchTimeoutMs` 声明在 `contracts.ts:20-21`，`grep` 全仓无读取点（`recipes.ts:21-29` 构造时丢掉 config）。其中"fetch 无超时"是真隐患：`http-fetcher.ts:18` 不接超时，挂住的外站 URL 会把请求占住到客户端自己断开。要么接上，要么从契约删掉（删=直接纠正）。 | `contracts.ts:20-21` / `recipes.ts:20-33` / `http-fetcher.ts:18-26` | low |
| P10 | 规范/整洁族：新增 Repository 方法参数仍 camelCase（AGENTS §四 要 PascalCase，且"改动某文件时顺手靠拢"）；`src/pipeline/recipes.ts` 文件名与内容错位（里面只有 `createStageRegistry`，真工厂在 `pipelines.ts`）；5 个文件无行尾换行；`test/http-html-parser.test.ts:6` 用 `const URL` 遮蔽全局 `URL` —— 正是本 build handoff §三.9 自己立的规矩。 | `ports/repository.ts` / `paradedb-repository.ts:90,97,110` / `recipes.ts` / `test/http-html-parser.test.ts:6` | low |

> P4/P5 涉及新增或改动测试文件。按 Lynx 的规矩（测试不由 agent 主动伸手、蓝图里不预先排新测试文件），这里只报缺口清单，补不补、何时补由他定。

---

## 三 · defer（真实但本轮不动）

| # | finding | 位置 | 备注 |
|---|---|---|---|
| W1 | `vitest.config.ts:8` 排除 `src/pipeline/chunk/legacy.test.ts` ⇒ chunk 偏移 `text.slice(start,end)===content`、`chunk_index` 稠密唯一这些断言**从不执行**，而 `paradedb-repository.ts:140-153` 的向量↔chunk 配对、Story 2.3 的引用定位都压在这个不变量上。 | `vitest.config.ts:8` | pre-existing；Lynx 已定「旧 node:test 暂留、之后统一重构」。定论它是否已经出问题 = 把该文件跑一次 `node --test` |
| W2 | `ARCHITECTURE-SPINE` AD-1 的依赖箭头（`pipeline → ports → adapters`）与现实现不符：`recipes.ts:12,32` 在 pipeline 层 import 并 `new OllamaEmbedder`。核实结论是**这不算实现跑偏** —— Lynx 2026-10-13 亲自定了"四段全走注册表、embedder 也在其中（构造时吃 config）"，并推翻了 2026-10-10「不做按名字查表的注册中心」。但 SPINE 没补记这个例外，且旧 `recipes.ts` 头里那条 10-10 决定被本 diff 覆盖后 `_Agents/` 无记录。 | `ARCHITECTURE-SPINE.md` AD-1 | 修法是改 spec/文档 → 按分诊规则转 defer。建议在 AD-1 加一句「StageRegistry 是 pipeline 层唯一允许 new 适配器的位置」 |
| W3 | 单事务多行 VALUES 无分批：chunks 每行 6 参 + embeddings 每行 5 参，约 5900 块撞 Postgres 65535 参数上限（`query_timeout:5000` 会先到）。 | `paradedb-repository.ts:126-158` | P1 抓网页文章碰不到；等真喂长文档再分批或 `unnest` |

---

## 附录 · Rejected（逐条给核实依据）

| # | 判决 | 依据 |
|---|---|---|
| R1 | `false` | 「`fail()` 只清 chunks 不清 embeddings ⇒ 留向量孤儿」：迁移 `20261010025742_create_core_tables.sql:34` 是 `source_id uuid NOT NULL REFERENCES chunks(id) ON DELETE CASCADE`，删 chunk 级联删向量。 |
| R2 | `false` | 「仓库层不校验 `vectors`/`chunks` 等长会炸」：`pipelines.ts:84` 在调用前判等并 `fail('embedding_error')`，且 `writeChunksWithEmbeddings` 全仓只有这一个调用方。 |
| R3 | `false` | 「`@vitest/ui` 只进依赖没有脚本/配置」：`package.json` 早已有 `"test:ui": "vitest --ui"`（本 diff 只加了依赖行）。 |
| R4 | `false` | 「非 E_DUPLICATE 时 201 带 `resource:null`」：`runOne` 只有查重路径返回 null，而路由 `:92` 先把 E_DUPLICATE 拦成 409，该路径不可达。 |
| R5 | `false` | 「`content_type`/空白 url/Recipe-数据错配 没在 `runOne` 里校验」：P1 唯一调用方是路由，且都已在路由校验；为无调用者的形状加守卫属扩面。 |
| R6 | `false` | 「`writeChunksWithEmbeddings` 里 resources 行不存在 → 读 `res.data_uri` 崩」：建行刚刚发生、无 P1 删除路径；且失败即回滚，不产生静默损坏。 |
| R7 | `false` | 「标题回填抛错该被吞掉」：同一次 DB 抖动同样会打断后续写入段，`catch(()=>{})` 只会把真失败盖成"标题没写"。 |
| R8 | `false` | 「测试里 `pool.query('DELETE FROM resources')` 违反 AD-2」：AGENTS §四 把测试列为 D 类风格豁免组；真正的问题是它调的 `deleteEmbeddingsByResource` 是 `throw NotImplemented` 被静默吞（归入 P5/P10 讨论范围）。 |
| R9 | `false` | 「测试的 `loadEnv` 不认引号/`export`/小写键会读错值」：`.env` 实测无引号值（`grep -c '="' = 0`），文件缺失时 `readFileSync` 直接抛是正确行为（loud fail，不可静默）。 |
| R10 | `low` | 「`GET /resources/:id/chunks` 传非 uuid → 500」：该 GET 非本 diff 引入，本地单人自用，补正则校验是扩面而非纠正。 |
| R11 | `low` | 「`chunk_index` 与向量可能错配」：取决于 legacy chunker 是否保持稠密唯一 index —— 能定论的证据正是 W1 那个被排除的测试，已并入 W1 记暂缓。 |

---

## 四 · 拍板与落码（2026-10-13 同一轮，Lynx 已定）

拍板口径：**D1 按"Lynx 让 embedder 和其他 fetcher 一样在 pipeline 层建类文件"落码，D3 随之一起解决；D2 只做 warning；D4/D5/D6 本批不动；P4/P5 属于测试缺口，只报不动。**

### 已落码

| 项 | 落法 |
|---|---|
| D1 + D3 | 新建 `app/server/src/pipeline/embed/qwenembed.ts`（类、自己发 fetch、构造吃 `PipelineConfig`，与 `fetch/http-fetcher.ts` 对称）；`src/adapters/ollama-embedder.ts` **删除**，不留包装；`ports/embedder.ts` 的 `embed()` 增 `Options.signal`；`pipelines.ts` 把 `Signal` 喂进 embed，并按 `Signal.aborted` 把"掐掉"与"embed 失败"分成 `入库取消` / `embedding_error`；`HttpFetcher` 与 `QwenEmbedder` 都用 `AbortSignal.any` 把调用方信号与自带 30s 超时合成一个信号。路由 `embedder` 缺省从 `pipelineConfig.embeddingModel` 改成策略名 `'qwenembed'` ⇒ 模型 tag 与策略名两套名字分家（`contracts.ts` 加注：`embeddingModel` 是写进 `embeddings.model` 的标识）。 |
| D2（只做 warning） | `IngestResult` 增 `warning?: string`；`pipelines.ts` 的 `thinPage()` 在 parse 后按「原页 ≥2000 字符、抽出正文 <200 字符」给 `可能抓不全：…` 提示，**行仍 ready、不阻断**；死字段 `Fetched.warning` 删掉；路由 201 body 透传 `warning`。**前端 `App.tsx` 未接这个字段**（等 Lynx 决定展示位）。 |
| P1 | `batch` 改成 per-item 隔离：`runOne(...).catch(notStarted)` ⇒ 建行前抛出不再打断整批；abort 后"未开始的不建行也不出结果"保持你已拍板的语义不变。 |
| P2 | 失败路径全部绑 `err` 并 `logError()` 出 JSON 诊断（`E_EMBED` / `E_EMBED_WRITE` / `E_INGEST` / `E_NOT_STARTED` / `E_FAIL_CLEAN` / `E_FAIL_MARK` / `E_ROLLBACK`）；`writeChunksWithEmbeddings` 的失败单独 catch → 恢复 `embedding_error`；`fail()` 里两个写库调用不再静默；`paradedb-repository.ts` 与 `bootstrap.ts` 的 `ROLLBACK` 加 `.catch` 并记日志，不顶掉真因。`failure.code` 仍是单一 `E_INGEST_FAILED`（要细分得同步改前端的 code 分档，本轮只把原因与日志补回来）。 |
| P3 | `ready` 折进 `writeChunksWithEmbeddings` 的同一事务（`UPDATE resources SET status='ready'` 在 COMMIT 之前），`pipelines.ts` 不再单独调用 `updateResourceStatus('ready')` ⇒ 消除「向量已落、行仍 processing → 下次启动清扫删掉已成功入库」的口子。端口方法名保留 `writeChunksWithEmbeddings`，靠 ports 注释说明它会一起转 ready；若你更看重名字自解释，改名是后续一次机械改动（不影响测试，测试没调用它）。 |
| P6 | 纯空白 `content` 回到 `400 E_EMPTY_CONTENT 内容不能为空`；"恰好给一个"的两种情形拆成两条独立判断（都给 → `E_AMBIGUOUS_INPUT`）。 |
| P7 | body 是合法 JSON 但非对象（`null` / 数字 / 数组）→ `400 E_BAD_JSON 请求体需为 JSON 对象`，不再 500。 |
| P8 | 注册表改用 `instantiate(Table, Name, Config)` + `Object.hasOwn` ⇒ `'toString'` / `'constructor'` 这类原型链名字一律算查无 → `400 E_UNKNOWN_STAGE`。 |
| P9 | 删掉 `PipelineConfig.chunkSize` / `fetchTimeoutMs`（声明了没人读的死契约）；`HttpFetcher` 补 `FETCH_TIMEOUT_MS = 30_000`（挂住的外站不再占着请求到客户端自己断开）。 |
| P10 | 本轮新增/改动的端口方法参数改 PascalCase（`updateResourceTitle(Id, Title)` / `findActiveBySource(Url)` / `writeChunksWithEmbeddings(ResourceId, Chunks, Vectors)`）；补齐缺失的行尾换行。**两项没做**：`recipes.ts` 改名（会牵动 `test/pipeline-factory.test.ts` 的 import）、`test/http-html-parser.test.ts:6` 的 `const URL` 遮蔽（在测试文件里）—— 按"不动测试"搁下。 |

### 未落 / 剩余

- **P4 HTTP 边界覆盖**：本轮只做了人工冒烟（见下），没有新增测试文件。缺口仍在。
- **P5 新行为断言**：`embeddings` 表在测试里仍无人读取、标题回填与失败原因串仍只 `peek`。缺口仍在（人工冒烟已证明 today 行为正确，但没有断言守着）。
- **D4 非 P1 支持类型前置拒绝**：本批选择「只做 warning」⇒ PDF/图片 URL 仍会被 `res.text()` 当文本抓。AC `epics.md:129-130` 的这半条**仍未满足**，留作 story 1.2 收尾前的一项。
- **D2 的展示位**：`warning` 已进 201 body，前端未渲染 ⇒ AC 那句"提示"对用户尚未可见。
- **D5 / D6**：按你的决定不加索引、不改 `.gitignore`，也不记录成决策条目（D5 已从本文上方 decision 列表作废；D6 维持"测试只活在本机"）。

### 本轮验证证据（都是真跑）

| 验证 | 结果 |
|---|---|
| `npx tsc --noEmit` | EXIT=0（删掉 `adapters/ollama-embedder.ts`、改端口签名后全绿） |
| `npx vitest run`（测试文件未改） | **8 passed** / 13.84s：真实 URL → `ready`、标题回填「快速上手 · WeKnora 文档」、`chunkCount=16`；重复 → `E_DUPLICATE`；空白正文 → `failed(解析后无正文)`；`chunker:'nope'` → `IngestError`；batch → `[ready, failed]` |
| 冒烟：7 个不写库的分支 | `GET /resources` 200；`null` / `5` → **400 E_BAD_JSON**；空白 content → **400 E_EMPTY_CONTENT**；url+content 都给 → 400 E_AMBIGUOUS_INPUT；`chunker:"toString"` → **400 E_UNKNOWN_STAGE**（P8 修复的直接证据）；`ftp://` → 400 E_BAD_URL；`content_type:"pdf"` → 400 E_BAD_CONTENT_TYPE |
| 冒烟：一次真实 POST（markdown） | **201** `{status:'ready', chunk_count:1}`，标题自动取 `# 冒烟`；读库确认该行 `status=ready`、`embeddings` 有 1 行且 `dimension=1024`（P3 同事务转 ready + 向量落库的直接证据）；验证完删掉该行，FK 级联清干净（`chunks left: 0`） |

---

## 五 · 收口

2026-10-13：Lynx 判定 **Story 1.2 = done**，`sprint-status.yaml` 已置 done。上面「未落 / 剩余」四项转为**已知非阻塞后续**（非 HTML 前置拒绝 / warning 上界面 / P4-P5 断言守护 / app/server 工作区未提交），不在本 story 内追。

