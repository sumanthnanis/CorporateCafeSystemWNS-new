import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cafeOwnerAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Edit, Trash2, Package, Store, X, Receipt, Clock } from 'lucide-react'

const MenuManagement = () => {
  const { cafeId } = useParams()
  const [cafe, setCafe] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [categories, setCategories] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddItem, setShowAddItem] = useState(false)
  const [showEditItem, setShowEditItem] = useState(false)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [editLoading, setEditLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [categoryLoading, setCategoryLoading] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletingItem, setDeletingItem] = useState(null)
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    max_daily_quantity: '',
    preparation_time: '15',
    category_id: ''
  })
  const [editItem, setEditItem] = useState({
    name: '',
    description: '',
    price: '',
    max_daily_quantity: '',
    preparation_time: '15',
    category_id: ''
  })
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (cafeId) {
      loadCafeData()
    } else {
      loadAllCafes()
    }
    loadCategories()
  }, [cafeId])

  const loadCafeData = async () => {
    try {
      setLoading(true)
      const [cafeResponse, menuResponse, ordersResponse] = await Promise.all([
        cafeOwnerAPI.getCafe(cafeId),
        cafeOwnerAPI.getMenuItems(cafeId),
        cafeOwnerAPI.getSpecificCafeOrders(cafeId)
      ])
      setCafe(cafeResponse.data)
      setMenuItems(menuResponse.data)
      setOrders(ordersResponse.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load cafe data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllCafes = async () => {
    // This function is for future use when showing all cafes
    setLoading(false)
  }

  const loadCategories = async () => {
    try {
      const response = await cafeOwnerAPI.getCategories()
      // If this is a specific cafe, only show categories that have items in this cafe
      if (cafeId) {
        const cafeMenuResponse = await cafeOwnerAPI.getMenuItems(cafeId)
        const cafeMenuItems = cafeMenuResponse.data || []
        const cafeCategoryIds = [...new Set(cafeMenuItems.map(item => item.category_id))]
        
        // Include all categories for dropdown, but prioritize cafe-specific ones
        setCategories(response.data)
      } else {
        setCategories(response.data)
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const getOrderStatusVariant = (status) => {
    switch (status) {
      case 'PENDING': return 'secondary'
      case 'ACCEPTED': return 'default'
      case 'PREPARING': return 'default'
      case 'READY': return 'default'
      case 'DELIVERED': return 'outline'
      case 'CANCELLED': return 'destructive'
      default: return 'outline'
    }
  }

  const getOrderStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Pending'
      case 'ACCEPTED': return 'Accepted'
      case 'PREPARING': return 'Preparing'
      case 'READY': return 'Ready'
      case 'DELIVERED': return 'Delivered'
      case 'CANCELLED': return 'Cancelled'
      default: return status
    }
  }

  const handleAddItem = async (e) => {
    e.preventDefault()
    setAddLoading(true)
    
    try {
      await cafeOwnerAPI.createMenuItem(cafeId, {
        ...newItem,
        price: parseFloat(newItem.price),
        max_daily_quantity: parseInt(newItem.max_daily_quantity),
        preparation_time: parseInt(newItem.preparation_time),
        category_id: parseInt(newItem.category_id)
      })
      
      toast({
        title: "Success!",
        description: "Menu item has been added successfully.",
      })
      
      // Reset form and close modal
      setNewItem({
        name: '',
        description: '',
        price: '',
        max_daily_quantity: '',
        preparation_time: '15',
        category_id: ''
      })
      setShowAddItem(false)
      
      // Reload menu items
      loadCafeData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to add menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setNewItem({
      ...newItem,
      [e.target.name]: e.target.value
    })
  }

  const handleEditInputChange = (e) => {
    setEditItem({
      ...editItem,
      [e.target.name]: e.target.value
    })
  }

  const handleCategoryInputChange = (e) => {
    setNewCategory({
      ...newCategory,
      [e.target.name]: e.target.value
    })
  }

  const handleEditItem = (item) => {
    setEditingItem(item)
    setEditItem({
      name: item.name || '',
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      max_daily_quantity: item.max_daily_quantity ? item.max_daily_quantity.toString() : '',
      preparation_time: item.preparation_time ? item.preparation_time.toString() : '15',
      category_id: item.category_id ? item.category_id.toString() : ''
    })
    setShowEditItem(true)
  }

  const handleUpdateItem = async (e) => {
    e.preventDefault()
    setEditLoading(true)
    
    try {
      await cafeOwnerAPI.updateMenuItem(editingItem.id, {
        ...editItem,
        price: parseFloat(editItem.price),
        max_daily_quantity: parseInt(editItem.max_daily_quantity),
        preparation_time: parseInt(editItem.preparation_time),
        category_id: parseInt(editItem.category_id)
      })
      
      toast({
        title: "Success!",
        description: "Menu item has been updated successfully.",
      })
      
      setShowEditItem(false)
      setEditingItem(null)
      loadCafeData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setEditLoading(false)
    }
  }

  const handleDeleteItem = (item) => {
    setDeletingItem(item)
    setShowDeleteConfirm(true)
  }

  const confirmDeleteItem = async () => {
    if (!deletingItem) return
    
    setDeleteLoading(true)
    try {
      await cafeOwnerAPI.deleteMenuItem(deletingItem.id)
      
      toast({
        title: "Success!",
        description: "Menu item has been deleted successfully.",
      })
      
      setShowDeleteConfirm(false)
      setDeletingItem(null)
      loadCafeData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to delete menu item. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    setCategoryLoading(true)
    
    try {
      await cafeOwnerAPI.createCategory(newCategory)
      
      toast({
        title: "Success!",
        description: "Category has been created successfully.",
      })
      
      setNewCategory({ name: '', description: '' })
      setShowAddCategory(false)
      loadCategories()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCategoryLoading(false)
    }
  }

  const handleRestockItem = async (item) => {
    try {
      await cafeOwnerAPI.restockItem(item.id, item.max_daily_quantity)
      
      toast({
        title: "Success!",
        description: `${item.name} has been restocked successfully.`,
      })
      
      loadCafeData()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to restock item. Please try again.",
        variant: "destructive",
      })
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
          <h1 className="text-2xl font-bold text-gray-800">
            {cafe ? `${cafe.name} - Menu Management` : 'Menu Management'}
          </h1>
        </div>

        {cafeId && cafe ? (
          <div>
            {/* Cafe Info */}
            <Card className="mb-6">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">{cafe.name}</h2>
                    <p className="text-gray-600">{cafe.description}</p>
                  </div>
                  <Badge variant={cafe.is_active ? "default" : "secondary"}>
                    {cafe.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Categories Management */}
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Categories</CardTitle>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddCategory(true)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Category
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {categories.map((category) => (
                    <Badge key={category.id} variant="outline" className="px-3 py-1">
                      {category.name}
                    </Badge>
                  ))}
                  {categories.length === 0 && (
                    <p className="text-gray-500 text-sm">No categories available. Add some categories to organize your menu items.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Menu Items */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Menu Items</h2>
              <Button 
                variant="owner"
                onClick={() => setShowAddItem(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </div>

            {menuItems.length === 0 ? (
              <Card className="text-center p-8">
                <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">No menu items yet</h3>
                <p className="text-gray-600 mb-4">Start building your menu by adding your first item!</p>
                <Button 
                  variant="owner"
                  onClick={() => setShowAddItem(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Menu Item
                </Button>
              </Card>
            ) : (
              <div className="grid gap-4">
                {menuItems.map((item) => (
                  <Card key={item.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-lg">{item.name}</h3>
                            <Badge variant={item.is_available ? "default" : "secondary"}>
                              {item.is_available ? "Available" : "Unavailable"}
                            </Badge>
                            <Badge variant="outline">
                              {item.category.name}
                            </Badge>
                          </div>
                          <p className="text-gray-600 text-sm mb-2">{item.description}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-bold text-lg text-owner-primary">
                              {formatCurrency(item.price)}
                            </span>
                            <span className="text-gray-500">
                              Stock: {item.available_quantity}/{item.max_daily_quantity}
                            </span>
                            <span className="text-gray-500">
                              Prep time: {item.preparation_time}min
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {item.available_quantity === 0 && (
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-green-600 hover:text-green-700"
                              onClick={() => handleRestockItem(item)}
                            >
                              <Package className="h-4 w-4 mr-1" />
                              Restock
                            </Button>
                          )}
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleEditItem(item)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleDeleteItem(item)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Recent Orders for this Cafe */}
            <div className="mt-8">
              <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
              {orders.length === 0 ? (
                <Card className="text-center p-8">
                  <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders yet</h3>
                  <p className="text-gray-600">Orders for this cafe will appear here once customers start placing them.</p>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.slice(0, 5).map((order) => (
                    <Card key={order.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h3 className="font-semibold text-gray-800">
                                Order #{order.order_number}
                              </h3>
                              <Badge variant={getOrderStatusVariant(order.status)}>
                                {getOrderStatusLabel(order.status)}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 mb-1">
                              Customer: {order.customer_name || order.customer?.full_name || 'Unknown Customer'}
                            </p>
                            <p className="text-sm text-gray-600 mb-2">
                              Items: {(order.items || order.order_items || []).length} • Total: {formatCurrency(order.total_amount)}
                            </p>
                            {order.estimated_preparation_time && (
                              <div className="flex items-center gap-1 text-sm text-gray-500">
                                <Clock className="h-4 w-4" />
                                <span>Est. {order.estimated_preparation_time} minutes</span>
                              </div>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            <p>{new Date(order.created_at).toLocaleDateString()}</p>
                            <p>{new Date(order.created_at).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {orders.length > 5 && (
                    <div className="text-center pt-4">
                      <Link to="/owner/orders">
                        <Button variant="outline" size="sm">
                          View All Orders
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <Card className="text-center p-8">
            <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Menu Management</h3>
            <p className="text-gray-600 mb-4">Select a cafe from your dashboard to manage its menu.</p>
            <Link to="/owner">
              <Button variant="owner">
                Go to Dashboard
              </Button>
            </Link>
          </Card>
        )}

        {/* Add Menu Item Modal */}
        {showAddItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add Menu Item</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowAddItem(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Item Name</Label>
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Enter item name"
                      value={newItem.name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      name="description"
                      type="text"
                      placeholder="Brief description"
                      value={newItem.description}
                      onChange={handleInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category_id">Category</Label>
                    <select
                      id="category_id"
                      name="category_id"
                      value={newItem.category_id}
                      onChange={handleInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-owner-primary focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($)</Label>
                      <Input
                        id="price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={newItem.price}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="preparation_time">Prep Time (min)</Label>
                      <Input
                        id="preparation_time"
                        name="preparation_time"
                        type="number"
                        min="1"
                        placeholder="15"
                        value={newItem.preparation_time}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="max_daily_quantity">Daily Stock Quantity</Label>
                    <Input
                      id="max_daily_quantity"
                      name="max_daily_quantity"
                      type="number"
                      min="1"
                      placeholder="50"
                      value={newItem.max_daily_quantity}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddItem(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="owner"
                      className="flex-1"
                      disabled={addLoading}
                    >
                      {addLoading ? "Adding..." : "Add Item"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Edit Menu Item Modal */}
        {showEditItem && editingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Edit Menu Item</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowEditItem(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateItem} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="edit_name">Item Name</Label>
                    <Input
                      id="edit_name"
                      name="name"
                      type="text"
                      placeholder="Enter item name"
                      value={editItem.name}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_description">Description</Label>
                    <Input
                      id="edit_description"
                      name="description"
                      type="text"
                      placeholder="Brief description"
                      value={editItem.description}
                      onChange={handleEditInputChange}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_category_id">Category</Label>
                    <select
                      id="edit_category_id"
                      name="category_id"
                      value={editItem.category_id}
                      onChange={handleEditInputChange}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-owner-primary focus:border-transparent"
                    >
                      <option value="">Select a category</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="edit_price">Price ($)</Label>
                      <Input
                        id="edit_price"
                        name="price"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={editItem.price}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="edit_preparation_time">Prep Time (min)</Label>
                      <Input
                        id="edit_preparation_time"
                        name="preparation_time"
                        type="number"
                        min="1"
                        placeholder="15"
                        value={editItem.preparation_time}
                        onChange={handleEditInputChange}
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="edit_max_daily_quantity">Daily Stock Quantity</Label>
                    <Input
                      id="edit_max_daily_quantity"
                      name="max_daily_quantity"
                      type="number"
                      min="1"
                      placeholder="50"
                      value={editItem.max_daily_quantity}
                      onChange={handleEditInputChange}
                      required
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowEditItem(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="owner"
                      className="flex-1"
                      disabled={editLoading}
                    >
                      {editLoading ? "Updating..." : "Update Item"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && deletingItem && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="text-red-600">Delete Menu Item</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  Are you sure you want to delete "{deletingItem.name}"? This action cannot be undone.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => setShowDeleteConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    className="flex-1"
                    onClick={confirmDeleteItem}
                    disabled={deleteLoading}
                  >
                    {deleteLoading ? "Deleting..." : "Delete"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Add New Category</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowAddCategory(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddCategory} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="category_name">Category Name</Label>
                    <Input
                      id="category_name"
                      name="name"
                      type="text"
                      placeholder="e.g., Beverages, Main Courses, Desserts"
                      value={newCategory.name}
                      onChange={handleCategoryInputChange}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="category_description">Description (Optional)</Label>
                    <Input
                      id="category_description"
                      name="description"
                      type="text"
                      placeholder="Brief description of this category"
                      value={newCategory.description}
                      onChange={handleCategoryInputChange}
                    />
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowAddCategory(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="owner"
                      className="flex-1"
                      disabled={categoryLoading}
                    >
                      {categoryLoading ? "Creating..." : "Create Category"}
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

export default MenuManagement