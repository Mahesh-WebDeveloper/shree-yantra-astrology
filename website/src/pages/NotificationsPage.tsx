import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FeaturePageShell } from '@/components/feature/FeaturePageShell'
import { RequireAuth } from '@/components/auth/RequireAuth'
import { GoldButton } from '@/components/ui/GoldButton'
import { ErrorState } from '@/components/ui/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import {
  clearAllNotifications,
  deleteNotification,
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/lib/api'
import { useLang } from '@/i18n/LangProvider'

export function NotificationsPage() {
  const { hi } = useLang()
  const qc = useQueryClient()
  const q = useQuery({ queryKey: ['notifications'], queryFn: getNotifications, staleTime: 30_000 })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] })

  const markAll = useMutation({ mutationFn: markAllNotificationsRead, onSuccess: invalidate })
  const clearAll = useMutation({ mutationFn: clearAllNotifications, onSuccess: invalidate })
  const markOne = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: invalidate,
  })
  const delOne = useMutation({
    mutationFn: (id: string) => deleteNotification(id),
    onSuccess: invalidate,
  })

  return (
    <FeaturePageShell route="/profile" titleEn="Notifications" titleHi="सूचनाएँ">
      <RequireAuth>
        <div className="mb-4 flex flex-wrap gap-2">
          <GoldButton type="button" className="!px-3 !py-1.5 text-xs" disabled={markAll.isPending} onClick={() => markAll.mutate()}>
            {hi ? 'सभी पढ़ी' : 'Mark all read'}
          </GoldButton>
          <button
            type="button"
            className="sy-btn-secondary rounded-full px-3 py-1.5 text-xs font-semibold"
            disabled={clearAll.isPending}
            onClick={() => clearAll.mutate()}
          >
            {hi ? 'सभी हटाएँ' : 'Clear all'}
          </button>
          {q.data?.unreadCount ? (
            <span className="self-center text-xs text-[var(--sy-accent)]">
              {q.data.unreadCount} {hi ? 'अपठित' : 'unread'}
            </span>
          ) : null}
        </div>
        {q.isLoading ? <Skeleton className="h-40 rounded-2xl" /> : null}
        {q.isError ? <ErrorState message={hi ? 'सूचनाएँ नहीं मिलीं' : 'Could not load'} onRetry={() => q.refetch()} /> : null}
        {!q.isLoading && !q.data?.notifications?.length ? (
          <p className="sy-stat-tile text-center text-sm text-[var(--sy-text-muted)]">
            {hi ? 'कोई सूचना नहीं' : 'No notifications yet'}
          </p>
        ) : null}
        <ul className="space-y-2">
          {q.data?.notifications.map((n) => (
            <li key={n._id} className={`sy-stat-tile ${n.read ? 'opacity-70' : 'border-[var(--sy-accent)]/50'}`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold">{n.title}</p>
                  <p className="mt-1 text-sm text-[var(--sy-text-soft)]">{n.body}</p>
                  <p className="mt-2 text-[10px] text-[var(--sy-text-muted)]">
                    {n.sentAt || n.createdAt} · {n.type}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  {!n.read ? (
                    <button type="button" className="text-xs text-[var(--sy-accent)]" onClick={() => markOne.mutate(n._id)}>
                      {hi ? 'पढ़ी' : 'Read'}
                    </button>
                  ) : null}
                  <button type="button" className="text-xs text-red-600" onClick={() => delOne.mutate(n._id)}>
                    {hi ? 'हटाएँ' : 'Delete'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </RequireAuth>
    </FeaturePageShell>
  )
}
