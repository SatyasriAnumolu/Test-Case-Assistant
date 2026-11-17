import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Dropdown,
  Field,
  Input,
  Menu,
  MenuItem,
  MenuList,
  MenuPopover,
  MenuTrigger,
  MessageBar,
  MessageBarActions,
  MessageBarBody,
  MessageBarTitle,
  Option,
  ProgressBar,
  SearchBox,
  Subtitle1,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title3,
  Tooltip,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowClockwiseRegular,
  ArrowImportRegular,
  ArrowSyncCircleRegular,
  CheckmarkCircleRegular,
  CloudArrowUpRegular,
  ClockRegular,
  InfoRegular,
  MoreHorizontalRegular,
  OpenRegular,
  TableRegular,
} from '@fluentui/react-icons'
import { useAdoConnection } from '../context/AdoConnectionContext'
import { getAdoWorkItemUrl } from '../utils/adoLinks'
import {
  fetchAdoAreaPaths,
  fetchAdoTestPlans,
  fetchAdoTestSuites,
  syncAdoTestCases,
} from '../services/apiService'
import { getImportPageBounds } from '../utils/importPagination'
import { formatTimestamp } from './ado/adoStyles'

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXL,
    width: '100%',
    maxWidth: '1280px',
    paddingBottom: tokens.spacingVerticalXXL,
    boxSizing: 'border-box',
    '& .fui-Button': {
      transitionDuration: tokens.durationFaster,
      transitionProperty: 'background-color, border-color, box-shadow, transform',
    },
    '& .fui-Button:not(:disabled):hover': {
      boxShadow: tokens.shadow4,
    },
    '& .fui-Button:not(:disabled):active': {
      transform: 'translateY(1px)',
      boxShadow: 'none',
    },
    '& .fui-Button:focus-visible, & [role="combobox"]:focus-visible, & input:focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '2px',
    },
    '& .fui-Dropdown, & .fui-Combobox, & .fui-SearchBox, & .fui-Input': {
      transitionDuration: tokens.durationFaster,
      transitionProperty: 'border-color, box-shadow',
    },
    '& .fui-Dropdown:hover, & .fui-Combobox:hover, & .fui-SearchBox:hover, & .fui-Input:hover': {
      boxShadow: `0 0 0 1px ${tokens.colorBrandStroke2}`,
    },
    '& .fui-Field__label': {
      fontWeight: tokens.fontWeightSemibold,
      color: tokens.colorNeutralForeground1,
    },
    '& .fui-Field__hint': {
      color: tokens.colorNeutralForeground2,
      lineHeight: tokens.lineHeightBase200,
      marginTop: tokens.spacingVerticalXXS,
      marginBottom: tokens.spacingVerticalXS,
    },
  },
  moreButton: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke1}`,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  narrowCol: {
    width: '96px',
    textAlign: 'center',
    '& .fui-TableHeaderCell__button': {
      justifyContent: 'center',
    },
  },
  idCol: {
    width: '110px',
  },
  stateCol: {
    width: '120px',
  },
  statePill: {
    display: 'inline-block',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
    paddingTop: '1px',
    paddingBottom: '1px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorNeutralBackground3,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase200,
    whiteSpace: 'nowrap',
  },
  emptyIcon: {
    display: 'block',
    margin: `0 auto ${tokens.spacingVerticalS}`,
    fontSize: '32px',
    color: tokens.colorNeutralForeground4,
  },
  pageTitle: {
    margin: 0,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.01em',
  },
  sectionTitle: {
    margin: 0,
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    letterSpacing: '-0.005em',
  },
  badge: {
    fontWeight: tokens.fontWeightSemibold,
    fontVariantNumeric: 'tabular-nums',
    paddingLeft: tokens.spacingHorizontalS,
    paddingRight: tokens.spacingHorizontalS,
  },
  cardHeaderIconSubtle: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  intro: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  introText: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  messageBar: {
    borderRadius: tokens.borderRadiusLarge,
    boxShadow: tokens.shadow4,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    borderLeftWidth: '4px',
    '& .fui-MessageBarTitle': {
      fontWeight: tokens.fontWeightBold,
    },
    '& .fui-MessageBar__icon': {
      fontSize: '20px',
    },
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: tokens.spacingHorizontalL,
  },
  card: {
    padding: tokens.spacingVerticalXL,
    rowGap: tokens.spacingVerticalL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    '@media (max-width: 640px)': {
      padding: tokens.spacingVerticalL,
    },
  },
  configCard: {
    padding: tokens.spacingVerticalXXL,
    rowGap: tokens.spacingVerticalXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow8,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorBrandStroke2}`,
    borderTop: `4px solid ${tokens.colorBrandBackground}`,
    backgroundImage: `linear-gradient(180deg, ${tokens.colorBrandBackground2} 0, ${tokens.colorNeutralBackground1} 120px)`,
    '@media (max-width: 640px)': {
      padding: tokens.spacingVerticalL,
    },
  },
  cardHeaderIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground,
    color: tokens.colorNeutralForegroundOnBrand,
    fontSize: '20px',
  },
  metricCard: {
    height: '100%',
    boxSizing: 'border-box',
    justifyContent: 'center',
    minHeight: '96px',
    padding: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingHorizontalXL,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderLeft: `4px solid ${tokens.colorBrandBackground}`,
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'box-shadow, transform',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  metricCardSuccess: {
    borderLeft: `4px solid ${tokens.colorPaletteGreenBorderActive}`,
  },
  metricCardNeutral: {
    borderLeft: `4px solid ${tokens.colorNeutralStrokeAccessible}`,
  },
  metricRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    minWidth: 0,
  },
  metricText: {
    minWidth: 0,
    flexGrow: 1,
  },
  metricLabelRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
  },
  infoIcon: {
    color: tokens.colorNeutralForeground3,
    fontSize: '14px',
    cursor: 'help',
    // Padding enlarges the hit area to 24x24px (WCAG 2.5.8) without shifting layout.
    padding: '5px',
    margin: '-5px',
    boxSizing: 'content-box',
    borderRadius: tokens.borderRadiusCircular,
    ':hover': {
      color: tokens.colorBrandForeground1,
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '0',
      color: tokens.colorBrandForeground1,
    },
  },
  metricIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '48px',
    height: '48px',
    borderRadius: tokens.borderRadiusCircular,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontSize: '22px',
  },
  metricIconSuccess: {
    backgroundColor: tokens.colorPaletteGreenBackground1,
    color: tokens.colorPaletteGreenForeground1,
  },
  metricIconNeutral: {
    backgroundColor: tokens.colorNeutralBackground3,
    color: tokens.colorNeutralForeground2,
  },
  metricLabel: {
    display: 'block',
    color: tokens.colorNeutralForeground2,
    textTransform: 'uppercase',
    letterSpacing: '0.03em',
    fontSize: tokens.fontSizeBase200,
    fontWeight: tokens.fontWeightSemibold,
  },
  metricValue: {
    fontSize: tokens.fontSizeHero700,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightHero700,
    color: tokens.colorNeutralForeground1,
    fontVariantNumeric: 'tabular-nums',
  },
  metricValueSmall: {
    display: 'flex',
    alignItems: 'center',
    minHeight: tokens.lineHeightHero700,
    fontSize: tokens.fontSizeBase400,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
    color: tokens.colorNeutralForeground1,
    overflowWrap: 'anywhere',
  },
  stepGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    columnGap: tokens.spacingHorizontalXL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'start',
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  advancedRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalS,
    '& > *': {
      flexGrow: 1,
      minWidth: '180px',
    },
  },
  actions: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalM,
    marginLeft: `calc(-1 * ${tokens.spacingVerticalXXL})`,
    marginRight: `calc(-1 * ${tokens.spacingVerticalXXL})`,
    marginBottom: `calc(-1 * ${tokens.spacingVerticalXXL})`,
    paddingTop: tokens.spacingVerticalL,
    paddingBottom: tokens.spacingVerticalL,
    paddingLeft: tokens.spacingVerticalXXL,
    paddingRight: tokens.spacingVerticalXXL,
    borderTop: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground2,
    borderBottomLeftRadius: tokens.borderRadiusXLarge,
    borderBottomRightRadius: tokens.borderRadiusXLarge,
    '@media (max-width: 640px)': {
      marginLeft: `calc(-1 * ${tokens.spacingVerticalL})`,
      marginRight: `calc(-1 * ${tokens.spacingVerticalL})`,
      marginBottom: `calc(-1 * ${tokens.spacingVerticalL})`,
      paddingLeft: tokens.spacingVerticalL,
      paddingRight: tokens.spacingVerticalL,
    },
  },
  progress: {
    marginTop: `calc(-1 * ${tokens.spacingVerticalS})`,
  },
  tableHeaderRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  tableWrap: {
    overflow: 'auto',
    maxHeight: 'min(560px, 65vh)',
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '2px',
    },
  },
  table: {
    minWidth: '760px',
    '& td': {
      paddingTop: tokens.spacingVerticalS,
      paddingBottom: tokens.spacingVerticalS,
    },
  },
  pagination: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
    paddingTop: tokens.spacingVerticalS,
    paddingBottom: tokens.spacingVerticalS,
    paddingLeft: tokens.spacingHorizontalM,
    paddingRight: tokens.spacingHorizontalM,
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke3}`,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  paginationControls: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
  },
  pageInput: {
    width: '90px',
  },
  headerCell: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    height: '44px',
    fontWeight: tokens.fontWeightBold,
    color: tokens.colorNeutralForeground1,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    fontSize: tokens.fontSizeBase200,
    backgroundColor: tokens.colorNeutralBackground3,
    whiteSpace: 'nowrap',
    boxShadow: `inset 0 -2px 0 ${tokens.colorNeutralStroke1}`,
  },
  row: {
    transitionDuration: tokens.durationFaster,
    transitionProperty: 'background-color',
    ':nth-child(even)': {
      backgroundColor: tokens.colorNeutralBackground2,
    },
    ':hover': {
      backgroundColor: tokens.colorBrandBackground2,
    },
  },
  idCell: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
    whiteSpace: 'nowrap',
  },
  idLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: 'none',
    borderRadius: tokens.borderRadiusSmall,
    ':hover': {
      color: tokens.colorBrandForegroundLinkHover,
      textDecorationLine: 'underline',
    },
    ':focus-visible': {
      outline: `2px solid ${tokens.colorBrandStroke1}`,
      outlineOffset: '2px',
    },
  },
  idLinkIcon: {
    fontSize: '14px',
    flexShrink: 0,
  },
  wrapCell: {
    maxWidth: '420px',
  },
  emptyCell: {
    color: tokens.colorNeutralForeground3,
    paddingTop: tokens.spacingVerticalXXL,
    paddingBottom: tokens.spacingVerticalXXL,
    textAlign: 'center',
  },
  subtle: {
    color: tokens.colorNeutralForeground3,
  },
})

const scopeLabels = {
  all: 'All Test Cases',
  plan: 'Selected Test Plan',
  suite: 'Selected Suite',
}

const scopeHints = {
  all: 'Every test case in the project. Test Plan and Test Suite are ignored.',
  plan: 'Every test case across all suites in the selected plan.',
  suite: 'Only the selected suite and its child suites.',
}

function ImportTestCases({ onNavigate }) {
  const styles = useStyles()
  const {
    connected,
    form,
    areaPaths,
    areaPathsProject,
    setAreaPathsForProject,
    selectedAreaPaths,
    setSelectedAreaPaths,
    syncedTestCases,
    setSyncedTestCases,
    setImportConfig,
    setImportedCount,
    lastSyncAt,
    setLastSyncAt,
  } = useAdoConnection()
  const [message, setMessage] = useState(null)
  const [busy, setBusy] = useState(false)
  const [loadingAreaPaths, setLoadingAreaPaths] = useState(false)
  const [loadingTestPlans, setLoadingTestPlans] = useState(false)
  const [loadingTestSuites, setLoadingTestSuites] = useState(false)
  const [areaPathQuery, setAreaPathQuery] = useState('')
  const [selectedProject, setSelectedProject] = useState(form.project || '')
  const [testPlans, setTestPlans] = useState([])
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [testSuites, setTestSuites] = useState([])
  const [selectedSuiteId, setSelectedSuiteId] = useState('')
  const [planCache, setPlanCache] = useState({})
  const [suiteCache, setSuiteCache] = useState({})
  const [importScope, setImportScope] = useState('all')
  const [importedRecords, setImportedRecords] = useState(0)
  const [lastImportContext, setLastImportContext] = useState({
    scope: 'all',
    planId: null,
    suiteId: null,
    planName: null,
    suiteName: null,
  })
  const attemptedAreaPathProjects = useRef(new Set())

  const activeProject = (selectedProject || form.project || '').trim()
  const organization = form.organization.trim()
  const pat = form.pat.trim()
  const isTestPlanDisabled = !connected || loadingTestPlans
  // An empty cached list must not lock the control out, but retry only once per project.
  const shouldLoadAreaPaths =
    connected &&
    Boolean(organization && activeProject && pat) &&
    (areaPathsProject !== activeProject || areaPaths.length === 0)

  useEffect(() => {
    if (!shouldLoadAreaPaths) return undefined
    if (areaPathsProject === activeProject && attemptedAreaPathProjects.current.has(activeProject)) {
      return undefined
    }

    let cancelled = false
    const timer = setTimeout(async () => {
      setLoadingAreaPaths(true)
      attemptedAreaPathProjects.current.add(activeProject)
      try {
        const discovered = await fetchAdoAreaPaths({
          organization,
          project: activeProject,
          pat,
        })
        if (cancelled) return
        setAreaPathsForProject(activeProject, discovered)
        setSelectedAreaPaths([])
      } catch (error) {
        if (cancelled) return
        setMessage({
          intent: 'error',
          title: 'Could not load area paths',
          text: error.message || 'Area path discovery failed.',
        })
      } finally {
        if (!cancelled) setLoadingAreaPaths(false)
      }
    }, 500)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [
    shouldLoadAreaPaths,
    organization,
    activeProject,
    pat,
    setAreaPathsForProject,
    setSelectedAreaPaths,
  ])

  useEffect(() => {
    if (importScope === 'all') return undefined
    if (!connected || !organization || !activeProject || !pat) return undefined

    let cancelled = false
    const loadPlans = async () => {
      setLoadingTestPlans(true)
      console.debug('Import Flow :: Project ID/Name', activeProject)

      try {
        const cachedPlans = planCache[activeProject]
        if (cachedPlans?.length) {
          setTestPlans(cachedPlans)
          const currentExists = cachedPlans.some((plan) => String(plan.id) === selectedPlanId)
          setSelectedPlanId(currentExists ? selectedPlanId : String(cachedPlans[0].id))
        }

        const plans = await fetchAdoTestPlans({
          organization,
          project: activeProject,
          pat,
          areaPaths: [],
        })
        if (cancelled) return

        console.debug('Import Flow :: Test Plan API response', plans)

        setTestPlans(plans)
        setPlanCache((current) => ({ ...current, [activeProject]: plans }))

        if (plans.length > 0) {
          const currentExists = plans.some((plan) => String(plan.id) === selectedPlanId)
          setSelectedPlanId(currentExists ? selectedPlanId : String(plans[0].id))
        } else {
          setSelectedPlanId('')
          setTestSuites([])
          setSelectedSuiteId('')
          setMessage({
            intent: 'info',
            title: 'No test plans found',
            text: 'No Test Plans found for the selected project.',
          })
        }
      } catch (error) {
        if (cancelled) return
        setTestPlans([])
        setSelectedPlanId('')
        setTestSuites([])
        setSelectedSuiteId('')
        setMessage({
          intent: 'warning',
          title: 'Could not load test plans',
          text: error.message || 'Test plan discovery failed.',
        })
      } finally {
        if (!cancelled) setLoadingTestPlans(false)
      }
    }

    loadPlans()

    return () => {
      cancelled = true
    }
  }, [connected, organization, activeProject, pat, importScope])

  useEffect(() => {
    if (importScope !== 'suite') return undefined
    const planId = Number(selectedPlanId)
    if (!connected || !organization || !activeProject || !pat || !planId) return undefined

    let cancelled = false
    const loadSuites = async () => {
      setLoadingTestSuites(true)
      try {
        const suiteCacheKey = `${activeProject}:${planId}`
        const cachedSuites = suiteCache[suiteCacheKey]
        if (cachedSuites?.length) {
          setTestSuites(cachedSuites)
          const currentExists = cachedSuites.some((suite) => String(suite.id) === selectedSuiteId)
          setSelectedSuiteId(currentExists ? selectedSuiteId : String(cachedSuites[0].id))
        }

        const suites = await fetchAdoTestSuites({
          organization,
          project: activeProject,
          planId,
          pat,
        })
        if (cancelled) return

        // Debug log 3: test suite response payload.
        console.debug('Import Flow :: Test Suite API response', suites)

        setTestSuites(suites)
        setSuiteCache((current) => ({ ...current, [suiteCacheKey]: suites }))

        if (suites.length > 0) {
          const currentExists = suites.some((suite) => String(suite.id) === selectedSuiteId)
          setSelectedSuiteId(currentExists ? selectedSuiteId : String(suites[0].id))
        } else {
          setSelectedSuiteId('')
          setMessage({
            intent: 'info',
            title: 'No test suites found',
            text: 'No Test Suites found for the selected Test Plan.',
          })
        }
      } catch (error) {
        if (cancelled) return
        setTestSuites([])
        setSelectedSuiteId('')
        setMessage({
          intent: 'warning',
          title: 'Could not load test suites',
          text: error.message || 'Test suite discovery failed.',
        })
      } finally {
        if (!cancelled) setLoadingTestSuites(false)
      }
    }

    loadSuites()

    return () => {
      cancelled = true
    }
  }, [connected, organization, activeProject, pat, selectedPlanId, importScope])

  const selectedPlan = useMemo(
    () => testPlans.find((plan) => String(plan.id) === selectedPlanId) ?? null,
    [testPlans, selectedPlanId],
  )
  const selectedSuite = useMemo(
    () => testSuites.find((suite) => String(suite.id) === selectedSuiteId) ?? null,
    [testSuites, selectedSuiteId],
  )
  const filteredAreaPaths = useMemo(() => {
    const query = areaPathQuery.trim().toLowerCase()
    if (!query) return areaPaths
    return areaPaths.filter((path) => path.toLowerCase().includes(query))
  }, [areaPaths, areaPathQuery])

  const visibleAreaPaths = useMemo(() => {
    const selectedSet = new Set(selectedAreaPaths)
    const selectedVisible = selectedAreaPaths.filter((path) => selectedSet.has(path))
    const unselectedVisible = filteredAreaPaths.filter((path) => !selectedSet.has(path))
    return [...selectedVisible, ...unselectedVisible]
  }, [selectedAreaPaths, filteredAreaPaths])

  const selectedAreaTestCaseCount = useMemo(() => {
    if (selectedAreaPaths.length === 0) return syncedTestCases.length
    const selectedSet = new Set(selectedAreaPaths.map((path) => path.toLowerCase()))
    return syncedTestCases.filter((item) => {
      const areaPath = (item.areaPath || '').toLowerCase()
      return [...selectedSet].some(
        (selectedPath) => areaPath === selectedPath || areaPath.startsWith(`${selectedPath}\\`),
      )
    }).length
  }, [selectedAreaPaths, syncedTestCases])

  const selectionMatchesDisplayedResults = (() => {
    if (syncedTestCases.length === 0) return true
    if (lastImportContext.scope !== importScope) return false
    if (importScope === 'plan') return lastImportContext.planId === Number(selectedPlanId)
    if (importScope === 'suite') {
      return (
        lastImportContext.planId === Number(selectedPlanId) &&
        lastImportContext.suiteId === Number(selectedSuiteId)
      )
    }
    return true
  })()

  const runImport = async (mode) => {
    if (!connected) {
      setMessage({
        intent: 'warning',
        title: 'Connect to Azure DevOps first',
        text: 'Connection configuration belongs to the ADO Connection page.',
      })
      return
    }

    const effectiveScope = importScope

    if (effectiveScope === 'suite' && (!selectedPlanId || !selectedSuiteId)) {
      setMessage({
        intent: 'warning',
        title: 'Select a test suite',
        text: 'Choose a Test Plan and Test Suite before syncing selected suite test cases.',
      })
      return
    }

    if (effectiveScope === 'plan' && !selectedPlanId) {
      setMessage({
        intent: 'warning',
        title: 'Select a test plan',
        text: 'Choose a Test Plan before syncing all of its test cases.',
      })
      return
    }

    setBusy(true)
    setMessage(null)

    const payload = {
      organization,
      project: activeProject,
      pat,
      areaPaths: selectedAreaPaths,
      planId: effectiveScope === 'suite' || effectiveScope === 'plan' ? Number(selectedPlanId) : null,
      suiteId: effectiveScope === 'suite' ? Number(selectedSuiteId) : null,
      scope: effectiveScope,
    }

    console.debug('Import Flow :: Sync request', {
      scope: payload.scope,
      planId: payload.planId,
      planName: selectedPlan?.name ?? null,
      suiteId: payload.suiteId,
      suiteName: selectedSuite?.name ?? null,
      areaPaths: payload.areaPaths,
    })

    try {
      const result = await syncAdoTestCases(payload)

      const importedItems = result.testCases ?? []

      console.debug('Import Flow :: Sync response', {
        scope: result.scope ?? payload.scope,
        planId: result.planId ?? payload.planId,
        suiteId: result.suiteId ?? payload.suiteId,
        returnedTestCases: importedItems.length,
      })

      const at = result.syncedAt ?? new Date().toISOString()

      setSyncedTestCases(importedItems)
      setImportConfig({
        project: activeProject,
        scope: effectiveScope,
        areaPaths: [...payload.areaPaths],
        planId: payload.planId,
        suiteId: payload.suiteId,
        planName: selectedPlan?.name ?? null,
        suiteName: selectedSuite?.name ?? null,
      })
      setImportedCount(importedItems.length)
      setImportedRecords(importedItems.length)
      setLastSyncAt(at)
      setLastImportContext({
        scope: effectiveScope,
        planId: payload.planId,
        suiteId: payload.suiteId,
        planName: selectedPlan?.name ?? null,
        suiteName: selectedSuite?.name ?? null,
      })

      setMessage({
        intent: 'success',
        title: `${mode} completed`,
        text: result.message || `${importedItems.length} test cases imported.`,
      })
    } catch (error) {
      setImportedRecords(0)
      setMessage({
        intent: 'error',
        title: `${mode} failed`,
        text: error.message || 'Unable to import test cases.',
      })
    } finally {
      setBusy(false)
    }
  }

  const handleRefreshAreaPaths = async () => {
    if (!connected || !organization || !activeProject || !pat) {
      setMessage({
        intent: 'warning',
        title: 'Missing connection context',
        text: 'Select a project and complete connection details on ADO Connection page first.',
      })
      return
    }

    setLoadingAreaPaths(true)
    setMessage(null)
    attemptedAreaPathProjects.current.delete(activeProject)

    try {
      const discovered = await fetchAdoAreaPaths({ organization, project: activeProject, pat })
      setAreaPathsForProject(activeProject, discovered)
      setSelectedAreaPaths([])
      setMessage({
        intent: 'success',
        title: 'Area paths refreshed',
        text: `${discovered.length} area paths loaded for ${activeProject}.`,
      })
    } catch (error) {
      setMessage({
        intent: 'error',
        title: 'Could not load area paths',
        text: error.message || 'Area path discovery failed.',
      })
    } finally {
      setLoadingAreaPaths(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <div className={styles.introText}>
          <Title3 as="h1" className={styles.pageTitle}>Import Test Cases</Title3>
          <Body1 className={styles.subtle}>
            Import and synchronize test cases from Azure DevOps into your workspace.
          </Body1>
        </div>
        <Badge
          className={styles.badge}
          appearance="tint"
          shape="rounded"
          size="large"
          color={connected ? 'success' : 'informative'}
        >
          {connected ? 'Connected' : 'Not connected'}
        </Badge>
      </div>

      {message && (
        <MessageBar intent={message.intent} className={styles.messageBar}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      {!connected && (
        <MessageBar intent="info" className={styles.messageBar}>
          <MessageBarBody>
            <MessageBarTitle>Not connected</MessageBarTitle>
            Connect to Azure DevOps to load test plans and start importing.
          </MessageBarBody>
          <MessageBarActions>
            <Button appearance="transparent" onClick={() => onNavigate('ado-connection')}>
              Go to ADO Connection
            </Button>
          </MessageBarActions>
        </MessageBar>
      )}

      <Card className={styles.configCard}>
        <CardHeader
          image={
            <span className={styles.cardHeaderIcon} aria-hidden="true">
              <ArrowImportRegular />
            </span>
          }
          header={
            <Subtitle1 as="h2" className={styles.sectionTitle}>
              Import configuration
            </Subtitle1>
          }
          description={
            <Caption1 className={styles.subtle}>
              Pick an Import Scope first — it decides which of the fields below apply.
            </Caption1>
          }
        />
        <div className={styles.stepGrid}>
          <Field label="Project">
            <Dropdown
              value={selectedProject || form.project || 'Select project'}
              selectedOptions={selectedProject ? [selectedProject] : []}
              onOptionSelect={(_e, data) => setSelectedProject(data.optionValue || '')}
            >
              {[form.project || ''].filter(Boolean).map((project) => (
                <Option key={project} value={project}>
                  {project}
                </Option>
              ))}
            </Dropdown>
          </Field>

          <Field label="Import Scope" hint={scopeHints[importScope]}>
            <Dropdown
              value={scopeLabels[importScope] ?? scopeLabels.all}
              selectedOptions={[importScope]}
              onOptionSelect={(_e, data) => setImportScope(data.optionValue || 'all')}
            >
              <Option value="all">All Test Cases</Option>
              <Option value="plan">Selected Test Plan</Option>
              <Option value="suite">Selected Suite</Option>
            </Dropdown>
          </Field>

          {importScope === 'all' && (
            <Field
              label="Area Path"
              hint={
                loadingAreaPaths
                  ? `Loading area paths for ${activeProject || 'selected project'}...`
                  : areaPaths.length
                    ? selectedAreaPaths.length
                      ? `${selectedAreaTestCaseCount.toLocaleString()} currently imported cases match. Click Sync to apply this filter.`
                      : 'Optional. Leave empty to import every test case in the project.'
                    : 'No area paths found. Area path is optional; use Refresh to retry.'
              }
            >
              <div className={styles.advancedRow}>
                <SearchBox
                  value={areaPathQuery}
                  onChange={(_event, data) => setAreaPathQuery(data.value)}
                  placeholder="Search area paths"
                  disabled={!connected || loadingAreaPaths || areaPaths.length === 0}
                />
                <Dropdown
                  multiselect
                  value={selectedAreaPaths.join(', ')}
                  selectedOptions={selectedAreaPaths}
                  placeholder={areaPaths.length ? 'All Area Paths' : 'No area paths available'}
                  disabled={!connected || loadingAreaPaths || areaPaths.length === 0}
                  onOptionSelect={(_e, data) => {
                    setSelectedAreaPaths(data.selectedOptions)
                    setAreaPathQuery('')
                  }}
                >
                  {visibleAreaPaths.map((path) => (
                    <Option key={path} value={path}>
                      {path}
                    </Option>
                  ))}
                </Dropdown>
              </div>
            </Field>
          )}

          {importScope !== 'all' && (
            <Field label="Test Plan">
              <Dropdown
                value={selectedPlan?.name || (loadingTestPlans ? 'Loading test plans...' : 'Select test plan')}
                selectedOptions={selectedPlanId ? [selectedPlanId] : []}
                disabled={isTestPlanDisabled}
                onOptionSelect={(_e, data) => setSelectedPlanId(data.optionValue || '')}
              >
                {testPlans.map((plan) => (
                  <Option key={plan.id} value={String(plan.id)}>
                    {plan.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}

          {importScope === 'suite' && (
            <Field label="Test Suite">
              <Dropdown
                value={selectedSuite?.name || (loadingTestSuites ? 'Loading test suites...' : 'Select suite')}
                selectedOptions={selectedSuiteId ? [selectedSuiteId] : []}
                onOptionSelect={(_e, data) => setSelectedSuiteId(data.optionValue || '')}
                disabled={isTestPlanDisabled || loadingTestSuites || testSuites.length === 0}
              >
                {testSuites.map((suite) => (
                  <Option key={suite.id} value={String(suite.id)}>
                    {suite.name}
                  </Option>
                ))}
              </Dropdown>
            </Field>
          )}
        </div>

        {busy && <ProgressBar thickness="large" className={styles.progress} />}

        <div className={styles.actions}>
          <Tooltip
            content="Fetch test cases from Azure DevOps using the selected scope and filters"
            relationship="description"
            withArrow
          >
            <Button
              appearance="primary"
              size="large"
              icon={<ArrowSyncCircleRegular />}
              disabled={busy || !connected}
              onClick={() => runImport('Sync Test Cases')}
            >
              {busy ? 'Syncing…' : 'Sync Test Cases'}
            </Button>
          </Tooltip>
          <Tooltip content="Reload area paths for the selected project" relationship="description" withArrow>
            <Button
              size="large"
              icon={<ArrowClockwiseRegular />}
              disabled={busy || !connected}
              onClick={handleRefreshAreaPaths}
            >
              Refresh
            </Button>
          </Tooltip>
          <Menu>
            <MenuTrigger disableButtonEnhancement>
              <Tooltip content="Incremental sync and re-import options" relationship="description" withArrow>
                <Button
                  size="large"
                  icon={<MoreHorizontalRegular />}
                  appearance="subtle"
                  aria-label="More actions"
                  className={styles.moreButton}
                  disabled={busy || !connected}
                />
              </Tooltip>
            </MenuTrigger>
            <MenuPopover>
              <MenuList>
                <MenuItem onClick={() => runImport('Incremental Sync')}>Incremental Sync</MenuItem>
                <MenuItem onClick={() => runImport('Re-import Test Cases')}>
                  Re-import Test Cases
                </MenuItem>
              </MenuList>
            </MenuPopover>
          </Menu>
        </div>
      </Card>

      <div className={styles.summaryGrid}>
        <Card className={styles.metricCard}>
          <div className={styles.metricRow}>
            <span className={styles.metricIcon} aria-hidden="true">
              <CloudArrowUpRegular />
            </span>
            <div className={styles.metricText}>
              <div className={styles.metricLabelRow}>
                <Caption1 className={styles.metricLabel}>Total Test Cases</Caption1>
                <Tooltip content="Test cases returned by the most recent sync" relationship="description" withArrow>
                  <InfoRegular className={styles.infoIcon} tabIndex={0} aria-label="About Total Test Cases" />
                </Tooltip>
              </div>
              <div className={styles.metricValue}>{syncedTestCases.length}</div>
            </div>
          </div>
        </Card>

        <Card className={mergeClasses(styles.metricCard, styles.metricCardSuccess)}>
          <div className={styles.metricRow}>
            <span className={mergeClasses(styles.metricIcon, styles.metricIconSuccess)} aria-hidden="true">
              <CheckmarkCircleRegular />
            </span>
            <div className={styles.metricText}>
              <div className={styles.metricLabelRow}>
                <Caption1 className={styles.metricLabel}>Imported Records</Caption1>
                <Tooltip content="Records imported into this workspace during the latest sync" relationship="description" withArrow>
                  <InfoRegular className={styles.infoIcon} tabIndex={0} aria-label="About Imported Records" />
                </Tooltip>
              </div>
              <div className={styles.metricValue}>{importedRecords}</div>
            </div>
          </div>
        </Card>

        <Card className={mergeClasses(styles.metricCard, styles.metricCardNeutral)}>
          <div className={styles.metricRow}>
            <span className={mergeClasses(styles.metricIcon, styles.metricIconNeutral)} aria-hidden="true">
              <ClockRegular />
            </span>
            <div className={styles.metricText}>
              <div className={styles.metricLabelRow}>
                <Caption1 className={styles.metricLabel}>Last Sync</Caption1>
                <Tooltip content="When test cases were last synchronized in this session" relationship="description" withArrow>
                  <InfoRegular className={styles.infoIcon} tabIndex={0} aria-label="About Last Sync" />
                </Tooltip>
              </div>
              <div className={styles.metricValueSmall}>{formatTimestamp(lastSyncAt)}</div>
            </div>
          </div>
        </Card>
      </div>

      <Card className={styles.card}>
        <CardHeader
          image={
            <span className={mergeClasses(styles.cardHeaderIcon, styles.cardHeaderIconSubtle)} aria-hidden="true">
              <TableRegular />
            </span>
          }
          header={
            <div className={styles.tableHeaderRow}>
              <Subtitle1 as="h2" className={styles.sectionTitle}>
                Imported test cases
              </Subtitle1>
              <Badge className={styles.badge} appearance="tint" shape="rounded" size="large" color="brand">
                {syncedTestCases.length.toLocaleString()}
              </Badge>
            </div>
          }
          description={
            <Caption1 className={styles.subtle}>
              {!selectionMatchesDisplayedResults
                ? 'Selection changed. Run Sync Test Cases to refresh this list.'
                : lastImportContext.scope === 'suite'
                  ? `Showing test cases from ${lastImportContext.planName || 'selected plan'} / ${
                      lastImportContext.suiteName || 'selected suite'
                    } only.`
                  : lastImportContext.scope === 'plan'
                    ? `Showing every test case in ${lastImportContext.planName || 'the selected plan'}.`
                    : 'Latest synchronized test cases from Azure DevOps.'}
            </Caption1>
          }
        />

        <ImportedTestCasesTable
          key={lastSyncAt || 'initial'}
          testCases={syncedTestCases}
          styles={styles}
          organization={organization}
          project={activeProject}
        />
      </Card>
    </div>
  )
}

function ImportedTestCasesTable({ testCases, styles, organization, project }) {
  const [requestedPage, setRequestedPage] = useState(1)
  const [pageInput, setPageInput] = useState('1')
  const { page, pageCount, start, end } = getImportPageBounds(testCases.length, requestedPage)
  const visibleTestCases = testCases.slice(start, end)

  const goToPage = (nextPage) => {
    setRequestedPage(nextPage)
    setPageInput(String(nextPage))
  }

  return (
    <>
      <div
        className={styles.tableWrap}
        role="region"
        aria-label="Imported test cases table, scrollable"
        tabIndex={0}
      >
        <Table aria-label="Imported test cases list" size="medium" className={styles.table}>
          <TableHeader>
            <TableRow>
              <TableHeaderCell className={mergeClasses(styles.headerCell, styles.idCol)}>ID</TableHeaderCell>
              <TableHeaderCell className={styles.headerCell}>Title</TableHeaderCell>
              <TableHeaderCell className={styles.headerCell}>Area Path</TableHeaderCell>
              <TableHeaderCell className={mergeClasses(styles.headerCell, styles.stateCol)}>State</TableHeaderCell>
              <TableHeaderCell className={mergeClasses(styles.headerCell, styles.narrowCol)}>Priority</TableHeaderCell>
              <TableHeaderCell className={mergeClasses(styles.headerCell, styles.narrowCol)}>Steps</TableHeaderCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleTestCases.length > 0 ? (
              visibleTestCases.map((item) => (
                <TableRow key={item.id} className={styles.row}>
                  <TableCell className={styles.idCell}>
                    {(() => {
                      const adoUrl = getAdoWorkItemUrl(organization, project, item.id)
                      if (!adoUrl) return item.id
                      return (
                        <a
                          href={adoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.idLink}
                          title={`Open test case ${item.id} in Azure DevOps (new tab)`}
                          aria-label={`Open test case ${item.id} in Azure DevOps (opens in new tab)`}
                        >
                          {item.id}
                          <OpenRegular className={styles.idLinkIcon} aria-hidden="true" />
                        </a>
                      )
                    })()}
                  </TableCell>
                  <TableCell className={styles.wrapCell} title={item.title || undefined}>
                    <TableCellLayout truncate>{item.title}</TableCellLayout>
                  </TableCell>
                  <TableCell className={styles.wrapCell} title={item.areaPath || undefined}>
                    <TableCellLayout truncate>{item.areaPath || 'N/A'}</TableCellLayout>
                  </TableCell>
                  <TableCell>
                    <span className={styles.statePill}>{item.state || 'N/A'}</span>
                  </TableCell>
                  <TableCell className={styles.narrowCol}>{item.priority || 'N/A'}</TableCell>
                  <TableCell className={styles.narrowCol}>{item.stepCount ?? 0}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className={styles.emptyCell}>
                  <TableRegular className={styles.emptyIcon} aria-hidden="true" />
                  No synchronized test cases yet. Click Sync Test Cases to load and display the list.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {testCases.length > 0 && (
        <div className={styles.pagination}>
          <Caption1 role="status">
            Showing {(start + 1).toLocaleString()} - {end.toLocaleString()} of{' '}
            {testCases.length.toLocaleString()} test cases
          </Caption1>
          {pageCount > 1 && (
            <form
              className={styles.paginationControls}
              aria-label="Imported test cases pages"
              onSubmit={(event) => {
                event.preventDefault()
                goToPage(Number(pageInput))
              }}
            >
              <Button type="button" disabled={page === 1} onClick={() => goToPage(page - 1)}>
                Previous
              </Button>
              <Caption1>Page</Caption1>
              <Input
                className={styles.pageInput}
                aria-label="Page number"
                type="number"
                min={1}
                max={pageCount}
                step={1}
                required
                value={pageInput}
                onChange={(_event, data) => setPageInput(data.value)}
              />
              <Caption1>of {pageCount.toLocaleString()}</Caption1>
              <Button type="submit">Go</Button>
              <Button type="button" disabled={page === pageCount} onClick={() => goToPage(page + 1)}>
                Next
              </Button>
            </form>
          )}
        </div>
      )}
    </>
  )
}

export default ImportTestCases
