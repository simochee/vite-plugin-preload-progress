import { describe, expect, test } from "bun:test";
import type { OutputBundle, OutputChunk } from "rollup";
import { collectResources } from "./collect-resources";

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

function withCss(chunk: OutputChunk, cssFiles: string[]): OutputChunk {
  return Object.assign(chunk, {
    viteMetadata: { importedCss: new Set(cssFiles) },
  });
}

describe("collectResources", () => {
  test("collects entry chunk", () => {
    var bundle = {
      "assets/main-abc123.js": createChunk({
        fileName: "assets/main-abc123.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    expect(result).toEqual([{ url: "/assets/main-abc123.js", type: "js" }]);
  });

  test("follows static imports recursively", () => {
    var bundle = {
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
        imports: ["assets/vendor.js"],
      }),
      "assets/vendor.js": createChunk({
        fileName: "assets/vendor.js",
        imports: ["assets/shared.js"],
      }),
      "assets/shared.js": createChunk({
        fileName: "assets/shared.js",
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    expect(result).toEqual([
      { url: "/assets/main.js", type: "js" },
      { url: "/assets/vendor.js", type: "js" },
      { url: "/assets/shared.js", type: "js" },
    ]);
  });

  test("collects CSS from viteMetadata", () => {
    var bundle = {
      "assets/main.js": withCss(
        createChunk({
          fileName: "assets/main.js",
          isEntry: true,
        }),
        ["assets/style.css"],
      ),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    expect(result).toEqual([
      { url: "/assets/main.js", type: "js" },
      { url: "/assets/style.css", type: "css" },
    ]);
  });

  test("excludes dynamic imports by default", () => {
    var bundle = {
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
        dynamicImports: ["assets/lazy.js"],
      }),
      "assets/lazy.js": createChunk({
        fileName: "assets/lazy.js",
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    expect(result).toEqual([{ url: "/assets/main.js", type: "js" }]);
  });

  test("includes dynamic imports when includeDynamic is true", () => {
    var bundle = {
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
        dynamicImports: ["assets/lazy.js"],
      }),
      "assets/lazy.js": createChunk({
        fileName: "assets/lazy.js",
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: true });
    expect(result).toEqual([
      { url: "/assets/main.js", type: "js" },
      { url: "/assets/lazy.js", type: "js" },
    ]);
  });

  test("applies base prefix", () => {
    var bundle = {
      "assets/main.js": createChunk({
        fileName: "assets/main.js",
        isEntry: true,
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, {
      base: "/my-app/",
      includeDynamic: false,
    });
    expect(result).toEqual([{ url: "/my-app/assets/main.js", type: "js" }]);
  });

  test("handles circular imports safely", () => {
    var bundle = {
      "assets/a.js": createChunk({
        fileName: "assets/a.js",
        isEntry: true,
        imports: ["assets/b.js"],
      }),
      "assets/b.js": createChunk({
        fileName: "assets/b.js",
        imports: ["assets/a.js"],
      }),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    expect(result).toEqual([
      { url: "/assets/a.js", type: "js" },
      { url: "/assets/b.js", type: "js" },
    ]);
  });

  test("deduplicates CSS across chunks", () => {
    var bundle = {
      "assets/main.js": withCss(
        createChunk({
          fileName: "assets/main.js",
          isEntry: true,
          imports: ["assets/comp.js"],
        }),
        ["assets/shared.css"],
      ),
      "assets/comp.js": withCss(
        createChunk({
          fileName: "assets/comp.js",
        }),
        ["assets/shared.css"],
      ),
    } as unknown as OutputBundle;

    var result = collectResources(bundle, { base: "/", includeDynamic: false });
    var cssResults = result.filter(function (r) {
      return r.type === "css";
    });
    expect(cssResults).toEqual([{ url: "/assets/shared.css", type: "css" }]);
  });
});
