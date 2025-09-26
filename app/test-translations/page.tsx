'use client';

import { useLanguage } from '@/lib/language-context';
import { LanguageSwitcher } from '@/components/language-switcher';

export default function TestTranslationsPage() {
  const { t, language, setLanguage } = useLanguage();

  const testKeys = [
    'auth.login.title',
    'auth.login.signIn',
    'auth.login.signUp',
    'auth.login.forgotPassword',
    'navigation.login',
    'navigation.home',
    'cart.empty',
    'home.hero.title',
    'home.hero.subtitle'
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Translation Test Page
            </h1>
            <LanguageSwitcher />
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-2">Current Language</h2>
            <p className="text-lg">
              <span className="font-medium">Language:</span> {language}
            </p>
            <p className="text-sm text-gray-600">
              {language === 'es' ? 'Español (LATAM)' : 'English'}
            </p>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Manual Language Switch</h2>
            <div className="flex gap-4">
              <button
                onClick={() => setLanguage('en')}
                className={`px-4 py-2 rounded-md ${
                  language === 'en'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                English
              </button>
              <button
                onClick={() => setLanguage('es')}
                className={`px-4 py-2 rounded-md ${
                  language === 'es'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Español (LATAM)
              </button>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Translation Tests</h2>
            <div className="grid gap-4">
              {testKeys.map((key) => (
                <div key={key} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-mono text-gray-500 mb-1">
                        {key}
                      </p>
                      <p className="text-lg font-medium">
                        {t(key)}
                      </p>
                    </div>
                    <div className="ml-4">
                      {t(key) !== key ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Translated
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          ✗ Missing
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Test Instructions</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>Use the language switcher dropdown to change languages</li>
              <li>Use the manual buttons to test language switching</li>
              <li>Verify that all translations appear correctly</li>
              <li>Check that the language persists on page refresh</li>
              <li>Test browser language detection by clearing localStorage</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}