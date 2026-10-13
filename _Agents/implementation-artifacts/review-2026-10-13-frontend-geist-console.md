---
type: review-report
project: Knowledge Copilot
date: 2026-10-13
scope: app/web 前端（未提交，39 文件 / 3136 行 diff）
lenses: [adversarial, edge-case-hunter, verification-gap]
persona: bmad-review
---

# 前端 Geist 控制台改造 — 三 lens 评审报告

评审对象：`/tmp/kc-review/review-diff.patch`（app/web 未提交工作，含未跟踪新文件）。
内容分类：**code**。跑 `adversarial` / `edge-case-hunter` / `verification-gap` 三个独立 lens；`structure`、`prose` 只适用文档，未跑。
下文按 lens 分组，**重叠项保留并标注**（重叠本身是信号）。修复状态见每条末尾的 `[已修]` / `[待办]`。

## 一 · 必须先修的真 bug（三 lens 交叉命中）

| # | 位置 | 触发条件 | 后果 | 状态 |
|---|---|---|---|---|
| 1 | `ui/health.tsx` 传 `{items.length>0 && (…)}` 作 children，`stat-card.tsx` 用 `children ?? 兜底` | `items` 为空时 children 是 `false`，`??` 只兜 `null/undefined` | /health 上 db、ollama 两张卡的图区变成空白盒子，点阵与"该探针不返回明细"都不渲染 | [已修] |
| 2 | `probe-chip.tsx` `detailList` 只认数组 | 后端 `health.ts:33` 探针抛错时给的是 `detail: String(err)` | Ollama 没起时的具体原因（ECONNREFUSED…）被前端扔掉，只剩一个 `—` | [已修] |
| 3 | `field.tsx` 滑块同时写 `animate={{width}}` 与 `style={{width}}`；RO 只观察容器 | React 每帧用 style 硬写终值、Motion 从 0 spring；Geist 变量字体到货后文字变宽但容器没变 | 滑块塌回再长出、或永久偏窄 —— 正是该文件注释声称已消灭的"闪没"，只是换了成因 | [已修] |
| 4 | `__root.tsx` `AnimatePresence mode="wait"` 里放裸 `<Outlet/>` | pathname 变了但退场元素仍挂 180ms，其内部 Outlet 读实时路由 → 渲染的是**新**页面 | 每次导航双发 `GET /resources`、退场期看到的是新页骨架；接真检索端点后会双发 LLM 请求 | [已修] |
| 5 | `theme-toggle.tsx` 用 `useState` 存档位 | 侧栏与画廊各一只；画廊点了，侧栏那只仍是挂载时的旧值 | 显示"跟随系统"实际是深色，下一次点击从错误档位往后跳 | [已修] |
| 6 | `theme.ts` 顶层裸访问 `localStorage`，`main.tsx` 在 `createRoot` 前调用 | 隐私模式/禁用存储时 `setItem` 抛错 | 整个应用白屏，且没有任何错误边界 | [已修] |
| 7 | `index.css` `--color-accent` / `--color-accent-strong` 两档共用单值 | 暗档 `#0a0a0a` 上 `#0070f7` ≈3.7:1，hover 还往更暗走 | 暗档所有链接与文件选择器文字发灰、像被禁用；13px 文字不达 WCAG AA | [已修] |
| 8 | `shader-backdrop.tsx` 每页 4–5 个 WebGL context（`/` = 4 DotGrid + 1 MeshGradient） | 库卸载路径里 `initShader()` 是未 await 的 async，cleanup 时 mount 还是 null 就跳过 dispose；也不调 `loseContext()` | Chrome 约 16 个 context 打满后 `getContext` 返回 null → 库 `throw` 成 unhandled rejection（React 边界抓不到），装饰层随机变黑 | [已修] |
| 9 | `api.ts` `IngestAccepted` 没有 `warning` | 后端 `resources.ts:110` 明确会在 201 带 `warning`（`pipelines.ts:95` 的 `thinPage()`） | 抓到 JS 壳页/半空正文被报成干净成功，正是 P1 该暴露的失败模式 | [已修] |
| 10 | `ingest-panel.tsx` 未防 `resource: null`；`api.ts` 对 `{}` 兜底后直接 `.resources` | 2xx 但 body 形状不符、或建行前非重复拒绝 | `undefined.status` / `undefined.map` 抛错，被翻成假的"后端不可达" | [已修] |

## 二 · 动画覆盖与消失（owner 重点 1）

