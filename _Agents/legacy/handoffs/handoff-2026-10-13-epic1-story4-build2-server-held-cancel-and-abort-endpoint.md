---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-13
story: 1.4（知识库查看与删除）
build: 2
status: review
persona: Amelia (Senior Software Engineer)
---

# Handoff — Epic1 / Story1.4 / Build2：取消信号改服务端持有 + `/abort` 端点 + 写库守卫

## 〇 · 一句话状态

story 1.4 的**后端三条 AC 全部落码并实测**（真库 + Ollama + 真 URL）：`src/pipeline/inflight.ts` 新建进程级取消登记处、`POST /resources/:id/abort`（取消但不删）、`DELETE` 遇 processing 先 abort 再软删、`writeChunksWithEmbeddings` 加 `AND deleted_at IS NULL` 写守卫、`fail()` 补日志、**客户端断连不再取消入库**。`tsc --noEmit` EXIT=0、`vitest` 8 passed、8 个端点路径逐个 curl 验过。**前端按 Lynx 定案整体挂起** → `frontend-deferred.md`，所以本 story 停在 `review` 而不是 `done`（AC 措辞是界面语义）。`app/` 仍不在 git。

## 一 · 工程在哪

- 后端：`app/server/`（`npx tsx --env-file=.env src/index.ts`；测试 `npx vitest run`）
- 本轮改动 7 个文件：
  - `src/pipeline/inflight.ts` **新建**：`InflightRegistry`，私有 `Map<resourceId, AbortController>` + `add/remove/abort`（`has()` 写了但无调用方，已删）
  - `src/pipeline/pipelines.ts`：`constructor(Registry, Inflight)`；`runOne(Data, CallerSignal?)` 内 `new AbortController()` → 建行后 `inflight.add` → `Signal = CallerSignal ? AbortSignal.any([ctrl.signal, CallerSignal]) : ctrl.signal`；外层 `finally { inflight.remove }`；`fail()` 首行无条件 `logError('E_INGEST_FAIL', <id> → <reason>)`；写入那段 catch 新增 `if (Signal.aborted) fail('入库取消')`
  - `src/bootstrap.ts`：`Deps.inflight` 单例，工厂与路由共用同一实例
  - `src/routes/resources/resources.ts`：deps 多 `inflight`；**`run(data)` 不再传 `c.req.raw.signal`**；新增 `app.post('/:id/abort')`；DELETE 的 `E_DELETE_PROCESSING` 分支删除，改 `if (status==='processing') inflight.abort(id)` 后照常软删；uuid 正则提成 `uuidOk()` 两端点共用
  - `src/index.ts`：路由 deps 传 `inflight: deps.inflight`
  - `src/adapters/paradedb-repository.ts`：转 ready 那句加 `AND deleted_at IS NULL`，`rowCount === 0` → 抛 → 既有 catch ROLLBACK
  - `test/pipeline-factory.test.ts`：**只补了构造第二参 + 一行 import**（签名变更强制），没碰任何断言
- build1（本 story 上一刀，Lynx 自己敲）：`softDeleteResource` 返回 `boolean` + `DELETE /resources/:id`；同时删掉了端口里多余的 `deleteEmbeddingsByResource`（FK CASCADE 已覆盖，且它是个永远抛错的占位、调用点被 `.catch(()=>{})` 吞着）。

## 二 · 本轮实测（全部真跑，不是"代码写了"）

| 场景 | 实况 |
|---|---|
| `POST /:id/abort` 打 processing 行 | `202`；2s 内该行 `failed \| 入库取消`、chunks 0、**未软删** |
| 服务端日志 | `{"code":"E_INGEST","message":"This operation was aborted"}` + `{"code":"E_INGEST_FAIL","message":"b42a4a2c… → 入库取消"}` |
| `/abort` 打 ready 行 | `409 E_NOT_ABORTABLE`「资源已是 ready，没有可取消的任务」 |
| `/abort` 不存在 uuid / 垃圾 id | `404 E_NOT_FOUND` / `400 E_BAD_ID` |
| `DELETE` 打 processing 行 | `204` → 行 `failed \| 入库取消` 且 `deleted_at` 已置、chunks 0 |
| `/abort` 打已软删行 | `404`（`getResource` 已过滤 deleted） |
| **断连行为（改前 vs 改后）** | 改前：POST 后 2s 掐 curl → `failed(入库取消)`。改后：**同样掐连 → 照样跑完 `ready` + 16 块**；`c.json()` 写给已关闭连接，node-server 静默丢弃、进程无恙 |
| 写守卫（探针直测，不靠掐时间） | 对已软删资源调 `writeChunksWithEmbeddings` → 抛「资源在写入期间已被删除，写入中止」、落库 0 块 |
| 全库一致性 | 孤儿向量 0（`embeddings.source_id NOT IN (SELECT id FROM chunks)`）；探针行全清，库回到原貌 1 行 / 27 chunks / 27 embeddings |
| 回归 | `tsc --noEmit` EXIT=0；`npx vitest run` 8 passed / 11.9s |

