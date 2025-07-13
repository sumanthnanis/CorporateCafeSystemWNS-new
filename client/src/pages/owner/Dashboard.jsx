import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cafeOwnerAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { 
  ChefHat, 
  Store, 
  Menu, 
  Package, 
  Receipt, 
  TrendingUp, 
  Users, 
  DollarSign,
  Clock,
  LogOut,
  Plus,
  X,
  MessageSquare
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const Dashboard = () => {
  const { user, logout, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [cafes, setCafes] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateCafe, setShowCreateCafe] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [showCafeSelector, setShowCafeSelector] = useState(false)
  const [newCafe, setNewCafe] = useState({
    name: '',
    description: '',
    address: '',
    phone: ''
  })
  const [stats, setStats] = useState({
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    activeCafes: 0
  })

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [cafesResponse, ordersResponse] = await Promise.all([
        cafeOwnerAPI.getMyCafes(),
        cafeOwnerAPI.getCafeOrders()
      ])
      
      setCafes(cafesResponse.data)
      setOrders(ordersResponse.data)
      
      // Calculate stats
      const totalOrders = ordersResponse.data.length
      const totalRevenue = ordersResponse.data.reduce((sum, order) => sum + order.total_amount, 0)
      const pendingOrders = ordersResponse.data.filter(order => order.status === 'PENDING').length
      const activeCafes = cafesResponse.data.filter(cafe => cafe.is_active).length
      
      setStats({
        totalOrders,
        totalRevenue,
        pendingOrders,
        activeCafes
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    })
  }

  const handleCreateCafe = async (e) => {
    e.preventDefault()
    setCreateLoading(true)
    
    try {
      await cafeOwnerAPI.createCafe(newCafe)
      
      toast({
        title: "Success!",
        description: "Your cafe has been created successfully.",
      })
      
      // Reset form and close modal
      setNewCafe({
        name: '',
        description: '',
        address: '',
        phone: ''
      })
      setShowCreateCafe(false)
      
      // Reload dashboard data
      loadDashboardData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create cafe. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCreateLoading(false)
    }
  }

  const handleCafeInputChange = (e) => {
    setNewCafe({
      ...newCafe,
      [e.target.name]: e.target.value
    })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'pending'
      case 'accepted': return 'accepted'
      case 'preparing': return 'preparing'
      case 'ready': return 'ready'
      case 'delivered': return 'delivered'
      case 'cancelled': return 'cancelled'
      default: return 'default'
    }
  }

  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-owner-primary"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme">
      {/* Header */}
      <header className="food-header food-header-owner">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="bg-owner-primary/10 p-3 rounded-full">
                <ChefHat className="h-6 w-6 md:h-8 md:w-8 text-owner-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg md:text-xl font-bold text-gray-800">Cafe Owner Portal</h1>
                <p className="text-sm text-gray-600 hidden sm:block">Welcome back, {user?.full_name || 'User'}!</p>
                <p className="text-xs sm:hidden text-gray-600">Hi, {user?.full_name?.split(' ')[0] || 'User'}!</p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <ThemeToggle 
                variant="outline" 
                className="border-owner-primary/30 hover:bg-owner-primary/10 text-owner-primary rounded-xl" 
              />
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={handleLogout} 
                className="mobile-touch-target hover:bg-owner-primary/10 rounded-xl"
              >
                <LogOut className="h-5 w-5 text-owner-primary" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="food-card food-card-owner bg-gradient-to-br from-white to-owner-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Total Orders</p>
                  <p className="text-2xl font-bold text-owner-primary">{stats.totalOrders}</p>
                </div>
                <div className="bg-owner-primary/10 p-3 rounded-full">
                  <Receipt className="h-6 w-6 text-owner-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="food-card food-card-owner bg-gradient-to-br from-white to-owner-secondary/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Revenue</p>
                  <p className="text-2xl font-bold text-owner-secondary">
                    {formatCurrency(stats.totalRevenue)}
                  </p>
                </div>
                <div className="bg-owner-secondary/10 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-owner-secondary" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="food-card food-card-owner bg-gradient-to-br from-white to-owner-accent/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Pending</p>
                  <p className="text-2xl font-bold text-owner-accent">{stats.pendingOrders}</p>
                </div>
                <div className="bg-owner-accent/10 p-3 rounded-full">
                  <Clock className="h-6 w-6 text-owner-accent" />
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="food-card food-card-owner bg-gradient-to-br from-white to-owner-success/5">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 font-medium">Active Cafes</p>
                  <p className="text-2xl font-bold text-owner-success">{stats.activeCafes}</p>
                </div>
                <div className="bg-owner-success/10 p-3 rounded-full">
                  <Store className="h-6 w-6 text-owner-success" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card 
            className="food-card food-card-owner hover:scale-105 transition-all duration-200 cursor-pointer"
            onClick={() => setShowCafeSelector(true)}
          >
            <CardContent className="p-6 text-center">
              <div className="bg-owner-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Menu className="h-6 w-6 text-owner-primary" />
              </div>
              <p className="text-sm font-semibold text-gray-800">Menu</p>
            </CardContent>
          </Card>
          <Link to="/owner/inventory">
            <Card className="food-card food-card-owner hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-owner-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Package className="h-6 w-6 text-owner-secondary" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Inventory</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/owner/orders">
            <Card className="food-card food-card-owner hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-owner-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6 text-owner-accent" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Orders</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/owner/feedback">
            <Card className="food-card food-card-owner hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-owner-success/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="h-6 w-6 text-owner-success" />
                </div>
                <p className="text-sm font-semibold text-gray-800">Feedback</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* My Cafes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">My Cafes</h2>
            <Button 
              className="food-button food-button-owner mobile-touch-target"
              onClick={() => setShowCreateCafe(true)}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Cafe
            </Button>
          </div>
          {cafes.length === 0 ? (
            <Card className="food-card food-card-owner text-center p-8">
              <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No cafes yet</h3>
              <p className="text-gray-600 mb-4">Create your first cafe to start accepting orders!</p>
              <Button 
                className="food-button food-button-owner"
                size="lg"
                onClick={() => setShowCreateCafe(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Cafe
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4">
              {cafes.map((cafe) => (
                <Card key={cafe.id} className="food-card food-card-owner">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{cafe.name}</h3>
                          <Badge className={`${cafe.is_active ? 'bg-owner-success text-white' : 'bg-gray-200 text-gray-600'}`}>
                            {cafe.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm font-medium">{cafe.description}</p>
                      </div>
                      <div className="text-right">
                        <Link to={`/owner/cafes/${cafe.id}`}>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="border-owner-primary/30 text-owner-primary hover:bg-owner-primary/10"
                          >
                            Manage
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
            <Link to="/owner/orders">
              <Button 
                variant="outline" 
                size="sm" 
                className="border-owner-primary/30 text-owner-primary hover:bg-owner-primary/10"
              >
                View All
              </Button>
            </Link>
          </div>
          {orders.length === 0 ? (
            <Card className="food-card food-card-owner text-center p-8">
              <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
              <p className="text-gray-600">Orders will appear here once customers start placing them.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {orders.slice(0, 5).map((order) => (
                <Card key={order.id} className="food-card food-card-owner">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-gray-800">
                            Order #{order.order_number}
                          </h3>
                          <Badge className={`${order.status.toLowerCase() === 'pending' ? 'bg-owner-accent' : 
                            order.status.toLowerCase() === 'ready' ? 'bg-owner-success' : 'bg-owner-secondary'} text-white`}>
                            {order.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 font-medium">
                          {order.customer?.full_name || order.customer_name || 'Unknown Customer'} • {order.cafe_name || 'Demo Cafe'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-owner-primary">
                          {formatCurrency(order.total_amount)}
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(order.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Cafe Selector Modal */}
        {showCafeSelector && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Select Cafe for Menu Management</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowCafeSelector(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {cafes.length === 0 ? (
                  <div className="text-center py-8">
                    <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No cafes available</h3>
                    <p className="text-gray-600 mb-4">Create a cafe first to manage its menu.</p>
                    <Button 
                      variant="owner"
                      onClick={() => {
                        setShowCafeSelector(false)
                        setShowCreateCafe(true)
                      }}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Your First Cafe
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-gray-600 mb-4">Choose which cafe's menu you want to manage:</p>
                    {cafes.map((cafe) => (
                      <Card 
                        key={cafe.id} 
                        className="hover:bg-owner-primary/5 cursor-pointer transition-colors"
                        onClick={() => {
                          navigate(`/owner/cafes/${cafe.id}`)
                          setShowCafeSelector(false)
                        }}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-semibold text-gray-800">{cafe.name}</h4>
                              <p className="text-sm text-gray-600">{cafe.description}</p>
                            </div>
                            <Badge variant={cafe.is_active ? "default" : "secondary"}>
                              {cafe.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Create Cafe Modal */}
        {showCreateCafe && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Create New Cafe</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowCreateCafe(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCafe} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Cafe Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter cafe name"
                      value={newCafe.name}
                      onChange={handleCafeInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      placeholder="Brief description of your cafe"
                      value={newCafe.description}
                      onChange={handleCafeInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      name="address"
                      type="text"
                      placeholder="Cafe address"
                      value={newCafe.address}
                      onChange={handleCafeInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="text"
                      placeholder="Phone number"
                      value={newCafe.phone}
                      onChange={handleCafeInputChange}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowCreateCafe(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="owner"
                      className="flex-1"
                      disabled={createLoading}
                    >
                      {createLoading ? "Creating..." : "Create Cafe"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard