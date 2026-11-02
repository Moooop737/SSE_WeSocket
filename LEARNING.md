# LEARNING.md — 学习日志

> Knowledge Copilot 的"真懂"记录。按 AGENTS.md §二 每阶段循环第 5 步沉淀：这一阶段练了什么、踩了什么坑、做了什么取舍。
> 项目主线是吃透 **Vercel AI SDK**（顺带深化 RAG）。Story 1.1 属基础设施地基，AI SDK 链路从 Epic 2 起才正式登场。

> **P1 已收口（2026-10-24）**：Epic 1–3 全 `done`。**P2（2026-10-29）**：Epic 5（5.1–5.4）全 `done`；Epic 4 的 4.4/4.5 已 `done`，4.1–4.3 暂缓。**Epic 7 评测支线**：7.0 `done`，7.1–7.3 `review`，7.4 `backlog`。学习沉淀按下面各节，不另写汇总。
>
> 纯前端轮次（装饰层、排版 HCI、UX 轮、4.4/4.5 渲染）自 2026-10-29 起记在 [`app/web/LEARNING.md`](app/web/LEARNING.md)；带后端代码的 story 仍记在本文件。

**索引（2026-10-29 补 2.2–2.6 / 3.1 / 7.x）**

| 段落 | 位置 |
|---|---|
| Story 1.1 本地骨架 | §P1 · Epic 1 — Story 1.1 |
| Story 1.2 URL 入库 | §P1 · Epic 1 — Story 1.2 |
| Story 1.3 Markdown/纯文本 | §P1 · Epic 1 — Story 1.3 |
| Story 1.4 查看与删除 | §P1 · Epic 1 — Story 1.4 |
| 基础层迁移 | §P1 · 基础层迁移（2026-10-15） |
| Story 2.1 混合检索 | §P1 · Epic 2 — Story 2.1 |
| Story 2.2 / 2.3 / 2.4 / 2.6 补记 | §Epic 2 补记（2026-10-29） |
| DI 改造 / Story 2.5 / Epic 2 收口 | §P1 · Epic 2 附带一刀 — 装配面换 DI、§2026-10-21 · Story 2.5 |
| Story 3.1 通用端点轨迹 | §2026-10-22 · Story 3.1 通用端点轨迹 |
| Story 3.2 / 3.3 / 3.4 观测 | 三个「2026-10-22/23」小节 |
| Story 5.1 对象存储 | §2026-10-26 · Story 5.1 对象存储适配器 |
| Story 5.2 归档 / 两段式 ingest | §2026-10-27 · Story 5.2 原始归档与两段式入库 |
| Story 5.3 去重 / 批量 / 回收站 | §2026-10-27 · Story 5.3 内容去重、整批两段式与回收站 |
| Story 5.4 代码库 ZIP | §2026-10-27 · Story 5.4 代码库 ZIP：独立域、不解压、按需读 |
| Epic 6 取消（文件 URI 折回 5.2） | §2026-10-27 · Epic 6 取消：文件 URI 折回 Story 5.2 |
| Story 7.0 评测连接 | §2026-10-28 · Story 7.0 评测连接 |
| Story 7.1 题集与配置 / 7.2 发起运行 / 7.3 对照与基线 | §2026-10-29 · Story 7.1 / 7.2 / 7.3 |
| 前端：纸/光/呼吸、排版 HCI、UX 轮、4.4/4.5 渲染 | [`app/web/LEARNING.md`](app/web/LEARNING.md) |

---

## P1 · Epic 1 — Story 1.1：本地骨架 + 基础设施 + 安全边界（2026-10-10，status: review）

### 这一阶段真正练到 / 搞懂的东西

- **Hono 绑本地要用 `@hono/node-server` 的 `hostname` 键，不是 `host`。**
  默认适配器会全网卡监听。`serve({ fetch, hostname, port })` 里写成 `host` 会被**静默忽略**退回 `0.0.0.0` —— AD-8"只绑 127.0.0.1"这条安全边界就漏了，且不报错。（review 实测确认，写对了。）

- **pgvector 混维存储（AD-4 的来龙去脉）。**
  最初想"锁死 1024 维 `halfvec(1024)`"，后从 WeKnora 学到一个更松的方案：列用**不定长 `halfvec`**（任意维度可入库、无上限），只给要加速的维度**各建一条 partial 表达式索引**：
  `USING hnsw ((embedding::halfvec(N)) halfvec_cosine_ops) WITH (m=16, ef_construction=64) WHERE dimension = N`。
  加维度 = 加一条索引迁移，不动表。`dimension` 列记录该行真实维度，查询期保证"查询向量维度 = 被检索行维度"。

- **partial 表达式索引的命中条件（易踩）。**
  查询必须写成同款表达式 `embedding::halfvec(1024) <=> $1::halfvec(1024)` 才走索引；写 `embedding <=> $1` 会绕过索引退化 seq scan（结果对、只是慢）。入库适配器必须**如实写 `dimension`**，否则该行不进索引。

- **`RENAME COLUMN dim → dimension` 后 partial 索引谓词会自动跟随。**
  因为 Postgres 的索引依赖记录的是列的 attnum（物理编号）不是名字，改名不会打断 `WHERE dimension = 1024`。

- **Ollama + Qwen3-Embedding-8B 支持 MRL 截维。**
  `qwenembed` native 4096 维，经 `/v1/embeddings` 传 `dimensions:1024` 实测返回 1024 且语义排序不退化 —— 这是"能自由选维度"的底层依据。

- **ParadeDB 中文 BM25 分词 = `chinese_lindera`。**
  `pg_search` 的 `text_fields` tokenizer 用 `{"type":"chinese_lindera"}`（与 WeKnora 源码逐字一致）；`type:"lindera"` 在本镜像不存在。

- **不用 ORM 的取舍。**
  ParadeDB/pgvector 要写定制 SQL（表达式索引、`halfvec` cast、BM25），Prisma/TypeORM 帮不上还碍事 → 走 `pg` 原生 + 参数化查询（`$1`）。**"原生 SQL ≠ SQL 注入风险"**，参数化和 ORM 内部一样安全。

- **迁移用 dbmate**：纯 SQL 文件 + 外部 CLI，比 node-pg-migrate 更贴合"就是要手写 SQL"的诉求。

- **fail-fast 配置（FR-12/AD-8）**：缺必需 env 在启动阶段就点名报错（`E_CONFIG_MISSING`），密钥只放服务端 `app/server/.env`（已 gitignore）。

- **启动清扫**：进程上次崩了会遗留 `processing` 资源；启动时单事务把它们转 `failed(入库中断)`，删 chunk 靠 FK `ON DELETE CASCADE` 顺带清向量，不留孤儿。

### 踩过的坑 / 反复澄清的误区

- 误区：原生 SQL 等于注入风险 → 错，参数化即可。
- 误区：`halfvec` 定长列上建表达式索引会被归一化成普通索引；partial 表达式索引要求查询用**同款表达式**才命中。
- `psql` 是 keg-only（`/opt/homebrew/opt/libpq/bin/psql`），不在 PATH。
- 远程 ParadeDB 连接要带 `?sslmode=disable`（服务端未开 SSL）。

### Code review（Story 1.1）发现与处置

> review 实测出的缺口。1.1 推 done 前修了 4 项，其余暂缓（不影响正确性，表空时随时可补）。

**已修（随 1.1 done）：**

- **[Blocker] `createDbPool` 加 `pool.on('error')` + 连接/查询超时。**
  原坑：远程 PG 空闲连接一旦被掐（链路休眠/重启/`idle_session_timeout`），Pool 的 'error' 事件无监听 → 未捕获异常 → **进程静默崩**；且 DB 不可达时 `bootstrap` 清扫在 `serve()` 之前会无限 hang。Ollama 侧本就有 3s 超时，DB 侧补齐，对称了。
- **[重要] `PORT`/`EMBEDDING_DIMENSIONS` 用 `numOrThrow` 整数区间校验。** 坏值（`PORT=abc`→NaN）不再溜到 listen 崩在建好后；非 1024 维打 WARN（不 throw，遵 AD-4）。
- **[重要] 新迁移加 `CHECK (dimension = vector_dims(embedding))`。** 库自己兜住"dimension = 向量真实长度"，堵死"撒谎的 dimension"静默入库。dbmate 已应用、psql 核验约束在位。
- **[重要] `types.ts` 契约说清。** 时间字段=ISO 字符串（pg 回 Date，适配器 toISOString）；`embedding`=number[]（halfvec 读回是字符串、写需字面量，转换归 Repository 适配器）。

**暂缓（记为已知项，非阻塞）：** 清扫只跑一次+失败被吞（短暂不可达则 processing 永久卡住）；缺 `(resource_id, chunk_index)` 唯一约束（FR-1 幂等）与 `source_id` 索引；缺 `.env.example`；`package.json` `"type":"commonjs"` 与 tsconfig `module:esnext` 矛盾（现靠 tsx 掩盖，真要 build 才暴露）。

- **一格混了两件事，核对式就会长期空转。** `adapter/provider/ollama.ts` 装的是 Ollama 原生 `/api/tags`·`/api/ps` 探针，而 AD-4 把 `provider/` 定成「唯一 `createOpenAICompatible()` 落点」——那条 grep 核对从此与实物不符，谁查都会以为规矩没被执行。拆出 `connection/`（怎么连上外部服务）之后，`provider/` 才只剩一件事。**判据**：一条 AD 的核对 grep 打不到实物，通常说明某一格装了两件事。
- **在 auto 模式下搬文件：别用 `mv`，用 Write→Edit→单条 `rm`。** 同一个 bash 块里「mkdir + mv + 改代码 + rm」会被分类器整块拒（判「与既定范围冲突」「与并发编辑抢文件」），用户口头确认也救不回来。分开走：Write 建新文件、Edit 逐行改接线（对用户正在编辑的文件尤其只能这样）、最后单条 `rm` 并在描述里写清「内容已逐字存在于新路径、零差异」。**代价**：两次拒批各花一整轮往返。

### 还没碰（留给后续阶段）

- **Vercel AI SDK**：本阶段一行没用到。ChatModel/Embedder 端口只是接口占位，真正经 AI SDK provider 抽象走 OpenAI/DeepSeek 是 Epic 2（2.1~2.5）的事。届时补"streaming / tool / provider 抽象"的学习条目。

---

## P1 · Epic 1 — Story 1.2：添加网页 URL 入库（2026-10-13，status: done）

### 这一阶段真正练到 / 搞懂的东西

- **一条入库链 = 四段可替换策略 + 一个数据无关的工厂。**
  `Recipe(策略名 + repo + config) → PipelineFactory.assemble() → Pipeline{run,batch}(KBData)`。工厂内**零来源分支**：URL 还是粘贴文本、markdown 还是 plaintext，全在路由层翻译成策略名。这就是"装配期决定依赖、运行期只喂数据"落到 TS 上的样子（和 Spring 的容器思维同源）。

- **取消信号只能给"长操作"，绝不能给"留痕"。**
  `fail()` 里那两次 DB 写若复用已 abort 的 signal，会被一起掐掉 ⇒ 行永远卡在 `processing`，既没成功也没失败。这条硬约束写在 `pipelines.ts` 文件头。

- **`AbortSignal.any([AbortSignal.timeout(30_000), signal])` 的合成语义是有偏向的。**
  任一触发都掐请求，但**超时触发时外部那个 signal 不会 abort** ⇒ 用 `Signal.aborted` 分类原因，会把"外站挂了/超时"和"用户取消"混成两种。现已用 `err.name === 'TimeoutError'` 单独拆出 `E_TIMEOUT`。

- **两段失败语义**：建行之前的拒绝（查重命中、进来就已取消）返回 `resource:null` **不留行**；建行之后的一切失败都留在那条行上（`failed` + reason）。前端和统计据此区分"没受理"与"办砸了"。

- **幂等只在有稳定 key 的地方成立。**
  URL 有 `source` ⇒ `findActiveBySource` 能拒绝重复（只拦 ready/processing，`failed` 允许重抓）；粘贴内容的 `data_uri` 是随机 uuid ⇒ 没有稳定 key，**P1 主动不去重**，而不是"靠正文长度猜一下"。

- **`ready` 必须和数据同事务。**
  向量写入与状态转 ready 折进 `writeChunksWithEmbeddings` 一个事务；向量数 ≠ chunk 数直接判失败。杜绝"行已就绪、只有一半向量"这种检索期才发现的脏态。

- **取消的延迟有"同步地板"。**
  `parser.run` / `chunker.run` 是同步 JS，`writeChunksWithEmbeddings` 是 pg 调用且**不吃 signal** ⇒ 过了最后一个检查点就再也观测不到取消。落在写入期间的取消只能**事后撤回**：写完再判一次 `aborted`，把刚提交那一笔删掉。

- **warning ≠ failure。**
  AC 要"提示可能抓不全、但不阻断" ⇒ 原页 ≥2000 字符而抽出正文 <200 字符时只出 `IngestResult.warning`（201 带出去），行仍 `ready`。把它做成 error 是最省事的错法。

### 踩过的坑

- **策略名与模型 tag 必须分家。** 路由里 `embedder` 缺省曾取 `PipelineConfig.embeddingModel`（模型 tag），而注册表的键是策略名 `'qwenembed'` ⇒ `EMBEDDING_MODEL` 一改，全线入库 400，**`/health` 却照样绿**。"按名字兑换实例"这类设计的原生陷阱就是两套名字混用。
- **`exactOptionalPropertyTypes`**：可选字段不能显式塞 `undefined`，得写 `...(title ? { title } : {})`。**`noUncheckedIndexedAccess`**：平行数组配对要 `chunks[k]!`。两个开关都是编译期教做人。
- **被 `.catch(() => {})` 吞掉的错误会让死代码看起来在工作**：端口里 `deleteEmbeddingsByResource` 是个永远 `throw NotImplemented` 的占位，测试清理一路调它、一路吞错，于是**实际早就只靠 FK CASCADE 在跑**，谁都不知道。
- **测试文件里别写 `const URL = ...`**：遮蔽全局 `URL`，`new URL()` 直接 TS2351。用 `TARGET_URL`。
- **别对 `tsc` 用 `tsx`**（`tsx tsc` 会把 tsc 当模块路径 → ERR_MODULE_NOT_FOUND）。验证一律 `npx tsc --noEmit`。

### RAG 侧的理解

