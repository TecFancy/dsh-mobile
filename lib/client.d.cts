window.__ModuleLoader__.load({
  id: "@tecfancy/dsh-mobile",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
import { Context } from "@deepseek-ai/cordis";
//#region src/client/index.d.ts
declare const name = "dsh-mobile";
/**
 * Hard dependency on the shell layout face (provided by
 * @deepseek-ai/dsh-client-ui-layout): toggleSidebar/openDetails/closeDetails.
 */
declare const inject: readonly ["layout"];
declare function apply(ctx: Context): void;
//#endregion
export { apply, inject, name };

    return module.exports;
  }
});