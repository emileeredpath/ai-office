# ADR-008: System-Domain Coexistence (Hybrid Model)

**Status**: Draft Complete  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: All teams, product, engineering  

---

## Decision

**Eight user-facing systems (SYSTEM 01-08) remain as organizational entry points. Nine logical domains define architectural ownership underneath. Systems and domains coexist in a hybrid model where domains own, systems present, and modules implement.**

This avoids disruption while improving architecture.

---

## Context

Current state: Eight systems define how users navigate and think about AI Office
- SYSTEM 01: Sandy (orchestration)
- SYSTEM 02: Company (strategy/structure)
- SYSTEM 03: Employees (people/talent)
- SYSTEM 04: Knowledge (learning/documentation)
- SYSTEM 05: Operations (processes/execution)
- SYSTEM 06: Dashboard (analytics/reporting)
- SYSTEM 07: Memory (lessons/institutional knowledge)
- SYSTEM 08: Automation (workflows/AI)

Target state: Nine domains define logical ownership and responsibility
- Governance, Organisation, People, Knowledge, Operations, Analytics, Automation, Platform, Experience

Question: How do these coexist? Do we replace systems with domains? Reorganize? Leave unchanged?

---

## Problem

Without clarity on systems vs. domains:
- Unclear who owns each piece of information
- Duplication across systems
- Information scattered across multiple entry points
- Hard to answer "who owns this?"
- Cannot enforce single source of truth
- Difficult for multi-company (which system owns what?)

---

## Options Considered

### Option 1: Replace Systems with Domains
- Eliminate SYSTEM 01-08
- Reorganize entirely as domain-based structure
- Users navigate by domain

**Pros**:
- Clear ownership
- No duplication
- Single organization method

**Cons**:
- Massive disruption
- Users confused
- Existing navigation breaks
- Retraining required
- Takes months to reorganize

### Option 2: Keep Systems, Ignore Domains
- Systems remain user-facing structure
- Domains added as documentation only
- No architectural change

**Pros**:
- No disruption
- Familiar to users

**Cons**:
- Ownership still unclear
- Duplication continues
- Doesn't solve architectural problems
- Doesn't scale to multi-company

### Option 3: Hybrid Model (Chosen)
- Domains define logical ownership and responsibility
- Systems remain user-facing entry points for navigation
- Modules implement domains underneath
- Gradual evolution without disruption

**Pros**:
- Clear ownership (domains)
- No user disruption (systems familiar)
- Scalable (domain-based implementation)
- Architectural improvement (clear boundaries)
- Supports multi-company (domains cross companies)

**Cons**:
- Mapping to maintain (systems to domains)
- More complex initially
- Eventual reorganization needed (not urgent)

---

## Decision Rationale

**Hybrid model chosen because**:

1. **Non-Disruptive** - Users see familiar systems, architecture improves underneath
2. **Scalable** - Domain model supports multi-company better than systems
3. **Clear Ownership** - Domains clarify who owns what
4. **Practical** - Can implement gradually
5. **User-Centric** - Systems are how users think about AI Office
6. **Architectural** - Domains are how systems should be organized
7. **Flexibility** - Can migrate to domain-only if/when needed

---

## How Hybrid Model Works

```
SYSTEMS (User-Facing Navigation)
├─ SYSTEM 01 - Sandy
├─ SYSTEM 02 - Company  
├─ SYSTEM 03 - Employees
├─ SYSTEM 04 - Knowledge
├─ SYSTEM 05 - Operations
├─ SYSTEM 06 - Dashboard
├─ SYSTEM 07 - Memory
└─ SYSTEM 08 - Automation

    ↓ INFORMS ↓

DOMAINS (Logical Architecture & Ownership)
├─ Governance (Constitution, authority, compliance)
├─ Organisation (strategy, structure, plans)
├─ People (talent, culture, development)
├─ Knowledge (processes, best practices, decisions, learning)
├─ Operations (execution, workflows, SLAs)
├─ Analytics (metrics, dashboards, intelligence)
├─ Automation (workflows, AI employees, integrations)
├─ Platform (infrastructure, APIs, data)
└─ Experience (UI, navigation, search)

    ↓ IMPLEMENT ↓

MODULES & CODE (Implementation Structure)
├─ Follow domain boundaries
├─ Implement system features
├─ Clear APIs between domains
├─ Single responsibility per domain
└─ Reusable across systems
```

---

## System-Domain Mapping

### SYSTEM 01 - Sandy
**Primary Domain**: Automation  
**Secondary Domains**: Operations, Governance, Analytics  

Sandy orchestrates work across domains. Primary responsibility is Automation (workflows, delegation), but it touches Operations (executes), Governance (respects constraints), and Analytics (reports results).

---

### SYSTEM 02 - Company
**Primary Domain**: Organisation  
**Secondary Domains**: Governance, People  

Company structure and strategy. Primary responsibility is Organisation (org structure, strategy, plans). Links to Governance (governance structure) and People (org roles).

---

### SYSTEM 03 - Employees
**Primary Domain**: People  
**Secondary Domains**: Knowledge, Operations  

