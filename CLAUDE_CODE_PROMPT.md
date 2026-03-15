# vite-plugin-preload-progress

Vite SPAの初期ロード時に、実際のリソース読み込み進捗に連動したプログレスバーを表示するViteプラグイン。全リソースのプリロードが完了してからエントリモジュールを実行することで、「ローディング → 一瞬で画面表示」という体験を作る。

## リポジトリ名

`vite-plugin-preload-progress`

## Short Description

> Vite plugin that preloads all initial chunks with a real progress bar, then executes your app.

---

## Claude Codeへのプロンプト

以下の設計方針に従って、Viteプラグイン `vite-plugin-preload-progress` をnpmパッケージとして実装してください。

### 解決する課題

Vite SPAではビルド後のindex.htmlに `<script type="module">` と `<link rel="modulepreload">` が挿入され、ブラウザが並列にロード→即実行する。この間ユーザーには白い画面が表示される。やりたいのは以下：

1. 全JS/CSSチャンクをプリロードしながら進捗を表示する
2. 100%になったらローダーを消す
3. その後にエントリモジュールを実行する（プリロード済みなので一瞬で画面が出る）

### コアアーキテクチャ

**ビルド時にリソースリストをindex.htmlにインラインで埋め込む方式を採用する。** ランタイムで `manifest.json` を fetch する方式は以下の理由で採用しない：

- `manifest.json` にはコンテンツハッシュがないため、ブラウザ/CDNにキャッシュされるとデプロイ後に古いマニフェストが返り、存在しないチャンクへのリクエストで404になる
- 余分なHTTPリクエストが発生する
- インライン方式なら、キャッシュの問題は `index.html` のキャッシュ制御だけに帰着する（通常のSPAと同じ）

### プラグインの実装方針

Viteの `generateBundle` フックを使う。このフック内では `OutputBundle` オブジェクトにすべてのチャンク情報とindex.htmlアセットが含まれているため、以下を一箇所で完結できる：

1. **リソース収集**: `OutputBundle` 内の `OutputChunk` を走査し、エントリチャンクからBFS（幅優先探索）で静的 `imports` を再帰的に辿って到達可能な全チャンクを収集する。CSSはチャンクの `viteMetadata.importedCss`（Vite内部のメタデータ、`Set<string>`）から取得する。`dynamicImports` はデフォルトでは辿らない（遅延ロード分まで初期ロードに含めると本末転倒なため）。
2. **HTML変換**: `bundle['index.html']` のソースからViteが注入した `<script type="module" src="...">` 、`<link rel="modulepreload">`、`<link rel="stylesheet">` を正規表現で除去する。
3. **ローダー注入**: `<div id="app">` の直前（なければ `</body>` の直前）にローダーHTMLを挿入する。
4. **ブートストラップスクリプト注入**: `</body>` の直前に `<script type="module">` を挿入する。このスクリプトは以下を行う：
   - ビルド時にインラインされたリソース配列（JSON）をイテレートし、CSSは `<link rel="stylesheet">`、JSは `<link rel="modulepreload">` を動的に生成して `document.head` に追加。`onload`/`onerror` で進捗をカウントする。
   - `id="progress-bar"` の要素の `style.width` と `id="progress-pct"` の `textContent` を更新する。
   - 全リソース完了後、オプションで `exitClass` をローダーに付与 → `delay` ms待機 → ローダーをDOMから除去 → `import()` でエントリモジュールを実行。
5. **`htmlAsset.source` を書き換えた値で上書きする。**

`configResolved` フックで `config.base` を取得し、全リソースパスのプレフィックスに使う。`enforce: 'post'` かつ `apply: 'build'` とする（devサーバーでは何もしない）。

### オプション設計

```typescript
interface PreloadProgressOptions {
  loader?: string      // カスタムローダーHTML。id="progress-bar" と id="progress-pct" の規約で進捗が反映される
  loaderId?: string    // ローダーのラッパーid。デフォルト 'preload-progress-loader'
  delay?: number       // 完了→エントリ実行の待機ms。フェードアウトアニメーション用。デフォルト 0
  exitClass?: string   // 完了時にローダーに付与するCSSクラス名
  includeDynamic?: boolean  // dynamicImportsも初期ロード対象に含めるか。デフォルト false
}
```

デフォルトローダーはインラインスタイルのみでCSSファイル不要なシンプルなプログレスバー。

### ビルド・パッケージ設定

- tsupでESM/CJS双方にビルドし、d.ts/d.ctsも生成する
- `package.json` の `exports` でconditional exportsを設定
- `peerDependencies` に `vite >= 4.0.0`
- rollupの型は `import type { OutputBundle, OutputChunk, OutputAsset } from 'rollup'` で取得する（viteからは直接exportされていない）

### テスト方針

vitestを使い、2種類のテストを書く：

1. **Integration tests**: テストフィクスチャ（最小限のindex.html + main.ts）を用意し、`vite.build({ write: false })` で実際にビルドして出力HTMLを文字列として検証する。フィクスチャは basic / with-css / custom-base / custom-loader のパターン。
2. **Unit tests**: `collectResources` 関数をexportし、モックの `OutputBundle`（`OutputChunk` オブジェクトを手組みして `type: 'chunk'`, `fileName`, `isEntry`, `imports`, `dynamicImports` 等を設定）を渡して、静的import再帰走査・CSS収集・dynamicImport除外/包含・baseプレフィックス・循環参照の安全性などをテストする。

### CI/CD

- `.github/workflows/ci.yml`: push/PRでNode 18/20/22マトリクスビルド＆テスト
- `.github/workflows/publish.yml`: GitHub Release作成時に `npm publish --provenance` で自動公開

### 注意事項

- ブートストラップの `<script type="module">` 内のJSはtsupのトランスパイル対象外（HTML文字列として埋め込まれる生JS）なので、広い互換性のために `var` を使い、アロー関数を避ける
- `viteMetadata` はViteの内部APIで型定義がないため、`(chunk as unknown as { viteMetadata?: { importedCss: Set<string> } }).viteMetadata` のようにキャストする
- `generateBundle` フック内で `transformIndexHtml` を使わないこと。実行順の問題で、マニフェストやチャンク情報がまだ利用可能でない場合がある。`generateBundle` 内で `htmlAsset.source` を直接書き換えるのが確実
