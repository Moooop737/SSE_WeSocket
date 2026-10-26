# Story 2.1 code review findings（2026-10-14）

> 从 `_Agents/planning-artifacts/epics.md` 移出（2026-10-24 文档整理），避免评审明细打断 Story 2.1 → 2.2 的阅读线。
> 四层 lens：blind-hunter / edge-case-hunter / verification-gap / acceptance-auditor；静态断言逐条回代码复核。
> 现行 AC 与 as-built 对账以 `epics.md` Story 2.1 的 2026-10-24 注为准。

### Review Findings（code review of Story 2.1，2026-10-14）

评审范围：`app/server` 未提交工作区 15 文件 / +594 −18；四层 lens（blind-hunter / edge-case-hunter / verification-gap / acceptance-auditor）并行，静态断言已逐条回代码复核，复核状态写在每条后面。

#### decision-needed

- [x] [Review][Decision] **检索层的分层归属未按 AD-1/AD-2 落地，且 `ports/retriever.ts` 被删** — 决议 `3)`：代码不动，三处偏差登记进 `deferred-work.md`（目录已随 D3 更名为 `retrieve/`，登记时用新路径） — 三处同因：`retrive/search/*.ts` 与 `bootstrap.probeVectorDimensions` 拿裸 `pg.Pool` 直查库（AD-2「任何模块不得绕过 Repository 端口」）；`retrive/recipes.ts:13` 从 `pipeline/embed/qwenembed` import 具体类（AD-1 两条路径不得互依）；`retrive/contracts.ts` 承接了原 `ports/retriever.ts` 的契约，而 Story 1.1 的 AC（本文件第 101 行）明写 `ports/` 下要有 `Repository/Retriever/Embedder/ChatModel` 四个接口文件。反证要先知道：as-built 里可执行契约 `Pipeline` 本就住在 `pipeline/contracts.ts` 而非 `ports/`，所以这是「AC 与 as-built 各说一半」，不是单纯跑偏。
- [x] [Review][Decision] **维度闸门 fail-open + 全表粒度** — 决议 `1)` 已落码：`vectorDimensions` 改三态（数组 / 空数组 / `null`），体检未跑成 ⇒ `E_DIMENSION_UNKNOWN` 拒绝作答，不再退回 BM25-only 静默命中。实测：`=== 体检未跑成探针 抛 E_DIMENSION_UNKNOWN`、`=== 混维探针 抛 E_DIMENSION_MISMATCH 库中存在 768 维向量…` — `bootstrap.ts:107-115` 探维失败只打日志、`vectorDimensions` 永久留 `[]` ⇒ `retrivers.ts` 的 foreign 判定恒空，此时向量路被 SQL 过滤成 0 条而 BM25 路（与维度无关）照样命中 ⇒ 实况是「静默 BM25-only 作答」，正是 AC:186 禁止的那种降级（`bootstrap.ts:8` 把它写成「静默未找到」，注释结论也是错的）。另一面：判据取全表 `DISTINCT dimension`，一条历史残留异维行就让整个端点永久 409，而 AD-4 明确接受单表混维是正常状态。
- [x] [Review][Decision] **目录命名：`retrive/`、`retrivers.ts`、`agent/`** — 决议「只改拼写 + 把 orchestration 从架构里去掉」已落：`src/retrive/`→`src/retrieve/`、`retrivers.ts`→`retrievers.ts`（残留计数 0），SPINE 的 Design Paradigm / AD-1 Rule / Structural Seed / mermaid 全部改用 `agent/` + `retrieve/`，`orchestration` 仅在「已废除」注里留名 — 前两个是错拼（retrieve/retrievers），同一功能在 diff 里同时存在 `src/retrive/` 与 `src/routes/retrieve/` 两套拼写；SPINE Structural Seed 给这层定的名字是 `orchestration/`；`src/agent/` 与 AGENTS §五「P1 不碰 Agent」及 addendum C「Agent loop = P3」撞词，而它装的只是问答编排。现在改名牵 6 个引用点，2.2/2.3 再接进来就贵了。
- [x] [Review][Decision] **三条确定性提示在产品路径上不可验收** — 决议：前端不在本 story 管（`/ask` 继续打 `/retrieve`），本条按「不计入 2.1 验收」处理，UI 接线随 2.2 — 文案判定只住 `agent/chat/chat.ts`、经 `/chat` 暴露；而前端 `/ask` 打的是 `/retrieve`（`app/web/src/ui/ask.tsx:111`），后者按设计不含库状态判定。今天只能用 curl 验收。
- [x] [Review][Decision] **全软删后回「尚未添加任何资源」** — 决议 `2)` 改 AC：已在上面「知识库为空」那条写明「为空 = 未软删行为 0，含全部已删除」，不另设第三种话术。代码不动 — 已实测成立（此刻库里 `resources=5` 但 5 行全 `deleted_at IS NOT NULL`、`chunks=0`、`embeddings=0`）：`POST /chat` 返回 `200 {"answer":"尚未添加任何资源",...}`。删过东西的库和从没添过的库长成一句话，AC:189-192 要求区分的正是这两种。修法要么是第三种话术（「资源都已删除」），要么改 AC 承认不必区分。
- [x] [Review][Decision] **命中响应体三处手抄、无单一归属** — 决议 `2)`：挂到「以 SDK 的 `UIMessage` 当 chat 地基」那条决定上，等 2.2 落地时自然消解；登记进 `deferred-work.md` — `routes/retrieve/retrieve.ts:52-66` 与 `routes/chat/chat.ts:53-66` 是逐字段相同的两份映射，前端 `app/web/src/api.ts:57-70` 又手抄第三份。2.2/2.3 动字段时要三处同改。可选解法里包含「随 SDK 的 `UIMessage` 地基自然消解」。