- `resource-list.tsx`：`motion.li` 写了 `exit` 但外层没有 `AnimatePresence` → 筛选/刷新删行是瞬间消失；`layout` 与子面板 `height` 补间两套时序打架，行内文字被轻微拉伸。`[已修]`
- `resource-list.tsx`：`toggleChunks` 无请求代次 → 点 A（慢）再点 B（快），A 的响应覆盖 B 的面板，显示"B 展开、里面是 A 的分块"。`[已修]`
- `resource-list.tsx`：分块请求失败与"该资源真的 0 块"渲染成同一句话。`[已修]`
- `resource-list.tsx`：每次刷新重播整列 stagger，40 行时最后一行延迟 1.2s。`[已修]`（delay 封顶）
- `index.tsx` Banner 三元分支互换时同类型同位置 → 文字直接替换、消失无退场。`[已修]`
- `knowledge.tsx` Alert 无 `key` → 成功条被错误条覆盖时只有文字变，没有动效。`[已修]`
- `nav-item.tsx` Find 过滤掉当前项时，条件挂载的 `layoutId` pill 中途卸载 → 指示块闪没。`[已修]`
- `prefers-reduced-motion` 只兜住了 MeshGradient 的 speed，页面切换/弹簧/stagger/`animate-pulse`/骨架高光照跑（产物里 `prefers-reduced-motion` 计数为 0）。`[已修]`
- `page-header.tsx` `grid-cols-[1fr_auto_1fr]`：`1fr` 即 `minmax(auto,1fr)`，左右槽 min-content 不等时"居中"标题其实偏心。`[已修]`
- `select.tsx` 浮层被画廊样例的 `overflow-hidden` 裁掉；`sticky` 在样例框里粘成怪线。`[已修]`
- `router.tsx` 缺 `scrollRestoration`：从很长的 /components 滚到底再切页，新页从旧位置开始。`[已修]`

## 三 · 边框 / 尺寸 / 一致性（owner 重点 2）

- 实测产物：Tailwind 对 `rounded-[4px]`、`text-[13px]`、`h-9` 这类任意值一律正常编译 → **构建绿不代表值取自 token**，没有 lint 兜底。
- 控件高出现三套并存：`h-10`=40（TextInput、Button md）、`h-8`=32（Select 触发器、Find 框）、`h-7`=28+`p-0.5`=32（分段项）；而 `index.css:6` 与 `field.tsx:2` 都写着"统一 40px"。`[已修]`（新增 `--spacing-control` / `--spacing-control-sm` / `--spacing-row` / `--spacing-header` / `--radius-control-sm` token 并替换字面量）
- 裸 `rounded`（=4px）与 `rounded-[4px]` 两种拼法并存于 `tag`、`sidebar`、`empty-state`。`[已修]`
- `--color-sunken` 定义了但无 utility 引用 → 被 Tailwind 摇掉，产物里不存在；而 shader 的 DotGrid `fill` 手抄的正是这个值。`[已修]`（点阵改走 CSS，直接读 `var(--color-sunken)`）
- shader 色板与 `@theme` 是两份手写副本，且两档取了不同语义 token（亮档 sunken、暗档 line）；另有 avatar 渐变、骨架高光两处 index.css 不拥有的色。`[已修]`
- `×` / `✓` / `›` 三个裸字符与手写图标集并存，`›` 参与 rotate 动画时基线会漂。`[已修]`（补 `close`/`check`/`chevron-right` 图标）
- `NavItem` 的 `collapsible` prop 全项目无人传 → 假的"可展开分组"暗示。`[已修]`（删）
- `127.0.0.1:3000` 在 UI 文案里出现 5 次 + `vite.config.ts` proxy 一处。`[已修]`（收敛到 `api.ts` 一个常量）
- 暗档 primary 按钮 `bg-ink + text-white` = 浅灰底白字，几乎不可读（本轮已发现并修：`text-canvas`）。

## 四 · 验证缺口（verification-gap）

- `app/web` **零测试设施**：scripts 只有 dev/build/preview，无 vitest 配置、无 test 文件、无 eslint/stylelint/biome。全仓 3 个测试文件都在 `app/server`。
- **F1 前后端契约靠手抄**：`api.ts` 的 `Resource`/`Chunk` 是 `app/server/src/types/types.ts` 的手工副本，两侧无类型通路（`app/web/tsconfig.json` 只 include src）。后端改名字段时 `tsc` 与 `build` 全绿，只是失败原因文字、分块区间标签静默变空。上一版已经漂过一次且没人发现（旧 `App.tsx` 的 `checks:{db:boolean}` vs 后端 `{ok,detail}`，渲染成 `[object Object]`）。
- **F2 `warning` 未采纳**：见一.9，后端侧也没有任何东西钉住这个字段。
- **F3 "滑块闪没已修"只由一张静态截图支撑**；F4 页面切换动画与 `notFoundComponent` 分支从未被执行过（本轮后端一直没起，只截了 4 条路由）。
- **F5 reduced-motion 只在 shader 落地**，且 helper 未导出，兄弟组件连复用入口都没有。
- **F8 HealthPill 是孤儿组件**：文件头说"数据由 `__root` 持有并拉取"，而 `__root.tsx:4` 明确写"全站健康状态不放这里"，唯一引用在画廊里喂假 props。两份文档互相指认。
- **F9 视觉记录本身不可核对**：每组件只存 1 张 PNG、文件名不含主题标识，Playwright 未留可复跑脚本 → "双档都验过"无法被第三方复核。
- **F20 仓库卫生**：`src/routeTree.gen.ts` 与 `.tanstack/` 未跟踪也未忽略；干净 clone 上 `npm run build` 第一步 `tsc --noEmit` 就会 TS2307。

## 五 · 判定

第一轮**不通过**：十条交叉命中的真 bug + 一批动画/一致性问题。本轮已全部落地修复并复跑三 lens，结果见同目录后续报告。
