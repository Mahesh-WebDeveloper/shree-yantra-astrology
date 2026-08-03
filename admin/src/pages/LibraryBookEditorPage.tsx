import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  BookOpen,
  CheckCircle2,
  Circle,
  Copy,
  Eye,
  Image as ImageIcon,
  Plus,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
  Upload,
  X,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { assetUrl } from '@/api/assets'
import { queryKeys, useBook, useBooks } from '@/api/queries'
import type { BookChapter } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  BOOK_CATEGORIES,
  BOOK_LANGUAGES,
  emptyChapter,
  newBookDraft,
  normalizeDraft,
  reorderChapters,
  syncBookFromTranslations,
  validateBook,
  wordCount,
  type DraftBook,
} from '@/lib/libraryBookEditor'

type EditorTab = 'details' | 'chapters' | 'publish'

const TAB_LABELS: Record<EditorTab, string> = {
  details: 'Book details',
  chapters: 'Chapters',
  publish: 'Publish & preview',
}

const PREVIEW_COLORS = ['#c9a227', '#7c3aed', '#059669', '#e11d48', '#2563eb'] as const

function coverPreviewUrl(draft: DraftBook) {
  if (draft.coverFile) return URL.createObjectURL(draft.coverFile)
  return draft.coverImage ? assetUrl(draft.coverImage) : ''
}

function AppBookPreview({ draft }: { draft: DraftBook }) {
  const cover = coverPreviewUrl(draft)
  const chapters = draft.chapters?.length || 0
  const color = PREVIEW_COLORS[Math.abs(draft.order ?? 0) % PREVIEW_COLORS.length]

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="size-4 text-primary" />
        Mobile app preview
      </div>
      <div className="mx-auto w-full max-w-[220px] rounded-2xl border border-border bg-[#1a1410] p-3 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">Books & Learning</p>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-[#241c16]">
          <div className="relative aspect-[3/4] w-full" style={{ background: `linear-gradient(145deg, ${color}33, #1a1410)` }}>
            {cover ? (
              <img src={cover} alt="" className="size-full object-cover" />
            ) : (
              <div className="grid size-full place-items-center text-amber-200/40">
                <BookOpen className="size-10" />
              </div>
            )}
            {draft.isPremium ? (
              <span className="absolute right-2 top-2 rounded-full bg-amber-500 px-2 py-0.5 text-[9px] font-bold uppercase text-black">Premium</span>
            ) : null}
          </div>
          <div className="p-3">
            <p className="line-clamp-2 text-sm font-semibold text-amber-50">{draft.title || 'Book title'}</p>
            <p className="mt-1 text-xs text-amber-200/60">
              {chapters ? `${chapters} ${chapters === 1 ? 'chapter' : 'chapters'}` : (draft.category || 'General')}
            </p>
          </div>
        </div>
      </div>
      {(draft.chapters || []).length > 0 ? (
        <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Chapter list in app</p>
          <ul className="grid gap-1.5">
            {(draft.chapters || []).slice(0, 5).map((chapter, index) => (
              <li key={index} className="flex items-center gap-2 rounded-md bg-background px-2 py-1.5 text-xs">
                <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-[10px] font-semibold text-primary">
                  {index + 1}
                </span>
                <span className="truncate">{chapter.title || `Chapter ${index + 1}`}</span>
              </li>
            ))}
            {(draft.chapters || []).length > 5 ? (
              <li className="px-2 text-xs text-muted-foreground">+ {(draft.chapters!.length - 5)} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Published books appear in <code className="rounded bg-muted px-1 py-0.5">GET /api/library</code> — same cards & reader as scriptures.
      </p>
    </div>
  )
}

function ValidationChecklist({ draft }: { draft: DraftBook }) {
  const v = validateBook(draft)
  const items = [
    { ok: v.title, label: 'Book title filled' },
    { ok: v.chapters, label: 'At least one chapter' },
    { ok: v.chapterTitles, label: 'Every chapter has a title' },
    { ok: v.cover, label: 'Cover image (recommended)' },
  ]

  return (
    <div className="grid gap-2 rounded-lg border border-border bg-muted/25 p-4">
      <p className="text-sm font-semibold">Ready to publish</p>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.label} className="flex items-center gap-2 text-sm">
            {item.ok ? (
              <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            ) : (
              <Circle className="size-4 shrink-0 text-muted-foreground" />
            )}
            <span className={item.ok ? 'text-foreground' : 'text-muted-foreground'}>{item.label}</span>
          </li>
        ))}
      </ul>
      {v.ok ? (
        <span className="w-fit"><Badge tone="success"><Sparkles className="size-3.5" /> Ready for app</Badge></span>
      ) : (
        <span className="w-fit"><Badge tone="neutral">Complete required fields first</Badge></span>
      )}
    </div>
  )
}

