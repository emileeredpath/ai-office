# ADR-003: Four-Layer Architecture

**Status**: Draft Complete  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: Executive Leadership, All domains  

---

## Decision

**AI Office operates as a four-layer system: Governance Layer (immutable principles), Knowledge Layer (documented understanding), Execution Layer (operational systems and AI), and Experience Layer (user interfaces).**

Each layer has distinct responsibilities, can evolve independently, and passes information up and authority down.

---

## Context

AI Office must organize information and systems so that:
- Constitutional principles govern everything
- Documentation is authoritative and accessible
- Operations are automated and observable
- Users have excellent experience

A flat or single-layer architecture would not provide sufficient structure. Multiple isolated systems would lack coherence. A four-layer model balances clarity with flexibility.

---

## Problem

Without clear layering:
- Where does governance live vs. operations?
- How does information flow between systems?
- What happens when layers conflict?
- Can each layer evolve independently?
- How do we know what's fundamental vs. changeable?

---

## Options Considered

### Option 1: Flat Structure (No Layers)
- All information at same level
- Systems reference each other directly
- No clear hierarchy

**Pros**:
- Simpler conceptually
- Fewer abstractions

**Cons**:
- No clear authority structure
- Circular dependencies likely
- Governance not clearly separated
- Impossible to ensure Constitution applies
- No independent evolution

### Option 2: Strict Layering (Chosen)
- Four distinct layers
- Clear information and authority flow
- Each layer can evolve independently
- Constitution at top, operations at bottom

**Pros**:
- Clear structure
- Governance explicitly separated
- Independent evolution possible
- Authority clear
- Information flow predictable
- Extensible

**Cons**:
- More complex to understand initially
- Requires discipline to maintain
- Some cross-layer communication needed

---

## Decision Rationale

**Four-layer architecture chosen because**:

1. **Governance Separation** - Constitution and principles must be clearly distinguished from operations
2. **Information Flow** - Clear how information moves from operations to intelligence to decisions
3. **Authority Flow** - Clear how authority flows from Constitution through delegation to execution
4. **Independent Evolution** - Each layer can improve without disrupting others
5. **Multi-Company Support** - Hierarchy naturally supports multi-level organizations
6. **Sustainability** - Supports 10-year evolution without redesign

---

## Four Layers in Detail

### Layer 1: Governance Layer (Foundation)

**Purpose**: Immutable principles and authority structure

**Contains**:
- Constitution (non-negotiable principles)
- Authority hierarchy
- Ethical guidelines
- Legal compliance requirements
- Governance framework

**Characteristics**:
- Immutable (changes only through amendment)
- Applies to everything below
- Defines constraints all systems must follow
- Cannot be overridden

**Owner**: Managing Director with Board (if exists)

**Change Process**: Constitutional amendment (formal, deliberate)

---

### Layer 2: Knowledge Layer (Source of Truth)

**Purpose**: Organized, documented understanding

**Contains**:
- Business knowledge (what we know about customers, markets, ourselves)
- Processes (how we do things)
- Decisions (why we decided things)
- Best practices
- Lessons learned
- Institutional memory

**Characteristics**:
- Authoritative within AI Office
- Derived from Systems of Record and experience
- Single source of truth (not duplicating external systems)
- Organized by domain
- Continuously updated

**Owner**: Domain owners (COO, CFO, CHRO, etc.)

**Change Process**: Domain owner approval, documentation update

---

### Layer 3: Execution Layer (Operations)

**Purpose**: Operational systems and work execution

**Contains**:
- Sandy (orchestration)
- AI employees (specialists)
- Workflows (automated processes)
- Work systems (tasks, approvals, execution)
- Integrations (with external systems)

**Characteristics**:
- Real-time execution
- Informed by Knowledge layer
- Reports back to Intelligence
- Constrained by Governance layer
- Automated where possible

**Owner**: Chief Operating Officer

**Change Process**: Operations team decides within authority

---

### Layer 4: Experience Layer (Interface)

**Purpose**: User access to information and decisions

**Contains**:
- User interface (dashboards, screens)
- Navigation (how to find things)
- Reporting (how to see what happened)
- Mobile interface
- APIs for external access

**Characteristics**:
- User-centric design
- Multiple access patterns
- Real-time and summarized views
- Role-based personalization
- Accessible and discoverable

**Owner**: Chief Product Officer / VP Design

**Change Process**: Product team with UX validation

---

## Information Flow

```
Operations (external world, customers, market changes)
    ↓ (capture real-world events)
Execution Layer (Sandy, AI, workflows execute work)
    ↓ (work produces results and data)
Knowledge Layer (results are analyzed and understood)
    ↓ (understanding informs decisions)
Governance Layer (authority makes decisions within Constitution)
    ↓ (decisions become policy/strategy)
Implementation (back to Execution Layer)
```

---

## Authority Flow

```
Constitution (immutable, applies everywhere)
    ↓ (delegates to)
Governance Layer (principles, standards)
    ↓ (delegates to)
Knowledge Layer (documented policies)
    ↓ (delegates to)
Execution Layer (work implementation)
    └─ With escalation back up
       when uncertain or outside authority
```

