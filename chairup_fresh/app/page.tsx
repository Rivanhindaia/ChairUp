import Link from 'next/link'
export default function Home(){
  return (
    <div className="space-y-10">
      <section className="rounded-3xl relative overflow-hidden bg-gradient-to-br from-white to-slate-100 border p-8 md:p-12">
        <div className="max-w-2xl">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight leading-tight">
            Appointments that feel <span className="underline decoration-sky-400 decoration-4 underline-offset-4">effortless</span>.
          </h1>
          <p className="mt-5 text-lg text-slate-600">
            <b>ChairUp</b> is a sleek booking experience for <b>any service</b>—barbers, stylists, lash techs, trainers, tutors…
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" href="/app">Find appointments</Link>
            <Link className="btn" href="/dashboard">I’m a provider</Link>
          </div>
        </div>
        <div aria-hidden className="absolute -right-24 -bottom-24 w-[40rem] h-[40rem] rounded-full bg-sky-100 blur-3xl" />
      </section>
      <section className="grid md:grid-cols-3 gap-6">
        <div className="card"><div className="text-2xl font-bold mb-2">Smart suggestions</div><p className="text-slate-600">Describe your goal—get a suggested service and duration.</p></div>
        <div className="card"><div className="text-2xl font-bold mb-2">Nearby first</div><p className="text-slate-600">Use location to surface providers around you.</p></div>
        <div className="card"><div className="text-2xl font-bold mb-2">Zero friction</div><p className="text-slate-600">One clean flow from pick → calendar invite.</p></div>
      </section>
    </div>
  )
}
