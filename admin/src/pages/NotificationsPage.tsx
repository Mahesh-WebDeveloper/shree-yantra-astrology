import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Send, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useNotifications } from '@/api/queries'
import type { NotificationItem } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'

type DraftNotification = Partial<NotificationItem> & { sendNow?: boolean }

const emptyNotification: DraftNotification = {
  title: '',
  body: '',
  translations: { en: { title: '', body: '' }, hi: { title: '', body: '' } },
  type: 'promo',
  audience: 'all',
  targetUserId: '',
  sendNow: true,
}

export default function NotificationsPage() {
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<DraftNotification>({ ...emptyNotification })
  const [deleteTarget, setDeleteTarget] = useState<NotificationItem | null>(null)
  const params = useMemo(() => ({ page, limit: 12 }), [page])
  const notifications = useNotifications(params)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.notifications(params) })

  const createMutation = useMutation({
    mutationFn: endpoints.createNotification,
    onSuccess: () => {
      setDraft({ ...emptyNotification })
      invalidate()
      toast.success('Notification saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const sendMutation = useMutation({
    mutationFn: endpoints.sendNotification,
    onSuccess: () => {
      invalidate()
      toast.success('Notification sent')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
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

  return (
    <div className="grid gap-6">
      <PageHeader title="Notifications" description="Create in-app notifications and publish them to selected audiences." />
      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <form
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault()
            createMutation.mutate(draft)
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">Compose</h2>
            <Button type="submit" disabled={createMutation.isPending}><Send className="size-4" />Save</Button>
          </div>
          <div className="grid gap-4">
            <BilingualFields
              value={draft.translations}
              fields={[
                { key: 'title', label: 'Title' },
                { key: 'body', label: 'Body', multiline: true },
              ]}
              onChange={(translations) => setDraft({
                ...draft,
                translations,
                title: translations.en.title || draft.title,
                body: translations.en.body || draft.body,
              })}
            />
            <Field label="Title">
              <Input value={draft.title || ''} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </Field>
            <Field label="Body">
              <Textarea value={draft.body || ''} onChange={(event) => setDraft({ ...draft, body: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Type">
                <Select value={draft.type} onChange={(event) => setDraft({ ...draft, type: event.target.value as NotificationItem['type'] })}>
                  <option value="promo">Promo</option>
                  <option value="account">Account</option>
                  <option value="prediction">Prediction</option>
                </Select>
              </Field>
              <Field label="Audience">
                <Select value={draft.audience} onChange={(event) => setDraft({ ...draft, audience: event.target.value as NotificationItem['audience'] })}>
                  <option value="all">All</option>
                  <option value="premium">Premium</option>
                  <option value="free">Free</option>
                  <option value="user">Specific user</option>
                </Select>
              </Field>
            </div>
            {draft.audience === 'user' ? (
              <Field label="Target user id">
                <Input value={draft.targetUserId || ''} onChange={(event) => setDraft({ ...draft, targetUserId: event.target.value })} />
              </Field>
            ) : null}
            <Field label="Scheduled at">
              <Input type="datetime-local" value={draft.scheduledAt || ''} onChange={(event) => setDraft({ ...draft, scheduledAt: event.target.value })} />
            </Field>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm font-medium">Send now</span>
              <Switch checked={!!draft.sendNow} onCheckedChange={(checked) => setDraft({ ...draft, sendNow: checked })} />
            </div>
          </div>
        </form>

        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          {notifications.isLoading ? <LoadingRows /> : null}
          {notifications.isError ? <ErrorState message="Could not load notifications." onRetry={() => void notifications.refetch()} /> : null}
          {notifications.data && notifications.data.notifications.length === 0 ? <EmptyState title="No notifications yet." /> : null}
          <div className="grid gap-3">
            {notifications.data?.notifications.map((notification) => (
              <div key={notification._id} className="rounded-md border border-border bg-background p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{notification.title}</h3>
                      <Badge tone={notification.sentAt ? 'success' : 'neutral'}>{notification.sentAt ? 'sent' : 'draft'}</Badge>
                      <Badge>{notification.audience}</Badge>
                      <Badge tone="accent">{notification.type}</Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">{notification.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">Sent: {formatDateTime(notification.sentAt)}</p>
                  </div>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2 sm:flex">
                    {!notification.sentAt ? (
                      <Button type="button" variant="secondary" size="sm" onClick={() => sendMutation.mutate(notification._id)}>
                        <Send className="size-4" />
                        Send
                      </Button>
                    ) : null}
                    <Button type="button" variant="destructive" size="icon" onClick={() => setDeleteTarget(notification)} aria-label="Delete notification">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {notifications.data ? (
            <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span>Page {notifications.data.pagination.page} of {notifications.data.pagination.pages}</span>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button type="button" variant="secondary" disabled={page >= notifications.data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete notification"
        description={`Delete ${deleteTarget?.title || 'this notification'}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