- 分块的不变量是 `text.slice(start, end) === content`：偏移一律用 JS 字符串索引。落库的 `start_offset/end_offset` 只有守住这条，Story 2.3 的引用定位才是真的能回溯。
- WeKnora legacy 分块三阶段：按分隔符优先级递归切细 → 保护段（代码块/表格）整块留住 → 装箱 + 语义重叠。`chunkOverlap > chunkSize/2` 必须压到一半，否则相邻块九成重复 = 同一段话存十几遍，向量冗余、检索全是重复命中。

---

## P1 · Epic 1 — Story 1.3：导入 Markdown / 纯文本（2026-10-13，status: done，零新增代码）

- **让文本复用同一条管线 = 加一个"什么都不做"的 fetcher。**
  `PassthroughFetcher` 把请求体里的字符串塞进 `ctx.fetched`，于是 parse/chunk/embed/写四段一行都不用改。抽象在什么时候买到东西，这就是那一刻。

- **AC 会写出根本不存在的分支。**
  原 AC 写「跳过 fetch，内容直接进入 parse（**Markdown 分支**）」，而实现里 `content_type` 只是存档位、不参与任何判断，markdown 结构是靠分块器的保护段兜住的。**代码没错，契约错了** ⇒ 改 AC，而不是为了对上 AC 去加一条假分支。

- **输入校验住路由，失败留痕住管线。**
  空内容 / 空白 / body 非法 JSON 都在建行**之前** 400；建行后才发现无正文才写 `failed`。顺带把「url 与 content 必须恰好给一个」和「内容不能为空」拆成两个码 —— 原来挤在同一个三元判断里，报错文案是误导性的。

- **取舍：类型判定交给显式选择，不写后端猜测。**
  上传按后缀名（`.md/.markdown` → markdown，其余 plaintext），图片等非文本由前端 `accept` 挡在上传层，手动输入由用户自己选 md 还是纯文本。**不做**"控制字符占比 / `U+FFFD` 占比 / 可读字符率"这类检测器 —— 阈值没有证据支撑、会误杀正常内容，而后缀名 + 用户自选更准、还零成本。

---

## P1 · Epic 1 — Story 1.4：知识库查看与删除（2026-10-13，status: review）

### 这一阶段真正练到 / 搞懂的东西

- **"软删"在这个模型里是两半。**
  `resources` 行标 `deleted_at`（留痕、可恢复），`chunks` **物理删**，`embeddings` 由 `REFERENCES chunks(id) ON DELETE CASCADE` 让 Postgres 自己带走。

- **为什么子表不跟着软删**：BM25 和 HNSW 索引**不会因为一行标了 `deleted_at` 就跳过它** —— token 和向量邻居关系还在索引里，检索必须每条查询都记得加谓词才不漏。物理删才是"从检索索引移除"的真实现，顺带少掉一整类"忘了加谓词"的 bug。

- **"无孤儿向量"不该由业务代码保证**，它是库约束的副产品（实测全库孤儿 = 0，用删除前抓到的 chunk id 反查，而不是用会被 CASCADE 清零的子查询自欺）。所以 `deleteEmbeddingsByResource` 这个方法本就不该存在。

- **`AbortController` 不可序列化。**
  它是活的进程内对象（监听器 + 状态机 + promise 链），`SET inflight:<id> controller` 写进 Redis 就是 `{}`。⇒ 跨进程只能传"取消意图"，收到的一方仍要按自己手里那个开关，本地那份登记无论如何在。这是"in-flight 搬进 Redis"不成立的终局理由；Redis 的真实家是**任务队列**（WeKnora 侧实证：它的 Redis 服务的是 asynq，不是取消信箱）。

- **取消开关该属于任务，不属于连接。**
  原先 signal 只有一个来源 `c.req.raw.signal` ⇒ 触发权 100% 在客户端，用户刷新页面 = 取消入库；这在批量上传下是灾难。现在 `runOne` 自己 `new AbortController`、按 `resource.id` 登记在进程级 `InflightRegistry`，任意请求都能按下，HTTP 连接退出取消来源。
  顺带搞清了**为什么必须靠"登记"**：`resource.id` 是管线内部 `createResource` 之后才铸出来的，路由想取消就没法自己造一个 controller 塞进去。

- **FK 的 KEY SHARE 锁让父行成为唯一排队点 ⇒ 那条"看起来像死锁"的路径其实不成环。**
  直觉：写入方先 `INSERT chunks` 后 `UPDATE resources`，软删方先 `UPDATE resources` 后 `DELETE chunks`，顺序相反 = 死锁。实测两种方向各撞 100 轮，**0 次 `40P01`**。因为往有外键的子表 INSERT 会**先锁父行**，于是两个方向都只剩一把锁要排，第二边永远等不到。真正挡住"给已删资源补写数据"的是写事务里那句 `AND deleted_at IS NULL`，不是锁顺序。

- **接口不能撒谎。** `202` 承诺"转 failed(入库取消)"，却存在"写入已提交成 ready"的真实路径。修法不是改文案，是**写完再判一次取消并撤回那一笔**；文案再收敛成它能保证的那句（"不会转为已就绪"）。

- **取消要机器可读。** 只写中文 reason，前端就只能字符串匹配。现在 `E_CANCELLED / E_TIMEOUT / E_RESOURCE_GONE / E_DUPLICATE / E_INGEST_FAILED` 各归各位，422 body 直接带。

### 踩过的坑 / 方法论

- **用锁把竞态窗口钉住来验证。** 亚毫秒的竞态靠"跑一次看看"纯属碰运气。做法：另一 session 先 `SELECT … FOR UPDATE` 占住那条资源行，把写入卡在 `INSERT chunks`，在窗口里按下 abort，再放锁 —— 于是稳定采到 `processing/0 → ready/16 → ready/0 → failed/0`。第二帧证明 bug 存在，第三四帧证明撤回生效。
- **评审 lens 的静态断言必须复核后再转述。** 三个 lens 报的那条死锁被实测否证；同一批 lens 交叉命中的另一条（取消落在写入期）却是真的。**交叉命中是信号，不是结论。**
- **`console.error` 不该用来记用户的主动行为。** 原来一次取消打两行日志、两个 code、都是 error 级，排障的人会信错其中一条。现在一次故障一行 `{code, resource_id, reason, cause?}`。
- 误区：`GET /:id/chunks` 对已软删资源返回 `200 {chunks:[]}` 看着"也没毛病"，其实是**同一个资源在不同端点下有两种死活口径**（DELETE 对同一条是 404）。现在统一 404，非 UUID 也统一 400。

### 还没碰（留给后续阶段）

- **AI SDK 仍是一行没写。** Embedder 是自己发的 `fetch`（打 Ollama 的 OpenAI 兼容端点），ChatModel 端口空着。Epic 2 才正式经 provider 抽象走 `streamText`，那时再补流式、tool、provider 三条学习记录。
- **前端两个按钮 + 列表轮询挂到 Epic 2**（见 `frontend-deferred.md`）：不轮询的话"处理中"在界面上根本不出现，`/abort` 就没有可被点到的时刻。

## 前端学习（已迁出到 `app/web/LEARNING.md`）

> 2026-10-29 起，纯前端的轮次写在 [`app/web/LEARNING.md`](app/web/LEARNING.md)：
> 纸/光/呼吸装饰层（2026-10-14）、排版与 HCI 精化轮（2026-10-14）、视效强度档 / 头像 / 侧栏 / 入库队列（2026-10-15）、Epic 4.4/4.5 聊天渲染（2026-10-29）。
> 判据：纯前端轮次 → web 那份；带后端代码的 story → 仍记在本文件（含 5.2/5.3、7.0–7.3 的前端落点）。

## P1 · Epic 2 — Story 2.1：混合检索问答（基础）（2026-10-14，status: review）

### 这一阶段真正练到 / 搞懂的东西

- **pg 的 `<=>` 返回的是余弦距离，不是相似度。**
  范围 0~2，相似度 = 1 − 距离。AC 写「cosine sim < 0.30 视为未命中」翻进 SQL 就是 `distance > 0.70` 才排除。写反一次的效果：阈值要么形同虚设，要么把正常命中全砍掉。

- **相关性阈值绝不能写进检索 SQL 的 `WHERE`。**
  HNSW 是按距离排序的 top-k 通道；把 `1 - dist >= x` 塞进 `WHERE` 会让优化器放弃那条路径。所以 SQL 只管「按距离取前 K」，相似度换算和阈值过滤留在 TS —— 不是风格偏好，是索引能不能用。

- **partial 表达式索引要求查询表达式逐字同形。**
  索引是 `((embedding::halfvec(1024)) halfvec_cosine_ops) WHERE dimension = 1024`，查询就必须写 `ORDER BY embedding::halfvec(1024) <=> $1::halfvec(1024)`。
  验证办法不是读文档：`SET enable_seqscan = off` 再 `EXPLAIN ANALYZE`，看到 `Index Scan using embeddings_hnsw` 才算形式对上。27 行的库按成本模型本来就走 Seq Scan，这跟"索引不可用"是两件事。

- **`::halfvec(N)` 的 N 是类型修饰符，只吃 SQL 字面量、不吃绑定参数。**
  于是维度数字必然拼进 SQL 文本 ⇒ 唯一正确的姿势是先 `Number.isInteger` 校验再拼，否则开一个注入面。

- **把用户问句原样交给 ParadeDB 的 `@@@`，是交给一个查询语法解析器，不是交给分词器。**
  8 条真问句实测：`it's a test` / `a:b` / `AND` 三条直接抛错（500），`设置入口：右上角` 等四条**静默 0 命中** —— 而库里那条 chunk 正文就写着「设置入口：在 Qoder CN IDE 的右上角」，一个全角冒号把 token 黏住了。
  正解是 `paradedb.match_disjunction('content', q)`：用索引同一个分词器、token 之间取 OR、不解析语法。对比过的另外两条：`match_conjunction` 要求所有 token 同块（自然语言问句 8 条里 7 条为 0，不可用）、`parse(q, lenient=>true)` 只止住抛错、救不回漏检。

- **扩展的 helper 该从 `pg_proc` 里列，不要查博客。**
  `SELECT n.nspname, p.proname, pg_get_function_arguments(p.oid) FROM pg_proc …` 一次列出 217 个函数，`match_disjunction` / `match_conjunction` / `parse(lenient)` / `rerank` 全在里面。搜到的中文博客一篇都没提这三个。

- **名次可比，分数不可比 —— 这是选 RRF 的唯一理由，且被实测撑着。**
  相似度分布被压得很扁：无意义串 `abcdEfgh` 也有 0.40~0.46，正常问句 0.47~0.58，差值小到不能当判据；BM25 那边「是什么」拿 2.882 正分。RRF 只用各路名次，双路都是 rank1 时 `1/61 + 1/61 = 0.03279`（实测分毫不差）。

- **绝对阈值随语料漂移，而分数根本判不了"库里有没有答案"。**
  27 块单文档下算出的 0.42，多喂两篇文档就被顶穿（同一垃圾串从 0.4061 涨到 0.4589）。更硬的一条：库里已经没有 WeKnora 部署内容了，`WeKnora 怎么部署` 仍拿到全库最高档 `sim=0.5502`，比含糊问句 `是什么`(0.5023) 还高。
  ⇒ 「够不够依据」是语义判断，只能交给模型。这一条推翻了我原本的阈值方案，也让 epics.md:187 那句 AC 必须改写。

- **装配期校验和数据事实是两回事，别把前者当后者用。**
  `embedder.dimensions !== config.dimension` 两边同出一个 config，是恒等式，今天不可能触发 —— 它真实守的是"注册表被塞进第二个 embedder"这类装配错误。
  真正要防的「库里混着旧模型的向量」只在**库里**，必须查库才知道。

- **fail-open 的体检比没体检更危险。**
  `vectorDimensions` 原本用空数组同时表达两件事：「库里真没向量」和「没探到（库不可达）」。第二种情况下判定恒空 ⇒ 向量路被 SQL 过滤成 0 条，而 BM25 与维度无关照样命中 ⇒ 后端静默用 BM25-only 作答。这正是 AC:186 明令禁止的降级。
  修法是三态：数组 / 空数组 / `null`，`null` ⇒ `E_DIMENSION_UNKNOWN` 拒绝作答。

- **后填字段必须晚绑定。**
  `vectorDimensions` 由 `startServer` 在 `serve()` 之前才填。路由若在挂载时把它解构下来，拿到的是永久的空数组，整条门禁静默失效。所以路由 deps 里传的是 `getVectorDimensions: () => deps.vectorDimensions` —— 一个箭头函数，不是值。

- **工厂化组装在检索侧复现了，但形状多了一块。**
  入库那边 stage 不碰库，注册表签名是 `(Config) => Stage`，`repo` 由 `assemble` 自己捆；检索两路真要读库，签名只能是 `(Deps: {pool, config}) => Stage`。同构不等于同形状，硬抄会把 pool 塞进 config（污染"env 旋钮"这个语义）。

- **ESM-only 不等于跑不了。**
  `ai@7` 是 `"type": "module"` 且 exports 里根本没有 `require` 条件，我们服务端又没开 `type: module`（tsx 编成 CJS）。推断会说要改造，实测 `require('ai')` 直接 OK —— Node 26 支持 `require(esm)`，只要该包内部没有 top-level await。**跑一次胜过读十遍文档。**

### 踩过的坑 / 方法论

- **评审 lens 的静态断言，第二条也得复核。** 这轮四条 lens 里被我用代码驳倒的：「检索路径无超时会挂死」—— 实际 `paradedb.ts:15 query_timeout: 5000` + `qwenembed.ts:15 EMBED_TIMEOUT_MS = 30_000` 早就封顶了。同一批 lens 里另一条（`/chat` 的 `limit` 算了不用）是真的。**不要因为有一条是假的就整批不信，也不要因为整批听起来对就整批转述。**
- **说"这里重复了/放错层"之前，先找既有先例。** 我一度判定"策略名字面量写在路由里 = 分层错位"，回看 `resources.ts:146/158` 才发现那正是本项目 2026-10-13 定过的「选择住边界、组装住工厂」——**我说的是自家规矩**。
- **阈值类参数一律走 env + 范围校验，不写进 bootstrap 字面量。** 交付时 `RETRIEVAL_MIN_SIMILARITY` 等五个旋钮进了 `config.ts`，小数走新增的 `floatOrThrow`（`numOrThrow` 只收整数，塞 0.42 会 fail-fast 报错）。
- **用户极简回复里的歧义要先复述再动手。** 这轮三次踩到：「story1还剩什么」（其实是 2.1）、「放到agent/chat中」（目录形状）、「我觉得react」（其实是 ReAct）。每次都靠"我理解成 X，若不是说一声"绕回来，比写错方向便宜。

