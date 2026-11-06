# Knowledge Copilot

English | [简体中文](README.zh-CN.md)

Knowledge Copilot is a conversational assistant for a personal knowledge base. You feed it the material you have collected (web pages, Markdown and plain-text notes, uploaded files), then ask questions in plain language. It answers from the retrieved source text, streams the answer, and attaches citations that link back to the original passage.

It is also a learning project: each stage of the roadmap exercises one group of [Vercel AI SDK](https://ai-sdk.dev/) capabilities (with RAG as a side track), and the result is a portfolio project that keeps growing stage by stage.

## Features

- **Ingest**: add a URL or paste Markdown / plain text; the content is fetched, chunked, embedded and stored. Upload `.md` / `.txt` files and code-base ZIPs, with raw files archived in object storage.
- **Hybrid retrieval**: vector top-k plus BM25 full-text search, fused with RRF.
- **Streaming answers with citations**: answers stream token by token, and every citation can be opened to see the source chunk and URL.
- **Multi-turn sessions**: session history is persisted.
- **Retrieval as a tool**: the model calls `retrieve` as a tool and can re-query a bounded number of times.
- **Observability**: endpoint and pipeline traces, chat traces in Langfuse.
- **Evaluation workbench**: golden sets, retrieval metrics (recall@k, MRR, nDCG) and LLM-as-judge answer scoring in a local `/evals` panel.

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | Vite + React |
| Backend | Hono on Node.js + TypeScript |
| AI | Vercel AI SDK (`streamText`, `embedMany`, tool calling) |
| Chat models | DeepSeek / DashScope |
| Embeddings | Local Ollama (Qwen3-Embedding, 1024 dims) |
| Storage | ParadeDB (Postgres with pgvector + BM25), MinIO (S3 API) for raw files |
| Tests | Vitest |

## Roadmap

| Stage | Capability | AI SDK focus |
|---|---|---|
| P1 (done) | RAG Q&A, streaming, citations, multi-turn, tracing | `streamText`, embeddings |
| P2 (in progress) | Structured output and rendering, files and storage, agent toolbox | structured output, tools |
| P3 | Web tools and the agent loop, batch ingest queue | tool calling, agents |
| P4 | Charts and interactive cards inside answers | Generative UI |
| P5 | MCP, multimodal input, deployment | MCP client, multimodal |

## Repository layout

This repository holds the project's planning, process and teaching documents. The application code lives in `app/server` and `app/web`, which are separate repositories and are ignored here.

| Path | Contents |
|---|---|
| `AGENTS.md` | Working rules for AI agents and contributors: collaboration flow, code style, scope limits |
| `_Agents/README.md` | Map of the `_Agents/` directory and the current status |
| `_Agents/planning-artifacts/` | PRD, addendum, architecture spine, epics and stories |
| `_Agents/implementation-artifacts/` | Sprint status, deferred work, session handoffs, reviews, specs |
| `_Agents/walkthroughs/` | One standalone HTML walkthrough per finished story; start at `index.html` |
| `LEARNING.md` | Learning log: what each stage taught about the AI SDK, pitfalls and trade-offs |
| `.archify/` | Sources for the interactive architecture and sequence diagrams |

## Where to start reading

1. The PRD: `_Agents/planning-artifacts/prds/prd-dev-2026-10-09/prd.md`
2. The architecture spine: `_Agents/planning-artifacts/architecture/architecture-dev-2026-10-15/ARCHITECTURE-SPINE.md`
3. Story status: `_Agents/implementation-artifacts/sprint-status.yaml`
4. Code walkthroughs: open `_Agents/walkthroughs/index.html` in a browser