#### patch

- [x] [Review][Patch] `/chat` 的 `limit` 算了不用（`body { query, limit? }` 是它自己头注声明的） [app/server/src/routes/chat/chat.ts:37] — 已修：`Chat.ask(Query, Limit?)` 打通到 `retriever.search`。实测 `limit:1`→1 条、`limit:-3`→回落默认 2 条
- [x] [Review][Patch] `assemble` 在 `try` 之外，文档承诺的 400/409 映射走不到；兄弟路由 `/retrieve` 在 `try` 内，口径不一致 [app/server/src/routes/chat/chat.ts:47] — 已修：移进 try，400/409 映射与 `/retrieve` 同口径
- [x] [Review][Patch] 检索旋钮全硬编码，AC:187「可 env 覆盖，交付须带默认可验证」未实现；`config.ts` 才是本项目唯一 env 层 [app/server/src/bootstrap.ts:69-78] — 已修：五个进 `config.ts`（`RETRIEVAL_VECTOR_TOPK/LEXICAL_TOPK/MIN_SIMILARITY/RRF_K/DEFAULT_LIMIT`），小数走新增 `floatOrThrow`。实测 `RETRIEVAL_DEFAULT_LIMIT=2` 生效、`=1.5` 启动期 `E_CONFIG_INVALID`
- [x] [Review][Patch] `lexicalSearch?` 的注释与现实相反（BM25 已登记且两个路由都硬填），四个策略名在两个路由里重复字面量 [app/server/src/retrive/contracts.ts:34 + routes/retrieve/retrieve.ts:41-44 + routes/chat/chat.ts:40-43] — 已修：注释改为现状；策略名收进 `retrieve/recipes.ts` 的 `RETRIEVER_RECIPE_NAMES`，两条路由展开它（`grep paradedb-vector` 现仅剩注册表一处）
- [x] [Review][Patch] `vectorCount`/`lexicalCount` 是**阈值过滤后**的条数，契约注释没写，判「未找到」的人读不到定义 [app/server/src/retrive/contracts.ts `RetrievalResult`] — 已修：契约注释写明语义与「别用 hits.length」
- [x] [Review][Patch] 装配期那条维度自检两边同出一个 config（恒等式，今天永不触发），而口径文件把它算作「校验分两处」之一；它真实职责只是「注册表被塞进第二个 embedder 时立刻炸」 [app/server/src/retrive/retrivers.ts:41-48] — 已修：注释点明它是恒等式、只抓注册表装配错误，不是 AC:186 的数据校验
- [x] [Review][Patch] 5 个新文件缺行尾换行 [retrive/contracts.ts, retrive/fusion/rrf.ts, retrive/recipes.ts, retrive/retrivers.ts, retrive/search/paradedb-vector.ts] — 已修：9 个新文件全部补上
- [x] [Review][Patch] `minSimilarity` 代码是 0.42，`deferred-work.md` 写的是 ≈0.35 —— 两处真相，需要对齐到 Lynx 实际拍的那个值并注明已被实测顶穿 [app/server/src/bootstrap.ts:76] — 已修：`deferred-work.md` 那句 ≈0.35 改为实际交付的 0.42（Lynx 拍），并注明已被实测顶穿
- [x] [Review][Patch] 流程工件没跟上：`sprint-status.yaml` 仍是 `2-1-…: backlog`、无本 story 的 handoff、`LEARNING.md` 无 2.1 段 [\_Agents/implementation-artifacts/] — 已修：`_Agents/legacy/handoffs/handoff-2026-10-14-epic2-story1-build1-hybrid-retrieval.md` 新建、`LEARNING.md` 增 Story 2.1 段、`sprint-status.yaml` 2-1→done / epic-2→in-progress

