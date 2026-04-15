export default function Loading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-5xl mx-auto space-y-8 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-md" style={{ background: 'var(--obsidian-4)' }} />
        <div className="h-4 w-20 rounded-md" style={{ background: 'var(--obsidian-4)' }} />
      </div>
      {/* Metric cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-20 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
        ))}
      </div>
      {/* Forms */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
        <div className="h-48 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
      </div>
    </div>
  )
}
