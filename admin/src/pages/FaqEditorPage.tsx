import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Circle,
  EyeOff,
  Loader2,
  Save,
  Smartphone,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useFaq } from '@/api/queries'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { ErrorState, LoadingPanel } from '@/components/DataState'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Select } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'
import {
  FAQ_CATEGORY_PRESETS,
  categoryMeta,
  emptyFaq,
  syncFaqFromTranslations,
  toDraft,
  validateFaq,
  type DraftFaq,
} from '@/lib/faqPage'
import { cn } from '@/lib/utils'

function FaqAppPreview({ draft }: { draft: DraftFaq }) {
  const [open, setOpen] = useState(true)
  const question = draft.translations?.en?.question || draft.question || 'Your question appears here'
  const answer = draft.translations?.en?.answer || draft.answer || 'Answer text will show when users expand this item in the app help screen.'
  const meta = categoryMeta(draft.category || 'General')

  return (
    <div className="grid gap-4">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <Smartphone className="size-4 text-primary" />
        Mobile app preview
      </div>
      <div className="mx-auto w-full max-w-[280px] rounded-2xl border border-border bg-[#1a1410] p-3 shadow-lg">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-amber-200/70">Help & FAQ</p>
        <div className="rounded-xl border border-white/10 bg-[#241c16]">
          <button
            type="button"
            className="flex w-full items-start justify-between gap-2 p-3 text-left"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="text-sm font-semibold text-amber-50">{question}</span>
            <ChevronDown className={cn('size-4 shrink-0 text-amber-200/60 transition', open && 'rotate-180')} />
          </button>
          {open ? (
            <div className="border-t border-white/10 px-3 pb-3 pt-2">
              <p className="text-xs leading-relaxed text-amber-100/80">{answer}</p>
              <span className="mt-2 inline-block rounded-full bg-white/10 px-2 py-0.5 text-[9px] uppercase text-amber-100/70">
                {meta.label}
              </span>
            </div>
          ) : null}
        </div>
        {!draft.published ? (
          <p className="mt-2 flex items-center gap-1 text-[10px] text-amber-200/50">
            <EyeOff className="size-3" /> Hidden — not visible in app
          </p>
        ) : null}
      </div>
      <p className="text-xs text-muted-foreground">
        Published FAQs appear in <code className="rounded bg-muted px-1 py-0.5">GET /api/faq</code> for the mobile help screen.
      </p>
    </div>
  )
}

function ValidationChecklist({ draft }: { draft: DraftFaq }) {
  const v = validateFaq(draft)
  const items = [
    { ok: v.question, label: 'English question filled' },
    { ok: v.answer, label: 'English answer filled' },
    { ok: !!(draft.translations?.hi?.question?.trim() && draft.translations?.hi?.answer?.trim()), label: 'Hindi translation (recommended)' },
  ]

  return (
    <div className="grid gap-2 rounded-xl border border-border bg-muted/25 p-4">
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
        <Badge tone="success">
          <Sparkles className="size-3.5" /> Ready for app
        </Badge>
      ) : (
        <Badge tone="neutral">Complete required fields</Badge>
      )}
    </div>
  )
}

