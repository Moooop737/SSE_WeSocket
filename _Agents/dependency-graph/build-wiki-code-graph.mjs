/**
 * Builds big-graph.html on top of the existing repo code graph:
 *   top    = Wiki pages (hand-authored from this repo's design)
 *   bottom = real directory graph from data/module-graph.json (23 nodes / 62 edges)
 *   cross  = refs resolved by symbol name -> file -> directory, computed per query
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const moduleGraph = JSON.parse(fs.readFileSync(path.join(HERE, 'data/module-graph.json'), 'utf8'))
const symbolGraph = JSON.parse(fs.readFileSync(path.join(HERE, 'data/symbol-graph.json'), 'utf8'))

const fileToGroup = new Map(moduleGraph.nodes.map((n) => [n.file, n.group]))
const symbolByName = new Map()
for (const n of symbolGraph.nodes) {
  if (!symbolByName.has(n.name)) symbolByName.set(n.name, [])
  symbolByName.get(n.name).push(n)
}

const codeNodes = moduleGraph.dirNodes.map((n) => ({
  id: n.id,
  name: n.label,
  label: n.label,
  kind: 'dir',
  group: n.id,
  files: n.files,
  lines: n.lines,
  degree: n.degree,
  x: n.x,
  y: n.y + 300,
  r: n.r,
}))
const codeById = new Map(codeNodes.map((n) => [n.id, n]))
const codeEdges = moduleGraph.dirEdges.map((e) => ({
  source: e.source,
  target: e.target,
  kind: (e.kinds || []).includes('runtime') ? 'runtime' : 'type',
  count: e.count,
}))

const groups = moduleGraph.groups.map((g) => ({ id: g.id, label: g.label, color: g.color, files: g.files }))

const EXTERNAL = new Set(['Langfuse', 'Ollama', 'DeepSeek', 'ParadeDB', 'PostgreSQL', 'Redis'])

const wikiSpec = [
  { id: 'summary/chat-request', title: '聊天请求链路', type: 'summary', summary: '从 POST /chat 进入，ChatRoute 装配 ChatService，模型通过 retrieve 工具检索知识库并流式返回。', links: ['entity/chatservice', 'entity/retriever-factory', 'concept/rrf', 'concept/retrieve-tool', 'summary/observability'], refs: ['ChatRoute', 'ChatService', 'buildAgentTools', 'buildRetrieveTool', 'RetrieverFactory', 'Langfuse'] },
  { id: 'summary/retrieval', title: '检索与融合', type: 'summary', summary: 'BM25 与向量两路召回，经 RRF 融合后交给模型；RetrieverFactory 负责组装。', links: ['entity/retriever-factory', 'concept/rrf', 'summary/chat-request'], refs: ['RetrieverFactory', 'ParadeDbBm25Search', 'ParadeDbVectorSearch', 'RrfFuser'] },
  { id: 'summary/ingest', title: '入库流水线', type: 'summary', summary: 'URL 或文本进入 IngestFactory，经过 fetch、parse、chunk、embed、write 五个阶段。', links: ['entity/ingest-factory', 'summary/chat-request'], refs: ['IngestFactory', 'HttpFetcher', 'HtmlParser', 'LegacyChunker'] },
  { id: 'summary/observability', title: '观测与 Trace', type: 'summary', summary: 'endpoint 中间件、stage runner 和 Langfuse span processor 记录每次请求。', links: ['entity/chatspanprocessor', 'entity/langfuse', 'summary/chat-request'], refs: ['createEndpointTrace', 'runStage', 'ChatSpanProcessor', 'Langfuse'] },
  { id: 'summary/multiturn', title: '多轮会话', type: 'summary', summary: '服务端按 session 读库历史，只回灌 text parts，最近 6 轮交给模型。', links: ['entity/chatservice', 'summary/chat-request'], refs: ['SessionsRoute', 'PostgresRepo', 'ChatService'] },
  { id: 'entity/chatservice', title: 'ChatService', type: 'entity', summary: '聊天编排类：装配模型、工具与会话历史。', links: ['summary/chat-request', 'concept/retrieve-tool', 'concept/streaming'], refs: ['ChatService'] },
  { id: 'entity/retriever-factory', title: 'RetrieverFactory', type: 'entity', summary: '混合检索器工厂：装配 BM25、向量与 RRF。', links: ['summary/retrieval', 'concept/rrf'], refs: ['RetrieverFactory'] },
  { id: 'entity/ingest-factory', title: 'IngestFactory', type: 'entity', summary: '入库流水线工厂：按 Recipe 组装 stages。', links: ['summary/ingest'], refs: ['IngestFactory'] },
  { id: 'entity/chatspanprocessor', title: 'ChatSpanProcessor', type: 'entity', summary: '把 chat 根 span 的 session 与 trace 信息写入 Langfuse。', links: ['summary/observability', 'entity/langfuse'], refs: ['ChatSpanProcessor'] },
  { id: 'entity/langfuse', title: 'Langfuse', type: 'entity', summary: '外部观测平台，保存 chat trace 与 session。', links: ['summary/observability'], refs: ['Langfuse'] },
  { id: 'concept/rrf', title: 'RRF 融合', type: 'concept', summary: '按名次融合 BM25 与向量两路结果，不做分数归一化。', links: ['summary/retrieval', 'entity/retriever-factory'], refs: ['RrfFuser'] },
  { id: 'concept/retrieve-tool', title: '检索工具化', type: 'concept', summary: '把 retrieve 包成工具交给模型调用，最多 4 次有界重查。', links: ['summary/chat-request', 'entity/chatservice', 'entity/retriever-factory'], refs: ['buildRetrieveTool', 'buildAgentTools'] },
  { id: 'concept/streaming', title: '流式输出', type: 'concept', summary: 'streamText 转 UI message stream，经 Hono 直通 SSE。', links: ['summary/chat-request', 'entity/chatservice'], refs: ['ChatService', 'ChatRoute'] },
]

const wikiTypeX = { summary: -520, entity: -220, concept: 80 }
const wikiByType = { summary: [], entity: [], concept: [] }
for (const p of wikiSpec) wikiByType[p.type].push(p)
const wiki = []
for (const [type, list] of Object.entries(wikiByType)) {
  list.forEach((p, i) => {
    wiki.push({
      ...p,
      x: wikiTypeX[type],
      y: -430 + (i - (list.length - 1) / 2) * 138,
      w: 240,
      h: 112,
      refs: p.refs.map((surface) => {
        if (EXTERNAL.has(surface)) return { surface, status: 'external', codeId: null, evidence: '外部依赖，代码图里没有' }
        const hits = symbolByName.get(surface) ?? []
        if (hits.length === 0) return { surface, status: 'unresolved', codeId: null, evidence: '代码索引里没有这个名字' }
        const group = fileToGroup.get(hits[0].file)
        const dir = group && codeById.get(group)
        if (dir) return { surface, status: 'resolved', codeId: dir.id, evidence: `${hits[0].file} → ${dir.id}` }
        return { surface, status: 'unresolved', codeId: null, evidence: '符号存在，但没有对应目录节点' }
      }),
    })
  })
}
const wikiById = new Map(wiki.map((p) => [p.id, p]))
const wikiEdges = []
for (const p of wiki) for (const t of p.links) if (wikiById.has(t)) wikiEdges.push({ source: p.id, target: t })

const fileListByGroup = new Map()
for (const n of moduleGraph.nodes) {
  if (!fileListByGroup.has(n.group)) fileListByGroup.set(n.group, [])
  fileListByGroup.get(n.group).push({ file: n.file, lines: n.lines, generated: n.generated })
}

const data = {
  generatedAt: new Date().toISOString(),
  wiki,
  wikiEdges,
  code: codeNodes,
  codeEdges,
  groups,
  filesByGroup: Object.fromEntries(fileListByGroup),
  bounds: { minX: -660, maxX: 1560, minY: -760, maxY: 1010 },
  stats: {
    wikiPages: wiki.length,
    wikiLinks: wikiEdges.length,
    codeNodes: codeNodes.length,
    codeEdges: codeEdges.length,
    resolved: wiki.reduce((a, p) => a + p.refs.filter((r) => r.status === 'resolved').length, 0),
    external: wiki.reduce((a, p) => a + p.refs.filter((r) => r.status === 'external').length, 0),
    unresolved: wiki.reduce((a, p) => a + p.refs.filter((r) => r.status === 'unresolved').length, 0),
  },
}

fs.writeFileSync(path.join(HERE, 'data/big-graph.json'), JSON.stringify(data, null, 1))

const templatePath = path.join(HERE, 'big-graph-template.html')
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8')
  const payload = JSON.stringify(data).replace(/</g, '\\u003c')
  fs.writeFileSync(path.join(HERE, 'big-graph.html'), template.replace('/*__BIG_DATA__*/null', payload))
}

console.log(JSON.stringify(data.stats, null, 2))
