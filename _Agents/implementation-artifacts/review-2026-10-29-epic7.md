# Epic 7 Code Review — 2026-10-29

- **范围**：Epic 7（7.0 连接、7.1 题集与配置、7.2 发起检索评测、7.3 对照与基线、7.4 答案评测）
- **Diff**：server `efa728f..HEAD` + web `571464e..HEAD`，限定 Epic 7 文件；56 files / +7484 / −114
- **模式**：full；spec = `_Agents/planning-artifacts/epics.md`
- **透镜**：blind hunter / edge case hunter / verification gap / acceptance auditor（三批 = 后端核心、后端支撑与测试、前端）
- **Claims**：7.0–7.4 handoff 原文 + 提交信息

## 结论

- **0 decision-needed（3 条已拍板：D1=A / D2=A / D3=A，全部转 patch）**
- **21 patch**
- **21 defer**
- **28 rejected**

## 应用状态（2026-10-30，全部 patch 已落码）

- P1–P16、P18–P21 已改代码；P17 已补关键契约测试：answer summary 形状、judge-only 模式、rubric 冻结与未知 400、invalidGold、verdictOfScores、nav 组迁移/改名/搬位、ModelsRoute 契约、client eval 请求形状、config EVAL URL 守卫。
- 后端：`tsc` 0；全量 **31 文件 / 177 tests passed**。
- 前端：评测页 + 导航 + client.eval-runs 定向 **57 条通过**；`tsc` 仍剩 12 条来自外部 `client.resource-flow.test.ts` 的错误（并发会话的未完成改动）。
- 前端全量仍有 5 个无关文件（upload-queue / codebases / run-observability / client.resource-flow 等）在并行跑真后端时失败；单独跑 codebases / sidebar 均通过，判定为共享后端并行测试的既有抖动/并发会话干扰，不是本次 patch 路径。
- 未完成：前端全量绿与 build（被外部 tsc/并发测试阻断）、7.4 走读页按新行号重建。
- P17 仍有 3 个低优先测试缺口（SearchOptions 四旋钮真生效、markInterrupted 无条件断言、EvalModeBadge 各状态），已在 defer 批次留痕。

---

## 已拍板的 decision（全部转 patch）

### D1 → A · 答案 run 也应用配置字段
`k / vector_top_k / lexical_top_k / min_similarity / rrf / temperature` 在答案 run 生效：retrieve 工具接受覆盖位（`limit = min(模型 topK, 配置 k)`），`temperature` 传给 `generateText`；`metrics` 仍是自由文本标签（7.2 `OQ-7.2-10` 的记录语义），不作为执行开关，UI 标注「仅记录」。
→ 见 **P19**。

### D2 → A · 负例跳过 judge/citation
答案 run 的负例不调 judge（citation 不适用），只由断言/HITL 判；没有断言且没人判 → unscored。
→ 见 **P20**。

### D3 → A · 现在补「按配置查 run」
加按 `run_config_id` 过滤的运行列表读接口，配置页右栏显示用过该配置的 run；删掉「7.2 接入」过期文案。
→ 见 **P21**。

---

## Patch（18）

### P1 · 答案 `summary` 形状与前端消费者不一致（high）
- 后端 `routes/eval.ts:399-401` / `:507` 直接返回 `summarizeAnswerResults(...)` 扁平对象 `{total, failed, pass, fail, unscored, assertion, judge, human, levels}`；前端 `client.ts` 的 `EvalRunSummary` 要求顶层 `recall/mrr`，answer 数据在 `summary.answer` 下；`evals-page.tsx:409/425/724/1059` 全部读 `summary.answer.*`。
- 实测：answer run 落到前端时 `currentSummary.answer` 为 undefined，走检索 KPI 分支，`pct(undefined)` 渲染 `NaN%`，答案评分行永不出现；服务端与前端测试各自用手写 fixture，全部绿。
- 修：后端在 answer 模式返回 `{recall:0, mrr:0, failed, duration_ms, total, answer: <summary>}`（与既有类型对齐）；在路由测试里断言 answer summary 键集。

