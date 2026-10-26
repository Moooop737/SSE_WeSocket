export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic2-story4-source-ref.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 2 · Story 2.4 原文回链 Source Ref · 带代码逐行讲解",
  "tocTitle": "Story 2.4",
  "tocSub": "原文回链 · 快照与来源已删除",
  "accent": "#86198f",
  "accent2": "#701a75",
  "accentDark": "#f0abfc",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>EPIC 2 · STORY 2.4</span><span class=\"chip\">FR-11</span><span class=\"chip\">status <strong>done</strong></span><span class=\"chip\">2026-10-21 收口</span></div>\n  <h1>点击引用，看到<em>回答当时</em>那块原文</h1>\n  <p class=\"hero-sub\">Story 2.4 把「引用」接成一扇只读的原文窗：点右栏命中行，或点回答里的 [n]（当前轮先定位那一行，跨轮直接开），抽屉里展示消息内嵌的原文快照、块号与偏移、来源标识；来源被删时内容照常可看，只多一行「来源已删除」。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\">上游：<strong>2.3 [n] 映射</strong></span>\n    <span class=\"chip\">快照：<strong>2.6 tool output</strong></span>\n    <span class=\"chip\">持久化：<strong>2.5 message parts</strong></span>\n    <span class=\"chip\">代码：<strong>当前工作区</strong></span>\n  </div>\n  <div class=\"trace-pill\"><b>一句话</b> 快照来自 messages.parts，不请求已删 chunk；删除只影响标注，不影响可读性。</div>\n</header>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">01 · CONCLUSION</span>\n    <h2>一句话结论与 story 边界</h2>\n    <p class=\"section-sub\">先把「这格做了什么」钉死，再看代码。2.4 不负责编号解析，也不负责 trace 面板；它负责「点开之后看到什么」。</p>\n  </header>\n\n  <div class=\"callout strong\"><strong>结论：</strong>2.4 把「引用」接成一扇只读的原文窗：命中行一定开抽屉，回答里的 [n] 在当前引用列表里先点亮右栏、不在列表里就直接开抽屉；抽屉里的正文来自消息内嵌快照，来源是否还在只查 Resource，不查 chunk。</div>\n\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01</span><h3>快照，不是重取</h3><p>打开抽屉时不请求 <code>GET /resources/:id/chunks</code>；<code>content</code>、<code>chunkIndex</code>、<code>startOffset</code>、<code>endOffset</code> 都从这条 assistant 消息的 <code>tool-retrieve</code> output 里读。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02</span><h3>两个点击入口</h3><p>右栏命中行点击一定开抽屉；回答里的 [n] 在当前引用列表里时先定位/点亮那一行，属于更早一轮或不在当前列表时直接开抽屉。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03</span><h3>删了也能看</h3><p>抽屉打开时查一次 <code>GET /resources/:id</code>；404 显示「来源已删除 · 以下为回答时的快照」，正文继续渲染。500 或网络失败不冒充「已删除」。</p></article>\n  </div>\n\n  <table class=\"file-table\">\n    <thead><tr><th>能力</th><th>归属</th><th>本页怎么处理</th></tr></thead>\n    <tbody>\n      <tr><td>[n] 与 8 位 chunkId 的解析、编号、越界纯文本</td><td>Story 2.3</td><td>只讲点击之后的那一跳，不重讲编号规则</td></tr>\n      <tr><td><code>tool-retrieve</code> output 的完整投影</td><td>Story 2.6</td><td>抽屉、面板的数据源；代码块带 <code>2.6</code> badge</td></tr>\n      <tr><td>消息 parts 落库、历史恢复</td><td>Story 2.5</td><td>解释「为什么删了来源还能看到快照」</td></tr>\n      <tr><td>点引用/命中行开抽屉、块号/偏移/来源、已删标注</td><td><strong>Story 2.4</strong></td><td>本页主角</td></tr>\n      <tr><td><code>GET /resources/:id</code></td><td>2.4 加；Epic 3 pre-3.2 交给 hono-crud</td><td>当前读路径带 <code>3.2 前置</code> badge，历史提交用 git 命令核对</td></tr>\n      <tr><td>字符级高亮</td><td>增强项，本 Story 不强制</td><td>明确说「没做」，不把行高亮冒充字符高亮</td></tr>\n      <tr><td>3.3 的 trace 面板 / 阶段读接口</td><td>Story <span class=\"badge b-33\">3.3</span></td><td>不在本页；抽屉里的 stage 视图不属于 2.4</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\"><strong>边界里最容易被误读的一条：</strong>2.4 的「来源已删除」判据是 <strong>Resource 级</strong>——<code>GET /resources/:id</code> 返回 404。它不是逐 chunk 探测；如果只删了一个 chunk 而 Resource 还在，抽屉不会标「来源已删除」。当前实现没有 410 分支，410 条款已在 2026-10-21 作废。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 08</span>\n    <h2>一眼看懂：点引用 → 原文抽屉</h2>\n    <p class=\"section-sub\">先看消息内快照，再按需补来源详情。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>1</strong>份快照</span><span class=\"chip\"><strong>2</strong>类来源标识</span><span class=\"chip\"><strong>404</strong>降级不崩</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic2-story4-source-ref.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 2.4 点引用到原文抽屉\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:973 / 528;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic2-story4-source-ref.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>原文片段来自 message parts 的快照，不依赖已删 chunk 行。</li><li>来源标识优先 URL/文件名；粘贴内容用 uuid urn。</li><li>详情 404 时仍显示快照并标「来源已删除」；不返回 410。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>字符级高亮是增强项，本页不强制。</div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"global-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">02 · MAP</span>\n    <h2>全局地图：写入侧带快照，读取侧只查来源</h2>\n    <p class=\"section-sub\">一句话记住两条路：回答时把命中快照写进消息；打开抽屉时只问 Resource 还在不在，不回头取 chunk。</p>\n  </header>\n\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>写入侧 · 流里带回来</h3>\n      <ul class=\"flow-list\">\n        <li><span>模型调 retrieve 工具</span><code>tool-retrieve</code></li>\n        <li><span>工具输出 12 个字段</span><code>RetrievedHit</code></li>\n        <li><span>UI message stream 落到 assistant 消息</span><code>parts[]</code></li>\n        <li><span>服务端把 parts 写进 messages 表</span><code>2.5</code></li>\n        <li><span>刷新/切会话时整条消息回读</span><code>GET /sessions/:id/messages</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>读取侧 · 点开只查一次</h3>\n      <ul class=\"flow-list\">\n        <li><span>点 [n] 或命中行</span><code>onCite / onOpen</code></li>\n        <li><span>把命中放进 openHit</span><code>RetrievedHit</code></li>\n        <li><span>抽屉渲染快照正文</span><code>openHit.content</code></li>\n        <li><span>同时查来源是否还在</span><code>GET /resources/:id</code></li>\n        <li><span>404 只加标注，正文照旧</span><code>来源已删除</code></li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"callout\"><strong>不要混的两件事：</strong><code>GET /resources/:id</code> 只回答「Resource 还在不在」；<code>GET /resources/:id/chunks</code> 是资源详情抽屉的分页读，不参与命中抽屉。前者 404 只影响标注，后者 404 会让资源详情进失败态。</div>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">03 · GLOSSARY</span>\n    <h2>小白词典</h2>\n    <p class=\"section-sub\">这些词在本页反复出现；先用一句人话记住，再看代码。</p>\n  </header>\n\n  <div class=\"glossary\">\n    <div class=\"gloss\"><dt>UIMessage.parts</dt><dd>AI SDK 的消息不是一段字符串，而是 parts 数组：text、reasoning、tool-retrieve 各占一段。快照就住在 tool part 的 output 里。</dd></div>\n    <div class=\"gloss\"><dt>tool-retrieve</dt><dd>模型自己调用的检索工具。它的 output 里有 hits（命中数组）、两路计数和 error；前端按 part 名找它，不另打 /retrieve。</dd></div>\n    <div class=\"gloss\"><dt>快照</dt><dd>回答那一刻的命中副本：正文、块号、偏移、标题、URL 都在消息里。来源后来被删，快照本身不会消失。</dd></div>\n    <div class=\"gloss\"><dt>chunkId / resourceId</dt><dd>chunkId 指向一个块，resourceId 指向块所属的资源。引用标记按 chunkId 找块；「来源已删除」按 resourceId 查资源。</dd></div>\n    <div class=\"gloss\"><dt>404 / 410</dt><dd>404 = 找不到（当前用它表示资源不存在或已软删）；410 = 曾经存在、现在没了。2.4 只用 404，410 条款已作废。</dd></div>\n    <div class=\"gloss\"><dt>软删</dt><dd>DELETE 不物理删 resources 行，只写 deleted_at；chunks 会在同一事务里物理删。GET /resources/:id 过滤 deleted_at。</dd></div>\n    <div class=\"gloss\"><dt>抽屉 / dialog</dt><dd>从右侧滑出的浮层，语义是模态对话框。2.4 只提供内容；焦点、Esc、Tab 圈、滚动锁是共享 Drawer 的职责。</dd></div>\n    <div class=\"gloss\"><dt>来源标识</dt><dd>URL 资源显示可点链接；粘贴内容没有 URL，用标题（Markdown 一级标题或首个非空行）加唯一 dataUri 指向唯一 Resource。</dd></div>\n    <div class=\"gloss\"><dt>hono-crud read</dt><dd>Epic 3 起四张表的 list/read 交给 hono-crud。resources 的 read 仍按 deleted_at 软删过滤，响应信封是 <code>resource</code>。</dd></div>\n  </div>\n</section>"
    },
    {
      "type": "journey",
      "id": "journey",
      "kicker": "04 · WALK",
      "title": "一次「点引用」的旅行",
      "subtitle": "从回答里的一个按钮，到抽屉里的一屏原文。点一步跳代码。",
      "steps": [
        {
          "goto": "citation-panel-row:43-49",
          "title": "点右栏命中行",
          "note": "整行是按钮；onOpen 把命中直接交给抽屉",
          "code": "onOpen"
        },
        {
          "goto": "chat-thread-citations:229-239",
          "title": "点回答里的 [n]",
          "note": "onCite 交给页面；页面再决定点亮还是直接开",
          "code": "[n] → onCite"
        },
        {
          "goto": "ask-source-open:83-85",
          "title": "页面记住开哪一条 / 点亮哪一行",
          "note": "openHit 存整条快照；activeChunkId 是右栏高亮；goneHitId 只记 404 的 resourceId",
          "code": "openHit / activeChunkId"
        },
        {
          "goto": "ask-source-open:342-351",
          "title": "引用点击的两条路",
          "note": "在当前引用列表里 → 点亮那一行；不在列表里 → 直接开抽屉",
          "code": "revealCitation"
        },
        {
          "goto": "ask-source-drawer:549-553",
          "title": "抽屉打开",
          "note": "标题是 docTitle，副标题是块号 + 偏移区间",
          "code": "Drawer"
        },
        {
          "goto": "ask-source-open:227-243",
          "title": "查来源是否还在",
          "note": "打开时按 resourceId 查一次；只认 404",
          "code": "fetchResource"
        },
        {
          "goto": "ask-source-drawer:555-561",
          "title": "已删只加一行标注",
          "note": "内容继续渲染，不把抽屉变成错误页",
          "code": "来源已删除"
        },
        {
          "goto": "ask-source-drawer:568-573",
          "title": "看快照正文",
          "note": "content 来自消息 parts；没有字符级高亮",
          "code": "openHit.content"
        }
      ],
      "hint": "这条旅行里没有「请求 chunk」这一步；抽屉的正文在打开之前就已经在消息里了。"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">05 · FILES</span>\n    <h2>文件地图</h2>\n    <p class=\"section-sub\">先看谁负责哪一段，再看逐段代码。带 badge 的行是上下游或后来补丁，不是 2.4 的交付。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>职责</th><th>归属</th></tr></thead>\n    <tbody>\n      <tr><td><code>app/web/src/routes/ask.tsx</code></td><td>openHit/goneHitId 状态、打开时查来源、Drawer 内容</td><td>2.4</td></tr>\n      <tr><td><code>app/web/src/components/citation-panel/citation-panel.tsx</code></td><td>右栏引用行；点行把命中交给页面</td><td>2.3 / 2.4</td></tr>\n      <tr><td><code>app/web/src/components/chat-thread/chat-thread.tsx</code></td><td>正文里的 [n] 按钮；解析、编号、跨轮提示</td><td>2.3</td></tr>\n      <tr><td><code>app/web/src/api/chat.ts</code></td><td><code>referencesOf</code> 从 tool part 取命中</td><td>2.3（web 3542214）</td></tr>\n      <tr><td><code>app/web/src/api/client.ts</code></td><td><code>RetrievedHit</code> 契约 + <code>fetchResource</code></td><td>2.6 / 2.4</td></tr>\n      <tr><td><code>app/web/src/components/drawer/drawer.tsx</code></td><td>共享抽屉壳：portal、焦点、Esc、Tab 圈、滚动锁</td><td>前置</td></tr>\n      <tr><td><code>app/server/src/agent/tool/tools/retrieve.ts</code></td><td>检索工具输出；<code>toHit</code> 把块投影成 12 个字段</td><td>2.6</td></tr>\n      <tr><td><code>app/server/src/agent/tool/contracts.ts</code></td><td>工具侧 <code>RetrievedHit</code> 形状</td><td>2.6</td></tr>\n      <tr><td><code>app/server/src/routes/crud.ts</code></td><td>当前 <code>GET /resources/:id</code> 的注册与软删配置</td><td>3.2 前置</td></tr>\n      <tr><td><code>app/server/src/adapter/repo/resource.ts</code></td><td><code>getResource</code> 的 <code>deleted_at IS NULL</code> 读法</td><td>前置</td></tr>\n      <tr><td><code>app/server/src/ingest/parse/text-parser.ts</code></td><td>粘贴内容的标题推导（一级标题 / 首个非空行）</td><td>前置</td></tr>\n      <tr><td><code>app/server/src/ingest/ingest.ts</code></td><td>建 Resource 时的 <code>source</code> 与 <code>data_uri</code></td><td>前置</td></tr>\n      <tr><td><code>app/web/src/components/resource-detail/resource-detail.tsx</code></td><td>资源管理抽屉：<code>GET /:id/chunks</code> 分页 + 搜索，不是命中抽屉</td><td><span class=\"badge b-now\">P2</span> 补丁</td></tr>\n    </tbody>\n  </table>\n</section>"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "06 · CODE",
        "title": "代码逐段：从点击到抽屉",
        "subtitle": "每个代码块右边是逐段讲解；点一条会点亮对应行。代码都来自当前工作区，badge 标出后来 story 的补丁。",
        "body": "<div class=\"callout\"><strong>读法：</strong>先看左边行号，再看右边最近的一条讲解。带 <code>2.6</code> 的块是快照来源；带 <code>2.3</code> 的块是编号/点击入口；带 <code>3.2 前置</code> 的块是 Epic 3 接管后的当前读路径。</div>",
        "blocks": [
          {
            "id": "ask-source-open",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                83,
                85
              ],
              [
                227,
                243
              ],
              [
                342,
                351
              ]
            ],
            "notes": [
              {
                "lines": "83-85",
                "title": "开哪一条、哪一条已删",
                "badge": "2.4",
                "body": "<p><code>openHit</code> 存整条命中快照，不存 id：抽屉要用到标题、块号、偏移、正文。<code>activeChunkId</code> 是 2.3 的「点亮右栏哪一行」；<code>goneHitId</code> 记的是被 404 的 <code>resourceId</code>，不是布尔值——换一条命中时不会把上一条的「已删除」带过来。</p>"
              },
              {
                "lines": "227-243",
                "title": "打开时按 resourceId 查一次来源",
                "badge": "2.4",
                "body": "<p>依赖只有 <code>openHit</code>：每开一次抽屉查一次。先清空 <code>goneHitId</code>，再 <code>fetchResource</code>；只有 <code>ApiError</code> 且 <code>status === 404</code> 才标已删。<strong>500 或网络失败不标</strong>——未知状态不能冒充确定结论。清理函数用 <code>alive</code> 防止慢回包写进下一条命中。</p>"
              },
              {
                "lines": "342-351",
                "title": "引用点击的两条路",
                "badge": "2.3/2.4",
                "body": "<p>命中已经在当前右栏引用列表（<code>cited</code>）里：设 <code>activeChunkId</code> 并滚到那一行——本轮 [n] 是「先定位、再点行」两步。命中不在列表里（通常是更早一轮的引用）：直接 <code>setOpenHit</code> 开抽屉，避免点了没反应。<code>behavior</code> 跟着减动效档走，不把整屏平滑推走。</p>"
              }
            ]
          },
          {
            "id": "ask-source-drawer",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                549,
                576
              ]
            ],
            "notes": [
              {
                "lines": "549-553",
                "title": "Drawer 的四个入参",
                "badge": "2.4",
                "body": "<p><code>open</code> 由 <code>openHit !== null</code> 决定；<code>Title</code> 用 <code>docTitle</code>；<code>Subtitle</code> 拼「块号 · 偏移 [start, end)」。偏移可能为 null，显示成 <code>?</code>，不编造 0。抽屉壳本身负责焦点与 Esc，见后面的 drawer 块。</p>"
              },
              {
                "lines": "555-561",
                "title": "已删标注：只加一行，不挡内容",
                "badge": "2.4",
                "body": "<p>只有 <code>goneHitId === openHit.resourceId</code> 才出现。文案固定「来源已删除 · 以下为回答时的快照」；它下面就是原文，没有按钮、没有重试、没有 410 错误页。2026-10-21 Lynx 拍：可看优先，不禁止点击。</p>"
              },
              {
                "lines": "562-567",
                "title": "来源链接只在有 URL 时出现",
                "badge": "2.4",
                "body": "<p><code>openHit.source</code> 是 URL 资源的地址；粘贴内容这里是 <code>null</code>，整段链接不渲染。也就是说 <strong>/ask 抽屉对粘贴内容只显示标题</strong>，不显示 <code>urn:kc:paste:...</code> 的 dataUri；<code>/recall</code> 抽屉才显示「粘贴正文 · dataUri」。这是当前口径的残差，不是本页的笔误。</p>"
              },
              {
                "lines": "568-573",
                "title": "分数行 + 快照正文",
                "badge": "2.6",
                "body": "<p><code>scoreLine</code> 显示 rrf / cos / bm25 三路分数，字段来自 2.6 的工具输出；正文直接渲染 <code>openHit.content</code>，<strong>不请求 chunks</strong>。这里没有字符级高亮——2.4 的 AC 把字符级高亮列为增强项，本 Story 不强制。</p>"
              }
            ]
          },
          {
            "id": "client-source-contract",
            "file": "app/web/src/api/client.ts",
            "source": "web:src/api/client.ts",
            "lang": "ts",
            "ranges": [
              [
                266,
                280
              ],
              [
                301,
                313
              ],
              [
                428,
                432
              ]
            ],
            "notes": [
              {
                "lines": "266-280",
                "title": "抽屉要的字段，全在这份契约里",
                "badge": "2.6",
                "body": "<p><code>chunkId</code> 用于引用定位；<code>resourceId</code> 用于查来源是否已删；<code>chunkIndex</code> / <code>startOffset</code> / <code>endOffset</code> 进副标题；<code>docTitle</code> / <code>source</code> / <code>dataUri</code> 是来源标识；<code>content</code> 是快照正文。注意它和 <code>agent/tool/contracts.ts</code> 是两份手工副本，改字段要两边一起改。</p>"
              },
              {
                "lines": "301-313",
                "title": "ApiError 把 HTTP 状态带上来",
                "badge": "2.4",
                "body": "<p><code>status</code> 是页面唯一用来判「已删除」的信号；<code>code</code> 和 <code>message</code> 只用于提示。没有 410 专用分支：410 不会被当成已删除（当前后端也只发 404）。</p>"
              },
              {
                "lines": "428-432",
                "title": "fetchResource：只认 { resource } 信封",
                "badge": "2.4",
                "body": "<p>GET <code>/resources/:id</code> 返回 <code>{ resource }</code>；404 由 <code>requestJson</code> 抛 <code>ApiError</code>。形状不对（没有 <code>resource</code>）抛普通 Error，页面不会把它当成「已删除」——这正是 500/形状错误不误标的原因。</p>"
              }
            ]
          },
          {
            "id": "chat-references",
            "file": "app/web/src/api/chat.ts",
            "source": "web:src/api/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                98,
                133
              ]
            ],
            "notes": [
              {
                "lines": "98-119",
                "title": "referencesOf：从 tool part 取快照",
                "badge": "2.3",
                "body": "<p>只看 assistant 消息里最后一条 <code>tool-retrieve</code> part：进行中 / 工具抛错 / 有 output 三态。output 形状不对或 <code>error</code> 非空都归为 failed，面板不会拿半个对象去 <code>map</code> 而整页崩。这个 output 就是抽屉快照的来源。</p><p>提交落在 web build 5 <code>3542214</code>；消费侧归 2.3。</p>"
              },
              {
                "lines": "121-133",
                "title": "collectHits：同轮多次重查的去重",
                "badge": "2.3",
                "body": "<p>一条回答里可能调 1–4 次 retrieve。这里把所有 <code>output-available</code> 的 part 按 <code>chunkId</code> 合并，重复召回留最后一次（分数/名次和「面板显示最新战果」一致）。2.5 把这些 parts 原样落库，所以刷新后同一份快照还在。</p><p>提交落在 web build 5 <code>3542214</code>；消费侧归 2.3。</p>"
              }
            ]
          },
          {
            "id": "chat-thread-citations",
            "file": "app/web/src/components/chat-thread/chat-thread.tsx",
            "source": "web:src/components/chat-thread/chat-thread.tsx",
            "lang": "ts",
            "ranges": [
              [
                198,
                242
              ]
            ],
            "notes": [
              {
                "lines": "198-205",
                "title": "citedHits：引用编号 1..N 的来源",
                "badge": "2.3",
                "body": "<p>按正文里 <strong>首次出现顺序</strong> 去重，得到这一条回答的引用列表。正文按钮的号、右栏行号都读这一份；不跟召回名次走，所以不会出现 2、3、6、8 这种跳号。</p>"
              },
              {
                "lines": "207-223",
                "title": "withCitations：对不上的标号留成文字",
                "badge": "2.3",
                "body": "<p>把一行拆成普通文字与 <code>[n]</code> / <code>[6-8 位十六进制]</code> 标记。解析不到命中时原样返回文字，不硬造按钮——这就是 2.3 的「越界索引不报错、渲染为纯文本」。2.4 只在解析成功时接住 <code>onCite</code>。</p>"
              },
              {
                "lines": "224-241",
                "title": "按钮把命中交出去",
                "badge": "2.3",
                "body": "<p><code>onClick={() => onCite(hit)}</code> 把整条命中交给页面（也就是 2.4 的入口）。<code>title</code> 与 <code>aria-label</code> 会区分「本条回答第 N 条引用」和「前文检索」；后者提示这条命中来自更早几轮。</p>"
              }
            ]
          },
          {
            "id": "citation-panel-row",
            "file": "app/web/src/components/citation-panel/citation-panel.tsx",
            "source": "web:src/components/citation-panel/citation-panel.tsx",
            "lang": "ts",
            "ranges": [
              [
                37,
                76
              ]
            ],
            "notes": [
              {
                "lines": "37-49",
                "title": "命中行就是 2.4 的第二个入口",
                "badge": "2.3/2.4",
                "body": "<p>整行是一个 <code>button</code>，<code>onClick</code> 调 <code>onOpen(hit)</code>；<code>li</code> 上的 <code>hitAnchorId(chunkId)</code> 给 2.3 的 [n] 定位用。<code>ActiveChunkId</code> 相等时加底色和左侧竖线，表示「从正文跳过来的那一行」。</p>"
              },
              {
                "lines": "50-58",
                "title": "高亮不只靠颜色",
                "badge": "2.3",
                "body": "<p>激活行除了 <code>bg-accent-soft</code> 还有一条 <code>aria-hidden</code> 的竖线；读屏拿不到颜色，但拿得到行号与标题。行号是这份列表里的 1..N，不是召回名次。</p>"
              },
              {
                "lines": "60-70",
                "title": "块号、三路分数、正文摘要",
                "badge": "2.6",
                "body": "<p>块号与三路分数都来自 2.6 的完整投影；<code>content</code> 是快照正文的前两行。面板只做防御性显示：<code>null</code> 显示成 <code>—</code>，不会把纯向量命中的 <code>lexicalScore=null</code> 说成 0 分。</p>"
              }
            ]
          },
          {
            "id": "server-tool-hit",
            "file": "app/server/src/agent/tool/tools/retrieve.ts",
            "source": "src/agent/tool/tools/retrieve.ts",
            "ranges": [
              [
                43,
                62
              ]
            ],
            "notes": [
              {
                "lines": "43-45",
                "title": "toOutput：一次检索的完整回包",
                "badge": "2.6",
                "body": "<p><code>hits</code> 是投影后的命中数组，<code>vectorCount</code> / <code>lexicalCount</code> 是两路候选计数，<code>error</code> 成功时为 null。这个对象随 UI message stream 回到前端，落在 assistant 消息的 tool part 里。</p>"
              },
              {
                "lines": "47-62",
                "title": "toHit：12 个字段一个不少",
                "badge": "2.6",
                "body": "<p>块号、偏移、标题、来源、dataUri、正文、三路分数全部带回来。为什么不让前端再打一次 <code>/retrieve</code>：那样会出现两批命中，彼此不担保；一份快照跟着消息走，历史回答才能复现当时的出处。</p>"
              }
            ]
          },
          {
            "id": "server-crud-read",
            "file": "app/server/src/routes/crud.ts",
            "source": "src/routes/crud.ts",
            "ranges": [
              [
                28,
                43
              ],
              [
                144,
                160
              ]
            ],
            "notes": [
              {
                "lines": "28-43",
                "title": "当前 GET /resources/:id 由 read 注册",
                "badge": "3.2 前置",
                "body": "<p>resources 表只开 <code>list</code> 与 <code>read</code>；<code>itemKey: resource</code> 决定响应是 <code>{ resource }</code> 信封，正好对上 <code>fetchResource</code>。2.4 当时是在 <code>routes/resources/resources.ts</code> 手写的 <code>app.get(/:id)</code>，Epic 3 pre-3.2 的 CRUD 重构把它删掉，语义交给这里。</p>"
              },
              {
                "lines": "144-160",
                "title": "softDelete 让 read 过滤 deleted_at",
                "badge": "3.2 前置",
                "body": "<p><code>modelOf</code> 发现表里有 <code>deleted_at</code> 列就登记 <code>softDelete</code>；hono-crud 的 read/list 会按它过滤。因此软删后的资源在 <code>GET /resources/:id</code> 上表现为找不到。这里是库约定 + 第三方适配器行为，本轮没有真跑；历史 2.4 路由的 404 是手写分支。</p>"
              }
            ]
          },
          {
            "id": "server-repo-get",
            "file": "app/server/src/adapter/repo/resource.ts",
            "source": "src/adapter/repo/resource.ts",
            "ranges": [
              [
                63,
                69
              ]
            ],
            "notes": [
              {
                "lines": "63-69",
                "title": "getResource：同一条软删判据的另一处",
                "badge": "前置",
                "body": "<p>Drizzle 查询同时带 <code>id</code> 与 <code>deleted_at IS NULL</code>，找不到返回 null。它今天服务 DELETE、abort 与 chunks 读；CRUD read 走自己的 softDelete 配置，但判据是同一个：软删行当不存在。</p>"
              }
            ]
          },
          {
            "id": "drawer-shell",
            "file": "app/web/src/components/drawer/drawer.tsx",
            "source": "web:src/components/drawer/drawer.tsx",
            "lang": "ts",
            "ranges": [
              [
                103,
                124
              ],
              [
                214,
                220
              ],
              [
                231,
                232
              ]
            ],
            "notes": [
              {
                "lines": "103-112",
                "title": "共享抽屉壳，不是 2.4 的交付",
                "badge": "前置",
                "body": "<p><code>Drawer</code> 被资源详情、命中详情、trace 详情共用。2.4 只传 <code>open</code> / <code>Title</code> / <code>Subtitle</code> / children；焦点、Esc、Tab 圈、滚动锁都在这一层。这里的 <code>useId</code> 保证同屏两只抽屉各有自己的可及名。</p>"
              },
              {
                "lines": "113-124",
                "title": "打开时：记触发元素、锁滚动、抢焦点",
                "badge": "前置",
                "body": "<p>先记 <code>document.activeElement</code> 作为关闭后的归还点；<code>lockScroll</code> 按层计数；再把自己推进 <code>openPanels</code> 栈顶，<code>markTopmost</code> 之后才 <code>focus</code>。顺序不能反：退场重开时节点可能还带着 <code>inert</code>，先 focus 会静默失败。</p>"
              },
              {
                "lines": "214-220",
                "title": "dialog 语义四件套",
                "badge": "前置",
                "body": "<p><code>role=\"dialog\"</code>、<code>aria-modal=\"true\"</code>、<code>aria-labelledby</code> 指向本层 <code>useId</code>、<code>tabIndex={-1}</code> 让面板本身可聚焦。少一件读屏就会把抽屉念成普通内容。外层还 <code>createPortal</code> 到 <code>document.body</code>，避免被侧栏的层叠上下文压住。</p>"
              },
              {
                "lines": "231-232",
                "title": "标题就是可及名",
                "badge": "前置",
                "body": "<p><code>h2 id={titleId}</code> 是 <code>aria-labelledby</code> 的目标；2.4 传进来的 <code>docTitle</code> 因此成为抽屉的可及名。副标题（块号/偏移）不进可及名，但视觉上紧贴标题。</p>"
              }
            ]
          },
          {
            "id": "paste-title",
            "file": "app/server/src/ingest/parse/text-parser.ts",
            "source": "src/ingest/parse/text-parser.ts",
            "ranges": [
              [
                11,
                31
              ]
            ],
            "notes": [
              {
                "lines": "11-15",
                "title": "粘贴内容的标题优先级",
                "badge": "前置",
                "body": "<p><code>ctx.data.title</code>（用户在前端填的标题）优先；没填就 <code>deriveTitle(raw)</code>。所以粘贴内容不是永远叫「未命名」：正文的一级标题或首个非空行会成为 Resource 标题，也就是抽屉的 <code>docTitle</code>。</p>"
              },
              {
                "lines": "18-31",
                "title": "deriveTitle：内容指纹式的命名",
                "badge": "前置",
                "body": "<p>先找 Markdown 一级标题；没有就取首个非空行，去掉列表/引用/标题符号，最长 60 字；再没有才「未命名资源」。这是 AC 里「命名 + 内容指纹」的命名半边；时间戳没有进标题。</p>"
              }
            ]
          },
          {
            "id": "paste-uri",
            "file": "app/server/src/ingest/ingest.ts",
            "source": "src/ingest/ingest.ts",
            "ranges": [
              [
                63,
                70
              ]
            ],
            "notes": [
              {
                "lines": "63-70",
                "title": "source 为 null，data_uri 给唯一指针",
                "badge": "前置",
                "body": "<p>URL 资源 <code>source = url</code>；粘贴内容 <code>source = null</code>，所以 2.4 抽屉不渲染链接。<code>data_uri</code> 用 <code>urn:kc:paste:&lt;uuid&gt;</code> 保证每条粘贴内容有唯一指针；唯一性由 <code>resourceId</code> / <code>dataUri</code> 保证，而不是靠一个可能重名的标题。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">07 · DECISIONS</span>\n    <h2>关键取舍与容易踩的坑</h2>\n    <p class=\"section-sub\">这一节回答「为什么这么做、否掉了什么、哪里会静默失效」。先看四张取舍卡，再看坑清单。</p>\n  </header>\n\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">01</span><h3>快照 vs 重新取 chunk</h3><p>重取会得到「现在」的块，不是「回答当时」的块；来源删了还会 404/500。快照跟着消息走，历史回答可复现，也不需要额外网络请求。代价是快照占消息体积，且旧块不会跟随后续编辑。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">02</span><h3>404 只标不拦</h3><p>2026-10-21 Lynx 拍：可看优先。抽屉继续渲染快照，只加一行「来源已删除」；不把引用变成不可点纯文本，也不返回 410。原 AC 的两条已被这次决定改写。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">03</span><h3>本轮 [n] 两步，跨轮一步</h3><p>当前轮 [n] 先点亮右栏那一行，让用户看到「引用和命中是同一套编号」；跨轮引用不在右栏列表里，直接开抽屉，避免点了没反应。这是 2.3/2.4 交界处的交互取舍。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">04</span><h3>Resource 级删除判据</h3><p>只查 <code>GET /resources/:id</code>，不逐 chunk 探测。实现简单、请求少，也符合「来源」的产品语义；代价是「只删了 chunk、资源还在」不会标已删除，这是当前边界。</p></article>\n  </div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>别把 500 当已删除：</strong>页面只认 <code>ApiError</code> 且 <code>status === 404</code>。后端挂了、代理返回 HTML、响应形状不对，都不会出现「来源已删除」；内容仍然可读，但标注保持沉默。</li>\n    <li><strong>别把 410 写回来：</strong>410 条款已在 2026-10-21 作废。当前后端没有 410 分支；如果以后加，前端也要把它归到「来源不在了」，而不是单独报错。</li>\n    <li><strong>粘贴内容的抽屉没有 dataUri：</strong><code>/ask</code> 只在 <code>source</code> 非空时渲染链接；粘贴内容的 <code>source</code> 是 null，所以只显示 <code>docTitle</code>。唯一指针在 <code>resourceId</code> / <code>dataUri</code> 里，<code>/recall</code> 抽屉会显示，<code>/ask</code> 不显示——这是 AC「自动来源标识」的残差，不是代码笔误。</li>\n    <li><strong>抽屉的 a11y 不是 2.4 的功劳：</strong>portal、焦点归还、Esc、Tab 圈、滚动锁都在共享 <code>Drawer</code> 里；2.4 只负责内容和 open 状态。后来还有 2026-10-21 build5 的 a11y 补丁，不要把那些细节算进本 Story。</li>\n    <li><strong>字符级高亮没做：</strong><code>activeChunkId</code> 只让右栏整行加底色和竖线；正文里不会把命中的那句话涂黄。2.4 的 AC 把字符级高亮列为增强项，当前不欠账。</li>\n    <li><strong>GET 路由已经换人：</strong>2.4 当时是 <code>routes/resources/resources.ts</code> 手写 <code>GET /:id</code>，Epic 3 pre-3.2 换成 hono-crud read。今天如果改响应信封（不再是 <code>{ resource }</code>），<code>fetchResource</code> 会抛形状错误，抽屉的「已删除」判断会静默失效。</li>\n  </ul>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">08 · VERIFY</span>\n    <h2>可复制的验证命令</h2>\n    <p class=\"section-sub\">每条都标了「本轮真跑 / 历史真跑 / 本轮未跑」。不要把「代码路径存在」当成「已经跑过」。</p>\n  </header>\n\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>1. 看 2.4 当时的路由提交 <span class=\"badge b-now\">本轮真跑</span></h3>\n      <pre class=\"snippet\">git -C app/server show 2b19bea -- src/routes/resources/resources.ts</pre>\n      <p class=\"table-note\">期望看到 <code>app.get('/:id')</code> 这一段：<code>repo.getResource</code> → 有值返回 <code>{ resource }</code>，没有返回 404 <code>E_NOT_FOUND</code>，异常 500 <code>E_READ</code>。该文件在提交里共 22 行变更。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>2. 当前 GET /resources/:id <span class=\"badge b-now\">本轮未跑</span></h3>\n      <pre class=\"snippet\">curl -s http://127.0.0.1:3000/resources/&lt;id&gt; | jq .</pre>\n      <p class=\"table-note\">期望 200 + <code>resource</code> 对象；不存在或已软删 404。当前由 hono-crud read 提供，404 的 body 形状由它的错误信封决定；前端只看 status。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>3. 删除后回查（用一次性资源） <span class=\"badge b-now\">本轮未跑</span></h3>\n      <pre class=\"snippet\">curl -s -o /dev/null -w '%{http_code}\\n' -X DELETE http://127.0.0.1:3000/resources/&lt;id&gt;\ncurl -s -o /dev/null -w '%{http_code}\\n' http://127.0.0.1:3000/resources/&lt;id&gt;</pre>\n      <p class=\"table-note\">期望先 204、再 404。然后回 <code>/ask</code> 打开历史回答里的引用，抽屉应出现「来源已删除 · 以下为回答时的快照」，正文仍可读。删除是破坏性操作，别拿正在用的资源试。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>4. chunks 分页是另一条路 <span class=\"badge b-pre\">历史真跑</span></h3>\n      <pre class=\"snippet\">curl -s 'http://127.0.0.1:3000/resources/&lt;id&gt;/chunks?page=1&amp;per_page=2' | jq '{n: (.chunks|length), page: .pagination.page, total: .pagination.total_count}'</pre>\n      <p class=\"table-note\">2026-10-23 真跑过分页（<code>page=99</code> 会收敛到末页，<code>search</code> 是字面量匹配）。这条属于资源详情抽屉，不是 2.4 的命中抽屉；列在这里是为了区分两条读路径。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>5. 抽屉/引用组件测试 <span class=\"badge b-pre\">历史真跑</span></h3>\n      <pre class=\"snippet\">cd app/web &amp;&amp; npx vitest run src/components/drawer/drawer.test.tsx src/components/chat-thread/chat-thread.test.tsx</pre>\n      <p class=\"table-note\">2026-10-21 全量是 317/318，唯一红是 <code>sessions-hydrate-empty.test.ts</code> 的既有规则变化，与 2.4 无关。本轮没有重跑测试，只做静态构建校验。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>6. 类型检查 + 浏览器手测 <span class=\"badge b-pre\">历史真跑 / 归 Lynx</span></h3>\n      <pre class=\"snippet\">cd app/web &amp;&amp; npx tsc --noEmit\ncd app/server &amp;&amp; npx tsc --noEmit</pre>\n      <p class=\"table-note\">2026-10-21 / 2026-10-23 两次都记录为 0 错；本轮未重跑。浏览器手测：问一句 → 点 [n] / 命中行 → 看块号与偏移 → 删一条被引用的资源 → 回历史回答重开抽屉。视觉与真实点击归 Lynx。</p>\n    </article>\n  </div>\n\n  <div class=\"callout\"><strong>本轮实际做过的验证：</strong>只读代码、<code>git log/show</code>、<code>git diff</code>，以及本页的 <code>build.mjs</code> + <code>validate.mjs</code>。没有开浏览器、没有跑前后端测试、没有启动服务。</div>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">09 · CONTINUITY</span>\n    <h2>与前后 story 的衔接</h2>\n    <p class=\"section-sub\">2.4 不是从零长出来的：它接 2.3 的编号、2.6 的快照、2.5 的持久化；后来又被 Epic 3 的 CRUD 重构换掉一段读路径。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead><tr><th>时点</th><th>交接内容</th><th>对 2.4 的影响</th></tr></thead>\n    <tbody>\n      <tr><td>2.3 → 2.4</td><td>[n] / 8 位 chunkId 解析、首次出现编号、越界纯文本、右栏命中行</td><td>2.4 只接「点击后开抽屉」，不重做编号</td></tr>\n      <tr><td>2.5</td><td>messages 表以 parts 为真源；历史按会话回读</td><td>刷新/切会话后快照还在，已删来源的降级才有意义</td></tr>\n      <tr><td>2.6</td><td>检索工具化；tool output 换成完整 12 字段投影</td><td>抽屉的 content / chunkIndex / offsets / source 全部来自这里</td></tr>\n      <tr><td>Epic 3 pre-3.2</td><td>Drizzle + hono-crud 接管四表 CRUD；删除手写 GET /:id</td><td>当前 <code>GET /resources/:id</code> 由 read + softDelete 提供，响应仍是 <code>{ resource }</code></td></tr>\n      <tr><td>3.3 / 3.4</td><td>retrieve / ingest 的阶段轨迹与 trace 面板</td><td>不属于本页；抽屉里没有 stage 视图</td></tr>\n      <tr><td>P2 · 2026-10-23</td><td>资源详情 chunks 分页 + 搜索</td><td>只改资源管理抽屉；命中抽屉仍读快照，不请求 chunks</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">NOW</span><h3>2.4 的完成状态</h3><p>sprint-status 标 done：2026-10-20 对账「点引用/命中行开抽屉、content + 块号/偏移 + source 已落」；2026-10-21 收口「chunkId 不存在不再要求 410，按快照可看 + 标注处理」。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">NEXT</span><h3>下一格会怎么用它</h3><p>Epic 4 的资源画像、Markdown/表格渲染不依赖这扇抽屉；如果以后要做字符级高亮或 chunk 级删除探测，入口都在 <code>openHit</code> 与 <code>fetchResource</code> 这一层。</p></article>\n  </div>\n\n  <div class=\"callout strong\"><strong>留给下一轮的未核实项：</strong>\n    <ul>\n      <li>Lynx 浏览器手测仍未做：删一条被引用过的 Resource，回看历史回答、打开抽屉，确认提示出现且内容可读（deferred-work 已记）。</li>\n      <li>粘贴内容在 <code>/ask</code> 抽屉只显示标题，不显示 <code>urn:kc:paste:...</code>；AC 的「命名 + 时间/内容指纹」目前落在标题与唯一 dataUri 上，没有可见时间戳。</li>\n      <li>「来源已删除」只探测 Resource，不探测单个 chunk；chunk 单独消失不会触发标注。</li>\n      <li>字符级高亮未实现；当前只有右栏整行高亮。</li>\n      <li>当前 <code>GET /resources/:id</code>（hono-crud read）本轮没有真跑；2.4 当时的手写路由已用 git show 核对。</li>\n    </ul>\n  </div>\n</section>"
    },
    {
      "type": "html",
      "html": "\n<footer class=\"footer\">\n  <p>Story 2.4 走读页 · 代码来自当前工作区（2026-10-24 读取）· 静态校验通过后由 Lynx 浏览器复核。</p>\n  <p>相关工件：<code>_Agents/walkthroughs/.runs/epic2-story4/walkthrough.config.mjs</code>、<code>.memlog.md</code>、<code>validation.txt</code>。</p>\n</footer>"
    }
  ]
}
