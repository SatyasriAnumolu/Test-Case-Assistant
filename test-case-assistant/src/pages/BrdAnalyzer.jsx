import { useRef, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Field,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  ProgressBar,
  Spinner,
  Subtitle2,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
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
  ArrowUploadRegular,
  CloudArrowUpRegular,
  DismissRegular,
  DocumentPdfRegular,
  DocumentRegular,
  SparkleRegular,
} from '@fluentui/react-icons'
import { analyzeBrd } from '../services/openaiService'
import { publishTestCasesToAdo } from '../services/apiService'
import { useAdoConnection } from '../context/AdoConnectionContext'

const ACCEPTED_EXTENSIONS = ['.pdf', '.docx']
const MAX_FILE_BYTES = 25 * 1024 * 1024

const priorityColor = { High: 'danger', Medium: 'warning', Low: 'informative' }
const coverageColor = { Covered: 'success', Partial: 'warning', 'Not covered': 'danger' }
const scenarioColor = {
  'Happy path': 'success',
  Alternate: 'brand',
  Negative: 'danger',
  'Edge case': 'warning',
}

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1320px',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  layout: {
    display: 'grid',
    gridTemplateColumns: 'minmax(300px, 0.72fr) minmax(440px, 1.28fr)',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalL,
    alignItems: 'start',
    '@media (max-width: 1100px)': {
      gridTemplateColumns: '1fr',
    },
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalXXL,
    border: `${tokens.strokeWidthThick} dashed ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusLarge,
    backgroundColor: tokens.colorNeutralBackground2,
    textAlign: 'center',
    cursor: 'pointer',
    transitionProperty: 'background-color, border-color',
    transitionDuration: tokens.durationNormal,
    transitionTimingFunction: tokens.curveEasyEase,
    ':hover': {
      borderColor: tokens.colorBrandStroke1,
      backgroundColor: tokens.colorNeutralBackground3,
    },
  },
  dropzoneActive: {
    borderColor: tokens.colorBrandStroke1,
    backgroundColor: tokens.colorBrandBackground2,
  },
  dropIcon: {
    fontSize: '32px',
    color: tokens.colorBrandForeground1,
  },
  filePreview: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  fileText: {
    display: 'flex',
    flexDirection: 'column',
    minWidth: 0,
    flexGrow: 1,
  },
  fileName: {
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    fontWeight: tokens.fontWeightSemibold,
  },
  hiddenInput: {
    display: 'none',
  },
  resultsActions: {
    display: 'flex',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
    columnGap: tokens.spacingHorizontalM,
    rowGap: tokens.spacingVerticalM,
  },
  summaryValue: {
    fontSize: tokens.fontSizeBase500,
    fontWeight: tokens.fontWeightSemibold,
    lineHeight: tokens.lineHeightBase500,
  },
  tabBody: {
    minHeight: '260px',
    paddingTop: tokens.spacingVerticalM,
  },
  generatedEditor: {
    width: '100%',
    minHeight: '64px',
  },
  generatedId: {
    whiteSpace: 'nowrap',
    fontFamily: tokens.fontFamilyMonospace,
    color: tokens.colorNeutralForeground2,
  },
  generatedCaseList: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  generatedCase: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
    padding: tokens.spacingVerticalM,
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  generatedCaseHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: tokens.spacingHorizontalM,
  },
  generatedCaseMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: tokens.spacingHorizontalS,
    flexWrap: 'wrap',
  },
  itemList: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalS,
  },
  item: {
    display: 'flex',
    alignItems: 'flex-start',
    columnGap: tokens.spacingHorizontalM,
    padding: tokens.spacingVerticalS,
    borderRadius: tokens.borderRadiusMedium,
    backgroundColor: tokens.colorNeutralBackground2,
  },
  itemBody: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXXS,
    minWidth: 0,
  },
  muted: {
    color: tokens.colorNeutralForeground3,
  },
})

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function downloadResults(fileName, analysis) {
  const blob = new Blob([JSON.stringify(analysis, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.click()
  URL.revokeObjectURL(url)
}

function isSupported(file) {
  return ACCEPTED_EXTENSIONS.some((extension) => file.name.toLowerCase().endsWith(extension))
}

function BrdAnalyzer({ initialTab = 'testCases' }) {
  const styles = useStyles()
  const { connected, form: adoForm } = useAdoConnection()
  const inputRef = useRef(null)
  const [file, setFile] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysis, setAnalysis] = useState(null)
  const [selectedTab, setSelectedTab] = useState(initialTab)
  const [publishing, setPublishing] = useState(false)
  const [message, setMessage] = useState(null)

  const acceptFile = (candidate) => {
    if (!candidate) return

    if (!isSupported(candidate)) {
      setMessage({
        intent: 'error',
        title: 'Unsupported file type',
        text: 'Upload a PDF or DOCX document.',
      })
      return
    }

    if (candidate.size > MAX_FILE_BYTES) {
      setMessage({
        intent: 'error',
        title: 'File too large',
        text: 'The maximum supported document size is 25 MB.',
      })
      return
    }

    setFile(candidate)
    setAnalysis(null)
    setMessage(null)
  }

  const handleDrop = (event) => {
    event.preventDefault()
    setDragging(false)
    acceptFile(event.dataTransfer.files?.[0])
  }

  const handleAnalyze = async () => {
    if (!file) return
    setAnalyzing(true)
    setMessage(null)

    try {
      const result = await analyzeBrd(file)
      setAnalysis(result)
      setSelectedTab(initialTab)
      setMessage({
        intent: 'success',
        title: 'Analysis complete',
        text: `${result.summary.testCases} test cases generated from ${result.summary.requirements} requirements.`,
      })
    } catch (error) {
      setMessage({
        intent: 'error',
        title: 'Analysis failed',
        text: error.message || 'The document could not be analysed.',
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const updateGeneratedTestCase = (id, field) => (_event, data) => {
    setAnalysis((current) =>
      current
        ? {
            ...current,
            testCases: current.testCases.map((item) =>
              item.id === id ? { ...item, [field]: data.value } : item,
            ),
          }
        : current,
    )
  }

  const clearFile = () => {
    setFile(null)
    setAnalysis(null)
    setMessage(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const handleExportResults = () => {
    if (!analysis) return
    const baseName = file?.name.replace(/\.(pdf|docx)$/i, '') || 'test-case-analysis'
    downloadResults(`${baseName}-results.json`, analysis)
    setMessage({
      intent: 'success',
      title: 'Results exported',
      text: 'Generated test cases, scenarios, coverage, and gap analysis were saved as JSON.',
    })
  }

  const handlePublishToAdo = async () => {
    if (!analysis?.testCases?.length) return

    if (!connected) {
      setMessage({
        intent: 'warning',
        title: 'Connect to Azure DevOps first',
        text: 'Configure the Azure DevOps connection on the ADO Connection page, then Test Connection.',
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
        testCases: analysis.testCases.map((item) => ({
          title: item.title,
          description: item.description,
          priority: item.priority,
        })),
      })

      setMessage({
        intent: result.createdCount > 0 ? (result.failedCount > 0 ? 'warning' : 'success') : 'error',
        title: result.createdCount > 0 ? 'Published to Azure DevOps' : 'Publish failed',
        text: result.message || `${result.createdCount} test case(s) published to ${adoForm.project}.`,
      })
    } catch (error) {
      setMessage({
        intent: 'error',
        title: 'Publish failed',
        text: error.message || 'The test cases could not be published to Azure DevOps.',
      })
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Title3>Test Case Generator</Title3>
        <Body1 className={styles.muted}>
          Upload a test design, functional, or business requirements document to generate test
          cases, scenarios, and a coverage matrix.
        </Body1>
      </div>

      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.layout}>
        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Upload document</Subtitle2>}
            description={
              <Caption1 className={styles.muted}>
                Test design, functional, or requirements document as PDF or DOCX, up to 25 MB.
              </Caption1>
            }
          />

          <div
            className={mergeClasses(styles.dropzone, dragging && styles.dropzoneActive)}
            role="button"
            tabIndex={0}
            onClick={() => inputRef.current?.click()}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click()
            }}
            onDragOver={(event) => {
              event.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
          >
            <ArrowUploadRegular className={styles.dropIcon} />
            <Body1>Drop your document here or click to browse</Body1>
            <Caption1 className={styles.muted}>Accepted formats: .pdf, .docx</Caption1>
          </div>

          <input
            ref={inputRef}
            className={styles.hiddenInput}
            type="file"
            accept={ACCEPTED_EXTENSIONS.join(',')}
            onChange={(event) => acceptFile(event.target.files?.[0])}
          />

          {file && (
            <div className={styles.filePreview}>
              {file.name.toLowerCase().endsWith('.pdf') ? (
                <DocumentPdfRegular fontSize={24} />
              ) : (
                <DocumentRegular fontSize={24} />
              )}
              <span className={styles.fileText}>
                <span className={styles.fileName}>{file.name}</span>
                <Caption1 className={styles.muted}>{formatSize(file.size)}</Caption1>
              </span>
              <Button
                appearance="subtle"
                icon={<DismissRegular />}
                aria-label="Remove file"
                disabled={analyzing}
                onClick={clearFile}
              />
            </div>
          )}

          {analyzing && <ProgressBar thickness="large" />}

          <Divider />

          <Button
            appearance="primary"
            icon={analyzing ? <Spinner size="tiny" /> : <SparkleRegular />}
            disabled={!file || analyzing}
            onClick={handleAnalyze}
          >
            {analyzing ? 'Analysing…' : 'Generate Test Cases'}
          </Button>
        </Card>

        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Analysis results</Subtitle2>}
            description={
              <Caption1 className={styles.muted}>
                {analysis ? `Derived from ${file?.name}` : 'Upload and analyse a document to begin.'}
              </Caption1>
            }
          />

          {analysis && (
            <div className={styles.resultsActions}>
              <Button
                appearance="primary"
                icon={publishing ? <Spinner size="tiny" /> : <CloudArrowUpRegular />}
                disabled={publishing}
                onClick={handlePublishToAdo}
              >
                {publishing ? 'Publishing…' : 'Publish to ADO'}
              </Button>
              <Button
                appearance="secondary"
                icon={<ArrowDownloadRegular />}
                onClick={handleExportResults}
              >
                Export Results
              </Button>
            </div>
          )}

          {!analysis ? (
            <Body1 className={styles.muted}>No analysis yet.</Body1>
          ) : (
            <>
              <div className={styles.summaryGrid}>
                <div>
                  <Caption1 className={styles.muted}>Requirements</Caption1>
                  <div className={styles.summaryValue}>{analysis.summary.requirements}</div>
                </div>
                <div>
                  <Caption1 className={styles.muted}>Test cases</Caption1>
                  <div className={styles.summaryValue}>{analysis.summary.testCases}</div>
                </div>
                <div>
                  <Caption1 className={styles.muted}>Scenarios</Caption1>
                  <div className={styles.summaryValue}>{analysis.summary.scenarios}</div>
                </div>
                <div>
                  <Caption1 className={styles.muted}>Coverage</Caption1>
                  <div className={styles.summaryValue}>{analysis.summary.coveragePercent}%</div>
                </div>
              </div>

              <Divider />

              <TabList
                selectedValue={selectedTab}
                onTabSelect={(_event, data) => setSelectedTab(data.value)}
              >
                <Tab value="testCases">Generated Test Cases</Tab>
                <Tab value="scenarios">Generated Scenarios</Tab>
                <Tab value="coverage">Coverage Matrix</Tab>
                <Tab value="missing">Gap Analysis</Tab>
              </TabList>

              <div className={styles.tabBody}>
                {selectedTab === 'testCases' && (
                  <div className={styles.generatedCaseList} aria-label="Generated test cases">
                    {analysis.testCases.map((item) => (
                      <div key={item.id} className={styles.generatedCase}>
                        <div className={styles.generatedCaseHeader}>
                          <span className={styles.generatedId}>{item.id}</span>
                          <div className={styles.generatedCaseMeta}>
                            <Caption1 className={styles.muted}>{item.requirement}</Caption1>
                            <Badge appearance="tint" color={priorityColor[item.priority]}>
                              {item.priority}
                            </Badge>
                          </div>
                        </div>
                        <Field label="Test case title">
                          <Textarea
                            className={styles.generatedEditor}
                            value={item.title}
                            resize="vertical"
                            aria-label={`${item.id} test case title`}
                            onChange={updateGeneratedTestCase(item.id, 'title')}
                          />
                        </Field>
                        <Field label="Description">
                          <Textarea
                            className={styles.generatedEditor}
                            value={item.description ?? ''}
                            resize="vertical"
                            aria-label={`${item.id} test case description`}
                            onChange={updateGeneratedTestCase(item.id, 'description')}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'scenarios' && (
                  <div className={styles.itemList}>
                    {analysis.scenarios.map((item) => (
                      <div key={item.text} className={styles.item}>
                        <Badge appearance="tint" color={scenarioColor[item.type] ?? 'informative'}>
                          {item.type}
                        </Badge>
                        <Body1>{item.text}</Body1>
                      </div>
                    ))}
                  </div>
                )}

                {selectedTab === 'coverage' && (
                  <Table size="small" aria-label="Coverage matrix">
                    <TableHeader>
                      <TableRow>
                        <TableHeaderCell>Requirement</TableHeaderCell>
                        <TableHeaderCell>Description</TableHeaderCell>
                        <TableHeaderCell>Linked cases</TableHeaderCell>
                        <TableHeaderCell>Status</TableHeaderCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {analysis.coverageMatrix.map((row) => (
                        <TableRow key={row.requirement}>
                          <TableCell>{row.requirement}</TableCell>
                          <TableCell>
                            <TableCellLayout truncate={false}>{row.description}</TableCellLayout>
                          </TableCell>
                          <TableCell>{row.cases}</TableCell>
                          <TableCell>
                            <Badge appearance="tint" color={coverageColor[row.status]}>
                              {row.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}

                {selectedTab === 'missing' && (
                  <div className={styles.itemList}>
                    {analysis.missingRequirements.map((item) => (
                      <div key={item.requirement} className={styles.item}>
                        <Badge appearance="tint" color={priorityColor[item.impact]}>
                          {item.impact}
                        </Badge>
                        <div className={styles.itemBody}>
                          <Body1>{item.description}</Body1>
                          <Caption1 className={styles.muted}>{item.requirement}</Caption1>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}

export default BrdAnalyzer
