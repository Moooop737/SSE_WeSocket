# Epic 3 code review — 2026-10-24

> **范围**：Story 3.2 / 3.3 / 3.4。3.1 已 `done`，不重审。
> **Diff**：`app/server` 的 3.2 提交（`a2ebf92`）+ 3.3/3.4 未提交改动 + 新增 `traces.ts` / `stage*.ts`；`app/web` 的 `/traces`、`/chats`、`run-observability`、`lib/traces|stage-timeline|langfuse`、`client.ts` traces 段及测试。合并 diff 6,103 行。
> **方法**：4 镜头（blind-hunter / edge-case-hunter / verification-gap / acceptance-auditor）；spec 取 `epics.md` 的 3.2–3.4 AC；claims 取三份 handoff。
> **处置**：按 Lynx 2026-10-24「直接收，仅做个 review」：**不改代码**，findings 记录在此，Epic 3 按已知问题收口。

## 一、结论

- **主干成立**：chat 交 Langfuse + 本地公共行回填、`/retrieve` 5 段 DB stage、ingest 5 段 DB stage、`GET /traces/:id → {trace, stages}` 都在代码里落地；`tsc` 两侧 0 错，后端 31/31、前端新增 29 条测试通过。
- **不能说完美**：3 条范围/口径问题需要你拍板；20 条代码/契约/前端问题未修；7 条验证缺口（测试不覆盖核心链路）仍在。
- **收口方式**：不修，全部记入 `deferred-work.md` 的 Epic 3 review 段；3.2/3.3/3.4 与 Epic 3 标 `done`，并在 sprint 注释里写明「已知问题收口」。

## 二、需要你拍板（decision-needed）

| # | 问题 | 证据 | 选项 |
|---|---|---|---|
| D1 | **产品内观测面板与 Epic 3 原文冲突**：原文写「不做产品内观测面板」，as-built 已有 `/traces`、`/chats`、`run-observability` 四项 | `epics.md` Epic 3 范围说明；`routes/observability.ts`；`app/web/src/routes/{traces,chats}.tsx` | ① 承认它是 Epic 3 的交付，改范围说明；② 拆成独立前端项，Epic 3 只保留 API |
| D2 | **`trace/kbtrace/` 从未存在**：Epic 写三只空盒，实际只有 `llmtrace/`、`systemtrace/`；3.3 的 stage runner/sink 落在 `systemtrace/` | `find app/server/src/trace`；3.4 handoff | ① 把范围说明改成「systemtrace + llmtrace，kbtrace 合并进 systemtrace」；② 补建 `kbtrace/` 目录（不推荐，纯改名） |
| D3 | **同一份 diff 夹带 P2 产品面**：`GET /resources/stats`、chunks 分页+内容搜索、资源浏览页消费方 | `routes/resources.ts:55`、`adapter/repo/chunk.ts`、`use-resource-browser.ts` | ① 单独记一笔「非 Epic 3 的夹带」，归 P2/资源页；② 拆出独立 story 再收口 |

> 建议：D1 选①（东西已经建好，改说明最省）；D2 选①（只是文档口径）；D3 选①（不阻塞 Epic 3，但别让它悄悄混进验收）。

## 三、已核实、未修的代码问题

> 都在当前代码里复现；按「影响面」分组，不代表修复顺序。

### 观测保真度

1. **`dimension_check` 的 DB 查询在 stage 之外**（`retrieve/retrievers.ts:60`）：`dimensionsInStore()` 先执行，`runStage('dimension_check')` 只包住数组比较。后果：这段 ~56ms 的查询不计入 stage 耗时；库不可达时连一行 `dimension_check` 都写不下。
2. **`resource_id` 回填晚于入库完成**（`routes/resources.ts:196-202`）：`await run(...)` 全部结束后才 `setTraceResource`。运行中的 trace 与中途被杀的资源，`resource_id` 一直是 null，`/traces?resource_id=` 关联不上。
3. **stage 的 `started_at/ended_at` 前端有、后端没有**（`app/web/src/api/client.ts:183-184`、`lib/stage-timeline.ts:37`）：`listTraceStages` 只选 `created_at,duration_ms`，显式时间分支是死代码；瀑布图只能用 `created_at - duration_ms` 近似。
4. **running trace 没有启动清扫**（`config.ts:65` 只清 resources/维度）：进程崩溃或 `onEnd` 未触发时，`running` 行永久保留；前端 `/chats` 会一直把它当「进行中」并轮询。
5. **取消被记成 stage 失败**（`ingest/ingest.ts:94-106` + `systemtrace/stage.ts` catch）：用户点取消，fetch 的 AbortError 写 `status='error'`、`error_code='E_STAGE'`，与真故障在界面上无法区分；端点行却是 `E_CANCELLED/422`。

### 生命周期 / 写侧

6. **`finishTrace` 的 `payloads = $9` 没有 COALESCE**（`adapter/repo/trace.ts:91-107`）：chat 的 `onEnd` 固定传 `payloads:null`，会覆盖端点壳可能已写的 payloads。chat 本身不记 payloads，所以当前无实际损失；但这是一条「后写者无条件覆盖」的隐患。
7. **Langfuse 的 `Chats`/`TraceIds` 两个 Map 只在 `takeChatTraceId` 命中时清理**（`trace/llmtrace/langfuse.ts:31-32,58-62`）：根 span 没抓到或 `onEnd` 没跑到时，条目留到进程结束。
8. **`traces` 表仍开放 hono-crud 的 create/update/delete**（`routes/crud.ts:102-104`）：3.3 只移除了 read；任何人都能伪造/删除观测行。

### 契约 / 文档

