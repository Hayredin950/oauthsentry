# COMPLETE TESTING & SUBMISSION GUIDE - OAuthSentry

## QUICK START (2 minutes)

1. Go to https://oauthsentry-phi.vercel.app/
2. Click "Settings" button in top right
3. Optionally: Enter your Linear API key and Slack webhook (if you have them)
4. Click "Demo Mode" to see 5 realistic findings load instantly
5. Expand any finding to see all 15 features in action

---

## FEATURE-BY-FEATURE TESTING

### TIER 1: High-Impact Features

#### Feature 1: Stats Dashboard & Metrics Cards
**Location:** Below the scanner heading, top of results
**To Test:**
- Run scan or click Demo Mode
- Verify 4 metric cards appear:
  - "Assets Monitored": shows 14 (or number scanned)
  - "Critical Findings": red number
  - "High Findings": orange number
  - "Total Findings": total count
- Metrics update in real-time as findings arrive

**Expected Result:** Dashboard shows correct counts matching findings table

---

#### Feature 2: Severity Breakdown Chart
**Location:** Below metrics cards
**To Test:**
- Same scan view
- Look for horizontal bar divided into colored segments
- RED = Critical, ORANGE = High, YELLOW = Medium, BLUE = Low
- Segments are proportional to actual counts

**Expected Result:** Bar accurately represents severity distribution

---

#### Feature 3: Remediation Tracking
**Location:** Expand any critical/high finding
**To Test:**
- Expand Context.ai or other critical finding
- Scroll to "Remediation Status" dropdown
- Change from "Open" → "In Progress" → "Resolved"
- When "In Progress" selected, date picker appears
- Select a date and verify it shows

**Expected Result:** Status changes persist and are tracked

---

#### Feature 4: Interactive Demo Mode
**Location:** Header button next to "Run scan"
**To Test:**
- Click "Demo Mode" button
- Verify 5 findings load instantly (no API setup needed):
  - Context.ai (95 - CRITICAL)
  - stalebot-pro (85 - CRITICAL)
  - clipboardz (85 - CRITICAL)
  - MeetScribe AI (85 - CRITICAL)
  - evalrunner (75 - HIGH)
- Metrics dashboard shows correct numbers
- Risk breakdown bar shows proportions

**Expected Result:** All findings load without API keys or configuration

---

#### Feature 5: Threat Intelligence Source Attribution
**Location:** Bottom of expanded finding
**To Test:**
- Expand Context.ai finding
- Scroll to "THREAT INTELLIGENCE" section
- See CVEs listed with:
  - CVE ID (e.g., "CVE-2026-0047" in blue)
  - CVSS score (e.g., "9.8" in orange badge)
  - Source (e.g., "NVD", "GitHub Advisory")
  - [View] link
- Click [View] → opens NIST page in new tab

**Expected Result:** CVEs are verifiable and links work

---

### TIER 2: Differentiation Features

#### Feature 6: Risk Timeline
**Location:** Expanded finding, middle section
**To Test:**
- Expand Context.ai
- Look for "RISK TIMELINE" section
- See timeline progression:
  - April 10: LOW (20) - "First detected"
  - April 15: MEDIUM (45) - "Admin scopes identified"
  - April 20: CRITICAL (95) - "Breach disclosed"
- Timeline shows visual cards with dates and events

**Expected Result:** Timeline shows realistic risk escalation

---

#### Feature 7: Remediation Scorecard
**Location:** Dashboard, below metrics
**To Test:**
- On main dashboard after scan
- Look for "REMEDIATION SCORECARD" card
- See statistics:
  - "Average Time to Remediate": realistic number (hours/days)
  - Trend: "Risk down 12% vs last week"
  - Efficiency metrics

**Expected Result:** Scorecard shows team remediation performance

---

#### Feature 8: Risk Factor Scoring Breakdown
**Location:** Expanded finding, middle section
**To Test:**
- Expand any critical finding
- Look for "SCORING BREAKDOWN" section
- See factors with percentages:
  - Compromise History: 35 points
  - Access Vector: 25 points
  - Affected Consumers: 20 points
  - Vendor Trust: 15 points
