# Organisational Hierarchy: Multi-Level Structure with Optional Layers

AI Office supports flexible organizational hierarchies that scale from small companies to large groups. The hierarchy uses a cascade model where each level can override configuration inherited from above, with constitutional rules immutable at all levels.

---

## Core Hierarchy

```
Group (optional: holding company level)
└── Company (operating company)
    └── Business Unit (optional: functional area)
        └── Department (organized group)
            └── Team (working group)
                └── Role / Position / AI Employee
```

**Key Principle**: Not every organization uses every level. The model supports what exists.

---

## Level Descriptions

### Level 1: Group (Optional)

**When Used**: Multi-company organizations, holding companies, conglomerates

**Characteristics**:
- Encompasses multiple independent companies
- Shared governance and constitutional rules
- Shared services and standards
- Group-wide strategy and objectives
- Separate financial and operational structures

**Example Structures**:
- Holding company with 5 operating companies
- Corporate group with subsidiary companies
- Division managing multiple business units

**Governance**:
- Group Constitution (immutable across all companies)
- Group Standards (default, can be overridden by company)
- Group Services (HR, Finance, IT shared)
- Group Policies (mandatory compliance)

**AI Office Implication**:
- Group-level Sandy for cross-company coordination
- Group-level dashboards for consolidated reporting
- Group-level knowledge base for shared learnings
- Company-level customization for company-specific operations

---

### Level 2: Company (Required)

**Required For**: Every organization or every subsidiary in a group

**Characteristics**:
- Independent operating entity
- Separate P&L responsibility
- Own strategy and objectives
- Own processes and operations
- Own employees and AI workforce

**Example Structures**:
- Standalone company (only one company in Group)
- Operating company within group
- Subsidiary with own leadership

**Governance**:
- Company Constitution (specific to company)
- Inherits from Group if applicable
- Company Policies (more specific than group)
- Company Strategy and Objectives

**AI Office Implication**:
- Company-level Sandy
- Company-specific documentation
- Company dashboards and metrics
- Company employee roster
- Company-specific automations

---

### Level 3: Business Unit (Optional)

**When Used**: Large companies, functional divisions, geographic regions

**Characteristics**:
- Functional or geographic division
- Reports to company leadership
- Own strategy within company strategy
- Own processes within company processes
- Own dashboards within company dashboards

**Example Structures**:
- Sales BU, Operations BU, Product BU
- North America BU, EMEA BU, Asia BU
- Large company with multiple divisions

**Governance**:
- Inherits from Company
- BU-specific policies and strategies
- Cannot override company constitutional rules
- BU objectives align with company strategy

**AI Office Implication**:
- BU-specific processes and documentation
- BU dashboards and KPIs
- BU leadership and organization chart
- BU employees and AI workers

---

### Level 4: Department (Required if used)

**When Used**: Most organizations

**Characteristics**:
- Organized group within BU or Company
- Reports to BU or Company leadership
- Specific functional responsibility
- Own processes and procedures
- Own team and resources

**Example Structures**:
- Engineering, Product, Marketing, Sales, Operations
- Finance, HR, Legal, Admin
- Support, Implementation, Services

**Governance**:
- Inherits from parent level
- Department-specific procedures
- Cannot override higher-level constitutional rules
- Department goals align with organizational objectives

**AI Office Implication**:
- Department documentation and procedures
- Department dashboards
- Department organization and roles
- Department team members

---

### Level 5: Team (Optional)

**When Used**: Large departments, specialized functions

**Characteristics**:
- Working group within department
- Reports to department leadership
- Specific sub-function responsibility
- Own workflows and coordination
- Own sprint/project management

**Example Structures**:
- Engineering: Frontend Team, Backend Team, DevOps Team
- Sales: Enterprise Team, Mid-Market Team, SMB Team
- Support: Tier 1 Team, Tier 2 Team, Tier 3 Team

**Governance**:
- Inherits from department
- Team-specific workflows
- Cannot override higher-level rules
- Team goals align with department objectives

**AI Office Implication**:
- Team workflows and procedures
- Team dashboards and metrics
- Team members and roles
- Team coordination and standups

---

### Level 6: Role/Position/AI Employee (Required)

**Individual level**: Each person or AI agent has:
- Defined role and responsibilities
- Authority level
- Decision rights
- Knowledge required
- Tools available
- Reporting line
- Performance metrics

---

