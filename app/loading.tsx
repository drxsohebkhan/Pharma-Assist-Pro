export default function DashboardLoading() {
  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" aria-busy="true" aria-label="Loading dashboard">
      <div className="glass col-span-1 h-80 animate-pulse rounded-3xl md:col-span-2 lg:row-span-2" />
      <div className="glass h-36 animate-pulse rounded-3xl" />
      <div className="glass h-36 animate-pulse rounded-3xl" />
      <div className="glass h-36 animate-pulse rounded-3xl" />
      <div className="glass h-36 animate-pulse rounded-3xl" />
      <div className="glass col-span-1 h-56 animate-pulse rounded-3xl md:col-span-2" />
      <div className="glass col-span-1 h-56 animate-pulse rounded-3xl md:col-span-2" />
    </div>
  )
}