- Total: 95/100
- Bars show proportions visually

**Expected Result:** Breakdown factors add up to final score

---

#### Feature 9: Automated Remediation Recommendations
**Location:** Expanded finding, above threat intel section
**To Test:**
- Expand Context.ai or critical finding
- Look for "REMEDIATION STEPS" section
- See numbered steps:
  1. Revoke OAuth permissions
  2. Rotate service account keys
  3. Review audit logs
  4. Notify users
  5. Enable 2FA
  6. Contact vendor
- Steps are specific to the finding (not generic)

**Expected Result:** Actionable step-by-step remediation plan

---

#### Feature 10: Team Collaboration Features
**Location:** Bottom of expanded finding
**To Test:**
- Expand any finding
- Look for "TEAM COLLABORATION" section
- See comment input field
- Can type comments (stored in browser)
- Can see team member list
- Can see acknowledgment timestamps

**Expected Result:** Team can collaborate on findings

---

### TIER 3: Polish Features

#### Feature 11: Export Report
**Location:** Dashboard top right area
**To Test:**
- After scan completes
- Click "Export as PDF" button
- File downloads as PDF
- Open PDF and verify:
  - Executive summary
  - Top 5 findings
  - Risk scores and asset names
  - Remediation status
  - Timestamps
- Click "Export as JSON" to export structured data

**Expected Result:** Professional PDF with all findings

---

#### Feature 12: Risk Comparison
**Location:** Dashboard, below remediation scorecard
**To Test:**
- On dashboard after findings load
- Look for "RISK COMPARISON" section
- See findings ranked by score:
  - Context.ai: [████████████████] 95
  - stalebot-pro: [████████████] 85
  - etc.
- Bars are proportional to scores

**Expected Result:** Easy visual comparison of risks

---

#### Feature 13: False Positive Flag
**Location:** Expanded finding, above remediation status
**To Test:**
- Expand any finding
- Look for "Mark as false positive" checkbox
- Check the box
- Optional reason dropdown appears
- Verify checked state persists (in browser)

**Expected Result:** Users can flag and track false positives

---

#### Feature 14: API Documentation Page
**Location:** Navigation menu → "API Docs" OR /api-docs
**To Test:**
- Click "API Docs" in top navigation
- Page loads showing:
  - Authentication section
  - 5 endpoints documented (POST /api/scan, GET /api/findings, etc.)
  - Parameters and response formats
  - Rate limiting info (100 requests/minute)
  - Error handling
  - Example curl commands
- Copy-paste example code

**Expected Result:** Developers can integrate via REST API

---

#### Feature 15: Scheduled Scans
**Location:** Dashboard, below risk comparison
**To Test:**
- On dashboard
- Look for "SCHEDULED SCANS" section
- See weekly scan history:
  - "Monday: 2 new critical"
  - "Tuesday: 0 new, 1 resolved"
  - etc.
- See trend analysis: "Risk down 12%"
- Configuration options for daily/weekly

**Expected Result:** Automated scan history and trends

---

## CONFIGURATION & TESTING SETUP

### Setting Up Integrations (Optional but Recommended)

#### For Linear Tickets:
1. Go to https://linear.app/settings/api
2. Create an API key (Personal)
3. Copy the key (starts with `lin_pat_`)
4. Click "Settings" button in OAuthSentry
5. Paste into "Linear API Key" field
6. Click "Save Configuration"

#### For Slack Alerts:
1. Go to https://api.slack.com/messaging/webhooks
2. Click "Create New App"
3. Choose "From scratch" → name it "OAuthSentry" → select workspace
4. Go to "Incoming Webhooks" → Enable
5. "Add New Webhook to Workspace" → select channel → Authorize
6. Copy the webhook URL (starts with `https://hooks.slack.com/`)
7. In OAuthSentry Settings, paste into "Slack Webhook URL"
8. Click "Save Configuration"

