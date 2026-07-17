export default function HistoryLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading history">
      <div className="glass h-10 w-80 animate-pulse rounded-xl" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="glass h-32 animate-pulse rounded-2xl" />
      ))}
    </div>
  )
}
