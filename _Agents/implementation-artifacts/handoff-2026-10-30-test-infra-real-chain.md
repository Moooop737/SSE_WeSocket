# Handoff · 2026-10-30 · 测试真链路化（全仓 mock 清算）

## 本次会话做了什么

1. 盘点全仓测试：web 89 文件 / 747 用例，server 31 文件 / 168 用例；真正 mock 链路的只有 26 个前端文件 + 5 个后端文件 + 4 处假依赖注入，其余已是真库/真 MinIO/真 Ollama/真 LLM 或纯逻辑。
2. 按 Lynx 拍板（真链路形态「两者都要」；真后端造不出的错误路径「保留构造输入」）分层改造：
   - **后端 6 个文件改真**：`embed-batching`、`retrieve-chain`、`health-chain`、`eval-answer-runner`、`read`（新增真 Langfuse）、`eval-route`（真 repo + 真检索 + 真 traces 表）。
   - **前端流程测试 5 个文件改真**：`client.resource-flow`、`client.resources`、`run-observability`、`upload-queue`、`routes/codebases`。
   - **新增 Playwright E2E**：真浏览器 → preview（4175）→ 真后端（3102）→ 真库/MinIO/Ollama/LLM；覆盖 `/ask` 真对话、`/ingest` 文字入库、`/traces` 观测。
3. 修了三个只在真链路下才暴露的环境/产品事实：
   - jsdom 的 `File` 不是 undici 的 `Blob`，`fetch(body: File)` 会把它转成字符串 `[object File]`（13 字节），直传 MinIO 的字节与本地 sha256 对不上；测试环境统一换成 Node 的 `File`。
   - `tsx` CLI 会 fork 子进程，只杀父进程会把 node 留在 3101；globalSetup 改 `detached` + 进程组收，teardown 以端口释放为准，并能自愈清理上次残留。
   - `test/load-env.ts` 不剥引号，`LANGFUSE_BASE_URL="https://..."` 带着引号进 `process.env`，真打 Langfuse 时 `new URL` 直接抛。

## 关键决策（会话中拍板 / 实施中定下）

- **真链路形态**：jsdom 流程测试 + 真后端进程，另加 Playwright E2E；纯 UI/逻辑测试留在 jsdom，E2E 走用户主路径。
- **错误路径保留构造**：真实后端不会返回坏 JSON / 缺分页 / 401 / 429 / 断网；这类仍用构造响应，标注为「边界输入」，不算模拟后端。
- **共享真库 → 文件级串行**：web `fileParallelism: false`（与 server 同因）；并行会互相压住（`/traces` 5s 超时、ingest 抢 Ollama）。
- **编排夹具保留**：`eval-runner`（慢检索/抛错/排队取消）、`eval-runs-route`（假执行器）、`eval-crud-route`（trace 空操作）、`use-health`（并发/5s 超时）、`chat.test` / `client.*`（解析/坏响应）保留；真实链路已由 `retrieve-chain`、`eval-route`、`eval-answer-runner`、`eval-repo` / `eval-run-repo` 覆盖。
- **答案评测模型**：answer 用 `silicon-flow:Qwen/Qwen3-8B`，judge 用 `deepseek:deepseek-v4-pro`；不把 v4-flash 当回答模型。8B 在「库里没有明确答案」的问题上第二步会把 `<tool_call>` 写进 reasoning（`Result.text` 为空），测试 query 必须选库里有答案的。
- **URL 归档断言放宽**：后端会加 `archive_test=<uuid>` query 防缓存，`source` 不能按精确字符串断言。

## as-built（按步）

### 1 · 测试基础设施（web）

- `test/global-setup.ts`（新）：`PORT=3101` 起真后端；启动前清理同端口的测试后端（只清理命令行含 `src/index.ts` 的进程，其他进程报错）；`detached` 进程组 + SIGTERM→SIGKILL；轮询 `/health` 就绪。
- `vitest.config.ts`：挂 `globalSetup`，加 `fileParallelism: false`。
- `test/setup.ts`：`/api/*` 改写到 `http://127.0.0.1:3101/*`（补 vite proxy 的角色，非 mock）；全局 `File` 换成 Node `File`。
- `vite.config.ts`：加 `preview.proxy`（target 由 `E2E_BACKEND` 指定，默认 3000）。
- `package.json`：加 `yazl` + `@types/yazl`（测试专用 ZIP 夹具）、`e2e` / `e2e:ui` 脚本。
- `.gitignore`：加 `e2e/.report/`、`e2e/.artifacts/`。

### 2 · 后端 6 个文件

- `embed-batching`：去掉 `vi.mock('ai')`，真 Ollama + 只计数不改响应的本地代理；验证 32/32/6、串行、70×1024 维、空入参 0 请求、abort 真中断。
- `retrieve-chain`：599 假响应换成真转发计数；空查询/混维各 0 次 embedding。
- `health-chain`：④ 拆真（真 `/api/tags`）+ 构造（同前缀别家）；MinIO down 用真 S3 客户端打 `127.0.0.1:1`（ECONNREFUSED）。
- `eval-answer-runner`：真库 + 真检索 + 真模型；断言改结构与硬门（不存在的 token），query 用「P1 的 Non-Goals 有哪些？」。
- `read`：新增真 Langfuse（不存在 traceId → 200 空列表）；401/429/坏形状保留构造。
- `eval-route`：真 `PostgresRepo` + 真 `RetrieverHandle`，用真 `traces` 表断言 `/status` 不落 trace、`/retrieve` 落一条 ok、坏 body 落一条 400 error。
- `load-env.ts`：值与 `node --env-file` 对齐，剥掉两端引号。

