# Frontend Deferred — Knowledge Copilot

> `app/web` 有意**推迟的功能项**清单。与 `review-2026-10-13-frontend-geist-console.md` 不重叠——那份记的是视觉/一致性/动画问题，这份只记"后端已就绪、前端没接"。
> 一条一项：缺口在哪、后端到什么程度、什么证据能定论。

## Story 1.4 知识库查看与删除 —— 界面动作 **已全部接上（2026-10-14）**

下面四条纯前端项在 2026-10-14 的界面轮里逐条闭合（落点与本轮 review 见 `review-2026-10-14-frontend-layout-hci.md`）：

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

本节四条已闭合，无需回来做。**新的前端挂起项**（2026-10-14 界面轮留下，见 review 文档 §未闭环）：

- `/ask` 的「生成回答」仍是模板文字：`POST /retrieve` 已上线且被真调用，但还没有 LLM 端点（Story 2-2 才接 `streamText`）。接上时只换 `ask.tsx` 里 `mockAnswerFor` 那一步，命中面板与引用映射已经是真数据。
- 会话列表 / 多轮：`mock.ts` 里的种子会话与 `mockNewSession` 是本地的，等 `sessions/messages` 端点（Story 2-5）。注意已定口径：**会话所有权在客户端**，别在业务 SQL 里加 owner 谓词。
- 入库面板的文件选择没有大小上限，`File.text()` 也没有 try/catch（选到几百 MB 的 txt 会冻住标签页）。属输入健壮性，等动入库界面时一起拍。
