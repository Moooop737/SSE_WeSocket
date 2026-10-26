# AGENTS.md — Knowledge Copilot

> 本文件是这个仓库的 AI agent 工作基调。任何 agent 在此项目工作时，先读这份文件，再动手。
> 用户使用的语言是中文（简体）。

## 〇 · 项目基调（最高优先，压过一切"炫技/堆功能"的冲动）

1. **这是一个「以学习为第一目标」的项目。** 主线是把 **Vercel AI SDK** 吃透（顺带深化 RAG），副产品才是一个能跑、能写进简历、可分阶段长大的作品集项目 Knowledge Copilot。
2. **学习优先于交付。** 宁可链路短、功能少，也要每一步"真懂"。评判进展的标准不是"加了多少功能"，而是"这一阶段要练的 AI SDK 能力，跑通了且讲得清为什么这么做"。
3. **循序渐进，一次一个阶段。** 能力按 P1→P5 阶梯叠加（见 PRD §7 路线图 / addendum C），不跳步、不并行铺开、不提前实现后置阶段的能力。

4. **默认我不写代码**：仅在 Lynx 放行（「进行」）后，写**最小一步**并交由 Lynx 过目；分工与放行细则见 §一。
5. **减少大段的注释和说明注释**，尽量不要注释代码，用命名和文件结构和代码结构来表达，一些可能引起歧义需要注释如 “size : string //byte”，尽量使用英文单词注释，如果需要大段注释使用/**/，如果需要注释多个函数则直接在代码头部写使用说明，写过使用说明的代码文件就不应该有函数注释，但可以有歧义注释。
6. **开发节奏由 Lynx 主导**：一次一个 story、不跨 story 构建；每个 story 开工前先按 §二 · Story 开工门槛 收口 Open questions / Deferred；规划好步骤后每步等 Lynx 带，我不自主往前冲。

## 沟通与解释风格（横切约定 · 每轮对话都适用）

解释问题、汇报进展、日常对话，统一按这个风格：

- **先给结论**，一句话讲明白，不绕。
- 短标签 + 分点组织；少术语、少黑话，表格只在真能帮对比时用。
- **具体、举例子、可核对**；空话套话删掉。
- 能短则短，但关键取舍和"为什么"要讲清。
- 默认中文；技术名词保留原文，并顺手用大白话点一下。
- 不自造词，不堆同义形容词。

## 成本与投入（横切约定 · 2026-10-25 起）

- **成本不是约束**：本项目 agent 跑在 DeepSeek 这类低成本模型上，跑一轮的钱远小于返工与错判的代价。因此不为「省 token / 省一轮」而：少跑测试、跳过实测、只读半个文件就下结论、把细节打磨推到以后。
- **该花就花在**：真跑命令与真实测（含集成测试、失败路径）、多透镜 review、反复核对文档与代码口径、把不确定项变成可核对的数据。
- **深不等于宽**：范围红线（§五）与「最小一步」（§〇 第 4 条）不变。成本低只意味着当前这一步可以做得更深、更细、更彻底，不意味着可以顺手加功能、多铺 story。
- **“做到完美”指任务内的完美**：当前改动能讲清、能复现、边界与错误路径都验证过；不是把范围越做越大，也不是无限延期收口。

## Lynx 的测试与工具习惯（横切约定 · 本仓库适用）

- **前端/demo 的「看效果」由 Lynx 浏览器手测**；agent 改完前端不主动派 Browser 子代理代测，除非他明确说「帮我测试」。轻量静态检查（grep、curl）不受限。
- **前端也写自动化测试（2026-10-14 起放行，此前规定是前端不写测试）**：`app/web` 用 **Vitest + jsdom + @testing-library/react**，测试文件与被测代码同目录同名 `*.test.tsx`；跑法 `npm test`（verbose reporter）/ `npm run test:ui`，与 `app/server` 同一套 Vitest 心智，IDE 测试树可点。
  - 测什么：**定义与取舍**，不是像素。优先钉「刚拍下来的规则」（例：纸纹常驻不随内容消失、pulse 光晕挂在卡片背后而非内部、提交中要 onBusyChange 上报、dryRun 不发请求、ApiError → 文案映射）。
  - 不测什么：不测视觉样式本身（配色/间距/动画观感归 Lynx 浏览器手测）、不为凑覆盖率测 getter、不 mock 掉被测逻辑本身。
  - 仍然遵守「测试不由 agent 主动伸手去改来适配实现」：测试挂了先看是实现错还是规则变了，规则变了要说明。
