import React, { useState, useEffect } from 'react'
import { X, CreditCard, Smartphone, Building, DollarSign, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/lib/utils'

const PaymentModal = ({ isOpen, onClose, order, onPaymentSuccess }) => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [selectedMethod, setSelectedMethod] = useState('')
  const [processing, setProcessing] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchPaymentMethods()
    }
  }, [isOpen])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/payment-methods', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      setPaymentMethods(data.methods || [])
      if (data.methods && data.methods.length > 0) {
        setSelectedMethod(data.methods[0].id)
      }
    } catch (error) {
      console.error('Failed to fetch payment methods:', error)
      // Set default payment methods as fallback
      const defaultMethods = [
        {
          id: 'credit_card',
          name: 'Credit/Debit Card',
          description: 'Visa, Mastercard, American Express',
          icon: 'credit-card',
          demo_cards: [
            { number: '**** **** **** 1234', type: 'Visa', expires: '12/25' },
            { number: '**** **** **** 5678', type: 'Mastercard', expires: '08/26' },
            { number: '**** **** **** 9012', type: 'Amex', expires: '03/27' }
          ]
        },
        {
          id: 'paypal',
          name: 'PayPal',
          description: 'Pay with your PayPal account',
          icon: 'paypal'
        },
        {
          id: 'corporate_account',
          name: 'Corporate Account',
          description: 'Company credit line',
          icon: 'building'
        },
        {
          id: 'apple_pay',
          name: 'Apple Pay',
          description: 'Touch ID or Face ID',
          icon: 'smartphone'
        }
      ]
      setPaymentMethods(defaultMethods)
      setSelectedMethod('credit_card')
    }
  }

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method to proceed.",
        variant: "destructive",
      })
      return
    }

    setProcessing(true)
    
    try {
      // Step 1: Create the order first
      const orderData = {
        cafe_id: order.cafe.id,
        items: order.order_items.map(item => ({
          menu_item_id: item.menu_item.id,
          quantity: item.quantity,
          special_instructions: ""
        })),
        special_instructions: ""
      }

      const orderResponse = await fetch('/api/orders/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(orderData)
      })

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json()
        throw new Error(errorData.detail || 'Failed to create order')
      }

      const createdOrder = await orderResponse.json()

      // Step 2: Process payment for the created order
      const paymentResponse = await fetch(`/api/payments/orders/${createdOrder.id}/process-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          method: selectedMethod,
          card_details: selectedCard
        })
      })

      const paymentResult = await paymentResponse.json()
      
      if (paymentResult.success) {
        toast({
          title: "Payment Successful!",
          description: `Your order has been paid and sent to the cafe. Transaction ID: ${paymentResult.transaction_id}`,
        })
        onPaymentSuccess({ ...paymentResult, order: createdOrder })
        onClose()
      } else {
        // If payment fails, we should cancel/delete the order
        toast({
          title: "Payment Failed",
          description: paymentResult.message || "Please try again or use a different payment method.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('Payment/Order error:', error)
      toast({
        title: "Payment Error",
        description: error.message || "Unable to process payment. Please try again.",
        variant: "destructive",
      })
    } finally {
      setProcessing(false)
    }
  }

  const getPaymentIcon = (method) => {
    switch (method) {
      case 'credit_card':
        return <CreditCard className="h-5 w-5" />
      case 'apple_pay':
        return <Smartphone className="h-5 w-5" />
      case 'corporate_account':
        return <Building className="h-5 w-5" />
      default:
        return <DollarSign className="h-5 w-5" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl font-bold">Complete Payment</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            disabled={processing}
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-black-50 p-4 rounded-lg border">
            <h3 className="font-semibold mb-2">Order Summary</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Order #{order.order_number}</span>
                <span className="font-medium">{order.cafe.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Items ({order.order_items.length})</span>
                <span>{formatCurrency(order.total_amount)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total</span>
                <span className="text-employee-primary">{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="space-y-4">
            <h3 className="font-semibold">Select Payment Method</h3>
            {paymentMethods && paymentMethods.length > 0 ? (
              paymentMethods.map((method) => (
                <div key={method.id} className="space-y-2">
                  <div
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      selectedMethod === method.id
                        ? 'border-employee-primary bg-employee-primary/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getPaymentIcon(method.id)}
                        <div>
                          <div className="font-medium">{method.name}</div>
                          <div className="text-sm text-gray-500">{method.description}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">Demo</Badge>
                        {selectedMethod === method.id && (
                          <div className="w-2 h-2 bg-employee-primary rounded-full"></div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Demo Cards for Credit Card */}
                  {method.id === 'credit_card' && selectedMethod === 'credit_card' && method.demo_cards && (
                    <div className="ml-8 space-y-2">
                      <div className="text-sm font-medium">Choose Demo Card:</div>
                      {method.demo_cards.map((card, index) => (
                        <div
                          key={index}
                          className={`border rounded-lg p-3 cursor-pointer transition-all ${
                            selectedCard?.number === card.number
                              ? 'border-employee-primary bg-employee-primary/5'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setSelectedCard(card)}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <CreditCard className="h-4 w-4 text-gray-500" />
                              <div>
                                <div className="font-medium text-sm">{card.number}</div>
                                <div className="text-xs text-gray-500">{card.type} • Expires {card.expires}</div>
                              </div>
                            </div>
                            {selectedCard?.number === card.number && (
                              <div className="w-2 h-2 bg-employee-primary rounded-full"></div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading payment methods...</div>
              </div>
            )}
          </div>

          {/* Demo Notice */}
          {/* <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-sm font-medium text-blue-800">Demo Payment System</span>
            </div>
            <p className="text-sm text-blue-700">
              This is a demonstration payment system for college purposes. No real money will be charged.
              The payment simulation includes realistic success/failure scenarios.
            </p>
          </div> */}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={processing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              variant="employee"
              onClick={handlePayment}
              disabled={processing || !selectedMethod || (selectedMethod === 'credit_card' && !selectedCard)}
              className="flex-1"
            >
              {processing ? (
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 animate-spin" />
                  Processing...
                </div>
              ) : (
                `Pay ${formatCurrency(order.total_amount)}`
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default PaymentModal