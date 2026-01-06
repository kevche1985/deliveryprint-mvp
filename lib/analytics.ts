export function track(event: string, payload: Record<string, any> = {}) {
  const endpoint = process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT
  if (!endpoint) return
  try {
    fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event, payload, ts: Date.now() }),
      keepalive: true,
    })
  } catch {}
}