**Once configured:**
- Run a demo scan or real scan
- Expand a critical/high finding
- Click "File Linear ticket" → Ticket creates in Linear automatically!
- Click "Send Slack alert" → Message posts to your Slack channel!

---

## COMPLETE TESTING WORKFLOW (10 minutes)

### Part 1: Demo Mode Testing (3 minutes)
```
Step 1: Homepage
- Go to https://oauthsentry-phi.vercel.app/
- See hero headline: "Find the third-party AI tool that breaches you"
- See 4 stat cards at bottom (IOC sources, assets, findings, last sweep)

Step 2: Demo Mode
- Click "Demo Mode" button (lightning icon)
- Watch 5 findings load: Context.ai, stalebot-pro, clipboardz, MeetScribe, evalrunner
- Metrics update: "2 Critical, 3 High, 5 Total"
- Risk breakdown bar fills with colors (red, orange)

Step 3: Expand Finding
- Click on Context.ai finding (first one, score 95)
- See full details expand below
```

### Part 2: Feature Testing (5 minutes)
```
Step 4: Tier 1 Features
- See metrics cards at top
- See risk breakdown bar
- Scroll down to see remediation status dropdown
- Try changing to "In Progress" and select date

Step 5: Tier 2 Features
- See risk timeline (low → medium → critical)
- See scoring breakdown (35 + 25 + 20 + 15 = 95)
- See remediation steps (6 numbered actions)
- See threat intelligence CVEs (CVE-2026-0047, CVSS 9.8, NVD)
- Scroll to see team collaboration section
- See remediation scorecard on dashboard

Step 6: Tier 3 Features
- Go back to dashboard
- Click "Export as PDF" → file downloads
- Open PDF to verify all findings included
- Go to "API Docs" in navigation
- See REST API endpoints documented
- See scheduled scans history
```

### Part 3: Integration Testing (Optional, 2 minutes)
```
Step 7: Configure Integrations (if you have API keys)
- Click "Settings" button
- Enter Linear API key
- Enter Slack webhook URL
- Click "Save Configuration"

Step 8: Test Integrations
- Run Demo Mode again
- Expand critical finding
- Click "File Linear ticket" → Check Linear app, ticket appears!
- Click "Send Slack alert" → Check Slack channel, message posts!
```

---

## TESTING CHECKLIST

### Tier 1 Features (Critical)
- [ ] Stats dashboard shows 4 metric cards
- [ ] Risk breakdown bar shows colors and proportions
- [ ] Remediation tracking dropdown works
- [ ] Demo Mode loads 5 findings instantly
- [ ] Threat intel CVEs have links

### Tier 2 Features (Should Have)
- [ ] Risk timeline shows progression
- [ ] Remediation scorecard visible
- [ ] Scoring breakdown bars proportional
- [ ] Remediation steps 6 items
- [ ] Team collaboration section exists

### Tier 3 Features (Nice to Have)
- [ ] Export as PDF downloads file
- [ ] Risk comparison chart shows all findings
- [ ] False positive checkbox present
- [ ] API Docs page loads
- [ ] Scheduled scans history visible

### Quality Checks
- [ ] No console errors (open DevTools)
- [ ] App responsive (resize window, test mobile)
- [ ] Settings dialog opens and closes
- [ ] API Docs link in navigation works
- [ ] All features visible with Demo Mode

---

## SUBMISSION PREPARATION

### Before You Submit

**Create Demo Video (< 2 minutes)**
1. Screen record with Loom or built-in recorder
2. Show:
   - Homepage hero
   - Click Demo Mode → findings load
   - Expand Context.ai → show timeline + scores + CVEs
   - Show remediation steps
   - Show false positive checkbox
   - Dashboard → Export PDF, Risk comparison, Scorecard
   - API Docs navigation
   - Settings dialog
3. Total: ~2 minutes
4. Upload to YouTube (unlisted) or Loom

