export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic4-story5-table-csv.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 4 · Story 4.5 表格渲染与 CSV / Markdown 导出 · 带代码逐行讲解',
  tocTitle: 'Story 4.5',
  tocSub: '表格 · CSV · 导出 · 带代码逐行讲解',
  accent: '#7c3aed',
  accent2: '#0369a1',
  accentDark: '#c4b5fd',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 4 · STORY 4.5</span><span>TABLE · CSV · EXPORT</span></div>
  <h1>表格要能看，<em>也要能拿走</em></h1>
  <p class="hero-sub">GFM 表格真渲染（4.4 提供节点，本格补样式与按钮），加一条自己写的 RFC 4180 解析器把 CSV 围栏也变成表；导出走纯前端 Blob：CSV 带 BOM、防公式注入，整条回答的 .md 就是模型原文。解析不了就退回代码块，绝不猜着修数据。</p>
  <div class="meta-row">
    <span class="chip"><strong>前端</strong>85 文件 / 723</span>
    <span class="chip"><strong>真跑</strong>真实下载 3 份</span>
    <span class="chip"><strong>状态</strong>done · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>vitest 85/723</b> · <b>build green</b> · <b>CSV BOM 实测</b> · <b>.md 原文实测</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>两条来源、一个按钮、三种导出</h2>
    <p class="section-sub">表格有两条来源：GFM 表格与 CSV 围栏；下载都落到同一个 CsvDownloadButton。整条回答的 .md 导出是第二个入口。服务端生成文件、Excel 导出都不做。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card"><div class="summary-no">01 / OWNS</div><h3>本格拥有的</h3><p><code>lib/csv.ts</code>（读写两端）、<code>lib/download.ts</code>（Blob 下载 + 文件名清洗）、表格样式与「下载 CSV」、CSV 围栏成表、回答行「导出 .md」、标题透传。</p></article>
    <article class="summary-card"><div class="summary-no">02 / NOT OWNS</div><h3>不归本格的</h3><p>Markdown 渲染主体、引用、流式与 Mermaid（4.4，带徽章）；Mermaid 的「导出 JPEG」也在 4.4。服务端 artifact、Excel / 其他格式导出仍在 Deferred。</p></article>
    <article class="summary-card"><div class="summary-no">03 / HONESTY</div><h3>不猜数据</h3><p>CSV 解析不了（引号不闭合、中途冒引号、只有一列、超过 300 行）就退回代码块；列数不齐原样显示，不补空也不截断。</p></article>
  </div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>下载只有一条路：Blob → objectURL → 一枚锚点</h2>
  </header>
  <ol class="callout">
    <li><b>表格来源 A</b>：GFM 表格 → react-markdown 渲染出 thead/tbody → 从 hast 节点取纯文本当 CSV。</li>
    <li><b>表格来源 B</b>：CSV 围栏 → <code>parseCsv()</code> → 自己拼 table。</li>
    <li><b>导出</b>：<code>csvText()</code> 加 BOM/转义/注入防护 → <code>downloadText()</code> → <code>downloadBlob()</code>。</li>
    <li><b>.md</b>：直接把模型原文交给 <code>downloadText()</code>，不在前端重新拼。</li>
  </ol>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一次导出的旅行',
      subtitle: '点一步跳代码。',
      steps: [
        { goto: 'csv:32-55', title: '解析', note: '状态机吃引号/换行', code: 'csv L32–55' },
        { goto: 'csv:16-30', title: '写 CSV', note: 'BOM + 转义 + 注入防护', code: 'csv L16–30' },
        { goto: 'md:158-202', title: '表 + 按钮', note: '两种来源共用按钮', code: 'md L158–202' },
        { goto: 'download:12-24', title: '落文件', note: 'Blob → 锚点 → 回收', code: 'download L12–24' },
        { goto: 'thread:118-133', title: '导出 .md', note: '流式期间不出现', code: 'thread L118–133' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'csv',
        kicker: 'CORE · 03',
        title: 'lib/csv.ts：读写共用一套口径',
        subtitle: '手写而不是引库：规则就这几条，测起来轻。',
        body: '<div class="callout">写出去再读回来必须是同一份数据（用例钉住）；列数不齐原样保留，因为补空或截断都会偷改用户数据。</div>',
        blocks: [
          {
            id: 'csv',
            file: 'app/web/src/lib/csv.ts',
            source: 'web:src/lib/csv.ts',
            lang: 'ts',
            ranges: [[1, 85]],
            notes: [
              { lines: '16-26', title: '写：BOM + CRLF + 转义', body: '<p>BOM 用 <code>String.fromCharCode(0xfeff)</code> 拼，不把不可见字符写进源码；<code>= + - @</code> 开头的单元格前置单引号挡公式注入。</p>' },
              { lines: '28-30', title: '文件名取表头', body: '<p>交给 <code>safeFileName</code> 清洗；空表头落到 <code>table.csv</code>。</p>' },
              { lines: '32-55', title: '读：一个极小的状态机', body: '<p>两种状态（引号内 / 外）。引号里的逗号与换行原样进单元格，<code>""</code> 还原成一个引号；CRLF 与 BOM 直接吃掉。</p>' },
              { lines: '57-84', title: '读：什么时候宁可不当表', body: '<p>中途冒引号、引号没闭合 → null；只有一列 / 只有表头 / 超过 <code>CSV_MAX_ROWS</code>(300) 行 → null。调用方见到 null 就退回代码块。</p>' },
            ],
          },
          {
            id: 'download',
            file: 'app/web/src/lib/download.ts',
            source: 'web:src/lib/download.ts',
            lang: 'ts',
            ranges: [[1, 35]],
            notes: [
              { lines: '12-15', title: '文本走 Blob', body: '<p><code>downloadText</code> 只是给 <code>downloadBlob</code> 包一层 MIME。</p>' },
              { lines: '17-24', title: '锚点下载 + 立刻回收', body: '<p>objectURL 在 setTimeout 0 里 revoke：早了下载会被掐断，不回收就是泄漏。</p>' },
              { lines: '26-34', title: '文件名清洗', body: '<p>去非法字符与控制符、空白压 <code>-</code>、按码点截 40（不切坏 emoji）、空则兜底。CSV/JPEG 用表头或标题，.md 用会话标题。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'md',
        kicker: 'CORE · 04',
        title: 'markdown-answer.tsx：两种表与一个按钮',
        subtitle: '4.4 的渲染管线不变，这里只补表格分支。',
        body: '<div class="callout">表格宽度口径改过一次：只给 w-full 时 9 列表格会把中文压成一字一行；现在 w-max + min-w-full 横向滚，单元格 max-w-sm 兜住超长备注。</div>',
        blocks: [
          {
            id: 'md',
            file: 'app/web/src/components/chat-thread/markdown-answer.tsx',
            source: 'web:src/components/chat-thread/markdown-answer.tsx',
            lang: 'ts',
            ranges: [[71, 74], [158, 216]],
            notes: [
              { lines: '71-73', title: '表格宽度口径', body: '<p><code>w-max</code> 按内容撑开、<code>min-w-full</code> 不窄于容器、<code>max-w-sm</code>(24rem) 让长文本在格内换行。24rem 用 max-w-sm 而不是任意值，因为仓库守卫禁止尺寸任意值字面量。', badge: '4.4/4.5' },
              { lines: '158-187', title: 'CSV 围栏 → 表', body: '<p>首行当表头；下载内容就是解析后的行，不重新拼字符串（拼一遍就可能和屏幕上看到的不是同一份）。</p>', badge: '4.5' },
              { lines: '189-202', title: '同一个下载按钮', body: '<p>GFM 表与 CSV 围栏共用；<code>csvText</code> 负责 BOM/转义/注入防护，按钮只负责命名与触发。</p>', badge: '4.5' },
              { lines: '204-216', title: 'GFM 表：节点归 4.4，按钮归 4.5', body: '<p><code>tableRows(node)</code> 从渲染树取纯文本（单元格里的引用还原成 <code>[token]</code>）；流没结束或只有表头时不给按钮。</p>', badge: '4.5' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'thread',
        kicker: 'WIRING · 05',
        title: '回答行 + 标题透传',
        subtitle: '导出入口只在流结束后出现。',
        body: '<div class="callout">标题只用于文件名；导出的正文是 <code>Text</code>（模型原文），不重新序列化。</div>',
        blocks: [
          {
            id: 'thread',
            file: 'app/web/src/components/chat-thread/chat-thread.tsx',
            source: 'web:src/components/chat-thread/chat-thread.tsx',
            lang: 'ts',
            ranges: [[118, 133]],
            notes: [
              { lines: '118-133', title: '导出 .md', body: '<p>流式期间不渲染按钮（半条回答不该被导成成品）；文件名取会话标题，清洗后为空就落「回答」。', badge: '4.5' },
            ],
          },
          {
            id: 'ask',
            file: 'app/web/src/routes/ask.tsx',
            source: 'web:src/routes/ask.tsx',
            lang: 'ts',
            ranges: [[538, 546]],
            notes: [
              { lines: '538-546', title: '标题从页面下来', body: '<p>AskPage 用当前会话标题喂给 ChatThread；同一条回答的 .md 与图 JPEG 都用它命名。</p>', badge: '4.5' },
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
    <span class="kicker">06 · 取舍与踩坑</span>
    <h2>四条“看起来对、其实会坑人”的选择</h2>
  </header>
  <div class="summary-grid">
    <article class="summary-card"><div class="summary-no">A / PARSER</div><h3>手写 RFC 4180</h3><p>papaparse 能省 40 行，但这里只需要“能不能安全当表看”这一档；手写规则可测、可拒收，不引入一条新的依赖。</p></article>
    <article class="summary-card"><div class="summary-no">B / REFUSE</div><h3>宁可代码块</h3><p>错位的表比代码块更难发现；所以解析失败一律回退，列不齐也照实显示，不替用户“修”。</p></article>
    <article class="summary-card"><div class="summary-no">C / WIDTH</div><h3>表格按内容宽</h3><p>w-full 会让 9 列表格把「产品经理」压成竖排；w-max + 横向滚才对。长备注封在 24rem 内换行。</p></article>
    <article class="summary-card"><div class="summary-no">D / GUARDS</div><h3>被仓库守卫抓的三下</h3><p>hex 兜底色 → 改 white；role=status 不能包在条件渲染里 → 常驻槽；禁用态 opacity-50 → 全站口径 40。</p></article>
  </div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">07 · 自测清单</span>
    <h2>真跑过的三份下载</h2>
  </header>
  <ol class="callout">
    <li><b>CSV</b>（真跑）：文件头 <code>EF BB BF</code>（BOM），表头 <code>阶段,能力增量,对应的 AI SDK 练习点</code>，单元格里的引用还原成 <code>[8bd00bae]</code>。</li>
    <li><b>.md</b>（真跑）：内容就是模型原文（含 <code>**</code> 与 <code>[508…]</code>），文件名取会话标题。</li>
    <li><b>CSV 围栏</b>（真跑）：9 列表头 8 行数据，<code>"Smith, John"</code> 成一格，超长备注格宽 384px × 高 72px（格内换行），表总宽 1058px / 容器 589px → 横向滚，页面不撑破。</li>
    <li><code>npx tsc --noEmit</code> · 0 错；<code>npm test</code> · 85 文件 / 723 条；<code>npm run build</code> · 通过。</li>
  </ol>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">08 · 衔接</span>
    <h2>接在 4.4 的哪个钩子上</h2>
  </header>
  <div class="callout">
    <p><b>上游</b>：4.4 的 <code>AnswerPre</code>（按语言分流）与 <code>AnswerTable</code>（GFM 表的容器）、4.4 的 PROSE。</p>
    <p><b>下游</b>：<code>lib/csv.ts</code> 的解析器可复用于别的场景；<code>downloadBlob</code> 也被 4.4 的 Mermaid JPEG 导出复用。</p>
    <p><b>还没做</b>：Excel / 其他格式、服务端 artifact（落 MinIO 再发链接）、CSV 大文件分页。</p>
  </div>
</section>`,
    },
    { type: 'html', html: '<footer class="footer">Story 4.5 · 2026-10-29 · 代码取自当前工作区，行号随源码走。</footer>' },
  ],
}
