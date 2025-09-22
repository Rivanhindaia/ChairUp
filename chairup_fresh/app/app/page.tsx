// app/app/page.tsx
import dynamic from 'next/dynamic'

// stop Next from prerendering this route
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Load the client UI only in the browser (no SSR, no prerender)
const AppClient = dynamic(() => import('./AppClient'), { ssr: false })

export default function Page() {
  return <AppClient />
}
