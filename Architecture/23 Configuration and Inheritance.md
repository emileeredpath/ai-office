# Configuration and Inheritance: How Settings Cascade and Override

Configuration in AI Office flows from constitutional principles through platform defaults, group standards, company overrides, and operational customizations. This document defines how settings cascade, when they can be overridden, and what constraints apply.

---

## Configuration Principle

**Settings cascade from high-level (Constitution) to low-level (specific workflow) with controlled override capability at each level, constrained by immutable rules.**

```
CONSTITUTION (immutable)
    ↓ (All must comply)
PLATFORM DEFAULT (baseline)
    ↓ (Can override if allowed)
GROUP STANDARD (holding company)
    ↓ (Can override if allowed)
COMPANY OVERRIDE (operating company)
    ↓ (Can override if allowed)
BUSINESS UNIT OVERRIDE (functional area)
    ↓ (Can override if allowed)
DEPARTMENT OVERRIDE (operational unit)
    ↓ (Can override if allowed)
WORKFLOW SPECIFIC (individual process)
```

---

## Configuration Layers

### Layer 1: Constitution (Immutable)

**Authority**: Managing Director + Board (if applicable)

**What It Sets**:
- Core principles that apply everywhere
- Non-negotiable governance rules
- Legal and ethical requirements
- Authority structures
- Human decision requirements

**Examples**:
- "All data access is logged"
- "All financial decisions >$1M audited"
- "Human authority in hiring decisions"
- "Compliance with law is non-negotiable"

**Override**: Cannot be overridden at any lower level

**Change Process**: Constitutional amendment (formal, deliberate, 4+ weeks)

---

### Layer 2: Platform Default (AI Office Standard)

**Authority**: AI Office architect/CTO

**What It Sets**:
- Standard settings for all instances
- Reasonable defaults across use cases
- Best practices as default behavior
- Performance/security baselines

**Examples**:
- "Default role approval chain: Manager → Department Head → VP"
- "Default hiring limit: $100k"
- "Default data retention: 7 years"
- "Default encryption: AES-256"

**Override**: Yes, can be overridden by Group Standard or Company Override

**Change Process**: Platform team decides, document in configuration, no user approval needed

---

### Layer 3: Group Standard (Holding Company Policy)

**Authority**: Parent company leadership (CFO, COO, etc.)

**What It Sets**:
- Standards for all subsidiary companies
- Group-wide policies
- Minimum compliance levels
- Brand and culture standards

**Examples**:
- "Hiring limit for Group: $80k"
- "All companies must use Group Finance systems"
- "All companies must follow Group security standards"
- "Brand guidelines apply to all companies"

**Override**: Yes, can be overridden by Company Override if authorized

**Change Process**: Group leadership decides, applies to all companies unless they negotiate override

---

### Layer 4: Company Override (Operating Company)

**Authority**: Company CEO/COO

**What It Sets**:
- Settings specific to this company
- Customizations for company size/type
- Company-specific policies
- Company-specific procedures

**Examples**:
- "In our company, hiring limit is $150k (higher than Group default)"
- "In our company, expense approval is done weekly"
- "In our company, we use this particular tool"

**Override**: Yes, can be overridden by Business Unit Override

**Change Process**: Company leadership decides, documented in company configuration

---

### Layer 5: Business Unit Override (Functional Area)

**Authority**: Business Unit leader (VP, Head of, etc.)

**What It Sets**:
- Settings specific to a functional area
- Accommodations for specialized work
- Domain-specific customizations

**Examples**:
- "In Engineering, hiring limit is $200k (higher than company)"
- "In Finance, approval is 2-person rule (higher than standard)"
- "In Operations, escalation path is different"

**Override**: Yes, can be overridden by Department Override

**Change Process**: BU leader decides, documented in BU configuration

---

### Layer 6: Department Override (Operational Unit)

**Authority**: Department leader (Manager, Director, etc.)

**What It Sets**:
- Settings specific to a team
- Operational customizations
- Team-specific procedures

**Examples**:
- "In Customer Success, approval limit is $50k (lower for customer-facing)"
- "In Support, escalation to supervisor at 4-hour mark"
- "In our team, we require peer review for code"

**Override**: Yes, can be overridden by Workflow Specific rules

**Change Process**: Department leader decides, documented in department configuration

---

### Layer 7: Workflow Specific (Individual Process)

