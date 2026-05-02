import type { RiskFinding, StackAsset, RiskTimeline, RiskLevel } from "@/lib/types"

// Helper to generate realistic timeline events
function generateTimeline(asset: StackAsset, score: number): RiskTimeline[] {
  const now = new Date()
  const events: RiskTimeline[] = []
  
  // Event 1: First detected (30-45 days ago)
  const firstDetected = new Date(now)
  firstDetected.setDate(now.getDate() - Math.floor(Math.random() * 15) - 30)
  events.push({
    date: firstDetected.toISOString(),
    event: `First detected in public advisory for ${asset.name}`,
    level: 'low' as RiskLevel,
    score: Math.floor(score * 0.2),
  })
  
  // Event 2: Elevated risk (15-25 days ago)
  const elevated = new Date(now)
  elevated.setDate(now.getDate() - Math.floor(Math.random() * 10) - 15)
  events.push({
    date: elevated.toISOString(),
    event: asset.kind === 'oauth_app' 
      ? 'Admin scopes identified in OAuth token' 
      : asset.kind === 'npm_package'
      ? 'Vulnerability details published'
      : 'Integration permissions expanded',
    level: 'medium' as RiskLevel,
    score: Math.floor(score * 0.5),
  })
  
  // Event 3: Current risk (recent)
  const current = new Date(now)
  current.setDate(now.getDate() - Math.floor(Math.random() * 5))
  events.push({
    date: current.toISOString(),
    event: score >= 80 
      ? 'Active exploitation detected in the wild'
      : score >= 60
      ? 'Proof of concept exploit published'
      : 'Routine security assessment completed',
    level: (score >= 80 ? 'critical' : score >= 60 ? 'high' : 'medium') as RiskLevel,
    score: score,
  })
  
  return events
}

// Helper to generate risk factor breakdown
function generateRiskFactorBreakdown(score: number, assetKind: string): RiskFactorBreakdownItem[] {
  if (assetKind === 'oauth_app') {
    const compromiseHistory = Math.floor(score * 0.35)
    const accessVector = Math.floor(score * 0.25)
    const affectedConsumers = Math.floor(score * 0.22)
    const vendorTrustChange = score - compromiseHistory - accessVector - affectedConsumers
    
    return [
      { factor: 'Compromise History', points: compromiseHistory },
      { factor: 'Access Vector', points: accessVector },
      { factor: 'Affected Consumers', points: affectedConsumers },
      { factor: 'Vendor Trust Change', points: vendorTrustChange },
    ]
  } else if (assetKind === 'npm_package') {
    const cveScore = Math.floor(score * 0.4)
    const exploitability = Math.floor(score * 0.25)
    const popularity = Math.floor(score * 0.2)
    const maintainerActivity = score - cveScore - exploitability - popularity
    
    return [
      { factor: 'CVE Severity', points: cveScore },
      { factor: 'Exploitability', points: exploitability },
      { factor: 'Package Popularity', points: popularity },
      { factor: 'Maintainer Activity', points: maintainerActivity },
    ]
  } else {
    const dataExposure = Math.floor(score * 0.3)
    const integrationDepth = Math.floor(score * 0.25)
    const vendorSecurity = Math.floor(score * 0.25)
    const complianceRisk = score - dataExposure - integrationDepth - vendorSecurity
    
    return [
      { factor: 'Data Exposure', points: dataExposure },
      { factor: 'Integration Depth', points: integrationDepth },
      { factor: 'Vendor Security', points: vendorSecurity },
      { factor: 'Compliance Risk', points: complianceRisk },
    ]
  }
}

// Helper to generate remediation recommendations
function generateRemediationSteps(asset: StackAsset, level: string): string[] {
  if (asset.kind === 'oauth_app') {
    if (level === 'critical') {
      return [
        `Immediately revoke all ${asset.name} OAuth permissions`,
        'Audit and rotate all connected service account keys',
        'Review workspace audit logs for suspicious activity',
        'Notify all affected users to change passwords',
        'Enable 2FA enforcement for all users',
        'Contact your security team for incident response',
      ]
    } else if (level === 'high') {
      return [
        `Review and minimize OAuth scopes for ${asset.name}`,
        'Enable OAuth token monitoring',
        'Set up alerts for unusual API activity',
        'Schedule quarterly access reviews',
      ]
    }
    return [
      `Review ${asset.name} permissions annually`,
      'Verify business need for continued access',
      'Document integration purpose',
    ]
  } else if (asset.kind === 'npm_package') {
    if (level === 'critical' || level === 'high') {
      return [
        `Update ${asset.name} to the latest patched version immediately`,
        'Run npm audit to check for related vulnerabilities',
        'Review your lockfile for dependency integrity',
        'Check for indirect dependencies that may be affected',
        'Enable automated security updates via Dependabot',
      ]
    }
    return [
      `Monitor ${asset.name} for security advisories`,
      'Keep dependencies updated regularly',
      'Run npm audit as part of CI/CD pipeline',
    ]
  } else {
    if (level === 'critical' || level === 'high') {
      return [
        `Review all data shared with ${asset.name}`,
        'Verify data processing agreements are in place',
        'Audit API access logs for unusual patterns',
        'Limit integration to necessary data only',
        'Enable SSO/SAML if available',
      ]
    }
    return [
      `Document business purpose for ${asset.name}`,
      'Review access permissions quarterly',
      'Verify compliance with data policies',
    ]
  }
}

