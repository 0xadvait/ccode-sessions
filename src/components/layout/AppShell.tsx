import { useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Sidebar } from '../sidebar/Sidebar'
import { ConversationView } from '../conversation/ConversationView'
import { WelcomeView } from '../conversation/WelcomeView'
import { useStore } from '../../store/store'
import { PanelLeft } from 'lucide-react'

export function AppShell() {
  const selectedId = useStore((s) => s.selectedId)
  const sidebarOpen = useStore((s) => s.sidebarOpen)
  const toggleSidebar = useStore((s) => s.toggleSidebar)

  // Cmd+K global handler is in SearchInput
  // Cmd+B to toggle sidebar
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggleSidebar])

  return (
    <div className="flex h-full w-full overflow-hidden bg-surface-base">
      {/* Sidebar */}
      <AnimatePresence mode="popLayout">
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 360, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.1, 0.25, 1] }}
            className="flex-shrink-0 overflow-hidden"
          >
            <Sidebar />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 relative">
        {/* Collapse toggle (when sidebar is closed) */}
        <AnimatePresence>
          {!sidebarOpen && (
            <motion.button
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
              onClick={toggleSidebar}
              className="absolute top-3 left-3 z-20 p-2 rounded-xl glass text-text-secondary hover:text-text-primary transition-colors"
            >
              <PanelLeft size={18} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Content */}
        <AnimatePresence mode="wait">
          {selectedId ? (
            <motion.div
              key={selectedId}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col min-h-0"
            >
              <ConversationView />
            </motion.div>
          ) : (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="flex-1"
            >
              <WelcomeView />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
