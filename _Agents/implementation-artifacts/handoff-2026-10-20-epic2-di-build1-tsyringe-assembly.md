---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-20
story: Epic 2 附带一刀 · 装配面换 DI（tsyringe，`Deps` 袋子退役）
build: 1
status: review
persona: Amelia (Senior Software Engineer)
---

# Handoff — DI 改造 / Build1：`Deps` 袋子退役，八格 `@singleton()` 类自我注册

## 〇 · 一句话状态

`app/server` 的装配面不再传袋子：`src/bootstrap.ts`（149 行，含 `interface Deps` 9 格、`buildDeps()`、`assertChatModel()`、`pickEmbeddingTarget()`、`loadAppConfig()`、`startServer()`）**整文件删除**，取而代之是 8 个 `@singleton()` 类自己在模块被 import 时注册、三条路由写成 `@injectable()` 类且 `build()` 零参数、`index.ts` 只剩 4 行 `container.resolve(...)` 加一段必须 await 完再 serve 的 IIFE。库选 **tsyringe**（Lynx 要的 Spring 式装饰器），**全项目一行 `container.registerInstance` 都没有、也没有 token 表** —— 类本身就是 token。HTTP 面行为零变化（除两处 Lynx 当场拍下的规则变化，见 §三 5、6），已真跑证明。三笔提交已进内层 git（`589c404` / `e35c7c3` / `d5dee62`），工作区干净。

## 一 · 工程在哪

- **新增依赖**：`tsyringe@4.10.0` + `reflect-metadata@0.2.2`；`tsconfig.json` 只开 `experimentalDecorators`（**故意不开 `emitDecoratorMetadata`**，旁边写了两行英文理由：tsx/esbuild 不产出元数据，按类型自动装配在这套工具链上是死的，所有注入位一律显式 `@inject(Token)`）。
- **8 个 `@singleton()` 类**（类自己就是 token）：
  | 类 | 文件:行 | 注入位 | 交出什么 |
  |---|---|---|---|
  | `AppConfig` | `src/config.ts:16` | 无 | 12 个 `readonly` 字段；env 装载与校验都在构造器里 |
  | `ModelRegistry` | `src/adapter/model/registry.ts:46` | 无（内部调 `providerRegistry()`） | `languageModels` / `embeddingModels` 两张表 + 末尾打 `I_MODELS` |
  | `PostgresRepo` | `src/adapter/contract.ts:138` | `@inject(AppConfig)` | `implements Repo` 21 方法，内部私有持池 |
  | `EmbeddingTarget` | `src/adapter/contract.ts:100` | `@inject(AppConfig)` `@inject(ModelRegistry)` | `model` + `modelId` + `dimensions`（名字不在册 ⇒ `E_EMBEDDING_MODEL` + `exit(1)`） |
  | `ChatHandle` | `src/adapter/contract.ts:121` | 同上 | 只有 `model`（不在册 ⇒ `E_CHAT_MODEL` + `exit(1)`） |
  | `InflightRegistry` | `src/ingest/inflight.ts:15` | 无 | 进程级取消登记 Map |
  | `IngestFactory` | `src/ingest/ingest.ts:34` | 构造器内 `container.resolve(InflightRegistry)` | 0 参构造，注册表自己 `createStageRegistry()` |
  | `RetrieverFactory` | `src/retrieve/retrievers.ts:33` | 无 | 0 参构造，注册表自己 `createRetrieverStageRegistry()` |
