import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Music, Plus, Save, Search, Trash2, Upload } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useMedia } from '@/api/queries'
import type { MediaCategory, MediaItem, YouTubeResult } from '@/api/types'
import { assetUrl } from '@/api/assets'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'

type DraftMedia = Partial<MediaItem> & { tagsText?: string; thumbnailFile?: File }

const categories: Array<{ value: MediaCategory; label: string; hint: string }> = [
  { value: 'mantra', label: 'Mantra', hint: 'Gayatri, Mahamrityunjaya, Shiva, Durga' },
  { value: 'spiritual_music', label: 'Spiritual Music', hint: 'Flute, temple bells, om, rain, tanpura' },
  { value: 'bhajan', label: 'Bhajan', hint: 'Krishna, Hanuman, Ram, Shiv bhajan' },
]

const emptyMedia: DraftMedia = {
  title: '',
  subtitle: '',
  artist: '',
  translations: { en: { title: '', subtitle: '', artist: '' }, hi: { title: '', subtitle: '', artist: '' } },
  category: 'mantra',
  subCategory: '',
  language: 'hi',
  sourceType: 'youtube',
  audioUrl: '',
  youtubeVideoId: '',
  youtubeUrl: '',
  thumbnailImage: '',
  durationText: '',
  sourceName: '',
  sourceUrl: '',
  licenseName: '',
  licenseUrl: '',
  attribution: '',
  rightsNote: '',
  tags: [],
  tagsText: '',
  isPremium: false,
  published: true,
  order: 0,
}

function toDraft(item?: MediaItem): DraftMedia {
  return item ? {
    ...item,
    translations: item.translations || {
      en: { title: item.title || '', subtitle: item.subtitle || '', artist: item.artist || '' },
      hi: { title: '', subtitle: '', artist: '' },
    },
    tagsText: (item.tags || []).join(', '),
  } : { ...emptyMedia, translations: { ...emptyMedia.translations! }, tags: [], tagsText: '' }
}

function fromYouTube(result: YouTubeResult, category: MediaCategory): DraftMedia {
  return {
    ...toDraft(),
    ...result,
    category,
    sourceType: 'youtube',
    subCategory: '',
    sourceName: 'YouTube',
    sourceUrl: result.youtubeUrl,
    tagsText: category === 'bhajan' ? 'bhajan, devotional' : category === 'mantra' ? 'mantra, chanting' : 'spiritual music',
    translations: {
      en: { title: result.title || '', subtitle: result.subtitle || '', artist: result.artist || '' },
      hi: { title: '', subtitle: '', artist: '' },
    },
  }
}

