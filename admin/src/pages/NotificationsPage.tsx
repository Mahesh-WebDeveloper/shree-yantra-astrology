import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Calendar,
  Clock,
  Filter,
  Loader2,
  Search,
  Send,
  Trash2,
  Users,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { useNotifications } from '@/api/queries'
import type { NotificationItem } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingPanel } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  AUDIENCE_OPTIONS,
  SENT_FILTERS,
  TYPE_OPTIONS,
  audienceLabel,
  emptyNotification,
  readCount,
  statusMeta,
  typeMeta,
  type DraftNotification,
  type NotificationAudience,
  type NotificationType,
  type SentFilter,
} from '@/lib/notificationsPage'
import { cn, formatDateTime } from '@/lib/utils'

function PushPreview({ draft }: { draft: DraftNotification }) {
  const meta = typeMeta(draft.type || 'promo')
  const Icon = meta.icon
  const title = draft.translations?.en.title || draft.title || 'Notification title'
  const body = draft.translations?.en.body || draft.body || 'Your message preview appears here…'

  return (
    <div className="mx-auto w-full max-w-[260px]">
      <div className="overflow-hidden rounded-[1.75rem] border-4 border-foreground/10 bg-gradient-to-b from-muted/50 to-card shadow-xl">
        <div className="bg-primary/90 px-4 py-2 text-center text-[10px] font-medium text-primary-foreground">Shree Yantra · now</div>
        <div className="p-4">
          <div className="flex gap-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
            <div className={cn('grid size-10 shrink-0 place-items-center rounded-xl', meta.tone)}>
              <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{title}</p>
              <p className="mt-0.5 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{body}</p>
            </div>
          </div>
          <p className="mt-3 text-center text-[10px] text-muted-foreground">Push & in-app preview</p>
        </div>
      </div>
    </div>
  )
}

