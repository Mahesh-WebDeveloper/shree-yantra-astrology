import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowDown, ArrowUp, BookOpen, Database, Headphones, Pencil, Plus, Search, Trash2 } from 'lucide-react'

import { apiErrorMessage } from '@/api/client'
import { endpoints } from '@/api/endpoints'
import { queryKeys, useBooks, useLibraryOverview } from '@/api/queries'
import type { Book } from '@/api/types'
import { assetUrl } from '@/api/assets'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { EmptyState, ErrorState, LoadingRows } from '@/components/DataState'
import { PageHeader } from '@/components/PageHeader'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/form'
import { useToast } from '@/components/ui/toast'

export default function LibraryPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [publishedFilter, setPublishedFilter] = useState<'' | 'true' | 'false'>('')
  const bookParams = useMemo(
    () => ({ search: search || undefined, published: publishedFilter || undefined }),
    [search, publishedFilter],
  )
  const books = useBooks(bookParams)
  const overview = useLibraryOverview()
  const [deleteTarget, setDeleteTarget] = useState<Book | null>(null)
  const queryClient = useQueryClient()
  const toast = useToast()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: queryKeys.books })
    void queryClient.invalidateQueries({ queryKey: queryKeys.libraryOverview })
  }

  const rows = books.data ?? []
  const chapterCount = (book: Book) => (book.chapters || []).length

  const deleteMutation = useMutation({
    mutationFn: endpoints.deleteBook,
    onSuccess: () => {
      setDeleteTarget(null)
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

  const moveBook = (book: Book, direction: -1 | 1) => {
    if (!books.data) return
    const sorted = [...rows]
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
        description="Live content from MongoDB — same database the mobile app reads. Scripture counts are imported real texts; CMS books below are admin-managed extras."
        action={
          <div className="flex flex-wrap items-center gap-2">
            {overview.data ? (
              <Badge tone="success">
                <Database className="size-3.5" />
                Live · {overview.data.source}
              </Badge>
            ) : null}
            <Button type="button" onClick={() => navigate('/library/new')}><Plus className="size-4" />Add book</Button>
          </div>
        }
      />

      {overview.isLoading ? <LoadingRows /> : null}
      {overview.isError ? <ErrorState message="Could not load live library overview from database." onRetry={() => void overview.refetch()} /> : null}
      {overview.data ? (
        <section className="grid gap-4 rounded-lg border border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-base font-semibold">App library — live from database</h2>
            <p className="text-xs text-muted-foreground">Updated {new Date(overview.data.at).toLocaleString('en-IN')}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
              { label: 'Bhagavad Gita chapters', value: overview.data.scriptures.gitaChapters, icon: BookOpen },
              { label: 'Ramayan sargas', value: overview.data.scriptures.ramayanSargas, icon: BookOpen },
              { label: 'Veda / Purana sections', value: overview.data.scriptures.vedaTextSections, icon: BookOpen },
              { label: 'Rigveda suktas', value: overview.data.scriptures.rigvedaSuktas, icon: BookOpen },
              { label: 'Ramcharitmanas kandas', value: overview.data.scriptures.ramcharitmanasKandas, icon: BookOpen },
              { label: 'Audio / media items', value: overview.data.media.published, sub: `${overview.data.media.total} total`, icon: Headphones },
              { label: 'User saved progress', value: overview.data.appUsage.userDataProfiles, sub: 'bookmarks & reading', icon: Database },
              { label: 'CMS books (admin)', value: overview.data.cmsBooks.published, sub: `${overview.data.cmsBooks.total} total`, icon: BookOpen },
            ].map((item) => (
              <div key={item.label} className="rounded-md border border-border bg-background p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">{item.label}</p>
                  <item.icon className="size-4 text-primary" />
                </div>
                <p className="mt-2 text-2xl font-semibold tabular-nums">{item.value.toLocaleString('en-IN')}</p>
                {item.sub ? <p className="mt-1 text-xs text-muted-foreground">{item.sub}</p> : null}
              </div>
            ))}
          </div>
          {overview.data.scriptures.vedaBreakdown.length > 0 ? (
            <div className="flex flex-wrap gap-2 pt-1">
              {overview.data.scriptures.vedaBreakdown.slice(0, 12).map((v) => (
                <Badge key={v.veda}>{v.veda}: {v.sections.toLocaleString('en-IN')} sections</Badge>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-lg border border-border bg-card p-3 sm:p-4">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold">CMS books (admin-created)</h2>
            <p className="mt-1 text-xs text-muted-foreground">Click a book to open the full editor · Published books appear in the app instantly</p>
          </div>
          <Button type="button" variant="secondary" onClick={() => navigate('/library/new')}><Plus className="size-4" />Add book</Button>
        </div>
        <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_160px]">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search books by title" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Select value={publishedFilter} onChange={(e) => setPublishedFilter(e.target.value as '' | 'true' | 'false')} aria-label="Filter by publish status">
            <option value="">All books</option>
            <option value="true">Published only</option>
            <option value="false">Drafts only</option>
          </Select>
        </div>
        {books.isLoading ? <LoadingRows /> : null}
        {books.isError ? <ErrorState message="Could not load library." onRetry={() => void books.refetch()} /> : null}
        {books.data && rows.length === 0 ? (
          <EmptyState
            title={search || publishedFilter ? 'No CMS books match your filters.' : 'No admin CMS books yet — add your first book and it will show in the mobile app under Books & Learning.'}
            action={
              !search && !publishedFilter ? (
                <Button type="button" onClick={() => navigate('/library/new')}><Plus className="size-4" />Add first book</Button>
              ) : undefined
            }
          />
        ) : null}
        {books.data && rows.length > 0 ? (
          <div className="grid gap-3">
            {rows.map((book, index) => (
              <div key={book._id} className="flex flex-col gap-3 rounded-md border border-border bg-background p-3 sm:flex-row sm:items-center">
                <div className="h-24 w-full shrink-0 overflow-hidden rounded-md bg-muted sm:h-20 sm:w-16">
                  {book.coverImage ? <img src={assetUrl(book.coverImage)} alt="" className="size-full object-cover" /> : null}
                </div>
                <button
                  type="button"
                  className="min-w-0 flex-1 text-left"
                  onClick={() => navigate(`/library/edit/${book._id}`)}
                >
                  <p className="truncate font-medium">{book.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{book.description || book.author || 'No description'}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge tone={book.published ? 'success' : 'neutral'}>{book.published ? 'published' : 'draft'}</Badge>
                    {book.isPremium ? <Badge tone="warning">premium</Badge> : null}
                    <Badge>{chapterCount(book)} chapters</Badge>
                  </div>
                </button>
                <div className="grid grid-cols-4 gap-2 sm:flex">
                  <Button type="button" variant="secondary" size="icon" onClick={() => navigate(`/library/edit/${book._id}`)} aria-label="Edit book">
                    <Pencil className="size-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="icon" disabled={index === 0} onClick={() => moveBook(book, -1)} aria-label="Move up">
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="secondary" size="icon" disabled={index === rows.length - 1} onClick={() => moveBook(book, 1)} aria-label="Move down">
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
