import type {
  ActivityItem,
  KpiItem,
  QuickActionItem,
  RecommendationItem,
  TrendPoint,
} from './types'

export const kpis: KpiItem[] = [
  {
    id: 'total-test-cases',
    title: 'Total Test Cases',
    value: '1,248',
    delta: '+8.2% this month',
    trend: 'up',
  },
  {
    id: 'duplicate-test-cases',
    title: 'Duplicate Test Cases',
    value: '84',
    delta: '-12.4% after cleanup',
    trend: 'down',
  },
  {
    id: 'quality-issues',
    title: 'Quality Issues',
    value: '119',
    delta: '-5.1% this sprint',
    trend: 'down',
  },
  {
    id: 'coverage-gaps',
    title: 'Coverage Gaps',
    value: '37',
    delta: '+4 new risks detected',
    trend: 'neutral',
  },
]

export const qualityTrend: TrendPoint[] = [
  { label: 'W1', value: 72 },
  { label: 'W2', value: 75 },
  { label: 'W3', value: 79 },
  { label: 'W4', value: 81 },
  { label: 'W5', value: 84 },
  { label: 'W6', value: 86 },
]

export const moduleHealth: TrendPoint[] = [
  { label: 'Auth', value: 88 },
  { label: 'Payments', value: 76 },
  { label: 'Orders', value: 83 },
  { label: 'Catalog', value: 91 },
  { label: 'Profile', value: 79 },
]

export const coverageStatus: TrendPoint[] = [
  { label: 'Unit', value: 82 },
  { label: 'API', value: 74 },
  { label: 'UI', value: 67 },
  { label: 'E2E', value: 58 },
]

export const activities: ActivityItem[] = [
  {
    id: 'activity-1',
    title: 'Duplicate detection job completed',
    detail: '7 clusters flagged in Payments and Orders.',
    time: '10 min ago',
  },
  {
    id: 'activity-2',
    title: 'BRD imported for release 25.3',
    detail: '54 requirements extracted with 98% confidence.',
    time: '42 min ago',
  },
  {
    id: 'activity-3',
    title: 'Quality score recalculation finished',
    detail: 'Average score improved from 83.1 to 86.2.',
    time: '1 hr ago',
  },
]

export const recommendations: RecommendationItem[] = [
  {
    id: 'rec-1',
    title: 'Merge TC-447 and TC-502; semantic similarity is 0.94.',
    impact: 'High',
  },
  {
    id: 'rec-2',
    title: 'Add negative case for payment timeout and retry lockout.',
    impact: 'High',
  },
  {
    id: 'rec-3',
    title: 'Improve expected results for 17 login test cases.',
    impact: 'Medium',
  },
]

export const quickActions: QuickActionItem[] = [
  {
    id: 'qa-1',
    label: 'Run Duplicate Analysis',
    description: 'Analyze repository and group overlap candidates.',
  },
  {
    id: 'qa-2',
    label: 'Generate Negative Cases',
    description: 'Create risk-focused scenarios from BRD.',
  },
  {
    id: 'qa-3',
    label: 'Export Executive Report',
    description: 'Download KPI and quality report for stakeholders.',
  },
]
