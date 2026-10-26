export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic1-story1-local-skeleton.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 1 · Story 1.1 本地骨架 · 带代码逐行讲解",
  "tocTitle": "Story 1.1",
  "tocSub": "本地骨架 + 基础设施 + 安全边界",
  "accent": "#0e7490",
  "accent2": "#155e75",
  "accentDark": "#67e8f9",
  "content": [
    {
      "type": "html",
      "html": "<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>EPIC 1 · STORY 1.1</span><span>2026-10-10 · done</span><span>as-built 2026-10-25</span></div>\n  <h1>本地骨架：<em>先把地基钉住</em></h1>\n  <p class=\"hero-sub\">这一格不抓网页、不做问答。它只回答一件事：这台机器上，后端、数据库、Ollama、前端能不能在 127.0.0.1 上安全地跑起来，并且缺东西时当场停下。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>5</strong> 张核心表</span>\n    <span class=\"chip\"><strong>/health</strong> 两个服务组</span>\n    <span class=\"chip\"><strong>缺 env</strong> 启动即退</span>\n    <span class=\"chip\"><strong>启动清扫</strong> processing</span>\n    <span class=\"chip\"><strong>13</strong> 个真实代码块</span>\n  </div>\n  <div class=\"trace-pill\"><b>读法</b><span>页面代码取自当前工作区；1.1 之后的补丁带 badge，不冒充本 story 的交付。</span></div>\n</header>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">CONCLUSION · 01</span>\n    <h2>一句话结论与 story 边界</h2>\n    <p class=\"section-sub\">先把“这格到底交付了什么”说死，再看代码。否则很容易把后来的检索、问答、trace 一起算到 1.1 头上。</p>\n  </header>\n\n  <div class=\"callout strong\"><strong>结论：</strong>Story 1.1 交付的是一条<strong>可启动、可探活、缺配置就当场停、启动时清掉上次尸体</strong>的本地地基；它不交付任何入库或问答能力。</div>\n\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01 · DELIVERED</span><h3>做成了什么</h3><p>Hono + Node 后端、Vite + React + TS 前端、只监听 127.0.0.1、/health、5 张表迁移、必需 env 的 fail-fast、ParadeDB/Ollama 可达性、启动清扫。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02 · NOT HERE</span><h3>没做成什么</h3><p>URL 入库是 1.2，粘贴文本是 1.3，查看/删除是 1.4；检索与问答是 Epic 2；trace 是 3.1 之后。前端只有骨架，没有产品界面。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03 · VERDICT</span><h3>验收实况</h3><p>retro 记录 4 条里 2 条真跑过；1 条只实现一半（<strong>“degraded 就拒绝入库/问答”没有实现</strong>，E-1 转 action item）；1 条只验了优雅退出，没验 kill -9。</p></article>\n  </div>\n\n  <h3>这格 owns / 不 owns</h3>\n  <table class=\"file-table\">\n    <thead><tr><th>范围</th><th>内容</th><th>证据</th></tr></thead>\n    <tbody>\n      <tr><td><strong>owns</strong></td><td>scaffold（Hono + Node、Vite + React + TS）、仅绑 <code>127.0.0.1</code>、健康检查、5 张表迁移、缺必需 Key 启动 fail-fast、ParadeDB/Ollama 可达性、密钥只在服务端、启动清扫 <code>processing</code>。</td><td>epics.md Story 1.1 AC；aca895c / b355ce6 / c854bc9；web a687c3f</td></tr>\n      <tr><td><strong>不 owns</strong></td><td>URL/Markdown 入库、资源列表与删除、检索、流式问答、引用、会话多轮、endpoint trace、Langfuse、前端产品界面。</td><td>分别属于 1.2 / 1.3 / 1.4 / Epic 2 / 3.1+</td></tr>\n      <tr><td><strong>只做一半</strong></td><td>AC 说 ParadeDB 或 Ollama 不可达时“健康检查返回 degraded/error，<strong>拒绝后续入库/问答</strong>”。代码只做到 503 + degraded；入库/问答路由不读 health，degraded 时照样受理。</td><td>retro E-1；action item <code>epic-1-retro-1-health-gate</code> 仍 open</td></tr>\n      <tr><td><strong>未端到端验证</strong></td><td>AC 最后一条“启动扫描 processing 并清残余 Chunk”。代码在，路径也对；但 retro 用优雅停止模拟，在途任务跑完了，<code>kill -9</code> 被安全策略拦下，没有真崩溃证据。</td><td>retro 第 37 行、验收表第 4 行；deferred-work 的“先清后听”条目</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\"><strong>AC 与 as-built 的差异（必须讲明）：</strong>AC 写的是 <code>ports/</code> 下存在 <code>Repository / Retriever / Embedder / ChatModel</code> 四个接口文件。它们在 1.1 提交 <code>aca895c</code> 里真的存在过；但后续检索改造 <code>dda283c</code> 删了 <code>ports/retriever.ts</code>，2026-10-16 的 <code>f5f705f</code> 又删了 <code>ports/repository.ts</code>、<code>embedder.ts</code>、<code>chat-model.ts</code>。<strong>今天没有 <code>ports/</code> 目录</strong>。可执行契约散在 <code>adapter/contract.ts</code>（Repo + 两个 handle）、<code>retrieve/contracts.ts</code>（Retriever）、<code>ingest/contracts.ts</code>（Ingest）、<code>agent/tool/contracts.ts</code>（工具 I/O）。本页按 as-built 讲，不假装四个文件还在。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 01</span>\n    <h2>一眼看懂：本地骨架与信任边界</h2>\n    <p class=\"section-sub\">先看谁连谁、谁在 loopback 里；再看下面的启动链路。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>5</strong>张表</span><span class=\"chip\"><strong>127.0.0.1</strong>只绑本机</span><span class=\"chip\"><strong>3</strong>类下游服务</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic1-story1-local-skeleton.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 1.1 本地骨架与信任边界\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:960 / 716;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic1-story1-local-skeleton.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>只有 Hono API 同时连 ParadeDB、Ollama 与外部 Chat provider；Web UI 不直连这些服务。</li><li>本地边界只包住 loopback 服务；Browser 与外部模型在边界外，Provider Key 只进服务端 env。</li><li>/health 探 DB 与 Ollama 的可达性，不证明 Key 有效；Key 缺失在启动期就退出。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画迁移文件与启动清扫；它们是启动链路的一部分，见下面的代码。</div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"global-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">MAP · 02</span>\n    <h2>全局地图：谁连谁</h2>\n    <p class=\"section-sub\">只画 1.1 需要的那几条线。浏览器永远不直接碰数据库，也不拿 Key；它只经过 Vite 的 /api 代理找后端。</p>\n  </header>\n  <div class=\"layer-map\">\n    <article class=\"layer\"><span class=\"layer-tag\">BROWSER · 5173</span><h3>Vite + React</h3><p>开发服务器只监听 <code>127.0.0.1:5173</code>。页面请求 <code>/api/health</code>，Vite 把前缀重写掉再转给后端。</p><code>app/web/vite.config.ts</code></article>\n    <article class=\"layer layer-31\"><span class=\"layer-tag\">SERVER · 3000</span><h3>Hono on Node</h3><p><code>@hono/node-server</code> 用 <code>hostname: '127.0.0.1'</code> 监听；<code>AppConfig</code> 先读 env，<code>/health</code> 再探 DB 与 Ollama。</p><code>app/server/src/index.ts</code></article>\n    <article class=\"layer\"><span class=\"layer-tag\">DATA · LOCAL</span><h3>ParadeDB + Ollama</h3><p>ParadeDB（Postgres + pgvector + pg_search）存表与索引；Ollama 提供本地嵌入模型。两者都由服务端连接，浏览器不可见。</p><code>DATABASE_URL · OLLAMA_BASE_URL</code></article>\n  </div>\n  <p class=\"map-note\">启动顺序是硬约束：<strong>先读 env → 建池 → 启动清扫 → 再 listen</strong>。清扫必须在接请求之前完成，否则新请求会和上次的僵尸行抢同一批资源。</p>\n  <div class=\"callout\"><strong>密钥边界：</strong>DeepSeek / 百炼的 Key 只出现在 <code>app/server/.env</code> 与 <code>adapter/provider/registry.ts</code>；<code>app/web</code> 源码里 grep 不到 Key。Vite 只认 <code>VITE_</code> 前缀的环境变量，本页涉及的 Key 都不带这个前缀；构建产物按这条规则不应出现 Key。</div>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">GLOSSARY · 03</span>\n    <h2>小白词典：先把词说人话</h2>\n    <p class=\"section-sub\">第一次出现的术语在这里给定义；后文不再重复解释。</p>\n  </header>\n  <div class=\"glossary\">\n    <dl class=\"gloss\"><dt>scaffold</dt><dd>脚手架：把项目的最小可运行骨架搭起来，不是装一个现成模板。这个项目是 Greenfield，手动搭 Hono + Vite。</dd></dl>\n    <dl class=\"gloss\"><dt>Hono</dt><dd>一个轻量 Web 框架，路由写法接近 <code>app.get('/path', handler)</code>；配 <code>@hono/node-server</code> 跑在 Node 上。</dd></dl>\n    <dl class=\"gloss\"><dt>Vite</dt><dd>前端开发服务器 + 构建工具。开发时它把源码即时编译给浏览器，还能把 <code>/api</code> 代理到后端。</dd></dl>\n    <dl class=\"gloss\"><dt>127.0.0.1 / bind</dt><dd>回环地址，只有本机能访问。服务“绑”在这个地址上，局域网里的其他机器就连不进来。</dd></dl>\n    <dl class=\"gloss\"><dt>middleware</dt><dd>中间件：请求进入路由前先经过的一层函数，可以读请求、写响应头、记日志，再决定要不要继续。</dd></dl>\n    <dl class=\"gloss\"><dt>DI / 容器</dt><dd>依赖注入：对象不在内部自己 <code>new</code> 依赖，而由容器按类型创建并塞进构造器。本项目的容器是 tsyringe。</dd></dl>\n    <dl class=\"gloss\"><dt>fail-fast</dt><dd>快速失败：配置不对就在启动时退出，不把坏状态拖到第一次请求才爆。</dd></dl>\n    <dl class=\"gloss\"><dt>connection pool</dt><dd>连接池：预先维护一组数据库连接，用时借、用完还，避免每次请求都重新握手。</dd></dl>\n    <dl class=\"gloss\"><dt>migration</dt><dd>迁移：把数据库结构变更写成按顺序执行的 SQL 文件；dbmate 负责记录哪些已经跑过。</dd></dl>\n    <dl class=\"gloss\"><dt>health probe</dt><dd>健康探针：真正去 ping 依赖，返回 ok/degraded；“进程还活着”不等于“依赖可用”。</dd></dl>\n    <dl class=\"gloss\"><dt>halfvec / HNSW</dt><dd>halfvec 是半精度向量，省内存；HNSW 是近似最近邻索引，让向量检索不必全表扫描。</dd></dl>\n    <dl class=\"gloss\"><dt>BM25 / ParadeDB</dt><dd>BM25 是关键词相关性打分；ParadeDB 在 Postgres 里提供 BM25（pg_search）与向量（pgvector）能力。</dd></dl>\n  </div>\n</section>"
    },
    {
      "type": "journey",
      "id": "journey",
      "kicker": "WALK · 04",
      "title": "一次启动的旅行",
      "subtitle": "点一步跳到对应代码。顺序就是进程真正走的顺序。",
      "hint": "每一步都指向下面真实文件的行号；代码块里的行号可以核对。",
      "steps": [
        {
          "goto": "config-env:32-44",
          "title": "读 env",
          "note": "缺必需项就打印结构化错误并 exit 1",
          "code": "config L32–44"
        },
        {
          "goto": "entry:28-45",
          "title": "装配容器与路由",
          "note": "resolve 实例、挂 /health 与其它路由",
          "code": "index L28–45"
        },
        {
          "goto": "db-pool:13-23",
          "title": "建连接池",
          "note": "懒连接；超时与 error 监听防止静默崩",
          "code": "pool L13–23"
        },
        {
          "goto": "health:44-57",
          "title": "探活 DB / Ollama",
          "note": "两个都绿才 200，否则 503 degraded",
          "code": "health L34–46"
        },
        {
          "goto": "boot-cleanup:169-197",
          "title": "清上次的僵尸行",
          "note": "processing → failed(入库中断)，chunks 连带删",
          "code": "resource L169–197"
        },
        {
          "goto": "core-sql:5-16",
          "title": "五张表就位",
          "note": "resources 是主表，其余四张围着它长",
          "code": "migration L5–16"
        },
        {
          "goto": "web-vite:47-57",
          "title": "浏览器经代理进来",
          "note": "/api 重写后转发到 127.0.0.1:3000",
          "code": "vite L47–57"
        }
      ]
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">FILES · 05</span>\n    <h2>文件地图：谁负责哪一格</h2>\n    <p class=\"section-sub\">左边是当前真实路径；中间写它在 1.1 的角色；右边标出后续改动，避免把后来的代码当成 1.1 的原样。</p>\n  </header>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>在 1.1 的角色</th><th>今天的状态</th></tr></thead>\n    <tbody>\n      <tr><td><code>src/index.ts</code></td><td>入口与装配：读配置、建池、挂 /health、清扫后 listen。</td><td>DI 容器 + 3.1 endpoint trace + 3.2 Langfuse；原 1.1 的 <code>bootstrapConfig</code> / 内联 health 已拆走。</td></tr>\n      <tr><td><code>src/config.ts</code></td><td>env 读取与 fail-fast；端口、host、维度。</td><td>DI 后变成 <code>@singleton() AppConfig</code>；2.1 加了检索旋钮与维度体检日志。</td></tr>\n      <tr><td><code>src/routes/health.ts</code></td><td>1.1 时不存在，/health 直接写在 index.ts。</td><td>1.2 拆成注册式探针，加缓存与 Ollama 模型探针；2026-10-25 收成 <code>postgres</code> / <code>ollama</code> 两个服务组，叶子改 <code>service.check</code>。语义仍是 1.1 的。</td></tr>\n      <tr><td><code>src/adapter/connection/pool.ts</code></td><td>1.1 叫 <code>adapters/paradedb.ts</code>；唯一 <code>new Pool</code> 位。</td><td>2026-10-16 重命名/搬家；1.1 review 的超时与 error 监听保留。</td></tr>\n      <tr><td><code>src/adapter/connection/ollama.ts</code></td><td>1.1 只有 <code>pingOllama</code>（/api/version）。</td><td>1.2 加了 /api/tags、/api/ps；字段仍按 Ollama 官方 snake_case。</td></tr>\n      <tr><td><code>src/adapter/repo/resource.ts</code></td><td>1.1 的清扫在 <code>pipeline/startup-cleanup.ts</code>。</td><td>搬家并改名 <code>markInterruptedAsFailed</code>；SQL 与事务语义没变。</td></tr>\n      <tr><td><code>db/migrations/20261010025740_create_extensions.sql</code></td><td>装 pgvector 与 pg_search 扩展。</td><td>未改。</td></tr>\n      <tr><td><code>db/migrations/20261010025742_create_core_tables.sql</code></td><td>建 5 张核心表与索引。</td><td>后续 4 个迁移把 <code>dim</code> → <code>dimension</code>、改 halfvec/HNSW、加 CHECK；不要只读第一份。</td></tr>\n      <tr><td><code>src/adapter/contract.ts</code></td><td>1.1 时对应 <code>ports/repository.ts</code> 等四个文件。</td><td>四文件已删；Repo + model handles 统一从这道门出。</td></tr>\n      <tr><td><code>app/web/vite.config.ts</code></td><td>Vite + React 骨架；127.0.0.1:5173，/api 代理。</td><td>server 段没变；插件与构建配置是后来的。原 <code>App.tsx</code> 已被路由化前端取代。</td></tr>\n    </tbody>\n  </table>\n</section>"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "CODE · 06",
        "title": "启动链路：env → 装配 → 清扫 → listen",
        "subtitle": "先读入口，再看配置与清扫。整个 1.1 的主线就在这三块里。",
        "body": "<div class=\"callout\">下面每个代码块都来自当前工作区。带 <span class=\"badge\">DI</span> 的行是 2026-10-20 的非 story 改造；带 <span class=\"badge b-31\">3.1</span> 的行是 Epic 3 的观测壳；带 <span class=\"badge b-now\">1.2</span> 的行是后续 story 的补丁；带 <span class=\"badge b-now\">2026-10-25</span> 的行是探针按服务分组（非 story）。</div>",
        "blocks": [
          {
            "id": "entry",
            "file": "src/index.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                6
              ],
              [
                8,
                59
              ]
            ],
            "notes": [
              {
                "lines": "8-25",
                "title": "import 里已经混进了后来的东西",
                "badge": "DI",
                "body": "<p>1.1 的入口只需要 Hono、config、pg 池、Ollama 探测这几件事。今天多出来的 tsyringe 容器、endpoint trace、Langfuse 都是后来加的。</p><p><code>setupLangfuse()</code> 是 3.2 的装配；<code>createEndpointTrace</code> 是 3.1 的全局壳。读 1.1 时把这两行当“后来的补丁”。</p>"
              },
              {
                "lines": "28-32",
                "title": "DI 容器：按类型取实例",
                "badge": "DI",
                "body": "<p><code>container.resolve(PostgresRepo)</code> 不是 new，而是让 tsyringe 按构造器里的 <code>@inject</code> 递归创建。类自己标 <code>@singleton()</code>，所以整个进程只有一份。</p><p>1.1 当时是手写 <code>loadConfig()</code> + <code>createDbPool()</code>。DI 三笔提交是 <code>589c404</code> / <code>e35c7c3</code> / <code>d5dee62</code>，不是 story 交付。</p>"
              },
              {
                "lines": "37-45",
                "title": "路由表：1.1 只有 /health",
                "badge": "3.1",
                "body": "<p>这几行是今天的完整路由表。<code>/traces</code> 是 3.1 的入口；<code>/resources</code>、<code>/retrieve</code>、<code>/chat</code> 属于 1.2 与 Epic 2。</p><p>1.1 真正拥有的是 <code>/health</code>：它现在由 <code>createHealthRoute(createHealthServices(config, repo))</code> 组装（2026-10-25 起按服务分组），语义没变。挂载方式从 <code>app.get</code> 换成了 <code>app.route</code>。</p>"
              },
              {
                "lines": "52-58",
                "title": "清扫必须先于 listen",
                "badge": "",
                "body": "<p><code>await cleanUpOnBoot(...)</code> 在 <code>serve()</code> 之前。先把上次进程留下的 <code>processing</code> 行清掉，再开始接新请求。</p><p><code>hostname</code> 是 <code>@hono/node-server</code> 的键。写成 <code>host</code> 会被静默忽略、退回 <code>0.0.0.0</code>，安全边界就漏了；1.1 review 实测确认过这一点。</p>"
              }
            ]
          },
          {
            "id": "config-env",
            "file": "src/config.ts",
            "lang": "ts",
            "ranges": [
              [
                17,
                55
              ]
            ],
            "notes": [
              {
                "lines": "17-19",
                "title": "AppConfig 是单例",
                "badge": "DI",
                "body": "<p><code>@singleton()</code> 保证构造器只跑一次。1.1 时它是一个普通函数 <code>loadConfig()</code>；DI 把 fail-fast 移进构造器，谁第一个解析它都一样。</p><p>代价写在文件头：构造器里直接 <code>process.exit(1)</code>，这条路径<strong>不可被 catch</strong>；要测只能开子进程看退出码。</p>"
              },
              {
                "lines": "32-44",
                "title": "必需 env：缺谁就点谁的名",
                "badge": "DI",
                "body": "<p>当前只认四个必需项：<code>DATABASE_URL</code>、<code>OLLAMA_BASE_URL</code>、<code>EMBEDDING_MODEL</code>、<code>CHAT_MODEL</code>。缺一个就把名字拼进同一条 <code>E_CONFIG_MISSING</code>，不等到首次请求才 401/500。</p><p><strong>与 1.1 的差异：</strong>1.1 当时还读 <code>CHAT_PROVIDER</code>，并按 provider 检查 <code>DEEPSEEK_API_KEY</code> / <code>DASHSCOPE_API_KEY</code>。DI 之后 Key 归 <code>adapter/provider/registry.ts</code> 登记表；当 <code>CHAT_MODEL</code> 指向那家 provider 时，缺 Key 的后果是该模型不在册，装配时 <code>ChatHandle</code> 报 <code>E_CHAT_MODEL</code>。效果仍是启动即退，但错误码和点名对象变了。</p>"
              },
              {
                "lines": "45-55",
                "title": "维度、端口、host",
                "badge": "",
                "body": "<p><code>EMBEDDING_DIMENSIONS</code> 默认 1024；不是 512/1024/2048 只打 <code>W_EMBEDDING_DIM</code>，不阻断——P1 只给 1024 建了 HNSW，其它维度会退顺序扫描。</p><p><code>host</code> 写死 <code>127.0.0.1</code>；<code>PORT</code> 用 <code>numOrThrow</code> 卡 1–65535。1.1 review 补的范围校验，防 <code>PORT=abc</code> 变成 NaN 后拖到 listen 才崩。</p>"
              }
            ]
          },
          {
            "id": "config-cleanup",
            "file": "src/config.ts",
            "lang": "ts",
            "ranges": [
              [
                65,
                81
              ]
            ],
            "notes": [
              {
                "lines": "65-74",
                "title": "清扫失败不阻断启动",
                "badge": "",
                "body": "<p><code>cleanUpOnBoot</code> 只做一件事：调用 <code>repo.markInterruptedAsFailed()</code>；清到行就记 <code>I_BOOT_CLEANUP</code>。</p><p>失败只记 <code>E_CLEANUP</code> 然后继续。代价是：数据库短暂不可达时，僵尸行会一直卡着，服务照样起来。LEARNING 把这条记为已知项。</p>"
              },
              {
                "lines": "75-81",
                "title": "维度体检是后来加的",
                "badge": "2.1",
                "body": "<p><code>dimensionsInStore()</code> 是 Epic 2 的检索体检，不属于 1.1。它只打一行 <code>I_VECTOR_DIMENSIONS</code>，不改启动结果。</p><p>放在这里说明一个读码原则：同一个函数里可能叠着多个 story 的补丁，按 badge 和提交历史切开看。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "infra-and-data",
        "kicker": "CODE · 07",
        "title": "基础设施与数据形状",
        "subtitle": "连接池、Ollama 探活、启动清扫、两份迁移。这四块决定地基稳不稳。",
        "body": "<div class=\"callout\">这一节里，<code>pool.ts</code>、<code>ollama.ts</code>、<code>resource.ts</code> 的路径都是 2026-10-16 重构后的；1.1 原路径分别是 <code>adapters/paradedb.ts</code>、<code>adapters/ollama.ts</code>、<code>pipeline/startup-cleanup.ts</code>。代码语义未变。</div>",
        "blocks": [
          {
            "id": "db-pool",
            "file": "src/adapter/connection/pool.ts",
            "lang": "ts",
            "ranges": [
              [
                13,
                32
              ]
            ],
            "notes": [
              {
                "lines": "13-20",
                "title": "懒连接 + 两个超时",
                "badge": "",
                "body": "<p><code>new Pool</code> 只是建对象，不会立刻连库；第一次 <code>query</code> 才握手。所以启动不会因为库慢而卡在建池这一步。</p><p><code>connectionTimeoutMillis=3000</code> 管“连不上就快速失败”，<code>query_timeout=5000</code> 管单条 SQL。两者都是 1.1 review 补的；没有它们，库不可达时启动清扫会无限等。</p>"
              },
              {
                "lines": "21-22",
                "title": "没有 error 监听会静默崩",
                "badge": "3.1",
                "body": "<p>远程 PG 掐空闲连接时，池会在没人借用的情况下 emit <code>error</code>。没有监听器就是未捕获异常，进程直接没了，而且不留业务日志。</p><p>监听器本身是 1.1 review 的 blocker 修复；<code>logError</code> 这个带 <code>trace_id</code> 的 logger 是 3.1 换的。别把整行都算成 3.1。</p>"
              }
            ]
          },
          {
            "id": "ollama",
            "file": "src/adapter/connection/ollama.ts",
            "lang": "ts",
            "ranges": [
              [
                13,
                22
              ],
              [
                42,
                49
              ]
            ],
            "notes": [
              {
                "lines": "13-22",
                "title": "/api/version 只回答在不在",
                "badge": "",
                "body": "<p>1.1 的健康探测只打 Ollama 的 <code>/api/version</code>：3 秒超时，非 2xx 或网络错误都返回 <code>false</code>。</p><p>它不判断模型有没有下载，也不判断生成能不能用；那是 1.2 的模型探针和 Epic 2 的调用层的事。</p>"
              },
              {
                "lines": "42-49",
                "title": "/api/tags 是 1.2 加的",
                "badge": "1.2",
                "body": "<p><code>ollamaModelList</code> 返回本地已下载模型。健康检查用它判断 <code>EMBEDDING_MODEL</code> 是否就绪。</p><p>模型名通常带 tag（如 <code>qwenembed:latest</code>），而 env 里是裸名；匹配要同时认裸名和冒号前缀，否则会误报“未就绪”。</p>"
              }
            ]
          },
          {
            "id": "boot-cleanup",
            "file": "src/adapter/repo/resource.ts",
            "lang": "ts",
            "ranges": [
              [
                169,
                197
              ]
            ],
            "notes": [
              {
                "lines": "169-180",
                "title": "先把所有 processing 捞出来",
                "badge": "",
                "body": "<p>条件只有两个：<code>status='processing'</code> 且 <code>deleted_at IS NULL</code>。上一个进程已经死了，所以这里不需要 <code>FOR UPDATE</code>。</p><p>但也因此没有“哪些行算遗留”的下界：如果清扫和新任务并发，理论上可能扫到刚插入的行。deferred-work 已记这条竞态风险。</p>"
              },
              {
                "lines": "181-187",
                "title": "删 chunk，级联带走向量",
                "badge": "",
                "body": "<p><code>DELETE FROM chunks</code> 会经 <code>embeddings.source_id</code> 的 <code>ON DELETE CASCADE</code> 把向量一起删掉，所以不会留孤儿向量。</p><p>然后把 resource 行改成 <code>failed</code> + <code>error_reason='入库中断'</code>。两步在同一个事务里，要么都成，要么都不成。</p>"
              },
              {
                "lines": "188-197",
                "title": "提交、返回条数、兜住回滚",
                "badge": "",
                "body": "<p>成功返回 <code>{ resources: ids.length }</code>，调用方据此决定要不要打日志。</p><p>失败走 <code>rollbackOrLog</code>：回滚本身再失败只记 <code>E_ROLLBACK</code>，不盖掉真正的错误。这个函数只在启动时调用一次，不在路由里散着写。</p>"
              }
            ]
          },
          {
            "id": "ext-sql",
            "file": "db/migrations/20261010025740_create_extensions.sql",
            "lang": "sql",
            "ranges": [
              [
                1,
                7
              ]
            ],
            "notes": [
              {
                "lines": "1-7",
                "title": "先装扩展，再建表",
                "badge": "",
                "body": "<p><code>vector</code> 提供 <code>halfvec</code> 与 HNSW；<code>pg_search</code> 提供 BM25 与中文 Lindera 分词。</p><p>扩展必须在建表/建索引之前存在，所以它是独立的第一份迁移；down 段按相反顺序删。</p>"
              }
            ]
          },
          {
            "id": "core-sql",
            "file": "db/migrations/20261010025742_create_core_tables.sql",
            "lang": "sql",
            "ranges": [
              [
                1,
                52
              ],
              [
                54,
                75
              ]
            ],
            "notes": [
              {
                "lines": "1-3",
                "title": "两个 enum 把口径钉在库层",
                "badge": "",
                "body": "<p><code>resource_status</code> 只有 <code>processing/ready/failed</code>；<code>resource_content_type</code> 只有 <code>url/markdown/plaintext</code>。</p><p>状态和类型不在业务代码里散着写字符串，库层先兜一道。</p>"
              },
              {
                "lines": "5-16",
                "title": "resources 是主表",
                "badge": "",
                "body": "<p><code>data_uri</code> 是内容来源标识（FR-11 自动生成）；<code>status</code> 默认 <code>processing</code>；<code>deleted_at</code> 做软删。</p><p><code>source</code> 可空：URL 入库有值，1.3 的粘贴内容没有 URL。</p>"
              },
              {
                "lines": "18-46",
                "title": "chunks 与 embeddings 靠外键串起来",
                "badge": "",
                "body": "<p><code>chunks.resource_id</code> 指向 resources，<code>embeddings.source_id</code> 指向 chunks；两条都是 <code>ON DELETE CASCADE</code>，删父行自动带走子行。</p><p>这是“删资源不留孤儿向量”的库层保证。HNSW 是向量近似索引；<code>halfvec</code> 是半精度，省内存。注意：这里只是初始形状，后续四个迁移会继续改维度列与索引。</p>"
              },
              {
                "lines": "48-52,54-75",
                "title": "BM25、会话、消息",
                "badge": "",
                "body": "<p>BM25 索引建在 <code>chunks.content</code> 上；第 53 行的 <code>text_fields</code> 声明了 <code>chinese_lindera</code> 分词器（完整 JSON 对象不展开），检索时 <code>pg_search</code> 才能按中文词打分。</p><p><code>sessions</code> / <code>messages</code> 在 1.1 只建表，Epic 2 才写入。到 1.1 收口时正好 5 张业务表；<code>traces</code> / <code>trace_stages</code> 是 3.1 之后加的，不在这份迁移里。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "health-and-contracts",
        "kicker": "CODE · 08",
        "title": "健康检查与 as-built 契约",
        "subtitle": "1.1 的 /health 语义、2026-10-25 的服务分组，以及 AC 里四个端口文件今天变成了什么。",
        "body": "<div class=\"callout\">这一段是“AC 与 as-built 差异”的证据面。代码是真的，差异也是真的；不把后来的重构藏起来。</div>",
        "blocks": [
          {
            "id": "health",
            "file": "src/routes/health.ts",
            "lang": "ts",
            "ranges": [
              [
                28,
                88
              ],
              [
                90,
                128
              ]
            ],
            "notes": [
              {
                "lines": "28-42",
                "title": "两层契约：服务 ok 由叶子推出",
                "badge": "2026-10-25",
                "body": "<p>响应体从平铺的 <code>checks</code> 收成 <code>services</code>：每个服务有 <code>ok</code> 与 <code>checks</code>，叶子仍是 <code>{ok, detail?}</code>。判定链只有一条——叶子全过 → 服务 ok；服务全过 → 顶层 <code>status</code>。</p><p>服务组只是归类，不是权重：没有 critical / advisory 分级，也没有按探针独立缓存。</p>"
              },
              {
                "lines": "44-57",
                "title": "postgres 组 = 1.1 的 db 探针",
                "badge": "2026-10-25",
                "body": "<p><code>createHealthServices</code> 按实际外部服务分组；<code>postgres.ping</code> 就是 1.1 的 DB <code>SELECT 1</code>。组名用实际服务名 <code>postgres</code>，不再叫 <code>db</code>；叶子名也去掉了服务前缀。</p>"
              },
              {
                "lines": "59-86",
                "title": "ollama 组：version + models + running",
                "badge": "1.2 / 2026-10-25",
                "body": "<p><code>version</code> 是 1.1 的 <code>/api/version</code> 探活；<code>models</code>（原 <code>ollama_models</code>）检查 <code>EMBEDDING_MODEL</code> 是否已下载，<code>running</code>（原 <code>ollama_running</code>）列出驻留内存的模型，后两者是 1.2 的补丁。</p><p><code>running</code> 永远返回 <code>ok:true</code>，只是信息展示，不参与健康判定。2026-10-25 只把它们收进 <code>ollama</code> 组并去掉前缀，判定规则没变。</p>"
              },
              {
                "lines": "90-128",
                "title": "503 degraded，但不拦业务",
                "badge": "1.2 / 2026-10-25",
                "body": "<p>叶子并发跑，单个抛错只把该项标 <code>ok:false</code>，不会炸掉整份响应；服务 <code>ok</code> 是叶子的 every；整份结果 5 秒缓存，任一服务失败返回 <strong>503 + degraded</strong>。</p><p><strong>关键缺口：</strong>这只回答“健康不健康”。入库/问答路由不读 health，degraded 时照样受理。retro E-1 明确记了这条 AC 只实现了一半，action item 仍 open。</p>"
              }
            ]
          },
          {
            "id": "adapter-contract",
            "file": "src/adapter/contract.ts",
            "lang": "ts",
            "ranges": [
              [
                31,
                35
              ],
              [
                72,
                112
              ]
            ],
            "notes": [
              {
                "lines": "31-35",
                "title": "基础层唯一的门",
                "badge": "现状",
                "body": "<p>所有基础层能力从 <code>contract.ts</code> 出，不逐盒建端口。1.1 的 <code>ports/repository.ts</code> 已经不在；今天的门交出 <code>Repo</code>、两个 model handle、Ollama 探针与 <code>embedChunks</code>。</p><p>这是 AD-6 的 as-built 形状：一个门，而不是四个接口文件。</p>"
              },
              {
                "lines": "72-112",
                "title": "Repo 把用例收成一张表",
                "badge": "现状",
                "body": "<p><code>Repo</code> 按资源、分块、会话、trace 分组。资源组的 <code>markInterruptedAsFailed</code> 就是 1.1 的启动清扫；它现在从这道门交给 <code>config.ts</code> 的 <code>cleanUpOnBoot</code>。</p><p>AC 的四个端口文件，今天对应为：<code>Repository</code> → 这里的 <code>Repo</code>；<code>Retriever</code> → <code>retrieve/contracts.ts</code>；<code>Embedder</code> / <code>ChatModel</code> → <code>EmbeddingHandle</code> / <code>ChatHandle</code>（AI SDK 句柄）。</p>"
              }
            ]
          },
          {
            "id": "retrieve-contract",
            "file": "src/retrieve/contracts.ts",
            "lang": "ts",
            "ranges": [
              [
                15,
                20
              ],
              [
                55,
                72
              ]
            ],
            "notes": [
              {
                "lines": "15-20",
                "title": "Retriever 契约搬到了这里",
                "badge": "现状",
                "body": "<p><code>ports/retriever.ts</code> 在检索改造 <code>dda283c</code> 被删，契约搬进 <code>retrieve/contracts.ts</code>。本层不再自己声明 repo/embed 端口，依赖一律来自 <code>adapter/contract.ts</code>。</p><p>这是 AC 与 as-built 的第二处差异：文件没了，能力还在。</p>"
              },
              {
                "lines": "55-72",
                "title": "可执行形状：search(Query, Options)",
                "badge": "现状",
                "body": "<p><code>RetrievedChunk</code> 继承 <code>ChunkCandidate</code> 再加 <code>score</code>；<code>Retriever.search</code> 返回 <code>RetrievalResult</code>。</p><p>和 1.1 的 <code>Retriever</code> 目标一致——把问题变成命中列表；但 1.1 只是接口占位，真正的融合实现是 Epic 2。</p>"
              }
            ]
          },
          {
            "id": "tool-contract",
            "file": "src/agent/tool/contracts.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                40
              ]
            ],
            "notes": [
              {
                "lines": "11-17",
                "title": "工具输入是 2.6 的事",
                "badge": "2.6",
                "body": "<p><code>RetrieveToolInput</code> 是 <code>{ prompt, topK }</code>：模型自己决定检索词和条数。这是 2.6 把检索包成工具后的形状，不是 1.1 的端口。</p><p>它出现在这里，是为了说明契约散落的终点：原本四个接口文件里的“检索能力”，最后变成了模型可调用的一格工具。</p>"
              },
              {
                "lines": "20-40",
                "title": "给模型读的输出，不 throw",
                "badge": "2.6",
                "body": "<p><code>RetrievedHit</code> 是命中投影，<code>RetrieveToolOutput</code> 把错误放在 <code>error</code> 字段。</p><p>原因写在文件头：工具里抛的错被 SDK 捕获后，<code>Error.message</code> 不是可枚举属性，序列化会丢掉中文原因，模型就会自己编。所以错误必须 return 成数据。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-skeleton",
        "kicker": "CODE · 09",
        "title": "前端骨架：只留代理这一小段",
        "subtitle": "1.1 的前端只做了 Vite + React + TS 和一条 /api 代理，不展开成前端走读。",
        "body": "<div class=\"callout\">原 <code>a687c3f</code> 里还有一个 <code>App.tsx</code> 调 <code>/api/health</code> 显示状态；那个文件后来被路由化前端取代了。这里只展示仍然保留、且属于 1.1 的 server 段。</div>",
        "blocks": [
          {
            "id": "web-vite",
            "file": "app/web/vite.config.ts",
            "source": "web:vite.config.ts",
            "lang": "ts",
            "ranges": [
              [
                47,
                57
              ]
            ],
            "notes": [
              {
                "lines": "47-57",
                "title": "127.0.0.1 + /api 代理",
                "badge": "",
                "body": "<p><code>host: '127.0.0.1'</code>、<code>port: 5173</code>，开发服务器只给本机用。代理把 <code>/api/health</code> 重写成 <code>/health</code>，再转发到后端 3000，省掉 CORS。</p><p>这一段从 1.1 起没变。上面的 TanStack Router、Tailwind、构建分桶都是后来的，不在本 story 的范围里。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">TRADEOFFS · 10</span>\n    <h2>关键取舍与踩坑</h2>\n    <p class=\"section-sub\">为什么是这副形状、否掉了什么、什么地方会静默失败。按“会咬人”的程度排。</p>\n  </header>\n\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">CHOICE 01</span><h3>Hono + @hono/node-server，不引 starter</h3><p>项目是 Greenfield，没有现成模板。Hono 的路由和 Web 标准 <code>Request/Response</code> 让后端保持薄；Node 适配器只负责 listen。代价是要自己处理 <code>hostname</code>、端口、优雅退出这些细节。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">CHOICE 02</span><h3>dbmate + 手写 SQL，不上 ORM</h3><p>P1 要写表达式索引、<code>halfvec</code> cast、BM25 这些定制 SQL；ORM 帮不上还挡路。迁移是纯 SQL 文件，dbmate 只记版本。参数化查询同样安全，原生 SQL 不等于注入风险。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">CHOICE 03</span><h3>健康检查只做探针，不做门</h3><p>1.1 只实现“告诉你坏没坏”，没有实现“坏了就不让入库”。后者需要路由层统一读 readiness，属于跨 story 的闸门；retro 把它记成 open action item，没有偷偷补上。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">CHOICE 04</span><h3>AI SDK 这格一行没用</h3><p><code>Embedder</code> / <code>ChatModel</code> 只是接口占位；真正的 <code>embedMany</code> / <code>streamText</code> 从 Epic 2 才登场。这也是为什么后来两个接口会被 AI SDK 句柄取代。</p></article>\n  </div>\n\n  <h3>踩坑清单</h3>\n  <ul class=\"pitfall-list\">\n    <li><strong><code>hostname</code> 不是 <code>host</code>。</strong>@hono/node-server 写成 <code>host</code> 会被静默忽略，退回 <code>0.0.0.0</code>。1.1 review 实测确认；安全边界靠这一行。</li>\n    <li><strong>连接池必须有 <code>error</code> 监听。</strong>远程 PG 掐空闲连接时，没有监听器就是未捕获异常，进程静默崩；再加连接/查询超时，库不可达时启动清扫才不会无限等。</li>\n    <li><strong>fail-fast 不可 catch。</strong>AppConfig 构造器直接 <code>process.exit(1)</code>；测试只能开子进程看退出码与 stdout，不能在同进程 <code>expect(...).toThrow</code>。</li>\n    <li><strong>degraded 不拦业务。</strong>retro E-1 的准确表述是“AC 与实现各说一半”：health 探针工作正常，但入库/问答路由与它零耦合。别把 503 当成闸门。</li>\n    <li><strong>探针分组不是分级。</strong>服务组只按实际依赖归类（<code>postgres</code> / <code>ollama</code>）；没有 critical / advisory 权重，<code>ollama.running</code> 仍是恒 <code>ok:true</code> 的信息项，不参与 503。拆 <code>/ready</code>、按探针独立缓存也仍被否决。</li>\n    <li><strong>启动清扫只跑一次，失败被吞。</strong>数据库短暂不可达时，<code>processing</code> 行会一直卡着；而且清扫与新任务之间没有“哪些算遗留”的下界。deferred-work 已记竞态。</li>\n    <li><strong>清扫没有真崩溃验证。</strong>retro 用优雅停止模拟，在途任务照样跑完；要验真崩溃得 <code>kill -9</code>，本轮被安全策略拦下。代码路径存在，不等于端到端验过。</li>\n    <li><strong>AC 的四个端口文件已经不在。</strong><code>ports/retriever.ts</code> 被检索改造 <code>dda283c</code> 删；<code>repository/embedder/chat-model</code> 被 2026-10-16 重构删。今天按 <code>adapter/contract.ts</code> + <code>retrieve/contracts.ts</code> + <code>agent/tool/contracts.ts</code> 读。</li>\n    <li><strong>缺 Key 的错误码变了。</strong>1.1 是 <code>E_CONFIG_MISSING</code> 点名 <code>DEEPSEEK_API_KEY</code>；DI 之后是 <code>E_CHAT_MODEL</code>（该模型不在册）。现象都是启动即退，但排错时别照着旧错误码找。</li>\n    <li><strong>别只读第一份迁移。</strong><code>20261010025742</code> 里还是 <code>dim</code> + <code>halfvec(1024)</code>；后续四个迁移才把它改成 <code>dimension</code>、不定长 halfvec、partial HNSW 与 <code>CHECK</code>。看最终形状要连起来读。</li>\n    <li><strong>前端 Key 边界靠约定 + 构建规则。</strong>Vite 只暴露 <code>VITE_</code> 前缀变量；本页涉及的 Key 都不带这个前缀，<code>app/web</code> 里也 grep 不到。新增配置时别把服务端 Key 改名成 <code>VITE_*</code>。</li>\n  </ul>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">VERIFY · 11</span>\n    <h2>可复制的验证命令</h2>\n    <p class=\"section-sub\">每条都标了证据等级：<strong>历史真跑过</strong>（retro / LEARNING 有记录）、<strong>仅代码路径</strong>（本轮没重跑）、<strong>本轮静态检查</strong>（只跑了 grep）。没有编造“我跑过了”。</p>\n  </header>\n\n  <div class=\"test-grid\">\n    <article class=\"test-card\"><h3>01 · 启动后端</h3><pre class=\"snippet\">cd app/server\nnpm run dev</pre><p class=\"test-note\"><strong>历史真跑过。</strong>retro 用的是 <code>npx tsx --env-file=.env src/index.ts</code>；当前脚本是 <code>tsx watch --env-file=.env src/index.ts</code>。期望看到 <code>I_SERVER_READY</code> 与 <code>http://127.0.0.1:3000</code>。</p></article>\n    <article class=\"test-card\"><h3>02 · 健康检查</h3><pre class=\"snippet\">curl -i http://127.0.0.1:3000/health\n\ncd app/server\nnpx vitest run test/health-chain.test.ts</pre><p class=\"test-note\"><strong>2026-10-25 本轮真跑过。</strong>返回 <code>200</code>：<code>status=ok</code>，<code>services.postgres.checks.ping.ok=true</code>，<code>services.ollama.checks.{version,models,running}.ok=true</code>；health-chain 4 条测试全绿。历史 retro 记录的是平铺的 <code>db=true ollama=true</code>，形状后来改过两次（1.2 加缓存与模型探针，2026-10-25 收成服务组）。HTTP 200 的语义没变。</p></article>\n    <article class=\"test-card\"><h3>03 · 只绑 127.0.0.1</h3><pre class=\"snippet\">lsof -nP -iTCP:3000 -sTCP:LISTEN</pre><p class=\"test-note\"><strong>历史真跑过。</strong>retro 观察到监听是 <code>127.0.0.1:3000</code>，不是 <code>*:3000</code>。若看到 <code>*:3000</code>，先查 <code>serve()</code> 是不是把 <code>hostname</code> 写成了 <code>host</code>。</p></article>\n    <article class=\"test-card\"><h3>04 · 缺 env 启动失败</h3><pre class=\"snippet\">cd app/server\nprintf '' &gt; /tmp/kc-empty.env\nnpx tsx --env-file=/tmp/kc-empty.env src/index.ts; echo \"EXIT=$?\"</pre><p class=\"test-note\"><strong>仅代码路径（本轮未重跑）。</strong>期望 <code>E_CONFIG_MISSING</code> 点名全部四个必需项，<code>EXIT=1</code>。历史真跑过的是缺 <code>DATABASE_URL</code> 与缺 <code>DEEPSEEK_API_KEY</code> 两条（当时错误码都是 <code>E_CONFIG_MISSING</code>）；DI 后若 <code>CHAT_MODEL</code> 指向 deepseek/dashscope，缺对应 Key 会变成 <code>E_CHAT_MODEL</code>。</p></article>\n    <article class=\"test-card\"><h3>05 · 五张核心表</h3><pre class=\"snippet\">cd app/server\ndbmate --url \"$DATABASE_URL\" --migrations-dir db/migrations up\npsql \"$DATABASE_URL\" -c \"SELECT tablename FROM pg_tables WHERE schemaname='public' ORDER BY 1;\"</pre><p class=\"test-note\"><strong>历史已应用（LEARNING 记录 dbmate 已跑）。</strong>期望至少看到 <code>resources / chunks / embeddings / sessions / messages</code>（还有 <code>schema_migrations</code>）。当前库还会多出 3.1 的 <code>traces / trace_stages</code>。<strong>本机坑：</strong>psql 是 keg-only，可能要用 <code>/opt/homebrew/opt/libpq/bin/psql</code>。</p></article>\n    <article class=\"test-card\"><h3>06 · 启动清扫</h3><pre class=\"snippet\">psql \"$DATABASE_URL\" -c \"SELECT id,status FROM resources WHERE status='processing';\"\n# 让一条资源停在 processing，kill -9 后端，再重启\npsql \"$DATABASE_URL\" -c \"SELECT status,error_reason FROM resources WHERE id='YOUR-ID';\"\npsql \"$DATABASE_URL\" -c \"SELECT count(*) FROM embeddings e LEFT JOIN chunks c ON c.id=e.source_id WHERE c.id IS NULL;\"</pre><p class=\"test-note\"><strong>仅代码路径（未端到端验证）。</strong>重启后该行应为 <code>failed / 入库中断</code>，其 chunks 为 0，最后一条查询（孤儿向量）应为 0。retro 没做成 <code>kill -9</code>，所以这条不能标“真跑过”。</p></article>\n    <article class=\"test-card\"><h3>07 · 密钥不在前端</h3><pre class=\"snippet\">grep -rn \"DEEPSEEK_API_KEY\\|DASHSCOPE_API_KEY\" app/web/src app/web/vite.config.ts || echo \"no key refs\"</pre><p class=\"test-note\"><strong>本轮静态检查。</strong>实际输出 <code>no key refs</code>；服务端只在 <code>adapter/provider/registry.ts</code> 读这两个变量。注意 grep 只证明源码没有，构建产物要靠 Vite 的 <code>VITE_</code> 规则兜底。</p></article>\n    <article class=\"test-card\"><h3>08 · 依赖坏了会怎样</h3><pre class=\"snippet\"># 停掉 Ollama 后\ncurl -i http://127.0.0.1:3000/health\n# 用测试库；这会真的尝试建一条资源\ncurl -i -X POST http://127.0.0.1:3000/resources \\\n  -H 'content-type: application/json' \\\n  -d '{\"url\":\"https://example.com\"}'</pre><p class=\"test-note\"><strong>仅代码路径。</strong>健康面会 503 + degraded；但第二个请求<strong>不会</strong>被 health 拦住——这正是 retro E-1 的缺口。别把 503 当门。</p></article>\n  </div>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">CONTINUITY · 12</span>\n    <h2>与前后 story 的衔接</h2>\n    <p class=\"section-sub\">1.1 是 Epic 1 的第一格，前面没有代码 story；它交出去的是“可启动的地基”，后面每一格都在这上面长。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead><tr><th>方向</th><th>story / 变更</th><th>它从 1.1 拿走了什么</th></tr></thead>\n    <tbody>\n      <tr><td><strong>前置</strong></td><td>无（Greenfield）</td><td>没有上一格代码。只有 PRD / 架构 / addendum 的约束；scaffold 是手动搭的。</td></tr>\n      <tr><td><strong>下一格</strong></td><td>Story 1.2 · 添加网页 URL 入库</td><td>用 1.1 的 pool、5 张表、<code>/health</code> 与启动清扫，开始写第一条 ingest 链路；同时把 health 拆成注册式探针。</td></tr>\n      <tr><td><strong>后续</strong></td><td>Story 1.3 / 1.4</td><td>1.3 复用 1.2 的 parse → chunk → embed → 写；1.4 加软删、取消、列表。都依赖 1.1 的表与外键。</td></tr>\n      <tr><td><strong>后续</strong></td><td>Epic 2 · 检索与问答</td><td>用 1.1 的 embeddings 表与 HNSW；<code>Retriever</code> 契约从 <code>ports/</code> 迁到 <code>retrieve/contracts.ts</code>；<code>ChatModel</code> 占位换成 AI SDK 句柄。</td></tr>\n      <tr><td><strong>后续</strong></td><td>Story 3.1 · endpoint trace</td><td>在 1.1 的入口装配上套全局 trace 壳：<code>createEndpointTrace</code>、<code>/traces</code>、<code>X-Trace-Id</code>。它不改变 1.1 的启动/清扫语义。</td></tr>\n      <tr><td><strong>非 story</strong></td><td>2026-10-20 DI 改造</td><td>把 1.1 的手写装配换成 tsyringe；env fail-fast 移进 <code>AppConfig</code> 构造器；<code>bootstrap.ts</code> 删除。功能等价，但错误路径和文件形状变了。</td></tr>\n      <tr><td><strong>非 story</strong></td><td>2026-10-25 探针分组</td><td>把平铺的 <code>db / ollama / ollama_models / ollama_running</code> 收成 <code>postgres</code> / <code>ollama</code> 两个服务组；响应体顶层 <code>checks</code> → <code>services</code>；判定链与 503 语义不变。</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout strong\"><strong>交接提醒：</strong>接手时先看 <code>sprint-status.yaml</code> 的 1-1 条目与 <code>epic-1-retro-2026-10-13.md</code>。两条 still-open 的账直接影响对 1.1 的判断：① degraded 是否拦入库（实现门或改 AC）；② 启动清扫按 retro 要“收进 Repository 端口 + 用一次真崩溃端到端验证”——as-built 已把实现放在 <code>adapter/repo/resource.ts</code> 并经 <code>Repo</code> 暴露，<strong>但真崩溃验证仍未做</strong>，sprint 里的 action item 也还没关。</div>\n\n  <div class=\"next-box\">\n    <p>下一步不是回补 1.1 的功能，而是按 Epic 1 的顺序读 1.2：它会把这里的 pool、表、health 真正用起来。</p>\n    <div class=\"next-links\"><a href=\"#conclusion-and-boundary\">回到边界</a><a href=\"#verification-commands\">再看验证</a><a href=\"#code-and-annotations\">回到代码</a></div>\n  </div>\n</section>"
    },
    {
      "type": "html",
      "html": "<footer class=\"footer\">\n  <p>Story 1.1 walkthrough · 页面代码来自当前工作区真实文件；1.1 原提交 aca895c，review b355ce6 / c854bc9，前端 a687c3f。后续补丁按 badge 标出（DI、3.1、1.2、2.1、2.6、现状）。</p>\n  <p>证据：<code>epics.md</code> Story 1.1 · <code>sprint-status.yaml</code> 1-1 · <code>epic-1-retro-2026-10-13.md</code> · <code>LEARNING.md</code> Story 1.1 · 内层 git 历史。静态校验通过，视觉体检由 Lynx 浏览器完成。</p>\n</footer>"
    }
  ]
}
