import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  LayoutDashboard,
  Monitor,
  Save,
  Search,
  Smartphone,
  Terminal,
  Trash2,
  X,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import type { ObservabilityErrorGroup, ObservabilityLogRow } from '@/api/endpoints'
import {
  queryKeys,
  useObservabilityApiStats,
  useObservabilityError,
  useObservabilityErrors,
  useObservabilityLogs,
  useObservabilityOverview,
} from '@/api/queries'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'
import { cn, formatDateTime } from '@/lib/utils'

type Tab = 'overview' | 'errors' | 'api' | 'logs'
type ClientSource = 'mobile' | 'website' | 'admin' | 'server' | 'unknown'
type SourceFilter = 'all' | ClientSource

function inferClientSource(row: ObservabilityLogRow): ClientSource {
  if (row.client_source) return row.client_source
  const platform = String(row.platform || '').toLowerCase()
  const route = String(row.route || '')
  const requestId = String(row.request_id || '')
  if (platform === 'admin') return 'admin'
  if (platform === 'web') return 'website'
  if (platform === 'ios' || platform === 'android') return 'mobile'
  if (requestId.startsWith('m-')) return 'mobile'
  if (requestId.startsWith('w-')) return 'website'
  if (/\/admin(\/|$)/i.test(route)) return 'admin'
  if (!platform && !requestId.startsWith('m-') && !requestId.startsWith('w-') && !/\/admin(\/|$)/i.test(route)) return 'server'
  return 'unknown'
}

const SOURCE_META: Record<ClientSource, { label: string; tone: 'accent' | 'success' | 'warning' | 'neutral' | 'danger'; border: string; Icon: typeof Smartphone }> = {
  mobile: { label: 'Mobile App', tone: 'accent', border: 'border-l-sky-500', Icon: Smartphone },
  website: { label: 'Website', tone: 'success', border: 'border-l-emerald-500', Icon: Globe },
  admin: { label: 'Admin Panel', tone: 'warning', border: 'border-l-amber-500', Icon: LayoutDashboard },
  server: { label: 'Server / Other', tone: 'neutral', border: 'border-l-zinc-500', Icon: Monitor },
  unknown: { label: 'Unknown', tone: 'neutral', border: 'border-l-border', Icon: Monitor },
}

function ClientSourceBadge({ source, platform }: { source: ClientSource; platform?: string }) {
  const meta = SOURCE_META[source]
  const Icon = meta.Icon
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide', {
      'bg-sky-500/15 text-sky-400': source === 'mobile',
      'bg-emerald-500/15 text-emerald-400': source === 'website',
      'bg-amber-500/15 text-amber-400': source === 'admin',
      'bg-muted text-muted-foreground': source === 'server' || source === 'unknown',
    })}>
      <Icon className="size-3" />
      {meta.label}
      {platform && source === 'mobile' ? <span className="normal-case opacity-80">({platform})</span> : null}
    </span>
  )
}

function Kpi({ label, value, sub, tone }: { label: string; value: string | number; sub?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={cn('mt-1 text-2xl font-semibold tabular-nums', tone)}>{value}</p>
      {sub ? <p className="mt-1 text-xs text-muted-foreground">{sub}</p> : null}
    </div>
  )
}

function copyText(text: string) {
  navigator.clipboard.writeText(text).catch(() => {})
}

function levelTone(level: string): 'neutral' | 'warning' | 'danger' | 'success' {
  if (level === 'error' || level === 'fatal') return 'danger'
  if (level === 'warn') return 'warning'
  if (level === 'debug') return 'neutral'
  return 'success'
}

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="min-w-0">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 break-all font-mono text-[11px] text-foreground">{value}</p>
    </div>
  )
}

