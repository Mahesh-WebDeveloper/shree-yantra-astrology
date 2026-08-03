import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  Bot,
  Clock,
  Crown,
  Loader2,
  MapPin,
  MessageSquare,
  Sparkles,
  Smartphone,
} from 'lucide-react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

import { endpoints } from '@/api/endpoints'
import type { ActivityAiTurn, ActivityTimelineEvent } from '@/api/endpoints'
import { useActivityUser } from '@/api/queries'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/form'
import {
  EVENT_ICONS,
  aiAnswerPreview,
  issueLabel,
  propsSummary,
  relativeTime,
} from '@/lib/activityPage'
import { cn, formatDateTime } from '@/lib/utils'

type Tab = 'overview' | 'ai' | 'issues' | 'timeline'

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  ai: 'AI Q&A',
  issues: 'Errors & issues',
  timeline: 'Full timeline',
}

function Avatar({ name, avatar, className = 'size-12 text-lg' }: { name?: string; avatar?: string; className?: string }) {
  if (avatar) {
    return <img src={avatar} alt={name || 'User'} className={cn('shrink-0 rounded-full border border-border object-cover', className)} />
  }
  return (
    <div className={cn('grid shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary/30 to-accent/20 font-semibold text-primary', className)}>
      {(name || '?').trim().charAt(0).toUpperCase() || '?'}
    </div>
  )
}

function EventIcon({ name, className }: { name: string; className?: string }) {
  const Icon = EVENT_ICONS[name] ?? Clock
  return <Icon className={className} />
}

