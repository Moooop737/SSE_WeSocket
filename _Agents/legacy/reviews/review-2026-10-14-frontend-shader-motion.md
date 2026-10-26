---
type: review-report
project: Knowledge Copilot
date: 2026-10-14
scope: app/web 前端「纸 · 光 · 呼吸」装饰效果层（Paper Shaders + Motion）
lenses: [adversarial, edge-case-hunter, verification-gap]
persona: bmad-review
---

# 装饰效果层（Paper Shaders + Motion）— 三 lens 评审

评审对象：本轮新增/重写的设计效果层源码（工作区当前内容，非 diff —— app/web 整层尚未提交，diff 会把上一轮 Geist 改造混进来）。
11 个文件：`shader-backdrop` `banner` `stat-card` `empty-state` `page-in` `page-header` `ingest-panel` `resource-list` `index.css` `ui/index.tsx` `ui/components.tsx`（画廊）。
每条 lens 断言都经过复核，标注：**[成立→已修]** / **[成立→记为未闭环]** / **[不成立（已否证）]**。

## 〇 · 这轮做了什么设计

**纸 · 光 · 呼吸** 三层语义，一条预算闸，一个色值真值来源：

| 层 | 载体 | 用在哪 | 成本 |
|---|---|---|---|
| 纸 paper | CSS `.paper-grain`（7px 近点 + 23px 远点 + 105° 斜光泽） | 统计卡图区、空态、画廊 | 0 个 WebGL context |
| 光 light | `MeshGradient`，色相随 `tone` | Banner（danger/warning/accent = 严重度） | 1 个 |
| 呼吸 pulse | `PulsingBorder` | 入库提交中的面板边框 | 1 个 |

三条硬规则：
1. **每层都有地板**：light 的地板是同色相平涂 `bg-glow-*`，pulse 的地板是「不画」。首帧（预算在 effect 里才分到）不闪点阵，库初始化失败也不留空盒子。
2. **色值只有一个真值来源**：JS 探针读 `@theme` 的 `var()`，不再手抄第二份色板（上一轮的账）。
3. **WebGL 有闸**：同时在场上限 3，抢不到只画地板；释放时显式 `loseContext()`。

## 一 · 必须修的真问题（已修，附证据）

| # | 位置 | 问题 | 修法 | 来源 |
|---|---|---|---|---|
| 1 | `index.css` `@theme` | Tailwind v4 只把「被 utility 用到」的自定义属性落进 CSS，探针读的 `--color-glow-*` 没有 utility 消费者 → 会被摇掉，探针静默回落成灰 | 整个 `@theme` 改 `static`；并给探针加哨兵灰 + `console.warn` | V2 **[成立→已修]** |
| 2 | `shader-backdrop` | 库的 `dispose()` 只 `canvas.remove()`，全包 `grep loseContext` 命中 0 → context 等 GC，反复导航会打满 Chrome 约 16 个的配额 | 释放名额时对 `hostRef` 里的 canvas 显式 `loseContext()` | A#1 / V1 **[成立→已修]** |
| 3 | `shader-backdrop` `FadeIn` | Motion 把 `opacity` 写成内联 style，盖掉了调用方传的 `opacity-45` → 那圈呼吸光一直是全强度 | 拆两层：外层挂 className，内层做淡入 | 自查（截图对比发现）**[成立→已修]** |
| 4 | `shader-backdrop` | `granted` 首帧为 false → 直接露出点阵地板，Banner 每次换档「点阵→渐变」跳一下 | light 的地板换成同色相平涂，跳变变成淡入 | A#4 **[成立→已修]** |
| 5 | `shader-backdrop` `webGlAvailable` | 探到 null 就永久记 false，但配额打满时也返回 null → 一次 unlucky 探测让全站永久降级 | 只有抛异常才永久记 false；负结果不写死 | A#3 **[成立→已修]** |
| 6 | `stat-card` `CountUp` | JSX 里渲染 `shown.current`（浮点），补间中任何父级重渲染会把 `6.8371558…` 写回 DOM | 渲染 `Math.round(shown.current)` | A#9a **[成立→已修]** |
| 7 | `stat-card` `StatValue` | `typeof value === 'number'` 放过 NaN/Infinity/小数 | 改成 `Number.isInteger` 才补间 | A#9b **[成立→已修]** |
| 8 | `stat-card` | children 兜底写的是 `=== undefined`，而 `{cond && <X/>}` 传进来的是 `false` → 上一轮 review 的「已修」其实没修掉，只是调用点恰好显式传了 `undefined` | 改真值判断，并把注释改成真规则 | V7 **[成立→已修]** |
| 9 | `resource-list` | 文件头写「分块请求带代次号」，代码里只有 `panel?.id === Id` —— 同一行连点两次照样互相覆盖 | 加 `epochRef`，代次不是最新就不写面板 | A#18b **[成立→已修]** |
| 10 | `resource-list` `alert` | 补间的是 `height`，`MotionConfig reducedMotion` 只管 transform → 减动效用户照样看到行高抖 | 两处时长按 `useReducedMotion()` 掐 0 | A#12 / V6 **[成立→已修]** |
| 11 | `ingest-panel` | 提交锁只锁鼠标（`pointer-events-none`），Enter 在输入框里触发隐式提交 → 连按两次 = 两条 POST，第二条拿 409 被翻成用户无意造成的警告 | `onSubmit` 首行 `if (submitting) return` + 表单 `aria-busy` | A#10 **[成立→已修]** |
| 12 | `index.css` | 自己写的色差判据（≥20/255）按现值算不达标：暗档 neutral 最大 18、亮档 paper-near 19 | 判据明确成「与同档 canvas 的**逐通道最大差** ≥20」并把不达标的两档抬上去 | A#15 / V3 **[成立→已修]** |
| 13 | `banner` / `page-in` / `components` | 三处注释与画面不符：`TONE_ICON` 装的是颜色类；画廊 page-in 样例是普通 div 根本不会动；「顶栏先落、内容随后」实际是卡片先落 | 改名 `TONE_FG`；样例改成真接 variants 的 `motion.div`；卡片 delay 基线抬到 0.12 | A#13 / A#16b **[成立→已修]** |
| 14 | `shader-backdrop` / `index.css` | 注释说「渐变取四色」而数组是六笔；新引入 `h-32` 字面量违反本文件自己定的 token 规则 | 注释改成实测理由；加 `--spacing-panel` 并替换 | A#14 / A#17 **[成立→已修]** |

