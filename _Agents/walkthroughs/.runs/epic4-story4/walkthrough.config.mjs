export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic4-story4-chat-markdown.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 4 · Story 4.4 聊天 Markdown 渲染器 · 引用、整段流式、Mermaid · 带代码逐行讲解',
  tocTitle: 'Story 4.4',
  tocSub: '聊天 Markdown 渲染器 · 带代码逐行讲解',
  accent: '#0f766e',
  accent2: '#b45309',
  accentDark: '#5eead4',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 4 · STORY 4.4</span><span>MARKDOWN · CITATIONS · MERMAID</span></div>
  <h1>回答正文，<em>交给真渲染器</em></h1>
  <p class="hero-sub">旧的 plain() 把标记啃掉、把表格压成一行；4.4 换成 react-markdown + remark-gfm，把引用标号、流式光标、代码块与 Mermaid 图逐条接回来。三条验收线都靠实测钉住：代码里的 [n] 不算引用、半截表格直接成表、mermaid 的 strict 单独挡不住远程图片。</p>
  <div class="meta-row">
    <span class="chip"><strong>前端</strong>85 文件 / 723</span>
    <span class="chip"><strong>真跑</strong>真流探针 · 真 mermaid</span>
    <span class="chip"><strong>状态</strong>done · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>vitest 85/723</b> · <b>build green</b> · <b>0.44ms/帧</b> · <b>炸弹图 0 残留</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格只换“回答怎么长”，不换“回答怎么来”</h2>
    <p class="section-sub">链路、检索、会话都不动：只把 assistant 的那段 text 从纯文本改成一棵 Markdown 树，并把引用、光标、图这三样接回去。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / OWNS</div>
      <h3>本格拥有的</h3>
      <p><code>markdown-answer.tsx</code>（渲染入口、组件表、标号插件、光标）、<code>citations.ts</code>（Markdown 感知的引用解析）、<code>mermaid-guard.ts</code> 与 <code>mermaid-diagram.tsx</code>（图 + 导出 JPEG）。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / NOT OWNS</div>
      <h3>不归本格的</h3>
      <p>表格的「下载 CSV」、<code>&#96;&#96;&#96;csv</code> 围栏成表、整条回答导出 .md —— 都是 <b>4.5</b>（页内带 4.5 徽章）。语法高亮、KaTeX、脚注仍在 Deferred；回答改成 JSON part 是 P4。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / SAFETY</div>
      <h3>安全默认</h3>
      <p>不解析 raw HTML；链接 <code>target=_blank rel=noopener noreferrer</code>；图片只渲染 alt、不发起请求；Mermaid 用 strict + htmlLabels:false，加源头与产物两道理。</p>
    </article>
  </div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>一段文字要经过四站才变成 DOM</h2>
    <p class="section-sub">每帧都是同一条路：解析 → 改写 → 转树 → 组件渲染。引用编号与渲染共用同一个解析器，所以不会出现“正文里是第 2 条、右栏里是第 3 条”。</p>
  </header>
  <ol class="callout">
    <li><b>remark 解析</b>：remark-parse + remark-gfm（表格、任务列表）+ remark-breaks（单换行即硬换行）。</li>
    <li><b>标号改写</b>：插件把正文 text 节点里的 <code>[n]</code> / <code>[8 位 id]</code> 换成 <code>[n](citation:n)</code> 链接；代码节点不遍历。</li>
    <li><b>mdast → hast → JSX</b>：react-markdown 用模块级 <code>COMPONENTS</code> 渲染 a / pre / table / img。</li>
    <li><b>引用解析</b>：<code>citedHits()</code> 再跑一次同一个解析器取标号顺序，右栏与气泡共用这一份编号。</li>
  </ol>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一次回答的旅行',
      subtitle: '点一步跳代码。',
      steps: [
        { goto: 'md-answer:76-99', title: '渲染入口', note: 'Cited + 插件 + Scope', code: 'md-answer L76–99' },
        { goto: 'citations:31-50', title: '标号提取', note: '只认正文 text 节点', code: 'citations L31–50' },
        { goto: 'md-answer:225-294', title: '标号改写', note: 'text → link + 光标', code: 'md-answer L225–294' },
        { goto: 'md-answer:104-136', title: '引用按钮', note: '对不上就留 [n] 原文', code: 'md-answer L104–136' },
        { goto: 'mermaid:51-74', title: '图渲染', note: 'strict + 产物复查', code: 'mermaid L51–74' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'md-answer',
        kicker: 'CORE · 03',
        title: 'markdown-answer.tsx：渲染入口与三个组件',
        subtitle: '回答正文的全部“长什么样”都在这里。',
        body: '<div class="callout">三段：入口与排版口径（59–102）、引用/光标/代码块的组件（104–156）、标号插件与光标追加（218–294）。中间的 CSV/表格组件是 4.5 的，见下一页。</div>',
        blocks: [
          {
            id: 'md-answer',
            file: 'app/web/src/components/chat-thread/markdown-answer.tsx',
            source: 'web:src/components/chat-thread/markdown-answer.tsx',
            lang: 'ts',
            ranges: [[59, 102], [104, 156], [218, 294]],
            notes: [
              { lines: '59-74', title: '排版口径一次写全', body: '<p>行内码、围栏、列表、标题、引用、表格的样式都收在 <code>PROSE</code> 一个常量里；散到各组件里就会有人只改一处。表格的宽度规则（w-max / min-w-full / max-w-sm）是 4.5 补的。</p>' },
              { lines: '76-99', title: '入口：先算引用，再渲树', body: '<p><code>citedHits()</code> 决定 1..N 的编号；<code>Plugins</code> 只在“流没流”翻转时换一次，避免每帧重建 unified 处理器。命中/编号/Streaming/onCite 走 <code>Scope</code> 传下去。</p>' },
              { lines: '101-102', title: '组件表必须是模块级', body: '<p>内联箭头函数每帧都是“新组件类型”，React 会把引用按钮与光标整棵卸载重挂——实测每 100ms 换一个节点，光标动画一直从头播，整块看起来在闪。提到模块级 + context 后按钮身份 17/17 稳定。</p>' },
              { lines: '104-136', title: '光标与引用按钮', body: '<p><code>caret:</code> 协议画光标；<code>citation:</code> 解析成命中，对不上就原样输出 <code>[n]</code>（连方括号），不硬造一颗点了没反应的按钮。跨轮引用会写进 aria-label。</p>' },
              { lines: '138-155', title: '图片只留 alt；围栏看语言', body: '<p>图片不加载。围栏在流式期间一律是代码块；流结束后按语言分流：mermaid 交给图渲染器（4.5 的 csv 分支与表格见下一页）。</p>' },
              { lines: '218-222', title: '只放行两种自己的协议', body: '<p>react-markdown 默认只放行 http(s)/irc(s)/mailto/xmpp；<code>citation:</code> 与 <code>caret:</code> 在这里放行，其余仍走默认消毒。</p>' },
              { lines: '225-294', title: '标号 → 链接，光标 → 末尾', body: '<p>只改 text 节点（代码与已有链接跳过）；纯数字文字的链接沿用旧口径变引用。光标追进最后一个能放行内元素的块，代码块/表格收尾时另起一段。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'citations',
        kicker: 'CORE · 04',
        title: 'citations.ts：引用标号的唯一判据',
        subtitle: '右栏与气泡都读这一份。',
        body: '<div class="callout">解析用 remark（与渲染同一条语法），所以 GFM 表格单元格里的标号也认得出；代码块与行内码天然被排除。</div>',
        blocks: [
          {
            id: 'citations',
            file: 'app/web/src/components/chat-thread/citations.ts',
            source: 'web:src/components/chat-thread/citations.ts',
            lang: 'ts',
            ranges: [[1, 79]],
            notes: [
              { lines: '31-50', title: '只认正文的 text 节点', body: '<p><code>code</code> / <code>inlineCode</code> / <code>html</code> 整段跳过；链接只认“纯数字文字”那一种（旧口径），其余链接里的方括号不动。</p>' },
              { lines: '56-70', title: '命中规则没变', body: '<p>1–2 位是名次，只认本条命中；6–8 位是 chunkId 前缀，先认本条、本轮没检索过才往历史里兜。对不上就不认。</p>' },
              { lines: '72-79', title: '按首次出现去重编号', body: '<p>引用编号跟正文顺序走，不跟召回名次走；右栏列的就是这一批。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'mermaid',
        kicker: 'CORE · 05',
        title: 'Mermaid：三道闸 + 炸弹清理 + JPEG',
        subtitle: 'strict 单独不够，这是实测出来的。',
        body: '<div class="callout">实测：只设 securityLevel: strict 时，label 里的远程图片会被保留并真的发请求；%%{init}%% 与 frontmatter 都能把 htmlLabels 改回去。所以再加源头拒收与产物复查。</div>',
        blocks: [
          {
            id: 'guard',
            file: 'app/web/src/components/chat-thread/mermaid-guard.ts',
            source: 'web:src/components/chat-thread/mermaid-guard.ts',
            lang: 'ts',
            ranges: [[1, 37]],
            notes: [
              { lines: '19-31', title: '源头闸', body: '<p>init 指令、frontmatter、或出现 htmlLabels / securityLevel / themeCSS → 不渲染（CSS 的 url() 也能发请求）。</p>' },
              { lines: '34-37', title: '产物闸', body: '<p>foreignObject / img / image / 事件属性 / javascript: / 远程 url() 一律回退；合法的 marker 引用 url(#id) 不能误伤。</p>' },
            ],
          },
          {
            id: 'mermaid',
            file: 'app/web/src/components/chat-thread/mermaid-diagram.tsx',
            source: 'web:src/components/chat-thread/mermaid-diagram.tsx',
            lang: 'ts',
            ranges: [[1, 131]],
            notes: [
              { lines: '24-26', title: '临时节点清理', body: '<p>mermaid.render 会在 body 上留 <code>d&lt;id&gt;</code>；失败路径必须收掉，否则那张「Syntax error」炸弹图会永远挂在页面上（实测过）。</p>' },
              { lines: '51-59', title: '初始化口径', body: '<p>strict + htmlLabels:false（flowchart 与 class 两处）；<code>suppressErrorRendering:true</code> 让它失败时先清临时节点再抛错；主题跟站点浅深档。</p>' },
              { lines: '61-74', title: '渲染后复查 + 回退', body: '<p>产物过 <code>svgUnsafeReason</code> 才注入；解析失败/产物可疑都保留代码块并说「无法渲染此图」。注入点的 innerHTML 只可能来自这里。</p>' },
              { lines: '80-108', title: '导出 JPEG（4.4 追加）', body: '<p>2 倍栅格、单边封顶 4096、先铺 --color-canvas 底色再画（JPEG 没透明通道）、quality 0.92；文件名取会话标题，失败走常驻 status 槽。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'thread',
        kicker: 'WIRING · 06',
        title: 'chat-thread.tsx：一处接线',
        subtitle: '回答正文换成 MarkdownAnswer；用户消息与 reasoning 仍纯文本。',
        body: '<div class="callout">右上角的「导出 .md」是 4.5 的（徽章 4.5），放在这里只因为它属于“回答”这一行的动作。</div>',
        blocks: [
          {
            id: 'thread',
            file: 'app/web/src/components/chat-thread/chat-thread.tsx',
            source: 'web:src/components/chat-thread/chat-thread.tsx',
            lang: 'ts',
            ranges: [[110, 156]],
            notes: [
              { lines: '118-133', title: '回答行 + 导出 .md（4.5）', body: '<p>流式期间不出现导出入口；文件名取会话标题。', badge: '4.5' },
              { lines: '154-154', title: '接线一行', body: '<p><code>MarkdownAnswer</code> 拿走 Text / 命中 / Streaming / Title / onCite；历史消息与流中消息走同一路径。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'html',
      html: `
<section class="section" id="decisions">
  <header class="section-head">
    <span class="kicker">07 · 取舍与踩坑</span>
    <h2>四个只在真数据上才会暴露的问题</h2>
  </header>
  <div class="summary-grid">
    <article class="summary-card"><div class="summary-no">A / STREAM</div><h3>整段每帧，不切块</h3><p>0.44ms/次（349 字符）。半截表格直接成表、半截围栏直接成 code；“已完成块 + 末块纯文本”会把三个反引号漏在屏幕上，弃用。</p></article>
    <article class="summary-card"><div class="summary-no">B / FLICKER</div><h3>组件身份即稳定性</h3><p>components 内联=每帧新类型 → 按钮/光标反复重挂。提到模块级 + context 后 DOM 增减速率降约 10 倍。</p></article>
    <article class="summary-card"><div class="summary-no">C / SECURITY</div><h3>strict 不是终点</h3><p>远程图片、init/frontmatter 绕过都实测命中。htmlLabels:false + 源头拒收 + 产物复查三道一起才成立。</p></article>
    <article class="summary-card"><div class="summary-no">D / FAILURE</div><h3>失败要清场</h3><p>mermaid 解析失败会往 body 塞炸弹图；suppressErrorRendering + catch 里按 id 清理，才算“干净地失败”。</p></article>
  </div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">08 · 自测清单</span>
    <h2>复现这几条就够了</h2>
  </header>
  <ol class="callout">
    <li><code>cd app/web && npx tsc --noEmit</code> · 期望 0 错。</li>
    <li><code>npm test</code> · 期望 85 文件 / 723 条全绿（含 markdown-citation / mermaid-guard / mermaid-diagram / composer 等）。</li>
    <li><code>npm run build</code> · mermaid 单独成块（686KB / 168.5KB gz），不进首屏。</li>
    <li>真浏览器（真跑过）：坏 mermaid → 代码块 +「无法渲染此图」，body 上 0 个 <code>[id^=dmermaid-]</code>；带远程 img 的 label → 0 次请求；切深色档导出的 JPEG 为黑底。</li>
  </ol>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">09 · 衔接</span>
    <h2>它接住了谁，又被谁接住</h2>
  </header>
  <div class="callout">
    <p><b>上游</b>：2.2 的流式（整段 text 每帧到达）、2.3/2.6 的命中与 tool part、3.x 的 trace 都不变；4.4 只改了渲染。</p>
    <p><b>下游</b>：4.5 在 <code>AnswerPre</code> 的同一分支上加 csv，在 <code>AnswerTable</code> 上加「下载 CSV」，在回答行上加「导出 .md」。</p>
    <p><b>还没做</b>：语法高亮、KaTeX、脚注（未排期）；回答 JSON part / Generative UI（P4）。</p>
  </div>
</section>`,
    },
    { type: 'html', html: '<footer class="footer">Story 4.4 · 2026-10-29 · 代码取自当前工作区，行号随源码走。</footer>' },
  ],
}
