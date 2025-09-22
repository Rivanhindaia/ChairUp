'use client'
import { useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
export default function SignOut(){ useEffect(()=>{(async()=>{ await supabase.auth.signOut(); window.location.href='/' })()},[]); return <div className="max-w-md mx-auto card">Signing out…</div> }