function AiTurnCard({ turn, index }: { turn: ActivityAiTurn; index: number }) {
  const preview = aiAnswerPreview(turn.response)
  const failed = !!turn.error || !turn.response

  return (
    <article
      className="activity-stagger rounded-xl border border-border bg-background p-4 transition-all hover:border-primary/35 hover:shadow-sm"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className={cn('grid size-8 place-items-center rounded-full', failed ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary')}>
            {failed ? <AlertTriangle className="size-4" /> : <Sparkles className="size-4" />}
          </div>
          <div>
            <p className="text-xs text-muted-foreground">{formatDateTime(turn.createdAt)}</p>
            {turn.lang ? <Badge tone="neutral">{turn.lang}</Badge> : null}
          </div>
        </div>
        {failed ? <Badge tone="danger">Failed</Badge> : <Badge tone="success">Answered</Badge>}
      </div>
      <div className="mt-3 rounded-lg bg-muted/40 p-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Question</p>
        <p className="mt-1 text-sm leading-relaxed">{turn.question}</p>
      </div>
      {turn.error ? (
        <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-destructive">Error</p>
          <p className="mt-1 text-sm text-destructive/90">{turn.error}</p>
        </div>
      ) : null}
      {preview ? (
        <div className="mt-3 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-primary">AI reply</p>
          <p className="mt-1 text-sm leading-relaxed text-foreground/90">{preview}</p>
        </div>
      ) : null}
    </article>
  )
}

export default function UserActivityDetailPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const detail = useActivityUser(id)
  const [tab, setTab] = useState<Tab>('overview')
  const [aiSearch, setAiSearch] = useState('')
  const [aiTurns, setAiTurns] = useState<ActivityAiTurn[]>([])
  const [aiHasMore, setAiHasMore] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiLoaded, setAiLoaded] = useState(false)
  const [extraTimeline, setExtraTimeline] = useState<ActivityTimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineExhausted, setTimelineExhausted] = useState(false)

  const d = detail.data

  const timeline = useMemo(() => {
    const base = d?.timeline ?? []
    const seen = new Set(base.map((e) => e._id))
    return [...base, ...extraTimeline.filter((e) => !seen.has(e._id))]
  }, [d, extraTimeline])

  const loadAiChat = async (reset = false) => {
    if (!id || aiLoading) return
    setAiLoading(true)
    try {
      const before = reset ? undefined : aiTurns[aiTurns.length - 1]?.createdAt
      const res = await endpoints.activityUserAiChat(id, {
        before,
        limit: 20,
        q: aiSearch.trim() || undefined,
      })
      setAiTurns((prev) => (reset ? res.turns : [...prev, ...res.turns]))
      setAiHasMore(res.hasMore)
      setAiLoaded(true)
    } finally {
      setAiLoading(false)
    }
  }

  const openAiTab = () => {
    setTab('ai')
    if (!aiLoaded) void loadAiChat(true)
  }

  const loadMoreTimeline = async () => {
    const oldest = timeline[timeline.length - 1]
    if (!oldest || timelineLoading || !id) return
    setTimelineLoading(true)
    try {
      const res = await endpoints.activityUser(id, oldest.createdAt)
      if (res.timeline.length === 0) setTimelineExhausted(true)
      else setExtraTimeline((prev) => [...prev, ...res.timeline])
    } finally {
      setTimelineLoading(false)
    }
  }

  if (detail.isLoading) {
    return (
      <div className="grid gap-6">
        <LoadingPanel label="Loading user activity…" />
      </div>
    )
  }

  if (detail.isError || !d) {
    return (
      <div className="grid gap-6">
        <Button type="button" variant="ghost" className="w-fit" onClick={() => navigate('/activity')}>
          <ArrowLeft className="size-4" /> Back to activity
        </Button>
        <ErrorState message="Could not load this user's activity." onRetry={() => void detail.refetch()} />
      </div>
    )
  }

  const displayAi = aiLoaded ? aiTurns : (d.recentAi ?? [])

  return (
    <div className="grid min-w-0 gap-6 pb-10">
      <div className="flex min-w-0 flex-col gap-4">
        <Link to="/activity" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> User Activity
        </Link>
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          <Avatar name={d.user.name} avatar={d.user.avatar} className="size-12 text-lg sm:size-14 sm:text-xl" />
          <div className="min-w-0 flex-1">
            <h1 className="flex flex-wrap items-center gap-2 text-xl font-semibold tracking-tight sm:text-2xl">
              <span className="min-w-0 break-words">{d.user.name || 'Unnamed user'}</span>
              {d.user.plan === 'premium' ? <Crown className="size-5 shrink-0 text-warning" /> : null}
            </h1>
            <p className="mt-1 truncate text-sm text-muted-foreground">{d.user.phone || d.user.email || d.user.id}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {d.user.deleted ? <Badge tone="danger">deleted account</Badge> : null}
              <Badge tone={d.user.plan === 'premium' ? 'warning' : 'neutral'}>{d.user.plan}</Badge>
              {d.summary.online ? <Badge tone="success">online now</Badge> : <Badge>offline · {relativeTime(d.summary.lastSeen)}</Badge>}
              {(d.summary.errorEvents ?? 0) > 0 ? <Badge tone="danger">{d.summary.errorEvents} errors</Badge> : null}
              {(d.ai?.turns ?? 0) > 0 ? <Badge tone="accent">{d.ai?.turns} AI turns</Badge> : null}
            </div>
          </div>
        </div>
      </div>

      <div className="admin-scroll-x flex gap-2 rounded-xl border border-border bg-muted/20 p-2">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => (key === 'ai' ? openAiTab() : setTab(key))}
            className={cn(
              'shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition-all sm:px-4',
              tab === key ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:bg-card/60 hover:text-foreground',
            )}
          >
            {TAB_LABELS[key]}
            {key === 'issues' && (d.errors?.length ?? 0) > 0 ? (
              <span className="ml-2 rounded-full bg-destructive/15 px-1.5 py-0.5 text-[10px] text-destructive">{d.errors?.length}</span>
            ) : null}
          </button>
        ))}
      </div>

      {tab === 'overview' ? (
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="grid gap-4 lg:col-span-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: 'Events', value: d.summary.events },
                { label: 'Sessions', value: d.summary.sessions },
                { label: 'AI turns', value: d.ai?.turns ?? 0 },
                { label: 'Errors', value: d.summary.errorEvents ?? 0 },
              ].map((chip) => (
                <div key={chip.label} className="rounded-xl border border-border bg-card p-4 shadow-sm">
                  <p className="text-xs text-muted-foreground">{chip.label}</p>
                  <p className="mt-1 text-2xl font-semibold">{chip.value.toLocaleString('en-IN')}</p>
                </div>
              ))}
            </div>

            {d.perDay?.length ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Activity · last 14 days</h2>
                <div className="mt-3 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.perDay}>
                      <defs>
                        <linearGradient id="uaDetailFill" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.35} />
                          <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="hsl(var(--border))" strokeDasharray="3 3" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }} />
                      <Area dataKey="count" stroke="hsl(var(--primary))" fill="url(#uaDetailFill)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : null}

            {d.recentAi?.length ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-sm font-semibold"><Bot className="size-4 text-primary" /> Recent AI questions</h2>
                  <Button type="button" variant="ghost" size="sm" onClick={openAiTab}>View all</Button>
                </div>
                <div className="mt-3 grid gap-2">
                  {d.recentAi.map((turn) => (
                    <div key={turn.id} className="rounded-lg border border-border bg-background p-3 text-sm">
                      <p className="line-clamp-2 font-medium">{turn.question}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{relativeTime(turn.createdAt)} · {turn.error ? 'failed' : 'answered'}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>

          <div className="grid gap-4">
            {d.devices?.length ? (
              <div className="rounded-xl border border-border bg-card p-4">
                <h2 className="text-sm font-semibold">Devices</h2>
                <div className="mt-3 grid gap-2">
                  {d.devices.slice(0, 5).map((device) => (
                    <div key={device.deviceId} className="flex gap-2 rounded-lg border border-border p-2.5 text-xs">
                      <Smartphone className="mt-0.5 size-4 shrink-0 text-primary" />
                      <div>
                        <p className="font-medium">{device.device || device.deviceId}</p>
                        <p className="text-muted-foreground">{device.platform} · {relativeTime(device.lastSeen)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
            {d.user.place ? (
              <div className="rounded-xl border border-border bg-card p-4 text-sm">
                <p className="flex items-center gap-1 text-muted-foreground"><MapPin className="size-4" /> Profile place</p>
                <p className="mt-1 font-medium">{d.user.place}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'ai' ? (
        <div className="grid gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 sm:max-w-md">
              <MessageSquare className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search questions or answers…"
                value={aiSearch}
                onChange={(e) => setAiSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && void loadAiChat(true)}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadAiChat(true)} disabled={aiLoading}>Search</Button>
          </div>
          <div className="grid gap-3">
            {displayAi.length === 0 && !aiLoading ? (
              <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No AI chat history for this user yet.</p>
            ) : null}
            {displayAi.map((turn, i) => (
              <AiTurnCard key={turn.id} turn={turn} index={i} />
            ))}
          </div>
          {aiHasMore ? (
            <Button type="button" variant="secondary" className="mx-auto w-full max-w-xs" disabled={aiLoading} onClick={() => void loadAiChat(false)}>
              {aiLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              {aiLoading ? 'Loading…' : 'Load older chat'}
            </Button>
          ) : null}
        </div>
      ) : null}

      {tab === 'issues' ? (
        <div className="grid gap-3">
          {(d.errors ?? []).length === 0 ? (
            <p className="rounded-xl border border-dashed border-border py-12 text-center text-sm text-muted-foreground">No errors recorded for this user.</p>
          ) : null}
          {(d.errors ?? []).map((ev, i) => (
            <div
              key={ev._id}
              className="activity-stagger flex gap-3 rounded-xl border border-destructive/25 bg-destructive/5 p-4"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-destructive/15 text-destructive">
                <EventIcon name={ev.name} className="size-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-destructive">{issueLabel(ev.name)}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(ev.createdAt)}</p>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{ev.screen || ev.platform || '—'}</p>
                {propsSummary(ev.props) ? (
                  <p className="mt-2 rounded-md bg-background/80 px-2 py-1 font-mono text-[11px] text-muted-foreground">{propsSummary(ev.props)}</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'timeline' ? (
        <div className="grid gap-2">
          {timeline.map((event, i) => (
            <div
              key={event._id}
              className="activity-stagger flex gap-3 rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/30"
              style={{ animationDelay: `${Math.min(i, 12) * 35}ms` }}
            >
              <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                <EventIcon name={event.name} className="size-4" />
              </div>
              <div className="min-w-0 flex-1 text-sm">
                <div className="flex justify-between gap-2">
                  <p className="font-medium">{event.name}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">{relativeTime(event.createdAt)}</span>
                </div>
                <p className="text-xs text-muted-foreground">{event.screen || '—'}</p>
                {propsSummary(event.props) ? <p className="mt-1 truncate font-mono text-[10px] text-muted-foreground">{propsSummary(event.props)}</p> : null}
              </div>
            </div>
          ))}
          {timeline.length > 0 && !timelineExhausted ? (
            <Button type="button" variant="secondary" disabled={timelineLoading} onClick={() => void loadMoreTimeline()}>
              {timelineLoading ? <Loader2 className="size-4 animate-spin" /> : null}
              Load more events
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
