# Handoff · 2026-10-27 · Epic 5 / Story 5.2 原始归档 + 两段式 ingest

## 本次会话做了什么

1. **Epic 6 取消**：文件 URI / 原文优先 / 恢复折回 5.2，不再有 6.1–6.4、`/resolve`、`/files`、`storage_uri/storage_key`。
2. **数据库**：`20261026163000_resource_storage_lifecycle.sql`（六状态、MIME、`storage_size_bytes`、`kc://%` 唯一索引）与 `20261026172000_truncate_existing_data.sql`（清空资源/分块/向量/trace；sessions/messages 按 Lynx 的最终文件保留）。当前 13 applied / 0 pending。
3. **后端**：`ResourceArchive`（文件 presign PUT / URL 抓取归档 / 粘贴归档）、`ResourceIngest`（stat 门禁 + `runExisting` + StorageFetcher）、`ResourceDownload`（302 presigned GET）、`ResourceRestore`（软删恢复）；`POST /resources` 与 `POST /:id/ingest` 替代旧同步入库。
4. **前端**：上传队列提交（文字/URL/文件/文件夹）、六状态筛选/徽标/分布、抽屉下载/开始/重试 ingest、删除后撤销恢复并重新入库。
5. **文档**：epics Story 5.2 改 as-built；Epic 6 从 epics/sprint/SPINE 清掉；5.1 handoff 与 deferred 已对账。

## 关键决策（as-built）

- `data_uri` 就是原始文件 URI：`kc://oss/minio/<bucket>/<实际路径>`；路径保留文件名/相对目录，不加 `resources/<id>`；同名加短后缀；`kc://%` 唯一索引。
- `source` 只记外部来源：URL 存原 URL；文件/粘贴存 null（`kc://...` 是内部 `data_uri`，不当来源）。`content_type` 存 MIME；六状态 `uploading / uploaded / processing / ready / upload_failed / process_failed`。
- 文件走 `presignPut`（非 POST policy、非 multipart）；后端签 `Content-Type`，浏览器直传 MinIO；`stat` 由 ingest 做。
- URL/粘贴在 `POST /resources` 服务端归档；三者都在 `uploaded` 后走同一个 `POST /:id/ingest`。
- ingest 不新增 `store` 段：`fetch` 从 MinIO 读，3.4 的五段口径不变。
- 软删保留 MinIO 原对象；restore 只恢复为 `uploaded`，前端再 ingest；无原对象返回 `E_NO_ORIGINAL`。
- 下载 302 + `attachment` / 资源 MIME / `Cache-Control: no-store`；1h presign GET；不记 Location。
- 观测 stage 只写在 `POST /resources/:id/ingest`（5 段）；归档 `POST /resources` trace 为 0 段。前端 RunWatch / `/ingest-runs` 已改读新路由；上传面板每完成一个文件/一次 ingest 回调，入库页刷新最近资源、六状态分布与 RunWatch；`/traces` 分类同时认两条 POST。
- 原 5.3 的单文件 `.md/.txt` 上传已被 5.2 覆盖；5.3 已重定义为「资源批量：SHA-256 去重、整批两段式、回收站/彻底删除、ready 重入库」，backlog。
- 已有的 `source = kc://...` 测试行已一次性归零为 null（2026-10-27）；新代码不再产生这种 source。

## 验证现状

- 后端：`npx tsc --noEmit` 0；16 文件 / 89 条通过（含真实 MinIO/DB/Ollama）。
- 前端：`npx tsc --noEmit` 0；63 文件 / 594 条通过；`npm run build` 绿。
- 真 MinIO 集成：粘贴/URL/文件 presign PUT、缺对象/错类型/0 字节、restore、download 302、重复 ingest 409。
- **未做浏览器手测**（按约定留给 Lynx）。

## 未决 / 下一步

- **CORS 已实测放行（2026-10-27 晚更正）**：桶级 CORS 确实没配，但 MinIO 默认对任意 Origin 回 `200` + `Allow-Methods: PUT` + `Allow-Headers: Content-Type`（`OPTIONS /kbfile/<key>` 实测，含 `evil.example` 也回显）；无签名 PUT 的 403 也带 ACAO 与 `Expose-Headers`，前端能读到状态码。不需要配桶 CORS；日后收紧 Origin 再验。真正会挡的是 HTTPS 预览页直传 `http://MinIO` 的 mixed content（fetch 被 block，改 CORS 无效）。
- 5.2 状态 `review`；待浏览器四种来源/六状态/下载/撤销恢复手测（用 `http://localhost:5173` 规避 mixed content）后由 Lynx 收口。
- 5.3 已重定义（去重/批量两段式/回收站/重入库）；批量下载按 Lynx 2026-10-27 去掉。
- 5.4 ZIP 仍 backlog。
- 已转 deferred：回收站/list-deleted、文件 PUT 失败后的 uploading 行清理、URL 页面标题覆盖占位、从 source 自动重抓、MinIO mixed-content（HTTPS 预览）/TLS 部署项、5.3 合并决定。

## 文档入口

- Story AC / OQ：`_Agents/planning-artifacts/epics.md` › Story 5.2
- 架构：`ARCHITECTURE-SPINE.md` › AD-5 / AD-7（2026-10-27 as-built）
- Sprint：`_Agents/implementation-artifacts/sprint-status.yaml`（5.2 review）
- Epic 6 旧 handoff：`_Agents/legacy/handoffs/handoff-2026-10-26-epic6-story1-uri-kickoff.md`（归档，不再活动）
