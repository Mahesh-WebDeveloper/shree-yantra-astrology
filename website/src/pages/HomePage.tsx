import { SiteNav } from '@/components/site/SiteNav'
import { Hero } from '@/components/site/Hero'
import { LiveProof } from '@/components/site/LiveProof'
import { AccuracyManifesto } from '@/components/site/AccuracyManifesto'
import { FeatureJourneys } from '@/components/site/FeatureJourneys'
import { SacredLibrary } from '@/components/site/SacredLibrary'
import { JyotishiDemo } from '@/components/site/JyotishiDemo'
import { WhyDifferent } from '@/components/site/WhyDifferent'
import { Faq } from '@/components/site/Faq'
import { DownloadCta } from '@/components/site/DownloadCta'
import { SiteFooterNew } from '@/components/site/SiteFooterNew'

/** The marketing home — one cinematic scroll:
 *  hero → live proof (the real engine answering, right on the page) → why it is accurate →
 *  what the app does → the sacred library → the jyotishi in action → how it differs →
 *  questions → download. */
export function HomePage() {
  return (
    <div className="sy-site min-h-screen">
      <SiteNav />
      <main>
        <Hero />
        <LiveProof />
        <AccuracyManifesto />
        <FeatureJourneys />
        <SacredLibrary />
        <JyotishiDemo />
        <WhyDifferent />
        <Faq />
        <DownloadCta />
      </main>
      <SiteFooterNew />
    </div>
  )
}
