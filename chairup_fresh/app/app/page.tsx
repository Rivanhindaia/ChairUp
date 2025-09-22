// app/app/page.tsx
import dynamic from 'next/dynamic'

// stop static prerendering attempts
export const dynamic = 'force-dynamic'
export const revalidate = 0

// Load the client UI only in the browser
const AppClient = dynamic(() => import('./AppClient'), { ssr: false })

export default function Page() {
  return <AppClient />
}
