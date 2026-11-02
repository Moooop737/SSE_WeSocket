export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic7-story2-eval-runs.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 7 · Story 7.2 发起检索评测 · 快照、队列、逐条结果 · 带代码逐行讲解',
  tocTitle: 'Story 7.2',
  tocSub: '检索评测运行 · 带代码逐行讲解',
  accent: '#4f46e5',
  accent2: '#0f766e',
  accentDark: '#a5b4fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 7 · STORY 7.2</span><span>RUN · SNAPSHOT · QUEUE · SCORES</span></div>
  <h1>点一下运行，<em>把题集跑成数字</em></h1>
  <p class="hero-sub">7.2 把 7.1 的题集与配置接上执行：POST 时冻结快照，进程内单队列串行跑完 15 条 case，每条先校验 gold 前缀再走同一只 retriever，结果逐条写进 <code>eval_runs.results</code> jsonb。中断的 run 在重启后自动标 cancelled；运行页换掉 mock，轮询、取消、逐条结果与快照另存全部接真。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>154 / 154</span>
    <span class="chip"><strong>前端</strong>723 / 723</span>
    <span class="chip"><strong>真跑</strong>15 条 · 18.2s</span>
    <span class="chip"><strong>状态</strong>review · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 28 files / 154</b> · <b>frontend 85 files / 723</b> · <b>build green</b> · <b>real run 75.6% recall</b> · <b>cancel + restart + delete live</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格只做「跑起来」，不做对照与判答</h2>
    <p class="section-sub">7.2 的成果是一条可复现的执行链：数据集 × 运行配置 × 测评配置 → 一条 run → 逐条 recall/MRR。基线与答案评测还在后面。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / SNAPSHOT</div>
      <h3>POST 时冻结输入</h3>
      <p>题集逐条（含 gold）、两份配置、embedding 模型/维度、语料计数一次复制进 <code>snapshot jsonb</code>。之后改题集或配置，历史 run 的含义不变。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / QUEUE</div>
      <h3>进程内单队列</h3>
      <p>一次只跑一个 run，后来的排队；排队中可直接取消，运行中在 case 之间中止（检索本身没有 signal）。队列不持久化，重启由启动清扫把 queued/running 标 cancelled。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / RESULTS</div>
      <h3>逐条写进 jsonb</h3>
      <p>每条结果 <code>{case_key, rank, matched, total, hit_count, recall, mrr, missing_gold, duration_ms, error}</code> 追加进 <code>results</code>；聚合读取时算，不落第二份。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">04 / SAME RETRIEVER</div>
      <h3>复用生产检索</h3>
      <p>不另写检索：给 <code>SearchOptions</code> 加四个覆盖位，run 用快照参数调同一只 <code>RetrieverHandle.retriever</code>；<code>/retrieve</code> 不传即保持原行为。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 7.2：</strong>基线采纳与并排对照（7.3）、judge / HITL / 答案评测（7.4）、自动回归与 CI 门禁（后续）、vector-only / lexical-only 对比（未排期）、运行删除的 UI（按 Lynx 拍板只做后端端点，入口留 7.3）、跨 run 趋势（未排期）。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>db/migrations/20261029120000_add_eval_run_execution.sql</code></td><td>eval_runs 加 8 列（快照/结果/时间/耗时/错误）</td></tr>
      <tr><td><code>src/adapter/repo/eval-run.ts</code></td><td>建/读/列表/追加结果/状态流转/取消/删除/取块</td></tr>
      <tr><td><code>src/eval/runner.ts</code></td><td>单队列执行器：gold 校验 → 检索 → 判分 → 追加</td></tr>
      <tr><td><code>src/eval/metrics.ts</code></td><td>recall / MRR / 聚合的纯函数</td></tr>
      <tr><td><code>src/eval/snapshot.ts</code></td><td>冻结输入（深拷贝式映射）</td></tr>
      <tr><td><code>src/retrieve/contracts.ts</code> · <code>retrievers.ts</code></td><td>SearchOptions 覆盖位；向/词/融合按调用取值</td></tr>
      <tr><td><code>src/routes/eval.ts</code></td><td>POST/GET/cancel/DELETE <code>/eval/runs</code></td></tr>
      <tr><td><code>src/index.ts</code></td><td>启动清扫中断 run</td></tr>
      <tr><td><code>app/web/src/api/client.ts</code></td><td>运行类型与 4 个请求函数</td></tr>
      <tr><td><code>app/web/src/components/evals/evals-page.tsx</code></td><td>运行页：发起、轮询、逐条、取消、详情/快照/另存</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里 <span class="badge b-app">7.2</span> 是本格新增；<span class="badge b-pre">7.1</span> / <span class="badge b-pre">前置</span> 是复用与上下文。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 状态与数据形状</span>
    <h2>一行 run 的五个状态、两个 jsonb</h2>
    <p class="section-sub">snapshot 是输入，results 是输出；两者都不与外部表 join，历史完全自足。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>状态机</h3>
      <ul class="flow-list">
        <li><span>创建</span><code>queued</code></li>
        <li><span>执行</span><code>running</code></li>
        <li><span>结束</span><code>done / failed</code></li>
        <li><span>取消 / 重启</span><code>cancelled</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>snapshot（输入）</h3>
      <ul class="flow-list">
        <li><span>cases</span><code>逐条 + gold</code></li>
        <li><span>configs</span><code>run / metric</code></li>
        <li><span>embedding</span><code>model / dim</code></li>
        <li><span>corpus</span><code>ready / total</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>results（输出）</h3>
      <ul class="flow-list">
        <li><span>rank</span><code>最佳名次</code></li>
        <li><span>matched / total</span><code>gold 覆盖</code></li>
        <li><span>hit_count</span><code>负例看命中</code></li>
        <li><span>missing_gold</span><code>前缀失效</code></li>
      </ul>
    </article>
  </div>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">WHY JSONB</div>
      <h3>结果不建明细表</h3>
      <p>读法永远是「打开一次 run，把整份结果拿来看」；15 条规模下，SQL 聚合与 join 换不来什么。jsonb 让一行 run 自带完整历史，删 run 就是删一行。以后真要做跨 run 趋势/筛选再迁移。</p>
    </article>
    <article class="choice">
      <div class="choice-no">WHY OVERRIDES</div>
      <h3>参数不另造 retriever</h3>
      <p>检索工厂把阈值/RRF-k 存在构造期；要让每个 run 用自己的参数，可以每 run 造一个带假 AppConfig 的实例，也可以让 search 吃覆盖位。选后者：仍是一只实例，<code>/retrieve</code> 与 run 同源。</p>
    </article>
  </div>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一次运行的四个瞬间',
      subtitle: '点一步跳到代码。',
      steps: [
        { goto: 'run-repo-file:93-128', title: '冻快照，建 queued', note: '题集/配置/embedding/语料一次复制，INSERT 后返回整行。', code: 'eval-run · L93–128' },
        { goto: 'runner-file:93-130', title: '执行：逐条向后写', note: 'startRun → 每个 case 判分 → appendRunResult；结束落 done/cancelled/failed。', code: 'runner · L93–130' },
        { goto: 'runner-file:131-178', title: '单条 case 的判分', note: '先校验 gold 前缀，再检索；错误只污染这一行，不打断整批。', code: 'runner · L131–178' },
        { goto: 'page-data:162-171', title: '页面轮询', note: '有 queued/running 才每 1.5s 重拉；全部结束自动停。', code: 'evals-page · L162–171' },
      ],
    },
    {
      type: 'html',
      html: `
<section class="section" id="glossary">
  <header class="section-head">
    <span class="kicker">03 · 小白词典</span>
    <h2>读代码前先认识六个词</h2>
    <p class="section-sub">都是这套执行链的关键名词。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card"><div class="summary-no">SNAPSHOT</div><h3>只读副本</h3><p>不是指针，是当时内容的复制。历史 run 读 snapshot，不回头 join 当前题集/配置表。</p></article>
    <article class="summary-card"><div class="summary-no">QUEUE</div><h3>进程内队列</h3><p>一个数组 + 一个 active 标记；重启就丢，所以启动时要把遗留的 queued/running 标成 cancelled。</p></article>
    <article class="summary-card"><div class="summary-no">RRF</div><h3>名次融合</h3><p>Retrieval 的 vector 与 BM25 两路按名次相加；run 配置里的 <code>rrf</code> 就是公式里的 k。</p></article>
    <article class="summary-card"><div class="summary-no">recall@k</div><h3>gold 覆盖率</h3><p>命中的 gold 数 / gold 总数；部分命中算部分，不判失败。</p></article>
    <article class="summary-card"><div class="summary-no">MRR</div><h3>名次倒数</h3><p>最佳命中名次的倒数（1/rank）；没命中记 0。</p></article>
    <article class="summary-card"><div class="summary-no">hit_count</div><h3>负例的命中条数</h3><p>负例没有 gold，用原样命中数判断“是不是拒答成功”；0 条才算通过。</p></article>
  </div>
</section>`,
    },
    {
      type: 'code',
      section: {
        id: 'migration',
        kicker: 'DB · 04',
        title: '迁移：把 run 变成完整历史',
        subtitle: '输入与输出都挂在一行上。',
        body: '<div class="callout">配置 id 用 <code>ON DELETE SET NULL</code>：配置被删了，历史 run 仍靠 snapshot 里的名字和参数展示。检查约束只保类型（snapshot 是对象、results 是数组、耗时非负）。</div>',
        blocks: [
          {
            id: 'migration-sql',
            file: 'db/migrations/20261029120000_add_eval_run_execution.sql',
            lang: 'sql',
            ranges: [[1, 29]],
            notes: [
              { lines: '3-14', title: '8 列：输入、输出、时间线', badge: '7.2', body: '<p><code>snapshot</code> / <code>results</code> 都是 jsonb；<code>run_config_id</code> / <code>metric_config_id</code> 只作指针，配置删除后置空。三条 CHECK 只防形状错误，不替代 API 校验。</p>' },
              { lines: '16-29', title: 'down 逆序拆', badge: '前置', body: '<p>先拆约束再拆列；没有外键要单独 drop，因为配置外键随列一起走。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'run-repo',
        kicker: 'ROW · 05',
        title: 'repo：追加结果与状态流转',
        subtitle: '每条结果一次 UPDATE，不做读改写。',
        body: '<div class="callout"><code>results = results || $2::jsonb</code> 是数组追加；单 runner 串行写，不需要锁。删除 run 放在事务里，顺手清掉数据集的 <code>baseline_run_id</code>。</div>',
        blocks: [
          {
            id: 'run-repo-file',
            file: 'src/adapter/repo/eval-run.ts',
            ranges: [[93, 202]],
            notes: [
              { lines: '93-128', title: '建 run / 读 / 列表 / 追加', badge: '7.2', body: '<p>创建时把 snapshot 序列化进 jsonb；列表按 dataset 过滤、时间倒序；追加只写一行结果，返回是否命中行。</p>' },
              { lines: '129-171', title: '状态只走单向门', badge: '7.2', body: '<p><code>startRun</code> 只接 queued；<code>finishRun</code> 落 done/failed/cancelled；<code>cancelQueuedRun</code> 只接 queued；<code>markInterruptedRuns</code> 全局把遗留的 queued/running 标 cancelled（重启清扫）。</p>' },
              { lines: '173-202', title: '删除与按 data_uri 取块', badge: '7.2', body: '<p>删除在事务里先清 baseline 再删行；<code>getChunkByDataUri</code> join resources 只看未删块，供 gold 前缀校验。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'retriever',
        kicker: 'RETRIEVE · 06',
        title: '检索覆盖位：一只实例，按调用取值',
        subtitle: 'run 的参数从 snapshot 来，/retrieve 继续用配置缺省。',
        body: '<div class="callout">覆盖位只是“可选参数”，没有第二套检索实现；参数缺省时行为与 7.1 之前完全一致（retrieve-chain 回归 5/5）。</div>',
        blocks: [
          {
            id: 'contracts-options',
            file: 'src/retrieve/contracts.ts',
            ranges: [[64, 78]],
            notes: [
              { lines: '69-76', title: 'SearchOptions 四个旋钮', badge: '7.2', body: '<p><code>vectorTopK / lexicalTopK / minSimilarity / rrfK</code> 都是可选；k 仍用已有的 <code>limit</code>（融合后条数）。</p>' },
            ],
          },
          {
            id: 'retrievers-use',
            file: 'src/retrieve/retrievers.ts',
            ranges: [[90, 140]],
            notes: [
              { lines: '98-112', title: '先解出四个值，再交给 stage', badge: '7.2', body: '<p>缺省回落 <code>Deps.config</code>；stage input 里记的是本次真正用的 top_k/阈值，便于观测核对。向量 searcher 的阈值改成按调用传入，不再只在构造期固定。</p>' },
              { lines: '123-138', title: '词路与融合同样按调用', badge: '7.2', body: '<p>BM25 用 LexicalTopK；RRF 用 RrfK，limit 仍是 <code>Options.limit</code>。这就是 run 的 <code>k</code> 与 <code>rrf</code> 生效的位置。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'metrics',
        kicker: 'SCORE · 07',
        title: '判分口径：纯函数',
        subtitle: '正例看 gold 覆盖，负例看命中数，聚合从明细算。',
        body: '<div class="callout">重复 gold 先去重；<code>rank</code> 取所有命中里最好的名次；负例 0 命中给 1/1，命中任意一条给 0/0。</div>',
        blocks: [
          {
            id: 'metrics-file',
            file: 'src/eval/metrics.ts',
            ranges: [[50, 96]],
            notes: [
              { lines: '50-81', title: '单条：rank / matched / recall / mrr', badge: '7.2', body: '<p>命中表先建「key → 首次名次」；gold 逐条查表。缺的 gold 仍计入 total，所以只命中一半就是 50%。</p>' },
              { lines: '83-96', title: '聚合：平均与失败数', badge: '7.2', body: '<p>失败 = recall 小于等于 0；耗时是逐条相加；空明细全 0。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'runner',
        kicker: 'RUN · 08',
        title: '执行器：队列、快照参数、逐条落库',
        subtitle: '一次一个；取消在 case 之间生效。',
        body: '<div class="callout">执行器只认 <code>run.snapshot</code>；检索走注入的 retriever，不读 AppConfig。每个 case 独立 try：单条失败记该行，run 仍能 done。</div>',
        blocks: [
          {
            id: 'runner-file',
            file: 'src/eval/runner.ts',
            ranges: [[38, 199]],
            notes: [
              { lines: '50-69', title: 'enqueue / cancel', badge: '7.2', body: '<p><code>enqueue</code> 返回该 run 的完成 promise（路由不 await，测试可 await）。<code>cancel</code>：active 就是 running（置 aborted）；在队列里就摘掉并直接标 cancelled。</p>' },
              { lines: '70-92', title: 'pump：单队列串行', badge: '7.2', body: '<p>一个 pumping 标记防重入；每个 item 依次 execute；异常兜底 failed，最后 release active 并 resolve 完成 promise。</p>' },
              { lines: '93-130', title: 'execute：start → 逐条 → finish', badge: '7.2', body: '<p>先读 run 与快照参数（不合法直接 failed）；startRun 只接 queued。循环里先看 aborted 再跑下一条；结束时按 aborted 落 cancelled 或 done，耗时是整段墙钟。</p>' },
              { lines: '131-178', title: 'runCase：gold 校验 + 检索 + 判分', badge: '7.2', body: '<p>gold 逐条取块并比对 <code>content_prefix</code>（缺失记 missing_gold，但仍进分母）；检索失败只让这一行 error/0 分，不影响后续 case。</p>' },
              { lines: '180-199', title: 'readKnobs：只认快照里的五个数', badge: '7.2', body: '<p>k / top_k / rrf 必须是正整数，min_similarity 在 0..1；不合法就让 run 直接 failed，不带着脏参数跑。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'routes',
        kicker: 'HTTP · 09',
        title: '/eval/runs：发起、列表、详情、取消、删除',
        subtitle: '列表只返 summary；详情才带 results 与 snapshot。',
        body: '<div class="callout">取消区分 200（排队中已取消）与 202（运行中已按下中止）；删除只接结束态，运行中 409「先中止」。</div>',
        blocks: [
          {
            id: 'routes-runs',
            file: 'src/routes/eval.ts',
            ranges: [[305, 435]],
            notes: [
              { lines: '308-349', title: 'POST：校验 → 快照 → 入队', badge: '7.2', body: '<p>三个 id 必须是 UUID；配置 kind 要对；空数据集 400。快照由 <code>buildSnapshot</code> 一次复制，建 queued run 后 <code>void runner.enqueue</code>，请求不阻塞等跑完。</p>' },
              { lines: '350-373', title: 'GET 列表 / 详情', badge: '7.2', body: '<p>列表项只给 summary、配置名与状态，不带 results/snapshot；详情返回全量 run + summary。</p>' },
              { lines: '374-395', title: 'cancel 的两种成功', badge: '7.2', body: '<p>终态 409；runner 说 queued → 200 cancelled；说 running → 202（等当前 case 结束再落 cancelled）；runner 里找不到但 DB 仍 queued 时兜底直接取消。</p>' },
              { lines: '396-435', title: 'DELETE 与列表映射', badge: '7.2', body: '<p>删除前拒绝 active；删行由 repo 事务清 baseline。列表映射把 snapshot 里的配置名提出来，避免前端再查配置。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'snapshot',
        kicker: 'FREEZE · 10',
        title: '快照组装：复制，不引用',
        subtitle: '一份只读输入，写完就再也回不去。',
        body: '<div class="callout">gold 逐条展开、config 浅拷贝，最终 JSON 序列化进库；调用方（POST）拿到的对象之后再也不改。</div>',
        blocks: [
          {
            id: 'snapshot-file',
            file: 'src/eval/snapshot.ts',
            ranges: [[11, 36]],
            notes: [
              { lines: '20-35', title: '六块字段', badge: '7.2', body: '<p>dataset / cases / run_config / metric_config / embedding / corpus。cases 里连 gold 一起冻结；embedding 来自装配层的同一只句柄，语料计数是 POST 时刻的快照。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'client',
        kicker: 'WEB API · 11',
        title: '前端接口层：四个函数',
        subtitle: '字段保持后端 snake_case。',
        body: '<div class="callout">取消接口的 202 也只解析 JSON；页面拿到 run 后继续轮询，不把“已按下”当成“已结束”。</div>',
        blocks: [
          {
            id: 'client-runs',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            ranges: [[1178, 1200]],
            notes: [
              { lines: '1178-1200', title: 'create / list / fetch / cancel', badge: '7.2', body: '<p>列表函数把缺省 runs 兜成空数组；详情返回 <code>{run, summary}</code>；取消返回 run（可能仍是 running）。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'page',
        kicker: 'UI · 12',
        title: '运行页：数据、轮询与三栏',
        subtitle: '有活跃 run 才轮询；右栏读快照，不读当前配置。',
        body: '<div class="callout">页面不做本地乐观更新：发起/取消后都重拉列表与当前 run；轮询只在存在 queued/running 时开启。</div>',
        blocks: [
          {
            id: 'page-data',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            ranges: [[75, 235]],
            notes: [
              { lines: '94-114', title: '基础数据三路并行', badge: '7.2', body: '<p>数据集、运行配置、测评配置用 <code>allSettled</code>；哪一路失败就提示，不拖累另外两路。选中项不在新列表里就落回第一条。</p>' },
              { lines: '115-161', title: '列表与详情的重拉', badge: '7.2', body: '<p>切数据集先清空 run/详情；<code>runId</code> 变了再拉详情。所有刷新失败都进同一条提示。</p>' },
              { lines: '162-171', title: '轮询：只跟着活跃状态', badge: '7.2', body: '<p><code>active</code> 由列表状态算出；effect 里挂 1.5s interval，active 变 false 自动清理。避免空转，也避免结束后的请求。</p>' },
              { lines: '173-204', title: '发起与取消', badge: '7.2', body: '<p>发起 POST 后选中新 run；取消只表示已按下，随后仍靠轮询把状态收口。</p>' },
              { lines: '205-227', title: '快照另存为配置', badge: '7.2', body: '<p>把 snapshot 里的 config 原样 POST 成新的 run/metric 配置，成功后追加进本地清单并提示。</p>' },
            ],
          },
          {
            id: 'page-render',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            ranges: [[250, 407]],
            notes: [
              { lines: '301-327', title: '逐条行：正例 matched/total、负例命中数', badge: '7.2', body: '<p>行由 snapshot.cases 驱动，再按 case_key 关联 results；还没跑到的行显示占位。错误行只显示「错误」，细节放右栏 title。</p>' },
              { lines: '329-407', title: '右栏三个 tab', badge: '7.2', body: '<p>详情跟随选中 case；对照是 7.3 空态并说明基线有无；快照读 <code>run.snapshot</code>，另存两路。</p>' },
            ],
          },
          {
            id: 'page-right',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            ranges: [[455, 589]],
            notes: [
              { lines: '455-518', title: 'CaseDetail：结果与失效 gold', badge: '7.2', body: '<p>显示 query/note/gold（路径 + 块号 + 前缀）、名次、命中、recall/MRR/耗时；<code>missing_gold</code> 与 case error 单独红/黄提示。</p>' },
              { lines: '530-589', title: 'SnapshotPanel：只读 + 两路另存', badge: '7.2', body: '<p>所有值来自 run.snapshot；两个按钮分别存运行/测评配置。历史 run 展示不依赖配置是否还在。</p>' },
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
    <h2>拍过板的、以及会咬人的</h2>
    <p class="section-sub">这些决定会被 7.3/7.4 直接沿用。</p>
  </header>
  <ul class="pitfall-list">
    <li><strong>结果放 jsonb，不建 eval_run_cases（Lynx 拍板）：</strong>读法永远是整份 run；15 条规模下 SQL 聚合/join 没有收益。代价是跨 run 的趋势/筛选会难受——那属于未排期的趋势图，届时再迁移。</li>
    <li><strong>参数走 SearchOptions，不另造 retriever：</strong>每 run 造一个带假 AppConfig 的实例能少改代码，但会把“当前检索是什么”变成两份真相；覆盖位让 <code>/retrieve</code> 与 run 始终同源。</li>
    <li><strong>队列不持久化，重启靠清扫：</strong>OQ-7.2-4 定的是丢排队、标 cancelled。实测：跑一半杀进程，重启日志 <code>I_EVAL_RUN_CLEANUP</code>，run 变 <code>cancelled / 进程重启</code>，已写的 2 条结果保留。</li>
    <li><strong>中止只发生在 case 之间：</strong>检索没有 signal，硬拆会把「一条 case 跑一半」变成新的状态。取消后的 run 保留已完成行；实测取消 202，最终 cancelled 且 results=1。</li>
    <li><strong>单条错误不打死整批：</strong>某条检索抛错 → 该行 error + 0 分，run 继续；只有快照参数不合法或执行器自身异常才 failed。这是“失败不自动重试、保留原因”的落点。</li>
    <li><strong>删除只做后端（Lynx 拍板）：</strong>运行中 409，结束态才允许；删行事务里清 <code>baseline_run_id</code>。7.1 的「先删 N 次运行」现在有 API 出路，UI 入口留 7.3。</li>
    <li><strong>metric 配置只冻结不执行：</strong>7.2 只算 recall/MRR；judge 属 7.4。model / temperature 对检索评测不生效，只记录在快照里。</li>
    <li><strong>负例要 hit_count：</strong>负例没有 gold，<code>matched/total</code> 是 0/0；没有原始命中数就看不出“拒答成功”还是“碰巧”。本格给结果加了 <code>hit_count</code>。</li>
    <li><strong>全局清扫会碰别人的 run：</strong><code>markInterruptedRuns</code> 按设计扫全库；集成测试里加了「库里活跃 run 不是本用例独占就跳过断言」的守卫，避免误伤。</li>
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
    <p class="section-sub">输出取自 2026-10-29 本地隔离模式；浏览器视觉仍归 Lynx。</p>
  </header>
  <div class="callout"><strong>真跑过：</strong>
  <pre>cd app/server
npx tsc --noEmit                 # 0 错
npm test                         # 28 files / 154 tests passed
PORT=3101 npm run start          # 隔离模式

# 一次完整 run（probe-2026-10-28，15 条）
curl -s -X POST localhost:3101/eval/runs -H 'content-type: application/json' \\
  -d '{"dataset_id":"...","run_config_id":"...","metric_config_id":"..."}'
# 201 queued；18.2s 后 done
# summary: recall 75.56% · MRR 53.45% · failed 3 · duration 17268ms
# 负例 L5-01/02/03 各命中 8 条、recall 0

# 取消运行中
curl -s -X POST localhost:3101/eval/runs/&lt;id&gt;/cancel   # 202 → cancelled，results=1

# 重启清扫：跑一半 kill 进程后重启
# I_EVAL_RUN_CLEANUP 中断的评测运行已标 cancelled：1
# status cancelled · reason 进程重启 · results 2

# 删除守卫
DELETE /eval/datasets/&lt;有 run 的&gt;                 # 409 E_EVAL_DATASET_HAS_RUNS runs=1
DELETE /eval/runs/&lt;id&gt;                            # 204
DELETE /eval/datasets/&lt;id&gt;                        # 204

cd app/web
npm test                         # 85 files / 723 tests passed
npm run build                    # green</pre>
  <strong>代码路径存在、未单独真跑：</strong>failed 终态（检索抛错只影响到 case 行；run 级 failed 需要执行器异常）；同数据集第二次发起的「排队」在页面轮询里可见，但未做长压测。</div>
  <div class="callout"><strong>浏览器手测清单（Lynx）：</strong>① 发起后左栏出现排队/运行中并自动刷新；② 中栏逐条数字随进度出现；③ 取消后状态与按钮变化；④ 右栏详情/快照/另存两路；⑤ 窄屏三栏折叠；⑥ 后端停掉时的错误提示。</div>
  <table class="file-table">
    <thead><tr><th>测试</th><th>钉什么</th></tr></thead>
    <tbody>
      <tr><td><code>test/eval-run-repo.test.ts</code></td><td>快照/结果/状态流转/取消/清扫/删除清 baseline/取块</td></tr>
      <tr><td><code>test/eval-metrics.test.ts</code></td><td>正例覆盖、重复 gold、负例、聚合</td></tr>
      <tr><td><code>test/eval-runner.test.ts</code></td><td>完整 run、gold 失效、case 错误、中止、串行队列与排队取消</td></tr>
      <tr><td><code>test/eval-runs-route.test.ts</code></td><td>快照冻结、列表瘦身、kind/空集校验、取消/删除守卫</td></tr>
      <tr><td><code>web evals-page.test.tsx</code></td><td>列表/逐条、发起、取消、轮询启停、详情/快照/另存</td></tr>
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
    <h2>这一格交什么给 7.3</h2>
    <p class="section-sub">7.3 不用再碰执行链；它只读历史 run，做基线与并排。</p>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 7.1：</strong>交了题集、配置与块级 gold；本格读它们并在 POST 时冻结。<br><strong>下一格 · 7.3：</strong><code>baseline_run_id</code> 真正写值（每数据集一个、显式采纳）；右栏「对照」读两次 run 的 results 按 case_key 并排；测评配置不同要标「判法不一致，分数不可直接比」。运行删除的 UI 入口也在这里补。<br><strong>7.4：</strong>judge / HITL / 答案评测；metric 配置里的 judge 字段才真正生效。</p>
    <div class="next-links">
      <a href="./epic7-story1-eval-datasets.html">Story 7.1 · 题集与配置</a>
      <a href="./epic7-story0-eval-connection.html">Story 7.0 · 评测连接</a>
      <a href="./epic3-story3-retrieve-stages.html">Story 3.3 · retrieve stages</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>7.3 别再读当前表：</strong>对照必须用两次 run 的 snapshot/results；当前题集与配置是滚动更新的。</li>
    <li><strong>基线只有指向、没有外键：</strong>采纳时校验 run 属于同一数据集；删 run 已会清 baseline。</li>
    <li><strong>对照不下判决：</strong>系统只摆两列百分比，变好/退化由人看（Epic 级口径）。</li>
    <li><strong>趋势/筛选是另一件事：</strong>如果真要做跨 run 分析，再评估把 results 迁成表；现在不做。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 7.2 · 发起检索评测 · 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic7-story2/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：review（实现与真跑完成，等待 Lynx 浏览器验收与收口）。7.3 从基线采纳与并排对照开始。</p>
</footer>`,
    },
  ],
}