## Hierarchy Flexibility

### Minimal Hierarchy
```
Company
└── Department
    └── Role
```

### Full Hierarchy
```
Group
└── Company
    └── Business Unit
        └── Department
            └── Team
                └── Role
```

### Mixed Hierarchy (some departments use teams, others don't)
```
Company
├── Department with Teams
│   ├── Team 1
│   │   └── Roles
│   └── Team 2
│       └── Roles
└── Department without Teams
    └── Roles
```

---

## Configuration and Override Model

### Inheritance Chain

```
┌─────────────────────────────────────┐
│ PLATFORM DEFAULT                    │ (Immutable baseline)
│ ├─ Constitutional rules             │
│ ├─ Architectural standards          │
│ ├─ Security requirements            │
│ └─ Default policies                 │
└──────────────┬──────────────────────┘
               ↓ inherited by
┌─────────────────────────────────────┐
│ GROUP STANDARD                      │ (Optional)
│ ├─ Group policies                   │
│ ├─ Shared service standards         │
│ ├─ Group governance                 │
│ └─ Group objectives                 │
└──────────────┬──────────────────────┘
               ↓ inherited by
┌─────────────────────────────────────┐
│ COMPANY OVERRIDE                    │ (Required)
│ ├─ Company policies                 │
│ ├─ Company standards                │
│ ├─ Company objectives               │
│ └─ Company processes                │
└──────────────┬──────────────────────┘
               ↓ inherited by
┌─────────────────────────────────────┐
│ BUSINESS UNIT OVERRIDE              │ (Optional)
│ ├─ BU policies                      │
│ ├─ BU standards                     │
│ ├─ BU objectives                    │
│ └─ BU processes                     │
└──────────────┬──────────────────────┘
               ↓ inherited by
┌─────────────────────────────────────┐
│ DEPARTMENT OVERRIDE                 │ (If exists)
│ ├─ Department policies              │
│ ├─ Department procedures            │
│ ├─ Department standards             │
│ └─ Department processes             │
└──────────────┬──────────────────────┘
               ↓ inherited by
┌─────────────────────────────────────┐
│ WORKFLOW-SPECIFIC RULE              │ (If needed)
│ └─ Specific procedure override       │
└─────────────────────────────────────┘
```

### Constraint: Immutable Controls

**Cannot be overridden at any level**:
- Constitutional principles
- Legal and compliance requirements
- Security and privacy standards
- Ethical guidelines
- Governance framework
- Audit and transparency requirements

**Example**: "All hiring requires background check" (constitutional) cannot be overridden by department.

### What Can Be Overridden

- Process procedures (company does it differently than default)
- Approval workflows (BU has different approvers)
- Performance metrics (department measures different KPIs)
- Standards (company uses different tools)
- Escalation paths (different to whom)
- Dashboard definitions (different metrics matter)
- Automation rules (different triggers)

---

## Data Ownership and Scope

### Data Hierarchy

```
Group Data
├─ Group-Wide (shared by all companies)
│  ├─ Group Constitution
│  ├─ Group Objectives
│  ├─ Group Policies
│  └─ Group Customers (if applicable)
└─ Company Data
   ├─ Company-Specific
   │  ├─ Company Strategy
   │  ├─ Company Employees
   │  └─ Company Operations
   └─ Team/Department Data
      ├─ Team Workflows
      ├─ Team Projects
      └─ Team Dashboards
```

### Access Control

- **Group data**: Accessible to all companies (with role restrictions)
- **Company data**: Accessible to company and below (restricted from other companies)
- **Department data**: Accessible to department and below
- **Personal data**: Individual access with privacy protections

---

## Sandy and AI Deployment

### Sandy Instances

```
Group Sandy
├─ Company Sandy (for Company A)
├─ Company Sandy (for Company B)
└─ Company Sandy (for Company C)
    ├─ Department Sandy (for Engineering)
    ├─ Department Sandy (for Sales)
    └─ Department Sandy (for Operations)
```

**Not every organization needs every level**. Each Sandy instance knows:
- Its authority level
- What it can and cannot decide
- When to escalate
- Boundaries of its domain

### AI Employee Deployment

Each AI employee (specialist agent) is deployed at appropriate level:
- Group-level Finance AI manages group financials
- Company-level HR AI manages company hiring
- Department-level Project AI manages team projects
- Each has appropriate authority and escalation paths

---

## Multi-Company Scenarios

