# 代码图重构 Spec

- 状态：交给实现子 agent
- 日期：2026-10-23
- 目标文件：`_Agents/dependency-graph/analyze.mjs`、`template.html`、生成的 `index.html`、`data/`
- 范围：只重构代码图；Wiki 视图和文档流程保持不变

## 1. 目标

把现有四个平行视图（目录 / 文件 / 函数·类 / Wiki）中的**代码部分**收敛成一张代码图，提供三种粒度：

```
文件粒度：folder / file
模块粒度：module
符号粒度：class / interface / type / function / method / route
```

一张图、三种过滤/展开层级，不再维护三张平行代码图。Wiki 视图保留。

## 2. 必须遵守的视觉规则

1. **所有节点统一为点**：SVG 只做图标、色环、光晕、徽标；
2. **禁止用框/容器表达分组**：模块、文件夹都是节点，不是大框；
3. 节点类型只影响颜色、图标、标签，不影响几何；
4. 语义放在边：线型、箭头、标签；
5. 默认折叠，避免一次画出 600+ 节点。

## 3. 节点表

| kind | 说明 | 关键字段 | 默认显示 |
|---|---|---|---|
| `folder` | 物理目录 | `path` | 文件视图 |
| `file` | 源文件 | `path`、`lines`、`language` | 文件视图 |
| `module` | 逻辑模块 | `module_id`、`name`、`layer`、`entry_files` | 模块视图 |
| `class` | 类 | `qualified_name`、`file`、`line`、`exported` | 展开文件 |
| `interface` | interface 声明 | `qualified_name`、`file`、`line`、`declaration_kind: interface` | 展开文件 |
| `type` | type alias | `qualified_name`、`file`、`line`、`declaration_kind: type`、`type_shape` | 展开文件 |
| `function` | 顶层函数 / 箭头函数 | `qualified_name`、`file`、`line`、`signature` | 展开文件 |
| `method` | 类的方法 | `qualified_name`、`class_id`、`file`、`line` | 折叠在类下 |
| `route` | HTTP 路由 | `http_method`、`http_path`、`handler_id` | 涉及 HTTP 时 |
| `external` | 外部服务 / 库 | `name` | 默认隐藏 |
| `table` | 数据表 | `table_name`、`schema` | 默认隐藏 |
| `enum` | 枚举 | `qualified_name`、`file`、`line` | 展开文件 |

`interface` 与 `type` 不能合并：实测 TS2300（type 不能声明合并）、TS2422（union type 不能 implements）。`type_shape` 取值：`object | union | tuple | primitive | conditional | mapped | other`。

## 4. 边表

| 边 | from → to | 语义 | 线型 | 默认 |
|---|---|---|---|---|
| `contains` | folder → file、module → file/symbol、class → method | 归属/包含 | 细实线 | 显示 |
| `import` | file → file | 编译依赖 | 虚线 | 显示 |
| `call` | function/method → function/method | 进程内调用 | 实线 + 箭头 | 显示 |
| `new` | function/method → class | 实例化 | 虚线 + «create» | 显示 |
| `render` | function/class → function/class | JSX 渲染 | 青色实线 | 显示 |
| `ref` | any → any | 值/类型引用 | 点线 | 隐藏 |
| `extends` | class → class、interface → interface/type(object) | 继承 | 实线 + 空心三角 | 显示 |
| `implements` | class → interface/type(object) | 实现 | 虚线 + 空心三角 | 显示 |
| `route_handler` | route → function/method | 路由绑定 | 实线 | 显示 |
| `http` | 前端调用点 → route | HTTP 契约 | 点划线，标签 `METHOD /path` | 显示 |
| `db` | repo/method → table | 数据读写 | 虚线 + 标签 | 隐藏 |
| `external` | symbol → external | 外部服务调用 | 点线 | 隐藏 |

约束：

