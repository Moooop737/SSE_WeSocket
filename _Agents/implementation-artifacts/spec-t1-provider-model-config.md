---
title: 'T1 · 供应商与模型配置入库（API Key 管理）'
type: 'feature'
created: '2026-10-30'
status: 'ready-for-dev'
route: 'standalone'
phase: 'P3'
decisions: '2026-10-30 D1–D10 已拍板；D6 二次修订：默认行住 models 表 kind=default（不建单独表）；OQ-T1-0/1/2 已收口（2026-10-30）；同日 Lynx 拍板从临时支线移入 P3 工程项'
context:
  - AGENTS.md
  - _Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md
---

# T1 · 供应商与模型配置入库

> P3 工程项（2026-10-30 Lynx 拍：从临时支线移入 P3），不进 `epics.md` 的 Epic 列表；只在本文件与 `sprint-status.yaml` 的 `standalone_stories` 里记。不占 P3 Agent loop 主线能力点；与 Epic 8 / P3 主线的执行顺序由 Lynx 定。

## Intent

**Problem:** 供应商 Key 住在 `.env`（`DEEPSEEK_API_KEY` 等），模型清单是 `adapter/model/registry.ts` 的 10 行编译期字面量，默认模型是 `.env` 的 `CHAT_MODEL` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS`。加一个同厂商的第二份 Key、加一个自定义 OpenAI 兼容供应商、换默认模型，都要改代码或 env 并重启。

**Approach:** 把 provider / model / API Key / 默认模型落进 DB；启动时从 DB 装载，运行时不再读这些 env。提供 `/config` 管理 API 与独立配置页；Key 用 AES-256-GCM 存密文，API 只回 `has_api_key`。保存后重启生效（D4 A），不在本 story 做热更新。

## Boundaries & Constraints

**Always:**

- AD-4 不变：`adapter/provider/` 仍是唯一造客户端处，`adapter/model/` 仍是唯一兑换 SDK 句柄处；本 story 只换配置来源，不搬格。
- 模型键仍是 `${provider.name}:${model_id}`；`provider.name` 创建后不可改（`sessions.model`、`eval_configs` 的快照都存这个键）。
- 同一 `kind` 可以有多行 provider，靠 `name` 区分（如 `deepseek1` / `deepseek2`）；同厂商多实例是正常用法，不做去重。
- Key 只以密文入库；GET 配置接口只回 `has_api_key` / `key_status`，不回明文、不回末四位、不回长度。
- 配置接口的请求体不得进 `traces.payloads`；日志与错误信息不得出现 Key 值。
- DB 是唯一来源：seed 之后运行时不再回退 env；空库也能启动，但聊天 / 入库给明确错误。
- 配置写接口返回 `restart_required: true`；本 story 不做运行时 reload。
- 默认模型不另建表，也不在 `models` 上加 `is_default`：默认是 `models` 表里 `kind='default'` 的**指针行**，用 `provider_id` + `model_id` 指向一条真实的 `language` / `embedding` 模型行。
- 测试优先真实 DB / 真实容器；前端规则测试用 Vitest + jsdom。

**Never:**

- 不把 S3 / Langfuse / DATABASE_URL 搬进 DB（D1 A）。
- 不做热更新、连接测试、模型发现、自定义 headers / query、per-model 参数（temperature 等仍在请求与 eval 配置里）。
- 不做多租户 / 登录 / RLS（D9 A，沿当前 127.0.0.1 / Tailscale 信任边界）。
- 不做自动重嵌入、Key 轮换 / 重加密、审计日志、Key 提示位。
- 不改检索算法、RRF、阈值、stopWhen；只换模型来源。
- 不改 `epics.md` 的 Epic 列表；不新增 Epic 9。
- 不把真实模型行的 `kind` 改成 `default`（那会让它退出 language / embedding 句柄表）。

## Decisions（2026-10-30，Lynx 拍板）

- **D1 Key 范围＝只 LLM 供应商**。供应商可多实例；提供 DeepSeek / DashScope 快速添加；自定义供应商走 OpenAI 兼容；Ollama 可选原生或 OpenAI 兼容接口。多个 DeepSeek 用 `provider.name` 区分（`deepseek1` / `deepseek2`）。
- **D2 模型范围＝全部**：语言模型 + 嵌入模型都入库；嵌入维度存 `models.dimensions`。
- **D3 密钥存储＝AES-256-GCM**，主密钥来自新 env `CONFIG_SECRET_KEY`；DB 只存密文。
- **D4 生效方式＝保存后重启生效**；不做热更新。
- **D5 初始化＝一次性 `config:seed`**；之后 DB 唯一来源；空库可启动。
- **D6 默认模型＝`models` 表里的 `kind='default'` 指针行**。`id='default'` 为对话默认，`id='embedding'` 为嵌入默认；每行用 `provider_id` + `model_id` 选一条真实的 language / embedding 模型行。`models` 表没有 `is_default` 列，也不另建默认表。`CHAT_MODEL` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` 退役。
- **D7 删除＝任意硬删**：provider 删除级联其 models；model 直接删；不做 409 引用守卫。删模型时同事务删掉指向它的 `kind='default'` 行；启动时清理孤儿默认行。历史会话按现有 `W_SESSION_MODEL` 回落默认；评测配置引用已删模型时按现有逻辑失败。
- **D8 前端＝独立配置页**，侧栏新增“配置”入口；供应商 + 模型 + 默认模型三块。
- **D9 鉴权＝不加**，沿用当前本地 / Tailscale 信任边界，文档标注风险。
- **D10 归属＝独立 T1（P3 工程项）**，不进 Epic 列表，只记 `sprint-status.yaml`；2026-10-30 从临时支线移入 P3。

