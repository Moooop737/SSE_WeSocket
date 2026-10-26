/**
 * Repository code graph generator.
 * Reads app/server/src and app/web/src with the TypeScript compiler API and emits:
 *   data/module-graph.json   file/folder/module nodes and import edges
 *   data/symbol-graph.json   class/interface/type/function/method/enum/route nodes and semantic edges
 *   overview.md              module Mermaid diagram, cycles, hubs, external packages
 *   index.html               self-contained viewer (template.html + injected data)
 *
 * Run: node _Agents/dependency-graph/analyze.mjs
 * TypeScript is borrowed from app/web/node_modules (5.9.x, stable compiler API).
 * Positions are computed in the browser; data keeps topology only. dirNodes/dirEdges/groups are
 * legacy fields kept for the deprecated big-graph artifact.
 */
import { createRequire } from 'node:module'
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(HERE, '../..')
const requireFromWeb = createRequire(path.join(ROOT, 'app/web/package.json'))
const ts = requireFromWeb('typescript')

const SOURCE_ROOTS = [
  { zone: 'server', dir: path.join(ROOT, 'app/server/src') },
  { zone: 'web', dir: path.join(ROOT, 'app/web/src') },
]
const EXCLUDE_FILE = [/\.test\.tsx?$/, /test-setup\.ts$/, /legacy\.fixtures\.ts$/]
const LAYER_COLOR = {
  presentation: '#38bdf8',
  interface: '#fb923c',
  application: '#a78bfa',
  infrastructure: '#94a3b8',
}
const GROUP_META = {
  'server/core': { label: 'core', color: '#94a3b8', zone: 'server' },
  'server/adapter': { label: 'adapter', color: '#d97706', zone: 'server' },
  'server/adapter/connection': { label: 'adapter/connection', color: '#f59e0b', zone: 'server' },
  'server/adapter/model': { label: 'adapter/model', color: '#fbbf24', zone: 'server' },
  'server/adapter/provider': { label: 'adapter/provider', color: '#f97316', zone: 'server' },
  'server/adapter/repo': { label: 'adapter/repo', color: '#ea580c', zone: 'server' },
  'server/agent': { label: 'agent', color: '#a855f7', zone: 'server' },
  'server/ingest': { label: 'ingest', color: '#22c55e', zone: 'server' },
  'server/ingest/fetch': { label: 'ingest/fetch', color: '#4ade80', zone: 'server' },
  'server/ingest/parse': { label: 'ingest/parse', color: '#16a34a', zone: 'server' },
  'server/ingest/chunk': { label: 'ingest/chunk', color: '#15803d', zone: 'server' },
  'server/retrieve': { label: 'retrieve', color: '#3b82f6', zone: 'server' },
  'server/retrieve/search': { label: 'retrieve/search', color: '#60a5fa', zone: 'server' },
  'server/retrieve/fusion': { label: 'retrieve/fusion', color: '#2563eb', zone: 'server' },
  'server/routes': { label: 'routes', color: '#ef4444', zone: 'server' },
  'server/trace/llmtrace': { label: 'trace/llmtrace', color: '#64748b', zone: 'server' },
  'server/trace/systemtrace': { label: 'trace/systemtrace', color: '#475569', zone: 'server' },
  'web/components': { label: 'components', color: '#14b8a6', zone: 'web' },
  'web/api': { label: 'api', color: '#0ea5e9', zone: 'web' },
  'web/hooks': { label: 'hooks', color: '#eab308', zone: 'web' },
  'web/lib': { label: 'lib', color: '#8b5cf6', zone: 'web' },
  'web/routes': { label: 'routes', color: '#f43f5e', zone: 'web' },
  'web/types': { label: 'types', color: '#64748b', zone: 'web' },
  'web/core': { label: 'core', color: '#94a3b8', zone: 'web' },
}

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) out.push(full)
  }
  return out
}

const rel = (abs) => path.relative(ROOT, abs).split(path.sep).join('/')

const absoluteFiles = SOURCE_ROOTS.flatMap((r) => walk(r.dir))
  .filter((f) => !EXCLUDE_FILE.some((re) => re.test(f)))
  .sort()
const fileSet = new Set(absoluteFiles)

function groupOf(relPath) {
  const rest = relPath.replace(/^app\/(server|web)\/src\//, '')
  const zone = relPath.startsWith('app/server') ? 'server' : 'web'
  if (zone === 'server') {
    if (rest.startsWith('adapter/connection/')) return 'server/adapter/connection'
    if (rest.startsWith('adapter/model/')) return 'server/adapter/model'
    if (rest.startsWith('adapter/provider/')) return 'server/adapter/provider'
    if (rest.startsWith('adapter/repo/')) return 'server/adapter/repo'
    if (rest.startsWith('adapter/')) return 'server/adapter'
    if (rest.startsWith('agent/')) return 'server/agent'
    if (rest.startsWith('ingest/fetch/')) return 'server/ingest/fetch'
    if (rest.startsWith('ingest/parse/')) return 'server/ingest/parse'
    if (rest.startsWith('ingest/chunk/')) return 'server/ingest/chunk'
    if (rest.startsWith('ingest/')) return 'server/ingest'
    if (rest.startsWith('retrieve/search/')) return 'server/retrieve/search'
    if (rest.startsWith('retrieve/fusion/')) return 'server/retrieve/fusion'
    if (rest.startsWith('retrieve/')) return 'server/retrieve'
    if (rest.startsWith('routes/')) return 'server/routes'
    if (rest.startsWith('trace/llmtrace/')) return 'server/trace/llmtrace'
    if (rest.startsWith('trace/systemtrace/')) return 'server/trace/systemtrace'
    return 'server/core'
  }
  if (rest.startsWith('api/')) return 'web/api'
  if (rest.startsWith('hooks/')) return 'web/hooks'
  if (rest.startsWith('lib/')) return 'web/lib'
  if (rest.startsWith('routes/')) return 'web/routes'
  if (rest.startsWith('types/')) return 'web/types'
  if (rest.startsWith('components/')) return 'web/components'
  return 'web/core'
}

const moduleMap = JSON.parse(fs.readFileSync(path.join(HERE, 'module-map.json'), 'utf8'))
const MODULE_DEFS = moduleMap.modules
const MODULE_BY_ID = new Map(MODULE_DEFS.map((d) => [d.module_id, d]))

function moduleDefFor(relPath) {
  let best = null
  let bestLen = -1
  for (const def of MODULE_DEFS) {
    for (const p of def.paths) {
      const exact = /\.(ts|tsx)$/.test(p)
      const hit = exact ? relPath === p : relPath === p || relPath.startsWith(`${p}/`)
      if (hit && p.length > bestLen) {
        best = def
        bestLen = p.length
      }
    }
  }
  return best
}

const compilerOptions = {
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.Preserve,
  experimentalDecorators: true,
  skipLibCheck: true,
  noEmit: true,
  types: [],
  lib: ['lib.es2022.d.ts', 'lib.dom.d.ts'],
}
const program = ts.createProgram(absoluteFiles, compilerOptions)
const checker = program.getTypeChecker()
const sourceFiles = program.getSourceFiles().filter((sf) => !sf.isDeclarationFile && fileSet.has(sf.fileName))
const sourceFileByRel = new Map(sourceFiles.map((sf) => [rel(sf.fileName), sf]))

const lineOf = (node) => node.getSourceFile().getLineAndCharacterOfPosition(node.getStart()).line + 1
const lineCount = (sf) => sf.getLineAndCharacterOfPosition(sf.end).line + 1

function resolveRelative(fromAbs, spec) {
  const base = path.resolve(path.dirname(fromAbs), spec)
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, 'index.ts'),
    path.join(base, 'index.tsx'),
    base.replace(/\.js$/, '.ts'),
    base.replace(/\.js$/, '.tsx'),
  ]
  return candidates.find((c) => fileSet.has(c)) ?? null
}

function packageOf(spec) {
  if (spec.startsWith('.') || spec.startsWith('/')) return null
  const parts = spec.split('/')
  return spec.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0]
}

function propName(prop) {
  if (!prop.name) return null
  if (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) return prop.name.text
  return null
}

// ---------- file graph ----------

const fileModule = new Map()
const unmappedFiles = []
for (const sf of sourceFiles) {
  const relPath = rel(sf.fileName)
  const def = moduleDefFor(relPath)
  if (def) fileModule.set(relPath, def)
  else unmappedFiles.push(relPath)
}
if (unmappedFiles.length) {
  throw new Error(`module-map.json does not cover ${unmappedFiles.length} file(s): ${unmappedFiles.slice(0, 8).join(', ')}`)
}

