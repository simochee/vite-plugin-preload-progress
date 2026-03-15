import type { Plugin, ResolvedConfig } from "vite";
import type { PreloadProgressOptions } from "./types";

export function preloadProgress(_options: PreloadProgressOptions = {}): Plugin {
  let _config: ResolvedConfig;

  return {
    name: "vite-plugin-preload-progress",
    enforce: "post",
    apply: "build",
    configResolved(config) {
      _config = config;
    },
    generateBundle(_outputOptions, _bundle) {
      // TODO: implement
    },
  };
}
