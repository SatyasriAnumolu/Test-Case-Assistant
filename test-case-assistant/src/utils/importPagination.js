export const IMPORT_PAGE_SIZE = 50

export function getImportPageBounds(itemCount, requestedPage) {
  const pageCount = Math.max(1, Math.ceil(itemCount / IMPORT_PAGE_SIZE))
  const page = Math.min(Math.max(1, requestedPage), pageCount)
  const start = (page - 1) * IMPORT_PAGE_SIZE

  return {
    page,
    pageCount,
    start,
    end: Math.min(start + IMPORT_PAGE_SIZE, itemCount),
  }
}
