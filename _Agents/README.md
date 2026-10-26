# _Agents/ 目录地图

> 最后核对：2026-10-24。**P1 已收口**（Epic 1–3 全 `done`），P2（Epic 4/5）未开工；代码已提交，文档以工作区为准。
> 新会话的阅读顺序：`AGENTS.md` → 本文件 → `implementation-artifacts/sprint-status.yaml` → 最新 `handoff-*.md` → `planning-artifacts/epics.md` → `implementation-artifacts/deferred-work.md` 的去向索引。

## 一、权威源（改之前先看这里）

| 目录 / 文件 | 放什么 |
|---|---|
| `planning-artifacts/prds/prd-dev-2026-10-09/` | PRD（P1 范围 + P1–P5 路线图）、addendum（技术选型 / 格式 backlog / 阶段映射）、`.memlog.md`、评审 rubric |
| `planning-artifacts/architecture/architecture-dev-2026-10-15/` | 现行架构脊（AD-1…AD-11）、`.memlog.md`、`reviews/` |
| `planning-artifacts/epics.md` | Epic / Story 计划；P2 的 `OQ-4.x-n` / `OQ-5.x-n` 在这里 |
| `planning-artifacts/specs/` | 少数专题 spec（代码图 / 文档代码图），不是每个 story 都有 |
| `implementation-artifacts/sprint-status.yaml` | story 状态 + Epic 1 retro 的 action items |
| `implementation-artifacts/deferred-work.md` | 延后项；**先看顶部「去向索引」**，批次正文只放证据 |
| `AGENTS.md` | 协作规则、代码风格、范围红线、文档索引 |

## 二、过程 / 交接

| 目录 / 文件 | 放什么 |
|---|---|
| `implementation-artifacts/handoff-*.md` | 按会话的交接；最新是 `handoff-2026-10-24-p1-close.md` |
| `implementation-artifacts/review-2026-10-24-docs.md` | 2026-10-24 文档集评审（P2 重点） |
| `implementation-artifacts/review-2026-10-24-epic3.md` | Epic 3 四镜头 code review（收口依据） |
| `implementation-artifacts/review-2026-10-21-epic2-findings.json` | Epic 2 review 原始 48 条（仍被 deferred 引用） |
| `implementation-artifacts/spec-2-6-retrieve-as-tool.md` | Story 2.6 的实现 spec（已交付，仍作证据） |
| `implementation-artifacts/trace-coupling-explainer.html` | trace 耦合的一次性解释页（不是 story 走读页） |
| `implementation-artifacts/frontend-deferred.md` | 前端 open 项 + 已拍过的决策记录 |
| `walkthroughs/` | 每个 story 收口的 HTML 走读页（每页含一张 archify 交互图 iframe，可点节点看语义护照）；主入口 `walkthroughs/index.html`；`.runs/` 是生成记录；交互版在 `walkthroughs/diagrams/`，生成源在 `.archify/` |
| `app/web/Agent/summary/` | 前端当前轮总结；历史轮在 `app/web/Agent/legacy/summary/` |
| `LEARNING.md` | 按 story / 轮次的学习沉淀 |

## 三、历史 / 参考（不再改，只作证据）

| 目录 | 放什么 |
|---|---|
| `legacy/handoffs/` | 2026-10-12 ~ 10-15 的旧交接 |
| `legacy/reviews/` | 2026-10-13 / 10-14 的 code review、前端 review、epics 文档评审 |
| `legacy/specs/` | 已落地的基础层迁移 spec |
| `legacy/architecture/architecture-dev-2026-10-09/` | 第一版架构脊（v1；AD 编号与 v2 不同号同义） |
| `brainstorming/` | 2026-10-15 的 Web UX 头脑风暴 |
| `dependency-graph/` | 代码依赖图生成器与 2026-10-23 的产物 |

## 四、当前状态（交接用）

- **P1**：Epic 1（4 story）、Epic 2（6 story）、Epic 3（4 story，P1.x 观测支线）全部 `done`。
- **P2**：Epic 4（画像 / 渲染）与 Epic 5（文件 / 存储）共 9 格，全部 `backlog`；30 个 OQ 待拍。
- **代码**：`app/server` 最新 `0eb374a p1`、`app/web` 最新 `66cfe4d p1`；两侧工作区干净。
- **Epic 3 已知问题**：收口时未修，清单在 `review-2026-10-24-epic3.md` 与 `deferred-work.md` 的「P3 · 观测硬化」行。
- **文档**：本轮改动尚未提交到外层 git；提交前先看 `git status`，别把 `.DS_Store` / 临时产物带进去。
- **下一步**：先拍 P2 的架构归属 OQ（`OQ-5.1-1` → `OQ-5.4-4` → `OQ-4.1-3`/`OQ-4.2-5` → `OQ-5.2-3`），再开 4.4 或 4.1。

## 五、一条规则

改文档时先确认它属于哪一类：**权威源**（改了会影响实现/验收）、**过程记录**（只追加，不改历史结论）、**历史归档**（不再维护）。拿不准就看 `AGENTS.md` §六 与 `legacy/README.md`。