### P2 · judge 的 citation 判据与生产引用格式冲突（high）
- 生产 INSTRUCTIONS 要求回答引用时写 chunkId 前 8 位（如 `[aefd870b]`），并明确「不要自己编号」；rubric v1 却要求 `[n]`，judge prompt 片段标签也是 `[n]`。模型按生产格式引用时 judge 看不到对应 id，citation 维度系统性判 0；多次 retrieve 的扁平编号也与 UI 的「按首次出现重排」不一致。
- 修（D2 决定负例规则后一起做）：rubric/prompt 改为「片段用 `[8位chunkId]` 标注，回答引用同一 id」，删掉 `[n]` 语义；补齐 citation 与片段 id 的映射测试。2026-10-30 追加：judge 改纯文本 JSON + zod 校验，不再用 `Output.object`（router1 不支持 json_schema，会刷 responseFormat warning）；router1 与 DeepSeek 均实测可用。

### P3 · gold `content_prefix` 失配仍可算命中（high）
- `runner.ts:159-165` 只把失配数量记进 `missing_gold`，随后 `scoreCase` 仍用原始 `Case.gold` 按 `(data_uri, chunk_index)` 匹配；资源内容变了但块号还在时，会同时出现 `recall=100%` 与 `missing_gold=1`。
- 违反 `OQ-7.2-3`「前缀对不上按未命中算」。
- 修：失配 gold 不参与命中匹配（仍留在分母），并补一条「gold 失配 + 同块号命中 → recall 不涨」的测试。

### P4 · judge verdict 未由三维分推导（medium）
- rubric 写「三维都到 2 才 pass」，`judge.ts` 直接采信模型返回的 `verdict`；1/1/1 + pass 也照收，口径自相矛盾。
- 修：用分数计算 verdict（或校验不一致时以分数为准/记 error），schema 可保留 verdict 但覆盖。

### P5 · 答案汇总把报错算成断言通过、且没有 judge 错误口径（medium）
- `runAnswerCase` 在回答报错时仍对空串评断言：只含 reject 断言的 case 会记 `assertion.passed=true`，`assertion.rate` 把「报错」算成通过。
- `summarizeAnswerResults` 只统计 `judge.error === null` 的 judge，错误条从分母消失，也没有 `judge.errored` 计数。
- 修：回答报错时断言置 null/记错误；summary 增加 judge 错误/未评计数，UI 同步。

### P6 · 切 run 不清详情、请求竞态、人判表单串值（medium）
- `evals-page.tsx:204-210` 切 run 只发请求不清 `detail/summary/mode`；请求失败时旧 run 的结果继续挂在新选中项下。`refreshDetail` 没有请求令牌，晚到的旧响应可覆盖新 run。
- `HumanEditor key={CaseItem.case_key}`（`:907`）在不同 run 复用同一 case_key 时不重挂，会把上一条 run 的分数写进新 run。
- 修：切 run 先清详情；用 request token 忽略过期响应；`key` 改为 `${runId}:${case_key}`；补测试。

### P7 · 导航存档迁移不补分组、出厂改名表不全（medium）
- `use-nav.ts` 的 `mergeMissing` 只补 item，不补 group；旧存档没有 `grp:eval/grp:sys` 时，三个评测页与 `/health`、`/traces` 会落进「观测」组，两个组标题永远不出现。
- `RENAMED_BUILTINS` 只有 `/studio` 的旧名；资源→知识库、自定义组件→组件展板、设计→组件设计、分类观测→系统日志、检索观测→召回观测 都没进表，老存档侧栏与页头不同名。
- `relocateCodebases` 没有任何测试固定。
- 修：按 DEFAULT_NAV 补组 + 扩展改名表 + 补搬位/幂等测试。

### P8 · 配置/题集编辑器默认值与校验（medium）
- `/evals-configs` 新建运行配置取 `Models[0].id`，没用 `/models` 的 `default`（= CHAT_MODEL）；当前项不在清单时下拉显示「未选择」但保存仍写旧值。
- 数字字段 `Number('')=0`、`Number('abc')=NaN`，`JSON.stringify` 把 NaN 变 null，只靠后端 400。
- `LEVELS` 硬编码且 L4 文案「否定」与题集实际（L4 是正例）不符。
- 修：用 default 做初值；前端校验正整数/范围；显示不在册 model；修正 L4 文案（或从后端共享 level 定义）。

### P9 · 「修正题面」在 case 已不在题集时死锁（medium）
- `openFix` 用 `record: null` 同时表示「加载中」和「找不到」；`Found === null` 或请求失败时永远显示「读取题集中…」、保存永久禁用。
- 修：加 `missing/error` 状态，明确提示「这条 case 已不在题集」，允许关闭；请求失败可重试。

