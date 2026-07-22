# ADR-005: AI Role and Authority Contracts

**Status**: Draft Complete  
**Date**: 2026-07-17  
**Deciders**: Architecture Team  
**Stakeholders**: Executive Leadership, Operations, Automation team  

---

## Decision

**Every AI employee (Sandy, Finance AI, Sales AI, etc.) has an explicit Role and Authority Contract defining scope, authority, escalation paths, performance metrics, and constraints. These contracts are distinct from runtime configuration and human employment documentation.**

AI employees are accountable agents operating under delegated authority, not autonomous systems making independent decisions.

---

## Context

AI Office will deploy multiple AI employees with different capabilities and authority levels:
- Sandy (central orchestration)
- Finance AI (invoice approval, payments)
- Sales AI (lead qualification, opportunity scoring)
- Operations AI (workflow optimization)

Each must have clear boundaries on what it can decide independently, what requires notification, what requires human approval, and what it absolutely cannot do.

---

## Problem

Without explicit AI contracts:
- Ambiguous whether AI can make decisions or just recommend
- No clear escalation path
- No accountability if AI makes wrong decision
- Risk of AI exceeding authority
- Legal/regulatory uncertainty
- Humans don't know to override AI or trust it

---

## Options Considered

### Option 1: No AI - Humans Do Everything
- All decisions made by humans
- AI provides analysis only
- Safe but slow and expensive

**Pros**:
- Clear human responsibility
- No AI risk

**Cons**:
- Inefficient
- Can't scale
- AI potential unused

### Option 2: AI Autonomy - AI Decides Within Domain
- AI has autonomous authority
- Humans don't override unless exceptional
- Faster decisions
- Risk of AI error

**Pros**:
- Fast decisions
- Scalable

**Cons**:
- Accountability unclear
- Legal/regulatory risk
- Constitutional violation (humans must decide)

### Option 3: Explicit Contracts (Chosen)
- AI has authority defined in contract
- Can decide independently within scope
- Must escalate outside scope
- Humans have final authority
- Clear accountability

**Pros**:
- Clear authority
- Scaled automation
- Human control preserved
- Accountability clear
- Complies with Constitution

**Cons**:
- Requires detailed contract definition
- Overhead to manage contracts
- Contracts must be maintained

---

## Decision Rationale

**Explicit contracts chosen because**:

1. **Constitutional Compliance** - Constitution requires human authority in important decisions; contracts delegate specifically
2. **Accountability** - Clear who is responsible (AI or human)
3. **Governance** - Can verify AI stays within contract
4. **Scale** - Enable AI to automate without losing control
5. **Safety** - Escalation path clear when AI uncertain
6. **Transparency** - Everyone knows what each AI can do
7. **Legal** - Clear terms if something goes wrong

---

## What is an AI Role and Authority Contract?

**Definition**: Document specifying:
- **Identification**: Which AI, version, purpose
- **Scope**: What problems it solves
- **Authority**: What it can decide independently
- **Notification**: What requires human notification
- **Approval**: What requires human approval
- **Prohibitions**: What it absolutely cannot do
- **Escalation**: How and when to escalate
- **Performance**: Quality standards and metrics
- **Constraints**: Operational and ethical constraints
- **Monitoring**: How it's governed and updated
- **Approval**: Who authorized the contract

---

## Contracts vs. Related Concepts

### AI Role and Authority Contract (This Decision)

**What It Defines**:
- What the AI can decide
- What requires human approval
- Escalation paths
- Performance standards
- Accountability

**Who Owns It**: Operations/Automation team

**Change Process**: Document change, stakeholder approval

**Example**: Finance AI contract says "Can approve invoices <$10k from approved vendors, must escalate >$50k"

---

### Runtime Configuration

**What It Defines**:
- Model version
- Tools available
- Integrations
- Memory/context
- Technical settings

**Who Owns It**: Platform/AI team

**Change Process**: Technical deployment

**Example**: Finance AI runs Claude model XYZ, has access to accounting system API

---

### Human Employment Documentation

**What It Defines**:
- Job responsibilities
- Compensation
- Benefits
- Legal employment terms
- Confidentiality agreements

**Who Owns It**: HR

**Change Process**: HR processes

**Example**: Employee contract with salary, benefits, vacation

**Note**: Does NOT apply to AI (AI are not employees)

---

## Contract Structure

### Core Elements

**1. Identification**
- AI Name
- Purpose
- Version
- Owner/Responsible Party

**2. Organizational Location**
- Reporting to: [Domain leader]
- Company/Department: [Location]
- Part of: [Sandy, Automation system, etc.]

**3. Responsibilities**
- What the AI is responsible for
- What value it provides
- Who it serves

