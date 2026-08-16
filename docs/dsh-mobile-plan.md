# dsh-mobile 实施方案

> DSH Web 壳层移动端适配插件 —— 详细实施方案
>
> 状态:Draft v0.1(2026-08-16) · 工程:`@tecfancy/dsh-mobile`(客户端 Cordis 插件,挂 profile bundle)
> 参考工程:`dsh-auth-gate`(工程化规范)、`dsh-deeptutor`(bundle 挂载范式)、`dsh-better-sidebar`(壳层级客户端插件先例)

---

## 1. 背景与调研结论

对运行实例 `http://127.0.0.1:3080`(DSH `0.1.0-rc.6`)以 iPhone 15 视口(393×659)实测 + 壳层 CSS 源码分析,结论如下。

### 1.1 实测缺陷(均有量化数据)

| 编号 | 缺陷                                                | 实测证据                                                                                                                     | 严重度                 |
| ---- | --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| D1   | 移动端打开侧边栏抽屉时,主内容区被**挤压**而非被覆盖 | 抽屉是静态 grid 列(280px),主区被压到 **105px**;新建会话首页标题变 26px 宽、192px 高,**一字一行竖排**                         | 🔴 高                  |
| D2   | 新建会话页 composer 底行按钮**重叠**                | 行容器 flex 无 wrap;工具组被压缩到 13px(内容 88px),「访问模式」按钮被模型按钮**完全覆盖**,点不到                             | 🔴 高                  |
| D3   | 设置弹窗内容列被挤压,控件溢出被裁                   | 弹窗固定 800px 设计、`max-width: calc(100vw-48px)`、导航列固定 188px;移动端内容列只剩 **157px**,选择器溢出弹窗右缘 49px 被裁 | 🟠 中                  |
| D4   | 详情面板(tool 详情)在移动端打开时同样挤压主区       | 与 D1 同一三栏 grid 机制,details 列为 grid 第 3 列                                                                           | 🟠 中(推断,待 M2 复测) |
| D5   | 抽屉打开时无遮罩,右侧露出的主内容仍可交互           | `elementFromPoint(350,300)` 命中主页面元素,无 scrim 元素                                                                     | 🟡 低                  |

### 1.2 根因

- 壳层核心布局包 **没有任何宽度媒体查询**:`dsh-client-ui-layout`(三栏框架)、`dsh-client-ui-conversation`(composer)、`dsh-client-ui-settings-general`(设置弹窗)均无 `@media (width…)`;全产品仅 8 条宽度查询,全部在叶子包(settings-models、plugin-inventory、trajectory、user-questions、workflow-run)。
- 三栏框架是 JS 驱动的 CSS Grid(内联 `grid-template-columns`),壳层自身只有 `SIDEBAR_AUTO_COLLAPSE = 1024`(窄于 1024 收起侧栏为 56px 窄栏),**没有「抽屉浮层化」这一档设计**。
- 桌面优先:一切"能用"是 1024px 收起 + 宽度硬塞的结果,手机档只是被压得更狠。

### 1.3 先例验证(方案可行性的依据)

`dsh-better-sidebar`(已装在本实例 profile)证明了两件事:

1. **第三方 npm 客户端插件可以做壳层级布局改造**:`package.json` 的 `dsh.client` 字段声明客户端入口 + `inject` 依赖包,`dsh.bundle.patch` 声明挂载行,profile `dsh.profile.bundles` 里加一行即挂载。
2. **稳定选择器模式**:壳层 DOM 大量带 `[data-slot="…"]` 语义锚点(`root`、`sidebar`、`conversation`、`conversation.composer.bar`、`details`、`shell.overlay` 等,已在本实例实测确认);better-sidebar 的全局 CSS 正是锚定 `#root > [data-slot="root"] > div` 结构路径 + `body[data-*]` 状态属性,而非哈希类名。它的 `NARROW_MAX_WIDTH = 768` 断点体系与本方案直接对齐。

---

## 2. 目标与非目标

### 2.1 目标

在 **< 768px** 视口(手机 / 竖屏平板)下:

