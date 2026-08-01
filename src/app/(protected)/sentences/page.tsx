import { Suspense } from 'react'
import { PageLoader } from '../../../components/ui/AsyncState'
import SentencesPage from '../../../pages/sentences/SentencesPage'

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SentencesPage />
    </Suspense>
  )
}
