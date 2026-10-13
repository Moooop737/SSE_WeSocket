# Frontend Deferred — Knowledge Copilot

> `app/web` 有意**推迟的功能项**清单。与 `review-2026-10-13-frontend-geist-console.md` 不重叠——那份记的是视觉/一致性/动画问题，这份只记"后端已就绪、前端没接"。
> 一条一项：缺口在哪、后端到什么程度、什么证据能定论。

## Story 1.4 知识库查看与删除 —— 界面动作没接（2026-10-13，Lynx 定：暂缓）

后端三条 AC 已全部落码并实测（`softDeleteResource`、`DELETE /resources/:id`、`POST /resources/:id/abort`、写库守卫、`fail()` 日志），下面四条纯前端：

- **`api.ts` 没有 `deleteResource` / `abortIngest`** —— 全库 grep 确认：前端没有任何地方发 `DELETE` 或 `/abort`。后端已就绪：`204/404/400` 与 `202/404/409`。
- **`ui/knowledge.tsx` 列表行没有「删除」按钮** —— ready / failed 两种行都该有。
- **processing 行没有「取消」按钮** —— 这是唯一能让 `/abort` 可达的入口。
- **没有列表轮询（上面两条真正的工作量在这里）** —— `grep setInterval|refetch|setTimeout` 在 `ui/` 下全空。现状链条：`POST /resources` 会一路跑到 ready 才返回，前端就在那儿 `await`，期间列表不刷新 ⇒ 那条 `处理中` 的行在界面上**根本不出现** ⇒ `/abort` **没有任何可以被点到的时刻**；202 之后 UI 也不会自己变 `失败`；删除完也要手动刷新才消失。
  - 最小做法（不引依赖、不动后端）：`useEffect` 挂 `setInterval`，**列表里存在 processing 行时才轮**（约 3s），没有就停；保留现有手动刷新兜底。
  - 定论证据（**由 Lynx 自己在浏览器验**）：起后端 + `npm run dev` → 提交一个真 URL → 肉眼能在列表里看到「处理中」→ 点「取消」→ 数秒内该行自己变成「失败 · 入库取消」→ 点「删除」→ 行消失且 `GET /resources` 不再返回它。

## 记一笔防止被重复当成待办

- `warning` 已经渲染了：`ui/components/ingest-panel/ingest-panel.tsx:54-58`，非干净成功时还保留输入不清空。story 1.2 那条"warning 上不了界面"的遗留**已闭合**。
- `GET /resources/:id/chunks` 对已软删资源返回 `200 {chunks:[]}` 而 DELETE 对同一条返回 404（后端口径不一致，非前端项）；界面上点不到已删行，所以暂缓无感。

## 什么时候必须回来做

Epic 2 的问答界面（Story 2.2 的 loading、2.3 的引用面板）本来就要动 `app/web`。**届时把轮询和这两个按钮一起接上**，比现在单开一刀前端省事——这也是本文件把它整体挂起而不是拆零的理由。
