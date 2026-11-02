# Handoff · 2026-10-29 · Epic 7 / Story 7.4 答案评测

## 本次会话做了什么

1. 收口 `OQ-7.4-1..6`（含中途新增的 run 类型 OQ），写回 `epics.md`；7.4 从 `backlog` 进 `in-progress` → 实现完成转 `review`。
2. B0 spike：judge 结构化输出（DeepSeek Flash 可用、qwen-plus Key 无效）+ 回答链路复用（`generateText` + retrieve 工具，2 步 / 命中 5 / 不写会话）。
3. 后端：两列迁移（`assertions` / `human_results`，两库 applied）；case CRUD/复制/导入带断言；模式推断；答案执行器 + 断言 + judge + 合成 + 聚合；`PUT /eval/runs/:id/human`。
4. 前端：题集页断言编辑（子串/正则）；运行页按模式切换列/详情；人判表单与修正题面；答案 run 的对照（跨模式守卫）。
5. 真跑、全量测试、走读页、文档记账。

## 关键决策（OQ-7.4-1..6）

- **断言**：子串（大小写不敏感）+ 每条可选正则；正则保存时校验可编译。
- **judge 模型**：不设默认、不强制不同源；任意在册模型，null = 不跑。
- **rubric**：配置存版本名，正文住代码；建 run 时版本 + 正文冻进 snapshot。
- **HITL**：人可改机器分或独立打分；可修正错误题面（写回 `eval_cases`，当前快照不变）；机器结果不覆盖。
- **合成**：断言硬门 + 取更严；回答错误直接 fail；judge 错误不伪造分数；无证据 → unscored。
- **run 类型**：不加列，用快照推断（`judge_model` 非空或任一 case 有断言 → answer）。

## as-built

### 后端

- `db/migrations/20261029160000_add_answer_eval_columns.sql`：`eval_cases.assertions`（`{expect,reject}`，条目 `{text,regex}`）与 `eval_runs.human_results`，含 object/array 与断言形状 CHECK；主库与 `ragdb_eval` 均 applied。
- `src/eval/mode.ts`：`inferRunMode`。
- `src/eval/answer.ts`：`generateText` + `INSTRUCTIONS` + `buildAgentTools`；不写 sessions/messages；引用按工具结果顺序扁平化为 `EvalCitation[]`。
- `src/eval/assertions.ts`：`evaluateAssertions`（子串/正则、expect+reject 的 AND）。
- `src/eval/judge.ts`：`RUBRIC_V1` 版本表、`resolveRubric`、`judgeCase`（`Output.object` 三维 0–2 + verdict/reason；失败回 error）。
- `src/eval/metrics.ts`：`finalVerdict`、`summarizeAnswerResults`（断言/judge/人判一致率 + 按 level）。
- `src/eval/runner.ts`：模式分支、`prepareAnswer`（回答/judge 模型、rubric）、`runAnswerCase`。
- `src/eval/snapshot.ts`：judge 配置时冻结 rubric 版本 + 正文。
- `src/routes/eval.ts`：断言校验（≤50 条/组、text ≤200、正则编译）、case CRUD/复制带断言、详情按模式摘要并注入 `final_verdict`、`PUT /eval/runs/:id/human`（answer + done 才接，按 case_key upsert）。
- `src/adapter/repo/eval.ts` / `eval-run.ts` / `contract.ts`：类型、SQL、`setHumanResult`（行锁 + 数组替换）。

### 前端

- `src/api/client.ts`：断言/答案/人判类型、`setEvalHuman`、`fetchEvalRun` 返回 `mode`。
- `src/components/evals/cases-view.tsx`：断言编辑（两组、正则开关、空文字拦截）与只读展示。
- `src/components/evals/evals-page.tsx`：答案聚合四格、pass/fail/未评/人审与按 level 一致率（低标「低」）、答案列、答案详情（回答/引用/断言/judge/人判）、修正题面抽屉、答案对照与跨模式守卫、运行列表模式标签。

### 测试

- 后端：`test/eval-answer-metrics.test.ts`（断言/finalVerdict/聚合）、`test/eval-answer-runner.test.ts`（真 repo + 假模型/失败路径）、`eval-runs-route.test.ts`（人判）、`eval-crud-route.test.ts`（断言）。
- 前端：`cases-view.test.tsx`（断言进 POST）、`evals-page.test.tsx`（答案详情/人判/修正题面/跨模式对照/答案对照）。

## 验证

- `npx tsc --noEmit`：后端/前端均 0 错；`npm run build` 绿。
- 后端全量（串行）：**30 文件 / 166 tests passed**。
- 前端全量：**86 文件 / 735 tests passed**。
- 真跑（隔离库，临时数据集 1 条 case，`PORT=3100`）：
  - run done / mode answer，37s；回答 `0.42`，引用 5；
  - 断言 `expect:0.42`、`reject:不知道` 均满足；
  - judge（DeepSeek Flash）groundedness 2 / correctness 2 / citation 0 → verdict fail（回答未带 `[n]`）；
  - 机器 verdict fail；
  - 人判 pass→fail 覆盖后详情 `final_verdict=fail`，summary 人机一致 1/1、level L1 1/1；
  - 删 run / dataset / 临时 metric config 均 204。
- 迁移：主库与 `ragdb_eval` 均 applied。

## 偏离 / 注意

1. **qwen-plus 结构化输出未验成**：报 `Incorrect API key provided`，是环境 Key 问题；DeepSeek Flash 已实测可用。不设默认 judge 后不影响落地。
2. **答案 run 的检索字段是空壳**：`rank/matched/recall` 记 0/null，`hit_count` 记引用数；聚合必须走 `summarizeAnswerResults`，不能复用检索汇总。
3. **judge prompt 截断**：片段最多 10 条、每条 1000 字；长文档下需要再评估。
4. **跨模式对照只拦不并排**：基线是检索 run、当前是答案 run 时提示，不摆两列。
5. **人判读取时重算**：`final_verdict` 由详情接口注入，不写回 results；人判保存后前端重拉详情。

## 风险 / 待确认

- 浏览器视觉未验（归 Lynx）：答案详情、人判表单、修正题面、对照模式分支、窄屏。
- 多 case 的答案 run 与同数据集混跑检索/答案 run 的浏览器对照未做端到端。
- judge 只验证了 DeepSeek Flash；换 qwen-plus / Ollama 系需补 spike。
- 模式推断每次读都扫一遍快照 cases，规模小可接受；case 数量大时再考虑缓存。

## 文档入口

- 规格与 as-built：`_Agents/planning-artifacts/epics.md` › Story 7.4
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`（7.4 = review）
- 走读页：`_Agents/walkthroughs/epic7-story4-answer-eval.html`（index 25 页）
- 前端总结：`app/web/Agent/summary/summary-2026-10-29-eval-answer-review.md`
- 延后项：`_Agents/implementation-artifacts/deferred-work.md`（7.4 批次）
- 学习日志：`LEARNING.md` › 2026-10-29 · Story 7.4 答案评测
