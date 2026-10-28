# Handoff · 2026-10-28 · Epic 7 / Story 7.0 评测连接（默认主库，可选隔离库）

## 本次会话做了什么

1. **核对 sprint**：Epic 1/2/3/5 done；Epic 4 backlog（4.1 暂缓）；Epic 7 backlog，五格 7.0–7.4；下一格 = 7.0。
2. **收口 OQ-7.0-1..3**；7.0 从 `backlog` 进 `ready-for-dev`。
3. **口径纠正（Lynx 2026-10-28）**：评测**默认就跑主库**，`EVAL_DATABASE_URL` 是可选开关；设了才切独立评测库。不是“没配就整体不可用”。Story 7.0 的 AC 已按此重写。
4. **回写**：`epics.md`（Story 7.0 重命名 + AC 重写 + OQ 结论 + 开工清单 + Epic 7 未决汇总 + P2 的 eval 载体口径）、`sprint-status.yaml`（7.0 = ready-for-dev）、`deferred-work.md` 索引头。
5. **核对底座事实**（只读实测）：
   - 主库 `ragdb` 在 100.111.110.60:5432；目前没有 `ragdb_eval`；dbmate 2.36 本地可用。
   - dbmate 的环境变量 **优先于** `.env`（用假 URL 实测），连接串可以只走 env、不进 argv。
   - Hono 子应用 `app.route('/eval', sub)` 的 `matchedRoutes` 返回全路径模板（`/eval/resources/:id/ingest`），route 前缀可当 trace 标记。
   - `GET /traces` 的 hono-crud 已支持按 `route` 过滤（`filtering.fields` 含 `route`），共享模式下评测 trace 可按 `/eval` 前缀筛掉。
   - 现有装配：单 `DbHandle` + `PostgresRepo` + @singleton 服务；`RetrieveRoute` 可手工 new。
   - **未提交改动**：`src/trace/systemtrace/endpoint.ts` 的 `SKIP_PREFIXES` 多了 `/resources`，与 Story 3.4 的 ingest trace 口径冲突；7.0 只加 `/eval`，不动这条，去留等 Lynx 定。

## 关键决策（as-built 前的拍板）

- **模式（Lynx 原话“这个东西也可以运行在主库上，但是给用户一个选择可以分个库”）**：
  - 不设 `EVAL_DATABASE_URL` = **共享模式**：评测世界直接用主库的 pool/repo/服务，同一份语料；零配置可用。
  - 设了 = **隔离模式**：评测世界用第二个 pgpool 连 `ragdb_eval`；语料/实验不碰主库。
  - 选择放 env（启动时定），不做 UI 热切换。
- **OQ-7.0-1 · 建库（只隔离模式）**：库名 `ragdb_eval`；`scripts/eval-db-setup.ts` + `npm run eval:db:setup` 一键建库并跑同一套 dbmate 迁移（`--no-dump-schema`）；连接串只走 env。
- **OQ-7.0-2 · trace 标记**：两库同构（同一套迁移、同一套 traces 行为）；评测 trace 写**评测世界选中的那个库**，标记沿用 route 前缀（`METHOD /eval/...` 或 `EVAL ...`），**不加 `origin` 列**。主库端点壳跳过 `/eval*`，评测子应用自带一层 `createEndpointTrace(选中库的 repo)`。
- **OQ-7.0-3 · 语料**：隔离模式允许两库各一份，**对象也复制成新 key**（不共享主库对象，主库 purge 不影响评测）；共享模式天然同一份。`content_hash` 去重是库内作用域。
- **装配**：评测世界 = 主世界换一个 pgpool。共享模式复用主库的 `PostgresRepo`/`RetrieverHandle`；隔离模式新增 `EvalDbHandle` + `EvalPostgresRepo`，`EvalAssembly` 手工构造同构服务。共享 `ObjectStoreHandle` / `EmbeddingHandle` / `IngestFactory` / `InflightRegistry`；不改 Repo 为多实例容器。
- **出口范围**：7.0 只挂 `GET /eval/status` 与验证用 `POST /eval/retrieve`（复用 `RetrieveRoute`）。不挂 `/eval/resources`（隔离语料走 `eval:seed`，避免两条写入口径）；四表 CRUD、chat、codebases 不镜像（7.4 需要隔离会话时再加）。
- **前端**：三个评测页读 `/eval/status`，页头显示「共享主库 / 隔离库」徽标；不禁用、不接真数据（继续 mock）。

## Build 1 as-built（2026-10-28）

