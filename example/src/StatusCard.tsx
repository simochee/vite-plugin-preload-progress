import styles from "./StatusCard.module.css";

export default function StatusCard() {
  return (
    <section className={styles.card}>
      <h2 className={styles.title}>Initial Load Complete</h2>
      <p className={styles.body}>
        If you're seeing this, all initial chunks (JS + CSS) were preloaded before the app rendered.
        The progress bar reached 100%, the loader faded out, and then React mounted.
      </p>
      <div className={styles.badges}>
        <span className={`${styles.badge} ${styles.green}`}>React loaded</span>
        <span className={`${styles.badge} ${styles.blue}`}>CSS Modules loaded</span>
        <span className={`${styles.badge} ${styles.purple}`}>Plugin working</span>
      </div>
    </section>
  );
}
