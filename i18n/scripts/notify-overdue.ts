/**
 * Pseudocode-ish script to demonstrate notification triggering
 * when translation reviews are overdue.
 *
 * In a real implementation, you would query your database for
 * translation entries with status 'pending' or 'in_review' whose
 * lastUpdated timestamp is older than the threshold.
 */
type TranslationReview = {
  key: string
  locale: 'es-MX'
  status: 'pending' | 'in_review' | 'approved' | 'rejected'
  lastUpdated: Date
  assignedTo?: string
}

// Mock data
const reviews: TranslationReview[] = [
  { key: 'home.title', locale: 'es-MX', status: 'in_review', lastUpdated: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000) },
  { key: 'product.config.title', locale: 'es-MX', status: 'pending', lastUpdated: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), assignedTo: 'translator@example.com' },
]

function isOverdue(entry: TranslationReview, days = 7): boolean {
  const ageMs = Date.now() - entry.lastUpdated.getTime()
  return ageMs > days * 24 * 60 * 60 * 1000
}

function notifyAdmin(message: string) {
  // Integrate with your email service or dashboard alerts.
  console.log(`[ALERT] ${message}`)
}

function main() {
  const overdue = reviews.filter(r => isOverdue(r, 7) && (r.status === 'pending' || r.status === 'in_review'))
  if (overdue.length) {
    notifyAdmin(`Translation reviews overdue: ${overdue.length} item(s). Keys: ${overdue.map(o => o.key).join(', ')}`)
  } else {
    console.log('No overdue translation reviews ✅')
  }
}

main()