- 新增：`src/adapter/connection/eval-db.ts`（`EvalDbHandle`，第二个池，仅隔离模式构造）、`src/eval/assembly.ts`（`EvalAssembly`：shared 复用主库 repo/`RetrieverHandle`；isolated 用 `EvalPostgresRepo` + 新 `RetrieverHandle`）、`src/routes/eval.ts`（`GET /status` + `POST /retrieve`；`/status` 先注册不落 trace）。
- 改：`src/config.ts`（`evalDatabaseUrl` 可选）、`src/adapter/contract.ts`（`EvalPostgresRepo extends PostgresRepo`，导出；`EvalDbHandle` 只在 adapter 内）、`src/index.ts`（`/eval` 先于主壳挂载，`I_EVAL_MODE`）。
- **没动** `src/trace/systemtrace/endpoint.ts`：Hono 的 `use('*')` 只作用于其后注册的路由（已实测），`/eval` 请求不被主壳记 trace；`/eval/retrieve` 只由评测壳记一条。
- 测试：`test/config.test.ts` 加可选 env；`test/eval-route.test.ts` 覆盖 shared 装配、status 不落 trace、retrieve 单条 trace、坏 body 收口 error。
- 验证：`npx tsc --noEmit` 0；后端 20 文件 / 120 tests 全过；真跑 3101 端口 shared：status 45 ready、retrieve 命中主库、DB 里 `POST /eval/retrieve` = 1、`GET /eval/status` = 0。
- `endpoint.ts` 的 `/resources` 跳过按 Lynx 指示不动。

## Build 2 as-built（2026-10-28）

- 新增 `scripts/eval-db-setup.ts` + `npm run eval:db:setup`：`EVAL_DATABASE_URL` → 缺库连 `postgres` 库建 `ragdb_eval` → `dbmate --no-dump-schema up`；连接串只走 env，重复执行幂等。
- 新增 `scripts/eval-seed.ts` + `npm run eval:seed`（支持 `--limit`）：主库 ready 资源 → 对象复制到 `eval/<content_hash>/<原 key>` → 建 `uploaded` 行 → `ResourceIngest` 走现有 ingest 链重灌；ready 跳过、软删恢复、其余状态重试。
- 新增 `test/eval-isolated.test.ts`：没设 `EVAL_DATABASE_URL` 时整组跳过；设了断隔离模式、计数、两库 chunks 不相交、`eval/` 前缀。
- `ragdb_eval` 已建：16 条迁移；14 张表；`embeddings` 索引名与定义与主库一致。
- 全量 seed：45 篇 → 44 seeded + 1 skipped，failed=0；评测库 45 ready / 949 chunks / 949 embeddings；45/45 篇的块数与块内容 hash 与主库完全一致；45 条 `data_uri` 全带 `eval/` 前缀。
- 隔离真跑：`/eval/status` mode=isolated ready=45；`/eval/retrieve` 命中的 chunkId 不在主库、主 `/retrieve` 命中的不在评测库；评测库 traces 有 `POST /eval/retrieve`=1、`GET /eval/status`=0；主库 eval 路由 trace 仍是 Build 1 那 1 条；`pg_stat_activity` 同时有 `ragdb` 与 `ragdb_eval` 连接。
- 测试：隔离集成 2/2；默认后端 20 文件 120 passed + 1 文件 2 skipped；`npx tsc --noEmit` 0。
- 主库未被改动：45 资源 / 949 chunks / 2947 traces 保持原样。
- Build 3 已完成（见下）；剩 Build 4：全量验收与走读页。

## Build 3 as-built（2026-10-28）

- `src/api/client.ts`：新增 `fetchEvalStatus()` + `EvalMode`/`EvalStatus`；路径 `/api/eval/status`。
- `src/components/evals/evals-page.tsx`：三个视图的 `PageHeader` 右侧加 `EvalModeBadge`；四态：共享主库 / 隔离库 / 检测中 / 评测状态未知；title 带 ready 篇数；不改 mock 数据、不做禁用。
- 测试：`src/api/client.evals.test.ts`（路径/错误码）+ `src/components/evals/evals-page.test.tsx`（shared/isolated/失败态）。
- 验证：前端 73 文件 639 tests、build 绿、tsc 0；浏览器视觉待 Lynx 手测（三视图页头、窄屏、后端关闭时未知态）。
- 取舍：徽标读真 `/eval/status`，其余仍是 mock；模式是启动期 env 决定，所以只在进入页面时取一次，不做轮询/全局 store。
- 前端 summary：`app/web/Agent/summary/summary-2026-10-28-eval-mode-badge.md`。

## 健康探针追加（2026-10-28，Lynx 要求）

- `/health` 增加 `eval` 服务组：shared → `{ ok: true, detail: ['mode=shared', 'same db as postgres'] }`（不额外探库）；isolated → 真 `ping()` 评测库，detail `['mode=isolated', 'reachable'|'unreachable']`。
- 口径沿用「全绿才 200」：隔离库不可达时 `/health` 变 degraded/503；主应用仍照常运行。
- 前端健康页按服务动态出卡，自动多一张 `eval`；加载骨架 3→4。
- 测试：health-chain 7/7；后端 21 文件 124 条（`.env` 含 EVAL URL，隔离集成实际跑了）；前端 73 文件 639 条、build 绿、tsc 0。
- 当前 `.env` 已含 `EVAL_DATABASE_URL` → 本机默认隔离；要共享需显式 `EVAL_DATABASE_URL=`。

