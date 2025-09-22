'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
export default function Nav(){
  const [uid,setUid]=useState<string|null>(null)
  useEffect(()=>{ supabase.auth.getUser().then(r=>setUid(r.data.user?.id||null)) },[])
  return (
    <header className="sticky top-0 z-40 border-b bg-white/70 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-2xl bg-black text-white flex items-center justify-center font-bold">Cu</div>
          <div className="logo text-lg">Chair<span className="accent">Up</span></div>
        </Link>
        <nav className="flex items-center gap-2">
          <Link href="/explore" className="btn btn-ghost">Explore</Link>
          <Link href="/app" className="btn">Book</Link>
          {uid ? (<>
            <Link href="/dashboard" className="btn btn-ghost">Dashboard</Link>
            <Link href="/profile" className="btn btn-ghost">Profile</Link>
            <a className="btn btn-primary" href="/sign-out">Sign out</a>
          </>) : <a className="btn btn-primary" href="/sign-in">Sign in</a>}
        </nav>
      </div>
    </header>
  )
}
