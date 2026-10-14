# Review — Epic1 / Story1.4 / Build2（服务端持有取消信号 + `/abort` + 写库守卫）

- 日期：2026-10-13
- 内容：`app/server` commit `ab1c4e5`（diff 356 行，7 个文件）
- 契约参照：`epics.md` Story 1.4 AC
- Lens：adversarial / edge-case-hunter / verification-gap（structure、prose 不适用：内容是代码）
- 说明：本文件按 lens 分组原样收录，**未去重**（交叉命中本身是信号）。每条标注核验状态：
  - `[已核]` = agent 读代码确认推理成立
  - `[未复现]` = 推理成立但本轮没有跑出该现象
  - `[静态]` = lens 静态推断，agent 未独立验证

---

## 一 · 三个 lens 交叉命中（最高优先）

### C1 `[已修 + 已复现]` ~~`/abort` 单独使用时（只取消不删）会承诺一个不会发生的结果~~
- adversarial、edge-case(×2，含 claim 类)、handoff 自身文案 四方命中
- 位置：`app/server/src/pipeline/pipelines.ts:101-108`；`app/server/src/routes/resources/resources.ts:65`
- 触发：abort 恰好落在 `writeChunksWithEmbeddings` 执行期间。写入不是可中断的（pg 调用不吃 signal），`:99` 是写入前最后一次 `Signal.aborted` 检查；新加的守卫只判 `deleted_at`，而 `/abort` **不删资源** → 谓词通过 → 事务照常提交 `ready` + 全量 chunks
- 后果：202 body 明写的「转 failed(入库取消)」永不兑现；前端若轮询等 `failed` 会一直等

**修复（同日 build3，只动 `pipelines.ts` 一处）**：写入返回之后、返回 ready 之前补一道检查，`fail()` 自带的 `deleteChunksByResource` 会把刚提交那一笔收回。
```ts
const chunkCount = await repo.writeChunksWithEmbeddings(...)
// 写入不是可中断的：取消若落在 INSERT/UPDATE 期间，事务已提交成 ready，这里必须把那一笔撤回来
if (Signal.aborted) return await fail('入库取消')
```

**复现与验证（真库 + 真 Ollama + 真 URL，探针 `tmp-abort-window-probe.ts` 跑完即删）**：另一 session 先 `SELECT … FOR UPDATE` 占住该资源行，把写入方卡在 `INSERT chunks` 里，在窗口内按下 `inflight.abort(id)`，再放锁让事务提交。2ms 采样观察到的状态序列：

```
processing/chunks=0  →  ready/chunks=16  →  ready/chunks=0  →  failed/chunks=0/入库取消
```

- `ready/chunks=16` 这一帧**就是 C1 本身**：abort 已按下、写入仍提交了全量数据（修复前序列到此为止）
- 随后 `ready/chunks=0`（`fail()` 先删 chunks）→ `failed/入库取消` ⇒ 撤回生效
- 终态：`failed | 入库取消`、chunks 0、全库孤儿向量 0、登记表已注销；`vitest` 8 passed、`tsc` EXIT=0
- 顺带暴露：返回的 `failure.code` 仍是通用的 `E_INGEST_FAILED`（**C3 未修**，取消没有专属码）

### C2 `[已否证 —— 实测不成立]` ~~DELETE 与写入事务加锁顺序相反 ⇒ 可死锁~~
- adversarial 提出（edge-case 从另一侧命中同一处）
- 位置：`app/server/src/adapters/paradedb-repository.ts:116-178`（写入事务）vs `:202-228`（软删事务）
- 原推理：写入方 `INSERT chunks` → `UPDATE resources`；软删方 `UPDATE resources` → `DELETE chunks`，两边取锁顺序相反 ⇒ 环等待
- **推理漏了一步**：`INSERT INTO chunks` 会因为外键**先对父 `resources` 行加 KEY SHARE 锁**（`pg_locks` 里显示为 `tuple / ShareUpdate`）。父行因此成为**唯一的排队点**：
  - 写入方先插 ⇒ 它已持父行 KEY SHARE ⇒ 软删方的 `UPDATE resources` 卡在门口，根本走不到 `DELETE chunks`；
  - 软删方先更 ⇒ 写入方的 `INSERT` 卡在门口，chunk 行一条都不存在 ⇒ 软删方的 `DELETE` 无可等。
  两个方向都只有一把锁要排，第二边永远形不成 ⇒ **环闭合不了**。
