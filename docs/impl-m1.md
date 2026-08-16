# impl-m1 — 可执行规格:断点核心 + 抽屉浮层(D1/D5)

> M1 的唯一权威规格。与 dsh-mobile-plan.md 冲突时,以本文为准。
> 执行 M1 前先读本文 §1(已验证事实),不得重新探索已冻结部分。

## 1. 已验证的环境事实(冻结,2026-08-16,DSH 0.1.0-rc.6)

- AppFrame 结构:`#root > [data-slot="root"] > div.pI_x6G_frame`(display:grid),子元素顺序:
  1. `.pI_x6G_sidebarCol`(内含 `[data-slot="sidebar"]`),收起宽 56px;
  2. `.pI_x6G_centerCol`(内含 `[data-slot="conversation"]`);
  3. `.pI_x6G_detailsCol`(内含 `[data-slot="details"]`),收起宽 0;
  4. `.pI_x6G_overlayLayer`(内含 `[data-slot="shell.overlay"]`)。
- 列宽状态**只**存在于 frame 内联样式:`grid-template-columns: 56px minmax(0px,1fr) 0px`(收起);抽屉展开为 `280px …`。无 data 属性/class 状态标记。
- 壳层断点:`SIDEBAR_AUTO_COLLAPSE = 1024`;核心布局包无宽度媒体查询。
- 客户端 `layout` 服务(由 `@deepseek-ai/dsh-client-ui-layout` 提供):`toggleSidebar(): void`、`openDetails(): void`、`closeDetails(): void`(Inspect 目录已核实)。
- 缺陷量化(复现基线,Playwright iPhone 15 / 393×659):
  - 抽屉开 → 主区 105px,hero 标题 26×192(竖排);
  - composer 底行 `uV2eYG_tools` 压至 13px,「访问模式」按钮被模型按钮完全覆盖;
  - 设置弹窗内容列 157px,选择器溢出右缘 49px。

## 2. 冻结决策

| #   | 决策       | 内容                                                                                                                                               |
| --- | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | 断点       | `NARROW_MAX_WIDTH = 768`,CSS 用 `@media (max-width: 767px)`                                                                                        |
| D2  | 状态桥     | MutationObserver 观察 frame `style` 属性;首轨 `>56px` ⇒ `body[data-dsh-drawer="open"]`,否则 `"rail"`;第三轨 `>0` ⇒ `body[data-dsh-details="open"]` |
| D3  | 抽屉几何   | 打开时轨道保持 `56px minmax(0,1fr) 0px !important`;sidebarCol 变 `position:fixed; left:0; top:0; bottom:0; width:min(280px,85vw); z-index:40`      |
| D4  | 遮罩       | frame `::after` 全屏 fixed,z-index 30,`background:var(--dsw-alias-bg-mask-1); backdrop-filter:var(--dsw-mask-blur)`;不注入 DOM 节点                |
| D5  | 点外关闭   | 文档级 click(capture),抽屉开且 target 不在 sidebarCol 内 ⇒ `ctx.layout.toggleSidebar()`;ESc 关闭为可选增强(不做为 DoD)                             |
| D6  | 优先级     | frame 网格列覆盖一律 `!important`(压过内联样式);其余规则不滥用                                                                                     |
| D7  | 动效       | 浮层展开用主题时长变量;`prefers-reduced-motion` 全关(已在 shell.css.ts 基础设施层)                                                                 |
| D8  | 作用域     | 每一条规则必须挂在 `body[data-dsh-mobile]` 之下;桌面路径禁止任何规则                                                                               |
| D9  | 日志       | 生命周期日志统一 `[dsh-mobile]` 前缀;禁止在热路径(observer 回调)打日志                                                                             |
| D10 | 生命周期   | 样式表、resize 订阅、MutationObserver、click 监听全部 ctx.effect 持有,disposer 完整回收                                                            |
| D11 | 选择器登记 | 使用任何哈希类名前,先写入 `src/client/selector-map.ts`(DSH 版本、用途、兜底方案);M1 仅登记 `uV2eYG_row/uV2eYG_tools/uV2eYG_trailing`(D2 用)        |
| D12 | 容错       | `ctx.get('layout')` 缺失(注入失败)时插件降级为纯 CSS 模式并 warn,不抛错                                                                            |

## 3. 文件蓝图

```
src/client/
├── breakpoints.ts        [已有] 断点 + 订阅
├── selector-map.ts       [新增] 哈希类名登记表(export const SELECTOR_MAP)
├── drawer-state.ts       [新增] 纯函数:parseGridState(styleText) → {rail, drawer, details}
│                          + observeFrameState(frame, cb) → disposer(MutationObserver)
├── shell.css.ts          [扩展] D1/D5 规则块(§2 决策的 CSS 落地)
└── index.ts              [扩展] 状态桥接线 + tap-outside(ctx.layout)
test: drawer-state.test.ts、selector-map.test.ts、breakpoints.test.ts[已有]
```

## 4. 测试矩阵

| 层   | 用例                                                                                                                        |
| ---- | --------------------------------------------------------------------------------------------------------------------------- |
| 单元 | `parseGridState('56px minmax(0px,1fr) 0px')` → rail;`'280px …'` → drawer open;`'… 360px'` → details open;畸形值 → rail 兜底 |
| 单元 | observeFrameState:style 变更触发回调、dispose 后不再触发                                                                    |
| E2E  | 390×844:开抽屉 → 主区宽 ≥ 334、hero 标题单行、遮罩可见、点遮罩关闭、点主内容关闭                                            |
| E2E  | 360×740 / 430×932:同上剧本                                                                                                  |
| E2E  | 768×1024:不激活(body 无 data-dsh-mobile),抽屉行为与壳层原状一致                                                             |
| E2E  | 1440×900:插件挂/不挂截图 diff 为零                                                                                          |
| 回归 | 与 dsh-better-sidebar 同时挂载:抽屉开合两插件叠加场景不重叠、不互遮                                                         |

## 5. DoD(完成定义)

- [x] `npm run verify` 全绿(15 tests:breakpoints / drawer-state / selector-map);
- [x] 360/390/430 三视口全剧本 Playwright 断言通过(`bash scripts/e2e-mobile.sh`);
- [x] 1440×900 零回归:mobile 属性不激活、侧栏保持 static、frame 内联样式不被改动;
- [x] selector-map 首版建立(M1 零哈希类;M2 登记 `uV2eYG_row/tools/trailing`);
- [x] M2 追加验证:设置弹窗重排(D3)、详情面板浮层(D4)、与 dsh-better-sidebar 共存挂载回归 —— 详见 `docs/handoff-m2.md`。

> 状态:2026-08-16 完成。M1 冻结决策全部落地;执行中发现并修复一处设计缺陷
> (fixed 抽屉脱离 grid 占位导致 center/details 左移 → 三列显式 `grid-column` 钉位)。
