import React, {
  useEffect,
  useState,
} from 'react';

import {
  Link,
  useSearchParams,
} from 'react-router-dom';

import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  Activity,
  Package,
  AlertTriangle,
  ShieldCheck,
  MessageSquare,
  Megaphone,
  BarChart3,
  Settings,
  UserRound,
  RefreshCw,
  ArrowLeft,
  ArrowRight,
  Search,
  CheckCircle2,
  Clock,
  X,
  Menu,
  Download,
  Send,
  Loader2,
  Bell,
} from 'lucide-react';

import { toast } from 'sonner';

import {
  heroManagerApi,
} from '../services/heroManagerApi';

import type {
  ManagerAccess,
  ManagerOverview,
  ManagerTask,
  ManagerEvent,
  ManagerProof,
  ManagerMessage,
  ManagerAssignment,
} from '../services/heroManagerApi';

const ACTIVE = [
  'ASSIGNED',
  'PICKED_UP',
  'DELIVERED',
];

const panel =
  'rounded-2xl border border-white/10 bg-[#12160F] p-5';

const field =
  'w-full min-w-0 rounded-xl border border-white/10 ' +
  'bg-[#090B09] px-4 py-3 text-sm text-[#F5F7F0] ' +
  'outline-none placeholder:text-stone-500 ' +
  'focus:border-[#C6DE41]/60';

const primary =
  'inline-flex items-center justify-center gap-2 ' +
  'rounded-xl bg-[#C6DE41] px-4 py-2.5 text-xs ' +
  'font-bold text-[#090B09] transition-colors ' +
  'hover:bg-[#D7EF59] disabled:opacity-40 ' +
  'disabled:cursor-not-allowed';

const secondary =
  'inline-flex items-center justify-center gap-2 ' +
  'rounded-xl border border-white/10 px-4 py-2.5 ' +
  'text-xs font-semibold text-stone-300 ' +
  'hover:bg-white/5 disabled:opacity-40';