function LogEntry({
  row,
  expanded,
  selected,
  onToggle,
  onSelect,
}: {
  row: ObservabilityLogRow
  expanded: boolean
  selected: boolean
  onToggle: () => void
  onSelect: () => void
}) {
  const source = inferClientSource(row)
  const sourceMeta = SOURCE_META[source]
  const trace = useQuery({
    queryKey: queryKeys.observabilityTrace(row.request_id || ''),
    queryFn: () => endpoints.observabilityTrace(row.request_id!),
    enabled: expanded && !!row.request_id,
    retry: 1,
  })

  return (
    <li className={cn('border-b border-border border-l-4 last:border-b-0', sourceMeta.border, selected && 'bg-primary/5')}>
      <div className="flex w-full items-start gap-2 px-3 py-2.5">
        <input
          type="checkbox"
          className="mt-1 size-4 shrink-0 cursor-pointer accent-primary"
          checked={selected}
          aria-label={`Select log ${row._id}`}
          onChange={(e) => {
            e.stopPropagation()
            onSelect()
          }}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          type="button"
          className="flex min-w-0 flex-1 items-start gap-2 text-left transition hover:opacity-90"
          onClick={onToggle}
        >
        <span className="mt-0.5 shrink-0 text-muted-foreground">
          {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </span>
        <div className="min-w-0 flex-1 font-mono text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <ClientSourceBadge source={source} platform={row.platform} />
            <span className="text-muted-foreground">{formatDateTime(row.timestamp)}</span>
            <Badge tone={levelTone(row.level)}>{row.level}</Badge>
            <span className="text-primary">{row.event_name}</span>
            {row.status_code != null ? (
              <span className={cn('tabular-nums', row.status_code >= 400 && 'text-destructive')}>{row.status_code}</span>
            ) : null}
            {row.duration_ms != null ? <span className="text-muted-foreground">{row.duration_ms}ms</span> : null}
          </div>
          <p className="mt-1 break-words text-foreground">{row.message}</p>
          {row.route ? (
            <p className="mt-1 text-muted-foreground">
              {row.method ? `${row.method} ` : ''}{row.route}
            </p>
          ) : null}
        </div>
        </button>
      </div>

      {expanded ? (
        <div className="border-t border-border bg-muted/20 px-3 py-3 font-mono text-xs">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DetailField label="Client source" value={SOURCE_META[source].label} />
            <DetailField label="Platform" value={row.platform} />
            <DetailField label="Log ID" value={row._id} />
            <DetailField label="Request ID" value={row.request_id} />
            <DetailField label="Trace ID" value={row.trace_id} />
            <DetailField label="Span ID" value={row.span_id} />
            <DetailField label="User ID" value={row.user_id} />
            <DetailField label="Session ID" value={row.session_id} />
            <DetailField label="Service" value={row.service} />
            <DetailField label="Environment" value={row.environment} />
            <DetailField label="Platform" value={row.platform} />
            <DetailField label="App version" value={row.app_version} />
            <DetailField label="OS version" value={row.os_version} />
            <DetailField label="Device" value={[row.device_brand, row.device_model].filter(Boolean).join(' ') || undefined} />
            <DetailField label="Error code" value={row.error_code} />
            <DetailField label="Error name" value={row.error_name} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {row.request_id ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => copyText(row.request_id!)}>
                <Copy className="mr-1 size-3" /> Copy Request ID
              </Button>
            ) : null}
            {row.trace_id ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => copyText(row.trace_id!)}>
                <Copy className="mr-1 size-3" /> Copy Trace ID
              </Button>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={() => copyText(JSON.stringify(row, null, 2))}>
              <Copy className="mr-1 size-3" /> Copy JSON
            </Button>
          </div>

          {row.stack ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-background">
              <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Stack trace</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-relaxed text-destructive">{row.stack}</pre>
            </div>
          ) : null}

          {row.metadata && Object.keys(row.metadata).length > 0 ? (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-background">
              <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Metadata</p>
              <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-relaxed text-muted-foreground">
                {JSON.stringify(row.metadata, null, 2)}
              </pre>
            </div>
          ) : null}

          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-background">
            <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">Full log JSON</p>
            <pre className="max-h-48 overflow-y-auto whitespace-pre-wrap break-words p-3 text-[11px] leading-relaxed text-muted-foreground">
              {JSON.stringify(row, null, 2)}
            </pre>
          </div>

          {row.request_id ? (
            trace.isLoading ? (
              <p className="mt-3 text-muted-foreground">Loading request timeline…</p>
            ) : trace.data?.timeline && trace.data.timeline.length > 1 ? (
              <div className="mt-3 rounded-lg border border-border bg-background">
                <p className="border-b border-border px-3 py-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                  Request timeline ({trace.data.timeline.length} events)
                </p>
                <ul className="max-h-56 divide-y divide-border overflow-y-auto">
                  {trace.data.timeline.map((item) => (
                    <li key={item._id} className="px-3 py-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-muted-foreground">{formatDateTime(item.timestamp)}</span>
                        <Badge tone={levelTone(item.level)}>{item.level}</Badge>
                        <span>{item.event_name}</span>
                      </div>
                      <p className="mt-1 break-words text-muted-foreground">{item.message}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null
          ) : null}
        </div>
      ) : null}
    </li>
  )
}

const ERROR_STATUSES = ['open', 'acknowledged', 'investigating', 'resolved'] as const

function ErrorDetailDrawer({ fingerprint, onClose }: { fingerprint: string; onClose: () => void }) {
  const detail = useObservabilityError(fingerprint)
  const queryClient = useQueryClient()
  const toast = useToast()
  const group = detail.data?.group
  const [status, setStatus] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [notes, setNotes] = useState('')

  useEffect(() => {
    if (group) {
      setStatus(group.status || 'open')
      setAssignedTo(group.assigned_to || '')
      setNotes(group.notes || '')
    }
  }, [group?.fingerprint, group?.status, group?.assigned_to, group?.notes])

  const saveMutation = useMutation({
    mutationFn: () => endpoints.updateObservabilityError(fingerprint, {
      status: status || undefined,
      assigned_to: assignedTo,
      notes,
    }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['observability-errors'] })
      void queryClient.invalidateQueries({ queryKey: queryKeys.observabilityError(fingerprint) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.observabilityOverview })
      toast.success('Incident updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 p-0 sm:p-4" onClick={onClose}>
      <div
        className="flex h-full w-full max-w-xl flex-col overflow-hidden bg-card shadow-2xl sm:rounded-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-border p-4">
          <div className="min-w-0">
            <h2 className="font-semibold leading-snug">{group?.title || 'Error group'}</h2>
            <p className="mt-1 font-mono text-xs text-muted-foreground">{fingerprint.slice(0, 16)}…</p>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose} aria-label="Close"><X className="size-4" /></Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {detail.isLoading ? <LoadingPanel label="Loading error details…" /> : null}
          {detail.isError ? <ErrorState message="Could not load error details." onRetry={() => detail.refetch()} /> : null}
          {group ? (
            <div className="space-y-4">
              <div className="grid gap-2 sm:grid-cols-2">
                <DetailField label="Route" value={group.route} />
                <DetailField label="Severity" value={group.severity} />
                <DetailField label="Occurrences" value={group.occurrence_count} />
                <DetailField label="Affected users" value={group.affected_users} />
                <DetailField label="First seen" value={formatDateTime(group.first_seen)} />
                <DetailField label="Last seen" value={formatDateTime(group.last_seen)} />
              </div>
              {group.stack_sample ? (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Stack sample</p>
                  <pre className="mt-1 max-h-40 overflow-auto rounded-md border border-border bg-muted/30 p-2 text-[10px] leading-relaxed">{group.stack_sample}</pre>
                </div>
              ) : null}
              <div className="grid gap-3 rounded-lg border border-border p-3">
                <h3 className="text-sm font-semibold">Incident workflow</h3>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Status</label>
                  <select className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}>
                    {ERROR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Assignee</label>
                  <input className="h-9 rounded-md border border-border bg-background px-2 text-sm" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} placeholder="Admin name or email" />
                </div>
                <div className="grid gap-2">
                  <label className="text-xs font-medium text-muted-foreground">Notes</label>
                  <textarea className="min-h-24 rounded-md border border-border bg-background px-2 py-2 text-sm" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Investigation notes, root cause, fix deployed…" />
                </div>
                <Button type="button" disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                  <Save className="mr-1 size-4" /> {saveMutation.isPending ? 'Saving…' : 'Save incident'}
                </Button>
              </div>
              {group.last_request_id ? (
                <Button type="button" variant="secondary" size="sm" onClick={() => copyText(group.last_request_id!)}>
                  <Copy className="mr-1 size-3" /> Copy last request ID
                </Button>
              ) : null}
              {detail.data?.recentLogs?.length ? (
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Recent logs ({detail.data.recentLogs.length})</h3>
                  <ul className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-2 text-xs">
                    {detail.data.recentLogs.map((log) => (
                      <li key={log._id} className="border-b border-border/50 pb-1 last:border-0">
                        <span className="text-muted-foreground">{formatDateTime(log.timestamp)}</span>
                        <span className="mx-1">·</span>
                        <span>{log.message?.slice(0, 120)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default function ObservabilityPage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [logQ, setLogQ] = useState('')
  const [traceId, setTraceId] = useState('')
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all')
  const [levelFilter, setLevelFilter] = useState('')
  const [routeFilter, setRouteFilter] = useState('')
  const [eventFilter, setEventFilter] = useState('')
  const [methodFilter, setMethodFilter] = useState('')
  const [errorsOnly, setErrorsOnly] = useState(false)
  const [sortBy, setSortBy] = useState('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [logPage, setLogPage] = useState(1)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null)
  const [selectedErrorFp, setSelectedErrorFp] = useState<string | null>(null)
  const [errorStatusFilter, setErrorStatusFilter] = useState('')

  const logParams = useMemo(
    () => ({
      page: logPage,
      limit: 50,
      q: logQ || undefined,
      source: sourceFilter !== 'all' ? sourceFilter : undefined,
      level: levelFilter || undefined,
      route: routeFilter || undefined,
      event: eventFilter || undefined,
      method: methodFilter || undefined,
      errors_only: errorsOnly ? 'true' : undefined,
      sort: sortBy,
      order: sortOrder,
    }),
    [logQ, sourceFilter, levelFilter, routeFilter, eventFilter, methodFilter, errorsOnly, sortBy, sortOrder, logPage],
  )
  const overview = useObservabilityOverview()
  const errors = useObservabilityErrors({ page: 1, limit: 25, status: errorStatusFilter || undefined })
  const apiStats = useObservabilityApiStats(24)
  const logs = useObservabilityLogs(logParams)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidateLogs = () => {
    void queryClient.invalidateQueries({ queryKey: ['observability-logs'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.observabilityOverview })
  }

  const deleteBulkMutation = useMutation({
    mutationFn: (ids: string[]) => endpoints.deleteBulkObservabilityLogs(ids),
    onSuccess: (data) => {
      setSelectedIds(new Set())
      setExpandedLogId(null)
      invalidateLogs()
      toast.success(`Deleted ${data.deleted} log${data.deleted === 1 ? '' : 's'}`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const handleDeleteSelected = () => {
    if (!selectedIds.size || deleteBulkMutation.isPending) return
    deleteBulkMutation.mutate([...selectedIds])
  }

  const visibleLogIds = useMemo(() => logs.data?.logs.map((l) => l._id) || [], [logs.data?.logs])
  const allVisibleSelected = visibleLogIds.length > 0 && visibleLogIds.every((id) => selectedIds.has(id))
  const someSelected = selectedIds.size > 0

  const resetLogFilters = () => {
    setLogPage(1)
    setExpandedLogId(null)
    setSelectedIds(new Set())
  }

  const toggleSelectAllVisible = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        visibleLogIds.forEach((id) => next.delete(id))
      } else {
        visibleLogIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const tabs: { id: Tab; label: string }[] = useMemo(
    () => [
      { id: 'overview', label: 'Overview' },
      { id: 'errors', label: 'Error Center' },
      { id: 'api', label: 'API Monitoring' },
      { id: 'logs', label: 'Live Logs' },
    ],
    [],
  )

  if (overview.isLoading && tab === 'overview') return <LoadingPanel label="Loading server logs…" />

  const o = overview.data

  return (
    <div className="space-y-6">
      <PageHeader
        title="Server Logs"
        description="Backend request logs, grouped errors, API latency, and system health. Admin-only."
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              to="/server-monitor"
              className="inline-flex h-8 items-center rounded-md border border-border bg-card px-2 text-xs font-medium hover:bg-muted"
            >
              Server Monitor
            </Link>
            <Link
              to="/activity"
              className="inline-flex h-8 items-center rounded-md border border-border bg-card px-2 text-xs font-medium hover:bg-muted"
            >
              User Activity
            </Link>
            <Link
              to="/analytics"
              className="inline-flex h-8 items-center rounded-md border border-border bg-card px-2 text-xs font-medium hover:bg-muted"
            >
              Analytics
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Button key={t.id} size="sm" variant={tab === t.id ? 'default' : 'secondary'} onClick={() => setTab(t.id)}>
            {t.label}
          </Button>
        ))}
      </div>

      {tab === 'overview' ? (
        overview.isError ? (
          <ErrorState message="Could not load server logs overview." onRetry={() => overview.refetch()} />
        ) : o ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Kpi label="Requests (1h)" value={o.requestsLastHour} />
          <Kpi label="5xx errors (1h)" value={o.errorsLastHour} tone={o.errorsLastHour ? 'text-destructive' : undefined} />
          <Kpi label="Slow requests (1h)" value={o.slowLastHour} tone={o.slowLastHour ? 'text-warning' : undefined} />
          <Kpi label="Error rate" value={`${o.errorRatePct}%`} sub={`${o.openErrorGroups} open groups`} />
          {o.host?.cpu?.usagePct != null ? (
            <Kpi label="CPU" value={`${Math.round(o.host.cpu.usagePct)}%`} sub="VPS" />
          ) : null}
          {o.host?.memory?.usagePct != null ? (
            <Kpi label="Memory" value={`${Math.round(o.host.memory.usagePct)}%`} sub="VPS" />
          ) : null}
        </div>
        ) : (
          <LoadingPanel label="Loading overview…" />
        )
      ) : null}

      {tab === 'errors' ? (
        <section className="rounded-xl border border-border bg-card shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <AlertTriangle className="size-4 text-destructive" /> Error Center
            </h2>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={errorStatusFilter}
              onChange={(e) => setErrorStatusFilter(e.target.value)}
              aria-label="Filter by status"
            >
              <option value="">All statuses</option>
              {ERROR_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          {errors.isLoading ? (
            <LoadingPanel label="Loading errors…" />
          ) : errors.isError ? (
            <ErrorState message="Could not load error groups." onRetry={() => errors.refetch()} />
          ) : (
            <div className="divide-y divide-border">
              {(errors.data?.items || []).map((g: ObservabilityErrorGroup) => (
                <button
                  key={g.fingerprint}
                  type="button"
                  className="flex w-full flex-col gap-2 px-4 py-3 text-left transition hover:bg-muted/30 sm:flex-row sm:items-center sm:justify-between"
                  onClick={() => setSelectedErrorFp(g.fingerprint)}
                >
                  <div>
                    <p className="font-medium">{g.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {g.route || 'unknown route'} · {g.occurrence_count} occurrences · {g.affected_users} users
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Last seen {new Date(g.last_seen).toLocaleString()} · {g.status}
                      {g.assigned_to ? ` · ${g.assigned_to}` : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={g.severity === 'high' || g.severity === 'critical' ? 'danger' : 'neutral'}>
                      {g.severity}
                    </Badge>
                    <Badge tone={g.status === 'resolved' ? 'success' : g.status === 'investigating' ? 'warning' : 'neutral'}>
                      {g.status}
                    </Badge>
                  </div>
                </button>
              ))}
              {!errors.data?.items?.length ? <p className="p-6 text-sm text-muted-foreground">No grouped errors yet.</p> : null}
            </div>
          )}
        </section>
      ) : null}

      {tab === 'api' ? (
        <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-4 py-3">
            <h2 className="flex items-center gap-2 font-semibold">
              <Activity className="size-4" /> API endpoints (24h)
            </h2>
          </div>
          {apiStats.isLoading ? (
            <LoadingPanel label="Loading API stats…" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-sm">
                <thead className="bg-muted/40 text-left text-xs uppercase text-muted-foreground">
                  <tr>
                    <th className="px-4 py-2">Endpoint</th>
                    <th className="px-4 py-2">Requests</th>
                    <th className="px-4 py-2">Error %</th>
                    <th className="px-4 py-2">Avg ms</th>
                    <th className="px-4 py-2">Max ms</th>
                  </tr>
                </thead>
                <tbody>
                  {(apiStats.data?.endpoints || []).map((row) => (
                    <tr key={`${row.method}-${row.route}`} className="border-t border-border">
                      <td className="px-4 py-2 font-mono text-xs">
                        {row.method} {row.route}
                      </td>
                      <td className="px-4 py-2 tabular-nums">{row.requests}</td>
                      <td className={cn('px-4 py-2 tabular-nums', row.errorPct > 5 && 'text-destructive')}>{row.errorPct}%</td>
                      <td className="px-4 py-2 tabular-nums">{row.avgMs}</td>
                      <td className="px-4 py-2 tabular-nums">{row.p95Ms}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {tab === 'logs' ? (
        <section className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-3 text-sm"
                placeholder="Search log message…"
                value={logQ}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  setLogQ(e.target.value)
                  resetLogFilters()
                }}
              />
            </div>
            <input
              className="h-10 min-w-[220px] flex-1 rounded-md border border-border bg-background px-3 font-mono text-xs"
              placeholder="Trace by request ID"
              value={traceId}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTraceId(e.target.value)}
            />
            <Button variant="secondary" disabled={!traceId.trim()} onClick={() => { setLogQ(traceId.trim()); resetLogFilters() }}>
              <Terminal className="mr-1 size-4" /> Find trace
            </Button>
            <Button
              variant="destructive"
              disabled={!someSelected || deleteBulkMutation.isPending}
              onClick={handleDeleteSelected}
            >
              <Trash2 className="mr-1 size-4" />
              {deleteBulkMutation.isPending ? 'Deleting…' : `Delete (${selectedIds.size})`}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">Source:</span>
            {([
              ['all', 'All'],
              ['mobile', 'Mobile App'],
              ['website', 'Website'],
              ['admin', 'Admin Panel'],
              ['server', 'Server / Other'],
            ] as const).map(([id, label]) => (
              <Button
                key={id}
                type="button"
                size="sm"
                variant={sourceFilter === id ? 'default' : 'secondary'}
                onClick={() => { setSourceFilter(id); resetLogFilters() }}
              >
                {label}
              </Button>
            ))}
            <select
              className="ml-auto h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={levelFilter}
              onChange={(e) => { setLevelFilter(e.target.value); resetLogFilters() }}
              aria-label="Filter by log level"
            >
              <option value="">All levels</option>
              <option value="debug">Debug</option>
              <option value="info">Info</option>
              <option value="warn">Warn</option>
              <option value="error">Error</option>
              <option value="fatal">Fatal</option>
            </select>
          </div>

          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
            <input
              className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs"
              placeholder="Filter route…"
              value={routeFilter}
              onChange={(e) => { setRouteFilter(e.target.value); resetLogFilters() }}
            />
            <input
              className="h-8 rounded-md border border-border bg-background px-2 font-mono text-xs"
              placeholder="Filter event…"
              value={eventFilter}
              onChange={(e) => { setEventFilter(e.target.value); resetLogFilters() }}
            />
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={methodFilter}
              onChange={(e) => { setMethodFilter(e.target.value); resetLogFilters() }}
              aria-label="Filter by HTTP method"
            >
              <option value="">All methods</option>
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); resetLogFilters() }}
              aria-label="Sort logs by"
            >
              <option value="timestamp">Sort: Time</option>
              <option value="duration">Sort: Duration</option>
              <option value="status">Sort: Status code</option>
              <option value="level">Sort: Level</option>
              <option value="route">Sort: Route</option>
              <option value="event">Sort: Event</option>
            </select>
            <select
              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
              value={sortOrder}
              onChange={(e) => { setSortOrder(e.target.value as 'asc' | 'desc'); resetLogFilters() }}
              aria-label="Sort order"
            >
              <option value="desc">Descending</option>
              <option value="asc">Ascending</option>
            </select>
            <label className="flex h-8 cursor-pointer items-center gap-2 rounded-md border border-border bg-background px-2 text-xs">
              <input
                type="checkbox"
                className="size-3.5 accent-primary"
                checked={errorsOnly}
                onChange={(e) => { setErrorsOnly(e.target.checked); resetLogFilters() }}
              />
              Errors only (4xx/5xx)
            </label>
          </div>

          <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-muted/30 px-3 py-2 text-[11px]">
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-1 rounded bg-sky-500" /> Mobile App</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-1 rounded bg-emerald-500" /> Website</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-1 rounded bg-amber-500" /> Admin Panel</span>
            <span className="flex items-center gap-1.5"><span className="inline-block h-3 w-1 rounded bg-zinc-500" /> Server / Other</span>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>
              {logs.data ? `Showing ${logs.data.logs.length} of ${logs.data.total} logs` : 'Loading…'}
              {logs.data?.pages ? ` · page ${logs.data.page}/${logs.data.pages}` : ''}
              {sourceFilter !== 'all' ? ` · ${SOURCE_META[sourceFilter].label}` : ''}
              {levelFilter ? ` · ${levelFilter}` : ''}
              {errorsOnly ? ' · errors only' : ''}
              {logQ ? ` · "${logQ}"` : ''}
              {someSelected ? ` · ${selectedIds.size} selected` : ''}
            </span>
            <span className="hidden sm:inline">Select logs → Delete button removes them instantly</span>
          </div>

          {logs.data?.logs.length ? (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/20 px-3 py-2">
              <label className="flex cursor-pointer items-center gap-2 text-xs font-medium">
                <input
                  type="checkbox"
                  className="size-4 accent-primary"
                  checked={allVisibleSelected}
                  onChange={toggleSelectAllVisible}
                />
                Select all on this page
              </label>
              {someSelected ? (
                <Button type="button" size="sm" variant="secondary" onClick={() => setSelectedIds(new Set())}>
                  Clear selection
                </Button>
              ) : null}
            </div>
          ) : null}

          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            {logs.isLoading ? (
              <LoadingPanel label="Loading logs…" />
            ) : logs.isError ? (
              <ErrorState message="Could not load logs." onRetry={() => logs.refetch()} />
            ) : !logs.data?.logs.length ? (
              <p className="p-6 text-sm text-muted-foreground">No logs found.</p>
            ) : (
              <ul className="max-h-[620px] overflow-y-auto">
                {logs.data.logs.map((row) => (
                  <LogEntry
                    key={row._id}
                    row={row}
                    expanded={expandedLogId === row._id}
                    selected={selectedIds.has(row._id)}
                    onToggle={() => setExpandedLogId((id) => (id === row._id ? null : row._id))}
                    onSelect={() => toggleSelectOne(row._id)}
                  />
                ))}
              </ul>
            )}
          </div>

          {logs.data && (logs.data.pages || 1) > 1 ? (
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">Page {logs.data.page} of {logs.data.pages}</span>
              <div className="flex gap-2">
                <Button type="button" size="sm" variant="secondary" disabled={logPage <= 1} onClick={() => { setLogPage((p) => p - 1); setSelectedIds(new Set()) }}>
                  Previous
                </Button>
                <Button type="button" size="sm" variant="secondary" disabled={logPage >= (logs.data.pages || 1)} onClick={() => { setLogPage((p) => p + 1); setSelectedIds(new Set()) }}>
                  Next
                </Button>
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Mobile/web client errors continue to flow through <Link className="underline" to="/activity">User Activity → Issues</Link>.
        Backend 5xx groups appear here after the structured logging middleware is active.
      </p>

      {selectedErrorFp ? (
        <ErrorDetailDrawer fingerprint={selectedErrorFp} onClose={() => setSelectedErrorFp(null)} />
      ) : null}
    </div>
  )
}