- 实测（真 ParadeDB，两个独立 session，`tmp-lockorder-probe.ts`，跑完即删）：
  - 场景一（写入方先插）：软删方 `wait_event_type=Transactionid`、`ShareRowExclusive granted=false`；写入方自己那句带谓词的 `UPDATE` **rowCount=1 立刻通过**；COMMIT 后软删方解除阻塞 rowCount=1，其 `DELETE chunks` rowCount=1 ⇒ 终态 `deleted_at 已置 + chunks 0`，正是 AC 要的「待当前事务完成后清理」
  - 场景二（软删方先更）：写入方 `INSERT` 阻塞；软删方 `DELETE` rowCount=0 后 COMMIT；写入方 INSERT 放行 → 带谓词的 UPDATE **rowCount=0** → ROLLBACK ⇒ **写守卫按预期把整笔写入撤掉**
  - 场景三：两种顺序各 100 轮（共 200 轮）⇒ **`40P01` 死锁 0 次、`57014` 超时 0 次**
- **真正的残余风险（换了个名字，不是死锁）**：场景一证明 DELETE 会"等整个写入事务"。16 块的写入 <1ms 无感；等真到 `deferred-work.md` 第 3 条那个量级（几千块、INSERT 参数逼近 65535），写入事务可达数秒，DELETE 就会撞 `paradedb.ts:15` 的 `query_timeout: 5000` 报 `500 E_DELETE` —— 而 abort 其实已按下、行随后照样转 failed。**用户看到"删除失败"但其实成功了。** 归口在写入分批那条，不是本轮的锁问题。
- **反向收获**：这次实测恰好印证了 C1 —— `AND deleted_at IS NULL` 能救"删除 + 写入"这条路，但**只 abort 不删**时没有 `deleted_at`，谓词形同不存在，写入照旧提交 `ready` + 全量 chunks。

### C3 `[已核]` 取消没有机器可读的结果
- adversarial（两处）、edge-case 命中
- 位置：`pipelines.ts:66-71`（`fail(Reason: string)` 恒发 `E_INGEST_FAILED`）、`resources.ts:59-64`
- 现状：取消 = 中文字面量 `'入库取消'` + `failure.code = 'E_INGEST_FAILED'`；`/abort` 的两种"按不下去"（行不是 processing / 行是 processing 但登记里没有）共用一个 `E_NOT_ABORTABLE`，且第二个 message 断言了一个服务端并不知道的成因（「服务可能重启过」）
- 后果：UI 想区分「你取消了它」和「它自己挂了」只能 `error_reason` 字符串匹配；AC 的状态列表也没有第四态可显示
- 建议修法：`fail(Reason, Code = 'E_INGEST_FAILED')` + 取消站点传 `'E_CANCELLED'`；`/abort` 拆成 `E_NOT_PROCESSING` / `E_NOT_INFLIGHT` 两个码，并删掉那句猜测

---

## 二 · adversarial 单发

