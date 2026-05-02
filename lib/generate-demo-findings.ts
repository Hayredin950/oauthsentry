import type { RiskFinding, StackAsset } from "@/lib/types"

// Risk patterns for different asset types
const riskPatterns = {
  oauth_app: [
    {
      condition: (asset: StackAsset) => asset.identifier.includes('google') || asset.name.toLowerCase().includes('google'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: Math.random() > 0.7 ? 'high' : 'medium',
        score: Math.floor(Math.random() * 30) + 60,
        headline: `Excessive OAuth scopes detected for ${asset.name}`,
        reasoning: `The OAuth application "${asset.name}" has been granted broad access permissions including calendar, drive, and email scopes. This level of access may exceed operational requirements.`,
        recommendation: `Review and minimize OAuth scopes to least-privilege. Consider revoking unnecessary permissions via Google Admin Console.`,
        factors: [
          { label: 'Scope breadth', detail: 'Multiple sensitive scopes granted' },
          { label: 'Data access', detail: 'Can read/write user data' },
        ],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('ai') || asset.name.toLowerCase().includes('gpt'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'critical',
        score: Math.floor(Math.random() * 10) + 90,
        headline: `Third-party AI tool with workspace access: ${asset.name}`,
        reasoning: `AI application "${asset.name}" has OAuth access to your workspace. Third-party AI tools may process sensitive data through external APIs, creating potential data exfiltration vectors.`,
        recommendation: `Audit what data this AI tool can access. Consider data classification policies for AI tool usage. Monitor for unusual data export patterns.`,
        factors: [
          { label: 'AI Processing', detail: 'Data sent to external AI APIs' },
          { label: 'Compliance risk', detail: 'May violate data residency requirements' },
        ],
        cveReferences: [],
      }),
    },
    {
      condition: () => true, // Default for any OAuth app
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: Math.random() > 0.6 ? 'medium' : 'low',
        score: Math.floor(Math.random() * 40) + 30,
        headline: `OAuth app requires periodic access review: ${asset.name}`,
        reasoning: `The OAuth application "${asset.name}" should be reviewed to ensure continued business need and appropriate access levels.`,
        recommendation: `Schedule quarterly access reviews for all OAuth applications. Verify the app is still actively used and required.`,
        factors: [
          { label: 'Access review', detail: 'Periodic review recommended' },
        ],
      }),
    },
  ],
  npm_package: [
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('lodash'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'low',
        score: 25,
        headline: `Prototype pollution risk in ${asset.name}`,
        reasoning: `While recent versions have patches, lodash has historical prototype pollution vulnerabilities. Ensure you're using the latest patched version.`,
        recommendation: `Update to lodash@4.17.21 or later. Consider using native JavaScript methods where possible.`,
        factors: [
          { label: 'Historical CVEs', detail: 'CVE-2019-10744, CVE-2020-8203' },
        ],
        cveReferences: [{ id: 'CVE-2020-8203', score: 7.4 }],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('axios'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'medium',
        score: 55,
        headline: `SSRF vulnerability potential in ${asset.name}`,
        reasoning: `Axios versions prior to 1.6.0 have known SSRF vulnerabilities. Ensure proper URL validation is in place.`,
        recommendation: `Update to axios@1.6.0+ and implement server-side URL allowlisting for external requests.`,
        factors: [
          { label: 'SSRF Risk', detail: 'Server-side request forgery possible' },
        ],
        cveReferences: [{ id: 'CVE-2023-45857', score: 6.5 }],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('express'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'medium',
        score: 50,
        headline: `Express.js security headers review needed`,
        reasoning: `Express applications require explicit security header configuration. Without helmet.js or similar, apps may be vulnerable to XSS, clickjacking, and other attacks.`,
        recommendation: `Install and configure helmet.js. Review CORS settings and ensure proper CSP headers are set.`,
        factors: [
          { label: 'Security headers', detail: 'Manual configuration required' },
        ],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('web3') || asset.name.toLowerCase().includes('crypto'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'high',
        score: 78,
        headline: `Cryptographic package requires audit: ${asset.name}`,
        reasoning: `Packages handling cryptographic operations or blockchain interactions are high-value targets. Supply chain attacks on these packages could result in financial loss.`,
        recommendation: `Pin exact versions, use lockfiles, and monitor for dependency updates. Consider using Snyk or Socket for continuous monitoring.`,
        factors: [
          { label: 'Financial risk', detail: 'Handles sensitive operations' },
          { label: 'Supply chain', detail: 'High-value attack target' },
        ],
      }),
    },
    {
      condition: () => true, // Default for any npm package
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: Math.random() > 0.7 ? 'medium' : 'low',
        score: Math.floor(Math.random() * 30) + 20,
        headline: `Dependency health check: ${asset.name}`,
        reasoning: `Standard security review for npm package "${asset.name}". Monitor for security advisories and keep updated.`,
        recommendation: `Enable automated dependency updates via Dependabot or Renovate. Run npm audit regularly.`,
        factors: [
          { label: 'Maintenance', detail: 'Keep dependencies updated' },
        ],
      }),
    },
  ],
  saas_tool: [
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('slack') || asset.identifier.includes('slack'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'medium',
        score: 60,
        headline: `Slack integration data exposure review`,
        reasoning: `Slack integrations can access message history, files, and user information. Review what data this integration can access.`,
        recommendation: `Audit Slack app permissions in workspace settings. Limit to specific channels if possible.`,
        factors: [
          { label: 'Data access', detail: 'Messages, files, user info' },
        ],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('notion'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'low',
        score: 35,
        headline: `Notion workspace permissions review`,
        reasoning: `Notion integrations have access to page content and databases. Ensure only necessary pages are shared.`,
        recommendation: `Use Notion's permission model to restrict integration access to specific pages/databases.`,
        factors: [
          { label: 'Content access', detail: 'Can read shared pages' },
        ],
      }),
    },
    {
      condition: (asset: StackAsset) => asset.name.toLowerCase().includes('jira') || asset.name.toLowerCase().includes('atlassian'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'medium',
        score: 55,
        headline: `Atlassian integration security review`,
        reasoning: `Jira/Confluence integrations access project data, issues, and potentially sensitive documentation.`,
        recommendation: `Review integration scopes. Use project-level permissions to limit data exposure.`,
        factors: [
          { label: 'Project data', detail: 'Access to issues and docs' },
        ],
      }),
    },
    {
      condition: () => true, // Default for any SaaS tool
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'low',
        score: Math.floor(Math.random() * 25) + 15,
        headline: `SaaS tool access review: ${asset.name}`,
        reasoning: `Standard review for SaaS integration "${asset.name}". Ensure the tool is still needed and access is appropriate.`,
        recommendation: `Document business justification. Review user access quarterly. Check for SSO/SAML configuration.`,
        factors: [
          { label: 'Access management', detail: 'Review periodically' },
        ],
      }),
    },
  ],
}

/**
 * Generate demo findings based on actual inventory items
 */
export function generateDemoFindings(assets: StackAsset[]): RiskFinding[] {
  const findings: RiskFinding[] = []
  
  for (const asset of assets) {
    const patterns = riskPatterns[asset.kind] || riskPatterns.saas_tool
    
    // Find matching pattern or use default
    const matchingPattern = patterns.find(p => p.condition(asset))
    if (!matchingPattern) continue
    
    const generated = matchingPattern.generate(asset)
    
    const finding: RiskFinding = {
      assetId: asset.id,
      asset,
      level: generated.level || 'info',
      score: generated.score || 50,
      headline: generated.headline || `Security review for ${asset.name}`,
      reasoning: generated.reasoning || 'Standard security review required.',
      recommendation: generated.recommendation || 'Review access and permissions.',
      factors: generated.factors || [],
      iocMatches: [],
      ticketStatus: 'none',
      alertStatus: 'none',
      cveReferences: generated.cveReferences,
    }
    
    findings.push(finding)
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  findings.sort((a, b) => severityOrder[a.level] - severityOrder[b.level])
  
  return findings
}
