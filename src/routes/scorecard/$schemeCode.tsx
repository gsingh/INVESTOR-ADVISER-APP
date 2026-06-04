import { useParams } from '@tanstack/react-router'
import { FundDetail } from '@/features/scorecard/components/FundDetail'

export default function FundDetailPage() {
  const { schemeCode } = useParams({ from: '/scorecard/$schemeCode' })
  return <FundDetail schemeCode={schemeCode} />
}