#### defer

- [x] [Review][Defer] 本 story 零 Vitest 覆盖：`countResourcesByStatus` 补零语义、RRF 去重与名次分、`E_UNKNOWN_STAGE`、四条 `/chat` 分支、`/retrieve` 的 limit 回落 —— 全部只有 `test/probe-*.ts` 打印脚本，`vitest list` 不收集、无断言 — deferred: 断言守护归 Lynx（D14 未拍），且 `app/server/.gitignore` 含 `test/` 是 2026-10-13 既定维持的现状
- [x] [Review][Defer] 检索未加 `status='ready'` 谓词，靠 `pipeline/pipelines.ts:74` `fail()` 先删 chunks 兜住 —— 跨层隐式不变量 — deferred: 修法是写进 SPINE（AD-3/AD-5），属改 spec
- [x] [Review][Defer] 「两路皆空才兜底拒答」在交付配置下打不到（`match_disjunction` 是 token OR，实测标点问句命中 62/62 chunks）— deferred: AC:187 那句本就要按「拒答交模型」改写，属改 spec

#### rejected（复核后不成立或不值得修）

- `false` 「检索路径无超时、会无限挂着」：`adapters/paradedb.ts:15 query_timeout: 5000` + `pipeline/embed/qwenembed.ts:15 EMBED_TIMEOUT_MS = 30_000` 已封顶（取消信号确实没往检索传，但"挂死"不成立）
- 不计 「`chunks.deleted_at` / `embeddings.deleted_at` 未过滤」：Lynx 2026-10-14 明确拍板「只 `r.deleted_at IS NULL`」
- 不计 「`ai`/`@ai-sdk/openai-compatible` 零使用越范围」：Lynx 本轮指示「装v7」，故意先行
- `low` 「查询向量含 NaN 未校验」：未证明 Ollama 会返非有限值，要修得先造出该响应
- `low` 「`if (!queryVector)` 漏掉空数组」：`qwenembed.ts:44` 已校验 `data.length === Texts.length`，该形态未证明可达
- `low` 「端口层 `Options.limit` 未校验 0/负」：唯二调用方是两条路由，都已在入口校验过
- `low` 「`total` 硬编码三个状态键」：`resource_status` 是库里固定的三值枚举，为假想的第四值加抽象不值
- `low` 「count 与 search 两次往返有竞态」：要并发删除才可见，修法是事务/锁，代价大于收益
- `maybe-false` 「RRF 同一列表内 chunk 重复会被当跨路共识加分」：`SELECT source_id … HAVING count(*)>1` 现在返回 0 组，**但此刻 `embeddings=0`（库被清空过），样本无效** —— 重新入库后跑同一条查询即可定论
