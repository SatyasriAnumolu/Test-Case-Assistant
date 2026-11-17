import {
  Body1,
  Title3,
  makeStyles,
  tokens,
} from '@fluentui/react-components'
import ConnectionPanel from './ado/ConnectionPanel'

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
})

function AdoConnection() {
  const styles = useStyles()

  return (
    <div className={styles.page}>
      <div className={styles.intro}>
        <Title3>Azure DevOps</Title3>
        <Body1>
          Configure your Azure DevOps connection and project settings.
        </Body1>
      </div>

      <ConnectionPanel />
    </div>
  )
}

export default AdoConnection
