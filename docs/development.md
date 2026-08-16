# development — 工程规约

本仓库的权威工程规约(借鉴 dsh-auth-gate,按本仓库规模裁剪)。冲突时以本文为准。

## 命令

```bash
npm install            # 依赖(registry 走本机 NPM_CONFIG_REGISTRY,见下方注意)
npm run build          # tsc → lib/(lib 是产物,提交 src 改动时一并提交 lib)
npm run watch          # 增量编译
npm run typecheck      # 类型检查
npm run lint           # eslint
npm run format:check   # prettier 校验
npm run test           # vitest(jsdom)
npm run verify         # format + lint + typecheck + test,提交前必须全绿
bash scripts/e2e-mobile.sh   # playwright-cli 视口矩阵冒烟(需运行中的 DSH 实例)
```

## 分支与提交

- `development` 为开发分支,`main` 只接受 merge;禁止直接提交 `main`(除非用户明确要求)。
- **PR 与提交信息一律使用英文**(包括 commit message 与 PR 标题/正文);`type: subject`,`type ∈ feat/fix/docs/style/refactor/perf/test/build/ci/chore/revert`。
- 未经用户要求不 commit、不 push;push 前 `npm run verify`。

## 代码规约

- 严格 TS(`strict`);相对导入带 `.ts` 后缀(编译期 `rewriteRelativeImportExtensions` 处理)。
- 客户端代码允许 `console.*`,但必须带 `[dsh-mobile]` 前缀;热路径(observer/resize 回调)禁止日志。
- 哈希类名选择器必须先登记 `src/client/selector-map.ts`(版本、用途、兜底),否则 eslint 视为违规(规则在 M1 落地时随文件启用)。
- 任何全局副作用(样式表、监听器、observer)必须挂在 `ctx.effect` 并返回完整 disposer —— 插件 stop/update 后不得残留。
- 所有 CSS 规则必须挂在 `body[data-dsh-mobile]` 守卫之下;桌面路径零接触。
- 单元测试显式 `import { describe, expect, it } from 'vitest'`,不依赖环境全局。

## 依赖注意

- 本机 `NPM_CONFIG_REGISTRY` 指向内部镜像;CI/新环境使用 `--registry=https://registry.npmjs.org/`(dsh-auth-gate 同款问题)。
- `lib/` 由 `npm run build` 生成,**随 src 同一次提交**(安装方直接从包内 lib 加载,不跑构建)。

## 验证一个改动的完整闭环

1. `npm run verify`;
2. `npm run build` 并确认 `lib/` 变更与 src 一致(git status 检查);
3. 移动端行为改动 → `bash scripts/e2e-mobile.sh`(对 `http://127.0.0.1:3080`);
4. 桌面回归 → 1440 视口截图与基线对比;
5. 挂载验证:开发态 `dsh web --patch ./cordis.yml`;发布态 `dsh plugin --profile <name> add ./dsh-mobile-x.y.z.tgz`。