1. 侧边栏抽屉与详情面板**浮层化**(fixed 定位 + 遮罩 + 点外关闭),主内容不再被挤压(D1/D4/D5);
2. 新建会话 hero 与 composer 底行**正常排版不重叠**,工具按钮全部可点(D2);
3. 设置弹窗**纵向重排**(导航横排可滚动,内容列全宽),控件不再溢出被裁(D3);
4. **≥ 1024px 桌面零回归**(本插件所有规则都挂在 `body[data-dsh-mobile]` + `@media` 守卫之下);
5. 与已装插件(`dsh-better-sidebar`、`dshmarket`)**共存不冲突**。

### 2.2 非目标

- 不改上游 `deepseek-ai/deepseek-harness` 源码(见 §9:验证稳定后另立 PR 反哺上游);
- 不做原生 App、不做 PWA 离线能力;
- 不重构 768–1023px 平板区间(维持壳层现状,M3 再评估);
- 不引入 UI 组件库依赖(M0–M2 纯 CSS + DOM,零 React)。

---

## 3. 总体方案

### 3.1 形态

一个 npm 客户端插件 **`@tecfancy/dsh-mobile`**,挂载在 profile 的 bundle 层,与 `dsh-deeptutor` / `dsh-better-sidebar` 同级:

```
dsh-mobile/
├── src/index.ts            宿主半体(占位,无服务无工具)
├── src/client/
│   ├── index.ts            客户端入口:注入样式表 + 状态桥
│   ├── breakpoints.ts      768 断点 + 订阅(纯函数,可单测)
│   ├── shell.css.ts        全局 CSS(全部挂 body[data-dsh-mobile] 守卫)
│   ├── selector-map.ts     M1:哈希类名登记表(版本钉住,巡检用)
│   └── *.test.ts           vitest 单测
├── cordis.yml              开发态挂载(--patch 指向 lib/client/index.js)
├── cordis.patch.yml        发布态挂载(按包名 insert)
└── docs/                   dsh-mobile-plan.md / impl-m1.md / development.md
```

### 3.2 运行时三层

```
┌─ 状态层(JS)──────────────┐
│ breakpoints: innerWidth   │──→ body[data-dsh-mobile]
│ MutationObserver: frame   │──→ body[data-dsh-drawer="rail|open"]
│   inline grid-template-   │    body[data-dsh-details="open"]
│   columns(实测:56px↔280px)│
│ tap-outside → layout      │──→ ctx.layout.toggleSidebar()
│   service(注入依赖)        │    / openDetails / closeDetails
└──────────┬───────────────┘
┌─ 样式层(CSS)──────────────┐
│ 全部规则:@media           │   D1/D4 浮层 + ::after 遮罩 + 安全区
│ (max-width:767px) 且      │   D2 composer 换行/不收缩
│ body[data-dsh-mobile]     │   D3 设置弹窗重排
│ 作用域下,桌面零接触        │
└──────────────────────────┘
```

关键机制说明:

- **抽屉态如何被 CSS 感知**:框架状态只存在于内联样式(`grid-template-columns: 56px …` ↔ `280px …`,已实测)。JS 用 `MutationObserver` 观察 frame 的 style 属性,把状态映射为 body 属性;CSS 只认属性,不认内联样式。
- **`!important` 战内联**:内联样式优先级高于样式表,但低于带 `!important` 的样式表规则。移动档需要把 frame 网格列强制为 `56px minmax(0,1fr) 0px !important`,让抽屉(fixed 定位、脱离文档流)不占网格轨道。
- **遮罩用 `::after` 伪元素**:不给产品 DOM 注入新节点,frame 的 `::after` 在抽屉开时渲染全屏 scrim;`[data-slot="shell.overlay"]`(实测存在)作为备用挂载点。
- **所有副作用随 fiber 回收**:样式表节点、resize 监听、MutationObserver、点击监听全部经 `ctx.effect` 注册 disposer,插件 stop/update 即清理(对齐 dsh-auth-gate 的生命周期纪律)。

### 3.3 服务依赖

