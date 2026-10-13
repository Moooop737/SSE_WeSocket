# AGENTS.md — Knowledge Copilot

> 本文件是这个仓库的 AI agent 工作基调。任何 agent 在此项目工作时，先读这份文件，再动手。
> 用户使用的语言是中文 (Simplified Chinese) 

## 〇 · 项目基调（最高优先，压过一切"炫技/堆功能"的冲动）

1. **这是一个「以学习为第一目标」的项目。** 主线是把 **Vercel AI SDK** 吃透（顺带深化 RAG），副产品才是一个能跑、能写进简历、可分阶段长大的作品集项目 Knowledge Copilot。
2. **学习优先于交付。** 宁可链路短、功能少，也要每一步"真懂"。评判进展的标准不是"加了多少功能"，而是"这一阶段要练的 AI SDK 能力，跑通了且讲得清为什么这么做"。
3. **循序渐进，一次一个阶段。** 能力按 P1→P5 阶梯叠加（见 PRD §7 路线图 / addendum C），不跳步、不并行铺开、不提前实现后置阶段的能力。

4. **默认我不写代码**：仅在 Lynx 放行（「进行」）后，写**最小一步**并交由 Lynx 过目；分工与放行细则见 §一。
5. **减少大段的注释和说明注释**，尽量不要注释代码，用命名和文件结构和代码结构来表达，一些可能引起歧义需要注释如 “size : string //byte”，尽量使用英文单词注释，如果需要大段注释使用/**/，如果需要注释多个函数则直接在代码头部写使用说明，写过使用说明的代码文件就不应该有函数注释，但可以有歧义注释。
6. **开发节奏由 Lynx 主导**：一次一个 story、不跨 story 构建，规划好步骤后每步等 Lynx 带，我不自主往前冲。
## 沟通与解释风格（横切约定 · 每轮对话都适用）

解释问题、汇报进展、日常对话，统一按这个风格：

- **先给结论**，一句话讲明白，不绕。
- 短标签 + 分点组织；少术语、少黑话，表格只在真能帮对比时用。
- **具体、举例子、可核对**；空话套话删掉。
- 能短则短，但关键取舍和"为什么"要讲清。
- 默认中文；技术名词保留原文，并顺手用大白话点一下。
- 不自造词，不堆同义形容词。

## Lynx 的测试与工具习惯（横切约定 · 本仓库适用）

- **前端/demo 验证由 Lynx 浏览器手测**；agent 改完前端不主动派 Browser 子代理代测，除非他明确说「帮我测试」。轻量静态检查（grep、curl）不受限。
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
- 此规则优先于任何"看起来顺手就写了"的冲动。想推进就先出蓝图，然后等一句「进行」。

## 二 · 每个阶段的标准循环（per-stage loop）

> **看新进展先读上下文**：每次回到项目、要判断"进行到哪了"，先读 `_Agents/implementation-artifacts/sprint-status.yaml`（story 当前状态）和最新一份 `_Agents/implementation-artifacts/handoff-*.md`（上一会话的进度、关键决策与未决项），再决定下一步。别只凭记忆或重读代码推。

1. **锁定阶段目标** —— 明确"这一阶段要练到的 AI SDK 能力"（对照 addendum C）。
2. **规划** —— agent 出最小实现路径 + 关键取舍，Lynx 拍板。
3. **放行后实现** —— 小步、可运行、可回滚；一次只推进一个可验证的片段。
4. **验证** —— 跑起来，对照 PRD 里该阶段相关 FR 的 **Consequences (testable)** 逐条验收。
5. **复盘沉淀** —— 把"学到的 AI SDK 要点 / 踩过的坑 / 做出的取舍"追加到 `LEARNING.md`（学习日志，随项目生长）。

### handoff 文件命名（硬约束）

写会话交接文档时，文件名**只用 ASCII**，并把日期放进文件名开头方便排序：`handoff-<YYYY-MM-DD>-<epic>-<story>-<build>-<kebab-english>.md`，例如 `handoff-2026-10-13-epic1-story2-build3-chunking-pipeline.md`。日期取会话当天（和 frontmatter 的 `date` 一致）；同一天同一 build 再来一份就加 `-am` / `-pm`。标题、正文照常写中文；文件名和文档内的路径不出现中文、日文、空格、`+`。

Why：CJK 文件名会让 agent 的语言判断漂移（出现过输出日语），并让 `git status` / shell 里的路径变成八进制转义，难以核对。已有的中文文件名顺手改成英文。

## 三 · 技术基调（指针，不在此重新决策）

> 具体参数与实现细节以架构阶段为准，本文件不写死。

- 前端 **Vite + React**，后端 **Hono / Node + TypeScript**；存储 **ParadeDB**（Postgres 全文+向量）。Embedding 用**本地 Ollama**（如 `qwenembed`），Chat 用 **deepseek / dashscope**（`config.ts` 按 `CHAT_PROVIDER` 切换）；经 **Vercel AI SDK** 做 provider 抽象是 P1 后期目标——当前 fetch/embed 暂用原生 `fetch`。
- 依据与取舍记录见 `addendum.md` A/B/C。

## 四 · 代码风格与文件组织（写代码时遵守）

> 配合 §〇 第 5 条：少注释，靠命名、文件结构、代码结构自解释。骨架即实际落地 `ollama.ts` 的做法。

**一个 `.ts` 文件，自上而下：**

1. **文件头使用说明**（多函数文件才写）：`/** … */` 讲清每个函数的职责、错误语义、单位、对其他文件或网络api的引用等。写过它，**函数上就不再单独注释**（只留歧义注，如 `// bytes`）。
2. `import`（第三方库）。
3. `export { 函数名 }` —— 值导出清单**置顶**；函数一律普通声明，`export` 不内联在声明处。
4. `export type { 类型名 }` —— 类型导出清单也在**置顶**；这里只列名，interface / type 的**本体**就近放到用它的主函数前面（前向引用合法，`tsc` 通过）。
5. 主函数区，每个主函数一段，段内顺序固定：〔该函数所需「项目内 `type` import」〕→〔该函数所需「本地 `interface` / `type` 声明」〕→ 主函数本体。多个主函数依次并列。
6. 私有工具函数：紧跟其所属主函数（① 的工具、② 的工具……）。
7. 其他通用工具函数收尾。

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

- **P1 只做**：URL 抓取 + Markdown/纯文本入库、基于知识库的检索问答、流式输出、引用溯源。
- **P1 不碰**（均属后续阶段或非目标，见 PRD §5 / §6.2）：多用户/账号/协作/计费、PDF 等多格式解析、图片/音频多模态、工具调用/Agent、Generative UI、生产部署。
- 任何"顺手加个功能"的念头，先回到 PRD 的 Non-Goals 对齐，再决定是否升级为一次正式的范围变更（`bmad-correct-course`）。

## 六 · 关键文档索引

| 用途 | 路径 |
|---|---|
| PRD（P1 范围 + 分阶段路线图） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md` |
| 补充材料（技术选型/格式backlog/阶段映射） | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/addendum.md` |
| 决策日志 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/.memlog.md` |
| 评审报告 | `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/review-rubric.md` |
| 学习日志（待首个阶段开建） | `LEARNING.md` |
| Sprint 状态（story 进度） | `_Agents/implementation-artifacts/sprint-status.yaml` |
| 会话交接（进度 / 未决决策） | `_Agents/implementation-artifacts/handoff-*.md` |

## 七 · 下一步（不要修改）

- 查看sprint状态，查看对话交接，之后完成任务，如果已经做过就不需要去做了，只有lynx让你再看看项目进度时再做一遍。