**Gather Links**
```
Live App: https://oauthsentry-phi.vercel.app/
GitHub: https://github.com/HayreKhan750/oauthsentry
API Docs: https://oauthsentry-phi.vercel.app/api-docs
Demo Video: [your YouTube/Loom link]
```

### Submission Description Template

```
PROJECT: OAuthSentry
TRACK: Vercel Workflow SDK + AI SDK 6 + Chat SDK

DESCRIPTION:
OAuthSentry is a production-ready security agent that continuously scans 
OAuth apps, third-party AI integrations, and supply-chain dependencies 
against live threat feeds. It automatically files Linear tickets and posts 
Slack alerts for critical findings.

KEY FEATURES (15 Total):
Tier 1 (High-Impact):
  ✓ Real-time metrics dashboard
  ✓ Severity breakdown visualization
  ✓ Remediation tracking (Open → In Progress → Resolved)
  ✓ Interactive demo mode (test without API keys!)
  ✓ Threat intelligence with CVE attribution

Tier 2 (Differentiation):
  ✓ Risk timeline (shows how threats escalate)
  ✓ Remediation scorecard (team efficiency metrics)
  ✓ Risk factor scoring breakdown (transparent AI scoring)
  ✓ Automated remediation recommendations (step-by-step)
  ✓ Team collaboration (comments, mentions, linking)

Tier 3 (Polish):
  ✓ PDF export reports for compliance
  ✓ Risk comparison for prioritization
  ✓ False positive flagging
  ✓ REST API documentation
  ✓ Scheduled scan reports

WHAT MAKES THIS PRODUCTION-READY:
✓ Real integrations (Linear & Slack tickets actually created)
✓ Durable workflows (WDK survives restarts)
✓ Multi-platform alerts (Slack, Teams, Discord via Chat SDK)
✓ Enterprise features (remediation tracking, compliance exports)
✓ Security-first (headers, Sentry error tracking)

TECH STACK:
- Next.js 16 with React 19
- Tailwind CSS 4 with semantic tokens
- AI SDK 6 with Vercel AI Gateway
- Workflow Development Kit (durable workflows)
- Chat SDK (multi-platform)
- jsPDF for professional reports
- Linear & Slack integrations
- Sentry error tracking

INSPIRED BY:
April 2026 Vercel/Context.ai incident where compromised OAuth app 
pivoted into employee systems. OAuthSentry finds these risks first.

QUICK TEST:
Click "Demo Mode" to see 5 realistic findings load instantly.
```

### Where to Submit

1. **Vercel Hackathon Portal** (if available)
   - Project name: OAuthSentry
   - Category: Workflow + AI + Chat SDK
   - GitHub URL: https://github.com/HayreKhan750/oauthsentry
   - Live URL: https://oauthsentry-phi.vercel.app/
   - Upload demo video

2. **Email** (to hackathon organizers)
   - Subject: "OAuthSentry - Hackathon Submission"
   - Include all links above
   - Attach README.md

---

## WHAT JUDGES EVALUATE

### Functionality (40%)
- ✓ All 15 features work as described
- ✓ Demo Mode loads instantly without setup
- ✓ Real integrations (Linear, Slack verified)
- ✓ No crashes or errors
- ✓ Fast performance

### Innovation (30%)
- ✓ Unique approach to security monitoring
- ✓ Real-world problem solving
- ✓ Professional enterprise features
- ✓ Automated remediation workflows

### Code Quality (20%)
- ✓ Clean, well-organized code
- ✓ TypeScript strict mode
- ✓ Security best practices
- ✓ Error handling

### Design (10%)
- ✓ Professional, polished UI
- ✓ Clear information hierarchy
- ✓ Responsive design
- ✓ Accessible

---

## YOU'RE READY!

Your app now has:
- 15 professional features (Tier 1, 2, 3)
- Production-ready architecture
- Judge-friendly demo mode
- Enterprise capabilities
- Real threat data

This puts you in the top tier of submissions. Submit now! 🚀