const fileNodes = sourceFiles.map((sf) => {
  const relPath = rel(sf.fileName)
  const def = fileModule.get(relPath)
  return {
    id: relPath,
    kind: 'file',
    label: path.basename(relPath).replace(/\.(tsx?|d\.ts)$/, ''),
    file: relPath,
    module_id: def.module_id,
    group: groupOf(relPath),
    zone: relPath.startsWith('app/server') ? 'server' : 'web',
    lines: lineCount(sf),
    generated: /\.gen\.ts$/.test(relPath),
  }
})
const fileById = new Map(fileNodes.map((n) => [n.id, n]))

const fileEdgeMap = new Map()
const externalMap = new Map()
const unresolvedSpecs = []

function addFileEdge(fromAbs, spec, symbols, typeOnly) {
  if (spec.startsWith('.')) {
    if (!/\.(tsx?|jsx?|mjs|cjs)$/.test(spec) && /\.[a-z0-9]+$/i.test(spec)) return
    const targetAbs = resolveRelative(fromAbs, spec)
    if (!targetAbs) {
      unresolvedSpecs.push({ from: rel(fromAbs), spec })
      return
    }
    const from = rel(fromAbs)
    const to = rel(targetAbs)
    if (from === to) return
    const key = `${from}->${to}`
    const existing = fileEdgeMap.get(key) ?? { source: from, target: to, symbols: new Set(), typeOnly: true, count: 0 }
    existing.count += 1
    for (const s of symbols) existing.symbols.add(s)
    existing.typeOnly = existing.typeOnly && typeOnly
    fileEdgeMap.set(key, existing)
    return
  }
  const pkg = packageOf(spec)
  if (!pkg) return
  const entry = externalMap.get(pkg) ?? { name: pkg, count: 0, files: new Set() }
  entry.count += 1
  entry.files.add(rel(fromAbs))
  externalMap.set(pkg, entry)
}

function bindingsOfImport(node) {
  const out = []
  const clause = node.importClause
  if (!clause) return { symbols: ['<side-effect>'], typeOnly: false }
  let typeOnly = !!clause.isTypeOnly
  if (clause.name) {
    out.push(clause.name.text)
    if (!clause.isTypeOnly) typeOnly = false
  }
  const named = clause.namedBindings
  if (named && ts.isNamespaceImport(named)) {
    out.push(`* as ${named.name.text}`)
    if (!clause.isTypeOnly) typeOnly = false
  } else if (named) {
    for (const el of named.elements) out.push(el.name.text)
    if (!clause.isTypeOnly && named.elements.some((el) => !el.isTypeOnly)) typeOnly = false
    if (named.elements.length === 0) typeOnly = !!clause.isTypeOnly
  }
  return { symbols: out, typeOnly }
}

for (const sf of sourceFiles) {
  for (const st of sf.statements) {
    if (ts.isImportDeclaration(st) && ts.isStringLiteral(st.moduleSpecifier)) {
      const { symbols, typeOnly } = bindingsOfImport(st)
      addFileEdge(sf.fileName, st.moduleSpecifier.text, symbols, typeOnly)
    } else if (ts.isExportDeclaration(st) && st.moduleSpecifier && ts.isStringLiteral(st.moduleSpecifier)) {
      const symbols = st.exportClause && ts.isNamedExports(st.exportClause)
        ? st.exportClause.elements.map((el) => el.name.text)
        : ['*']
      addFileEdge(sf.fileName, st.moduleSpecifier.text, symbols, !!st.isTypeOnly)
    }
  }
  const visitDynamic = (n) => {
    if (ts.isCallExpression(n) && n.expression.kind === ts.SyntaxKind.ImportKeyword && n.arguments[0] && ts.isStringLiteral(n.arguments[0])) {
      addFileEdge(sf.fileName, n.arguments[0].text, ['<dynamic>'], false)
    }
    ts.forEachChild(n, visitDynamic)
  }
  visitDynamic(sf)
}

const fileEdges = [...fileEdgeMap.values()]
  .map((e) => ({ ...e, symbols: [...e.symbols].sort(), kind: e.typeOnly ? 'type' : 'runtime' }))
  .sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))

const externalPackages = [...externalMap.values()]
  .map((e) => ({ name: e.name, count: e.count, files: e.files.size, fileList: [...e.files].sort() }))
  .sort((a, b) => b.files - a.files || b.count - a.count)

// ---------- folders ----------

const folderByPath = new Map()
function ensureFolder(dir) {
  if (folderByPath.has(dir)) return folderByPath.get(dir)
  const zone = dir.startsWith('app/server') ? 'server' : 'web'
  const root = zone === 'server' ? 'app/server/src' : 'app/web/src'
  const node = {
    id: `folder:${dir}`,
    kind: 'folder',
    path: dir,
    name: path.basename(dir),
    zone,
    depth: dir === root ? 0 : dir.slice(root.length + 1).split('/').length,
    file_count: 0,
    total_files: 0,
    module_id: null,
  }
  folderByPath.set(dir, node)
  return node
}
for (const file of fileNodes) {
  const root = file.zone === 'server' ? 'app/server/src' : 'app/web/src'
  let dir = path.posix.dirname(file.file)
  while (dir.startsWith(root)) {
    ensureFolder(dir)
    if (dir === root) break
    dir = path.posix.dirname(dir)
  }
  const parent = ensureFolder(path.posix.dirname(file.file))
  parent.file_count += 1
}
for (const file of fileNodes) {
  const root = file.zone === 'server' ? 'app/server/src' : 'app/web/src'
  let dir = path.posix.dirname(file.file)
  while (dir.startsWith(root)) {
    ensureFolder(dir).total_files += 1
    if (dir === root) break
    dir = path.posix.dirname(dir)
  }
}
for (const folder of folderByPath.values()) {
  const modules = new Set()
  for (const file of fileNodes) if (file.file.startsWith(`${folder.path}/`)) modules.add(file.module_id)
  folder.module_id = modules.size === 1 ? [...modules][0] : null
}
const folderNodes = [...folderByPath.values()].sort((a, b) => a.path.localeCompare(b.path))

// ---------- modules ----------

const moduleNodes = MODULE_DEFS.map((def) => {
  const files = fileNodes.filter((f) => f.module_id === def.module_id)
  return {
    id: `module:${def.module_id}`,
    kind: 'module',
    module_id: def.module_id,
    name: def.label,
    label: def.label,
    layer: def.layer,
    layer_color: LAYER_COLOR[def.layer] ?? '#94a3b8',
    paths: def.paths,
    zone: def.module_id === 'web' ? 'web' : 'server',
    file_count: files.length,
    lines: files.reduce((a, f) => a + f.lines, 0),
    entry_files: [],
  }
})
const moduleById = new Map(moduleNodes.map((n) => [n.id, n]))
const moduleNodeByModuleId = new Map(moduleNodes.map((n) => [n.module_id, n]))

const moduleEdgeMap = new Map()
for (const e of fileEdges) {
  const a = fileById.get(e.source)?.module_id
  const b = fileById.get(e.target)?.module_id
  if (!a || !b || a === b) continue
  const key = `${a}->${b}`
  const cur = moduleEdgeMap.get(key) ?? {
    id: `module-import:${a}->${b}`,
    source: `module:${a}`,
    target: `module:${b}`,
    kind: 'import',
    count: 0,
    file_count: 0,
    type_only_count: 0,
    source_layer: MODULE_BY_ID.get(a)?.layer ?? null,
    target_layer: MODULE_BY_ID.get(b)?.layer ?? null,
    layers: [MODULE_BY_ID.get(a)?.layer ?? null, MODULE_BY_ID.get(b)?.layer ?? null],
    source_module: a,
    target_module: b,
  }
  cur.count += e.count
  cur.file_count += 1
  if (e.kind === 'type') cur.type_only_count += e.count
  moduleEdgeMap.set(key, cur)
}
const moduleEdges = [...moduleEdgeMap.values()].sort(
  (a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target),
)

const externalNodes = [
  { id: 'external:ollama', kind: 'external', name: 'Ollama', label: 'Ollama', service: 'embedding', pending: true },
  { id: 'external:deepseek', kind: 'external', name: 'DeepSeek', label: 'DeepSeek', service: 'chat', pending: true },
  { id: 'external:langfuse', kind: 'external', name: 'Langfuse', label: 'Langfuse', service: 'observability', pending: true },
  { id: 'external:paradedb', kind: 'external', name: 'ParadeDB', label: 'ParadeDB', service: 'vector+bm25', pending: true },
  { id: 'external:postgresql', kind: 'external', name: 'PostgreSQL', label: 'PostgreSQL', service: 'storage', pending: true },
  { id: 'external:redis', kind: 'external', name: 'Redis', label: 'Redis', service: 'cache', pending: true },
]

