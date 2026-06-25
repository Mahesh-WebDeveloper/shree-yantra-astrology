import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useBooks } from '@/api/queries'
import type { Book, BookChapter } from '@/api/types'
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

type DraftBook = Partial<Book> & { coverFile?: File }

const emptyBook: DraftBook = {
  title: '',
  author: '',
  translations: { en: { title: '', author: '', category: '', description: '' }, hi: { title: '', author: '', category: '', description: '' } },
  coverImage: '',
  category: 'General',
  description: '',
  language: 'en',
  chapters: [],
  isPremium: false,
  published: false,
  order: 0,
}

function normalizeDraft(book?: Book): DraftBook {
  return book ? {
    ...book,
    translations: book.translations || {
      en: { title: book.title || '', author: book.author || '', category: book.category || '', description: book.description || '' },
      hi: { title: '', author: '', category: '', description: '' },
    },
    chapters: (book.chapters || []).map((chapter) => ({
      ...chapter,
      translations: chapter.translations || {
        en: { title: chapter.title || '', content: chapter.content || '' },
        hi: { title: '', content: '' },
      },
    })),
  } : { ...emptyBook, chapters: [], translations: { ...emptyBook.translations! } }
}

export default function LibraryPage() {
  const books = useBooks()
  const [draft, setDraft] = useState<DraftBook>(() => normalizeDraft())
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => void queryClient.invalidateQueries({ queryKey: queryKeys.books })

  const saveMutation = useMutation({
    mutationFn: endpoints.saveBook,
    onSuccess: (book) => {
      setDraft(normalizeDraft(book))
      invalidate()
      toast.success('Book saved')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteBook,
    onSuccess: () => {
      setDeleteTarget(null)
      setDraft(normalizeDraft())
      invalidate()
      toast.success('Book deleted')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const reorderMutation = useMutation({
    mutationFn: endpoints.reorderBooks,
    onSuccess: () => {
      invalidate()
      toast.success('Order updated')
    },
    onError: (error) => toast.error(apiErrorMessage(error)),
  })

  const setChapter = (index: number, patch: Partial<BookChapter>) => {
    const chapters = [...(draft.chapters || [])]
    chapters[index] = { ...chapters[index], ...patch } as BookChapter
    setDraft({ ...draft, chapters })
  }

  const addChapter = () => {
    const chapters = draft.chapters || []
    setDraft({
      ...draft,
      chapters: [...chapters, {
        title: '',
        order: chapters.length,
        content: '',
        audioUrl: '',
        translations: { en: { title: '', content: '' }, hi: { title: '', content: '' } },
      }],
    })
  }

  const moveBook = (book: Book, direction: -1 | 1) => {
    if (!books.data) return
    const sorted = [...books.data]
    const index = sorted.findIndex((item) => item._id === book._id)
    const swap = index + direction
    if (index < 0 || swap < 0 || swap >= sorted.length) return
    ;[sorted[index], sorted[swap]] = [sorted[swap], sorted[index]]
    reorderMutation.mutate(sorted.map((item, order) => ({ id: item._id, order })))
  }

  return (
    <div className="grid gap-6">
      <PageHeader
        title="Library"
        description="Manage books, chapters, cover images, premium status, and publishing."
        action={<Button type="button" variant="secondary" onClick={() => setDraft(normalizeDraft())}><Plus className="size-4" />New book</Button>}
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_460px]">
        <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
          {books.isLoading ? <LoadingRows /> : null}
          {books.isError ? <ErrorState message="Could not load library." onRetry={() => void books.refetch()} /> : null}
          {books.data && books.data.length === 0 ? <EmptyState title="No books created yet." /> : null}
          {books.data && books.data.length > 0 ? (
            <div className="grid gap-3">
              {books.data.map((book, index) => (
                <div key={book._id} className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center">
                  <div className="h-24 w-full shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-16">
                    {book.coverImage ? <img src={assetUrl(book.coverImage)} alt="" className="size-full object-cover" /> : null}
                  </div>
                  <button type="button" className="min-w-0 flex-1 text-left" onClick={() => setDraft(normalizeDraft(book))}>
                    <p className="truncate font-medium">{book.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{book.description || book.author || 'No description'}</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge tone={book.published ? 'success' : 'neutral'}>{book.published ? 'published' : 'draft'}</Badge>
                      {book.isPremium ? <Badge tone="warning">premium</Badge> : null}
                      <Badge>{book.chapters.length} chapters</Badge>
                    </div>
                  </button>
                  <div className="grid grid-cols-3 gap-2 sm:flex">
                    <Button type="button" variant="secondary" size="icon" disabled={index === 0} onClick={() => moveBook(book, -1)} aria-label="Move up">
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button type="button" variant="secondary" size="icon" disabled={index === books.data.length - 1} onClick={() => moveBook(book, 1)} aria-label="Move down">
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button type="button" variant="destructive" size="icon" onClick={() => setDeleteTarget(book)} aria-label="Delete book">
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </section>

        <form
          className="rounded-lg border border-border bg-card p-3 sm:p-4"
          onSubmit={(event) => {
            event.preventDefault()
            saveMutation.mutate(draft)
          }}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-base font-semibold">{draft._id ? 'Edit book' : 'Create book'}</h2>
            <Button type="submit" disabled={saveMutation.isPending}><Save className="size-4" />Save</Button>
          </div>
          <div className="grid gap-4">
            <BilingualFields
              value={draft.translations}
              fields={[
                { key: 'title', label: 'Title' },
                { key: 'author', label: 'Author' },
                { key: 'category', label: 'Category' },
                { key: 'description', label: 'Description', multiline: true },
              ]}
              onChange={(translations) => setDraft({
                ...draft,
                translations,
                title: translations.en.title || draft.title,
                author: translations.en.author || draft.author,
                category: translations.en.category || draft.category,
                description: translations.en.description || draft.description,
              })}
            />
            <Field label="Title">
              <Input value={draft.title || ''} onChange={(event) => setDraft({ ...draft, title: event.target.value })} required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Author">
                <Input value={draft.author || ''} onChange={(event) => setDraft({ ...draft, author: event.target.value })} />
              </Field>
              <Field label="Category">
                <Input value={draft.category || ''} onChange={(event) => setDraft({ ...draft, category: event.target.value })} />
              </Field>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Language">
                <Select value={draft.language || 'en'} onChange={(event) => setDraft({ ...draft, language: event.target.value })}>
                  <option value="en">English</option>
                  <option value="hi">Hindi</option>
                  <option value="mr">Marathi</option>
                  <option value="ta">Tamil</option>
                </Select>
              </Field>
              <Field label="Order">
                <Input type="number" value={draft.order || 0} onChange={(event) => setDraft({ ...draft, order: Number(event.target.value) })} />
              </Field>
            </div>
            <Field label="Description">
              <Textarea value={draft.description || ''} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
            </Field>
            <Field label="Cover image">
              <Input type="file" accept="image/*" onChange={(event) => setDraft({ ...draft, coverFile: event.target.files?.[0] })} />
            </Field>
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
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Chapters</h3>
                <Button type="button" variant="secondary" size="sm" onClick={addChapter}><Plus className="size-4" />Chapter</Button>
              </div>
              {(draft.chapters || []).map((chapter, index) => (
                <div key={index} className="grid gap-3 rounded-md border border-border bg-background p-3">
                  <BilingualFields
                    value={chapter.translations}
                    fields={[
                      { key: 'title', label: 'Chapter title' },
                      { key: 'content', label: 'Content', multiline: true },
                    ]}
                    onChange={(translations) => setChapter(index, {
                      translations,
                      title: translations.en.title || chapter.title,
                      content: translations.en.content || chapter.content,
                    })}
                  />
                  <Input placeholder="Chapter title" value={chapter.title} onChange={(event) => setChapter(index, { title: event.target.value })} />
                  <Textarea placeholder="Content" value={chapter.content} onChange={(event) => setChapter(index, { content: event.target.value })} />
                  <Input placeholder="Audio URL" value={chapter.audioUrl} onChange={(event) => setChapter(index, { audioUrl: event.target.value })} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setDraft({ ...draft, chapters: (draft.chapters || []).filter((_, chapterIndex) => chapterIndex !== index) })}
                  >
                    Remove chapter
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </form>
      </div>
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete book"
        description={`Delete ${deleteTarget?.title || 'this book'}?`}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget._id)}
      />
    </div>
  )
}