- **后端测试要 IDE 可点击的测试树（JUnit 式）**：纯终端跑不满足。JS/TS 落地为 **Vitest + Vitest 扩展 / `vitest --ui`**；新测试一律 Vitest，旧 node:test 暂留、之后统一重构（两套并存是可接受过渡态）。
- **测试要能看到中间值**：不接受「过了但看不到值」。用截断 `console.log`（如 `peek(label, value, n)`）→ Vitest UI 的 Console 标签，或 verbose/html reporter；给测试蓝图时自带截断 log 助手。
- **集成测试倾向真实网络**（真 URL 真抓真解析），不默认 mock/本地假服务器；接受 flaky、离线跑不了的代价。
- **报错直接贴诊断 JSON / 截图**，agent 对症修，不反问复现步骤。
- **偏好最少依赖、最简方案**：常问「有没有现成的库 / 更简单的方法」；agent 先给最简选项、再给稳健选项，并点明取舍。
- **Web 概念用类比 + 实测讲**（Lynx Web 基础仍在建立）：先结论，再拿真实跑出的数据佐证，不空谈。

## 一 · 协作与放行规则（开发流程的硬约束）

- **分工**：agent 负责给蓝图、步骤、技术取舍与指导；**Lynx 参与并拍板决策**。
- **放行才落代码**：agent 只有在 Lynx 明确说「**进行**」（或等价的明确放行指令）之后，才主动写 / 改代码。
- **未放行时仍可做**：修改文档与契约（本 AGENTS.md、PRD、架构、UX）、运行只读命令、做规划与评审——这些不受放行门槛限制。
- **Story 开工前先收口 Open questions / Deferred**：每个 story 在写第一行代码前，必须先把该 story 的 Open questions 与 Deferred 逐条处理完（见 §二 · Story 开工门槛）；未收口不算 ready-for-dev，也不写代码。
- 此规则优先于任何"看起来顺手就写了"的冲动。想推进就先出蓝图，然后等一句「进行」。

## 二 · 每个阶段与 story 的标准循环（per-stage / per-story loop）

> **看新进展先读上下文**：每次回到项目、要判断"进行到哪了"，先读 `_Agents/implementation-artifacts/sprint-status.yaml`（story 当前状态）和最新一份 `_Agents/implementation-artifacts/handoff-*.md`（上一会话的进度、关键决策与未决项），再决定下一步。别只凭记忆或重读代码推。

1. **锁定阶段目标** —— 明确"这一阶段要练到的 AI SDK 能力"（对照 addendum C）。
2. **规划与收口** —— agent 先按 §二 · Story 开工门槛 收口该 story 的 Open questions / Deferred，再出最小实现路径 + 关键取舍，Lynx 拍板。
3. **放行后实现** —— 小步、可运行、可回滚；一次只推进一个可验证的片段。
4. **验证** —— 跑起来，对照该 story 的详细 AC（P1 旧 story 用 PRD 里相关 FR 的 **Consequences (testable)**）逐条验收。
5. **复盘沉淀** —— 把"学到的 AI SDK 要点 / 踩过的坑 / 做出的取舍"追加到 `LEARNING.md`（学习日志，随项目生长）；并按 §二 · Story 走读页 写一份单文件 HTML 走读页（story 收口门槛）。

### Story 开工门槛：Open questions / Deferred 必须收口（硬约束 · 2026-10-24 起）

每个 story 在写第一行代码前，先把 `epics.md` 里该 story 的 `Open questions` 与 `Deferred` 逐条处理完，产出一份可核对的开工清单：

1. **Open question 逐条结论**：要么「已拍板」并写回 story 的方向/AC，要么「转 deferred」并写进 `deferred-work.md`（注明原因与去向）。不能留“待定”直接开写。
2. **必须实测才能定的**：标记 `spike`，限定在 Build 1 的最小验证里；spike 结果回写后，才能进入主实现，不能把不确定性带进主逻辑。
3. **Deferred 逐条去向**：本 story 不做 / 后续哪个 Epic / 永不做的理由；不能只写“以后再说”。
4. **回写位置**：`epics.md`（结论与 AC）、`deferred-work.md`（转出的项）、handoff（本轮处理了哪些）。
5. **拍板人**：Lynx；agent 只给选项、代价和推荐，不能把未决项默认成已定。

