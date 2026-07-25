import { ALL_SERVICES, PRIMARY_SERVICES, type ServiceItem } from '@/data/welcomeServices'
import { APP_FEATURES } from '@/data/appFeatures'

const BY_ROUTE = new Map<string, ServiceItem>()
for (const s of [...PRIMARY_SERVICES, ...ALL_SERVICES]) {
  if (!BY_ROUTE.has(s.route)) BY_ROUTE.set(s.route, s)
}

export function serviceForRoute(path: string): ServiceItem | undefined {
  const base = path.split('?')[0]
  const found = BY_ROUTE.get(base)
  if (found) return found
  const feat = APP_FEATURES.find((f) => f.route.split('?')[0] === base)
  if (!feat) return undefined
  return {
    key: base.replace(/\//g, ''),
    route: base,
    icon: 'reading',
    accent: '#e9b850',
    en: { title: feat.en, sub: '' },
    hi: { title: feat.hi, sub: '' },
  }
}
