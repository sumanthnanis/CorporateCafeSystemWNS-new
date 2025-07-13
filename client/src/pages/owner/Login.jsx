import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from '@/hooks/use-toast'
import { ChefHat, ArrowLeft, Eye, EyeOff } from 'lucide-react'

const OwnerLogin = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    full_name: '',
  })

  const { login, register } = useAuth()
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        // Login
        const user = await login({
          username: formData.username,
          password: formData.password,
        })
        
        if (user.user_type !== 'CAFE_OWNER') {
          toast({
            title: "Access Denied",
            description: "This login is for cafe owners only. Please use the correct login page.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Welcome back!",
          description: "You have successfully logged in as cafe owner.",
        })
        navigate('/owner')
      } else {
        // Register
        await register({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          full_name: formData.full_name,
          user_type: 'CAFE_OWNER',
        })

        // Auto login after successful registration
        const loginUser = await login({
          username: formData.username,
          password: formData.password,
        })

        toast({
          title: "Welcome!",
          description: "Your account has been created and you're now logged in.",
        })
        navigate('/owner')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "An error occurred. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme">
      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center text-owner-primary hover:text-owner-primary/80 mb-8"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Home
        </Link>

        {/* Login/Register Form */}
        <div className="max-w-md mx-auto">
          <Card className="border-2 border-owner-primary/20">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <ChefHat className="h-12 w-12 text-owner-primary" />
              </div>
              <CardTitle className="text-2xl text-owner-primary">
                {isLogin ? 'Cafe Owner Portal' : 'Start Your Cafe'}
              </CardTitle>
              <CardDescription className="text-lg">
                {isLogin 
                  ? 'Manage your cafe and serve delicious food' 
                  : 'Create your cafe owner account to get started'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Registration Fields */}
                {!isLogin && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="full_name">Full Name</Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        type="text"
                        placeholder="Enter your full name"
                        value={formData.full_name}
                        onChange={handleChange}
                        required
                        className="mobile-touch-target"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className="mobile-touch-target"
                      />
                    </div>
                  </>
                )}

                {/* Common Fields */}
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    placeholder="Enter your username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                    className="mobile-touch-target"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      className="mobile-touch-target pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>



                {/* Submit Button */}
                <Button 
                  type="submit" 
                  variant="owner" 
                  size="mobile" 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
                </Button>

                {/* Toggle Login/Register */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setIsLogin(!isLogin)}
                    className="text-owner-primary hover:text-owner-primary/80 text-sm"
                  >
                    {isLogin 
                      ? "Don't have an account? Register here" 
                      : "Already have an account? Login here"
                    }
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default OwnerLogin