import React, { useState, useEffect } from 'react';
import { Users, Coffee, ShoppingBag, Star, TrendingUp, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AdminUserManagement from './AdminUserManagement';
import AdminCafeManagement from './AdminCafeManagement';
import AdminMenuManagement from './AdminMenuManagement';
import AdminOrderOverview from './AdminOrderOverview';

const AdminDashboard = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    total_users: 0,
    total_cafes: 0,
    total_menu_items: 0,
    total_orders: 0,
    total_feedbacks: 0,
    active_users: 0,
    active_cafes: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description, color }) => (
    <Card className={`food-card ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-lg transition-all duration-200`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-200' : 'text-gray-600'}`}>
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 ${color}`} />
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
          {loading ? '...' : value}
        </div>
        <p className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
          {description}
        </p>
      </CardContent>
    </Card>
  );

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50'} transition-all duration-500`}>
      {/* Header */}
      <div className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 backdrop-blur-sm bg-white/90 dark:bg-gray-800/90`}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Super Admin Dashboard
            </h1>
            <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
              Welcome back, {user?.full_name}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Button
              onClick={fetchStats}
              variant="outline"
              className={`food-button ${theme === 'dark' ? 'border-gray-600 text-gray-300 hover:bg-gray-700' : 'bg-blue-600 hover:bg-blue-700 text-white border-blue-600'} mobile-touch-target`}
            >
              <Activity className="h-4 w-4 mr-2" />
              Refresh Stats
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={Users}
            description={`${stats.active_users} active users`}
            color="text-blue-500"
          />
          <StatCard
            title="Total Cafes"
            value={stats.total_cafes}
            icon={Coffee}
            description={`${stats.active_cafes} active cafes`}
            color="text-green-500"
          />
          <StatCard
            title="Menu Items"
            value={stats.total_menu_items}
            icon={ShoppingBag}
            description="Across all cafes"
            color="text-purple-500"
          />
          <StatCard
            title="Total Orders"
            value={stats.total_orders}
            icon={TrendingUp}
            description="All-time orders"
            color="text-orange-500"
          />
        </div>

        {/* Management Tabs */}
        <Tabs defaultValue="users" className="w-full">
          <TabsList className={`grid w-full grid-cols-4 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
            <TabsTrigger value="users" className={theme === 'dark' ? 'data-[state=active]:bg-gray-700' : ''}>
              User Management
            </TabsTrigger>
            <TabsTrigger value="cafes" className={theme === 'dark' ? 'data-[state=active]:bg-gray-700' : ''}>
              Cafe Management
            </TabsTrigger>
            <TabsTrigger value="menu" className={theme === 'dark' ? 'data-[state=active]:bg-gray-700' : ''}>
              Menu Management
            </TabsTrigger>
            <TabsTrigger value="orders" className={theme === 'dark' ? 'data-[state=active]:bg-gray-700' : ''}>
              Order Overview
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="users" className="mt-6">
            <AdminUserManagement />
          </TabsContent>
          
          <TabsContent value="cafes" className="mt-6">
            <AdminCafeManagement />
          </TabsContent>
          
          <TabsContent value="menu" className="mt-6">
            <AdminMenuManagement />
          </TabsContent>
          
          <TabsContent value="orders" className="mt-6">
            <AdminOrderOverview />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;