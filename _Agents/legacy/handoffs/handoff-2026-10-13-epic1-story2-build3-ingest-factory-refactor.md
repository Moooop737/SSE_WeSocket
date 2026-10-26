---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-13
story: 1.2（添加网页 URL 入库）
build: 3
status: in-progress
persona: Amelia (Senior Software Engineer)
---

# Handoff — Epic1 / Story1.2 / Build3：入库管线工厂重构落地 + repo 三方法 + pipeline 实跑测试

## 〇 · 一句话状态

本 build 把 story 1.2 的入库链路**从旧的 `orchestration/ingest.ts + runIngest` 一刀重构为 Recipe→PipelineFactory→run/batch(KBData) 工厂模型**，并**拔掉全部旧路径、不留兼容层**。落地后端到端 `tsc --noEmit` 全绿；新写的 `pipeline-factory.test.ts` **真连 DB+Ollama+URL 跑通 6 个用例**（ready 迁移、幂等拒绝、空正文失败留痕、batch 隔离、未知策略名抛错）——这是 story 1.2 主线**第一次拿到实跑证据**。**但 story 1.2 仍未 done**：HTTP 端点从没经服务器冒烟、两条 AC 没实现/没测（见 §五）。大量改动未提交，`app/` 被 gitignore，后端源码仍不在 git。

## 一 · 工程在哪

- 后端：`app/server/`（Hono + Node + TS，`tsx watch --env-file=.env src/index.ts`）。测试：`npx vitest run`（或 `test:ui`）。
- 本轮重构后的核心文件：
  - `src/pipeline/contracts.ts`：`Recipe`(fetcher/parser/chunker/embedder 名字 + repo + config) / `PipelineConfig` / `KBData` / `Pipeline{run,batch}` / `IngestResult{resource|null,chunkCount,failure?}` / `StageRegistry` / `IngestContext{data,fetched?,parsed?,chunks?}`
  - `src/pipeline/pipelines.ts`：`PipelineFactory.assemble(Recipe)→Pipeline`；`runOne(KBData,Signal?)` 生命周期；`IngestError`
  - `src/pipeline/recipes.ts`：`createStageRegistry()` 名字→构造函数目录（embedder 'qwenembed' 从 config 取 baseUrl/model/dimensions，其余策略 P1 不消费 config）
  - `src/ports/repository.ts`：新增 `updateResourceTitle` / `findActiveBySource(url)` / `writeChunksWithEmbeddings(同事务)`；**移除** `createChunks` / `createEmbeddings`
  - `src/adapters/paradedb-repository.ts`：实现上述三方法，删两旧方法
  - `src/bootstrap.ts`：`Deps={config,pool,repo,pipelineConfig,factory}`；buildDeps 里 `new PipelineFactory(createStageRegistry())`
  - `src/routes/resources/resources.ts`：**单一 `POST /resources`**（url XOR content），路由层选策略名 + 校验 body + 组 Recipe/KBData + 调 `factory.assemble(recipe).run(data, c.req.raw.signal)`
  - `src/index.ts`：`app.route('/resources', createResourcesRoute({repo,factory,pipelineConfig}))` 单挂载
- 本轮**删除**：`src/orchestration/ingest.ts`、`src/routes/resources/resources-text.ts`（连同空的 `src/orchestration/` 目录）。

## 二 · 本轮完成（均实测）

| 项 | 结果 | 复验 |
|---|---|---|
| 工厂重构落地 | Recipe→assemble→Pipeline.run/batch，旧 ingest.ts 全拔 | `tsc --noEmit` EXIT=0 |
| repo 三方法 | updateResourceTitle/findActiveBySource + writeChunksWithEmbeddings(事务) | 类型 + 测试实跑 |
| 路由收敛 | 单 POST /resources 分 url/text 两分支 | 编译 + 结果映射(409/422/201) |
| **pipeline-factory.test.ts** | **6 用例真跑通**（见 §三） | `npx vitest run test/pipeline-factory.test.ts` Tests 6 passed / 13.3s |
| 4 stage ctx.input→ctx.data | fetch/parse 全改用 `ctx.data` | 编译 + parser 测试同步改 |

**pipeline 测试实测数据（Vitest Console 可见 peek 中间值）**
- markdown → `status=ready, chunkCount=1`，落库块数一致
- 真实 URL → `ready`，标题回填成「快速上手 · WeKnora 文档」，`chunkCount=16`
- 同 URL 重复 → 第二次 `resource:null, code=E_DUPLICATE`（不建行）
- 空白正文 → 建行后 `status=failed, reason=解析后无正文`
- `chunker:'nope'` → assemble 抛 `IngestError(/未知 chunker: nope/)`
- batch → `[甲 ready, 乙 failed]` 各跑各的，一条失败不阻断

## 三 · 关键决策 / 坑（务必照此续做）

