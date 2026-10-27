# Review · 2026-10-26 · Epic 5 / Story 5.1（MinIO 适配器）

## 范围

- 代码：`app/server/src/config.ts`、`src/adapter/storage/{object-store,s3}.ts`、`src/adapter/contract.ts`、`src/index.ts`、`src/routes/health.ts`
- 测试：`test/object-store.test.ts`、`test/health-chain.test.ts`、`test/load-env.ts`
- 前端：`app/web/src/components/widget/probe-sources.ts`（`s3.bucket` 对齐）
- 依据：`epics.md` Story 5.1 AC、`handoff-2026-10-26-epic5-story1-minio-adapter.md`

## 验证现状

- `npx tsc --noEmit` 0 错
- 后端 `npx vitest run` 11 文件 / **45 条**通过（storage 10 + config 3 + health 5）
- 前端 `npm test` 62 文件 / **587 条**通过
- 启动：`/health` 200，`s3.bucket.ok=true`；`I_OBJECT_STORE: 对象存储就绪：kbfile`
- 手动链路：200 / 206 / Host 403 / 过期 403；`presignPut` 正确类型 200、错类型 403

## Findings

### P1 · 应用使用的是 MinIO root 凭据（上公网前必须处理）

- 证据：`.env` 的 `S3_ACCESS_KEY_ID/SECRET_ACCESS_KEY` 来自 `MINIO_ROOT_USER/PASSWORD`；5.1 的 security 口径要求专用应用账号。
- 影响：应用进程一旦泄露凭据，等于全桶管理权限（含建/删桶、全量读写）。
- 去向：5.2/P5 建专用用户与策略（`s3:GetObject/PutObject/DeleteObject` on `kbfile/*`；`HeadBucket` 需要 `s3:ListBucket`）；生产预建桶，不给应用 `CreateBucket`。
- 当前不阻塞开发：dev 用 root、桶 `kbfile` 私有、仅 tailnet。

### P1 · `HeadBucket` / `CreateBucket` 与最小权限冲突

- 证据：`ensureBucket` / `pingBucket` 都走 `HeadBucket`；`ensureBucket` 缺桶时 `CreateBucket`。一个只有对象读写权限的用户会在 `HeadBucket` 上 403，导致 boot 告警与 `/health` 降级，尽管 put/get 实际可用。
- 去向：与 P1 同批处理。策略补 `s3:ListBucket`，或把健康探针改为 `stat` 一个哨兵 key；生产改为预建桶、去掉 `CreateBucket`。

### P2 · `/health` 把 storage 当关键服务，MinIO 挂了整体 503

- 证据：`createHealthServices` 把 `s3` 与 postgres/ollama 同等聚合；`createHealthRoute` 只有全绿才 200。
- 影响：boot 对 storage 失败是「告警继续」，但 health 会显示整体 degraded/503；聊天/检索其实不受影响。
- 去向：**2026-10-26 Lynx 拍板 A：保持现状**（全绿才 200，storage 是关键服务）；不引入 `HealthService` 分级。若以后觉得太严，再单开 health 语义变更。

### P2 · `test/` 被 gitignore，新增 health 测试与 env loader 修复不进版本控制

- 证据：`test/load-env.ts` 的正则修复（`[A-Z_]+` → `[A-Z0-9_]+`）与 `test/health-chain.test.ts` 的第⑤条都在 gitignored 的 `test/` 下；`test/object-store.test.ts` 仍依赖 `test/setup-env.ts`。
- 影响：fresh clone/CI 无法复现新测试；S3 env 读取问题会复发。
- 现状（2026-10-26）：`object-store.test.ts` 与 `config.test.ts` 已移入 `test/`，并用 `git mv` 保留跟踪；`health-chain.test.ts` / `load-env.ts` 仍在本地未跟踪。
- 去向：跨阶段测试基础设施（已有 deferred）。建议后续把 setup 移到 `src/` 或 `vitest.config.ts` 内联 env 加载；5.1 不扩。

### P3 · `ensureBucket` 的 3 秒信号被 Head 和 Create 共用

- 证据：`const Signal = AbortSignal.timeout(3000)`，HeadBucket 慢时 CreateBucket 只剩很少预算。
- 影响：极端网络下建桶失败 → boot 告警；不影响已有桶。
- 去向：接受；若真遇到，改为两次独立预算或调大上限。

### P3 · 配置非法路径未自动化（本轮已修）

- 证据：`E_CONFIG_MISSING`（缺 S3_BUCKET）与 `E_CONFIG_INVALID`（ftp endpoint / 非 true-false）只有代码路径，没有子进程测试。
- 本轮：补 `test/config.test.ts` 3 条子进程测试；同时发现并修复 `missing` 检查早于 `DATABASE_URL` / `OLLAMA_BASE_URL` / `S3_*` 读取的顺序 bug（缺这些变量不会报 `E_CONFIG_MISSING`）。

### P3 · 小问题

- `statObject` 的 `size: ContentLength ?? 0` 把「未知」说成 0；HeadObject 正常都会给，暂不改。
- `ObjectStoreHandle` 在 `index.ts` 的 `try` 外解析；S3Client 构造异常不会被 `E_ASSEMBLY` 捕获。配置已校验，风险低。
- `presignPut` 不签 body，没给 `contentType` 时类型不限；key 必须后端生成、TTL 建议 60–300 秒、上传后 HEAD 校验——5.3/5.4 的调用约束。

## 本轮已修

- 补了 `ensureBucket` **创建不存在桶**的集成测试（临时桶创建两次 + 删除），storage 9 → 10 条。
- 修复 `config.ts` 的 `missing` 检查顺序 bug，补 `test/config.test.ts` 3 条子进程测试；后端 42 → 45 条。
- 收口时发现 `test/object-store.test.ts` 是一份损坏的重复副本，已改名 `object-store.test.ts.bak` 保留；正式测试现位于 `test/object-store.test.ts`（2026-10-26 从 `src/` 移入，`git mv` 保留跟踪）。

## 结论

- 5.1 无阻塞代码缺陷；可以进入收口/走读页。
- 上公网前必须处理 P1 的两条（专用用户 + HeadBucket 权限）。
- `/health` 的 storage 分级已拍板 A（保持全绿才 200）。
- 已知抖动：health 真链路第一次跑 `postgres.ping` 瞬时 false，重跑全绿。
- **2026-10-26 已收口**：5.1 done；走读页 `_Agents/walkthroughs/epic5-story1-minio-adapter.html`。
