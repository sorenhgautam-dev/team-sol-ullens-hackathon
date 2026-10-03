import type { ReactNode } from 'react'

/** 390 × 844 portrait layout; centred in a phone shell on desktop, edge to edge on phones. */
export function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div className="phone-shell">
      <div className="phone">{children}</div>
    </div>
  )
}
