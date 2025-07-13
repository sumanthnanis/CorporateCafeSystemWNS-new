import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cafeOwnerAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Package, AlertTriangle, CheckCircle, RefreshCw, Plus, X } from 'lucide-react'

const InventoryManagement = () => {
  const [cafes, setCafes] = useState([])
  const [selectedCafe, setSelectedCafe] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [restockLoading, setRestockLoading] = useState({})
  const [showRestockModal, setShowRestockModal] = useState(false)
  const [restockItem, setRestockItem] = useState(null)
  const [restockQuantity, setRestockQuantity] = useState('')

  useEffect(() => {
    loadCafes()
  }, [])

  useEffect(() => {
    if (selectedCafe) {
      loadMenuItems()
    }
  }, [selectedCafe])

  const loadCafes = async () => {
    try {
      setLoading(true)
      const response = await cafeOwnerAPI.getMyCafes()
      setCafes(response.data)
      if (response.data.length > 0) {
        setSelectedCafe(response.data[0])
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load cafes. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadMenuItems = async () => {
    if (!selectedCafe) return
    
    try {
      const response = await cafeOwnerAPI.getMenuItems(selectedCafe.id)
      setMenuItems(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load menu items. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleToggleAvailability = async (itemId, currentStatus) => {
    try {
      await cafeOwnerAPI.toggleItemAvailability(itemId, !currentStatus)
      toast({
        title: "Success!",
        description: `Item marked as ${!currentStatus ? 'in stock' : 'out of stock'} successfully.`,
      })
      loadMenuItems()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update item availability. Please try again.",
        variant: "destructive",
      })
    }
  }

  const handleRestock = async () => {
    if (!restockItem || !restockQuantity) return

    try {
      setRestockLoading({ ...restockLoading, [restockItem.id]: true })
      
      await cafeOwnerAPI.restockItem(restockItem.id, parseInt(restockQuantity))
      
      toast({
        title: "Success!",
        description: `${restockItem.name} has been restocked successfully.`,
      })
      
      setShowRestockModal(false)
      setRestockItem(null)
      setRestockQuantity('')
      loadMenuItems()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to restock item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRestockLoading({ ...restockLoading, [restockItem.id]: false })
    }
  }

  const getStockStatus = (item) => {
    if (item.available_quantity <= 0) return 'outOfStock'
    if (item.available_quantity <= 5) return 'lowStock'
    return 'inStock'
  }

  const getStockBadgeVariant = (status) => {
    switch (status) {
      case 'outOfStock': return 'destructive'
      case 'lowStock': return 'warning'
      default: return 'default'
    }
  }

  const getStockIcon = (status) => {
    switch (status) {
      case 'outOfStock': return <AlertTriangle className="h-4 w-4" />
      case 'lowStock': return <AlertTriangle className="h-4 w-4" />
      default: return <CheckCircle className="h-4 w-4" />
    }
  }

  if (loading) {
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
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/owner" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Inventory Management</h1>
        </div>

        {cafes.length === 0 ? (
          <Card className="text-center p-8">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No Cafes Found</h3>
            <p className="text-gray-600 mb-4">Create your first cafe to manage inventory.</p>
            <Link to="/owner/cafes">
              <Button className="bg-owner-primary hover:bg-owner-secondary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Cafe
              </Button>
            </Link>
          </Card>
        ) : (
          <>
            {/* Cafe Selector */}
            {cafes.length > 1 && (
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Select Cafe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 overflow-x-auto">
                    {cafes.map((cafe) => (
                      <Button
                        key={cafe.id}
                        variant={selectedCafe?.id === cafe.id ? "default" : "outline"}
                        onClick={() => setSelectedCafe(cafe)}
                        className={selectedCafe?.id === cafe.id ? "bg-owner-primary hover:bg-owner-secondary text-white" : ""}
                      >
                        {cafe.name}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Inventory Items */}
            <div className="grid gap-4">
              {menuItems.length === 0 ? (
                <Card className="text-center p-8">
                  <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No Menu Items</h3>
                  <p className="text-gray-600 mb-4">Add menu items to manage their inventory.</p>
                  <Link to={`/owner/menu/${selectedCafe?.id}`}>
                    <Button className="bg-owner-primary hover:bg-owner-secondary text-white">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Menu Items
                    </Button>
                  </Link>
                </Card>
              ) : (
                menuItems.map((item) => {
                  const stockStatus = getStockStatus(item)
                  return (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                              <Badge variant={getStockBadgeVariant(stockStatus)} className="flex items-center gap-1">
                                {getStockIcon(stockStatus)}
                                {stockStatus === 'outOfStock' ? 'Out of Stock' : 
                                 stockStatus === 'lowStock' ? 'Low Stock' : 'In Stock'}
                              </Badge>
                              {!item.is_available && (
                                <Badge variant="outline" className="text-gray-500">
                                  Marked Out of Stock
                                </Badge>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span>Price: {formatCurrency(item.price)}</span>
                              <span>Available: {item.available_quantity}</span>
                              <span>Max Daily: {item.max_daily_quantity}</span>
                              <span>Category: {item.category?.name}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleAvailability(item.id, item.is_available)}
                              className={item.is_available ? "text-orange-600 hover:text-orange-700" : "text-green-600 hover:text-green-700"}
                            >
                              {item.is_available ? 'Mark Out of Stock' : 'Mark In Stock'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRestockItem(item)
                                setRestockQuantity(item.max_daily_quantity.toString())
                                setShowRestockModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Restock
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </>
        )}

        {/* Restock Modal */}
        {showRestockModal && restockItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Restock Item</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => {
                    setShowRestockModal(false)
                    setRestockItem(null)
                    setRestockQuantity('')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mb-4">
                <h3 className="font-semibold text-lg">{restockItem.name}</h3>
                <p className="text-gray-600 text-sm">Current stock: {restockItem.available_quantity}</p>
                <p className="text-gray-600 text-sm">Max daily quantity: {restockItem.max_daily_quantity}</p>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="quantity">Restock Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(e.target.value)}
                    placeholder="Enter quantity to restock"
                    min="0"
                    max="1000"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty or use max daily quantity to reset to full stock
                  </p>
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setShowRestockModal(false)
                      setRestockItem(null)
                      setRestockQuantity('')
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleRestock}
                    disabled={restockLoading[restockItem.id]}
                    className="flex-1 bg-owner-primary hover:bg-owner-secondary text-white"
                  >
                    {restockLoading[restockItem.id] ? 'Restocking...' : 'Restock'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default InventoryManagement