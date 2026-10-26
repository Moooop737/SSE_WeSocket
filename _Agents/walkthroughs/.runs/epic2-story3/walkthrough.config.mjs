export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic2-story3-citations.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 2 · Story 2.3 引用标记与映射 · 带代码逐行讲解",
  "tocTitle": "Story 2.3",
  "tocSub": "引用标记与命中映射 · 带代码逐行讲解",
  "accent": "#6b21a8",
  "accent2": "#581c87",
  "accentDark": "#d8b4fe",
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
      "global-map",
      "全局地图"
    ],
    [
      "glossary",
      "小白词典"
    ],
    [
      "request-journey",
      "请求旅行"
    ],
    [
      "file-map",
      "文件地图"
    ],
    [
      "code-and-annotations",
      "代码逐行"
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
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>STORY 2.3</span><span>·</span><span>引用标记与映射</span><span class=\"badge b-now\">done · 2026-10-21</span></div>\n  <h1>正文里的 <em>[n]</em>，凭什么点亮同一条流里的命中</h1>\n  <p class=\"hero-sub\">这条页面只讲一件事：回答里的 <code>[n]</code> 或 8 位 chunkId 前缀，如何从同一条 UI Message Stream 的 <code>tool-retrieve</code> part 里找到真实命中，并让正文、按钮、右栏三套编号始终说同一句话。不是另一套检索，也不是另一次请求。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>2.3</strong> 前端引用映射</span>\n    <span class=\"chip\"><strong>2.6</strong> tool-retrieve 地基</span>\n    <span class=\"chip\"><strong>2.4</strong> 抽屉 / 快照</span>\n    <span class=\"chip\"><strong>as-built</strong> 2026-10-20</span>\n  </div>\n  <div class=\"trace-pill\"><b>ONE STREAM</b> POST /api/chat → tool-retrieve part → referencesOf → [n] / panel</div>\n</header>\n\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">01 · 结论与边界</span>\n    <h2>先收口，再划边界</h2>\n    <p class=\"section-sub\">Story 2.3 的交付不是“又一个检索接口”，而是把回答里的标号接到本轮真实命中上。先记住这句话，后面的代码都围绕它。</p>\n  </header>\n\n  <div class=\"callout strong\"><strong>一句话结论：</strong>Story 2.3 把模型写在正文里的 <code>[n]</code> / 8 位 chunkId 前缀，映射到同一条流里 <code>tool-retrieve</code> part 的真实命中；越界或对不上的标号保持纯文本，右栏只列“回答真正引用到”的命中。</div>\n\n  <div class=\"summary-grid\">\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">01</span>\n      <h3>同一条流</h3>\n      <p>前端不再平行打 <code>POST /retrieve</code>。命中来自那条 assistant 消息的 tool part，回答与引用天然同源。</p>\n    </div>\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">02</span>\n      <h3>顺序对齐</h3>\n      <p><code>[n]</code> 是模型写的名次；界面按正文首次出现重排 1..N，按钮和右栏行号读同一份 <code>cited</code>。</p>\n    </div>\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">03</span>\n      <h3>不造按钮</h3>\n      <p>越界、对不上、本条没有命中：原样留文字。找不到 chunkId 不是异常，而是“这枚标号不可信”。</p>\n    </div>\n  </div>\n\n  <h3>边界：谁拥有什么</h3>\n  <div class=\"layer-map\">\n    <div class=\"layer layer-31\">\n      <span class=\"layer-tag\">2.3 · THIS STORY</span>\n      <h3>引用标记与映射</h3>\n      <p>解析 <code>[n]</code> / 8 位 id，按首次出现编号；把 tool part 的 output 翻成页面要的 <code>hits</code> / <code>allHits</code>；右栏列“被引用到的”命中。</p>\n      <code>chat-thread.tsx</code> <code>api/chat.ts</code> <code>citation-panel.tsx</code> <code>ask.tsx</code>\n    </div>\n    <div class=\"layer\">\n      <span class=\"layer-tag\">2.6 · FOUNDATION</span>\n      <h3>tool-retrieve 地基</h3>\n      <p>工具 schema、执行、输出投影，以及 <code>toUIMessageStream</code> 把 tool part 写进流。2026-10-20 as-built 后，原 <code>sources</code> data part 方案由 2.6 取代。</p>\n      <code>agent/tool/tools/retrieve.ts</code> <code>agent/chat/chat.ts</code>\n    </div>\n    <div class=\"layer\">\n      <span class=\"layer-tag\">2.4 / 2.5 · LATER</span>\n      <h3>抽屉与多轮</h3>\n      <p>2.4：点引用开抽屉、原文片段、来源标识、来源删除后的快照；2.5：历史回灌，以及“这一轮没检索、却引用前文”的 8 位 id 兜底。</p>\n      <code>Drawer</code> <code>priorHits</code> <code>FromHistory</code>\n    </div>\n  </div>\n\n  <div class=\"callout strong\"><strong>已作废的旧 AC：</strong>“来源删除后不可点击 / 返回 410”不成立。2026-10-21 Lynx 拍：<strong>快照仍可看，只在抽屉/引用处标注“来源已删除”，不禁止点击</strong>；落地在 2.4。另：<span class=\"badge b-33\">3.3</span> 的 trace 面板不属于本页，别把它混进 2.3 的交付。</div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 07</span>\n    <h2>一眼看懂：tool part 怎么变成 [n]</h2>\n    <p class=\"section-sub\">引用的唯一真相是同一条流里的工具输出。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>4</strong>种 tool 状态</span><span class=\"chip\"><strong>1..N</strong>条引用</span><span class=\"chip\"><strong>8</strong>位 chunkId</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic2-story3-citations.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 2.3 tool part 到 [n]\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:920 / 502;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic2-story3-citations.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>referencesOf 读 assistant 消息里的 tool-retrieve part；数字 [n] 只认最后一批。</li><li>8 位 chunkId 走 allHits，能指向同一轮更早一次重查的块。</li><li>越界索引渲染为纯文本；不请求不存在的 chunk。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画来源删除；2.4 处理快照与「来源已删除」。</div>\n</section>\n\n\n<section class=\"section\" id=\"global-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">02 · 全局地图</span>\n    <h2>一条流穿过四层</h2>\n    <p class=\"section-sub\">把“谁产生命中、谁传递命中、谁消费命中、谁渲染命中”分开看，后面读代码就不会把 2.3 和 2.6 混在一起。</p>\n  </header>\n\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>① 服务端：模型自己调工具</h3>\n      <ul class=\"flow-list\">\n        <li><span>POST /api/chat</span><code>routes/chat.ts</code></li>\n        <li><span>streamText({ tools })</span><code>agent/chat/chat.ts</code></li>\n        <li><span>execute → hits</span><code>agent/tool/tools/retrieve.ts</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>② 流：tool part 随回答下发</h3>\n      <ul class=\"flow-list\">\n        <li><span>type = tool-retrieve</span><code>UIMessage.parts</code></li>\n        <li><span>state 四态</span><code>input / output</code></li>\n        <li><span>output.hits</span><code>chunkId / 偏移 / 分数</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>③ 前端：把 part 翻成命中</h3>\n      <ul class=\"flow-list\">\n        <li><span>referencesOf</span><code>running / ready / failed</code></li>\n        <li><span>hits = 最后一次</span><code>allHits = 去重全集</code></li>\n        <li><span>messageHits</span><code>每条回答各一份</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>④ 渲染：三处同一身份</h3>\n      <ul class=\"flow-list\">\n        <li><span>正文 [n]</span><code>withCitations</code></li>\n        <li><span>右栏行号</span><code>citedHits</code></li>\n        <li><span>高亮 / 抽屉</span><code>chunkId</code></li>\n      </ul>\n    </div>\n  </div>\n\n  <p class=\"map-note\">关键取舍：命中只有一个真相 —— 同一条流里的工具调用。左栏回答、右栏引用、点击后的高亮/抽屉都从这一份 output 派生；不存在“另打一次 /retrieve 再对账”的第二套。</p>\n</section>\n\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">03 · 小白词典</span>\n    <h2>先认四个词，再读代码</h2>\n    <p class=\"section-sub\"><code>tool-retrieve</code> 的四种状态是这一页的入口；剩下三个词都围绕“命中身份”转。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead>\n      <tr><th>part.state</th><th>output / error</th><th>referencesOf 的说法</th><th>用户看到</th></tr>\n    </thead>\n    <tbody>\n      <tr><td><code>input-streaming</code> / <code>input-available</code></td><td>还没有 output</td><td><code>running</code></td><td>正在检索…（不是“没查到”）</td></tr>\n      <tr><td><code>output-available</code></td><td><code>error: null</code>，且 <code>hits</code> 是数组</td><td><code>ready</code></td><td>引用面板 / 命中行</td></tr>\n      <tr><td><code>output-available</code></td><td><code>error</code> 非空</td><td><code>failed</code></td><td>本次检索失败 · 后端文案</td></tr>\n      <tr><td><code>output-error</code></td><td>工具自己抛了错</td><td><code>failed</code></td><td>本次检索失败 · <code>errorText</code></td></tr>\n      <tr><td><code>output-available</code></td><td>形状不对（<code>hits</code> 不是数组）</td><td><code>failed</code></td><td>检索结果形状不符合契约</td></tr>\n    </tbody>\n  </table>\n\n  <dl class=\"glossary\">\n    <div class=\"gloss\"><dt>tool part</dt><dd>UIMessage 的 <code>parts</code> 里的一段，带 <code>type</code>、<code>state</code>、<code>output</code>。这里只关心 <code>tool-retrieve</code>。</dd></div>\n    <div class=\"gloss\"><dt>chunkId</dt><dd>数据库里 chunk 的 UUID。引用、去重、高亮都按它认人；数组下标会随重查换位置，不能当身份。</dd></div>\n    <div class=\"gloss\"><dt>[n]</dt><dd>1–2 位名次，读作“最后一次检索的第 n 条”。早期回答/兜底会出现；当前提示词更偏好 8 位 id。模型可能写错，界面不替它背书。</dd></div>\n    <div class=\"gloss\"><dt>8 位 id</dt><dd>模型实测会写 chunkId 前 8 位。先在本条 <code>allHits</code> 里找；本轮完全没检索时才往历史找。</dd></div>\n    <div class=\"gloss\"><dt>allHits</dt><dd>同一条 assistant 消息里所有成功 retrieve part 的命中，按 chunkId 去重；只给 8 位 id 解析用。</dd></div>\n    <div class=\"gloss\"><dt>cited</dt><dd>正文真正点到、且能解析的命中，按首次出现排序。右栏列的就是这一批，不是工具的整份输出。</dd></div>\n  </dl>\n</section>\n"
    },
    {
      "type": "journey",
      "id": "request-journey",
      "kicker": "WALK · 04",
      "title": "一次提问的旅行",
      "subtitle": "从 route 到按钮，点一步跳到真实代码。",
      "hint": "旅程只走一遍 happy path；失败、越界、多步重查在“取舍与坑”和“验证命令”里。",
      "steps": [
        {
          "goto": "server-chat-route:37-54",
          "title": "进入 /chat",
          "note": "route 只校验 body 与会话，然后交给 ChatService（2.6）",
          "code": "route L37–54"
        },
        {
          "goto": "server-chat-stream:72-84",
          "title": "streamText 带工具",
          "note": "模型拿到 retrieve 工具，自己决定调不调（2.6）",
          "code": "chat L72–84"
        },
        {
          "goto": "server-retrieve:21-41",
          "title": "模型调用 retrieve",
          "note": "检索发生在工具 execute 里，不是 route 里（2.6）",
          "code": "retrieve L21–41"
        },
        {
          "goto": "server-retrieve:43-62",
          "title": "命中投影",
          "note": "chunkId / 偏移 / 分数在这里成形",
          "code": "retrieve L43–62"
        },
        {
          "goto": "server-chat-stream:86-92",
          "title": "tool part 入流",
          "note": "toUIMessageStream 把工具结果写成 part（2.6）",
          "code": "chat L86–92"
        },
        {
          "goto": "web-chat-refs:98-119",
          "title": "referencesOf 翻状态",
          "note": "四态 → running / ready / failed（2.3）",
          "code": "refs L98–119"
        },
        {
          "goto": "web-chat-refs:121-133",
          "title": "合并多次重查",
          "note": "allHits 按 chunkId 去重（2.3）",
          "code": "refs L121–133"
        },
        {
          "goto": "web-thread-citations:177-205",
          "title": "解析标号",
          "note": "[n] 与 8 位 id；越界返回 null（2.3）",
          "code": "thread L177–205"
        },
        {
          "goto": "web-thread-citations:207-242",
          "title": "渲染按钮 / 留文字",
          "note": "认识的才变按钮，不造假按钮（2.3；点击归 2.4）",
          "code": "thread L207–242"
        },
        {
          "goto": "web-panel:35-49",
          "title": "右栏列 cited",
          "note": "行号 1..N，按 chunkId 高亮（2.3）",
          "code": "panel L35–49"
        },
        {
          "goto": "web-ask-click:342-350",
          "title": "点一下",
          "note": "在右栏里高亮（2.3）；不在右栏就开抽屉（2.4）",
          "code": "ask L342–350"
        }
      ]
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"file-map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">05 · 文件地图</span>\n    <h2>每个文件只负责一段</h2>\n    <p class=\"section-sub\">带徽章的行是前后故事的补丁；不带徽章的行才是 2.3 自己的形状。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead><tr><th>文件</th><th>这一页里它负责什么</th><th>归属</th></tr></thead>\n    <tbody>\n      <tr><td><code>app/server/src/agent/tool/tools/retrieve.ts</code></td><td>工具 schema、execute、<code>toHit</code> 完整投影</td><td><span class=\"badge b-now\">2.6</span></td></tr>\n      <tr><td><code>app/server/src/agent/chat/chat.ts</code></td><td><code>streamText({ tools })</code> + <code>toUIMessageStream</code>，tool part 的产地</td><td><span class=\"badge b-now\">2.6</span> <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/server/src/routes/chat.ts</code></td><td>薄路由：校验、查会话、交给 ChatService；不装配 Retriever</td><td><span class=\"badge b-now\">2.6</span> <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/web/src/api/chat.ts</code></td><td><code>referencesOf</code> / <code>collectHits</code>：把 tool part 翻成页面形状</td><td><span class=\"badge b-now\">2.3</span></td></tr>\n      <tr><td><code>app/web/src/api/client.ts</code></td><td><code>RetrievedHit</code> 前端手工副本；面板/抽屉/[n] 共用</td><td><span class=\"badge b-now\">2.3</span> <span class=\"badge b-now\">2.6</span></td></tr>\n      <tr><td><code>app/web/src/components/chat-thread/chat-thread.tsx</code></td><td>解析 <code>[n]</code> / 8 位 id、编号、按钮与越界留文字</td><td><span class=\"badge b-now\">2.3</span> <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/web/src/components/citation-panel/citation-panel.tsx</code></td><td>右栏列表：行号、标题、块号、三路分数、active 高亮</td><td><span class=\"badge b-now\">2.3</span> <span class=\"badge b-now\">2.4</span></td></tr>\n      <tr><td><code>app/web/src/routes/ask.tsx</code></td><td>页面装配：refs / cited / messageHits / 点击 / 抽屉</td><td><span class=\"badge b-now\">2.3</span> <span class=\"badge b-now\">2.4</span> <span class=\"badge b-now\">2.5</span></td></tr>\n      <tr><td><code>app/web/src/api/chat.test.ts</code>、<code>chat-thread.test.tsx</code></td><td>四态、越界、首次出现顺序、allHits、跨轮</td><td><span class=\"badge b-now\">2.3</span></td></tr>\n    </tbody>\n  </table>\n\n  <p class=\"map-note\">同文件里的 <span class=\"badge b-33\">3.3</span> trace 代码不在本页范围；不要因为 grep 到 trace 就以为 2.3 交付了观测面板。</p>\n</section>\n"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "06 · 代码逐行",
        "title": "代码与逐行讲解",
        "subtitle": "按“命中形状 → 解析 → 页面映射 → 面板 → 抽屉 → 服务端地基”读。",
        "body": "\n<div class=\"callout\"><strong>读法：</strong>每段代码都来自当前工作区；点右侧讲解会点亮对应行。徽章 <span class=\"badge b-now\">2.4</span> / <span class=\"badge b-now\">2.6</span> / <span class=\"badge b-now\">2.5</span> 是前后故事的补丁，不带徽章才是 2.3 自己的形状。<span class=\"badge b-33\">3.3</span> 只作为“不在此页”的提示出现。</div>\n<div class=\"callout strong\">当前 web 工作区有 Epic 3 的未提交改动；本页所选引用逻辑与 3542214 的 as-built 一致，<code>chat.ts</code> 只有 <code>Message.id</code> 重命名、<code>ask.tsx</code> 只有注释差异。行号以 2026-10-24 工作区为准。</div>\n<div class=\"callout\"><strong>提交线索：</strong>没有以 2.3 命名的提交。前端 b9ad65e（2026-10-16）先有 <code>[n]</code> 按钮雏形；3542214（2026-10-21）包含 2.3 的 as-built 与后续补丁。服务端 tool-retrieve 相关提交见 8c1a326、b143fc8。以 diff 为准，不以提交名为准。</div>\n",
        "blocks": [
          {
            "id": "web-client-hit",
            "file": "app/web/src/api/client.ts",
            "source": "web:src/api/client.ts",
            "lang": "ts",
            "ranges": [
              [
                263,
                286
              ]
            ],
            "title": "命中形状：前端只认这一份 RetrievedHit",
            "intro": "2.3 不另造引用类型；面板、抽屉、[n] 映射都读同一份命中。",
            "notes": [
              {
                "lines": "263-265",
                "title": "同一份清单",
                "badge": "2.6",
                "body": "<p>后端工具输出与 <code>/retrieve</code> 响应共用这份投影；前端这里是手工副本，没有类型通路。改字段要两边一起改，否则面板半边空。</p>"
              },
              {
                "lines": "266-269",
                "title": "chunkId 是身份",
                "body": "<p><code>chunkId</code> 是引用、去重、高亮的唯一身份；<code>chunkIndex</code> 只是块号展示。用数组下标当身份，重查后会点错行。</p>"
              },
              {
                "lines": "270-274",
                "title": "给 2.4 抽屉的字段",
                "badge": "2.4",
                "body": "<p><code>startOffset</code> / <code>endOffset</code> 给抽屉显示偏移，<code>source</code> 给来源链接，<code>dataUri</code> 留作来源标识。2.3 只负责把它们随命中带过来。</p>"
              },
              {
                "lines": "275-280",
                "title": "分数与预览",
                "body": "<p><code>score</code> 是 RRF 合成分，不是相关性百分比；<code>similarity</code> / <code>lexicalScore</code> 可为 null，面板显示成“—”。<code>content</code> 给右栏两行预览。</p>"
              },
              {
                "lines": "282-286",
                "title": "计数只服务 /recall",
                "badge": "前置",
                "body": "<p><code>RetrieveResult</code> 是独立检索接口的形状；<code>/ask</code> 不读它。别把 <code>vectorCount</code> / <code>lexicalCount</code> 混进引用编号。</p>"
              }
            ]
          },
          {
            "id": "web-chat-refs",
            "file": "app/web/src/api/chat.ts",
            "source": "web:src/api/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                23,
                26
              ],
              [
                71,
                133
              ]
            ],
            "title": "referencesOf：把 tool part 翻成页面要的命中",
            "intro": "这一段是 2.3 的入口：同一条流里的工具调用，被读成 running / ready / failed 与两份命中。",
            "notes": [
              {
                "lines": "23-26",
                "title": "工具键名就是 part 名",
                "badge": "2.6",
                "body": "<p><code>RETRIEVE_TOOL</code> 必须与后端 registry 的键名一致；SDK 用键名生成 <code>tool-retrieve</code>。2026-10-20 后端把 retrive 改成 retrieve，前端没跟上，面板整整一轮显示“未检索”。</p>"
              },
              {
                "lines": "71-81",
                "title": "三种状态，两份命中",
                "body": "<p><code>state</code> 只给空态/失败提示用；<code>hits</code> 是最后一次 retrieve 的结果，数字名次按它算；<code>allHits</code> 是本条消息所有成功 part 的并集，给 8 位 id 用。</p>"
              },
              {
                "lines": "83-96",
                "title": "按流契约读，不按泛型断言",
                "body": "<p>UIMessage 没带工具表，所以这里只读 <code>type</code> / <code>state</code> / <code>output</code> / <code>errorText</code> 的公共形状；<code>ToolOutput</code> 是工具输出的契约。</p>"
              },
              {
                "lines": "98-119",
                "title": "只看最后一条 assistant 的最后一次工具调用",
                "body": "<p><code>Parts.at(-1)</code> 决定面板显示哪一批：多步（<code>stepCountIs(5)</code>，最多 4 次有界重查）时显示最新战果。<code>input-streaming</code> / <code>input-available</code> → running；<code>output-error</code> 或结构化 error / 坏形状 → failed；否则 ready。</p><p>形状校验放在这道边界：面板拿到的必须是数组，否则 <code>CitationPanel.map</code> 会把整页抛掉。</p><p>提交落在 web build 5 <code>3542214</code>；这是 2.3 的消费侧实现。</p>"
              },
              {
                "lines": "121-133",
                "title": "collectHits：多次重查合并",
                "body": "<p>同一轮可能重查 1–4 次，引用可以落在任何一次。按 <code>chunkId</code> 去重，重复召回留最后一次的分数/名次；Map 插入顺序仍是首次出现，所以右栏顺序不被重查打乱。</p><p>提交落在 web build 5 <code>3542214</code>；这是 2.3 的消费侧实现。</p>"
              }
            ]
          },
          {
            "id": "web-thread-citations",
            "file": "app/web/src/components/chat-thread/chat-thread.tsx",
            "source": "web:src/components/chat-thread/chat-thread.tsx",
            "lang": "ts",
            "ranges": [
              [
                177,
                242
              ]
            ],
            "title": "ChatThread：两种标号、首次出现编号、越界留文字",
            "intro": "渲染层不认识会话、不查接口；它只把能解析的标号变成按钮，其余原样交还。",
            "notes": [
              {
                "lines": "177-194",
                "title": "MARKER 与 hitFor：两种写法，越界返回 null",
                "body": "<p>1–2 位数字按“最后一次 hits 的下标”解析；6–8 位十六进制按 chunkId 前缀解析。<code>Hits[Index] ?? null</code> 让越界变成 null，调用方原样输出文字 —— 这就是“前端不因找不到 chunkId 报错”的主路径。</p><p>当前后端提示词要求模型写 8 位 id、不自己编号；<code>[n]</code> 仍作为早期回答/兜底写法保留。注意：8 位即使全是数字也按 id 解析，不当下标；对不上 <code>AllHits</code> 时，只有本轮完全没检索才往历史找（2.5 补丁）。</p>"
              },
              {
                "lines": "196-205",
                "title": "citedHits：首次出现顺序",
                "body": "<p>编号 1..N 的依据是正文里第一次出现的先后，不是召回名次。否则正文会出现 2、3、6、8 的跳号。右栏列的就是这一批，重复引用只算一次。</p>"
              },
              {
                "lines": "207-224",
                "title": "withCitations：认识的才变按钮",
                "body": "<p>按标号切行；<code>hitFor</code> 返回 null 就原样返回那串字符，不硬造一颗点了没反应的按钮。按钮显示的号是 <code>cited</code> 里的位置，不是模型写的原号。</p>"
              },
              {
                "lines": "225-228",
                "title": "跨轮引用的来历",
                "badge": "2.5",
                "body": "<p>不在本轮 <code>AllHits</code> 里的命中来自更早几轮，按钮标题/可及名标“前文检索”，避免读屏用户以为它在右栏第 N 行。</p>"
              },
              {
                "lines": "229-242",
                "title": "按钮只交命中，抽屉归 2.4",
                "badge": "2.4",
                "body": "<p><code>onClick</code> 只把 <code>hit</code> 交给页面；开抽屉、查来源是否删除是 <code>ask.tsx</code> 的 2.4 逻辑。2.3 负责按钮长什么样、编号是多少。</p>"
              }
            ]
          },
          {
            "id": "web-ask-mapping",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                144,
                200
              ]
            ],
            "title": "AskPage：页面怎么把命中分给正文与右栏",
            "intro": "这里不重新检索；只把最后一条回答的 refs、每条消息的命中、跨轮历史拼成渲染层要的 props。",
            "notes": [
              {
                "lines": "144-150",
                "title": "只读最后一条 assistant",
                "body": "<p><code>latest</code> 决定右栏显示哪一轮；<code>refs.hits</code> 是面板/数字名次，<code>refs.allHits</code> 是 8 位 id 的解析范围。模型还没调工具时 <code>refs</code> 为 null，不是“查不到”。</p>"
              },
              {
                "lines": "151-153",
                "title": "右栏只列被引用到的",
                "body": "<p>工具可能召回 10 条，回答只引用 3 条；右栏列 <code>citedHits</code> 的结果，不是整份 <code>hits</code>。这样“回答里的标号”和“右栏行号”才是同一批东西。</p>"
              },
              {
                "lines": "154-165",
                "title": "跨轮 id 兜底",
                "badge": "2.5",
                "body": "<p>只往前收历史回答的 <code>allHits</code>：2026-10-21 真实会话里，模型没调工具却引用了上一轮检索到的块。数字名次仍只认本条 <code>Hits</code>，跨轮下标没有意义。</p>"
              },
              {
                "lines": "166-177",
                "title": "空态判据来自 refs.state",
                "body": "<p>running / failed / skipped / 有命中但没引用 / 还没问，各自一句文案。把“正在查”说成“还没查”、把“没引用”说成“库是空的”，都会把用户推去做错的那一步。</p>"
              },
              {
                "lines": "183-200",
                "title": "每条回答各带一份 hits / allHits",
                "body": "<p><code>messageHits</code> 给正文数字名次；<code>messageAllHits</code> 给 8 位 id。没有这层按消息分桶，第二问之后第一答的 [2] 会跟着面板换到新一轮第 2 条。</p>"
              }
            ]
          },
          {
            "id": "web-ask-click",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                340,
                351
              ]
            ],
            "title": "点击：高亮是 2.3，抽屉是 2.4",
            "intro": "同一颗按钮，两个去向；这一小段正好把故事边界切开。",
            "notes": [
              {
                "lines": "340-346",
                "title": "不在右栏：开抽屉",
                "badge": "2.4",
                "body": "<p>命中属于更早一轮、不在当前 <code>cited</code> 里时，直接打开那块原文的抽屉。面板只列最后一轮，所以不给“点了什么都没发生”的按钮。</p>"
              },
              {
                "lines": "347-350",
                "title": "在右栏：按 chunkId 高亮",
                "body": "<p><code>activeChunkId</code> 用身份比对，面板据此加底色与左侧竖条；随后滚动到 Anchor。滚动行为尊重减动效档位。</p>"
              }
            ]
          },
          {
            "id": "web-panel",
            "file": "app/web/src/components/citation-panel/citation-panel.tsx",
            "source": "web:src/components/citation-panel/citation-panel.tsx",
            "lang": "ts",
            "ranges": [
              [
                21,
                76
              ]
            ],
            "title": "CitationPanel：右栏的行号、内容与 active",
            "intro": "同一个组件也被 /recall 用；/ask 传“回答引用到的那几条”，/recall 传整份命中。",
            "notes": [
              {
                "lines": "21-33",
                "title": "锚点与分数格式只有一处",
                "body": "<p><code>hitAnchorId</code> 统一拼 <code>hit-${chunkId}</code> 的前缀，页面若自己重拼一份，改前缀就会静默断掉 [n] 定位。<code>scoreLine</code> 决定抽屉与面板用同一套精度。</p>"
              },
              {
                "lines": "35-49",
                "title": "行号 1..N，active 按身份",
                "body": "<p>行首号是这一份列表里的序号，不是召回名次；<code>ActiveChunkId === hit.chunkId</code> 才高亮。点整行触发 <code>onOpen</code>，开抽屉归 2.4。</p>"
              },
              {
                "lines": "50-58",
                "title": "颜色之外的线索",
                "body": "<p>active 行除了底色，再加左侧 0.5 宽竖条 —— accent-soft 与 hover 的 fill 太接近，只靠颜色不够；读屏也拿不到“这是第 2 条的来源”。</p>"
              },
              {
                "lines": "59-70",
                "title": "先内容，再分数",
                "body": "<p>标题下先给两行原文预览，再给块号与 RRF/cos/bm25。判断“这块是不是答案来源”时原文先到；分数是排序旁证。null 显示成“—”，不是 0 分。</p>"
              }
            ]
          },
          {
            "id": "web-ask-drawer",
            "file": "app/web/src/routes/ask.tsx",
            "source": "web:src/routes/ask.tsx",
            "lang": "ts",
            "ranges": [
              [
                227,
                243
              ],
              [
                549,
                576
              ]
            ],
            "title": "2.4 的抽屉：来源删除后仍看快照",
            "intro": "这不是 2.3 的交付，只作为点击去向与“旧 AC 已作废”的证据放在这里。",
            "notes": [
              {
                "lines": "227-243",
                "title": "打开时查来源是否还在",
                "badge": "2.4",
                "body": "<p>按 <code>resourceId</code> 查 <code>GET /resources/:id</code>；只有 404 才标“已删除”。500 或网络失败不冒充确定结论 —— 未知状态不是已删除。</p>"
              },
              {
                "lines": "549-560",
                "title": "快照标签",
                "badge": "2.4",
                "body": "<p>抽屉标题/块号/偏移来自命中快照；<code>goneHitId</code> 命中当前 resource 时显示“来源已删除 · 以下为回答时的快照”。不禁止点击，也不返回 410。</p>"
              },
              {
                "lines": "562-573",
                "title": "内容照常渲染",
                "badge": "2.4",
                "body": "<p>来源链接、分数、<code>openHit.content</code> 都来自消息里的快照；不请求已删 Chunk。内容长时由抽屉那层滚动，不再套第二层内滚。</p>"
              }
            ]
          },
          {
            "id": "server-retrieve",
            "file": "app/server/src/agent/tool/tools/retrieve.ts",
            "source": "src/agent/tool/tools/retrieve.ts",
            "lang": "ts",
            "ranges": [
              [
                21,
                62
              ]
            ],
            "title": "服务端地基：工具输出长什么样",
            "intro": "2.6 的交付。2.3 只消费这份 output，不拥有检索。",
            "notes": [
              {
                "lines": "21-41",
                "title": "schema 与 execute",
                "body": "<p>模型自己给 <code>prompt</code> 与 <code>topK</code>；<code>execute</code> 调 <code>Retriever.search</code>。结构化 <code>RetrieverError</code> 被 catch 成 <code>error</code> 字段，别让工具抛给 SDK 后丢掉中文原因。</p>"
              },
              {
                "lines": "43-45",
                "title": "toOutput",
                "badge": "2.6",
                "body": "<p>输出固定四键：<code>hits</code> / <code>vectorCount</code> / <code>lexicalCount</code> / <code>error</code>。前端 <code>referencesOf</code> 就按这份契约做形状校验。</p>"
              },
              {
                "lines": "47-62",
                "title": "toHit：完整投影",
                "badge": "2.6",
                "body": "<p><code>chunkId</code> 与 <code>resourceId</code> 留着回链；块号/偏移/三路分数都带出来。每条几十字节，比 <code>content</code> 小一个数量级 —— 一份形状胜过两处各表。</p>"
              }
            ]
          },
          {
            "id": "server-chat-stream",
            "file": "app/server/src/agent/chat/chat.ts",
            "source": "src/agent/chat/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                69,
                92
              ]
            ],
            "title": "服务端地基：tool part 是怎么进流的",
            "intro": "不是 route 手写 SSE，也不是前端拼 part；SDK 因为拿到了 tools，才在 UI stream 里写 tool-retrieve。",
            "notes": [
              {
                "lines": "72-84",
                "title": "streamText 带 tools",
                "badge": "2.6",
                "body": "<p><code>tools</code> 与 <code>stopWhen: stepCountIs(5)</code> 让模型最多做 4 次有界重查；工具结果留在同一条回答的 parts 里，不会另开 HTTP 请求。</p>"
              },
              {
                "lines": "86-92",
                "title": "toUIMessageStream 写 part",
                "badge": "2.6",
                "body": "<p><code>tools: this.tools</code> 传给 <code>toUIMessageStream</code> 后，SDK 才会把工具调用/结果序列化成 <code>tool-input-*</code> / <code>tool-output-*</code>。前端收到的是 UIMessage parts，不是手搓 JSON。</p>"
              }
            ]
          },
          {
            "id": "server-chat-route",
            "file": "app/server/src/routes/chat.ts",
            "source": "src/routes/chat.ts",
            "lang": "ts",
            "ranges": [
              [
                37,
                58
              ]
            ],
            "title": "服务端地基：route 为什么这么薄",
            "intro": "看懂这一段，就不会再问“为什么前端不另打 /retrieve”。",
            "notes": [
              {
                "lines": "37-48",
                "title": "只校验 body",
                "badge": "2.6",
                "body": "<p>缺 <code>query</code> / <code>sessionId</code>、空提问、非 UUID 都在进流前 400；流一旦开始，状态码就固定了，所以检索错误只能放进工具 output。</p>"
              },
              {
                "lines": "50-58",
                "title": "确认会话后交给 ChatService",
                "badge": "2.5",
                "body": "<p>会话不存在/已软删 → 404；其余交给 <code>ChatService.ask</code>，由它读历史、建消息、开流。路由不装配 Retriever，所以它不可能平行返回一批命中。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">07 · 取舍与坑</span>\n    <h2>为什么是这副形状</h2>\n    <p class=\"section-sub\">这一节记录“当时否掉了什么”和“以后改哪里会静默坏掉”。</p>\n  </header>\n\n  <div class=\"choice-grid\">\n    <div class=\"choice\"><span class=\"choice-no\">D1</span><h3>唯一真相 = 同一条流</h3><p>2026-10-20 之前 /ask 平行打一次 <code>/retrieve</code>，两批命中并排放着却不互相担保。现在回答与命中来自同一次工具调用；<code>/recall</code> 仍打 <code>/retrieve</code>，因为它是“只检索不生成”的调试台。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">D2</span><h3>[n] 是模型写的，不是界面的声明</h3><p>界面只做“顺序对齐”：第 n 个标号对应最后一次 hits 的第 n 条。对不上就留文字，不替模型编来源，也不给假按钮。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">D3</span><h3>1..N 按首次出现，不按召回名次</h3><p>Lynx 2026-10-20 定：正文出现 2、3、6、8 的跳号很难读。右栏、按钮、正文统一读 <code>citedHits</code> 的首次出现顺序。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">D4</span><h3>多步：面板最后一次，解析用全集</h3><p><code>hits</code> 给面板和数字名次；<code>allHits</code> 给 8 位 chunkId。数字名次跨 part 没有意义，跨轮也没有意义；8 位 id 全局唯一，才能跨。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">D5</span><h3>来源删除：快照可看 + 标注</h3><p>2026-10-21 Lynx 拍板，原 AC 的“不可点击 / 410”作废。抽屉按 <code>resourceId</code> 查一次，404 才标“来源已删除”；内容仍来自回答时的快照。</p></div>\n    <div class=\"choice\"><span class=\"choice-no\">D6</span><h3>越界不是异常，是“不可信标号”</h3><p><code>hitFor</code> 返回 null，<code>withCitations</code> 原样输出，<code>citedHits</code> 不收录。整页不因模型写了一个 <code>[99]</code> 落错误边界。</p></div>\n  </div>\n\n  <div class=\"callout strong\"><strong>旧 AC 不要写反：</strong>“来源删除后不可点击 / 410”已经作废。现在的口径是<strong>快照仍可看</strong>，只在抽屉/引用处标注“来源已删除”；这条落地在 2.4，不是 2.3 的按钮逻辑。</div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>坑 1 · 工具键名。</strong>后端 registry 的键名就是 part 名。2026-10-20 从 <code>retrive</code> 改成 <code>retrieve</code>，前端没跟，面板显示“未检索”但模型其实查了 10 条。改键名要连 <code>RETRIEVE_TOOL</code> 一起改。</li>\n    <li><strong>坑 2 · 缺 chunkId 的畸形 hit。</strong><code>hitFor</code> 的 <code>byId</code> 仍直接读 <code>H.chunkId.toLowerCase()</code>；旧载荷/字段漂移让某条 hit 缺字段时，仍可能抛。这与“越界索引”不是同一件事，已记在 deferred-work（2026-10-21），本轮没有修。</li>\n    <li><strong>坑 3 · 数字名次只属于本条。</strong>同一个 <code>[1]</code> 在上一轮指的是另一条命中；往历史里解就是串台。跨轮只服务 8 位 id。</li>\n    <li><strong>坑 4 · 8 位全是数字。</strong><code>[12345678]</code> 仍按 chunkId 前缀解析，不能因为“看起来像数字”就当名次查下标。</li>\n    <li><strong>坑 5 · 只取最后一条 tool part。</strong>面板显示最新战果；更早一次重查的命中只能通过 8 位 id 被正文引用，数字名次对不上是预期行为，不是 bug。</li>\n    <li><strong>坑 6 · 来源删除只认 404。</strong>500/网络失败时 <code>goneHitId</code> 保持 null，不把“未知”说成“已删除”；快照仍渲染。</li>\n    <li><strong>坑 7 · 链接清洗不能吃掉标号。</strong><code>plain()</code> 把 <code>[3](地址)</code> 的 URL 去掉、标号留下；否则点 [n] 定位就断了。</li>\n  </ul>\n</section>\n\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">08 · 验证命令</span>\n    <h2>怎么自己验一遍</h2>\n    <p class=\"section-sub\">命令可复制。每条都标了“历史真跑”还是“本轮未重跑”；本页本轮只做了静态构建/校验。</p>\n  </header>\n\n  <div class=\"test-grid\">\n    <div class=\"test-card\">\n      <h3>① 真流：看 tool part 与 output</h3>\n      <p><span class=\"badge b-now\">历史真跑 2026-10-20</span> 需要后端、真库、Ollama 与 chat 模型都在。</p>\n      <pre class=\"snippet\">curl -N -sS -X POST http://127.0.0.1:3000/chat \\\n  -H 'content-type: application/json' \\\n  -d '{\"query\":\"HNSW 的 ef_construction 是什么？\",\"sessionId\":\"&lt;uuid&gt;\"}' \\\n  | grep -E '\"type\":\"tool-(input|output)'</pre>\n      <p class=\"test-note\">预期：能看到 <code>tool-input-available</code> 与 <code>tool-output-available</code>，<code>toolName</code> 为 <code>retrieve</code>，output 含 <code>error/hits/lexicalCount/vectorCount</code>。本轮未重跑。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>② 前端单测：四态 / 越界 / 顺序</h3>\n      <p><span class=\"badge b-now\">历史真跑</span> 2026-10-20 全量 21 文件 / 261 条；2026-10-21 全量 33 文件 / 348 条。</p>\n      <pre class=\"snippet\">cd app/web\nnpx vitest run src/api/chat.test.ts \\\n  src/components/chat-thread/chat-thread.test.tsx</pre>\n      <p class=\"test-note\">重点看：<code>referencesOf</code> 四态、<code>[9]</code> 越界留文字、<code>[cccccccc]</code> 首次出现顺序、<code>allHits</code> 合并、8 位全数字 id。本轮未重跑。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>③ 类型检查</h3>\n      <p><span class=\"badge b-now\">历史真跑</span> 2026-10-20 web 与 server 的 <code>src/</code> 均无输出；2026-10-21 复核仍为 0 错。</p>\n      <pre class=\"snippet\">cd app/web &amp;&amp; npx tsc --noEmit\ncd app/server &amp;&amp; npx tsc --noEmit</pre>\n      <p class=\"test-note\">测试文件有既有债时，先看是否只在 <code>src/</code> 之外报错。本轮未重跑。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>④ 浏览器手测（Lynx）</h3>\n      <p><span class=\"badge b-now\">历史真跑 2026-10-20 / 21</span> 浏览器里的视觉与交互归 Lynx，不由 agent 代测。</p>\n      <ol>\n        <li>问一句有依据的问题：正文出现 <code>[n]</code> 或 8 位 id 按钮，右栏出现对应行；网络面板只有 <code>/api/chat</code>，没有 <code>/api/retrieve</code>。</li>\n        <li>点正文标号：右栏对应行高亮并滚到视野；点右栏整行：抽屉打开（2.4）。</li>\n        <li>模型写越界号（如 <code>[99]</code>）：保持纯文本，不出现按钮，页面不崩。</li>\n        <li>多步重查：正文 8 位 id 指向更早一次命中仍可点；数字名次只认最后一次。</li>\n        <li>删一条被引用的来源，回看历史回答并打开抽屉：应显示“来源已删除 · 以下为回答时的快照”，内容仍可读。</li>\n      </ol>\n      <p class=\"test-note\">第 5 条是 2026-10-21 实现、Lynx 手测待补的项目；本轮未开浏览器。</p>\n    </div>\n  </div>\n\n  <div class=\"callout\"><strong>本轮实际只跑了：</strong>静态构建 <code>node .qoder/skills/story-walkthrough/scripts/build.mjs ...</code> 与 <code>validate.mjs</code>；没有启动前后端、没有跑 vitest/tsc、没有开浏览器。上面的“历史真跑”来自 2026-10-20 / 2026-10-21 的会话记录，不是本轮复现。</div>\n</section>\n\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">09 · 前后衔接</span>\n    <h2>这一格把接力棒交给谁</h2>\n    <p class=\"section-sub\">2.3 只把标号接到真实命中；点击后的世界、多轮历史、检索工具本身，都各有主人。</p>\n  </header>\n\n  <div class=\"next-box\">\n    <p><strong>一句话：</strong>2.3 负责“回答里的标号可信”；2.4 负责“点开看到什么”；2.6 负责“命中从哪里来”。改任何一边，都要回来看另外两边的契约。</p>\n    <div class=\"next-links\">\n      <a href=\"#conclusion-and-boundary\">回边界</a>\n      <a href=\"#code-and-annotations\">回代码</a>\n      <a href=\"#verification-commands\">回验证</a>\n    </div>\n  </div>\n\n  <div class=\"test-grid\">\n    <div class=\"test-card\">\n      <h3>上一格：2.2 流式与 useChat</h3>\n      <p>2.2 把回答变成逐字流，并预留 data part handler。as-built 2026-10-20 后，命中不再走 <code>sources</code> data part，而是走 2.6 的 <code>tool-retrieve</code> output；原方案被取代，但“同一条流”这个方向没变。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>地基：2.6 tool-retrieve</h3>\n      <p>模型自己决定调不调、用什么词、要几条；<code>stepCountIs(5)</code> 允许最多 4 次有界重查。2.3 的数字名次读最后一次，8 位 id 读全部；这就是 <code>hits</code> 与 <code>allHits</code> 的分工。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>下一格：2.4 原文回链</h3>\n      <p>点引用开抽屉、显示原文片段 + 来源标识；来源删除后快照仍可看并标注。2026-10-21 Lynx 拍板，原 AC 的“不可点击 / 410”作废。</p>\n    </div>\n    <div class=\"test-card\">\n      <h3>并行补丁：2.5 多轮</h3>\n      <p>历史只回灌 text parts；模型可能从上一轮正文学到 chunkId，在本轮没检索时继续引用。8 位 id 因此允许往更早几轮找；数字名次仍只认本条。</p>\n    </div>\n  </div>\n\n  <div class=\"callout\"><span class=\"badge b-33\">3.3</span> 的 trace 面板、Langfuse 节点、stage 时间线是观测支线，不属于本页；如果以后改动这些文件，行号漂移必须在同一次改动里重生成/校对本页。</div>\n</section>\n\n<footer class=\"footer\">\n  Story 2.3 引用标记与映射 · 生成于 2026-10-24 · 代码来自当前工作区（app/web、app/server）· 本页是文档工件，不参与 app 构建与测试。\n</footer>\n"
    }
  ]
}