**4. Authority Matrix**

Can Decide Independently:
- Approving invoices <$10k from approved vendors
- Qualifying sales leads <$50k opportunity
- Assigning support tickets to queue

Must Notify Human:
- Invoice >$10k (notify AP manager)
- Opportunity >$100k (notify sales manager)
- Complex support issue (notify supervisor)

Must Get Approval:
- Invoice >$50k (AP manager approval)
- Invoices from new vendors (vendor review approval)
- Anything suspicious (fraud detection escalation)

Absolutely Cannot Do:
- Override human decision
- Modify Constitution or policies
- Create financial records (only approve, not create)
- Hire or fire humans
- Make promises to customers

**5. Required Knowledge**
- Understanding of invoice business rules
- Knowledge of vendor list
- Approval authority thresholds
- Escalation procedures

**6. Tools and Systems**
- Accounting system (API access)
- Vendor database
- Approval workflow system
- Notification system

**7. Dependencies**
- Upstream: Invoices from AP system, vendor data from ERP
- Downstream: Approved invoices to payment system

**8. Escalation Paths**
```
Finance AI encounters invoice
├─ Within authority? → Approve
├─ Requires notification? → Notify AP manager
├─ Requires approval? → Request from manager
├─ Uncertain? → Escalate to Finance director
└─ Error detected? → Flag for compliance review
```

**9. Performance Standards**
- Accuracy: ≥99% accuracy on approvals
- Latency: Approve within 5 minutes
- Coverage: Handle 70% of invoices without escalation
- Transparency: Document reasoning

**10. Permissions and Access**
- Data access: Invoices, vendor list, approval history
- System integration: Accounting API
- Automation authority: Can queue for payment
- Scope: Finance department only (cannot see other departments)

**11. Failure Behavior**
- If system unavailable: Queue invoices, wait for system
- If decision confidence low: Escalate
- If rule ambiguous: Escalate to human
- If error discovered: Flag for review, human corrects

**12. Review and Governance**
- Contract review: Quarterly
- Performance review: Monthly
- Audit: Quarterly compliance check
- Learning: Track escalations, improve rules

**13. Audit and Accountability**
- All decisions logged
- Escalations tracked
- Errors reviewed
- AI responsible for accuracy of its decisions

**14. Approval**
- Authorized by: AP Manager, Finance Director
- Date: 2026-07-17
- Effective: 2026-07-17 to [renewal date]

---

## Examples

### Example 1: Finance AI Contract

```
AI Role and Authority Contract: Finance AI
Owner: Chief Accounting Officer

Authority:
├─ CAN approve invoices:
│  ├─ <$10k
│  ├─ From approved vendors
│  └─ With valid cost center
│
├─ MUST notify ($10k-$50k):
│  ├─ AP Manager
│  └─ Finance Director
│
├─ MUST get approval (>$50k):
│  ├─ Finance Director
│  └─ CFO if >$500k
│
└─ CANNOT:
   ├─ Create financial records
   ├─ Change vendor master data
   ├─ Override human decision
   └─ Modify approval thresholds

Performance:
├─ Accuracy: ≥99%
├─ Latency: 5 minutes
├─ Coverage: 70% without escalation
└─ Audit: All decisions logged
```

---

### Example 2: Sandy Central Orchestrator Contract

```
AI Role and Authority Contract: Sandy

Authority:
├─ CAN:
│  ├─ Direct work to AI employees
│  ├─ Direct work to humans
│  ├─ Monitor organizational health
│  ├─ Alert to risks and issues
│  └─ Recommend improvements
│
├─ MUST escalate:
│  ├─ Strategic decisions → CEO
│  ├─ Hiring/firing → HR
│  ├─ Policy changes → Department head
│  ├─ Exceptions → Responsible authority
│  └─ Constitutional questions → Governance
│
└─ CANNOT:
   ├─ Make strategic decisions
   ├─ Change policies
   ├─ Hire/fire humans
   ├─ Approve major spending >$100k
   ├─ Override human decisions
   └─ Modify Constitution
```

---

## Governance of AI Contracts

### Contract Lifecycle

**Creation**:
1. Domain leader identifies need for AI employee
2. Domain leader drafts contract
3. Operations team reviews for feasibility
4. CFO/CRO reviews for risk
5. Executive approval
6. Contract becomes effective

**Operation**:
1. AI employee operates within contract
2. Decisions logged and monitored
3. Monthly performance review
4. Quarterly escalation analysis
5. Annual contract renewal/update

**Updating**:
1. If performance issues: Adjust contract
2. If scope changes: Update contract
3. If new authority needed: Formal amendment
4. Document all changes with approval

