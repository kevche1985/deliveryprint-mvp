const fs = require('fs');
const path = require('path');

console.log('🔍 Testing Multilingual Implementation...\n');

// Test 1: Verify Spanish translation file structure
console.log('1. Testing Spanish translation file structure:');
try {
  const esLatamPath = path.join(__dirname, 'lib/translations/es-latam.json');
  const esLatam = JSON.parse(fs.readFileSync(esLatamPath, 'utf8'));
  
  console.log('✅ Spanish LATAM file loaded successfully');
  console.log(`   - Total keys: ${Object.keys(esLatam).length}`);
  
  // Check auth.login structure
  if (esLatam.auth && esLatam.auth.login && typeof esLatam.auth.login === 'object') {
    console.log('✅ auth.login is an object (correct structure)');
    console.log(`   - auth.login keys: ${Object.keys(esLatam.auth.login).join(', ')}`);
    
    // Check specific keys
    const requiredKeys = ['signUp', 'forgotPassword', 'title', 'welcome'];
    const missingKeys = requiredKeys.filter(key => !esLatam.auth.login[key]);
    
    if (missingKeys.length === 0) {
      console.log('✅ All required auth.login keys present');
      console.log(`   - signUp: "${esLatam.auth.login.signUp}"`);
      console.log(`   - forgotPassword: "${esLatam.auth.login.forgotPassword}"`);
    } else {
      console.log(`❌ Missing keys: ${missingKeys.join(', ')}`);
    }
  } else {
    console.log('❌ auth.login is not an object or missing');
  }
} catch (error) {
  console.log('❌ Error loading Spanish LATAM translations:', error.message);
}

// Test 2: Compare with English structure
console.log('\n2. Comparing with English translation structure:');
let en, esLatam;
try {
  const esLatamPath = path.join(__dirname, 'lib/translations/es-latam.json');
  esLatam = JSON.parse(fs.readFileSync(esLatamPath, 'utf8'));
  
  const enPath = path.join(__dirname, 'lib/translations/en.json');
  en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  
  console.log('✅ English file loaded successfully');
  
  if (en.auth && en.auth.login && typeof en.auth.login === 'object') {
    console.log('✅ English auth.login is also an object');
    
    const enKeys = Object.keys(en.auth.login);
    const esKeys = Object.keys(esLatam.auth.login);
    
    console.log(`   - English auth.login keys: ${enKeys.length}`);
    console.log(`   - Spanish auth.login keys: ${esKeys.length}`);
    
    const missingInSpanish = enKeys.filter(key => !esKeys.includes(key));
    const extraInSpanish = esKeys.filter(key => !enKeys.includes(key));
    
    if (missingInSpanish.length === 0 && extraInSpanish.length === 0) {
      console.log('✅ Perfect key parity between languages');
    } else {
      if (missingInSpanish.length > 0) {
        console.log(`⚠️  Missing in Spanish: ${missingInSpanish.join(', ')}`);
      }
      if (extraInSpanish.length > 0) {
        console.log(`ℹ️  Extra in Spanish: ${extraInSpanish.join(', ')}`);
      }
    }
  }
} catch (error) {
  console.log('❌ Error loading English translations:', error.message);
}

// Test 3: Check for duplicate auth sections
console.log('\n3. Checking for duplicate auth sections:');
try {
  const esLatamContent = fs.readFileSync(path.join(__dirname, 'lib/translations/es-latam.json'), 'utf8');
  const authMatches = esLatamContent.match(/"auth"\s*:/g);
  
  if (authMatches) {
    console.log(`   - Found ${authMatches.length} "auth" section(s)`);
    if (authMatches.length === 1) {
      console.log('✅ No duplicate auth sections');
    } else {
      console.log('❌ Multiple auth sections found - this could cause overriding issues');
    }
  } else {
    console.log('❌ No auth sections found');
  }
} catch (error) {
  console.log('❌ Error checking for duplicates:', error.message);
}

// Test 4: Verify cart translations
console.log('\n4. Testing cart translations:');
try {
  const esLatamPath = path.join(__dirname, 'lib/translations/es-latam.json');
  const esLatamForCart = JSON.parse(fs.readFileSync(esLatamPath, 'utf8'));
  
  if (esLatamForCart.cart) {
    console.log('✅ Cart section exists');
    console.log(`   - cart.empty: "${esLatamForCart.cart.empty || 'MISSING'}"`);
    console.log(`   - cart.items: "${esLatamForCart.cart.items || 'MISSING'}"`);
    console.log(`   - cart.browseProducts: "${esLatamForCart.cart.browseProducts || 'MISSING'}"`);
  } else {
    console.log('❌ Cart section missing');
  }
} catch (error) {
  console.log('❌ Error checking cart translations:', error.message);
}

console.log('\n🎉 Multilingual test completed!');