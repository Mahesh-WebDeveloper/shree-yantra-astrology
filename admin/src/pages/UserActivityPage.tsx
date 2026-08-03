import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity,
  AlertTriangle,
  Bot,
  ChevronRight,
  Crown,
  Filter,
  LayoutGrid,
  List,
  MapPin,
  Radar,
  Search,
  Sparkles,
  Users,
  Wifi,
} from 'lucide-react'

import type { ActivityIssue, ActivityLiveEvent, ActivityUser } from '@/api/endpoints'
import {
  useActivityIssues,
  useActivityLive,
  useActivityOverview,
  useActivityUsers,
} from '@/api/queries'
import { EmptyState, ErrorState, LoadingPanel, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import {
  EVENT_ICONS,
  ISSUE_TYPES,
  SORT_OPTIONS,
  issueLabel,
  propsSummary,
  relativeTime,
  type ActivitySort,
  type ActivityTab,
  type IssueType,
  type PlanFilter,
} from '@/lib/activityPage'
import { cn, formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 12

function PulseDot({ className = 'bg-success' }: { className?: string }) {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', className)} />
      <span className={cn('relative inline-flex size-2 rounded-full', className)} />
    </span>
  )
}

function Avatar({ name, avatar, className = 'size-9 text-sm' }: { name?: string; avatar?: string; className?: string }) {
  if (avatar) {
    return <img src={avatar} alt={name || 'User'} className={cn('shrink-0 rounded-full border border-border object-cover', className)} />
  }
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/25 to-accent/15 font-semibold text-primary', className)}>
      {(name || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function OnlineStatus({ online, lastSeen }: { online: boolean; lastSeen?: string }) {
  if (online) {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
        <PulseDot />
        Online
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 rounded-full bg-muted-foreground/40" />
      {relativeTime(lastSeen)}
    </span>
  )
}

function KpiCard({
  label,
  value,
  sub,
  icon: Icon,
  tone,
  delay = 0,
}: {
  label: string
  value: number
  sub?: string
  icon: typeof Users
  tone: string
  delay?: number
}) {
  return (
    <div
      className="activity-stagger group rounded-xl border border-border bg-card p-4 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={cn('size-5 transition-transform group-hover:scale-110', tone)} />
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value.toLocaleString('en-IN')}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function EventIcon({ name, className }: { name: string; className?: string }) {
  const Icon = EVENT_ICONS[name] ?? Activity
  return <Icon className={className} />
}

function LiveFeed({ events }: { events: ActivityLiveEvent[] }) {
  return (
    <section className="flex min-h-0 flex-col rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseDot />
          <h2 className="text-base font-semibold">Live stream</h2>
        </div>
        <Badge tone="success">auto · 5s</Badge>
      </div>
      <div className="grid max-h-[42rem] gap-2 overflow-y-auto pr-1">
        {events.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Waiting for events… open the app to see activity stream in.</p>
        ) : null}
        {events.map((event, i) => (
          <div
            key={event._id}
            className="feed-enter flex items-start gap-3 rounded-lg border border-border bg-background p-2.5 transition-all hover:border-primary/40"
            style={{ animationDelay: `${Math.min(i, 8) * 50}ms` }}
          >
            <div className={cn('grid size-8 shrink-0 place-items-center rounded-full', event.name.includes('error') ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
              <EventIcon name={event.name} className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <p className="truncate text-sm font-medium">
                  {event.userName || 'Guest'}
                  {event.userPlan === 'premium' ? <Crown className="ml-1 inline size-3.5 text-warning" /> : null}
                </p>
                <span className="shrink-0 text-[11px] text-muted-foreground">{relativeTime(event.createdAt)}</span>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                <span className="font-medium text-foreground/80">{event.name}</span>
                {event.screen ? ` · ${event.screen}` : ''}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

function IssueRow({ issue, index, onUserClick }: { issue: ActivityIssue; index: number; onUserClick: (id: string) => void }) {
  return (
    <div
      className="activity-stagger rounded-xl border border-destructive/20 bg-destructive/[0.04] p-4 transition-all hover:border-destructive/40"
      style={{ animationDelay: `${index * 40}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex gap-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
            <AlertTriangle className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-destructive">{issueLabel(issue.name)}</p>
            <p className="text-xs text-muted-foreground">{formatDateTime(issue.createdAt)}</p>
            {issue.screen ? <p className="mt-1 text-sm">{issue.screen}</p> : null}
            {propsSummary(issue.props) ? (
              <p className="mt-2 max-w-xl rounded-md bg-background/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">{propsSummary(issue.props)}</p>
            ) : null}
          </div>
        </div>
        {issue.userId ? (
          <button
            type="button"
            onClick={() => onUserClick(issue.userId!)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium transition-all hover:border-primary/40"
          >
            {issue.userName || 'User'}
            {issue.userPlan === 'premium' ? <Crown className="size-3 text-warning" /> : null}
            <ChevronRight className="size-3.5" />
          </button>
        ) : (
          <Badge tone="neutral">Guest / anonymous</Badge>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-muted-foreground">
        {issue.platform ? <span>{issue.platform}</span> : null}
        {issue.appVersion ? <span>v{issue.appVersion}</span> : null}
        {issue.device ? <span>{issue.device}</span> : null}
        {[issue.city, issue.country].filter(Boolean).length ? (
          <span className="inline-flex items-center gap-0.5"><MapPin className="size-3" />{[issue.city, issue.country].filter(Boolean).join(', ')}</span>
        ) : null}
      </div>
    </div>
  )
}

function UserRow({ user, view, onOpen }: { user: ActivityUser; view: 'cards' | 'table' | 'list'; onOpen: () => void }) {
  if (view === 'cards') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="activity-card-hover min-w-0 rounded-xl border border-border bg-background p-3 text-left transition-all hover:border-primary/40 active:scale-[0.99] sm:p-4"
      >
        <div className="flex items-start gap-3">
          <Avatar name={user.name} avatar={user.avatar} />
          <div className="min-w-0 flex-1">
            <p className="flex flex-wrap items-center gap-1.5 font-semibold">
              <span className={cn('truncate', user.deleted && 'italic text-muted-foreground')}>{user.name || 'Unnamed'}</span>
              {user.deleted ? <Badge tone="danger">deleted</Badge> : null}
              {user.plan === 'premium' ? <Crown className="size-3.5 shrink-0 text-warning" /> : null}
            </p>
            <p className="truncate text-xs text-muted-foreground">{user.phone || user.email}</p>
          </div>
          <OnlineStatus online={user.online} lastSeen={user.lastSeen} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs">
          {(user.aiTurns ?? 0) > 0 ? <Badge tone="accent"><Sparkles className="mr-1 inline size-3" />{user.aiTurns} AI</Badge> : null}
          {(user.errorEvents ?? 0) > 0 ? <Badge tone="danger">{user.errorEvents} errors</Badge> : null}
          {user.lastScreen ? <Badge tone="neutral">{user.lastScreen}</Badge> : null}
          <span className="text-muted-foreground">{user.events} ev · {user.sessions} sess</span>
        </div>
      </button>
    )
  }

  if (view === 'list') {
    return (
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full min-w-0 items-center gap-3 rounded-xl border border-border bg-background p-3 text-left transition hover:border-primary/35 hover:bg-muted/40 active:scale-[0.99]"
      >
        <Avatar name={user.name} avatar={user.avatar} className="size-10 text-sm" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="truncate font-medium">{user.name || 'Unnamed'}</p>
            {user.plan === 'premium' ? <Crown className="size-3.5 shrink-0 text-warning" /> : null}
          </div>
          <p className="truncate text-xs text-muted-foreground">{user.phone || user.email || '—'}</p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
            {(user.aiTurns ?? 0) > 0 ? <span className="text-primary">{user.aiTurns} AI</span> : null}
            {(user.errorEvents ?? 0) > 0 ? <span className="text-destructive">{user.errorEvents} err</span> : null}
            {user.lastScreen ? <span className="truncate">{user.lastScreen}</span> : null}
            <span>{user.events}/{user.sessions}</span>
          </div>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <OnlineStatus online={user.online} lastSeen={user.lastSeen} />
          <ChevronRight className="size-4 text-muted-foreground" />
        </div>
      </button>
    )
  }

  return (
    <tr className="cursor-pointer transition-colors hover:bg-muted/50" onClick={onOpen}>
      <td className="border-b border-border px-3 py-3">
        <div className="flex items-center gap-2.5">
          <Avatar name={user.name} avatar={user.avatar} />
          <div className="min-w-0">
            <p className="flex items-center gap-1 truncate font-medium">{user.name}{user.plan === 'premium' ? <Crown className="size-3.5 text-warning" /> : null}</p>
            <p className="truncate text-xs text-muted-foreground">{user.phone || user.email}</p>
          </div>
        </div>
      </td>
      <td className="border-b border-border px-3 py-3"><OnlineStatus online={user.online} lastSeen={user.lastSeen} /></td>
      <td className="border-b border-border px-3 py-3 text-xs">
        <span className="font-medium text-primary">{(user.aiTurns ?? 0).toLocaleString('en-IN')}</span>
        <span className="text-muted-foreground"> / {(user.aiEvents ?? 0).toLocaleString('en-IN')} asks</span>
      </td>
      <td className="border-b border-border px-3 py-3">
        {(user.errorEvents ?? 0) > 0 ? <Badge tone="danger">{user.errorEvents}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
      </td>
      <td className="border-b border-border px-3 py-3">{user.lastScreen ? <Badge tone="accent">{user.lastScreen}</Badge> : '—'}</td>
      <td className="border-b border-border px-3 py-3 text-right text-xs">{user.events} / {user.sessions}</td>
      <td className="border-b border-border px-3 py-3">
        <ChevronRight className="size-4 text-muted-foreground" />
      </td>
    </tr>
  )
}

export default function UserActivityPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<ActivityTab>('users')
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [sort, setSort] = useState<ActivitySort>('lastSeen')
  const [planFilter, setPlanFilter] = useState<PlanFilter>('')
  const [onlineOnly, setOnlineOnly] = useState(false)
  const [hasErrors, setHasErrors] = useState(false)
  const [hasAi, setHasAi] = useState(false)
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards')
  const [feed, setFeed] = useState<ActivityLiveEvent[]>([])
  const [issueQ, setIssueQ] = useState('')
  const [issueType, setIssueType] = useState<IssueType>('')
  const [issuePage, setIssuePage] = useState(1)

  const overview = useActivityOverview()
  const live = useActivityLive()

  const userParams = useMemo(
    () => ({
      q: q || undefined,
      page,
      limit: PAGE_SIZE,
      sort,
      plan: planFilter || undefined,
      online: onlineOnly ? '1' : undefined,
      hasErrors: hasErrors ? '1' : undefined,
      hasAi: hasAi ? '1' : undefined,
    }),
    [q, page, sort, planFilter, onlineOnly, hasErrors, hasAi],
  )
  const users = useActivityUsers(userParams)

  const issueParams = useMemo(
    () => ({
      q: issueQ || undefined,
      page: issuePage,
      limit: 20,
      type: issueType || undefined,
    }),
    [issueQ, issuePage, issueType],
  )
  const issues = useActivityIssues(issueParams)

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [input])

  useEffect(() => {
    const incoming = live.data?.events
    if (!incoming?.length) return
    setFeed((prev) => {
      const seen = new Set(prev.map((e) => e._id))
      const fresh = incoming.filter((e) => !seen.has(e._id))
      if (!fresh.length) return prev
      return [...fresh, ...prev].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 50)
    })
  }, [live.data])

  const ov = overview.data
  const rows = users.data?.users ?? []
  const totalUsers = users.data?.total ?? 0
  const pages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))
  const onlineUsers = live.data?.onlineUsers ?? ov?.onlineUsers ?? users.data?.onlineNow ?? 0

  const openUser = (id: string) => navigate(`/activity/user/${id}`)

  const tabs: { id: ActivityTab; label: string; icon: typeof Users }[] = [
    { id: 'users', label: 'Users', icon: Users },
    { id: 'live', label: 'Live', icon: Radar },
    { id: 'issues', label: 'Issues', icon: AlertTriangle },
  ]

  return (
    <div className="grid min-w-0 gap-6 pb-8">
      <PageHeader
        title="User Activity"
        description="Track live usage, AI questions & replies, errors, load failures — per user with advanced filters and sorting."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            <PulseDot />
            LIVE · {onlineUsers.toLocaleString('en-IN')} online
          </span>
        }
      />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Online now" value={onlineUsers} sub={`${(ov?.onlineDevices ?? live.data?.onlineDevices ?? 0).toLocaleString('en-IN')} devices`} icon={Wifi} tone="text-success" delay={0} />
        <KpiCard label="AI asks today" value={ov?.aiAsksToday ?? 0} sub={`${(ov?.aiAsks7d ?? 0).toLocaleString('en-IN')} this week`} icon={Sparkles} tone="text-primary" delay={60} />
        <KpiCard label="Errors today" value={ov?.errorsToday ?? 0} sub={`${(ov?.errors7d ?? 0).toLocaleString('en-IN')} this week · ${ov?.usersWithErrors7d ?? 0} users`} icon={AlertTriangle} tone="text-destructive" delay={120} />
        <KpiCard label="AI chat stored" value={ov?.chatTurnsTotal ?? 0} sub={`${ov?.usersWithAiChat ?? 0} users with history`} icon={Bot} tone="text-accent" delay={180} />
      </div>

      <div className="admin-scroll-x flex gap-2 rounded-xl border border-border bg-muted/20 p-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4',
              tab === t.id ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/70',
            )}
          >
            <t.icon className="size-4" />
            {t.label}
            {t.id === 'issues' && (ov?.errors7d ?? 0) > 0 ? (
              <span className="rounded-full bg-destructive/15 px-1.5 text-[10px] text-destructive">{ov?.errors7d}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'users' ? (
        <div className="grid min-w-0 gap-4">
          <div className="rounded-xl border border-border bg-card p-3 sm:p-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto]">
              <div className="relative min-w-0 sm:col-span-2 lg:col-span-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input className="pl-9" placeholder="Search name, phone, email…" value={input} onChange={(e) => setInput(e.target.value)} />
              </div>
              <Select className="w-full min-w-0" value={sort} onChange={(e) => { setSort(e.target.value as ActivitySort); setPage(1) }}>
                {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
              <Select className="w-full min-w-0" value={planFilter} onChange={(e) => { setPlanFilter(e.target.value as PlanFilter); setPage(1) }}>
                <option value="">All plans</option>
                <option value="free">Free</option>
                <option value="premium">Premium</option>
              </Select>
              <div className="flex justify-end gap-1">
                <Button type="button" variant={viewMode === 'cards' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('cards')} aria-label="Card view"><LayoutGrid className="size-4" /></Button>
                <Button type="button" variant={viewMode === 'table' ? 'default' : 'ghost'} size="icon" onClick={() => setViewMode('table')} aria-label="List view"><List className="size-4" /></Button>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border pt-3">
              <Filter className="size-4 shrink-0 text-muted-foreground" />
              <span className="text-xs font-medium text-muted-foreground">Quick:</span>
              {[
                { label: 'Online now', active: onlineOnly, toggle: () => { setOnlineOnly((v) => !v); setPage(1) } },
                { label: 'Has AI chat', active: hasAi, toggle: () => { setHasAi((v) => !v); setPage(1) } },
                { label: 'Has errors', active: hasErrors, toggle: () => { setHasErrors((v) => !v); setPage(1) } },
              ].map((pill) => (
                <button
                  key={pill.label}
                  type="button"
                  onClick={pill.toggle}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-medium transition-all',
                    pill.active ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:border-primary/40',
                  )}
                >
                  {pill.label}
                </button>
              ))}
            </div>
          </div>

          <section className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
            {users.isLoading ? <LoadingRows /> : null}
            {users.isError ? <ErrorState message="Could not load users." onRetry={() => void users.refetch()} /> : null}
            {users.data && rows.length === 0 ? <EmptyState title="No users match these filters." /> : null}

            {rows.length > 0 && viewMode === 'cards' ? (
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {rows.map((user) => <UserRow key={user.id} user={user} view="cards" onOpen={() => openUser(user.id)} />)}
              </div>
            ) : null}

            {rows.length > 0 && viewMode === 'table' ? (
              <>
                <div className="grid min-w-0 gap-2 md:hidden">
                  {rows.map((user) => <UserRow key={user.id} user={user} view="list" onOpen={() => openUser(user.id)} />)}
                </div>
                <div className="admin-scroll-x hidden md:block">
                  <table className="w-full min-w-[880px] text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="border-b border-border px-3 py-2">User</th>
                        <th className="border-b border-border px-3 py-2">Status</th>
                        <th className="border-b border-border px-3 py-2">AI chat</th>
                        <th className="border-b border-border px-3 py-2">Errors</th>
                        <th className="border-b border-border px-3 py-2">Last screen</th>
                        <th className="border-b border-border px-3 py-2 text-right">Ev / Sess</th>
                        <th className="border-b border-border px-3 py-2 w-8" />
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((user) => <UserRow key={user.id} user={user} view="table" onOpen={() => openUser(user.id)} />)}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}

            {users.data ? (
              <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <span>Page {page} of {pages} · {totalUsers.toLocaleString('en-IN')} users</span>
                <div className="grid grid-cols-2 gap-2 sm:flex">
                  <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                  <Button type="button" variant="secondary" disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
                </div>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}

      {tab === 'live' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <LiveFeed events={feed} />
          </div>
          <div className="rounded-xl border border-border bg-card p-4">
            <h2 className="text-sm font-semibold">Quick stats</h2>
            <ul className="mt-3 grid gap-2 text-sm">
              <li className="flex justify-between"><span className="text-muted-foreground">Online users</span><span className="font-medium">{onlineUsers}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Active devices</span><span className="font-medium">{live.data?.onlineDevices ?? 0}</span></li>
              <li className="flex justify-between"><span className="text-muted-foreground">Feed events</span><span className="font-medium">{feed.length}</span></li>
            </ul>
            <p className="mt-4 text-xs text-muted-foreground">Events refresh every 5 seconds. AI errors appear in red when tracked from the app.</p>
          </div>
        </div>
      ) : null}

      {tab === 'issues' ? (
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search user name, phone, email…" value={issueQ} onChange={(e) => { setIssueQ(e.target.value); setIssuePage(1) }} />
            </div>
            <Select className="w-auto min-w-[10rem]" value={issueType} onChange={(e) => { setIssueType(e.target.value as IssueType); setIssuePage(1) }}>
              {ISSUE_TYPES.map((t) => <option key={t.value || 'all'} value={t.value}>{t.label}</option>)}
            </Select>
          </div>

          {issues.isLoading ? <LoadingPanel label="Loading issues…" /> : null}
          {issues.isError ? <ErrorState message="Could not load issues." onRetry={() => void issues.refetch()} /> : null}
          {issues.data && issues.data.issues.length === 0 ? (
            <EmptyState title="No issues in this period." />
          ) : null}

          <div className="grid gap-3">
            {(issues.data?.issues ?? []).map((issue, i) => (
              <IssueRow key={issue._id} issue={issue} index={i} onUserClick={openUser} />
            ))}
          </div>

          {issues.data && issues.data.total > 20 ? (
            <div className="flex justify-center gap-2">
              <Button type="button" variant="secondary" disabled={issuePage <= 1} onClick={() => setIssuePage((p) => p - 1)}>Previous</Button>
              <span className="self-center text-sm text-muted-foreground">Page {issuePage}</span>
              <Button type="button" variant="secondary" disabled={issuePage * 20 >= issues.data.total} onClick={() => setIssuePage((p) => p + 1)}>Next</Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