---

## Cross-Layer Communication

Layers communicate in specific patterns:

**Information Up**:
- Execution → Knowledge (work results become knowledge)
- Knowledge → Governance (understanding informs principles)

**Authority Down**:
- Governance → Knowledge (principles guide understanding)
- Knowledge → Execution (documented policies guide work)

**Governance**: Applies at all levels (no cross-cutting from lower to higher)

---

## Layer Independence

Each layer can evolve independently as long as:
- ✅ Respects constraints from layers above
- ✅ Reports information to layers above
- ✅ Implements policies from layers above

Examples:

**Execution Layer Change**: Workflow improved without affecting Governance
- Sandy directed work is now faster
- Doesn't change Constitution or policies
- Reports improved metrics to Knowledge layer

**Knowledge Layer Change**: Decision record format improved
- No impact to Execution (still follow documented policies)
- No change to Constitution
- Better captures reasoning

**Governance Layer Change**: Constitution amended (rare)
- New principle affects everything below
- All layers must comply
- Grandfather clause for transition

---

## Consequences

### Positive

✓ **Clear Structure** - Everyone understands what each layer does  
✓ **Governance Enforced** - Constitution applies everywhere  
✓ **Independent Evolution** - Layers can improve without blocking each other  
✓ **Scalability** - Structure supports multi-company  
✓ **Auditability** - Authority and decisions clear  
✓ **Long-term Sustainability** - Supports 10-year evolution

### Negative

✗ **Complexity** - More layers to understand  
✗ **Overhead** - More documentation required  
✗ **Communication** - Coordination between layers needed  

### Risks

- **Boundary Confusion** - Teams unclear which layer their work is in
- **Over-Engineering** - Treating simple decisions as requiring all layers
- **Layer Bottleneck** - Waiting for layer above to make decision
- **Misaligned Authority** - Clear authority but not accepted as legitimate

---

## Mitigation Strategies

### To Prevent Confusion

1. **Document Layer Assignments** - Clear what each system is in each layer
2. **Training** - All teams understand four-layer model
3. **Examples** - Concrete examples of decisions at each layer
4. **Visual Aids** - Clear diagrams showing layers and flow

### To Prevent Over-Engineering

1. **Simplicity First** - Not every change requires all layers
2. **Context Determines Process** - Small changes fast, big changes through layers
3. **Authority Empowerment** - Teams have clear authority at their layer
4. **Decision Support** - AI helps determine what layer a decision belongs in

### To Prevent Bottlenecks

1. **Clear Authority** - Each layer knows what it can decide
2. **Escalation Path** - Clear path when decision crosses layers
3. **Parallel Work** - Layers can work independently on different items
4. **Timeout Rules** - If waiting too long, escalate

### To Build Legitimacy

1. **Transparency** - Show why layers exist
2. **Results** - Demonstrate benefits of layered approach
3. **Feedback** - Listen to concerns and adjust
4. **Participation** - Teams help design their layer

---

## Related Decisions

- [ADR-001: Documentation as Source of Truth](ADR-001%20Documentation%20as%20Source%20of%20Truth.md) - Knowledge Layer implements this
- [ADR-002: Nine-Domain Model](ADR-002%20Nine-Domain%20Model.md) - Domains apply across layers
- [ADR-007: Constitution Immutability](ADR-007%20Constitution%20Immutability.md) - Governance Layer enforces this
- [Document 03: Layer Model](../03%20Layer%20Model.md) - Detailed layer specifications

---

## Questions & Clarifications

**Q: What if something doesn't fit in a layer?**  
A: Everything should fit. If it doesn't, we haven't understood it correctly. Escalate to architecture team.

**Q: Can layers communicate directly?**  
A: Yes, through defined patterns (information up, authority down, decisions cascade down).

**Q: Who decides what layer something belongs in?**  
A: Start with clear definitions. Escalate ambiguous cases to architecture team.

**Q: Can we bypass a layer?**  
A: No. All authority flows from Governance through layers. Governance layer always applies.

**Q: How do we measure if layering is working?**  
A: Measure: Decision time, change implementation time, cross-layer confusion incidents, audit findings.

---

## Implementation Approach

### Phase 1: Documentation (Now)
- ✓ Document four-layer model
- ✓ Assign existing systems to layers
- ✓ Create transition guide

### Phase 2: Organizational Alignment (Q2 2026)
- [ ] Clarify role responsibilities by layer
- [ ] Create org structure reflecting layers
- [ ] Establish communication patterns

### Phase 3: Process Implementation (Q3 2026)
- [ ] Define decision process by layer
- [ ] Establish escalation paths
- [ ] Implement approval workflows

### Phase 4: System Implementation (Q4 2026)
- [ ] Build Sandy (Execution layer orchestrator)
- [ ] Implement workflow automation (Execution layer)
- [ ] Build dashboards (Experience layer)

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: CEO (Conditional on final Blueprint)  
- **Date Approved**: 2026-07-17  

**Four-layer architecture organizes AI Office from immutable principles through documented knowledge to operational execution to user experience.**
