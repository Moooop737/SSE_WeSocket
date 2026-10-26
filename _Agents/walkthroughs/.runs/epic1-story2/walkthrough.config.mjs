export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic1-story2-url-ingest.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 1 · Story 1.2 URL 入库 · 带代码逐行讲解",
  "tocTitle": "Story 1.2",
  "tocSub": "URL 入库 · 带代码逐行讲解",
  "accent": "#047857",
  "accent2": "#065f46",
  "accentDark": "#6ee7b7",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>EPIC 1 · STORY 1.2</span><span>·</span><span>FR-1 / FR-3 / FR-4</span></div>\n  <h1>粘贴一个 URL，<br><em>长成一篇可检索的知识</em></h1>\n  <p class=\"hero-sub\">一条 URL 怎样变成可检索的 chunk；点开始，跟着请求走一遍。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>状态</strong> done · 2026-10-13</span>\n    <span class=\"chip\"><strong>入口</strong> POST /resources</span>\n    <span class=\"chip\"><strong>5 段</strong> fetch / parse / chunk / embed / write</span>\n    <span class=\"chip\"><strong>代码</strong> 当前工作区，含未提交 Epic 3</span>\n  </div>\n  <div class=\"trace-pill\"><b>POST</b> /resources {url} <span>→</span> <b>201</b> { status: \"ready\", chunk_count: 16 } <span>· 2026-10-13 真跑记录</span></div>\n</header>\n\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">01 · BOUNDARY</span>\n    <h2>一句话结论与边界</h2>\n    <p class=\"section-sub\">先钉边界，再跟导览走代码。</p>\n  </header>\n  <div class=\"callout strong\"><strong>一句话：</strong>Story 1.2 把一条 URL 变成一个 <code>ready</code> 资源；失败留痕、重复 URL 拒绝、向量和 chunk 同事务。</div>\n  <div class=\"choice-grid\">\n    <div class=\"choice\"><span class=\"choice-no\">OWNS</span><h3>本页交付</h3><p>fetch → parse → chunk → embed → write；空正文 / embed 失败 / 重复 URL 的处理；取消信号入口。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">NOT OWNS</span><h3>不在本页</h3><p>1.3 文本分支、1.4 取消/软删、2.x 检索、3.x trace；它们只在代码里带徽章出现。</p></div>\n  </div>\n</section>\n<section class=\"section\" id=\"guided-flow\">\n  <div class=\"flow-launch\">\n    <div>\n      <span class=\"kicker\">GUIDED FLOW</span>\n      <h2>跟着一条 URL 走一遍</h2>\n      <p>选一条链路 · 自动定位代码 · 动画讲逻辑</p>\n    </div>\n    <div class=\"flow-picker\" id=\"flow-picker\"></div>\n  </div>\n  <script type=\"application/json\" id=\"flow-data\">{\"flows\":[{\"id\":\"happy\",\"label\":\"成功链路\",\"stages\":[\"POST\",\"查重/建行\",\"fetch\",\"parse\",\"chunk\",\"embed\",\"write\"],\"steps\":[{\"stage\":0,\"title\":\"收请求，组装 Recipe\",\"code\":\"route-post\",\"lines\":\"143-152\",\"note\":\"143-152\",\"explain\":\"路由只校验 body 与 url，然后组装 Recipe + KBData；还没碰数据库。\",\"result\":{\"kind\":\"request\",\"method\":\"POST\",\"path\":\"/resources\",\"body\":\"{\\\"url\\\":\\\"https://weknora.weixin.qq.com/docs/01-getting-started/03-quickstart.html\\\"}\",\"status\":\"→ Recipe\"}},{\"stage\":1,\"title\":\"查重，先建 processing 行\",\"code\":\"ingest-assemble\",\"lines\":\"53-70\",\"note\":\"62-70\",\"explain\":\"同 URL 的 ready/processing 直接 409；否则先建一行 processing，失败才有地方留痕。\",\"result\":{\"kind\":\"state\",\"from\":\"—\",\"to\":\"processing\",\"meta\":\"resources 1 行 · chunks 0 · title 用域名占位\"}},{\"stage\":2,\"title\":\"fetch：抓原始 HTML\",\"code\":\"ingest-stages\",\"lines\":\"95-109\",\"note\":\"95-109\",\"explain\":\"HttpFetcher 只认 http/https，30s 超时；把 final_url、status、content_type 记进 ctx。\",\"result\":{\"kind\":\"response\",\"status\":\"200\",\"meta\":\"text/html · 12.4 KB\",\"detail\":\"final_url = https://weknora…/03-quickstart.html\"}},{\"stage\":3,\"title\":\"parse：抽正文 → Markdown\",\"code\":\"ingest-stages\",\"lines\":\"110-121\",\"note\":\"110-121\",\"explain\":\"Readability 挑正文，turndown 转 Markdown；空正文在这一步直接 failed。\",\"result\":{\"kind\":\"metrics\",\"items\":[[\"Markdown\",\"8.4K chars\"],[\"title\",\"快速上手 · WeKnora 文档\"]],\"note\":\"0 块会在下一步失败\"}},{\"stage\":4,\"title\":\"chunk：切块 + 定位\",\"code\":\"ingest-stages\",\"lines\":\"128-139\",\"note\":\"128-139\",\"explain\":\"LegacyChunker 按分隔符与保护段切；每块带 chunk_index 和起止偏移。\",\"result\":{\"kind\":\"chunks\",\"count\":16,\"offsets\":\"0 … 8421\",\"preview\":[\"# 快速上手…\",\"## 安装…\",\"## 配置…\"]},\"animation\":{\"kind\":\"slice\",\"count\":16,\"shown\":8,\"offsets\":8421}},{\"stage\":5,\"title\":\"embed：向量与 chunk 对齐\",\"code\":\"ingest-stages\",\"lines\":\"141-154\",\"note\":\"141-154\",\"explain\":\"embedMany 一次算齐；条数必须与 chunk 对齐，向量还没写库，失败只需把行标 failed。\",\"result\":{\"kind\":\"vectors\",\"count\":16,\"dim\":1024,\"model\":\"qwenembed (Ollama)\"},\"animation\":{\"kind\":\"vectors\",\"count\":16,\"shown\":12,\"dim\":1024}},{\"stage\":6,\"title\":\"write：一个事务写三张表\",\"code\":\"repo-chunk\",\"lines\":\"130-139\",\"note\":\"130-139\",\"explain\":\"chunk、向量、ready 在同一事务；任何一步失败整笔回滚，不留孤儿向量。\",\"result\":{\"kind\":\"commit\",\"status\":\"ready\",\"meta\":\"COMMIT · 16 chunks · 16 vectors\",\"tables\":\"resources / chunks / embeddings\"},\"animation\":{\"kind\":\"commit\"}}]},{\"id\":\"failure\",\"label\":\"失败链路\",\"stages\":[\"POST\",\"查重/建行\",\"fetch\",\"parse\",\"chunk\",\"embed\",\"write\"],\"steps\":[{\"stage\":3,\"title\":\"空正文：parse 后直接失败\",\"code\":\"ingest-stages\",\"lines\":\"110-121\",\"note\":\"110-121\",\"explain\":\"解析后没有正文就不往下走；Resource 转 failed(内容为空)，不进入 ready。\",\"result\":{\"kind\":\"failure\",\"status\":\"failed\",\"reason\":\"内容为空\",\"meta\":\"0 chunks · fail() 清空\"},\"animation\":{\"kind\":\"failure\",\"reason\":\"内容为空\"}},{\"stage\":5,\"title\":\"embed 失败：撤掉已写部分\",\"code\":\"ingest-assemble\",\"lines\":\"72-84\",\"note\":\"72-84\",\"explain\":\"任何一段抛错都走 fail()：先删已写 chunk，再把同一行改成 failed。\",\"result\":{\"kind\":\"failure\",\"status\":\"failed\",\"reason\":\"embedding_error\",\"meta\":\"chunks 已清 · embeddings 级联 · 无孤儿向量\"},\"animation\":{\"kind\":\"failure\",\"reason\":\"embedding_error\"}},{\"stage\":2,\"title\":\"fetch 失败：不可达 / 非 2xx\",\"code\":\"ingest-stages\",\"lines\":\"95-109\",\"note\":\"95-109\",\"explain\":\"HttpFetcher 失败同样落到同一条 resource；原因写进 error_reason。\",\"result\":{\"kind\":\"failure\",\"status\":\"failed\",\"reason\":\"fetch_error\",\"meta\":\"资源行保留 · 原因可查\"},\"animation\":{\"kind\":\"failure\",\"reason\":\"fetch_error\"}},{\"stage\":6,\"title\":\"取消 / 超时：信号入口\",\"code\":\"ingest-assemble\",\"lines\":\"72-84\",\"note\":\"72-84\",\"explain\":\"取消先掐 fetch/embed；1.2 只留信号入口，写入期撤回由 1.4 补。\",\"result\":{\"kind\":\"failure\",\"status\":\"failed\",\"reason\":\"cancelled\",\"meta\":\"1.4 写守卫 · 写入期撤回 ready\"},\"animation\":{\"kind\":\"failure\",\"reason\":\"cancelled\"}}]},{\"id\":\"duplicate\",\"label\":\"幂等链路\",\"stages\":[\"POST\",\"查重/建行\",\"fetch\",\"parse\",\"chunk\",\"embed\",\"write\"],\"steps\":[{\"stage\":1,\"title\":\"同 URL 已有活跃资源\",\"code\":\"ingest-assemble\",\"lines\":\"53-60\",\"note\":\"53-60\",\"explain\":\"查重只看 ready/processing；命中就 409，不建新行。\",\"result\":{\"kind\":\"response\",\"status\":\"409\",\"meta\":\"E_DUPLICATE · 不建新行\"},\"animation\":{\"kind\":\"reject\"}},{\"stage\":1,\"title\":\"失败资源允许重抓\",\"code\":\"ingest-assemble\",\"lines\":\"53-60\",\"note\":\"53-60\",\"explain\":\"failed 不挡重抓；这是幂等策略的另一半。\",\"result\":{\"kind\":\"state\",\"from\":\"failed\",\"to\":\"可重抓\",\"meta\":\"不产生第二条活跃资源\"}}]}]}</script>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 02</span>\n    <h2>一眼看懂：URL 入库的五段与失败分支</h2>\n    <p class=\"section-sub\">从 POST 到三张表；失败不是一条直线。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>5</strong>段管线</span><span class=\"chip\"><strong>1</strong>事务写入</span><span class=\"chip\"><strong>2</strong>类入口结果</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic1-story2-url-ingest.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 1.2 URL 入库五段与失败分支\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:1148 / 676;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic1-story2-url-ingest.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>先建 processing 行再抓取；fetch 失败仍有 Resource 可留痕。</li><li>空正文、embed 失败、事务失败都回到 failed；不留下 ready 但缺向量。</li><li>查重只拦 ready/processing，failed 可重抓；取消入口在这格只是信号，完整落点在 1.4。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画非 HTML 前置拒绝（deferred）与 warning 的前端展示（当前已展示）。</div>\n</section>\n\n\n<section class=\"section\" id=\"global-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">02 · GLOBAL MAP</span>\n    <h2>全局地图：从入口到三张表</h2>\n    <p class=\"section-sub\">先看全景，再进代码。前两步是入口，后五段是 fetch / parse / chunk / embed / write；阶段之间用 <code>IngestContext</code> 传递数据。</p>\n  </header>\n\n  <div class=\"pipeline\">\n    <div class=\"pipeline-head\">\n      <span class=\"pipeline-label\">一次 URL 入库</span>\n      <span class=\"pipeline-note\">阶段之间用 <code>IngestContext</code> 传数据</span>\n    </div>\n    <div class=\"pipeline-track\">\n      <div class=\"stage\"><span class=\"stage-no\">01</span><strong>POST /resources</strong><small>校验 body · 组装 Recipe</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">02</span><strong>查重 + 建行</strong><small>ready/processing 拦截 · 建 processing</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">03</span><strong>fetch</strong><small>HttpFetcher · 30s</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">04</span><strong>parse</strong><small>Readability → Markdown</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">05</span><strong>chunk</strong><small>LegacyChunker · 偏移 + 保护段</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">06</span><strong>embed</strong><small>embedMany · 条数对齐</small></div>\n      <span class=\"stage-arrow\">→</span>\n      <div class=\"stage\"><span class=\"stage-no\">07</span><strong>write txn</strong><small>chunk + 向量 + ready 同事务</small></div>\n    </div>\n    <div class=\"pipeline-failure\">\n      <span class=\"rail-label\">失败 / 取消</span>\n      <span class=\"rail-node\">failed · error_reason</span>\n      <span class=\"rail-note\"><code>fail()</code> 先删已写 chunk，再改状态</span>\n      <span class=\"badge\">1.4 取消落点</span>\n    </div>\n  </div>\n\n  <div class=\"schema-grid\">\n    <article class=\"schema-card\">\n      <header><code>resources</code><span>一条资源</span></header>\n      <div class=\"schema-row\"><code>id</code><span class=\"key pk\">PK</span><span class=\"field-note\">uuid</span></div>\n      <div class=\"schema-row\"><code>title</code><span class=\"field-note\">text</span></div>\n      <div class=\"schema-row\"><code>status</code><span class=\"field-note\">processing / ready / failed</span></div>\n      <div class=\"schema-row\"><code>source</code><span class=\"field-note\">URL；粘贴为 NULL</span></div>\n      <div class=\"schema-row\"><code>data_uri</code><span class=\"field-note\">回原文标识</span></div>\n      <div class=\"schema-row\"><code>error_reason</code><span class=\"field-note\">失败原因</span></div>\n      <div class=\"schema-row\"><code>deleted_at</code><span class=\"badge\">1.4</span><span class=\"field-note\">软删</span></div>\n    </article>\n    <article class=\"schema-card\">\n      <header><code>chunks</code><span>一块正文</span></header>\n      <div class=\"schema-row\"><code>id</code><span class=\"key pk\">PK</span><span class=\"field-note\">uuid</span></div>\n      <div class=\"schema-row\"><code>resource_id</code><span class=\"key fk\">FK</span><span class=\"key cascade\">CASCADE</span><span class=\"field-note\">resources.id</span></div>\n      <div class=\"schema-row\"><code>chunk_index</code><span class=\"field-note\">0,1,2… 稠密编号</span></div>\n      <div class=\"schema-row\"><code>content</code><span class=\"field-note\">text</span></div>\n      <div class=\"schema-row\"><code>start_offset</code><span class=\"field-note\">slice 起点</span></div>\n      <div class=\"schema-row\"><code>end_offset</code><span class=\"field-note\">slice 终点</span></div>\n    </article>\n    <article class=\"schema-card\">\n      <header><code>embeddings</code><span>一块向量</span></header>\n      <div class=\"schema-row\"><code>id</code><span class=\"key pk\">PK</span><span class=\"field-note\">uuid</span></div>\n      <div class=\"schema-row\"><code>source_id</code><span class=\"key fk\">FK</span><span class=\"key cascade\">CASCADE</span><span class=\"field-note\">chunks.id</span></div>\n      <div class=\"schema-row\"><code>embedding</code><span class=\"field-note\">halfvec（不定长）</span></div>\n      <div class=\"schema-row\"><code>dimension</code><span class=\"field-note\">实际维度；1.2 时 1024</span></div>\n      <div class=\"schema-row\"><code>model</code><span class=\"field-note\">产向量的模型</span></div>\n    </article>\n  </div>\n  <p class=\"section-sub\" style=\"margin-top:10px\">只列本页用到的字段；完整列见 migration。<code>deleted_at</code> 是 1.4 的补丁。</p>\n\n  <div class=\"callout\">\n    <strong>两条不变量先记住：</strong>①建行之后的失败都留在同一条 <code>resource</code> 行上，带 <code>error_reason</code>；建行之前就拒绝的（坏 body、非法 URL、重复 URL）不建行。②向量和 chunk 必须同生共死：写 chunk、写向量、把行改成 <code>ready</code> 在同一个事务里，任何一步失败就整笔回滚。\n  </div>\n</section>\n\n\n\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"file-map\"><section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">05 · FILE MAP</span>\n    <h2>文件地图：谁负责哪一段</h2>\n    <p class=\"section-sub\">按阅读顺序排列，不是按目录字母。带徽章的文件包含后置 story 的补丁。</p>\n  </header><details class=\"fold\"><summary>展开文件地图（11 个文件）</summary>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>职责</th><th>本页读什么</th></tr></thead>\n    <tbody>\n      <tr><td><code>src/routes/resources.ts</code></td><td>HTTP 入口：校验、装配、调管线、映射状态码 <span class=\"badge b-now\">1.3 / 1.4 / 2.x / 3.4</span></td><td>POST 分支，L143–216</td></tr>\n      <tr><td><code>src/ingest/contracts.ts</code></td><td>Recipe / KBData / IngestResult / stage 接口</td><td>类型契约，L4–63</td></tr>\n      <tr><td><code>src/ingest/ingest.ts</code></td><td>生命周期与失败语义：查重 → 建行 → 5 段 → ready/failed <span class=\"badge b-now\">1.4 / 3.4 / DI</span></td><td>L45–93、L95–180、L211–225</td></tr>\n      <tr><td><code>src/ingest/fetch/http-fetcher.ts</code></td><td>HTTP GET，只允许 http/https，30s 超时</td><td>全文 39 行</td></tr>\n      <tr><td><code>src/ingest/parse/html-parser.ts</code></td><td>jsdom → Readability → turndown(+gfm) → Markdown</td><td>全文 43 行</td></tr>\n      <tr><td><code>src/ingest/chunk/legacy.ts</code></td><td>WeKnora 分块器移植：切分/保护段/装箱/重叠/偏移</td><td>三段摘录</td></tr>\n      <tr><td><code>src/ingest/chunk/protected.ts</code></td><td>代码块、表格、公式等保护段识别</td><td>全文 48 行</td></tr>\n      <tr><td><code>src/adapter/model/embed-chunks.ts</code></td><td>AI SDK <code>embedMany</code> 封装 <span class=\"badge b-now\">2.x</span></td><td>全文 29 行</td></tr>\n      <tr><td><code>src/adapter/repo/resource.ts</code></td><td>资源行：查重、建行、改状态/标题 <span class=\"badge b-now\">1.4 / 2.x</span></td><td>L71–112</td></tr>\n      <tr><td><code>src/adapter/repo/chunk.ts</code></td><td>chunk+向量+ready 的同事务写入 <span class=\"badge b-now\">1.4 / 2.x</span></td><td>L78–148</td></tr>\n      <tr><td><code>src/ingest/recipes.ts</code></td><td>策略名→实例的注册表 <span class=\"badge b-now\">1.3</span></td><td>全文 39 行</td></tr>\n    </tbody>\n  </table>\n</section></details></section>\n"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "06 · CODE",
        "title": "代码逐段：先看入口，再看管线",
        "subtitle": "左边代码带行号；点右侧 note 展开解释。",
        "body": "<div class=\"callout\"><strong>先提醒：</strong>代码来自当前工作区；后置补丁用徽章标出。</div>",
        "blocks": [
          {
            "id": "route-post",
            "file": "src/routes/resources.ts",
            "lang": "ts",
            "ranges": [
              [
                143,
                216
              ]
            ],
            "notes": [
              {
                "lines": "143-152",
                "title": "先把请求体当 JSON 对象",
                "body": "<p>不是合法 JSON → 400 <code>E_BAD_JSON</code>；是合法 JSON 但不是对象（<code>null</code>/数字/数组）也 400。这一层不建 Resource：系统边界先挡住，后面的管线就不用到处判空。</p>"
              },
              {
                "lines": "155-166",
                "title": "url 与 content 恰好给一个",
                "body": "<p>这是 1.2/1.3 共用入口：URL 分支归 1.2，content 分支归 1.3。纯空白 content 会被折成 <code>undefined</code>，单独报 <code>E_EMPTY_CONTENT</code>；两个都给或都不给报 <code>E_AMBIGUOUS_INPUT</code>。</p>"
              },
              {
                "lines": "171-184",
                "title": "URL 只放行 http/https，然后组装配单",
                "body": "<p><code>new URL</code> 先判语法，再判协议白名单；通过后把来源翻译成策略：<code>fetcher: \"http\"</code>、<code>parser: \"html\"</code>。这一步只组 <code>Recipe</code> 与 <code>KBData</code>，不发网络请求、不建行。</p>"
              },
              {
                "lines": "185-192",
                "title": "content 分支是 1.3 的补丁",
                "badge": "1.3",
                "body": "<p><code>passthrough</code> + <code>text</code> 让粘贴的 Markdown/纯文本跳过 fetch，直接进 parse→chunk→embed→write。列在这里是为了说明“同一个 POST 有两条来源”，不把它算成 1.2 的 URL 交付。</p>"
              },
              {
                "lines": "194-203",
                "title": "调管线；sink 是 3.4 的观测补丁",
                "badge": "3.4",
                "body": "<p><code>factory.assemble(recipe).run(data, undefined, { sink })</code> 里的 <code>sink</code> 把每个 stage 的输入/输出/耗时写进 trace（3.4）。1.2 收口时这里是 <code>run(data, c.req.raw.signal)</code>；1.4 把取消改成服务端持有后，不再拿 HTTP 连接当信号源，所以第二个参数现在是 <code>undefined</code>。</p>"
              },
              {
                "lines": "204-210",
                "title": "三种结果：409 / 422 / 201",
                "body": "<p>查重命中 → 409 <code>E_DUPLICATE</code>；建行后失败 → 422，body 带 <code>resource</code>（里面有 <code>id</code>/<code>error_reason</code>）；成功 → 201，带 <code>resource</code>、<code>chunk_count</code>，有 warning 就一起透传。<strong>当前 POST 是同步跑完才返回</strong>，所以 201 时已经是 <code>ready</code>，不需要前端轮询。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-contract",
        "kicker": "07 · CONTRACT",
        "title": "契约：Recipe 是装配单，KBData 是货",
        "subtitle": "这三个类型把“选什么策略”和“这次处理什么数据”分开，是 build3 工厂重构的地基。",
        "blocks": [
          {
            "id": "ingest-contract",
            "file": "src/ingest/contracts.ts",
            "lang": "ts",
            "ranges": [
              [
                4,
                63
              ]
            ],
            "notes": [
              {
                "lines": "5-11",
                "title": "Recipe：只写策略名，不装数据",
                "body": "<p><code>fetcher/parser/chunker</code> 是注册表里的名字；<code>embedding</code> 是装配层选定的句柄（2.x 起不再走名字注册表）；<code>repo</code> 是数据库门。这样工厂只负责“兑换”，来源分支留在路由。</p>"
              },
              {
                "lines": "14-19",
                "title": "KBData：这次要入库的货",
                "body": "<p>URL 分支只填 <code>content_type: \"url\"</code>、<code>url</code> 和可选 <code>title</code>；<code>content</code> 是 1.3 的文本分支才用。同一个管线因此能服务两种来源。</p>"
              },
              {
                "lines": "22-36",
                "title": "IngestResult：拒绝、失败、成功、warning",
                "body": "<p><code>resource: null</code> 只表示“建行之前就拒绝”（如查重命中）；建行后的失败会返回 <code>resource.status === \"failed\"</code> 和 <code>failure</code>。<code>warning</code> 是 1.2 build3 加的：入库成功但正文可疑，不阻断。</p>"
              },
              {
                "lines": "40-44",
                "title": "注册表只认三个 stage",
                "body": "<p><code>fetcher/parser/chunker</code> 查名字；embed 不在表里，因为全库只允许一个 embedding 模型，检索期必须与入库期同模型同维度。查无返回 <code>undefined</code>，由工厂转成 <code>E_UNKNOWN_STAGE</code>。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-factory",
        "kicker": "08 · FACTORY",
        "title": "IngestFactory：一条 URL 的完整生命周期",
        "subtitle": "这是 1.2 的心脏。先读装配与失败语义，再读五段的顺序。",
        "blocks": [
          {
            "id": "ingest-assemble",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                45,
                93
              ]
            ],
            "notes": [
              {
                "lines": "45-51",
                "title": "把 Recipe 兑换成实例",
                "body": "<p><code>need()</code> 查不到就抛 <code>IngestError(E_UNKNOWN_STAGE)</code>，路由映射成 400。工厂里没有“如果是 URL 就……”的分支；来源判断已经在路由做完了。</p>"
              },
              {
                "lines": "53-60",
                "title": "查重只拦 ready / processing",
                "body": "<p><code>findActiveBySource</code> 只匹配这两种状态，而且要求未软删；<code>failed</code> 的同 URL 允许重抓。命中时返回 <code>resource: null</code>，<strong>不会建行</strong>。这就是 1.2 选的幂等策略：拒绝，而不是更新。</p>"
              },
              {
                "lines": "62-70",
                "title": "先建 processing 行，标题用域名占位",
                "body": "<p>为什么先建？因为 AC 要求“已进入入库后才失败”也要有一条 <code>failed</code> Resource 附原因；不先建行，fetch 失败就没有地方留痕。标题优先级是“用户给的 → parse 出的 → 域名占位”，这里先放域名，parse 成功后再回填。</p>"
              },
              {
                "lines": "72-84",
                "title": "取消开关 + fail 留痕",
                "badge": "1.4",
                "body": "<p>1.4 把取消改成服务端持有：<code>ctrl</code> 按资源 id 登记，任意请求都能按；1.2 只要求入口支持信号。<code>fail()</code> 先删已写 chunk，再把行改成 <code>failed</code> 并写 <code>error_reason</code>；这里<strong>绝不复用取消信号</strong>，否则 aborted signal 会把“失败留痕”一起杀掉。</p>"
              },
              {
                "lines": "86-93",
                "title": "取消 / 超时 / 真错误分开",
                "badge": "1.4",
                "body": "<p><code>failFrom</code> 先看 <code>Signal.aborted</code>（取消），再看 <code>TimeoutError</code>（stage 自带 30s 超时），最后才是普通失败。1.2 的验收只要求“有取消入口”，这几个专属码是 1.4 补齐的。</p>"
              }
            ]
          },
          {
            "id": "ingest-stages",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                95,
                180
              ]
            ],
            "notes": [
              {
                "lines": "95-109",
                "title": "fetch：抓原始 HTML",
                "badge": "3.4",
                "body": "<p>真正干活的是 <code>fetcher.run(ctx, Signal)</code>（1.2）；外面这层 <code>runStage</code> 是 3.4 的 trace 包壳，记录 url、final_url、content_length、http_status。抓取失败会在这里抛，落到外层 <code>failFrom</code> → <code>failed</code>。</p>"
              },
              {
                "lines": "110-121",
                "title": "parse：抽正文；空正文直接失败",
                "body": "<p><code>parser.run(ctx)</code> 是同步的，把 Markdown 写进 <code>ctx.parsed</code>。如果正文 trim 后为空，<strong>行已经建了</strong>，所以走 <code>fail(\"解析后无正文\")</code>，而不是 400。注意这跟“0 个 chunk”是两条不同的失败原因。</p><p>当前这段外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 的。</p>",
                "badge": "3.4"
              },
              {
                "lines": "123-126",
                "title": "标题回填：用户没给才写",
                "body": "<p>如果用户显式给了 title，就不覆盖；否则 parse 出真标题且与占位不同，才 <code>updateResourceTitle</code> 并同步内存里的 <code>resource.title</code>，让 201 返回的标题也是新的。</p>"
              },
              {
                "lines": "128-139",
                "title": "chunk：切块并生成定位信息",
                "body": "<p>分块器返回 <code>ChunkPlan[]</code>，每个 plan 带 <code>chunk_index</code>、<code>content</code>、<code>start_offset</code>、<code>end_offset</code>。0 块 → <code>fail(\"内容为空\")</code>。<code>start/end</code> 是 JS 字符串索引，不变量是 <code>text.slice(start,end) === content</code>。</p><p>当前这段外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 的。</p>",
                "badge": "3.4"
              },
              {
                "lines": "141-154",
                "title": "embed：先把向量算齐，再碰数据库",
                "badge": "2.x",
                "body": "<p>当前 <code>embedChunks</code> 是 2.x 换成的 AI SDK <code>embedMany</code> 封装；1.2 时是 qwenembed 自己发 <code>/v1/embeddings</code>。语义没变：带 30s 超时 + 取消信号，返回顺序与条数要和输入一致。条数不等 → <code>embedding_error</code>；此时 chunk 还没写，所以库里不会留下半套向量。</p>"
              },
              {
                "lines": "156-176",
                "title": "write：chunk + 向量 + ready 同一事务",
                "body": "<p><code>writeChunksWithEmbeddings</code> 是唯一的写入口：三个动作一笔事务。写入后如果发现取消已按下，1.4 的复查会调 <code>cancelled()</code> 把刚提交的 ready 撤回来；资源在写入期间被删则抛 <code>E_RESOURCE_GONE</code>。<code>thinPage</code> 在成功之后才算 warning，只提示、不改状态。</p><p>当前这段外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 的。</p>",
                "badge": "3.4"
              },
              {
                "lines": "177-180",
                "title": "兜底与注销登记",
                "body": "<p>外层 <code>catch</code> 把未预料的异常收成 <code>failed(\"入库失败\")</code>；<code>finally</code> 一定把 in-flight 登记删掉（同一个 id 被复用时还要比对 controller，见 1.4 的 inflight）。</p>"
              }
            ]
          },
          {
            "id": "ingest-helpers",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                211,
                225
              ]
            ],
            "notes": [
              {
                "lines": "211-219",
                "title": "thinPage：提示“可能抓不全”",
                "body": "<p>原页 ≥2000 字符、抽出正文 <200 字符 ⇒ 大概率是 JS 渲染壳页或反爬占位。返回一句 warning，但<strong>行仍是 ready</strong>，不阻断其他入库。这是 1.2 的 AC；201 body 里有这个字段，1.2 收口时还没展示（当前 ingest-panel 已展示）。</p>"
              },
              {
                "lines": "221-225",
                "title": "notStarted：建行前就抛的兜底",
                "body": "<p>查重/建行本身抛错时还没有资源行，只能返回 <code>resource: null</code> 的失败结果；<code>batch</code> 用它做到“一条抛出不影响其余”。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-fetch-parse",
        "kicker": "09 · FETCH / PARSE",
        "title": "抓网页与把网页变成 Markdown",
        "subtitle": "1.2 的“原料处理”两段：先拿到 HTML，再抽出干净正文。",
        "blocks": [
          {
            "id": "http-fetcher",
            "file": "src/ingest/fetch/http-fetcher.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                39
              ]
            ],
            "notes": [
              {
                "lines": "11-28",
                "title": "只允许 http/https，信号与超时合成",
                "body": "<p>缺 url、非 http(s) 直接抛；<code>AbortSignal.any([timeout, caller])</code> 让“30 秒超时”和“用户取消”任一触发都能中断请求与正文读取。重定向跟随，UA 伪装成普通浏览器。</p>"
              },
              {
                "lines": "29-37",
                "title": "只认 2xx，正文原样进 raw",
                "body": "<p>非 2xx 抛“抓取失败 HTTP xxx”。这里<strong>没有看 Content-Type</strong>：PDF/图片 URL 也会被 <code>res.text()</code> 当文本抓，可能乱码入库或 failed——这是已知缺口（评审 D4），不是 1.2 已完成的“非 P1 类型前置拒绝”。<code>final_url/content_type/http_status</code> 是 3.4 为 trace 补的字段。</p>"
              }
            ]
          },
          {
            "id": "html-parser",
            "file": "src/ingest/parse/html-parser.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                43
              ]
            ],
            "notes": [
              {
                "lines": "17-22",
                "title": "空 raw 先兜底；解析前先删页内锚点",
                "body": "<p>空 HTML 直接返回空正文，交给管线判“解析后无正文”。非空才建 jsdom；<code>stripPageAnchors</code> 必须在 Readability 之前跑，因为 Readability 会就地改 DOM，之后再删就来不及了。</p>"
              },
              {
                "lines": "23-32",
                "title": "标题优先 &lt;title&gt;，再 Readability",
                "body": "<p>先取 <code>doc.querySelector(\"title\")</code>（Readability 会改 doc，所以先取），再用 Readability 抽正文，最后 turndown 转 Markdown。turndown 开了 <code>codeBlockStyle: \"fenced\"</code> 和 GFM 插件，代码块与表格才不会变形。</p>"
              },
              {
                "lines": "37-42",
                "title": "页内空锚点是噪音",
                "body": "<p>文档站标题旁常有零宽字符或单个 <code>#</code> 组成的锚点链接；它们的文本不是有效正文，会在 Markdown 里变成空链接。这里按“去掉零宽字符后为空”删掉。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-chunk",
        "kicker": "10 · CHUNK",
        "title": "分块：把文章切成可检索、可回溯的块",
        "subtitle": "legacy 分块器是 WeKnora 的 TS 移植。重点看三件事：偏移、保护段、0 块。",
        "blocks": [
          {
            "id": "chunk-legacy",
            "file": "src/ingest/chunk/legacy.ts",
            "lang": "ts",
            "ranges": [
              [
                26,
                53
              ],
              [
                126,
                184
              ],
              [
                257,
                289
              ]
            ],
            "notes": [
              {
                "lines": "26-53",
                "title": "按分隔符优先级递归切",
                "body": "<p>从高优先级分隔符开始切；某一级不存在就降级到下一级。下钻只准用“剩下的低优先级分隔符”，否则同一条分隔符会无限递归。切完拼回去必须等于原文。</p>"
              },
              {
                "lines": "126-167",
                "title": "装箱 + 语义重叠",
                "body": "<p>把切分单元装箱到 <code>chunkSize</code>；交出上一块时，按语义边界（段落 &gt; 行 &gt; 句）从尾巴留一点重叠给下一块。重叠要占下一块容量，预算不够就放弃。</p>"
              },
              {
                "lines": "169-184",
                "title": "start / end 从单元反推",
                "body": "<p>一个 chunk 的 <code>start</code> 取第一个单元的起点、<code>end</code> 取最后一个单元的终点；内容由单元文本拼接。这样 <code>slice(start,end)</code> 精确等于 <code>content</code>，Story 2.3 的引用定位就压在这个不变量上。</p>"
              },
              {
                "lines": "257-276",
                "title": "输出 ChunkPlan：稠密编号 + 过滤空白",
                "body": "<p>纯空白块对 embed 没价值，先丢掉再重新编号，所以 <code>chunk_index</code> 是 0,1,2… 稠密的；offset 仍指向原文位置。整篇都是空白时返回 0 块，上层据此置 <code>failed(\"内容为空\")</code>——这正是 1.2 AC 的路径。</p>"
              }
            ]
          },
          {
            "id": "chunk-protected",
            "file": "src/ingest/chunk/protected.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                48
              ]
            ],
            "notes": [
              {
                "lines": "1-20",
                "title": "保护段：这些内容不许拦腰切断",
                "body": "<p>块级 LaTeX、Markdown 图片/链接、表格、围栏代码、行内代码都算保护段。正则带 <code>g</code> 标志逐次 <code>exec</code>，零宽匹配要手动推进 <code>lastIndex</code>，否则死循环。</p>"
              },
              {
                "lines": "22-48",
                "title": "合并互不重叠的区间",
                "body": "<p>先收集所有匹配，按起点升序（同起点取更长）排序，再丢掉与上一个区间交叠的。最终得到一组互不重叠的 <code>Span</code>，装箱时整段保留、段间才切细。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-embed-write",
        "kicker": "11 · EMBED / WRITE",
        "title": "向量化与落库：不留下“ready 但缺向量”",
        "subtitle": "这是 AC 里最硬的一条。答案分两半：先算齐，再同事务写。",
        "blocks": [
          {
            "id": "embed-chunks",
            "file": "src/adapter/model/embed-chunks.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                29
              ]
            ],
            "notes": [
              {
                "lines": "1-14",
                "title": "embedMany：SDK 负责拆批与保序",
                "badge": "2.x",
                "body": "<p>1.2 时这里是自己发 Ollama <code>/v1/embeddings</code> 的 embedder；2.x 换成 AI SDK 的 <code>embedMany</code>。句柄自报 <code>maxEmbeddingsPerCall</code>，SDK 自动拆批，返回顺序与条数同入参。30 秒超时仍是入库自己的策略。</p>"
              },
              {
                "lines": "16-28",
                "title": "取消信号、截维与 telemetry",
                "badge": "3.4",
                "body": "<p><code>AbortSignal.any</code> 把调用方信号与 30s 超时合成；<code>dimensions</code> 走 MRL 截维（当前 1024）；<code>telemetry: false</code> 是 3.4 加的，避免入库向量在 Langfuse 里另起 trace，阶段耗时改由本地 <code>trace_stages</code> 记录。</p>"
              }
            ]
          },
          {
            "id": "repo-chunk",
            "file": "src/adapter/repo/chunk.ts",
            "lang": "ts",
            "ranges": [
              [
                78,
                148
              ]
            ],
            "notes": [
              {
                "lines": "78-87",
                "title": "空数组直接返回；否则开事务",
                "body": "<p>0 个 chunk 不写库、返回 0；上游已经把 0 块判成失败。有内容才 <code>BEGIN</code>，后面所有 SQL 共用同一条连接。</p>"
              },
              {
                "lines": "89-95",
                "title": "先确认资源还在",
                "badge": "1.4",
                "body": "<p>写入前查 <code>resources</code> 且要求 <code>deleted_at IS NULL</code>；查不到就抛 <code>E_RESOURCE_GONE</code>。1.4 的软删可能发生在 embed 之后，这个守卫保证不给已删资源补写 chunk。</p>"
              },
              {
                "lines": "96-112",
                "title": "批量插 chunk，拿回 index→id",
                "body": "<p>一条多行 <code>INSERT</code> 写入全部 chunk，<code>RETURNING id, chunk_index</code> 建映射。<code>chunk_index</code> 是向量配对的键：向量数组第 k 个必须对应 <code>chunk_index === k</code> 的那块。</p>"
              },
              {
                "lines": "114-128",
                "title": "批量插向量：halfvec + 实际维度",
                "body": "<p>用上面拿到的 chunk id 作 <code>source_id</code>；<code>dimension</code> 记 <code>v.dimension</code>（实际长度），<code>model</code> 记 <code>embedding.modelId</code>，向量转成 <code>[...]</code> 字面量并 <code>::halfvec</code>。FK 是 <code>source_id → chunks.id ON DELETE CASCADE</code>，删 chunk 会带走向量。</p>"
              },
              {
                "lines": "130-139",
                "title": "ready 也在同一事务里",
                "badge": "1.4",
                "body": "<p>这是 1.2 评审 P3 的修法：<code>UPDATE resources SET status = \"ready\"</code> 放在 <code>COMMIT</code> 之前，避免“向量已落、行还 processing”被下次启动清扫误删。<code>AND deleted_at IS NULL</code> 是 1.4 加的写守卫：写入期间被软删则 <code>rowCount = 0</code>，整笔回滚。</p>"
              },
              {
                "lines": "140-147",
                "title": "回滚，但别用回滚错顶掉真因",
                "body": "<p><code>ROLLBACK</code> 自己失败只记 <code>E_ROLLBACK</code> 日志，仍抛出原始错误；否则调用方会看到“回滚失败”而丢掉真正的失败原因。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-repo-registry",
        "kicker": "12 · REPO / REGISTRY",
        "title": "资源行与策略注册表",
        "subtitle": "最后两块拼图：行级 SQL 和名字兑换。",
        "blocks": [
          {
            "id": "repo-resource",
            "file": "src/adapter/repo/resource.ts",
            "lang": "ts",
            "ranges": [
              [
                71,
                112
              ]
            ],
            "notes": [
              {
                "lines": "71-79",
                "title": "查重只认 ready / processing",
                "body": "<p><code>status IN (\"ready\",\"processing\") AND deleted_at IS NULL</code>。failed 同 URL 不拦，所以用户可以在失败后重试；软删的行也不算“存在”。这是幂等拒绝策略的数据库侧。</p>"
              },
              {
                "lines": "81-93",
                "title": "建行：默认 processing",
                "body": "<p><code>status</code> 不传就 <code>processing</code>；<code>RETURNING *</code> 把数据库生成的 id/时间戳带回来，后续 fail/update 都用这个 id。</p>"
              },
              {
                "lines": "95-105",
                "title": "改状态：带原因，且不碰已删行",
                "badge": "1.4",
                "body": "<p><code>error_reason</code> 由 <code>Reason</code> 写入；<code>deleted_at IS NULL</code> 是 1.4 补的，防止用户删完后 fail 还把已删行改来改去。失败时 <code>Reason</code> 就是前端看到的“解析后无正文 / 内容为空 / embedding_error”。</p>"
              },
              {
                "lines": "107-112",
                "title": "改标题：同样只改活行",
                "badge": "1.4",
                "body": "<p>标题回填走这条 SQL；1.4 之后同样带 <code>deleted_at IS NULL</code>。它不影响 chunk/向量，只影响列表与 201 返回的标题。</p>"
              }
            ]
          },
          {
            "id": "recipes",
            "file": "src/ingest/recipes.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                39
              ]
            ],
            "notes": [
              {
                "lines": "1-15",
                "title": "纯目录：名字 → 构造函数",
                "body": "<p>注册表不做来源判断，查无返回 <code>undefined</code>，由工厂统一抛 <code>E_UNKNOWN_STAGE</code>。这样加一种来源 = 在路由选名字，而不是在工厂里加 if。</p>"
              },
              {
                "lines": "17-34",
                "title": "三张表：http/html/legacy",
                "badge": "1.3",
                "body": "<p><code>http</code>、<code>html</code>、<code>legacy</code> 是 1.2 的 URL 链；<code>passthrough</code>、<code>text</code> 是 1.3 的文本分支。embed 不在表里（2.x 改成装配层的句柄）。</p>"
              },
              {
                "lines": "36-38",
                "title": "Object.hasOwn：原型链名字不算命中",
                "body": "<p>用 <code>Object.hasOwn</code> 而不是直接下标，<code>\"toString\"</code>/<code>\"constructor\"</code> 这类原型链上的名字会被判为查无，返回 400 <code>E_UNKNOWN_STAGE</code>，不会掉进通用 422。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\"><section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">13 · DECISIONS &amp; PITFALLS</span>\n    <h2>关键取舍与踩过的坑</h2>\n    <p class=\"section-sub\">这些是“为什么长这样”的原因。否掉的方案也写出来，避免下一轮重新发明。</p>\n  </header><details class=\"fold\"><summary>展开全部取舍与踩坑</summary>\n\n  <div class=\"choice-grid\">\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-01</span>\n      <h3>工厂模型，而不是一个 runIngest</h3>\n      <p>旧的 <code>orchestration/ingest.ts</code> 用一个大函数串所有段，来源分支和 stage 构造混在一起。build3 换成 Recipe→Factory→run/batch：工厂只兑换名字，来源→策略名的判断留在路由。代价是多一层类型与注册表，收益是 1.3 只换名字就能复用整条链。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-02</span>\n      <h3>先建 processing 行，再抓取</h3>\n      <p>如果抓完才建行，fetch 失败就没有 Resource 可留痕，违背 AC“已进入入库后才失败 → 创建失败 Resource”。先建行的代价是：processing 行在 fetch 前就存在，需要启动清扫兜底（1.1）和取消/写守卫（1.4）。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-03</span>\n      <h3>幂等 = 拒绝，且只拦 ready/processing</h3>\n      <p>同 URL 已有活跃资源 → 409 <code>E_DUPLICATE</code>，不建行；failed 允许重抓。没有数据库唯一索引，查重与建行之间有 TOCTOU 窗口（双击/并发可能双建），Lynx 2026-10-13 已定 P1 不加索引，接受该风险；这条不能写成“完全幂等”。<code>uri.canonicalize()</code> 尚未落地，当前按原文 URL 相等判重（epics.md 2026-10-24 对账）。<code>uri.canonicalize()</code> 尚未落地，当前按原文 URL 相等判重（epics.md 2026-10-24 对账）。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-04</span>\n      <h3>标题：用户 &gt; parse &gt; 域名占位</h3>\n      <p>建 processing 时还没有 parse 结果，只能先用 hostname；parse 成功后若用户没给标题且标题不同，再回填。这样列表里不会长时间显示“未命名”，201 返回的也是真标题。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-05</span>\n      <h3>“空正文”与“0 块”是两条失败</h3>\n      <p>parse 后 trim 为空 → <code>解析后无正文</code>；正文非空但分块器过滤掉所有空白块 → <code>内容为空</code>。两者都不进入 ready，但原因不同，排查时能区分是抓取/解析问题还是分块问题。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-06</span>\n      <h3>ready 放进写入事务</h3>\n      <p>1.2 评审 P3 发现：先提交 chunk/向量、再单独改 ready，若第二步失败，下次启动清扫会把已成功的入库删掉。修法是把 <code>UPDATE status='ready'</code> 放进 <code>writeChunksWithEmbeddings</code> 的同一事务，端口注释写清“这个方法会一起转 ready”。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-07</span>\n      <h3>Signal 只喂长操作</h3>\n      <p>fetch/embed 吃信号；<code>fail()</code> 改状态绝不复用同一个信号，否则取消时连“失败留痕”都被中断，行会卡在 processing。1.2 只留入口；1.4 才把 controller 登记到进程级 Map，并补写入后的取消复查。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">D-08</span>\n      <h3>warning 只提示，不阻断</h3>\n      <p>“原页 ≥2000、正文 &lt;200”是启发式，不是可靠判定；命中仍写 ready，只在 201 body 带 <code>warning</code>。这符合 AC“提示可能抓不全、不阻断其他入库”。1.2 收口时前端还没展示，用户暂时看不到；当前 <code>ingest-panel.tsx</code> 已在结果行与 notice 里显示这句提示。</p>\n    </div>\n  </div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>commit 标题会骗人：</strong><code>a8a18d8</code> 写 “story 1-3 dev1”，实际把 1.2 build3 的工厂重构、URL 分支、幂等、warning 一起提交了；同批还带了 1.4 的 in-flight 雏形。判断归属要看 handoff/AC/diff，不要按标题切界。</li>\n    <li><strong>非 HTML 类型没有前置拒绝：</strong>评审 D4 指出 PDF/图片 URL 仍会建行并被 <code>res.text()</code> 当文本抓。它已转成 1.2 收口后的非阻塞后续，不在本页写成已完成。</li>\n    <li><strong>幂等不是数据库级：</strong>没有 partial unique 索引，<code>findActiveBySource</code> 与 <code>createResource</code> 之间是 TOCTOU。Lynx 已拍 P1 接受；要收这条得加索引并把 23505 映射成 409。</li>\n    <li><strong>warning 展示已补齐：</strong>1.2 收口时只有 201 body；当前 <code>ingest-panel.tsx</code> 已在结果行与 notice 里显示 <code>accepted.warning</code>。</li>\n    <li><strong>测试有几处空窗：</strong>HTTP 边界只有 2026-10-13 的人工冒烟，没有自动测试（P4）；<code>embeddings</code> 表、标题回填、失败原因串只被 <code>peek</code> 没有断言（P5）；<code>legacy.test.ts</code> 被 vitest 排除（W1）；<code>test/</code> 还被 <code>.gitignore</code> 忽略（D6）。</li>\n    <li><strong>向量维度没和模型声明比对：</strong>写库时 <code>dimension</code> 取 <code>v.length</code>，从不与 <code>embedding.dimensions</code> 比对；若兼容层返回 4096 维，会写成 ready 的异维行，之后检索混维。已记入 deferred-work。</li>\n    <li><strong>当前工作区不是收口快照：</strong>uncommitted 的 Epic 3 改动改了 <code>ingest.ts</code>/<code>resources.ts</code>/<code>chunk.ts</code> 的行号与部分行为（trace sink、stats、分页）。本页行号按 2026-10-24 工作区；若这些改动提交，需要同一次改动里重新生成走读页。</li>\n    <li><strong>模板品牌硬编码：</strong>skill 的 template 写死 “Epic 3 · Walkthrough”，本页构建后做了文本替换；重建时需重复同一步，否则侧栏品牌会退回 Epic 3。</li>\n  </ul>\n</section></details></section>\n\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">14 · VERIFICATION</span>\n    <h2>怎么验证：命令、预期结果与证据强度</h2>\n    <p class=\"section-sub\">命令可复制；结果为历史记录或代码路径，不冒充本轮真跑。</p>\n  </header>\n\n  <p class=\"test-note\">历史证据：2026-10-13 评审 + 2026-10-20 对账；详见 handoff / 评审。</p>\n\n  <h3 class=\"block-title\">A. 起服务与健康检查</h3>\n  <pre class=\"snippet\"><code>cd app/server\nnpm run dev\n# 另一个终端\ncurl -s http://127.0.0.1:3000/health</code></pre>\n  <p class=\"test-note\">服务只监听 <code>127.0.0.1:3000</code>；<code>.env</code> 需要 DATABASE_URL / OLLAMA_BASE_URL / EMBEDDING_MODEL / EMBEDDING_DIMENSIONS。健康检查应返回 200 且 db、ollama 为 ok。</p>\n\n  <h3 class=\"block-title\">B. 提交一个真实 URL</h3>\n  <pre class=\"snippet\"><code>curl -s -X POST http://127.0.0.1:3000/resources \\\\\n  -H 'Content-Type: application/json' \\\\\n  -d '{\"url\":\"https://weknora.weixin.qq.com/docs/01-getting-started/03-quickstart.html\"}'</code></pre>\n  <p class=\"test-note\">预期 201，body 形如 <code>{\"resource\":{\"status\":\"ready\",...},\"chunk_count\":16}</code>（历史记录为 16，页面内容变化时块数会变）。如果该 URL 已在库且是 ready/processing，会得到 409 <code>E_DUPLICATE</code>；换一个未入库的 URL，或先按 1.4 的 DELETE 软删旧资源。POST 是同步的，返回时已经 ready/failed，不需要轮询。</p>\n\n  <h3 class=\"block-title\">C. 查 resources / chunks / embeddings</h3>\n  <pre class=\"snippet\"><code># 先在当前 shell 导入 app/server/.env 里的 DATABASE_URL\npsql \"$DATABASE_URL\" -c \"\nSELECT id, status, title, error_reason\nFROM resources\nWHERE source = 'https://weknora.weixin.qq.com/docs/01-getting-started/03-quickstart.html'\nORDER BY created_at DESC LIMIT 1;\"</code></pre>\n  <pre class=\"snippet\"><code>psql \"$DATABASE_URL\" -c \"\nSELECT chunk_index, start_offset, end_offset, length(content), left(content, 60)\nFROM chunks\nWHERE resource_id = '&lt;上一步的 id&gt;'\nORDER BY chunk_index;\"</code></pre>\n  <pre class=\"snippet\"><code>psql \"$DATABASE_URL\" -c \"\nSELECT e.dimension, e.model, count(*) AS vectors\nFROM embeddings e\nJOIN chunks c ON c.id = e.source_id\nWHERE c.resource_id = '&lt;上一步的 id&gt;'\nGROUP BY e.dimension, e.model;\"</code></pre>\n  <p class=\"test-note\">预期：resources 一行 ready；chunks 的 <code>chunk_index</code> 从 0 连续；embeddings 每个 chunk 一行，<code>dimension=1024</code>、<code>model=qwenembed</code>（或当前 EMBEDDING_MODEL）。如果 embeddings 行数少于 chunks，说明违反了本 story 的核心不变量。</p>\n\n  <h3 class=\"block-title\">D. 空正文 / 抓取失败 / embed 失败</h3>\n  <pre class=\"snippet\"><code># 空正文：本地起一个只有壳的 HTML，再提交\nprintf '&lt;html&gt;&lt;head&gt;&lt;title&gt;空页&lt;/title&gt;&lt;/head&gt;&lt;body&gt;&lt;/body&gt;&lt;/html&gt;' &gt; /tmp/empty.html\npython3 -m http.server 8099 --directory /tmp\ncurl -s -X POST http://127.0.0.1:3000/resources \\\\\n  -H 'Content-Type: application/json' \\\\\n  -d '{\"url\":\"http://127.0.0.1:8099/empty.html\"}'</code></pre>\n  <p class=\"test-note\">预期 422，<code>message</code> 为“解析后无正文”，且库里留下一条 <code>failed</code> 行；不是 400，也不是静默 ready。</p>\n  <pre class=\"snippet\"><code># 抓取失败：连接一个没有服务监听的端口\ncurl -s -X POST http://127.0.0.1:3000/resources \\\\\n  -H 'Content-Type: application/json' \\\\\n  -d '{\"url\":\"http://127.0.0.1:9/nope\"}'</code></pre>\n  <p class=\"test-note\">预期 422，库里一条 <code>failed</code> 行（reason 通常是“入库失败”，cause 在服务端日志里）。这条是“建行后失败”的路径，证明失败不会留下 processing。</p>\n  <pre class=\"snippet\"><code># embed 失败（可选，未真跑）：先停掉 Ollama 或把 OLLAMA_BASE_URL 指到不可达地址，\n# 重启服务后提交一个未入库的 URL。\n# 预期 422 + failed(embedding_error)，chunks 与 embeddings 均为 0。</code></pre>\n  <p class=\"test-note\">1.2 收口时没有为 embed 失败落自动化用例；这里只给手工验证思路，不宣称已执行。恢复 Ollama 后记得把 env 改回来。</p>\n\n  <h3 class=\"block-title\">E. 测试与类型检查</h3>\n  <pre class=\"snippet\"><code>cd app/server\nnpx vitest run test/ingest-factory.test.ts   # 历史记录：6 passed\nnpx vitest run test/http-html-parser.test.ts # 历史记录：2 passed\nnpx vitest run                               # 2026-10-20 记录：25 passed\nnpx tsc --noEmit                             # 2026-10-13 记录：EXIT=0</code></pre>\n  <p class=\"test-note\">这些命令本轮<strong>没有重跑</strong>；当前工作区有未提交 Epic 3 改动，结果可能与历史记录不同。测试要读真实 <code>.env</code>、真库、真 Ollama、真 URL；离线或服务不可达会失败，这是项目接受的集成测试代价。</p>\n\n  <div class=\"callout strong\">\n    <strong>本轮唯一真跑的验证：</strong><code>node .qoder/skills/story-walkthrough/scripts/build.mjs …</code> 与 <code>node .qoder/skills/story-walkthrough/scripts/validate.mjs …</code>。结果写在 <code>_Agents/walkthroughs/.runs/epic1-story2/validation.txt</code> 与 <code>.memlog.md</code>；静态校验不等于浏览器观感，页面观感由 Lynx 手测。\n  </div>\n</section>\n\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">15 · CONTINUITY</span>\n    <h2>下一步</h2>\n    <p class=\"section-sub\">这条链之后谁接。</p>\n  </header>\n  <div class=\"next-box\">\n    <p><strong>1.3</strong> 复用这条管线导入文本；<strong>1.4</strong> 接取消与软删；<strong>2.x</strong> 用 chunks / embeddings 做检索。</p>\n    <div class=\"next-links\"><a href=\"epic1-story3-text-ingest.html\">1.3 文本入库</a><a href=\"epic1-story4-resource-delete.html\">1.4 删除</a><a href=\"epic2-story1-hybrid-retrieval.html\">2.1 检索</a></div>\n  </div>\n</section>\n\n<footer class=\"footer\">\n  Story 1.2 walkthrough · 生成于 2026-10-24 · 代码来自当前工作区（含未提交 Epic 3 改动）· 配置与校验记录在 <code>_Agents/walkthroughs/.runs/epic1-story2/</code>。历史真跑数据来自 build1/build2/build3 handoff、2026-10-13 build3 评审与 2026-10-20 对账记录；本轮未重跑服务或测试。\n</footer>\n"
    }
  ]
}