### P10 · 重跑 `eval:cases:import` 会清空人工写的断言（medium）
- `cases.ts` 在 spec 未提供 assertions 时不传字段；`upsertCase` 用 `Data.assertions ?? emptyAssertions()`，ON CONFLICT 把已有断言覆盖为空。`eval-cases.json` 没有任何 assertions，这是默认路径。
- 修：upsert 时 `undefined` 表示「保留原值」，显式 `{expect:[],reject:[]}` 才清空。

### P11 · rubric 版本未在配置保存时校验（medium）
- `parseConfig` 只校验 rubric 是 null/字符串；未知版本能存进配置，到 POST /runs 才 400。空字符串/null 又会在 `resolveRubric` 静默默认 v1，用户没选过也被冻进快照。
- 修：保存时校验 rubric 在册（或 null），UI 显示「null = 内置 rubric-v1」；测试覆盖未知版本 400。

### P12 · `EVAL_DATABASE_URL` 缺少安全校验（medium）
- `config.ts` 只 `getEnv(...) ?? null`：不 trim、不校验 URL、不检查是否等于 `DATABASE_URL`；填成主库会静默进隔离模式（两个池打同一库）。
- `eval-db-setup.ts` 不拒绝数据库名为 `postgres`（维护库），会把评测迁移跑进维护库。
- 修：config/assembly 拒绝与主库相同；脚本拒绝 `postgres`；trim + URL 解析。

### P13 · `/models` 被主壳端点 trace 记录（medium）
- `/models` 挂在 `app.use('*', createEndpointTrace(repo))` 之后，`SKIP_PREFIXES` 没有它；每次页面加载都往主库 `traces` 写一行静态目录查询。
- 修：`SKIP_PREFIXES` 加 `/models`（可顺带加 `/eval` 作防御），同步文件头说明。

### P14 · gold 校验抛错会杀掉整个 run（medium）
- `runner.ts` 的 gold 前缀循环在 `try` 之外；`getChunkByDataUri` 一次 DB 抖动会让 `runCase` 抛出，整个 run failed，剩余 case 全部未跑。
- 修：gold 校验单独 try/catch，失败记该 case error，run 继续。

### P15 · 答案 run 的检索阶段会漏出无父 trace 的 Langfuse span（medium）
- `answerCase` 没有 trace/telemetry，但 retrieve 工具通过全局 bridge 取 `createStageSink()`；Langfuse 启用时 sink 恒非空，评测检索会生成孤立 observation，且 `embedTelemetry: 'on'`。
- 修：给 `buildAgentTools` 增加 telemetry 开关（评测传 false），或评测期禁用 bridge sink。

### P16 · 快照看不到 rubric 正文（medium）
- 7.4 已把 rubric 版本 + 正文冻进 `snapshot.rubric`，但 `SnapshotPanel` 仍只显示 `metric_config.config.rubric`（版本名），冻结的正文没有任何出口。
- 修：快照 tab 显示版本 + 正文（可折叠），保持只读。

### P17 · Epic 7 的契约/边界测试缺口（medium）
- 缺：answer summary 键集（P1）、judge-only 模式、rubric 冻结与未知版本 400、answer 引用摊平、`/models` 与 `resolve()` 一致性、SearchOptions 四旋钮真实生效、客户端 eval 请求形状（URL/method/body/204）、`markInterruptedRuns` 的无条件断言、`relocateCodebases`、EvalModeBadge 各状态。
- 修：按上述补测试；优先补会被 P1/P2/P3 修复触及的路径。

### P18 · 直接修正项（low）
- `stepCountIs(5)` 在 chat 与 answer 各写一份 → 共享常量。
- `health.ts` 文件头仍写「EMBEDDING_MODEL 是裸名」 → 改成复合键并指向统一 strip helper。
- `evals-page.timeLabel` 手写 `toLocaleString` → 用 `lib/date.ts` 的 `formatDay`。
- provider 前缀剥离在 `contract.ts` 与 `health.ts` 各一份且无冒号分支不可达 → 抽 `modelIdOf`。

