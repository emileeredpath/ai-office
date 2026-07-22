# Multi-Company Architecture: Supporting Multiple Operating Entities

AI Office can support single-company or multi-company structures. The architecture must handle shared governance while allowing company-specific operations, optional hierarchical levels, and flexible configuration inheritance.

---

## Multi-Company Principle

**AI Office can operate in three modes**:

1. **Single Company**: One operating entity (startup, single business)
2. **Multi-Company Flat**: Multiple independent operating entities (federalized structure)
3. **Multi-Company Hierarchical**: Holding company with subsidiaries (corporate structure)

**Key**: The architecture supports all three without major redesign.

---

## Organizational Hierarchy

```
┌──────────────────────────────────────┐
│ HOLDING COMPANY (Optional)           │
│ ✓ Strategic oversight               │
│ ✓ Consolidated reporting            │
│ ✓ Shared services                   │
└─────────────┬────────────────────────┘
              │
    ┌─────────┴──────────┬──────────────┐
    │                    │              │
    ↓                    ↓              ↓
┌─────────┐      ┌──────────┐    ┌──────────┐
│ Company │      │ Company  │    │ Company  │
│ A       │      │ B        │    │ C        │
└────┬────┘      └────┬─────┘    └────┬─────┘
     │                │              │
  ┌──┴────┬──────┐ ┌──┴────┐    ┌────┴──────┐
  │        │      │ │       │    │           │
  ↓        ↓      ↓ ↓       ↓    ↓           ↓
 BU1  BU2  Dept  Dept   Dept   Team    Dept
(optional, can skip levels)
```

**Flexibility Rules**:
- Group (optional) - holding company layer
- Company (required) - operating entity
- Business Unit (optional) - functional area
- Department (required) - operational unit
- Team (optional) - sub-group
- Role (required) - individual or AI employee

---

## Single Company Structure

**When**: Single operating entity, no parent company

**Configuration**:
```
Company (Operating Entity)
├─ Department (Functional)
├─ Department (Functional)
│  └─ Team (Work Group)
└─ Department (Functional)
```

**Example** (Startup):
```
MyCompany Inc
├─ Operations
├─ Engineering
│  └─ Platform Team
│  └─ Analytics Team
├─ Sales
└─ Finance
```

**Characteristics**:
- All data owned by Company
- Single Constitution
- Single configuration baseline
- Straightforward governance

---

## Multi-Company Flat Structure

**When**: Multiple independent operating entities at same level

**Configuration**:
```
Company A                Company B                Company C
├─ Department          ├─ Department           ├─ Department
├─ Department          ├─ Department           └─ Department
└─ Department          └─ Department
```

**Example** (Franchise Model):
```
Franchise Company Parent (Policy setter only)
├─ Franchise A Inc (autonomous)
├─ Franchise B Inc (autonomous)
└─ Franchise C Inc (autonomous)
```

**Characteristics**:
- Each company independent
- Shared Constitution (optional)
- Shared standards (optional)
- Company-specific configurations
- Federated governance

**Data Isolation**:
- Company A sees only its data
- Company B sees only its data
- Parent sees aggregated reporting
- No cross-company visibility by default

---

## Multi-Company Hierarchical Structure

**When**: Holding company with operating subsidiaries

**Configuration**:
```
Holding Company
├─ Shared Services
│  ├─ Finance (shared)
│  ├─ HR (shared)
│  └─ Legal (shared)
│
├─ Subsidiary Company 1
│  ├─ Operations
│  ├─ Sales
│  └─ Department
│
├─ Subsidiary Company 2
│  └─ Operations
│
└─ Subsidiary Company 3
   └─ Operations
```

**Example** (Corporate Structure):
```
Acme Holdings Corp
├─ Shared Finance Division
├─ Shared Legal Department
│
├─ Acme Manufacturing Ltd (subsidiary)
│  ├─ Operations
│  └─ Logistics
│
├─ Acme Software Inc (subsidiary)
│  ├─ Engineering
│  └─ Product
│
└─ Acme Consulting LLC (subsidiary)
   ├─ Delivery
   └─ Sales
```

**Characteristics**:
- Centralized services (Finance, Legal, HR)
- Subsidiary autonomy
- Consolidated reporting
- Shared Constitution with overrides
- Mixed governance

---

## Configuration Inheritance Model

**Principle**: Rules cascade from high level down, with override capability at each level.

### Inheritance Chain

```
CONSTITUTION (Immutable, applies to all)
    ↓ (delegates to)
PLATFORM DEFAULT (AI Office standard settings)
    ↓ (overridable by)
GROUP STANDARD (Holding company policy)
    ↓ (overridable by)
COMPANY OVERRIDE (Operating company policy)
    ↓ (overridable by)
BUSINESS UNIT OVERRIDE (Functional area policy)
    ↓ (overridable by)
DEPARTMENT OVERRIDE (Operational unit policy)
    ↓ (overridable by)
WORKFLOW SPECIFIC RULE (Individual workflow settings)
```

### Example: Hiring Authority

**Default**: "Managers can approve hiring up to $100k salary"

