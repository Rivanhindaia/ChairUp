'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

// Types
type Provider={ id:string; user_id:string; display_name:string|null; city:string|null; lat:number|null; lng:number|null }
type Service={ id:string; provider_id:string; name:string; minutes:number; price_cents:number; active:boolean; payment_link_url?:string|null }
type WorkingHours={ id:string; provider_id:string; dow:number; open_min:number; close_min:number }
type BookingRow={ id:string; starts_at:string; service_id:string|null }

// Helpers
function haversineKm(a:{lat:number;lng:number}, b:{lat:number;lng:number}){
  const R=6371,dLat=(b.lat-a.lat)*Math.PI/180,dLng=(b.lng-a.lng)*Math.PI/180
  const la1=a.lat*Math.PI/180, la2=b.lat*Math.PI/180
  const h=Math.sin(dLat/2)**2+Math.cos(la1)*Math.cos(la2)*Math.sin(dLng/2)**2
  return 2*R*Math.asin(Math.min(1,Math.sqrt(h)))
}

export default function AppPage(){
  // Core state
  const [uid,setUid]=useState('')
  const [providers,setProviders]=useState<Provider[]>([])
  const [services,setServices]=useState<Service[]>([])
  const [hours,setHours]=useState<Record<string,WorkingHours[]>>({})
  const [coords,setCoords]=useState<{lat:number;lng:number}|null>(null)

  // Selection
  const [provider,setProvider]=useState('')
  const [service,setService]=useState('')
  const [selectedDate,setSelectedDate]=useState<Date>(()=>new Date())
  const [slots,setSlots]=useState<string[]>([])
  const [time,setTime]=useState('')
  const [notes,setNotes]=useState('')

  // AI helper
  const [aiText,setAiText]=useState('')
  const [aiReply,setAiReply]=useState<{summary?:string,notes?:string}|null>(null)
  const [loadingAI,setLoadingAI]=useState(false)

  // Load data
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); setUid(user?.id||'')
    const {data:pv}=await supabase.from('providers').select('*')
    setProviders(pv||[])
    const {data:sv}=await supabase.from('services').select('*').eq('active',true)
    setServices((sv||[]) as any)
  })()},[])

  // Read ?provider= from URL (no useSearchParams; avoids Suspense requirement)
  useEffect(()=>{
    if (typeof window === 'undefined') return
    const p = new URLSearchParams(window.location.search).get('provider')
    if (p) setProvider(p)
  },[])

  // When provider changes: fetch hours (if missing) and preselect a service
  useEffect(()=>{
    if(!provider) return
    if(!hours[provider]){
      (async()=>{
        const {data}=await supabase.from('working_hours').select('*').eq('provider_id',provider).order('dow')
        setHours(prev=>({...prev,[provider]:(data||[]) as any}))
      })()
    }
    const sv=services.filter(s=>s.provider_id===provider)
    setService(sv[0]?.id||'')
    setTime('')
  },[provider, services]) // eslint-disable-line

  // Recompute available slots
  useEffect(()=>{(async()=>{
    setSlots([]); setTime('')
    if(!provider||!service) return
    const svc=services.find(s=>s.id===service); if(!svc) return
    const dow=selectedDate.getDay()
    const row=(hours[provider]||[]).find(r=>r.dow===dow)
    const openMin=row?row.open_min:9*60, closeMin=row?row.close_min:18*60, serviceMin=svc.minutes

    const dayStart=new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate())
    const dayEnd=new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate()+1)

    const {data:bk}=await supabase
      .from('bookings')
      .select('id,starts_at,service_id')
      .eq('provider_id',provider)
      .gte('starts_at',dayStart.toISOString())
      .lt('starts_at',dayEnd.toISOString())
      .order('starts_at',{ascending:true})

    const minutesByService=new Map(services.map(sv=>[sv.id, sv.minutes]))
    const rows:Array<BookingRow>=Array.isArray(bk)?(bk as any):[]
    const existing=rows.filter(r=>!!r.service_id).map(r=>{
      const st=new Date(r.starts_at).getTime()
      const mins=minutesByService.get(r.service_id as string)||0
      return {start:st, end:st+mins*60000}
    })

    const startMs=dayStart.getTime()
    const now=Date.now()
    const out:string[]=[]
    for(let m=openMin; m+serviceMin<=closeMin; m+=15){
      const st=startMs+m*60000, en=st+serviceMin*60000
      if(selectedDate.toDateString()===new Date().toDateString() && st<now) continue
      const clash=existing.some(ex=>!(en<=ex.start||st>=ex.end))
      if(!clash){
        const hh=String(Math.floor(m/60)).padStart(2,'0')
        const mm=String(m%60).padStart(2,'0')
        out.push(`${hh}:${mm}`)
      }
    }
    setSlots(out)
  })()},[provider,service,selectedDate,hours,services])

  // Sort providers by distance, if we have coords
  const sortedProviders=useMemo(()=>{
    if(!coords) return providers
    return [...providers].sort((a,b)=>{
      const da=(a.lat!=null&&a.lng!=null)?haversineKm(coords,{lat:a.lat!,lng:a.lng!}):1e9
      const db=(b.lat!=null&&b.lng!=null)?haversineKm(coords,{lat:b.lat!,lng:b.lng!}):1e9
      return da-db
    })
  },[providers,coords])

  // AI suggestion
  async function askAI(){
    if(!aiText.trim()){ setAiReply(null); return }
    setLoadingAI(true)
    try{
      const list=services.filter(s=>s.provider_id===provider)
      const text=aiText.toLowerCase()
      let best=list[0]; let score=-1
      for(const s of list){
        const sc=s.name.toLowerCase().split(/\s+/).filter(w=>text.includes(w)).length
        if(sc>score){ score=sc; best=s }
      }
      setService(best?.id||'')
      setAiReply({ summary: best? `We suggest “${best.name}” (${best.minutes} min).`:'No matching service found.', notes: aiText })
    } finally { setLoadingAI(false) }
  }

  // Book
  async function book(){
    const s=services.find(x=>x.id===service)
    const p=providers.find(x=>x.id===provider)
    if(!uid||!s||!p||!time) return alert('Sign in and complete details')
    const [hh,mm]=time.split(':').map(Number)
    const start=new Date(selectedDate); start.setHours(hh||0,mm||0,0,0)

    const payload={ p_provider_id:p.id, p_service_id:s.id, p_starts_at:start.toISOString(), p_notes:(aiReply?.notes||notes||null) }
    const rpc=await supabase.rpc('book_if_available_provider', payload as any)
    if(rpc.error){
      const ins=await supabase.from('bookings').insert({
        provider_id:p.id, service_id:s.id, customer_id:uid, starts_at:start.toISOString(), notes:(aiReply?.notes||notes||null)
      } as any)
      if(ins.error) return alert(rpc.error.message||ins.error.message)
    }

    // simple ICS
    const ics=`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ChairUp//EN
BEGIN:VEVENT
UID:${Date.now()}@chairup
DTSTAMP:${start.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z')}
DTSTART:${start.toISOString().replace(/[-:]/g,'').replace(/\.\d+Z/,'Z')}
SUMMARY:${s.name}
END:VEVENT
END:VCALENDAR`
    const blob=new Blob([ics],{type:'text/calendar'})
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='booking.ics'; a.click()
    alert('Booked!')
  }

  const pickedService=services.find(x=>x.id===service)
  const pickedProvider=providers.find(x=>x.id===provider)
  const providerLabel=pickedProvider?.display_name||(pickedProvider?`Provider ${pickedProvider.id.slice(0,6)}`:'—')
  const canBook=!!(uid&&provider&&service&&time)

  return (
    <div className="grid xl:grid-cols-3 gap-6">
      {/* Providers */}
      <div className="xl:col-span-2 space-y-6">
        <div className="card">
          <div className="text-sm font-medium mb-2">Providers</div>
          <div className="flex flex-wrap gap-2">
            {sortedProviders.map(p=>(
              <button key={p.id} onClick={()=>setProvider(p.id)} className={`chip ${provider===p.id?'chip-on':'chip-off'}`}>
                {p.display_name||`Provider ${p.id.slice(0,6)}`}
                {coords&&p.lat!=null&&p.lng!=null? <span className="opacity-70"> · {haversineKm(coords,{lat:p.lat!,lng:p.lng!}).toFixed(1)} km</span>:null}
              </button>
            ))}
            {providers.length===0&&<div className="text-sm text-slate-500">No providers yet.</div>}
          </div>
          {!coords && (
            <div className="mt-3">
              <button
                className="btn"
                onClick={()=>{
                  if(!('geolocation' in navigator)) return alert('Location not supported.')
                  navigator.geolocation.getCurrentPosition(
                    pos=>setCoords({lat:pos.coords.latitude,lng:pos.coords.longitude}),
                    err=>{console.error(err); alert('Could not get location.')},
                    {enableHighAccuracy:true, timeout:8000}
                  )
                }}
              >Use my location</button>
            </div>
          )}
        </div>

        {/* Services + Date + Time */}
        <div className="card">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <div className="text-sm font-medium mb-2">Services</div>
              <div className="flex flex-wrap gap-2">
                {services.filter(s=>s.provider_id===provider).map(s=>(
                  <button key={s.id} onClick={()=>setService(s.id)} className={`chip ${service===s.id?'chip-on':'chip-off'}`}>
                    {s.name} · ${(s.price_cents/100).toFixed(2)} · {s.minutes}m
                  </button>
                ))}
                {provider && services.filter(s=>s.provider_id===provider).length===0 && (
                  <div className="text-sm text-slate-500">This provider has no services yet.</div>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium mb-2">Date</div>
              <div className="grid grid-cols-7 gap-2">
                {Array.from({length:14}).map((_,i)=>{
                  const d=new Date(); d.setDate(d.getDate()+i)
                  const isSel=d.toDateString()===selectedDate.toDateString()
                  const row=(hours[provider]||[]).find(r=>r.dow===d.getDay())
                  const closed=!row
                  return (
                    <button
                      key={i}
                      disabled={closed}
                      onClick={()=>setSelectedDate(d)}
                      className={`rounded-xl border px-2 py-3 text-xs ${isSel?'bg-black text-white border-black':'bg-white hover:bg-slate-50'} ${closed?'opacity-40 cursor-not-allowed':''}`}
                      title={closed?'Closed':d.toDateString()}
                    >
                      <div className="font-semibold">{d.toLocaleDateString(undefined,{weekday:'short'})}</div>
                      <div>{d.getMonth()+1}/{d.getDate()}</div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-sm font-medium mb-2">Time</div>
            <div className="flex flex-wrap gap-2">
              {slots.length===0 && (
                <div className="text-sm text-slate-500">
                  {provider&&service?'No free times for this day.':'Pick a provider and service to see times.'}
                </div>
              )}
              {slots.map(t=>(
                <button key={t} onClick={()=>setTime(t)} className={`px-3 py-1.5 rounded-lg border text-sm ${time===t?'bg-black text-white border-black':'bg-white hover:bg-slate-50'}`}>{t}</button>
              ))}
            </div>
          </div>
        </div>

        {/* AI helper + notes */}
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-medium">AI suggestion</div>
            <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-slate-100 border border-slate-200">optional</span>
          </div>
          <div className="text-sm text-slate-600 mb-3">Describe what you want (e.g., “mid-skin fade, layers with trim, 1.5″ on top”).</div>
          <div className="flex gap-2">
            <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 w-full" value={aiText} onChange={e=>setAiText(e.target.value)} placeholder="Describe your style or goal…" />
            <button onClick={askAI} className="btn" disabled={loadingAI||!provider}>{loadingAI?'Thinking…':'Suggest'}</button>
          </div>
          {aiReply?.summary && (
            <div className="mt-3 p-3 rounded-xl bg-slate-50 border text-sm">
              <div className="font-medium mb-1">Suggestion</div>
              <div className="text-slate-700">{aiReply.summary}</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="text-sm font-medium mb-2">Notes (optional)</div>
          <textarea className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 min-h-[100px]"
            value={notes} onChange={e=>setNotes(e.target.value)} placeholder="Anything the provider should know?" />
        </div>
      </div>

      {/* Summary */}
      <div className="space-y-6">
        <div className="card">
          <h3 className="text-lg md:text-xl font-semibold">Booking summary</h3>
          <div className="space-y-3 text-sm mt-4">
            <div className="flex justify-between"><span>Provider</span><span className="font-medium">{providerLabel}</span></div>
            <div className="flex justify-between"><span>Service</span><span className="font-medium">{pickedService?.name||'—'}</span></div>
            <div className="flex justify-between"><span>Duration</span><span className="font-medium">{pickedService?.minutes||'—'} min</span></div>
            <div className="flex justify-between"><span>Date</span><span className="font-medium">{selectedDate.toLocaleDateString()}</span></div>
            <div className="flex justify-between"><span>Time</span><span className="font-medium">{time||'—'}</span></div>
            <div className="pt-2 border-t flex justify-between text-base font-semibold"><span>Total</span><span>${((pickedService?.price_cents||0)/100).toFixed(2)}</span></div>
            <button onClick={book} disabled={!canBook} className="btn btn-primary w-full">
              {canBook?'Confirm Booking':'Sign in & complete details'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
