"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// Define digital product types
export type DigitalProductType = "logo" | "image" | "font"

export type FormatOption = {
  id: string
  name: string
  description: string
  price: number
  included: boolean
}

export type LicenseOption = {
  id: string
  name: string
  description: string
  price: number
  included: boolean
}

export type DigitalCartItem = {
  id: string
  productId: string
  designId: string
  type: DigitalProductType
  name: string
  basePrice: number
  previewUrl: string
  generationInputs: Record<string, any>
  selectedFormats: string[]
  selectedLicense: string
  formatOptions: FormatOption[]
  licenseOptions: LicenseOption[]
  finalPrice: number
  downloadReady: boolean
  createdAt: Date
}

type DigitalCartContextType = {
  items: DigitalCartItem[]
  itemCount: number
  subtotal: number
  addItem: (item: Omit<DigitalCartItem, "id" | "createdAt" | "finalPrice">) => Promise<void>
  updateItemFormats: (id: string, formats: string[]) => void
  updateItemLicense: (id: string, license: string) => void
  removeItem: (id: string) => void
  clearCart: () => void
  calculateItemPrice: (item: DigitalCartItem) => number
}

// Create a default context value to avoid undefined errors
const defaultContextValue: DigitalCartContextType = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  addItem: async () => {},
  updateItemFormats: () => {},
  updateItemLicense: () => {},
  removeItem: () => {},
  clearCart: () => {},
  calculateItemPrice: () => 0,
}

const DigitalCartContext = createContext<DigitalCartContextType>(defaultContextValue)

// Generate a unique ID for cart items
const generateId = () => Math.random().toString(36).substring(2, 9)

// Default format and license options
const getDefaultFormatOptions = (type: DigitalProductType): FormatOption[] => {
  switch (type) {
    case "logo":
      return [
        { id: "basic", name: "Basic Package", description: "SVG, PNG (512x512, 1024x1024)", price: 0, included: true },
        {
          id: "professional",
          name: "Professional Package",
          description: "All basic + AI, EPS, PNG up to 4K",
          price: 2.99,
          included: false,
        },
        {
          id: "enterprise",
          name: "Enterprise Package",
          description: "All formats + source files",
          price: 4.99,
          included: false,
        },
      ]
    case "image":
      return [
        { id: "standard", name: "Standard (1024x1024)", description: "PNG, JPG formats", price: 0, included: true },
        { id: "hd", name: "HD (2048x2048)", description: "High resolution", price: 2.99, included: false },
        { id: "4k", name: "4K (4096x4096)", description: "Ultra high resolution", price: 7.99, included: false },
        { id: "print", name: "Print Ready", description: "Optimized for printing", price: 3.99, included: false },
      ]
    case "font":
      return [
        { id: "web", name: "Web Package", description: "WOFF, WOFF2 formats", price: 0, included: true },
        { id: "desktop", name: "Desktop Package", description: "TTF, OTF formats", price: 4.99, included: false },
        { id: "complete", name: "Complete Package", description: "All formats included", price: 7.99, included: false },
      ]
    default:
      return []
  }
}

const getDefaultLicenseOptions = (): LicenseOption[] => [
  { id: "personal", name: "Personal Use", description: "For non-commercial projects", price: 0, included: true },
  { id: "commercial", name: "Commercial License", description: "For business use", price: 9.99, included: false },
  { id: "extended", name: "Extended License", description: "Unlimited commercial use", price: 19.99, included: false },
]

