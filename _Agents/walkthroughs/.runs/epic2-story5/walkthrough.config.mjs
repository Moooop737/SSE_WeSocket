export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic2-story5-multiturn.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 2 · Story 2.5 会话内多轮 · 带代码逐行讲解",
  "tocTitle": "Story 2.5",
  "tocSub": "会话内多轮 · 多会话与历史恢复",
  "accent": "#c2410c",
  "accent2": "#9a3412",
  "accentDark": "#fdba74",
  "toc": [
    [
      "conclusion-and-boundary",
      "结论与边界"
    ],
    [
      "story-diagram",
      "图示"
    ],
    [
      "map",
      "全局地图"
    ],
    [
      "glossary",
      "小白词典"
    ],
    [
      "journey",
      "两轮追问的旅行"
    ],
    [
      "files",
      "文件地图"
    ],
    [
      "code-and-annotations",
      "数据形状"
    ],
    [
      "code-api",
      "接口层"
    ],
    [
      "code-chat",
      "ChatService"
    ],
    [
      "code-web",
      "前端接线"
    ],
    [
      "decisions-and-pitfalls",
      "取舍与坑"
    ],
    [
      "verification-commands",
      "验证命令"
    ],
    [
      "story-continuity",
      "前后衔接"
    ]
  ],
  "content": [
    {
      "type": "html",
      "html": "<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>Knowledge Copilot</span><span>·</span><span>Epic 2 · Story 2.5</span><span>·</span><span>2026-10-21</span></div>\n  <h1>Story 2.5：<em>会话内多轮</em></h1>\n  <p class=\"hero-sub\">同一个 <code>sessionId</code> 里继续追问：服务端按会话读库、只回灌 <code>text</code> parts、截最近 6 轮交给模型；本轮 <code>user</code>/<code>assistant</code> 落库，刷新或切会话再从 <code>GET /sessions/:id/messages</code> 恢复。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>2.5</strong> done · 2026-10-21</span>\n    <span class=\"chip\">多轮 + 多会话列表</span>\n    <span class=\"chip\">parts / sequence</span>\n    <span class=\"chip\">约 40 分钟</span>\n  </div>\n  <div class=\"trace-pill\"><b>POST /sessions → POST /chat {query, sessionId} → loadHistory → streamText → createMessage</b><span>两轮追问；parts 是唯一真源</span></div>\n</header>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\"><span class=\"kicker\">TL;DR</span><h2>结论与边界</h2><p class=\"section-sub\">2.5 把「单轮问答」变成「同一 session 内可追问」：前端只传 sessionId，服务端读库组历史，parts 落库，刷新可恢复。</p></header>\n  <div class=\"summary-grid\">\n    <article class=\"summary-card\"><span class=\"summary-no\">01</span><h3>历史真源在服务端</h3><p><code>/chat</code> 只收 <code>{query, sessionId}</code>；历史由服务端按会话读库。客户端不能伪造上下文，多轮与刷新恢复同一份数据。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">02</span><h3>只回灌 text parts</h3><p>跨轮只带正文。上一轮的 <code>tool-retrieve</code> 是整份命中全文，回灌会撑 token、还可能让模型引用旧块；reasoning 同样不进下一轮。</p></article>\n    <article class=\"summary-card\"><span class=\"summary-no\">03</span><h3>多会话是范围扩展</h3><p>2026-10-21 Lynx 拍：P1 从「单个活跃 Session」扩为「多会话历史列表 + 标题可改」。原 AC 的「不做多会话历史列表」作废。</p></article>\n  </div>\n  <div class=\"callout strong\"><strong>一句话：</strong>2.5 交付的不是「前端记住聊天记录」，而是「服务端把每一轮写进 <code>messages.parts</code>，下一轮再从库里读回来」。</div>\n  <table class=\"file-table\">\n    <thead><tr><th>归属</th><th>内容</th><th>怎么读</th></tr></thead>\n    <tbody>\n      <tr><td><span class=\"badge b-now\">2.5</span></td><td>sessions/messages 迁移（parts、sequence、删 user_id/sources、role 枚举）；会话/消息 Repo 六方法（<code>getSession</code>/<code>createSession</code>/<code>createMessage</code>/<code>getMessagesBySession</code> + <code>listSessions</code>/<code>updateSessionTitle</code>，当前部分已由 P2 crud 接管）；<code>/sessions</code> POST/GET/PATCH；<code>/chat</code> 收 <code>{query, sessionId}</code>；按会话读库历史；user/assistant 落库；前端切会话恢复、多会话列表与首问标题 PATCH。</td><td>本页主线。</td></tr>\n      <tr><td><span class=\"badge b-now\">2.6</span></td><td>把 <code>retrieve</code> 包成工具、<code>stopWhen: stepCountIs(5)</code>、工具调用有界。</td><td><code>agent/chat/chat.ts</code> 里的 tools/stopWhen 是 2.6 补的，不是 2.5。</td></tr>\n      <tr><td><span class=\"badge b-now\">DI</span></td><td>2026-10-20 的 tsyringe 装配：<code>@singleton</code> / <code>@inject</code> 零参 <code>build()</code>。</td><td>2.5 只是沿用这套装配，不能算 2.5 的交付。</td></tr>\n      <tr><td><span class=\"badge b-31\">3.1</span></td><td>通用 endpoint trace 壳、<code>traces</code> 公共行、<code>X-Trace-Id</code>。</td><td><code>agent/chat/chat.ts</code> 的 trace 相关行是 3.1/3.2 补的。</td></tr>\n      <tr><td><span class=\"badge b-32\">3.2</span></td><td>Langfuse 三件套、<code>telemetry.functionId</code>、<code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code>、流结束写 trace。</td><td>2.5 当时是 <code>Result.toUIMessageStreamResponse</code>，语义相同。</td></tr>\n      <tr><td><span class=\"badge b-33\">3.3</span></td><td>Retriever 五段 runner、<code>/traces/:id</code>、trace 面板、<code>/chats</code> 观测页。</td><td>不是聊天页；<code>app/web/src/routes/chats.tsx</code> 不属于 2.5。</td></tr>\n      <tr><td><span class=\"badge b-now\">P2</span></td><td>2026-10-22 hono-crud 重构：主键统一 <code>id</code>、分页、DELETE、<code>routes/crud.ts</code> 接管 sessions CRUD。</td><td>当前代码里的 <code>id</code>/paging/DELETE 都是 P2；2.5 原字段是 <code>session_id</code>/<code>message_id</code>。</td></tr>\n    </tbody>\n  </table>\n  <div class=\"callout\"><strong>边界提醒：</strong>2.5 原 AC 里的「不做多会话历史列表」已经作废；但「多轮」本身仍不是 Agent loop，也不包含跨工具编排。2.6 才把检索做成工具。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 09</span>\n    <h2>一眼看懂：两轮追问的历史</h2>\n    <p class=\"section-sub\">同一 Session 里，第二轮怎么知道第一轮说了什么。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>6</strong>轮历史</span><span class=\"chip\"><strong>1</strong>份 parts 真源</span><span class=\"chip\"><strong>1</strong>个 session</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic2-story5-multiturn.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 2.5 两轮追问的历史\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:932 / 662;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic2-story5-multiturn.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>messages.parts 是唯一真源；只回灌 text parts，最近 6 轮。</li><li>不另设查询改写调用；模型自己把追问展开成检索词，再调 retrieve。</li><li>user/assistant 都落库；上一轮回答只作上下文，不作本轮引用依据。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画多会话列表/标题；前端恢复历史见下面的代码。</div>\n</section>\n"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"map\">\n  <header class=\"section-head\"><span class=\"kicker\">MAP</span><h2>全局地图：两轮其实走同一个函数</h2><p class=\"section-sub\">第一问建会话、落 user、生成 assistant；第二问把库里的历史读回来，再走一遍同一段 <code>ChatService.ask</code>。</p></header>\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>第一问</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">POST /sessions <span class=\"badge b-now\">2.5</span></li>\n        <li>前端拿 UUID，transport 带 sessionId</li>\n        <li>POST /chat {query, sessionId}</li>\n        <li>getSession 校验 → 读历史（此时为空）</li>\n        <li>createMessage(user) → convertToModelMessages</li>\n        <li>streamText（模型决定是否调 retrieve）</li>\n        <li>onEnd → createMessage(assistant, parts 全部)</li>\n      </ul>\n      <p class=\"map-note\">第一轮没有历史，<code>History</code> 是空数组；user 先落库，assistant 在流结束后落库。</p>\n    </div>\n    <div class=\"flow-card\">\n      <h3>第二问</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">同一个 sessionId 再 POST /chat <span class=\"badge b-now\">2.5</span></li>\n        <li>getMessagesBySession → 最近 12 条</li>\n        <li>storedUiMessage 只留 text parts</li>\n        <li>拼上本轮 user → convertToModelMessages</li>\n        <li>模型自己把「那 ef_construction 呢」展开成完整检索词</li>\n        <li>retrieve 工具返回本轮命中 <span class=\"badge b-now\">2.6</span></li>\n        <li>assistant 再落库，sequence 继续递增</li>\n      </ul>\n      <p class=\"map-note\">跨轮只回灌正文；上一轮的 tool 结果和 reasoning 都不进第二问的模型上下文。</p>\n    </div>\n  </div>\n  <div class=\"callout strong\"><strong>关键：</strong>没有「第二轮专用代码」。两轮都是 <code>ChatService.ask(Query, SessionId, Signal)</code>，差别只在库里有没有上一轮。</div>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\"><span class=\"kicker\">GLOSSARY</span><h2>小白词典：parts、sequence、UIMessage</h2><p class=\"section-sub\">先弄清这五个词，后面的代码就不会把「消息正文」和「消息零件」混成一件事。</p></header>\n  <div class=\"glossary\">\n    <div class=\"gloss\"><dt>UIMessage</dt><dd>AI SDK 给界面用的消息形状：<code>{ id, role, parts }</code>。一条消息不是纯字符串，而是一串零件。</dd></div>\n    <div class=\"gloss\"><dt>parts</dt><dd>零件数组。常见类型：<code>text</code>（正文）、<code>reasoning</code>（思考过程）、<code>tool-retrieve</code>（检索调用及结果）。2.5 把 <code>parts</code> 定为唯一真源。</dd></div>\n    <div class=\"gloss\"><dt>sequence</dt><dd><code>messages</code> 表的 identity 列，插入时数据库自动递增；全局递增，不是每个会话从 1 开始。会话内按它正序读。</dd></div>\n    <div class=\"gloss\"><dt>convertToModelMessages</dt><dd>AI SDK 的转换器：把 UI 形状的 <code>UIMessage[]</code> 变成模型能吃的消息。工具 part 在这里按 SDK 规则处理。</dd></div>\n    <div class=\"gloss\"><dt>sessionId</dt><dd>会话 UUID。前端只传它，不传历史；服务端用它读库。本地兜底会话叫 <code>local-s-*</code>，不是 UUID，提问前要先换成远程会话。</dd></div>\n    <div class=\"gloss\"><dt>最近 6 轮</dt><dd>代码里是 <code>HISTORY_MESSAGES = 12</code> 条消息。正常一轮 = user + assistant 两条，所以 12 条刚好 6 轮。</dd></div>\n    <div class=\"gloss\"><dt>软删</dt><dd>不物理删行，只写 <code>deleted_at</code>。所有读都带 <code>deleted_at IS NULL</code>；会话不存在或已软删，<code>/chat</code> 和消息接口都回 404。</dd></div>\n    <div class=\"gloss\"><dt>JSONB</dt><dd>Postgres 的二进制 JSON 列。<code>parts</code> 存的就是 JSONB；pg 驱动可能把它读成字符串，所以 <code>rowToMessage</code> 要判断并 <code>JSON.parse</code>。</dd></div>\n  </div>\n</section>"
    },
    {
      "type": "journey",
      "id": "journey",
      "kicker": "WALK",
      "title": "两轮追问的旅行",
      "subtitle": "从建会话到第二问只回灌 text，九步。点一步跳代码。",
      "steps": [
        {
          "goto": "web-client:455-464",
          "title": "建会话，拿 UUID",
          "note": "POST /sessions；空 body 建空标题会话",
          "code": "client L455–464"
        },
        {
          "goto": "web-chat:28-33",
          "title": "第一问出门",
          "note": "transport 只发 {query, sessionId}，不回传历史",
          "code": "chat L28–33"
        },
        {
          "goto": "route-chat:37-54",
          "title": "服务端校验",
          "note": "body 类型、trim、UUID、会话存在；404 在流前",
          "code": "route L37–54"
        },
        {
          "goto": "agent-chat:57-69",
          "title": "读历史 + 落 user",
          "note": "getMessagesBySession → slice(-12) → createMessage(user)",
          "code": "agent L57–69"
        },
        {
          "goto": "agent-chat:71-87",
          "title": "streamText",
          "note": "2.6 的 tools/stopWhen；3.2 的 telemetry",
          "code": "agent L71–87"
        },
        {
          "goto": "agent-chat:121-134",
          "title": "落 assistant",
          "note": "onEnd 把 responseMessage.parts 原样写库；中断不落",
          "code": "agent L121–134"
        },
        {
          "goto": "web-ask:103-119",
          "title": "刷新/切会话，恢复历史",
          "note": "remote UUID 且 Chat 为空时 loadHistory + setMessages",
          "code": "ask L103–119"
        },
        {
          "goto": "web-chat:47-58",
          "title": "每个会话只读一次库",
          "note": "正在流/已有消息不覆盖；parts 原样交给 setMessages",
          "code": "chat L47–58"
        },
        {
          "goto": "agent-chat:141-147",
          "title": "第二问只带 text",
          "note": "storedUiMessage 白名单 text；tool/reasoning 不回灌",
          "code": "agent L141–147"
        }
      ],
      "hint": "点任意一步，会跳到对应代码并高亮。第 4–6 步是第一问；第 7–9 步解释第二问为什么只看得到正文。"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"files\">\n  <header class=\"section-head\"><span class=\"kicker\">FILES</span><h2>文件地图</h2><p class=\"section-sub\">2.5 的代码分三层：库形状 → 服务端读写 → 前端会话/历史。表里带 badge 的行不是 2.5 的交付。</p></header>\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>角色</th><th>2.5 负责什么</th></tr></thead>\n    <tbody>\n      <tr><td><code>app/server/db/migrations/20261020093643_add_message_parts_and_sequence.sql</code></td><td>迁移</td><td>parts 真源、sequence、删 user_id/sources、role 枚举、会话内索引</td></tr>\n      <tr><td><code>app/server/src/adapter/repo/session.ts</code></td><td>Repo 读</td><td><code>getSession</code>；create/list/update 已由 P2 的 crud 接管</td></tr>\n      <tr><td><code>app/server/src/adapter/repo/message.ts</code></td><td>Repo 写/读</td><td><code>createMessage</code>、<code>getMessagesBySession</code>（parts、sequence）</td></tr>\n      <tr><td><code>app/server/src/routes/sessions.ts</code></td><td>路由</td><td><code>GET /:id/messages</code>；POST/GET/PATCH 已由 P2 的 crud 接管</td></tr>\n      <tr><td><code>app/server/src/routes/crud.ts</code></td><td>路由（P2）</td><td>当前 sessions list/create/update/delete 与 paging 的等价入口</td></tr>\n      <tr><td><code>app/server/src/routes/chat.ts</code></td><td>路由</td><td><code>{query, sessionId}</code> 校验、会话存在性、交给 ChatService</td></tr>\n      <tr><td><code>app/server/src/agent/chat/chat.ts</code></td><td>核心</td><td>读历史、落 user、streamText、落 assistant；2.6/3.1/3.2 有补丁</td></tr>\n      <tr><td><code>app/web/src/api/client.ts</code></td><td>HTTP 层</td><td>list/create/fetchMessages/updateSessionTitle 四个函数</td></tr>\n      <tr><td><code>app/web/src/api/sessions.ts</code></td><td>会话 store</td><td>hydrate、创建、首问标题 PATCH、activeId；分组/删除是后续轮次</td></tr>\n      <tr><td><code>app/web/src/api/chat.ts</code></td><td>Chat 登记表</td><td>按 sessionId 建 transport、每会话一只 Chat、loadHistory</td></tr>\n      <tr><td><code>app/web/src/routes/ask.tsx</code></td><td>页面</td><td>切会话恢复历史、本机会话升级、新会话</td></tr>\n      <tr><td><code>app/web/src/components/session-list/session-list.tsx</code></td><td>会话卡</td><td>列表与选中；分组/删除是 needs #42/#43 的后续轮次</td></tr>\n      <tr><td><code>app/web/src/routes/chats.tsx</code></td><td>观测页（3.3）</td><td>不是聊天页；<code>/chats</code> 是 Epic 3 的对话观测，不计入 2.5</td></tr>\n      <tr><td><code>20261022101758</code> / <code>20261022114648</code></td><td>10-22 后续迁移</td><td>title 默认值移除、主键统一 <code>id</code>；不是 2.5</td></tr>\n    </tbody>\n  </table>\n  <p class=\"table-note\">读当前代码时先看 badge：<span class=\"badge b-now\">2.5</span> 是本格；<span class=\"badge b-now\">2.6</span> / <span class=\"badge b-now\">DI</span> / <span class=\"badge b-31\">3.1</span> / <span class=\"badge b-32\">3.2</span> / <span class=\"badge b-33\">3.3</span> / <span class=\"badge b-now\">P2</span> 都是前后 story 的补丁。</p>\n</section>"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "CODE · 01",
        "title": "数据形状：parts 真源 + sequence",
        "subtitle": "先看库，再看读写。两张 10-22 的迁移是 2.5 之后的后续改动：id 改名/paging 属 P2（也是 3.2 前置），title 默认值清理是同期收尾。",
        "body": "<div class=\"callout\"><strong>读法：</strong>2.5 的 schema 只有一张迁移（<code>20261020093643</code>）。当前 <code>repo/session.ts</code> 只剩 <code>getSession</code>，因为 2026-10-22 的 hono-crud 重构把 create/list/update 搬进了 <code>routes/crud.ts</code>；别把当前文件误读成 2.5 的全部。</div>",
        "blocks": [
          {
            "id": "migration-parts",
            "file": "db/migrations/20261020093643_add_message_parts_and_sequence.sql",
            "lang": "sql",
            "ranges": [
              [
                1,
                28
              ]
            ],
            "notes": [
              {
                "lines": "2-3",
                "title": "sessions：改名 + 删 user_id",
                "badge": "2.5",
                "body": "<p>P1 是单用户本地产品，<code>user_id</code> 没有真实用途；2.5 直接删掉。主键当时叫 <code>session_id</code>，P2 又改成了 <code>id</code>。</p>"
              },
              {
                "lines": "5-10",
                "title": "messages：换掉旧形状",
                "badge": "2.5",
                "body": "<p><code>sources</code> 列被 <code>parts</code> 取代；<code>parts</code> 是 JSONB，默认空数组。role 枚举不再允许 <code>tool</code>；工具调用作为 assistant 消息里的一个 part 存在，因此只剩 <code>user</code>/<code>assistant</code>。</p>"
              },
              {
                "lines": "12-13",
                "title": "会话内排序索引",
                "badge": "2.5",
                "body": "<p><code>sequence</code> 是 identity，插入时数据库自动给号；索引 <code>(session_id, sequence)</code> 让 <code>GET /sessions/:id/messages</code> 按会话正序读。它是全局递增，不是每个会话从 1 开始。</p>"
              },
              {
                "lines": "15-28",
                "title": "down 能回滚",
                "badge": "2.5",
                "body": "<p>回滚会恢复 <code>sources</code>/<code>user_id</code> 并重建 role 枚举。注意 down 会丢掉 <code>parts</code> 和 <code>sequence</code> 的数据，生产上不能随便跑。</p>"
              }
            ]
          },
          {
            "id": "repo-session",
            "file": "src/adapter/repo/session.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                44
              ]
            ],
            "notes": [
              {
                "lines": "1-4",
                "title": "当前只剩 getSession",
                "badge": "P2",
                "body": "<p>文件头自己写明：创建/更新/列表由 <code>routes/crud.ts</code> 统一注册。2.5 当时在本文件（或合并前的 <code>read-content.ts</code>）里有 <code>createSession</code>/<code>listSessions</code>/<code>updateSessionTitle</code>；P2 把它们搬走了。</p>"
              },
              {
                "lines": "17-20",
                "title": "Session 形状",
                "badge": "2.5",
                "body": "<p>当前字段是 <code>id</code>（P2 改名），2.5 时叫 <code>session_id</code>。标题允许空串，前端会映射成「未命名会话」；空串来自创建时的 <code>Title ?? ''</code>。</p>"
              },
              {
                "lines": "36-42",
                "title": "getSession 的软删过滤",
                "badge": "2.5",
                "body": "<p>所有读都带 <code>deleted_at IS NULL</code>。<code>/chat</code> 和 <code>GET /:id/messages</code> 先调它：返回 null 就回 404，不会继续读消息。</p>"
              }
            ]
          },
          {
            "id": "repo-message",
            "file": "src/adapter/repo/message.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                67
              ]
            ],
            "notes": [
              {
                "lines": "1-4",
                "title": "parts 是 UI 真源",
                "badge": "2.5",
                "body": "<p>文件头把口径写死：<code>parts</code> 是 UI 真源，<code>sequence</code> 由 identity 递增。读消息一律带软删过滤，按正序。</p>"
              },
              {
                "lines": "18-25",
                "title": "Message 形状",
                "badge": "2.5",
                "body": "<p><code>id</code>/<code>session_id</code>/<code>role</code>/<code>content</code>/<code>parts</code>/<code>sequence</code>。当前 <code>id</code> 是 P2 改名；2.5 叫 <code>message_id</code>。</p>"
              },
              {
                "lines": "31-43",
                "title": "rowToMessage：JSONB 与日期",
                "badge": "2.5",
                "body": "<p>pg 可能把 JSONB 读成字符串，所以先判断再 <code>JSON.parse</code>；<code>sequence</code> 用 <code>Number</code> 转，避免 bigint 以字符串形式漏到业务层。</p>"
              },
              {
                "lines": "45-56",
                "title": "createMessage：user/assistant 共用",
                "badge": "2.5",
                "body": "<p>只插入 <code>session_id</code>/<code>role</code>/<code>content</code>/<code>parts</code>；<code>sequence</code> 交给数据库。user 在流开始前插，assistant 在 <code>onEnd</code> 插。</p>"
              },
              {
                "lines": "58-66",
                "title": "按会话正序读历史",
                "badge": "2.5",
                "body": "<p>SQL 只按 <code>sequence ASC</code> 排，不在这里截断；「最近 12 条」是 ChatService 的业务规则，放在更上层。</p>"
              }
            ]
          },
          {
            "id": "migration-title-default",
            "file": "db/migrations/20261022101758_drop_sessions_title_default.sql",
            "lang": "sql",
            "ranges": [
              [
                1,
                6
              ]
            ],
            "notes": [
              {
                "lines": "2-3",
                "title": "10-22 收尾：title 默认值移除",
                "badge": "后续",
                "body": "<p>这条迁移属于 2026-10-22 的后续收尾（commit 09b5529），不是 2.5。2.5 的 <code>createSession(Title ?? '')</code> 已经在应用层兜底；这里把 DB 默认值也去掉，避免两处兜底。当前 <code>crud.ts</code> 的 create hook 仍是 <code>title ?? ''</code>。</p>"
              },
              {
                "lines": "5-6",
                "title": "down 恢复默认值",
                "badge": "后续",
                "body": "<p>回滚只是把默认值加回来，不改已有行。</p>"
              }
            ]
          },
          {
            "id": "migration-rename-id",
            "file": "db/migrations/20261022114648_rename_primary_keys_to_id.sql",
            "lang": "sql",
            "ranges": [
              [
                1,
                12
              ]
            ],
            "notes": [
              {
                "lines": "2-6",
                "title": "P2：主键统一 id",
                "badge": "P2",
                "body": "<p>hono-crud 约定主键叫 <code>id</code>；sessions/messages/traces/trace_stages 全部改名。所以本页当前代码里看到 <code>id</code>，而 2.5 的历史提交里是 <code>session_id</code>/<code>message_id</code>。</p>"
              },
              {
                "lines": "8-12",
                "title": "down 改回旧名",
                "badge": "P2",
                "body": "<p>回滚恢复四个旧主键名；外键引用随列重命名自动跟随。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-api",
        "kicker": "CODE · 02",
        "title": "接口层：会话与问答",
        "subtitle": "薄路由，重服务。当前 sessions 的 list/create/update 在 crud.ts；GET messages 与 /chat 仍是手写。",
        "body": "<div class=\"callout\"><strong>先分清：</strong>2.5 当时在 <code>routes/sessions/sessions.ts</code> 手写了 GET/POST/PATCH。现在这些端点由 <code>routes/crud.ts</code> 的 hono-crud 注册；当前 <code>routes/sessions.ts</code> 只保留 <code>GET /:id/messages</code>。下面把两边都摆出来，badge 标清归属。</div>",
        "blocks": [
          {
            "id": "route-crud-sessions",
            "file": "src/routes/crud.ts",
            "lang": "ts",
            "ranges": [
              [
                44,
                62
              ]
            ],
            "notes": [
              {
                "lines": "44-48",
                "title": "sessions 的 crud 配置",
                "badge": "P2",
                "body": "<p>当前 list/create/update/delete 的入口。写入字段只允许 <code>title</code>，且 trim 后至少 1 个字符；2.5 的 PATCH 也是「trim 后为空 400」。</p>"
              },
              {
                "lines": "49-55",
                "title": "list 的过滤/排序/分页",
                "badge": "P2",
                "body": "<p>2.5 的 <code>listSessions</code> 是全量、按 <code>created_at DESC</code>。当前加了 search/sort/page，默认每页 1000、最大 1000；这是 P2 的分页改造，不是 2.5。</p>"
              },
              {
                "lines": "57",
                "title": "create 的 title 兜底",
                "badge": "P2",
                "body": "<p><code>title: Data.title ?? ''</code> 与 2.5 的 <code>createSession(Title ?? '')</code> 等价：空标题允许存在，界面再映射成「未命名会话」。</p>"
              },
              {
                "lines": "58-59",
                "title": "update / delete",
                "badge": "P2",
                "body": "<p><code>update</code> 对应 2.5 的 <code>PATCH /sessions/:id</code>；<code>delete</code> 是 2.5 之后才补的——2.5 时后端没有 DELETE，前端只能写本机 tombstone。</p>"
              },
              {
                "lines": "60-62",
                "title": "响应信封",
                "badge": "P2",
                "body": "<p><code>rawItem: true</code> 让 create/update 返回单条 session（不是 <code>{session}</code> 包一层），前端 <code>isSessionRecord</code> 直接校验这个形状。</p>"
              }
            ]
          },
          {
            "id": "route-sessions",
            "file": "src/routes/sessions.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                53
              ]
            ],
            "notes": [
              {
                "lines": "1-5",
                "title": "当前只剩 GET messages",
                "badge": "P2",
                "body": "<p>文件头说明：会话 list/read/create/update/delete 已由 <code>routes/crud.ts</code> 统一注册。2.5 的 GET/POST/PATCH 手写路由在 2026-10-22 重构后被替换；行为契约仍由 2.5 定。</p>"
              },
              {
                "lines": "30-45",
                "title": "GET /:id/messages",
                "badge": "2.5",
                "body": "<p>先校验 UUID，再 <code>getSession</code> 判 404，最后按 <code>sequence</code> 读消息。2.5 返回 <code>{ session_id, messages }</code>；P2 改名后当前返回 <code>{ id, messages }</code>，前端只读 <code>messages</code>。</p>"
              },
              {
                "lines": "51-53",
                "title": "uuidOk",
                "badge": "2.5",
                "body": "<p>与 <code>/chat</code> 用同一个 UUID 正则；本地会话 <code>local-s-*</code> 因此不会误进库。</p>"
              }
            ]
          },
          {
            "id": "route-chat",
            "file": "src/routes/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                67
              ]
            ],
            "notes": [
              {
                "lines": "1-9",
                "title": "契约：{query, sessionId}",
                "badge": "2.5",
                "body": "<p>本路由不收 messages、不做查询改写；历史由 ChatService 按 sessionId 读库。检索在 2.6 的工具里，本路由因此不装配 Retriever，也没有维度状态码。</p>"
              },
              {
                "lines": "37-48",
                "title": "body 校验顺序",
                "badge": "2.5",
                "body": "<p>先判 JSON 对象与两个字段类型，再 trim 判空，再判 sessionId UUID。错误码分别是 <code>E_BAD_BODY</code>/<code>E_EMPTY_QUERY</code>/<code>E_BAD_ID</code>，都在 SSE 开始前返回。</p>"
              },
              {
                "lines": "50-54",
                "title": "会话存在才进流",
                "badge": "2.5",
                "body": "<p><code>getSession</code> 返回 null（不存在或已软删）就 404 <code>E_SESSION_NOT_FOUND</code>。否则 <code>ask</code> 直接返回一个 <code>Response</code>（UI message stream）。</p>"
              },
              {
                "lines": "65-67",
                "title": "uuidOk",
                "badge": "2.5",
                "body": "<p>与 sessions 路由同一套正则；非法 sessionId 不会走到数据库。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-chat",
        "kicker": "CODE · 03",
        "title": "ChatService：历史怎么进模型",
        "subtitle": "2.5 的主战场。读最近 12 条、只留 text、拼本轮 user、落 assistant；3.2 在外面加了一层 trace/stream 包装。",
        "body": "<div class=\"callout strong\"><strong>看代码的顺序：</strong>先看 <code>HISTORY_MESSAGES</code> 和 <code>storedUiMessage</code>（2.5 的规则），再看 <code>createMessage</code> 的 user/assistant 落库，最后看带 badge 的 trace/tools 补丁。不要把这些补丁当成 2.5 的多轮逻辑。</div>",
        "blocks": [
          {
            "id": "agent-chat",
            "file": "src/agent/chat/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                147
              ]
            ],
            "notes": [
              {
                "lines": "1-10",
                "title": "imports：2.5 核心 + 3.2 trace",
                "badge": "3.2",
                "body": "<p><code>convertToModelMessages</code>、<code>UIMessage</code> 是 2.5 的核心；<code>createUIMessageStreamResponse</code>/<code>toUIMessageStream</code> 与 trace bridge 是 3.2 的补丁。2.5 当时用 <code>Result.toUIMessageStreamResponse</code>。</p>"
              },
              {
                "lines": "12-21",
                "title": "INSTRUCTIONS 里的多轮规则",
                "badge": "2.5",
                "body": "<p>第 18 行是 2.5 加的：让模型用历史解析代词，并把 retrieve 的 query 写成完整、独立的问题。引用规则（8 位 chunkId、不要自己编号）是 2.3/2.6 的口径。</p>"
              },
              {
                "lines": "23",
                "title": "12 条消息 = 6 轮",
                "badge": "2.5",
                "body": "<p>不是按 token 估算，而是按消息条数硬截。正常一轮 user+assistant 两条，12 条就是 6 轮；中断留下孤立 user 时，实际轮数可能少于 6。</p>"
              },
              {
                "lines": "25-38",
                "title": "DI 构造 + 2.6 tools",
                "badge": "DI",
                "body": "<p><code>@singleton</code>/<code>@inject</code> 是 2026-10-20 的 DI 装配，2.5 只是沿用；<code>buildAgentTools(R.retriever)</code> 是 2.6 的检索工具。2.5 新增的是把 <code>Repo</code> 注入进来读历史。</p>"
              },
              {
                "lines": "40-56",
                "title": "trace 前置：不是 2.5",
                "badge": "3.2",
                "body": "<p><code>currentTraceId</code>、<code>beginChat</code>、<code>setTraceSession</code> 都是 3.1/3.2 的观测补丁。2.5 的 <code>ask</code> 从读历史开始；这些行只是现在包在它前面。</p>"
              },
              {
                "lines": "57-69",
                "title": "读历史 + 落 user + 转模型消息",
                "badge": "2.5",
                "body": "<p>先 <code>getMessagesBySession</code>，再 <code>slice(-12)</code>，再经 <code>storedUiMessage</code> 只留 text；然后立刻 <code>createMessage(user)</code>，把本轮 user 拼进 <code>Messages</code>，最后 <code>convertToModelMessages</code>。user 先落库，模型流失败也会留一条孤立 user（已接受的 deferred）。</p>"
              },
              {
                "lines": "71-87",
                "title": "streamText：2.6 的工具与上限",
                "badge": "2.6",
                "body": "<p><code>tools</code> 与 <code>stopWhen: stepCountIs(5)</code> 是 2.6 的；<code>telemetry.functionId</code> 是 3.2 的。2.5 的多轮不需要改这里——模型看到历史后自己决定检索词。</p>"
              },
              {
                "lines": "88-100",
                "title": "流包装：3.2 改写过",
                "badge": "3.2",
                "body": "<p>当前是 <code>toUIMessageStream</code> + <code>createUIMessageStreamResponse</code>（未提交的 3.2 补丁），为了在 <code>onEnd</code> 里同时收口 trace。2.5 当时是 <code>Result.toUIMessageStreamResponse({ originalMessages, onEnd })</code>，assistant 落库逻辑相同。</p>"
              },
              {
                "lines": "101-120",
                "title": "trace 收口：不是 2.5",
                "badge": "3.2",
                "body": "<p>流结束/中断时写 <code>finishTrace</code>、拿 Langfuse trace id。2.5 没有这些行；它们不影响多轮语义，但会让代码看起来比 2.5 长很多。</p>"
              },
              {
                "lines": "121-134",
                "title": "落 assistant：parts 原样保存",
                "badge": "2.5",
                "body": "<p><code>responseMessage.parts</code> 全部写进 <code>parts</code>，<code>content</code> 只是把 text parts 拼成扁平字符串。当前轮的 <code>reasoning</code>、<code>tool-retrieve</code> 因此都在库里；中断/取消直接 return，不落 assistant。</p>"
              },
              {
                "lines": "141-147",
                "title": "历史白名单：只留 text",
                "badge": "2.5",
                "body": "<p>这是 2.5 最关键的一行规则：<code>filter(Part.type === 'text')</code>。tool parts（整份命中全文）和 reasoning 都不回灌；没有 text 的消息返回 null 被丢掉。当前轮 reasoning 仍在 <code>responseMessage.parts</code> 里保存，只是下一轮不再喂给模型。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "code",
      "section": {
        "id": "code-web",
        "kicker": "CODE · 04",
        "title": "前端：切会话、恢复历史、落标题",
        "subtitle": "HTTP 层四个函数 → 会话 store 的 hydrate/active/rename → Chat 登记表的 loadHistory → 页面接线。",
        "body": "<div class=\"callout\"><strong>读法：</strong>前端不保存「服务端历史」的第二份真相。它只保存每个会话的 <code>Chat</code> 实例；首次切到某会话时从 <code>GET /sessions/:id/messages</code> 读一次，正在流或已有消息时绝不覆盖。</div>",
        "blocks": [
          {
            "id": "web-client",
            "file": "app/web/src/api/client.ts",
            "source": "web:src/api/client.ts",
            "lang": "ts",
            "ranges": [
              [
                92,
                111
              ],
              [
                446,
                487
              ]
            ],
            "notes": [
              {
                "lines": "92-99",
                "title": "SessionRecord",
                "badge": "2.5",
                "body": "<p>当前字段 <code>id</code> 是 P2 改名；2.5 时是 <code>session_id</code>。标题允许空串，UI 层再映射成「未命名会话」。</p>"
              },
              {
                "lines": "101-111",
                "title": "MessageRecord",
                "badge": "2.5",
                "body": "<p><code>parts</code> 是 UI 真源，<code>sequence</code> 用来排序；<code>id</code> 同样是 P2 改名（2.5 为 <code>message_id</code>）。</p>"
              },
              {
                "lines": "446-453",
                "title": "listSessions",
                "badge": "2.5",
                "body": "<p>GET 列表；形状不对必须抛错，不能把漂移读成空数组——否则 hydrate 会反手 POST 一条，读请求变成写入。单条坏记录只跳过。</p>"
              },
              {
                "lines": "455-464",
                "title": "createSession",
                "badge": "2.5",
                "body": "<p>POST 空 body 建空标题会话，后端生成 UUID；<code>201</code> 后校验形状。2.5 的「新会话」按钮与首问前的本地会话升级都走它。</p>"
              },
              {
                "lines": "466-471",
                "title": "fetchMessages",
                "badge": "2.5",
                "body": "<p>GET 该会话的消息，按 <code>sequence</code> 正序；返回的 <code>parts</code> 含 <code>tool-retrieve</code> 快照，前端恢复后可直接渲染引用。</p>"
              },
              {
                "lines": "478-487",
                "title": "updateSessionTitle",
                "badge": "2.5",
                "body": "<p>PATCH 只改标题；空标题后端 400，调用方先保证非空。首问自动命名时调用。</p>"
              }
            ]
          },
          {
            "id": "web-sessions",
            "file": "app/web/src/api/sessions.ts",
            "source": "web:src/api/sessions.ts",
            "lang": "ts",
            "ranges": [
              [
                85,
                89
              ],
              [
                122,
                129
              ],
              [
                148,
                158
              ],
              [
                243,
                306
              ],
              [
                392,
                415
              ]
            ],
            "notes": [
              {
                "lines": "85-89",
                "title": "isRemoteSession",
                "badge": "2.5",
                "body": "<p>UUID 正则判断是否远程会话；<code>local-s-*</code> 是本机兜底，没有库行，不能查历史、也不能直接发 <code>/chat</code>。</p>"
              },
              {
                "lines": "122-129",
                "title": "fromRemote",
                "badge": "2.5",
                "body": "<p>把后端记录映射成 UI 会话：空标题变「未命名会话」，<code>group_id</code> 先置 null（分组是后续轮次）。</p>"
              },
              {
                "lines": "148-158",
                "title": "activeId 住模块",
                "badge": "2.5",
                "body": "<p>活跃会话不放在组件 state；<code>/ask</code> 卸载再挂载时不能默认跳回 <code>sessions[0]</code>，否则 B 在流、回来站在 A，流写进一个界面拿不到的 Chat。</p>"
              },
              {
                "lines": "243-255",
                "title": "createSession 优先走后端",
                "badge": "2.5",
                "body": "<p>POST 拿 UUID；失败才退回本机会话并标「本机」。聊天不因后端暂时不可达而断。</p>"
              },
              {
                "lines": "270-306",
                "title": "hydrateSessions",
                "badge": "2.5",
                "body": "<p>GET 列表并进来；空库<strong>不写库</strong>，保留本机占位，等用户点新会话或第一次提问才 POST。GET 在飞时用户可能已 POST 新会话，所以按 id 合并 Fresh + Remote，旧快照不能吞新行。失败 15s 重试。</p>"
              },
              {
                "lines": "392-401",
                "title": "renameSession：只改第一问",
                "badge": "2.5",
                "body": "<p>只有标题还是「未命名会话」时才改；第二问不覆盖第一问起的名。标题由 <code>titleOf</code> 截 24 字符。</p>"
              },
              {
                "lines": "403-415",
                "title": "pendingTitles：PATCH 失败不丢",
                "badge": "2.5",
                "body": "<p>PATCH 失败不回滚本地标题，而是记成「还欠服务端一次」；下一次 <code>touchSession</code>（发问）补写。不播报：服务不可达已有页头红点/Banner。</p>"
              }
            ]
          },
          {
            "id": "web-chat",
            "file": "app/web/src/api/chat.ts",
            "source": "web:src/api/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                28,
                58
              ]
            ],
            "notes": [
              {
                "lines": "28-33",
                "title": "transport：只发最后一句",
                "badge": "2.5",
                "body": "<p><code>prepareSendMessagesRequest</code> 把 body 固定成 <code>{query: lastUserText(messages), sessionId}</code>；历史不随请求走，服务端自己读库。</p>"
              },
              {
                "lines": "35-45",
                "title": "chatFor：一会话一实例",
                "badge": "2.5",
                "body": "<p>登记表住模块级；同一个 sessionId 永远拿到同一只 Chat，切走再切回来不换实例，正在流的那半条不会丢。</p>"
              },
              {
                "lines": "47-58",
                "title": "loadHistory：只读一次",
                "badge": "2.5",
                "body": "<p>每个会话只从库里读一次；正在流/已有消息时返回 null，不覆盖当前对话。返回的 <code>parts</code> 原样交给 <code>setMessages</code>。第 57 行 <code>Message.id</code> 是 P2 改名（2.5 为 <code>message_id</code>）。</p>"
              }
            ]
          },
          {
            "id": "web-ask",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                103,
                119
              ],
              [
                261,
                292
              ],
              [
                307,
                322
              ]
            ],
            "notes": [
              {
                "lines": "103-119",
                "title": "切会话恢复历史",
                "badge": "2.5",
                "body": "<p>只对远程 UUID 查历史；<code>local-s-*</code> 会换回 400 E_BAD_ID，所以先跳过，等首问升级成 UUID 再读。已有消息或流在跑就不覆盖；<code>alive</code> 防止切走后迟到的 setMessages。</p>"
              },
              {
                "lines": "261-272",
                "title": "本机会话提问前先升级",
                "badge": "2.5",
                "body": "<p>本地占位没有库行，<code>/chat</code> 收不到；先 <code>POST /sessions</code> 换成 UUID，换不成照原样发，由 <code>/chat</code> 报错。</p>"
              },
              {
                "lines": "273-289",
                "title": "停旧流 → 改名 → 发新问",
                "badge": "2.5 / 2.2",
                "body": "<p><code>renameSession</code> 与 <code>sendMessage({ text })</code> 是 2.5 的；前面「忙时先 stop、800ms 停不干净就不发」是 2.2 前端 <code>b9ad65e</code> 已有的竞态保护，不是 2.5 的原始最小实现。</p>"
              },
              {
                "lines": "307-314",
                "title": "switchSession",
                "badge": "2.5",
                "body": "<p>切会话只做三件事：记住 activeId、换 sessionId、收起上一会话的抽屉/点亮。历史恢复由上面的 effect 负责。</p>"
              },
              {
                "lines": "316-322",
                "title": "newSession",
                "badge": "2.5",
                "body": "<p>点「新会话」先 POST 拿 UUID，再切过去；创建中禁用按钮，防止连点建两条。</p>"
              }
            ]
          },
          {
            "id": "web-session-list",
            "file": "app/web/src/components/session-list/session-list.tsx",
            "source": "web:src/components/session-list/session-list.tsx",
            "lang": "ts",
            "ranges": [
              [
                390,
                424
              ]
            ],
            "notes": [
              {
                "lines": "390-401",
                "title": "一行会话：选中与切换",
                "badge": "2.5",
                "body": "<p>整行是 button，点击 <code>OnSelect(session.id)</code>；<code>aria-current</code> 标出当前会话。2.5 的多会话列表就靠这个入口切。</p>"
              },
              {
                "lines": "403-410",
                "title": "标题、时间、本机徽标",
                "badge": "2.5",
                "body": "<p>标题来自服务端；<code>formatDay(updated_at)</code> 显示更新时间；<code>local-s-*</code> 行标「本机」，提醒它刷新即丢。</p>"
              },
              {
                "lines": "413-419",
                "title": "管理态的分组/删除：后续",
                "badge": "后续",
                "body": "<p>「管理」里的移组/删除来自 needs #42/#43，是 2026-10-21 另一轮会话卡工作；2.5 只要求列表、选中、标题与历史恢复。不要把这些动作算成 2.5 的 AC。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\"><span class=\"kicker\">CHOICES</span><h2>关键取舍与容易踩的坑</h2><p class=\"section-sub\">2.5 的难点不在代码量，而在「哪些东西不该进下一轮」。下面每条都对应一个真实失效或一次 Lynx 拍板。</p></header>\n  <div class=\"choice-grid\">\n    <article class=\"choice\"><span class=\"choice-no\">01</span><h3>parts 是唯一真源</h3><p>工具调用、reasoning、正文都在 parts 里；<code>content</code> 只是扁平文本，方便调试/兜底，不是第二份真相。<code>sources</code> 列因此删除。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">02</span><h3>只回灌 text parts</h3><p>tool-retrieve 的 output 是上一轮整份命中全文；回灌会撑 token，还可能让模型引用旧 chunk。白名单只留 text，reasoning 同样不回灌。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">03</span><h3>不另设查询改写调用</h3><p>历史交给模型，由模型自己把「那 ef_construction 呢」展开成完整检索词。少一次模型调用、少一条失败分支；实测第二轮 tool input 已自包含。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">04</span><h3>12 条 = 近 6 轮</h3><p>不做 token 估算，也不加「会话过长」提示；AC 允许二选一，这里选最简单的确定规则。正常一轮两条，所以 12 条刚好 6 轮。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">05</span><h3>服务端真源，前端只传 sessionId</h3><p>客户端不能伪造上下文；刷新恢复与多轮读的是同一份库。前端不把 <code>messages</code> 回传，也不在本地拼历史。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">06</span><h3>中断不落 assistant</h3><p>半截回答只在界面标「未完整」，库里留一条孤立 user。最简口径，已记 deferred；要补时在 aborted 分支落部分 parts。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">07</span><h3>空库 hydrate 不写库</h3><p>GET 空列表只保留本机占位，不自动 POST。旧行为每次刷新长一条空会话，真实后端 E2E 抓到两条；现在第一次提问或点新会话才建远程行。</p></article>\n    <article class=\"choice\"><span class=\"choice-no\">08</span><h3>标题 PATCH 失败不回滚</h3><p>本地先改名，PATCH 失败记 pendingTitles，下一次发问补写；聊天不被标题同步失败打断。首问只改「未命名会话」，第二问不覆盖。</p></article>\n  </div>\n  <ul class=\"pitfall-list\">\n    <li><strong>当前轮 reasoning 必须保留：</strong>AI SDK 在流里产出 reasoning part，<code>onEnd</code> 把 <code>responseMessage.parts</code> 原样落库，前端折在「思考过程」里。跨轮 <code>storedUiMessage</code> 只留 text，所以 reasoning 不回灌——这是 2.5 的白名单规则，不是把当前轮也丢掉。</li>\n    <li><strong>「历史 6 轮」是按 12 条消息截：</strong>正常一轮 user+assistant 两条；中断只落 user 时，实际轮数会少于 6。别在文档里写成「严格 6 组问答」。</li>\n    <li><strong>上一轮回答只作上下文，不作引用依据：</strong>历史只带 text，上一轮的 tool 结果不在模型上下文里；提示词也要求「不要引用不在本轮 tool output 里的 id」。但历史 text 里可能残留旧 citation 字样，界面按当前消息的 tool parts 解析，不替旧文字背书。</li>\n    <li><strong>sequence 是全局 identity：</strong>不是每个会话从 1 开始。真实跑里第二轮的 4 条消息 sequence 是 34–37；按会话内正序读即可，不要拿它当轮次号。</li>\n    <li><strong>P2 改名会让字段对不上：</strong>当前代码 <code>sessions.id</code>/<code>messages.id</code>；2.5 历史提交是 <code>session_id</code>/<code>message_id</code>。看 git 历史或旧文档时要先做这层换算。</li>\n    <li><strong>2.5 没有 DELETE：</strong>当时后端只有 GET/POST/PATCH/GET messages；前端删除只能写本机 tombstone。当前代码里的 DELETE 是后续 P2 补的，别当成 2.5 的交付。</li>\n    <li><strong>POST /sessions 坏 JSON 吞成 {} 是已知 deferred：</strong>2.5 手写路由用 <code>.catch(() => ({}))</code>，坏 JSON 会 201 建空会话。当前已换 hono-crud，是否等价行为本轮未实测；按 deferred 记账，不在这里宣称已修。</li>\n    <li><strong>sessions-hydrate-empty.test.ts 仍是红的：</strong>它期望「GET 空列表 → POST 一条」，当前实现是空库不写。规则已变，测试待按新口径改；这是历史全量跑唯一红，不是 2.5 新引入的运行时错误。</li>\n    <li><strong>/chats 不是聊天页：</strong><code>app/web/src/routes/chats.tsx</code> 是 Epic 3 的对话观测页，读 <code>/observability/*</code> 与 Langfuse；2.5 的聊天页是 <code>/ask</code>。</li>\n  </ul>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\"><span class=\"kicker\">VERIFY</span><h2>验证命令</h2><p class=\"section-sub\">先分清：哪些是 2026-10-21 历史真跑过，哪些是本轮只做静态核对、没有重跑。</p></header>\n  <div class=\"callout strong\"><strong>本轮状态：</strong>只生成文档工件，没有启动前后端、没有跑测试、没有开浏览器。下面的「历史真跑过」来自 <code>handoff-2026-10-21-epic2-story5-multiturn-and-epic-close.md</code> 与两份前端 summary；当前代码在 P2/3.2 之后已有字段和包装变化，直接重跑时要按当前 <code>id</code>/<code>toUIMessageStream</code> 口径看。</div>\n  <div class=\"test-grid\">\n    <article class=\"test-card\"><h3>后端静态 + 测试（历史）</h3><pre class=\"snippet\">cd app/server\nnpx tsc --noEmit\nnpx vitest run test/session-repo.test.ts\nnpx vitest run test/chat-tool-flow.test.ts</pre><p class=\"test-note\">历史结果：<code>src/</code> tsc 0 错；vitest 8 文件 / 25 条全过。chat-tool-flow 真打 DB + Ollama + chat 模型，慢且受上游波动影响。本轮未重跑。</p></article>\n    <article class=\"test-card\"><h3>前端静态 + 测试（历史）</h3><pre class=\"snippet\">cd app/web\nnpx tsc --noEmit\nnpx vitest run src/api/chat.test.ts\nnpx vitest run src/api/sessions-remote.test.ts\nnpx vitest run</pre><p class=\"test-note\">历史结果：tsc 0 错；全量 317/318，唯一红是 <code>sessions-hydrate-empty.test.ts</code>（空库不再 POST 的规则变更）。本轮未重跑。</p></article>\n  </div>\n  <h3 class=\"block-title\">1. 建会话 + 两轮追问（真接口）</h3>\n  <pre class=\"snippet\">BASE=http://127.0.0.1:3005\n\nSID=$(curl -s -X POST \"$BASE/sessions\" \\\n  -H 'content-type: application/json' -d '{}' | jq -r .id)\necho \"$SID\"\n\ncurl -sN -X POST \"$BASE/chat\" \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"query\\\":\\\"HNSW 索引的 m 参数默认值是多少？\\\",\\\"sessionId\\\":\\\"$SID\\\"}\"\n\ncurl -sN -X POST \"$BASE/chat\" \\\n  -H 'content-type: application/json' \\\n  -d \"{\\\"query\\\":\\\"那 ef_construction 呢\\\",\\\"sessionId\\\":\\\"$SID\\\"}\"</pre>\n  <p class=\"table-note\">历史真跑过（2026-10-21，PORT=3005）：第二轮 tool input 被模型自己展开成完整问题「HNSW 索引的 m 参数和 ef_construction 参数默认值是多少？」；不另设查询改写。</p>\n  <h3 class=\"block-title\">2. 读消息、改标题</h3>\n  <pre class=\"snippet\">curl -s \"$BASE/sessions/$SID/messages\" | jq '.messages[] | {id, role, sequence, parts}'\n\ncurl -s -X PATCH \"$BASE/sessions/$SID\" \\\n  -H 'content-type: application/json' \\\n  -d '{\"title\":\"HNSW 参数追问\"}' | jq</pre>\n  <p class=\"table-note\">历史真跑过：<code>GET /sessions/:id/messages</code> 返回 4 条，sequence 34–37，parts 依次含 <code>step-start</code>/<code>reasoning</code>/<code>tool-retrieve</code>/<code>text</code>。当前 P2 字段是 <code>id</code>，如果你的库还是旧迁移，字段会是 <code>message_id</code>。</p>\n  <h3 class=\"block-title\">3. 直接查库：parts 与 sequence</h3>\n  <pre class=\"snippet\">psql \"$DATABASE_URL\" -c \"\nSELECT id, session_id, role, sequence,\n       jsonb_array_length(parts) AS part_count,\n       parts\nFROM messages\nWHERE session_id = '$SID'\nORDER BY sequence ASC;\n\"</pre>\n  <p class=\"table-note\">预期：user 在前、assistant 在后；assistant 的 <code>parts</code> 含 <code>text</code>，真实跑里还含 <code>reasoning</code> 与 <code>tool-retrieve</code>；<code>sequence</code> 严格递增。不要拿 sequence 当每会话从 1 开始的轮次号。</p>\n  <h3 class=\"block-title\">4. 前端手测（归 Lynx 浏览器）</h3>\n  <pre class=\"snippet\">cd app/web\nnpm run dev\n# 打开 /ask：\n# 1) 新建会话 → 提第一问 → 标题变成问题前缀\n# 2) 同一会话提第二问 → 回答能接上上一轮\n# 3) 切到另一个会话再切回 → 历史还在、不串\n# 4) 刷新页面 → 历史还在\n# 5) 断网/后端停掉时刷新 → 保留本机会话，不自动 POST 空会话</pre>\n  <p class=\"table-note\">2.5 只要求「切会话恢复 + 多会话列表 + 首问标题」；分组/删除、引用抽屉的「来源已删除」是同期或后续轮次，别混进这一格的验收。</p>\n  <h3 class=\"block-title\">5. 文档页自身的构建/校验</h3>\n  <pre class=\"snippet\">cd /Users/lynx/Documents/Dev/SSE_WeSocket\nnode .qoder/skills/story-walkthrough/scripts/build.mjs \\\n  _Agents/walkthroughs/.runs/epic2-story5/walkthrough.config.mjs\nnode .qoder/skills/story-walkthrough/scripts/validate.mjs \\\n  _Agents/walkthroughs/epic2-story5-multiturn.html</pre>\n  <p class=\"table-note\">本轮已跑；统计见 <code>.runs/epic2-story5/validation.txt</code> 与 <code>.memlog.md</code>。</p>\n</section>"
    },
    {
      "type": "html",
      "html": "<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\"><span class=\"kicker\">NEXT</span><h2>与前后 story 的衔接</h2><p class=\"section-sub\">2.5 把「会话/消息」这条数据链打通；2.6 才把检索做成工具，Epic 3 再把观测接上。</p></header>\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>从 2.4 接过来</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">2.3/2.4：引用与原文回链</li>\n        <li>命中已经随 <code>tool-retrieve</code> part 回到前端</li>\n        <li>2.5 不改引用渲染，只决定「历史里不回灌 tool parts」</li>\n        <li>跨轮引用仍由当前消息的 tool parts 解析</li>\n      </ul>\n      <p class=\"map-note\">上一轮回答只作上下文；旧引用文字不获得新的证据地位。</p>\n    </div>\n    <div class=\"flow-card\">\n      <h3>交给 2.6 / Epic 3</h3>\n      <ul class=\"tree\">\n        <li class=\"root\">2.6：retrieve 工具化 <span class=\"badge b-now\">2.6</span></li>\n        <li>2.5 的 sessionId/parts 落库成为工具链的会话底座</li>\n        <li>3.1/3.2：trace 公共行与 Langfuse <span class=\"badge b-31\">3.1</span><span class=\"badge b-32\">3.2</span></li>\n        <li>3.2 用 sessionId 把 chat trace 关联到会话</li>\n        <li>3.3：trace 面板与 <code>/chats</code> 观测页 <span class=\"badge b-33\">3.3</span></li>\n        <li>P2：hono-crud 主键统一 id、分页 <span class=\"badge b-now\">P2</span></li>\n      </ul>\n      <p class=\"map-note\">这些都不是 2.5；读当前代码时按 badge 区分。</p>\n    </div>\n  </div>\n  <div class=\"callout strong\"><strong>真实跑过的证据（历史）：</strong>2026-10-21 在 PORT=3005 真库 + Ollama + deepseek 上跑了两轮。第二问「那 ef_construction 呢」由模型自己展开成完整检索词；<code>GET /sessions/:id/messages</code> 返回 4 条，sequence 34–37，parts 含 <code>step-start</code>/<code>reasoning</code>/<code>tool-retrieve</code>/<code>text</code>。本轮没有重跑。</div>\n  <div class=\"next-box\">\n    <p><strong>未决/后续：</strong>中断不落 assistant（已接受）；token 估算与「会话过长」提示未做；POST /sessions 坏 JSON 的 deferred 仍在；<code>sessions-hydrate-empty.test.ts</code> 仍待按新规则改；2.5 无 DELETE，当前 DELETE 是后续 P2。</p>\n    <div class=\"next-links\"><a href=\"#conclusion-and-boundary\">回到边界</a><a href=\"#verification-commands\">验证命令</a><a href=\"#files\">文件地图</a></div>\n  </div>\n</section>"
    },
    {
      "type": "html",
      "html": "<footer class=\"footer\">\n  <p>Story 2.5 走读页 · 依据当前工作区真实文件与 git 历史生成 · 2026-10-21 story 收口，2026-10-24 页面生成。代码块行号以当前工作区为准；P2 改名与 3.x 补丁已用 badge 标出。</p>\n  <p>本页是文档工件，不在 <code>app/web</code> 内，不触发前端构建/测试。Visual review 归 Lynx。</p>\n</footer>"
    }
  ]
}