### P19 · 答案 run 应用 run_config 的检索旋钮与 temperature（D1=A）
- `buildAgentTools` 增加可选 search 覆盖；retrieve 工具把覆盖位透传给 `Retriever.search`。
- 答案 run 的 `runAnswerCase` 传入 `{ vectorTopK, lexicalTopK, minSimilarity, rrfK }`；融合条数 `limit = min(模型 topK, 配置 k)`（配置 k 作上限，保留模型少要的自由）。
- `answerCase` 的 `generateText` 接收 `temperature`。
- `metrics` 维持 7.2 的「仅记录」语义，配置页/快照标注；补一条「不同 vectorTopK/minSimilarity 真的改变命中」与「temperature 进到 generateText」的测试。

### P20 · 负例跳过 judge（D2=A）
- `runAnswerCase` 对 `Case.negative` 不调 judge（`judge: null`），只评断言；无断言且无人判 → `unscored`。
- 前端负例题的 judge 列显示「不适用」，summary 的 judge 分母不含负例；补测试。

### P21 · 按配置查 run（D3=A）
- `GET /eval/runs` 增加 `run_config_id` 过滤（repo/SQL 层，避免全表拉取后再筛）；非法 UUID 400。
- 配置页右栏拉取并显示用过该配置的 run（时间/数据集/状态/摘要），空态与错误态；删除「运行功能在 7.2 接入」文案。
- 补后端路由与前端定义测试。

---

## Defer（21）

1. **答案/judge 无 timeout/abort**：单队列可被挂起的 provider 顶死，cancel 无效；项目已有超时项 deferred，单独排 P3 工程项。`eval/answer.ts:25-33`、`judge.ts:49-77`。
2. **`GET /eval/runs` 不分页 + `SELECT *`**：列表带整份 results（含回答与引用正文），随历史线性涨；投影/分页需要先定摘要存储。`repo/eval-run.ts:111-119`。
3. **`baseline_run_id` 无 FK**：7.1 循环 FK 遗留，靠删 run 手动清；单用户接受。`eval-run.ts:173-190`。
4. **schema 卫生**：`eval_cases.level` 无取值约束、`eval_configs` 无 `(kind,name)` 唯一、`freeCopyName` 用 LIKE 未转义。`20261028120000_create_eval_tables.sql`、`repo/eval.ts:335`。
5. **API 建的 case 不校验 gold 存在**：死 gold 到 run 才以 `missing_gold` 暴露；导入路径却强校验。`routes/eval.ts:parseGold`。
6. **评测脚本的边界**：`eval-probe` 的 path 匹配/URI 前缀与导入两把尺、隔离模式仍用主库；`eval-seed` 手工拼依赖、无大小上限、不清理；`eval-db-setup` 之外的守卫见 P12。`scripts/eval-*.ts`。
7. **`EvalAssembly` 用 `container.resolve(EvalPostgresRepo)`、`EvalDbHandle` 可被二次构造、`index.ts` 重复 resolve**：设计清理，不是本格故障。`eval/assembly.ts:35-46`、`adapter/connection/eval-db.ts`、`index.ts:40/66`。
8. **启动清扫跨进程误伤**：`markInterruptedRuns` 无 owner 维度，第二个进程会把别处的 queued/running 标 cancelled；当前单实例。`repo/eval-run.ts:239`。
9. **多模型/复合键与 `sessions.model` 夹带**：`ModelEntry` catch-all、router1 非空断言/env 命名、sessions model 记录，均不在 Epic 7 的 story/AC 内，属另一条工作线。`adapter/model/registry.ts:32`、`provider/registry.ts:51-57`、`schema.ts:60-61`。
10. **`SKIP_PREFIXES` 不加 `/eval` 而是靠挂载顺序**：行为等价，但保证是隐式的；`endpoint.ts:36`、`index.ts:39-45`。
11. **`/eval` 与 `/models` 不进 OpenAPI**：手写路由无文档出口，前端照代码抄契约。
12. **`results.verdict` 与 `final_verdict` 并存**：库里存机器判定、读时再算最终判定；消费方可能混用。
13. **人判不能撤回**：`setHumanResult` 只 merge，没有清空/删除入口，点错只能覆盖。
14. **`eval-cases.json` 没有断言/rubric 示例**：种子导入出的题集天然只能跑检索 run；7.4 的 golden fixture 缺失。
15. **AD-1：`eval/` 直接 import `agent/` 内部文件**（INSTRUCTIONS、tool registry）；AC 要求复用，但落点应是 `agent/` 交出的服务。
16. **run 快照 embedding 只存裸 modelId**：复合键后丢失 provider，未来第二个 embedding provider 时两份快照不可区分。`contract.ts:226-227`、`routes/eval.ts:363`。
17. **`hit_count` 在答案 run 里改成引用数**：与 7.2 的「检索命中数」同名字段两种语义。
18. **检索 summary 口径**：无 `missing_gold` 聚合、正负例 recall 混平均、无 level 拆档；探底 CLI 反而更细。
19. **`config.test.ts` 夹具仍是裸 `CHAT_MODEL/EMBEDDING_MODEL`**：只测 AppConfig 存在性，不测复合键可用性。
20. **`requestJson` 没有默认超时**：评测状态请求挂住时徽标永久「检测中」；全站 timeout 项另排。
21. **题集删除无二次确认**：删数据集一按就没，和运行页两步删除口径不一致；UI 设计项。

