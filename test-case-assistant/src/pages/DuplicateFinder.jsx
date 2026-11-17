import { makeStyles, tokens } from '@fluentui/react-components'
import DuplicatesPanel from './ado/DuplicatesPanel'

const useStyles = makeStyles({
  page: {
    display: 'flex',
    flexDirection: 'column',
    rowGap: tokens.spacingVerticalL,
    maxWidth: '1280px',
  },
})

function DuplicateFinder({ onNavigate }) {
  const styles = useStyles()

  return (
    <div className={styles.page}>
      <DuplicatesPanel onOpenSync={() => onNavigate('import-test-cases')} />
    </div>
  )
}

export default DuplicateFinder
