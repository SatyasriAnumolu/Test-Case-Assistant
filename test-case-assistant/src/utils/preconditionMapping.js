import { preconditionExpectedResult } from '../services/openaiService.js'

// Pairs each precondition with its expected result. Separate results are bound by index
// only when the counts match; otherwise the result is derived from the precondition text.
// Rows that already carry an `expected` value (including an intentionally cleared '') are kept.
export function mapPreconditionResults(preconditions = [], expectedResults) {
  const bindByIndex = Array.isArray(expectedResults) && expectedResults.length === preconditions.length

  return preconditions.map((precondition, index) => {
    if (precondition.expected != null) return precondition

    const result = bindByIndex ? expectedResults[index] : undefined
    const bound = typeof result === 'string' ? result : result?.text
    const expected = typeof bound === 'string' && bound.trim()
      ? bound
      : preconditionExpectedResult(precondition.text ?? '')

    return { ...precondition, expected }
  })
}
