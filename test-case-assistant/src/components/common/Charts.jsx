import { useId } from 'react'
import { Caption1, makeStyles, tokens } from '@fluentui/react-components'
import { chartPalette } from '../../theme/palette'

const useStyles = makeStyles({
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    width: '100%',
  },
  svg: {
    width: '100%',
    overflow: 'visible',
  },
  axisText: {
    fill: tokens.colorNeutralForeground3,
    fontSize: '11px',
  },
  gridLine: {
    stroke: tokens.colorNeutralStroke2,
  },
  legend: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalXS,
  },
  legendItem: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
    color: tokens.colorNeutralForeground3,
  },
  swatch: {
    width: '10px',
    height: '10px',
    borderRadius: tokens.borderRadiusSmall,
  },
  donutWrap: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXL,
    flexWrap: 'wrap',
    rowGap: tokens.spacingVerticalM,
  },
  donutCenter: {
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  donutHost: {
    position: 'relative',
    flexShrink: 0,
  },
  donutValue: {
    fontSize: tokens.fontSizeHero700,
    lineHeight: tokens.lineHeightHero700,
    fontWeight: tokens.fontWeightBold,
    fontVariantNumeric: 'tabular-nums',
  },
  bar: {
    transitionProperty: 'opacity',
    transitionDuration: tokens.durationNormal,
    ':hover': { opacity: 0.75 },
  },
})

function Legend({ items }) {
  const styles = useStyles()
  return (
    <div className={styles.legend}>
      {items.map((item, index) => (
        <Caption1 key={item.label} className={styles.legendItem}>
          <span
            className={styles.swatch}
            style={{ backgroundColor: item.color ?? chartPalette[index % chartPalette.length] }}
          />
          {item.label}
          {item.value !== undefined && ` · ${item.value}`}
        </Caption1>
      ))}
    </div>
  )
}

export function Sparkline({ data, tone = 'brand', width = 84, height = 28 }) {
  const max = Math.max(...data)
  const min = Math.min(...data)
  const span = max - min || 1
  const step = width / (data.length - 1)
  const points = data
    .map((value, index) => `${index * step},${height - ((value - min) / span) * height}`)
    .join(' ')
  const stroke = tone === 'danger' ? chartPalette[3] : tone === 'success' ? chartPalette[1] : chartPalette[0]

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <polyline points={points} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function BarChart({ data, height = 220, valueSuffix = '', label }) {
  const styles = useStyles()
  const max = Math.max(...data.map((item) => item.value), 1)
  const barWidth = 100 / (data.length * 1.6)
  const gap = barWidth * 0.6

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
          <line
            key={ratio}
            className={styles.gridLine}
            x1="0"
            x2="100"
            y1={height * ratio}
            y2={height * ratio}
            strokeWidth="0.5"
          />
        ))}
        {data.map((item, index) => {
          const barHeight = (item.value / max) * (height - 24)
          return (
            <rect
              key={item.label}
              className={styles.bar}
              x={index * (barWidth + gap) + gap}
              y={height - barHeight}
              width={barWidth}
              height={barHeight}
              rx="1"
              fill={item.color ?? chartPalette[index % chartPalette.length]}
            >
              <title>{`${item.label}: ${item.value}${valueSuffix}`}</title>
            </rect>
          )
        })}
      </svg>
      <Legend items={data.map((item) => ({ label: item.label, value: `${item.value}${valueSuffix}` }))} />
    </div>
  )
}

export function StackedBarChart({ data, series, height = 220, label }) {
  const styles = useStyles()
  const max = Math.max(...data.map((row) => series.reduce((sum, key) => sum + row[key.key], 0)), 1)
  const barWidth = 100 / (data.length * 1.6)
  const gap = barWidth * 0.6

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        {data.map((row, index) => {
          let offset = 0
          return series.map((entry, seriesIndex) => {
            const segmentHeight = (row[entry.key] / max) * (height - 24)
            const y = height - offset - segmentHeight
            offset += segmentHeight
            return (
              <rect
                key={`${row.label}-${entry.key}`}
                className={styles.bar}
                x={index * (barWidth + gap) + gap}
                y={y}
                width={barWidth}
                height={segmentHeight}
                fill={entry.color ?? chartPalette[seriesIndex % chartPalette.length]}
              >
                <title>{`${row.label} · ${entry.label}: ${row[entry.key]}`}</title>
              </rect>
            )
          })
        })}
      </svg>
      <Legend items={series} />
    </div>
  )
}

export function LineChart({ series, height = 220, label }) {
  const styles = useStyles()
  const gradientId = useId()
  const allValues = series.flatMap((entry) => entry.data)
  const max = Math.max(...allValues, 1)
  const min = Math.min(...allValues, 0)
  const span = max - min || 1

  const toPoints = (data) =>
    data
      .map((value, index) => {
        const x = (index / (data.length - 1)) * 100
        const y = height - ((value - min) / span) * (height - 20) - 10
        return `${x},${y}`
      })
      .join(' ')

  return (
    <div className={styles.wrap}>
      <svg
        className={styles.svg}
        viewBox={`0 0 100 ${height}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={label}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={chartPalette[0]} stopOpacity="0.25" />
            <stop offset="100%" stopColor={chartPalette[0]} stopOpacity="0" />
          </linearGradient>
        </defs>
        {[0, 0.5, 1].map((ratio) => (
          <line
            key={ratio}
            className={styles.gridLine}
            x1="0"
            x2="100"
            y1={height * ratio}
            y2={height * ratio}
            strokeWidth="0.5"
          />
        ))}
        {series.length === 1 && (
          <polygon
            points={`0,${height} ${toPoints(series[0].data)} 100,${height}`}
            fill={`url(#${gradientId})`}
          />
        )}
        {series.map((entry, index) => (
          <polyline
            key={entry.label}
            points={toPoints(entry.data)}
            fill="none"
            stroke={entry.color ?? chartPalette[index % chartPalette.length]}
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      </svg>
      <Legend items={series} />
    </div>
  )
}

export function DonutChart({ data, size = 168, thickness = 22, centerValue, centerLabel, label }) {
  const styles = useStyles()
  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const total = data.reduce((sum, item) => sum + item.value, 0) || 1

  const segments = data.reduce((accumulator, item, index) => {
    const previous = accumulator[index - 1]
    const start = previous ? previous.start + previous.fraction : 0
    accumulator.push({ ...item, fraction: item.value / total, start })
    return accumulator
  }, [])

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutHost} style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label={label}>
          {segments.map((item, index) => {
            const dash = item.fraction * circumference
            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={thickness}
                stroke={item.color ?? chartPalette[index % chartPalette.length]}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-item.start * circumference}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              >
                <title>{`${item.label}: ${item.value}`}</title>
              </circle>
            )
          })}
        </svg>
        {centerValue !== undefined && (
          <div className={styles.donutCenter}>
            <span className={styles.donutValue}>{centerValue}</span>
            {centerLabel && <Caption1>{centerLabel}</Caption1>}
          </div>
        )}
      </div>
      <Legend items={data} />
    </div>
  )
}
