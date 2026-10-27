export default {
  out: '/Users/lynx/Documents/Dev/SSE_WeSocket/_Agents/walkthroughs/epic5-story1-minio-adapter.html',
  serverRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/server',
  webRoot: '/Users/lynx/Documents/Dev/SSE_WeSocket/app/web',
  title: 'Epic 5 · Story 5.1 对象存储适配器 · 带代码逐行讲解',
  tocTitle: 'Story 5.1',
  tocSub: 'MinIO 适配器 · presign get/put · health',
  accent: '#0369a1',
  accent2: '#0f766e',
  accentDark: '#7dd3fc',
  content: [
    {
      type: 'html',
      html: `
<header class="hero">
  <div class="hero-kicker"><span>EPIC 5 · STORY 5.1</span><span>OBJECT STORAGE · MINIO</span></div>
  <h1>把 MinIO 收进 <em>adapter 第六类</em></h1>
  <p class="hero-sub">一个只做协议的适配器：S3 配置、ObjectStore 契约、presign GET/PUT、启动建桶、<code>/health s3.bucket</code>。它不碰入库、不开路由，也不做公网鉴权。</p>
  <div class="meta-row">
    <span class="chip"><strong>契约</strong>8 个方法</span>
    <span class="chip"><strong>测试</strong>后端 45/45 · 前端 587/587</span>
    <span class="chip"><strong>真跑</strong>MinIO / Range / 过期 / 错类型 403</span>
    <span class="chip"><strong>状态</strong>review</span>
  </div>
  <div class="trace-pill">verification: <b>tsc 0</b> · <b>storage 10</b> · <b>config 3</b> · <b>health 5</b></div>
</header>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="boundary">
  <header class="section-head">
    <span class="kicker">01 · 结论与边界</span>
    <h2>这一格交付什么，不交付什么</h2>
    <p class="section-sub">5.1 的成果不是“文件上传页面”，而是一层可被 5.2/5.3/5.4 复用的对象存储能力，加上启动与健康检查。</p>
  </header>
  <div class="summary-grid">
    <article class="summary-card">
      <div class="summary-no">01 / CONTRACT</div>
      <h3>对象存储形状</h3>
      <p><code>put / stat / get / delete / presignGet / presignPut / ping / ensureBucket</code>。对象不存在返回 <code>null</code>，其它失败统一 <code>ObjectStoreError</code>。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">02 / WIRING</div>
      <h3>装配与启动</h3>
      <p><code>ObjectStoreHandle</code> 只经 <code>adapter/contract.ts</code> 交出；启动时 <code>ensureBucket()</code> 失败只告警；<code>/health</code> 多一张 <code>s3</code> 卡。</p>
    </article>
    <article class="summary-card">
      <div class="summary-no">03 / EVIDENCE</div>
      <h3>真跑过的东西</h3>
      <p>真 MinIO roundtrip、Range 206、过期 403、Host 不一致 403、<code>presignPut</code> 正确类型 200 / 错类型 403、建桶幂等。</p>
    </article>
  </div>
  <div class="callout strong"><strong>不属于 5.1：</strong><code>resources.storage_*</code> 列、ingest 的 <code>store</code> 段、<code>GET /resources/:id/original</code> 302、上传路由、ZIP 解析、公网登录/退出吊销/一次性 token（P5）。前端 health 页的等高布局是 Lynx 的邻接改动，不在本格 AC。</div>
  <table class="file-table">
    <thead><tr><th>文件</th><th>本格职责</th></tr></thead>
    <tbody>
      <tr><td><code>src/config.ts</code></td><td>S3 六位、缺项 fail-fast、endpoint/布尔校验</td></tr>
      <tr><td><code>src/adapter/storage/object-store.ts</code></td><td>契约、错误、presign 上限</td></tr>
      <tr><td><code>src/adapter/storage/s3.ts</code></td><td>S3 client 与 8 个协议操作</td></tr>
      <tr><td><code>src/adapter/contract.ts</code></td><td><code>ObjectStoreHandle</code>，唯一出门</td></tr>
      <tr><td><code>src/index.ts</code></td><td><code>serve()</code> 前建桶检查</td></tr>
      <tr><td><code>src/routes/health.ts</code></td><td><code>s3.bucket</code> 探针</td></tr>
      <tr><td><code>test/config.test.ts</code></td><td>缺 S3 / 非法 endpoint / 非法布尔</td></tr>
      <tr><td><code>test/object-store.test.ts</code></td><td>真实 MinIO 集成</td></tr>
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
    <h2>谁在用这一层</h2>
    <p class="section-sub">调用方只认 <code>ObjectStoreHandle</code>；SDK 只活在 <code>adapter/storage/</code> 里。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>调用方（当前 / 未来）</h3>
      <ul class="flow-list">
        <li><span>启动 <code>ensureBucket</code></span><code>index.ts</code></li>
        <li><span>健康探测 <code>ping</code></span><code>/health</code></li>
        <li><span>5.2 归档 / 下载</span><code>store</code> + 302</li>
        <li><span>5.3 / 5.4 直传</span><code>presignPut</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>适配器</h3>
      <ul class="flow-list">
        <li><span>契约</span><code>ObjectStore</code></li>
        <li><span>对外单例</span><code>ObjectStoreHandle</code></li>
        <li><span>协议实现</span><code>s3.ts</code></li>
        <li><span>错误归一</span><code>ObjectStoreError</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>外部</h3>
      <ul class="flow-list">
        <li><span>MinIO</span><code>kbfile</code></li>
        <li><span>后端通道</span><code>Tailscale</code></li>
        <li><span>浏览器通道</span><code>presigned URL</code></li>
        <li><span>公网形态</span><code>P5</code></li>
      </ul>
    </article>
  </div>
  <p class="map-note">注意：<code>S3_ENDPOINT</code> 同时是后端访问地址和 presign 的 Host；公网部署要拆 public endpoint 时属于 P5。</p>
</section>`,
    },
    {
      type: 'journey',
      id: 'journey',
      kicker: '03 · WALK',
      title: '一次对象操作的旅行',
      subtitle: '点一步跳到代码。先看配置，再看装配、签名、启动与健康。',
      steps: [
        { goto: 'config-file:39-52', title: '读 S3 配置', note: '所有必需项先读再判，缺项在连接前退出', code: 'config L39–52' },
        { goto: 'contract-file:314-328', title: '装配句柄', note: 'ObjectStoreHandle 造 S3 client', code: 'contract L314–328' },
        { goto: 's3-file:104-110', title: '签一个 GET', note: '本地签名，不访问 MinIO', code: 's3 L104–110' },
        { goto: 's3-file:44-55', title: '服务端 put', note: '入库归档走这里，不是 presign', code: 's3 L44–55' },
        { goto: 's3-file:128-145', title: '签一个 PUT', note: '浏览器直传；content-type 被签', code: 's3 L128–145' },
        { goto: 's3-file:147-153', title: '健康探测', note: 'HeadBucket 2 秒，只读', code: 's3 L147–153' },
        { goto: 'index-file:53-59', title: '启动建桶', note: '失败只告警，不阻塞 serve', code: 'index L53–59' },
        { goto: 'health-file:94-102', title: '/health s3.bucket', note: 'MinIO 挂了整体 degraded', code: 'health L94–102' },
      ],
    },
    {
      type: 'code',
      section: {
        id: 'config',
        kicker: 'CORE · 04',
        title: 'AppConfig：S3 六位与 fail-fast',
        subtitle: '缺项必须在任何连接之前退出；endpoint 的 Host 将来会进 presign 签名。',
        body: '<div class="callout"><strong>顺序很重要：</strong>所有必需 env 先读进 <code>missing</code>，再统一 <code>fail</code>。如果把检查放在 <code>DATABASE_URL</code>/<code>S3_*</code> 读取之前，缺这些变量时不会报 <code>E_CONFIG_MISSING</code>。</div>',
        blocks: [
          {
            id: 'config-file',
            file: 'src/config.ts',
            lang: 'ts',
            ranges: [[32, 77], [127, 158]],
            notes: [
              { lines: '32-37', title: 'S3 六位字段', body: '<p>endpoint / region / bucket / accessKey / secret / forcePathStyle。字段是只读的，装配期一次定死。</p>' },
              { lines: '39-52', title: '先读齐，再判缺', body: '<p>八个必需项都在 <code>if (missing.length)</code> 之前读取；缺一个就打印变量名并 <code>exit(1)</code>。这是 review 时修掉的顺序 bug。</p>' },
              { lines: '53-62', title: '非 S3 必需项赋值', body: '<p><code>! </code> 不是“忽略错误”，而是承接上面的检查：走到这里说明值一定存在。embedding 维度仍按原来的 warn 口径。</p>' },
              { lines: '70-75', title: 'S3 赋值与默认', body: '<p>endpoint 做 URL/协议校验并去尾斜杠；region 默认 <code>us-east-1</code>；<code>S3_FORCE_PATH_STYLE</code> 默认 true（MinIO 必须路径风格）。</p>' },
              { lines: '127-138', title: 'endpointOrThrow', body: '<p>只接受 http/https；非法 URL/协议都走 <code>E_CONFIG_INVALID</code>。返回时去掉末尾 <code>/</code>，避免 URL 拼出双斜杠。</p>' },
              { lines: '140-145', title: 'boolOrThrow', body: '<p>只认小写 <code>true</code>/<code>false</code>；<code>yes</code>、<code>TRUE</code> 都直接报错，避免“看起来配了其实没生效”。</p>' },
              { lines: '152-158', title: 'getEnv 的 missing 副作用', body: '<p>传入 <code>missing</code> 时，空值只把变量名推进数组，不打印值；密钥不会进日志或错误信息。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'object-store',
        kicker: 'CORE · 05',
        title: 'ObjectStore：契约与错误语义',
        subtitle: '能力片只依赖这份形状，不依赖 @aws-sdk。',
        body: '<div class="callout"><strong>边界：</strong>“对象不存在”返回 <code>null</code>；“桶不存在 / 无权限 / 网络失败”抛 <code>ObjectStoreError</code>，调用方不需要识别 SDK 错误。</div>',
        blocks: [
          {
            id: 'object-store-file',
            file: 'src/adapter/storage/object-store.ts',
            lang: 'ts',
            ranges: [[1, 77]],
            notes: [
              { lines: '7-8', title: '门内导出', body: '<p>类型与错误从这里出门；<code>adapter/contract.ts</code> 再点名交出，别盒不 import 存储实现。</p>' },
              { lines: '12-49', title: '对象形状', body: '<p><code>ObjectStat</code> 是元信息，<code>ObjectBody</code> 带 Node <code>Readable</code>；<code>presignPut</code> 的 <code>contentType</code> 可选，但一旦给了就签名。</p>' },
              { lines: '52-70', title: '统一错误', body: '<p><code>code=' + 'E_OBJECT_STORE' + '</code>，<code>detail</code> 保存底层错误字符串；<code>toString()</code> 让启动日志能带上原因，但不含密钥。</p>' },
              { lines: '73-77', title: 'presign 上限', body: '<p>1–604800 秒，越界直接抛 <code>ObjectStoreError</code>；上传/下载共用同一把尺子。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 's3',
        kicker: 'CORE · 06',
        title: 'S3 实现：八个操作',
        subtitle: '所有 @aws-sdk 调用都在这一个文件；其它层看不到 Command。',
        body: '<div class="callout"><strong>真跑过：</strong>put/stat/get/delete、Range、presignGet、presignPut、TTL、建桶、Host 403。下面的行号来自当前工作区。</div>',
        blocks: [
          {
            id: 's3-file',
            file: 'src/adapter/storage/s3.ts',
            lang: 'ts',
            ranges: [[1, 180]],
            notes: [
              { lines: '29-42', title: 'createS3Client', body: '<p><code>forcePathStyle</code> 走 MinIO；<code>WHEN_REQUIRED</code> 关掉 SDK 默认附加的 CRC 校验和，避免兼容性问题。</p>' },
              { lines: '44-70', title: 'put / stat', body: '<p>put 是服务端上传，body 直接进 SDK；stat 走 HeadObject，404 返回 <code>null</code>，其它错误包裹后抛。</p>' },
              { lines: '72-102', title: 'get / delete', body: '<p>get 支持 <code>Range</code>，返回 Node 流；delete 幂等（对象不存在也算成功）。</p>' },
              { lines: '104-126', title: 'presignGet', body: '<p>只做本地签名，不访问网络；<code>ResponseContentDisposition / ResponseContentType / ResponseCacheControl 会进 query 并参与签名。</p>' },
              { lines: '128-145', title: 'presignPut', body: '<p>给了 <code>contentType</code> 就用 <code>signableHeaders</code> 把 <code>content-type</code> 签进 <code>X-Amz-SignedHeaders</code>；body 不在签名里，上传后仍需校验。</p>' },
              { lines: '147-169', title: 'ping / ensureBucket', body: '<p>ping 用 HeadBucket + 2 秒；ensureBucket 用 3 秒信号，404 时 CreateBucket，已存在则视为成功。启动失败只告警。</p>' },
              { lines: '171-180', title: '错误识别', body: '<p>只把 404/NoSuchKey 当“对象不存在”；桶不存在会抛错，不会伪装成普通 null。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'contract',
        kicker: 'WIRING · 07',
        title: 'adapter/contract.ts：唯一出门',
        subtitle: 'ObjectStoreHandle 是单例；构造期只造 client，不访问网络。',
        body: '<div class="callout"><strong>SDK 不泄出：</strong>方法签名只出现契约类型与 <code>Uint8Array</code>/<code>Readable</code>，调用方不需要知道 S3Client。</div>',
        blocks: [
          {
            id: 'contract-file',
            file: 'src/adapter/contract.ts',
            lang: 'ts',
            ranges: [[34, 40], [314, 360]],
            notes: [
              { lines: '34-40', title: '门内点名', body: '<p>值导出里加 <code>ObjectStoreHandle</code>，类型导出里加契约与 presign 选项；别盒只从这里取。</p>' },
              { lines: '314-328', title: '单例句柄', body: '<p><code>@singleton()</code> + <code>@inject(AppConfig)</code>；构造里造 client，<b>不</b>发 HeadBucket，避免装配期联网。</p>' },
              { lines: '330-359', title: '纯委托', body: '<p>八个方法全部一行转发；没有业务判断，也没有 SDK 错误处理——那都在 storage/s3.ts。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'index',
        kicker: 'BOOT · 08',
        title: 'index.ts：先清扫，再建桶，再 serve',
        subtitle: '对象存储不可达只告警；服务仍要能提供不依赖文件的聊天/检索。',
        body: '<div class="callout"><strong>决策：</strong>boot 对 storage 失败是 non-blocking；<code>/health</code> 则是 all-green 语义，MinIO 挂了会整体 503（Lynx 2026-10-26 拍板 A）。</div>',
        blocks: [
          {
            id: 'index-file',
            file: 'src/index.ts',
            lang: 'ts',
            ranges: [[19, 20], [28, 65]],
            notes: [
              { lines: '19-20', title: '导入', body: '<p><code>ObjectStoreHandle</code> 与 <code>AppConfig</code> 一起进装配面。</p>' },
              { lines: '28-31', title: '解析句柄', body: '<p>store 与 repo/config 一起解析；只造 client，不联网。</p>' },
              { lines: '42', title: 'health 接线', body: '<p>把 store 交给 <code>createHealthServices</code>，所以 /health 多出 <code>s3.bucket</code>。</p>' },
              { lines: '53-59', title: '启动检查', body: '<p><code>cleanUpOnBoot</code> 之后、<code>serve()</code> 之前；成功 <code>I_OBJECT_STORE</code>，失败 <code>W_OBJECT_STORE</code> 并继续。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'health',
        kicker: 'HEALTH · 09',
        title: '/health：第三个服务组',
        subtitle: 's3.bucket 是一次只读 HeadBucket；整体仍是“全绿才 200”。',
        body: '<div class="callout"><strong>为什么是 503：</strong>现有 health 没有分级，三个服务同等权重；storage 失败就 degraded。若以后要区分核心/非核心，需要单开 health 语义变更。</div>',
        blocks: [
          {
            id: 'health-file',
            file: 'src/routes/health.ts',
            lang: 'ts',
            ranges: [[45, 60], [94, 106], [119, 144]],
            notes: [
              { lines: '45-48', title: '签名与分组', body: '<p><code>createHealthServices(Config, Repo, Store)</code> 现在返回 postgres / ollama / s3 三组。</p>' },
              { lines: '94-106', title: 's3.bucket', body: '<p>探针只调用 <code>Store.ping()</code>（HeadBucket 2 秒）；成功返回 <code>{ ok: true }</code>，失败由外层 catch 转 ok:false。</p>' },
              { lines: '119-144', title: '聚合与缓存', body: '<p>并发跑探针、单项失败不炸整体；服务全 ok 才顶层 200，否则 503；整份结果缓存 5 秒。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'storage-tests',
        kicker: 'TESTS · 10',
        title: '真实 MinIO：从建桶到 presigned',
        subtitle: '没有 mock；测试直接打 Tailscale 上的 MinIO。',
        body: '<div class="callout"><strong>覆盖：</strong>建桶/删桶、roundtrip、Range、presignGet 的 attachment+nosniff、presignPut 的 content-type、换类型 403、过期 403、missing null、非法 expiresIn。</div>',
        blocks: [
          {
            id: 'storage-tests',
            file: 'test/object-store.test.ts',
            lang: 'ts',
            ranges: [[44, 66], [98, 166]],
            notes: [
              { lines: '44-48', title: '幂等', body: '<p>同一个桶连续调两次 <code>ensureBucket</code> 都不抛。</p>' },
              { lines: '50-66', title: '创建临时桶', body: '<p>用独立 S3 client 建一个不存在的桶，再调一次；finally 里 DeleteBucket。这是 AC 里“建桶路径”的自动化。</p>' },
              { lines: '98-127', title: 'presignGet', body: '<p>签出的 URL host 必须等于 <code>S3_ENDPOINT</code>；fetch 200，<code>Content-Disposition</code> 带 attachment，MinIO 默认 <code>nosniff</code>。</p>' },
              { lines: '128-153', title: 'presignPut', body: '<p><code>X-Amz-SignedHeaders</code> 含 <code>content-type</code>；正确类型 PUT 200，再把内容读回来核对。</p>' },
              { lines: '155-165', title: '错类型 403', body: '<p>同一个 PUT URL 换成 <code>application/json</code>，MinIO 返回 403，证明 content-type 真的被签。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'config-tests',
        kicker: 'TESTS · 11',
        title: '配置失败路径',
        subtitle: 'AppConfig 会 exit(1)，只能在子进程里断言。',
        body: '<div class="callout"><strong>为什么不用 mock：</strong><code>process.exit</code> 不可 catch；spawn 一个 tsx 子进程，看退出码与 stdout 才是真实行为。</div>',
        blocks: [
          {
            id: 'config-tests',
            file: 'test/config.test.ts',
            lang: 'ts',
            ranges: [[36, 73]],
            notes: [
              { lines: '36-48', title: '缺 S3_*', body: '<p>只给非 S3 必需项，四个 S3 缺失必须同时出现在 <code>E_CONFIG_MISSING</code> 的变量名列表里。</p>' },
              { lines: '49-60', title: '坏 endpoint', body: '<p><code>ftp://</code> 不是 http/https → <code>E_CONFIG_INVALID</code>。</p>' },
              { lines: '61-73', title: '坏布尔', body: '<p><code>S3_FORCE_PATH_STYLE=yes</code> → <code>E_CONFIG_INVALID</code>，不会静默当成 true。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'health-tests',
        kicker: 'TESTS · 12',
        title: 'health 的两条关键断言',
        subtitle: '真链路全绿；把 s3 探针弄坏则整体 degraded。',
        body: '<div class="callout"><strong>真链路会抖动：</strong>远端 DB 的 <code>postgres.ping</code> 偶发瞬时 false；项目接受这类真实网络波动。</div>',
        blocks: [
          {
            id: 'health-tests',
            file: 'test/health-chain.test.ts',
            lang: 'ts',
            ranges: [[50, 67], [147, 159]],
            notes: [
              { lines: '50-67', title: '三服务真链路', body: '<p>断言服务顺序 postgres / ollama / s3，并检查 <code>s3.bucket.ok</code>；整体状态由三条服务的与运算决定。</p>' },
              { lines: '147-159', title: 's3 探针失败', body: '<p>spy 掉 <code>Store.ping</code>，确认 <code>s3.ok=false</code>、detail 含原因、顶层 503。</p>' },
            ],
          },
        ],
      },
    },
    {
      type: 'code',
      section: {
        id: 'probe',
        kicker: 'ADJACENT · 13',
        title: '前端探针列表多一行',
        subtitle: '只让设计器能选到 s3.bucket；health 页本身按服务名动态渲染。',
        body: '<div class="callout"><strong>邻接改动：</strong>这行不属于 5.1 后端 AC；health 页三卡等高布局是 Lynx 的改动，浏览器手测由 Lynx 完成。</div>',
        blocks: [
          {
            id: 'probe-file',
            file: 'app/web/src/components/widget/probe-sources.ts',
            source: 'web:src/components/widget/probe-sources.ts',
            lang: 'ts',
            ranges: [[1, 14]],
            notes: [
              { lines: '1-3', title: '口径对齐', body: '<p>注释里补上 <code>s3.bucket</code>，提醒后续加探针时前后端名字要对齐。</p>' },
              { lines: '8-14', title: 's3.bucket', body: '<p>设计器的默认探针列表多一项“对象存储”；health 页不读这张表，它直接渲染后端返回的 services。</p>', badge: '现状' },
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
    <span class="kicker">14 · 取舍与踩坑</span>
    <h2>为什么这么写，否掉了什么</h2>
    <p class="section-sub">这几条如果忘了，下一次很容易写回错误版本。</p>
  </header>
  <div class="choice-grid">
    <article class="choice">
      <div class="choice-no">A</div>
      <h3>Host 必须一致</h3>
      <p>SigV4 把 Host 签进 URL。后端用域名签、浏览器用 IP 请求会 <code>SignatureDoesNotMatch</code>。所以 <code>S3_ENDPOINT</code> 必须是浏览器实际访问的那个 Host；公网反代要保留 Host。</p>
    </article>
    <article class="choice">
      <div class="choice-no">B</div>
      <h3>contentType 可选，但给了就签</h3>
      <p><code>presignPut</code> 默认只签 host；传了 <code>contentType</code> 就用 <code>signableHeaders</code> 显式签 <code>content-type</code>。body 不在签名里，上传后必须 HEAD 校验内容。</p>
    </article>
    <article class="choice">
      <div class="choice-no">C</div>
      <h3>MinIO 的 checksum 兼容</h3>
      <p>SDK 默认可能附加 CRC 校验和；这里设 <code>WHEN_REQUIRED</code>，避免 S3 兼容服务不认。代价是默认不做响应校验，生产要按需打开。</p>
    </article>
    <article class="choice">
      <div class="choice-no">D</div>
      <h3>404 的两种含义</h3>
      <p>对象 404 → 返回 <code>null</code>；桶 404 → 抛 <code>ObjectStoreError</code>。不要把“桶没建好”伪装成“对象不存在”，否则调用方会把基础设施故障当业务空值。</p>
    </article>
  </div>
  <div class="callout strong"><strong>health 拍板 A：</strong>保持“全绿才 200”，storage 是第三个关键服务；MinIO 挂了整体 503。boot 仍 non-blocking，两者语义不同但都明确。</div>
  <div class="callout"><strong>Review 发现的上公网前事项：</strong>当前应用使用 MinIO root 凭据；5.2 要换专用用户（含 <code>s3:ListBucket</code> 以支持 HeadBucket），生产预建桶、不给 <code>CreateBucket</code>。已记入 deferred。</div>
  <div class="callout"><strong>验证债：</strong><code>test/</code> 被 gitignore，health 测试与 env loader 修复不在版本控制；新 storage/config 测试在 <code>src/</code> 下，但仍依赖 <code>test/setup-env.ts</code>。这是已知跨阶段项。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="verification">
  <header class="section-head">
    <span class="kicker">15 · 自测清单</span>
    <h2>可复制命令与预期</h2>
    <p class="section-sub">标“真跑”的是本轮实际执行过的；标“路径”的是代码存在但未在页面生成时重跑。</p>
  </header>
  <div class="test-grid">
    <article class="test-card">
      <h3>01 · 类型</h3>
      <pre class="snippet">cd app/server
npx tsc --noEmit</pre>
      <p class="test-note"><strong>真跑：</strong>0 错。</p>
    </article>
    <article class="test-card">
      <h3>02 · 存储 + 配置</h3>
      <pre class="snippet">npx vitest run \\
  test/object-store.test.ts \\
  test/config.test.ts</pre>
      <p class="test-note"><strong>真跑：</strong>10 + 3 = 13 条通过。</p>
    </article>
    <article class="test-card">
      <h3>03 · 后端全量</h3>
      <pre class="snippet">cd app/server
npx vitest run</pre>
      <p class="test-note"><strong>真跑：</strong>11 文件 / 45 条通过。</p>
    </article>
    <article class="test-card">
      <h3>04 · 前端</h3>
      <pre class="snippet">cd app/web
npm test</pre>
      <p class="test-note"><strong>真跑：</strong>62 文件 / 587 条通过。</p>
    </article>
    <article class="test-card">
      <h3>05 · 启动 + health</h3>
      <pre class="snippet">cd app/server
PORT=3101 timeout 8s \\
  ./node_modules/.bin/tsx --env-file=.env src/index.ts
curl -sS http://127.0.0.1:3101/health</pre>
      <p class="test-note"><strong>真跑：</strong>200 + <code>I_OBJECT_STORE</code>；<code>s3.bucket.ok=true</code>。</p>
    </article>
    <article class="test-card">
      <h3>06 · presign 手动链路</h3>
      <pre class="snippet">mc alias set kc http://aliyun2c2g300mbps.tail8d0baa.ts.net:9000
printf 'hello presign\\n' | mc pipe kc/kbfile/hello-presign.txt
URL="$(mc share download --expire 1h kc/kbfile/hello-presign.txt | sed -n 's/^Share: //p')"
curl -i "$URL"          # 200 + Accept-Ranges + nosniff
curl -i -r 0-4 "$URL"  # 206 + Content-Range
BAD="\${URL/aliyun2c2g300mbps.tail8d0baa.ts.net/100.113.172.47}"
curl -i "$BAD"          # 403 SignatureDoesNotMatch</pre>
      <p class="test-note"><strong>真跑：</strong>200 / 206 / Host 403；2s TTL 等 3s 后 403 <code>AccessDenied</code> + <code>Request has expired</code>。</p>
    </article>
    <article class="test-card">
      <h3>07 · presignPut</h3>
      <pre class="snippet"># 在测试里：正确 Content-Type PUT → 200
# 换成 application/json → 403
npx vitest run test/object-store.test.ts</pre>
      <p class="test-note"><strong>真跑：</strong><code>X-Amz-SignedHeaders=content-type;host</code>；错类型 403。</p>
    </article>
    <article class="test-card">
      <h3>08 · 浏览器手测</h3>
      <pre class="snippet">open _Agents/walkthroughs/epic5-story1-minio-adapter.html</pre>
      <p class="test-note"><strong>留给 Lynx：</strong><code>/health</code> 三卡等高布局、侧栏/代码高亮/主题切换。</p>
    </article>
  </div>
</section>`,
    },
    {
      type: 'html',
      html: `
<section class="section" id="continuity">
  <header class="section-head">
    <span class="kicker">16 · 衔接</span>
    <h2>前后 story 怎么接</h2>
    <p class="section-sub">5.1 只提供能力；真正用起来在 5.2/5.3/5.4。</p>
  </header>
  <div class="flow-map">
    <article class="flow-card">
      <h3>前置</h3>
      <ul class="flow-list">
        <li><span>P1 入库/检索/聊天</span><code>done</code></li>
        <li><span>AD-2 六类</span><code>已改</code></li>
        <li><span>远程 MinIO</span><code>kbfile</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>本格 5.1</h3>
      <ul class="flow-list">
        <li><span>ObjectStore 契约</span><code>可用</code></li>
        <li><span>presignGet/Put</span><code>可用</code></li>
        <li><span>boot + health</span><code>已接</code></li>
      </ul>
    </article>
    <article class="flow-card">
      <h3>下一格 5.2</h3>
      <ul class="flow-list">
        <li><span>resources.storage_*</span><code>待做</code></li>
        <li><span>ingest store 段</span><code>OQ-5.2-3</code></li>
        <li><span>GET /resources/:id/original</span><code>302</code></li>
      </ul>
    </article>
  </div>
  <table class="file-table">
    <thead><tr><th>下一步</th><th>用 5.1 的什么</th><th>先收什么</th></tr></thead>
    <tbody>
      <tr><td><strong>5.2 原始归档/下载</strong></td><td><code>put</code> / <code>presignGet</code> / <code>delete</code></td><td>OQ-5.2-3（store 独立 stage vs 折进 write）、OQ-5.2-4（无 storage_key）</td></tr>
      <tr><td><strong>5.3 .md/.txt 上传</strong></td><td><code>put</code> 或 <code>presignPut</code></td><td>OQ-5.3-1 大小/编码/文件名</td></tr>
      <tr><td><strong>5.4 ZIP</strong></td><td><code>put</code> / <code>get</code></td><td>OQ-5.4-1..4；安全校验在能力片</td></tr>
      <tr><td><strong>P5 公网</strong></td><td>presigned URL 是 bearer</td><td>登录/退出吊销、IP、一次性、边缘反代</td></tr>
    </tbody>
  </table>
  <div class="callout strong"><strong>一句话记住 5.1：</strong>把“怎么和 MinIO 说话”收进一个单例适配器；调用方只拿对象和 URL，不拿 SDK。下一格开始，才把资源、原文和下载语义接上去。</div>
</section>`,
    },
    {
      type: 'html',
      html: `
<footer class="footer">
  <p>Story 5.1 · MinIO 适配器与配置 · 2026-10-26</p>
  <p>来源：当前工作区 <code>app/server/src</code>、<code>app/web/src/components/widget/probe-sources.ts</code>；验收与 findings 见 <code>_Agents/implementation-artifacts/handoff-2026-10-26-epic5-story1-minio-adapter.md</code> 与 <code>review-2026-10-26-epic5-story1.md</code>。</p>
</footer>`,
    },
  ],
}