- **3 个 `@injectable()` 路由类**，`build(): Hono` **不收参数**：`ResourcesRoute`（`routes/resources/resources.ts:27`，注入 Factory/Inflight/Repo/Embedding）、`RetrieveRoute`（`routes/retrieve/retrieve.ts:23`，注入 Factory/Repo/Embedding/Config）、`ChatRoute`（`routes/chat/chat.ts:23`，再多加 `ChatHandle`）。`build()` 内第一件事是把注入字段别名成小写局部（`const repo = this.repo`），于是 180 行端点正文一个字没动 —— 这一刀的可读 diff 因此集中在类壳与构造器。
- **改接线**：`src/index.ts`（装配根，见 §三 1）、`src/retrieve/contracts.ts`（`RetrieverConfig` 接口删除、`RetrieverDeps` 去 `vectorDimensions`、`config` 的类型直接是 `AppConfig`）、`src/retrieve/fusion/rrf.ts` 与 `src/retrieve/search/paradedb-vector.ts`（旋钮读取机械改名 `retrievalRrfK` / `retrievalDefaultLimit` / `embeddingDimensions` / `retrievalMinSimilarity`）、`src/agent/chat/chat.ts`（`ChatDeps{models,chatModel}` 接口删除 ⇒ `createChat(Handle: ChatHandle)`，那句 `!` 非空断言消失）。
- **删除**：`src/bootstrap.ts`；`ConfigError` 类；`assertChatModel()`；`pickEmbeddingTarget()`；`loadConfig()` 出口；门上的 `createRepo` / `modelRegistry` / `providerRegistry` 三个出口；`E_DIMENSION_UNKNOWN` 整条（含两条路由的 409 判断与文件头表述）。
- **仍是空壳、归 Lynx**：`src/agent/tool/registry.ts`（Story 2.6 他正在写；`execute` 那一行是我补的占位回声，见 §三 8）。
- **`/health` 没变成类**：`index.ts:26` 仍是 `createHealthRoute(createHealthProbes(config, repo))` 显式传参。它是唯一还手工接线的挂载点，本轮刻意不统一（探针定义不是路由依赖）。

## 二 · 本轮实测（真库 + 真 Ollama + 真 DeepSeek，全部真跑）

| 场景 | 实况 |
|---|---|
| DI 装配探针 | `test/probe-di-routes.ts`（`npx tsx` 跑）：八格 `@singleton()` 全部可构造、两次 `resolve` 同一实例、`EmbeddingTarget.model` 与 `ChatHandle.model` 逐个等于 `ModelRegistry` 表里那一行、三条路由可 resolve、`build()` 都返回 Hono |
| 类型闸门 | `npx tsc --noEmit` **31 条**：**`src/` 只有 2 条**（`agent/tool/registry.ts:6` 的 `TS2883` 一对，Lynx 的 2.6 WIP，`ai` + `declaration:true` 不可命名，未拍修法），其余 29 全在 gitignore 的 `test/`（`probe-chunk-shape.ts` 13 条 = 基线旧错；`ingest-factory.test.ts` 5 + `probe-retriever.ts` 11 = 本轮签名连带） |
| 闸门可信性 | 计数前先跑 canary：插 `const canary: number = 'x'` ⇒ tsc 报出来 ⇒ 撤掉 ⇒ 回 31。**这一步不能省**：本会话前几个小时我一直把"0 错"当真，实际是他那处 `execute` 语法错关掉了全项目语义检查 |
| 启动 | `npm start`（不带 watch）日志顺序 `I_MODELS` → `I_VECTOR_DIMENSIONS 库中向量维度=1024 检索维度=1024` → `Server listening on http://127.0.0.1:3000` |
| `/health` | 200，四格探针（db / ollama / ollama_models / ollama_running）全绿 |
| `/retrieve` 逐旋钮 | 200 有命中：默认 `limit=6`、`vectorCount=10`、`lexicalCount=10`；`minSimilarity` 实读 ≥0.42 生效（最低命中 0.4324）；RRF 名次分单调；body 里 `limit:2` 覆盖生效 |
| 跨请求共享实例（关键） | 后台 `POST /resources` 打慢 URL → `GET /resources` 抓到 `status=processing` → `POST /:id/abort` 得 **202**（不是 409 `E_NOT_INFLIGHT`）→ 入库请求终为 `E_CANCELLED` → `DELETE /:id` 204。**202 就是"两条请求共用同一个 `InflightRegistry`"的证明**，探针与单测都证不出来 |
| fail-fast 负例两路 | `DATABASE_URL` 缺失 ⇒ 一行 `{"code":"E_CONFIG_MISSING",…}` + 真实 **exit 1**（单独量过退出码，不是管道 tail 的）；`EMBEDDING_MODEL=not-a-model` 与 `CHAT_MODEL=not-a-chat` ⇒ 各自 `E_EMBEDDING_MODEL` / `E_CHAT_MODEL` 一行 + exit 1。**文案与 JSON 形状搬家前后一字未变** |
| 每请求现查维度的代价 | `dimensionsInStore()` 实测 **56.29ms/请求**（50 行表，几乎全是远程库 RTT；`dimension` 列上无索引） |

