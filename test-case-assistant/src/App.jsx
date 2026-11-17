import { useMemo, useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Header from './components/Header'
import AdoConnection from './pages/AdoConnection'
import AiGenerator from './pages/AiGenerator'
import ImportTestCases from './pages/ImportTestCases'
import QualityAnalyzer from './pages/QualityAnalyzer'
import MissingSteps from './pages/MissingSteps'
import CoverageAnalysis from './pages/CoverageAnalysis'
import DuplicateFinder from './pages/DuplicateFinder'
import BrdAnalyzer from './pages/BrdAnalyzer'
import Reports from './pages/Reports'
import Settings from './pages/Settings'

const routes = {
  'ado-connection': { component: AdoConnection },
  'import-test-cases': { component: ImportTestCases },
  'duplicate-finder': { component: DuplicateFinder },
  'quality-analyzer': { component: QualityAnalyzer },
  'missing-steps': { component: MissingSteps },
  'coverage-analysis': { component: CoverageAnalysis },
  'generate-steps': { component: AiGenerator },
  'brd-analyzer': { component: BrdAnalyzer, props: { initialTab: 'testCases' } },
  reports: { component: Reports },
  settings: { component: Settings },
}

function App() {
  // Get initial page from URL or default
  const getInitialPage = () => {
    const search = window.location.search.substring(1)
    return (search && routes[search]) ? search : 'ado-connection'
  }

  const [activePage, setActivePage] = useState(getInitialPage())

  // Update URL when active page changes
  useEffect(() => {
    window.history.replaceState({}, '', `?${activePage}`)
  }, [activePage])

  const route = useMemo(() => routes[activePage] ?? routes['ado-connection'], [activePage])
  const CurrentPage = route.component

  return (
    <div className="app-shell">
      <Header />
      <div className="workspace-layout">
        <Sidebar activePage={activePage} onNavigate={setActivePage} />
        <main className="main-area">
          <CurrentPage key={activePage} onNavigate={setActivePage} {...(route.props ?? {})} />
        </main>
      </div>
    </div>
  )
}

export default App
