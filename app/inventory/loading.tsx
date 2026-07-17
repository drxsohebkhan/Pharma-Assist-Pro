export default function InventoryLoading() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true" aria-label="Loading inventory">
      <div className="flex flex-col gap-3">
        <div className="glass h-10 w-72 animate-pulse rounded-xl" />
        <div className="glass h-5 w-full max-w-xl animate-pulse rounded-lg" />
      </div>
      <div className="glass h-12 animate-pulse rounded-2xl" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} className="glass h-48 animate-pulse rounded-2xl" />
        ))}
      </div>
    </div>
  )
}
