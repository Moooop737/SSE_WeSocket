# Deferred Work — Knowledge Copilot

> 来自各轮 code review / retrospective 的已知但本轮不动的项。每条记来源与"什么证据能定论"。

## Deferred from: code review of epic1-story2-build3 (2026-10-13)

- **`legacy.test.ts` 被 vitest 排除，chunk 偏移与 `chunk_index` 稠密唯一性断言从不执行** (`app/server/vitest.config.ts:8`) — pre-existing：Lynx 已定「旧 node:test 暂留、之后统一重构」。风险落点是 `paradedb-repository.ts:140-153` 靠 `chunk_index` 配对向量、Story 2.3 靠 `start_offset/end_offset` 定位引用。定论证据：把该文件用 `node --test` 跑一次看是否全绿。
- **ARCHITECTURE-SPINE AD-1 的依赖箭头与实现不符** (`_Agents/planning-artifacts/architecture/architecture-dev-2026-10-09/ARCHITECTURE-SPINE.md` AD-1) — 实现是 2026-10-13 Lynx 亲自定的「四段全走 StageRegistry、embedder 也在其中（构造时吃 config）」，并推翻了 2026-10-10「不做按名字查表的注册中心」；缺的是文档补记（建议在 AD-1 写「StageRegistry 是 pipeline 层唯一允许 `new` 适配器的位置」）。修法是改 spec，故 defer。
- **单事务多行 INSERT 无分批** (`app/server/src/adapters/paradedb-repository.ts:126-158`) — 约 5900 块撞 Postgres 65535 参数上限，`query_timeout:5000` 会先到。P1 抓网页文章达不到该量级；等真喂长文档再分批或改 `unnest`。

## Deferred from: epic1-story4 build2 取消信号落地 (2026-10-13) — 三碎片合一个 story，归 P3 工程项

Lynx 定：下面三件**不再分开拖**，合成一刀做，落点是 **PRD §7 · P3 工程项**（已写入 `prd.md` P3 子条与 `addendum.md` C 表的「P3 工程项」行）。**Redis 只在这一刀进**。

- **批量入库（多文件一次提交）** — 现在 `POST /resources` 一次一条，且请求要等到 ready 才返回。`Pipeline.batch(KBData[])` 早已实现但没有任何端点调用，接口位现成。定论证据：真丢 10 个文件进去，看 `app/server/src/adapters/paradedb.ts:12` 的 `pool.max=5` 和 Ollama 吞吐先到哪条上限。
- **入库改后台队列（不占 HTTP 请求）** — 与上一条同一刀。顺带解掉这轮"客户端断连不再取消"留下的账：一个没人在等的请求，现在仍会一路跑到 ready 才返回。
- **跨进程取消** — P1 的取消开关住在 `app/server/src/pipeline/inflight.ts` 的进程内 `Map`，第二个进程或重启后即失效（`POST /resources/:id/abort` 那时诚实回 `409 E_NOT_ABORTABLE` 并提示改用 DELETE，属设计内）。队列化之后取消 = 从队列撤任务，`InflightRegistry` 这一层可整体退役。
  - **别走回头路**：Redis 存不了 `AbortController`（进程内活对象，序列化即失效），跨进程只能传"取消意图"，收到的一方仍要按自己手里那个开关。这是 2026-10-13 否掉「把 in-flight Map 搬进 Redis」的理由。WeKnora 的 Redis 也印证了这个分工——它是 asynq 任务队列（`WeKnora-main/docker-compose.yml:556`、`internal/router/task_inspector.go`），不是取消信箱。
