import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Check, LockKeyhole, MapPin, Save, ShieldCheck,
  ShoppingBag, Tag, UserRound,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

type Account = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string | null;
  role: 'USER' | 'ADMIN' | 'CAMPUS_HERO';
  created_at: string;
  college: { code: string; name: string };
};

type ApiResult<T> = { success: boolean; message?: string; data?: T };

async function accountRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('campusmart_token');
  if (!token) throw new Error('Please sign in to continue.');
  const response = await fetch(`/api/account${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  let result: ApiResult<T>;
  try {
    result = (await response.json()) as ApiResult<T>;
  } catch {
    throw new Error('Unable to reach CampusMart. Please try again.');
  }
  if (!response.ok || !result.success) throw new Error(result.message || 'Request failed.');
  return result.data as T;
}

const inputClass =
  'w-full rounded-xl border border-white/15 bg-[#191B18] px-4 py-3 text-sm text-white outline-none focus:border-[#C6DE41] light:border-[#DFE5D5] light:bg-[#F7F8F2] light:text-[#171B13]';
const labelClass =
  'mb-2 block text-xs font-semibold uppercase tracking-wide text-zinc-400 light:text-[#57614E]';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser, marketplaceMode, setMarketplaceMode } = useAuth();
  const [account, setAccount] = useState<Account | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    accountRequest<Account>('/me')
      .then((data) => {
        if (cancelled) return;
        setAccount(data);
        setName(data.name);
        setPhone(data.phone);
        setAddress(data.address || '');
      })
      .catch((error) => {
        if (!cancelled) toast.error(error instanceof Error ? error.message : 'Unable to load settings.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const saveProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    try {
      const updated = await accountRequest<Pick<Account, 'name' | 'phone' | 'address'>>('/profile', {
        method: 'PATCH',
        body: JSON.stringify({ name, phone, address }),
      });
      setAccount((prev) => prev ? { ...prev, ...updated } : prev);
      await refreshUser();
      toast.success('Profile saved successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  };

  const updatePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword.length < 10) return toast.error('Use at least 10 characters for your new password.');
    if (newPassword !== confirmPassword) return toast.error('New passwords do not match.');
    setChangingPassword(true);
    try {
      await accountRequest<undefined>('/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password updated successfully.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return <main className="min-h-[65vh] bg-[#090B09] p-10 text-center text-zinc-400 light:bg-[#F7F8F2]">Loading account settings…</main>;
  }
  if (!user || !account) {
    return (
      <main className="min-h-[65vh] bg-[#090B09] p-10 text-center text-zinc-400 light:bg-[#F7F8F2]">
        Unable to display account details. <Link to="/login" className="text-[#C6DE41] underline">Sign in</Link> or reload this page.
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#090B09] px-4 py-10 text-white light:bg-[#F7F8F2] light:text-[#171B13] sm:px-6">
      <div className="mx-auto max-w-6xl space-y-8">
        <header>
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#C6DE41] light:text-[#526800]">CampusMart Account</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Account Settings</h1>
          <p className="mt-2 text-sm text-zinc-400 light:text-[#57614E]">Your personal details, marketplace preference, and password in one place.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(300px,1fr)]">
          <section className="rounded-[28px] border border-white/10 bg-[#111311] p-6 light:border-[#DFE5D5] light:bg-white sm:p-8">
            <h2 className="mb-6 flex items-center gap-3 text-xl font-bold"><UserRound className="h-5 w-5 text-[#C6DE41]" /> Personal information</h2>
            <form onSubmit={saveProfile} className="space-y-5">
              <div><label htmlFor="setting-name" className={labelClass}>Full name</label><input id="setting-name" className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required minLength={2} maxLength={70} autoComplete="name" /></div>
              <div><label htmlFor="setting-email" className={labelClass}>Email address</label><input id="setting-email" className={`${inputClass} cursor-not-allowed opacity-65`} value={account.email} disabled type="email" /><p className="mt-1 text-xs text-zinc-500">Email changes require verification and aren't enabled yet.</p></div>
              <div><label htmlFor="setting-phone" className={labelClass}>Phone / WhatsApp</label><input id="setting-phone" className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required autoComplete="tel" /></div>
              <div><label htmlFor="setting-college" className={labelClass}>Registered college</label><input id="setting-college" className={`${inputClass} cursor-not-allowed opacity-65`} value={`${account.college.code} — ${account.college.name}`} disabled /><p className="mt-1 text-xs text-zinc-500">Your registered college cannot be changed here.</p></div>
              <div><label htmlFor="setting-address" className={labelClass}><MapPin className="mr-1 inline h-3 w-3" /> Preferred handover location (optional)</label><textarea id="setting-address" className={`${inputClass} min-h-[105px] resize-y`} value={address} onChange={(e) => setAddress(e.target.value)} maxLength={300} placeholder="E.g. college main gate or campus reception" /><p className="mt-1 text-xs text-zinc-500">Prefer a public campus meeting point rather than a private home address.</p></div>
              <button disabled={saving} type="submit" className="inline-flex items-center gap-2 rounded-full bg-[#C6DE41] px-6 py-3 text-sm font-bold text-[#090B09] hover:bg-[#D7EF59] disabled:opacity-60"><Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save changes'}</button>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-[28px] border border-white/10 bg-[#111311] p-6 light:border-[#DFE5D5] light:bg-white">
              <h2 className="mb-2 flex items-center gap-3 text-xl font-bold"><ShoppingBag className="h-5 w-5 text-[#C6DE41]" /> Marketplace preference</h2>
              <p className="mb-5 text-sm leading-relaxed text-zinc-400 light:text-[#57614E]">Switch between the buying and selling experience. This changes your view, not your account permissions.</p>
              <div className="grid grid-cols-2 gap-3">
                {(['BUYER', 'SELLER'] as const).map((mode) => {
                  const selected = marketplaceMode === mode;
                  return (
                    <button key={mode} type="button" aria-pressed={selected} onClick={() => { setMarketplaceMode(mode); toast.success(`${mode === 'BUYER' ? 'Buyer' : 'Seller'} mode selected.`); }} className={`rounded-2xl border p-4 text-left transition-colors ${selected ? 'border-[#C6DE41] bg-[#C6DE41]/10' : 'border-white/15 bg-[#191B18] light:border-[#DFE5D5] light:bg-[#F7F8F2]'}`}>
                      {mode === 'BUYER' ? <ShoppingBag className="mb-2 h-5 w-5 text-[#C6DE41]" /> : <Tag className="mb-2 h-5 w-5 text-[#C6DE41]" />}
                      <span className="flex items-center gap-2 text-sm font-bold">{mode === 'BUYER' ? 'Buyer' : 'Seller'} {selected && <Check className="h-4 w-4 text-[#C6DE41]" />}</span>
                      <span className="mt-1 block text-xs text-zinc-400 light:text-[#57614E]">{selected ? 'Currently selected' : 'Choose mode'}</span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-4 flex gap-4 text-sm font-semibold"><Link to="/buy" className="text-[#C6DE41] hover:underline light:text-[#526800]">Browse items</Link><Link to="/sell" className="text-[#C6DE41] hover:underline light:text-[#526800]">Sell an item</Link></div>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#111311] p-6 light:border-[#DFE5D5] light:bg-white">
              <h2 className="mb-5 flex items-center gap-3 text-xl font-bold"><LockKeyhole className="h-5 w-5 text-[#C6DE41]" /> Change password</h2>
              <form onSubmit={updatePassword} className="space-y-4">
                <div><label htmlFor="old-password" className={labelClass}>Current password</label><input id="old-password" className={inputClass} type="password" autoComplete="current-password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required /></div>
                <div><label htmlFor="new-password" className={labelClass}>New password (10+ characters)</label><input id="new-password" className={inputClass} type="password" autoComplete="new-password" minLength={10} maxLength={128} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required /></div>
                <div><label htmlFor="confirm-password" className={labelClass}>Confirm new password</label><input id="confirm-password" className={inputClass} type="password" autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required /></div>
                <button disabled={changingPassword} type="submit" className="w-full rounded-full border border-[#C6DE41]/50 px-5 py-3 text-sm font-semibold text-[#C6DE41] hover:bg-[#C6DE41]/10 disabled:opacity-60 light:text-[#526800]">{changingPassword ? 'Updating…' : 'Update password'}</button>
              </form>
            </section>

            <section className="rounded-[28px] border border-white/10 bg-[#111311] p-6 light:border-[#DFE5D5] light:bg-white">
              <h2 className="flex items-center gap-2 text-sm font-semibold"><ShieldCheck className="h-4 w-4 text-[#C6DE41]" /> Account information</h2>
              <p className="mt-3 text-sm text-zinc-400 light:text-[#57614E]">Role: <span className="font-medium text-white light:text-[#171B13]">{account.role}</span></p>
              <p className="mt-1 text-xs text-zinc-400 light:text-[#57614E]">Member since {new Date(account.created_at).toLocaleDateString()}</p>
              <Link to="/profile" className="mt-4 inline-block text-sm font-semibold text-[#C6DE41] hover:underline light:text-[#526800]">View orders and activity</Link>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
};

export default SettingsPage;
