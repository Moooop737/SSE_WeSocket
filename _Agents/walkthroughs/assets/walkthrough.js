(function () {
  var ApiId = 0

  function statusOf(NoteText, RequestText) {
    var Match = String(NoteText).match(/HTTP\s+(\d{3})/i)
      || String(NoteText).match(/预期\s*(\d{3})/)
      || String(RequestText).match(/HTTP\s+(\d{3})/i)
    if (!Match) return null
    var Code = Match[1]
    var NumberCode = Number(Code)
    var Class = NumberCode >= 200 && NumberCode < 300 ? 's2'
      : NumberCode >= 300 && NumberCode < 400 ? 's3'
        : NumberCode >= 400 && NumberCode < 500 ? 's4' : 's5'
    return { Code: Code, Class: Class }
  }

  function methodOf(Text) {
    var Explicit = Text.match(/\s-X\s+['"]?(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b/i)
    if (Explicit) return Explicit[1].toUpperCase()
    if (/\s(-d|--data|--data-raw|--json)\s/.test(Text)) return 'POST'
    return 'GET'
  }

  function pathOf(Text) {
    var Url = Text.match(/https?:\/\/[^\s\\'"]+/)
    if (Url) {
      try {
        var Parsed = new URL(Url[0])
        return Parsed.pathname + Parsed.search
      } catch (Error) {
        return Url[0]
      }
    }
    var Relative = Text.match(/(?:^|\s)(\/[A-Za-z0-9_./?=&-]+)/)
    return Relative ? Relative[1] : ''
  }

  function kindOf(Text) {
    var First = Text.trim().split('\n')[0].trim()
    if (/^curl\b/.test(First)) {
      return { Kind: 'curl', Label: 'cURL', Method: methodOf(Text), Path: pathOf(Text) }
    }
    if (/^(psql|SELECT|WITH|INSERT|UPDATE|DELETE\s+FROM|CREATE|ALTER)\b/i.test(First)) {
      return { Kind: 'sql', Label: 'SQL' }
    }
    if (/^[{[]/.test(First)) {
      return { Kind: 'json', Label: 'JSON' }
    }
    if (/^(npm|npx|node|cd|export|PORT=|RETRIEVAL_|EMBEDDING_|DATABASE_URL=|uv |python|bash|sh |EMBEDDING_)/.test(First)) {
      return { Kind: 'shell', Label: 'SHELL' }
    }
    return { Kind: 'text', Label: 'TEXT' }
  }

  function copyText(Text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(Text).then(function () { return true }).catch(function () { return fallbackCopy(Text) })
    }
    return Promise.resolve(fallbackCopy(Text))
  }

  function fallbackCopy(Text) {
    var Area = document.createElement('textarea')
    Area.value = Text
    Area.setAttribute('readonly', '')
    Area.style.position = 'fixed'
    Area.style.opacity = '0'
    document.body.appendChild(Area)
    Area.select()
    var Ok = false
    try { Ok = document.execCommand('copy') } catch (Error) {}
    Area.remove()
    return Ok
  }

  function feedback(Button, Text) {
    var Original = Button.getAttribute('data-label') || '复制'
    Button.setAttribute('data-label', Original)
    Button.textContent = Text
    Button.disabled = true
    setTimeout(function () {
      Button.textContent = Original
      Button.disabled = false
    }, 1200)
  }

  function enhance(Snippet) {
    if (Snippet.closest('.api-card')) return
    var Text = Snippet.textContent || ''
    if (!Text.trim()) return
    var Info = kindOf(Text)
    var Card = document.createElement('div')
    Card.className = 'api-card'
    Card.setAttribute('data-kind', Info.Kind)
    var Head = document.createElement('div')
    Head.className = 'api-head'
    if (Info.Kind === 'curl') {
      var Method = document.createElement('span')
      Method.className = 'method ' + Info.Method.toLowerCase()
      Method.textContent = Info.Method
      Head.appendChild(Method)
      var Path = document.createElement('code')
      Path.className = 'api-path'
      Path.textContent = Info.Path || '/'
      Head.appendChild(Path)
    } else {
      var Kind = document.createElement('span')
      Kind.className = 'method ' + Info.Kind
      Kind.textContent = Info.Label
      Head.appendChild(Kind)
    }
    var Spacer = document.createElement('span')
    Spacer.className = 'api-kind'
    Spacer.textContent = Info.Kind === 'curl' ? 'cURL' : '命令'
    Head.appendChild(Spacer)
    var Copy = document.createElement('button')
    Copy.type = 'button'
    Copy.className = 'api-copy'
    Copy.textContent = '复制'
    Copy.setAttribute('data-label', '复制')
    Copy.setAttribute('aria-label', '复制这段命令')
    Copy.addEventListener('click', function () {
      copyText(Text).then(function (Ok) {
        feedback(Copy, Ok ? '已复制' : '复制失败')
      })
    })
    Head.appendChild(Copy)

    var Note = Snippet.nextElementSibling
    if (!Note || !Note.classList || !Note.classList.contains('test-note')) Note = null
    var Body = document.createElement('div')
    Body.className = 'api-body'
    Snippet.replaceWith(Card)
    if (Note) {
      ApiId += 1
      var RequestId = 'api-' + ApiId + '-request'
      var ResponseId = 'api-' + ApiId + '-response'
      var Tabs = document.createElement('div')
      Tabs.className = 'api-tabs'
      Tabs.setAttribute('role', 'tablist')
      var RequestTab = document.createElement('button')
      RequestTab.type = 'button'
      RequestTab.className = 'api-tab active'
      RequestTab.textContent = Info.Kind === 'curl' ? 'Request' : '命令'
      RequestTab.setAttribute('role', 'tab')
      RequestTab.setAttribute('aria-selected', 'true')
      RequestTab.setAttribute('aria-controls', RequestId)
      var ResponseTab = document.createElement('button')
      ResponseTab.type = 'button'
      ResponseTab.className = 'api-tab'
      ResponseTab.textContent = Info.Kind === 'curl' ? 'Response' : '结果'
      ResponseTab.setAttribute('role', 'tab')
      ResponseTab.setAttribute('aria-selected', 'false')
      ResponseTab.setAttribute('aria-controls', ResponseId)
      var Status = statusOf(Note.textContent || '', Text)
      if (Status) {
        var StatusNode = document.createElement('span')
        StatusNode.className = 'api-status ' + Status.Class
        StatusNode.textContent = Status.Code
        Tabs.appendChild(RequestTab)
        Tabs.appendChild(ResponseTab)
        Tabs.appendChild(StatusNode)
      } else {
        Tabs.appendChild(RequestTab)
        Tabs.appendChild(ResponseTab)
      }
      var Panels = document.createElement('div')
      Panels.className = 'api-panels'
      var RequestPanel = document.createElement('div')
      RequestPanel.className = 'api-panel'
      RequestPanel.id = RequestId
      RequestPanel.setAttribute('role', 'tabpanel')
      RequestPanel.appendChild(Snippet)
      var ResponsePanel = document.createElement('div')
      ResponsePanel.className = 'api-response'
      ResponsePanel.id = ResponseId
      ResponsePanel.setAttribute('role', 'tabpanel')
      ResponsePanel.hidden = true
      ResponsePanel.appendChild(Note)
      Panels.appendChild(RequestPanel)
      Panels.appendChild(ResponsePanel)
      function select(Which) {
        var IsRequest = Which === 'request'
        RequestTab.classList.toggle('active', IsRequest)
        ResponseTab.classList.toggle('active', !IsRequest)
        RequestTab.setAttribute('aria-selected', String(IsRequest))
        ResponseTab.setAttribute('aria-selected', String(!IsRequest))
        RequestPanel.hidden = !IsRequest
        ResponsePanel.hidden = IsRequest
      }
      RequestTab.addEventListener('click', function () { select('request') })
      ResponseTab.addEventListener('click', function () { select('response') })
      Body.appendChild(Tabs)
      Body.appendChild(Panels)
    } else {
      Body.appendChild(Snippet)
    }
    Card.appendChild(Head)
    Card.appendChild(Body)
    Snippet.classList.add('api-code')
  }

  function esc(Value) {
    return String(Value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function currentTheme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  }

  function filmUrl(Kind, Name, Theme, Embed) {
    var Params = new URLSearchParams()
    Params.set(Kind === 'clip' ? 'clip' : 'film', Name)
    Params.set('theme', Theme)
    Params.set('v', '20261026n')
    if (Embed) Params.set('embed', '1')
    return 'anim/ingest-film.html?' + Params.toString()
  }

  function syncFilmAssets() {
    var Theme = currentTheme()
    Array.prototype.forEach.call(document.querySelectorAll('iframe[data-film-clip]'), function (Frame) {
      if (Frame.getAttribute('src') && Frame.getAttribute('data-film-theme') === Theme) return
      var Next = filmUrl('clip', Frame.getAttribute('data-film-clip'), Theme, true)
      var Stage = Frame.getAttribute('data-film-stage')
      if (Stage) Next += '&stage=' + encodeURIComponent(Stage)
      Frame.src = Next
      Frame.setAttribute('data-film-theme', Theme)
    })
    Array.prototype.forEach.call(document.querySelectorAll('a[data-film]'), function (Link) {
      Link.href = filmUrl('film', Link.getAttribute('data-film'), Theme, false)
    })
  }

  function mountFilms() {
    if (document.getElementById('film-mounted')) return
    var Marker = document.createElement('span')
    Marker.id = 'film-mounted'
    Marker.hidden = true
    document.body.appendChild(Marker)
    var Specs = [
      { clip: 'slice', anchor: '#code-chunk', afterHead: true, title: '切片逻辑', duration: '约 12 秒', note: '刀片按分隔符扫过；代码块整段保护；示意 16 块中的前 5 块。' },
      { clip: 'vectors', anchor: '#block-embed-chunks', title: '向量化', duration: '约 9 秒', note: '16 个 chunk 一次 embedMany；条数必须对齐。' },
      { clip: 'commit', anchor: '#block-repo-chunk', title: '事务写入', duration: '约 9 秒', note: 'chunk、向量、ready 同事务；任一步失败整笔回滚。' }
    ]
    Specs.forEach(function (Spec) {
      var Anchor = document.querySelector(Spec.anchor)
      if (!Anchor) return
      var Figure = document.createElement('figure')
      Figure.className = 'film-figure'
      Figure.innerHTML = '<figcaption class="film-figure-head"><span class="film-kicker">ANIMATION · ' + esc(Spec.clip.toUpperCase()) + '</span><strong>' + esc(Spec.title) + '</strong><span class="film-duration">' + esc(Spec.duration) + '</span><span class="film-swipe">左右滑动</span></figcaption><div class="film-scroll"><iframe class="film-frame" data-film-clip="' + esc(Spec.clip) + '" title="' + esc(Spec.title) + '动画" loading="lazy"></iframe></div><p class="film-note">' + esc(Spec.note) + '</p>'
      if (Spec.afterHead) Anchor.querySelector('.section-head').after(Figure)
      else Anchor.parentNode.insertBefore(Figure, Anchor)
    })
    var Launch = document.querySelector('#guided-flow .flow-launch')
    if (Launch) {
      var Row = document.createElement('div')
      Row.className = 'film-watch-row'
      var Watch = document.createElement('a')
      Watch.className = 'film-watch'
      Watch.setAttribute('data-film', 'success')
      Watch.target = '_blank'
      Watch.rel = 'noreferrer'
      Watch.innerHTML = '<span>看完整入库动画</span><small>49 秒 · URL → ready</small>'
      Row.appendChild(Watch)
      var Catalog = document.createElement('a')
      Catalog.className = 'film-index-link'
      Catalog.href = 'anim/index.html'
      Catalog.textContent = '动画目录'
      Row.appendChild(Catalog)
      Launch.after(Row)
    }
    syncFilmAssets()
  }

  function parseLines(Spec) {
    var Out = []
    String(Spec).split(',').forEach(function (Part) {
      var Bits = Part.trim().split('-').map(Number)
      if (Bits.length === 2 && Number.isFinite(Bits[0]) && Number.isFinite(Bits[1])) {
        for (var i = Bits[0]; i <= Bits[1]; i += 1) Out.push(i)
      } else if (Bits.length === 1 && Number.isFinite(Bits[0])) {
        Out.push(Bits[0])
      }
    })
    return Out
  }

  function statusClass(Code) {
    var N = Number(Code)
    if (N >= 200 && N < 300) return 'success'
    if (N >= 400 && N < 500) return 'warning'
    if (N >= 500) return 'danger'
    return ''
  }

  function resultHtml(Result) {
    var Head = '<div class="flow-result-head"><span>模拟结果</span><span class="flow-sim">SIMULATED</span></div>'
    if (!Result) return Head
    if (Result.kind === 'request') {
      return Head + '<div class="flow-request"><span class="method ' + esc((Result.method || 'get').toLowerCase()) + '">' + esc(Result.method) + '</span><code class="api-path">' + esc(Result.path) + '</code>' + (Result.status ? '<span class="flow-pill">' + esc(Result.status) + '</span>' : '') + '</div>' + (Result.body ? '<pre class="flow-code">' + esc(Result.body) + '</pre>' : '')
    }
    if (Result.kind === 'state') {
      return Head + '<div class="flow-state"><span class="flow-pill">' + esc(Result.from) + '</span><span class="flow-arrow">→</span><span class="flow-pill ' + statusClass(Result.to === 'ready' ? 200 : 0) + '">' + esc(Result.to) + '</span></div>' + (Result.meta ? '<div class="flow-meta">' + esc(Result.meta) + '</div>' : '')
    }
    if (Result.kind === 'response') {
      return Head + '<div class="flow-state"><span class="flow-pill ' + statusClass(Result.status) + '">' + esc(Result.status) + '</span><span class="flow-meta" style="margin:0">' + esc(Result.meta) + '</span></div>' + (Result.detail ? '<pre class="flow-code">' + esc(Result.detail) + '</pre>' : '')
    }
    if (Result.kind === 'metrics') {
      var Items = (Result.items || []).map(function (Item) { return '<div class="flow-metric"><strong>' + esc(Item[0]) + '</strong><span>' + esc(Item[1]) + '</span></div>' }).join('')
      return Head + '<div class="flow-metrics">' + Items + '</div>' + (Result.note ? '<div class="flow-meta">' + esc(Result.note) + '</div>' : '')
    }
    if (Result.kind === 'chunks') {
      var Preview = (Result.preview || []).map(function (Item) { return '<div class="flow-meta">' + esc(Item) + '</div>' }).join('')
      return Head + '<div class="flow-count-big">' + esc(Result.count) + ' chunks</div><div class="flow-meta">offsets ' + esc(Result.offsets) + '</div>' + Preview
    }
    if (Result.kind === 'vectors') {
      var Dots = ''
      for (var i = 0; i < Math.min(Number(Result.count) || 0, 24); i += 1) Dots += '<span></span>'
      return Head + '<div class="flow-count-big">' + esc(Result.count) + ' × ' + esc(Result.dim) + ' dims</div><div class="flow-dots">' + Dots + '</div><div class="flow-meta">' + esc(Result.model) + '</div>'
    }
    if (Result.kind === 'commit') {
      return Head + '<div class="flow-state"><span class="flow-pill success">' + esc(Result.status) + '</span><span class="flow-meta" style="margin:0">' + esc(Result.meta) + '</span></div><div class="flow-meta">' + esc(Result.tables) + '</div>'
    }
    if (Result.kind === 'failure') {
      return Head + '<div class="flow-state"><span class="flow-pill danger">' + esc(Result.status) + '</span><span class="flow-pill warning">' + esc(Result.reason) + '</span></div><div class="flow-meta">' + esc(Result.meta) + '</div>'
    }
    return Head
  }

  function initFlow() {
    var DataNode = document.getElementById('flow-data')
    var Picker = document.getElementById('flow-picker')
    var Launch = document.getElementById('flow-start')
    if (!DataNode || (!Picker && !Launch)) return
    var Data
    try { Data = JSON.parse(DataNode.textContent) } catch (Error) { return }
    var Flows = Array.isArray(Data.flows) ? Data.flows : [{ id: 'default', label: '导览', steps: Data.steps, stages: Data.stages }]
    Flows = Flows.filter(function (Flow) { return Flow && Array.isArray(Flow.steps) && Flow.steps.length > 0 })
    if (Flows.length === 0) return

    var Panel = document.createElement('div')
    Panel.className = 'flow-panel'
    Panel.id = 'flow-panel'
    Panel.hidden = true
    Panel.setAttribute('role', 'region')
    Panel.setAttribute('aria-label', 'Guided flow')
    Panel.innerHTML = '<div class="flow-head"><span class="flow-kicker">GUIDED FLOW</span><select class="flow-select" id="flow-select" aria-label="选择链路"></select><span class="flow-count" id="flow-count"></span><button type="button" class="flow-close" id="flow-close" aria-label="关闭导览">×</button></div><div class="flow-rail" id="flow-rail"></div><h3 class="flow-title" id="flow-title" aria-live="polite"></h3><div class="flow-result" id="flow-result"></div><div class="flow-anim" id="flow-anim" hidden></div><p class="flow-explain" id="flow-explain"></p><div class="flow-actions"><button type="button" id="flow-prev">上一步</button><button type="button" id="flow-next" class="primary">下一步 →</button></div>'
    document.body.appendChild(Panel)
    var Reopen = document.createElement('button')
    Reopen.type = 'button'
    Reopen.className = 'flow-reopen'
    Reopen.id = 'flow-reopen'
    Reopen.textContent = '继续导览'
    Reopen.hidden = true
    document.body.appendChild(Reopen)

    var Select = document.getElementById('flow-select')
    var Count = document.getElementById('flow-count')
    var Rail = document.getElementById('flow-rail')
    var Title = document.getElementById('flow-title')
    var Result = document.getElementById('flow-result')
    var Anim = document.getElementById('flow-anim')
    var Explain = document.getElementById('flow-explain')
    var Prev = document.getElementById('flow-prev')
    var Next = document.getElementById('flow-next')
    var Close = document.getElementById('flow-close')
    var FlowIndex = 0
    var Index = 0

    if (Flows.length > 1) {
      Flows.forEach(function (Flow, FlowIndexValue) {
        var Option = document.createElement('option')
        Option.value = String(FlowIndexValue)
        Option.textContent = Flow.label + ' · ' + Flow.steps.length + ' 步'
        Select.appendChild(Option)
      })
    } else {
      Select.hidden = true
    }
    if (Picker) {
      Flows.forEach(function (Flow, FlowIndexValue) {
        var Button = document.createElement('button')
        Button.type = 'button'
        Button.className = 'flow-pick'
        Button.innerHTML = '<strong>' + esc(Flow.label) + '</strong><span>' + Flow.steps.length + ' 步</span>'
        Button.addEventListener('click', function () { open(FlowIndexValue, true) })
        Picker.appendChild(Button)
      })
    }
    if (Launch) Launch.addEventListener('click', function () { open(0, true) })

    function currentFlow() { return Flows[FlowIndex] }
    function currentStep() { return currentFlow().steps[Index] }

    function renderRail() {
      var Stages = currentFlow().stages || Data.stages || []
      Rail.innerHTML = ''
      Stages.forEach(function (Label, StageIndex) {
        var Node = document.createElement('span')
        Node.className = 'flow-stage'
        Node.setAttribute('data-stage', String(StageIndex))
        Node.textContent = Label
        Rail.appendChild(Node)
      })
    }

    function clearHighlights() {
      document.querySelectorAll('.line.hl').forEach(function (Line) { Line.classList.remove('hl') })
    }

    function activateNote(Note) {
      document.querySelectorAll('.note.active').forEach(function (Item) {
        Item.classList.remove('active')
        Item.setAttribute('aria-pressed', 'false')
      })
      if (!Note) return
      Note.classList.add('active')
      Note.setAttribute('aria-pressed', 'true')
    }

    function highlightStep(Step) {
      clearHighlights()
      var Code = document.querySelector('.code[data-code="' + Step.code + '"]')
      if (!Code) return
      parseLines(Step.lines).forEach(function (Number) {
        var Line = Code.querySelector('.line[data-line="' + Number + '"]')
        if (Line) Line.classList.add('hl')
      })
      var Block = document.getElementById('block-' + Step.code)
      if (Block) Block.scrollIntoView({ behavior: 'smooth', block: 'start' })
      var Note = document.querySelector('.note[data-code="' + Step.code + '"][data-lines="' + Step.note + '"]')
      activateNote(Note)
    }

    function playAnim() {
      var Frame = Anim.querySelector('iframe')
      if (Frame && Frame.contentWindow) {
        Frame.contentWindow.postMessage({ type: 'play' }, '*')
        return
      }
      if (Anim.hidden) return
      Anim.classList.remove('play')
      void Anim.offsetWidth
      Anim.classList.add('play')
    }

    function animFrameHtml(AnimData) {
      var Kind = AnimData.kind || 'slice'
      var Label = Kind === 'slice' ? '切片'
        : Kind === 'vectors' ? '向量化'
          : Kind === 'commit' ? '事务写入'
            : Kind === 'failure' ? '失败清理'
              : Kind === 'reject' ? '幂等拒绝' : '数据流'
      var Reason = AnimData.reason || ''
      var Stage = Kind !== 'failure' ? ''
        : Reason === 'fetch_error' ? 'fetch'
          : Reason === '内容为空' ? 'parse'
            : Reason === 'cancelled' ? 'cancel' : 'embed'
      var Src = filmUrl('clip', Kind, currentTheme(), true) + (Stage ? '&stage=' + encodeURIComponent(Stage) : '')
      return '<iframe class="flow-anim-frame" data-film-clip="' + esc(Kind) + '" data-film-stage="' + esc(Stage) + '" data-film-theme="' + esc(currentTheme()) + '" src="' + esc(Src) + '" title="' + esc(Label) + ' 动画" loading="eager"></iframe>'
    }

    function render() {
      var Flow = currentFlow()
      var Step = currentStep()
      Select.value = String(FlowIndex)
      Count.textContent = (Index + 1) + ' / ' + Flow.steps.length
      Title.textContent = Step.title
      Explain.textContent = Step.explain
      Result.innerHTML = resultHtml(Step.result)
      Result.classList.remove('flash')
      void Result.offsetWidth
      Result.classList.add('flash')
      Panel.classList.toggle('expanded', Boolean(Step.animation))
      if (Step.animation) {
        Anim.hidden = false
        Anim.classList.add('flow-anim-embed')
        Anim.innerHTML = animFrameHtml(Step.animation)
        var Replay = Anim.querySelector('.anim-replay')
        if (Replay) Replay.addEventListener('click', playAnim)
      } else {
        Anim.hidden = true
        Anim.innerHTML = ''
        Anim.classList.remove('play', 'flow-anim-embed')
      }
      Array.prototype.forEach.call(Rail.children, function (Node, StageIndex) {
        Node.classList.remove('active', 'done', 'failure')
        if (StageIndex < Step.stage) Node.classList.add('done')
        if (StageIndex === Step.stage) {
          Node.classList.add('active')
          if (Step.result && Step.result.kind === 'failure') Node.classList.add('failure')
        }
      })
      var Stages = document.querySelectorAll('#global-map .stage')
      Array.prototype.forEach.call(Stages, function (Node, StageIndex) {
        Node.classList.remove('active', 'done')
        if (StageIndex < Step.stage) Node.classList.add('done')
        if (StageIndex === Step.stage) Node.classList.add('active')
      })
      var FailureRail = document.querySelector('#global-map .pipeline-failure')
      if (FailureRail) FailureRail.classList.toggle('active', Boolean(Step.result && Step.result.kind === 'failure'))
      Prev.disabled = Index === 0
      Next.textContent = Index === Flow.steps.length - 1 ? '完成' : '下一步 →'
      highlightStep(Step)
    }

    function open(FlowIndexValue, Reset) {
      FlowIndex = FlowIndexValue
      if (Reset) Index = 0
      Panel.hidden = false
      Reopen.hidden = true
      renderRail()
      render()
    }

    function close() {
      Panel.hidden = true
      Reopen.hidden = false
    }

    Reopen.addEventListener('click', function () { open(FlowIndex, false) })
    Close.addEventListener('click', close)
    Select.addEventListener('change', function () {
      FlowIndex = Number(Select.value) || 0
      Index = 0
      renderRail()
      render()
    })
    Prev.addEventListener('click', function () {
      if (Index === 0) return
      Index -= 1
      render()
    })
    Next.addEventListener('click', function () {
      if (Index === currentFlow().steps.length - 1) {
        close()
        return
      }
      Index += 1
      render()
    })
    document.addEventListener('keydown', function (Event) {
      if (Panel.hidden) return
      var Tag = document.activeElement && document.activeElement.tagName
      if (Tag === 'INPUT' || Tag === 'TEXTAREA' || Tag === 'SELECT') return
      if (Event.key === 'ArrowRight') {
        Event.preventDefault()
        if (Index < currentFlow().steps.length - 1) { Index += 1; render() } else close()
      }
      if (Event.key === 'ArrowLeft') {
        Event.preventDefault()
        if (Index > 0) { Index -= 1; render() }
      }
      if (Event.key === 'Escape') close()
    })
  }


  function run() {
    document.querySelectorAll('pre.snippet').forEach(enhance)
    mountFilms()
    new MutationObserver(syncFilmAssets).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })
    initFlow()
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true })
  else run()
})();