补充：

- P1 旧 story 若没有 `Open questions` / `Deferred` 两块，开工前补一份最小清单。
- 清单直接贴在 handoff 的「关键决策 / 未决」段，格式：`OQ-n 问题 → 结论/去向`；`D-n 项 → 去向`。
- 不因 story 小、只改后端或只改文档而豁免。
- 没有这份清单（以及至少一份可验收的详细 AC），story 不得从 `backlog` 进入 `ready-for-dev` / `in-progress`，agent 也不得写代码。

### Deferred 去向（硬约束 · 2026-10-24 起）

- **每条 deferred 必须带去向**：`<Story X.Y>` / `P<n> 主线` / `P<n> 工程项` / `另立 Epic` / `未排期` / `不做`。没有去向的条目不许记，不能只写“以后再说”。
- **`deferred-work.md` 按去向导航**：顶部「去向索引」是唯一入口；批次正文只放证据与定论方式。story 开工前先读该 story 名下的条目，逐条给结论（做 / 转下格 / 作废）；story 收口时清掉本格名下的条目或写明转出。
- **新增条目两处同步**：写进对应批次的正文（来源、证据、定论方式），同时在去向索引登记。索引与正文冲突时以索引为准，并在当次修正。
- **阶段收口对账**：P 阶段收口（如 P1→P2、P2→P3）做一次全量对账，不允许留下「未分配」条目；已解决项标 `~~删除线~~` + 解决日期 + 证据/commit。
- **不让 deferred 变成第二份路线图**：去向只写目标 story/阶段，不在这里重新排优先级；真正的顺序仍看 `epics.md` 与 Lynx 的拍板。

### handoff 文件命名（硬约束）

写会话交接文档时，文件名**只用 ASCII**，并把日期放进文件名开头方便排序：`handoff-<YYYY-MM-DD>-<epic>-<story>-<build>-<kebab-english>.md`，例如 `handoff-2026-10-13-epic1-story2-build3-chunking-pipeline.md`。日期取会话当天（和 frontmatter 的 `date` 一致）；同一天同一 build 再来一份就加 `-am` / `-pm`。标题、正文照常写中文；文件名和文档内的路径不出现中文、日文、空格、`+`。

Why：CJK 文件名会让 agent 的语言判断漂移（出现过输出日语），并让 `git status` / shell 里的路径变成八进制转义，难以核对。已有的中文文件名顺手改成英文。

### 前端工作总结（硬约束 · 2026-10-14 起）

每完成一块前端工作（一个页面 / 一组组件 / 一次美术口径统一 / 一次重构），在 `app/web/Agent/summary/` 下写一份总结 md，用来**日后恢复对话**：新会话先读当前目录，再按需查 `app/web/Agent/legacy/summary/` 的历史轮（上一轮收工时归档），不必重新逆向代码。

- 文件名同样只用 ASCII，日期开头：`summary-<YYYY-MM-DD>-<kebab-english>.md`，例如 `summary-2026-10-14-art-logic-and-layout.md`。
- 必写四节：**① 做了什么**（文件级，带路径）、**② 定义与取舍**（这一轮定下来的规则/口径，以及为什么这么定、否掉了哪个方案）、**③ 怎么验证**（跑过的命令与结果、哪些要 Lynx 手测）、**④ 未决项 / 下一步**。
- ② 是重点：装饰层三层语义、token 口径、组件归属这类「不写下来下一轮就会推翻重来」的东西都归它。代码里已有的注释不要复制进来，只写跨文件的约定。
- 与 `_Agents/implementation-artifacts/handoff-*.md` 的分工：handoff 是**按 story 的会话交接**（给 BMAD 流程看），summary 是**按前端工件的长期记录**（给下一个动前端的人看）；两者可以同一天各写一份，不互相替代。

### Story 走读页（硬约束 · 2026-10-23 起）

**每个 story 收口时（从 `review` 转 `done`，或 Lynx 明确说“这个 story 完了”）必须留一份单文件 HTML 走读页**，放在 `_Agents/walkthroughs/`。没有走读页不算收口；不因 story 小、只改后端或只改文档而豁免。