| # | 位置 | 触发条件 | 建议 | 核验 |
|---|---|---|---|---|
| A4 | `pipelines.ts:62-74` | `inflight.add` 在拥有 `finally` 的 `try` **之外**；两者之间任何抛错（候选：`:64` 的 `AbortSignal.any`，需 Node ≥20.3 而 `package.json` 无 `engines`）都会永久漏一条登记 | 把 `add` 挪进 try，或先构造 `Signal` 再 add | `[已核]` 结构属实，实际触发概率低 |
| A5 | `inflight.ts:18-20` | `remove(Id)` 只按 key 删。今天 id 每次新建所以无害；一旦有"重新入库/更新同一资源"复用 id，旧 run 的迟到 `finally` 会把**新任务**的登记摘掉 ⇒ 取消静默失效 | `remove(Id, Ctrl)` 比对 token 再删 | `[静态]` |
| A6 | `resources.ts:41-44` | 取消按钮要经两次 DB 往返才按下（`getResource` 占一个 pool client，`max:5`，而占着连接的正是入库写入）；池紧或库慢时，纯内存的 `abort()` 反而排在它要打断的操作后面。DELETE 又丢弃了 `abort()` 返回值 | 先按（同步、不碰库），再校验 | `[静态]` 推理成立 |
| A7 | `paradedb-repository.ts:79-95` vs `:160-166` | `deleted_at IS NULL` 只加在四个资源写操作的**一个**上；`updateResourceStatus`（`fail()` 用）和 `updateResourceTitle` 仍无条件写 ⇒ 用户拿到 204 之后，那条已删行的 status/error_reason/title/updated_at 还在漂移 | 同一条规则覆盖所有资源写操作 | `[已核]` |
| A8 | `pipelines.ts:109-113` + `paradedb-repository.ts:162-166` | 守卫抛的是裸 `Error`，调用方唯一判别手段是 `Signal.aborted`；若取消没到达本任务（无登记）则落到 `fail('embedding_error')` | 用类型化错误 `ResourceDeletedDuringWrite` | 与 edge E3 交叉 `[已核]` |
| A9 | `pipelines.ts:66-67,114-116` | `fail()` 新增日志与外层 `catch` 的 `E_INGEST` 叠成一次故障两行、两个 code；用户主动取消被记在 `console.error` 级；`new Error()` 只为取 `.message`（栈丢弃）；id 拼进 message 而非字段，与全站 `{code,message}` 形状不一致 | 一次故障一行、结构化字段、取消用 log 级 | `[已核]` |
| A10 | `pipelines.ts:74-88` | `parser.run`（jsdom+Readability+turndown）与 `chunker.run` 是同步的：这段时间既观测不到 abort，**连 DELETE/abort 请求本身都进不来**（事件循环被占）；`:81` 回填标题前也没有 aborted 检查 | 至少补 `fetch` 之后一处检查；并在文件头写明"取消延迟有 parse+chunk 这个同步地板" | `[已核]` 机制属实 |
| A11 | `resources.ts:164-167` vs `:82-91` | 新提取的 `uuidOk()` 注释把规则限定为"两个端点"，但第三个按 id 定位的 `GET /:id/chunks` 仍把裸路径段塞给 uuid 列 ⇒ 垃圾 id 得到 `500 E_CHUNKS`，而 `DELETE /foo` 是 400 | 同一道校验 + 先 `getResource` 再读 chunks；注释改"三个" | `[已核]` |
| A12 | `resources.ts:24-33`, `bootstrap.ts`, `index.ts` | 同一个 `InflightRegistry` 经两条独立路径注入（工厂=持有者、路由=按的人），没有任何东西把它们绑定；将来装配时误传 `new InflightRegistry()` ⇒ `/abort` 永远 409 | 单一所有权：`factory.abort(id)`，路由不再收这个 dep | `[静态]` 设计取舍 |
| A13 | `pipelines.ts:46-49` + 建表迁移 | 查重是 `SELECT` 后 `INSERT`，`resources.source` 无唯一索引 ⇒ 同一 URL 并发提交双建行双 ready | 库级 partial unique + 把 `23505` 映射成 409 | **已知**：Lynx 2026-10-13 已定「P1 不加唯一索引」，非本轮新问题 |

---

## 三 · edge-case-hunter 单发（补充 adversarial 未覆盖的）

| # | 位置 | 触发 | 建议 | 核验 |
|---|---|---|---|---|
| E1 | `resources.ts:43` | processing 行但登记为空（启动清扫失败/异进程遗留）：DELETE 丢弃 `abort()` 返回值 ⇒ 行标了 deleted 却永远停在 `processing` | `if (status==='processing' && !inflight.abort(id))` 补一次 `updateResourceStatus(id,'failed','入库中断')` | `[静态]` |
| E2 | `resources.ts:59-64` | `getResource` 读到 processing、紧接着任务自然完成 ⇒ `abort()` 返回 false，409 却把成因推给"重启过" | abort 失败后重读一次状态再报错 | `[静态]` |
| E3 | `pipelines.ts:90-97,114-116` + `http-fetcher.ts:21` + `qwenembed.ts:29` | 各 stage 的 `AbortSignal.timeout(30_000)` 触发时外层 `Signal.aborted` 仍为 false ⇒ **超时、取消、真错误三者塌成两种 reason**，真错误被写成 `入库失败` | 判 `err.name === 'TimeoutError'` 给独立 `embedding_timeout` | `[已核]` 与 handoff 决策 7 同源 |
| E4 | `pipelines.ts:45-59` | `CallerSignal` 进来时已 aborted ⇒ 照样建一行再立刻 `入库取消` | `run()` 入口先判 `CallerSignal?.aborted` | `[静态]` |
| E5 | `paradedb-repository.ts:120-124` | 写入事务开头 `SELECT data_uri ...` 无 `if (!res)` ⇒ 行不存在时 `undefined.data_uri` TypeError，而不是那句干净的中止原因 | 补空判 + 同句加锁 | `[已核]`（实践中行总在；仅硬删后可能） |
| E6 | `pipelines.ts:80-83` | `updateResourceTitle` 撞 `query_timeout` ⇒ 一次纯装饰性的标题写失败，把已经 embed 完的入库整个判成 `入库失败` | `.catch(logError('E_TITLE'))` 降级 | `[静态]` |
| E7 | 已删除的 `tmp-softdelete-probe.ts:278-356` | 软删/取消断言失去了唯一可执行的检查 | 保留为 `test/` 用例 | 与 verification-gap F1 交叉 |
| E8-E11（claim 类） | 逐条对照 handoff | (a)「先 abort + 写守卫 ⇒ 无竞态」——守卫只测 `deleted_at`，取消不删这条路没被覆盖（=C1）；(b)「DELETE 打 processing ⇒ failed+已删」实测值是**时序运气**，`ready+已删` 是没写进清单的合法结果；(c)「`finally` 是唯一防泄漏点」——`add` 在 try 外（=A4）；(d)「三条腿保证防泄漏」——没有任何一条给 `createResource→fetch` 入口和同步 parse 阶段设上限 | 按上面各条修 | `[已核]`/`[未复现]` 混 |

