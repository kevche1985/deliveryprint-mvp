"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define cart item type
export type CartItem = {
  id: string // Unique cart item ID
  productId: string
  variantId?: string
  designId?: string
  quantity: number
  price: number
  name: string
  image: string // Now always a URL (either product image URL or Supabase Storage URL)
  customizations?: any // Design data or customizations
}

// Define cart context type
type CartContextType = {
  items: CartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<CartItem, "id">) => void
  updateQuantity: (id: string, quantity: number) => void
  removeItem: (id: string) => void
  clearCart: () => void
}

// Create the context
const CartContext = createContext<CartContextType | undefined>(undefined)

// Generate a unique ID for cart items
const generateId = () => Math.random().toString(36).substring(2, 9)

// Provider component
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)

  // Load cart from localStorage on initial render
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedCart = localStorage.getItem("cart")
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart)
          if (Array.isArray(parsedCart)) {
            setItems(parsedCart)
          }
        }
      } catch (error) {
        console.error("Failed to parse cart from localStorage:", error)
        // Clear corrupted cart data
        try {
          localStorage.removeItem("cart")
        } catch (e) {
          console.error("Failed to clear corrupted cart:", e)
        }
      }
    }
  }, [])

  // Update localStorage and calculations when items change
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("cart", JSON.stringify(items))
        setItemCount(items.reduce((total, item) => total + item.quantity, 0))
        setSubtotal(items.reduce((total, item) => total + item.price * item.quantity, 0))
      } catch (error: any) {
        console.error("Failed to update cart in localStorage:", error)
        if (error.name === "QuotaExceededError" || (error.message && error.message.includes("exceeded the quota"))) {
          alert("Your cart is too large to be saved locally. Please proceed to checkout or remove some items.")
        }
      }
    }
  }, [items])

  // Add an item to the cart
  const addItem = (item: Omit<CartItem, "id">) => {
    try {
      console.log("Adding item to cart:", {
        name: item.name,
        image: item.image,
        isCustomDesign: item.customizations?.is_custom_design,
        designId: item.designId,
      })

      const existingItemIndex = items.findIndex(
        (i) => i.productId === item.productId && i.variantId === item.variantId && i.designId === item.designId, // Include designId in uniqueness check
      )

      if (existingItemIndex !== -1) {
        const updatedItems = [...items]
        updatedItems[existingItemIndex].quantity += item.quantity
        setItems(updatedItems)
        console.log("Cart updated:", item.name)
      } else {
        setItems([...items, { ...item, id: generateId() }])
        console.log("Added to cart:", item.name)
      }
    } catch (error) {
      console.error("Failed to add item to cart:", error)
    }
  }

  // Update the quantity of an item
  const updateQuantity = (id: string, quantity: number) => {
    try {
      if (quantity < 1) return
      setItems(items.map((item) => (item.id === id ? { ...item, quantity } : item)))
    } catch (error) {
      console.error("Failed to update quantity:", error)
    }
  }

  // Remove an item from the cart
  const removeItem = (id: string) => {
    try {
      const itemToRemove = items.find((item) => item.id === id)
      setItems(items.filter((item) => item.id !== id))
      if (itemToRemove) {
        console.log("Removed from cart:", itemToRemove.name)
      }
    } catch (error) {
      console.error("Failed to remove item:", error)
    }
  }

  // Clear the cart
  const clearCart = () => {
    try {
      setItems([])
      console.log("Cart cleared")
    } catch (error) {
      console.error("Failed to clear cart:", error)
    }
  }

  return (
    <CartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

// Custom hook to use the cart context
export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider")
  }
  return context
}
