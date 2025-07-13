import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { employeeAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
// Removed WebSocket import to fix connection issues
import { ArrowLeft, Plus, Minus, Clock, ShoppingCart } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const CafeMenu = () => {
  const { cafeId } = useParams()
  const { addItem, updateQuantity, getItemCount, items } = useCartStore()
  const [cafe, setCafe] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCafeData()
    loadCategories()
  }, [cafeId])

  useEffect(() => {
    if (cafeId) {
      loadCafeData()
    }
  }, [selectedCategory])

  const loadCafeData = async () => {
    try {
      const [cafeResponse, menuResponse] = await Promise.all([
        employeeAPI.getCafes(),
        employeeAPI.getCafeMenu(cafeId, selectedCategory)
      ])
      
      // Find the current cafe from the list
      const currentCafe = cafeResponse.data.find(c => c.id === parseInt(cafeId))
      setCafe(currentCafe)
      setMenuItems(menuResponse.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load menu. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await employeeAPI.getCafeCategories(cafeId)
      setCategories(response.data)
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const handleAddToCart = (item) => {
    addItem({
      ...item,
      cafe_id: parseInt(cafeId),
      cafe_name: cafe?.name || 'Unknown Cafe'
    })
    toast({
      title: "Added to Cart",
      description: `${item.name} has been added to your cart.`,
    })
  }

  const handleQuantityChange = (item, change) => {
    const cartItem = items.find(cartItem => cartItem.id === item.id)
    if (cartItem) {
      const newQuantity = cartItem.quantity + change
      if (newQuantity <= 0) {
        updateQuantity(item.id, 0) // This will remove the item
        toast({
          title: "Removed from Cart",
          description: `${item.name} has been removed from your cart.`,
        })
      } else if (newQuantity <= item.available_quantity) {
        updateQuantity(item.id, newQuantity)
      } else {
        toast({
          title: "Stock Limit",
          description: `Only ${item.available_quantity} items available.`,
          variant: "destructive",
        })
      }
    }
  }

  const getItemQuantityInCart = (itemId) => {
    const cartItem = items.find(item => item.id === itemId)
    return cartItem ? cartItem.quantity : 0
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
            <Link to="/employee/cafes" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                {cafe?.name || 'Cafe Menu'}
              </h1>
              <p className="text-gray-600">{cafe?.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link to="/employee/cart">
              <Button variant="employee" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {getItemCount() > 0 && (
                  <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center text-xs">
                    {getItemCount()}
                  </Badge>
                )}
              </Button>
            </Link>
          </div>
        </div>

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Button
              variant={selectedCategory === null ? "employee" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
            >
              All
            </Button>
            {categories.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "employee" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </Button>
            ))}
          </div>
        </div>

        {/* Menu Items */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {menuItems.filter(item => item.available_quantity > 0).map((item) => (
              <Card key={item.id} className="food-card food-card-employee">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-bold text-lg text-gray-800">{item.name}</h3>
                        {item.available_quantity <= 5 && item.available_quantity > 0 && (
                          <Badge variant="outline" className="text-xs border-employee-accent text-employee-accent">
                            Only {item.available_quantity} left
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">{item.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.preparation_time} min
                        </span>
                        <span>Stock: {item.available_quantity}</span>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="font-bold text-xl text-employee-primary mb-3">
                        {formatCurrency(item.price)}
                      </p>
                      {getItemQuantityInCart(item.id) > 0 ? (
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => handleQuantityChange(item, -1)}
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0"
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="font-semibold text-lg min-w-[2rem] text-center">
                            {getItemQuantityInCart(item.id)}
                          </span>
                          <Button
                            onClick={() => handleQuantityChange(item, 1)}
                            size="sm"
                            className="food-button food-button-employee h-8 w-8 p-0"
                            disabled={getItemQuantityInCart(item.id) >= item.available_quantity}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          onClick={() => handleAddToCart(item)}
                          disabled={!item.is_available || item.available_quantity <= 0}
                          className="add-to-cart-button bg-gray-800 hover:bg-gray-700 text-white"
                          size="sm"
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add to Cart
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CafeMenu