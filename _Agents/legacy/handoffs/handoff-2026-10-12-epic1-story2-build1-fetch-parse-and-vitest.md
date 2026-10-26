---
type: session-handoff
project: Knowledge Copilot
date: 2026-10-12
story: 1.2（添加网页 URL 入库）
build: 1
status: in-progress
persona: Amelia (Senior Software Engineer)
---

# Handoff — Epic1 / Story1.2 / Build1：fetch+parse 段 + Vitest 测试栈

## 〇 · 一句话状态

Story 1.2 的 **fetch 段与 parse 段已实现并实测通过**（真实网络抓 WeKnora 文档页，抽出干净 Markdown：含 GFM 表格、fenced 代码、无锚点噪音）；测试栈切到 **Vitest（新）+ UI**，legacy 留 node:test；**路由接线/幂等/fetch 失败语义等仍缺**（见 §六）。大量改动**未提交**。

## 一 · 工程在哪

- 后端：`app/server/`（Hono + Node + TS，tsx 热重载）
- 新增/改动核心：
  - `src/pipeline/fetch/http-fetcher.ts`（HttpFetcher）
  - `src/pipeline/parse/html-parser.ts`（HtmlParser）
  - `src/types/turndown-plugin-gfm.d.ts`（手写模块声明）
  - `vitest.config.ts`、`test/http-html-parser.test.ts`
- 测试配置：`vitest.config.ts` include `src/**`+`test/**`、exclude `legacy.test.ts`；编辑器 settings 已加 `vitest.workingDirectories: ["app/server"]`
- sprint：`_Agents/implementation-artifacts/sprint-status.yaml`（1-2 仍 backlog，**待置 in-progress + 建 story 文件**）

## 二 · 本轮完成（均实测）

| 项 | 结果 | 复验 |
|---|---|---|
| HttpFetcher | 内置 fetch + AbortSignal + http/https 守卫 | `test/http-html-parser.test.ts` fetch 用例 |
| HtmlParser | readability+jsdom+turndown；标题优先 `<title>`；去页内空锚点；fenced 代码；GFM 表格 | 同文件 parse 用例；真实 URL 实测 200/8.4k 字 |
| 测试栈 | Vitest run/watch/--ui；legacy 留 node:test | `npx vitest run`、`npx vitest --ui` |
| 中间值可见 | `peek(label,value,n)` 截断 log → UI Console 标签 | 测试文件内 |

## 三 · 关键决策 / 坑（务必照此续做）

1. **fetch 用 Node 内置 fetch**，不引一体式抓取库（article-parser/@postlight 已弃坑；scrapy/trafilatura 是 Python 不对栈）。
2. **parse 栈 = readability + jsdom + turndown(+gfm)**，输出 **Markdown**。
3. **锚点清理要在 Readability 之前从 DOM 删**（`stripPageAnchors`）；用 `td.remove()` 压不过 turndown 的 link 规则，无效。
4. **`gfm` 本身是插件函数，`td.use(gfm)` 不加括号**；`gfm()` 会把 undefined 当 service 崩。
5. **readability 会就地改 doc** → 兜底 `<title>` 要在 `parse()` 前取；且 readability **几乎不返回 null**（超短内容也返回），测「内容为空」要用空 raw。
6. **turndown 默认 indented 代码块**，要 ``` 围栏必须 `codeBlockStyle:'fenced'`；表格必须 `turndown-plugin-gfm`（核心无表格规则）。
7. **tsconfig 无 outDir + 开了 declaration/sourceMap** → 手滑跑 `tsc` 会原地吐 `.js/.d.ts/.map`（本轮已清理一次）。**建议加 `noEmit:true` 防再犯（未加）**。
8. Vitest UI 需**带 token 的 URL**（终端打印那条），裸 localhost 会被拦。

## 四 · 未提交清单（git status）

`src/adapters/*`、`src/orchestration/ingest.ts`、`src/pipeline/{contracts,chunk,fetch,parse}`、`src/routes/resources.ts`、`src/types/`、`vitest.config.ts`、`test/`、package.json(+vitest/gfm 依赖)。**提交前注意别带上编译产物**。

## 五 · 未决决策（续做前先拍板）

- **幂等策略**：同 URL 已存在 → 拒绝 or 更新（AC 二选一）。
- **fetch 失败语义**：现 `runIngest` 先 fetch 后 createResource，网络失败不产生「失败 Resource」，违背 AC；需提前建或捕获补建。
- **index 重构**：蓝图已给（index 只注册；`buildDeps` 装配；`withDeps` 中间件注入；子路由 `app.route`）**未落码**。

## 六 · 剩余范围（Story 1.2 缺口）

URL 入库路由接线 → 路由层 URL 校验 → 幂等 → fetch 失败语义 → 「可能抓不全」warning → 取消信号接线 → embed/写集成测试 → 前端 URL 提交 UI → sprint/story 流程件。详见 memory `story-1-2-remaining-scope`。

## 七 · 下一步（未放行）

建议最小切片 = **URL 入库路由 + 路由层校验**（把已有各段串起来跑通一次真入库）。等 Lynx「进行」。

## 八 · 协作规则

Lynx 拍板、agent 出蓝图；**只有明确放行才写代码，且只写最小一步**。测试习惯见 项目`agent.md`（Vitest 可点击树 + 要看中间值 + 真实网络集成）。沟通：先结论、分点、少黑话、中文。
