# Frontend Deferred — Knowledge Copilot

> `app/web` 有意**推迟的功能项**清单。与 `_Agents/legacy/reviews/review-2026-10-13-frontend-geist-console.md` 不重叠——那份记的是视觉/一致性/动画问题，这份只记"后端已就绪、前端没接"。
>
> **2026-10-24 整理**：本文件前半是仍 open 的项，后半（2026-10-15 UX 轮起）是「拍过之后放下」的决策记录，不是待办；新会话只看「什么时候必须回来做」与文末的 P2 相关项。
> 一条一项：缺口在哪、后端到什么程度、什么证据能定论。

## Story 1.4 知识库查看与删除 —— 界面动作 **已全部接上（2026-10-14）**

下面四条纯前端项在 2026-10-14 的界面轮里逐条闭合（落点与本轮 review 见 `_Agents/legacy/reviews/review-2026-10-14-frontend-layout-hci.md`）：

- ✅ `api.ts` 现在有 `deleteResource`（204 无 body 走 `requestNoContent`）与 `abortIngest`（202/409）。
- ✅ 删除按钮在 `resource-list.tsx` 行尾常驻（不是 hover 才出），ready / failed 两态都有；破坏性动作走**就地二次确认**（3s 自动收回、至多一行处于 armed），列表与抽屉两个入口都要两步。
- ✅ processing 行的「取消入库」按钮在行尾与抽屉页脚两处，`/abort` 可达。
- ✅ 轮询落在 `src/use-resources.ts`（概览页与资源页共用一份口径，避免"文案说在轮、代码没轮"）：只在列表存在 processing 行时挂 3s 定时器，silent 路径不重画骨架；`onMutated()/removeLocal()` 置代次，早于本地变更的在飞响应落地即丢弃（否则刚删那行会被轮询放回列表）。
  - 定论证据（**由 Lynx 自己在浏览器验**）：起后端 + `npm run dev` → 提交一个真 URL → 肉眼看到「处理中」→ 点「取消」→ 数秒内该行自己变「失败 · 入库取消」→ 点「删除」→ 二次确认 → 行消失且 `GET /resources` 不再返回它。
  - 本轮 agent 侧只验到"确认条出现 / 收回后行数不变"，**没有真删真取消**（不动用户的库）。

## 记一笔防止被重复当成待办

- `warning` 已经渲染了：`ui/components/ingest-panel/ingest-panel.tsx:54-58`，非干净成功时还保留输入不清空。story 1.2 那条"warning 上不了界面"的遗留**已闭合**。
- `GET /resources/:id/chunks` 对已软删资源返回 `200 {chunks:[]}` 而 DELETE 对同一条返回 404（后端口径不一致，非前端项）；界面上点不到已删行，所以暂缓无感。**2026-10-14 复核**：`resources.ts` 现在先 `getResource(id)` 取不到即 404，这条备注可能已过时，按 `getResource` 是否过滤 `deleted_at` 复查后再改。

## 什么时候必须回来做

- ~~**会话列表 / 多轮**：`api/sessions.ts` 仍是内存 store，等 `sessions/messages` 端点（Story 2.5）~~ — **2026-10-21 已接**：`/chat` 收 `{query, sessionId}`，前端切会话读 `GET /sessions/:id/messages`。注意口径仍有效：**会话所有权在客户端**，别在业务 SQL 里加 owner 谓词。
- **入库面板文件选择无大小上限**：`File.text()` 没有 try/catch（选到几百 MB 的 txt 会冻住标签页）。URL 侧已有闸门（一行一条、非 http(s) 整批不发、一次最多 20 条、有停止按钮），文件侧仍未做。

## 2026-10-15 · UX 轮（视效档 / 头像 / 侧栏 / 入库队列）三透镜 + bmad review 后明确不做的

不是漏网，是拍过之后放下的（理由与证据在 `app/web/Agent/legacy/summary/summary-2026-10-15-motion-tier-avatar-nav-ingest.md` ⑥）：

