import { createRoot } from 'react-dom/client'
import './i18n.ts'
import './index.css'
import AppRoot from './AppRoot.tsx'

createRoot(document.getElementById('root')!).render(<AppRoot />)