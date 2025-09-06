import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log('🧹 Starting cleanup of unpurchased digital products...')
    
    // Create service role client for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
    
    // Calculate 48 hours ago
    const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000)
    
    console.log(`🕒 Looking for unpurchased designs created before: ${fortyEightHoursAgo.toISOString()}`)
    
    // Find unpurchased designs older than 48 hours
    const { data: expiredDesigns, error: fetchError } = await supabase
      .from('digital_products')
      .select('*')
      .eq('status', 'unpurchased')
      .lt('created_at', fortyEightHoursAgo.toISOString())
    
    if (fetchError) {
      console.error('❌ Error fetching expired designs:', fetchError)
      throw fetchError
    }
    
    console.log(`📊 Found ${expiredDesigns?.length || 0} expired designs to clean up`)
    
    let cleanedCount = 0
    let storageCleanedCount = 0
    let errors: string[] = []
    
    if (expiredDesigns && expiredDesigns.length > 0) {
      for (const design of expiredDesigns) {
        try {
          console.log(`🗑️ Cleaning up design: ${design.id} - ${design.name}`)
          
          // Delete from storage if download_url exists
          if (design.download_url) {
            try {
              // Extract file path from URL
              const urlParts = design.download_url.split('/')
              const bucketIndex = urlParts.findIndex((part: string) => part === 'digital-products')
              
              if (bucketIndex !== -1) {
                const filePath = urlParts.slice(bucketIndex + 1).join('/')
                
                const { error: storageError } = await supabase.storage
                  .from('digital-products')
                  .remove([filePath])
                
                if (storageError) {
                  console.warn(`⚠️ Storage cleanup warning for ${design.id}:`, storageError.message)
                  errors.push(`Storage cleanup failed for ${design.id}: ${storageError.message}`)
                } else {
                  storageCleanedCount++
                  console.log(`✅ Storage file deleted: ${filePath}`)
                }
              }
            } catch (storageError) {
              console.warn(`⚠️ Storage cleanup error for ${design.id}:`, storageError)
              errors.push(`Storage cleanup error for ${design.id}: ${storageError}`)
            }
          }
          
          // Delete from database
          const { error: deleteError } = await supabase
            .from('digital_products')
            .delete()
            .eq('id', design.id)
          
          if (deleteError) {
            console.error(`❌ Database cleanup error for ${design.id}:`, deleteError)
            errors.push(`Database cleanup failed for ${design.id}: ${deleteError.message}`)
          } else {
            cleanedCount++
            console.log(`✅ Database record deleted: ${design.id}`)
          }
          
        } catch (designError) {
          console.error(`❌ Error cleaning design ${design.id}:`, designError)
          errors.push(`Failed to clean design ${design.id}: ${designError}`)
        }
      }
    }
    
    // Log cleanup summary
    console.log(`🎯 Cleanup Summary:`)
    console.log(`   - Database records cleaned: ${cleanedCount}`)
    console.log(`   - Storage files cleaned: ${storageCleanedCount}`)
    console.log(`   - Errors encountered: ${errors.length}`)
    
    if (errors.length > 0) {
      console.log(`⚠️ Cleanup errors:`, errors)
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: `Cleanup completed successfully`,
      summary: {
        totalExpiredFound: expiredDesigns?.length || 0,
        databaseRecordsCleaned: cleanedCount,
        storageFilesCleaned: storageCleanedCount,
        errorsEncountered: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        cleanupTimestamp: new Date().toISOString(),
        cutoffTime: fortyEightHoursAgo.toISOString()
      }
    })
    
  } catch (error: any) {
    console.error('💥 Critical error in cleanup cron job:', error)
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error occurred during cleanup',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

// Also support POST for manual triggering
export async function POST() {
  console.log('🔧 Manual cleanup triggered via POST request')
  return GET()
}