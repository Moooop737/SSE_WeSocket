# 文档集评审 — 2026-10-24（P2 重点）

> **范围**：`AGENTS.md`、PRD + addendum、`epics.md`、`sprint-status.yaml`、`deferred-work.md`、`frontend-deferred.md`、2026-10-15 版 `ARCHITECTURE-SPINE.md`、`LEARNING.md`、五份 handoff、`_Agents/walkthroughs/` 清单、`app/web/Agent/summary/`。
> **方法**：`bmad-review` 四镜头（adversarial / edge-case-hunter / structure / prose）；静态断言回代码核对，未能实测的单独标注。
> **结论**：P2 的方向成立，但文档里有一批 P1 已拍板结论没回写、v1/v2 架构编号混用、P2 还停在「方向级且没有可开工判据」。本轮已把事实错误与 P2 骨架补齐；剩下的是需要 Lynx 拍板的架构归属与 Epic 3 收口。

## 一、结论（一句话版）

- **P2 可以做**：Epic 4 的画像/渲染两轨、Epic 5 的资源文件/代码库两轨都独立，边界清楚。
- **但不能直接开工**：Epic 3 的 3.2/3.3/3.4 还在 `review`；P2 有 4 个架构归属没拍（ObjectStore、codebases、profile 能力位、store 段）。
- **文档的主要病**：不是缺内容，是**同一事实多处维护且其中几处过期**——PRD 还写 P2=多轮+`generateObject`，epics 的 AD 编号还是 v1，SPINE 的契约表与 as-built 相反，sprint 的 action items 有 4 条早已完成。

## 二、已直接修正（文档）

| 文件 | 修了什么 | 依据 |
|---|---|---|
| `prd.md` | §7 路线图：多轮已入 P1；P2 = 结构化输出与渲染 + 文件与存储；P3 = 联网工具 + Agent loop；`generateObject` 标为弃用。§6.1/§6.2 拆开「多会话已提前」与「账号最后再做」。FR-2 去掉后端编码启发式；FR-5/FR-10 来源删除改为「快照可看 + 标注」；FR-6 改为 0 命中 + 模型判定、阈值 0.42 只兜噪声 | 2026-10-13/14/21/24 已拍板的结论；`agent/chat/chat.ts`、`routes/resources.ts` |
| `addendum.md` | B 表格式项改为「未排期，P2 不接」；C 表 P2/P3 行同步；P1.x 不再重复定义 | 同上 |
| `epics.md` | `inputDocuments` 指向 v2 SPINE；AD 编号统一为 v2；Additional Requirements 去掉 v1 转写；UX 条承认 Geist 设计系统；Story 1.1 的 `ports/` AC 标作废；1.2 查重补 as-built；2.1 改为 0 命中/模型判定并标注三态提示未实现；2.3 改为 8 位 chunkId + 快照降级已实现；2.4 的 410 条款作废；2.6 的 body 改为 `{query, sessionId}`；3.1 补 `payloads`/完整跳过前缀/`page,per_page`/hono-crud 例外；3.3 的 sink 不变式加 no-op 例外 | 代码核对 + 2026-10-14/21/22/23 的 handoff/对账 |
| `epics.md` | Story 2.1 的 43 行评审明细移入 `_Agents/legacy/reviews/review-2026-10-14-epic2-story2-1-findings.md`，原位留摘要 | 结构镜头：评审明细打断 2.1→2.2 的阅读线 |
| `epics.md` | **Epic 4/5 重写**：9 格统一加 `Implements` + AC 占位；OQ 编号 `OQ-4.x-n` / `OQ-5.x-n`；显式两轨依赖；补 ObjectStore 归属、`codebases` 领域、profile 能力位、store 段与 3.4 的耦合、非 ready 资源状态码、去重叠重建、流式半截 Markdown、CSV 公式注入、ZIP 限额/实际字节计数、原始 HTML 下载的 `attachment`+`nosniff` | P2 开工门槛（AGENTS.md §二）+ 四镜头的 edge case |
| `ARCHITECTURE-SPINE.md` | 加 as-built 对照（`routes/` vs `api/`、实际文件清单、Structural Seed 不是现况）；AD-2 补 ObjectStore 第六类预告；AD-3 补 hono-crud 具名例外；`/chat` 改 `{query, sessionId}`；`DELETE` 改 204；`POST /resources` 改 `chunk_count`；chunks 补 `pagination`；Deferred 里三格提示/工具化/embed SDK 标已决或已交付；5900 → 10,922/13,107 | 代码核对；`review-reality-check.md` 的推导 |
| `sprint-status.yaml` | 2.1 注释标注 `E_DIMENSION_UNKNOWN` 已退役；P2 注释改两轨 + OQ；4 条过期 action item（retro-3/4/8/10）标 `done` 并写 resolution | 2026-10-14/15/20/24 的工件与代码 |
| `deferred-work.md` | 顶部加「去向索引（2026-10-24）」；修 `epics.md:187` / `epics.md:101` 行号指针；ReAct/「资料不足」标为 2.6 已消解；会话 DELETE 改为「端点已有、缺软删语义与前端接线」；跨格 OQ 改为指向 epics 编号 | 代码核对 + 2.6 as-built |
| `AGENTS.md` | 文档索引拆「权威源 / 过程历史」，补 SPINE、frontend summary（当前 + legacy）、spec、retro；加「冲突时以 Story AC 为准」；修「网络api」「格式backlog」「中文 (Simplified Chinese)」等措辞；前端 summary 阅读路径补 legacy | 结构/文字镜头 |
| `frontend-deferred.md` | 顶部说明「前半 open、后半决策记录」；会话列表/多轮标已接（2026-10-21）；失效 summary 路径改 legacy | 2026-10-21 as-built |
| `LEARNING.md` | 顶部加 story→段落索引；标注 3.1 没有单独立节的缺口；修失效 summary 路径 | 结构镜头 |
| `review-2026-10-13-epics-lenses.md`（已归档到 `_Agents/legacy/reviews/`） | 顶部标为 2026-10-13 历史工件，范围仅当时 2 个 Epic | 结构镜头 |