- ~~**Alert 的 live region 随消息一起挂载**~~ —— **已做**（同日 bmad review 第 3 轮建 `NoticeLive` 常驻容器；第 4 轮又按"属性不能随消息翻"拆成 status/polite + alert/assertive 两只常驻区域）。
- ~~**侧栏/概览那些 `role="status"` 的说明行仍随内容一起挂载**~~ —— **已做**（第 5 轮先改掉 `ask` 的「正在检索」与两处「复制」反馈；第 6 轮 P5 把剩下的侧栏 3 行 / 概览 1 行 / 组合器 1 行全部改成常驻槽 + 只换文案，不播时整只 `sr-only` 不占版面）。并加了一条 `repo-guard` 文本规则防回退：**不许把 `role=status/alert` 或 `aria-live` 包在条件渲染里**（全仓 0 处）。
- **头像色族与状态色共用同一批 token**（`moss=success`、`plum=danger`）：仓库里饱和度够的只有那五套。解法是为身份色单开一档品牌色进 `@theme` —— 那是配色决定，归 Lynx。
- **move / resize 没有一步撤销**：概览面板与侧栏两个自定义界面都只有"可撤销所以不问 + 不可撤销才两步确认"，撤销本身没有。
- ~~**`theme.ts` 仍把写失败吞了**~~ —— **已做**（第 3 轮补 `useThemePersistFailed()`；第 4 轮又补了「写不进存储时读侧回落内存值」这条同源缺陷，四只本机 store 口径现在一致）。
- **两个标签页同时编辑 `kc-nav` / `kc-dashboard` 会丢更新**（第 4 轮 adversarial）：`commit` 是整数组快照写，跨标签页只 pull 不 merge，两次写各自基于自己那份 state。要修得给存档加 `rev` 或改增量写，四只 store 一起动 —— 不是一处补丁。
- **别的站点/标签页吃满浏览器 WebGL 配额时，库在未 await 的 async effect 里 `throw`**（第 4 轮 adversarial）：Chrome 那 ~16 个是**同进程跨标签页**算的，本方 4/6 的闸管不到别人。形态是每个受影响实例一条 `Uncaught (in promise)` + 光静默退化成平涂。要治得在 acquire 被拒时清 `webGlSupport` 缓存并复探，属基础设施级重试逻辑。
- **WebGL `granted` 分支的渲染层测试**：jsdom 里库拿不到真 GL（`createProgram` 直接抛，还带出未处理拒绝），所以名额闸与 context 归还**只能用文本守卫钉**（`repo-guard` 的「WebGL 名额闸的接线」三条 + `shader-backdrop.test.tsx` 的直接 acquire/release 配对），画面正确性归浏览器实测。要真在测试里跑库，得写一只够用的 WebGL2 假实现 —— 不值当。
- **亮档骨架高光与自家底色只差 13/255**（低于 `index.css` 为装饰色写的 ≥20 判据）：改值要整批 `glow-*` / `-soft` 一起复算，不顺手改一处。
- **`Rate × factor` 相乘**：尽情+慢 与 克制+常 画出来一样快。已作为设计交点写进 `motion.ts` 注释，界面上没说。
- **画廊页 `components.tsx` 仍是 600+ 行单文件**，本轮又加了效果选择器与色族样例。
- **canvas 晚于"归还"到达的竞态**（第 5 轮 edge-case）：库的 `initShader` 先 `await processUniforms` 才 new ShaderMount，所以 canvas 比本组件的 effect 晚一个微任务出现。若名额在这之前被换掉 / 组件被卸载，`releaseWebGl(null)` 只减了计数、真实 context 没人还（观察器已断开，没人再抓它）。反复之后 `getContext` 会被打成 null ⇒ 全站 shader 静默退化成平涂。要治得在文档层挂一只跨卸载存活的观察器，比这条 bug 本身更重 ⇒ 记在这里。**判据缺口**：`webGlInUse` 与"真实存活 context 数"今天没有一个一致的观测点。
- **`aria-disabled` 的边界按钮悬不出提示**（第 5 轮 adversarial 的非生产项）：`aria-disabled:pointer-events-none` 收掉了 hover，于是 `title`（"下移"）也不再弹 ⇒ 鼠标用户看不出"为什么点不动"，只看到淡 40%。键盘用户有 `aria-disabled` 播报。要不要补一个"到边了"的说法，归 Lynx。
- **「下移一条会改掉被挤出去那条的组归属」与概览的「宽度随条目走」是两套语义**（第 5 轮 adversarial 的非生产项）：侧栏 `shift` 让 `section` 跟着**位置**走（为了同组连续），概览 `move` 让 `span` 跟着**条目**走（宽度是卡自己的属性）。两者都对，但同一个"移动"动词在两个界面各自携带不同的副作用 —— 下一轮若有人要"统一心智"，先想清楚要统一的是哪一个，别顺手把 `section` 改成随条目走（那会立刻退回第 3 轮那个双标题 bug）。