function NotificationCard({
  notification,
  index,
  onSend,
  onDelete,
  sending,
}: {
  notification: NotificationItem
  index: number
  onSend: () => void
  onDelete: () => void
  sending: boolean
}) {
  const meta = typeMeta(notification.type)
  const Icon = meta.icon
  const status = statusMeta(notification)
  const reads = readCount(notification)

  return (
    <article
      className="activity-stagger group rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/30 hover:shadow-md sm:p-5"
      style={{ animationDelay: `${index * 45}ms` }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-1 gap-3">
          <div className={cn('grid size-11 shrink-0 place-items-center rounded-xl', meta.tone)}>
            <Icon className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold leading-snug">{notification.title}</h3>
              <Badge tone={status.tone}>{status.label}</Badge>
              <Badge tone="neutral">{audienceLabel(notification.audience)}</Badge>
              <Badge tone="accent">{meta.label}</Badge>
            </div>
            <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{notification.body}</p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Clock className="size-3" />{status.sub}</span>
              {reads > 0 ? <span className="inline-flex items-center gap-1"><Users className="size-3" />{reads} read</span> : null}
              {notification.scheduledAt && !notification.sentAt ? (
                <span className="inline-flex items-center gap-1"><Calendar className="size-3" />Scheduled {formatDateTime(notification.scheduledAt)}</span>
              ) : null}
              {notification.targetUserId ? <span>User: {notification.targetUserId.slice(-8)}</span> : null}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 gap-2 sm:flex-col">
          {!notification.sentAt ? (
            <Button type="button" variant="secondary" size="sm" disabled={sending} onClick={onSend}>
              {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Send now
            </Button>
          ) : null}
          <Button type="button" variant="ghost" size="icon" onClick={onDelete} aria-label="Delete">
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>
    </article>
  )
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<NotificationType | ''>('')
  const [audienceFilter, setAudienceFilter] = useState<NotificationAudience | ''>('')
  const [sentFilter, setSentFilter] = useState<SentFilter>('')
  const [draft, setDraft] = useState<DraftNotification>({ ...emptyNotification })
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null)
  const [sendingId, setSendingId] = useState<string | null>(null)

  const params = useMemo(
    () => ({
      page,
      limit: 10,
      search: search || undefined,
      type: typeFilter || undefined,
      audience: audienceFilter || undefined,
      sent: sentFilter || undefined,
    }),
    [page, search, typeFilter, audienceFilter, sentFilter],
  )

  const notifications = useNotifications(params)
  const queryClient = useQueryClient()
  const toast = useToast()

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [searchInput])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['notifications'] })

  const createMutation = useMutation({
    mutationFn: endpoints.createNotification,
    onSuccess: (notification) => {
      setDraft({ ...emptyNotification })
      invalidate()
      toast.success(draft.sendNow ? 'Notification sent to users' : 'Draft saved')
      if (draft.sendNow && notification.sentAt) {
        // noop — success already shown
      }
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const sendMutation = useMutation({
    mutationFn: endpoints.sendNotification,
    onSuccess: () => {
      setSendingId(null)
      invalidate()
      toast.success('Notification sent')
    },
    onError: (error) => {
      setSendingId(null)
      toast.error(apiErrorMessage(error))
    },
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteNotification,
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
      toast.success('Notification deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const rows = notifications.data?.notifications ?? []
  const pagination = notifications.data?.pagination
  const sentOnPage = rows.filter((n) => n.sentAt).length
  const draftsOnPage = rows.filter((n) => !n.sentAt).length

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    const title = draft.translations?.en.title?.trim() || draft.title?.trim()
    const body = draft.translations?.en.body?.trim() || draft.body?.trim()
    if (!title || !body) {
      toast.error('English title and body are required')
      return
    }
    createMutation.mutate({
      ...draft,
      title,
      body,
      translations: draft.translations,
      scheduledAt: draft.sendNow ? undefined : draft.scheduledAt,
    })
  }

  return (
    <div className="grid gap-6 pb-10">
      <PageHeader
        title="Notifications"
        description="Send push & in-app messages — predictions, offers, or account updates — to all users or a specific audience."
        action={
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
            <Bell className="size-3.5" />
            Push + in-app inbox
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Total matching', value: pagination?.total ?? 0, icon: Bell, tone: 'text-primary' },
          { label: 'Sent (this page)', value: sentOnPage, icon: Send, tone: 'text-success' },
          { label: 'Drafts (this page)', value: draftsOnPage, icon: Clock, tone: 'text-accent' },
        ].map((stat, i) => (
          <div key={stat.label} className="activity-stagger rounded-xl border border-border bg-card p-4 shadow-sm" style={{ animationDelay: `${i * 50}ms` }}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{stat.label}</span>
              <stat.icon className={cn('size-5', stat.tone)} />
            </div>
            <p className="mt-2 text-2xl font-semibold">{Number(stat.value).toLocaleString('en-IN')}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,400px)_minmax(0,1fr)]">
        <div className="grid gap-4 xl:sticky xl:top-4 xl:self-start">
          <form className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5" onSubmit={handleSubmit}>
            <div className="mb-4 flex items-center justify-between gap-3 border-b border-border pb-4">
              <div>
                <h2 className="text-base font-semibold">Compose</h2>
                <p className="text-xs text-muted-foreground">English + Hindi · sends push when enabled</p>
              </div>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {draft.sendNow ? 'Send' : 'Save'}
              </Button>
            </div>

            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Category</p>
                <div className="grid grid-cols-3 gap-2">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon
                    const active = draft.type === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setDraft({ ...draft, type: opt.value })}
                        className={cn(
                          'rounded-xl border p-2.5 text-left transition-all',
                          active ? 'border-primary bg-primary/10 ring-1 ring-primary/30' : 'border-border hover:border-primary/35',
                        )}
                      >
                        <Icon className={cn('size-4', active ? 'text-primary' : 'text-muted-foreground')} />
                        <p className="mt-1 text-xs font-semibold">{opt.label}</p>
                      </button>
                    )
                  })}
                </div>
              </div>

              <BilingualFields
                value={draft.translations}
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'body', label: 'Message', multiline: true },
                ]}
                onChange={(translations) => setDraft({
                  ...draft,
                  translations,
                  title: translations.en.title || '',
                  body: translations.en.body || '',
                })}
              />

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Audience</p>
                <div className="flex flex-wrap gap-2">
                  {AUDIENCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setDraft({ ...draft, audience: opt.value })}
                      className={cn(
                        'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                        draft.audience === opt.value
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border text-muted-foreground hover:border-primary/40',
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <p className="mt-1.5 text-[11px] text-muted-foreground">
                  {AUDIENCE_OPTIONS.find((a) => a.value === draft.audience)?.desc}
                </p>
              </div>

              {draft.audience === 'user' ? (
                <Field label="Target user ID">
                  <Input
                    value={draft.targetUserId || ''}
                    onChange={(event) => setDraft({ ...draft, targetUserId: event.target.value })}
                    placeholder="MongoDB user _id"
                    required
                  />
                </Field>
              ) : null}

              <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="text-sm font-medium">Send immediately</p>
                  <p className="text-xs text-muted-foreground">Push to devices + show in app inbox</p>
                </div>
                <Switch
                  checked={!!draft.sendNow}
                  onCheckedChange={(checked) => setDraft({ ...draft, sendNow: checked })}
                />
              </div>

              {!draft.sendNow ? (
                <Field label="Schedule for later">
                  <Input
                    type="datetime-local"
                    value={draft.scheduledAt || ''}
                    onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })}
                  />
                </Field>
              ) : null}
            </div>
          </form>

          <div className="hidden rounded-xl border border-border bg-card p-4 lg:block">
            <p className="mb-3 text-center text-xs font-medium text-muted-foreground">Live preview</p>
            <PushPreview draft={draft} />
          </div>
        </div>

        <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <div className="mb-4 flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-base font-semibold">History</h2>
              {pagination ? <Badge tone="neutral">{pagination.total} total</Badge> : null}
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search title or message…" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            </div>

            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-muted/20 p-2">
              <Filter className="size-4 shrink-0 text-muted-foreground" />
              {SENT_FILTERS.map((f) => (
                <button
                  key={f.value || 'all'}
                  type="button"
                  onClick={() => { setSentFilter(f.value); setPage(1) }}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-all',
                    sentFilter === f.value ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  {f.label}
                </button>
              ))}
              <span className="mx-1 hidden h-4 w-px bg-border sm:inline" />
              <Select className="w-auto min-w-[7.5rem]" value={typeFilter} onChange={(e) => { setTypeFilter(e.target.value as NotificationType | ''); setPage(1) }}>
                <option value="">All types</option>
                {TYPE_OPTIONS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </Select>
              <Select className="w-auto min-w-[7.5rem]" value={audienceFilter} onChange={(e) => { setAudienceFilter(e.target.value as NotificationAudience | ''); setPage(1) }}>
                <option value="">All audiences</option>
                {AUDIENCE_OPTIONS.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </div>
          </div>

          {notifications.isLoading ? <LoadingPanel label="Loading notifications…" /> : null}
          {notifications.isError ? <ErrorState message="Could not load notifications." onRetry={() => void notifications.refetch()} /> : null}
          {notifications.data && rows.length === 0 ? (
            <EmptyState title={search || typeFilter || audienceFilter || sentFilter ? 'No notifications match these filters.' : 'No notifications yet.'} />
          ) : null}

          <div className="grid gap-3">
            {rows.map((notification, i) => (
              <NotificationCard
                key={notification._id}
                notification={notification}
                index={i}
                sending={sendingId === notification._id}
                onSend={() => {
                  setSendingId(notification._id)
                  sendMutation.mutate(notification._id)
                }}
                onDelete={() => setDeleteTarget(notification)}
              />
            ))}
          </div>

          {pagination && pagination.pages > 1 ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <span>Page {pagination.page} of {pagination.pages}</span>
              <div className="flex gap-2">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
                <Button type="button" variant="secondary" disabled={page >= pagination.pages} onClick={() => setPage((p) => p + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete notification"
        description={`Delete "${deleteTarget?.title || 'this notification'}"? This cannot be undone.`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
