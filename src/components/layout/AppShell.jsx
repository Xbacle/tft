import { useState } from 'react'
import Topbar from './Topbar'
import Sidebar from './Sidebar'
import AIButton from '../ai/AIButton'
import AIPanel from '../ai/AIPanel'

export default function AppShell({ children }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [aiOpen, setAiOpen] = useState(false)
  return <div className="app-shell">
    <Topbar onMenu={() => setMenuOpen(true)} />
    <Sidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
    <main className="main-content">{children}</main>
    <AIButton onClick={() => setAiOpen(true)} />
    <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />
  </div>
}
