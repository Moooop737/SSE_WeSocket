# PRD Quality Review — Knowledge Copilot

> 评审基准：`prd-validation-checklist.md` 七维度。校准对象：单人自用 + 作品集项目，循序渐进 5 阶段，本次重点钉死 P1 MVP。stakeholder = 作者 Lynx 本人。按"hobby / solo → rigor light，substance bar 仍适用"打分，不按公开发布产品苛求。

## Overall verdict

这是一份**质量高于同类 solo 项目、可据以推进架构 / epics 的 PRD**。它在多数维度上是 strong：决策以决策的形式出现（前端选型甚至诚实写明了"放弃了 Next 原生 RSC"这一代价）、有清晰 thesis（收藏用不起来 + 学习载体双主线）、SM 配了 counter-metrics（SM-C1/C2，多数 PRD 会漏）、Non-Goals 与 `[ASSUMPTION]` 标注规范且基本可 roundtrip。风险集中在两处下游会最先撞上的问题：**(1) 支撑 FR-3/FR-4/FR-6 质量的技术参数完全缺位**（分块策略、检索 top-K/相似度阈值、Citation 格式），story creation 无法据此写出可测验收；**(2) §6.1 有一处 FR 交叉引用错位**（FR-5 是"查看/删除"却被并入"入库管道"描述）。修掉这两点即可定稿。综合：**接近可定稿，需两处定向修订，不阻断**。

---

## Decision-readiness — strong

决策以决策形式出现，且关键取舍诚实命名。`§9` 五问全部落为"**已定**"而非悬空；`§2.2 Non-Users` 明确排除团队/多租户/SLA；前端取舍（addendum A）不只写"选了 Vite+React+Hono"，还写清"Next.js 未选=避免绑定其部署模型；纯 Vue/Svelte 未选=丢官方 UI 钩子、P4 成本高"——给了什么、放弃了什么都在。`§4.4 Notes`（"引用与检索的对应关系是最容易出 bug 的地方"）是真实张力点上的标注，不是安全检查点。

唯一保留：存储"真持久化 ParadeDB"被当作既定结论写下，但对一个学习项目而言它换来的成本（本地起库 / Docker 运维）在 PRD 正文里没有被作为代价点明，只在 §9 A-1 转交架构。可接受，但会让读者低估这块的隐性投入。

### Findings
- **low** 持久化代价未在正文命名（§4.1 FR-4 assumption / §9#1）— 决策本身清晰，但"真持久化"对 solo 项目的代价（运维、起库复杂度）未作为 given-up 点出。*Fix:* 在 §9#1 决议后补一句"代价：本地需起 ParadeDB/Docker，运维负担由架构阶段承担"。

## Substance over theater — strong

没有家具式内容。**零 persona**（对单人产品正确，不硬凑角色）；Vision 与本产物强绑定（成长路径 + Vercel AI SDK 学习载体），换不进别的 PRD；差异化声明诚实——不宣称 RAG 本身新颖，而是把差异落在"引用溯源相对裸聊天"（§4.4）和"分阶段成长路径"（§1）。**无 NFR theater**（全文没有"必须可扩展/安全/可靠"这类模板套话）。SM-1 用"每周真实查询 ≥2 次、上线一个月仍在用"而非 DAU/MAU，是反 vanity  metric 的正面例子。

### Findings
- 无。此维度不需要 finding。

## Strategic coherence — strong

有明确 thesis：`§1` "收藏了一堆东西却用不起来，找信息时只能靠关键词翻" + 学习双主线。功能优先级由 thesis 推出而非"先做简单的"：P1 = 最小可信闭环（入库→检索→流式回答→引用）。SM 直接验证 thesis 而非仅测活动量：SM-2 答案可信度对应引用差异化、SM-1 留存对应"是否真在用"。**明确命名了 counter-metrics**（SM-C1 防止为延迟牺牲引用、SM-C2 防止 scope 膨胀），这是最有价值的战略成熟信号，且直接制衡本 PRD 的两大诱惑。MVP scope kind（problem-solving + experience）与 scope 逻辑一致。

唯一：SM-4"能力覆盖"衡量的是学习目标而非产品 thesis——但对双主线项目这是诚实而非跑偏。

### Findings
- 无（正面：SM-C1/C2 是本 PRD 战略成熟度的亮点）。

## Done-ness clarity — adequate