9. **`trace_stage_id` 已改名为 `id`**（迁移 `20261022114648_rename_primary_keys_to_id.sql`），但 `epics.md` 3.3/3.4 的列清单还写 `trace_stage_id`。
10. **`/resources/stats` 没进 OpenAPI**（`routes/resources.ts:55` 注册，`routes/doc.ts` 的 `CustomPaths` 没有它）；同时 `doc.ts` 声明 OpenAPI 3.1，却仍在用 3.0 的 `nullable`（`doc.ts:53-60`）。
11. **`GET /resources/not-a-uuid` 回归 500**：hono-crud read 直接打 PG，旧自定义路由是 400 `E_BAD_ID`；handoff 3.2 已记，仍未修。
12. **前端 `/traces` 文件头与实现相反**（`app/web/src/routes/traces.tsx:5` 写「阶段表目前没有 HTTP 读侧（3.3 再开）」，实际已在渲染 `TraceStagesPanel`）。
13. **query vector 的 hash 算两次**（`retrieve/retrievers.ts:94,96`）：1024 维 JSON.stringify + sha256 每请求重复一次。
14. **`buildObservationTree` 没有环保护**（`app/web/src/lib/langfuse.ts:38`）：`parentObservationId` 是外部数据，A→B→A 会栈溢出。
15. **`read.ts` 没有 Dropped 计数**：`normalizeObservation` 返回 null 的行被静默丢弃；有数据但部分失败时页面不提示，token/费用汇总会少算。
16. **软删会话的标题在列表与详情不一致**：`listChatTraces` 的 join 带 `s.deleted_at IS NULL`，`getChatTrace` 不带；同一 trace 在列表里标题为空、详情里有标题。
17. **分页没有稳定次级排序**：`ORDER BY started_at DESC` / `ORDER BY created_at ASC` 都没有 `, id`；同毫秒记录翻页可能重复/漏。
18. **Langfuse 读超时有三个数字**：`read.ts` 每页 8s + 整体 12s，前端 `client.ts` 15s；用户看到的报错时间取决于最长的那层。

### 前端行为

19. **`run-observability` 的静默失败会亮红条**：catch 里没有区分 `Silent`，与 `/traces`、`/chats` 的「静默失败不亮红条」口径不一致。`goPage` 也没有像另外两页那样做旧页回包作废。
20. **`toolCallId` 后端取了、前端没用**：`read.ts` 从 metadata 取 `toolCallId` 并注释「给前端对 tool part」，`client.ts` 的 `LangfuseObservation` 没有这个字段。

## 四、验证缺口（测试没覆盖核心链路）

> verification-gap 层已逐条查过测试与调用方，以下不是「建议补测试」，是「今天删掉这些代码测试仍然全绿」。

1. **chat 收口**：`finishTrace` / `setTraceSession` / `langfuse_trace_id` / `cancelled` 分支零测试；`chat-tool-flow.test.ts` 直接构造 `ChatRoute`，不走端点壳，`currentTraceId()` 为 undefined，收口块整体跳过。
2. **stage 行**：`insertTraceStage` / `listTraceStages` / `TracesRoute` 零测试；`retrieve-chain.test.ts` 与 `ingest-factory.test.ts` 都不经过 DB sink（`currentTraceId()` 为 undefined / 用 NoopStageSink）。
3. **端点壳**：`createEndpointTrace` 的 route 记录、跳过前缀、未匹配路径零测试；把 `.find(R => R.method !== 'ALL')` 改回 `matchedRoutes(c)[0]`，整套测试仍绿，但所有 trace 行都不会写。
4. **按 route / session 过滤**：前端只断言 URL 参数，后端没有 `?route=` / `?session_id=` 的返回行断言；删掉 `filtering.fields` 里的 `route`，测试仍绿。
5. **chunks 搜索与越界页**：`Search !== ''` 分支与 `SafePage` 重查零测试；把 `strpos` 换成 `ILIKE`，搜索 `%` 会返回全库。
6. **`/resources/stats`**：没有测试按 shipped 顺序挂载 `ResourcesRoute` + `registerAllCrud`；把顺序换回去，`/resources/stats` 运行期 500，测试仍绿。
7. **Langfuse 写侧**：`setupLangfuse` / `ChatSpanProcessor` / `beginChat` / `takeChatTraceId` 零测试；改错根 span 匹配键，所有 chat 抽屉 409，测试仍绿。

## 五、认定为不成立 / 不采纳

- **「`finishTrace` 会把 payloads 抹掉」**：代码确实无条件写 `payloads=$9`，但 chat 的 `onEnd` 固定传 null，且 chat 本身不记 payloads；没有实际损失。留作隐患，不单列。
- **「端点壳的 `find` 会让所有 trace 不写」**：当前路由集下它工作；这是「将来有人把自定义路由注册在 CRUD 之后」的脆弱性，不是今天的缺陷。
- **「`DELETE /sessions/:id` 是硬删」**：`sessions.deleted_at` 存在，hono-crud 按 softDelete 配置处理；不成立。
- **「`/traces?limit` 静默返回 50 条」**：列表走 `page/per_page`，不是 `limit`；已在本轮文档修正。

## 六、收口结论

- **代码不改**：以上均为「已知问题」，不是「已修」。
- **状态**：3.2/3.3/3.4 → `done`；Epic 3 → `done`；`epic-3-retrospective` 保持 `optional`（本轮不跑，Lynx 已决定跳过）。
- **去向**：可执行项进 `deferred-work.md` 的「Deferred from: Epic 3 code review (2026-10-24)」；范围项（D1/D2/D3）进同节，等下次开工前拍。
- **未提交面**：3.3/3.4 的 server 26 个改动、web 相关新文件仍未提交，由 Lynx 决定提交批次；本 review 不改工作区。
