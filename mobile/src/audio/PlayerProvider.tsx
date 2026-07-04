import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useWindowDimensions } from 'react-native';
import { useSharedValue, withSpring, withTiming, runOnJS, SharedValue } from 'react-native-reanimated';
import { createAudioPlayer, useAudioPlayerStatus, setAudioModeAsync } from 'expo-audio';
import { TRACKS, Track } from '../data/library';

// shared spring for the player sheet open/close + interactive drag
export const SHEET_SPRING = { damping: 26, stiffness: 240, mass: 0.8 } as const;

interface PlayerCtx {
  track: Track | null;
  isPlaying: boolean;
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
  /** shared sheet offset (px from open): 0 = full open, screenH = closed.
   *  Driven interactively by the mini-bar drag and the full-player drag. */
  sheetY: SharedValue<number>;
  /** screen height (the closed offset) */
  screenH: number;
  /** animate the full player open / closed */
  openSheet: () => void;
  closeSheet: () => void;
}

const Ctx = createContext<PlayerCtx | null>(null);

// HOT context — position/duration tick several times a second while audio plays.
// Kept SEPARATE so that only the seekbar/time labels re-render on every tick; screens
// using usePlayer() (Library, Gita, playlists…) stay perfectly still → no scroll jank.
interface PlayerTimeCtx { position: number; duration: number }
const TimeCtx = createContext<PlayerTimeCtx>({ position: 0, duration: 0 });

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  // One long-lived player; we swap its source with replace().
  const player = useMemo(() => createAudioPlayer(null), []);
  const status = useAudioPlayerStatus(player);
  const [track, setTrack] = useState<Track | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [expanded, setExpanded] = useState(false);
  const finishedRef = useRef<string | null>(null); // auto-advance dedupe

  const { height: screenH } = useWindowDimensions();
  const sheetY = useSharedValue(screenH); // start closed (off-screen bottom)

  const openSheet = useCallback(() => {
    setExpanded(true);
    sheetY.value = screenH;                      // start from the bottom…
    sheetY.value = withSpring(0, SHEET_SPRING);  // …spring up to full
  }, [screenH, sheetY]);

  const closeSheet = useCallback(() => {
    sheetY.value = withTiming(screenH, { duration: 230 }, (finished) => {
      if (finished) runOnJS(setExpanded)(false);
    });
  }, [screenH, sheetY]);

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

  const isPlaying = !!track && !!status?.playing;
  // buffering: track selected but expo-audio abhi load/buffer kar raha hai (remote audio)
  const loading = !!track && !!(status as any) && ((status as any).isBuffering === true || (status as any).isLoaded === false);
  const next = useCallback(() => step(1), [step]);
  const prev = useCallback(() => step(-1), [step]);

  // STABLE value — memoized on discrete events only (track change, play/pause, buffer,
  // expand). It does NOT change on position ticks, so usePlayer() consumers (screens,
  // mini-bar shell) do not re-render several times a second while audio plays.
  const value = useMemo<PlayerCtx>(
    () => ({
      track, isPlaying, play, toggle, seekTo, seekFraction, next, prev, stop,
      loading, expanded, setExpanded, sheetY, screenH, openSheet, closeSheet,
    }),
    [track, isPlaying, play, toggle, seekTo, seekFraction, next, prev, stop, loading, expanded, sheetY, screenH, openSheet, closeSheet]
  );

  const time = useMemo<PlayerTimeCtx>(
    () => ({ position: status?.currentTime ?? 0, duration: status?.duration ?? 0 }),
    [status?.currentTime, status?.duration]
  );

  return (
    <Ctx.Provider value={value}>
      <TimeCtx.Provider value={time}>{children}</TimeCtx.Provider>
    </Ctx.Provider>
  );
}

/** HOT hook — re-renders on every playback tick. Use ONLY in seekbars/time labels. */
export function usePlayerTime(): PlayerTimeCtx {
  return useContext(TimeCtx);
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