多数 FR 都带 `Consequences (testable)`，且不少是真可测：FR-7"追问'第二个结论展开讲讲'能结合上一轮正确理解"、FR-10"有依据的 Answer 至少含一个可解析 Citation 指向真实 Document"、FR-5"删除后其 Chunk 不再出现在检索结果"都合格。这一层对 solo 项目够用。

但按"下游 story creation 最依赖此维度、要不留情"的标准，缺口是**承重参数缺失**：
1. **分块（Chunk）策略完全未定义**——FR-3 只说"切分为一到多个 Chunk"，没有 chunk 大小/重叠/切分依据。工程师无法判断 FR-3 何时算"done"，而它直接决定 FR-6/FR-10 的检索质量。
2. **检索参数缺位**——FR-6"检索相关 Chunk"没有 top-K、相似度阈值、无命中判定门槛；"Answer 内容可对应到被检索的 Chunk"无判据。
3. **状态生命周期未定义**——FR-1"状态最终转为'已就绪'"、FR-5"查看…状态"，但全文没有"已就绪/处理中/失败"的状态集合与迁移，`已就绪` 也未进 Glossary（见机械检查）。
4. **Citation 格式未定**——FR-10"可解析的 Citation"没有最小结构定义，SM-2 的"正确"由谁判定也没有评测方法。

### Findings
- **high** 分块与检索参数缺失（§4.1 FR-3 / §4.1 FR-4 / §4.2 FR-6）— chunk 大小/重叠、检索 top-K/相似度阈值、Embedding 写入成功的可验证条件均未给。这是 story 验收写不出来的直接卡点，也决定 FR-6/FR-10 质量。*Fix:* 各给一个 P1 默认值或显式声明"由架构阶段决定"并挂 `[NOTE FOR PM]`，避免被读者当作可任意实现。
- **medium** "已就绪/失败"状态无定义（§4.1 FR-1 / §4.2 FR-5 / UJ-1）— "状态最终转为已就绪"不可验收（无状态集、无超时门槛）。*Fix:* 在 Glossary 增补 Document 状态枚举（如 处理中/已就绪/失败），FR-1/FR-5 的 Consequence 引用之。
- **medium** SM-2 与 FR-10 的"正确/可解析"无评测法（§8 SM-2 / §4.4 FR-10）— "抽样 10 题 ≥8 正确"缺"由谁、按什么标准判定正确"。*Fix:* 一句话定义判定口径（如"引用指向的 Chunk 确实包含答案关键句"）。

## Scope honesty — strong

 omission 显式化做得扎实。`§5 Non-Goals` 逐条排除多用户/计费/多格式/多模态/Agent/生成式 UI/生产部署/微调，`§6.2` 用 deferred 标出 P2–P5 归属，PDF 等在 §5 明确"进入 backlog"。`[ASSUMPTION]` 内联规范、§10 汇总。**open-items 密度低**：5 个 OQ 全部有解、仅 2 个新增且合理转交架构阶段、5 处内联 assumption——对一个 green-light-to-build 的 P1 而言这是健康信号，不构成阻断。de-scoping（PDF→backlog、字符级高亮→增强项）都是公开提出而非静默执行。

保留：`§6.2` 有一个 `[NOTE FOR PM]`，但 P4 Generative UI 在 Vite+SPA 下 `streamUI` 的 RSC 路径风险（addendum A 尾注 / §9 A-2）这一真实张力，PRD 正文里没有对应的 NOTE FOR PM 提示，藏在补充材料里。

### Findings
- **low** P4 技术张力未在主文标注（§7 P4 / §9 A-2）— "streamUI 的 RSC 形态依赖 Next，SPA 下需按客户端流式渲染调整"是会影响架构的悬而未决点，目前只在 addendum。*Fix:* 在 §7 P4 行加 `[NOTE FOR PM]` 指向 A-2，让读者在主线就知道这是待验证假设。

## Downstream usability — adequate

结构对链路友好：Glossary 齐备、FR 全局连续编号并内嵌分组、UJ 有具名主角（Lynx）、FR↔UJ 显式互指。作为 chain-top（喂架构/UX/epics），这些是必要的。但有几处会影响 source-extraction 的机械缺陷：

