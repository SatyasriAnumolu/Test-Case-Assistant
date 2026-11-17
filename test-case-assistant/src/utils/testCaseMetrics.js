import { findDuplicateClusters } from './duplicates'

export const ADO_STATES = ['New', 'Design', 'Ready']

const THIN_STEP_LIMIT = 2

function scoreTestCase(item, duplicateIds) {
  let score = 0

  if (item.stepCount >= 3) score += 40
  else if (item.stepCount > 0) score += 20

  if (item.state === 'Ready') score += 30
  else if (item.state === 'Design') score += 20
  else score += 10

  if (!duplicateIds.has(item.id)) score += 20
  if (item.priority) score += 10

  return Math.min(100, score)
}

export const ANALYSIS_TYPES = [
  'Duplicate Test Cases',
  'Missing Steps',
  'Quality Issues',
  'Coverage Gaps',
  'AI Recommendations',
]

const THIN_COVERAGE_LIMIT = 5
const QUALITY_ISSUE_LIMIT = 70

/**
 * Narrows the suite to the cases each analysis type is about, so every dashboard
 * widget reflects the selected filters.
 */
export function filterTestCases(testCases, { module: area, analysis, search } = {}) {
  let result = testCases

  if (area && area !== 'All Modules') {
    result = result.filter((item) => (item.areaPath || 'Unassigned').endsWith(area))
  }

  const term = search?.trim().toLowerCase()
  if (term) {
    result = result.filter((item) =>
      `${item.id} ${item.title} ${item.areaPath} ${item.state}`.toLowerCase().includes(term),
    )
  }

  if (!analysis || analysis === 'All') return result

  const duplicateIds = new Set(
    findDuplicateClusters(result)
      .flatMap((cluster) => cluster.cases.slice(1))
      .map((item) => item.id),
  )
  const scores = scoreTestCases(result, duplicateIds)

  switch (analysis) {
    case 'Duplicate Test Cases':
      return result.filter((item) => duplicateIds.has(item.id))
    case 'Missing Steps':
      return result.filter((item) => item.stepCount <= THIN_STEP_LIMIT)
    case 'Quality Issues':
      return result.filter((item) => scores.get(item.id) < QUALITY_ISSUE_LIMIT)
    case 'Coverage Gaps': {
      // Thinly covered areas are the closest proxy until requirement links are imported.
      const areaCounts = new Map()
      for (const item of result) {
        const key = item.areaPath || 'Unassigned'
        areaCounts.set(key, (areaCounts.get(key) ?? 0) + 1)
      }
      return result.filter(
        (item) => areaCounts.get(item.areaPath || 'Unassigned') < THIN_COVERAGE_LIMIT,
      )
    }
    case 'AI Recommendations':
      return result.filter(
        (item) =>
          duplicateIds.has(item.id) ||
          item.stepCount <= THIN_STEP_LIMIT ||
          scores.get(item.id) < QUALITY_ISSUE_LIMIT,
      )
    default:
      return result
  }
}

function scoreTestCases(testCases, duplicateIds) {
  return new Map(testCases.map((item) => [item.id, scoreTestCase(item, duplicateIds)]))
}

/**
 * Derives every dashboard metric from the synced Azure DevOps test cases so the
 * dashboard reflects real imported data rather than sample figures.
 */
export function computeTestCaseMetrics(testCases, similarityThreshold = 0.7) {
  const total = testCases.length

  if (total === 0) {
    return {
      total: 0,
      byStatus: ADO_STATES.map((state) => ({ label: state, value: 0 })),
      byArea: [],
      duplicateClusters: [],
      duplicateCount: 0,
      missingSteps: 0,
      thinSteps: 0,
      qualityScore: 0,
    }
  }

  const clusters = findDuplicateClusters(testCases, similarityThreshold)
  const duplicateIds = new Set(
    clusters.flatMap((cluster) => cluster.cases.slice(1).map((item) => item.id)),
  )

  const statusCounts = new Map(ADO_STATES.map((state) => [state, 0]))
  const areaCounts = new Map()

  for (const item of testCases) {
    const state = statusCounts.has(item.state) ? item.state : 'New'
    statusCounts.set(state, statusCounts.get(state) + 1)

    const area = item.areaPath || 'Unassigned'
    areaCounts.set(area, (areaCounts.get(area) ?? 0) + 1)
  }

  const qualityScore = Math.round(
    testCases.reduce((sum, item) => sum + scoreTestCase(item, duplicateIds), 0) / total,
  )

  return {
    total,
    byStatus: [...statusCounts.entries()].map(([label, value]) => ({ label, value })),
    byArea: [...areaCounts.entries()]
      .map(([label, value]) => ({ label: label.split('\\').pop(), value }))
      .sort((left, right) => right.value - left.value)
      .slice(0, 8),
    duplicateClusters: clusters,
    duplicateCount: duplicateIds.size,
    missingSteps: testCases.filter((item) => item.stepCount === 0).length,
    thinSteps: testCases.filter((item) => item.stepCount <= THIN_STEP_LIMIT).length,
    qualityScore,
  }
}