**Retirement**:
1. AI employee no longer needed
2. Final audit review
3. Archive contract and logs
4. Decommission AI

---

### Contract Audit

Quarterly audit checklist:

- [ ] Is AI operating within contract scope?
- [ ] Are escalations happening correctly?
- [ ] Is performance meeting standards?
- [ ] Are decisions accurate (>99%)?
- [ ] Any Constitutional violations detected?
- [ ] Any unauthorized decisions?
- [ ] Any errors that need learning?
- [ ] Should contract be updated?

---

## Related Decisions

- [ADR-007: Constitution Immutability](ADR-007%20Constitution%20Immutability.md) - AI must comply with Constitution
- [Document 14: AI Interaction Model](../14%20AI%20Interaction%20Model.md) - Detailed AI governance
- [Document 15: AI Employee Contract Template](../15%20AI%20Employee%20Contract.md) - Contract template
- [Document 13: Permissions and Authority](../13%20Permissions%20and%20Authority.md) - Authority hierarchy

---

## Questions & Clarifications

**Q: Why are these called "contracts" instead of "policies"?**  
A: Contracts imply mutual obligation - AI commits to operating within bounds, humans commit to supporting it with tools and decisions.

**Q: Can AI employees sub-delegate authority?**  
A: No. Authority is delegated from Constitution → Managing Director → Domain Leader → AI Employee. AI cannot further delegate.

**Q: What happens if AI makes decision outside contract?**  
A: Human reviews decision, overrides if wrong, updates contract/training to prevent recurrence, escalates if pattern emerges.

**Q: How do we handle AI disagreement with human decision?**  
A: AI escalates reasoning, human decides. AI implements decision even if disagrees (humans have final authority).

**Q: Can AI refuse to implement a decision?**  
A: Only if decision violates Constitution (immutable). Otherwise AI implements even if thinks decision is wrong.

---

## Consequences

### Positive

✓ **Clear Authority** - Everyone knows what AI can decide  
✓ **Scaled Automation** - AI automates within scope  
✓ **Human Control** - Humans have final authority  
✓ **Constitutional Compliance** - Constitution preserved  
✓ **Accountability** - Clear responsibility  
✓ **Governance** - Can verify AI compliance  

### Negative

✗ **Contract Overhead** - Time to create and maintain contracts  
✗ **Boundary Issues** - Harder for AI to go beyond scope (sometimes desirable)  
✗ **Compliance Burden** - Must audit regularly  

### Risks

- **Contract Too Restrictive** - AI can't automate effectively
- **Contract Too Loose** - AI exceeds authority
- **Contract Stale** - Not updated when needs change
- **Enforcement Failure** - AI not kept within contract

---

## Mitigation Strategies

### To Prevent Overly Restrictive Contracts

1. **Feedback Loop** - AI reports what it wanted to do but couldn't
2. **Regular Updates** - Quarterly reviews, update if needed
3. **Clear Communication** - AI explains why it wants to expand scope
4. **Pilot First** - Limited scope initially, expand if successful

### To Prevent Overly Loose Contracts

1. **Governance Review** - CFO/CRO review before approval
2. **Escalation Monitoring** - Track what gets escalated
3. **Risk Assessment** - Potential impact if AI decides wrong
4. **Conservative Start** - Tighter scope initially, relax if proven

### To Keep Contracts Current

1. **Quarterly Review** - Automatic trigger to review
2. **Change Log** - Track why contracts changed
3. **Approval Trail** - Document who approved changes
4. **Archive Old** - Keep historical versions

### To Enforce Compliance

1. **Technical Controls** - System prevents out-of-scope decisions
2. **Monitoring** - Automated checks for violations
3. **Audit Logging** - All decisions logged
4. **Review Process** - Regular audit of decisions

---

## Implementation Approach

### Phase 1 (Now): Define Contract Framework
- ✓ Create contract template
- ✓ Define governance process
- ✓ Document approval workflow

### Phase 2 (Q3 2026): First AI Employee
- [ ] Create Finance AI contract
- [ ] Get stakeholder approval
- [ ] Deploy with monitoring

### Phase 3 (Q4 2026): Additional AI Employees
- [ ] Create Sales AI contract
- [ ] Create Operations AI contract
- [ ] Deploy and monitor

### Phase 4 (2027): Expand and Refine
- [ ] Create additional AI employees
- [ ] Refine contract based on learning
- [ ] Scale audit process

---

## Approval

- **Proposed By**: Architecture Team  
- **Approved By**: CEO (Conditional on final Blueprint)  
- **Date Approved**: 2026-07-17  

**AI employees operate under explicit contracts defining scope, authority, escalation paths, and performance standards. Humans retain final authority in all important decisions.**
