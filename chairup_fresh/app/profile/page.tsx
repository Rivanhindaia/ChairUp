'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
type Profile={id:string; full_name:string|null; email:string|null; role:'customer'|'provider'|'admin'}
export default function ProfilePage(){
  const [p,setP]=useState<Profile|null>(null); const [saving,setSaving]=useState(false)
  useEffect(()=>{(async()=>{ const {data:{user}}=await supabase.auth.getUser(); if(!user){ window.location.href='/sign-in'; return } const {data}=await supabase.from('profiles').select('*').eq('id',user.id).maybeSingle(); setP(data as any) })()},[])
  async function save(){ if(!p) return; setSaving(true); const {error}=await supabase.from('profiles').update({full_name:p.full_name, role:p.role}).eq('id',p.id); setSaving(false); if(error) alert(error.message); else alert('Saved!') }
  return (<div className="max-w-2xl mx-auto space-y-4"><div className="card"><h2 className="text-xl font-bold">Your profile</h2><div className="mt-4 grid gap-3"><input className="rounded-xl border p-2" placeholder="Full name" value={p?.full_name||''} onChange={e=>setP(p?{...p, full_name:e.target.value}:p)} /><input disabled className="rounded-xl border p-2 bg-slate-50" value={p?.email||''} /><div className="flex gap-3">{(['customer','provider'] as const).map(r=>(<button key={r} onClick={()=>setP(p?{...p, role:r}:p)} className={`chip ${p?.role===r?'chip-on':'chip-off'}`}>{r}</button>))}</div><button onClick={save} disabled={!p||saving} className="btn btn-primary w-fit">{saving?'Saving…':'Save changes'}</button></div></div></div>)
}
