import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
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
  const params = useMemo(() => ({ page, limit: 12, search: search || undefined, type: type || undefined }), [page, search, type])
  const cache = useAiCache(params)
  const queryClient = useQueryClient()
  const toast = useToast()

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteAiCache,
    onSuccess: () => {
      setDeleteTarget(null)
      void queryClient.invalidateQueries({ queryKey: queryKeys.aiCache(params) })
      void queryClient.invalidateQueries({ queryKey: queryKeys.stats })
      toast.success('Cache item cleared')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="grid gap-6">
      <PageHeader title="AI Cache" description="Review cached AI responses and clear entries when regeneration is needed." />
      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search cache key" value={search} onChange={(event) => {
              setSearch(event.target.value)
              setPage(1)
            }} />
          </div>
          <Select value={type} onChange={(event) => {
            setType(event.target.value)
            setPage(1)
          }} aria-label="AI cache type">
            <option value="">All types</option>
            <option value="daily">Daily</option>
            <option value="insights">Insights</option>
            <option value="choghadiya">Choghadiya</option>
          </Select>
        </div>
        <div className="mt-4">
          {cache.isLoading ? <LoadingRows /> : null}
          {cache.isError ? <ErrorState message="Could not load AI cache." onRetry={() => void cache.refetch()} /> : null}
          {cache.data && cache.data.items.length === 0 ? <EmptyState title="No cache entries found." /> : null}
          <div className="grid gap-3">
            {cache.data?.items.map((item) => (
              <div key={item._id} className="rounded-md border border-border bg-background p-3 sm:p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone="accent">{item.type || 'unknown'}</Badge>
                      <span className="text-xs text-muted-foreground">{formatDateTime(item.updatedAt)}</span>
                    </div>
                    <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{item.cacheKey}</p>
                    <pre className="mt-3 max-h-36 overflow-auto rounded-md bg-muted p-3 text-xs text-muted-foreground">
                      {JSON.stringify(item.data, null, 2)}
                    </pre>
                  </div>
                  <Button type="button" variant="destructive" size="icon" onClick={() => setDeleteTarget(item)} aria-label="Clear cache item">
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
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
    </div>
  )
}
