import type { Book, BookChapter } from '@/api/types'

export type DraftBook = Partial<Book> & { coverFile?: File }

export const BOOK_CATEGORIES = [
  'General',
  'Scripture',
  'Learning',
  'Mantra',
  'Devotion',
  'Stories',
] as const

export const BOOK_LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' },
  { value: 'mr', label: 'Marathi' },
  { value: 'ta', label: 'Tamil' },
] as const

export const emptyChapter = (order = 0): BookChapter => ({
  title: '',
  order,
  content: '',
  audioUrl: '',
  translations: { en: { title: '', content: '' }, hi: { title: '', content: '' } },
})

export const emptyBook: DraftBook = {
  title: '',
  author: '',
  translations: {
    en: { title: '', author: '', category: '', description: '' },
    hi: { title: '', author: '', category: '', description: '' },
  },
  coverImage: '',
  category: 'General',
  description: '',
  language: 'en',
  chapters: [],
  isPremium: false,
  published: true,
  order: 0,
}

export function normalizeDraft(book?: Book): DraftBook {
  if (!book) {
    return { ...emptyBook, chapters: [emptyChapter(0)], translations: { ...emptyBook.translations! } }
  }
  return {
    ...book,
    translations: book.translations || {
      en: {
        title: book.title || '',
        author: book.author || '',
        category: book.category || '',
        description: book.description || '',
      },
      hi: { title: '', author: '', category: '', description: '' },
    },
    chapters: (book.chapters || []).length
      ? (book.chapters || []).map((chapter, index) => ({
          ...chapter,
          order: chapter.order ?? index,
          translations: chapter.translations || {
            en: { title: chapter.title || '', content: chapter.content || '' },
            hi: { title: '', content: '' },
          },
        }))
      : [emptyChapter(0)],
  }
}

export function newBookDraft(): DraftBook {
  return normalizeDraft()
}

export function wordCount(text?: string) {
  if (!text?.trim()) return 0
  return text.trim().split(/\s+/).filter(Boolean).length
}

export type BookValidation = {
  ok: boolean
  title: boolean
  chapters: boolean
  chapterTitles: boolean
  cover: boolean
}

export function validateBook(draft: DraftBook): BookValidation {
  const chapters = draft.chapters || []
  const hasTitle = !!draft.title?.trim()
  const hasChapters = chapters.length > 0
  const chapterTitles = hasChapters && chapters.every((c) => c.title?.trim())
  const cover = !!(draft.coverImage || draft.coverFile)
  return {
    ok: hasTitle && hasChapters && chapterTitles,
    title: hasTitle,
    chapters: hasChapters,
    chapterTitles,
    cover,
  }
}

export function syncBookFromTranslations(draft: DraftBook, translations: DraftBook['translations']): DraftBook {
  return {
    ...draft,
    translations,
    title: translations?.en?.title || draft.title || '',
    author: translations?.en?.author || draft.author || '',
    category: translations?.en?.category || draft.category || 'General',
    description: translations?.en?.description || draft.description || '',
  }
}

export function reorderChapters(chapters: BookChapter[], from: number, to: number): BookChapter[] {
  if (from === to || from < 0 || to < 0 || from >= chapters.length || to >= chapters.length) return chapters
  const next = [...chapters]
  const [moved] = next.splice(from, 1)
  next.splice(to, 0, moved)
  return next.map((chapter, index) => ({ ...chapter, order: index }))
}