## 二 · 复核后判为不成立 / 部分成立

- **A#15「pulse 的 neutral 档是死分支」**：不成立。画廊的 tone 切换器能选到 neutral 且同时驱动 light 与 pulse，是活路径；只把它的取色从 `line` 换成 `ink-faint`（暗档 `line` 是 #1f1f1f，环会跟容器边框糊成一条）。
- **A#2「库 init 抛错抓不到、会留空盒子」**：机制成立（`initShader()` 是未 await 的 async），但后果已被 #4 的地板层消解 —— 抛错时留在平涂地板上，视觉不缺块。`unhandledrejection` 全局兜底**没做**（见未闭环 3）。
- **V8「api.ts 与后端 types 手抄」**：成立，但属 Epic 1 既有账（上一轮 review 的 F1），不在本轮装饰层范围内，未动。
- **V4「46 张参考截图早于新视觉」**：成立。本轮没重截（见未闭环 1）。

## 三 · 实测证据（第三方要复现，照这几条跑）

| 断言 | 实测 | 怎么复跑 |
|---|---|---|
| 构建绿 | `tsc --noEmit && vite build` → CSS 31.27 kB（gzip 7.11）、JS 559.51 kB（gzip 191.72）。基线（上一轮）510 kB / gzip 164 | `cd app/web && npm run build` |
| `@theme static` 真把 token 落进 CSS | 改前 `--color-accent-soft` / `--color-accent-ink` 在 dist CSS 里 **0 次**，改后各 **1 次**；`--spacing-panel` 同 | `for t in --color-accent-soft --spacing-panel; do grep -c -- "$t:" dist/assets/index-*.css; done` |
| 探针拿到的是解析后色值 | 亮档 `--color-glow-accent` → `rgb(219, 234, 255)`；库 `getShaderColorFromString` 认逗号 `rgb()` 语法（`shaders/dist/get-shader-color-from-string.js:18-21`） | Playwright `getComputedStyle` 探针 |
| WebGL 不泄漏 | / ↔ /components 连跑 5 轮：画廊恒 3 个 canvas、概览恒 0；随后一次性再申请 **12/12** 个 context 全部成功（泄漏的话这里会开始返回 null）；控制台 0 error | 见本仓 `.playwright-mcp/`（该目录被根 .gitignore 忽略，脚本没入库） |
| `PulsingBorder` 的 `scale` 必须显式写 | 库 `defaultPreset.params.scale = 0.6`（`shaders-react/dist/shaders/pulsing-border.js:24`，:156 处取默认），不覆盖时环只画在容器中央 60% 区域 —— 截图实测过 | 打开画廊 `#demo-shader-backdrop` 对比 |
| 来源切换补间停在自然高度 | 点「Markdown / 纯文本」后 textarea `height: 200px`、无 transform 残留 | Playwright click + `getBoundingClientRect` |
| reduce 档两侧都成立 | 打开 `prefers-reduced-motion: reduce` 重进画廊：CSS 侧 `.skeleton::after` 的 `animationName` = **none**；WebGL 侧 3 个 canvas 全在、且 light 画出的是**有结构的定格渐变而不是平涂地板**（说明 speed=0 仍完成过首帧绘制） | Playwright `browser_emulate_media({reducedMotion:'reduce'})` → 重载 `/components` → 截 `#demo-shader-backdrop` |

## 四 · 第三轮：edge-case lens（第一次跑挂，重跑后 17 条）

