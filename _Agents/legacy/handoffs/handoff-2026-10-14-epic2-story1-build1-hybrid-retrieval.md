---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-14
story: 2.1（混合检索问答-基础）
build: 1
status: done
persona: Amelia (Senior Software Engineer)
---

# Handoff — Epic2 / Story2.1 / Build1：工厂化混合检索 + `/retrieve` + `/chat` 骨架

## 〇 · 一句话状态

Story 2.1 收口（Lynx 亲判「收口吧」→ 四层 code review → 6 条 decision 全拍、9 条 patch 全修）。交付的是**检索这一半**：向量 topK + BM25(`match_disjunction`, score>0) + RRF 名次融合，工厂化组装（与 pipeline 同构），`POST /retrieve` 已被前端 `/ask` 当真接口用，`POST /chat` 立起三条确定性提示。生成侧与 sessions/messages 落库按 Lynx 决定**划给 2.2**。`ai@7` + `@ai-sdk/openai-compatible@3` 已装、实测可加载，但 src 里零使用。工作区仍未提交。

## 一 · 工程在哪

- 后端 `app/server/`（`npx tsx --env-file=.env src/index.ts`；测试 `npx vitest run`；类型 `npx tsc --noEmit`）
- 新增层：`src/retrieve/`（contracts / recipes / retrievers / search/paradedb-vector / search/paradedb-bm25 / fusion/rrf）、`src/agent/chat/chat.ts`、`src/routes/retrieve/retrieve.ts`、`src/routes/chat/chat.ts`
- 端口改动：`src/ports/retriever.ts` **已删除**，契约（`Retriever` / `RetrievalResult` / `RetrievedChunk`）搬进 `src/retrieve/contracts.ts`；`Repository` 新增 `countResourcesByStatus()`
- 一次性探针在 `app/server/test/probe-*.ts`（`test/` 被内层 `.gitignore` 忽略 ⇒ 不进版本控制）：`probe-retriever.ts`（三态闸门 + 混维 + 各问句条数）、`probe-bm25-strategies.ts`（四种词法查询策略对比，D-P8 的证据源）、`probe-bm25.ts`、`probe-count-resources.ts`、`probe-embed-fail.ts`、`probe-empty-token.ts`、`probe-sdk.ts`、`probe-state.ts`、`probe-when.ts`

## 二 · 本轮实测（真库 + 真 Ollama，全部真跑）

| 场景 | 实况 |
|---|---|
| 混合检索 | `Qoder 怎么安装` → `v=10 l=10`，双路 rank1 的命中 `rrf=0.03279 = 1/61+1/61`，`sim=0.6317` |
| 词法漏检修复 | `设置入口：右上角`：裸串 `@@@` **0 命中**（正文里就有这句），换 `match_disjunction` 后 top=`13.80`、命中正确那条 |
| 语法字符不再 500 | `it's a test` / `a:b` / `AND`：改前抛 `could not parse query string`，改后分别 `v=6/1/10`、`l=10/10/2` |
| 维度不符 | `EMBEDDING_DIMENSIONS=512` 起服务 + 真库 1024 ⇒ **HTTP 409** `E_DIMENSION_MISMATCH 库中存在 1024 维向量，与当前检索维度 512 不符，拒绝作答` |
| 体检未跑成（三态） | 注入 `vectorDimensions: null` ⇒ 抛 `E_DIMENSION_UNKNOWN`，不退回 BM25-only 静默作答 |
| 空库 | 并行会话把 5 条资源全软删期间实测：`POST /chat` → **200** `{"answer":"尚未添加任何资源","hits":[],"vectorCount":0,"lexicalCount":0}`；启动日志 `库中向量维度=空` |
| 空提问 / 非法 body | 400 `E_EMPTY_QUERY`（发 Ollama 之前就拦）、400 `E_BAD_BODY` |
| 索引可用性 | 27 行时按成本走 Seq Scan；`SET enable_seqscan=off` 后 `Index Scan using embeddings_hnsw`，`Order By ((embedding)::halfvec(1024) <=> …)` ⇒ 表达式形式与 partial 索引同形 |
| SDK 可加载性 | `node -e require('ai')` OK（Node 26 支持 `require(esm)`，尽管 `ai@7` 是 ESM-only 且 exports 无 require 条件）；`npx tsx` 下 `generateText/streamText/embedMany/tool/stepCountIs/jsonSchema` 全 function；`createOpenAICompatible` 造的 model 带 `specificationVersion/modelId/config/…` |
| 回归 | `tsc --noEmit` EXIT=0；`vitest run` **8 passed**；改名 `retrive→retrieve` 后两条端点重新真跑通过 |

## 三 · 关键决策 / 坑（务必照此续做）

