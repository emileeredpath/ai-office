# ADR-004: Multi-Company Hierarchy and Configuration Inheritance

**Status**: Draft Complete  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: Executive Leadership, Multi-company organizations  

---

## Decision

**AI Office supports flexible multi-company organizational hierarchy with optional levels (Group → Company → BU → Department → Team → Role), inheritance-based configuration with override capability, and immutable Constitutional constraints that apply everywhere.**

Company is the required operating entity. Other levels are optional. Configuration cascades down with controlled override. Constitutional rules cannot be overridden.

---

## Context

Single-company instances serve today. Future scenarios require:
- Multiple independent operating companies
- Holding company with subsidiaries
- Business units with regional variation
- Shared services (finance, legal, HR)
- Consolidated reporting

Existing architecture is single-company. Must extend without losing clarity, creating complexity, or compromising governance.

---

## Problem

Without multi-company architecture:
- Cannot support subsidiaries or franchises
- Cannot consolidate data from multiple companies
- Cannot have company-specific overrides
- Cannot enforce group policies
- Cannot have company-specific AI employees
- Hard to scale beyond single operating entity

---

## Options Considered

### Option 1: Single Company Only
- Serve only single-company scenarios
- Simple data model
- Limited market

**Pros**:
- Simplest architecture

**Cons**:
- Huge market missed
- Doesn't scale
- No parent-subsidiary support

### Option 2: Flat Multi-Company (All Equal)
- Multiple independent companies at same level
- No parent company
- No shared services

**Pros**:
- Supports multiple companies
- Simple hierarchy

**Cons**:
- Cannot support holding company
- Cannot have shared services
- Cannot consolidate reporting

### Option 3: Rigid Hierarchy (Chosen with Flexibility)
- Fixed hierarchy: Group → Company → BU → Department → Team → Role
- All levels required
- Strict inheritance

**Pros**:
- Supports all scenarios
- Clear structure

**Cons**:
- Overly complex for simple cases
- Forces all organizations into same shape
- Inflexible

### Option 4: Flexible Hierarchy (Chosen)
- Optional levels (Group, BU, Team optional; Company, Department, Role required)
- Inheritance with override
- Constitutional constraints immutable

**Pros**:
- Supports all scenarios
- Simple for simple cases
- Complex for complex cases
- Flexible and scalable
- Immutable governance preserved

**Cons**:
- More complex to implement
- Requires discipline to use correctly

---

## Decision Rationale

**Flexible hierarchy chosen because**:

1. **Flexibility** - Supports single company to global corporations
2. **Simplicity for Simple Cases** - Startup doesn't need Group/BU
3. **Power for Complex Cases** - Enterprise can use all levels
4. **Governance Preservation** - Constitutional rules always apply
5. **Scalability** - Same architecture for all company sizes
6. **Configuration Management** - Inheritance prevents duplication
7. **Company Autonomy** - Companies can customize within bounds

---

## Organizational Hierarchy

```
Optional: HOLDING COMPANY (Group)
├─ Sets group-wide policies
├─ Operates shared services
└─ Consolidates reporting

COMPANY (Operating entity)
├─ Required
├─ Primary isolation boundary
├─ Has its own Constitution interpretation
├─ Can be subsidiary of Group or standalone
│
└─ Optional: BUSINESS UNIT (Functional area)
   ├─ Optional (can skip)
   ├─ Regional or functional grouping
   │
   └─ DEPARTMENT (Operational unit)
      ├─ Required
      ├─ Functional responsibility
      │
      └─ Optional: TEAM (Work group)
         └─ Sub-group of department

Finally: ROLE (Individual contributor or AI employee)
├─ Required
├─ Assigned to person or AI
└─ Inherits from all levels above
```

### Minimalist Structure (Startup)
```
Company
└─ Department
   └─ Role
```

### Standard Structure (Mid-size)
```
Company
├─ Department
│  └─ Team
│     └─ Role
└─ Department
   └─ Team
      └─ Role
```

### Complex Structure (Enterprise)
```
Holding Company
├─ Shared Finance
├─ Company A
│  ├─ Business Unit
│  │  └─ Department
│  │     └─ Team
│  │        └─ Role
│  └─ Department
│     └─ Role
└─ Company B
   └─ Department
      └─ Role
```

---

## Configuration Inheritance

Configuration cascades from high to low level with override capability:

