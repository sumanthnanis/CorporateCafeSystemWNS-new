import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Coffee, Users, ChefHat } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const Home = () => {
  const { user } = useAuth()

  if (user) {
    // Redirect authenticated users to their dashboard
    if (user.user_type === 'EMPLOYEE') {
      window.location.href = '/employee'
    } else if (user.user_type === 'CAFE_OWNER') {
      window.location.href = '/owner'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-50 via-brand-100 to-brand-200 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-between items-start mb-6">
            <div className="flex-1"></div>
            <div className="flex flex-col items-center">
              <div className="flex justify-center items-center mb-6">
                <div className="bg-brand-500/10 p-3 rounded-full mr-4">
                  <Coffee className="h-12 w-12 text-brand-600" />
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-brand-800">
                  Corporate Food Hub
                </h1>
              </div>
            </div>
            <div className="flex-1 flex justify-end">
              <ThemeToggle 
                variant="outline" 
                className="border-brand-400/30 hover:bg-brand-100 text-brand-600 rounded-xl" 
              />
            </div>
          </div>
          <p className="text-lg md:text-xl text-brand-600 max-w-2xl mx-auto leading-relaxed">
            Connecting employees with delicious food from local cafe owners within your corporate environment
          </p>
        </div>

        {/* Single Call-to-Action */}
        <div className="max-w-lg mx-auto mb-12">
          <Card className="border-2 border-brand-300/50 hover:border-brand-400 transition-all duration-300 transform hover:scale-105 bg-white/90 backdrop-blur-sm shadow-xl dark:bg-slate-800/90 dark:border-slate-600/50 dark:hover:border-slate-500">
            <CardHeader className="text-center pb-4">
              <div className="flex justify-center mb-6">
                <div className="p-4 rounded-full bg-gradient-to-r from-brand-500 to-brand-600 shadow-lg">
                  <Coffee className="h-16 w-16 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl md:text-3xl font-bold text-brand-800 mb-2">
                Join FoodFlow
              </CardTitle>
              <CardDescription className="text-base md:text-lg text-brand-600 leading-relaxed">
                Whether you're ordering food or managing a cafe, get started in seconds
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
              {/* Features Grid */}
              <div className="grid grid-cols-2 gap-4 text-sm md:text-base">
                <div className="flex items-center text-brand-700">
                  <div className="w-3 h-3 bg-employee-primary rounded-full mr-3"></div>
                  <span className="font-medium">Browse & Order</span>
                </div>
                <div className="flex items-center text-brand-700">
                  <div className="w-3 h-3 bg-owner-primary rounded-full mr-3"></div>
                  <span className="font-medium">Manage Cafe</span>
                </div>
                <div className="flex items-center text-brand-700">
                  <div className="w-3 h-3 bg-employee-accent rounded-full mr-3"></div>
                  <span className="font-medium">Track Orders</span>
                </div>
                <div className="flex items-center text-brand-700">
                  <div className="w-3 h-3 bg-owner-success rounded-full mr-3"></div>
                  <span className="font-medium">Real-time Updates</span>
                </div>
              </div>
              
              {/* Main CTA Button */}
              <Link to="/auth" className="block">
                <Button 
                  size="lg" 
                  className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 rounded-xl"
                >
                  Get Started
                </Button>
              </Link>
              
              <p className="text-center text-sm text-brand-500 font-medium">
                Choose your role during sign-up
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Features Section */}
        <div className="text-center">
          <h2 className="text-2xl md:text-3xl font-bold text-brand-800 mb-10">
            Why Choose Corporate Food Hub?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-employee-primary/20 hover:border-employee-primary/40 transition-all duration-300 dark:bg-slate-800/60 dark:border-employee-primary/30">
              <div className="w-16 h-16 bg-employee-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Coffee className="h-8 w-8 text-employee-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-brand-800">Easy Ordering</h3>
              <p className="text-brand-600 leading-relaxed">Browse menus, customize orders, and track delivery - all in one place</p>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-owner-primary/20 hover:border-owner-primary/40 transition-all duration-300 dark:bg-slate-800/60 dark:border-owner-primary/30">
              <div className="w-16 h-16 bg-owner-primary/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <ChefHat className="h-8 w-8 text-owner-primary" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-brand-800">Smart Management</h3>
              <p className="text-brand-600 leading-relaxed">Powerful tools for cafe owners to manage inventory and orders efficiently</p>
            </div>
            <div className="text-center p-6 bg-white/60 backdrop-blur-sm rounded-2xl border border-brand-400/20 hover:border-brand-400/40 transition-all duration-300 dark:bg-slate-800/60 dark:border-slate-600/30">
              <div className="w-16 h-16 bg-brand-400/10 rounded-full flex items-center justify-center mx-auto mb-5">
                <Users className="h-8 w-8 text-brand-600" />
              </div>
              <h3 className="text-lg md:text-xl font-bold mb-3 text-brand-800">Community Focus</h3>
              <p className="text-brand-600 leading-relaxed">Supporting local cafe owners within your corporate community</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Home