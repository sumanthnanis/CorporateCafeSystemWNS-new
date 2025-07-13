import { create } from 'zustand'

export const useCartStore = create((set, get) => ({
      items: [],
      cafeId: null,
      cafeName: '',
      
      addItem: (item, cafeIdParam, cafeNameParam) => {
        const { items, cafeId } = get()
        
        // Use parameters if provided, otherwise use item properties
        const itemCafeId = cafeIdParam || item.cafe_id
        const itemCafeName = cafeNameParam || item.cafe_name || ''
        
        // If adding item from different cafe, clear cart
        if (cafeId && cafeId !== itemCafeId) {
          set({
            items: [{ ...item, quantity: 1 }],
            cafeId: itemCafeId,
            cafeName: itemCafeName,
          })
          return
        }
        
        // Check if item already exists
        const existingItemIndex = items.findIndex(
          (cartItem) => cartItem.id === item.id
        )
        
        if (existingItemIndex >= 0) {
          // Update quantity
          const updatedItems = [...items]
          updatedItems[existingItemIndex].quantity += 1
          set({ items: updatedItems })
        } else {
          // Add new item
          set({
            items: [...items, { ...item, quantity: 1 }],
            cafeId: itemCafeId,
            cafeName: itemCafeName,
          })
        }
      },
      
      removeItem: (itemId) => {
        const { items } = get()
        const updatedItems = items.filter((item) => item.id !== itemId)
        set({ 
          items: updatedItems,
          cafeId: updatedItems.length > 0 ? get().cafeId : null,
          cafeName: updatedItems.length > 0 ? get().cafeName : '',
        })
      },
      
      updateQuantity: (itemId, quantity) => {
        const { items } = get()
        if (quantity <= 0) {
          get().removeItem(itemId)
          return
        }
        
        const updatedItems = items.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        )
        set({ items: updatedItems })
      },
      
      clearCart: () => {
        set({ items: [], cafeId: null, cafeName: '' })
      },
      
      getTotal: () => {
        const { items } = get()
        return items.reduce((total, item) => total + (item.price * item.quantity), 0)
      },
      
      getItemCount: () => {
        const { items } = get()
        return items.length // Return unique item count instead of total quantity
      },
      
      getTotalQuantity: () => {
        const { items } = get()
        return items.reduce((count, item) => count + item.quantity, 0)
      },
    }))