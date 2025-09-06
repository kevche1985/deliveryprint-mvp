// OpenAI integration for DeliveryPrint
// This file handles all OpenAI API interactions with proper error handling and fallbacks

export interface GenerateImageOptions {
  prompt: string
  size?: "1024x1024" | "1792x1024" | "1024x1792"
  quality?: "standard" | "hd"
  style?: "vivid" | "natural"
}

export interface GenerateImageResult {
  url: string
  revisedPrompt?: string
}

export interface ModerationResult {
  flagged: boolean
  categories?: Record<string, boolean>
}

export interface ConnectionTestResult {
  success: boolean
  error?: string
}

/**
 * Test OpenAI API connection
 */
export async function testOpenAIConnection(): Promise<ConnectionTestResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      return {
        success: false,
        error: "OpenAI API key is not set in environment variables",
      }
    }

    console.log("Testing OpenAI connection...")

    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      return {
        success: false,
        error: errorData.error?.message || "OpenAI API connection failed",
      }
    }

    console.log("OpenAI connection test successful")
    return { success: true }
  } catch (error) {
    console.error("OpenAI connection test failed:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown connection error",
    }
  }
}

/**
 * Moderate content using OpenAI's moderation API
 */
export async function moderateContent(text: string): Promise<ModerationResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error("OpenAI API key is not set")
    }

    console.log("Moderating content...")

    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        input: text,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error?.message || "Moderation API failed")
    }

    const data = await response.json()
    const result = data.results?.[0]

    return {
      flagged: result?.flagged || false,
      categories: result?.categories || {},
    }
  } catch (error) {
    console.error("Content moderation failed:", error)
    // Return safe default if moderation fails
    return { flagged: false }
  }
}

/**
 * Generate an image using OpenAI's DALL-E API
 */
export async function generateImage(
  prompt: string,
  options: Partial<GenerateImageOptions> = {},
): Promise<GenerateImageResult> {
  try {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
      throw new Error("OpenAI API key is not set in environment variables")
    }

    console.log("Generating image with OpenAI DALL-E...")

    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt,
        n: 1,
        size: options.size || "1024x1024",
        quality: options.quality || "standard",
        style: options.style || "natural",
        response_format: "url",
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("OpenAI API error:", errorData)
      throw new Error(errorData.error?.message || "Failed to generate image")
    }

    const data = await response.json()

    if (!data.data || !data.data[0] || !data.data[0].url) {
      throw new Error("Invalid response format from OpenAI")
    }

    console.log("Image generated successfully")

    return {
      url: data.data[0].url,
      revisedPrompt: data.data[0].revised_prompt,
    }
  } catch (error) {
    console.error("Image generation failed:", error)
    throw error
  }
}

/**
 * Generate a logo with specific formatting
 */
export async function generateLogo(
  businessName: string,
  industry: string,
  style?: string,
  colors?: string,
  slogan?: string,
): Promise<GenerateImageResult> {
  const prompt = `Create a professional logo for "${businessName}", a ${industry} company. ${
    slogan ? `Company slogan: "${slogan}". ` : ""
  }${style ? `Style: ${style}. ` : "Style: modern and professional. "}${
    colors ? `Colors: ${colors}. ` : "Use appropriate brand colors. "
  }The logo should be clean, memorable, work well at different sizes, and have a transparent or white background.`

  return generateImage(prompt, { quality: "hd" })
}

/**
 * Generate a custom image for printing
 */
export async function generatePrintImage(description: string, style?: string): Promise<GenerateImageResult> {
  const prompt = `Create a high-quality image for printing: ${description}. ${
    style ? `Style: ${style}. ` : "Style: professional and print-ready. "
  }The image should be detailed, visually appealing, and suitable for high-resolution printing.`

  return generateImage(prompt, { quality: "hd" })
}

/**
 * Generate custom typography/font design
 */
export async function generateTypography(text: string, style?: string): Promise<GenerateImageResult> {
  const prompt = `Create a custom typography design for the text: "${text}". ${
    style ? `Style: ${style}. ` : "Style: unique and readable. "
  }The design should be creative, readable, reflect the character of the text, and work well for printing.`

  return generateImage(prompt, { quality: "hd" })
}
