# BMad Review — Knowledge Copilot PRD（lens 报告）

内容类型：docs（需求规范）。镜头：adversarial / edge-case-hunter / structure / prose。
说明：三镜头重叠处已标 ★，视为高信号。severity 由 PM 综合判断（镜头本身不排序）。

## 🔴 Critical（真实逻辑硬伤，建议 PRD 内修）

- ★ **C1 状态机自相矛盾**（Adv#2 / Edge#1,#23 / 结构相关）：Glossary「文档状态」定义 `失败` 态（附原因），但 FR-1 写"抓取失败时**不创建 Document**"。若不建 Document，`失败` 态无处挂载、FR-5 列表永远显示不出失败项、SM-3 分母口径分叉。*修*：二选一并全文对齐——(a) 抓取失败不建记录，删掉 `失败` 态、降级为一次性提示；或 (b) 保留 `失败` 态，改 FR-1 为"创建 `失败` Document，附原因，可重试/删除"。
- **C2 FR-6 与 FR-7 冲突**（Adv#1）：FR-6 要求"只依据检索到的 Chunk 作答"，FR-7 要求追问"第二个结论"结合上一轮 **Answer**（模型生成文本，非 Chunk）。两条都能自称合规。*修*：FR-6 补界定——多轮下**事实依据仍只有 Chunk**，历史 Answer 仅作指代消解、不作引用来源；FR-7 补"追问须重新检索，而非复述上一轮"。
- ★ **C3 引用完整性约束不足**（Adv#10 / Edge#8,#17,#19,#20,#21；PRD §4.4 自认"最容易出 bug"）：① 删除 Document 后历史 Citation 悬空，FR-10 却要求"指向真实存在的 Document"；② FR-10 只在 Document 级校验，模型可自造不存在的 Chunk 索引；③ 流式中断时半截 Answer 带未闭合引用如何处理无定义。*修*：补三条 Consequence——删除对历史引用降级为纯文本/标"来源已删除"；每个 Citation 必须映射到本轮真实命中 Chunk；流中断时标"回答未完整"、引用仅在该 Chunk 完整落地后可点。
- **C4 检索相关性下限缺失**（Edge#13）：top-K 恒 >0，知识库非空但只召回低相关噪音时，模型会据此"有依据"作答，违背 SM-2/SM-C1。*修*：FR-6 补一句"低于相关性下限应等同『未找到相关内容』拒答"（阈值仍可下放架构）。

## 🟠 High（口径要定清楚）

- **H1 §10 状态一致性**（Struct#1 / Adv#15）：OpenAI + ParadeDB 一边被标 `[ASSUMPTION]` 进假设索引，一边 §9 又称"已定"。前端已同样处理，这两个应一致——从假设索引移出、归入决议。
- **H2 SM-3「有效 URL」无定义**（Adv#4）：分母含不含"能访问但 JS 渲染/反爬"的站点未定，80% 不可证伪。*修*：给操作性定义或改口径为"符合 P1 抓取范围的来源成功率 ≥80%"。
- **H3 无运行/暴露安全边界**（Adv#6）：全篇"单人自用免认证"，却同时承诺真持久化 + 可对外演示 + 持有 OpenAI Key，未定义监听范围/密钥暴露面。*修*：加一条"P1 默认仅本地 127.0.0.1 监听；对外演示用只读/临时实例；Key 仅服务端"。
- **H4 空/异常输入与失败分支缺口**（Edge#3,#5,#6,#14）：0 Chunk（空正文）、非法/非支持类型 URL、空库提问、FR-2 本地导入无任何失败分支。*修*：为 FR-1/FR-2/FR-3/FR-6 各补最小失败/校验后果（空正文→`失败(内容为空)`；空库提问区别于"未找到"；非支持类型明确拒绝）。
- **H5 P1.x 未定义**（Adv#12）：§5 说 PDF 进 backlog，§6.2/addendum B 却写"P1.x/P2"，P1.x 是否属 MVP 无人界定，撞 SM-C2。*修*：声明"P1.x = MVP 验收后的追加，不属于 P1 完成条件"。
- **H6 OQ#4 选型前提被自家 A-2 推翻**（Adv#8）：选 Vite+React 的卖点是"保 P4 Generative UI"，但 A-2 承认该路径尚未确认。*修*：改口径为"P1/P2 学习价值独立于 P4；若 A-2 不通，P4 允许迁 Next 或改客户端组件方案"，不再以"保 P4"当已定案理由。
- **H7 检索术语与选型不一致**（Adv#9）：Glossary 把检索写成"向量相似度"唯一路径，选型却是 ParadeDB BM25+向量。*修*：Glossary 补注"实现可为向量/BM25/hybrid，由架构定；引用归属以最终命中 Chunk 为准"。

## 🟡 Medium（结构 / 组织）

- **M1**（Struct）§5 / §6.2 / §7 三处各列一遍 P2–P5 延后能力 → 以 §7 为唯一来源，另两处改指针（省约 120 词）。
- **M2**（Struct）§6.1 In Scope 逐字复述 FR-1…FR-11 → 精简为"FR-1–FR-11（见 §4）"+ 仅留界面/Provider 两项非 FR 条目。
- **M3**（Struct）traceability 缺口：FR-5、FR-7、FR-9 无任何 SM 验证；SM-4"检索编排"错映射到 FR-4 → 补映射或注明 table-stakes 不设指标。
- **M4**（Struct）§9 标题"Open Questions"实为已决 + 待跟进 → 拆"Resolved / Open Items"；OQ 编号格式统一（裸 `1.–5.` vs `OQ#3` vs `A-1`）。
- **M5**（Struct）术语撞词：Glossary 文档状态 `处理中`（入库进行中）与 FR-9"处理中状态可见"（请求 Loading）同词两义 → FR-9 改"Loading/请求处理中"。
- **M6**（Adv#11 / Struct）UJ↔FR 追溯不一致（描述层与 FR 层标到不同 UJ）→ 核对 UJ×FR 覆盖矩阵。
- **M7**（Struct）FR 字段 schema 落点不统一（Out of Scope / ASSUMPTION / Notes 各处乱序）→ 固定顺序。
- **M8**（Adv#14）§7"架构约束"把不可测的技术指令写进 PRD，与 §4 Notes"实现层不写死"矛盾 → 移到架构文档或改为可传递意图。

## ⚪ Low（文字 / 一致性，Prose）

- 概念中英双名：生成式 UI vs Generative UI、§7 P4 无中文名 → 首现建立对照后中文统一、代码名保留 `streamUI`。
- 写法漂移：`addendum`/`addendum.md`、`Vite + React`/`Vite+React`、`Hono+Node`/`Hono/Node`、`Markdown/纯文本`/`Markdown/txt`、`provider`/`Provider`、`真持久化`三处三写法无定义等。
- 语法/冗余：§4.2"不硬编"→"不编造"；§5"不是、也不做"缺宾语；SM-1"上线"与 §5"不做部署"用词冲突→改"P1 完成后"；"裸聊天"生造；FR-11"触发 Source Ref"缺中心词等。
- §0 顿号误用于分句；FR-3"正文文本"冗余；约 16 处更轻微修订见 Prose 镜头原始输出。
- 保留项：口语比喻（喂进去/干等/攒一个/长大/能力阶梯）与第二人称是作者声音，不规整。
