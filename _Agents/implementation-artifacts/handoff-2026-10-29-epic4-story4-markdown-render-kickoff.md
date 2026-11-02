# Handoff · 2026-10-29 · Epic 4 · Story 4.4 聊天 Markdown 渲染器（开工收口）

## 本轮做了什么

- 按 AGENTS §二 story 开工门槛，把 4.4/4.5 的 OQ 收口，详细 AC 写进 `epics.md`（628–704 行区间）。
- 范围变更：**Mermaid 从 4.4 的 Deferred 解冻**，并入 4.4（官方 mermaid、懒加载、securityLevel strict、失败回退代码块）。
- `deferred-work.md`：新增「Story 4.4 / 4.5 OQ 收口 (2026-10-29)」批次；去向索引同步（未排期项、已解冻/已并入项）。
- `sprint-status.yaml`：`4-4-聊天-markdown-渲染` → `ready-for-dev`（附收口摘要）；4.5 仍 backlog，但 OQ 已预收口。

## 关键决策 / 未决（OQ → 结论 / 去向）

**Story 4.4**
- `OQ-4.4-1` citation 节点穿透 → **已拍板**：remark 插件把 `[n]` / `[8 位 id]` 变成 `[n](citation:n)` 链接，`components.a` 识别 `citation:` 协议渲染成现有按钮；`urlTransform` 放行该协议（react-markdown 默认只放行 http(s)/irc(s)/mailto/xmpp，已扒包确认）。尖刺不通过则退回"按段落切分、标号单独替换"。
- `OQ-4.4-2` 单换行 → **已拍板**：保留（`remark-breaks`），与 as-built 逐行观感一致。
- `OQ-4.4-3` 图片 / 脚注 / 任务列表 → **已拍板**：任务列表随 GFM 进首期；脚注转 deferred；图片只留 alt / 链接、不加载。
- `OQ-4.4-4` 流式半截 → **已拍板（Build 1 实测）**：整段每帧 Markdown，0.44ms/次（349 字符）；半截表格直接成表、半截围栏直接成 code，不露 ```；"已完成块 + 末块纯文本"弃用（会把反引号漏到屏幕上）。

**Story 4.5（依赖 4.4，尚未开工）**
- `OQ-4.5-1` → **已拍板**：首期只做 CSV。
- `OQ-4.5-2` → **已拍板（Lynx 2026-10-29）**：要做「整条回答导出 .md」，导出的就是全文 Markdown。
- `OQ-4.5-3` → **已拍板**：文件名取第一列表头，去 `/\:*?"<>|` 与控制字符、空白压 `-`、截 40；空或全非法 → `table`。

**Deferred 去向**
- 语法高亮 / 数学公式 / 脚注 / Excel 与其他格式导出 → 未排期（已登记批次与索引）。
- JSON part / Generative UI → P4；服务端 CSV artifact → 4.5 Deferred 保留。
- ~~Mermaid~~、~~回答级 Markdown 下载~~ → 已解冻/已并入（索引"已解决 / 作废"）。

**库选型（实测）**
- 渲染器：**react-markdown 10.1 + remark-gfm 4.0.1 + remark-breaks 4.0.0**（约 50KB gz，React external、minify）。
- Mermaid：**官方 mermaid 12.2.0**（core 13.5KB gz + 图种 chunk：sequence 39KB / swimlanes 59KB / c4 24KB；全语法；DOM + DOMPurify）。

## Build 顺序

1. **Spike（Build 1）**：① citation 穿透（jsdom 即可验证机制）；② 流式半截两案（真流 + 真浏览器）；③ mermaid 恶意 label + 失败回退（真浏览器）。结论回写 epics 4.4 的 OQ-4.4-4。
2. Build 2：Markdown 渲染接入（引用、代码块、链接安全、单换行、`citedHits` 改 Markdown 感知）。
3. Build 3：表格渲染 + CSV 下载（4.5）。
4. Build 4：Mermaid 围栏 + 失败回退。
5. 收尾：story 走读页、`LEARNING.md`、needs 勾选、summary。

## 风险 / 注意

- **体积**：官方 mermaid 首图约 100–150KB gz（懒加载）；react-markdown 使 `/ask` chunk +50KB gz。
- **安全**：不解析 raw HTML；mermaid `securityLevel: 'strict'`、不加载远程资源；spike 里用恶意 label 验证。
- **引用解析重构**：`citedHits` 现在跑在 `plain()` 上，改装后必须跳过代码节点，且 `/ask` 右栏与气泡共用同一纯函数。
- **流式半截**：表格按钮的"流结束 + 表格闭合"判据与 4.5 共用；编号在流式期间不能抖。
- **测试口径**：现有 `plain()` 的用例会被替换（规则变了，不是改测试适配实现）；新增用例钉"代码里的标号不算引用"。

## Build 1 尖刺结果（2026-10-29）

