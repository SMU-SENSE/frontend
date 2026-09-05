import { Suspense } from 'react'
import { PageLoader } from '../../../components/ui/AsyncState'
import SentencesPage from '../../../views/sentences/SentencesPage'

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SentencesPage />
    </Suspense>
  )
}
