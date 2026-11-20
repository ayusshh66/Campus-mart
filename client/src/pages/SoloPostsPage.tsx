import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Search, MapPin, ExternalLink, Plus, Users, BriefcaseBusiness } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { soloApi, type SoloPost } from '../services/soloApi';
import { soloInviteApi, type ReceivedSoloInvitation } from '../services/soloInviteApi';
import { api, type TeamPostItem } from '../services/api';
import './SoloPosts.css';

function safeUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try { const url = new URL(raw); return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null; }
  catch { return null; }
}

export const SoloPostsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'browse' | 'mine' | 'invitations'>('browse');
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [posts, setPosts] = useState<SoloPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [changingId, setChangingId] = useState<string | null>(null);
  const [received, setReceived] = useState<ReceivedSoloInvitation[]>([]);
  const [receivedLoading, setReceivedLoading] = useState(false);
  const [receivedError, setReceivedError] = useState('');
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [invitePost, setInvitePost] = useState<SoloPost | null>(null);
  const [ownedTeams, setOwnedTeams] = useState<TeamPostItem[]>([]);
  const [teamsLoading, setTeamsLoading] = useState(false);
  const [teamId, setTeamId] = useState('');
  const [offeredRole, setOfferedRole] = useState('');
  const [inviteMessage, setInviteMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadReceived = useCallback(async () => {
    if (!user) { setReceived([]); setReceivedLoading(false); return; }
    setReceivedLoading(true);
    setReceivedError('');
    try { setReceived(await soloInviteApi.received()); }
    catch (e) { setReceivedError(e instanceof Error ? e.message : 'Failed to load invitations'); }
    finally { setReceivedLoading(false); }
  }, [user?.id]);

  useEffect(() => {
    if (tab === 'invitations') void loadReceived();
  }, [tab, loadReceived]);

  const openInvite = async (post: SoloPost) => {
    if (!user) { navigate('/login'); return; }
    setInvitePost(post);
    setOfferedRole(post.preferred_roles[0] ?? '');
    setTeamId('');
    setInviteMessage('');
    setOwnedTeams([]);
    setTeamsLoading(true);
    try {
      const mine = await api.teams.getMyTeams();
      const eligible = mine.created_teams.filter((team) =>
        team.status === 'OPEN' &&
        team.open_seats > 0 &&
        new Date(team.application_deadline) > new Date() &&
        (post.eligibility_rules === 'OPEN_TO_ALL' || team.college.id === post.college_id) &&
        (team.eligibility_rules === 'OPEN_TO_ALL' || team.college.id === post.college_id)
      );
      setOwnedTeams(eligible);
      setTeamId(eligible[0]?.id ?? '');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not load your teams.');
    } finally { setTeamsLoading(false); }
  };

  const sendInvitation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!invitePost || !teamId || !offeredRole.trim()) { toast.error('Choose a team and role.'); return; }
    setSending(true);
    try {
      await soloInviteApi.send({
        solo_post_id: invitePost.id, team_post_id: teamId,
        role_offered: offeredRole.trim(), message: inviteMessage.trim(),
      });
      toast.success('Invitation sent! The student can accept or decline it.');
      setInvitePost(null);
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Invitation failed.'); }
    finally { setSending(false); }
  };

  const respondToInvite = async (id: string, status: 'ACCEPTED' | 'DECLINED') => {
    setRespondingId(id);
    try {
      const result = await soloInviteApi.respond(id, status);
      toast.success(result.message);
      await loadReceived();
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Could not respond to invitation.'); }
    finally { setRespondingId(null); }
  };


  const load = useCallback(async () => {
    if (tab === 'invitations') { setLoading(false); return; }
    if (tab === 'mine' && !user) {
      setPosts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      if (tab === 'mine') {
        const mine = await soloApi.mine();
        setPosts(mine);
        setTotal(mine.length);
      } else {
        const result = await soloApi.browse(submittedSearch, '', page);
        setPosts(result.data);
        setTotal(result.count);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load individual posts.');
    } finally {
      setLoading(false);
    }
  }, [tab, user?.id, submittedSearch, page]);

  useEffect(() => { void load(); }, [load]);

  const changeStatus = async (post: SoloPost) => {
    const status = post.status === 'OPEN' ? 'CLOSED' : 'OPEN';
    setChangingId(post.id);
    try {
      await soloApi.setStatus(post.id, status);
      toast.success(status === 'OPEN' ? 'Post reopened' : 'Post closed');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Unable to update post.');
    } finally {
      setChangingId(null);
    }
  };

  return (
    <main className="solo-page min-h-screen px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="solo-panel rounded-[28px] p-6 sm:p-9">
          <span className="solo-eyebrow"><Users size={14} /> HACKATHON STUDENT NETWORK</span>
          <div className="mt-5 flex flex-wrap items-end justify-between gap-5">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight sm:text-5xl">Find Individual Teammates<span className="solo-lime">.</span></h1>
              <p className="solo-muted mt-3 max-w-2xl text-sm leading-6">Discover students looking to join a hackathon team. Or publish your own availability for team leaders to find.</p>
            </div>
            <Link to="/students/create" className="solo-primary inline-flex items-center gap-2 rounded-full px-5 py-3 text-sm font-bold">
              <Plus size={17} /> Post Looking for Team
            </Link>
          </div>
        </header>

        <section className="solo-panel rounded-[28px] p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2" role="tablist" aria-label="Individual posts">
              <button type="button" role="tab" aria-selected={tab === 'browse'} className={`solo-tab ${tab === 'browse' ? 'solo-tab-active' : ''}`} onClick={() => { setTab('browse'); setPage(1); }}>Browse Students</button>
              <button type="button" role="tab" aria-selected={tab === 'mine'} className={`solo-tab ${tab === 'mine' ? 'solo-tab-active' : ''}`} onClick={() => setTab('mine')}>My Posts</button>
              <button type="button" role="tab" aria-selected={tab === 'invitations'} className={`solo-tab ${tab === 'invitations' ? 'solo-tab-active' : ''}`} onClick={() => setTab('invitations')}>My Invitations</button>
            </div>
            <Link to="/find-teammates" className="solo-muted text-xs underline-offset-4 hover:underline">Browse Team Openings</Link>
          </div>
          {tab === 'browse' && (
            <form onSubmit={(event) => { event.preventDefault(); setSubmittedSearch(search); setPage(1); }} className="mt-5 flex gap-3">
              <input className="solo-input min-w-0 flex-1 rounded-full px-5 py-3 text-sm" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search hackathon, role, skills, interests..." aria-label="Search individual posts" />
              <button className="solo-primary grid h-12 w-12 shrink-0 place-items-center rounded-full" aria-label="Search" type="submit"><Search size={18}/></button>
            </form>
          )}
        </section>

        {tab === 'invitations' ? (
          <section aria-label="Team invitations" className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Invitations from team leaders</h2>
              <button className="solo-outline rounded-full px-4 py-2 text-xs" type="button" onClick={() => void loadReceived()}>Refresh</button>
            </div>
            {!user ? <p className="solo-panel rounded-2xl p-6">Log in to see invitations. <Link to="/login" className="solo-lime underline">Sign in</Link></p> :
             receivedLoading ? <p className="solo-muted py-10">Loading invitations...</p> :
             receivedError ? <p className="text-rose-400" role="alert">{receivedError}</p> :
             received.length === 0 ? <p className="solo-panel solo-muted rounded-2xl p-6">No invitations yet. When a team leader invites you, it will appear here.</p> :
             received.map((invitation) => (
              <article key={invitation.id} className="solo-panel rounded-2xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="font-bold">{invitation.team_post.team_title}</h3>
                  <span className={invitation.status === 'PENDING' ? 'solo-lime text-xs' : 'solo-muted text-xs'}>{invitation.status}</span>
                </div>
                <p className="solo-muted text-sm">{invitation.team_post.hackathon_name} · Invited by {invitation.sender.name}</p>
                <p className="text-sm">Offered role: <strong>{invitation.role_offered}</strong></p>
                {invitation.message && <p className="solo-muted text-sm break-words">{invitation.message}</p>}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Link className="solo-outline rounded-full px-4 py-2 text-xs" to={`/teams/${invitation.team_post.id}`}>View Team</Link>
                  {invitation.status === 'PENDING' && (
                    <>
                      <button disabled={respondingId === invitation.id} type="button" onClick={() => void respondToInvite(invitation.id, 'ACCEPTED')} className="solo-primary rounded-full px-4 py-2 text-xs font-bold disabled:opacity-50">Accept Invite</button>
                      <button disabled={respondingId === invitation.id} type="button" onClick={() => void respondToInvite(invitation.id, 'DECLINED')} className="solo-outline rounded-full px-4 py-2 text-xs disabled:opacity-50">Decline</button>
                    </>
                  )}
                </div>
              </article>
             ))}
          </section>
        ) : (
        <>
        {loading ? <p className="solo-muted py-12 text-center">Loading student posts...</p> :
          error ? <div className="solo-panel rounded-2xl p-6 text-center"><p role="alert" className="text-rose-400">{error}</p><button onClick={() => void load()} className="solo-primary mt-3 rounded-full px-4 py-2 text-sm">Retry</button></div> :
          tab === 'mine' && !user ? <div className="solo-panel rounded-2xl p-8 text-center">Log in to manage your posts. <Link className="solo-lime underline" to="/login">Sign in</Link></div> :
          posts.length === 0 ? <div className="solo-panel rounded-2xl p-8 text-center"><p className="solo-muted">{tab === 'mine' ? 'You have no individual posts yet.' : 'No students matched this search.'}</p><Link to="/students/create" className="solo-lime mt-3 inline-block underline">Create an individual post</Link></div> : (
            <>
              <p className="solo-muted text-xs">{tab === 'browse' ? `${total} available student post${total === 1 ? '' : 's'}` : `${total} post${total === 1 ? '' : 's'} created`}</p>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
                {posts.map((post) => (
                  <article key={post.id} className="solo-panel flex min-w-0 flex-col justify-between rounded-[26px] p-6">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <span className="solo-chip max-w-full truncate">{post.hackathon_name}</span>
                        <span className={`text-[11px] font-semibold ${post.status === 'OPEN' ? 'solo-lime' : 'solo-muted'}`}>{post.status === 'OPEN' ? '● Available' : 'Closed'}</span>
                      </div>
                      <div className="mt-5 flex items-center gap-3">
                        <div className="solo-avatar grid h-10 w-10 shrink-0 place-items-center rounded-full font-bold">{post.user.name.charAt(0).toUpperCase()}</div>
                        <div className="min-w-0"><h2 className="truncate text-base font-bold">{post.user.name}</h2><p className="solo-muted flex items-center gap-1 text-xs"><MapPin size={12}/>{post.user.college.code} · {post.user.hackathon_profile?.experience_level ?? 'Student'}</p></div>
                      </div>
                      <h3 className="mt-5 break-words text-lg font-bold">{post.headline}</h3>
                      <p className="solo-muted mt-2 line-clamp-3 text-sm leading-6">{post.description}</p>
                      <p className="solo-label mt-5">PREFERRED ROLES</p>
                      <div className="mt-2 flex flex-wrap gap-2">{post.preferred_roles.map((role) => <span className="solo-chip" key={role}>{role}</span>)}</div>
                      <p className="solo-label mt-5">SKILLS</p>
                      <div className="mt-2 flex flex-wrap gap-2">{post.skills.map((skill) => <span className="solo-chip" key={skill}>{skill}</span>)}</div>
                      <p className="solo-muted mt-4 text-xs">{post.eligibility_rules === 'OPEN_TO_ALL' ? 'Open to all colleges' : `${post.user.college.code} only`}</p>
                    </div>
                    <div className="solo-divider mt-6 flex flex-wrap gap-2 pt-4">
                      {tab === 'mine' ? (
                        <button type="button" disabled={changingId === post.id} onClick={() => void changeStatus(post)} className="solo-outline flex-1 rounded-full px-4 py-2.5 text-xs font-semibold">{post.status === 'OPEN' ? 'Close Post' : 'Reopen Post'}</button>
                      ) : (
                        <>
                          {safeUrl(post.user.hackathon_profile?.github_url) && <a className="solo-outline inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs" href={safeUrl(post.user.hackathon_profile?.github_url) ?? undefined} target="_blank" rel="noopener noreferrer"><ExternalLink size={13}/> GitHub</a>}
                          {safeUrl(post.user.hackathon_profile?.portfolio_url) && <a className="solo-outline inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs" href={safeUrl(post.user.hackathon_profile?.portfolio_url) ?? undefined} target="_blank" rel="noopener noreferrer"><BriefcaseBusiness size={13}/> Portfolio</a>}
                          {user?.id === post.user.id ? (
                            <span className="solo-muted inline-flex items-center rounded-full px-3 py-2 text-xs">
                              Your student post
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => void openInvite(post)}
                              className="solo-primary inline-flex items-center rounded-full px-4 py-2 text-xs font-bold"
                            >
                              Invite to Team
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
              {tab === 'browse' && total > 20 && (
                <div className="flex items-center justify-center gap-3 pt-3">
                  <button disabled={page === 1} className="solo-outline rounded-full px-4 py-2 text-sm disabled:opacity-40" onClick={() => setPage(p => p - 1)}>Previous</button>
                  <span className="solo-muted text-sm">Page {page}</span>
                  <button disabled={page * 20 >= total} className="solo-outline rounded-full px-4 py-2 text-sm disabled:opacity-40" onClick={() => setPage(p => p + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </>
        )}
      </div>

      {invitePost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/80 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setInvitePost(null); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="invite-dialog-title" className="solo-panel w-full max-w-lg rounded-[26px] p-6 sm:p-8">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 id="invite-dialog-title" className="text-xl font-bold">Invite {invitePost.user.name} to your team</h2>
                <p className="solo-muted mt-1 text-xs">{invitePost.hackathon_name}</p>
              </div>
              <button type="button" className="solo-outline rounded-full px-3 py-2 text-xs" onClick={() => setInvitePost(null)}>Close</button>
            </div>
            {teamsLoading ? <p className="solo-muted py-6">Loading your eligible teams...</p> : ownedTeams.length === 0 ? (
              <div className="mt-5 space-y-3">
                <p className="solo-muted text-sm">You need to own an open team with at least one available seat and compatible college eligibility.</p>
                <Link className="solo-primary inline-flex rounded-full px-4 py-2 text-sm font-bold" to="/teams/create">Create Team Post</Link>
              </div>
            ) : (
              <form onSubmit={sendInvitation} className="mt-6 space-y-4">
                <div className="space-y-2">
                  <label htmlFor="invite-team" className="text-sm font-semibold">Your team</label>
                  <select id="invite-team" required value={teamId} onChange={(e) => setTeamId(e.target.value)} className="solo-input w-full rounded-xl px-4 py-3 text-sm">
                    {ownedTeams.map((team) => <option key={team.id} value={team.id}>{team.team_title} · {team.hackathon_name} ({team.open_seats} seats left)</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label htmlFor="invite-role" className="text-sm font-semibold">Offered role</label>
                  <input id="invite-role" required minLength={2} maxLength={80} value={offeredRole} onChange={(e) => setOfferedRole(e.target.value)} className="solo-input w-full rounded-xl px-4 py-3 text-sm" placeholder="Frontend Developer" />
                </div>
                <div className="space-y-2">
                  <label htmlFor="invite-message" className="text-sm font-semibold">Message (optional)</label>
                  <textarea id="invite-message" maxLength={500} rows={3} value={inviteMessage} onChange={(e) => setInviteMessage(e.target.value)} className="solo-input w-full rounded-xl px-4 py-3 text-sm" placeholder="We'd love to have you on our team..." />
                </div>
                <button type="submit" disabled={sending || !teamId} className="solo-primary w-full rounded-full px-4 py-3 text-sm font-bold disabled:opacity-50">{sending ? 'Sending...' : 'Send Invitation'}</button>
              </form>
            )}
          </div>
        </div>
      )}
    </main>
  );
};
