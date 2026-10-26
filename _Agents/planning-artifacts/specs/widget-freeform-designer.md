# 自定义组件自由设计器（free 模型 + 单卡设计面）Spec

- 状态：2026-10-26 两层「组件库 + 概览放置」+ 行级原子 + 共享选择 trigger + Qt 式布局容器 + 默认模板 box 化已落
- 日期：2026-10-25（2026-10-26 两层修订；同日 Phase 2/3；同日布局容器；同日默认模板 box 化）
- 范围：`app/web` 自定义组件模型、概览渲染、`/studio` 组件库、`/design/$widgetId` 设计面、组件间联动
- 关联：`app/web/needs.md` #87/#89/#90/#96/#97、`_Agents/implementation-artifacts/frontend-deferred.md`、`app/web/Agent/summary/summary-2026-10-25-widget-freeform-designer.md`、`summary-2026-10-26-widget-library-and-overview-placements.md`、`summary-2026-10-26-widget-row-atoms-and-triggers.md`、`summary-2026-10-26-qt-layout-containers.md`、`summary-2026-10-26-box-defaults.md`

> **2026-10-25 as-built**：free 模型/旧档迁移/FreeCard 渲染、`/design/$widgetId` 设计页、`/studio` 列表查找、只读规格、空白组件入口均已落；单元素拖动对齐辅助线、添加/删除/复制的焦点交接、内容撑高角标、<1024 的元件箱/属性抽屉也已补。`/studio` 的组件箱与组件详情统一成两只互斥抽屉，浮窗组件与从组件箱拖入的路径已删除。**标量数据原子**（13 个数据源 + stat / dataLabel / dataIcon / statusBar）已追加；KPI / ask / shortcuts 三个模板改成原子组合，chart footer 与 FreeCard 实例 Id 移除。`tsc` 0 错、56 文件 527 条、构建绿。浏览器外观与拖拽手感归 Lynx 手测；Story 3 仍差 412 视觉校准与正式 a11y 审计。
>
> **2026-10-26 两层修订（Lynx 拍板）**：`/studio` 改为**全部成品组件的画廊**，不再镜像概览；概览只放**引用**，两边顺序 / 宽度 / 显隐互不影响。存储拆成 `kc-components`（定义）与 `kc-overview`（放置），旧 `kc-widgets` 只在首次读档时拆成「一份定义 + 一份放置」。组件箱缩成 3 个模板 + 空白；概览编辑态新增「添加组件」拾取器。`tsc` 0 错、56 文件 523 条、构建绿。
>
> **2026-10-26 Phase 2/3**：新增**行级原子能力**（`resourceRow` / `resourceMore` / `sessionRow` / `probeRow` / `statusPart`）；这些原子曾把默认模板改成原子拼，后经视觉回退恢复旧组合外观（见下）。元件箱不再新增旧组合件，旧存档组合件继续渲染。新增**共享选择总线**：状态 / 资源 / 会话 / 探针 / 日期一次只选一个；状态 / 日期选择过滤资源行，资源 / 会话 / 探针选择高亮对应实体；状态条、状态项、状态图和状态图例都能发状态选择。图表内部与头像仍是不可拆的视觉 / 固定件。
>
> **2026-10-26 页头与设计入口**：自定义组件三页页头左侧清空、动作全在右侧并按「操作 → 重置 → 导航」排序；组件库「新增」加号、详情上移、说明删除、通栏 + 画廊等宽；侧栏加「设计」，用 `kc-design-target` 回上次设计的组件；页头标识统一为点+中性字并说中文；手机页头只留 40×40 图标；主/次按钮几何对齐。`tsc` 0 错、59 文件 554 条、构建绿。
>
> **2026-10-26 设计页工作区**：三栏加视口最小高度，画布/右栏撑满，属性卡吃剩余高度并在卡内滚动；元件箱改成搜索 + 四个页签 + 两列紧凑按钮，桌面卡内滚动。`tsc` 0 错、60 文件 558 条、构建绿。
>
> **2026-10-26 Phase 3 补完**：活动图点一天写日期选择（带年份的 key + M/D 标签），资源行按当天过滤；状态 / 日期都有消费方，资源 / 会话 / 探针保持高亮。图表内部与头像内部仍不拆。`tsc` 0 错、60 文件 559 条、构建绿。
>
> **2026-10-26 视觉回退**：Lynx 反馈默认组件样子变了；recent / failures / sessions / probes 恢复旧组合件外观，KPI 状态条恢复图例，不再默认用行原子拼。行 / 状态原子仍是元件箱里的可选能力，trigger 对组合件与原子件都生效。已存原子默认按 `kc-components-visual-version=2` 一次性迁回旧外观，用户改过的组件不动。`tsc` 0 错、60 文件 560 条、构建绿。
>
> **2026-10-26 提示词清理**：设计页断点/键盘/推荐宽度说明、组件库卡片脚注、概览拾取器长说明与联动条操作提示已删除；保留错误、空态、状态角标与播报。工作区高度同步从 9.5rem 调到 7rem。`tsc` 0 错、60 文件 560 条、构建绿。
>
> **2026-10-26 Qt 式布局容器（Lynx 拍板「真 Qt 容器」）**：新增 `vbox` / `hbox` / `grid` / `flex` 四种布局容器；顶层仍是绝对定位，容器内子件由 `gap` / `padding` / `align` / `justify` 排布，子件可用 `grow`（非 grid）或 `span`（grid）。最多四层（顶层 + 三层嵌套）；grid 只做列数 + 子件占列，不做显式行列坐标；容器内不自由拖动。设计页补树形查找 / 补丁 / 删除 / 复制 / 移序，选中布局时新元件进布局，第五层拒绝。`tsc` 0 错、62 文件 570 条、构建绿。
>
> **2026-10-26 默认模板 box 化（Lynx 拍板「结构全拆」）**：11 个出厂模板里 KPI、ask、shortcuts、recent、failures、sessions、probes 全部改成布局容器排；KPI 是四层嵌套（根 vbox → 指标 hbox → 指标 vbox → 图标+标签 hbox），列表用行原子，探针用 flex 换行，ask/shortcuts 用 vbox/grid。chart / activity / status / avatar 是单个视觉件，保持一个元件。旧模板保留为 `legacyTemplateFreeSpec` 只服务迁移；`kc-components-visual-version=4` 只把未改过的旧默认迁到新模板，用户改过的与旧存档组合件不动。`tsc` 0 错、62 文件 592 条、构建绿。
>
> **2026-10-26 窄屏文字修复**：头像组合器外层 / 内层 `w-full`，设置面板的 `items-start` 不再把它压成一条；芯片 / 随机 / 默认 / 复制按钮统一 `shrink-0 + whitespace-nowrap`；`sm` 以上保持「头像左 / 控件右」，窄屏三组控件各自单行、复制文案收成「复制」；组件库在 `xl` 以下单列、以上两列，避免半宽卡压坏头像与最近入库。最近入库 / 失败原因改用容器查询（`@container` + `@lg`），窄卡隐藏类型 / 时间、原因换行；设计页按 48rem 默认选宽 / 窄断点；旧 `kc-widgets` 迁出的默认组件也走 box 迁移；`kc-components-visual-version=4`。状态条图例项与总量文案不压缩，数据标签 / chip 长文案单行截断。`tsc` 0 错、62 文件 592 条、构建绿。
>
> **2026-10-26 状态条拆开 / 页签图标 / 断点进页头（Lynx EditHere 反馈）**：KPI 默认模板把状态条拆成「纯横带 + 4 个状态项 + 总量文案」的 vbox 组合（`statusTotal` 新原子），图例项与总量各自可选中 / 摆位；未知项只在有数时出现。`statusBar` 不再默认带图例（仍可打开组合图例兼容旧档），新增 `statusTotal` 读资源总数显示「共 N 条」。`kc-components-visual-version=5`：只把未改过的 v4 box KPI 迁到拆开版，用户改过的不动。设计页断点切换移到页头右槽（≥48rem），窄屏落回动作行；元件箱五个文字页签改成图标页签（数据 / 行 / 布局 / 图形 / 基础，aria-label + title 保留）。`tsc` 0 错、61 文件全绿（repo-guard 的两条红来自并发的 ask.tsx 改动）、构建绿。

