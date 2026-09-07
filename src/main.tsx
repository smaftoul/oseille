import { createRoot } from 'react-dom/client'
import './i18n.ts'
import './index.css'
import AppRoot from './AppRoot.tsx'
import { initA2hs } from './a2hs.ts'

createRoot(document.getElementById('root')!).render(<AppRoot />)
initA2hs()
