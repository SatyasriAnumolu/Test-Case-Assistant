import { useState } from 'react'
import {
  Badge,
  Body1,
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
  Slider,
  Subtitle2,
  Switch,
  Tab,
  TabList,
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHeaderCell,
  TableRow,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import {
  ArrowSyncCircleRegular,
  PeopleTeamRegular,
  PlugConnectedRegular,
  SaveRegular,
} from '@fluentui/react-icons'
import PageHeader from '../components/common/PageHeader'

const members = [
  { name: 'Workspace Owner', email: 'owner@contoso.com', role: 'Owner', status: 'Active' },
  { name: 'A. Rao', email: 'a.rao@contoso.com', role: 'QA Lead', status: 'Active' },
  { name: 'M. Diaz', email: 'm.diaz@contoso.com', role: 'Contributor', status: 'Active' },
  { name: 'K. Patel', email: 'k.patel@contoso.com', role: 'Reader', status: 'Invited' },
]

const roleColor = { Owner: 'brand', 'QA Lead': 'success', Contributor: 'informative', Reader: 'subtle' }

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1100px',
  },
  card: {
    padding: tokens.spacingVerticalL,
    rowGap: tokens.spacingVerticalM,
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    columnGap: tokens.spacingHorizontalL,
    rowGap: tokens.spacingVerticalM,
  },
  stack: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalM,
  },
  sliderRow: {
    display: 'flex',
    alignItems: 'center',
    columnGap: tokens.spacingHorizontalM,
  },
  tabBody: {
    paddingTop: tokens.spacingVerticalM,
  },
  muted: { color: tokens.colorNeutralForeground3 },
})

