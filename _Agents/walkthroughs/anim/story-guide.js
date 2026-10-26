(function () {
  var Map = {
    'epic1-story1-local-skeleton.html': '1.1',
    'epic1-story3-text-ingest.html': '1.3',
    'epic1-story4-resource-delete.html': '1.4',
    'epic2-story1-hybrid-retrieval.html': '2.1',
    'epic2-story2-streaming.html': '2.2',
    'epic2-story3-citations.html': '2.3',
    'epic2-story4-source-ref.html': '2.4',
    'epic2-story5-multiturn.html': '2.5',
    'epic2-story6-retrieve-tool.html': '2.6',
    'epic3-story1-endpoint-trace.html': '3.1',
    'epic3-story2-chat-langfuse.html': '3.2',
    'epic3-story3-retrieve-stages.html': '3.3',
    'epic3-story4-ingest-stages.html': '3.4'
  }
  var Id = Map[location.pathname.split('/').pop()]
  var Story = Id && window.STORY_FILMS ? window.STORY_FILMS[Id] : null
  if (!Id || !Story) return

  function esc(Value) {
    return String(Value == null ? '' : Value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  }

  function theme() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
  }

  function filmSrc() {
    return 'anim/story-film.html?story=' + encodeURIComponent(Id) + '&theme=' + theme() + '&embed=1&v=20261026s'
  }

  var Section = document.createElement('section')
  Section.className = 'section story-guide'
  Section.id = 'story-guide'
  Section.innerHTML = '<header class="section-head"><span class="kicker">GUIDED ANIMATION</span><h2>跟着这条链路走一遍</h2><p class="section-sub">点一步，播放这个动作；下方字幕同步说明发生了什么。</p></header><div class="story-guide-layout"><div><iframe class="story-guide-frame" title="链路动画导览" loading="eager"></iframe><div class="story-guide-caption" aria-live="polite"></div></div><div class="story-guide-side"><div class="story-guide-meta"><span id="story-guide-count">1 / ' + Story.cues.length + '</span><a href="anim/story-film.html?story=' + encodeURIComponent(Id) + '&theme=' + theme() + '" target="_blank" rel="noreferrer">打开完整动画 →</a></div><div class="story-guide-steps" id="story-guide-steps"></div><div class="story-guide-actions"><button type="button" id="story-guide-prev">‹ 上一动作</button><button type="button" id="story-guide-replay">重播</button><button type="button" id="story-guide-next" class="primary">下一动作 ›</button><button type="button" id="story-guide-auto">自动播放</button></div></div></div>'

  var Frame = Section.querySelector('.story-guide-frame')
  var Caption = Section.querySelector('.story-guide-caption')
  var Count = Section.querySelector('#story-guide-count')
  var Steps = Section.querySelector('#story-guide-steps')
  var Prev = Section.querySelector('#story-guide-prev')
  var Next = Section.querySelector('#story-guide-next')
  var Replay = Section.querySelector('#story-guide-replay')
  var Auto = Section.querySelector('#story-guide-auto')
  var Current = 0
  var Buttons = []

  Story.cues.forEach(function (Cue, Index) {
    var Button = document.createElement('button')
    Button.type = 'button'
    Button.className = 'story-guide-step'
    Button.innerHTML = '<b>' + (Index + 1) + '</b><span>' + esc(Cue.label) + '</span>'
    Button.addEventListener('click', function () { select(Index) })
    Steps.appendChild(Button)
    Buttons.push(Button)
  })

  function select(Index, Scroll) {
    Current = Math.max(0, Math.min(Story.cues.length - 1, Index))
    Buttons.forEach(function (Button, Position) { Button.classList.toggle('active', Position === Current) })
    Count.textContent = (Current + 1) + ' / ' + Story.cues.length
    Caption.textContent = Story.cues[Current].caption || Story.cues[Current].label
    Prev.disabled = Current === 0
    Next.disabled = Current === Story.cues.length - 1
    if (Frame.contentWindow) Frame.contentWindow.postMessage({ type: 'cue', index: Current }, '*')
    if (Scroll !== false && Buttons[Current]) Buttons[Current].scrollIntoView({ block: 'nearest' })
  }

  Frame.src = filmSrc()
  Frame.addEventListener('load', function () { select(Current, false) })
  Prev.addEventListener('click', function () { select(Current - 1) })
  Next.addEventListener('click', function () { select(Current + 1) })
  Replay.addEventListener('click', function () { select(Current, false) })
  Auto.addEventListener('click', function () {
    if (Frame.contentWindow) Frame.contentWindow.postMessage({ type: 'auto' }, '*')
  })
  window.addEventListener('message', function (Event) {
    if (!Event.data || Event.data.type !== 'cuechange') return
    var Index = Number(Event.data.index)
    if (!Number.isFinite(Index)) return
    Buttons.forEach(function (Button, Position) { Button.classList.toggle('active', Position === Index) })
    Count.textContent = (Index + 1) + ' / ' + Story.cues.length
    Caption.textContent = Story.cues[Index] ? (Story.cues[Index].caption || Story.cues[Index].label) : ''
    Prev.disabled = Index === 0
    Next.disabled = Index === Story.cues.length - 1
    if (Buttons[Index]) Buttons[Index].scrollIntoView({ block: 'nearest' })
  })
  new MutationObserver(function () {
    Frame.src = filmSrc()
    Frame.addEventListener('load', function () { select(Current, false) }, { once: true })
  }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] })

  var Hero = document.querySelector('main .hero') || document.querySelector('.hero')
  var Main = document.querySelector('main') || document.body
  if (Hero) Hero.insertAdjacentElement('afterend', Section)
  else Main.prepend(Section)

  var Toc = document.getElementById('toc')
  if (Toc) {
    var Link = document.createElement('a')
    Link.href = '#story-guide'
    Link.setAttribute('data-toc', 'story-guide')
    Link.textContent = '链路动画导览'
    Toc.insertBefore(Link, Toc.children[1] || null)
  }
})();