## 1. 目标

1. 每张卡像 Qt Designer 的表单：卡身是自由画布，数据元件和基础元件可拖放、缩放、对齐。
2. 三个底座（table / chart / interaction / other）整体退役；所有组件统一成 free 模型，旧 11 个内置变成出厂模板。
3. 数据仍由绑定元件提供，不把数据内容写死进布局；文案默认来自 registry，可由元件 props 覆盖。
4. 概览页只负责展示用户选中的组件；`/studio` 列表展示全部组件（含隐藏）并支持查找；设计面是新增的一页，不替换列表。

## 2. 已拍决策

| # | 决策 |
|---|---|
| D1 | 整体替换：11 个内置迁成 free 模板，旧三底座渲染与 spec 删除，不留两套 |
| D2 | 结构级自由：卡身内元件可自由摆放；数据元件内部固定，只暴露 props |
| D3 | 宽 / 窄两套布局；横向 x/w 用百分比、纵向 y/h 用 px；每套带设计高度 |
| D4 | 即改即存 + 会话内撤销 / 重做（刷新后不可退） |
| D5 | `/studio` 保留组件列表画布并补查找（名字 / 类型）；单卡设计面在 `/design/$widgetId`；概览编辑态不动 |
| D6 | 卡片外壳（标题栏）不参与设计；标题 = 实例名 |
| D7 | 元件数组顺序 = 图层顺序 = DOM / 焦点顺序 |
| D8 | 两层模型：`ComponentDefinition`（组件库里做好的组件）+ `Placement`（概览上的引用）；一个组件最多一份放置 |
| D9 | 库顺序只影响组件画布；概览顺序 / 宽度 / 显隐只住在放置里，两边互不搬动 |
| D10 | 组件箱只留表格 / 统计 / 互动 / 空白四个起点；新建只进组件库，概览用「添加组件」拾取器另加 |
| D11 | 设计页只改定义（名字 / spec / 推荐宽度）；宽度 / 顺序 / 显隐是概览放置的动作 |
| D12 | 全部内容按「能被单独摆」拆：资源行 / 会话行 / 探针行 / 状态项；旧组合件只服务旧存档，不进新元件箱；图表内部与头像保持不可拆的视觉 / 固定件 |
| D13 | trigger 用一条共享选择总线，不按卡片两两连线：状态选择过滤资源行，资源 / 会话 / 探针选择高亮实体；同项再点取消，一次只留一个选择 |
| D14 | 默认模板全部 box 化：KPI / ask / shortcuts / 列表 / 探针用布局容器重排，chart / avatar 等单件保持一个元件；只迁未改过的旧默认，用户改过的不动 |

补充默认（Lynx 未逐条否，按此实现）：

- 概览 / 组件库的模板箱新增「空白组件」；组件箱只给 3 个模板 + 空白。
- JSON 降为只读「规格」页签，不再作为编辑入口。
- `span` 是**放置级**属性（只影响宽屏）；组件定义上只留 `spanHint` 作推荐宽度，窄屏恒为全宽。
- 复制一份不再限制来源：任意组件都可复制；副本只进组件库，放置由概览单独决定。
- 不新增依赖；拖拽继续用原生 HTML5 DnD / pointer 事件，动画沿用 motion。

## 3. 范围

### 做

