from pathlib import Path

def replace(path, old, new):
    p = Path(path)
    s = p.read_text()
    if old not in s:
        raise SystemExit(f'pattern not found: {path}')
    p.write_text(s.replace(old, new, 1))

replace(
    'src/screens/PerformanceScreen.tsx',
    "  // why (Website Users, GA4 Enquiries, Marketing Leads, Marketing Spend —\n  // the same real, bounded-window sources already used above). \"All time\"",
    "  // why (Website Users, GA4 Enquiries and Marketing Leads — the real,\n  // bounded-window sources used below). Known Campaign Spend is deliberately\n  // excluded: it is a campaign-lifetime figure, so comparing it as if it were\n  // spend incurred in two reporting periods would be misleading. \"All time\""
)
replace(
    'src/screens/PerformanceScreen.tsx',
    "    // \"Connected\" here means the Infinity integration itself is live —\n    // distinct from whether THIS entity has any real call data to show.\n    // Infinity's real data today is scoped to one hardcoded campaign (see\n    // src/utils/wave1.ts), so a connected integration can still show\n    // \"Not connected\" on an out-of-scope entity's Channel Performance\n    // tile below — that's a genuine data-availability gap, not a\n    // contradiction, and the \"Wave 1 campaign only\" suffix here makes\n    // that explicit rather than leaving the two readings unreconciled.\n",
    "    // Page-level Infinity coverage and Calls now use the modern,\n    // entity-aware Infinity integration. Wave 1 remains only for the\n    // explicitly labelled campaign-specific GA4/Calls column below.\n"
)
replace(
    'src/screens/PerformanceScreen.tsx',
    "  const spendBreakdownSubtitle = `Fixed costs £${Math.round(marketingSpendInfo.fixedCosts).toLocaleString()} · Media £${Math.round(marketingSpendInfo.mediaSpend).toLocaleString()}${",
    "  const spendBreakdownSubtitle = `Campaign lifetime · Fixed costs £${Math.round(marketingSpendInfo.fixedCosts).toLocaleString()} · Media £${Math.round(marketingSpendInfo.mediaSpend).toLocaleString()}${"
)
replace(
    'src/screens/PerformanceScreen.tsx',
    '              title="Marketing Spend"',
    '              title="Known Campaign Spend"'
)
replace(
    'backend/src/routes/analytics.ts',
    "// support only; Leads & CRM does not yet render this (see the Leads & CRM\n// Data + Privacy Foundation phase report).",
    "// support consumed by Leads & CRM's Pipeline & Opportunity Analysis.\n// Stage remains display-only and never changes Status-based classification."
)
print('comments cleaned')
