const STOP_WORDS = new Set(['the', 'a', 'an', 'to', 'for', 'of', 'and', 'or', 'is', 'in', 'on', 'with', 'when', 'then', 'should'])

function tokenize(value) {
  return new Set(
    (value || '')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 2 && !STOP_WORDS.has(token)),
  )
}

function jaccard(left, right) {
  if (left.size === 0 || right.size === 0) return 0
  let shared = 0
  for (const token of left) {
    if (right.has(token)) shared += 1
  }
  return shared / (left.size + right.size - shared)
}

function find(parent, index) {
  let root = index
  while (parent[root] !== root) root = parent[root]
  let cursor = index
  while (parent[cursor] !== root) {
    const next = parent[cursor]
    parent[cursor] = root
    cursor = next
  }
  return root
}

/**
 * Groups test cases whose titles exceed the similarity threshold, using
 * union-find so transitive matches land in a single cluster.
 */
export function findDuplicateClusters(testCases, threshold = 0.7) {
  const tokens = testCases.map((item) => tokenize(item.title))
  const parent = testCases.map((_item, index) => index)
  const scores = new Map()

  for (let i = 0; i < testCases.length; i += 1) {
    for (let j = i + 1; j < testCases.length; j += 1) {
      const score = jaccard(tokens[i], tokens[j])
      if (score < threshold) continue

      const rootLeft = find(parent, i)
      const rootRight = find(parent, j)
      if (rootLeft !== rootRight) parent[rootRight] = rootLeft

      const root = find(parent, i)
      scores.set(root, Math.max(scores.get(root) ?? 0, score))
    }
  }

  const membersByRoot = new Map()
  testCases.forEach((item, index) => {
    const root = find(parent, index)
    if (!membersByRoot.has(root)) membersByRoot.set(root, [])
    membersByRoot.get(root).push(item)
  })

  return [...membersByRoot.entries()]
    .filter(([, members]) => members.length > 1)
    .map(([root, members]) => ({
      id: `CL-${members[0].id}`,
      similarity: scores.get(root) ?? threshold,
      // The case with the most steps is the richest and becomes the merge target.
      cases: [...members].sort((left, right) => right.stepCount - left.stepCount),
    }))
    .sort((left, right) => right.similarity - left.similarity)
}

export const DUPLICATE_CATEGORY = {
  exact: 'exact',
  review: 'review',
  crossArea: 'cross-area',
  notDuplicate: 'not-duplicate',
}

const CATEGORY_ORDER = [
  DUPLICATE_CATEGORY.exact,
  DUPLICATE_CATEGORY.review,
  DUPLICATE_CATEGORY.crossArea,
  DUPLICATE_CATEGORY.notDuplicate,
]

// Minimum token overlap for two cases' step text to count as similar.
const STEP_CONTENT_SIMILARITY = 0.8

// Azure DevOps Area Paths are case-insensitive.
function areaPathKey(value) {
  return (value ?? '').trim().toLowerCase()
}

function isWithinAreaPath(areaPath, root) {
  return areaPath === root || areaPath.startsWith(`${root}\\`)
}

/**
 * Restricts duplicate analysis to the test cases covered by the import
 * configuration that produced them. Plan and suite membership is already
 * guaranteed because each import replaces the synced set; this also enforces
 * the project and the Area Paths selected at import time, which the server
 * does not apply to plan or suite imports. RecycleBin cases are always excluded.
 */
export function filterToImportScope(testCases, importConfig) {
  const project = areaPathKey(importConfig?.project)
  const areaPaths = (importConfig?.areaPaths ?? []).map(areaPathKey).filter(Boolean)

  return (testCases ?? []).filter((item) => {
    if (/recyclebin/i.test(item.iterationPath || item.iteration || '')) return false

    const areaPath = areaPathKey(item.areaPath)
    if (project && areaPath && !isWithinAreaPath(areaPath, project)) return false
    if (areaPaths.length > 0) {
      return Boolean(areaPath) && areaPaths.some((root) => isWithinAreaPath(areaPath, root))
    }
    return true
  })
}

// Returns the case's step text, '' when it has no steps, or null when the
// step content is not available (synced cases carry only a step count).
function stepContent(item) {
  if (Array.isArray(item.steps) && item.steps.length > 0) {
    return item.steps
      .map((step) => (typeof step === 'string' ? step : `${step?.action ?? ''} ${step?.expected ?? ''}`))
      .join(' ')
  }
  if (typeof item.stepsText === 'string' && item.stepsText.trim()) return item.stepsText
  if ((item.stepCount ?? 0) === 0) return ''
  return null
}

