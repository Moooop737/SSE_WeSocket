# Handoff · 2026-10-29 · Epic 7 / Story 7.3 对照与基线

## 本次会话做了什么

1. 收口 `OQ-7.3-3..8` 并写回 `epics.md`；`OQ-7.3-7` 按 Lynx 当天改口径：**不做判法一致性判断、不出黄条，总分直接并排，另给「相同条目」平均**。
2. 后端：`PUT /eval/datasets/:id/baseline`（只接属于该数据集且 `done` 的 run）、`repo.setDatasetBaseline`、`Repo` 契约两处；删 run 清基线沿用 7.2 已有事务。
3. 前端：运行页右栏加「采纳为基线」与两步删除运行；对照 tab 接真（总分并排 + 相同条目平均 + 逐条 recall 两列 + 当前即基线提示）。
4. 测试：后端路由加 1 条基线用例；前端替换 7.3 空态为 5 条定义测试。
5. 真跑、全量测试、走读页、文档记账。

## 关键决策

- **基线只接 `done`**：queued/running/failed/cancelled 一律不可；换基线是显式动作，run 跑完不自动改基线（`OQ-7.3-3`/`OQ-7.3-1`）。
- **对照只摆数字**：不算 diff、不标变好/退化/新增/消失；基线缺的 case 显示 `—`（`OQ-7.3-2`/`OQ-7.3-6`）。
- **`OQ-7.3-7` 改口径（Lynx 2026-10-29）**：删掉「判法不一致」黄条与「分数不可直接比」；总分（两次 run 各自全部 case 的平均 recall/MRR）直接并排，另加「相同条目 · N 条」平均（只算两次 run 都有的 case）作为 apples-to-apples 的数。
- **默认 tab 仍是「详情」**：AC 的「基线默认被钉在对照 tab」解释为进对照后自动选中基线，不抢 tab 切换（`OQ-7.3-4`）。
- **删除入口右栏顶部**：左侧 run 行本身是 button，不在按钮里嵌按钮；两步确认 4 秒装填，运行中隐藏入口，后端仍 409 兜底（`OQ-7.3-8`）。
- **不做乐观更新**：采纳/删除成功后重拉数据集、运行列表与详情。
- **对照多给一行基线身份**（时间 · 运行配置名）：否则两列数字不知道被钉的是哪次 run。

## as-built

### B1 · 后端

- `src/routes/eval.ts`：`PUT /datasets/:id/baseline`，body `{run_id}`；路径/`run_id` 非 UUID 400、数据集或 run 不存在 404、`Run.dataset_id !== Id` 400 `E_EVAL_BASELINE_DATASET`、状态非 `done` 409 `E_EVAL_RUN_NOT_DONE`；返回整只 `{dataset}`（含 `case_count`）。
- `src/adapter/repo/eval.ts`：`setDatasetBaseline` 只更新 `baseline_run_id` / `updated_at`，`RETURNING *` 后补 `case_count`。
- `src/adapter/contract.ts`：`Repo` 接口 + `PostgresRepo` 委托各一行。
- 删 run 清基线沿用 `repo/eval-run.ts` 的 7.2 事务，不新增逻辑。

### B2 · 前端

- `src/api/client.ts`：`setEvalBaseline(DatasetId, RunId)`、`deleteEvalRun(Id)`（204 走 `requestNoContent`）。
- `src/components/evals/evals-page.tsx`：
  - `baselineId` 从数据集行派生；`baseline` 详情自动加载（卸载/切换用 `cancelled` 防回写，失败独立 `baselineFailed`）。
  - 工具条：`canAdopt = done && !isBaseline`、`canDelete = done|failed|cancelled`；两步删除 4 秒收回，切 run 立即解除。
  - `ComparePanel`：四种空态（无基线/当前即基线/读取失败/读取中）；总分两列 + 「相同条目 · N 条」平均（交集）；逐条按当前 run 快照顺序，基线缺的 `—`、错误行标红；`recallCell` 纯函数。
  - 采纳/删除后 `loadBase()` + `refreshRuns()`；删基线 run 时后端已清 `baseline_run_id`。