**Authority**: Process owner or workflow designer

**What It Sets**:
- Settings for a specific workflow/process
- Exceptions for particular situations
- Step-specific configurations

**Examples**:
- "This invoice requires CFO approval (normally Manager)"
- "This customer requires CEO approval for discount"
- "This security incident requires immediate VP escalation"

**Override**: No override beyond this point

**Change Process**: Process owner decides, exception logged for audit

---

## Configuration Inheritance Examples

### Example 1: Simple Single Company

**Scenario**: Small startup, single company, simple hierarchy

```
Constitution: "Hiring decisions require human approval"
Platform Default: "Manager can approve hiring up to $100k"
Company Override: (none - accept platform default)
Department Override: (none - accept platform default)
Workflow Specific: (none - normal flow)

Result:
Manager can approve hiring up to $100k
Everyone else escalates to Manager or above
```

---

### Example 2: Company with Specialty Department

**Scenario**: Mid-size company, most departments standard, Engineering is specialized

```
Constitution: "Hiring decisions require human approval"
Platform Default: "Manager can approve hiring up to $100k"
Company Override: "Company policy: hiring limit $80k"
Department Override (Sales): (none - follow company)
Department Override (Engineering): "$200k (need specialized talent)"
Workflow Specific (for CTO hire): "CEO approval required"

Result:
Sales Manager: Can approve hiring up to $80k
Engineering Manager: Can approve hiring up to $200k
For CTO hire: CEO must approve regardless
```

---

### Example 3: Holding Company with Subsidiaries

**Scenario**: Holding company with Finance shared service and two subsidiaries

```
Constitution: "All data access is logged"
Platform Default: "Manager approves expenses up to $5k"
Group Standard: "Group policy: $10k limit"
Company A Override: "$10k (follow group - conservative)"
Company A Dept (Finance): "$50k (for payments)"
Company B Override: "$20k (authorized for higher spending)"
Company B Dept (HR): "$5k (lower for recruitment)"
Workflow (hiring for Company B, Director level): "$200k approved by VP"

Result:
Company A, normal department: $10k
Company A Finance: $50k
Company B normal: $20k
Company B HR: $5k
Company B Director hiring: VP approves up to $200k
```

---

## Immutable Constraints in Overrides

**RULE**: Constitutional constraints cannot be overridden at any level.

### Test: Is This Overridable?

Ask: "Does this override violate Constitution or law?"

**NOT Overridable (Constitutional/Legal)**:
- "Skip data logging" ❌ (Constitution: all data access logged)
- "Don't audit this financial decision" ❌ (Constitution: >$1M audited)
- "Hire without human decision" ❌ (Constitution: humans decide hiring)
- "Violate GDPR requirement" ❌ (Law: non-negotiable)
- "Skip ethics review" ❌ (Constitution: ethical standards)

**Overridable (Policy/Procedure)**:
- "Change hiring limit from $100k to $150k" ✅
- "Use different approval process" ✅ (as long as human decides)
- "Implement this before asking" ✅ (as long as escalation path exists)
- "Skip this step" ✅ (if Constitutional rule allows)

---

## Configuration Management

### Documenting Configuration

Each configuration level should be documented:

```markdown
# Company A Configuration

**Inheritance From**:
- Constitution: [link]
- Platform Default: [link]
- Group Standard: [link]

**Company Overrides**:
| Setting | Platform Default | Company Override | Justification |
|---------|------------------|------------------|----------------|
| Hiring Limit | $100k | $80k | Conservative approach |
| Approval Chain | Mgr→Dir→VP | Mgr→Dir | Faster decisions |
| Data Retention | 7 years | 5 years | Space constraints |

**Authorizations**:
- Hiring over $80k: CEO approval required
- Policy changes: CFO review required
- Constitutional questions: Board escalation

**Last Updated**: 2026-07-17
**Next Review**: 2026-10-17
```

---

### Configuration Audit

Quarterly review:

- [ ] All configurations documented
- [ ] Inheritance chains correct
- [ ] No illegal overrides detected
- [ ] No Constitutional violations
- [ ] Overrides authorized appropriately
- [ ] Performance impacts measured
- [ ] Outdated configurations cleaned up

**If Issues Found**:
1. Alert to configuration owner
2. Assess risk (compliance vs. operational)
3. Correct immediately if legal/compliance
4. Plan correction if operational
5. Document resolution

