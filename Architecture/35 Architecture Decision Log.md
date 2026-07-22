# Architecture Decision Log: Index of All Architectural Decisions

This document indexes all Architectural Decision Records (ADRs) that govern AI Office. Each decision represents a deliberate choice that shapes the platform.

---

## What is an ADR?

An Architectural Decision Record documents:
- **What decision** was made
- **Why it was chosen** (rationale)
- **What alternatives** were considered
- **What consequences** flow from the decision
- **Who made it** and when

ADRs create organizational memory of why the architecture is the way it is.

---

## ADR Index

### ADR-001: Documentation as Source of Truth

**Status**: Approved  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Related**: Fundamental to all other decisions

**Decision**: AI Office documentation is the authoritative representation of how the organization operates. Systems implement documented policy, not reverse.

**Key Points**:
- Documentation first (before code)
- Systems implement documented decisions
- Changes flow documentation → systems
- AI Office as digital operating system

**Link**: [ADR-001 Documentation as Source of Truth](Decisions/ADR-001%20Documentation%20as%20Source%20of%20Truth.md)

---

### ADR-002: Nine-Domain Model

**Status**: Approved (Conditional)  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Related**: ADR-001 (documentation), enables multi-company (future ADR)

**Decision**: AI Office organizes information into nine logical domains (Governance, Organisation, People, Knowledge, Operations, Analytics, Automation, Platform, Experience). This hybrid model coexists with eight user-facing systems.

**Key Points**:
- Domains define logical ownership
- Systems remain user-facing navigation
- Clear boundaries enable independent evolution
- Supports multi-company structure

**Link**: [ADR-002 Nine-Domain Model](Decisions/ADR-002%20Nine-Domain%20Model.md)

---

### ADR-003: Four-Layer Architecture

**Status**: Approved (Conditional)  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Related**: ADR-002 (domains), ADR-001 (documentation)

**Decision**: AI Office operates in four layers: Governance (principles, authority), Knowledge (documented understanding), Execution (Sandy, AI, automation), and Experience (UI, dashboards).

**Key Points**:
- Governance is immutable foundation
- Information flows bottom-up
- Authority flows top-down
- Each layer can evolve independently

**Status**: [To be created in Phase 2]

---

### ADR-004: Multi-Company Hierarchy

**Status**: Pending Approval  
**Date**: TBD  
**Deciders**: Executive Leadership  
**Related**: ADR-002 (domains), enables future scaling

**Decision**: AI Office supports flexible multi-company structure with optional hierarchy levels (Group → Company → BU → Department → Team → Role).

**Key Points**:
- Company is required, others optional
- Inheritance chain with override capability
- Constitutional constraints immutable
- Data isolation by company

**Status**: [To be created in Phase 2]

---

### ADR-005: AI Role and Authority Contracts

**Status**: Pending Approval  
**Date**: TBD  
**Deciders**: Executive Leadership  
**Related**: ADR-007 (constitution), ADR-013 (authority)

**Decision**: Every AI employee has explicit contract defining scope, authority, escalation paths, and performance metrics. Contracts are distinct from runtime configuration and human employment docs.

**Key Points**:
- AI authority is delegated and bounded
- Contracts are living documents
- Escalation to humans on uncertainty
- Regular performance reviews

**Status**: [To be created in Phase 2]

---

### ADR-006: Configuration Inheritance Model

**Status**: Pending Approval  
**Date**: TBD  
**Deciders**: Executive Leadership  
**Related**: ADR-004 (hierarchy), ADR-007 (constitution)

**Decision**: Configuration flows from Constitution through Platform Default, Group Standard, Company Override, Business Unit Override, Department Override to Workflow Specific settings. Constitutional constraints cannot be overridden.

**Key Points**:
- Settings cascade with controlled override
- Constitution is immutable layer
- Each level documents its decisions
- Quarterly review ensures compliance

**Status**: [To be created in Phase 2]

---

### ADR-007: Constitution Immutability

**Status**: Approved  
**Date**: 2026-07-17  
**Deciders**: Executive Leadership  
**Related**: Foundational to governance

**Decision**: SYSTEM 00 Constitution is immutable and serves as the foundation for all other systems. Constitutional changes require explicit executive decision and formal amendment process.

**Key Points**:
- Constitution defines non-negotiable principles
- Sets constraints all systems must follow
- Cannot be overridden by policies
- Amendment is the only way to change

**Link**: [ADR-007 Constitution Immutability](Decisions/ADR-007%20Constitution%20Immutability.md)

---

### ADR-008: System-Domain Coexistence

**Status**: Pending Approval  
**Date**: TBD  
**Deciders**: Architecture Team  
**Related**: ADR-002 (domains), ADR-001 (documentation)

**Decision**: Eight systems remain as user-facing organizational areas. Nine domains define logical architecture underneath. Systems and domains coexist in hybrid model.

**Key Points**:
- Systems: SYSTEM 01-08 user-facing entry points
- Domains: Logical ownership and responsibility
- Modules: Code follows domain boundaries
- Gradual evolution without disruption

**Status**: [To be created in Phase 2]

---

## ADR Status Summary

