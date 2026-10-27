# Handoff · 2026-10-26 · Epic 6 / Story 6.1 文件 URI kickoff

## 本次会话做了什么

1. **5.1 已收口**：MinIO 适配器 done（review + 走读页）；见 `handoff-2026-10-26-epic5-story1-minio-adapter.md`。
2. **改道**：Lynx 决定 5.2–5.4 暂停，先做 Epic 6「文件 URI、原文优先与恢复」。
3. **收窄范围**：Epic 6 只统一**文件层** URI；资源 / chunk / message / trace 的身份 URI 与 `data_uri` 迁移**不做**（不是需求）。
4. **文档已立**：`epics.md` Epic 6、`sprint-status.yaml` epic-6、`ARCHITECTURE-SPINE` AD-5/AD-7 方向注。
5. **代码未动**：等 6.1 的 OQ 收口 + Lynx「进行」。

## 关键决策（2026-10-26）

### 文件 URI

```
kc://oss/<provider>/<bucket>/<key>
```

例：

```
kc://oss/minio/kbfile/hello-presign.txt
kc://oss/minio/kbfile/dir/hello-presign.txt
kc://oss/minio/kbfile/resources/<uuid>/original
```

- `kc` = 统一 scheme；`oss` = 对象存储 authority
- `provider` = `minio` / `aliyun`（区分存储后端）
- `bucket` = `kbfile`
- `key` 保留目录层级；解析器只查配置的 ObjectStore，不读本地文件
- `storage_uri` = 文件 URI；`storage_key` = key；`data_uri` / chunks.resource_uri **本 Epic 不改**

### 两段式

```
POST /resources
  → 建 resource id（原 data_uri 仍按 URL/paste urn）
  → URL: 抓原始 HTML / 粘贴: 收原文
  → 原文落 ObjectStore，storage_uri = kc://oss/...
  → 写 uploaded 行
  → 返回 resourceId

POST /resources/:id/ingest
  → 从 storage_uri 读原文（StorageFetcher）
  → parse → chunk → embed → write
  → uploaded → processing → ready / failed
```

- URL 的 fetch 移到 upload；ingest 的 fetch 段改为「读存储」
- 3.4 的五段 AC/走读页同批更新；**不新增 store 段**
- `resource_status` 增加 `uploaded`；启动清扫只处理 `processing`

### 原始文件与恢复

- 原文是 source of truth；chunk / embedding / 画像 / 代码文件是派生
- 软删**不立即删原始文件**；`DELETE` 仍删派生 chunks
- `restore` 从原始文件重新 ingest；彻底清除交给 retention/purge
- 5.2 原方向的「归档失败 warning / store 段 / DELETE 清对象」被这套语义取代

## 当前代码形状（证据）

- `Fetched.raw` 已有原始 HTML/文本；`final_url/content_type` 也在（`ingest/contracts.ts`、`fetch/*`）。
- `IngestFactory.runOne` 当前自己建 resource 行并同步跑 fetch→parse→chunk→embed→write；两段式要拆开。
- `writeChunksWithEmbeddings` 是 ready 事务；`softDeleteResource` 只删 chunks。
- `StageName` 目前 fetch/parse/chunk/embed/write 五段；无 store、无 uploaded。
- `resources` 表无 storage 列；5.1 的 `ObjectStoreHandle` 已有 put/presignGet/presignPut/ping/ensureBucket。

## WeKnora 参考（源码核对）

- `knowledge_create.go`：先有 knowledge ID → `SaveFile(tenantID, knowledge.ID)` 落存储拿 `FilePath` → 再写 DB；DB 失败删文件。
- `ParseStatus: pending`，解析是后续任务；`FileName/FolderPath` 是展示，`FilePath` 是存储路径。
- 知识身份是 ID，不是某个 MinIO/OSS URL；存储后端由 file service 解析。
- 我们采用「文件 URI + 两段式」，但不引入 WeKnora 的 Asynq 队列；第二跳显式调用。

## 未决 / OQ

- 6.1：`OQ-6.1-1` resolver 路由/响应；`OQ-6.1-2` key 编码/目录/校验；`OQ-6.1-3` provider 映射；`OQ-6.1-4` 文件 URI 是否允许任意 key。
- 6.2：`OQ-6.2-1` 旧资源无 storage_key 的下载/恢复；`OQ-6.2-2` storage_uri + storage_key；`OQ-6.2-3` storage_key 路径规则。
- 6.3：`OQ-6.3-1` upload 失败行/状态；`OQ-6.3-2` URL fetch/store 顺序与 paste 元数据；`OQ-6.3-3` ingest 状态机/重复调用；`OQ-6.3-4` 前端两跳。
- 6.4：`OQ-6.4-1` restore 是否重新 ingest；`OQ-6.4-2` retention/purge；`OQ-6.4-3` 前端首期范围。
- **5.2 的 OQ-5.2-* 已被两段式/文件 URI 取代**；重启 5.2–5.4 前重新收。

## 下一步

1. 6.1 AC 草案已写（`epics.md`）：文件 URI parse/mint + `/resolve` + `/files`；`OQ-6.1-1..4` 建议默认，待 Lynx 最终确认。
2. 确认后 6.1 转 `ready-for-dev`；代码等 Lynx 明确「进行」。
3. 6.2 起再加 storage 列/映射；6.3 两段式；6.4 restore/保留/前端。
4. 5.2–5.4 保持暂停，等 Epic 6 6.2/6.3 落地后重新评估。

## 涉及文件

- 规划：`_Agents/planning-artifacts/epics.md`（Epic 6）
- 架构：`_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`（AD-5/AD-7 方向注）
- 状态：`_Agents/implementation-artifacts/sprint-status.yaml`（epic-6）
- 交接：本文件；5.1 收口见 `handoff-2026-10-26-epic5-story1-minio-adapter.md`
- 代码：未动