- `implements` 只允许目标为 `interface` 或 `type_shape=object` 的 `type`；
- `extends` 的目标只允许 `class`、`interface` 或对象形状 `type`；
- `type` 不作为 `extends` 的源；
- `http` 边按 method + path 匹配，前端路径去掉 `/api` 前缀。

## 5. 构建器（analyze.mjs）要求

### 5.1 模块层

新增 `module-map.json`（放 `_Agents/dependency-graph/`），默认：

| module_id | label | layer | paths |
|---|---|---|---|
| `web` | Web | presentation | `app/web/src` |
| `routes` | Routes | interface | `app/server/src/routes` |
| `agent` | Agent | application | `app/server/src/agent` |
| `retrieve` | Retrieve | application | `app/server/src/retrieve` |
| `ingest` | Ingest | application | `app/server/src/ingest` |
| `adapter` | Adapter | infrastructure | `app/server/src/adapter` |
| `trace` | Trace | infrastructure | `app/server/src/trace` |
| `core` | Core | infrastructure | `app/server/src/config.ts`、`app/server/src/index.ts` |

- 每个文件映射到一个 module；
- `module` 节点带 `entry_files`（模块内导出最多的文件，最多 3 个）；
- 模块边由文件 import 聚合，带 `count` 和 `layers`。

### 5.2 符号层

现有 `symbolGraph` 扩展：

- 新增 `interface` / `type` / `method` / `route` 节点；
- `interface` 与 `type` 分开；`type` 带 `type_shape`；
- 方法节点 id：`file#Class.method`，`class_id` 指向类；
- 现有 `call/new/render/ref` 保留；
- 新增 `extends` / `implements` 边（从 AST 的 `HeritageClause` 提取，不再当 type 丢弃）；
- 新增 `route_handler` 边；
- 新增 `http` 边（见 5.3）；
- 方法节点默认 `collapsed: true`，类节点带 `method_count`；
- 不改变现有符号节点 id 规则；新增节点 id 保持稳定。

### 5.3 路由与 HTTP

- 扫后端 Hono 路由注册（`app/server/src/routes/*.ts`），提取 `http_method`、`http_path`、`handler_symbol`；
- 扫前端 `app/web/src/api/*.ts` 的 `fetch('/api/...')` 调用，提取调用点符号（函数名/文件/行）和路径；
- 去掉 `/api` 前缀后按 `method + path` 匹配；
- 生成 `http` 边：前端调用点 → route；
- 匹配不到的前端调用标 `unresolved`，不伪造边。

### 5.4 元数据

- `code_revision`：`git rev-parse HEAD` + dirty 标记；写入两份 JSON 和页面标题/详情；
- `generatedAt` 保留；
- 外部服务：先建 `external` 节点（Ollama/DeepSeek/Langfuse/ParadeDB/PostgreSQL/Redis），`external` 边可后置；
- `table` / `db` 边可后置，标记为 pending，不伪造。

## 6. 前端（template.html）要求

### 6.1 视图

代码图只有一个入口，没有模块/文件/符号模式切换：

- 同一张图里模块、文件、符号、方法可以共存；
- 语义缩放：`scale < 0.9` 只看模块；`0.9–1.35` 露出视口中心最近模块的文件；`1.35–2.15` 露出最近文件的符号；`> 2.15` 露出最近类的方法；
- 每层最多展开 48 个文件 / 8 个文件的符号 / 6 个类的方法，避免深缩放时全量铺开；
- `Wiki`：作为独立文档图入口保留现状（页面 + 时序图 + 引用跳转），不得回归。

目录不再作为独立节点，目录信息由文件路径承担，避免物理层级干扰依赖布局。

### 6.2 节点渲染