export default function FaqEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const isNew = location.pathname.endsWith('/faq/new')
  const navigate = useNavigate()
  const toast = useToast()
  const queryClient = useQueryClient()
  const faqQuery = useFaq()

  const initialCategory = searchParams.get('category') || 'General'
  const [draft, setDraft] = useState<DraftFaq>(() => ({
    ...emptyFaq,
    category: initialCategory,
    translations: {
      en: { question: '', answer: '', category: initialCategory },
      hi: { question: '', answer: '', category: '' },
    },
  }))
  const [deleteOpen, setDeleteOpen] = useState(false)

  const existing = useMemo(
    () => (isNew ? undefined : faqQuery.data?.find((item) => item._id === id)),
    [faqQuery.data, id, isNew],
  )

  useEffect(() => {
    if (isNew) {
      setDraft({
        ...emptyFaq,
        category: initialCategory,
        order: faqQuery.data?.length ?? 0,
        translations: {
          en: { question: '', answer: '', category: initialCategory },
          hi: { question: '', answer: '', category: '' },
        },
      })
      return
    }
    if (existing) setDraft(toDraft(existing))
  }, [isNew, existing, initialCategory, faqQuery.data?.length])

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.faq })

  const saveMutation = useMutation({
    mutationFn: endpoints.saveFaq,
    onSuccess: (item) => {
      invalidate()
      toast.success('FAQ saved')
      if (isNew) navigate(`/faq/edit/${item._id}`, { replace: true })
      else setDraft(toDraft(item))
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteFaq,
    onSuccess: () => {
      invalidate()
      toast.success('FAQ deleted')
      navigate('/faq')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const handleSave = (event?: FormEvent) => {
    event?.preventDefault()
    const v = validateFaq(draft)
    if (!v.ok) {
      toast.error('Question and answer are required in English')
      return
    }
    saveMutation.mutate(draft)
  }

  const meta = categoryMeta(draft.category || 'General')
  const CategoryIcon = meta.icon

  if (!isNew && faqQuery.isLoading) return <LoadingPanel label="Loading FAQ…" />
  if (faqQuery.isError) {
    return <ErrorState message="Could not load FAQ." onRetry={() => void faqQuery.refetch()} />
  }
  if (!isNew && !existing && !faqQuery.isLoading) {
    return (
      <div className="grid gap-4">
        <Link to="/faq" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="size-4" /> Back to FAQ
        </Link>
        <ErrorState message="FAQ item not found." onRetry={() => navigate('/faq')} />
      </div>
    )
  }

  return (
    <div className="grid gap-6 pb-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="grid gap-2">
          <Link to="/faq" className="inline-flex w-fit items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="size-4" /> FAQ — Help content
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <div className={cn('grid size-12 place-items-center rounded-2xl', meta.tone)}>
              <CategoryIcon className="size-6" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">
                {isNew ? 'New FAQ' : 'Edit FAQ'}
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {isNew ? 'Create a bilingual help entry for the mobile app.' : draft.question || 'Untitled question'}
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {!isNew ? (
            <Button type="button" variant="destructive" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="size-4" /> Delete
            </Button>
          ) : null}
          <Button type="button" onClick={() => handleSave()} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save FAQ
          </Button>
        </div>
      </div>

      <form className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]" onSubmit={handleSave}>
        <div className="grid gap-6">
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="text-base font-semibold">Question & answer</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              English is required. Hindi helps users who prefer the app in Hindi.
            </p>
            <div className="mt-4">
              <BilingualFields
                value={draft.translations}
                fields={[
                  { key: 'question', label: 'Question' },
                  { key: 'answer', label: 'Answer', multiline: true },
                  { key: 'category', label: 'Category label (per language)' },
                ]}
                onChange={(translations) => setDraft(syncFaqFromTranslations(draft, translations))}
              />
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <h2 className="text-base font-semibold">Display settings</h2>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Select
                  value={draft.category || 'General'}
                  onChange={(event) => {
                    const category = event.target.value
                    setDraft({
                      ...draft,
                      category,
                      translations: {
                        en: {
                          question: draft.translations?.en?.question || '',
                          answer: draft.translations?.en?.answer || '',
                          category,
                        },
                        hi: draft.translations?.hi || { question: '', answer: '', category: '' },
                      },
                    })
                  }}
                >
                  {FAQ_CATEGORY_PRESETS.map((preset) => (
                    <option key={preset.value} value={preset.value}>
                      {preset.label}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="Sort order">
                <Input
                  type="number"
                  min={0}
                  value={draft.order ?? 0}
                  onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })}
                />
              </Field>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-xl border border-border bg-muted/20 p-4">
              <div>
                <p className="text-sm font-medium">Published in app</p>
                <p className="text-xs text-muted-foreground">Hidden items stay in admin only</p>
              </div>
              <Switch
                checked={!!draft.published}
                onCheckedChange={(checked) => setDraft({ ...draft, published: checked })}
              />
            </div>
          </section>
        </div>

        <aside className="grid h-fit gap-4 xl:sticky xl:top-6">
          <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
            <FaqAppPreview draft={draft} />
          </section>
          <ValidationChecklist draft={draft} />
        </aside>
      </form>

      <ConfirmDialog
        open={deleteOpen}
        title="Delete FAQ"
        description={`Delete "${draft.question || 'this FAQ'}"? This cannot be undone.`}
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => existing && deleteMutation.mutate(existing._id)}
      />
    </div>
  )
}
