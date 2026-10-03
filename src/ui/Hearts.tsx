export function Hearts({ value, max = 5, size = 'md' }: { value: number; max?: number; size?: 'sm' | 'md' }) {
  const cls = size === 'sm' ? 'text-xs' : 'text-base'
  return (
    <span className={`inline-flex gap-0.5 ${cls}`} aria-label={`${value} of ${max} hearts`} role="img">
      {Array.from({ length: max }, (_, i) => (
        <span key={i} className={i < value ? '' : 'opacity-25 grayscale'}>
          ❤️
        </span>
      ))}
    </span>
  )
}