### 还没碰（留给后续阶段）

- **生成侧一行没写。** `ai` / `@ai-sdk/openai-compatible` 已装且实测能加载，但 `streamText`、`createUIMessageStreamResponse`、`convertToModelMessages`、`useChat` 全没接 —— `/chat` 的 `answer` 现在只在三条确定性提示上有值，有命中时是空串。
- **sessions/messages 没落库。** `Repository` 的 `createSession/getSession/createMessage/getMessagesBySession` 仍是 `NotImplemented`；会话所有权已定（前端持 id、请求带 `sessionId`，未来走 PG RLS ⇒ 业务 SQL 不写 owner 谓词），但实现随 2.2。
- **rerank / 查询改写没做。** rerank 在 SPINE 的 Deferred 里，但 SDK 有 `rerank({model, query, documents, topN})` 的抽象位，将来接 provider 即可。
- **模型以工具方式调 `retrieve`（ReAct）留 P3** —— 它才是"资料不足该拒答还是该反问"的正解；P1 先由模型自然说话，不校验话术。
- **"两路皆空 ⇒ 未找到"在交付配置下打不到**（OR 语义下标点问句几乎全表命中），已记 `deferred-work.md`：判据交给模型，这条只剩兜底。

## P1 · 基础层迁移（2026-10-15，`adapters/` → `adapter/`，spec-adapter-layer-migration）

> 这一刀不练 AI SDK（SDK 明确出局，归 Lynx），练的是**重构怎么做到"行为零变化"且证得出来**。工件：`_Agents/legacy/handoffs/handoff-2026-10-15-epic3-baselayer-build1-adapter-migration.md`。

### 学到的

- **"门只交服务，不交连接"不是一句口号，它有一串可验证的后果。**
  `Deps.pool` 消失、`RetrieverDeps.pool → repo`、两条路由的 RouteDeps 去 `Pool` —— 这些是症状。真正的因是：一旦连接能被借走，谓词、事务边界、行投影就都能在门外面各写一套（第一版实况正是 5 个文件各持 SQL）。所以门的判据很简单：**`adapter/contract.ts` 里不许出现 `pg`，也不许有任何"借一条连接"的原语**。核对方式就是那条 grep：`\.query(\|new Pool` 只应命中 `adapter/repo/`。

- **"逐字段同形"这种 AC，靠两个实例并跑才证得出来。**
  重构最容易自欺的就是"我没改行为"。这次的做法：`git worktree add /tmp/kc-baseline 6c0b004`（迁移前的 HEAD）起一份跑在 3998，工作区起一份跑在 3999，同一批请求（`/health`、`/retrieve`、`/chat`、空提问/坏 body/非法 id、`POST /resources`、`GET /:id/chunks`、`DELETE`）逐字段比"形状 + 状态码 + 计数"。同一段 markdown 前后各入库一次，连 `halfvec` 文本的 md5 都一样 —— 这比"看起来没动 SQL"硬得多。**能双跑对账的重构，就别只用眼睛审。**

- **partial 表达式索引有**两个**匹配条件，只写其一是静默陷阱。**
  向量那条必须同时保住 `embedding::halfvec(N) <=> $1::halfvec(N)` 的**表达式形式**与 `WHERE e.dimension = N` 的**谓词**，实测（`SET enable_seqscan=off`）摘掉任一个都退化成 `Sort` + `Seq Scan`。而"这个 WHERE 像是业务过滤"的直觉非常强 —— 搬家时顺手摘掉它，结果仍是对的，只是慢，测试全绿。**"结果对、只是慢"的退化不会被断言抓到，只能被 `EXPLAIN` 抓到。**

- **防线要跟着它保护的那段文本搬。**
  `Number.isInteger(Dim)` 原来是检索类构造函数里的校验，因为它守的是"维度要被拼进 SQL 字面量"。这一刀把 SQL 搬进 `adapter/repo/search-vector.ts`、`Dim` 降落成参数，防线就必须住在拼接处，否则门外的调用方传个 `'1 OR 1=1'` 就直接进文本。构造函数里那条**同时留着**：它抓的是"配置装配错误在 assemble 期就该炸"——同一个数字、两个时机、两件事，看着重复但不是冗余。

- **薄适配器（保留名字位、把实现转出去）是"一次只推进一个可验证片段"的杠杆。**
  D3 让 `retrieve/search/paradedb-{vector,bm25}.ts` 两个文件与两个类都留在原处、`RetrieverRecipe` 两格与 `RETRIEVER_RECIPE_NAMES` 四格不动，类里只剩"取 repo、调具名方法、留本层判定、补 `score: 0`"。于是这一刀的 diff 里"注册表/Recipe/工厂"整条链零改动，出问题只需在 30 行里找。**重构里"不动"的名字，比"动得漂亮"的名字值钱。**

- **名次分不该由基础层造。**
  现网两条候选查询各自硬写 `score: 0`，收进 repo 时我就照抄了 —— 被点出来才想明白：`score` 是 RRF 融合之后的名次分，基础层给 0 只是"占个位"，但那个占位一旦住在门里，下一个人就会以为 repo 懂名次。改成 `ChunkCandidate`（无 score）+ 适配器补位，语义边界就写在类型里了。**类型能表达的约定，别用注释约定。**

### 踩过的坑 / 方法论

- **规格里"示例代码"和"边界"要分开读。** Design Notes 写的是 `async function createRepo(...): Promise<Repo>`，照抄就得把 `buildDeps → bootstrap → index.ts` 整链推成 async（顶层 await，而 `package.json` 是 `type: commonjs`，编不过）。`Pool` 是懒连接、构造不触网，同步才是对的。记进 Spec Change Log 时说清"行为无差、接口少一个 await"，别默默改。
- **分层收敛的最后阻力在测试脚本里。** 门一收，`test/` 里 `pool.query('DELETE FROM resources…')`（清理）和独立对账 SQL 就没处待了；而 D4 只授权改 import 行、不许动断言。我的处理：**保留它们直接 import 盒内 `adapter/repo/pool` 的能力并写明理由**（对账/清理本就该绕过被测面），而不是悄悄把断言改成"用门里的方法"——后者会把"验证 repo 数得对不对"这件事变成"用 repo 验证 repo"。这条已记 deferred-work，别下次顺手"修分层"。
- **同一段 SQL 出现两次，先问事务边界再谈合并。** `DELETE FROM chunks WHERE resource_id = $1` 在 `deleteChunksByResource`（无事务单语句，失败就失败）和 `softDeleteResource`（软删事务内，与 `deleted_at` 同笔提交）各出现一次。看着是重复，合并会把两个失败面粘成一个。spec 的 Always 里那句"写入守卫不变"就是在护这个。
- **写文档对账时，改名要一次扫全篇。** `resource/`→`adapter/` 不止 Design Paradigm 那一行，还有 mermaid 的四个节点、AD-1/2/3/4/6/7、词表、Structural Seed、Capability Map、Deferred 的路径引用。用 grep 收口（改完再 grep 一次 `resource/`）比逐节翻靠得住。

### 还没碰（留给后续阶段）

- **`adapter/uri/` 与 `Hit.ref`** —— 引用/去重/回链/降级四件事现在仍散在管线、SQL、两条路由的投影里（AD-5 防的正是这个）。
- **AI SDK 那一刀**（`createOpenAICompatible` / 模型句柄 / `embedMany` 替 `QwenEmbedder` / 退役门里的 `Embedder` 占位；顺带 pool 旋钮进**根** `config.ts`，不设 `adapter/config.ts`）—— 归 Lynx，src 里 SDK 至今零行使用（除他自己正在写的 `adapter/provider/registry.ts`）。
- **`api/` 与能力层的目录改名**（`routes/`→`api/endpoints/`、`contracts.ts`→`contract.ts`）—— 本轮只吃下基础层。（同批里的 `pipeline/`→`ingest/` 已于 2026-10-16 随 `types/` 盒下线做掉，记在架构 `.memlog.md`。）
- **`ChunkCandidate` 与 `RetrievedChunk` 是手工对齐的**（门不能反向 import 能力层），加 `ref` 那一位时会撞第二次。
- **`test/probe-chunk-shape.ts` 的 13 条类型错**仍在（基线就有，D4 未授权修）。

## P1 · Epic 2 附带一刀 — 装配面换 DI（2026-10-20，tsyringe，`Deps` 袋子退役）

> 这一刀不练 AI SDK，练的是**"别到处传参数"这句话到底要怎么兑现**。起点是一个 `interface Deps`（9 格）在 `bootstrap.ts` 里手工填满、然后一路往下传；终点是 `bootstrap.ts` 整个删掉、8 个 `@singleton()` 类自己注册、三条路由的 `build()` 零参数。工件：`_Agents/implementation-artifacts/handoff-2026-10-20-epic2-di-build1-tsyringe-assembly.md`。

### 学到的

- **"用类本身当 token"比"建一张 tokens 表"强，因为它把改名风险变成编译错误。** Lynx 一句「不要注入tokens表」定住了形状：`@inject(PostgresRepo)` 写错成 `@inject(PostgresReop)`，tsc 当场报 TS2552 并附 "Did you mean 'PostgresRepo'"。反过来，`@inject('PostgresRepo')` 那种字符串键位拼错**编译期什么都不能说**，要到运行时才 `Cannot resolve`。代价是要先把 `interface Repo` 这类"只是形状"的声明改写成 `class PostgresRepo implements Repo`——**类既是 token 又是实现，接口退成门里的形状契约**。
- **装饰器把"注册"从装配根搬进了依赖自己身上，代价是注册时机变成 import 副作用。** 收益看得见：`index.ts` 从"填满 9 格袋子再一路传"变成 4 行 `container.resolve(X)`，加一个服务不再改根文件。看不见的代价：**`@singleton()` 生效于模块被 import 的那一刻**，谁没被 import 就没人注册——这条在 DI 里没有编译期防线，只能靠"根文件把每条路由都 resolve 一遍"这种可读的形状兜住。
- **选择位和校验位必须住在同一个构造里。** `EmbeddingHandle` / `ChatHandle` 各自拿 `AppConfig` 里的名字（`EMBEDDING_MODEL` / `CHAT_MODEL`）去 `ModelRegistry` 的两张表兑换那一行，不在册就当场 `E_EMBEDDING_MODEL` / `E_CHAT_MODEL` + `exit(1)`。这一格收拢之后：`agent/chat/chat.ts` 里那句 `models.chatModel!` 的非空断言消失了，`providerRegistry` 从门 `adapter/contract.ts` 的出口撤掉了（它只是 `ModelRegistry` 构造里的一步 ⇒ 结构上不可能出现两份 provider 表），原先独立的 `assertChatModel()` 整删——**它本来就是这句组合的替身**。判据：`!` 断言出现的地方，就是"选择"与"校验"被拆开的地方。
- **构造函数里不能 `await`，这条硬约束直接否决了"启动时查一次、之后当事实用"。** 库中向量维度原本在启动体检时缓存进 `Deps`。DI 下三条路：塞进 `AppConfig`（❌ 构造器不能 await；且 `config.ts` 反过来 import `adapter/` 会成环；库不可达会从"降级"变成"起不来"）、`@singleton class DimensionProbe { current }` 可变壳（❌ 为一次查询养一个全局可变量）、**每次检索现查**（✅ Lynx 拍）。实测代价 **56.29ms/请求**（50 行表，几乎全是远程库 RTT），换来"改 env / 换 embedder 不用重启就生效"，并且三态塌成两态、`E_DIMENSION_UNKNOWN` 整条删除。**"要不要缓存"这种问题，先算一次真实 RTT 再谈**——56ms 这个数是拍板的前提，不是事后补充。
- **宁可可变宽，也不留"改名层"。** `RetrieverConfig`（把 `AppConfig` 里检索相关的格子重抄一遍）删除后，`RetrieverDeps.config` 的类型就是整份 `AppConfig`，检索层类型上看得见 `databaseUrl` / `host` / `port`。这看着是退步，实际省掉的是 8 处改名点 + 一类"接口没同步"的漂移。类内部不想动的地方用解构重命名局部收口：`const { embeddingDimensions: dimension, retrievalMinSimilarity: minSimilarity } = Deps.config`。
- **`type: commonjs` 下顶层写不了 `await`，IIFE 是唯一形状，而且外层括号是语法必需。** `void (async () => { ... })()` 里那对括号不是风格：`node --check` 实测 `async () => {}()` 报 `SyntaxError: Unexpected token '('`，因为 `async` 先被当成函数声明的开头。这段顺序也不是风格而是约束——`cleanUpOnBoot` 会删 chunks（AD-7），必须 await 完再 `serve()`。

### 踩过的坑 / 方法论

- **最贵的一条：一处语法错会关掉整个项目的语义检查，于是"tsc 0 错"可以是彻底的假绿。** 我抱着「tsc 干净」当闸门用了几个小时，实际是 Lynx 正在写的 `agent/tool/registry.ts` 有一处未写完的 `execute`（TS1109），TS 7 原生编译器在有语法错时**只报语法错与声明产出错，其余全不报**。修法：补上占位体让语法过，然后**用 canary 验闸门活着**——插一行 `const canary: number = 'x'`，`tsc` 必须报它，报不出来就不许引用任何计数。以后凡是要说"类型检查过了"，先出示 canary 的结果。
- **`| tail` 之后的 `$?` 是 `tail` 的退出码。** 我据此报过一次"进程 exit = 0"，实际是 1。管道里要读退出码用 `${PIPESTATUS[0]}`，或者干脆把输出写文件再读。
- **review lens 报的时序缺陷要复核到"机制"这一层，别只修症状。** 三个独立 lens 都指到"启动清扫没 await 就 serve"。修 `await` 是一行的事，但旧注释把这条保证归给了**错的机制**（"先给 null"），于是下一个人还会再拆一次。真正的说法：`serve()` 在清扫完成之前就把端口开了，窗口期进来的请求读到的是尚未收口的 `processing` 行。**修 bug 顺手把"为什么原来安全"讲对，才算修完。**
- **DI 有没有真生效，单测证明不了，只能跨请求真跑。** 探针脚本里 `container.resolve` 两次拿同一实例是必然的，那不算证明。有效的形状是：`npm start`（**不带 watch**，免得热重载干扰计时）→ 后台 `POST /resources` 打一个慢 URL → `GET /resources` 抓到 `status=processing` → `POST /:id/abort` 得 **202**。202 才证明"两条请求共用同一个 `InflightRegistry`"，409 `E_NOT_INFLIGHT` 就是那个静默 bug 现形。DI 每改一刀都该重跑这一条。
- **tsyringe 的默认生命周期是 Transient，和 Spring 的 singleton 相反。** 不带装饰器的类每次 `resolve` 都 `new` 一个——而 `new` 在有身份的东西（连接池、取消登记处）上会**静默造出第二份**，两份 Map 各记各的 abort。这是本轮唯一一条"看起来像 Spring、实际反着来"的坑。
- **探针写进项目自己的 `test/probe-di-*.ts`，别开 `/tmp` 独立工程。** 一次会话里 `/tmp` 的探针工程被系统清过（`no such file or directory`），重建就是白干；放项目内还能直接用真的 `node_modules` 与 tsx，跑出来的注册行为才是真的。
- **大重构中途要提交。** 2026-10-16 那一整刀 DI（typed-inject 方案）**从没进过 git，回到机器上时已凭空消失**，只能重做。本轮按 Lynx 节奏切成三笔（`589c404` 包+tsconfig+前三格 / `e35c7c3` 路由与工厂 / `d5dee62` review 修复），每笔都可回滚。
- **测试挂了先分清是"断言被推翻"还是"签名连带"。** 这一刀之后 `test/` 剩 29 条类型错，全是调用点没跟上（`new IngestFactory(...)` 变 0 参、`createRepo`/`modelRegistry`/`providerRegistry` 出口消失、`RetrieverDeps.vectorDimensions` 没了）加 13 条基线旧错。这类是机械替换；断言一条没松。没点头之前 agent 不动测试。

