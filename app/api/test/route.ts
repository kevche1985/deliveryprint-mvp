export async function GET() {
  return new Response(
    JSON.stringify({
      message: "Basic API test working",
      timestamp: new Date().toISOString(),
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    },
  )
}
