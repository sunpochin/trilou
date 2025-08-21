import { hasInjectionContext, getCurrentInstance, defineComponent, createElementBlock, shallowRef, provide, cloneVNode, h, ref, useSSRContext, createApp, mergeProps, unref, computed, withCtx, createBlock, openBlock, Fragment, renderList, createVNode, watch, nextTick, toRef, onErrorCaptured, onServerPrefetch, resolveDynamicComponent, shallowReactive, reactive, effectScope, isReadonly, isRef, isShallow, isReactive, toRaw, readonly, inject, defineAsyncComponent, getCurrentScope } from 'vue';
import { m as hasProtocol, n as isScriptProtocol, o as joinURL, w as withQuery, p as sanitizeStatusCode, q as getContext, $ as $fetch$1, t as createHooks, c as createError$1, v as isEqual, x as stringifyParsedURL, y as stringifyQuery, z as parseQuery, A as toRouteMatcher, B as createRouter, C as defu } from '../nitro/nitro.mjs';
import { b as baseURL } from '../routes/renderer.mjs';
import { defineStore, createPinia, setActivePinia, storeToRefs, shouldHydrate } from 'pinia';
import { ssrRenderAttrs, ssrInterpolate, ssrRenderClass, ssrRenderAttr, ssrRenderComponent, ssrRenderList, ssrIncludeBooleanAttr, ssrRenderSuspense, ssrRenderVNode } from 'vue/server-renderer';
import { VueDraggableNext } from 'vue-draggable-next';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'vue-bundle-renderer/runtime';
import 'unhead/server';
import 'devalue';
import 'unhead/utils';
import 'unhead/plugins';