## 三、P2 计划评估

### 3.1 现在的形状

- **Epic 4（主线）**：轨 A 画像 `4.1 → 4.2 → 4.3`；轨 B 渲染 `4.4 → 4.5`。两轨独立，可先做任意一轨。
- **Epic 5（工程支线）**：轨 A 资源文件 `5.1 → 5.2 → 5.3`；轨 B 代码库 ZIP `5.1 → 5.4`。
- 每格现在都有 `Implements`、AC 占位、`Depends`、编号 OQ、Deferred；开工门槛仍按 AGENTS.md §二执行（补详细 AC + 逐条收口 OQ/Deferred）。

### 3.2 开工前必须拍板

| 编号 | 问题 | 不拍的后果 |
|---|---|---|
| `OQ-5.1-1` | ObjectStore 放 `adapter/`（AD-2 第六类，须先改 AD-2）还是住能力片 | 5.1 第一行代码就决定分层；事后搬要动 AD + 依赖图 |
| `OQ-5.4-4` | `codebases` 是新领域（新表/新能力盒/新路由）还是 `resources` 的 subtype | 决定 5.4 是「加一张表」还是「扩一条主链路」 |
| `OQ-4.2-5` + `OQ-4.1-3` | 画像生成住哪一层（`agent/` / `ingest/` / 新 `profile/`）；`profile` 单列还是独立表 | 4.1/4.2 的目录、迁移、端点归属都悬着 |
| `OQ-5.2-3` | `store` 是独立 stage 还是折进 `write` | 独立 stage 要改 `StageName`，并同批改 Story 3.4 的「恰好 5 段」AC 与走读页 |
| `OQ-4.2-2` | DeepSeek 的 `Output.object` 空内容/半截 JSON/拒答形态 | 4.2 的失败分支只能猜；建议 4.2 的 Build 1 做 spike |
| `OQ-4.4-1` | citation 自定义节点能否稳定穿过 react-markdown 的 `components` 映射 | 4.4 的插件方案选型；建议 Build 1 先尖刺 |
| `OQ-5.1-2` | 本机 MinIO 怎么起（当前 shell 无 docker/minio） | 5.1 无法验收，连带 5.2/5.3/5.4 |
| `OQ-4.5-1` | CSV 只做 CSV，还是同时 Markdown/Excel | 4.5 的范围与依赖 |

> 这些是**选项题**，不是「默认这样」；建议按「先拍影响目录/迁移的（5.1-1、5.4-4、4.1-3、4.2-5、5.2-3），再拍验收口径的（4.2-2、4.4-1、4.5-1）」顺序过，一次一条。

### 3.3 建议顺序（不替 Lynx 拍板）

