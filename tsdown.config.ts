/**
 * tsdown config for the client half.
 *
 * The DSH browser client module system loads each plugin as ONE classic
 * script that registers itself via `window.__ModuleLoader__.load({ id,
 * factory })`. The factory is CJS-shaped (`(require) => { … }`), so the
 * bundle must be CJS with the exact wrapper every official client package
 * ships (see @deepseek-ai/dsh-client-ui-layout/lib/client.js). Externals are
 * resolved through the loader-provided `require` (module table); this plugin
 * currently has no runtime externals, so the bundle is fully self-contained.
 *
 * The host half (src/index.ts) is emitted separately by `tsc` (tsconfig.build.json)
 * as a normal Node ESM module.
 */
import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: { client: 'src/client/index.ts' },
  format: ['cjs'],
  platform: 'browser',
  outDir: 'lib',
  dts: true,
  banner: `window.__ModuleLoader__.load({
  id: "@tecfancy/dsh-mobile",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;`,
  footer: `
    return module.exports;
  }
});`,
})
