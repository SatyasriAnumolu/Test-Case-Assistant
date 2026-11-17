import { useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  BotRegular,
  ClipboardTaskListLtrRegular,
  DocumentBulletListRegular,
  LightbulbFilamentRegular,
  ShieldTaskRegular,
  TargetRegular,
} from '@fluentui/react-icons'
import PageHeader from '../components/common/PageHeader'
import FilterBar from '../components/common/FilterBar'
import KpiCard, { KpiGrid } from '../components/common/KpiCard'
import { DonutChart, LineChart, StackedBarChart } from '../components/common/Charts'
import { chartPalette } from '../theme/palette'

const filters = [
  { key: 'module', placeholder: 'Module', options: ['Payments', 'Identity', 'Billing', 'Reporting'] },
  { key: 'risk', placeholder: 'Risk', options: ['High', 'Medium', 'Low'] },
  { key: 'release', placeholder: 'Release', options: ['25.1', '25.2', '25.3'] },
]

const requirements = [
  { id: 'REQ-PAY-118', title: 'Partial capture refund', module: 'Payments', release: '25.3', cases: 0, coverage: 0, risk: 'High' },
  { id: 'REQ-PAY-121', title: 'Refund reversal window', module: 'Payments', release: '25.3', cases: 2, coverage: 40, risk: 'High' },
  { id: 'REQ-IDN-044', title: 'OTP expiry handling', module: 'Identity', release: '25.2', cases: 5, coverage: 78, risk: 'Medium' },
  { id: 'REQ-IDN-051', title: 'Account lockout policy', module: 'Identity', release: '25.2', cases: 9, coverage: 96, risk: 'Low' },
  { id: 'REQ-BIL-207', title: 'Invoice export formats', module: 'Billing', release: '25.1', cases: 1, coverage: 22, risk: 'High' },
  { id: 'REQ-BIL-212', title: 'Retention policy', module: 'Billing', release: '25.3', cases: 0, coverage: 0, risk: 'High' },
  { id: 'REQ-RPT-090', title: 'Scheduled report delivery', module: 'Reporting', release: '25.2', cases: 6, coverage: 84, risk: 'Low' },
  { id: 'REQ-RPT-093', title: 'Report accessibility', module: 'Reporting', release: '25.3', cases: 2, coverage: 46, risk: 'Medium' },
]

const moduleCoverage = [
  { label: 'Payments', covered: 210, partial: 46, gap: 32 },
  { label: 'Identity', covered: 268, partial: 22, gap: 11 },
  { label: 'Billing', covered: 154, partial: 38, gap: 27 },
  { label: 'Reporting', covered: 118, partial: 19, gap: 14 },
]

const coverageSeries = [
  { key: 'covered', label: 'Covered', color: chartPalette[1] },
  { key: 'partial', label: 'Partial', color: chartPalette[2] },
  { key: 'gap', label: 'Gap', color: chartPalette[3] },
]

const coverageTrend = [{ label: 'Coverage %', data: [58, 62, 65, 68, 70, 74, 76] }]

const riskMix = [
  { label: 'High risk gaps', value: 5, color: chartPalette[3] },
  { label: 'Medium risk gaps', value: 8, color: chartPalette[2] },
  { label: 'Low risk gaps', value: 6, color: chartPalette[1] },
]

const recommendations = [
  'Generate 6 cases for REQ-PAY-118; it is the only uncovered high-risk requirement in release 25.3.',
  'REQ-BIL-212 has no verification steps. Draft retention checks from the BRD acceptance criteria.',
  'Reporting accessibility criteria are only 46% covered. Add keyboard and screen-reader paths.',
]

const riskColor = { High: 'danger', Medium: 'warning', Low: 'success' }

function coverageTone(value) {
  if (value >= 80) return 'success'
  if (value >= 40) return 'warning'
  return 'error'
}

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1360px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1.25fr) minmax(280px, 1fr)',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'start',
    '@media (max-width: 1100px)': { gridTemplateColumns: '1fr' },
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  coverageCell: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    minWidth: '120px',
  },
  bar: { flexGrow: 1 },
  recommendation: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  muted: { color: tokens.colorNeutralForeground3 },
})

