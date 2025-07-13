import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useCartStore } from "@/store/cartStore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { employeeAPI, feedbackAPI } from "@/lib/api";
import { formatCurrency } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import {
  Search,
  Coffee,
  Clock,
  MapPin,
  ShoppingCart,
  User,
  LogOut,
  Store,
  Receipt,
  TrendingUp,
  Star,
  MessageCircle,
  X,
} from "lucide-react";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const Dashboard = () => {
  const { user, logout, loading: authLoading } = useAuth();
  const { items, getItemCount, getTotal } = useCartStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [featuredCafes, setFeaturedCafes] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingFeedbacks, setPendingFeedbacks] = useState([]);
  const [feedbackDismissed, setFeedbackDismissed] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Initialize dummy data first
      await employeeAPI.initializeDummyData();

      // Load cafes and recent orders
      const [cafesResponse, ordersResponse] = await Promise.all([
        employeeAPI.getCafes(),
        employeeAPI.getMyOrders(),
      ]);

      setFeaturedCafes(cafesResponse.data.slice(0, 3));
      // Sort orders by newest first and take the top 3
      const sortedOrders = ordersResponse.data.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );
      setRecentOrders(sortedOrders.slice(0, 3));

      // Check for orders that need feedback
      await loadPendingFeedbacks(ordersResponse.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load dashboard data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadPendingFeedbacks = async (orders) => {
    try {
      // Check completed orders that haven't been given feedback yet
      const completedOrders = orders.filter(
        (order) => order.status === "DELIVERED" || order.status === "READY",
      );

      const pendingFeedbackOrders = [];

      for (const order of completedOrders) {
        try {
          const canFeedbackResponse = await feedbackAPI.canGiveFeedback(
            order.id,
          );
          if (canFeedbackResponse.data.can_feedback) {
            pendingFeedbackOrders.push(order);
          }
        } catch (error) {
          // Continue if individual feedback check fails
        }
      }

      setPendingFeedbacks(pendingFeedbackOrders);
    } catch (error) {
      // It's okay if feedback loading fails
      setPendingFeedbacks([]);
    }
  };

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      // Navigate to search results
      window.location.href = `/employee/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  if (loading || authLoading || !user) {
    return (
      <div className="min-h-screen bg-white employee-theme">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-employee-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white employee-theme">
      {/* Header */}
      <header className="mobile-header food-header food-header-employee">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1">
              <div className="bg-employee-primary/10 p-3 rounded-full">
                <Coffee className="h-6 w-6 md:h-8 md:w-8 text-employee-primary" />
              </div>
              <div className="flex-1">
                <h1 className="text-lg md:text-xl font-bold text-gray-800">
                  Food Hub
                </h1>
                <p className="text-sm text-gray-600 hidden sm:block">
                  Welcome back, {user?.full_name || "User"}!
                </p>
                <p className="text-xs sm:hidden text-gray-600">
                  Hi, {user?.full_name?.split(" ")[0] || "User"}!
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 md:space-x-3">
              <ThemeToggle
                variant="outline"
                className="border-employee-primary/30 hover:bg-employee-primary/10 text-employee-primary rounded-xl"
              />
              <Link to="/employee/cart" className="relative">
                <Button
                  variant="outline"
                  size="icon"
                  className="mobile-touch-target relative border-employee-primary/30 hover:bg-employee-primary/10 rounded-xl"
                >
                  <ShoppingCart className="h-5 w-5 text-employee-primary" />
                  {getItemCount() > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center text-xs bg-employee-primary text-white rounded-full font-bold">
                      {getItemCount()}
                    </Badge>
                  )}
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="mobile-touch-target hover:bg-employee-primary/10 rounded-xl"
              >
                <LogOut className="h-5 w-5 text-employee-primary" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Search Section */}
        <div className="mb-8">
          <Card className="food-card food-card-employee bg-gradient-to-r from-white to-employee-background/30">
            <CardHeader className="text-center pb-4">
              <CardTitle className="text-2xl text-employee-primary font-bold">
                What are you craving today?
              </CardTitle>
              <CardDescription className="text-gray-600">
                Search for your favorite food across all cafes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex gap-3">
                <Input
                  type="text"
                  placeholder="Search for food items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 mobile-touch-target border-employee-primary/30 focus:border-employee-primary rounded-lg"
                />
                <Button
                  type="submit"
                  className="food-button food-button-employee mobile-touch-target text"
                >
                  <Search className=" h-4 w-4 mr-2" />
                  Search
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Pending Feedback Notification - Dismissible */}
        {pendingFeedbacks.length > 0 && !feedbackDismissed && (
          <div className="mb-8">
            <Card className="food-card food-card-employee border-2 border-orange-300">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg text-orange-800 font-semibold flex items-center gap-2">
                    <MessageCircle className="h-5 w-5 text-orange-600" />
                    Feedback Requested
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeedbackDismissed(true)}
                    className="text-orange-600 hover:text-orange-800 hover:bg-orange-100"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CardDescription className="text-orange-700">
                  {pendingFeedbacks.length} completed order{pendingFeedbacks.length > 1 ? "s" : ""} waiting for feedback
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-4">
                  <Link to="/employee/orders">
                    <Button
                      size="sm"
                      className="bg-orange-600 hover:bg-orange-700 text-white"
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Review Orders
                    </Button>
                  </Link>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFeedbackDismissed(true)}
                    className="text-orange-600 border-orange-300 hover:bg-orange-50"
                  >
                    Maybe Later
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/employee/cafes">
            <Card className="food-card food-card-employee hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-employee-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Store className="h-6 w-6 text-employee-primary" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Browse Cafes
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/employee/orders">
            <Card className="food-card food-card-employee hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-employee-secondary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Receipt className="h-6 w-6 text-employee-secondary" />
                </div>
                <p className="text-sm font-semibold text-gray-800">My Orders</p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/employee/cart">
            <Card className="food-card food-card-employee hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-employee-accent/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <ShoppingCart className="h-6 w-6 text-employee-accent" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Cart ({getItemCount()})
                </p>
              </CardContent>
            </Card>
          </Link>
          <Link to="/employee/filter">
            <Card className="food-card food-card-employee hover:scale-105 transition-all duration-200 cursor-pointer">
              <CardContent className="p-6 text-center">
                <div className="bg-employee-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="h-6 w-6 text-employee-primary" />
                </div>
                <p className="text-sm font-semibold text-gray-800">
                  Advanced Filter
                </p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Featured Cafes */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Featured Cafes</h2>
            <Link to="/employee/cafes">
              <Button
                variant="outline"
                size="sm"
                className="border-employee-primary/30 text-employee-primary hover:bg-employee-primary/10"
              >
                View All
              </Button>
            </Link>
          </div>
          <div className="grid gap-4">
            {featuredCafes.map((cafe) => (
              <Link key={cafe.id} to={`/employee/cafes/${cafe.id}`}>
                <Card className="food-card food-card-employee cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                          {cafe?.name || "Cafe"}
                        </h3>
                        <p className="text-gray-600 text-sm mb-3">
                          {cafe?.description || "No description"}
                        </p>
                        <div className="flex items-center text-sm text-gray-500">
                          <MapPin className="h-4 w-4 mr-1 text-employee-primary" />
                          {cafe?.address || "No address"}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge
                          className={`mb-2 ${cafe?.is_active ? "bg-employee-accent text-white" : "bg-gray-200 text-gray-600"}`}
                        >
                          {cafe?.is_active ? "Open" : "Closed"}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          <Clock className="h-3 w-3 inline mr-1" />
                          10-15 min
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        {recentOrders.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">
                Recent Orders
              </h2>
              <Link to="/employee/orders">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-employee-primary/30 text-employee-primary hover:bg-employee-primary/10"
                >
                  View All
                </Button>
              </Link>
            </div>
            <div className="space-y-4">
              {recentOrders.map((order) => (
                <Link key={order.id} to={`/employee/orders/${order.id}`}>
                  <Card className="food-card food-card-employee cursor-pointer">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-bold text-gray-800">
                              Order #{order?.order_number || "N/A"}
                            </h3>
                            <Badge
                              className={`${
                                order?.status?.toLowerCase() === "pending"
                                  ? "bg-employee-primary"
                                  : order?.status?.toLowerCase() === "ready"
                                    ? "bg-employee-accent"
                                    : "bg-employee-secondary"
                              } text-white`}
                            >
                              {order?.status || "Unknown"}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 font-medium">
                            {order.cafe_name || order.cafe?.name || "Cafe"}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-lg text-employee-primary">
                            {formatCurrency(order?.total_amount || 0)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {order?.created_at
                              ? new Date(order.created_at).toLocaleDateString()
                              : "N/A"}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Current Cart */}
        {items.length > 0 && (
          <Card className="food-card food-card-employee bg-gradient-to-r from-employee-accent/10 to-employee-primary/10">
            <CardHeader>
              <CardTitle className="text-employee-accent font-bold">
                <ShoppingCart className="h-5 w-5 inline mr-2" />
                Current Cart
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-600">
                    {getItemCount()} items from {items[0]?.cafe_name || "Cafe"}
                  </p>
                  <p className="font-bold text-lg text-employee-primary">
                    Total: {formatCurrency(getTotal())}
                  </p>
                </div>
                <Link to="/employee/cart">
                  <Button className="food-button bg-employee-accent hover:bg-employee-accent/90 text-white mobile-touch-target">
                    View Cart
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