- 文件名只用 ASCII：`epic<epic>-story<story>-<kebab-english>.html`，例如 `epic3-story4-ingest-stages.html`。不写日期；同一 story 重做就覆盖同一份，避免多份行号漂移的副本。
- 必含五节：**① 一句话结论与 story 边界**（哪些是这格做的、哪些是前后 story 的补丁）；**② 代码块 + 逐行/逐段讲解**（带行号，点讲解能定位到代码）；**③ 关键取舍与踩坑**（为什么这么写、否掉了什么）；**④ 可复制的验证命令**（curl/SQL/测试）；**⑤ 与前后 story 的衔接**。
- 代码必须来自**当前工作区的真实文件**，不能凭记忆默写；后续 story 的补丁用徽章（如 `3.2`/`3.3`/`3.4`）标出，别混进本 story。
- 必须是 standalone HTML：无 CDN、无构建、`open` 直接能看；不放进 `app/web` 产品代码，不触发前端构建/测试。
- 行号会随代码漂移：该 story 的代码再被改动时，在**同一次改动**里重新生成/校对走读页，不许留“行号对不上”的旧页。
- 与 handoff / 前端 summary 的分工：handoff 是按会话的交接（给 BMAD 流程看）；`app/web/Agent/summary/` 是按前端工件的长期记录；走读页是按 story 的**教学/复核工件**。三者可以同日各写一份，不互相替代。
- 现有样例（2026-10-23）：`epic3-story1-endpoint-trace.html`、`epic3-story2-chat-langfuse.html`、`epic3-story3-retrieve-stages.html`、`epic3-story4-ingest-stages.html`。
- 生成/更新优先用项目级 `story-walkthrough` skill（`.qoder/skills/story-walkthrough/`）：按 BMAD workflow 形态组织（`SKILL.md` + `customize.toml`），来源、边界、验证写进 `_Agents/walkthroughs/.runs/<epic-story>/.memlog.md`，页面仍直接放 `_Agents/walkthroughs/`。

## 三 · 技术基调（指针，不在此重新决策）

> 具体参数与实现细节以架构阶段为准，本文件不写死。

- 前端 **Vite + React**，后端 **Hono / Node + TypeScript**；检索存储 **ParadeDB**（Postgres 全文+向量）；P2 计划对象存储用 **MinIO（S3 API）**。
- Embedding 用**本地 Ollama**（`qwenembed`）；Chat 用 **deepseek / dashscope**；两者都经 **Vercel AI SDK**（`streamText` / `embedMany`）。provider/model 由 `adapter/provider/registry` 与 `adapter/model/registry` 登记，`config.ts` 只读 `CHAT_MODEL`，不再认 `CHAT_PROVIDER`。
- 依据与取舍记录见 `addendum.md` A/B/C；P2 的落点见 `epics.md` Epic 4/5。

## 四 · 代码风格与文件组织（写代码时遵守）

> 配合 §〇 第 5 条：少注释，靠命名、文件结构、代码结构自解释。骨架即实际落地 `ollama.ts` 的做法。

**一个 `.ts` 文件，自上而下：**

1. **文件头使用说明**（多函数文件才写）：`/** … */` 讲清每个函数的职责、错误语义、单位、对其他文件或网络 API 的引用等。写过它，**函数上就不再单独注释**（只留歧义注，如 `// bytes`）。
2. `import`（第三方库）。
3. `export { 函数名 }` —— 值导出清单**置顶**；函数一律普通声明，`export` 不内联在声明处。
4. `export type { 类型名 }` —— 类型导出清单也在**置顶**；这里只列名，interface / type 的**本体**就近放到用它的主函数前面（前向引用合法，`tsc` 通过）。
5. 主函数区，每个主函数一段，段内顺序固定：〔该函数所需「项目内 `type` import」〕→〔该函数所需「本地 `interface` / `type` 声明」〕→ 主函数本体。多个主函数依次并列。
6. 私有工具函数：紧跟其所属主函数（① 的工具、② 的工具……）。
7. 其他通用工具函数收尾。

**React/JSX 文件里写注释的两处坑（都踩过）：**

- JSX 子节点位置只认「花括号包起来的注释」`{/* … */}`；光写 `/* … */` 会被当成文字渲染到页面上。
- 文件头那段 `/** … */` 里不能出现字面的注释闭合符，否则整段注释提前结束、下面的中文全成语法错误。

**命名：**