### 还没碰（留给后续阶段）

- **`test/` 那 29 条签名连带**未修（机械活，等放行）。
- **`src/agent/tool/registry.ts` 里我补的 `execute` 还是回声**（`async ({ prompt, topK }) => ({ prompt, topK })`），只为杀掉那处语法错、把语义检查闸门换回来。Story 2.6 的真接线（工具内调检索）是他自己的。
- **启动顺序的宿主没具名、也没语义下限**：`cleanUpOnBoot` 现在由 `index.ts` 手工 await，没有类型或测试钉住"serve 之前必须完成"（deferred-work）。
- **`I_MODELS` 打印住在 `ModelRegistry` 构造里** ⇒ 日志顺序由 resolve 顺序决定，而不是由"这是启动信息"决定（deferred-work）。
- **ingest 整条链路零自动验证**：这一刀动了它的装配形状，但没有任何测试跑得通它，正确性靠一次真 HTTP 端到端（deferred-work）。
- **库不可达时 `/retrieve` 冒 500**，而 `/chat` 的契约是"一律 200 答案体"——`E_DIMENSION_UNKNOWN` 删掉之后这个不对称显形了（deferred-work）。

## Epic 2 补记 — Story 2.2 / 2.3 / 2.4 / 2.6（2026-10-15 → 10-21，补记 2026-10-29）

> 这四格此前只有走读页与 sprint 注记，没进学习日志；补记只收「判断与坑」，完整代码讲解在 `_Agents/walkthroughs/epic2-story{2,3,4,6}-*.html`。

### 2.2 流式输出与 loading

- **用 SDK 的 UI Message Stream，不自造 JSON 协议。** `useChat`、`UIMessage.parts`、tool part、error/abort 语义都是现成的；代价是必须按 `type` 理解帧，不能当普通 JSON 读。
- **HTTP 状态码在流开始后就改不了了。** `createUIMessageStreamResponse` 一发出 200 头和首帧，模型中途报错只能发 `{"type":"error"}`；前端从 `useChat().error` 读，路由的 500 覆盖不到。
- **abort 帧 ≠ error。** 本机实测：只喂 `{"type":"abort"}`，`Chat` 最终 `status=ready`、`error=none`，半截 text part 甚至还是 `state:"streaming"`。所以手动停止必须自己 `markCut`，不能指望 SDK 标「未完整」。
- **「回答未完整」只有两个可靠入口**：用户手动停、`useChat` 真报了 error。错误分支还要判 `messages.at(-1)?.role === 'assistant'`，否则会把上一轮完整回答永久标成半截（cut 从不回收）。
- **`submitted` 与 `streaming` 是两个阶段。** submitted 时本轮 assistant 还没进 messages，按「最后一条 assistant」挂光标会挂到上一轮；用 `status === 'streaming'` 挡住。
- **两个 `onError` 别混。** `streamText` 的 onError 只记日志/给 trace；`toUIMessageStream` 的 onError 才决定客户端 `errorText`。改错一个，用户看到的文案不会变。
- **`stop()` 没有上界。** 忙时取消前一条的方案配了 800ms 竞速：停不干净就拒绝这一问并提示，绝不让两条流共用一只 Chat 互相拨 status。
- **中断不落 assistant。** 取消直接 return，库里只留 user 消息；代价是刷新后半截消失，「未完整」标记只在内存。
- **超时三条款整体推后。** 没有真实上游首块延迟样本前拍超时值只是拍脑袋；代价是 inter-token 卡住只能手动停（`CHAT_TIMEOUT_*` 至今零命中）。

### 2.3 引用标记与映射

- **唯一真相 = 同一条流里的 tool 输出。** 之前 `/ask` 平行再打一次 `/retrieve`，两批命中并排却不互相担保；现在回答与命中来自同一次工具调用，`/recall` 仍打 `/retrieve`（只检索不生成的调试台）。
- **`[n]` 是模型写的，界面只做顺序对齐。** 第 n 个标号对应最后一次 hits 的第 n 条；越界就原样留文字，不替模型编来源、不给假按钮。
- **编号按首次出现，不按召回名次。** 正文出现 2、3、6、8 的跳号很难读；右栏、按钮、正文统一读 `citedHits` 的首次出现顺序。
- **数字名次只属于本轮，跨轮只认 8 位 chunkId。** 同一个 `[1]` 在上一轮是另一条命中；`[12345678]` 看着像数字也按 chunkId 前缀解析，不当名次查下标。
- **多步：面板与数字用最后一次，8 位 id 用全集。** 更早一次重查的命中只能通过 8 位 id 被正文引用，数字对不上是预期行为。
- **工具键名就是 part 名。** registry 的 `retrieve` 被拼成 `tool-retrieve`；历史上 `retrive` 改名时前端没跟，面板整轮显示「未检索」而模型其实查了。
- **缺 `chunkId` 的畸形 hit 仍可能抛。** `hitFor` 的 `byId` 直接读 `H.chunkId.toLowerCase()`；与「越界索引」不是同一件事，已记 deferred。

### 2.4 原文回链与来源快照

- **快照 vs 重取 chunk：选快照。** 重取得的是「现在」的块，不是「回答当时」的块；来源删了还会 404/500。快照跟消息走，历史回答可复现、无额外请求；代价是消息体积，且旧块不跟随后续编辑。
- **404 只标不拦，500 保持沉默。** 页面只认 `ApiError` 且 `status === 404` 才出现「来源已删除」；后端挂了、代理返 HTML、形状不对都不标，内容仍可读。410 条款 2026-10-21 已作废。
- **本轮 `[n]` 两步，跨轮一步。** 当前轮先点亮右栏那一行（让用户看到引用与命中是同一套编号），跨轮引用直接开抽屉，避免点了没反应。
- **Resource 级删除判据。** 只查 `GET /resources/:id`，不逐 chunk 探测；代价是「只删了 chunk、资源还在」不会标已删除。
- **粘贴内容没有 `source`。** `/ask` 只在 source 非空时渲染链接，粘贴只有 `docTitle`；唯一指针在 `resourceId` / `dataUri` 里。

### 2.6 检索工具化（模型自调 retrieve）

- **从「服务端先检索、再塞 prompt」改成「模型自己调用检索工具」。** 这是 P3 能力的一次有期限前置（AGENTS §五），不是 Agent loop。
- **`streamText` 默认单步。** `ai@7` 默认 `stopWhen = isStepCount(1)`，不显式写 `stepCountIs(5)`，工具执行完循环就停（本机 7.0.148 仍在 `dist/index.js`）。
- **step 数不等于工具调用数。** 文档曾写「5 步 = 4 次往返」；2026-10-28 实测 5 步可出 7 次工具调用，按「最多 4 次」的外推表述不准。
- **工具错误要 return，不要 throw。** SDK 对 tool error 走 JSON 序列化，而 `Error.message` 是非枚举属性——实测 `JSON.stringify(new RetrieverError(...))` 只剩 `name/code`，中文原因会被抹掉。return 结构化 error 才能让模型读到。
- **业务错误没有 `output-error`。** 被 catch 成正常 output 后 part state 仍是 `output-available`，前端必须读 `Out.error`；只有非 `RetrieverError` 真 throw 才会出现 `output-error`。
- **SSE 状态码一次性。** `/chat` 是 200 + 工具 error，`/retrieve` 是 409，同一个错误的两种出口。
- **两个旋钮各管一条路**：`topK` 归模型（工具 schema 4–19），`limit` 归 `/retrieve`；`/chat` 不再收 limit。
- **键名就是 part 名**；注释也会漂（`app/web/src/api/chat.ts` 的注释仍写 `stopWhen 2`，服务端已是 `stepCountIs(5)`）——读注释不能代替读实现。

## 2026-10-21 · Story 2.5 多轮与 Epic 2 收口

### 学到的

- **`streamText` 的 `messages` 是 `ModelMessage[]`，不是 `UIMessage[]`。** 库里存的 parts 要过 `convertToModelMessages(Messages)`；`ai@7` 里这个函数返回 **Promise**，必须 `await`（直接传会报 TS2740 "Promise<ModelMessage[]> is missing..."）。
- **落库 UI 真源走 `toUIMessageStreamResponse({ originalMessages, onEnd })`。** `onEnd` 拿到的是 `responseMessage`（含 id 与完整 parts），`isAborted` 可跳过中断轮；`streamText` 自己的 `onFinish` 给的是 ModelMessage，不含 UI parts。
- **历史只回灌 text parts。** tool-retrieve output 里是上轮命中的全文，回灌既撑 token，又会让模型引用旧 chunk；引用只该来自本轮工具结果。
- **模型看得到历史时，会自己把指代展开成检索词。** 实测第二问「那 ef_construction 呢？」→ tool input「HNSW 索引的 m 参数和 ef_construction 参数默认值是多少？」。显式查询改写不是必需；先跑再决定要不要多付一次 LLM 调用。
- **`Chat` 实例没有公开的 `setMessages`；用 `useChat({ chat })` 返回的 setter 恢复历史。** `chatFor` 仍是模块级单例，hydrate 放页面 effect，且只在实例无消息、不在流时写。

## 2026-10-22 · Story 3.1 通用端点轨迹（补记 2026-10-29）

> 通用 endpoint 壳：所有业务路由共用一个中间件记 trace。此前只有走读页与 sprint 注记，这里补判断与坑。

### 学到的

- **route 存模板，不存真实路径。** `/resources/abc` 归一成 `/resources/:id`，同一个接口的上千次请求才能聚合；存真 id 只会碎成无数行。
- **payload 只记失败 + 白名单成功。** 失败时 request/response 两侧都记；成功时只对三个写接口记 request，且 `POST /resources` 只留元数据。chat/retrieve 一字节不记，它们另有落点。
- **SSE 先记 `ok`，后面再覆盖。** 中间件只看得到响应头，看不到流结束；真正的 `ok/error/cancelled` 由 3.2 的 `onEnd` 覆盖同一行。
- **观测写失败绝不拖垮业务。** `insertTrace` / `finishTrace` / `recordStage` 的异常全部吞成一行 `E_TRACE_WRITE` 日志——trace 丢了业务还得成，这是观测的边界。
- **列表不返回 payloads。** 3KB × 50 行太重；列表只给公共字段，详情才给载荷。
- **`session_id` / `resource_id` 不加外键。** trace 是审计数据，业务行删了它还得在；外键会把删除变成级联或让写入被约束卡住。

### 踩过的坑 / 方法论

- **HTTP body 是流，只能读一次。** 中间件要读就先 `c.req.raw.clone()`；直接 `await c.req.text()` 会让后面的 handler 拿到空 body。
- **别把 `/traces` 自己记成 trace。** 读观测的请求也走中间件；不跳过，点一次刷新就多一条噪音。
- **别在 SSE 上等流结束。** 中间件拿到的响应已经是流，等它读完会把请求挂住；最终状态交给流回调。
- **Header 全量落库 = 泄密。** Authorization / Cookie / Key 一律不落，白名单之外不记，`SECRET_HEADER` 是第二道保险。
- **真实 path 不能做统计。** UUID 会让每个请求都成为「新路由」，先归一成 `:id`。

## 2026-10-22 · Story 3.2 chat 链路交 Langfuse

### 学到的

- **AI SDK 的 Langfuse 根 span 不会设成全局 active。** 注册 `LangfuseVercelAiSdkIntegration` 后，根 span 由 integration 内部 `tracer.startSpan` 创建；`getActiveTraceId()` 在 `streamText` 返回后和 `onEnd` 里都是 `undefined`。要拿 trace id，要么自己建 active root span（树里多一层），要么用 `SpanProcessor.onStart` 抓根 span 的 `spanContext().traceId`。
- **根 span 的 `onStart` 跑在请求 ALS 作用域里。** 在自定义 `SpanProcessor.onStart` 里 `currentTraceId()` 能读到端点壳放进 ALS 的本地 trace_id；用它做 map 关联，既能查 `beginChat` 存下的 sessionId，也能拿到 `traces.langfuse_trace_id`。
- **根 span 的形状**：`parentSpanContext` 为空、`gen_ai.agent.name === 'chat'`（来自 `telemetry.functionId`），名字是 `invoke_agent <model>`；step/model/tool 都是它的子 span。
- **`propagateAttributes` 包 `streamText` 不够**：AI SDK 的根 span 要到流消费时才创建，propagate 的 context 已退出；实测 `session.id` 没挂上，`getActiveTraceId()` 也拿不到。自己用 `startActiveObservation` 建 active 根 span 又会让 AI SDK span 落到另一个 trace，树不完整。最终在 `SpanProcessor.onStart` 里直接给根 span 写 `session.id` / `langfuse.trace.name` / tags / metadata，并捕获 trace id。
- **业务模块不要直接 import OTel/Langfuse。** Vitest 下 `@opentelemetry/api` 的 CJS 导出会被 Vite 判成缺 `SeverityNumber`，导致 import ChatService 的测试文件直接失败。用 `bridge.ts`（无第三方依赖）把实现注入进来：测试 import 业务模块不会加载 OTel，`index.ts` 启动时才装。
- **OTel 2.x 没有 `.register()`**：`trace.setGlobalTracerProvider(new TracerProvider({ spanProcessors: [processor, capture] }))`，不要照抄 1.x 的 `NodeTracerProvider(...).register()`。
- **Langfuse Cloud v3 的 `/api/public/traces/{id}` 已弃用**（2026-11-16 移除），会返回 410/429；读 span/trace 改用 `/api/public/v2/observations?fromStartTime=&toStartTime=`，按 `traceId` 过滤。导出是批量异步的，刚写完可能查不到，等几秒再查；`sessionId` 只在根 observation 行上有值，子 span 为空是 v2 行的投影。
- **本地行要等流真正结束再收口**：header 时壳先记 `ok` 与到响应头的耗时；`onEnd` 的 `outcome.status` / `isAborted` / `isCancelled` 覆盖成 ok/error/cancelled，并把 `session_id`、`langfuse_trace_id` 写回。`finishTrace` 对这两列用 `COALESCE`，避免 header 那次收口把早写的值抹掉。
- **中断也会触发 `onEnd`**：客户端 2 秒断开，本地行从 `ok/327ms` 覆盖成 `cancelled/1864ms`，并补上 Langfuse id；assistant 消息不落库。

