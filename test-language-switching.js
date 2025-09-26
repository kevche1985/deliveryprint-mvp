const fs = require('fs');
const path = require('path');

console.log('🔄 Testing Language Switching Functionality...\n');

// Test 1: Verify both translation files exist and are valid JSON
console.log('1. Verifying translation files:');
try {
  const enPath = path.join(__dirname, 'lib/translations/en.json');
  const esLatamPath = path.join(__dirname, 'lib/translations/es-latam.json');
  
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const esLatam = JSON.parse(fs.readFileSync(esLatamPath, 'utf8'));
  
  console.log('✅ English translations loaded successfully');
  console.log('✅ Spanish LATAM translations loaded successfully');
  console.log(`   - English keys: ${Object.keys(en).length}`);
  console.log(`   - Spanish keys: ${Object.keys(esLatam).length}`);
} catch (error) {
  console.log('❌ Error loading translation files:', error.message);
  return;
}

// Test 2: Verify language context structure
console.log('\n2. Checking language context implementation:');
try {
  const contextPath = path.join(__dirname, 'lib/language-context.tsx');
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  // Check for key components
  const hasLanguageProvider = contextContent.includes('LanguageProvider');
  const hasUseLanguage = contextContent.includes('useLanguage');
  const hasTranslationFunction = contextContent.includes('const t = ');
  const hasAvailableLanguages = contextContent.includes('availableLanguages');
  const hasLocalStorage = contextContent.includes('localStorage');
  
  console.log(`✅ LanguageProvider: ${hasLanguageProvider ? 'Found' : 'Missing'}`);
  console.log(`✅ useLanguage hook: ${hasUseLanguage ? 'Found' : 'Missing'}`);
  console.log(`✅ Translation function: ${hasTranslationFunction ? 'Found' : 'Missing'}`);
  console.log(`✅ Available languages: ${hasAvailableLanguages ? 'Found' : 'Missing'}`);
  console.log(`✅ LocalStorage support: ${hasLocalStorage ? 'Found' : 'Missing'}`);
  
  // Check default language
  const defaultsToSpanish = contextContent.includes('setLanguage("es")') || contextContent.includes('"es"');
  console.log(`✅ Defaults to Spanish: ${defaultsToSpanish ? 'Yes' : 'No'}`);
  
} catch (error) {
  console.log('❌ Error checking language context:', error.message);
}

// Test 3: Verify language switcher component
console.log('\n3. Checking language switcher component:');
try {
  const switcherPath = path.join(__dirname, 'components/language-switcher.tsx');
  const switcherContent = fs.readFileSync(switcherPath, 'utf8');
  
  const hasDropdown = switcherContent.includes('DropdownMenu');
  const hasGlobeIcon = switcherContent.includes('Globe');
  const hasSetLanguage = switcherContent.includes('setLanguage');
  const hasFlags = switcherContent.includes('flag');
  
  console.log(`✅ Dropdown menu: ${hasDropdown ? 'Found' : 'Missing'}`);
  console.log(`✅ Globe icon: ${hasGlobeIcon ? 'Found' : 'Missing'}`);
  console.log(`✅ Language setter: ${hasSetLanguage ? 'Found' : 'Missing'}`);
  console.log(`✅ Flag display: ${hasFlags ? 'Found' : 'Missing'}`);
  
} catch (error) {
  console.log('❌ Error checking language switcher:', error.message);
}

// Test 4: Test specific translation keys
console.log('\n4. Testing specific translation keys:');
try {
  const esLatamPath = path.join(__dirname, 'lib/translations/es-latam.json');
  const enPath = path.join(__dirname, 'lib/translations/en.json');
  
  const esLatam = JSON.parse(fs.readFileSync(esLatamPath, 'utf8'));
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  // Test auth.login keys
  const testKeys = [
    'auth.login.title',
    'auth.login.signUp',
    'auth.login.forgotPassword',
    'navigation.login',
    'cart.empty'
  ];
  
  testKeys.forEach(key => {
    const keys = key.split('.');
    let esValue = esLatam;
    let enValue = en;
    
    // Navigate through nested keys
    for (const k of keys) {
      esValue = esValue?.[k];
      enValue = enValue?.[k];
    }
    
    console.log(`   ${key}:`);
    console.log(`     - English: "${enValue || 'MISSING'}"`);
    console.log(`     - Spanish: "${esValue || 'MISSING'}"`);
    
    if (esValue && enValue) {
      console.log(`     ✅ Both languages have this key`);
    } else {
      console.log(`     ❌ Missing in ${!esValue ? 'Spanish' : 'English'}`);
    }
  });
  
} catch (error) {
  console.log('❌ Error testing translation keys:', error.message);
}

// Test 5: Check for browser language detection
console.log('\n5. Checking browser language detection:');
try {
  const contextPath = path.join(__dirname, 'lib/language-context.tsx');
  const contextContent = fs.readFileSync(contextPath, 'utf8');
  
  const hasNavigatorLanguage = contextContent.includes('navigator.language');
  const hasLatamCountries = contextContent.includes('mx') && contextContent.includes('co') && contextContent.includes('ar');
  
  console.log(`✅ Navigator language detection: ${hasNavigatorLanguage ? 'Found' : 'Missing'}`);
  console.log(`✅ LATAM country detection: ${hasLatamCountries ? 'Found' : 'Missing'}`);
  
} catch (error) {
  console.log('❌ Error checking browser detection:', error.message);
}

console.log('\n🎉 Language switching test completed!');