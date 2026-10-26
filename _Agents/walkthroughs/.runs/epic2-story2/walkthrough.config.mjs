export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic2-story2-streaming.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 2 · Story 2.2 流式输出与 Loading · 带代码逐行讲解",
  "tocTitle": "Story 2.2",
  "tocSub": "UI Message Stream · useChat · Loading",
  "accent": "#1d4ed8",
  "accent2": "#1e40af",
  "accentDark": "#93c5fd",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>Knowledge Copilot</span><span>·</span><span>Epic 2</span><span>·</span><span>2026-10-21 收口</span></div>\n  <h1>Story 2.2：<em>流式输出与 Loading</em></h1>\n  <p class=\"hero-sub\">一次提问不再等一整段 JSON：服务端把 AI SDK 的 <code>UI Message Stream</code> 铺在 SSE 上，前端 <code>useChat</code> 逐帧把 <code>text-delta</code> 拼成回答。Loading、错误、停止与「回答未完整」都在这一条流上收口；超时三旋钮没有落，页面会明确标 deferred。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>2.2</strong> done · 2026-10-21</span>\n    <span class=\"chip\">server <code>7895c31</code></span>\n    <span class=\"chip\">web <code>b9ad65e</code></span>\n    <span class=\"chip\">timeout <strong>deferred</strong></span>\n  </div>\n  <div class=\"trace-pill\"><b>POST /chat → 200 text/event-stream → data: {...} → useChat parts</b><span>逐帧 JSON chunk；不是一次性 JSON 响应</span></div>\n</header>\n\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\"><span class=\"kicker\">TL;DR</span><h2>先给结论与边界</h2><p class=\"section-sub\">2.2 交付的是「流怎么发、前端怎么收、收流时怎么反馈」；引用、会话历史、检索工具、Langfuse 都是后续 story 的补丁。</p></header>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01</span><h3>输出协议</h3><p><code>streamText</code> 产生模型 part，<code>toUIMessageStream</code> 翻成 UI chunk，<code>createUIMessageStreamResponse</code> 包成 <code>text/event-stream</code>。每个 <code>data:</code> 行是一帧带 <code>type</code> 的 JSON，最后有 <code>data: [DONE]</code>。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02</span><h3>前端状态机</h3><p><code>useChat</code> 的 status 走 <code>submitted → streaming → ready/error</code>。Loading 在 <code>submitted</code> 就出现；<code>text-delta</code> 追加到 assistant 消息的 text part；手动停止不产生 error，要自己标半截。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03</span><h3>边界与缺口</h3><p>2.3 引用、2.5 会话历史、2.6 检索工具、3.2 Langfuse 都不算 2.2。超时三条款（首 token / inter-token / 总时长）整体 deferred；<code>CHAT_TIMEOUT_*</code> 在 <code>src/</code> 零命中。</p></article>\n  </div>\n\n  <div class=\"callout strong\"><strong>最容易误会的一条：</strong><code>dda283c</code> 的标题是「story 2-2 dev1」，但 diff 大半是 2.1 的检索、路由与装配；真正的流式主体在 <code>7895c31</code>（2026-10-16）。前端 2.2 在 <code>b9ad65e</code>，标题只写「build 3」。<strong>commit 标题不能当交付边界，diff 才能。</strong></div>\n\n  <table class=\"file-table\">\n    <thead><tr><th style=\"width:50%\">2.2 owns（本页要讲清的）</th><th>不算 2.2（后续/前置补丁）</th></tr></thead>\n    <tbody>\n      <tr>\n        <td>\n          ① AI SDK UI Message Stream 输出：2.2 原样是 <code>Result.toUIMessageStreamResponse()</code>；当前拆成 <code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code> 是 3.2 的补丁；<br>\n          ② 前端 <code>useChat</code> 逐字渲染：<code>Chat</code> 实例、transport、text parts；<br>\n          ③ 首 token 前的可见 Loading；<br>\n          ④ 错误 / 中断 / 取消的可理解提示；<br>\n          ⑤ 同一 Session 不交错两条流（客户端 stop 守卫）；<br>\n          ⑥ 流开始前的 HTTP 错误映射。\n        </td>\n        <td>\n          · 2.1：检索、<code>/retrieve</code>、三条确定性答案体；<br>\n          · 2.3：<code>[n]</code>、引用面板、tool part 解析；<br>\n          · 2.4：原文抽屉；<br>\n          · 2.5：sessions/messages、历史回灌、<code>{query, sessionId}</code>、onEnd 落库；<br>\n          · 2.6：<code>retrieve</code> 工具、<code>stopWhen</code>、instructions、<code>tool-retrieve</code> part；<br>\n          · 3.2：Langfuse/telemetry、trace 收口、当前未提交的 stream 拆分；<br>\n          · 超时三条款：deferred，未实现。\n        </td>\n      </tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\"><strong>超时条款如实写：</strong>AC 要求首 token / inter-token / 总时长超时；Lynx 2026-10-15 定「超时最后再加，先把 SDK 跑通」，<code>CHAT_TIMEOUT_*</code> 从 config 删除，<code>streamText</code> 仍无 <code>timeout</code>。因此本页不会把「两个 token 间隔过长自动标未完整并关连接」写成已实现。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 06</span>\n    <h2>一眼看懂：一次流式问答的往返</h2>\n    <p class=\"section-sub\">从 useChat 发问，到 UI chunks 逐字回来。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>1</strong>条流</span><span class=\"chip\"><strong>1</strong>个 session</span><span class=\"chip\"><strong>3</strong>种状态</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic2-story2-streaming.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 2.2 一次流式问答的往返\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:932 / 557;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic2-story2-streaming.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>路由只校验 body 与会话，生成交给 ChatService；历史由服务端读库。</li><li>首 chunk 前是 loading；submitted/streaming 都算忙。</li><li>error/abort 以流内帧收口；同一 Session 不交错两条流。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画超时三旋钮；它们仍 deferred。</div>\n</section>\n\n\n<section class=\"section\" id=\"map\">\n  <header class=\"section-head\"><span class=\"kicker\">MAP</span><h2>一条流的全局地图</h2><p class=\"section-sub\">左边是服务端四步，右边是浏览器四步；中间那条线是 SSE。</p></header>\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>服务端：把模型流翻成 UI 流</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">POST /chat <span class=\"badge b-now\">2.2</span></li>\n        <li>校验 body + 会话 + 信号 <code>routes/chat.ts</code></li>\n        <li>读历史 / 落 user <span class=\"badge b-now\">2.5</span></li>\n        <li><code>streamText</code> + tools <span class=\"badge b-now\">2.6</span></li>\n        <li><code>toUIMessageStream</code> <span class=\"badge b-32\">3.2</span></li>\n        <li><code>createUIMessageStreamResponse</code> <span class=\"badge b-32\">3.2</span></li>\n        <li>SSE: <code>data: {\"type\":\"text-delta\",...}</code></li>\n      </ul>\n      <p class=\"map-note\">HTTP 200 在返回 Response 时就定了；之后的模型错误只能走流内 <code>error</code> 帧。</p>\n    </div>\n    <div class=\"flow-card\">\n      <h3>浏览器：把帧拼回消息</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">useChat({ chat }) <span class=\"badge b-now\">2.2</span></li>\n        <li><code>DefaultChatTransport</code> 发 POST</li>\n        <li>status <code>submitted</code>：先出 Loading</li>\n        <li>逐帧 <code>text-delta</code> → message.parts</li>\n        <li>status <code>streaming</code>：打字光标</li>\n        <li>status <code>ready</code> / <code>error</code></li>\n        <li>错误 Banner / 「回答未完整」</li>\n      </ul>\n      <p class=\"map-note\">同一 sessionId 复用同一只 <code>Chat</code>；切页、切会话不换实例，正在流的半条不会丢。</p>\n    </div>\n  </div>\n  <div class=\"callout\"><strong>一句话区分：</strong>SSE 是传输层（HTTP 分块 + <code>data:</code> 事件）；UI Message Stream 是应用层协议（每帧 JSON 的 <code>type</code> 定义 start/text-delta/tool/error/finish）。<strong>它不是「一个 JSON 对象分几次写」</strong>，而是「一串各自独立的 JSON 事件」。</div>\n</section>\n\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\"><span class=\"kicker\">GLOSSARY</span><h2>小白词典</h2><p class=\"section-sub\">先把这 9 个词说清楚，后面的代码就不猜了。</p></header>\n  <dl class=\"glossary\">\n    <div class=\"gloss\"><dt>SSE</dt><dd>Server-Sent Events。HTTP 响应不结束，服务端持续写 <code>data: ...</code> 行；浏览器按事件接收。适合单向推送。</dd></div>\n    <div class=\"gloss\"><dt>frame（帧）</dt><dd>SSE 里的一次事件：一行或多行 <code>data:</code>，以空行结束。本页每条 <code>data:</code> 是一个 JSON chunk。</dd></div>\n    <div class=\"gloss\"><dt>UI Message Stream</dt><dd>AI SDK 定义的应用层协议。chunk 的 <code>type</code> 有 <code>start</code>、<code>text-delta</code>、<code>tool-input-available</code>、<code>error</code>、<code>abort</code>、<code>finish</code> 等；<code>useChat</code> 按这些语义更新消息。</dd></div>\n    <div class=\"gloss\"><dt>UIMessage / parts</dt><dd>前端的一条消息不是 <code>text: string</code>，而是 <code>{ role, parts: [...] }</code>。text、reasoning、<code>tool-retrieve</code>、data part 都住在这个数组里。</dd></div>\n    <div class=\"gloss\"><dt>text-delta</dt><dd>一段增量文字。多个 delta 追加到同一个 text part；ChatThread 每来一帧就多渲染几个字，这就是「逐字」。</dd></div>\n    <div class=\"gloss\"><dt>tool part</dt><dd><code>tool-retrieve</code> 这类 part 记录模型调用工具的四态：input-streaming / input-available / output-available / output-error。它是 2.6 的交付，不是 2.2 的 data part。</dd></div>\n    <div class=\"gloss\"><dt>data part / transient</dt><dd><code>data-*</code> 是自定义数据 part。<code>transient: true</code> 表示只实时通知，<strong>不写进 message.parts</strong>，所以不会进历史、刷新后消失。</dd></div>\n    <div class=\"gloss\"><dt>submitted / streaming / ready / error</dt><dd><code>useChat</code> 的四态：请求已发、首块未到 / 正在收块 / 正常结束或已取消 / 失败。Loading 看前两态。</dd></div>\n    <div class=\"gloss\"><dt>error 帧 vs abort 帧</dt><dd><code>{\"type\":\"error\",\"errorText\":\"...\"}</code> 会让 <code>useChat().error</code> 有值；<code>{\"type\":\"abort\"}</code> 只是中止标记，客户端不一定会报错——这是本页要讲清的关键差别。</dd></div>\n  </dl>\n</section>\n\n"
    },
    {
      "type": "journey",
      "id": "journey",
      "kicker": "WALK",
      "title": "一次流的旅行",
      "subtitle": "从浏览器按下发送，到消息变成 parts、光标出现、错误被标成半截；点一步跳到真实代码行。",
      "hint": "正常路径是 1→8；第 9、10 步是出错与忙时重问，故意放在后面。",
      "steps": [
        {
          "goto": "route-chat-file:37-48",
          "title": "浏览器发 POST /chat",
          "note": "query + sessionId；坏 body 先被挡成 JSON 400",
          "code": "route 37–48"
        },
        {
          "goto": "route-chat-file:50-54",
          "title": "确认会话，交信号",
          "note": "c.req.raw.signal 是取消链的起点",
          "code": "route 50–54"
        },
        {
          "goto": "chat-stream-file:57-69",
          "title": "读历史 + 落 user",
          "note": "2.5 补丁；2.2 时只发当前 prompt",
          "code": "chat 57–69"
        },
        {
          "goto": "chat-stream-file:72-84",
          "title": "streamText 开流",
          "note": "abortSignal / tools / telemetry 各归各的 story",
          "code": "chat 72–84"
        },
        {
          "goto": "chat-stream-file:86-92",
          "title": "翻成 UI chunk",
          "note": "text-delta 等；onError 决定客户端看到的文案",
          "code": "chat 86–92"
        },
        {
          "goto": "chat-finish-file:137-137",
          "title": "包成 SSE Response",
          "note": "200 已定，后面错误只能走流内 error",
          "code": "chat 137"
        },
        {
          "goto": "web-chat-api-file:28-33",
          "title": "前端 transport",
          "note": "useChat 发请求，status 进 submitted",
          "code": "api 28–33"
        },
        {
          "goto": "web-ask-state-file:166-181",
          "title": "Loading 判据",
          "note": "generating 含 submitted；streamingId 不给旧回答",
          "code": "ask 166–181"
        },
        {
          "goto": "web-thread-file:117-123",
          "title": "逐字渲染",
          "note": "每个 text-delta 追加到 text part；光标只挂流中的那条",
          "code": "thread 117–123"
        },
        {
          "goto": "web-ask-state-file:128-142",
          "title": "错误/断流收口",
          "note": "只有最后一条是 assistant 才 markCut",
          "code": "ask 128–142"
        },
        {
          "goto": "web-ask-state-file:261-292",
          "title": "忙时再问",
          "note": "先 stop；800ms 停不干净就不发",
          "code": "ask 261–292"
        }
      ]
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\"><span class=\"kicker\">FILES</span><h2>文件地图与 story 归属</h2><p class=\"section-sub\">同一份当前代码里混着 2.2 与后续补丁；这张表先说清每一行该记在谁账上。</p></header>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>这一页要看什么</th><th>归属</th></tr></thead>\n    <tbody>\n      <tr><td><code>app/server/src/routes/chat.ts</code></td><td>校验、会话存在、把 <code>c.req.raw.signal</code> 交给 ChatService，返回 SDK 的 Response。</td><td><span class=\"badge b-now\">2.2</span> + <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/server/src/agent/chat/chat.ts</code></td><td><code>streamText</code>、<code>toUIMessageStream</code>、<code>onError</code>、<code>onEnd</code>；流式主体。</td><td><span class=\"badge b-now\">2.2</span> + 2.5 / 2.6 / <span class=\"badge b-32\">3.2</span></td></tr>\n      <tr><td><code>app/server/src/config.ts</code></td><td><code>CHAT_MODEL</code> 必填；<strong>没有</strong> <code>CHAT_TIMEOUT_*</code>。</td><td><span class=\"badge b-now\">2.2</span> + deferred</td></tr>\n      <tr><td><code>app/server/src/agent/tool/tools/retrieve.ts</code></td><td><code>tool-retrieve</code> part 的来源；2.3 从这里读命中。</td><td><span class=\"badge b-now\">2.6</span>（上下文）</td></tr>\n      <tr><td><code>app/web/src/api/chat.ts</code></td><td>transport、<code>chatFor</code> 登记表、<code>chatErrorText</code>。</td><td><span class=\"badge b-now\">2.2</span> + <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/web/src/routes/ask.tsx</code></td><td><code>useChat</code>、Loading、错误 Banner、停止、忙时重问。</td><td><span class=\"badge b-now\">2.2</span> + 2.3 / 2.5 / 2.6</td></tr>\n      <tr><td><code>app/web/src/components/chat-thread/chat-thread.tsx</code></td><td>parts → 文本、光标、「回答未完整」。</td><td><span class=\"badge b-now\">2.2</span> + <span class=\"badge b-now\">2.3</span></td></tr>\n      <tr><td><code>app/web/src/api/chat.test.ts</code></td><td>用真的 SSE 文本钉请求体与流消费。</td><td><span class=\"badge b-now\">2.2</span> + <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/server/test/legacy/probe-stream-wire.ts</code></td><td>2.2 的探针：transient data part、error/abort 帧。</td><td><span class=\"badge b-app\">附录</span>（不进版本控制）</td></tr>\n      <tr><td><code>app/server/test/chat-tool-flow.test.ts</code></td><td>从真实 SSE 文本里 parse 帧，验证 tool part。</td><td><span class=\"badge b-now\">2.6</span>（上下文）</td></tr>\n    </tbody>\n  </table>\n  <p class=\"table-note\">工作区提醒：<code>app/server</code> 与 <code>app/web</code> 都有 Epic 3 未提交改动；本页用 <code>git diff</code> 区分，并在 <code>chat.ts</code> 的 stream 拆分处标了 <span class=\"badge b-32\">3.2</span>。</p>\n</section>\n\n<section class=\"section\" id=\"code-and-annotations\">\n  <header class=\"section-head\"><span class=\"kicker\">CODE</span><h2>代码与逐行讲解</h2><p class=\"section-sub\">左边是当前工作区真实文件（行号即文件行号），右边是可点的讲解。徽章 <span class=\"badge b-now\">2.2</span> 是本 story；<span class=\"badge b-now\">2.5</span>/<span class=\"badge b-now\">2.6</span>/<span class=\"badge b-32\">3.2</span>/<span class=\"badge b-app\">附录</span> 是后续或前置补丁。</p></header>\n  <div class=\"callout\"><strong>阅读顺序：</strong>先看 01–03（服务端从请求到 SSE），再看 06–09（前端从 fetch 到 DOM），最后看 04/05（配置与 2.6 工具上下文）和 10/11（测试与探针）。代码块里的 <code>…</code> 是省略行，不是代码。</div>\n</section>\n"
    },
    {
      "type": "code",
      "section": {
        "id": "route-chat",
        "kicker": "SERVER · 01",
        "title": "路由：校验、会话、把请求信号带进流",
        "subtitle": "薄薄一层：错误在流开始前是 JSON，流开始后是 error 帧。",
        "body": "<div class=\"callout\">这一块只有 2.2 的「信号 + 返回 Response」和 2.5 的「sessionId」；检索不在这里（2.6 移到工具里）。</div>",
        "blocks": [
          {
            "id": "route-chat-file",
            "file": "app/server/src/routes/chat.ts",
            "lang": "ts",
            "source": "src/routes/chat.ts",
            "ranges": [
              [
                1,
                8
              ],
              [
                37,
                58
              ]
            ],
            "notes": [
              {
                "lines": "1-8",
                "title": "路由的职责边界",
                "badge": "2.2",
                "body": "<p>文件头把三件事写死：校验 body、确认会话存在、把 <code>ChatService</code> 返回的 <code>Response</code> 原样交给 Hono。今天 body 多了 2.5 的 <code>sessionId</code>；2.2 时只有 <code>query</code>。检索在 2.6 移进工具，所以这里不再装配 Retriever，也没有维度状态码。</p>"
              },
              {
                "lines": "38-48",
                "title": "流开始前的错误都是 JSON",
                "badge": "2.5",
                "body": "<p><code>query</code> 与 <code>sessionId</code> 都必须是字符串；空 query 回 400 <code>E_EMPTY_QUERY</code>；sessionId 非 UUID 回 400 <code>E_BAD_ID</code>。这些判断都在 <code>chat.ask</code> 之前，所以响应是普通 JSON，不是 SSE。2.2 只校验 query；sessionId 是 2.5 加的。</p>"
              },
              {
                "lines": "50-54",
                "title": "c.req.raw.signal：取消链的起点",
                "badge": "2.2",
                "body": "<p><code>c.req.raw.signal</code> 是浏览器连接的 <code>AbortSignal</code>。用户点停止、刷新、关页，或前端 <code>chat.stop()</code>，都会让它 abort；它被一路传给 <code>streamText</code> 的 <code>abortSignal</code>，上游请求随之中断。这是 2.2「同一 Session 不交错两条流」的底层机制之一。</p>"
              },
              {
                "lines": "55-58",
                "title": "流开始后只能走 error 帧",
                "badge": "2.2",
                "body": "<p>这里的 500 只覆盖 <code>chat.ask</code> 还没返回 Response 的失败。一旦 Response 返回、headers 发出，HTTP 状态已经定死为 200；模型中途报错只能由 <code>toUIMessageStream</code> 发 <code>error</code> 帧，前端 <code>useChat().error</code> 才会有值。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "chat-stream",
        "kicker": "SERVER · 02",
        "title": "ChatService：把模型流翻成 UI chunk",
        "subtitle": "2.2 的核心五行在 72–92：streamText → toUIMessageStream → onError。",
        "body": "<div class=\"callout\">这一块混着 2.5（历史/消息）、2.6（tools/stopWhen）、3.2（telemetry/trace）和 2026-10-20 的 DI 补丁；每个 note 都标了归属。</div>",
        "blocks": [
          {
            "id": "chat-stream-file",
            "file": "app/server/src/agent/chat/chat.ts",
            "lang": "ts",
            "source": "src/agent/chat/chat.ts",
            "ranges": [
              [
                25,
                99
              ]
            ],
            "notes": [
              {
                "lines": "25-38",
                "title": "DI 装配与 2.6 的工具",
                "badge": "2.6",
                "body": "<p>2026-10-20 的 DI 补丁把 <code>ChatHandle</code>、<code>RetrieverHandle</code>、<code>PostgresRepo</code> 注进来；<code>tools</code> 是 2.6 的 <code>retrieve</code> 工具，构造期建一次。2.2 时这里只有 model，没有 tools；不要把这段当 2.2 的实现。</p>"
              },
              {
                "lines": "40-55",
                "title": "ask 的三个输入",
                "badge": "2.2",
                "body": "<p><code>Query</code> 是提问；<code>SessionId</code> 是 2.5 才进来的；<code>Signal</code> 是 2.2 的取消通道。trace 相关（<code>currentTraceId</code>、<code>beginChat</code>、<code>setTraceSession</code>）是 <span class=\"badge b-32\">3.2</span> 的补丁，别混进流式主体。</p>"
              },
              {
                "lines": "57-69",
                "title": "2.5 的历史回灌",
                "badge": "2.5",
                "body": "<p>2.5 起，历史由服务端按 sessionId 读库，<code>storedUiMessage</code> 只保留 text parts，再交给 <code>convertToModelMessages</code>。2.2 的实现是 <code>streamText({ prompt })</code>，只发当前提问，没有 messages/history。</p>"
              },
              {
                "lines": "72-84",
                "title": "streamText：开始生成",
                "badge": "2.2",
                "body": "<p><code>streamText</code> 是生成入口；<code>abortSignal</code> 让停止生效（2.2）。<code>tools</code> 与 <code>stopWhen</code> 是 2.6；<code>instructions</code> 是 2.6；<code>telemetry</code> 是 <span class=\"badge b-32\">3.2</span>。<strong>注意这里有两个 onError</strong>：本段的 onError 只记日志、给 trace 判状态；客户端看到的文案由下一段的 onError 决定。</p>"
              },
              {
                "lines": "86-92",
                "title": "toUIMessageStream：模型 part → UI chunk",
                "badge": "3.2",
                "body": "<p><code>toUIMessageStream</code> 把模型层的 part 翻成 UI chunk：<code>text-delta</code>、<code>tool-input-available</code>、<code>tool-output-available</code>、<code>error</code>、<code>abort</code>、<code>finish</code> 等。<code>onError: () =&gt; '问答失败'</code> 是客户端唯一能看到的错误文案。当前把 <code>toUIMessageStream</code> 与下一块的 <code>createUIMessageStreamResponse</code> 拆开写，是 Epic 3 未提交改动；2.2 原样是 <code>Result.toUIMessageStreamResponse()</code>。</p>"
              },
              {
                "lines": "93-99",
                "title": "onEnd 的前半：先判中断",
                "badge": "2.5",
                "body": "<p><code>onEnd</code> 的 Event 带 <code>isAborted</code>、<code>isCancelled</code>、<code>outcome</code>；这三者决定 trace 的 <code>cancelled</code> 状态（3.2）。2.5 在 121 行直接 <code>return</code>，所以中断/取消不落 assistant。2.2 没有这段落库逻辑。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "chat-finish",
        "kicker": "SERVER · 03",
        "title": "流结束：中断不落库，正常才写 assistant",
        "subtitle": "onEnd 的 121–147 与最后的 Response；半截回答只活在浏览器。",
        "body": "<div class=\"callout\">这一段是 2.5 的补丁，但它解释了一个 2.2 用户能观察到的现象：手动停止后刷新，半截回答不见了——因为库里只留了 user 消息。</div>",
        "blocks": [
          {
            "id": "chat-finish-file",
            "file": "app/server/src/agent/chat/chat.ts",
            "lang": "ts",
            "source": "src/agent/chat/chat.ts",
            "ranges": [
              [
                121,
                148
              ]
            ],
            "notes": [
              {
                "lines": "121-134",
                "title": "中断/取消直接 return",
                "badge": "2.5",
                "body": "<p>取消或中断时直接返回：库里只留 user 消息，半截回答只在浏览器内存里。正常结束才把 <code>responseMessage.parts</code> 整份写进 <code>messages</code>，包括 2.6 的 <code>tool-retrieve</code> part。所以刷新后历史里看不到半截 assistant，也看不到取消那次的回答。</p>"
              },
              {
                "lines": "137-137",
                "title": "createUIMessageStreamResponse：包成 SSE",
                "badge": "3.2",
                "body": "<p>这一行把 chunk 流包成标准 SSE Response：<code>content-type: text/event-stream</code>、<code>x-vercel-ai-ui-message-stream: v1</code>、逐帧 <code>data:</code>，最后 <code>data: [DONE]</code>。HTTP 状态在这一刻已经定死为 200；之后的错误只能走流内 <code>error</code> 帧。</p>"
              },
              {
                "lines": "141-147",
                "title": "历史只回灌正文",
                "badge": "2.5",
                "body": "<p>2.5 的 <code>storedUiMessage</code> 只取 text parts：上一条 assistant 的 <code>tool-retrieve</code> 输出虽然已经落库，但不再回灌给模型，避免旧 chunk 被再次引用、也避免整份命中全文撑爆 token。这和 transient data part「根本不进 parts」是两回事。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "config-chat",
        "kicker": "SERVER · 04",
        "title": "配置：有 CHAT_MODEL，没有超时三旋钮",
        "subtitle": "超时是 deferred，不是漏读；这里用「没有」来证明。",
        "body": "<div class=\"callout strong\"><strong>本页最重要的一条如实记录：</strong>AC 的 firstChunk / inter-token / total 三条款没有落。下面这段代码里找不到任何 <code>CHAT_TIMEOUT_*</code>，<code>streamText</code> 也没有 <code>timeout</code> 参数。</div>",
        "blocks": [
          {
            "id": "config-chat-file",
            "file": "app/server/src/config.ts",
            "lang": "ts",
            "source": "src/config.ts",
            "ranges": [
              [
                17,
                31
              ],
              [
                37,
                41
              ],
              [
                50,
                61
              ]
            ],
            "notes": [
              {
                "lines": "18-30",
                "title": "2.2 的配置面",
                "badge": "2.2",
                "body": "<p>2.2 只要求 <code>CHAT_MODEL</code> 存在，不再认 <code>CHAT_PROVIDER</code>；provider/model 由 <code>adapter/provider/registry</code> 与 <code>adapter/model/registry</code> 解析。字段列表里没有超时相关项。</p>"
              },
              {
                "lines": "37-41",
                "title": "缺 CHAT_MODEL 就 fail-fast",
                "badge": "2.2",
                "body": "<p><code>CHAT_MODEL</code> 与 DATABASE_URL、OLLAMA_BASE_URL、EMBEDDING_MODEL 一起是必需项；缺失走 <code>E_CONFIG_MISSING</code> 并退出。2.2 把 <code>chatModel</code> 从可选改成必填，这是流式能启动的前提之一。</p>"
              },
              {
                "lines": "50-61",
                "title": "这里没有超时三旋钮",
                "badge": "现状",
                "body": "<p><code>retrieval*</code> 是检索参数，不是聊天超时。没有 <code>CHAT_TIMEOUT_FIRST_CHUNK_MS</code>、<code>CHAT_TIMEOUT_CHUNK_MS</code>、<code>CHAT_TIMEOUT_TOTAL_MS</code>；<code>grep -rn \"CHAT_TIMEOUT\\\\|firstChunkMs\\\\|chunkMs\\\\|totalMs\" app/server/src</code> 零命中。这是 deferred-work 的定论证据，不是本页漏写。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "tool-retrieve",
        "kicker": "SERVER · 05",
        "title": "tool-retrieve：命中怎么变成 part（2.6，上下文）",
        "subtitle": "2.2 时命中是另一条 /retrieve 请求；2.6 把它移进同一条流。",
        "body": "<div class=\"callout\">这一块不属于 2.2 的交付，但必须放进来：否则读者会以为 2.2 的流里已经有 <code>tool-retrieve</code> part。2.3 的引用、2.4 的抽屉都从这里读。</div>",
        "blocks": [
          {
            "id": "tool-retrieve-file",
            "file": "app/server/src/agent/tool/tools/retrieve.ts",
            "lang": "ts",
            "source": "src/agent/tool/tools/retrieve.ts",
            "ranges": [
              [
                21,
                62
              ]
            ],
            "notes": [
              {
                "lines": "21-27",
                "title": "工具名决定 part 名",
                "badge": "2.6",
                "body": "<p>工具键名是 <code>retrieve</code>，SDK 序列化后 part 类型就是 <code>tool-retrieve</code>；前端 <code>api/chat.ts</code> 的 <code>RETRIEVE_TOOL</code> 必须与它一致，改名要两头一起改。2.2 没有这个工具。</p>"
              },
              {
                "lines": "28-38",
                "title": "检索错误变成结构化 output",
                "badge": "2.6",
                "body": "<p><code>RetrieverError</code> 被 catch 后返回 <code>{ hits: [], ..., error: { code, message } }</code>，而不是抛出。这样模型能读到错误原文并复述，前端也能在 <code>referencesOf</code> 里把它标成 <code>failed</code>。非 <code>RetrieverError</code> 才记日志后重抛，避免把真 bug 洗成拒答。</p>"
              },
              {
                "lines": "43-62",
                "title": "输出投影：2.3 的数据源",
                "badge": "2.6",
                "body": "<p>输出含 <code>chunkId</code>、<code>content</code>、<code>score</code>、<code>similarity</code> 等完整投影。2.3 的 <code>[n]</code> 与 2.4 的抽屉都从这份 <code>tool-retrieve</code> output 读，<strong>不是</strong> 2.2 计划里的 <code>sources</code> data part。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-chat-api",
        "kicker": "WEB · 06",
        "title": "api/chat.ts：一只会话一只 Chat",
        "subtitle": "2.2 的前端入口：transport + 模块级登记表 + 错误文案。",
        "body": "<div class=\"callout\">这一层不做渲染，只负责「同一 sessionId 永远拿到同一只 <code>Chat</code>」。这是切换页面/会话时正在流的半条不丢、以及下一块 stop 守卫能生效的前提。</div>",
        "blocks": [
          {
            "id": "web-chat-api-file",
            "file": "app/web/src/api/chat.ts",
            "lang": "ts",
            "source": "web:src/api/chat.ts",
            "ranges": [
              [
                1,
                12
              ],
              [
                28,
                45
              ]
            ],
            "notes": [
              {
                "lines": "1-12",
                "title": "模块级登记表的意义",
                "badge": "2.2",
                "body": "<p>文件头说清：登记表住模块级而不是组件 state。否则 <code>/ask</code> 被路由切走再切回来，组件卸载会把正在流的那半条回答一起带走。2.2 的核心是 <code>useChat</code> 逐字渲染；2.5 把请求体换成 <code>sessionId</code>，历史交给后端。</p>"
              },
              {
                "lines": "28-33",
                "title": "prepareSendMessagesRequest",
                "badge": "2.5",
                "body": "<p><code>DefaultChatTransport</code> 默认发 <code>messages</code>；这里用 <code>prepareSendMessagesRequest</code> 翻成后端契约 <code>{query, sessionId}</code>。2.2 时是 <code>{query, limit}</code>，历史还没落库。<code>lastUserText</code> 只取最后一条 user 消息的文本。</p>"
              },
              {
                "lines": "35-45",
                "title": "chatFor：同一会话同一只 Chat",
                "badge": "2.2",
                "body": "<p><code>chats</code> 是 <code>Map&lt;sessionId, Chat&gt;</code>；第一次取就 <code>new Chat({ id, messages: [], transport })</code>，之后复用。切会话不能只换 <code>useChat</code> 的 id：实测 <code>@ai-sdk/react</code> 的 <code>useMemo</code> 依赖就是那只 id，id 一变就 new 一只全新 Chat，旧会话的消息与在飞的流当场归零。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-ask-state",
        "kicker": "WEB · 07",
        "title": "ask.tsx：状态机、错误与半截标记",
        "subtitle": "submitted/streaming 驱动 Loading，error 驱动 Banner，手动 stop 驱动「未完整」。",
        "body": "<div class=\"callout\">这一块是 2.2 前端的核心状态机；2.3/2.5/2.6 在这几个变量上加了引用、会话与检索，但四个判断（generating、streamingId、notice、markCut）是 2.2 定下的。</div>",
        "blocks": [
          {
            "id": "web-ask-state-file",
            "file": "app/web/src/routes/ask.tsx",
            "lang": "ts",
            "source": "web:src/routes/ask.tsx",
            "ranges": [
              [
                94,
                96
              ],
              [
                128,
                142
              ],
              [
                166,
                181
              ],
              [
                261,
                292
              ]
            ],
            "notes": [
              {
                "lines": "94-96",
                "title": "useChat 接上 Chat 实例",
                "badge": "2.2",
                "body": "<p><code>chatFor(sessionId)</code> 拿实例，<code>useChat({ chat })</code> 把 SDK 的 <code>messages/status/error</code> 接到 React。2.5 把半截标记 <code>incomplete</code> 按 sessionId 存到模块级（<code>useAnswersCut</code>），2.2 时它只在页面 state 里。</p>"
              },
              {
                "lines": "128-142",
                "title": "错误 → 只标「最后一条是 assistant」",
                "badge": "2.2",
                "body": "<p><code>error</code> 一到，先探一次健康，然后看 <code>messages.at(-1)</code> 是不是 assistant；是才 <code>markCut</code>。非 2xx 发生在 assistant 出现之前，本轮压根没产生半截回答；不加这个条件，会把上一轮<strong>写完</strong>的回答永久标成「未完整」。</p>"
              },
              {
                "lines": "166-181",
                "title": "generating / busy / notice / streamingId",
                "badge": "2.2",
                "body": "<p><code>generating = streaming || submitted</code>：<code>submitted</code> 是「请求已发、首 token 未到」，所以 Loading 能先出现。<code>busy</code> 再加上 2.6 的 <code>retrieving</code>。<code>streamingId</code> 只在 <code>streaming</code> 且最后一条是 assistant 时给光标，避免 submitted 阶段把光标挂到上一轮写完的回答上。<code>notice</code> 是错误文案或「上一轮没能停下来」。</p>"
              },
              {
                "lines": "261-292",
                "title": "忙时再问：先 stop，再发",
                "badge": "2.2",
                "body": "<p>这是 AC「上一轮流未结束又发新提问」的落点：若 <code>Target.status</code> 是 streaming/submitted，先 <code>markCut</code>，再让 <code>Target.stop()</code> 与 800ms 定时器赛跑。停不干净就 <code>stuck</code> 并<strong>放弃这一问</strong>；停干净才 <code>sendMessage</code>。2.5 在这段前面加了「本机会话先换远程 UUID」，其余守卫是 2.2 的。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-ask-ui",
        "kicker": "WEB · 08",
        "title": "ask.tsx：Loading 条、错误 Banner、停止",
        "subtitle": "可见的三点、读屏播报、错误 Banner 与手动停止。",
        "body": "<div class=\"callout\">2.2 的「首 token 前有可见 Loading」在这里；2.6 的「正在检索」只是把文案扩成两种状态，不改变 Loading 的触发条件。</div>",
        "blocks": [
          {
            "id": "web-ask-ui-file",
            "file": "app/web/src/routes/ask.tsx",
            "lang": "ts",
            "source": "web:src/routes/ask.tsx",
            "ranges": [
              [
                416,
                444
              ],
              [
                456,
                478
              ],
              [
                485,
                495
              ]
            ],
            "notes": [
              {
                "lines": "416-432",
                "title": "busy 时的三个点",
                "badge": "2.2",
                "body": "<p><code>busy</code> 时渲染三个呼吸点和一句文案；<code>generating</code> 在 submitted 就为真，所以首 token 前就能看到。<code>retrieving</code> 是 2.6 的检索中，2.2 只有 generating。文案同时说「检索/生成」，避免把逐字光标误认为检索在动。</p>"
              },
              {
                "lines": "434-443",
                "title": "可见的三点 vs 读屏播报",
                "badge": "2.2",
                "body": "<p>可见的三点给人看；两只 <code>sr-only</code> 区负责读屏：<code>role=\"status\"</code> 播「正在生成回答」，错误单独放 <code>role=\"alert\"</code>，不在同一容器上翻 role。结束也要播「回答已完成」，否则读屏用户拿到的是一条没有下文的等待。</p>"
              },
              {
                "lines": "456-478",
                "title": "错误 Banner 与「知道了」",
                "badge": "2.2",
                "body": "<p>Banner 文案来自 <code>chatErrorText(error)</code>：后端 JSON <code>{code,message}</code> 显示成「码 · 文案」；代理的 HTML 错误页压成一句短话；空 message 回落「问答失败」。「知道了」只 <code>clearError</code>，不重试；<code>stuck</code> 那条不给按钮，因为那一问压根没发出。</p>"
              },
              {
                "lines": "485-490",
                "title": "手动停止 = 这一条就是半截",
                "badge": "2.2",
                "body": "<p>停止按钮先看最后一条是不是 assistant，是就 <code>markCut</code>，再 <code>chat.stop()</code>。正常 stop 不产生 error，所以不能等 <code>error</code> 那一路来标；这是「回答未完整」最主要的判定入口。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-composer",
        "kicker": "WEB · 09",
        "title": "Composer：三态按钮与唯一的停止入口",
        "subtitle": "生成中且空输入 → 停止；生成中且有字 → 打断并重问；空闲 → 提问。",
        "body": "<div class=\"callout\">2.2 的停止能力只有这里读 <code>chat.stop()</code>；检索中不显示「停止生成」，因为它停不了检索。</div>",
        "blocks": [
          {
            "id": "web-composer-file",
            "file": "app/web/src/routes/ask.tsx",
            "lang": "ts",
            "source": "web:src/routes/ask.tsx",
            "ranges": [
              [
                593,
                645
              ]
            ],
            "notes": [
              {
                "lines": "598-600",
                "title": "Generating 只看模型那头",
                "badge": "2.2",
                "body": "<p><code>Generating</code> 只管模型（submitted/streaming），不把 <code>retrieving</code> 算进去。检索中点「停止生成」什么都停不了，比禁用更难解释；所以按钮的判据用 <code>Generating</code>。</p>"
              },
              {
                "lines": "628-641",
                "title": "三态按钮",
                "badge": "2.2",
                "body": "<p>生成中且输入框为空 → 「停止生成」；生成中且有字 → 「打断并重问」；空闲 → 「提问」。空输入时也不灰掉停止那一路，它是全站唯一读得到 <code>chat.stop()</code> 的入口。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-thread",
        "kicker": "WEB · 10",
        "title": "ChatThread：parts 渲染、光标与「未完整」",
        "subtitle": "流进来多少渲染多少；光标只挂流中的那条；半截答案自己说话。",
        "body": "<div class=\"callout\">2.2 负责 text parts、光标、未完整；行内的 <code>[n]</code> 引用按钮是 2.3 的补丁。</div>",
        "blocks": [
          {
            "id": "web-thread-file",
            "file": "app/web/src/components/chat-thread/chat-thread.tsx",
            "lang": "ts",
            "source": "web:src/components/chat-thread/chat-thread.tsx",
            "ranges": [
              [
                33,
                35
              ],
              [
                105,
                133
              ]
            ],
            "notes": [
              {
                "lines": "33-35",
                "title": "消息不是一行字符串",
                "badge": "2.2",
                "body": "<p><code>UIMessage</code> 是 <code>{ role, parts }</code>；<code>textOf</code> 只拼 text parts。流式过程中 SDK 每收到一个 <code>text-delta</code> 就追加到同一个 text part，React 重渲染，所以是「逐字」。reasoning、tool、data part 各有自己的分支，不会被拼进正文。</p>"
              },
              {
                "lines": "117-123",
                "title": "逐行渲染 + 光标",
                "badge": "2.2",
                "body": "<p>每个 text part 按换行切行渲染；只有 <code>StreamingId</code> 那条的最后一行带 <code>caret-blink</code>。行内的 <code>[n]</code> / 8 位 chunkId 是 2.3 的引用渲染，不是 2.2 的流式能力。</p>"
              },
              {
                "lines": "126-130",
                "title": "「这一条回答未完整」",
                "badge": "2.2",
                "body": "<p><code>Cut &amp;&amp; !Streaming</code> 才显示：光标还在时不能同时预告未完整。判据由页面给（<code>Incomplete</code> 集合），因为只有页面知道这一轮是被手动停、出错、还是正常结束。刷新后这个标记会消失，因为 2.5 不落中断的 assistant，标记也只在内存。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "web-chat-test",
        "kicker": "WEB · 11",
        "title": "测试：用真 SSE 文本钉住协议与请求体",
        "subtitle": "不是 mock SDK 内部，而是在网络边界喂一段真的 UI message stream。",
        "body": "<div class=\"callout\">这两条测试说明「前端消费的是 SSE 帧」不是口头结论：测试直接造 <code>text/event-stream</code> 响应，里面是 <code>data: {\"type\":\"start\"}...</code>。</div>",
        "blocks": [
          {
            "id": "web-chat-test-file",
            "file": "app/web/src/api/chat.test.ts",
            "lang": "ts",
            "source": "web:src/api/chat.test.ts",
            "ranges": [
              [
                20,
                21
              ],
              [
                44,
                54
              ]
            ],
            "notes": [
              {
                "lines": "20-21",
                "title": "最简 UI message stream",
                "badge": "2.2",
                "body": "<p><code>SSE_HEADERS</code> 是 <code>text/event-stream</code>；<code>EMPTY_STREAM</code> 是 <code>data: {\"type\":\"start\"}</code> → <code>finish</code> → <code>[DONE]</code>。测试只替换 <code>fetch</code>，不 mock <code>useChat</code> 内部，所以它钉的是真实协议消费。</p>"
              },
              {
                "lines": "44-54",
                "title": "请求体只发 {query, sessionId}",
                "badge": "2.5",
                "body": "<p>断言 URL 含 <code>/api/chat</code>，body 等于 <code>{ query, sessionId }</code>。2.2 时这里是 <code>{query, limit}</code>；2.5 把 limit 归工具、历史归后端。多送一个后端已删的旋钮不会报错，但会让人以为它还在起作用——所以这条测试值得钉。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "probe-stream",
        "kicker": "APPENDIX · 12",
        "title": "探针：transient data part 的真实形状",
        "subtitle": "2.2 的实验产物，不在产品路径；它证明 transient 不进 message.parts。",
        "body": "<div class=\"callout\"><strong>先声明：</strong>这个文件在 <code>app/server/test/legacy/</code>，被 <code>.gitignore</code> 忽略，不是产品代码。它只用于解释 2.2 AC 里的 data part handler 为什么后来被 2.6 的 tool part 取代。</div>",
        "blocks": [
          {
            "id": "probe-stream-file",
            "file": "app/server/test/legacy/probe-stream-wire.ts",
            "lang": "ts",
            "source": "test/legacy/probe-stream-wire.ts",
            "ranges": [
              [
                99,
                116
              ]
            ],
            "notes": [
              {
                "lines": "99-112",
                "title": "writer.write({ transient: true })",
                "badge": "附录",
                "body": "<p>探针在 <code>createUIMessageStream</code> 的 <code>execute</code> 里先写一条 <code>data-retrieval</code>，标 <code>transient: true</code>，再 <code>writer.merge(toUIMessageStream(...))</code>。<code>transient</code> 的语义是：帧会下发，客户端 <code>onData</code> 能收到，但<strong>不会 push 进 <code>state.message.parts</code></strong>，所以不会进历史、刷新后消失。</p>"
              },
              {
                "lines": "115-116",
                "title": "探针也用同一个 Response 包装",
                "badge": "附录",
                "body": "<p>探针同样用 <code>createUIMessageStreamResponse</code> 包成 SSE。产品代码没有走 <code>createUIMessageStream</code> 这一层，而是直接 <code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code>；所以产品里没有 <code>writer.write</code>，也没有 <code>onData</code> handler。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\"><span class=\"kicker\">DECISIONS</span><h2>关键取舍与踩坑</h2><p class=\"section-sub\">为什么用 UI Message Stream、为什么选「取消前一条」、为什么 abort 帧不能当 error 用。</p></header>\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">01</span><h3>用 UI Message Stream，而不是自定义 JSON</h3><p><code>useChat</code>、<code>UIMessage.parts</code>、tool part、error/abort 语义都是 SDK 现成的；自己发明协议要重写解析、状态与工具序列化。代价是协议帧多、必须按 <code>type</code> 理解，不能当普通 JSON 读。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">02</span><h3>忙时取消前一条，而不是排队/拒绝</h3><p>AC 三选一，选了「取消」：先 <code>stop()</code> 再发。代价是 <code>stop()</code> 没有上界，所以加 800ms 竞速；停不干净就拒绝这一问并提示，绝不让两条流互相拨 status。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">03</span><h3>错误文案固定「问答失败」</h3><p>流内 <code>onError</code> 只回一句固定话，详细错误进服务端日志。好处是不把 provider 的原始错误/密钥片段泄给浏览器；代价是用户拿不到可操作的细节，排障要看服务端。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">04</span><h3>中断不落 assistant</h3><p>取消/中断直接 return，库里只留 user 消息。好处是历史里不会出现半截答案被当结论；代价是刷新后半截消失，前端「未完整」标记只在内存。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">05</span><h3>命中用 tool part，不用 transient data part</h3><p>2.6 把命中放进 <code>tool-retrieve</code> output，成为 assistant 消息的一部分，可持久化、可在历史里回看；transient data part 只适合实时进度，不适合引用。原 <code>sources</code> data part 方案因此退役。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">06</span><h3>超时三条款整体推后</h3><p>Lynx 2026-10-15 定「先把 SDK 跑通」；没有真实上游首块延迟样本前，拍一个超时值只是拍脑袋。代价是 inter-token 卡住时不会自动标未完整，只能手动停。</p></article>\n  </div>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">容易踩的 8 个坑</h3>\n  <ul class=\"pitfall-list\">\n    <li><strong>把 commit 标题当边界。</strong><code>dda283c</code> 叫 story 2-2 dev1，内容是 2.1 的检索/路由；<code>b9ad65e</code> 叫 build 3，才是 2.2 的前端接线。看 diff，不看标题。</li>\n    <li><strong>以为 error 帧能改 HTTP 状态。</strong>Response 返回时 200 已经发出；模型中途报错只能发 <code>{\"type\":\"error\"}</code>，前端从 <code>useChat().error</code> 读，路由的 500 覆盖不到。</li>\n    <li><strong>把 abort 帧当 error。</strong>本机实验：只喂 <code>{\"type\":\"abort\"}</code>，<code>Chat</code> 最终 status 是 <code>ready</code>、<code>error</code> 为 none，半截 text part 甚至还是 <code>state:\"streaming\"</code>。所以手动停止必须自己 <code>markCut</code>。</li>\n    <li><strong>在 submitted 阶段给上一轮挂光标。</strong>submitted 时本轮 assistant 还没进 <code>messages</code>；按「最后一条 assistant」挂光标会挂到上一轮写完的回答上。代码用 <code>status === 'streaming'</code> 挡住。</li>\n    <li><strong>错误时无脑标半截。</strong>非 2xx 发生在 assistant 出现之前；必须判 <code>messages.at(-1)?.role === 'assistant'</code>，否则会把上一轮完整回答永久标成未完整（cut 从不回收）。</li>\n    <li><strong>混淆两个 onError。</strong><code>streamText</code> 的 onError 只记日志/给 trace；<code>toUIMessageStream</code> 的 onError 才决定客户端 <code>errorText</code>。改错一个，用户看到的文案不会变。</li>\n    <li><strong>以为 stop() 有上界。</strong>它没有；所以 800ms 竞速不是为了快，是为了「停不干净就别发下一问」。两条流共用一只 Chat 的 status，会互相拨回去。</li>\n    <li><strong>以为 transient data part 会进历史。</strong>它只走 <code>onData</code>，不进 <code>message.parts</code>；本机实验用 <code>readUIMessageStream</code> 读完，parts 里只剩 text。要进历史就得用普通 part 或 tool part。</li>\n  </ul>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">断流后「回答未完整」的判定矩阵</h3>\n  <p class=\"block-intro\">这张表把「客户端看到什么」与「有没有半截标记」拆开。abort-only 与 timeout 是缺口，不是 2.2 已实现。</p>\n  <table class=\"file-table\">\n    <thead><tr><th>场景</th><th>useChat status</th><th>error</th><th>半截标记</th><th>依据</th></tr></thead>\n    <tbody>\n      <tr><td>正常完成</td><td><code>ready</code></td><td>无</td><td>无</td><td><code>finish</code> 帧；<code>onEnd</code> 落 assistant</td></tr>\n      <tr><td>用户点「停止生成」</td><td><code>ready</code></td><td>无</td><td><strong>有</strong></td><td>OnStop 先 <code>markCut</code> 再 <code>chat.stop()</code>（ask.tsx 485–490）</td></tr>\n      <tr><td>流开始前 HTTP 400/404/500</td><td><code>error</code></td><td>有</td><td>无（最后一条是 user）</td><td><code>chatErrorText</code>；ask.tsx 135–142 的条件</td></tr>\n      <tr><td>流内 <code>error</code> 帧</td><td><code>error</code></td><td>有（<code>errorText</code>）</td><td>有（若已有 assistant）</td><td>SDK 把 error 帧转成 <code>onError</code>；ask.tsx 135–142</td></tr>\n      <tr><td>流内只有 <code>abort</code> 帧</td><td><code>ready</code></td><td>无</td><td><strong>无（缺口）</strong></td><td>本机 <code>Chat</code> 实验；SDK 没有把 abort 帧映射成 error</td></tr>\n      <tr><td>网络断流（fetch 失败）</td><td><code>error</code></td><td>有</td><td>有（若已有 assistant）</td><td><code>AbstractChat</code> catch；ask.tsx 135–142</td></tr>\n      <tr><td>inter-token / 首 token / 总时长超时</td><td>—</td><td>—</td><td><strong>未实现</strong></td><td>deferred-work；<code>CHAT_TIMEOUT_*</code> 零命中</td></tr>\n    </tbody>\n  </table>\n  <div class=\"callout strong\"><strong>一句话记住：</strong>2.2 能可靠标「未完整」的入口只有两个——用户手动停、以及 useChat 真的报了 error；<strong>abort 帧本身不保证</strong>。超时那条自动判定没有做。</div>\n</section>\n\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\"><span class=\"kicker\">VERIFY</span><h2>可复制的验证命令</h2><p class=\"section-sub\">先分清「历史真跑过」「本轮只读/本地实验」「本轮未重跑」。本页按任务约束没有启动前后端、没有跑测试。</p></header>\n\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>本轮真跑（只读）· 证明超时未落</h3>\n      <pre class=\"snippet\">cd app/server\ngrep -rn \"CHAT_TIMEOUT\\|firstChunkMs\\|chunkMs\\|totalMs\" src</pre>\n      <p class=\"test-note\">预期：<strong>零输出</strong>（退出码 1 也算正常，因为 grep 没匹配）。这就是 deferred 的定论证据。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>本轮真跑（本地 SDK 小实验）· 看帧</h3>\n      <pre class=\"snippet\">cd app/server\nnode --input-type=module -e \"import { createUIMessageStream, createUIMessageStreamResponse } from 'ai'; const s=createUIMessageStream({execute:({writer})=>{writer.write({type:'start'});writer.write({type:'text-start',id:'t1'});writer.write({type:'text-delta',id:'t1',delta:'你'});writer.write({type:'text-end',id:'t1'});writer.write({type:'finish'});}}); const r=createUIMessageStreamResponse({stream:s}); console.log(Object.fromEntries(r.headers.entries())['content-type']); console.log(await r.text());\"</pre>\n      <p class=\"test-note\">预期：第一行 <code>text/event-stream</code>；正文是 <code>data: {\"type\":\"start\"}</code>、<code>text-delta</code>、<code>finish</code>、<code>data: [DONE]</code>。本轮实际跑过，但这不是端到端。</p>\n    </article>\n  </div>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">端到端：curl 看 /chat 的 SSE 帧</h3>\n  <p class=\"block-intro\">需要真库 + Ollama + chat 模型。2.5 起 <code>/chat</code> 要求 <code>sessionId</code>，所以先建会话。下面命令本轮<strong>未重跑</strong>。</p>\n  <pre class=\"snippet\"># 终端 1：起服务\ncd app/server\nPORT=3003 npx tsx --env-file=.env src/index.ts\n\n# 终端 2：建会话，拿 UUID\nSID=$(curl -sS -X POST localhost:3003/sessions \\\n  -H 'content-type: application/json' -d '{}' \\\n  | node -pe 'JSON.parse(require(\"fs\").readFileSync(0,\"utf8\")).id')\n\n# 存响应头 + SSE 正文；-N 关掉 curl 的缓冲\ncurl -N -sS -D /tmp/chat.headers \\\n  -X POST localhost:3003/chat \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"query\\\":\\\"RRF 怎么融合\\\",\\\"sessionId\\\":\\\"$SID\\\"}\" \\\n  -o /tmp/chat.sse\n\ngrep -i 'content-type\\|x-vercel-ai-ui-message-stream' /tmp/chat.headers\ngrep '^data:' /tmp/chat.sse | head -20</pre>\n  <p class=\"test-note\">预期：响应头含 <code>content-type: text/event-stream</code> 与 <code>x-vercel-ai-ui-message-stream: v1</code>；正文依次有 <code>start</code>、<code>text-start</code>、多个 <code>text-delta</code>、<code>finish</code>、<code>[DONE]</code>。若模型调了工具，还会看到 <code>tool-input-*</code> / <code>tool-output-*</code>（2.6 的内容，不是 2.2 的协议本身）。</p>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">端到端：流开始前的错误是普通 JSON</h3>\n  <pre class=\"snippet\">curl -i -X POST localhost:3003/chat \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"query\\\":\\\"   \\\",\\\"sessionId\\\":\\\"$SID\\\"}\"</pre>\n  <p class=\"test-note\">预期：<strong>400</strong>，body 是 <code>{\"code\":\"E_EMPTY_QUERY\",\"message\":\"提问不能为空\"}</code>，<code>content-type: application/json</code>，不是 SSE。坏 sessionId 回 400 <code>E_BAD_ID</code>；不存在的会话回 404 <code>E_SESSION_NOT_FOUND</code>。</p>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">前端手测清单（Lynx 浏览器）</h3>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>启动与观察</h3>\n      <pre class=\"snippet\">cd app/web\nnpm run dev\n# 打开 Vite 输出的地址，进 /ask</pre>\n      <p class=\"test-note\">发送后、首字出现前应看到三个点和「正在生成回答…」；随后回答逐字增长，最后一行有光标；结束后光标消失。切走再切回来，正在流的半条应该还在。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>中断与串流</h3>\n      <p class=\"test-note\">生成中点「停止生成」：应立刻停，回答下方出现「这一条回答未完整」，<strong>没有</strong>错误 Banner。生成中直接再输入并发送：上一轮应先被停掉，新回答开始；若 800ms 没停干净，应提示「上一轮没能停下来 · 这一问没有发出」且不发新问。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>错误提示</h3>\n      <p class=\"test-note\">停掉后端再发一问：应出现 Banner（代理的 HTML 错误会压成一句带状态码的短话）；再启动后端点「知道了」清掉。首 token 前的 HTTP 400/404 也应该走 Banner，而不是空白回答。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>引用（2.3，不属 2.2）</h3>\n      <p class=\"test-note\">回答里的 <code>[n]</code> 可点、右栏有命中、抽屉有原文，这些是 2.3/2.4/2.6 的验收；不要拿它们给 2.2 打分。</p>\n    </article>\n  </div>\n\n  <h3 class=\"block-title\" style=\"margin-top:28px\">自动化测试（本轮未跑）</h3>\n  <div class=\"test-grid\">\n    <article class=\"test-card\">\n      <h3>前端单测</h3>\n      <pre class=\"snippet\">cd app/web\nnpx vitest run src/api/chat.test.ts src/components/chat-thread/chat-thread.test.tsx</pre>\n      <p class=\"test-note\">预期全绿。钉的是：请求体形状、同一 session 同一 Chat、SSE 空流、<code>referencesOf</code> 四态、光标只挂一条、停流后标未完整。本轮按任务约束未跑。</p>\n    </article>\n    <article class=\"test-card\">\n      <h3>后端真模型流程（2.6 上下文）</h3>\n      <pre class=\"snippet\">cd app/server\nnpx vitest run test/chat-tool-flow.test.ts</pre>\n      <p class=\"test-note\">预期 1 条通过；需要真库 + 真 Ollama + 真 chat 模型，会建会话并清理。它验证 <code>tool-input-available</code> / <code>tool-output-available</code> / <code>text-delta</code> 帧，不是 2.2 的专项测试。本轮未跑。</p>\n    </article>\n  </div>\n\n  <table class=\"file-table\" style=\"margin-top:22px\">\n    <thead><tr><th>证据</th><th>状态</th><th>说明</th></tr></thead>\n    <tbody>\n      <tr><td>2.2 流式主体 / 前端接线</td><td>历史真跑过</td><td>sprint-status 2026-10-20 对账记「已提交（<code>7895c31</code>）」；仓内没有逐帧日志，所以本页不编造 2.2 的 curl 输出。</td></tr>\n      <tr><td>2.6 SSE 帧（tool part）</td><td>历史真跑过</td><td><code>spec-2-6</code> 记录真跑：SSE 出现 <code>start → tool-retrieve → text-delta → finish</code>；混维时工具 output 带 <code>E_DIMENSION_MISMATCH</code>。</td></tr>\n      <tr><td>2.5 多轮与落库</td><td>历史真跑过</td><td>handoff 2026-10-21 记录两轮追问、<code>GET /sessions/:id/messages</code> 返回 4 条、parts 含 <code>tool-retrieve</code>。</td></tr>\n      <tr><td>本轮 curl / 前后端测试</td><td>未重跑</td><td>按任务约束：不装依赖、不开浏览器、不跑前后端测试；只做只读 grep 与本地 SDK 小实验。</td></tr>\n    </tbody>\n  </table>\n</section>\n\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\"><span class=\"kicker\">CONTINUITY</span><h2>与前后 story 的衔接</h2><p class=\"section-sub\">2.2 把「答案体」换成「流」，后面的 story 都在这条流上加东西。</p></header>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">2.1 → 2.2</span><h3>从答案体到流</h3><p>2.1 的 <code>/chat</code> 返回 <code>{answer, hits, vectorCount, lexicalCount}</code>，三条确定性提示也是 200 答案体。2.2 把成功路径换成 UI message stream，HTTP 200 不变；空 query/坏 body 仍是 JSON 400。检索仍走 <code>/retrieve</code>，生成不依据库。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">2.2 → 2.3</span><h3>引用没有按原计划走</h3><p>2.2 的 AC 想预留 data part handler，让 2.3 只加渲染。实际 2.3/2.6 把命中改成同一条流里的 <code>tool-retrieve</code> part，前端新增 <code>referencesOf</code> 与 <code>[n]</code> 映射；2.2 的 data part handler 没有作为产品代码落地。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">2.2 → 2.5</span><h3>会话历史接上</h3><p>2.5 加 sessions/messages、<code>{query, sessionId}</code>、历史回灌与 onEnd 落库；中断/取消仍不落 assistant。2.2 的「一只 session 一只 Chat」正好承接服务端会话 id。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">2.2 → 2.6</span><h3>工具进同一条流</h3><p>2.6 把检索包成 <code>retrieve</code> 工具，<code>stopWhen(5)</code> 允许有界重查；<code>tool-retrieve</code> output 成为引用与面板的数据源。流协议没变，只是 chunk 类型多了 tool 系列。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">2.2 → 3.2</span><h3>观测补丁</h3><p>3.2 加 Langfuse、<code>telemetry.functionId</code>、trace 收口与 <code>onEnd</code> 状态。当前工作区未提交的 <code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code> 拆分也属这批改动，页面已标 3.2。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">遗留</span><h3>下次动这块先看</h3><p>① 超时三条款（首 token / inter-token / 总时长）仍未落；② 服务端没有按 session 的互斥锁，两个标签页仍可交错；③ abort-only 帧不会自动标未完整；④ 半截标记只在内存。四条都别在 2.2 页里写成已完成。</p></article>\n  </div>\n  <div class=\"next-box\">\n    <p><strong>读到这里你应该能回答：</strong>为什么 <code>data: {\"type\":\"text-delta\"}</code> 不是普通 JSON？为什么 <code>error</code> 帧不能让 HTTP 变成 500？为什么手动停止必须自己 <code>markCut</code>？为什么 transient data part 刷新后就没了？</p>\n    <div class=\"next-links\">\n      <a href=\"#code-and-annotations\">回到代码</a>\n      <a href=\"#decisions-and-pitfalls\">看判定矩阵</a>\n      <a href=\"#verification-commands\">复制验证命令</a>\n    </div>\n  </div>\n</section>\n\n<footer class=\"footer\">\n  <p>Story 2.2 走读页 · 由 <code>story-walkthrough</code> 生成 · 代码来自当前工作区真实文件 · 本轮未启动前后端、未跑端到端测试。</p>\n  <p>源文件：<code>app/server/src/routes/chat.ts</code>、<code>app/server/src/agent/chat/chat.ts</code>、<code>app/server/src/config.ts</code>、<code>app/server/src/agent/tool/tools/retrieve.ts</code>、<code>app/web/src/api/chat.ts</code>、<code>app/web/src/routes/ask.tsx</code>、<code>app/web/src/components/chat-thread/chat-thread.tsx</code>。</p>\n</footer>\n"
    }
  ]
}