- 节点是 SVG path 形状，不用容器框：module 六边形、file 圆角方块、class 圆 + 外环、interface 菱形、type 三角、enum 方块、route 箭头形、function/method 小圆；
- 尺寸按层级分档：module 28–34 > file 12–15 > class/route 9–10 > interface/type 8 左右 > function 5–6.6 > method 3.4–4.8；
- 颜色按 kind；模块用层颜色；
- 外部/未解析：虚线轮廓；生成文件：虚线内环；
- 选中：白色外环 + 光晕；搜索：黄色外环；
- 依赖上下文：暗色节点 + 暗色标签。

### 6.3 展开、布局与相机

- 左栏“显示”树按 module → file → symbol → method 缩进；
- 点模块 = 该模块全部文件 + 这些文件的直接依赖（上下文节点）；点文件 = 该文件全部符号 + 直接依赖；点类 = 方法；搜索命中走同一路径；
- 显式展开不受缩放阈值限制；图上点 module/file/class 切换展开，其他符号只选中；
- 模块初始位置由 module/http 聚合边力导；新节点围绕父节点并偏向依赖锚点放置；已有节点坐标冻结，只对新增节点做局部力导；
- 相机：点模块不重置缩放/居中（目标在视口内时完全不动）；点文件/符号/类平滑放大到对应层级；滚轮/拖拽立即打断动画；
- 左栏点到视口外目标时平滑平移，不瞬间跳坐标；
- 展开状态存前端内存，不落库。

### 6.4 边渲染

按第 4 节线型；默认显示 `ref`，默认隐藏 `db`、`external`；提供过滤开关；深缩放时模块聚合边降权且不再显示聚合计数标签。

### 6.5 交互与详情

- 点击节点：高亮邻居，右侧详情；
- 详情显示：kind、qualified_name、file:line、module、出/入边（可点）、Wiki 引用（保留）；
- 文件节点：显示文件路径、行数、导出符号；
- 模块节点：显示模块层、路径、入口文件、包含文件；
- 搜索：按名称/路径/模块；
- 保留缩放/平移/拖拽、窄屏浮动详情。

## 7. 保留项

- Wiki 视图、示例时序图、`parseSequence`、Wiki 引用跳转全部保留；
- `doc-code-graph.md` 中的文档四遍流程、页面类型、逐层解析规则不在本次改动范围；
- 不修改 `app/` 下任何项目源码。

## 8. 非目标

- 不做运行图/trace；
- 不做增量构建，全量重跑；
- 不做 db/external 边的完整实现（可留 TODO）；
- 不新增图数据库或后端服务。

## 9. 验收

1. `node _Agents/dependency-graph/analyze.mjs` 成功，生成 `index.html` 和 `data/*.json`；
2. 代码图一个入口，模块/文件/符号/方法同一张图共存，Wiki 文档图无控制台异常；
3. 初始只显示模块；放大依次出现文件、符号、方法，缩小反向收起；
4. 左栏点模块摊开全部文件与直接依赖；点文件摊开全部符号与直接依赖；搜索命中同样成立；
5. 点模块相机 scale/tx/ty 不变，已有节点坐标不变；点在视口外的左栏目标只平滑平移；
6. 点文件/符号/类有平滑放大动画，滚轮/拖拽可打断；
7. 节点尺寸满足 module > file > class/interface/route > function/method；
8. 模块图存在 `web -> routes` 的 HTTP 聚合边；
9. interface 与 type 是两种节点；type 带 `type_shape`；extends/implements、route/route_handler 边存在；
10. http 边至少匹配到一条真实前后端路由（如 `POST /chat`），未匹配的标 unresolved；
11. Wiki 时序图仍可点击跳到符号；窄屏（900px）详情可见。

## 10. 实施顺序

1. **Build 1**：`module-map.json` + 模块/文件/符号数据（interface/type/method 节点、extends/implements、code_revision）；
2. **Build 2**：前端一张图三粒度、点节点、折叠/展开、边样式、详情；
3. **Build 3**：route/route_handler/http 边 + 回归 Wiki 视图 + 截图验证。

每个 Build 结束都必须重新生成 `index.html` 并用无头浏览器验证，不通过不进入下一个 Build。
