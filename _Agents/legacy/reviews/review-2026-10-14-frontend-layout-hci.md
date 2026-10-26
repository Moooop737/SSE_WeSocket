---
type: review-report
project: Knowledge Copilot
date: 2026-10-14
scope: app/web 界面排版与 HCI 精化轮（新增 /ask 问答页、真接口接线、mock 边界）
lenses: [adversarial, edge-case-hunter, verification-gap]
persona: bmad-review
---

# 界面排版 / HCI 精化轮 — 三 lens 评审

评审对象：本轮改动的 14 个文件的**工作区当前源码**（`app/web` 整层未提交，用 diff 会混进上一轮）。
内容分类：code。每条 lens 断言都自己复核过，标 **[成立→已修]** / **[成立→记为未闭环]** / **[不成立]**。

## 〇 · 设计决定（先说清为什么这么排）

**信息架构**：侧栏从 3 项变 4 项 —— 概览 / 资源与入库 / **问答（新）** / 服务探针，开发组保留组件画廊。
问答页是 Epic 2 五个 story（2-1 检索、2-2 流式、2-3 引用、2-4 回链、2-5 多轮）的**界面先行**。

**真接口 vs mock 的边界（本轮最重要的一次纠偏）**：
初版把整页问答都当 mock 做，理由是「Epic 2 全在 backlog」。**评审第一枪就打穿了这条前提**：
`POST /retrieve` 其实已经上线（`app/server/src/index.ts:18` 挂载，`routes/retrieve/retrieve.ts` 出 hits + vectorCount + lexicalCount）。
我 curl 实测确认（200、字段 camelCase、`lexicalScore` 可为 null、空查询 400），于是改成：

| 界面元素 | 数据来源 |
|---|---|
| 检索命中面板、命中抽屉里的原文与偏移 | **真接口** `POST /retrieve` |
| 「回答」那段文字 | mock 模板（无 LLM 端点，2-2 才做）→ 带「示例数据 · 未接生成端点」角标 |
| 左侧种子会话 | mock（无会话端点，2-5 才做） |

`mock.ts` 因此**删掉了自己定义的命中类型**，改用 `api.ts` 的 `RetrievedHit` —— 一个契约只留一份，不再"界面先行的形状"和"后端已上线的形状"长两张。

**每页排版**
- 概览：撤掉四张带空图区的统计卡（没有时序端点，图区永远写「还没有时间序列数据」）→ KPI 条 + 一条状态分布（真算）+ 左「最近入库」右「服务探针胶囊」+ 一条示例数据的问答速览。
- 资源与入库：列表左 / 入库右（列表是高频阅读，之前被推到第二屏）；工具条 = 搜索 + 状态 + 排序，全在本地做，所以计数写「筛出 n / 共 m」、空态分「没有匹配 X」「没有 Y 状态的资源」「库是空的」三种说法；**点行开右侧抽屉**读分块，不再就地展开。
- 问答：主对话流（有界高度自己滚）+ 输入区；右栏 300px = 会话 + 检索命中。点 `[n]` 按 **chunkId** 定位命中并高亮，点命中开抽屉。
- 服务探针：健康胶囊从侧栏搬到这里页头（侧栏极简是 Lynx 定过的形，探针页才是它的语境）。

**交互细节**：删除走就地二次确认（3s 自动收回、至多一行 armed、焦点进确认条就暂停倒计时），列表与抽屉两个入口都要两步；行靶改成 `absolute inset-0` 的透明按钮，让 hover 高亮的面积等于可点面积；`mod+K` 聚焦 Find 从"画了键帽没监听"变成真监听（且窄屏 Find 隐藏时不吞浏览器默认行为）；Alert 补 `role=status/alert`；抽屉补 `aria-labelledby` + Tab 圈 + 背景滚动锁。

## 一 · 三 lens 命中并已修的真问题