- **Epic 3 先收口**：3.2/3.3/3.4 都在 `review`；走读页已有。收口后跑一次 Epic 3 retro（哪怕只记观测这条支线的取舍），再开 P2。
- **P2 可先做 4.4**：与画像、MinIO 全独立，纯前端 + 引用解析，能先把「Markdown 表格/引用」这个用户可见收益拿到；4.5 紧随。
- **画像轨从 4.1 开始**：数据形状与纯函数不依赖 MinIO，也不依赖 DeepSeek 失败形态；4.2 再 spike。
- **Epic 5 等 MinIO 运行时**：5.1 的运行时没定之前，5.2/5.3/5.4 都只是纸面。

### 3.4 P2 的主要风险

- **5.2 会碰 3.4 的验收**：新增 `store` 段会让 ingest 从 5 段变 6 段；3.4 的 AC、走读页、`StageName` 要同批改。
- **原始 HTML 下载是安全面**：必须 `attachment` + `nosniff`，否则抓取页的脚本会以本地源执行。
- **ZIP 是攻击面**：中央目录虚报、`..`、反斜杠、盘符、符号链接、压缩炸弹都要挡；限额要按实际解压字节算。
- **CSV 公式注入**：以 `= + - @` 开头的单元格要前缀单引号，否则 Excel 打开会执行公式/DDE。
- **流式 Markdown**：半截表格/围栏会让渲染闪烁或吞内容；4.4 要定「未结束按纯文本/容错」。
- **画像正文重建**：chunks 有重叠，直接拼接会重复；4.2 已写明按 `start/end_offset` 去重叠。

## 四、仍需处理（未直接修）

### 4.1 文档 / 流程

- ~~**Epic 3 未收口**：`3-2`/`3-3`/`3-4` 仍是 `review`；`epic-3-retrospective: optional`。走读页已齐，但没有 Epic 3 retro。~~ **2026-10-24 已收口**：四镜头 code review 完成，findings 见 `review-2026-10-24-epic3.md`；3.2/3.3/3.4 与 Epic 3 标 `done`，代码未修（按 Lynx「仅 review」），retro 跳过。3.1 的 LEARNING 段仍未补。
- **Story 3.1 没有 LEARNING 段**：已在 `LEARNING.md` 索引里标缺口；要么补一段，要么把规则降为「每 epic 至少一段」。
- **`test/` 仍被 `app/server/.gitignore` 忽略**：active 测试全过也不进版本库；`legacy.test.ts` 被 vitest 排除。验证无法从 commit 复跑。
- **SPINE 的 Structural Seed 仍是 2026-10-15 的种植图**：本轮加了 as-built 对照，但没有整块重写；读 Seed 前先看顶部注。
- **handoff 五份三种形状**：10-20 有 frontmatter + 七节，10-21/22/23 是六节；AGENTS 没有规定 handoff 骨架。建议补一条固定骨架，但这是流程决定。
- **`deferred-work.md` 仍是按批次堆叠**：顶部加了索引，但条目状态仍有三种写法（`[owner]` / `status:` / 删除线）。要彻底可扫读，得统一状态词。
- **Epic 1 retro 还有 7 条 open**：其中 `retro-6`（app/ 是否纳入外层 git）、`retro-7`（断言守护）、`retro-11`（story 工件）仍有效；其余按需处理。
- ~~**`review-lenses-epics.md`** 是历史工件；本轮已加范围注，未搬去 `legacy/reviews/`。~~ 2026-10-24 已归档到 `_Agents/legacy/reviews/review-2026-10-13-epics-lenses.md`。

### 4.2 代码 / 行为（lens 提出，需实测或排期）

> 这些不属于「文档整理」，但会影响 P2 或 P1 验收；按影响面列，不按严重度排序。