### D6 展开（二次修订后）

- 只有一张 `models` 表，两种行：
  - **模型行**：`kind='language'` 或 `'embedding'`，`id='${provider.name}:${model_id}'`，是真正的模型定义。
  - **默认行**：`kind='default'`，`id='default'`（对话）或 `'embedding'`（嵌入），`provider_id` + `model_id` 指向一条真实模型行；它本身不进任何句柄表。
- 为什么不把真实模型行的 `kind` 改成 `default`：`language` / `embedding` 这两个 kind 决定它进哪张句柄表；改成 `default` 后模型就从注册表里消失了。默认行必须是指向它的另一行。
- 为什么是两个默认行：D2 选了嵌入也入库，对话和嵌入各需要一条默认；一条 `default` 只能选一个目标模型。`id` 固定为 `default` / `embedding`，天然一用途一行。
- 默认行不能悬空：D7 B 允许硬删模型；`DELETE /config/models/:id` 在同一事务里先删指向该模型的 `kind='default'` 行，再删模型行。启动装载时再清理一次孤儿默认行（目标模型不存在），日志 `W_DEFAULT_ORPHAN_CLEANED`。
- `models.id` 用 text 自然键（模型行＝模型键，默认行＝`default` / `embedding`），不沿用 UUID PK。原因：Lynx 指定 `id='default'`，且模型键本来就是 `${provider.name}:${model_id}`；本表不进 hono-crud，四表 CRUD 的 UUID 约定不受影响。

## Data Model

新增迁移 `app/server/db/migrations/20261030120000_create_llm_config_tables.sql`。配置表属应用级，运行时只读主库；迁移在主库与 `ragdb_eval` 都会 applied，评测库里的副本不使用。

