import { useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Link,
  ProgressBar,
  SearchBox,
  Subtitle2,
  Title3,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  LightbulbFilamentRegular,
  OpenRegular,
  WarningFilled,
  ErrorCircleFilled,
} from '@fluentui/react-icons'
import { useAdoConnection } from '../context/AdoConnectionContext'
import { findDuplicateClusters } from '../utils/duplicates'

const scoringCategories = [
  { key: 'stepClarity', label: 'Step Clarity' },
  { key: 'expectedResults', label: 'Expected Results' },
  { key: 'coverage', label: 'Coverage' },
  { key: 'standardization', label: 'Standardization' },
]

const THIN_STEP_LIMIT = 2
const SHORT_TITLE_WORDS = 4

// Every score below is derived only from fields the ADO import actually returns:
// stepCount, state, priority, areaPath and title.
function analyseTestCase(item, duplicateIds, areaCounts) {
  const steps = item.stepCount ?? 0
  const title = item.title ?? ''
  const words = title.trim().split(/\s+/).filter(Boolean)
  const areaSize = areaCounts.get(item.areaPath || 'Unassigned') ?? 0
  const isDuplicate = duplicateIds.has(item.id)

  const stepClarity = steps === 0 ? 10 : steps <= THIN_STEP_LIMIT ? 45 : steps >= 5 ? 92 : 75
  const expectedResults = steps === 0 ? 15 : steps <= THIN_STEP_LIMIT ? 50 : 80
  const coverage = (isDuplicate ? 45 : 80) + (areaSize >= 5 ? 15 : 0)
  const standardization =
    (words.length >= SHORT_TITLE_WORDS ? 45 : 15) +
    (/^[A-Z]/.test(title) ? 20 : 0) +
    (item.priority ? 20 : 0) +
    (item.state === 'Ready' ? 15 : item.state === 'Design' ? 8 : 0)

  const issues = []
  if (steps === 0) {
    issues.push({
      severity: 'High',
      category: 'Step Clarity',
      text: 'This test case has no steps recorded in Azure DevOps.',
    })
  } else if (steps <= THIN_STEP_LIMIT) {
    issues.push({
      severity: 'Medium',
      category: 'Step Clarity',
      text: `Only ${steps} step${steps === 1 ? '' : 's'} recorded, which is usually too thin to execute reliably.`,
    })
  }

  if (steps === 0) {
    issues.push({
      severity: 'High',
      category: 'Expected Results',
      text: 'Without steps there are no expected results to verify against.',
    })
  }

  if (isDuplicate) {
    issues.push({
      severity: 'Medium',
      category: 'Coverage',
      text: 'A near-identical test case exists; this one was clustered as a duplicate.',
    })
  }

  if (words.length < SHORT_TITLE_WORDS) {
    issues.push({
      severity: 'Medium',
      category: 'Standardization',
      text: `Title is only ${words.length} word${words.length === 1 ? '' : 's'} and may not describe the scenario.`,
    })
  }

  if (title && !/^[A-Z]/.test(title)) {
    issues.push({
      severity: 'Low',
      category: 'Standardization',
      text: 'Title does not start with a capital letter.',
    })
  }

  if (!item.priority) {
    issues.push({
      severity: 'Low',
      category: 'Standardization',
      text: 'No priority is set on the work item.',
    })
  }

  if (item.state !== 'Ready') {
    issues.push({
      severity: 'Low',
      category: 'Coverage',
      text: `State is "${item.state || 'unset'}", so this case is not marked ready to run.`,
    })
  }

  const recommendations = []
  if (steps <= THIN_STEP_LIMIT) {
    recommendations.push('Author explicit steps with an expected result on each verification point.')
  }
  if (isDuplicate) {
    recommendations.push('Review the duplicate cluster in Duplicate Test Cases and merge into one case.')
  }
  if (words.length < SHORT_TITLE_WORDS) {
    recommendations.push('Rename using the "<action> <object> <condition>" convention.')
  }
  if (!item.priority) {
    recommendations.push('Assign a priority so the case can be ranked for regression runs.')
  }
  if (item.state !== 'Ready') {
    recommendations.push('Move the case to Ready once steps and expected results are complete.')
  }

  return {
    id: item.id,
    title: title || `Test case ${item.id}`,
    module: (item.areaPath || 'Unassigned').split('\\').pop(),
    areaPath: item.areaPath || 'Unassigned',
    state: item.state || 'Unset',
    priority: item.priority,
    stepCount: steps,
    scores: {
      stepClarity: Math.min(100, stepClarity),
      expectedResults: Math.min(100, expectedResults),
      coverage: Math.min(100, coverage),
      standardization: Math.min(100, standardization),
    },
    issues,
    recommendations,
  }
}


function overallScore(scores) {
  const values = scoringCategories.map((category) => scores[category.key])
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)
}

function scoreTone(score) {
  if (score >= 80) return 'good'
  if (score >= 60) return 'fair'
  return 'poor'
}