1. **三参数分层**：`AppConfig`(进程 env) / `Recipe`(工厂输入=策略名+repo+config，**不含数据**) / `KBData`(每次 run/batch 喂的业务数据)。工厂 assemble 只做名字→实例兑换 + 捆 repo，**零来源分支**；来源→策略名的判断住在路由。
2. **Signal 只喂长操作**：`fetcher.run(ctx,Signal)`；**`fail()` 落库改状态绝不复用 Signal**（aborted 的 signal 会把"失败留痕"一起杀掉，行卡在 processing）。见 pipelines.ts:55-59。
3. **title 优先级**：用户给的 > parse 出的 > 建 processing 时用 hostname 占位。parse 后若非用户给定且不同则 `updateResourceTitle` 回填。
4. **幂等=拒绝**：`findActiveBySource` 只拦 ready/processing；`failed` 同 URL 允许重抓。查重命中在建行前 → `resource:null`。
5. **0 块/空正文**：parse 后 text 空 → fail('解析后无正文')；chunker 出 0 块 → fail('内容为空')。
6. **embed 一致性**：vectors 与 chunks 同序、长度不等判 `embedding_error`；写走单事务，杜绝"就绪但缺向量"。
7. **exactOptionalPropertyTypes 坑**：KBData 可选字段不能显式塞 `undefined`；路由里用 `...(title?{title}:{})`。`noUncheckedIndexedAccess` 下平行数组用 `chunks[k]!`/`vectors[k]!`。
8. **测试自解析 env**：项目没装 dotenv，`pipeline-factory.test.ts` 用 `readFileSync(new URL('../.env',import.meta.url))` 手挑 DATABASE_URL/OLLAMA_BASE_URL/EMBEDDING_MODEL/EMBEDDING_DIMENSIONS，**别用 loadConfig()**（它还要 DEEPSEEK_API_KEY 且会 throw/exit）。afterAll 级联删本轮建的资源行 + `pool.end()`。
9. **别把 `const URL` 当变量名**（test 里会遮蔽全局 `URL`，`new URL()` 报 TS2351）；用 `TARGET_URL`。
10. `tsconfig` 已 `noEmit:true`；验证一律 `npx tsc --noEmit`。**别对 tsc 用 `tsx`**（`tsx tsc` 会把 tsc 当模块路径→ERR_MODULE_NOT_FOUND）。

## 四 · 未提交 / git 大坑

- 后端源码全在 `app/` 下，被 `.gitignore` 忽略 → **不进版本控制、不可 git 回滚**（本轮删的 ingest.ts/resources-text.ts 是真删，非可恢复）。收尾提交前 Lynx 先定 `app/` 是否纳入 git（agent 别擅改 .gitignore）。已存记忆 `gitignore-app-not-tracked`。

## 五 · story 1.2 还差什么（AC 对照后）

**代码 + pipeline 测试已覆盖的 AC**：有效 URL→ready+halfvec/BM25 落库、chunk 保留定位、幂等拒绝、非法输入拒绝不建行、建行后才失败→failed 附原因、0 块/空正文失败、batch 隔离、取消信号的**代码路径**（Signal 已贯穿 run/batch/fetcher）。

**还差（下一步真活）**：
1. **HTTP 端到端冒烟从没跑过**：起服务器 → `GET /health`、`GET /resources`、`GET /resources/:id/chunks`；`POST /resources`(url & text 两种 body)、重复→409、坏 body→400、失败→422、abort 取消。**注意 index.ts 之前有把路由挂错 `/` 的历史坑，本轮已改 `/resources`，但要实测确认端点进得去。**
2. **AC「命中 JS 渲染/反爬来源 → 提示'可能抓不全'，不阻断其他」完全没实现**：HttpFetcher/HtmlParser 无此类检测；现状只会走 fail('解析后无正文') 或静默 ready。需在 parse 后按信号（正文极短/命中反爬特征）产出 warning，而非静默。
3. **两条失败/取消 AC 没测试**：embed 失败→`failed(embedding_error)`、fetch 中途 abort→取消，可分别用假 model 名/极短超时 + AbortController 强制触发（尚未落码）。

## 六 · 下一步（建议，未放行）

最小一刀 = **HTTP 端到端冒烟**（补 §五.1）：起 `tsx --env-file=.env src/index.ts`，curl 打全 5 个端点 + url/text/重复/坏输入四种 POST，贴真实响应给 Lynx 看。随后再议：补"可能抓不全"提示（§五.2）与 embed/abort 两个失败态用例（§五.3）。给「进行」再动码，一次一步、Lynx 带节奏。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图；只有明确放行才写码且最小一步（本轮 Lynx 说"这次你来改吧"才落的码）；开发节奏由 Lynx 主导、不跨 story 自主进行。重构直接拔旧路径、不写兼容层/过渡管道（已存记忆 `feedback-no-compat-shims`）。验证：`tsc --noEmit` 挡类型 + 真请求/真 DB+Ollama 冒烟看行为（偏好真实网络、能看中间值 → peek + Vitest Console/UI）。沟通：先结论、分点、少黑话、中文。
