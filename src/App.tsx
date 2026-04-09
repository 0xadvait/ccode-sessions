import { AppShell } from './components/layout/AppShell'
import { useSessionList } from './hooks/useSessionList'

export default function App() {
  useSessionList()
  return <AppShell />
}
