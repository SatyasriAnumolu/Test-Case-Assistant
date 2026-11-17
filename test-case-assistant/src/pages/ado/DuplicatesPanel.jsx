import { useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Field,
  Link,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Slider,
  Spinner,
  Subtitle1,
  Subtitle2,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowDownloadRegular,
  CheckmarkCircleRegular,
  CopyRegular,
  DismissCircleRegular,
  FolderRegular,
  MergeRegular,
  OpenRegular,
  PlayRegular,
  WarningRegular,
} from '@fluentui/react-icons'
import { useAdoConnection } from '../../context/AdoConnectionContext'
import {
  DUPLICATE_CATEGORY,
  classifyDuplicateClusters,
  filterToImportScope,
  summarizeDuplicateClusters,
} from '../../utils/duplicates'
import { useAdoStyles } from './adoStyles'

const useDuplicateStyles = makeStyles({
  panel: {
    rowGap: tokens.spacingVerticalXL,
  },
  card: {
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  clusterCard: {
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow2,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    transitionDuration: tokens.durationNormal,
    transitionProperty: 'box-shadow, transform',
    ':hover': {
      boxShadow: tokens.shadow8,
      transform: 'translateY(-2px)',
    },
  },
  clusterResolved: {
    opacity: 0.72,
  },
  clusterId: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  badgeRow: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  settingsBody: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 420px) 1fr',
    columnGap: tokens.spacingHorizontalXXL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'end',
    '@media (max-width: 860px)': { gridTemplateColumns: '1fr' },
  },
  sliderValue: {
    minWidth: '48px',
    textAlign: 'right',
    fontFamily: tokens.fontFamilyMonospace,
    fontWeight: tokens.fontWeightSemibold,
    color: tokens.colorNeutralForeground1,
  },
  settingsActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
    '@media (max-width: 860px)': { justifyContent: 'flex-start' },
  },
  thresholdGuide: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
    fontSize: tokens.fontSizeBase200,
    color: tokens.colorNeutralForeground3,
    fontFamily: tokens.fontFamilyMonospace,
    lineHeight: tokens.lineHeightBase200,
  },
  thresholdGuideItem: {
    display: 'flex',
    columnGap: tokens.spacingHorizontalM,
    alignItems: 'flex-start',
  },
  thresholdGuideBadge: {
    flexShrink: 0,
    fontWeight: tokens.fontWeightSemibold,
    minWidth: '80px',
  },
  caseRow: {
    columnGap: tokens.spacingHorizontalL,
    padding: tokens.spacingVerticalM,
    borderLeft: `${tokens.strokeWidthThick} solid transparent`,
  },
  caseRowPrimary: {
    borderLeftColor: tokens.colorBrandStroke1,
  },
  caseMeta: {
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground3,
  },
  caseMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  areaPath: {
    display: 'inline-flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalXS,
    minWidth: 0,
    maxWidth: '100%',
    paddingBlock: '1px',
    paddingInline: tokens.spacingHorizontalS,
    borderRadius: tokens.borderRadiusMedium,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    backgroundColor: tokens.colorNeutralBackground1,
    color: tokens.colorNeutralForeground2,
    fontFamily: tokens.fontFamilyMonospace,
    fontSize: tokens.fontSizeBase200,
    lineHeight: tokens.lineHeightBase200,
    overflowWrap: 'break-word',
    wordBreak: 'break-word',
  },
  areaPathDiffers: {
    border: `${tokens.strokeWidthThin} solid ${tokens.colorPaletteMarigoldBorder2}`,
    backgroundColor: tokens.colorPaletteMarigoldBackground1,
    color: tokens.colorNeutralForeground1,
  },
  areaPathIcon: {
    flexShrink: 0,
    fontSize: '14px',
    color: tokens.colorNeutralForeground3,
  },
  areaPathWarnIcon: {
    flexShrink: 0,
    fontSize: '14px',
    color: tokens.colorPaletteMarigoldForeground2,
  },
  visuallyHidden: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    margin: '-1px',
    padding: 0,
    overflow: 'hidden',
    clip: 'rect(0 0 0 0)',
    whiteSpace: 'nowrap',
    border: 0,
  },
  caseLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    minWidth: 0,
    maxWidth: '100%',
    color: tokens.colorBrandForegroundLink,
    textDecorationLine: 'none',
    ':hover': {
      textDecorationLine: 'underline',
      color: tokens.colorBrandForegroundLinkHover,
    },
  },
  linkIcon: {
    flexShrink: 0,
    fontSize: '14px',
    opacity: 0.7,
  },
  clusterActions: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: tokens.spacingHorizontalM,
    justifyContent: 'flex-end',
    '@media (max-width: 720px)': { justifyContent: 'stretch' },
  },
  emptyCard: {
    padding: tokens.spacingVerticalXXL,
    textAlign: 'center',
  },
})

