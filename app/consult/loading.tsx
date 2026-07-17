export default function ConsultLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading consult engine">
      <div className="glass h-10 w-72 animate-pulse rounded-xl" />
      <div className="glass h-96 animate-pulse rounded-3xl" />
    </div>
  )
}
