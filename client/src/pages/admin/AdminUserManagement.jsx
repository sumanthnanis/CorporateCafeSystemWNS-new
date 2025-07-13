import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Search, Filter, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTheme } from '@/context/ThemeContext';

const AdminUserManagement = () => {
  const { theme } = useTheme();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [newUser, setNewUser] = useState({
    email: '',
    username: '',
    full_name: '',
    password: '',
    user_type: 'EMPLOYEE'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

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
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newUser)
      });
      
      if (response.ok) {
        await fetchUsers();
        setIsCreateModalOpen(false);
        setNewUser({
          email: '',
          username: '',
          full_name: '',
          password: '',
          user_type: 'EMPLOYEE'
        });
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleUpdateUser = async (userId, updates) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      
      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        await fetchUsers();
        setDeletingUser(null);
      } else {
        const error = await response.json();
        alert(`Error: ${error.detail}`);
      }
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.username.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || user.user_type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getUserTypeColor = (userType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return 'bg-red-100 text-red-800';
      case 'CAFE_OWNER':
        return 'bg-blue-100 text-blue-800';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserTypeLabel = (userType) => {
    switch (userType) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'CAFE_OWNER':
        return 'Cafe Owner';
      case 'EMPLOYEE':
        return 'Employee';
      default:
        return userType;
    }
  };

  return (
    <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            User Management
          </CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  Create New User
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <Label htmlFor="email" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="username" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Username
                  </Label>
                  <Input
                    id="username"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="full_name" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Full Name
                  </Label>
                  <Input
                    id="full_name"
                    value={newUser.full_name}
                    onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="password" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    Password
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    required
                    className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
                  />
                </div>
                <div>
                  <Label htmlFor="user_type" className={`${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>
                    User Type
                  </Label>
                  <Select value={newUser.user_type} onValueChange={(value) => setNewUser({...newUser, user_type: value})}>
                    <SelectTrigger className={`${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="CAFE_OWNER">Cafe Owner</SelectItem>
                      <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                    Create User
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`pl-10 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className={`w-full sm:w-48 ${theme === 'dark' ? 'bg-gray-700 border-gray-600 text-white' : ''}`}>
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Users</SelectItem>
              <SelectItem value="EMPLOYEE">Employees</SelectItem>
              <SelectItem value="CAFE_OWNER">Cafe Owners</SelectItem>
              <SelectItem value="SUPER_ADMIN">Super Admins</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Users Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>User</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Email</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Type</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Status</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Created</th>
                <th className={`text-left py-3 px-4 font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-700'}`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    Loading users...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className={`text-center py-8 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className={`border-b ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                    <td className="py-3 px-4">
                      <div>
                        <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          {user.full_name}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                          @{user.username}
                        </div>
                      </div>
                    </td>
                    <td className={`py-3 px-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                      {user.email}
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getUserTypeColor(user.user_type)}>
                        {getUserTypeLabel(user.user_type)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className={`py-3 px-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setDeletingUser(user)}
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
        {deletingUser && (
          <Dialog open={!!deletingUser} onOpenChange={() => setDeletingUser(null)}>
            <DialogContent className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
              <DialogHeader>
                <DialogTitle className={`${theme === 'dark' ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Delete User
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className={`${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                  Are you sure you want to delete <strong>{deletingUser.full_name}</strong> ({deletingUser.email})?
                </p>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                  This action cannot be undone. All data associated with this user will be permanently removed.
                </p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setDeletingUser(null)}>
                    Cancel
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteUser(deletingUser.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete User
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

export default AdminUserManagement;