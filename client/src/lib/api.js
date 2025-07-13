import axios from 'axios'

// Create axios instance with default config
const api = axios.create({
  baseURL: '',  // Use relative URLs, Vite proxy will handle routing to backend
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Only logout and redirect if the error is from authenticated endpoints, NOT login attempts
      const loginEndpoints = ['/api/login', '/api/register']
      const authenticatedEndpoints = ['/api/me', '/api/verify-token']
      const requestUrl = error.config?.url || ''
      
      // Don't redirect on login/register failures - let the form handle those
      if (loginEndpoints.some(endpoint => requestUrl.includes(endpoint))) {
        return Promise.reject(error)
      }
      
      // Only redirect on authenticated endpoint failures (token expired, etc.)
      if (authenticatedEndpoints.some(endpoint => requestUrl.includes(endpoint))) {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        localStorage.removeItem('loginInfo')
        window.location.href = '/'
      }
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => {
    // Backend expects form data for OAuth2PasswordRequestForm
    const formData = new FormData()
    formData.append('username', credentials.username)
    formData.append('password', credentials.password)
    
    return api.post('/api/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
  register: (userData) => api.post('/api/register', userData),
  getCurrentUser: () => api.get('/api/me'),
}

// Employee API
export const employeeAPI = {
  getCafes: () => api.get('/api/employee/cafes'),
  getCafeMenu: (cafeId, categoryId) => 
    api.get(`/api/employee/cafes/${cafeId}/menu`, { params: { category_id: categoryId } }),
  searchFoodItems: (query, categoryId) => 
    api.get('/api/employee/search', { params: { query, category_id: categoryId } }),
  filterMenuItems: (filters) => 
    api.get('/api/employee/menu-items/filter', { params: filters }),
  getCategories: () => api.get('/api/employee/categories'),
  getCafeCategories: (cafeId) => api.get(`/api/employee/cafes/${cafeId}/categories`),
  getMyOrders: () => api.get('/api/employee/orders'),
  getOrderDetails: (orderId) => api.get(`/api/employee/orders/${orderId}`),
  initializeDummyData: () => api.post('/api/employee/init-dummy-data'),
}

// Orders API
export const ordersAPI = {
  createOrder: (orderData) => api.post('/api/orders/', orderData),
  cancelOrder: (orderId) => api.patch(`/api/orders/${orderId}/cancel`),
}

// Feedback API
export const feedbackAPI = {
  // Employee feedback actions
  createFeedback: (orderId, feedbackData) => api.post(`/api/feedback/orders/${orderId}/feedback`, feedbackData),
  getFeedback: (orderId) => api.get(`/api/feedback/orders/${orderId}/feedback`),
  canGiveFeedback: (orderId) => api.get(`/api/feedback/orders/${orderId}/can-feedback`),
  getMyFeedbacks: () => api.get('/api/feedback/my-feedbacks'),
  
  // Cafe owner feedback actions
  getCafeFeedbacks: (cafeId) => api.get(`/api/feedback/cafes/${cafeId}/feedbacks`),
}

// Cafe Owner API
export const cafeOwnerAPI = {
  // Cafe Management
  createCafe: (cafeData) => api.post('/api/cafe-owner/cafes', cafeData),
  getMyCafes: () => api.get('/api/cafe-owner/cafes'),
  getCafe: (cafeId) => api.get(`/api/cafe-owner/cafes/${cafeId}`),
  
  // Category Management
  createCategory: (categoryData) => api.post('/api/cafe-owner/categories', categoryData),
  getCategories: () => api.get('/api/cafe-owner/categories'),
  updateCategory: (categoryId, categoryData) => api.put(`/api/cafe-owner/categories/${categoryId}`, categoryData),
  deleteCategory: (categoryId) => api.delete(`/api/cafe-owner/categories/${categoryId}`),
  
  // Menu Management
  createMenuItem: (cafeId, itemData) => api.post(`/api/cafe-owner/menu-items`, { ...itemData, cafe_id: cafeId }),
  getMenuItems: (cafeId) => api.get(`/api/cafe-owner/cafes/${cafeId}/menu-items`),
  updateMenuItem: (itemId, itemData) => api.put(`/api/cafe-owner/menu-items/${itemId}`, itemData),
  deleteMenuItem: (itemId) => api.delete(`/api/cafe-owner/menu-items/${itemId}`),
  toggleItemAvailability: (itemId, isAvailable) => 
    api.patch(`/api/cafe-owner/menu-items/${itemId}/availability`, { is_available: isAvailable }),
  restockItem: (itemId, quantity) => 
    api.patch(`/api/cafe-owner/menu-items/${itemId}/restock`, { quantity }),
  
  // Order Management
  getCafeOrders: (statusFilter) => 
    api.get('/api/cafe-owner/orders', { params: { status_filter: statusFilter } }),
  getSpecificCafeOrders: (cafeId, statusFilter) => 
    api.get(`/api/cafe-owner/cafes/${cafeId}/orders`, { params: { status_filter: statusFilter } }),
  updateOrderStatus: (orderId, statusData) => 
    api.patch(`/api/cafe-owner/orders/${orderId}/status`, statusData),
  
  // Feedback Management
  getFeedback: () => api.get('/api/feedback/my-feedbacks'),
  getCafeFeedback: (cafeId) => api.get(`/api/feedback/cafes/${cafeId}/feedbacks`),
}

export default api