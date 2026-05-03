import { NextResponse } from 'next/server'

// Types for threat feed items
export interface ThreatFeedItem {
  id: string
  title: string
  summary: string
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  indicatorKind: 'oauth_client' | 'npm' | 'domain' | 'cve'
  indicator: string
  source: string
  reference?: string
  publishedAt: Date
}

// Fetch from NVD (National Vulnerability Database) - Free API
async function fetchNVDVulnerabilities(): Promise<ThreatFeedItem[]> {
  try {
    // Get recent critical/high CVEs from last 7 days
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - 7)
    
    const params = new URLSearchParams({
      pubStartDate: startDate.toISOString().split('.')[0] + 'Z',
      pubEndDate: endDate.toISOString().split('.')[0] + 'Z',
      cvssV3Severity: 'HIGH',
      resultsPerPage: '10',
    })
    
    const res = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?${params}`, {
      headers: { 'User-Agent': 'OAuthSentry/1.0' },
      next: { revalidate: 3600 }, // Cache for 1 hour
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    
    return (data.vulnerabilities || []).slice(0, 5).map((vuln: any) => {
      const cve = vuln.cve
      const cvss = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData
      const score = cvss?.baseScore || 0
      
      let severity: ThreatFeedItem['severity'] = 'info'
      if (score >= 9) severity = 'critical'
      else if (score >= 7) severity = 'high'
      else if (score >= 4) severity = 'medium'
      else if (score > 0) severity = 'low'
      
      return {
        id: cve.id,
        title: `${cve.id}: ${cve.descriptions?.[0]?.value?.slice(0, 60) || 'Vulnerability'}...`,
        summary: cve.descriptions?.[0]?.value || 'No description available',
        severity,
        indicatorKind: 'cve' as const,
        indicator: cve.id,
        source: 'NVD',
        reference: `https://nvd.nist.gov/vuln/detail/${cve.id}`,
        publishedAt: new Date(cve.published),
      }
    })
  } catch {
    return []
  }
}

// Fetch from OSV (Open Source Vulnerabilities by Google) - Free API
async function fetchOSVVulnerabilities(): Promise<ThreatFeedItem[]> {
  try {
    // Query for recent npm ecosystem vulnerabilities using the query endpoint
    // OSV v1/query requires at least one of: commit, version, or package with name
    // Use v1/query with just ecosystem to get recent vulns
    const res = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        package: { name: 'lodash', ecosystem: 'npm' },
      }),
      next: { revalidate: 3600 },
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    
    return (data.vulns || []).slice(0, 5).map((vuln: any) => {
      const severity = vuln.database_specific?.severity?.toLowerCase() || 
        (vuln.severity?.[0]?.score >= 9 ? 'critical' : 
         vuln.severity?.[0]?.score >= 7 ? 'high' : 
         vuln.severity?.[0]?.score >= 4 ? 'medium' : 'low')
      
      return {
        id: vuln.id,
        title: vuln.summary || vuln.id,
        summary: vuln.details || vuln.summary || 'No details available',
        severity: severity as ThreatFeedItem['severity'],
        indicatorKind: 'npm' as const,
        indicator: vuln.affected?.[0]?.package?.name || vuln.id,
        source: 'OSV',
        reference: `https://osv.dev/vulnerability/${vuln.id}`,
        publishedAt: new Date(vuln.published || Date.now()),
      }
    })
  } catch {
    return []
  }
}

// Fetch from GitHub Security Advisories - Free API
async function fetchGitHubAdvisories(): Promise<ThreatFeedItem[]> {
  try {
    // GitHub advisories API accepts severity as separate query params
    const res = await fetch('https://api.github.com/advisories?per_page=10&type=reviewed&ecosystem=npm', {
      headers: {
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'OAuthSentry/1.0',
      },
      next: { revalidate: 3600 },
    })
    
    if (!res.ok) return []
    
    const data = await res.json()
    
    return (data || []).slice(0, 5).map((advisory: any) => {
      const severity = advisory.severity === 'critical' ? 'critical' :
        advisory.severity === 'high' ? 'high' :
        advisory.severity === 'moderate' ? 'medium' : 'low'
      
      const pkg = advisory.vulnerabilities?.[0]?.package
      
      return {
        id: advisory.ghsa_id,
        title: advisory.summary || advisory.ghsa_id,
        summary: advisory.description || advisory.summary || 'No description',
        severity: severity as ThreatFeedItem['severity'],
        indicatorKind: pkg?.ecosystem === 'npm' ? 'npm' as const : 'domain' as const,
        indicator: pkg?.name || advisory.ghsa_id,
        source: 'GITHUB SECURITY',
        reference: advisory.html_url,
        publishedAt: new Date(advisory.published_at || Date.now()),
      }
    })
  } catch {
    return []
  }
}

export async function GET() {
  try {
    // Fetch from all sources in parallel
    const [nvdItems, osvItems, githubItems] = await Promise.all([
      fetchNVDVulnerabilities(),
      fetchOSVVulnerabilities(),
      fetchGitHubAdvisories(),
    ])
    
    // Combine and sort by date (newest first)
    const allItems = [...nvdItems, ...osvItems, ...githubItems]
      .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      .slice(0, 15) // Limit to 15 items
    
    // If no items fetched (API issues), return a message
    if (allItems.length === 0) {
      return NextResponse.json({
        items: [],
        message: 'Unable to fetch live threat data. External APIs may be rate-limited.',
        fetchedAt: new Date().toISOString(),
      })
    }
    
    return NextResponse.json({
      items: allItems,
      sources: ['NVD', 'OSV', 'GitHub Security'],
      fetchedAt: new Date().toISOString(),
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to fetch threat feed', items: [] },
      { status: 500 }
    )
  }
}
