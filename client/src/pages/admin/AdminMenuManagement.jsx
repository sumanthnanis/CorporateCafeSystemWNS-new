import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, Package, DollarSign, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/context/ThemeContext';

const AdminMenuManagement = () => {
  const { theme } = useTheme();
  const [menuItems, setMenuItems] = useState([]);
  const [cafes, setCafes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCafe, setFilterCafe] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [deletingItem, setDeletingItem] = useState(null);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: '',
    available_quantity: '',
    max_daily_quantity: '',
    is_available: true,
    preparation_time: '15',
    cafe_id: '',
    category_id: ''
  });

  useEffect(() => {
    fetchMenuItems();
    fetchCafes();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/menu-items', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMenuItems(data);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCafes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cafes', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCafes(data);
      }
    } catch (error) {
      console.error('Error fetching cafes:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/categories', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/menu-items', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newItem,
          price: parseFloat(newItem.price),
          available_quantity: parseInt(newItem.available_quantity),
          max_daily_quantity: parseInt(newItem.max_daily_quantity),
          preparation_time: parseInt(newItem.preparation_time),
          cafe_id: parseInt(newItem.cafe_id),
          category_id: parseInt(newItem.category_id)
        })
      });
      
      if (response.ok) {
        await fetchMenuItems();
        setIsCreateModalOpen(false);
        setNewItem({
          name: '',
          description: '',
          price: '',
          available_quantity: '',
          max_daily_quantity: '',
          is_available: true,
          preparation_time: '15',
          cafe_id: '',
          category_id: ''
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating menu item:', error);
    }
  };

  const handleDeleteItem = async (itemId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/menu-items/${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchMenuItems();
        setDeletingItem(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting menu item:', error);
    }
  };

  const filteredItems = menuItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCafe = filterCafe === 'all' || item.cafe_id.toString() === filterCafe;
    const matchesCategory = filterCategory === 'all' || item.category_id.toString() === filterCategory;
    
    return matchesSearch && matchesCafe && matchesCategory;
  });

  return (
    <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Menu Management
          </CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Menu Item
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'} max-w-2xl`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create New Menu Item
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateItem} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Item Name
                    </Label>
                    <Input
                      id="name"
                      value={newItem.name}
                      onChange={(e) => setNewItem({...newItem, name: e.target.value})}
                      required
                      className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Price ($)
                    </Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={newItem.price}
                      onChange={(e) => setNewItem({...newItem, price: e.target.value})}
                      required
                      className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newItem.description}
                    onChange={(e) => setNewItem({...newItem, description: e.target.value})}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cafe_id" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Cafe
                    </Label>
                    <Select value={newItem.cafe_id} onValueChange={(value) => setNewItem({...newItem, cafe_id: value})}>
                      <SelectTrigger className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                        <SelectValue placeholder="Select cafe" />
                      </SelectTrigger>
                      <SelectContent>
                        {cafes.map(cafe => (
                          <SelectItem key={cafe.id} value={cafe.id.toString()}>
                            {cafe.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="category_id" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Category
                    </Label>
                    <Select value={newItem.category_id} onValueChange={(value) => setNewItem({...newItem, category_id: value})}>
                      <SelectTrigger className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(category => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="available_quantity" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Available Quantity
                    </Label>
                    <Input
                      id="available_quantity"
                      type="number"
                      value={newItem.available_quantity}
                      onChange={(e) => setNewItem({...newItem, available_quantity: e.target.value})}
                      required
                      className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="max_daily_quantity" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Max Daily Quantity
                    </Label>
                    <Input
                      id="max_daily_quantity"
                      type="number"
                      value={newItem.max_daily_quantity}
                      onChange={(e) => setNewItem({...newItem, max_daily_quantity: e.target.value})}
                      required
                      className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preparation_time" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                      Prep Time (min)
                    </Label>
                    <Input
                      id="preparation_time"
                      type="number"
                      value={newItem.preparation_time}
                      onChange={(e) => setNewItem({...newItem, preparation_time: e.target.value})}
                      required
                      className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-purple-600 hover:bg-purple-700">
                    Create Item
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search menu items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            />
          </div>
          <Select value={filterCafe} onValueChange={setFilterCafe}>
            <SelectTrigger className={`w-full sm:w-48 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cafes</SelectItem>
              {cafes.map(cafe => (
                <SelectItem key={cafe.id} value={cafe.id.toString()}>
                  {cafe.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className={`w-full sm:w-48 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map(category => (
                <SelectItem key={category.id} value={category.id.toString()}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Menu Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Item</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Cafe</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Category</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Price</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Stock</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading menu items...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="7" className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No menu items found
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3 px-4">
                      <div>
                        <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {item.name}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          {item.description || 'No description'}
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.cafe_name || 'Unknown'}
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {item.category_name || 'Unknown'}
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center space-x-1">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span>{item.price?.toFixed(2)}</span>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      <div className="flex items-center space-x-1">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span>{item.available_quantity}/{item.max_daily_quantity}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={item.is_available ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingItem(item)}
                          className={`${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : ''}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingItem(item)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Delete Confirmation Modal */}
        {deletingItem && (
          <Dialog open={!!deletingItem} onOpenChange={() => setDeletingItem(null)}>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete Menu Item
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete <strong>{deletingItem.name}</strong>?
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  This action cannot be undone. This menu item will be permanently removed from the system.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeletingItem(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteItem(deletingItem.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Item
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminMenuManagement;