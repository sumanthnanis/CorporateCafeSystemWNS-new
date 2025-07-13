import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { cafeOwnerAPI } from '@/lib/api'
import { toast } from '@/hooks/use-toast'
import { ArrowLeft, Plus, Edit, Trash2, Tag, X } from 'lucide-react'

const CategoryManagement = () => {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddCategory, setShowAddCategory] = useState(false)
  const [addLoading, setAddLoading] = useState(false)
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      setLoading(true)
      const response = await cafeOwnerAPI.getCategories()
      setCategories(response.data)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load categories. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAddCategory = async (e) => {
    e.preventDefault()
    if (!newCategory.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Category name is required.",
        variant: "destructive",
      })
      return
    }

    setAddLoading(true)
    try {
      await cafeOwnerAPI.createCategory(newCategory)
      
      toast({
        title: "Success!",
        description: "Category has been created successfully.",
      })
      
      // Reset form and close modal
      setNewCategory({ name: '', description: '' })
      setShowAddCategory(false)
      
      // Reload categories
      loadCategories()
    } catch (error) {
      toast({
        title: "Error",
        description: error.response?.data?.detail || "Failed to create category. Please try again.",
        variant: "destructive",
      })
    } finally {
      setAddLoading(false)
    }
  }

  const handleInputChange = (e) => {
    setNewCategory({
      ...newCategory,
      [e.target.name]: e.target.value
    })
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Link to="/owner" className="mr-4">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">Category Management</h1>
          </div>
          <Button onClick={() => setShowAddCategory(true)} className="bg-owner-primary hover:bg-owner-secondary text-white">
            <Plus className="h-4 w-4 mr-2" />
            Add Category
          </Button>
        </div>

        {/* Categories List */}
        <div className="grid gap-4">
          {categories.length === 0 ? (
            <Card className="text-center p-8">
              <Tag className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">No Categories Found</h3>
              <p className="text-gray-600 mb-4">Create your first food category to organize menu items.</p>
              <Button onClick={() => setShowAddCategory(true)} className="bg-owner-primary hover:bg-owner-secondary text-white">
                <Plus className="h-4 w-4 mr-2" />
                Add Category
              </Button>
            </Card>
          ) : (
            categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-lg text-gray-800">{category.name}</h3>
                        <Badge variant="outline">Global Category</Badge>
                      </div>
                      {category.description && (
                        <p className="text-gray-600 text-sm">{category.description}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        Created: {new Date(category.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Add Category Modal */}
        {showAddCategory && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Add New Category</h2>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowAddCategory(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleAddCategory} className="space-y-4">
                <div>
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={newCategory.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Beverages, Main Course, Desserts"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Input
                    id="description"
                    name="description"
                    type="text"
                    value={newCategory.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of this category"
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowAddCategory(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={addLoading}
                    className="flex-1 bg-owner-primary hover:bg-owner-secondary text-white"
                  >
                    {addLoading ? 'Creating...' : 'Create Category'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default CategoryManagement