export default function Loading() {
  return (
    <div className="px-4 py-6 md:px-8 max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="h-7 w-24 rounded-md" style={{ background: 'var(--obsidian-4)' }} />
      <div className="h-72 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
      <div className="h-48 rounded-lg" style={{ background: 'var(--obsidian-3)' }} />
    </div>
  )
}
