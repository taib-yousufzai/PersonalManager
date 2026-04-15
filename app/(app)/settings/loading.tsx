export default function Loading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-3xl mx-auto space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-24 rounded-md" style={{ background: 'var(--obsidian-4)' }} />
        <div className="h-4 w-40 rounded-md" style={{ background: 'var(--obsidian-4)' }} />
      </div>
      <div className="h-64 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
    </div>
  )
}
