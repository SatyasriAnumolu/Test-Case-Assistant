import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const emptyForm = { organization: '', project: '', pat: '' }

const AdoConnectionContext = createContext(null)

// Lives above the router so connection state survives navigation between pages.
export function AdoConnectionProvider({ children }) {
  const [form, setForm] = useState(emptyForm)
  const [connected, setConnected] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState(null)
  const [importedCount, setImportedCount] = useState(0)
  const [projects, setProjects] = useState([])
  const [projectsOrg, setProjectsOrg] = useState('')
  const [areaPaths, setAreaPaths] = useState([])
  const [areaPathsProject, setAreaPathsProject] = useState('')
  const [selectedAreaPaths, setSelectedAreaPaths] = useState([])
  const [syncedTestCases, setSyncedTestCases] = useState([])
  // Import configuration that produced syncedTestCases; used to scope analysis.
  const [importConfig, setImportConfig] = useState(null)
  const [qualityTrend, setQualityTrend] = useState([])
  const [history, setHistory] = useState([])

  const updateForm = useCallback((key, value) => {
    setForm((current) => ({ ...current, [key]: value }))
  }, [])

  const setProjectsForOrg = useCallback((organization, list) => {
    setProjects(list)
    setProjectsOrg(organization)
  }, [])

  const setAreaPathsForProject = useCallback((project, list) => {
    setAreaPaths(list)
    setAreaPathsProject(project)
  }, [])

  const addHistoryEntry = useCallback((entry) => {
    // Repeating the same action replaces its earlier row instead of adding a duplicate.
    setHistory((current) =>
      [
        { id: crypto.randomUUID(), ...entry },
        ...current.filter(
          (item) =>
            !(item.action === entry.action && item.status === entry.status && item.records === entry.records),
        ),
      ].slice(0, 8),
    )
  }, [])

  const addQualityPoint = useCallback((point) => {
    setQualityTrend((current) => [...current, point].slice(-12))
  }, [])

  const reset = useCallback(() => {
    setForm(emptyForm)
    setConnected(false)
    setProjects([])
    setProjectsOrg('')
    setAreaPaths([])
    setAreaPathsProject('')
    setSelectedAreaPaths([])
    setSyncedTestCases([])
    setImportConfig(null)
    setQualityTrend([])
  }, [])

  const value = useMemo(
    () => ({
      form,
      updateForm,
      connected,
      setConnected,
      lastSyncAt,
      setLastSyncAt,
      importedCount,
      setImportedCount,
      projects,
      projectsOrg,
      setProjectsForOrg,
      areaPaths,
      areaPathsProject,
      setAreaPathsForProject,
      selectedAreaPaths,
      setSelectedAreaPaths,
      syncedTestCases,
      setSyncedTestCases,
      importConfig,
      setImportConfig,
      qualityTrend,
      addQualityPoint,
      history,
      addHistoryEntry,
      reset,
    }),
    [
      form,
      updateForm,
      connected,
      lastSyncAt,
      importedCount,
      projects,
      projectsOrg,
      setProjectsForOrg,
      areaPaths,
      areaPathsProject,
      setAreaPathsForProject,
      selectedAreaPaths,
      syncedTestCases,
      importConfig,
      qualityTrend,
      addQualityPoint,
      history,
      addHistoryEntry,
      reset,
    ],
  )

  return <AdoConnectionContext.Provider value={value}>{children}</AdoConnectionContext.Provider>
}

export function useAdoConnection() {
  const context = useContext(AdoConnectionContext)
  if (!context) {
    throw new Error('useAdoConnection must be used within an AdoConnectionProvider')
  }
  return context
}
