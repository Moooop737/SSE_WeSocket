# Addendum — Knowledge Copilot
PRD 的补充深度材料，供后续架构 / UX / epics 阶段取用。不并入 PRD 主线。

## A. 技术选型分析（Hono+Node vs Next.js）

Vercel AI SDK 的**服务端是框架无关的**：核心函数 `streamText` / `generateText` / `embed` / tool calling 可在任何 Node / Edge / Worker 运行时调用。区别在前端与集成能力：

| 维度 | Next.js（App Router + React） | Node + Hono + TS |
|---|---|---|
| AI SDK 文档/示例覆盖 | 官方首选，示例最全 | 可用，示例较少 |
| 流式聊天 UI（`useChat`） | 开箱 | 需自建前端流式消费 |
| **P4 生成式 UI（Generative UI：`streamUI` / 由 RSC 流式生成组件）** | **原生支持** | 需要 React 层才能发挥，纯 Hono 后端难落地 |
| 部署 | Vercel 一键 | 自托管灵活 |
| 学习曲线（针对 AI SDK 生态） | 低 | 中 |

**结论（已定案，OQ#4）**：采用 **Vite + React 前端 + Hono + Node 后端**。理由：AI SDK 核心是服务端框架无关（Hono/Node 均可运行 `streamText`、tool calling、embed），但 UI 层官方 `useChat` 与 **P4 生成式 UI（`streamUI`）是 React 优先**——因此前端保留 React 生态，后端满足 Lynx 想练 Hono + Node 的诉求，两者兼顾。Next.js 未选（避免绑定其部署模型），纯 Vue/Svelte 未选（会失去官方 UI hooks（`useChat`）、P4 成本高）。

> 注：`streamUI` 的 RSC 形态依赖 Next；在 Vite + React SPA 下生成式 UI 走客户端组件流式渲染路径，P4 落地时以该路径为准（尚未确认，见 PRD OI#2）。

- Provider（定稿于架构阶段）：**Embedding = 本地 Ollama 跑 Qwen3-Embedding（原生 1024 维，无外部 Key）**；**对话 LLM = DeepSeek 与 百炼（DashScope）**，均 OpenAI 兼容，经 AI SDK provider 抽象可切换。（原 PRD “默认 OpenAI”假设已更正。）
- **存储（已定案，OQ#1/#2）**：**ParadeDB**（Postgres 扩展，pgvector + `pg_search`/BM25）。P1 采用真持久化，重启后知识库仍在，便于随时演示。本地用 Docker 起。

## B. 文档格式 Backlog（终极菜单，按阶段释放）

P1 只实现 **网页 URL 抓取** 与 **Markdown/纯文本**。其余格式的目标阶段见下表（**P1.x = MVP 验收通过后的追加，不属于 P1 完成条件**，与 PRD §6.2 一致）：

| 类别 | 格式 | 目标阶段 | 依赖能力 |
|---|---|---|---|
| 网页 | 在线 URL 抓取 | **P1** | 抓取 + 正文解析 |
| 文本 | txt、Markdown | **P1** | 直接读取 |
| 文档 | PDF | P1.x | PDF 解析库 |
| 文档 | Word(doc/docx)、PPT、EPUB | P2+ | 各格式解析器 |
| 表格 | Excel、CSV、JSON | P2+ | 结构化解析 + 分块策略 |
| 网页 | 本地 HTML / MHTML 归档 | P2+ | 本地文件上传 |
| 思维导图 | XMind | P3+ | 专有格式解析 |
| 图片 | jpg/png/gif/bmp/tiff/webp | **P5 多模态** | 视觉模型（Vision） |
| 音频 | mp3/wav/m4a/flac/ogg | **P5 多模态** | 语音识别（ASR） |

## C. 阶段 → AI SDK 能力映射（学习计划内核）

| 阶段 | 产品能力增量 | 对应 AI SDK 练习点 |
|---|---|---|
| P1 | 喂文档 → 检索问答 + 引用 + 流式 | `streamText`、embed、RAG 编排 |
| P2 | 多轮会话管理 + 结构化输出 | 会话状态、`generateObject` |
| P3 | 检索/联网变成"工具"，Agent loop | tool calling、agents |
| P4 | 回答内渲染图表/卡片组件 | `streamUI`、React Server Components |
| P5 | MCP 集成 / 多模态输入 / 部署上线 | MCP client、multimodal、生产部署 |
