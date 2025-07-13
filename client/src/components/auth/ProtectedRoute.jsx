import { Navigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export const ProtectedRoute = ({ children, userType }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (userType && user.user_type !== userType) {
    return <Navigate to="/" replace />
  }

  return children
}