### Scenario 1: Centralized Governance

```
Group
├─ Company A (follows group standards)
├─ Company B (follows group standards)
└─ Company C (follows group standards)
    ↓
All companies follow same processes, policies, procedures
Use case: Subsidiaries of larger company
```

### Scenario 2: Federated Governance

```
Group
├─ Company A (owns its standards)
├─ Company B (owns its standards)
└─ Company C (owns its standards)
    ↓
Companies can differ in processes/procedures (but follow constitution)
Use case: Acquired companies, diverse portfolio
```

### Scenario 3: Mixed

```
Group
├─ Company A (follows group + own overrides)
├─ Company B (follows group + own overrides)
└─ Company C (follows group + own overrides)
    ↓
Shared where beneficial, different where needed
Use case: Most real organizations
```

---

## Practical Examples

### Example 1: Single Company, Simple Structure

```
Company: Acme Inc
├─ Department: Engineering
│  ├─ Team: Backend
│  │  ├─ Developer (person)
│  │  └─ Backend AI (agent)
│  └─ Team: Frontend
│      ├─ Developer (person)
│      └─ Frontend AI (agent)
└─ Department: Sales
   ├─ Sales Manager (person)
   └─ Sales AI (agent)
```

### Example 2: Multi-Company Group

```
Group: Tech Holdings
├─ Company: DataPro
│  ├─ Department: Engineering
│  └─ Department: Operations
├─ Company: CloudSoft
│  ├─ Department: Product
│  ├─ Department: Engineering
│  └─ Department: Sales
└─ Company: WebTools
    └─ Department: Services
```

### Example 3: Large Company with Business Units

```
Company: Global Manufacturing Corp
├─ Business Unit: North America
│  ├─ Department: Manufacturing
│  ├─ Department: Sales
│  └─ Department: Distribution
├─ Business Unit: Europe
│  ├─ Department: Manufacturing
│  ├─ Department: Sales
│  └─ Department: Distribution
└─ Corporate Functions
    ├─ Department: Finance
    ├─ Department: HR
    └─ Department: Technology
```

---

## Implementation in AI Office

### Structure Storage

Organizational structure is documented in:
- **Organisational Chart** - Visual hierarchy
- **Role Definitions** - Role descriptions and authority
- **Policy Documents** - Policies at each level
- **Dashboard Configuration** - Who sees what data
- **Automation Rules** - Authority for different automation
- **Integration Configuration** - Data access by level

### Default Behavior

```yaml
Hierarchy:
  Level: company
  Parent: group (if applicable)
  Children:
    - business_unit (optional)
    - department (required if used)
    - team (optional)
    - role (required)

Policies:
  Inherited_From: [platform, group, company, unit, department]
  Overridden_At: [current_level]
  Constraints: [immutable_constitutional_rules]
```

---

## Scaling Implications

### 10-50 People
- Single company
- 2-3 departments
- Maybe teams
- Simple hierarchy

### 50-500 People
- Single company or small group
- Multiple departments
- Teams within departments
- Business units for large departments

### 500-5,000 People
- Group with 2-10 companies
- Multiple BUs per company
- Multiple departments per BU
- Teams within departments

### 5,000+ People
- Large group
- Multiple independent companies
- Geographic or functional BUs
- Complex department structures
- Multiple teams per department

**Key insight**: Same hierarchy model works at all scales; just use different levels.

---

## Adding or Removing Hierarchy Levels

### Adding a Level

If your organization grows and needs new structure:
1. Define the new level (why is it needed?)
2. Update organizational chart
3. Assign ownership and authority
4. Update dashboards and reporting
5. Update automation and workflow rules
6. Document the new level
7. Update this document

### Removing a Level

If a level is no longer needed:
1. Redistribute roles to next higher level
2. Update organizational chart
3. Migrate documentation
4. Update automation and workflows
5. Update this document

---

## Key Principles for Hierarchy

1. **Flexibility** - Use what you need, skip what you don't
2. **Clarity** - Everyone knows their level and authority
3. **Inheritance** - Default policies inherited, exceptions documented
4. **Constraints** - Constitutional rules never override
5. **Scalability** - Same model works from 10 to 10,000 people
6. **Clarity** - Reporting lines are explicit and documented

---

**A flexible hierarchy that scales with the organization, with clear inheritance and immutable constitutional constraints, enables AI Office to support any organizational structure.**