```
Status Breakdown:

APPROVED (3)
├─ ADR-001: Documentation as Source of Truth ✓
├─ ADR-002: Nine-Domain Model ✓
└─ ADR-007: Constitution Immutability ✓

PENDING APPROVAL (5)
├─ ADR-003: Four-Layer Architecture ⏳
├─ ADR-004: Multi-Company Hierarchy ⏳
├─ ADR-005: AI Role and Authority Contracts ⏳
├─ ADR-006: Configuration Inheritance Model ⏳
└─ ADR-008: System-Domain Coexistence ⏳

IN DEVELOPMENT (0)
└─ [None]
```

---

## ADR Template

When creating new ADRs, use this template:

```markdown
# ADR-### [Decision Title]

**Status**: [Proposed/Approved/Rejected/Superseded]  
**Date**: [YYYY-MM-DD]  
**Deciders**: [Roles/Names]  
**Stakeholders**: [Affected parties]

---

## Decision

[Brief statement of what was decided]

---

## Context

[Why this decision needed to be made; what problem are we solving?]

---

## Problem

[Detailed description of the problem]

---

## Options Considered

### Option 1: [Alternative]
**Pros**: [Benefits]  
**Cons**: [Drawbacks]

### Option 2: [Alternative]
**Pros**: [Benefits]  
**Cons**: [Drawbacks]

### Option 3: [Chosen Option]
**Pros**: [Benefits]  
**Cons**: [Drawbacks]

---

## Decision Rationale

[Why we chose Option 3]

---

## Consequences

### Positive
[Good outcomes]

### Negative
[Drawbacks or costs]

### Risks
[Potential problems]

---

## Mitigation Strategies

[How we'll address risks]

---

## Related Decisions

[Link to related ADRs]

---

## Questions & Clarifications

[Q&A to address common questions]

---

## Approval

- **Proposed By**: [Name/Role]
- **Approved By**: [Name/Role]
- **Date Approved**: [Date]

[Final statement of the decision]
```

---

## ADR Governance

### When to Create an ADR

Create an ADR when:
- ✅ Decision affects multiple systems
- ✅ Decision is hard to reverse
- ✅ Decision has long-term consequences
- ✅ Decision involves tradeoffs
- ✅ Decision needs to be remembered/justified

Don't create an ADR for:
- ❌ Routine operational decisions
- ❌ Temporary solutions
- ❌ Small feature choices
- ❌ Process adjustments

---

### ADR Lifecycle

```
PROPOSED
  ↓ (team discussion)
UNDER REVIEW
  ↓ (stakeholder feedback)
APPROVED
  ↓ (implemented)
IMPLEMENTED
  ↓ (optional - may be superseded)
SUPERSEDED
  └─ (keep for historical reference)
```

---

### ADR Review Process

**Steps**:
1. **Proposal**: Decision proposed with rationale
2. **Discussion**: Team discusses alternatives and implications
3. **Feedback**: Stakeholders provide input
4. **Decision**: Authority makes final decision
5. **Documentation**: Record decision in ADR
6. **Implementation**: Put decision into practice
7. **Review**: Periodic review of decision effectiveness

**Timeline**: 2-4 weeks from proposal to approval

---

## Searching ADRs

### By Topic

**Architecture & Design**:
- ADR-001: Documentation
- ADR-002: Nine-Domain Model
- ADR-003: Four-Layer Architecture
- ADR-008: System-Domain Coexistence

**Governance & Authority**:
- ADR-005: AI Contracts
- ADR-006: Configuration Inheritance
- ADR-007: Constitution Immutability

**Organization**:
- ADR-004: Multi-Company Hierarchy

---

### By Decision Type

**Architectural** (affects overall structure):
- ADR-002, ADR-003, ADR-004, ADR-008

**Governance** (affects authority and policy):
- ADR-005, ADR-006, ADR-007

**Operational** (affects how we work):
- ADR-001

---

## ADR Statistics

```
Total ADRs: 8
├─ Approved: 3 (37.5%)
├─ Pending: 5 (62.5%)
└─ Rejected: 0

By Category:
├─ Architecture: 5 (62.5%)
├─ Governance: 3 (37.5%)
└─ Operational: 0 (0%)

By Year:
├─ 2026: 8 (100%)
└─ 2027+: TBD
```

---

## ADR Cross-Reference

```
ADR Dependency Graph:

ADR-001 (Documentation)
  ├─ ADR-002 (Domains)
  │  ├─ ADR-004 (Multi-Company)
  │  └─ ADR-008 (System-Domain)
  │
  └─ ADR-003 (Four-Layer)
     ├─ ADR-005 (AI Contracts)
     └─ ADR-006 (Configuration)

ADR-007 (Constitution)
  ├─ ADR-005 (AI Contracts)
  └─ ADR-006 (Configuration)
```

---

## Key Principle

**Architectural decisions are documented and justified. This creates organizational memory and enables intentional evolution.**

When ADRs are well-maintained:
- Decisions are recorded and remembered
- New team members understand why
- Tradeoffs are explicit
- Changes are intentional
- Learning is captured

---

## Next Steps

**Phase 2 (Months 2-4)**:
- [ ] Finalize ADR-003 (Four-Layer)
- [ ] Finalize ADR-004 (Multi-Company)
- [ ] Finalize ADR-005 (AI Contracts)
- [ ] Finalize ADR-006 (Configuration)
- [ ] Finalize ADR-008 (System-Domain)

**Phase 3+ (Months 4+)**:
- [ ] Create ADRs for new major decisions
- [ ] Review existing ADRs quarterly
- [ ] Update ADRs if decision changes
- [ ] Archive superseded ADRs

---

**Architectural decisions are recorded, justified, and remembered as organizational memory.**