const severityColor = { High: 'danger', Medium: 'warning', Low: 'informative' }
const severityIcon = {
  High: ErrorCircleFilled,
  Medium: WarningFilled,
  Low: CheckmarkCircleFilled,
}

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1320px',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(280px, 0.7fr) minmax(420px, 1.3fr)',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'start',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
    maxHeight: '460px',
    overflowY: 'auto',
  },
  listItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalM,
    width: '100%',
    boxSizing: 'border-box',
    padding: tokens.spacingVerticalS,
    border: `${tokens.strokeWidthThin} solid transparent`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
    fontFamily: tokens.fontFamilyBase,
    transitionProperty: 'background-color, border-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground3Hover,
    },
  },
  listItemSelected: {
    backgroundColor: tokens.colorBrandBackground2,
    borderColor: tokens.colorBrandStroke2,
  },
  listItemText: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  listItemTitle: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  gaugeRow: {
    display: 'grid',
    gridTemplateColumns: 'auto 1fr',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalL,
    '@media (max-width: 720px)': {
      gridTemplateColumns: '1fr',
      justifyItems: 'center',
    },
  },
  gauge: {
    position: 'relative',
    width: '160px',
    height: '160px',
    flexShrink: 0,
  },
  gaugeValue: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeNumber: {
    fontSize: '40px',
    lineHeight: '44px',
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  categories: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
    width: '100%',
  },
  categoryHead: {
    display: 'flex',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
    marginBottom: tokens.spacingVerticalXXS,
  },
  issueList: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  issue: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  issueBody: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  recommendation: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  good: { color: tokens.colorPaletteGreenForeground1 },
  fair: { color: tokens.colorPaletteDarkOrangeForeground1 },
  poor: { color: tokens.colorPaletteRedForeground1 },
  gaugeTrack: { stroke: tokens.colorNeutralStroke2 },
  gaugeArcGood: { stroke: tokens.colorPaletteGreenForeground1 },
  gaugeArcFair: { stroke: tokens.colorPaletteDarkOrangeForeground1 },
  gaugeArcPoor: { stroke: tokens.colorPaletteRedForeground1 },
  gaugeArc: {
    transitionProperty: 'stroke-dashoffset',
    transitionDuration: tokens.durationSlower,
    transitionTimingFunction: tokens.curveEasyEase,
  },
})

function QualityGauge({ score }) {
  const styles = useStyles()
  const radius = 68
  const circumference = 2 * Math.PI * radius
  const tone = scoreTone(score)
  const arcTone = {
    good: styles.gaugeArcGood,
    fair: styles.gaugeArcFair,
    poor: styles.gaugeArcPoor,
  }[tone]

  return (
    <div
      className={styles.gauge}
      role="meter"
      aria-valuenow={score}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Overall quality score"
    >
      <svg viewBox="0 0 160 160" width="160" height="160">
        <circle
          className={styles.gaugeTrack}
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
        />
        <circle
          className={mergeClasses(styles.gaugeArc, arcTone)}
          cx="80"
          cy="80"
          r={radius}
          fill="none"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - score / 100)}
          transform="rotate(-90 80 80)"
        />
      </svg>
      <div className={styles.gaugeValue}>
        <span className={mergeClasses(styles.gaugeNumber, styles[tone])}>{score}</span>
        <Caption1 className={styles.muted}>of 100</Caption1>
      </div>
    </div>
  )
}

