import { FluentProvider, webLightTheme } from '@fluentui/react-components'
import { DashboardPage } from '../../features/dashboard/DashboardPage'

export function AppShell() {
  return (
    <FluentProvider theme={webLightTheme}>
      <DashboardPage />
    </FluentProvider>
  )
}