## Build 4 as-built（2026-10-28，review）

- 走读页：`_Agents/walkthroughs/epic7-story0-eval-connection.html`；config `.runs/epic7-story0/walkthrough.config.mjs`；memlog 与 validation.txt 同目录。
- 静态校验：sections=14 / code=19 / notes=57 / journeys=10 / style=1/1；index 更新为 19 页 / 245 code / 865 notes / 172 journey。
- 覆盖：shared/isolated 装配、config 可选 env、EvalDbHandle/EvalPostgresRepo、EvalRoute 顺序与单条 trace、health eval 组、setup/seed、前端徽标、后端/前端测试。
- 未做/留 Lynx：浏览器手测三视图页头、窄屏、health 第 4 卡、后端停掉的未知态；隔离库真 down 未真停；shared 的 `/ask` 未重新真打。
- 状态：Lynx 2026-10-28 判定 7.0 完成（done）；7.0 连接代码仍在未提交面（136857e 只含 eval-probe/cases 与 Epic 5 尾巴）。

> **收口（2026-10-28）**：Lynx 判定 Story 7.0 完成。sprint 7.0 → done；walkthrough 页面、index 卡片、epics as-built 同步；Epic 7 剩余 7.1–7.4。

## 详细实现蓝图（Build 4 待做）

### Build 1 · 连接抽象与状态

- `src/config.ts`：新增 `readonly evalDatabaseUrl: string | null`；`getEnv('EVAL_DATABASE_URL')` 不进 `missing`。
- `src/adapter/connection/eval-db.ts`（新）：`EvalDbHandle`，`@singleton`，从 `AppConfig.evalDatabaseUrl` 造第二个 `createDbPool`；无 URL 时抛（只在隔离模式 resolve）。
- `src/adapter/contract.ts`：新增 `EvalPostgresRepo extends PostgresRepo`（构造里 `super(new EvalDbHandle(Config))`），导出；文件头补一段分工说明。`PostgresRepo` 不动。
- `src/eval/assembly.ts`（新）：`EvalAssembly`，`readonly mode: 'shared' | 'isolated'`、`readonly repo: Repo`、`readonly retriever: Retriever`：
  - 无 URL：`repo = container.resolve(PostgresRepo)`、`retriever = container.resolve(RetrieverHandle).retriever`。
  - 有 URL：`repo = container.resolve(EvalPostgresRepo)`；`new RetrieverHandle(RetrieverFactory, evalRepo, Embedding, Config).retriever`。
- `src/routes/eval.ts`（新）：`EvalRoute.build()`：
  - `GET /status`：`{ mode, reachable, corpus: { counts } }`（`repo.ping()` + `resourceCounts()`，200 摆事实）。
  - `POST /retrieve`：复用 `RetrieveRoute`，构造参数用 `EvalAssembly` 选中的 repo/retriever。
  - trace：`app.use('*', createEndpointTrace(EvalAssembly.repo, ['/eval/status']))`；`/eval/status` 不记。
- `src/trace/systemtrace/endpoint.ts`：`SKIP_PREFIXES` 加 `/eval`；`createEndpointTrace(Writer, SkipPrefixes = SKIP_PREFIXES)` 增可选参数（评测子应用传 `/eval/status`）。**不动**已有的 `/resources` 项。
- `src/index.ts`：`app.route('/eval', container.resolve(EvalRoute).build())`；启动日志一行 `I_EVAL_MODE`（shared/isolated）。
- 测试：
  - `test/config.test.ts` 加「无 EVAL_DATABASE_URL → CONFIG_OK」。
  - `test/eval-route.test.ts`：无 URL → status `mode='shared'`、`/eval/retrieve` 走主检索；有 URL（真实集成，需环境）→ `mode='isolated'`。
  - `test/eval-isolation.test.ts`（真实集成，需 `EVAL_DATABASE_URL`）：写一条评测独有文档 → `/eval/retrieve` 命中、主 `/retrieve` 不命中；主库 counts 不变；评测库 traces 有 `/eval` 行；结束后 purge 测试行。

### Build 2 · 隔离模式工具

- `scripts/eval-db-setup.ts`（新）+ `package.json` `eval:db:setup`：
  - 读 `EVAL_DATABASE_URL`；解析出库名（校验 `[a-z_][a-z0-9_]*`）。
  - 连同一实例的 `postgres` 库：缺库则 `CREATE DATABASE`。
  - spawn `dbmate --no-dump-schema up`，env 覆盖 `DATABASE_URL=EVAL_DATABASE_URL`；不把 URL 放进 argv。
