import { createRoot } from 'react-dom/client'
import './i18n.ts'
import './index.css'
import AppRoot from './AppRoot.tsx'

type A2HSConfig = {
  appName: string
  appNameDisplay?: 'standalone' | 'inline'
  appIconUrl: string
  assetUrl: string
  displayOptions?: { showMobile?: boolean; showDesktop?: boolean }
  showArrow?: boolean
  maxModalDisplayCount?: number
}

type A2HSInstance = {
  show: (lang?: string) => void
}

declare global {
  interface Window {
    AddToHomeScreen?: (config: A2HSConfig) => A2HSInstance
    AddToHomeScreenInstance?: A2HSInstance
  }
}

createRoot(document.getElementById('root')!).render(<AppRoot />)

function initA2hs() {
  const w = window as typeof window & { AddToHomeScreen?: (config: A2HSConfig) => A2HSInstance }
  if (typeof w.AddToHomeScreen === 'undefined') {
    setTimeout(initA2hs, 100)
    return
  }
  const lang = navigator.language.startsWith('en') ? 'en' : 'fr'
  w.AddToHomeScreenInstance = w.AddToHomeScreen({
    appName: 'Oseille',
    appNameDisplay: 'inline',
    appIconUrl: '/pwa-192x192.png',
    assetUrl: 'https://cdn.jsdelivr.net/npm/pwa-add-to-homescreen@4/dist/assets/img/',
    displayOptions: { showMobile: true, showDesktop: false },
    showArrow: true,
  })
  w.AddToHomeScreenInstance.show(lang)
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initA2hs)
} else {
  initA2hs()
}

;(window as any).AddToHomeScreenShow = function() {
  const w = window as any
  if (typeof w.AddToHomeScreen === 'undefined') {
    console.error('AddToHomeScreen not loaded')
    return
  }
  if (!w.AddToHomeScreenInstance) {
    w.AddToHomeScreenInstance = w.AddToHomeScreen({
      appName: 'Oseille',
      appNameDisplay: 'inline',
      appIconUrl: '/pwa-192x192.png',
      assetUrl: 'https://cdn.jsdelivr.net/npm/pwa-add-to-homescreen@4/dist/assets/img/',
      displayOptions: { showMobile: true, showDesktop: false },
      showArrow: true,
    })
  }
  const lang = navigator.language.startsWith('en') ? 'en' : 'fr'
  w.AddToHomeScreenInstance.show(lang)
}