export default function LibraryBookEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const isNew = location.pathname.endsWith('/library/new')
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()

  const bookQuery = useBook(isNew ? undefined : id)
  const allBooks = useBooks()
  const [draft, setDraft] = useState<DraftBook>(() => newBookDraft())
  const [tab, setTab] = useState<EditorTab>('details')
  const [activeChapter, setActiveChapter] = useState(0)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    if (isNew) {
      setDraft(newBookDraft())
      return
    }
    if (bookQuery.data) {
      setDraft(normalizeDraft(bookQuery.data))
      setActiveChapter(0)
    }
  }, [isNew, bookQuery.data])

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.books })
    void queryClient.invalidateQueries({ queryKey: queryKeys.libraryOverview })
    if (id && !isNew) void queryClient.invalidateQueries({ queryKey: queryKeys.book(id) })
  }

  const saveMutation = useMutation({
    mutationFn: (payload: DraftBook) => endpoints.saveBook(payload),
    onSuccess: (book) => {
      setDraft(normalizeDraft(book))
      setDirty(false)
      invalidate()
      toast.success(
        book.published
          ? 'Book saved — visible in the mobile app library now'
          : 'Book saved as draft (turn on Published to show in app)',
      )
      if (isNew) navigate(`/library/edit/${book._id}`, { replace: true })
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteBook,
    onSuccess: () => {
      invalidate()
      toast.success('Book deleted')
      navigate('/library')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const patch = (next: Partial<DraftBook>) => {
    setDirty(true)
    setDraft((prev) => ({ ...prev, ...next }))
  }

  const setChapter = (index: number, patchChapter: Partial<BookChapter>) => {
    setDirty(true)
    setDraft((prev) => {
      const chapters = [...(prev.chapters || [])]
      chapters[index] = { ...chapters[index], ...patchChapter } as BookChapter
      return { ...prev, chapters }
    })
  }

  const addChapter = () => {
    setDirty(true)
    setDraft((prev) => {
      const chapters = prev.chapters || []
      const next = [...chapters, emptyChapter(chapters.length)]
      setActiveChapter(next.length - 1)
      return { ...prev, chapters: next }
    })
    setTab('chapters')
  }

  const duplicateChapter = (index: number) => {
    setDirty(true)
    setDraft((prev) => {
      const chapters = [...(prev.chapters || [])]
      const source = chapters[index]
      const copy: BookChapter = {
        ...source,
        title: `${source.title || 'Chapter'} (copy)`,
        translations: source.translations
          ? {
              en: { ...source.translations.en, title: `${source.translations.en?.title || source.title} (copy)` },
              hi: { ...source.translations.hi },
            }
          : undefined,
      }
      chapters.splice(index + 1, 0, copy)
      setActiveChapter(index + 1)
      return { ...prev, chapters: chapters.map((c, i) => ({ ...c, order: i })) }
    })
  }

  const removeChapter = (index: number) => {
    setDirty(true)
    setDraft((prev) => {
      const chapters = (prev.chapters || []).filter((_, i) => i !== index)
      const next = chapters.length ? chapters : [emptyChapter(0)]
      setActiveChapter(Math.min(index, next.length - 1))
      return { ...prev, chapters: next.map((c, i) => ({ ...c, order: i })) }
    })
  }

  const moveChapter = (index: number, direction: -1 | 1) => {
    const target = index + direction
    setDirty(true)
    setDraft((prev) => {
      const chapters = reorderChapters(prev.chapters || [], index, target)
      setActiveChapter(target)
      return { ...prev, chapters }
    })
  }

  const suggestedOrder = useMemo(() => {
    const max = (allBooks.data || []).reduce((acc, book) => Math.max(acc, book.order ?? 0), -1)
    return max + 1
  }, [allBooks.data])

  useEffect(() => {
    if (isNew && draft.order === 0 && suggestedOrder > 0) {
      setDraft((prev) => ({ ...prev, order: suggestedOrder }))
    }
  }, [isNew, suggestedOrder, draft.order])

  const validation = validateBook(draft)
  const coverUrl = coverPreviewUrl(draft)
  const currentChapter = (draft.chapters || [])[activeChapter]

  const submit = (forcePublish?: boolean) => {
    if (!draft.title?.trim()) {
      toast.error('Book title is required')
      setTab('details')
      return
    }
    const chapters = draft.chapters || []
    if (!chapters.length || !chapters.every((c) => c.title?.trim())) {
      toast.error('Every chapter needs a title')
      setTab('chapters')
      return
    }
    const published = forcePublish === true ? true : forcePublish === false ? false : !!draft.published
    saveMutation.mutate({ ...draft, published })
  }

  const handleBack = () => {
    if (dirty && !window.confirm('Unsaved changes will be lost. Leave anyway?')) return
    navigate('/library')
  }

  if (!isNew && bookQuery.isLoading) return <LoadingPanel label="Loading book…" />
  if (!isNew && bookQuery.isError) {
    return (
      <ErrorState
        message="Could not load this book."
        onRetry={() => void bookQuery.refetch()}
      />
    )
  }

  return (
    <div className="grid min-h-[calc(100svh-4rem)] gap-0">
      <header className="sticky top-0 z-10 -mx-3 border-b border-border bg-background/95 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:-mx-6 sm:px-6">
        <div className="flex flex-col gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <Button type="button" variant="ghost" size="icon" className="shrink-0" onClick={handleBack} aria-label="Back to library">
              <ArrowLeft className="size-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-lg font-semibold">{isNew ? 'Add new book' : 'Edit book'}</h1>
                {draft._id ? <Badge tone={draft.published ? 'success' : 'neutral'}>{draft.published ? 'Published' : 'Draft'}</Badge> : null}
                {dirty ? <Badge tone="warning">Unsaved</Badge> : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Bilingual content, chapters, cover & app preview
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {draft._id ? (
              <Button type="button" variant="destructive" size="sm" className="col-span-2 sm:col-auto" onClick={() => setDeleteOpen(true)}>
                <Trash2 className="size-4" /> Delete
              </Button>
            ) : null}
            <Button
              type="button"
              variant="secondary"
              className="w-full sm:w-auto"
              disabled={saveMutation.isPending}
              onClick={() => submit(false)}
            >
              <Save className="size-4" /> Save draft
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={saveMutation.isPending || !validation.ok}
              onClick={() => submit(true)}
            >
              <Sparkles className="size-4" />
              {draft.published ? 'Save & publish' : 'Publish'}
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
                tab === key
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              {TAB_LABELS[key]}
              {key === 'chapters' && (draft.chapters?.length || 0) > 0 ? (
                <span className="ml-1.5 rounded-full bg-black/15 px-1.5 py-0.5 text-[10px]">{draft.chapters!.length}</span>
              ) : null}
            </button>
          ))}
        </nav>
      </header>

      <div className="grid gap-6 py-6 lg:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="grid min-w-0 gap-6">
          {tab === 'details' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Book information</h2>
                <p className="mt-1 text-sm text-muted-foreground">English & Hindi — app picks language from user settings.</p>
              </div>
              <BilingualFields
                value={draft.translations}
                fields={[
                  { key: 'title', label: 'Title' },
                  { key: 'author', label: 'Author' },
                  { key: 'category', label: 'Category' },
                  { key: 'description', label: 'Description', multiline: true },
                ]}
                onChange={(translations) => patch(syncBookFromTranslations(draft, translations))}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Title (primary)">
                  <Input
                    value={draft.title || ''}
                    onChange={(e) => patch({ title: e.target.value })}
                    placeholder="e.g. Jyotish Fundamentals"
                    required
                  />
                </Field>
                <Field label="Author">
                  <Input
                    value={draft.author || ''}
                    onChange={(e) => patch({ author: e.target.value })}
                    placeholder="Author name"
                  />
                </Field>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Category">
                  <Select value={draft.category || 'General'} onChange={(e) => patch({ category: e.target.value })}>
                    {BOOK_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Primary language">
                  <Select value={draft.language || 'en'} onChange={(e) => patch({ language: e.target.value })}>
                    {BOOK_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>{lang.label}</option>
                    ))}
                  </Select>
                </Field>
              </div>
              <Field label="Description">
                <Textarea
                  value={draft.description || ''}
                  onChange={(e) => patch({ description: e.target.value })}
                  rows={4}
                  placeholder="Short summary shown on the book card in the app"
                />
              </Field>
              <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
                <Field label="Cover image">
                  <div className="grid gap-3">
                    <div className="relative aspect-[3/4] overflow-hidden rounded-lg border border-border bg-muted">
                      {coverUrl ? (
                        <>
                          <img src={coverUrl} alt="" className="size-full object-cover" />
                          <button
                            type="button"
                            className="absolute right-2 top-2 rounded-full bg-background/90 p-1 shadow"
                            onClick={() => patch({ coverImage: '', coverFile: undefined })}
                            aria-label="Remove cover"
                          >
                            <X className="size-4" />
                          </button>
                        </>
                      ) : (
                        <div className="grid size-full place-items-center text-muted-foreground">
                          <ImageIcon className="size-8 opacity-50" />
                        </div>
                      )}
                    </div>
                    <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-md border border-border bg-background px-3 py-2 text-sm font-medium hover:bg-muted">
                      <Upload className="size-4" />
                      Upload cover
                      <input
                        type="file"
                        accept="image/*"
                        className="sr-only"
                        onChange={(e) => patch({ coverFile: e.target.files?.[0] })}
                      />
                    </label>
                    <p className="text-xs text-muted-foreground">Recommended 3:4 ratio · JPG or PNG</p>
                  </div>
                </Field>
                <div className="grid content-start gap-4">
                  <Field label="Display order in app">
                    <Input
                      type="number"
                      min={0}
                      value={draft.order ?? 0}
                      onChange={(e) => patch({ order: Number(e.target.value) })}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">Lower numbers appear first. Suggested: {suggestedOrder}</p>
                  </Field>
                  <div className="grid gap-3 rounded-lg border border-border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Premium content</p>
                        <p className="text-xs text-muted-foreground">Requires subscription in app</p>
                      </div>
                      <Switch checked={!!draft.isPremium} onCheckedChange={(checked) => patch({ isPremium: checked })} />
                    </div>
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Published in app</p>
                        <p className="text-xs text-muted-foreground">Users see this in Books & Learning</p>
                      </div>
                      <Switch checked={!!draft.published} onCheckedChange={(checked) => patch({ published: checked })} />
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {tab === 'chapters' ? (
            <section className="grid gap-4 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-base font-semibold">Chapters</h2>
                  <p className="mt-1 text-sm text-muted-foreground">Reorder, duplicate, or add bilingual chapter content.</p>
                </div>
                <Button type="button" variant="secondary" onClick={addChapter}>
                  <Plus className="size-4" /> Add chapter
                </Button>
              </div>
              <div className="grid gap-4 xl:grid-cols-[240px_minmax(0,1fr)]">
                <div className="grid max-h-[520px] gap-2 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                  {(draft.chapters || []).map((chapter, index) => (
                    <div
                      key={index}
                      className={`flex items-center gap-1 rounded-md border p-2 ${
                        activeChapter === index ? 'border-primary bg-primary/5' : 'border-transparent bg-background'
                      }`}
                    >
                      <button
                        type="button"
                        className="min-w-0 flex-1 truncate text-left text-sm"
                        onClick={() => setActiveChapter(index)}
                      >
                        <span className="font-medium text-muted-foreground">{index + 1}. </span>
                        {chapter.title || 'Untitled chapter'}
                      </button>
                      <div className="flex shrink-0 gap-0.5">
                        <Button type="button" variant="ghost" size="icon" className="size-7" disabled={index === 0} onClick={() => moveChapter(index, -1)} aria-label="Move up">
                          <ArrowUp className="size-3.5" />
                        </Button>
                        <Button type="button" variant="ghost" size="icon" className="size-7" disabled={index === (draft.chapters?.length || 0) - 1} onClick={() => moveChapter(index, 1)} aria-label="Move down">
                          <ArrowDown className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                {currentChapter ? (
                  <div className="grid gap-4 rounded-lg border border-border bg-background p-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-semibold">Chapter {activeChapter + 1}</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="secondary" size="sm" onClick={() => duplicateChapter(activeChapter)}>
                          <Copy className="size-3.5" /> Duplicate
                        </Button>
                        {(draft.chapters?.length || 0) > 1 ? (
                          <Button type="button" variant="ghost" size="sm" onClick={() => removeChapter(activeChapter)}>
                            <Trash2 className="size-3.5" /> Remove
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <BilingualFields
                      value={currentChapter.translations}
                      fields={[
                        { key: 'title', label: 'Chapter title' },
                        { key: 'content', label: 'Content', multiline: true },
                      ]}
                      onChange={(translations) => setChapter(activeChapter, {
                        translations,
                        title: translations.en.title || currentChapter.title,
                        content: translations.en.content || currentChapter.content,
                      })}
                    />
                    <Field label="Chapter title">
                      <Input
                        value={currentChapter.title}
                        onChange={(e) => setChapter(activeChapter, { title: e.target.value })}
                        placeholder="Chapter title"
                      />
                    </Field>
                    <Field label="Content">
                      <Textarea
                        value={currentChapter.content}
                        onChange={(e) => setChapter(activeChapter, { content: e.target.value })}
                        rows={12}
                        placeholder="Full chapter text — shown in the parchment reader in the app"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {wordCount(currentChapter.content).toLocaleString('en-IN')} words · {(currentChapter.content?.length || 0).toLocaleString('en-IN')} characters
                      </p>
                    </Field>
                    <Field label="Audio URL (optional)">
                      <Input
                        value={currentChapter.audioUrl}
                        onChange={(e) => setChapter(activeChapter, { audioUrl: e.target.value })}
                        placeholder="https://… mp3 or streaming link"
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </section>
          ) : null}

          {tab === 'publish' ? (
            <section className="grid gap-6 rounded-xl border border-border bg-card p-4 sm:p-6">
              <div>
                <h2 className="text-base font-semibold">Publish settings</h2>
                <p className="mt-1 text-sm text-muted-foreground">Control visibility and review before pushing to the live app.</p>
              </div>
              <ValidationChecklist draft={draft} />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Eye className="size-4 text-primary" />
                    <p className="font-medium">Visibility</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {draft.published
                      ? 'This book will appear in the mobile app under Books & Learning immediately after save.'
                      : 'Saved as draft — not visible to users until Published is turned on.'}
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm">Published</span>
                    <Switch checked={!!draft.published} onCheckedChange={(checked) => patch({ published: checked })} />
                  </div>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-4 text-amber-600" />
                    <p className="font-medium">Premium</p>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Premium books show a badge and may require an active subscription to read.
                  </p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm">Premium content</span>
                    <Switch checked={!!draft.isPremium} onCheckedChange={(checked) => patch({ isPremium: checked })} />
                  </div>
                </div>
              </div>
              {draft._id ? (
                <div className="rounded-lg border border-dashed border-border bg-muted/30 p-4 text-sm">
                  <p className="font-medium">App API endpoints</p>
                  <ul className="mt-2 grid gap-1 font-mono text-xs text-muted-foreground">
                    <li>GET /api/library — list (published only)</li>
                    <li>GET /api/library/{draft._id} — single book</li>
                  </ul>
                  <Link to="/library" className="mt-3 inline-flex text-xs font-medium text-primary hover:underline">
                    ← Back to library overview
                  </Link>
                </div>
              ) : null}
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-36 lg:self-start">
          <div className="rounded-xl border border-border bg-card p-4">
            <AppBookPreview draft={draft} />
          </div>
        </aside>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete book"
        description={`Delete "${draft.title || 'this book'}" permanently? It will be removed from the app immediately.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => draft._id && deleteMutation.mutate(draft._id)}
      />
    </div>
  )
}