1. **pg 的 `<=>` 是余弦距离**，相似度 = 1 − 距离；阈值一律在 TS 侧换算与过滤，写进 SQL 的 `WHERE` 会挡掉 HNSW 的 top-k 通道。
2. **`::halfvec(N)` 的 N 只能是 SQL 字面量**（类型修饰符），所以维度数字必须拼进文本 ⇒ 先 `Number.isInteger` 校验再拼，这是唯一的注入防线。
3. **用户问句不能裸交给 `@@@`** —— 那是交给查询语法解析器：实测 8 条里 3 条抛错、4 条静默 0 命中。正解 `paradedb.match_disjunction('content', q)`（同一分词器、token 取 OR）。扩展 helper 从 `pg_proc` 列（217 个），别查博客。
4. **绝对阈值随语料漂移，且分数判不了「库里有没有答案」**：`WeKnora 怎么部署`（库里已无此主题）拿 0.5502，高于含糊问句 `是什么` 0.5023；垃圾串换语料后从 0.4061 涨到 0.4589 顶穿 0.42。⇒ **「未找到」的判据交给模型**（Lynx 定），阈值只兜字符噪声。
5. **维度校验分两处，别把装配期那条当数据校验用**：`embedder.dimensions !== config.dimension` 两边同出一个 config，是恒等式（今天不可能触发），只守注册表被塞进第二个 embedder 这类装配错误。真混维只在库里。
6. **`vectorDimensions` 是三态且必须晚绑定**：数组 / 空数组 / `null`（体检未跑成 ⇒ 拒绝作答）。它由 `startServer` 在 `serve()` 前填，所以路由 deps 传的是 `getVectorDimensions: () => deps.vectorDimensions` —— 解构快照会让门禁永久静默失效。
7. **检索注册表的签名与 pipeline 不同**：`(Deps: {pool, config}) => Stage`，因为两路真要读库。硬抄 pipeline 的 `(Config) => Stage` 就得把 pool 塞进 config，污染「config = env 旋钮」的语义。
8. **`orchestration` 这个层名已废除**（Lynx 2026-10-14）：SPINE 改用 as-built 的 `agent/` + `retrieve/`。AD-1 的 mermaid 现在是 `routes → agent → retrieve → ports`。
9. **状态码口径已定**：空提问/坏 body 400、维度类 409、0 命中 200（是答案不是错误）、空库与全无 ready 也是 200 答案体 —— 因为 2.2 的 `useChat` 会把非 2xx 走成错误通道，没法渲染成对话气泡。
10. **`minSimilarity` 交付 0.42**（Lynx 拍），不是 `deferred-work` 早期写的 ≈0.35（那只是我的建议值）；两处真相已在 P8 抹平。五个旋钮现在都在 `config.ts`（小数走新增的 `floatOrThrow`，`numOrThrow` 只收整数）。

## 四 · 未提交 / git

`app/server` 是**嵌套 git**（外层仓库 `.gitignore` 忽略 `app/`），且内层忽略 `test/` ⇒ 本轮所有探针与断言都不在版本控制里。`git status`：`M bootstrap.ts / config.ts / index.ts / ports/repository.ts / adapters/paradedb-repository.ts`、`D ports/retriever.ts`、未跟踪 `src/agent/ src/retrieve/ src/routes/chat/ src/routes/retrieve/`、`package.json`+`package-lock.json`（新增两个运行时依赖）。
**并行会话注意**：本轮期间库被软删过 5 条又被重新入库 5 条（`resources` 现存 10 行，5 ready + 5 软删壳；`chunks/embeddings` 各 43）。软删壳会让「空库」判定看起来正常但列表里没东西，别误判成 bug。

## 五 · 还差什么

**Story 2.1（已 done，剩余项已划走/记账）**
- 生成侧（`streamText` + `createUIMessageStreamResponse`）与 sessions/messages 落库 → 2.2
- 「两路皆空 ⇒ 未找到」在 OR 语义下打不到 → 判据交模型，见 `deferred-work.md`
- ReAct（模型以工具方式调 `retrieve`）= 拒答/反问的正解 → **留 P3**，已在 `deferred-work.md` 立条

**Story 2.2 开工前要先定的**
- **`messages` 表形状**：以 SDK 的 `UIMessage` 为地基 ⇒ `role/content text/sources jsonb` 要改成存 `parts[]`（一次迁移）。Lynx 已倾向改，未拍。
- **拒绝信号那格已消解**：模型自然说话或反问，后端不比字符串、不加标记。
- `ChatModel` 端口（`src/ports/chat-model.ts` 空壳）换成 AI SDK 形状；`config.ts` 若要逐轮切模型，得把单一 `CHAT_PROVIDER` 改成 provider 表。
- `frontend-deferred.md` 四条（删除/取消按钮 + 列表轮询）按 Epic 1 决定在 2.2 动界面时一并接。
- `sessions.user_id` 之外没有 owner 列，未来鉴权走 PG RLS ⇒ **业务 SQL 不写 owner 谓词**（已写进 SPINE Deferred，含 `SET LOCAL` 与连接池那条硬前提）。

## 六 · 下一步（未放行）

2.2 流式：`streamText` + `createUIMessageStreamResponse` + 前端 `useChat`，顺带定 `messages` 表迁移。learning 侧这轮把 RAG 编排与混合检索练到了，**AI SDK 本身仍是零行使用**（依赖已装、加载已实测通），2.2 是主线真正开始的地方。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图与实测；只有「进行/落码/你来改吧」才动文件。本轮他把 code review 的 6 条 decision 一次性给完（D1 只记账 / D2 三态闸门 / D3 改拼写并废 `orchestration` / D4 前端不用管 / D5 改 AC / D6 等 UIMessage 消解），patch 选「全修」。测试不由 agent 主动伸手（D14 未拍）；前端验证归 Lynx 浏览器手测。沟通：先结论、分点、少黑话、中文。
