import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  FileAudio,
  FileVideo,
  Image as ImageIcon,
  Link2,
  Music,
  PlayCircle,
  Save,
  Search,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useMedia, useMediaItem } from '@/api/queries'
import type { MediaCategory, YouTubeResult } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  MEDIA_CATEGORIES,
  MEDIA_LANGUAGES,
  SOURCE_OPTIONS,
  emptyMedia,
  formatFileSize,
  fromYouTube,
  syncMediaFromTranslations,
  toDraft,
  validateMedia,
  youtubeEmbed,
  youtubeIdFromInput,
  type DraftMedia,
} from '@/lib/mediaEditor'

type EditorTab = 'details' | 'source' | 'rights' | 'publish'

const TAB_LABELS: Record<EditorTab, string> = {
  details: 'Details',
  source: 'Audio / Video',
  rights: 'Rights & tags',
  publish: 'Publish & preview',
}

function thumbPreview(draft: DraftMedia) {
  if (draft.thumbnailFile) return URL.createObjectURL(draft.thumbnailFile)
  return draft.thumbnailImage ? assetUrl(draft.thumbnailImage) : ''
}

function AppMediaPreview({ draft }: { draft: DraftMedia }) {
  const thumb = thumbPreview(draft)
  const cat = MEDIA_CATEGORIES.find((c) => c.value === draft.category)

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="size-4 text-primary" />
        Mobile app preview
      </div>
      <div className="mx-auto w-full max-w-[260px] rounded-2xl border border-border bg-[#1a1410] p-3 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">{cat?.label || 'Media'}</p>
        <div className="flex gap-3 rounded-xl border border-white/10 bg-[#241c16] p-3">
          <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-lg bg-amber-900/30">
            {thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <Music className="size-6 text-amber-200/50" />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-semibold text-amber-50">{draft.title || 'Media title'}</p>
            <p className="mt-1 truncate text-xs text-amber-200/60">{draft.subtitle || draft.artist || draft.subCategory || 'Subtitle'}</p>
            <div className="mt-2 flex flex-wrap gap-1">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase text-amber-100/80">{draft.sourceType}</span>
              {draft.isPremium ? <span className="rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase text-black">Premium</span> : null}
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Published items appear in <code className="rounded bg-muted px-1 py-0.5">GET /api/media</code> — mantras, music & bhajans in the Library app.
      </p>
    </div>
  )
}

function ValidationChecklist({ draft }: { draft: DraftMedia }) {
  const v = validateMedia(draft)
  const items = [
    { ok: v.title, label: 'Title filled' },
    { ok: v.source, label: 'Audio, video or YouTube source added' },
    { ok: v.thumbnail, label: 'Thumbnail (recommended)' },
  ]
  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted/25 p-4">
      <p className="text-sm font-semibold">Ready to publish</p>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? <CheckCircle2 className="size-4 shrink-0 text-emerald-600" /> : <Circle className="size-4 shrink-0 text-muted-foreground" />}
            <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
          </li>
        ))}
      </ul>
      {v.ok ? <Badge tone="success"><Sparkles className="size-3.5" /> Ready for app</Badge> : <Badge tone="neutral">Complete required fields</Badge>}
    </div>
  )
}

