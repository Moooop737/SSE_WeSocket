---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-12
story: 1.2（添加网页 URL 入库）
build: 2
status: in-progress
persona: Amelia (Senior Software Engineer)
---

# Handoff — Epic1 / Story1.2 / Build2：health 探针化 + 路由拆分 + 代码风格合规

## 〇 · 一句话状态

本 build **几乎全在打地基与整改风格**：`/health` 重做成注册式服务探针（含 Ollama 三个只读 API）、路由按「读/text/url」拆分、`bootstrap` 拆分并交出 `{app,deps}`、并按新版 AGENTS §四把 A 组代码全量合规化。**但 story 1.2 的主线——URL 入库端到端——仍没开工**：`resources-url.ts` 不存在、`buildDeps` 没注入 fetch、幂等没落码。大量改动**未提交**，且 `app/` 被 gitignore、后端源码**完全不在 git**。

## 一 · 工程在哪

- 后端：`app/server/`（Hono + Node + TS，`tsx --env-file=.env src/index.ts`）。
- 本轮新增/改动文件：
  - `src/pipeline/bootstrap.ts`（从 index 拆出；`bootstrap()` 建 deps+空 app 返回 `{app,deps}`，`startServer()` 清扫+监听）
  - `src/routes/health.ts`（注册式探针 `createHealthRoute(Probes, CacheTtlMs=5000)`，`ProbeResult{ok,detail?}`，整份响应 5s 缓存）
  - `src/routes/resources.ts`（只读：`GET /`、`GET /:id/chunks`，相对路径）
  - `src/routes/resources-text.ts`（`POST /text` 文本入库）
  - `src/adapters/ollama.ts`（`ollamaHealthCheck`/`ollamaModelList`/`ollamaStatusList` + `Model/ModelStatus/ModelDetails` 类型，字段按官方 snake_case）
  - `src/index.ts`、`src/config.ts`、`orchestration/ingest.ts`、`adapters/paradedb.ts` 等（风格合规化）
- 命名方案定：读=`resources.ts`、文本写=`resources-text.ts`、URL写=`resources-url.ts`(待建)、探针=`health.ts`；routes/ 文件夹内**不加** `.route.ts` 后缀。

## 二 · 本轮完成（均 tsc/冒烟实测）

| 项 | 结果 | 复验 |
|---|---|---|
| `/health` 探针化 | 注册式，逐个 try/catch（单服务抛错=ok:false 不炸整体），5s 缓存 | 计数冒烟：ttl内3请求只探测1次；过期重探 |
| Ollama 三 API | 真连本地 Ollama(`http://100.103.104.50:11434`)：tags 返回4模型、ps 空 | curl + tsx 实测 |
| embedding 就绪判定 | `ollama_models.ok` = 已下载模型含 `qwenembed` | 实测 200；见下方 tag 坑 |
| 路由拆分 | resources 读 / resources-text 写 / health，工厂+`app.route` | GET /resources、POST /resources/text 冒烟 |
| A 组代码风格 | 13 文件 + index 全按 §四：export 置顶、type 就近主函数、参数 PascalCase、头部 `/**/` 使用说明替函数注释、留英文歧义注 | 每步 `tsc --noEmit` EXIT=0 |
| AGENTS.md | §四 代码风格节成文；§〇4/6 口径、§三 provider（Ollama/deepseek 非 OpenAI）修正；§二「看进展先读 sprint+handoff」 | — |

## 三 · 关键决策 / 坑（务必照此续做）

