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

let loading: Promise<A2HSInstance> | null = null

function lang(): string {
  return navigator.language.startsWith('en') ? 'en' : 'fr'
}

function config(): A2HSConfig {
  const base = import.meta.env.BASE_URL
  return {
    appName: 'Oseille',
    appNameDisplay: 'inline',
    appIconUrl: `${base}pwa-192x192.png`,
    assetUrl: `${base}a2hs/img/`,
    displayOptions: { showMobile: true, showDesktop: false },
    showArrow: true,
  }
}

async function load(): Promise<A2HSInstance> {
  if (window.AddToHomeScreenInstance) return window.AddToHomeScreenInstance as A2HSInstance
  if (!loading) {
    loading = Promise.all([
      loadStylesheet(),
      import('pwa-add-to-homescreen'),
    ]).then(() => {
      const factory = window.AddToHomeScreen
      if (!factory) throw new Error('AddToHomeScreen not loaded')
      const instance = factory(config() as any)
      window.AddToHomeScreenInstance = instance
      return instance
    })
  }
  return loading
}

let stylePromise: Promise<void> | null = null

function loadStylesheet(): Promise<void> {
  if (stylePromise) return stylePromise
  stylePromise = new Promise((resolve, reject) => {
    const link = document.createElement('link')
    link.rel = 'stylesheet'
    link.href = `${import.meta.env.BASE_URL}a2hs/add-to-homescreen.min.css`
    link.onload = () => resolve()
    link.onerror = () => reject(new Error('Failed to load A2HS stylesheet'))
    document.head.appendChild(link)
  })
  return stylePromise
}

export function initA2hs(): void {
  window.AddToHomeScreenShow = async () => {
    const instance = await load()
    instance.show(lang())
  }

  const prefetch = () => {
    void load()
  }
  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(prefetch, { timeout: 4000 })
  } else {
    setTimeout(prefetch, 2000)
  }
}