function Settings({ onNavigate }) {
  const styles = useStyles()
  const [tab, setTab] = useState('workspace')
  const [message, setMessage] = useState(null)
  const [preferences, setPreferences] = useState({
    workspaceName: 'Quality Intelligence Workspace',
    defaultProject: 'Payments',
    model: 'GPT-4o',
    similarityThreshold: 85,
    qualityThreshold: 80,
    autoSyncEnabled: true,
    autoFixEnabled: false,
    emailDigest: true,
  })

  const update = (key, value) => setPreferences((current) => ({ ...current, [key]: value }))

  const save = () =>
    setMessage({
      intent: 'success',
      title: 'Preferences saved',
      text: 'Settings are stored for this session until the settings API is connected.',
    })

  return (
    <div className={styles.page}>
      <PageHeader
        title="Settings"
        subtitle="Workspace defaults, AI behaviour, thresholds, and access."
        actions={
          <>
            <Button appearance="primary" icon={<SaveRegular />} onClick={save}>
              Save changes
            </Button>
            <Button icon={<PlugConnectedRegular />} onClick={() => onNavigate?.('import-ado')}>
              Azure DevOps connection
            </Button>
          </>
        }
      />

      {message && (
        <MessageBar intent={message.intent}>
          <MessageBarBody>
            <MessageBarTitle>{message.title}</MessageBarTitle>
            {message.text}
          </MessageBarBody>
        </MessageBar>
      )}

      <Card className={styles.card}>
        <TabList selectedValue={tab} onTabSelect={(_event, data) => setTab(data.value)}>
          <Tab value="workspace">Workspace</Tab>
          <Tab value="ai">AI and thresholds</Tab>
          <Tab value="notifications">Notifications</Tab>
          <Tab value="access">Access</Tab>
        </TabList>

        <div className={styles.tabBody}>
          {tab === 'workspace' && (
            <div className={styles.form}>
              <Field label="Workspace name">
                <Input
                  value={preferences.workspaceName}
                  onChange={(event) => update('workspaceName', event.target.value)}
                />
              </Field>
              <Field label="Default project">
                <Dropdown
                  value={preferences.defaultProject}
                  selectedOptions={[preferences.defaultProject]}
                  onOptionSelect={(_event, data) => update('defaultProject', data.optionValue)}
                >
                  {['Payments', 'Identity', 'Billing', 'Reporting'].map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>
              <Field label="Automatic ADO sync" hint="Sync test cases every night at 02:00 UTC.">
                <Switch
                  checked={preferences.autoSyncEnabled}
                  onChange={(_event, data) => update('autoSyncEnabled', data.checked)}
                  label={preferences.autoSyncEnabled ? 'Enabled' : 'Disabled'}
                />
              </Field>
            </div>
          )}

          {tab === 'ai' && (
            <div className={styles.stack}>
              <Field label="Generation model">
                <Dropdown
                  value={preferences.model}
                  selectedOptions={[preferences.model]}
                  onOptionSelect={(_event, data) => update('model', data.optionValue)}
                >
                  {['GPT-4o', 'GPT-4o mini', 'Phi-4'].map((option) => (
                    <Option key={option} value={option}>
                      {option}
                    </Option>
                  ))}
                </Dropdown>
              </Field>

              <Field label={`Duplicate similarity threshold — ${preferences.similarityThreshold}%`}>
                <div className={styles.sliderRow}>
                  <Slider
                    min={50}
                    max={100}
                    value={preferences.similarityThreshold}
                    onChange={(_event, data) => update('similarityThreshold', data.value)}
                  />
                  <Caption1 className={styles.muted}>Higher values reduce false positives.</Caption1>
                </div>
              </Field>

              <Field label={`Minimum quality score — ${preferences.qualityThreshold}`}>
                <div className={styles.sliderRow}>
                  <Slider
                    min={0}
                    max={100}
                    value={preferences.qualityThreshold}
                    onChange={(_event, data) => update('qualityThreshold', data.value)}
                  />
                  <Caption1 className={styles.muted}>Cases below this score are flagged.</Caption1>
                </div>
              </Field>

              <Divider />

              <Field label="Apply Auto Fix without review" hint="Not recommended for regulated suites.">
                <Switch
                  checked={preferences.autoFixEnabled}
                  onChange={(_event, data) => update('autoFixEnabled', data.checked)}
                  label={preferences.autoFixEnabled ? 'Enabled' : 'Disabled'}
                />
              </Field>
            </div>
          )}

          {tab === 'notifications' && (
            <div className={styles.stack}>
              <Field label="Weekly quality digest">
                <Switch
                  checked={preferences.emailDigest}
                  onChange={(_event, data) => update('emailDigest', data.checked)}
                  label={preferences.emailDigest ? 'Enabled' : 'Disabled'}
                />
              </Field>
              <Body1 className={styles.muted}>
                Alerts for failed syncs and high-risk coverage gaps are always sent to workspace owners.
              </Body1>
            </div>
          )}

          {tab === 'access' && (
            <Table size="small" aria-label="Workspace members">
              <TableHeader>
                <TableRow>
                  <TableHeaderCell>Member</TableHeaderCell>
                  <TableHeaderCell>Email</TableHeaderCell>
                  <TableHeaderCell>Role</TableHeaderCell>
                  <TableHeaderCell>Status</TableHeaderCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.email}>
                    <TableCell>{member.name}</TableCell>
                    <TableCell>{member.email}</TableCell>
                    <TableCell>
                      <Badge appearance="tint" color={roleColor[member.role]}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        appearance="tint"
                        color={member.status === 'Active' ? 'success' : 'warning'}
                      >
                        {member.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      <Card className={styles.card}>
        <CardHeader
          header={<Subtitle2>Connected services</Subtitle2>}
          description={<Caption1 className={styles.muted}>Integrations used by this workspace.</Caption1>}
        />
        <div className={styles.form}>
          <Button
            appearance="subtle"
            icon={<ArrowSyncCircleRegular />}
            onClick={() => onNavigate?.('import-ado')}
          >
            Azure DevOps — configure
          </Button>
          <Button appearance="subtle" icon={<PeopleTeamRegular />} disabled>
            Microsoft Entra ID — managed by tenant
          </Button>
        </div>
      </Card>
    </div>
  )
}

export default Settings
