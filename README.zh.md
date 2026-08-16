# dsh-mobile

DSH Web 壳层的移动端适配插件 —— 一个客户端 Cordis 插件,为桌面优先的壳层补上手机档(< 768px):侧边栏/详情抽屉浮层化(带遮罩)、composer 底行不重叠、设置弹窗重排。桌面(≥ 1024px)零改动。

- 📋 详细实施方案:[docs/dsh-mobile-plan.md](docs/dsh-mobile-plan.md)
- 📐 M1 冻结规格:[docs/impl-m1.md](docs/impl-m1.md)
- 🔧 工程规约:[docs/development.md](docs/development.md)

## 背景

DSH 壳层核心布局包(`dsh-client-ui-layout` / `dsh-client-ui-conversation` / `dsh-client-ui-settings-general`)没有任何宽度媒体查询;1024px 以下侧栏只会自动收起成窄栏。手机上展开抽屉会把主区挤到 ~105px、composer 模式按钮互相覆盖、设置弹窗内容列只剩 157px。本插件补上缺失的手机档,不需要 fork 壳层。

## 安装

```bash
# 发布态(装进 dsh profile,与其他 bundle 同级)
dsh plugin --profile web add ./tecfancy-dsh-mobile-0.1.0.tgz
# 开发态
npm run watch
dsh web --patch ./cordis.yml
```

`dsh plugin` 会自动把 `@tecfancy/dsh-mobile` 加进 `dsh.profile.bundles`,重启 `dsh web` 生效。

## 工作原理

- 断点层用 `innerWidth` 标记 `body[data-dsh-mobile]`(CSS 侧配对 `@media (max-width: 767px)`);
- MutationObserver 把 AppFrame 内联 `grid-template-columns` 的抽屉/详情状态映射到 `body[data-dsh-drawer]` / `body[data-dsh-details]`,让 CSS 感知面板开合;
- 选择器优先 `[data-slot]` 语义锚点与 `#root` 结构路径,哈希类名登记在 `src/client/selector-map.ts` 并按 DSH 版本钉住;
- 点外关闭通过壳层 `layout` 服务(`toggleSidebar` / `closeDetails`)实现。

## License

MIT
