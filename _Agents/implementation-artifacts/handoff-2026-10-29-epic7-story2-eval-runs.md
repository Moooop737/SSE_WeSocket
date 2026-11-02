# Handoff · 2026-10-29 · Epic 7 / Story 7.2 发起检索评测

## 本次会话做了什么

1. 收口 `OQ-7.2-5..10`（结果存 jsonb、参数走覆盖位、删除只后端、case 间中止、case 错误不杀 run、metric 只冻结）并写回 `epics.md`；sprint 7.2 进 `in-progress`。
2. 迁移：`eval_runs` 加 8 列（配置指针 / snapshot / results / 时间线 / 错误）；两库均 18 applied。
3. 后端：`repo/eval-run.ts`、`EvalRunner`、`metrics.ts`、`snapshot.ts`、检索 `SearchOptions` 覆盖位、`/eval/runs` 五端点、启动清扫。
4. 前端：`/evals` 换真数据（列表/逐条/聚合/发起/轮询/取消/详情/快照/另存），删除 mock store/demo/types。
5. 真跑：完整 run、取消、重启清扫、删除守卫；走读页 `epic7-story2-eval-runs.html`；index 23 页；sprint 7.2 → `review`。

## 关键决策

- **结果存 `eval_runs.results` jsonb**（Lynx 拍板，否掉 `eval_run_cases` 明细表）：读法永远是整份 run；15 条规模下 SQL 聚合/join 无收益；删 run 就是删一行。代价是跨 run 趋势/筛选会难受——属未排期。
- **每 run 参数走 `SearchOptions` 覆盖位**，仍是一只 `RetrieverHandle.retriever`：`k` = 融合条数（limit）、`vector_top_k / lexical_top_k`、`min_similarity`、`rrf`。`/retrieve` 不传保持原行为。
- **单队列、进程内、不持久化**：一次一个；queued 可取消，running 在 case 之间中止；重启由启动清扫把 queued/running 标 cancelled（`I_EVAL_RUN_CLEANUP`）。
- **case 级错误不杀整批**：该行 error + 0 分，run 继续；只有快照参数不合法或执行器异常才 failed。
- **metric 配置只冻结不执行**：7.2 只算 recall/MRR；judge 属 7.4；model / temperature 只记录。
- **运行删除只做后端**（Lynx 拍板）：`DELETE /eval/runs/:id`，运行中 409「先中止」，删行事务清 `baseline_run_id`；UI 入口留 7.3。
- **负例需 `hit_count`**：结果里加了原始命中数，页面负例显示「命中 N」。

## as-built

### B1 · 迁移与 run repo

- `db/migrations/20261029120000_add_eval_run_execution.sql`：`run_config_id / metric_config_id`（FK SET NULL）、`snapshot` / `results` jsonb、`started_at / ended_at / duration_ms / error_reason`；snapshot 对象、results 数组、耗时非负三条 CHECK。
- `src/adapter/repo/eval-run.ts`：`createRun / getRun / listRuns / appendRunResult / startRun / finishRun / cancelQueuedRun / markInterruptedRuns / deleteRun / getChunkByDataUri`；`Repo` 段与 `PostgresRepo` 委托。
- `index.ts`：启动清扫中断 run，评测库不可达只 warn。

### B2 · 检索参数化 + runner

- `contracts.ts`：`SearchOptions` 加四个覆盖位；向量 searcher 的阈值、RRF 的 k 改成按调用传入。
- `src/eval/metrics.ts`：`scoreCase` / `summarizeResults` 纯函数。
- `src/eval/runner.ts`：`enqueue` 返回完成 promise；`cancel` 返回 queued/running/missing；逐条追加；gold 前缀校验；case 错误记行。

### B3 · API

- `src/eval/snapshot.ts`：六块字段一次冻结。
- `EvalAssembly.embedding` 暴露；`ResourceCounts` 经 contract 交出。
- `/eval/runs`：POST（校验 + 快照 + 入队）、GET 列表（summary、无 results/snapshot）、GET 详情（run + summary）、POST cancel（200/202/409）、DELETE（运行中 409）。

### B4 · 前端运行页

- client：`EvalRun*` 类型 + `createEvalRun / listEvalRuns / fetchEvalRun / cancelEvalRun`。
- `evals-page.tsx`：基础数据三路、列表/详情重拉、1.5s 轮询、发起/取消、逐条结果、右栏详情/对照空态/快照 + 两路另存；删除 mock store/demo/types 与「演示数据」标识。

## 验证（真跑）

- 迁移：主库与 `ragdb_eval` 均 18 applied；两库 `eval_runs` 12 列一致。
- 完整 run（隔离模式，`probe-2026-10-28` 15 条）：done / 15 results / recall **75.56%** / MRR **53.45%** / failed **3** / 逐条耗时合计 17.27s / 墙钟 18.19s；负例 L5-01/02/03 各命中 8 条；missing_gold 0。
- 取消：运行中 POST cancel → **202**，最终 cancelled，results=1，reason 已中止。
- 重启清扫：跑一半杀进程 → 重启日志 `I_EVAL_RUN_CLEANUP … 1`，run = cancelled / 进程重启，results=2。
- 删除守卫：有 run 删数据集 → 409 `E_EVAL_DATASET_HAS_RUNS runs=1`；删 run 204；再删数据集 204。
- 测试：后端 **28 文件 / 154 tests**；前端 **85 文件 / 723 tests**；`tsc` 0；`build` 绿。
- 走读页：`epic7-story2-eval-runs.html`，validate `sections=16 / code=12 / notes=30 / journeys=4 / style=1/1`；index 23 页。
- 评测库现留：`probe-2026-10-28`、用户自建配置 `qwen3-8b` / `retrive`、以及一条用户自己发起并跑完的 run（未动）。

## 偏离 / 注意

1. **`hit_count` 是 B4 补的字段**：AC 要求负例展示命中数，原结果只有 gold 匹配数；后端与前端同步加了该字段。
2. **运行删除没有 UI**：按 Lynx 拍板只做后端；7.1 的「先删 N 次运行」目前需 curl，入口留 7.3。
3. **配置删除不再阻塞 run**：配置删除后 `run_config_id` 置空，历史 run 靠 snapshot 展示；原 7.1 deferred「配置删除保护」实际以 snapshot 方案解决。
4. **中途远端库超时一次**：测试一度 3 条失败，恢复后重跑全绿；不是代码问题。
5. **另一个会话在改前端其它页面**：`ask.tsx` / `repo-guard` 曾短暂红，收口前已恢复。

## 风险 / 待确认

- 浏览器视觉未验（按 AGENTS 归 Lynx）：轮询刷新、取消按钮、右栏三 tab、另存两路、窄屏。
- 运行级 failed 只有单测覆盖（case 错误不杀 run；执行器异常才 failed），未做真断库演练。
- 同数据集并发点「运行」会排队；未做长时间压测。
- 结果存 jsonb 的跨 run 查询代价未评估（趋势/筛选未排期）。

## 文档入口

- 规格：`_Agents/planning-artifacts/epics.md` › Story 7.2（含 as-built）
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`（7.2 = review）
- 走读页：`_Agents/walkthroughs/epic7-story2-eval-runs.html`
- 前端总结：`app/web/Agent/summary/summary-2026-10-29-eval-runs-real.md`
