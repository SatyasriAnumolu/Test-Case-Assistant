import { useMemo, useState } from 'react'
import {
  Badge,
  Body1,
  Button,
  Caption1,
  Card,
  CardHeader,
  Link,
  SearchBox,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import { BotRegular, DocumentBulletListRegular, OpenRegular } from '@fluentui/react-icons'
import KpiCard, { KpiGrid } from '../components/common/KpiCard'
import { useAdoConnection } from '../context/AdoConnectionContext'

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1280px',
  },
  intro: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalXS,
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  toolbar: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: tokens.spacingHorizontalS,
    rowGap: tokens.spacingVerticalS,
  },
  search: {
    flexGrow: 1,
    minWidth: '220px',
  },
  muted: { color: tokens.colorNeutralForeground3 },
  titleLink: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalXS,
  },
  linkIcon: {
    flexShrink: 0,
    fontSize: '14px',
    opacity: 0.7,
  },
})

function MissingSteps({ onNavigate }) {
  const styles = useStyles()
  const { syncedTestCases, form } = useAdoConnection()
  const [search, setSearch] = useState('')

  const organization = form.organization.trim()
  const project = form.project.trim()
  const workItemUrl = (id) =>
    organization && project
      ? `https://dev.azure.com/${encodeURIComponent(organization)}/${encodeURIComponent(project)}/_workitems/edit/${id}`
      : null

  const flagged = useMemo(
    () => syncedTestCases.filter((item) => item.stepCount === 0),
    [syncedTestCases],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!term) return flagged
    return flagged.filter((item) => `${item.id} ${item.title}`.toLowerCase().includes(term))
  }, [flagged, search])

  const noSteps = flagged.filter((item) => item.stepCount === 0).length

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Title3>Missing Steps</Title3>
        <Body1 className={styles.muted}>
          Imported test cases with no steps recorded.
        </Body1>
      </div>

      {syncedTestCases.length === 0 ? (
        <Card className={styles.card}>
          <Subtitle2>No test cases loaded</Subtitle2>
          <Body1 className={styles.muted}>
            Import test cases from Azure DevOps to analyse their steps.
          </Body1>
          <div className={styles.toolbar}>
            <Button appearance="primary" onClick={() => onNavigate?.('import-test-cases')}>
              Go to Import Test Cases
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <KpiGrid>
            <KpiCard
              label="Test cases analysed"
              value={syncedTestCases.length.toLocaleString()}
              icon={DocumentBulletListRegular}
            />
            <KpiCard
              label="No steps at all"
              value={noSteps}
              delta="Cannot be executed"
              icon={DocumentBulletListRegular}
              tone="danger"
            />
            <KpiCard
              label="Missing steps"
              value={flagged.length}
              delta={`${Math.round((flagged.length / syncedTestCases.length) * 100)}% of imported cases`}
              icon={DocumentBulletListRegular}
              tone="danger"
            />
          </KpiGrid>

          <Card className={styles.card}>
            <CardHeader
              header={<Subtitle2>Flagged test cases</Subtitle2>}
              description={
                <Caption1 className={styles.muted}>
                  {visible.length} of {flagged.length} shown
                </Caption1>
              }
            />

            <div className={styles.toolbar}>
              <SearchBox
                className={styles.search}
                value={search}
                placeholder="Search by ID or title"
                onChange={(_event, data) => setSearch(data.value)}
                aria-label="Search flagged test cases"
              />
              <Button
                appearance="primary"
                icon={<BotRegular />}
                onClick={() => onNavigate?.('generate-steps')}
              >
                Generate steps with AI
              </Button>
            </div>

            {visible.length === 0 ? (
              <Body1 className={styles.muted}>
                {flagged.length === 0
                  ? 'Every imported test case has usable steps.'
                  : 'No test cases match that search.'}
              </Body1>
            ) : (
              <Table size="small" aria-label="Test cases missing steps">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>ID</TableHeaderCell>
                    <TableHeaderCell>Title</TableHeaderCell>
                    <TableHeaderCell>Area path</TableHeaderCell>
                    <TableHeaderCell>State</TableHeaderCell>
                    <TableHeaderCell>Steps</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visible.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        {workItemUrl(item.id) ? (
                          <Link
                            href={workItemUrl(item.id)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {item.id}
                          </Link>
                        ) : (
                          item.id
                        )}
                      </TableCell>
                      <TableCell>
                        <TableCellLayout truncate={false}>
                          {workItemUrl(item.id) ? (
                            <Link
                              className={styles.titleLink}
                              href={workItemUrl(item.id)}
                              target="_blank"
                              rel="noopener noreferrer"
                              title={`${item.title} — open ${item.id} in Azure DevOps`}
                            >
                              {item.title}
                              <OpenRegular className={styles.linkIcon} />
                            </Link>
                          ) : (
                            item.title
                          )}
                        </TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <TableCellLayout truncate={false}>{item.areaPath}</TableCellLayout>
                      </TableCell>
                      <TableCell>{item.state}</TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          color={item.stepCount === 0 ? 'danger' : 'warning'}
                        >
                          {item.stepCount}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}
    </div>
  )
}

export default MissingSteps
