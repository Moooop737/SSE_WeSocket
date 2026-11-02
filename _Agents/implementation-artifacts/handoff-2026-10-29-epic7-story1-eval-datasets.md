# Handoff · 2026-10-29 · Epic 7 / Story 7.1 题集与配置底座

## 本次会话做了什么

1. 收口 `OQ-7.1-1..4`（已在前一日拍板）+ 新增 `OQ-7.1-5`（runs 表归属）：7.1 建 `eval_runs` 最小骨架，7.2 同表 ALTER。开工清单写回 `epics.md`，sprint 7.1 进 `ready-for-dev`。
2. 迁移：`db/migrations/20261028120000_create_eval_tables.sql`，四张表 + 约束/索引；主库与 `ragdb_eval` 各跑一次（均 17 applied）。
3. 后端：`repo/eval.ts`、`Repo` 的 eval 段、`/eval` 自定义路由（datasets / cases / configs + copy）、校验与错误码；`eval:cases:import` 种子导入。
4. 前端：`cases-view` / `configs-view` 接真接口；`eval-mode-badge` 抽公共件；`evals-page` 收缩为运行视图；`evals-store` 收成只存 runs。
5. 验收：真跑隔离模式（15 题集 / 18 gold / 增删改复制 / 409 / 400）；共享模式导入验一次后删主库副本；全量测试与 build。
6. 走读页：`epic7-story1-eval-datasets.html`；index 20 页。sprint 7.1 → `review`。

## 关键决策（会话中拍板 / 实施中定下）

- **配置合并成一张表**（Lynx 2026-10-28 原话「evalconfig 就直接是 jsonb 就行了和 metric 放一个表里」）：`eval_configs(id, kind, name, config jsonb)`，kind ∈ `run|metric`；配置体 snake_case：
  - run：`{ model, k, temperature, rrf, vector_top_k, lexical_top_k, min_similarity }`
  - metric：`{ judge_model, rubric, metrics }`
  - DB 只保 kind 合法 / name 非空 / config 是对象；数值与模型在册由 `parseConfig` 校验。
- **runs 骨架**（`OQ-7.1-5`）：`id / dataset_id / status / created_at`；`dataset_id` FK `ON DELETE RESTRICT` 作为删除保护的最后一道闸；路由先 `countRunsOfDataset` 再删，409 带 `runs` 数。
- **baseline_run_id 不加外键**：`eval_datasets ↔ eval_runs` 循环 FK 让 drizzle 生成 schema 出现 TS7022/7024（运行期可跑，tsc 不过）。列保留为可空 uuid，7.3 采纳基线时校验归属。
- **gold 为块级**：`[{ data_uri, chunk_index, content_prefix }]`；`content_prefix = 块正文 trim 后前 80 字`。
- **导入跟随选中库**：`eval:cases:import` 经 `EvalAssembly.repo`，路径在目标库解析（隔离库 `data_uri` 带 `eval/<hash>/` 前缀）；路径命中 0 或多于 1 条即该条失败，不猜。
- **题集复制**：后端单事务深拷贝全部 case，名字自动找空位（副本 / 副本 2）；**case 复制**只是前端模板开新建表单，不发请求。
- **API 不进 hono-crud**：eval 表住选中的库，hono-crud 的 orm 固定主库；全部走 `/eval` 下 plain Hono。
- **前端范围**：只接 `/evals-cases` 与 `/evals-configs`；`/evals` 运行视图继续 mock（7.2/7.3）。model / judge_model 下拉读 `/models`。

## as-built（按步）

### 1 · 迁移与 schema

- 迁移文件见上；四表约束：datasets.name 唯一非空；cases `(dataset_id, case_key)` 唯一、query/level/case_key 非空、gold 数组、负例空 gold；configs kind/name/config 约束；runs status 五态。
- `drizzle.config.ts` tablesFilter 与 `scripts/db-schema.mjs` 白名单/表头加入四表；`npm run db:schema` 重新生成 `schema.ts`。
- **修了一个上游坑**：drizzle-kit 把 `text` 的空串默认值 introspect 成 `default(')`（未闭合）；在 db-schema.mjs 加归一化 + 断言。

