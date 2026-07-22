# ADR-001: Documentation as Source of Truth

**Status**: Accepted  
**Date**: 2026-07-17  
**Deciders**: Executive Leadership  
**Stakeholders**: All teams  

---

## Decision

**AI Office documentation is the authoritative source of truth for how the organization operates. Systems implement what documentation specifies, not the reverse.**

When documentation and system behavior conflict, trust the documentation. Update the system to match documented reality, or update documentation to reflect deliberate system change (with approval).

---

## Context

In traditional organizations, systems are built first, then documentation tries to catch up (and falls behind). This creates:
- Documentation that's obsolete and unreliable
- Institutional knowledge only in people's heads
- Inconsistent understanding of how things work
- AI unable to reason about business intent
- New employees unable to learn from documentation

AI Office is built for an operating system mindset where documentation **precedes** systems.

---

## Problem

How do we ensure:
1. **Single source of truth** - One authoritative description of how things work
2. **AI readability** - AI can understand and reason about policy
3. **Maintainability** - Easy for humans to update as things change
4. **Traceability** - Know why decisions were made
5. **Scalability** - Works as organization grows

---

## Options Considered

### Option 1: Documentation First (Chosen)
- Write policy first
- Implement systems second
- Documentation is authoritative
- Systems implement documentation
- Changes flow policy → documentation → systems

**Pros**:
- Single source of truth is clear
- AI can reason about policy
- Changes are deliberate and documented
- Easy to trace policy evolution

**Cons**:
- Requires discipline (write docs before code)
- May discover policy gaps during implementation
- Slower initial delivery

### Option 2: System First, Documentation After
- Build systems first
- Document afterward
- Systems are authoritative
- Documentation tries to catch up

**Pros**:
- Faster initial delivery
- Less upfront planning

**Cons**:
- Documentation always behind
- No single source of truth
- Inconsistent understanding
- AI can't reason about intent
- Institutional knowledge in code

### Option 3: Hybrid (Flexible)
- Documentation for some things, systems for others
- Different authorities for different domains

**Pros**:
- Flexible approach

**Cons**:
- Confusing - what's authoritative?
- Creates information silos
- Doesn't scale

---

## Decision Rationale

**Documentation First** is chosen because:

1. **Operating System Analogy**: An operating system documents its kernel interfaces; applications implement them. Changing the kernel without documentation breaks everything.

2. **AI Foundation**: For AI to reason about business logic, it must read documented policy, not reverse-engineer code.

3. **Scalability**: As organization grows, informal knowledge becomes impossible. Documentation is the only scalable approach.

4. **Governance**: Constitutional rules, policies, and procedures are clearer in documentation than scattered through code.

5. **Change Management**: Changes should flow policy → documentation → implementation, not the reverse.

6. **Transparency**: Why a decision was made is documented, enabling future decision-makers to understand tradeoffs.

---

## Consequences

### Positive

✓ **Single source of truth** - One authoritative description  
✓ **AI-readable** - AI can understand business policy  
✓ **Maintainable** - Easy to update and track changes  
✓ **Transparent** - Decisions and rationale documented  
✓ **Scalable** - Works as organization grows  
✓ **Auditable** - Can trace changes and decisions  

### Negative

✗ **Upfront documentation cost** - Must write before building  
✗ **Discipline required** - Must maintain consistency  
✗ **Discovery during implementation** - May find policy gaps  

### Risks

- **Documentation gets out of sync**: Requires governance to prevent
- **Slow initial delivery**: Requires discipline and planning
- **Incomplete documentation**: May miss edge cases until implementation

---

## Mitigation Strategies

### To Keep Documentation Current

1. **Change process**: Documentation updates are part of change process
2. **Governance layer**: Governance domain maintains documentation quality
3. **Reviews**: Regular documentation reviews for accuracy
4. **Version control**: All documentation in Git with clear change history
5. **Automated checks**: Scripts can validate documentation completeness

### To Speed Delivery

1. **Document MVP first**: Minimum documentation for minimum viable product
2. **Iterative documentation**: Document, implement, improve, redocument
3. **Templates**: Reusable patterns speed documentation
4. **Automation**: Generate documentation where possible

### To Handle Discovery

1. **Policy amendment process**: If implementation reveals gap, amend policy
2. **Exception framework**: Documented process for exceptions to policy
3. **Learning loop**: Capture lessons from implementation

---

## How This Works in Practice

### When Building a New Feature

1. **Document the policy**: "Here's the intended behavior"
2. **Design the system**: "Here's how to implement this"
3. **Implement the system**: "Build according to design"
4. **Validate**: "Does system match documentation?"
5. **If mismatch**: Fix system OR update documentation (with approval)

### When Changing a Policy

1. **Update documentation** (Governance layer approval)
2. **Update systems** (Implementation)
3. **Communicate change**
4. **Archive old version** (for historical reference)

### When Discovering Gap

1. **Document current reality**
2. **Decide if it's a bug or feature**
3. **Update documentation** (if feature) OR fix system (if bug)
4. **Communicate decision**

---

## Implementation

### Starting Now

- All new policies documented before implementation
- All new features have design document before coding
- All systems implement documented policy
- Changes tracked in version control

### Governance

- Governance domain owns this principle
- Regular audits of documentation vs. system behavior
- Amendment process for policy changes
- Exception process for edge cases

### Tools

- Markdown for documentation (human and AI readable)
- Git for version control
- CI/CD validation for completeness

---

## Related Decisions

- [ADR-002: Nine-Domain Model](ADR-002%20Nine-Domain%20Model.md) - How documentation is organized
- [ADR-003: Platform Domain Naming](ADR-003%20Platform%20Domain%20Naming.md) - Technical platform design
- [ADR-008: Blueprint Before Refactoring](ADR-008%20Blueprint%20Before%20Refactoring.md) - Architecture first

---

## Revisit Conditions

This decision should be revisited if:
- Documentation becomes systematically out of sync with systems
- AI capabilities make different approach viable
- Organization decides documentation-second is faster
- Governance layer determines different approach better

---

## Questions & Clarifications

**Q: What if we discover policy gap during implementation?**  
A: Document the gap, decide if it's intentional (feature) or unintentional (bug), update documentation, proceed.

**Q: Who ensures documentation stays current?**  
A: Governance domain owns this. Owners of each domain keep documentation current in their domain.

**Q: What about edge cases not in documentation?**  
A: Either document the edge case OR create exception process for out-of-policy situations.

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: Chief Executive Officer  
- **Date Approved**: 2026-07-17  

This is a foundational decision. Approved with conviction.

---

**Documentation as source of truth enables AI Office to scale from startup to enterprise while maintaining clarity, governance, and auditability.**