// ---------- symbols ----------

const symbolNodes = []
const symbolById = new Map()
const symbolDecls = new Map()
const declToNode = new Map()
const methodByDecl = new Map()

function addSymbol(node, decl) {
  let existing = symbolById.get(node.id)
  if (existing) {
    if (existing.kind === node.kind) {
      symbolDecls.get(existing.id).push(decl)
      existing.declaration_count = (existing.declaration_count ?? 1) + 1
      return existing
    }
    node.id = `${node.id}@${node.line}`
    node.id_collision = true
    existing = null
  }
  symbolById.set(node.id, node)
  symbolNodes.push(node)
  symbolDecls.set(node.id, [decl])
  return node
}

function registerPlainSymbol(node) {
  if (symbolById.has(node.id)) return symbolById.get(node.id)
  symbolById.set(node.id, node)
  symbolNodes.push(node)
  symbolDecls.set(node.id, [])
  return node
}

function signatureOf(node) {
  const text = node.getText().replace(/\s+/g, ' ').trim()
  const brace = text.indexOf('{')
  let sig = brace >= 0 ? text.slice(0, brace).trim() : text
  if (sig.length > 180) sig = `${sig.slice(0, 177)}...`
  return sig
}

function typeShapeOf(node) {
  if (!node) return 'other'
  if (ts.isParenthesizedTypeNode(node)) return typeShapeOf(node.type)
  if (ts.isTypeLiteralNode(node)) return 'object'
  if (ts.isUnionTypeNode(node)) return 'union'
  if (ts.isTupleTypeNode(node)) return 'tuple'
  if (ts.isConditionalTypeNode(node)) return 'conditional'
  if (ts.isMappedTypeNode(node)) return 'mapped'
  const primitiveKinds = new Set([
    ts.SyntaxKind.StringKeyword,
    ts.SyntaxKind.NumberKeyword,
    ts.SyntaxKind.BooleanKeyword,
    ts.SyntaxKind.BigIntKeyword,
    ts.SyntaxKind.SymbolKeyword,
    ts.SyntaxKind.NullKeyword,
    ts.SyntaxKind.UndefinedKeyword,
    ts.SyntaxKind.VoidKeyword,
    ts.SyntaxKind.AnyKeyword,
    ts.SyntaxKind.UnknownKeyword,
    ts.SyntaxKind.NeverKeyword,
  ])
  if (primitiveKinds.has(node.kind) || ts.isLiteralTypeNode(node)) return 'primitive'
  return 'other'
}

function methodNameOf(member) {
  if (ts.isConstructorDeclaration(member)) return 'constructor'
  if (!member.name) return null
  if (ts.isIdentifier(member.name) || ts.isPrivateIdentifier(member.name) || ts.isStringLiteral(member.name)) return member.name.text
  return null
}

function collectFileSymbols(sf) {
  const relPath = rel(sf.fileName)
  const moduleId = fileModule.get(relPath).module_id
  const group = groupOf(relPath)
  const base = { file: relPath, module_id: moduleId, group, exported: false }

  for (const st of sf.statements) {
    if (ts.isFunctionDeclaration(st) && st.name) {
      const node = addSymbol({
        ...base,
        id: `${relPath}#${st.name.text}`,
        name: st.name.text,
        qualified_name: st.name.text,
        kind: 'function',
        line: lineOf(st),
        signature: signatureOf(st),
      }, st)
      declToNode.set(st, node)
    } else if (ts.isClassDeclaration(st) && st.name) {
      const name = st.name.text
      const cls = addSymbol({
        ...base,
        id: `${relPath}#${name}`,
        name,
        qualified_name: name,
        kind: 'class',
        line: lineOf(st),
        collapsed: false,
        methods: [],
        method_count: 0,
      }, st)
      declToNode.set(st, cls)
      for (const member of st.members) {
        let mName = null
        let methodKind = 'method'
        if (ts.isConstructorDeclaration(member)) {
          mName = 'constructor'
          methodKind = 'constructor'
        } else if (ts.isMethodDeclaration(member)) {
          mName = methodNameOf(member)
        } else if (ts.isGetAccessorDeclaration(member)) {
          mName = methodNameOf(member)
          if (mName) mName = `get ${mName}`
          methodKind = 'getter'
        } else if (ts.isSetAccessorDeclaration(member)) {
          mName = methodNameOf(member)
          if (mName) mName = `set ${mName}`
          methodKind = 'setter'
        } else if (
          ts.isPropertyDeclaration(member) &&
          member.name &&
          (ts.isIdentifier(member.name) || ts.isPrivateIdentifier(member.name)) &&
          member.initializer &&
          (ts.isArrowFunction(member.initializer) || ts.isFunctionExpression(member.initializer))
        ) {
          mName = member.name.text
          methodKind = 'property'
        }
        if (!mName) continue
        const method = addSymbol({
          ...base,
          id: `${relPath}#${name}.${mName}`,
          name: mName,
          qualified_name: `${name}.${mName}`,
          kind: 'method',
          class_id: cls.id,
          class_name: name,
          method_kind: methodKind,
          line: lineOf(member),
          collapsed: true,
          signature: signatureOf(member),
        }, member)
        methodByDecl.set(member, method)
        if (!cls.methods.some((m) => m.id === method.id)) {
          cls.methods.push({ id: method.id, name: mName, line: method.line })
          cls.method_count = cls.methods.length
        }
      }
    } else if (ts.isInterfaceDeclaration(st) && st.name) {
      const node = addSymbol({
        ...base,
        id: `${relPath}#${st.name.text}`,
        name: st.name.text,
        qualified_name: st.name.text,
        kind: 'interface',
        declaration_kind: 'interface',
        line: lineOf(st),
      }, st)
      declToNode.set(st, node)
    } else if (ts.isTypeAliasDeclaration(st) && st.name) {
      const node = addSymbol({
        ...base,
        id: `${relPath}#${st.name.text}`,
        name: st.name.text,
        qualified_name: st.name.text,
        kind: 'type',
        declaration_kind: 'type',
        type_shape: typeShapeOf(st.type),
        line: lineOf(st),
      }, st)
      declToNode.set(st, node)
    } else if (ts.isEnumDeclaration(st) && st.name) {
      const node = addSymbol({
        ...base,
        id: `${relPath}#${st.name.text}`,
        name: st.name.text,
        qualified_name: st.name.text,
        kind: 'enum',
        line: lineOf(st),
      }, st)
      declToNode.set(st, node)
    } else if (ts.isVariableStatement(st)) {
      for (const d of st.declarationList.declarations) {
        if (!ts.isIdentifier(d.name)) continue
        const init = d.initializer
        if (!init || !(ts.isArrowFunction(init) || ts.isFunctionExpression(init))) continue
        const node = addSymbol({
          ...base,
          id: `${relPath}#${d.name.text}`,
          name: d.name.text,
          qualified_name: d.name.text,
          kind: 'function',
          line: lineOf(d),
          signature: signatureOf(d),
        }, d)
        declToNode.set(d, node)
      }
    }
  }
}

for (const sf of sourceFiles) collectFileSymbols(sf)

const moduleSymbolByFile = new Map()
const exportCountByFile = new Map()
for (const sf of sourceFiles) {
  const sym = checker.getSymbolAtLocation(sf) ?? sf.symbol
  moduleSymbolByFile.set(rel(sf.fileName), sym)
  let exports = []
  try { exports = sym ? checker.getExportsOfModule(sym) : [] } catch { exports = [] }
  exportCountByFile.set(rel(sf.fileName), exports.length)
}

function markExported() {
  for (const sf of sourceFiles) {
    const sym = moduleSymbolByFile.get(rel(sf.fileName))
    if (!sym) continue
    let exports = []
    try { exports = checker.getExportsOfModule(sym) } catch { exports = [] }
    for (const exp of exports) {
      let resolved = exp
      if (resolved.flags & ts.SymbolFlags.Alias) {
        try { resolved = checker.getAliasedSymbol(resolved) } catch { /* keep */ }
      }
      for (const d of resolved.declarations ?? []) {
        let cur = d
        while (cur) {
          const hit = declToNode.get(cur)
          if (hit) {
            const node = symbolById.get(hit.id)
            if (node) node.exported = true
            break
          }
          cur = cur.parent
        }
      }
    }
  }
}
markExported()

function topNodeOfDecl(decl) {
  let cur = decl
  while (cur) {
    if (declToNode.has(cur)) return declToNode.get(cur)
    cur = cur.parent
  }
  return null
}