/**
 * Compares the test step content of two cases.
 * Returns true (similar), false (different) or null when the content cannot be
 * compared. Step counts alone are never used to decide similarity.
 */
export function compareSteps(left, right) {
  const leftText = stepContent(left)
  const rightText = stepContent(right)

  if (leftText === '' && rightText === '') return true
  // A case with no steps differs from one that has steps, even if that text is unavailable.
  if (leftText === '' || rightText === '') return false
  if (leftText === null || rightText === null) return null

  return jaccard(tokenize(leftText), tokenize(rightText)) >= STEP_CONTENT_SIMILARITY
}

function bestTitleSimilarity(cases, fallback) {
  const tokens = cases.map((item) => tokenize(item.title))
  let best = 0
  for (let i = 0; i < tokens.length; i += 1) {
    for (let j = i + 1; j < tokens.length; j += 1) {
      best = Math.max(best, jaccard(tokens[i], tokens[j]))
    }
  }
  return best || fallback
}

function buildCluster(prefix, category, cases, roles, fallbackSimilarity) {
  return {
    id: `${prefix}-${cases[0].id}`,
    category,
    similarity: bestTitleSimilarity(cases, fallbackSimilarity),
    cases,
    roles,
  }
}

/**
 * Splits title-similarity clusters by Area Path so identical titles in different
 * modules are not reported as duplicates. Step similarity is based on step
 * content (see compareSteps); when it cannot be compared the pair is never
 * labelled Exact Duplicate or Not Duplicate:
 * - same Area Path, similar steps               -> exact duplicate
 * - same Area Path, different/unknown steps     -> review required
 * - different Area Path, similar/unknown steps  -> cross-area match
 * - different Area Path, different steps        -> not duplicate
 * Each case's relation to the cluster primary is returned in `roles`.
 */
export function classifyDuplicateClusters(testCases, threshold = 0.7) {
  const result = []

  for (const titleCluster of findDuplicateClusters(testCases, threshold)) {
    const byArea = new Map()
    for (const item of titleCluster.cases) {
      const key = areaPathKey(item.areaPath)
      if (!byArea.has(key)) byArea.set(key, [])
      byArea.get(key).push(item)
    }

    // Title-cluster cases are sorted by step count, so each area's first case is its richest.
    const representatives = []
    for (const members of byArea.values()) {
      representatives.push(members[0])
      if (members.length < 2) continue

      const [primary, ...rest] = members
      const roles = { [primary.id]: 'primary' }
      let allSimilar = true
      for (const item of rest) {
        const similar = compareSteps(primary, item) === true
        roles[item.id] = similar ? 'duplicate' : 'review'
        if (!similar) allSimilar = false
      }
      result.push(
        allSimilar
          ? buildCluster('CL', DUPLICATE_CATEGORY.exact, members, roles, titleCluster.similarity)
          : buildCluster('RV', DUPLICATE_CATEGORY.review, members, roles, titleCluster.similarity),
      )
    }

    if (representatives.length < 2) continue

    const [primary, ...rest] = representatives
    const roles = { [primary.id]: 'primary' }
    let allDifferent = true
    for (const item of rest) {
      const different = compareSteps(primary, item) === false
      roles[item.id] = different ? 'not-duplicate' : 'cross-area'
      if (!different) allDifferent = false
    }
    result.push(
      allDifferent
        ? buildCluster('ND', DUPLICATE_CATEGORY.notDuplicate, representatives, roles, titleCluster.similarity)
        : buildCluster('XA', DUPLICATE_CATEGORY.crossArea, representatives, roles, titleCluster.similarity),
    )
  }

  return result.sort(
    (left, right) =>
      CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category) ||
      right.similarity - left.similarity,
  )
}

export function summarizeDuplicateClusters(clusters) {
  const summary = { exact: 0, crossArea: 0, review: 0, notDuplicate: 0 }
  for (const cluster of clusters ?? []) {
    if (cluster.category === DUPLICATE_CATEGORY.exact) summary.exact += 1
    else if (cluster.category === DUPLICATE_CATEGORY.crossArea) summary.crossArea += 1
    else if (cluster.category === DUPLICATE_CATEGORY.review) summary.review += 1
    else summary.notDuplicate += 1
  }
  return summary
}
