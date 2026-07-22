# ADR-006: Configuration Inheritance Model

**Status**: Draft Complete  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: All domains, operations team  

---

## Decision

**Configuration in AI Office flows from Constitutional principles through hierarchical levels (Platform Default → Group Standard → Company Override → Business Unit Override → Department Override → Workflow Specific) with controlled override capability at each level. Constitutional constraints cannot be overridden at any level.**

This model prevents configuration duplication, enables consistency, allows customization, and preserves governance.

---

## Context

Without inheritance model:
- Each level duplicates all configuration
- Changes propagate inconsistently
- Unknown which version applies where
- Hard to customize without breaking defaults
- Configuration drift over time

With inheritance model:
- Define once, inherit many times
- Override at appropriate level
- Clear which version applies
- Easy to customize
- Changes propagate automatically

---

## Problem

Without clear configuration inheritance:
- What approval limit applies to this department?
- If company changes policy, do all departments update?
- How do we know which rule applies?
- Can a department override company policy?
- What happens if override conflicts with Constitution?

---

## Options Considered

### Option 1: All Configuration at Platform Level
- Single configuration for entire organization
- No overrides
- Simple but inflexible

**Pros**:
- Very simple
- Consistent everywhere

**Cons**:
- Cannot customize for different needs
- One size fits all (doesn't work)
- Ignores company, department differences

### Option 2: All Configuration at Local Level
- Each unit defines its own configuration
- No inheritance
- Lots of duplication

**Pros**:
- Full flexibility

**Cons**:
- Massive duplication
- Inconsistency
- Hard to audit
- Changes don't propagate

### Option 3: Inheritance Model (Chosen)
- Configuration cascades from top to bottom
- Each level inherits from above
- Can override at appropriate level
- Constitutional constraints immutable

**Pros**:
- Clear hierarchy
- Prevents duplication
- Easy to customize
- Constitutional compliance preserved
- Scalable

**Cons**:
- More complex
- Requires discipline
- Potential for unintended overrides

---

## Decision Rationale

**Inheritance model chosen because**:

1. **Scalability** - Supports single company to enterprise
2. **Consistency** - Defaults propagate automatically
3. **Customization** - Override only what needs changing
4. **Governance** - Constitutional rules always apply
5. **Auditability** - Can trace any configuration to source
6. **Efficiency** - Changes at top level apply everywhere
7. **Clarity** - Clear precedence if conflicts

---

## Configuration Hierarchy

```
CONSTITUTION (Immutable)
├─ Non-negotiable rules
├─ Applied everywhere
└─ Cannot be overridden
    ↓
PLATFORM DEFAULT (AI Office baseline)
├─ Reasonable defaults for all organizations
├─ Applied to all companies
└─ Can be overridden by lower levels
    ↓
GROUP STANDARD (Holding company policy)
├─ Policy for all subsidiaries
├─ Applied to all companies in group
└─ Can be overridden by companies (if authorized)
    ↓
COMPANY OVERRIDE (Operating company policy)
├─ Policy specific to this company
├─ Applied to all departments in company
└─ Can be overridden by departments (if authorized)
    ↓
BUSINESS UNIT OVERRIDE (Functional area policy)
├─ Policy specific to this BU (optional level)
├─ Applied to all departments in BU
└─ Can be overridden by departments
    ↓
DEPARTMENT OVERRIDE (Operational unit policy)
├─ Policy specific to this department
├─ Applied to all teams in department
└─ Can be overridden by workflows (if authorized)
    ↓
WORKFLOW SPECIFIC (Individual process settings)
├─ Exception for this specific workflow
├─ Applied to this workflow only
└─ No further override possible
```

---

## Examples of Configuration Inheritance

### Example 1: Hiring Authority

```
Platform Default:
├─ "Manager can approve hiring up to $100k"
└─ "Director can approve up to $500k"

Group Standard:
├─ Acme Holdings: "Conservative group policy: $80k for managers"
└─ (Applies to all Acme companies)

Company A Override:
├─ Acme Manufacturing: No change (follows group)
└─ (Managers: $80k)

Company B Override:
├─ Acme Software: "$200k for managers in specialized roles"
└─ (Managers in tech roles: $200k; Other managers: $80k)

Department (Engineering) Override:
├─ Company B Engineering: "Director can approve up to $1M"
└─ (Because specialized talent is critical)

Workflow Specific:
├─ "Hiring VP - CEO approval required"
└─ (Regardless of normal limits)

Result in Different Contexts:
├─ Sales Manager @Acme Manufacturing: $80k limit
├─ Engineering Manager @Acme Software: $200k limit
├─ Finance Manager @Acme Software: $80k limit
├─ Engineering Director @Acme Software: $1M limit
└─ VP Hiring (anywhere): CEO approval required
```

### Example 2: Approval Process

```
Platform Default:
├─ Approval chain: Manager → Department Head → VP
└─ Timing: Response within 48 hours

Group Standard:
├─ Acme Holdings: "All approvals must include Governance review"
└─ (For compliance)

Company A Override:
├─ Acme Manufacturing: "Add finance review for >$10k"
└─ (Additional financial control)

Company B Override:
├─ Acme Software: "Approval by Manager only (faster for <$10k)"
└─ (For innovation/speed)

Department (Finance) Override:
├─ Acme Software Finance: "Manager + Finance Head (tighter control)"
└─ (Financial controls)

Workflow Specific:
├─ Acme Software < $10k: Manager approval only
├─ Acme Software Finance < $10k: Manager + Finance Head
├─ Acme Manufacturing < $10k: Manager → Department Head → Finance
└─ Anything > $10k @ Acme Manufacturing: + Governance review

Result: Each context has appropriate approval process
```

---

## How Inheritance Works

### When Configuration is Needed

System evaluates in order:
1. **Is there Workflow Specific setting?** → Use it
2. **Is there Department Override?** → Use it
3. **Is there BU Override (if exists)?** → Use it
4. **Is there Company Override?** → Use it
5. **Is there Group Standard?** → Use it
6. **Is there Platform Default?** → Use it
7. **Is there Constitutional rule?** → Use it (and can't override)

### When Configuration Changes

Example: Platform Default hiring limit changes from $100k to $120k

**Who is affected**:
- Companies with no override: Adopt new $120k default automatically
- Companies with override: Keep their override (no change)
- Departments with override: Keep their override

**What departments see**:
```
Before change:
├─ Dept A (no override): $100k (from platform)
├─ Dept B (company override $150k): $150k
└─ Dept C (dept override $50k): $50k

After change:
├─ Dept A (no override): $120k (new platform default)
├─ Dept B (company override $150k): $150k (unchanged)
└─ Dept C (dept override $50k): $50k (unchanged)
```

Changes propagate automatically for units with no override; overrides are preserved.

---

## Immutable Constitutional Layer

**RULE**: Constitutional constraints cannot be overridden at any level.

```
Constitutional Rule: "All financial decisions >$1M must be audited"

What CAN happen:
├─ Company A: "In our company, this applies to all decisions"
├─ Company B: "In our company, this applies to >$2M"
└─ Dept: "In our department, this applies to >$500k"
└─ Result: All comply with Constitution, interpret scope differently

What CANNOT happen:
├─ Department says: "Skip the audit for urgent decision"
├─ ✗ VIOLATION - Cannot skip Constitutional requirement
│
├─ Company says: "We don't do audits"
├─ ✗ VIOLATION - Cannot skip Constitutional requirement
│
└─ Team says: "This transaction is exempt"
└─ ✗ VIOLATION - Cannot skip Constitutional requirement

Solution:
├─ Escalate to leadership
├─ Possibly amend Constitution if truly needed
└─ But cannot simply override
```

---

## Configuration Documentation

Each configuration level should document:

```
COMPANY A HIRING CONFIGURATION

Inheritance Path:
├─ Platform Default: Manager $100k, Director $500k
├─ Group Standard: $80k (override from Acme Holdings)
├─ Company Override: None (follows group)
└─ Effective for Dept X: $80k for manager hires

Overrides by Department:
├─ Engineering (Dept Y): $200k (specialized talent)
└─ Support (Dept Z): $50k (more conservative)

Workflow Exceptions:
├─ Director hiring: CEO approval required
└─ VP hiring: Board approval required

Change History:
├─ 2026-07-17: Set Company to follow Group standard
├─ 2026-06-01: Group changed from $100k to $80k
└─ 2026-01-15: Department Engineering override added

Last Updated: 2026-07-17
Next Review: 2026-10-17
```

---

## Validation and Consistency

System validates:

**Immutable Rules**:
- ✓ Constitutional rules are never overridden
- ✓ Immutable rules marked clearly
- ✓ Violations trigger alerts

**Inheritance Integrity**:
- ✓ Every override references parent
- ✓ No orphaned configurations
- ✓ Override scope is clear

**Documentation**:
- ✓ All overrides documented
- ✓ Rationale for overrides recorded
- ✓ Approval trail maintained

**Consistency**:
- ✓ Quarterly validation
- ✓ Automatic consistency checks
- ✓ Alerts for anomalies

---

## Configuration Override Process

### Simple Override (Within Authority)

**User who has authority makes override**:
1. User updates configuration
2. Document the override (what, why, when)
3. Apply override
4. Log for audit trail
5. Review in quarterly audit

Example: Manager wants higher approval limit for their department

---

### Exception Request (No Authority)

**User wants to override but doesn't have authority**:
1. Request from appropriate authority
2. Provide context (why needed)
3. Authority reviews and approves or denies
4. If approved: Document exception, apply, log
5. Review in quarterly audit

Example: Department wants to skip step in workflow

---

### Constitutional Question

**Proposed override might violate Constitution**:
1. Alert to Governance domain owner
2. Investigation of Constitution applicability
3. Document finding
4. If ok: Proceed with exception
5. If violates: Cannot override; escalate for constitutional amendment
6. Log for audit

Example: Team wants to "skip logging for performance"

---

## Consequences

### Positive

✓ **Prevents Duplication** - Define once, inherit many times  
✓ **Consistency** - Default behavior consistent  
✓ **Customization** - Can specialize where needed  
✓ **Governance** - Constitutional rules always apply  
✓ **Scalability** - Works from startup to enterprise  
✓ **Auditability** - Can trace any configuration to source  
✓ **Change Management** - Changes propagate automatically  

### Negative

✗ **Complexity** - More to understand  
✗ **Discipline Required** - Must use inheritance correctly  
✗ **Potential Confusion** - Which override applies?  

### Risks

- **Override Cascade** - Too many levels, confusing which applies
- **Inheritance Breaks** - Override chain broken somehow
- **Unintended Inheritance** - Someone doesn't inherit when they should
- **Constitutional Violation** - Someone overrides Constitutional rule

---

## Mitigation Strategies

### To Prevent Confusion

1. **Clear Documentation** - Show inheritance path for each setting
2. **Configuration UI** - Show full inheritance chain
3. **Training** - Teams understand how inheritance works
4. **Examples** - Concrete examples of cascades

### To Prevent Broken Chains

1. **Validation** - System checks inheritance integrity
2. **Testing** - Verify each configuration layer
3. **Alerts** - Notify if inheritance breaks
4. **Quarterly Audit** - Regular check of integrity

### To Prevent Unintended Inheritance

1. **Explicit Opt-in** - Must explicitly inherit or override
2. **Clear Marking** - Inherited vs. overridden clearly marked
3. **Default Conservative** - Inherit by default, only override intentionally
4. **Verification** - Review before taking effect

### To Prevent Constitutional Violation

1. **System Validation** - Cannot override immutable rules
2. **Clear Marking** - Constitutional rules marked as immutable
3. **Training** - Teams understand what can't be overridden
4. **Escalation** - If truly problematic, escalate for amendment

---

## Related Decisions

- [ADR-004: Multi-Company Hierarchy](ADR-004%20Multi-Company%20Hierarchy.md) - Hierarchy that enables inheritance
- [ADR-007: Constitution Immutability](ADR-007%20Constitution%20Immutability.md) - Constitutional rules are immutable
- [Document 23: Configuration and Inheritance](../23%20Configuration%20and%20Inheritance.md) - Implementation details
- [Document 05: Organisational Hierarchy](../05%20Organisational%20Hierarchy.md) - Hierarchical structure

---

## Questions & Clarifications

**Q: What if we want a completely different configuration?**  
A: Override at appropriate level. Still inherits immutable Constitutional rules.

**Q: Can we remove an inherited setting?**  
A: Yes, override with "not applicable" or equivalent. Must document reason.

**Q: What if inherited configuration doesn't work?**  
A: Override at your level. If pattern emerges, escalate to parent level for adjustment.

**Q: How do we know effective configuration?**  
A: System shows full inheritance path and effective value at every level.

**Q: Can changes break existing overrides?**  
A: No. Overrides are preserved. Only non-overridden settings change.

---

## Implementation Approach

### Phase 1 (Now): Framework
- ✓ Define inheritance model
- ✓ Create documentation
- ✓ Document Constitutional rules

### Phase 2 (Q2 2026): Single Company
- [ ] Implement inheritance for first company
- [ ] Test all levels
- [ ] Document configurations

### Phase 3 (Q3 2026): Multi-Company
- [ ] Add Group standard level
- [ ] Implement company overrides
- [ ] Test multi-company scenarios

### Phase 4 (Q4 2026): Maturity
- [ ] Automated validation
- [ ] Configuration UI
- [ ] Quarterly audits

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: CEO (Conditional on final Blueprint)  
- **Date Approved**: 2026-07-17  

**Configuration flows hierarchically with controlled override capability while preserving Constitutional constraints. Each level inherits sensible defaults and can customize within bounds.**
