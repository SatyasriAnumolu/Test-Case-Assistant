const GENERATION_KINDS = ['steps', 'expectedResults', 'negativeScenarios', 'edgeCases']

function seedLines(input) {
  return [input.title, input.description, input.acceptanceCriteria]
    .filter(Boolean)
    .join('\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

// Installation, configuration, creation, deployment and other setup work must be
// done before the test starts, so it is a precondition rather than a step or result.
const PRECONDITION_PATTERN =
  /\b(install(?:s|ed|ing|ation)?|configur(?:e|es|ed|ing|ation)|set\s*up|setup|creat(?:e|es|ed|ing|ion)|deploy(?:s|ed|ing|ment)?|licen[cs](?:e|es|ed|ing)|provision(?:s|ed|ing)?|prerequisites?)\b/i

function statements(text) {
  return (text || '')
    .split(/\r?\n|(?<=[.;])\s+(?=[A-Z0-9])/)
    .map((line) => line.replace(/^\s*(?:[-*•]|\d+\s*[.)])\s*/, '').trim())
    .filter((line) => line && !/:$/.test(line))
}

const VERIFICATION_PATTERN = /^\s*(verify|validate|check|confirm|ensure|test)\b/i

// "Configure attribute" names an attribute category, not a configuration activity.
function withoutAttributeNames(text) {
  return (text || '').replace(/\bconfigure\s+attributes?\b/gi, '')
}

// Standard environment setup stages, ordered: each depends on the ones before it.
const SETUP_STAGE = { install: 0, repository: 1, galaxy: 2, objects: 3, deploy: 4 }

// Included in every generated test case unless the requirement validates the
// stage itself, in which case that stage and the ones after it become test steps.
const STANDARD_PRECONDITIONS = [
  {
    stages: [SETUP_STAGE.install],
    text: 'Install Application Server, InTouch and Historian on the Galaxy Repository (GR) node.',
    expected: 'Application Server, InTouch and Historian function correctly on the GR node.',
  },
  {
    stages: [SETUP_STAGE.repository, SETUP_STAGE.galaxy],
    text: 'Configure the GR node and create a Galaxy.',
    expected: 'The configured Galaxy is accessible and operational.',
  },
  {
    stages: [SETUP_STAGE.objects],
    text: 'Create instances of WinPlatform, AppEngine, Area, and a user-defined object.',
    expected: 'WinPlatform, AppEngine, Area, and user-defined object instances behave as expected.',
  },
  {
    stages: [SETUP_STAGE.deploy],
    text: 'Deploy the Galaxy.',
    expected: 'The deployed Galaxy processes the operation successfully without errors.',
  },
]

const PRECONDITION_ACTION_OUTCOMES = [
  [/^install\s+(.+)$/i, 'Installation is complete for'],
  [/^configure\s+(.+)$/i, 'Configuration is complete for'],
  [/^(?:set\s+up|setup)\s+(.+)$/i, 'Setup is complete for'],
  [/^create\s+(.+)$/i, 'Creation is complete for'],
  [/^deploy\s+(.+)$/i, 'Deployment is complete for'],
  [/^licen[cs]e\s+(.+)$/i, 'Licensing is complete for'],
  [/^provision\s+(.+)$/i, 'Provisioning is complete for'],
]

export function preconditionExpectedResult(text) {
  const standard = STANDARD_PRECONDITIONS.find((item) => item.text === text)
  if (standard) return standard.expected

  const action = text.trim().replace(/[.!?]+$/, '')
  for (const [pattern, outcome] of PRECONDITION_ACTION_OUTCOMES) {
    const match = action.match(pattern)
    if (match && !/\b(?:and|then)\s+(?:install|configure|set\s+up|setup|create|deploy|licen[cs]e|provision)\b/i.test(match[1])) {
      return `${outcome} ${match[1]}.`
    }
  }
  return `The following precondition is satisfied: ${text}`
}

const COMMON_SETUP_STAGES = [
  {
    stage: SETUP_STAGE.install,
    patterns: [
      /\binstall\w*\b.*\b(app\s*server|application\s+server|intouch|historian|products?|build)\b/i,
      /\b(app\s*server|application\s+server|intouch|historian)\b.*\binstall\w*\b/i,
    ],
  },
  {
    stage: SETUP_STAGE.repository,
    patterns: [/\b(configur\w*|set\s*up|setup)\b.*\b(gr\s+node|galaxy\s+repository|gr)\b/i],
  },
  {
    stage: SETUP_STAGE.galaxy,
    patterns: [/\bcreat\w*\b.*\bgalax(y|ies)\b/i, /\bgalax(y|ies)\b.*\bcreat\w*\b/i],
  },
  {
    stage: SETUP_STAGE.objects,
    patterns: [
      /\bcreat\w*\b.*\b(win\s*platform|app\s*engine|app\s*egine|area|user\s*defined\s*objects?|udos?)\b/i,
    ],
  },
  {
    stage: SETUP_STAGE.deploy,
    patterns: [/\b(un)?deploy\w*\b.*\bgalax(y|ies)\b/i, /\bgalax(y|ies)\b.*\b(un)?deploy\w*\b/i],
  },
]

// Setup stages a statement mentions (e.g. "Set up a GR node and create galaxy" -> [1, 2]).
function setupStages(statement) {
  const text = withoutAttributeNames(statement)
  return COMMON_SETUP_STAGES.filter(({ patterns }) => patterns.some((pattern) => pattern.test(text))).map(
    ({ stage }) => stage,
  )
}

// Same stages, but matched loosely so titles such as "Verify Galaxy deployment" count.
const TESTED_STAGE_PATTERNS = [
  [SETUP_STAGE.install, /\binstall\w*\b/i],
  [SETUP_STAGE.repository, /\b(configur\w*|set\s*up|setup)\b.*\b(gr\s+node|galaxy\s+repository)\b/i],
  [SETUP_STAGE.galaxy, /\b(creat\w*\b.*\bgalax(y|ies)|galax(y|ies)\b.*\bcreat\w*)\b/i],
  [SETUP_STAGE.objects, /\bcreat\w*\b.*\b(win\s*platform|app\s*engine|area|user\s*defined\s*objects?|udos?|instances?)\b/i],
  [SETUP_STAGE.deploy, /\b(un)?deploy\w*\b/i],
]

/**
 * Setup stages the test itself validates. A stage counts when the title names
 * it or a verification statement ("Verify ...", "Validate ...") does.
 */
function testedSetupStages(title, all) {
  const sources = [title, ...all.filter((statement) => VERIFICATION_PATTERN.test(statement))]
    .map(withoutAttributeNames)
    .filter(Boolean)
  const stages = new Set()
  for (const text of sources) {
    for (const [stage, pattern] of TESTED_STAGE_PATTERNS) {
      if (pattern.test(text)) stages.add(stage)
    }
  }
  return stages
}

export function isPrecondition(statement) {
  // Verification statements are test steps even when they mention setup activities.
  if (VERIFICATION_PATTERN.test(statement)) return false
  return PRECONDITION_PATTERN.test(withoutAttributeNames(statement))
}

export function isCommonSetup(statement) {
  if (VERIFICATION_PATTERN.test(statement)) return false
  return setupStages(statement).length > 0
}

const SUBJECT_STOP_WORDS = new Set([
  'the', 'and', 'with', 'from', 'that', 'this', 'into', 'for', 'verify', 'validate', 'check',
  'confirm', 'ensure', 'test', 'successfully', 'correctly', 'should', 'when', 'then',
])

function subjectWords(text) {
  return new Set(
    withoutAttributeNames(text)
      .toLowerCase()
      .split(/[^a-z0-9$]+/)
      .filter((word) => word.length > 3 && !SUBJECT_STOP_WORDS.has(word) && !PRECONDITION_PATTERN.test(word)),
  )
}

// A test-specific setup statement is the action under test when the title or a
// verification statement names the same kind of setup on the same subject.
function isSetupUnderTest(statement, testText) {
  const verb = withoutAttributeNames(statement).match(PRECONDITION_PATTERN)?.[1]?.toLowerCase().slice(0, 5)
  if (!verb || !withoutAttributeNames(testText).toLowerCase().includes(verb)) return false
  const testWords = subjectWords(testText)
  return [...subjectWords(statement)].some((word) => testWords.has(word))
}

// Preconditions implied by what the test exercises. Anything the test itself
// validates or creates (e.g. deployment, runtime state, a new template) is never
// assumed beforehand. `createdText` holds the setup actions under test.
function scenarioPreconditions(text, testedStages, createdText = '') {
  const result = []
  const add = (condition, value) => {
    if (condition && !result.includes(value)) result.push(value)
  }
  const tested = (stage) => testedStages.has(stage)
  const earliestTested = testedStages.size ? Math.min(...testedStages) : Infinity
  // A Galaxy (and its objects) only exists beforehand if its creation is not under test.
  const galaxyExists = earliestTested > SETUP_STAGE.galaxy
  const objectsExist = earliestTested > SETUP_STAGE.objects
  const templatesExist = objectsExist && !/\btemplates?\b/i.test(createdText)
  const instancesExist = objectsExist && !/\b(instances?|objects?)\b/i.test(createdText)
  const attributesExist = objectsExist && !/\battributes?\b/i.test(createdText)
  const attribute = [...text.matchAll(/\b([A-Za-z][\w.]*)\s+attributes?\b/gi)]
    .map((match) => match[1])
    .find((name) => !/^(the|an?|this|that|each|all|selected|read|write|edit|modify|set|update|change|new)$/i.test(name))
  const usesGalaxy = /\b(ide|galax(y|ies)|templates?|objects?|instances?|attributes?)\b/i.test(text)
  const mentionsScanState = /\b(on\s*scan|off\s*scan|scan\s*state)\b/i.test(text)
  const mentionsRuntime = /\b(runtime|object\s+viewer)\b/i.test(text)

  add(galaxyExists && usesGalaxy, 'User is authenticated and connected to the Galaxy.')
  add(templatesExist && /\btemplates?\b/i.test(text), 'The required templates exist in the Template Toolbox.')
  add(templatesExist && /\bderived\b/i.test(text), 'Derived templates or child instances exist for the selected templates.')
  add(templatesExist && /\bprotected\b/i.test(text), 'The selected templates are protected.')
  add(
    instancesExist && /\b(attributes?|instances?|objects?)\b/i.test(text) && !/\btemplates?\b/i.test(text),
    'The required object instance exists.',
  )
  const availability = /\b(write|writes|edit|modify|set|update|change|configure)\b/i.test(text)
    ? 'is available for editing.'
    : 'is available.'
  add(
    attributesExist && /\battributes?\b/i.test(text),
    attribute ? `The ${attribute} attribute ${availability}` : `The required attribute ${availability}`,
  )
  // Deployment is only assumed when it is not what the test validates. When the
  // scan state is under test, only deployment is assumed, not that it is running.
  if (objectsExist && !tested(SETUP_STAGE.deploy)) {
    add(mentionsScanState, 'The object instance is deployed.')
    add(mentionsRuntime && !mentionsScanState, 'The object instance is deployed and running.')
  }
  const productsInstalled = !tested(SETUP_STAGE.install)
  add(productsInstalled && /\b(intouch|windowviewer|window\s+viewer)\b/i.test(text), 'The InTouch application is open in WindowViewer.')
  add(productsInstalled && /\bhistorian\b/i.test(text), 'Historian is running and the required tags are historized.')
  return result
}

/**
 * Splits a requirement into preconditions and executable test statements.
 * - The standard environment preconditions (install, GR/Galaxy, instances, deploy)
 *   are always included. If the test validates one of those stages, that stage and
 *   the later ones are not assumed, and the matching lines become test steps.
 * - Test-specific setup stays a precondition, unless it is the action under test.
 * - Further preconditions are inferred from what the test exercises.
 */
export function classifyRequirement(description, title = '') {
  const all = statements(description)
  const testedStages = testedSetupStages(title, all)
  const testText = [title, ...all.filter((statement) => VERIFICATION_PATTERN.test(statement))].join(' ')

  const earliestTested = testedStages.size ? Math.min(...testedStages) : Infinity
  const standard = STANDARD_PRECONDITIONS.filter(({ stages }) => Math.max(...stages) < earliestTested).map(
    ({ text }) => text,
  )

  const explicit = []
  const testStatements = []
  const setupUnderTest = []
  for (const statement of all) {
    const stages = isCommonSetup(statement) ? setupStages(statement) : []
    if (stages.length > 0) {
      // Untested setup lines are already covered by the standard preconditions.
      if (stages.some((stage) => stage >= earliestTested)) testStatements.push(statement)
    } else if (isPrecondition(statement)) {
      if (isSetupUnderTest(statement, testText)) {
        testStatements.push(statement)
        setupUnderTest.push(statement)
      } else {
        explicit.push(statement)
      }
    } else {
      testStatements.push(statement)
    }
  }

  const inferred = scenarioPreconditions(
    [title, ...testStatements].join(' '),
    testedStages,
    setupUnderTest.join(' '),
  )
  // Standard environment first, then test-specific setup, so preconditions read in dependency order.
  const preconditions = [...new Set([...standard, ...explicit, ...inferred])]
  return { preconditions, testStatements }
}

// Placeholder generator until the backend generation endpoint is wired up.
export async function generateArtifact(kind, input) {
  if (!GENERATION_KINDS.includes(kind)) {
    throw new Error(`Unsupported generation kind: ${kind}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 700))

  const lines = seedLines(input)
  const subject = input.title?.trim() || 'the feature'
  const criteria = lines.length ? lines : [subject]

  if (kind === 'steps') {
    const { preconditions, testStatements } = classifyRequirement(input.description, input.title)
    const stepLines = testStatements.length ? testStatements : [subject]
    return {
      preconditions: preconditions.map((text, index) => ({
        id: `PRE-${index + 1}`,
        text,
        expected: preconditionExpectedResult(text),
      })),
      steps: [
        {
          action: `Open the ${subject} screen as an authenticated user.`,
          expected: 'The screen loads without errors.',
        },
        ...stepLines.slice(0, 4).map((line) => ({
          action: `Perform the action described by: ${line}`,
          expected: `The system behaves as described: ${line}`,
        })),
        {
          action: 'Submit and confirm the transaction.',
          expected: 'A success confirmation is displayed and persisted.',
        },
      ],
      testData: [
        { field: 'User role', value: 'Standard user', type: 'Valid' },
        { field: 'Locale', value: 'en-US', type: 'Valid' },
        { field: 'Payload size', value: '256 KB', type: 'Boundary' },
        { field: 'Session token', value: 'Expired token', type: 'Invalid' },
      ],
    }
  }

  if (kind === 'expectedResults') {
    return criteria.slice(0, 6).map((line, index) => ({
      id: `ER-${index + 1}`,
      text: `System behaviour is observable and verifiable for: ${line}`,
    }))
  }

  if (kind === 'negativeScenarios') {
    return [
      { type: 'Negative', text: `Submit ${subject} with all required fields empty.` },
      { type: 'Negative', text: `Submit ${subject} while the session token is expired.` },
      { type: 'Negative', text: `Trigger ${subject} without the required permission.` },
      { type: 'Negative', text: `Interrupt ${subject} with a downstream service timeout.` },
    ]
  }

  return [
    { type: 'Edge case', text: `Run ${subject} at the maximum supported input length.` },
    { type: 'Edge case', text: `Run ${subject} concurrently from two sessions for the same record.` },
    { type: 'Edge case', text: `Run ${subject} across a daylight-saving time boundary.` },
  ]
}

// Placeholder analyzer until the backend BRD parsing endpoint is wired up.
export async function analyzeBrd(file) {
  await new Promise((resolve) => setTimeout(resolve, 1200))

  const source = file.name.replace(/\.(pdf|docx)$/i, '')

  return {
    summary: {
      requirements: 42,
      testCases: 6,
      scenarios: 26,
      coveragePercent: 76,
    },
    testCases: [
      { id: 'TC-G-001', title: `${source}: successful end-to-end submission`, description: 'Verify that a valid request completes successfully from submission through approval.', requirement: 'REQ-01', priority: 'High' },
      { id: 'TC-G-002', title: `${source}: validation blocks incomplete submission`, description: 'Verify that incomplete required information prevents the request from being submitted.', requirement: 'REQ-02', priority: 'High' },
      { id: 'TC-G-003', title: `${source}: audit entry recorded on approval`, description: 'Verify that approving the request creates a complete audit record.', requirement: 'REQ-05', priority: 'Medium' },
      { id: 'TC-G-004', title: `${source}: notification sent to the approver`, description: 'Verify that the assigned approver receives a notification for the request.', requirement: 'REQ-07', priority: 'Medium' },
      { id: 'TC-G-005', title: `${source}: role without permission is rejected`, description: 'Verify that a user without the required permission cannot complete the action.', requirement: 'REQ-09', priority: 'High' },
      { id: 'TC-G-006', title: `${source}: export reflects the latest state`, description: 'Verify that the exported data contains the latest saved request state.', requirement: 'REQ-12', priority: 'Low' },
    ],
    scenarios: [
      { type: 'Happy path', text: 'Approver completes the workflow within the SLA window.' },
      { type: 'Alternate', text: 'Submission is returned for rework and resubmitted.' },
      { type: 'Negative', text: 'Downstream service is unavailable during approval.' },
      { type: 'Edge case', text: 'Two approvers act on the same record concurrently.' },
      { type: 'Negative', text: 'Session expires mid-submission and data is preserved.' },
    ],
    coverageMatrix: [
      { requirement: 'REQ-01', description: 'Submit request', cases: 8, status: 'Covered' },
      { requirement: 'REQ-02', description: 'Field validation', cases: 6, status: 'Covered' },
      { requirement: 'REQ-05', description: 'Audit trail', cases: 3, status: 'Partial' },
      { requirement: 'REQ-07', description: 'Approver notification', cases: 4, status: 'Covered' },
      { requirement: 'REQ-09', description: 'Permission enforcement', cases: 2, status: 'Partial' },
      { requirement: 'REQ-12', description: 'Data export', cases: 0, status: 'Not covered' },
      { requirement: 'REQ-15', description: 'Retention policy', cases: 0, status: 'Not covered' },
    ],
    missingRequirements: [
      { requirement: 'REQ-12', description: 'Data export format is described but never exercised.', impact: 'High' },
      { requirement: 'REQ-15', description: 'Retention policy has no verification steps.', impact: 'High' },
      { requirement: 'REQ-18', description: 'Accessibility acceptance criteria are unmapped.', impact: 'Medium' },
    ],
  }
}

export async function generateTestCases(requirementText) {
  if (!requirementText?.trim()) {
    return ['Please provide requirement text to generate test cases.']
  }

  return [
    `Validate happy path for: ${requirementText}`,
    `Validate error handling for: ${requirementText}`,
    `Validate edge conditions for: ${requirementText}`,
  ]
}