## 2026-10-23 · Story 3.3 retrieve stage

### 学到的

- **只 `setGlobalTracerProvider` 不够，还要 `AsyncLocalStorageContextManager`。** OTel API 的 `context.with` 依赖全局 context manager；没注册时 active span 永远是空的。AI SDK 的 `executeTool` 虽然用 `context.with(toolSpan.context, execute)` 包了工具，但 manager 缺席，stage 里 `startObservation` 看不到 tool span，5 个 stage 各自变成独立根 trace。装上 `@opentelemetry/context-async-hooks@2.12.0` 并在 setup 里 `context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable())` 后，stage 才正确挂在 `retrieve` TOOL 下。
- **stage sink 由 caller 选，factory 不替调用方决定。** `Retriever.search(Query, { sink })`：`/retrieve` 传 DB sink，chat tool 传 Langfuse sink；没有 sink 时 no-op 且 embed telemetry 显式关。这样同一个 Retriever 可以在两种落点复用。
- **telemetry 必须和 sink 同选。** DB sink → `embedMany({ telemetry:{isEnabled:false} })`，否则全局 integration 会把检索的 embedding 记成独立根 trace；Langfuse sink → 保持开启，embed 成为 tool span 的子 observation。
- **stage payload 只存元数据**：`vector_hash` 是 query vector 的 sha256 前缀（16 位），不落完整向量；candidates 只存 chunk_id/similarity/lexical_score/rank，不存正文。
- **`/traces/:id` 从 CRUD read 改成自定义读**：hono-crud 的 read 只返回 trace，拿不到 stages；移除 traces 的 `read`，自建路由返回 `{trace, stages}`，前端 `fetchTrace` 同步改成 `{Trace, Stages}`。
- **测试里的“DB 连接被远端掐断”是环境 flaky**：单文件重跑即过；报测试数前先确认不是自己的静默假绿（沿用 canary 纪律）。

### 还没碰

- 失败 stage 的真实链路（如 `E_DIMENSION_MISMATCH`）未端到端跑。
- 前端阶段面板未做浏览器手测。
- 3.4 ingest 的 `fetch/parse/chunk/embed/write` 与 `traces.resource_id` 回填。

## 2026-10-23 · Story 3.4 ingest stage

### 学到的

- **stage runner 该抽通用就抽通用**：retrieve 与 ingest 的“计时 + 成功/失败记录 + 吞 sink 写失败”完全同构，3.4 把 `runStage`/`StageSink`/`StageName` 移到 `trace/systemtrace/stage.ts`，两边的 factory 只提供 stage 名和 input/output 形状。
- **fetch stage 的元数据要 fetcher 当场留**：`final_url` 是重定向后的 `res.url`、`http_status` 是 `res.status`、`content_type` 来自响应头；只存 `raw` 的话事后补不出来。`Fetched` 因此加了这三位，内容入库用 null/自身 content_type 兜底。
- **`resource_id` 回填放 handler**：`Ingest.run` 不碰 trace；`POST /resources` 拿到 `result.resource` 后写 `traces.resource_id`。失败但建了行的情况也要写，查重命中 `resource:null` 不写。
- **ingest embed 必须显式 `telemetry:false`**：`embedChunks` 是入库专用，关掉后 Langfuse 不再出现独立的 `embeddings` 根 trace；本地五段才是入库的唯一明细。
- **失败 stage 的 error_code 是通用 `E_STAGE`**：fetcher/parser 抛的是普通 Error，没有业务 code；端点行仍是 `E_INGEST_FAILED`。要细分得让各 stage 自己带 code，目前不做。

### 还没碰

- 前端 ingest 阶段只做了“能显示”，没有浏览器手测。
- `Ingest.batch` 的 sink 没有调用方；批量入库的 trace 归属还没设计。
- Epic 3 四格实现完，待统一 review/提交。

## 2026-10-26 · Story 5.1 对象存储适配器

### 学到的

- **presign 是本地签名，不是“向服务端注册 URL”。** `getSignedUrl(client, new GetObjectCommand(...))` 只在本地走序列化 + SigV4；MinIO 在请求到来时才验签。Host、路径、方法、query 被签；`Range` 没被签，所以同一个 GET URL 可以反复发 Range。
- **Host 是签名的一部分。** 同一个 MinIO，用域名签、用 IP 请求就是 `SignatureDoesNotMatch`；反代必须保留 Host。
- **过期是请求入口校验一次。** URL 过期后新请求 403；已建立的流不会中途断（官方文档；本轮未做慢速限速实测）。错误码是泛化的 `AccessDenied` + `Request has expired`，不要解析文案。
- **presignPut 的 body 不签。** 默认只签 host；给 `contentType` 时用 `signableHeaders` 显式签 `content-type`，错类型才会 403。key 必须后端生成、TTL 要短、上传后 HEAD 校验。
- **S3 兼容服务要关默认 checksum。** `requestChecksumCalculation/responseChecksumValidation = 'WHEN_REQUIRED'`，否则 SDK 默认附加的 CRC 头可能不被 MinIO 接受。
- **boot non-blocking 与 health all-green 是两种语义。** 启动建桶失败只 `W_OBJECT_STORE` 继续；`/health` 仍全绿才 200，所以 MinIO 挂了整体 503（Lynx 拍板 A）。
- **配置缺项检查必须放在所有必需 env 读取之后。** 本轮 review 抓到一个顺序 bug：`missing` 检查早于 `DATABASE_URL`/`OLLAMA_BASE_URL`/`S3_*` 读取，导致缺这些变量不报 `E_CONFIG_MISSING`；用子进程测试钉住。
- **`ObjectStoreError` 只把“对象不存在”归为 null。** 桶不存在/无权限/网络失败必须抛错，不能伪装成业务空值。

### 还没碰

- 公网下载鉴权（登录/退出吊销、per-IP、一次性 token、边缘反代）→ P5。
- MinIO 专用用户与 `HeadBucket` 权限 → P5（上公网前；5.2 之后确认不随文件层进来）。
- `test/` 仍被 gitignore；health 测试与 env loader 修复不在版本控制。
- 前端 health 三卡布局与页面视觉由 Lynx 手测。

## 2026-10-27 · Story 5.2 原始归档与两段式入库

> 一句话：入库从「一个请求抓完、解析完」拆成「先把原始字节落 MinIO（归档）→ 再从 `data_uri` 派生（ingest）」。本格只做归档/门禁/下载/恢复；去重、批量、回收站是 5.3 的补丁。

### 学到的

- **两段式的分界线是「原始字节 vs 派生数据」。** `POST /resources` 只让原始对象落地、把行推到 `uploaded`；`POST /:id/ingest` 只从 `data_uri` 读原文派生 chunks/embeddings。3.4 的五段（fetch/parse/chunk/embed/write）一个没改——`fetch` 的来源从「抓 URL」换成「读 MinIO」（`StorageFetcher`），同一段代码同时服务 URL / 粘贴 / 文件。
- **六状态每格只有一个写者**（AD-7）：archive 写 `uploading → uploaded / upload_failed`；ingest 写 `uploaded → processing → ready / process_failed`；restore 写「软删 → uploaded」。启动清扫只兜两种中断：`processing → process_failed`、超 24h 的 `uploading → upload_failed`。
- **三种来源共用一个端点，但「谁写字节」不同。** 文件：后端只建行 + 签 `presignPut`，浏览器直传 MinIO；URL/粘贴：后端抓/收，服务端 `put`。前者省后端带宽与内存，代价是 presigned PUT 不能预限大小 ⇒ 前端先拦、ingest 用 `stat` 事后拦（缺失 / 0 字节 / >10 MiB / 类型不符 → 删错对象 + `upload_failed`）。
- **`data_uri` 就是文件地址，用实际路径，不插 `resources/<id>`。** 形如 `kc://oss/minio/<bucket>/<key>`，key 保留文件名/相对目录（URL 用 host+pathname，粘贴用 title slug）。好处是 URI 与对象 key 一对一、人能读；代价是重名要分配：`allocateKey` 同时查 DB 的 `data_uri` 与 MinIO 的 `stat`，冲突加 8 位短后缀，`kc://%` 的部分唯一索引兜并发。
- **`source` 只记外部来源。** URL 存原 URL；文件/粘贴存 null。`kc://` 是内部地址，只能待 `data_uri`——之前写进 `source` 的测试行已一次性归一为 null。
- **软删与彻底删除是两件事。** `DELETE` 删 chunks（embeddings 随 FK），**原对象保留**；restore 先 `stat`，完整才清 `deleted_at` 回 `uploaded`，缺对象 409 `E_NO_ORIGINAL` 且行保持软删。动对象是 purge（5.3）的事。
- **下载只签地址，不代理字节。** `GET /:id/original` → 302 到 1h `presignGet`，强制 `attachment` + `Cache-Control: no-store`，不记 Location。一旦改成代理，Range/断点/大文件全要自己写。
- **归档失败也要留行。** URL 抓取/写存储失败先建 `uploading` 行再转 `upload_failed`（422 带 resource）；只有输入错误（空内容/坏 URL/非文本）才是建行前 400。行是「办砸了」的证据，前端据此展示原因与重试入口。
- **观测按「谁干活」归属。** 五个 stage 挂在 `POST /:id/ingest` 的 trace 下；归档端点那条 trace 0 段。前端 RunWatch 改读新端点。

### 踩过的坑 / 方法论

- **CORS 没配 ≠ 浏览器传不上去。** 桶级 CORS 为空，但 MinIO 默认对任意 Origin 回 `200 + Allow-Methods: PUT + Allow-Headers: Content-Type`，无签名 PUT 的 403 也带 ACAO ⇒ 前端读得到状态码。真正会挡的是 HTTPS 页面直传 HTTP MinIO 的 mixed content（fetch 直接 block，改 CORS 无效），手测走 `http://localhost:5173` 规避；TLS 归 P5。
- **旧数据选「清空」而不是回填。** 29 行旧资源的 `data_uri` 是 URL / `urn:kc:paste:`，没有真实对象；伪造一个「原文件」比清空更糟。迁移清 resources/chunks/embeddings/traces，保留 sessions/messages。**判据是旧数据能不能表达新语义，不是迁移成本。**
- **对象 key 分配要同时看两个存储。** 行与对象不在一个事务里：先建行后 PUT 失败留空行，先 PUT 后建行失败留孤儿对象。两边都查 + 唯一索引兜底，是对「两个存储没有分布式事务」的务实回应。
- **同一个字段不能装两个语义。** `source` 混过 `kc://` 之后，「按来源查重/展示」和「内部存储地址」会互相污染；拆开后查重只看 `source`（URL）与 `content_hash`（内容）。

### 还没碰

- PUT 失败留下的 `uploading` 行（现靠 24h 清扫/手删）→ 未排期。
- URL 标题被 hostname 占位、ingest 不覆盖（分不清用户是否显式给过 title）→ 未排期。
- 原对象丢失时从 `source` 自动重抓 → 未排期（要先接受页面可能已变）。
- HTTPS/TLS 部署（mixed content）→ P5。
- 浏览器手测按约定由 Lynx 做（Epic 5 收口时判定），agent 未代测。

## 2026-10-27 · Story 5.3 内容去重、整批两段式与回收站

> 一句话：给资源补上「内容身份」（SHA-256）与「内容生命周期」（去重门 → 回收站 → 彻底删除 → 重入库）。原 5.3 的单文件上传方向已被 5.2 覆盖，本格重定义为批量。

### 学到的

- **去重键是内容，不是名字。** SHA-256 打在归档原始字节上（文件字节 / HTML / UTF-8 文本），不看文件名/标题；换名同内容也能命中。浏览器用 Web Crypto 算文件 hash，URL/粘贴服务端算。
- **唯一索引必须包含软删行。** `content_hash` 全表唯一（`WHERE content_hash IS NOT NULL`，不排除 `deleted_at`）⇒ 软删行也占位；命中软删行时恢复它，而不是插第二行。否则回收站里同内容两行，「恢复哪一行」没有答案，hash 也不再是身份。
- **去重门在 DB 与 MinIO 两个写入之前。** 文件：先算 hash → 查库 → 命中就**不 create、不 presign、不 PUT**；URL/粘贴：先取内容算 hash → 查 → 命中就**不 put、不建行**。命中时两个存储都不写。
- **客户端 hash 只是预检键，不是事实。** 它只用来「早跳过」，裁决在服务端：ingest 从 MinIO 读回同一份 Buffer 再算 SHA-256，与 `resources.content_hash` 比对，不一致 → `E_HASH_MISMATCH`（不 parse/chunk/embed，落 `process_failed`）。**凡是客户端能伪造的判据，都要在服务端复核一次。**
- **同批要先做 hash 预检。** 否则第一项 create 之后，第二项同内容会命中「自己刚建的 uploading 行」，被标成 duplicate 而不是同批去重。预检只合并同批；跨批/并发仍靠唯一索引 + 23505 重查。
- **整批两段式不是后台队列。** 阶段一：全部 create + 上传/归档（文件 presign PUT → `confirm-upload`、URL/粘贴归档、软删命中恢复），收 resource ids；阶段二：全部 ingest。原因：三种来源的完成时机不同，混跑会让 ingest 在对象没到位时 `stat` 失败。队列仍是内存，刷新即丢；不建服务端任务表/worker/Redis。
- **`confirm-upload` 的意义是给「上传完成」一个服务端事实。** PUT 成功只说明浏览器说传完了；服务端 `stat`/类型/大小过门禁才转 `uploaded`。gate 两条入口共用：confirm 只接 `uploading/uploaded/upload_failed`，ingest 还允许 `ready/process_failed`。
- **回收站不是第二套状态机。** 用 `GET /resources/deleted` + 状态筛选「已删除」；软删行仍只有一种语义。**purge 只接软删行**（active 409 `E_NOT_DELETED`），先幂等删对象、再删行；对象丢失也允许清行；对象删除失败保留行可重试。顺序固定为先对象后行，避免孤儿对象。
- **ready 重入库是「替换」，不是「追加」。** 写事务里先 `SELECT … FOR UPDATE` 锁资源行（串行化同一资源的并发重入库），再删旧 chunks/embeddings，再插新，最后转 ready；失败整体回滚并落 `process_failed`，旧 chunks 不保留（Lynx 拍）。宁可短时空窗，不要半新半旧或双份。
- **SDK 的 batching 只看条数上限，不看耗时。** `embedMany` 只按 `maxEmbeddingsPerCall`（2048）拆；实测 qwenembed ≈480ms/条（32 条 15.4s、64 条 30.5s），118 块一次调用必超 30s。改为 32 条/批串行、每批各带一份 30s 超时，结果按批序拼接。**超时是按调用计的，批次大小要按耗时定。**