```sql
CREATE TABLE providers (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                text NOT NULL UNIQUE,
  kind                text NOT NULL,
  base_url            text,
  api_key_ciphertext  text,
  enabled             boolean NOT NULL DEFAULT true,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT providers_name_format CHECK (name ~ '^[a-z0-9][a-z0-9_-]{0,31}$'),
  CONSTRAINT providers_kind_check CHECK (kind IN ('deepseek', 'dashscope', 'openai-compatible', 'ollama', 'ollama-compat')),
  CONSTRAINT providers_base_url_check CHECK (
    (kind IN ('deepseek', 'dashscope') AND base_url IS NULL)
    OR (kind IN ('openai-compatible', 'ollama', 'ollama-compat') AND base_url IS NOT NULL)
  )
);

CREATE TABLE models (
  id            text PRIMARY KEY,
  provider_id   uuid NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  model_id      text NOT NULL,
  kind          text NOT NULL,
  display_name  text NOT NULL,
  dimensions    integer,
  enabled       boolean NOT NULL DEFAULT true,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT models_id_nonempty CHECK (btrim(id) <> ''),
  CONSTRAINT models_id_kind_shape CHECK (
    (kind = 'default' AND id IN ('default', 'embedding'))
    OR (kind <> 'default' AND id LIKE '%:%')
  ),
  CONSTRAINT models_provider_model_kind_unique UNIQUE (provider_id, model_id, kind),
  CONSTRAINT models_model_id_nonempty CHECK (btrim(model_id) <> ''),
  CONSTRAINT models_display_name_nonempty CHECK (btrim(display_name) <> ''),
  CONSTRAINT models_kind_check CHECK (kind IN ('language', 'embedding', 'default')),
  CONSTRAINT models_dimensions_check CHECK (
    (kind = 'embedding' AND dimensions IS NOT NULL AND dimensions BETWEEN 1 AND 16000)
    OR (kind IN ('language', 'default') AND dimensions IS NULL)
  )
);

CREATE INDEX models_provider_id_idx ON models (provider_id);
CREATE INDEX models_kind_idx ON models (kind);
```

- **模型行**：`id='${provider.name}:${model_id}'`（模型键），`kind='language'|'embedding'`，`display_name` 是显示名，`dimensions` 只在 embedding 行有值。
- **默认行**：
  - `id='default'`、`kind='default'`、`provider_id` + `model_id` 指向一条 `language` 模型；`display_name='默认对话模型'`，`dimensions=NULL`。
  - `id='embedding'`、`kind='default'`、`provider_id` + `model_id` 指向一条 `embedding` 模型；`display_name='默认嵌入模型'`，`dimensions=NULL`。
- `providers.name` 规则：小写字母 / 数字 / `-` / `_`，1–32 字符，不能含 `:`（键分隔符）。**创建后不可改**。
- 默认行的 `provider_id` + `model_id` 必须命中一条真实模型行；没有 FK，靠 API 校验 + 启动清理。删模型时同事务删默认行。
- `models_provider_model_kind_unique` 允许模型行与默认行共享 `provider_id` + `model_id`（kind 不同）；两条默认行如果指向同一 provider/model 会撞 kind='default' 唯一约束，正常配置不会发生（对话与嵌入目标不是同一条模型）。

## Provider Kinds

| kind | UI 文案 | base_url | API Key | 工厂 |
|---|---|---|---|---|
| `deepseek` | DeepSeek | 可空（空＝SDK 默认） | 必需才可用 | `createDeepSeek` |
| `dashscope` | DashScope | 可空（空＝SDK 默认） | 必需才可用 | `createAlibaba` |
| `openai-compatible` | 自定义 OpenAI 兼容 | 必填 | 可选（本地 vLLM 可不填） | `createOpenAICompatible` |
| `ollama` | Ollama（原生） | 必填（根地址） | 不需要 | `createOllama` |
| `ollama-compat` | Ollama（OpenAI 兼容） | 必填（含 `/v1`） | 可选 | `createOpenAICompatible` |

- `ollama-compat` 的 `base_url` 直接存 OpenAI 兼容基址（如 `http://127.0.0.1:11434/v1`），代码不再自行拼 `/v1`。seed 用 `OLLAMA_BASE_URL + '/v1'`。
- `silicon-flow` 与 `router1` 在 seed 时落成 `openai-compatible`，名字保持不变，base_url 取当前硬编码地址 / `ROUTER1_END_POINT`，因此现有模型键不变。
- 多实例：`deepseek1` / `deepseek2` 都是 `kind=deepseek`；模型键分别是 `deepseek1:...` / `deepseek2:...`。`/models` 的 `provider` 返回 `name`，前端品牌标按 `kind` 挂。

## Availability Rules