## 三 · 关键决策 / 坑（务必照此续做）

1. **`index.ts` 是唯一的装配根**（除了 `config.ts` 自带 fail-fast）。顺序是约束不是风格：`resolve(PostgresRepo)` + `resolve(AppConfig)` → 挂 `/health` → 三条路由 `.build()` → `await cleanUpOnBoot(repo, config)` → 才 `serve()`。**CJS（`type: commonjs`）写不了顶层 await**，所以末段是 `void (async () => { ... })()`，且**外层括号语法必需**（`node --check` 实测 `async () => {}()` 报 `SyntaxError: Unexpected token '('`）。
2. **不建 token 表**（Lynx：「不要注入tokens表」）。后果：`interface Repo` 这类"只有形状"的声明必须有对应的 `class ... implements Repo` 才能被注入。换来的是**token 拼写在编译期就红**（TS2552 带 "Did you mean"），而字符串键位拼错要到运行时才炸。
3. **选择位与校验位同处一构造**：`EmbeddingTarget` / `ChatHandle` 自己拿名字去 `ModelRegistry` 兑换、不在册就当场点名退出。`assertChatModel()` 因此是冗余的（它本来就是这句组合的替身），整删；`agent/chat/chat.ts` 的 `!` 非空断言因此消失。**判据**：代码里出现 `!` 的地方，就是"选择"和"校验"被拆成两处的地方。
4. **`vectorDimensions` 的全局持有被否掉，改成每次检索现查**（Lynx 拍「这个不需要了，每次retrive工厂去repo直接查」）。先否了"塞进 `AppConfig`"（构造器不能 await；`config.ts` 反向 import `adapter/` 成环；库不可达从"降级"变"起不来"），也否了我给的甲（`DimensionProbe` 可变壳）与乙（async bootstrap）。**行为变化两条**：三态塌成两态 ⇒ `E_DIMENSION_UNKNOWN` 整条删；库不可达时异维检查抛到 catch ⇒ `/retrieve` 冒 **500 `E_RETRIEVE`**。启动那次探测留成**纯日志** `I_VECTOR_DIMENSIONS`，不再往任何地方写值。AC「绝不 BM25-only 静默作答」仍守住。
5. **`RetrieverConfig` 删除**（Lynx：「让检索层直接读」）。`RetrieverDeps.config` 的类型就是整份 `AppConfig` ⇒ 检索层类型上看得见 `databaseUrl` / `host` / `port`。这是明付的代价：宁可可变宽，也不留一类"改名层会漂移"。**别再把它包回去。**
6. **env fail-fast 内移进 `AppConfig`**（Lynx：「放进config里吧」）。`fail(code, message)` 打印 + `process.exit(1)` 就住在 `config.ts`，`ConfigError` 与 root 侧的 try/catch 一起删。**为什么必须这样**：`AppConfig` 若是被别人的 `@inject` 拉起来构造的，构造里抛出的自定义错会被 tsyringe **重新包成 plain `Error`** —— `instanceof` false、`cause` undefined、`code` 整个丢失、`exit(1)` 不再执行（变成 uncaught 多行堆栈，违反 SPINE 的"日志单行结构化 JSON"）。**明付的代价**：这条路径从此**不可被 catch**，要断"缺 `DATABASE_URL` 报 `E_CONFIG_MISSING`"只能开子进程看退出码与 stdout（`config.ts` 文件头已写这句）。
7. **tsyringe 默认生命周期是 Transient，和 Spring 的 singleton 相反**（实测）。有身份的东西（池、取消登记处、句柄表）绝不能在被注入方 `new` —— `new` 会**静默造出第二份**，两份 Map 各记各的 abort，症状就是"按了取消没反应"（409 `E_NOT_INFLIGHT`）。唯一一处 `container.resolve` 在根之外：`IngestFactory` 构造里 resolve `InflightRegistry`。
8. **`src/agent/tool/registry.ts:14` 的 `execute` 是我补的占位回声** `async ({ prompt, topK }) => ({ prompt, topK })`，作用只是杀掉 TS1109 把语义检查闸门换回来。**不要当成 2.6 的进展**；他真接线时直接替换。它换来的两条 `TS2883`（`src/` 现存的 2 条就是）修法待他拍：注 `const RegistedTools: ToolSet` 可解但丢字面量推导。
9. **一次大重构中途要提交**。2026-10-16 那晚的 typed-inject 整刀从没进过 git，回到机器上已凭空消失、只能重做（记忆 `di-container-replaces-deps-2026-10-16`）。本轮按 Lynx 节奏切三笔：`589c404`（包 + tsconfig + 前三格）、`e35c7c3`（路由与工厂）、`d5dee62`（review 修复）。
10. **review 抓到并已修的时序缺陷**：`cleanUpOnBoot` 原先没 await 就 `serve()` ⇒ 窗口期进来的请求读到尚未收口的 `processing` 行（AD-7 的清扫语义被打穿）。旧注释把这条保证归给了**错的机制**（"先给 null"），已改写。同类缺陷记进 `deferred-work.md`（"serve 之前必须完成清扫"没有类型或测试钉住）。