- **引用穿透（jsdom，`src/components/chat-thread/markdown-citation.test.tsx` 4 条全绿）**：`[n]` / `[8 位 id]` 改成 `[n](citation:n)` 链接 + `components.a` 识别 + `urlTransform` 放行 `citation:` —— 机制成立。代码块 / 行内码天然排除（只遍历 text 节点）；已有链接不嵌套；raw HTML 不解析；图片不加载；GFM 表格与 remark-breaks 正常。
- **流式两案（真浏览器探针，/tmp/mdprobe）**：A 整段每帧 vs B 已完成块 + 末块纯文本。截在表格中间：A 已渲染成表（行不全），B 把整块表格降级成纯文本漏出 `|`；截在围栏中间：A 渲染成 code，B 把 ```ts 漏在屏幕上。性能：A 0.44ms/次（60 次平均，349 字符）。**结论：A**。
- **Mermaid（真浏览器探针）**：`securityLevel: 'strict'` 单独不够 —— label 里的 `<img src="https://evil.example/x.png">` 被保留并真的发起请求；`%%{init: {"htmlLabels": true}}%%` 与 frontmatter `config.htmlLabels: true` 都能绕过初始化配置（两次实测均命中请求）。`htmlLabels: false` 下无 `<img>` / `<foreignObject>`、无请求、约 30ms。坏图抛可捕获的 parse error。**结论：strict + htmlLabels:false + 覆盖指令/frontmatter 拒绝 + 产物黑名单回退。**
- 已装依赖：`react-markdown@^10.1.0`、`remark-gfm@^4.0.1`、`remark-breaks@^4.0.0`、`mermaid@^12.2.0`。
- 探针页为一次性工件（/tmp/mdprobe），不进仓库；结论已回写 epics。

## 范围补充（2026-10-29，Lynx 拍）

- **` ```csv ` 围栏也渲染成表**（4.5 扩展）：首行表头 + 「下载 CSV」；解析规则住 `lib/csv.ts`（RFC 4180：引号里的逗号/换行、`""` 转义、BOM/CRLF），解析不了退回代码块；列数不齐原样显示，不补空不截断；>300 行或只有一列不当表看。AC 已补进 epics 4.5。
- 表格宽度口径：`w-max + min-w-full`（按内容撑开、超出横向滚，避免 9 列把「产品经理」压成一字一行）+ 单元格 `max-w-sm`（超长备注在格内换行）。
- 流式闪动修复：`components` 必须模块级 + context（内联函数每帧都是新组件类型 → 引用按钮/光标被反复卸载重挂）。
- mermaid 失败回退修复：初始化加 `suppressErrorRendering: true`，并在 catch 里清 `#<id>` / `#d<id>` / `#i<id>`（否则解析失败的「Syntax error」炸弹图会留在 body 上）。
- **Mermaid 「导出 JPEG」**（2026-10-29 Lynx 要）：`lib/mermaid-export.ts`（viewBox 取尺寸、2x 栅格、单边封顶 4096、先铺 `--color-canvas` 再画、`toBlob('image/jpeg', 0.92)`）+ `downloadBlob`；文件名取会话标题。实机验过浅/深两档（1625×2162、FFD8FFE0、白底/黑底）。

## 收口（2026-10-29）

- **状态**：4.4 / 4.5 均 `done`；epic-4 `in-progress`（4.1–4.3 仍暂缓）。sprint-status 已更新。
- **交付**：react-markdown + remark-gfm/breaks 渲染、citation: 链接式引用（代码排除）、整段每帧流式 + 光标吸附、官方 mermaid（三道闸 + 炸弹清理 + JPEG 导出）、GFM 表格 + ```csv 围栏成表、CSV 下载（BOM/RFC 4180/注入防护）、整条回答导出 .md。
- **过程中修的两个真 bug**：① 流式闪动（components 内联 → 每帧新组件类型 → 按钮/光标反复重挂）；② mermaid 解析失败把「Syntax error」炸弹图留在 body（suppressErrorRendering + 按 id 清理）。
- **验证**：`npx tsc --noEmit` 0 错；`npm test` 85 文件 / 723 条全绿；`npm run build` 通过（chat-thread 58.5KB gz，mermaid 懒加载 168.5KB gz）；真浏览器验过流式两案、mermaid 恶意输入/坏图、CSV 与 .md 真下载、JPEG 浅深两档。
- **走读页**：`_Agents/walkthroughs/epic4-story4-chat-markdown.html`（5 code / 18 notes / 5 journey）与 `epic4-story5-table-csv.html`（5 / 13 / 5），`index.html` 已加 Epic 4 入口；两份 `.runs/epic4-story{4,5}/` 里留有 config、memlog、validation。
- **转出 deferred**：Mermaid PNG/SVG 与缩放交互、超 300 行 CSV 表格化（未排期）；mermaid 源里的 `\"` 不做自动修复（不做）。
- **下一步**：Epic 4 剩 4.1–4.3（资源画像，仍暂缓）；或按 sprint 继续 Epic 7 · 7.2。
