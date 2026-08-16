# handoff-m2 — M1/M2 实施交接(2026-08-16)

> 给后续会话的环境事实与踩坑记录。新会话无先前上下文,执行任何后续工作(M3
> 打磨、上游 PR、live profile 安装)前先读本文。

## 1. 环境事实(实测)

- **DSH 版本**:`0.1.0-rc.6`(npm 全局安装:`/Users/randal/.volta/tools/image/node/24.13.1/lib/node_modules/@deepseek-ai/dsh`)。
- **线上实例**:`dsh web` 运行于 `http://127.0.0.1:3080`(profile `web`,bundle:`@deepseek-ai/dsh-base`、`@deepseek-ai/dsh-web-app`、`dsh-deeptutor`、`dshmarket`、`dsh-better-sidebar`)。**不要随意重启线上实例**(会中断正在进行的会话)。
- **验证实例(scratch)**:`DSH_HOME=/tmp/dsh-mobile-m0 dsh web --port 3091` —— 隔离环境,可随意重启;profile `web` 已装 `dsh-mobile` + `dsh-better-sidebar`;settings.yaml 从 `~/.dsh/settings.yaml` 复制(无 OPENCODE_GO_API_KEY 环境变量 → composer 无模型按钮,需注入模拟按钮复现 D2)。
- **客户端插件发现机制**:host 加载包的 `main`;`dsh-client-modules` 扫 Loader 条目里 `package.json` 的 `dsh.client` 声明 → 服务 `exports["./client"]` 指向的**单文件 bundle**;bundle 必须是 `window.__ModuleLoader__.load({id, factory})` CJS 包装(官方包同款)。`dsh plugin add` 后**必须重启服务**才进客户端模块表。

## 2. 关键决策与踩坑

| #   | 坑 / 决策                                    | 结论                                                                                                                                |
| --- | -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| 1   | 客户端产物必须单文件                         | 多文件 ESM 走不通;`tsdown` `format:['cjs']` + banner/footer 包装;footer 必须 `return module.exports`(loader 取 factory 返回值)      |
| 2   | tsdown 会清空 outDir                         | `build = rm -rf lib && tsdown && tsc`(tsc 最后跑,补宿主半体)                                                                        |
| 3   | `position:fixed` 让 grid item 脱离占位       | auto-placement 会把 center/details 左移进 1/2 轨 → 三列显式 `grid-column: 1/2/3` 钉位(已在 D1 规则内)                               |
| 4   | 内联样式 vs CSS                              | 覆盖 frame 网格必须 `!important`(样式表 !important > 非 important 内联)                                                             |
| 5   | playwright-cli `--raw eval` 输出是 JSON 编码 | 字符串结果带引号、JSON.stringify 结果被二次编码 → 探测 JS 直接返回对象字面量;断言 grep 需容忍 `"key": value` 空格                   |
| 6   | 移动端验证用 scratch 而非线上                | 线上实例不能挂插件(需重启);scratch 无模型按钮时注入模拟按钮测 D2 布局                                                               |
| 7   | better-sidebar 共存                          | 它挂 `body[data-dsh-sidebar-*]` 属性 + `#root` margin-right 推挤;与我们的 frame 网格 + 左抽屉正交,实测共存无冲突;它需会话才展开面板 |
| 8   | 冷启动时序                                   | e2e 脚本必须轮询 `body[data-dsh-mobile]` 就绪再断言;残留会话会污染结果(脚本开头 close 清理)                                         |

## 3. 已完成(可复现)

- `npm run verify` 全绿;`bash scripts/e2e-mobile.sh http://127.0.0.1:3091 <prefix>` 全矩阵通过:
  - 360/390/430:初始态无横向滚动;抽屉 fixed 浮层(≤281px)+ 遮罩 + 主区 ≥ 75% 宽;点外关闭;设置弹窗 nav 横排、内容列全宽;详情列 fixed 浮层、主区不挤;
  - 768:不激活;1440:零回归(无 mobile 属性、侧栏 static、frame 内联样式原样)。

## 4. 后续入口

1. **live profile 安装**:`npm pack` → `dsh plugin --profile web add ./dsh-mobile-0.1.0.tgz` → 重启线上实例(需用户确认时机);或先手动改 `~/.dsh/profiles/web/package.json` 的 bundles 列表。
2. **M3 剩余**:平板 768–1023 区间评估(当前不激活,维持壳层原状,符合计划);safe-area 适配(刘海屏 `env(safe-area-inset-*)` 未做);设置页开关(如需要则引入 React + settings.section,需把 react 加入 external)。
3. **M4 上游回馈**:把 `src/client/shell.css.ts` 各缺陷块按注释标注的壳层包移植到 `deepseek-ai/deepseek-harness`(仓库公开,`packages/client/ui-layout`、`ui-conversation`、`settings-general`),PR 前按 selector-map 版本核对。