## 2026-10-20 · Story 2.6 工具化后的 /chat 契约 —— 已闭合

- ✅ `/chat` 请求体只发 `{query}`；`limit` 已删（`api/chat.ts:24`）。
- ✅ 命中面板/抽屉改读 `tool-retrieve` part 的 output；不再另打 `/retrieve`（`referencesOf`）。

## 2026-10-25 · 自由组件设计器 v1 不做（来源：`_Agents/planning-artifacts/specs/widget-freeform-designer.md`）

- ~~组件内分组 / 容器（嵌套自由布局）~~ → **2026-10-26 已做**（Qt 式布局容器 v1：vbox / hbox / grid / flex，最多四层；边界见下方「布局容器 v1 之后」）。
- 数据元件内部再设计（表格列、图表标题等）→ 不做（Qt 心智：QTableWidget 的内部由元件自己负责）。
- 把单卡设计存成可复用模板 → 未排期。
- 触屏拖拽 / 缩放 → 未排期（替代路径：元件箱点击新增 + 属性数字框 + 键盘移动）。
- 多选、对齐分布、样式复制 → 未排期。
- 设计面里编辑 JSON → 不做（只读「规格」页签；spec 仍是唯一真源）。
- 跨标签页编辑合并 → 沿用现有整数组快照写，要修得给 store 加 rev、四只本机 store 一起动（已有条目，不在本功能内解决）。

## 2026-10-25 · 标量数据原子之后（来源：`_Agents/planning-artifacts/specs/widget-freeform-designer.md` Story 4）

- ~~单个探针（按名字）的数据原子~~ → **2026-10-26 已做**：`probeRow` 按名字绑定探针，已知四个在 `probe-sources.ts`，后端新增可手填。
- ~~列表行 / 图表内部拆分~~ → **列表行已做**（`resourceRow` / `sessionRow`）；图表内部仍不做（视觉块，点选已接状态 trigger）。
- ~~组合件自动拆开（metricGroup → stat/dataLabel/dataIcon/divider）~~ → **模板已拆**；旧存档组合件不自动迁移，恢复默认才换。
- 数据值的字体 / 颜色 / 尺寸等样式 props → 未排期（先用基础元件与位置表达，避免又长成一套样式编辑器）。

## 2026-10-25 · 模板原子化之后

- ~~其余 8 个模板仍是单数据块（资源/会话/探针/图表/头像，sessions footer 在块内）~~ → **2026-10-26 已做**：recent / failures / sessions / probes 拆成行原子 + text/link；chart/activity/status/avatar 仍是视觉 / 固定件，不拆内部。
- 已存卡不自动重排（旧 spec 原样保留）→ 用户「恢复全部默认」拿新模板；若要自动迁移旧卡另立。
- KPI 的列宽/高度、ask 纵向胶囊、chart 去掉 footer 后的卡高需浏览器校准 → Lynx 手测后按实际反馈微调；新增行模板的行高 / 空态 / 长标题换行同样待手测。

## 2026-10-26 · 组件库 / 概览两层之后

