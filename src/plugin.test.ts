import { describe, expect, test } from "bun:test";
import { preloadProgress } from "./plugin";

describe("preloadProgress", () => {
  test("returns a plugin object with correct name", () => {
    const plugin = preloadProgress();
    expect(plugin.name).toBe("vite-plugin-preload-progress");
  });

  test("sets enforce to post", () => {
    const plugin = preloadProgress();
    expect(plugin.enforce).toBe("post");
  });

  test("sets apply to build", () => {
    const plugin = preloadProgress();
    expect(plugin.apply).toBe("build");
  });
});