### 2 · repo（`src/adapter/repo/eval.ts`）

- 数据集：list（带 case_count）/ get / create / update / countRuns / delete / duplicate（事务深拷贝 + freeCopyName）。
- case：list / get / create（自动 key `Lx-Nn`）/ update / delete / nextCaseKey / upsertCase（`ON CONFLICT (dataset_id, case_key)`）。
- 配置：list(kind) / get / create / update / delete / duplicate。
- `Repo` 接口新增 eval 段；`PostgresRepo` 委托；`EvalPostgresRepo` 自动继承。
- 资源/case 辅助：`listResourcesByUriSuffix`（ready、未删、`data_uri LIKE '%/suffix'`）、`getChunkByIndex`（未删块）。

### 3 · 路由（`src/routes/eval.ts`）

- `GET/POST /eval/datasets`、`PATCH/DELETE /eval/datasets/:id`、`POST /eval/datasets/:id/copy`。
- `GET/POST /eval/datasets/:id/cases`、`PATCH/DELETE /eval/cases/:id`。
- `GET /eval/configs?kind=`、`POST /eval/configs`、`PATCH/DELETE /eval/configs/:id`、`POST /eval/configs/:id/copy`。
- 校验：gold 三键形状、负例空 gold、case_key 不可改、配置未知/缺键、run 数值范围、model/judge_model 在册；唯一冲突 23505 → 409（case 用 `E_EVAL_CASE_KEY`，其余 `E_EVAL_NAME_TAKEN`）。
- 7.0 的 `/status` 与 `/retrieve` 不动；新增路由在 trace 壳之后。

### 4 · 题集与导入

- `scripts/eval-cases.json`：15 条全部补到 chunk 级（逐条按答案关键词核对：0.42 / match_disjunction / stepCountIs / 去重门 / 阈值 / 租户 / PDF…）。
- `src/eval/cases.ts`：`importCases` + `resolveGold`；单条失败不中止，最后 failed>0 退出 1。
- `scripts/eval-cases-import.ts` + `npm run eval:cases:import`。

### 5 · 前端

- `api/client.ts`：`EvalGold / EvalDataset / EvalCase / EvalConfig / EvalConfigKind` + 14 个函数。
- `eval-mode-badge.tsx`：徽标自取 `/eval/status`，三页共用；`evals-page` 内联实现删除。
- `cases-view.tsx`：真数据集 / case 表 / 定义；写后重拉；409 文案原样显示；复制 case 模板；gold 显示 `尾部路径 #块号` + 前缀。
- `configs-view.tsx`：两组 kind、`/models` 下拉、snake_case 配置体、后端 400 文案上屏、右栏用量空态。
- `evals-page.tsx` 收缩为运行视图（mock runs）；`evals-store.ts` 只存 runs/runCases/baseline。

## 验证（真跑）

- 迁移：主库 + `ragdb_eval` 均 17 applied；两库四表约束/索引逐项一致。
- 约束探针（保存点事务回滚）：空名 / 负例带 gold / kind 非法 / config 非对象 / 带 run 删数据集 / 重复 case_key 全部被拒；无残留行。
- `npm run eval:cases:import`（隔离库）：`upserted=15 failed=0`，18 gold、3 负例；共享模式再导一次验 `data_uri` 不带 `eval/` 前缀，随后删除主库副本。
- 接口真跑（PORT=3101，隔离模式）：status 45 ready；datasets 1 条 case_count 15；cases 15 条 18 gold；configs 空；建数据集/建 case/建配置/复制/删除全通；空名 400、坏 model 400、重复删除 404。
- 测试：后端 **24 文件 / 135 tests**；前端 **675 tests（674 通过；1 条 /ask 守卫因并发会话改 ask.tsx 暂红）**；`npx tsc --noEmit` 0；`npm run build` 绿。
- 走读页：`walkthroughs/epic7-story1-eval-datasets.html`，validate `sections=16 / code=14 / notes=35 / journeys=4 / style=1/1`；index 20 页 / 259 code / 900 notes / 176 journey。

