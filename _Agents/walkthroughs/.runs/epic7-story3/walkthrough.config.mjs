export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic7-story3-baseline-compare.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 7 · Story 7.3 对照与基线 · 采纳、并排、删除运行 · 带代码逐行讲解',
  tocTitle: 'Story 7.3',
  tocSub: '基线采纳与并排对照 · 带代码逐行讲解',
  accent: '#4f46e5',
  accent2: '#0f766e',
  accentDark: '#a5b4fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 7 · STORY 7.3</span><span>BASELINE · COMPARE · DELETE</span></div>
  <h1>把基线钉在右边，<em>两列数字自己看</em></h1>
  <p class="hero-sub">7.3 给每个数据集一条显式基线：只有 <code>done</code> 的 run 能被采纳；对照 tab 自动把基线拉进来，按当前 run 的快照顺序逐条摆 recall，顶部并排总分，另给「相同条目」平均。系统不算变好/退化，也不出判法一致性提示。顺手补上 7.2 留的运行删除 UI：右栏两步确认，运行中由后端 409 兜底。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>155 tests</span>
    <span class="chip"><strong>前端</strong>727 tests</span>
    <span class="chip"><strong>真跑</strong>200 / 409 / 400</span>
    <span class="chip"><strong>状态</strong>review · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 28 files / 155</b> · <b>frontend 85 files / 727</b> · <b>build green</b> · <b>adopt + delete live</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格只做「钉住基线、并排数字」</h2>
    <p class="section-sub">不替人下结论：不判变好/退化，不画趋势图，也不把两次 run 的差异算成一个新分数。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / BASELINE</div>
      <h3>一个数据集一条基线</h3>
      <p>沿用 7.1 就有的 <code>eval_datasets.baseline_run_id</code>：换基线是显式动作，run 跑完只是候选。列上没有外键，删 run 的事务里顺手把基线清空。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / ADOPT</div>
      <h3>只接 done 的 run</h3>
      <p><code>PUT /eval/datasets/:id/baseline</code>：数据集或 run 不存在 404，run 不属于该数据集 400，非 <code>done</code> 409。部分结果不配当基线。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / COMPARE</div>
      <h3>两列数字，不做判决</h3>
      <p>顶部并排两次 run 的总分；另给「相同条目 · N 条」平均（只算两次 run 都有的 case）。逐条按当前 run 的快照顺序，基线缺的显示 <code>—</code>。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">04 / DELETE</div>
      <h3>运行删除 UI 补齐</h3>
      <p>右栏顶部两步确认（4 秒内再按才真删）；左侧 run 行本身是按钮，不在按钮里嵌按钮。运行中隐藏入口，后端仍 409 兜底。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 7.3：</strong>判法一致性黄条 /「分数不可直接比」提示（Lynx 2026-10-29 改口径，取消）、变好/退化/新增/消失的 diff、趋势图、跨数据集对比（未排期）、gold 的前端挑选与编辑（7.4 / 未排期）、自动回归与 CI 门禁（后续）。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>src/routes/eval.ts</code></td><td><code>PUT /eval/datasets/:id/baseline</code> 与三段校验</td></tr>
      <tr><td><code>src/adapter/repo/eval.ts</code></td><td><code>setDatasetBaseline</code>：只改一列并补 case_count</td></tr>
      <tr><td><code>src/adapter/repo/eval-run.ts</code></td><td>删 run 时清基线（7.2 已有，本格复用）</td></tr>
      <tr><td><code>src/adapter/contract.ts</code></td><td><code>Repo</code> 契约加 <code>setDatasetBaseline</code></td></tr>
      <tr><td><code>app/web/src/api/client.ts</code></td><td><code>setEvalBaseline</code> / <code>deleteEvalRun</code></td></tr>
      <tr><td><code>app/web/src/components/evals/evals-page.tsx</code></td><td>基线加载、采纳、两步删除、对照面板</td></tr>
      <tr><td><code>test/eval-runs-route.test.ts</code> · <code>evals-page.test.tsx</code></td><td>后端守卫与前端定义的自动化证明</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里 <span class="badge b-app">7.3</span> 是本格新增；<span class="badge b-pre">7.2</span> / <span class="badge b-pre">前置</span> 是复用与上下文。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 数据怎么流</span>
    <h2>基线 id 住在数据集行上，对照在浏览器里算</h2>
    <p class="section-sub">后端只负责「哪条 run 是基线」；两次 run 的数字都在各自的 <code>results</code> 里，对照不需要新接口。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>写基线</h3>
      <ul class="flow-list">
        <li><span>入口</span><code>PUT /eval/datasets/:id/baseline</code></li>
        <li><span>守卫</span><code>归属 400 · 非 done 409</code></li>
        <li><span>落库</span><code>baseline_run_id</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>读对照</h3>
      <ul class="flow-list">
        <li><span>基线</span><code>GET /eval/runs/:baselineId</code></li>
        <li><span>当前</span><code>detail</code>（已加载）</li>
        <li><span>计算</span><code>浏览器端 map + mean</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>删运行</h3>
      <ul class="flow-list">
        <li><span>第一步</span><code>装填 4 秒</code></li>
        <li><span>第二步</span><code>DELETE /eval/runs/:id</code></li>
        <li><span>副作用</span><code>baseline 清空</code></li>
      </ul>
    </article>
  </div>
  <div class="callout"><strong>为什么不做对照接口：</strong>一次 run 的 <code>results</code> 本来就是整份 jsonb，拿两次已经足够；在服务端再算一遍只会多一份口径。聚合与交集平均都在 <code>ComparePanel</code> 里用同一份数据算。</div>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一次「采纳 + 对照 + 删除」的旅行',
      subtitle: '点一步跳到对应代码。',
      steps: [
        { goto: 'route-baseline:120-141', title: 'PUT 入口与校验', note: '先看后端怎么拒绝非法采纳。', code: 'routes/eval.ts L120–141' },
        { goto: 'repo-baseline:141-147', title: '只写一列', note: '落库没有事务，因为只改一行一列。', code: 'repo/eval.ts L141–147' },
        { goto: 'client-baseline:1194-1212', title: '前端两个请求', note: '采纳返回整只 dataset；删除是 204。', code: 'client.ts L1194–1212' },
        { goto: 'web-effect:144-163', title: '基线自动加载', note: 'datasetId 一变就重新钉。', code: 'evals-page.tsx L144–163' },
        { goto: 'web-toolbar:385-408', title: '右栏工具条', note: '采纳与删除都挂在选中的 run 上。', code: 'evals-page.tsx L385–408' },
        { goto: 'web-compare:603-706', title: '对照面板', note: '总分、相同条目平均、逐条两列。', code: 'evals-page.tsx L603–706' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'backend',
        kicker: 'CODE · 03',
        title: '后端：一条显式基线',
        subtitle: '路由做守卫，repo 只写列。',
        body: '<div class="callout">校验顺序是有意的：先确认数据集和 run 都存在，再判断归属与状态；错误码分开，前端才能给出不同的提示。</div>',
        blocks: [
          {
            id: 'route-baseline',
            file: 'src/routes/eval.ts',
            lang: 'ts',
            ranges: [[120, 141]],
            notes: [
              { lines: '120-125', title: '入口与形状', badge: '7.3', body: '<p><code>PUT</code> 而不是 <code>PATCH dataset</code>：换基线是独立动作，不跟改名/改备注混在一起。先校验路径 id 与 body 的 <code>run_id</code> 都是 UUID，坏形状直接 400。</p>' },
              { lines: '126-134', title: '三段守卫', badge: '7.3', body: '<p>数据集不存在 404；run 不存在 404；<code>Run.dataset_id !== Id</code> 400 <code>E_EVAL_BASELINE_DATASET</code>；状态不是 <code>done</code> 409 <code>E_EVAL_RUN_NOT_DONE</code>。注意没有 FK 兜底，归属必须在这层挡。</p>' },
              { lines: '135-141', title: '写列并返回整只数据集', badge: '7.3', body: '<p>返回 <code>{ dataset }</code>（带 <code>case_count</code>），前端可以直接替换列表项。异常统一记 <code>E_EVAL_BASELINE_SET</code> 再回 500，不让底层错误穿出去。</p>' },
            ],
          },
          {
            id: 'repo-baseline',
            file: 'src/adapter/repo/eval.ts',
            lang: 'ts',
            ranges: [[141, 147]],
            notes: [
              { lines: '141-147', title: 'UPDATE 一列 + 补计数', badge: '7.3', body: '<p>只改 <code>baseline_run_id</code> 与 <code>updated_at</code>；<code>RETURNING *</code> 后补 <code>case_count</code>，保持与 <code>listDatasets</code> 同样的行形状。行不存在返回 null，由路由转 404。</p>' },
            ],
          },
          {
            id: 'repo-delete-run',
            file: 'src/adapter/repo/eval-run.ts',
            lang: 'ts',
            ranges: [[173, 190]],
            notes: [
              { lines: '173-190', title: '删 run 顺手清基线', badge: '7.2', body: '<p>7.2 已有的行为：同一个事务里先把 <code>baseline_run_id</code> 指向该 run 的数据集清空，再删行。7.3 删除 UI 直接复用它，不需要额外接口。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'frontend',
        kicker: 'CODE · 04',
        title: '前端：钉住、采纳、删除',
        subtitle: '两个请求函数 + 三个界面片段。',
        body: '<div class="callout">前端不做乐观更新：采纳和删除成功后都重拉数据集/列表/详情，界面看到的状态一律来自库。</div>',
        blocks: [
          {
            id: 'client-baseline',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            lang: 'ts',
            ranges: [[1194, 1212]],
            notes: [
              { lines: '1194-1201', title: 'setEvalBaseline', badge: '7.3', body: '<p>PUT 后返回 <code>dataset</code>；后端 409/400 会被 <code>requestJson</code> 转成 <code>ApiError</code>，页面直接显示后端话术。</p>' },
              { lines: '1209-1212', title: 'deleteEvalRun', badge: '7.3', body: '<p>204 没有 body，走 <code>requestNoContent</code>，不去 <code>json()</code>；运行中 409「先中止再删除」原样上屏。</p>' },
            ],
          },
          {
            id: 'web-effect',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[144, 163]],
            notes: [
              { lines: '144-155', title: '基线自动加载', badge: '7.3', body: '<p><code>baselineId</code> 从数据集行派生；一变就重新拉基线 run。用 <code>cancelled</code> 防止切数据集后旧请求回写；失败单独记 <code>baselineFailed</code>，不跟普通提示混。</p>' },
              { lines: '157-163', title: '两步删除的装填', badge: '7.3', body: '<p>切 run 立即解除装填；装填后 4 秒自动收回。计时器在 effect cleanup 里清掉，避免卸载后 setState。</p>' },
            ],
          },
          {
            id: 'web-actions',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[231, 257]],
            notes: [
              { lines: '231-240', title: '采纳：写库后重拉数据集', badge: '7.3', body: '<p>只调一个 PUT；成功后 <code>loadBase()</code> 重拉数据集，基线徽标与对照里的「被钉 run」都跟着换。失败不猜原因，直接显示 <code>ApiError.message</code>。</p>' },
              { lines: '242-257', title: '删除：第一下只装填', badge: '7.3', body: '<p><code>deleteArmed</code> 为 false 时只 set true 并 return；第二下才发 DELETE。成功后先 <code>loadBase()</code>（删基线 run 时数据集已无 baseline），再 <code>refreshRuns()</code> 重新选一条 run。</p>' },
            ],
          },
          {
            id: 'web-toolbar',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[275, 280], [385, 408]],
            notes: [
              { lines: '275-280', title: '三个派生布尔', badge: '7.3', body: '<p><code>isBaseline</code> 看 id；<code>canAdopt</code> 只允许 <code>done</code> 且不是当前基线；<code>canDelete</code> 只允许终态（done/failed/cancelled）。queued/running 连删除入口都不显示。</p>' },
              { lines: '390-408', title: '工具条放 tab 之上', badge: '7.3', body: '<p>不放左侧 run 行：那一行本身就是 <code>button</code>，嵌按钮既不合法也会误触。当前即基线时左侧补一个「当前基线」标签，右侧隐藏采纳。</p>' },
            ],
          },
          {
            id: 'web-compare',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[603, 706]],
            notes: [
              { lines: '603-627', title: '四种空态', badge: '7.3', body: '<p>没有基线 → 教怎么采纳；当前 run 就是基线 → 不给两列相同数字；基线读取失败 → 独立错误；数据未到 → 读取中。顺序保证用户不会看到半截假数字。</p>' },
              { lines: '629-645', title: '行、交集与平均', badge: '7.3', body: '<p>行序取 <b>当前 run 的 <code>snapshot.cases</code></b>；两张 Map 按 <code>case_key</code> 查结果。<code>Same</code> 只收两边都有结果的 case，平均只在这个交集上算；<code>Totals</code> 用两次 run 的 summary。没有 diff。</p>' },
              { lines: '647-665', title: '总分两列', badge: '7.3', body: '<p>第一行先报「被钉的是哪条 run」（时间 · 运行配置名）；下面并排平均 recall / MRR，直接可比（OQ-7.3-7 新口径）。</p>' },
              { lines: '667-680', title: '相同条目平均', badge: '7.3', body: '<p>「相同条目 · N 条」把交集规模写在标题里；平均 recall / MRR 各一列。题集改过也能量，因为分母只算两边都能评的 case。</p>' },
              { lines: '682-700', title: '逐条并排', badge: '7.3', body: '<p>两列都是 recall；基线缺这条就显示 <code>—</code>，不判「新增/消失」。<code>error</code> 非空显示「错误」并标红，数字照摆。</p>' },
              { lines: '702-706', title: 'recallCell', badge: '7.3', body: '<p>纯函数：null → <code>—</code>，有 error → 错误，否则百分比。让渲染分支只关心 class，不再散落判断。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'tests',
        kicker: 'CODE · 05',
        title: '测试：把定义钉住',
        subtitle: '后端只测守卫，前端只测定义。',
        body: '<div class="callout">真库测试覆盖守卫与副作用；前端 client 全 mock，覆盖「显示什么、调不调接口」这类定义，不测像素。</div>',
        blocks: [
          {
            id: 'test-server',
            file: 'test/eval-runs-route.test.ts',
            lang: 'ts',
            ranges: [[214, 251]],
            notes: [
              { lines: '214-230', title: '排队 409 → done 200', badge: '7.3', body: '<p>先在 queued 状态采纳，断言 409；<code>finishRun</code> 后再采纳，断言 200 且返回的 <code>baseline_run_id</code> 就是这条 run。</p>' },
              { lines: '232-242', title: '不采纳不改基线', badge: '7.3', body: '<p>第二条 run 跑完不会自动改基线；换一个数据集采纳别人的 run → 400 <code>E_EVAL_BASELINE_DATASET</code>；不存在的 run → 404。</p>' },
              { lines: '244-251', title: '删基线 run 清空', badge: '7.3', body: '<p>DELETE 该 run 后，数据集的 <code>baseline_run_id</code> 变 null；最后按依赖顺序清理 dataset / case / configs。</p>' },
            ],
          },
          {
            id: 'test-web',
            file: 'app/web/src/components/evals/evals-page.test.tsx',
            source: 'web:src/components/evals/evals-page.test.tsx',
            lang: 'ts',
            ranges: [[240, 311]],
            notes: [
              { lines: '240-250', title: '无基线空态', badge: '7.3', body: '<p>对照 tab 不画假数字，只给「怎么设基线」的指引。</p>' },
              { lines: '252-283', title: '数字定义', badge: '7.3', body: '<p>基线只有 1 条结果：总分的 25.0% 只出现一次、<code>—</code> 只出现一次、「相同条目 · 1 条」可见；选中就是基线时不给采纳按钮。</p>' },
              { lines: '285-294', title: '采纳接线', badge: '7.3', body: '<p>点采纳 → <code>setEvalBaseline(d-1, run-1)</code>，随后数据集被重拉（调用次数 ≥ 2）。</p>' },
              { lines: '296-311', title: '删除两步', badge: '7.3', body: '<p>第一下只改按钮文案，<code>deleteEvalRun</code> 零调用；第二下才 DELETE，并重拉运行列表。</p>' },
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
    <span class="kicker">06 · 取舍与坑</span>
    <h2>为什么不给「判法不一致」黄条</h2>
    <p class="section-sub">Lynx 2026-10-29 改口径：总分直接可比，题集差异用「相同条目平均」消化，而不是拦着不让比。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">WHY TOTALS</div>
      <h3>总分并排 + 交集平均</h3>
      <p>两次 run 的总分先摆出来；如果 case 集合不同，再给只算交集的平均并标条数。既保留「全部 case」的口径，又给一个 apples-to-apples 的数。</p>
    </article>
    <article class="choice">
      <div class="choice-no">NO VERDICT</div>
      <h3>不算变好/退化</h3>
      <p>不做 diff、不标红绿箭头、不算新增/消失。系统只摆事实，结论归人；这也让 7.4 引入 judge 后不需要推翻这里。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DONE ONLY</div>
      <h3>只有 done 能当基线</h3>
      <p>queued/running 还没有完整结果，failed/cancelled 是残卷；拿它们当基线会把后面的对照带偏。409 的话术直接说「只有完成的运行才能当基线」。</p>
    </article>
    <article class="choice">
      <div class="choice-no">NO FK</div>
      <h3>基线列没有外键</h3>
      <p>7.1 定表时因循环 FK 会拖垮 drizzle 生成，<code>baseline_run_id</code> 没挂外键；删 run 的清理放在 7.2 的事务里做。代价：采纳与删 run 并发时有极小悬空窗口（单用户下接受）。</p>
    </article>
    <article class="choice">
      <div class="choice-no">TWO STEP</div>
      <h3>删除要两下</h3>
      <p>删一条 run 会丢掉整份历史结果；两步确认与资源页的肌肉记忆一致。切 run 立即解除装填，4 秒后自动收回。</p>
    </article>
    <article class="choice">
      <div class="choice-no">ORDER</div>
      <h3>顺序跟当前 run</h3>
      <p>对照的行序取当前 run 的 <code>snapshot.cases</code>，不取基线也不另排序；题集中途改过，历史 run 的对照顺序也不变。</p>
    </article>
  </div>
  <div class="callout strong"><strong>踩坑：</strong><code>—</code> 与「错误」都占一格；不要为了好看把缺失行隐藏掉——那会变成事实上的「消失」判定。另：基线 run 详情是额外一次 GET，删除/采纳后必须重拉数据集，否则徽标与对照对象会不同步。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">07 · 自测清单</span>
    <h2>复制的命令与真跑结果</h2>
    <p class="section-sub">静态检查 + 真库真跑；浏览器视觉归 Lynx。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">BACKEND</div>
      <h3>路由与 repo</h3>
      <p><code>cd app/server &amp;&amp; npx tsc --noEmit</code></p>
      <p><code>npx vitest run test/eval-runs-route.test.ts</code></p>
      <p>期望：5/5；包含排队 409、采纳 200、跨数据集 400、删基线 run 清空。</p>
    </article>
    <article class="choice">
      <div class="choice-no">FRONTEND</div>
      <h3>定义测试</h3>
      <p><code>cd app/web &amp;&amp; npx tsc --noEmit</code></p>
      <p><code>npx vitest run src/components/evals/evals-page.test.tsx</code></p>
      <p>期望：13/13；对照四种空态 + 总分/交集/缺失 + 采纳 + 两步删除。</p>
    </article>
    <article class="choice">
      <div class="choice-no">REAL RUN</div>
      <h3>真库真跑（隔离库）</h3>
      <p><code>PORT=3100 npm start</code> 后：临时数据集 1 条 case → run done（recall 100% / MRR 50%）→ 采纳 200；排队中采纳 409 <code>E_EVAL_RUN_NOT_DONE</code>；跨数据集 400 <code>E_EVAL_BASELINE_DATASET</code>；删基线 run 后 baseline = null；临时数据清理 204。</p>
    </article>
    <article class="choice">
      <div class="choice-no">FULL</div>
      <h3>全量</h3>
      <p>前端 <code>npm test</code>：85 文件 / 727 tests；<code>npm run build</code> 绿。后端串行全量 154/155（唯一失败为远端 MinIO 抖动，单跑 10/10），远端库断连时 9 个失败文件重跑 49/49。</p>
    </article>
  </div>
  <div class="callout"><strong>真跑过 vs 代码路径存在：</strong>采纳/删除/清空副作用与 409/400 都是真库真跑；前端交互只过了 jsdom 测试，浏览器视觉（两列对齐、徽标迁移、窄屏）留给 Lynx。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">08 · 与前后 story 的衔接</span>
    <h2>7.2 交来的 run，7.3 钉成基线，7.4 再评答案</h2>
    <p class="section-sub">三步各管一段：跑出来 → 定基线并排 → 判回答质量。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">FROM 7.2</div>
      <h3>run 与结果已就绪</h3>
      <p><code>eval_runs.snapshot/results</code>、单队列执行器、逐条 recall/MRR、运行删除后端端点都是 7.2 的交付；7.3 只是把 <code>baseline_run_id</code> 用起来并补 UI。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">7.3 NOW</div>
      <h3>基线 + 对照 + 删除</h3>
      <p>数据集一个基线；对照只摆总分与相同条目平均；运行删除两步确认。7.1 的「先删 N 次运行」终于有了 UI 出路。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">TO 7.4</div>
      <h3>答案评测仍整格未收口</h3>
      <p>OQ-7.4-1..5 要在开工前拍板：断言匹配、judge 模型、rubric、HITL 形态、分数合成。gold 前端挑选也归 7.4 / 未排期。</p>
    </article>
  </div>
  <div class="callout strong"><strong>下一步入口：</strong>epics.md › Story 7.4；sprint-status 7.3 转 review 后待 Lynx 浏览器验收。对照若以后要加趋势/跨数据集对比，先回 PRD Non-Goals 对口径。</div>
</section>`,
    },
    {
      type: 'html',
      html: `<footer class="footer"><span>Story 7.3 · 对照与基线</span><span>Generated from the working tree · 2026-10-29</span></footer>`,
    },
  ],
}
