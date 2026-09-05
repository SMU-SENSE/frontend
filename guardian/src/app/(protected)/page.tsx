import { apiConfig } from '../../api/client'
import BackendDashboardPage from '../../views/dashboard/BackendDashboardPage'
import DashboardPage from '../../views/dashboard/DashboardPage'

export default apiConfig.useMockApi ? DashboardPage : BackendDashboardPage