- 客户端 `inject: ['layout']`(由 `@deepseek-ai/dsh-client-ui-layout` 提供,接口已核实:`toggleSidebar() / openDetails() / closeDetails()`);
- 包级 `dsh.client.inject`: `@deepseek-ai/dsh-client-runtime` + `@deepseek-ai/dsh-client-ui-layout`;
- 颜色/圆角/遮罩全部使用现有主题变量(`--dsw-alias-bg-mask-1`、`--dsw-mask-blur`、`--dsw-shadow-lv3` 等,取自设置弹窗实测 CSS),自动适配明暗主题。

---

## 4. 断点与选择器策略

### 4.1 断点

- `NARROW_MAX_WIDTH = 768`(与 dsh-better-sidebar 一致);CSS 侧 `@media (max-width: 767px)`。
- 768–1023px 不动(壳层自己的 1024 自动收起继续生效)。
- `prefers-reduced-motion` 下强制关闭过渡/动画。

### 4.2 选择器优先级(硬性规约)

1. **`[data-slot]` 锚点**(已实测存在:`root`、`sidebar`、`conversation`、`conversation.composer.bar`、`conversation.input.left/right/model`、`details`、`shell.overlay`、`settings.trigger`、`sidebar.settings`);
2. **#root 结构路径**(AppFrame 网格,与 better-sidebar 使用同一路径,已实测:`#root > [data-slot="root"] > div`,子元素依次为 sidebarCol / centerCol / detailsCol / overlayLayer);
3. **哈希类名兜底**(如 `uV2eYG_row`/`uV2eYG_tools`、`VOzbGW_panel`)——**必须登记进 `src/client/selector-map.ts`**(含 DSH 版本、用途、替代方案),CI 用 Playwright 探针校验登记表与实际 DOM 一致性,版本升级时逐一复核。

---

## 5. 缺陷 → 修复映射(核心设计)

> 每条都含:根因 / 锚点 / 修复要点 / 验收标准。M1/M2 执行时以 `docs/impl-m1.md` 冻结规格为准。

### D1 + D5:抽屉浮层化 + 遮罩 + 点外关闭

- **根因**:三栏 grid 内联列宽由 JS 控制,抽屉是普通轨道(280px),窄屏挤压 center 列。
- **CSS 锚点**:`#root > [data-slot="root"] > div`(frame)、其 `> div:nth-child(1)`(sidebarCol)。
- **修复**:
  ```css
  @media (max-width: 767px) {
    body[data-dsh-mobile] #root > [data-slot='root'] > div {
      grid-template-columns: 56px minmax(0, 1fr) 0px !important;
    }
    body[data-dsh-mobile][data-dsh-drawer='open'] #root > [data-slot='root'] > div {
      grid-template-columns: 56px minmax(0, 1fr) 0px !important; /* 轨道不变,靠 fixed 浮层 */
    }
    body[data-dsh-mobile][data-dsh-drawer='open']
      #root
      > [data-slot='root']
      > div
      > div:nth-child(1) {
      position: fixed;
      left: 0;
      top: 0;
      bottom: 0;
      width: min(280px, 85vw);
      z-index: 40;
      box-shadow: var(--dsw-shadow-lv3);
    }
    body[data-dsh-mobile][data-dsh-drawer='open'] #root > [data-slot='root'] > div::after {
      content: '';
      position: fixed;
      inset: 0;
      z-index: 30;
      background: var(--dsw-alias-bg-mask-1);
      backdrop-filter: var(--dsw-mask-blur);
    }
  }
  ```
  设计取舍:抽屉打开时**保留 56px 窄栏轨道**,抽屉 fixed 覆盖在其上——窄栏上的「展开侧边栏」按钮保持可见可用,布局零跳动。
- **行为**:文档级 click 监听,抽屉开且点击落在 sidebarCol 之外 → `ctx.layout.toggleSidebar()` 关闭(M1 确认点击遮罩与点击主内容两处均关闭)。
- **验收**:390px 视口开抽屉,主区仍 ≥ 334px,标题单行,遮罩可见,点遮罩关闭;桌面 1440px 行为与基线完全一致。

### D2:composer 底行防重叠

