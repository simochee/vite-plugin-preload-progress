import styles from "./DynamicCard.module.css";

export default function DynamicCard() {
  return (
    <div className={styles.card}>
      <h3 className={styles.title}>Dynamically Loaded Component</h3>
      <p className={styles.body}>
        This chunk was loaded on demand, not during the initial preload phase.
      </p>
    </div>
  );
}