```
CONSTITUTION (Immutable everywhere)
    ↓ (All must comply, cannot override)
PLATFORM DEFAULT
    ↓ (Can override if allowed)
GROUP STANDARD
    ↓ (Can override if allowed)
COMPANY OVERRIDE
    ↓ (Can override if allowed)
BUSINESS UNIT OVERRIDE
    ↓ (Can override if allowed)
DEPARTMENT OVERRIDE
    ↓ (Can override if allowed)
WORKFLOW SPECIFIC
    └─ (Individual workflow settings)
```

### Example 1: Approval Authority

```
Platform Default: "Manager can approve hiring up to $100k"
Group Standard: "Group policy: $80k"
Company A: (follows group default)
Company B: "$200k authorized for specialized hiring"
Dept (Engineering): "$200k" (overrides Company B for specialized roles)
Dept (Support): "$50k" (more conservative)
Workflow (Director hire): "CEO approval required"

Result: Each level can customize while inheriting sensible defaults
```

### Example 2: Process Approval

```
Platform Default: "Approval by Manager"
Group Standard: "Approval by Manager + Department Head"
Company A: (follows group)
Company B: "Approval by Manager only (faster decisions)"
Dept (Finance): "Approval by Manager + Finance Head (tighter control)"
Workflow (high-value transaction): "CFO approval required"

Result: Flexibility while maintaining governance
```

---

## Immutable Constraints

**RULE**: Constitutional constraints apply everywhere and cannot be overridden.

```
Constitutional Rules (Apply Everywhere)
├─ "All data access is logged" - Cannot override
├─ "Financial decisions >$1M audited" - Cannot override
├─ "Human authority in hiring" - Cannot override
├─ "Ethical standards enforced" - Cannot override
└─ "Legal compliance required" - Cannot override

Policy Rules (Can Override Within Bounds)
├─ Approval authority levels
├─ Process procedures
├─ Technology choices
└─ Resource allocation
```

**Example of Violation**:
- Team says "Skip this approval for urgent decision"
- Constitution requires approval for this type of decision
- **Result**: VIOLATION - Cannot skip Constitutional requirement
- **Fix**: Either approve (follow Constitution) or amend Constitution

---

## Data Isolation

By default, data is company-scoped:

```
Company A Data
├─ Customers (A's customers only)
├─ Financial (A's finances only)
├─ Employees (A's employees only)
└─ Operations (A's operations only)

Company B Data
├─ Customers (B's customers only)
├─ Financial (B's finances only)
├─ Employees (B's employees only)
└─ Operations (B's operations only)

Shared (Group Level)
├─ Corporate policies
├─ Legal standards
├─ Compliance framework
└─ Consolidated reporting
```

**Access Rule**: Users see their company data by default. Access to other companies requires explicit authorization.

---

## Shared Services

For holding company with shared services:

```
Central Finance Service
├─ Owned by: Group CFO
├─ Serves: All companies
├─ Data: Consolidated financial data + company-specific data
├─ Access: Finance roles can see all companies
└─ Authority: Sets financial standards (Constitution-level for finance)
```

**Pattern**: 
- Shared service sets standards (like Constitution)
- Companies adapt standards within their operations
- Service provides oversight and consolidated reporting

---

## AI Employees Across Companies

### Company-Specific AIs
```
Company A
├─ Finance AI (Company A invoices)
├─ Sales AI (Company A leads)
└─ Operations AI (Company A workflows)
```

### Shared AIs
```
Compliance AI (all companies)
├─ Company A: Compliance checking
├─ Company B: Compliance checking
└─ Contract: Cannot leak company-specific data
```

---

## Governance Across Companies

### Option 1: Centralized (Holding Company Leads)
```
Group CFO
├─ Sets financial policy for all companies
├─ Reviews compliance
├─ Can override if needed

Company A CFO (executes within policy)
├─ Local financial management
├─ Reports to Group CFO

Company B CFO (executes within policy)
├─ Local financial management
├─ Reports to Group CFO
```

### Option 2: Decentralized (Companies Autonomous)
```
Company A CFO
├─ Sets own policy (within Constitutional bounds)
├─ Local autonomy

Company B CFO
├─ Sets own policy (within Constitutional bounds)
├─ Local autonomy

Group Finance Officer (oversight only)
├─ Consolidated reporting
├─ Escalation if compliance issues
```

### Option 3: Hybrid (Recommended)
```
Group Finance Officer
├─ Critical policies (auditing, compliance)
├─ Consolidated reporting
├─ Oversight

Company A CFO
├─ Operational decisions
├─ Local procedures
├─ Report to Group

Company B CFO
├─ Operational decisions
├─ Local procedures
├─ Report to Group
```

