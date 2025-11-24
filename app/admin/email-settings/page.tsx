"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Plus, Edit, Eye, Trash2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/lib/auth-context"
import { Loader2, Mail, Send, CheckCircle, XCircle, Clock, AlertCircle, LogIn } from "lucide-react"
import { useRouter } from "next/navigation"

interface EmailSettings {
  provider: string
  api_key: string
  from_email: string
  from_name: string
  admin_email: string
  is_active: boolean
  email_enabled: boolean
  max_retry_attempts: number
  retry_delay_minutes: number
}

interface EmailTemplate {
  id: string
  template_key: string
  template_name: string
  subject_template: string
  html_template: string
  text_template?: string
  variables: string[]
  is_active: boolean
}

interface EmailLog {
  id: string
  template_key: string
  recipient_email: string
  recipient_name?: string
  subject: string
  status: string
  message_id?: string
  error_message?: string
  sent_at: string
  created_at: string
}

export default function EmailSettingsPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [settings, setSettings] = useState<EmailSettings>({
    provider: "resend",
    api_key: "",
    from_email: "onboarding@resend.dev",
    from_name: "DeliveryPrint",
    admin_email: "",
    is_active: false,
    email_enabled: false,
    max_retry_attempts: 3,
    retry_delay_minutes: 5,
  })
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testEmail, setTestEmail] = useState("")
  const [testSubject, setTestSubject] = useState("Test Email from DeliveryPrint")
  const [testMessage, setTestMessage] = useState(
    "This is a test email to verify your email configuration is working correctly.",
  )
  const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null)
  const [logsLoading, setLogsLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null)
  
  // Add template management state variables HERE (at component level)
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null)
  const [templateForm, setTemplateForm] = useState({
    template_key: '',
    template_name: '',
    subject_template: '',
    html_template: '',
    text_template: '',
    variables: [] as string[],
    is_active: true
  })

  // Template management functions
  const handleCreateTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({
      template_key: '',
      template_name: '',
      subject_template: '',
      html_template: '',
      text_template: '',
      variables: [],
      is_active: true
    })
    setIsTemplateDialogOpen(true)
  }

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template)
    setTemplateForm({
      template_key: template.template_key,
      template_name: template.template_name,
      subject_template: template.subject_template,
      html_template: template.html_template,
      text_template: template.text_template,
      variables: template.variables,
      is_active: template.is_active
    })
    setIsTemplateDialogOpen(true)
  }

  const handleSaveTemplate = async () => {
    try {
      if (!templateForm.template_key || !templateForm.template_name) {
        toast({
          title: "Validation Error",
          description: "Template key and name are required.",
          variant: "destructive"
        })
        return
      }

      setSaving(true)
      const response = await fetch('/api/email/templates', {
        method: editingTemplate ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...templateForm,
          id: editingTemplate?.id
        })
      })

      if (!response.ok) {
        throw new Error('Failed to save template')
      }

      await loadData()
      setIsTemplateDialogOpen(false)
      toast({
        title: "Success",
        description: `Template ${editingTemplate ? 'updated' : 'created'} successfully.`
      })
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${editingTemplate ? 'update' : 'create'} template.`,
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTemplate = async (template: EmailTemplate) => {
    if (!confirm(`Are you sure you want to delete the template "${template.template_name}"?`)) {
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/email/templates?id=${template.id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      await loadData()
      toast({
        title: "Success",
        description: "Template deleted successfully."
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template.",
        variant: "destructive"
      })
    } finally {
      setSaving(false)
    }
  }
  const { toast } = useToast()

  // Check authentication
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to access email settings.",
        variant: "destructive",
      })
      router.push("/auth/login")
      return
    }

    if (user) {
      console.log("User authenticated, loading data:", user.email)
      loadData()
    }
  }, [user, authLoading, router, toast])

  const loadData = async () => {
    await Promise.all([loadSettings(), loadTemplates(), loadLogs()])
  }

  const loadSettings = async () => {
    try {
      setLoading(true)
      console.log("Loading email settings...")

      const response = await fetch("/api/admin/email-settings", {
        credentials: "include",
      })

      console.log("Email settings response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Email settings error:", errorData)
        throw new Error(errorData.error || "Failed to fetch settings")
      }

      const data = await response.json()
      console.log("Email settings loaded:", data)
      setSettings(data.settings)
    } catch (error: any) {
      console.error("Error loading email settings:", error)
      toast({
        title: "Error loading email settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/admin/email-settings/templates", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.templates || [])
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadLogs = async () => {
    try {
      setLogsLoading(true)
      const response = await fetch("/api/admin/email-settings/logs", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setEmailLogs(data.logs || [])
      }
    } catch (error) {
      console.error("Error loading email logs:", error)
    } finally {
      setLogsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    try {
      setSaving(true)
      const response = await fetch("/api/admin/email-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ emailSettings: settings }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to save settings")
      }

      toast({
        title: "Settings saved",
        description: "Email settings have been updated successfully.",
      })
    } catch (error: any) {
      console.error("Error saving settings:", error)
      toast({
        title: "Error saving settings",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const testConnection = async () => {
    try {
      setTesting(true)
      const response = await fetch("/api/admin/email-settings/test-connection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({ settings }),
      })

      const data = await response.json()
      setConnectionStatus(data)

      toast({
        title: data.success ? "Connection successful" : "Connection failed",
        description: data.message,
        variant: data.success ? "default" : "destructive",
      })
    } catch (error: any) {
      console.error("Error testing connection:", error)
      setConnectionStatus({ success: false, message: error.message })
      toast({
        title: "Connection test failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const sendTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Email required",
        description: "Please enter an email address to send the test email.",
        variant: "destructive",
      })
      return
    }

    try {
      setTesting(true)
      const response = await fetch("/api/admin/email-settings/test-send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          message: testMessage,
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Test email sent",
          description: `Test email sent successfully to ${testEmail}`,
        })
        await loadLogs() // Refresh logs
      } else {
        throw new Error(data.error || "Failed to send test email")
      }
    } catch (error: any) {
      console.error("Error sending test email:", error)
      toast({
        title: "Failed to send test email",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "sent":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "failed":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: "default",
      failed: "destructive",
      pending: "secondary",
    } as const

    return <Badge variant={variants[status as keyof typeof variants] || "secondary"}>{status}</Badge>
  }

  // Show loading while checking authentication
  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <LogIn className="h-12 w-12 text-gray-400" />
        <h2 className="text-xl font-semibold text-gray-900">Authentication Required</h2>
        <p className="text-gray-600">Please log in to access email settings.</p>
        <Button onClick={() => router.push("/auth/login")}>Go to Login</Button>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-[#8B0000]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Email Settings</h1>
          <p className="text-gray-600">Configure email notifications with Resend</p>
          <p className="text-sm text-gray-500">Logged in as: {user.email}</p>
        </div>
        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
          <Mail className="h-3 w-3 mr-1" />
          Serverless Ready
        </Badge>
      </div>

      <Tabs defaultValue="provider" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="provider" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Provider Settings
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="testing" className="flex items-center gap-2">
            <Send className="h-4 w-4" />
            Testing
          </TabsTrigger>
          <TabsTrigger value="logs" className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Logs
          </TabsTrigger>
        </TabsList>

        <TabsContent value="provider" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Configuration</CardTitle>
              <CardDescription>Set up your Resend email service provider.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="provider">Email Provider</Label>
                  <Select
                    value={settings.provider}
                    onValueChange={(value) => setSettings({ ...settings, provider: value })}
                  >
                    <SelectTrigger id="provider">
                      <SelectValue placeholder="Select a provider" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="resend">Resend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="api_key">API Key</Label>
                  <Input
                    id="api_key"
                    type="password"
                    value={settings.api_key}
                    onChange={(e) => setSettings({ ...settings, api_key: e.target.value })}
                    placeholder="Enter your Resend API key"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="from_email">From Email Address</Label>
                  <Input
                    id="from_email"
                    type="email"
                    value={settings.from_email}
                    onChange={(e) => setSettings({ ...settings, from_email: e.target.value })}
                    placeholder="onboarding@resend.dev"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="from_name">From Name</Label>
                  <Input
                    id="from_name"
                    value={settings.from_name}
                    onChange={(e) => setSettings({ ...settings, from_name: e.target.value })}
                    placeholder="DeliveryPrint"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin_email">Admin Email (for notifications)</Label>
                <Input
                  id="admin_email"
                  type="email"
                  value={settings.admin_email}
                  onChange={(e) => setSettings({ ...settings, admin_email: e.target.value })}
                  placeholder="admin@yourdomain.com"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={settings.is_active}
                  onCheckedChange={(checked) =>
                    setSettings({ ...settings, is_active: checked, email_enabled: checked })
                  }
                />
                <Label htmlFor="is_active">Enable Email Sending</Label>
              </div>

              <div className="flex gap-2">
                <Button onClick={handleSaveSettings} disabled={saving} className="bg-[#8B0000] hover:bg-[#6B0000]">
                  {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Settings
                </Button>
                <Button variant="outline" onClick={testConnection} disabled={testing}>
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Test Connection
                </Button>
              </div>

              {connectionStatus && (
                <div
                  className={`p-3 rounded-md ${
                    connectionStatus.success
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {connectionStatus.message}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Email Templates</CardTitle>
                <CardDescription>Manage email notification templates for orders and quotes</CardDescription>
              </div>
              <Button onClick={handleCreateTemplate} className="bg-red-600 hover:bg-red-700">
                <Plus className="h-4 w-4 mr-2" />
                Create Template
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                <TableRow>
                <TableHead>Template Name</TableHead>
                <TableHead>Key</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Variables</TableHead>
                <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {templates.length === 0 ? (
                <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                No email templates found. Create your first template to get started.
                </TableCell>
                </TableRow>
                ) : (
                templates.map((template) => (
                <TableRow key={template.id}>
                <TableCell className="font-medium">{template.template_name}</TableCell>
                <TableCell>
                <code className="bg-gray-100 px-2 py-1 rounded text-sm">{template.template_key}</code>
                </TableCell>
                <TableCell>
                <Badge variant={template.is_active ? "default" : "secondary"}>
                {template.is_active ? "Active" : "Inactive"}
                </Badge>
                </TableCell>
                <TableCell>
                <div className="flex flex-wrap gap-1">
                {template.variables.slice(0, 3).map((variable) => (
                <Badge key={variable} variant="outline" className="text-xs">
                {variable}
                </Badge>
                ))}
                {template.variables.length > 3 && (
                <Badge variant="outline" className="text-xs">
                +{template.variables.length - 3} more
                </Badge>
                )}
                </div>
                </TableCell>
                <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                <Button
                variant="outline"
                size="sm"
                onClick={() => handleEditTemplate(template)}
                >
                <Edit className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTemplate(template)}
                >
                <Eye className="h-4 w-4" />
                </Button>
                <Button
                variant="outline"
                size="sm"
                onClick={() => handleDeleteTemplate(template)}
                className="text-red-600 hover:text-red-700"
                >
                <Trash2 className="h-4 w-4" />
                </Button>
                </div>
                </TableCell>
                </TableRow>
                ))
                )}
                </TableBody>
                </Table>
                </CardContent>
                </Card>
                </TabsContent>

                // Add the Template Editor Dialog
                <Dialog open={isTemplateDialogOpen} onOpenChange={setIsTemplateDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                <DialogTitle>
                {editingTemplate ? 'Edit Email Template' : 'Create Email Template'}
                </DialogTitle>
                <DialogDescription>
                {editingTemplate 
                ? 'Update the email template details below.'
                : 'Create a new email template for your notifications.'}
                </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-6 py-4">
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="template_key">Template Key</Label>
                <Input
                id="template_key"
                value={templateForm.template_key}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, template_key: e.target.value }))}
                placeholder="e.g., welcome_email"
                disabled={!!editingTemplate} // Can't change key when editing
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="template_name">Template Name</Label>
                <Input
                id="template_name"
                value={templateForm.template_name}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, template_name: e.target.value }))}
                placeholder="e.g., Welcome Email"
                />
                </div>
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="subject_template">Subject Template</Label>
                <Input
                id="subject_template"
                value={templateForm.subject_template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, subject_template: e.target.value }))}
                placeholder="e.g., Welcome to {{company_name}}, {{customer_name}}!"
                />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="html_template">HTML Template</Label>
                <Textarea
                id="html_template"
                value={templateForm.html_template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, html_template: e.target.value }))}
                placeholder="Enter your HTML email template here..."
                className="min-h-[200px] font-mono text-sm"
                />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="text_template">Text Template (Optional)</Label>
                <Textarea
                id="text_template"
                value={templateForm.text_template}
                onChange={(e) => setTemplateForm(prev => ({ ...prev, text_template: e.target.value }))}
                placeholder="Enter your plain text email template here..."
                className="min-h-[100px] font-mono text-sm"
                />
                </div>
                
                <div className="space-y-2">
                <Label htmlFor="variables">Variables (comma-separated)</Label>
                <Input
                id="variables"
                value={templateForm.variables.join(', ')}
                onChange={(e) => setTemplateForm(prev => ({ 
                ...prev, 
                variables: e.target.value.split(',').map(v => v.trim()).filter(v => v) 
                }))}
                placeholder="e.g., customer_name, order_number, total_amount"
                />
                <p className="text-sm text-gray-500">
                  Use <code>&#123;&#123;variable_name&#125;&#125;</code> in your templates to insert dynamic content.
                </p>
                </div>
                
                <div className="flex items-center space-x-2">
                <Switch
                id="is_active"
                checked={templateForm.is_active}
                onCheckedChange={(checked) => setTemplateForm(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active Template</Label>
                </div>
                </div>
                
                <DialogFooter>
                <Button variant="outline" onClick={() => setIsTemplateDialogOpen(false)}>
                Cancel
                </Button>
                <Button onClick={handleSaveTemplate} className="bg-red-600 hover:bg-red-700">
                {editingTemplate ? 'Update Template' : 'Create Template'}
                </Button>
                </DialogFooter>
                </DialogContent>
                </Dialog>

                {connectionStatus && (
                  <div
                    className={`p-3 rounded-md ${
                      connectionStatus.success ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
                    }`}
                  >
                    {connectionStatus.message}
                  </div>
                )}
              </Tabs>
            </div>
          )
        }
