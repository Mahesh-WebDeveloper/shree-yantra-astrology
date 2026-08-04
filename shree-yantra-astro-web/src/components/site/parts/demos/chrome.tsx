import type { CSSProperties, ReactNode } from 'react'

/**
 * Shared chrome for the in-phone demos: the app's status bar and title bar,
 * plus the tiny helper that turns a stagger index into a CSS delay.
 *
 * Every demo renders its FINAL state by default; the `is-play` class on the
 * demo root is what switches the CSS animations on. That way
 * prefers-reduced-motion (and any paused/off-screen demo) simply shows the
 * finished screen, with nothing half-drawn.
 */

export type DemoProps = {
  hi: boolean
  play: boolean
}

/** Stagger delay as a custom property. */
export function d(delay: number): CSSProperties {
  return { '--d': `${delay}s` } as CSSProperties
}

export function root(play: boolean, extra?: string) {
  return `syd${play ? ' is-play' : ''}${extra ? ` ${extra}` : ''}`
}

export function StatusBar() {
  return (
    <div className="syd-status" aria-hidden>
      <span className="syd-status__time">9:41</span>
      <span className="syd-status__icons">
        <i />
        <i />
        <i />
        <b />
      </span>
    </div>
  )
}

export function AppBar({ title }: { title: string }) {
  return (
    <div className="syd-appbar" aria-hidden>
      <span className="syd-appbar__btn">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
      <span className="syd-appbar__title">{title}</span>
      <span className="syd-appbar__btn syd-appbar__btn--soft">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="8" />
          <path d="M12 8v4l3 2" strokeLinecap="round" />
        </svg>
      </span>
    </div>
  )
}

/** A scrollable-looking body column. Content is sized to fit the screen. */
export function Body({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={`syd-body${className ? ` ${className}` : ''}`}>{children}</div>
}

/* ── The app's own bottom tab bar, shared by every demo ─────────────── */

const TABS = [
  {
    id: 'home',
    hi: 'होम',
    en: 'Home',
    path: 'M4 10.5L12 4l8 6.5V20a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z',
  },
  {
    id: 'choghadiya',
    hi: 'चौघड़िया',
    en: 'Choghadiya',
    path: 'M12 3a9 9 0 100 18 9 9 0 000-18zm0 4.4V12l3.3 2',
  },
  {
    id: 'kundli',
    hi: 'कुंडली',
    en: 'Kundli',
    path: 'M3.5 3.5h17v17h-17zM3.5 3.5l17 17M20.5 3.5l-17 17M12 3.5l8.5 8.5L12 20.5 3.5 12z',
  },
  {
    id: 'library',
    hi: 'पुस्तकालय',
    en: 'Library',
    path: 'M12 6.6C10.6 5.4 8.7 4.8 6.2 4.8c-.7 0-1.2 0-1.7.1v13c.5-.1 1-.1 1.7-.1 2.5 0 4.4.6 5.8 1.8 1.4-1.2 3.3-1.8 5.8-1.8.7 0 1.2 0 1.7.1v-13c-.5-.1-1-.1-1.7-.1-2.5 0-4.4.6-5.8 1.8zm0 0v12.9',
  },
  {
    id: 'profile',
    hi: 'प्रोफ़ाइल',
    en: 'Profile',
    path: 'M12 12a4 4 0 100-8 4 4 0 000 8zm-7 8.2c1.4-3 4-4.5 7-4.5s5.6 1.5 7 4.5',
  },
]

export function PhoneTabBar({ hi, active }: { hi: boolean; active: string }) {
  return (
    <div className="sya-tabbar" aria-hidden>
      {TABS.map((t) => (
        <span key={t.id} className={t.id === active ? 'is-on' : undefined}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4">
            <path d={t.path} strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {hi ? t.hi : t.en}
        </span>
      ))}
    </div>
  )
}