function nodeForSymbol(sym) {
  for (const d of sym.declarations ?? []) {
    if (methodByDecl.has(d)) return methodByDecl.get(d)
    const owner = topNodeOfDecl(d)
    if (owner) return owner
  }
  return null
}

function resolveSymbolNode(idNode) {
  let sym = checker.getSymbolAtLocation(idNode)
  if (sym && sym.flags & ts.SymbolFlags.Alias) {
    try { sym = checker.getAliasedSymbol(sym) } catch { /* keep */ }
  }
  return sym ? nodeForSymbol(sym) : null
}

const symbolEdgeMap = new Map()

function addSymbolEdge(sourceId, targetId, kind, extra = {}) {
  if (!sourceId || !targetId || sourceId === targetId) return null
  const key = `${sourceId}->${targetId}|${kind}`
  const edge = symbolEdgeMap.get(key) ?? {
    source: sourceId,
    target: targetId,
    kind,
    count: 0,
  }
  edge.count += extra.count ?? 1
  if (extra.line && (!edge.line || extra.line < edge.line)) edge.line = extra.line
  for (const k of ['http_method', 'http_path', 'front_path', 'via', 'inline', 'generated']) {
    if (extra[k] !== undefined) edge[k] = extra[k]
  }
  symbolEdgeMap.set(key, edge)
  return edge
}

function kindOfReference(idNode) {
  const parent = idNode.parent
  if (ts.isCallExpression(parent) && parent.expression === idNode) return 'call'
  if (ts.isNewExpression(parent) && parent.expression === idNode) return 'new'
  if (ts.isJsxOpeningElement(parent) || ts.isJsxSelfClosingElement(parent)) {
    return parent.tagName === idNode ? 'render' : null
  }
  if (ts.isJsxClosingElement(parent)) return null
  if (ts.isTypeReferenceNode(parent) || ts.isTypeQueryNode(parent) || ts.isImportTypeNode(parent)) return 'ref'
  if (ts.isExpressionWithTypeArguments(parent) || ts.isHeritageClause(parent)) return null
  return 'ref'
}

function isNoise(idNode) {
  const p = idNode.parent
  if ((ts.isPropertyAccessExpression(p) || ts.isQualifiedName(p)) && p.name === idNode) return true
  if (ts.isPropertyAssignment(p) && p.name === idNode) return true
  if (ts.isPropertySignature(p) && p.name === idNode) return true
  if (ts.isPropertyDeclaration(p) && p.name === idNode) return true
  if (ts.isMethodDeclaration(p) && p.name === idNode) return true
  if (ts.isMethodSignature(p) && p.name === idNode) return true
  if (ts.isEnumMember(p) && p.name === idNode) return true
  if (ts.isParameter(p) && p.name === idNode) return true
  if (ts.isBindingElement(p) && p.name === idNode) return true
  if (
    (ts.isFunctionDeclaration(p) || ts.isClassDeclaration(p) || ts.isInterfaceDeclaration(p) ||
      ts.isTypeAliasDeclaration(p) || ts.isEnumDeclaration(p) || ts.isVariableDeclaration(p)) &&
    p.name === idNode
  ) return true
  return false
}

function scanNode(sourceId, node) {
  const visit = (n) => {
    if (n.kind === ts.SyntaxKind.Identifier && !isNoise(n)) {
      const kind = kindOfReference(n)
      if (kind) {
        const target = resolveSymbolNode(n)
        if (target) addSymbolEdge(sourceId, target.id, kind, { line: lineOf(n) })
      }
    }
    ts.forEachChild(n, visit)
  }
  ts.forEachChild(node, visit)
}

for (const sf of sourceFiles) {
  const relPath = rel(sf.fileName)
  for (const node of symbolNodes) {
    if (node.file !== relPath || node.kind === 'method') continue
    const decls = symbolDecls.get(node.id) ?? []
    if (node.kind === 'class') {
      for (const d of decls) {
        if (!ts.isClassDeclaration(d)) continue
        for (const member of d.members) {
          const method = methodByDecl.get(member)
          if (method) scanNode(method.id, member)
          else scanNode(node.id, member)
        }
      }
    } else if (node.kind === 'function') {
      const implementations = decls.filter((d) =>
        (ts.isFunctionDeclaration(d) && !!d.body) ||
        (ts.isVariableDeclaration(d) && !!d.initializer))
      const chosen = implementations.length ? [implementations[implementations.length - 1]] : decls.slice(0, 1)
      for (const d of chosen) {
        if (ts.isFunctionDeclaration(d) && d.body) scanNode(node.id, d.body)
        else if (ts.isVariableDeclaration(d) && d.initializer) scanNode(node.id, d.initializer)
        else scanNode(node.id, d)
      }
    } else {
      for (const d of decls) scanNode(node.id, d)
    }
  }
}

const heritageSkipped = []
function heritageAllowed(kind, target) {
  if (kind === 'implements') return target.kind === 'interface' || (target.kind === 'type' && target.type_shape === 'object')
  return target.kind === 'class' || target.kind === 'interface' || (target.kind === 'type' && target.type_shape === 'object')
}

for (const node of symbolNodes) {
  if (node.kind !== 'class' && node.kind !== 'interface') continue
  for (const d of symbolDecls.get(node.id) ?? []) {
    if (!ts.isClassDeclaration(d) && !ts.isInterfaceDeclaration(d)) continue
    for (const clause of d.heritageClauses ?? []) {
      const kind = clause.token === ts.SyntaxKind.ExtendsKeyword ? 'extends' : 'implements'
      if (node.kind === 'interface' && kind !== 'extends') continue
      for (const t of clause.types) {
        const target = resolveSymbolNode(t.expression)
        const targetText = t.getText().replace(/\s+/g, ' ').trim()
        if (!target) {
          heritageSkipped.push({ source: node.id, kind, target: targetText, reason: 'external-or-unresolved' })
          continue
        }
        if (!heritageAllowed(kind, target)) {
          heritageSkipped.push({ source: node.id, kind, target: targetText, target_id: target.id, reason: 'kind-not-allowed' })
          continue
        }
        addSymbolEdge(node.id, target.id, kind, { line: lineOf(t) })
      }
    }
  }
}

for (const node of symbolNodes) {
  if (node.kind !== 'class') continue
  for (const method of node.methods ?? []) addSymbolEdge(node.id, method.id, 'contains', {})
}

// ---------- routes ----------

const HTTP_METHODS = new Set(['get', 'post', 'put', 'delete', 'patch', 'options', 'head', 'all'])
const CRUD_ENDPOINTS = {
  list: ['GET', ''],
  read: ['GET', '/:id'],
  create: ['POST', ''],
  update: ['PATCH', '/:id'],
  delete: ['DELETE', '/:id'],
}
const routeDefById = new Map()
const duplicateRoutes = []

function joinRoutePath(prefix, routePath) {
  const left = (prefix ?? '').replace(/\/+$/, '')
  const right = routePath === '/' ? '' : `/${String(routePath).replace(/^\/+/, '')}`
  return `${left}${right}` || '/'
}

function addRouteDef(def) {
  const existing = routeDefById.get(def.id)
  if (!existing) {
    routeDefById.set(def.id, def)
    return
  }
  duplicateRoutes.push({ id: def.id, kept: existing.file, dropped: def.file })
  if (existing.generated && !def.generated) routeDefById.set(def.id, def)
}

function importMapOf(sf) {
  const map = new Map()
  for (const st of sf.statements) {
    if (!ts.isImportDeclaration(st) || !ts.isStringLiteral(st.moduleSpecifier)) continue
    const target = resolveRelative(sf.fileName, st.moduleSpecifier.text)
    if (!target) continue
    const targetRel = rel(target)
    const clause = st.importClause
    if (!clause) continue
    if (clause.name) map.set(clause.name.text, targetRel)
    const named = clause.namedBindings
    if (named && ts.isNamespaceImport(named)) map.set(named.name.text, targetRel)
    else if (named && ts.isNamedImports(named)) {
      for (const el of named.elements) map.set(el.name.text, targetRel)
    }
  }
  return map
}

function enclosingSymbolForNode(node) {
  let cur = node.parent
  while (cur) {
    if (methodByDecl.has(cur)) return methodByDecl.get(cur)
    if (declToNode.has(cur)) return declToNode.get(cur)
    cur = cur.parent
  }
  return null
}

function stringLiteralOf(expr) {
  if (expr && (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr))) return expr.text
  return null
}