**Inheritance Example 1 (Single Company)**:
```
Platform Default: Hire limit = $100k
Company Override: Hire limit = $80k (tighter control)
Department Override (Engineering): Hire limit = $200k (specialized)
Specific Workflow: Director approval needed for >$150k
```

**Result**: 
- Sales manager can approve up to $80k
- Engineering manager can approve up to $200k
- Director approval needed for Engineering >$150k

---

**Inheritance Example 2 (Multi-Company)**:
```
Platform Default: Hire limit = $100k
Group Standard: Hire limit = $80k (holding company policy)
Company A Override: Hire limit = $80k (follows parent)
Company B Override: Hire limit = $120k (authorized autonomy)
Department A: Hire limit = $60k (more restrictive)
Department B: Hire limit = $150k (authorized high-spend area)
```

**Result**:
- Company A follows holding company limits
- Company B has negotiated autonomy
- Individual departments can override further

---

## Immutable Constraints

**RULE**: Constitutional and legal constraints CANNOT be overridden at any level.

```
┌─────────────────────────────────────────┐
│ IMMUTABLE CONSTITUTIONAL LAYER           │
├─────────────────────────────────────────┤
│ ✓ All decisions audited (no override)   │
│ ✓ Ethical standards enforced (no skip)  │
│ ✓ Legal compliance required (no bypass) │
│ ✓ Data privacy enforced (no exception)  │
│ ✓ Human authority in decisions (no AI)  │
│                                         │
│ These apply everywhere, always          │
└─────────────────────────────────────────┘
        ↓ (cannot override these)
┌─────────────────────────────────────────┐
│ COMPANY/DEPARTMENT FLEXIBILITY           │
├─────────────────────────────────────────┤
│ ✓ Policy scope (can override)           │
│ ✓ Approval levels (can customize)       │
│ ✓ Process procedures (can vary)         │
│ ✓ Resource allocation (can differ)      │
│ ✓ Technology choices (can select)       │
└─────────────────────────────────────────┘
```

**Example**:
- Constitution: "All financial decisions >$1M audited"
- Company A says: "In our company, this applies to all decisions"
- Company B says: "In our company, this applies to >$2M"
- **Result**: Both comply with Constitution, each interprets scope

But:
- Department says: "Skip the audit for this vendor"
- **Result**: VIOLATION - Cannot skip immutable requirement

---

## Data Isolation by Company

### Default: Data is Company-Scoped

**Rule**: Information belongs to a company unless explicitly shared.

```
Company A
├─ Customer data (A's customers only)
├─ Financial data (A's finances only)
├─ Employee data (A's employees only)
└─ Operational data (A's operations only)

Company B
├─ Customer data (B's customers only)
├─ Financial data (B's finances only)
├─ Employee data (B's employees only)
└─ Operational data (B's operations only)

Shared
├─ Corporate policies (all see)
├─ Consolidated reporting (parent sees all)
└─ Shared services (available to all)
```

**Implementation**:
- Database: Company_ID field on all tables
- Queries: Filtered by company context
- APIs: Return only company-scoped data
- Reports: Aggregated by company
- Access: User's company determines visibility

---

### Shared Services (Parent Company)

Some data is shared across all companies:

```
Holding Company Shared Services
├─ Legal policies
├─ Compliance standards
├─ Financial standards
├─ HR policies
├─ Brand standards
└─ Security standards

Available to: All subsidiary companies
Editable by: Parent company
Overridable: Within bounds (immutable constraints)
Reporting: Centralized from shared service
```

**Example**:
- Compliance policy owned by parent Legal
- All companies must follow (immutable)
- Company B can specialize for its industry
- But cannot drop compliance requirements

---

### Consolidated Reporting

Parent company needs consolidated view:

```
Parent Company Dashboard
├─ Consolidated revenue (all companies)
├─ Consolidated headcount (all companies)
├─ Consolidated cash position (all companies)
├─ Risk summary (all companies)
└─ Compliance status (all companies)

Data Source: Each company's operational systems
Aggregation: Automated, read-only summary
Drill-Down: Parent can see company details
Update: Parent cannot change company data
```

---

## User Access Across Companies

### User Belongs to One Primary Company

**Rule**: A user belongs to one company and sees that company's data by default.

```
Employee @Company A
├─ Sees: Company A data
├─ Can access: Company A systems
└─ Reports to: Company A hierarchy
```

### Cross-Company Access (Exception)

Some users work across companies:

**Shared Service Employee** (e.g., Finance)
```
Finance Person @Holding Company
├─ Sees: All companies' financial data
├─ Can access: Consolidated reporting
└─ Role: Finance service provider
```

**Parent Company Executive**
```
CEO @Holding Company
├─ Sees: All companies' data
├─ Can set policy: Across companies
└─ Role: Corporate leadership
```

**Implementation**:
```
User Profile
├─ Primary Company: A
├─ Secondary Access:
│  ├─ Company B (Finance data only)
│  └─ Holding Company (Reporting only)
└─ Access Level: Role-based within each context
```

---

## Multi-Company Sandy Orchestration

