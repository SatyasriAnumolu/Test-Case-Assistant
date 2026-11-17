import { useMemo, useState } from 'react'
import {
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Subtitle2,
  Tab,
  TabList,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowDownloadRegular,
  BotRegular,
  CalendarClockRegular,
  CheckmarkCircleRegular,
  DataTrendingRegular,
  ShareRegular,
} from '@fluentui/react-icons'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import KpiCard, { KpiGrid } from '../components/common/KpiCard'
import { BarChart, DonutChart, StackedBarChart } from '../components/common/Charts'
import { chartPalette } from '../theme/palette'
import { useAdoConnection } from '../context/AdoConnectionContext'

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1360px',
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  tabBody: {
    paddingTop: tokens.spacingVerticalM,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  insight: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  muted: { color: tokens.colorNeutralForeground3 },
})

function Reports({ initialTab = 'execution' }) {
  const styles = useStyles()
  const { syncedTestCases, form, lastSyncAt } = useAdoConnection()
  const [filterValues, setFilterValues] = useState({})
  const [search, setSearch] = useState('')
  const [tab, setTab] = useState(initialTab)
  const [message, setMessage] = useState(null)

  const reportData = useMemo(() => {
    const source = syncedTestCases.filter((item) => {
      const term = search.trim().toLowerCase()
      const sprint = item.iterationPath?.split('\\').pop() || 'Unassigned'
      const selectedSprint = filterValues.sprint
      const selectedProject = filterValues.project
      const matchesSearch =
        !term || `${item.id} ${item.title} ${item.areaPath} ${item.state} ${sprint}`.toLowerCase().includes(term)
      const matchesSprint = !selectedSprint || selectedSprint === 'All' || sprint === selectedSprint
      const matchesProject =
        !selectedProject ||
        selectedProject === 'All' ||
        (item.project || form.project || '').toLowerCase() === selectedProject.toLowerCase()
      return matchesSearch && matchesSprint && matchesProject
    })
    const total = source.length
    const ready = source.filter((item) => item.state === 'Ready').length
    const missingSteps = source.filter((item) => item.stepCount === 0).length
    const thinSteps = source.filter((item) => item.stepCount <= 2).length
    const byArea = new Map()
    const bySprint = new Map()
    source.forEach((item) => {
      const area = item.areaPath?.split('\\').pop() || 'Unassigned'
      byArea.set(area, (byArea.get(area) ?? 0) + 1)
      const sprint = item.iterationPath?.split('\\').pop() || 'Unassigned'
      bySprint.set(sprint, (bySprint.get(sprint) ?? 0) + 1)
    })
    const byState = ['Ready', 'Design', 'New'].map((state) => ({
      label: state,
      value: source.filter((item) => item.state === state).length,
      color: state === 'Ready' ? chartPalette[1] : state === 'Design' ? chartPalette[2] : chartPalette[3],
    }))
    return {
      source,
      total,
      ready,
      missingSteps,
      thinSteps,
      byArea: [...byArea.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value)
        .slice(0, 8),
      bySprint: [...bySprint.entries()]
        .map(([label, value]) => ({ label, value }))
        .sort((left, right) => right.value - left.value),
      byState,
    }
  }, [syncedTestCases, search, filterValues, form.project])

  const scope = useMemo(
    () =>
      [filterValues.project, filterValues.sprint]
        .filter((value) => value && value !== 'All')
        .join(' · ') || 'all projects, last 30 days',
    [filterValues],
  )

  return (
    <div className={styles.page}>
      <PageHeader
        title="Reports"
        subtitle={`Quality, execution, and adoption analytics for ${scope}.`}
        actions={
          <>
            <Button
              appearance="primary"
              icon={<ArrowDownloadRegular />}
              onClick={() =>
                setMessage({
                  intent: 'info',
                  title: 'Export queued',
                  text: 'Report export becomes available once the reporting API is connected.',
                })
              }
            >
              Export
            </Button>
            <Button icon={<CalendarClockRegular />}>Schedule</Button>
            <Button icon={<ShareRegular />}>Share</Button>
          </>
        }
      />

      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <FilterBar
        filters={[
          {
            key: 'project',
            placeholder: 'Project',
            options: form.project ? [form.project] : [],
          },
          {
            key: 'sprint',
            placeholder: 'Sprint',
            options: [
              ...new Set(
                syncedTestCases.map((item) => item.iterationPath?.split('\\').pop() || 'Unassigned'),
              ),
            ].sort(),
          },
        ]}
        values={filterValues}
        onChange={(key, value) => setFilterValues((current) => ({ ...current, [key]: value }))}
        search={search}
        onSearchChange={setSearch}
        onReset={() => {
          setFilterValues({})
          setSearch('')
        }}
      />

      <KpiGrid>
        <KpiCard
          label="Execution pass rate"
          value={reportData.total ? `${Math.round((reportData.ready / reportData.total) * 100)}%` : '—'}
          delta="Imported cases marked Ready"
          icon={CheckmarkCircleRegular}
          tone="success"
          trend={reportData.byState.map((item) => item.value)}
        />
        <KpiCard
          label="Defect escape rate"
          value={reportData.total ? `${Math.round((reportData.missingSteps / reportData.total) * 100)}%` : '—'}
          delta="Cases with no recorded steps"
          icon={DataTrendingRegular}
          tone="success"
          trend={[reportData.missingSteps, reportData.thinSteps, reportData.total]}
        />
        <KpiCard
          label="AI-assisted cases"
          value={reportData.total ? reportData.thinSteps : '—'}
          delta="Cases with 2 steps or fewer"
          icon={BotRegular}
          trend={[reportData.missingSteps, reportData.thinSteps]}
        />
        <KpiCard
          label="Cases authored"
          value={reportData.total.toLocaleString()}
          delta={lastSyncAt ? `Last sync ${new Date(lastSyncAt).toLocaleDateString()}` : 'No sync yet'}
          icon={DataTrendingRegular}
          trend={reportData.byArea.slice(0, 4).map((item) => item.value)}
        />
      </KpiGrid>

      <Card className={styles.card}>
        <TabList selectedValue={tab} onTabSelect={(_event, data) => setTab(data.value)}>
          <Tab value="execution">Execution</Tab>
          <Tab value="quality">Quality</Tab>
          <Tab value="throughput">Throughput</Tab>
        </TabList>

        <div className={styles.tabBody}>
          {tab === 'execution' && (
            <DonutChart data={reportData.byState} centerValue={String(reportData.total)} centerLabel="cases" label="Cases by state" />
          )}
          {tab === 'quality' && (
            <StackedBarChart
              data={reportData.byArea.map((item) => ({ label: item.label, high: item.value, medium: 0, low: 0 }))}
              series={[{ key: 'high', label: 'Imported cases', color: chartPalette[0] }]}
              label="Imported cases by area"
            />
          )}
          {tab === 'throughput' && (
            <BarChart data={reportData.bySprint} label="Imported cases by sprint" />
          )}
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Imported data details</Subtitle2>}
          description={
            <Caption1 className={styles.muted}>
                Report values are calculated from the current Azure DevOps import. Sprint grouping
                uses each work item's Iteration Path.
            </Caption1>
          }
        />
        <div className={styles.list}>
          <div className={styles.insight}>
            <Body1>
              {reportData.bySprint.length === 1 && reportData.bySprint[0]?.label === 'Unassigned'
                ? 'No sprint data is available. Re-import test cases to populate Iteration Path.'
                : `${reportData.bySprint.length} sprints represented, with ${
                    reportData.bySprint[0]?.label || 'no sprint data'
                  } containing ${reportData.bySprint[0]?.value || 0} imported cases.`}
            </Body1>
          </div>
          <div className={styles.insight}>
            <Body1>{reportData.missingSteps.toLocaleString()} cases have no recorded steps.</Body1>
          </div>
          <div className={styles.insight}>
            <Body1>{reportData.thinSteps.toLocaleString()} cases have two steps or fewer.</Body1>
          </div>
          <div className={styles.insight}>
            <Body1>
              {reportData.byArea.length} area paths are represented in the imported results.
            </Body1>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Reports
