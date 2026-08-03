import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Headphones, Music, Pencil, PlayCircle, Plus, Search, Trash2, Video } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { useMedia } from '@/api/queries'
import type { MediaCategory, MediaItem } from '@/api/types'
import { assetUrl } from '@/api/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'
import { MEDIA_CATEGORIES } from '@/lib/mediaEditor'

function sourceIcon(type: MediaItem['sourceType']) {
  if (type === 'youtube') return PlayCircle
  if (type === 'video') return Video
  return Headphones
}

export default function MediaPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState<MediaCategory | ''>('')
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<'' | 'true' | 'false'>('')
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)

  const params = useMemo(
    () => ({
      category: category || undefined,
      search: search || undefined,
      published: publishedFilter || undefined,
    }),
    [category, search, publishedFilter],
  )
  const media = useMedia(params)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: ['media'] })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteMedia,
    onSuccess: () => {
      setDeleteTarget(null)
      invalidate()
      toast.success('Media deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const rows = media.data ?? []
  const counts = useMemo(() => {
    const all = media.data ?? []
    return MEDIA_CATEGORIES.map((cat) => ({
      ...cat,
      count: category === cat.value ? all.length : undefined,
    }))
  }, [media.data, category])

  const openNew = (cat?: MediaCategory) => {
    navigate(cat ? `/media/new?category=${cat}` : '/media/new')
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Library Media"
        description="Mantras, spiritual music & bhajans for the mobile app. Upload local audio/video files or import from YouTube."
        action={
          <Button type="button" onClick={() => openNew(category || undefined)}>
            <Plus className="size-4" /> Add media
          </Button>
        }
      />

      <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">Categories</h2>
            <p className="mt-1 text-xs text-muted-foreground">Filter by type · click Add on a category to pre-select it</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => openNew(category || undefined)}>
            <Plus className="size-4" /> New media
          </Button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <button
            type="button"
            onClick={() => setCategory('')}
            className={`rounded-xl border p-4 text-left transition ${!category ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50'}`}
          >
            <p className="font-semibold">All media</p>
            <p className="mt-1 text-xs text-muted-foreground">Every category</p>
          </button>
          {counts.map((item) => (
            <div
              key={item.value}
              className={`rounded-xl border p-4 transition ${category === item.value ? 'border-primary bg-primary/10' : 'border-border bg-background'}`}
            >
              <button type="button" className="w-full text-left" onClick={() => setCategory(item.value)}>
                <div className="flex items-center gap-2 font-semibold">
                  <span aria-hidden>{item.icon}</span>
                  {item.label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </button>
              <Button type="button" variant="ghost" size="sm" className="mt-3 h-8 px-2 text-xs" onClick={() => openNew(item.value)}>
                <Plus className="size-3.5" /> Add {item.label.toLowerCase()}
              </Button>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-xl border border-border bg-card p-3 sm:p-4">
        <div className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_140px_140px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title, artist, tags…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value as MediaCategory | '')} aria-label="Category filter">
            <option value="">All categories</option>
            {MEDIA_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </Select>
          <Select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value as '' | 'true' | 'false')} aria-label="Published filter">
            <option value="">All status</option>
            <option value="true">Published</option>
            <option value="false">Drafts</option>
          </Select>
        </div>

        {media.isLoading ? <LoadingRows /> : null}
        {media.isError ? <ErrorState message="Could not load media." onRetry={() => void media.refetch()} /> : null}

        {media.data && rows.length === 0 ? (
          <EmptyState
            title={search || category || publishedFilter ? 'No media matches your filters.' : 'No media yet — upload your first audio or video.'}
            action={
              !search && !publishedFilter ? (
                <Button type="button" onClick={() => openNew(category || 'mantra')}><Plus className="size-4" /> Add first media</Button>
              ) : undefined
            }
          />
        ) : null}

        {rows.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {rows.map((item) => {
              const Icon = sourceIcon(item.sourceType)
              return (
                <div key={item._id} className="group flex flex-col overflow-hidden rounded-xl border border-border bg-background transition hover:border-primary/40 hover:shadow-sm">
                  <button type="button" className="flex flex-1 flex-col text-left" onClick={() => navigate(`/media/edit/${item._id}`)}>
                    <div className="relative aspect-video w-full bg-muted">
                      {item.thumbnailImage ? (
                        <img src={assetUrl(item.thumbnailImage)} alt="" className="size-full object-cover" />
                      ) : (
                        <div className="grid size-full place-items-center">
                          <Music className="size-8 text-muted-foreground/50" />
                        </div>
                      )}
                      <span className="absolute left-2 top-2 rounded-md bg-background/90 px-2 py-0.5 text-[10px] font-semibold uppercase backdrop-blur">
                        <Icon className="mr-1 inline size-3" />
                        {item.sourceType}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-3">
                      <p className="line-clamp-2 font-semibold">{item.title}</p>
                      <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{item.subtitle || item.artist || item.subCategory || '—'}</p>
                      <div className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        <Badge tone={item.published ? 'success' : 'neutral'}>{item.published ? 'live' : 'draft'}</Badge>
                        <Badge>{item.category.replace('_', ' ')}</Badge>
                        {item.isPremium ? <Badge tone="warning">premium</Badge> : null}
                      </div>
                    </div>
                  </button>
                  <div className="flex gap-1 border-t border-border p-2">
                    <Button type="button" variant="secondary" size="sm" className="flex-1" onClick={() => navigate(`/media/edit/${item._id}`)}>
                      <Pencil className="size-3.5" /> Edit
                    </Button>
                    <Button type="button" variant="destructive" size="icon" className="size-8" onClick={() => setDeleteTarget(item)} aria-label="Delete">
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : null}
      </section>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete media"
        description={`Delete ${deleteTarget?.title || 'this media item'}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
