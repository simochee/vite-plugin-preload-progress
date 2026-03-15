export interface PreloadProgressOptions {
  /** カスタムローダーHTML。id="progress-bar" と id="progress-pct" の規約で進捗が反映される */
  loader?: string;
  /** ローダーのラッパーid。デフォルト 'preload-progress-loader' */
  loaderId?: string;
  /** 完了→エントリ実行の待機ms。フェードアウトアニメーション用。デフォルト 0 */
  delay?: number;
  /** 完了時にローダーに付与するCSSクラス名 */
  exitClass?: string;
  /** dynamicImportsも初期ロード対象に含めるか。デフォルト false */
  includeDynamic?: boolean;
}
