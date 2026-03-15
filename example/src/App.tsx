import { lazy, Suspense, useState } from "react";

const HeavyComponent = lazy(() => import("./HeavyComponent"));

export function App() {
  var [showHeavy, setShowHeavy] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white">
      <header className="bg-white shadow-sm">
        <div className="mx-auto max-w-3xl px-6 py-4">
          <h1 className="text-2xl font-bold text-indigo-600">vite-plugin-preload-progress</h1>
          <p className="mt-1 text-sm text-gray-500">Example app with React + Tailwind CSS</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-10">
        <section className="rounded-xl border border-indigo-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Initial Load Complete</h2>
          <p className="mt-2 text-gray-600">
            If you're seeing this, all initial chunks (JS + CSS) were preloaded before the app
            rendered. The progress bar reached 100%, the loader faded out, and then React mounted.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-700">
              React loaded
            </span>
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
              Tailwind CSS loaded
            </span>
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-700">
              Plugin working
            </span>
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">Dynamic Import Test</h2>
          <p className="mt-2 text-gray-600">
            This component is lazily loaded via{" "}
            <code className="rounded bg-gray-100 px-1.5 py-0.5 text-sm font-mono text-indigo-600">
              React.lazy()
            </code>
            . It is NOT part of the initial preload (dynamicImports are excluded by default).
          </p>

          <button
            type="button"
            onClick={() => setShowHeavy(true)}
            className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            Load Heavy Component
          </button>

          {showHeavy && (
            <Suspense
              fallback={<p className="mt-4 text-sm text-gray-400">Loading dynamic chunk...</p>}
            >
              <HeavyComponent />
            </Suspense>
          )}
        </section>
      </main>
    </div>
  );
}