- **根因**:`uV2eYG_row` flex 无 wrap;`uV2eYG_tools` 可收缩且无 min-width(被压到 13px);`uV2eYG_trailing` `flex:none` 反而顶住。
- **锚点**:`[data-slot="conversation.composer.bar"]`(作用域)+ 登记类名 `.uV2eYG_row/.uV2eYG_tools/.uV2eYG_trailing`。
- **修复**:窄档下 `row { flex-wrap: wrap }`、`tools { flex: 1 1 auto; min-width: 0 }`(或按 M1 实测取「工具组换行到第二行」方案)、`trailing` 收缩并允许模型按钮 `max-width + ellipsis`;hero 态(`conversation.hero.workspace`)同规则覆盖。
- **验收**:390px 下 5 个控件两两零重叠(Playwright 断言 boundingBox 无交叠),全部可点击;「访问模式」完整可见。

### D3:设置弹窗重排

- **根因**:`VOzbGW_panel` 固定 `width:800px; max-width:calc(100vw-48px)`,nav 列 `width:188px; flex:none`,无断点。
- **锚点**:`[role="dialog"]`(语义锚点,实测存在)+ 登记类名 `VOzbGW_panel/nav/navList/navCell/content/options`。
- **修复**:窄档下 `panel { flex-direction: column }`;`nav { width:100%; flex-direction:row; overflow-x:auto }`、`navTitle` 隐藏、`navList { flex-direction:row }`;`content/options { width:100%; min-width:0 }`;选择器控件 `max-width:100%`。
- **验收**:345px 弹窗下内容列 ≥ 300px,「Workspace Write」选择器完整在弹窗内(不溢出 48px 安全边距);六个导航项可横向滚动触达;1440px 桌面布局与基线一致。

### D4:详情面板浮层化

- 与 D1 同机制:nth-child(3) 固定右侧 `width: min(360px, 90vw)`,`body[data-dsh-details="open"]` 态下生效;关闭走 `ctx.layout.closeDetails()`。M2 实现并复测(先复现:移动端点工具行 → 观察 details 列行为,确认与 D1 同源后按同策略处理)。

---

## 6. 里程碑

| 里程碑                        | 内容                                                                                                                                                  | 产出                                    | 估时   |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- | ------ |
| **M0 脚手架与挂载验证**       | 本工程创建;`npm run verify` 全绿;bundle 挂载链路 spike(`dsh plugin` 安装到 profile web 或 `--patch` 开发挂载);确认 `body[data-dsh-mobile]` 随视口切换 | 可挂载空壳插件                          | 0.5–1d |
| **M1 断点核心 + 抽屉浮层**    | selector-map 登记;D1/D5 全量(状态观察、CSS、点外关闭);Playwright 视口矩阵 e2e(360/390/430/768/1440)                                                   | `docs/impl-m1.md` 冻结规格 + D1/D5 上线 | 2d     |
| **M2 composer + 设置 + 详情** | D2/D3/D4;与 `dsh-better-sidebar`/`dshmarket` 共存回归                                                                                                 | D2–D4 上线 + 回归报告                   | 2–3d   |
| **M3 打磨与发布**             | 768–1023 平板区间评估;safe-area 适配;i18n(如加设置开关则随 locale);README/发布;tgz + 安装指引                                                         | 发布 `dsh-mobile@0.1.0`                 | 1–2d   |
| **M4(独立)**                  | 把验证稳定的 CSS 整理为 `deepseek-ai/deepseek-harness` 上游 PR(修 `dsh-client-ui-layout/conversation/settings-general` 的断点)                        | 上游 PR(可选)                           | 另立   |

每个里程碑遵循 dsh-auth-gate 的范式:**冻结可执行规格(impl-\*.md)→ 实现 → 验收矩阵 → handoff 文档**。

---

## 7. 测试策略与验收矩阵

### 7.1 单元(vitest + jsdom)

- `breakpoints`:断点分类、订阅/退订、边界 767/768;
- `selector-map` 完整性校验;状态映射纯函数(内联 grid-template-columns 值 → 抽屉态)。

### 7.2 E2E(playwright-cli,`scripts/e2e-mobile.sh` 扩展)