const navigation = [
  {
    label: 'OVERVIEW',
    items: [
      {
        id: 'overview',
        title: 'Operations Dashboard',
        icon: LayoutDashboard,
      },
      {
        id: 'heroes',
        title: 'Campus Heroes',
        icon: Users,
      },
      {
        id: 'assignments',
        title: 'Task Assignments',
        icon: ClipboardCheck,
      },
      {
        id: 'activity',
        title: 'Hero Activity',
        icon: Activity,
      },
    ],
  },
  {
    label: 'OPERATIONS',
    items: [
      {
        id: 'tasks',
        title: 'All Campus Tasks',
        icon: Package,
      },
      {
        id: 'issues',
        title: 'Issues & Escalations',
        icon: AlertTriangle,
      },
      {
        id: 'verification',
        title: 'Verification Queue',
        icon: ShieldCheck,
      },
      {
        id: 'messages',
        title: 'Messages',
        icon: MessageSquare,
      },
      {
        id: 'announcements',
        title: 'Announcements',
        icon: Megaphone,
      },
    ],
  },
  {
    label: 'REPORTS',
    items: [
      {
        id: 'analytics',
        title: 'Performance Analytics',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'ACCOUNT',
    items: [
      {
        id: 'notifications',
        title: 'Notifications',
        icon: Bell,
      },
      {
        id: 'profile',
        title: 'Manager Profile',
        icon: UserRound,
      },
    ],
  },
];

const formatStatus = (status: string) =>
  status.replace(/_/g, ' ');

const formatDate = (value?: string | null) =>
  value
    ? new Date(value).toLocaleString('en-IN')
    : 'Not scheduled';

const errorMessage = (error: unknown) =>
  error instanceof Error
    ? error.message
    : 'Something went wrong. Please try again.';

function Status({ value }: { value: string }) {
  const positive = [
    'APPROVED',
    'COMPLETED',
    'AVAILABLE',
    'RESOLVED',
  ].includes(value);

  const negative = [
    'CANCELLED',
    'FLAGGED',
    'HIGH',
    'ESCALATED',
    'OFF_DUTY',
  ].includes(value);

  return (
    <span
      className={`inline-flex w-fit rounded-full border px-2.5 py-1 text-[10px] font-bold ${positive
          ? 'border-[#C6DE41]/25 bg-[#C6DE41]/10 text-[#C6DE41]'
          : negative
            ? 'border-red-400/20 bg-red-400/10 text-red-300'
            : 'border-amber-400/20 bg-amber-400/10 text-amber-300'
        }`}
    >
      {formatStatus(value)}
    </span>
  );
}

function Empty({ title }: { title: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 p-10 text-center">
      <Package className="mx-auto mb-3 h-8 w-8 text-stone-600" />
      <p className="text-sm text-stone-400">
        {title}
      </p>
    </div>
  );
}

function Avatar({ name }: { name: string }) {
  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C6DE41]/10 text-sm font-bold text-[#C6DE41]">
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function EventList({
  events,
}: {
  events: ManagerEvent[];
}) {
  if (!events.length) {
    return <Empty title="No activity recorded yet." />;
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="flex gap-3 border-b border-white/5 pb-4 last:border-0"
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#C6DE41]/10">
            <Activity
              size={15}
              className="text-[#C6DE41]"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              {event.actor.name}
            </p>

            <p className="mt-1 break-words text-xs text-stone-300">
              {formatStatus(event.action)}
            </p>

            {event.details && (
              <p className="mt-1 break-words text-xs text-stone-500">
                {event.details}
              </p>
            )}

            {event.from_status && event.to_status && (
              <p className="mt-1 text-xs text-stone-400">
                {formatStatus(event.from_status)}
                {' → '}
                {formatStatus(event.to_status)}
              </p>
            )}

            <p className="mt-2 text-[10px] text-stone-500">
              {formatDate(event.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function exportCSV(tasks: ManagerTask[]) {
  const escapeCell = (value: unknown) => {
    let text = String(value ?? '');

    // Prevent spreadsheet formula injection.
    if (/^[\s]*[=+\-@]/.test(text)) {
      text = `'${text}`;
    }

    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = [
    [
      'Task ID',
      'Product',
      'College',
      'Hero',
      'Status',
      'Created At',
      'Updated At',
    ],
    ...tasks.map((task) => [
      task.id,
      task.product.name,
      task.college.code,
      task.assigned_hero?.name || 'Unassigned',
      task.status,
      task.created_at,
      task.updated_at,
    ]),
  ];

  const csv = rows
    .map((row) => row.map(escapeCell).join(','))
    .join('\r\n');

  const url = URL.createObjectURL(
    new Blob([csv], {
      type: 'text/csv;charset=utf-8;',
    })
  );

  const link = document.createElement('a');

  link.href = url;
  link.download = 'campusmart-operations.csv';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const HeroManagerDashboardPage: React.FC = () => {
  const [params, setParams] = useSearchParams();

  const tab = params.get('tab') || 'overview';

  const [access, setAccess] =
    useState<ManagerAccess | null>(null);

  const [data, setData] =
    useState<ManagerOverview | null>(null);

  const [collegeId, setCollegeId] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [working, setWorking] = useState(false);

  const [error, setError] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('ALL');

  const [selectedId, setSelectedId] =
    useState<string | null>(null);

  const [assignedHero, setAssignedHero] = useState('');
  const [assignmentReason, setAssignmentReason] =
    useState('');

  const [taskEvents, setTaskEvents] =
    useState<ManagerEvent[]>([]);

  const [taskProofs, setTaskProofs] =
    useState<ManagerProof[]>([]);

  const [messages, setMessages] =
    useState<ManagerMessage[]>([]);

  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');

  const [detailError, setDetailError] = useState('');
  const [detailLoading, setDetailLoading] =
    useState(false);

  const [notes, setNotes] =
    useState<Record<string, string>>({});

  const [announcementTitle, setAnnouncementTitle] =
    useState('');

  const [announcementContent, setAnnouncementContent] =
    useState('');

  const [priority, setPriority] = useState('NORMAL');

  const [managerId, setManagerId] = useState('');
  const [managerCampus, setManagerCampus] = useState('');

  const [managers, setManagers] =
    useState<ManagerAssignment[]>([]);

  const refresh = () =>
    setRefreshKey((previous) => previous + 1);

  const navigateTab = (nextTab: string) => {
    setParams({ tab: nextTab });
    setSearch('');
    setFilter('ALL');
    setMobileOpen(false);
    setSelectedId(null);
  };

  // Load current access and authorized colleges.

  useEffect(() => {
    let cancelled = false;

    heroManagerApi
      .getAccess()
      .then((result) => {
        if (cancelled) return;

        setAccess(result);

        if (!result.canManage) {
          setError(
            'An administrator must grant you Campus Hero Manager access.'
          );
          return;
        }

        setCollegeId(
          result.managerColleges[0]?.id || ''
        );
      })
      .catch((err) => {
        if (!cancelled) {
          setError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Fetch current campus operations.
  // Automatically refresh every 30 seconds.

  useEffect(() => {
    if (!collegeId || !access?.canManage) return;

    let cancelled = false;
    let fetching = false;

    const load = async () => {
      if (fetching) return;

      fetching = true;

      try {
        const result =
          await heroManagerApi.getOverview(collegeId);

        if (!cancelled) {
          if (result.college?.id !== collegeId) {
            throw new Error(
              'You no longer have access to this campus.'
            );
          }

          setData(result);
          setError('');
        }
      } catch (err) {
        if (!cancelled) {
          setData(null);
          setSelectedId(null);
          setError(errorMessage(err));
        }
      } finally {
        fetching = false;
      }
    };

    void load();

    const timer = window.setInterval(load, 30000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [collegeId, access, refreshKey]);

  // Load selected task messages and history.

  useEffect(() => {
    if (!selectedId) return;

    let cancelled = false;

    setDetailLoading(true);
    setDetailError('');

    Promise.all([
      heroManagerApi.getTaskHistory(selectedId),
      heroManagerApi.getMessages(selectedId),
    ])
      .then(([history, conversation]) => {
        if (cancelled) return;

        setTaskEvents(history.events);
        setTaskProofs(history.proofs);
        setMessages(conversation);
      })
      .catch((err) => {
        if (!cancelled) {
          setTaskEvents([]);
          setTaskProofs([]);
          setMessages([]);
          setDetailError(errorMessage(err));
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedId, refreshKey]);

  // Admin-only manager assignment list.

  useEffect(() => {
    if (
      tab !== 'access' ||
      access?.user?.role !== 'ADMIN'
    ) {
      return;
    }

    let cancelled = false;

    heroManagerApi
      .getManagers()
      .then((result) => {
        if (!cancelled) setManagers(result);
      })
      .catch((err) => {
        if (!cancelled) {
          toast.error(errorMessage(err));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [tab, access, refreshKey]);

  const performAction = async (
    action: () => Promise<unknown>,
    success: string
  ) => {
    if (working) return;

    setWorking(true);

    try {
      await action();

      toast.success(success, {
        duration: 4000,
        className: 'campus-admin-success-toast',
      });

      refresh();
    } catch (err) {
      toast.error('Action unsuccessful', {
        description: errorMessage(err),
        duration: 6000,
        className: 'campus-admin-error-toast',
      });
    } finally {
      setWorking(false);
    }
  };

  const openTask = (task: ManagerTask) => {
    setSelectedId(task.id);
    setAssignedHero(task.assigned_hero_id || '');
    setAssignmentReason('');
    setRecipient('');
    setMessage('');
    setTaskEvents([]);
    setTaskProofs([]);
    setMessages([]);
    setDetailError('');
  };

  const selectedTask =
    data?.tasks.find(
      (task) => task.id === selectedId
    ) || null;

  const tasks = data?.tasks || [];
  const heroes = data?.heroes || [];

  const matchesSearch = (value: string) =>
    value
      .toLowerCase()
      .includes(search.trim().toLowerCase());

  const filteredTasks = tasks.filter((task) => {
    const matches = matchesSearch(
      `${task.product.name} ${task.id} ${task.assigned_hero?.name || ''
      }`
    );

    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'UNASSIGNED'
        ? !task.assigned_hero_id &&
        ACTIVE.includes(task.status)
        : task.status === filter);

    return matches && matchesFilter;
  });

  const renderTasks = (items: ManagerTask[]) => {
    if (!items.length) {
      return <Empty title="No matching tasks found." />;
    }

    return (
      <div className="space-y-3">
        {items.map((task) => (
          <div
            key={task.id}
            className="flex flex-wrap items-center gap-4 rounded-xl border border-white/10 bg-[#181D14] p-4"
          >
            {task.product.image_url ? (
              <img
                src={task.product.image_url}
                alt={task.product.name}
                className="h-14 w-14 rounded-xl object-cover"
              />
            ) : (
              <Package className="h-10 w-10 text-stone-500" />
            )}

            <div className="min-w-[150px] flex-1">
              <h4 className="text-sm font-bold">
                {task.product.name}
              </h4>

              <p className="mt-1 text-xs text-stone-400">
                {formatStatus(task.task_type)}
                {' · '}
                {task.college.code}
              </p>

              <p className="mt-1 text-[11px] text-stone-500">
                {task.assigned_hero?.name ||
                  'Awaiting Hero assignment'}
              </p>
            </div>

            <Status value={task.status} />

            <button
              className={secondary}
              onClick={() => openTask(task)}
            >
              View Details
              <ArrowRight size={14} />
            </button>
          </div>
        ))}
      </div>
    );
  };

  const stats = data
    ? [
      {
        name: 'Approved Heroes',
        value: data.stats.heroes,
        icon: Users,
      },
      {
        name: 'Active Tasks',
        value: data.stats.active,
        icon: ClipboardCheck,
      },
      {
        name: 'Unassigned Tasks',
        value: data.stats.unassigned,
        icon: Package,
      },
      {
        name: 'Completed Tasks',
        value: data.stats.completed,
        icon: CheckCircle2,
      },
      {
        name: 'Tasks Older Than 48h',
        value: data.stats.aging,
        icon: Clock,
      },
      {
        name: 'Open Issues',
        value: data.stats.open_issues,
        icon: AlertTriangle,
      },
    ]
    : [];

  const isAdmin = access?.user?.role === 'ADMIN';

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090B09] text-[#C6DE41]">
        <Loader2 className="animate-spin" />
      </div>
    );
  }

  if (!access?.canManage) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#090B09] p-6 text-white">
        <div className={panel}>
          <ShieldCheck
            size={36}
            className="mb-4 text-[#C6DE41]"
          />

          <h2 className="text-xl font-bold">
            Manager access required
          </h2>

          <p className="my-4 max-w-md text-sm text-stone-400">
            {error ||
              'You are not authorized to manage campus operations.'}
          </p>

          <Link to="/" className={secondary}>
            Return to CampusMart
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090B09] text-[#F5F7F0]">
      {/* SIDEBAR */}

      {mobileOpen && (
        <button
          aria-label="Close navigation"
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/70 lg:hidden"
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-[255px] flex-col border-r border-white/10 bg-[#12160F] transition-transform lg:translate-x-0 ${mobileOpen
            ? 'translate-x-0'
            : '-translate-x-full'
          }`}
      >
        <div className="border-b border-white/10 p-6">
          <div className="flex items-center gap-2">
            <ShieldCheck
              size={24}
              className="text-[#C6DE41]"
            />

            <span className="text-xl font-extrabold tracking-tight">
              CampusMart
            </span>
          </div>

          <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#C6DE41]">
            Hero Manager
          </p>
        </div>

        <nav className="flex-1 space-y-7 overflow-y-auto p-3">
          {navigation.map((group) => (
            <div key={group.label}>
              <p className="mb-3 px-3 text-[10px] font-bold tracking-wider text-stone-500">
                {group.label}
              </p>

              {group.items.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() =>
                      navigateTab(item.id)
                    }
                    className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-xs font-semibold transition-colors ${tab === item.id
                        ? 'bg-[#C6DE41] text-[#090B09]'
                        : 'text-stone-300 hover:bg-white/5'
                      }`}
                  >
                    <Icon size={17} />
                    {item.title}
                  </button>
                );
              })}
            </div>
          ))}

          {isAdmin && (
            <button
              onClick={() => navigateTab('access')}
              className={`flex w-full items-center gap-3 rounded-xl p-3 text-xs font-semibold ${tab === 'access'
                  ? 'bg-[#C6DE41] text-[#090B09]'
                  : 'text-stone-300 hover:bg-white/5'
                }`}
            >
              <Settings size={17} />
              Manager Access
            </button>
          )}
        </nav>

        <div className="border-t border-white/10 p-4">
          <div className="mb-4 flex items-center gap-3">
            <Avatar name={access.user?.name || 'M'} />

            <div className="min-w-0">
              <p className="truncate text-sm font-bold">
                {access.user?.name}
              </p>

              <p className="text-[11px] text-stone-500">
                Operations Manager
              </p>
            </div>
          </div>

          <Link
            to="/"
            className="flex items-center gap-2 text-xs text-stone-400 hover:text-[#C6DE41]"
          >
            <ArrowLeft size={14} />
            Return to CampusMart
          </Link>
        </div>
      </aside>

      {/* MAIN WORKSPACE */}

      <main className="min-w-0 lg:ml-[255px]">
        <header className="sticky top-0 z-30 flex flex-wrap items-center justify-between gap-3 border-b border-white/10 bg-[#090B09]/95 px-5 py-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={22} />
            </button>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-[#C6DE41]">
                Campus Operations
              </p>

              <p className="mt-1 text-sm font-semibold">
                Manager Workspace
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={collegeId}
              disabled={working}
              onChange={(e) => {
                setSelectedId(null);
                setData(null);
                setCollegeId(e.target.value);
              }}
              className={`${field} w-auto max-w-[220px] py-2`}
            >
              {!access.managerColleges.length && (
                <option value="">
                  No campus assigned
                </option>
              )}

              {access.managerColleges.map((college) => (
                <option
                  key={college.id}
                  value={college.id}
                >
                  {college.code} Campus
                </option>
              ))}
            </select>

            <button
              onClick={refresh}
              disabled={working}
              className={secondary}
              aria-label="Refresh dashboard"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-[1600px] space-y-6 p-5 md:p-8">
          {error && (
            <div
              role="alert"
              className="rounded-xl border border-red-400/20 bg-red-400/10 p-4 text-sm text-red-300"
            >
              {error}
            </div>
          )}

          {!data && tab !== 'access' && !error && (
            <Empty
              title={
                collegeId
                  ? 'Loading campus operations...'
                  : 'No authorized campus is available.'
              }
            />
          )}

          {/* OVERVIEW */}

          {data && tab === 'overview' && (
            <>
              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-[#C6DE41]">
                  Operations Overview
                </p>

                <h1 className="text-3xl font-extrabold tracking-tight md:text-4xl">
                  Campus Operations Center
                </h1>

                <p className="mt-2 text-sm text-stone-400">
                  Monitor Heroes, coordinate handovers
                  and manage {data.college.code} operations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                {stats.map((stat) => {
                  const Icon = stat.icon;

                  return (
                    <div
                      key={stat.name}
                      className={panel}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-stone-400">
                          {stat.name}
                        </p>

                        <Icon
                          size={19}
                          className="shrink-0 text-[#C6DE41]"
                        />
                      </div>

                      <p className="mt-4 text-3xl font-black tracking-tight">
                        {stat.value}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <section className={panel}>
                  <h2 className="mb-5 font-bold">
                    Unassigned Tasks
                  </h2>

                  {renderTasks(
                    tasks
                      .filter(
                        (task) =>
                          !task.assigned_hero_id &&
                          ACTIVE.includes(task.status)
                      )
                      .slice(0, 5)
                  )}

                  <button
                    onClick={() =>
                      navigateTab('assignments')
                    }
                    className="mt-4 text-xs font-bold text-[#C6DE41]"
                  >
                    Open Assignment Center →
                  </button>
                </section>

                <section className={panel}>
                  <h2 className="mb-5 font-bold">
                    Recent Hero Activity
                  </h2>

                  <EventList
                    events={data.events.slice(0, 6)}
                  />

                  <button
                    className="mt-4 text-xs font-bold text-[#C6DE41]"
                    onClick={() =>
                      navigateTab('activity')
                    }
                  >
                    View All Activity →
                  </button>
                </section>
              </div>
            </>
          )}

          {/* CAMPUS HERO DIRECTORY */}

          {data && tab === 'heroes' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Campus Heroes
              </h1>

              <input
                className={`${field} max-w-md`}
                placeholder="Search approved Heroes..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {heroes
                  .filter((hero) =>
                    matchesSearch(
                      `${hero.name} ${hero.email}`
                    )
                  )
                  .map((hero) => (
                    <div key={hero.id} className={panel}>
                      <div className="flex items-center gap-3">
                        <Avatar name={hero.name} />

                        <div className="min-w-0">
                          <p className="truncate font-bold">
                            {hero.name}
                          </p>

                          <p className="truncate text-xs text-stone-400">
                            {hero.email}
                          </p>
                        </div>
                      </div>

                      <div className="my-4">
                        <Status value={hero.availability} />
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl bg-[#181D14] p-3">
                          <p className="text-xs text-stone-400">
                            Active Tasks
                          </p>

                          <p className="mt-2 text-xl font-bold">
                            {hero.active_tasks}
                          </p>
                        </div>

                        <div className="rounded-xl bg-[#181D14] p-3">
                          <p className="text-xs text-stone-400">
                            Completed
                          </p>

                          <p className="mt-2 text-xl font-bold text-[#C6DE41]">
                            {hero.completed_tasks}
                          </p>
                        </div>
                      </div>

                      <button
                        className={`${secondary} mt-4 w-full`}
                        onClick={() => {
                          navigateTab('tasks');
                          setSearch(hero.name);
                        }}
                      >
                        View Hero Tasks
                        <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
              </div>

              {!heroes.filter((hero) =>
                matchesSearch(
                  `${hero.name} ${hero.email}`
                )
              ).length && (
                  <Empty title="No matching approved Campus Heroes." />
                )}
            </>
          )}

          {/* TASKS AND ASSIGNMENTS */}

          {data &&
            ['assignments', 'tasks', 'messages'].includes(
              tab
            ) && (
              <>
                <h1 className="text-3xl font-extrabold">
                  {tab === 'assignments'
                    ? 'Task Assignment Center'
                    : tab === 'messages'
                      ? 'Task Communications'
                      : 'All Campus Tasks'}
                </h1>

                <div className="flex flex-wrap gap-3">
                  <div className="relative w-full max-w-md">
                    <Search
                      size={16}
                      className="absolute left-3 top-4 text-stone-500"
                    />

                    <input
                      value={search}
                      onChange={(e) =>
                        setSearch(e.target.value)
                      }
                      className={`${field} pl-10`}
                      placeholder="Search product, task or Hero..."
                    />
                  </div>

                  <select
                    value={filter}
                    onChange={(e) =>
                      setFilter(e.target.value)
                    }
                    className={`${field} w-auto`}
                  >
                    {[
                      'ALL',
                      'UNASSIGNED',
                      'ASSIGNED',
                      'PICKED_UP',
                      'DELIVERED',
                      'COMPLETED',
                      'CANCELLED',
                    ].map((status) => (
                      <option key={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>

                <section className={panel}>
                  {renderTasks(
                    tab === 'assignments'
                      ? filteredTasks.filter((task) =>
                        ACTIVE.includes(task.status)
                      )
                      : filteredTasks
                  )}
                </section>
              </>
            )}

          {/* HERO ACTIVITY */}

          {data && tab === 'activity' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Hero Activity
              </h1>

              <input
                className={`${field} max-w-md`}
                placeholder="Search Hero, event or task ID..."
                value={search}
                onChange={(e) =>
                  setSearch(e.target.value)
                }
              />

              <section className={panel}>
                <EventList
                  events={data.events.filter((event) =>
                    matchesSearch(
                      `${event.actor.name} ${event.action} ${event.task_id} ${event.details || ''
                      }`
                    )
                  )}
                />
              </section>
            </>
          )}

          {/* ISSUES AND ESCALATIONS */}

          {data && tab === 'issues' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Issues & Escalations
              </h1>

              {!data.issues.length && (
                <Empty title="No operational issues reported." />
              )}

              {data.issues.map((issue) => (
                <section key={issue.id} className={panel}>
                  <div className="flex flex-wrap justify-between gap-3">
                    <div>
                      <h3 className="font-bold">
                        {issue.category}
                      </h3>

                      <p className="mt-1 text-xs text-stone-400">
                        Reported by {issue.reporter}
                        {' · '}
                        {formatDate(issue.created_at)}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Status value={issue.severity} />
                      <Status value={issue.status} />
                    </div>
                  </div>

                  <p className="my-4 break-words text-sm text-stone-300">
                    {issue.description}
                  </p>

                  {issue.resolution_notes && (
                    <p className="mb-4 text-xs text-stone-400">
                      Previous notes: {issue.resolution_notes}
                    </p>
                  )}

                  {issue.status !== 'RESOLVED' && (
                    <>
                      <textarea
                        rows={3}
                        className={field}
                        placeholder="Enter resolution or escalation notes..."
                        value={notes[issue.id] || ''}
                        onChange={(e) =>
                          setNotes((previous) => ({
                            ...previous,
                            [issue.id]: e.target.value,
                          }))
                        }
                      />

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[
                          'UNDER_REVIEW',
                          'ESCALATED',
                          'RESOLVED',
                        ].map((status) => (
                          <button
                            key={status}
                            disabled={working}
                            className={
                              status === 'RESOLVED'
                                ? primary
                                : secondary
                            }
                            onClick={() => {
                              const note =
                                notes[issue.id] || '';

                              if (
                                status === 'RESOLVED' &&
                                note.trim().length < 10
                              ) {
                                toast.error(
                                  'Enter resolution notes of at least 10 characters.'
                                );
                                return;
                              }

                              void performAction(
                                () =>
                                  heroManagerApi.resolveIssue(
                                    issue.id,
                                    status,
                                    note
                                  ),
                                'Issue status updated.'
                              );
                            }}
                          >
                            {formatStatus(status)}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </section>
              ))}
            </>
          )}

          {/* VERIFICATION QUEUE */}

          {data && tab === 'verification' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Verification Queue
              </h1>

              {!data.proofs.length && (
                <Empty title="No pickup or handover evidence submitted." />
              )}

              <div className="grid gap-5 xl:grid-cols-2">
                {data.proofs.map((proof) => (
                  <section key={proof.id} className={panel}>
                    <img
                      src={proof.image_url}
                      alt={`${proof.kind} evidence`}
                      className="mb-4 h-56 w-full rounded-xl bg-[#090B09] object-contain"
                    />

                    <div className="flex justify-between gap-2">
                      <h3 className="font-bold">
                        {formatStatus(proof.kind)} Proof
                      </h3>

                      <Status
                        value={proof.review_status}
                      />
                    </div>

                    <p className="my-3 text-xs text-stone-400">
                      Uploaded by{' '}
                      {proof.uploader?.name || 'Hero'}
                      {' · '}
                      {formatDate(proof.created_at)}
                    </p>

                    {proof.review_note && (
                      <p className="mb-3 text-xs text-stone-400">
                        {proof.review_note}
                      </p>
                    )}

                    <textarea
                      rows={2}
                      value={notes[proof.id] || ''}
                      className={field}
                      placeholder="Verification notes..."
                      onChange={(e) =>
                        setNotes((previous) => ({
                          ...previous,
                          [proof.id]: e.target.value,
                        }))
                      }
                    />

                    <div className="mt-3 flex flex-wrap gap-2">
                      {[
                        'APPROVED',
                        'NEEDS_MORE_EVIDENCE',
                        'FLAGGED',
                      ].map((status) => (
                        <button
                          key={status}
                          disabled={working}
                          className={
                            status === 'APPROVED'
                              ? primary
                              : secondary
                          }
                          onClick={() => {
                            const note =
                              notes[proof.id] || '';

                            if (
                              status !== 'APPROVED' &&
                              note.trim().length < 8
                            ) {
                              toast.error(
                                'Provide a review note of at least 8 characters.'
                              );
                              return;
                            }

                            void performAction(
                              () =>
                                heroManagerApi.reviewProof(
                                  proof.id,
                                  status,
                                  note
                                ),
                              'Verification updated.'
                            );
                          }}
                        >
                          {formatStatus(status)}
                        </button>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </>
          )}

          {/* ANNOUNCEMENTS */}

          {data && tab === 'announcements' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Campus Announcements
              </h1>

              <section className={panel}>
                <h2 className="mb-5 font-bold">
                  Publish Announcement
                </h2>

                <div className="space-y-4">
                  <input
                    className={field}
                    placeholder="Announcement title"
                    maxLength={120}
                    value={announcementTitle}
                    onChange={(e) =>
                      setAnnouncementTitle(e.target.value)
                    }
                  />

                  <textarea
                    rows={5}
                    className={field}
                    maxLength={1200}
                    placeholder="Write instructions for your Campus Heroes..."
                    value={announcementContent}
                    onChange={(e) =>
                      setAnnouncementContent(
                        e.target.value
                      )
                    }
                  />

                  <select
                    value={priority}
                    className={field}
                    onChange={(e) =>
                      setPriority(e.target.value)
                    }
                  >
                    <option value="NORMAL">
                      Normal Priority
                    </option>
                    <option value="URGENT">
                      Urgent
                    </option>
                  </select>

                  <button
                    className={primary}
                    disabled={working}
                    onClick={() => {
                      if (
                        announcementTitle.trim().length < 3 ||
                        announcementContent.trim().length < 10
                      ) {
                        toast.error(
                          'Enter a title and a message of at least 10 characters.'
                        );
                        return;
                      }

                      void performAction(async () => {
                        await heroManagerApi.publishAnnouncement(
                          collegeId,
                          announcementTitle,
                          announcementContent,
                          priority
                        );

                        setAnnouncementTitle('');
                        setAnnouncementContent('');
                      }, 'Announcement published.');
                    }}
                  >
                    <Megaphone size={16} />
                    Publish Announcement
                  </button>
                </div>
              </section>

              <section className={panel}>
                <h2 className="mb-5 font-bold">
                  Announcement History
                </h2>

                {!data.announcements.length && (
                  <Empty title="No announcements published." />
                )}

                {data.announcements.map((item) => (
                  <div
                    key={item.id}
                    className="mb-3 rounded-xl border border-white/10 p-4"
                  >
                    <div className="flex justify-between gap-3">
                      <h3 className="font-bold">
                        {item.title}
                      </h3>

                      <Status value={item.priority} />
                    </div>

                    <p className="my-3 whitespace-pre-wrap break-words text-sm text-stone-400">
                      {item.content}
                    </p>

                    <p className="text-xs text-stone-500">
                      {formatDate(item.created_at)}
                    </p>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* PERFORMANCE ANALYTICS */}

          {data && tab === 'analytics' && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-extrabold">
                  Performance Analytics
                </h1>

                <button
                  className={primary}
                  onClick={() => exportCSV(tasks)}
                >
                  <Download size={16} />
                  Export Tasks CSV
                </button>
              </div>

              <section className={panel}>
                <h2 className="mb-6 font-bold">
                  Hero Workload Distribution
                </h2>

                {heroes.map((hero) => {
                  const max = Math.max(
                    1,
                    ...heroes.map(
                      (item) => item.active_tasks
                    )
                  );

                  return (
                    <div
                      key={hero.id}
                      className="mb-6"
                    >
                      <div className="mb-2 flex justify-between text-sm">
                        <span>{hero.name}</span>

                        <span className="text-[#C6DE41]">
                          {hero.active_tasks} active
                        </span>
                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">
                        <div
                          className="h-full rounded-full bg-[#C6DE41] transition-all"
                          style={{
                            width: `${(hero.active_tasks / max) *
                              100
                              }%`,
                          }}
                        />
                      </div>

                      <p className="mt-2 text-xs text-stone-500">
                        {hero.completed_tasks} completed
                        tasks
                      </p>
                    </div>
                  );
                })}

                {!heroes.length && (
                  <Empty title="No Hero performance data." />
                )}
              </section>

              <section className={panel}>
                <h2 className="mb-4 font-bold">
                  Task Status Breakdown
                </h2>

                {[
                  'ASSIGNED',
                  'PICKED_UP',
                  'DELIVERED',
                  'COMPLETED',
                  'CANCELLED',
                ].map((status) => (
                  <div
                    key={status}
                    className="flex justify-between border-b border-white/5 py-3 text-sm"
                  >
                    <Status value={status} />

                    <span>
                      {
                        tasks.filter(
                          (task) =>
                            task.status === status
                        ).length
                      }
                    </span>
                  </div>
                ))}
              </section>
            </>
          )}

          {/* OPERATIONAL NOTIFICATIONS */}

          {data && tab === 'notifications' && (
            <>
              <h1 className="text-3xl font-extrabold">
                Operational Notifications
              </h1>

              <section className={panel}>
                {data.issues
                  .filter(
                    (issue) =>
                      issue.status !== 'RESOLVED'
                  )
                  .map((issue) => (
                    <button
                      key={issue.id}
                      onClick={() =>
                        navigateTab('issues')
                      }
                      className="mb-3 flex w-full items-center gap-3 rounded-xl border border-amber-400/20 p-4 text-left text-sm"
                    >
                      <AlertTriangle
                        size={18}
                        className="text-amber-300"
                      />

                      <span className="flex-1">
                        {issue.category} — {issue.reporter}
                      </span>

                      <Status value={issue.severity} />
                    </button>
                  ))}

                <EventList
                  events={data.events.slice(0, 15)}
                />
              </section>
            </>
          )}

          {/* MANAGER PROFILE */}

          {data && tab === 'profile' && (
            <section className={panel}>
              <h1 className="mb-6 text-2xl font-bold">
                Manager Profile
              </h1>

              <div className="flex items-center gap-4">
                <Avatar
                  name={access.user?.name || 'Manager'}
                />

                <div>
                  <p className="font-bold">
                    {access.user?.name}
                  </p>

                  <p className="text-sm text-stone-400">
                    {access.user?.email}
                  </p>
                </div>
              </div>

              <div className="my-5 space-y-3 text-sm text-stone-400">
                <p>Phone: {access.user?.phone}</p>

                <p>
                  Authorized campuses:{' '}
                  {access.managerColleges
                    .map((college) => college.code)
                    .join(', ')}
                </p>
              </div>

              <Link
                to="/settings"
                className={secondary}
              >
                <Settings size={16} />
                Account Settings
              </Link>
            </section>
          )}

          {/* ADMIN-ONLY MANAGER ACCESS */}

          {tab === 'access' && isAdmin && (
            <>
              <h1 className="text-3xl font-extrabold">
                Manager Access Management
              </h1>

              <section className={panel}>
                <h2 className="mb-2 font-bold">
                  Assign a Campus Manager
                </h2>

                <p className="mb-5 text-xs text-stone-400">
                  Grant an existing CampusMart user
                  management permissions for a specific
                  college without making them an Admin.
                </p>

                <div className="space-y-4">
                  <input
                    className={field}
                    value={managerId}
                    onChange={(e) =>
                      setManagerId(e.target.value)
                    }
                    placeholder="CampusMart User ID"
                  />

                  <select
                    className={field}
                    value={managerCampus}
                    onChange={(e) =>
                      setManagerCampus(e.target.value)
                    }
                  >
                    <option value="">
                      Select a college
                    </option>

                    {access.managerColleges.map(
                      (college) => (
                        <option
                          key={college.id}
                          value={college.id}
                        >
                          {college.code} — {college.name}
                        </option>
                      )
                    )}
                  </select>

                  <button
                    className={primary}
                    disabled={working}
                    onClick={() => {
                      if (
                        !managerId.trim() ||
                        !managerCampus
                      ) {
                        toast.error(
                          'Select a user and college.'
                        );
                        return;
                      }

                      void performAction(async () => {
                        await heroManagerApi.grantManagerAccess(
                          managerId.trim(),
                          managerCampus
                        );

                        setManagerId('');
                      }, 'Manager access granted.');
                    }}
                  >
                    <ShieldCheck size={16} />
                    Grant Manager Access
                  </button>
                </div>
              </section>

              <section className={panel}>
                <h2 className="mb-5 font-bold">
                  Current Manager Assignments
                </h2>

                {!managers.length && (
                  <Empty title="No manager assignments found." />
                )}

                {managers.map((manager) => (
                  <div
                    key={manager.id}
                    className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/10 p-4"
                  >
                    <div>
                      <p className="text-sm font-bold">
                        {manager.user.name}
                      </p>

                      <p className="mt-1 text-xs text-stone-400">
                        {manager.user.email}
                        {' · '}
                        {manager.college.code}
                      </p>
                    </div>

                    <Status
                      value={
                        manager.is_active
                          ? 'AVAILABLE'
                          : 'OFF_DUTY'
                      }
                    />

                    {manager.is_active && (
                      <button
                        disabled={working}
                        className="rounded-lg border border-red-400/20 px-3 py-2 text-xs text-red-300"
                        onClick={() => {
                          if (
                            !window.confirm(
                              'Revoke manager access for this college?'
                            )
                          ) {
                            return;
                          }

                          void performAction(
                            () =>
                              heroManagerApi.revokeManagerAccess(
                                manager.id
                              ),
                            'Manager access revoked.'
                          );
                        }}
                      >
                        Revoke Access
                      </button>
                    )}
                  </div>
                ))}
              </section>
            </>
          )}

          {data && (
            <p className="text-[11px] text-stone-500">
              Statistics reflect the records returned by
              the current campus operations API.
              Operational completion does not confirm
              payment settlement.
            </p>
          )}
        </div>
      </main>

      {/* TASK DETAIL AND ASSIGNMENT DRAWER */}

      {selectedTask && (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/70">
          <button
            aria-label="Close task details"
            className="absolute inset-0"
            onClick={() => {
              if (!working) setSelectedId(null);
            }}
          />

          <section
            role="dialog"
            aria-modal="true"
            aria-label="Task details"
            className="relative flex h-full w-full max-w-[850px] flex-col border-l border-white/10 bg-[#12160F] shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-white/10 p-6">
              <div>
                <p className="text-xs font-bold uppercase text-[#C6DE41]">
                  Task Details
                </p>

                <h2 className="mt-2 text-xl font-bold">
                  {selectedTask.product.name}
                </h2>
              </div>

              <button
                disabled={working}
                onClick={() => setSelectedId(null)}
                aria-label="Close task details"
              >
                <X size={22} />
              </button>
            </div>

            <div className="flex-1 space-y-5 overflow-y-auto p-5 md:p-6">
              {detailError && (
                <p className="rounded-xl bg-red-400/10 p-3 text-xs text-red-300">
                  {detailError}
                </p>
              )}

              <div className={panel}>
                <div className="flex justify-between">
                  <h3 className="font-bold">
                    Task Information
                  </h3>

                  <Status value={selectedTask.status} />
                </div>

                <div className="mt-4 space-y-3 text-sm text-stone-400">
                  <p>Task ID: {selectedTask.id}</p>

                  <p>
                    Hero:{' '}
                    {selectedTask.assigned_hero?.name ||
                      'Unassigned'}
                  </p>

                  <p>
                    Seller:{' '}
                    {selectedTask.seller?.name ||
                      'Not applicable'}
                  </p>

                  <p>
                    Buyer:{' '}
                    {selectedTask.buyer?.name ||
                      'Not applicable'}
                  </p>

                  <p>
                    Condition:{' '}
                    {selectedTask.condition || 'Unknown'}
                  </p>

                  <p>
                    Pickup notes:{' '}
                    {selectedTask.pickup_notes ||
                      'No notes'}
                  </p>

                  <p>
                    Delivery notes:{' '}
                    {selectedTask.delivery_notes ||
                      'No notes'}
                  </p>

                  <p>
                    Due:{' '}
                    {formatDate(selectedTask.due_at)}
                  </p>
                </div>

                <div className="mt-4 grid grid-cols-3 gap-2">
                  {selectedTask.photos.map(
                    (photo, index) => (
                      <img
                        key={index}
                        src={photo}
                        alt={`Seller item ${index + 1}`}
                        className="h-24 w-full rounded-lg object-cover"
                      />
                    )
                  )}
                </div>
              </div>

              {/* ASSIGN HERO */}

              {selectedTask.status === 'ASSIGNED' && (
                <div className={panel}>
                  <h3 className="mb-4 font-bold">
                    Assign / Reassign Hero
                  </h3>

                  <select
                    className={field}
                    value={assignedHero}
                    onChange={(e) =>
                      setAssignedHero(e.target.value)
                    }
                  >
                    <option value="">
                      Unassigned
                    </option>

                    {heroes.map((hero) => (
                      <option
                        key={hero.id}
                        value={hero.id}
                        disabled={
                          hero.availability === 'OFF_DUTY'
                        }
                      >
                        {hero.name} — {hero.active_tasks}{' '}
                        active tasks — {hero.availability}
                      </option>
                    ))}
                  </select>

                  <textarea
                    rows={3}
                    className={`${field} mt-3`}
                    placeholder="Reason for reassignment..."
                    value={assignmentReason}
                    onChange={(e) =>
                      setAssignmentReason(e.target.value)
                    }
                  />

                  <button
                    disabled={
                      working ||
                      (selectedTask.assigned_hero_id || '') ===
                      assignedHero
                    }
                    className={`${primary} mt-3`}
                    onClick={() => {
                      if (
                        selectedTask.assigned_hero_id &&
                        assignmentReason.trim().length < 8
                      ) {
                        toast.error(
                          'Provide a reassignment reason of at least 8 characters.'
                        );
                        return;
                      }

                      void performAction(
                        () =>
                          heroManagerApi.assignTask(
                            selectedTask.id,
                            assignedHero || null,
                            assignmentReason
                          ),
                        'Task assignment updated.'
                      );
                    }}
                  >
                    <ClipboardCheck size={16} />
                    Confirm Assignment
                  </button>
                </div>
              )}

              {/* TASK TIMELINE */}

              <div className={panel}>
                <h3 className="mb-5 font-bold">
                  Activity Timeline
                </h3>

                {detailLoading ? (
                  <p className="text-xs text-stone-400">
                    Loading task history...
                  </p>
                ) : (
                  <EventList events={taskEvents} />
                )}
              </div>

              {/* EVIDENCE */}

              <div className={panel}>
                <h3 className="mb-4 font-bold">
                  Submitted Evidence
                </h3>

                {!taskProofs.length && (
                  <p className="text-xs text-stone-500">
                    No evidence uploaded yet.
                  </p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {taskProofs.map((proof) => (
                    <div key={proof.id}>
                      <img
                        src={proof.image_url}
                        alt="Handover proof"
                        className="mb-2 h-32 w-full rounded-lg object-cover"
                      />

                      <Status
                        value={proof.review_status}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* TASK MESSAGING */}

              <div className={panel}>
                <h3 className="mb-4 font-bold">
                  Task Conversation
                </h3>

                <div className="mb-4 max-h-[300px] space-y-3 overflow-y-auto">
                  {messages.map((item) => (
                    <div
                      key={item.id}
                      className={`rounded-xl p-3 ${item.is_mine
                          ? 'bg-[#C6DE41]/10'
                          : 'bg-white/5'
                        }`}
                    >
                      <p className="text-xs font-bold text-[#C6DE41]">
                        {item.sender_name}
                      </p>

                      <p className="my-2 whitespace-pre-wrap break-words text-sm">
                        {item.content}
                      </p>

                      <p className="text-[10px] text-stone-500">
                        {formatDate(item.created_at)}
                      </p>
                    </div>
                  ))}
                </div>

                <select
                  className={field}
                  value={recipient}
                  onChange={(e) =>
                    setRecipient(e.target.value)
                  }
                >
                  <option value="">
                    Choose recipient
                  </option>

                  {selectedTask.assigned_hero && (
                    <option
                      value={
                        selectedTask.assigned_hero.id
                      }
                    >
                      Hero:{' '}
                      {selectedTask.assigned_hero.name}
                    </option>
                  )}

                  {selectedTask.seller && (
                    <option
                      value={selectedTask.seller.id}
                    >
                      Seller: {selectedTask.seller.name}
                    </option>
                  )}

                  {selectedTask.buyer && (
                    <option
                      value={selectedTask.buyer.id}
                    >
                      Buyer: {selectedTask.buyer.name}
                    </option>
                  )}
                </select>

                <textarea
                  rows={3}
                  className={`${field} mt-3`}
                  value={message}
                  maxLength={2000}
                  onChange={(e) =>
                    setMessage(e.target.value)
                  }
                  placeholder="Write a task-specific message..."
                />

                <button
                  disabled={
                    working ||
                    !recipient ||
                    !message.trim()
                  }
                  className={`${primary} mt-3`}
                  onClick={() =>
                    void performAction(async () => {
                      await heroManagerApi.sendMessage(
                        selectedTask.id,
                        recipient,
                        message
                      );

                      setMessage('');
                    }, 'Message sent.')
                  }
                >
                  <Send size={16} />
                  Send Message
                </button>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default HeroManagerDashboardPage;