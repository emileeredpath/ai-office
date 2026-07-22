# Information Architecture: How Data Flows Through AI Office

AI Office manages four types of information: Systems of Record, Systems of Knowledge, Systems of Work, and Systems of Intelligence. This document defines each type, how they relate, and how data flows between them.

---

## Four Information Systems

### System of Record (Authoritative Source)

**Definition**: The authoritative external or internal source where original data is maintained.

**Characteristics**:
- Single source of truth for that data type
- Usually external to AI Office (CRM, ERP, HR, Finance)
- AI Office doesn't duplicate; it references or synchronizes
- Owner typically external to AI Office
- Authoritative for all other systems

**Examples**:
- Salesforce CRM (customer data, opportunities)
- SAP/NetSuite ERP (financial, inventory, supply chain)
- Workday (employee data, HR information)
- Google Workspace (email, calendar)
- Custom database (internal-only data)

**Rules**:
- ✅ Reference the record in System of Knowledge
- ✅ Synchronize critical data as needed
- ✅ Cache if needed for performance
- ❌ Don't duplicate if reference works
- ❌ Don't modify in AI Office if authoritative elsewhere

### System of Knowledge (Governed Understanding)

**Definition**: AI Office's governed, structured understanding of the business.

**Characteristics**:
- Curated view of business knowledge
- Authoritative within AI Office (not copying Systems of Record)
- Single source of truth for interpreted/summarized data
- Can be derived from Systems of Record
- Can include human judgment and context
- Maintained by domain owners

**Examples**:
- "Here's what we know about our customers" (summary from CRM)
- "Here's our product positioning" (synthesized from multiple sources)
- "Here's why we made this decision" (decision record)
- "Here's what we learned from that experience" (lessons learned)
- "Here are best practices for this process" (institutional knowledge)

**Rules**:
- ✅ Organize by domain
- ✅ Link to System of Record source
- ✅ Add context and interpretation
- ✅ Update when understanding changes
- ❌ Don't duplicate System of Record
- ❌ Don't keep outdated versions
- ❌ Don't store raw data if System of Record exists

### System of Work (Transactional Coordination)

**Definition**: Where tasks, workflows, approvals, and operational execution are coordinated in real-time.

**Characteristics**:
- Real-time, transactional
- Ephemeral (exists for duration of work)
- Work-in-progress, temporary
- Performance-critical
- Tied to specific process execution
- Auditable for compliance