const mountPrefixByFile = new Map()
const indexSf = sourceFileByRel.get('app/server/src/index.ts')
if (indexSf) {
  const imports = importMapOf(indexSf)
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) &&
      n.expression.expression.kind === ts.SyntaxKind.Identifier &&
      n.expression.expression.text === 'app' && n.expression.name.text === 'route') {
      const prefix = stringLiteralOf(n.arguments[0])
      const target = n.arguments[1]
      if (prefix && target) {
        const names = new Set()
        const collect = (x) => {
          if (ts.isIdentifier(x)) names.add(x.text)
          ts.forEachChild(x, collect)
        }
        collect(target)
        for (const name of names) {
          const file = imports.get(name)
          if (file && !mountPrefixByFile.has(file)) mountPrefixByFile.set(file, prefix)
        }
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(indexSf)
}

function visitRouteCalls(sf, options) {
  const prefix = options.prefix ?? ''
  const visit = (n) => {
    if (ts.isCallExpression(n) && ts.isPropertyAccessExpression(n.expression) &&
      n.expression.expression.kind === ts.SyntaxKind.Identifier &&
      n.expression.expression.text === 'app') {
      const verb = n.expression.name.text
      let method = null
      let pathArg = null
      let handlerArg = null
      if (verb === 'on') {
        const methodText = stringLiteralOf(n.arguments[0])
        if (methodText && HTTP_METHODS.has(methodText.toLowerCase())) {
          method = methodText.toUpperCase()
          pathArg = n.arguments[1]
          handlerArg = n.arguments[2]
        }
      } else if (HTTP_METHODS.has(verb)) {
        method = verb.toUpperCase()
        pathArg = n.arguments[0]
        handlerArg = n.arguments[1]
      }
      const routePath = stringLiteralOf(pathArg)
      if (method && routePath) {
        const fullPath = joinRoutePath(prefix, routePath)
        const enclosing = enclosingSymbolForNode(n)
        let handlerId = null
        let handlerInline = false
        let handlerLine = handlerArg ? lineOf(handlerArg) : lineOf(n)
        if (handlerArg && (ts.isArrowFunction(handlerArg) || ts.isFunctionExpression(handlerArg))) {
          handlerInline = true
          handlerId = enclosing ? enclosing.id : null
        } else if (handlerArg) {
          const target = resolveSymbolNode(handlerArg)
          if (target) {
            handlerId = target.id
            handlerLine = target.line
          }
        }
        const file = rel(sf.fileName)
        const moduleId = fileModule.get(file).module_id
        addRouteDef({
          id: `route:${method} ${fullPath}`,
          method,
          path: fullPath,
          file,
          module_id: moduleId,
          line: lineOf(n),
          handler_id: handlerId,
          handler_inline: handlerInline,
          handler_generated: false,
          handler_line: handlerLine,
          generated: false,
        })
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

for (const sf of sourceFiles) {
  const relPath = rel(sf.fileName)
  if (relPath.startsWith('app/server/src/routes/') && !relPath.endsWith('/doc.ts')) {
    visitRouteCalls(sf, { prefix: mountPrefixByFile.get(relPath) ?? '' })
  }
}
if (indexSf) visitRouteCalls(indexSf, { prefix: '' })

const crudSf = sourceFileByRel.get('app/server/src/routes/crud.ts')
if (crudSf) {
  for (const st of crudSf.statements) {
    if (!ts.isVariableStatement(st)) continue
    for (const d of st.declarationList.declarations) {
      if (!ts.isIdentifier(d.name) || d.name.text !== 'Tables' || !d.initializer || !ts.isArrayLiteralExpression(d.initializer)) continue
      for (const element of d.initializer.elements) {
        if (!ts.isObjectLiteralExpression(element)) continue
        let tablePath = null
        let endpoints = []
        for (const prop of element.properties) {
          const name = propName(prop)
          if (!name || !ts.isPropertyAssignment(prop)) continue
          if (name === 'path') tablePath = stringLiteralOf(prop.initializer)
          if (name === 'endpoints' && ts.isObjectLiteralExpression(prop.initializer)) {
            endpoints = prop.initializer.properties.map(propName).filter(Boolean)
          }
        }
        if (!tablePath) continue
        for (const endpoint of endpoints) {
          const spec = CRUD_ENDPOINTS[endpoint]
          if (!spec) continue
          const [method, suffix] = spec
          const fullPath = joinRoutePath('', `${tablePath}${suffix}`)
          addRouteDef({
            id: `route:${method} ${fullPath}`,
            method,
            path: fullPath,
            file: rel(crudSf.fileName),
            module_id: fileModule.get(rel(crudSf.fileName)).module_id,
            line: lineOf(element),
            handler_id: 'app/server/src/routes/crud.ts#registerAllCrud',
            handler_inline: false,
            handler_generated: true,
            handler_line: lineOf(element),
            generated: true,
          })
        }
      }
    }
  }
}

for (const def of routeDefById.values()) {
  const node = registerPlainSymbol({
    id: def.id,
    kind: 'route',
    name: `${def.method} ${def.path}`,
    label: `${def.method} ${def.path}`,
    qualified_name: `${def.method} ${def.path}`,
    http_method: def.method,
    http_path: def.path,
    handler_id: def.handler_id,
    handler_inline: def.handler_inline,
    handler_generated: def.handler_generated,
    handler_line: def.handler_line,
    file: def.file,
    module_id: def.module_id,
    group: groupOf(def.file),
    line: def.line,
    exported: false,
    generated: def.generated,
    collapsed: false,
  })
  if (!node) continue
  if (def.handler_id) {
    addSymbolEdge(def.id, def.handler_id, 'route_handler', {
      line: def.handler_line,
      inline: def.handler_inline,
      generated: def.handler_generated,
    })
  }
}
const routeNodes = symbolNodes.filter((n) => n.kind === 'route')

// ---------- http contracts ----------

const httpCalls = []
const httpStats = { total: 0, resolved: 0, unresolved: 0, skipped_helpers: ['requestJson', 'requestNoContent'] }

function constMapOf(sf) {
  const map = new Map()
  const visit = (n) => {
    if (ts.isVariableDeclaration(n) && ts.isIdentifier(n.name) && n.initializer) map.set(n.name.text, n.initializer)
    ts.forEachChild(n, visit)
  }
  visit(sf)
  return map
}

function resolveStringExpr(expr, constMap, depth = 0) {
  if (!expr || depth > 5) return null
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return { text: expr.text, dynamic: false }
  if (ts.isTemplateExpression(expr)) {
    let text = expr.head.text
    for (const span of expr.templateSpans) text += `*${span.literal.text}`
    return { text, dynamic: true }
  }
  if (ts.isIdentifier(expr)) {
    const init = constMap.get(expr.text)
    return init ? resolveStringExpr(init, constMap, depth + 1) : null
  }
  if (ts.isParenthesizedExpression(expr)) return resolveStringExpr(expr.expression, constMap, depth + 1)
  if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
    const left = resolveStringExpr(expr.left, constMap, depth + 1)
    const right = resolveStringExpr(expr.right, constMap, depth + 1)
    if (!left || !right) return null
    return { text: `${left.text}${right.text}`, dynamic: left.dynamic || right.dynamic }
  }
  return null
}

function normalizeApiPath(text, absoluteApi) {
  let p = String(text).replace(/^https?:\/\/[^/]+/, '')
  if (absoluteApi) {
    if (p === '/api') p = '/'
    else if (p.startsWith('/api/')) p = p.slice(4)
  }
  if (!p.startsWith('/')) p = `/${p}`
  const query = p.indexOf('?')
  if (query >= 0) p = p.slice(0, query)
  const hash = p.indexOf('#')
  if (hash >= 0) p = p.slice(0, hash)
  p = p.replace(/\/{2,}/g, '/')
  if (p.length > 1) p = p.replace(/\/+$/, '')
  return p || '/'
}

function splitPath(p) {
  return p === '/' ? [] : p.split('/').filter(Boolean)
}

function segmentMatches(pattern, actual) {
  if (actual.startsWith(':')) return true
  if (pattern === '*' || pattern === '') return true
  if (pattern.includes('*')) {
    const re = new RegExp(`^${pattern.split('*').map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('.*')}$`)
    return re.test(actual)
  }
  return pattern === actual
}

function pathMatchScore(pattern, routePath) {
  const ps = splitPath(pattern)
  const rs = splitPath(routePath)
  if (ps.length !== rs.length) return -1
  let score = 0
  for (let i = 0; i < ps.length; i++) {
    if (!segmentMatches(ps[i], rs[i])) return -1
    if (!rs[i].startsWith(':') && !ps[i].includes('*')) score += 1
  }
  return score
}

const routesByMethod = new Map()
for (const route of routeNodes) {
  if (!routesByMethod.has(route.http_method)) routesByMethod.set(route.http_method, [])
  routesByMethod.get(route.http_method).push(route)
}

function matchRoute(method, pattern) {
  const sameMethod = routesByMethod.get(method) ?? []
  let best = null
  let bestScore = -1
  for (const route of sameMethod) {
    const score = pathMatchScore(pattern, route.http_path)
    if (score > bestScore) {
      best = route
      bestScore = score
    }
  }
  if (best) return { route: best, reason: null }
  const otherMethod = routeNodes.find((route) => pathMatchScore(pattern, route.http_path) >= 0)
  return { route: null, reason: otherMethod ? 'method-mismatch' : 'no-route' }
}

function methodFromOptions(expr) {
  if (expr && ts.isObjectLiteralExpression(expr)) {
    for (const prop of expr.properties) {
      if (propName(prop) !== 'method' || !ts.isPropertyAssignment(prop)) continue
      const method = stringLiteralOf(prop.initializer)
      if (method) return method.toUpperCase()
    }
  }
  return null
}

function addHttpCall(call) {
  const key = `${call.source}|${call.line}|${call.method}|${call.api_path}`
  if (httpCalls.some((c) => c.id === key)) return
  const entry = {
    id: key,
    source: call.source,
    source_name: call.source_name,
    file: call.file,
    line: call.line,
    method: call.method,
    path: call.path,
    api_path: call.api_path,
    via: call.via,
    status: call.status,
    route_id: call.route_id ?? null,
    route_path: call.route_path ?? null,
    reason: call.reason ?? null,
  }
  httpCalls.push(entry)
  httpStats.total += 1
  if (entry.status === 'resolved') {
    httpStats.resolved += 1
    addSymbolEdge(entry.source, entry.route_id, 'http', {
      http_method: entry.method,
      http_path: entry.route_path,
      front_path: entry.api_path,
      via: entry.via,
      line: entry.line,
    })
  } else {
    httpStats.unresolved += 1
  }
}

function recordTransportCall(node, caller, relPath, constMap) {
  const first = node.arguments?.[0]
  if (!first || !ts.isObjectLiteralExpression(first)) return
  for (const prop of first.properties) {
    if (propName(prop) !== 'api' || !ts.isPropertyAssignment(prop)) continue
    const resolved = resolveStringExpr(prop.initializer, constMap)
    if (!resolved) continue
    const path = normalizeApiPath(resolved.text, true)
    const match = matchRoute('POST', path)
    addHttpCall({
      source: caller.id,
      source_name: caller.qualified_name ?? caller.name,
      file: relPath,
      line: lineOf(node),
      method: 'POST',
      path: resolved.text,
      api_path: path,
      via: 'transport',
      status: match.route ? 'resolved' : 'unresolved',
      route_id: match.route?.id ?? null,
      route_path: match.route?.http_path ?? null,
      reason: match.reason,
    })
  }
}

const apiFiles = sourceFiles.filter((sf) => rel(sf.fileName).startsWith('app/web/src/api/'))
for (const sf of apiFiles) {
  const relPath = rel(sf.fileName)
  const constMap = constMapOf(sf)
  const visit = (n) => {
    if (ts.isNewExpression(n)) {
      const callee = n.expression
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : null
      const caller = enclosingSymbolForNode(n)
      if (name === 'DefaultChatTransport' && caller) recordTransportCall(n, caller, relPath, constMap)
    }
    if (ts.isCallExpression(n)) {
      const callee = n.expression
      const name = ts.isIdentifier(callee) ? callee.text : ts.isPropertyAccessExpression(callee) ? callee.name.text : null
      const caller = enclosingSymbolForNode(n)
      if (caller && (caller.name === 'requestJson' || caller.name === 'requestNoContent')) {
        ts.forEachChild(n, visit)
        return
      }
      const isFetch = name === 'fetch'
      const isRequestJson = name === 'requestJson'
      const isRequestNoContent = name === 'requestNoContent'
      if ((isFetch || isRequestJson || isRequestNoContent) && caller) {
        const resolved = resolveStringExpr(n.arguments[0], constMap)
        const via = isFetch ? 'fetch' : isRequestJson ? 'requestJson' : 'requestNoContent'
        if (!resolved) {
          addHttpCall({
            source: caller.id,
            source_name: caller.qualified_name ?? caller.name,
            file: relPath,
            line: lineOf(n),
            method: isRequestNoContent ? (stringLiteralOf(n.arguments[1]) ?? 'GET').toUpperCase() : (methodFromOptions(n.arguments[1]) ?? 'GET'),
            path: '<dynamic>',
            api_path: '<dynamic>',
            via,
            status: 'unresolved',
            reason: 'dynamic-path',
          })
        } else {
          const absoluteApi = isFetch
          const method = isRequestNoContent
            ? (stringLiteralOf(n.arguments[1]) ?? 'GET').toUpperCase()
            : (methodFromOptions(n.arguments[1]) ?? 'GET')
          const path = normalizeApiPath(resolved.text, absoluteApi)
          if ((absoluteApi && resolved.text.startsWith('/api')) || !absoluteApi) {
            const match = matchRoute(method, path)
            addHttpCall({
              source: caller.id,
              source_name: caller.qualified_name ?? caller.name,
              file: relPath,
              line: lineOf(n),
              method,
              path: resolved.text,
              api_path: path,
              via,
              status: match.route ? 'resolved' : 'unresolved',
              route_id: match.route?.id ?? null,
              route_path: match.route?.http_path ?? null,
              reason: match.reason,
            })
          }
        }
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(sf)
}

// ---------- module http edges ----------

const moduleHttpMap = new Map()
for (const call of httpCalls) {
  if (call.status !== 'resolved' || !call.route_id) continue
  const sourceFile = fileById.get(call.file)
  const route = symbolById.get(call.route_id)
  const targetFile = route ? fileById.get(route.file) : null
  const a = sourceFile?.module_id
  const b = targetFile?.module_id
  if (!a || !b || a === b) continue
  const key = `${a}->${b}`
  const cur = moduleHttpMap.get(key) ?? {
    id: `module-http:${a}->${b}`,
    source: `module:${a}`,
    target: `module:${b}`,
    kind: 'http',
    count: 0,
    source_module: a,
    target_module: b,
    source_layer: MODULE_BY_ID.get(a)?.layer ?? null,
    target_layer: MODULE_BY_ID.get(b)?.layer ?? null,
    layers: [MODULE_BY_ID.get(a)?.layer ?? null, MODULE_BY_ID.get(b)?.layer ?? null],
    _files: new Set(),
    _routes: new Set(),
    calls: [],
  }
  cur.count += 1
  cur._files.add(call.file)
  cur._routes.add(call.route_id)
  cur.calls.push({
    source: call.source,
    method: call.method,
    api_path: call.api_path,
    route_id: call.route_id,
    route_path: call.route_path,
    file: call.file,
    line: call.line,
    via: call.via,
  })
  moduleHttpMap.set(key, cur)
}
for (const edge of moduleHttpMap.values()) {
  edge.source_files = edge._files.size
  edge.route_count = edge._routes.size
  delete edge._files
  delete edge._routes
  moduleEdges.push(edge)
}
moduleEdges.sort((a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target))

// ---------- symbol stats ----------

const degree = new Map()
const inDegree = new Map()
for (const e of symbolEdgeMap.values()) {
  degree.set(e.source, (degree.get(e.source) ?? 0) + 1)
  degree.set(e.target, (degree.get(e.target) ?? 0) + 1)
  inDegree.set(e.target, (inDegree.get(e.target) ?? 0) + 1)
}
for (const node of symbolNodes) {
  node.degree = degree.get(node.id) ?? 0
  node.inDegree = inDegree.get(node.id) ?? 0
}

const symbolEdges = [...symbolEdgeMap.values()].sort(
  (a, b) => a.source.localeCompare(b.source) || a.target.localeCompare(b.target) || a.kind.localeCompare(b.kind),
)
const symbolByIdLive = new Map(symbolNodes.map((n) => [n.id, n]))
const countByKind = (list, key) => list.reduce((acc, x) => { acc[x[key]] = (acc[x[key]] ?? 0) + 1; return acc }, {})
const symbolStats = {
  nodes: symbolNodes.length,
  edges: symbolEdges.length,
  byKind: countByKind(symbolNodes, 'kind'),
  byEdgeKind: countByKind(symbolEdges, 'kind'),
  classes: symbolNodes.filter((n) => n.kind === 'class').length,
  interfaces: symbolNodes.filter((n) => n.kind === 'interface').length,
  types: symbolNodes.filter((n) => n.kind === 'type').length,
  functions: symbolNodes.filter((n) => n.kind === 'function').length,
  methods: symbolNodes.filter((n) => n.kind === 'method').length,
  enums: symbolNodes.filter((n) => n.kind === 'enum').length,
  routes: routeNodes.length,
  exported: symbolNodes.filter((n) => n.exported).length,
  method_nodes: symbolNodes.filter((n) => n.kind === 'method').length,
  crossFileEdges: symbolEdges.filter((e) => {
    const a = symbolByIdLive.get(e.source)
    const b = symbolByIdLive.get(e.target)
    return a && b && a.file !== b.file
  }).length,
  heritageSkipped: heritageSkipped.length,
  duplicateRoutes: duplicateRoutes.length,
  http: { ...httpStats },
}

const fileDegree = new Map()
for (const n of fileNodes) fileDegree.set(n.id, { in: 0, out: 0 })
for (const e of fileEdges) {
  if (fileDegree.has(e.target)) fileDegree.get(e.target).in += 1
  if (fileDegree.has(e.source)) fileDegree.get(e.source).out += 1
}

function findCycles(nodes, edges) {
  const index = new Map()
  const low = new Map()
  const onStack = new Set()
  const stack = []
  const result = []
  let counter = 0
  const adjacency = new Map(nodes.map((n) => [n.id, []]))
  for (const e of edges) adjacency.get(e.source)?.push(e.target)
  const strong = (v) => {
    index.set(v, counter)
    low.set(v, counter)
    counter += 1
    stack.push(v)
    onStack.add(v)
    for (const w of adjacency.get(v) ?? []) {
      if (!index.has(w)) {
        strong(w)
        low.set(v, Math.min(low.get(v), low.get(w)))
      } else if (onStack.has(w)) {
        low.set(v, Math.min(low.get(v), index.get(w)))
      }
    }
    if (low.get(v) === index.get(v)) {
      const comp = []
      let w
      do {
        w = stack.pop()
        onStack.delete(w)
        comp.push(w)
      } while (w !== v)
      if (comp.length > 1) result.push(comp.sort())
    }
  }
  for (const n of nodes) if (!index.has(n.id)) strong(n.id)
  const selfLoops = edges.filter((e) => e.source === e.target).map((e) => [e.source])
  return [...result, ...selfLoops].sort((a, b) => b.length - a.length)
}
const moduleCycles = findCycles(fileNodes, fileEdges.filter((e) => e.kind === 'runtime'))
const moduleCyclesAll = findCycles(fileNodes, fileEdges)

for (const node of moduleNodes) {
  const files = fileNodes
    .filter((f) => f.module_id === node.module_id)
    .map((f) => ({ file: f.id, exports: exportCountByFile.get(f.id) ?? 0, lines: f.lines }))
    .sort((a, b) => b.exports - a.exports || b.lines - a.lines || a.file.localeCompare(b.file))
  node.entry_files = files.filter((f) => f.exports > 0).slice(0, 3)
}

const containsEdges = []
for (const folder of folderNodes) {
  for (const file of fileNodes) {
    if (path.posix.dirname(file.file) === folder.path) {
      containsEdges.push({ source: folder.id, target: file.id, kind: 'contains' })
    }
  }
}
for (const module of moduleNodes) {
  for (const file of fileNodes) {
    if (file.module_id === module.module_id) containsEdges.push({ source: module.id, target: file.id, kind: 'contains' })
  }
}

// legacy directory grouping for big-graph.html
const groups = new Map()
for (const n of fileNodes) {
  const g = groups.get(n.group) ?? { id: n.group, ...GROUP_META[n.group], files: 0, lines: 0 }
  g.files += 1
  g.lines += n.lines
  groups.set(n.group, g)
}
const groupNodes = [...groups.values()].sort((a, b) => a.id.localeCompare(b.id))
const dirEdgeMap = new Map()
for (const e of fileEdges) {
  const a = fileById.get(e.source)?.group
  const b = fileById.get(e.target)?.group
  if (!a || !b || a === b) continue
  const key = `${a}->${b}`
  const cur = dirEdgeMap.get(key) ?? { source: a, target: b, count: 0, files: 0, kinds: new Set() }
  cur.count += 1
  cur.files += 1
  cur.kinds.add(e.kind)
  dirEdgeMap.set(key, cur)
}
const dirEdges = [...dirEdgeMap.values()].map((e) => ({ ...e, kinds: [...e.kinds] }))
const groupDegree = new Map()
for (const e of dirEdges) {
  groupDegree.set(e.source, (groupDegree.get(e.source) ?? 0) + e.count)
  groupDegree.set(e.target, (groupDegree.get(e.target) ?? 0) + e.count)
}
const dirNodes = groupNodes.map((g) => ({
  id: g.id,
  label: g.label,
  group: g.id,
  zone: g.zone,
  files: g.files,
  lines: g.lines,
  degree: groupDegree.get(g.id) ?? 0,
  x: 0,
  y: 0,
  r: 9 + Math.min(14, Math.sqrt(g.files) * 4),
}))

function mulberry32(seed) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
function layoutDirNodes(nodes) {
  const rand = mulberry32(99)
  const serverNodes = nodes.filter((n) => n.zone === 'server')
  const webNodes = nodes.filter((n) => n.zone !== 'server')
  const place = (list, cx) => {
    const cols = Math.ceil(Math.sqrt(list.length * 1.3))
    const rows = Math.ceil(list.length / cols)
    list.forEach((n, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)
      n.x = cx + (col - (cols - 1) / 2) * 158 + (rand() - 0.5) * 26
      n.y = (row - (rows - 1) / 2) * 132 + (rand() - 0.5) * 26
    })
  }
  place(serverNodes, -400)
  place(webNodes, 400)
}
layoutDirNodes(dirNodes)

const moduleStats = {
  files: fileNodes.length,
  lines: fileNodes.reduce((a, n) => a + n.lines, 0),
  edges: fileEdges.length,
  runtimeEdges: fileEdges.filter((e) => e.kind === 'runtime').length,
  typeOnlyEdges: fileEdges.filter((e) => e.kind === 'type').length,
  folders: folderNodes.length,
  modules: moduleNodes.length,
  moduleEdges: moduleEdges.length,
  moduleHttpEdges: moduleEdges.filter((e) => e.kind === 'http').length,
  containsEdges: containsEdges.length,
  externalPackages: externalPackages.length,
  externalNodes: externalNodes.length,
  cycles: moduleCycles.length,
  typeOnlyCycles: moduleCyclesAll.length,
  unresolved: unresolvedSpecs.length,
}

// ---------- revision & output ----------

function codeRevision() {
  try {
    const commit = execSync('git rev-parse HEAD', { cwd: ROOT }).toString().trim()
    const dirty = execSync('git status --porcelain --untracked-files=no', { cwd: ROOT }).toString().trim().length > 0
    return { commit, short: commit.slice(0, 7), dirty, ref: 'HEAD' }
  } catch {
    return { commit: 'unknown', short: 'unknown', dirty: true, ref: 'HEAD' }
  }
}
const revision = codeRevision()
const now = new Date().toISOString()

const moduleGraph = {
  generatedAt: now,
  code_revision: revision,
  root: ROOT,
  nodes: fileNodes,
  edges: fileEdges,
  folders: folderNodes,
  containsEdges,
  modules: moduleNodes,
  moduleEdges,
  externalNodes,
  externals: externalPackages,
  cycles: moduleCycles,
  allCycles: moduleCyclesAll,
  groups: groupNodes,
  dirNodes,
  dirEdges,
  stats: moduleStats,
  pending: { db_edges: 'pending', external_edges: 'pending', tables: 'pending' },
}
const symbolGraph = {
  generatedAt: now,
  code_revision: revision,
  nodes: symbolNodes,
  edges: symbolEdges,
  routes: routeNodes,
  httpCalls,
  heritageSkipped,
  stats: symbolStats,
  pending: { db_edges: 'pending', external_edges: 'pending', tables: 'pending' },
}

fs.writeFileSync(path.join(HERE, 'data/module-graph.json'), JSON.stringify(moduleGraph, null, 1))
fs.writeFileSync(path.join(HERE, 'data/symbol-graph.json'), JSON.stringify(symbolGraph, null, 1))

// ---------- overview.md ----------

const topHubs = fileNodes
  .map((n) => ({ ...n, in: fileDegree.get(n.id)?.in ?? 0, out: fileDegree.get(n.id)?.out ?? 0 }))
  .sort((a, b) => b.in + b.out - (a.in + a.out))
  .slice(0, 15)

function mermaidModules() {
  const ids = new Map(moduleNodes.map((n, i) => [n.id, `m${i}`]))
  const lines = ['flowchart LR', '  classDef interface stroke-width:2px']
  for (const n of moduleNodes) {
    lines.push(`  ${ids.get(n.id)}["${n.label}<br/><small>${n.file_count} 文件 · ${n.lines} 行</small>"]`)
  }
  for (const e of [...moduleEdges].sort((a, b) => b.count - a.count).slice(0, 35)) {
    if (e.kind === 'http') lines.push(`  ${ids.get(e.source)} -.->|http ${e.count}| ${ids.get(e.target)}`)
    else lines.push(`  ${ids.get(e.source)} -->|${e.count}| ${ids.get(e.target)}`)
  }
  return lines.join('\n')
}

const md = []
md.push('# 仓库代码图概览')
md.push('')
md.push(`> 生成时间：${now} · 代码版本：\`${revision.short}${revision.dirty ? '-dirty' : ''}\` · 范围：\`app/server/src\` + \`app/web/src\` · 排除 \`*.test.*\`、\`test-setup.ts\`、\`legacy.fixtures.ts\`、\`*.d.ts\`。`)
md.push('')
md.push('交互版：打开 `index.html`（单张代码图 + 语义缩放：缩放依次露出模块 / 文件 / 符号 / 方法；左栏点模块摊开全部文件与直接依赖，点文件摊开全部符号与直接依赖。文档图 Wiki 为独立入口）。重跑：`node _Agents/dependency-graph/analyze.mjs`。')
md.push('')
md.push('## 数字')
md.push('')
md.push('| 指标 | 值 |')
md.push('| --- | --- |')
md.push(`| 源文件 | ${moduleStats.files} |`)
md.push(`| 代码行 | ${moduleStats.lines} |`)
md.push(`| 物理目录节点 | ${moduleStats.folders} |`)
md.push(`| 模块 | ${moduleStats.modules} |`)
md.push(`| 文件 import 边 | ${moduleStats.edges}（运行时 ${moduleStats.runtimeEdges} / 仅类型 ${moduleStats.typeOnlyEdges}） |`)
md.push(`| 模块聚合边 | ${moduleStats.moduleEdges} |`)
md.push(`| 符号节点 | ${symbolStats.nodes}（class ${symbolStats.classes} · interface ${symbolStats.interfaces} · type ${symbolStats.types} · function ${symbolStats.functions} · method ${symbolStats.methods} · route ${symbolStats.routes} · enum ${symbolStats.enums}） |`)
md.push(`| 符号边 | ${symbolStats.edges}（call ${symbolStats.byEdgeKind.call ?? 0} · render ${symbolStats.byEdgeKind.render ?? 0} · new ${symbolStats.byEdgeKind.new ?? 0} · ref ${symbolStats.byEdgeKind.ref ?? 0} · extends ${symbolStats.byEdgeKind.extends ?? 0} · implements ${symbolStats.byEdgeKind.implements ?? 0} · route_handler ${symbolStats.byEdgeKind.route_handler ?? 0} · http ${symbolStats.byEdgeKind.http ?? 0}） |`)
md.push(`| 跨文件符号边 | ${symbolStats.crossFileEdges} |`)
md.push(`| HTTP 契约 | ${symbolStats.http.resolved} / ${symbolStats.http.total} 已匹配，${symbolStats.http.unresolved} unresolved |`)
md.push(`| 外部包 | ${moduleStats.externalPackages} |`)
md.push(`| 文件级循环依赖 | 运行时 ${moduleStats.cycles} 组 · 含类型边 ${moduleStats.typeOnlyCycles} 组 |`)
md.push('')
md.push('## 模块依赖')
md.push('')
md.push('```mermaid')
md.push(mermaidModules())
md.push('```')
md.push('')
md.push('实线数字是模块间文件 import 语句数；虚线是解析成功的 HTTP 契约调用数（当前 `web -> routes`）；模块定义在 `module-map.json`。')
md.push('')
md.push('| 模块 | 层 | 文件 | 行数 | 入口文件 |')
md.push('| --- | --- | --- | --- | --- |')
for (const m of moduleNodes) {
  const entries = m.entry_files.map((f) => `\`${f.file.replace('app/server/src/', 'server/').replace('app/web/src/', 'web/')}\` (${f.exports})`).join('<br>')
  md.push(`| ${m.label} | ${m.layer} | ${m.file_count} | ${m.lines} | ${entries || '-'} |`)
}
md.push('')
md.push('## 文件 Hub（出入度最高）')
md.push('')
md.push('| 文件 | 出度 | 入度 | 行数 |')
md.push('| --- | --- | --- | --- |')
for (const n of topHubs) md.push(`| \`${n.file}\` | ${n.out} | ${n.in} | ${n.lines} |`)
md.push('')
md.push('## 文件级循环依赖')
md.push('')
md.push('只统计运行时 import 的环。类型 import 形成的环单列在后面：TS 允许它，且 `type` 导入编译后会被抹掉。')
md.push('')
if (moduleCycles.length === 0) md.push('运行时 import 未发现环。')
else {
  md.push('| # | 环 |')
  md.push('| --- | --- |')
  moduleCycles.forEach((c, i) => md.push(`| ${i + 1} | ${c.map((x) => `\`${x.replace('app/server/src/', 'server/').replace('app/web/src/', 'web/')}\``).join(' ↔ ')} |`))
}
md.push('')
if (moduleCyclesAll.length > moduleCycles.length) {
  md.push('把 `import type` / `export type ... from` 也计入后，额外出现：')
  md.push('')
  moduleCyclesAll
    .filter((c) => !moduleCycles.some((r) => r.join('|') === c.join('|')))
    .forEach((c) => md.push(`- ${c.map((x) => `\`${x.replace('app/server/src/', 'server/').replace('app/web/src/', 'web/')}\``).join(' ↔ ')}`))
  md.push('')
}
md.push('## 外部包（按引用文件数）')
md.push('')
md.push('| 包 | 引用文件 | 引用次数 |')
md.push('| --- | --- | --- |')
for (const p of externalPackages.slice(0, 20)) md.push(`| \`${p.name}\` | ${p.files} | ${p.count} |`)
md.push('')
md.push('## 读图口径')
md.push('')
md.push('- 单图语义缩放：scale < 0.9 只显示模块；0.9–1.35 展开视口中心最近模块的文件；1.35–2.15 展开最近文件的符号；>2.15 展开最近类的方法。显式点击模块/文件不受阈值限制。')
md.push('- 布局：模块初始位置由 import/http 聚合边力导；新节点围绕父节点并偏向依赖锚点放置，已有节点位置冻结，展开不整体重排。')
md.push('- 模块节点来自 `module-map.json`，是图上的点而不是容器框；模块边由文件 import 聚合，`count` 是 import 语句数；`kind: http` 的模块边由前后端 HTTP 契约聚合。')
md.push('- 文件节点来自真实 AST；物理目录保留在数据里但当前单图不渲染，`contains` 边直接表达 module → file 归属。')
md.push('- 符号节点 = 顶层函数、类、interface、type、enum、route，以及类方法（`file#Class.method`，`class_id` 指回类）；interface 与 type 分开，type 带 `type_shape`。')
md.push('- 符号边：`call` 调用、`new` 实例化、`render` JSX 渲染、`ref` 值/类型引用、`extends` 继承、`implements` 实现、`route_handler` 路由绑定、`http` 前后端契约。')
md.push('- 路由：扫描 `app/server/src/routes/*.ts` 的 Hono 注册与 `crud.ts` 的 hono-crud 端点表，挂载前缀取自 `index.ts` 的 `app.route(...)`。')
md.push('- `http` 边按 method + path 匹配（前端去掉 `/api`，动态段当通配）；匹配不到的调用留在 `symbol-graph.json` 的 `httpCalls` 里标 `unresolved`，不伪造边。')
md.push('- `db` / `external` 边与 `table` 节点按 spec 后置，`pending` 标记在 JSON 里；external 只建了 Ollama/DeepSeek/Langfuse/ParadeDB/PostgreSQL/Redis 六个节点。')
md.push('')
fs.writeFileSync(path.join(HERE, 'overview.md'), md.join('\n'))

const templatePath = path.join(HERE, 'template.html')
if (fs.existsSync(templatePath)) {
  const template = fs.readFileSync(templatePath, 'utf8')
  const payload = JSON.stringify({ moduleGraph, symbolGraph }).replace(/</g, '\\u003c')
  fs.writeFileSync(path.join(HERE, 'index.html'), template.replace('/*__GRAPH_DATA__*/null', payload))
}

console.log(JSON.stringify({
  revision,
  module: moduleStats,
  symbol: symbolStats,
  unresolved: unresolvedSpecs.slice(0, 10),
  httpUnresolved: httpCalls.filter((c) => c.status !== 'resolved').slice(0, 10),
  heritageSkipped: heritageSkipped.slice(0, 10),
}, null, 2))