1. **AGENTS §四 是硬标准**：新写的每个 `.ts` 都要 export 显式置顶（函数普通声明、`export class/interface/const` 保持内联）、interface/type 本体**就近放其主函数前**（前向引用合法）、**参数 PascalCase**、文件头 `/**/` 使用说明后**函数上不再注释**（仅歧义注、英文词）。B/C/D 类见 §五 有意豁免。
2. **Ollama 模型名带 tag**：`name` 是 `qwenembed:latest`，`EMBEDDING_MODEL=qwenembed`（裸名）→ 匹配要 `m.name === emb || m.name.startsWith(\`${emb}:\`)`，否则误判未就绪。
3. **Write 工具会把源码里的 `\uXXXX` 渲染成真实零宽字符**（html-parser 正则踩过两次）；要写转义字面量改用 shell（perl 按字节替换）。已存记忆 `write-tool-collapses-unicode-escapes`。
4. **`buildDeps` 里的 `fetch: App.fetch` 是 serve 入参，不是 ingest 的 fetch stage** —— 别误以为已接线，`IngestDeps.fetch` 至今没注入。
5. `tsconfig` 已设 `noEmit:true`，旧「裸跑 tsc 吐 .js/.d.ts」坑已闭；继续用 `tsc --noEmit` 验证。

## 四 · 未提交 / git 大坑

- `git status`：AGENTS.md(M)、.gitignore(M)、旧 story1.1 handoff(D)、build1 handoff(??)。
- **`app/` 被 `.gitignore` 第4行 `app/` 整个忽略 → 后端所有源码不在版本控制**。续做前务必先定：`app/` 是否有意忽略？若要提交代码，得改 .gitignore（这是lynx的决策，agent 别擅改）。

## 五 · 已定但未落码 / 待办

**story 1.2 主线（下一步真活）**：
1. 建 `routes/resources-url.ts`（`POST /url`：路由层校验 url 非空+http(s)→400；建 processing Resource→fetch→parse→失败转 failed）。
2. `buildDeps` 注入 `fetch: new HttpFetcher()`、`parseHtml: new HtmlParser()`（现 `IngestDeps.parse` 只有 TextParser）。
3. `runIngest` url 分支按 **①先建后抓**（已定）：进 url 先建 `processing` Resource，再 fetch/parse，失败走 `fail()`。
4. 幂等 **②拒绝**（已定）：`repo.findActiveBySource(url)` 查存在→4xx；repo 加此方法。

**还没最终拍板的 3 个结构点（上次进风格整改前没答）**：
- url 先建后抓时 `title` 何时定？（建 processing 还没 parse 结果 → 用主机名占位、parse 后回填？）
- 幂等「已存在」算不算 `failed` 状态的同 URL（要不要允许重抓）？
- `IngestDeps` 是否改名对称 `parseText`/`parseHtml`（牵 bootstrap/ingest 引用）？

**当前已知坏状态（lynx 在改 index，别忽略）**：
- `index.ts` 把 `createResourcesRoute` 挂在 `app.route('/', …)`，但 resources.ts 已是相对路径 → 资源列表现在挂在 `/` 而非 `/resources`；应挂 `app.route('/resources', …)`。
- `resources-text.ts` 存在却没在 index 挂载 → 文本入库端点当前**从 HTTP 进不去**。

**风格豁免组（本轮有意没动）**：B=`ports/*`+`contracts.ts`+`types.ts`（纯声明，只欠注释）；C=`chunk/legacy*`（WeKnora 移植算法，注释是学习资产）；D=测试 + `.d.ts`。

## 六 · 下一步（建议，未放行）

最小一刀 = **URL 入库接线**：先回答 §五 那 3 个结构点 → 落 `resources-url.ts` + 注入 fetch/parseHtml + runIngest 先建后抓 + 幂等拒绝 + 顺手把 index 的路由挂载修对。给「进行」再动码，一次一步、Lynx 带节奏。

## 七 · 协作规则

Lynx 拍板、agent 出蓝图；只有明确放行才写码且最小一步；开发节奏由 Lynx 主导、不跨 story 自主进行。验证：`tsc --noEmit` 挡类型错 + 真请求/冒烟看行为（偏好真实网络、能看中间值）。沟通：先结论、分点、少黑话、中文。