---

## Consequences

### Positive

✓ **Flexible** - Supports all organizational shapes  
✓ **Scalable** - From startup to enterprise  
✓ **Simple for Simple Cases** - Skip optional levels  
✓ **Powerful for Complex Cases** - Use all levels  
✓ **Governance Preserved** - Constitution always applies  
✓ **Company Autonomy** - Companies customize within bounds  
✓ **Consolidated Reporting** - Parent can see all companies  
✓ **Configuration Reuse** - Inheritance prevents duplication  

### Negative

✗ **Complexity** - More to understand and maintain  
✗ **Configuration Discipline** - Must use inheritance correctly  
✗ **Potential Confusion** - Which level owns which decision?  

### Risks

- **Over-Configuration** - Too many override levels, confusing
- **Inheritance Breaks** - Companies don't inherit correctly
- **Constitutional Violation** - Companies try to override immutable rules
- **Data Isolation Fails** - Companies see each other's data by mistake

---

## Mitigation Strategies

### To Prevent Confusion

1. **Clear Documentation** - Show examples of structures
2. **Configuration Templates** - Pre-built for common shapes
3. **Training** - All teams understand multi-company architecture
4. **Support Team** - Help resolve configuration questions

### To Prevent Inheritance Breaks

1. **Automated Checks** - Validate inheritance chain
2. **Configuration Tests** - Verify each level correctly inherits
3. **Documentation** - Show inheritance path for each setting
4. **Quarterly Audits** - Review for breaks

### To Prevent Constitutional Violation

1. **Validation** - System prevents overriding Constitutional rules
2. **Clear Marking** - Constitutional rules clearly marked
3. **Training** - Teams understand what can't be overridden
4. **Escalation** - If rule truly problematic, escalate to amendment

### To Prevent Data Isolation Failure

1. **Database Design** - company_id on all tables, filters on queries
2. **Access Control** - Role-based, company-scoped
3. **Testing** - Verify data isolation
4. **Audit Logging** - Log all cross-company access

---

## Related Decisions

- [ADR-002: Nine-Domain Model](ADR-002%20Nine-Domain%20Model.md) - Domains are company-independent
- [ADR-003: Four-Layer Architecture](ADR-003%20Four-Layer%20Architecture.md) - Layers apply per-company
- [ADR-006: Configuration Inheritance](ADR-006%20Configuration%20and%20Inheritance.md) - Detailed inheritance rules
- [ADR-007: Constitution Immutability](ADR-007%20Constitution%20Immutability.md) - Constitution applies everywhere
- [Document 05: Organisational Hierarchy](../05%20Organisational%20Hierarchy.md) - Detailed hierarchy specs
- [Document 22: Multi-Company Architecture](../22%20Multi-Company%20Architecture.md) - Implementation details

---

## Questions & Clarifications

**Q: Do we have to use Group level?**  
A: No, Group is optional. Single company or flat structure both work without Group.

**Q: Can we skip Business Unit?**  
A: Yes, BU is optional. Go directly from Company to Department.

**Q: What if Company B needs completely different policies?**  
A: They can override Platform Defaults and Group Standards within Constitutional bounds.

**Q: How do we ensure Constitutional rules apply everywhere?**  
A: System validates that Constitutional rules are not overridden. Escalate if needed.

**Q: Can we migrate from single to multi-company later?**  
A: Yes, architecture supports it. Add Group level and new Companies as needed.

---

## Implementation Approach

### Phase 1: Foundation (Now)
- ✓ Document multi-company architecture
- ✓ Define optional levels
- ✓ Show example structures

### Phase 2: Single Company (Q2 2026)
- [ ] Validate first company fits architecture
- [ ] Test inheritance chain
- [ ] Implement data isolation

### Phase 3: Multi-Company Ready (Q3 2026)
- [ ] Create templates for common structures
- [ ] Build configuration inheritance system
- [ ] Test data isolation between companies

### Phase 4: Deploy Second Company (Q4 2026)
- [ ] Deploy second company (pilot)
- [ ] Verify isolation and inheritance
- [ ] Refine processes based on learning

### Phase 5: Scale (2027+)
- [ ] Deploy additional companies
- [ ] Build consolidated reporting
- [ ] Expand shared services as needed

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: CEO (Conditional on final Blueprint)  
- **Date Approved**: 2026-07-17  

**Flexible multi-company hierarchy supports organizations from startup to global enterprise while preserving Constitutional governance and data isolation.**
