import type { OutputBundle } from "rollup";

interface ViteMetadata {
  importedCss: Set<string>;
}

export interface Resource {
  url: string;
  type: "js" | "css";
}

export function collectResources(
  bundle: OutputBundle,
  options: { base: string; includeDynamic: boolean },
): Resource[] {
  var visited = new Set<string>();
  var resources: Resource[] = [];
  var cssFiles = new Set<string>();
  var queue: string[] = [];

  for (var key in bundle) {
    var item = bundle[key];
    if (item.type === "chunk" && item.isEntry) {
      queue.push(item.fileName);
    }
  }

  while (queue.length > 0) {
    var fileName = queue.shift()!;
    if (visited.has(fileName)) {
      continue;
    }
    visited.add(fileName);

    var chunk = bundle[fileName];
    if (!chunk || chunk.type !== "chunk") {
      continue;
    }

    resources.push({ url: options.base + chunk.fileName, type: "js" });

    var meta = (chunk as unknown as { viteMetadata?: ViteMetadata }).viteMetadata;
    if (meta?.importedCss) {
      for (var css of meta.importedCss) {
        if (!cssFiles.has(css)) {
          cssFiles.add(css);
          resources.push({ url: options.base + css, type: "css" });
        }
      }
    }

    for (var imp of chunk.imports) {
      if (!visited.has(imp)) {
        queue.push(imp);
      }
    }

    if (options.includeDynamic) {
      for (var dyn of chunk.dynamicImports) {
        if (!visited.has(dyn)) {
          queue.push(dyn);
        }
      }
    }
  }

  return resources;
}
