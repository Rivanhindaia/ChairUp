import { Suspense } from 'react'
import AppClient from './AppClient'

export const dynamic = 'force-dynamic' // avoids static prerender hiccups

export default function Page(){
  return (
    <Suspense fallback={<div className="container py-8">Loading…</div>}>
      <AppClient />
    </Suspense>
  )
}

