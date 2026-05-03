"use client"

import { useState, useEffect } from "react"
import { Settings, Save, AlertCircle, Check, Eye, EyeOff, Trash2, TestTube2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [linearApiKey, setLinearApiKey] = useState("")
  const [slackWebhook, setSlackWebhookUrl] = useState("")
  const [saved, setSaved] = useState(false)
  const [showLinearKey, setShowLinearKey] = useState(false)
  const [showSlackWebhook, setShowSlackWebhook] = useState(false)
  const [hasLinearKey, setHasLinearKey] = useState(false)
  const [hasSlackWebhook, setHasSlackWebhook] = useState(false)
  const [testingLinear, setTestingLinear] = useState(false)
  const [testingSlack, setTestingSlack] = useState(false)
  const [linearTestResult, setLinearTestResult] = useState<'success' | 'error' | null>(null)
  const [slackTestResult, setSlackTestResult] = useState<'success' | 'error' | null>(null)

  // Load saved values on mount and when dialog opens
  useEffect(() => {
    if (isOpen) {
      loadSettings()
    }
  }, [isOpen])

  const loadSettings = () => {
    const storedLinear = localStorage.getItem("LINEAR_API_KEY") || ""
    const storedSlack = localStorage.getItem("SLACK_WEBHOOK_URL") || ""
    setLinearApiKey(storedLinear)
    setSlackWebhookUrl(storedSlack)
    setHasLinearKey(!!storedLinear)
    setHasSlackWebhook(!!storedSlack)
    setLinearTestResult(null)
    setSlackTestResult(null)
  }

  const handleSave = () => {
    if (linearApiKey) {
      localStorage.setItem("LINEAR_API_KEY", linearApiKey)
      setHasLinearKey(true)
    }
    if (slackWebhook) {
      localStorage.setItem("SLACK_WEBHOOK_URL", slackWebhook)
      setHasSlackWebhook(true)
    }
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleClearLinear = () => {
    localStorage.removeItem("LINEAR_API_KEY")
    setLinearApiKey("")
    setHasLinearKey(false)
    setLinearTestResult(null)
  }

  const handleClearSlack = () => {
    localStorage.removeItem("SLACK_WEBHOOK_URL")
    setSlackWebhookUrl("")
    setHasSlackWebhook(false)
    setSlackTestResult(null)
  }

  const testLinearConnection = async () => {
    if (!linearApiKey) return
    setTestingLinear(true)
    setLinearTestResult(null)
    
    try {
      // Test the Linear API key by making a simple query
      const response = await fetch('https://api.linear.app/graphql', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': linearApiKey,
        },
        body: JSON.stringify({
          query: '{ viewer { id name } }',
        }),
      })
      
      const data = await response.json()
      if (data.data?.viewer?.id) {
        setLinearTestResult('success')
      } else {
        setLinearTestResult('error')
      }
    } catch {
      setLinearTestResult('error')
    } finally {
      setTestingLinear(false)
    }
  }

  const testSlackConnection = async () => {
    if (!slackWebhook) return
    setTestingSlack(true)
    setSlackTestResult(null)
    
    try {
      // Send a test message to Slack
      const response = await fetch('/api/actions/send-alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          finding: {
            asset: { name: 'Test Connection' },
            level: 'info',
            score: 0,
            headline: 'OAuthSentry Connection Test',
            reasoning: 'This is a test message to verify your Slack webhook is working correctly.',
            recommendation: 'No action needed - this is just a test.',
          },
          slackWebhookUrl: slackWebhook,
        }),
      })
      
      const data = await response.json()
      if (data.success) {
        setSlackTestResult('success')
      } else {
        setSlackTestResult('error')
      }
    } catch {
      setSlackTestResult('error')
    } finally {
      setTestingSlack(false)
    }
  }

  const maskValue = (value: string) => {
    if (value.length <= 8) return '*'.repeat(value.length)
    return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
            >
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Settings</span>
              {(hasLinearKey || hasSlackWebhook) && (
                <span className="flex h-2 w-2 rounded-full bg-green-500" title="Integrations configured" />
              )}
            </Button>
          </DialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          Configure API keys for Linear and Slack integrations
        </TooltipContent>
      </Tooltip>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Integration Settings</DialogTitle>
          <DialogDescription>
            Configure API keys to enable Linear ticket filing and Slack alerts. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="integrations" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="integrations">Integrations</TabsTrigger>
            <TabsTrigger value="help">How to Use</TabsTrigger>
          </TabsList>

          <TabsContent value="integrations" className="space-y-4 py-4">
            {/* Status Overview */}
            <div className="flex gap-2 flex-wrap">
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${hasLinearKey ? 'bg-green-500/10 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasLinearKey ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                Linear {hasLinearKey ? 'Connected' : 'Not configured'}
              </div>
              <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${hasSlackWebhook ? 'bg-green-500/10 text-green-700' : 'bg-muted text-muted-foreground'}`}>
                <span className={`h-1.5 w-1.5 rounded-full ${hasSlackWebhook ? 'bg-green-500' : 'bg-muted-foreground'}`} />
                Slack {hasSlackWebhook ? 'Connected' : 'Not configured'}
              </div>
            </div>

            {/* Linear API Key */}
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="linear-key" className="text-sm font-medium">Linear API Key</Label>
                {hasLinearKey && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearLinear}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="linear-key"
                    type={showLinearKey ? "text" : "password"}
                    placeholder="lin_api_..."
                    value={linearApiKey}
                    onChange={(e) => setLinearApiKey(e.target.value)}
                    className="font-mono text-xs pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowLinearKey(!showLinearKey)}
                  >
                    {showLinearKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testLinearConnection}
                  disabled={!linearApiKey || testingLinear}
                  className="gap-1.5"
                >
                  <TestTube2 className="h-3.5 w-3.5" />
                  Test
                </Button>
              </div>
              {linearTestResult && (
                <p className={`text-xs ${linearTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {linearTestResult === 'success' ? 'Connection successful!' : 'Connection failed. Check your API key.'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Get your key from{" "}
                <a
                  href="https://linear.app/settings/account/security"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  linear.app/settings/account/security
                </a>
              </p>
            </div>

            {/* Slack Webhook URL */}
            <div className="space-y-2 rounded-lg border border-border p-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="slack-webhook" className="text-sm font-medium">Slack Webhook URL</Label>
                {hasSlackWebhook && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSlack}
                    className="h-7 text-xs text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="slack-webhook"
                    type={showSlackWebhook ? "text" : "password"}
                    placeholder="https://hooks.slack.com/services/..."
                    value={slackWebhook}
                    onChange={(e) => setSlackWebhookUrl(e.target.value)}
                    className="font-mono text-xs pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowSlackWebhook(!showSlackWebhook)}
                  >
                    {showSlackWebhook ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </Button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={testSlackConnection}
                  disabled={!slackWebhook || testingSlack}
                  className="gap-1.5"
                >
                  <TestTube2 className="h-3.5 w-3.5" />
                  Test
                </Button>
              </div>
              {slackTestResult && (
                <p className={`text-xs ${slackTestResult === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {slackTestResult === 'success' ? 'Test message sent! Check your Slack channel.' : 'Failed to send. Check your webhook URL.'}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Create a webhook at{" "}
                <a
                  href="https://api.slack.com/messaging/webhooks"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  api.slack.com/messaging/webhooks
                </a>
              </p>
            </div>

            {/* Save Button */}
            <div className="flex items-center justify-between pt-2">
              {saved ? (
                <div className="flex items-center gap-2 text-sm text-green-600 font-medium">
                  <Check className="h-4 w-4" />
                  Configuration saved!
                </div>
              ) : (
                <div />
              )}
              <Button onClick={handleSave} className="gap-2">
                <Save className="h-4 w-4" />
                Save Configuration
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4 py-4">
            <Card className="bg-amber-500/5 border-amber-500/20 p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    How to test the integrations
                  </p>
                  <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal list-inside">
                    <li>Enter your API keys in the Integrations tab</li>
                    <li>Click the <strong>Test</strong> button to verify connectivity</li>
                    <li>Click <strong>Save Configuration</strong></li>
                    <li>Run a scan or click <strong>Demo Mode</strong></li>
                    <li>Expand a critical or high severity finding</li>
                    <li>Click <strong>File Linear ticket</strong> or <strong>Send Slack alert</strong></li>
                    <li>Check Linear or Slack - your ticket/alert will appear!</li>
                  </ol>
                </div>
              </div>
            </Card>

            <div className="space-y-3">
              <h4 className="text-sm font-medium">Getting API Keys</h4>
              
              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-medium">Linear API Key</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to Linear Settings {">"} Account {">"} Security</li>
                  <li>Scroll to &quot;Personal API keys&quot;</li>
                  <li>Click &quot;Create key&quot;, name it &quot;OAuthSentry&quot;</li>
                  <li>Copy the generated key</li>
                </ol>
              </div>

              <div className="rounded-lg border border-border p-3 space-y-2">
                <p className="text-xs font-medium">Slack Webhook URL</p>
                <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Go to api.slack.com/apps</li>
                  <li>Create a new app or select existing</li>
                  <li>Enable &quot;Incoming Webhooks&quot;</li>
                  <li>Add a webhook to your workspace</li>
                  <li>Copy the webhook URL</li>
                </ol>
              </div>
            </div>

            <p className="text-xs text-muted-foreground border-t border-border pt-3">
              <strong>Privacy note:</strong> Your API keys are stored only in your browser&apos;s localStorage. They are never sent to our servers.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
