"use client"

import { useState } from "react"
import { Settings, Save, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"

export function SettingsDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [linearApiKey, setLinearApiKey] = useState("")
  const [slackWebhook, setSlackWebhookUrl] = useState("")
  const [saved, setSaved] = useState(false)

  const handleSave = () => {
    if (linearApiKey) localStorage.setItem("LINEAR_API_KEY", linearApiKey)
    if (slackWebhook) localStorage.setItem("SLACK_WEBHOOK_URL", slackWebhook)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLoad = () => {
    const storedLinear = localStorage.getItem("LINEAR_API_KEY") || ""
    const storedSlack = localStorage.getItem("SLACK_WEBHOOK_URL") || ""
    setLinearApiKey(storedLinear)
    setSlackWebhookUrl(storedSlack)
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className="gap-2"
          onClick={handleLoad}
        >
          <Settings className="h-4 w-4" />
          <span className="hidden sm:inline">Settings</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Integration Configuration</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Alert */}
          <Card className="bg-amber-500/10 border-amber-500/20 p-3 flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-700">
              Enter your API keys to enable Linear tickets and Slack alerts. Keys are stored locally in your browser.
            </p>
          </Card>

          {/* Linear API Key */}
          <div className="space-y-2">
            <Label htmlFor="linear-key">Linear API Key</Label>
            <Input
              id="linear-key"
              type="password"
              placeholder="lin_pat_..."
              value={linearApiKey}
              onChange={(e) => setLinearApiKey(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Get from{" "}
              <a
                href="https://linear.app/settings/api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                linear.app/settings/api
              </a>
            </p>
          </div>

          {/* Slack Webhook URL */}
          <div className="space-y-2">
            <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
            <Input
              id="slack-webhook"
              type="password"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhook}
              onChange={(e) => setSlackWebhookUrl(e.target.value)}
              className="font-mono text-xs"
            />
            <p className="text-xs text-muted-foreground">
              Create at{" "}
              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                api.slack.com/messaging/webhooks
              </a>
            </p>
          </div>

          {/* Info */}
          <div className="space-y-2 p-3 rounded bg-muted/50">
            <p className="text-xs font-semibold">How to test integrations:</p>
            <ul className="text-xs text-muted-foreground space-y-1 ml-3">
              <li>1. Enter your API keys above</li>
              <li>2. Run a scan or click Demo Mode</li>
              <li>3. Expand a critical finding</li>
              <li>4. Click "File Linear ticket" or "Send Slack alert"</li>
              <li>5. Check Linear or Slack - your ticket/alert will appear!</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Close
          </Button>
          <Button
            onClick={handleSave}
            className="gap-2"
          >
            <Save className="h-4 w-4" />
            Save Configuration
          </Button>
        </div>

        {saved && (
          <div className="text-xs text-green-600 font-medium">
            ✓ Configuration saved to browser storage
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