if (!globalThis.$fetch) {
  globalThis.$fetch = $fetch$1.create({
    baseURL: baseURL()
  });
}
if (!("global" in globalThis)) {
  globalThis.global = globalThis;
}
const nuxtLinkDefaults = { "componentName": "NuxtLink" };
const appId = "nuxt-app";
function getNuxtAppCtx(id = appId) {
  return getContext(id, {
    asyncContext: false
  });
}
const NuxtPluginIndicator = "__nuxt_plugin";
function createNuxtApp(options) {
  let hydratingCount = 0;
  const nuxtApp = {
    _id: options.id || appId || "nuxt-app",
    _scope: effectScope(),
    provide: void 0,
    globalName: "nuxt",
    versions: {
      get nuxt() {
        return "3.18.1";
      },
      get vue() {
        return nuxtApp.vueApp.version;
      }
    },
    payload: shallowReactive({
      ...options.ssrContext?.payload || {},
      data: shallowReactive({}),
      state: reactive({}),
      once: /* @__PURE__ */ new Set(),
      _errors: shallowReactive({})
    }),
    static: {
      data: {}
    },
    runWithContext(fn) {
      if (nuxtApp._scope.active && !getCurrentScope()) {
        return nuxtApp._scope.run(() => callWithNuxt(nuxtApp, fn));
      }
      return callWithNuxt(nuxtApp, fn);
    },
    isHydrating: false,
    deferHydration() {
      if (!nuxtApp.isHydrating) {
        return () => {
        };
      }
      hydratingCount++;
      let called = false;
      return () => {
        if (called) {
          return;
        }
        called = true;
        hydratingCount--;
        if (hydratingCount === 0) {
          nuxtApp.isHydrating = false;
          return nuxtApp.callHook("app:suspense:resolve");
        }
      };
    },
    _asyncDataPromises: {},
    _asyncData: shallowReactive({}),
    _payloadRevivers: {},
    ...options
  };
  {
    nuxtApp.payload.serverRendered = true;
  }
  if (nuxtApp.ssrContext) {
    nuxtApp.payload.path = nuxtApp.ssrContext.url;
    nuxtApp.ssrContext.nuxt = nuxtApp;
    nuxtApp.ssrContext.payload = nuxtApp.payload;
    nuxtApp.ssrContext.config = {
      public: nuxtApp.ssrContext.runtimeConfig.public,
      app: nuxtApp.ssrContext.runtimeConfig.app
    };
  }
  nuxtApp.hooks = createHooks();
  nuxtApp.hook = nuxtApp.hooks.hook;
  {
    const contextCaller = async function(hooks, args) {
      for (const hook of hooks) {
        await nuxtApp.runWithContext(() => hook(...args));
      }
    };
    nuxtApp.hooks.callHook = (name, ...args) => nuxtApp.hooks.callHookWith(contextCaller, name, ...args);
  }
  nuxtApp.callHook = nuxtApp.hooks.callHook;
  nuxtApp.provide = (name, value) => {
    const $name = "$" + name;
    defineGetter(nuxtApp, $name, value);
    defineGetter(nuxtApp.vueApp.config.globalProperties, $name, value);
  };
  defineGetter(nuxtApp.vueApp, "$nuxt", nuxtApp);
  defineGetter(nuxtApp.vueApp.config.globalProperties, "$nuxt", nuxtApp);
  const runtimeConfig = options.ssrContext.runtimeConfig;
  nuxtApp.provide("config", runtimeConfig);
  return nuxtApp;
}
function registerPluginHooks(nuxtApp, plugin2) {
  if (plugin2.hooks) {
    nuxtApp.hooks.addHooks(plugin2.hooks);
  }
}
async function applyPlugin(nuxtApp, plugin2) {
  if (typeof plugin2 === "function") {
    const { provide: provide2 } = await nuxtApp.runWithContext(() => plugin2(nuxtApp)) || {};
    if (provide2 && typeof provide2 === "object") {
      for (const key in provide2) {
        nuxtApp.provide(key, provide2[key]);
      }
    }
  }
}
async function applyPlugins(nuxtApp, plugins2) {
  const resolvedPlugins = /* @__PURE__ */ new Set();
  const unresolvedPlugins = [];
  const parallels = [];
  let error = void 0;
  let promiseDepth = 0;
  async function executePlugin(plugin2) {
    const unresolvedPluginsForThisPlugin = plugin2.dependsOn?.filter((name) => plugins2.some((p) => p._name === name) && !resolvedPlugins.has(name)) ?? [];
    if (unresolvedPluginsForThisPlugin.length > 0) {
      unresolvedPlugins.push([new Set(unresolvedPluginsForThisPlugin), plugin2]);
    } else {
      const promise = applyPlugin(nuxtApp, plugin2).then(async () => {
        if (plugin2._name) {
          resolvedPlugins.add(plugin2._name);
          await Promise.all(unresolvedPlugins.map(async ([dependsOn, unexecutedPlugin]) => {
            if (dependsOn.has(plugin2._name)) {
              dependsOn.delete(plugin2._name);
              if (dependsOn.size === 0) {
                promiseDepth++;
                await executePlugin(unexecutedPlugin);
              }
            }
          }));
        }
      }).catch((e) => {
        if (!plugin2.parallel && !nuxtApp.payload.error) {
          throw e;
        }
        error ||= e;
      });
      if (plugin2.parallel) {
        parallels.push(promise);
      } else {
        await promise;
      }
    }
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    registerPluginHooks(nuxtApp, plugin2);
  }
  for (const plugin2 of plugins2) {
    if (nuxtApp.ssrContext?.islandContext && plugin2.env?.islands === false) {
      continue;
    }
    await executePlugin(plugin2);
  }
  await Promise.all(parallels);
  if (promiseDepth) {
    for (let i = 0; i < promiseDepth; i++) {
      await Promise.all(parallels);
    }
  }
  if (error) {
    throw nuxtApp.payload.error || error;
  }
}
// @__NO_SIDE_EFFECTS__
function defineNuxtPlugin(plugin2) {
  if (typeof plugin2 === "function") {
    return plugin2;
  }
  const _name = plugin2._name || plugin2.name;
  delete plugin2.name;
  return Object.assign(plugin2.setup || (() => {
  }), plugin2, { [NuxtPluginIndicator]: true, _name });
}
const definePayloadPlugin = defineNuxtPlugin;
function callWithNuxt(nuxt, setup, args) {
  const fn = () => setup();
  const nuxtAppCtx = getNuxtAppCtx(nuxt._id);
  {
    return nuxt.vueApp.runWithContext(() => nuxtAppCtx.callAsync(nuxt, fn));
  }
}
function tryUseNuxtApp(id) {
  let nuxtAppInstance;
  if (hasInjectionContext()) {
    nuxtAppInstance = getCurrentInstance()?.appContext.app.$nuxt;
  }
  nuxtAppInstance ||= getNuxtAppCtx(id).tryUse();
  return nuxtAppInstance || null;
}
function useNuxtApp(id) {
  const nuxtAppInstance = tryUseNuxtApp(id);
  if (!nuxtAppInstance) {
    {
      throw new Error("[nuxt] instance unavailable");
    }
  }
  return nuxtAppInstance;
}
// @__NO_SIDE_EFFECTS__
function useRuntimeConfig(_event) {
  return useNuxtApp().$config;
}
function defineGetter(obj, key, val) {
  Object.defineProperty(obj, key, { get: () => val });
}
const PageRouteSymbol = Symbol("route");
const useRouter = () => {
  return useNuxtApp()?.$router;
};
const useRoute = () => {
  if (hasInjectionContext()) {
    return inject(PageRouteSymbol, useNuxtApp()._route);
  }
  return useNuxtApp()._route;
};
// @__NO_SIDE_EFFECTS__
function defineNuxtRouteMiddleware(middleware) {
  return middleware;
}
const isProcessingMiddleware = () => {
  try {
    if (useNuxtApp()._processingMiddleware) {
      return true;
    }
  } catch {
    return false;
  }
  return false;
};
const URL_QUOTE_RE = /"/g;
const navigateTo = (to, options) => {
  to ||= "/";
  const toPath = typeof to === "string" ? to : "path" in to ? resolveRouteObject(to) : useRouter().resolve(to).href;
  const isExternalHost = hasProtocol(toPath, { acceptRelative: true });
  const isExternal = options?.external || isExternalHost;
  if (isExternal) {
    if (!options?.external) {
      throw new Error("Navigating to an external URL is not allowed by default. Use `navigateTo(url, { external: true })`.");
    }
    const { protocol } = new URL(toPath, "http://localhost");
    if (protocol && isScriptProtocol(protocol)) {
      throw new Error(`Cannot navigate to a URL with '${protocol}' protocol.`);
    }
  }
  const inMiddleware = isProcessingMiddleware();
  const router = useRouter();
  const nuxtApp = useNuxtApp();
  {
    if (nuxtApp.ssrContext) {
      const fullPath = typeof to === "string" || isExternal ? toPath : router.resolve(to).fullPath || "/";
      const location2 = isExternal ? toPath : joinURL((/* @__PURE__ */ useRuntimeConfig()).app.baseURL, fullPath);
      const redirect = async function(response) {
        await nuxtApp.callHook("app:redirected");
        const encodedLoc = location2.replace(URL_QUOTE_RE, "%22");
        const encodedHeader = encodeURL(location2, isExternalHost);
        nuxtApp.ssrContext._renderResponse = {
          statusCode: sanitizeStatusCode(options?.redirectCode || 302, 302),
          body: `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0; url=${encodedLoc}"></head></html>`,
          headers: { location: encodedHeader }
        };
        return response;
      };
      if (!isExternal && inMiddleware) {
        router.afterEach((final) => final.fullPath === fullPath ? redirect(false) : void 0);
        return to;
      }
      return redirect(!inMiddleware ? void 0 : (
        /* abort route navigation */
        false
      ));
    }
  }
  if (isExternal) {
    nuxtApp._scope.stop();
    if (options?.replace) {
      (void 0).replace(toPath);
    } else {
      (void 0).href = toPath;
    }
    if (inMiddleware) {
      if (!nuxtApp.isHydrating) {
        return false;
      }
      return new Promise(() => {
      });
    }
    return Promise.resolve();
  }
  return options?.replace ? router.replace(to) : router.push(to);
};
function resolveRouteObject(to) {
  return withQuery(to.path || "", to.query || {}) + (to.hash || "");
}
function encodeURL(location2, isExternalHost = false) {
  const url = new URL(location2, "http://localhost");
  if (!isExternalHost) {
    return url.pathname + url.search + url.hash;
  }
  if (location2.startsWith("//")) {
    return url.toString().replace(url.protocol, "");
  }
  return url.toString();
}
const NUXT_ERROR_SIGNATURE = "__nuxt_error";
const useError = () => toRef(useNuxtApp().payload, "error");
const showError = (error) => {
  const nuxtError = createError(error);
  try {
    const nuxtApp = useNuxtApp();
    const error2 = useError();
    if (false) ;
    error2.value ||= nuxtError;
  } catch {
    throw nuxtError;
  }
  return nuxtError;
};
const isNuxtError = (error) => !!error && typeof error === "object" && NUXT_ERROR_SIGNATURE in error;
const createError = (error) => {
  const nuxtError = createError$1(error);
  Object.defineProperty(nuxtError, NUXT_ERROR_SIGNATURE, {
    value: true,
    configurable: false,
    writable: false
  });
  return nuxtError;
};
async function getRouteRules(arg) {
  const path = typeof arg === "string" ? arg : arg.path;
  {
    useNuxtApp().ssrContext._preloadManifest = true;
    const _routeRulesMatcher = toRouteMatcher(
      createRouter({ routes: (/* @__PURE__ */ useRuntimeConfig()).nitro.routeRules })
    );
    return defu({}, ..._routeRulesMatcher.matchAll(path).reverse());
  }
}
function definePayloadReducer(name, reduce) {
  {
    useNuxtApp().ssrContext._payloadReducers[name] = reduce;
  }
}
const payloadPlugin = definePayloadPlugin(() => {
  definePayloadReducer(
    "skipHydrate",
    // We need to return something truthy to be treated as a match
    (data) => !shouldHydrate(data) && 1
  );
});
const unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:head",
  enforce: "pre",
  setup(nuxtApp) {
    const head = nuxtApp.ssrContext.head;
    nuxtApp.vueApp.use(head);
  }
});
const manifest_45route_45rule = /* @__PURE__ */ defineNuxtRouteMiddleware(async (to) => {
  {
    return;
  }
});
const globalMiddleware = [
  manifest_45route_45rule
];
function getRouteFromPath(fullPath) {
  const route = fullPath && typeof fullPath === "object" ? fullPath : {};
  if (typeof fullPath === "object") {
    fullPath = stringifyParsedURL({
      pathname: fullPath.path || "",
      search: stringifyQuery(fullPath.query || {}),
      hash: fullPath.hash || ""
    });
  }
  const url = new URL(fullPath.toString(), "http://localhost");
  return {
    path: url.pathname,
    fullPath,
    query: parseQuery(url.search),
    hash: url.hash,
    // stub properties for compat with vue-router
    params: route.params || {},
    name: void 0,
    matched: route.matched || [],
    redirectedFrom: void 0,
    meta: route.meta || {},
    href: fullPath
  };
}
const router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:router",
  enforce: "pre",
  setup(nuxtApp) {
    const initialURL = nuxtApp.ssrContext.url;
    const routes = [];
    const hooks = {
      "navigate:before": [],
      "resolve:before": [],
      "navigate:after": [],
      "error": []
    };
    const registerHook = (hook, guard) => {
      hooks[hook].push(guard);
      return () => hooks[hook].splice(hooks[hook].indexOf(guard), 1);
    };
    (/* @__PURE__ */ useRuntimeConfig()).app.baseURL;
    const route = reactive(getRouteFromPath(initialURL));
    async function handleNavigation(url, replace) {
      try {
        const to = getRouteFromPath(url);
        for (const middleware of hooks["navigate:before"]) {
          const result = await middleware(to, route);
          if (result === false || result instanceof Error) {
            return;
          }
          if (typeof result === "string" && result.length) {
            return handleNavigation(result, true);
          }
        }
        for (const handler of hooks["resolve:before"]) {
          await handler(to, route);
        }
        Object.assign(route, to);
        if (false) ;
        for (const middleware of hooks["navigate:after"]) {
          await middleware(to, route);
        }
      } catch (err) {
        for (const handler of hooks.error) {
          await handler(err);
        }
      }
    }
    const currentRoute = computed(() => route);
    const router = {
      currentRoute,
      isReady: () => Promise.resolve(),
      // These options provide a similar API to vue-router but have no effect
      options: {},
      install: () => Promise.resolve(),
      // Navigation
      push: (url) => handleNavigation(url),
      replace: (url) => handleNavigation(url),
      back: () => (void 0).history.go(-1),
      go: (delta) => (void 0).history.go(delta),
      forward: () => (void 0).history.go(1),
      // Guards
      beforeResolve: (guard) => registerHook("resolve:before", guard),
      beforeEach: (guard) => registerHook("navigate:before", guard),
      afterEach: (guard) => registerHook("navigate:after", guard),
      onError: (handler) => registerHook("error", handler),
      // Routes
      resolve: getRouteFromPath,
      addRoute: (parentName, route2) => {
        routes.push(route2);
      },
      getRoutes: () => routes,
      hasRoute: (name) => routes.some((route2) => route2.name === name),
      removeRoute: (name) => {
        const index = routes.findIndex((route2) => route2.name === name);
        if (index !== -1) {
          routes.splice(index, 1);
        }
      }
    };
    nuxtApp.vueApp.component("RouterLink", defineComponent({
      functional: true,
      props: {
        to: {
          type: String,
          required: true
        },
        custom: Boolean,
        replace: Boolean,
        // Not implemented
        activeClass: String,
        exactActiveClass: String,
        ariaCurrentValue: String
      },
      setup: (props, { slots }) => {
        const navigate = () => handleNavigation(props.to, props.replace);
        return () => {
          const route2 = router.resolve(props.to);
          return props.custom ? slots.default?.({ href: props.to, navigate, route: route2 }) : h("a", { href: props.to, onClick: (e) => {
            e.preventDefault();
            return navigate();
          } }, slots);
        };
      }
    }));
    nuxtApp._route = route;
    nuxtApp._middleware ||= {
      global: [],
      named: {}
    };
    const initialLayout = nuxtApp.payload.state._layout;
    nuxtApp.hooks.hookOnce("app:created", async () => {
      router.beforeEach(async (to, from) => {
        to.meta = reactive(to.meta || {});
        if (nuxtApp.isHydrating && initialLayout && !isReadonly(to.meta.layout)) {
          to.meta.layout = initialLayout;
        }
        nuxtApp._processingMiddleware = true;
        if (!nuxtApp.ssrContext?.islandContext) {
          const middlewareEntries = /* @__PURE__ */ new Set([...globalMiddleware, ...nuxtApp._middleware.global]);
          {
            const routeRules = await nuxtApp.runWithContext(() => getRouteRules({ path: to.path }));
            if (routeRules.appMiddleware) {
              for (const key in routeRules.appMiddleware) {
                const guard = nuxtApp._middleware.named[key];
                if (!guard) {
                  return;
                }
                if (routeRules.appMiddleware[key]) {
                  middlewareEntries.add(guard);
                } else {
                  middlewareEntries.delete(guard);
                }
              }
            }
          }
          for (const middleware of middlewareEntries) {
            const result = await nuxtApp.runWithContext(() => middleware(to, from));
            {
              if (result === false || result instanceof Error) {
                const error = result || createError$1({
                  statusCode: 404,
                  statusMessage: `Page Not Found: ${initialURL}`,
                  data: {
                    path: initialURL
                  }
                });
                delete nuxtApp._processingMiddleware;
                return nuxtApp.runWithContext(() => showError(error));
              }
            }
            if (result === true) {
              continue;
            }
            if (result || result === false) {
              return result;
            }
          }
        }
      });
      router.afterEach(() => {
        delete nuxtApp._processingMiddleware;
      });
      await router.replace(initialURL);
      if (!isEqual(route.fullPath, initialURL)) {
        await nuxtApp.runWithContext(() => navigateTo(route.fullPath));
      }
    });
    return {
      provide: {
        route,
        router
      }
    };
  }
});
const reducers = [
  ["NuxtError", (data) => isNuxtError(data) && data.toJSON()],
  ["EmptyShallowRef", (data) => isRef(data) && isShallow(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["EmptyRef", (data) => isRef(data) && !data.value && (typeof data.value === "bigint" ? "0n" : JSON.stringify(data.value) || "_")],
  ["ShallowRef", (data) => isRef(data) && isShallow(data) && data.value],
  ["ShallowReactive", (data) => isReactive(data) && isShallow(data) && toRaw(data)],
  ["Ref", (data) => isRef(data) && data.value],
  ["Reactive", (data) => isReactive(data) && toRaw(data)]
];
const revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:revive-payload:server",
  setup() {
    for (const [reducer, fn] of reducers) {
      definePayloadReducer(reducer, fn);
    }
  }
});
defineComponent({
  name: "ServerPlaceholder",
  render() {
    return createElementBlock("div");
  }
});
const clientOnlySymbol = Symbol.for("nuxt:client-only");
defineComponent({
  name: "ClientOnly",
  inheritAttrs: false,
  props: ["fallback", "placeholder", "placeholderTag", "fallbackTag"],
  ...false,
  setup(props, { slots, attrs }) {
    const mounted = shallowRef(false);
    const vm = getCurrentInstance();
    if (vm) {
      vm._nuxtClientOnly = true;
    }
    provide(clientOnlySymbol, true);
    return () => {
      if (mounted.value) {
        const vnodes = slots.default?.();
        if (vnodes && vnodes.length === 1) {
          return [cloneVNode(vnodes[0], attrs)];
        }
        return vnodes;
      }
      const slot = slots.fallback || slots.placeholder;
      if (slot) {
        return h(slot);
      }
      const fallbackStr = props.fallback || props.placeholder || "";
      const fallbackTag = props.fallbackTag || props.placeholderTag || "span";
      return createElementBlock(fallbackTag, attrs, fallbackStr);
    };
  }
});
const plugin = /* @__PURE__ */ defineNuxtPlugin({
  name: "pinia",
  setup(nuxtApp) {
    const pinia = createPinia();
    nuxtApp.vueApp.use(pinia);
    setActivePinia(pinia);
    {
      nuxtApp.payload.pinia = toRaw(pinia.state.value);
    }
    return {
      provide: {
        pinia
      }
    };
  }
});
const components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4 = /* @__PURE__ */ defineNuxtPlugin({
  name: "nuxt:global-components"
});
const plugins = [
  payloadPlugin,
  unhead_k2P3m_ZDyjlr2mMYnoDPwavjsDN8hBlk9cFai0bbopU,
  router_DclsWNDeVV7SyG4lslgLnjbQUK1ws8wgf2FHaAbo7Cw,
  revive_payload_server_MVtmlZaQpj6ApFmshWfUWl5PehCebzaBf2NuRMiIbms,
  plugin,
  components_plugin_z4hgvsiddfKkfXTP6M8M4zG5Cb7sGnDhcryKVM45Di4
];
class CardRepository {
  /**
   * 📚 獲取所有卡片 - 去圖書館借所有書
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 請求所有卡片資料
   * - 把 API 的格式轉換成前端需要的格式
   * - 處理可能發生的錯誤
   * 
   * 💡 為什麼需要這個函數？
   * - 組件不用知道 API 網址在哪裡
   * - 組件不用處理 API 格式轉換
   * - 組件不用處理錯誤，Repository 統一處理
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   const cards = await cardRepo.getAllCards()
   *   console.log('取得卡片:', cards.length, '張')
   * } catch (error) {
   *   alert('載入失敗: ' + error.message)
   * }
   * 
   * 🔄 處理流程：
   * 1. 呼叫 API: GET /api/cards
   * 2. 取得 ApiCard[] 格式的資料
   * 3. 轉換成 Card[] 格式
   * 4. 回傳給呼叫者
   * 
   * 🔧 回傳說明：
   * @returns Promise<Card[]> - 所有卡片的陣列（前端格式）
   * @throws Error - 如果 API 呼叫失敗或轉換失敗
   */
  async getAllCards() {
    try {
      const apiCards = await $fetch("/api/cards");
      if (!Array.isArray(apiCards)) {
        if (apiCards === null) {
          return [];
        }
        throw new Error("API 回應格式不正確");
      }
      return this.transformApiCards(apiCards);
    } catch (error) {
      throw this.handleError(error, "獲取卡片失敗");
    }
  }
  /**
   * ➕ 新增卡片 - 去文具店買新的便利貼
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 發送新增卡片的請求
   * - 處理前端格式和 API 格式的差異
   * - 回傳新建立的卡片資料
   * 
   * 💡 為什麼需要格式轉換？
   * - 前端傳入：listId（駝峰命名）
   * - API 需要：list_id（蛇形命名）
   * - Repository 負責處理這個轉換
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   const newCard = await cardRepo.createCard('實作登入功能', 'list_123')
   *   console.log('新卡片 ID:', newCard.id)
   * } catch (error) {
   *   alert('新增失敗: ' + error.message)
   * }
   * 
   * 🔄 處理流程：
   * 1. 接收前端參數：title, listId
   * 2. 轉換格式：listId → list_id
   * 3. 呼叫 API: POST /api/cards
   * 4. 取得 ApiCard 格式的回應
   * 5. 轉換成 Card 格式回傳
   * 
   * 🔧 參數說明：
   * @param title - 卡片標題
   * @param listId - 所屬列表 ID（前端格式）
   * @returns Promise<Card> - 新建立的卡片（前端格式）
   * @throws Error - 如果新增失敗或驗證失敗
   */
  async createCard(title, listId, status) {
    try {
      const apiCard = await $fetch("/api/cards", {
        method: "POST",
        body: {
          title,
          // 標題保持不變
          list_id: listId,
          // 🔄 駝峰轉蛇形：listId → list_id
          status
          // AI 生成任務的狀態標籤
        }
      });
      return this.transformApiCard(apiCard);
    } catch (error) {
      throw this.handleError(error, "新增卡片失敗");
    }
  }
  /**
   * 🗑️ 刪除卡片 - 把便利貼丟進垃圾桶
   * 
   * 🤔 這個函數做什麼？
   * - 向後端 API 發送刪除卡片的請求
   * - 處理刪除過程中可能發生的錯誤
   * - 確保刪除操作的安全性
   * 
   * 💡 為什麼不直接回傳資料？
   * - 刪除操作通常不需要回傳內容
   * - Promise<void> 表示「執行完成，但沒有回傳值」
   * - 如果沒有拋出錯誤，就表示刪除成功
   * 
   * 📝 使用例子：
   * const cardRepo = new CardRepository()
   * try {
   *   await cardRepo.deleteCard('card_123')
   *   console.log('卡片已刪除')
   * } catch (error) {
   *   alert('刪除失敗: ' + error.message)
   * }
   * 
   * 🔄 處理流程：
   * 1. 接收卡片 ID
   * 2. 呼叫 API: DELETE /api/cards/{cardId}
   * 3. 等待 API 確認刪除完成
   * 4. 如果沒有錯誤，表示刪除成功
   * 
   * ⚠️ 安全考量：
   * - API 應該檢查使用者是否有權限刪除這張卡片
   * - 應該檢查卡片是否存在
   * - 可能需要軟刪除（標記為已刪除）而非硬刪除
   * 
   * 🔧 參數說明：
   * @param cardId - 要刪除的卡片 ID
   * @returns Promise<void> - 無回傳值，成功完成或拋出錯誤
   * @throws Error - 如果刪除失敗或沒有權限
   */
  async deleteCard(cardId) {
    try {
      await $fetch(`/api/cards/${cardId}`, { method: "DELETE" });
    } catch (error) {
      throw this.handleError(error, "刪除卡片失敗");
    }
  }
  /**
   * 🔄 轉換單張卡片格式 - 翻譯員
   * 
   * 🤔 這個函數做什麼？
   * - 把 API 回傳的格式轉換成前端需要的格式
   * - 處理命名規則的差異（蛇形 → 駝峰）
   * - 確保資料格式一致性
   * 
   * 💡 為什麼要做格式轉換？
   * - API 使用 list_id（蛇形命名）
   * - 前端使用 listId（駝峰命名）
   * - 統一前端的資料格式，避免混亂
   * 
   * 📝 轉換對照表：
   * API 格式 (ApiCard)     →  前端格式 (Card)
   * ----------------      →  ----------------
   * id                    →  id           (不變)
   * title                 →  title        (不變)
   * description           →  description  (不變)
   * list_id               →  listId       (蛇形→駝峰)
   * position              →  position     (不變)
   * 
   * 🔧 為什麼是 private？
   * - 這是內部使用的工具函數
   * - 外部不需要知道轉換的細節
   * - 如果 API 格式改變，只需要修改這個函數
   * 
   * 🔧 參數說明：
   * @param apiCard - API 回傳的卡片資料（蛇形命名）
   * @returns Card - 前端格式的卡片資料（駝峰命名）
   */
  transformApiCard(apiCard) {
    if (!apiCard || typeof apiCard !== "object") {
      throw new Error("無效的 API 卡片資料");
    }
    return {
      id: apiCard.id,
      title: apiCard.title,
      description: apiCard.description,
      listId: apiCard.list_id,
      // 轉換 snake_case to camelCase
      position: apiCard.position,
      status: apiCard.status,
      // AI 生成任務的狀態標籤
      // 如果 API 回應包含 created_at，則轉換為 Date 物件
      createdAt: apiCard.created_at ? new Date(apiCard.created_at) : void 0,
      // 如果 API 回應包含 updated_at，則轉換為 Date 物件
      updatedAt: apiCard.updated_at ? new Date(apiCard.updated_at) : void 0
    };
  }
  /**
   * 📊 取得所有卡片 - 已有方法，供參考
   * 
   * 🎯 這個方法已經存在於上面，供 boardStore.fetchBoard() 使用
   */
  /**
   * 🔄 批量更新卡片位置 - 新增方法
   * 
   * 🤔 這個函數做什麼？
   * - 批量更新多張卡片的 list_id 和 position
   * - 專為 drag & drop 功能設計
   * - 一次 API 呼叫完成所有更新，提高效能
   * 
   * 💡 為什麼要批量更新？
   * - 拖拽時可能影響多張卡片的位置
   * - 減少 API 呼叫次數
   * - 確保資料一致性（要麼全部成功，要麼全部失敗）
   * 
   * 🔧 參數說明：
   * @param updates - 要更新的卡片清單，包含 id, listId, position
   * @returns Promise<void> - 不回傳資料，只確保更新成功
   */
  async batchUpdateCards(updates) {
    if (updates.length === 0) {
      console.log("📝 [REPO] 沒有卡片需要更新");
      return;
    }
    try {
      console.log(`🚀 [REPO] 批量更新 ${updates.length} 張卡片`);
      const updatePromises = updates.map(({ id, listId, position }) => {
        console.log(`📝 [REPO] 更新卡片 ${id}: listId=${listId}, position=${position}`);
        return $fetch(`/api/cards/${id}`, {
          method: "PUT",
          body: {
            list_id: listId,
            // 轉換為 API 格式（蛇形命名）
            position
          }
        });
      });
      await Promise.all(updatePromises);
      console.log("✅ [REPO] 批量更新完成");
    } catch (error) {
      throw this.handleError(error, "批量更新卡片失敗");
    }
  }
  /**
   * 🔄 轉換多張卡片格式 - 批量翻譯員
   * 
   * 🤔 這個函數做什麼？
   * - 把多張卡片一次全部轉換
   * - 使用 map 方法對每張卡片執行轉換
   * - 回傳轉換後的卡片陣列
   * 
   * 💡 為什麼要單獨寫這個函數？
   * - 讓程式碼更清楚易懂
   * - 複用 transformApiCard 的邏輯
   * - 如果之後要加其他處理（比如排序、過濾），很容易修改
   * 
   * 📝 使用場景：
   * - getAllCards() 取得所有卡片時
   * - 任何需要處理多張卡片的地方
   * 
   * 🔧 參數說明：
   * @param apiCards - API 回傳的卡片陣列（蛇形命名）
   * @returns Card[] - 前端格式的卡片陣列（駝峰命名）
   */
  transformApiCards(apiCards) {
    return apiCards.map((card) => this.transformApiCard(card));
  }
  /**
   * 🚨 統一錯誤處理 - 醫生診斷病情
   * 
   * 🤔 這個函數做什麼？
   * - 把各種 API 錯誤轉換成使用者看得懂的訊息
   * - 記錄錯誤到 console，方便開發者除錯
   * - 根據不同錯誤類型提供對應的處理方式
   * 
   * 💡 為什麼需要統一錯誤處理？
   * - API 的錯誤訊息可能是英文或技術術語
   * - 不同的錯誤狀態碼代表不同的問題
   * - 讓使用者看到友善的中文錯誤訊息
   * - 避免在每個函數裡重複寫錯誤處理邏輯
   * 
   * 📝 錯誤狀態碼對照表：
   * 401 Unauthorized    → "請先登入"
   * 403 Forbidden       → "沒有權限執行此操作"
   * 404 Not Found       → 使用原始訊息
   * 500 Server Error    → 使用原始訊息
   * 其他               → 使用原始訊息
   * 
   * 🔍 使用例子：
   * try {
   *   await $fetch('/api/cards')
   * } catch (error) {
   *   // error.statusCode = 401
   *   throw this.handleError(error, '獲取卡片失敗')
   *   // 最終使用者看到：「請先登入」
   * }
   * 
   * 🔧 為什麼是 private？
   * - 這是內部使用的工具函數
   * - 統一處理所有 API 錯誤
   * - 如果要改錯誤訊息格式，只需要修改這裡
   * 
   * 🔧 參數說明：
   * @param error - API 拋出的原始錯誤
   * @param message - 操作失敗的基本描述
   * @returns Error - 永遠不會回傳，因為一定會拋出錯誤
   * @throws Error - 總是拋出處理後的錯誤
   */
  handleError(error, message) {
    console.error(message, error);
    if (error.statusCode === 401) {
      throw new Error("請先登入");
    }
    if (error.statusCode === 403) {
      throw new Error("沒有權限執行此操作");
    }
    throw new Error(message);
  }
}
const cardRepository = new CardRepository();
class ListRepository {
  /**
   * 📊 取得所有列表
   * 
   * 🤔 這個函數做什麼？
   * - 呼叫 API 取得所有列表
   * - 轉換格式並排序
   * - 回傳乾淨的 ListUI 陣列
   * 
   * 💡 為什麼要排序？
   * - 確保列表按照 position 正確排列
   * - 統一處理排序邏輯
   * 
   * 🔧 回傳值：
   * @returns Promise<List[]> - 排序後的列表陣列
   */
  async getAllLists() {
    try {
      console.log("🚀 [LIST-REPO] 開始取得所有列表");
      const response = await $fetch("/api/lists");
      console.log(`📊 [LIST-REPO] 成功取得 ${response.length} 個列表`);
      const lists = this.transformApiLists(response);
      console.log("✅ [LIST-REPO] 列表轉換完成");
      return lists;
    } catch (error) {
      throw this.handleError(error, "取得列表失敗");
    }
  }
  /**
   * 🆕 建立新列表
   * 
   * 🤔 這個函數做什麼？
   * - 呼叫 API 建立新列表
   * - 轉換回傳的列表格式
   * 
   * 🔧 參數說明：
   * @param title - 列表標題
   * @returns Promise<List> - 新建立的列表
   */
  async createList(title) {
    try {
      console.log(`🚀 [LIST-REPO] 開始建立列表: ${title}`);
      const response = await $fetch("/api/lists", {
        method: "POST",
        body: { title }
      });
      const newList = this.transformApiList(response);
      console.log("✅ [LIST-REPO] 列表建立完成");
      return newList;
    } catch (error) {
      throw this.handleError(error, "建立列表失敗");
    }
  }
  /**
   * 🗑️ 刪除列表
   * 
   * 🔧 參數說明：
   * @param listId - 要刪除的列表 ID
   * @returns Promise<void> - 不回傳資料
   */
  async deleteList(listId) {
    try {
      console.log(`🚀 [LIST-REPO] 開始刪除列表: ${listId}`);
      await $fetch(`/api/lists/${listId}`, {
        method: "DELETE"
      });
      console.log("✅ [LIST-REPO] 列表刪除完成");
    } catch (error) {
      throw this.handleError(error, "刪除列表失敗");
    }
  }
  /**
   * 🔄 更新列表位置
   * 
   * 🤔 這個函數做什麼？
   * - 更新單個列表的 position 屬性
   * - 用於拖拉移動列表時同步到資料庫
   * 
   * 🔧 參數說明：
   * @param listId - 要更新的列表 ID
   * @param position - 新的位置索引
   * @returns Promise<void> - 不回傳資料
   */
  async updateListPosition(listId, position) {
    try {
      console.log(`🚀 [LIST-REPO] 開始更新列表位置: ${listId} → position: ${position}`);
      await $fetch(`/api/lists/${listId}`, {
        method: "PUT",
        body: { position }
      });
      console.log("✅ [LIST-REPO] 列表位置更新完成");
    } catch (error) {
      throw this.handleError(error, "更新列表位置失敗");
    }
  }
  /**
   * ✏️ 更新列表標題
   * 
   * 🤔 這個函數做什麼？
   * - 更新指定列表的標題
   * - 用於使用者編輯列表名稱時同步到資料庫
   * 
   * 🔧 參數說明：
   * @param listId - 要更新的列表 ID
   * @param title - 新的列表標題
   * @returns Promise<void> - 不回傳資料
   */
  async updateListTitle(listId, title) {
    try {
      console.log(`🚀 [LIST-REPO] 開始更新列表標題: ${listId} → "${title}"`);
      await $fetch(`/api/lists/${listId}`, {
        method: "PUT",
        body: { title }
      });
      console.log("✅ [LIST-REPO] 列表標題更新完成");
    } catch (error) {
      throw this.handleError(error, "更新列表標題失敗");
    }
  }
  /**
   * 🔄 批量更新列表位置
   * 
   * 🤔 這個函數做什麼？
   * - 批量更新多個列表的位置
   * - 專為拖拉重新排序設計
   * - 提高效能，確保資料一致性
   * 
   * 🔧 參數說明：
   * @param updates - 要更新的列表陣列，包含 id 和 position
   * @returns Promise<void> - 不回傳資料
   */
  async batchUpdateListPositions(updates) {
    if (updates.length === 0) {
      console.log("📝 [LIST-REPO] 沒有列表需要更新");
      return;
    }
    try {
      console.log(`🚀 [LIST-REPO] 批量更新 ${updates.length} 個列表的位置`);
      const updatePromises = updates.map(({ id, position }) => {
        console.log(`📝 [LIST-REPO] 更新列表 ${id}: position=${position}`);
        return $fetch(`/api/lists/${id}`, {
          method: "PUT",
          body: { position }
        });
      });
      await Promise.all(updatePromises);
      console.log("✅ [LIST-REPO] 批量更新完成");
    } catch (error) {
      throw this.handleError(error, "批量更新列表位置失敗");
    }
  }
  /**
   * 🔄 轉換單個列表格式
   * 
   * @param apiList - API 回傳的列表資料
   * @returns List - 前端格式的列表資料
   */
  transformApiList(apiList) {
    if (!apiList || typeof apiList !== "object") {
      throw new Error("無效的 API 列表資料");
    }
    return {
      id: apiList.id,
      title: apiList.title,
      position: apiList.position,
      cards: []
      // 空的卡片陣列，會由其他地方填入
    };
  }
  /**
   * 🔄 轉換多個列表格式
   * 
   * @param apiLists - API 回傳的列表陣列
   * @returns List[] - 前端格式的列表陣列
   */
  transformApiLists(apiLists) {
    if (!Array.isArray(apiLists)) {
      console.warn("⚠️ [LIST-REPO] API 回應不是陣列，回傳空陣列");
      return [];
    }
    return apiLists.map((list) => this.transformApiList(list)).sort((a, b) => (a.position || 0) - (b.position || 0));
  }
  /**
   * 🚨 錯誤處理統一函數
   * 
   * @param error - 原始錯誤
   * @param context - 錯誤發生的情境
   * @returns Error - 包裝後的錯誤
   */
  handleError(error, context) {
    console.error(`❌ [LIST-REPO] ${context}:`, error);
    const message = error?.message || error?.toString() || "未知錯誤";
    return new Error(`${context}: ${message}`);
  }
}
const listRepository = new ListRepository();
const useBoardStore = defineStore("board", {
  // 定義 Store 的狀態
  state: () => ({
    board: {
      id: "board-1",
      title: "My Board",
      // 初始列表為空，將從 API 獲取
      lists: []
    },
    // 載入狀態，用於顯示 loading spinner
    isLoading: false,
    // 目前開啟的選單 ID，同時只能有一個選單開啟
    openMenuId: null
  }),
  // Getters: 計算派生狀態
  getters: {
    // 動態計算下一個可用的卡片 ID
    // 用於生成新卡片的唯一識別碼
    nextCardId: (state) => {
      let maxId = 0;
      for (const list of state.board.lists) {
        for (const card of list.cards) {
          const match = card.id.match(/^card-(\d+)$/);
          if (match) {
            const cardNum = parseInt(match[1], 10);
            if (cardNum > maxId) {
              maxId = cardNum;
            }
          }
        }
      }
      return maxId + 1;
    },
    // 動態計算下一個可用的列表 ID
    // 用於生成新列表的唯一識別碼
    nextListId: (state) => {
      let maxId = 0;
      for (const list of state.board.lists) {
        const match = list.id.match(/^list-(\d+)$/);
        if (match) {
          const listNum = parseInt(match[1], 10);
          if (listNum > maxId) {
            maxId = listNum;
          }
        }
      }
      return maxId + 1;
    }
  },
  // Actions: 定義可以修改狀態的操作
  actions: {
    // 🔙 恢復穩定的分開查詢 - 簡單可靠的資料獲取
    // 使用分開的 API 調用，確保排序邏輯正確且易於除錯
    async fetchBoard() {
      this.isLoading = true;
      const startTime = Date.now();
      try {
        console.log("🚀 [STORE] 開始獲取看板資料...");
        if (false) ;
        const [listsResponse, cardsResponse] = await Promise.all([
          listRepository.getAllLists(),
          cardRepository.getAllCards()
        ]);
        const fetchTime = Date.now() - startTime;
        console.log(`⚡ [STORE] API 調用完成，耗時: ${fetchTime}ms`);
        const cardsByListId = {};
        if (cardsResponse) {
          console.log(`📋 [STORE] 處理 ${cardsResponse.length} 張卡片`);
          cardsResponse.forEach((card) => {
            if (!cardsByListId[card.listId]) {
              cardsByListId[card.listId] = [];
            }
            cardsByListId[card.listId].push(card);
          });
          Object.keys(cardsByListId).forEach((listId) => {
            cardsByListId[listId].sort((a, b) => (a.position || 0) - (b.position || 0));
            console.log(`📝 [STORE] 列表 ${listId} 的卡片排序:`);
            cardsByListId[listId].forEach((card, index) => {
              console.log(`  ${index}: "${card.title}" (position: ${card.position})`);
            });
          });
        }
        if (listsResponse) {
          console.log(`📈 [STORE] 處理 ${listsResponse.length} 個列表`);
          const listsWithCards = listsResponse.map((list) => ({
            ...list,
            cards: cardsByListId[list.id] || []
            // 如果列表沒有卡片則使用空陣列
          }));
          this.board.lists = listsWithCards.sort((a, b) => (a.position || 0) - (b.position || 0));
          console.log("📋 [STORE] 列表已按 position 排序:");
          this.board.lists.forEach((list, index) => {
            console.log(`  ${index}: "${list.title}" (position: ${list.position})`);
          });
          const listsCount = this.board.lists.length;
          const cardsCount = this.board.lists.reduce((total, list) => total + list.cards.length, 0);
          console.log("📊 [STORE] 載入統計:");
          console.log(`  📋 ${listsCount} 個列表`);
          console.log(`  🎯 ${cardsCount} 張卡片`);
          console.log(`  ⚡ 總耗時: ${Date.now() - startTime}ms`);
          console.log("✅ [STORE] 看板資料載入完成");
        } else {
          console.warn("⚠️ [STORE] listsResponse 為空或 undefined");
          this.board.lists = [];
        }
      } catch (error) {
        const errorTime = Date.now() - startTime;
        console.error(`❌ [STORE] 獲取看板資料失敗，耗時: ${errorTime}ms`);
        console.error("  🔍 錯誤詳情:", error);
        this.board.lists = [];
      } finally {
        this.isLoading = false;
        const totalTime = Date.now() - startTime;
        console.log(`🏁 [STORE] fetchBoard 完成，總耗時: ${totalTime}ms`);
      }
    },
    // 新增列表到看板
    // 發送 API 請求建立新列表，成功後更新本地狀態
    async addList(title) {
      console.log("🏪 [STORE] addList 被呼叫，參數:", { title });
      try {
        console.log("📤 [STORE] 發送 API 請求到 /api/lists");
        const response = await $fetch("/api/lists", {
          method: "POST",
          body: {
            title
          }
        });
        console.log("📥 [STORE] API 回應:", response);
        const newList = {
          ...response,
          cards: []
          // 新列表初始沒有卡片
        };
        console.log("✅ [STORE] 新增到本地狀態:", newList);
        this.board.lists.push(newList);
      } catch (error) {
        console.error("❌ [STORE] 新增列表錯誤:", error);
        if (error && typeof error === "object") {
          console.error("📋 [STORE] 錯誤詳情:", {
            message: error.message,
            statusCode: error.statusCode,
            statusMessage: error.statusMessage,
            data: error.data
          });
        }
      }
    },
    // 刪除指定的列表
    // 發送 API 請求刪除列表，成功後從本地狀態移除
    async removeList(listId) {
      console.log("🗑️ [STORE] removeList 被呼叫，參數:", { listId });
      const targetList = this.board.lists.find((list) => list.id === listId);
      if (targetList) {
        console.log("📋 [STORE] 找到要刪除的列表:", {
          id: targetList.id,
          title: targetList.title,
          cardsCount: targetList.cards.length
        });
      } else {
        console.warn("⚠️ [STORE] 警告: 找不到要刪除的列表 ID:", listId);
        return;
      }
      try {
        console.log("📤 [STORE] 發送 DELETE API 請求到:", `/api/lists/${listId}`);
        await $fetch(`/api/lists/${listId}`, {
          method: "DELETE"
        });
        console.log("✅ [STORE] API 刪除請求成功");
        const index = this.board.lists.findIndex((list) => list.id === listId);
        if (index !== -1) {
          console.log("🔄 [STORE] 從本地狀態移除列表，索引:", index);
          this.board.lists.splice(index, 1);
          console.log("✅ [STORE] 列表已從本地狀態移除，剩餘列表數量:", this.board.lists.length);
        } else {
          console.error("❌ [STORE] 錯誤: 無法在本地狀態中找到要刪除的列表");
        }
      } catch (error) {
        console.error("❌ [STORE] 刪除列表錯誤:");
        console.error("  🔍 錯誤類型:", typeof error);
        console.error("  🔍 錯誤內容:", error);
        if (error && typeof error === "object") {
          console.error("  🔍 錯誤詳情:", {
            message: error.message,
            statusCode: error.statusCode,
            statusMessage: error.statusMessage,
            data: error.data
          });
        }
        throw error;
      }
    },
    // 🚀 新增卡片到指定列表 - 使用樂觀 UI 更新
    // 
    // 🎯 樂觀 UI 更新 = 先改 UI，再打 API
    // 就像你先把積木放上去，再問媽媽可不可以放
    // 這樣 UI 感覺超快，用戶體驗更好！
    //
    // 🔄 流程：
    // 1. 立即建立暫時卡片並顯示在 UI 上
    // 2. 同時在背景呼叫 API
    // 3. API 成功：更新暫時卡片為真實 ID
    // 4. API 失敗：移除暫時卡片，顯示錯誤訊息
    async addCard(listId, title, status) {
      const list = this.board.lists.find((list2) => list2.id === listId);
      if (!list) {
        console.error("❌ [STORE] 找不到指定的列表:", listId);
        throw new Error("找不到指定的列表");
      }
      const tempId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticCard = {
        id: tempId,
        title: title.trim(),
        description: "",
        listId,
        position: list.cards.length,
        // 放在最後一個位置
        status,
        // AI 生成任務的狀態標籤
        createdAt: /* @__PURE__ */ new Date(),
        updatedAt: /* @__PURE__ */ new Date()
      };
      list.cards.push(optimisticCard);
      console.log("⚡ [STORE] 樂觀更新：立即顯示暫時卡片", optimisticCard);
      try {
        console.log("📤 [STORE] 背景呼叫 API 建立真實卡片...");
        const realCard = await cardRepository.createCard(title, listId, status);
        const cardIndex = list.cards.findIndex((card) => card.id === tempId);
        if (cardIndex !== -1) {
          list.cards[cardIndex] = realCard;
          console.log("✅ [STORE] 成功：用真實卡片替換暫時卡片", realCard);
        }
      } catch (error) {
        console.error("❌ [STORE] API 失敗，執行回滾...");
        const cardIndex = list.cards.findIndex((card) => card.id === tempId);
        if (cardIndex !== -1) {
          list.cards.splice(cardIndex, 1);
          console.log("🔄 [STORE] 回滾完成：已移除暫時卡片");
        }
        console.error("💥 [STORE] 新增卡片失敗:", error);
        throw error;
      }
    },
    // 儲存列表位置順序到資料庫
    // 透過 Repository 模式處理列表位置更新
    async saveListPositions() {
      try {
        console.log("🚀 [STORE] 開始儲存列表位置順序...");
        const updates = this.board.lists.map((list, index) => {
          console.log(`📝 [STORE] 列表 "${list.title}" 位置: ${index}`);
          return {
            id: list.id,
            position: index
          };
        });
        await listRepository.batchUpdateListPositions(updates);
        this.board.lists.forEach((list, index) => {
          list.position = index;
        });
        console.log("✅ [STORE] 列表位置順序已儲存並同步");
      } catch (error) {
        console.error("❌ [STORE] 儲存列表位置失敗:", error);
        throw error;
      }
    },
    // 從指定列表中刪除卡片
    // 發送 API 請求刪除卡片，成功後從本地狀態移除
    async removeCard(listId, cardId) {
      try {
        await $fetch(`/api/cards/${cardId}`, {
          method: "DELETE"
        });
        const list = this.board.lists.find((list2) => list2.id === listId);
        if (list) {
          const cardIndex = list.cards.findIndex((card) => card.id === cardId);
          if (cardIndex !== -1) {
            list.cards.splice(cardIndex, 1);
          }
        }
      } catch (error) {
        console.error("刪除卡片錯誤:", error);
      }
    },
    // 🎯 方案B：完整的卡片移動 + 排序業務邏輯（單一職責）
    // Vue Draggable 已經更新了 UI 狀態，這個函數只負責：
    // 1. 重新計算所有受影響列表的 position
    // 2. 批次更新到資料庫
    // 3. 錯誤處理和資料一致性
    async moveCardAndReorder(affectedListIds) {
      console.log(`🚀 [STORE] 開始重新整理受影響列表的 position:`, affectedListIds);
      try {
        const updates = [];
        for (const listId of affectedListIds) {
          const list = this.board.lists.find((l) => l.id === listId);
          if (!list) {
            console.warn(`⚠️ [STORE] 找不到列表 ${listId}`);
            continue;
          }
          console.log(`📝 [STORE] 重新整理列表 "${list.title}" 的 ${list.cards.length} 張卡片`);
          list.cards.forEach((card, index) => {
            const newPosition = index;
            console.log(`  📌 [STORE] 卡片 "${card.title}" 新位置: ${newPosition}`);
            updates.push({
              id: card.id,
              listId,
              position: newPosition
            });
          });
        }
        console.log(`📤 [STORE] 準備批次更新 ${updates.length} 張卡片的位置...`);
        await cardRepository.batchUpdateCards(updates);
        console.log(`✅ [STORE] 成功重新整理所有受影響列表的位置`);
      } catch (error) {
        console.error("❌ [STORE] 重新整理卡片位置失敗:", error);
        console.error("🔄 [STORE] 建議重新載入看板資料以確保一致性");
        throw error;
      }
    },
    // 更新指定卡片的標題
    // 遍歷所有列表找到對應的卡片並更新其標題
    updateCardTitle(cardId, newTitle) {
      for (const list of this.board.lists) {
        const card = list.cards.find((card2) => card2.id === cardId);
        if (card) {
          card.title = newTitle;
          break;
        }
      }
    },
    // 更新指定卡片的描述
    // 遍歷所有列表找到對應的卡片並更新其描述
    updateCardDescription(cardId, newDescription) {
      for (const list of this.board.lists) {
        const card = list.cards.find((card2) => card2.id === cardId);
        if (card) {
          card.description = newDescription;
          break;
        }
      }
    },
    // 更新指定列表的標題（帶回滾，避免後端失敗時前端狀態髒掉）
    // 1) 先做輸入清理與存在性檢查  2) 樂觀更新  3) 失敗回滾
    async updateListTitle(listId, newTitle) {
      const title = newTitle.trim();
      if (!title) {
        console.warn("⚠️ [STORE] newTitle 為空，已略過更新");
        return;
      }
      const list = this.board.lists.find((l) => l.id === listId);
      if (!list) {
        console.warn("⚠️ [STORE] 找不到列表，無法更新標題:", listId);
        return;
      }
      const prevTitle = list.title;
      console.log(`🔄 [STORE] 開始更新列表標題: "${prevTitle}" → "${title}"`);
      list.title = title;
      try {
        await listRepository.updateListTitle(listId, title);
        console.log(`✅ [STORE] 成功更新列表標題: "${title}"`);
      } catch (error) {
        list.title = prevTitle;
        console.error("❌ [STORE] 更新列表標題失敗，已回滾至原標題:", prevTitle);
        console.error("  🔍 錯誤詳情:", error);
        throw error;
      }
    },
    // 設定開啟的選單 ID，關閉其他所有選單
    // 實現「同時只能有一個選單開啟」的全域狀態控制
    setOpenMenu(listId) {
      this.openMenuId = listId;
    },
    // 切換指定選單的開啟狀態
    // 如果該選單已開啟則關閉，如果其他選單開啟則切換到該選單
    toggleMenu(listId) {
      if (this.openMenuId === listId) {
        this.openMenuId = null;
      } else {
        this.openMenuId = listId;
      }
    },
    // 關閉所有選單
    // 通常在點擊外部區域時呼叫
    closeAllMenus() {
      this.openMenuId = null;
    }
  }
});
const confirmState = ref({
  show: false,
  message: ""
});
const useConfirmDialog = () => {
  const showConfirm = (options) => {
    if (confirmState.value.show) {
      return Promise.reject(new Error("Confirm dialog already open"));
    }
    return new Promise((resolve) => {
      confirmState.value = {
        show: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        dangerMode: options.dangerMode,
        resolve
      };
    });
  };
  const handleConfirm = () => {
    console.log("✅ [CONFIRM] 用戶點擊確認");
    const { resolve } = confirmState.value;
    confirmState.value.show = false;
    if (resolve) {
      resolve(true);
    }
  };
  const handleCancel = () => {
    console.log("❌ [CONFIRM] 用戶點擊取消");
    const { resolve } = confirmState.value;
    confirmState.value.show = false;
    if (resolve) {
      resolve(false);
    }
  };
  return {
    // 對話框狀態（供組件綁定）
    confirmState: readonly(confirmState),
    // 方法
    showConfirm,
    handleConfirm,
    handleCancel
  };
};
const MESSAGES = {
  // 🏠 應用程式基本資訊
  app: {
    name: "Trilou",
    fullName: "Trilou - 您的記事小幫手",
    tagline: "讓任務管理變得簡單又有趣"
  },
  // 🔐 登入相關文案
  login: {
    welcomeTitle: "歡迎使用 Trilou 📋",
    welcomeSubtitle: "您的個人任務管理工具",
    googlePrompt: "請用 Google 帳號登入",
    privacyNote: "我們只用來驗證身份，不會存取您的其他資料",
    loginButton: "使用 Google 登入",
    logoutButton: "登出",
    // 登入狀態提示
    loggingIn: "正在登入中...",
    loginSuccess: "登入成功！",
    loginError: "登入失敗，請稍後再試",
    logoutSuccess: "已成功登出"
  },
  // 📋 看板相關文案
  board: {
    title: "Trilou 📋",
    loading: "正在載入看板資料...",
    loadingFromCloud: "正在從雲端獲取您的資料中...",
    empty: "尚未建立任何列表",
    createFirstList: "建立第一個列表開始整理任務吧！"
  },
  // 📝 列表相關文案
  list: {
    addNew: "新增其他列表",
    addCard: "新增卡片",
    deleteConfirm: "確定要刪除列表嗎？",
    deleteWithCards: "此列表包含 {count} 張卡片，刪除後無法復原",
    untitled: "未命名列表",
    // 新增/編輯列表
    createTitle: "新增列表",
    editTitle: "編輯列表",
    titlePlaceholder: "列表標題...",
    titleRequired: "請輸入列表標題",
    createSuccess: "列表已成功新增",
    updateSuccess: "列表已成功更新",
    deleteSuccess: "列表已成功刪除"
  },
  // 🎯 卡片相關文案
  card: {
    addNew: "新增卡片",
    edit: "編輯卡片",
    delete: "刪除卡片",
    deleteConfirm: '確定要刪除卡片 "{title}" 嗎？此操作無法撤銷。',
    untitled: "未命名卡片",
    // 新增/編輯卡片
    createTitle: "新增卡片",
    editTitle: "編輯卡片",
    titlePlaceholder: "卡片標題...",
    descriptionPlaceholder: "新增更詳細的說明...",
    titleRequired: "請輸入卡片標題",
    createSuccess: "卡片已成功新增",
    updateSuccess: "卡片已成功更新",
    deleteSuccess: "卡片已成功刪除",
    // 拖拉功能
    moveSuccess: "卡片已成功移動",
    moveError: "移動卡片失敗，請稍後再試"
  },
  // 💬 對話框相關文案
  dialog: {
    confirm: "確認",
    cancel: "取消",
    save: "儲存",
    delete: "刪除",
    edit: "編輯",
    close: "關閉",
    // 通用提示
    unsavedChanges: "有未儲存的變更",
    unsavedPrompt: "確定要離開嗎？未儲存的變更將會遺失",
    operationSuccess: "操作成功",
    operationError: "操作失敗",
    // 輸入驗證
    required: "此欄位為必填",
    tooShort: "內容太短，至少需要 {min} 個字元",
    tooLong: "內容太長，最多 {max} 個字元"
  },
  // ⚡ 系統訊息
  system: {
    loading: "載入中...",
    saving: "儲存中...",
    saved: "已儲存",
    error: "發生錯誤",
    networkError: "網路連線異常，請檢查網路設定",
    serverError: "伺服器暫時無法使用，請稍後再試",
    // 性能相關
    optimizing: "正在優化載入速度...",
    cacheUpdated: "資料已更新"
  }
};
const useCardActions = () => {
  const boardStore = useBoardStore();
  const { showConfirm } = useConfirmDialog();
  const deleteCard = async (card) => {
    console.log("🗑️ [CARD-ACTION] deleteCard 被呼叫，卡片:", card);
    console.log("💬 [CARD-ACTION] 顯示刪除確認對話框...");
    const confirmed = await showConfirm({
      title: MESSAGES.card.delete,
      message: MESSAGES.card.deleteConfirm.replace("{title}", card.title),
      confirmText: MESSAGES.dialog.delete,
      cancelText: MESSAGES.dialog.cancel,
      dangerMode: true
    });
    if (!confirmed) {
      console.log("❌ [CARD-ACTION] 用戶取消刪除操作");
      return false;
    }
    console.log("✅ [CARD-ACTION] 用戶確認刪除，開始樂觀 UI 刪除流程...");
    let sourceList = null;
    let originalCardIndex = -1;
    let originalCard = { ...card };
    try {
      console.log("📤 [CARD-ACTION] 發送 DELETE API 請求到:", `/api/cards/${card.id}`);
      console.log("🔄 [CARD-ACTION] 樂觀更新：從列表中移除卡片...");
      for (const list of boardStore.board.lists) {
        const cardIndex = list.cards.findIndex((c) => c.id === card.id);
        if (cardIndex !== -1) {
          console.log(`📋 [CARD-ACTION] 在列表 "${list.title}" 中找到卡片，索引: ${cardIndex}`);
          sourceList = list;
          originalCardIndex = cardIndex;
          list.cards.splice(cardIndex, 1);
          console.log("✅ [CARD-ACTION] 卡片已從本地狀態移除（樂觀更新）");
          break;
        }
      }
      await $fetch(`/api/cards/${card.id}`, {
        method: "DELETE"
      });
      console.log("✅ [CARD-ACTION] API 刪除請求成功");
      if (sourceList) {
        console.log("🔧 [CARD-ACTION] 重新整理列表位置排序...");
        await boardStore.moveCardAndReorder([sourceList.id]);
        console.log("✅ [CARD-ACTION] 位置重新排序完成");
      }
      console.log("🎉 [CARD-ACTION] 卡片刪除流程完成");
      return true;
    } catch (error) {
      console.error("❌ [CARD-ACTION] 刪除卡片過程中發生錯誤，執行回滾...");
      console.error("  🔍 錯誤類型:", typeof error);
      console.error("  🔍 錯誤內容:", error);
      if (sourceList && originalCardIndex !== -1) {
        console.log("🔄 [CARD-ACTION] 回滾：恢復卡片到原始位置");
        sourceList.cards.splice(originalCardIndex, 0, originalCard);
        console.log("✅ [CARD-ACTION] 卡片已恢復到原始狀態");
      }
      if (error && typeof error === "object") {
        console.error("  🔍 錯誤詳情:", {
          message: error.message,
          statusCode: error.statusCode,
          statusMessage: error.statusMessage,
          data: error.data
        });
      }
      alert(MESSAGES.card.moveError);
      console.log("💥 [CARD-ACTION] 錯誤處理與回滾完成");
      return false;
    }
  };
  const updateCardTitle = async (cardId, newTitle) => {
    try {
      console.log("📝 [CARD-ACTION] 更新卡片標題:", { cardId, newTitle });
      boardStore.updateCardTitle(cardId, newTitle);
      console.log("✅ [CARD-ACTION] 卡片標題更新成功");
    } catch (error) {
      console.error("❌ [CARD-ACTION] 更新卡片標題失敗:", error);
      throw error;
    }
  };
  const updateCardDescription = async (cardId, newDescription) => {
    try {
      console.log("📄 [CARD-ACTION] 更新卡片描述:", { cardId, newDescription });
      boardStore.updateCardDescription(cardId, newDescription);
      console.log("✅ [CARD-ACTION] 卡片描述更新成功");
    } catch (error) {
      console.error("❌ [CARD-ACTION] 更新卡片描述失敗:", error);
      throw error;
    }
  };
  return {
    deleteCard,
    updateCardTitle,
    updateCardDescription
  };
};
function formatStatus(status) {
  const mcpStatusMap = {
    // 優先級相關
    "urgent": "🔥 緊急",
    "high": "⚡ 高優先",
    "medium": "📋 中優先",
    "low": "📝 低優先",
    // 時間相關
    "due-today": "⏰ 今日到期",
    "due-tomorrow": "📅 明日到期",
    "overdue": "🚨 已逾期",
    // 難度相關
    "quick-task": "⚡ 快速任務",
    "complex-task": "🧠 複雜任務",
    "research-needed": "🔍 需研究",
    // 依賴關係
    "waiting-approval": "👑 待批准",
    "waiting-others": "👥 等待他人",
    "prerequisites": "📌 有前置條件",
    // 特殊狀態
    "meeting-required": "🤝 需會議",
    "external-dependency": "🌐 外部依賴",
    "one-time": "🎯 一次性",
    "recurring": "🔄 重複性"
  };
  const frontendStatusMap = {
    "todo": "待辦",
    "in-progress": "進行中",
    "done": "完成",
    "blocked": "阻塞",
    "review": "審核中",
    "testing": "測試中"
  };
  if (status in mcpStatusMap) {
    return mcpStatusMap[status];
  }
  if (status in frontendStatusMap) {
    return frontendStatusMap[status];
  }
  return status;
}
function getStatusTagClass(status) {
  const mcpStatusClasses = {
    // 優先級相關
    "urgent": "bg-red-600 text-white",
    "high": "bg-orange-500 text-white",
    "medium": "bg-yellow-500 text-white",
    "low": "bg-green-500 text-white",
    // 時間相關
    "due-today": "bg-red-500 text-white",
    "due-tomorrow": "bg-orange-400 text-white",
    "overdue": "bg-red-700 text-white",
    // 難度相關
    "quick-task": "bg-blue-400 text-white",
    "complex-task": "bg-purple-600 text-white",
    "research-needed": "bg-indigo-500 text-white",
    // 依賴關係
    "waiting-approval": "bg-yellow-600 text-white",
    "waiting-others": "bg-gray-600 text-white",
    "prerequisites": "bg-pink-500 text-white",
    // 特殊狀態
    "meeting-required": "bg-teal-500 text-white",
    "external-dependency": "bg-gray-500 text-white",
    "one-time": "bg-cyan-500 text-white",
    "recurring": "bg-lime-500 text-white"
  };
  const frontendStatusClasses = {
    "todo": "bg-gray-500 text-white",
    "in-progress": "bg-blue-500 text-white",
    "done": "bg-green-500 text-white",
    "blocked": "bg-red-500 text-white",
    "review": "bg-yellow-500 text-white",
    "testing": "bg-purple-500 text-white"
  };
  if (status in mcpStatusClasses) {
    return mcpStatusClasses[status];
  }
  if (status in frontendStatusClasses) {
    return frontendStatusClasses[status];
  }
  return "bg-gray-400 text-white";
}
const _sfc_main$c = /* @__PURE__ */ defineComponent({
  __name: "Card",
  __ssrInlineRender: true,
  props: {
    card: {}
  },
  emits: ["openModal"],
  setup(__props, { emit: __emit }) {
    useCardActions();
    const isEditing = ref(false);
    const editingTitle = ref("");
    ref(null);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "bg-white rounded px-3 py-3 mb-2 shadow-sm transition-shadow duration-200 hover:shadow-md relative group min-h-16 cursor-pointer" }, _attrs))}>`);
      if (!isEditing.value) {
        _push(`<div class="min-h-6 pr-8 pb-6">${ssrInterpolate(_ctx.card.title)} (pos: ${ssrInterpolate(_ctx.card.position)}) </div>`);
      } else {
        _push(`<!---->`);
      }
      if (!isEditing.value) {
        _push(`<div class="absolute bottom-2 left-3 right-3 flex justify-between items-center">`);
        if (_ctx.card.description && _ctx.card.description.trim()) {
          _push(`<div class="flex items-center"><svg class="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 10h16M4 14h16M4 18h16"></path></svg></div>`);
        } else {
          _push(`<div></div>`);
        }
        _push(`<div class="flex gap-1">`);
        if (_ctx.card.status) {
          _push(`<span class="${ssrRenderClass([unref(getStatusTagClass)(_ctx.card.status), "text-xs px-2 py-1 rounded-sm font-medium"])}">${ssrInterpolate(unref(formatStatus)(_ctx.card.status))}</span>`);
        } else {
          _push(`<span class="bg-gray-400 text-white text-xs px-2 py-1 rounded-sm"> 一般 </span>`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
      if (!isEditing.value) {
        _push(`<button class="absolute top-2 right-2 p-1 rounded hover:bg-red-100 transition-colors duration-200 opacity-0 group-hover:opacity-100" title="刪除卡片"><svg class="w-4 h-4 text-red-600 hover:text-red-800" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg></button>`);
      } else {
        _push(`<input${ssrRenderAttr("value", editingTitle.value)} class="w-full bg-transparent border-none outline-none min-h-6" type="text">`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$c = _sfc_main$c.setup;
_sfc_main$c.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/Card.vue");
  return _sfc_setup$c ? _sfc_setup$c(props, ctx) : void 0;
};
const useListMenu = () => {
  const store = useBoardStore();
  const { openMenuId } = storeToRefs(store);
  const toggleMenu = (listId) => {
    console.log("🎮 [COMPOSABLE] toggleMenu 被呼叫，列表ID:", listId);
    store.toggleMenu(listId);
  };
  const closeAllMenus = () => {
    console.log("🎮 [COMPOSABLE] closeAllMenus 被呼叫");
    store.closeAllMenus();
  };
  return {
    openMenuId,
    // 響應式的開啟選單 ID
    toggleMenu,
    // 切換選單方法
    closeAllMenus
    // 關閉所有選單方法
  };
};
const _sfc_main$b = /* @__PURE__ */ defineComponent({
  __name: "ListMenu",
  __ssrInlineRender: true,
  props: {
    listId: {}
  },
  emits: ["add-card", "delete-list"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const { openMenuId } = useListMenu();
    const isMenuOpen = computed(() => openMenuId.value === props.listId);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "relative list-menu-container" }, _attrs))}><button class="p-1 rounded hover:bg-gray-300 transition-colors duration-200"><svg class="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg></button>`);
      if (isMenuOpen.value) {
        _push(`<div class="absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-2 w-40 z-10"><button class="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors duration-200"> 新增卡片 </button><button class="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors duration-200"> 刪除列表 </button></div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$b = _sfc_main$b.setup;
_sfc_main$b.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ListMenu.vue");
  return _sfc_setup$b ? _sfc_setup$b(props, ctx) : void 0;
};
const inputState = ref({
  show: false
});
const useInputDialog = () => {
  const showInput = (options) => {
    console.log("🎭 [INPUT] 顯示輸入對話框:", options);
    return new Promise((resolve) => {
      inputState.value = {
        show: true,
        title: options.title,
        message: options.message,
        placeholder: options.placeholder,
        confirmText: options.confirmText,
        cancelText: options.cancelText,
        initialValue: options.initialValue,
        resolve
      };
    });
  };
  const handleConfirm = (value) => {
    console.log("✅ [INPUT] 用戶點擊確認，輸入值:", value);
    const { resolve } = inputState.value;
    inputState.value.show = false;
    if (resolve) {
      resolve(value);
    }
  };
  const handleCancel = () => {
    console.log("❌ [INPUT] 用戶點擊取消");
    const { resolve } = inputState.value;
    inputState.value.show = false;
    if (resolve) {
      resolve(null);
    }
  };
  return {
    // 對話框狀態（供組件綁定）
    inputState: readonly(inputState),
    // 方法
    showInput,
    handleConfirm,
    handleCancel
  };
};
class CardTitleValidationStrategy {
  validate(title) {
    const errors = [];
    if (!title || typeof title !== "string") {
      errors.push("卡片標題不能為空");
    } else {
      if (title.trim().length === 0) {
        errors.push("卡片標題不能只有空白");
      }
      if (title.length > 100) {
        errors.push("卡片標題不能超過 100 個字元");
      }
      if (title.includes("<") || title.includes(">")) {
        errors.push("卡片標題不能包含 HTML 標籤");
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
class ListTitleValidationStrategy {
  validate(title) {
    const errors = [];
    if (!title || typeof title !== "string") {
      errors.push("列表標題不能為空");
    } else {
      if (title.trim().length === 0) {
        errors.push("列表標題不能只有空白");
      }
      if (title.length > 50) {
        errors.push("列表標題不能超過 50 個字元");
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
class EmailValidationStrategy {
  validate(email) {
    const errors = [];
    if (!email || typeof email !== "string") {
      errors.push("電子郵件不能為空");
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push("請輸入有效的電子郵件格式");
      }
    }
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
class Validator {
  constructor(strategy) {
    this.strategy = strategy;
  }
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  validate(value) {
    return this.strategy.validate(value);
  }
  // 靜態方法提供快速驗證
  static validateCardTitle(title) {
    const validator = new Validator(new CardTitleValidationStrategy());
    return validator.validate(title);
  }
  static validateListTitle(title) {
    const validator = new Validator(new ListTitleValidationStrategy());
    return validator.validate(title);
  }
  static validateEmail(email) {
    const validator = new Validator(new EmailValidationStrategy());
    return validator.validate(email);
  }
}
class NotificationBuilder {
  notification = {
    id: this.generateId(),
    type: "info",
    duration: 5e3,
    timestamp: /* @__PURE__ */ new Date()
  };
  setTitle(title) {
    this.notification.title = title;
    return this;
  }
  setMessage(message) {
    this.notification.message = message;
    return this;
  }
  setType(type) {
    this.notification.type = type;
    return this;
  }
  setDuration(duration) {
    this.notification.duration = duration;
    return this;
  }
  addAction(label, action) {
    if (!this.notification.actions) {
      this.notification.actions = [];
    }
    this.notification.actions.push({ label, action });
    return this;
  }
  // 快速建立常用類型的通知
  static success(message) {
    return new NotificationBuilder().setType("success").setTitle("操作成功").setMessage(message).setDuration(3e3);
  }
  static error(message) {
    return new NotificationBuilder().setType("error").setTitle("操作失敗").setMessage(message).setDuration(5e3);
  }
  build() {
    if (!this.notification.title || !this.notification.message) {
      throw new Error("通知必須包含標題和訊息");
    }
    return this.notification;
  }
  generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
class EventBus {
  /**
   * 🏠 靜態實例 - 整個應用共用的唯一 EventBus
   * 
   * 🤔 為什麼要用 static？
   * - 確保整個應用只有一個廣播系統
   * - 就像學校只有一個廣播室，不會有兩個廣播室同時廣播
   */
  static instance;
  /**
   * 📻 監聽器容器 - 存放所有「喇叭」的地方
   * 
   * 🤔 Map 結構說明：
   * - Key: 事件名稱 (例如: 'card:created')
   * - Value: 監聽這個事件的所有函數陣列
   * 
   * 📝 例子：
   * Map {
   *   'card:created' => [函數A, 函數B, 函數C],
   *   'list:deleted' => [函數D, 函數E]
   * }
   */
  listeners = /* @__PURE__ */ new Map();
  /**
   * 🏗️ 單例模式 - 取得唯一的 EventBus 實例
   * 
   * 🤔 什麼是單例模式？
   * - 就像政府只能有一個總統
   * - 確保整個應用只有一個事件廣播系統
   * - 無論在哪裡呼叫，都會得到同一個 EventBus
   * 
   * 📝 使用方式：
   * const eventBus1 = EventBus.getInstance()
   * const eventBus2 = EventBus.getInstance()
   * // eventBus1 === eventBus2 (是同一個物件)
   */
  static getInstance() {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }
  /**
   * 🔊 訂閱事件 - 在教室裡安裝喇叭
   * 
   * 🤔 這個函數做什麼？
   * - 告訴系統：「當 XXX 事件發生時，請呼叫我的函數」
   * - 就像在教室安裝喇叭，當廣播時就會播放
   * 
   * 📝 使用例子：
   * eventBus.on('card:created', (data) => {
   *   console.log('有新卡片:', data.title)
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要監聽的事件名稱 (例如: 'card:created')
   * @param callback - 事件發生時要執行的函數
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }
  /**
   * 🔇 取消訂閱 - 把教室的喇叭拆掉
   * 
   * 🤔 這個函數做什麼？
   * - 告訴系統：「我不想再聽這個事件了」
   * - 就像把教室的喇叭拆掉，之後廣播就聽不到了
   * 
   * 📝 使用例子：
   * const myCallback = (data) => console.log(data)
   * eventBus.on('card:created', myCallback)     // 開始監聽
   * eventBus.off('card:created', myCallback)    // 停止監聽
   * 
   * 🔧 參數說明：
   * @param event - 要停止監聽的事件名稱
   * @param callback - 要移除的監聽函數（必須是同一個函數物件）
   */
  off(event, callback) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      const index = eventListeners.indexOf(callback);
      if (index > -1) {
        eventListeners.splice(index, 1);
        if (eventListeners.length === 0) {
          this.listeners.delete(event);
        }
      }
    }
  }
  /**
   * 📢 發布事件 - 校長對著廣播系統說話
   * 
   * 🤔 這個函數做什麼？
   * - 向所有監聽這個事件的函數發送訊息
   * - 就像校長說「下課了」，所有教室的喇叭都會播放
   * 
   * 📝 使用例子：
   * eventBus.emit('card:created', {
   *   cardId: '123',
   *   listId: 'abc',
   *   title: '我的新卡片'
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要發布的事件名稱
   * @param data - 要傳送的資料
   */
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      [...eventListeners].forEach((callback) => {
        try {
          callback(data);
        } catch (error) {
          console.error(`事件處理器錯誤 [${event}]:`, error);
        }
      });
    }
  }
  /**
   * 🎯 一次性訂閱 - 只聽一次就自動拆掉喇叭
   * 
   * 🤔 這個函數做什麼？
   * - 監聽事件，但只觸發一次，之後就自動停止監聽
   * - 就像臨時裝個喇叭，聽到廣播後就自動拆掉
   * 
   * 📝 使用場景：
   * - 等待使用者第一次登入
   * - 等待某個一次性的初始化完成
   * - 等待某個只會發生一次的事件
   * 
   * 💡 使用例子：
   * eventBus.once('user:login', (data) => {
   *   console.log('歡迎首次登入!', data.email)
   *   // 這個函數只會執行一次，之後就不會再執行了
   * })
   * 
   * 🔧 參數說明：
   * @param event - 要監聽的事件名稱
   * @param callback - 事件發生時要執行的函數（只執行一次）
   */
  once(event, callback) {
    const onceCallback = (data) => {
      try {
        callback(data);
      } finally {
        this.off(event, onceCallback);
      }
    };
    this.on(event, onceCallback);
  }
  /**
   * 🧹 清除所有監聽器 - 把學校所有喇叭都拆掉
   * 
   * 🤔 什麼時候會用到？
   * - 應用程式關閉時
   * - 重置整個事件系統時
   * - 測試完成後清理環境時
   * 
   * ⚠️ 注意：這會移除所有事件的所有監聽器！
   * 
   * 📝 使用例子：
   * // 在應用關閉時清理
   * window.addEventListener('beforeunload', () => {
   *   eventBus.removeAllListeners()
   * })
   */
  removeAllListeners() {
    this.listeners.clear();
  }
  /**
   * 🔍 除錯功能 - 查看目前有多少喇叭在運作
   * 
   * 🤔 這個函數做什麼？
   * - 幫助開發者了解目前有多少監聽器在運作
   * - 用來除錯或監控系統狀態
   * 
   * 📝 使用例子：
   * // 查看特定事件的監聽器數量
   * const count = eventBus.getListenerCount('card:created')  // 回傳數字
   * 
   * // 查看所有事件的監聽器數量
   * const allCounts = eventBus.getListenerCount()  // 回傳物件
   * // 結果像這樣：{ 'card:created': 3, 'list:deleted': 1 }
   * 
   * 🔧 參數說明：
   * @param event - 可選，指定要查看的事件名稱
   * @returns 如果有指定事件，回傳數字；如果沒指定，回傳所有事件的統計物件
   */
  getListenerCount(event) {
    if (event) {
      return this.listeners.get(event)?.length || 0;
    }
    const counts = {};
    this.listeners.forEach((listeners, eventName) => {
      counts[eventName] = listeners.length;
    });
    return counts;
  }
}
const eventBus = EventBus.getInstance();
const useListActions = () => {
  const boardStore = useBoardStore();
  const { showConfirm } = useConfirmDialog();
  const { showInput } = useInputDialog();
  const addCard = async (listId) => {
    const cardTitle = await showInput({
      title: "新增卡片",
      message: "請輸入新卡片的標題",
      placeholder: "卡片標題...",
      confirmText: "新增",
      cancelText: "取消"
    });
    if (!cardTitle) {
      console.log("❌ [COMPOSABLE] 用戶取消或未輸入卡片標題");
      return;
    }
    console.log("✅ [COMPOSABLE] 用戶輸入卡片標題:", cardTitle);
    const validation = Validator.validateCardTitle(cardTitle);
    if (!validation.isValid) {
      const notification = NotificationBuilder.error(`卡片標題不符合規範：${validation.errors.join(", ")}`).build();
      showNotification(notification);
      return;
    }
    try {
      await boardStore.addCard(listId, cardTitle.trim());
      eventBus.emit("card:created", {
        cardId: "temp-id",
        // 實際應該從 API 回應取得
        listId,
        title: cardTitle.trim()
      });
      const successNotification = NotificationBuilder.success("卡片已成功新增").build();
      showNotification(successNotification);
    } catch (error) {
      const errorNotification = NotificationBuilder.error("新增卡片失敗，請稍後再試").build();
      showNotification(errorNotification);
      eventBus.emit("error:occurred", {
        error,
        context: "addCard"
      });
    }
  };
  const deleteList = async (listId) => {
    console.log("🗑️ [COMPOSABLE] deleteList 被呼叫，參數:", { listId });
    const targetList = boardStore.board.lists.find((list) => list.id === listId);
    const listTitle = targetList?.title || "未知列表";
    const cardsCount = targetList?.cards.length || 0;
    console.log("💬 [COMPOSABLE] 顯示刪除確認對話框...");
    const confirmed = await showConfirm({
      title: "刪除列表",
      message: `確定要刪除列表 "${listTitle}" 嗎？${cardsCount > 0 ? `此列表包含 ${cardsCount} 張卡片，` : ""}此操作無法撤銷。`,
      confirmText: "刪除",
      cancelText: "取消",
      dangerMode: true
    });
    if (!confirmed) {
      console.log("❌ [COMPOSABLE] 用戶取消刪除操作");
      return;
    }
    console.log("✅ [COMPOSABLE] 用戶確認刪除，開始執行刪除流程...");
    try {
      console.log("📤 [COMPOSABLE] 呼叫 boardStore.removeList()...");
      await boardStore.removeList(listId);
      console.log("✅ [COMPOSABLE] boardStore.removeList() 執行成功");
      console.log("📢 [COMPOSABLE] 發布 list:deleted 事件...");
      eventBus.emit("list:deleted", { listId });
      console.log("🎉 [COMPOSABLE] 建立成功通知...");
      const notification = NotificationBuilder.success("列表已成功刪除").build();
      console.log("📱 [COMPOSABLE] 顯示成功通知:", notification);
      showNotification(notification);
      console.log("✅ [COMPOSABLE] 列表刪除流程完成");
    } catch (error) {
      console.error("❌ [COMPOSABLE] 刪除列表過程中發生錯誤:");
      console.error("  🔍 錯誤類型:", typeof error);
      console.error("  🔍 錯誤內容:", error);
      if (error && typeof error === "object") {
        console.error("  🔍 錯誤詳情:", {
          message: error.message,
          statusCode: error.statusCode,
          statusMessage: error.statusMessage,
          data: error.data
        });
      }
      console.log("🚨 [COMPOSABLE] 建立錯誤通知...");
      const errorNotification = NotificationBuilder.error("刪除列表失敗，請稍後再試").build();
      console.log("📱 [COMPOSABLE] 顯示錯誤通知:", errorNotification);
      showNotification(errorNotification);
      console.log("📢 [COMPOSABLE] 發布 error:occurred 事件...");
      eventBus.emit("error:occurred", {
        error,
        context: "deleteList"
      });
      console.log("💥 [COMPOSABLE] 錯誤處理完成");
    }
  };
  const addList = async () => {
    const listTitle = await showInput({
      title: "新增列表",
      message: "請輸入新列表的標題",
      placeholder: "列表標題...",
      confirmText: "新增",
      cancelText: "取消"
    });
    if (!listTitle) {
      console.log("❌ [COMPOSABLE] 用戶取消或未輸入列表標題");
      return;
    }
    console.log("✅ [COMPOSABLE] 用戶輸入列表標題:", listTitle);
    const validation = Validator.validateListTitle(listTitle);
    if (!validation.isValid) {
      const notification = NotificationBuilder.error(`列表標題不符合規範：${validation.errors.join(", ")}`).build();
      showNotification(notification);
      return;
    }
    try {
      await boardStore.addList(listTitle.trim());
      eventBus.emit("list:created", {
        listId: "temp-id",
        title: listTitle.trim()
      });
      const notification = NotificationBuilder.success("列表已成功新增").build();
      showNotification(notification);
    } catch (error) {
      const errorNotification = NotificationBuilder.error("新增列表失敗，請稍後再試").build();
      showNotification(errorNotification);
      eventBus.emit("error:occurred", {
        error,
        context: "addList"
      });
    }
  };
  const updateListTitle = async (listId, newTitle) => {
    console.log("📝 [COMPOSABLE] updateListTitle 被呼叫，參數:", { listId, newTitle });
    const normalizedTitle = newTitle.trim();
    if (!normalizedTitle) {
      console.warn("❌ [COMPOSABLE] 列表標題不能為空");
      const errorNotification = NotificationBuilder.error("列表標題不能為空").build();
      showNotification(errorNotification);
      return;
    }
    const validation = Validator.validateListTitle(normalizedTitle);
    if (!validation.isValid) {
      const notification = NotificationBuilder.error(`列表標題不符合規範：${validation.errors.join(", ")}`).build();
      showNotification(notification);
      return;
    }
    try {
      const target = boardStore.board.lists.find((l) => l.id === listId);
      if (!target) {
        console.warn("❌ [COMPOSABLE] 找不到對應的列表，無法更新標題");
        const notFoundNotification = NotificationBuilder.error("找不到對應的列表，請重新整理後再試").build();
        showNotification(notFoundNotification);
        return;
      }
      if (target.title?.trim() === normalizedTitle) {
        console.log("ℹ️ [COMPOSABLE] 標題未變更，略過更新");
        return;
      }
      console.log("📤 [COMPOSABLE] 呼叫 boardStore.updateListTitle()...");
      await boardStore.updateListTitle(listId, normalizedTitle);
      console.log("✅ [COMPOSABLE] boardStore.updateListTitle() 執行成功");
      console.log("📢 [COMPOSABLE] 發布 list:title-updated 事件...");
      eventBus.emit("list:title-updated", {
        listId,
        newTitle: normalizedTitle
      });
      console.log("🎉 [COMPOSABLE] 建立成功通知...");
      const notification = NotificationBuilder.success("列表標題已成功更新").build();
      console.log("📱 [COMPOSABLE] 顯示成功通知:", notification);
      showNotification(notification);
      console.log("✅ [COMPOSABLE] 列表標題更新流程完成");
    } catch (error) {
      console.error("❌ [COMPOSABLE] 更新列表標題過程中發生錯誤:");
      console.error("  🔍 錯誤類型:", typeof error);
      console.error("  🔍 錯誤內容:", error);
      if (error && typeof error === "object") {
        console.error("  🔍 錯誤詳情:", {
          message: error.message,
          statusCode: error.statusCode,
          statusMessage: error.statusMessage,
          data: error.data
        });
      }
      console.log("🚨 [COMPOSABLE] 建立錯誤通知...");
      const errorNotification = NotificationBuilder.error("更新列表標題失敗，請稍後再試").build();
      console.log("📱 [COMPOSABLE] 顯示錯誤通知:", errorNotification);
      showNotification(errorNotification);
      console.log("📢 [COMPOSABLE] 發布 error:occurred 事件...");
      eventBus.emit("error:occurred", {
        error,
        context: "updateListTitle"
      });
      console.log("💥 [COMPOSABLE] 錯誤處理完成");
      throw error;
    }
  };
  const showNotification = (notification) => {
    console.log(`[${notification.type.toUpperCase()}] ${notification.title}: ${notification.message}`);
  };
  return {
    addCard,
    deleteList,
    addList,
    updateListTitle
  };
};
const _sfc_main$a = /* @__PURE__ */ defineComponent({
  __name: "ListItem",
  __ssrInlineRender: true,
  props: {
    list: {}
  },
  emits: ["card-move", "open-card-modal"],
  setup(__props) {
    const props = __props;
    const { addCard, deleteList } = useListActions();
    const isEditingTitle = ref(false);
    const editingTitle = ref("");
    ref(null);
    const handleAddCard = () => {
      addCard(props.list.id);
    };
    const handleDeleteList = () => {
      deleteList(props.list.id);
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: "bg-gray-200 rounded w-80 p-2 flex-shrink-0",
        "data-list-id": _ctx.list.id
      }, _attrs))}><div class="cursor-pointer flex justify-between items-center p-2 mb-2 relative">`);
      if (!isEditingTitle.value) {
        _push(`<h2 class="w-full text-base font-bold select-none cursor-pointer hover:bg-gray-100 px-2 py-1 rounded">${ssrInterpolate(_ctx.list.title)}</h2>`);
      } else {
        _push(`<input${ssrRenderAttr("value", editingTitle.value)} class="w-full text-base font-bold bg-white border-2 border-blue-400 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all">`);
      }
      _push(ssrRenderComponent(_sfc_main$b, {
        "list-id": _ctx.list.id,
        onAddCard: handleAddCard,
        onDeleteList: handleDeleteList
      }, null, _parent));
      _push(`</div>`);
      _push(ssrRenderComponent(unref(VueDraggableNext), {
        class: "min-h-5",
        list: _ctx.list.cards,
        group: "cards",
        tag: "div",
        onChange: ($event) => _ctx.$emit("card-move", $event)
      }, {
        default: withCtx((_, _push2, _parent2, _scopeId) => {
          if (_push2) {
            _push2(`<!--[-->`);
            ssrRenderList(_ctx.list.cards, (card) => {
              _push2(`<div${_scopeId}>`);
              _push2(ssrRenderComponent(_sfc_main$c, {
                card,
                onOpenModal: ($event) => _ctx.$emit("open-card-modal", card)
              }, null, _parent2, _scopeId));
              _push2(`</div>`);
            });
            _push2(`<!--]-->`);
          } else {
            return [
              (openBlock(true), createBlock(Fragment, null, renderList(_ctx.list.cards, (card) => {
                return openBlock(), createBlock("div", {
                  key: card.id
                }, [
                  createVNode(_sfc_main$c, {
                    card,
                    onOpenModal: ($event) => _ctx.$emit("open-card-modal", card)
                  }, null, 8, ["card", "onOpenModal"])
                ]);
              }), 128))
            ];
          }
        }),
        _: 1
      }, _parent));
      _push(`<button class="w-full p-3 bg-transparent border-2 border-dashed border-gray-300 rounded text-gray-600 cursor-pointer text-sm mt-2 transition-all duration-200 hover:bg-gray-100 hover:border-gray-400 hover:text-gray-800"> + 新增卡片 </button></div>`);
    };
  }
});
const _sfc_setup$a = _sfc_main$a.setup;
_sfc_main$a.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ListItem.vue");
  return _sfc_setup$a ? _sfc_setup$a(props, ctx) : void 0;
};
const _sfc_main$9 = /* @__PURE__ */ defineComponent({
  __name: "CardModal",
  __ssrInlineRender: true,
  props: {
    show: { type: Boolean },
    card: {}
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    useCardActions();
    const localTitle = ref("");
    const localDescription = ref("");
    const isDescriptionEditing = ref(false);
    watch(() => props.card, (newCard) => {
      if (newCard) {
        localTitle.value = newCard.title;
        localDescription.value = newCard.description || "";
      }
    }, { immediate: true });
    return (_ctx, _push, _parent, _attrs) => {
      if (_ctx.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4"><div class="mb-4"><label class="block text-sm font-medium text-gray-700 mb-2">卡片標題</label><input${ssrRenderAttr("value", localTitle.value)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" type="text" placeholder="輸入卡片標題..."></div><div class="mb-6"><label class="block text-sm font-medium text-gray-700 mb-2">描述</label><textarea class="${ssrRenderClass([
          "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-all duration-200",
          isDescriptionEditing.value ? "min-h-32" : "min-h-16"
        ])}"${ssrRenderAttr("rows", isDescriptionEditing.value ? 6 : 2)} placeholder="新增更詳細的描述...">${ssrInterpolate(localDescription.value)}</textarea></div>`);
        if (isDescriptionEditing.value) {
          _push(`<div class="flex justify-end gap-2"><button class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50 transition-colors"> 取消 </button><button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"> 儲存 </button></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$9 = _sfc_main$9.setup;
_sfc_main$9.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/CardModal.vue");
  return _sfc_setup$9 ? _sfc_setup$9(props, ctx) : void 0;
};
const _sfc_main$8 = /* @__PURE__ */ defineComponent({
  __name: "SkeletonLoader",
  __ssrInlineRender: true,
  props: {
    size: { default: "md" },
    text: {},
    color: { default: "#3B82F6" },
    animate: { type: Boolean, default: true }
  },
  setup(__props) {
    const props = __props;
    const displayText = ref("");
    const currentIndex = ref(0);
    const isTyping = ref(true);
    watch(() => props.text, () => {
      if (!props.animate) {
        displayText.value = props.text || "";
        return;
      }
      currentIndex.value = 0;
      isTyping.value = true;
      displayText.value = "";
    }, { immediate: true });
    return (_ctx, _push, _parent, _attrs) => {
      const _cssVars = { style: {
        ":--1e8a0217": _ctx.color
      } };
      _push(`<div${ssrRenderAttrs(mergeProps({
        class: ["loading-spinner", { [`size-${_ctx.size}`]: true }],
        role: "status",
        "aria-label": _ctx.text || "載入中",
        tabindex: "0"
      }, _attrs, _cssVars))} data-v-9079f87b><div class="spinner-ring" data-v-9079f87b></div>`);
      if (_ctx.text !== void 0 && _ctx.text !== null) {
        _push(`<div class="loading-text" data-v-9079f87b>${ssrInterpolate(displayText.value)}</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _export_sfc = (sfc, props) => {
  const target = sfc.__vccOpts || sfc;
  for (const [key, val] of props) {
    target[key] = val;
  }
  return target;
};
const _sfc_setup$8 = _sfc_main$8.setup;
_sfc_main$8.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/SkeletonLoader.vue");
  return _sfc_setup$8 ? _sfc_setup$8(props, ctx) : void 0;
};
const __nuxt_component_0 = /* @__PURE__ */ _export_sfc(_sfc_main$8, [["__scopeId", "data-v-9079f87b"]]);
const _sfc_main$7 = /* @__PURE__ */ defineComponent({
  __name: "TrelloBoard",
  __ssrInlineRender: true,
  setup(__props) {
    const boardStore = useBoardStore();
    useListActions();
    const showCardModal = ref(false);
    const selectedCard = ref(null);
    const onCardMove = async (event) => {
      console.log("📦 [COMPONENT] Card moved event:", event);
      if (event.added) {
        console.log("🔄 [COMPONENT] 卡片被新增到列表:", event.added);
        console.log("📝 [COMPONENT] 跨列表移動的 added 事件，由 removed 事件統一處理");
      }
      if (event.moved) {
        console.log("🔄 [COMPONENT] 卡片在列表內移動:", event.moved);
        const { element: card } = event.moved;
        let currentListId = null;
        for (const list of boardStore.board.lists) {
          const foundCard = list.cards.find((c) => c.id === card.id);
          if (foundCard) {
            currentListId = list.id;
            break;
          }
        }
        if (currentListId) {
          try {
            console.log(`🚀 [COMPONENT] 同一列表內移動，重新整理列表 ${currentListId} 的位置`);
            await boardStore.moveCardAndReorder([currentListId]);
            console.log("✅ [COMPONENT] 成功更新列表內卡片位置");
          } catch (error) {
            console.error("❌ [COMPONENT] 更新卡片位置失敗:", error);
          }
        }
      }
      if (event.removed) {
        console.log("📤 [COMPONENT] 卡片從列表被移除（跨列表移動）:", event.removed);
        const { element: card } = event.removed;
        let targetListId = null;
        for (const list of boardStore.board.lists) {
          const foundCard = list.cards.find((c) => c.id === card.id);
          if (foundCard) {
            targetListId = list.id;
            break;
          }
        }
        let sourceListId = null;
        if (event.from) {
          const sourceContainer = event.from.closest("[data-list-id]");
          if (sourceContainer) {
            sourceListId = sourceContainer.getAttribute("data-list-id");
            console.log("✅ [COMPONENT] 方法1成功獲取 sourceListId:", sourceListId);
          }
        }
        if (!sourceListId && targetListId) {
          console.log("⚠️ [COMPONENT] 方法1失敗，嘗試方法2：排除法推算 sourceListId");
          for (const list of boardStore.board.lists) {
            if (list.id !== targetListId) {
              const hasGaps = list.cards.some((c, index) => c.position !== void 0 && c.position !== index);
              if (hasGaps) {
                sourceListId = list.id;
                console.log("✅ [COMPONENT] 方法2推算出 sourceListId:", sourceListId);
                break;
              }
            }
          }
        }
        if (!sourceListId && targetListId) {
          console.log("⚠️ [COMPONENT] 方法1和2都失敗，使用方法3：重新整理所有列表");
          try {
            const allListIds = boardStore.board.lists.map((list) => list.id);
            await boardStore.moveCardAndReorder(allListIds);
            console.log("✅ [COMPONENT] 方法3：成功重新整理所有列表位置");
            return;
          } catch (error) {
            console.error("❌ [COMPONENT] 方法3失敗:", error);
          }
        }
        if (targetListId) {
          const listsToUpdate = sourceListId ? [sourceListId, targetListId] : [targetListId];
          try {
            console.log(`🚀 [COMPONENT] 跨列表移動：${sourceListId || "未知"} → ${targetListId}`);
            console.log(`📋 [COMPONENT] 需要更新的列表:`, listsToUpdate);
            await boardStore.moveCardAndReorder(listsToUpdate);
            console.log("✅ [COMPONENT] 成功完成跨列表移動並重新整理位置");
          } catch (error) {
            console.error("❌ [COMPONENT] 跨列表移動失敗:", error);
            console.log("🔄 [COMPONENT] 嘗試重新載入看板資料...");
          }
        } else {
          console.warn("⚠️ [COMPONENT] 無法識別 targetListId，跳過跨列表移動處理");
          console.log("📊 [COMPONENT] 當前看板狀態:", {
            listsCount: boardStore.board.lists.length,
            cardId: card.id,
            cardTitle: card.title
          });
        }
      }
    };
    const onListMove = async (event) => {
      console.log("📋 [COMPONENT] List moved event:", event);
      if (event.moved) {
        console.log("🔄 [COMPONENT] 列表在看板內移動:", event.moved);
        try {
          console.log("💾 [COMPONENT] 委派保存列表順序到 Store...");
          await boardStore.saveListPositions();
          console.log("✅ [COMPONENT] 列表位置已更新");
        } catch (error) {
          console.error("❌ [COMPONENT] 更新列表順序失敗:", error);
        }
      }
    };
    console.log("🖼️ [COMPONENT] TrelloBoard 載入，目前 lists 數量:", boardStore.board.lists.length);
    console.log("🖼️ [COMPONENT] TrelloBoard lists 內容:", boardStore.board.lists);
    const openCardModal = (card) => {
      selectedCard.value = card;
      showCardModal.value = true;
    };
    const closeCardModal = () => {
      showCardModal.value = false;
      selectedCard.value = null;
    };
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "flex gap-4 p-4 h-screen overflow-x-auto bg-gray-100 font-sans" }, _attrs))}>`);
      if (unref(boardStore).isLoading) {
        _push(`<div class="flex items-center justify-center w-full h-full"><div class="text-center">`);
        _push(ssrRenderComponent(__nuxt_component_0, {
          size: "lg",
          text: unref(MESSAGES).board.loadingFromCloud,
          color: "#3B82F6",
          animate: true
        }, null, _parent));
        _push(`</div></div>`);
      } else {
        _push(`<!--[-->`);
        _push(ssrRenderComponent(unref(VueDraggableNext), {
          class: "flex gap-4",
          list: unref(boardStore).board.lists,
          onChange: onListMove,
          tag: "div"
        }, {
          default: withCtx((_, _push2, _parent2, _scopeId) => {
            if (_push2) {
              _push2(`<!--[-->`);
              ssrRenderList(unref(boardStore).board.lists, (list) => {
                _push2(ssrRenderComponent(_sfc_main$a, {
                  key: list.id,
                  list,
                  onCardMove,
                  onOpenCardModal: openCardModal
                }, null, _parent2, _scopeId));
              });
              _push2(`<!--]-->`);
            } else {
              return [
                (openBlock(true), createBlock(Fragment, null, renderList(unref(boardStore).board.lists, (list) => {
                  return openBlock(), createBlock(_sfc_main$a, {
                    key: list.id,
                    list,
                    onCardMove,
                    onOpenCardModal: openCardModal
                  }, null, 8, ["list"]);
                }), 128))
              ];
            }
          }),
          _: 1
        }, _parent));
        _push(`<div class="bg-gray-200 rounded w-80 p-2 flex-shrink-0 flex items-start"><button class="w-full p-3 bg-transparent border-2 border-dashed border-gray-400 rounded text-gray-700 cursor-pointer text-sm transition-all duration-200 hover:bg-gray-300 hover:border-gray-500"> + ${ssrInterpolate(unref(MESSAGES).list.addNew)}</button></div><!--]-->`);
      }
      _push(ssrRenderComponent(_sfc_main$9, {
        show: showCardModal.value,
        card: selectedCard.value,
        onClose: closeCardModal
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$7 = _sfc_main$7.setup;
_sfc_main$7.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/TrelloBoard.vue");
  return _sfc_setup$7 ? _sfc_setup$7(props, ctx) : void 0;
};
const _sfc_main$6 = /* @__PURE__ */ defineComponent({
  __name: "GoogleLoginButton",
  __ssrInlineRender: true,
  setup(__props) {
    const isLoading = ref(false);
    const { $supabase } = useNuxtApp();
    return (_ctx, _push, _parent, _attrs) => {
      const _component_SkeletonLoader = __nuxt_component_0;
      _push(`<div${ssrRenderAttrs(mergeProps({ class: "google-login-container" }, _attrs))} data-v-c3015906><button class="${ssrRenderClass([{ "loading": unref(isLoading) }, "google-login-btn"])}"${ssrIncludeBooleanAttr(unref(isLoading)) ? " disabled" : ""} data-v-c3015906><svg class="google-icon" width="20" height="20" viewBox="0 0 24 24" data-v-c3015906><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" data-v-c3015906></path><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" data-v-c3015906></path><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" data-v-c3015906></path><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" data-v-c3015906></path></svg><span data-v-c3015906>使用 Google 登錄</span></button>`);
      if (unref(isLoading)) {
        _push(`<div class="loading-message" data-v-c3015906>`);
        _push(ssrRenderComponent(_component_SkeletonLoader, {
          size: "sm",
          text: "登入中....",
          color: "#4285F4",
          animate: true
        }, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<!---->`);
      }
      _push(`</div>`);
    };
  }
});
const _sfc_setup$6 = _sfc_main$6.setup;
_sfc_main$6.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/GoogleLoginButton.vue");
  return _sfc_setup$6 ? _sfc_setup$6(props, ctx) : void 0;
};
const GoogleLoginButton = /* @__PURE__ */ _export_sfc(_sfc_main$6, [["__scopeId", "data-v-c3015906"]]);
const _sfc_main$5 = /* @__PURE__ */ defineComponent({
  __name: "ConfirmDialog",
  __ssrInlineRender: true,
  props: {
    show: { type: Boolean },
    title: { default: "確認操作" },
    message: {},
    confirmText: { default: "確認" },
    cancelText: { default: "取消" },
    dangerMode: { type: Boolean, default: false }
  },
  emits: ["confirm", "cancel"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    watch(
      () => props.show,
      (visible) => {
        {
          return;
        }
      },
      { immediate: true }
      // 立即執行一次，處理初始狀態
    );
    return (_ctx, _push, _parent, _attrs) => {
      if (_ctx.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4 shadow-xl transform transition-all duration-200 scale-100"><div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full"><svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"></path></svg></div><h3 class="text-lg font-semibold text-gray-900 text-center mb-2">${ssrInterpolate(_ctx.title || "確認操作")}</h3><p class="text-sm text-gray-600 text-center mb-6">${ssrInterpolate(_ctx.message)}</p><div class="flex gap-3 justify-end"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200">${ssrInterpolate(_ctx.cancelText || "取消")}</button><button class="${ssrRenderClass([
          "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 transition-colors duration-200",
          _ctx.dangerMode ? "bg-red-600 hover:bg-red-700 focus:ring-red-500" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        ])}">${ssrInterpolate(_ctx.confirmText || "確認")}</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$5 = _sfc_main$5.setup;
_sfc_main$5.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/ConfirmDialog.vue");
  return _sfc_setup$5 ? _sfc_setup$5(props, ctx) : void 0;
};
const _sfc_main$4 = /* @__PURE__ */ defineComponent({
  __name: "InputDialog",
  __ssrInlineRender: true,
  props: {
    show: { type: Boolean },
    title: { default: "輸入資訊" },
    message: {},
    placeholder: { default: "請輸入..." },
    confirmText: { default: "確認" },
    cancelText: { default: "取消" },
    initialValue: { default: "" }
  },
  emits: ["confirm", "cancel"],
  setup(__props, { emit: __emit }) {
    const props = __props;
    const inputValue = ref("");
    const inputRef = ref(null);
    watch(() => props.show, (newShow) => {
      if (newShow) {
        inputValue.value = props.initialValue;
        nextTick(() => {
          if (inputRef.value) {
            inputRef.value.focus();
            inputRef.value.select();
          }
        });
      }
    });
    return (_ctx, _push, _parent, _attrs) => {
      if (_ctx.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-lg p-6 w-96 max-w-full mx-4 shadow-xl transform transition-all duration-200 scale-100"><div class="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full"><svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg></div><h3 class="text-lg font-semibold text-gray-900 text-center mb-2">${ssrInterpolate(_ctx.title || "輸入資訊")}</h3>`);
        if (_ctx.message) {
          _push(`<p class="text-sm text-gray-600 text-center mb-4">${ssrInterpolate(_ctx.message)}</p>`);
        } else {
          _push(`<!---->`);
        }
        _push(`<div class="mb-6"><input${ssrRenderAttr("value", unref(inputValue))}${ssrRenderAttr("placeholder", _ctx.placeholder)} class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" type="text"></div><div class="flex gap-3 justify-end"><button class="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200">${ssrInterpolate(_ctx.cancelText || "取消")}</button><button${ssrIncludeBooleanAttr(!unref(inputValue).trim()) ? " disabled" : ""} class="${ssrRenderClass([
          "px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 transition-colors duration-200",
          !unref(inputValue).trim() ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500"
        ])}">${ssrInterpolate(_ctx.confirmText || "確認")}</button></div></div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$4 = _sfc_main$4.setup;
_sfc_main$4.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/InputDialog.vue");
  return _sfc_setup$4 ? _sfc_setup$4(props, ctx) : void 0;
};
const _sfc_main$3 = /* @__PURE__ */ defineComponent({
  __name: "AiTaskModal",
  __ssrInlineRender: true,
  props: {
    show: { type: Boolean }
  },
  emits: ["close"],
  setup(__props, { emit: __emit }) {
    const userInput = ref("");
    const cards = ref([]);
    const loading = ref(false);
    const errorMessage = ref("");
    useBoardStore();
    return (_ctx, _push, _parent, _attrs) => {
      if (_ctx.show) {
        _push(`<div${ssrRenderAttrs(mergeProps({ class: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" }, _attrs))}><div class="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"><div class="flex justify-between items-center mb-4"><h2 class="text-xl font-bold text-gray-800">AI 生成任務</h2><button class="text-gray-500 hover:text-gray-700 text-2xl leading-none"> × </button></div><div class="mb-6"><label class="block text-sm font-medium text-gray-700 mb-2"> 描述您需要的任務： </label><textarea placeholder="例如：我需要準備一個產品發表會，包含所有相關的準備工作..." class="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"${ssrIncludeBooleanAttr(loading.value) ? " disabled" : ""}>${ssrInterpolate(userInput.value)}</textarea></div><div class="flex gap-3 mb-6"><button${ssrIncludeBooleanAttr(!userInput.value.trim() || loading.value) ? " disabled" : ""} class="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors duration-200">`);
        if (loading.value) {
          _push(`<span class="flex items-center justify-center gap-2"><div class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> 生成中... </span>`);
        } else {
          _push(`<span>生成任務</span>`);
        }
        _push(`</button><button class="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"> 取消 </button></div>`);
        if (cards.value.length > 0) {
          _push(`<div class="border-t pt-4"><h3 class="text-lg font-semibold text-gray-800 mb-3">生成的任務 (${ssrInterpolate(cards.value.length)} 項)：</h3><div class="space-y-3 max-h-60 overflow-y-auto"><!--[-->`);
          ssrRenderList(cards.value, (card, index) => {
            _push(`<div class="p-3 bg-gray-50 rounded-lg border"><div class="flex justify-between items-start"><h4 class="font-medium text-gray-800 flex-1">${ssrInterpolate(card.title)}</h4>`);
            if (card.status) {
              _push(`<span class="${ssrRenderClass([unref(getStatusTagClass)(card.status), "ml-2 px-2 py-1 text-xs rounded-sm font-medium"])}">${ssrInterpolate(unref(formatStatus)(card.status))}</span>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
            if (card.description) {
              _push(`<p class="text-sm text-gray-600 mt-1">${ssrInterpolate(card.description)}</p>`);
            } else {
              _push(`<!---->`);
            }
            _push(`</div>`);
          });
          _push(`<!--]--></div><div class="mt-4 pt-4 border-t"><button class="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors duration-200"> 將這些任務加入看板 </button></div></div>`);
        } else {
          _push(`<!---->`);
        }
        if (errorMessage.value) {
          _push(`<div class="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg"><p class="text-red-700 text-sm">${ssrInterpolate(errorMessage.value)}</p></div>`);
        } else {
          _push(`<!---->`);
        }
        _push(`</div></div>`);
      } else {
        _push(`<!---->`);
      }
    };
  }
});
const _sfc_setup$3 = _sfc_main$3.setup;
_sfc_main$3.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("components/AiTaskModal.vue");
  return _sfc_setup$3 ? _sfc_setup$3(props, ctx) : void 0;
};
const _sfc_main$2 = /* @__PURE__ */ defineComponent({
  __name: "app",
  __ssrInlineRender: true,
  setup(__props) {
    const { $supabase } = useNuxtApp();
    useBoardStore();
    const { confirmState: confirmState2, handleConfirm, handleCancel } = useConfirmDialog();
    const { inputState: inputState2, handleConfirm: handleInputConfirm, handleCancel: handleInputCancel } = useInputDialog();
    const user = ref(null);
    const showAiModal = ref(false);
    return (_ctx, _push, _parent, _attrs) => {
      _push(`<div${ssrRenderAttrs(_attrs)}>`);
      if (unref(user)) {
        _push(`<div><header class="p-4 bg-gray-200 flex justify-between items-center"><div class="flex items-center gap-4"><h1 class="text-xl font-bold">${ssrInterpolate(unref(MESSAGES).board.title)}</h1><button class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm font-medium transition-colors duration-200"> AI 生成任務 </button></div><div class="flex items-center gap-4"><span class="text-sm">${ssrInterpolate(unref(user).email)}</span><button class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 text-sm">${ssrInterpolate(unref(MESSAGES).login.logoutButton)}</button></div></header>`);
        _push(ssrRenderComponent(_sfc_main$7, null, null, _parent));
        _push(`</div>`);
      } else {
        _push(`<div class="flex items-center justify-center h-screen bg-gray-100"><div class="p-8 bg-white rounded shadow-md w-full max-w-sm text-center"><h1 class="text-2xl font-bold mb-4">${ssrInterpolate(unref(MESSAGES).login.welcomeTitle)}</h1><p class="text-lg text-gray-700 mb-6">${ssrInterpolate(unref(MESSAGES).login.welcomeSubtitle)}</p><div class="mb-8 space-y-2"><p class="text-gray-600 font-medium">${ssrInterpolate(unref(MESSAGES).login.googlePrompt)}</p><p class="text-sm text-gray-500">${ssrInterpolate(unref(MESSAGES).login.privacyNote)}</p></div>`);
        _push(ssrRenderComponent(GoogleLoginButton, null, null, _parent));
        _push(`</div></div>`);
      }
      _push(ssrRenderComponent(_sfc_main$5, {
        show: unref(confirmState2).show,
        title: unref(confirmState2).title,
        message: unref(confirmState2).message,
        "confirm-text": unref(confirmState2).confirmText,
        "cancel-text": unref(confirmState2).cancelText,
        "danger-mode": unref(confirmState2).dangerMode,
        onConfirm: unref(handleConfirm),
        onCancel: unref(handleCancel)
      }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$4, {
        show: unref(inputState2).show,
        title: unref(inputState2).title,
        message: unref(inputState2).message,
        placeholder: unref(inputState2).placeholder,
        "confirm-text": unref(inputState2).confirmText,
        "cancel-text": unref(inputState2).cancelText,
        "initial-value": unref(inputState2).initialValue,
        onConfirm: unref(handleInputConfirm),
        onCancel: unref(handleInputCancel)
      }, null, _parent));
      _push(ssrRenderComponent(_sfc_main$3, {
        show: unref(showAiModal),
        onClose: ($event) => showAiModal.value = false
      }, null, _parent));
      _push(`</div>`);
    };
  }
});
const _sfc_setup$2 = _sfc_main$2.setup;
_sfc_main$2.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("app.vue");
  return _sfc_setup$2 ? _sfc_setup$2(props, ctx) : void 0;
};
const _sfc_main$1 = {
  __name: "nuxt-error-page",
  __ssrInlineRender: true,
  props: {
    error: Object
  },
  setup(__props) {
    const props = __props;
    const _error = props.error;
    _error.stack ? _error.stack.split("\n").splice(1).map((line) => {
      const text = line.replace("webpack:/", "").replace(".vue", ".js").trim();
      return {
        text,
        internal: line.includes("node_modules") && !line.includes(".cache") || line.includes("internal") || line.includes("new Promise")
      };
    }).map((i) => `<span class="stack${i.internal ? " internal" : ""}">${i.text}</span>`).join("\n") : "";
    const statusCode = Number(_error.statusCode || 500);
    const is404 = statusCode === 404;
    const statusMessage = _error.statusMessage ?? (is404 ? "Page Not Found" : "Internal Server Error");
    const description = _error.message || _error.toString();
    const stack = void 0;
    const _Error404 = defineAsyncComponent(() => import('./error-404-BnnziFLc.mjs'));
    const _Error = defineAsyncComponent(() => import('./error-500-BaqYVDN1.mjs'));
    const ErrorTemplate = is404 ? _Error404 : _Error;
    return (_ctx, _push, _parent, _attrs) => {
      _push(ssrRenderComponent(unref(ErrorTemplate), mergeProps({ statusCode: unref(statusCode), statusMessage: unref(statusMessage), description: unref(description), stack: unref(stack) }, _attrs), null, _parent));
    };
  }
};
const _sfc_setup$1 = _sfc_main$1.setup;
_sfc_main$1.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-error-page.vue");
  return _sfc_setup$1 ? _sfc_setup$1(props, ctx) : void 0;
};
const _sfc_main = {
  __name: "nuxt-root",
  __ssrInlineRender: true,
  setup(__props) {
    const IslandRenderer = () => null;
    const nuxtApp = useNuxtApp();
    nuxtApp.deferHydration();
    nuxtApp.ssrContext.url;
    const SingleRenderer = false;
    provide(PageRouteSymbol, useRoute());
    nuxtApp.hooks.callHookWith((hooks) => hooks.map((hook) => hook()), "vue:setup");
    const error = useError();
    const abortRender = error.value && !nuxtApp.ssrContext.error;
    onErrorCaptured((err, target, info) => {
      nuxtApp.hooks.callHook("vue:error", err, target, info).catch((hookError) => console.error("[nuxt] Error in `vue:error` hook", hookError));
      {
        const p = nuxtApp.runWithContext(() => showError(err));
        onServerPrefetch(() => p);
        return false;
      }
    });
    const islandContext = nuxtApp.ssrContext.islandContext;
    return (_ctx, _push, _parent, _attrs) => {
      ssrRenderSuspense(_push, {
        default: () => {
          if (unref(abortRender)) {
            _push(`<div></div>`);
          } else if (unref(error)) {
            _push(ssrRenderComponent(unref(_sfc_main$1), { error: unref(error) }, null, _parent));
          } else if (unref(islandContext)) {
            _push(ssrRenderComponent(unref(IslandRenderer), { context: unref(islandContext) }, null, _parent));
          } else if (unref(SingleRenderer)) {
            ssrRenderVNode(_push, createVNode(resolveDynamicComponent(unref(SingleRenderer)), null, null), _parent);
          } else {
            _push(ssrRenderComponent(unref(_sfc_main$2), null, null, _parent));
          }
        },
        _: 1
      });
    };
  }
};
const _sfc_setup = _sfc_main.setup;
_sfc_main.setup = (props, ctx) => {
  const ssrContext = useSSRContext();
  (ssrContext.modules || (ssrContext.modules = /* @__PURE__ */ new Set())).add("node_modules/nuxt/dist/app/components/nuxt-root.vue");
  return _sfc_setup ? _sfc_setup(props, ctx) : void 0;
};
let entry;
{
  entry = async function createNuxtAppServer(ssrContext) {
    const vueApp = createApp(_sfc_main);
    const nuxt = createNuxtApp({ vueApp, ssrContext });
    try {
      await applyPlugins(nuxt, plugins);
      await nuxt.hooks.callHook("app:created", vueApp);
    } catch (error) {
      await nuxt.hooks.callHook("app:error", error);
      nuxt.payload.error ||= createError(error);
    }
    if (ssrContext?._renderResponse) {
      throw new Error("skipping render");
    }
    return vueApp;
  };
}
const entry$1 = (ssrContext) => entry(ssrContext);

export { _export_sfc as _, useNuxtApp as a, useRuntimeConfig as b, nuxtLinkDefaults as c, entry$1 as default, navigateTo as n, resolveRouteObject as r, tryUseNuxtApp as t, useRouter as u };
//# sourceMappingURL=server.mjs.map
