# Permissions and Authority: Who Can Do What

AI Office operates under clear authority rules. This document defines permission levels, decision rights, and escalation paths that enable delegation while maintaining governance.

---

## Core Principle

**Authority flows from Constitution through delegated levels. Lower-level authority cannot override higher-level authority.**

```
Constitution (immutable rules)
    ↓ (delegates to)
Managing Director (executive authority)
    ↓ (delegates to)
Domain Leaders (functional authority)
    ↓ (delegates to)
Team Leads (operational authority)
    ↓ (delegates to)
Individual Contributors (execution authority)
```

---

## Authority Levels

### Level 1: Constitutional Authority
**Who**: Managing Director (with Board, if applicable)  
**Can Do**: Change Constitution (rarely, requires formal process)  
**Cannot Do**: Violate legal, ethical, or regulatory requirements  
**Approval**: Board or executive consensus  

### Level 2: Executive Authority
**Who**: Executive Leadership (CEO, CFO, COO, CHRO, CTO, etc.)  
**Can Do**:
- Set strategic direction
- Approve major changes
- Allocate resources
- Approve hiring/firing
- Approve major contracts
- Delegate authority

**Cannot Do**: Violate Constitution  
**Approval**: CEO or senior executive consensus  

### Level 3: Domain Authority
**Who**: Domain Leaders (VP, Head of, Officer)  
**Can Do**:
- Make decisions within domain
- Approve domain changes
- Allocate domain resources
- Establish domain standards
- Escalate to executive

**Cannot Do**:
- Violate Constitution
- Override Executive authority
- Change authority structure

**Approval**: Domain leader; escalate if conflicts  

### Level 4: Team Authority
**Who**: Team Leads, Managers  
**Can Do**:
- Assign work
- Approve routine decisions
- Make operational changes
- Manage team members
- Escalate to domain leader

**Cannot Do**:
- Violate Constitution
- Override Domain authority
- Make strategic decisions

**Approval**: Team lead; escalate if uncertain  

### Level 5: Individual Authority
**Who**: Individual Contributors (humans and AI)  
**Can Do**:
- Execute assigned work
- Make routine decisions
- Suggest improvements
- Escalate to manager

**Cannot Do**:
- Violate any authority level above

**Approval**: Self; escalate if uncertain  

---

## Decision Rights Matrix

### Strategic Decisions (Managing Director + Executive)

| Decision Type | Authority | Approval | Escalation |
|--------------|-----------|----------|------------|
| Company strategy | CEO | Board | Board |
| Org restructuring | CEO/COO | Board | Board |
| New business | CEO | Board | Board |
| Major capital | CFO | CEO | Board |
| Hiring executives | CEO | Board | Board |
| Compliance violation | Legal | CEO | Board |
| Constitutional change | CEO | Board | Board |

### Operational Decisions (Domain + Team Leads)

| Decision Type | Authority | Approval | Escalation |
|--------------|-----------|----------|------------|
| Process design | Dept Head | Domain Lead | Executive |
| Hiring | CHRO/Manager | Executive | CHRO/CEO |
| Performance management | Manager | Domain Lead | CHRO |
| Major expense | Manager | CFO | CFO |
| Customer commitment | Sales/Ops | Ops Lead | CEO |
| Product decision | Product Lead | CEO | CEO |
| Quality standard | Ops Lead | Domain Lead | COO |

### Routine Decisions (Team Level)

| Decision Type | Authority | Approval | Escalation |
|--------------|-----------|----------|------------|
| Task assignment | Manager | Self | Manager |
| Schedule | Manager | Self | Manager |
| Resource allocation | Manager | Manager | Domain |
| Work approval | Peer | Peer | Manager |
| Exception to policy | Manager | Manager | Domain |
| Escalation | Individual | Manager | Domain |

---

## Permission Scopes

### What Can Different Roles Do?

#### Managing Director (MD)
```
✅ CAN:
  - Set strategy and objectives
  - Approve all major decisions
  - Change governance framework
  - Hire/fire executives
  - Allocate company resources
  - Override any operational decision
  - Escalate to Board (if exists)

❌ CANNOT:
  - Violate law or Constitution
  - Make unilateral constitutional changes
  - Override Board (if exists)
```

#### Executive Leadership (CEO, COO, CFO, CHRO, CTO)
```
✅ CAN:
  - Make decisions in portfolio
  - Approve major domain changes
  - Allocate resources to domain
  - Hire/fire domain leaders
  - Delegate authority in domain
  - Approve domain escalations
  - Represent domain to MD

❌ CANNOT:
  - Violate Constitution
  - Override another executive (equals)
  - Make strategic decisions beyond domain
  - Bypass Domain framework
```

#### Domain/Department Leaders (VP, Head of, Officer)
```
✅ CAN:
  - Make decisions in domain
  - Approve within domain authority
  - Design processes and procedures
  - Approve hiring/firing in domain
  - Allocate domain resources
  - Escalate to executive
  - Set domain standards

❌ CANNOT:
  - Violate Constitution
  - Override Executive authority
  - Make company-wide decisions
  - Allocate beyond domain budget
```

#### Team Leads / Managers
```
✅ CAN:
  - Assign and manage work
  - Make routine decisions
  - Approve routine exceptions
  - Manage team members
  - Allocate team resources
  - Escalate to department lead
  - Make operational improvements

❌ CANNOT:
  - Violate Constitution
  - Override domain authority
  - Make strategic decisions
  - Allocate beyond budget
  - Hire/fire without approval
```

#### Individual Contributors
```
✅ CAN:
  - Execute assigned work
  - Make routine decisions (per role)
  - Suggest improvements
  - Escalate when uncertain
  - Ask for support
  - Request exceptions

❌ CANNOT:
  - Violate any authority level
  - Make decisions beyond role
  - Commit company resources
```