// Risk patterns for different asset types
const riskPatterns = {
  oauth_app: [
    {
      condition: (asset: StackAsset) => 
        asset.identifier.includes('110671459871') || 
        asset.name.toLowerCase().includes('context'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'critical',
        score: 95,
        headline: `Compromised OAuth app detected: ${asset.name}`,
        reasoning: `The OAuth application "${asset.name}" was identified in the April 2026 Vercel/Context.ai breach. This app had excessive permissions including calendar, drive, and email scopes, and was used to pivot into employee systems.`,
        recommendation: `Immediately revoke all permissions. Audit all data accessed by this app. Reset credentials for affected users.`,
        factors: [
          { label: 'Known breach', detail: 'Part of Vercel/Context.ai incident' },
          { label: 'Excessive scopes', detail: 'Calendar, Drive, Email access' },
          { label: 'Data exfiltration', detail: 'May have accessed sensitive data' },
        ],
        cveReferences: [
          { id: 'CVE-2026-0047', score: 9.8, source: 'NVD' },
          { id: 'CVE-2026-0048', score: 10.0, source: 'GitHub Advisory' },
        ],
      }),
    },
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
        cveReferences: [
          { id: 'CVE-2026-1234', score: 8.5, source: 'CISA' },
        ],
      }),
    },
    {
      condition: () => true,
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
      condition: (asset: StackAsset) => 
        asset.name.toLowerCase().includes('clipboardz') || 
        asset.name.toLowerCase().includes('clipboard'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'critical',
        score: 85,
        headline: `Typosquat package detected: ${asset.name}`,
        reasoning: `This package appears to be a typosquat of a legitimate clipboard library. Malicious npm packages often use similar names to trick developers into installing malware.`,
        recommendation: `Remove this package immediately. Scan for any data exfiltration. Verify you meant to install the legitimate package.`,
        factors: [
          { label: 'Typosquat', detail: 'Mimics legitimate package name' },
          { label: 'Malware risk', detail: 'May contain malicious code' },
        ],
        cveReferences: [
          { id: 'GHSA-2026-clip', score: 9.1, source: 'GitHub Advisory' },
        ],
      }),
    },
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
        cveReferences: [{ id: 'CVE-2020-8203', score: 7.4, source: 'NVD' }],
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
        cveReferences: [{ id: 'CVE-2023-45857', score: 6.5, source: 'NVD' }],
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
      condition: () => true,
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
      condition: (asset: StackAsset) => 
        asset.name.toLowerCase().includes('stalebot') ||
        asset.identifier.includes('stalebot'),
      generate: (asset: StackAsset): Partial<RiskFinding> => ({
        level: 'critical',
        score: 85,
        headline: `Suspicious GitHub App detected: ${asset.name}`,
        reasoning: `This GitHub App has repository access but shows signs of malicious behavior. It may be harvesting code or secrets from your repositories.`,
        recommendation: `Immediately revoke this app's access. Rotate any secrets that may have been exposed. Audit repository access logs.`,
        factors: [
          { label: 'Repo access', detail: 'Can read repository contents' },
          { label: 'Secret exposure', detail: 'May harvest environment variables' },
        ],
        cveReferences: [
          { id: 'GHSA-2026-stale', score: 8.9, source: 'GitHub Advisory' },
        ],
      }),
    },
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
      condition: () => true,
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
 * Now includes all required fields for Features 6-12
 */
export function generateDemoFindings(assets: StackAsset[]): RiskFinding[] {
  const findings: RiskFinding[] = []
  const now = new Date()
  
  for (const asset of assets) {
    const patterns = riskPatterns[asset.kind] || riskPatterns.saas_tool
    
    // Find matching pattern or use default
    const matchingPattern = patterns.find(p => p.condition(asset))
    if (!matchingPattern) continue
    
    const generated = matchingPattern.generate(asset)
    const score = generated.score || 50
    const level = generated.level || 'info'
    
    // Generate detection date (1-30 days ago)
    const detectedAt = new Date(now)
    detectedAt.setDate(now.getDate() - Math.floor(Math.random() * 30) - 1)
    
    const finding: RiskFinding = {
      assetId: asset.id,
      asset,
      level,
      score,
      headline: generated.headline || `Security review for ${asset.name}`,
      reasoning: generated.reasoning || 'Standard security review required.',
      recommendation: generated.recommendation || 'Review access and permissions.',
      factors: generated.factors || [],
      iocMatches: [],
      ticketStatus: 'none',
      alertStatus: 'none',
      cveReferences: generated.cveReferences,
      // Feature 6: Risk Timeline
      timeline: generateTimeline(asset, score),
      detectedAt: detectedAt.toISOString(),
      // Feature 8: Risk Factor Scoring Breakdown
      riskFactorBreakdown: generateRiskFactorBreakdown(score, asset.kind),
      // Feature 9: Automated Remediation Recommendations
      remediationRecommendations: generateRemediationSteps(asset, level),
    }
    
    findings.push(finding)
  }
  
  // Sort by severity (critical first)
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }
  findings.sort((a, b) => severityOrder[a.level] - severityOrder[b.level])
  
  return findings
}
