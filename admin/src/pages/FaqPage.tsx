import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Save, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useFaq } from '@/api/queries'
import type { FaqItem } from '@/api/types'
import { BilingualFields } from '@/components/BilingualFields'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, Input, Textarea } from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/toast'

type DraftFaq = Partial<FaqItem>

const emptyFaq: DraftFaq = {
  question: '',
  answer: '',
  translations: { en: { question: '', answer: '', category: '' }, hi: { question: '', answer: '', category: '' } },
  category: 'General',
  order: 0,
  published: true,
}

export default function FaqPage() {
  const faq = useFaq()
  const [draft, setDraft] = useState<DraftFaq>({ ...emptyFaq })
  const [deleteTarget, setDeleteTarget] = useState<FaqItem | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.faq })

  const saveMutation = useMutation({
    mutationFn: endpoints.saveFaq,
    onSuccess: (item) => {
      setDraft(item)
      invalidate()
      toast.success('FAQ saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteFaq,
    onSuccess: () => {
      setDeleteTarget(null)
      setDraft({ ...emptyFaq })
      invalidate()
      toast.success('FAQ deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  return (
    <div className="grid gap-6">
      <PageHeader
        title="FAQ"
        description="Maintain public help content shown in the mobile app."
        action={<Button type="button" variant="secondary" onClick={() => setDraft({ ...emptyFaq })}><Plus className="size-4" />New FAQ</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          {faq.isLoading ? <LoadingRows /> : null}
          {faq.isError ? <ErrorState message="Could not load FAQ." onRetry={() => void faq.refetch()} /> : null}
          {faq.data && faq.data.length === 0 ? <EmptyState title="No FAQ items yet." /> : null}
          <div className="grid gap-3">
            {faq.data?.map((item) => (
              <button key={item._id} type="button" onClick={() => setDraft(item)} className="rounded-md border border-border bg-background p-3 text-left transition hover:bg-muted/60 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{item.question}</p>
                  <Badge tone={item.published ? 'success' : 'neutral'}>{item.published ? 'published' : 'hidden'}</Badge>
                  <Badge>{item.category}</Badge>
                </div>
                <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.answer}</p>
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
            <h2 className="text-base font-semibold">{draft._id ? 'Edit FAQ' : 'Create FAQ'}</h2>
            <Button type="submit" disabled={saveMutation.isPending}><Save className="size-4" />Save</Button>
          </div>
          <div className="grid gap-4">
            <BilingualFields
              value={draft.translations}
              fields={[
                { key: 'question', label: 'Question' },
                { key: 'answer', label: 'Answer', multiline: true },
                { key: 'category', label: 'Category' },
              ]}
              onChange={(translations) => setDraft({
                ...draft,
                translations,
                question: translations.en.question || draft.question,
                answer: translations.en.answer || draft.answer,
                category: translations.en.category || draft.category,
              })}
            />
            <Field label="Question">
              <Input value={draft.question || ''} onChange={(event) => setDraft({ ...draft, question: event.target.value })} required />
            </Field>
            <Field label="Answer">
              <Textarea value={draft.answer || ''} onChange={(event) => setDraft({ ...draft, answer: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Category">
                <Input value={draft.category || ''} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
              </Field>
              <Field label="Order">
                <Input type="number" value={draft.order || 0} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} />
              </Field>
            </div>
            <div className="flex items-center justify-between rounded-md border border-border p-3">
              <span className="text-sm font-medium">Published</span>
              <Switch checked={!!draft.published} onCheckedChange={(checked) => setDraft({ ...draft, published: checked })} />
            </div>
            {draft._id ? (
              <Button type="button" variant="destructive" onClick={() => setDeleteTarget(draft as FaqItem)}>
                <Trash2 className="size-4" />
                Delete FAQ
              </Button>
            ) : null}
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ"
        description={`Delete ${deleteTarget?.question || 'this FAQ'}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