function CoverageAnalysis({ onNavigate }) {
  const styles = useStyles()
  const [filterValues, setFilterValues] = useState({})
  const [search, setSearch] = useState('')
  const [message, setMessage] = useState(null)

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return requirements.filter((row) => {
      const matchesModule =
        !filterValues.module || filterValues.module === 'All' || row.module === filterValues.module
      const matchesRisk =
        !filterValues.risk || filterValues.risk === 'All' || row.risk === filterValues.risk
      const matchesRelease =
        !filterValues.release || filterValues.release === 'All' || row.release === filterValues.release
      const matchesSearch = !term || `${row.id} ${row.title}`.toLowerCase().includes(term)
      return matchesModule && matchesRisk && matchesRelease && matchesSearch
    })
  }, [filterValues, search])

  const gapCount = visible.filter((row) => row.coverage < 80).length

  return (
    <div className={styles.page}>
      <PageHeader
        title="Coverage Analysis"
        subtitle="Trace requirements to test cases and close the highest-risk gaps first."
        actions={
          <>
            <Button
              appearance="primary"
              icon={<BotRegular />}
              onClick={() => onNavigate?.('ai-generator')}
            >
              Generate for gaps
            </Button>
            <Button
              icon={<TargetRegular />}
              onClick={() =>
                setMessage({
                  intent: 'info',
                  title: 'Traceability export queued',
                  text: 'The requirement-to-test matrix will download once the reporting API is connected.',
                })
              }
            >
              Export matrix
            </Button>
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

      <KpiGrid>
        <KpiCard
          label="Overall coverage"
          value="76%"
          delta="+4 pts this month"
          direction="up"
          icon={ClipboardTaskListLtrRegular}
          trend={[58, 62, 65, 68, 70, 74, 76]}
        />
        <KpiCard
          label="Requirements tracked"
          value="342"
          delta="18 added in 25.3"
          direction="up"
          icon={DocumentBulletListRegular}
        />
        <KpiCard
          label="Uncovered requirements"
          value="19"
          delta="5 high risk"
          direction="down"
          icon={ShieldTaskRegular}
          tone="danger"
          trend={[31, 29, 27, 25, 23, 21, 19]}
        />
        <KpiCard
          label="Risk-weighted coverage"
          value="68%"
          delta="Target 85%"
          icon={TargetRegular}
          tone="danger"
        />
      </KpiGrid>

      <div className={styles.chartRow}>
        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Coverage by module</Subtitle2>}
            description={<Caption1 className={styles.muted}>Covered, partial, and gap cases</Caption1>}
          />
          <StackedBarChart data={moduleCoverage} series={coverageSeries} label="Coverage by module" />
        </Card>

        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Gap risk profile</Subtitle2>}
            description={<Caption1 className={styles.muted}>Open gaps by risk level</Caption1>}
          />
          <DonutChart data={riskMix} centerValue="19" centerLabel="gaps" label="Gap risk profile" />
        </Card>
      </div>

      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Coverage trend</Subtitle2>}
          description={<Caption1 className={styles.muted}>Last 7 cycles</Caption1>}
        />
        <LineChart series={coverageTrend} height={180} label="Coverage trend" />
      </Card>

      <FilterBar
        filters={filters}
        values={filterValues}
        onChange={(key, value) => setFilterValues((current) => ({ ...current, [key]: value }))}
        search={search}
        onSearchChange={setSearch}
        onReset={() => {
          setFilterValues({})
          setSearch('')
        }}
      />

      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Requirement traceability</Subtitle2>}
          description={
            <Caption1 className={styles.muted}>
              {visible.length} requirements · {gapCount} below the 80% threshold
            </Caption1>
          }
        />
        {visible.length === 0 ? (
          <Body1 className={styles.muted}>No requirements match the current filters.</Body1>
        ) : (
          <Table size="small" aria-label="Requirement traceability">
            <TableHeader>
              <TableRow>
                <TableHeaderCell>Requirement</TableHeaderCell>
                <TableHeaderCell>Module</TableHeaderCell>
                <TableHeaderCell>Release</TableHeaderCell>
                <TableHeaderCell>Linked cases</TableHeaderCell>
                <TableHeaderCell>Coverage</TableHeaderCell>
                <TableHeaderCell>Risk</TableHeaderCell>
                <TableHeaderCell>Action</TableHeaderCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>
                    <TableCellLayout truncate={false}>
                      <div>
                        <div>{row.title}</div>
                        <Caption1 className={styles.muted}>{row.id}</Caption1>
                      </div>
                    </TableCellLayout>
                  </TableCell>
                  <TableCell>{row.module}</TableCell>
                  <TableCell>{row.release}</TableCell>
                  <TableCell>{row.cases}</TableCell>
                  <TableCell>
                    <span className={styles.coverageCell}>
                      <ProgressBar
                        className={styles.bar}
                        value={row.coverage / 100}
                        color={coverageTone(row.coverage)}
                      />
                      <Caption1>{row.coverage}%</Caption1>
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge appearance="tint" color={riskColor[row.risk]}>
                      {row.risk}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      appearance="subtle"
                      size="small"
                      icon={<BotRegular />}
                      onClick={() => onNavigate?.('ai-generator')}
                    >
                      Generate
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>AI recommendations</Subtitle2>}
          description={<Caption1 className={styles.muted}>Ranked by risk reduction</Caption1>}
        />
        <div className={styles.list}>
          {recommendations.map((text) => (
            <div key={text} className={styles.recommendation}>
              <LightbulbFilamentRegular fontSize={20} />
              <Body1>{text}</Body1>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

export default CoverageAnalysis