const CATEGORY_META = {
  [DUPLICATE_CATEGORY.exact]: {
    label: 'Exact Duplicate',
    color: 'success',
    icon: <CheckmarkCircleRegular />,
    description: 'Same Area Path with matching test step content',
  },
  [DUPLICATE_CATEGORY.review]: {
    label: 'Review Required',
    color: 'severe',
    icon: <WarningRegular />,
    description: 'Same Area Path, but the test steps differ or could not be compared',
  },
  [DUPLICATE_CATEGORY.crossArea]: {
    label: 'Cross-Area Match',
    color: 'warning',
    icon: <WarningRegular />,
    description: 'Similar titles in different Area Paths — review required',
  },
  [DUPLICATE_CATEGORY.notDuplicate]: {
    label: 'Not Duplicate',
    color: 'danger',
    icon: <DismissCircleRegular />,
    description: 'Similar titles, but different Area Paths and different test step content',
  },
}

const ROLE_LABELS = {
  primary: 'Primary',
  duplicate: 'Duplicate',
  review: 'Review',
  'cross-area': 'Cross-Area Match',
  'not-duplicate': 'Not Duplicate',
}

function distinctAreaPaths(cases) {
  return [...new Set(cases.map((item) => item.areaPath ?? ''))]
}

function DuplicatesPanel({ onOpenSync }) {
  const styles = useAdoStyles()
  const dup = useDuplicateStyles()
  const { syncedTestCases, selectedAreaPaths, importConfig, form } = useAdoConnection()
  const [threshold, setThreshold] = useState(90)
  const [clusters, setClusters] = useState(null)
  const [resolved, setResolved] = useState({})
  const [running, setRunning] = useState(false)
  const [message, setMessage] = useState(null)

  const organization = form.organization.trim()
  const project = form.project.trim()
  const workItemUrl = (id) =>
    organization && project
      ? `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_workitems/edit/${id}`
      : null

  // Scope comes from the configuration used for the import, not the current selection.
  const scope = useMemo(
    () => importConfig ?? { project, areaPaths: selectedAreaPaths, scope: 'all' },
    [importConfig, project, selectedAreaPaths],
  )
  const scopeAreaPaths = scope.areaPaths ?? []

  const eligibleTestCases = useMemo(() => {
    const filtered = filterToImportScope(syncedTestCases, scope)
    console.debug('Duplicates :: Import scope filtering', {
      scope,
      filteredCount: filtered.length,
      totalCount: syncedTestCases.length,
    })
    return filtered
  }, [syncedTestCases, scope])

  // Only same-Area-Path matches count as redundant; cross-area matches are excluded.
  const duplicateCount = useMemo(
    () =>
      (clusters ?? []).reduce(
        (total, cluster) =>
          cluster.category === DUPLICATE_CATEGORY.exact || cluster.category === DUPLICATE_CATEGORY.review
            ? total + cluster.cases.length - 1
            : total,
        0,
      ),
    [clusters],
  )

  const summary = useMemo(() => summarizeDuplicateClusters(clusters), [clusters])

  const runDetection = () => {
    setRunning(true)
    setMessage(null)

    console.debug('Duplicates :: Running detection', {
      eligibleCasesCount: eligibleTestCases.length,
      threshold,
      scope,
    })

    // Runs in the browser over the synced set; no server round trip is needed.
    const found = classifyDuplicateClusters(eligibleTestCases, threshold / 100)
    const counts = summarizeDuplicateClusters(found)
    setClusters(found)
    setResolved({})
    setRunning(false)
    const getThresholdDescription = (value) => {
      if (value >= 90) return 'strict matching'
      if (value >= 70) return 'balanced matching'
      return 'broader matching'
    }
    setMessage({
      intent: found.length ? 'success' : 'info',
      title: found.length ? 'Detection complete' : 'No duplicates found',
      text: found.length
        ? `${found.length} clusters found across ${eligibleTestCases.length} test cases with ${getThresholdDescription(threshold)}: ${counts.exact} exact duplicates, ${counts.crossArea} cross-area matches, ${counts.review} review required, ${counts.notDuplicate} not duplicates.`
        : `No titles exceeded ${threshold}% similarity (${getThresholdDescription(threshold)}). Try lowering the threshold to find more potential duplicates.`,
    })
  }

  const exportClusters = () => {
    const header = 'ClusterId,Similarity,TestCaseId,Title,AreaPath,Role,Classification'
    const rows = (clusters ?? []).flatMap((cluster) =>
      cluster.cases.map((item) =>
        [
          cluster.id,
          `${Math.round(cluster.similarity * 100)}%`,
          item.id,
          item.title,
          item.areaPath,
          ROLE_LABELS[cluster.roles[item.id]],
          CATEGORY_META[cluster.category].label,
        ]
          .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(','),
      ),
    )
    const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'duplicate-test-cases.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  if (eligibleTestCases.length === 0) {
    return (
      <Card className={mergeClasses(styles.card, dup.card, dup.emptyCard)}>
        <Subtitle1>No test cases loaded</Subtitle1>
        <Body1 className={styles.hint}>
          Sync test cases from Azure DevOps before running duplicate detection.
        </Body1>
        <div className={styles.actions}>
          <Button appearance="primary" size="large" onClick={onOpenSync}>
            Go to Sync Test Cases
          </Button>
        </div>
      </Card>
    )
  }

  return (
    <div className={mergeClasses(styles.panel, dup.panel)}>
      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <Card className={mergeClasses(styles.card, dup.card)}>
        <CardHeader
          header={<Subtitle1>Detection settings</Subtitle1>}
          description={
            <Caption1 className={styles.hint}>
              Comparing {eligibleTestCases.length} of {syncedTestCases.length} synced test cases by title similarity. RecycleBin cases are excluded.
              {scope.scope === 'suite'
                ? ` Import scope: ${scope.planName || 'selected plan'} / ${scope.suiteName || 'selected suite'}.`
                : scope.scope === 'plan'
                  ? ` Import scope: ${scope.planName || 'selected plan'}.`
                  : ''}
              {scopeAreaPaths.length > 0
                ? ` Using area path filter: ${scopeAreaPaths.join(', ')}`
                : ' (All test cases - no area path filter applied)'}
            </Caption1>
          }
        />

        <div className={dup.settingsBody}>
          <Field
            label="Similarity threshold"
            hint="Higher thresholds perform stricter matching (requires near-identical titles). Lower thresholds perform broader matching (catches more variations)."
          >
            <div className={styles.sliderRow}>
              <Slider
                min={40}
                max={100}
                step={5}
                value={threshold}
                onChange={(_event, data) => setThreshold(data.value)}
              />
              <span className={dup.sliderValue}>{threshold}%</span>
            </div>
            <div className={dup.thresholdGuide}>
              <div className={dup.thresholdGuideItem}>
                <span className={dup.thresholdGuideBadge}>90–100%:</span>
                <span>Strict matching (near-identical titles)</span>
              </div>
              <div className={dup.thresholdGuideItem}>
                <span className={dup.thresholdGuideBadge}>70–89%:</span>
                <span>Balanced matching</span>
              </div>
              <div className={dup.thresholdGuideItem}>
                <span className={dup.thresholdGuideBadge}>Below 70%:</span>
                <span>Broader matching (more false positives)</span>
              </div>
            </div>
          </Field>

          <div className={dup.settingsActions}>
            <Button
              appearance="primary"
              size="large"
              icon={running ? <Spinner size="tiny" /> : <PlayRegular />}
              disabled={running}
              onClick={runDetection}
            >
              {running ? 'Analysing…' : 'Run detection'}
            </Button>
            <Button
              size="large"
              icon={<ArrowDownloadRegular />}
              disabled={!clusters?.length}
              onClick={exportClusters}
            >
              Export CSV
            </Button>
          </div>
        </div>
      </Card>

      {clusters !== null && (
        <Card className={mergeClasses(styles.card, dup.card)}>
          <CardHeader
            header={<Subtitle1>Duplicate clusters</Subtitle1>}
            description={
              <Caption1 className={styles.hint}>
                {clusters.length} clusters · {duplicateCount} redundant test cases
              </Caption1>
            }
          />
          {clusters.length > 0 && (
            <div className={dup.badgeRow} role="list" aria-label="Detection summary">
              {[
                [DUPLICATE_CATEGORY.exact, 'Exact Duplicates', summary.exact],
                [DUPLICATE_CATEGORY.crossArea, 'Cross-Area Matches', summary.crossArea],
                [DUPLICATE_CATEGORY.review, 'Review Required', summary.review],
                [DUPLICATE_CATEGORY.notDuplicate, 'Not Duplicates', summary.notDuplicate],
              ].map(([category, label, count]) => (
                <Badge
                  key={category}
                  role="listitem"
                  appearance="tint"
                  color={CATEGORY_META[category].color}
                  icon={CATEGORY_META[category].icon}
                  title={CATEGORY_META[category].description}
                >
                  {label}: {count}
                </Badge>
              ))}
            </div>
          )}
          {clusters.length === 0 && (
            <Body1 className={styles.hint}>
              Nothing exceeded the current {threshold}% threshold (strict matching). Try lowering the threshold value to find more potential duplicates.
            </Body1>
          )}
        </Card>
      )}

      {(clusters ?? []).map((cluster) => (
        <Card
          key={cluster.id}
          className={mergeClasses(
            styles.card,
            dup.clusterCard,
            resolved[cluster.id] ? dup.clusterResolved : undefined,
          )}
        >
          <div className={styles.clusterHead}>
            <Subtitle2 className={dup.clusterId}>
              <CopyRegular /> {cluster.id}
            </Subtitle2>
            <div className={dup.badgeRow}>
              <Badge
                appearance="filled"
                color={CATEGORY_META[cluster.category].color}
                icon={CATEGORY_META[cluster.category].icon}
                title={CATEGORY_META[cluster.category].description}
              >
                {CATEGORY_META[cluster.category].label}
              </Badge>
              <Badge appearance="tint" color="brand">
                {Math.round(cluster.similarity * 100)}% similar
              </Badge>
              <Badge appearance="tint" color="informative">
                {cluster.cases.length} cases
              </Badge>
              {distinctAreaPaths(cluster.cases).length === 1 ? (
                <Badge
                  appearance="tint"
                  color="success"
                  icon={<FolderRegular />}
                  title={`All cases are in ${cluster.cases[0]?.areaPath || 'no Area Path'}`}
                >
                  Same Area Path
                </Badge>
              ) : (
                <Badge
                  appearance="tint"
                  color="warning"
                  icon={<FolderRegular />}
                  title={distinctAreaPaths(cluster.cases).map((path) => path || 'No Area Path').join('\n')}
                >
                  {distinctAreaPaths(cluster.cases).length} Area Paths
                </Badge>
              )}
              <Badge
                appearance={resolved[cluster.id] ? 'filled' : 'outline'}
                color={resolved[cluster.id] === 'Merged' ? 'success' : resolved[cluster.id] ? 'warning' : 'informative'}
              >
                {resolved[cluster.id] ?? 'Unresolved'}
              </Badge>
            </div>
          </div>

          <div className={styles.caseList}>
            {cluster.cases.map((item, index) => (
              <div
                key={item.id}
                className={mergeClasses(
                  styles.caseRow,
                  dup.caseRow,
                  index === 0 ? styles.caseRowPrimary : undefined,
                  index === 0 ? dup.caseRowPrimary : undefined,
                )}
              >
                <Badge appearance={index === 0 ? 'filled' : 'outline'} color="brand">
                  {ROLE_LABELS[cluster.roles[item.id]]}
                </Badge>
                <span className={styles.caseText}>
                  {workItemUrl(item.id) ? (
                    <Link
                      className={dup.caseLink}
                      href={workItemUrl(item.id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      title={`${item.title} — open ${item.id} in Azure DevOps`}
                    >
                      <span className={styles.caseTitle}>{item.title}</span>
                      <OpenRegular className={dup.linkIcon} />
                    </Link>
                  ) : (
                    <span className={styles.caseTitle}>{item.title}</span>
                  )}
                  <span className={dup.caseMetaRow}>
                    <Caption1 className={dup.caseMeta}>{item.id}</Caption1>
                    {index > 0 && (item.areaPath ?? '') !== (cluster.cases[0]?.areaPath ?? '') ? (
                      <span
                        className={mergeClasses(dup.areaPath, dup.areaPathDiffers)}
                        title={`Area Path: ${item.areaPath || 'No Area Path'} (differs from primary: ${cluster.cases[0]?.areaPath || 'No Area Path'})`}
                      >
                        <WarningRegular className={dup.areaPathWarnIcon} aria-hidden="true" />
                        <span className={dup.visuallyHidden}>Area Path, differs from primary: </span>
                        {item.areaPath || 'No Area Path'}
                      </span>
                    ) : (
                      <span className={dup.areaPath} title={`Area Path: ${item.areaPath || 'No Area Path'}`}>
                        <FolderRegular className={dup.areaPathIcon} aria-hidden="true" />
                        <span className={dup.visuallyHidden}>Area Path: </span>
                        {item.areaPath || 'No Area Path'}
                      </span>
                    )}
                    <Caption1 className={dup.caseMeta}>{item.stepCount} steps</Caption1>
                  </span>
                </span>
                <Badge appearance="outline" color="subtle">
                  {item.state}
                </Badge>
              </div>
            ))}
          </div>

          <Divider />

          <div className={dup.clusterActions}>
            {workItemUrl(cluster.cases[0]?.id) && (
              <Button
                as="a"
                href={workItemUrl(cluster.cases[0].id)}
                target="_blank"
                rel="noopener noreferrer"
                icon={<OpenRegular />}
              >
                Open in ADO
              </Button>
            )}
            <Button
              icon={<DismissCircleRegular />}
              disabled={Boolean(resolved[cluster.id])}
              onClick={() => setResolved((current) => ({ ...current, [cluster.id]: 'Dismissed' }))}
            >
              Not a duplicate
            </Button>
            <Button
              appearance="primary"
              icon={<MergeRegular />}
              disabled={Boolean(resolved[cluster.id])}
              onClick={() => setResolved((current) => ({ ...current, [cluster.id]: 'Merged' }))}
            >
              Mark as merged
            </Button>
          </div>
        </Card>
      ))}
    </div>
  )
}

export default DuplicatesPanel
