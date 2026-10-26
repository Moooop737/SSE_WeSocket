export default {
  "out": "/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic1-story4-resource-delete.html",
  "serverRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/server",
  "webRoot": "/Users/lynx/Documents/Dev/SSE_WeSocket/app/web",
  "title": "Epic 1 · Story 1.4 知识库查看与删除 · 带代码逐行讲解",
  "tocTitle": "Story 1.4",
  "tocSub": "资源删除 · 取消入库 · 带代码逐行讲解",
  "accent": "#9f1239",
  "accent2": "#881337",
  "accentDark": "#f9a8d4",
  "content": [
    {
      "type": "html",
      "html": "\n<header class=\"hero\">\n  <div class=\"hero-kicker\"><span>Knowledge Copilot</span><span>·</span><span>Epic 1</span><span>·</span><span>Story 1.4</span><span>·</span><span>2026-10-13 收口</span></div>\n  <h1>删除一条资源：<em>取消先按，数据后清</em></h1>\n  <p class=\"hero-sub\">这一格把「删资源」拆成两件事：界面上立刻看不见（软删 <code>deleted_at</code> 留痕），检索里立刻查不到（chunks 物理删，embeddings 经外键级联一起消失）。处理中的资源先用服务端持有的取消信号停掉；如果取消落在写库期间，还要把已经提交的 <code>ready</code> 撤回。</p>\n  <div class=\"meta-row\">\n    <span class=\"chip\"><strong>验收口径</strong> 后端能力 + API</span>\n    <span class=\"chip\"><strong>前端按钮</strong> 本 story 不计入</span>\n    <span class=\"chip\"><strong>实测</strong> 真库 + Ollama + 真 URL</span>\n    <span class=\"chip\"><strong>Review</strong> 三透镜 + 200 轮撞锁否证</span>\n  </div>\n  <div class=\"trace-pill\"><b>DELETE /resources/:id</b> → 204 · <b>POST /resources/:id/abort</b> → 202 · <b>GET /resources/:id</b> → 200/404（2.4 补丁）</div>\n</header>\n\n<section class=\"section\" id=\"conclusion-and-boundary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">BOUNDARY · 01</span>\n    <h2>一句话结论与 story 边界</h2>\n    <p class=\"section-sub\">先划清哪些是 1.4 的交付，哪些只是后来接上来的补丁；避免把 Epic 2/3 的能力记到这一格头上。</p>\n  </header>\n\n  <div class=\"callout strong\">\n    <strong>一句话：</strong>1.4 交付的是「删除语义 + 取消语义 + 防孤儿数据的写入守卫」。列表与查看只验收后端 API，界面按钮与轮询按 Lynx 定案不在本 story 验收范围内。\n  </div>\n\n  <div class=\"summary-grid\">\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">01</span>\n      <h3>软删留痕</h3>\n      <p><code>resources.deleted_at</code> 打时间戳，行还在；历史引用、审计和排障都还能看到「它曾经存在」。同一事务里把 chunks 物理删掉。</p>\n    </div>\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">02</span>\n      <h3>取消归服务端</h3>\n      <p>管线自己 <code>new AbortController()</code>，按 resourceId 登记进进程级 <code>Map</code>。任意请求都能按下，客户端断连反而不再有否决权。</p>\n    </div>\n    <div class=\"summary-card\">\n      <span class=\"summary-no\">03</span>\n      <h3>写入期兜底</h3>\n      <p>pg 写入不吃 signal。取消若落在 INSERT/UPDATE 之间，事务会提交成 ready；写完后必须再查一次 <code>Signal.aborted</code>，把那一笔撤回。</p>\n    </div>\n  </div>\n\n  <table class=\"file-table\">\n    <thead>\n      <tr><th style=\"width:34%\">能力 / 落点</th><th style=\"width:14%\">归属</th><th>说明</th></tr>\n    </thead>\n    <tbody>\n      <tr>\n        <td><code>DELETE /resources/:id</code><br><code>POST /resources/:id/abort</code></td>\n        <td><span class=\"badge b-34\">1.4</span></td>\n        <td>软删 + chunks 物理删 + embeddings FK CASCADE；处理中先按取消；abort 只取消不删，成功 202。</td>\n      </tr>\n      <tr>\n        <td><code>src/ingest/inflight.ts</code></td>\n        <td><span class=\"badge b-34\">1.4</span></td>\n        <td>进程级 <code>Map&lt;resourceId, AbortController&gt;</code>；remove 比对 controller，防旧任务的迟到 finally 摘掉新登记（ec36c9e 补丁）。</td>\n      </tr>\n      <tr>\n        <td>写入守卫与取消撤回</td>\n        <td><span class=\"badge b-34\">1.4</span></td>\n        <td>写入事务读行、转 ready 都带 <code>deleted_at IS NULL</code>；写完后发现取消则 <code>fail('入库取消')</code> 收回已提交的数据。</td>\n      </tr>\n      <tr>\n        <td>列表 / 查看</td>\n        <td><span class=\"badge b-pre\">现状</span></td>\n        <td>列表现在由 <code>routes/crud.ts</code> 的 hono-crud 注册（3.1 前置重构），软删过滤靠 <code>softDelete</code> 配置；详情 <code>GET /resources/:id</code> 是 2.4 补丁。</td>\n      </tr>\n      <tr>\n        <td>ingest 五段 stage / telemetry</td>\n        <td><span class=\"badge b-34\">3.4</span></td>\n        <td><code>runStage</code> 与 <code>StageSink</code> 包住 fetch/parse/chunk/embed/write；不是 1.4 的代码，页面里用徽章标出。</td>\n      </tr>\n      <tr>\n        <td>tsyringe 依赖注入</td>\n        <td><span class=\"badge\">DI</span></td>\n        <td>Epic 2 的装配改造：路由/工厂改为 <code>@injectable</code> / <code>@singleton</code>。1.4 时还是构造函数吃一个 deps 对象。</td>\n      </tr>\n      <tr>\n        <td>前端删除/取消按钮、列表轮询</td>\n        <td><span class=\"badge b-pre\">不计入</span></td>\n        <td>story 收口时按 Lynx 定案整体挂起，验收只到 API；<code>frontend-deferred.md</code> 记录 2026-10-14 界面轮后来才把按钮与轮询接上，仍不属于 1.4 的交付证据。</td>\n      </tr>\n      <tr>\n        <td><code>GET /resources/:id/chunks</code> 分页/搜索、<code>GET /stats</code></td>\n        <td><span class=\"badge b-pre\">现状</span></td>\n        <td>2026-10-23 资源详情分页与计数卡的后续 UI 补丁，不在 1.4 范围内；chunks 分页/搜索只在文件地图点名，/stats 在路由块里标出。</td>\n      </tr>\n      <tr>\n        <td>启动清扫 <code>markInterruptedAsFailed</code></td>\n        <td><span class=\"badge b-pre\">前置</span></td>\n        <td>Story 1.1 的 AC（启动时把遗留 processing 转 failed）；1.4 的取消链路依赖它兜住「进程重启后登记为空」这一种情况。</td>\n      </tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\">\n    <strong>为什么界面不算：</strong>1.4 的 AC 措辞是「打开知识库区」「点删除」这类界面语义，但当时前端没有列表轮询，processing 行根本不会被看到，<code>/abort</code> 没有可点的时刻。Lynx 拍板：按钮与轮询整体挂起，本 story 用 curl + SQL 验收后端行为。后来界面补上了，那是另一笔账。\n  </div>\n</section>\n<section class=\"section\" id=\"story-diagram\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">DIAGRAM · 04</span>\n    <h2>一眼看懂：删除处理中资源</h2>\n    <p class=\"section-sub\">DELETE 不是一条 SQL：先读状态，再决定是否按取消。</p>\n  </header>\n  <div class=\"meta-row\" style=\"margin:12px 0 14px\"><span class=\"chip\"><strong>3</strong>种状态</span><span class=\"chip\"><strong>2</strong>层删除</span><span class=\"chip\"><strong>1</strong>个取消开关</span></div>\n  <figure style=\"margin:0;border:1px solid var(--line);border-radius:14px;overflow:hidden;background:var(--panel);box-shadow:var(--shadow)\">\n  <div style=\"overflow-x:auto;-webkit-overflow-scrolling:touch\">\n    <iframe src=\"diagrams/epic1-story4-resource-delete.html?theme=light&amp;v=20261025c&amp;iframe=1\" title=\"Story 1.4 删除、取消与写守卫\" loading=\"lazy\" style=\"display:block;width:100%;min-width:820px;aspect-ratio:1136 / 676;border:0;background:var(--panel)\"></iframe>\n  </div>\n</figure>\n  <p class=\"section-sub\" style=\"margin:8px 0 0\"><a href=\"diagrams/epic1-story4-resource-delete.html\" target=\"_blank\" rel=\"noreferrer\">打开完整交互版</a> · 点节点看语义护照；小屏可横向滑动；完整版支持缩放 / 动效 / 路由。</p>\n<script>\n(function () {\n  var Frame = document.querySelector('#story-diagram iframe');\n  if (!Frame) return;\n  function sync() {\n    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';\n    var Src = Frame.getAttribute('src') || '';\n    var Next = /theme=(light|dark)/.test(Src)\n      ? Src.replace(/theme=(light|dark)/, 'theme=' + Theme)\n      : Src + (Src.indexOf('?') === -1 ? '?' : '&') + 'theme=' + Theme;\n    if (Next !== Src) Frame.setAttribute('src', Next);\n  }\n  new MutationObserver(sync).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });\n  sync();\n})();\n</script>\n  <div class=\"callout\" style=\"margin-top:14px\"><strong>读图：</strong><ul style=\"margin:8px 0 0 18px;padding:0\"><li>resources 软删留 deleted_at；chunks 物理删；embeddings 随 FK CASCADE 走。</li><li>处理中先 inflight.abort，再软删；按不下去就标 failed(入库中断)。</li><li>写守卫在事务里查 deleted_at，写完再查并撤回 ready。</li></ul></div>\n  <div class=\"callout\" style=\"margin-top:10px\"><strong>图外补充：</strong>图里没画前端删除按钮与列表轮询；它们按 1.4 的挂起项处理。</div>\n</section>\n\n\n<section class=\"section\" id=\"map\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">MAP · 02</span>\n    <h2>全局地图：四条链路各管一段</h2>\n    <p class=\"section-sub\">删除不是一条 SQL，而是「请求 → 取消 → 写入守卫 → 软删事务 → 检索过滤」五段接力。</p>\n  </header>\n\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>① 删除请求链</h3>\n      <ul class=\"flow-list\">\n        <li><span>形状校验</span><code>uuidOk → 400 E_BAD_ID</code></li>\n        <li><span>读活跃行</span><code>getResource（过滤 deleted_at）</code></li>\n        <li><span>处理中先取消</span><code>inflight.abort(id)</code></li>\n        <li><span>软删事务</span><code>UPDATE resources + DELETE chunks</code></li>\n        <li><span>响应</span><code>204 / 404 / 500</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>② 取消请求链</h3>\n      <ul class=\"flow-list\">\n        <li><span>校验 + 读行</span><code>404 / 409 E_NOT_PROCESSING</code></li>\n        <li><span>按登记</span><code>inflight.abort(id) → boolean</code></li>\n        <li><span>按不下去</span><code>409 E_NOT_INFLIGHT + 重读状态</code></li>\n        <li><span>按下去</span><code>202（异步生效）</code></li>\n        <li><span>行稍后</span><code>failed / 入库取消</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>③ 写入守卫链</h3>\n      <ul class=\"flow-list\">\n        <li><span>事务内读资源行</span><code>AND deleted_at IS NULL</code></li>\n        <li><span>写 chunks + embeddings</span><code>同事务</code></li>\n        <li><span>转 ready</span><code>rowCount=0 → E_RESOURCE_GONE</code></li>\n        <li><span>写后复查</span><code>Signal.aborted → 撤回</code></li>\n        <li><span>登记注销</span><code>finally remove(id, ctrl)</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>④ 防孤儿数据链</h3>\n      <ul class=\"flow-list\">\n        <li><span>chunks.resource_id</span><code>FK → resources ON DELETE CASCADE</code></li>\n        <li><span>embeddings.source_id</span><code>FK → chunks ON DELETE CASCADE</code></li>\n        <li><span>软删事务</span><code>DELETE chunks 带走向量</code></li>\n        <li><span>检索 SQL</span><code>JOIN resources ... deleted_at IS NULL</code></li>\n        <li><span>全库核对</span><code>orphan vectors = 0</code></li>\n      </ul>\n    </div>\n  </div>\n\n  <div class=\"callout\">\n    <strong>读图顺序：</strong>先看「删除请求链」建立骨架，再看「写入守卫链」理解竞态；最后两条是保证「检索不再命中」和「无孤儿向量」的底层约束。\n  </div>\n</section>\n\n<section class=\"section\" id=\"glossary\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">GLOSSARY · 03</span>\n    <h2>小白词典：这一页会反复出现的词</h2>\n    <p class=\"section-sub\">不追求教科书定义，只求读代码时不再卡住。</p>\n  </header>\n\n  <dl class=\"glossary\">\n    <div class=\"gloss\"><dt>软删（soft delete）</dt><dd>不删行，只把 <code>deleted_at</code> 写成当前时间。所有正常查询都带 <code>deleted_at IS NULL</code>，行就「看不见但还在」。</dd></div>\n    <div class=\"gloss\"><dt>物理删（hard delete）</dt><dd>真的 <code>DELETE FROM</code>。chunks 用物理删，因为它要立刻从 BM25/HNSW 索引里消失。</dd></div>\n    <div class=\"gloss\"><dt>FK CASCADE</dt><dd>外键上的「父行删了，子行自动跟着删」。<code>embeddings.source_id → chunks.id</code> 就是这条规则，所以删 chunks 不用手写删向量。</dd></div>\n    <div class=\"gloss\"><dt>AbortController</dt><dd>取消开关。调用 <code>ctrl.abort()</code> 后，<code>ctrl.signal.aborted</code> 变 true；fetch/embed 这类长操作收到 signal 会抛中断错。</dd></div>\n    <div class=\"gloss\"><dt>进程级 Map</dt><dd>只活在当前 Node 进程里的表。<code>Map&lt;resourceId, AbortController&gt;</code> 让「按取消」的路由找到「跑任务」的那只开关。</dd></div>\n    <div class=\"gloss\"><dt>事务（transaction）</dt><dd>一组 SQL 要么全成功、要么全回滚。写入 chunks、向量、转 ready 必须同事务，否则会出现「有向量没 chunk」这种半截数据。</dd></div>\n    <div class=\"gloss\"><dt>写守卫</dt><dd>在写库前/写库后再查一次条件（资源是否已删、是否已取消）。它补的是「signal 管不到 pg 调用」这段盲区。</dd></div>\n    <div class=\"gloss\"><dt>202 / 204</dt><dd>202 = 请求已接受、异步生效（abort 按下，行稍后才转 failed）；204 = 成功且没有响应体（软删完成）。</dd></div>\n  </dl>\n</section>\n\n<section class=\"section\" id=\"journey\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">WALK · 04</span>\n    <h2>一次「删除处理中资源」的旅行</h2>\n    <p class=\"section-sub\">点一步跳到对应代码行。顺序是请求视角，不是数据库执行顺序：取消先按下，软删事务可能还要等写入事务结束。</p>\n  </header>\n  <div class=\"journey\">\n    <button type=\"button\" class=\"journey-step\" data-goto=\"routes-core:64-68\"><span class=\"step-no\">01</span><span class=\"step-text\"><strong>先验 id 形状</strong><small>不是 UUID 直接 400，别把垃圾字符串丢给 pg 的 uuid 列</small></span><span class=\"step-code\">routes L64–68</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"routes-core:69-76\"><span class=\"step-no\">02</span><span class=\"step-text\"><strong>读活跃行，处理中先按取消</strong><small>getResource 已过滤软删；abort 按不下去就自己把状态收口成 failed</small></span><span class=\"step-code\">routes L69–76</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"inflight:27-32\"><span class=\"step-no\">03</span><span class=\"step-text\"><strong>内存里按下开关</strong><small>abort 只回答「此前有登记、现在按下了」，不碰数据库</small></span><span class=\"step-code\">inflight L27–32</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"ingest-write:154\"><span class=\"step-no\">04</span><span class=\"step-text\"><strong>管线在异步边界观测取消</strong><small>parse/chunk 是同步的，进写入前最后再看一眼 signal</small></span><span class=\"step-code\">ingest L154</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"ingest-write:168-169\"><span class=\"step-no\">05</span><span class=\"step-text\"><strong>写完再查一次，撤回 ready</strong><small>写入期间按下的取消，事务已提交成 ready —— 这一笔必须撤回</small></span><span class=\"step-code\">ingest L168–169</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"resource-softdelete:114-138\"><span class=\"step-no\">06</span><span class=\"step-text\"><strong>软删事务：留痕 + 清 chunks</strong><small>UPDATE resources 打 deleted_at，同一事务 DELETE chunks</small></span><span class=\"step-code\">resource L114–138</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"chunk-write-delete:150-153\"><span class=\"step-no\">07</span><span class=\"step-text\"><strong>向量随 chunks 级联消失</strong><small>embeddings.source_id 的 FK CASCADE 负责，不手写删向量</small></span><span class=\"step-code\">chunk L150–153</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"search-vector:33-43\"><span class=\"step-no\">08</span><span class=\"step-text\"><strong>检索 SQL 挡住已删资源</strong><small>向量路和 BM25 路都 JOIN resources 并带 deleted_at IS NULL</small></span><span class=\"step-code\">search L33–43</span></button>\n    <button type=\"button\" class=\"journey-step\" data-goto=\"resource-softdelete:169-197\"><span class=\"step-no\">09</span><span class=\"step-text\"><strong>进程重启后的兜底</strong><small>登记只在内存；启动清扫把遗留 processing 转 failed(入库中断)</small></span><span class=\"step-code\">resource L169–197</span></button>\n  </div>\n  <p class=\"journey-hint\">第 05 步是这一格最容易被「看起来没问题」骗过去的地方：写守卫只判 <code>deleted_at</code>，而 <code>/abort</code> 不删资源，所以只有写后复查能救「只取消不删除」这条路径。</p>\n</section>\n\n<section class=\"section\" id=\"files\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">FILES · 05</span>\n    <h2>文件地图：谁负责哪一段</h2>\n    <p class=\"section-sub\">按读代码顺序排列：先路由，再取消登记，再管线，最后数据层与检索。</p>\n  </header>\n\n  <table class=\"file-table\">\n    <thead><tr><th style=\"width:36%\">文件</th><th style=\"width:14%\">角色</th><th>这一格关心什么</th></tr></thead>\n    <tbody>\n      <tr><td><code>src/routes/resources.ts</code></td><td>HTTP</td><td>DELETE 软删、POST abort、id 校验、错误码映射；本页还标出 <code>/stats</code> 与 DI 外壳的后续补丁。</td></tr>\n      <tr><td><code>src/ingest/inflight.ts</code></td><td>登记处</td><td>进程级 Map；add/remove/abort 三个动作，全部不碰数据库。</td></tr>\n      <tr><td><code>src/ingest/ingest.ts</code></td><td>管线</td><td>建 controller、登记、fail/cancelled/failFrom、写后复查、finally 注销；stage 包裹是 3.4 补丁。</td></tr>\n      <tr><td><code>src/adapter/repo/resource.ts</code></td><td>数据层</td><td>软删事务、带 <code>deleted_at</code> 谓词的状态/标题更新、启动清扫、计数（后续补丁）。</td></tr>\n      <tr><td><code>src/adapter/repo/chunk.ts</code></td><td>数据层</td><td>写 chunks + 向量 + 转 ready 的同事务；写守卫；按资源删 chunks（向量级联）。</td></tr>\n      <tr><td><code>src/adapter/repo/search-vector.ts</code></td><td>检索</td><td>HNSW 向量候选，JOIN resources 时挡住软删行。</td></tr>\n      <tr><td><code>src/adapter/repo/search-lexical.ts</code></td><td>检索</td><td>ParadeDB BM25 候选，同样带软删谓词。</td></tr>\n      <tr><td><code>src/routes/crud.ts</code></td><td>列表/详情</td><td>resources 的 list/read 交给 hono-crud；<code>softDelete</code> 配置让列表默认排除已删行（2.4 与后续重构落点）。</td></tr>\n      <tr><td><code>db/migrations/20261010025742_create_core_tables.sql</code></td><td>Schema</td><td>两条 FK CASCADE 的源头；<code>deleted_at</code> 列也是 1.1 建表时留下的。</td></tr>\n    </tbody>\n  </table>\n\n  <div class=\"callout\">\n    <strong>不在本页展开：</strong><code>GET /:id/chunks</code> 的 <code>page/per_page/search</code> 只在文件地图里点名；<code>GET /stats</code> 在路由块里标为「现状」。二者都是 2026-10-23 的界面补丁。前端 <code>deleteResource</code> / <code>abortIngest</code> / 列表轮询是 2026-10-14 的界面轮，二者都只作为背景出现。\n  </div>\n</section>\n"
    },
    {
      "type": "code",
      "section": {
        "id": "code-and-annotations",
        "kicker": "CODE · 06",
        "title": "代码与逐行讲解",
        "subtitle": "每块代码都来自当前工作区的真实文件；点击右侧讲解会高亮对应行。徽章表示「这一行不是 1.4 写的」。",
        "body": "<div class=\"callout\"><strong>读法：</strong>先看 note 的标题与行号，再对照左侧代码。标 <span class=\"badge b-34\">3.4</span> 的是 stage/telemetry 补丁，标 <span class=\"badge\">DI</span> 的是 Epic 2 的依赖注入改造，标 <span class=\"badge b-pre\">现状</span> 的是后续重构的当前落点。</div>",
        "blocks": [
          {
            "id": "routes-core",
            "file": "src/routes/resources.ts",
            "lang": "ts",
            "ranges": [
              [
                17,
                48
              ],
              [
                55,
                62
              ],
              [
                64,
                104
              ],
              [
                194,
                196
              ]
            ],
            "title": "src/routes/resources.ts（节选：DI + DELETE + abort + stats + 入库调用）",
            "intro": "路由只做三件事：校验形状、读当前状态、把动作交给 repo 或 inflight。真正的数据一致性在下一层。",
            "notes": [
              {
                "lines": "31-48",
                "title": "DI 外壳：构造函数注入四个依赖",
                "badge": "DI",
                "body": "<p>Epic 2 的 tsyringe 改造把原来的 <code>{ repo, factory, inflight, pipelineConfig }</code> 入参换成了 <code>@inject(...)</code>。1.4 当时是显式 deps 对象；读旧 commit 时别被构造函数形状搞混。</p><p>四个依赖里，<code>InflightRegistry</code> 由容器保证单例；工厂与路由拿到的是同一只登记表，否则 <code>/abort</code> 永远按不到。</p>"
              },
              {
                "lines": "55-62",
                "title": "GET /stats：后续 UI 补丁",
                "badge": "现状",
                "body": "<p>状态计数卡用的接口，2026-10-23 前后才出现，不是 1.4 的交付。它只读 <code>deleted_at IS NULL</code> 的行，口径与列表一致。</p><p>文件头提醒：本路由必须先于 CRUD 挂载，否则 <code>/resources/stats</code> 会把 <code>stats</code> 当成资源 id。</p>"
              },
              {
                "lines": "64-68",
                "title": "先验 UUID 形状",
                "body": "<p><code>uuidOk</code> 把非法 id 挡在 400 <code>E_BAD_ID</code>，避免把它交给 pg 的 uuid 列、换回一个 500 <code>invalid input syntax for type uuid</code>。</p><p>这个函数由 DELETE、abort、chunks 三个端点共用；release 里的 A11 就是「第三个端点漏了校验」的修正。</p>"
              },
              {
                "lines": "69-76",
                "title": "DELETE：读行 → 处理中先按取消 → 软删",
                "body": "<p><code>getResource</code> 已经过滤 <code>deleted_at</code>，所以读不到就是 404，重复删除不会成功两次。</p><p>处理中先 <code>inflight.abort(id)</code>：先掐任务再标删，顺序反了会给已删资源补写一批 chunks。若按不下去（重启遗留/异进程），就用 <code>updateResourceStatus(id, 'failed', '入库中断')</code> 自己收口，别留一条永远 processing 的行——这是 ec36c9e 的补丁。</p><p>最后 <code>softDeleteResource</code> 返回 boolean：false 表示行不存在或早已软删，回 404；true 回 204，无响应体。</p>"
              },
              {
                "lines": "77-81",
                "title": "删除失败只回 500",
                "body": "<p>这里不把底层错误原样抛给客户端，只记 <code>E_DELETE</code> 日志，回统一文案。review 里提过「DELETE 等写入事务可能撞 5s 超时」——那种情况会走到这里，用户看到「删除失败」，但 abort 其实已经按下、行随后会转 failed。</p>"
              },
              {
                "lines": "83-99",
                "title": "POST /:id/abort：只取消，不删除",
                "body": "<p>三层判定：读不到 → 404；状态不是 processing → 409 <code>E_NOT_PROCESSING</code>；登记里没有 → 重读一次状态，回 409 <code>E_NOT_INFLIGHT</code>，不再猜「服务可能重启过」。</p><p>按下成功回 202，body 明说「不会转为已就绪，将在当前长操作结束后转 failed」。这是一条异步承诺：写入不是可中断的，行不会立刻变。</p>"
              },
              {
                "lines": "196",
                "title": "POST 入库不再把客户端连接当取消源",
                "body": "<p>调用是 <code>run(data, undefined, { sink })</code>：第二个参数（CallerSignal）显式传 <code>undefined</code>，不再传 <code>c.req.raw.signal</code>。客户端断连只会让响应写不出去，不会中断入库；node-server 对已关闭连接静默丢弃。</p><p>这是 build2 的行为翻转。旧写法下，curl 2s 掐连会让资源变 <code>failed(入库取消)</code>；改后同样掐连，任务照样跑完 ready。防泄漏改由 inflight.abort、fetch/embed 的 30s 超时、启动清扫三条服务端腿负责。</p>"
              }
            ]
          },
          {
            "id": "inflight",
            "file": "src/ingest/inflight.ts",
            "lang": "ts",
            "ranges": [
              [
                1,
                33
              ]
            ],
            "title": "src/ingest/inflight.ts（全文）",
            "intro": "一个 33 行的内存登记处。它是「服务端持有取消信号」的全部实现，没有数据库、没有队列。",
            "notes": [
              {
                "lines": "1-8",
                "title": "文件头就是契约",
                "body": "<p>持有者是管线：建行之后 <code>add</code>，结束时在 <code>finally</code> 里 <code>remove</code>。登记只在内存，进程重启即空，遗留 processing 行交给启动清扫。</p><p><code>abort()</code> 只回答「此前有登记、且现在按下了」，不校验资源状态、不碰数据库——那是调用方的事。这一分工让路由可以在读库之后、软删之前安全地按一下。</p>"
              },
              {
                "lines": "19-25",
                "title": "add / remove：remove 必须比对 controller",
                "body": "<p><code>remove(Id, Ctrl)</code> 先比对 <code>this.inflight.get(Id) === Ctrl</code> 再删。若同一个 id 被重新入库复用，旧 run 的迟到 <code>finally</code> 不该把新任务的登记摘掉（review A5，ec36c9e 修复）。</p><p>代价是调用方必须把 controller 一起传进来；只传 id 的旧签名已经不存在。</p>"
              },
              {
                "lines": "27-32",
                "title": "abort：按下并回答 boolean",
                "body": "<p>没有登记返回 false；有登记就 <code>ctrl.abort()</code> 并返回 true。注意它<strong>不会</strong>顺手删登记——删登记是持有方的 <code>finally</code> 的职责，重复 abort 是 no-op。</p><p>这也意味着：如果任务已经自然跑完、但 <code>finally</code> 还没执行，abort 会返回 true 却什么也取消不了；路由随后读库会看到 ready，这是 review E2 描述的那个窄窗口。</p>"
              }
            ]
          },
          {
            "id": "ingest-start",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                53,
                93
              ]
            ],
            "title": "src/ingest/ingest.ts · 起跑段（L53–93）",
            "intro": "建行、造开关、登记、定义失败出口。取消信号从这一段的第 72 行开始由服务端持有。",
            "notes": [
              {
                "lines": "53-54",
                "title": "入口先判调用方信号",
                "body": "<p>如果 batch/worker 传进来的信号已经 aborted，直接返回 <code>E_CANCELLED</code>，不建行。这是 review E4 的修正：不要在「进来就已取消」时还建一条 processing 行再立刻标失败。</p><p>注意这里的返回是 <code>resource: null</code>：建行之前没有行可留痕。</p>"
              },
              {
                "lines": "55",
                "title": "StageSink 选择",
                "badge": "3.4",
                "body": "<p>3.4 加的 <code>Options.sink</code>：没有传就用 <code>NoopStageSink</code>。它只影响观测记录，不改变入库结果。1.4 时这一行不存在。</p>"
              },
              {
                "lines": "62-70",
                "title": "先建 processing 行",
                "body": "<p>URL 用 hostname 占位，粘贴内容用 <code>urn:kc:paste:&lt;uuid&gt;</code> 当 <code>data_uri</code>。行先落库，是为了让前端/轮询有一个可显示的「处理中」对象，也让取消能按 id 定位。</p><p>注意：建行发生在登记之前。如果建行本身失败，没有 id、也没有登记可摘，外层走 <code>notStarted</code>。</p>"
              },
              {
                "lines": "72-74",
                "title": "服务端造开关，调用方信号并进来",
                "body": "<p><code>ctrl</code> 由管线自己 <code>new</code>，按 <code>resource.id</code> 登记；<code>CallerSignal</code>（batch 整批中止、worker 停机）通过 <code>AbortSignal.any</code> 并进来，任一触发即掐。</p><p>为什么路由不能自己 new 一个 controller 传进来？因为 <code>resource.id</code> 是 <code>createResource</code> 之后才有的；只能靠「登记 + 按 id 找」。</p>"
              },
              {
                "lines": "76-84",
                "title": "fail：先清 chunks，再标 failed",
                "body": "<p><code>fail</code> 是统一的失败出口：先 <code>deleteChunksByResource</code> 清残余，再 <code>updateResourceStatus(..., 'failed', Reason)</code>。落库改状态<strong>绝不复用 Signal</strong>——一个已 abort 的 signal 会连「失败留痕」一起杀掉。</p><p>ec36c9e 把这里改成一次故障一行结构化日志：<code>code</code> 给人分支、<code>reason</code> 进库、<code>cause</code> 只进日志；主动取消用 log 级而不是 error 级。</p>"
              },
              {
                "lines": "86-89",
                "title": "cancelled / failFrom：三种失败不塌成一种",
                "body": "<p><code>cancelled()</code> 固定发 <code>E_CANCELLED</code> + 「入库取消」。<code>failFrom</code> 先看 <code>Signal.aborted</code>，再看错误名是不是 <code>TimeoutError</code>，最后才落到通用失败。</p><p>这条分流是 review C3/E3 的修正：各 stage 自带 30s 超时，超时炸时 <code>Signal.aborted</code> 仍是 false；如果不看 <code>err.name</code>，超时、真错误会被一起写成「入库失败」。</p>"
              },
              {
                "lines": "91-93",
                "title": "ctx 与登记都进 try",
                "body": "<p><code>inflight.add</code> 放在 <code>try</code> 里面（review A4）：这样从 add 到 <code>finally</code> 之间任何抛错都不会漏掉注销，登记只增不减的问题被堵住。</p><p>代价是：如果 add 自身抛错，<code>finally</code> 仍会执行 remove，但 remove 比对 controller 不匹配，等于 no-op，安全。</p>"
              }
            ]
          },
          {
            "id": "ingest-write",
            "file": "src/ingest/ingest.ts",
            "lang": "ts",
            "ranges": [
              [
                154,
                181
              ]
            ],
            "title": "src/ingest/ingest.ts · 写入与收尾（L154–181）",
            "intro": "这一格最关键的 16 行：写入不是可中断的，所以写完必须再看一次 signal。",
            "notes": [
              {
                "lines": "154",
                "title": "进写入前最后一次异步边界检查",
                "body": "<p>embed 已经返回，接下来是 pg 写入。在调用 <code>writeChunksWithEmbeddings</code> 之前再判一次 <code>Signal.aborted</code>，能省掉一笔注定要撤回的写入。</p><p>但这只是优化，不是保证：取消完全可能在这行之后、事务提交之前落下。</p>"
              },
              {
                "lines": "156-167",
                "title": "write 阶段：3.4 的 runStage 包裹",
                "badge": "3.4",
                "body": "<p><code>runStage(Sink, 'write', ...)</code> 是 3.4 的 telemetry：记录 chunk_count、耗时、成败。真正的写入仍是 <code>repo.writeChunksWithEmbeddings</code>，同一事务里写 chunks + embeddings + 转 ready。</p><p>读 1.4 的旧 commit 时，这里是一段裸 <code>await repo.writeChunksWithEmbeddings(...)</code>；不要把 stage 包裹算成删除逻辑的一部分。</p>"
              },
              {
                "lines": "168-169",
                "title": "真实坑 C1：写完再查，撤回 ready",
                "body": "<p>写入事务提交后，资源已经是 ready + 全量 chunks。如果此时 <code>Signal.aborted</code> 为 true，说明取消落在写入期间——必须走 <code>cancelled()</code>：<code>fail</code> 会先删 chunks，再把行标成 failed(入库取消)。</p><p>review 的复现序列是：<code>processing/chunks=0 → ready/chunks=16 → ready/chunks=0 → failed/chunks=0/入库取消</code>。中间那一帧 <code>ready/chunks=16</code> 就是 C1 本身；修复后终态被拉回 failed。</p><p>没有这两行，<code>/abort</code> 的 202 就在说谎：它承诺「不会转为已就绪」，但只取消不删除时 <code>deleted_at</code> 仍是 NULL，写守卫的谓词形同不存在。</p>"
              },
              {
                "lines": "171-176",
                "title": "成功后返回 ready；E_RESOURCE_GONE 单独映射",
                "body": "<p>写入返回后，<code>thinPage</code> 判断是否「可能抓不全」，只带 warning，不改变 ready。返回的 resource 是内存对象，status 改成 ready、error_reason 清空。</p><p>catch 里先认 <code>E_RESOURCE_GONE</code>（写入期间资源被删），映射成「已删除，写入中止」；其他错误再走 <code>failFrom</code>，区分取消/超时/普通失败。</p>"
              },
              {
                "lines": "177-181",
                "title": "外层 catch 与 finally 注销",
                "body": "<p>外层 catch 兜住 fetch/parse/chunk 等未预期错误，统一走 <code>failFrom</code>。finally 无条件 <code>inflight.remove(resource.id, ctrl)</code>，这是唯一防登记泄漏的点。</p><p>注意 finally 用的是 <code>ctrl</code> 而不是 id：如果同一个 id 已经被新任务复用，旧任务的迟到 finally 不会摘掉新登记。</p>"
              }
            ]
          },
          {
            "id": "resource-softdelete",
            "file": "src/adapter/repo/resource.ts",
            "lang": "ts",
            "ranges": [
              [
                95,
                138
              ],
              [
                169,
                197
              ]
            ],
            "title": "src/adapter/repo/resource.ts（写守卫 + 软删事务 + 启动清扫）",
            "intro": "软删是这一格的数据层核心；上面的状态/标题更新也带 deleted_at 谓词，避免已删行继续漂移。",
            "notes": [
              {
                "lines": "95-105",
                "title": "改状态也带 deleted_at 谓词",
                "body": "<p>review A7 指出：如果只有写入路径加谓词，<code>updateResourceStatus</code>（<code>fail()</code> 用）和 <code>updateResourceTitle</code> 仍会无条件写，用户拿到 204 之后那条已删行的 status/error_reason 还会继续变。</p><p>现在两条 UPDATE 都带 <code>AND deleted_at IS NULL</code>：已删行不再被改写，审计上更干净。</p>"
              },
              {
                "lines": "107-112",
                "title": "标题更新同样受守卫",
                "body": "<p>解析出真标题后回填，是纯装饰性写入；但同样不能碰已删行。review E6 还建议把标题写失败降级成日志，避免一次装饰性失败把整条入库判成 <code>入库失败</code>——这是另一笔未在本页展开的账。</p>"
              },
              {
                "lines": "114-138",
                "title": "softDeleteResource：先留痕，再物理删 chunks",
                "body": "<p>事务里先 <code>UPDATE resources SET deleted_at = now() ... WHERE deleted_at IS NULL</code>；<code>rowCount=0</code> 说明行不存在或早已软删，回滚并返回 false。</p><p>然后 <code>DELETE FROM chunks WHERE resource_id = $1</code>。embeddings 不在这里删：<code>embeddings.source_id → chunks.id ON DELETE CASCADE</code> 会带走它们。最后 COMMIT，返回 true，路由回 204。</p><p>为什么软删和 chunks 删除必须同事务？如果先删 chunks 再软删失败，资源还在列表里但检索数据没了；反过来则会让已删资源继续被检索命中。同事务保证两者同进同退。</p>"
              },
              {
                "lines": "169-197",
                "title": "启动清扫：进程重启后的兜底",
                "body": "<p>登记表只在内存，进程被杀后全空，库里可能留下 processing 行。启动时 <code>markInterruptedAsFailed</code> 查出所有未删的 processing，先删 chunks，再统一转 <code>failed / 入库中断</code>。</p><p>这是 Story 1.1 的 AC，但 1.4 的取消链路依赖它：<code>/abort</code> 对「processing 但不在本进程登记」的行只能回 409 <code>E_NOT_INFLIGHT</code>，最终收口要靠下一次启动清扫或 DELETE 的 <code>入库中断</code> 分支。</p>"
              }
            ]
          },
          {
            "id": "chunk-write-delete",
            "file": "src/adapter/repo/chunk.ts",
            "lang": "ts",
            "ranges": [
              [
                78,
                153
              ]
            ],
            "title": "src/adapter/repo/chunk.ts（同事务写入 + 写守卫 + 删 chunks）",
            "intro": "「要么全写、要么全滚」的边界在这一块。写守卫和删除清理也在这里会合。",
            "notes": [
              {
                "lines": "78-93",
                "title": "事务开头：先确认资源还活着",
                "body": "<p>开事务后第一件事是 <code>SELECT data_uri FROM resources WHERE id = $1 AND deleted_at IS NULL</code>。查不到就抛 <code>E_RESOURCE_GONE</code>，整笔写入还没开始就结束。</p><p>这是 review E5 的修正：旧代码直接 <code>res.data_uri</code>，行不存在时会得到 <code>undefined.data_uri</code> 的 TypeError，而不是一句干净的中止原因。</p>"
              },
              {
                "lines": "96-109",
                "title": "批量 INSERT chunks",
                "body": "<p>用 <code>$1..$n</code> 拼多值 INSERT，<code>RETURNING id, chunk_index</code> 拿回数据库生成的 chunk id。后面写 embeddings 需要 <code>source_id</code>，所以必须按 <code>chunk_index</code> 建一张映射表。</p><p>这里没有逐条插入：一次事务、一条多值 INSERT，减少往返；代价是 chunk 数极大时会逼近 pg 参数上限，归到「写入分批」那条后续账。</p>"
              },
              {
                "lines": "110-128",
                "title": "写 embeddings：source_id 指向 chunk",
                "body": "<p><code>idByIndex.get(chunk_index)</code> 找回 chunk id，<code>vecToHalfvecStr</code> 把 number[] 变成 halfvec 字面量。写入的 <code>source_id</code> 就是 <code>chunks.id</code>，这正是 FK CASCADE 的父键。</p><p>chunks 与 embeddings 在同一事务里：不会出现「chunk 已落、向量没落」或「向量已落、行还 processing」。</p>"
              },
              {
                "lines": "130-139",
                "title": "写守卫：rowCount=0 就整笔回滚",
                "body": "<p>转 ready 的 UPDATE 带 <code>AND deleted_at IS NULL</code>。如果软删发生在 embed 之后、写入期间，这一句 <code>rowCount=0</code>，抛 <code>E_RESOURCE_GONE</code>，catch 里 ROLLBACK，整笔 chunks+embeddings 都不落库。</p><p>这条守卫救的是「删除 + 写入」这条路；但它<strong>救不了「只 abort 不删除」</strong>：<code>/abort</code> 不写 <code>deleted_at</code>，谓词通过，事务照常提交 ready。这正是 C1 必须靠写后复查补上的原因。</p>"
              },
              {
                "lines": "140-147",
                "title": "回滚不吞真因",
                "body": "<p>catch 里先 <code>ROLLBACK</code>，回滚自身失败只记 <code>E_ROLLBACK</code>，不覆盖原始错误；最后 <code>client.release()</code> 把连接还给池。</p><p>如果回滚错误顶掉真因，日志里只会看到「回滚失败」，真正该看的 <code>E_RESOURCE_GONE</code> 或约束冲突就丢了。</p>"
              },
              {
                "lines": "150-153",
                "title": "deleteChunksByResource：一条 DELETE 带走向量",
                "body": "<p>只写 <code>DELETE FROM chunks WHERE resource_id = $1</code>，不手写删 embeddings。FK 的 <code>ON DELETE CASCADE</code> 负责级联；这也是 handoff 里「孤儿向量 0」的底层依据。</p><p>它是无事务单语句清理，和软删事务里的那条 DELETE 故意不合并：一个要跟 resources 的 deleted_at 同进同退，一个是失败清理/启动清扫的独立动作。</p>"
              }
            ]
          },
          {
            "id": "search-vector",
            "file": "src/adapter/repo/search-vector.ts",
            "lang": "ts",
            "ranges": [
              [
                20,
                58
              ]
            ],
            "title": "src/adapter/repo/search-vector.ts（向量路软删过滤）",
            "intro": "检索侧不依赖「chunks 已删」这一事实，SQL 自己再挡一道。",
            "notes": [
              {
                "lines": "20-31",
                "title": "维度参数先校验",
                "body": "<p><code>Dim</code> 只接受正整数且必须与查询向量长度一致。它随后被拼进 SQL 的 <code>::halfvec(N)</code> 类型修饰符（不能绑定参数），所以这道校验是该处唯一的注入防线。</p>"
              },
              {
                "lines": "33-43",
                "title": "JOIN resources 时挡住软删行",
                "body": "<p>向量候选从 <code>embeddings</code> 出发，JOIN <code>chunks</code> 再 JOIN <code>resources</code>，资源侧带 <code>deleted_at IS NULL</code>。</p><p>为什么 chunks 已经物理删了还要这一道？因为「软删刚发生、chunks 清理尚未完成」的窗口里，chunks 可能还在；SQL 谓词让检索从第一毫秒就不再命中。这是纵深防御，不是重复。</p>"
              },
              {
                "lines": "45-52",
                "title": "只交候选，不算分",
                "body": "<p>相似度 <code>1 - 余弦距离</code> 在 SQL 里算好带出，但阈值过滤、RRF 名次融合归 <code>retrieve/</code>。本层只负责「按维度取 top-k 候选」。</p>"
              },
              {
                "lines": "55-58",
                "title": "dimensionsInStore：只数向量事实",
                "body": "<p>它数的是 <code>embeddings</code> 里实际有哪些维度，不看资源是否软删。用途是检索前的混维判定；如果库不可达就抛，由调用方处置。</p>"
              }
            ]
          },
          {
            "id": "search-lexical",
            "file": "src/adapter/repo/search-lexical.ts",
            "lang": "ts",
            "ranges": [
              [
                19,
                43
              ]
            ],
            "title": "src/adapter/repo/search-lexical.ts（BM25 路软删过滤）",
            "intro": "词法路与向量路口径必须一致，否则删掉的资源还能从 BM25 漏回来。",
            "notes": [
              {
                "lines": "24-33",
                "title": "同一道 resources 谓词",
                "body": "<p><code>chunks c JOIN resources r ON r.id = c.resource_id AND r.deleted_at IS NULL</code>，与向量路逐字同口径。BM25 索引建在 chunks 上，chunks 一旦被物理删，索引项也随之消失；谓词兜住删除事务尚未提交的窗口。</p><p>查询用 <code>paradedb.match_disjunction('content', $1)</code>：把问句交给索引的同一分词器，token 之间取 OR。文件头记录了裸串 <code>@@@</code> 会抛错/静默 0 命中的实测。</p>"
              },
              {
                "lines": "35-42",
                "title": "输出形状与向量路对齐",
                "body": "<p>同样返回 <code>ChunkCandidate</code>：<code>similarity: null</code>、<code>lexicalScore</code> 有值。谁融合、谁定阈值不在这层，保证两条路可以互换/合并。</p>"
              }
            ]
          },
          {
            "id": "crud-list",
            "file": "src/routes/crud.ts",
            "lang": "ts",
            "ranges": [
              [
                28,
                43
              ],
              [
                144,
                161
              ]
            ],
            "title": "src/routes/crud.ts（列表 / 详情 / 软删口径）",
            "intro": "现在的列表与详情不在 resources.ts，而由 hono-crud 统一生成；1.4 只保留「软删行不可见」这条语义。",
            "notes": [
              {
                "lines": "30-39",
                "title": "resources 只开 list/read",
                "badge": "现状",
                "body": "<p>3.1 前置重构把四张表的 CRUD 收到这里。resources 故意只开 list/read：建必须走入库管线，删必须走 1.4 的取消语义，不能交给通用 CRUD。</p><p>列表支持 status/content_type/时间过滤、title/source 搜索、排序与分页；默认每页 1000，前端概览页用得上。</p>"
              },
              {
                "lines": "40",
                "title": "GET /resources/:id 详情",
                "badge": "2.4",
                "body": "<p>这是 2.4「来源删除提示」补丁的后端落点：前端打开引用抽屉时按需查详情，404 就显示「来源已删除 · 以下为回答时的快照」。</p><p>1.4 的 AC 只要求「看到库里有哪些资源」，没有这条详情端点；不要把快照降级算进 1.4。</p>"
              },
              {
                "lines": "42-43",
                "title": "响应信封",
                "body": "<p>list 回 <code>{ resources, pagination }</code>，read 回 <code>{ resource }</code>。字段名由 <code>envelopeFor</code> 统一，路由层不再各自拼。</p>"
              },
              {
                "lines": "144-161",
                "title": "modelOf：deleted_at 交给 hono-crud 当 softDelete",
                "badge": "现状",
                "body": "<p>只要表里有 <code>deleted_at</code>，就登记 <code>softDelete: { field: 'deleted_at' }</code>。hono-crud 的 list/read 默认加 <code>deleted_at IS NULL</code>，只有显式 <code>withDeleted</code> / <code>onlyDeleted</code> 才看得到已删行。</p><p>1.4 的「列表不显示已删资源」现在由这条配置承接；路由里不再手写列表 SQL。这也是为什么页面把列表标成「现状」而不是 1.4 的新代码。</p>"
              }
            ]
          },
          {
            "id": "migration-fk",
            "file": "db/migrations/20261010025742_create_core_tables.sql",
            "lang": "sql",
            "ranges": [
              [
                5,
                16
              ],
              [
                18,
                42
              ]
            ],
            "title": "db/migrations/20261010025742_create_core_tables.sql（FK CASCADE 源头）",
            "intro": "无孤儿向量不是靠应用层勤快，而是库级约束兜底。",
            "notes": [
              {
                "lines": "5-16",
                "title": "resources.deleted_at：软删的落点",
                "badge": "前置",
                "body": "<p>建表时就留了 <code>deleted_at timestamptz</code>。1.4 的软删只是往这一列写时间戳；行本身不删，所以历史引用、审计都还有得查。</p>"
              },
              {
                "lines": "18-30",
                "title": "chunks.resource_id → resources ON DELETE CASCADE",
                "badge": "前置",
                "body": "<p>chunks 是物理删的：<code>DELETE FROM chunks WHERE resource_id = ...</code>。反过来，如果哪天真的硬删 resources 行，chunks 也会被级联带走。</p><p>注意：1.4 的软删<strong>不会</strong>触发这条资源的 CASCADE（因为行还在），所以应用层必须显式删 chunks；embeddings 的级联才是自动的。</p>"
              },
              {
                "lines": "32-42",
                "title": "embeddings.source_id → chunks ON DELETE CASCADE",
                "badge": "前置",
                "body": "<p>删 chunks 时，embeddings 自动消失。这就是「无孤儿向量」的库级保证，也是 handoff 里那条全库核对 SQL 的依据。</p><p>本迁移里的列名是 <code>dim</code>，后续迁移 <code>20261010060331_rename_embedding_dim_to_dimension.sql</code> 改成了 <code>dimension</code>；读当前代码时以 <code>dimension</code> 为准，别被这条历史 DDL 误导。</p>"
              }
            ]
          }
        ]
      }
    },
    {
      "type": "html",
      "html": "\n<section class=\"section\" id=\"decisions-and-pitfalls\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">TRADEOFFS · 07</span>\n    <h2>关键取舍与踩过的坑</h2>\n    <p class=\"section-sub\">这一节回答「为什么不是另一种写法」，以及哪些坑是实测出来的、不是推演出来的。</p>\n  </header>\n\n  <div class=\"choice-grid\">\n    <div class=\"choice\">\n      <span class=\"choice-no\">01</span>\n      <h3>软删 resources + 物理删 chunks</h3>\n      <p>资源行要留痕（历史引用、审计、排障），所以只写 <code>deleted_at</code>；检索数据要立刻消失，所以 chunks 真删。两者放同一事务，避免「列表里没了但还搜得到」或「搜不到了但列表还在」。</p>\n      <p><strong>否掉了：</strong>整行硬删（历史引用失去锚点）、chunks 也软删（BM25/HNSW 索引里仍留数据，检索必须再加一层过滤，且索引会膨胀）。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">02</span>\n      <h3>取消开关归服务端，不归 HTTP 连接</h3>\n      <p>管线自己 <code>new AbortController()</code>，按 resourceId 登记。任意请求都能按，客户端断连不再是否决票。</p>\n      <p><strong>为什么：</strong>客户端断连就取消，会让「批量上传后关页面」变成灾难；防泄漏改由三条服务端腿保证：inflight.abort、fetch/embed 各自的 30s 超时、启动清扫。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">03</span>\n      <h3><code>/abort</code> 只取消不删除</h3>\n      <p>取消是「停止任务」，删除是「移除资源」，两个意图分开。abort 成功回 202，行稍后转 failed(入库取消) 但仍在列表里；用户想清掉再按 DELETE。</p>\n      <p><strong>否掉了：</strong>abort 顺手软删（会让「取消」变成不可逆的破坏性动作，也混淆两个 AC）。</p>\n    </div>\n    <div class=\"choice\">\n      <span class=\"choice-no\">04</span>\n      <h3>DELETE 遇 processing 先 abort 再软删</h3>\n      <p>顺序反了会给已删资源补写一批 chunks。先按取消把窗口缩到最小，再进软删事务；软删事务里的 <code>deleted_at</code> 谓词负责兜住残余竞态。</p>\n      <p><strong>按不下去怎么办：</strong>（重启遗留/异进程）当前代码用 <code>updateResourceStatus(id, 'failed', '入库中断')</code> 自己收口，避免留下永远 processing 的行。</p>\n    </div>\n  </div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>真实坑 C1：取消落在写入期，事务已提交成 ready。</strong>写入不是可中断的：pg 调用不吃 signal，写入前最后一次检查之后，取消仍可能落下。修复是写完再查 <code>Signal.aborted</code>，走 <code>cancelled()</code> 撤回。复现序列：<code>processing/chunks=0 → ready/chunks=16 → ready/chunks=0 → failed/chunks=0/入库取消</code>。中间那帧 ready 就是 bug 本身——202 承诺了「不会转为已就绪」，但只 abort 不删除时 <code>deleted_at</code> 仍为 NULL，写守卫谓词通过，事务照常提交。</li>\n    <li><strong>死锁断言被 200 轮实测否证，不是「没遇到」。</strong>review 原推理：写入方 INSERT chunks → UPDATE resources，软删方 UPDATE resources → DELETE chunks，锁顺序相反 ⇒ 环等待。实测漏了一步：<code>INSERT INTO chunks</code> 会因外键先对父 resources 行加 KEY SHARE 锁，父行成为唯一排队点；两个方向都只有一把锁要排，环闭合不了。两个顺序各 100 轮（共 200 轮），<code>40P01</code> 死锁 0 次、<code>57014</code> 超时 0 次。</li>\n    <li><strong>真正换名字的残余风险：DELETE 会等整个写入事务。</strong>场景一证明 DELETE 会阻塞到写入 COMMIT。16 块 &lt;1ms 无感；等到几千块、INSERT 参数逼近 65535，写入事务可达数秒，DELETE 会撞 <code>query_timeout: 5000</code> 报 500 <code>E_DELETE</code>。用户看到「删除失败」，但 abort 其实已按下、行随后照样转 failed——取消成功了，删除没有。归口在「写入分批」，不是本轮的锁问题。</li>\n    <li><strong>写守卫只救「删除 + 写入」，救不了「只取消不删除」。</strong><code>AND deleted_at IS NULL</code> 的前提是有人写 <code>deleted_at</code>；<code>/abort</code> 不写。别看到守卫就以为取消路径也安全——这是 C1 存在的根因，也是 review 反向收获。</li>\n    <li><strong>登记只在内存，跨进程/重启即失效。</strong>第二个进程或重启后 <code>/abort</code> 诚实回 409 <code>E_NOT_INFLIGHT</code>；最终收口靠启动清扫或 DELETE 的「入库中断」分支。Redis 存不了 <code>AbortController</code>（进程内活对象，序列化即失效），跨进程只能传「取消意图」，所以本地 Map 无论如何都在。</li>\n    <li><strong>取消延迟有下限：同步 parse/chunk 是地板。</strong>parser 与 chunker 是同步的，这段时间事件循环被占，连 DELETE/abort 请求本身都进不来；只能在异步边界观测取消，最坏要等当前同步段或写事务跑完。</li>\n  </ul>\n</section>\n\n<section class=\"section\" id=\"verification-commands\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">VERIFY · 08</span>\n    <h2>可复制的验证命令</h2>\n    <p class=\"section-sub\">每条都标了证据等级：<strong>历史真跑过</strong>（2026-10-13 收口时真库 + Ollama + 真 URL）或<strong>代码路径存在、本轮未重跑</strong>。本轮只做静态校验，没有起服务、没有动数据库。</p>\n  </header>\n\n  <div class=\"callout strong\">\n    <strong>先准备：</strong>以下命令默认在 <code>app/server</code> 下执行，服务跑在 <code>127.0.0.1:3000</code>，<code>DATABASE_URL</code> 已在 <code>.env</code>。先 <code>set -a; . ./.env; set +a</code> 把连接串导入 shell。命令会读写本地库，别对非测试库执行。\n  </div>\n\n  <div class=\"test-grid\">\n    <div class=\"test-card\">\n      <h3>1. 删一条 ready 资源：204 + 留痕 + 0 chunks</h3>\n      <p class=\"test-note\">历史真跑过（build1，真库）。</p>\n      <pre class=\"snippet\"><code>cd app/server\nset -a; . ./.env; set +a\nID=$(psql \"$DATABASE_URL\" -Atc \"SELECT id FROM resources WHERE status='ready' AND deleted_at IS NULL LIMIT 1\")\n[ -n \"$ID\" ] || { echo 'no ready resource'; exit 1; }\npsql \"$DATABASE_URL\" -c \"SELECT count(*) AS chunks_before FROM chunks WHERE resource_id='$ID'\"\ncurl -i -X DELETE \"http://127.0.0.1:3000/resources/$ID\"\n# 期望 204，无 body\npsql \"$DATABASE_URL\" -c \"SELECT status, deleted_at IS NOT NULL AS deleted FROM resources WHERE id='$ID'\"\n# 期望 ready | t（行还在，只打时间戳）\npsql \"$DATABASE_URL\" -c \"SELECT (SELECT count(*) FROM chunks WHERE resource_id='$ID') AS chunks, (SELECT count(*) FROM embeddings e JOIN chunks c ON c.id=e.source_id WHERE c.resource_id='$ID') AS embeddings\"\n# 期望 0 | 0\npsql \"$DATABASE_URL\" -c \"SELECT count(*) AS orphan_vectors FROM embeddings e LEFT JOIN chunks c ON c.id=e.source_id WHERE c.id IS NULL\"\n# 期望 0</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>2. 删 processing 资源：先 abort，再软删</h3>\n      <p class=\"test-note\">历史真跑过（build2，真 URL 入库中 DELETE）：204，行 <code>failed | 入库取消</code>、<code>deleted_at</code> 已置、chunks 0。下面用 SQL 造行，属于「代码路径存在、本轮未重跑」。</p>\n      <pre class=\"snippet\"><code>ID=$(psql \"$DATABASE_URL\" -Atc \"INSERT INTO resources (title, data_uri, content_type, status) VALUES ('probe-processing','urn:kc:probe:del','plaintext','processing') RETURNING id\")\ncurl -i -X DELETE \"http://127.0.0.1:3000/resources/$ID\"\n# 期望 204\npsql \"$DATABASE_URL\" -c \"SELECT status, error_reason, deleted_at IS NOT NULL AS deleted FROM resources WHERE id='$ID'\"\n# 无 inflight 登记（探针行）：期望 failed | 入库中断 | t\n# 真入库中：期望 failed | 入库取消 | t\npsql \"$DATABASE_URL\" -c \"DELETE FROM resources WHERE id='$ID'\"  # 清理探针</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>3. abort 一条 processing：202 + 行稍后转 failed</h3>\n      <p class=\"test-note\">历史真跑过（build2）：202；2s 内该行 <code>failed | 入库取消</code>、chunks 0、<strong>未软删</strong>。需要一条真在跑的任务；SQL 造的探针行没有登记，会回 409。</p>\n      <pre class=\"snippet\"><code>ID=$(psql \"$DATABASE_URL\" -Atc \"SELECT id FROM resources WHERE status='processing' AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1\")\ncurl -i -X POST \"http://127.0.0.1:3000/resources/$ID/abort\"\n# 期望 202 {\"message\":\"取消已按下，任务不会转为已就绪，将在当前长操作结束后转 failed\",\"resource_id\":\"...\"}\nsleep 2\npsql \"$DATABASE_URL\" -c \"SELECT status, error_reason, deleted_at IS NOT NULL AS deleted FROM resources WHERE id='$ID'\"\n# 期望 failed | 入库取消 | f\npsql \"$DATABASE_URL\" -c \"SELECT count(*) FROM chunks WHERE resource_id='$ID'\"  # 0</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>4. abort 的三种按不下去</h3>\n      <p class=\"test-note\">核心状态码历史真跑过（build2）；ec36c9e 把 <code>E_NOT_ABORTABLE</code> 拆成 <code>E_NOT_PROCESSING</code> / <code>E_NOT_INFLIGHT</code> 属代码路径、本轮未重跑。</p>\n      <pre class=\"snippet\"><code># ready 行\ncurl -i -X POST \"http://127.0.0.1:3000/resources/$READY_ID/abort\"\n# 期望 409 E_NOT_PROCESSING\n# 已软删行 / 不存在\ncurl -i -X POST \"http://127.0.0.1:3000/resources/$DELETED_ID/abort\"\n# 期望 404 E_NOT_FOUND\n# 垃圾 id\ncurl -i -X POST \"http://127.0.0.1:3000/resources/not-a-uuid/abort\"\n# 期望 400 E_BAD_ID\n# processing 但不在本进程登记（重启遗留）\n# 期望 409 E_NOT_INFLIGHT，body 带重读后的 status</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>5. 列表不再返回软删行</h3>\n      <p class=\"test-note\">代码路径存在、本轮未重跑。当前列表由 hono-crud 按 <code>softDelete</code> 配置自动加 <code>deleted_at IS NULL</code>；1.4 时是手写列表 SQL，语义相同。</p>\n      <pre class=\"snippet\"><code>ID=$(psql \"$DATABASE_URL\" -Atc \"SELECT id FROM resources WHERE deleted_at IS NOT NULL LIMIT 1\")\ncurl -s \"http://127.0.0.1:3000/resources?per_page=1000\" | jq -r '.resources[].id' | grep -x \"$ID\"   && echo 'FAIL: 已删资源出现在列表' || echo 'OK: 列表不含已删资源'\npsql \"$DATABASE_URL\" -c \"SELECT count(*) AS active FROM resources WHERE deleted_at IS NULL\"</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>6. 检索不再命中已删资源</h3>\n      <p class=\"test-note\">代码路径存在、本轮未重跑。删除后 chunks 已物理删，SQL 还有 <code>deleted_at</code> 谓词；两条路都不该再返回这个 resourceId。</p>\n      <pre class=\"snippet\"><code>ID=$(psql \"$DATABASE_URL\" -Atc \"SELECT id FROM resources WHERE deleted_at IS NOT NULL LIMIT 1\")\ncurl -s -X POST http://127.0.0.1:3000/retrieve   -H 'content-type: application/json'   -d '{\"query\":\"被删资源里的独特词\",\"limit\":10}'   | jq --arg id \"$ID\" '[.hits[] | select(.resourceId == $id)] | length'\n# 期望 0。若问句本身没命中任何东西，hits 为空也正常；\n# 关键断言是「已删 id 不出现」，不是「hits 必须非空」。</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>7. 类型检查与测试</h3>\n      <p class=\"test-note\">历史真跑过：1.4 收口时 <code>tsc --noEmit</code> EXIT=0、<code>vitest</code> 8 passed；2026-10-23 记录为 9 文件 / 31 条全绿。本轮未重跑。</p>\n      <pre class=\"snippet\"><code>cd app/server\nnpx tsc --noEmit\nnpx vitest run\n# 注意：这 8/31 条并不覆盖删除与取消本身。\n# review F1–F5 的结论是：把写守卫、inflight.add/remove、/abort 相关代码删掉，\n# 现有测试仍会全绿——本 story 的行为证据主要是人工 curl + 已删除的探针脚本。</code></pre>\n    </div>\n\n    <div class=\"test-card\">\n      <h3>8. 全库孤儿向量核对</h3>\n      <p class=\"test-note\">历史真跑过（handoff build2）：探针行全清后，库回到 1 行 / 27 chunks / 27 embeddings，孤儿向量 0。</p>\n      <pre class=\"snippet\"><code>psql \"$DATABASE_URL\" -c \"\nSELECT\n  (SELECT count(*) FROM resources WHERE deleted_at IS NULL) AS active_resources,\n  (SELECT count(*) FROM chunks) AS chunks,\n  (SELECT count(*) FROM embeddings) AS embeddings,\n  (SELECT count(*) FROM embeddings e LEFT JOIN chunks c ON c.id = e.source_id WHERE c.id IS NULL) AS orphan_vectors\n\"\n# orphan_vectors 期望 0</code></pre>\n    </div>\n  </div>\n\n  <div class=\"callout\">\n    <strong>不能复跑的证据：</strong>review 里那两次撞锁探针（<code>tmp-lockorder-probe.ts</code>、<code>tmp-abort-window-probe.ts</code>）跑完即删，200 轮死锁否证与 C1 的 2ms 采样序列只留在 review 文本里。它们是历史实测结论，不是本轮可复制的命令。\n  </div>\n</section>\n\n<section class=\"section\" id=\"story-continuity\">\n  <header class=\"section-head\">\n    <span class=\"kicker\">CONTINUITY · 09</span>\n    <h2>与前后 story 的衔接</h2>\n    <p class=\"section-sub\">1.4 把「删除 + 取消」的地基交出去，后面的检索、引用降级、观测都踩在它上面。</p>\n  </header>\n\n  <div class=\"flow-map\">\n    <div class=\"flow-card\">\n      <h3>上一格交进来</h3>\n      <ul class=\"flow-list\">\n        <li><span>1.1</span><code>resources/chunks/embeddings 建表 + FK CASCADE + 启动清扫</code></li>\n        <li><span>1.2</span><code>入库管线支持 AbortController</code></li>\n        <li><span>1.3</span><code>粘贴 Markdown/纯文本复用同一管线</code></li>\n      </ul>\n    </div>\n    <div class=\"flow-card\">\n      <h3>这一格交出去</h3>\n      <ul class=\"flow-list\">\n        <li><span>软删语义</span><code>deleted_at 留痕，chunks 物理删</code></li>\n        <li><span>取消语义</span><code>进程级 inflight + /abort 202</code></li>\n        <li><span>写守卫</span><code>deleted_at 谓词 + 写后撤回</code></li>\n        <li><span>检索口径</span><code>两条候选 SQL 都带软删谓词</code></li>\n      </ul>\n    </div>\n  </div>\n\n  <ul class=\"pitfall-list\">\n    <li><strong>→ 2.1 混合检索：</strong>「检索不得命中已软删资源」从 1.4 的写侧保证，升级为读侧 SQL 谓词（<code>search-vector.ts</code> / <code>search-lexical.ts</code>）。有了这条，取消信号与 409 类闸门从「必须」降级成「锦上添花」。</li>\n    <li><strong>→ 2.3 / 2.4 引用与原文回链：</strong>历史回答的引用不能依赖被删的 chunk 行。快照在写入时已内嵌进 messages；<code>GET /resources/:id</code> 返回 404 时前端显示「来源已删除」，内容仍可读。这条详情端点是 2.4 补丁，不是 1.4。</li>\n    <li><strong>→ 3.4 ingest 五段：</strong><code>runStage</code> 把 fetch/parse/chunk/embed/write 包成可观测阶段。取消/超时的行为不变，但日志与 trace_stages 能看到卡在哪一段。页面里相关行都带 <code>3.4</code> 徽章。</li>\n    <li><strong>→ Epic 2 DI：</strong>路由/工厂从「构造函数吃 deps 对象」改成 tsyringe 注入。<code>InflightRegistry</code> 仍是 <code>@singleton()</code>，工厂与路由共用同一实例——这条绑定不变，只是注入方式变了。</li>\n    <li><strong>→ 后续界面：</strong>删除/取消按钮与列表轮询在 2026-10-14 界面轮接上（<code>frontend-deferred.md</code> 已记闭合）。它们不是 1.4 的验收证据；本 story 收口时仍以 API + SQL 为准。</li>\n    <li><strong>→ P3 队列化：</strong>跨进程取消的终局是「从队列撤任务」，<code>InflightRegistry</code> 这一层可整体退役。Redis 存不了 <code>AbortController</code>，别走「把 Map 搬进 Redis」的回头路。</li>\n  </ul>\n\n  <div class=\"next-box\">\n    <p><strong>一句话带走：</strong>删除的难点不在 DELETE 语句，而在「取消可能落在写入期」和「软删后索引里不能留数据」。1.4 用「先 abort、写后复查、同事务物理删 chunks、FK CASCADE、检索再过滤」五道防线把这两件事钉住；后面的 story 只是在这个地基上加读取与观测。</p>\n    <div class=\"next-links\">\n      <a href=\"#conclusion-and-boundary\">回到边界</a>\n      <a href=\"#decisions-and-pitfalls\">再看坑</a>\n      <a href=\"#verification-commands\">跑验证</a>\n    </div>\n  </div>\n</section>\n\n<footer class=\"footer\">\n  <p>Story 1.4 走读页 · 代码来自 2026-10-24 当前工作区 · 生成配置与校验记录在 <code>_Agents/walkthroughs/.runs/epic1-story4/</code>。历史实测以 handoff / review 原文为准；本轮只做静态校验，未起服务、未动数据库。</p>\n</footer>\n"
    }
  ]
}
