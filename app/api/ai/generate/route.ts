import { type NextRequest, NextResponse } from "next/server"

// Explicitly set this as a server-side only route
export const runtime = "nodejs"

export async function POST(request: NextRequest) {
  console.log("AI generation API route called")

  try {
    // Parse the request body
    const body = await request.json()
    const { prompt, type, userId } = body

    console.log("Request body:", { type, userId, promptLength: prompt?.length })

    // Validate required fields
    if (!prompt || !type || !userId) {
      console.error("Missing required fields:", { prompt: !!prompt, type: !!type, userId: !!userId })
      return NextResponse.json(
        { error: "Missing required fields: prompt, type, and userId are required" },
        { status: 400 },
      )
    }

    console.log("Processing AI generation:", { type, userId, promptLength: prompt.length })

    try {
      // Get API key from environment variable - NEVER hardcode API keys
      const apiKey = process.env.OPENAI_API_KEY

      if (!apiKey) {
        throw new Error("OpenAI API key is not set in environment variables")
      }

      // Test OpenAI connection first
      console.log("Testing OpenAI connection...")
      const testResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })

      if (!testResponse.ok) {
        throw new Error("OpenAI API connection failed")
      }

      // Moderate content first
      console.log("Moderating content...")
      const moderationResponse = await fetch("https://api.openai.com/v1/moderations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: prompt,
        }),
      })

      if (moderationResponse.ok) {
        const moderationData = await moderationResponse.json()
        if (moderationData.results?.[0]?.flagged) {
          console.log("Content flagged by moderation")
          return NextResponse.json(
            { error: "Your prompt contains inappropriate content and cannot be processed" },
            { status: 400 },
          )
        }
      }

      // Enhance prompt based on type
      let enhancedPrompt = prompt
      if (type === "logo") {
        enhancedPrompt = `Create a professional logo design: ${prompt}. The logo should be clean, memorable, and work well at different sizes. Use a transparent or white background.`
      } else if (type === "image") {
        enhancedPrompt = `Create a high-quality image: ${prompt}. The image should be detailed, visually appealing, and suitable for printing.`
      } else if (type === "font") {
        enhancedPrompt = `Create a custom typography design for the text: ${prompt}. The font should be unique, readable, and reflect the character of the text.`
      }

      console.log("Enhanced prompt created, sending to OpenAI...")

      // Generate image with OpenAI
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "dall-e-3",
          prompt: enhancedPrompt,
          n: 1,
          size: "1024x1024",
          quality: "standard",
          response_format: "url",
        }),
      })

      // Handle API errors
      if (!response.ok) {
        const errorData = await response.json()
        console.error("OpenAI API error response:", errorData)
        throw new Error(errorData.error?.message || "Failed to generate image")
      }

      const data = await response.json()
      console.log("OpenAI API response received successfully")

      // Validate response data
      if (!data.data || !data.data[0] || !data.data[0].url) {
        console.error("Invalid response format from OpenAI:", data)
        throw new Error("Invalid response format from OpenAI")
      }

      const imageUrl = data.data[0].url
      const revisedPrompt = data.data[0].revised_prompt || enhancedPrompt

      console.log("Image generated successfully:", imageUrl)

      // Save to database using dynamic import to avoid SSR issues
      try {
        const { createClient } = await import("@supabase/supabase-js")
        const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

        console.log("Saving design to database...")
        const { data: designData, error } = await supabase
          .from("designs")
          .insert([
            {
              name: type === "logo" ? "Custom Logo" : type === "font" ? "Custom Font" : "Custom Image",
              thumbnail_url: imageUrl,
              user_id: userId,
              design_data: {
                originalPrompt: prompt,
                enhancedPrompt,
                revisedPrompt,
                originalUrl: imageUrl,
                watermarkedUrl: imageUrl,
                type,
                generatedAt: new Date().toISOString(),
              },
              is_public: false,
              is_template: false,
            },
          ])
          .select()

        if (error) {
          console.error("Error saving design to database:", error)
          // Don't fail the request if database save fails
        } else {
          console.log("Design saved successfully:", designData[0]?.id)
        }

        return NextResponse.json({
          success: true,
          designId: designData?.[0]?.id,
          watermarkedUrl: imageUrl,
          type,
          revisedPrompt,
        })
      } catch (dbError) {
        console.error("Database error:", dbError)
        // Return success even if database save fails
        return NextResponse.json({
          success: true,
          watermarkedUrl: imageUrl,
          type,
          revisedPrompt,
          note: "Image generated successfully, but not saved to database",
        })
      }
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError)

      // Fall back to mock generator if OpenAI fails
      console.log("Falling back to mock generator")
      return generateMockDesign(request, prompt, type, userId)
    }
  } catch (error) {
    console.error("Error in AI generation:", error)

    // Provide more specific error messages
    let errorMessage = "Failed to generate image"
    if (error instanceof Error) {
      if (error.message.includes("Invalid OpenAI API key")) {
        errorMessage = "OpenAI API key is invalid"
      } else if (error.message.includes("rate limit")) {
        errorMessage = "Too many requests. Please try again later."
      } else if (error.message.includes("quota")) {
        errorMessage = "OpenAI quota exceeded. Please try again later."
      } else {
        errorMessage = error.message
      }
    }

    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}

// Helper function to generate mock designs
function generateMockDesign(request: NextRequest, prompt: string, type: string, userId: string) {
  let mockUrl = ""

  // Simple logic to choose a mock based on type and content
  if (type === "logo") {
    if (prompt.toLowerCase().includes("tech") || prompt.toLowerCase().includes("technology")) {
      mockUrl = "/placeholder.svg?height=400&width=400&text=Tech+Logo"
    } else if (prompt.toLowerCase().includes("health") || prompt.toLowerCase().includes("medical")) {
      mockUrl = "/placeholder.svg?height=400&width=400&text=Health+Logo"
    } else {
      mockUrl = "/placeholder.svg?height=400&width=400&text=Professional+Logo"
    }
  } else if (type === "image") {
    mockUrl = "/placeholder.svg?height=400&width=400&text=Custom+Image"
  } else if (type === "font") {
    mockUrl = "/placeholder.svg?height=400&width=400&text=Custom+Font"
  } else {
    mockUrl = "/placeholder.svg?height=400&width=400&text=AI+Generated"
  }

  console.log("Mock design URL:", mockUrl)

  return NextResponse.json({
    success: true,
    watermarkedUrl: mockUrl,
    type,
    revisedPrompt: `Mock generation for: ${prompt}`,
    note: "Using mock generator for demonstration purposes. OpenAI API is not available.",
  })
}
