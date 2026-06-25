import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { TRACKS, Track } from '../data/library';

interface PlayerCtx {
  track: Track | null;
  isPlaying: boolean;
  position: number; // seconds
  duration: number; // seconds
  /** play this track; optional queue makes next/prev + auto-advance walk that list */
  play: (t: Track, queue?: Track[]) => void;
  toggle: () => void;
  seekTo: (seconds: number) => void;
  seekFraction: (f: number) => void;
  next: () => void;
  prev: () => void;
  stop: () => void;
  /** remote audio buffering (show a spinner instead of play icon) */
  loading: boolean;
  /** full-screen player visibility */
  expanded: boolean;
  setExpanded: (v: boolean) => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // One long-lived player; we swap its source with replace().
  const player = useMemo(() => createAudioPlayer(null), []);
  const status = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [expanded, setExpanded] = useState(false);
  const finishedRef = useRef<string | null>(null); // auto-advance dedupe

  useEffect(() => {
    // background playback ON — long audio (Gita chapters/bhajans) screen-lock par bhi chalta rahe
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {});
    return () => {
      try { player.remove(); } catch (_) {}
    };
  }, [player]);

  const play = useCallback(
    (t: Track, q?: Track[]) => {
      if (track?.id === t.id) {
        if (player.playing) player.pause();
        else player.play();
        return;
      }
      setQueue(q ?? []); // q diya to uss playlist par next/prev/auto-advance; warna static TRACKS
      finishedRef.current = null;
      setTrack(t);
      player.replace(t.source);
      // ambient drones loop (seamless); long-form audio (loop:false) ek baar chalke ruk jaaye
      player.loop = t.loop !== false;
      player.play();
    },
    [player, track]
  );

  const toggle = useCallback(() => {
    if (!track) return;
    if (player.playing) player.pause();
    else player.play();
  }, [player, track]);

  const seekTo = useCallback((s: number) => { player.seekTo(Math.max(0, s)).catch(() => {}); }, [player]);

  const seekFraction = useCallback(
    (f: number) => {
      const d = status?.duration || 0;
      if (d > 0) player.seekTo(Math.max(0, Math.min(d, f * d))).catch(() => {});
    },
    [player, status]
  );

  const step = useCallback(
    (dir: 1 | -1) => {
      const list = queue.length ? queue : TRACKS;
      const i = track ? list.findIndex((t) => t.id === track.id) : -1;
      if (i < 0) { if (list[0]) play(list[0], queue.length ? queue : undefined); return; }
      const ni = (i + dir + list.length) % list.length;
      play(list[ni], queue.length ? queue : undefined);
    },
    [queue, track, play]
  );

  // auto-advance: long-form track (loop:false) khatam -> playlist ka agla chapter
  useEffect(() => {
    if (!track || track.loop !== false) return;
    if ((status as any)?.didJustFinish && finishedRef.current !== track.id) {
      finishedRef.current = track.id;
      const list = queue.length ? queue : [];
      const i = list.findIndex((t) => t.id === track.id);
      if (i >= 0 && i < list.length - 1) play(list[i + 1], list);
    }
  }, [status, track, queue, play]);

  const stop = useCallback(() => {
    try { player.pause(); } catch (_) {}
    setTrack(null);
    setExpanded(false);
  }, [player]);

  const value: PlayerCtx = {
    track,
    isPlaying: !!track && !!status?.playing,
    position: status?.currentTime ?? 0,
    duration: status?.duration ?? 0,
    play,
    toggle,
    seekTo,
    seekFraction,
    next: () => step(1),
    prev: () => step(-1),
    stop,
    // buffering: track selected but expo-audio abhi load/buffer kar raha hai (remote audio)
    loading: !!track && !!(status as any) && ((status as any).isBuffering === true || (status as any).isLoaded === false),
    expanded,
    setExpanded,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePlayer(): PlayerCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

export const fmtTime = (s: number) => {
  const t = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(t / 3600);
  const m = Math.floor((t % 3600) / 60);
  const sec = t % 60;
  const ss = sec < 10 ? `0${sec}` : String(sec);
  if (h > 0) {
    const mm = m < 10 ? `0${m}` : String(m);
    return `${h}:${mm}:${ss}`;
  }
  return `${m}:${ss}`;
};
