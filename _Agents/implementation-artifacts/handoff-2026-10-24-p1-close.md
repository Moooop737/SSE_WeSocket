# Handoff · 2026-10-24 · P1 收口与文档交接

## 本次会话做了什么

1. **P1 状态收口**：Epic 1 / 2 / 3 全部 `done`；`sprint-status.yaml`、PRD §7、`epics.md` Overview、`AGENTS.md` §五 同步为「P1 已收口」。
2. **文档集评审/整理**：PRD + addendum、epics、SPINE、deferred、frontend-deferred、LEARNING、AGENTS、handoff、walkthroughs；四镜头（adversarial / edge-case / structure / prose）+ 本轮 code review。
3. **Epic 3 四镜头 code review 并收口**：3.2/3.3/3.4 只 review 不修，findings 落 `review-2026-10-24-epic3.md`；3.2/3.3/3.4 与 Epic 3 标 `done`。
4. **deferred 按去向重排**：`deferred-work.md` 顶部新增「去向索引」，把条目分到 P2 4.4 / P2 跨格 / P3 主线 / P3 工程项 / P3 观测硬化 / 跨阶段测试 / 跨阶段 API / 跨阶段文档 / P4-P5-未排期 / 已解决。规则写进 `AGENTS.md` §二「Deferred 去向」。
5. **文件整理**：新增 `_Agents/README.md` 目录地图；历史 epics 评审移到 `_Agents/legacy/reviews/review-2026-10-13-epics-lenses.md`；更新 `_Agents/legacy/README.md` 与评审报告引用。
6. **代码提交核对**：`app/server` 最新 `0eb374a p1`、`app/web` 最新 `66cfe4d p1`；两侧工作区干净。

## 关键决策 / 规则

- **P1 结束口径** = Epic 1 + Epic 2 + Epic 3（P1.x 观测支线）全部 `done`；P2 全部 `backlog`。
- **Epic 3 按已知问题收口**：3 条范围/口径、20 条代码/契约/前端问题、7 条验证缺口；按 Lynx「仅 review」不修代码。
- **观测面板范围按 as-built 收窄**：原 Epic 3 写「不做产品内观测面板」，实际已有 `/traces`、`/chats`、`run-observability`；文档改为「不引入 Grafana/Prometheus、不做远程面板」。正式 correct-course 未走。
- **`kbtrace` 未建**：Epic 3 实际只有 `llmtrace/` + `systemtrace/`，文档已改为两只盒；3.3 标题保留 kbtrace 作旧代号。
- **deferred 新规**：每条必须有去向（Story / P 阶段 / 另立 Epic / 未排期 / 不做）；`deferred-work.md` 顶部索引是唯一入口，批次正文只放证据；story 开工先读本格名下条目，P 阶段收口做全量对账。
- **P2 不改主链路**：Epic 4 只做结构化输出/渲染；Epic 5 只做文件管理；eval/prompt/sandbox/tenant/代码 RAG/PDF/批量队列都不进 P2。

## 验证

- `sprint-status.yaml` 用 Ruby YAML 解析通过；`epics.md` 5 Epic / 23 Story / 30 个 P2 OQ；`git diff --check` 干净。
- Epic 3 review 层核实：`app/server` 与 `app/web` `tsc --noEmit` 0 错；后端 31/31；前端新增 29 条通过。**本次未改代码**，这些是 review 时的现状证据。
- 代码工作区：`app/server` / `app/web` 均干净；外层文档改动未提交。
- 未跑：P1 级 retro、Epic 3 retro（Lynx 决定跳过）、`/traces` 阶段面板浏览器手测、stage/流内错误路径真跑。

## 未决 / 注意

- **P2 开工前先拍**：`OQ-5.1-1` ObjectStore 是否进 `adapter/`（AD-2 第六类）；`OQ-5.4-4` `codebases` 领域归属；`OQ-4.1-3`/`OQ-4.2-5` 画像存储与能力位；`OQ-5.2-3` `store` 段是否独立（会影响 3.4 的 5 段 AC）；`OQ-5.1-2` 本机 MinIO 怎么起。
- **Epic 3 未修 findings**：`dimension_check` 查询在 stage 外、`resource_id` 回填晚、stage 时间字段前端有后端无、running trace 无清扫、取消记成 `E_STAGE`、Langfuse Map 泄漏、`traces` 写端点未收、7 条测试缺口。完整清单见 `review-2026-10-24-epic3.md`；去向已分到 `deferred-work.md` 的 P2 4.4 / P3 观测硬化 / 跨阶段测试。
- **外层文档未提交**：本轮 AGENTS / PRD / epics / SPINE / deferred / README / review / handoff 改动都在工作区。待提交清单：`AGENTS.md`、`LEARNING.md`、`_Agents/README.md`、`_Agents/planning-artifacts/{epics.md,prds/...,architecture/...}`、`_Agents/implementation-artifacts/{sprint-status.yaml,deferred-work.md,frontend-deferred.md,review-*.md,handoff-*.md}`、`_Agents/legacy/` 与 `walkthroughs/` 的新增/移动项。提交时按文件挑，不要把 `.DS_Store` 和临时产物带上。
- **3.1 的 LEARNING 段仍未补**；`deferred-work.md` 已记。
- **Epic 1 retro 仍有 7 条 open**：`retro-6`（app/ 是否进外层 git）、`retro-7`（断言守护）、`retro-11`（story 工件）仍有效。

## 涉及文件

- 目录/协作：`AGENTS.md`、`_Agents/README.md`、`_Agents/legacy/README.md`
- 规划：`_Agents/planning-artifacts/epics.md`、`prds/prd-dev-2026-10-09/{prd,addendum}.md`、`architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`
- 状态/记账：`_Agents/implementation-artifacts/{sprint-status.yaml,deferred-work.md,frontend-deferred.md}`
- 评审：`_Agents/implementation-artifacts/review-2026-10-24-docs.md`、`review-2026-10-24-epic3.md`
- 归档：`_Agents/legacy/reviews/review-2026-10-13-epics-lenses.md`

## 下一步（P2 开工清单）

1. **先拍架构归属**：`OQ-5.1-1` → `OQ-5.4-4` → `OQ-4.1-3`/`OQ-4.2-5` → `OQ-5.2-3`；一次一条，拍完回写 `epics.md`。
2. **定 MinIO 运行时**：`OQ-5.1-2`（当前 shell 无 docker/minio），否则 5.x 无法验收。
3. **选第一格**：建议 4.4（独立、可见收益）或 4.1（纯数据层）；开工前补详细 AC + 收口本格 OQ/Deferred。
4. **spike**：4.4 的 citation 自定义节点穿过 react-markdown；4.2 的 DeepSeek `Output.object` 失败形态。
5. **读 deferred 去向索引**：4.4 开工先看「P2 · 4.4」行；Epic 5 开工看 P3 工程项/未排期里与存储相关的条目。
6. **不要现在动**：eval/prompt/sandbox/tenant/代码图/代码 RAG/PDF/批量队列。
