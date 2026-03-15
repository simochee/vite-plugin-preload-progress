import type { OutputAsset, OutputBundle, OutputChunk } from "rollup";
import type { Plugin, ResolvedConfig } from "vite";
import { generateBootstrapScript } from "./bootstrap";
import { collectResources } from "./collect-resources";
import { DEFAULT_LOADER } from "./default-loader";
import type { PreloadProgressOptions } from "./types";

var DEFAULT_LOADER_ID = "preload-progress-loader";

export function preloadProgress(options: PreloadProgressOptions = {}): Plugin {
  var config: ResolvedConfig;

  return {
    name: "vite-plugin-preload-progress",
    enforce: "post",
    apply: "build",
    configResolved(resolved) {
      config = resolved;
    },
    generateBundle(_outputOptions, bundle) {
      var base = config.base ?? "/";
      var loaderId = options.loaderId ?? DEFAULT_LOADER_ID;
      var delay = options.delay ?? 0;
      var loaderHtml = options.loader ?? DEFAULT_LOADER;
      var includeDynamic = options.includeDynamic ?? false;

      var htmlAsset = findHtmlAsset(bundle);
      if (!htmlAsset) {
        return;
      }

      var entryChunk = findEntryChunk(bundle);
      if (!entryChunk) {
        return;
      }

      var resources = collectResources(bundle, { base, includeDynamic });
      var entryUrl = base + entryChunk.fileName;

      var html =
        typeof htmlAsset.source === "string"
          ? htmlAsset.source
          : new TextDecoder().decode(htmlAsset.source);

      html = removeViteInjectedTags(html);

      var wrappedLoader = `<div id="${loaderId}">${loaderHtml}</div>`;
      html = injectLoader(html, wrappedLoader);

      var bootstrapScript = generateBootstrapScript({
        resources,
        entryUrl,
        loaderId,
        delay,
        exitClass: options.exitClass,
      });
      html = injectBeforeClosingBody(html, bootstrapScript);

      htmlAsset.source = html;
    },
  };
}

function findHtmlAsset(bundle: OutputBundle): OutputAsset | undefined {
  for (var key in bundle) {
    var item = bundle[key];
    if (item.type === "asset" && key.endsWith(".html")) {
      return item;
    }
  }
  return undefined;
}

function findEntryChunk(bundle: OutputBundle): OutputChunk | undefined {
  for (var key in bundle) {
    var item = bundle[key];
    if (item.type === "chunk" && item.isEntry) {
      return item;
    }
  }
  return undefined;
}

function removeViteInjectedTags(html: string): string {
  html = html.replace(/<script\s+type="module"\s+crossorigin\s+src="[^"]*"><\/script>\s*/g, "");
  html = html.replace(/<link\s+rel="modulepreload"\s+crossorigin\s+href="[^"]*"\s*\/?>\s*/g, "");
  html = html.replace(/<link\s+rel="stylesheet"\s+crossorigin\s+href="[^"]*"\s*\/?>\s*/g, "");
  return html;
}

function injectLoader(html: string, loader: string): string {
  var appDivMatch = html.indexOf('<div id="app">');
  if (appDivMatch !== -1) {
    return html.slice(0, appDivMatch) + loader + "\n" + html.slice(appDivMatch);
  }
  return injectBeforeClosingBody(html, loader);
}

function injectBeforeClosingBody(html: string, content: string): string {
  var idx = html.lastIndexOf("</body>");
  if (idx !== -1) {
    return html.slice(0, idx) + content + "\n" + html.slice(idx);
  }
  return html + content;
}
