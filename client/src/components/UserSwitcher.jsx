import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Users, ChefHat, Coffee, Plus, X, LogOut } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const UserSwitcher = () => {
  const { user, switchUser, getAllUsers, removeUser, logout } = useAuth()
  const [showSwitcher, setShowSwitcher] = useState(false)
  const allUsers = getAllUsers()

  const handleUserSwitch = (userId) => {
    switchUser(userId)
    setShowSwitcher(false)
    toast({
      title: "User switched",
      description: "You have successfully switched user accounts.",
    })
  }

  const handleRemoveUser = (userId) => {
    removeUser(userId)
    toast({
      title: "User removed",
      description: "User session has been removed.",
    })
  }

  const getUserIcon = (userType) => {
    return userType === 'EMPLOYEE' ? Users : ChefHat
  }

  const getUserTheme = (userType) => {
    return userType === 'EMPLOYEE' ? 'bg-employee-primary' : 'bg-owner-primary'
  }

  if (allUsers.length <= 1) {
    return null
  }

  return (
    <div className="fixed top-4 right-4 z-50">
      {!showSwitcher ? (
        <Button
          onClick={() => setShowSwitcher(true)}
          className="flex items-center gap-2 shadow-lg"
          variant="outline"
        >
          <Coffee className="h-4 w-4" />
          Switch User ({allUsers.length})
        </Button>
      ) : (
        <Card className="w-80 shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <div>
              <CardTitle className="text-lg">User Sessions</CardTitle>
              <CardDescription>Switch between logged in users</CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSwitcher(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {allUsers.map((sessionUser) => {
              const Icon = getUserIcon(sessionUser.user_type)
              const isActive = user?.id === sessionUser.id
              
              return (
                <div
                  key={sessionUser.id}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                    isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${getUserTheme(sessionUser.user_type)} text-white`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-medium">{sessionUser?.full_name || 'User'}</div>
                      <div className="text-sm text-gray-500">@{sessionUser.username}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={sessionUser.user_type === 'EMPLOYEE' ? 'default' : 'secondary'}>
                      {sessionUser.user_type === 'EMPLOYEE' ? 'Employee' : 'Owner'}
                    </Badge>
                    {isActive && (
                      <Badge variant="outline" className="text-blue-600 border-blue-600">
                        Active
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
            
            <div className="flex gap-2 pt-2">
              <Select onValueChange={handleUserSwitch}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Switch to..." />
                </SelectTrigger>
                <SelectContent>
                  {allUsers
                    .filter(sessionUser => sessionUser.id !== user?.id)
                    .map((sessionUser) => {
                      const Icon = getUserIcon(sessionUser.user_type)
                      return (
                        <SelectItem key={sessionUser.id} value={sessionUser.id.toString()}>
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {sessionUser?.full_name || 'User'}
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  logout()
                  setShowSwitcher(false)
                }}
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default UserSwitcher