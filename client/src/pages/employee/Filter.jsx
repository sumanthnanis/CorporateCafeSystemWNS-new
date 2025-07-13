import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { employeeAPI } from '@/lib/api'
import { useCartStore } from '@/store/cartStore'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Filter as FilterIcon, 
  Plus, 
  Minus,
  MapPin,
  Clock,
  ShoppingCart,
  X
} from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const Filter = () => {
  const [filterResults, setFilterResults] = useState([])
  const [cafes, setCafes] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    cafe_id: '',
    category_id: '',
    min_price: '',
    max_price: '',
    available_only: true
  })
  const { addItem, updateQuantity, getItemCount, items } = useCartStore()

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    try {
      const [cafesResponse, categoriesResponse] = await Promise.all([
        employeeAPI.getCafes(),
        employeeAPI.getCategories()
      ])
      setCafes(cafesResponse.data)
      setCategories(categoriesResponse.data)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    }
  }

  const performFilter = async () => {
    setLoading(true)
    try {
      // Clean up filters - remove empty values
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([key, value]) => {
          if (typeof value === 'boolean') return true
          return value !== ''
        })
      )

      const response = await employeeAPI.filterMenuItems(cleanFilters)
      setFilterResults(response.data)
    } catch (error) {
      toast({
        title: "Filter Error",
        description: "Failed to filter menu items. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const clearFilters = () => {
    setFilters({
      cafe_id: '',
      category_id: '',
      min_price: '',
      max_price: '',
      available_only: true
    })
    setFilterResults([])
  }

  const handleAddToCart = (menuItem) => {
    // Find the cafe for this menu item
    const cafe = cafes.find(c => c.id === menuItem.cafe_id)
    
    addItem({
      id: menuItem.id,
      name: menuItem.name,
      description: menuItem.description,
      price: menuItem.price,
      cafe_id: menuItem.cafe_id,
      cafe_name: cafe?.name || 'Unknown Cafe'
    })
    
    toast({
      title: "Added to Cart",
      description: `${menuItem.name} has been added to your cart.`,
    })
  }

  const handleUpdateQuantity = (item, newQuantity) => {
    if (newQuantity <= 0) {
      return
    }
    updateQuantity(item.id, newQuantity)
  }

  // Removed WebSocket functionality to fix connection issues


  const getStockStatus = (item) => {
    if (item.available_quantity <= 0) return 'outOfStock'
    if (item.available_quantity <= 5) return 'lowStock'
    return 'inStock'
  }

  return (
    <div className="min-h-screen bg-white employee-theme">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/employee" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Advanced Filter</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Filter Form */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilterIcon className="h-5 w-5" />
              Filter Menu Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Cafe Filter */}
              <div>
                <Label htmlFor="cafe">Cafe</Label>
                <select
                  id="cafe"
                  value={filters.cafe_id}
                  onChange={(e) => handleFilterChange('cafe_id', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-employee-primary focus:border-transparent"
                >
                  <option value="">All Cafes</option>
                  {cafes.map((cafe) => (
                    <option key={cafe.id} value={cafe.id}>
                      {cafe.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Category Filter */}
              <div>
                <Label htmlFor="category">Category</Label>
                <select
                  id="category"
                  value={filters.category_id}
                  onChange={(e) => handleFilterChange('category_id', e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-employee-primary focus:border-transparent"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Available Only Toggle */}
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="available_only"
                  checked={filters.available_only}
                  onChange={(e) => handleFilterChange('available_only', e.target.checked)}
                  className="w-4 h-4 text-employee-primary bg-gray-100 border-gray-300 rounded focus:ring-employee-primary"
                />
                <Label htmlFor="available_only">Show only available items</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Price Range */}
              <div>
                <Label htmlFor="min_price">Minimum Price</Label>
                <Input
                  id="min_price"
                  type="number"
                  placeholder="0.00"
                  value={filters.min_price}
                  onChange={(e) => handleFilterChange('min_price', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>

              <div>
                <Label htmlFor="max_price">Maximum Price</Label>
                <Input
                  id="max_price"
                  type="number"
                  placeholder="100.00"
                  value={filters.max_price}
                  onChange={(e) => handleFilterChange('max_price', e.target.value)}
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button onClick={performFilter} variant="employee" disabled={loading}>
                <FilterIcon className="h-4 w-4 mr-2" />
                {loading ? 'Filtering...' : 'Apply Filters'}
              </Button>
              <Button onClick={clearFilters} variant="outline">
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter Results */}
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Filtering menu items...</p>
          </div>
        ) : filterResults.length > 0 ? (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-800">
              Found {filterResults.length} menu item(s)
            </h2>
            {filterResults.map((item) => {
              const cafe = cafes.find(c => c.id === item.cafe_id)
              const category = categories.find(c => c.id === item.category_id)
              const stockStatus = getStockStatus(item)
              const currentQuantity = getItemCount(item.id)
              
              return (
                <Card key={item.id} className="food-card food-card-employee">
                  <CardContent className="p-5">
                    <div className="flex justify-between items-start">
                      <div className="flex-1 pr-4">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {category?.name || 'Unknown Category'}
                          </Badge>
                          {stockStatus === 'lowStock' && (
                            <Badge variant="outline" className="text-xs border-employee-accent text-employee-accent">
                              Only {item.available_quantity} left
                            </Badge>
                          )}
                          {stockStatus === 'outOfStock' && (
                            <Badge variant="destructive" className="text-xs">Out of Stock</Badge>
                          )}
                          {!item.is_available && (
                            <Badge variant="destructive" className="text-xs">Disabled</Badge>
                          )}
                        </div>
                        
                        <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                          {item.description}
                        </p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            <span>{cafe?.name || 'Unknown Cafe'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{item.preparation_time} min</span>
                          </div>
                          <span>Stock: {item.available_quantity}</span>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <span className="text-xl font-bold text-employee-primary">
                            {formatCurrency(item.price)}
                          </span>
                          
                          <div className="flex gap-2">
                            <Link to={`/employee/cafes/${item.cafe_id}`}>
                              <Button variant="outline" size="sm" className="text-xs">
                                Visit Cafe
                              </Button>
                            </Link>
                            
                            {currentQuantity > 0 ? (
                              <div className="flex items-center gap-1">
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item, currentQuantity - 1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-semibold">{currentQuantity}</span>
                                <Button
                                  size="icon"
                                  variant="outline"
                                  className="h-8 w-8"
                                  onClick={() => handleUpdateQuantity(item, currentQuantity + 1)}
                                  disabled={!item.is_available || item.available_quantity <= 0}
                                >
                                  <Plus className="h-3 w-3" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                className="food-button food-button-employee"
                                size="sm"
                                onClick={() => handleAddToCart(item)}
                                disabled={!item.is_available || item.available_quantity <= 0}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Add
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : filterResults.length === 0 && (filters.cafe_id || filters.category_id || filters.min_price || filters.max_price) ? (
          <Card className="text-center p-8">
            <FilterIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No results found</h3>
            <p className="text-gray-600">
              No menu items match your current filters. Try adjusting your criteria.
            </p>
          </Card>
        ) : (
          <Card className="text-center p-8">
            <FilterIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Advanced Filter</h3>
            <p className="text-gray-600">
              Use the filters above to find specific menu items across all cafes by location, category, price range, and availability.
            </p>
            <div className="mt-4 space-y-2 text-sm text-gray-500">
              <p><strong>Examples:</strong></p>
              <p>• Find all beverages under $5.00</p>
              <p>• Find main courses from a specific cafe</p>
              <p>• Find available items within your budget</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  )
}

export default Filter