它读的是**修复前**暂存的内容快照，所以 8 条与第一节重合（`@theme static`、负探测不缓存、`loseContext`、哨兵探针、`Math.round`、`Number.isInteger`、代次号、height 的减动效闸门）—— 复核后确认现行代码已修，其中**「负探测不缓存」与「哨兵探针」两条被独立二次命中**，说明这两处判断不是偶然写对。

真正新账 5 条，全部已修：

| # | 位置 | 问题 | 修法 |
|---|---|---|---|
| E1 | `ingest-panel.tsx` | **pulse 层会整块盖住表单**：ShaderBackdrop 是 `absolute inset-0` 的兄弟节点，而定位元素在层叠里排在普通 in-flow 块**之上**；`colorBack` 又是实色 canvas ⇒ 提交中输入框与按钮被画布糊掉。画廊那个样例没暴露它，因为它的内容层写了 `relative` | `<form>` 加 `relative` |
| E2 | `ui/index.tsx` | 每次点「刷新」四张卡的 CountUp 被骨架卸载重挂，**从 0 重数**——count-up 要表达的恰是"从上一个数走到下一个数" | `loading={loading && resources.length === 0}` |
| E3 | `ui/index.tsx` | 后端多一个状态时 `base[item.status] += 1` 先造出 NaN 键，「总数」≠ 三张卡之和（且现在 count-up 会把 NaN 显示出来） | `if (item.status in base)` |
| E4 | `shader-backdrop.tsx` | paper 档也照跑两只色板 ⇒ 每张卡每次渲染 8 次强制 `getComputedStyle`；paper 满屏都是 | `needsGl` 门住三个 `useMemo` |
| E5 | 三处注释说谎 | ① 文件头写 `loseShaderContext()`，函数其实叫 `releaseWebGl`；② "Banner 换 tone 时先 release 再 acquire" —— effect 依赖是 `[variant]`，tone 根本不触发；③ `index.css` 说工具类"仍能覆盖"`.paper-grain`，实际只覆盖底色，`background-image` 两层点阵 + 斜光盖不掉 | 三条都按代码真值改写；②顺带把不变量说清：**真页面同时最多 1 个 context**（光只在概览、呼吸只在入库页），画廊一次占满 3 是刻意压边界 ⇒ 现行页面到不了"被闸挡住"，因此**不加排队重试**（为到不了的状态写代码） |

未修 1 条，判为不属本轮：**E6** `onPickFile` 里 `File.text()` 无 try/catch、也没有大小上限（选到几百 MB 的 txt 会冻住标签页）。属入库面板的输入健壮性，不是装饰层，且会牵动"多大算大"的产品判断 —— 留给 Epic 2 动界面时一起拍。

## 五 · 视觉记录已刷新（原未闭环第 1 条已结）

`shader-backdrop / banner / stat-card / empty-state / ingest-panel / resource-list / page-in / page-header` 八个组件 × 两档 = **16 张参考图重截**，mtime 全部晚于对应源码。
跑法（可复跑，不再依赖被 ignore 的临时脚本）：Playwright MCP `browser_run_code_unsafe` → 逐 `#demo-<组件名>` 元素出图，主题靠 `document.documentElement.dataset.theme` 现切（不必重载，探针与 CSS 都跟着走）。

## 六 · 终检

`npm run build` 绿：CSS 31.27 kB（gzip 7.11）、JS 559.59 kB（gzip 191.74）。reduce 档、双主题、5 轮导航的 context 计数均按第三节复跑过。

## 七 · 还没闭环（诚实清单）

1. ~~参考图没重截~~ → **已重截**（见第五节：8 个组件 × 两档 = 16 张，mtime 全晚于源码）。**其余 21 个组件的图未动** —— 本轮没改它们的外观，但 `@theme static` 之后它们与 dist 的对应关系没再逐张核过。
2. ~~**reduce 档没实测**~~ → **已实测（本轮收尾时补跑）**：`reducedMotion: reduce` 下 CSS 侧 `animationName: none`、WebGL 侧 light/pulse 都画出了定格帧（不是退回地板）。V5 那条「speed=0 时第一帧靠 ResizeObserver 初次回调，属运气」的担心，在实测里没复现问题，但**机制上仍然没有断言守着** —— 库升级后要复验这一条。
3. **真库提交中的 pulse 没跑过**：画廊是 dryRun，进不到 `submitting` 分支；只在画廊以 `variant="pulse"` 直接渲染验过外观。写库会动 Lynx 的本地库，没擅自做。
4. **`unhandledrejection` 全局兜底没做**：地板层挡住了视觉后果，但库 init 真抛错时控制台仍会有一条 unhandled rejection。
5. **tone 词汇表仍是两套**：`ShaderTone`（装饰层）与 `NoticeTone`（结果条）各自成立，概览页手工映射。合并成一份是设计上的债，本轮没动（会牵动 Alert 的三档语义）。
6. `app/web` 零测试零 lint（按项目规矩不由 agent 主动加）；上面那些「只有注释在守的规矩」（色差判据、scale 必须显式、@theme static）没有任何工具会拦回归。