- free 模型、元件目录、每个元件的渲染器；
- 两层仓库：`ComponentDefinition`（库）+ `Placement`（概览），存储 `kc-components` / `kc-overview`；旧 `kc-widgets` 迁移；
- 11 个内置模板 + 旧存档迁移（含 `kind+config`、`kc-dashboard`、`kc-chart-config`）；
- 概览页按放置引用渲染；`/studio` 是全部组件的画廊，组件箱只给 3 个模板 + 空白；概览编辑态从组件库添加；
- `/design/$widgetId` 设计面：元件箱、画布、图层、属性、宽 / 窄页签、撤销；
- 标量数据原子：13 个数据源 + `stat` / `dataLabel` / `dataIcon`，标签与图标独立、横线用 divider；
- Qt 式布局容器：`vbox` / `hbox` / `grid` / `flex`，最多四层；容器内 gap / padding / align / justify，子件 grow / span；设计页树形编辑；
- 默认模板 box 化：KPI / ask / shortcuts / recent / failures / sessions / probes 用容器重排；`kc-components-visual-version=4` 迁移旧默认；
- 窄屏渲染、键盘操作、a11y、测试、summary / 走读页。

### 不做（v1）

- **布局容器 v1 边界**：最多四层；grid 只有列数 + 子件占列，没有显式 row / column；容器内不能自由拖动 / 缩放，也没有尺寸策略（min / max / 固定尺寸）；嵌套容器不在画布上直接点选；容器不提供背景 / 边框。
- 其余见 `_Agents/implementation-artifacts/frontend-deferred.md` 的「2026-10-25 · 自由组件设计器 v1 不做」：数据元件内部再拆、存成模板、触屏拖拽、多选 / 对齐分布、设计面里编辑 JSON、跨标签页编辑合并。

## 4. 数据模型

```ts
interface ComponentDefinition {
  id: string
  name: string
  /** 示例角标：ask 模板及其副本 */
  mock?: boolean
  /** 放到概览时的推荐宽度；放置可自行改 */
  spanHint: 1 | 2
  spec: FreeSpec
}

interface Placement {
  componentId: string
  span: 1 | 2
  on: boolean
}

interface FreeSpec {
  layouts: { wide: Layout; narrow: Layout }
}

interface Layout {
  /** 卡身内容框高度（px）；渲染为 min-height */
  height: number
  elements: Element[]
}

interface Element {
  id: string
  kind: ElementKind
  /** x / w 是卡身内容框宽度的百分比，y / h 是 px；布局子件忽略 box */
  box: { x: number; y: number; w: number; h: number }
  props: ElementProps
  /** 布局子件的伸展权重（vbox / hbox / flex） */
  grow?: number
  /** grid 子件占几列 */
  span?: number
}

interface LayoutProps {
  gap: number
  padding: number
  align: 'start' | 'center' | 'end' | 'stretch'
  justify: 'start' | 'center' | 'end' | 'between' | 'around'
  children: Element[]
  /** flex 方向与换行 */
  direction?: 'row' | 'column'
  wrap?: boolean
  /** grid 列数 1–12 */
  columns?: number
}
```

- **两层各存各的**：库数组顺序只影响组件画布；概览数组顺序只影响概览。一个 `componentId` 最多一份放置；要两份就在库里复制。
- 坐标原点 = 卡身内容框左上角，画布不另加内边距；数据元件沿用各自渲染器原有的内边距，保证迁移前后视觉一致。
- `x/w` clamp 0–100，`w` 最小 8%；`y/h` 最小 8px（模板与迁移可用 `h=0` 表示只按内容撑高）。
- 元件顺序即图层：数组越靠后越在上；DOM 顺序与数组一致。
- 数据元件的 `h` 是下限：内容更高时实际渲染会撑高，允许压到下方元件；设计面用真数据，能直接看见。
- 卡身高度 = `max(layout.height, 各元件实际底边)`；`layout.height` 只是设计下限，模板取 0、空白组件取 160。
- 布局子件的 `box` 不参与定位；位置由容器的 `gap` / `padding` / `align` / `justify` 与子件的 `grow` / `span` 决定。容器本身在最内层也只由内容撑高，顶层的 `box.h` 才是最小高度。
- 布局嵌套最多四层（顶层 + 三层嵌套）；`MAX_CHILDREN = 24`。归一化丢弃第五层布局与未知子件。
- 新组件 = 模板快照；名字在库内去重。`spanHint` 只作概览 `placeComponent` 的初值；之后宽度、显隐、顺序都只改放置。

## 5. 元件目录 v1

### 数据元件（内部固定，props 覆盖）

| kind | 渲染内容 | props |
|---|---|---|
| `metricGroup` | 四个指标 + 可选状态条 | `showBar`、指标 label / hint 覆盖 |
| `resourceList` | recent / failures 列表 | `source`（recent / failures）、`limit`、空态与原因文案覆盖 |
| `sessionsList` | 会话列表 + footer | `limit`、footer 与动作文案覆盖 |
| `probes` | 探针摘要 | `onlyFailed`、文案覆盖 |
| `statusBar` | 资源状态分布条（可含未知）；默认只画横带，打开图例才带图例与总量 | `showOther?`、`showLegend?` |
| `chart` | 图表 | `chartSource`（activity / status / custom）、`chart` 配置、`window`、`showOther` |
| `actions` | 动作条目 | `items[]`（label / href / icon / shape / variant） |
| `avatar` | 头像配方 | 无内容字段 |

### 数据原子（2026-10-25 追加）

标量数据拆成三种独立件；每个「被追踪的数据」在 `data-sources.ts` 只登记一次（标签 / 图标 / 取值）：

| kind | 渲染 | props |
|---|---|---|
| `stat` | 只画数值（24px 等宽数字），loading 骨架、取不到 fallback | `source`、`prefix?`、`suffix?`、`fallback?` |
| `dataLabel` | 显示 source 的默认标签 | `source`、`text?`（覆盖） |
| `dataIcon` | 显示 source 的默认图标 | `source`、`name?`（覆盖） |

数据源：资源总数 / 已就绪 / 处理中 / 失败 / 未知、会话数、今日入库、近 7/14/30 天入库、探针通过 / 未通过 / 总数。横线继续用 `divider`；标签与图标由用户自己摆。

