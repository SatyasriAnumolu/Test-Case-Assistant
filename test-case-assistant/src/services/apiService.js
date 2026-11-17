const API_BASE_URL = 'http://localhost:5000/api/v1'

// Error responses are sometimes empty (404, 204), so never call response.json() blindly.
async function readPayload(response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

// Azure DevOps sometimes answers with a full HTML sign-in/error page instead of JSON.
function summarizeHtmlError(message) {
  if (typeof message !== 'string' || !/<(!doctype\s+)?html[\s>]/i.test(message)) return message

  const prefix = message.slice(0, message.search(/<(!doctype|html)/i)).trim().replace(/:$/, '')
  const title = message.match(/<title>([^<]*)<\/title>/i)?.[1]?.trim()
  const reason = /looping logins/i.test(title ?? '')
    ? 'Azure DevOps did not accept the personal access token. Check that it is copied completely, has not expired or been revoked, and was created for this organization.'
    : 'Azure DevOps returned an HTML error page instead of data. Check that the personal access token is valid for this organization.'

  return [prefix, title, reason].filter(Boolean).join(' — ')
}

function describeFailure(response, payload, fallback) {
  if (payload?.message) return summarizeHtmlError(payload.message)
  if (payload?.title) return payload.title
  if (response.status === 404) {
    return 'Endpoint not found. Restart the backend API so the latest routes are loaded.'
  }
  return `${fallback} (HTTP ${response.status})`
}

export async function fetchHealth() {
  return { status: 'ok', timestamp: new Date().toISOString() }
}

export async function testAdoConnection({ organization, project, pat }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-connection-test`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, pat }),
  })

  const payload = await readPayload(response)
  return {
    ok: response.ok,
    payload: payload
      ? { ...payload, message: summarizeHtmlError(payload.message) }
      : { message: describeFailure(response, payload, 'Connection test failed') },
  }
}

export async function fetchAdoProjects({ organization, pat }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-projects`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, pat }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    throw new Error(describeFailure(response, payload, 'Could not load projects from Azure DevOps'))
  }

  return payload?.projects ?? []
}

export async function fetchAdoAreaPaths({ organization, project, pat }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-area-paths`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, pat }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    throw new Error(describeFailure(response, payload, 'Could not load area paths from Azure DevOps'))
  }

  return payload?.areaPaths ?? []
}

export async function fetchAdoTestPlans({ organization, project, pat, areaPaths = [] }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-test-plans`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, pat, areaPaths }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Insufficient PAT permissions to read Test Plans. Ensure Test Plans (Read) access is granted.')
    }
    throw new Error(describeFailure(response, payload, 'Could not load test plans from Azure DevOps'))
  }

  const plans = payload?.plans
  if (!Array.isArray(plans)) {
    return []
  }

  return plans
}

export async function fetchAdoTestSuites({ organization, project, planId, pat }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-test-suites`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, planId, pat }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Insufficient PAT permissions to read Test Suites. Ensure Test Plans/Test Suites (Read) access is granted.')
    }
    throw new Error(describeFailure(response, payload, 'Could not load test suites from Azure DevOps'))
  }

  const suites = payload?.suites
  if (!Array.isArray(suites)) {
    return []
  }

  return suites
}

export async function syncAdoTestCases({ organization, project, pat, areaPaths, planId, suiteId, scope }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-sync`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, pat, areaPaths, planId, suiteId, scope }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    throw new Error(describeFailure(response, payload, 'Test case sync failed'))
  }

  return payload
}

export async function publishTestCasesToAdo({ organization, project, pat, planId, suiteId, testCases }) {
  const response = await fetch(`${API_BASE_URL}/import/ado-publish-test-cases`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ organization, project, pat, planId, suiteId, testCases }),
  })

  const payload = await readPayload(response)
  if (!response.ok) {
    throw new Error(describeFailure(response, payload, 'Publishing test cases to Azure DevOps failed'))
  }

  return payload
}
