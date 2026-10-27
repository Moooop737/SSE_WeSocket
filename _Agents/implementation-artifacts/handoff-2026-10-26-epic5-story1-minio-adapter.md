# Handoff · 2026-10-26 · Epic 5 / Story 5.1 开工门槛

## 本次会话做了什么

1. **改道**：原定先做 Epic 4 · Story 4.1（资源画像），Lynx 决定暂缓，先做更底层的 Epic 5 · Story 5.1（对象存储适配器与配置）。4.1 的三个 OQ（`OQ-4.1-1..3`）保持未决，story 仍为 backlog。
2. **搭好运行时**：远程 MinIO 已装在 `aliyun2c2g300mbps`（Tailscale `100.113.172.47`），Docker + 阿里云镜像加速；数据目录 `/data/minio`，S3 API `9000`、Console `9001`。本机不装 MinIO。
3. **收口 5.1 的四个 OQ**（详见 `epics.md` › Story 5.1）：
   - `OQ-5.1-1` → `adapter/storage/`，AD-2 第六类（AD-2 已改）
   - `OQ-5.1-2` → 远程 MinIO（上述环境）
   - `OQ-5.1-3` → 启动自动建桶，失败只告警、不阻塞；桶名 `kbfile`
   - `OQ-5.1-4` → presigned URL，TTL 3600 秒；5.2 用 302 直连下载；`presignGet` 进 5.1 契约，`get` 留给服务端读
4. **文档同步**：`epics.md` Story 5.1 补齐详细 AC；`ARCHITECTURE-SPINE.md` AD-2 改为六类；`deferred-work.md` 解冻 presigned、把多存储后端/多桶归到「未排期」；`sprint-status.yaml` 5.1 → `ready-for-dev`，Epic 5 → `in-progress`。
5. **代码已落**：5.1 适配器 + 配置 + 启动检查 + 7 条真实 MinIO 集成测试；全量 38/38、tsc 0、boot 验证通过。状态转 review。

## 关键决策 / 规则

### 对象存储归属（AD-2 第六类）

- 目录：`app/server/src/adapter/storage/`
- 出门：只经 `adapter/contract.ts` 交出 `ObjectStoreHandle`（`@singleton()`）与 `ObjectStore` 类型
- 别盒不 import `@aws-sdk/*`、不 import `adapter/storage/` 内部文件
- 它只拥有对象字节与元数据，不认资源、不判归档失败该不该阻断入库

### 契约

```ts
put(Key, Body: Uint8Array, ContentType: string): Promise<void>
stat(Key): Promise<{ size: number; contentType: string | null; etag: string | null } | null>
get(Key, Options?: { range?: string }): Promise<{
  body: Readable
  contentType: string | null
  contentLength: number | null
  etag: string | null
} | null>
delete(Key): Promise<void>                       // 幂等
presignGet(Key, Options: {
  expiresIn: number                              // 1–604800 秒
  responseContentDisposition?: string
  responseContentType?: string
}): Promise<string>
ensureBucket(): Promise<void>                    // HeadBucket → CreateBucket；3s 上界
```

- `get` / `stat` 只在「对象不存在」时返回 `null`；其它失败抛 `ObjectStoreError`（`code='E_OBJECT_STORE'`），SDK 错误类型不泄出 adapter
- 5.2 下载用 `presignGet` + 302；`get` 留给服务端读（5.4 ZIP 等）

### 配置

```bash
S3_ENDPOINT=http://aliyun2c2g300mbps.tail8d0baa.ts.net:9000
S3_REGION=us-east-1
S3_BUCKET=kbfile
S3_ACCESS_KEY_ID=...
S3_SECRET_ACCESS_KEY=...
S3_FORCE_PATH_STYLE=true
```

- 前四项缺失 → `E_CONFIG_MISSING` + `exit(1)`
- `S3_REGION` 默认 `us-east-1`；`S3_FORCE_PATH_STYLE` 默认 `true`
- **`S3_ENDPOINT` 必须等于浏览器访问 MinIO 的 host**：presigned 的签名覆盖 Host，写成 `100.113.172.47` 而浏览器用域名会 `SignatureDoesNotMatch`
- Key / Secret 不出现在任何日志、错误、trace payloads 里

### 启动

- `serve()` 之前尝试 `ensureBucket()`：成功 `I_OBJECT_STORE`，失败 `W_OBJECT_STORE` 并继续启动
- 检查有 3 秒上界；MinIO 挂了最多拖 3 秒，不阻塞服务

### 下载链路（5.2 用，5.1 只提供 `presignGet`）

```
浏览器 GET /resources/:id/original
  → 后端校验资源、签 3600 秒 URL
  → 302 Location: <presigned>
  → 浏览器直连 MinIO 下载（一跳，无 CORS）
```