---

## AI Authority Model

### Sandy (Central Orchestration AI)

**Authority**: Delegated operational authority (under Managing Director)

```
✅ CAN:
  - Orchestrate daily operations
  - Assign work to AI employees and humans
  - Monitor organizational health
  - Alert to issues and risks
  - Recommend improvements
  - Route decisions to appropriate authority

❌ CANNOT:
  - Make strategic decisions
  - Change policies or Constitution
  - Hire/fire humans
  - Approve major capital spending
  - Make legal decisions
  - Override human decisions
```

**Escalation Path**:
```
Sandy identifies issue
    ↓
Sandy alerts appropriate person
    ↓
Human makes decision
    ↓
Sandy implements decision
    ↓
Sandy monitors results
```

### Specialist AI Employees

**Authority**: Limited, defined per contract

Each AI employee has explicit contract defining:
- What they can decide independently
- What requires human notification
- What requires human approval
- What they absolutely cannot do

Example: Finance AI
```
✅ CAN:
  - Approve invoices <$10,000 (approved vendors)
  - Process routine expenses
  - Generate standard reports
  - Flag anomalies

❌ CANNOT:
  - Approve >$50,000 (requires executive)
  - Change payment terms
  - Make hiring decisions
  - Override financial controls
```

**Escalation Path**:
```
AI analyzes situation
    ↓
If within authority: Act
    ↓
If requires approval: Request from human
    ↓
If uncertain: Escalate to manager
    ↓
Human decides
    ↓
AI implements
```

---

## Conflict Resolution

### When Authorities Conflict

**Rule 1: Higher authority wins**
- Executive > Department Head > Team Lead
- Constitution > all policies > procedures

**Rule 2: When peers conflict**
- Escalate to common authority level
- Document the conflict
- Authority level decides

**Rule 3: When AI conflicts with human authority**
- Human authority wins
- AI escalates to human
- Human decides
- AI implements

### Examples

**Conflict**: Department Head says "do X", Executive says "do Y"
- **Resolution**: Executive authority wins (higher level)
- **Process**: Execute Y, inform Department Head of conflict
- **Record**: Document why Y was chosen

**Conflict**: AI recommends automation, Operations says "not ready"
- **Resolution**: Operations authority wins (owns operations)
- **Process**: Don't automate, document reasoning
- **Learn**: Why are they opposed? Address concerns.

**Conflict**: Governance says "no exceptions", Team says "we need exception"
- **Resolution**: Governance wins (constitutional)
- **Process**: Find compliant solution, not exception
- **Escalate**: If truly needed, escalate to executive for constitutional amendment

---

## Approval Workflows

### Minor Decisions (No Approval Needed)
- Task assignment
- Day-to-day work
- Routine operational decisions
- Within standing authority

**Process**: Owner decides and acts

### Standard Decisions (Approval Needed)
- Process changes
- Hiring/firing (team level)
- Resource allocation
- Policy exceptions
- Contracts <$50k

**Process**:
1. Propose
2. Get approval from authority level
3. Implement
4. Document
5. Communicate

**Timeline**: Quick (same day to 1 week)

### Major Decisions (Executive Approval)
- Strategic direction
- Major expense (>$50k)
- Hiring executives
- Constitutional change
- System changes affecting multiple domains

**Process**:
1. Document proposal with rationale
2. Present to executive leadership
3. Get formal approval (email OK)
4. Announce decision
5. Implement
6. Communicate broadly

**Timeline**: Thoughtful (1-4 weeks)

### Constitutional Decisions (Board/MD Approval)
- Change Constitution
- Restructure company
- Major strategic pivot
- Legal/compliance issues
- Major capital (if >threshold)

**Process**:
1. Document thoroughly
2. Present to Board/MD
3. Get formal written approval
4. Announce decision
5. Implement
6. Update Constitution/governance docs

**Timeline**: Deliberate (4+ weeks)

---

## Exception to Authority

If someone wants to act outside their authority:

**Process**:
1. Request from appropriate higher authority
2. Provide context and rationale
3. Higher authority approves or denies
4. If approved: Document exception
5. If denied: Follow normal authority path
6. Learn: Why was exception needed?

**Documentation**:
- Who requested
- What they wanted to do
- Why
- Who approved
- Outcome
- Lessons learned

---

## Delegation of Authority

How authority gets delegated:

**Rules**:
- ✅ Explicit (documented in writing)
- ✅ Bounded (clear scope and limits)
- ✅ Revocable (can be removed)
- ✅ Accountable (delegator stays accountable)
- ✅ Limited (cannot sub-delegate beyond mandate)
- ❌ Cannot delegate away responsibility

**Example**:
"Managing Director delegates hiring authority for engineering to VP Engineering, up to $200k salary, for positions up to X reporting to them."

---

## Regular Authority Review

Quarterly, review:

- [ ] Are authority levels still appropriate?
- [ ] Are escalation paths working?
- [ ] Are conflicts being resolved fairly?
- [ ] Is anyone exceeding their authority?
- [ ] Is anyone constrained inappropriately?
- [ ] Do people understand their authority?
- [ ] Are decisions being made at right level?

If issues found:
1. Address with person/team
2. Clarify authority
3. Provide training if needed
4. Document decision
5. Monitor

---

## Key Principle

**Clear authority enables delegation and prevents chaos. Higher authority is constrained by Constitution. Lower authority is enabled by clear scope.**

When you know your authority, you can:
- Decide confidently within scope
- Know when to escalate
- Support decisions when you can't decide
- Understand why you can't do something

---

**Authority is delegated from Constitution through clear levels. Each person knows what they can decide and when to escalate.**

