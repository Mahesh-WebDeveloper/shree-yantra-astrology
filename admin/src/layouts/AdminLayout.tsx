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
  IndianRupee,
  LayoutDashboard,
  LineChart,
  LogOut,
  Menu,
  Music,
  Moon,
  Radar,
  Settings,
  SlidersHorizontal,
  Sun,
  Server,
  Users,
  X,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useAuth } from '@/store/AuthContext'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { to: '/server-monitor', label: 'Server Monitor', shortLabel: 'Monitor', icon: Server },
  { to: '/analytics', label: 'Analytics', shortLabel: 'Analytics', icon: LineChart },
  { to: '/activity', label: 'User Activity', shortLabel: 'Activity', icon: Radar },
  { to: '/users', label: 'Users', shortLabel: 'Users', icon: Users },
  { to: '/library', label: 'Library', shortLabel: 'Library', icon: BookOpen },
  { to: '/media', label: 'Media', shortLabel: 'Media', icon: Music },
  { to: '/plans', label: 'Plans', shortLabel: 'Plans', icon: CreditCard },
  { to: '/subscriptions', label: 'Subscriptions', shortLabel: 'Subs', icon: IndianRupee },
  { to: '/notifications', label: 'Notifications', shortLabel: 'Alerts', icon: Bell },
  { to: '/pages', label: 'Pages (Content)', shortLabel: 'Pages', icon: FileText },
  { to: '/app-config', label: 'App Config', shortLabel: 'Config', icon: SlidersHorizontal },
  { to: '/faq', label: 'FAQ', shortLabel: 'FAQ', icon: HelpCircle },
  { to: '/settings', label: 'Settings', shortLabel: 'Settings', icon: Settings },
  { to: '/ai-cache', label: 'AI Cache', shortLabel: 'AI Cache', icon: Brain },
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

function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex min-h-14 shrink-0 items-center gap-3 border-b border-border px-4 py-3', collapsed && 'justify-center px-2')}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
        SY
      </div>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold leading-tight">Shree Yantra</p>
          <p className="truncate text-xs text-muted-foreground">Admin Console</p>
        </div>
      ) : null}
    </div>
  )
}

function SidebarNav({
  collapsed,
  onClose,
  className,
}: {
  collapsed: boolean
  onClose?: () => void
  className?: string
}) {
  return (
    <nav className={cn('flex-1 space-y-1 overflow-y-auto overscroll-contain px-2 py-3', className)}>
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
                'flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition hover:bg-muted/80 hover:text-foreground',
                isActive && 'bg-primary/10 text-primary shadow-sm',
                collapsed && 'justify-center px-0',
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <Icon className="size-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        )
      })}
    </nav>
  )
}

function Sidebar({
  collapsed,
  onClose,
  className,
}: {
  collapsed: boolean
  onClose?: () => void
  className?: string
}) {
  return (
    <aside
      className={cn(
        'flex h-full flex-col overflow-hidden bg-card text-card-foreground',
        collapsed ? 'w-[4.5rem]' : 'w-64',
        className,
      )}
    >
      <div className="flex shrink-0 items-center gap-2 border-b border-border lg:hidden">
        <div className="flex min-h-14 flex-1 items-center gap-3 px-4 py-3">
          <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-sm font-bold text-primary-foreground shadow-sm">
            SY
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">Shree Yantra</p>
            <p className="truncate text-xs text-muted-foreground">Admin Console</p>
          </div>
        </div>
        {onClose ? (
          <Button type="button" variant="ghost" size="icon" className="mr-2 shrink-0" onClick={onClose} aria-label="Close menu">
            <X className="size-4" />
          </Button>
        ) : null}
      </div>
      <div className="hidden lg:block">
        <SidebarBrand collapsed={collapsed} />
      </div>
      <SidebarNav collapsed={collapsed} onClose={onClose} />
    </aside>
  )
}

