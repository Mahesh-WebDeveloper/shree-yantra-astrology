import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useAiCache } from '@/api/queries'
import type { AiCacheItem } from '@/api/types'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { formatDateTime } from '@/lib/utils'

export default function AiCachePage() {
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<AiCacheItem | null>(null)
  const [bulkTarget, setBulkTarget] = useState<'type' | 'all' | null>(null)
  const params = useMemo(() => ({ page, limit: 12, search: search || undefined, type: type || undefined }), [page, search, type])
  const cache = useAiCache(params)
  const ops = useQuery({ queryKey: ['ai-ops'], queryFn: endpoints.aiOps, staleTime: 30_000 })
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['ai-cache'] })
    void queryClient.invalidateQueries({ queryKey: ['ai-ops'] })
    void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
  }

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteAiCache,
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
      toast.success('Cache item cleared')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const bulkMutation = useMutation({
    mutationFn: endpoints.bulkDeleteAiCache,
    onSuccess: (data) => {
      setBulkTarget(null)
      invalidate()
      toast.success(`Cleared ${data.deleted} cache entries`)
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="grid min-w-0 gap-6">
      <PageHeader
        title="AI Cache"
        description="Review cached AI responses. Bulk clear forces fresh generation on next app request."
        action={
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={!type || bulkMutation.isPending} onClick={() => setBulkTarget('type')}>
              Clear type
            </Button>
            <Button type="button" variant="destructive" size="sm" disabled={bulkMutation.isPending} onClick={() => setBulkTarget('all')}>
              Clear all cache
            </Button>
          </div>
        }
      />

      {ops.data ? (
        <section className="grid gap-3 rounded-xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-muted-foreground">Prompt version</p>
            <p className="mt-1 text-lg font-semibold font-mono">{ops.data.promptVersion}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Primary provider</p>
            <p className="mt-1 text-lg font-semibold capitalize">{ops.data.primaryProvider}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Cached entries</p>
            <p className="mt-1 text-lg font-semibold">{ops.data.cacheCount.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Models in cooldown</p>
            <p className="mt-1 text-lg font-semibold">{ops.data.cooldowns.length}</p>
          </div>
          {ops.data.cooldowns.length > 0 ? (
            <div className="sm:col-span-2 lg:col-span-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Fallback circuit breaker (live)</p>
              <div className="flex flex-wrap gap-2">
                {ops.data.cooldowns.slice(0, 8).map((c) => (
                  <Badge key={c.id} tone="warning">{c.id} · {c.cooldownSec}s</Badge>
                ))}
              </div>
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="min-w-0 rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="relative min-w-0">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search cache key"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
            />
          </div>
          <Select
            className="w-full"
            value={type}
            onChange={(event) => {
              setType(event.target.value)
              setPage(1)
            }}
            aria-label="AI cache type"
          >
            <option value="">All types</option>
            {(ops.data?.cacheByType || []).map((row) => (
              <option key={row.type} value={row.type}>{row.type} ({row.count})</option>
            ))}
            <option value="daily">daily</option>
            <option value="insights">insights</option>
            <option value="choghadiya">choghadiya</option>
          </Select>
        </div>

        <div className="mt-4 min-w-0">
          {cache.isLoading ? <LoadingRows /> : null}
          {cache.isError ? <ErrorState message="Could not load AI cache." onRetry={() => void cache.refetch()} /> : null}
          {cache.data && cache.data.items.length === 0 ? <EmptyState title="No cache entries found." /> : null}

          <div className="grid min-w-0 gap-3">
            {cache.data?.items.map((item) => (
              <article key={item._id} className="min-w-0 overflow-hidden rounded-xl border border-border bg-background p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{item.type || 'unknown'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(item.updatedAt)}</span>
                    </div>
                    <p className="mt-2 break-all font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                      {item.cacheKey}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="shrink-0"
                    onClick={() => setDeleteTarget(item)}
                    aria-label="Clear cache item"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
                <div className="admin-scroll-x mt-3 max-h-40 rounded-lg border border-border/60 bg-muted/40">
                  <pre className="min-w-0 whitespace-pre-wrap break-words p-3 font-mono text-[11px] leading-relaxed text-muted-foreground sm:text-xs">
                    {JSON.stringify(item.data, null, 2)}
                  </pre>
                </div>
              </article>
            ))}
          </div>
        </div>

        {cache.data ? (
          <div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Page {cache.data.pagination.page} of {cache.data.pagination.pages}</span>
            <div className="grid grid-cols-2 gap-2 sm:flex">
              <Button type="button" variant="secondary" disabled={page <= 1} onClick={() => setPage((value) => value - 1)}>Previous</Button>
              <Button type="button" variant="secondary" disabled={page >= cache.data.pagination.pages} onClick={() => setPage((value) => value + 1)}>Next</Button>
            </div>
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Clear AI cache"
        description="This entry will be regenerated the next time the mobile app requests it."
        confirmLabel="Clear"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />

      <ConfirmDialog
        open={bulkTarget === 'all'}
        title="Clear entire AI cache"
        description="Delete ALL cached AI responses? The next requests will regenerate content (may increase API usage)."
        confirmLabel="Clear all"
        onCancel={() => setBulkTarget(null)}
        onConfirm={() => bulkMutation.mutate({ all: true })}
      />

      <ConfirmDialog
        open={bulkTarget === 'type'}
        title={`Clear ${type || 'type'} cache`}
        description={`Delete all cache entries of type "${type}"?`}
        confirmLabel="Clear type"
        onCancel={() => setBulkTarget(null)}
        onConfirm={() => type && bulkMutation.mutate({ type })}
      />
    </div>
  )
}