---

## Rejected（28）

- `[false]` 采纳基线后不重拉运行列表/详情 —— `loadBase()` 更新 datasets，运行列表的基线徽标与对照都从 `baselineId` 派生，随后 effect 重拉基线；无需额外 refresh。
- `[false]` `SKIP_PREFIXES` 不加 `/eval` 导致评测写主库 trace —— `/eval` 在 trace 中间件之前注册，Hono `use()` 只作用于其后路由；行为正确，仅实现方式与 AC 文本不同（见 defer #10）。
- `[low]` `temperature` 在检索 run 也只记录不生效 —— 7.2 已明确「只记录」，非缺陷；答案 run 的部分见 D1。
- `[low]` `metrics` 配置未被执行 —— 与 D1 同组，按 D1 结论处理。
- `[low]` 7.3 AC 的「默认 tab / 不可比提示」未回写 —— 实现跟的是 OQ-7.3-4 与 7.3-7 拍板；修法是改 spec，按规则不列为代码 finding。文档对账单独记。
- `[low]` 检索 summary 缺 `levels`/`missing_gold` 聚合 —— 7.2 AC 未要求；探底脚本的细分是 CLI 行为。
- `[low]` 负例 recall=1 混进平均 —— 7.2 既有口径，AC 未规定排除；改动会影响已发布的 75.56% 基线，另议。
- `[low]` `hit_count` 语义复用 —— 答案 run 的 UI/类型已按模式分支，没有现场错读；改名会动 7.2 契约。
- `[low]` 题集「复制」产生同义 case —— 复制本来就是模板行为，保存前可改；无自动去重 AC。
- `[low]` 运行页切 run 的 loading 空态闪烁 —— 与 P6 同源，统一在 P6 清详情后处理。
- `[low]` `notice` 横条黏住不自动清 —— 全站已有 notice 通道，另行统一；不影响数据正确性。
- `[low]` 三页各自手写 notice 横条 —— 同上，UI 统一项。
- `[low]` 轮询无退避/后台暂停/真定时器 —— 数据正确性不受影响；1.5s 为已定交互。
- `[low]` tablist 缺 aria-controls/方向键 —— 可及性改进，非本格规则。
- `[low]` 断言输入框无 label —— 同上，测试用 placeholder 已记录。
- `[low]` 共享/隔离徽标同绿色 —— 徽标只表达连通性；模式文字已区分。
- `[low]` `min-w-152` 裸数字 —— 视觉 token 项，不影响功能。
- `[low]` 页面状态不进 URL —— 可分享链接是增强，无 AC。
- `[low]` `errText/FIELD/goldPath/valueText` 重复、单文件过大 —— 重构收益低于改动风险；本轮不做。
- `[low]` 时间格式手写 `toLocaleString` —— 直接修正见 P18。
- `[low]` `EvalModeBadge` 的 title 承载唯一解释 —— 触屏/键盘可及性；文案在徽标可读。
- `[low]` 「修正题面」只在答案模式 —— 7.4 HITL 的入口定义就是答案 run；检索题面错误可在题集页改。
- `[low]` `eval-seed` 每次无条件复制对象 —— 脚本的幂等/清理项，见 defer #6。
- `[low]` 题集覆盖缺身份/多轮/代码库题 —— 题集内容规划，不是 7.4 代码缺陷。
- `[low]` `stepCountIs(5)` 重复 —— 直接修正见 P18。
- `[low]` `Health` 注释过期 —— 直接修正见 P18。
- `[low]` provider strip 死分支 —— 直接修正见 P18。
- `[low]` `markInterruptedRuns` 测试条件式 —— 测试加固见 P17。
