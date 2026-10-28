export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic7-story0-eval-connection.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 7 · Story 7.0 评测连接 · 默认主库 / 可选隔离库 · 带代码逐行讲解',
  tocTitle: 'Story 7.0',
  tocSub: '评测连接 · 共享 / 隔离 · 带代码逐行讲解',
  accent: '#4f46e5',
  accent2: '#0f766e',
  accentDark: '#a5b4fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 7 · STORY 7.0</span><span>EVAL CONNECTION · SHARED / ISOLATED</span></div>
  <h1>评测世界，<em>换一个 pgpool</em></h1>
  <p class="hero-sub">7.0 不建评测表、不做题集面板，只把“评测跑哪套库”抽成一条连接：不配 EVAL_DATABASE_URL 时，评测直接复用主库的 Repo 与检索句柄；配了就用第二个 pgpool 连 ragdb_eval，资源和实验都留在那一边。两种模式共用同一批服务类、同一套迁移、同一条 trace 前缀。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>124 / 124</span>
    <span class="chip"><strong>前端</strong>639 / 639</span>
    <span class="chip"><strong>真跑</strong>45 篇 · 949 块</span>
    <span class="chip"><strong>状态</strong>done · 2026-10-28</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 124</b> · <b>frontend 639</b> · <b>build green</b> · <b>shared + isolated live</b> · <b>health 4 services</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格只做连接，不做评测业务</h2>
    <p class="section-sub">7.0 的成果不是“评测功能”，而是一条可以复用的库选择：评测世界与主世界同构，差别只在 pgpool。题集、运行、对照、答案评测从 7.1 才开始。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / SHARED</div>
      <h3>默认共享主库</h3>
      <p>不配 <code>EVAL_DATABASE_URL</code> 时，<code>EvalAssembly</code> 直接把主库的 <code>PostgresRepo</code> 与 <code>RetrieverHandle</code> 交给评测路由。零配置、同一份语料；评测产生的资源/痕迹会出现在主库里，按 <code>/eval</code> 前缀识别。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / ISOLATED</div>
      <h3>可选隔离库</h3>
      <p>配了 URL 就构造第二个 pgpool 连 <code>ragdb_eval</code>，再用同一批服务类组装第二套 Repo/Retriever。主库的检索、列表、聊天统计不受影响；代价是要建库、灌语料。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / ONE SHAPE</div>
      <h3>同构装配，换 pool</h3>
      <p>两种模式复用同一批类；<code>ObjectStore</code>、<code>Embedding</code>、<code>RetrieverFactory</code>、<code>InflightRegistry</code> 共享。不改 Repo 为多实例容器，也不提前做 namespace。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">04 / OBSERVE</div>
      <h3>trace、health、徽标</h3>
      <p>评测路由由自己的 trace 壳记一次，route 带 <code>/eval</code>；<code>/health</code> 多一个 <code>eval</code> 服务组；三个评测页页头显示共享主库 / 隔离库 / 检测中 / 未知。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 7.0：</strong>eval_datasets / eval_cases / eval_run_configs / eval_metric_configs（7.1）、真实题集面板与配置 CRUD（7.1）、发起运行与逐条结果（7.2）、基线与并排对照（7.3）、judge / HITL / 答案评测（7.4）、多知识库 namespace（P3 之后）、评测库独立备份（未排期）、<code>/eval/resources</code> 与四表 CRUD 完整镜像（本轮不做）。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>src/config.ts</code></td><td>EVAL_DATABASE_URL 可选开关，不进 missing</td></tr>
      <tr><td><code>src/adapter/connection/eval-db.ts</code></td><td>第二个 pgpool；只在隔离模式构造</td></tr>
      <tr><td><code>src/adapter/contract.ts</code></td><td>EvalPostgresRepo 继承 PostgresRepo，经 adapter 门交出</td></tr>
      <tr><td><code>src/eval/assembly.ts</code></td><td>shared / isolated 的 repo 与 RetrieverHandle 选择</td></tr>
      <tr><td><code>src/routes/eval.ts</code></td><td>GET /status + POST /retrieve + 评测 trace 壳</td></tr>
      <tr><td><code>src/index.ts</code></td><td>/eval 先于主壳挂载；health 传入 eval probe</td></tr>
      <tr><td><code>src/routes/health.ts</code></td><td>eval 服务组：shared 恒 ok；isolated 真 ping</td></tr>
      <tr><td><code>scripts/eval-db-setup.ts</code></td><td>建 ragdb_eval + 跑同一套 dbmate 迁移</td></tr>
      <tr><td><code>scripts/eval-seed.ts</code></td><td>主库 ready 资源复制对象 + 重走 ingest 链</td></tr>
      <tr><td><code>app/web/src/api/client.ts</code></td><td>fetchEvalStatus 与 EvalStatus 类型</td></tr>
      <tr><td><code>app/web/src/components/evals/evals-page.tsx</code></td><td>页头模式徽标；四态；读一次 status</td></tr>
      <tr><td><code>app/web/src/routes/health.tsx</code></td><td>健康页服务卡由 3 张骨架变 4 张</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块的 <span class="badge b-app">7.0</span> 标记是本格新增/改写；<span class="badge b-pre">前置</span> 是复用或未改的上下文。endpoint.ts 在本格没有改动，只被复用。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>一条 env，分叉两个世界</h2>
    <p class="section-sub">所有行为都绕着一句话：<strong>评测世界 = 主世界换一个 pgpool</strong>。共享模式根本不解析评测库连接类；隔离模式才建第二个池。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>1 · 启动时选库</h3>
      <ul class="flow-list">
        <li><span>EVAL_DATABASE_URL 缺失</span><code>mode = shared</code></li>
        <li><span>有 URL</span><code>mode = isolated</code></li>
        <li><span>两条的出口</span><code>EvalAssembly.repo / handle</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>2 · 评测请求</h3>
      <ul class="flow-list">
        <li><span>GET /eval/status</span><code>mode + corpus</code></li>
        <li><span>POST /eval/retrieve</span><code>复用 RetrieveRoute</code></li>
        <li><span>trace</span><code>写选中库，route 带 /eval</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>3 · 外围</h3>
      <ul class="flow-list">
        <li><span>/health</span><code>eval 服务组</code></li>
        <li><span>前端页头</span><code>共享主库 / 隔离库</code></li>
        <li><span>隔离语料</span><code>eval:seed</code></li>
      </ul>
    </article>
  </div>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">MODE A · SHARED</div>
      <h3>不配 URL：零成本，共用主库</h3>
      <p>同一只 pgpool、同一份 resources/chunks/embeddings；评测的资源操作会真实落到主库。适合“先跑起来”和“就评生产语料”。健康探针标 <code>mode=shared</code>，不重复 ping。</p>
    </article>
    <article class="choice">
      <div class="choice-no">MODE B · ISOLATED</div>
      <h3>配 URL：第二个池，主库不受影响</h3>
      <p>单独建 <code>ragdb_eval</code>，灌入自己的语料；评测写自己的 resources/chunks/embeddings/traces。代价是多一个库、一次 seed，以及两套连接池。</p>
    </article>
  </div>
  <div class="callout"><strong>当前工作区：</strong><code>.env</code> 已含 <code>EVAL_DATABASE_URL</code>，所以默认是隔离模式；要在本机看共享模式，起服务时显式 <code>EVAL_DATABASE_URL=</code>。这是配置事实，不是代码默认值——代码默认仍然是共享。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="glossary">
  <header class="section-head">
    <span class="kicker">03 · 小白词典</span>
    <h2>读代码前先对齐几个词</h2>
    <p class="section-sub">这些词在后面的块里反复出现；先按“人话”记住，再看实现。</p>
  </header>
  <dl class="glossary">
    <div class="gloss"><dt>pgpool</dt><dd>PostgreSQL 连接池。主库与评测库各有一只，互不共享；共享模式只有主库那只。</dd></div>
    <div class="gloss"><dt>装配（assembly）</dt><dd>把配置、连接、Repo、服务按依赖关系拼起来的那一步。<code>EvalAssembly</code> 只负责“评测用哪套”。</dd></div>
    <div class="gloss"><dt>同构</dt><dd>同一批类、同一套迁移、同一套行为；差别只在注入的 Repo/池。不是第二套业务代码。</dd></div>
    <div class="gloss"><dt>route 模板</dt><dd>trace 里记的路由形状，例如 <code>POST /eval/retrieve</code>。Hono 的 matchedRoutes 会带子应用的完整前缀。</dd></div>
    <div class="gloss"><dt>ingest 链</dt><dd>storage fetch → parse → chunk → embed → write。隔离 seed 不另写一套，还是走这条链。</dd></div>
    <div class="gloss"><dt>内容寻址 key</dt><dd>评测对象的 MinIO key 用 <code>eval/&lt;sha256&gt;/&lt;原 key&gt;</code>，同一内容可重跑，主库对象被删也不影响评测。</dd></div>
    <div class="gloss"><dt>幂等 seed</dt><dd>按 content_hash 查评测库：ready 跳过、软删恢复、其余状态重试；重复跑不重复建行。</dd></div>
    <div class="gloss"><dt>健康探针</dt><dd>/health 的叶子检查；全部通过才是 200 ok，否则 degraded / 503。eval 组是这一层新增的。</dd></div>
  </dl>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一次评测连接的选择',
      subtitle: '点一步跳代码；shared 与 isolated 两条路都走一遍。',
      steps: [
        { goto: 'config-file:60-66', title: '读 env', note: '不设是 null；不进 missing', code: 'config L60–66' },
        { goto: 'assembly-file:33-43', title: '选 repo', note: 'shared 复用主库；isolated 才 resolve 第二个池', code: 'assembly L33–43' },
        { goto: 'eval-route-file:30-40', title: 'status 摆事实', note: 'mode / reachable / corpus，不把缺库当 503', code: 'eval L30–40' },
        { goto: 'eval-route-file:43-43', title: 'trace 壳', note: 'status 已先注册；只给 retrieve 记一条', code: 'eval L43' },
        { goto: 'index-mount:39-45', title: '先挂 /eval', note: 'Hono 的 use(*) 只作用于其后路由，主壳不记评测请求', code: 'index L39–45' },
        { goto: 'health-file:65-79', title: 'health', note: 'shared 恒 ok；isolated 真 ping，detail 带 mode', code: 'health L65–79' },
        { goto: 'client-file:982-985', title: '前端取状态', note: 'GET /api/eval/status，只取一次', code: 'client L982–985' },
        { goto: 'badge-file:78-100', title: '徽标四态', note: '共享主库 / 隔离库 / 检测中 / 未知', code: 'evals L78–100' },
        { goto: 'setup-file:16-25', title: '隔离建库', note: '建库 + 同一套迁移；URL 只走 env', code: 'setup L16–25' },
        { goto: 'seed-file:108-132', title: '隔离灌语料', note: '复制对象到 eval/<hash>/<原 key>，再走 ingest', code: 'seed L108–132' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'config-section',
        kicker: '04 · 配置与第二个池',
        title: '先有一个“可选”的 URL，再有一个只在需要时出现的池',
        subtitle: '共享模式必须零额外连接；所以 EvalDbHandle 不能提前构造。',
        body: '<div class="callout"><strong>关键取舍：</strong>EVAL_DATABASE_URL 是可选开关，不进 missing。缺失时不是配置错误，而是共享模式；只有隔离模式才会解析 EvalDbHandle。</div>',
        blocks: [
          {
            id: 'config-file',
            file: 'src/config.ts',
            lang: 'ts',
            ranges: [[5, 10], [20, 28], [60, 66]],
            notes: [
              { lines: '9-9', title: '可选开关写进文件头', badge: 'app', body: '<p>这条说明把两种模式的语义钉在配置层：不设 = 共享，设了 = 隔离。读 config 的人不用先去翻 assembly。</p>' },
              { lines: '24-24', title: 'string | null，不是 string', badge: 'app', body: '<p>类型上就允许缺失；调用方必须显式处理 null，而不是拿空字符串或 <code>!</code> 兜底。</p>' },
              { lines: '64-64', title: '缺失 → null，不进 missing', badge: 'app', body: '<p><code>getEnv</code> 不传 missing 数组，所以缺 URL 不会触发 <code>E_CONFIG_MISSING</code>；<code>?? null</code> 把 undefined 归一成 null。</p>' },
            ],
          },
          {
            id: 'eval-db-file',
            file: 'src/adapter/connection/eval-db.ts',
            lang: 'ts',
            ranges: [[1, 25]],
            notes: [
              { lines: '1-5', title: '第二个 new Pool 的位置', badge: 'app', body: '<p>与 <code>DbHandle</code> 同形，仍走 <code>createDbPool</code>；文件头明确“共享模式不解析本类”。</p>' },
              { lines: '19-24', title: '没有 URL 就 throw', badge: 'app', body: '<p>这不是启动路径会碰到的异常：<code>EvalAssembly</code> 只在 URL 存在时才 <code>container.resolve(EvalPostgresRepo)</code>。如果别处提前解析，会当场暴露配置错误，而不是悄悄连错库。</p>' },
            ],
          },
          {
            id: 'contract-eval',
            file: 'src/adapter/contract.ts',
            lang: 'ts',
            ranges: [[1, 7], [33, 37], [371, 378]],
            notes: [
              { lines: '5-6', title: '同一套 Repo 方法，换池', badge: 'app', body: '<p>EvalPostgresRepo 不是新接口：继承 PostgresRepo，方法一个不少；只在隔离模式构造。</p>' },
              { lines: '36-36', title: '经 adapter 门交出', badge: 'app', body: '<p>外部只见服务类，<code>EvalDbHandle</code> 与 Pool 不出 adapter；这保持了 AD-3 的“池不过门”。</p>' },
              { lines: '373-378', title: 'super(new EvalDbHandle(Config))', badge: 'app', body: '<p>父类构造器接收一个持 pool 的句柄；<code>EvalDbHandle</code> 与 <code>DbHandle</code> 结构相同，所以可以直接作为 super 参数。Drizzle 实例也跟着第二个池走。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'assembly-section',
        kicker: '05 · 评测世界装配',
        title: 'EvalAssembly：只做一次二选一',
        subtitle: 'shared 走左路复用；isolated 走右路新建。没有第三种模式。',
        body: '<div class="callout strong"><strong>为什么是 container.resolve 而不是注入：</strong>如果把 EvalPostgresRepo 作为构造器依赖注入，shared 模式也会提前构造它（或者在无 URL 时抛错）。这里把“建第二个池”推迟到 isolated 分支里，共享模式连这个类都不碰。</div>',
        blocks: [
          {
            id: 'assembly-file',
            file: 'src/eval/assembly.ts',
            lang: 'ts',
            ranges: [[1, 45]],
            notes: [
              { lines: '1-5', title: '评测世界 = 主世界换 pgpool', badge: 'app', body: '<p>文件头就是本页的中心句：同一批服务类、同一套迁移；共享模式不碰评测库连接。</p>' },
              { lines: '20-32', title: '依赖里有主库的 repo/handle', badge: 'app', body: '<p>MainRepo 与 MainHandle 是主世界的单例；Factory 与 Embedding 在两种模式下都可能用到，所以注入。</p>' },
              { lines: '33-38', title: 'shared：直接交出主世界的两只', badge: 'app', body: '<p>没有新建 Pool、没有新建 repo；<code>mode</code> 只是给 status/health/日志看的标签。</p>' },
              { lines: '40-43', title: 'isolated：第二个池 + 新检索句柄', badge: 'app', body: '<p><code>EvalPostgresRepo</code> 构造第二个池；<code>new RetrieverHandle</code> 用同一个 Factory、同一个 Embedding，但把 repo 换成评测库。检索代码一行没改。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'routes-section',
        kicker: '06 · 评测路由与 trace',
        title: '两个端点，一条只记一次的 trace',
        subtitle: '不改 endpoint.ts：用注册顺序把评测请求和主壳隔开。',
        body: '<div class="callout"><strong>位置约束：</strong>Hono 的 <code>use(*)</code> 只作用于它之后注册的路由。入口先挂 /eval，再挂主壳；评测子应用内先注册 /status，再挂 trace 壳。挪动任意一处，双层 trace 或 status 落 trace 会回来。</div>',
        blocks: [
          {
            id: 'eval-route-file',
            file: 'src/routes/eval.ts',
            lang: 'ts',
            ranges: [[1, 48]],
            notes: [
              { lines: '1-5', title: '文件头就是顺序契约', badge: 'app', body: '<p>status 先注册、trace 壳后注册；整个 /eval 在入口里先于主壳。三句话对应三个注册点。</p>' },
              { lines: '30-41', title: 'status 只摆事实', badge: 'app', body: '<p>返回 mode / reachable / corpus；ping 失败就 reachable=false，不把“评测库不可达”升级成整个接口 503。语料计数失败只记日志、corpus=null。</p>' },
              { lines: '43-43', title: 'trace 壳在 status 之后', badge: 'app', body: '<p>这一行之后注册的 /retrieve 才会经过端点壳；/status 已在前面注册，所以不落 trace。</p>' },
              { lines: '44-44', title: '复用生产 RetrieveRoute', badge: 'app', body: '<p>不是新写一套检索：同一个 <code>RetrieveRoute</code> 类，只是构造参数换成 <code>this.assembly.handle</code>（共享时是主句柄，隔离时是新句柄）。</p>' },
            ],
          },
          {
            id: 'index-mount',
            file: 'src/index.ts',
            lang: 'ts',
            ranges: [[32, 57]],
            notes: [
              { lines: '39-42', title: '先挂 /eval，再挂主壳', badge: 'app', body: '<p><code>app.route(/eval, ...)</code> 在两条 <code>app.use(*)</code> 之前；39 行注释是这条约束的唯一提示。<code>I_EVAL_MODE</code> 让启动日志能直接看出当前模式。</p>' },
              { lines: '44-45', title: '主库上下文与 trace 只作用于后来者', badge: 'app', body: '<p>setDb 和主库 trace 壳都注册在 /eval 之后，所以评测请求不会经过它们；评测路由自带 repo，不依赖 <code>c.get(db)</code>。</p>' },
              { lines: '52-52', title: 'health 拿到 eval probe', badge: 'app', body: '<p><code>mode</code> + <code>ping()</code> 组成一个轻量探针；health 不需要知道 EvalAssembly 或 Pool。</p>' },
            ],
          },
          {
            id: 'endpoint-shell',
            file: 'src/trace/systemtrace/endpoint.ts',
            lang: 'ts',
            ranges: [[61, 80]],
            notes: [
              { lines: '61-63', title: '端点壳只认 Writer', badge: 'app', body: '<p>函数接收一个能 <code>insertTrace/finishTrace</code> 的 Writer；主壳传主库 repo，评测壳传选中库 repo。这是它能被复用的原因。</p>' },
              { lines: '65-69', title: '路由模板带全前缀', badge: 'app', body: '<p>Hono 的 <code>matchedRoutes</code> 在子应用里也返回完整模板（<code>/eval/retrieve</code>），所以 route 前缀天然就是评测标记；不需要 origin 列。</p>' },
              { lines: '74-74', title: 'UUID 归一成 :id', badge: 'app', body: '<p>同一条壳的既有逻辑；评测路由也受益——不会因为 chunk/resource 的 UUID 不同而把 trace 打散。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'health-section',
        kicker: '07 · 健康探针',
        title: 'eval 组：shared 恒 ok，isolated 才真 ping',
        subtitle: '把连接模式放进服务探针，让 /health 页自己多一张卡。',
        body: '<div class="callout strong"><strong>口径代价：</strong>沿用“全绿才 200”。隔离库 ping 失败时 /health 会 degraded/503，即使主应用还能跑。这是显式取舍：健康页要能看见评测库坏了；如果你希望它只摆事实、不影响主档位，把 ok 改成 true、detail 写 reachable=false 即可。</div>',
        blocks: [
          {
            id: 'health-file',
            file: 'src/routes/health.ts',
            lang: 'ts',
            ranges: [[1, 18], [51, 80]],
            notes: [
              { lines: '7-7', title: '文件头写清两种模式', badge: 'app', body: '<p>shared 不重复探主库；isolated 才真 ping。这样 health 不会在共享模式多打一次数据库。</p>' },
              { lines: '51-51', title: 'EvalProbe 是唯一新依赖', badge: 'app', body: '<p>只传 <code>mode</code> 与 <code>ping</code>，不让 health 依赖 EvalAssembly/Pool；测试可以塞一个假 probe。</p>' },
              { lines: '65-79', title: '一个 check 装两种模式', badge: 'app', body: '<p>detail 用字符串数组，是为了健康页的 <code>detailList</code> 能渲染成 Tag，而不是 [object Object]。shared 的 check 恒 true；isolated 的 ok 等于 ping。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'tools-section',
        kicker: '08 · 隔离模式工具',
        title: '建库与灌语料：两条可重复命令',
        subtitle: 'eval:db:setup 保证 schema 同构；eval:seed 保证块内容同构。',
        body: '<div class="callout"><strong>为什么不挂 /eval/resources：</strong>隔离语料只需要一个可重复的入口。seed 走现有 ResourceIngest，避免再维护第二条“上传/入库”语义；四表 CRUD 和面板留给 7.1–7.3。</div>',
        blocks: [
          {
            id: 'setup-file',
            file: 'scripts/eval-db-setup.ts',
            lang: 'ts',
            ranges: [[1, 94]],
            notes: [
              { lines: '16-25', title: '主流程：建库 → 迁移 → 数迁移', badge: 'app', body: '<p>先解析库名，再用同一实例的 <code>postgres</code> 库做维护连接；最后打印 applied 数，作为“同一套迁移”的证据。</p>' },
              { lines: '28-42', title: 'CREATE DATABASE 的边界', badge: 'app', body: '<p>库名先过白名单再用双引号拼进 SQL；<code>CREATE DATABASE</code> 不能放进事务、也不能参数化，所以这里只接受 <code>[a-z_][a-z0-9_]*</code>。</p>' },
              { lines: '44-52', title: 'dbmate 用 env 覆盖 .env', badge: 'app', body: '<p>连接串放进子进程 env，不放 argv；dbmate 2.36 的环境变量优先于 .env，已实测。这样 ps 里也看不到 URL。</p>' },
              { lines: '65-80', title: '只认 postgres/postgresql', badge: 'app', body: '<p>协议、库名都校验；失败给可读错误，不把带凭据的 URL 打进日志。</p>' },
            ],
          },
          {
            id: 'seed-file',
            file: 'scripts/eval-seed.ts',
            lang: 'ts',
            ranges: [[45, 92], [93, 142], [162, 170]],
            notes: [
              { lines: '45-65', title: '共享模式直接退出', badge: 'app', body: '<p>没有 URL 就没有“评测库”可灌；这里选择 0 退出并说明，而不是报错。隔离模式才 resolve EvalAssembly 并手工构造一个绑定 eval repo 的 ResourceIngest。</p>' },
              { lines: '72-90', title: '主库 ready → 逐条处理', badge: 'app', body: '<p><code>--limit</code> 只截前 N 条，用来先跑通一篇；统计 seeded/skipped/failed，失败不中断整批，最后用退出码表达结果。</p>' },
              { lines: '93-106', title: '读对象、算 hash、已有 ready 跳过', badge: 'app', body: '<p>hash 从实际读回的字节算，不信主库 content_hash；不一致会打 W 但按现读字节写评测库。ready 命中直接跳过，这是重复跑不重复写的主要路径。</p>' },
              { lines: '108-132', title: '已有行恢复 / 新行内容寻址', badge: 'app', body: '<p>已有软删行先 restore；新行用 <code>eval/&lt;hash&gt;/&lt;原 key&gt;</code>，同一内容稳定复用、不同内容不撞 data_uri。对象先复制，再建/复用行。</p>' },
              { lines: '134-141', title: '还是那条 ingest 链', badge: 'app', body: '<p>最终调用 <code>ResourceIngest.ingest</code>：stat 门禁 → storage fetch → parse → chunk → embed → write。评测没有第二套入库算法。</p>' },
              { lines: '162-170', title: '流式读到 Buffer 再复制', badge: 'app', body: '<p>复制对象必须拿原始字节；把 Node Readable 读完再 put，才有稳定的 SHA-256 与同构块。</p>' },
            ],
          },
          {
            id: 'package-scripts',
            file: 'package.json',
            lang: 'ts',
            ranges: [[6, 15]],
            notes: [
              { lines: '13-14', title: '两条命令的入口', badge: 'app', body: '<p>都走 <code>tsx --env-file=.env</code>；EVAL_DATABASE_URL 可以在命令行覆盖，不必写进 .env。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'frontend-section',
        kicker: '09 · 前端徽标',
        title: '页头只加一枚事实徽标',
        subtitle: '共享主库 / 隔离库 / 检测中 / 未知；模式不是好坏。',
        body: '<div class="callout"><strong>为什么不门禁：</strong>缺 URL 是共享模式，不是“评测不可用”。三个页面继续可用；徽标只负责把当前连接摆出来。页面数据仍是 mock，真接口留给 7.1–7.3。</div>',
        blocks: [
          {
            id: 'client-file',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            lang: 'ts',
            ranges: [[67, 84], [982, 985]],
            notes: [
              { lines: '78-84', title: 'EvalMode / EvalStatus', badge: 'app', body: '<p>类型与后端 <code>GET /eval/status</code> 的返回一一对应；corpus 复用已有 ResourceCounts，或 null。</p>' },
              { lines: '982-985', title: '只加一个 GET', badge: 'app', body: '<p>走统一 <code>requestJson</code>，路径带 /api 前缀由 vite proxy 剥掉；非 2xx 仍由 ApiError 统一处理。</p>' },
            ],
          },
          {
            id: 'badge-file',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[72, 100], [132, 146], [223, 239]],
            notes: [
              { lines: '72-90', title: '四态映射', badge: 'app', body: '<p>failed 请求显示“评测状态未知”红点；未返回显示“检测中”灰点；reachable 才给绿点。title 里带 ready 篇数，不把信息塞进主标签。</p>' },
              { lines: '92-100', title: '一枚胶囊', badge: 'app', body: '<p><code>bg-fill + text-caption</code> 沿用现有 token；点是 aria-hidden，文字本身就是可读内容。</p>' },
              { lines: '132-146', title: '进入页面取一次', badge: 'app', body: '<p>mode 是启动期 env，运行中不会变，所以不做轮询/共享 store；<code>alive</code> 防止卸载后 setState。</p>' },
              { lines: '223-239', title: '三个视图共用页头', badge: 'app', body: '<p>徽标始终渲染；“运行评测”按钮只在 runs 视图出现。三个路由都渲染 EvalsPage，所以没有三份重复状态。</p>' },
            ],
          },
          {
            id: 'health-page-file',
            file: 'app/web/src/routes/health.tsx',
            source: 'web:src/routes/health.tsx',
            lang: 'ts',
            ranges: [[81, 96]],
            notes: [
              { lines: '83-83', title: '骨架 3 → 4', badge: 'app', body: '<p>健康页按 services 动态出卡；新增 eval 组后实际是 4 张，加载占位也跟着改成 4，不再让第 3 张跨两列。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'tests-section',
        kicker: '10 · 断言',
        title: '用假 repo 钉 trace，用真库钉隔离',
        subtitle: '快测试证明“只记一次”；慢集成证明“两边互不相交”。',
        body: '<div class="callout"><strong>测试策略：</strong>共享模式的装配选择用真容器断同一只对象；trace 行为用假 repo 断路由与注册顺序；隔离模式用真实 ragdb_eval 断两库 chunks 与对象前缀；health 用假 probe 断两种模式。浏览器视觉留给 Lynx。</div>',
        blocks: [
          {
            id: 'eval-route-test',
            file: 'test/eval-route.test.ts',
            lang: 'ts',
            ranges: [[88, 138]],
            notes: [
              { lines: '88-94', title: 'shared 复用同一只', badge: 'app', body: '<p>真容器里 <code>Assembly.repo</code> 必须与 <code>PostgresRepo</code> 单例全等，<code>handle</code> 与 <code>RetrieverHandle</code> 全等；不是“看起来像”。</p>' },
              { lines: '97-107', title: 'status 不落 trace', badge: 'app', body: '<p>假 repo 记 <code>insertTrace</code>；请求 /eval/status 后 traces 必须为空。这条直接钉住“status 先注册”。</p>' },
              { lines: '109-123', title: 'retrieve 只记一条', badge: 'app', body: '<p>route 必须是 <code>POST /eval/retrieve</code>；finishTrace 恰好一次且 status=ok。如果主壳也记了，这里会是 2。</p>' },
              { lines: '126-138', title: '错误路径也收口', badge: 'app', body: '<p>坏 body → 400，但 trace 仍然 finish 成 error；旁路观测不能因为业务 4xx 留下 running 行。</p>' },
            ],
          },
          {
            id: 'eval-isolated-test',
            file: 'test/eval-isolated.test.ts',
            lang: 'ts',
            ranges: [[29, 63]],
            notes: [
              { lines: '29-37', title: 'isolated + 语料', badge: 'app', body: '<p>没有 EVAL_DATABASE_URL 时整组跳过；有则必须 mode=isolated、ping 通、ready &gt; 0。</p>' },
              { lines: '40-62', title: '两库 chunks 互不相交', badge: 'app', body: '<p>取两边各一条 chunk id，在对方库里查不到；并用 data_uri LIKE 断评测对象全住 <code>eval/</code> 前缀。这是“数据隔离”的可核对证据。</p>' },
            ],
          },
          {
            id: 'health-test',
            file: 'test/health-chain.test.ts',
            lang: 'ts',
            ranges: [[54, 72], [168, 184]],
            notes: [
              { lines: '54-60', title: '四服务组的顺序', badge: 'app', body: '<p>postgres → eval → ollama → s3；eval 只有一个 connection check。顺序也是前端卡片的顺序。</p>' },
              { lines: '66-69', title: 'eval.ok 等于它唯一的 check', badge: 'app', body: '<p>单 check 的服务，ok 就是 check.ok；detail 里必须带当前 mode，防止 probe 塞错。</p>' },
              { lines: '168-175', title: 'isolated 失败 → 整体 degraded', badge: 'app', body: '<p>假 probe ping=false：eval.ok=false，整体 503。这条把“全绿才 200”的口径钉住，也提醒这是显式取舍。</p>' },
            ],
          },
          {
            id: 'client-eval-test',
            file: 'app/web/src/api/client.evals.test.ts',
            source: 'web:src/api/client.evals.test.ts',
            lang: 'ts',
            ranges: [[25, 41]],
            notes: [
              { lines: '26-34', title: 'URL 与返回形状', badge: 'app', body: '<p>路径必须是 /api/eval/status；mode/reachable/corpus 原样返回，不在客户端改名。</p>' },
              { lines: '37-40', title: '错误码透传', badge: 'app', body: '<p>非 2xx 仍是 ApiError，code 来自后端；徽标的“未知”态靠它区分。</p>' },
            ],
          },
          {
            id: 'badge-test',
            file: 'app/web/src/components/evals/evals-page.test.tsx',
            source: 'web:src/components/evals/evals-page.test.tsx',
            lang: 'ts',
            ranges: [[31, 57]],
            notes: [
              { lines: '32-40', title: 'shared 视图', badge: 'app', body: '<p>mock fetchEvalStatus 返回 shared：页头出现“共享主库”，title 带 45 篇 ready，只请求一次。</p>' },
              { lines: '42-49', title: 'isolated 在另一个视图', badge: 'app', body: '<p>题集视图也显示“隔离库”，证明徽标挂在共用页头而不是某个视图里。</p>' },
              { lines: '51-57', title: '失败态不冒充绿色', badge: 'app', body: '<p>请求 reject → “评测状态未知”；不把缺省画成绿。</p>' },
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
    <span class="kicker">11 · 取舍与踩坑</span>
    <h2>为什么是这些形状</h2>
    <p class="section-sub">每一条都能在上面的代码里找到落点；这里讲被否掉的方案和容易踩的坑。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">DECISION 01</div>
      <h3>默认共享，不把缺 URL 当“不可用”</h3>
      <p>最初的 AC 写成“缺失时评测整体不可用”，Lynx 当天纠偏：评测默认就该跑主库，缺 URL 是共享模式，不是关闭功能。于是 status 返回 mode，前端也不做禁用门。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 02</div>
      <h3>评测世界 = 主世界换 pgpool</h3>
      <p>不复制一套业务代码，也不把 Repo 改成多实例容器。shared 复用主库的 repo/handle；isolated 只多一个池和一套绑定它的服务。两边的迁移、检索、ingest 都是同一套。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 03</div>
      <h3>不改 endpoint.ts，用注册顺序隔开</h3>
      <p>Hono 的 use(*) 只作用于其后注册的路由：入口先挂 /eval，子应用内 status 先注册。代价是位置约束——把 app.route(/eval) 挪到主壳下面，双层 trace 就会回来。文件头和 index 注释都留了提示。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 04</div>
      <h3>不加 origin 列，route 前缀就是标记</h3>
      <p>评测路由天然带 /eval，Hono 子应用的 matchedRoutes 也返回全前缀；GET /traces 已支持按 route 过滤。trace 行里的 resource_id/session_id 只在选中的库里可解释，放主库反而会悬空。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 05</div>
      <h3>seed 复制对象，不共享主库 key</h3>
      <p>评测对象住 eval/&lt;sha256&gt;/&lt;原 key&gt;。主库 purge 自己的对象不会把评测的原始件带走；同一内容可重跑，不同内容不撞 data_uri。代价是 MinIO 多一份字节。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 06</div>
      <h3>health 的 eval 组：全绿口径不破例</h3>
      <p>shared 恒 ok；isolated 真 ping。隔离库不可达会让 /health degraded/503——这是显式取舍：健康页要能看见评测库坏了。若只想摆事实，把 ok 改成 true、detail 写 reachable=false。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 07</div>
      <h3>前端只取一次，不做轮询</h3>
      <p>mode 由启动期 env 决定，运行中不会变；进入页面取一次 /eval/status 足够。代价是后端重启切模式后要刷新页面。未知态用红点，不把缺省画成绿。</p>
    </article>
  </div>
  <ul class="pitfall-list">
    <li><strong>本地 .env 已有 EVAL_DATABASE_URL：</strong>当前工作区默认是隔离模式，不是共享。要验共享必须显式 <code>EVAL_DATABASE_URL=</code> 起服务；测试里 <code>eval-route.test.ts</code> 也主动删了这个 env。</li>
    <li><strong>EvalPostgresRepo 不能提前注入：</strong>如果把 <code>container.resolve(EvalPostgresRepo)</code> 放进构造器依赖，shared 模式也会建第二个池，甚至在无 URL 时抛错。必须像 assembly 这样懒解析。</li>
    <li><strong>Hono 注册顺序是位置约束：</strong>入口里 <code>app.route(/eval)</code> 必须早于主壳；子应用里 <code>/status</code> 必须早于 trace 壳。任何一次重排都会让双层 trace 或 status 落 trace 回来。</li>
    <li><strong>seed 的块对齐依赖同一 bytes/parser/chunker：</strong>45/45 篇块内容一致是实测结果，不是自动保证。某篇若用了非默认 chunker，gold 的 chunk_index 会对不上；那时要么按主库原样复制该篇，要么重新出题。</li>
    <li><strong>CREATE DATABASE 有 SQL 边界：</strong>不能进事务、不能参数化；库名必须白名单校验后加双引号。连接串只进子进程 env，不进 argv。</li>
    <li><strong>endpoint.ts 的 /resources 跳过是既有代码（已在 136857e 提交）：</strong>与 3.4 的 ingest trace 口径冲突，但不属于 7.0；本格只加 /eval 的注册顺序，没有动它。去留由 Lynx 定。</li>
    <li><strong>7.0 的新文件还在未提交面：</strong>136857e 里能看到的是 eval-probe / eval-cases 与 Epic 5 尾巴；本页的 eval-db / EvalAssembly / /eval 路由 / setup / seed 是当前工作区的新增，边界按代码而非提交号划。</li>
    <li><strong>共享模式的评测痕迹会进主库：</strong>这是共享的代价，不是 bug；按 route 前缀过滤即可。要彻底不混，就切隔离模式。</li>
    <li><strong>health 的 detail 是字符串数组：</strong>前端 detailList 只认字符串/数组；给对象会渲染空，给数组才能变成 Tag。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">12 · 验证</span>
    <h2>真跑过什么，没跑什么</h2>
    <p class="section-sub">下面数字都是本轮真跑；浏览器视觉/交互仍留给 Lynx。</p>
  </header>
  <div class="test-grid">
    <article class="test-card">
      <h3>后端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npm test</code> → 21 文件 / 124 例全过（含隔离集成与 health 7 条）。覆盖 shared 同一只、status 不落 trace、retrieve 单条 trace、两库 chunks 不相交、health 四服务组与 isolated 失败/可达。</p>
    </article>
    <article class="test-card">
      <h3>前端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npm test</code> → 73 文件 / 639 例全过；<code>npm run build</code> 绿。覆盖 /eval/status 路径/错误码、shared/isolated/未知三态徽标。</p>
    </article>
    <article class="test-card">
      <h3>建库与语料</h3>
      <p><code>ragdb_eval</code> 已建：16 条迁移、14 张表；embeddings 索引名/定义与主库一致。全量 seed：45 篇 → 44 seeded + 1 skipped、0 failed；评测库 45 ready / 949 chunks / 949 embeddings；45/45 篇块数与块内容 hash 与主库完全一致；45 条 data_uri 全带 <code>eval/</code> 前缀。</p>
    </article>
    <article class="test-card">
      <h3>两种模式 live</h3>
      <p>shared：status 45 ready、/eval/retrieve 命中主库、<code>POST /eval/retrieve</code> trace 恰好 1 条、<code>GET /eval/status</code> 0 条。isolated：status 45、eval 命中 chunk 在主库查不到、主命中在评测库查不到、评测库 trace 1 条、pg_stat_activity 同时见两个池；<code>/health</code> 两模式都是 4 服务、eval detail 正确。</p>
    </article>
    <article class="test-card">
      <h3>未由 agent 代测</h3>
      <p>浏览器视觉未由 agent 代测：三视图页头徽标、窄屏、健康页第 4 张卡、后端停掉时的“未知”态；Lynx 2026-10-28 判定 7.0 完成，这些手测项保留为验收记录，不宣称 agent 跑过。隔离库“真 down”只由单元测试的假 probe 覆盖，没有停远端库真断。</p>
    </article>
  </div>
  <p class="test-note">复现命令（URL 用占位符，别把带凭据的连接串贴进终端历史）：</p>
  <pre class="snippet">cd app/server
npx tsc --noEmit
npm test

# 隔离模式（一次性）
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run eval:db:setup
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run eval:seed -- --limit 1
EVAL_DATABASE_URL='postgres://.../ragdb_eval' npm run eval:seed

# 起服务并验
EVAL_DATABASE_URL='postgres://.../ragdb_eval' PORT=3101 npx tsx --env-file=.env src/index.ts
curl -s localhost:3101/eval/status
curl -s -X POST localhost:3101/eval/retrieve -H 'content-type: application/json' -d '{"query":"BM25 的词法查询必须走什么函数？"}'
curl -s localhost:3101/health

cd ../web
npx tsc --noEmit
npm test
npm run build</pre>
  <pre class="snippet">-- 两边计数（分别连 ragdb 与 ragdb_eval）
select count(*) from resources where status='ready' and deleted_at is null; -- 45
select count(*) from chunks;        -- 949
select count(*) from embeddings;    -- 949

-- 评测 trace 只在选中库
select route, count(*) from traces where route like '%/eval/%' group by route;

-- 评测对象住 eval/ 前缀
select count(*) from resources where data_uri like 'kc://oss/minio/%/eval/%'; -- 45</pre>
  <div class="callout"><strong>浏览器手测清单：</strong>① 三个评测页页头显示共享主库/隔离库；② 窄屏徽标 + 运行按钮不挤；③ 后端停止时显示“评测状态未知”；④ 健康页出现 eval 卡，shared 显示 mode=shared，isolated 显示 mode=isolated/reachable。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">13 · 衔接</span>
    <h2>这一格交什么给 7.1</h2>
    <p class="section-sub">7.0 只交“选库与语料”；题集、运行、对照、答案评测都还在后面。</p>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 5.x / 3.x：</strong>5.1–5.4 交了 MinIO、归档/ingest/回收站/重入库与代码库；3.x 交了 traces/trace_stages 和端点壳；2.x 交了混合检索。7.0 没有改这些链路，只把“哪套库”抽成装配选择。<br><strong>下一格 · 7.1：</strong>加 eval_datasets / eval_cases / eval_run_configs / eval_metric_configs 四张表与面板 CRUD。表随同一套迁移走：shared 在主库，isolated 在评测库；eval 域 repo 必须从 EvalAssembly 拿选中的库，不能自己直连。<br><strong>7.2：</strong>发起检索评测，复用同一只检索实现；但 run 的 k/topK/minSimilarity 需要参数化，当前 Retriever 还读 AppConfig。7.3 做基线与并排；7.4 才做答案评测、judge、HITL 与隔离会话。</p>
    <div class="next-links">
      <a href="./epic5-story2-archive-ingest.html">Story 5.2 · 归档 + 两段式</a>
      <a href="./epic5-story3-dedup-recycle-reingest.html">Story 5.3 · 去重 / 回收 / 重入库</a>
      <a href="./epic3-story3-retrieve-stages.html">Story 3.3 · retrieve stages</a>
      <a href="./epic3-story4-ingest-stages.html">Story 3.4 · ingest stages</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>7.1 不要绕过 EvalAssembly 直连：</strong>eval 域表在 shared/isolated 下住不同库；从 assembly 拿 repo 是唯一正确入口。</li>
    <li><strong>7.2 的 run 配置还没参数化：</strong>当前 <code>RetrieverHandle</code> 的旋钮来自 AppConfig；run 快照要生效，需要把 config 来源改成 run 的只读配置。</li>
    <li><strong>当前工作区默认 isolated：</strong>.env 有 URL；共享模式要显式空值。切模式后页面需刷新，徽标不做轮询。</li>
    <li><strong>deferred 仍住原位：</strong>多知识库 / namespace → P3 之后；评测库独立备份 → 未排期；7.4 的 OQ-7.4-1…5 仍未收口。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 7.0 · 评测连接（默认主库，可选隔离库）· 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic7-story0/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：done（Lynx 2026-10-28 判定）。浏览器手测项保留为验收记录；题集/运行/对照/答案评测从 7.1 开始。</p>
</footer>`,
    },
  ],
}
