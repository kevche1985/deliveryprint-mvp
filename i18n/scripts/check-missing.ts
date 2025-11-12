/**
 * Check for missing or suspicious translations by comparing keys
 * between English (source-of-truth) and Spanish (es-MX).
 *
 * Usage: ts-node i18n/scripts/check-missing.ts
 */
import fs from 'fs'
import path from 'path'

type Dict = Record<string, any>

function loadJSON(filePath: string): Dict {
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
}

function flattenKeys(obj: Dict, prefix = ''): string[] {
  const keys: string[] = []
  for (const k of Object.keys(obj)) {
    const val = obj[k]
    const full = prefix ? `${prefix}.${k}` : k
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      keys.push(...flattenKeys(val, full))
    } else {
      keys.push(full)
    }
  }
  return keys
}

function checkFile(enFile: string, esFile: string) {
  const en = loadJSON(enFile)
  const es = loadJSON(esFile)
  const enKeys = new Set(flattenKeys(en))
  const esKeys = new Set(flattenKeys(es))

  const missingInEs = [...enKeys].filter(k => !esKeys.has(k))
  const extraInEs = [...esKeys].filter(k => !enKeys.has(k))

  console.log(`\nFile: ${path.basename(enFile)} -> ${path.basename(esFile)}`)
  if (missingInEs.length) {
    console.log(`  Missing in es-MX (${missingInEs.length}):`)
    missingInEs.slice(0, 20).forEach(k => console.log(`   - ${k}`))
    if (missingInEs.length > 20) console.log('   ...')
  } else {
    console.log('  No missing keys in es-MX ✅')
  }

  if (extraInEs.length) {
    console.log(`  Extra keys in es-MX (${extraInEs.length}):`)
    extraInEs.slice(0, 20).forEach(k => console.log(`   - ${k}`))
    if (extraInEs.length > 20) console.log('   ...')
  }
}

function main() {
  const base = path.resolve(__dirname, '..', 'locales')
  const pairs = [
    ['en/home.json', 'es-MX/home.json'],
    ['en/product-config.json', 'es-MX/product-config.json'],
  ]
  for (const [enRel, esRel] of pairs) {
    checkFile(path.join(base, enRel), path.join(base, esRel))
  }
}

main()