- 私有桶；应用账号只给 `s3:GetObject`（5.2 再加 Put/Delete）
- 302 带 `Cache-Control: no-store`
- 不记 `Location` 与完整 presigned URL
- 24h/TTL 调整只改常量；当前定 3600 秒
- 对象 key 必须不可变（5.2 定规则），否则续传会拼新旧内容

## 运行环境

| 项 | 值 |
|---|---|
| ECS | `aliyun2c2g300mbps`（Tailscale `100.113.172.47`） |
| 装法 | Docker `minio/minio:latest`，`--network host`，绑 Tailscale IP |
| 数据 | `/data/minio` |
| S3 API | `http://aliyun2c2g300mbps.tail8d0baa.ts.net:9000`（或 `http://100.113.172.47:9000`） |
| Console | `http://aliyun2c2g300mbps.tail8d0baa.ts.net:9001` |
| 凭据 | `/etc/minio.env`（root 600）；**不要把内容贴进聊天或文档** |
| Docker Hub | 已配阿里云镜像加速 `https://5hwht3y5.mirror.aliyuncs.com/` |
| 本机 | 未装 MinIO，也不需要装 |

Lynx 已确认 Console 可打开、MinIO 可用；本会话未留存 `docker ps` 与健康检查的原始输出。

## 手动链路验证（2026-10-26）

- `mc alias set kc http://aliyun2c2g300mbps.tail8d0baa.ts.net:9000` → `mc ls` 通过
- `printf 'hello presign\n' | mc pipe kc/kbfile/hello-presign.txt` → 14 B
- `mc share download --expire 1h` → `curl -i`：200、`Accept-Ranges: bytes`、`Content-Type: text/plain`、`Content-Length: 14`、`ETag`、`X-Content-Type-Options: nosniff`
- `curl -r 0-4` → 206 + `Content-Range: bytes 0-4/14` + 5 B
- 把 URL 的域名换成 `100.113.172.47` → 403 `SignatureDoesNotMatch`（Host 被签）
- `--expire 2s` 等 3 秒 → 403 `AccessDenied` + `Request has expired`
- 结论：presigned + 302 的 Host / Range / 过期语义与设计一致；5.1 集成测试按同一组断言写

## 实现与验证（2026-10-26）

- **代码**：
  - `src/config.ts`：`s3*` 六位；缺四项走 `E_CONFIG_MISSING`；endpoint 校验 http/https 并去尾斜杠；`S3_REGION` 默认 `us-east-1`；`S3_FORCE_PATH_STYLE` 默认 true
  - `src/adapter/storage/object-store.ts`：`ObjectStore` 契约（含 `ping()` / `presignPut()`）、`ObjectStoreError`（`E_OBJECT_STORE`）、presign 1–604800 秒
  - `src/adapter/storage/s3.ts`：S3 client（`forcePathStyle`、checksum `WHEN_REQUIRED`）+ put/stat/get/delete/presignGet/presignPut/pingBucket/ensureBucket；`ensureBucket` 3 秒、`pingBucket` 2 秒上界
  - `src/adapter/contract.ts`：`ObjectStoreHandle`，只经这道门交出
  - `src/index.ts`：`serve()` 前 `ensureBucket()`；成功 `I_OBJECT_STORE`，失败 `W_OBJECT_STORE` 并继续
  - `src/routes/health.ts`：新增 `s3.bucket` 探针（`HeadBucket` 2 秒）；MinIO 不可达时 `s3.ok=false`、整体 degraded/503
  - `test/object-store.test.ts`：10 条真实 MinIO 用例
  - `test/config.test.ts`：3 条配置失败路径（缺 S3 / 非法 endpoint / 非法布尔）
- **测试**：`npx tsc --noEmit` 0 错；后端 `npx vitest run` 11 文件 / **45 条**（storage 10 + config 3 + health 1 新增）；前端 `npm test` 62 文件 / **587 条**；`PORT=3101` 起服务 `/health` 200 + `I_OBJECT_STORE` + `s3.bucket.ok=true`
- **Review 期间修复**：`config.ts` 的 `missing` 检查曾早于 `DATABASE_URL` / `OLLAMA_BASE_URL` / `S3_*` 读取，导致缺这些变量不报 `E_CONFIG_MISSING`；已修并用 `test/config.test.ts` 钉住
- **presignPut**：给 `contentType` 时用 `signableHeaders` 显式签 `content-type`；正确类型 PUT 200、换类型 403；key 必须由后端生成，TTL 由 5.3/5.4 调用方定（建议 60–300 秒）
- **手工链路**：见上一节（200/206、Host 403、过期 403）
- **测试基础设施**：`test/load-env.ts` 的 env 正则从 `[A-Z_]+` 扩到 `[A-Z0-9_]+`，否则 `S3_*` 读不进测试进程；该文件仍在 gitignored 的 `test/` 下，属于已知 deferred
- **兼容细节**：S3 client 关掉默认 checksum（`WHEN_REQUIRED`）以兼容 MinIO；presign 的 Host 必须与 `S3_ENDPOINT` 一致
- **已知抖动**：health 真链路第一次跑时 `postgres.ping` 瞬时 false，重跑全绿；远端 DB 抖动，项目接受
- **Review**：findings 见 `review-2026-10-26-epic5-story1.md`；无阻塞代码缺陷；P1 两条（root 凭据、`HeadBucket` 权限）上公网前处理；`/health` 是否给 storage 分级待拍板