function youtubeEmbed(id?: string) {
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

export default function MediaPage() {
  const [category, setCategory] = useState<MediaCategory>('mantra')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState<DraftMedia>(() => toDraft())
  const [deleteTarget, setDeleteTarget] = useState<MediaItem | null>(null)
  const [youtubeQuery, setYoutubeQuery] = useState('')
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([])
  const params = useMemo(() => ({ category, search: search || undefined }), [category, search])
  const media = useMedia(params)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.media(params) })

  const saveMutation = useMutation({
    mutationFn: (payload: DraftMedia) => endpoints.saveMedia({
      ...payload,
      tags: (payload.tagsText || '').split(',').map((tag) => tag.trim()).filter(Boolean),
    }),
    onSuccess: (item) => {
      setDraft(toDraft(item))
      invalidate()
      toast.success('Media saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteMedia,
    onSuccess: () => {
      setDeleteTarget(null)
      setDraft(toDraft())
      invalidate()
      toast.success('Media deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const youtubeMutation = useMutation({
    mutationFn: endpoints.youtubeSearch,
    onSuccess: (results) => {
      setYoutubeResults(results)
      if (results.length === 0) toast.success('No YouTube results found')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const selectedCategory = categories.find((item) => item.value === category)

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Library Media"
        description="Curate mantras, spiritual music and bhajans. Use subcategories/tags so flute, bells, Krishna bhajan and mantras stay properly related."
        action={<Button type="button" variant="secondary" onClick={() => setDraft({ ...toDraft(), category })}><Plus className="size-4" />New media</Button>}
      />

      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_260px]">
          <div className="grid gap-2 sm:grid-cols-3">
            {categories.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => {
                  setCategory(item.value)
                  setDraft((current) => ({ ...current, category: item.value }))
                }}
                className={`rounded-lg border p-3 text-left transition ${category === item.value ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-background hover:bg-muted/60'}`}
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Music className="size-4" />
                  {item.label}
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{item.hint}</p>
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search title, tag, artist" value={search} onChange={(event) => setSearch(event.target.value)} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold">{selectedCategory?.label || 'Media'}</h2>
              <p className="text-xs text-muted-foreground">Published items show in the mobile Library page.</p>
            </div>
            <Badge tone="accent">{media.data?.length || 0}</Badge>
          </div>
          {media.isLoading ? <LoadingRows /> : null}
          {media.isError ? <ErrorState message="Could not load media." onRetry={() => void media.refetch()} /> : null}
          {media.data && media.data.length === 0 ? <EmptyState title="No media in this category yet." /> : null}
          <div className="grid gap-3">
            {media.data?.map((item) => (
              <button key={item._id} type="button" onClick={() => setDraft(toDraft(item))} className="rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/60">
                <div className="flex gap-3">
                  <div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-md border border-border bg-muted">
                    {item.thumbnailImage ? <img src={assetUrl(item.thumbnailImage)} alt="" className="size-full object-cover" /> : <Music className="size-5 text-muted-foreground" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-semibold">{item.title}</p>
                      <Badge tone={item.published ? 'success' : 'neutral'}>{item.published ? 'published' : 'hidden'}</Badge>
                    </div>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.subtitle || item.artist || item.subCategory || 'No subtitle'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge>{item.sourceType}</Badge>
                      {item.subCategory ? <Badge tone="accent">{item.subCategory}</Badge> : null}
                      {item.isPremium ? <Badge tone="warning">premium</Badge> : null}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>

        <form
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate(draft)
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{draft._id ? 'Edit media' : 'Create media'}</h2>
            <Button type="submit" disabled={saveMutation.isPending}><Save className="size-4" />Save</Button>
          </div>
          <div className="grid gap-4">
            <BilingualFields
              value={draft.translations}
              fields={[
                { key: 'title', label: 'Title' },
                { key: 'subtitle', label: 'Subtitle', multiline: true },
                { key: 'artist', label: 'Artist/channel' },
              ]}
              onChange={(translations) => setDraft({
                ...draft,
                translations,
                title: translations.en.title || draft.title,
                subtitle: translations.en.subtitle || draft.subtitle,
                artist: translations.en.artist || draft.artist,
              })}
            />
            <Field label="Title">
              <Input value={draft.title || ''} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </Field>
            <Field label="Subtitle">
              <Textarea value={draft.subtitle || ''} onChange={(event) => setDraft({ ...draft, subtitle: event.target.value })} />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select value={draft.category || category} onChange={(event) => setDraft({ ...draft, category: event.target.value as MediaCategory })}>
                  {categories.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
                </Select>
              </Field>
              <Field label="Subcategory">
                <Input placeholder="flute, hanuman, shiva, om" value={draft.subCategory || ''} onChange={(event) => setDraft({ ...draft, subCategory: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Source type">
                <Select value={draft.sourceType || 'youtube'} onChange={(event) => setDraft({ ...draft, sourceType: event.target.value as MediaItem['sourceType'] })}>
                  <option value="youtube">YouTube</option>
                  <option value="audio">Direct audio URL</option>
                  <option value="external">External link</option>
                </Select>
              </Field>
              <Field label="Language">
                <Select value={draft.language || 'hi'} onChange={(event) => setDraft({ ...draft, language: event.target.value })}>
                  <option value="hi">Hindi</option>
                  <option value="en">English</option>
                  <option value="sa">Sanskrit</option>
                </Select>
              </Field>
            </div>
            {draft.sourceType === 'audio' ? (
              <Field label="Audio URL">
                <Input placeholder="https://..." value={draft.audioUrl || ''} onChange={(event) => setDraft({ ...draft, audioUrl: event.target.value })} />
              </Field>
            ) : (
              <Field label="YouTube URL or video ID">
                <Input placeholder="https://youtube.com/watch?v=..." value={draft.youtubeUrl || draft.youtubeVideoId || ''} onChange={(event) => setDraft({ ...draft, youtubeUrl: event.target.value, youtubeVideoId: event.target.value })} />
              </Field>
            )}
            {draft.youtubeVideoId ? (
              <div className="aspect-video overflow-hidden rounded-md border border-border bg-muted">
                <iframe className="h-full w-full" src={youtubeEmbed(draft.youtubeVideoId)} title={draft.title || 'YouTube preview'} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
              </div>
            ) : null}
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Artist/channel">
                <Input value={draft.artist || ''} onChange={(event) => setDraft({ ...draft, artist: event.target.value })} />
              </Field>
              <Field label="Duration label">
                <Input value={draft.durationText || ''} onChange={(event) => setDraft({ ...draft, durationText: event.target.value })} />
              </Field>
            </div>
            <Field label="Tags">
              <Textarea value={draft.tagsText || ''} onChange={(event) => setDraft({ ...draft, tagsText: event.target.value })} placeholder="flute, krishna, meditation" />
            </Field>
            <Field label="Thumbnail URL">
              <Input value={draft.thumbnailImage || ''} onChange={(event) => setDraft({ ...draft, thumbnailImage: event.target.value })} />
            </Field>
            <div className="grid gap-4 rounded-md border border-border p-3">
              <div>
                <h3 className="text-sm font-semibold">Rights and source</h3>
                <p className="mt-1 text-xs text-muted-foreground">Use this for public archives, owned files, YouTube embeds or licensed audio.</p>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source name">
                  <Input placeholder="Internet Archive, YouTube, Own recording" value={draft.sourceName || ''} onChange={(event) => setDraft({ ...draft, sourceName: event.target.value })} />
                </Field>
                <Field label="Source URL">
                  <Input placeholder="https://..." value={draft.sourceUrl || ''} onChange={(event) => setDraft({ ...draft, sourceUrl: event.target.value })} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="License name">
                  <Input placeholder="CC BY-NC-ND 3.0, Public Domain, Owned" value={draft.licenseName || ''} onChange={(event) => setDraft({ ...draft, licenseName: event.target.value })} />
                </Field>
                <Field label="License URL">
                  <Input placeholder="https://..." value={draft.licenseUrl || ''} onChange={(event) => setDraft({ ...draft, licenseUrl: event.target.value })} />
                </Field>
              </div>
              <Field label="Attribution">
                <Textarea value={draft.attribution || ''} onChange={(event) => setDraft({ ...draft, attribution: event.target.value })} placeholder="Author/source credit shown in app" />
              </Field>
              <Field label="Rights note">
                <Textarea value={draft.rightsNote || ''} onChange={(event) => setDraft({ ...draft, rightsNote: event.target.value })} placeholder="Example: Non-commercial only; do not modify or redistribute without permission." />
              </Field>
            </div>
            <label className="inline-flex h-11 cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium hover:bg-muted">
              <Upload className="size-4" />
              Upload thumbnail
              <input className="sr-only" type="file" accept="image/*" onChange={(event) => setDraft({ ...draft, thumbnailFile: event.target.files?.[0] })} />
            </label>
            <div className="grid gap-3 rounded-md border border-border p-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Published</span>
                <Switch checked={!!draft.published} onCheckedChange={(checked) => setDraft({ ...draft, published: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Premium content</span>
                <Switch checked={!!draft.isPremium} onCheckedChange={(checked) => setDraft({ ...draft, isPremium: checked })} />
              </div>
            </div>
            {draft._id ? (
              <Button type="button" variant="destructive" onClick={() => setDeleteTarget(draft as MediaItem)}>
                <Trash2 className="size-4" />
                Delete media
              </Button>
            ) : null}
          </div>
        </form>
      </div>

      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
          <Field label="YouTube search/import">
            <Input value={youtubeQuery} onChange={(event) => setYoutubeQuery(event.target.value)} placeholder={`Search ${selectedCategory?.label.toLowerCase()} content`} />
          </Field>
          <Button type="button" variant="secondary" onClick={() => youtubeMutation.mutate({ q: youtubeQuery, category, limit: 8 })} disabled={youtubeMutation.isPending || youtubeQuery.trim().length < 2}>
            <Search className="size-4" />
            Search YouTube
          </Button>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {youtubeResults.map((item) => (
            <button key={item.youtubeVideoId} type="button" onClick={() => setDraft(fromYouTube(item, category))} className="rounded-lg border border-border bg-background p-3 text-left transition hover:bg-muted/60">
              <div className="aspect-video overflow-hidden rounded-md bg-muted">
                {item.thumbnailImage ? <img src={assetUrl(item.thumbnailImage)} alt="" className="size-full object-cover" /> : null}
              </div>
              <p className="mt-2 line-clamp-2 font-medium">{item.title}</p>
              <p className="mt-1 truncate text-xs text-muted-foreground">{item.artist || item.subtitle}</p>
            </button>
          ))}
        </div>
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