| 对象 | 规则 | 例 |
|---|---|---|
| 函数 | camelCase | `ollamaModelList` |
| **参数** | PascalCase（首字母大写） | `BaseUrl`、`AppDeps` |
| 函数内局部变量 | 保持 camelCase（不随参数规则变） | `res`、`models`、`emb` |
| interface 字段 / 属性 | 按数据语义；对齐外部 JSON 时**保留 snake_case** | `modified_at`、`quantization_level` |
| 文件名 | 主名 kebab + 点分类别；**文件夹已表类别则省后缀** | `resources-text.ts`（`routes/` 内不再写 `.route.ts`） |

> 现有代码尚未全部对齐（参数仍是 camelCase、文件名暂无类别后缀等）：改动某文件时顺手向本规范靠拢，不专门发起大规模重命名。

## 五 · 范围红线（勿擅自扩张）

- **P1 已收口（2026-10-24，Epic 1–3 全 done）**：URL/粘贴入库、混合检索、流式问答、引用与多轮、本地安全边界；观测 trace 作为 P1.x 支线一并交付。
- **P2 当前范围（Epic 4/5）**：资源画像 + 聊天 Markdown/表格渲染 + 表格 CSV；MinIO 原始文件归档、`.md/.txt` 上传、代码库 ZIP（仅文件管理）。
- **P2 不碰**：eval、prompt 管理、sandbox、tenant/auth、代码图、代码 RAG、PDF/Word 等格式、批量上传/后台队列、Generative UI。
- **后续阶段**：P3 Agent loop + 联网工具 + 批量队列/Redis；P4 Generative UI；P5 MCP/多模态/部署；tenant 最后。
- **一处有期限的例外（2026-10-16，Lynx 拍，已在 P1 收口）**：P3 的「检索工具化」提前进 Epic 2（Story 2.6）。只做「把 `retrieve` 包成工具交给模型调用」；当时的边界是 Agent loop（含 2026-10-21 定的最多 4 次有界重查、`stepCountIs(5)`，仍不算 Agent loop）、`agent/{skill,persona,mcp}`、Generative UI、MCP 都不碰。落点 `app/server/src/agent/tool/`；`trace/` 空盒后来由 Epic 3 填上。
- 任何"顺手加个功能"的念头，先回到 PRD 的 Non-Goals 对齐，再决定是否升级为一次正式的范围变更（`bmad-correct-course`）。

## 六 · 关键文档索引

目录级地图见 `_Agents/README.md`；下表只列关键文档。**冲突时以该格 Story 的 AC 为准**；PRD 的 Non-Goals 不被 story 覆盖。P2 的未决项以 `epics.md` 的 `OQ-4.x-n` / `OQ-5.x-n` 编号为准，`deferred-work.md` 只记延后项与去向。

**权威源（按阅读顺序）**

| 用途 | 路径 |
|---|---|
| PRD（P1 范围 + P1–P5 路线图） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md` |
| 补充材料（技术选型 / 格式 backlog / 阶段映射） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md` |
| 决策日志 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/.memlog.md` |
| 架构脊（AD-1…AD-11，v2） | `_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md` |
| Epic / Story 计划（含 P2 OQ / Deferred） | `_Agents/planning-artifacts/epics.md` |
| Sprint 状态（story 进度 + action items） | `_Agents/implementation-artifacts/sprint-status.yaml` |
| 延后项与未决项（实现层面，按去向索引） | `_Agents/implementation-artifacts/deferred-work.md` |
| Story 规格（少数故事的实现 spec） | `_Agents/planning-artifacts/specs/`、`_Agents/implementation-artifacts/spec-*.md` |

**过程 / 历史**

| 用途 | 路径 |
|---|---|
| 会话交接（进度 / 未决决策） | `_Agents/implementation-artifacts/handoff-*.md` |
| Story 走读页（每个 story 的代码讲解） | `_Agents/walkthroughs/` |
| 前端当前轮总结 / 历史总结 | `app/web/Agent/summary/`、`app/web/Agent/legacy/summary/` |
| 前端延后项 | `_Agents/implementation-artifacts/frontend-deferred.md` |
| 学习日志（按阶段追加） | `LEARNING.md` |
| Epic 1 retro | `_Agents/implementation-artifacts/epic-1-retro-2026-10-13.md` |
| 评审 rubric / 旧评审 / 旧架构 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/review-rubric.md`、`_Agents/legacy/` |

## 七 · 下一步（不要修改）

- 查看 sprint 状态与最新一份 handoff；任务已完成就跳过。只有 Lynx 说「再看看项目进度」时才重走一遍。

