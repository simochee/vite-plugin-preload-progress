import { describe, expect, test } from "bun:test";
import type { OutputAsset, OutputBundle, OutputChunk } from "rollup";
import type { Plugin, ResolvedConfig } from "vite";
import { preloadProgress } from "./plugin";

function createChunk(
  overrides: Omit<Partial<OutputChunk>, "fileName"> & { fileName: string },
): OutputChunk {
  return {
    type: "chunk",
    code: "",
    dynamicImports: [],
    exports: [],
    facadeModuleId: null,
    implicitlyLoadedBefore: [],
    importedBindings: {},
    imports: [],
    isDynamicEntry: false,
    isEntry: false,
    isImplicitEntry: false,
    map: null,
    moduleIds: [],
    modules: {},
    name: overrides.fileName,
    referencedFiles: [],
    sourcemapFileName: null,
    preliminaryFileName: overrides.fileName,
    ...overrides,
  };
}

function createHtmlAsset(source: string): OutputAsset {
  return {
    type: "asset",
    fileName: "index.html",
    name: "index.html",
    needsCodeReference: false,
    source,
    originalFileName: null,
    names: ["index.html"],
    originalFileNames: ["index.html"],
  };
}

function setupPlugin(options = {}): {
  plugin: Plugin;
  callGenerateBundle: (bundle: OutputBundle) => void;
} {
  var plugin = preloadProgress(options);

  var configResolved = plugin.configResolved as (config: ResolvedConfig) => void;
  configResolved({ base: "/" } as ResolvedConfig);

  return {
    plugin,
    callGenerateBundle(bundle: OutputBundle) {
      var generateBundle = plugin.generateBundle as unknown as (
        opts: Record<string, unknown>,
        bundle: OutputBundle,
      ) => void;
      generateBundle({}, bundle);
    },
  };
}

describe("preloadProgress", () => {
  test("returns a plugin object with correct name", () => {
    var plugin = preloadProgress();
    expect(plugin.name).toBe("vite-plugin-preload-progress");
  });

  test("sets enforce to post", () => {
    var plugin = preloadProgress();
    expect(plugin.enforce).toBe("post");
  });

  test("sets apply to build", () => {
    var plugin = preloadProgress();
    expect(plugin.apply).toBe("build");
  });

  test("removes Vite-injected script and modulepreload tags", () => {
    var { callGenerateBundle } = setupPlugin();
    var html = createHtmlAsset(
      `<!DOCTYPE html>
<html>
<head>
  <script type="module" crossorigin src="/assets/main-abc.js"></script>
  <link rel="modulepreload" crossorigin href="/assets/vendor-def.js" />
  <link rel="stylesheet" crossorigin href="/assets/style-ghi.css" />
</head>
<body>
  <div id="app"></div>
</body>
</html>`,
    );
    var bundle = {
      "index.html": html,
      "assets/main-abc.js": createChunk({
        fileName: "assets/main-abc.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).not.toContain('<script type="module" crossorigin src=');
    expect(output).not.toContain('<link rel="modulepreload"');
    expect(output).not.toContain('<link rel="stylesheet" crossorigin');
  });

  test("injects loader before div#app", () => {
    var { callGenerateBundle } = setupPlugin();
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain('id="preload-progress-loader"');
    var loaderIdx = output.indexOf('id="preload-progress-loader"');
    var appIdx = output.indexOf('<div id="app">');
    expect(loaderIdx).toBeLessThan(appIdx);
  });

  test("injects bootstrap script before </body>", () => {
    var { callGenerateBundle } = setupPlugin();
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain('<script type="module">');
    expect(output).toContain('import("/assets/main.js")');
  });

  test("uses custom loaderId", () => {
    var { callGenerateBundle } = setupPlugin({ loaderId: "my-loader" });
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain('id="my-loader"');
  });

  test("uses custom loader HTML", () => {
    var customLoader = '<div class="my-spinner">Loading...</div>';
    var { callGenerateBundle } = setupPlugin({ loader: customLoader });
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain(customLoader);
  });

  test("includes exitClass in bootstrap script when specified", () => {
    var { callGenerateBundle } = setupPlugin({ exitClass: "fade-out" });
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain("fade-out");
  });

  test("applies custom base path", () => {
    var plugin = preloadProgress();
    var configResolved = plugin.configResolved as (config: ResolvedConfig) => void;
    configResolved({ base: "/my-app/" } as ResolvedConfig);

    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    var generateBundle = plugin.generateBundle as unknown as (
      opts: Record<string, unknown>,
      bundle: OutputBundle,
    ) => void;
    generateBundle({}, bundle);

    var output = html.source as string;
    expect(output).toContain('"/my-app/assets/main.js"');
  });

  test("does nothing when no HTML asset in bundle", () => {
    var { callGenerateBundle } = setupPlugin();
    var bundle = {
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    expect(() => callGenerateBundle(bundle)).not.toThrow();
  });

  test("sets delay in bootstrap script", () => {
    var { callGenerateBundle } = setupPlugin({ delay: 500 });
    var html = createHtmlAsset(`<!DOCTYPE html><html><body><div id="app"></div></body></html>`);
    var bundle = {
      "index.html": html,
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    callGenerateBundle(bundle);

    var output = html.source as string;
    expect(output).toContain("500");
  });
});
