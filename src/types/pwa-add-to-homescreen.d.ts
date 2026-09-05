declare global {
  interface Window {
    AddToHomeScreen?: (config: {
      appName: string
      appNameDisplay?: 'standalone' | 'inline'
      appIconUrl: string
      assetUrl: string
      displayOptions?: { showMobile?: boolean; showDesktop?: boolean }
      showArrow?: boolean
      maxModalDisplayCount?: number
    }) => {
      show: (lang?: string) => void
    }
    AddToHomeScreenShow?: () => void
  }
}

export {}