- **provider 可用** = `enabled = true` 且（该 kind 不要求 Key 或 `api_key_ciphertext` 非空且能解密）。
- **model 可用** = model `enabled = true` 且 provider 可用。
- **默认可用** = 默认行存在，目标模型行存在且可用。
- `/models` 只列 **可用的语言模型**；`default` 取 `id='default'` 的默认行，目标可用时返回模型键，否则 `null`。
- 默认行不存在 / 目标模型不可用 / 目标被删时：日志 `W_DEFAULT_MODEL_UNAVAILABLE`；`/models` 的 `default = null`；聊天返回 `409 E_NO_CHAT_MODEL`；不自动顶替（OQ-T1-2 已收口 A）。
- 嵌入默认不可用时：`/retrieve` 与入库返回 `409 E_NO_EMBEDDING_MODEL`；聊天里的 retrieve 工具返回结构化错误，不冒 500。

## Runtime & Boot

1. `setupLangfuse()` 保持现状（仍读 env）。
2. `AppConfig` 只保留启动必需 env：`DATABASE_URL` / `EVAL_DATABASE_URL` / `PORT` / S3_* / `CONFIG_SECRET_KEY`。`CHAT_MODEL` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` / `OLLAMA_BASE_URL` 不再参与运行时；seed 脚本读它们。
3. `CONFIG_SECRET_KEY`：32 字节 base64。DB 存在任一密文而它缺失 / 非法 → `E_CONFIG_SECRET_KEY` 退出。DB 无密文时可缺省，日志 `W_CONFIG_SECRET_KEY_EMPTY`。
4. `index.ts` 在建路由前 `await container.resolve(ModelRegistry).load()`；DB 读失败 → `E_CONFIG_LOAD` 退出。`ModelRegistry` 未 load 时 `ChatHandle` / `EmbeddingHandle` 构造抛 `E_CONFIG_NOT_LOADED`（编程错误，不是用户错误）。
5. `ModelRegistry` 从 DB 构造 provider 与两张句柄表；`kind='default'` 的行跳过，不当模型；缺 Key 的必需 Key provider 跳过并日志 `W_PROVIDER_NO_KEY`；解密失败跳过该 provider 并日志 `E_PROVIDER_KEY_DECRYPT`（不打印密文/Key）。
6. 启动装载时清理孤儿默认行（`kind='default'` 但目标模型不存在），日志 `W_DEFAULT_ORPHAN_CLEANED`。
7. 空库：`W_CONFIG_EMPTY`，正常启动；`/models` 返回 `{default:null, models:[]}`；聊天 409 `E_NO_CHAT_MODEL`；入库 409 `E_NO_EMBEDDING_MODEL`；配置页仍可用。
8. `ChatHandle` 默认模型改为可空；`AgentChatService.ask()` 每次请求读当前默认（或显式 model），为空报 `E_NO_CHAT_MODEL`。
9. `EmbeddingHandle` 的 model / modelId / dimensions 改为可空；ingest 开始时检查并返回 `E_NO_EMBEDDING_MODEL`。
10. `cleanUpOnBoot` 的维度日志改读当前嵌入默认；`/health` 的 ollama 组取“默认嵌入模型所属 provider 的 base_url”，若它不是 ollama 系则取默认语言模型的，若都不是则 `ok: true, detail: ['no ollama provider']`。
11. `EvalRoute` 的模型集合从当前 `ChatHandle.catalog()` 读取（构造期 load 已完成，D4 A 不需要动态 reload）。

## B0 spike 结论（2026-10-30）

- **启动顺序可行**：`index.ts` 的 `EvalAssembly` 在路由构造前就注入 `EmbeddingHandle` / `RetrieverHandle`（`src/index.ts:40`），所以 `await RuntimeConfigLoader.load()` + `await ModelRegistry.load(runtime)` 必须插在 `EvalAssembly` 之前；`PostgresRepo` / `AppConfig` / `ObjectStoreHandle` 的解析不碰模型句柄，可以在 load 之后或之前。
- **加密选 `node:crypto`**：`createCipheriv('aes-256-gcm')` 同步、`setAAD` / `getAuthTag` / `setAuthTag` 分开放，信封 `v1:<iv>:<tag>:<body>`；实测 roundtrip 通过、AAD 不匹配抛错。WebCrypto 的 `encrypt` 输出是 `ciphertext||tag`，手拆后在解密侧拼反顺序会 `OperationError`，不选它。
- **句柄可空的影响面**：
  - `ChatService` 构造期捕获 `Handle.model`（`src/agent/chat/chat.ts:30`）；改为路由解析 `Requested / Session.model / Handle.defaultModel()`，`ChatService.ask` 收非空 `Model`，无默认时路由 409 `E_NO_CHAT_MODEL`。
  - `RetrieverFactory` 与 `ParadeDbVectorSearch` 现在读 `config.embeddingDimensions`（`src/retrieve/retrievers.ts:61-70`、`src/retrieve/search/paradedb-vector.ts:19`）；改为读 `Deps.embedding.dimensions`，缺失时 `search` 在 embed 前抛 `E_NO_EMBEDDING_MODEL`。
  - `ingest` 用 `embedding.modelId` / `dimensions`；`ResourceIngest.ingest` 在建 recipe 前 409 `E_NO_EMBEDDING_MODEL`，管线内再兜一次。
  - `eval` 的快照与 `eval` 路由用 `embedding.modelId` / `dimensions`；无嵌入默认时建 run 409 `E_NO_EMBEDDING_MODEL`。
  - `health` 的 ollama 组用 `config.ollamaBaseUrl` / `config.embeddingModel`；改读运行时默认嵌入 / 对话模型的 provider 行。
  - `models` 路由的 default 用 `config.chatModel`；改读 `ChatHandle.defaultKey()`。
  - `cleanUpOnBoot` 的维度日志用 `config.embeddingDimensions`；改读 `EmbeddingHandle.dimensions`。
- **类型会变宽**：`ProviderEntryName` / `LanguageModelId` / `EmbeddingModelId` 的编译期 union 退役为 `string`；`adapter/contract.ts` 的 `RegistedProviders` / 模型表类型同步放宽，不再用 `as` 收窄。
- **前端连带项**：`/models` 只回 `provider`（实例名）时，`deepseek1` / `deepseek2` 挂不上 `provider-logo` 的键。`/models` 增加 `provider_kind`（`deepseek` / `dashscope` / `ollama` / `ollama-compat` / `openai-compatible`），前端品牌标用 kind，provider 名仍用于显示与模型键。
- **无循环依赖**：`RuntimeConfigLoader`（`adapter/config/loader.ts`）注入 `PostgresConfigRepo` + `AppConfig`，负责读行、解密、组装可用性与默认；`ModelRegistry.load(runtime)` 只吃纯数据，不 import repo / crypto；`index.ts` 负责调用顺序。`ModelRegistry` 不再 import `adapter/contract.ts` 的运行时值。

## API

新增 `src/routes/config.ts`（plain Hono，不进 hono-crud），在 `index.ts` 挂 `/config`。所有响应遵循现有 `{code,message}` 错误体。

| Method | Path | 用途 |
|---|---|---|
| GET | `/config/providers` | 供应商列表（脱敏） |
| POST | `/config/providers` | 新建供应商 |
| PATCH | `/config/providers/:id` | 改 `base_url` / `enabled`；`name` / `kind` 不可改 |
| PUT | `/config/providers/:id/api-key` | 设置 / 替换 Key |
| DELETE | `/config/providers/:id/api-key` | 清除 Key |
| DELETE | `/config/providers/:id` | 硬删，级联 models（含默认行） |
| GET | `/config/models` | 全部**真实模型行**（不含 `kind='default'`，含停用/不可用） |
| POST | `/config/models` | 新建模型行 |
| PATCH | `/config/models/:id` | 改 `display_name` / `dimensions` / `enabled` |
| DELETE | `/config/models/:id` | 硬删模型；同事务删指向它的默认行 |
| GET | `/config/defaults` | 两条默认行：`default`（对话）/ `embedding`（嵌入） |
| PUT | `/config/defaults/:id` | 用 `{provider, model_id}` 写 `models` 的 `kind='default'` 行；`:id` = `default` 或 `embedding` |
| DELETE | `/config/defaults/:id` | 删除该默认行 |
| GET | `/models` | 现有接口：可用语言模型 + 默认 |

**响应字段（供应商）**：`id, name, kind, base_url, has_api_key, key_status('none'|'set'|'error'), enabled, model_count, created_at, updated_at`。永不返回 `api_key_ciphertext`。

**响应字段（模型行）**：`id('${provider.name}:${model_id}'), provider_id, provider_name, provider_kind, model_id, kind('language'|'embedding'), display_name, dimensions, enabled, available, unavailable_reason('provider_disabled'|'provider_no_key'|'provider_key_error'|'model_disabled'|null)`。

**响应字段（默认行）**：`id('default'|'embedding'), provider, model_id, key, kind('language'|'embedding'), dimensions, available, unavailable_reason, updated_at`。

**`GET /models` 响应**：`{ default: string | null, models: [{ id, provider, provider_kind, name }] }`。`provider` 是实例名（如 `deepseek1`），`provider_kind` 是工厂类型（如 `deepseek`），前端品牌标用 kind，provider 名仍用于显示与模型键。

**校验**：

- 供应商：`name` 格式与唯一；`kind` 枚举；`base_url` 按 kind 必填/可空，必须 http/https；`api_key` trim 后非空（设置时），长度 ≤ 4096。
- 模型：`provider_id` 存在；`model_id` 非空；`kind` 为 `language` / `embedding`（不接受 `default`）；`display_name` 1–80；`embedding` 必须给 `dimensions` 1–16000，`language` 不接受 dimensions；同一 `(provider_id, model_id, kind)` 唯一；`id` 由服务端拼成 `${provider.name}:${model_id}`，不接受客户端传。
- 默认：`PUT /config/defaults/default` 只接语言模型，`PUT /config/defaults/embedding` 只接嵌入模型；`{provider, model_id}` 必须命中一条真实模型行，否则 400 `E_DEFAULT_MODEL_NOT_FOUND`；kind 不匹配 400 `E_DEFAULT_KIND_MISMATCH`。UPSERT `models` 表里 id 固定的默认行（`kind='default'`），不碰真实模型行。
- 删 provider：级联删 models（包括 `kind='default'` 行，默认行的 provider_id 就是目标 provider）；UI 两步确认；接口不因引用返回 409（D7 B）。
- 删 model：事务内先删 `kind='default' AND provider_id=... AND model_id=...` 的默认行，再删模型行；接口不因引用返回 409（D7 B）。

**Key 加密**：

- AES-256-GCM；12 字节 IV；16 字节 tag；AAD = provider.name；密文信封 `v1:<base64url(iv)>:<base64url(tag)>:<base64url(ciphertext)>`。
- 只写密文；解密在启动装载时做一次。解密失败按 `key_status='error'` 处理，provider 不可用。
- `CONFIG_SECRET_KEY` 不打印；seed / 启动日志只打 `has_key` 与 provider name。

**Trace / 日志**：

- `/config` 前缀加入 endpoint trace 的 `NO_PAYLOADS` 判定（新增前缀判断），请求体永不进 `traces.payloads`；响应体也不含 Key。
- 失败请求（400/409/500）同样不记 payload；加测试：请求体含 `sk-test-...`，trace 的 payloads 与日志都不含它。
- API 错误信息只带 provider id/name，不回显 Key。

**OpenAPI**：`routes/doc.ts` 补 `/config/providers`、`/config/models`、`/config/defaults` 路径与基本 schema；不要求自动生成。

## Frontend

- 新 route `/config`；侧栏新增“配置”入口（按现有导航分组放，不新设大分组）。样式沿用 Geist / 现有组件。
- 页面三块：
  1. **默认模型**：两行——对话默认、嵌入默认。每行两个联动下拉：先选 provider，再选该 provider 下对应 kind 的真实模型；保存调 `PUT /config/defaults/:id`，清除调 `DELETE`。嵌入那行显示 dimensions。默认行不可用时给红色“已配置但不可用”提示。
  2. **供应商**：行内显示 name、kind 文案、base_url、Key 状态、enabled、model_count；操作：设置/清除 Key、启停、编辑 base_url、删除。新增按钮给四个入口：DeepSeek、DashScope、Ollama、自定义 OpenAI 兼容。Ollama 表单里有“原生 / OpenAI 兼容”二选一，落到 `ollama` / `ollama-compat`；base_url 预填当前 Ollama 地址（compat 带 `/v1`）。
  3. **模型**：按 provider 分组表格，只列真实模型行；列：key、display_name、kind、dimensions、enabled、availability、操作（编辑、删除）。默认不在这张表里改，顶部“默认模型”块是唯一入口；表格里的“默认”徽标由 `/config/defaults` 结果匹配得出。
- 保存后顶部提示“已保存；重启后端后生效”（D4 A）。不做运行时状态轮询。
- 删除确认文案要写清影响：provider 删除会连带模型与默认行；删默认目标模型后该用途没有默认；历史会话会回落默认，评测配置可能失败。
- `/ask` 处理 `default: null`：模型下拉为空时禁用发送，提示“未配置可用的默认对话模型”，链接到 `/config`。模型下拉的品牌标改用 `/models` 的 `provider_kind`，不再拿 `provider` 实例名去匹配 `provider-logo`。
- Key 输入框只用于新值；编辑时只显示 `has_api_key`，不回填。测试要钉“页面不出现已存 Key”。

## Acceptance Criteria

1. 迁移 applied；`providers` / `models` 两张表、`kind='default'` 默认行约束、级联删除与 seed 脚本按上文落地。
2. `npm run config:seed` 幂等；把当前 6 个 provider、10 个 model、两条默认行与 env Key 灌入 DB；重复跑不重复插入、不覆盖已改行；日志不含 Key。
3. seed 后 `GET /models` 的模型键与默认模型与迁移前一致（当前默认 `CHAT_MODEL=deepseek:deepseek-v4-flash`、`EMBEDDING_MODEL=ollama-compat:qwenembed`，以实际 `.env` 为准）。
4. 启动只从 DB 读 provider/model/default；`CHAT_MODEL` / `EMBEDDING_MODEL` / `EMBEDDING_DIMENSIONS` / `OLLAMA_BASE_URL` 改值不再影响运行时（seed 除外）。
5. 空库可启动：`/models` 200 且 `default=null`、`models=[]`；`/chat` 409 `E_NO_CHAT_MODEL`；入库 409 `E_NO_EMBEDDING_MODEL`；`/config` 可用。
6. 供应商 CRUD：同 kind 多实例（`deepseek1` / `deepseek2`）可并存；name 唯一且创建后不可改；base_url 按 kind 校验；删除级联 models（含默认行）；Key 设置/清除后 `has_api_key` 正确，GET 不出现 Key。
7. 模型 CRUD：只接 `language` / `embedding`；嵌入 dimensions 必填；模型行 `id` 是模型键；`GET /config/models` 不返回 `kind='default'` 行；删除模型会同事务删掉指向它的默认行。
8. 默认行：`GET /config/defaults` 返回 `default`（对话）与 `embedding`（嵌入）两条；`PUT` 用 `{provider, model_id}` 选中真实模型并 UPSERT `models` 的默认行；kind 不匹配 400；`DELETE` 删除默认行；`GET /models` 的 `default` 与 `default` 行一致，不可用时为 null；启动清理孤儿默认行。
9. Key 安全：DB 中是密文；`GET /config/providers` 与错误响应不含 Key；`/config` 失败请求的 trace payloads 不含 Key；日志不含 Key；`CONFIG_SECRET_KEY` 缺失且有密文时启动 `E_CONFIG_SECRET_KEY`。
10. 前端 `/config` 可完成：新增 DeepSeek / DashScope / Ollama 两种接口 / 自定义 OpenAI 兼容；设置 Key；启停；新增模型；在“默认模型”块选 provider + model 设/清默认；删除供应商与模型；保存后重启提示。
11. 回归：现有聊天、检索、入库、评测、健康检查在 seed 后的配置下正常；`/models` 前端模型下拉不破；多实例 `deepseek1` / `deepseek2` 的品牌标走 `provider_kind` 正常；`tsc` 0、后端与前端测试全绿、`npm run build` 绿。
12. 真跑：seed → 原有 DeepSeek 聊天 → 加 `deepseek2` + Key → 在默认块切到 `deepseek2` → 重启 → 用 `deepseek2` 聊天 → 删 `deepseek2` → 重启 → 回落默认 / 空默认错误；嵌入改维度有确认与警告。
13. 收口：handoff、LEARNING、`sprint-status` 对账；按 AGENTS.md 写 story 走读页 `_Agents/walkthroughs/t1-provider-model-config.html`（收口时生成）。

## Open Questions（已收口 2026-10-30）

- **OQ-T1-0 两条默认行的 id**：**已收口**：两条默认行，`id='default'` 管对话、`id='embedding'` 管嵌入；两者都是 `models` 表里 `kind='default'` 的指针行。
- **OQ-T1-1 嵌入模型 / 维度改动策略**：**已收口 A**：允许保存，但二次确认 + 明确警告“旧向量可能不可检索；不自动重嵌入”。本 story 不做批量重嵌入；自动重嵌入转后续 story。
- **OQ-T1-2 默认行不存在 / 目标不可用 / 被清理后的行为**：**已收口 A**：`/models` 返回 `default: null`；`/chat` 409 `E_NO_CHAT_MODEL`；不自动选第一个可用模型。

## Deferred

- S3 / Langfuse / DATABASE_URL 入库 → 不做（D1 A）。
- 热更新 / reload → 未排期（D4 A；后续工程项）。
- 连接测试（发一次最小请求验 Key / base_url）→ 未排期。
- 从供应商拉取模型清单（`/models` 自动发现）→ 未排期。
- 自定义 headers / query / 代理参数 → 未排期。
- per-model 参数（temperature / maxTokens / topP 等）→ 不做；仍归请求与 eval 配置。
- 自动重嵌入 / 向量迁移 → 后续 story（与 OQ-T1-1 联动）。
- Key 轮换 / 主密钥重加密 / 多主密钥 → 未排期。
- Key 末四位提示、审计日志、配置版本历史 → 未排期。
- provider 改名、model_id / kind 变更 → 不支持；删后重建。
- 登录 / admin token / RLS → P5 或更后（D9 A）。

## Build Plan

- **B0 spike**：验证 `index.ts` 在路由构造前 `await ModelRegistry.load()` 的顺序；AES-256-GCM 信封；`ChatHandle` / `EmbeddingHandle` 可空后对 agent / ingest / eval 的影响面；确认没有循环依赖。
- **B1 DB 层**：迁移（providers / models，含 `kind='default'` 行）、`adapter/repo/config.ts`（providers / models / defaults 读写）、`adapter/config/secret.ts`（加密/解密）、`scripts/config-seed.ts` + `npm run config:seed`；定向测试。
- **B2 运行时**：`AppConfig` 收窄；`provider/registry.ts` / `model/registry.ts` 改为 DB 构造；`ChatHandle` / `EmbeddingHandle` 可空；`index.ts` 启动顺序；孤儿默认清理；`cleanUpOnBoot`、`/health`、`/models`、eval 校验适配。
- **B3 API**：`routes/config.ts` 全套 CRUD + Key 设置/清除 + defaults 读写 + 校验 + 脱敏；endpoint trace 的 `/config` 不记 payload；OpenAPI；路由测试。
- **B4 前端**：`/config` 页面、侧栏入口、client 方法、`/ask` 空默认处理；Vitest 规则测试。
- **B5 收口**：全量测试、真跑、`tsc` / build、handoff、LEARNING、sprint-status、走读页。

## Verification

```bash
# 后端
cd app/server
npm run config:seed
npx tsc --noEmit
npm test

# 前端
cd ../web
npx tsc --noEmit
npm test
npm run build
```

真跑（示意，端口按实际）：

```bash
curl -s http://127.0.0.1:3000/models | jq
curl -s http://127.0.0.1:3000/config/providers | jq
curl -s http://127.0.0.1:3000/config/models | jq
curl -s http://127.0.0.1:3000/config/defaults | jq
```

DB 核对（只看是否有密文，不打印密文）：

```sql
SELECT name, kind, api_key_ciphertext IS NOT NULL AS has_key FROM providers ORDER BY name;
SELECT id, provider_id, model_id, kind FROM models WHERE kind <> 'default' ORDER BY id;
SELECT id, provider_id, model_id, kind FROM models WHERE kind = 'default' ORDER BY id;
```

Trace 脱敏：用测试发一条带 `sk-test-...` 的失败请求，断言该 trace 的 `payloads` 与日志不含该字符串；测试放在 `test/config-route.test.ts`。
