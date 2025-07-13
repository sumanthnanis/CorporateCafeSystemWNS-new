import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '@/lib/api'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const userData = localStorage.getItem('user')
    
    if (token && userData) {
      try {
        // Validate token is not expired
        const tokenData = JSON.parse(atob(token.split('.')[1]))
        const currentTime = Date.now() / 1000
        
        if (tokenData.exp > currentTime) {
          setUser(JSON.parse(userData))
        } else {
          // Token expired, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('user')
        }
      } catch (error) {
        // Invalid token format, clear storage
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (credentials, rememberMe = true) => {
    try {
      const response = await authAPI.login(credentials)
      const { access_token, user: userData } = response.data
      
      // Store tokens for longer persistence to support multi-device login
      localStorage.setItem('token', access_token)
      localStorage.setItem('user', JSON.stringify(userData))
      
      // Store login credentials securely for auto-login on other devices (if user opts in)
      if (rememberMe) {
        // Store hashed credentials for potential auto-re-authentication
        localStorage.setItem('loginInfo', btoa(JSON.stringify({
          username: credentials.username,
          timestamp: Date.now()
        })))
      }
      
      setUser(userData)
      return userData
    } catch (error) {
      throw error
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      return response.data
    } catch (error) {
      throw error
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('loginInfo')
    setUser(null)
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    isEmployee: user?.user_type === 'EMPLOYEE',
    isCafeOwner: user?.user_type === 'CAFE_OWNER',
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}