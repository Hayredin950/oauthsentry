"use client"

import { Code, ExternalLink } from "lucide-react"

export function ApiDocumentation() {
  const endpoints = [
    {
      method: "POST",
      path: "/api/scan",
      description: "Run a security scan on provided assets",
      params: ["assets: Asset[]"],
      response: "RiskFinding[]",
    },
    {
      method: "GET",
      path: "/api/findings",
      description: "List all findings from the latest scan",
      params: ["limit?: number", "offset?: number"],
      response: "{ findings: RiskFinding[], total: number }",
    },
    {
      method: "POST",
      path: "/api/actions/file-ticket",
      description: "File a Linear ticket for a critical finding",
      params: ["findingId: string", "assetId: string"],
      response: "{ ticketUrl: string, ticketId: string }",
    },
    {
      method: "POST",
      path: "/api/actions/send-alert",
      description: "Send a Slack alert for a finding",
      params: ["findingId: string", "channel?: string"],
      response: "{ success: boolean, messageTs: string }",
    },
    {
      method: "POST",
      path: "/api/workflow",
      description: "Trigger a durable scan workflow",
      params: ["trigger: 'manual-scan' | 'scheduled'"],
      response: "{ workflowId: string, status: string }",
    },
  ]

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <Code className="h-6 w-6 text-amber-600" />
            <h1 className="text-3xl font-bold">API Documentation</h1>
          </div>
          <p className="text-muted-foreground">
            OAuthSentry provides a REST API for programmatic access to scanning and alert functionality.
          </p>
        </div>

        {/* Authentication */}
        <section className="mb-10 space-y-3">
          <h2 className="text-xl font-semibold">Authentication</h2>
          <p className="text-sm text-muted-foreground">
            All requests must include the{" "}
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono">Authorization</code>{" "}
            header with your API key:
          </p>
          <div className="rounded-lg bg-muted p-3 overflow-x-auto">
            <code className="text-xs font-mono text-foreground/90">
              curl -H "Authorization: Bearer YOUR_API_KEY" https://oauthsentry.vercel.app/api/scan
            </code>
          </div>
        </section>

        {/* Endpoints */}
        <section className="space-y-6">
          <h2 className="text-xl font-semibold">Endpoints</h2>

          {endpoints.map((endpoint, i) => (
            <div key={i} className="border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-start gap-3">
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold shrink-0 ${
                    endpoint.method === "POST"
                      ? "bg-blue-500/10 text-blue-600"
                      : "bg-green-500/10 text-green-600"
                  }`}
                >
                  {endpoint.method}
                </span>
                <div className="flex-1">
                  <code className="text-sm font-mono font-semibold">{endpoint.path}</code>
                  <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                </div>
              </div>

              {endpoint.params.length > 0 && (
                <div className="pt-2 border-t border-border/40">
                  <p className="text-xs font-semibold mb-2">Parameters:</p>
                  <ul className="space-y-1">
                    {endpoint.params.map((param, j) => (
                      <li key={j} className="text-xs text-foreground/80">
                        <code className="bg-muted px-1 py-0.5 rounded">{param}</code>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="pt-2 border-t border-border/40">
                <p className="text-xs font-semibold mb-2">Response:</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">{endpoint.response}</code>
              </div>
            </div>
          ))}
        </section>

        {/* Rate Limiting */}
        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Rate Limiting</h2>
          <p className="text-sm text-muted-foreground">
            Requests are rate-limited to 100 per minute per API key. Responses include:
          </p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• <code className="bg-muted px-1 rounded text-xs">X-RateLimit-Limit: 100</code></li>
            <li>• <code className="bg-muted px-1 rounded text-xs">X-RateLimit-Remaining: 95</code></li>
            <li>• <code className="bg-muted px-1 rounded text-xs">X-RateLimit-Reset: 1714521600</code></li>
          </ul>
        </section>

        {/* Error Handling */}
        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Error Handling</h2>
          <p className="text-sm text-muted-foreground">
            Errors are returned with appropriate HTTP status codes and error details:
          </p>
          <div className="space-y-2">
            <div className="text-sm p-2 rounded bg-muted/40 border border-border/40">
              <code className="font-mono text-xs">400 Bad Request</code> - Invalid parameters
            </div>
            <div className="text-sm p-2 rounded bg-muted/40 border border-border/40">
              <code className="font-mono text-xs">401 Unauthorized</code> - Missing or invalid API key
            </div>
            <div className="text-sm p-2 rounded bg-muted/40 border border-border/40">
              <code className="font-mono text-xs">429 Too Many Requests</code> - Rate limit exceeded
            </div>
            <div className="text-sm p-2 rounded bg-muted/40 border border-border/40">
              <code className="font-mono text-xs">500 Internal Server Error</code> - Server error
            </div>
          </div>
        </section>

        {/* Examples */}
        <section className="mt-10 space-y-3">
          <h2 className="text-xl font-semibold">Example Usage</h2>
          <div className="rounded-lg bg-muted p-4 overflow-x-auto">
            <pre className="text-xs font-mono text-foreground/90">
{`// Run a scan
const response = await fetch('/api/scan', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    assets: [
      {
        kind: 'oauth_app',
        name: 'Context.ai',
        identifier: '110671459871-30f1spbu0hptbs60cb4vsmv791tbbvqj.apps.googleusercontent.com',
      }
    ]
  }),
});

const findings = await response.json();
console.log(findings);`}
            </pre>
          </div>
        </section>

        {/* Support */}
        <section className="mt-10 p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-sm">
            For questions or issues, open a GitHub issue at{" "}
            <a
              href="https://github.com/HayreKhan750/oauthsentry"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1"
            >
              github.com/HayreKhan750/oauthsentry
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </p>
        </section>
      </div>
    </div>
  )
}