### 行级与状态原子（2026-10-26 追加）

| kind | 渲染 | props |
|---|---|---|
| `resourceRow` | 最近入库 / 失败清单的一行（状态徽标 / 标题 / 类型 / 时间或原因） | `source`、`index`、`showEmpty`、`showStatus` / `showType` / `showDate`、空态与原因覆盖 |
| `resourceMore` | 列表余量（失败清单「另有 N 条」；最近入库可显示「共 N 条」） | `source`、`shown`、`text?` |
| `sessionRow` | 会话列表的一行（图标 / 标题 / 本机标记 / 时间） | `index`、`showIcon` / `showLocal` / `showDate`、`showEmpty`、空态文案 |
| `probeRow` | 按名字绑定的一条探针 chip | `name`、`showEmpty`、空态 / 找不到文案 |
| `statusPart` | 状态图例的一项（点 / 标签 / 数值） | `status`、`text?`、`showDot` / `showLabel` / `showValue`、`hideWhenZero` |
| `statusTotal` | 状态图例总量（「共 N 条」，读资源总数） | 无内容字段 |

- 行按 `index` 取当前数据；`status` 选择先过滤资源行再取 index，不在行里写死资源 id。
- 探针名与后端 `service.check` 对齐，已知四个在 `probe-sources.ts`；后端新增探针时可在属性里手填。
- 状态词只有一份（`status.ts`），状态条、状态项、状态图、资源过滤共用。
- 旧组合件（指标组 / 资源列表 / 会话列表 / 探针块 / 动作组 / 带图例的状态条）仍是 recent / failures / sessions / probes 的默认渲染路径；KPI 的旧组合外观只服务旧存档，新默认 KPI 用状态条 + 状态项 + 总量文案拼。旧存档继续渲染，元件箱不新增这些块。
- 行 / 状态原子是可选能力：用户在设计器里手动添加；KPI 默认已用状态项 + 总量。
- `statusBar` 默认只画横带；图例可由 `statusPart` 与 `statusTotal` 逐个摆，打开 `showLegend` 会把整条图例（含总量）一起画回来，兼容旧档。
- `statusTotal` 只读资源总数，文案固定「共 N 条」，不可在属性里改数。
- 图表内部与头像仍是不可拆的视觉 / 固定件；单张图表、单个头像可整体摆放。

### 布局容器（2026-10-26 追加）

| kind | 排布 | props |
|---|---|---|
| `vbox` | `flex-direction: column` | `gap`、`padding`、`align`、`justify`、`children` |
| `hbox` | `flex-direction: row` | 同上 |
| `grid` | `grid-template-columns: repeat(columns, minmax(0, 1fr))` | 同上 + `columns`（1–12） |
| `flex` | `flex` 可设方向与换行 | 同上 + `direction`（row / column）、`wrap` |

- 容器只负责排布，不提供背景 / 边框 / 尺寸策略；视觉仍由里面的元件承担。
- 子件规则：grid 用 `span` 占列（1..columns）；vbox / hbox / flex 用 `grow` 伸展（0–10）。
- `align` 映射 `align-items`，`justify` 映射 `justify-content`；flex 的 `wrap` 缺省为 true（设计器里自动折行比溢出更可预期），属性面板可关。
- 嵌套最多四层；第五层在归一化与设计页新增时都被拒绝。
- 容器内的子件不能自由拖动 / 缩放，也不能单独指定 x / y / w / h；想自由摆放用顶层绝对定位。
- 嵌套布局不在画布上盖选中按钮（否则挡住内层子件），从父布局的「子元件」列表或图层选中。

### 基础元件

| kind | props |
|---|---|
| `text` | `text` |
| `heading` | `text`、`level`（2 / 3） |
| `icon` | `name` |
| `divider` | `orientation`（h / v） |
| `spacer` | 无 |
| `link` | `label`、`href`、`icon?`、`variant?`、`shape?`（chip / button） |

- 数据元件的固定文案默认来自 `table-meta.ts` / 现有常量；props 有值时覆盖。
- 数据原子的 source registry 是 `data-sources.ts`；取值只读 WidgetData / 会话数，不发请求。
- 每个 kind 有一份默认尺寸（`ELEMENT_DEFAULT_BOX`），用于新建与旧档迁移。
- 渲染器只按 kind 取数据，不出现页面专属内容；`repo-guard` 继续守。

## 6. 渲染口径

- `FreeCard` 取代 `BaseComponent`：按视口选 `wide`（≥ 768）或 `narrow`（< 768），绝对定位渲染 `elements`。
- 顶层布局元件交给 `LayoutElement` 递归渲染；非布局元件走 `FreeElementView`。布局子件不再绝对定位，容器用 gap / padding / align / justify 排；空容器显示「空布局 · 从元件箱添加子元件」。
- 头像组合器保持原来的视口断点：`sm` 以上头像左、控件右；窄屏上下排，三组控件各自单行、可横滑。组合器外层 / 内层占满整行，设置面板的 `items-start` 不会把它压成一条；按钮内部文字不换行，复制文案在窄屏收成「复制」。
- 最近入库 / 失败原因用容器查询：卡宽 < 32rem 时隐藏类型 / 日期、失败原因换行，避免半宽卡把标题压成省略号。
- 设计页初始断点跟 48rem 走：窄视口默认打开「窄屏布局」，避免在手机画布上把 4 列 KPI 压成省略号；仍可手动切宽屏。
- 卡身 `min-height = layout.height`；概览网格仍行内等高，整块设计画布在剩余高度里垂直居中，画布内部坐标不变。
- span 只作用于宽屏，且来自概览的放置；窄屏所有卡全宽。
- 数据加载 / 失败沿用现有骨架与错误文案；布局照常渲染。
- 标签栏 `Mock` 读组件定义的 `mock`（ask 模板 / 旧 ask 组件为 true，复制时保留）。
- `chart` 不画 footer（图型 + 去设计）；它是非数据内容。设计入口在卡 / 详情抽屉；`FreeCard` 不再需要实例 Id。

