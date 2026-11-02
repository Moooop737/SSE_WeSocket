export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic7-story1-eval-datasets.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 7 · Story 7.1 题集与配置底座 · 四张表、一张 jsonb、两页真接口 · 带代码逐行讲解',
  tocTitle: 'Story 7.1',
  tocSub: '题集与配置底座 · 带代码逐行讲解',
  accent: '#4f46e5',
  accent2: '#0f766e',
  accentDark: '#a5b4fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 7 · STORY 7.1</span><span>EVAL DATASETS · CONFIGS · SEED</span></div>
  <h1>题集和配置，<em>先落成能查的表</em></h1>
  <p class="hero-sub">7.1 不加新检索能力，只把“评什么”和“用哪套参数”变成库里的数据：三张表（datasets / cases / configs）+ 一张 runs 骨架；运行配置与测评配置合成一张 <code>eval_configs</code>，配置体只放一个 <code>config</code> jsonb，按 <code>kind</code> 区分。题集页与配置页从 mock 换成真接口，15 条探底题按块级 gold 导入。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>135 / 135</span>
    <span class="chip"><strong>前端</strong>674 / 675</span>
    <span class="chip"><strong>真跑</strong>15 题 · 18 gold</span>
    <span class="chip"><strong>状态</strong>review · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 24 files / 135</b> · <b>frontend 674/675</b> · <b>build green</b> · <b>isolated import 15/15</b> · <b>shared import verified</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格只做“底座”，不发起运行</h2>
    <p class="section-sub">7.1 的成果是一套可维护的题集与配置，加上把它们装进选中评测库的导入链路。运行、指标、基线、答案评测都还在后面。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / FOUR TABLES</div>
      <h3>三张业务表 + runs 骨架</h3>
      <p><code>eval_datasets</code> / <code>eval_cases</code> / <code>eval_configs</code>，外加一张只含 id / dataset_id / status / created_at 的 <code>eval_runs</code> —— 它只为“数据集跑过 run 就不能删”和 <code>baseline_run_id</code> 指向服务，快照与结果列留到 7.2 同表 ALTER。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / ONE JSONB</div>
      <h3>配置只有一个 jsonb</h3>
      <p>运行配置与测评配置同住 <code>eval_configs</code>：<code>kind='run'</code> 存 <code>{model,k,temperature,rrf,vector_top_k,lexical_top_k,min_similarity}</code>，<code>kind='metric'</code> 存 <code>{judge_model,rubric,metrics}</code>。DB 只保「kind 合法、name 非空、config 是对象」，数值范围与模型在册由 API 校验。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / CHUNK GOLD</div>
      <h3>gold 定位到块</h3>
      <p><code>eval_cases.gold</code> 是 <code>[{ data_uri, chunk_index, content_prefix }]</code>：用可读路径 + 块号定位，不存随机 chunk uuid；<code>content_prefix</code> 取块正文 trim 后前 80 字，7.2 用它验证“这块还是不是原来那块”。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">04 / TWO REAL PAGES</div>
      <h3>题集页与配置页接真数据</h3>
      <p><code>/evals-cases</code> 与 <code>/evals-configs</code> 的新建/编辑/复制/删除都落库；model 下拉改读 <code>/models</code>。运行页 <code>/evals</code> 仍是 mock，7.2/7.3 再接。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 7.1：</strong>发起 run、队列、快照、recall/MRR（7.2）；基线与并排对照（7.3）；judge / HITL / 答案评测（7.4）；gold 的前端挑选与编辑（第二版）；JSON 导出（未排期）；配置删除的 run 用量保护（等 7.2 有真 run）。<br><strong>7.0 的既有件：</strong><code>EvalAssembly</code>、<code>EvalDbHandle</code>、<code>/eval/status</code>、<code>POST /eval/retrieve</code> 都是上一格交付，本页只标 <span class="badge b-pre">7.0</span>。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>db/migrations/20261028120000_create_eval_tables.sql</code></td><td>四张表、约束、索引、down</td></tr>
      <tr><td><code>src/adapter/repo/eval.ts</code></td><td>数据集 / case / 配置的行操作、深拷贝、自动键、upsert</td></tr>
      <tr><td><code>src/adapter/contract.ts</code></td><td>Repo 的 eval 段与 PostgresRepo 委托；EvalPostgresRepo 自动继承</td></tr>
      <tr><td><code>src/adapter/repo/resource.ts</code> · <code>chunk.ts</code></td><td>按 URI 后缀找 ready 资源、按块号取正文</td></tr>
      <tr><td><code>src/routes/eval.ts</code></td><td>datasets / cases / configs 自定义路由与校验</td></tr>
      <tr><td><code>src/eval/cases.ts</code></td><td>题集导入：路径解析成 gold、按 case_key upsert</td></tr>
      <tr><td><code>scripts/eval-cases-import.ts</code> · <code>eval-cases.json</code></td><td>CLI 入口；15 条题集的块级标注</td></tr>
      <tr><td><code>drizzle.config.ts</code> · <code>scripts/db-schema.mjs</code></td><td>新表进入 schema 生成白名单；空串默认值归一化</td></tr>
      <tr><td><code>app/web/src/api/client.ts</code></td><td>eval 数据集 / case / 配置的类型与 14 个请求函数</td></tr>
      <tr><td><code>app/web/src/components/evals/cases-view.tsx</code></td><td>题集三栏：数据集 / case 表 / 定义</td></tr>
      <tr><td><code>app/web/src/components/evals/configs-view.tsx</code></td><td>配置三栏：两类清单 / 字段 / 用量空态</td></tr>
      <tr><td><code>app/web/src/components/evals/eval-mode-badge.tsx</code></td><td>徽标抽公共件，三页共用</td></tr>
      <tr><td><code>app/web/src/components/evals/evals-page.tsx</code> · <code>lib/evals-store.ts</code></td><td>运行页收缩为 mock 运行视图；mock 状态只留 runs</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里 <span class="badge b-app">7.1</span> 是本格新增；<span class="badge b-pre">7.0</span> 是上一格的既有件；<span class="badge b-pre">前置</span> 是复用的上下文。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 数据形状地图</span>
    <h2>四张表，两条关联线</h2>
    <p class="section-sub">评测域很薄：数据集装 case，run 指向数据集；配置独立成表，由 run 在 7.2 引用（现在还没有 run 行）。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>eval_datasets</h3>
      <ul class="flow-list">
        <li><span>name</span><code>唯一 · 非空</code></li>
        <li><span>note</span><code>这批题是什么</code></li>
        <li><span>baseline_run_id</span><code>可空 uuid · 不加外键</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>eval_cases</h3>
      <ul class="flow-list">
        <li><span>(dataset_id, case_key)</span><code>唯一</code></li>
        <li><span>gold</span><code>jsonb 数组</code></li>
        <li><span>negative</span><code>true 时 gold 必须空</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>eval_configs</h3>
      <ul class="flow-list">
        <li><span>kind</span><code>run | metric</code></li>
        <li><span>config</span><code>jsonb 对象</code></li>
        <li><span>name</span><code>非空 · 可重名</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>eval_runs（骨架）</h3>
      <ul class="flow-list">
        <li><span>dataset_id</span><code>RESTRICT</code></li>
        <li><span>status</span><code>queued → …</code></li>
        <li><span>7.2</span><code>同表 ALTER 加快照</code></li>
      </ul>
    </article>
  </div>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">WHY RUNS NOW</div>
      <h3>runs 骨架先建</h3>
      <p>AC 要求“数据集跑过 run 就拒删”，而 run 表要到 7.2。先建最小骨架：删除保护用 <code>dataset_id</code> 的 <code>ON DELETE RESTRICT</code> 兜底，路由先数 <code>eval_runs</code> 再给 409；<code>baseline_run_id</code> 也有地方指。7.2 只加列，不改表。</p>
    </article>
    <article class="choice">
      <div class="choice-no">WHY NO BASELINE FK</div>
      <h3>baseline_run_id 不挂外键</h3>
      <p><code>eval_datasets → eval_runs → eval_datasets</code> 是循环外键。drizzle 生成的 schema 会因此出现 TS7022/7024（自引用推断崩）。列保留、归属校验放到 7.3 的“采纳为基线”动作里。</p>
    </article>
  </div>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '四条真实路径',
      subtitle: '点一步跳到代码。',
      steps: [
        { goto: 'cases-load:96-149', title: '新建一条 case', note: '前端先本地挡空 query，再 POST；成功后重拉数据集与 case 表。', code: 'cases-view · L92–139' },
        { goto: 'route-dataset:112-133', title: '删数据集被挡', note: '先数 runs；大于 0 直接 409 并给出次数，不靠外键报错来翻译。', code: 'routes/eval · L111–125' },
        { goto: 'import-core:49-90', title: '导入 15 条题集', note: '路径在选中库解析成 data_uri，块正文取前 80 字当指纹，再 upsert。', code: 'eval/cases · L49–90' },
        { goto: 'configs-load:148-183', title: '保存一份配置', note: '名称与模型先本地挡；配置体按 kind 组装成 snake_case，交给后端再校验数值。', code: 'configs-view · L148–172' },
      ],
    },
    {
      type: 'html',
      html: `
<section class="section" id="glossary">
  <header class="section-head">
    <span class="kicker">03 · 小白词典</span>
    <h2>读代码前先认识六个词</h2>
    <p class="section-sub">都是日常后端概念，但在这格各有具体落点。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card"><div class="summary-no">JSONB</div><h3>能按对象查的 JSON 列</h3><p>Postgres 的二进制 JSON。这里把“整套配置”塞进 <code>config</code>，加参数不用改表；代价是数据库不知道 <code>k</code> 该是正整数。</p></article>
    <article class="summary-card"><div class="summary-no">CHECK</div><h3>行级布尔约束</h3><p><code>CHECK (kind IN ('run','metric'))</code> 这类断言由 DB 兜底；应用层会先校验一遍，给人类可读的 message。</p></article>
    <article class="summary-card"><div class="summary-no">RESTRICT / CASCADE</div><h3>删父行时怎么对待子行</h3><p>runs 用 <code>RESTRICT</code>：有 run 就删不掉数据集。cases 用 <code>CASCADE</code>：删数据集顺手删它的 case。</p></article>
    <article class="summary-card"><div class="summary-no">UPSERT</div><h3>冲突就更新</h3><p><code>INSERT … ON CONFLICT (dataset_id, case_key) DO UPDATE</code>：导入题集可重复跑，同 key 覆盖而不是插入第二份。</p></article>
    <article class="summary-card"><div class="summary-no">content_prefix</div><h3>块内容指纹</h3><p>取块正文 trim 后前 80 字。7.2 跑评测前拿它对比现块：对不上说明资源被改过/重灌过，gold 失效。</p></article>
    <article class="summary-card"><div class="summary-no">迁移</div><h3>dbmate 的 up/down</h3><p>一个 SQL 文件两段：<code>-- migrate:up</code> 建表，<code>-- migrate:down</code> 逆序拆。主库与评测库跑同一套。</p></article>
  </div>
</section>`,
    },
    {
      type: 'code',
      section: {
        id: 'migration',
        kicker: 'DB · 04',
        title: '迁移：四张表与它们的边界',
        subtitle: '约束写在 DDL 里，应用校验负责好看的话术。',
        body: '<div class="callout">迁移只建 7.1 需要的形状。<code>eval_runs</code> 是最小骨架，快照/耗时/错误列全部留给 7.2 用 <code>ALTER TABLE</code> 加；这样 7.2 的 OQ 不会在 7.1 被提前写死。</div>',
        blocks: [
          {
            id: 'migration-sql',
            file: 'db/migrations/20261028120000_create_eval_tables.sql',
            lang: 'sql',
            ranges: [[1, 63]],
            notes: [
              { lines: '3-13', title: '数据集：名字唯一', badge: '7.1', body: '<p><code>name</code> 唯一不是洁癖：导入脚本按名字找数据集，重名会让“灌进哪一个”变成猜。复制时由 repo 自动找空位（副本 / 副本 2）。</p>' },
              { lines: '15-23', title: 'runs 骨架：RESTRICT 就是删除保护', badge: '7.1', body: '<p>四列足够服务两件事：数 run 决定 409、让 <code>baseline_run_id</code> 有指向。<code>OFF DELETE RESTRICT</code> 是最后一道闸，路由会先数再删，给人类可读的「先删掉关联的 N 次运行」。</p>' },
              { lines: '25-42', title: 'case：唯一键与两条 gold 约束', badge: '7.1', body: '<p><code>(dataset_id, case_key)</code> 唯一让导入幂等；<code>jsonb_typeof(gold)=\'array\'</code> 挡「存成对象」；<code>NOT negative OR gold=\'[]\'</code> 把“负例没有 gold”钉在库里。query / level / case_key 的非空也在这一层兜底。</p>' },
              { lines: '44-56', title: 'config：kind + jsonb，只保对象', badge: '7.1', body: '<p>运行配置和测评配置共用一张表，靠 <code>kind</code> 分家。DB 只保证 config 是 jsonb 对象——数值范围、模型在不在册，数据库管不了，也不该管。</p>' },
              { lines: '58-63', title: 'down 的顺序', badge: '前置', body: '<p>先拆 configs/cases，再拆 runs，最后 datasets；反过来会被外键拦住。这里没有 baseline 外键，所以不需要先 DROP CONSTRAINT。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'repo',
        kicker: 'ROW · 05',
        title: 'repo：深拷贝、自动键与 upsert',
        subtitle: '所有写操作都吃当前选中的 pgpool；共享/隔离由装配层决定。',
        body: '<div class="callout">repo 不校验业务规则。它保证单个动作是原子的（复制走事务），并把「找名字空位」「下一个 case_key」这类小算法收在一处，路由与脚本不再各写一份。</div>',
        blocks: [
          {
            id: 'repo-copy',
            file: 'src/adapter/repo/eval.ts',
            ranges: [[151, 247]],
            notes: [
              { lines: '156-183', title: '复制数据集：一个事务里拷完', badge: '7.1', body: '<p>先选原行、找空位名、插新数据集，再用 <code>INSERT … SELECT</code> 把全部 case 一次拷过去。整个过程一个事务：中途失败不会留下“有数据集没 case”的半份。</p>' },
              { lines: '198-218', title: '自动 case_key', badge: '7.1', body: '<p>新建 case 不带 key 时，按档位找第一个没被占的 <code>L2-N1、L2-N2…</code>。秒级单人操作，不做分布式占号；真撞了由唯一约束兜底、路由回 409。</p>' },
              { lines: '236-247', title: 'upsert：导入可重复跑', badge: '7.1', body: '<p><code>ON CONFLICT (dataset_id, case_key) DO UPDATE</code>：15 条题集改了就再导一次，更新 level/query/gold，不产生重复行。这是导入脚本幂等的根。</p>' },
            ],
          },
          {
            id: 'repo-config',
            file: 'src/adapter/repo/eval.ts',
            ranges: [[249, 300]],
            notes: [
              { lines: '249-267', title: '配置按 kind 分组读写', badge: '7.1', body: '<p><code>listConfigs(kind)</code> 只按 kind 过滤；创建时把整个 config 对象 <code>JSON.stringify</code> 后传 <code>::jsonb</code>。kind 在更新里不可改，路由会拒绝带 kind 的 PATCH。</p>' },
              { lines: '283-300', title: '复制配置与名字空位', badge: '7.1', body: '<p>配置名允许重复，但复制仍然找空位，避免面板里出现一列同名项。<code>freeCopyName</code> 先查 <code>name = base OR name LIKE base 副本%</code>，再顺序试 <code>副本</code>、<code>副本 2</code>。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'routes',
        kicker: 'HTTP · 06',
        title: '/eval 路由：把业务话术挡在边界',
        subtitle: '错误码、提示语、校验都在这一层；repo 只负责行。',
        body: '<div class="callout">7.0 的 <code>/status</code> 与 <code>/retrieve</code> 原样保留（<span class="badge b-pre">7.0</span>）。新增的 datasets / cases / configs 路由都注册在 trace 壳之后，所以每次写都会落一条带 <code>/eval</code> 前缀的 trace。</div>',
        blocks: [
          {
            id: 'route-dataset',
            file: 'src/routes/eval.ts',
            ranges: [[69, 145], [160, 175]],
            notes: [
              { lines: '112-133', title: '删数据集：先数再删', badge: '7.1', body: '<p>先 <code>countRunsOfDataset</code>；大于 0 返回 <code>409 E_EVAL_DATASET_HAS_RUNS</code> + <code>runs</code> 数字，message 直接是「先删掉关联的 N 次运行」。页面拿到就能原样展示。</p>' },
              { lines: '136-145', title: '复制永远 201', badge: '7.1', body: '<p>复制不受限（AC 明确）：不查 run、不查名字占用，repo 自动改名。找不到原数据集才 404。</p>' },
              { lines: '160-175', title: '建 case：先校验再写', badge: '7.1', body: '<p>先确认数据集存在，再 <code>parseCaseCreate</code>。gold 形状不对或负例带 gold 都是 400；唯一键冲突用 <code>E_EVAL_CASE_KEY</code> 而不是“名称被占用”。</p>' },
            ],
          },
          {
            id: 'route-valid',
            file: 'src/routes/eval.ts',
            ranges: [[309, 424]],
            notes: [
              { lines: '309-317', title: '唯一键 → 业务码', badge: '7.1', body: '<p>Postgres 的唯一冲突是 <code>23505</code>。这里统一翻成 409，并允许调用方换码：数据集/配置用「名称已被占用」，case 用「case_key 在该数据集已存在」。</p>' },
              { lines: '329-345', title: 'gold 三道闸', badge: '7.1', body: '<p>必须是数组；每项三键类型正确（<code>chunk_index</code> 非负整数）；负例必须空。去空白后重建对象，未知键不落库——gold 的形状在 7.2 是计算输入，不能带脏字段。</p>' },
              { lines: '385-424', title: '配置校验：键、类型、在册', badge: '7.1', body: '<p>先拒绝未知键与缺键（整套预设，不做部分覆盖），再按 kind 查类型与范围。run 的 <code>model</code>、metric 的 <code>judge_model</code> 都要在 <code>ChatHandle.catalog()</code> 的键里；不在册就是 400，message 指向 <code>/models</code>。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'import',
        kicker: 'SEED · 07',
        title: '题集导入：路径解析成块级 gold',
        subtitle: '不猜路径、不猜块；任何不唯一都让那条失败。',
        body: '<div class="callout">15 条题集原本一半只有文档级 <code>path</code>。7.1 逐条补了 <code>chunkIndex</code>（人工核对过含答案的块），导入时再解析成目标库的 <code>data_uri</code>：隔离库的资源带 <code>eval/&lt;hash&gt;/</code> 前缀，所以在哪个库导入，gold 就指向哪个库。</div>',
        blocks: [
          {
            id: 'import-core',
            file: 'src/eval/cases.ts',
            ranges: [[49, 111]],
            notes: [
              { lines: '49-90', title: '逐条导入，单条失败不中止', badge: '7.1', body: '<p>数据集按名字找、没有就建；每条 case 独立 try：负例要求 expect 为空、正例至少要一条。成功的走 <code>upsertCase</code>，失败的记 detail 继续下一条，最后用 failed 数决定退出码。</p>' },
              { lines: '92-110', title: 'resolveGold：两条硬规则', badge: '7.1', body: '<p>① 后缀必须恰好命中 1 条 ready 资源——<code>ARCHITECTURE-SPINE.md</code> 这种会同时命中 legacy 与 planning，直接失败；② 块号必须取到未删块，否则失败。前缀取 <code>trim().slice(0,80)</code>。</p>' },
            ],
          },
          {
            id: 'import-cli',
            file: 'scripts/eval-cases-import.ts',
            ranges: [[19, 32]],
            notes: [
              { lines: '19-32', title: 'CLI 只做入口', badge: '7.1', body: '<p>读 JSON、取 <code>EvalAssembly.repo</code>、打印逐条结果。共享模式写主库，隔离模式写评测库——脚本自己不碰连接串，库的选择完全由装配层决定。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'contract',
        kicker: 'PORT · 08',
        title: 'Repo 门：两套 pgpool 共用一份接口',
        subtitle: 'eval 方法挂进 Repo，隔离模式的 EvalPostgresRepo 自动继承。',
        body: '<div class="callout">7.0 的装配已经定好：共享模式 <code>EvalAssembly.repo</code> 就是主库的 <code>PostgresRepo</code>；隔离模式是继承它的 <code>EvalPostgresRepo</code>。所以 eval 方法必须进 <code>Repo</code> 接口，路由与脚本只认 <code>EvalAssembly.repo</code>，永远不会直连主库。</div>',
        blocks: [
          {
            id: 'contract-eval',
            file: 'src/adapter/contract.ts',
            ranges: [[147, 167]],
            notes: [
              { lines: '147-167', title: '21 个 eval 方法', badge: '7.1', body: '<p>数据集/case/配置三组，加上 <code>countRunsOfDataset</code> 与 <code>nextCaseKey</code>。没有「把 repo 做成多实例容器」的改造：换库靠继承，不靠参数。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'client',
        kicker: 'WEB API · 09',
        title: '前端接口层：字段不改名',
        subtitle: '后端 snake_case 原样穿过 client，界面只负责展示。',
        body: '<div class="callout">eval 的 14 个函数都在这里。错误语义沿用全仓约定：非 2xx 抛 <code>ApiError</code>，页面用 <code>err.message</code> 直接显示服务端话术（409 的「先删掉关联的 N 次运行」就是这样上屏的）。</div>',
        blocks: [
          {
            id: 'client-eval',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            ranges: [[1028, 1110]],
            notes: [
              { lines: '1028-1077', title: '数据集与 case', badge: '7.1', body: '<p>列表函数把缺失的 <code>datasets</code>/<code>cases</code> 兜成空数组，页面不会在 <code>.map</code> 上崩。DELETE 走 <code>requestNoContent</code>（204 没有 body）。</p>' },
              { lines: '1082-1110', title: '配置：kind 走查询串', badge: '7.1', body: '<p><code>listEvalConfigs(kind)</code> 用 <code>?kind=run|metric</code> 分两次拉；写接口的 body 直接带 <code>{kind,name,config}</code>。前端不窄化 config，展示时用 <code>valueText</code> 逐个读键。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'cases-view',
        kicker: 'UI · 10',
        title: '题集页：写一次，重拉两边',
        subtitle: '数据集计数与 case 表是两份数据，任何写操作后都要一起刷新。',
        body: '<div class="callout">页面不做本地乐观更新：写完等接口返回，再重拉数据集（<code>case_count</code> 变了）与当前 case 表。简单、不会出现“表格里有、库里没有”。</div>',
        blocks: [
          {
            id: 'cases-load',
            file: 'app/web/src/components/evals/cases-view.tsx',
            source: 'web:src/components/evals/cases-view.tsx',
            ranges: [[44, 189]],
            notes: [
              { lines: '56-95', title: '两段加载：数据集，再 case', badge: '7.1', body: '<p>先拉数据集并纠正选中项（当前 id 不在了就落回第一条）；<code>datasetId</code> 或 <code>reloadKey</code> 变化再拉 case。<code>alive</code> 标记防切页后 setState。</p>' },
              { lines: '96-149', title: '保存：本地挡空，成功后重拉', badge: '7.1', body: '<p>数据集名称、case query 为空都在本地拦下，不发请求。保存成功后 <code>refreshDatasets</code> + <code>refreshCases</code>；负例强制把 gold 置空，和后端规则一致。</p>' },
              { lines: '150-189', title: '删除与复制：错误原样上屏', badge: '7.1', body: '<p>删除失败（典型是 409 有 run）只做一件事：把 <code>ApiError.message</code> 放进提示条。复制数据集成功后选中副本——用户刚复制的就是它。</p>' },
            ],
          },
          {
            id: 'cases-gold',
            file: 'app/web/src/components/evals/cases-view.tsx',
            source: 'web:src/components/evals/cases-view.tsx',
            ranges: [[310, 365]],
            notes: [
              { lines: '325-331', title: '复制 case 只是模板', badge: '7.1', body: '<p>点“复制”不调后端：用当前 case 的字段打开新建表单（<code>id: null</code>），保存时才 POST。gold 一起预填，表单里只提示“沿用模板的 N 条”，本版不编辑 gold。</p>' },
              { lines: '349-358', title: 'gold 的展示口径', badge: '7.1', body: '<p><code>goldPath</code> 去掉 <code>kc://…/bucket/</code> 与隔离库的 <code>eval/&lt;hash&gt;/</code>，只留可读的尾部路径；块号与前缀各占一行。负例空 gold 显示「库里没有答案」。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'configs-view',
        kicker: 'UI · 11',
        title: '配置页：模型选项来自 /models',
        subtitle: '不再写死四行常量；name 与 config 的组装留在前端。',
        body: '<div class="callout">运行配置与测评配置是同一个表的两种 kind：左栏两组、右栏用量空态。编辑器的配置字段是字符串，保存时按 kind 组装成数字与 null，服务端再做第二遍校验。</div>',
        blocks: [
          {
            id: 'configs-load',
            file: 'app/web/src/components/evals/configs-view.tsx',
            source: 'web:src/components/evals/configs-view.tsx',
            ranges: [[111, 202]],
            notes: [
              { lines: '122-147', title: '配置与模型清单并行拉', badge: '7.1', body: '<p>两组配置用 <code>Promise.all</code>；<code>/models</code> 独立请求、失败只提示不改配置列表。选中项不存在时依次落回 run[0] → metric[0]。</p>' },
              { lines: '148-183', title: '保存前的两道本地闸', badge: '7.1', body: '<p>名称为空、run 未选模型都不发请求。其余交给后端：数值范围与模型在册只在一个地方定义（routes/eval.ts），前端不复制第二套规则。</p>' },
              { lines: '184-202', title: '复制后选中副本', badge: '7.1', body: '<p>复制由后端起名并落库，前端拿到新 id 重拉并选中它——两个 kind 的清单都会刷新，因为 refresh 一次拉两组。</p>' },
            ],
          },
          {
            id: 'configs-editor',
            file: 'app/web/src/components/evals/configs-view.tsx',
            source: 'web:src/components/evals/configs-view.tsx',
            ranges: [[231, 262], [323, 417]],
            notes: [
              { lines: '231-262', title: '模型选项 = /models 的 id + 显示名', badge: '7.1', body: '<p><code>ModelOptions</code> 用 <code>{id}（{provider}）</code> 当显示名；两组 section 共用同一份选项。写死的 <code>MODEL_OPTIONS</code> 已随本格删除。</p>' },
              { lines: '358-366', title: 'run：模型下拉', badge: '7.1', body: '<p>编辑器的 Select 只允许在册键，用户选不出坏值；但后端仍会校验一次——注册表可能在不同进程/时刻变化，前端不是可信边界。</p>' },
              { lines: '392-401', title: 'metric：judge 可为空', badge: '7.1', body: '<p>第一项是空值「不评回答（只算召回）」；此时 metric 配置仍然有效，7.2 看到 <code>judge_model=null</code> 就只算检索指标。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'badge',
        kicker: 'UI · 12',
        title: '徽标抽件：三页各取一次',
        subtitle: '模式是启动期 env 决定的，进页面读一次就够。',
        body: '<div class="callout">7.0 把徽标写在运行页里；本格题集/配置页也换成组件视图，所以把徽标连同取数逻辑抽成公共件，三页各自挂一个。</div>',
        blocks: [
          {
            id: 'badge-file',
            file: 'app/web/src/components/evals/eval-mode-badge.tsx',
            source: 'web:src/components/evals/eval-mode-badge.tsx',
            ranges: [[1, 52]],
            notes: [
              { lines: '19-31', title: '四态不撒谎', badge: '7.1', body: '<p>读失败 → 评测状态未知（红）；加载中 → 检测中（灰）；ping 不通 → 模式名 + 红点；正常 → 模式名 + 绿点，title 里带 ready 篇数。</p>' },
              { lines: '33-52', title: '自己取数、不轮询', badge: '7.1', body: '<p>组件挂载时请求一次 <code>/eval/status</code>；<code>alive</code> 防卸载后 setState。不做全局 store：模式不会在运行期变化。</p>' },
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
    <span class="kicker">13 · 取舍与踩坑</span>
    <h2>拍过板的地方，和踩过的坑</h2>
    <p class="section-sub">这些决定会一直影响 7.2/7.3，别在下一格推翻重来。</p>
  </header>
  <ul class="pitfall-list">
    <li><strong>一张配置表 + kind + jsonb（Lynx 拍板）：</strong>否掉了“运行配置一张表、测评配置一张表、每项一列”。换来的灵活性有代价：DB 不知道 <code>k</code> 该是正整数、<code>min_similarity</code> 该在 0..1 —— 所以校验必须住 API，且只能住一处（<code>parseConfig</code>）。</li>
    <li><strong>循环外键不成立：</strong><code>baseline_run_id</code> 指向 runs，runs 又指向 datasets。drizzle 生成的 schema 出现 TS7022/7024；运行期能跑、tsc 过不了。列保留、不加 FK，7.3 采纳基线时校验 run 属于该数据集。</li>
    <li><strong>drizzle-kit 的空串默认值 bug：</strong><code>text().default('')</code> 被 introspect 成 <code>default(')</code>（未闭合字符串），生成文件直接语法错。修在 <code>scripts/db-schema.mjs</code> 的归一化 + 断言，而不是手改 schema.ts。</li>
    <li><strong>gold 必须块级且可复核：</strong><code>path</code> 后缀可能命中多条资源（legacy 与 planning 的 ARCHITECTURE-SPINE 同名），导入选择“命中必须恰好 1 条”，失败不猜。15 条题集的块号逐条核对过含答案关键词（0.42、stepCountIs、租户…）。</li>
    <li><strong>content_prefix 是软指纹：</strong>80 字 trim 后比较，不是哈希。资源重灌后内容如果只是空白变化，前缀仍可能一致；7.2 的失效判断是“对不上就标 expected_chunk_missing”，不是安全校验。</li>
    <li><strong>运行页仍是 mock：</strong>7.1 只把两个维护页接真；<code>/evals</code> 的运行历史、逐条结果、基线继续读 <code>lib/evals-store</code>（现在只存 runs）。别误以为“题集改了 run 会自动重跑”。</li>
    <li><strong>审查修的三处：</strong>后缀匹配不再用 LIKE（<code>_</code> / <code>%</code> 会被当通配符，实测能把 <code>prd_7a87a934.md</code> 错绑到 <code>prd-7a87a934.md</code>）；API 写入的 gold 统一 trim 且前缀截 80 字；配置数值加上界（k / topK / rrf ≤ 1000、temperature ≤ 2），避免 7.2 拿到离谱值。</li>
    <li><strong>前端 live region 守卫：</strong>不要给条件渲染的提示条加 <code>role="alert"</code>——仓库的 <code>repo-guard.test.ts</code> 会拦；提示保持“可见条 + 常驻 sr-only role=status”的既有形状。</li>
    <li><strong>切换数据库要重新导入：</strong>gold 的 <code>data_uri</code> 是目标库里解析出来的；共享模式写主库 uri，隔离模式带 <code>eval/&lt;hash&gt;/</code> 前缀。换模式后题集必须在该模式再导一次，否则 gold 指不到本库的块。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">14 · 验证命令</span>
    <h2>哪些真跑过，哪些只是代码路径</h2>
    <p class="section-sub">下面标「真跑」的输出来自 2026-10-29 的本地验收；浏览器视觉仍归 Lynx。</p>
  </header>
  <div class="callout"><strong>真跑过：</strong>
  <pre>cd app/server
npm run eval:cases:import        # I_EVAL_CASES_DONE dataset=probe-2026-10-28 upserted=15 failed=0
npx tsc --noEmit                 # 0 错
npm test                         # 24 files / 135 tests passed
PORT=3101 npm run start          # 隔离模式
curl -s localhost:3101/eval/datasets | jq '.datasets[0]'
# { name: "probe-2026-10-28", case_count: 15 }
curl -s -X DELETE localhost:3101/eval/datasets/&lt;有 run 的 id&gt;
# 409 { code: "E_EVAL_DATASET_HAS_RUNS", message: "先删掉关联的 1 次运行", runs: 1 }
cd app/web
npm test                         # 674 passed / 675（1 条 /ask 守卫因并发会话暂红）
npm run build                    # green</pre>
  <strong>代码路径存在、未逐条真跑：</strong>配置编辑保存后的历史 run 不变（7.2 才有 run）；配置删除的 run 用量保护（同上）；gold 的 7.2 失效校验。</div>
  <div class="callout"><strong>浏览器手测清单（Lynx）：</strong>① /evals-cases 左中右三栏与真数据；② 新建/编辑/删除 case；③ 复制 case 只开表单；④ 删除有 run 的数据集显示 409 文案；⑤ /evals-configs 两组配置、模型下拉来自 /models、编辑保存后字段刷新；⑥ 窄屏下三栏折叠；⑦ 后端停掉时徽标显示“评测状态未知”。</div>
  <table class="file-table">
    <thead><tr><th>测试</th><th>钉什么</th></tr></thead>
    <tbody>
      <tr><td><code>test/eval-repo.test.ts</code></td><td>数据集 CRUD、case 自动键/更新/upsert、深拷贝、配置复制命名</td></tr>
      <tr><td><code>test/eval-crud-route.test.ts</code></td><td>409 删除保护、名称/模型/键校验、复制命名与计数</td></tr>
      <tr><td><code>test/eval-cases-import.test.ts</code></td><td>gold 的 uri/块号/前缀、路径歧义与缺失、重跑幂等</td></tr>
      <tr><td><code>web cases-view.test.tsx</code></td><td>初始拉取、POST 形状、409 文案、复制不发请求</td></tr>
      <tr><td><code>web configs-view.test.tsx</code></td><td>kind 分组、/models 选项、空名不发请求、400 文案、复制</td></tr>
    </tbody>
  </table>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">15 · 衔接</span>
    <h2>这一格交什么给 7.2</h2>
    <p class="section-sub">7.2 不再建题集/配置表；它读这里的数据，并把图跑起来。</p>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 7.0：</strong>交了共享/隔离两套世界与 <code>/eval/status</code>、<code>/eval/retrieve</code>；本格把表放进这套世界，所有读写都经 <code>EvalAssembly.repo</code>。<br><strong>下一格 · 7.2：</strong>在 <code>eval_runs</code> 上 ALTER 加快照与结果列；用这里的数据集 × 配置发起 run；<code>content_prefix</code> 用来判断 gold 是否失效；配置的 <code>k/min_similarity</code> 要真正喂给检索，当前 Retriever 还读 AppConfig，需要把来源改成 run 快照。<br><strong>7.3：</strong>baseline_run_id 真正写值（按数据集唯一、显式采纳），对照只摆数字。<br><strong>7.4：</strong>judge 模型与 rubric 从 metric 配置来；断言与 HITL 才进 case 结构。</p>
    <div class="next-links">
      <a href="./epic7-story0-eval-connection.html">Story 7.0 · 评测连接</a>
      <a href="./epic5-story3-dedup-recycle-reingest.html">Story 5.3 · 去重 / 回收 / 重入库</a>
      <a href="./epic3-story3-retrieve-stages.html">Story 3.3 · retrieve stages</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>7.2 别另写检索：</strong>run 必须复用 <code>RetrieverHandle.retriever.search</code>，与 <code>/retrieve</code> 同一只；否则评测数字和产品行为脱节。</li>
    <li><strong>run 快照要冻结：</strong>题集与配置是“滚动更新”的；历史 run 只能读自己那份快照，不能 join 回当前表。</li>
    <li><strong>队列不持久化（OQ-7.2-4）：</strong>重启丢排队中的 run，标 cancelled；已完成的判分不动。</li>
    <li><strong>gold 的 data_uri 与库绑定：</strong>共享/隔离切换后，题集要在目标库重新导入；否则 7.2 的失效校验会整片报缺失。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 7.1 · 题集与配置底座 · 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic7-story1/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：review（实现与验收完成，等待 Lynx 浏览器验收与收口判定）。7.2 从 eval_runs 的快照列开始。</p>
</footer>`,
    },
  ],
}
