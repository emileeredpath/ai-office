# ADR-002: Nine-Domain Model for Information Architecture

**Status**: Accepted  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: All domains, executive leadership  

---

## Decision

**AI Office information is organized into nine logical domains, each with clear ownership and boundaries. This replaces a pure system-based model with a domain-driven architecture.**

Nine domains:
1. Governance (rules)
2. Organisation (structure/strategy)
3. People (talent/culture)
4. Knowledge (reference/learning)
5. Operations (execution)
6. Analytics (metrics/intelligence)
7. Automation (workflows/AI)
8. Platform (infrastructure)
9. Experience (user interface)

---

## Context

Previous model organized information into eight systems (SYSTEM 01-08), which aligned with user-facing organizational areas (Sandy, Company, Employees, Knowledge, Operations, Dashboard, Memory, Automation).

This works well for navigation and understanding, but creates ambiguity about information ownership and creates potential for duplication.

For example, where does "customer knowledge" live? Multiple systems could claim it.

---

## Problem

The eight-system model:
- Doesn't clarify ownership
- Creates potential duplication
- Doesn't align with domain-driven design
- Makes it hard to answer "who owns this?"
- Doesn't scale well to multi-company operations

---

## Options Considered

### Option 1: Pure Domains (Chosen - Hybrid)
- Organize all information by domain
- Domains have clear ownership
- Replace systems with domains
- Reorganize all documentation

**Pros**:
- Clear ownership
- No duplication
- Scalable to enterprise

**Cons**:
- Major reorganization
- Breaks existing navigation
- User confusion during transition

### Option 2: Keep Systems As-Is
- Continue using eight systems
- Document ownership informally
- Accept some duplication

**Pros**:
- No disruption
- Navigation familiar

**Cons**:
- Ownership unclear
- Duplication continues
- Doesn't scale

### Option 3: Hybrid Model (Chosen)
- Nine domains define logical ownership
- Eight systems remain as user-facing entry points
- Data structures follow domains internally
- Gradual evolution

**Pros**:
- Clear ownership
- No disruption to navigation
- Supports multi-company
- Allows gradual migration

**Cons**:
- Requires mapping between models
- More complex initially
- Eventual cleanup needed

---

## Decision Rationale

**Hybrid Model chosen because**:

1. **Clarity Without Disruption** - Domains clarify ownership without reorganizing systems
2. **Gradual Evolution** - Can migrate over time as code is written
3. **Practical** - Serves users (systems) while improving architecture (domains)
4. **Scalable** - Supports multi-company operations
5. **Best of Both Worlds** - User familiarity + architectural clarity

---

## How Hybrid Works

```
DOMAINS (Logical Architecture)
├─ Define who owns information
├─ Define responsibility boundaries
├─ Govern data structures
└─ Enable independent evolution

    ↓ INFORM ↓

SYSTEMS (User-Facing Organization)
├─ Sandy (orchestration)
├─ Company (strategy)
├─ Employees (people)
├─ Knowledge (learning)
├─ Operations (execution)
├─ Dashboard (visibility)
├─ Memory (retention)
└─ Automation (efficiency)

    ↓ IMPLEMENT ↓

MODULES (Code/Database)
├─ Follow domain boundaries
├─ Implement system features
├─ Single responsibility per domain
└─ Clear APIs between domains
```

**In Practice**:
- Users navigate by systems (familiar)
- Architecture defined by domains (clear)
- Code organized by domains + systems (clean)

---

## Domain and System Mapping

| Domain | Primary System | Secondary Systems |
|--------|----------------|-------------------|
| Governance | (New - Constitution) | All systems comply |
| Organisation | Company | All systems support |
| People | Employees | All systems hire/develop |
| Knowledge | Knowledge | All systems document |
| Operations | Operations | Sandy, Automation |
| Analytics | Dashboard | All systems provide data |
| Automation | Automation | Sandy, Operations |
| Platform | (Infrastructure) | All systems run on |
| Experience | (Future - UI) | All systems provide content |

---

## Consequences

### Positive

✓ **Clear Ownership** - Every piece of information has owner
✓ **No Duplication** - Single source of truth
✓ **Scalable** - Supports multi-company
✓ **Independent Evolution** - Domains improve independently
✓ **Multi-layer Clarity** - Systems (navigation) + Domains (architecture)
✓ **Enterprise Ready** - Supports large organization needs

### Negative

✗ **Complexity** - Mapping between domains and systems
✗ **Migration Work** - Eventually reorganize code
✗ **Training** - Need to teach domain model
✗ **Transition Overhead** - Gradual change takes time

### Risks

- **System-Domain Confusion** - People unsure which is which
- **Incomplete Migration** - System and domain mismatch causes problems
- **Over-Engineering** - Domains not necessary for current size

---

## Mitigation Strategies

### To Prevent Confusion

1. **Document the Mapping** - Show how systems map to domains
2. **Use Both Terms** - "Operations (domain) in SYSTEM 05 (system)"
3. **Train Stakeholders** - Explain when to use which model
4. **Clear Diagrams** - Visual representation of mapping

### To Enable Migration

1. **Gradual Approach** - Migrate as code is written
2. **Domain Modules** - Build code in domain structure
3. **System Facades** - Keep system interfaces in place
4. **Backwards Compatibility** - Don't break navigation

### To Keep Manageable

1. **Start Small** - Master domains for critical areas first
2. **Automate Checks** - Detect cross-domain dependencies
3. **Regular Review** - Quarterly assessment of mapping
4. **Clear Standards** - Define what belongs where

---

## Implementation Approach

### Phase 1: Documentation (Now)
- ✓ Define nine domains
- ✓ Document ownership for each
- ✓ Create domain architecture documents
- ✓ Map systems to domains

### Phase 2: Code Organization
- [ ] Organize code by domain
- [ ] Define domain APIs
- [ ] Build domain modules
- [ ] Test independence

### Phase 3: Database Schema
- [ ] Organize tables by domain
- [ ] Define foreign key patterns
- [ ] Ensure single ownership
- [ ] Test data isolation

### Phase 4: Migration (Future)
- [ ] Consider system reorganization
- [ ] Evaluate need vs. benefit
- [ ] Plan gradual transition
- [ ] Minimize disruption

---

## Related Decisions

- [ADR-001: Documentation as Source of Truth](ADR-001%20Documentation%20as%20Source%20of%20Truth.md) - Domains clarify what to document
- [ADR-004: Multi-Company Inheritance](ADR-004%20Multi-Company%20Inheritance.md) - Domains enable multi-company
- [Document 04: Domain Model](../04%20Domain%20Model.md) - Detailed domain definitions
- [Document 06: System Boundaries](../06%20System%20Boundaries.md) - Domain boundaries

---

## Questions & Clarifications

**Q: Which comes first - domains or systems?**  
A: Systems provide user-facing navigation; domains provide architectural clarity. Both coexist.

**Q: Do we rename SYSTEM 01-08 to domain names?**  
A: No. Systems stay as-is for navigation. Domains are logical organization underneath.

**Q: What if a system maps to multiple domains?**  
A: That's okay. Example: SYSTEM 01 Sandy involves Automation, Execution, and Governance domains.

**Q: When do we reorganize folders?**  
A: Only when code is rewritten. Don't reorganize for conceptual neatness alone.

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: Executive Leadership (Conditional)  
- **Date Approved**: 2026-07-17  

Approval conditional on final Blueprint demonstrating how domains clarify architecture without disrupting navigation.

---

**Nine logical domains enable clear ownership and scalability while preserving familiar system-based navigation.**

