# Systems of Record: Authoritative External Sources

A System of Record is the authoritative external or internal source where original business data is maintained. AI Office does not duplicate these systems; it references, syncs, or analyzes data from them.

---

## What is a System of Record?

**Definition**: The single authoritative source for a data type, typically external to AI Office.

**Characteristics**:
- Authoritative for that data type
- Single source of truth
- Externally maintained (usually)
- AI Office references or syncs from it
- Ownership is external to AI Office
- Business-critical data

**Principle**: AI Office does not become a System of Record for customer data, financial data, employee data, or other external authoritative sources. It references them.

---

## Current Systems of Record

### CRM System (Salesforce)

**Owns**: Customer data, accounts, opportunities, contacts

**What Syncs/Integrates**:
- Customer records (name, contact info, industry, location)
- Account status (active, inactive, churned)
- Opportunity data (stage, amount, close date)
- Contact history (interactions, notes)
- Communication preferences
- Customer segment

**What Does NOT Sync**:
- Detailed sales activity (too frequent, high volume)
- Email content (stored in email system)
- Calendar events (stored in calendar system)
- Personal notes (privacy)
- Sensitive internal commentary

**Frequency**: Daily sync (overnight batch)

**Conflict Resolution**: CRM record is authoritative. If Customer Knowledge record differs, CRM wins.

**Use in AI Office**:
- Customer intelligence (churn risk, opportunity identification)
- Segmentation and targeting
- Personalized communications
- Account strategy
- Customer journey analysis

**Responsibility**:
- **Owner**: Customer success, sales, CRM administrator
- **AI Office Role**: Reference, analyze, sync summary data
- **Never**: Modify customer records in AI Office that should update CRM

---

### ERP System (SAP/NetSuite)

**Owns**: Financial data, inventory, supply chain, cost allocation

**What Syncs/Integrates**:
- Financial data (balance sheet, P&L, GL accounts)
- Inventory levels (by location, by product)
- Cost allocation (by department, by project)
- Vendor data (approved vendors, payment terms)
- Purchase orders (status, amounts)
- Order fulfillment (shipment status)

**What Does NOT Sync**:
- Transaction detail (auditable in ERP)
- Budget justifications (not sync-able)
- Internal accounting notes
- Draft transactions (before posting)

**Frequency**: Weekly sync; daily for critical financial data (revenue, cash position)

**Conflict Resolution**: ERP record is authoritative. If Financial Knowledge record differs, ERP wins.

**Use in AI Office**:
- Financial reporting and analysis
- Budget planning and allocation
- Profitability analysis
- Cash flow forecasting
- Cost optimization
- Inventory analysis

**Responsibility**:
- **Owner**: Finance, operations, procurement, ERP administrator
- **AI Office Role**: Analyze, report, forecast
- **Never**: Record financial transactions in AI Office

---

### HR System (Workday)

**Owns**: Employee data, compensation, org structure, performance records

**What Syncs/Integrates**:
- Employee roster (name, ID, status, hire date, location)
- Compensation data (salary, benefits, stock options)
- Organizational structure (reporting lines, department)
- Role definitions (job title, level, function)
- Performance history (reviews, ratings)
- Development plans (goals, training)
- Leave and time off (vacation, sick, other)

**What Does NOT Sync**:
- Confidential reviews or feedback (privacy)
- Salary details (security, unless authorized role)
- Medical or personal information
- Internal HR analysis or recommendations

**Frequency**: Weekly sync

**Conflict Resolution**: Workday record is authoritative. If Org Knowledge record differs, Workday wins.

**Use in AI Office**:
- Organizational chart (dynamic)
- Headcount analytics
- Compensation analysis
- Retention analysis
- Team composition
- Skill-based resource allocation
- Succession planning

**Responsibility**:
- **Owner**: HR, talent management, HR administrator
- **AI Office Role**: Analyze, forecast, recommend
- **Never**: Create or modify employee records in AI Office

---

### Finance System (Accounting Software)

**Owns**: General ledger, journals, reconciliation, financial statements

**What Syncs/Integrates**:
- Chart of accounts (GL structure)
- Monthly close data (final balances)
- Reconciliation status
- Financial statements (Income statement, Balance sheet, Cash flow)

**What Does NOT Sync**:
- Journal entry details (auditable in source)
- Reconciliation working papers
- Draft entries (before posting)

**Frequency**: Monthly (at close)

**Conflict Resolution**: Accounting system is authoritative.

**Use in AI Office**:
- Financial reporting
- Trend analysis
- Budget variance analysis
- Strategic financial planning

---

