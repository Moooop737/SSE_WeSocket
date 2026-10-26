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
  if (!Id) return
  function url() {
    var Theme = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'
    return 'anim/story-film.html?story=' + Id + '&theme=' + Theme
  }
  var Style = document.createElement('style')
  Style.textContent = '.story-film-link{position:fixed;right:18px;bottom:18px;z-index:90;display:inline-flex;align-items:center;gap:7px;height:38px;padding:0 14px;border-radius:999px;background:#0070f7;color:#fff;font-family:var(--sans,system-ui,sans-serif);font-size:12px;font-weight:600;text-decoration:none;box-shadow:0 10px 26px rgba(0,45,128,.22)}.story-film-link:hover{background:#0060d6}.story-film-link::before{content:"▶";font-size:10px}.story-back-link{position:fixed;left:18px;bottom:18px;z-index:90;display:inline-flex;align-items:center;height:34px;padding:0 12px;border:1px solid var(--line,#d4d4d4);border-radius:999px;background:var(--bg,#fff);color:var(--ink-2,#333);font-family:var(--sans,system-ui,sans-serif);font-size:11px;font-weight:600;text-decoration:none;box-shadow:0 6px 18px rgba(0,0,0,.08)}.story-back-link:hover{border-color:var(--accent,#0070f7);color:var(--accent,#0070f7)}@media(max-width:620px){.story-film-link{right:12px;bottom:12px;height:34px;padding:0 12px;font-size:11px}.story-back-link{left:12px;bottom:12px;height:32px;font-size:10px}}'
  document.head.appendChild(Style)
  if (!document.querySelector('.docs-topbar')) {
    var Back = document.createElement('a')
    Back.className = 'story-back-link'
    Back.href = 'index.html'
    Back.textContent = '← 返回目录'
    Back.setAttribute('aria-label', '返回到走读目录')
    document.body.appendChild(Back)
  }
  var Link = document.createElement('a')
  Link.className = 'story-film-link'
  Link.href = url()
  Link.textContent = '看完整动画'
  Link.setAttribute('aria-label', '打开本 story 的完整动画')
  Link.addEventListener('click', function () { Link.href = url() })
  document.body.appendChild(Link)
})();
