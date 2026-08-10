import { lazy, Suspense } from 'react'
import { Navigate, Outlet, Route, Routes } from 'react-router-dom'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { HomePage } from '@/pages/HomePage'

const LegalPage = lazy(() => import('@/pages/LegalPage').then((m) => ({ default: m.LegalPage })))
const HelpPage = lazy(() => import('@/pages/HelpPage').then((m) => ({ default: m.HelpPage })))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))
const AppLandingPage = lazy(() => import('@/pages/AppLandingPage').then((m) => ({ default: m.AppLandingPage })))
const ShreeYantraGuidePage = lazy(() => import('@/pages/ShreeYantraGuidePage').then((m) => ({ default: m.ShreeYantraGuidePage })))
const AboutPage = lazy(() => import('@/pages/AboutPage').then((m) => ({ default: m.AboutPage })))
const DisclaimerPage = lazy(() => import('@/pages/DisclaimerPage').then((m) => ({ default: m.DisclaimerPage })))
const ServicesPage = lazy(() => import('@/pages/ServicesPage').then((m) => ({ default: m.ServicesPage })))
const KundliPage = lazy(() => import('@/pages/KundliPage').then((m) => ({ default: m.KundliPage })))
const KundliLearnPage = lazy(() => import('@/pages/KundliLearnPage').then((m) => ({ default: m.KundliLearnPage })))
const KundliMatchPage = lazy(() => import('@/pages/KundliMatchPage').then((m) => ({ default: m.KundliMatchPage })))
const RashifalPage = lazy(() => import('@/pages/RashifalPage').then((m) => ({ default: m.RashifalPage })))
const MyRashifalPage = lazy(() => import('@/pages/MyRashifalPage').then((m) => ({ default: m.MyRashifalPage })))
const PanchangPage = lazy(() => import('@/pages/PanchangPage').then((m) => ({ default: m.PanchangPage })))
const ChoghadiyaPage = lazy(() => import('@/pages/ChoghadiyaPage').then((m) => ({ default: m.ChoghadiyaPage })))
const MuhuratPage = lazy(() => import('@/pages/MuhuratPage').then((m) => ({ default: m.MuhuratPage })))
const MuhuratFinderPage = lazy(() => import('@/pages/MuhuratFinderPage').then((m) => ({ default: m.MuhuratFinderPage })))
const NumerologyPage = lazy(() => import('@/pages/NumerologyPage').then((m) => ({ default: m.NumerologyPage })))
const VastuPage = lazy(() => import('@/pages/VastuPage').then((m) => ({ default: m.VastuPage })))
const VastuLearnPage = lazy(() => import('@/pages/VastuLearnPage').then((m) => ({ default: m.VastuLearnPage })))
const BabyNamesPage = lazy(() => import('@/pages/BabyNamesPage').then((m) => ({ default: m.BabyNamesPage })))
const RemediesPage = lazy(() => import('@/pages/RemediesPage').then((m) => ({ default: m.RemediesPage })))
const VedicReadingPage = lazy(() => import('@/pages/VedicReadingPage').then((m) => ({ default: m.VedicReadingPage })))
const BrihatKundliPage = lazy(() => import('@/pages/BrihatKundliPage').then((m) => ({ default: m.BrihatKundliPage })))
const JanamPatriPage = lazy(() => import('@/pages/JanamPatriPage').then((m) => ({ default: m.JanamPatriPage })))
const GocharPage = lazy(() => import('@/pages/GocharPage').then((m) => ({ default: m.GocharPage })))
const LifeTimelinePage = lazy(() => import('@/pages/LifeTimelinePage').then((m) => ({ default: m.LifeTimelinePage })))
const TransitForecastPage = lazy(() => import('@/pages/TransitForecastPage').then((m) => ({ default: m.TransitForecastPage })))
const AiAstrologerPage = lazy(() => import('@/pages/AiAstrologerPage').then((m) => ({ default: m.AiAstrologerPage })))
const LibraryPage = lazy(() => import('@/pages/LibraryPage').then((m) => ({ default: m.LibraryPage })))
const LibraryBookPage = lazy(() => import('@/pages/LibraryBookPage').then((m) => ({ default: m.LibraryBookPage })))
const DailyShlokaPage = lazy(() => import('@/pages/DailyShlokaPage').then((m) => ({ default: m.DailyShlokaPage })))
const GitaPage = lazy(() => import('@/pages/GitaPage').then((m) => ({ default: m.GitaPage })))
const GitaChapterPage = lazy(() => import('@/pages/GitaChapterPage').then((m) => ({ default: m.GitaChapterPage })))
const RamayanPage = lazy(() => import('@/pages/RamayanPage').then((m) => ({ default: m.RamayanPage })))
const RamayanKandaPage = lazy(() => import('@/pages/RamayanKandaPage').then((m) => ({ default: m.RamayanKandaPage })))
const RamayanSargaPage = lazy(() => import('@/pages/RamayanSargaPage').then((m) => ({ default: m.RamayanSargaPage })))
const RamcharitmanasPage = lazy(() => import('@/pages/RamcharitmanasPage').then((m) => ({ default: m.RamcharitmanasPage })))
const RamcharitmanasKandaPage = lazy(() => import('@/pages/RamcharitmanasKandaPage').then((m) => ({ default: m.RamcharitmanasKandaPage })))
const AartiSangrahPage = lazy(() => import('@/pages/AartiSangrahPage').then((m) => ({ default: m.AartiSangrahPage })))
const AartiReaderPage = lazy(() => import('@/pages/AartiReaderPage').then((m) => ({ default: m.AartiReaderPage })))
const StotraSangrahPage = lazy(() => import('@/pages/StotraSangrahPage').then((m) => ({ default: m.StotraSangrahPage })))
const StotraReaderPage = lazy(() => import('@/pages/StotraReaderPage').then((m) => ({ default: m.StotraReaderPage })))
const MantraSangrahPage = lazy(() => import('@/pages/MantraSangrahPage').then((m) => ({ default: m.MantraSangrahPage })))
const MantraReaderPage = lazy(() => import('@/pages/MantraReaderPage').then((m) => ({ default: m.MantraReaderPage })))
const OccasionsPage = lazy(() => import('@/pages/OccasionsPage').then((m) => ({ default: m.OccasionsPage })))
const OccasionDetailPage = lazy(() => import('@/pages/OccasionDetailPage').then((m) => ({ default: m.OccasionDetailPage })))
const VedasHubPage = lazy(() => import('@/pages/VedasHubPage').then((m) => ({ default: m.VedasHubPage })))
const VedaPage = lazy(() => import('@/pages/VedaPage').then((m) => ({ default: m.VedaPage })))
const VedaBookPage = lazy(() => import('@/pages/VedaBookPage').then((m) => ({ default: m.VedaBookPage })))
const VedaVersePage = lazy(() => import('@/pages/VedaVersePage').then((m) => ({ default: m.VedaVersePage })))
const RigvedaPage = lazy(() => import('@/pages/RigvedaPage').then((m) => ({ default: m.RigvedaPage })))
const RigvedaMandalaPage = lazy(() => import('@/pages/RigvedaMandalaPage').then((m) => ({ default: m.RigvedaMandalaPage })))
const RigvedaSuktaPage = lazy(() => import('@/pages/RigvedaSuktaPage').then((m) => ({ default: m.RigvedaSuktaPage })))
const HanumanChalisaPage = lazy(() => import('@/pages/HanumanChalisaPage').then((m) => ({ default: m.HanumanChalisaPage })))
const AudioPlaylistPage = lazy(() => import('@/pages/AudioPlaylistPage').then((m) => ({ default: m.AudioPlaylistPage })))
const SignInPage = lazy(() => import('@/pages/SignInPage').then((m) => ({ default: m.SignInPage })))
const BirthOnboardingPage = lazy(() => import('@/pages/BirthOnboardingPage').then((m) => ({ default: m.BirthOnboardingPage })))
const ProfilePage = lazy(() => import('@/pages/ProfilePage').then((m) => ({ default: m.ProfilePage })))
const PlansPage = lazy(() => import('@/pages/PlansPage').then((m) => ({ default: m.PlansPage })))
const NotificationsPage = lazy(() => import('@/pages/NotificationsPage').then((m) => ({ default: m.NotificationsPage })))

