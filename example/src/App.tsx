import { lazy, Suspense, useState } from "react";
import styles from "./App.module.css";

const Header = lazy(() => import("./Header"));
const StatusCard = lazy(() => import("./StatusCard"));
const DynamicCard = lazy(() => import("./DynamicCard"));

export function App() {
  var [showDynamic, setShowDynamic] = useState(false);

  return (
    <>
      <Suspense>
        <Header />
      </Suspense>

      <main className={styles.main}>
        <Suspense fallback={<p className={styles.fallback}>Loading...</p>}>
          <StatusCard />
        </Suspense>

        <section className={styles.card}>
          <h2 className={styles.cardTitle}>Dynamic Import Test</h2>
          <p className={styles.cardBody}>
            The component below is lazily loaded via <code>React.lazy()</code>. It is NOT part of
            the initial preload because <code>dynamicImports</code> are excluded by default.
          </p>

          <button type="button" className={styles.button} onClick={() => setShowDynamic(true)}>
            Load Dynamic Component
          </button>

          {showDynamic && (
            <Suspense fallback={<p className={styles.fallback}>Loading dynamic chunk...</p>}>
              <DynamicCard />
            </Suspense>
          )}
        </section>
      </main>
    </>
  );
}
