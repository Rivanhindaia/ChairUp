'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'
type Profile={ id:string; full_name:string|null; email:string|null; role:string|null }
type Provider={ id:string; user_id:string; display_name:string|null; bio:string|null; city:string|null; lat:number|null; lng:number|null; categories:string[] }
type Service={ id:string; provider_id:string; name:string; minutes:number; price_cents:number; active:boolean }
export default function Dashboard(){
  const [profile,setProfile]=useState<Profile|null>(null)
  const [provider,setProvider]=useState<Provider|null>(null)
  const [services,setServices]=useState<Service[]>([])
  const [working,setWorking]=useState(false)
  const [form,setForm]=useState({display_name:'', city:'', categories:'Barber,Hair', lat:'', lng:'', bio:''})
  const [newService,setNewService]=useState({name:'Skin Fade', minutes:45, price_cents:4500})
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); if(!user){ window.location.href='/sign-in'; return }
    const {data:prof}=await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(); setProfile(prof as any)
    const {data:prov}=await supabase.from('providers').select('*').eq('user_id', user.id).maybeSingle()
    if(prov){ setProvider(prov as any); setForm({ display_name:prov.display_name||'', city:prov.city||'', categories:(prov.categories||[]).join(','), lat:prov.lat?.toString()||'', lng:prov.lng?.toString()||'', bio:prov.bio||'' })}
    const pid=(prov as any)?.id||''; if(pid){ const {data:sv}=await supabase.from('services').select('*').eq('provider_id', pid); setServices(sv||[]) }
  })()},[])
  async function saveProvider(){
    if(!profile) return; setWorking(true)
    const payload={ user_id:profile.id, display_name:form.display_name||profile.full_name||profile.email, bio:form.bio||null, city:form.city||null, categories:form.categories? form.categories.split(',').map(s=>s.trim()).filter(Boolean):[], lat:form.lat? parseFloat(form.lat):null, lng:form.lng? parseFloat(form.lng):null }
    let id=provider?.id
    if(!id){ const {data, error}=await supabase.from('providers').insert(payload).select('*').single(); if(error){ alert(error.message); setWorking(false); return } setProvider(data as any); id=data.id }
    else { const {error}=await supabase.from('providers').update(payload).eq('id', id); if(error){ alert(error.message); setWorking(false); return } }
    setWorking(false); alert('Saved provider profile')
  }
  async function addService(){ if(!provider) return alert('Create provider profile first'); const {data, error}=await supabase.from('services').insert({ provider_id:provider.id, ...newService }).select('*').single(); if(error) return alert(error.message); setServices([data as any, ...services]) }
  async function updateServicePrice(id:string, price_cents:number){ const {error}=await supabase.from('services').update({price_cents}).eq('id', id); if(error) return alert(error.message); setServices(services.map(s=>s.id===id?{...s, price_cents}:s)) }
  return (<div className="space-y-6"><div className="card"><h2 className="text-xl font-bold">Provider profile</h2><div className="grid md:grid-cols-2 gap-3 mt-3"><input placeholder="Display name" className="rounded-xl border p-2" value={form.display_name} onChange={e=>setForm({...form,display_name:e.target.value})} /><input placeholder="City" className="rounded-xl border p-2" value={form.city} onChange={e=>setForm({...form,city:e.target.value})} /><input placeholder="Categories (comma-separated)" className="rounded-xl border p-2 md:col-span-2" value={form.categories} onChange={e=>setForm({...form,categories:e.target.value})} /><input placeholder="Latitude (optional)" className="rounded-xl border p-2" value={form.lat} onChange={e=>setForm({...form,lat:e.target.value})} /><input placeholder="Longitude (optional)" className="rounded-xl border p-2" value={form.lng} onChange={e=>setForm({...form,lng:e.target.value})} /><textarea placeholder="Bio (optional)" className="rounded-xl border p-2 md:col-span-2" value={form.bio} onChange={e=>setForm({...form,bio:e.target.value})} /><button onClick={saveProvider} className="btn btn-primary w-fit" disabled={working}>{working?'Saving…':'Save profile'}</button></div></div><div className="card"><h3 className="text-lg font-semibold">Services</h3><div className="grid md:grid-cols-3 gap-3 mt-3"><input className="rounded-xl border p-2" placeholder="Name" value={newService.name} onChange={e=>setNewService({...newService,name:e.target.value})} /><input className="rounded-xl border p-2" placeholder="Minutes" type="number" value={newService.minutes} onChange={e=>setNewService({...newService,minutes:parseInt(e.target.value||'0')})} /><div className="flex gap-2"><input className="rounded-xl border p-2 w-full" placeholder="Price (USD)" type="number" value={newService.price_cents/100} onChange={e=>setNewService({...newService,price_cents:Math.round(parseFloat(e.target.value||'0')*100)})} /><button onClick={addService} className="btn">Add</button></div></div><div className="mt-4 space-y-2">{services.map(s=>(<div key={s.id} className="flex items-center justify-between p-3 border rounded-xl"><div><div className="font-medium">{s.name}</div><div className="text-xs text-slate-500">{s.minutes} min</div></div><div className="flex items-center gap-2"><input type="number" className="rounded-xl border p-2 w-28 text-right" value={(s.price_cents/100).toFixed(2)} onChange={e=>updateServicePrice(s.id,Math.round(parseFloat(e.target.value||'0')*100))} /></div></div>))}{services.length===0&&<div className="text-sm text-slate-500">No services yet.</div>}</div></div></div>)
}
