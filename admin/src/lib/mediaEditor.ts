import type { MediaCategory, MediaItem, MediaSourceType, YouTubeResult } from '@/api/types'

export type DraftMedia = Partial<MediaItem> & {
  tagsText?: string
  thumbnailFile?: File
  audioFile?: File
  videoFile?: File
}

export const MEDIA_CATEGORIES: Array<{ value: MediaCategory; label: string; hint: string; icon: string }> = [
  { value: 'mantra', label: 'Mantra', hint: 'Gayatri, Mahamrityunjaya, Shiva, Durga', icon: '🕉️' },
  { value: 'spiritual_music', label: 'Spiritual Music', hint: 'Flute, temple bells, om, rain, tanpura', icon: '🎵' },
  { value: 'bhajan', label: 'Bhajan', hint: 'Krishna, Hanuman, Ram, Shiv bhajan', icon: '🙏' },
]

export const MEDIA_LANGUAGES = [
  { value: 'hi', label: 'Hindi' },
  { value: 'en', label: 'English' },
  { value: 'sa', label: 'Sanskrit' },
] as const

export const SOURCE_OPTIONS: Array<{ value: MediaSourceType; label: string; description: string }> = [
  { value: 'audio', label: 'Audio file / URL', description: 'Upload mp3/wav or paste a direct audio link — plays in app player' },
  { value: 'video', label: 'Video file / URL', description: 'Upload mp4/webm or paste link — opens in app video player' },
  { value: 'youtube', label: 'YouTube', description: 'Embed a YouTube video in the app' },
  { value: 'external', label: 'External link', description: 'Opens source URL in browser' },
]

export const emptyMedia = (): DraftMedia => ({
  title: '',
  subtitle: '',
  artist: '',
  translations: { en: { title: '', subtitle: '', artist: '' }, hi: { title: '', subtitle: '', artist: '' } },
  category: 'mantra',
  subCategory: '',
  language: 'hi',
  sourceType: 'audio',
  audioUrl: '',
  videoUrl: '',
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
})

export function toDraft(item?: MediaItem): DraftMedia {
  if (!item) return emptyMedia()
  return {
    ...item,
    translations: item.translations || {
      en: { title: item.title || '', subtitle: item.subtitle || '', artist: item.artist || '' },
      hi: { title: '', subtitle: '', artist: '' },
    },
    tagsText: (item.tags || []).join(', '),
  }
}

export function fromYouTube(result: YouTubeResult, category: MediaCategory): DraftMedia {
  return {
    ...emptyMedia(),
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

export function syncMediaFromTranslations(draft: DraftMedia, translations: DraftMedia['translations']): DraftMedia {
  return {
    ...draft,
    translations,
    title: translations?.en?.title || draft.title || '',
    subtitle: translations?.en?.subtitle || draft.subtitle || '',
    artist: translations?.en?.artist || draft.artist || '',
  }
}

export function youtubeEmbed(id?: string) {
  return id ? `https://www.youtube.com/embed/${id}` : ''
}

export function youtubeIdFromInput(value?: string) {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^[a-zA-Z0-9_-]{8,}$/.test(text) && !text.includes('/')) return text
  const match = text.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]+)/)
  return match ? match[1] : ''
}

export type MediaValidation = {
  ok: boolean
  title: boolean
  source: boolean
  thumbnail: boolean
}

export function validateMedia(draft: DraftMedia): MediaValidation {
  const hasTitle = !!draft.title?.trim()
  let hasSource = false
  if (draft.sourceType === 'youtube') hasSource = !!(draft.youtubeVideoId || youtubeIdFromInput(draft.youtubeUrl))
  else if (draft.sourceType === 'audio') hasSource = !!(draft.audioUrl || draft.audioFile)
  else if (draft.sourceType === 'video') hasSource = !!(draft.videoUrl || draft.videoFile)
  else hasSource = !!(draft.sourceUrl?.trim())
  const thumbnail = !!(draft.thumbnailImage || draft.thumbnailFile)
  return { ok: hasTitle && hasSource, title: hasTitle, source: hasSource, thumbnail }
}

export function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