### Communication System (Google Workspace / Slack)

**Owns**: Email, calendar, instant messaging, file collaboration

**What Syncs/Integrates**:
- Calendar availability (aggregated, not detailed)
- Email metadata (sender, date, subject) for important decisions
- File sharing metadata (what's been shared, with whom)

**What Does NOT Sync**:
- Email content (privacy)
- Calendar details (privacy, unless for collaboration)
- Instant messaging (not stored in AI Office)
- File content (stored in source systems)

**Frequency**: Real-time for calendar; not synced for email

**Use in AI Office**:
- Meeting scheduling coordination
- Availability analysis for collaboration
- Important decision communications (when documented)

---

### Custom Internal Systems

**Examples**:
- Knowledge management system (what exists today)
- Project management system (Asana, Jira)
- Support ticketing system (Zendesk)
- Analytics warehouse (internal)
- Specialized domain systems

**Pattern**: If system is the authoritative source for a data type, treat as System of Record.

**Responsibility**:
- **Owner**: System owner/administrator
- **AI Office Role**: Reference, sync summaries, analyze
- **Integration**: Document integration spec, sync frequency, conflict resolution

---

## Data Synchronization Strategy

### What to Sync

Sync a data type if:
- ✅ Critical to operations (needed for decisions)
- ✅ Changes frequently (reference too slow)
- ✅ Cannot reference external system (performance or integration limits)
- ✅ Performance requires copy (caching for speed)
- ✅ Compliance requires copy (regulatory hold or audit)

Don't sync if:
- ❌ Can reference external system (let ERP be source)
- ❌ Rarely changes (master data reference OK)
- ❌ Size makes sync impractical (millions of records, high churn)
- ❌ External system is real-time (no point in copy)
- ❌ Privacy concerns (don't copy sensitive data)

---

### Sync Frequency

| Type | Frequency | Example | Justification |
|------|-----------|---------|----------------|
| **Real-time** | Immediate (streaming) | Financial transactions, security events | Critical to immediate decision-making |
| **Near-real-time** | Every 5-15 minutes | Customer status changes, inventory adjustments | Needed for hour-level decisions |
| **Hourly** | Every 1 hour | Sales activity, support tickets | Needed for day-level decisions |
| **Daily** | Overnight batch | Customer records, employee data | Needed for planning |
| **Weekly** | Weekend batch | Market data, financial close, competitor info | Needed for weekly planning |
| **Monthly** | End of period | Financial statements, headcount reports | Needed for reporting |
| **On-demand** | As needed | Report generation, one-time analysis | Not time-sensitive |

---

### Sync Architecture

```
┌─────────────────────────────────────┐
│ SYSTEM OF RECORD                    │
│ (Salesforce, SAP, Workday, etc)     │
│ ✓ Authoritative                     │
│ ✓ Maintained externally             │
└────────────────┬────────────────────┘
                 │ Sync mechanism
                 │ (API, webhooks, batch)
                 ↓
        ┌────────────────────┐
        │ SYNC / CACHE       │
        │ ✓ Current copy     │
        │ ✓ Known freshness  │
        │ ✓ Performance      │
        └────────┬───────────┘
                 │ Reference or sync
                 ↓
        ┌────────────────────────────┐
        │ SYSTEM OF KNOWLEDGE        │
        │ ✓ Interpretation/context   │
        │ ✓ Linked to Record source  │
        │ ✓ Organizational memory    │
        └────────────────────────────┘
```

---

## Conflict Resolution

When data differs between System of Record and AI Office systems:

### Rule 1: System of Record is Authoritative

**If Customer Data differs between Salesforce (Record) and Customer Knowledge (AI Office)**:
1. Salesforce version is correct
2. Update Customer Knowledge to match
3. Investigate why they diverged
4. Fix sync process if systematic issue
5. Document resolution

**Example**:
- Salesforce: Customer name = "Acme Corp Industries Inc"
- Knowledge: Customer name = "Acme Corp" (old version)
- **Action**: Update Knowledge to match, check sync frequency

---

### Rule 2: Sync Latency is Expected

**If real-time decision needed, but sync is delayed**:
- Reference System of Record directly if possible
- Don't make decision based on stale copy
- Escalate to get fresh data
- Improve sync frequency if pattern

**Example**:
- Need to check current inventory before promising delivery
- Last sync was 6 hours ago
- **Action**: Query inventory system directly for real-time data

---

### Rule 3: One-Way Sync

**AI Office → System of Record: Do NOT do this**

- Do not write back to external systems from AI Office
- Do not modify customer records in AI Office intending them to sync back to CRM
- Do not create financial transactions in AI Office

**Why**: Creates dual masters, data corruption, compliance issues

**Exception**: AI-driven data enrichment (with explicit permission)
- Example: AI analyzes customer and adds "Churn Risk: High" to CRM (explicit integration)
- Requires explicit approval, clear APIs, audit trail
- Exception to rule, not the rule

---

### Rule 4: Reporting vs. Transactions

**Read data from System of Record for reporting**: ✅
- Create reports analyzing customer data from Salesforce
- Create financial reports from accounting system
- Create organizational reports from Workday

**Write transactions to System of Record from AI Office**: ❌
- Don't record sales in AI Office
- Don't record expenses in AI Office
- Don't create new employees in AI Office

---

## System of Record Reference Pattern

When you reference System of Record data in AI Office documentation:

```markdown
# Customer Intelligence

This system references customer data from [System of Record: Salesforce CRM].

**Current Customer Count**: [Source: Salesforce, refreshed daily]  
**Data Fields Used**: name, contact_info, industry, location, account_status  
**Sync Frequency**: Daily (overnight)  
**Freshness**: Current as of [date]  

**Note**: This is a summarized view. For transactional access, refer directly to Salesforce.
```

---

## Integration Responsibilities

### Data Integration Owner

Responsible for:
- ✅ Establishing integration (API specs, authentication)
- ✅ Configuring sync (frequency, fields, validation)
- ✅ Monitoring health (latency, errors, data quality)
- ✅ Maintaining documentation
- ✅ Troubleshooting failures
- ✅ Planning upgrades (when system changes)

NOT responsible for:
- ❌ Content accuracy (System of Record owner is)
- ❌ Business logic (System of Record owner is)
- ❌ User training (domain owner is)

---

### System of Record Owner

Responsible for:
- ✅ Data accuracy and completeness
- ✅ System maintenance and upgrades
- ✅ User training and support
- ✅ Compliance and governance
- ✅ Performance and availability

---

### Domain Owner in AI Office

Responsible for:
- ✅ Interpreting and enriching data
- ✅ Adding organizational context
- ✅ Using data for analysis
- ✅ Ensuring data is discoverable
- ✅ Keeping links to source current
- ❌ NOT modifying original records

---

## Common Integration Patterns

### Pattern 1: Reference-Only

**Use When**: Read-only access sufficient, real-time not needed

**Example**: Customer knowledge references Salesforce

**Implementation**:
```
Customer Knowledge
├─ Summary: [from Salesforce]
├─ Insights: [analysis]
├─ Historical: [trend data]
└─ Source: Salesforce CRM
```

---

### Pattern 2: Cached Sync

**Use When**: Performance critical, real-time not needed

**Example**: Daily employee roster cached

**Implementation**:
- Daily overnight sync to cache
- Reports query cache, not Workday
- Cache is read-only

---

### Pattern 3: Streaming Integration

**Use When**: Real-time updates critical

**Example**: Financial transactions, security events

**Implementation**:
- Webhooks or event stream from source
- Immediate processing
- Audit trail maintained

---

### Pattern 4: Bi-directional (Limited)

**Use When**: AI enriches external system

**Example**: AI adds churn risk score back to Salesforce

**Implementation**:
- Explicit integration contract
- One-way for data to AI, one-way back for enrichment
- Cannot override source system data
- Full audit trail

---

## Data Quality Agreements (SLAs)

For each System of Record sync:

```
System of Record: Salesforce CRM
├─ Data Freshness: Daily (refreshed by 6 AM)
├─ Completeness: ≥95% of active customers
├─ Accuracy: As maintained by Salesforce
├─ Recovery Time: 4 hours if sync fails
├─ Contact: [Integration owner]
└─ Escalation: [Salesforce owner]
```

---

## Migration Away From System of Record

If System of Record changes (e.g., migrate from Salesforce to new CRM):

1. **Establish new System of Record** (new system active, parallel run)
2. **Maintain sync** from new source (usually parallel with old)
3. **Cutover data** (migrate customer records)
4. **Verify accuracy** (validate migration)
5. **Update integration** (point to new source)
6. **Decommission old** (after verification period)
7. **Update documentation** (all references to new source)

---

## Key Principle

**AI Office does not attempt to be authoritative for business data. It references, analyzes, and enriches Systems of Record.**

When clear about what is System of Record:
- Data stays authoritative
- Sync is straightforward
- Integration is clean
- Conflicts are easily resolved
- AI Office acts as intelligence layer, not replacement

---

**AI Office analyzes and enriches Systems of Record but does not become a System of Record itself.**
