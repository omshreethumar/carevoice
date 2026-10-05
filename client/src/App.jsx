import {useState,useMemo,useEffect} from 'react';
import {LayoutDashboard,FileText,Pill,CalendarDays,Mic,Users,Settings as Cog,Volume2,Check,Phone,PhoneOff,Sparkles,Upload,AlertTriangle,Utensils,Footprints,FlaskConical,Stethoscope,HeartPulse,X,ShieldCheck,Clock,Loader2,Bell,Sunrise,Sun,Moon,ListChecks,CheckCircle2,Hourglass} from 'lucide-react';
import {DEMO_DOC} from './data/demo.js';import {simplify,SAY} from './data/i18n.js';
import {extractDocument,explainTerm} from './services/ai.js';import {speak,listen,parseYesNo,LANGS} from './services/voice.js';import {placeCall} from './services/phone.js';

const DISCLAIMER='CareVoice helps patients understand healthcare instructions. It does not replace a doctor.';
const toMin=t=>{const[h,m]=t.split(':');return +h*60+ +m};
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes()};
const fmt=t=>{const[h,m]=t.split(':');return `${+h%12||12}:${m} ${+h<12?'AM':'PM'}`};
const ICON={med:Pill,test:FlaskConical,diet:Utensils,activity:Footprints};
const TINT={med:'bg-teal-100 text-teal-700',test:'bg-violet-100 text-violet-700',diet:'bg-amber-100 text-amber-700',activity:'bg-sky-100 text-sky-700'};
const NAV=[['dashboard','Dashboard',LayoutDashboard],['documents','Documents',FileText],['medicines','Medicines',Pill],['appointments','Appointments',CalendarDays],['voice','Voice Assistant',Mic],['caregiver','Caregiver',Users],['settings','Settings',Cog]];

const Card=({className='',children})=><div className={`rounded-3xl bg-white p-5 shadow-sm ring-1 ring-slate-100 animate-up ${className}`}>{children}</div>;
const Demo=()=><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-amber-800">Demo data</span>;
const Disclaimer=()=><p className="flex items-start gap-2 text-sm text-slate-500"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-600"/>{DISCLAIMER}</p>;
const Title=({children,sub})=><div className="mb-6"><h1 className="text-3xl font-extrabold text-brand-900">{children}</h1>{sub&&<p className="text-slate-500">{sub}</p>}</div>;

