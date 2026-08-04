import { useEffect, useState } from 'react'
import { useLang } from '@/i18n/LangProvider'
import { scrollToTop } from './hooks/useSiteMotion'
import './scroll-top.css'

export function ScrollToTopButton() {
  const { hi } = useLang()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        const maxScroll = document.documentElement.scrollHeight - window.innerHeight
        const progress = maxScroll > 0 ? window.scrollY / maxScroll : 0
        setVisible(progress >= 0.7)
        raf = 0
      })
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <button
      type="button"
      className={`sy-scroll-top${visible ? ' is-visible' : ''}`}
      aria-label={hi ? 'ऊपर जाएँ' : 'Back to top'}
      onClick={scrollToTop}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M12 19V5M6 11l6-6 6 6" />
      </svg>
    </button>
  )
}