| # | 位置 | 问题 | 修法 |
|---|---|---|---|
| 1 | `mock.ts` / `ask.tsx` | **前提错**：检索被当 mock 做，而 `POST /retrieve` 已上线 | 检索改真接口；mock 只留生成与会话 |
| 2 | `knowledge.tsx` | 一次在飞的轮询会在 DELETE 成功之后把刚删那行放回列表 | `use-resources.ts` 里 `mutationSeq`：变更前置代次，落地时 seq 不最新就丢 |
| 3 | `drawer.tsx` | `onClose` 是行内箭头函数却进了 effect 依赖 ⇒ 开着抽屉时每 3s 轮询重跑「记 opener + 抢焦点」，用户刚 Tab 到「复制 id」就被拽回面板顶；opener 还可能是已卸载节点 | onClose 收进 ref、effect 依赖只剩 `[open]`；归还焦点前查 `isConnected` |
| 4 | `knowledge.tsx` + `drawer.tsx` | 抽屉页脚「删除资源」**一步就删**，而列表里同一个动作要两步；`drawer.tsx` 文件头还写着"抽屉里不放破坏性动作" | 抽屉也走 armed 二次确认（换资源/关抽屉自动收回），注释改成真话 |
| 5 | `resource-list.tsx` | 注释写「改点别行就自动收回」，代码里 `confirming` 是行内私有 state，两行能同时挂着「确认删除」 | armed 提到调用方（`confirmId`/`onArmConfirm`），至多一行 |
| 6 | `resource-list.tsx` | 动作槽固定 `w-24`(96px)，确认条两个文字按钮约 102px 会撑爆压到日期 | 改 `min-w` + `whitespace-nowrap`；日期在 <xl 隐藏 |
| 7 | `resource-list.tsx` | 文件头说「整行可点」，实际只有标题那段 button 可点，点日期/类型没反应 | 行靶 `absolute inset-0`，源链接与动作簇 `z-10` 盖回自己那片；补 `aria-label`/`aria-expanded` |
| 8 | `knowledge.tsx` | 搜索有词、0 命中时报「知识库还是空的」（谎报，用户会去重传一条已存在的 URL 拿 409） | 空态三分：匹配不到 / 状态筛空 / 真库空 |
| 9 | `knowledge.tsx` | `key={resetToken}` 每次入库成功 remount 整棵列表，注释说"重置分页与展开态"而这两样本轮已不存在；代价是无声吞掉刚武装的确认条 | 删掉 resetToken，只 `setConfirmId(null)` + silent 重取 |
| 10 | `knowledge.tsx` | `busyId` 单槽：A 在飞时点 B，B 的 finally 把 A 的禁用态提前解除；抽屉页脚两个按钮完全不看 busy | 改 `Set<string>`；抽屉按钮 `disabled={selectedBusy}` + 入口 `if (busyIds.has) return` |
| 11 | `knowledge.tsx` | 抽屉元信息跟着轮询走，分块只在 id 变化时取 ⇒ processing 行开抽屉后转 ready，分块永远显示「还没有」 | effect 依赖加 `Resource.status` |
| 12 | `ask.tsx` | `extra`/`hits` 是页级单槽 ⇒ 会话 A 的问答会出现在 B 里；「新会话」既不换 id 也不加条目，点了等于没动；520ms 裸 setTimeout 不清理 | 消息与命中按 sessionId 分桶；`mockNewSession` 真建一条并切过去；整条链路改 async + `mounted`/发起会话比对 |
| 13 | `ask.tsx` | 引用标号按**数组下标**对命中，而 `mockHitsFor` 会轮换 ⇒ 点 `[1]` 亮的是别的块（三条种子会话全错位）；`activeCite` 换问题后不清零 | 引用自带 `chunkId`，按身份定位；种子引用不在本次命中时明说「属于示例历史」 |
| 14 | `ask.tsx` | 流容器 `min-h + flex-1` 外面没有任何高度约束 ⇒ 永不 overflow、`onScroll` 永不触发、"贴着底才跟滚"两条承诺都不成立 | 容器给有界高度 `h-[min(54dvh,36rem)]` + ResizeObserver 跟内容长高 |
| 15 | `mock.ts` | 回答 id 只由问题长度决定（`Hits.length` 恒 4）⇒ 问两条等长问题就撞 React key；`created_at` 写死种子会话时间 ⇒ 新回答比它自己的问题还早 | 自增 counter + 真 `new Date()` |
| 16 | `mock.ts` | `Hits[0..2]` 无判空直取 ⇒ 真检索 0/1 命中时整页崩进 RouteError；且没有拒答分支 | 0 命中走拒答文案；条数按实际生成 |
| 17 | `index.tsx` | 概览写着「列表每 3s 自动刷新」，而轮询只在资源页存在 —— 正是本轮刚立的黑帽规矩（画了键帽没监听）的文案版 | 抽 `use-resources.ts` 两页共用，Hint 改「每 3s 自动刷新」并真成立 |
| 18 | `knowledge.tsx` | 两栏阈值在 lg(1024)：左列只剩约 360px，固定段超 340 ⇒ 标题压成 0、动作按钮溢出卡外（1280 验收正好躲过） | 阈值提到 xl；1024/900 实测 `scrollWidth-clientWidth = 0` |
| 19 | `sidebar.tsx` | <lg 时 Find 是 `display:none`，`focus()` 静默失败却已 `preventDefault` ⇒ 既没反馈又吞掉浏览器自己的 mod+K | 先判 `offsetParent`，不可见就直接 return |
| 20 | 多处 | `stream_ms` 字段没有任何读取方（注释却写"打字机用它"）；画廊 `demoSelected` 是死状态（注释说点行开抽屉，实际没人消费）；`STATUS_ORDER[s]` 遇未知状态返回 NaN 让排序每次洗牌；`Resource` 类型重复 import | 删死字段；画廊接上真 Drawer（并说明示例 id 不打接口）；`statusRank()` 兜底；清 import |
| 21 | a11y | Alert 没有 live region（删除/取消全靠它说话）；抽屉 aria-modal 却没焦点圈、没可及名、背景还在滚；探针 ok/失败只靠点色 | `role=status/alert`；`aria-labelledby` + Tab 回绕 + `body.overflow`；摘要补 `title` |
| 22 | `health.tsx` | 空态文案硬编码 `127.0.0.1:3000`，而 `api.ts` 文件头声称"改端口只需动两处" | 用 `BACKEND_LABEL` 常量 |

