export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic5-story3-dedup-recycle-reingest.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 5 · Story 5.3 资源批量 · 去重 / 回收站 / 重入库 · 带代码逐行讲解',
  tocTitle: 'Story 5.3',
  tocSub: 'SHA-256 去重 · 两段式 · 回收站 · 重入库',
  accent: '#0369a1',
  accent2: '#0f766e',
  accentDark: '#7dd3fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 5 · STORY 5.3</span><span>DEDUP · BATCH · RECYCLE · REINGEST</span></div>
  <h1>同一份内容，<em>只存一次</em></h1>
  <p class="hero-sub">5.3 把“上传”从单文件动作变成一条资源批处理链路：浏览器先算 SHA-256，后端在写 DB/MinIO 之前拦重复；整批先归档/直传，再统一 ingest；软删资源进回收站，彻底删除才释放 hash；ready 可以重跑并原子替换旧分块。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>100 / 100</span>
    <span class="chip"><strong>前端</strong>603 / 603</span>
    <span class="chip"><strong>真跑</strong>MinIO + DB + Ollama</span>
    <span class="chip"><strong>状态</strong>review</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 100</b> · <b>frontend 603</b> · <b>build green</b> · <b>live smoke</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格交付什么，不交付什么</h2>
    <p class="section-sub">5.3 的成果不是“批量上传按钮”，而是把内容身份、两个存储的写入顺序、失败语义和回收路径固定下来。5.2 的归档/ingest/恢复/下载是本格的底座。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / DEDUP</div>
      <h3>内容身份与去重门</h3>
      <p>SHA-256 小写 hex 作为内容键；<code>resources.content_hash</code> 唯一索引包含软删行；文件/URL/粘贴都在 <code>create</code> 与 MinIO 写入之前查重，命中时两个存储都不写。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / VERIFY</div>
      <h3>客户端预检 + 服务端复核</h3>
      <p>浏览器算文件 hash、同批预检；服务端不信任请求里的 hash，ingest 对 MinIO 读回的 Buffer 再算一次，不一致直接 <code>E_HASH_MISMATCH</code>。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / LIFECYCLE</div>
      <h3>回收站与重入库</h3>
      <p>软删行进回收站；彻底删除只接软删行，先删对象再删行并释放 hash；ready 重入库在写入事务里替换旧 chunks/embeddings。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 5.3：</strong>批量下载 / ZIP（本轮去掉）、后端任务表 / worker / Redis、批量端点、代码库 ZIP（5.4）、PDF/Word 等新格式、MinIO 薄层子系统（Lynx 2026-10-27 决定之后再做）、硬删审计表（P5）。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>db/migrations/20261027110000_add_resource_content_hash.sql</code></td><td>content_hash 列、64 hex CHECK、含软删的唯一索引</td></tr>
      <tr><td><code>src/adapter/storage/hash.ts</code></td><td>Node SHA-256 工具，归档与 ingest 共用</td></tr>
      <tr><td><code>src/resource/archive.ts</code></td><td>文件/URL/粘贴三条去重门与命中语义</td></tr>
      <tr><td><code>src/ingest/fetch/storage-fetcher.ts</code></td><td>从 MinIO 读字节并复算 SHA-256</td></tr>
      <tr><td><code>src/ingest/ingest.ts</code></td><td>fetch 之后、parse 之前比对 hash</td></tr>
      <tr><td><code>src/resource/ingest.ts</code></td><td>ingest 门禁、ready 重跑、失败清旧 chunks</td></tr>
      <tr><td><code>src/adapter/repo/chunk.ts</code></td><td>写入事务里 FOR UPDATE、删旧、插新</td></tr>
      <tr><td><code>src/resource/purge.ts</code></td><td>彻底删除：只接软删行，先对象后行</td></tr>
      <tr><td><code>app/web/src/components/upload-panel/</code></td><td>浏览器 SHA-256、同批预检、整批两段式</td></tr>
      <tr><td><code>app/web/src/components/recycle-bin/</code></td><td>回收站列表、恢复、两步彻底删除</td></tr>
      <tr><td><code>app/web/src/routes/resources.tsx</code></td><td>ready 资源显示“重新入库”</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里的 <span class="badge b-pre">前置</span> 标记属于 5.2 已交付的骨架；没有角标的是 5.3 新增/改写的部分。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>两个存储，四个动作</h2>
    <p class="section-sub">所有正确性都绕着一句话：<strong>去重门必须发生在 resources 行与 MinIO 对象写入之前</strong>。命中时两边都不写，未命中才 create/put。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>前端：先把内容变成 hash</h3>
      <ul class="flow-list">
        <li><span>文件原始字节</span><code>sha256File</code></li>
        <li><span>同批同 hash</span><code>队列内已存在</code></li>
        <li><span>阶段一</span><code>create / PUT / restore</code></li>
        <li><span>阶段二</span><code>POST /:id/ingest</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>服务端：先查 hash，再决定写不写</h3>
      <ul class="flow-list">
        <li><span>文件</span><code>content_hash 必填</code></li>
        <li><span>URL / 粘贴</span><code>服务端算 hash</code></li>
        <li><span>命中 active</span><code>200 duplicate</code></li>
        <li><span>命中软删</span><code>200 restored</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>存储与生命周期</h3>
      <ul class="flow-list">
        <li><span>DB</span><code>resources</code> 行</li>
        <li><span>对象</span><code>MinIO kbfile</code></li>
        <li><span>删除</span><code>软删 → 回收站 → purge</code></li>
        <li><span>重入库</span><code>ready → processing</code></li>
      </ul>
    </article>
  </div>
  <p class="map-note">失败也有归属：建行前拒绝不带 resource；建行后失败留 <code>upload_failed</code>/<code>process_failed</code>；ingest 的 hash 不一致不算“对象没上传”，而是内容完整性失败。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="glossary">
  <header class="section-head">
    <span class="kicker">03 · 小白词典</span>
    <h2>读代码前先对齐六个词</h2>
    <p class="section-sub">这几个词在这页反复出现，先用人话钉住。</p>
  </header>
  <dl class="glossary">
    <div class="gloss"><dt>SHA-256</dt><dd>内容指纹，不是加密。同样的字节永远得到同样的 64 位小写 hex；改一个字节就会变。</dd></div>
    <div class="gloss"><dt>presigned PUT</dt><dd>后端签一个带时效的上传地址，浏览器拿着它把文件直传 MinIO，字节不经过后端。</dd></div>
    <div class="gloss"><dt>软删 / 回收站</dt><dd>只给行写 deleted_at，保留 MinIO 原对象；回收站能看到、能恢复，也能彻底删除。</dd></div>
    <div class="gloss"><dt>去重门</dt><dd>先算 hash、查库；命中就不建行、不签 PUT、不写对象。它是两个存储写入前的闸门。</dd></div>
    <div class="gloss"><dt>两段式</dt><dd>阶段一所有项完成归档/直传，阶段二才开始 ingest；不是服务端队列，刷新页面队列就丢。</dd></div>
    <div class="gloss"><dt>FOR UPDATE</dt><dd>PostgreSQL 行锁。写 chunk 前锁住 resources 行，让同一资源的并发重入库排队，避免两份 chunks。</dd></div>
  </dl>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: '04 · WALK',
      title: '一份内容从浏览器到 ready 的旅行',
      subtitle: '点一步跳到代码。先看键和门，再看复核、批量、回收和重入库。',
      steps: [
        { goto: 'migration-block:7-10', title: '唯一键', note: '含软删行，旧资源已清空', code: 'migration L7–10' },
        { goto: 'hash-file:10-15', title: '算 hash', note: '字节 → 64 hex，归档与 ingest 共用', code: 'hash L10–15' },
        { goto: 'archive-file:101-102', title: '在写之前拦', note: '查重发生在 allocate/create/presign 前', code: 'archive L101–102' },
        { goto: 'archive-hit:220-226', title: '命中两种', note: 'active 只提示；软删则恢复不重传', code: 'archive L220–226' },
        { goto: 'fetcher-block:32-39', title: '读回再算', note: '同一份 Buffer 上复算，不能拿解码字符串算', code: 'fetcher L32–39' },
        { goto: 'pipeline-block:105-107', title: '入库复核', note: 'parse 之前比对，不一致直接失败', code: 'ingest L105–107' },
        { goto: 'panel-preflight:250-268', title: '同批预检', note: '第一份胜出，后面不发请求', code: 'panel L250–268' },
        { goto: 'panel-submit:364-390', title: '两段式', note: '全部 prepare 完，再统一 ingest', code: 'panel L364–390' },
        { goto: 'purge-service:60-71', title: '彻底删除', note: '只接软删行；先对象后行', code: 'purge L60–71' },
        { goto: 'chunk-write:90-99', title: '重入库替换', note: '锁行、删旧、插新，一个事务', code: 'chunk L90–99' },
        { goto: 'ready-ui:457-466', title: 'ready 的按钮', note: '显示“重新入库”，不再是不可动', code: 'resources L457–466' },
      ],
      hint: '每一步都对应真实代码；先点“唯一键”，再顺着往下走。',
    },
    {
      type: 'code',
      section: {
        id: 'dedup-key',
        kicker: 'CORE · 01',
        title: '去重键：列、约束与唯一索引',
        subtitle: 'hash 是内容指纹；唯一索引是并发下的最终裁决者。',
        body: '<div class="callout"><strong>为什么可空：</strong>URL 抓取失败会留下一条 <code>upload_failed</code> 行，这时没有可信内容可算 hash。可空列让“失败留痕”和“内容去重”同时成立；唯一索引只约束非空值。</div>',
        blocks: [
          {
            id: 'migration-block',
            file: 'db/migrations/20261027110000_add_resource_content_hash.sql',
            lang: 'sql',
            ranges: [[1, 16]],
            notes: [
              { lines: '3-5', title: '列 + 格式约束', body: '<p><code>content_hash</code> 允许 NULL；CHECK 只接受 64 位小写 hex。格式错误在数据库层也挡一次，不只靠路由校验。</p>' },
              { lines: '7-10', title: '含软删的唯一索引', body: '<p>partial unique index 只索引非空 hash，但<strong>不过滤 deleted_at</strong>：软删行仍占着这个内容键，再上传同内容会走恢复，而不是新建第二行。</p>' },
              { lines: '12-16', title: '可回滚', body: '<p>down 先删索引、再删约束、最后删列；迁移可逆，旧资源已清空，不做 hash 回填。</p>' },
            ],
          },
          {
            id: 'hash-file',
            file: 'src/adapter/storage/hash.ts',
            lang: 'ts',
            ranges: [[1, 16]],
            notes: [
              { lines: '2-3', title: '算的是字节', body: '<p>文件算原始字节；URL/粘贴算即将写进 MinIO 的 UTF-8 文本；ingest 对读回的字节复算。文件名、标题不参与 hash。</p>' },
              { lines: '10-15', title: '一个工具，多处共用', body: '<p><code>sha256Hex</code> 被 archive 与 storage fetcher 共用；<code>isSha256Hex</code> 被路由和 archive 共用。放在 adapter/storage 是为了避免 ingest 反向依赖 resource。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'dedup-gate',
        kicker: 'CORE · 02',
        title: '归档去重门：三条来源，一个顺序',
        subtitle: '校验 → 算/取 hash → 查库 → 只有 miss 才 allocate/create/presign/put。',
        body: '<div class="callout strong"><strong>门的定义：</strong>命中时 <code>resources</code> 行和 MinIO 对象两边都不写。URL 的抓取在 hash 之前，但抓取是只读网络操作，不算写入。</div>',
        blocks: [
          {
            id: 'archive-file',
            file: 'src/resource/archive.ts',
            lang: 'ts',
            ranges: [[79, 121]],
            notes: [
              { lines: '79-99', title: '先验输入', badge: '前置', body: '<p>文件先验文件名、扩展名、size 与 <code>content_hash</code> 格式；这些都不通过就不该创建行。base 校验来自 5.2，hash 必填是 5.3 加的。</p>' },
              { lines: '101-102', title: '门在 allocate 之前', body: '<p><code>findByHash</code> 放在 <code>allocate</code>、<code>createNew</code>、<code>presignPut</code> 之前：命中时 key 都不分配，PUT 也不签。</p>' },
              { lines: '104-119', title: 'miss 才建行签 PUT', badge: '前置', body: '<p>未命中才分配 key、插入 <code>uploading</code> 行、签 presigned PUT；原始字节由浏览器直传，后端不碰文件内容。</p>' },
            ],
          },
          {
            id: 'archive-url-text',
            file: 'src/resource/archive.ts',
            lang: 'ts',
            ranges: [[149, 217]],
            notes: [
              { lines: '149-156', title: 'URL：抓完再算', body: '<p>URL 必须先抓取才知道内容；空内容、MIME、大小校验通过后，对即将写入 MinIO 的 UTF-8 字节算 hash，再查库。抓取本身不写行、不写对象。</p>' },
              { lines: '158-171', title: 'URL：miss 才写', badge: '前置', body: '<p>只有未命中才 allocate + create + <code>store.put</code>；<code>source</code> 保留原 URL。命中时这段一步都不执行。</p>' },
              { lines: '184-191', title: '粘贴：先算再查', body: '<p>粘贴内容已经在请求里，直接按 UTF-8 字节算 hash；在分配 key 之前查库，命中连路径都不产生。</p>' },
              { lines: '199-212', title: '粘贴：miss 才写', badge: '前置', body: '<p>未命中才建行并 put；如果 put 失败，行会转 <code>upload_failed</code>，不会假装成功。</p>' },
            ],
          },
          {
            id: 'archive-hit',
            file: 'src/resource/archive.ts',
            lang: 'ts',
            ranges: [[219, 255]],
            notes: [
              { lines: '220-222', title: 'active 命中', body: '<p>库里已有同内容且未软删：直接返回 <code>{ resource, duplicate: true }</code>。不自动 ingest、不等待、不新建、不上传。</p>' },
              { lines: '224-226', title: '软删命中', body: '<p>软删且对象完整：调用 <code>ResourceRestore</code> 恢复原行，返回 <code>restored: true</code>；对象不重传，后面仍要 ingest。</p>' },
              { lines: '228-234', title: '软删但对象损坏', body: '<p>恢复失败映射成 <code>E_ORIGINAL_LOST</code>（409）。用户要先去回收站彻底删除，释放这个 hash，才能重新上传。</p>' },
              { lines: '239-254', title: '并发兜底', body: '<p>两个同 hash 请求同时 miss：一个 INSERT 成功，另一个撞唯一索引 23505；捕获后重查，返回先到的那条。文件不会拿到第二个 presign。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'ingest-verify',
        kicker: 'CORE · 03',
        title: '入库复核：客户端 hash 只是预检键',
        subtitle: '真正的真相是 MinIO 读回的那份字节。',
        body: '<div class="callout"><strong>为什么不能拿解码后的字符串算：</strong><code>bytes.toString(\'utf8\')</code> 遇到非法 UTF-8 会产生替换字符，再编码回去已经不是原字节。hash 必须在 Buffer 上算。</div>',
        blocks: [
          {
            id: 'fetcher-block',
            file: 'src/ingest/fetch/storage-fetcher.ts',
            lang: 'ts',
            ranges: [[23, 41]],
            notes: [
              { lines: '29-30', title: '对象不存在', badge: '前置', body: '<p>对象缺失抛 <code>E_NO_ORIGINAL</code>；5.2 的 fetch 段从 URL/粘贴改成从 MinIO 读，就是这里。</p>' },
              { lines: '32-39', title: '同一份 Buffer 复算', body: '<p>整份读进内存（上限 10MB），在同一个 Buffer 上算 SHA-256 放进 <code>fetched.sha256</code>。parse 用的 <code>raw</code> 也从这份 Buffer 解码，hash 与正文不会来自两次不同的读取。</p>' },
            ],
          },
          {
            id: 'pipeline-block',
            file: 'src/ingest/ingest.ts',
            lang: 'ts',
            ranges: [[89, 107]],
            notes: [
              { lines: '89-103', title: 'fetch 阶段', badge: '前置', body: '<p>五段管线的 fetch 段；stage 观测记录 content_length/http_status，不记录 hash。</p>' },
              { lines: '105-107', title: 'parse 之前比对', body: '<p>只要归档时声明了 hash，就要求复算值严格相等；不等直接 <code>fail()</code> 落 <code>process_failed</code>（<code>E_HASH_MISMATCH</code>），不进入 parse/chunk/embed。客户端改 hash 只能让这次入库失败，不能让错内容变 ready。</p>' },
            ],
          },
          {
            id: 'contracts-block',
            file: 'src/ingest/contracts.ts',
            lang: 'ts',
            ranges: [[14, 20], [73, 79]],
            notes: [
              { lines: '14-20', title: 'KBData 带上声明值', body: '<p><code>runExisting</code> 把 <code>Resource.content_hash</code> 带进 <code>KBData</code>；null 时不传，旧行/URL 失败行跳过复核。</p>' },
              { lines: '73-79', title: 'Fetched 带回复算值', body: '<p><code>sha256</code> 是 storage fetcher 的产物；如果将来换 fetcher，要么也提供它，要么这条比对会失败（fail closed）。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'frontend-batch',
        kicker: 'CORE · 04',
        title: '前端两段式：先全部归档，再统一 ingest',
        subtitle: '浏览器算 hash、同批预检；阶段一只做 create/上传/归档，阶段二才 ingest。',
        body: '<div class="callout"><strong>这不是后台队列：</strong>队列仍是 React 内存数组，刷新即丢；没有任务表、worker、Redis 或批量端点。两段式只是把同一批的提交顺序固定下来。</div>',
        blocks: [
          {
            id: 'upload-hash',
            file: 'app/web/src/components/upload-panel/upload-files.ts',
            source: 'web:src/components/upload-panel/upload-files.ts',
            lang: 'ts',
            ranges: [[78, 83]],
            notes: [
              { lines: '78-82', title: 'Web Crypto 算原始字节', body: '<p>只在提交时读文件，入队不读整份文件；输出小写 64 hex。需要安全上下文（localhost/HTTPS），普通 HTTP 局域网没有兜底。</p>' },
            ],
          },
          {
            id: 'panel-preflight',
            file: 'app/web/src/components/upload-panel/upload-panel.tsx',
            source: 'web:src/components/upload-panel/upload-panel.tsx',
            lang: 'ts',
            ranges: [[232, 270]],
            notes: [
              { lines: '232-248', title: '把所有文件摊平', body: '<p>文件和文件夹展开项都变成 <code>FileJob</code>；先收集，保证同批预检能看到跨项的同内容文件。</p>' },
              { lines: '250-260', title: '逐份算 hash', body: '<p>顺序计算，避免一个文件夹同时读很多份大文件；单个 hash 失败只标记该文件，不阻断整批。</p>' },
              { lines: '262-268', title: '第一份胜出', body: '<p><code>Seen</code> 按队列顺序记录 hash；后面的同 hash 标记 <code>DuplicateOf</code>，阶段一直接跳过，不 create、不 PUT、不 ingest。</p>' },
            ],
          },
          {
            id: 'panel-prepare',
            file: 'app/web/src/components/upload-panel/upload-panel.tsx',
            source: 'web:src/components/upload-panel/upload-panel.tsx',
            lang: 'ts',
            ranges: [[272, 343]],
            notes: [
              { lines: '279-299', title: '文字 / URL', body: '<p>文字和 URL 走 <code>acceptSingle</code>；URL 的 409 <code>E_DUPLICATE</code> 被当成“库里已有”，不是失败。active 命中只提示，不自动 ingest。</p>' },
              { lines: '302-318', title: '跳过预检重复与坏 hash', body: '<p>预检阶段已经知道重复或 hash 失败的文件，这里不再发请求；失败原因留在队列行上。</p>' },
              { lines: '320-341', title: '文件：create → 可选 PUT → 收集', body: '<p>新文件带 <code>content_hash</code> create，拿到 upload 后直传；<code>duplicate</code> 不传不收集，<code>restored</code> 不传但收集，等阶段二 ingest。</p>' },
            ],
          },
          {
            id: 'panel-submit',
            file: 'app/web/src/components/upload-panel/upload-panel.tsx',
            source: 'web:src/components/upload-panel/upload-panel.tsx',
            lang: 'ts',
            ranges: [[345, 409]],
            notes: [
              { lines: '345-362', title: '阶段二：逐个 ingest', body: '<p>阶段一收集到的资源按顺序 ingest；每完成一个就 <code>onProgress</code>，单项失败不阻断其余。</p>' },
              { lines: '364-390', title: '先全部 prepare，再统一 ingest', body: '<p>预检 → 阶段一循环所有项 → <code>ingestPrepared</code>。这就是“全部上传结束后统一 ingest”的实现位置，没有服务端队列。</p>' },
              { lines: '392-408', title: '按项汇总', body: '<p>done / duplicate / failed 三种终态分开计数；duplicate 只提示“库里有这个资源”，不算失败。</p>' },
            ],
          },
          {
            id: 'client-block',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            lang: 'ts',
            ranges: [[297, 314], [415, 424], [723, 733]],
            notes: [
              { lines: '297-314', title: '响应标记', body: '<p><code>duplicate/restored</code> 是 200 的语义标记；<code>upload</code> 改成可选，因为命中/恢复时后端不重签 PUT。前端不能假设 upload 一定存在。</p>' },
              { lines: '415-424', title: '回收站查询', body: '<p><code>GET /resources/deleted</code> 只带 page/per_page/search，与活动列表分开。</p>' },
              { lines: '723-733', title: '文件必带 hash', body: '<p><code>createFileResource</code> 把 <code>content_hash</code> 放进请求体；后端缺它直接 400 <code>E_BAD_HASH</code>。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'recycle',
        kicker: 'CORE · 05',
        title: '回收站：软删可恢复，彻底删除才释放 hash',
        subtitle: 'purge 只接软删行；先幂等删 MinIO 对象，再删行。',
        body: '<div class="callout strong"><strong>为什么先对象后行：</strong>反过来先删行，对象删除失败就会留下孤儿对象，没有行能再定位它。顺序固定为对象 → 行；对象删除失败则行保留，可重试。</div>',
        blocks: [
          {
            id: 'repo-deleted',
            file: 'src/adapter/repo/resource.ts',
            lang: 'ts',
            ranges: [[107, 138]],
            notes: [
              { lines: '107-129', title: '列软删行', body: '<p>只查 <code>deleted_at IS NOT NULL</code>，title/source ILIKE，按 <code>deleted_at DESC, id DESC</code> 稳定分页；计数与列表分开查。</p>' },
              { lines: '131-138', title: '只删软删行', body: '<p>SQL 自带 <code>deleted_at IS NOT NULL</code>；active 行即使绕过路由也删不掉。chunks/embeddings 随 FK CASCADE，content_hash 随行释放。</p>' },
            ],
          },
          {
            id: 'purge-service',
            file: 'src/resource/purge.ts',
            lang: 'ts',
            ranges: [[46, 72]],
            notes: [
              { lines: '46-49', title: '只接回收站', body: '<p>先读包含软删的行；不存在 404，未软删 409 <code>E_NOT_DELETED</code>。这是“仅允许删除软删行”的服务层兜底。</p>' },
              { lines: '51-58', title: '能定位当前桶才删对象', body: '<p>只有 <code>data_uri</code> 是当前桶的 <code>kc://</code> URI 才拿 key；URI 坏或桶不一致时跳过对象删除、仍允许清行。</p>' },
              { lines: '60-66', title: '对象删除失败保留行', body: '<p>S3 DeleteObject 幂等，对象已丢失也能过；网络/权限失败抛 <code>E_PURGE_STORE</code>，行还在，用户可重试。</p>' },
              { lines: '68-71', title: '删行与并发恢复', body: '<p>行已不存在按幂等成功；如果这期间被 restore 抢先，重读发现 active 就报 <code>E_NOT_DELETED</code>，不会二次硬删。</p>' },
            ],
          },
          {
            id: 'routes-recycle',
            file: 'src/routes/resources.ts',
            lang: 'ts',
            ranges: [[75, 100], [121, 139]],
            notes: [
              { lines: '75-99', title: 'GET /deleted', body: '<p>分页参数与 chunks 同一口径；页码越界时先收敛到末页再查，避免返回自相矛盾的空页。</p>' },
              { lines: '121-139', title: 'DELETE /:id/purge', body: '<p>UUID 校验后调 <code>ResourcePurge</code>；成功 204，404/409/500 分别映射；trace 回填 resource_id。</p>' },
            ],
          },
          {
            id: 'recycle-frontend',
            file: 'app/web/src/components/recycle-bin/recycle-bin.tsx',
            source: 'web:src/components/recycle-bin/recycle-bin.tsx',
            lang: 'ts',
            ranges: [[86, 126], [182, 203]],
            notes: [
              { lines: '86-105', title: '恢复 = restore + ingest', body: '<p>恢复成功后自动 ingest；ingest 失败保留恢复结果给 warning。成功后刷新回收站并通知资源页刷新活动列表。</p>' },
              { lines: '107-126', title: '彻底删除', body: '<p>调 purge；404 视为已经不在了；409 说明并发恢复，刷新列表；所有分支都重取当前页。</p>' },
              { lines: '182-203', title: '两步确认', body: '<p>行里“彻底删除”由 <code>TwoStepButton</code> 承担，第一次只装填，第二次才发请求；这个动作只出现在回收站卡片，不出现在活动列表。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'reingest',
        kicker: 'CORE · 06',
        title: 'ready 重入库：原子替换旧分块',
        subtitle: '允许 ready 重跑；写入事务里锁行、删旧、插新。',
        body: '<div class="callout"><strong>为什么需要行锁：</strong>chunks 没有 (resource_id, chunk_index) 唯一约束，两个并发重入库会各自删旧插新，最后留下两份 chunks。FOR UPDATE 把同一资源的写入串行化。</div>',
        blocks: [
          {
            id: 'resource-ingest',
            file: 'src/resource/ingest.ts',
            lang: 'ts',
            ranges: [[57, 107], [117, 124]],
            notes: [
              { lines: '57-60', title: 'processing 拒绝，ready 放行', body: '<p>只有正在处理的资源 409；ready 不再拒绝。重入库仍走同一套 stat/类型/大小门禁。</p>' },
              { lines: '94-95', title: 'ready 回落 uploaded', body: '<p><code>markResourceUploaded</code> 现在允许 ready 状态；门禁确认对象可读后回落 uploaded，随后 <code>runExisting</code> 立即转 processing。</p>' },
              { lines: '117-124', title: '门禁失败也清旧 chunks', body: '<p>对象缺失/类型错/为空等门禁失败落 <code>upload_failed</code>，但先把旧 chunks 删掉，避免旧内容继续被检索。</p>' },
            ],
          },
          {
            id: 'chunk-write',
            file: 'src/adapter/repo/chunk.ts',
            lang: 'ts',
            ranges: [[79, 140]],
            notes: [
              { lines: '88-96', title: '事务 + 行锁', body: '<p>BEGIN 后用 <code>SELECT ... FOR UPDATE</code> 锁住 resources 行；资源已删则抛 <code>E_RESOURCE_GONE</code>，整笔回滚。</p>' },
              { lines: '98-99', title: '先删旧 chunks', body: '<p>同一事务里删旧 chunks，embeddings 随 FK CASCADE 一起走；失败整体回滚，旧数据在提交前仍可用。</p>' },
              { lines: '101-133', title: '插新 chunks + 向量', body: '<p>先插 chunks 拿 id，再按 chunk_index 配向量；两边在同一事务里，不会出现“有 chunk 无向量”。</p>' },
              { lines: '135-140', title: '最后转 ready', body: '<p>UPDATE 带 deleted_at 谓词：写入期间被软删就 rowCount=0，整笔回滚，避免给已删资源补 chunks。</p>' },
            ],
          },
          {
            id: 'ready-ui',
            file: 'app/web/src/routes/resources.tsx',
            source: 'web:src/routes/resources.tsx',
            lang: 'ts',
            ranges: [[90, 95], [450, 468]],
            notes: [
              { lines: '90-95', title: 'ready 也可入库', body: '<p><code>canIngest</code> 加入 ready；下载仍只对 uploaded/processing/ready/process_failed 开放。</p>' },
              { lines: '450-468', title: '按钮文案三档', body: '<p>uploaded → 开始入库；ready → 重新入库；process_failed → 重试入库；processing 仍只显示取消。</p>' },
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
    <h2>为什么是这些形状</h2>
    <p class="section-sub">每一条都能在上面的代码里找到落点；这里讲被否掉的方案和容易踩的坑。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">DECISION 01</div>
      <h3>去重门放在两个存储之前</h3>
      <p>不是“先上传再查重”。文件是 presigned PUT 直传，后端在归档时看不到字节；所以浏览器先算 hash，POST 时先查库。命中时 DB 和 MinIO 都不写，省带宽也省清理。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 02</div>
      <h3>客户端 hash 只当预检键</h3>
      <p>请求体里的 hash 可被 curl 改，前端也可能算错。服务端不信任它：ingest 从 MinIO 读回字节再算一次。改 hash 能绕过去重，但绕不过完整性，最终 <code>process_failed</code>。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 03</div>
      <h3>两段式，不是后台队列</h3>
      <p>阶段一全部归档/直传，阶段二统一 ingest；队列仍是内存数组，不建任务表/worker/Redis。刷新页面队列就丢，这是明确的范围边界。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 04</div>
      <h3>回收站用独立端点</h3>
      <p>没有给 <code>GET /resources</code> 加 deleted 过滤。活动列表、状态计数、分页保持“库里有什么”的语义；软删行单独走 <code>/resources/deleted</code>，也方便以后加审计/保留策略。</p>
    </article>
  </div>
  <ul class="pitfall-list">
    <li><strong>active 命中不救失败行：</strong>第一次上传留下 <code>uploading/upload_failed</code> 行时，再传同内容只会命中它并提示；要先彻底删除（回收站）或走后续重试策略，不能指望队列自动重传。</li>
    <li><strong>软删行仍占 hash：</strong>同内容上传会恢复原行，而不是新建；这是唯一索引包含软删行的直接结果，想真正重传必须先 purge。</li>
    <li><strong>Web Crypto 需要安全上下文：</strong>localhost / HTTPS 可用；普通 HTTP 局域网拿不到 <code>subtle</code>，当前直接报错，没有 JS SHA-256 兜底。</li>
    <li><strong>并发重入库会留下两份 chunks：</strong>chunks 没有 (resource_id, chunk_index) 唯一约束；没有 <code>FOR UPDATE</code> 时两个事务各自删旧插新，最终各插一份。行锁是这里的正确性来源。</li>
    <li><strong>测试夹具顺序变过：</strong>两文件用例从“上传 A → 入库 A → 上传 B”改成“上传 A → 上传 B → 入库 A → 入库 B”，因为两段式是契约变化；不是测试迁就实现。</li>
    <li><strong>purge/restore 还有极小并发窗口：</strong>purge 先删对象再删行；若同一行在这两步之间被 restore 抢先，可能“已恢复但对象已删”。单用户下几乎不可见，已记 deferred，待用行锁事务收口。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">08 · 验证</span>
    <h2>真跑过什么，没跑什么</h2>
    <p class="section-sub">下面数字都是本轮真跑；浏览器视觉/交互仍留给 Lynx。</p>
  </header>
  <div class="test-grid">
    <article class="test-card">
      <h3>后端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npx vitest run</code> → 17 文件 / 100 例全过。覆盖去重命中/恢复/并发唯一索引、ingest hash 不一致、回收站只列软删、active 409、purge 释放 hash、ready 重入库替换与失败清理。</p>
    </article>
    <article class="test-card">
      <h3>前端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npm test</code> → 64 文件 / 603 例全过；<code>npm run build</code> 绿。覆盖 SHA-256 向量、同批预检、duplicate/restored、两段式顺序、回收站恢复与两步删除。</p>
    </article>
    <article class="test-card">
      <h3>真实冒烟</h3>
      <p>本机 3000 真服务：create → soft delete 204 → deleted 列表 1 → purge 204 → 列表 0；另一条：同一资源两次 ingest 都 201，chunk id overlap = 0。</p>
    </article>
    <article class="test-card">
      <h3>未真跑</h3>
      <p>浏览器手测未做：文件 hash 预检、同批重复提示、回收站卡片、ready“重新入库”按钮。按约定由 Lynx 打开 <code>http://localhost:5173</code> 验收。</p>
    </article>
  </div>
  <p class="test-note">复现命令（从仓库根）：</p>
  <pre class="snippet">cd app/server
npx tsc --noEmit
npx vitest run

cd ../web
npx tsc --noEmit
npm test
npm run build</pre>
  <div class="callout"><strong>浏览器手测清单：</strong>① 单文件上传，网络面板确认 POST 带 64 位 <code>content_hash</code>，随后 PUT、再 ingest；② 同批两个同内容文件只出现一次 create/PUT/ingest；③ 再传库里已有内容只提示、不 PUT；④ 软删后上传同内容显示“已恢复并入库”；⑤ 回收站恢复/两步彻底删除；⑥ ready 抽屉显示“重新入库”。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">09 · 衔接</span>
    <h2>5.2 交进来什么，5.4 接什么</h2>
    <p class="section-sub">5.3 不是从零开始：归档、ingest、恢复、下载、六状态都是 5.2 的底座。</p>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 5.2：</strong>presigned PUT 文件归档、URL/粘贴归档、六状态、<code>kc://</code> data_uri、<code>POST /:id/ingest</code>、302 下载、restore。5.3 在它上面加内容身份、批量顺序、回收站和重入库。<br><strong>下一格 · 5.4：</strong>代码库 ZIP 上传与文件管理，仍 backlog；不进 <code>resources</code>、不进 ingest。</p>
    <div class="next-links">
      <a href="./epic5-story1-minio-adapter.html">Story 5.1 · MinIO 适配器</a>
      <a href="./epic3-story4-ingest-stages.html">Story 3.4 · ingest 五段</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>5.2 仍 review：</strong>浏览器四种来源/六状态/下载/撤销恢复手测未收；5.3 的页面与实现不替代 5.2 的验收。</li>
    <li><strong>deferred 仍在：</strong>purge/restore 并发行锁、文件 PUT 失败留下的 uploading 行、URL 标题覆盖、从 source 自动重抓、硬删审计（P5）、MinIO 薄层子系统。</li>
    <li><strong>数据现状：</strong>旧资源已清空，不做 hash 回填；sessions/messages 保留。迁移 14 applied / 0 pending。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 5.3 · 资源批量去重 / 两段式 / 回收站 / 重入库 · 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic5-story3/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：review。浏览器验收与 story 收口由 Lynx 决定；本页不替代 5.2 的验收。</p>
</footer>`,
    },
  ],
}