export function DigitalCartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<DigitalCartItem[]>([])
  const [itemCount, setItemCount] = useState(0)
  const [subtotal, setSubtotal] = useState(0)
  const [isInitialized, setIsInitialized] = useState(false)

  // Calculate item price based on selected options
  const calculateItemPrice = (item: DigitalCartItem): number => {
    try {
      let price = item.basePrice || 0

      // Add format costs
      if (Array.isArray(item.selectedFormats) && Array.isArray(item.formatOptions)) {
        item.selectedFormats.forEach((formatId) => {
          const format = item.formatOptions.find((f) => f.id === formatId)
          if (format && !format.included) {
            price += format.price
          }
        })
      }

      // Add license cost
      if (item.selectedLicense && Array.isArray(item.licenseOptions)) {
        const license = item.licenseOptions.find((l) => l.id === item.selectedLicense)
        if (license && !license.included) {
          price += license.price
        }
      }

      return price
    } catch (error) {
      console.error("Error calculating item price:", error)
      return item.basePrice || 0
    }
  }

  // Load cart from localStorage on initial render
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const savedCart = localStorage.getItem("digitalCart")
        console.log("Loading digital cart from localStorage:", savedCart)

        if (savedCart) {
          try {
            const parsedCart = JSON.parse(savedCart)
            console.log("Parsed digital cart:", parsedCart)

            if (Array.isArray(parsedCart)) {
              // Convert date strings back to Date objects and ensure all properties exist
              const itemsWithDates = parsedCart.map((item) => ({
                ...item,
                createdAt: new Date(item.createdAt || Date.now()),
                formatOptions: Array.isArray(item.formatOptions)
                  ? item.formatOptions
                  : getDefaultFormatOptions(item.type),
                licenseOptions: Array.isArray(item.licenseOptions) ? item.licenseOptions : getDefaultLicenseOptions(),
                selectedFormats: Array.isArray(item.selectedFormats) ? item.selectedFormats : ["basic"],
                selectedLicense: item.selectedLicense || "personal",
                basePrice: typeof item.basePrice === "number" ? item.basePrice : 0,
                finalPrice: typeof item.finalPrice === "number" ? item.finalPrice : 0,
              }))

              console.log("Setting digital cart items:", itemsWithDates)
              setItems(itemsWithDates)
            }
          } catch (parseError) {
            console.error("Failed to parse digital cart:", parseError)
            localStorage.removeItem("digitalCart")
          }
        } else {
          console.log("No digital cart found in localStorage")
        }
      }
    } catch (error) {
      console.error("Error loading digital cart:", error)
    } finally {
      setIsInitialized(true)
    }
  }, [])

  // Update localStorage and calculations when items change
  useEffect(() => {
    if (!isInitialized) return

    try {
      if (typeof window !== "undefined") {
        // Calculate totals
        setItemCount(items.length)

        const total = items.reduce((sum, item) => {
          return sum + calculateItemPrice(item)
        }, 0)

        setSubtotal(total)

        // Save to localStorage
        localStorage.setItem("digitalCart", JSON.stringify(items))
      }
    } catch (error) {
      console.error("Failed to update digital cart:", error)
    }
  }, [items, isInitialized])

  const addItem = async (item: Omit<DigitalCartItem, "id" | "createdAt" | "finalPrice">) => {
    console.log("🛒 addItem called with:", item)
    console.log("🛒 Current cart state before adding:", items)
    console.log("🛒 isInitialized:", isInitialized)
    
    return new Promise<void>((resolve, reject) => {
      try {
        const formatOptions =
          Array.isArray(item.formatOptions) && item.formatOptions.length > 0
            ? item.formatOptions
            : getDefaultFormatOptions(item.type)

        const licenseOptions =
          Array.isArray(item.licenseOptions) && item.licenseOptions.length > 0
            ? item.licenseOptions
            : getDefaultLicenseOptions()

        const selectedFormats =
          Array.isArray(item.selectedFormats) && item.selectedFormats.length > 0 ? item.selectedFormats : ["basic"]

        const selectedLicense = item.selectedLicense || "personal"

        const newItem: DigitalCartItem = {
          ...item,
          id: generateId(),
          createdAt: new Date(),
          formatOptions,
          licenseOptions,
          selectedFormats,
          selectedLicense,
          finalPrice: 0, // Will be calculated below
        }

        newItem.finalPrice = calculateItemPrice(newItem)
        console.log("🛒 New item created:", newItem)
        
        setItems((prev) => {
          const newItems = [...prev, newItem]
          console.log("🛒 Setting new items array:", newItems)
          // Use setTimeout to ensure state update completes before resolving
          setTimeout(() => {
            console.log("✅ Successfully added to digital cart:", newItem.name)
            resolve()
          }, 0)
          return newItems
        })
        
      } catch (error) {
        console.error("❌ Failed to add item to digital cart:", error)
        console.error("❌ Error stack:", error instanceof Error ? error.stack : 'No stack trace available')
        reject(error)
      }
    })
  }

  const updateItemFormats = (id: string, formats: string[]) => {
    try {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedItem = { ...item, selectedFormats: formats }
            updatedItem.finalPrice = calculateItemPrice(updatedItem)
            return updatedItem
          }
          return item
        }),
      )
    } catch (error) {
      console.error("Failed to update item formats:", error)
    }
  }

  const updateItemLicense = (id: string, license: string) => {
    try {
      setItems((prev) =>
        prev.map((item) => {
          if (item.id === id) {
            const updatedItem = { ...item, selectedLicense: license }
            updatedItem.finalPrice = calculateItemPrice(updatedItem)
            return updatedItem
          }
          return item
        }),
      )
    } catch (error) {
      console.error("Failed to update item license:", error)
    }
  }

  const removeItem = (id: string) => {
    try {
      const itemToRemove = items.find((item) => item.id === id)
      setItems((prev) => prev.filter((item) => item.id !== id))
      if (itemToRemove) {
        console.log("Removed from digital cart:", itemToRemove.name)
      }
    } catch (error) {
      console.error("Failed to remove item from digital cart:", error)
    }
  }

  const clearCart = () => {
    try {
      setItems([])
      console.log("Digital cart cleared")
    } catch (error) {
      console.error("Failed to clear digital cart:", error)
    }
  }

  return (
    <DigitalCartContext.Provider
      value={{
        items,
        itemCount,
        subtotal,
        addItem,
        updateItemFormats,
        updateItemLicense,
        removeItem,
        clearCart,
        calculateItemPrice,
      }}
    >
      {children}
    </DigitalCartContext.Provider>
  )
}

export function useDigitalCart() {
  const context = useContext(DigitalCartContext)
  if (!context) {
    throw new Error("useDigitalCart must be used within a DigitalCartProvider")
  }
  return context
}
