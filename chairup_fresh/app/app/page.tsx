// app/app/page.tsx
'use client'
import { useEffect, useState } from 'react'

// stop Next from trying to statically render or cache this page
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  const [Comp, setComp] = useState<null | React.ComponentType>(null)

  useEffect(() => {
    let mounted = true
    import('./AppClient').then(mod => {
      if (mounted) setComp(() => mod.default)
    })
    return () => { mounted = false }
  }, [])

  if (!Comp) {
    return <div className="container py-8">Loading…</div>
  }
  return <Comp />
}
