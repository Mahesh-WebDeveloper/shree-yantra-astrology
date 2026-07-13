import { useEffect, useMemo, useState } from 'react'
import {
  Activity,
  Clock,
  Crown,
  Dot,
  Eye,
  Loader2,
  LogIn,
  MapPin,
  MonitorSmartphone,
  Play,
  Search,
  Smartphone,
  Sparkles,
  Star,
  Users,
  Wifi,
  X,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { endpoints } from '@/api/endpoints'
import type { ActivityLiveEvent, ActivityTimelineEvent, ActivityUser } from '@/api/endpoints'
import { useActivityLive, useActivityUser, useActivityUsers } from '@/api/queries'
import { EmptyState, ErrorState, LoadingPanel, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import { cn, formatDate, formatDateTime } from '@/lib/utils'

const PAGE_SIZE = 12

/* ---------------------------------- helpers ---------------------------------- */

function relativeTime(value?: string | null) {
  if (!value) return 'never'
  const diff = Date.now() - new Date(value).getTime()
  if (Number.isNaN(diff)) return 'never'
  if (diff < 45_000) return 'just now'
  const minutes = Math.floor(diff / 60_000)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatDate(value)
}

const EVENT_ICONS: Record<string, typeof Eye> = {
  screen_view: Eye,
  login: LogIn,
  search: Search,
  media_play: Play,
  ai_ask: Sparkles,
  kundli_view: Star,
}

function EventIcon({ name, className }: { name: string; className?: string }) {
  const Icon = EVENT_ICONS[name] ?? Dot
  return <Icon className={className} />
}

function propsSummary(props?: Record<string, unknown>) {
  if (!props || Object.keys(props).length === 0) return null
  const text = JSON.stringify(props)
  return text.length > 90 ? `${text.slice(0, 90)}…` : text
}

function Avatar({ name, avatar, className = 'size-9 text-sm' }: { name?: string; avatar?: string; className?: string }) {
  if (avatar) {
    return <img src={avatar} alt={name || 'User avatar'} className={cn('shrink-0 rounded-full border border-border object-cover', className)} />
  }
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-full bg-warning/15 font-semibold text-warning', className)}>
      {(name || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function PulseDot({ className = 'bg-success' }: { className?: string }) {
  return (
    <span className="relative flex size-2 shrink-0">
      <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-60', className)} />
      <span className={cn('relative inline-flex size-2 rounded-full', className)} />
    </span>
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

function StatCard({ label, value, sub, icon: Icon, tone }: { label: string; value: number; sub?: string; icon: typeof Users; tone: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-3 text-card-foreground shadow-sm transition-all hover:shadow-md sm:p-4">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-muted-foreground">{label}</span>
        <Icon className={tone} />
      </div>
      <p className="mt-3 text-2xl font-semibold sm:text-3xl">{value.toLocaleString('en-IN')}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

/* --------------------------------- live feed --------------------------------- */

function LiveFeed({ events }: { events: ActivityLiveEvent[] }) {
  return (
    <section className="flex min-h-0 flex-col rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PulseDot />
          <h2 className="text-base font-semibold">Live feed</h2>
        </div>
        <Badge tone="success">auto · 5s</Badge>
      </div>
      <div className="grid max-h-[40rem] gap-2 overflow-y-auto pr-1 lg:max-h-[46rem]">
        {events.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Waiting for events… open the app to see them stream in.</p>
        ) : null}
        {events.map((event) => (
          <div key={event._id} className="feed-enter flex items-start gap-3 rounded-md border border-border bg-background p-2.5 transition-all hover:border-primary/40">
            <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
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
              {event.city || event.country ? (
                <p className="mt-0.5 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
                  <MapPin className="size-3 shrink-0" />
                  {[event.city, event.country].filter(Boolean).join(', ')}
                </p>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------- detail drawer -------------------------------- */

function SummaryChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-background p-2.5">
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}

function MiniBars({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.count))
  return (
    <div className="rounded-md border border-border bg-background p-3">
      <h3 className="text-sm font-semibold">{title}</h3>
      <div className="mt-2 grid gap-2 text-sm">
        {rows.length === 0 && <p className="text-xs text-muted-foreground">No data yet.</p>}
        {rows.map((row) => (
          <div key={row.label} className="grid gap-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-xs">{row.label}</span>
              <span className="text-xs font-medium">{row.count}</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted">
              <div className="h-1.5 rounded-full bg-primary transition-all" style={{ width: `${(row.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function UserDetailDrawer({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useActivityUser(id)
  const [extraTimeline, setExtraTimeline] = useState<ActivityTimelineEvent[]>([])
  const [loadingMore, setLoadingMore] = useState(false)
  const [exhausted, setExhausted] = useState(false)

  const timeline = useMemo(() => {
    const base = detail.data?.timeline ?? []
    const seen = new Set(base.map((e) => e._id))
    return [...base, ...extraTimeline.filter((e) => !seen.has(e._id))]
  }, [detail.data, extraTimeline])

  const loadMore = async () => {
    const oldest = timeline[timeline.length - 1]
    if (!oldest || loadingMore) return
    setLoadingMore(true)
    try {
      const res = await endpoints.activityUser(id, oldest.createdAt)
      if (res.timeline.length === 0) setExhausted(true)
      else setExtraTimeline((prev) => [...prev, ...res.timeline])
    } catch {
      // keep the button enabled so the admin can retry
    } finally {
      setLoadingMore(false)
    }
  }

  const d = detail.data

  return (
    <div className="fixed inset-0 z-50">
      <div className="backdrop-enter absolute inset-0 bg-black/45" onClick={onClose} aria-hidden />
      <aside className="drawer-enter absolute inset-y-0 right-0 flex w-full flex-col overflow-y-auto border-l border-border bg-card p-4 text-card-foreground shadow-xl sm:max-w-lg sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold">User activity</h2>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close details">
            <X className="size-4" />
          </Button>
        </div>

        {detail.isLoading ? <div className="mt-4"><LoadingPanel label="Loading user activity" /></div> : null}
        {detail.isError ? <div className="mt-4"><ErrorState message="Could not load user activity." onRetry={() => void detail.refetch()} /></div> : null}

        {d ? (
          <div className="mt-4 grid gap-4 pb-8">
            {/* identity */}
            <div className="rounded-lg border border-border bg-background p-4">
              <div className="flex items-start gap-3">
                <Avatar name={d.user.name} avatar={d.user.avatar} className="size-12 text-lg" />
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1.5 truncate font-semibold">
                    {d.user.name || 'Unnamed user'}
                    {d.user.plan === 'premium' ? <Crown className="size-4 shrink-0 text-warning" /> : null}
                  </p>
                  <p className="mt-0.5 break-all text-xs text-muted-foreground">{d.user.phone || d.user.email || d.user.id}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {d.user.deleted ? <Badge tone="danger">account deleted</Badge> : null}
                    <Badge tone={d.user.plan === 'premium' ? 'warning' : 'neutral'}>{d.user.plan}</Badge>
                    {d.summary.online ? <Badge tone="success">online</Badge> : <Badge>offline</Badge>}
                    {d.user.blocked ? <Badge tone="danger">blocked</Badge> : null}
                  </div>
                  {d.user.deleted ? (
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      This account no longer exists — its past activity is kept here.
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="mt-3 grid gap-1 text-xs text-muted-foreground">
                <p>Joined: {formatDate(d.user.joinedAt)}</p>
                {d.user.place ? (
                  <p className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {d.user.place}
                  </p>
                ) : null}
                {d.user.interests && d.user.interests.length > 0 ? (
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {d.user.interests.map((interest) => (
                      <Badge key={interest} tone="accent">{interest}</Badge>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            {/* summary chips */}
            <div className="grid grid-cols-2 gap-2">
              <SummaryChip label="Events" value={d.summary.events.toLocaleString('en-IN')} />
              <SummaryChip label="Sessions" value={d.summary.sessions.toLocaleString('en-IN')} />
              <SummaryChip label="First seen" value={relativeTime(d.summary.firstSeen)} />
              <SummaryChip label="Last seen" value={d.summary.online ? 'now' : relativeTime(d.summary.lastSeen)} />
            </div>

            {/* 14-day chart */}
            <div className="rounded-md border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">Activity</h3>
                <Badge tone="accent">Last 14 days</Badge>
              </div>
              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={d.perDay} margin={{ left: -28, right: 8, top: 8, bottom: 0 }}>
                    <defs>
                      <linearGradient id="uaFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                    <Area dataKey="count" name="Events" type="monotone" stroke="hsl(var(--primary))" strokeWidth={2} fill="url(#uaFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* top screens */}
            <MiniBars title="Top screens" rows={d.topScreens.map((s) => ({ label: s.screen, count: s.count }))} />

            {/* devices */}
            <div className="rounded-md border border-border bg-background p-3">
              <h3 className="text-sm font-semibold">Devices</h3>
              <div className="mt-2 grid gap-2">
                {d.devices.length === 0 && <p className="text-xs text-muted-foreground">No devices recorded.</p>}
                {d.devices.map((device) => (
                  <div key={device.deviceId} className="flex items-start gap-2.5 rounded-md border border-border p-2.5 transition-all hover:bg-muted/50">
                    <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
                    <div className="min-w-0 flex-1 text-xs">
                      <p className="truncate text-sm font-medium">{device.device || device.deviceId}</p>
                      <p className="mt-0.5 text-muted-foreground">
                        {[device.platform, device.osVersion ? `OS ${device.osVersion}` : null, device.appVersion ? `app ${device.appVersion}` : null]
                          .filter(Boolean)
                          .join(' · ') || 'Unknown platform'}
                      </p>
                      <p className="mt-0.5 text-muted-foreground">
                        {device.events.toLocaleString('en-IN')} events · last seen {relativeTime(device.lastSeen)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* locations */}
            <div className="rounded-md border border-border bg-background p-3">
              <h3 className="text-sm font-semibold">Locations</h3>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                <span className="font-medium text-success">GPS</span> = exact (device, with permission).{' '}
                <span className="font-medium">IP</span> = approximate — mobile carriers (Jio/Airtel) route users through
                a shared gateway, so the IP city is often the wrong city.
              </p>
              <div className="mt-2 grid gap-1.5">
                {d.locations.length === 0 && <p className="text-xs text-muted-foreground">No locations recorded.</p>}
                {d.locations.map((location, index) => (
                  <div key={`${location.city}-${location.region}-${location.country}-${index}`} className="flex items-center justify-between gap-2 rounded-md px-1 py-1 text-xs transition-all hover:bg-muted/50">
                    <span className="flex min-w-0 items-center gap-1.5">
                      <MapPin className={`size-3 shrink-0 ${location.locSource === 'gps' ? 'text-success' : 'text-accent'}`} />
                      <span className="truncate">{[location.city, location.region, location.country].filter(Boolean).join(', ') || 'Unknown'}</span>
                      <span
                        className={`shrink-0 rounded px-1 py-px text-[10px] font-medium ${
                          location.locSource === 'gps'
                            ? 'bg-success/15 text-success'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {location.locSource === 'gps' ? 'GPS' : 'IP · approx'}
                      </span>
                    </span>
                    <span className="shrink-0 text-muted-foreground">
                      {location.count.toLocaleString('en-IN')} · {relativeTime(location.lastSeen)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* timeline */}
            <div className="rounded-md border border-border bg-background p-3">
              <div className="flex items-center gap-2">
                <Clock className="size-4 text-primary" />
                <h3 className="text-sm font-semibold">Timeline</h3>
              </div>
              <div className="mt-2 grid max-h-96 gap-2 overflow-y-auto pr-1">
                {timeline.length === 0 && <p className="text-xs text-muted-foreground">No events yet.</p>}
                {timeline.map((event) => {
                  const summary = propsSummary(event.props)
                  return (
                    <div key={event._id} className="flex items-start gap-2.5 rounded-md border border-border p-2.5 transition-all hover:border-primary/40">
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                        <EventIcon name={event.name} className="size-3.5" />
                      </div>
                      <div className="min-w-0 flex-1 text-xs">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="truncate text-sm font-medium">{event.name}</p>
                          <span className="shrink-0 text-[11px] text-muted-foreground" title={formatDateTime(event.createdAt)}>{relativeTime(event.createdAt)}</span>
                        </div>
                        <p className="mt-0.5 truncate text-muted-foreground">
                          {[event.screen, [event.deviceBrand, event.deviceModel].filter(Boolean).join(' '), [event.city, event.country].filter(Boolean).join(', ')]
                            .filter(Boolean)
                            .join(' · ') || event.platform || '—'}
                        </p>
                        {summary ? <p className="mt-1 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">{summary}</p> : null}
                      </div>
                    </div>
                  )
                })}
              </div>
              {timeline.length > 0 && !exhausted ? (
                <Button type="button" variant="secondary" size="sm" className="mt-3 w-full" disabled={loadingMore} onClick={() => void loadMore()}>
                  {loadingMore ? <Loader2 className="size-3.5 animate-spin" /> : null}
                  {loadingMore ? 'Loading…' : 'Load more'}
                </Button>
              ) : null}
              {exhausted ? <p className="mt-3 text-center text-[11px] text-muted-foreground">End of timeline.</p> : null}
            </div>
          </div>
        ) : null}
      </aside>
    </div>
  )
}

/* ----------------------------------- page ------------------------------------ */

export default function UserActivityPage() {
  const [input, setInput] = useState('')
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feed, setFeed] = useState<ActivityLiveEvent[]>([])

  const users = useActivityUsers(q, page)
  const live = useActivityLive()

  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(input.trim())
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [input])

  useEffect(() => {
    const incoming = live.data?.events
    if (!incoming || incoming.length === 0) return
    setFeed((prev) => {
      const seen = new Set(prev.map((e) => e._id))
      const fresh = incoming.filter((e) => !seen.has(e._id))
      if (fresh.length === 0) return prev
      return [...fresh, ...prev]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 40)
    })
  }, [live.data])

  const onlineUsers = live.data?.onlineUsers ?? users.data?.onlineNow ?? 0
  const onlineDevices = live.data?.onlineDevices ?? 0
  const totalUsers = users.data?.total ?? 0
  const pageEvents = useMemo(() => (users.data?.users ?? []).reduce((sum, u) => sum + (u.events || 0), 0), [users.data])
  const pages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE))

  const rows: ActivityUser[] = users.data?.users ?? []

  return (
    <div className="grid gap-6">
      <PageHeader
        title="User Activity"
        description="Who is using the app right now — live events, sessions, devices and per-user timelines."
        action={
          <span className="inline-flex items-center justify-center gap-2 self-start rounded-full border border-success/30 bg-success/10 px-3 py-1.5 text-xs font-semibold text-success">
            <PulseDot />
            LIVE · {onlineUsers.toLocaleString('en-IN')} online · {onlineDevices.toLocaleString('en-IN')} devices
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Online now" value={onlineUsers} sub={`${onlineDevices.toLocaleString('en-IN')} devices active`} icon={Wifi} tone="size-5 text-success" />
        <StatCard label="Online devices" value={onlineDevices} sub="active in the last few minutes" icon={MonitorSmartphone} tone="size-5 text-accent" />
        <StatCard label="Active users" value={totalUsers} sub={q ? `matching "${q}"` : 'users with tracked activity'} icon={Users} tone="size-5 text-primary" />
        <StatCard label="Events tracked" value={pageEvents} sub="across listed users" icon={Activity} tone="size-5 text-warning" />
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        {/* users table */}
        <section className="rounded-lg border border-border bg-card p-3 text-card-foreground sm:p-4 lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-base font-semibold">Users</h2>
            <div className="relative w-full sm:max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search name, phone, email" value={input} onChange={(event) => setInput(event.target.value)} />
            </div>
          </div>

          <div className="mt-4">
            {users.isLoading ? <LoadingRows /> : null}
            {users.isError ? <ErrorState message="Could not load user activity." onRetry={() => void users.refetch()} /> : null}
            {users.data && rows.length === 0 ? <EmptyState title={q ? 'No users match this search.' : 'No user activity tracked yet.'} /> : null}

            {rows.length > 0 ? (
              <>
                {/* mobile cards */}
                <div className="grid gap-3 md:hidden">
                  {rows.map((user) => (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setSelectedId(user.id)}
                      className="rounded-lg border border-border bg-background p-3 text-left transition-all hover:border-primary/40 active:scale-[0.99]"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar name={user.name} avatar={user.avatar} />
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 truncate font-semibold">
                            <span className={user.deleted ? 'italic text-muted-foreground' : undefined}>{user.name || 'Unnamed user'}</span>
                            {user.deleted ? <Badge tone="danger">deleted</Badge> : null}
                            {user.plan === 'premium' ? <Crown className="size-3.5 shrink-0 text-warning" /> : null}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-muted-foreground">{user.phone || user.email || user.id}</p>
                        </div>
                        <OnlineStatus online={user.online} lastSeen={user.lastSeen} />
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {user.lastScreen ? <Badge tone="accent">{user.lastScreen}</Badge> : null}
                        <span className="inline-flex items-center gap-1">
                          <Smartphone className="size-3" />
                          {[user.device, user.platform].filter(Boolean).join(' · ') || 'Unknown device'}
                        </span>
                        {user.city || user.country ? (
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" />
                            {[user.city, user.country].filter(Boolean).join(', ')}
                          </span>
                        ) : null}
                        <span>{user.events.toLocaleString('en-IN')} ev · {user.sessions.toLocaleString('en-IN')} sess</span>
                      </div>
                    </button>
                  ))}
                </div>

                {/* desktop table */}
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full min-w-[820px] border-separate border-spacing-0 text-left text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="border-b border-border px-3 py-2 font-medium">User</th>
                        <th className="border-b border-border px-3 py-2 font-medium">Status</th>
                        <th className="border-b border-border px-3 py-2 font-medium">Last screen</th>
                        <th className="border-b border-border px-3 py-2 font-medium">Device</th>
                        <th className="border-b border-border px-3 py-2 font-medium">Location</th>
                        <th className="border-b border-border px-3 py-2 text-right font-medium">Events / Sessions</th>
                        <th className="border-b border-border px-3 py-2 font-medium">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((user) => (
                        <tr key={user.id} className="cursor-pointer transition-colors hover:bg-muted/60" onClick={() => setSelectedId(user.id)}>
                          <td className="border-b border-border px-3 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar name={user.name} avatar={user.avatar} />
                              <div className="min-w-0">
                                <p className="flex items-center gap-1.5 truncate font-medium">
                                  <span className={user.deleted ? 'italic text-muted-foreground' : undefined}>{user.name || 'Unnamed user'}</span>
                                  {user.deleted ? <Badge tone="danger">deleted</Badge> : null}
                                  {user.plan === 'premium' ? <Crown className="size-3.5 shrink-0 text-warning" /> : null}
                                </p>
                                <p className="truncate text-xs text-muted-foreground">{user.phone || user.email || user.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="border-b border-border px-3 py-3">
                            <OnlineStatus online={user.online} lastSeen={user.lastSeen} />
                          </td>
                          <td className="border-b border-border px-3 py-3">
                            {user.lastScreen ? <Badge tone="accent">{user.lastScreen}</Badge> : <span className="text-xs text-muted-foreground">—</span>}
                          </td>
                          <td className="border-b border-border px-3 py-3">
                            <p className="truncate text-xs">{user.device || 'Unknown device'}</p>
                            <p className="truncate text-[11px] text-muted-foreground">
                              {[user.platform, user.osVersion ? `OS ${user.osVersion}` : null, user.appVersion ? `v${user.appVersion}` : null].filter(Boolean).join(' · ') || '—'}
                            </p>
                          </td>
                          <td className="border-b border-border px-3 py-3">
                            {user.city || user.country ? (
                              <span className="inline-flex items-center gap-1 text-xs">
                                <MapPin className={`size-3 shrink-0 ${user.locSource === 'gps' ? 'text-success' : 'text-accent'}`} />
                                <span className="truncate">{[user.city, user.country].filter(Boolean).join(', ')}</span>
                                <span
                                  className={`shrink-0 rounded px-1 py-px text-[10px] font-medium ${
                                    user.locSource === 'gps' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                                  }`}
                                  title={user.locSource === 'gps' ? 'Exact — from device GPS' : 'Approximate — from IP (carrier gateway, often the wrong city)'}
                                >
                                  {user.locSource === 'gps' ? 'GPS' : 'IP'}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="border-b border-border px-3 py-3 text-right text-xs">
                            <span className="font-medium">{user.events.toLocaleString('en-IN')}</span>
                            <span className="text-muted-foreground"> / {user.sessions.toLocaleString('en-IN')}</span>
                          </td>
                          <td className="border-b border-border px-3 py-3 text-xs text-muted-foreground">{formatDate(user.joinedAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : null}
          </div>

          {users.data ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>
                Page {page} of {pages} · {totalUsers.toLocaleString('en-IN')} users
              </span>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button type="button" variant="secondary" disabled={page >= pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </section>

        {/* live feed */}
        <LiveFeed events={feed} />
      </div>

      {selectedId ? <UserDetailDrawer key={selectedId} id={selectedId} onClose={() => setSelectedId(null)} /> : null}
    </div>
  )
}