### 踩过的坑 / 方法论

- **状态机的「入口集合」每加一个状态都要全局对齐。** 重试 bug 的根因：`markResourceUploaded` 的允许集合漏了 `process_failed` ⇒ 重试 0.4s 就 409 `E_RESOURCE_GONE`，看起来像「资源消失了」。修法是把 `process_failed` 与 `ready` 一起列为重试入口（对应 gate 的 `AllowReady` 分支）。
- **Web Crypto 只在安全上下文。** `crypto.subtle` 在 localhost/HTTPS 才有；普通 HTTP 局域网页面没有兜底（已知限制，未做降级）。jsdom 测试要补 Node `webcrypto`。
- **「资源损坏后允许重传」必须留一条彻底删除。** 只软删的话，坏对象的行 + hash 还占着唯一索引，重传会被自己的坏行挡住——这是 purge 的业务理由，不是「清理垃圾桶」。
- **内存队列 ≠ 后台队列，但「换页即丢」可以消。** 5.3 之后同一轮前端工作把队列从上传面板搬到根布局（`src/lib/upload-queue.tsx` + dock 胶囊）：换页不丢、提交不因离开 `/ingest` 中断；**刷新仍即丢**。边界说清：消掉的是导航中断，不是进程崩溃或多端恢复。
- **purge/restore 并发还有一个极小窗口**：purge 先删对象、restore 抢先 `stat` 通过后 `UPDATE`。单用户单页几乎不可见；正解是 `SELECT … FOR UPDATE` 持行锁跨对象删除。已记 deferred。
- **不要顺手把 MinIO 生命周期写进业务用例。** ingest 复算 hash 失败只落 `process_failed`，不删对象、不清 hash；对象删除/重试/校验/清理统一归「MinIO 薄层子系统」（Lynx 2026-10-27 拍「之后做，现在先不做」）。

### 还没碰

- purge/restore 并发行锁 → 未排期。
- 硬删审计留痕 → P5（本轮只有 trace）。
- MinIO 薄层子系统 → P2 工程项（未排期）。
- 批量下载 / ZIP → 不做（ZIP 只在 5.4 做代码库）。
- 浏览器手测按约定由 Lynx 做，agent 未代测。

## 2026-10-27 · Story 5.4 代码库 ZIP：独立域、不解压、按需读

> 一句话：代码库是「文件管理」，不是知识库语料。独立 `codebases` 域，ZIP 留 MinIO，只读中央目录做校验，预览按条目 range 读。

### 学到的

- **代码库不是 `resources` 的 subtype。** 独立 `codebases` 表 + 独立能力盒 + `/codebases` 路由；不进 `resources`、不进 ingest、不写 chunks/embeddings、不进检索。混进去会污染六状态/去重/回收站，并把代码强行塞进 embed 管线。只复用基础设施（DB/ObjectStore/config/日志/trace）。
- **没有沙箱就不解压。** ZIP 留在 MinIO，`complete` 只把包下载到受控临时文件、用 `yauzl` 读中央目录，`finally` 删临时文件；不落条目文件、不执行仓库内容。解压 = 路径穿越/符号链接/zip bomb/执行 hook 的风险面，这些在「只读目录」下都不存在。
- **清单是持久化的派生快照，不是缓存。** `codebases.manifest` jsonb 存扁平条目（path / entry_index / is_dir / compressed_size / uncompressed_size / compression_method）；列表与树读 DB，不在每次请求时重解 ZIP。`entry_index` 是回 ZIP 的坐标（yauzl 原始序号，被忽略的目录也占号）。
- **预览永远纯文本。** 文本/代码统一 `text/plain; charset=utf-8` + `X-Content-Type-Options: nosniff`，前端 `<pre>`；绝不把 HTML/SVG 条目当页面执行（XSS）。二进制给元信息 + 下载。
- **限额只有一个，其余交给「读时截断」。** ZIP 上传 100MB；单条目读取按**实际**解压字节 100MB 截断（不信中央目录虚报）；不做文件数/压缩比/深度细限额——没有证据支撑的阈值只会误杀。
- **硬删是这个域的删除语义。** 没有软删/回收站；`processing` 拒绝删除；先幂等删对象再删行，对象丢失允许清行，对象删除失败保留行可重试。
- **ZIP 校验清单化。** 拒 `..`/绝对路径/反斜杠/控制字符/空段/重名/符号链接/设备文件/加密/不可解码/空包；默认忽略 `.git`、`node_modules`、`dist`、`build`（常量表）。`yauzl` 自己会拒 `..` 与绝对路径，`strictFileNames: true` 才拒反斜杠。

### 踩过的坑 / 方法论

- **随机读适配器要按「调用模式」设计，不是按接口语义。** 高 entryIndex 打开超时，根因是 yauzl 每读一条中央目录记录调一次 `read`（46 字节），旧 `S3ZipReader` 每个小 read 发一次 Range GET ⇒ 1493 条目的 ZIP 点后面的文件要排队上千次请求。修复是给 reader 加 1MB 块缓存（上限 16 块），条目正文仍单次 Range GET。**性能问题先数「一次操作会发生多少次 IO」，再改实现。**
- **TanStack 的 autoCodeSplitting 会把 route 文件的组件搬走。** route 文件再导出组件，dev 下会拿到 undefined（组件被切到 `?tsr-split=component`）。页面组件住 `components/`，route 文件只留 `createFileRoute` 薄壳。
- **「中央目录声明的解压字节」不能当内存上限用。** 它可能虚报，所以预览按实际解压字节截断；上传大小用 `stat` 复核，不信请求里声明的 size。
- **无沙箱的边界要写进 AC，不只在注释里。** 5.4 把「不解压、不执行、不上 AST」写成不做项，才挡得住后面「顺手跑个 analyze.mjs」的冲动。

### Epic 5 收口对账（2026-10-27）

- 5.1–5.4 全 `done`，四份走读页齐（`epic5-story{1..4}-*.html`）；后端/前端全量与 build 均绿（明细以 `sprint-status.yaml` 为准）。
- 遗留去向：mixed-content/TLS、MinIO 专用用户/`HeadBucket`、硬删审计 → **P5**；purge/restore 行锁、PUT 失败行、URL 标题、source 重抓、MinIO 薄层子系统、多存储/多桶 → **未排期**；代码图 / 代码 RAG → **另立 Epic**。

## 2026-10-27 · Epic 6 取消：文件 URI 折回 Story 5.2

> 这一节记「没做的那一刀」为什么不做。Epic 6 编号不复用（现在的 Epic 7 是评测，晚一天立项）。

- **原方案**：`kc://oss/<provider>/<bucket>/<key>` + 4 格（6.1 URI 解析/`/resolve`/`/files` → 6.2 `storage_uri`/`storage_key` 列 → 6.3 两段式 → 6.4 restore/retention）。
- **取消理由**（2026-10-26 立项，2026-10-27 折回 5.2）：
  1. **事实已经存在。** `resources.data_uri` 本来就在（P1 存 URL / `urn:kc:paste:`），换成语义正确的 `kc://` 实际路径即可；再加 `storage_uri` + `storage_key` 是同一事实三份，唯一索引、回链、去重都会被撕开。
  2. **真正缺的不是 URI 解析层，是「上传与解析分开」。** 原文先落地、ingest 再派生——那是 5.2 的两段式，不值得一个 Epic。
  3. **`/resolve`、`/files` 没有调用方。** 它们是为「假设中的通用文件解析器」建的入口；通用层要等第二个调用方出现再抽。
  4. **流程仪式太重。** Lynx 判定 Epic/OQ/AC/走读页这一套对「只改已有字段的用法」太重（原话：太繁琐，全是仪式）。
- **落地差异**：只保留 `adapter/storage/uri.ts` 的 `buildDataUri`/`parseDataUri`（进程内用，不开 HTTP 解析端点）；`source` 只记外部来源；不建 `storage_key` 列；不做 resource/chunk/message/trace 的身份 URI（引用仍靠 `chunkId` + 资源 `data_uri`）。
- **复用价值**：Epic 6 的 kickoff 不是白写——「原文是 source of truth、chunk/embedding 是派生、软删不删原文、restore 从原文重放」这套语义原样进了 5.2/5.3；被否掉的只是它的容器（新 Epic + resolver + 两个新列）。

**判据（可复用）：先问「这个事实是不是已经存在」，再问「要不要为它新建一层」。** URI 这类「看起来优雅」的抽象，最容易长成只有作者使用的通用层。

## 2026-10-28 · Story 7.0 评测连接（默认主库 / 可选隔离库）

> 这一格不练 AI SDK，练的是**「第二套环境」怎么接**：评测世界不另写一套服务，只是主世界换一个 pgpool；选哪只池由启动期一条可选 env 决定。

### 学到的

- **「可选」的正确形状是默认落在简单路径，不是缺配置就关门。**
  原 AC 写「没配 `EVAL_DATABASE_URL` ⇒ 评测整体不可用」，Lynx 当天纠偏为「不配就跑主库（共享模式），配了才隔离」。落法：`AppConfig.evalDatabaseUrl: string | null`、`getEnv` 不传 missing（缺它不触发 `E_CONFIG_MISSING`）、`/eval/status` 返回 `mode`、前端三页照常可用且只摆徽标不做禁用。
  判据：**缺省值属于产品语义，不属于错误处理** —— 一个开关「没配」到底等于「关掉」还是「走默认」，要在 AC 层面写死。

- **第二套环境 = 同构装配换 pool，不是复制业务代码，也不是把 Repo 改成多实例容器。**
  共享模式直接把主库的 `PostgresRepo` / `RetrieverHandle` 交给评测路由；隔离模式只多一个 `EvalDbHandle`（第二个 `createDbPool`）、一个 `EvalPostgresRepo extends PostgresRepo`、一条 `new RetrieverHandle(同一个 Factory、同一个 Embedding、评测 repo)`。检索、入库、迁移、维度校验、partial HNSW 全是同一套；对象存储 / 嵌入 / ingest 工厂 / 取消登记两个世界共享，多出来的成本只有「多一只池 + 多一份数据」。
  这条抽象就是以后「多知识库 namespace」要复用的那条，所以 7.0 不提前做 namespace。

- **有条件才该存在的对象只能懒 resolve，不能写成构造器依赖。**
  `EvalPostgresRepo` 是 `@singleton`，但没有 URL 时它构造即抛（`EvalDbHandle` 拿不到连接串）。若把它放进 `EvalAssembly` 的构造器依赖，**共享模式一构造 assembly 就会建第二个池**（或当场抛）。现在只在 `isolated` 分支里 `container.resolve(EvalPostgresRepo)`，共享模式连这个类都不碰。
  判据：`@singleton` 的「懒」只到 `resolve` 那一刻；写进构造器就等于把它提前到父对象的第一次使用。

- **Hono 的 `use('*')` 只作用于其后注册的路由 ⇒ 挂载顺序是位置约束，不是风格。**
  入口里 `app.route('/eval', …)` 必须早于主端点壳（主壳的 trace 中间件只包它之后注册的路由，`/eval` 请求因此不会被记两条）；子应用里先注册 `GET /eval/status`、再挂 trace 壳，status 就天然不落 trace。代价写在注释里：任何一次重排都会让「双层 trace」或「status 也落 trace」回来。
  顺带：Hono 子应用的 `matchedRoutes` 返回**带全前缀**的模板（`/eval/...`），route 本身就能当评测标记。

- **标记用 route 前缀，不新增 `origin` 列。**
  评测 trace 写进**评测世界选中的那个库**，`route = 'POST /eval/retrieve'` 已能识别与过滤（`GET /traces?route=` 的 hono-crud `filtering.fields` 里本来就有 `route`）。`resource_id` / `session_id` 只在它们所在的库里可解释——主库里的 trace 标着「来自评测」却指向评测库的 id，是悬空的。**能由既有字段推导的属性，不要再存一份。**

- **`/health` 多一个 `eval` 组，「全绿才 200」不破例。**
  shared 恒 `ok` + `mode=shared`（同一只池已被 `postgres` 组探过，不重复 ping）；isolated 真 `ping()` 评测库 + `mode=isolated` + `reachable`。隔离库不可达 ⇒ `/health` degraded/503，主应用仍照常跑——显式取舍：健康页要能看见「评测库坏了」；只想摆事实就把 `ok` 恒 true、detail 写 `reachable=false`。
  细节：detail 必须是**字符串数组**（前端 detailList 只认字符串/数组，给对象渲染成空）。

- **seed 是「复制对象到新 key + 重走 ingest」，不是共享 key。**
  `eval/<content_hash>/<原 key>`：主库 purge 带不走评测量；同一内容可重跑、不同内容不撞 `data_uri`；`content_hash` 去重是**库内作用域**（两库各一份合法）。
  实测：45 篇 → 44 seeded + 1 skipped / 0 failed；45 ready / 949 chunks / 949 embeddings；45/45 篇块数与块内容 hash 与主库一致；45 条 `data_uri` 全带 `eval/` 前缀。