**Examples**:
- Workflow execution (this invoice in process)
- Task assignment (this task assigned to person X)
- Approval chain (waiting for Y to approve)
- Project status (this project 80% complete)
- Incident tickets (responding to customer issue)
- Daily operations dashboard (today's status)

**Rules**:
- ✅ Real-time updates during work
- ✅ Clear audit trail of changes
- ✅ Escalation when stuck
- ✅ Archive when complete
- ❌ Don't keep indefinitely
- ❌ Don't use for decision-making (use Analytics)

### System of Intelligence (Analysis & Recommendations)

**Definition**: Reporting, analysis, recommendations, and AI-assisted decision support.

**Characteristics**:
- Derived from work and knowledge
- Analysis and interpretation
- Recommendations and insights
- AI-generated intelligence
- Decision support (not decisions)
- Historical and predictive
- Updated regularly, not real-time

**Examples**:
- "Revenue is up 15% this quarter" (derived from work)
- "This customer has high churn risk" (predicted from data)
- "Recommend automating this process" (derived insight)
- "Team productivity increased with new tool" (analysis)
- "Competitor X launched feature Y" (market intelligence)
- "This decision conflicted with company values" (analysis)

**Rules**:
- ✅ Derived from System of Work or Knowledge
- ✅ Recommendations backed by analysis
- ✅ Confidence levels indicated
- ✅ Traceable to source data
- ❌ Not taken as final decision (humans decide)
- ❌ Accuracy not guaranteed (analytical, not factual)

---

## Information Flow

```
┌──────────────────────────────┐
│ EXTERNAL SYSTEMS             │
│ (CRM, ERP, HR, Finance, etc) │
└────────────┬─────────────────┘
             │ Sync/Reference
             ↓
┌──────────────────────────────┐
│ SYSTEM OF RECORD             │
│ Authoritative external source │
└────────────┬─────────────────┘
             │ Interpreted
             ↓
┌──────────────────────────────┐
│ SYSTEM OF KNOWLEDGE          │
│ Governed understanding        │
└────────────┬─────────────────┘
             │ Informed by
             ↓
┌──────────────────────────────┐
│ SYSTEM OF WORK               │
│ Operational execution         │
└────────────┬─────────────────┘
             │ Measured by
             ↓
┌──────────────────────────────┐
│ SYSTEM OF INTELLIGENCE       │
│ Analysis and recommendations  │
└────────────┬─────────────────┘
             │ Informs
             ↓
┌──────────────────────────────┐
│ HUMAN DECISION-MAKERS        │
│ Make decisions on intelligence│
└────────────┬─────────────────┘
             │ Implement
             ↓
        Back to WORK
```

---

## Information Ownership

### By Information Type

| Type | System | Owner | Maintained By | Used By |
|------|--------|-------|----------------|---------|
| Customer Data | Record | CRM | CRM Team | Sales, Operations |
| Financial Data | Record | Finance System | Finance Team | Finance, Analytics |
| Employee Data | Record | HR System | HR Team | HR, Operations |
| Organizational Knowledge | Knowledge | Knowledge Steward | Domain Owners | All teams |
| Process Workflows | Work | Operations | Sandy/Automation | Operations team |
| Performance Metrics | Intelligence | Analytics | Analytics team | Leadership |
| Lessons Learned | Knowledge | Knowledge Steward | Teams via Memory | All teams |
| Decisions | Knowledge | Decision Maker | Records system | All teams |

---

## Data Lifecycle

### Capture Phase
**Source**: Operations, external systems  
**What**: Raw data from work, transactions, events  
**How**: Automated capture, manual entry, system sync  
**Owner**: Operational team  
**Lifetime**: Real-time, temporary (archived after processing)

### Organization Phase
**Source**: Captured data  
**What**: Structured, interpreted data  
**How**: Parsing, transformation, enrichment  
**Owner**: Domain owner or Data team  
**Lifetime**: As long as relevant (archived if outdated)

### Analysis Phase
**Source**: Organized data  
**What**: Insights, patterns, recommendations  
**How**: Analytics, reporting, AI models  
**Owner**: Analytics team  
**Lifetime**: Until superseded by new analysis

### Decision Phase
**Source**: Analysis and context  
**What**: Human decisions based on information  
**How**: Human judgment, documented decisions  
**Owner**: Decision maker  
**Lifetime**: Permanent (decisions create history)

### Learning Phase
**Source**: Decisions and outcomes  
**What**: Lessons and institutional memory  
**How**: Reflection, documentation, improvement  
**Owner**: Knowledge/Memory team  
**Lifetime**: Permanent (guides future decisions)

---

## Information Storage Decisions

For each piece of information, decide:

### Where Should This Live?

**System of Record?**
- If it's authoritative and sourced externally
- If it's the single source of truth
- Example: Customer records in CRM
- Action: Reference/sync, don't duplicate

**System of Knowledge?**
- If it's interpretation or context
- If multiple systems need to understand it
- If it's institutional knowledge
- Example: "What we know about customers" summary
- Action: Document in Knowledge domain

**System of Work?**
- If it's transactional or ephemeral
- If it's real-time execution
- If it needs to be archived after use
- Example: Invoice in approval process
- Action: Handle through workflow system

**System of Intelligence?**
- If it's derived/calculated
- If it's analysis or recommendation
- If it's AI-generated
- Example: "Customer churn risk score"
- Action: Generate on-demand or cache temporarily

---

## Data Synchronization

### What Data to Sync

Sync only if:
- ✅ Critical to operations
- ✅ Changes frequently
- ✅ Cannot reference external system
- ✅ Performance requires copy
- ✅ Compliance requires copy

Don't sync if:
- ❌ Can reference external system
- ❌ Rarely changes
- ❌ Size makes sync impractical
- ❌ External system is real-time

### Sync Frequency

| Type | Frequency | Example |
|------|-----------|---------|
| Real-time | Immediate | Financial transactions |
| Near-real-time | Every few minutes | Customer status changes |
| Daily | Overnight batch | Employee data, inventory |
| Weekly | Weekly sync | Market data, competitor info |
| Monthly | Monthly batch | Financial close, payroll |
| On-demand | As needed | Report generation |

### Conflict Resolution

If data differs between System of Record and System of Knowledge:

**Trust the System of Record** (it's authoritative)
1. Compare to Record
2. If Record is different, Record wins
3. Update Knowledge to match
4. Investigate why they diverged
5. Fix sync if systematic issue

---

## Data Retention and Archival

### What to Keep

Keep permanently:
- ✅ Constitutional and governance documents
- ✅ Decision records and rationale
- ✅ Financial and legal records
- ✅ Lessons learned and institutional knowledge
- ✅ Historical performance trends
- ✅ Employee records (per policy)

Archive after X days:
- ~ Work-in-progress (after completion + audit period)
- ~ Transactional data (after business period)
- ~ Temporary reports (after superceded)

Delete safely:
- ❌ Personal data (per privacy policy)
- ❌ Temporary work files (after archival)
- ❌ Superseded versions (keep one archive)

---

## Integration Points

### CRM Integration

**What syncs**:
- Customer records (basic data)
- Account status (active, inactive)
- Communication preferences

**What doesn't**:
- Detailed sales activity (too frequent)
- Email content (stored in email system)
- Personal notes (privacy)

**Frequency**: Daily

### ERP Integration

**What syncs**:
- Financial data (balance sheet, P&L)
- Inventory levels
- Cost allocation

**What doesn't**:
- Transaction detail (auditable in ERP)
- Budget justifications (not sync-able)
- Internal notes

**Frequency**: Weekly (more frequent for critical)

### HR Integration

**What syncs**:
- Employee roster
- Compensation data
- Org structure changes

**What doesn't**:
- Confidential reviews
- Salary details (security)
- Internal feedback

**Frequency**: Weekly

---

## Single Source of Truth Rule

**Every piece of information has ONE authoritative source.**

If you find information in multiple places:
1. Identify which is authoritative (usually System of Record)
2. Keep authoritative version current
3. Remove/archive copies
4. Link to authoritative source from others

Example:
- Customer data authoritative in Salesforce ✓
- Remove duplicate in spreadsheet ✗
- Link to Salesforce record from Knowledge ✓

---

## Information Quality Standards

| Dimension | Standard | Responsibility |
|-----------|----------|-----------------|
| Accuracy | ≥95% correct | Owner domain |
| Completeness | All required fields | Data steward |
| Timeliness | Updated when changed | Owner domain |
| Consistency | Matches other sources | Data integration |
| Accessibility | Findable and available | Experience team |
| Security | Protected appropriately | Platform/Security |

---

## Key Principle

**Information flows from external reality through Systems of Record to Knowledge to Work to Intelligence to Human Decisions, which inform future Work.**

Each system has a role. Understanding which system owns which information prevents duplication, ensures accuracy, and enables effective decision-making.

---

**Clear information architecture enables data-driven decisions and prevents duplication and confusion.**