- **三态提示不可区分**：`/chat` 只有一句 instructions 让模型说「知识库没有答案」；空库 / 全无 ready / 无相关内容的**后端分流未实现**（`resourceCounts()` 无调用点）。P2 的画像页若要显示库状态，会撞同一缺口。
- **`/chat` 流内错误没有稳定 code**：`onError` 固定文案「问答失败」；文档承诺的 `E_CHAT` 只在流外 500 分支。
- **前端引用只取最后一条 `tool-retrieve` part**：5 步上限下一次回答可能多次检索；更早一批引用会退化成纯文本。4.4 做 Markdown 引用时应一并合并所有 tool part 的 hits（按 chunkId 去重）。
- **`hits` 缺 `chunkId` 会抛**：前端 `hitIndex` 直接 `chunkId.toLowerCase()`；旧载荷/字段漂移会让整页落错误边界。
- **入库不校验向量长度 / 检索不按 model 过滤**：换同维模型会静默混排；兼容层回 4096 时会把异维行写成 ready。P2 的画像不直接依赖它，但 P2 之前该收。
- **`retrieve` 的 topK schema 无默认**（`.gt(3).lt(20)`）：模型省略或给 3/20 直接校验失败。
- **`POST /sessions` 坏 JSON 可能吞成 `{}`**：lens 提出，未实测；若成立应 400 `E_BAD_JSON`。
- **`GET /resources/not-a-uuid` 可能 500**：hono-crud 的 read 在 `uuid` 转换处；lens 提出，未实测。建议在 CRUD 前加 UUID 校验或统一错误映射。
- **`pool` 的 `max`/`query_timeout` 仍写死**：P3 之前若灌长文档会先撞 `query_timeout`。
- **非 HTML 类型 URL 仍被当文本吞**：FR-1 的「非 P1 支持类型直接拒绝」未实现；affects P1 acceptance。
- **`chunks.deleted_at` 存在但无人写**：检索只带 `r.deleted_at IS NULL`；将来出现 chunk 级软删会静默命中。
- **会话 DELETE 的软删语义**：hono-crud 已有 `DELETE /sessions/:id`（`sessions.deleted_at` 参与了软删配置）；缺的是前端接线与「级联消息」口径，不是端点。
- **hono-crud 写端点绕过 `repo`**：`routes/crud.ts` 给 sessions/messages/traces 开了 create/update/delete；`PATCH /messages` 能改 parts 真源。这是 AD-3 的具名例外，尚未回写 AD。

### 4.3 我核实后驳回的 lens 结论

- **「`DELETE /sessions/:id` 是硬删」**：`sessions` 有 `deleted_at`，`modelOf()` 会把它配成 softDelete；lens 的「硬删」不成立。实际缺的是前端接线与级联口径。
- **「`GET /traces?limit=5` 静默返回 50 条」**：hono-crud 的 list 用 `page/per_page`，不是 `limit`；本轮已把 AC 改成 `per_page`。原 lens 的现象描述基于旧 AC，不是代码 bug。

## 五、门禁与下一步

1. **Epic 3 收口**：3.2/3.3/3.4 转 `done`；跑 Epic 3 retro（可只记观测支线的取舍）；补 Story 3.1 的 LEARNING 段或明确豁免。
2. **P2 开工门槛**：按 `OQ-5.1-1 → OQ-5.4-4 → OQ-4.1-3/OQ-4.2-5 → OQ-5.2-3` 先拍架构归属，再补该格的详细 AC；每格开工前把 OQ/Deferred 回写到 `epics.md`。
3. **建议先开 4.4**：独立、可见收益、能先把引用解析的现状坑收掉；然后 4.1→4.2→4.3，5.1 等 MinIO 运行时。
4. **不要现在动**：eval/prompt/sandbox/tenant/代码 RAG/PDF/批量队列——`epics.md` 文末与 `AGENTS.md` §五 已列。

## 附录：四镜头原始发现（摘要）

- **Adversarial**：20 条。核心是 v1/v2 AD 混用、PRD 与 epics 的已拍板结论相反、SPINE 契约与 as-built 相反、hono-crud 绕过 AD-3、action items 过期、LEARNING 缺 3.1、Agent loop 无定义、5.2 的 `store` 会改 3.4。
- **Edge-case-hunter**：34 条。核心是 P2 的边界：画像对非 ready/非 UUID、分块重叠、超时；CSV 公式注入/文件名；流式半截表格；原始 HTML 下载安全；ZIP 炸弹/路径穿越/限额；`store` 与 3.4；/chat 契约；三态提示。
- **Structure**：19 条建议 + 3 条 PRESERVE。核心是 epics 的 Requirements Inventory 压在故事前、sprint 注释过长、AGENTS 索引缺权威/历史分组、P2 九格缺统一骨架、依赖轨道、汇总重复、行号引用漂移。
- **Prose**：约 30 条。核心是「节奏/口径」不统一（故事 vs story、噪音 vs 噪声、Build/尖刺、格 vs story）、标题分隔符混用、中英空格、直/弯引号、标签中英混排。

> 本报告只保留可核对的事实与选项；四镜头的完整逐条输出已在 2026-10-24 会话中，本文按影响面压缩。未实测的条目均标「lens 提出，未实测」。