## 未决 / 注意

- **公网下载鉴权 → P5**：登录 / 退出吊销、请求 IP 绑定、一次性 token、边缘反代都归 P5 部署阶段；P2 只做私有桶 + tailnet + presigned 直连，不绑 IP、不建 token 表。形状记为 opaque token 表（`token_hash / resource_id / user_id / client_ip / expires_at / used_at`）+ 边缘 `auth_request`；JWT 无状态方案不能吊销，不选。
- **HTTPS**：当前 MinIO 是 HTTP。前端上 HTTPS 后必须给 MinIO 包 `tailscale serve`，否则浏览器拦混合内容；届时 `S3_ENDPOINT` 改成 HTTPS 域名，并先验 Tailscale Serve 是否保留 Host（否则 presign 会 `SignatureDoesNotMatch`）。
- **5.2 的 OQ 未拍**：`OQ-5.2-3`（`store` 独立 stage 还是折进 `write`，影响 3.4 的五段 AC/走读页）、`OQ-5.2-4`（无 `storage_key` 的响应）等。
- **5.4 的 OQ 未拍**：`OQ-5.4-4`（`codebases` 领域归属）等。
- **4.1 暂缓**：`OQ-4.1-1..3` 未决；解冻时先看 `epics.md` Story 4.1 与 `WeKnora` 的画像形状。
- **presigned 的边界变更**已在 `epics.md` 与 `deferred-work.md` 记账；不再是 Deferred。
- `@aws-sdk/client-s3` 与 `@aws-sdk/s3-request-presigner` 尚未安装。

## 涉及文件

- 规划：`_Agents/planning-artifacts/epics.md`（Story 5.1 AC + OQ 收口）
- 架构：`_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`（AD-2 六类）
- 记账：`_Agents/implementation-artifacts/deferred-work.md`、`sprint-status.yaml`
- 代码：`app/server/src/config.ts`、`app/server/src/adapter/storage/`、`app/server/src/adapter/contract.ts`、`app/server/src/index.ts`；依赖 `package.json` / `package-lock.json`
- 交接：本文件

## 收口（2026-10-26）

- **5.1 状态 done**。走读页：`_Agents/walkthroughs/epic5-story1-minio-adapter.html`（build + validate：16 sections / 10 code blocks / 40 notes / 8 journey steps / style 1/1）。
- **Review**：`review-2026-10-26-epic5-story1.md`；无阻塞代码缺陷；`/health` 保持全绿才 200（Lynx 拍板 A）；P1 专用用户 / `HeadBucket` 权限 → 5.2。
- **测试**：后端 45/45、前端 587/587、`tsc` 0、boot `/health` 200；手动链路 200/206/403(Host)/403(过期)。
- **下一步**：开 5.2 前先收 `OQ-5.2-3`（store 独立 stage vs 折进 write）与 `OQ-5.2-4`（无 `storage_key` 的响应）；5.2 一并建 MinIO 专用用户。

## 下一步

1. 5.1 code review（边界 / 契约 / 验证 / 安全）✓ 2026-10-26，findings 见 `review-2026-10-26-epic5-story1.md`
2. 写 `_Agents/walkthroughs/epic5-story1-minio-adapter.html`（story 收口门槛）✓
3. 5.1 转 done ✓
4. **5.2 已进入 review（2026-10-27）**：Epic 6 已取消并折回 5.2；两段式归档/ingest、下载、恢复、六状态、前端队列已落码。AC/OQ 见 `epics.md` Story 5.2，交接见 `handoff-2026-10-27-epic5-story2-archive-ingest.md`。
5. 5.2 建 MinIO 专用用户/策略（P1 跟进项）→ 上公网前处理；5.3 与 5.2 单文件上传重叠待拍；5.4 backlog。

## 可复制的验证命令

```bash
# ECS 上
sudo docker ps --filter name=minio
curl -fsS http://100.113.172.47:9000/minio/health/live && echo OK

# Mac 上（Tailscale 开着）
curl -fsS http://100.113.172.47:9000/minio/health/live && echo OK
curl -I --max-time 5 http://100.113.172.47:9001
```

> **2026-10-27 对账**：Epic 6 已取消并折回 5.2；原 kickoff handoff 已归档到 `_Agents/legacy/handoffs/`，不再作为活动文档。
