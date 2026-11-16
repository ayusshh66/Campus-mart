import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AlertCircle, BarChart3, Bell, CalendarClock, CheckCheck, ClipboardCheck, FileWarning, History,
  Inbox, MessageSquare, Package, UserRound, Wallet, X, Upload, Send, ArrowRight, Home } from 'lucide-react';
import type { HeroOverview, HeroTask, HeroAvailability, OpsMe, OpsMessage, OpsProof, OpsEvent } from '../services/heroOps';
import { heroOps } from '../services/heroOps';
import { Busy, EmptyState, ErrorBar, Field, HeroShell, NavItem, palette, PersonCircle, Section, shortDate, StatTile,
  StatusPill, StepTrack, TaskTile, Timeline } from '../components/hero-ops/HeroOpsUi';

const nav: NavItem[] = [
  { id:'overview',label:'My Dashboard',icon:Home,group:'OVERVIEW' },
  { id:'available',label:'Available Tasks',icon:Inbox,group:'MY OPERATIONS' },
  { id:'assigned',label:'My Assigned Tasks',icon:ClipboardCheck },
  { id:'history',label:'Task History',icon:History },
  { id:'messages',label:'Messages',icon:MessageSquare },
  { id:'issues',label:'Reported Issues',icon:FileWarning },
  { id:'performance',label:'My Performance',icon:BarChart3,group:'PERFORMANCE' },
  { id:'rewards',label:'Rewards & Earnings',icon:Wallet },
  { id:'profile',label:'Hero Profile',icon:UserRound,group:'ACCOUNT' },
  { id:'notifications',label:'Notifications',icon:Bell },
];
const ACTIVE = ['ASSIGNED','PICKED_UP','DELIVERED'];
const nextStatus: Record<string,string|undefined> = { ASSIGNED:'PICKED_UP', PICKED_UP:'DELIVERED', DELIVERED:'COMPLETED' };