### 3 · 前端流程测试 5 个文件

- `client.resource-flow`：真文字/URL/文件建行 → 真 PUT MinIO → confirm → ingest → 软删 → restore → purge；签名改坏真拿 403。
- `client.resources`：真库搜索/状态/排序/分页、计数、回收站、purge 409→204；坏行/缺分页保留构造。
- `run-observability`：先真发一次检索造 trace，再走列表→详情→切段→取消；详情失败/列表刷新失败保留构造。
- `upload-queue`：9 条真流水线（文字/文件/文件夹/资源条目/同批同内容/库里已有/软删命中/重复提交）；「提交中逐项结算」保留闸门桩。
- `routes/codebases`：`yazl` 生成真 ZIP → 真归档/解压 → 真树与单文件预览 → 真删除；HTML 预览断言 `<script>` 不执行。

### 4 · Playwright E2E

- `playwright.e2e.config.ts`：webServer 两个（后端 3102、preview 4175）；`E2E_BACKEND` 注入 preview proxy。
- `e2e/ask.spec.ts`：`/ask` 提问 → 停止生成出现/消失 → 回答含 `Non-Goals`。
- `e2e/ingest.spec.ts`：上传面板 → 加入队列 → 展开胶囊 → 开始入库 → 通知「提交完成」→ 资源页搜索可见。
- `e2e/traces.spec.ts`：端点观测列表 → 打开一条 → 载荷详情。

## 验证

- 后端 `npm test`：**31 文件 / 177 用例全绿**，338s（原 30/170，219s；增量来自真 LLM 121s）。
- 前端 `npm test`：**90 文件 / 758 用例全绿**，144s。
- E2E `npm run e2e`：**6/6 绿**，1.6m（ask 21.6s / codebases 5.3s / evals-run 4.2s / evals-cases 2.1s / ingest 3.9s / traces 0.9s）。
- `tsc --noEmit`：server 0 错；web 0 错。
- 跑完 3101/3102/4175 均无残留监听。

## 保留项与理由

| 文件 | 保留什么 | 理由 |
|---|---|---|
| `eval-runner` | 假检索 | 慢检索/抛错/排队取消/串行是编排的可控时序；真检索由 `retrieve-chain`、`eval-route`、`eval-answer-runner` 覆盖 |
| `eval-runs-route` | 假执行器 | 冻快照/列表/取消/删除/基线路由行为，真执行器会引入无关 LLM/队列副作用 |
| `eval-crud-route` | trace 空操作 | 观测副作用隔离，不是链路模拟 |
| `use-health` | 挂起 fetch + fake timers | 并发去重与 5s 超时是边界输入 |
| `chat.test` / `client.*` | 构造响应 | 解析/错误映射的被测对象就是坏响应 |
| `evals/cases-view`、`configs-view`、`evals-page`、`chat-observatory` | 组件数据夹具 | 真实链路（真 CRUD / 真 Langfuse）留给 E2E 或后续扩展 |

## 测试数据清场（2026-10-30 追加）

- 写入真库的测试数据全部带窄前缀；Vitest `test/global-setup.ts` teardown、Playwright `e2e/fixtures.ts`（每条用例后）、`e2e/global-teardown.ts`（整轮收尾）统一调 `app/server/scripts/cleanup-test-data.ts` 物理删除。
- 删除范围：前缀资源/代码库/评测（含 MinIO 对象）、测试窗口（`--since`）写入的端点 trace、测试新建 session（messages 级联）与测试期间的消息。
- 为什么用 SQL 物理删：hono-crud 的 `DELETE /sessions/:id` 是软删（`deleted_at`），行和 messages 会留下；清场脚本直连库硬删。
- 边界：测试后端与 dev 共库；测试结束后本机页面的请求（trace）不删；测试窗口内用户同时操作无法区分，会被一并清掉。
- 顺带修了四个真问题：`launch` 的 `useCallback` 缺 `runMode`、评测发起抽屉的 datasetId 被详情轮询覆盖（`launchOpen` 时跳过同步）、E2E `/ask` 复用用户旧会话（改为先点「新会话」）、`answerCase` 加 120s 上限避免 8B 悬停把 run 永久卡在 running。

## 遗留 / 下一步

- E2E 已覆盖 `ask` / `ingest` / `traces` / `codebases` / `evals-cases` / `evals-run`（答案 run 用 `silicon-flow:Qwen/Qwen3-8B`）；人判与基线对照 UI 仍未进 E2E。
- 真库/MinIO 的本轮测试数据已用一次性脚本清理：23 个资源、18 个代码库、41 个 MinIO 对象、0 个评测集/配置（评测测试自己的 `afterAll` 已先清干净）。
- 真链路套件依赖 Tailscale 真库/MinIO/Ollama/LLM/Langfuse，离线不可跑；真 LLM 用例受上游波动影响。
- `eval-runner` / `eval-runs-route` 若以后要全真，需要给检索换成真 handle 并接受不可控时序。
