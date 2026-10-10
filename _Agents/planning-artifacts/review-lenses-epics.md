# BMad Review — epics.md（P1 Epic/Story）

内容类型：docs（行为故事）。镜头：adversarial / edge-case-hunter / structure / prose。
处置：按用户选择「全部修复」，已落进 `epics.md`。★=多镜头交叉命中。

## 🔴 高（已修）
- ★ **建表职责矛盾**（Adv#3,#11 / Edge 并发 CREATE TABLE）：1.1 说迁移可运行，1.2/2.1 又首次建表；runtime 建表违反 AD-2 且并发报错。*修*：5 表全归 Story 1.1 迁移，业务 Story 经 Repository 端口写入，不动态建表。
- **硬删 vs 引用降级**（Adv#1）：1.4 物理删 Chunk，2.3 要"来源已删除"却无处取快照。*修*：1.4 软删 + 引用快照在写入时内嵌 messages；2.3/2.4 依快照降级、不请求已删 Chunk。
- **取消入库的前瞻依赖**（Adv#2）：1.4 取消任务，1.2 管线无取消通道。*修*：1.2 增加"管线支持 AbortController 取消信号"。
- ★ **重启 处理中→失败 无落地**（Adv#4 / Edge）：Glossary 定义但无 Story 覆盖。*修*：并入 1.1 启动恢复 AC。

## 🟠 中（已修）
- 相关性阈值不可测（Adv#5）→ 2.1 给默认判据（cosine<0.30 且 BM25<3.0，env 可覆盖）。
- "Chunk 完整落地"歧义（Adv#6）→ 2.2 澄清为"前端收全 sources data part 且 chunkId 非空"。
- 2.5 指代消解属架构 Deferred 却塞进尾 Story（Adv#7）→ 明确"单次轻量查询改写 step + 失败回退不报错"，复杂度可控。
- 流式协议 data part 返工（Adv#8）→ 2.2 预留 data part handler。
- 1.3"复用管线"边界（Adv#9）→ 写清跳过 fetch、parse 走 Markdown 分支、chunk/embed/写复用。
- ports 空占位无验收（Adv#10）→ 1.1 要求四个接口文件存在可编译（NFR-5）。
- Edge 补 AC：基础设施不可达/key fail-fast/embed 部分失败/重复 URL 幂等/无就绪资源提示/维度不符不回退 BM25/inter-token 超时/并发流/越界引用/410/指纹重复/token 窗口/重启会话。

## 🟡 结构 / 文字（已修）
- Epic List 与 detail 逐字重复 → Epic List 精简为标题 + FRs covered。
- 每个 Story 加 `**Implements:** FR-x`；新增 **NFR → Story 追溯**。
- 术语统一：资料→资源（Glossary 锚定）、切块→分块、可点→可点击、绿 field→Greenfield、Answer→回答、UI-DR→UX-DR；FR-10"映射"→"映射到"。
- Structure 编号连续、依赖排序、FR 覆盖完整性：原判即通过（2 Epic、1.1→1.4 / 2.1→2.5 无跳号、无前瞻依赖、FR-1…12 全覆盖）。
