export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic2-story1-hybrid-retrieval.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 2 · Story 2.1 混合检索问答（基础） · 带代码逐行讲解",
  "tocTitle": "Story 2.1",
  "tocSub": "混合检索 · 向量 + BM25 + RRF",
  "accent": "#3730a3",
  "accent2": "#312e81",
  "accentDark": "#a5b4fc",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>EPIC 2 · STORY 2.1</span><span>2026-10-14 · done</span><span>检索层</span></div>\n  <h1>先把<em>依据</em>捞对，再让模型开口</h1>\n  <p class=\"hero-sub\">Story 2.1 交付的是混合检索这一半：向量 HNSW 取 topK、ParadeDB BM25 取词法候选、RRF 只按名次合并；<code>POST /retrieve</code> 第一次把命中摊开，<code>POST /chat</code> 第一次立起状态码与空库话术。生成、落库、工具化、trace 都是后来的补丁，页内逐条打了徽章。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>2 条 SQL</strong> 向量 + 词法</span>\n    <span class=\"chip\"><strong>1 个融合器</strong> RRF</span>\n    <span class=\"chip\"><strong>2 个端点</strong> /retrieve · /chat</span>\n    <span class=\"chip\"><strong>400 / 409 / 200</strong> 状态码分层</span>\n  </div>\n  <div class=\"trace-pill\">实测锚点 <b>Qoder 怎么安装</b> → v=10 l=10 → <b>rrf=1/61+1/61=0.03279</b> → sim=0.6317</div>\n</header>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">01 · BOUNDARY</span>\n    <h2>一句话结论与边界</h2>\n    <p class=\"section-sub\">2.1 只回答“两路各命中什么”，不回答“资料够不够”。它只保证 0 命中回话术；“够不够”留给生成侧（2.2/2.6）的模型。</p>\n  </header>\n  <div class=\"callout strong\">\n    <p><strong>一句话：</strong>2.1 把“找依据”做成了可替换的两路检索 + 名次融合。它不负责“说得对”（生成），也不负责“记得住”（sessions/messages），更不负责“看得见”（trace）。</p>\n  </div>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\">\n      <div class=\"summary-no\">01 · 交付</div>\n      <h3>检索这一半</h3>\n      <p>向量 topK + ParadeDB BM25 + RRF 名次融合；Retriever 工厂/注册表把策略名兑换成实例；<code>/retrieve</code> 与 <code>/chat</code> 第一版；空提问 400、混维 409、零命中/空库 200 答案体。</p>\n    </article>\n    <article class=\"summary-card\">\n      <div class=\"summary-no\">02 · 边界</div>\n      <h3>不在这格</h3>\n      <p>生成与流式（2.2）、会话落库（2.5）、检索工具化（2.6）、DI 与每请求现查维度（DI）、stage trace（3.3）。它们会以徽章出现在代码里，不算 2.1 的交付。</p>\n    </article>\n    <article class=\"summary-card\">\n      <div class=\"summary-no\">03 · 验收口径</div>\n      <h3>状态码先分层</h3>\n      <p>空提问/坏 body 400；库中混维 409；0 命中、空库、全无 ready 都是 200 答案体。因为 2.2 的 <code>useChat</code> 会把非 2xx 走成错误通道，没法渲染成对话气泡。</p>\n    </article>\n  </div>\n  <h3 class=\"block-title\" style=\"margin-top:30px\">AC 与 as-built 的八处变更（必须如实读）</h3>\n  <table class=\"file-table\">\n    <thead><tr><th>主题</th><th>AC 当时怎么写</th><th>as-built 实际怎么落</th></tr></thead>\n    <tbody>\n  <tr><td><strong>拒答判据</strong></td><td>AC 原句：未命中或两路分数都低于默认下限 → “知识库中未找到相关内容”。</td><td>2.1 的检索侧只保证“0 命中回固定话术”；有命中时它不判“够不够”，answer 留空，把判断留给后续生成侧（2.2/2.6）的模型。阈值只兜字符噪声：实测库里已无 WeKnora 主题，问“WeKnora 怎么部署”仍拿到 sim=0.5502，高于含糊问句“是什么”的 0.5023。</td></tr>\n  <tr><td><strong>空库定义</strong></td><td>AC 要求区分“尚未添加”与“全部删除”。</td><td>2026-10-14 Lynx 定：为空 = 未软删行为 0，含“全部已删除”，不另设第三种话术。实测 5 行全软删时 /chat 返回 200 与“尚未添加任何资源”。</td></tr>\n  <tr><td><strong>维度错误码</strong></td><td>AC 要求维度不符明确拒绝、绝不回退 BM25-only；2.1 交付了 E_DIMENSION_MISMATCH + E_DIMENSION_UNKNOWN 两个 409。</td><td>2026-10-20 DI 改造后 E_DIMENSION_UNKNOWN 整条退役：维度改成每请求现查，库不可达时 /retrieve 直接 500；混维仍 409 E_DIMENSION_MISMATCH。</td></tr>\n  <tr><td><strong>RRF 归一化</strong></td><td>AC 只要求融合，没有规定分数形状。</td><td>代码不做 min-max 或除以路数；score 就是原始 1/(k+rank) 求和，所以双路 rank1 是 0.03279。页内按原值展示，不假装它是 0~1 的百分比。</td></tr>\n  <tr><td><strong>sessions/messages</strong></td><td>2.1 AC 写“经 Repository 端口写入 sessions/messages”。</td><td>Lynx 2026-10-15 D1 推到 Story 2.5；2.1 不落库，当前落库代码带 2.5 徽章。</td></tr>\n  <tr><td><strong>生成侧</strong></td><td>2.1 AC 写“生成仅依据这些 Chunk 的回答”。</td><td>2.1 只交付确定性提示，answer 为空串 + hits 原样带出；流式在 2.2，真正依据工具结果作答在 2.6。</td></tr>\n  <tr><td><strong>三条提示的可验收性</strong></td><td>AC 要求空库/全无 ready/未找到三种提示。</td><td>评审 D4：前端 /ask 打的是 /retrieve，而判定只住 agent/chat/chat.ts、经 /chat 暴露；2.1 只能 curl 验收，UI 接线随 2.2。后来 2.6 把这套固定话术换成了模型提示词约束。</td></tr>\n  <tr><td><strong>“两路皆空”分支</strong></td><td>AC 期待“两路都低于下限”能触发未找到。</td><td>match_disjunction 是 token OR，实测标点/垃圾问句也能命中 62/62 chunks，lexicalCount 几乎不会为 0；这条是交付配置下打不到的死分支，AC 措辞随“拒答交模型”一起改。</td></tr></tbody>\n  </table>\n  <p class=\"table-note\">上表不是“实现没达标”的清单，而是 Lynx 在评审里逐条拍过口径的变更：有的改了 AC（D5），有的把判定推给模型（2026-10-14 定），有的记进 deferred-work，有的由后续 story 接走。</p>\n  \n  <div class=\"callout\">\n    <p><strong>徽章口径：</strong>没有徽章 = Story 2.1 的交付；<span class=\"badge b-now\">2.2</span> 流式、<span class=\"badge b-now\">2.5</span> sessions/messages、<span class=\"badge b-now\">2.6</span> 检索工具化、<span class=\"badge b-now\">DI</span> 2026-10-20 的 tsyringe/每请求现查改造、<span class=\"badge b-now\">现状</span> 更晚的搬家或改名；<span class=\"badge b-33\">3.3</span> 是本轮未提交的 retrieve stage trace，<span class=\"badge b-32\">3.2</span> 是 chat 的 trace 接线。</p>\n    <p>代码全部来自当前工作区；2.1 当时那版已经被后续补丁覆盖的地方，会明确写“这里今天不是 2.1 的代码”。</p>\n  </div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 05</span>\n    <h2>一眼看懂：两路检索与 RRF 融合</h2>\n    <p class=\"section-sub\">向量与 BM25 并行；融合只按名次，不按分数。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>2</strong>条检索路</span><span class=\"chip\"><strong>1</strong>次 RRF</span><span class=\"chip\"><strong>topK</strong>融合后截断</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic2-story1-hybrid-retrieval.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 2.1 两路检索与 RRF 融合\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:1250 / 496;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic2-story1-hybrid-retrieval.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>查询先变成向量；向量走 HNSW，BM25 走 pg_search。</li><li>两路候选各自 topK，RRF 去重并按名次融合，最后才截 topK。</li><li>维度每请求现查；阈值只兜字符噪声，拒答判据交给生成侧。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画 /chat 与 /retrieve 的分工；见下面的代码与 2.6。</div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"global-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">02 · MAP</span>\n    <h2>全局地图：一次提问穿过哪几层</h2>\n    <p class=\"section-sub\">从上到下读：路由只做 HTTP，工厂负责把策略名兑换成实例，stage 真正干活，SQL 住在基础层。</p>\n  </header>\n  <div class=\"layer-map\">\n    <article class=\"layer layer-31\">\n      <div class=\"layer-tag\">L1 · HTTP</div>\n      <h3>路由</h3>\n      <p>校验 body、决定 limit、映射错误码。<code>/retrieve</code> 只回原始融合结果；<code>/chat</code> 今天已经是 SSE，带 2.2/2.5/2.6 徽章。</p>\n      <code>src/routes/retrieve.ts</code>\n    </article>\n    <article class=\"layer layer-31\">\n      <div class=\"layer-tag\">L2 · ASSEMBLY</div>\n      <h3>工厂 + 注册表</h3>\n      <p>工厂把 Recipe 里的策略名兑换成向量路、词法路、融合器。今天由 <code>RetrieverHandle</code> 在启动时装配一次；2.1 当时是路由每请求装一次。</p>\n      <code>src/retrieve/retrievers.ts</code>\n    </article>\n    <article class=\"layer layer-31\">\n      <div class=\"layer-tag\">L3 · STAGES</div>\n      <h3>检索流水线</h3>\n      <p>空问句 → 维度检查 → embed → 向量召回 → BM25 召回 → RRF 融合。每个 stage 外面包了 <code>runStage</code>（3.3 补丁）。</p>\n      <code>src/retrieve/{search,fusion}</code>\n    </article>\n    <article class=\"layer layer-31\">\n      <div class=\"layer-tag\">L4 · DATA</div>\n      <h3>SQL 与表</h3>\n      <p>两条候选查询都在 <code>adapter/repo/</code>：向量走 partial HNSW，词法走 ParadeDB <code>match_disjunction</code>；软删谓词只加在 resources 上。</p>\n      <code>src/adapter/repo/search-*.ts</code>\n    </article>\n  </div>\n  <table class=\"file-table\">\n    <thead><tr><th>环节</th><th>2.1 当时</th><th>今天（带徽章）</th></tr></thead>\n    <tbody>\n      <tr><td>装配</td><td>路由每请求 <code>factory.assemble(recipe)</code></td><td><span class=\"badge b-now\">DI</span> <code>RetrieverHandle</code> 单例持有同一只 Retriever</td></tr>\n      <tr><td>embed</td><td>注册表兑换 <code>QwenEmbedder</code></td><td><span class=\"badge b-now\">DI</span> <code>EmbeddingHandle</code> + AI SDK <code>embedMany</code></td></tr>\n      <tr><td>维度</td><td>启动体检三态数组 / 空数组 / null；null → 409 <code>E_DIMENSION_UNKNOWN</code></td><td><span class=\"badge b-now\">DI</span> 每请求 <code>dimensionsInStore()</code>；不再有 unknown 态，库不可达 → 500</td></tr>\n      <tr><td>/chat</td><td>JSON 返回 <code>{answer, hits, counts}</code>，三条确定性提示</td><td><span class=\"badge b-now\">2.2</span> SSE 流；<span class=\"badge b-now\">2.5</span> 读/写会话；<span class=\"badge b-now\">2.6</span> 模型调检索工具</td></tr>\n      <tr><td>trace</td><td>无</td><td><span class=\"badge b-33\">3.3</span> 每个 stage 经 <code>StageSink</code> 落 <code>trace_stages</code></td></tr>\n      <tr><td>SQL 位置</td><td>直接在 <code>retrieve/search/*.ts</code> 里拿 pool 查</td><td><span class=\"badge b-now\">现状</span> 搬到 <code>adapter/repo/search-*.ts</code>，经 Repo 端口</td></tr>\n    </tbody>\n  </table>\n  <p class=\"table-note\">这张表就是本页的“边界尺”：读到一个带徽章的行为，先问它是不是 2.1 的；不要把今天的 /chat 当成 2.1 的交付。</p>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">03 · GLOSSARY</span>\n    <h2>小白词典：七个词够用</h2>\n    <p class=\"section-sub\">先有直觉，再看代码；每个词都对应本页真实出现的一个位置。</p>\n  </header>\n  <div class=\"glossary\">\n    <dl class=\"gloss\"><dt>HNSW</dt><dd>一种近似最近邻索引，把向量组织成多层图，查询时走少数几条边就能靠近 topK。它换速度，接受“几乎总是对的”而不是“数学上一定全局最优”。</dd></dl>\n    <dl class=\"gloss\"><dt>BM25</dt><dd>经典词法打分：词出现得越多、越稀有，分越高。ParadeDB 把它做进 Postgres，用 <code>@@@</code> 操作符查询 <code>chunks_bm25</code> 索引。</dd></dl>\n    <dl class=\"gloss\"><dt>RRF</dt><dd>Reciprocal Rank Fusion：不看原始分数，只看两路名次。每个名次的贡献是 <code>1/(k+rank)</code>，同一个 chunk 两路都命中就把两份贡献相加。</dd></dl>\n    <dl class=\"gloss\"><dt>topK</dt><dd>每一路先取多少条候选。2.1 默认向量 10 条、词法 10 条；融合后再按 <code>limit</code> 截成送给上层的条数，默认 6。</dd></dl>\n    <dl class=\"gloss\"><dt>余弦距离 / 相似度</dt><dd>pg 的 <code>&lt;=&gt;</code> 返回距离（0~2），相似度 = 1 − 距离。代码在 TS 侧换算，不把阈值写进 SQL 的 <code>WHERE</code>，否则会挡掉 HNSW 的 top-k 通道。</dd></dl>\n    <dl class=\"gloss\"><dt>halfvec 与 partial index</dt><dd><code>halfvec(1024)</code> 是半精度向量类型；partial index 是只索引满足条件行的索引。排序表达式必须与索引定义逐字同形，且保留 <code>WHERE e.dimension = N</code>，否则退化成全表扫描。</dd></dl>\n    <dl class=\"gloss\"><dt>StageSink</dt><dd>3.3 的观测落点：每个 stage 的输入/输出/耗时交给 sink。没有 sink 时走 no-op；<code>/retrieve</code> 传 DB sink，chat 里的工具传 Langfuse sink。</dd></dl>\n  </div>\n</section>"
    },
    {
      "type": "journey",
      "id": "request-journey",
      "kicker": "04 · WALK",
      "title": "请求旅行：/retrieve 到 hits",
      "subtitle": "点一步跳到真实代码行。编号与代码块里的 note 对应；第 3 步是今天与 2.1 差别最大的地方。",
      "steps": [
        {
          "goto": "retrieve-route:37-43",
          "title": "校验 body，决定 limit",
          "note": "缺 query 或类型不对 400；limit 不是正整数就忽略，回落默认值",
          "code": "route L37–43"
        },
        {
          "goto": "retriever-core:55-58",
          "title": "trim 后为空就拒绝",
          "note": "路由只判了“是不是字符串”，检索层再判“是不是空白”",
          "code": "factory L55–58"
        },
        {
          "goto": "retriever-core:60-76",
          "title": "先查维度，再 embed",
          "note": "今天是每请求现查；2.1 当时读启动体检的三态结果",
          "code": "factory L60–76"
        },
        {
          "goto": "retriever-core:78-96",
          "title": "把问句变成 1024 维向量",
          "note": "AI SDK embedMany，截维 1024；和入库必须同模型同维度",
          "code": "factory L78–96"
        },
        {
          "goto": "retriever-core:98-111",
          "title": "向量路取 topK",
          "note": "HNSW 先取候选，适配器再按 minSimilarity 过滤",
          "code": "factory L98–111"
        },
        {
          "goto": "retriever-core:113-123",
          "title": "词法路取 topK",
          "note": "BM25 与维度无关；score > 0 才算命中",
          "code": "factory L113–123"
        },
        {
          "goto": "retriever-core:125-139",
          "title": "RRF 合并两路名次",
          "note": "同一个 chunk 两路都命中就加分；最后按 limit 截",
          "code": "factory L125–139"
        },
        {
          "goto": "retrieve-route:48-65",
          "title": "映射成 200 响应",
          "note": "hits + vectorCount + lexicalCount；0 命中也是 200",
          "code": "route L48–65"
        }
      ],
      "hint": "读完后回到代码块，从 retrieve-route 与 retriever-core 两块开始逐段看。"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">05 · FILES</span>\n    <h2>文件地图：这一格的文件都住哪</h2>\n    <p class=\"section-sub\">按“读的顺序”排，不按字母。前四块是 2.1 的核心，后几块是后来的补丁现场。</p>\n  </header>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>职责</th><th>归属</th></tr></thead>\n    <tbody>\n      <tr><td><code>src/retrieve/recipes.ts</code></td><td>策略名 → 构造函数的三张表；全层唯一允许 <code>new</code> 检索 stage 的地方</td><td>2.1</td></tr>\n      <tr><td><code>src/retrieve/contracts.ts</code></td><td>Recipe / Deps / stage 接口 / Retriever 契约</td><td>2.1（DI 后字段有变）</td></tr>\n      <tr><td><code>src/retrieve/retrievers.ts</code></td><td>工厂、search 流水线、空问句与维度判定</td><td>2.1（DI/3.3 补丁）</td></tr>\n      <tr><td><code>src/retrieve/fusion/rrf.ts</code></td><td>RRF 去重、加分、排序、截断</td><td>2.1</td></tr>\n      <tr><td><code>src/retrieve/search/paradedb-vector.ts</code></td><td>向量路的薄适配器：调 repo、按相似度过滤、补 score 占位</td><td>2.1（SQL 已搬家）</td></tr>\n      <tr><td><code>src/retrieve/search/paradedb-bm25.ts</code></td><td>词法路的薄适配器：调 repo、只认 score &gt; 0</td><td>2.1（SQL 已搬家）</td></tr>\n      <tr><td><code>src/adapter/repo/search-vector.ts</code></td><td>向量候选 SQL 与 <code>dimensionsInStore()</code></td><td>2.1 逻辑，2026-10-15 搬入基础层</td></tr>\n      <tr><td><code>src/adapter/repo/search-lexical.ts</code></td><td>BM25 候选 SQL（<code>match_disjunction</code>）</td><td>2.1 逻辑，2026-10-15 搬入基础层</td></tr>\n      <tr><td><code>src/routes/retrieve.ts</code></td><td>POST /retrieve 的 body、limit、响应映射、错误码</td><td>2.1（3.3 加 sink）</td></tr>\n      <tr><td><code>src/routes/chat.ts</code></td><td>POST /chat 今天的样子：SSE + sessionId</td><td><span class=\"badge b-now\">2.2</span> <span class=\"badge b-now\">2.5</span> <span class=\"badge b-now\">2.6</span></td></tr>\n      <tr><td><code>src/agent/chat/chat.ts</code></td><td>今天的 ChatService：读历史、落 user、streamText + tools</td><td><span class=\"badge b-now\">2.2</span> <span class=\"badge b-now\">2.5</span> <span class=\"badge b-now\">2.6</span></td></tr>\n      <tr><td><code>src/config.ts</code></td><td>五个 <code>RETRIEVAL_*</code> 旋钮与默认值</td><td>2.1 评审补丁</td></tr>\n      <tr><td><code>src/adapter/contract.ts</code></td><td><code>RetrieverHandle</code>：今天唯一的 assemble 调用者</td><td><span class=\"badge b-now\">DI</span></td></tr>\n      <tr><td><code>src/trace/systemtrace/stage.ts</code></td><td><code>runStage</code>：计时、成功/失败记录、失败原样抛</td><td><span class=\"badge b-33\">3.3</span></td></tr>\n    </tbody>\n  </table>\n  <p class=\"table-note\">注意：<code>retrieve/search/*.ts</code> 今天只剩“薄适配器”，真正 SQL 在 <code>adapter/repo/</code>。页面里两段都看，才不会被路径误导。</p>\n</section>"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "06 · CODE",
        "title": "代码逐段：真实文件，按阅读顺序",
        "subtitle": "每块代码都来自当前工作区的真实文件；右侧 note 是可点的，行号与左侧一一对应。带徽章的段不是 2.1 的交付。",
        "body": "<div class=\"callout\"><p><strong>先读法：</strong>先看 recipes 与 contracts 认识“装配规格”，再看 retrievers 的主流水线，接着看 RRF 与两条 SQL；最后三块是今天 /chat、DI、3.3 的补丁现场。不要把带徽章的代码记到 2.1 头上。</p></div>",
        "blocks": [
          {
            "id": "retrieve-recipes",
            "file": "src/retrieve/recipes.ts",
            "lang": "ts",
            "ranges": [
              [
                18,
                48
              ]
            ],
            "title": "recipes.ts · 策略名 → 构造函数",
            "intro": "这张表决定“Recipe 里写 paradedb-vector 时，谁来干活”。它是纯目录，不带任何来源分支。",
            "notes": [
              {
                "lines": "18-22",
                "title": "策略名清单只写一次",
                "body": "三个名字集中在 <code>RETRIEVER_RECIPE_NAMES</code>。今天 <code>RetrieverHandle</code> 展开它装 Recipe；2.1 当时是两条路由各自展开。名字不在第二处重复写死，改策略名不用改路由。"
              },
              {
                "lines": "24-34",
                "title": "三张表，各管一段",
                "body": "向量表只注册 <code>paradedb-vector</code>，词法表只注册 <code>paradedb-bm25</code>，融合表只注册 <code>rrf</code>。注意今天没有 embedder 表：<span class=\"badge b-now\">DI</span> 之后 embed 是装配层选定的 <code>EmbeddingHandle</code>，不再由检索注册表兑换。",
                "badge": "DI"
              },
              {
                "lines": "35-40",
                "title": "统一出口",
                "body": "注册表只交三个查找函数，不把内部表暴露出去。工厂只认这三个口，因此换实现只需改这里。"
              },
              {
                "lines": "42-48",
                "title": "Object.hasOwn 是防线",
                "body": "只认自有键，原型链上的名字（如 <code>toString</code>）不会被当成策略；查无返回 <code>undefined</code>，再由工厂的 <code>need()</code> 抛 <code>E_UNKNOWN_STAGE</code>。"
              }
            ]
          },
          {
            "id": "retrieve-contracts",
            "file": "src/retrieve/contracts.ts",
            "lang": "ts",
            "ranges": [
              [
                24,
                73
              ]
            ],
            "title": "contracts.ts · 装配规格与可执行契约",
            "intro": "类型就是这一层的说明书：什么是 Recipe、谁是协作者、什么算一次检索结果。",
            "notes": [
              {
                "lines": "24-28",
                "title": "三个协作者",
                "body": "<code>RetrieverDeps</code> 今天吃 <code>repo + embedding + config</code>。<span class=\"badge b-now\">DI</span> 之前是 <code>pool + config + vectorDimensions</code>；字段变化对应“绕过 Repo 直查库”和“启动体检缓存”两笔旧账。",
                "badge": "DI"
              },
              {
                "lines": "30-35",
                "title": "Recipe 只是装配规格",
                "body": "策略名 + 活依赖 + 旋钮，不含业务数据。问句与 limit 只在 <code>search()</code> 时才进来，所以同一只 Retriever 可以被多个请求复用。"
              },
              {
                "lines": "37-53",
                "title": "四种角色接口",
                "body": "向量路、词法路、融合器、注册表各一个接口。<code>Fuser.fuse</code> 同时吃两路列表；注册表按名字返回实例或 <code>undefined</code>。"
              },
              {
                "lines": "55-57",
                "title": "score 是融合后的名次分",
                "body": "<code>RetrievedChunk extends ChunkCandidate</code>，只多一个 <code>score</code>。<span class=\"badge b-now\">现状</span> 基础层只交候选、不造名次分；两个薄适配器补 <code>score: 0</code> 占位，真正分数由 RRF 覆盖。",
                "badge": "现状"
              },
              {
                "lines": "59-63",
                "title": "count 是阈值过滤后的条数",
                "body": "契约注释写得很硬：判断“未找到”用 <code>vectorCount</code> / <code>lexicalCount</code>，不要用 <code>hits.length</code>。hits 已经被 <code>limit</code> 截过，看不出原来两路各有多少。"
              },
              {
                "lines": "65-72",
                "title": "SearchOptions 多了 sink",
                "body": "2.1 只有 <code>limit</code>；<span class=\"badge b-33\">3.3</span> 加了可选的 <code>sink</code>，让每个 stage 能把 trace 交给调用方选的落点。",
                "badge": "3.3"
              }
            ]
          },
          {
            "id": "retriever-core",
            "file": "src/retrieve/retrievers.ts",
            "lang": "ts",
            "ranges": [
              [
                39,
                144
              ],
              [
                150,
                153
              ]
            ],
            "title": "retrievers.ts · 工厂与 search 流水线",
            "intro": "这是整页最载重的一块：装配、维度闸门、embed、两路召回、融合都在这里。外面的 runStage 是 3.3 补丁。",
            "notes": [
              {
                "lines": "39-45",
                "title": "工厂是单例",
                "body": "<span class=\"badge b-now\">DI</span> 之后 <code>RetrieverFactory</code> 是 tsyringe 单例，注册表在构造里建一次。2.1 当时工厂由 bootstrap 手工 new，路由每请求 <code>assemble</code> 一次。",
                "badge": "DI"
              },
              {
                "lines": "47-54",
                "title": "assemble 把名字兑换成实例",
                "body": "向量路和融合器是必需的，词法路可选：不填 <code>lexicalSearch</code> 就单走向量，<code>lexicalCount</code> 恒 0。今天两条路由都填 <code>paradedb-bm25</code>。"
              },
              {
                "lines": "55-58",
                "title": "空提问在检索层再拦一次",
                "body": "路由只验“query 是字符串”，不验空白；这里 <code>trim()</code> 后为空就抛 <code>E_EMPTY_QUERY</code>。端口不假设调用方已经判过。"
              },
              {
                "lines": "60-76",
                "title": "维度检查：今天每请求现查",
                "body": "先 <code>repo.dimensionsInStore()</code>，再把不等于 <code>embeddingDimensions</code> 的维度挑出来；有异维就抛 <code>E_DIMENSION_MISMATCH</code>，发生在 embed 之前。<span class=\"badge b-now\">DI</span> 之前这里读启动体检的三态 <code>vectorDimensions</code>，<code>null</code> 会抛 <code>E_DIMENSION_UNKNOWN</code>；现在 unknown 态随 DI 退役。",
                "badge": "DI"
              },
              {
                "lines": "78-96",
                "title": "embedMany 替换 QwenEmbedder",
                "body": "<span class=\"badge b-now\">DI</span> 之后走 AI SDK <code>embedMany</code>，<code>dimensions</code> 来自 <code>EmbeddingHandle</code>；sink 关 telemetry 时显式 <code>telemetry: { isEnabled: false }</code>。首元素缺失被当作端口违约，不是业务状态。",
                "badge": "DI"
              },
              {
                "lines": "98-111",
                "title": "向量路 topK",
                "body": "逻辑是 2.1 的：<code>vector.search(queryVector, retrievalVectorTopK)</code>，相似度阈值在适配器里过滤。外面这层 <code>runStage</code> 与输入/输出摘要是 <span class=\"badge b-33\">3.3</span> 加的，记录里只放 hash/维度，不放完整向量。",
                "badge": "3.3"
              },
              {
                "lines": "113-123",
                "title": "词法路 topK",
                "body": "有词法装配位才跑 <code>lexical.search(trimmed, retrievalLexicalTopK)</code>，否则空数组。stage 包装同样来自 3.3；BM25 与向量维度无关。",
                "badge": "3.3"
              },
              {
                "lines": "125-139",
                "title": "融合并交回计数",
                "body": "把两路列表交给 <code>fuser.fuse</code>，<code>Options.limit</code> 原样传下去；输出摘要只记 chunk id 与 rrf 分。真正排序在 rrf.ts。",
                "badge": "3.3"
              },
              {
                "lines": "141-143",
                "title": "交出可执行对象",
                "body": "工厂返回 <code>{ search }</code>；调用方拿到的就是一只数据无关的 Retriever，问句在每次 search 时才进来。"
              },
              {
                "lines": "150-153",
                "title": "need 与 E_UNKNOWN_STAGE",
                "body": "<code>need()</code> 把“策略名查无”变成 <code>E_UNKNOWN_STAGE</code>。今天 Recipe 在启动时装配，所以这个错误只可能在启动期发生；2.1 当时路由每请求装配，它会映射成 400。"
              }
            ]
          },
          {
            "id": "retrieve-rrf",
            "file": "src/retrieve/fusion/rrf.ts",
            "lang": "ts",
            "ranges": [
              [
                21,
                44
              ]
            ],
            "title": "rrf.ts · 只认名次，不认分数",
            "intro": "为什么不用分数加权？因为 cosine 与 BM25 的分布不可比。RRF 用一个极简公式把两路名次折成同一个量。",
            "notes": [
              {
                "lines": "21-25",
                "title": "用 Map 按 chunk id 去重",
                "body": "融合的键是 chunk id，不是“第几条”。同一个 chunk 被两路都命中时，Map 里只留一份，后面把两份贡献相加。"
              },
              {
                "lines": "27-33",
                "title": "contribution = 1/(k+rank)",
                "body": "每一路按数组顺序当下标，<code>index + 1</code> 就是名次；<code>k</code> 默认 60。双路都是 rank1 时就是 <code>1/61 + 1/61 = 0.03279</code>，与 2.1 实测分毫不差。"
              },
              {
                "lines": "34-39",
                "title": "两路的附加字段互补",
                "body": "同一个 chunk 先由向量路创建时只有 <code>similarity</code>，词法路再来时用 <code>??=</code> 补 <code>lexicalScore</code>，不互相覆盖。两路都没有的字段保持 null。"
              },
              {
                "lines": "41-44",
                "title": "排序、截断、计数",
                "body": "按累加后的 <code>score</code> 降序，<code>Limit ?? defaultLimit</code> 截断；<code>vectorCount</code> / <code>lexicalCount</code> 取的是截断前两路长度。这里没有归一化，分数仍是原始 RRF 值。"
              }
            ]
          },
          {
            "id": "retrieve-vector-stage",
            "file": "src/retrieve/search/paradedb-vector.ts",
            "lang": "ts",
            "ranges": [
              [
                13,
                34
              ]
            ],
            "title": "paradedb-vector.ts · 向量路的薄适配器",
            "intro": "SQL 不在这里，但“阈值过滤”和“score 占位”留在这里，因为它们是检索层的旋钮与语义。",
            "notes": [
              {
                "lines": "18-26",
                "title": "构造期只校验正整数",
                "body": "<code>embeddingDimensions</code> 必须是正整数，否则装配期就炸。真正拼进 SQL 字面量前的整数防线在 repo；查询向量长度与维度的一致性也在那里判。"
              },
              {
                "lines": "28-33",
                "title": "候选 → 过滤 → 补位",
                "body": "先调 <code>repo.vectorCandidates</code>，再过滤 <code>similarity !== null &amp;&amp; similarity &gt;= minSimilarity</code>，最后补 <code>score: 0</code>。阈值只在 TS 侧过滤，不写进 SQL 的 <code>WHERE</code>。"
              }
            ]
          },
          {
            "id": "retrieve-vector-sql",
            "file": "src/adapter/repo/search-vector.ts",
            "lang": "ts",
            "ranges": [
              [
                20,
                58
              ]
            ],
            "title": "search-vector.ts · 向量候选 SQL",
            "intro": "2.1 的逻辑，2026-10-15 基础层迁移后搬到这里。三条硬约束都写在文件头：距离换算、索引同形、halfvec 字面量。",
            "notes": [
              {
                "lines": "26-31",
                "title": "两道前置校验",
                "body": "<code>Dim</code> 必须是正整数；查询向量长度必须等于 <code>Dim</code>。前者是 halfvec 字面量唯一的注入防线（N 只能拼文本，不能绑定参数），后者防“拿 512 维问 1024 维库”。"
              },
              {
                "lines": "33-38",
                "title": "SELECT 里先换算相似度",
                "body": "<code>1 - (embedding::halfvec(N) &lt;=&gt; $1::halfvec(N))</code> 把 pg 的余弦距离变成相似度；JOIN chunks 与 resources，软删谓词只加 <code>r.deleted_at IS NULL</code>（chunks 物理删、embeddings 经 FK CASCADE 走）。"
              },
              {
                "lines": "39-43",
                "title": "WHERE / ORDER / LIMIT 三件套",
                "body": "<code>WHERE e.dimension = N</code> 必须留着，排序表达式必须与 partial HNSW 索引逐字同形；LIMIT 就是 topK。摘掉任一个，实测退 Seq Scan。"
              },
              {
                "lines": "45-52",
                "title": "交出 ChunkCandidate",
                "body": "SQL 行映射成候选：<code>similarity</code> 有值，<code>lexicalScore</code> 为 null。这里不造 <code>score</code>，名次分是融合层的事。"
              },
              {
                "lines": "55-58",
                "title": "dimensionsInStore",
                "body": "<span class=\"badge b-now\">DI</span> 之后检索每请求调它一次；2.1 当时 startServer 在 serve() 前调同一个 SQL，把结果填进三态 <code>vectorDimensions</code>。",
                "badge": "DI"
              }
            ]
          },
          {
            "id": "retrieve-bm25-stage",
            "file": "src/retrieve/search/paradedb-bm25.ts",
            "lang": "ts",
            "ranges": [
              [
                13,
                25
              ]
            ],
            "title": "paradedb-bm25.ts · 词法路的薄适配器",
            "intro": "词法路只负责“别漏”，不负责“够不够好”。命中定义就是 score 大于 0。",
            "notes": [
              {
                "lines": "19-24",
                "title": "score > 0 才算命中",
                "body": "先调 <code>repo.lexicalCandidates</code>，再过滤 <code>lexicalScore !== null &amp;&amp; lexicalScore &gt; 0</code>，最后补 <code>score: 0</code>。P1 不设 BM25 绝对值下限；挡噪音是生成侧的事。"
              }
            ]
          },
          {
            "id": "retrieve-bm25-sql",
            "file": "src/adapter/repo/search-lexical.ts",
            "lang": "ts",
            "ranges": [
              [
                19,
                43
              ]
            ],
            "title": "search-lexical.ts · BM25 候选 SQL",
            "intro": "这段 SQL 的选择是 2.1 踩出来的：裸问句交给 @@@ 会抛错或静默漏检，必须用 match_disjunction。",
            "notes": [
              {
                "lines": "24-29",
                "title": "match_disjunction 而不是裸 @@@",
                "body": "把问句交给索引同一个分词器，token 取 OR，不解析查询语法。实测 <code>it's a test</code> / <code>a:b</code> / <code>AND</code> 裸交 <code>@@@</code> 会抛 “could not parse query string”；<code>设置入口：右上角</code> 会静默 0 命中，而正文里就有这句。"
              },
              {
                "lines": "30-33",
                "title": "score + 软删 + limit",
                "body": "<code>paradedb.score(c.id)</code> 给 BM25 分，按分降序取 topK；软删谓词与向量路同口径。<code>'content'</code> 必须与索引的 text_fields 键一致。"
              },
              {
                "lines": "35-42",
                "title": "相似度留 null",
                "body": "词法候选没有 cosine，<code>similarity</code> 填 null，<code>lexicalScore</code> 填真值；融合时两路的附加字段互补。"
              }
            ]
          },
          {
            "id": "retrieve-route",
            "file": "src/routes/retrieve.ts",
            "lang": "ts",
            "ranges": [
              [
                23,
                82
              ]
            ],
            "title": "routes/retrieve.ts · HTTP 只做三件事",
            "intro": "校验 body、决定 limit、映射错误码。它不拼 Recipe，也不做库状态判定。",
            "notes": [
              {
                "lines": "23-33",
                "title": "路由只拿句柄",
                "body": "<span class=\"badge b-now\">DI</span> 之后注入 <code>RetrieverHandle</code> 与 <code>Repo</code>；2.1 当时路由自己拿 pool/config/factory，每请求装 Recipe。",
                "badge": "DI"
              },
              {
                "lines": "37-43",
                "title": "body 与 limit 回落",
                "body": "缺 <code>query</code> 或类型不对 → 400 <code>E_BAD_BODY</code>；<code>limit</code> 必须是正整数，否则 <code>undefined</code>，一路传到 RRF 再回落 <code>retrievalDefaultLimit</code>（默认 6）。"
              },
              {
                "lines": "44-47",
                "title": "DB sink 是 3.3 加的",
                "body": "<code>createDbStageSink(this.repo)</code> 把 stage 写进本地 <code>trace_stages</code>；2.1 没有这层。sink 写入失败只记日志，不拖垮检索。",
                "badge": "3.3"
              },
              {
                "lines": "48-65",
                "title": "200 的响应形状",
                "body": "hits 逐字段映射（chunkId/resourceId/偏移/标题/来源/score/similarity/lexicalScore/content），外加两个 count。0 命中也是这个形状，只是 hits 为空。"
              },
              {
                "lines": "66-77",
                "title": "错误映射",
                "body": "<span class=\"badge b-now\">DI</span> 今天只映射两种：空问句 400、混维 409；其余一律 500。<code>E_DIMENSION_UNKNOWN</code> 与请求期的 <code>E_UNKNOWN_STAGE</code> 随 DI 退役；2.1 当时它们分别是 409 与 400。",
                "badge": "DI"
              }
            ]
          },
          {
            "id": "chat-route-today",
            "file": "src/routes/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                22,
                67
              ]
            ],
            "title": "routes/chat.ts · 今天的样子（不是 2.1 的交付）",
            "intro": "2.1 的 /chat 是 JSON + 三条确定性提示；今天已经是 SSE，body 要 sessionId，检索发生在工具里，当前代码已没有这三条硬编码文案（由 <code>INSTRUCTIONS</code> 让模型作答）。这块只用来认清历史边界。",
            "notes": [
              {
                "lines": "23-32",
                "title": "ChatService + Repo",
                "body": "路由注入 ChatService 与 Repo；2.1 当时注入的是 repo + pool + factory + getVectorDimensions。",
                "badge": "2.6"
              },
              {
                "lines": "37-48",
                "title": "body 变成 { query, sessionId }",
                "body": "缺字段/类型不对 400 E_BAD_BODY；空白 400 E_EMPTY_QUERY；sessionId 非 UUID 400 E_BAD_ID。2.1 当时只认 <code>{ query, limit? }</code>。",
                "badge": "2.5"
              },
              {
                "lines": "50-58",
                "title": "先确认会话，再进流",
                "body": "会话不存在/已软删 404 E_SESSION_NOT_FOUND；存在则 <code>chat.ask(query, sessionId, signal)</code> 返回 SSE。2.1 当时没有 session 概念。",
                "badge": "2.5"
              },
              {
                "lines": "65-67",
                "title": "UUID 只做形状校验",
                "body": "正则只保证“像 UUID”，不代表会话存在；存在性由 <code>repo.getSession</code> 判。",
                "badge": "2.5"
              }
            ]
          },
          {
            "id": "chat-service-today",
            "file": "src/agent/chat/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                57,
                87
              ]
            ],
            "title": "agent/chat/chat.ts · 今天的生成侧（2.5/2.6）",
            "intro": "2.1 的 agent/chat/chat.ts 只数资源、判零命中、返回固定话术；今天这段已经被会话、流式与工具调用覆盖。",
            "notes": [
              {
                "lines": "57-69",
                "title": "历史 + 先落 user 消息",
                "body": "<span class=\"badge b-now\">2.5</span> 服务端按 sessionId 读库历史，只回灌 text parts（最近 12 条），再把本轮 user 消息写库。2.1 不落库。",
                "badge": "2.5"
              },
              {
                "lines": "72-79",
                "title": "streamText + tools + 有界步数",
                "body": "<span class=\"badge b-now\">2.6</span> 检索被注册成 <code>retrieve</code> 工具，模型自己决定调不调、用什么词；<code>stopWhen: stepCountIs(5)</code> 是最多 5 步 / 4 次检索往返的上限。2.1 没有工具，也没有生成。",
                "badge": "2.6"
              },
              {
                "lines": "80-84",
                "title": "onError 只记日志",
                "body": "<span class=\"badge b-now\">3.2</span> 流内错误交给 <code>onError</code> 记 <code>E_CHAT_STREAM</code>，客户端只收固定文案；这是 Epic 3 的 chat trace 接线。",
                "badge": "3.2"
              },
              {
                "lines": "86-87",
                "title": "Result 交给流包装",
                "body": "<span class=\"badge b-now\">3.2</span> 2.2 引入 UI message stream；当前工作区（3.2 补丁）用 <code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code> 显式包装，并在 <code>onEnd</code> 里落 assistant 消息与 trace。2.1 没有这段。",
                "badge": "3.2"
              }
            ]
          },
          {
            "id": "retrieve-config",
            "file": "src/config.ts",
            "lang": "ts",
            "ranges": [
              [
                26,
                30
              ],
              [
                45,
                61
              ]
            ],
            "title": "config.ts · 五个检索旋钮",
            "intro": "评审把硬编码旋钮搬进 config；今天它们是 AppConfig 的只读字段。",
            "notes": [
              {
                "lines": "26-30",
                "title": "五个旋钮",
                "body": "<code>retrievalVectorTopK</code> / <code>retrievalLexicalTopK</code> / <code>retrievalMinSimilarity</code> / <code>retrievalRrfK</code> / <code>retrievalDefaultLimit</code>。2.1 评审时它们还硬编码在 bootstrap，后来才进 config。"
              },
              {
                "lines": "45-48",
                "title": "非 1024 只 warn 不阻断",
                "body": "P1 只建了 1024 档 partial HNSW；其它维度检索退顺序扫描，结果仍对、只是慢。这是 AD-4 接受的行为。"
              },
              {
                "lines": "57-61",
                "title": "默认值与小数解析",
                "body": "默认 10/10/0.42/60/6；<code>RETRIEVAL_MIN_SIMILARITY</code> 走 <code>floatOrThrow</code>，其余走整数校验。实测 <code>RETRIEVAL_DEFAULT_LIMIT=2</code> 生效、<code>=1.5</code> 启动期 <code>E_CONFIG_INVALID</code>。"
              }
            ]
          },
          {
            "id": "retriever-handle",
            "file": "src/adapter/contract.ts",
            "lang": "ts",
            "ranges": [
              [
                284,
                300
              ]
            ],
            "title": "adapter/contract.ts · RetrieverHandle（DI）",
            "intro": "今天唯一的 assemble 调用者。理解它，才知道为什么路由里看不到 Recipe 了。",
            "notes": [
              {
                "lines": "284-289",
                "title": "单例句柄",
                "body": "<span class=\"badge b-now\">DI</span> <code>@singleton()</code>，注入工厂、Repo、EmbeddingHandle、AppConfig；这四格都是进程级唯一。",
                "badge": "DI"
              },
              {
                "lines": "290-299",
                "title": "装配一次，长期持有",
                "body": "构造期用常量 <code>RETRIEVER_RECIPE_NAMES</code> + 三个依赖装出一只 Retriever 并持有。持有同一只是安全的：维度判定在 <code>search</code> 里每请求现查，不会被构造期凝固。",
                "badge": "DI"
              }
            ]
          },
          {
            "id": "stage-runner",
            "file": "src/trace/systemtrace/stage.ts",
            "lang": "ts",
            "ranges": [
              [
                45,
                78
              ]
            ],
            "title": "stage.ts · runStage（3.3 补丁）",
            "intro": "它不是 2.1 的代码；放在这里是为了解释代码里那些 runStage 包装。",
            "notes": [
              {
                "lines": "45-51",
                "title": "统一签名",
                "body": "<span class=\"badge b-33\">3.3</span> 收 Sink、stage 名、input、实际函数、output 摘要函数。runner 不关心落点；sink 由调用方选。",
                "badge": "3.3"
              },
              {
                "lines": "52-65",
                "title": "成功也记",
                "body": "成功时记 <code>status: ok</code>、耗时、input 与 output 摘要，然后把结果原样返回。摘要只放阶段专用元数据，不写 chunk 正文与完整向量。",
                "badge": "3.3"
              },
              {
                "lines": "66-77",
                "title": "失败先记再抛",
                "body": "失败时 output 固定为 <code>{ error_code, message }</code>，记完再把原错误抛出去；后续 stage 由调用方决定不再执行。sink 自己写失败只记 <code>E_TRACE_WRITE</code>，不拖垮业务。",
                "badge": "3.3"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">07 · DECISIONS</span>\n    <h2>取舍与踩坑：为什么长这样</h2>\n    <p class=\"section-sub\">从 2.1 的 code review 里挑了对理解影响最大的八条，外加七条会让人踩第二次的坑。</p>\n  </header>\n  <h3 class=\"block-title\">Review 拍板 / 补丁 / 记账：八条</h3>\n  <ul class=\"pitfall-list\">\n    <li><strong>D2 · 维度闸门不能 fail-open。</strong> 旧实现用空数组同时表达“库里没向量”和“体检没跑成”；后者会让向量路被 SQL 过滤成 0 条，而 BM25 照样命中，等于静默 BM25-only 作答——正是 AC 禁止的降级。拍板改成三态：数组 / 空数组 / null；null 抛 <code>E_DIMENSION_UNKNOWN</code>。<span class=\"badge b-now\">DI</span> 之后三态整体退役，改成每请求现查。</li>\n    <li><strong>D5 · 全软删不另设话术。</strong> 评审时库里 5 行全软删，<code>/chat</code> 回“尚未添加任何资源”，与从没添加过无法区分。Lynx 选“改 AC”：为空 = 未软删行为 0，含全部已删除，不设第三种话术。</li>\n    <li><strong>D6 · 命中响应体三处手抄。</strong> <code>/retrieve</code>、<code>/chat</code>、前端 api.ts 各有一份逐字段映射；2.1 不单独抽 mapper，等 2.2 的 <code>UIMessage</code> 地基自然消解。今天仍是债务，换成工具 output 后字段形状又变了一次。</li>\n    <li><strong>补丁 · 五个旋钮进 config。</strong> 原本 topK/阈值/RRF k/defaultLimit 全硬编码，AC 的“可 env 覆盖”没实现。修法是五个 <code>RETRIEVAL_*</code> 进 <code>config.ts</code>，小数走新增的 <code>floatOrThrow</code>。</li>\n    <li><strong>补丁 · /chat 的 limit 与 try 范围。</strong> 评审发现 <code>/chat</code> 收了 limit 却没用，且 <code>assemble</code> 在 try 之外，文档承诺的 400/409 走不到。修法是 limit 打通到 <code>retriever.search</code>，assemble 移进 try，与 /retrieve 同口径。</li>\n    <li><strong>补丁 · count 的语义写进契约。</strong> <code>vectorCount</code> / <code>lexicalCount</code> 是阈值过滤后的条数，不是召回条数；判“未找到”不能用 <code>hits.length</code>（已被 limit 截过）。这条如果不写，下一个人一定会读错。</li>\n    <li><strong>D1 · 分层欠账先记账。</strong> 检索 stage 拿裸 <code>pg.Pool</code> 直查、<code>recipes.ts</code> 跨盒 import <code>QwenEmbedder</code>、<code>ports/retriever.ts</code> 被删，三处都违背 AD-1/AD-2。2.1 代码不动，登记进 deferred；2026-10-15 基础层迁移把直查库收进 Repo，2026-10-20 DI 把 embed 换成 <code>EmbeddingHandle</code>，契约仍住 <code>retrieve/contracts.ts</code>。</li>\n    <li><strong>Defer · 检索没有 status='ready' 谓词。</strong> 两条 SQL 只过滤 <code>r.deleted_at IS NULL</code>，靠入库失败路径先删 chunks 兜住。这是跨层隐式不变量；修法是写进 SPINE，不是在本 story 偷加谓词。</li>\n  </ul>\n  <h3 class=\"block-title\" style=\"margin-top:30px\">踩坑清单：七个会重复踩的</h3>\n  <ul class=\"pitfall-list\">\n    <li><strong>把问句裸交给 @@@。</strong> 那是查询语法解析器，不是分词器：语法字符直接抛错，全角冒号会静默漏检。正解是 <code>paradedb.match_disjunction('content', q)</code>。</li>\n    <li><strong>把阈值写进 SQL 的 WHERE。</strong> <code>1 - dist &gt;= x</code> 会挡掉 HNSW 的 top-k 通道；阈值必须在 TS 侧过滤，SQL 只负责按距离排序取 topK。</li>\n    <li><strong>把 halfvec 的 N 当绑定参数。</strong> <code>::halfvec(N)</code> 的 N 是类型修饰符，只能拼进 SQL 文本；拼之前必须 <code>Number.isInteger</code> 校验，这是该处唯一的注入防线。</li>\n    <li><strong>以为分数能判断“库里有没有答案”。</strong> 实测 <code>WeKnora 怎么部署</code> 在库里已无该主题时仍拿 0.5502，高于含糊问句的 0.5023；垃圾串在多喂两篇文档后从 0.4061 涨到 0.4589，顶穿 0.42。阈值只兜字符噪声。</li>\n    <li><strong>把 0 命中当错误。</strong> 2.1 的口径是 200 + 空 hits + 两个 count；空库/全无 ready 也是 200 答案体。非 2xx 会让 2.2 的 <code>useChat</code> 走错误通道。</li>\n    <li><strong>把 RRF 分当相似度。</strong> 双路 rank1 只有 0.03279，不是 0.9；代码也没做归一化。展示时按原始名次分，不要拿它和 cosine 比大小。</li>\n    <li><strong>软删壳让“空库”看起来正常。</strong> resources 行还在、chunks 与 embeddings 已删；计数只看未软删行。并行会话里出现过 5 行软删壳，列表空但判定正常的情况，别误判成 bug。</li>\n  </ul>\n  <div class=\"callout strong\">\n    <p><strong>被否掉的方案：</strong>① 维度体检失败就退回 BM25-only（D2 否掉）；② 用绝对相似度阈值决定拒答（实测顶穿，改交模型）；③ 为“全部删除”加第三种话术（D5 否掉）；④ 把 RRF 分归一化后再展示（2.1 不做）；⑤ 在 SQL 里做相似度过滤（会挡 HNSW）。</p>\n  </div>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">08 · VERIFY</span>\n    <h2>验证命令：先看有没有真跑过</h2>\n    <p class=\"section-sub\">本轮没有启动服务、没有跑测试、没有开浏览器。A 组是 2026-10-14 的真跑记录；B/C 组是当前代码的可复制路径，明确标了“本轮未重跑”。</p>\n  </header>\n  <div class=\"callout strong\">\n    <p><strong>读法：</strong>A 组的输出可以直接当基线；B/C 组只证明“命令与代码路径存在”，不证明今天仍然得到同样数字。真实语料、维度、模型都会让数字漂移。</p>\n  </div>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>A1 · 混合检索（2.1 真跑）</h3>\n      <p>真库 + 真 Ollama，起服务后打 <code>/retrieve</code>。</p>\n      <pre class=\"snippet\">curl -s http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"Qoder 怎么安装\"}'</pre>\n      <p class=\"test-note\">当时结果：<code>vectorCount=10</code>、<code>lexicalCount=10</code>、双路 rank1 的 <code>score=0.03279</code>、<code>similarity=0.6317</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>A2 · 混维拒绝（2.1 真跑）</h3>\n      <p>库里是 1024 维，把服务起成 512 维。</p>\n      <pre class=\"snippet\">EMBEDDING_DIMENSIONS=512 npm start\ncurl -si http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"Qoder 怎么安装\"}' | head -1</pre>\n      <p class=\"test-note\">当时结果：<code>HTTP 409</code>，<code>E_DIMENSION_MISMATCH</code>，文案“库中存在 1024 维向量，与当前检索维度 512 不符，拒绝作答”。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>A3 · 空提问 400（2.1 真跑）</h3>\n      <p>空白提问在发 Ollama 之前就被拦下。</p>\n      <pre class=\"snippet\">curl -si http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"   \"}' | head -1\ncurl -si http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"limit\":3}' | head -1</pre>\n      <p class=\"test-note\">当时结果：两条都是 400；第一条 <code>E_EMPTY_QUERY</code>，第二条 <code>E_BAD_BODY</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>A4 · 空库 / 全软删（2.1 真跑）</h3>\n      <p>2.1 的 /chat 是 JSON，body 只有 query。</p>\n      <pre class=\"snippet\">curl -s http://127.0.0.1:3000/chat \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"Qoder 怎么安装\"}'</pre>\n      <p class=\"test-note\">库里 5 行全软删时实测 200：<code>{\"answer\":\"尚未添加任何资源\",\"hits\":[],\"vectorCount\":0,\"lexicalCount\":0}</code>。今天 /chat 已改成 SSE 且要 sessionId，这条命令不能直接复跑。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>A5 · limit 回落与 env 覆盖（2.1 真跑）</h3>\n      <p>限流旋钮走 config；非法小数在启动期就退出。</p>\n      <pre class=\"snippet\">RETRIEVAL_DEFAULT_LIMIT=2 npm start\ncurl -s http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"Qoder 怎么安装\",\"limit\":-3}'</pre>\n      <p class=\"test-note\">当时结果：<code>limit:1</code> → 1 条；<code>limit:-3</code> → 回落默认 2 条。另测 <code>RETRIEVAL_DEFAULT_LIMIT=1.5</code> 启动期 <code>E_CONFIG_INVALID</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>A6 · 静态与回归（2.1 真跑）</h3>\n      <p>2.1 收口时的两条基线。</p>\n      <pre class=\"snippet\">cd app/server\nnpx tsc --noEmit\nnpx vitest run</pre>\n      <p class=\"test-note\">当时结果：<code>tsc</code> EXIT=0；<code>vitest run</code> 8 passed。今天测试文件更多，数字不能照抄。</p>\n    </article>\n  </div>\n  <h3 class=\"block-title\" style=\"margin-top:30px\">B · 当前代码路径（本轮未重跑）</h3>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>B1 · 当前 /retrieve</h3>\n      <p>今天的路由经 DI 与 3.3 sink；先起服务，再用 jq 看条数与 top1。</p>\n      <pre class=\"snippet\">cd app/server\nnpm start\ncurl -s http://127.0.0.1:3000/retrieve \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"Qoder 怎么安装\"}' \\\n  | jq '{hits: (.hits | length), vectorCount, lexicalCount, top: .hits[0]}'</pre>\n      <p class=\"test-note\">预期：200，三个字段都在；<code>hits[0].score</code> 是 RRF 原始分，不是相似度。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>B2 · 当前 /chat（SSE，2.5/2.6）</h3>\n      <p>今天要先建会话，body 是 <code>{ query, sessionId }</code>，响应是流。</p>\n      <pre class=\"snippet\">SID=$(curl -s -X POST http://127.0.0.1:3000/sessions \\\n  -H 'content-type: application/json' \\\n  -d '{\"title\":\"story-2-1-walkthrough\"}' | jq -r '.id')\ncurl -sN http://127.0.0.1:3000/chat \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"query\\\":\\\"Qoder 怎么安装\\\",\\\"sessionId\\\":\\\"$SID\\\"}\"</pre>\n      <p class=\"test-note\">预期：SSE 帧；回答是否依据库取决于模型是否调用 <code>retrieve</code> 工具。这不是 2.1 的行为。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>B3 · 当前检索测试</h3>\n      <p>仓库里的链路测试会真连库与 Ollama。</p>\n      <pre class=\"snippet\">cd app/server\nnpx vitest run test/retrieve-chain.test.ts\nnpx vitest run test/di-retriever-flow.test.ts</pre>\n      <p class=\"test-note\">覆盖空/纯空白 400、坏 body 400、混维 409、limit 回落、真链路 200。本轮未执行。</p>\n    </article>\n  </div>\n  <h3 class=\"block-title\" style=\"margin-top:30px\">C · SQL 对账（只读；HNSW 那条是历史真跑）</h3>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>C1 · 维度与资源计数</h3>\n      <p>确认库里实际有哪些维度、未软删资源有多少。</p>\n      <pre class=\"snippet\">psql \"$DATABASE_URL\" -c \\\n  \"select dimension, count(*) from embeddings group by 1 order by 1;\"\npsql \"$DATABASE_URL\" -c \\\n  \"select status, count(*) from resources where deleted_at is null group by 1;\"</pre>\n      <p class=\"test-note\">维度不是单一 1024 时，<code>/retrieve</code> 会 409；资源计数为 0 时，2.1 的 /chat 会回“尚未添加任何资源”。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>C2 · 词法路直查</h3>\n      <p>验证 <code>match_disjunction</code> 与 <code>score</code>。</p>\n      <pre class=\"snippet\">psql \"$DATABASE_URL\" -c \\\n  \"select count(*) from chunks c \\\n     join resources r on r.id = c.resource_id and r.deleted_at is null \\\n    where c.content @@@ paradedb.match_disjunction('content', 'Qoder 怎么安装');\"</pre>\n      <p class=\"test-note\">预期大于 0；如果换成裸 <code>@@@ 'Qoder 怎么安装'</code>，语法字符可能直接报错。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>C3 · HNSW 索引形状（历史真跑）</h3>\n      <p>2.1 当时用 <code>SET enable_seqscan=off</code> 强制走索引，确认表达式同形。</p>\n      <pre class=\"snippet\">psql \"$DATABASE_URL\" -c \"SET enable_seqscan=off;\"\npsql \"$DATABASE_URL\" -c \\\n  \"explain (costs off) \\\n   select c.id from embeddings e \\\n     join chunks c on c.id = e.source_id \\\n     join resources r on r.id = c.resource_id and r.deleted_at is null \\\n    where e.dimension = 1024 \\\n    order by e.embedding::halfvec(1024) &lt;=&gt; '[0.1,0.2,...]'::halfvec(1024) \\\n    limit 10;\"</pre>\n      <p class=\"test-note\">当时结果：<code>Index Scan using embeddings_hnsw</code>；摘掉 <code>WHERE e.dimension = 1024</code> 后退 <code>Seq Scan</code>。向量字面量需按真实维度替换，这条本轮未重跑。</p>\n    </article>\n  </div>\n  <p class=\"table-note\">想快速自查“这句话有没有真跑过”：A 组有具体输出数值；B/C 组只有预期形状，且本轮没有启动服务。</p>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">09 · CONTINUITY</span>\n    <h2>衔接：上一格给了什么，下一格拿什么</h2>\n    <p class=\"section-sub\">2.1 站在 Epic 1 的入库结果上；它自己没做完的，被 2.2/2.5/2.6 与 DI/3.3 分走。</p>\n  </header>\n  <div class=\"choice-grid\">\n    <article class=\"choice\">\n      <div class=\"choice-no\">PREV · EPIC 1</div>\n      <h3>上一格交来的</h3>\n      <p>入库管线把资源写成 <code>ready</code>，chunks 与 embeddings 落库，软删路径把 chunks 物理删、向量经 FK CASCADE 带走。2.1 因此可以假设“检索只读已就绪内容”，并只加 <code>r.deleted_at IS NULL</code> 谓词。</p>\n    </article>\n    <article class=\"choice\">\n      <div class=\"choice-no\">NEXT · 2.2 / 2.5 / 2.6</div>\n      <h3>下一格接走的</h3>\n      <p>2.2 把 /chat 换成 <code>streamText</code> + UI message stream；2.5 落 sessions/messages 并把 body 改成 <code>{ query, sessionId }</code>；2.6 把 Retriever 包成 <code>retrieve</code> 工具，回答才真正依据命中。2.1 的固定话术在这条线上被模型提示词取代。</p>\n    </article>\n    <article class=\"choice\">\n      <div class=\"choice-no\">LATER · DI</div>\n      <h3>2026-10-20 的 DI</h3>\n      <p><code>bootstrap.ts</code> 整删，八个 <code>@singleton()</code> 类自我注册；<code>RetrieverHandle</code> 成为唯一 assemble 调用者；维度改成每请求现查，<code>E_DIMENSION_UNKNOWN</code> 退役；库不可达时 /retrieve 冒 500。</p>\n    </article>\n    <article class=\"choice\">\n      <div class=\"choice-no\">LATER · 3.3</div>\n      <h3>3.3 的 stage trace</h3>\n      <p><code>runStage</code> 把每个检索 stage 的输入/输出/耗时交给 sink；<code>/retrieve</code> 用 DB sink 写本地 <code>trace_stages</code>，chat 工具用 Langfuse sink。2.1 的检索结果不因这层改变，但读代码时会多一层包装。</p>\n    </article>\n  </div>\n  <div class=\"next-box\">\n    <p><strong>下一步读什么：</strong>想看 stage 的完整实现，去读 3.3 的走读页；想看工具化后的 /chat，去读 2.6 的走读页；想理解入库侧为什么“只读 ready”，去读 Epic 1 的入库页。</p>\n    <div class=\"next-links\">\n      <a href=\"epic3-story3-retrieve-stages.html\">3.3 retrieve stages</a>\n      <a href=\"epic3-story1-endpoint-trace.html\">3.1 endpoint trace</a>\n      <a href=\"epic3-story4-ingest-stages.html\">3.4 ingest stages</a>\n    </div>\n  </div>\n</section>\n<footer class=\"footer\">\n  <p>Story 2.1 走读页 · 代码取自 2026-10-24 当前工作区 · 静态校验：build.mjs + validate.mjs · 视觉检查归 Lynx 浏览器手测。</p>\n</footer>"
    }
  ]
}