视口矩阵:`360×740` / `390×844` / `430×932` / `768×1024` / `1440×900`。

每个移动视口固定剧本:

1. 新建会话首页:标题单行、composer 无重叠(bbox 交叠断言)、无横向滚动;
2. 打开抽屉:主区不被挤压、遮罩可见、点外关闭;
3. 打开设置:内容列宽度断言、选择器不溢出、六个导航项可达;
4. 会话页:composer 底行、turn 状态条、详情面板开合;
5. 桌面 1440:与基线截图 diff 为零(插件挂与不挂对比)。

### 7.3 回归红线

- 桌面 1440/1024 行为零变化(所有规则挂 `body[data-dsh-mobile]` 守卫,理论零风险,仍需截图验证);
- 与 `dsh-better-sidebar`(它用 `#root` margin 推挤方案,我们用 fixed 浮层,理论上正交——M2 必须实测两种方案叠加场景)、`dshmarket` 共存。

---

## 8. 风险与对策

| 风险                                        | 影响             | 对策                                                                                                     |
| ------------------------------------------- | ---------------- | -------------------------------------------------------------------------------------------------------- |
| 壳层升级后哈希类名漂移                      | CSS 失效或误伤   | 90% 规则用 `[data-slot]`/结构路径;哈希类名全量登记 selector-map 并按 DSH 版本钉住;CI 探针巡检            |
| 内联 `grid-template-columns` 抢优先级       | 修复不生效       | `!important` 样式表规则(已验证优先于非 important 内联)                                                   |
| 与 dsh-better-sidebar 的 #root 布局叠加冲突 | 双重推挤/遮挡    | 方案正交(它改 margin、我们改 grid+fixed);M2 联调实测,必要时限定同时激活时的行为                          |
| 壳层行为变化(如抽屉态不再走内联样式)        | 状态桥失效       | 状态观察做成纯函数 + 单测;备选信号源:`layout` service 或 Client Event(M1 查证 Event 目录后作为 fallback) |
| 本会话审批策略 `never`(动态插件通道)        | 动态原型无法激活 | 本方案走 **npm bundle 通道**,不需要会话审批;M0 只做挂载验证                                              |
| jsdom 无 matchMedia                         | 单测受限         | 断点订阅只用 innerWidth + resize(与 better-sidebar 同取舍)                                               |

---

## 9. 发布与安装

```bash
# 开发态(本机)
npm run watch                          # 增量编译到 lib/
dsh web --patch ./cordis.yml           # 挂载 lib/client/index.js(与 deeptutor 开发范式一致)

# 发布态
npm pack                               # tecfancy-dsh-mobile-0.1.0.tgz
# 方式一:安装到 profile(与 dsh-deeptutor / dsh-better-sidebar 同通道)
dsh plugin --profile web add ./tecfancy-dsh-mobile-0.1.0.tgz
# 方式二:直接改 profile package.json + cordis.patch.yml insert 行
```

安装后 `dsh.profile.bundles` 增加 `@tecfancy/dsh-mobile`,重启 `dsh web` 生效;卸载时删除 bundle 行即可,无残留。

## 10. 与上游的关系(长期)

本插件是**适配层原型**:规则全部集中在 `shell.css.ts`,每条注释标注修复的壳层包与断点缺失原因。M3 稳定后,把同一批媒体查询移植回 `deepseek-ai/deepseek-harness` 的 `dsh-client-ui-layout` / `dsh-client-ui-conversation` / `dsh-client-ui-settings-general` 三个包(仓库已确认公开),发 PR 让所有实例受益;本插件届时退化为「上游未合入期间的补丁」,或直接退役。

## 11. 交付物与 DoD

- 可挂载 npm 插件 `@tecfancy/dsh-mobile`(host 半体 + client 半体,`npm run verify` 全绿);
- D1–D5 全部修复且在 360/390/430 视口实测通过,桌面 1440 零回归;
- `docs/impl-m1.md`(冻结规格)、`docs/development.md`(工程规约)、`docs/handoff-m2.md`(交接);
- selector-map 登记表 + CI 探针脚本;
- README(中英)+ 安装指引 + tgz 产物。
