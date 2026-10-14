# LEARNING.md — 学习日志

> Knowledge Copilot 的"真懂"记录。按 AGENTS.md §二 每阶段循环第 5 步沉淀：这一阶段练了什么、踩了什么坑、做了什么取舍。
> 项目主线是吃透 **Vercel AI SDK**（顺带深化 RAG）。Story 1.1 属基础设施地基，AI SDK 链路从 Epic 2 起才正式登场。

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

## P1 · 前端装饰效果层 — Paper Shaders + Motion（2026-10-14，设计自驱：纸 · 光 · 呼吸）

> 这一节不是某个 story 的产物，是"给界面加效果"的一次独立设计迭代。要点全在**怎么让装饰有语义、且能被工程约束住**。

### 学到的（可直接复用的判断）

- **装饰必须绑语义，不然就是噪点。** 最后落成的三层是：纸＝静默大面积（CSS 点阵+斜光，0 context）；光＝"需要被注意"的状态（MeshGradient，色相直接等于严重度：danger 泛红 / warning 泛琥珀 / accent 泛蓝）；呼吸＝"此刻正在发生"（PulsingBorder 只圈提交中的面板）。健康状态下页面是安静的 —— "没有坏消息就不发光"本身就是设计决定。
- **判据要能算，不能靠眼。** 上一版"光看不见"的账，根因是**没有判据**：亮档三色与 canvas 差 17，再被一层 `bg-canvas/70` 满铺遮罩一叠，合成后 Δ≈3/255。现在把判据写进 `index.css`：**装饰色与同档 canvas 的逐通道最大差 ≥ 20/255**，改值时按它复算。
- **单一真值来源这件事，CSS→WebGL 这一段是断的。** WebGL 只吃具体色值，读不到 `light-dark()`。解法：探针元素把 `color` 设成 `var(--color-x)` 再读 `getComputedStyle().color`，拿到解析后的 `rgb()`（库认逗号 rgb 语法，已核实物）。于是色板从"两份手抄"变回一份。
- **Tailwind v4 的 `@theme` 默认是懒落地的**：只有被某个 utility 用到的自定义属性才进 CSS。JS 探针读的 token 没有 utility 消费者 ⇒ 会被摇掉，而且**摇掉之后是静默变灰，构建全绿**。解法 `@theme static`（实测 `--color-accent-soft` 从 0 次变 1 次，CSS 只涨 0.5 kB）。顺带给探针加了哨兵灰：var 缺失和"值非法→IACVT→inherit"两种失败都收敛成同一个可识别的灰并 warn。
- **库的默认值会咬人**：`PulsingBorder` 的 `defaultPreset` 带 `scale: 0.6`，不显式覆盖时"一圈光"只画在容器中央 60% 的区域上，看着像渲染残缺。同理 `MeshGradient` 三笔色时 `swirl` 会把整片蓝聚到一角 —— 六笔交替才铺得开。**参数不是玄学，是 preset 与数组长度这些具体输入。**
- **浏览器给的 context 要自己还**：库的 `dispose()` 只 `canvas.remove()`，全包 `grep loseContext` 命中 0 —— context 等 GC，而 Chrome 约 16 个封顶。现在释放预算名额时对 `hostRef.querySelector('canvas')` 显式 `loseContext()`。实测：5 轮 / ↔ /components 后画廊恒 3、概览恒 0，再一次性申请 12/12 全成功。
- **Motion 的 `reducedMotion="user"` 只管 transform。** 凡补间 `height`（换源表单、分块面板、Alert）都得自己按 `useReducedMotion()` 掐时长，否则减动效用户照样看到抖动。而**换高度差很大的两块要用 `height: 0↔auto`，不要用 `layout`** —— layout 是 `transform: scale` 实现的，会把里面的输入框和文字一起拉伸。
- **数值入场用 `animate(from,to,{onUpdate})` 逐帧写 `textContent`**（不逐帧 setState），但 JSX 里的初始值必须写取整后的数：React 记忆的子节点会在任何一次父级重渲染时把浮点写回 DOM。

### 踩过的坑 / 方法论

- **"我修好了"要能被反证。** 三 lens 复审里，本轮自己上一版的两条"修复"被当场抓出来：① `children === undefined` 兜不住 `{cond && <X/>}` 传进来的 `false`（真修法是真值判断）；② 概览页 stagger 的注释写"顶栏先落、内容随后"，实际卡片先落 —— 因为容器只编排**接了 variants 的直接子元素**，中间隔了普通 div 就断链，而自带 `initial/animate` 的卡片根本不在那条时间线上。
- **内联 style 会盖掉 utility 类。** 调用方给装饰层传 `opacity-45` 控制强度，淡入层却把 `opacity` 写成内联 ⇒ 整条控制失效。修法是把"挂 className"和"做动画"拆成两层。
- **评审的静态断言要复核后再决定改不改。** 26 条里 1 条被否证（"pulse 的 neutral 是死分支" —— 画廊 tone 切换器就是活路径），其余成立。交叉命中是信号，不是结论。
- **能不开 WebGL 就不开。** 处理中那行的呼吸导轨用的是 CSS keyframes 而不是 shader：列表里可能同时 N 行 processing，逐行开 context 会直接撞穿预算闸。**"用什么技术"要由"这里可能同时有几个"决定。**

