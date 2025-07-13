import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cafeOwnerAPI } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { 
  ArrowLeft, 
  Star, 
  MessageSquare, 
  Calendar,
  TrendingUp,
  Users,
  Award
} from 'lucide-react'

const FeedbackManagement = () => {
  const { cafeId } = useParams()
  const [cafe, setCafe] = useState(null)
  const [feedbacks, setFeedbacks] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [stats, setStats] = useState({
    totalFeedbacks: 0,
    averageRating: 0,
    ratingDistribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  })

  useEffect(() => {
    if (cafeId) {
      loadFeedbackData()
    } else {
      loadAllFeedbacks()
    }
  }, [cafeId])

  const loadFeedbackData = async () => {
    try {
      setLoading(true)
      const [cafeResponse, feedbackResponse] = await Promise.all([
        cafeOwnerAPI.getCafe(cafeId),
        cafeOwnerAPI.getCafeFeedback(cafeId)
      ])
      setCafe(cafeResponse.data)
      setFeedbacks(feedbackResponse.data)
      calculateStats(feedbackResponse.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feedback data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadAllFeedbacks = async () => {
    try {
      setLoading(true)
      const response = await cafeOwnerAPI.getFeedback()
      setFeedbacks(response.data)
      calculateStats(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load feedback data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (feedbackData) => {
    const totalFeedbacks = feedbackData.length
    const totalRating = feedbackData.reduce((sum, feedback) => sum + feedback.rating, 0)
    const averageRating = totalFeedbacks > 0 ? (totalRating / totalFeedbacks).toFixed(1) : 0
    
    const ratingDistribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
    feedbackData.forEach(feedback => {
      ratingDistribution[feedback.rating]++
    })

    setStats({
      totalFeedbacks,
      averageRating: parseFloat(averageRating),
      ratingDistribution
    })
  }

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-4 w-4 ${
          i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ))
  }

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 1) return 'Yesterday'
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }

  const getRatingColor = (rating) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-owner-primary mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading feedback data...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 owner-theme p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to="/owner">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {cafe ? `${cafe.name} Feedback` : 'All Feedback'}
              </h1>
              <p className="text-gray-600 mt-1">
                Customer reviews and ratings
              </p>
            </div>
          </div>
          <ThemeToggle />
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalFeedbacks}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Average Rating</p>
                  <p className={`text-2xl font-bold ${getRatingColor(stats.averageRating)}`}>
                    {stats.averageRating}/5
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Award className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">5-Star Reviews</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.ratingDistribution[5]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.totalFeedbacks > 0 ? '100%' : '0%'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Rating Distribution */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Rating Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[5, 4, 3, 2, 1].map((rating) => (
                <div key={rating} className="flex items-center gap-3">
                  <div className="flex items-center gap-1 min-w-[80px]">
                    <span className="text-sm font-medium">{rating}</span>
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  </div>
                  <div className="flex-1 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${stats.totalFeedbacks > 0 ? (stats.ratingDistribution[rating] / stats.totalFeedbacks) * 100 : 0}%`
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-600 min-w-[40px]">
                    {stats.ratingDistribution[rating]}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Feedback List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Recent Feedback
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedbacks.length === 0 ? (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">No feedback received yet</p>
                <p className="text-sm text-gray-400">Feedback will appear here once customers leave reviews</p>
              </div>
            ) : (
              <div className="space-y-4">
                {feedbacks.map((feedback) => (
                  <div key={feedback.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          {renderStars(feedback.rating)}
                        </div>
                        <Badge variant="outline" className="text-xs cursor-pointer hover:bg-gray-100" 
                               onClick={() => setSelectedOrder(feedback.order)}>
                          Order #{feedback.order?.order_number || feedback.order_id}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {getTimeAgo(feedback.created_at)}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-700">
                        {feedback.customer?.name || feedback.customer_name}
                      </span>
                      {!cafe && (
                        <span className="text-sm text-gray-500">
                          • {feedback.cafe?.name || feedback.cafe_name}
                        </span>
                      )}
                    </div>
                    
                    {feedback.feedback_text && (
                      <p className="text-gray-700 leading-relaxed">
                        "{feedback.feedback_text}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Order Details</h3>
                <Button variant="ghost" size="sm" onClick={() => setSelectedOrder(null)}>
                  ×
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Number</p>
                    <p className="text-lg font-semibold">#{selectedOrder.order_number}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Total Amount</p>
                    <p className="text-lg font-semibold text-green-600">${selectedOrder.total_amount}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <Badge variant="outline">{selectedOrder.status}</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Order Date</p>
                    <p>{new Date(selectedOrder.created_at).toLocaleDateString()}</p>
                  </div>
                </div>

                {selectedOrder.items && selectedOrder.items.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-2">Items Ordered</p>
                    <div className="space-y-2">
                      {selectedOrder.items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                          <span>{item.name} x{item.quantity}</span>
                          <span className="font-medium">${item.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default FeedbackManagement