## 四 · 提交 / git

`app/server` 是嵌套 git（外层 `.gitignore` 忽略 `app/`），内层忽略 `test/` ⇒ 本轮新增的 `test/probe-di-routes.ts` 不进版本控制，是**可丢弃的探针**，不是被测面。

三笔提交都在内层 git，`git status --short` 干净。diff 面（`0372d74..d5dee62`）：20 文件、+659 / −568，其中 `src/bootstrap.ts` −149、`routes/resources/resources.ts` ±291（函数变类壳）。外层仓库这轮没动 `app/`（被忽略）。**本轮不代提交**，收尾文档按分工交给 Lynx 过目。

## 五 · 还差什么

- **`test/` 29 条签名连带**未修（等放行）：构造器变 0 参、`createRepo`/`modelRegistry`/`providerRegistry`/`RetrieverConfig` 出口消失、`RetrieverDeps.vectorDimensions` 没了。**断言一条都没松**，纯机械替换调用点。另有 13 条是 `probe-chunk-shape.ts` 的基线旧错（早于 DI）。
- **Story 2.6 的检索工具化**仍归 Lynx：`agent/tool/registry.ts` 的 `execute` 是占位回声，`/chat` 那一跳还没接上工具。
- **启动顺序的宿主与语义下限**（`serve` 前必须完成清扫，现无防线）→ `deferred-work.md`。
- **`I_MODELS` 打印住在 `ModelRegistry` 构造里** ⇒ 日志顺序由 resolve 顺序决定，不由"这是启动信息"决定 → `deferred-work.md`。
- **ingest 链路零自动验证**：这一刀动了它的装配形状，跑得通它的只有那次真 HTTP 端到端 → `deferred-work.md`。
- **库不可达时 `/retrieve` 冒 500，而 `/chat` 的契约是"一律 200 答案体"** —— 删掉 `E_DIMENSION_UNKNOWN` 之后这个不对称显形了 → `deferred-work.md`。
- **`config.ts` 从此 import tsyringe**：配置装载与容器绑在一起。要退回"纯函数读 env"就得再拆一次，本轮不做。

## 六 · 下一步（未放行）

最顺的一格是 Lynx 自己把 Story 2.6 的 `execute` 接到真检索（`RegistedTools` → `RetrieverFactory`；装配面已经不需要再动，工具里 `@inject` 或直接 `container.resolve(RetrieverFactory)` 都走得通）。之后是 `test/` 那 29 条调用点收口 —— 那是机械活，但**要 Lynx 点头才动测试**。若有人想再动装配面：先读 `index.ts` 与 `config.ts` 的文件头，这两处现在就是这套装配的现况说明。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图与实测；本轮每一处 src 改动都由他的显式放行词驱动（「进行」= 他打；「你来写/落码」= agent 打）。方案中途换过一次：10-16 的 typed-inject 整刀作废且已丢，10-19 起用 tsyringe 重做。前端 `app/web` 一行未动。文档同步：`ARCHITECTURE-SPINE.md` 6 行、`deferred-work.md` 新增一节 6 条、`LEARNING.md` 新增本轮一节。沟通：先结论、分点、具体可核对、中文。