## 6.1 组件间联动（trigger）

- 一条**共享选择总线**（`selection.ts`）保存唯一的选择：`status` / `resource` / `session` / `probe` / `date`，带展示标签；只活在当前页面会话，不写 localStorage。
- **谁发**：`resourceRow` → 资源；`sessionRow` → 会话；`probeRow` → 探针；`statusPart` / `statusBar` 的段与图例 / 状态图扇区 → 状态；活动图柱子/折线点 → 日期（`Days30` 的带年份 key，标签 M/D）。
- **谁收**：状态选择先过滤资源行（`resourceRow` 与旧 `resourceList`），再按 index 取行；日期选择按 `created_at` 的日 key 过滤资源行；资源 / 会话 / 探针选择只高亮对应实体；状态条 / 状态项 / 状态图在选中时高亮并压暗其他档。
- **取消**：点同一项再点一次、或概览选择条上的 ×；清空后焦点回到概览的「自定义面板」按钮。
- **范围**：图表内部（坐标轴 / 图例 / 扇区细节）与头像内部不拆；日期只在活动图上点选，没有独立日期选择器。
- 选择条是概览页的常驻组件：有选择时出 chip，无选择时只留 `role=status` 播报槽，不用条件渲染 live region。

## 7. 迁移

| 旧 spec | 新元件 | 保留 |
|---|---|---|
| `chart`（source chart / activity / status） | `chart` | `chart` 配置、`window`、`showOther`；custom / activity / status 映射到 `chartSource` |
| `table` kpi | `metricGroup` | `showBar` |
| `table` recent / failures | `resourceList` | `source`、`limit` |
| `table` sessions | `sessionsList` | `limit` |
| `table` probes | `probes` | `onlyFailed` |
| `interaction` ask / shortcuts | `actions` | `items` 原样 |
| `other` avatar | `avatar` | — |

- 每条旧实例折成单元素布局：wide / narrow 都为 `x=0, y=0, w=100, h=ELEMENT_DEFAULTS[kind]`；`id / name / spec / mock` 进定义，`span` 同时成为 `spanHint` 与放置宽度，`on` 进放置。
- 迁移链不断：`kind+config`、`kc-dashboard` 的 span / on、`kc-chart-config` 仍先走现有归一化，再折成 free；旧布局顺序同时成为库顺序与概览顺序。
- 无法识别的条目按现状丢弃；`kc-widgets-deleted` 墓碑继续防止内置被目录补回。
- **恢复语义分两层**：概览「恢复默认布局」只重置放置（自定义组件的放置保留），不动库；组件库「恢复全部默认」清两份存档与旧迁移源，回到出厂定义 + 出厂放置。「恢复单个内置」只回组件库末尾，不自动回到概览。
- **模板配方**：默认 11 个组件全部按 box 排：KPI 是根 vbox + 指标 hbox + 每个指标的 vbox + 图标/标签 hbox，底部状态组 vbox（纯横带 + flex 图例行：4 个状态项 + spacer + 总量文案）；ask 是 vbox（chip + 按钮行），shortcuts 是 grid（宽 4 / 窄 2）；recent / failures 是 vbox + 行原子，sessions 是 vbox + 行原子 + 底部说明，probes 是 flex 换行；chart / activity / status / avatar 是单个视觉 / 固定件。旧组合渲染器、行 / 状态原子仍保留：前者服务旧存档，后者服务手工添加；旧模板 `legacyTemplateFreeSpec` 只给迁移比对。

## 8. 页面与设计面

### 页面职责

- 概览 `/`：只展示**放置**（引用组件库里的 definition）；编辑态只改位置 / 宽度 / 显隐 / 添加，内容设计不在这里发生。内容区通栏，页头动作全在右侧。
- 组件库 `/studio`：全部成品组件的**画廊**（库顺序），不镜像概览；页头「新增」新建模板，组件详情从页头打开；`xl` 以上等宽两列、以下单列（避免半宽卡压坏头像与列表），落单最后一张占整行。已删除的内置在画廊下方单独恢复。
- 设计入口 `/design`：侧栏「设计」进来的入口，不落列表，直接回上次设计的组件（`kc-design-target`）；目标被删回退第一个，组件库为空才给空态。
- 设计 `/design/$widgetId`：只改一个**定义**的内部内容（名字 / spec / 推荐宽度）。

### 页头与动作口径（2026-10-26）

- 桌面页头左侧只留给移动端汉堡，不放页面动作；动作统一在右侧，顺序为「页面操作 → 重置/危险 → 回别页的导航」。
- 桌面按钮统一 `size="sm"`（32px）+ `size-3.5` 图标；手机 <640 隐藏文字、只留图标，按钮由 `page-header-actions` 媒体规则收成 40×40，和汉堡键同高。
- 每个页头动作必须有图标，符号按语义固定：新增 `plus`、组件库 `layers`、回概览 `grid`、刷新/重探/自动刷新 `refresh`、恢复默认 `swap`、资源 `database`、设计/编辑 `layout`；跨页链接不再用尾随箭头。
- 页头标识（健康等）颜色只由 1.5px 点承载，文字中性 caption，容器不铺底、不描边；状态值不直接显示 `ok` / `degraded`，统一中文「正常 / 降级 / 检测中 / 后端不可达」。
- 主 / 次按钮几何一致：按钮基类补 1px 透明边框 + `background-clip: padding-box`，深色实底与白色 glass 的内圈对齐，避免“黑按钮大一圈”。

### 入口与骨架

