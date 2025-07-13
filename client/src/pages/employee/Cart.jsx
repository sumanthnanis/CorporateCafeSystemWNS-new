import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/store/cartStore'
import { ordersAPI } from '@/lib/api'
import { formatCurrency } from '@/lib/utils'
import { toast } from '@/hooks/use-toast'
import PaymentModal from '@/components/PaymentModal'
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const Cart = () => {
  const navigate = useNavigate()
  const { items, cafeId, cafeName, updateQuantity, removeItem, clearCart, getTotal } = useCartStore()
  const [loading, setLoading] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [currentOrder, setCurrentOrder] = useState(null)

  const handleUpdateQuantity = (itemId, newQuantity) => {
    updateQuantity(itemId, newQuantity)
  }

  const handleRemoveItem = (itemId) => {
    removeItem(itemId)
    toast({
      title: "Item Removed",
      description: "Item has been removed from your cart.",
    })
  }

  const handleCheckout = () => {
    if (items.length === 0) return

    // Create a mock order object for payment modal
    const mockOrder = {
      id: null, // No order ID yet - will be created after payment
      order_number: "PENDING",
      total_amount: getTotal(),
      cafe: {
        id: cafeId,
        name: cafeName
      },
      order_items: items.map(item => ({
        id: null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        menu_item: {
          id: item.id,
          name: item.name,
          description: item.description,
          price: item.price
        }
      }))
    }

    setCurrentOrder(mockOrder)
    setShowPaymentModal(true)
  }

  const handlePaymentSuccess = (paymentResult) => {
    clearCart()
    // Add slight delay to ensure proper state cleanup
    setTimeout(() => {
      navigate(`/employee/orders/${paymentResult.order.id}`)
    }, 100)
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white employee-theme">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Link to="/employee" className="mr-4">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
              </Link>
              <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
            </div>
            <ThemeToggle />
          </div>

          <Card className="text-center p-8">
            <div className="flex justify-center mb-4">
              <ShoppingCart className="h-16 w-16 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Your cart is empty</h3>
            <p className="text-gray-600 mb-4">Add some delicious items to get started!</p>
            <Link to="/employee/cafes">
              <Button variant="employee" size="lg">
                Browse Cafes
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    )
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
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Your Cart</h1>
              <p className="text-gray-600">From {cafeName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button 
              onClick={clearCart}
              variant="outline"
              size="sm"
            >
              Clear Cart
            </Button>
          </div>
        </div>

        {/* Cart Items */}
        <div className="space-y-4 mb-6">
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg text-gray-800">{item.name}</h3>
                    <p className="text-gray-600 text-sm">{item.description}</p>
                    <p className="text-employee-primary font-semibold">
                      {formatCurrency(item.price)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus className="h-4 w-4" />
                    </Button>
                    <span className="w-8 text-center font-semibold">{item.quantity}</span>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      onClick={() => handleRemoveItem(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <div className="mt-2 text-right">
                  <p className="text-sm text-gray-600">
                    Subtotal: {formatCurrency(item.price * item.quantity)}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Order Summary */}
        <Card className="border-2 border-employee-primary/20">
          <CardHeader>
            <CardTitle className="text-employee-primary">Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(getTotal())}</span>
              </div>
              <div className="border-t pt-2">
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(getTotal())}</span>
                </div>
              </div>
            </div>
            <Button
              onClick={handleCheckout}
              variant="employee"
              size="lg"
              className="w-full"
            >
              Proceed to Payment
            </Button>
          </CardContent>
        </Card>
      </div>
      
      {/* Payment Modal */}
      {showPaymentModal && currentOrder && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          order={currentOrder}
          onPaymentSuccess={handlePaymentSuccess}
        />
      )}
    </div>
  )
}

export default Cart