- `scripts/eval-seed.ts`（新）+ `package.json` `eval:seed`：
  - 断言当前是隔离模式；先 `evalRepo.markStaleOnBoot()`。
  - 读主库 `resources`（`status='ready' AND deleted_at IS NULL`）。
  - 逐条：读主库对象 → 用 `keyForUpload`/`allocateKey` 生成评测库自己的 key → `ObjectStore.put` 复制 → `createResource({ title, source, data_uri: 新 key, content_type, status:'uploaded', storage_size_bytes, content_hash })` → `ResourceIngest.ingest(id, undefined)`。
  - 打印逐条结果 + 汇总；失败不中断，最后给非零退出码。
- `.env` 默认**不写** `EVAL_DATABASE_URL`（保持共享模式）；要隔离时临时 `EVAL_DATABASE_URL=... npm run dev`，或自己写进 `.env`。凭据不打印、不进 argv。
- 验证：`dbmate status` 15 applied / 0 pending；评测库 partial HNSW 索引与主库同名同谓词；两库 `resources/chunks/embeddings` 计数；抽 3 篇比对 chunk 数与首块内容。

### Build 3 · 前端模式徽标

- `src/api/client.ts`：`fetchEvalStatus()` + 类型（`mode / reachable / corpus`）。
- `src/components/evals/evals-page.tsx`：页头显示「共享主库 / 隔离库」徽标；不改变现有 mock 与三栏。
- 测试：`evals-page.test.tsx` 覆盖 shared / isolated 两态徽标。

### Build 4 · 验收与收口

- 共享模式真跑：不设 URL 启动；`GET /eval/status` = shared；`POST /eval/retrieve` 与主 `/retrieve` 同一份语料；评测 trace 落主库、route 带 `/eval`，`GET /traces?route=...` 可过滤；主 `/ask`、`/resources` 不变。
- 隔离模式真跑：设 URL → `eval:db:setup` → `eval:seed`；`/eval/retrieve` 只命中评测语料；主检索不交叉；两池各管各的；评测 trace 落评测库。
- `npx tsc --noEmit`、后端 `npm test`、前端 `npm test` / `npm run build`。
- 更新 sprint-status（7.0 → review → done）、Epic 7 备注；写走读页 `epic7-story0-eval-connection.html`；按需补 LEARNING。

## 风险 / 待确认

1. **选择的层级**：本蓝图按 env 启动时选择（共享/隔离）。如果你要的是 UI 上一键切换（两套池同时活着、选择写进 run 配置），成本更大，需要重开这条。
2. **远端 PG 账号需 CREATEDB 权限**：`eval:db:setup` 若被拒，会给明确错误；退化方案是在 PG 主机手工 `createdb ragdb_eval` 后跑同一脚本的迁移段。
3. **chunk 对齐**：隔离模式 seed 是重新 parse/chunk/embed，gold 的 `chunk_index` 依赖 chunker 与解析确定性；验收要抽篇比对。若发现某篇用了非默认 chunker，再决定是否按主库原样复制该篇。
4. **7.2 的 per-run 运行配置**（k、topK、minSimilarity）还没参数化：7.0 先用环境值跑通；7.2 再把 Retriever 的 config 来源改成 run 快照。
5. **未提交的 `/resources` trace 跳过**：与 3.4 口径冲突，7.0 不碰；请 Lynx 定去留（保留 / 还原 / 单独修）。
6. 评测 trace 的读取 UI（`/traces` 加 route 前缀筛选）7.0 不做；需要按 run 排查时在 7.2/7.3 补。
7. 7.4 的隔离会话、judge、Langfuse 标记仍整格未收口，不在本 story。

## 验证命令（草案，凭据不打印）

```bash
cd app/server
npx tsc --noEmit
npm test

# 共享模式（不设 EVAL_DATABASE_URL）
npm run dev
curl -s localhost:3000/eval/status | jq
curl -s -X POST localhost:3000/eval/retrieve -H 'content-type: application/json' -d '{"query":"..."}' | jq '.hits | length'
curl -s "localhost:3000/traces?route=..." | jq

# 隔离模式（连接串用 env 传入，不进 argv）
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run eval:db:setup
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run eval:seed
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run dev
curl -s localhost:3000/eval/status | jq
curl -s -X POST localhost:3000/eval/retrieve -H 'content-type: application/json' -d '{"query":"..."}' | jq '.hits | length'
```

## 文档入口

- 规格：`_Agents/planning-artifacts/epics.md` › Epic 7 › Story 7.0（含开工清单）
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`
- 延后项：`_Agents/implementation-artifacts/deferred-work.md`
- 走读页（收口时）：`_Agents/walkthroughs/epic7-story0-eval-connection.html`
