# Handoff · 2026-10-23 · Epic 3 Story 3.4（ingest stages）

## 本次会话做了什么

1. 把 3.3 的 stage runner 抽成通用 `trace/systemtrace/stage.ts`（retrieve / ingest 共用），`StageName` 扩到 10 个。
2. `Ingest.run/batch` 增加可选 `{ sink }`；`POST /resources` 注入 DB sink，写本地 `trace_stages`：
   - `fetch` → `parse` → `chunk` → `embed` → `write`
   - `fetch` 扩展 `Fetched` 带 `final_url/content_type/http_status`；内容入库这些为 null。
3. 入库的 `embedChunks` 显式 `telemetry:{isEnabled:false}`，不再在 Langfuse 产生 embeddings 根 trace。
4. `POST /resources` 建 Resource 后回填 `traces.resource_id`（成功/失败都回填；查重命中 resource:null 不回填）。
5. DB sink 文件从 `trace/kbtrace/stage-sink.ts` 移到 `trace/systemtrace/stage-sink.ts`，retrieve 与 ingest 共用。

## 关键决策

- **通用 runner 住 `trace/systemtrace/stage.ts`**：类型、计时、失败记录、`E_TRACE_WRITE` 吞错都在一处；retrieve/ingest 只提供 stage 名、input/output 形状。
- **sink 仍由 caller 选**：`/resources` 用 DB sink；`Ingest` 默认 no-op（测试/未来批量不传 sink 也不落 stage）。
- **stage 形状**：fetch `{url}`→`{final_url,content_type,content_length,http_status}`；parse `{content_type,content_length}`→`{title,markdown_length}`；chunk `{markdown_length}`→`{chunk_count,total_chars}`；embed `{chunk_count,model_id,dimensions}`→`{embedding_count,dimension}`；write `{chunk_count}`→`{chunk_count}`。
- **失败 stage**：`status=error`、`output={error_code,message}`，后续不写；fetch 失败的错误码目前是通用 `E_STAGE`（fetcher 抛的是普通 Error），端点行仍是 `E_INGEST_FAILED`。
- **resource_id 回填在 handler**：`run` 返回 result 后写 `traces.resource_id`，不在 ingest 内部碰 trace。

## 验证

- `tsc --noEmit` 0 错；后端 9 文件 / 31 条全过；前端 423 条全过（3.4 未改前端）。
- 内容入库：5 行 stage，fetch 为 null URL、parse title/length、chunk/embed/write 形状正确；`resource_id` 已回填。
- URL 入库（example.com）：fetch 输出 `final_url=https://example.com/`、`http_status=200`、`content_type=text/html; charset=utf-8`、`content_length=577`。
- fetch 失败（`http://127.0.0.1:9/`）：只写 1 行 fetch stage，`status=error`、`output={error_code:'E_STAGE',message:'fetch failed'}`；端点 `status=error`、`E_INGEST_FAILED`；`resource_id` 已回填。
- Langfuse 时间窗内 embeddings 根 observation = 0。

## 未决 / 注意

- 前端阶段面板是 3.3 加的，3.4 自动显示 ingest 五段；未做浏览器手测。
- stage 失败码目前通用 `E_STAGE`，如果要区分 `E_FETCH`/`E_PARSE` 等，需要 fetcher/parser 自己带 code。
- `Ingest.batch` 支持传 sink，但当前没有调用方传；批量入库若以后要 trace，需要一条 trace 对应一条资源（目前 endpoint shell 只覆盖 POST /resources 单条）。
- 3.4 改动未提交。

## 涉及文件

- `src/ingest/ingest.ts`、`src/ingest/contracts.ts`、`src/ingest/fetch/{http-fetcher,passthrough}.ts`
- `src/adapter/model/embed-chunks.ts`
- `src/adapter/repo/trace.ts`（`setTraceResource`）、`src/adapter/contract.ts`
- `src/routes/resources.ts`
- `src/trace/systemtrace/stage.ts`、`src/trace/systemtrace/stage-sink.ts`
- `src/retrieve/retrievers.ts`、`src/retrieve/contracts.ts`（改用通用 runner/type）
- `src/trace/llmtrace/{bridge,langfuse}.ts`（StageSink 路径）

## 下一步

Epic 3 四格都已实现；建议收口：提交 3.2/3.3/3.4，跑一遍 Epic 3 三镜头 review（尤其 stage 错误路径、前端阶段面板、未提交面），再决定 3.x retrospective。
