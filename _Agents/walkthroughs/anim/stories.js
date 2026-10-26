/* Generated from .archify candidate JSON; edit the candidate or this file intentionally. */
window.STORY_FILMS = {
  "1.1": {
    "id": "1.1",
    "type": "architecture",
    "title": "本地骨架与安全边界",
    "subtitle": "",
    "components": [
      {
        "id": "browser",
        "type": "external",
        "label": "Browser",
        "sublabel": "local user",
        "pos": [
          20,
          300
        ],
        "size": [
          120,
          60
        ]
      },
      {
        "id": "web",
        "type": "frontend",
        "label": "Web UI",
        "sublabel": "Vite + React :5173",
        "pos": [
          200,
          300
        ],
        "size": [
          140,
          64
        ]
      },
      {
        "id": "api",
        "type": "backend",
        "label": "Hono API",
        "sublabel": "127.0.0.1:3000",
        "pos": [
          460,
          300
        ],
        "size": [
          170,
          78
        ]
      },
      {
        "id": "config",
        "type": "security",
        "label": "AppConfig",
        "sublabel": "env + fail-fast",
        "pos": [
          460,
          100
        ],
        "size": [
          170,
          64
        ]
      },
      {
        "id": "db",
        "type": "database",
        "label": "ParadeDB",
        "sublabel": "pgvector · pg_search",
        "pos": [
          720,
          200
        ],
        "size": [
          170,
          78
        ]
      },
      {
        "id": "ollama",
        "type": "backend",
        "label": "Ollama",
        "sublabel": "local embeddings",
        "pos": [
          720,
          360
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "llm",
        "type": "cloud",
        "label": "Chat provider",
        "sublabel": "keys server-side",
        "pos": [
          460,
          560
        ],
        "size": [
          180,
          64
        ]
      }
    ],
    "connections": [
      {
        "from": "browser",
        "to": "web",
        "label": "HTTP",
        "variant": "default"
      },
      {
        "from": "web",
        "to": "api",
        "label": "REST / SSE",
        "variant": "emphasis"
      },
      {
        "from": "config",
        "to": "api",
        "label": "env fail-fast",
        "variant": "security"
      },
      {
        "from": "api",
        "to": "db",
        "label": "SQL",
        "variant": "emphasis"
      },
      {
        "from": "api",
        "to": "ollama",
        "label": "embed",
        "variant": "default"
      },
      {
        "from": "api",
        "to": "llm",
        "label": "chat",
        "variant": "security"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "本地骨架与安全边界：从 Browser 开始。",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "browser",
        "to": "web",
        "label": "HTTP",
        "caption": "Browser → Web UI：HTTP",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "web",
        "label": "Web UI",
        "caption": "Web UI：Vite + React :5173",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "web",
        "to": "api",
        "label": "REST / SSE",
        "caption": "Web UI → Hono API：REST / SSE",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "api",
        "label": "Hono API",
        "caption": "Hono API：127.0.0.1:3000",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "config",
        "to": "api",
        "label": "env fail-fast",
        "caption": "AppConfig → Hono API：env fail-fast",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "api",
        "label": "Hono API",
        "caption": "Hono API：127.0.0.1:3000",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "api",
        "to": "db",
        "label": "SQL",
        "caption": "Hono API → ParadeDB：SQL",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "db",
        "label": "ParadeDB",
        "caption": "ParadeDB：pgvector · pg_search",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "api",
        "to": "ollama",
        "label": "embed",
        "caption": "Hono API → Ollama：embed",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "ollama",
        "label": "Ollama",
        "caption": "Ollama：local embeddings",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "api",
        "to": "llm",
        "label": "chat",
        "caption": "Hono API → Chat provider：chat",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "llm",
        "label": "Chat provider",
        "caption": "Chat provider：keys server-side",
        "phase": 0
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：本地骨架与安全边界",
        "phase": 0
      }
    ],
    "chapters": [],
    "description": "启动、env fail-fast、5 张表迁移、/health 与只绑 127.0.0.1。"
  },
  "1.3": {
    "id": "1.3",
    "type": "workflow",
    "title": "两路来源汇入同一管线",
    "subtitle": "",
    "lanes": [
      {
        "id": "input",
        "label": "来源与入口",
        "variant": "normal"
      },
      {
        "id": "gate",
        "label": "入口拒绝",
        "variant": "exception"
      },
      {
        "id": "pipe",
        "label": "共享管线",
        "variant": "normal"
      },
      {
        "id": "vector",
        "label": "向量",
        "variant": "normal"
      },
      {
        "id": "store",
        "label": "数据落点",
        "variant": "normal"
      }
    ],
    "nodes": [
      {
        "id": "paste",
        "lane": "input",
        "col": 0,
        "type": "frontend",
        "label": "粘贴 / 文件",
        "sublabel": "前端判定类型",
        "width": 150
      },
      {
        "id": "body",
        "lane": "input",
        "col": 1,
        "type": "backend",
        "label": "POST /resources",
        "sublabel": "url 与 content 二选一",
        "width": 160
      },
      {
        "id": "bad-json",
        "lane": "gate",
        "col": 1,
        "type": "security",
        "label": "400 E_BAD_JSON",
        "sublabel": "不建行",
        "width": 150
      },
      {
        "id": "empty",
        "lane": "gate",
        "col": 2,
        "type": "security",
        "label": "400 E_EMPTY_CONTENT",
        "sublabel": "不建行",
        "width": 150
      },
      {
        "id": "pass",
        "lane": "pipe",
        "col": 2,
        "type": "backend",
        "label": "Passthrough",
        "sublabel": "跳过网络",
        "width": 150
      },
      {
        "id": "text",
        "lane": "pipe",
        "col": 3,
        "type": "backend",
        "label": "TextParser",
        "sublabel": "markdown / plaintext 共用",
        "width": 160
      },
      {
        "id": "chunk",
        "lane": "pipe",
        "col": 4,
        "type": "backend",
        "label": "LegacyChunker",
        "sublabel": "保护段 + 偏移",
        "width": 150
      },
      {
        "id": "embed",
        "lane": "vector",
        "col": 4,
        "type": "backend",
        "label": "embedMany",
        "sublabel": "向量与 chunk 对齐",
        "width": 150
      },
      {
        "id": "write",
        "lane": "store",
        "col": 4,
        "type": "database",
        "label": "事务写入",
        "sublabel": "chunk + 向量 + ready",
        "width": 150
      },
      {
        "id": "ready",
        "lane": "store",
        "col": 5,
        "type": "backend",
        "label": "201 ready",
        "sublabel": "warning 可选",
        "width": 150
      }
    ],
    "edges": [
      {
        "from": "paste",
        "to": "body",
        "label": "content",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "body",
        "to": "bad-json",
        "label": "非法 JSON",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "body",
        "to": "empty",
        "label": "空白内容",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "body",
        "to": "pass",
        "label": "content_type",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "pass",
        "to": "text",
        "label": "原文",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "text",
        "to": "chunk",
        "label": "Markdown",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "chunk",
        "to": "embed",
        "label": "chunks",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "embed",
        "to": "write",
        "label": "vectors",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "write",
        "to": "ready",
        "label": "commit",
        "variant": "emphasis",
        "role": "main"
      }
    ],
    "path": [
      "paste",
      "body",
      "pass",
      "text",
      "chunk",
      "embed",
      "write",
      "ready"
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "两路来源汇入同一管线：进入 粘贴 / 文件。",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "paste",
        "label": "粘贴 / 文件",
        "caption": "粘贴 / 文件：前端判定类型",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "paste",
        "to": "body",
        "label": "content",
        "caption": "粘贴 / 文件 → POST /resources：content",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "body",
        "label": "POST /resources",
        "caption": "POST /resources：url 与 content 二选一",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "body",
        "to": "pass",
        "label": "content_type",
        "caption": "POST /resources → Passthrough：content_type",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "pass",
        "label": "Passthrough",
        "caption": "Passthrough：跳过网络",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "pass",
        "to": "text",
        "label": "原文",
        "caption": "Passthrough → TextParser：原文",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "text",
        "label": "TextParser",
        "caption": "TextParser：markdown / plaintext 共用",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "text",
        "to": "chunk",
        "label": "Markdown",
        "caption": "TextParser → LegacyChunker：Markdown",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "chunk",
        "label": "LegacyChunker",
        "caption": "LegacyChunker：保护段 + 偏移",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "chunk",
        "to": "embed",
        "label": "chunks",
        "caption": "LegacyChunker → embedMany：chunks",
        "phase": 3
      },
      {
        "kind": "node",
        "node": "embed",
        "label": "embedMany",
        "caption": "embedMany：向量与 chunk 对齐",
        "phase": 3
      },
      {
        "kind": "edge",
        "from": "embed",
        "to": "write",
        "label": "vectors",
        "caption": "embedMany → 事务写入：vectors",
        "phase": 4
      },
      {
        "kind": "node",
        "node": "write",
        "label": "事务写入",
        "caption": "事务写入：chunk + 向量 + ready",
        "phase": 4
      },
      {
        "kind": "edge",
        "from": "write",
        "to": "ready",
        "label": "commit",
        "caption": "事务写入 → 201 ready：commit",
        "phase": 4
      },
      {
        "kind": "node",
        "node": "ready",
        "label": "201 ready",
        "caption": "201 ready：warning 可选",
        "phase": 4
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：201 ready",
        "phase": 4
      }
    ],
    "chapters": [
      {
        "label": "来源与入口",
        "from": 0,
        "to": 3
      },
      {
        "label": "共享管线",
        "from": 4,
        "to": 9
      },
      {
        "label": "向量",
        "from": 10,
        "to": 11
      },
      {
        "label": "数据落点",
        "from": 12,
        "to": 16
      }
    ],
    "description": "URL 与文本两路来源汇入同一条 ingest 管线。"
  },
  "1.4": {
    "id": "1.4",
    "type": "workflow",
    "title": "删除、取消与写守卫",
    "subtitle": "",
    "lanes": [
      {
        "id": "http",
        "label": "HTTP 入口",
        "variant": "normal"
      },
      {
        "id": "ingest",
        "label": "取消",
        "variant": "normal"
      },
      {
        "id": "db",
        "label": "数据库",
        "variant": "normal"
      },
      {
        "id": "fail",
        "label": "失败 / 拒绝",
        "variant": "exception"
      }
    ],
    "nodes": [
      {
        "id": "delete",
        "lane": "http",
        "col": 0,
        "type": "backend",
        "label": "DELETE /:id",
        "sublabel": "软删入口",
        "width": 140
      },
      {
        "id": "read",
        "lane": "http",
        "col": 1,
        "type": "backend",
        "label": "读当前状态",
        "sublabel": "deleted_at IS NULL",
        "width": 150
      },
      {
        "id": "abort",
        "lane": "ingest",
        "col": 2,
        "type": "security",
        "label": "inflight.abort",
        "sublabel": "处理中先按取消",
        "width": 150
      },
      {
        "id": "soft",
        "lane": "db",
        "col": 3,
        "type": "database",
        "label": "软删 resources",
        "sublabel": "UPDATE deleted_at",
        "width": 150
      },
      {
        "id": "chunks",
        "lane": "db",
        "col": 4,
        "type": "database",
        "label": "物理删 chunks",
        "sublabel": "同事务",
        "width": 150
      },
      {
        "id": "cascade",
        "lane": "db",
        "col": 5,
        "type": "database",
        "label": "embeddings 级联",
        "sublabel": "FK CASCADE",
        "width": 150
      },
      {
        "id": "done",
        "lane": "http",
        "col": 5,
        "type": "backend",
        "label": "204",
        "sublabel": "已删",
        "width": 100
      },
      {
        "id": "abort-only",
        "lane": "http",
        "col": 2,
        "type": "backend",
        "label": "POST /:id/abort",
        "sublabel": "只取消不删",
        "width": 150
      },
      {
        "id": "not-found",
        "lane": "fail",
        "col": 1,
        "type": "security",
        "label": "404 E_NOT_FOUND",
        "sublabel": "已删 / 不存在",
        "width": 150
      },
      {
        "id": "not-inflight",
        "lane": "fail",
        "col": 2,
        "type": "security",
        "label": "409 E_NOT_INFLIGHT",
        "sublabel": "按不下去",
        "width": 150
      },
      {
        "id": "aborted",
        "lane": "http",
        "col": 3,
        "type": "backend",
        "label": "202",
        "sublabel": "取消已按下",
        "width": 100
      }
    ],
    "edges": [
      {
        "from": "delete",
        "to": "read",
        "label": "先读",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "read",
        "to": "not-found",
        "label": "没有活行",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "read",
        "to": "abort",
        "label": "processing",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "read",
        "to": "soft",
        "label": "ready / failed",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "abort",
        "to": "soft",
        "label": "取消后软删",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "soft",
        "to": "chunks",
        "label": "同事务",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "chunks",
        "to": "cascade",
        "label": "级联",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "cascade",
        "to": "done",
        "label": "提交",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "abort-only",
        "to": "abort",
        "label": "按下",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "abort-only",
        "to": "not-inflight",
        "label": "无登记",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "abort",
        "to": "aborted",
        "label": "异步生效",
        "variant": "dashed",
        "role": "main"
      }
    ],
    "path": [
      "delete",
      "read",
      "abort",
      "soft",
      "chunks",
      "cascade",
      "done"
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "删除、取消与写守卫：进入 DELETE /:id。",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "delete",
        "label": "DELETE /:id",
        "caption": "DELETE /:id：软删入口",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "delete",
        "to": "read",
        "label": "先读",
        "caption": "DELETE /:id → 读当前状态：先读",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "read",
        "label": "读当前状态",
        "caption": "读当前状态：deleted_at IS NULL",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "read",
        "to": "abort",
        "label": "processing",
        "caption": "读当前状态 → inflight.abort：processing",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "abort",
        "label": "inflight.abort",
        "caption": "inflight.abort：处理中先按取消",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "abort",
        "to": "soft",
        "label": "取消后软删",
        "caption": "inflight.abort → 软删 resources：取消后软删",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "soft",
        "label": "软删 resources",
        "caption": "软删 resources：UPDATE deleted_at",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "soft",
        "to": "chunks",
        "label": "同事务",
        "caption": "软删 resources → 物理删 chunks：同事务",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "chunks",
        "label": "物理删 chunks",
        "caption": "物理删 chunks：同事务",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "chunks",
        "to": "cascade",
        "label": "级联",
        "caption": "物理删 chunks → embeddings 级联：级联",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "cascade",
        "label": "embeddings 级联",
        "caption": "embeddings 级联：FK CASCADE",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "cascade",
        "to": "done",
        "label": "提交",
        "caption": "embeddings 级联 → 204：提交",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "done",
        "label": "204",
        "caption": "204：已删",
        "phase": 0
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：204",
        "phase": 0
      }
    ],
    "chapters": [
      {
        "label": "HTTP 入口",
        "from": 0,
        "to": 3
      },
      {
        "label": "取消",
        "from": 4,
        "to": 5
      },
      {
        "label": "数据库",
        "from": 6,
        "to": 14
      }
    ],
    "description": "DELETE 软删、取消 inflight、写守卫与级联清理。"
  },
  "2.1": {
    "id": "2.1",
    "type": "architecture",
    "title": "混合检索的两路与融合",
    "subtitle": "",
    "components": [
      {
        "id": "client",
        "type": "external",
        "label": "Question",
        "sublabel": "user query",
        "pos": [
          20,
          300
        ],
        "size": [
          120,
          60
        ]
      },
      {
        "id": "route",
        "type": "backend",
        "label": "POST /retrieve",
        "sublabel": "HTTP 薄层",
        "pos": [
          200,
          300
        ],
        "size": [
          150,
          64
        ]
      },
      {
        "id": "retriever",
        "type": "backend",
        "label": "Retriever.search",
        "sublabel": "两路并行",
        "pos": [
          410,
          300
        ],
        "size": [
          170,
          74
        ]
      },
      {
        "id": "embed",
        "type": "cloud",
        "label": "Embedder",
        "sublabel": "query vector",
        "pos": [
          410,
          120
        ],
        "size": [
          150,
          60
        ]
      },
      {
        "id": "vector",
        "type": "database",
        "label": "pgvector HNSW",
        "sublabel": "cosine topK",
        "pos": [
          660,
          190
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "lexical",
        "type": "database",
        "label": "ParadeDB BM25",
        "sublabel": "score > 0",
        "pos": [
          660,
          320
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "rrf",
        "type": "backend",
        "label": "RRF fusion",
        "sublabel": "名次融合",
        "pos": [
          870,
          250
        ],
        "size": [
          150,
          64
        ]
      },
      {
        "id": "out",
        "type": "backend",
        "label": "hits + counts",
        "sublabel": "topK after fuse",
        "pos": [
          1060,
          250
        ],
        "size": [
          150,
          60
        ]
      }
    ],
    "connections": [
      {
        "from": "client",
        "to": "route",
        "label": "query",
        "variant": "default"
      },
      {
        "from": "route",
        "to": "retriever",
        "label": "search",
        "variant": "emphasis"
      },
      {
        "from": "retriever",
        "to": "embed",
        "label": "embed",
        "variant": "default"
      },
      {
        "from": "embed",
        "to": "vector",
        "label": "query vector",
        "variant": "default"
      },
      {
        "from": "retriever",
        "to": "lexical",
        "label": "BM25",
        "variant": "default"
      },
      {
        "from": "vector",
        "to": "rrf",
        "label": "ranked",
        "variant": "emphasis"
      },
      {
        "from": "lexical",
        "to": "rrf",
        "label": "ranked",
        "variant": "emphasis"
      },
      {
        "from": "rrf",
        "to": "out",
        "label": "hits",
        "variant": "emphasis"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "混合检索的两路与融合：从 Question 开始。",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "client",
        "to": "route",
        "label": "query",
        "caption": "Question → POST /retrieve：query",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "route",
        "label": "POST /retrieve",
        "caption": "POST /retrieve：HTTP 薄层",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "route",
        "to": "retriever",
        "label": "search",
        "caption": "POST /retrieve → Retriever.search：search",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "retriever",
        "label": "Retriever.search",
        "caption": "Retriever.search：两路并行",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "retriever",
        "to": "embed",
        "label": "embed",
        "caption": "Retriever.search → Embedder：embed",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "embed",
        "label": "Embedder",
        "caption": "Embedder：query vector",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "embed",
        "to": "vector",
        "label": "query vector",
        "caption": "Embedder → pgvector HNSW：query vector",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "vector",
        "label": "pgvector HNSW",
        "caption": "pgvector HNSW：cosine topK",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "retriever",
        "to": "lexical",
        "label": "BM25",
        "caption": "Retriever.search → ParadeDB BM25：BM25",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "lexical",
        "label": "ParadeDB BM25",
        "caption": "ParadeDB BM25：score > 0",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "vector",
        "to": "rrf",
        "label": "ranked",
        "caption": "pgvector HNSW → RRF fusion：ranked",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "rrf",
        "label": "RRF fusion",
        "caption": "RRF fusion：名次融合",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "lexical",
        "to": "rrf",
        "label": "ranked",
        "caption": "ParadeDB BM25 → RRF fusion：ranked",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "rrf",
        "label": "RRF fusion",
        "caption": "RRF fusion：名次融合",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "rrf",
        "to": "out",
        "label": "hits",
        "caption": "RRF fusion → hits + counts：hits",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "out",
        "label": "hits + counts",
        "caption": "hits + counts：topK after fuse",
        "phase": 0
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：混合检索的两路与融合",
        "phase": 0
      }
    ],
    "chapters": [],
    "description": "BM25 + 向量两路召回，RRF 融合后取 topK。"
  },
  "2.2": {
    "id": "2.2",
    "type": "sequence",
    "title": "一次流式问答的往返",
    "subtitle": "",
    "participants": [
      {
        "id": "user",
        "label": "Browser",
        "sublabel": "useChat",
        "type": "external"
      },
      {
        "id": "route",
        "label": "POST /chat",
        "sublabel": "薄路由",
        "type": "backend"
      },
      {
        "id": "chat",
        "label": "ChatService",
        "sublabel": "streamText",
        "type": "backend"
      },
      {
        "id": "store",
        "label": "sessions/messages",
        "sublabel": "历史 + 落库",
        "type": "database"
      },
      {
        "id": "model",
        "label": "Chat model",
        "sublabel": "provider",
        "type": "cloud"
      },
      {
        "id": "ui",
        "label": "UI stream",
        "sublabel": "parts → 界面",
        "type": "frontend"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 235,
        "label": "请求与历史"
      },
      {
        "from": 240,
        "to": 330,
        "label": "生成"
      },
      {
        "from": 335,
        "to": 435,
        "label": "回传与中断"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "一次流式问答的往返：从 Browser 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "user",
        "to": "route",
        "y": 160,
        "label": "POST /chat",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "Browser",
        "toLabel": "POST /chat",
        "caption": "Browser → POST /chat：POST /chat"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "route",
        "to": "chat",
        "y": 190,
        "label": "ask()",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "POST /chat",
        "toLabel": "ChatService",
        "caption": "POST /chat → ChatService：ask()"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "chat",
        "to": "store",
        "y": 220,
        "label": "读历史",
        "variant": "dashed",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatService",
        "toLabel": "sessions/messages",
        "caption": "ChatService → sessions/messages：读历史"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "store",
        "to": "chat",
        "y": 250,
        "label": "text parts",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "sessions/messages",
        "toLabel": "ChatService",
        "caption": "sessions/messages → ChatService：text parts"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "chat",
        "to": "model",
        "y": 280,
        "label": "streamText",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "Chat model",
        "caption": "ChatService → Chat model：streamText"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "model",
        "to": "chat",
        "y": 310,
        "label": "tokens",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "Chat model",
        "toLabel": "ChatService",
        "caption": "Chat model → ChatService：tokens"
      },
      {
        "kind": "message",
        "message": 6,
        "from": "chat",
        "to": "ui",
        "y": 340,
        "label": "UI chunks",
        "variant": "emphasis",
        "note": "",
        "phase": 2,
        "fromLabel": "ChatService",
        "toLabel": "UI stream",
        "caption": "ChatService → UI stream：UI chunks"
      },
      {
        "kind": "message",
        "message": 7,
        "from": "ui",
        "to": "user",
        "y": 370,
        "label": "逐字渲染",
        "variant": "return",
        "note": "",
        "phase": 2,
        "fromLabel": "UI stream",
        "toLabel": "Browser",
        "caption": "UI stream → Browser：逐字渲染"
      },
      {
        "kind": "message",
        "message": 8,
        "from": "chat",
        "to": "ui",
        "y": 405,
        "label": "error / abort 帧",
        "variant": "security",
        "note": "",
        "phase": 2,
        "fromLabel": "ChatService",
        "toLabel": "UI stream",
        "caption": "ChatService → UI stream：error / abort 帧"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "9 次往返：UI stream",
        "phase": 2
      }
    ],
    "chapters": [
      {
        "label": "请求与历史"
      },
      {
        "label": "生成"
      },
      {
        "label": "回传与中断"
      }
    ],
    "description": "一次流式问答：历史、tokens、UI chunks 与错误帧。"
  },
  "2.3": {
    "id": "2.3",
    "type": "sequence",
    "title": "tool part → [n] → 面板",
    "subtitle": "",
    "participants": [
      {
        "id": "stream",
        "label": "UI stream",
        "sublabel": "parts",
        "type": "messagebus"
      },
      {
        "id": "assistant",
        "label": "assistant msg",
        "sublabel": "tool-retrieve",
        "type": "backend"
      },
      {
        "id": "refs",
        "label": "referencesOf",
        "sublabel": "api/chat.ts",
        "type": "frontend"
      },
      {
        "id": "thread",
        "label": "ChatThread",
        "sublabel": "[n] 渲染",
        "type": "frontend"
      },
      {
        "id": "panel",
        "label": "CitationPanel",
        "sublabel": "命中列表",
        "type": "frontend"
      },
      {
        "id": "user",
        "label": "Reader",
        "sublabel": "click",
        "type": "external"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 260,
        "label": "读 tool part"
      },
      {
        "from": 265,
        "to": 380,
        "label": "编号与渲染"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "tool part → [n] → 面板：从 UI stream 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "stream",
        "to": "assistant",
        "y": 160,
        "label": "tool-retrieve part",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "UI stream",
        "toLabel": "assistant msg",
        "caption": "UI stream → assistant msg：tool-retrieve part"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "assistant",
        "to": "refs",
        "y": 190,
        "label": "parts",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "assistant msg",
        "toLabel": "referencesOf",
        "caption": "assistant msg → referencesOf：parts"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "refs",
        "to": "thread",
        "y": 220,
        "label": "hits + allHits",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "referencesOf",
        "toLabel": "ChatThread",
        "caption": "referencesOf → ChatThread：hits + allHits"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "thread",
        "to": "panel",
        "y": 250,
        "label": "cited hits",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatThread",
        "toLabel": "CitationPanel",
        "caption": "ChatThread → CitationPanel：cited hits"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "user",
        "to": "thread",
        "y": 280,
        "label": "click [n]",
        "variant": "default",
        "note": "",
        "phase": 1,
        "fromLabel": "Reader",
        "toLabel": "ChatThread",
        "caption": "Reader → ChatThread：click [n]"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "thread",
        "to": "panel",
        "y": 310,
        "label": "revealCitation",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatThread",
        "toLabel": "CitationPanel",
        "caption": "ChatThread → CitationPanel：revealCitation"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "6 次往返：CitationPanel",
        "phase": 1
      }
    ],
    "chapters": [
      {
        "label": "读 tool part"
      },
      {
        "label": "编号与渲染"
      }
    ],
    "description": "response 里的 tool part → [n] 引用 → 右栏面板。"
  },
  "2.4": {
    "id": "2.4",
    "type": "sequence",
    "title": "点引用 → 原文抽屉",
    "subtitle": "",
    "participants": [
      {
        "id": "user",
        "label": "Reader",
        "sublabel": "click citation",
        "type": "external"
      },
      {
        "id": "thread",
        "label": "ChatThread",
        "sublabel": "命中快照",
        "type": "frontend"
      },
      {
        "id": "drawer",
        "label": "Drawer",
        "sublabel": "原文 / 来源",
        "type": "frontend"
      },
      {
        "id": "detail",
        "label": "ResourceDetail",
        "sublabel": "content + offsets",
        "type": "frontend"
      },
      {
        "id": "api",
        "label": "GET /resources/:id",
        "sublabel": "按需详情",
        "type": "backend"
      },
      {
        "id": "store",
        "label": "messages",
        "sublabel": "快照真源",
        "type": "database"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 250,
        "label": "打开快照"
      },
      {
        "from": 255,
        "to": 390,
        "label": "补来源"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "点引用 → 原文抽屉：从 Reader 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "user",
        "to": "thread",
        "y": 160,
        "label": "click [n]",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "Reader",
        "toLabel": "ChatThread",
        "caption": "Reader → ChatThread：click [n]"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "thread",
        "to": "store",
        "y": 190,
        "label": "读 message parts",
        "variant": "dashed",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatThread",
        "toLabel": "messages",
        "caption": "ChatThread → messages：读 message parts"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "store",
        "to": "thread",
        "y": 220,
        "label": "snapshot",
        "variant": "return",
        "note": "",
        "phase": 0,
        "fromLabel": "messages",
        "toLabel": "ChatThread",
        "caption": "messages → ChatThread：snapshot"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "thread",
        "to": "drawer",
        "y": 260,
        "label": "open(hit)",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatThread",
        "toLabel": "Drawer",
        "caption": "ChatThread → Drawer：open(hit)"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "drawer",
        "to": "detail",
        "y": 280,
        "label": "content + offsets",
        "variant": "default",
        "note": "",
        "phase": 1,
        "fromLabel": "Drawer",
        "toLabel": "ResourceDetail",
        "caption": "Drawer → ResourceDetail：content + offsets"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "drawer",
        "to": "api",
        "y": 310,
        "label": "取来源详情",
        "variant": "default",
        "note": "",
        "phase": 1,
        "fromLabel": "Drawer",
        "toLabel": "GET /resources/:id",
        "caption": "Drawer → GET /resources/:id：取来源详情"
      },
      {
        "kind": "message",
        "message": 6,
        "from": "api",
        "to": "drawer",
        "y": 340,
        "label": "200 source",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "GET /resources/:id",
        "toLabel": "Drawer",
        "caption": "GET /resources/:id → Drawer：200 source"
      },
      {
        "kind": "message",
        "message": 7,
        "from": "api",
        "to": "drawer",
        "y": 370,
        "label": "404 已删",
        "variant": "security",
        "note": "",
        "phase": 1,
        "fromLabel": "GET /resources/:id",
        "toLabel": "Drawer",
        "caption": "GET /resources/:id → Drawer：404 已删"
      },
      {
        "kind": "message",
        "message": 8,
        "from": "drawer",
        "to": "user",
        "y": 400,
        "label": "来源标识 / 已删除",
        "variant": "return",
        "note": "",
        "phase": 0,
        "fromLabel": "Drawer",
        "toLabel": "Reader",
        "caption": "Drawer → Reader：来源标识 / 已删除"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "9 次往返：Reader",
        "phase": 1
      }
    ],
    "chapters": [
      {
        "label": "打开快照"
      },
      {
        "label": "补来源"
      }
    ],
    "description": "点 [n] → 原文快照抽屉；来源删了仍可看。"
  },
  "2.5": {
    "id": "2.5",
    "type": "sequence",
    "title": "两轮追问：历史怎么进模型",
    "subtitle": "",
    "participants": [
      {
        "id": "client",
        "label": "useChat",
        "sublabel": "sessionId",
        "type": "external"
      },
      {
        "id": "route",
        "label": "POST /chat",
        "sublabel": "薄路由",
        "type": "backend"
      },
      {
        "id": "chat",
        "label": "ChatService",
        "sublabel": "历史 + 落库",
        "type": "backend"
      },
      {
        "id": "store",
        "label": "sessions/messages",
        "sublabel": "parts 真源",
        "type": "database"
      },
      {
        "id": "model",
        "label": "Chat model",
        "sublabel": "自己展开检索词",
        "type": "cloud"
      },
      {
        "id": "tool",
        "label": "retrieve",
        "sublabel": "工具",
        "type": "backend"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 330,
        "label": "第一轮"
      },
      {
        "from": 335,
        "to": 540,
        "label": "第二轮追问"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "两轮追问：历史怎么进模型：从 useChat 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "client",
        "to": "route",
        "y": 160,
        "label": "turn 1",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "useChat",
        "toLabel": "POST /chat",
        "caption": "useChat → POST /chat：turn 1"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "route",
        "to": "chat",
        "y": 190,
        "label": "ask()",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "POST /chat",
        "toLabel": "ChatService",
        "caption": "POST /chat → ChatService：ask()"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "chat",
        "to": "store",
        "y": 220,
        "label": "读最近 6 轮",
        "variant": "dashed",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatService",
        "toLabel": "sessions/messages",
        "caption": "ChatService → sessions/messages：读最近 6 轮"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "store",
        "to": "chat",
        "y": 250,
        "label": "text parts",
        "variant": "return",
        "note": "",
        "phase": 0,
        "fromLabel": "sessions/messages",
        "toLabel": "ChatService",
        "caption": "sessions/messages → ChatService：text parts"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "chat",
        "to": "model",
        "y": 280,
        "label": "streamText",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatService",
        "toLabel": "Chat model",
        "caption": "ChatService → Chat model：streamText"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "model",
        "to": "tool",
        "y": 310,
        "label": "retrieve",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "Chat model",
        "toLabel": "retrieve",
        "caption": "Chat model → retrieve：retrieve"
      },
      {
        "kind": "message",
        "message": 6,
        "from": "chat",
        "to": "store",
        "y": 340,
        "label": "落 user + assistant",
        "variant": "dashed",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "sessions/messages",
        "caption": "ChatService → sessions/messages：落 user + assistant"
      },
      {
        "kind": "message",
        "message": 7,
        "from": "client",
        "to": "route",
        "y": 380,
        "label": "turn 2 追问",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "useChat",
        "toLabel": "POST /chat",
        "caption": "useChat → POST /chat：turn 2 追问"
      },
      {
        "kind": "message",
        "message": 8,
        "from": "chat",
        "to": "store",
        "y": 410,
        "label": "读最近 6 轮",
        "variant": "dashed",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "sessions/messages",
        "caption": "ChatService → sessions/messages：读最近 6 轮"
      },
      {
        "kind": "message",
        "message": 9,
        "from": "store",
        "to": "chat",
        "y": 440,
        "label": "text parts",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "sessions/messages",
        "toLabel": "ChatService",
        "caption": "sessions/messages → ChatService：text parts"
      },
      {
        "kind": "message",
        "message": 10,
        "from": "chat",
        "to": "model",
        "y": 470,
        "label": "模型自建检索词",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "Chat model",
        "caption": "ChatService → Chat model：模型自建检索词"
      },
      {
        "kind": "message",
        "message": 11,
        "from": "model",
        "to": "tool",
        "y": 500,
        "label": "retrieve",
        "variant": "default",
        "note": "",
        "phase": 1,
        "fromLabel": "Chat model",
        "toLabel": "retrieve",
        "caption": "Chat model → retrieve：retrieve"
      },
      {
        "kind": "message",
        "message": 12,
        "from": "chat",
        "to": "store",
        "y": 530,
        "label": "落新消息",
        "variant": "dashed",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "sessions/messages",
        "caption": "ChatService → sessions/messages：落新消息"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "13 次往返：sessions/messages",
        "phase": 1
      }
    ],
    "chapters": [
      {
        "label": "第一轮"
      },
      {
        "label": "第二轮追问"
      }
    ],
    "description": "两轮追问：历史只回灌 text parts。"
  },
  "2.6": {
    "id": "2.6",
    "type": "workflow",
    "title": "模型自己调用检索",
    "subtitle": "",
    "lanes": [
      {
        "id": "model",
        "label": "模型",
        "variant": "normal"
      },
      {
        "id": "tool",
        "label": "工具",
        "variant": "normal"
      },
      {
        "id": "retrieval",
        "label": "检索",
        "variant": "normal"
      },
      {
        "id": "response",
        "label": "回答",
        "variant": "normal"
      },
      {
        "id": "error",
        "label": "结构化错误",
        "variant": "exception"
      }
    ],
    "nodes": [
      {
        "id": "prompt",
        "lane": "model",
        "col": 0,
        "type": "external",
        "label": "User question",
        "sublabel": "query",
        "width": 140
      },
      {
        "id": "step1",
        "lane": "model",
        "col": 1,
        "type": "backend",
        "label": "Model step 1",
        "sublabel": "决定调工具",
        "width": 150
      },
      {
        "id": "call",
        "lane": "model",
        "col": 2,
        "type": "backend",
        "label": "tool call",
        "sublabel": "retrieve + topK",
        "width": 150
      },
      {
        "id": "search",
        "lane": "tool",
        "col": 3,
        "type": "backend",
        "label": "Retriever.search",
        "sublabel": "两路融合",
        "width": 150
      },
      {
        "id": "hits",
        "lane": "retrieval",
        "col": 4,
        "type": "backend",
        "label": "hits",
        "sublabel": "tool output",
        "width": 120
      },
      {
        "id": "step2",
        "lane": "model",
        "col": 4,
        "type": "backend",
        "label": "Model step 2",
        "sublabel": "带 tool output 作答",
        "width": 160
      },
      {
        "id": "answer",
        "lane": "response",
        "col": 5,
        "type": "backend",
        "label": "Answer",
        "sublabel": "200 答案体",
        "width": 140
      },
      {
        "id": "err",
        "lane": "error",
        "col": 3,
        "type": "security",
        "label": "structured error",
        "sublabel": "E_DIMENSION_MISMATCH",
        "width": 170
      }
    ],
    "edges": [
      {
        "from": "prompt",
        "to": "step1",
        "label": "prompt",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "step1",
        "to": "call",
        "label": "call",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "call",
        "to": "search",
        "label": "execute",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "search",
        "to": "hits",
        "label": "hits",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "search",
        "to": "err",
        "label": "检索失败",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "hits",
        "to": "step2",
        "label": "tool output",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "err",
        "to": "step2",
        "label": "error output",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "step2",
        "to": "answer",
        "label": "final text",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "step2",
        "to": "call",
        "label": "未超 5 步可重查",
        "variant": "dashed",
        "role": "branch"
      }
    ],
    "path": [
      "prompt",
      "step1",
      "call",
      "search",
      "hits",
      "step2",
      "answer"
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "模型自己调用检索：进入 User question。",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "prompt",
        "label": "User question",
        "caption": "User question：query",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "prompt",
        "to": "step1",
        "label": "prompt",
        "caption": "User question → Model step 1：prompt",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "step1",
        "label": "Model step 1",
        "caption": "Model step 1：决定调工具",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "step1",
        "to": "call",
        "label": "call",
        "caption": "Model step 1 → tool call：call",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "call",
        "label": "tool call",
        "caption": "tool call：retrieve + topK",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "call",
        "to": "search",
        "label": "execute",
        "caption": "tool call → Retriever.search：execute",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "search",
        "label": "Retriever.search",
        "caption": "Retriever.search：两路融合",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "search",
        "to": "hits",
        "label": "hits",
        "caption": "Retriever.search → hits：hits",
        "phase": 2
      },
      {
        "kind": "node",
        "node": "hits",
        "label": "hits",
        "caption": "hits：tool output",
        "phase": 2
      },
      {
        "kind": "edge",
        "from": "hits",
        "to": "step2",
        "label": "tool output",
        "caption": "hits → Model step 2：tool output",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "step2",
        "label": "Model step 2",
        "caption": "Model step 2：带 tool output 作答",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "step2",
        "to": "answer",
        "label": "final text",
        "caption": "Model step 2 → Answer：final text",
        "phase": 3
      },
      {
        "kind": "node",
        "node": "answer",
        "label": "Answer",
        "caption": "Answer：200 答案体",
        "phase": 3
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：Answer",
        "phase": 3
      }
    ],
    "chapters": [
      {
        "label": "模型",
        "from": 0,
        "to": 5
      },
      {
        "label": "工具",
        "from": 6,
        "to": 7
      },
      {
        "label": "检索",
        "from": 8,
        "to": 11
      },
      {
        "label": "回答",
        "from": 12,
        "to": 14
      }
    ],
    "description": "模型自己调用 retrieve；最多 4 次有界重查。"
  },
  "3.1": {
    "id": "3.1",
    "type": "architecture",
    "title": "通用端点轨迹壳",
    "subtitle": "",
    "components": [
      {
        "id": "request",
        "type": "external",
        "label": "HTTP request",
        "sublabel": "any route",
        "pos": [
          20,
          300
        ],
        "size": [
          140,
          60
        ]
      },
      {
        "id": "shell",
        "type": "security",
        "label": "endpoint shell",
        "sublabel": "X-Trace-Id + timing",
        "pos": [
          220,
          300
        ],
        "size": [
          180,
          74
        ]
      },
      {
        "id": "route",
        "type": "backend",
        "label": "route handler",
        "sublabel": "business",
        "pos": [
          460,
          300
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "traces",
        "type": "database",
        "label": "traces",
        "sublabel": "one row per request",
        "pos": [
          700,
          190
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "stages",
        "type": "database",
        "label": "trace_stages",
        "sublabel": "optional stages",
        "pos": [
          700,
          340
        ],
        "size": [
          160,
          64
        ]
      },
      {
        "id": "pino",
        "type": "messagebus",
        "label": "pino logs",
        "sublabel": "ALS trace_id",
        "pos": [
          460,
          480
        ],
        "size": [
          160,
          60
        ]
      },
      {
        "id": "response",
        "type": "backend",
        "label": "Response",
        "sublabel": "SSE / JSON",
        "pos": [
          880,
          300
        ],
        "size": [
          150,
          60
        ]
      }
    ],
    "connections": [
      {
        "from": "request",
        "to": "shell",
        "label": "HTTP",
        "variant": "default"
      },
      {
        "from": "shell",
        "to": "route",
        "label": "next",
        "variant": "emphasis"
      },
      {
        "from": "route",
        "to": "traces",
        "label": "one row",
        "variant": "emphasis"
      },
      {
        "from": "route",
        "to": "stages",
        "label": "stages",
        "variant": "dashed"
      },
      {
        "from": "shell",
        "to": "pino",
        "label": "trace_id",
        "variant": "dashed"
      },
      {
        "from": "route",
        "to": "response",
        "label": "response",
        "variant": "emphasis"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "通用端点轨迹壳：从 HTTP request 开始。",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "request",
        "to": "shell",
        "label": "HTTP",
        "caption": "HTTP request → endpoint shell：HTTP",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "shell",
        "label": "endpoint shell",
        "caption": "endpoint shell：X-Trace-Id + timing",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "shell",
        "to": "route",
        "label": "next",
        "caption": "endpoint shell → route handler：next",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "route",
        "label": "route handler",
        "caption": "route handler：business",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "route",
        "to": "traces",
        "label": "one row",
        "caption": "route handler → traces：one row",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "traces",
        "label": "traces",
        "caption": "traces：one row per request",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "route",
        "to": "stages",
        "label": "stages",
        "caption": "route handler → trace_stages：stages",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "stages",
        "label": "trace_stages",
        "caption": "trace_stages：optional stages",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "shell",
        "to": "pino",
        "label": "trace_id",
        "caption": "endpoint shell → pino logs：trace_id",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "pino",
        "label": "pino logs",
        "caption": "pino logs：ALS trace_id",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "route",
        "to": "response",
        "label": "response",
        "caption": "route handler → Response：response",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "response",
        "label": "Response",
        "caption": "Response：SSE / JSON",
        "phase": 0
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：通用端点轨迹壳",
        "phase": 0
      }
    ],
    "chapters": [],
    "description": "端点壳、trace 一行、payloads 与 pino 日志。"
  },
  "3.2": {
    "id": "3.2",
    "type": "sequence",
    "title": "chat 流 → Langfuse",
    "subtitle": "",
    "participants": [
      {
        "id": "client",
        "label": "Browser",
        "sublabel": "useChat",
        "type": "external"
      },
      {
        "id": "route",
        "label": "POST /chat",
        "sublabel": "SSE",
        "type": "backend"
      },
      {
        "id": "chat",
        "label": "ChatService",
        "sublabel": "streamText",
        "type": "backend"
      },
      {
        "id": "span",
        "label": "SpanProcessor",
        "sublabel": "ALS 关联",
        "type": "security"
      },
      {
        "id": "langfuse",
        "label": "Langfuse",
        "sublabel": "remote trace",
        "type": "cloud"
      },
      {
        "id": "stream",
        "label": "UI stream",
        "sublabel": "chunks",
        "type": "messagebus"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 260,
        "label": "开流"
      },
      {
        "from": 265,
        "to": 390,
        "label": "生成"
      },
      {
        "from": 395,
        "to": 500,
        "label": "收口"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "chat 流 → Langfuse：从 Browser 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "client",
        "to": "route",
        "y": 160,
        "label": "POST /chat",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "Browser",
        "toLabel": "POST /chat",
        "caption": "Browser → POST /chat：POST /chat"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "route",
        "to": "chat",
        "y": 190,
        "label": "ask()",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "POST /chat",
        "toLabel": "ChatService",
        "caption": "POST /chat → ChatService：ask()"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "chat",
        "to": "span",
        "y": 220,
        "label": "root span onStart",
        "variant": "security",
        "note": "",
        "phase": 0,
        "fromLabel": "ChatService",
        "toLabel": "SpanProcessor",
        "caption": "ChatService → SpanProcessor：root span onStart"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "span",
        "to": "langfuse",
        "y": 250,
        "label": "session.id + tags",
        "variant": "dashed",
        "note": "",
        "phase": 0,
        "fromLabel": "SpanProcessor",
        "toLabel": "Langfuse",
        "caption": "SpanProcessor → Langfuse：session.id + tags"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "chat",
        "to": "stream",
        "y": 280,
        "label": "streamText",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "UI stream",
        "caption": "ChatService → UI stream：streamText"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "stream",
        "to": "chat",
        "y": 310,
        "label": "tokens / tool",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "UI stream",
        "toLabel": "ChatService",
        "caption": "UI stream → ChatService：tokens / tool"
      },
      {
        "kind": "message",
        "message": 6,
        "from": "chat",
        "to": "client",
        "y": 340,
        "label": "UI chunks",
        "variant": "emphasis",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "Browser",
        "caption": "ChatService → Browser：UI chunks"
      },
      {
        "kind": "message",
        "message": 7,
        "from": "chat",
        "to": "span",
        "y": 370,
        "label": "onEnd ok/error/cancelled",
        "variant": "security",
        "note": "",
        "phase": 1,
        "fromLabel": "ChatService",
        "toLabel": "SpanProcessor",
        "caption": "ChatService → SpanProcessor：onEnd ok/error/cancelled"
      },
      {
        "kind": "message",
        "message": 8,
        "from": "span",
        "to": "langfuse",
        "y": 400,
        "label": "export trace",
        "variant": "dashed",
        "note": "",
        "phase": 2,
        "fromLabel": "SpanProcessor",
        "toLabel": "Langfuse",
        "caption": "SpanProcessor → Langfuse：export trace"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "9 次往返：Langfuse",
        "phase": 2
      }
    ],
    "chapters": [
      {
        "label": "开流"
      },
      {
        "label": "生成"
      },
      {
        "label": "收口"
      }
    ],
    "description": "chat 流 → OTel span → Langfuse trace。"
  },
  "3.3": {
    "id": "3.3",
    "type": "sequence",
    "title": "retrieve 五段与两种 sink",
    "subtitle": "",
    "participants": [
      {
        "id": "route",
        "label": "POST /retrieve",
        "sublabel": "HTTP",
        "type": "backend"
      },
      {
        "id": "retriever",
        "label": "Retriever.search",
        "sublabel": "5 stages",
        "type": "backend"
      },
      {
        "id": "embed",
        "label": "Embedder",
        "sublabel": "query vector",
        "type": "cloud"
      },
      {
        "id": "vector",
        "label": "pgvector",
        "sublabel": "HNSW",
        "type": "database"
      },
      {
        "id": "lexical",
        "label": "BM25",
        "sublabel": "pg_search",
        "type": "database"
      },
      {
        "id": "rrf",
        "label": "RRF",
        "sublabel": "fuse",
        "type": "backend"
      },
      {
        "id": "sink",
        "label": "stage sink",
        "sublabel": "DB / Langfuse",
        "type": "messagebus"
      }
    ],
    "segments": [
      {
        "from": 150,
        "to": 290,
        "label": "查"
      },
      {
        "from": 295,
        "to": 410,
        "label": "融合 + 记录"
      }
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "retrieve 五段与两种 sink：从 POST /retrieve 开始。",
        "phase": 0
      },
      {
        "kind": "message",
        "message": 0,
        "from": "route",
        "to": "retriever",
        "y": 160,
        "label": "search",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "POST /retrieve",
        "toLabel": "Retriever.search",
        "caption": "POST /retrieve → Retriever.search：search"
      },
      {
        "kind": "message",
        "message": 1,
        "from": "retriever",
        "to": "embed",
        "y": 190,
        "label": "embed query",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "Retriever.search",
        "toLabel": "Embedder",
        "caption": "Retriever.search → Embedder：embed query"
      },
      {
        "kind": "message",
        "message": 2,
        "from": "retriever",
        "to": "vector",
        "y": 220,
        "label": "HNSW topK",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "Retriever.search",
        "toLabel": "pgvector",
        "caption": "Retriever.search → pgvector：HNSW topK"
      },
      {
        "kind": "message",
        "message": 3,
        "from": "retriever",
        "to": "lexical",
        "y": 250,
        "label": "BM25 topK",
        "variant": "default",
        "note": "",
        "phase": 0,
        "fromLabel": "Retriever.search",
        "toLabel": "BM25",
        "caption": "Retriever.search → BM25：BM25 topK"
      },
      {
        "kind": "message",
        "message": 4,
        "from": "retriever",
        "to": "rrf",
        "y": 280,
        "label": "fuse",
        "variant": "emphasis",
        "note": "",
        "phase": 0,
        "fromLabel": "Retriever.search",
        "toLabel": "RRF",
        "caption": "Retriever.search → RRF：fuse"
      },
      {
        "kind": "message",
        "message": 5,
        "from": "rrf",
        "to": "retriever",
        "y": 310,
        "label": "hits",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "RRF",
        "toLabel": "Retriever.search",
        "caption": "RRF → Retriever.search：hits"
      },
      {
        "kind": "message",
        "message": 6,
        "from": "retriever",
        "to": "sink",
        "y": 340,
        "label": "5 stage events",
        "variant": "dashed",
        "note": "",
        "phase": 1,
        "fromLabel": "Retriever.search",
        "toLabel": "stage sink",
        "caption": "Retriever.search → stage sink：5 stage events"
      },
      {
        "kind": "message",
        "message": 7,
        "from": "retriever",
        "to": "route",
        "y": 370,
        "label": "hits + counts",
        "variant": "return",
        "note": "",
        "phase": 1,
        "fromLabel": "Retriever.search",
        "toLabel": "POST /retrieve",
        "caption": "Retriever.search → POST /retrieve：hits + counts"
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "8 次往返：POST /retrieve",
        "phase": 1
      }
    ],
    "chapters": [
      {
        "label": "查"
      },
      {
        "label": "融合 + 记录"
      }
    ],
    "description": "retrieve 五段与 DB / Langfuse 两种 sink。"
  },
  "3.4": {
    "id": "3.4",
    "type": "workflow",
    "title": "ingest 五段与 trace",
    "subtitle": "",
    "lanes": [
      {
        "id": "ingest",
        "label": "Ingest.run",
        "variant": "normal"
      },
      {
        "id": "stages",
        "label": "五段",
        "variant": "normal"
      },
      {
        "id": "trace",
        "label": "trace",
        "variant": "normal"
      },
      {
        "id": "db",
        "label": "数据库",
        "variant": "normal"
      },
      {
        "id": "error",
        "label": "失败短路",
        "variant": "exception"
      }
    ],
    "nodes": [
      {
        "id": "run",
        "lane": "ingest",
        "col": 0,
        "type": "backend",
        "label": "Ingest.run",
        "sublabel": "接 DB sink",
        "width": 140
      },
      {
        "id": "fetch",
        "lane": "stages",
        "col": 1,
        "type": "cloud",
        "label": "fetch",
        "sublabel": "final_url / status",
        "width": 140
      },
      {
        "id": "parse",
        "lane": "stages",
        "col": 2,
        "type": "backend",
        "label": "parse",
        "sublabel": "正文",
        "width": 120
      },
      {
        "id": "chunk",
        "lane": "stages",
        "col": 3,
        "type": "backend",
        "label": "chunk",
        "sublabel": "偏移",
        "width": 120
      },
      {
        "id": "embed",
        "lane": "stages",
        "col": 4,
        "type": "backend",
        "label": "embed",
        "sublabel": "telemetry off",
        "width": 140
      },
      {
        "id": "write",
        "lane": "stages",
        "col": 5,
        "type": "database",
        "label": "write",
        "sublabel": "chunk + 向量",
        "width": 140
      },
      {
        "id": "sink",
        "lane": "trace",
        "col": 3,
        "type": "messagebus",
        "label": "stage sink",
        "sublabel": "DB trace_stages",
        "width": 150
      },
      {
        "id": "traces",
        "lane": "db",
        "col": 4,
        "type": "database",
        "label": "traces",
        "sublabel": "trace_id + resource_id",
        "width": 160
      },
      {
        "id": "resource",
        "lane": "db",
        "col": 5,
        "type": "database",
        "label": "resources",
        "sublabel": "ready",
        "width": 140
      },
      {
        "id": "failed",
        "lane": "error",
        "col": 4,
        "type": "security",
        "label": "error stage",
        "sublabel": "只写一行",
        "width": 140
      }
    ],
    "edges": [
      {
        "from": "run",
        "to": "fetch",
        "label": "start",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "fetch",
        "to": "parse",
        "label": "raw",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "parse",
        "to": "chunk",
        "label": "text",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "chunk",
        "to": "embed",
        "label": "chunks",
        "variant": "default",
        "role": "main"
      },
      {
        "from": "embed",
        "to": "write",
        "label": "vectors",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "write",
        "to": "resource",
        "label": "resource_id",
        "variant": "emphasis",
        "role": "main"
      },
      {
        "from": "run",
        "to": "sink",
        "label": "每段 onStart/onEnd",
        "variant": "dashed",
        "role": "main"
      },
      {
        "from": "sink",
        "to": "traces",
        "label": "trace_stages",
        "variant": "dashed",
        "role": "main"
      },
      {
        "from": "fetch",
        "to": "failed",
        "label": "fetch 失败",
        "variant": "security",
        "role": "error"
      },
      {
        "from": "failed",
        "to": "traces",
        "label": "error row",
        "variant": "security",
        "role": "error"
      }
    ],
    "path": [
      "run",
      "fetch",
      "parse",
      "chunk",
      "embed",
      "write",
      "resource"
    ],
    "cues": [
      {
        "kind": "start",
        "label": "开始",
        "caption": "ingest 五段与 trace：进入 Ingest.run。",
        "phase": 0
      },
      {
        "kind": "node",
        "node": "run",
        "label": "Ingest.run",
        "caption": "Ingest.run：接 DB sink",
        "phase": 0
      },
      {
        "kind": "edge",
        "from": "run",
        "to": "fetch",
        "label": "start",
        "caption": "Ingest.run → fetch：start",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "fetch",
        "label": "fetch",
        "caption": "fetch：final_url / status",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "fetch",
        "to": "parse",
        "label": "raw",
        "caption": "fetch → parse：raw",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "parse",
        "label": "parse",
        "caption": "parse：正文",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "parse",
        "to": "chunk",
        "label": "text",
        "caption": "parse → chunk：text",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "chunk",
        "label": "chunk",
        "caption": "chunk：偏移",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "chunk",
        "to": "embed",
        "label": "chunks",
        "caption": "chunk → embed：chunks",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "embed",
        "label": "embed",
        "caption": "embed：telemetry off",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "embed",
        "to": "write",
        "label": "vectors",
        "caption": "embed → write：vectors",
        "phase": 1
      },
      {
        "kind": "node",
        "node": "write",
        "label": "write",
        "caption": "write：chunk + 向量",
        "phase": 1
      },
      {
        "kind": "edge",
        "from": "write",
        "to": "resource",
        "label": "resource_id",
        "caption": "write → resources：resource_id",
        "phase": 3
      },
      {
        "kind": "node",
        "node": "resource",
        "label": "resources",
        "caption": "resources：ready",
        "phase": 3
      },
      {
        "kind": "end",
        "label": "完成",
        "caption": "完成：resources",
        "phase": 3
      }
    ],
    "chapters": [
      {
        "label": "Ingest.run",
        "from": 0,
        "to": 1
      },
      {
        "label": "五段",
        "from": 2,
        "to": 11
      },
      {
        "label": "数据库",
        "from": 12,
        "to": 14
      }
    ],
    "description": "ingest 五段 → resource trace stages。"
  }
};