### Single Sandy or Multiple?

**Option 1**: Single Global Sandy
- One Sandy orchestrates all companies
- Knows company boundaries
- Respects data isolation
- Can orchestrate across companies when needed

**Option 2**: Sandy per Company
- Each company has its own Sandy
- Independent orchestration
- No cross-company data visibility
- Parent might have meta-Sandy for oversight

**Recommendation**: Single Sandy with company scoping
- More efficient
- Can handle cross-company coordination
- Still respects boundaries
- Simplifies ecosystem

---

## AI Employee Deployment Across Companies

### Company-Specific AI Employees

Each company can have its own AI employees:

```
Company A
├─ Finance AI (processes Company A invoices)
├─ Sales AI (qualifies Company A leads)
└─ Support AI (handles Company A tickets)

Company B
├─ Finance AI (processes Company B invoices)
├─ Operations AI (manages Company B workflows)
└─ Support AI (handles Company B tickets)
```

**Contract Scope**: Each AI employee is scoped to its company

---

### Shared AI Services

Some AI employees serve multiple companies:

```
Compliance AI (shared service)
├─ Company A: Compliance checking
├─ Company B: Compliance checking
└─ Company C: Compliance checking
└─ Contract: Company-blind, policy enforcement only
```

**Contract Requirement**: Shared AI must not leak company-specific data

---

## Governance Across Companies

### Constitutional Governance

Constitution applies to all companies:

```
Constitution (applies everywhere)
├─ Company A must comply
├─ Company B must comply
└─ Company C must comply

Each company has its own Managing Director
└─ Responsible for Constitution compliance in their company
```

---

### Domain Ownership Across Companies

**Option 1**: Centralized Domain Owner (Holding Company)
```
CFO (Holding Company)
├─ Finance domain owner for all companies
├─ Sets standards
├─ Reviews compliance
└─ Authorized to override if needed
```

**Option 2**: Decentralized Domain Owners (Per Company)
```
CFO Company A (Finance domain owner for A)
CFO Company B (Finance domain owner for B)
CFO Company C (Finance domain owner for C)

+ Parent Finance Officer (oversight)
```

**Recommendation**: Hybrid
- Critical domains (Compliance, Security, Finance) report to parent
- Operational domains (Operations, Sales) report to company
- Domain leaders coordinate across companies

---

## Configuration Templates

### Single Company Configuration

```yaml
ai_office_config:
  organizational_structure: single_company
  company:
    name: MyCompany Inc
    id: co-001
    constitution: default
    
  hierarchy_levels:
    - company
    - department
    - team
    - role
  
  data_isolation: company_scoped
  
  approval_authority:
    hiring_limit: $100k
    expense_limit: $50k
    policy_change: company_leadership
```

---

### Multi-Company Hierarchical Configuration

```yaml
ai_office_config:
  organizational_structure: multi_company_hierarchical
  
  holding_company:
    name: Acme Holdings Corp
    id: group-001
    constitution: shared_corporate
    
  shared_services:
    - finance
    - legal
    - security
    - hr
  
  companies:
    - name: Acme Manufacturing Ltd
      id: co-001
      parent: group-001
      hierarchy_levels: [company, department, team, role]
      overrides:
        hiring_limit: $80k
        policy_approval: company_cfo
    
    - name: Acme Software Inc
      id: co-002
      parent: group-001
      hierarchy_levels: [company, department, team, role]
      overrides:
        hiring_limit: $200k
        policy_approval: company_cto
  
  data_isolation: company_scoped
  consolidated_reporting: parent_access
  cross_company_access:
    - role: cfo
      access: all_companies_financial
    - role: ceo
      access: all_companies_all
```

---

## Migration Scenarios

### Growing from Single to Multi-Company

```
Phase 1: Single company operating
AI Office @ Company A

Phase 2: Acquire subsidiary
AI Office @ Company A + Company B (separate instance initially)

Phase 3: Consolidate under holding company
Holding Company
├─ Company A (existing instance)
└─ Company B (data migrated, coordinated)
```

**Data Migration**:
1. Create new Company B scope
2. Migrate Company B data with company_id tagging
3. Verify data isolation
4. Decommission separate instance
5. Enable consolidated reporting

---

### Spinning Off Subsidiary

```
Before: Holding company with subsidiary
├─ Shared Finance
└─ Company A (part of holding)

After: Spinoff
├─ Company A (independent)
├─ Create separate Finance
└─ Migrate shared Finance data
```

**Process**:
1. Create independent Company A instance
2. Copy/migrate Company A data
3. De-link from parent
4. Create independent Finance team
5. Set up independent Constitution
6. Cut over

---

## Key Principle

**Multi-company architecture must support autonomy and consolidation simultaneously. Companies are independent operating entities that share governance while maintaining data isolation.**

When multi-company architecture is clear:
- New companies onboard quickly
- Data stays isolated
- Consolidated reporting works
- Autonomy is preserved
- Governance is enforceable

---

**AI Office scales from single-company to multi-company without architectural change by respecting company boundaries while enabling shared governance.**
