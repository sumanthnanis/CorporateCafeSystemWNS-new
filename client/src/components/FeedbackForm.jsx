import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Star } from 'lucide-react'
import { toast } from '@/hooks/use-toast'

const FeedbackForm = ({ isOpen, onClose, onSubmit, orderDetails }) => {
  const [rating, setRating] = useState(0)
  const [feedbackText, setFeedbackText] = useState('')
  const [hoveredRating, setHoveredRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (rating === 0) {
      toast({
        title: "Rating Required",
        description: "Please select a rating before submitting",
        variant: "destructive"
      })
      return
    }

    setIsSubmitting(true)
    
    try {
      await onSubmit({
        rating,
        feedback_text: feedbackText.trim() || null
      })
      
      // Reset form
      setRating(0)
      setFeedbackText('')
      setHoveredRating(0)
      
      onClose()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const StarRating = ({ rating, onRatingChange, hoveredRating, onHover, onHoverLeave }) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-8 h-8 cursor-pointer transition-colors ${
              star <= (hoveredRating || rating) 
                ? 'text-yellow-400 fill-yellow-400' 
                : 'text-gray-300 dark:text-gray-600'
            }`}
            onClick={() => onRatingChange(star)}
            onMouseEnter={() => onHover(star)}
            onMouseLeave={onHoverLeave}
          />
        ))}
      </div>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Rate Your Order</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Order Details</Label>
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="font-medium">{orderDetails?.order_number}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {orderDetails?.cafe?.name}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Total: ${orderDetails?.total_amount?.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Rating *</Label>
            <StarRating
              rating={rating}
              onRatingChange={setRating}
              hoveredRating={hoveredRating}
              onHover={setHoveredRating}
              onHoverLeave={() => setHoveredRating(0)}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {rating > 0 && (
                <>
                  {rating === 1 && "Poor"}
                  {rating === 2 && "Fair"}
                  {rating === 3 && "Good"}
                  {rating === 4 && "Very Good"}
                  {rating === 5 && "Excellent"}
                </>
              )}
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback">Comments (Optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Share your experience with this order..."
              value={feedbackText}
              onChange={(e) => setFeedbackText(e.target.value)}
              rows={4}
              maxLength={500}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 text-right">
              {feedbackText.length}/500 characters
            </p>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default FeedbackForm