- 路由：`/design`（入口/重定向）+ `/design/$widgetId`（编辑器）；与组件库 `/studio` 分离。
- 入口：侧栏「设计」→ `/design` → 上次组件；`/studio` 组件画布双击卡片或详情「设计」也可进入。选中只改 URL 的 search，导航用 `resetScroll: false`，不把页面滚回顶部。
- 页头：右侧「宽 / 窄断点 + 撤销 / 重做 / 组件库」，左侧不出现页面按钮；<48rem 时断点切换落回画布上方的动作行（不与页头同时出现），手机页头仍只留图标。
- 三栏：左元件箱（搜索 + 数据 / 行 / 布局 / 图形 / 基础五枚图标页签 + 两列紧凑按钮，桌面卡内滚动）；中 1:1 卡身；右图层 + 属性（属性卡吃剩余高度、表单内滚）。桌面三栏有视口最小高度并填满；窄屏单列，顺序为画布 → 元件箱 → 图层 / 属性。自定义组件三页通栏，不再套 max-width。

### 编辑

- 选中：点元件选中；Esc 取消；选中框显示 8 个缩放手柄。
- 拖动：阈值 3px；8px 网格吸附 + 与其他元件边缘 / 中心、画布边缘的对齐线。
- 缩放：8 手柄；最小 8% 宽 / 8px 高；属性区有 x / y / w / h 数字输入，键盘可达。
- 键盘：方向键移动 1px，Shift + 方向键 10px。
- 新增：元件箱搜索或切页签后点条目，加到当前断点末尾；选中布局时改为加到该布局末尾，选中布局子件时加到最近的父布局；触屏走同一条点击路径，不提供拖入。
- 布局：选中容器可在属性里改 gap / padding / align / justify；flex 另改方向 / 换行，grid 改列数。选中布局子件可改 `grow`（grid 为 `span`）；布局子件不显示 x / y / w / h。
- 布局子件：点画布内层元件直接选中；嵌套布局本身从父布局的「子元件」列表或图层选中。子件可在列表里前移 / 后移 / 删除。
- 嵌套上限：布局里再放布局最多三层；在第四层布局里再加布局提示「布局最多嵌套三层」并拒绝。
- 图层：列表顶部 = 最上层；上移 / 下移改数组顺序；可删除、复制元件。
- 宽 / 窄：首次进入窄屏布局为空时，提示「从宽屏复制」；之后两套独立编辑。
- 属性：每种 kind 一套字段；数据元件文案字段留空 = 用 registry 默认值。
- 数据元件内容超出 `box.h` 时，设计面给该元件「超出」标记。

### 保存与撤销

- 每次提交（拖动松手、缩放结束、属性 blur / 回车、增删、图层移动）立即 `setComponentSpec` 落 `kc-components`。
- 撤销 / 重做：本次设计会话内的 spec 快照栈，最多 50 步；离开设计面清空；外部存储变化时清空并提示。
- 写存储失败沿用 `PersistWarning`，编辑继续在内存里进行。

### a11y

- 渲染后 DOM 顺序 = 元件数组顺序；焦点顺序同。
- 设计面所有动作键盘可达：Tab 进图层 / 属性，方向键移动，数字输入改尺寸。
- 选中 / 增删 / 撤销结果走常驻 `role=status` 播报，不随元件卸载。

## 9. Story 拆分与 AC

### Story 1 · 换模型 + 渲染 + 迁移

前置：把工作区里未接完的浮动组件箱 / 属性面板接上（当前 `tsc` 5 个错），保留列表画布交互不变。

- [ ] `catalog` 换成 free spec 类型；旧 chart / table / interaction / other spec 只存在于迁移代码。
- [ ] 元件渲染器覆盖全部 kind；`FreeCard` 按视口选布局；概览与 `/studio` 列表画布外观与现在一致。
- [ ] 11 个出厂模板 + 空白组件；旧实例 / 旧迁移链全部落到 free。
- [ ] `Mock` 改实例级；`specSummary` 改为「N 个元件 · 类型」。
- [ ] 列表画布的 JSON 编辑器改为只读「规格」（设计面在 Story 2 接管）。
- [ ] 测试：迁移矩阵、每种元件渲染、布局选择、模板、`repo-guard`；`tsc` / `npm test` / `npm run build` 全绿。

### Story 2 · 单卡设计面

- [ ] `/design/$widgetId` 深链可用；双击列表卡片、详情「设计」、概览「去设计」三入口。
- [ ] `/studio` 列表补查找（名字 / 类型），命中后选中并滚到卡片；画布与拖拽不变。
- [ ] 宽 / 窄页签；空窄屏可从宽屏复制。
- [ ] 元件箱新增（点击 / 拖入）、选中、拖动、缩放、吸附与对齐线、方向键移动。
- [ ] 图层顺序 = DOM / 焦点顺序；上移 / 下移 / 删除 / 复制元件。
- [ ] 属性检查器按 kind 出字段；数字框改坐标尺寸。
- [ ] 即改即存 + 50 步会话撤销 / 重做；写失败横幅。
- [ ] 只读「规格」页签；数据元件超出标记；真数据 / 骨架 / 错误三态。
- [ ] 测试：几何纯函数（吸附 / clamp / 百分比换算）、历史栈、编辑器交互、`repo-guard`；`tsc` / 测试 / 构建全绿。

### Story 3 · 窄屏、a11y 与收口

- [ ] 窄屏按 narrow 布局渲染；412 / 768 / 1440 无横向溢出。
- [ ] a11y 审计：焦点顺序、键盘路径、播报、选中框对比度。
- [ ] 11 个模板在宽 / 窄两档实测校准，视觉与旧版对齐。
- [ ] 文档：`Agent/summary/summary-2026-10-25-widget-freeform-designer.md`、`_Agents/walkthroughs/epic?-story?-*.html`（按实际 story 归属）、`LEARNING.md` 若有新口径。
- [ ] 浏览器手测归 Lynx；agent 只跑静态与自动化检查。

### Story 4 · 标量数据原子（2026-10-25 追加）

