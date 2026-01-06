import { supabaseServer } from "@/lib/supabase-server"

type Role = "admin" | "operator" | "customer" | "supplier"

export async function requireRole(request: Request, allowed: Role[]) {
  const auth = request.headers.get("authorization") || request.headers.get("Authorization")
  if (!auth || !auth.toLowerCase().startsWith("bearer ")) {
    return { ok: false, status: 401 }
  }
  const token = auth.slice(7)
  const { data: userData, error: userError } = await supabaseServer.auth.getUser(token)
  if (userError || !userData?.user) {
    return { ok: false, status: 401 }
  }
  const userId = userData.user.id
  const { data: profile, error: profileError } = await supabaseServer
    .from("user_profiles")
    .select("role")
    .eq("id", userId)
    .single()
  if (profileError) {
    return { ok: false, status: 403 }
  }
  const role = profile.role as Role
  if (!allowed.includes(role)) {
    return { ok: false, status: 403 }
  }
  return { ok: true, role }
}