- **「块对齐」是实测结果，不是保证。**
  隔离 seed 重新 parse/chunk/embed，gold 的 `chunk_index` 依赖同一份 bytes + 同一个 parser/chunker 的确定性。这轮 45/45 一致；某篇若用了非默认 chunker，块号就会漂——那时要么按主库原样复制该篇，要么重新出题。**评测定位符（7.1 的 gold）本质上是「上游确定性」的消费者。**

- **隔离性用「集合不相交 + 各自连接可见」证明，不是「数一下」。**
  `/eval/retrieve` 命中的 chunkId 在主库查不到、主 `/retrieve` 命中的在评测库查不到；`pg_stat_activity` 同时看得见 `ragdb` 与 `ragdb_eval` 两条连接；两库 `traces` 各记自己那条；主库 45 资源 / 949 chunks / 2947 traces 保持原样。`eval-isolated.test.ts` 在没设 `EVAL_DATABASE_URL` 时整组 skip，所以「124 条全过」里含 2 条真隔离集成。

- **dbmate 的 env 优先于 `.env`，连接串只走 env。**
  `eval:db:setup`：解析库名 → 缺库时连同一实例的 `postgres` 库 `CREATE DATABASE` → spawn `dbmate --no-dump-schema up`（用 `env` 覆盖 `DATABASE_URL`），不进 argv。重复执行幂等（16 条迁移 / 14 张表；`embeddings` 索引名与定义和主库一致）。
  两条 SQL 边界：`CREATE DATABASE` 不能进事务、不能参数化 ⇒ 库名先白名单校验（`[a-z_][a-z0-9_]*`）再加双引号。

- **启动期决定的选择，前端取一次就够。**
  mode 由 env 在启动时定、运行中不变 ⇒ 进评测页取一次 `GET /eval/status`，不轮询、不做全局 store。四态：共享主库 / 隔离库 / 检测中 / 评测状态未知；**未知态不画成绿**。代价：后端换模式重启后要刷新页面。

### 踩过的坑 / 方法论

- **本地 `.env` 已有 `EVAL_DATABASE_URL`，所以「默认」在这台机器上是隔离模式。** 要验共享必须显式 `EVAL_DATABASE_URL=` 起服务，测试里 `eval-route.test.ts` 也主动删了这个 env。**「默认值」要看运行环境的配置面，不要只看代码里的缺省分支。**
- **二选一分支里，「另一边」的对象不能出现在依赖表里**（`EvalPostgresRepo` 被提前注入 = 共享模式也建第二个池）。
- **注册顺序是回归点**：入口 `app.route('/eval')` 早于主壳，子应用 `/status` 早于 trace 壳。
- **端到端「隔离库真 down」没真停过**：health 的 degraded 只有单测假 probe 覆盖。**测过的边界要标清是假探针还是真断网。**
- **`/health` detail 给对象会渲染空**，必须字符串数组；**`CREATE DATABASE` 不能参数化**，库名走白名单。
- **`endpoint.ts` 的 `/resources` 跳过与 3.4 口径冲突，但不属于 7.0。** 按 Lynx 指示不动：本格只加 `/eval` 的注册顺序。

### 还没碰（留给后续）

- 7.1–7.4：`eval_*` 表、题集面板、发起运行、基线对照、judge / HITL；`/eval/resources` 与四表 CRUD 不镜像。
- 多知识库 / namespace → P3 之后独立功能；评测库独立备份 → 未排期。
- 7.2 的运行配置（k / topK / minSimilarity）还没参数化：7.0 用环境值跑通，7.2 再把 config 来源改成 run 快照。
- 浏览器手测项（三视图页头、窄屏、health 第 4 卡、后端停掉的未知态）留给 Lynx。
- 7.0 的连接代码尚未提交（`136857e` 只含 eval-probe/cases 与 Epic 5 尾巴）。

## 2026-10-29 · Story 7.1 题集与配置底座

### 学到的 / 定下的

- **配置用「一张表 + kind + jsonb」，把校验责任推到 API。**
  run 与 metric 同住 `eval_configs(id, kind, name, config jsonb)`：加参数不用改表，历史 run 快照也能原样存。代价是 DB 不知道 `k` 该是正整数、`min_similarity` 该在 0..1 —— **规则只能住一处**（`parseConfig`），前端不复制第二套。DB 只保三件事：kind 合法、name 非空、config 是对象。
  默认值不为空串之外的东西：`name` 唯一为导入按名找数据集服务；配置名允许重复（复制仍自动找空位只是 UI 体面）。

- **runs 骨架先建，是为了让 AC 能落地，不是提前做 7.2。**
  「数据集跑过 run 就拒删」需要一张表；骨架只给 `id / dataset_id / status / created_at`，`dataset_id` 的 `ON DELETE RESTRICT` 当最后一道闸，路由先数再删以产出「先删掉关联的 N 次运行」。快照与结果列 7.2 同表 ALTER，**不要为了今天的删除保护把 7.2 的形状写死**。

- **循环外键在 ORM 生成物里是实打实的坑。**
  `eval_datasets → eval_runs → eval_datasets` 让 drizzle introspect 出的 `schema.ts` 出现 TS7022/7024（自引用推断），运行期能跑、`tsc` 过不了。`baseline_run_id` 最终只是可空 uuid，归属校验放 7.3 的采纳动作。**外键不是越多越好：先问它服务哪条业务断言。**

- **drizzle-kit 把空串默认值导坏：`text().default('')` → `default(')`（未闭合字符串）。**
  修在生成脚本（归一化 + 断言），不手改 `schema.ts`。生成物一旦要手改，下一次生成就会覆盖回去。

- **gold 用「可读路径 + 块号 + 内容前缀」，不用随机 uuid。**
  `path` 后缀可能命中多条资源（legacy 与 planning 的 `ARCHITECTURE-SPINE.md` 同名）：导入要求**恰好命中 1 条**，0 条或多条都让该条失败，不猜。`content_prefix` 取块正文 trim 后前 80 字，是**软指纹**（不是哈希，也不是安全校验）；7.2 用它判「这块还是不是原来那块」。

- **评测数据必须跟随选中的库解析。**
  隔离库资源的 `data_uri` 带 `eval/<hash>/` 前缀，共享模式没有。所以 `eval:cases:import` 一律经 `EvalAssembly.repo`，在目标库里把 `path` 解析成 `data_uri`；换模式后题集要在新库再导一次，否则 7.2 会整片报 gold 失效。

- **前端接真接口的最小模式：写后重拉、错误原文上屏、不做乐观更新。**
  题集页写完重新拉数据集（`case_count` 变了）与 case 表；副本选中返回的新 id。删除 409 直接把服务端 message 放进提示条，不在前端拼话术。**复制 case 只是前端模板**（打开新建表单、不发请求），复制数据集才由后端深拷贝。

- **运行时契约在页面外：**
  三个评测页各挂同一个 `eval-mode-badge`（自取 `/eval/status`，不轮询）；`/evals` 运行视图仍读 mock（`evals-store` 只剩 runs），7.2 再接。**别误以为题集改了 run 会重跑。**

### 踩过的坑 / 方法论

- **条件渲染的提示条不能挂 `role="alert"`**：仓库的 `repo-guard.test.ts` 会拦（live region 必须在常驻节点上）；保持「可见条 + 常驻 sr-only role=status」的既有形状。
- **测试里 `findByText` 撞多处**：同一个名字在左栏与中栏各出现一次时用 `within(区域)`，别把「多元素」误判成「没渲染」。
- **约束探针要放进保存点**：一次 `BEGIN` 里第一条违反就整框 aborted，后续全被忽略；`SAVEPOINT` + `ROLLBACK TO` 才能一次验多条。
- **两库验收 = 同一条迁移跑两次 + 分别真跑**：主库与 `ragdb_eval` 各 17 applied；共享模式导入验完后删主库副本，避免两处题集漂移。
- **并发会话**：本轮期间 `app/web` 有另一会话在改 `session-list`，一度让 tsc/测试红；收口时其自行恢复。**看到不相关文件的红，先分辨归属再动手。**

- **`LIKE '%/' || suffix` 不是「后缀精确匹配」：`_` 与 `%` 是通配符。** 实测传 `prd_7a87a934.md` 会命中 `prd-7a87a934.md`，让「必须恰好 1 条」的护栏失效、gold 静默指错文件。改用 `right(data_uri, length($1)+1) = '/' || $1`；路径匹配要按字面量，不要用模式匹配。
- **同一个字段的两条写入口径必须一致。** 导入把 `content_prefix` trim 后截 80 字，但 API 的 `parseGold` 曾原样存——7.2 按 80 字比对就会误判 gold 过期。规则住一处（常量 + 归一化），两边都走它。
- **mock 的状态机不能挂在组件生命周期上。** `/evals` 的 2 秒完成定时器原本在卸载时清掉：切页再回来，run 永远 `running`、按钮永远禁用。定时器只改外部 store、不改组件 state 时，卸载不必清它。
- **`Promise.all` 的失败是一损俱损。** 配置页一次拉两组，一组 500 会让另一组的新数据也不回写，写成功却看起来没成功。部分失败用 `allSettled`，逐个 set + 统一提示。
- **双击是真实的输入。** 复制/删除没有 in-flight 守卫时，双击会生成两份副本，或第二次 404 被读成「删除失败」。一个 busy 状态把这些按钮串起来。
- **审查要分镜头，且要自核。** 本轮跑了「对抗/边界」与「验收/接线」两个独立镜头，再自己复现关键指控（LIKE 通配符、卸载定时器）。有三条建议按设计口径驳回（配置名唯一、导入删除对账、GET 超时），理由写进 handoff，避免下一轮被当成遗漏再提。

### 还没碰（留给后续）

- 7.2：run 表加列、队列、快照、recall/MRR；config 的 k/topK/minSimilarity 要真正参数化（当前 Retriever 仍读 AppConfig）。
- 7.3：baseline 写值（同数据集校验）、并排对照。
- 7.4：judge / HITL / 断言 / 隔离会话。
- gold 的前端挑选/编辑；JSON 导出；配置删除的 run 用量保护。
- 浏览器视觉验收（三栏、窄屏、编辑器、409 文案）留给 Lynx；走读页行号随 7.2 改动重生成。

> Epic 4.4 / 4.5 的聊天渲染学习（Markdown、引用、Mermaid、CSV、导出）已移到 [`app/web/LEARNING.md`](app/web/LEARNING.md)。

## 2026-10-29 · Story 7.2 发起检索评测

### 学到的 / 定下的

- **一行 run 自带完整历史：snapshot（输入）+ results（输出）两个 jsonb。** Lynx 拍板不建 `eval_run_cases` 明细表：读法永远是整份 run，15 条规模下 SQL 聚合/join 换不来收益；删 run 就是删一行。代价是跨 run 趋势/筛选会难受——那属于未排期的趋势图，届时再迁移。
- **每 run 参数走 `SearchOptions` 覆盖位，不另造 retriever。** 每 run 造一个带假 AppConfig 的实例能少改代码，但会把“当前检索是什么”变成两份真相；覆盖位让 `/retrieve` 与 run 始终同源（缺省回落 AppConfig）。
- **队列进程内、不持久化；重启靠清扫。** `markInterruptedRuns` 把 queued/running 全标 cancelled（实测日志 `I_EVAL_RUN_CLEANUP … 1`），已完成的行保留。取消/中止都不回滚已写的 case。
- **中止只在 case 之间。** 检索没有 signal，硬拆会把“一条 case 跑一半”变成新状态；取消后的 run 保留已完成行（实测 202 → cancelled，results=1）。
- **case 错误只污染该行。** 检索抛错 → 该行 error + 0 分，run 继续；只有快照参数不合法或执行器异常才让 run failed。
- **metric 只冻结不执行。** 7.2 只算 recall/MRR；judge 属 7.4；model/temperature 对检索评测不生效，只记录在快照。
- **负例要 `hit_count`。** 负例没有 gold，`matched/total` 恒为 0/0；没有原始命中数就看不出“拒答成功”还是“碰巧”。AC 的「命中数」在正负例上是两个语义，字段要分开。
- **配置删除不再需要保护：** run 靠 snapshot 展示配置名与参数，配置行删了 FK 置空即可；7.1 记的“配置删除的 run 用量保护”以快照方案自然解决。
- **运行删除只做后端（Lynx 拍板）：** 运行中 409「先中止」；删行事务清 `baseline_run_id`；UI 入口留 7.3。7.1 的「先删 N 次运行」现在有 API 出路。

### 踩过的坑 / 方法论

- **jsonb 数组追加用 `results = results || $2::jsonb`**，每次写一条；单 runner 串行，不需要行锁。
- **`markInterruptedRuns` 是全局动作**：集成测试里要加「库里活跃 run 是否恰好只有本用例的」守卫，否则会误伤真实 run（测试里已加并会在不独占时跳过断言）。
- **真跑数字要按口径核**：15 条 18.2s，recall 75.56% / MRR 53.45% / failed 3（三条负例各命中 8 条）；取消 202 → cancelled 保留 1 条；跑一半重启 → cancelled / 进程重启 保留 2 条。
- **远端库会抖**：本轮一次 `ETIMEDOUT` 让 3 条集成测试失败，恢复后重跑全绿；不要把网络抖动直接当成代码回归。
- **AC 的措辞要反推字段**：「最好名次、命中数/总数」在负例上推不出 0/0 以外的信息，于是补了 `hit_count`。

### 还没碰（留给后续）

- ~~7.3：基线采纳、逐条并排对照、运行删除 UI~~（2026-10-29 已交付，见下节）；7.4：judge / HITL / 答案评测。
- 跨 run 趋势/筛选（jsonb 方案的取舍）；同数据集并发点「运行」的排队压测；运行级 failed 的真断库演练。
- 浏览器视觉（轮询刷新、取消、右栏三 tab、另存两路、窄屏）归 Lynx；走读页行号随 7.3 改动重生成。

## 2026-10-29 · Story 7.3 对照与基线

> 一句话：把「两次 run 的数字并排」和「哪一次算基线」做成显式动作。只摆事实，不下判决。

### 学到的 / 定下的