function RouteFallback() {
  return <div className="min-h-screen bg-[var(--sy-bg)]" aria-busy="true" />
}

function ChromePage() {
  return (
    <>
      <SiteHeader />
      <Outlet />
    </>
  )
}

export function AppRoutes() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route element={<ChromePage />}>
          <Route path="/app" element={<AppLandingPage />} />
          <Route path="/shree-yantra" element={<ShreeYantraGuidePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/disclaimer" element={<DisclaimerPage />} />
          <Route path="/legal" element={<LegalPage />} />
          <Route path="/privacy" element={<LegalPage />} />
          <Route path="/privacy-security" element={<LegalPage />} />
          <Route path="/terms" element={<LegalPage />} />
          <Route path="/help" element={<HelpPage />} />
        </Route>

        <Route path="/services" element={<ServicesPage />} />
        <Route path="/kundli" element={<KundliPage />} />
        <Route path="/kundli-learn" element={<KundliLearnPage />} />
        <Route path="/kundli-match" element={<KundliMatchPage />} />
        <Route path="/rashifal" element={<RashifalPage />} />
        <Route path="/my-rashifal" element={<MyRashifalPage />} />
        <Route path="/panchang" element={<PanchangPage />} />
        <Route path="/choghadiya" element={<ChoghadiyaPage />} />
        <Route path="/muhurat" element={<MuhuratPage />} />
        <Route path="/muhurat/:categoryKey" element={<MuhuratFinderPage />} />
        <Route path="/numerology" element={<NumerologyPage />} />
        <Route path="/vastu" element={<VastuPage />} />
        <Route path="/vastu-learn" element={<VastuLearnPage />} />
        <Route path="/baby-names" element={<BabyNamesPage />} />
        <Route path="/remedies" element={<RemediesPage />} />
        <Route path="/vedic-reading" element={<VedicReadingPage />} />
        <Route path="/brihat-kundli" element={<BrihatKundliPage />} />
        <Route path="/janam-patri" element={<JanamPatriPage />} />
        <Route path="/gochar" element={<GocharPage />} />
        <Route path="/life-timeline" element={<LifeTimelinePage />} />
        <Route path="/transit-forecast" element={<TransitForecastPage />} />
        <Route path="/ai-astrologer" element={<AiAstrologerPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/library/:id" element={<LibraryBookPage />} />
        <Route path="/daily-shloka" element={<DailyShlokaPage />} />
        <Route path="/gita" element={<GitaPage />} />
        <Route path="/gita/:n" element={<GitaChapterPage />} />
        <Route path="/ramayan" element={<RamayanPage />} />
        <Route path="/ramayan/:kanda" element={<RamayanKandaPage />} />
        <Route path="/ramayan/:kanda/:sarga" element={<RamayanSargaPage />} />
        <Route path="/ramcharitmanas" element={<RamcharitmanasPage />} />
        <Route path="/ramcharitmanas/:kanda" element={<RamcharitmanasKandaPage />} />
        <Route path="/aarti-sangrah" element={<AartiSangrahPage />} />
        <Route path="/aarti/:id" element={<AartiReaderPage />} />
        <Route path="/stotra-sangrah" element={<StotraSangrahPage />} />
        <Route path="/stotra/:id" element={<StotraReaderPage />} />
        <Route path="/mantra-sangrah" element={<MantraSangrahPage />} />
        <Route path="/mantra/:id" element={<MantraReaderPage />} />
        <Route path="/occasions" element={<OccasionsPage />} />
        <Route path="/occasions/:id" element={<OccasionDetailPage />} />
        <Route path="/vedas" element={<VedasHubPage />} />
        <Route path="/vedas/:veda" element={<VedaPage />} />
        <Route path="/vedas/:veda/:book" element={<VedaBookPage />} />
        <Route path="/vedas/:veda/:book/:section" element={<VedaVersePage />} />
        <Route path="/rigveda" element={<RigvedaPage />} />
        <Route path="/rigveda/:mandala" element={<RigvedaMandalaPage />} />
        <Route path="/rigveda/:mandala/:sukta" element={<RigvedaSuktaPage />} />
        <Route path="/hanuman-chalisa" element={<HanumanChalisaPage />} />
        <Route path="/audio/:subCategory" element={<AudioPlaylistPage />} />

        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/onboarding/birth" element={<BirthOnboardingPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/plans" element={<PlansPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />

        <Route path="/daily-prediction" element={<Navigate to="/my-rashifal" replace />} />
        <Route path="/predictions" element={<Navigate to="/rashifal" replace />} />
        <Route path="/kundli-explore" element={<Navigate to="/kundli" replace />} />
        <Route path="/example-kundli" element={<Navigate to="/kundli" replace />} />
        <Route path="/manage-subscription" element={<Navigate to="/plans" replace />} />
        <Route path="/subscribe" element={<Navigate to="/plans" replace />} />
        <Route path="/payment" element={<Navigate to="/plans" replace />} />
        <Route path="/billing-options" element={<Navigate to="/plans" replace />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
