import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
// Removed WebSocket Provider to fix connection issues


// Employee Pages
import EmployeeDashboard from '@/pages/employee/Dashboard'
import CafeDirectory from '@/pages/employee/CafeDirectory'
import CafeMenu from '@/pages/employee/CafeMenu'
import Cart from '@/pages/employee/Cart'
import OrderTracking from '@/pages/employee/OrderTracking'
import EmployeeOrders from '@/pages/employee/Orders'
import Search from '@/pages/employee/Search'
import Filter from '@/pages/employee/Filter'

// Cafe Owner Pages
import OwnerDashboard from '@/pages/owner/Dashboard'
import MenuManagement from '@/pages/owner/MenuManagement'
import InventoryManagement from '@/pages/owner/InventoryManagement'
import OrderManagement from '@/pages/owner/OrderManagement'
import CategoryManagement from '@/pages/owner/CategoryManagement'
import FeedbackManagement from '@/pages/owner/FeedbackManagement'

// Admin Pages
import AdminDashboard from '@/pages/admin/AdminDashboard'

// Shared Pages
import Home from '@/pages/Home'
import Auth from '@/pages/Auth'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
            <Router>
            <div className="App">
              <Routes>
              {/* Home Route */}
              <Route path="/" element={<Home />} />
              

              
              {/* Auth Routes */}
              <Route path="/auth" element={<Auth />} />
              
              {/* Employee Routes */}
              <Route path="/employee" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <EmployeeDashboard />
                </ProtectedRoute>
              } />
              <Route path="/employee/cafes" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <CafeDirectory />
                </ProtectedRoute>
              } />
              <Route path="/employee/cafes/:cafeId" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <CafeMenu />
                </ProtectedRoute>
              } />
              <Route path="/employee/cart" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <Cart />
                </ProtectedRoute>
              } />
              <Route path="/employee/orders" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <EmployeeOrders />
                </ProtectedRoute>
              } />
              <Route path="/employee/orders/:orderId" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <OrderTracking />
                </ProtectedRoute>
              } />
              <Route path="/employee/search" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <Search />
                </ProtectedRoute>
              } />
              <Route path="/employee/filter" element={
                <ProtectedRoute userType="EMPLOYEE">
                  <Filter />
                </ProtectedRoute>
              } />
              
              {/* Cafe Owner Routes */}
              <Route path="/owner" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <OwnerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/owner/menu" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <MenuManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/menu/:cafeId" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <MenuManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/inventory" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <InventoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/orders" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <OrderManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/categories" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <CategoryManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/cafes/:cafeId" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <MenuManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/feedback/:cafeId" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <FeedbackManagement />
                </ProtectedRoute>
              } />
              <Route path="/owner/feedback" element={
                <ProtectedRoute userType="CAFE_OWNER">
                  <FeedbackManagement />
                </ProtectedRoute>
              } />
              
              {/* Super Admin Routes */}
              <Route path="/admin" element={
                <ProtectedRoute userType="SUPER_ADMIN">
                  <AdminDashboard />
                </ProtectedRoute>
              } />
            </Routes>

              <Toaster />
            </div>
            </Router>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App