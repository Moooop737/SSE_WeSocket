export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic7-story4-answer-eval.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 7 · Story 7.4 答案评测 · 断言、judge、人判 · 带代码逐行讲解',
  tocTitle: 'Story 7.4',
  tocSub: '答案评测 · 带代码逐行讲解',
  accent: '#4f46e5',
  accent2: '#0f766e',
  accentDark: '#a5b4fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 7 · STORY 7.4</span><span>ANSWER · ASSERT · JUDGE · HUMAN</span></div>
  <h1>同一道题，<em>也要评回答</em></h1>
  <p class="hero-sub">7.4 让评测从「检索命中」走到「回答质量」：每条 case 可写 expect/reject 断言；答案 run 复用 /chat 的 INSTRUCTIONS 与 retrieve 工具跑一次非流式回答，再按 rubric 让 judge 给三维分。人可改机器分或独立打分；最终判定按「断言硬门 + 取更严」，人机都保留算一致率。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>166 tests</span>
    <span class="chip"><strong>前端</strong>735 tests</span>
    <span class="chip"><strong>真跑</strong>1 条 · 37s</span>
    <span class="chip"><strong>状态</strong>review · 2026-10-29</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 30 files / 166</b> · <b>frontend 86 files / 735</b> · <b>build green</b> · <b>answer run live</b> · <b>judge live</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>断言是硬门，judge 给分数，人保留改分权</h2>
    <p class="section-sub">7.4 不把「评回答」做成一条黑箱总分；证据分层摆开，结论按拍板规则合成。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / ASSERT</div>
      <h3>expect / reject 断言</h3>
      <p>每条 case 两组断言：必须出现、必须不出现。默认子串大小写不敏感，单条可开正则；保存时校验正则可编译。全部满足才算过。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / JUDGE</div>
      <h3>三维分 + case verdict</h3>
      <p>rubric v1 让 judge 给 groundedness / correctness / citation（0–2）和 pass/fail。没有默认模型、不强制不同源；单条失败只记该 case。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / HUMAN</div>
      <h3>人可以改分或独立打分</h3>
      <p>人判单独存 <code>human_results</code>，机器结果不覆盖；一致率用「人判 vs judge 原值」算。还可以修正错误的题面，写回题集、不动历史快照。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">04 / VERDICT</div>
      <h3>断言硬门 + 取更严</h3>
      <p>断言失败直接 fail；judge 与人判都在时两者都 pass 才 pass；只有一个就听它；都没有且有断言 → pass，没断言 → unscored。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 7.4：</strong>多次采样与置信区间（未排期）、pairwise（后续）、人工标注平台（不做）、gold 的前端挑选/编辑（未排期）、把 judge 分数与检索指标加权成一条总分（不做）；浏览器视觉归 Lynx。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>src/eval/mode.ts</code></td><td>用快照推断检索 / 答案模式，不加列</td></tr>
      <tr><td><code>src/eval/answer.ts</code></td><td>非流式回答 + 引用扁平化，不写会话</td></tr>
      <tr><td><code>src/eval/assertions.ts</code></td><td>子串/正则断言判定</td></tr>
      <tr><td><code>src/eval/judge.ts</code></td><td>rubric 版本表 + Output.object 三维分</td></tr>
      <tr><td><code>src/eval/metrics.ts</code></td><td>finalVerdict + 答案聚合与一致率</td></tr>
      <tr><td><code>src/eval/runner.ts</code></td><td>模式分支、模型解析、逐条执行</td></tr>
      <tr><td><code>src/routes/eval.ts</code></td><td>断言校验、人判端点、答案摘要</td></tr>
      <tr><td><code>app/web/src/components/evals/cases-view.tsx</code></td><td>断言编辑与只读展示</td></tr>
      <tr><td><code>app/web/src/components/evals/evals-page.tsx</code></td><td>答案列/详情/人判/修正题面/对照</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里 <span class="badge b-app">7.4</span> 是本格新增；<span class="badge b-pre">7.2</span> / <span class="badge b-pre">7.3</span> 是复用与上下文。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 一次答案评测怎么走</span>
    <h2>模式从快照来，结论在读取时合</h2>
    <p class="section-sub">运行期只写机器证据；人判之后，详情与聚合用同一套规则重算最终判定。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>1 · 模式</h3>
      <ul class="flow-list">
        <li><span>judge_model</span><code>非空 → answer</code></li>
        <li><span>case 断言</span><code>任一 → answer</code></li>
        <li><span>否则</span><code>retrieval</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>2 · 运行</h3>
      <ul class="flow-list">
        <li><span>回答</span><code>generateText + tools</code></li>
        <li><span>断言</span><code>expect / reject</code></li>
        <li><span>judge</span><code>Output.object</code></li>
        <li><span>机器 verdict</span><code>写入 results</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>3 · 人判后</h3>
      <ul class="flow-list">
        <li><span>人判</span><code>human_results</code></li>
        <li><span>最终</span><code>finalVerdict</code></li>
        <li><span>聚合</span><code>summarizeAnswerResults</code></li>
        <li><span>一致率</span><code>按 level</code></li>
      </ul>
    </article>
  </div>
  <div class="callout"><strong>为什么读时重算：</strong>机器 verdict 是运行时的快照；人判是之后才进来的。把「断言 &gt; 人判 &gt; judge」放在一个纯函数里，列表、详情、对照都调它，就不会出现两套口径。</div>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: 'WALK',
      title: '一条答案 case 的旅行',
      subtitle: '点一步跳到对应代码。',
      steps: [
        { goto: 'mode-file:1-22', title: '先判模式', note: 'judge 或断言决定这是不是答案 run。', code: 'mode.ts L1–22' },
        { goto: 'answer-file:25-58', title: '跑回答', note: '同 INSTRUCTIONS + retrieve 工具，不写会话。', code: 'answer.ts L25–58' },
        { goto: 'assert-file:11-28', title: '过断言', note: '子串/正则，expect 全中、reject 全不中。', code: 'assertions.ts L11–28' },
        { goto: 'judge-file:43-89', title: 'judge 打分', note: 'rubric 版本解析 + 结构化输出。', code: 'judge.ts L43–89' },
        { goto: 'verdict-file:134-252', title: '合成判定', note: '断言硬门 + 取更严，再算聚合。', code: 'metrics.ts L134–252' },
        { goto: 'human-route:434-471', title: '人判覆盖', note: '按 case_key upsert，机器分保留。', code: 'routes/eval.ts L434–471' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'backend',
        kicker: 'CODE · 03',
        title: '后端：模式、回答、断言、judge',
        subtitle: '每个都只做一件事。',
        body: '<div class="callout">这四块都是纯函数或单次调用：模式读快照、回答不碰会话、断言只匹配文本、judge 失败回 error。编排集中在 runner。</div>',
        blocks: [
          {
            id: 'mode-file',
            file: 'src/eval/mode.ts',
            lang: 'ts',
            ranges: [[1, 22]],
            notes: [
              { lines: '1-5', title: '不加列的理由', badge: '7.4', body: '<p>快照已经冻结了 judge 配置与每条 case 的断言；模式可以是推导值。历史 run 不会因为后来改题集/配置而换模式。</p>' },
              { lines: '13-21', title: '两个条件', badge: '7.4', body: '<p><code>judge_model</code> 非空或任一 case 有断言 → answer；否则维持 7.2 的检索评测。旧快照没有 <code>assertions</code> 字段也不会误判。</p>' },
            ],
          },
          {
            id: 'answer-file',
            file: 'src/eval/answer.ts',
            lang: 'ts',
            ranges: [[1, 58]],
            notes: [
              { lines: '1-5', title: '复用的边界', badge: '7.4', body: '<p>复用 <code>INSTRUCTIONS</code> 与 <code>buildAgentTools</code>，不复用 <code>ChatService</code>：那边绑死 session 历史、SSE 与落库，评测只要一次非流式调用。</p>' },
              { lines: '25-45', title: '一次 generateText', badge: '7.4', body: '<p>用户消息只放原问题；<code>stopWhen(5)</code> 与聊天一致。失败不抛，回 <code>{ answer: "", error }</code>，让该 case 记错、run 继续。</p>' },
              { lines: '46-57', title: '引用按出现顺序编号', badge: '7.4', body: '<p>遍历 steps 的 toolResults，把 retrieve 的 hits 依次摊平；编号 1..N 对应回答里的 <code>[n]</code>。多次 retrieve 的结果往后排。</p>' },
            ],
          },
          {
            id: 'assert-file',
            file: 'src/eval/assertions.ts',
            lang: 'ts',
            ranges: [[1, 28]],
            notes: [
              { lines: '1-9', title: '判定语义', badge: '7.4', body: '<p>纯函数：<code>expect</code> 全中、<code>reject</code> 全不中才 passed；每条 check 单独记 matched/error。</p>' },
              { lines: '18-27', title: '匹配规则', badge: '7.4', body: '<p>子串统一小写比较；正则统一加 <code>i</code>（JS 字符串带不了 flags），编译失败记在该条 error 上并算不通过。</p>' },
            ],
          },
          {
            id: 'judge-file',
            file: 'src/eval/judge.ts',
            lang: 'ts',
            ranges: [[1, 89]],
            notes: [
              { lines: '31-47', title: 'rubric 版本表', badge: '7.4', body: '<p>配置只存版本名（如 <code>rubric-v1</code>），正文住 <code>RUBRICS</code>；空值回落 v1，未知版本返回 null，由建 run 或执行器拦下。</p>' },
              { lines: '49-77', title: 'Output.object', badge: '7.4', body: '<p>用 <code>generateText + Output.object</code> 拿结构化 JSON；schema 限制三维 0–2、verdict 枚举、reason 字符串。DeepSeek 实测可用（兼容模式注入 schema）。</p>' },
              { lines: '79-88', title: 'prompt 与截断', badge: '7.4', body: '<p>rubric + 问题 + 回答 + 编号片段；片段最多 10 条、每条 1000 字，避免长块把上下文撑爆。失败回 error，不伪造分数。</p>' },
            ],
          },
          {
            id: 'verdict-file',
            file: 'src/eval/metrics.ts',
            lang: 'ts',
            ranges: [[134, 252]],
            notes: [
              { lines: '134-150', title: 'finalVerdict', badge: '7.4', body: '<p>回答错误直接 fail；断言存在且失败 → fail；judge 与人判都在时两者都 pass 才 pass；只剩一个就听它；都没有时，有断言算 pass，没断言算 unscored。</p>' },
              { lines: '151-199', title: '逐条累计', badge: '7.4', body: '<p>用最终判定统计 pass/fail/unscored；断言、judge（可用时）分别计分母与通过数；judge 三维分只累加非空值。</p>' },
              { lines: '200-252', title: '人判与 level', badge: '7.4', body: '<p>人机一致率只算「judge 可用且有人判」的 case；按 level 再分一组，页面据此标低一致率题组。</p>' },
            ],
          },
          {
            id: 'runner-file',
            file: 'src/eval/runner.ts',
            lang: 'ts',
            ranges: [[105, 257]],
            notes: [
              { lines: '113-140', title: '模式分支', badge: '7.4', body: '<p>检索模式才读 SearchOptions；答案模式先 <code>prepareAnswer</code>（回答模型 / judge 模型 / rubric），任一不在册或版本未知 → run failed，不写 results。</p>' },
              { lines: '205-221', title: 'prepareAnswer', badge: '7.4', body: '<p>回答模型从快照的 <code>run_config.model</code> 解析；judge 可空；rubric 优先用快照冻结的正文，旧快照才回退解析。</p>' },
              { lines: '222-257', title: 'runAnswerCase', badge: '7.4', body: '<p>回答 → 有断言才评断言 → 回答成功且 judge 可用才调 judge → 存机器 verdict。检索字段填 0/null，<code>hit_count</code> 记引用数。</p>' },
            ],
          },
          {
            id: 'detail-summary',
            file: 'src/routes/eval.ts',
            lang: 'ts',
            ranges: [[390, 410]],
            notes: [
              { lines: '390-410', title: '详情按模式给摘要', badge: '7.4', body: '<p>answer run 用 <code>summarizeAnswerResults</code>（带上 cases 算 level），并给每条结果注入读取时算出的 <code>final_verdict</code>；检索 run 仍用 <code>summarizeResults</code>。</p>' },
            ],
          },
          {
            id: 'human-route',
            file: 'src/routes/eval.ts',
            lang: 'ts',
            ranges: [[434, 471]],
            notes: [
              { lines: '434-447', title: '人判的形状', badge: '7.4', body: '<p>必须 answer 且 done；verdict 只接 pass/fail；三维分 0..2 或 null；备注截 500 字。检索 run 返回 <code>E_EVAL_NOT_ANSWER</code>。</p>' },
              { lines: '448-471', title: 'upsert 与返回', badge: '7.4', body: '<p>按 <code>case_key</code> 覆盖同一条人判，机器结果原样保留；返回整组 <code>human_results</code>，前端重拉详情后看到新的 final_verdict 与一致率。</p>' },
            ],
          },
          {
            id: 'assert-route',
            file: 'src/routes/eval.ts',
            lang: 'ts',
            ranges: [[566, 610]],
            notes: [
              { lines: '566-581', title: '只认两个键', badge: '7.4', body: '<p><code>assertions</code> 只允许 expect/reject；未知键直接 400，避免把拼写错误悄悄吞掉。</p>' },
              { lines: '582-610', title: '逐条校验', badge: '7.4', body: '<p>每条必须是非空 text（≤200 字），regex 为布尔；开正则时当场 <code>new RegExp</code> 验证可编译。最多 50 条/组。</p>' },
            ],
          },
          {
            id: 'snapshot-file',
            file: 'src/eval/snapshot.ts',
            lang: 'ts',
            ranges: [[30, 44]],
            notes: [
              { lines: '30-44', title: '冻结 rubric 正文', badge: '7.4', body: '<p>配了 judge 时，建 run 把「版本名 + 解析后的正文」一起写进 snapshot；之后改代码里的 rubric，旧 run 的判分口径不变。</p>' },
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
        title: '前端：断言、答案详情、人判',
        subtitle: '题集页录断言，运行页看结果。',
        body: '<div class="callout">运行页只渲染服务端给的 <code>final_verdict</code> 与 summary，不复制判定规则；人判保存后重拉详情。</div>',
        blocks: [
          {
            id: 'assert-editor',
            file: 'app/web/src/components/evals/cases-view.tsx',
            source: 'web:src/components/evals/cases-view.tsx',
            lang: 'ts',
            ranges: [[408, 450], [505, 530]],
            notes: [
              { lines: '408-450', title: 'AssertionEditor', badge: '7.4', body: '<p>每组断言一个小组件：加一行、改文字、切正则、移除。空文字在保存前就被拦下，不依赖后端 400。</p>' },
              { lines: '505-530', title: '抽屉里的两组', badge: '7.4', body: '<p>expect（必须出现）与 reject（必须不出现）各一组；提示写清子串大小写不敏感、正则统一 i。</p>' },
            ],
          },
          {
            id: 'answer-page',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[409, 545], [823, 1006]],
            notes: [
              { lines: '409-440', title: '答案聚合四格', badge: '7.4', body: '<p>断言通过率、judge 通过率、人机一致率、耗时；下面补 pass/fail/未评/失败/人审与按 level 的一致率，低于整体标「低」。</p>' },
              { lines: '454-530', title: '答案列', badge: '7.4', body: '<p>表头与行按模式切换：判定 / 断言 / judge / 耗时；判定颜色只表达该 case 的最终状态，不是与基线的差。</p>' },
              { lines: '823-913', title: 'AnswerCaseDetail', badge: '7.4', body: '<p>回答、引用、断言逐条、judge 三维分与理由；错误分别在回答错误与 judge 错误两个位置展示。</p>' },
              { lines: '931-1006', title: 'HumanEditor', badge: '7.4', body: '<p>判定 + 三维分 + 备注；空分数合法、非法值禁用保存；保存只发人判，机器分不动。未结束的 run 只显示提示。</p>' },
            ],
          },
          {
            id: 'compare-answer',
            file: 'app/web/src/components/evals/evals-page.tsx',
            source: 'web:src/components/evals/evals-page.tsx',
            lang: 'ts',
            ranges: [[1008, 1140]],
            notes: [
              { lines: '1030-1045', title: '跨模式守卫', badge: '7.4', body: '<p>基线模式与当前不同（检索 vs 答案）时只提示「不能并排」，不摆两列不同量纲的数字。</p>' },
              { lines: '1058-1100', title: '答案对照总分', badge: '7.4', body: '<p>并排断言通过率、judge 通过率、人机一致率与三维均分；另给「相同条目」的交集平均，沿用 7.3 的口径。</p>' },
              { lines: '1117-1140', title: '逐条判定', badge: '7.4', body: '<p>行序仍取当前 run 的快照；缺的 case 显示 <code>—</code>，只摆通过/失败/未评，不做 diff。</p>' },
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
        title: '测试：把判定与边界钉住',
        subtitle: '纯函数测规则，执行器测编排。',
        body: '<div class="callout">答案执行器的测试用 vi.mock 替换 answerCase / judgeCase，不调真实模型；repo 仍是真库。判分规则的测试完全不连库。</div>',
        blocks: [
          {
            id: 'test-metrics',
            file: 'test/eval-answer-metrics.test.ts',
            lang: 'ts',
            ranges: [[18, 60], [79, 111]],
            notes: [
              { lines: '18-60', title: '断言与 finalVerdict', badge: '7.4', body: '<p>子串大小写、reject 命中、坏正则记 error；断言硬门、取更严、只有单一来源、回答错误 → fail、无证据 → unscored。</p>' },
              { lines: '79-111', title: '聚合一图看完', badge: '7.4', body: '<p>四个 case 覆盖 pass/fail/unscored/error；人判三条覆盖同意/不同意/judge 不可用，断言与 level 统计逐项核对。</p>' },
            ],
          },
          {
            id: 'test-runner',
            file: 'test/eval-answer-runner.test.ts',
            lang: 'ts',
            ranges: [[95, 140]],
            notes: [
              { lines: '95-103', title: '真 repo + 假模型', badge: '7.4', body: '<p>跑完两条 case：断言过/败、judge pass、最终 verdict 与 answer/citations 字段都断言；验证编排不是靠记忆。</p>' },
              { lines: '104-140', title: '模型不在册 → failed', badge: '7.4', body: '<p>回答模型解析失败时 run 直接 failed、不写 results；避免把配置错误洗成一条条 case 错误。</p>' },
            ],
          },
          {
            id: 'test-routes',
            file: 'test/eval-runs-route.test.ts',
            lang: 'ts',
            ranges: [[254, 302]],
            notes: [
              { lines: '254-300', title: '人判端点', badge: '7.4', body: '<p>非 done 409、answer 才接、按 case_key upsert、非法分数 400、检索 run 400 <code>E_EVAL_NOT_ANSWER</code>。</p>' },
            ],
          },
          {
            id: 'test-web',
            file: 'app/web/src/components/evals/evals-page.test.tsx',
            source: 'web:src/components/evals/evals-page.test.tsx',
            lang: 'ts',
            ranges: [[397, 445]],
            notes: [
              { lines: '397-421', title: '答案详情 + 人判 + 修正题面', badge: '7.4', body: '<p>回答文本可见；三维分填好后保存 → <code>setEvalHuman</code> 收到完整 payload；修正题面 → <code>updateEvalCase</code> 只带新 query。</p>' },
              { lines: '423-445', title: '跨模式对照', badge: '7.4', body: '<p>基线是检索 run 时只出现「模式不同，不能并排」；两侧都是答案 run 时验证断言/judge/相同条目三块都渲染。</p>' },
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
    <h2>为什么不合成一条总分</h2>
    <p class="section-sub">断言、judge、人判是三种证据，不是三个可以随意加权的分数。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">WHY LAYERS</div>
      <h3>证据分层，判定只取更严</h3>
      <p>断言是硬门；judge 与人判都在时两者都 pass 才 pass。没有权重表，也没有「机器 0.7 + 人 0.3」这种拍脑袋的数；要调整只改 rubric 的 pass 标准。</p>
    </article>
    <article class="choice">
      <div class="choice-no">NO OVERWRITE</div>
      <h3>人判不改机器分</h3>
      <p>一致率需要机器原值；人判单独存。页面上人判是最终依据，但机器分仍可回看——这样既能纠错，也能知道机器错在哪。</p>
    </article>
    <article class="choice">
      <div class="choice-no">ANSWER PATH</div>
      <h3>复用指令与工具，不复用 ChatService</h3>
      <p>ChatService 绑死历史、SSE 与落库；评测要的是无会话的 generateText。复用边界画在「INSTRUCTIONS + tools」，改动面最小。</p>
    </article>
    <article class="choice">
      <div class="choice-no">NO COLUMN</div>
      <h3>模式用快照推断</h3>
      <p>加 kind 列会让旧 run 回填、接口多一字段；judge 或断言本身就在快照里，推导即可。代价是每次读要多扫一遍 cases，规模小可接受。</p>
    </article>
    <article class="choice">
      <div class="choice-no">ERROR ≠ SCORE</div>
      <h3>回答错与 judge 错分开</h3>
      <p>回答失败是 case 失败；judge 失败是基础设施失败，断言能兜就兜，兜不住就 unscored，不假装 0 分。</p>
    </article>
    <article class="choice">
      <div class="choice-no">CROSS MODE</div>
      <h3>跨模式不硬比</h3>
      <p>检索 run 的 recall 与答案 run 的 judge 分不是同一量纲；基线模式不同时只提示，不造一张看似可比的表。</p>
    </article>
  </div>
  <div class="callout strong"><strong>踩坑：</strong>人判保存后必须重拉详情，否则 <code>final_verdict</code>/一致率还是旧的；judge 的片段要截断，否则长块会把 prompt 撑爆；<code>summarizeResults</code> 不能拿来算答案 run（它把 recall≤0 当 failed）。</div>
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
      <h3>迁移与测试</h3>
      <p><code>dbmate --no-dump-schema up</code>；<code>npm run eval:db:setup</code></p>
      <p><code>cd app/server &amp;&amp; npx tsc --noEmit</code></p>
      <p><code>npx vitest run test/eval-answer-metrics.test.ts test/eval-answer-runner.test.ts</code></p>
    </article>
    <article class="choice">
      <div class="choice-no">FRONTEND</div>
      <h3>定义测试</h3>
      <p><code>cd app/web &amp;&amp; npx tsc --noEmit</code></p>
      <p><code>npx vitest run src/components/evals/</code>：答案详情/人判/修正题面/跨模式对照。</p>
      <p><code>npm run build</code>：绿。</p>
    </article>
    <article class="choice">
      <div class="choice-no">REAL RUN</div>
      <h3>真库真跑（隔离库）</h3>
      <p>1 条 case、37s done：回答 <code>0.42</code>、引用 5；断言过；judge citation=0 → fail；人判 pass→fail 覆盖后 <code>final_verdict=fail</code>、一致率 1/1、level L1 1/1；临时数据清理 204。</p>
    </article>
    <article class="choice">
      <div class="choice-no">FULL</div>
      <h3>全量</h3>
      <p>前端 86 文件 / 735 tests；后端 166 tests（串行跑，避免远端库抖动）；两端 tsc 0。</p>
    </article>
  </div>
  <div class="callout"><strong>真跑过 vs 代码路径存在：</strong>回答/断言/judge/人判/一致率与清理都真跑；多 case 与窄屏视觉留给 Lynx。qwen-plus 当 judge 本轮因 Key 无效未验，DeepSeek Flash 已验。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">08 · 与前后 story 的衔接</span>
    <h2>7.3 比数字，7.4 评回答</h2>
    <p class="section-sub">同一套 run 历史、基线与对照，换成答案指标继续用。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">FROM 7.1–7.3</div>
      <h3>题集、执行器、基线与对照</h3>
      <p>四表、单队列、快照冻结、baseline_run_id、逐条并排与两步删除都是前几格的交付；7.4 只换「评什么」。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">7.4 NOW</div>
      <h3>答案证据链</h3>
      <p>断言 + judge + 人判；运行页按模式切换；对照跨模式守卫。Epic 7 的评测闭环到这里完整。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">NEXT</div>
      <h3>回到 P3 主线</h3>
      <p>评测作为 Agent loop 的前置基线已就位；下一步按 epics 进 P3，多次采样/置信区间、pairwise、gold 挑选仍挂未排期。</p>
    </article>
  </div>
  <div class="callout strong"><strong>入口：</strong>epics.md › Story 7.4；sprint 7.4 = review，待 Lynx 浏览器验收。7.1–7.4 一起验收后，Epic 7 再决定是否收口。</div>
</section>`,
    },
    {
      type: 'html',
      html: `<footer class="footer"><span>Story 7.4 · 答案评测</span><span>Generated from the working tree · 2026-10-29</span></footer>`,
    },
  ],
}