export default function MediaEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isNew = location.pathname.endsWith('/media/new')
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const initialCategory = (searchParams.get('category') as MediaCategory) || 'mantra'
  const itemQuery = useMediaItem(isNew ? undefined : id)
  const allMedia = useMedia({})
  const [draft, setDraft] = useState<DraftMedia>(() => ({ ...emptyMedia(), category: initialCategory }))
  const [tab, setTab] = useState<EditorTab>('details')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [youtubeQuery, setYoutubeQuery] = useState('')
  const [youtubeResults, setYoutubeResults] = useState<YouTubeResult[]>([])

  useEffect(() => {
    if (isNew) {
      setDraft({ ...emptyMedia(), category: initialCategory })
      return
    }
    if (itemQuery.data) setDraft(toDraft(itemQuery.data))
  }, [isNew, itemQuery.data, initialCategory])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['media'] })
    if (id && !isNew) void queryClient.invalidateQueries({ queryKey: queryKeys.mediaItem(id) })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: DraftMedia) => endpoints.saveMedia({
      ...payload,
      tags: (payload.tagsText || '').split(',').map((tag) => tag.trim()).filter(Boolean),
      youtubeVideoId: payload.sourceType === 'youtube'
        ? (payload.youtubeVideoId || youtubeIdFromInput(payload.youtubeUrl))
        : payload.youtubeVideoId,
    }),
    onSuccess: (item) => {
      setDraft(toDraft(item))
      setDirty(false)
      invalidate()
      toast.success(item.published ? 'Media saved — visible in the mobile app now' : 'Media saved as draft')
      if (isNew) navigate(`/media/edit/${item._id}`, { replace: true })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteMedia,
    onSuccess: () => {
      invalidate()
      toast.success('Media deleted')
      navigate('/media')
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

  const suggestedOrder = useMemo(() => {
    const sameCat = (allMedia.data || []).filter((m) => m.category === draft.category)
    const max = sameCat.reduce((acc, m) => Math.max(acc, m.order ?? 0), -1)
    return max + 1
  }, [allMedia.data, draft.category])

  useEffect(() => {
    if (isNew && draft.order === 0 && suggestedOrder > 0) {
      setDraft((prev) => ({ ...prev, order: suggestedOrder }))
    }
  }, [isNew, suggestedOrder, draft.order])

  const patch = (next: Partial<DraftMedia>) => {
    setDirty(true)
    setDraft((prev) => ({ ...prev, ...next }))
  }

  const validation = validateMedia(draft)
  const thumb = thumbPreview(draft)
  const ytId = draft.youtubeVideoId || youtubeIdFromInput(draft.youtubeUrl)

  const submit = (forcePublish?: boolean) => {
    if (!draft.title?.trim()) {
      toast.error('Title is required')
      setTab('details')
      return
    }
    if (!validateMedia(draft).source) {
      toast.error('Add an audio file, video file, YouTube link, or external URL')
      setTab('source')
      return
    }
    const published = forcePublish === true ? true : forcePublish === false ? false : !!draft.published
    saveMutation.mutate({ ...draft, published })
  }

  const handleBack = () => {
    if (dirty && !window.confirm('Unsaved changes will be lost. Leave anyway?')) return
    navigate('/media')
  }

  if (!isNew && itemQuery.isLoading) return <LoadingPanel label="Loading media…" />
  if (!isNew && itemQuery.isError) {
    return <ErrorState message="Could not load this media item." onRetry={() => void itemQuery.refetch()} />
  }

  return (
    <div className="grid min-h-[calc(100svh-4rem)] gap-0">
      <header className="sticky top-0 z-10 -mx-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleBack} aria-label="Back to media">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold">{isNew ? 'Add new media' : 'Edit media'}</h1>
                {draft._id ? <Badge tone={draft.published ? 'success' : 'neutral'}>{draft.published ? 'Published' : 'Draft'}</Badge> : null}
                {dirty ? <Badge tone="warning">Unsaved</Badge> : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">Upload audio/video, YouTube, or links — EN/HI supported</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {draft._id ? (
              <Button type="button" variant="destructive" size="sm" className="col-span-2 sm:col-auto" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : null}
            <Button type="button" variant="secondary" className="w-full sm:w-auto" disabled={saveMutation.isPending} onClick={() => submit(false)}>
              <Save className="size-4" /> Save draft
            </Button>
            <Button type="button" className="w-full sm:w-auto" disabled={saveMutation.isPending || !validation.ok} onClick={() => submit(true)}>
              <Sparkles className="size-4" /> {draft.published ? 'Save & publish' : 'Publish'}
            </Button>
          </div>
        </div>
        <nav className="admin-scroll-x mt-3 flex gap-1 pb-0.5" aria-label="Editor sections">
          {(Object.keys(TAB_LABELS) as EditorTab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`shrink-0 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TAB_LABELS[key]}
            </button>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-6">
          {tab === 'details' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Media information</h2>
                <p className="mt-1 text-sm text-muted-foreground">Title, artist & description in English and Hindi.</p>
              </div>
              <BilingualFields
                value={draft.translations}
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'subtitle', label: 'Subtitle', multiline: true },
                  { key: 'artist', label: 'Artist / channel' },
                ]}
                onChange={(translations) => patch(syncMediaFromTranslations(draft, translations))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title">
                  <Input value={draft.title || ''} onChange={(e) => patch({ title: e.target.value })} required />
                </Field>
                <Field label="Artist / channel">
                  <Input value={draft.artist || ''} onChange={(e) => patch({ artist: e.target.value })} />
                </Field>
              </div>
              <Field label="Subtitle">
                <Textarea value={draft.subtitle || ''} onChange={(e) => patch({ subtitle: e.target.value })} rows={3} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Category">
                  <Select value={draft.category || 'mantra'} onChange={(e) => patch({ category: e.target.value as MediaCategory })}>
                    {MEDIA_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </Select>
                </Field>
                <Field label="Subcategory">
                  <Input placeholder="flute, hanuman, om" value={draft.subCategory || ''} onChange={(e) => patch({ subCategory: e.target.value })} />
                </Field>
                <Field label="Language">
                  <Select value={draft.language || 'hi'} onChange={(e) => patch({ language: e.target.value })}>
                    {MEDIA_LANGUAGES.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="grid gap-4 lg:grid-cols-[160px_minmax(0,1fr)]">
                <Field label="Thumbnail">
                  <div className="grid gap-2">
                    <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                      {thumb ? (
                        <>
                          <img src={thumb} alt="" className="size-full object-cover" />
                          <button type="button" className="absolute right-1 top-1 rounded-full bg-background/90 p-1" onClick={() => patch({ thumbnailImage: '', thumbnailFile: undefined })} aria-label="Remove thumbnail">
                            <X className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <div className="grid size-full place-items-center text-muted-foreground"><ImageIcon className="size-7 opacity-50" /></div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border px-2 py-1.5 text-xs font-medium hover:bg-muted">
                      <Upload className="size-3.5" /> Upload
                      <input type="file" accept="image/*" className="sr-only" onChange={(e) => patch({ thumbnailFile: e.target.files?.[0] })} />
                    </label>
                  </div>
                </Field>
                <div className="grid content-start gap-4">
                  <Field label="Duration label">
                    <Input placeholder="5:32" value={draft.durationText || ''} onChange={(e) => patch({ durationText: e.target.value })} />
                  </Field>
                  <Field label="Display order">
                    <Input type="number" min={0} value={draft.order ?? 0} onChange={(e) => patch({ order: Number(e.target.value) })} />
                    <p className="mt-1 text-xs text-muted-foreground">Suggested for {draft.category}: {suggestedOrder}</p>
                  </Field>
                </div>
              </div>
            </section>
          ) : null}

          {tab === 'source' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Audio / Video source</h2>
                <p className="mt-1 text-sm text-muted-foreground">Upload files from your computer or paste URLs.</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {SOURCE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => patch({ sourceType: opt.value })}
                    className={`rounded-lg border p-4 text-left transition ${
                      draft.sourceType === opt.value ? 'border-primary bg-primary/10' : 'border-border bg-background hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 font-semibold">
                      {opt.value === 'youtube' ? <PlayCircle className="size-4" /> : opt.value === 'video' ? <FileVideo className="size-4" /> : opt.value === 'audio' ? <FileAudio className="size-4" /> : <Link2 className="size-4" />}
                      {opt.label}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{opt.description}</p>
                  </button>
                ))}
              </div>

              {draft.sourceType === 'audio' ? (
                <div className="grid gap-4 rounded-lg border border-dashed border-border bg-muted/20 p-4">
                  <h3 className="font-medium">Upload audio file</h3>
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-border bg-background p-6 hover:bg-muted/30">
                    <FileAudio className="size-10 text-primary" />
                    <span className="text-sm font-medium">{draft.audioFile ? draft.audioFile.name : 'Choose mp3, wav, ogg, m4a…'}</span>
                    {draft.audioFile ? <span className="text-xs text-muted-foreground">{formatFileSize(draft.audioFile.size)}</span> : null}
                    <input type="file" accept="audio/*,.mp3,.wav,.ogg,.m4a,.webm" className="sr-only" onChange={(e) => patch({ audioFile: e.target.files?.[0], sourceType: 'audio' })} />
                  </label>
                  {draft.audioUrl && !draft.audioFile ? (
                    <p className="text-xs text-muted-foreground">Current: <code className="rounded bg-muted px-1">{draft.audioUrl}</code></p>
                  ) : null}
                  <Field label="Or paste audio URL">
                    <Input placeholder="https://… or /uploads/audio/…" value={draft.audioUrl || ''} onChange={(e) => patch({ audioUrl: e.target.value })} />
                  </Field>
                  {draft.audioUrl && draft.sourceType === 'audio' ? (
                    <audio controls className="w-full" src={draft.audioFile ? URL.createObjectURL(draft.audioFile) : assetUrl(draft.audioUrl)} />
                  ) : null}
                </div>
              ) : null}

              {draft.sourceType === 'video' ? (
                <div className="grid gap-4 rounded-lg border border-dashed border-border bg-muted/20 p-4">
                  <h3 className="font-medium">Upload video file</h3>
                  <label className="flex cursor-pointer flex-col items-center gap-3 rounded-lg border border-border bg-background p-6 hover:bg-muted/30">
                    <FileVideo className="size-10 text-primary" />
                    <span className="text-sm font-medium">{draft.videoFile ? draft.videoFile.name : 'Choose mp4, webm, mov…'}</span>
                    {draft.videoFile ? <span className="text-xs text-muted-foreground">{formatFileSize(draft.videoFile.size)} · max 100MB</span> : null}
                    <input type="file" accept="video/*,.mp4,.webm,.mov" className="sr-only" onChange={(e) => patch({ videoFile: e.target.files?.[0], sourceType: 'video' })} />
                  </label>
                  {draft.videoUrl && !draft.videoFile ? (
                    <p className="text-xs text-muted-foreground">Current: <code className="rounded bg-muted px-1">{draft.videoUrl}</code></p>
                  ) : null}
                  <Field label="Or paste video URL">
                    <Input placeholder="https://… or /uploads/video/…" value={draft.videoUrl || ''} onChange={(e) => patch({ videoUrl: e.target.value })} />
                  </Field>
                  {(draft.videoUrl || draft.videoFile) && draft.sourceType === 'video' ? (
                    <video controls className="max-h-64 w-full rounded-lg bg-black" src={draft.videoFile ? URL.createObjectURL(draft.videoFile) : assetUrl(draft.videoUrl)} />
                  ) : null}
                </div>
              ) : null}

              {draft.sourceType === 'youtube' ? (
                <div className="grid gap-4">
                  <Field label="YouTube URL or video ID">
                    <Input
                      placeholder="https://youtube.com/watch?v=…"
                      value={draft.youtubeUrl || draft.youtubeVideoId || ''}
                      onChange={(e) => {
                        const id = youtubeIdFromInput(e.target.value)
                        patch({ youtubeUrl: e.target.value, youtubeVideoId: id })
                      }}
                    />
                  </Field>
                  {ytId ? (
                    <div className="aspect-video overflow-hidden rounded-lg border border-border bg-muted">
                      <iframe className="size-full" src={youtubeEmbed(ytId)} title={draft.title || 'YouTube preview'} allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  ) : null}
                  <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4">
                    <p className="text-sm font-medium">Import from YouTube search</p>
                    <div className="flex flex-wrap gap-2">
                      <Input className="min-w-[200px] flex-1" value={youtubeQuery} onChange={(e) => setYoutubeQuery(e.target.value)} placeholder="Search mantras, bhajans…" />
                      <Button type="button" variant="secondary" disabled={youtubeMutation.isPending || youtubeQuery.trim().length < 2} onClick={() => youtubeMutation.mutate({ q: youtubeQuery, category: draft.category || 'mantra', limit: 8 })}>
                        <Search className="size-4" /> Search
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {youtubeResults.map((item) => (
                        <button key={item.youtubeVideoId} type="button" onClick={() => { patch(fromYouTube(item, draft.category || 'mantra')); setDirty(true) }} className="rounded-lg border border-border bg-background p-2 text-left hover:bg-muted/50">
                          <div className="aspect-video overflow-hidden rounded-md bg-muted">
                            {item.thumbnailImage ? <img src={assetUrl(item.thumbnailImage)} alt="" className="size-full object-cover" /> : null}
                          </div>
                          <p className="mt-2 line-clamp-2 text-xs font-medium">{item.title}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : null}

              {draft.sourceType === 'external' ? (
                <Field label="External source URL">
                  <Input placeholder="https://…" value={draft.sourceUrl || ''} onChange={(e) => patch({ sourceUrl: e.target.value })} />
                </Field>
              ) : null}
            </section>
          ) : null}

          {tab === 'rights' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Rights, tags & attribution</h2>
                <p className="mt-1 text-sm text-muted-foreground">License info shown in the app for transparency.</p>
              </div>
              <Field label="Tags (comma separated)">
                <Textarea value={draft.tagsText || ''} onChange={(e) => patch({ tagsText: e.target.value })} placeholder="flute, krishna, meditation" />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Source name">
                  <Input placeholder="Own recording, YouTube, Archive" value={draft.sourceName || ''} onChange={(e) => patch({ sourceName: e.target.value })} />
                </Field>
                <Field label="Source URL">
                  <Input placeholder="https://…" value={draft.sourceUrl || ''} onChange={(e) => patch({ sourceUrl: e.target.value })} />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="License name">
                  <Input placeholder="Public Domain, Owned, CC BY" value={draft.licenseName || ''} onChange={(e) => patch({ licenseName: e.target.value })} />
                </Field>
                <Field label="License URL">
                  <Input placeholder="https://…" value={draft.licenseUrl || ''} onChange={(e) => patch({ licenseUrl: e.target.value })} />
                </Field>
              </div>
              <Field label="Attribution">
                <Textarea value={draft.attribution || ''} onChange={(e) => patch({ attribution: e.target.value })} />
              </Field>
              <Field label="Rights note">
                <Textarea value={draft.rightsNote || ''} onChange={(e) => patch({ rightsNote: e.target.value })} placeholder="Non-commercial only; do not redistribute without permission." />
              </Field>
            </section>
          ) : null}

          {tab === 'publish' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <ValidationChecklist draft={draft} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium">Published in app</p>
                  <p className="mt-1 text-sm text-muted-foreground">Visible in Library mantras, music & bhajans sections.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm">Published</span>
                    <Switch checked={!!draft.published} onCheckedChange={(checked) => patch({ published: checked })} />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="font-medium">Premium content</p>
                  <p className="mt-1 text-sm text-muted-foreground">Requires subscription in app.</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm">Premium</span>
                    <Switch checked={!!draft.isPremium} onCheckedChange={(checked) => patch({ isPremium: checked })} />
                  </div>
                </div>
              </div>
              {draft._id ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                  <p className="font-medium">App API</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">GET /api/media?category={draft.category}</p>
                  <Link to="/media" className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">← Back to media library</Link>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4">
            <AppMediaPreview draft={draft} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete media"
        description={`Delete "${draft.title || 'this item'}" permanently?`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => draft._id && deleteMutation.mutate(draft._id)}
      />
    </div>
  )
}
