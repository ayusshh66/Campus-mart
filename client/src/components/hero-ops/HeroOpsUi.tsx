import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Building2, CheckCircle2, Clock, MapPin, Menu, Package, RefreshCw, ShieldCheck, X } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { HeroTask } from '../../services/heroOps';

export const palette = {
  card: 'rounded-2xl border border-white/10 bg-[#171A16]',
  field: 'w-full rounded-xl border border-white/15 bg-[#0E110D] px-3 py-2.5 text-sm text-[#F5F7F0] outline-none focus:border-[#C6DE41] placeholder:text-stone-600',
  button: 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#C6DE41] px-4 py-2.5 text-sm font-bold text-[#090B09] transition hover:bg-[#D7EF59] disabled:cursor-not-allowed disabled:opacity-50',
  secondary: 'inline-flex items-center justify-center gap-2 rounded-xl border border-white/15 bg-[#252923] px-4 py-2.5 text-sm font-semibold text-[#E5E9DF] transition hover:border-[#C6DE41]/40 hover:text-[#C6DE41] disabled:opacity-50',
};
export function shortDate(date?: string | null) { return date ? new Date(date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'; }
export function initials(name?: string) { return (name ?? '?').split(' ').slice(0,2).map(x=>x[0]).join('').toUpperCase(); }
export function StatusPill({ value }: { value: string }) {
  const positive = ['COMPLETED','AVAILABLE','RESOLVED','APPROVED','DELIVERED'].includes(value);
  const urgent = ['CANCELLED','ESCALATED','HIGH','FLAGGED','REJECTED'].includes(value);
  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wide ${positive ? 'border-[#C6DE41]/35 bg-[#C6DE41]/10 text-[#C6DE41]' : urgent ? 'border-rose-400/30 bg-rose-400/10 text-rose-300' : 'border-white/10 bg-white/5 text-stone-300'}`}>{value.replace(/_/g,' ')}</span>;
}
export type NavItem = { id: string; label: string; icon: LucideIcon; group?: string };
export function HeroShell({ title, subtitle, name, college, manager = false, nav, current, onChange, onRefresh, children, accessory }:
{ title: string; subtitle: string; name: string; college: string; manager?: boolean;
  nav: NavItem[]; current: string; onChange: (tab: string)=>void; onRefresh: ()=>void; children: React.ReactNode; accessory?: React.ReactNode }) {
  const [open,setOpen] = React.useState(false);
  const navigation = <div className="space-y-1">{nav.map((item,i) => {
    const Icon = item.icon;
    return <React.Fragment key={item.id}>{item.group && <div className={`${i ? 'mt-5' : 'mt-1'} mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-[#8B9882]`}>{item.group}</div>}
      <button type="button" onClick={()=>{onChange(item.id);setOpen(false)}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[13px] font-medium transition ${current===item.id ? 'bg-[#C6DE41] text-[#101408]' : 'text-stone-300 hover:bg-white/5 hover:text-white'}`}><Icon className="h-4 w-4 shrink-0"/>{item.label}</button>
    </React.Fragment>;
  })}</div>;
  return <div className="min-h-screen bg-[#090B09] text-[#F5F7F0] lg:flex">
    <aside className="hidden w-[254px] shrink-0 border-r border-white/10 bg-[#141714] lg:flex lg:min-h-screen lg:flex-col">
      <div className="border-b border-white/10 p-5"><Link to="/" className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#C6DE41] text-[#090B09]"><ShieldCheck size={21}/></div><div><p className="text-lg font-black tracking-tight">CampusMart</p><p className="text-[10px] font-black tracking-widest text-[#C6DE41]">{manager?'HERO MANAGEMENT':'HERO OPERATIONS'}</p></div></Link><p className="mt-4 rounded-lg border border-[#C6DE41]/25 bg-[#C6DE41]/10 px-2.5 py-2 text-[11px] font-bold text-[#C6DE41]">● {manager?'Campus Operations Manager':'Approved Campus Hero'} · {college}</p></div>
      <div className="flex-1 overflow-y-auto p-3">{navigation}</div><div className="border-t border-white/10 p-4"><Link to="/" className="flex items-center justify-between rounded-xl border border-white/10 p-3 text-xs font-semibold hover:text-[#C6DE41]">Return to CampusMart <ArrowRight size={15}/></Link></div>
    </aside>
    {open && <div className="fixed inset-0 z-[90] bg-black/70 lg:hidden" onClick={()=>setOpen(false)} />}
    {open && <aside className="fixed inset-y-0 left-0 z-[91] w-[270px] overflow-auto bg-[#151915] p-4 lg:hidden"><div className="mb-5 flex items-center justify-between text-lg font-bold">CampusMart Ops <button onClick={()=>setOpen(false)}><X/></button></div>{navigation}<Link to="/" className="mt-6 block rounded-lg border border-white/10 p-3 text-xs">Back to CampusMart</Link></aside>}
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-30 flex min-h-[70px] flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#0D100D]/95 px-4 py-3 backdrop-blur md:px-7">
        <div className="flex items-center gap-3"><button onClick={()=>setOpen(true)} className="rounded-lg border border-white/10 p-2 lg:hidden"><Menu size={20}/></button><span className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold"><Building2 size={14} className="text-[#C6DE41]"/>{college}</span></div>
        <div className="flex items-center gap-3">{accessory}<button type="button" aria-label="Refresh" title="Refresh dashboard" onClick={onRefresh} className="rounded-lg border border-white/10 p-2 text-stone-400 hover:text-[#C6DE41]"><RefreshCw size={17}/></button><div className="flex items-center gap-2"><div className="hidden text-right sm:block"><p className="text-xs font-bold">{name}</p><p className="text-[10px] text-stone-500">{manager?'Campus Manager':'Campus Hero'}</p></div><div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#C6DE41] text-xs font-black text-[#090B09]">{initials(name)}</div></div></div>
      </header>
      <main className="mx-auto w-full max-w-[1540px] space-y-6 px-4 py-7 md:px-7 lg:px-8"><div><h1 className="text-2xl font-bold tracking-tight md:text-3xl">{title}</h1><p className="mt-1 text-sm text-[#9AA493]">{subtitle}</p></div>{children}</main>
    </div>
  </div>;
}
export function StatTile({ label, value, icon:Icon, hint, alert = false }: { label: string; value: string | number; icon: LucideIcon; hint?: string; alert?: boolean }) {
  return <div className={`${palette.card} min-w-0 p-4 md:p-5`}><div className="flex items-center justify-between gap-3"><p className="text-[11px] font-bold uppercase tracking-wide text-[#A6B09F]">{label}</p><div className={`rounded-xl p-2 ${alert?'bg-rose-400/10 text-rose-300':'bg-[#C6DE41]/10 text-[#C6DE41]'}`}><Icon size={18}/></div></div><p className={`mt-3 text-3xl font-black ${alert?'text-rose-300':'text-white'}`}>{value}</p>{hint && <p className="mt-2 text-[11px] text-stone-500">{hint}</p>}</div>;
}
export function TaskTile({ task, onView, onAction, actionLabel, pending = false }: { task: HeroTask; onView: ()=>void; onAction?:()=>void; actionLabel?: string; pending?: boolean }) {
  return <div className={`${palette.card} flex flex-col gap-4 p-4 sm:flex-row sm:items-start`}>
    <div className="flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#292C28]">{task.product.image_url ? <img className="h-full w-full object-cover" src={task.product.image_url} alt={task.product.name}/> : <Package className="text-stone-500"/>}</div>
    <div className="min-w-0 flex-1"><div className="mb-1 flex flex-wrap items-center gap-2"><span className="text-[11px] font-bold text-[#C6DE41]">#{task.id.slice(0,8)}</span><StatusPill value={task.status}/><span className="text-[10px] text-[#8D9788]">{task.task_type.replace(/_/g,' ')}</span></div><p className="font-bold">{task.product.name}</p><p className="mt-2 flex items-center gap-2 text-xs text-stone-400"><MapPin size={13}/> {task.college.code} · {shortDate(task.created_at)}</p>{task.assigned_hero && <p className="mt-1 text-[11px] text-stone-500">Hero: {task.assigned_hero.name}</p>}</div>
    <div className="flex shrink-0 flex-wrap gap-2 sm:flex-col"><button onClick={onView} className={palette.secondary}>View details <ArrowRight size={14}/></button>{onAction && actionLabel && <button disabled={pending} onClick={onAction} className={palette.button}>{pending?'Working...':actionLabel}</button>}</div>
  </div>;
}
export function EmptyState({ title, detail }: { title: string; detail?: string }) { return <div className={`${palette.card} flex min-h-[180px] flex-col items-center justify-center gap-3 p-8 text-center`}><Package size={30} className="text-[#78886F]"/><strong>{title}</strong>{detail && <p className="max-w-sm text-sm text-stone-500">{detail}</p>}</div>; }
export function ErrorBar({ message, onRetry }: { message: string; onRetry?:()=>void }) { return <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-400/25 bg-rose-500/10 p-4 text-sm text-rose-200"><span>{message}</span>{onRetry && <button onClick={onRetry} className="underline">Retry</button>}</div>; }
export function Busy() { return <div className="flex min-h-[50vh] items-center justify-center text-sm text-stone-400"><RefreshCw className="mr-3 animate-spin text-[#C6DE41]" size={18}/> Loading CampusMart operations...</div>; }
export function Timeline({ items }: { items: Array<{ id: string; title: string; details?: string | null; at: string }> }) { return <div className="space-y-1">{items.length ? items.map(x=><div key={x.id} className="relative border-l border-[#C6DE41]/35 py-3 pl-5 before:absolute before:-left-[5px] before:top-4 before:h-2 before:w-2 before:rounded-full before:bg-[#C6DE41]"><p className="text-sm font-semibold">{x.title}</p>{x.details && <p className="mt-1 text-xs text-stone-400">{x.details}</p>}<p className="mt-1 text-[11px] text-stone-500"><Clock size={11} className="mr-1 inline"/>{shortDate(x.at)}</p></div>) : <p className="text-sm text-stone-500">No activity yet.</p>}</div>; }
export function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block space-y-1.5"><span className="block text-[11px] font-bold uppercase tracking-wide text-stone-400">{label}</span>{children}</label>; }
export function Section({ title, children, side }: { title: string; children: React.ReactNode; side?:React.ReactNode }) {return <section className={`${palette.card} p-4 md:p-5`}><div className="mb-4 flex items-center justify-between gap-2"><h2 className="font-bold">{title}</h2>{side}</div>{children}</section>}
export function PersonCircle({ name }: { name: string }) {return <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C6DE41]/15 text-sm font-black text-[#C6DE41]">{initials(name)}</span>}
export function StepTrack({ status }: { status: string }) {
  const steps=['ASSIGNED','PICKED_UP','DELIVERED','COMPLETED']; const at=steps.indexOf(status);
  return <div className="grid grid-cols-4 gap-2">{steps.map((s,i)=><div key={s} className="min-w-0"><div className={`h-1.5 rounded-full ${i<=at?'bg-[#C6DE41]':'bg-white/10'}`}/><div className="mt-2 flex items-center gap-1 text-[10px] font-semibold text-stone-400">{i<=at?<CheckCircle2 size={12} className="text-[#C6DE41]"/>:<Clock size={12}/>}<span className="truncate">{s.replace(/_/g,' ')}</span></div></div>)}</div>;
}
