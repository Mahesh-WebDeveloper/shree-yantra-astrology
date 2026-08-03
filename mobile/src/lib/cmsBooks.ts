import type { ContentBook } from './api';
import type { LibraryItem, TrackColor } from '../data/library';

export const CMS_BOOK_PREFIX = 'cms:';

export function cmsBookId(rawId: string) {
  return `${CMS_BOOK_PREFIX}${rawId}`;
}

export function isCmsBookId(bookId: string) {
  return bookId.startsWith(CMS_BOOK_PREFIX);
}

export function cmsRawId(bookId: string) {
  return bookId.slice(CMS_BOOK_PREFIX.length);
}

const COLORS: TrackColor[] = ['gold', 'purple', 'green', 'rose', 'blue'];

/** Map admin-published CMS book → same LibraryItem shape as static scriptures. */
export function cmsToLibraryItem(book: ContentBook): LibraryItem {
  const chapters = book.chapters?.length || 0;
  const idx = Math.abs(book.order ?? 0) % COLORS.length;
  return {
    id: cmsBookId(book._id),
    type: 'scripture',
    title: book.title,
    subtitle: chapters
      ? `${chapters} ${chapters === 1 ? 'chapter' : 'chapters'}`
      : (book.category || book.author || ''),
    color: COLORS[idx],
    hindi: book.title,
    bookId: cmsBookId(book._id),
    glyph: 'star',
    coverImage: book.coverImage,
  };
}
