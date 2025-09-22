'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '../../lib/supabaseClient'
type Provider={ id:string; display_name:string|null; categories:string[]; city:string|null; lat:number|null; lng:number|null }
type Service={ id:string; provider_id:string; name:string; minutes:number; price_cents:number; active:boolean }
export default function Explore(){
  const [providers,setProviders]=useState<Provider[]>([]); const [services,setServices]=useState<Service[]>([])
  useEffect(()=>{(async()=>{ const {data:pv}=await supabase.from('providers').select('id,display_name,categories,city,lat,lng').order('created_at',{ascending:false}); const {data:sv}=await supabase.from('services').select('*').eq('active',true); setProviders(pv||[]); setServices(sv||[]) })()},[])
  return (<div className="space-y-6"><h1 className="text-2xl md:text-3xl font-bold">Explore providers</h1><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{providers.map(p=>{ const sv=services.filter(s=>s.provider_id===p.id); const price=sv.length? Math.min(...sv.map(s=>s.price_cents))/100: null; return (<div key={p.id} className="card"><div className="text-lg font-semibold">{p.display_name||'Unnamed provider'}</div><div className="text-sm text-slate-600">{p.city||'—'}</div><div className="mt-2 flex flex-wrap gap-2">{(p.categories||[]).map(c=><span key={c} className="chip chip-off">{c}</span>)}</div><div className="mt-3 text-sm">{price? <>from <b>${price.toFixed(2)}</b></> : 'No services yet'}</div><div className="mt-4 flex gap-2"><Link href={`/app?provider=${p.id}`} className="btn btn-primary">Book</Link><Link href={`/dashboard?provider=${p.id}`} className="btn">View profile</Link></div></div>)})}</div></div>)
}