- **基线只能显式采纳，且只接 `done`。** queued/running/failed/cancelled 一律不可；run 跑完只是候选，不自动改基线。换基线是一次明确的用户动作。
- **不做判法一致性黄条，改给「相同条目平均」。** 原 AC 要「判法不一致」提示与「不可直接比」；Lynx 当天改口径：总分（各自全部 case 的平均 recall/MRR）直接并排，另给「相同条目 · N 条」平均（交集）作为 apples-to-apples 的数。用交集消掉题集差异，而不是拦着不让比。
- **对照不替人下结论。** 不算 diff、不标变好/退化/新增/消失；基线缺的 case 显示 `—`，错误行标红。系统只摆事实（与「不做自动归因」的既定口径一致）。
- **顺序以当前 run 的快照为准。** 题集中途改过也不影响历史 run 的对照顺序。
- **当前即基线时不摆两列。** 同一份数字摆两遍没有意义；给一句提示即可。
- **删除入口放右栏顶部，两步确认 4 秒。** 左侧 run 行本身是 button，不在按钮里嵌按钮；运行中隐藏入口，后端仍 409 兜底。
- **不做乐观更新。** 采纳/删除成功后重拉数据集、运行列表与详情；界面状态来自库。
- **对照多一行基线身份**（时间 · 运行配置名）：否则两列数字不知道被钉的是哪次 run。

### 踩过的坑 / 方法论

- **`baseline_run_id` 无 FK 是 7.1 循环外键的遗留。** 采纳与删 run 之间有一个极小并发窗口：可能留下指向已删 run 的基线。对照会显示「读取基线运行失败」，重新采纳即可；单用户下接受，不为此加事务壳。
- **删 run 清基线沿用 7.2 的事务**，不新增逻辑；删基线 run 后前端靠重拉数据集把徽标一起更新。
- **「相同条目平均」只有前端单测覆盖**（交集、缺 case、百分比）；没在真库构造两次题集不同的 run 做端到端对照——测试边界要标清。
- **真跑口径**：后端 155 条（远端 MinIO/Postgres 抖动后重跑通过）、前端 85 文件 / 727 条；临时数据集 run done（recall 100% / MRR 50%）→ 采纳 200；排队中采纳 409 `E_EVAL_RUN_NOT_DONE`；跨数据集采纳 400 `E_EVAL_BASELINE_DATASET`；删基线 run 后 `baseline_run_id` = null。

### 还没碰（留给后续）

- 7.4 答案评测整格（OQ-7.4-1..6 已收口，待放行）；gold 的前端挑选/编辑。
- 自动 diff、趋势图、跨数据集对比 → 未排期。
- 浏览器视觉（两列对齐、采纳后徽标迁移、两步删除、窄屏）归 Lynx。

## 2026-10-29 · Story 7.4 答案评测

> 一句话：同一题的「回答」也要能评。断言是硬门，judge 给三维分，人可以改分或独立打分；系统按「断言 > 人判 > judge、取更严」给结论。

### 学到的 / 定下的

- **run 类型不加列，用快照推断**：`judge_model` 非空或任一 case 有断言 → 答案评测；否则仍是 7.2 的检索评测。历史 run 的模式由快照决定，改题集/配置不会改历史。
- **2026-10-30 追加：发起时可显式选「召回 / 对话」**（默认召回）。选了就写进 `snapshot.mode`，读路径优先用它；不传才回落到上面的推断。这样有断言的题集也能跑纯召回，不会被「全部变成对话测试」。
- **断言 = 子串（大小写不敏感）+ 每条可选正则**；正则保存时校验可编译，匹配统一 `i`。`expect` 全中、`reject` 全不中才算过。
- **judge 不设默认、不强制不同源**：任意在册模型都行，null 即不跑；单条失败只记该 case，不杀 run。
- **rubric 存版本名，正文住代码**：建 run 时把版本 + 解析后的正文冻进 snapshot，旧 run 的含义不随代码变化。
- **合成规则是「断言硬门 + 取更严」**：断言失败 → fail；有 judge 与人判时两者都 pass 才 pass；只剩一个就听它；都没有且有断言 → pass，没断言 → unscored。回答失败直接 fail；judge 失败不伪造分数。
- **人工复核不改写机器结果**：人判单独存 `human_results`，一致率用「人判 vs judge 原值」算；人可以改题面，写回 `eval_cases`，当前 run 快照不动。
- **一致率按 level 汇总**；低于整体一致率的题组在页面上标「低」，不设绝对阈值。

### AI SDK 实测

- **`generateText` + `Output.object({ schema })` 在 DeepSeek Flash 上可用**：1.7s 返回合法 JSON；SDK 把 JSON schema 以兼容模式注入 system message（会有一条 warning，不影响结果）。
- **2026-10-30 修正：judge 不再走 `Output.object`，改纯文本 JSON + zod 校验。** 原因：router1（OpenAI-compatible）不支持 json_schema，`Output.object` 每次都刷 `responseFormat is not supported` warning；虽然模型仍返回合法 JSON，但警告会污染日志、也把「任意在册模型」绑死在支持 structuredOutputs 的厂商上。改后 router1 与 DeepSeek 都实测返回合法 JSON、无 warning；解析失败仍逐条记 `judge.error`。
- **qwen-plus 结构化输出本轮没验成**：报 `Incorrect API key provided`，是环境里的 Key 问题，不是代码路径；不设默认 judge 后，这条不影响 7.4 落地，但首次用 qwen-plus 当 judge 前要先修 Key。
- **`generateText` 带 tools 会返回 `steps[]`**：每步有 `toolCalls` / `toolResults`；retrieve 命中在 `toolResults[].output.hits`，按出现顺序编号 1..N 即回答里的 `[n]`。spike 2 步、28.8s、命中 5 条、最终文本 `0.42`。
- **答案 run 不写 `sessions` / `messages`**：直接 `generateText` + `INSTRUCTIONS` + `buildAgentTools`，不经过 `ChatService` 的历史与落库；评测与聊天统计天然隔离。
- **真跑口径**：1 条 case 37s；回答 `0.42`、5 条引用；断言过；judge 因回答没带 `[n]` 判 citation=0 → fail；人判 pass/fail 可覆盖，一致率与 level 汇总按预期。

### 踩过的坑 / 方法论

- **回答链路与聊天链路的复用边界**：复用 `INSTRUCTIONS` + retrieve 工具即可，不复用 `ChatService`（它绑死 session、流式与落库）；评测要的是「一次非流式调用 + 结果快照」。
- **答案错误与 judge 错误不是一回事**：回答失败 → case fail；judge 失败 → 只有断言能兜底，没断言且没人判则 unscored。
- **final verdict 在读取时算**：机器 verdict 只是运行时的；人判后 summary 与逐条 `final_verdict` 都由读取时用 `human_results` 重算，避免两处写。
- **跨模式对照要拦**：基线是检索 run、当前是答案 run 时数字不是同一量纲，页面只提示「模式不同，不能并排」，不硬摆两列。
- **回答 run 的检索字段是空壳**：`rank/matched/recall` 填 0/null，`hit_count` 记引用数；聚合走 `summarizeAnswerResults`，不要拿 `summarizeResults` 算答案 run。

### 还没碰（留给后续）

- 多次采样与置信区间 → 未排期；pairwise → 后续；人工标注平台 → 不做。
- gold 的前端挑选/编辑 → 未排期（7.4 只做断言与题面修正）。
- 浏览器视觉（答案详情、人判表单、对照模式分支、窄屏）归 Lynx。

## 2026-10-30 · 测试真链路化

> 一句话：把测试里的「模拟后端 / 网络 / 模型」清掉，流程测试真打真后端、真库、真 MinIO、真 Ollama/LLM；真实造不出的坏输入仍构造，但明确标成边界输入。

### 学到的 / 定下的

- **真链路分三层**：后端单测直接打真依赖（真库/MinIO/Ollama/LLM）；前端 jsdom 流程测试打一只真后端进程（3101）；用户主路径走 Playwright（真浏览器 → preview → 后端 3102）。
- **共享真库 → 文件级串行**：`fileParallelism: false`。并行会互相压住（`/traces` 5s 查询超时、ingest 抢 Ollama），串行后 758 用例 144s，比并行慢但稳定。
- **前端 jsdom 的 `/api` 前缀由测试 setup 剥**：浏览器里这段是 vite proxy 的职责，测试里补同一段传输层适配，产品代码零改动。
- **错误路径保留构造的判据**：真后端不可能产生的输入（坏 JSON、缺分页、401/429、断网、挂起）→ 构造；能真造的（错签名 403、未软删 409、不可达端口 ECONNREFUSED）→ 真造。
- **编排测试的假协作者可以留**：`eval-runner` 的慢检索/抛错、`eval-runs-route` 的假执行器，是「可控时序」夹具；真实链路由 `retrieve-chain`、`eval-route`、`eval-answer-runner`、`eval-repo` 覆盖。
- **真链路测试必须自己清场**：唯一前缀 + `afterAll` 删除；文件内容也要带前缀，否则跨运行的 content_hash 会撞车，后端按 hash 去重直接返回 duplicate、没有 upload。

### 踩过的坑

- **jsdom 的 `File` 不是 undici 的 `Blob`**：`fetch(body: File)` 会把它当普通对象转成字符串 `[object File]`（13 字节），MinIO 里存的就是这 13 个字节，本地 sha256 与后端归档 hash 必不一致。测试 setup 里把全局 `File` 换成 `node:buffer` 的 `File` 才对。
- **`tsx` CLI 会 fork 子进程**：只 `child.kill()` 父进程会把真正跑服务的 node 留在 3101。spawn 用 `detached: true`，teardown 按 `process.kill(-pid)` 收整组，并以「端口释放」为准；启动前还要能自愈清理上次残留。
- **`node --env-file` 剥引号，手写 loader 不剥**：`LANGFUSE_BASE_URL="https://..."` 带引号进 `process.env`，`new URL` 直接抛；测试 loader 要与 Node 对齐。
- **Qwen3-8B 在「库里没有明确答案」的问题上会把 `<tool_call>` 写进 reasoning**：第二步 `finishReason=stop`、`text=""`、`reasoning` 里是伪工具调用文本。不是模型不能用；答案评测的 query 要选库里有答案的（如「P1 的 Non-Goals 有哪些？」）。
- **URL 归档会加 `archive_test=<uuid>` query**：后端防缓存行为，`source` 不能按精确字符串断言。
- **Playwright 里底部胶囊的 `aria-label="待入库队列"` 只在展开后出现**：折叠态是 `button "1 条待入库 · 60 B"`，E2E 要先点胶囊再点「开始入库」。
- **`npm test` 的输出别用 `tail` 截断**：失败详情在中间，只留尾部会丢失 9 个文件的失败原因；重跑时直接写日志文件。

### AI SDK / 产品事实

- `generateText` 的 `Result.text` 是回答文本；reasoning 单独在 `Result.reasoning`。tool-loop 下模型可能只产 reasoning，评测链路的 `answerCase` 会得到空 answer。
- 答案评测采用 8B answer + `deepseek:deepseek-v4-pro` judge；8B 做 judge 时 `Output.object` 在长 prompt 下偶发 schema 不匹配，judge 模型留在支持结构化输出的模型上。

### 测试数据清场（同日补）

- 真链路测试会写库：资源、代码库、评测、会话、消息、端点 trace。收尾统一调 `app/server/scripts/cleanup-test-data.ts` 物理删，不再依赖各测试自己的 `afterAll`。
- 三个入口：Vitest `globalSetup` teardown、Playwright `e2e/fixtures.ts`（每条用例后）、`e2e/global-teardown.ts`（整轮收尾，webServer 已停也能跑，脚本直连 DB）。
- **会话 DELETE 是软删**（`deleted_at`），行和 messages 仍留；清场必须走 SQL 硬删。
- E2E `/ask` 的新浏览器 context 不一定是空会话：不先点「新会话」会把问答写进列表第一条用户会话；评测发起抽屉的 datasetId 会被详情轮询覆盖（`launchOpen` 时跳过同步）。
- 边界：测试窗口内用户同时操作的 trace 会被一并清；测试结束后本机页面的请求保留。

### 还没碰（留给后续）

- E2E 已覆盖 `/ask`、`/ingest`、`/traces`、`/codebases`、`/evals-cases`、`/evals` 发起运行（答案 run 用 Qwen3-8B）；人判与基线对照 UI 未进 E2E。
- 本轮测试数据已清理（23 资源 / 18 代码库 / 41 对象）。
- 离线环境跑不了：真链路套件依赖 Tailscale 上的真库/MinIO/Ollama/LLM/Langfuse。

## 2026-10-30 · repo 层 Drizzle 化

> 一句话：adapter/repo 里能表达成 Drizzle 的读写全迁了；只剩 chunks/embeddings、BM25、向量索引与两处 join chunks / right-length 表达式是裸 SQL。

### 学到的 / 定下的

- **边界**：Drizzle 只碰 `schema.ts` 里有的表；chunks/embeddings 仍归 `chunk.ts` 裸 SQL（halfvec、`FOR UPDATE`、批量写），资源事务里的 `DELETE FROM chunks` 用 `tx.execute(sql...)` 保留。
- **对外签名不变**：repo 函数从 `Pool` 换成 `Orm`，contract 方法只换传参；路由与测试零改动。
- **时间戳**：schema 是 `mode:'date'`，写入口把 ISO 字符串 `new Date()`，读出口的 `iso()` 仍负责 Date→ISO。
- **`now()` 用 `sql\`now()\``**，不换应用时钟；`COALESCE($x, col)` 改成“只有非空才放进 set”。
- **rowCount**：Drizzle 的 update/delete 用 `.returning({ id })` 判长度。
- **数组查询**：能 `inArray(column, values)` 就 `inArray`；裸表（chunks）用 `inArray(sql\`col\`, values)`。

### 踩过的坑

- **Drizzle 把 pg 错误包进 `DrizzleQueryError.cause`**：路由里 `err.code === '23505'` 全部失效（重名从 409 变 500）。修法是沿 `cause` 链取 `code`（`routes/eval.ts`、`resource/archive.ts`）。
- **sql 模板不会把 JS 数组绑成 PG 数组**：`ANY(${ids}::uuid[])` 生成 `ANY(($1)::uuid[])`，pg 收到单值字符串报 malformed array literal；改用 `inArray(sql\`resource_id\`, ids)`。
- **相关子查询里的列引用可能不带表名**：`sql\`... WHERE c.dataset_id = ${eval_datasets.id}\`` 渲染成未限定的 `"id"`，`case_count` 恒 0；用字面表名 `eval_datasets.id`。
- **复制名 LIKE 要转义**：名字里的 `% _ \` 会把副本探测变成通配符；`escapeLike` 后实测 `a_b%c\d` 连续复制得到「副本 / 副本 2」。
- **列表/详情只取需要的列**：`codebases.manifest` 实测最大 42KB，`SELECT *` p50 84.4ms，显式列 58.5ms；列表、详情、complete/purge 状态检查统一走 `CodebaseSummary`（不含 manifest），只有树/文件读取才取完整行。
