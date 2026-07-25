import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthProvider'
import { useLang } from '@/i18n/LangProvider'

type TabKey = 'home' | 'choghadiya' | 'kundli' | 'library' | 'profile' | 'services'

const TABS: {
  key: TabKey
  to: string
  active: string[]
  en: string
  hi: string
}[] = [
  { key: 'home', to: '/', active: ['/'], en: 'Home', hi: 'होम' },
  { key: 'choghadiya', to: '/choghadiya', active: ['/choghadiya'], en: 'Choghadiya', hi: 'चौघड़िया' },
  {
    key: 'kundli',
    to: '/kundli',
    active: ['/kundli', '/kundli-learn', '/kundli-match', '/brihat-kundli', '/janam-patri'],
    en: 'Kundli',
    hi: 'कुंडली',
  },
  {
    key: 'library',
    to: '/library',
    active: ['/library', '/gita', '/ramayan', '/vedas', '/rigveda', '/aarti-sangrah', '/stotra-sangrah', '/mantra-sangrah'],
    en: 'Library',
    hi: 'पुस्तकालय',
  },
  { key: 'profile', to: '/profile', active: ['/profile', '/plans', '/notifications', '/help', '/legal'], en: 'Profile', hi: 'प्रोफ़ाइल' },
]

function isActive(pathname: string, active: string[]) {
  return active.some((path) => (path === '/' ? pathname === '/' : pathname.startsWith(path)))
}

function TabIcon({ kind }: { kind: TabKey }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.85,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (kind === 'home') {
    return (
      <svg {...common}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5.5 9.5V21h13V9.5" />
        <path d="M9.5 21v-6h5v6" />
      </svg>
    )
  }
  if (kind === 'choghadiya') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M12 7.5V12l3.2 2" />
      </svg>
    )
  }
  if (kind === 'kundli') {
    return (
      <svg {...common}>
        <rect x="4" y="4" width="16" height="16" rx="1.5" />
        <path d="M4 4l16 16M20 4 4 20M12 4v16M4 12h16" />
      </svg>
    )
  }
  if (kind === 'library') {
    return (
      <svg {...common}>
        <path d="M5 4.5h10.5A3.5 3.5 0 0 1 19 8v12H8.5A3.5 3.5 0 0 0 5 16.5z" />
        <path d="M5 4.5v12M9 8h6" />
      </svg>
    )
  }
  if (kind === 'services') {
    return (
      <svg {...common}>
        <path d="M5 5h5v5H5zM14 5h5v5h-5zM5 14h5v5H5zM14 14h5v5h-5z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
    </svg>
  )
}

export function MobileAppNav() {
  const { hi } = useLang()
  const { loggedIn } = useAuth()
  const { pathname } = useLocation()

  if (pathname.startsWith('/sign-in') || pathname.startsWith('/onboarding/')) return null

  return (
    <nav className="mobile-app-nav" aria-label={hi ? 'ऐप नेविगेशन' : 'App navigation'}>
      <Link
        to="/services"
        className={`mobile-app-nav-fab ${pathname.startsWith('/services') ? 'is-active' : ''}`}
        aria-label={hi ? 'सभी ऐप सेवाएँ' : 'All app services'}
      >
        <TabIcon kind="services" />
        <span>{hi ? 'सभी' : 'All'}</span>
      </Link>
      <div className="mobile-app-nav-dock">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.active)
          const to = tab.key === 'profile' && !loggedIn ? '/sign-in?returnTo=%2Fprofile' : tab.to
          return (
            <Link key={tab.key} to={to} className={`mobile-app-nav-item ${active ? 'is-active' : ''}`}>
              <TabIcon kind={tab.key} />
              <span>{hi ? tab.hi : tab.en}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
