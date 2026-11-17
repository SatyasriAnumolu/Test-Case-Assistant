import { Caption1, Card, makeStyles, mergeClasses, tokens } from '@fluentui/react-components'
import { ArrowTrendingDownRegular, ArrowTrendingRegular } from '@fluentui/react-icons'
import { Sparkline } from './Charts'

const useStyles = makeStyles({
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalL,
    transitionProperty: 'box-shadow, transform',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      transform: 'translateY(-2px)',
      boxShadow: tokens.shadow8,
    },
  },
  head: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
  },
  label: {
    color: tokens.colorNeutralForeground3,
  },
  iconTile: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontSize: '18px',
  },
  value: {
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    columnGap: tokens.spacingHorizontalS,
    minHeight: '28px',
  },
  delta: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXXS,
  },
  up: { color: tokens.colorPaletteGreenForeground1 },
  down: { color: tokens.colorPaletteRedForeground1 },
  flat: { color: tokens.colorNeutralForeground3 },
})

export function KpiGrid({ children }) {
  const styles = useStyles()
  return <div className={styles.grid}>{children}</div>
}

function KpiCard({ label, value, delta, direction = 'flat', icon: Icon, trend, tone = 'brand' }) {
  const styles = useStyles()
  const DirectionIcon = direction === 'down' ? ArrowTrendingDownRegular : ArrowTrendingRegular

  return (
    <Card className={styles.card}>
      <div className={styles.head}>
        <Caption1 className={styles.label}>{label}</Caption1>
        {Icon && (
          <span className={styles.iconTile} aria-hidden="true">
            <Icon />
          </span>
        )}
      </div>

      <span className={styles.value}>{value}</span>

      <div className={styles.footer}>
        {delta && (
          <Caption1 className={mergeClasses(styles.delta, styles[direction])}>
            {direction !== 'flat' && <DirectionIcon />}
            {delta}
          </Caption1>
        )}
        {trend?.length > 1 && <Sparkline data={trend} tone={tone} />}
      </div>
    </Card>
  )
}

export default KpiCard
