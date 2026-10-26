export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic1-story3-text-ingest.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 1 · Story 1.3 文本入库 · 带代码逐行讲解",
  "tocTitle": "Story 1.3",
  "tocSub": "Markdown / 纯文本导入 · 带代码逐行讲解",
  "accent": "#4d7c0f",
  "accent2": "#3f6212",
  "accentDark": "#bef264",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>Knowledge Copilot</span><span>·</span><span>Epic 1</span><span>·</span><span>Story 1.3</span><span>·</span><span>2026-10-13 收口 / 2026-10-24 走读</span></div>\n  <h1>Story 1.3：把 Markdown / 纯文本<em>塞进同一条管线</em></h1>\n  <p class=\"hero-sub\">1.3 的后端主链不是这一格新写的：<code>parse → chunk → embed → 写</code> 由 1.2 build3 交付。这一格真正交出去的是 <strong>content 分支复用</strong>、<strong>两条内容拒绝口径</strong>、<strong>前端粘贴 / 文件导入接线</strong>，以及<strong>三条明确取舍</strong>。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>1.3</strong> done · 2026-10-13</span>\n    <span class=\"chip\">后端 0 新增主链</span>\n    <span class=\"chip\">content 分支</span>\n    <span class=\"chip\">3 条取舍</span>\n    <span class=\"chip\">约 20 分钟</span>\n  </div>\n  <div class=\"trace-pill\"><b>POST /resources {content, content_type}</b><span>passthrough → text → chunk → embed → write；拒绝发生在建 Resource 行之前</span></div>\n</header>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\"><span class=\"kicker\">TL;DR</span><h2>先给结论：1.3 没写第二条管线</h2><p class=\"section-sub\">它把 1.2 build3 已经存在的 content 分支确认为正式路径，补上拒绝口径和前端入口。</p></header>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01</span><h3>复用</h3><p>粘贴/文件导入<strong>跳过网络抓取</strong>，但仍走 <code>fetch → parse → chunk → embed → write</code>：第一段换成零 I/O 的 <code>PassthroughFetcher</code>，第二段换成 <code>TextParser</code>，后三段与 URL 入库完全同一套代码。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02</span><h3>两条内容拒绝</h3><p>只在<strong>建 <code>resources</code> 行之前</strong>拒绝：body 解析失败或顶层不是对象 → <code>E_BAD_JSON</code>；<code>content</code> 是空白串 → <code>E_EMPTY_CONTENT</code>。内容质量的“不可读/编码异常”不在这里判。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03</span><h3>前端接线</h3><p>粘贴时用户自选 <code>markdown</code> / <code>plaintext</code>；选文件按后缀决定类型，<code>accept</code> 只收 <code>.md / .markdown / .txt</code>。后端只收到字符串，不猜类型。</p></article>\n  </div>\n  <div class=\"callout strong\"><strong>一句话：</strong>1.3 的成果是“把已有 content 分支讲清楚、守住入口”，不是“新写了一条文本入库管线”。</div>\n\n  <table class=\"file-table\">\n    <thead><tr><th>这格交付（1.3）</th><th>不归这格（谁交的）</th></tr></thead>\n    <tbody>\n      <tr><td>content 分支的复用语义：<code>passthrough</code> fetcher + <code>text</code> parser + 后三段共用</td><td>管线工厂、<code>chunk</code> / <code>embed</code> / 写库主链、标题回填（<span class=\"badge b-now\">1.2 b3</span>）</td></tr>\n      <tr><td><code>E_BAD_JSON</code> / <code>E_EMPTY_CONTENT</code> 两条<strong>内容</strong>拒绝，且都在建行前</td><td>取消、abort、软删、写入守卫（<span class=\"badge b-now\">1.4</span>）</td></tr>\n      <tr><td>前端粘贴 / 文件导入接线，<code>content_type</code> 自选与后缀判断</td><td>检索、问答、引用（<span class=\"badge b-now\">2.x</span>）</td></tr>\n      <tr><td>三条取舍：共用 parse 分支、不做不可读启发式、粘贴不去重</td><td>五段 trace + <code>resource_id</code> 回填（<span class=\"badge b-34\">3.4</span>，当前未提交）</td></tr>\n      <tr><td><code>content_type</code> 只存档 / 预留，不改变处理路径</td><td>tsyringe DI 改造（<span class=\"badge b-now\">2.x 附带一刀</span>）</td></tr>\n      <tr><td>—</td><td>当前入库页的队列化 / 视觉改造（<span class=\"badge b-now\">前端后续</span>）</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\"><strong>读 commit 的正确姿势：</strong><code>a8a18d8</code> 标题写的是 <code>story 1-3 dev1</code>，但 <code>show --stat</code> 是 21 个文件、+789/−377：新增 159 行的 <code>pipelines.ts</code>、46 行的 <code>qwenembed.ts</code>，删掉旧的 <code>orchestration/ingest.ts</code> 与 <code>resources-text.ts</code>。这些是 <strong>1.2 build3 的管线重构</strong>，不能算成 1.3 的成果。同理，<code>cf71c87</code> 标题是 <code>story 1-3</code>，但 63 个文件、+4003/−659 主要是一次性前端骨架；1.3 只认其中的 <code>api.ts</code> 入库函数与 <code>ingest-panel</code> 的粘贴 / 文件接线。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 03</span>\n    <h2>一眼看懂：两路来源汇入同一管线</h2>\n    <p class=\"section-sub\">URL 与粘贴文本从不同入口进来，后半条链完全共用。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>2</strong>类来源</span><span class=\"chip\"><strong>1</strong>条 parse 分支</span><span class=\"chip\"><strong>2</strong>个拒绝码</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic1-story3-text-ingest.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 1.3 两路来源汇入同一管线\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:1212 / 800;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic1-story3-text-ingest.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>paste/file 的 content_type 由前端判定；后端只收到字符串，不猜内容质量。</li><li>body 非 JSON 对象与空白 content 在创建 Resource 之前拒绝。</li><li>markdown/plaintext 共用 TextParser；粘贴不去重，content_type 只存档。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画 URL 分支的抓取细节；那是 1.2 的链路。</div>\n</section>\n\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"map\">\n  <header class=\"section-head\"><span class=\"kicker\">MAP</span><h2>全局地图：两路来源，后半条链共用</h2><p class=\"section-sub\">URL 与粘贴只在 <code>fetcher</code> / <code>parser</code> 两个位置分叉；chunk、embed、写库完全同一条路。</p></header>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01</span><h3>入口：POST /resources</h3><p>先判 body 与 <code>url</code> / <code>content</code> 二选一；content 分支再验 <code>content_type ∈ {markdown, plaintext}</code>。所有拒绝都发生在建行前。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02</span><h3>管线：五个 stage</h3><p><code>passthrough</code> 不发网络 → <code>text</code> 原样交正文 → <code>legacy</code> 分块（保护代码块/表格）→ embedding 句柄产向量 → 同一事务写 chunk + 向量。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03</span><h3>落库：行 + 块 + 向量</h3><p><code>resources</code> 一行（<code>processing → ready</code>），<code>chunks</code> 与 <code>embeddings</code> 成对写入；201 返回 <code>resource</code>、<code>chunk_count</code>，可能有 <code>warning</code>。</p></article>\n  </div>\n\n  <table class=\"file-table\">\n    <thead><tr><th>阶段</th><th>URL 入库</th><th>粘贴 / 文件入库</th><th>说明</th></tr></thead>\n    <tbody>\n      <tr><td><code>fetch</code></td><td><code>http</code></td><td><code>passthrough</code></td><td>后者不碰网络，只把 <code>ctx.data.content</code> 塞进 <code>ctx.fetched.raw</code></td></tr>\n      <tr><td><code>parse</code></td><td><code>html</code></td><td><code>text</code></td><td>text 不做 Markdown 语法解析；Markdown 的代码块/表格由分块器的保护段兜住</td></tr>\n      <tr><td><code>chunk</code></td><td><code>legacy</code></td><td><code>legacy</code></td><td>同一套分隔符、保护段、重叠策略</td></tr>\n      <tr><td><code>embed</code></td><td>同一句柄</td><td>同一句柄</td><td>模型/维度由装配层选定，入库与检索共用</td></tr>\n      <tr><td><code>write</code></td><td>同一事务</td><td>同一事务</td><td>chunk 与向量同成同败，不会出现“ready 但缺向量”</td></tr>\n      <tr><td>去重</td><td><code>findActiveBySource(url)</code></td><td><strong>不去重</strong></td><td>同一段粘两次 = 两条 Resource</td></tr>\n      <tr><td>行标识</td><td><code>source = url</code></td><td><code>source = null</code> + <code>urn:kc:paste:&lt;uuid&gt;</code></td><td>无来源内容的 <code>data_uri</code> 自动生成；展示语义属 FR-11</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\"><strong>“跳过 fetch”到底跳过什么：</strong>跳过的是<strong>网络抓取</strong>，不是 fetch 这一段。代码仍然调用 <code>PassthroughFetcher</code>，这样 stage 顺序、<code>ctx</code> 形状、后续解析都不需要为“粘贴”写特例。</div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\"><span class=\"kicker\">GLOSSARY</span><h2>小白词典</h2><p class=\"section-sub\">第一次读这套代码，先把这几个词对齐。</p></header>\n  <dl class=\"glossary\">\n    <div class=\"gloss\"><dt>Markdown / plaintext</dt><dd>两种纯文本。P1 的处理路径完全相同；区别只在 <code>resources.content_type</code> 这个存档字段。</dd></div>\n    <div class=\"gloss\"><dt>passthrough（直通）</dt><dd>一个不发请求的 Fetcher：把请求体里的正文原样放进 <code>ctx.fetched</code>，假装“抓取”已经完成。</dd></div>\n    <div class=\"gloss\"><dt>parse（解析）</dt><dd>把抓取结果变成 <code>{ title, text }</code>。HTML 走 HtmlParser；纯文本走 TextParser，正文不改。</dd></div>\n    <div class=\"gloss\"><dt>chunk（分块）</dt><dd>把长正文切成可检索的小块，并记录 <code>start_offset</code> / <code>end_offset</code>；代码块、表格等保护段优先整块保留（超过 7500 字符的极端块仍会被强切）。</dd></div>\n    <div class=\"gloss\"><dt>embed（向量化）</dt><dd>把每块正文交给 embedding 模型，得到一串数字向量；检索时用同一模型算提问向量。</dd></div>\n    <div class=\"gloss\"><dt>Resource / processing / ready / failed</dt><dd>一条入库记录。建行时是 <code>processing</code>，写完后变 <code>ready</code>；建行后失败则变 <code>failed</code> 并带原因。</dd></div>\n    <div class=\"gloss\"><dt>data_uri</dt><dd>内容来源标识。URL 入库直接用 URL；粘贴内容生成 <code>urn:kc:paste:&lt;uuid&gt;</code>，避免把整段正文塞进标识字段。</dd></div>\n    <div class=\"gloss\"><dt>E_BAD_JSON / E_EMPTY_CONTENT</dt><dd>两条内容拒绝码：请求体不是合法 JSON 对象；<code>content</code> 是空白串。两者都不创建 Resource 行。</dd></div>\n    <div class=\"gloss\"><dt>accept</dt><dd>文件选择框的过滤属性。它只是前端提示，不是安全边界；后端仍然只按“收到的是不是字符串”判断。</dd></div>\n  </dl>\n</section>\n"
    },
    {
      "type": "journey",
      "id": "journey",
      "kicker": "WALK",
      "title": "一次粘贴的旅行",
      "subtitle": "从选文件/粘贴到 201，按顺序点；每一步都落在真实代码行上。",
      "steps": [
        {
          "goto": "panel-file:283-286",
          "title": "前端读到文本",
          "note": "文件按后缀定类型；粘贴则由用户自选",
          "code": "panel L283–286"
        },
        {
          "goto": "client-ingest:663-668",
          "title": "发出 content 分支请求",
          "note": "body 里只有 content / content_type / 可选 title",
          "code": "client L663–668"
        },
        {
          "goto": "route-post:147-152",
          "title": "先过 JSON 关",
          "note": "非法 JSON 或顶层不是对象 → E_BAD_JSON",
          "code": "route L147–152"
        },
        {
          "goto": "route-post:155-162",
          "title": "url 与 content 二选一",
          "note": "空白 content → E_EMPTY_CONTENT；两者都给 → E_AMBIGUOUS_INPUT",
          "code": "route L155–162"
        },
        {
          "goto": "route-post:186-191",
          "title": "选定 content 分支",
          "note": "只验 content_type；recipe 用 passthrough + text",
          "code": "route L186–191"
        },
        {
          "goto": "ingest-create:64-70",
          "title": "建 processing 行",
          "note": "占位标题 + source=null + uuid urn",
          "code": "ingest L64–70"
        },
        {
          "goto": "passthrough-file:11-16",
          "title": "直通 fetch",
          "note": "不发网络，把正文塞进 ctx.fetched.raw",
          "code": "passthrough L11–16"
        },
        {
          "goto": "text-parser-file:11-15",
          "title": "parse 与标题",
          "note": "正文原样保留；标题按“用户 > H1 > 首个非空行 > 兜底”",
          "code": "text-parser L11–15"
        },
        {
          "goto": "ingest-chain:128-139",
          "title": "chunk",
          "note": "同一 legacy 分块器；0 块则建行后失败",
          "code": "ingest L128–139"
        },
        {
          "goto": "ingest-write:156-166",
          "title": "embed + 写库",
          "note": "chunk 与向量同一事务；写完把行转 ready",
          "code": "ingest L156–166"
        },
        {
          "goto": "route-post:204-210",
          "title": "返回 201",
          "note": "带 resource 与 chunk_count；失败才走 409 / 422",
          "code": "route L204–210"
        }
      ],
      "hint": "带 <span class=\"badge b-now\">1.2 b3</span> / <span class=\"badge b-34\">3.4</span> 的段是后来 story 改的，不是 1.3 新写的；每一步的 badge 写在对应代码讲解里。"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"files\">\n  <header class=\"section-head\"><span class=\"kicker\">FILES</span><h2>文件地图：读这一页要打开的 9 个文件</h2><p class=\"section-sub\">按请求顺序排；先读入口，再读 stage，最后读前端。</p></header>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>在这条链里的角色</th><th>归属</th></tr></thead>\n    <tbody>\n      <tr><td><code>app/server/src/routes/resources.ts</code></td><td>POST 的 body 校验、url/content 二选一、content_type 校验、调 Ingest</td><td><span class=\"badge b-now\">1.3</span> 语义；DI / trace 行后来改过</td></tr>\n      <tr><td><code>app/server/src/ingest/fetch/passthrough.ts</code></td><td>零 I/O 的 fetch 替身，把正文放进 <code>ctx.fetched</code></td><td><span class=\"badge b-now\">1.2 b3</span>；<span class=\"badge b-34\">3.4</span> 加元数据</td></tr>\n      <tr><td><code>app/server/src/ingest/parse/text-parser.ts</code></td><td>markdown / plaintext 共用；正文不改，只定标题</td><td><span class=\"badge b-now\">1.2 b3</span></td></tr>\n      <tr><td><code>app/server/src/ingest/recipes.ts</code></td><td>策略名 → 实例的目录（<code>passthrough</code> / <code>text</code> / <code>legacy</code>）</td><td><span class=\"badge b-now\">1.2 b3</span></td></tr>\n      <tr><td><code>app/server/src/ingest/contracts.ts</code></td><td><code>KBData</code> / <code>IngestContext</code>：stage 之间只传数据，不传行为</td><td><span class=\"badge b-now\">1.3</span> 字段；<span class=\"badge b-34\">3.4</span> sink 选项</td></tr>\n      <tr><td><code>app/server/src/ingest/ingest.ts</code></td><td>建行、去重、五个 stage、失败留痕、写库转 ready</td><td><span class=\"badge b-now\">1.2 b3</span>；<span class=\"badge b-now\">1.4</span> 取消；<span class=\"badge b-34\">3.4</span> stage</td></tr>\n      <tr><td><code>app/web/src/api/client.ts</code></td><td><code>ingestContent</code> / <code>ingestUrl</code>：唯一发 POST 的地方</td><td><span class=\"badge b-now\">1.3</span></td></tr>\n      <tr><td><code>app/web/src/components/ingest-panel/ingest-panel.tsx</code></td><td>粘贴框、文件选择、content_type 分段控件、提交</td><td><span class=\"badge b-now\">1.3</span> 语义；<span class=\"badge b-now\">前端后续</span> 视觉 / 队列</td></tr>\n      <tr><td><code>app/web/src/routes/ingest.tsx</code></td><td>当前 <code>/ingest</code> 页面，挂载 IngestPanel 并刷新最近入库</td><td><span class=\"badge b-now\">前端后续</span>（1.3 时在 <code>src/ui/knowledge.tsx</code>）</td></tr>\n    </tbody>\n  </table>\n  <p class=\"table-note\">页面顺序不是字母序：先看请求怎么被接受，再看内容怎么变成块，最后看前端怎么把这两种文本送进来。</p>\n</section>\n"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "CODE",
        "title": "代码与逐行讲解",
        "subtitle": "所有代码块都来自当前工作区；行号是 2026-10-24 读到的真实行号。带 badge 的段是后来 story 的改动，别算进 1.3。",
        "body": "<div class=\"callout\"><strong>先看边界：</strong>当前工作区有 Epic 3 未提交改动（<span class=\"badge b-34\">3.4</span> 的 stage / trace、<code>/stats</code>、分页）。它们和 1.3 的 content 分支混在同一批文件里，所以每个相关代码块都标了 badge；没有 badge 的行才是 1.2 build3 或 1.3 的原文。</div>",
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
                "lines": "144-152",
                "title": "① 先过 JSON 关",
                "badge": "1.3",
                "body": "<p><code>c.req.json()</code> 解析失败（坏 JSON、空 body）直接 400 <code>E_BAD_JSON</code>；解析出来是 <code>null</code> 或原始值也一样。到这一步还<strong>没有创建任何 Resource 行</strong>，所以不会留下垃圾记录。</p><p>注意：数组能通过 <code>typeof body === \"object\"</code>，随后因为 url/content 都不存在落到 <code>E_AMBIGUOUS_INPUT</code>，不是 <code>E_BAD_JSON</code>。这是实现细节，不是 1.3 AC 的主路径。</p>"
              },
              {
                "lines": "155-166",
                "title": "② url 与 content 恰好给一个",
                "badge": "1.3",
                "body": "<p><code>givenContent</code> 先记住“content 字段到底有没有出现”，再判断它是不是空白。这样 <code>{\"content\":\"   \"}</code> 能得到 <code>E_EMPTY_CONTENT</code>（内容无效），而不是 <code>E_AMBIGUOUS_INPUT</code>（没说清用哪条路）。</p><p>两者都非空 → <code>E_AMBIGUOUS_INPUT</code>；两者都没有 → 同一个码。两条分支都在建行前返回 400。</p>"
              },
              {
                "lines": "186-191",
                "title": "③ content 分支：只换 fetcher / parser",
                "badge": "1.3",
                "body": "<p>content 分支只接受 <code>markdown</code> / <code>plaintext</code>；其他值 400 <code>E_BAD_CONTENT_TYPE</code>。这是<strong>协议形状错误</strong>，不是“内容质量”判断。recipe 固定 <code>fetcher: \"passthrough\"</code>、<code>parser: \"text\"</code>，chunker 仍默认 <code>legacy</code>。</p><p>当前这行里的 <code>embedding</code> 是 DI 之后从构造器注入的句柄（<span class=\"badge b-now\">2.x DI</span>）；1.3 当时 recipe 里是 <code>embedder</code> 名字 + <code>config</code>。分支语义没变。</p>"
              },
              {
                "lines": "194-203",
                "title": "④ trace 回填（不属于 1.3）",
                "badge": "3.4",
                "body": "<p>当前工作区未提交的 3.4 改动：注入 DB stage sink，并在拿到结果后把 <code>resource_id</code> 写回 <code>traces</code>。1.3 时代这里只有 <code>factory.assemble(recipe).run(data, signal)</code>，没有 sink，也没有回填。</p><p>放在这里是为了让你读当前文件时不误以为“1.3 已经做了五段观测”。</p>"
              },
              {
                "lines": "204-210",
                "title": "⑤ 三档结果",
                "badge": "1.2 b3",
                "body": "<p><code>E_DUPLICATE</code> → 409（只有 URL 入库会命中）；建行后失败（<code>resource.status === \"failed\"</code>）→ 422，把那条 failed 行一起带回去；其余 → 201，带 <code>resource</code>、<code>chunk_count</code>，有 warning 就附上。</p><p>粘贴不去重，所以 content 分支正常情况下不会走到 409。</p>"
              },
              {
                "lines": "211-214",
                "title": "⑥ 兜底",
                "badge": "前置",
                "body": "<p><code>IngestError</code> 只装装配期的“未知 stage 名”这类错误 → 400；未预期异常 → 500 <code>E_INGEST</code>。建行后的业务失败已经在 422 分支处理，不会掉到这里。</p>"
              }
            ]
          },
          {
            "id": "passthrough-file",
            "file": "src/ingest/fetch/passthrough.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                18
              ]
            ],
            "notes": [
              {
                "lines": "1-4",
                "title": "零 I/O 的 fetch 替身",
                "badge": "1.2 b3",
                "body": "<p>类注释说得很直白：把请求体里的文本塞进 <code>ctx.fetched</code>，让文本入库走与 URL 完全相同的 <code>fetch → parse → chunk</code> 链。它不发任何网络请求，所以“跳过 fetch”在业务上成立；在代码结构上 fetch 段仍然存在。</p>"
              },
              {
                "lines": "11-16",
                "title": "把正文原样放进 ctx",
                "badge": "1.2 b3",
                "body": "<p><code>ctx.data.content ?? \"\"</code>：没给就当空串，交给下游判空。这里<strong>不 trim</strong>，保留用户粘贴的原始空白；空内容已经在路由层被 <code>E_EMPTY_CONTENT</code> 挡过，这里只是防御。</p><p>1.3 只把取值从旧的 <code>ctx.input</code> 改成 <code>ctx.data</code>；真正的直通逻辑在 1.2 build3 就有了。</p>"
              },
              {
                "lines": "14-15",
                "title": "这两行是 3.4 加的",
                "badge": "3.4",
                "body": "<p>当前未提交的 3.4 把 <code>content_type</code> 与 <code>final_url</code> 也放进 <code>ctx.fetched</code>，供 fetch stage 的 trace 记录。1.3 时代只有 <code>raw</code> 一个字段；这两行不参与正文处理，也不改变 content 分支。</p>"
              }
            ]
          },
          {
            "id": "text-parser-file",
            "file": "src/ingest/parse/text-parser.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                31
              ]
            ],
            "notes": [
              {
                "lines": "11-15",
                "title": "两种文本共用这一支",
                "badge": "1.2 b3",
                "body": "<p><code>TextParser.run</code> 不读 <code>content_type</code>：markdown 和 plaintext 都走同一行 <code>{ title, text: raw }</code>。正文原样交给分块器，Markdown 的围栏代码块、表格、链接、行内代码由 <code>legacy</code> 分块器的保护段兜住，不在这里解析。</p><p>标题优先级：用户显式给的 title（<code>ctx.data.title</code>）> 自动派生。1.3 只改了 <code>ctx.input</code> → <code>ctx.data</code> 的取值位置。</p>"
              },
              {
                "lines": "18-27",
                "title": "标题三档：H1 > 首个非空行 > 兜底",
                "badge": "1.2 b3",
                "body": "<p>先找 Markdown 一级标题（行首最多 3 个空格 + <code>#</code>，可带结尾 <code>#</code>）；找不到就取第一个非空行，去掉行首的 <code>#</code> / <code>&gt;</code> / <code>*</code> / <code>-</code> 等符号；都没有就返回「未命名资源」。</p><p>标题进入 <code>parsed.title</code>，随后由 <code>Ingest</code> 回填到 Resource 行；长度超过 60 字符会截断加省略号。</p>"
              }
            ]
          },
          {
            "id": "recipes-file",
            "file": "src/ingest/recipes.ts",
            "lang": "ts",
            "ranges": [
              [
                17,
                34
              ]
            ],
            "notes": [
              {
                "lines": "18-25",
                "title": "名字 → 实例的目录",
                "badge": "1.2 b3",
                "body": "<p>注册表把路由传来的字符串兑换成对象：<code>passthrough</code> → <code>PassthroughFetcher</code>，<code>text</code> → <code>TextParser</code>。content 分支能“复用”主链，靠的就是这两个名字已经在表里，而不是在管线里写 <code>if (content_type)</code>。</p>"
              },
              {
                "lines": "26-33",
                "title": "chunker 与查表",
                "badge": "1.2 b3",
                "body": "<p><code>legacy</code> 是 P1 唯一的分块器；embed 不在这张表里，因为它是装配层从 model 清单选定的<strong>句柄</strong>，不是可换策略。查表用 <code>Object.hasOwn</code>，避免 <code>toString</code> / <code>constructor</code> 这类原型链名字被误当成 stage。</p>"
              }
            ]
          },
          {
            "id": "contracts-kbdata",
            "file": "src/ingest/contracts.ts",
            "lang": "ts",
            "ranges": [
              [
                13,
                19
              ],
              [
                46,
                52
              ]
            ],
            "notes": [
              {
                "lines": "13-19",
                "title": "KBData：content 分支只带四个字段",
                "badge": "1.3",
                "body": "<p><code>content_type</code> 是 <code>\"url\" | \"markdown\" | \"plaintext\"</code>；<code>url</code> / <code>content</code> / <code>title</code> 都可选，由路由按来源填。content 分支填 <code>{ content_type: \"markdown\" | \"plaintext\", content, title? }</code>，<strong>不带 url</strong>。</p><p>这里的 <code>content_type</code> 只存档 / 预留：TextParser 不读它，chunker 不读它；3.4 之后它会进 fetch stage 的 trace 元数据，但处理路径仍不变。</p>"
              },
              {
                "lines": "46-52",
                "title": "stage 之间只传 ctx",
                "badge": "前置",
                "body": "<p><code>IngestContext</code> 是整条链的背包：<code>data</code> 是输入，<code>fetched</code> 由 fetch 段填，<code>parsed</code> 由 parse 段填，<code>chunks</code> 由 chunk 段填。每段只认背包里的字段，不认“上一步是谁”。这就是 content 分支能无缝换掉前两段的原因。</p>"
              }
            ]
          },
          {
            "id": "ingest-create",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                57,
                70
              ]
            ],
            "notes": [
              {
                "lines": "57-60",
                "title": "去重只拦 URL",
                "badge": "1.3",
                "body": "<p><code>if (Data.url)</code> 才查 <code>findActiveBySource</code>。内容分支没有 <code>url</code>，所以同一段正文粘两次不会命中查重，会老老实实建两条 Resource——这正是 1.3 AC 明确要的“粘贴不去重”。</p>"
              },
              {
                "lines": "64-70",
                "title": "建行：占位标题 + uuid urn",
                "badge": "1.3",
                "body": "<p>content 分支 <code>source</code> 为 <code>null</code>，<code>data_uri</code> 生成为 <code>urn:kc:paste:&lt;uuid&gt;</code>，<code>content_type</code> 原样写库，状态 <code>processing</code>。标题先用「未命名」占位；parse 后如果用户没给标题，会回填成 H1 / 首行。</p><p>这条 uuid 不是资源主键（主键另生成），而是“内容来源标识”；展示语义归 FR-11，1.3 只保证形状。</p>"
              }
            ]
          },
          {
            "id": "ingest-chain",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                91,
                139
              ]
            ],
            "notes": [
              {
                "lines": "91-109",
                "title": "fetch 段：当前是 3.4 的 runner",
                "badge": "3.4",
                "body": "<p>当前工作区把每个 stage 包进 <code>runStage(Sink, ...)</code>，记录 input/output/耗时。包在里面的 <code>fetcher.run(ctx, Signal)</code> 还是同一个 <code>PassthroughFetcher</code>；3.4 只是加了观测，没有改 content 的取数逻辑。</p><p>看这段时把 <code>runStage</code> 外壳和里面的业务分开：前者是 <span class=\"badge b-34\">3.4</span>，后者是 <span class=\"badge b-now\">1.2 b3</span>。</p>"
              },
              {
                "lines": "111-121",
                "title": "parse 段 + 空正文兜底",
                "badge": "3.4",
                "body": "<p><code>parser.run(ctx)</code> 是同步的，跑完读 <code>ctx.parsed</code>。如果解析后正文 <code>trim()</code> 为空，就 <code>fail(\"解析后无正文\")</code>：注意这条发生在<strong>建行之后</strong>，会留下一条 failed 行；而路由层的 <code>E_EMPTY_CONTENT</code> 发生在建行前，什么都不留。两条“空”口径别混。</p><p>当前外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 b3 的。</p>"
              },
              {
                "lines": "123-126",
                "title": "回填真标题",
                "badge": "1.2 b3",
                "body": "<p>只有用户没给标题、且 parse 出来的标题与占位不同，才更新 Resource 行。URL 入库时这是页面标题；粘贴时这是 H1 或首个非空行。更新发生在 chunk / embed 之前，所以 201 返回的已经是真标题。</p>"
              },
              {
                "lines": "128-139",
                "title": "chunk 段 + 0 块兜底",
                "badge": "3.4",
                "body": "<p>分块器把 <code>ctx.chunks</code> 填好；0 块就 <code>fail(\"内容为空\")</code>，同样留 failed 行。chunk 是同步的，取消信号只能在 stage 边界观测，所以这里之后还会再查一次 <code>Signal.aborted</code>。</p><p>当前外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 b3 的。</p>"
              }
            ]
          },
          {
            "id": "ingest-write",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                156,
                172
              ]
            ],
            "notes": [
              {
                "lines": "156-166",
                "title": "一次事务写 chunk + 向量",
                "badge": "3.4",
                "body": "<p><code>repo.writeChunksWithEmbeddings</code> 收三样：Resource id、chunk 计划（含 offset）、与 chunk 同序的向量。它在同一个事务里插入 <code>chunks</code> 和 <code>embeddings</code>，最后把 <code>resources.status</code> 改成 <code>ready</code>；任一步失败整笔回滚，不会留下“ready 但缺向量”。</p><p>当前外层由 3.4 的 <code>runStage</code> 包裹；段内逻辑仍是 1.2 b3 的。</p>"
              },
              {
                "lines": "167-172",
                "title": "写完复查 + warning + ready",
                "badge": "1.4",
                "body": "<p>168–169 行是 1.4 补的写后复查：写入本身不可中断，取消若落在 INSERT/UPDATE 期间，事务可能已经提交成 ready，这里必须把那一笔撤回成 failed。1.3 时代没有这两行。</p><p><code>thinPage</code> 只在“原页很长、抽出正文很短”时给 warning，用来提示 JS 壳页/反爬；粘贴内容的 raw 与 parsed.text 基本相同，通常不会触发。201 里的 warning 只是提示，不影响 ready。</p>"
              }
            ]
          },
          {
            "id": "client-ingest",
            "source": "web:src/api/client.ts",
            "file": "app/web/src/api/client.ts",
            "lang": "ts",
            "ranges": [
              [
                288,
                293
              ],
              [
                656,
                668
              ]
            ],
            "notes": [
              {
                "lines": "289-293",
                "title": "IngestAccepted 允许 resource=null",
                "badge": "2.1",
                "body": "<p><code>resource</code> 为 <code>null</code> 只表示“建行之前被拒”，当前只有 URL 查重命中会走这条（409 会先抛错，所以这个形状主要是给类型和防御）。<code>warning</code> 可选，201 成功但可疑时才有。</p><p><code>28f08ca</code>（2.1 review 2）把 <code>resource</code> 改成 nullable 并加 <code>warning</code>。</p>"
              },
              {
                "lines": "663-668",
                "title": "ingestContent：content 分支的请求体",
                "badge": "1.3",
                "body": "<p>只发 <code>content</code>、<code>content_type</code> 和可选 <code>title</code>，<strong>不发 url</strong>。这就是后端“url 与 content 恰好给一个”的前端对应物；<code>requestJson</code> 负责补 <code>Content-Type</code>，非 2xx 统一抛 <code>ApiError</code>，把后端的 <code>{code,message}</code> 带上来。</p>"
              }
            ]
          },
          {
            "id": "panel-file",
            "source": "web:src/components/ingest-panel/ingest-panel.tsx",
            "file": "app/web/src/components/ingest-panel/ingest-panel.tsx",
            "lang": "ts",
            "ranges": [
              [
                280,
                287
              ],
              [
                327,
                331
              ]
            ],
            "notes": [
              {
                "lines": "280-287",
                "title": "文件导入：后缀决定 content_type",
                "badge": "1.3",
                "body": "<p><code>await Picked.text()</code> 读成字符串；文件名匹配 <code>.md</code> / <code>.markdown</code> 就设 <code>markdown</code>，否则设 <code>plaintext</code>；标题为空时用去掉扩展名的文件名。类型判断在前端完成，后端只收字符串。</p><p>282 行的“清空 input 值”是 2026-10-14 补的（同一文件选第二次不触发 change），不属于 1.3。</p>"
              },
              {
                "lines": "327-331",
                "title": "accept 把非文本挡在上传层",
                "badge": "1.3",
                "body": "<p><code>accept=\".md,.markdown,.txt\"</code> 是文件选择框的过滤提示；<code>sr-only</code> 让隐藏的 input 仍能被键盘聚焦（这个可访问性改法比 1.3 晚）。它不是安全边界：构造请求仍可发任意字符串，后端不会做“像不像文本”的启发式。</p>"
              }
            ]
          },
          {
            "id": "panel-paste",
            "source": "web:src/components/ingest-panel/ingest-panel.tsx",
            "file": "app/web/src/components/ingest-panel/ingest-panel.tsx",
            "lang": "ts",
            "ranges": [
              [
                349,
                376
              ]
            ],
            "notes": [
              {
                "lines": "358-367",
                "title": "粘贴时用户自选 markdown / plaintext",
                "badge": "1.3",
                "body": "<p>分段控件把 <code>contentType</code> 置为 <code>markdown</code> 或 <code>plaintext</code>，默认 <code>markdown</code>。没有内容嗅探、没有后缀可看，所以类型只能由用户选；这就是 AC 里“类型判定归前端”的落点。</p>"
              },
              {
                "lines": "368-375",
                "title": "正文原样提交",
                "badge": "1.3",
                "body": "<p>textarea 的 <code>value</code> 就是用户粘贴的原文；提交前只用 <code>content.trim() === \"\"</code> 判空，<strong>不会</strong>把 trim 后的结果发出去。空内容在前端先拦一次，后端再用 <code>E_EMPTY_CONTENT</code> 兜底。</p>"
              }
            ]
          },
          {
            "id": "panel-submit",
            "source": "web:src/components/ingest-panel/ingest-panel.tsx",
            "file": "app/web/src/components/ingest-panel/ingest-panel.tsx",
            "lang": "ts",
            "ranges": [
              [
                184,
                187
              ]
            ],
            "notes": [
              {
                "lines": "186-187",
                "title": "真正调用 ingestContent 的地方",
                "badge": "1.3",
                "body": "<p>URL 模式走 <code>ingestUrl</code>，文本模式走 <code>ingestContent(Job.Body, contentType, Title)</code>。当前外面套了队列循环（后来改的），但这行调用形状是 1.3 定下的：正文 + 类型 + 可选标题，一次一条 POST。</p><p><code>resource</code> 可能为 null，所以下一行先判空再读 <code>status</code>；这是前端对“建行前拒绝”的防御。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\"><span class=\"kicker\">CHOICES</span><h2>三条取舍与容易踩的坑</h2><p class=\"section-sub\">这一格真正“拍下来”的东西；实现细节之后可以改，这三条是口径。</p></header>\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">01</span><h3>共用 parse 分支，content_type 只存档</h3><p><strong>选择：</strong>markdown 与 plaintext 都走 <code>TextParser</code>，正文原样交分块器；<code>content_type</code> 写进 Resource 行，作为后续分支的预留位。<strong>否掉：</strong>给 Markdown 单独写一套语法解析/清洗——P1 不需要，而且 legacy 分块器已经保护代码块、表格、链接等结构。<strong>代价：</strong>纯文本里如果出现 Markdown 表格形状，也会被保护段当成表格；P1 接受。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">02</span><h3>不做“不可读 / 编码异常”启发式</h3><p><strong>选择：</strong>后端只判断“收到的是不是字符串、trim 后空不空”，不猜编码、不猜二进制、不猜内容质量。<strong>否掉：</strong>在后端嗅探文件类型或乱码比例——规则会漂，误杀正常笔记。<strong>代价：</strong>类型判断依赖前端：文件按后缀、粘贴由用户自选、<code>accept</code> 挡非文本；绕过前端仍可能把任意字符串写进库，P1 接受。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">03</span><h3>粘贴不去重，data_uri 用 uuid urn</h3><p><strong>选择：</strong>只有 URL 入库查重；同一段正文粘两次 = 两条 Resource，各自生成 <code>urn:kc:paste:&lt;uuid&gt;</code>，<code>source</code> 为 null。<strong>否掉：</strong>按正文哈希去重——会让“同一段话故意存两次”失败，也把去重语义绑到内容上。<strong>代价：</strong>重复粘贴会多出行，需要用户自己去资源页清理；<code>data_uri</code> 的展示语义留给 FR-11。</p></article>\n  </div>\n\n  <div class=\"callout strong\"><strong>拒绝的时点：</strong>所有“无效输入”都发生在 <code>createResource</code> 之前。对<strong>内容</strong>而言只有两种：<code>E_BAD_JSON</code>（body 解析失败或顶层不是对象）与 <code>E_EMPTY_CONTENT</code>（content 空白）。<code>E_BAD_CONTENT_TYPE</code> 是协议形状错误，<code>E_AMBIGUOUS_INPUT</code> 是二选一错误，它们同样在建行前返回 400，但不是“内容质量”判断。建行之后的失败统一变成一条 failed 行 + 422。</div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>commit 夹带：</strong>看到 <code>a8a18d8</code> 里的 <code>pipelines.ts</code> / <code>qwenembed.ts</code> / 删除 <code>orchestration</code>，不要当成 1.3 的交付；那是 1.2 build3 的重构被一起提交了。页面里用 <span class=\"badge b-now\">1.2 b3</span> 标出。</li>\n    <li><strong>“跳过 fetch”是跳过网络：</strong>代码仍跑 <code>PassthroughFetcher</code>；这样 stage 顺序、<code>ctx</code> 形状、后续解析都不用为粘贴写特例。</li>\n    <li><strong>空白检查 trim，但存原串：</strong>路由用 <code>trim()</code> 判空，写进 <code>ctx.data.content</code> 的却是原始字符串；前导/尾随空白会保留，偏移也按原串计算。</li>\n    <li><strong>非字符串 content 的去向：</strong><code>content: 123</code> 不会被当成空白串，而是“没有 content”，最终 <code>E_AMBIGUOUS_INPUT</code>；顶层数组也会走这个码，不是 <code>E_BAD_JSON</code>。</li>\n    <li><strong>url 与 content 同时给：</strong>不是“URL 优先”，而是 400 <code>E_AMBIGUOUS_INPUT</code>；前端两种模式互斥，正常不会撞上。</li>\n    <li><strong>去重不对称：</strong>URL 有 <code>findActiveBySource</code>；content 没有。别把“同 URL 拒绝”误推广成“同内容拒绝”。</li>\n    <li><strong>warning 对粘贴通常不出现：</strong><code>thinPage</code> 比较 raw 与 parsed.text；粘贴时两者基本相同，不会触发“可能抓不全”。201 带 warning 主要是 URL 入库的事。</li>\n    <li><strong>Markdown 结构由 chunker 保护：</strong>不是 TextParser 解析出来的；改分块器时才会影响代码块/表格是否被切断。</li>\n  </ul>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\"><span class=\"kicker\">VERIFY</span><h2>可复制的验证命令</h2><p class=\"section-sub\">先分清“历史真跑过”和“本轮未重跑”；本轮只做了静态走读，没有起服务、没有跑测试。</p></header>\n  <div class=\"callout\"><strong>证据口径：</strong>2026-10-13 的 Epic 1 复盘真跑过两条 1.3 用例（见下）；1.2 build3 的 pipeline 测试真跑过 markdown → ready / 1 块。本轮（2026-10-24）没有重跑任何服务或测试，只核对了当前源码与 git。当前工作区有 Epic 3 未提交改动，content 分支本身未被改。</div>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>0 · 起服务（本轮未跑）</h3>\n      <p>在 <code>app/server</code> 下起真实服务；下面的命令都假设 <code>127.0.0.1:3000</code>。</p>\n      <pre class=\"snippet\">cd app/server\nnpm run dev</pre>\n    </article>\n    <article class=\"test-card\">\n      <h3>1 · 粘贴 markdown（历史真跑过）</h3>\n      <p>不给 title，验证 H1 派生标题、content_type、uuid urn、chunk 数。</p>\n      <pre class=\"snippet\">curl -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"content\":\"# 派生标题探针\\n\\n这是粘贴进来的第一段。\",\"content_type\":\"markdown\"}' \\\n  | python3 -m json.tool</pre>\n      <p class=\"test-note\">历史结果：<code>201</code>、<code>status=ready</code>、标题「派生标题探针」、<code>content_type=markdown</code>、1 块、<code>data_uri=urn:kc:paste:bca038db…</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>2 · 粘贴 plaintext（本轮未重跑）</h3>\n      <p>显式给 title，验证 plaintext 与 markdown 走同一支、标题不被派生覆盖。</p>\n      <pre class=\"snippet\">curl -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"content\":\"第一行\\n第二行\",\"content_type\":\"plaintext\",\"title\":\"粘贴纯文本\"}' \\\n  | python3 -m json.tool</pre>\n      <p class=\"test-note\">预期：<code>201</code>、<code>content_type=plaintext</code>、<code>title=粘贴纯文本</code>、<code>source=null</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>3 · 空 / 空白内容（历史真跑过）</h3>\n      <p>空白串必须建行前拒绝，不创建 Resource。</p>\n      <pre class=\"snippet\">curl -i -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"content\":\"   \\n\\t \",\"content_type\":\"markdown\"}'</pre>\n      <p class=\"test-note\">历史结果：<code>400</code>、<code>{\"code\":\"E_EMPTY_CONTENT\",\"message\":\"内容不能为空\"}</code>、<strong>不建行</strong>。可先用 <code>SELECT count(*) FROM resources;</code> 记下基数，调用后再查一次。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>4 · 非法 JSON / 错 content_type / 两者都给（本轮未重跑）</h3>\n      <p>三条都是 400，且都在建行前。</p>\n      <pre class=\"snippet\"># 坏 JSON → E_BAD_JSON\ncurl -i -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  --data '{\"content\":'\n\n# 缺 / 错 content_type → E_BAD_CONTENT_TYPE\ncurl -i -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"content\":\"hello\"}'\n\n# url + content 同时给 → E_AMBIGUOUS_INPUT\ncurl -i -sS -X POST http://127.0.0.1:3000/resources \\\n  -H 'Content-Type: application/json' \\\n  -d '{\"url\":\"https://example.com\",\"content\":\"hello\",\"content_type\":\"markdown\"}'</pre>\n    </article>\n    <article class=\"test-card\">\n      <h3>5 · 同一段粘两次（本轮未重跑）</h3>\n      <p>跑两遍第 1 条命令，验证粘贴不去重：两次都应 201，id 与 data_uri 不同。</p>\n      <pre class=\"snippet\">for i in 1 2; do\n  curl -sS -X POST http://127.0.0.1:3000/resources \\\n    -H 'Content-Type: application/json' \\\n    -d '{\"content\":\"# 重复粘贴\\n\\n同一段。\",\"content_type\":\"markdown\"}' \\\n    | python3 -c \"import sys,json; r=json.load(sys.stdin)['resource']; print(r['id'], r['data_uri'])\"\ndone</pre>\n      <p class=\"test-note\">预期两行；若只出现一行或第二次 409，说明去重逻辑被错误地扩展到了 content。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>6 · SQL 查行、块、向量（本轮未重跑）</h3>\n      <p>用上一步的 id 替换 <code>$ID</code>；psql 从 <code>.env</code> 读连接串，不要把密码贴进页面。</p>\n      <pre class=\"snippet\">export ID='&lt;上一步的 resource id&gt;'\npsql \"$DATABASE_URL\" -c \"\nSELECT id, title, source, data_uri, content_type, status, error_reason\nFROM resources WHERE id = '$ID';\n\nSELECT count(*) AS chunks\nFROM chunks WHERE resource_id = '$ID' AND deleted_at IS NULL;\n\nSELECT count(*) AS embeddings\nFROM embeddings e\nJOIN chunks c ON c.id = e.source_id\nWHERE c.resource_id = '$ID' AND e.deleted_at IS NULL;\n\"</pre>\n      <p class=\"test-note\">预期：一行 <code>status=ready</code>、<code>source</code> 为空；chunks 与 embeddings 数量相等且大于 0。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>7 · data_uri 形状（本轮未重跑）</h3>\n      <p>验证无来源内容自动生成 uuid urn，而不是空串或正文。</p>\n      <pre class=\"snippet\">psql \"$DATABASE_URL\" -c \"\nSELECT data_uri,\n       data_uri ~ '^urn:kc:paste:[0-9a-f-]{36}&#36;' AS shape_ok\nFROM resources WHERE id = '$ID';\n\"</pre>\n      <p class=\"test-note\">预期 <code>shape_ok = t</code>。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>8 · 前端 accept / 后缀判断（静态已读，浏览器手测留给 Lynx）</h3>\n      <p>静态确认 accept 与类型判断；视觉与交互由 Lynx 在浏览器里手测，本轮不开浏览器。</p>\n      <pre class=\"snippet\">cd app/web\ngrep -n 'accept=\".md,.markdown,.txt\"' src/components/ingest-panel/ingest-panel.tsx\ngrep -n 'test(Picked.name)' src/components/ingest-panel/ingest-panel.tsx</pre>\n      <p class=\"test-note\">手测路径：<code>/ingest</code> → 切到「Markdown / 纯文本」→ 选 <code>.md</code> 应自动选 markdown、选 <code>.txt</code> 应自动选 plaintext → 提交后最近入库出现对应行。</p>\n    </article>\n  </div>\n  <p class=\"table-note\">历史证据来源：<code>_Agents/implementation-artifacts/epic-1-retro-2026-10-13.md</code> 第 8/9 条；1.2 build3 的 pipeline 测试见 <code>_Agents/legacy/handoffs/handoff-2026-10-13-epic1-story2-build3-ingest-factory-refactor.md</code>。</p>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\"><span class=\"kicker\">CONTINUITY</span><h2>与前后 story 的衔接</h2><p class=\"section-sub\">1.3 站在 1.2 build3 的肩膀上；它之后的能力都在这条 content 分支旁边长出来。</p></header>\n  <table class=\"file-table\">\n    <thead><tr><th>Story</th><th>交了什么</th><th>与 1.3 的关系</th></tr></thead>\n    <tbody>\n      <tr><td><span class=\"badge b-now\">1.1</span></td><td>本地骨架、数据库、安全边界</td><td>提供 Resource / chunks / embeddings 表与运行底座</td></tr>\n      <tr><td><span class=\"badge b-now\">1.2 b3</span></td><td>管线工厂、content 分支、chunk / embed / 写、标题回填</td><td>把 1.3 要复用的主链交付出来；1.3 不重写</td></tr>\n      <tr><td><span class=\"badge b-now\">1.3</span></td><td>content 分支确认、两条内容拒绝、前端粘贴/导入、三条取舍</td><td>本页</td></tr>\n      <tr><td><span class=\"badge b-now\">1.4</span></td><td>服务端持有取消、abort 端点、软删、写守卫 <code>E_RESOURCE_GONE</code></td><td>在 <code>Ingest</code> 的写库前后加取消检查；1.3 的 content 路径同样受益</td></tr>\n      <tr><td><span class=\"badge b-now\">2.x</span></td><td>混合检索、流式问答、引用、工具检索；DI 改造</td><td>读 1.3 写好的 ready 资源；<code>data_uri</code> 的展示语义归 FR-11；recipe 里的 embedding 改成注入句柄</td></tr>\n      <tr><td><span class=\"badge b-34\">3.4</span></td><td>ingest 五段 + DB sink + <code>traces.resource_id</code> 回填</td><td>给 1.3 的 fetch/parse/chunk/embed/write 加观测外壳；当前未提交</td></tr>\n      <tr><td><span class=\"badge b-now\">前端后续</span></td><td>入库页从 <code>/knowledge</code> 拆到 <code>/ingest</code>、URL 队列化、视觉与可访问性改造</td><td>1.3 的粘贴/文件语义保留，外层交互变复杂</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout strong\"><strong>1.3 往后留下了什么：</strong>一条稳定的 content 分支（<code>passthrough</code> + <code>text</code> + 共用后三段）、两条建行前的内容拒绝、一个可复用的前端 <code>ingestContent</code>，以及三条不轻易改的口径。后续 story 可以换 UI、加取消、加观测，但不应把“markdown 单独解析”“后端猜内容质量”“粘贴按内容去重”重新加回来。</div>\n  <div class=\"next-box\">\n    <p><strong>下一步：</strong>Story 1.4 的取消 / 软删 / 写守卫；本页只是 1.3 的收口走读，不改产品代码，也不把 sprint 状态改成 done。视觉部分请 Lynx 在浏览器里手测。</p>\n    <div class=\"next-links\">\n      <a href=\"#conclusion-and-boundary\">回到边界</a>\n      <a href=\"#verification-commands\">复制验证命令</a>\n      <a href=\"#code-and-annotations\">重看代码</a>\n    </div>\n  </div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<footer class=\"footer\">\n  <p>Story 1.3 走读页 · 生成于 2026-10-24 · 代码来自当前工作区（含 Epic 3 未提交改动，相关行已标 <span class=\"badge b-34\">3.4</span>）· 本轮未起服务、未跑前后端测试、未开浏览器。</p>\n  <p>源文件：<code>app/server/src/routes/resources.ts</code>、<code>src/ingest/{ingest,contracts,recipes}.ts</code>、<code>src/ingest/fetch/passthrough.ts</code>、<code>src/ingest/parse/text-parser.ts</code>、<code>app/web/src/api/client.ts</code>、<code>app/web/src/components/ingest-panel/ingest-panel.tsx</code>。</p>\n</footer>\n"
    }
  ]
}
