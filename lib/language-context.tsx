"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"

type Language = "en" | "es"

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

// Comprehensive inline translations
const translations = {
  en: {
    navigation: {
      home: "Home",
      products: "Products",
      digitalProducts: "Digital Products",
      services: "Services",
      aiStudio: "AI Studio",
      about: "About",
      contact: "Contact",
      signIn: "Sign In",
      signOut: "Sign Out",
      getStarted: "Get Started",
      dashboard: "Dashboard",
      orders: "Orders",
      downloads: "Downloads",
      settings: "Settings",
      admin: "Admin",
      cart: "Cart",
      checkout: "Checkout",
      supplierPortal: "Supplier Portal",
    },
    cart: {
      title: "Your Cart",
      empty: "Your cart is empty",
      emptyDescription: "Add some products to your cart to get started",
      browseProducts: "Browse Products",
      proceedToCheckout: "Proceed to Checkout",
      items: "items",
      removeItem: "Remove item",
      updateQuantity: "Update quantity",
    },
    products: {
      title: "Products",
      description: "Discover our wide range of custom printing products",
    },
    orders: {
      title: "Orders",
      myOrders: "My Orders",
    },
    dashboard: {
      title: "Dashboard",
    },
    settings: {
      title: "Settings",
    },
    admin: {
      title: "Admin",
      dashboard: "Admin Dashboard",
    },
    auth: {
      welcomeBack: "Welcome back",
      enterCredentials: "Enter your credentials to access your account",
      signIn: "Sign In",
      signOut: "Sign Out",
      getStarted: "Get Started",
    },
    supplier: {
      portal: "Supplier Portal",
    },
    users: {
      title: "Users",
    },
    quotes: {
      title: "Quotes",
    },
    payment: {
      modal: {
        title: "Payment Details"
      },
      testMode: {
        title: "Test Mode",
        description: "Wompi test mode - Use CVV to simulate different scenarios:"
      },
      testCard: {
        declined: "Payment will be rejected",
        othersSuccess: "Payment will be successful"
      },
      security: {
        sslEncrypted: "SSL Encrypted",
        pciCompliant: "PCI Compliant",
        notice: "Your payment information is secure and encrypted"
      },
      form: {
        cardNumber: "Card Number",
        month: "Month",
        year: "Year",
        cvv: "CVV",
        cardholderName: "Cardholder Name",
        country: "Country",
        region: "Region"
      },
      summary: {
        totalToPay: "Total to Pay:"
      },
      payButton: "Pay",
      error: {
        title: "Payment Error",
        processingFailed: "Payment processing failed. Please try again."
      },
      success: {
        title: "Payment Successful",
        transactionId: "Transaction ID"
      },
      "3ds": {
        processing: {
          title: "Processing Payment",
          message: "Please wait while we verify your payment...",
        },
        success: {
          title: "Payment Successful!",
          message: "Your payment has been processed successfully.",
        },
        failed: {
          title: "Payment Failed",
          message: "Your payment could not be processed.",
        },
        error: {
          title: "Payment Error",
          message: "There was an error processing your payment.",
        },
        verifying: "Verifying payment with bank...",
        viewOrder: "View Order Details",
        viewAllOrders: "View All Orders",
        tryAgain: "Try Again",
        continueShopping: "Continue Shopping",
        transactionId: "Transaction ID",
      },
      errors: {
        insufficientFunds: "Insufficient funds in your account",
        declined: "Card declined by your bank",
        expiredCard: "Your card has expired",
        limitExceeded: "Transaction limit exceeded",
        restrictedCard: "Card is restricted",
        generic: "Payment failed. Please try again.",
      },
    },
    common: {
      loading: "Loading...",
      error: "Error",
      success: "Success",
      cancel: "Cancel",
      save: "Save",
      delete: "Delete",
      edit: "Edit",
      add: "Add",
      remove: "Remove",
      search: "Search",
      filter: "Filter",
      sort: "Sort",
      next: "Next",
      previous: "Previous",
      submit: "Submit",
      close: "Close",
    },
  },
  es: {
    navigation: {
      home: "Inicio",
      products: "Productos",
      digitalProducts: "Productos Digitales",
      services: "Servicios",
      aiStudio: "Estudio IA",
      about: "Acerca de",
      contact: "Contacto",
      signIn: "Iniciar Sesión",
      signOut: "Cerrar Sesión",
      getStarted: "Comenzar",
      dashboard: "Panel",
      orders: "Pedidos",
      downloads: "Descargas",
      settings: "Configuración",
      admin: "Administrador",
      cart: "Carrito",
      checkout: "Pagar",
      supplierPortal: "Portal de Proveedores",
    },
    cart: {
      title: "Tu Carrito",
      empty: "Tu carrito está vacío",
      emptyDescription: "Agrega algunos productos a tu carrito para comenzar",
      browseProducts: "Ver Productos",
      proceedToCheckout: "Proceder al Pago",
      items: "artículos",
      removeItem: "Eliminar artículo",
      updateQuantity: "Actualizar cantidad",
    },
    products: {
      title: "Productos",
      description: "Descubre nuestra amplia gama de productos de impresión personalizada",
    },
    orders: {
      title: "Pedidos",
      myOrders: "Mis Pedidos",
    },
    dashboard: {
      title: "Panel",
    },
    settings: {
      title: "Configuración",
    },
    admin: {
      title: "Administrador",
      dashboard: "Panel de Administración",
    },
    auth: {
      signIn: "Iniciar Sesión",
      signOut: "Cerrar Sesión",
      getStarted: "Comenzar",
    },
    supplier: {
      portal: "Portal de Proveedores",
    },
    users: {
      title: "Usuarios",
    },
    quotes: {
      title: "Cotizaciones",
    },
    payment: {
      modal: {
        title: "Detalles de Pago"
      },
      testMode: {
        title: "Modo de Prueba",
        description: "Modo de prueba Wompi - Usa CVV para simular diferentes escenarios:"
      },
      testCard: {
        declined: "El pago será rechazado",
        othersSuccess: "El pago será exitoso"
      },
      security: {
        sslEncrypted: "Cifrado SSL",
        pciCompliant: "Cumple PCI",
        notice: "Tu información de pago está segura y cifrada"
      },
      form: {
        cardNumber: "Número de Tarjeta",
        month: "Mes",
        year: "Año",
        cvv: "CVV",
        cardholderName: "Nombre del Titular",
        country: "País",
        region: "Región"
      },
      summary: {
        totalToPay: "Total a Pagar:"
      },
      payButton: "Pagar",
      error: {
        title: "Error de Pago",
        processingFailed: "El procesamiento del pago falló. Por favor intenta de nuevo."
      },
      success: {
        title: "Pago Exitoso",
        transactionId: "ID de Transacción"
      },
      "3ds": {
        processing: {
          title: "Procesando Pago",
          message: "Por favor espere mientras verificamos su pago...",
        },
        success: {
          title: "¡Pago Exitoso!",
          message: "Su pago ha sido procesado exitosamente.",
        },
        failed: {
          title: "Pago Fallido",
          message: "Su pago no pudo ser procesado.",
        },
        error: {
          title: "Error de Pago",
          message: "Hubo un error procesando su pago.",
        },
        verifying: "Verificando pago con el banco...",
        viewOrder: "Ver Detalles del Pedido",
        viewAllOrders: "Ver Todos los Pedidos",
        tryAgain: "Intentar de Nuevo",
        continueShopping: "Continuar Comprando",
        transactionId: "ID de Transacción",
      },
      errors: {
        insufficientFunds: "Fondos insuficientes en su cuenta",
        declined: "Tarjeta rechazada por su banco",
        expiredCard: "Su tarjeta ha expirado",
        limitExceeded: "Límite de transacción excedido",
        restrictedCard: "Tarjeta restringida",
        generic: "Pago fallido. Por favor intente de nuevo.",
      },
    },
    common: {
      loading: "Cargando...",
      error: "Error",
      success: "Éxito",
      cancel: "Cancelar",
      save: "Guardar",
      delete: "Eliminar",
      edit: "Editar",
      add: "Agregar",
      remove: "Quitar",
      search: "Buscar",
      filter: "Filtrar",
      sort: "Ordenar",
      next: "Siguiente",
      previous: "Anterior",
      submit: "Enviar",
      close: "Cerrar",
    },
  },
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>("en")

  // Load language from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedLanguage = localStorage.getItem("language") as Language
        if (savedLanguage && (savedLanguage === "en" || savedLanguage === "es")) {
          setLanguage(savedLanguage)
        } else {
          // Detect browser language
          const browserLang = navigator.language.toLowerCase()
          if (browserLang.startsWith("es")) {
            setLanguage("es")
          } else {
            setLanguage("en")
          }
        }
      } catch (error) {
        console.error("Error loading language from localStorage:", error)
        setLanguage("en")
      }
    }
  }, [])

  // Save language to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("language", language)
      } catch (error) {
        console.error("Error saving language to localStorage:", error)
      }
    }
  }, [language])

  // Translation function
  const t = (key: string): string => {
    try {
      const keys = key.split(".")
      let value: any = translations[language]

      for (const k of keys) {
        if (value && typeof value === "object" && k in value) {
          value = value[k]
        } else {
          // Fallback to English if key not found
          value = translations.en
          for (const fallbackKey of keys) {
            if (value && typeof value === "object" && fallbackKey in value) {
              value = value[fallbackKey]
            } else {
              return key // Return key if not found in fallback
            }
          }
          break
        }
      }

      return typeof value === "string" ? value : key
    } catch (error) {
      console.error("Error in translation function:", error)
      return key
    }
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}
