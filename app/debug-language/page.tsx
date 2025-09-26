"use client"

import { useLanguage } from "@/lib/language-context"
import { useEffect, useState } from "react"

export default function DebugLanguagePage() {
  const { language, setLanguage, t } = useLanguage()
  const [localStorageValue, setLocalStorageValue] = useState<string | null>(null)
  const [browserLanguage, setBrowserLanguage] = useState<string>("")

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLocalStorageValue(localStorage.getItem("language"))
      setBrowserLanguage(navigator.language)
    }
  }, [])

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Language Debug Page</h1>
      
      <div className="space-y-4">
        <div className="p-4 border rounded">
          <h2 className="font-semibold">Current Language Context:</h2>
          <p>Language: {language}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">LocalStorage Value:</h2>
          <p>Stored language: {localStorageValue || "null"}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Browser Language:</h2>
          <p>Navigator language: {browserLanguage}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Translation Test:</h2>
          <p>auth.login.title: {t("auth.login.title")}</p>
          <p>auth.login.welcome: {t("auth.login.welcome")}</p>
          <p>auth.login.emailPlaceholder: {t("auth.login.emailPlaceholder")}</p>
        </div>

        <div className="p-4 border rounded">
          <h2 className="font-semibold">Language Controls:</h2>
          <div className="space-x-2">
            <button 
              onClick={() => setLanguage("es")}
              className="px-4 py-2 bg-blue-500 text-white rounded"
            >
              Set Spanish
            </button>
            <button 
              onClick={() => setLanguage("en")}
              className="px-4 py-2 bg-green-500 text-white rounded"
            >
              Set English
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}