import { Navigate } from 'react-router-dom'
import { useSettings } from '../lib/settings-context'

export default function IndexRedirect() {
  const { settings } = useSettings()
  const target = settings ? '/study' : '/setup'
  return <Navigate to={target} replace />
}