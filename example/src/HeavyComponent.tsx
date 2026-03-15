export default function HeavyComponent() {
  return (
    <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <h3 className="font-semibold text-amber-800">Dynamically Loaded Component</h3>
      <p className="mt-1 text-sm text-amber-700">
        This chunk was loaded on demand, not during the initial preload phase.
      </p>
    </div>
  );
}