## 二 · 复核后判为不成立 / 不必做

- **「轮询是为了看见处理中」这条注释被指为假**：部分成立。POST 返回时那行确实已经落库，但 202 之后 processing→failed 的迁移没有任何推送 —— 注释已按这个真口径改写。
- **「给被闸挡住的实例加排队重试」**（上一轮同类建议）：不做。现行页面同时最多 1 个 WebGL context，到不了那条路径。
- **`File.text()` 大小上限**：成立但属输入健壮性，且"多大算大"是产品判断 → 记进 `frontend-deferred.md` 等拍板。
- **两套 tone 词汇合并 / `api.ts` 与后端类型通路**：既有债，不属本轮界面范围。

## 三 · 实测证据（第三方照这几条能复跑）

| 断言 | 实测 |
|---|---|
| `POST /retrieve` 真实可用 | `curl -X POST :3000/retrieve -d '{"query":"切块重叠设多大","limit":3}'` → 200，hits[0] = PRD 块 17、`similarity 0.493`、`lexicalScore null`；空 body → 400 |
| 问答页走的是真接口 | 浏览器内 `fetch('/api/retrieve')` 与页面同请求；当前库为空时页面如实渲染拒答分支（"库里没查到…可能原因"），不是假数据 |
| 5 条路由 0 报错 | Playwright 遍历 / /knowledge /ask /health /components：`pageerror` 与 console error 均为 0（唯一一条 400 是我自己发的诊断请求） |
| 抽屉链路 | 资源页点行 → dialog 出现、渲染 13 个真 chunk `<pre>`；Esc 关 → dialog=0；开着抽屉静置 3.6s（轮询期）焦点仍在「复制 id」 |
| 二次确认 | 点删除出现确认条；连点两行时**同时 armed 只有一条**；点收回行数不变（没真删，不动用户的库） |
| 引用定位 | 命中行 `id="hit-<chunkId>"`，点 `[n]` 后 `button.bg-accent-soft` 计数 1（按身份，不按名次） |
| 窄屏不溢出 | 1024×800 与 900×800 下 `scrollWidth - clientWidth = 0` |
| 构建 | `npm run build` 绿：CSS 36.98 kB（gzip 8.02）、JS 598.88 kB（gzip 204.69）。上轮基线 31.27 / 559.59 |
| 视觉记录 | 16 个组件 × 两档 = 32 张参考图重截（含 5 个新组件首次出图），mtime 全晚于源码 |

## 四 · 还没闭环（诚实清单）

1. **真删 / 真取消没实跑**：会动 Lynx 的本地库，只验到"确认条出现与收回"。定论证据写在 `frontend-deferred.md`，由他在浏览器走一遍。
2. **命中→高亮→抽屉这条链只在空库下跑过真接口**：本轮期间本地库被并行会话清空（`GET /resources` 返回 `[]`），所以真命中的高亮与抽屉是用画廊的 `DEMO_HITS`（字段与真返回逐一对齐）验的。库里有货时应让他再扫一眼。
3. **流式是真 mock**：回答晚 ~420ms 整段出现 + 按行 stagger，不是逐 token；`Reveal` 用组件内 seen 集合避免"切回老会话重播"。2-2 接 `streamText` 时这条要重做。
4. **`/ask` 与 mock 层还没进任何 git**：`app/web` 里它们是 `??` 未跟踪，外层 `.gitignore` 又屏蔽 `app/`。提交与否由 Lynx 定。
5. `app/web` 零测试零 lint：上面那些"只有注释在守"的规矩（轮询只在 processing 时开、引用按 chunkId 对、mock 不再定义命中类型）没有工具会拦回归。