- ~~**Phase 2 全内容原子化**~~ → **2026-10-26 原子能力已做，但默认模板视觉回退**：资源 / 会话 / 探针 / KPI 状态图例的行级原子保留在元件箱；recent / failures / sessions / probes 与 KPI 恢复旧组合外观，原子不默认替换。剩余：默认模板不原子化（要逐模板做视觉对齐）、图表内部与头像内部仍不拆。
- ~~**Phase 3 trigger / 组件间联动**~~ → **2026-10-26 已做**：共享选择总线（状态 / 资源 / 会话 / 探针 / 日期），状态过滤资源行、实体选择高亮；日期选择由活动图发出并按天过滤资源行。
- **状态过滤会缩卡** → 未排期：资源行被状态筛掉后卡变矮；要不要固定高度 / 空槽等 Lynx 看实际跳动再定。
- **资源行 / 会话行不再直接跳页** → 决定保留：点击用于联动选择，导航仍走侧栏；若用户要双击跳页另开。
- **两份存档分两次写** → 未排期：`kc-components` / `kc-overview` 各一次 `setItem`，极端配额或隐私模式下可能只成功一份；要跨键一致得把两份合成一份存档或加事务标记，先靠 `persistFailed` 提示。
- **组件库页标题与侧栏名不一致** → 未排期：页面叫「组件库」，侧栏仍叫「自定义组件」；统一命名会牵动 `kc-nav` 出厂名迁移，等 Lynx 拍。
- **画廊 `spanHint` 只是推荐宽度** → 不做：实际概览宽度可能不同；若要画廊完全模拟概览宽度，得把放置状态当预览依据，会把两层又绑回去。

## 2026-10-26 · 布局容器 v1 之后（来源：`_Agents/planning-artifacts/specs/widget-freeform-designer.md` Story 9）

- **容器内自由拖动 / 缩放** → 未排期：v1 容器内位置由 gap / padding / align / justify 与 grow / span 决定；要拖动换位得另做「拖到兄弟之间插入」的交互，不是把绝对定位塞回容器。
- **grid 显式 row / column** → 未排期：v1 只有列数 + 子件占列；要指定单元格得给每个子件加二维坐标与越界/重叠处理。
- **容器尺寸策略（min / max / 固定 / 按内容收缩）** → 未排期：v1 只有顶层 `box.h` 与子件 grow / span；复杂响应式排布等真实使用反馈。
- **画布直接点选嵌套布局容器本身** → 未排期：会给内层子件盖按钮导致点不到子件，v1 只能从父布局「子元件」列表或图层选。
- **容器背景 / 边框 / 圆角** → 不做：容器只负责排布；视觉分区用 `divider` 或里面的元件，避免再长成一套样式编辑器。
- **第五层布局** → 不做：v1 硬上限四层，归一化与设计页新增都拒绝；要放开得同时改模型、归一化和选中交互。
- **导入外部 spec 的截断提示** → 未排期：归一化会丢弃第五层布局与未知子件且不提示；当前没有外部导入路径，将来接入时补。
- ~~**默认模板改容器排布**~~ → **2026-10-26 已做**：KPI / ask / shortcuts / 列表 / 探针全部 box 化；chart / activity / status / avatar 保持单件。
- **默认模板 box 化的视觉校准** → 未排期：列表行高、分隔线、KPI 四层嵌套在宽 / 窄下的对齐需 Lynx 浏览器手测后微调；迁移只覆盖未改过的旧默认。
- **容器内的行内边距** → 不做独立配置：容器 `padding > 0` 时行原子自动去掉左右 padding；要单独调某一行的内边距只能再包一层布局。

## 2026-10-26 · /ask 输入区之后

- **模型下拉只是外观** → 未排期：`/ask` 输入区已有 DeepSeek V4 Flash / Pro 下拉，但切换不改变 `/chat` 请求；等后端暴露可用模型列表与请求字段再接真值。
- **Enter 发送快捷键** → 不做：按 Lynx 2026-10-26 标注，Enter 只换行，发送只走按钮；中文输入法确认也因此不会被抢。