- [x] `data-sources.ts` 登记 13 个数据源（标签 / 图标 / 取值）；资源、会话、入库窗、探针计数测试。
- [x] `stat` 只画值；`dataLabel` / `dataIcon` 读同一 source 的默认标签与图标并可覆盖；`divider` 继续复用。
- [x] 元件箱按每个数据值一行；属性表单选 source / 前后缀 / 标签文字 / 图标；归一化拒绝未知 source；设计页测试覆盖从元件箱加 stat。
- [x] 单个探针（按名字）→ `probeRow`；列表行 → `resourceRow` / `sessionRow`（2026-10-26）。
- [ ] 图表内部（坐标轴 / 图例 / 扇区）与头像内部不拆；数据值的字体 / 颜色样式 props 未做；去向见 `frontend-deferred.md`。

### Story 5 · 组件模板原子化（2026-10-25 追加）

- [x] KPI 模板 = 4×(dataIcon + dataLabel + stat) + 处理中提示 text + 3 条竖分隔线 + 横线 + 纯状态条 + 4 个状态项 + 总量文案。
- [x] ask = 3 个胶囊 link + 1 个按钮 link；shortcuts = 4 个按钮 link（窄屏 2×2）。
- [x] 新增 `statusBar` 元件；`link` 支持 chip / button；chart footer 与 `FreeCard` 实例 Id 移除；模板/数据原子测试更新。
- [x] ~~其余 8 个模板仍是单数据块~~ → 2026-10-26 recent / failures / sessions / probes 拆成行原子 + text/link；chart / activity / status / avatar 是视觉 / 固定件，不拆内部。
- [ ] 模板视觉校准（KPI 高/宽、ask 纵向胶囊、chart 去掉 footer 后的高度、行模板行高 / 空态）归 Lynx 手测。

### Story 6 · 组件库 / 概览两层（2026-10-26，Phase 1）

- [x] `kc-components` + `kc-overview` 两层仓库；`ComponentDefinition` / `Placement`；旧 `kc-widgets` 首次读档拆成定义 + 放置。
- [x] 库动作（新增 / 改名 / 复制 / 改 spec / 删 / 恢复）与放置动作（加 / 显隐 / 换宽 / 移序 / 重置）分开；删除组件同时移除其放置。
- [x] `/studio` 改为组件画布画廊；组件箱只留表格 / 统计 / 互动 / 空白；已删除内置在画廊下方恢复。
- [x] 概览编辑态「添加组件」拾取器：列出整个组件库，已放置的标出来，加完不关；概览与库顺序互不影响。
- [x] 设计页改 `setComponentSpec`；`span` 换成 `spanHint`，宽度 / 顺序只在概览放置里调。
- [x] 测试：两层迁移、库/放置互不影响、删除/恢复/重置、存储失败、跨标签页；`tsc` / `npm test` / `npm run build` 全绿。
- [ ] 浏览器手测：概览添加拾取器、组件画布画廊、设计页入口与抽屉；归 Lynx。

### Story 7 · 全部内容拆成小元件（Phase 2，2026-10-26 已落）

- [x] 行 / 状态原子：`resourceRow` + `resourceMore` / `sessionRow` / `probeRow` / `statusPart`；可从元件箱单独添加。
- [x] 默认模板保留旧组合外观；recent / failures / sessions / probes 继续走组合件，KPI 状态条保留图例；原子不默认替换。
- [x] 属性面板补五种新原子表单；连续添加行自动递增 index，探针 / 状态选择下一个未用项。
- [x] 图表内部与头像保持不可拆的视觉 / 固定件。
- [ ] 浏览器手测：原子行 / 状态项在设计器里的高度、空态、窄屏 412；归 Lynx。

### Story 8 · trigger / 组件间联动（Phase 3，2026-10-26 已落）

- [x] 共享选择总线：状态 / 资源 / 会话 / 探针 / 日期，一次一个，同项取消，不落存储。
- [x] 状态选择过滤资源行；资源 / 会话 / 探针选择高亮实体；状态条 / 状态项 / 状态图高亮选中档。
- [x] 概览选择条 + 常驻 `role=status` 播报；清空把焦点还给「自定义面板」。
- [x] 状态条 / 状态项提供图表点选的键盘替代；状态词只有 `status.ts` 一份。
- [x] 日期选择有消费方：活动图点选写带年份 key，资源行按 `created_at` 日 key 过滤；图表内部与头像内部仍不拆。

### Story 9 · Qt 式布局容器（2026-10-26 已落）

- [x] 模型：`vbox` / `hbox` / `grid` / `flex`；`LayoutProps`（gap / padding / align / justify / children，flex 方向与换行，grid 列数）；子件 `grow` / `span`。
- [x] 归一化：递归子件、最多四层、最多 24 个子件；gap / padding 0–64、grid 列数 1–12；未知子件与超层布局丢弃。
- [x] 渲染：`LayoutElement` 递归排布；顶层容器 `box.h` 作最小高度，嵌套容器由内容撑；空布局提示。
- [x] 元件箱：第五页签「布局」，四个容器两列按钮。
- [x] 设计页：选中布局时新元件进布局；第五层提示并拒绝；补丁 / 删除 / 复制 / 移序走树操作；嵌套布局从子件列表选中。
- [x] 属性：布局给 gap / padding / align / justify（+ flex / grid 专属字段）；布局子件给 `grow` / `span`，隐藏绝对定位字段。
- [x] 测试与守卫：`layout-elements.test.tsx`、`element-tree.test.ts`、设计页嵌套 / 拒绝第五层、元件箱布局页签、`repo-guard` 接线。
- [ ] 浏览器手测：四种容器的间距 / 对齐 / 分布、flex 换行、grid 列数、窄屏 412；归 Lynx。

### Story 10 · 默认模板 box 化（2026-10-26 已落）