1. **§6.1 交叉引用错位**：line 186 把 FR-3/FR-4/**FR-5** 并列为"解析、分块、向量化并写入"，但 FR-5 实为"知识库内容查看与删除"（§4.1）。delete 能力在 §6.1 的分组描述里没有落点，view/delete 也未在 in-scope 得到独立条目——下游按分组拆 story 会把 FR-5 归错。
2. **OQ 引用编号软约定**：FR-1 引"OQ#3"、addendum 引"OQ#4""OQ#1/#2"，而 §9 条目只是普通 1–5 编号、未字面标注 `OQ#n`。可解析但对自动抽取脆弱。
3. **`[ASSUMPTION]` 格式不一致**：§6.1 用裸 `[ASSUMPTION]` + 句号起头，其余用 `[ASSUMPTION: …]`。

### Findings
- **medium** §6.1 FR-5 归组错误（§6.1 line 186）— 把"查看/删除"的 FR-5 塞进"入库管道"描述，且 view/delete 在 MVP in-scope 无独立条目。*Fix:* 拆成"...写入知识库（FR-3, FR-4）"与"知识库查看与删除（FR-5）"两条。
- **low** OQ 条目未字面标注 OQ#n（§9）— 正文以 OQ#1–5 交叉引用但 §9 用普通编号。*Fix:* 给 §9 五项加 `OQ#1 … OQ#5` 显式前缀，使引用可解析。

## Shape fit — strong

形态匹配得好：solo/capability spec 形状 + 轻量 UJ（仅 2 条，且真实驱动 FR-1..11，不是为凑数），未过度 formalize（不堆 persona、不写花哨旅程），也未欠formalize（有 Non-Users、有分阶段 roadmap、有 operational SM-4 与 user-facing SM-1/2 混配）。"hobby/solo → 严格度可轻、substance bar 仍适用"这条被满足。作为 chain-top 起点，roadmap §7 为后续阶段留接口的意图清楚。

### Findings
- **low** UJ-2 缺边界分支（§2.3 UJ-2）— UJ-1 有"抓取失败"边界，UJ-2（导入笔记）无对应失败/超大文件路径。对 solo 可接受。*Fix:* 可选补一句 Markdown 导入的最小失败处理，或显式声明不覆盖。

---

## Mechanical notes

- **Glossary drift / 缺失**：`已就绪` 在 FR-1、UJ-1、SM-3 反复用作状态，但既未进 §3 Glossary，也无状态枚举定义（见 Done-ness medium finding）。其余核心术语（Document/Chunk/Embedding/Citation/Source Ref/Session/Provider）全文大小写与中英对照一致，无明显同义漂移；`向量化（Embedding）` 与 §7/addendum 里的 `embed` 属 SDK API 名，可接受。
- **ID 连续性**：FR-1→FR-11 连续、唯一、无重号（4.1:1-5 / 4.2:6-7 / 4.3:8-9 / 4.4:10-11）。UJ-1/UJ-2、SM-1..SM-5、SM-C1/C2 均连续唯一。✓
- **交叉引用可解析性**：`§0→§10`、`§4.1→addendum B`、`§7→addendum C/A`、`§9→.memlog.md`（该文件确实存在于同目录）均可解析。两处缺陷：① FR-1/addendum 引的 `OQ#n` 未在 §9 字面标注（可解析、脆弱）；② §6.1 line 186 把 FR-5 描述成入库管道一环，属语义错位。
- **Assumptions Index roundtrip**：5 处内联 `[ASSUMPTION]`（§4.1 / FR-4 / FR-7 / FR-11 / §6.1）**全部**在 §10 有对应条目 ✓（正向完整）。反向有 1 条偏差：§10 第 6 条 "addendum A — 前端已定案" **没有**对应的正文内联 `[ASSUMPTION]`，且它是一项**已确认决策**（OQ#4 已定案），按 §5 定义"assumption = 用户未直接确认的推断"应归为决策而非假设——属 over-index，低危。另 §6.1 的裸 `[ASSUMPTION]` 格式与其余 `[ASSUMPTION: …]` 不统一。
- **UJ 主角**：UJ-1、UJ-2 均以 Lynx 具名主角、情境内联。✓（UJ-2 无边界分支，见 Shape fit low）。
- **必需章节**（按 solo + chain-top 校准）：Vision / Target User / Glossary / Features+FR / Non-Goals / MVP Scope / Roadmap / Success Metrics+Counter-metrics / Open Questions / Assumptions Index 齐备。缺 NFR/性能章节，但 §9#5"不加规模护栏"已诚实覆盖该决定，solo 场景不视为缺失。
