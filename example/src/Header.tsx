import styles from "./Header.module.css";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.inner}>
        <h1 className={styles.title}>vite-plugin-preload-progress</h1>
        <p className={styles.subtitle}>Example app with React + CSS Modules</p>
      </div>
    </header>
  );
}
