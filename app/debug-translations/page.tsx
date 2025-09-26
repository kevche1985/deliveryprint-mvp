'use client'

import { useLanguage } from '@/lib/language-context'

export default function DebugTranslationsPage() {
  const { t, language, setLanguage, availableLanguages } = useLanguage()

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Translation Debug</h1>
      
      <div className="bg-blue-50 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Current Language State:</h2>
        <p><strong>Active Language:</strong> {language}</p>
        <p><strong>Available Languages:</strong> {JSON.stringify(availableLanguages)}</p>
      </div>

      <div className="bg-green-50 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Language Switcher:</h2>
        <div className="flex gap-2">
          {availableLanguages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code)}
              className={`px-4 py-2 rounded ${
                language === lang.code 
                  ? 'bg-blue-500 text-white' 
                  : 'bg-gray-200 text-gray-700'
              }`}
            >
              {lang.flag} {lang.name}
            </button>
          ))}
        </div>
      </div>
      
      <div className="bg-yellow-50 p-4 rounded mb-6">
        <h2 className="font-semibold mb-2">Testing auth.login translations:</h2>
        <div className="space-y-2">
          <p><strong>auth.login.title:</strong> "{t('auth.login.title')}"</p>
          <p><strong>auth.login.welcome:</strong> "{t('auth.login.welcome')}"</p>
          <p><strong>auth.login.emailPlaceholder:</strong> "{t('auth.login.emailPlaceholder')}"</p>
          <p><strong>auth.login.signIn:</strong> "{t('auth.login.signIn')}"</p>
          <p><strong>auth.login.testAccounts:</strong> "{t('auth.login.testAccounts')}"</p>
        </div>
      </div>
      
      <div className="bg-purple-50 p-4 rounded">
        <h2 className="font-semibold mb-2">Testing simple keys:</h2>
        <div className="space-y-2">
          <p><strong>navigation.home:</strong> "{t('navigation.home')}"</p>
          <p><strong>navigation.login:</strong> "{t('navigation.login')}"</p>
          <p><strong>common.loading:</strong> "{t('common.loading')}"</p>
        </div>
      </div>
    </div>
  )
}