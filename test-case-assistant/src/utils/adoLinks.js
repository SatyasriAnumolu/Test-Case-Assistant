// Accepts either an organization name ("contoso") or a full org URL
// ("https://dev.azure.com/contoso" or "https://contoso.visualstudio.com").
export function getAdoWorkItemUrl(organization, project, workItemId) {
  const org = String(organization ?? '').trim().replace(/\/+$/, '')
  const proj = String(project ?? '').trim()
  const id = Number(workItemId)

  if (!org || !proj || !Number.isInteger(id) || id <= 0) return null

  const baseUrl = /^https?:\/\//i.test(org) ? org : `https://dev.azure.com/${encodeURIComponent(org)}`
  return `${baseUrl}/${encodeURIComponent(proj)}/_workitems/edit/${id}`
}
