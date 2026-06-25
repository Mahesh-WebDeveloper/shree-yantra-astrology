// Yatharth Geeta (Bhagavad Gita audio commentary) — fetched once, organized for the
// Gita reader: per-chapter audio + ordered playlist (queue) for auto-next.
import { useEffect, useMemo, useState } from 'react';
import { getMedia, avatarUrl, MediaItem } from '../lib/api';
import { Track } from '../data/library';

export function gitaTrack(m: MediaItem): Track {
  return {
    id: m._id,
    title: m.title,
    sub: m.subtitle || m.artist || '',
    color: 'gold',
    source: avatarUrl(m.audioUrl) || m.audioUrl || '',
    loop: false,
  };
}

export interface GitaAudio {
  items: MediaItem[];          // ordered: prakkathan, ch1..18, upasham
  queue: Track[];              // full playlist (auto-next)
  byChapter: Map<number, MediaItem>;
  prakkathan?: MediaItem;
  upasham?: MediaItem;
  ready: boolean;
}

export function useGitaAudio(): GitaAudio {
  const [raw, setRaw] = useState<MediaItem[] | null>(null);

  useEffect(() => {
    let on = true;
    getMedia()
      .then((r) => { if (on) setRaw((r.media || []).filter((m) => /^yatharth_geeta/.test(m.subCategory || ''))); })
      .catch(() => { if (on) setRaw([]); });
    return () => { on = false; };
  }, []);

  return useMemo(() => {
    const items = [...(raw || [])].sort((a, b) => (a.order || 0) - (b.order || 0));
    const byChapter = new Map<number, MediaItem>();
    for (const m of items) {
      const mm = (m.subCategory || '').match(/chapter_(\d+)/);
      if (mm) byChapter.set(Number(mm[1]), m);
    }
    return {
      items,
      queue: items.map(gitaTrack),
      byChapter,
      prakkathan: items.find((m) => /prakkathan/.test(m.subCategory || '')),
      upasham: items.find((m) => /upasham/.test(m.subCategory || '')),
      ready: raw !== null,
    };
  }, [raw]);
}
