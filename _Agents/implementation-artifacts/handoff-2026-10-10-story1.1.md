---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-10
story: 1.1（本地骨架 + 基础设施 + 安全边界）
status: review
persona: Amelia (Senior Software Engineer)
---

# Handoff — Story 1.1 完成交接

## 〇 · 一句话状态

Story 1.1 全部 AC 已实测通过、置 `review`；前后端骨架可跑；期间把架构不变量 **AD-4 从"锁死 1024 维"重述为"存储不设维度上限 + 按 `dimension` 分建 partial HNSW + 查询期一致性"**。下一步三选一：LEARNING.md / code review / Story 1.2。

## 一 · 工程在哪（路径）

- 后端：`app/server/`（Hono + Node + TS，`tsx` 热重载）
- 前端：`app/web/`（Vite + React + TS，dev 端口 5173，`/api` 代理到 3000）
- 迁移：`app/server/db/migrations/`（dbmate，4 个已应用）
- 规划/契约：`_Agents/planning-artifacts/`（epics.md / ARCHITECTURE-SPINE.md / prd）
- sprint 状态：`_Agents/implementation-artifacts/sprint-status.yaml`
- WeKnora 参照（离线文档 + 真源码）：`../weknora/`（md 文档）、`../WeKnora-main/`（Go 源码 + migrations）

## 二 · Story 1.1 AC 验收（均实测，非推断）

| AC | 结果 | 怎么复验 |
|---|---|---|
| 后端绑 127.0.0.1、/health 200 | ✅ | `npm run dev` → `curl 127.0.0.1:3000/health` |
| 迁移建 5 表 resources/chunks/embeddings/sessions/messages | ✅ | `psql \dt` |
| ports 四接口能编译（Repository/Retriever/Embedder/ChatModel） | ✅ | `npx tsc --noEmit` |
| ParadeDB 连接 + Ollama 对字符串返回 1024 维 | ✅ | /health db:true；`/v1/embeddings` + `dimensions:1024` |
| 缺对话 Key → 启动 fail-fast 点名 | ✅ | `.env` 留空 DEEPSEEK_API_KEY 起服务 → `{code:E_CONFIG_MISSING}` |
| DB/Ollama 不可达 → degraded | ✅ | OLLAMA_BASE_URL 指坏端口 → `{status:degraded}` HTTP 503 |
| Key 仅服务端 env | ✅ | 全在 `app/server/.env`，`.gitignore` 已忽略 |
| 启动清扫 processing→failed + 清孤儿向量 | ✅ | 灌 processing 资源+chunk+向量，起服务后转 failed、CASCADE 清向量 |

## 三 · 基础设施事实（远程，走 Tailscale；**密码不在本文，在 .env**）

- **ParadeDB**：`100.111.110.60:5432`，库 `ragdb`，用户 `admin`。镜像 PG 17.9，已装 `vector 0.8.1` + `pg_search 0.22.6`。连接需 `?sslmode=disable`（服务端未开 SSL）。
- **Ollama**：`100.103.104.50:11434`（v0.40.0）。模型 `qwenembed` = 官方 Qwen3-Embedding-8B 的 Q4_K_M 量化版，native 4096、**支持 MRL**：经 `/v1/embeddings` 传 `dimensions:1024` 实测返回 1024 且语义排序不退化。
- 本机工具：Node 26 / npm / brew / dbmate 2.36 / psql（`/opt/homebrew/opt/libpq/bin/psql`，keg-only 不在 PATH）。

## 四 · 关键决策（都拍过板）

1. **不用 ORM**：`pg` 原生 + 参数化查询（`$1`，防注入等价 ORM）；ParadeDB 定制 SQL 需要。
2. **迁移用 dbmate**：纯 SQL、外部 CLI。
3. **基础设施走远程**（偏离架构"本地 Docker"，已实测可达；Hono 自身仍绑 127.0.0.1）。
4. **中文 BM25 分词 = `chinese_lindera`**：与 WeKnora 源码逐字一致；`type:"lindera"` 在本镜像不存在。
5. **AD-4 重述**（本次核心变更）：见下节。
6. **列名 `dim → dimension`**：对齐 WeKnora。

## 五 · AD-4 现状（务必按此实现下游）

- **存储**：`embeddings.embedding` = **不定长 `halfvec`**，任意维度都能入库，无上限。
- **索引**：只为要加速的维度**各建一条 partial HNSW** `USING hnsw ((embedding::halfvec(N)) halfvec_cosine_ops) WITH (m=16, ef_construction=64) WHERE dimension = N`，每条 `N ≤ 4000`。**P1 只有一条 1024 索引**。加维度=加索引迁移，不动表。
- **查询期一致性**：查询向量模型/`dimension` 必须 = 被检索行，不符报错、不回退 BM25-only 静默作答。无对应索引的维度 → 退化 seq scan（结果仍对、只是慢，不算错）。
- **config.ts 已去掉启动期 `!=1024` 校验**；`EMBEDDING_DIMENSIONS` 仅表示"向 embedder 请求的输出维度"，默认 1024。

## 六 · 下游坑（新会话易踩）

- **查询必须用同表达式** `embedding::halfvec(1024) <=> $1::halfvec(1024)` 才命中 partial 索引；写 `embedding <=> $1` 会绕过索引变 seq scan。
- **入库适配器必须如实写 `dimension`**（当前 1024），否则该行不进索引。
- 已建表**空**（测试数据已清理）；`ragdb` public schema 仅 postgis 的 `spatial_ref_sys`，无冲突。
- `npm run dev` 走 `tsx watch --env-file=.env`；跑之前需在 `.env` 填真实 `DEEPSEEK_API_KEY`（或临时 `DEEPSEEK_API_KEY=x npm run dev`），否则 fail-fast（正确行为）。

## 七 · 下一步（未放行）

1. **LEARNING.md**（AGENTS.md 每阶段循环第 5 步）——尚未创建。
2. **code review**：Story 1.1 已在 `review`，可起 `bmad-code-review`（建议新上下文）。
3. **Story 1.2**（URL 抓取入库）：第一个走完整入库管线 + Embedder/Repository 适配器的故事；先蓝图后实现。

## 八 · 协作规则（别忘）

Lynx 拍板、agent 出蓝图；**只有 Lynx 明确放行才写代码**。本轮多数构建经逐轮放行由 agent 代劳，但每个新片段仍应先给蓝图再动手。沟通：先结论、分点、少黑话、中文。