function Task({t,lang,onDone,onPlay}){const I=ICON[t.type];const done=t.s==='done';
  return <div className={`flex flex-col gap-4 rounded-3xl p-4 ring-1 transition sm:flex-row sm:items-center ${done?'bg-brand-50 ring-brand-100':t.s==='overdue'||t.s==='missed'?'bg-rose-50 ring-rose-100':'bg-white ring-slate-100'}`}>
    <div className="flex flex-1 items-center gap-4"><div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl ${TINT[t.type]}`}><I className="h-7 w-7"/></div>
      <div><p className="flex items-center gap-1 text-sm font-bold text-slate-500"><Clock className="h-4 w-4"/>{fmt(t.time)}{t.s==='overdue'&&<span className="ml-2 text-rose-600">Time passed</span>}{t.s==='missed'&&<span className="ml-2 text-rose-600">Missed</span>}</p>
        <p className={`text-xl font-semibold ${done?'line-through opacity-60':''}`}>{simplify(t,lang)}</p>
        <p className="text-xs text-slate-400">From document: “{t.raw}”</p></div></div>
    <div className="flex gap-2"><button onClick={()=>onPlay(t)} className="btn bg-sky-100 text-sky-800 hover:bg-sky-200"><Volume2 className="h-5 w-5"/>Play Voice</button>
      <button onClick={()=>onDone(t.id)} disabled={done} className={`btn ${done?'bg-brand-100 text-brand-700':'bg-brand-600 text-white hover:bg-brand-700'}`}><Check className="h-5 w-5"/>{done?'Done':'Mark Done'}</button></div></div>;}

function Landing({onDemo,onUpload,busy}){
  return <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-sky-50">
    <header className="mx-auto flex max-w-6xl items-center gap-2 p-6 text-2xl font-extrabold text-brand-900"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white"><HeartPulse/></span>CareVoice</header>
    <section className="mx-auto max-w-4xl px-6 pb-16 pt-10 text-center animate-up">
      <h1 className="text-4xl font-extrabold leading-tight text-brand-900 sm:text-6xl">Understand Your Discharge. <span className="text-brand-600">Follow Your Recovery.</span></h1>
      <p className="mx-auto mt-6 max-w-2xl text-xl text-slate-600">Upload your hospital discharge papers. CareVoice turns them into a simple daily plan with voice reminders in English, Hindi and Gujarati.</p>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <button onClick={onDemo} className="btn bg-brand-600 px-8 py-4 text-xl text-white shadow-lg shadow-brand-500/30 hover:bg-brand-700">Try with demo discharge</button>
        <label className="btn cursor-pointer bg-white px-8 py-4 text-xl text-brand-700 ring-2 ring-brand-100 hover:bg-brand-50">{busy?<Loader2 className="animate-spin"/>:<Upload/>}Upload PDF / image<input type="file" accept=".pdf,image/*" hidden onChange={e=>e.target.files[0]&&onUpload(e.target.files[0])}/></label></div>
      <div className="mt-14 grid gap-4 text-left sm:grid-cols-3">{[[FileText,'1. Upload','Medicines, timings, diet, tests, appointments and warnings are pulled out.'],[Sparkles,'2. Simplify','Medical language becomes plain words, always shown next to the original.'],[Volume2,'3. Remind','A daily timeline, voice reminders and a friendly check-in call.']].map(([I,h,p])=><Card key={h}><I className="mb-3 h-8 w-8 text-brand-600"/><h3 className="text-xl font-bold">{h}</h3><p className="text-slate-500">{p}</p></Card>)}</div>
      <div className="mt-10 flex justify-center"><Disclaimer/></div></section></div>;}

export default function App(){
  const [doc,setDoc]=useState(null),[page,setPage]=useState('dashboard'),[lang,setLang]=useState('en'),[st,setSt]=useState({}),[now,setNow]=useState(nowMin()),[ex,setEx]=useState(null),[busy,setBusy]=useState(false);
  useEffect(()=>{const i=setInterval(()=>setNow(nowMin()),30000);return()=>clearInterval(i)},[]);
  const tasks=useMemo(()=>doc?doc.tasks.map(t=>({...t,s:st[t.id]||(toMin(t.time)<now?'overdue':'pending')})):[],[doc,st,now]);
  const done=tasks.filter(t=>t.s==='done'),pending=tasks.filter(t=>t.s!=='done'),meds=tasks.filter(t=>t.type==='med');
  const next=pending.find(t=>toMin(t.time)>=now)||pending[0];
  const mark=(id,v='done')=>setSt(s=>({...s,[id]:v})),play=t=>speak(simplify(t,lang),lang);
  const upload=async f=>{setBusy(true);setDoc(await extractDocument(f));setBusy(false);setPage('documents')};
  const explain=async term=>{setEx({term,text:'…'});setEx({term,...await explainTerm(term)})};
  if(!doc)return <Landing busy={busy} onDemo={()=>{setDoc(DEMO_DOC);setPage('dashboard')}} onUpload={upload}/>;
  const List=({items})=><div className="space-y-3">{items.map(t=><Task key={t.id} t={t} lang={lang} onDone={mark} onPlay={play}/>)}</div>;
  const Stat=({l,v,c})=><Card><p className="text-sm font-bold uppercase text-slate-400">{l}</p><p className={`text-4xl font-extrabold ${c}`}>{v}</p></Card>;
  const Warn=()=>doc.warnings.map(w=><div key={w.id} className="flex gap-3 rounded-3xl bg-rose-50 p-5 ring-1 ring-rose-200"><AlertTriangle className="h-8 w-8 shrink-0 text-rose-600"/><div><p className="text-xl font-bold text-rose-800">{w.simple}</p><p className="text-sm text-rose-700/70">Original: “{w.raw}”</p></div></div>);

  const Dashboard=()=>{
    const hr=Math.floor(now/60),greet=hr<12?'Good morning':hr<17?'Good afternoon':'Good evening';
    const pct=tasks.length?Math.round(done.length/tasks.length*100):0,R=52,C=2*Math.PI*R;
    const diff=next?toMin(next.time)-now:0;
    const eta=!next?'':diff>0?`in ${diff>=60?Math.floor(diff/60)+'h ':''}${diff%60}m`:'time has passed';
    const groups=[['Morning',Sunrise,t=>toMin(t.time)<720],['Afternoon',Sun,t=>toMin(t.time)>=720&&toMin(t.time)<1020],['Evening',Moon,t=>toMin(t.time)>=1020]];
    const tiles=[[ListChecks,"Today's tasks",tasks.length,'bg-brand-50 text-brand-700'],[CheckCircle2,'Completed',done.length,'bg-emerald-50 text-emerald-600'],[Hourglass,'Pending',pending.length,'bg-amber-50 text-amber-600'],[Pill,'Medicines',meds.length+' doses','bg-teal-50 text-teal-700']];
    return <>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3 animate-up"><div><p className="font-semibold text-brand-600">{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p><h1 className="text-3xl font-extrabold text-brand-900 sm:text-4xl">{greet} 👋</h1><p className="text-slate-500">{doc.title}</p></div>
      <div className="flex gap-1 rounded-2xl bg-white p-1 ring-1 ring-slate-100">{Object.entries(LANGS).map(([k,v])=><button key={k} onClick={()=>setLang(k)} className={`rounded-xl px-4 py-2 text-base font-semibold transition ${lang===k?'bg-brand-600 text-white':'text-slate-500 hover:bg-slate-50'}`}>{v.label}</button>)}</div></div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-brand-600 via-brand-700 to-brand-900 p-6 text-white shadow-xl shadow-brand-600/20 animate-up lg:col-span-2">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10"/>
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <div className="relative mx-auto h-36 w-36 shrink-0"><svg viewBox="0 0 120 120" className="h-full w-full -rotate-90"><circle cx="60" cy="60" r={R} fill="none" stroke="rgba(255,255,255,.2)" strokeWidth="10"/><circle cx="60" cy="60" r={R} fill="none" stroke="#fff" strokeWidth="10" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C*(1-pct/100)} style={{transition:'stroke-dashoffset .8s ease'}}/></svg>
            <div className="absolute inset-0 grid place-items-center text-center"><div><p className="text-4xl font-extrabold">{pct}%</p><p className="text-xs uppercase tracking-wide opacity-70">done today</p></div></div></div>
          <div className="flex-1"><p className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide opacity-80"><Bell className="h-4 w-4"/>Next reminder {next&&<span className="rounded-full bg-white/20 px-2 py-0.5 normal-case">{eta}</span>}</p>
            {next?<><p className="mt-1 text-4xl font-extrabold">{fmt(next.time)}</p><p className="mt-1 text-xl opacity-95">{simplify(next,lang)}</p>
              <div className="mt-4 flex flex-wrap gap-2"><button onClick={()=>play(next)} className="btn bg-white/15 text-white hover:bg-white/25"><Volume2 className="h-5 w-5"/>Play Voice</button><button onClick={()=>mark(next.id)} className="btn bg-white text-brand-700 hover:bg-brand-50"><Check className="h-5 w-5"/>Mark Done</button></div></>
              :<p className="mt-2 text-3xl font-extrabold">All done for today 🎉</p>}</div></div></div>

      <div className="grid gap-4"><Card className="bg-gradient-to-br from-sky-50 to-white"><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Phone/></div><div><p className="text-lg font-bold">Voice Check-In</p><p className="text-sm text-slate-500">A friendly call about your medicine</p></div></div><button onClick={()=>setPage('voice')} className="btn mt-3 w-full bg-sky-600 text-white hover:bg-sky-700">Start check-in</button></Card>
        <Card><div className="flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700"><Stethoscope/></div><div><p className="text-sm font-bold uppercase text-slate-400">Appointments</p>{doc.appointments.map(a=><p key={a.id} className="font-bold leading-tight">{a.title}<span className="block text-sm font-normal text-slate-500">{a.when}</span></p>)}</div></div></Card></div></div>

    <div className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">{tiles.map(([I,l,v,c])=><Card key={l} className="flex items-center gap-3 !p-4"><div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${c}`}><I className="h-6 w-6"/></div><div><p className="text-2xl font-extrabold leading-none">{v}</p><p className="text-sm text-slate-500">{l}</p></div></Card>)}</div>

    <div className="mt-4 space-y-3"><Warn/></div>

    <h2 className="mb-1 mt-10 text-2xl font-extrabold text-brand-900">Your day, step by step</h2>
    {groups.map(([name,I,f])=>{const items=tasks.filter(f);return items.length>0&&<section key={name} className="mt-6"><h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-500"><I className="h-5 w-5"/>{name}</h3>
      <div className="relative ml-3 space-y-3 border-l-2 border-brand-100 pl-6">{items.map(t=><div key={t.id} className="relative">
        <span className={`absolute -left-[34px] top-9 h-4 w-4 rounded-full ring-4 ring-slate-50 ${t.s==='done'?'bg-emerald-500':t.s==='pending'?(next&&next.id===t.id?'bg-brand-500':'bg-slate-300'):'bg-rose-500'}`}/>
        {next&&next.id===t.id&&<span className="absolute -top-2 right-4 z-10 rounded-full bg-brand-600 px-3 py-0.5 text-xs font-bold text-white">Up next</span>}
        <div className={next&&next.id===t.id?'rounded-3xl ring-2 ring-brand-500 shadow-lg shadow-brand-500/10':''}><Task t={t} lang={lang} onDone={mark} onPlay={play}/></div></div>)}</div></section>})}
    </>};

  const Documents=()=>{const[q,setQ]=useState('');return <>
    <Title sub="What we found in your discharge papers">Documents</Title>
    <Card className="border-2 border-dashed border-brand-100 text-center"><Upload className="mx-auto h-10 w-10 text-brand-600"/><p className="mt-2 font-semibold">{busy?'Reading document…':'Upload another PDF or image'}</p>
      <label className="btn mt-3 cursor-pointer bg-brand-600 text-white">Choose file<input type="file" accept=".pdf,image/*" hidden onChange={e=>e.target.files[0]&&upload(e.target.files[0])}/></label></Card>
    <div className="my-4 flex flex-wrap items-center gap-3"><h2 className="text-xl font-bold">{doc.title}</h2>{doc.isDemo&&<Demo/>}</div>
    <p className="mb-4 rounded-2xl bg-amber-50 p-3 text-sm text-amber-900">Extraction here is simulated and always returns sample data. Check every instruction against your original papers.</p>
    <div className="grid gap-3 md:grid-cols-2">{tasks.map(t=><Card key={t.id}><p className="text-xs font-bold uppercase text-slate-400">Original</p><p className="font-mono text-sm">{t.raw}</p><p className="mt-2 text-xs font-bold uppercase text-brand-600">Simple</p><p className="text-lg font-semibold">{simplify(t,lang)}</p></Card>)}</div>
    <Card className="mt-6"><h3 className="flex items-center gap-2 text-xl font-bold"><Sparkles className="text-brand-600"/>Explain Simply</h3><p className="text-slate-500">Type a medical word like BID, dyspnea or syncope.</p>
      <div className="mt-3 flex gap-2"><input value={q} onChange={e=>setQ(e.target.value)} onKeyDown={e=>e.key==='Enter'&&q&&explain(q)} className="flex-1 rounded-2xl border border-slate-200 px-4 py-3" placeholder="Medical term"/><button onClick={()=>q&&explain(q)} className="btn bg-brand-600 text-white">Explain</button></div></Card>
    <div className="mt-4 space-y-3"><Warn/></div></>};

  const Medicines=()=>{const names=[...new Set(meds.map(m=>m.name))];return <><Title sub="Doses are copied exactly from your document">Medicines</Title>
    <div className="grid gap-4 md:grid-cols-2">{names.map(n=>{const ms=meds.filter(m=>m.name===n);return <Card key={n}><div className="flex items-center gap-3"><div className={`grid h-12 w-12 place-items-center rounded-2xl ${TINT.med}`}><Pill/></div><div><h3 className="text-2xl font-bold">{n}</h3><p className="text-slate-500">{ms[0].dose}</p></div></div>
      <p className="mt-3 text-slate-600">{ms.map(m=>fmt(m.time)).join(' · ')}</p><button onClick={()=>explain(n)} className="btn mt-3 bg-violet-100 text-violet-800"><Sparkles className="h-5 w-5"/>Explain Simply</button></Card>})}</div></>};

  const Appointments=()=><><Title>Appointments</Title>{doc.appointments.map(a=><Card key={a.id}><div className="flex items-center gap-4"><div className="grid h-14 w-14 place-items-center rounded-2xl bg-sky-100 text-sky-700"><Stethoscope className="h-7 w-7"/></div><div><h3 className="text-2xl font-bold">{a.title}</h3><p className="text-slate-500">{a.when}</p><p className="text-xs text-slate-400">From document: “{a.raw}”</p></div></div></Card>)}</>;

  const Voice=()=>{const[ph,setPh]=useState('idle'),[log,setLog]=useState('');
    const say=async k=>{setLog(SAY[k][lang]);await speak(SAY[k][lang],lang)};
    const answer=async a=>{if(!a){await say('retry');setPh('asking');return}
      const target=tasks.filter(t=>t.type==='med'&&t.s!=='done'&&toMin(t.time)<=now);target.forEach(t=>mark(t.id,a==='yes'?'done':'missed'));setPh('done');await say(a)};
    const call=async()=>{setPh('ringing');await placeCall('+91 00000 00000');setPh('asking');setLog(SAY.q[lang]);await speak(SAY.q[lang],lang);setPh('listening');const heard=await listen(lang);if(heard){setLog(`You said: “${heard}”`);answer(parseYesNo(heard))}else setPh('asking')};
    return <><Title sub="Choose a language, then try a simulated phone call">Voice Assistant</Title>
    <div className="mb-4 flex gap-2">{Object.entries(LANGS).map(([k,v])=><button key={k} onClick={()=>setLang(k)} className={`btn ${lang===k?'bg-brand-600 text-white':'bg-white ring-1 ring-slate-200'}`}>{v.label}</button>)}</div>
    <Card className="mx-auto max-w-md text-center"><div className="relative mx-auto grid h-28 w-28 place-items-center">{ph==='ringing'&&<span className="absolute inset-0 rounded-full bg-brand-500 animate-ring"/>}<div className="relative grid h-24 w-24 place-items-center rounded-full bg-brand-600 text-white">{ph==='idle'||ph==='done'?<PhoneOff className="h-10 w-10"/>:<Phone className="h-10 w-10"/>}</div></div>
      <p className="mt-3 text-sm font-bold uppercase text-slate-400">{{idle:'Demo call · not a real call',ringing:'Calling…',asking:'CareVoice is asking',listening:'Listening… or tap below',done:'Call ended'}[ph]}</p>
      <p className="mt-2 min-h-[3.5rem] text-xl font-semibold">{log||SAY.q[lang]}</p>
      {(ph==='idle'||ph==='done')?<button onClick={call} className="btn mt-4 w-full bg-brand-600 py-4 text-xl text-white"><Phone/>Start check-in call</button>:
        <div className="mt-4 grid grid-cols-2 gap-3"><button onClick={()=>answer('yes')} className="btn bg-emerald-600 py-4 text-xl text-white">Yes / हाँ / હા</button><button onClick={()=>answer('no')} className="btn bg-rose-600 py-4 text-xl text-white">No / नहीं / ના</button></div>}
      <p className="mt-3 text-xs text-slate-400">Say or tap Yes/No. Voice quality for Hindi and Gujarati depends on your device.</p></Card></>};

  const Caregiver=()=>{const missed=tasks.filter(t=>t.s==='missed'||t.s==='overdue'),up=tasks.filter(t=>t.s==='pending'),pct=Math.round(done.length/tasks.length*100);
    return <><Title sub="Live view of the patient's day">Caregiver</Title>
    {missed.length>0&&<div className="mb-4 flex gap-3 rounded-3xl bg-rose-50 p-5 text-rose-800 ring-1 ring-rose-200"><AlertTriangle/><b>{missed.length} task(s) missed or overdue. Consider checking in.</b></div>}
    <Card className="mb-4"><div className="flex justify-between"><b>Completed today</b><b>{pct}%</b></div><div className="mt-2 h-4 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-brand-500 transition-all duration-700" style={{width:pct+'%'}}/></div></Card>
    <div className="grid gap-4 lg:grid-cols-3">{[['Completed',done,'text-emerald-600'],['Missed / overdue',missed,'text-rose-600'],['Upcoming',up,'text-slate-600']].map(([h,a,c])=><Card key={h}><h3 className={`mb-3 text-xl font-bold ${c}`}>{h} ({a.length})</h3>{a.map(t=><p key={t.id} className="border-t border-slate-100 py-2"><b>{fmt(t.time)}</b> {t.name} {t.dose||''}</p>)}</Card>)}</div></>};

  const Settings=()=><><Title>Settings</Title><Card className="space-y-4"><div><p className="font-bold">Language</p><div className="mt-2 flex gap-2">{Object.entries(LANGS).map(([k,v])=><button key={k} onClick={()=>setLang(k)} className={`btn ${lang===k?'bg-brand-600 text-white':'bg-slate-100'}`}>{v.label}</button>)}</div></div>
    <div><p className="font-bold">Integrations (all mocked)</p>{['AI extraction & simplification','OCR','Text-to-speech / speech-to-text (browser)','Twilio phone calls'].map(x=><p key={x} className="py-1 text-slate-500">• {x} — see src/services</p>)}</div><button onClick={()=>{setDoc(null);setSt({})}} className="btn bg-slate-100">Reset demo</button><Disclaimer/></Card></>;

  const Page={dashboard:Dashboard,documents:Documents,medicines:Medicines,appointments:Appointments,voice:Voice,caregiver:Caregiver,settings:Settings}[page];
  return <div className="min-h-screen">
    <aside className="fixed inset-y-0 hidden w-64 flex-col bg-white p-5 ring-1 ring-slate-100 md:flex"><div className="mb-8 flex items-center gap-2 text-2xl font-extrabold text-brand-900"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-brand-600 text-white"><HeartPulse/></span>CareVoice</div>
      {NAV.map(([k,l,I])=><button key={k} onClick={()=>setPage(k)} className={`mb-1 flex items-center gap-3 rounded-2xl px-4 py-3 text-left font-semibold transition ${page===k?'bg-brand-50 text-brand-700':'text-slate-500 hover:bg-slate-50'}`}><I className="h-6 w-6"/>{l}</button>)}
      <div className="mt-auto space-y-2">{doc.isDemo&&<Demo/>}<Disclaimer/></div></aside>
    <nav className="fixed inset-x-0 bottom-0 z-20 flex overflow-x-auto bg-white p-2 shadow-[0_-4px_20px_rgba(0,0,0,.06)] md:hidden">{NAV.map(([k,l,I])=><button key={k} onClick={()=>setPage(k)} className={`flex min-w-[76px] flex-col items-center rounded-2xl px-2 py-2 text-xs font-semibold ${page===k?'bg-brand-50 text-brand-700':'text-slate-500'}`}><I className="h-6 w-6"/>{l.split(' ')[0]}</button>)}</nav>
    <main className="mx-auto max-w-5xl p-5 pb-28 md:ml-64 md:p-8"><Page/><div className="mt-10"><Disclaimer/></div></main>
    {ex&&<div className="fixed inset-0 z-30 grid place-items-center bg-slate-900/40 p-4" onClick={()=>setEx(null)}><Card className="max-w-md" ><div className="flex justify-between"><h3 className="text-2xl font-extrabold capitalize">{ex.term}</h3><button onClick={()=>setEx(null)}><X/></button></div><p className="mt-3 text-xl">{ex.text}</p>
      {ex.found&&<p className="mt-2 text-xs text-slate-400">General explanation only. Follow your own discharge papers for your instructions.</p>}<button onClick={()=>speak(ex.text,'en')} className="btn mt-4 bg-sky-100 text-sky-800"><Volume2 className="h-5 w-5"/>Play Voice</button></Card></div>}</div>;}