## P1 · 界面排版与 HCI 精化轮（2026-10-14，设计自驱：问答界面先行 + 真接口接线）

### 学到的（能复用的判断）

- **"后端有没有这个端点"要去问代码，别问规划文档。** 我按 `sprint-status.yaml`（epic-2 全 backlog）把整个问答页做成了 mock，评审第一枪就打穿了前提：`POST /retrieve` 其实已经上线（`app/server/src/index.ts:18` 挂载）。curl 一发 200、字段 camelCase、`lexicalScore` 给 null、空查询 400 —— 于是检索命中改真接口，mock 只留"生成"和"会话"。**判据顺序：挂载表 → 路由源码 → curl 实测，规划文档只说明"该不该做"，不说明"做没做"。**
- **一个契约只能有一份。** mock 层里自己定义过 `RetrievalHit`（snake_case）之后，真端点的 `RetrievalHit`（camelCase）就在同一个仓库里并存 —— "界面先行定的形状"和"后端已上线的形状"谁也不认谁。现在 mock 直接 `import type { RetrievedHit } from './api'`，命中类型不再在 mock 里出现。
- **hover 的高亮面积必须等于可点面积。** 之前整行 `hover:bg-fill`、可点的只有标题那截 button：用户在日期/类型上反复点，以为抽屉坏了。改法：行内一个 `absolute inset-0` 的透明"行靶"，源链接与动作簇用 `z-10` 盖回自己那片。
- **破坏性动作的步数要在每个入口一致。** 列表里删除要两步（就地二次确认），抽屉页脚却一步就删 —— 用户学不到哪个安全。同一个 arm 状态在两个入口共用，换资源/关抽屉自动收回。
- **"至多一行处于确认态"得由父级持有。** 行内私有 state 做不到互斥，两行同时挂着「确认删除」正是弹窗想避免的那个失效模式（点了 A 的收回、删的却是 B）。
- **轮询与本地变更要比分发先后。** 一次已经在飞的 `GET /resources` 会在 DELETE 成功之后落地，把刚删那行原样放回列表 —— 界面同时显示"已删除"和那一行还活着。做法：变更前置代次，落地时 seq 不最新就丢这份响应。
- **行内箭头函数进了子组件的 effect 依赖，就是每渲染重跑一遍副作用。** 抽屉的"记 opener + 抢焦点 + 挂 Escape"依赖了 `onClose`，结果开着抽屉时每 3s 轮询都把它重跑一次：用户刚 Tab 到「复制 id」就被无声拽回面板顶。收进 ref，依赖只留 `[open]`。
- **文案里的承诺也是待实现的断言。** 概览写「列表每 3s 自动刷新」而轮询只在资源页存在 —— 和上一轮"画了 ⌘K 却没监听"是同一类毛病，只是从图标侧换到了文字侧。修法不是改文案，是把轮询抽成 `use-resources.ts` 让两页共用一份口径。
- **验收窗口会替你藏住 bug。** 两栏布局在 lg(1024) 开启，而我只在 1280 验过：那里左列约 780px 刚好装得下。1024 下左列只剩 360px，固定段超 340 ⇒ 标题压成 0、删除按钮溢出卡外。以后新布局至少量 1024 / 900 两档（`scrollWidth - clientWidth` 一条式子就够）。
- **有界高度是"滚动交互"的前提。** 「贴着底部才跟着滚」这条承诺，在 `min-h + flex-1` 且外层没有高度约束的容器里永不成立 —— 它根本不 overflow，滚动条挂在 document 上，`onScroll` 一次都不触发。给容器 `h-[min(54dvh,36rem)]` + ResizeObserver 跟内容长高，承诺才落地。
- **aria-modal 不是写完就完了**：可及名（`aria-labelledby`）、Tab 圈在面板内、背景滚动锁，少一样，键盘用户就能 Tab 进遮罩背后那条列表并按下"确认删除"。

### 方法论

- **评审的"前提级"结论优先于"缺陷级"结论。** 本轮 40+ 条里最值钱的不是任何一条 bug，而是"你以为没有的端点其实有"。它改的是做法，不是补丁。
- **不动用户的库**：删除/取消只验到"确认条出现与收回"，真删真取消留给 Lynx。同理，并行会话把本地库清空时（`GET /resources` 返回 `[]`），我不去重新灌数据，改用字段与真返回逐一对齐的 `DEMO_HITS` 验组件，并把这条限制写进未闭环清单。
