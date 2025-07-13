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
// Removed WebSocket import to fix connection issues
import { ArrowLeft, Clock, CheckCircle, XCircle, Package, Receipt, Edit, X } from 'lucide-react'

const OrderManagement = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [showUpdateModal, setShowUpdateModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [updateData, setUpdateData] = useState({
    status: '',
    estimated_preparation_time: ''
  })
  const [updateLoading, setUpdateLoading] = useState(false)

  const orderStatuses = [
    { value: 'PENDING', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'ACCEPTED', label: 'Accepted', color: 'bg-blue-100 text-blue-800' },
    { value: 'PREPARING', label: 'Preparing', color: 'bg-purple-100 text-purple-800' },
    { value: 'READY', label: 'Ready', color: 'bg-green-100 text-green-800' },
    { value: 'DELIVERED', label: 'Delivered', color: 'bg-green-400 text-gray-800' },
    { value: 'CANCELLED', label: 'Cancelled', color: 'bg-red-400 text-red-800' }
  ]

  // WebSocket for real-time updates
  const handleWebSocketMessage = (data) => {
    console.log('Received WebSocket message:', data)
    if (data.type === 'new_order') {
      toast({
        title: "New Order Received!",
        description: `Order #${data.order_number} from ${data.customer_name}`,
      })
      // Reload orders to show the new one
      loadOrders()
    } else if (data.type === 'order_cancelled') {
      toast({
        title: "Order Cancelled",
        description: `Order #${data.order_number} was cancelled by ${data.customer_name}`,
        variant: "destructive",
      })
      // Reload orders to show the cancellation
      loadOrders()
    }
  }


  useEffect(() => {
    loadOrders()
  }, [statusFilter])

  const loadOrders = async () => {
    setLoading(true)
    try {
      const response = await cafeOwnerAPI.getCafeOrders(statusFilter === 'all' ? undefined : statusFilter)
      // Sort orders by newest first (created_at descending)
      const sortedOrders = response.data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      setOrders(sortedOrders)
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to load orders.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateOrder = (order) => {
    setSelectedOrder(order)
    setUpdateData({
      status: order.status,
      estimated_preparation_time: order.estimated_preparation_time || ''
    })
    setShowUpdateModal(true)
  }

  const handleUpdateSubmit = async (e) => {
    e.preventDefault()
    setUpdateLoading(true)
    
    try {
      await cafeOwnerAPI.updateOrderStatus(selectedOrder.id, {
        status: updateData.status,
        estimated_preparation_time: updateData.estimated_preparation_time ? parseInt(updateData.estimated_preparation_time) : null
      })
      
      toast({
        title: "Success!",
        description: "Order status updated successfully.",
      })
      
      setShowUpdateModal(false)
      setSelectedOrder(null)
      loadOrders()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to update order status.",
        variant: "destructive",
      })
    } finally {
      setUpdateLoading(false)
    }
  }

  const getStatusBadge = (status) => {
    const statusInfo = orderStatuses.find(s => s.value === status)
    return statusInfo ? statusInfo : { label: status}
  }

  const filteredOrders = orders.filter(order => {
    if (statusFilter === 'all') return true
    return order.status === statusFilter
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center mb-6">
          <Link to="/owner" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Order Management</h1>
        </div>

        {/* Status Filter */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={statusFilter === 'all' ? 'owner' : 'outline'}
              onClick={() => setStatusFilter('all')}
              size="sm"
            >
              All Orders
            </Button>
            {orderStatuses.map((status) => (
              <Button
                key={status.value}
                variant={statusFilter === status.value ? 'owner' : 'outline'}
                onClick={() => setStatusFilter(status.value)}
                size="sm"
              >
                {status.label}
              </Button>
            ))}
          </div>
        </div>

        {loading ? (
          <Card className="text-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading orders...</p>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="text-center p-8">
            <Receipt className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">No orders found</h3>
            <p className="text-gray-600">
              {statusFilter === 'all' 
                ? 'No orders have been placed yet.' 
                : `No ${statusFilter.toLowerCase()} orders found.`}
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">Order #{order.order_number}</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        {order.customer_name} • {order.cafe_name || order.cafe?.name || 'Unknown Cafe'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(order.created_at).toLocaleDateString()} at {new Date(order.created_at).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusBadge(order.status).color}>
                        {getStatusBadge(order.status).label}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUpdateOrder(order)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Update
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {/* Order Items */}
                    <div>
                      <h4 className="font-medium mb-2">Items:</h4>
                      <div className="space-y-1">
                        {(order.order_items || order.items || []).map((item, index) => (
                          <div key={index} className="flex justify-between text-sm">
                            <span>{item.quantity}x {item.menu_item?.name || item.name || 'Unknown Item'}</span>
                            <span>{formatCurrency(item.total_price || item.price || 0)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Order Info */}
                    <div className="flex justify-between items-center pt-2 border-t">
                      <div className="flex items-center gap-4">
                        <span className="font-medium">Total: {formatCurrency(order.total_amount)}</span>
                        {order.estimated_preparation_time && (
                          <span className="text-sm text-gray-600 flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {order.estimated_preparation_time} min
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Special Instructions */}
                    {order.special_instructions && (
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <h4 className="font-medium text-sm mb-1">Special Instructions:</h4>
                        <p className="text-sm text-gray-700">{order.special_instructions}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Update Order Modal */}
        {showUpdateModal && selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-md">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Update Order #{selectedOrder.order_number}</CardTitle>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowUpdateModal(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUpdateSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="status">Order Status</Label>
                    <select
                      id="status"
                      value={updateData.status}
                      onChange={(e) => setUpdateData({...updateData, status: e.target.value})}
                      required
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-owner-primary focus:border-transparent"
                    >
                      {orderStatuses.map((status) => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="estimated_preparation_time">Estimated Preparation Time (minutes)</Label>
                    <Input
                      id="estimated_preparation_time"
                      type="number"
                      min="1"
                      placeholder="e.g., 15"
                      value={updateData.estimated_preparation_time}
                      onChange={(e) => setUpdateData({...updateData, estimated_preparation_time: e.target.value})}
                    />
                    <p className="text-xs text-gray-500">
                      Leave blank to keep current time estimate
                    </p>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowUpdateModal(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="owner"
                      className="flex-1"
                      disabled={updateLoading}
                    >
                      {updateLoading ? "Updating..." : "Update Order"}
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

export default OrderManagement