function QualityAnalyzer({ onNavigate }) {
  const styles = useStyles()
  const { syncedTestCases, form } = useAdoConnection()
  const [query, setQuery] = useState('')
  const [selectedId, setSelectedId] = useState(null)

  const organization = form.organization.trim()
  const project = form.project.trim()
  const workItemUrl = (id) =>
    organization && project
      ? `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_workitems/edit/${id}`
      : null

  const testCases = useMemo(() => {
    if (syncedTestCases.length === 0) return []

    const duplicateIds = new Set(
      findDuplicateClusters(syncedTestCases)
        .flatMap((cluster) => cluster.cases.slice(1))
        .map((item) => item.id),
    )
    const areaCounts = new Map()
    for (const item of syncedTestCases) {
      const key = item.areaPath || 'Unassigned'
      areaCounts.set(key, (areaCounts.get(key) ?? 0) + 1)
    }

    return syncedTestCases
      .map((item) => analyseTestCase(item, duplicateIds, areaCounts))
      .sort((left, right) => overallScore(left.scores) - overallScore(right.scores))
  }, [syncedTestCases])

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return testCases
    return testCases.filter((item) =>
      `${item.id} ${item.title} ${item.module}`.toLowerCase().includes(term),
    )
  }, [testCases, query])

  const selected = testCases.find((item) => item.id === selectedId) ?? filtered[0] ?? null

  if (syncedTestCases.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.intro}>
          <Title3>Test Case Quality Analyzer</Title3>
          <Body1 className={styles.muted}>
            Score test cases on clarity, expected results, coverage, and standardization.
          </Body1>
        </div>
        <Card className={styles.card}>
          <Subtitle2>No test cases loaded</Subtitle2>
          <Body1 className={styles.muted}>
            Import test cases from Azure DevOps before running quality analysis.
          </Body1>
          <div>
            <Button appearance="primary" onClick={() => onNavigate?.('import-test-cases')}>
              Go to Import Test Cases
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Title3>Test Case Quality Analyzer</Title3>
        <Body1 className={styles.muted}>
          Score test cases on clarity, expected results, coverage, and standardization.
        </Body1>
      </div>

      <div className={styles.layout}>
        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Test cases</Subtitle2>}
            description={
              <Caption1 className={styles.muted}>
                {filtered.length} of {testCases.length} shown
              </Caption1>
            }
          />
          <SearchBox
            value={query}
            onChange={(_event, data) => setQuery(data.value)}
            placeholder="Search by ID, title, or module"
            aria-label="Search test cases"
          />
          <div className={styles.list}>
            {filtered.map((item) => {
              const score = overallScore(item.scores)
              return (
                <button
                  key={item.id}
                  type="button"
                  className={mergeClasses(
                    styles.listItem,
                    item.id === selected?.id && styles.listItemSelected,
                  )}
                  aria-pressed={item.id === selected?.id}
                  onClick={() => setSelectedId(item.id)}
                >
                  <span className={styles.listItemText}>
                    <span className={styles.listItemTitle}>{item.title}</span>
                    <Caption1 className={styles.muted}>
                      {item.id} · {item.module}
                    </Caption1>
                  </span>
                  <Badge
                    appearance="tint"
                    title={`Quality score ${score} of 100`}
                    color={
                      scoreTone(score) === 'good'
                        ? 'success'
                        : scoreTone(score) === 'fair'
                          ? 'warning'
                          : 'danger'
                    }
                  >
                    {score}
                  </Badge>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <Body1 className={styles.muted}>No test cases match that search.</Body1>
            )}
          </div>
        </Card>

        {selected ? (
          <div className={styles.page}>
            <Card className={styles.card}>
              <CardHeader
                header={<Subtitle2>{selected.title}</Subtitle2>}
                description={
                  <Caption1 className={styles.muted}>
                    {selected.id} · {selected.module}
                  </Caption1>
                }
              />
              <div className={styles.gaugeRow}>
                <QualityGauge score={overallScore(selected.scores)} />
                <div className={styles.categories}>
                  {scoringCategories.map((category) => {
                    const value = selected.scores[category.key]
                    return (
                      <div key={category.key}>
                        <div className={styles.categoryHead}>
                          <Caption1>{category.label}</Caption1>
                          <Caption1 className={styles[scoreTone(value)]}>{value}</Caption1>
                        </div>
                        <ProgressBar
                          value={value / 100}
                          thickness="large"
                          color={
                            scoreTone(value) === 'good'
                              ? 'success'
                              : scoreTone(value) === 'fair'
                                ? 'warning'
                                : 'error'
                          }
                        />
                      </div>
                    )
                  })}
                </div>
              </div>

              <Divider />

              {workItemUrl(selected.id) && (
                <div>
                  <Link
                    href={workItemUrl(selected.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Open {selected.id} in Azure DevOps <OpenRegular />
                  </Link>
                </div>
              )}
            </Card>

            <Card className={styles.card}>
              <CardHeader
                header={<Subtitle2>Identified issues</Subtitle2>}
                description={
                  <Caption1 className={styles.muted}>
                    {selected.issues.length} finding{selected.issues.length === 1 ? '' : 's'}
                  </Caption1>
                }
              />
              {selected.issues.length === 0 ? (
                <Body1 className={styles.muted}>No issues detected.</Body1>
              ) : (
                <div className={styles.issueList}>
                  {selected.issues.map((issue, index) => {
                    const Icon = severityIcon[issue.severity]
                    return (
                      <div key={`${issue.text}-${index}`} className={styles.issue}>
                        <Icon
                          className={
                            styles[
                              issue.severity === 'High'
                                ? 'poor'
                                : issue.severity === 'Medium'
                                  ? 'fair'
                                  : 'good'
                            ]
                          }
                          fontSize={20}
                        />
                        <div className={styles.issueBody}>
                          <Body1>{issue.text}</Body1>
                          <span>
                            <Badge appearance="tint" color={severityColor[issue.severity]} size="small">
                              {issue.severity}
                            </Badge>{' '}
                            <Caption1 className={styles.muted}>{issue.category}</Caption1>
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </Card>

            <Card className={styles.card}>
              <CardHeader
                header={<Subtitle2>Recommendations</Subtitle2>}
                description={
                  <Caption1 className={styles.muted}>
                    Derived from the findings above.
                  </Caption1>
                }
              />
              {selected.recommendations.length === 0 ? (
                <Body1 className={styles.muted}>Nothing to recommend right now.</Body1>
              ) : (
                <div className={styles.issueList}>
                  {selected.recommendations.map((text) => (
                    <div key={text} className={styles.recommendation}>
                      <LightbulbFilamentRegular fontSize={20} />
                      <Body1>{text}</Body1>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        ) : (
          <Card className={styles.card}>
            <Body1 className={styles.muted}>Select a test case to see its quality report.</Body1>
          </Card>
        )}
      </div>
    </div>
  )
}

export default QualityAnalyzer