### B3 · 测试

- `test/eval-runs-route.test.ts` 加 1 条：排队 409 → done 200、不采纳不改基线、跨数据集 400、不存在 404、删基线 run 清空。
- `src/components/evals/evals-page.test.tsx`：无基线空态、总分 + 相同条目 + 缺 case `—`、当前即基线、采纳调用、删除两步确认；13/13。

## 验证（真跑）

- 后端 `npx tsc --noEmit` 0；前端 `npx tsc --noEmit` 0、`npm run build` 绿。
- 前端全量：**85 文件 / 727 tests passed**。
- 后端全量（`--fileParallelism=false`）：首轮 **154/155**，唯一失败为远端 MinIO `AbortError`，单跑 `object-store` **10/10** 通过；第二轮远端 Postgres 断连导致 9 个文件失败，恢复后重跑 **49/49** 通过。属环境抖动（与 7.2 handoff 记录一致）。
- 真跑（`PORT=3100`，隔离库，临时数据集 1 条 case）：
  - 建 run → `done`，`recall 100% / MRR 50%`；
  - `PUT baseline` → **200**，`baseline_run_id` = 该 run；
  - 排队中采纳 → **409 `E_EVAL_RUN_NOT_DONE`**；
  - 跨数据集采纳 → **400 `E_EVAL_BASELINE_DATASET`**；
  - 删基线 run → 204，数据集 `baseline_run_id` = null；
  - 临时数据集/run 已清理（204）。
- 走读页：`walkthroughs/epic7-story3-baseline-compare.html`，validate `sections=9 / code=10 / notes=26 / journeys=6 / style=1/1`；index 24 页。

## 偏离 / 注意

1. **`OQ-7.3-7` 与最初 AC 不同**：原 AC 要求「判法不一致」黄条与「不可直接比」提示，Lynx 当天改为总分直接并排 + 相同条目平均；AC 与 OQ 已同步改写，代码里没有黄条。
2. **对照多一行基线身份**：AC 未写，但两列数字需要知道被钉的是哪条 run；放开给 UI 信息，不影响判定。
3. **基线详情是额外一次 GET**（数据集选中即拉），不是进对照才拉；好处是切 tab 不闪，代价是每次切数据集多一个请求。
4. **删 run 后可能短暂停在旧详情**：`refreshRuns` 选中下一条后由现有 effect 重拉；没有额外 loading 态。
5. **采纳与删 run 的并发窗口未加固**：`baseline_run_id` 无 FK（7.1 定表时的循环 FK 问题），极小概率留下指向已删 run 的基线；对照会显示「读取基线运行失败」，重新采纳即可。单用户下接受。

## 风险 / 待确认

- 浏览器视觉未验（按 AGENTS 归 Lynx）：两列对齐、采纳后基线徽标迁移、当前即基线提示、两步删除、窄屏。
- 对照的「相同条目平均」只由前端单测覆盖（交集、缺 case、百分比）；未在真库上构造两次题集不同的 run 做端到端对照。
- 运行级 `failed` 与基线的关系未变：failed 不可采纳，但可以作为「当前 run」与基线并排（数字照登）。

## 文档入口

- 规格与 as-built：`_Agents/planning-artifacts/epics.md` › Story 7.3
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`（7.3 = review）
- 走读页：`_Agents/walkthroughs/epic7-story3-baseline-compare.html`（index 24 页）
- 前端总结：`app/web/Agent/summary/summary-2026-10-29-eval-baseline-compare.md`
- 延后项：`_Agents/implementation-artifacts/deferred-work.md`（7.2 的运行删除 UI 已由 7.3 解决；gold 前端挑选 → 7.4 / 未排期）
