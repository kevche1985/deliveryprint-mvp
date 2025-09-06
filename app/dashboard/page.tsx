import dynamic from "next/dynamic"
import { Loader2 } from "lucide-react"

// Dynamically import the client component to prevent SSR issues
const DashboardClient = dynamic(() => import("@/components/dashboard-client"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  ),
})

export default function DashboardPage() {
  return <DashboardClient />
}
