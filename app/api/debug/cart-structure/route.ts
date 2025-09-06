import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { cartItems, digitalCartItems, userId } = body

    console.log("🛒 Cart Structure Debug:")
    console.log("User ID:", userId)
    console.log("Cart Items:", cartItems?.length || 0)
    console.log("Digital Cart Items:", digitalCartItems?.length || 0)

    const allItems = [...(cartItems || []), ...(digitalCartItems || [])]

    const analysis = {
      totalItems: allItems.length,
      itemsWithDesignId: allItems.filter((item) => item.designId).length,
      itemsWithUrls: allItems.filter((item) => item.image || item.designUrl || item.storageUrl).length,
      itemsWithCustomizations: allItems.filter((item) => item.customizations).length,
      items: allItems.map((item, index) => ({
        index,
        productId: item.productId,
        name: item.name,
        hasDesignId: !!item.designId,
        designId: item.designId,
        hasImage: !!item.image,
        hasDesignUrl: !!item.designUrl,
        hasStorageUrl: !!item.storageUrl,
        imageUrl: item.image ? `${item.image.substring(0, 50)}...` : null,
        hasCustomizations: !!item.customizations,
        customizationsKeys: item.customizations ? Object.keys(item.customizations) : [],
      })),
    }

    console.log("📊 Cart Analysis:", analysis)

    return NextResponse.json({
      success: true,
      analysis,
      rawData: {
        cartItems,
        digitalCartItems,
      },
    })
  } catch (error) {
    console.error("💥 Cart debug error:", error)
    return NextResponse.json(
      {
        error: "Cart debug failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
