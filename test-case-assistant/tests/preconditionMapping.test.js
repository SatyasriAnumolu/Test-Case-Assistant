import assert from 'node:assert/strict'
import test from 'node:test'
import { mapPreconditionResults } from '../src/utils/preconditionMapping.js'
import { preconditionExpectedResult } from '../src/services/openaiService.js'

const actions = [
  'Install Application Server, InTouch and Historian on the Galaxy Repository (GR) node.',
  'Configure the GR node and create a Galaxy.',
  'Create instances of WinPlatform, AppEngine, Area, and a user-defined object.',
  'Deploy the Galaxy.',
]
const expectedResults = [
  'Application Server, InTouch and Historian function correctly on the GR node.',
  'The configured Galaxy is accessible and operational.',
  'WinPlatform, AppEngine, Area, and user-defined object instances behave as expected.',
  'The deployed Galaxy processes the operation successfully without errors.',
]
const makePreconditions = () => actions.map((text, index) => ({ id: `PRE-${index + 1}`, text }))

test('binds separate precondition results by index when counts match', () => {
  const source = makePreconditions()
  const mapped = mapPreconditionResults(source, expectedResults)

  assert.deepEqual(mapped, source.map((item, index) => ({
    ...item,
    expected: expectedResults[index],
  })))
  assert.deepEqual(source, makePreconditions())
})

test('binds text-based expected-result objects without changing the generated text', () => {
  const mapped = mapPreconditionResults(
    makePreconditions(),
    expectedResults.map((text, index) => ({ id: `ER-${index + 1}`, text })),
  )

  assert.deepEqual(mapped.map((item) => item.expected), expectedResults)
})

test('preserves embedded results and intentionally cleared expected-result cells', () => {
  const source = [
    { id: 'PRE-1', text: actions[0], expected: 'Manually reviewed outcome' },
    { id: 'PRE-2', text: actions[1], expected: '' },
  ]
  const mapped = mapPreconditionResults(source, expectedResults.slice(0, 2))

  assert.deepEqual(mapped, source)
  assert.equal(mapped[0], source[0])
  assert.equal(mapped[1].expected, '')
})

test('fills older rows using the existing precondition outcome mapping', () => {
  const source = makePreconditions()
  const mapped = mapPreconditionResults(source)

  assert.deepEqual(mapped.map((item) => item.expected), actions.map(preconditionExpectedResult))
  assert.ok(mapped.every((item) => item.expected))
  assert.deepEqual(source, makePreconditions())
})

test('keeps the result paired with its row after editing the action or changing row order', () => {
  const hydrated = mapPreconditionResults(makePreconditions())
  const edited = hydrated.map((item, index) =>
    index === 0 ? { ...item, text: 'Edited setup action' } : item,
  )
  const mapped = mapPreconditionResults([...edited].reverse())

  assert.equal(mapped.at(-1).text, 'Edited setup action')
  assert.equal(mapped.at(-1).expected, hydrated[0].expected)
})

test('falls back to per-precondition results when counts do not match', () => {
  const mapped = mapPreconditionResults(makePreconditions(), expectedResults.slice(0, 3))

  assert.deepEqual(mapped.map((item) => item.expected), actions.map(preconditionExpectedResult))
})

test('falls back when a separate result has no text', () => {
  const mapped = mapPreconditionResults(makePreconditions().slice(0, 1), [{ id: 'ER-1' }])

  assert.equal(mapped[0].expected, preconditionExpectedResult(actions[0]))
})

test('standard preconditions populate the requested expected results', () => {
  assert.deepEqual(mapPreconditionResults(makePreconditions()).map((item) => item.expected), expectedResults)
})

test('handles empty preconditions without adding rows', () => {
  assert.deepEqual(mapPreconditionResults([], []), [])
})
