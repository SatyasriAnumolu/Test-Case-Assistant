export interface KpiItem {
  id: string
  title: string
  value: string
  delta: string
  trend: 'up' | 'down' | 'neutral'
}

export interface TrendPoint {
  label: string
  value: number
}

export interface ActivityItem {
  id: string
  title: string
  detail: string
  time: string
}

export interface RecommendationItem {
  id: string
  title: string
  impact: 'High' | 'Medium' | 'Low'
}

export interface QuickActionItem {
  id: string
  label: string
  description: string
}
