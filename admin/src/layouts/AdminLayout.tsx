import { useEffect, useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import {
  Bell,
  BookOpen,
  Brain,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Music,
  Moon,
  Settings,
  SlidersHorizontal,
  Sun,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/users', label: 'Users', icon: Users },
  { to: '/library', label: 'Library', icon: BookOpen },
  { to: '/media', label: 'Media', icon: Music },
  { to: '/plans', label: 'Plans', icon: CreditCard },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/pages', label: 'Pages (Content)', icon: FileText },
  { to: '/app-config', label: 'App Config', icon: SlidersHorizontal },
  { to: '/faq', label: 'FAQ', icon: HelpCircle },
  { to: '/settings', label: 'Settings', icon: Settings },
  { to: '/ai-cache', label: 'AI Cache', icon: Brain },
]

function useTheme() {
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('admin-theme')
    if (saved === 'dark' || saved === 'light') return saved
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('admin-theme', theme)
  }, [theme])

  return { theme, setTheme }
}

function Sidebar({ collapsed, onClose }: { collapsed: boolean; onClose?: () => void }) {
  return (
    <aside className={cn('flex h-full flex-col border-r border-border bg-card text-card-foreground', collapsed ? 'w-[4.5rem]' : 'w-64')}>
      <div className="flex h-16 items-center gap-3 border-b border-border px-4">
        <div className="grid size-9 place-items-center rounded-md bg-primary text-sm font-bold text-primary-foreground">SY</div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Shree Yantra</p>
            <p className="truncate text-xs text-muted-foreground">Admin Console</p>
          </div>
        ) : null}
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" className="ml-auto lg:hidden" onClick={onClose} aria-label="Close menu">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <nav className="grid gap-1 p-3">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground',
                  isActive && 'bg-primary/10 text-primary',
                  collapsed && 'justify-center px-0',
                )
              }
              title={collapsed ? item.label : undefined}
            >
              <Icon className="size-4 shrink-0" />
              {!collapsed ? <span>{item.label}</span> : null}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

function MobileBottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/96 px-2 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-2 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden" aria-label="Mobile admin navigation">
      <div className="flex gap-1 overflow-x-auto overscroll-x-contain pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[4.7rem] flex-col items-center justify-center gap-1 rounded-md px-2 py-2 text-[10px] font-medium text-muted-foreground transition',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="max-w-full truncate">{item.label.replace(' (Content)', '')}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="hidden fixed inset-y-0 left-0 z-30 lg:block">
        <Sidebar collapsed={collapsed} />
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,86vw)]">
            <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className={cn('transition-[margin] duration-200', collapsed ? 'lg:ml-[4.5rem]' : 'lg:ml-64')}>
        <header className="sticky top-0 z-20 flex min-h-16 items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:gap-3 sm:px-4">
          <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open menu">
            <Menu className="size-5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="hidden lg:inline-flex"
            onClick={() => setCollapsed((value) => !value)}
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
          </Button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">Operations Dashboard</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || user?.name}</p>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </Button>
          <Button type="button" variant="secondary" size="icon" className="sm:hidden" onClick={logout} aria-label="Logout">
            <LogOut className="size-4" />
          </Button>
          <Button type="button" variant="secondary" className="hidden sm:inline-flex" onClick={logout}>
            <LogOut className="size-4" />
            <span>Logout</span>
          </Button>
        </header>
        <main className="mx-auto w-full max-w-7xl px-3 pb-28 pt-4 sm:p-6 lg:pb-6">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav />
    </div>
  )
}