function MobileBottomNav() {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/96 px-1.5 pb-[calc(env(safe-area-inset-bottom)+0.35rem)] pt-1.5 shadow-[0_-10px_30px_rgba(0,0,0,0.12)] backdrop-blur lg:hidden"
      aria-label="Mobile admin navigation"
    >
      <div className="flex gap-0.5 overflow-x-auto overscroll-x-contain pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              title={item.label}
              className={({ isActive }) =>
                cn(
                  'flex min-w-[3.85rem] flex-col items-center justify-center gap-0.5 rounded-lg px-1.5 py-1.5 text-[10px] font-medium leading-tight text-muted-foreground transition',
                  isActive ? 'bg-primary text-primary-foreground shadow-sm' : 'hover:bg-muted hover:text-foreground',
                )
              }
            >
              <Icon className="size-4 shrink-0" />
              <span className="w-full text-center leading-tight">{item.shortLabel}</span>
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

function TopBar({
  collapsed,
  onToggleSidebar,
  onOpenMobile,
  theme,
  onToggleTheme,
  onLogout,
  userEmail,
}: {
  collapsed: boolean
  onToggleSidebar: () => void
  onOpenMobile: () => void
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  onLogout: () => void
  userEmail?: string
}) {
  return (
    <header className="sticky top-0 z-20 flex min-h-14 shrink-0 items-center gap-2 border-b border-border bg-background/95 px-3 py-2 backdrop-blur sm:gap-3 sm:px-5">
      <Button type="button" variant="ghost" size="icon" className="lg:hidden" onClick={onOpenMobile} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="hidden lg:inline-flex"
        onClick={onToggleSidebar}
        aria-label="Toggle sidebar"
      >
        {collapsed ? <ChevronRight className="size-5" /> : <ChevronLeft className="size-5" />}
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">Operations Dashboard</p>
        <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
      </div>
      <Button type="button" variant="secondary" size="icon" onClick={onToggleTheme} aria-label="Toggle theme">
        {theme === 'dark' ? <Sun className="size-4" /> : <Moon className="size-4" />}
      </Button>
      <Button type="button" variant="secondary" size="icon" className="sm:hidden" onClick={onLogout} aria-label="Logout">
        <LogOut className="size-4" />
      </Button>
      <Button type="button" variant="secondary" className="hidden sm:inline-flex" onClick={onLogout}>
        <LogOut className="size-4" />
        <span>Logout</span>
      </Button>
    </header>
  )
}

export function AdminLayout() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-svh bg-background text-foreground">
      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/45" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[min(20rem,86vw)] overflow-hidden rounded-r-2xl border-r border-border bg-card shadow-2xl">
            <Sidebar collapsed={false} onClose={() => setMobileOpen(false)} />
          </div>
        </div>
      ) : null}

      <div className="flex min-h-svh flex-col lg:p-3">
        <div className="flex min-h-svh flex-1 flex-col lg:min-h-[calc(100svh-1.5rem)] lg:flex-row lg:gap-3">
          <div className="hidden shrink-0 lg:block">
            <Sidebar
              collapsed={collapsed}
              className="h-full rounded-2xl border border-border shadow-sm"
            />
          </div>

          <div className="flex min-h-svh min-w-0 flex-1 flex-col overflow-x-hidden lg:min-h-0 lg:overflow-hidden lg:rounded-2xl lg:border lg:border-border lg:bg-background lg:shadow-sm">
            <TopBar
              collapsed={collapsed}
              onToggleSidebar={() => setCollapsed((value) => !value)}
              onOpenMobile={() => setMobileOpen(true)}
              theme={theme}
              onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              onLogout={logout}
              userEmail={user?.email || user?.name}
            />

            <main className="mx-auto w-full max-w-7xl min-w-0 flex-1 overflow-x-hidden px-3 py-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-6 lg:overflow-y-auto lg:pb-8">
              <Outlet />
            </main>
          </div>
        </div>
      </div>

      <MobileBottomNav />
    </div>
  )
}
