import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { employeeAPI, ordersAPI, feedbackAPI } from '@/lib/api'
import { formatCurrency, formatDate } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
// Removed WebSocket import to fix connection issues
import { useAuth } from '@/context/AuthContext'
import { ArrowLeft, Clock, MapPin, Phone, Star, MessageCircle } from 'lucide-react'
import FeedbackForm from '@/components/FeedbackForm'

const OrderTracking = () => {
  const { orderId } = useParams()
  const { user } = useAuth()
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [feedback, setFeedback] = useState(null)
  const [canFeedback, setCanFeedback] = useState(false)
  const [showFeedbackForm, setShowFeedbackForm] = useState(false)

  // Removed WebSocket real-time updates to fix connection issues

  useEffect(() => {
    loadOrder()
    loadFeedback()
    checkCanFeedback()
  }, [orderId])

  const loadOrder = async () => {
    try {
      const response = await employeeAPI.getOrderDetails(orderId)
      setOrder(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load order details. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadFeedback = async () => {
    try {
      const response = await feedbackAPI.getFeedback(orderId)
      setFeedback(response.data)
    } catch (error) {
      // It's okay if feedback doesn't exist yet
      setFeedback(null)
    }
  }

  const checkCanFeedback = async () => {
    try {
      const response = await feedbackAPI.canGiveFeedback(orderId)
      setCanFeedback(response.data.can_feedback)
    } catch (error) {
      setCanFeedback(false)
    }
  }

  const handleFeedbackSubmit = async (feedbackData) => {
    try {
      await feedbackAPI.createFeedback(orderId, feedbackData)
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback! It helps us improve our service.",
      })
      loadFeedback()
      setCanFeedback(false)
    } catch (error) {
      throw error // Let FeedbackForm handle the error
    }
  }

  const handleCancelOrder = async () => {
    if (order?.status !== 'PENDING') {
      toast({
        title: "Cannot Cancel",
        description: "Only pending orders can be cancelled.",
        variant: "destructive",
      })
      return
    }

    try {
      await ordersAPI.cancelOrder(orderId)
      toast({
        title: "Order Cancelled",
        description: "Your order has been cancelled successfully.",
      })
      loadOrder() // Refresh order data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel order. Please try again.",
        variant: "destructive",
      })
    }
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

  const getStatusSteps = () => {
    const statuses = ['PENDING', 'ACCEPTED', 'PREPARING', 'READY', 'DELIVERED']
    const currentIndex = statuses.indexOf(order?.status)
    return statuses.map((status, index) => ({
      status,
      completed: index <= currentIndex,
      current: index === currentIndex,
    }))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white employee-theme">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary"></div>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white employee-theme">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Order Not Found</h1>
            <Link to="/employee/orders">
              <Button variant="employee">Back to Orders</Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white employee-theme">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Link to="/employee/orders" className="mr-4">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-gray-800">
                Order #{order.order_number}
              </h1>
            </div>
            <p className="text-gray-600">Placed on {formatDate(order.created_at)}</p>
          </div>
        </div>

        {/* Order Status */}
        <Card className="mb-6 border-2 border-employee-primary/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-employee-primary">Order Status</CardTitle>
              <Badge variant={getStatusColor(order.status)} className="text-sm">
                {order.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Status Timeline */}
              <div className="flex justify-between items-center">
                {getStatusSteps().map((step, index) => (
                  <div key={step.status} className="flex flex-col items-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step.completed 
                        ? 'bg-employee-success text-white' 
                        : 'bg-gray-300 text-gray-600'
                    }`}>
                      {index + 1}
                    </div>
                    <span className={`text-xs mt-1 ${
                      step.current ? 'text-employee-primary font-semibold' : 'text-gray-500'
                    }`}>
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>

              {/* Estimated Time */}
              {order.estimated_preparation_time && order.status !== 'DELIVERED' && (
                <div className="flex items-center justify-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Estimated preparation time: {order.estimated_preparation_time} minutes
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Cafe Information */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Cafe Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">{order.cafe.name}</h3>
              <p className="text-gray-600">{order.cafe.description}</p>
              <div className="flex items-center text-sm text-gray-500">
                <MapPin className="h-4 w-4 mr-1" />
                {order.cafe.address}
              </div>
              {order.cafe.phone && (
                <div className="flex items-center text-sm text-gray-500">
                  <Phone className="h-4 w-4 mr-1" />
                  {order.cafe.phone}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Order Items */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items.map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-semibold">{item.menu_item.name}</h4>
                    <p className="text-sm text-gray-600">{item.menu_item.description}</p>
                    <p className="text-sm text-gray-500">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(item.total_price)}</p>
                    <p className="text-sm text-gray-500">
                      {formatCurrency(item.unit_price)} each
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>Free</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(order.total_amount)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Feedback Section */}
        {(feedback || canFeedback) && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" />
                Order Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              {feedback ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Your Rating:</span>
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-4 h-4 ${
                            star <= feedback.rating 
                              ? 'text-yellow-400 fill-yellow-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({feedback.rating}/5)
                    </span>
                  </div>
                  {feedback.feedback_text && (
                    <div>
                      <p className="text-sm font-medium mb-1">Your Review:</p>
                      <p className="text-sm text-gray-600 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                        {feedback.feedback_text}
                      </p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500">
                    Submitted on {formatDate(feedback.created_at)}
                  </p>
                </div>
              ) : canFeedback ? (
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-employee-primary">
                    <MessageCircle className="h-5 w-5" />
                    <span className="font-medium">Share your experience!</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Your order has been completed. How was your experience?
                  </p>
                  <Button 
                    onClick={() => setShowFeedbackForm(true)}
                    className="bg-employee-primary hover:bg-employee-primary/90"
                  >
                    Rate this Order
                  </Button>
                </div>
              ) : null}
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4">
          {order.status === 'PENDING' && (
            <Button 
              onClick={handleCancelOrder}
              variant="destructive"
              className="flex-1"
            >
              Cancel Order
            </Button>
          )}
          <Link to="/employee/orders" className="flex-1">
            <Button variant="outline" className="w-full">
              Back to Orders
            </Button>
          </Link>
        </div>

        {/* Feedback Form Modal */}
        <FeedbackForm 
          isOpen={showFeedbackForm}
          onClose={() => setShowFeedbackForm(false)}
          onSubmit={handleFeedbackSubmit}
          orderDetails={order}
        />
      </div>
    </div>
  )
}

export default OrderTracking