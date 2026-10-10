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