- [x] KPI / ask / shortcuts / recent / failures / sessions / probes 全部用 `vbox` / `hbox` / `grid` / `flex` 重排；chart / activity / status / avatar 保持单件。
- [x] KPI 四层嵌套：根 vbox → 指标 hbox → 指标 vbox → 图标+标签 hbox；窄屏 `grid` 两列。
- [x] 列表模板用行原子：recent 5 行、failures 4 行 + 余量、sessions 4 行 + 说明、probes flex 换行 4 个。
- [x] 容器内边距接管行内边距（`FreeElementView` 的 `Inset`）；会话行可关分隔线；链接在纵向 / 网格里撑满、横排里保持内容宽。
- [x] `TextProps` 加 `variant: 'caption'`，KPI 提示与会话底部说明沿用旧版弱化小字。
- [x] 迁移：旧模板保留为 `legacyTemplateFreeSpec`；`kc-components-visual-version=4` 只迁移未改过的旧默认（原子签名 + 旧模板逐字比对），旧 `kc-widgets` 迁出的默认也走同一迁移；用户改过的与旧存档组合件不动。
- [x] 测试：模板根是布局 / KPI 嵌套 / 旧基线仍可生成 / 迁移 2→3 / 用户改动不动 / FreeCard 实渲染 / 摘要递归计数。
- [x] 窄屏修复：头像按钮 `shrink-0 + whitespace-nowrap`，`sm` 以上保持两列、窄屏三组控件单行；组件库 `xl` 以下单列；最近入库 / 失败原因用容器查询；状态图例不压字；数据标签 / chip 长文案单行截断。
- [ ] 浏览器手测：11 个模板迁移前后外观、列表行高与分隔线、KPI 四层嵌套在宽 / 窄下的对齐；归 Lynx。

## 10. 验证

```bash
cd app/web
npx tsc --noEmit
npm test
npm run build
```

- 迁移：准备旧 `kc-widgets`（含 chart / table / interaction / other 四类 + 旧 kind+config）逐条读档，断言定义与放置的 id / name / spec / span / on 不丢。
- 两层：新增 / 复制只进 `kc-components`；放置动作只写 `kc-overview`；删除内置写墓碑；恢复只回库。
- 行原子：`resourceRow` 按 index 取行、状态过滤；`resourceMore` 按过滤后的行数报余量；`sessionRow` / `probeRow` 选中实体；`statusPart` 零值隐藏；旧组合件仍能渲染。
- trigger：状态选择过滤资源行并高亮状态条 / 状态项；日期选择从活动图发出并按天过滤资源行；同项再点取消；资源行点击换成资源选择；选择条清除后焦点回「自定义面板」。
- 视觉：11 张卡迁移前后在 768 / 1440 下并排比对；窄屏 412 单列；组件画廊的推荐宽度与实际卡宽；行模板的行高与空态。
- 设计面：拖动吸附、缩放最小尺寸、图层顺序、撤销 / 重做、写失败横幅逐项手测。
- 元件箱：搜索跨分组命中、五个页签切换、两列紧凑条目、数据值带 source；仓库守卫钉搜索 / 页签 / 内滚与三栏视口高度。
- 布局容器：四种容器的排布样式与子件渲染；设计态只给非布局子件盖按钮；树形查找 / 深度 / 增删移复；设计页把新元件加进选中布局、拒绝第五层；仓库守卫钉模型与接线。
- 默认模板：根是 `vbox` / `grid` / `flex`；KPI 四层嵌套含数据原子与状态条；列表模板含行原子；旧模板 `legacyTemplateFreeSpec` 仍能生成旧组合结构；FreeCard 实渲染 KPI / 最近入库 / 快捷动作。
- 迁移：旧原子默认、旧组合默认、旧 `kc-widgets` 迁出的默认都迁到 box；用户改过的组件保持原 spec；`kc-components-visual-version` 到 4。

## 11. 未决 / 风险

- 卡宽是流式的：宽屏布局只保证在参考宽度下的视觉；极端宽度（768 半行）可能文字换行，设计面提供宽度预览。
- 数据元件撑高导致重叠：v1 允许并在设计面标记；是否改成裁切 / 内滚，等真实使用后再定。
- 列表画布的双击在触屏不可靠：属性区「设计」按钮是移动端主入口。
- 跨标签页同时编辑同一实例仍会丢更新（现有 store 整数组快照写）；本 spec 不修。
- `kc-components` / `kc-overview` 是两次 `localStorage.setItem`，极端配额 / 隐私模式下可能只写成功一份；界面靠 `persistFailed` 说实话，暂不做跨键事务。
- 组件画布里 `spanHint` 只影响预览宽度；若实际概览宽度改了，画廊仍按推荐宽度展示，可能和概览观感不同。
- 状态过滤会改变行数，卡片会跟着缩高（没有保留占位）；这是筛选的真实结果，若嫌跳动，后续可加固定高度/空槽。
- 图表点选只对 pointer 生效；键盘用户走状态条 / 状态项 / 状态图例。图表内部与头像内部不拆。
- 未改过的旧默认会一次性迁到 box 模板；用户改过或仍保留旧组合件的存档不会自动重排，要看新模板用「恢复全部默认」（会丢自定义 spec）。
- 资源行 / 会话行点击现在用于选择联动，不再直接跳 `/resources` / 对话页；导航仍走侧栏。
- 布局容器内子件不能自由拖动 / 缩放；grid 没有显式行列坐标；嵌套布局只能从子件列表选中。以上是 v1 边界，不是缺陷；要升级得同时动模型、归一化与设计交互。
- 容器没有尺寸策略（min / max / 固定尺寸），子件只能靠 `grow` / `span` 分配剩余空间；复杂响应式排布仍要等后续。
- 归一化会丢弃第五层布局；若将来导入外部 spec，需要给截断提示，不能让用户以为内容还在。
- 默认模板换成 box 后，列表行高 / 分隔线 / 说明字号可能与旧的组合件有细微差异；迁移只覆盖未改过的旧默认，用户改过的组件保持原样，需要「恢复全部默认」才会换成 box 版。
- 会话底部说明与 KPI 提示依赖 `text.variant='caption'`；这是语义样式，不是完整的文字样式编辑器。