export const HeroOperationsCenter: React.FC = () => {
  const [params,setParams] = useSearchParams();
  const tab = params.get('tab') || 'overview';
  const changeTab=(next:string)=>setParams({ tab:next });
  const [me,setMe]=useState<OpsMe|null>(null);
  const [data,setData]=useState<HeroOverview|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [working,setWorking]=useState(false);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [search,setSearch]=useState('');
  const [statusFilter,setStatusFilter]=useState('ALL');
  const [note,setNote]=useState('');
  const [proofKind,setProofKind]=useState<'PICKUP'|'HANDOVER'>('PICKUP');
  const [proofFile,setProofFile]=useState<File|null>(null);
  const [issueCategory,setIssueCategory]=useState('Student unavailable');
  const [issueDescription,setIssueDescription]=useState('');
  const [issueSeverity,setIssueSeverity]=useState('MEDIUM');
  const [thread,setThread]=useState<OpsMessage[]>([]);
  const [messageText,setMessageText]=useState('');
  const [recipient,setRecipient]=useState('');
  const [history,setHistory]=useState<{proofs:OpsProof[];events:OpsEvent[]}|null>(null);

  const refresh=useCallback(async (first=false)=>{
    try {
      if(first) setLoading(true);
      const access=await heroOps.me();
      setMe(access);
      if(!access.canHero) {setError('Only approved Campus Heroes or admins can open this dashboard.');setData(null);return;}
      const result=await heroOps.heroOverview();setData(result);setError('');
    } catch(e:any){setError(e.message||'Could not load Hero operations.');}
    finally {setLoading(false);}
  },[]);
  useEffect(()=>{void refresh(true);const timer=window.setInterval(()=>{void refresh();},30000);return ()=>window.clearInterval(timer)},[refresh]);
  const selected=useMemo(()=>data?.tasks.find(t=>t.id===selectedId)??null,[data,selectedId]);
  useEffect(()=>{if(!selectedId)return;void Promise.all([heroOps.taskHistory(selectedId),heroOps.taskMessages(selectedId)])
    .then(([h,m])=>{setHistory(h);setThread(m)}).catch(()=>{setHistory(null);setThread([])});},[selectedId]);
  const available=data?.tasks.filter(t=>!t.assigned_hero_id&&ACTIVE.includes(t.status))??[];
  const mine=data?.tasks.filter(t=>t.assigned_hero_id===me?.user?.id)??[];
  const active=mine.filter(t=>ACTIVE.includes(t.status));
  const finished=mine.filter(t=>!ACTIVE.includes(t.status));
  const filtered=(list:HeroTask[])=>list.filter(t=>t.product.name.toLowerCase().includes(search.toLowerCase()) &&(statusFilter==='ALL'||t.status===statusFilter));
  const act=async (fn:()=>Promise<any>,success:string,close=false)=>{
    setWorking(true);setError('');try{await fn();setNotice(success);await refresh();if(close)setSelectedId(null);else if(selectedId){
      const [h,m]=await Promise.all([heroOps.taskHistory(selectedId),heroOps.taskMessages(selectedId)]);setHistory(h);setThread(m);
    }} catch(e:any){setError(e.message||'Action failed');}finally{setWorking(false)}
  };
  const openTask=(t:HeroTask)=>{setSelectedId(t.id);setRecipient(t.seller?.id||t.buyer?.id||'');setHistory(null);setNote('');};
  const uploadProof=()=>{if(!selected||!proofFile)return;void act(async()=>{
    const url=await heroOps.upload(proofFile);
    await heroOps.addProof(selected.id,proofKind,url,note);setProofFile(null);
  },'Photo proof saved to the task timeline.');};
  const taskList=(list:HeroTask[],showClaim=false)=><div className="space-y-3">{filtered(list).length===0?<EmptyState title="No matching tasks" detail="Try adjusting the filters or check again later."/>:filtered(list).map(t=><TaskTile key={t.id} task={t} onView={()=>openTask(t)} actionLabel={showClaim?'Claim task':undefined} onAction={showClaim?()=>void act(()=>heroOps.claim(t.id),'Task claimed. You can now access authorized contact details.'):undefined} pending={working}/>)}</div>;
  const filtering=<div className="mb-4 flex flex-wrap gap-2"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search product..." className={`${palette.field} max-w-[330px] flex-1`}/><select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} className={`${palette.field} max-w-[180px]`}>{['ALL','ASSIGNED','PICKED_UP','DELIVERED','COMPLETED','CANCELLED'].map(s=><option key={s} value={s}>{s}</option>)}</select></div>;
  if(loading&&!data)return <Busy/>;
  if(!me)return <div className="min-h-screen bg-[#090B09] p-8"><ErrorBar message={error||'Please sign in.'} onRetry={()=>void refresh(true)}/><Link to="/login" className="mt-4 inline-block text-[#C6DE41]">Log in</Link></div>;
  return <HeroShell title={nav.find(x=>x.id===tab)?.label||'My Dashboard'} subtitle="Handle pickups, inspections and handovers for your verified campus." name={me.user?.name||'Hero'} college={me.user?.college.code||'Campus'} nav={nav} current={tab} onChange={changeTab} onRefresh={()=>void refresh()} accessory={data&&<span className="hidden text-xs font-bold text-[#C6DE41] sm:inline">{data.availability.replace('_',' ')}</span>}>
    {error&&<ErrorBar message={error} onRetry={()=>void refresh()}/>}{notice&&<div className="flex items-center justify-between rounded-xl border border-[#C6DE41]/20 bg-[#C6DE41]/10 p-3 text-sm text-[#C6DE41]">{notice}<button onClick={()=>setNotice('')}><X size={15}/></button></div>}
    {data&&<>
      {tab==='overview'&&<>
        <Section title={`Hello, ${me.user.name.split(' ')[0]} 👋`} side={<StatusPill value={data.availability}/> }>
          <div className="grid gap-4 md:grid-cols-[1fr_auto]"><div><p className="max-w-2xl text-sm text-stone-400">Here's what needs your attention today at {me.user.college.name}. Availability influences assignment preferences, not account permissions.</p>{data.announcements.slice(0,2).map(a=><p className="mt-3 rounded-xl border border-[#C6DE41]/20 bg-[#C6DE41]/5 p-3 text-xs" key={a.id}><b className="text-[#C6DE41]">{a.title}:</b> {a.content}</p>)}</div><div className="flex flex-wrap items-start gap-1 rounded-xl bg-[#272B24] p-1">{(['AVAILABLE','BUSY','OFF_DUTY'] as HeroAvailability[]).map(s=><button key={s} disabled={working} onClick={()=>void act(()=>heroOps.availability(s),'Availability updated.')} className={`rounded-lg px-3 py-2 text-xs font-bold ${data.availability===s?'bg-[#C6DE41] text-[#090B09]':'text-stone-300'}`}>{s.replace('_',' ')}</button>)}</div></div>
        </Section>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><StatTile label="Active operations" value={data.stats.active} icon={ClipboardCheck}/><StatTile label="Pending pickups" value={data.stats.pickups} icon={CalendarClock}/><StatTile label="Completed" value={data.stats.completed} icon={CheckCheck}/><StatTile label="Needs attention" value={data.stats.issues} icon={AlertCircle} alert={data.stats.issues>0}/></div>
        <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]"><Section title="My priority tasks" side={<button className="text-xs font-semibold text-[#C6DE41]" onClick={()=>changeTab('assigned')}>View all →</button>}>{taskList(active.slice(0,5))}</Section><Section title="Recent activity"><Timeline items={data.events.slice(0,9).map(e=>({id:e.id,title:`${e.actor.name}: ${e.action.replace(/_/g,' ')}`,details:e.details,at:e.created_at}))}/></Section></div>
        <Section title="Available campus tasks" side={<button className="text-xs text-[#C6DE41]" onClick={()=>changeTab('available')}>See queue →</button>}>{taskList(available.slice(0,3),true)}</Section>
      </>}
      {(tab==='available'||tab==='assigned'||tab==='history')&&<>{filtering}{taskList(tab==='available'?available:tab==='assigned'?active:finished,tab==='available')}</>}
      {tab==='messages'&&<Section title="Task conversations"><p className="mb-4 text-sm text-stone-400">Messages are restricted to tasks assigned to you. Choose a task to see its conversation and reply to an authorized participant.</p>{taskList(mine)}</Section>}
      {tab==='issues'&&<Section title="Issues reported by you">{data.issues.length===0?<EmptyState title="No issues reported"/>:data.issues.map(i=><div key={i.id} className="mb-3 rounded-xl border border-white/10 p-4"><div className="flex flex-wrap justify-between gap-2"><b>{i.category}</b><StatusPill value={i.status}/></div><p className="mt-2 text-sm text-stone-400">{i.description}</p>{i.resolution_notes&&<p className="mt-2 text-sm text-[#C6DE41]">Manager response: {i.resolution_notes}</p>}<p className="mt-2 text-xs text-stone-500">{shortDate(i.created_at)}</p></div>)}</Section>}
      {tab==='performance'&&<><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatTile label="Completed" value={data.stats.completed} icon={CheckCheck}/><StatTile label="Currently assigned" value={data.stats.active} icon={ClipboardCheck}/><StatTile label="Completion rate" value={`${mine.length?Math.round(data.stats.completed/mine.length*100):0}%`} icon={BarChart3}/><StatTile label="Issues raised" value={data.issues.length} icon={AlertCircle}/></div><Section title="Your task history"><p className="mb-4 text-sm text-stone-400">These stats are calculated from loaded tasks and can differ from all-time totals when the server limits history.</p>{taskList(finished)}</Section></>}
      {tab==='rewards'&&<Section title="Rewards & Earnings"><EmptyState title="Payout ledger is not configured yet" detail="Your verified task history is available under Performance. Financial rewards require approved payout rules and a separate settlement ledger; no fabricated earnings are shown."/></Section>}
      {tab==='profile'&&<Section title="Campus Hero account"><div className="flex flex-wrap items-center gap-4"><PersonCircle name={me.user.name}/><div><p className="font-bold">{me.user.name}</p><p className="text-sm text-stone-400">{me.user.email} · {me.user.phone}</p><p className="text-xs text-[#C6DE41]">Approved at {me.user.college.name}</p></div></div><Link className={`${palette.secondary} mt-5`} to="/settings">Open account settings <ArrowRight size={15}/></Link></Section>}
      {tab==='notifications'&&<Section title="Latest announcements & operational activity">{data.announcements.map(a=><div className="mb-3 rounded-xl border border-[#C6DE41]/20 bg-[#C6DE41]/5 p-3" key={a.id}><b>{a.title}</b><StatusPill value={a.priority}/><p className="mt-1 text-sm text-stone-400">{a.content}</p><p className="text-xs text-stone-500">{shortDate(a.created_at)}</p></div>)}<Timeline items={data.events.map(e=>({id:e.id,title:e.action.replace(/_/g,' '),details:e.details,at:e.created_at}))}/></Section>}
    </>}
    {selected&&<div className="fixed inset-0 z-[100] flex justify-end bg-black/75" role="dialog" aria-modal="true" aria-label="Task details" onMouseDown={e=>{if(e.target===e.currentTarget)setSelectedId(null)}}>
      <div className="h-full w-full max-w-[850px] overflow-y-auto border-l border-white/15 bg-[#111511] p-4 shadow-2xl sm:p-6">
        <div className="mb-5 flex items-center justify-between"><div><p className="text-xs font-bold text-[#C6DE41]">TASK #{selected.id.slice(0,8)}</p><h2 className="mt-1 text-2xl font-bold">{selected.product.name}</h2></div><button className={palette.secondary} onClick={()=>setSelectedId(null)}><X size={19}/></button></div>
        <StepTrack status={selected.status}/><div className="mt-5 grid gap-5 md:grid-cols-[1.1fr_1fr]">
          <div className="space-y-5"><Section title="Product & inspection"><div className="mb-3 aspect-[16/10] overflow-hidden rounded-xl bg-[#242922]">{selected.photos[0]||selected.product.image_url?<img src={selected.photos[0]||selected.product.image_url} alt={selected.product.name} className="h-full w-full object-cover"/>:<Package className="m-auto mt-16"/>}</div><p className="text-sm">Category: {selected.product.category} · {selected.condition??'Condition available after claiming'}</p><p className="mt-2 text-sm text-stone-400">{selected.description||'No additional description.'}</p><p className="mt-2 text-sm text-stone-400">Quality checked: {selected.quality_verified?'Yes':'Not yet'}</p>{selected.photos.length>1&&<div className="mt-3 flex gap-2 overflow-x-auto">{selected.photos.slice(1).map((url,i)=><img key={i} className="h-16 w-20 rounded object-cover" src={url} alt={`Item photo ${i+2}`}/>)}</div>}</Section>
          <Section title="Event timeline"><Timeline items={history?.events.map(e=>({id:e.id,title:`${e.actor.name} · ${e.action.replace(/_/g,' ')}`,details:e.details,at:e.created_at}))??[]}/></Section>
          <Section title="Photo evidence"><p className="mb-3 text-xs text-stone-400">Images are operational evidence, not payment verification.</p>{history?.proofs.map(p=><div key={p.id} className="mb-3 rounded-lg border border-white/10 p-2"><a href={p.image_url} target="_blank" rel="noreferrer"><img src={p.image_url} alt={`${p.kind} proof`} className="h-28 rounded-lg object-cover"/></a><div className="mt-2 flex gap-2"><StatusPill value={p.kind}/><StatusPill value={p.review_status}/></div></div>)}{selected.assigned_hero_id===me.user.id&&ACTIVE.includes(selected.status)&&<div className="space-y-3"><select className={palette.field} value={proofKind} onChange={e=>setProofKind(e.target.value as any)}><option value="PICKUP">Pickup proof</option><option value="HANDOVER">Handover proof</option></select><input type="file" accept="image/jpeg,image/png,image/webp" className="w-full text-xs" onChange={e=>setProofFile(e.target.files?.[0]||null)}/><button className={palette.button} disabled={!proofFile||working} onClick={uploadProof}><Upload size={15}/> Upload proof</button></div>}</Section></div>
          <div className="space-y-5"><Section title="Task information"><div className="flex flex-wrap gap-2"><StatusPill value={selected.status}/><StatusPill value={selected.task_type}/></div><p className="mt-3 text-xs text-stone-400">Created: {shortDate(selected.created_at)}</p><p className="mt-1 text-xs text-stone-400">College: {selected.college.name}</p><p className="mt-3 text-xs text-stone-400">Seller: <span className="text-white">{selected.seller?.name||'—'}</span> {selected.seller?.phone&&<a className="text-[#C6DE41]" href={`tel:${selected.seller.phone}`}>{selected.seller.phone}</a>}</p><p className="mt-2 text-xs text-stone-400">Buyer: <span className="text-white">{selected.buyer?.name||'—'}</span> {selected.buyer?.phone&&<a className="text-[#C6DE41]" href={`tel:${selected.buyer.phone}`}>{selected.buyer.phone}</a>}</p><p className="mt-3 text-xs text-stone-500">Pickup: {selected.pickup_notes||'Agree a meeting place with the student'}</p><p className="mt-1 text-xs text-stone-500">Delivery: {selected.delivery_notes||'Confirm handover location'}</p></Section>
            <Section title="Task actions">{!selected.assigned_hero_id?<button disabled={working} className={palette.button} onClick={()=>void act(()=>heroOps.claim(selected.id),'Task claimed successfully.')}>Claim this task</button>:selected.assigned_hero_id===me.user.id&&nextStatus[selected.status]?<div className="space-y-3"><Field label="Operational notes"><textarea rows={3} value={note} onChange={e=>setNote(e.target.value)} className={palette.field} placeholder="Inspection or handover notes"/></Field><p className="text-xs text-stone-400">For pickup, clicking the button confirms you physically inspected the item. Payment status is not changed.</p><button disabled={working} className={palette.button} onClick={()=>{if(window.confirm(`Confirm task step: ${nextStatus[selected.status]}?`))void act(()=>heroOps.status(selected.id,nextStatus[selected.status] as any,nextStatus[selected.status]==='PICKED_UP',note),'Task updated.')}}><ClipboardCheck size={16}/> Mark {nextStatus[selected.status]?.replace(/_/g,' ')}</button></div>:<p className="text-sm text-stone-500">No further actions for your current task status.</p>}</Section>
            {selected.assigned_hero_id===me.user.id&&<><Section title="Report an issue"><div className="space-y-3"><Field label="Issue type"><select value={issueCategory} onChange={e=>setIssueCategory(e.target.value)} className={palette.field}>{['Student unavailable','Wrong location','Product condition mismatch','Damaged item','Missed pickup','Buyer/seller dispute','Other'].map(c=><option key={c}>{c}</option>)}</select></Field><Field label="Severity"><select value={issueSeverity} onChange={e=>setIssueSeverity(e.target.value)} className={palette.field}>{['LOW','MEDIUM','HIGH'].map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Description"><textarea rows={3} className={palette.field} value={issueDescription} onChange={e=>setIssueDescription(e.target.value)} placeholder="Explain what happened..."/></Field><button className={palette.secondary} disabled={working||issueDescription.trim().length<10} onClick={()=>void act(async()=>{await heroOps.reportIssue(selected.id,issueCategory,issueSeverity,issueDescription);setIssueDescription('')},'Issue reported to campus manager.')}><AlertCircle size={16}/> Submit issue</button></div></Section>
              <Section title="Task messages"><div className="max-h-56 space-y-3 overflow-y-auto">{thread.map(m=><div key={m.id} className={`rounded-xl p-3 text-xs ${m.is_mine?'bg-[#C6DE41]/10':'bg-white/5'}`}><p className="mb-1 font-semibold text-[#C6DE41]">{m.sender_name} · {shortDate(m.created_at)}</p><p>{m.content}</p></div>)}{!thread.length&&<p className="text-xs text-stone-500">No messages in this task.</p>}</div><div className="mt-3 space-y-2"><select value={recipient} onChange={e=>setRecipient(e.target.value)} className={palette.field}>{selected.seller&&<option value={selected.seller.id}>Seller: {selected.seller.name}</option>}{selected.buyer&&<option value={selected.buyer.id}>Buyer: {selected.buyer.name}</option>}</select><textarea rows={2} className={palette.field} placeholder="Message student about this handover" value={messageText} onChange={e=>setMessageText(e.target.value)}/><button disabled={!recipient||!messageText.trim()||working} className={palette.button} onClick={()=>void act(async()=>{await heroOps.sendMessage(selected.id,recipient,messageText);setMessageText('')},'Message sent.')}><Send size={15}/> Send</button></div></Section></>}
          </div>
        </div>
      </div>
    </div>}
  </HeroShell>;
};
export default HeroOperationsCenter;
