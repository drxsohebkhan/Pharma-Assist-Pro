export default function DecoderLoading() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading decoder">
      <div className="glass h-10 w-72 animate-pulse rounded-xl" />
      <div className="glass h-80 animate-pulse rounded-3xl" />
    </div>
  )
}
