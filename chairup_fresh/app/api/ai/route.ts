import { NextRequest, NextResponse } from 'next/server'
export async function POST(req: NextRequest){
  const body = await req.json().catch(()=>({}))
  const description: string = (body.description||'').toLowerCase()
  const services: Array<{ id:string; name:string; minutes:number }> = body.services||[]
  let best = services[0]; let bestScore = -1
  for(const s of services){
    const words = s.name.toLowerCase().split(/\s+/)
    const score = words.reduce((acc,w)=>acc + (description.includes(w)?1:0), 0)
    if(score>bestScore){ bestScore=score; best=s }
  }
  return NextResponse.json({
    serviceId: best?.id || null,
    summary: best? `We suggest “${best.name}” (${best.minutes} min).`: 'No matching service found.',
    notes: description
  })
}
