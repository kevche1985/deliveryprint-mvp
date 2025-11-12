import { redirect } from "next/navigation"

export default function TenantIndex({ params }: { params: { slug: string } }) {
  // Redirect to the tenant's products listing for now
  redirect(`/t/${params.slug}/products`)
}