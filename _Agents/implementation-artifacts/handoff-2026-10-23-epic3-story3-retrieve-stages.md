# Handoff · 2026-10-23 · Epic 3 Story 3.3（retrieve stages）

## 本次会话做了什么

1. `Retriever.search` 拆成 5 个 stage：`dimension_check → embed_query → vector_recall → bm25_recall → rrf_fusion`，每段交给 caller 传入的 `StageSink`。
2. `/retrieve` 注入 DB sink：5 行写入本地 `trace_stages`，`embedMany` 显式 `telemetry:{isEnabled:false}`。
3. chat 的 retrieve 工具注入 Langfuse sink：5 个 stage 成为 `retrieve` TOOL span 下的 child spans，`embedMany` 保持 telemetry on；本地 `trace_stages` 0 行。
4. `/traces/:id` 从 hono-crud read 改为自定义读，返回 `{ trace, stages }`；前端 `/traces` 抽屉显示阶段。
5. 补了 OTel context manager：只注册 TracerProvider 不够，没有 `AsyncLocalStorageContextManager` 时 tool span 不是 active context，stage spans 会被导成独立根 trace。

## 关键决策

- **sink 由 caller 选**：factory 只组装，不判断落点；`/retrieve` 用 DB，chat tool 用 Langfuse。
- **telemetry 跟 sink 同选**：DB sink → off；Langfuse sink → on。默认 no-op sink 也 off，避免全局 integration 顺手记走。
- **stage 只存元数据**：input/output 是 query/URL/ids/计数/分数，不写 chunk 正文、不写向量；`vector_hash` 是 16 位 sha256 前缀。
- **失败 stage**：`output={error_code,message}`、`status=error`，后续 stage 不跑；行也写入 DB/Langfuse。
- **`/traces/:id`**：移除 traces 的 CRUD `read`，自定义 `TracesRoute` 读 `getTrace + listTraceStages`；列表 CRUD 保留。
- **前端**：`fetchTrace` 返回 `{Trace, Stages}`；阶段面板只在详情里显示，列表不拉 stages。

## 验证

- `tsc --noEmit` 0 错；后端 9 文件 / 31 条全过；前端 423 条全过。
- `/retrieve`：5 行 stage，名称/input/output 形状与 AC 一致；`GET /traces/:id` 返回 `{trace, stages}`。
- chat：本地 `trace_stages` 0 行；Langfuse 树 13 个节点：`invoke_agent` → step → generation/tool；`retrieve` 下 5 个 stage + embed 子 span。
- `/traces?per_page=1` 200、`/traces/:id` 404 正常、`/trace-stages` 404、OpenAPI `/traces/{id}` 有 GET 且 `TraceStage` schema 存在。

## 未决 / 注意

- stage 抛错的真实路径（如 `E_DIMENSION_MISMATCH`）没有真跑；代码会写 `status=error` 并停止后续 stage。
- 前端阶段面板未做浏览器手测（按约定由 Lynx 手测）。
- `@opentelemetry/context-async-hooks` 是新增直接依赖（2.12.0）。
- 前端 Langfuse 外链、`toolCallId` 展示还没做；`/chats` 仍只显示观测树。
- 旧的无 context manager 时期产生的 stage 根 trace 留在 Langfuse，新 trace 才是正确的。
- 本会话改动未提交（内层 `app/server` 与 `app/web`）。

## 涉及文件

- 后端：`src/retrieve/contracts.ts`、`src/retrieve/retrievers.ts`、`src/adapter/repo/trace.ts`、`src/adapter/contract.ts`、`src/routes/retrieve.ts`、`src/routes/traces.ts`、`src/index.ts`、`src/routes/crud.ts`、`src/routes/doc.ts`、`src/agent/tool/tools/retrieve.ts`、`src/trace/llmtrace/{langfuse,bridge}.ts`、`src/trace/kbtrace/stage-sink.ts`
- 前端：`src/api/client.ts`、`src/routes/traces.tsx`、`src/api/client.traces.test.ts`
- 依赖：`@opentelemetry/context-async-hooks@2.12.0`

## 下一步

Story 3.4：ingest 的 `fetch/parse/chunk/embed/write` 复用 `trace_stages`；`POST /resources` 创建 Resource 后回填 `traces.resource_id`；ingest 的 `embedMany` 同样 `telemetry:{isEnabled:false}`。
