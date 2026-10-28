export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic5-story2-archive-ingest.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 5 · Story 5.2 原始归档 · 两段式 ingest · 下载与恢复 · 带代码逐行讲解',
  tocTitle: 'Story 5.2',
  tocSub: 'MinIO 归档 · presign PUT · 五段 ingest · 302 下载',
  accent: '#047857',
  accent2: '#0369a1',
  accentDark: '#6ee7b7',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 5 · STORY 5.2</span><span>ARCHIVE · INGEST · DOWNLOAD · RESTORE</span></div>
  <h1>原始文件先落地，<em>再慢慢入库</em></h1>
  <p class="hero-sub">5.2 把资源生命周期拆成两段：先归档原始字节（文件 presign 直传 / URL 抓取 / 粘贴），再由 ingest 从 MinIO 读回、跑五段管线。下载走 302 presigned GET，恢复只接软删行。去重、批量、回收站和重入库是 5.3 的补丁，本页用徽章标出。</p>
  <div class="meta-row">
    <span class="chip"><strong>后端</strong>115 / 115</span>
    <span class="chip"><strong>前端</strong>612 / 612</span>
    <span class="chip"><strong>真跑</strong>MinIO + DB + Ollama</span>
    <span class="chip"><strong>状态</strong>done</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>backend 115</b> · <b>frontend 612</b> · <b>build green</b> · <b>live smoke</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格交付什么，不交付什么</h2>
    <p class="section-sub">5.2 的成果是资源生命周期的骨架：六状态、<code>data_uri</code>、两段式上传、从 MinIO 读的 ingest、302 下载、软删恢复。5.3 在它上面加内容身份、批量顺序、回收站与重入库；5.4 另开代码库域。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / ARCHIVE</div>
      <h3>原始字节先落地</h3>
      <p>文件：presign PUT 由浏览器直传；URL：服务端抓取后写入；粘贴：直接写 UTF-8 文本。三者都变成一条资源行 + 一个 MinIO 对象。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / INGEST</div>
      <h3>ingest 只认 data_uri</h3>
      <p>ingest 不再抓 URL：storage fetcher 从 MinIO 读回字节，parse/chunk/embed/write 五段口径与 3.4 一致。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / READ</div>
      <h3>下载与恢复</h3>
      <p>下载 302 到 1h presigned GET（attachment + no-store）；软删只写 deleted_at、保留对象；restore 先 stat 再回落 uploaded，不自动 ingest。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 5.2：</strong>SHA-256 去重与两段式批量（5.3）、回收站列表/彻底删除（5.3）、ready/失败重入库（5.3）、代码库 ZIP（5.4）、multipart、PDF/Word、后台任务队列。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>db/migrations/20261026163000_resource_storage_lifecycle.sql</code></td><td>六状态、MIME 文本化、storage_size_bytes、kc:// 唯一索引</td></tr>
      <tr><td><code>src/resource/archive.ts</code></td><td>文件/URL/粘贴三条归档路径与 presign PUT</td></tr>
      <tr><td><code>src/resource/ingest.ts</code></td><td>stat 门禁、转 processing、runExisting</td></tr>
      <tr><td><code>src/ingest/fetch/storage-fetcher.ts</code></td><td>从 MinIO 读原始字节</td></tr>
      <tr><td><code>src/adapter/storage/uri.ts</code></td><td>kc:// data_uri 编解码与 key 分配</td></tr>
      <tr><td><code>src/resource/download.ts</code></td><td>302 presigned GET 目标</td></tr>
      <tr><td><code>src/resource/restore.ts</code></td><td>软删恢复：stat 后回落 uploaded</td></tr>
      <tr><td><code>src/routes/resources.ts</code></td><td>POST /resources、/:id/ingest、/:id/original、/:id/restore</td></tr>
      <tr><td><code>app/web/src/components/upload-panel/</code></td><td>文字/URL/文件/文件夹队列与逐项提交</td></tr>
    </tbody>
  </table>
  <p class="table-note">代码块里的 <span class="badge b-pre">前置</span> 标记属于更早的骨架；<span class="badge">5.3</span> 标记是后续 story 的补丁，不属于 5.2。</p>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="map">
  <header class="section-head">
    <span class="kicker">02 · 全局地图</span>
    <h2>一条资源行，两次写盘</h2>
    <p class="section-sub">归档只负责原始内容；解析、切块、向量全部推迟到 ingest。任何一步失败都落状态与 <code>error_reason</code>，不假装成功。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>三条归档路径</h3>
      <ul class="flow-list">
        <li><span>文件</span><code>create → presign PUT → uploading</code></li>
        <li><span>URL</span><code>fetch → put → uploaded</code></li>
        <li><span>粘贴</span><code>put → uploaded</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>ingest 五段</h3>
      <ul class="flow-list">
        <li><span>fetch</span><code>MinIO 读回 data_uri</code></li>
        <li><span>parse / chunk</span><code>正文与分块</code></li>
        <li><span>embed / write</span><code>向量与事务写入</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>读与恢复</h3>
      <ul class="flow-list">
        <li><span>下载</span><code>302 presigned GET</code></li>
        <li><span>软删</span><code>deleted_at，对象保留</code></li>
        <li><span>恢复</span><code>stat → uploaded</code></li>
      </ul>
    </article>
  </div>
  <p class="map-note">六状态：<code>uploading / uploaded / processing / ready / upload_failed / process_failed</code>。前两态属于归档，中间属于 ingest，最后两态是失败留痕；重试语义由 5.3 补齐。</p>
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
    <div class="gloss"><dt>data_uri</dt><dd>内部归档地址，形如 <code>kc://oss/minio/kbfile/&lt;key&gt;</code>；<code>source</code> 只记外部 URL，两者不混。</dd></div>
    <div class="gloss"><dt>presign PUT</dt><dd>后端签一个带时效的上传地址，浏览器把文件字节直接 PUT 给 MinIO，后端不代理文件内容。</dd></div>
    <div class="gloss"><dt>stat</dt><dd>向对象存储问对象在不在、多大、什么类型；不是下载内容。归档后由 ingest 做这个确认。</dd></div>
    <div class="gloss"><dt>五段管线</dt><dd>fetch → parse → chunk → embed → write。3.4 定的口径；5.2 只把 fetch 的来源换成 MinIO。</dd></div>
    <div class="gloss"><dt>302</dt><dd>后端不转发文件，只回一个跳转目标；浏览器随后直连 MinIO 的 presigned URL。</dd></div>
    <div class="gloss"><dt>软删</dt><dd>只写 <code>deleted_at</code> 并移除 chunks/embeddings，MinIO 原对象保留，供恢复或后续彻底删除。</dd></div>
  </dl>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: '04 · WALK',
      title: '一个文件从浏览器到 ready 的旅行',
      subtitle: '点一步跳到代码：先看状态与归档，再看门禁、读回、下载与恢复。',
      steps: [
        { goto: 'migration-block:7-10', title: '六状态', note: '归档与 ingest 的状态边界', code: 'migration L7–10' },
        { goto: 'archive-file-block:104-117', title: '签 PUT', note: '建 uploading 行后返回 presign 目标', code: 'archive L104–117' },
        { goto: 'archive-url-text-block:149-156', title: 'URL 先抓后写', note: '抓取只读；未命中才分配 key', code: 'archive L149–156' },
        { goto: 'ingest-gate:79-88', title: '状态门禁', note: 'processing 409；其余可重试', code: 'ingest L79–88' },
        { goto: 'fetcher-block:32-39', title: '读回 MinIO', note: 'fetch 段只认 data_uri', code: 'fetcher L32–39' },
        { goto: 'pipeline-block:89-103', title: '五段 fetch', note: '阶段观测记录内容长度与状态码', code: 'pipeline L89–103' },
        { goto: 'download-block:71-79', title: '302 下载', note: 'attachment + no-store + 1h', code: 'download L71–79' },
        { goto: 'restore-block:44-63', title: '恢复只接软删', note: '对象不在就保持软删', code: 'restore L44–63' },
        { goto: 'panel-submit:367-393', title: '前端逐项提交', note: '先归档再 ingest；失败不阻断其余', code: 'panel L367–393' },
      ],
      hint: '每一步都对应真实代码；徽章会提示哪些是 5.3 后来补上的。',
    },
    {
      type: 'code',
      section: {
        id: 'schema',
        kicker: 'CORE · 01',
        title: '六状态与 kc:// 唯一索引',
        subtitle: '状态是生命周期的事实，URI 是对象存储的定位符。',
        body: '<div class="callout"><strong>为什么把 content_type 文本化：</strong>旧枚举把“来源”和“类型”混在一起（url / markdown / plaintext）；5.2 统一存 MIME，让 ingest 的 parser 选择只看类型。</div>',
        blocks: [
          {
            id: 'migration-block',
            file: 'db/migrations/20261026163000_resource_storage_lifecycle.sql',
            lang: 'sql',
            ranges: [[3, 21], [35, 37]],
            notes: [
              { lines: '3-6', title: '原始对象大小', body: '<p><code>storage_size_bytes</code> 存 MinIO 对象的实际字节数，归档后由 stat 写入；旧行允许 null。</p>' },
              { lines: '7-21', title: '六状态替换旧三态', body: '<p>旧 <code>failed</code> 映射到 <code>process_failed</code>；默认值改为 <code>uploading</code>。状态机从此区分“归档失败”和“入库失败”。</p>' },
              { lines: '35-37', title: 'kc:// 唯一索引', body: '<p>只索引内部归档地址：同一个对象不能被两条资源行同时指向。外部 URL/粘贴没有 <code>kc://</code> 时不受约束。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'archive-file',
        kicker: 'CORE · 02',
        title: '文件归档：建行 + 签 PUT，不碰字节',
        subtitle: '后端只看文件名/大小/声明 hash；原始字节由浏览器直传。',
        body: '<div class="callout strong"><strong>两段式的分界：</strong><code>POST /resources</code> 成功只代表“上传目标已就绪”，不代表文件已经到 MinIO。状态停在 <code>uploading</code>，等 ingest 的 stat 确认。</div>',
        blocks: [
          {
            id: 'archive-file-block',
            file: 'src/resource/archive.ts',
            lang: 'ts',
            ranges: [[79, 121]],
            notes: [
              { lines: '79-99', title: '输入校验', body: '<p>文件名不能空；扩展名只接 .md/.txt；size 必须是非负整数且不超过 10 MiB。声明超限直接 413，不建行。</p>' },
              { lines: '82-82', title: 'hash 必填', badge: '5.3', body: '<p>5.3 加的内容身份：请求必须带 64 位小写 SHA-256。文件字节不在后端，hash 只能由浏览器先算。</p>' },
              { lines: '101-102', title: '去重门', badge: '5.3', body: '<p>命中已有内容时不分配 key、不建行、不签 PUT。5.2 原版没有这一段；本页只标出位置，细节看 5.3 页。</p>' },
              { lines: '104-120', title: '分配 key 并签 PUT', body: '<p><code>allocate</code> 同时查 DB 与 MinIO 避免重名；建 <code>uploading</code> 行后签 1h PUT，<code>Content-Type</code> 被签进 URL，浏览器必须带同样的头。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'archive-url-text',
        kicker: 'CORE · 03',
        title: 'URL 与粘贴：服务端先写进 MinIO',
        subtitle: 'URL 先抓取再查重再写；粘贴直接按 UTF-8 字节写。',
        body: '<div class="callout"><strong>为什么 URL 也要先归档：</strong>网页会变、会 404、会被删。ingest 若每次重新抓，同一资源的正文就不再稳定；5.2 把“抓取时刻的字节”固定成对象，后续一律读对象。</div>',
        blocks: [
          {
            id: 'archive-url-text-block',
            file: 'src/resource/archive.ts',
            lang: 'ts',
            ranges: [[149, 217]],
            notes: [
              { lines: '149-156', title: 'URL：抓完算 hash 再查', body: '<p>抓取是只读网络操作；空正文/类型/超限都不建行。算的是即将写入 MinIO 的 UTF-8 字节。</p>' },
              { lines: '158-175', title: 'URL：只在 miss 时写', body: '<p>未命中才分配 key、建行、<code>store.put</code>；<code>source</code> 保留原始 URL，<code>data_uri</code> 指向对象。写入失败转 <code>upload_failed</code>。</p>' },
              { lines: '178-191', title: '粘贴：先验类型与大小', body: '<p>只接 <code>text/markdown</code> / <code>text/plain</code>；空正文/超限在建行前拒绝；随后按 UTF-8 字节算 hash 查重。</p>' },
              { lines: '193-216', title: '粘贴：未命中才建行写对象', body: '<p>命中时连 key 都不产生；未命中才分配、建行、put。失败按 <code>E_STORE_FAILED</code> 留痕，不假装 uploaded。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'ingest',
        kicker: 'CORE · 04',
        title: 'ingest 门禁：先确认对象，再跑管线',
        subtitle: 'stat 通过才写 size、转 processing；失败清 chunks 落失败状态。',
        body: '<div class="callout strong"><strong>门禁在业务之前：</strong>对象缺失、0 字节、超限、MIME 不符都不该进入 parse。5.3 把同一张门复用给 confirm-upload，并允许 ready/process_failed 重跑。</div>',
        blocks: [
          {
            id: 'ingest-gate',
            file: 'src/resource/ingest.ts',
            lang: 'ts',
            ranges: [[58, 88], [122, 127], [137, 144]],
            notes: [
              { lines: '58-61', title: 'confirm-upload 入口', badge: '5.3', body: '<p>5.3 补的文件确认入口：PUT 完成后只 stat/验类型/大小并转 <code>uploaded</code>，不解析正文。5.2 原版由 ingest 一并做。</p>' },
              { lines: '63-77', title: 'ingest 入口', body: '<p>门禁通过后按 MIME 选 <code>html</code> / <code>text</code> parser，装 Recipe 交给 <code>runExisting</code>；返回 chunk 数与可选 warning。</p>' },
              { lines: '79-88', title: '状态白名单', badge: '5.3', body: '<p>5.2 只允许 uploading/uploaded/upload_failed；5.3 的 ingest 额外允许 ready/process_failed，用于重入库与重试。</p>' },
              { lines: '122-127', title: '记录 size 并回落 uploaded', body: '<p>stat 已确认对象可读，这里写实际字节数并把状态降回 <code>uploaded</code>；rowCount=0 说明行被删或状态变了，统一报 <code>E_RESOURCE_GONE</code>。</p>' },
              { lines: '137-144', title: '门禁失败也清旧分块', badge: '5.3', body: '<p>失败落 <code>upload_failed</code>；5.3 起还会先删旧 chunks，避免重入库失败后旧内容继续被检索。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'pipeline',
        kicker: 'CORE · 05',
        title: 'fetch 换成 MinIO，五段口径不变',
        subtitle: 'storage fetcher 读 data_uri；parse 之后照旧。',
        body: '<div class="callout"><strong>为什么不在归档时顺便切块：</strong>归档是“保存原样”，ingest 是“理解内容”。分开后可以重跑 ingest、换 chunker、换 embedder，而不用重新上传原始文件。</div>',
        blocks: [
          {
            id: 'fetcher-block',
            file: 'src/ingest/fetch/storage-fetcher.ts',
            lang: 'ts',
            ranges: [[23, 41]],
            notes: [
              { lines: '29-30', title: '对象缺失', badge: '前置', body: '<p>读不到对象直接 <code>E_NO_ORIGINAL</code>；这类错误在门禁里通常已经拦过，这里是 fetch 段自己的兜底。</p>' },
              { lines: '32-40', title: '整份读进 Buffer', badge: '前置', body: '<p>10 MiB 上限内的资源一次性读进内存；<code>raw</code> 从这份 Buffer 解码，5.3 的 hash 复核也在同一份 Buffer 上算，避免两次读取不一致。</p>' },
            ],
          },
          {
            id: 'pipeline-block',
            file: 'src/ingest/ingest.ts',
            lang: 'ts',
            ranges: [[89, 107]],
            notes: [
              { lines: '89-103', title: 'fetch 阶段', badge: '前置', body: '<p>阶段观测记录 content_type / content_length / http_status；不记录正文，也不记录 hash。</p>' },
              { lines: '105-107', title: 'hash 复核', badge: '5.3', body: '<p>5.3 在 parse 前加了一道完整性比对：归档声明的 hash 与读回字节不一致就失败。5.2 本身没有这一段。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'download',
        kicker: 'CORE · 06',
        title: '下载：只签地址，不代理字节',
        subtitle: '对象在不在先 stat；302 到 1h presigned GET，头固定 attachment + no-store。',
        body: '<div class="callout strong"><strong>为什么不让后端转发：</strong>下载大文件会占住 Node 的连接与内存；presigned GET 让浏览器直连 MinIO，后端只承担鉴权与签发。代价是 URL 是临时 bearer token，不能记日志。</div>',
        blocks: [
          {
            id: 'download-block',
            file: 'src/resource/download.ts',
            lang: 'ts',
            ranges: [[54, 84]],
            notes: [
              { lines: '55-69', title: '先确认对象存在', body: '<p>资源不存在 404；<code>data_uri</code> 不是 kc:// 或 bucket 不一致、对象缺失，统一 <code>E_NO_ORIGINAL</code>，不做回填。</p>' },
              { lines: '71-83', title: '签发附件下载', body: '<p>文件名取 key 末段；响应头强制 <code>attachment</code>（RFC 5987）、资源 MIME 与 <code>no-store</code>。presign 失败报 <code>E_PRESIGN_FAILED</code>。</p>' },
            ],
          },
          {
            id: 'disposition-block',
            file: 'src/adapter/storage/disposition.ts',
            lang: 'ts',
            ranges: [[8, 20]],
            notes: [
              { lines: '8-20', title: '中文文件名编码', body: '<p>ASCII fallback 给老客户端，<code>filename*=UTF-8&#39;&#39;</code> 给现代浏览器；两种都写在同一个头里，避免中文/空格乱码。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'restore',
        kicker: 'CORE · 07',
        title: '恢复：只接软删行，先 stat 再回流',
        subtitle: '对象完整才清 deleted_at；恢复不自动 ingest。',
        body: '<div class="callout"><strong>为什么恢复不自动 ingest：</strong>恢复与“重新理解内容”是两件事。5.2 让路由只把行拉回 <code>uploaded</code>，前端再显式调用 ingest；这样失败语义清楚，也方便用户先确认再跑。</div>',
        blocks: [
          {
            id: 'restore-block',
            file: 'src/resource/restore.ts',
            lang: 'ts',
            ranges: [[44, 70]],
            notes: [
              { lines: '45-63', title: '只接软删行 + 对象必须还在', body: '<p>active 行报 <code>E_NOT_DELETED</code>；URI 坏、bucket 不一致、对象缺失都保持软删并报 <code>E_NO_ORIGINAL</code>。</p>' },
              { lines: '65-69', title: '回落 uploaded', body: '<p>写回实际 size 并清 <code>error_reason</code>；如果恢复期间行又被删/改动，重读确认后报 <code>E_RESOURCE_GONE</code>。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'routes',
        kicker: 'CORE · 08',
        title: '路由：三种输入一个端点，下载/恢复分开',
        subtitle: 'POST /resources 只做归档；ingest、original、restore 各自一个动作。',
        body: '<div class="callout"><strong>错误码在路由收口：</strong>归档错误按“有无资源行”映射 422 与 4xx；下载/恢复的错误按 <code>code</code> 映射 404/409。服务层只抛语义错误，不拼 HTTP 状态。</div>',
        blocks: [
          {
            id: 'routes-create',
            file: 'src/routes/resources.ts',
            lang: 'ts',
            ranges: [[346, 362]],
            notes: [
              { lines: '346-362', title: '文件分支', body: '<p>filename/size/hash 校验后调 <code>archive.createFile</code>；有新上传目标返回 201 <code>{ resource, upload }</code>，命中/恢复返回 200 标记（<span class="badge">5.3</span> 的 duplicate/restored 语义）。</p>' },
            ],
          },
          {
            id: 'routes-read',
            file: 'src/routes/resources.ts',
            lang: 'ts',
            ranges: [[245, 285]],
            notes: [
              { lines: '245-263', title: '恢复路由', body: '<p>UUID 校验后调 <code>ResourceRestore</code>；成功 200，错误按 <code>E_NOT_FOUND</code> 404、其余 409，trace 回填 resource_id。</p>' },
              { lines: '265-285', title: '下载路由', body: '<p>签发成功后回 302，只带 <code>Location</code> 与 <code>Cache-Control: no-store</code>；不记录完整 presigned URL。对象缺失 404，其余失败 500。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'frontend',
        kicker: 'CORE · 09',
        title: '前端：逐项归档，再逐项 ingest',
        subtitle: '文件先 create → PUT → confirm（5.3），URL/粘贴归档后同一套 ingest。',
        body: '<div class="callout"><strong>队列不是后台任务：</strong>它是 React 内存数组，刷新即丢；每一项独立提交、独立失败，整批结束再汇总。</div>',
        blocks: [
          {
            id: 'panel-submit',
            file: 'app/web/src/components/upload-panel/upload-panel.tsx',
            source: 'web:src/components/upload-panel/upload-panel.tsx',
            lang: 'ts',
            ranges: [[348, 412]],
            notes: [
              { lines: '348-365', title: '阶段二：逐个 ingest', badge: '5.3', body: '<p>5.2 原版是每项上传后立刻 ingest；5.3 改成先把本批全部归档/确认完，再进入这个循环统一 ingest。</p>' },
              { lines: '367-393', title: '先 prepare 再 ingest', badge: '5.3', body: '<p>预检与阶段一循环所有项；<code>ingestPrepared</code> 只处理已成功归档的资源。单项失败只记在自己的 Stat 上。</p>' },
              { lines: '395-411', title: '按项汇总', body: '<p>done / duplicate / failed 分开计数；有失败给 warning，不把整批判死。</p>' },
            ],
          },
          {
            id: 'client-file',
            file: 'app/web/src/api/client.ts',
            source: 'web:src/api/client.ts',
            lang: 'ts',
            ranges: [[797, 822]],
            notes: [
              { lines: '797-807', title: '建文件资源', badge: '5.3', body: '<p><code>content_hash</code> 是 5.3 必填项；5.2 原版请求体只有 filename/size/title。</p>' },
              { lines: '809-822', title: '直传 MinIO', body: '<p>PUT 的 <code>Content-Type</code> 必须与建行时一致，否则 MinIO 签名校验失败；失败统一映射 <code>E_UPLOAD</code>，提示检查 CORS/网络。</p>' },
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
    <span class="kicker">10 · 取舍与踩坑</span>
    <h2>为什么是这些形状</h2>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">DECISION 01</div>
      <h3>文件直传，URL/粘贴后端写</h3>
      <p>文件最大 10 MiB，直传省后端带宽；URL/粘贴本来就要在服务端处理，顺手写入。三条路径最终都落成同一种 <code>data_uri</code>。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 02</div>
      <h3>ingest 不抓 URL</h3>
      <p>网页会变，抓取时刻的字节才是一份稳定语料。5.2 把 fetch 从“网络”换成“对象存储”，五段管线的其余四段完全不动。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 03</div>
      <h3>下载走 302</h3>
      <p>后端不代理文件字节；presigned GET 让浏览器直连 MinIO。代价是 URL 本身是临时凭证，日志与 trace 都不能记。</p>
    </article>
    <article class="choice">
      <div class="choice-no">DECISION 04</div>
      <h3>软删保留对象</h3>
      <p>删除只清检索数据与 <code>deleted_at</code>；恢复因此不需要重新上传。真正释放对象与 hash 是 5.3 的彻底删除。</p>
    </article>
  </div>
  <ul class="pitfall-list">
    <li><strong>PUT 失败会留下 uploading 行：</strong>浏览器直传失败时后端不知道，行会停到 24h 启动清扫；这是已知缺口，记在 deferred。</li>
    <li><strong>HTTPS 页面直传 HTTP MinIO 会被 mixed content 拦：</strong>CORS 已实测默认放行；手测用 <code>http://localhost:5173</code> 规避，TLS 属部署项。</li>
    <li><strong>旧 data_uri 不回填：</strong>不是 kc:// 的行在 ingest/download/restore 统一 <code>E_NO_ORIGINAL</code>；旧数据已清空。</li>
    <li><strong>归档 trace 是 0 段：</strong>观测只写在 <code>POST /resources/:id/ingest</code> 的五段；归档的 trace 只回填 resource_id。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verify">
  <header class="section-head">
    <span class="kicker">11 · 验证</span>
    <h2>真跑过什么，没跑什么</h2>
    <p class="section-sub">数字是当前全量；5.2 收口当时为后端 16 文件 / 89 例、前端 63 文件 / 594 例。</p>
  </header>
  <div class="test-grid">
    <article class="test-card">
      <h3>后端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npx vitest run</code> → 19 文件 / 115 例全过（含后续 5.3/5.4 新增）。5.2 覆盖归档三来源、presign、门禁、fetch、下载 302、恢复。</p>
    </article>
    <article class="test-card">
      <h3>前端</h3>
      <p><code>npx tsc --noEmit</code> 0 错；<code>npm test</code> → 67 文件 / 612 例全过；<code>npm run build</code> 绿。</p>
    </article>
    <article class="test-card">
      <h3>真实冒烟</h3>
      <p>真 MinIO + 真库：粘贴、URL、文件 presign PUT、缺对象、错类型、0 字节、restore、download 302、重复 ingest 409。</p>
    </article>
    <article class="test-card">
      <h3>未真跑</h3>
      <p>浏览器手测按约定归 Lynx；CORS 已实测默认放行，唯一会挡的是 HTTPS 预览页直传 HTTP MinIO 的 mixed content。</p>
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
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">12 · 衔接</span>
    <h2>5.1 交进来什么，5.3 接什么</h2>
  </header>
  <div class="next-box">
    <p><strong>上一格 · 5.1：</strong>ObjectStore 契约、presign get/put、启动建桶、<code>/health s3.bucket</code>。5.2 直接用这层适配器，不另建薄层。<br><strong>下一格 · 5.3：</strong>SHA-256 内容身份、整批两段式、回收站与彻底删除、ready/失败重入库；它在 5.2 的归档与 ingest 骨架上加规则，不改五段管线。<br><strong>旁支 · 5.4：</strong>代码库 ZIP 独立域，只复用基础设施，不进 resources/ingest。</p>
    <div class="next-links">
      <a href="./epic5-story1-minio-adapter.html">Story 5.1 · MinIO 适配器</a>
      <a href="./epic5-story3-dedup-recycle-reingest.html">Story 5.3 · 去重 / 回收站 / 重入库</a>
      <a href="./epic5-story4-codebases.html">Story 5.4 · 代码库 ZIP</a>
    </div>
  </div>
  <ul class="pitfall-list">
    <li><strong>5.2 的 deferred 仍有效：</strong>PUT 失败遗留 uploading 行、URL 标题覆盖、从 source 重抓、HTTPS mixed content/TLS。</li>
    <li><strong>5.3 改了两处语义：</strong>文件建行必须带 hash；ingest 允许 ready/process_failed 重跑。读 5.2 代码时按徽章区分。</li>
    <li><strong>迁移现状：</strong>资源生命周期迁移当时 13 applied；当前全库 16 applied / 0 pending（含 5.3 hash、5.4 codebases、sessions.group_name）。</li>
  </ul>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 5.2 · 原始归档 / 两段式 ingest / 下载 / 恢复 · 代码来自当前工作区真实文件；行号由 <code>_Agents/walkthroughs/.runs/epic5-story2/walkthrough.config.mjs</code> 重建。</p>
  <p>状态：done（Epic 5 收口）。后续 5.3 补丁以徽章标出；5.4 代码库另页。</p>
</footer>`,
    },
  ],
}
