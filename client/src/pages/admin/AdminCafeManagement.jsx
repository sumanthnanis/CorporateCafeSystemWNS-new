import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Coffee, MapPin, Phone, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTheme } from '@/context/ThemeContext';

const AdminCafeManagement = () => {
  const { theme } = useTheme();
  const [cafes, setCafes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingCafe, setEditingCafe] = useState(null);
  const [deletingCafe, setDeletingCafe] = useState(null);
  const [newCafe, setNewCafe] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    owner_id: ''
  });

  useEffect(() => {
    fetchCafes();
    fetchUsers();
  }, []);

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
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUsers(data.filter(user => user.user_type === 'CAFE_OWNER'));
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleCreateCafe = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/cafes', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...newCafe,
          owner_id: parseInt(newCafe.owner_id)
        })
      });
      
      if (response.ok) {
        await fetchCafes();
        setIsCreateModalOpen(false);
        setNewCafe({
          name: '',
          description: '',
          address: '',
          phone: '',
          owner_id: ''
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating cafe:', error);
    }
  };

  const handleUpdateCafe = async (cafeId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cafes/${cafeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        await fetchCafes();
        setEditingCafe(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error updating cafe:', error);
    }
  };

  const handleDeleteCafe = async (cafeId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/cafes/${cafeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchCafes();
        setDeletingCafe(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting cafe:', error);
    }
  };

  const filteredCafes = cafes.filter(cafe => 
    cafe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cafe.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Cafe Management
          </CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="h-4 w-4 mr-2" />
                Add Cafe
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create New Cafe
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateCafe} className="space-y-4">
                <div>
                  <Label htmlFor="name" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Cafe Name
                  </Label>
                  <Input
                    id="name"
                    value={newCafe.name}
                    onChange={(e) => setNewCafe({...newCafe, name: e.target.value})}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="description" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Description
                  </Label>
                  <Textarea
                    id="description"
                    value={newCafe.description}
                    onChange={(e) => setNewCafe({...newCafe, description: e.target.value})}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="address" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Address
                  </Label>
                  <Input
                    id="address"
                    value={newCafe.address}
                    onChange={(e) => setNewCafe({...newCafe, address: e.target.value})}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="phone" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Phone
                  </Label>
                  <Input
                    id="phone"
                    value={newCafe.phone}
                    onChange={(e) => setNewCafe({...newCafe, phone: e.target.value})}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="owner_id" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Owner
                  </Label>
                  <Select value={newCafe.owner_id} onValueChange={(value) => setNewCafe({...newCafe, owner_id: value})}>
                    <SelectTrigger className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Create Cafe
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search cafes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            />
          </div>
        </div>

        {/* Cafes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            <div className={`col-span-full text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Loading cafes...
            </div>
          ) : filteredCafes.length === 0 ? (
            <div className={`col-span-full text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              No cafes found
            </div>
          ) : (
            filteredCafes.map((cafe) => (
              <Card key={cafe.id} className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Coffee className="h-5 w-5 text-green-600" />
                      <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {cafe.name}
                      </h3>
                    </div>
                    <Badge className={cafe.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                      {cafe.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                      {cafe.description || 'No description provided'}
                    </p>
                    {cafe.address && (
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {cafe.address}
                        </span>
                      </div>
                    )}
                    {cafe.phone && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                          {cafe.phone}
                        </span>
                      </div>
                    )}
                    <div className="pt-2">
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Owner: {cafe.owner_name || 'Unknown'}
                      </p>
                      <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                        Menu Items: {cafe.menu_items_count || 0}
                      </p>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setEditingCafe(cafe)}
                      className={`flex-1 ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-600' : ''}`}
                    >
                      <Edit className="h-4 w-4 mr-1" />
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setDeletingCafe(cafe)}
                      className="flex-1 border-red-300 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Edit Cafe Modal */}
        {editingCafe && (
          <Dialog open={!!editingCafe} onOpenChange={() => setEditingCafe(null)}>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Edit Cafe
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const updates = {
                  name: formData.get('name'),
                  description: formData.get('description'),
                  address: formData.get('address'),
                  phone: formData.get('phone'),
                  owner_id: parseInt(formData.get('owner_id'))
                };
                handleUpdateCafe(editingCafe.id, updates);
              }} className="space-y-4">
                <div>
                  <Label htmlFor="edit_name" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Cafe Name
                  </Label>
                  <Input
                    id="edit_name"
                    name="name"
                    defaultValue={editingCafe.name}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_description" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Description
                  </Label>
                  <Textarea
                    id="edit_description"
                    name="description"
                    defaultValue={editingCafe.description || ''}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_address" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Address
                  </Label>
                  <Input
                    id="edit_address"
                    name="address"
                    defaultValue={editingCafe.address || ''}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_phone" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Phone
                  </Label>
                  <Input
                    id="edit_phone"
                    name="phone"
                    defaultValue={editingCafe.phone || ''}
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="edit_owner_id" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Owner
                  </Label>
                  <Select name="owner_id" defaultValue={editingCafe.owner_id?.toString()}>
                    <SelectTrigger className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.full_name} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setEditingCafe(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-green-600 hover:bg-green-700">
                    Update Cafe
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Confirmation Modal */}
        {deletingCafe && (
          <Dialog open={!!deletingCafe} onOpenChange={() => setDeletingCafe(null)}>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete Cafe
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete <strong>{deletingCafe.name}</strong>?
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  This action cannot be undone. All menu items, orders, and data associated with this cafe will be permanently removed.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeletingCafe(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteCafe(deletingCafe.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete Cafe
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

export default AdminCafeManagement;