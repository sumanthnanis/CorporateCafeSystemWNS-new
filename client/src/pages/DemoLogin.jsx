import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/hooks/use-toast'
import { Users, ChefHat, Coffee, Play } from 'lucide-react'

const DemoLogin = () => {
  const [loading, setLoading] = useState(false)
  const [loadingAccount, setLoadingAccount] = useState(null)
  const { login } = useAuth()
  const navigate = useNavigate()

  const demoAccounts = [
    {
      id: 1,
      type: 'EMPLOYEE',
      name: 'John Smith',
      username: 'john_employee',
      password: 'password123',
      description: 'Employee account to browse cafes and order food',
      icon: Users,
      color: 'employee-primary',
      bgColor: 'bg-employee-primary/10',
      borderColor: 'border-employee-primary/20 hover:border-employee-primary/40'
    },
    {
      id: 2,
      type: 'EMPLOYEE',
      name: 'Sarah Johnson',
      username: 'sarah_employee',
      password: 'password123',
      description: 'Another employee account for testing orders',
      icon: Users,
      color: 'employee-primary',
      bgColor: 'bg-employee-primary/10',
      borderColor: 'border-employee-primary/20 hover:border-employee-primary/40'
    },
    {
      id: 3,
      type: 'CAFE_OWNER',
      name: 'Mike Wilson',
      username: 'mike_owner',
      password: 'password123',
      description: 'Cafe owner account to manage cafes and menus',
      icon: ChefHat,
      color: 'owner-primary',
      bgColor: 'bg-owner-primary/10',
      borderColor: 'border-owner-primary/20 hover:border-owner-primary/40'
    },
    {
      id: 4,
      type: 'CAFE_OWNER',
      name: 'Lisa Davis',
      username: 'lisa_owner',
      password: 'password123',
      description: 'Another cafe owner for testing multiple cafes',
      icon: ChefHat,
      color: 'owner-primary',
      bgColor: 'bg-owner-primary/10',
      borderColor: 'border-owner-primary/20 hover:border-owner-primary/40'
    }
  ]

  const handleDemoLogin = async (account) => {
    setLoadingAccount(account.id)
    
    try {
      const user = await login({
        username: account.username,
        password: account.password
      })

      toast({
        title: "Demo Login Successful!",
        description: `Logged in as ${account.name} (${account.type})`,
      })

      // Navigate to the appropriate dashboard
      if (user.user_type === 'EMPLOYEE') {
        navigate('/employee')
      } else {
        navigate('/owner')
      }
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Demo account not found. Please initialize dummy data first.",
        variant: "destructive",
      })
    } finally {
      setLoadingAccount(null)
    }
  }

  const handleInitDummyData = async () => {
    setLoading(true)
    
    try {
      // Initialize dummy data via API
      const response = await fetch('/api/employee/init-dummy-data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (response.ok) {
        toast({
          title: "Demo Data Created!",
          description: "All demo accounts and data have been initialized.",
        })
      } else {
        toast({
          title: "Error",
          description: "Failed to initialize demo data.",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to initialize demo data.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center mb-4">
            <Coffee className="h-12 w-12 text-employee-primary mr-2" />
            <h1 className="text-4xl font-bold text-gray-800">
              Demo Login
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Quick access to demo accounts for testing both employee and cafe owner functionality
          </p>
        </div>

        {/* Initialize Demo Data Button */}
        <div className="text-center mb-8">
          <Button
            onClick={handleInitDummyData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Initializing...
              </>
            ) : (
              <>
                <Play className="h-5 w-5 mr-2" />
                Initialize Demo Data
              </>
            )}
          </Button>
          <p className="text-sm text-gray-500 mt-2">
            Click this first to create demo accounts and sample data
          </p>
        </div>

        {/* Demo Accounts Grid */}
        <div className="grid md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {demoAccounts.map((account) => {
            const Icon = account.icon
            const isLoading = loadingAccount === account.id
            
            return (
              <Card
                key={account.id}
                className={`border-2 ${account.borderColor} transition-all duration-300 transform hover:scale-105`}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${account.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`h-8 w-8 text-${account.color}`} />
                  </div>
                  <CardTitle className={`text-xl text-${account.color}`}>
                    {account.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {account.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-center space-y-2">
                    <div className="text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Username:</span>
                        <span className="font-mono text-gray-800">{account.username}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Password:</span>
                        <span className="font-mono text-gray-800">{account.password}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Type:</span>
                        <span className="font-semibold">{account.type.replace('_', ' ')}</span>
                      </div>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleDemoLogin(account)}
                    disabled={isLoading}
                    className={`w-full ${
                      account.type === 'EMPLOYEE' 
                        ? 'bg-employee-primary hover:bg-employee-primary/90' 
                        : 'bg-owner-primary hover:bg-owner-primary/90'
                    } text-white`}
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Logging in...
                      </>
                    ) : (
                      <>
                        <Icon className="h-4 w-4 mr-2" />
                        Login as {account.name}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>

        {/* Instructions */}
        <div className="mt-12 text-center">
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Coffee className="h-5 w-5 mr-2" />
                How to Use Demo Mode
              </CardTitle>
            </CardHeader>
            <CardContent className="text-left space-y-3">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-semibold">Initialize Demo Data</p>
                  <p className="text-sm text-gray-600">Click the "Initialize Demo Data" button to create sample accounts and data.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-employee-primary text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-semibold">Login as Employee</p>
                  <p className="text-sm text-gray-600">Use employee accounts to browse cafes, order food, and track orders.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-owner-primary text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-semibold">Login as Cafe Owner</p>
                  <p className="text-sm text-gray-600">Use owner accounts to manage cafes, update menus, and process orders.</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                <div>
                  <p className="font-semibold">Switch Between Users</p>
                  <p className="text-sm text-gray-600">Use the user switcher in the top-right to switch between logged-in accounts.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default DemoLogin