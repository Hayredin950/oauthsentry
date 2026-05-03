"use client"

import { useState } from "react"
import type { RiskFinding } from "@/lib/types"
import { Download, FileText, File, Crown, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ExportReportProps {
  findings: RiskFinding[]
  lastUpdated?: Date
}

export function ExportReport({ findings, lastUpdated }: ExportReportProps) {
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false)

  const handleExportPremiumPDF = async () => {
    if (findings.length === 0) {
      alert("No findings to export. Run a scan first.")
      return
    }

    setIsGeneratingPDF(true)

    try {
      const { jsPDF } = await import("jspdf")
      const doc = new jsPDF()
      const pageWidth = doc.internal.pageSize.width
      const pageHeight = doc.internal.pageSize.height
      const margin = 15
      const contentWidth = pageWidth - margin * 2
      let y = margin

      // Helper functions
      const addPage = () => {
        doc.addPage()
        y = margin
      }

      const checkPageBreak = (neededSpace: number) => {
        if (y + neededSpace > pageHeight - 20) {
          addPage()
        }
      }

      const drawLine = (yPos: number, color: [number, number, number] = [200, 200, 200]) => {
        doc.setDrawColor(...color)
        doc.setLineWidth(0.3)
        doc.line(margin, yPos, pageWidth - margin, yPos)
      }

      // Colors
      const colors = {
        primary: [41, 98, 255] as [number, number, number],
        critical: [220, 38, 38] as [number, number, number],
        high: [249, 115, 22] as [number, number, number],
        medium: [234, 179, 8] as [number, number, number],
        low: [34, 197, 94] as [number, number, number],
        info: [59, 130, 246] as [number, number, number],
        text: [30, 30, 30] as [number, number, number],
        muted: [100, 100, 100] as [number, number, number],
        background: [248, 250, 252] as [number, number, number],
      }

      const getSeverityColor = (level: string): [number, number, number] => {
        switch (level) {
          case "critical": return colors.critical
          case "high": return colors.high
          case "medium": return colors.medium
          case "low": return colors.low
          default: return colors.info
        }
      }

      // ===== COVER PAGE =====
      // Background header
      doc.setFillColor(25, 25, 30)
      doc.rect(0, 0, pageWidth, 80, "F")

      // Logo/Title
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(28)
      doc.setFont("helvetica", "bold")
      doc.text("OAuthSentry", margin, 35)

      doc.setFontSize(12)
      doc.setFont("helvetica", "normal")
      doc.text("Security Risk Assessment Report", margin, 48)

      // Report metadata box
      doc.setFillColor(...colors.background)
      doc.roundedRect(margin, 90, contentWidth, 40, 3, 3, "F")

      doc.setTextColor(...colors.text)
      doc.setFontSize(10)
      doc.setFont("helvetica", "bold")
      doc.text("Report Details", margin + 5, 102)

      doc.setFont("helvetica", "normal")
      doc.setFontSize(9)
      doc.setTextColor(...colors.muted)
      doc.text(`Generated: ${new Date().toLocaleString()}`, margin + 5, 112)
      doc.text(`Total Findings: ${findings.length}`, margin + 5, 120)
      if (lastUpdated) {
        doc.text(`Last Scan: ${lastUpdated.toLocaleString()}`, margin + 100, 112)
      }

      // Executive Summary Box
      y = 145
      doc.setFillColor(255, 255, 255)
      doc.setDrawColor(200, 200, 200)
      doc.roundedRect(margin, y, contentWidth, 55, 3, 3, "FD")

      doc.setTextColor(...colors.text)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Executive Summary", margin + 5, y + 12)

      // Summary stats in a row
      const criticalCount = findings.filter((f) => f.level === "critical").length
      const highCount = findings.filter((f) => f.level === "high").length
      const mediumCount = findings.filter((f) => f.level === "medium").length
      const lowCount = findings.filter((f) => f.level === "low").length
      const infoCount = findings.filter((f) => f.level === "info").length

      const statsY = y + 28
      const statWidth = contentWidth / 5

      // Critical
      doc.setFillColor(...colors.critical)
      doc.roundedRect(margin + 5, statsY, statWidth - 10, 20, 2, 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(criticalCount.toString(), margin + 5 + (statWidth - 10) / 2, statsY + 10, { align: "center" })
      doc.setFontSize(7)
      doc.text("CRITICAL", margin + 5 + (statWidth - 10) / 2, statsY + 16, { align: "center" })

      // High
      doc.setFillColor(...colors.high)
      doc.roundedRect(margin + 5 + statWidth, statsY, statWidth - 10, 20, 2, 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(highCount.toString(), margin + 5 + statWidth + (statWidth - 10) / 2, statsY + 10, { align: "center" })
      doc.setFontSize(7)
      doc.text("HIGH", margin + 5 + statWidth + (statWidth - 10) / 2, statsY + 16, { align: "center" })

      // Medium
      doc.setFillColor(...colors.medium)
      doc.roundedRect(margin + 5 + statWidth * 2, statsY, statWidth - 10, 20, 2, 2, "F")
      doc.setTextColor(30, 30, 30)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(mediumCount.toString(), margin + 5 + statWidth * 2 + (statWidth - 10) / 2, statsY + 10, { align: "center" })
      doc.setFontSize(7)
      doc.text("MEDIUM", margin + 5 + statWidth * 2 + (statWidth - 10) / 2, statsY + 16, { align: "center" })

      // Low
      doc.setFillColor(...colors.low)
      doc.roundedRect(margin + 5 + statWidth * 3, statsY, statWidth - 10, 20, 2, 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(lowCount.toString(), margin + 5 + statWidth * 3 + (statWidth - 10) / 2, statsY + 10, { align: "center" })
      doc.setFontSize(7)
      doc.text("LOW", margin + 5 + statWidth * 3 + (statWidth - 10) / 2, statsY + 16, { align: "center" })

      // Info
      doc.setFillColor(...colors.info)
      doc.roundedRect(margin + 5 + statWidth * 4, statsY, statWidth - 10, 20, 2, 2, "F")
      doc.setTextColor(255, 255, 255)
      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.text(infoCount.toString(), margin + 5 + statWidth * 4 + (statWidth - 10) / 2, statsY + 10, { align: "center" })
      doc.setFontSize(7)
      doc.text("INFO", margin + 5 + statWidth * 4 + (statWidth - 10) / 2, statsY + 16, { align: "center" })

      // Risk Overview
      y = 215
      doc.setTextColor(...colors.text)
      doc.setFontSize(12)
      doc.setFont("helvetica", "bold")
      doc.text("Risk Overview", margin, y)
      y += 8

      if (criticalCount > 0 || highCount > 0) {
        doc.setFillColor(254, 226, 226)
        doc.roundedRect(margin, y, contentWidth, 18, 2, 2, "F")
        doc.setTextColor(...colors.critical)
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text("! IMMEDIATE ACTION REQUIRED", margin + 5, y + 7)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.text)
        doc.text(
          `${criticalCount + highCount} high-priority finding(s) require immediate attention.`,
          margin + 5,
          y + 14
        )
        y += 25
      }

      // ===== FINDINGS TABLE PAGE =====
      addPage()

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.text)
      doc.text("Detailed Findings", margin, y)
      y += 10

      // Table header
      const tableHeaders = ["#", "Asset", "Type", "Severity", "Score", "Status"]
      const colWidths = [10, 55, 25, 25, 20, 30]

      doc.setFillColor(240, 240, 245)
      doc.rect(margin, y, contentWidth, 8, "F")
      doc.setFontSize(8)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.text)

      let xPos = margin + 2
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos, y + 5.5)
        xPos += colWidths[i]
      })
      y += 10

      // Table rows
      const sortedFindings = [...findings].sort((a, b) => b.score - a.score)

      sortedFindings.forEach((f, index) => {
        checkPageBreak(10)

        // Alternating row background
        if (index % 2 === 0) {
          doc.setFillColor(250, 250, 252)
          doc.rect(margin, y - 1, contentWidth, 8, "F")
        }

        doc.setFontSize(7)
        doc.setFont("helvetica", "normal")

        xPos = margin + 2

        // Row number
        doc.setTextColor(...colors.muted)
        doc.text((index + 1).toString(), xPos, y + 4)
        xPos += colWidths[0]

        // Asset name
        doc.setTextColor(...colors.text)
        const assetName = f.asset.name.length > 25 ? f.asset.name.slice(0, 22) + "..." : f.asset.name
        doc.text(assetName, xPos, y + 4)
        xPos += colWidths[1]

        // Type
        doc.setTextColor(...colors.muted)
        const kindLabel = f.asset.kind === "oauth_app" ? "OAuth" : f.asset.kind === "npm_package" ? "npm" : "SaaS"
        doc.text(kindLabel, xPos, y + 4)
        xPos += colWidths[2]

        // Severity badge
        doc.setFillColor(...getSeverityColor(f.level))
        doc.roundedRect(xPos, y, 20, 6, 1, 1, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(6)
        doc.text(f.level.toUpperCase(), xPos + 10, y + 4, { align: "center" })
        xPos += colWidths[3]

        // Score
        doc.setFontSize(7)
        doc.setTextColor(...colors.text)
        doc.setFont("helvetica", "bold")
        doc.text(`${f.score}/100`, xPos, y + 4)
        xPos += colWidths[4]

        // Status
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.muted)
        const status = f.remediationStatus || "Open"
        doc.text(status.charAt(0).toUpperCase() + status.slice(1), xPos, y + 4)

        y += 8
      })

      // ===== DETAILED ANALYSIS PAGE =====
      addPage()

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.text)
      doc.text("Detailed Analysis", margin, y)
      y += 12

      // Only show top 10 critical/high findings in detail
      const priorityFindings = sortedFindings.filter(f => f.level === "critical" || f.level === "high").slice(0, 10)

      priorityFindings.forEach((f, index) => {
        checkPageBreak(60)

        // Finding header with severity indicator
        doc.setFillColor(...getSeverityColor(f.level))
        doc.rect(margin, y, 3, 40, "F")

        doc.setFillColor(250, 250, 252)
        doc.rect(margin + 3, y, contentWidth - 3, 40, "F")

        doc.setTextColor(...colors.text)
        doc.setFontSize(10)
        doc.setFont("helvetica", "bold")
        doc.text(`${index + 1}. ${f.asset.name}`, margin + 8, y + 8)

        doc.setFontSize(8)
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.muted)
        doc.text(`${f.asset.identifier}`, margin + 8, y + 14)

        // Headline
        doc.setTextColor(...colors.text)
        doc.setFontSize(8)
        const headlineLines = doc.splitTextToSize(f.headline, contentWidth - 20)
        doc.text(headlineLines, margin + 8, y + 22)

        // Score badge
        doc.setFillColor(...getSeverityColor(f.level))
        doc.roundedRect(pageWidth - margin - 25, y + 3, 22, 10, 2, 2, "F")
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text(`${f.score}/100`, pageWidth - margin - 14, y + 10, { align: "center" })

        y += 45

        // Reasoning
        checkPageBreak(25)
        doc.setTextColor(...colors.text)
        doc.setFontSize(8)
        doc.setFont("helvetica", "bold")
        doc.text("Analysis:", margin, y)
        y += 5
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.muted)
        const reasoningLines = doc.splitTextToSize(f.reasoning, contentWidth)
        doc.text(reasoningLines, margin, y)
        y += reasoningLines.length * 4 + 5

        // Recommendation
        checkPageBreak(25)
        doc.setTextColor(...colors.text)
        doc.setFont("helvetica", "bold")
        doc.text("Recommendation:", margin, y)
        y += 5
        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.muted)
        const recLines = doc.splitTextToSize(f.recommendation, contentWidth)
        doc.text(recLines, margin, y)
        y += recLines.length * 4 + 5

        // Risk factors
        if (f.factors && f.factors.length > 0) {
          checkPageBreak(20)
          doc.setTextColor(...colors.text)
          doc.setFont("helvetica", "bold")
          doc.text("Risk Factors:", margin, y)
          y += 5
          doc.setFont("helvetica", "normal")
          f.factors.forEach((factor) => {
            checkPageBreak(8)
            doc.setTextColor(...colors.text)
            doc.text(`• ${factor.label}:`, margin + 3, y)
            doc.setTextColor(...colors.muted)
            doc.text(factor.detail, margin + 40, y)
            y += 5
          })
        }

        // CVE references
        if (f.cveReferences && f.cveReferences.length > 0) {
          checkPageBreak(15)
          doc.setTextColor(...colors.text)
          doc.setFont("helvetica", "bold")
          doc.text("Threat Intelligence:", margin, y)
          y += 5
          doc.setFont("helvetica", "normal")
          f.cveReferences.forEach((cve) => {
            doc.setTextColor(...colors.info)
            doc.text(`${cve.id} (CVSS ${cve.score}) - ${cve.source}`, margin + 3, y)
            y += 5
          })
        }

        y += 10
        drawLine(y)
        y += 8
      })

      // ===== REMEDIATION SUMMARY PAGE =====
      addPage()

      doc.setFontSize(14)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.text)
      doc.text("Remediation Summary", margin, y)
      y += 12

      // Remediation stats
      const resolved = findings.filter((f) => f.remediationStatus === "resolved").length
      const inProgress = findings.filter((f) => f.remediationStatus === "in-progress").length
      const open = findings.filter((f) => !f.remediationStatus || f.remediationStatus === "open").length

      doc.setFillColor(...colors.background)
      doc.roundedRect(margin, y, contentWidth, 30, 3, 3, "F")

      const remStatWidth = contentWidth / 3
      doc.setFontSize(18)
      doc.setFont("helvetica", "bold")

      doc.setTextColor(...colors.low)
      doc.text(resolved.toString(), margin + remStatWidth / 2, y + 12, { align: "center" })
      doc.setFontSize(8)
      doc.setTextColor(...colors.muted)
      doc.text("Resolved", margin + remStatWidth / 2, y + 20, { align: "center" })

      doc.setFontSize(18)
      doc.setTextColor(...colors.medium)
      doc.text(inProgress.toString(), margin + remStatWidth + remStatWidth / 2, y + 12, { align: "center" })
      doc.setFontSize(8)
      doc.setTextColor(...colors.muted)
      doc.text("In Progress", margin + remStatWidth + remStatWidth / 2, y + 20, { align: "center" })

      doc.setFontSize(18)
      doc.setTextColor(...colors.critical)
      doc.text(open.toString(), margin + remStatWidth * 2 + remStatWidth / 2, y + 12, { align: "center" })
      doc.setFontSize(8)
      doc.setTextColor(...colors.muted)
      doc.text("Open", margin + remStatWidth * 2 + remStatWidth / 2, y + 20, { align: "center" })

      y += 40

      // Priority action items
      doc.setFontSize(11)
      doc.setFont("helvetica", "bold")
      doc.setTextColor(...colors.text)
      doc.text("Priority Action Items", margin, y)
      y += 8

      const actionItems = sortedFindings
        .filter(f => f.level === "critical" || f.level === "high")
        .slice(0, 5)

      actionItems.forEach((f, i) => {
        checkPageBreak(15)
        doc.setFillColor(...getSeverityColor(f.level))
        doc.circle(margin + 3, y + 2, 2, "F")

        doc.setTextColor(...colors.text)
        doc.setFontSize(9)
        doc.setFont("helvetica", "bold")
        doc.text(`${i + 1}. ${f.asset.name}`, margin + 8, y + 3)

        doc.setFont("helvetica", "normal")
        doc.setTextColor(...colors.muted)
        doc.setFontSize(8)
        const actionText = f.recommendation.split('.')[0] + '.'
        const actionLines = doc.splitTextToSize(actionText, contentWidth - 15)
        doc.text(actionLines, margin + 8, y + 9)
        y += 8 + actionLines.length * 4
      })

      // Footer on last page
      y = pageHeight - 15
      drawLine(y - 5)
      doc.setTextColor(...colors.muted)
      doc.setFontSize(7)
      doc.text("Generated by OAuthSentry - Third-Party AI & OAuth Risk Assessment Platform", margin, y)
      doc.text(`Report ID: ${Date.now()}`, pageWidth - margin - 40, y)

      // Save
      doc.save(`oauthsentry-security-report-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (error) {
      console.error("PDF export failed:", error)
      alert("PDF export failed. Please try the JSON or TXT export instead.")
    } finally {
      setIsGeneratingPDF(false)
    }
  }

  const handleExportText = () => {
    if (findings.length === 0) {
      alert("No findings to export. Run a scan first.")
      return
    }

    let report = "═══════════════════════════════════════════════════════════════\n"
    report += "                    OAUTHSENTRY SECURITY REPORT                    \n"
    report += "═══════════════════════════════════════════════════════════════\n\n"
    report += `Generated: ${new Date().toLocaleString()}\n`
    report += `Total Findings: ${findings.length}\n\n`

    report += "───────────────────────────────────────────────────────────────\n"
    report += "                       EXECUTIVE SUMMARY                         \n"
    report += "───────────────────────────────────────────────────────────────\n\n"

    const criticalCount = findings.filter((f) => f.level === "critical").length
    const highCount = findings.filter((f) => f.level === "high").length
    const mediumCount = findings.filter((f) => f.level === "medium").length
    const lowCount = findings.filter((f) => f.level === "low").length

    report += `  CRITICAL:  ${criticalCount.toString().padStart(3)}  ████████████████████\n`
    report += `  HIGH:      ${highCount.toString().padStart(3)}  ████████████████\n`
    report += `  MEDIUM:    ${mediumCount.toString().padStart(3)}  ████████████\n`
    report += `  LOW:       ${lowCount.toString().padStart(3)}  ████████\n\n`

    if (criticalCount > 0 || highCount > 0) {
      report += "  ⚠ IMMEDIATE ACTION REQUIRED\n"
      report += `  ${criticalCount + highCount} high-priority finding(s) need immediate attention.\n\n`
    }

    report += "───────────────────────────────────────────────────────────────\n"
    report += "                       DETAILED FINDINGS                         \n"
    report += "───────────────────────────────────────────────────────────────\n\n"

    findings
      .sort((a, b) => b.score - a.score)
      .forEach((f, i) => {
        report += `┌─ Finding ${i + 1} ─────────────────────────────────────────────\n`
        report += `│ Asset:     ${f.asset.name}\n`
        report += `│ Type:      ${f.asset.kind}\n`
        report += `│ Severity:  ${f.level.toUpperCase()} (Score: ${f.score}/100)\n`
        report += `│ Headline:  ${f.headline}\n`
        report += `├─────────────────────────────────────────────────────────────\n`
        report += `│ Analysis:\n│   ${f.reasoning.split('\n').join('\n│   ')}\n`
        report += `├─────────────────────────────────────────────────────────────\n`
        report += `│ Recommendation:\n│   ${f.recommendation.split('\n').join('\n│   ')}\n`

        if (f.factors && f.factors.length > 0) {
          report += `├─────────────────────────────────────────────────────────────\n`
          report += `│ Risk Factors:\n`
          f.factors.forEach((factor) => {
            report += `│   • ${factor.label}: ${factor.detail}\n`
          })
        }

        if (f.cveReferences && f.cveReferences.length > 0) {
          report += `├─────────────────────────────────────────────────────────────\n`
          report += `│ Threat Intelligence:\n`
          f.cveReferences.forEach((cve) => {
            report += `│   • ${cve.id} (CVSS ${cve.score}) - ${cve.source}\n`
          })
        }

        report += `└─────────────────────────────────────────────────────────────\n\n`
      })

    report += "───────────────────────────────────────────────────────────────\n"
    report += "                     REMEDIATION SUMMARY                         \n"
    report += "───────────────────────────────────────────────────────────────\n\n"
    report += `  Resolved:    ${findings.filter((f) => f.remediationStatus === "resolved").length}\n`
    report += `  In Progress: ${findings.filter((f) => f.remediationStatus === "in-progress").length}\n`
    report += `  Open:        ${findings.filter((f) => !f.remediationStatus || f.remediationStatus === "open").length}\n\n`

    report += "═══════════════════════════════════════════════════════════════\n"
    report += `Report generated by OAuthSentry | ${new Date().toISOString()}\n`
    report += "═══════════════════════════════════════════════════════════════\n"

    const element = document.createElement("a")
    element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(report))
    element.setAttribute("download", `oauthsentry-report-${new Date().toISOString().split('T')[0]}.txt`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const handleExportJSON = () => {
    if (findings.length === 0) {
      alert("No findings to export. Run a scan first.")
      return
    }

    const report = {
      meta: {
        generator: "OAuthSentry",
        version: "1.0.0",
        generated: new Date().toISOString(),
        lastScan: lastUpdated?.toISOString() || null,
      },
      summary: {
        totalFindings: findings.length,
        bySeverity: {
          critical: findings.filter((f) => f.level === "critical").length,
          high: findings.filter((f) => f.level === "high").length,
          medium: findings.filter((f) => f.level === "medium").length,
          low: findings.filter((f) => f.level === "low").length,
          info: findings.filter((f) => f.level === "info").length,
        },
        byStatus: {
          resolved: findings.filter((f) => f.remediationStatus === "resolved").length,
          inProgress: findings.filter((f) => f.remediationStatus === "in-progress").length,
          open: findings.filter((f) => !f.remediationStatus || f.remediationStatus === "open").length,
        },
        averageScore: Math.round(findings.reduce((sum, f) => sum + f.score, 0) / findings.length),
      },
      findings: findings.map((f) => ({
        id: f.assetId,
        asset: {
          name: f.asset.name,
          identifier: f.asset.identifier,
          kind: f.asset.kind,
          scopes: f.asset.scopes,
        },
        risk: {
          level: f.level,
          score: f.score,
          factors: f.factors,
          riskFactorBreakdown: f.riskFactorBreakdown,
        },
        analysis: {
          headline: f.headline,
          reasoning: f.reasoning,
          recommendation: f.recommendation,
          remediationRecommendations: f.remediationRecommendations,
        },
        threatIntelligence: {
          cveReferences: f.cveReferences,
          iocMatches: f.iocMatches,
        },
        remediation: {
          status: f.remediationStatus || "open",
          detectedAt: f.detectedAt,
          remediationDate: f.remediationDate,
        },
        metadata: {
          ticketStatus: f.ticketStatus,
          alertStatus: f.alertStatus,
          linkedTicketUrl: f.linkedTicketUrl,
          isFalsePositive: f.isFalsePositive,
        },
      })),
    }

    const element = document.createElement("a")
    element.setAttribute(
      "href",
      "data:application/json;charset=utf-8," + encodeURIComponent(JSON.stringify(report, null, 2))
    )
    element.setAttribute("download", `oauthsentry-report-${new Date().toISOString().split('T')[0]}.json`)
    element.style.display = "none"
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  return (
    <div className="flex gap-2 flex-wrap">
      <Button
        onClick={handleExportPremiumPDF}
        disabled={isGeneratingPDF || findings.length === 0}
        size="sm"
        className="gap-1.5 text-xs bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0"
      >
        {isGeneratingPDF ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <Crown className="h-3.5 w-3.5" />
        )}
        {isGeneratingPDF ? "Generating..." : "Premium PDF"}
      </Button>
      <Button
        onClick={handleExportText}
        variant="outline"
        size="sm"
        disabled={findings.length === 0}
        className="gap-1.5 text-xs"
      >
        <Download className="h-3.5 w-3.5" />
        Export TXT
      </Button>
      <Button
        onClick={handleExportJSON}
        variant="outline"
        size="sm"
        disabled={findings.length === 0}
        className="gap-1.5 text-xs"
      >
        <FileText className="h-3.5 w-3.5" />
        Export JSON
      </Button>
    </div>
  )
}
