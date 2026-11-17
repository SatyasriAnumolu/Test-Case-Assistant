import { useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Textarea,
  Title3,
  makeStyles,
  mergeClasses,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowDownloadRegular,
  ArrowSyncRegular,
  ChevronRightRegular,
  ClipboardTaskListLtrRegular,
  CloudArrowUpRegular,
  CloudSyncRegular,
  EyeRegular,
  ListBarRegular,
  SparkleRegular,
} from '@fluentui/react-icons'
import { generateArtifact } from '../services/openaiService'
import { publishTestCasesToAdo } from '../services/apiService'
import { useAdoConnection } from '../context/AdoConnectionContext'
import { mapPreconditionResults } from '../utils/preconditionMapping'

const emptyForm = { title: '', description: '' }
// Negative scenarios and test data are still generated and exported, but not displayed.
const emptyOutput = { preconditions: [], steps: [], scenarios: [], testData: [] }

const workflowSteps = [
  { label: 'Import', icon: CloudSyncRegular },
  { label: 'Generate', icon: SparkleRegular },
  { label: 'Review', icon: EyeRegular },
  { label: 'Publish', icon: CloudArrowUpRegular },
]

const assetTypes = [
  { key: 'preconditions', label: 'Preconditions' },
  { key: 'steps', label: 'Test Steps' },
]

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    width: '100%',
    minWidth: 0,
    containerType: 'inline-size',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  titleRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
  },
  titleIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '44px',
    height: '44px',
    flexShrink: 0,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontSize: '24px',
  },
  pageTitle: {
    margin: 0,
  },
  workflow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    listStyleType: 'none',
    margin: 0,
    padding: tokens.spacingVerticalS,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  workflowStep: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: 0,
    padding: `${tokens.spacingVerticalS} ${tokens.spacingHorizontalM}`,
    color: tokens.colorNeutralForeground2,
    fontSize: tokens.fontSizeBase300,
    '@container (max-width: 600px)': {
      padding: tokens.spacingVerticalXS,
      fontSize: tokens.fontSizeBase200,
    },
  },
  workflowLabel: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
    '@container (max-width: 600px)': {
      flexDirection: 'column',
      rowGap: tokens.spacingVerticalXS,
    },
  },
  currentStep: {
    color: tokens.colorBrandForeground1,
    fontWeight: tokens.fontWeightSemibold,
  },
  workflowIcon: {
    display: 'inline-flex',
    fontSize: '20px',
  },
  workflowArrow: {
    display: 'inline-flex',
    color: tokens.colorNeutralForeground4,
    fontSize: '16px',
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(260px, 3fr) minmax(0, 7fr)',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'start',
    minWidth: 0,
    '@container (max-width: 900px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    minWidth: 0,
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalL,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusXLarge,
    boxShadow: tokens.shadow4,
    '@container (max-width: 600px)': {
      padding: tokens.spacingVerticalM,
    },
  },
  cardTitle: {
    margin: 0,
  },
  outputCard: {
    alignSelf: 'stretch',
    rowGap: tokens.spacingVerticalM,
  },
  cardIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorBrandBackground2,
    color: tokens.colorBrandForeground2,
    fontSize: '20px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
  },
  descriptionInput: {
    minHeight: '180px',
  },
  actionGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  generationButton: {
    minHeight: '40px',
    whiteSpace: 'normal',
  },
  outputHead: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalS,
  },
  outputHeading: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  toolbar: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    marginInlineStart: 'auto',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  tabs: {
    display: 'flex',
    flexWrap: 'wrap',
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  tabLabel: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalS,
  },
  tabBody: {
    flexGrow: 1,
    minWidth: 0,
    minHeight: '300px',
    ':focus-visible': {
      outline: `${tokens.strokeWidthThick} solid ${tokens.colorStrokeFocus2}`,
      outlineOffset: '2px',
    },
  },
  resultsTable: {
    width: '100%',
    tableLayout: 'fixed',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  tableRow: {
    ':hover': {
      backgroundColor: tokens.colorNeutralBackground2Hover,
    },
  },
  tableCell: {
    padding: `${tokens.spacingVerticalM} ${tokens.spacingHorizontalS}`,
    verticalAlign: 'top',
    alignItems: 'flex-start',
    minWidth: 0,
    whiteSpace: 'normal',
    overflowWrap: 'anywhere',
    lineHeight: tokens.lineHeightBase300,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
  stepNumberColumn: {
    width: '56px',
  },
  stepNumber: {
    paddingTop: tokens.spacingVerticalL,
    color: tokens.colorNeutralForeground3,
    fontVariantNumeric: 'tabular-nums',
  },
  stepEditor: {
    width: '100%',
    minWidth: 0,
    backgroundColor: tokens.colorNeutralBackground1,
  },
  stepEditorInput: {
    fieldSizing: 'content',
    minWidth: 0,
    minHeight: '64px',
    maxHeight: 'none',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere',
    lineHeight: tokens.lineHeightBase300,
  },
  emptyStateContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '300px',
    padding: tokens.spacingVerticalL,
    textAlign: 'center',
  },
  emptyStateIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: tokens.borderRadiusXLarge,
    backgroundColor: tokens.colorBrandBackground2,
    fontSize: '32px',
    color: tokens.colorBrandForeground2,
    marginBottom: tokens.spacingVerticalM,
  },
  emptyStateText: {
    color: tokens.colorNeutralForeground3,
    maxWidth: '300px',
  },
})

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function AiGenerator() {
  const styles = useStyles()
  const { connected, form: adoForm } = useAdoConnection()
  const [form, setForm] = useState(emptyForm)
  const [output, setOutput] = useState(emptyOutput)
  const preconditions = mapPreconditionResults(output.preconditions)
  const tabCounts = {
    preconditions: preconditions.length,
    steps: output.steps.length,
  }
  const [selectedTab, setSelectedTab] = useState('steps')
  const [busyKind, setBusyKind] = useState(null)
  const [publishing, setPublishing] = useState(false)
  const [lastKind, setLastKind] = useState(null)
  const [message, setMessage] = useState(null)
  const [targetId, setTargetId] = useState('')
  const targetIdInvalid = targetId !== '' && !/^[1-9]\d*$/.test(targetId)
  const targetWorkItemId = targetIdInvalid || targetId === '' ? null : Number(targetId)

  const updateField = (key) => (event) =>
    setForm((current) => ({ ...current, [key]: event.target.value }))

  const updatePrecondition = (id, key) => (_event, data) => {
    setOutput((current) => ({
      ...current,
      preconditions: mapPreconditionResults(current.preconditions).map((item) =>
        item.id === id ? { ...item, [key]: data.value } : item,
      ),
    }))
  }

  const updateStep = (index, key) => (_event, data) => {
    setOutput((current) => ({
      ...current,
      steps: current.steps.map((step, stepIndex) =>
        stepIndex === index ? { ...step, [key]: data.value } : step,
      ),
    }))
  }

  const inputMissing = !form.title.trim() || !form.description.trim()
  const hasOutput = useMemo(
    () => Object.values(output).some((collection) => collection.length > 0),
    [output],
  )

  // One click produces every asset: preconditions, steps (each with its expected result),
  // negative scenarios and test data.
  const runGeneration = async () => {
    setBusyKind('all')
    setMessage(null)

    try {
      const [stepsResult, scenarios] = await Promise.all([
        generateArtifact('steps', form),
        generateArtifact('negativeScenarios', form),
      ])

      setOutput({
        preconditions: mapPreconditionResults(
          stepsResult.preconditions ?? [],
          stepsResult.preconditionExpectedResults,
        ),
        steps: stepsResult.steps,
        testData: stepsResult.testData,
        scenarios,
      })
      setSelectedTab('steps')
      setLastKind('all')
    } catch (error) {
      setMessage({
        intent: 'error',
        title: 'Generation failed',
        text: error.message || 'The generator could not complete the request.',
      })
    } finally {
      setBusyKind(null)
    }
  }

  const handleSaveToAdo = async () => {
    if (!connected) {
      setMessage({
        intent: 'warning',
        title: 'Connect to Azure DevOps first',
        text: 'Configure the Azure DevOps connection on the ADO Connection page, then Test Connection.',
      })
      return
    }

    if (output.steps.length === 0) {
      setMessage({
        intent: 'warning',
        title: 'No steps to publish',
        text: 'Run Generate Test Assets before publishing this test case to Azure DevOps.',
      })
      return
    }

    setPublishing(true)
    setMessage(null)

    try {
      const result = await publishTestCasesToAdo({
        organization: adoForm.organization,
        project: adoForm.project,
        pat: adoForm.pat,
        testCases: [
          {
            title: form.title.trim(),
            description: form.description.trim(),
            // Preconditions are published as the leading rows of the ADO Steps grid.
            steps: [
              ...preconditions.map((item) => ({ action: item.text ?? '', expected: item.expected ?? '' })),
              ...output.steps.map((step) => ({ action: step.action, expected: step.expected })),
            ],
            ...(targetWorkItemId ? { workItemId: targetWorkItemId } : {}),
          },
        ],
      })

      const created = result.results?.[0]
      const succeeded = Boolean(created?.success && created.workItemId)
      const stepsMissing = Boolean(succeeded && created.error)
      const verb = created?.updated ? 'updated' : 'created as'
      setMessage({
        intent: succeeded ? (stepsMissing ? 'warning' : 'success') : 'error',
        title: succeeded
          ? created.updated ? 'Updated in Azure DevOps' : 'Published to Azure DevOps'
          : 'Publish failed',
        text: succeeded
          ? `Test case ${verb} work item #${created.workItemId} in ${adoForm.project} with ${created.stepCount ?? 0} test step(s).${stepsMissing ? ` ${created.error}` : ''}`
          : created?.error || result.message || 'Azure DevOps did not confirm the test case was saved.',
      })
    } catch (error) {
      setMessage({
        intent: 'error',
        title: 'Publish failed',
        text: error.message || 'The test case could not be published to Azure DevOps.',
      })
    } finally {
      setPublishing(false)
    }
  }

  const handleExport = () => {
    const slug = form.title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'test-case'
    // Export format is unchanged: it still lists each step's expected result separately.
    const expectedResults = output.steps.map((step, index) => ({ id: `ER-${index + 1}`, text: step.expected }))
    downloadJson(`${slug}.json`, { ...form, ...output, preconditions, expectedResults })
    setMessage({ intent: 'success', title: 'Exported', text: `Saved ${slug}.json to your downloads.` })
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <div className={styles.titleRow}>
          <span className={styles.titleIcon} aria-hidden="true"><SparkleRegular /></span>
          <div className={styles.outputHeading}>
            <Title3 as="h1" className={styles.pageTitle}>AI Test Case Assistant</Title3>
            <Body1 className={styles.muted}>
              Generate complete test cases from requirements using AI.
            </Body1>
          </div>
        </div>
      </div>

      <ol className={styles.workflow} aria-label="Test case workflow">
        {workflowSteps.map(({ label, icon: Icon }, index) => (
          <li
            key={label}
            className={styles.workflowStep}
            aria-current={label === 'Generate' ? 'step' : undefined}
          >
            <span className={label === 'Generate' ? styles.currentStep : undefined}>
              <span className={styles.workflowLabel}>
                <span className={styles.workflowIcon} aria-hidden="true"><Icon /></span>
                {label}
              </span>
            </span>
            {index < workflowSteps.length - 1 && (
              <span className={styles.workflowArrow} aria-hidden="true"><ChevronRightRegular /></span>
            )}
          </li>
        ))}
      </ol>

      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.layout}>
        <Card className={styles.card} aria-label="Requirement input">
          <CardHeader
            image={<span className={styles.cardIcon} aria-hidden="true"><ListBarRegular /></span>}
            header={<Subtitle2 as="h2" className={styles.cardTitle}>Requirement Input</Subtitle2>}
          />

          <div className={styles.form}>
            <Field label="Test case title" required>
              <Input
                value={form.title}
                onChange={updateField('title')}
              />
            </Field>

            <Field
              label="Description"
              required
            >
              <Textarea
                className={styles.descriptionInput}
                value={form.description}
                onChange={updateField('description')}
                resize="vertical"
                rows={8}
              />
            </Field>

            <Field
              label="Existing Test Case ID"
              hint="Optional. Enter an Azure DevOps Test Case ID to update it instead of creating a new test case."
              validationState={targetIdInvalid ? 'error' : 'none'}
              validationMessage={targetIdInvalid ? 'Enter a numeric work item ID.' : undefined}
            >
              <Input
                value={targetId}
                inputMode="numeric"
                placeholder="e.g. 1571234"
                onChange={(_event, data) => setTargetId(data.value.trim())}
              />
            </Field>
          </div>

          <Divider />

          <div className={styles.actionGrid}>
            <Button
              className={styles.generationButton}
              appearance="primary"
              icon={busyKind ? <Spinner size="tiny" /> : <SparkleRegular />}
              disabled={inputMissing || busyKind !== null}
              onClick={runGeneration}
            >
              {busyKind ? 'Generating…' : 'Generate Test Assets'}
            </Button>
          </div>
        </Card>

        <Card className={mergeClasses(styles.card, styles.outputCard)} aria-label="Generated output">
          <div className={styles.outputHead}>
            <div className={styles.outputHeading}>
              <Subtitle2 as="h2" className={styles.cardTitle}>Generated Output</Subtitle2>
              <Caption1 className={styles.muted} aria-live="polite">
                {hasOutput ? 'Review and refine before publishing.' : 'Nothing generated yet.'}
              </Caption1>
            </div>
            <div className={styles.toolbar}>
              <Button
                appearance="primary"
                icon={publishing ? <Spinner size="tiny" /> : <CloudArrowUpRegular />}
                disabled={!hasOutput || publishing || targetIdInvalid}
                onClick={handleSaveToAdo}
              >
                {publishing ? 'Publishing…' : targetWorkItemId ? 'Update in ADO' : 'Save to ADO'}
              </Button>
              <Button icon={<ArrowDownloadRegular />} disabled={!hasOutput} onClick={handleExport}>
                Export
              </Button>
              <Button
                icon={busyKind ? <Spinner size="tiny" /> : <ArrowSyncRegular />}
                disabled={!lastKind || busyKind !== null}
                onClick={runGeneration}
              >
                Regenerate
              </Button>
            </div>
          </div>

          <TabList
            className={styles.tabs}
            aria-label="Generated asset type"
            selectedValue={selectedTab}
            onTabSelect={(_event, data) => setSelectedTab(data.value)}
          >
            {assetTypes.map(({ key, label }) => (
              <Tab
                key={key}
                id={`ai-generator-tab-${key}`}
                value={key}
                aria-controls={selectedTab === key ? `ai-generator-panel-${key}` : undefined}
                aria-label={`${label} (${tabCounts[key]})`}
              >
                <span className={styles.tabLabel}>
                  {label}
                  <Badge appearance="tint" color={selectedTab === key ? 'brand' : 'informative'} size="small" aria-hidden="true">
                    {tabCounts[key]}
                  </Badge>
                </span>
              </Tab>
            ))}
          </TabList>

          <div
            id={`ai-generator-panel-${selectedTab}`}
            className={styles.tabBody}
            role="tabpanel"
            aria-labelledby={`ai-generator-tab-${selectedTab}`}
            aria-busy={busyKind !== null}
            tabIndex={0}
          >
            {selectedTab === 'preconditions' &&
              (preconditions.length === 0 ? (
                <EmptyState
                  icon={<ClipboardTaskListLtrRegular />}
                  text={
                    hasOutput
                      ? 'No installation, configuration, creation or deployment prerequisites were found.'
                      : 'Run Generate Test Assets to populate this tab.'
                  }
                />
              ) : (
                <Table className={styles.resultsTable} size="medium" aria-label="Test case preconditions">
                  <TableHeader className={styles.tableHeader}>
                    <TableRow>
                      <TableHeaderCell className={styles.stepNumberColumn}>Step</TableHeaderCell>
                      <TableHeaderCell>Action</TableHeaderCell>
                      <TableHeaderCell>Expected Result</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preconditions.map((item, index) => (
                      <TableRow key={item.id} className={styles.tableRow}>
                        <TableCell className={mergeClasses(styles.tableCell, styles.stepNumberColumn, styles.stepNumber)}>
                          {index + 1}
                        </TableCell>
                        {[
                          { key: 'text', label: 'action' },
                          { key: 'expected', label: 'expected result' },
                        ].map(({ key, label }) => (
                          <TableCell key={key} className={styles.tableCell}>
                            <Textarea
                              className={styles.stepEditor}
                              textarea={{ className: styles.stepEditorInput }}
                              value={item[key] ?? ''}
                              resize="vertical"
                              aria-label={`Precondition ${index + 1} ${label}`}
                              onChange={updatePrecondition(item.id, key)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ))}

            {selectedTab === 'steps' &&
              (output.steps.length === 0 ? (
                <EmptyState icon={<ListBarRegular />} text="Run Generate Test Assets to populate this tab." />
              ) : (
                <Table className={styles.resultsTable} size="medium" aria-label="Generated test steps">
                  <TableHeader className={styles.tableHeader}>
                    <TableRow>
                      <TableHeaderCell className={styles.stepNumberColumn}>Step</TableHeaderCell>
                      <TableHeaderCell>Action</TableHeaderCell>
                      <TableHeaderCell>Expected Result</TableHeaderCell>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {output.steps.map((step, index) => (
                      <TableRow key={index} className={styles.tableRow}>
                        <TableCell className={mergeClasses(styles.tableCell, styles.stepNumberColumn, styles.stepNumber)}>
                          {index + 1}
                        </TableCell>
                        {[
                          { key: 'action', label: 'action' },
                          { key: 'expected', label: 'expected result' },
                        ].map(({ key, label }) => (
                          <TableCell key={key} className={styles.tableCell}>
                            <Textarea
                              className={styles.stepEditor}
                              textarea={{ className: styles.stepEditorInput }}
                              value={step[key]}
                              resize="vertical"
                              aria-label={`Step ${index + 1} ${label}`}
                              onChange={updateStep(index, key)}
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ))}
          </div>
        </Card>
      </div>
    </div>
  )
}

function EmptyState({ icon, text }) {
  const styles = useStyles()
  return (
    <div className={styles.emptyStateContainer}>
      <div className={styles.emptyStateIcon}>{icon}</div>
      <Body1 className={styles.emptyStateText}>{text}</Body1>
    </div>
  )
}

export default AiGenerator
