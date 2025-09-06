import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase-server"

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const designId = params.id

    // Check if this is a direct browser request or from our download button
    const isDirectAccess = request.headers.get("sec-fetch-dest") === "document"

    // Get the design to verify it exists and get the thumbnail URL
    const supabase = createServerClient()
    const { data: design, error } = await supabase.from("designs").select("*").eq("id", designId).single()

    if (error || !design || !design.thumbnail_url) {
      // If accessed directly in browser, show a friendly HTML page
      if (isDirectAccess) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>Design Download</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 600px; margin: 0 auto; }
                .error { color: #e11d48; background: #fee2e2; padding: 1rem; border-radius: 0.5rem; }
                .button { display: inline-block; background: #8B0000; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem; margin-top: 1rem; }
              </style>
            </head>
            <body>
              <h1>Design Download</h1>
              <div class="error">
                <p>Sorry, the design could not be found or has no image available.</p>
              </div>
              <a href="/dashboard" class="button">Return to Dashboard</a>
            </body>
          </html>`,
          { headers: { "Content-Type": "text/html" } },
        )
      }

      return NextResponse.json({ error: "Design not found or has no image" }, { status: 404 })
    }

    // Get the image from the URL
    const imageResponse = await fetch(design.thumbnail_url)

    if (!imageResponse.ok) {
      if (isDirectAccess) {
        return new NextResponse(
          `<!DOCTYPE html>
          <html>
            <head>
              <title>Design Download</title>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1">
              <style>
                body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 600px; margin: 0 auto; }
                .error { color: #e11d48; background: #fee2e2; padding: 1rem; border-radius: 0.5rem; }
                .button { display: inline-block; background: #8B0000; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem; margin-top: 1rem; }
              </style>
            </head>
            <body>
              <h1>Design Download</h1>
              <div class="error">
                <p>Sorry, we couldn't fetch the image for this design.</p>
              </div>
              <a href="/dashboard" class="button">Return to Dashboard</a>
            </body>
          </html>`,
          { headers: { "Content-Type": "text/html" } },
        )
      }

      return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 })
    }

    // Get the image data
    const imageData = await imageResponse.arrayBuffer()

    // Determine content type based on URL extension or default to png
    let contentType = "image/png"
    if (design.thumbnail_url.endsWith(".jpg") || design.thumbnail_url.endsWith(".jpeg")) {
      contentType = "image/jpeg"
    } else if (design.thumbnail_url.endsWith(".svg")) {
      contentType = "image/svg+xml"
    }

    // Generate filename
    const filename = `${design.name.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.png`

    // Return the image with proper headers
    return new NextResponse(imageData, {
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error("Error downloading design:", error)

    // Check if this is a direct browser request
    const isDirectAccess = request.headers.get("sec-fetch-dest") === "document"

    if (isDirectAccess) {
      return new NextResponse(
        `<!DOCTYPE html>
        <html>
          <head>
            <title>Design Download</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: system-ui, sans-serif; line-height: 1.5; padding: 2rem; max-width: 600px; margin: 0 auto; }
              .error { color: #e11d48; background: #fee2e2; padding: 1rem; border-radius: 0.5rem; }
              .button { display: inline-block; background: #8B0000; color: white; padding: 0.5rem 1rem; text-decoration: none; border-radius: 0.25rem; margin-top: 1rem; }
            </style>
          </head>
          <body>
            <h1>Design Download</h1>
            <div class="error">
              <p>Sorry, an error occurred while trying to download this design.</p>
            </div>
            <a href="/dashboard" class="button">Return to Dashboard</a>
          </body>
        </html>`,
        { headers: { "Content-Type": "text/html" } },
      )
    }

    return NextResponse.json({ error: "Error downloading design" }, { status: 500 })
  }
}
