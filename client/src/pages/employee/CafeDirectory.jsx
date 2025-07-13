import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { employeeAPI } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { Search, MapPin, Clock, Star, ArrowLeft } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

const CafeDirectory = () => {
  const [cafes, setCafes] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCafes()
  }, [])

  const loadCafes = async () => {
    try {
      const response = await employeeAPI.getCafes()
      setCafes(response.data)
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

  const filteredCafes = cafes.filter(cafe => 
    cafe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cafe.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <h1 className="text-2xl font-bold text-gray-800">Browse Cafes</h1>
          </div>
          <ThemeToggle />
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search cafes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 mobile-touch-target"
            />
          </div>
        </div>

        {/* Cafes List */}
        {loading ? (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredCafes.map((cafe) => (
              <Link key={cafe.id} to={`/employee/cafes/${cafe.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-lg text-gray-800">{cafe.name}</h3>
                          <Badge variant={cafe.is_active ? "default" : "secondary"}>
                            {cafe.is_active ? "Open" : "Closed"}
                          </Badge>
                        </div>
                        <p className="text-gray-600 text-sm mb-2">{cafe.description}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1" />
                          {cafe.address}
                        </div>
                      </div>
                      <div className="text-right">
                        <Button variant="employee" size="sm">
                          View Menu
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default CafeDirectory