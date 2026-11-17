import assert from 'node:assert/strict'
import test from 'node:test'
import { getImportPageBounds, IMPORT_PAGE_SIZE } from '../src/utils/importPagination.js'

test('handles empty and single-page imports', () => {
  assert.deepEqual(getImportPageBounds(0, 1), { page: 1, pageCount: 1, start: 0, end: 0 })
  assert.deepEqual(getImportPageBounds(25, 1), { page: 1, pageCount: 1, start: 0, end: 25 })
  assert.deepEqual(getImportPageBounds(50, 1), { page: 1, pageCount: 1, start: 0, end: 50 })
})

test('covers a 105,588-case import without gaps or oversized pages', () => {
  const count = 105588
  const { pageCount } = getImportPageBounds(count, 1)
  assert.equal(pageCount, 2112)

  let nextStart = 0
  for (let page = 1; page <= pageCount; page += 1) {
    const bounds = getImportPageBounds(count, page)
    assert.equal(bounds.page, page)
    assert.equal(bounds.start, nextStart)
    assert.ok(bounds.end - bounds.start <= IMPORT_PAGE_SIZE)
    nextStart = bounds.end
  }
  assert.equal(nextStart, count)
  assert.deepEqual(getImportPageBounds(count, pageCount), {
    page: 2112,
    pageCount: 2112,
    start: 105550,
    end: 105588,
  })
})

test('clamps the current page when a new import has fewer items', () => {
  assert.deepEqual(getImportPageBounds(51, 10), { page: 2, pageCount: 2, start: 50, end: 51 })
  assert.deepEqual(getImportPageBounds(10, 0), { page: 1, pageCount: 1, start: 0, end: 10 })
})