## Review 修复（2026-10-29，双镜头审查后）

审查结论：无 blocker；按真问题修了以下几条，并加了回归测试。

**后端**
1. `listResourcesByUriSuffix` 不再用 `LIKE`（`_`/`%` 会被当通配符，实测能把 `prd_7a87a934.md` 错绑到 `prd-7a87a934.md`）；改为 `right(data_uri, length($1)+1) = '/' || $1`；导入测试加下划线路径用例，期望「命中 0」。
2. API 写入的 gold 统一归一化：`data_uri` trim、`content_prefix` trim 后截 80 字（与导入口径一致）；路由测试加 120 字带空格前缀，断言存成 80 字。
3. 运行配置数值加上界：`k / rrf / vector_top_k / lexical_top_k` 为 1..1000 整数、`temperature` 0..2；测试加 `k=1001 → 400`。
4. 删数据集的 TOCTOU：count 与 delete 之间插入 run 会被 FK 拒绝（23503），现在 catch 后重新计数并回 409，而不是 500。

**前端**
5. 切数据集时先清空 cases/选中项（拉取失败也清空），避免把旧数据集的 case 当新数据编辑。
6. 配置页刷新改 `Promise.allSettled`：一组失败不拖累另一组展示，同时提示「读取配置失败」。
7. 编辑 case 的 PATCH 不再回写整份 gold（只带 level/query/negative/note；翻成负例时才带 `gold: []`），避免覆盖导入后的新 gold。
8. 正例且 gold 为空时文案改为「还没标 gold（该 case 暂时无法评分）」，不再冒充负例。
9. 数据集/配置的复制与删除加 busy 守卫（重复点击不再产生两份副本或第二次 404 提示）。
10. `/evals` 页头加「演示数据 · 7.2 接真」标识；并去掉卸载时的 timer 清理，mock run 在切页后仍会完成，不会永远卡在 running。

**驳回的审查建议**（记录理由）
- 配置 `(kind, name)` 加唯一：配置按 id 引用，重名允许；复制自动找空位只是 UI 体面。
- 导入按 spec 删除多余 case：会误删 UI 手工新建的 case；导入保持 upsert-only，失败条目靠 `failed` 计数暴露。
- GET 加超时：全仓 client 的既有约定，不在本格单独改。

**测试**：前端 evals 16 条（新增 5 条：编辑不回写 gold、切数据集清空、metric 创建体、单组失败降级、运行页只打 status）；后端 135 条（新增断言在下划线路径 / gold 归一化 / 配置上界）。

## 偏离 / 注意

1. **配置表合并**：原 AC 的四表（含 eval_run_configs / eval_metric_configs）改为三表 + runs 骨架；epics AC 与开工清单已同步。
2. **baseline FK 取消**：见上；epics `OQ-7.1-5` 已改。
3. **主库那份题集副本已删**：共享模式只需在切过去时再导一次（`EVAL_DATABASE_URL= npm run eval:cases:import`）。
4. **前端构建期间另一会话在改 session-list**：一度让 tsc/测试红；收口时已自行恢复，最终全绿。
5. **运行页仍 mock**：`/evals` 的数据集/配置下拉读 `evals-demo` 常量，与真库可能不一致；7.2 一并替换。

## 风险 / 待确认

- 浏览器视觉未验（按 AGENTS 归 Lynx）：三栏、窄屏、编辑器、模型下拉、409 文案。
- 配置删除没有 run 用量保护（7.2 有真 run 后再加）。
- gold 的 7.2 失效校验（`content_prefix`）尚未实现，只存了指纹。
- 走读页行号会随 7.2 改动漂移；届时同一次改动里重生成。

## 文档入口

- 规格：`_Agents/planning-artifacts/epics.md` › Story 7.1（含 as-built）
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`（7.1 = review）
- 走读页：`_Agents/walkthroughs/epic7-story1-eval-datasets.html`
- 前端总结：`app/web/Agent/summary/summary-2026-10-29-eval-cases-configs-real-api.md`