Talent, culture, development. Primary responsibility is People. Links to Knowledge (documentation) and Operations (assignments).

---

### SYSTEM 04 - Knowledge
**Primary Domain**: Knowledge  
**Secondary Domains**: All others  

Authoritative understanding. Knowledge domain is central - all other domains feed into it and consume from it.

---

### SYSTEM 05 - Operations
**Primary Domain**: Operations  
**Secondary Domains**: Execution, Automation, Analytics  

Processes, workflows, SLAs. Primary responsibility is Operations (processes, execution). Links to Automation (workflow automation) and Analytics (measurement).

---

### SYSTEM 06 - Dashboard
**Primary Domain**: Analytics  
**Secondary Domains**: All others  

Reporting and intelligence. Analytics domain provides metrics and insights across all domains.

---

### SYSTEM 07 - Memory
**Primary Domain**: Knowledge  
**Secondary Domains**: Analytics  

Institutional memory and lessons learned. Primary responsibility is Knowledge (what we've learned). Links to Analytics (analyzing what we know).

---

### SYSTEM 08 - Automation
**Primary Domain**: Automation  
**Secondary Domains**: Operations, Execution, Platform  

Workflows, automations, AI employees. Primary responsibility is Automation (defining and managing automations). Links to Operations (automating operations) and Platform (execution).

---

## How Users Experience the Hybrid Model

### User Navigation (Uses Systems)
```
User opens AI Office
├─ "I want to see our organizational strategy"
│  └─ Click: SYSTEM 02 - Company
│
├─ "I want to see our processes"
│  └─ Click: SYSTEM 05 - Operations
│
├─ "I want to see metrics"
│  └─ Click: SYSTEM 06 - Dashboard
│
└─ Navigation is comfortable and familiar
```

### System Implementation (Uses Domains)
```
Engineer building SYSTEM 05 - Operations
├─ References Operations domain definition
├─ Coordinates with Automation domain (for workflow automation)
├─ Implements as operations module
├─ Provides API to Platform domain
└─ Reports metrics to Analytics domain
```

### Information Ownership (Uses Domains)
```
"Who owns process documentation?"
└─ Operations domain leader owns it

"Who owns customer knowledge?"
└─ Knowledge domain leader owns it

"Who owns workflow automation?"
└─ Automation domain leader owns it
```

---

## Gradual Evolution Path

### Phase 1: Systems + Domains (Now)
- Systems unchanged (navigation stays familiar)
- Domains defined (ownership clear)
- No code reorganization
- Mapping documented (systems to domains)

**User Impact**: None  
**Engineering Impact**: Reference domains in design

---

### Phase 2: Domain-Aware Modules (2027)
- Code organized by domain
- Modules implement across systems
- Systems become product layers (UI)
- Domain APIs defined

**User Impact**: None (same UI)  
**Engineering Impact**: Code organized by domain

---

### Phase 3: Domain-First Navigation (2028)
- Unified UI built (Experience domain)
- Can navigate by system (familiar) or domain (new)
- Both work, user chooses

**User Impact**: Optional domain navigation  
**Engineering Impact**: Domain structure mature

---

### Phase 4: Optional Domain-Only (Future)
- If useful, can transition to domain-only navigation
- Systems remain as organizational memory
- But domain navigation is primary

**User Impact**: Optional transition  
**Engineering Impact**: Full domain structure

---

## No Forced Reorganization

**Key Point**: Systems stay as-is. No reorganization mandated.

```
2026:  Systems unchanged
       SYSTEM 01-08 fully operational
       Domains defined as architecture

2027:  Systems still unchanged
       Code reorganized (internal)
       Users don't notice

2028:  Systems still accessible
       New domain navigation available
       Users choose which to use

2030+: Might transition to domain-only
       If organization votes to do so
       But not required
```

---

## Mapping and Maintenance

### System-Domain Map

```
System → Primary Domain → Secondary Domains

SYSTEM 01 Sandy
├─ Primary: Automation
└─ Secondary: Operations, Governance, Analytics

SYSTEM 02 Company
├─ Primary: Organisation
└─ Secondary: Governance, People

[etc.]
```

Maintained as documentation, updated quarterly.

### Cross-Domain Dependencies

```
When Automation domain changes workflow definitions:
├─ May affect Operations (uses workflows)
├─ May affect Experience (navigation shows workflows)
└─ May affect Platform (storage/APIs)

When Knowledge domain updates information structure:
├─ May affect all domains (they consume knowledge)
└─ May affect Experience (discovery, navigation)
```

Documented and reviewed regularly.

---

## Ownership Clarity

### For Each Piece of Information

Question: "Who owns this?"

**System-Only Answer** (ambiguous):
- "It's in SYSTEM 05"
- But which domain? Operations? Automation? Or both?

**Domain-Based Answer** (clear):
- "Operations domain owns processes"
- "Automation domain owns workflow definitions"
- Single owner, clear responsibility

**In Hybrid Model**:
- Systems show where it appears (navigation)
- Domains show who owns it (responsibility)

---

## Scaling to Multi-Company

Systems-only doesn't scale to multi-company:
- Which SYSTEM owns customer data? (CRM belongs in multiple systems)
- How do we consolidate SYSTEM 06 across companies?
- Who owns shared services?

Domains handle multi-company naturally:
- Knowledge domain owns customer knowledge (regardless of system)
- Analytics domain consolidates metrics (across companies)
- Governance domain enforces policies (across companies)

---

## Consequences

### Positive

✓ **Clear Ownership** - Domains clarify who owns what  
✓ **No Disruption** - Systems familiar to users  
✓ **Scalability** - Domain model scales to multi-company  
✓ **Architectural Improvement** - Better structure underneath  
✓ **Flexibility** - Can evolve gradually  
✓ **Practical** - Works immediately without reorganization  
✓ **Future-Proof** - Can transition to domain-only if desired  

### Negative

✗ **Mapping to Maintain** - System-domain mapping needs updating  
✗ **Potential Confusion** - Systems and domains both used  
✗ **Eventual Reorganization** - May want domain-only later  
✗ **Slightly More Complex** - Two organizational schemes  

### Risks

- **Hybrid Confusion** - People confused about systems vs. domains
- **Incomplete Transition** - Domains defined but code not organized by them
- **Duplicate Ownership** - System and domain both claim same information
- **Navigation Inconsistency** - Systems and domains diverge over time

---

## Mitigation Strategies

### To Prevent Confusion

1. **Clear Documentation** - Document system-domain mapping
2. **Training** - Explain hybrid model and why
3. **Visual Aids** - Show systems and domains together
4. **Simple Messaging** - "Systems are how you navigate, domains are who owns"

### To Prevent Incomplete Transition

1. **Clear Plan** - Document phased evolution
2. **Milestones** - Checkpoints at each phase
3. **Regular Review** - Quarterly check on progress
4. **Ownership** - Clear who's responsible for transition

### To Prevent Duplicate Ownership

1. **Domain Ownership Matrix** - Each domain has single owner
2. **System Ownership Matrix** - Each system has single owner
3. **Mapping Rules** - When system and domain overlap, domain wins
4. **Escalation** - Process for resolving ownership conflicts

### To Prevent Navigation Inconsistency

1. **Quarterly Reconciliation** - Verify systems and domains still align
2. **Change Control** - Any change to one must update the other
3. **Automated Checks** - Detect inconsistencies
4. **User Feedback** - Listen to navigation confusion

---

## Related Decisions

- [ADR-002: Nine-Domain Model](ADR-002%20Nine-Domain%20Model.md) - Nine domains defined
- [ADR-001: Documentation as Source of Truth](ADR-001%20Documentation%20as%20Source%20of%20Truth.md) - Domains document ownership
- [Document 02: Platform Overview](../02%20Platform%20Overview.md) - Shows system-domain relationship
- [Document 04: Domain Model](../04%20Domain%20Model.md) - Detailed domain definitions
- [Document 06: System Boundaries](../06%20System%20Boundaries.md) - Domain boundaries

---

## Questions & Clarifications

**Q: Do we keep systems or switch to domains?**  
A: Both. Systems are user-facing navigation (stay familiar). Domains are architectural structure (improve ownership). They coexist.

**Q: Will users be confused?**  
A: Initially yes. Training and clear messaging help. Most users will continue using systems (familiar). Advanced users can use domains.

**Q: When do we fully switch to domains?**  
A: Only if organization votes to do so. Not required. Hybrid model is sustainable long-term.

**Q: What if system and domain disagree about ownership?**  
A: Domain wins. System shows where information appears; domain clarifies who owns it.

**Q: How do we maintain the system-domain mapping?**  
A: Document as part of Architecture layer. Review quarterly. Update when changes happen.

---

## Implementation Approach

### Phase 1: Define & Document (Now)
- ✓ Define nine domains
- ✓ Document domain ownership
- ✓ Create system-domain mapping
- ✓ Update Architecture documents

**User Impact**: None  
**Engineering Impact**: Reference domains in design  

---

### Phase 2: Organize Code by Domain (2027)
- [ ] New code organized by domain
- [ ] Existing code refactored gradually
- [ ] Module APIs defined
- [ ] Tests organized by domain

**User Impact**: None (same UI)  
**Engineering Impact**: Code structure changes  

---

### Phase 3: Optional Domain Navigation (2028)
- [ ] Build domain-aware UI
- [ ] System navigation still available
- [ ] Users can choose preference
- [ ] Experience layer provides both

**User Impact**: New navigation option  
**Engineering Impact**: UI changes  

---

### Phase 4: Evaluate Future (2029+)
- [ ] Annual review: Is hybrid working?
- [ ] Consider domain-only transition
- [ ] But not required

**User Impact**: Optional  
**Engineering Impact**: Optional refactoring  

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: CEO (Conditional on final Blueprint)  
- **Date Approved**: 2026-07-17  

**Systems remain user-facing entry points. Domains define architectural ownership. Hybrid model avoids disruption while improving structure. Systems and domains coexist and evolve together.**
