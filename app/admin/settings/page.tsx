"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">No configurable settings available yet.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admin Settings</CardTitle>
          <CardDescription>Feature toggles are currently disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600">Contact support to enable configuration options.</p>
        </CardContent>
      </Card>
    </div>
  )
}
