import { useEffect, useState, useCallback } from 'react'
import {
  Button,
  Caption1,
  Card,
  CardHeader,
  Divider,
  Dropdown,
  Field,
  Input,
  MessageBar,
  MessageBarBody,
  MessageBarTitle,
  Option,
  Spinner,
  Subtitle2,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Badge,
  Body1,
  mergeClasses,
} from '@fluentui/react-components'
import {
  CheckmarkCircleFilled,
  DismissCircleFilled,
  PlugConnectedRegular,
} from '@fluentui/react-icons'
import { fetchAdoProjects, testAdoConnection } from '../../services/apiService'
import { useAdoConnection } from '../../context/AdoConnectionContext'
import { formatTimestamp, useAdoStyles } from './adoStyles'

function ConnectionPanel() {
  const styles = useAdoStyles()
  const {
    form,
    updateForm,
    connected,
    setConnected,
    projects,
    projectsOrg,
    setProjectsForOrg,
    history,
    addHistoryEntry,
    reset,
  } = useAdoConnection()
  const [busy, setBusy] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [message, setMessage] = useState(null)

  const updateField = (key) => (_event, data) => updateForm(key, data.value)

  const organization = form.organization.trim()
  const project = form.project.trim()
  const pat = form.pat.trim()
  const credentialsMissing = !organization || !project || (!pat && !connected)

  useEffect(() => {
    // Only load projects if we have credentials and they've changed organization
    if (!organization || !pat || projectsOrg === organization) return undefined

    let cancelled = false
    // Debounced so the list loads once the organization stops changing.
    const timer = setTimeout(async () => {
      setLoadingProjects(true)
      try {
        const discovered = await fetchAdoProjects({ organization, pat })
        if (cancelled) return
        setProjectsForOrg(organization, discovered)
        // A project carried over from a different organization would not exist here.
        if (discovered.length && !discovered.includes(form.project.trim())) {
          updateForm('project', '')
        }
        addHistoryEntry({
          action: 'Load Project List',
          status: 'Succeeded',
          records: discovered.length,
          timestamp: new Date().toISOString(),
        })
      } catch (error) {
        if (cancelled) return
        setMessage({
          intent: 'error',
          title: 'Could not load projects',
          text: error.message || 'Project discovery failed.',
        })
      } finally {
        if (!cancelled) setLoadingProjects(false)
      }
    }, 700)

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [organization, pat, projectsOrg, setProjectsForOrg, addHistoryEntry, updateForm])

  const handleTestConnection = async (event) => {
    event?.preventDefault()
    setBusy(true)
    setMessage(null)

    try {
      const result = await testAdoConnection(form)
      setConnected(result.ok)
      setMessage({
        intent: result.ok ? 'success' : 'error',
        title: result.ok ? 'Connection succeeded' : 'Connection failed',
        text: result.payload?.message || 'No message returned by the API.',
      })
      addHistoryEntry({
        action: 'Test Connection',
        status: result.ok ? 'Succeeded' : 'Failed',
        records: 0,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      setConnected(false)
      setMessage({
        intent: 'error',
        title: 'Connection failed',
        text: error.message || 'Failed to reach the backend API.',
      })
      addHistoryEntry({
        action: 'Test Connection',
        status: 'Failed',
        records: 0,
        timestamp: new Date().toISOString(),
      })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={styles.panel}>
      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <div className={styles.splitGrid}>
        <Card className={styles.card}>
          <CardHeader
            header={<Subtitle2>Connection details</Subtitle2>}
            description={
              <Caption1 className={styles.hint}>Credentials stay in this session only.</Caption1>
            }
          />
          <form className={styles.form} onSubmit={handleTestConnection}>
            <Field label="Organization" required>
              <Input
                value={form.organization}
                onChange={updateField('organization')}
                placeholder="your-organization"
                contentBefore={<PlugConnectedRegular />}
              />
            </Field>

            <Field label="Personal access token" required>
              <Input
                type="password"
                value={form.pat}
                onChange={updateField('pat')}
                placeholder="Paste PAT token"
                autoComplete="off"
              />
            </Field>

            <Field
              label="Project"
              required
              hint={
                loadingProjects
                  ? `Loading projects for ${organization}…`
                  : projects.length
                    ? `${projects.length} projects found in ${projectsOrg}.`
                    : 'Enter an organization and PAT to load the project list.'
              }
            >
              {projects.length ? (
                <Dropdown
                  selectedOptions={project ? [project] : []}
                  onOptionSelect={(_event, data) => updateForm('project', data.optionValue)}
                  placeholder="Select a project"
                  disabled={loadingProjects}
                >
                  {projects.map((item) => (
                    <Option key={item} value={item}>
                      {item}
                    </Option>
                  ))}
                </Dropdown>
              ) : (
                <Input
                  value={form.project}
                  onChange={updateField('project')}
                  placeholder="your-project"
                  disabled={loadingProjects}
                  contentAfter={loadingProjects ? <Spinner size="tiny" /> : undefined}
                />
              )}
            </Field>

            <Divider />

            <div className={styles.actions}>
              <Button
                appearance="primary"
                type="submit"
                disabled={credentialsMissing || busy || connected}
                icon={busy ? <Spinner size="tiny" /> : <PlugConnectedRegular />}
              >
                {busy ? 'Testing…' : 'Test Connection'}
              </Button>
              <Button
                type="button"
                disabled={busy}
                onClick={() => {
                  reset()
                  setMessage(null)
                }}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        <div className={styles.panel}>
          <Card className={styles.card}>
            <div className={styles.metric}>
              <span
                className={mergeClasses(
                  styles.metricIcon,
                  connected ? styles.metricIconOk : styles.metricIconOff,
                )}
                aria-hidden="true"
              >
                {connected ? <CheckmarkCircleFilled /> : <DismissCircleFilled />}
              </span>
              <div>
                <Caption1 className={styles.hint}>Status</Caption1>
                <div className={styles.metricValue}>{connected ? 'Connected' : 'Not Connected'}</div>
              </div>
            </div>
            <Badge appearance="tint" color={connected ? 'success' : 'informative'}>
              {form.organization ? `${form.organization} / ${form.project || '—'}` : 'Not connected'}
            </Badge>
          </Card>

          <Card className={styles.card}>
            <CardHeader
              header={<Subtitle2>Recent activity</Subtitle2>}
              description={<Caption1 className={styles.hint}>Last 8 connection events.</Caption1>}
            />
            {history.length === 0 ? (
              <Body1 className={styles.hint}>No activity yet. Test the connection to get started.</Body1>
            ) : (
              <Table size="small" aria-label="Recent activity">
                <TableHeader>
                  <TableRow>
                    <TableHeaderCell>Action</TableHeaderCell>
                    <TableHeaderCell>Status</TableHeaderCell>
                    <TableHeaderCell>Records</TableHeaderCell>
                    <TableHeaderCell>When</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        <TableCellLayout>{entry.action}</TableCellLayout>
                      </TableCell>
                      <TableCell>
                        <Badge
                          appearance="tint"
                          color={entry.status === 'Succeeded' ? 'success' : 'danger'}
                        >
                          {entry.status}
                        </Badge>
                      </TableCell>
                      <TableCell>{entry.records || '—'}</TableCell>
                      <TableCell>{formatTimestamp(entry.timestamp)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}

export default ConnectionPanel