## 三 · 关键决策 / 坑（务必照此续做）

1. **`AbortController` 不可序列化** —— 这是"把 in-flight 搬进 Redis"被否的终局论据：跨进程只能传**取消意图**，收到的一方仍要按自己手里那个开关，所以本地 Map 无论如何在。Redis 已定档 **P3 工程项**（`prd.md` §7 P3 子条 / `addendum.md` C 表 / `deferred-work.md` 三碎片合成一条）。
2. **取消开关必须由持有任务的一方造**。`resource.id` 是 `runOne` 内部 `createResource` 之后才铸出来的，所以路由没法自己 new 一个 controller 传进去——只能靠登记。
3. **`inflight.abort()` 之后仍要写守卫**。先 abort 只把窗口缩到"embed 刚好返回、正在写"那一瞬；缺 `AND deleted_at IS NULL` 那条谓词，AC「无竞态、无孤儿向量」就是假的。
4. **`finally` 里 remove 是唯一防泄漏点**。
5. **`fail()` 绝不复用 Signal**（build1 就定的，本轮加日志也没破）。
6. **客户端断连不再有否决权**：动机是 Lynx 的下一步（批量上传——用户点 10 个文件后关页面是正常操作）。防泄漏改由三条服务端腿保证：`inflight.abort`、`http-fetcher.ts`/`qwenembed.ts` 各自的 `AbortSignal.timeout(30_000)`、`bootstrap.ts` 启动清扫。**不违反 story 1.2 的 AC**（那句只要求管线"有被取消的能力"）。
7. 30s 超时触发时走的是通用 `入库失败` 而不是 `入库取消`（那个三元只看外部 signal）——挂住的外站和真错误在库里长得一样，只在日志里分得开。
8. `batch()` 也吃 signal，但没有任何 HTTP 端点调用它，那条路径目前只有测试能走到。

## 四 · 未提交 / git

后端源码在 `app/server/` 的**嵌套 git** 里有版本控制；`app/` 被外层 `.gitignore` 忽略，且内层 `.gitignore` 忽略 `test/`（Lynx 2026-10-13 定：维持现状）。所以本轮那行测试改动不进版本控制。`app/` 是否纳入 git 仍是 Lynx 的决策，agent 别擅改。

## 五 · 还差什么

**story 1.4（前端整体挂起，见 `frontend-deferred.md`）**
1. `api.ts` 缺 `deleteResource` / `abortIngest`；`knowledge.tsx` 缺删除按钮；processing 行缺取消按钮；**且全站没有列表轮询**——现状 POST 跑到 ready 才返回、期间列表不刷新，那条 processing 行在界面上根本不出现，`/abort` 没有任何可被点到的时刻。定论证据由 Lynx 浏览器手测。
2. 小口径不一致（非阻塞）：`GET /resources/:id/chunks` 对已软删资源返 `200 {chunks:[]}` 而 DELETE 返 404；202 的 body 只有 `{message}` 没带 `code`。

**跨 story 的账**
3. **`LEARNING.md` 只有 Story 1.1**，1.2 / 1.3 / 1.4 三段沉淀都没写（AGENTS §二 第 5 步）。
4. **Epic 2 的硬要求只写在文档、没进代码**：检索 SQL 一律 `JOIN resources r ... AND r.deleted_at IS NULL`。做了这条，取消信号与 409 类闸门都从"必须"降级成"锦上添花"。
5. `npx vitest run` 出现过一次 afterAll 的 `DELETE FROM resources` 抛错、重跑即绿，疑为 `paradedb.ts:15` 的 `query_timeout: 5000` 撞远程库抖动，属既有 flaky，非本轮引入。
6. 其余暂缓项见 `deferred-work.md`（含本轮新增的 P3 工程项一条：批量入库 + 后台队列 + 跨进程取消）。

## 六 · 下一步（建议，未放行）

Epic 1 只剩收尾：补 `LEARNING.md` 三段 + story 1.4 的 review 判定 → epic-1-retrospective。之后进 **Story 2.1 混合检索问答**——那才是本项目的主线（AI SDK 上场），也是"检索不得命中已软删资源"这条谓词必须落地的地方。按 §〇.3 一次一个阶段，2.1 之前建议先把 P1 的学习沉淀补完，否则 §〇.2「跑通了且讲得清为什么」这条会欠账。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图；只有「进行/落码/你来写」才动文件，且一次最小一步（本轮他说「你直接写吧，写完告诉我你改了什么原来是什么」⇒ 7 文件一整刀 + 前后对照报告 + 代跑真环境验证）。测试不由 agent 主动伸手：本轮只改了构造补参与删掉一个失效调用，断言零改动。前端验证归 Lynx 浏览器手测，不派 Browser 子代理代测。沟通：先结论、分点、少黑话、中文。
