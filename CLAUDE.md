# vite-plugin-preload-progress

Vite plugin that displays a real progress bar during initial SPA load, then executes the app after all chunks are preloaded.

## Commands

- `bun run build` — Build ESM/CJS + d.ts with tsdown
- `bun run test` — Run tests with bun:test
- `bun run typecheck` — TypeScript type checking
- `bun run lint` — Lint with oxlint (type-aware)
- `bun run lint:fix` — Lint with auto-fix
- `bun run fmt` — Check formatting with oxfmt (`--check`)
- `bun run fmt:fix` — Format in place with oxfmt (`--write`)

## Git Hooks

Lefthook runs on pre-commit:

- **oxlint** — Type-aware linting with `--fix` on staged JS/TS files
- **oxfmt** — Formatting with `--write` on all staged files

Both use `stage_fixed` to re-stage corrected files. Commit is blocked if either fails.

## Coding Conventions

### TypeScript

- Use `interface` over `type` aliases (`typescript/consistent-type-definitions`)
- Use `import type` for type-only imports (`typescript/consistent-type-imports`)
- No default exports; use named exports only (`import/no-default-export`)
- Use `T[]` for simple array types, `Array<T>` only for complex types (`typescript/array-type`)
- Use `Record<K, V>` for index signatures (`typescript/consistent-indexed-object-style`)
- Floating promises are forbidden (`typescript/no-floating-promises`)

### Config File Exceptions

`tsdown.config.ts` requires default export, which is an exception to the `no-default-export` rule.

### Bootstrap Script (Inline JS in HTML)

The bootstrap script is injected as raw JS in HTML (not transpiled by tsdown). For broad browser compatibility:

- Use `var` instead of `const`/`let`
- Use `function` declarations instead of arrow functions

### Vite Plugin Implementation

- Set `enforce: 'post'` and `apply: 'build'` (no-op in dev server)
- Rewrite `htmlAsset.source` directly inside `generateBundle` hook (do NOT use `transformIndexHtml`)
- Cast `viteMetadata` as it is a Vite internal API without type definitions

## Testing

Uses `bun:test` with the following strategy:

1. **Integration tests** — Build test fixtures with `vite.build({ write: false })` and assert on output HTML
2. **Unit tests** — Pass mock `OutputBundle` objects to the `collectResources` function

## Architecture

See `PLAN.md` for the full design specification.