lens 自述：`has()` 删除、`E_DELETE_PROCESSING` 移除经核查确无残留调用方，不作为 finding。运行时类主张（tsc/vitest/8 条 curl/断连前后对照）静态不可核，未采信。

---

## 四 · verification-gap（6 条，全部指向同一件事）

**结论：本轮新增的四种行为，在仓库里没有任何可重放的验证；把它们的代码删掉，测试全绿。**

| # | 缺什么 | 反转测试（把它改掉，`vitest` 仍 8 passed） | gap_shape |
|---|---|---|---|
| F1 | 写守卫 `AND deleted_at IS NULL` + `rowCount===0` 抛错 | 删掉谓词或删掉 throw ⇒ 无人报警；现有 8 个 case 没有一个把资源置成 `deleted_at`，也没有一个直调 `writeChunksWithEmbeddings` | regression-gap |
| F2 | `inflight.add/remove` 与 `/abort` 全部状态码 | 删掉 `:63` 的 add ⇒ `/abort` 全 409、DELETE 不再掐任务；删掉 `:118` 的 remove ⇒ 登记只增不减。测试文件确实 `new InflightRegistry()`（`:21`）但**之后再没引用过一次** | broken-verification-gap |
| F3 | 「客户端断连不再取消」这条行为翻转 | 没有任何测试钉住；且 `Pipeline.run(Data, Signal?)` 签名保留可选第二参 ⇒ 把 `c.req.raw.signal` 加回 `:146` 是类型合法的"顺手改进"，一加批量上传就废 | regression-gap |
| F4 | `AbortSignal.any([ctrl.signal, CallerSignal])` 的调用方信号分支 | batch 测试（`:86`）从不传 signal ⇒ 该三元与 `:127` 的 break 执行数为 0 | regression-gap |
| F5 | `GET /:id/chunks` 的 id 校验与存在性语义 | 三个 id 端点的错误形状没有一个被钉过 | missing-adoption-gap |
| F6 | `fail()` 新日志 | 行被删或 code 漂移后，「按了 abort 但库里迟迟不转 failed」只剩 `E_INGEST` 一条线索 | other |

lens 对「是否削弱既有测试」的定点回答：**没有**——`test/pipeline-factory.test.ts` 只有 `:7` import 与 `:21` 构造第二参两行相关，六个 case 的断言一条未动；且因 `test/` 被 `app/server/.gitignore:3` 忽略，这处改动根本不进 diff。

---

## 五 · 判定

代码的意图和主线接线是对的，`fail()` 不复用 signal、`finally` 清理、守卫加在写入事务这些关键判断都站得住。真正挡 story 1.4 收口的只有 **C1**（`/abort` 承诺了一个它做不到的结果）——它不是风格问题，是接口在说谎。**C2 已于同日实测否证**（200 轮双向撞锁 0 死锁 0 超时；机理见上），但否证过程反过来把 C1 钉实了，并暴露出一条新的量级依赖（DELETE 等写入事务 → `query_timeout`）。**C3/A11/A7/E3** 是便宜的一致性账。

按项目政策（测试不由 agent 主动伸手），第四节那 6 条**不构成放行动作**，只构成一条事实：**AC 那句「无孤儿向量、无竞态」目前的证据只有人工 curl 记录，而唯一可重放的探针脚本已随本 commit 删除**。补不补测试由 Lynx 定。
