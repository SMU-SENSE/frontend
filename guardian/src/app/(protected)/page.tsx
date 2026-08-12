import { apiConfig } from '../../api/client'
import BackendDashboardPage from '../../pages/dashboard/BackendDashboardPage'
import DashboardPage from '../../pages/dashboard/DashboardPage'

export default apiConfig.useMockApi ? DashboardPage : BackendDashboardPage