---

## Dynamic vs. Static Configuration

### Static Configuration

**What**: Defines the rules at a level

**Managed By**: Role with authority (CEO, CTO, etc.)

**Change Process**: Formal (documented, approved, announced)

**Example**:
```
Company Override (static configuration)
Hiring Limit: $100k
Set by: CEO
Last changed: 2026-06-01
Change approval: Board
```

---

### Dynamic Configuration (Runtime)

**What**: Actual setting used in real-time, based on context

**May Be Affected By**:
- Base static configuration
- Current context (user role, department)
- Runtime conditions (budget remaining, time of day)
- Temporary exceptions

**Example**:
```
Actual approval limit for this transaction:
- Base: $100k (company policy)
- User is: Manager in Sales
- Context: End of fiscal year (stricter rules)
- Result: $50k limit applied for this period
```

---

## Exception Process

When someone wants to override configuration:

### Level 1: Within Authorized Scope

**If**: User has authority at that level

**Process**:
1. User decides to override
2. Document the override (who, what, why, when)
3. Apply override
4. Audit trail captured automatically
5. Review during quarterly audit

**Example**: Manager approves a higher salary for special hire (within their authority)

---

### Level 2: Requesting Exception

**If**: User wants to override but doesn't have authority

**Process**:
1. Request from appropriate authority
2. Provide context (why needed)
3. Authority approves or denies
4. If approved: Document exception
5. Apply exception
6. Log for audit and learning

**Example**: Department wants to exceed hiring budget, requests CEO approval

---

### Level 3: Constitutional Question

**If**: Proposed override might violate Constitution

**Process**:
1. Alert to Governance domain owner
2. Investigation of Constitution applicability
3. Document finding
4. If ok: Proceed with exception
5. If violates: Cannot override, must amend Constitution
6. Log for audit

**Example**: Team wants to "skip approval for urgent hire" - Governance reviews if Constitution allows this

---

## Configuration Tools

Systems should provide:

### Configuration UI/API
```
GET /configuration/hiring-limit
  ?company=A
  ?department=engineering
  ?include_inheritance=true
  
Response:
{
  "base": 100000,
  "platform_default": 100000,
  "group_standard": 80000,
  "company_override": 80000,
  "department_override": 200000,
  "effective": 200000,
  "inherited_from": "department_override"
}
```

---

### Configuration Change Log
```
Hiring Limit (Company A)
├─ 2026-07-17: Changed to $80k by CEO (from $100k)
│  Reason: "Tighter financial controls"
│  Approved: CFO
│
├─ 2026-01-15: Set to $100k by CTO during setup
│  Reason: "Platform default"
│  Approved: Automatic
│
└─ History extends back to inception
```

---

### Configuration Validation

System should validate:
- ✅ No Constitutional override (automatic check)
- ✅ Authority confirmed (check role)
- ✅ Documentation required (enforce)
- ✅ Notify affected parties (send alerts)
- ✅ Audit trail (log everything)

---

## Migration and Change

### Changing Platform Default

When platform default changes:

```
Old Platform Default: Hiring limit $100k
New Platform Default: Hiring limit $120k (based on market)

Affected:
├─ Companies with no override: Adopt new default
├─ Companies with override: Keep override (no change)
└─ Workflows: Validate they still work

Timeline:
1. Announce change (2 weeks notice)
2. Create migration plan
3. Test with one company
4. Roll out to others
5. Monitor for issues
```

---

### Changing Company Policy

When company wants to change its override:

```
Old: Company limit $100k
New: Company limit $80k

Affected:
├─ Department overrides: Still apply (if higher, now exceeds company)
├─ Pending approvals: Validate under new limit
└─ Contracts: No change (future approvals only)

Process:
1. Propose change to CEO
2. Impact assessment
3. Announcement to teams
4. Effective date
5. Implementation (workflows updated)
6. Audit to ensure compliance
```

---

## Key Principle

**Configuration inheritance enables consistency while allowing customization. Constitutional constraints are immutable; everything else can be configured at appropriate levels.**

When configuration is well-designed:
- Settings cascade predictably
- Overrides are authorized
- Constitutional rules cannot be violated
- Changes are documented and auditable
- Teams have autonomy within bounds

---

**Configuration flows from Constitution through platform, group, company, and department levels with controlled override capability at each step.**
