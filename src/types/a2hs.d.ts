declare module 'pwa-add-to-homescreen' {
  interface A2HSConfig {
    appName: string
    appNameDisplay?: 'standalone' | 'inline'
    appIconUrl: string
    assetUrl: string
    displayOptions?: { showMobile?: boolean; showDesktop?: boolean }
    showArrow?: boolean
    maxModalDisplayCount?: number
  }

  interface A2HSInstance {
    show: (lang?: string) => void
  }

  function AddToHomeScreen(config: A2HSConfig): A2HSInstance

  export default AddToHomeScreen
}

declare module 'pwa-add-to-homescreen/dist/add-to-homescreen.min.css' {
  const css: string
  export default css
}
