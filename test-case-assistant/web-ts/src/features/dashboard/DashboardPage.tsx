import {
  Badge,
  Body1,
  Body1Strong,
  Button,
  Card,
  CardHeader,
  Divider,
  Subtitle2,
  Title2,
  makeStyles,
  shorthands,
  tokens,
} from '@fluentui/react-components'
import {
  activities,
  coverageStatus,
  kpis,
  moduleHealth,
  qualityTrend,
  quickActions,
  recommendations,
} from './dashboardData'
import type { TrendPoint } from './types'

const useStyles = makeStyles({
  page: {
    display: 'grid',
    gap: '16px',
    backgroundColor: '#f5f7fb',
    minHeight: '100vh',
    padding: '20px',
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    rowGap: '8px',
  },
  subtitle: {
    color: tokens.colorNeutralForeground3,
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '12px',
    '@media (max-width: 1080px)': {
      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    },
    '@media (max-width: 640px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    ...shorthands.border('1px', 'solid', '#dde3f1'),
    backgroundColor: '#ffffff',
    boxShadow: '0 4px 16px rgba(15, 23, 42, 0.06)',
  },
  kpiValue: {
    fontSize: '28px',
    fontWeight: 700,
    lineHeight: '32px',
  },
  trendUp: {
    color: '#0f9d58',
  },
  trendDown: {
    color: '#0f9d58',
  },
  trendNeutral: {
    color: '#6b7280',
  },
  chartGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '12px',
    '@media (max-width: 1080px)': {
      gridTemplateColumns: '1fr',
    },
  },
  chartBody: {
    display: 'grid',
    gap: '8px',
    marginTop: '8px',
  },
  chartRow: {
    display: 'grid',
    gridTemplateColumns: '56px 1fr 42px',
    alignItems: 'center',
    gap: '8px',
  },
  chartTrack: {
    position: 'relative',
    height: '8px',
    borderRadius: '999px',
    backgroundColor: '#e5eaf5',
    overflow: 'hidden',
  },
  chartFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: '999px',
    background: 'linear-gradient(90deg, #2563eb, #5b8cff)',
  },
  lowerGrid: {
    display: 'grid',
    gridTemplateColumns: '1.4fr 1fr 1fr',
    gap: '12px',
    '@media (max-width: 1200px)': {
      gridTemplateColumns: '1fr',
    },
  },
  sectionList: {
    margin: 0,
    padding: 0,
    listStyle: 'none',
    display: 'grid',
    gap: '10px',
  },
  listItem: {
    ...shorthands.border('1px', 'solid', '#dde3f1'),
    ...shorthands.padding('10px', '12px'),
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: '#f8faff',
  },
  itemMeta: {
    color: tokens.colorNeutralForeground3,
    fontSize: tokens.fontSizeBase200,
  },
  actions: {
    display: 'grid',
    gap: '10px',
  },
  actionButton: {
    justifyContent: 'flex-start',
  },
})

function ChartCard({ title, data }: { title: string; data: TrendPoint[] }) {
  const styles = useStyles()

  return (
    <Card className={styles.card}>
      <CardHeader header={<Body1Strong>{title}</Body1Strong>} />
      <div className={styles.chartBody}>
        {data.map((point) => (
          <div className={styles.chartRow} key={`${title}-${point.label}`}>
            <Body1>{point.label}</Body1>
            <div className={styles.chartTrack}>
              <span className={styles.chartFill} style={{ width: `${point.value}%` }} />
            </div>
            <Body1>{point.value}%</Body1>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function DashboardPage() {
  const styles = useStyles()

  return (
    <div className={styles.page}>
      <div className={styles.titleRow}>
        <div>
          <Title2>Dashboard</Title2>
          <Body1 className={styles.subtitle}>
            Azure DevOps-style command center for quality, risk, and coverage insights.
          </Body1>
        </div>
        <Badge appearance="filled" color="brand">
          Live Workspace
        </Badge>
      </div>

      <div className={styles.kpiGrid}>
        {kpis.map((kpi) => (
          <Card className={styles.card} key={kpi.id}>
            <CardHeader header={<Subtitle2>{kpi.title}</Subtitle2>} />
            <Body1Strong className={styles.kpiValue}>{kpi.value}</Body1Strong>
            <Body1
              className={
                kpi.trend === 'up'
                  ? styles.trendUp
                  : kpi.trend === 'down'
                    ? styles.trendDown
                    : styles.trendNeutral
              }
            >
              {kpi.delta}
            </Body1>
          </Card>
        ))}
      </div>

      <div className={styles.chartGrid}>
        <ChartCard title="Test Case Quality Trend" data={qualityTrend} />
        <ChartCard title="Module Health Score" data={moduleHealth} />
        <ChartCard title="Coverage Status" data={coverageStatus} />
      </div>

      <div className={styles.lowerGrid}>
        <Card className={styles.card}>
          <CardHeader header={<Body1Strong>Recent Activity</Body1Strong>} />
          <ul className={styles.sectionList}>
            {activities.map((item) => (
              <li className={styles.listItem} key={item.id}>
                <Body1Strong>{item.title}</Body1Strong>
                <Body1 className={styles.itemMeta}>{item.detail}</Body1>
                <Body1 className={styles.itemMeta}>{item.time}</Body1>
              </li>
            ))}
          </ul>
        </Card>

        <Card className={styles.card}>
          <CardHeader header={<Body1Strong>AI Recommendations</Body1Strong>} />
          <ul className={styles.sectionList}>
            {recommendations.map((item) => (
              <li className={styles.listItem} key={item.id}>
                <Body1Strong>{item.title}</Body1Strong>
                <Divider />
                <Body1 className={styles.itemMeta}>Impact: {item.impact}</Body1>
              </li>
            ))}
          </ul>
        </Card>

        <Card className={styles.card}>
          <CardHeader header={<Body1Strong>Quick Actions</Body1Strong>} />
          <div className={styles.actions}>
            {quickActions.map((item) => (
              <Button key={item.id} appearance="secondary" className={styles.actionButton}>
                <div>
                  <Body1Strong>{item.label}</Body1Strong>
                  <Body1 className={styles.itemMeta}>{item.description}</Body1>
                </div>
              </Button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
