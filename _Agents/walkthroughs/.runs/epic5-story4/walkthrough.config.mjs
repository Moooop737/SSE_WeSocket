export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic5-story4-codebases.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 5 · Story 5.4 代码库 ZIP · 文件树与预览 · 带代码逐行讲解',
  tocTitle: 'Story 5.4',
  tocSub: '独立 codebases 域 · 不解压 · manifest · 按需读条目',
  accent: '#6d28d9',
  accent2: '#0369a1',
  accentDark: '#c4b5fd',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 5 · STORY 5.4</span><span>CODEBASES · ZIP · TREE · PREVIEW</span></div>
  <h1>代码库，<em>只读不拆</em></h1>
  <p class="hero-sub">5.4 把代码库做成独立领域：ZIP 留在 MinIO，服务端只读中央目录做安全校验，把扁平 manifest 写进 DB；文件树与单文件预览按需从 ZIP 流式读，不解压到磁盘、不执行仓库内容。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>115 / 115</span>
    <span class="chip"><strong>前端</strong>612 / 612</span>
    <span class="chip"><strong>真跑</strong>MinIO + DB + 1493 条目 ZIP</span>
    <span class="chip"><strong>状态</strong>done</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 115</b> · <b>frontend 612</b> · <b>build green</b> · <b>live preview</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格交付什么，不交付什么</h2>
    <p class="section-sub">代码库不是知识库语料：不进 <code>resources</code>、不写 chunks/embeddings、不进检索，也没有资源回收站与 content_hash 去重。它复用 DB/ObjectStore/config/日志这些基础设施，领域语义全部独立。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / DOMAIN</div>
      <h3>独立 codebases 域</h3>
      <p>新表、新能力盒、新 <code>/codebases</code> 路由；状态只有四态 <code>uploading / processing / ready / failed</code>，硬删直接清行。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / SAFETY</div>
      <h3>不解压、不执行</h3>
      <p>complete 时只读 ZIP 中央目录：拒绝 <code>..</code>、绝对路径、反斜杠、重名、符号链接、设备文件、加密条目；不把任何条目写到文件系统。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / READ</div>
      <h3>manifest + 按需读</h3>
      <p>扁平清单持久化到 <code>manifest</code> jsonb；树由前端合成；预览用 S3 range reader 只读目标条目，文本一律 <code>text/plain</code> + nosniff。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 5.4：</strong>解压到工作区、sandbox 执行、Git clone、增量更新/版本对比、AST 依赖图与代码 RAG、ZIP 批量下载、资源回收站、content_hash 去重。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>db/migrations/20261027140000_create_codebases.sql</code></td><td>codebases 表、四状态 CHECK、manifest jsonb、data_uri 唯一</td></tr>
      <tr><td><code>src/adapter/repo/codebase.ts</code></td><td>行映射、列表、状态更新、ready 写入、启动清扫</td></tr>
      <tr><td><code>src/codebase/archive.ts</code></td><td>createUpload、complete（stat → 临时 ZIP → 校验 → ready）</td></tr>
      <tr><td><code>src/codebase/zip.ts</code></td><td>只读中央目录：路径/特殊文件/重名/加密校验与 manifest</td></tr>
      <tr><td><code>src/codebase/reader.ts</code></td><td>树、单文件流、原 ZIP 302 目标</td></tr>
      <tr><td><code>src/codebase/s3-reader.ts</code></td><td>yauzl 的 S3 range 适配器 + 1MB 块缓存</td></tr>
      <tr><td><code>src/codebase/purge.ts</code></td><td>硬删：先对象后行，processing 409</td></tr>
      <tr><td><code>src/routes/codebases.ts</code></td><td>六类端点与错误码映射</td></tr>
      <tr><td><code>app/web/src/components/codebases/codebases-page.tsx</code></td><td>右上角选库、上传、树搜索、树、预览、原 ZIP、两步删除</td></tr>
      <tr><td><code>app/web/src/lib/codebase-tree.ts</code></td><td>扁平 entries → 树；文本扩展名判定</td></tr>
    </tbody>
  </table>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>ZIP 留在对象存储，DB 只存清单</h2>
    <p class="section-sub">上传只建行 + 签 PUT；complete 才校验；读侧不再解析整包，只按 manifest 的 <code>entry_index</code> 回到 ZIP 读单个条目。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>上传与校验</h3>
      <ul class="flow-list">
        <li><span>create</span><code>uploading + presignPut</code></li>
        <li><span>PUT</span><code>浏览器直传 ZIP</code></li>
        <li><span>complete</span><code>stat → 临时 ZIP → yauzl</code></li>
        <li><span>结果</span><code>ready / failed</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>持久化形状</h3>
      <ul class="flow-list">
        <li><span>manifest</span><code>path / entry_index / is_dir</code></li>
        <li><span>统计</span><code>file_count / declared_bytes</code></li>
        <li><span>树</span><code>前端由 path 合成</code></li>
        <li><span>正文</span><code>不进 DB</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>读与删</h3>
      <ul class="flow-list">
        <li><span>tree</span><code>读 manifest</code></li>
        <li><span>file</span><code>S3 range + yauzl</code></li>
        <li><span>original</span><code>302 presigned GET</code></li>
        <li><span>delete</span><code>对象 → 行，硬删</code></li>
      </ul>
    </article>
  </div>
  <p class="map-note">核心约束：<strong>不解压条目、不执行仓库内容</strong>。临时落盘的只有上传的 ZIP 本身（供 yauzl 读中央目录），finally 必删；预览直接从 S3 按 range 读，不落盘。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="glossary">
  <header class="section-head">
    <span class="kicker">03 · 小白词典</span>
    <h2>读代码前先对齐六个词</h2>
  </header>
  <dl class="glossary">
    <div class="gloss"><dt>中央目录</dt><dd>ZIP 尾部的条目索引，记录每个文件的名字、偏移、压缩/解压大小。只读它就能拿到清单，不用解压正文。</dd></div>
    <div class="gloss"><dt>entry_index</dt><dd>条目在 ZIP 里的原始序号；预览时用它回到 ZIP 找同一条目，是 manifest 与对象之间的键。</dd></div>
    <div class="gloss"><dt>manifest</dt><dd>扁平条目数组，持久化在 <code>codebases.manifest</code> jsonb；树是展示层产物，不重新解析 ZIP。</dd></div>
    <div class="gloss"><dt>range GET</dt><dd>只向 S3 请求对象的某一段字节。yauzl 读中央目录、读单个条目都靠它，不必下载整包。</dd></div>
    <div class="gloss"><dt>硬删</dt><dd>没有 <code>deleted_at</code>：先幂等删 MinIO 原 ZIP，再删行；不做回收站。</dd></div>
    <div class="gloss"><dt>nosniff</dt><dd><code>X-Content-Type-Options: nosniff</code>，阻止浏览器把文本猜成 HTML/SVG 去执行；预览永远按纯文本显示。</dd></div>
  </dl>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: '04 · WALK',
      title: '一个 ZIP 从上传到预览的旅行',
      subtitle: '点一步跳到代码：先建行签 PUT，再校验、存清单、按需读条目。',
      steps: [
        { goto: 'migration-block:3-8', title: '新表', note: '独立领域，四状态，没有 recycled 位', code: 'migration L3–8' },
        { goto: 'archive-create:95-100', title: '签 PUT', note: '只建 uploading 行，不读 ZIP', code: 'archive L95–100' },
        { goto: 'archive-complete:135-166', title: '校验并转 ready', note: '临时 ZIP → 中央目录 → manifest', code: 'archive L135–166' },
        { goto: 'zip-inspect:68-84', title: '条目安全', note: '加密/特殊文件/忽略目录/重名', code: 'zip L68–84' },
        { goto: 'zip-path:122-133', title: '路径规则', note: '拒绝 ..、绝对路径、反斜杠、控制字符', code: 'zip L122–133' },
        { goto: 'reader-file:111-117', title: '条目漂移', note: '预览前核对文件名与加密状态', code: 'reader L111–117' },
        { goto: 's3-reader:65-79', title: '块缓存', note: '中央目录小读命中 1MB 缓存', code: 's3-reader L65–79' },
        { goto: 'purge-service:59-69', title: '硬删', note: '先删对象再删行', code: 'purge L59–69' },
        { goto: 'web-upload:194-214', title: '前端上传', note: 'create → PUT → complete', code: 'page L194–214' },
      ],
      hint: '预览问题先看 s3-reader 的块缓存：1493 条目 ZIP 的中央目录读取曾经因此超时。',
    },
    {
      type: 'code',
      section: {
        id: 'schema',
        kicker: 'CORE · 01',
        title: 'codebases 表：清单是列，不是文件',
        subtitle: '四状态、manifest jsonb、100MB 上限都在数据库再兜一层。',
        body: '<div class="callout"><strong>为什么不复用 resources：</strong>资源表的六状态、hash 唯一索引、软删回收站都是知识库语义；代码库是文件管理，混进去会污染资源状态机与检索。</div>',
        blocks: [
          {
            id: 'migration-block',
            file: 'db/migrations/20261027140000_create_codebases.sql',
            lang: 'sql',
            ranges: [[3, 32]],
            notes: [
              { lines: '3-16', title: '独立元数据', body: '<p><code>original_filename</code> 保留上传名；<code>data_uri</code> 指向 MinIO 原 ZIP；<code>manifest</code> 默认空数组；没有 <code>deleted_at</code>。</p>' },
              { lines: '17-29', title: '库级 CHECK', body: '<p>状态只允许四态；大小非负且 ≤104857600；manifest 必须是数组；文件数与声明解压字节非负。应用层校验之外再兜一层。</p>' },
              { lines: '31-32', title: '索引', body: '<p><code>data_uri</code> 唯一防止两行指向同一对象；<code>created_at DESC</code> 支撑默认列表顺序。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'archive',
        kicker: 'CORE · 02',
        title: '上传与 complete：校验发生在对象落地之后',
        subtitle: 'createUpload 只建行签 PUT；complete 才 stat、下载临时副本、读中央目录。',
        body: '<div class="callout strong"><strong>为什么允许临时文件：</strong>yauzl 需要一个可随机读的文件句柄。受控临时目录里只放上传的 ZIP 本身（≤100MB），不产生任何解压条目；finally 整目录删除。</div>',
        blocks: [
          {
            id: 'archive-create',
            file: 'src/codebase/archive.ts',
            lang: 'ts',
            ranges: [[69, 101]],
            notes: [
              { lines: '69-84', title: '输入与 key', body: '<p>文件名不能空；size 若给必须是非负整数且 ≤100MB；key 走独立的 <code>keyForCodebase</code>，与资源路径分开。</p>' },
              { lines: '86-100', title: '建行 + 签名', body: '<p>先分配不冲突的 key，建 <code>uploading</code> 行；再签 1h PUT（<code>application/zip</code>）。签名失败把行转 <code>failed</code>，不留在 uploading。</p>' },
            ],
          },
          {
            id: 'archive-complete',
            file: 'src/codebase/archive.ts',
            lang: 'ts',
            ranges: [[103, 167]],
            notes: [
              { lines: '103-128', title: '门禁：只接 uploading', body: '<p>非 uploading 409；URI/bucket 不对直接失败；对象缺失/0 字节/超 100MB/MIME 不是 ZIP 都删错对象并落 <code>failed</code>。</p>' },
              { lines: '130-146', title: '转 processing 并下载', body: '<p>先 UPDATE 到 processing（并发删除时 rowCount=0 报 404）；在受控临时目录下载 ZIP，流式计数再次挡住 100MB。</p>' },
              { lines: '148-166', title: '校验、写清单、finally 清理', body: '<p><code>inspectZip</code> 只读中央目录；成功把 manifest/文件数/声明解压字节写进行并转 ready；任何分支 finally 都删临时目录。</p>' },
            ],
          },
          {
            id: 'archive-fail',
            file: 'src/codebase/archive.ts',
            lang: 'ts',
            ranges: [[197, 215]],
            notes: [
              { lines: '197-215', title: '失败留痕', body: '<p>按需删错对象，再把行转 <code>failed</code> 并写 <code>error_reason</code>；行保留可看原因，用户可用 DELETE 清掉。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'zip',
        kicker: 'CORE · 03',
        title: 'ZIP 校验：只读目录，不解压正文',
        subtitle: '路径、特殊文件、重名、加密都在这一层拒绝。',
        body: '<div class="callout"><strong>strictFileNames 的必要性：</strong>yauzl 默认会把反斜杠当普通字符；打开 strict 后它才按 ZIP 规范拒绝反斜杠路径。部分畸形路径由 yauzl 先抛，所以还要把错误文本归类成 <code>E_ZIP_PATH</code>。</div>',
        blocks: [
          {
            id: 'zip-inspect',
            file: 'src/codebase/zip.ts',
            lang: 'ts',
            ranges: [[54, 111]],
            notes: [
              { lines: '54-61', title: '打开参数', body: '<p><code>lazyEntries</code> 逐条读；<code>autoClose:false</code> 让 finally 统一关；<code>strictFileNames:true</code> 拒绝反斜杠；打不开归类 <code>E_ZIP_INVALID</code>。</p>' },
              { lines: '68-84', title: '逐条安全检查', body: '<p>加密/不支持压缩直接拒绝；符号链接、设备/管道等特殊文件拒绝；忽略目录整棵跳过；规范化后重名拒绝。</p>' },
              { lines: '86-100', title: '写 manifest', body: '<p><code>entry_index</code> 用当前序号，预览时按它回查；只存元数据与大小；对目录不计入文件数与声明解压字节。</p>' },
              { lines: '109-110', title: '不能是空包', body: '<p>没有任何可用文件报 <code>E_ZIP_EMPTY</code>；空目录 ZIP 不算有效代码库。</p>' },
            ],
          },
          {
            id: 'zip-path',
            file: 'src/codebase/zip.ts',
            lang: 'ts',
            ranges: [[113, 141]],
            notes: [
              { lines: '113-120', title: 'Unix 类型位', body: '<p>从 <code>externalFileAttributes</code> 取 Unix 类型：符号链接/目录/普通文件；其他类型统一算 special。没有类型位时按结尾斜杠或 DOS 目录位判断。</p>' },
              { lines: '122-133', title: '路径白名单', body: '<p>空路径、反斜杠、绝对路径、盘符、控制字符都拒绝；按段拆开后不允许空段、<code>.</code>、<code>..</code>。这是防目录穿越的唯一入口。</p>' },
              { lines: '135-141', title: 'yauzl 错误归类', body: '<p>yauzl 自己先拒的相对/绝对/反斜杠错误，按文本映射成 <code>E_ZIP_PATH</code>；其余算 <code>E_ZIP_INVALID</code>，前端能区分是路径攻击还是坏包。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'read',
        kicker: 'CORE · 04',
        title: '预览：按 entry_index 回到 ZIP 读一段',
        subtitle: 'manifest 是索引；读到条目后再核对文件名/加密/大小，防止清单漂移。',
        body: '<div class="callout strong"><strong>为什么不缓存正文：</strong>清单是派生快照，正文仍以 ZIP 为准。预览前核对 <code>fileName</code> 与清单一致、未加密、可解码，避免“清单指向 A、实际读到 B”。</div>',
        blocks: [
          {
            id: 'reader-file',
            file: 'src/codebase/reader.ts',
            lang: 'ts',
            ranges: [[72, 153]],
            notes: [
              { lines: '72-83', title: '只读 ready + 清单定位', body: '<p>非 ready 409；目录 400；按 <code>entry_index</code> 在 manifest 找条目，找不到 404。</p>' },
              { lines: '92-118', title: '按序号回查并核对', body: '<p>遍历到目标序号；文件名必须与清单一致、未加密、可解码，否则 <code>E_ENTRY_DRIFT</code>；声明解压大小超 100MB 直接 413。</p>' },
              { lines: '128-152', title: '实际字节上限与类型', body: '<p>流式计数按实际解压字节再挡一次 100MB；文本/代码返回 <code>text/plain; charset=utf-8</code>，其余 octet-stream；<code>?download=1</code> 切 attachment。</p>' },
            ],
          },
          {
            id: 's3-reader',
            file: 'src/codebase/s3-reader.ts',
            lang: 'ts',
            ranges: [[31, 108]],
            notes: [
              { lines: '31-58', title: '随机读与 range', body: '<p><code>read()</code> 满足 yauzl 的小块读；<code>_readStreamForRange</code> 直接向 S3 发 range GET，注意 end 是排他边界，Range 头要减一。</p>' },
              { lines: '65-100', title: '1MB 块缓存', body: '<p>小于 1MB 的读按块缓存；yauzl 每读一条中央目录记录只读 46 字节，没有缓存时 1000 条目就是 1000 次 S3 请求。缓存最多 16 块，失败从 Map 删除。</p>' },
              { lines: '102-108', title: '大块直读', body: '<p>超过块大小的读不缓存，直接一次 range GET，避免把条目正文塞进缓存。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'purge',
        kicker: 'CORE · 05',
        title: '硬删：先对象后行，processing 拒绝',
        subtitle: '代码库没有回收站；删除就是删对象 + 删行。',
        body: '<div class="callout"><strong>为什么 processing 不能删：</strong>complete 正持有临时副本与行状态；抽走行会让校验结果无处落，也会留下孤儿对象。先让校验结束或失败，再删。</div>',
        blocks: [
          {
            id: 'purge-service',
            file: 'src/codebase/purge.ts',
            lang: 'ts',
            ranges: [[44, 70]],
            notes: [
              { lines: '44-49', title: '只接非 processing', body: '<p>行不存在 404；processing 409；其它状态都可删。</p>' },
              { lines: '51-65', title: '能定位对象才删', body: '<p>只有 bucket 匹配才拿 key；对象删除失败 <code>E_DELETE_STORE</code> 且行保留（可重试）；对象已丢失按幂等通过。</p>' },
              { lines: '67-69', title: '最后删行', body: '<p>行在删除期间消失也报 404；顺序固定对象 → 行，避免留下无法定位的孤儿对象。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'routes',
        kicker: 'CORE · 06',
        title: '六类端点：列表、树、预览、原包、删除',
        subtitle: '响应默认不带 manifest，避免大清单把列表/详情 payload 拖大。',
        body: '<div class="callout"><strong>为什么详情不返回 manifest：</strong>1493 条目的清单可以很大；列表与详情只需要元数据，树单独走 <code>/tree</code>。这样分页与详情都稳定。</div>',
        blocks: [
          {
            id: 'routes-create',
            file: 'src/routes/codebases.ts',
            lang: 'ts',
            ranges: [[47, 72], [141, 179]],
            notes: [
              { lines: '47-72', title: '列表', body: '<p>page/per_page 校验；search 匹配标题/原始文件名；页码越界收敛到末页；每条都经过 <code>withoutManifest</code>。</p>' },
              { lines: '141-168', title: '创建上传目标', body: '<p>filename 必填；size/title 类型校验；调 <code>createUpload</code> 返回 201 <code>{ codebase, upload }</code>。</p>' },
              { lines: '170-179', title: 'complete', body: '<p>UUID 校验后调 <code>archive.complete</code>；成功 200，响应同样不含 manifest。</p>' },
            ],
          },
          {
            id: 'routes-read',
            file: 'src/routes/codebases.ts',
            lang: 'ts',
            ranges: [[97, 139]],
            notes: [
              { lines: '97-117', title: '单文件预览/下载', body: '<p>entryIndex 必须是非负整数；流式回传，头固定 <code>nosniff</code> 与 <code>no-store</code>；错误由 <code>mapReadError</code> 映射 404/409/413/422。</p>' },
              { lines: '119-128', title: '原 ZIP 302', body: '<p>只回 <code>Location</code> 与 no-store；不记录 presigned URL。</p>' },
              { lines: '130-139', title: '硬删', body: '<p>只接 DELETE；成功 204；processing 409、不存在 404、对象删除失败 500。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'frontend',
        kicker: 'CORE · 07',
        title: '前端：选库、上传三步、树与预览',
        subtitle: '右上角选库后才读树；create → PUT → complete；树与文本预览进内存缓存，树可按路径搜；预览用 <pre>，HTML/SVG 也不执行。',
        body: '<div class="callout"><strong>TanStack 路由坑：</strong>route 文件开 <code>autoCodeSplitting</code> 后，组件会被搬到 <code>?tsr-split=component</code>；route 文件再导出组件会变 undefined。所以页面组件住在 <code>components/codebases/codebases-page.tsx</code>，route 只留薄壳。</div><div class="callout"><strong>2026-10-28 页面改版（三轮）：</strong>第一轮把上传卡 + 列表卡 + 内联详情改成「右上角选库，整页就是树」，进页不自动选、不自动拉树，树与文件预览加会话内缓存；第二轮卡头收成 标题（带 ZIP 大小）/ 文件数（纯数字）/ 动作，元信息行换成树搜索；第三轮按 EditHere 标注把搜索与当前文件路径并成同一行（竖线通到内容）、卡头动作改图标 + 就地点确认、树默认收起（搜索时全展开）。</div>',
        blocks: [
          {
            id: 'web-upload',
            file: 'app/web/src/components/codebases/codebases-page.tsx',
            source: 'web:src/components/codebases/codebases-page.tsx',
            lang: 'ts',
            ranges: [[183, 214]],
            notes: [
              { lines: '183-192', title: '选文件与前置检查', body: '<p>页头按钮触发隐藏的 file input；选完立即清空 input 值，同一个文件改了再选也会触发；只在前端挡 100MB 上限。</p>' },
              { lines: '194-214', title: '上传三步', body: '<p>create 拿 presign，PUT 直传，再 complete 等服务端校验；成功后清掉树搜索词、选中新代码库并刷新列表；任何一步失败都提示错误并刷新（行可能已是 failed）。</p>' },
            ],
          },
          {
            id: 'web-tree',
            file: 'app/web/src/components/codebases/codebases-page.tsx',
            source: 'web:src/components/codebases/codebases-page.tsx',
            lang: 'ts',
            ranges: [[89, 168]],
            notes: [
              { lines: '89-131', title: '选 ready 才取树 · 缓存优先', body: '<p>非 ready 清空树；先查 lib/codebase-cache，命中就直接铺树，没命中才取 /tree 并写缓存；取到 entries 后保留正在看的文件，否则默认第一个文本文件（没有则第一个文件）。树搜索只过滤清单，不改这份缓存；目录默认收起，过滤态全展开。</p>' },
              { lines: '133-168', title: '预览与取消 · 缓存优先', body: '<p>只在文本路径下请求；预览文本按 codebase id + entryIndex 进缓存，切回来不再读；未命中才请求，AbortController 在切换条目或卸载时取消；失败保留错误码；二进制不请求预览。</p>' },
            ],
          },
          {
            id: 'web-lib',
            file: 'app/web/src/lib/codebase-tree.ts',
            source: 'web:src/lib/codebase-tree.ts',
            lang: 'ts',
            ranges: [[29, 85]],
            notes: [
              { lines: '29-70', title: '扁平 → 树', body: '<p>按路径逐级 <code>ensureDir</code>；目录条目补 <code>entryIndex</code>，合成出来的中间目录为 null；文件挂在父目录下。</p>' },
              { lines: '72-84', title: '排序与文本判定', body: '<p>目录优先、同层按 zh-CN 名字排序；<code>isTextPath</code> 只看扩展名/固定文件名，决定能否内联预览，不判断内容真实性。</p>' },
            ],
          },
          {
            id: 'web-cache',
            file: 'app/web/src/lib/codebase-cache.ts',
            source: 'web:src/lib/codebase-cache.ts',
            lang: 'ts',
            ranges: [[12, 48]],
            notes: [
              { lines: '12-30', title: '树缓存与文件键', body: '<p>树按 codebase id 缓存整份 manifest；文件按 <code>id:entryIndex</code> 存文本。两份都是模块级 Map，切页回来仍有效，刷新页面才清空。</p>' },
              { lines: '32-48', title: '上限与清场', body: '<p>文件缓存最多 64 份，超了丢最早写入的一份；删除代码库时连树带文件一起清掉，避免被删库的文本留在内存里。</p>' },
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
    <span class="kicker">08 · 取舍与踩坑</span>
    <h2>为什么是这些形状</h2>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">DECISION 01</div>
      <h3>代码库与知识库分离</h3>
      <p>代码是文件管理，不是语料。独立表/路由/UI 避免污染六状态、去重、回收站，也不把代码强行塞进 embed/检索。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 02</div>
      <h3>无沙箱就不解压</h3>
      <p>只读中央目录 + 按需读条目，不把仓库内容落到文件系统、不执行脚本。以后确需工作树/AST/执行时再上 sandbox（P3 后另立）。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 03</div>
      <h3>manifest 持久化</h3>
      <p>每次请求重新解析 ZIP 会把中央目录读放大成上千次 S3 请求。清单一次写好、树直接读 DB；正文仍以 ZIP 为准，预览前核对漂移。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 04</div>
      <h3>预览永远纯文本</h3>
      <p>ZIP 里的 HTML/SVG 不可信。统一 <code>text/plain</code> + nosniff + <code>&lt;pre&gt;</code>，浏览器没有机会把它当页面执行。</p>
    </article>
  </div>
  <ul class="pitfall-list">
    <li><strong>高 entryIndex 预览曾经超时：</strong>yauzl 每读一条中央目录记录就 <code>read(46B)</code>；没有块缓存时 1493 条目要发上千次 Range GET。1MB 块缓存修掉，条目正文仍单次 range。</li>
    <li><strong>反斜杠路径必须靠 strictFileNames：</strong>yauzl 默认不拒；打开 strict 后才按规范拒绝，错误文本再归类成 <code>E_ZIP_PATH</code>。</li>
    <li><strong>清单会与 ZIP 漂移：</strong>预览按 entry_index 回查后还要核对文件名/加密/可解码，否则可能读到别的条目。</li>
    <li><strong>route 文件别导出页面组件：</strong>TanStack autoCodeSplitting 会把组件搬走，导出值变 undefined；route 只留薄壳。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">09 · 验证</span>
    <h2>真跑过什么，没跑什么</h2>
  </header>
  <div class="test-grid">
    <article class="test-card">
      <h3>后端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npx vitest run</code> → 19 文件 / 115 例全过。codebase-archive 覆盖正常树、重复路径、<code>..</code>、绝对路径、反斜杠、符号链接、对象缺失、120 条目高 entryIndex 预览。</p>
    </article>
    <article class="test-card">
      <h3>前端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npm test</code> → 67 文件 / 612 例全过；<code>npm run build</code> 绿。覆盖 API 客户端、树构建、纯文本预览、两步删除、错误映射。</p>
    </article>
    <article class="test-card">
      <h3>真实对象</h3>
      <p>8.8MB / 1493 条目 ZIP 上传后：entry 761 / 916 / 1294 / 1492 预览均 200；修复前高序号条目会因中央目录读取请求排队而超时。</p>
    </article>
    <article class="test-card">
      <h3>未真跑</h3>
      <p>浏览器手测按约定归 Lynx：上传、树、预览、下载、删除、错误提示。</p>
    </article>
  </div>
  <p class="test-note">复现命令（从仓库根）：</p>
  <pre class="snippet">cd app/server
npx tsc --noEmit
npx vitest run test/codebase-archive.test.ts

cd ../web
npx tsc --noEmit
npm test -- src/routes/codebases.test.tsx
npm run build</pre>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">10 · 衔接</span>
    <h2>5.1 交进来什么，后面接什么</h2>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 5.1：</strong>ObjectStore 契约与 presign get/put；5.4 只复用这层基础设施，key 前缀与资源分开。<br><strong>同 Epic · 5.2/5.3：</strong>资源域自己的归档、去重、回收站、重入库；与代码库互不影响。<br><strong>后续：</strong>AST 依赖图分析、代码 RAG、Git clone 各自另立 Epic；sandbox 在 P3 后。</p>
    <div class="next-links">
      <a href="./epic5-story1-minio-adapter.html">Story 5.1 · MinIO 适配器</a>
      <a href="./epic5-story2-archive-ingest.html">Story 5.2 · 原始归档 / ingest</a>
      <a href="./epic5-story3-dedup-recycle-reingest.html">Story 5.3 · 去重 / 回收站 / 重入库</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>代码库没有回收站：</strong>硬删立即释放对象与行；误删不可恢复。</li>
    <li><strong>没有去重：</strong>同一个 ZIP 可以重复上传；ZIP 去重/版本语义未定义，属后续。</li>
    <li><strong>不做代码 RAG：</strong>代码库只是文件管理；抽取、切块、embed、检索都不在本域。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 5.4 · 代码库 ZIP / 文件树 / 预览 / 硬删 · 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic5-story4/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：done（Epic 5 收口）。</p>
</footer>`,
    },
  ],
}
