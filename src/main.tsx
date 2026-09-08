import { createRoot } from 'react-dom/client'
import '@khmyznikov/pwa-install'
import './i18n.ts'
import './index.css'
import AppRoot from './AppRoot.tsx'

createRoot(document.getElementById('root')!).render(<AppRoot />)
