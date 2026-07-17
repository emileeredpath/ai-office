# System Boundaries: Clear Separation Between Domains

Each domain owns specific information and responsibilities. System boundaries prevent duplication, clarify authority, and enable independent evolution. This document defines what belongs in each domain and what doesn't.

---

## Core Principle

**Each concept lives in one domain.** Other domains reference it, don't duplicate it.

---

## Domain 1: GOVERNANCE

**Owns**:
- Organizational constitution and founding principles
- Governance model and decision-making authority
- Rules that cannot be overridden
- Legal and compliance requirements
- Ethical guidelines and values
- Risk framework and management policy
- Audit and accountability requirements

**Does NOT Own**:
- How specific decisions are made (that's in Organisation or Operations)
- Policies specific to single domain (belongs to that domain)
- Day-to-day operational decisions
- People development (that's People domain)

**Boundary Check**:
- If it applies to all domains → Governance
- If it applies to one domain → That domain owns it
- If it's a rule that can be overridden → Not constitutional

---

## Domain 2: ORGANISATION

**Owns**:
- Organizational structure (hierarchy, departments, teams)
- Strategic direction (vision, mission, objectives)
- Business plans and roadmaps
- Organizational policies (not constitutional rules)
- Competitive strategy
- Organizational change and restructuring
- Performance management framework
- Departmental charters and responsibilities

**Does NOT Own**:
- How to hire people (that's People domain)
- How to execute operations (that's Operations domain)
- How to measure success (that's Analytics domain)
- How to build organizational culture (that's People domain)
- Constitutional rules (that's Governance domain)

**Boundary Check**:
- If it's "why are we organized this way" → Organisation
- If it's "how do we do the work" → Operations
- If it's "what are the constitutional rules" → Governance

---

## Domain 3: PEOPLE

**Owns**:
- Hiring and recruitment processes
- Onboarding and development
- Career paths and progression
- Compensation and benefits philosophy
- Performance management (not strategy)
- Culture and engagement
- Team dynamics and collaboration
- Succession planning
- Employee policies (not constitutional)

**Does NOT Own**:
- How to execute work (that's Operations domain)
- Organizational structure (that's Organisation domain)
- Strategy for growth (that's Organisation domain)
- How to measure organizational performance (that's Analytics domain)
- Constitutional rules about people (that's Governance domain)

**Boundary Check**:
- If it's about "how we attract and develop talent" → People
- If it's about "how we organize and structure" → Organisation
- If it's about "how we execute work with people" → Operations

---

## Domain 4: KNOWLEDGE

**Owns**:
- Process documentation and procedures
- Best practices and lessons learned
- Product and customer knowledge
- Decision records and rationale
- Reference materials and how-to guides
- Organizational learning resources
- Knowledge organization and retrieval
- Training and onboarding materials
- Case studies and examples

**Does NOT Own**:
- How to learn from experience (that's Memory domain)
- How to measure learning or improvement (that's Analytics domain)
- How to execute processes (that's Operations domain)
- Organizational memory and culture (that's Memory domain)
- Governance rules (that's Governance domain)

**Boundary Check**:
- If it's "what do we know about how to do this" → Knowledge
- If it's "what did we learn from doing this" → Memory
- If it's "how do we measure if we did it well" → Analytics
- If it's "how do we actually do it day to day" → Operations

---

## Domain 5: OPERATIONS

**Owns**:
- Core process definitions and design
- Quality standards and assurance
- Efficiency metrics and targets
- Operational procedures and workflows
- Incident management and escalation
- Continuous improvement initiatives
- Operational health and monitoring
- Risk management for operations
- SLAs and service levels
- Capacity planning

**Does NOT Own**:
- How to document processes (that's Knowledge domain)
- How to automate processes (that's Automation domain)
- How to measure organizational success (that's Analytics domain)
- What the process should be strategically (that's Organisation domain)
- How to learn from experience (that's Memory domain)

**Boundary Check**:
- If it's "how do we do this work" → Operations
- If it's "how do we improve this work" → Memory (for learning) + Analytics (for metrics)
- If it's "how do we automate this work" → Automation
- If it's "what should this process be" → Organisation (strategy) or Knowledge (documentation)

---

## Domain 6: ANALYTICS

**Owns**:
- Metrics and KPI definitions
- Dashboards and reporting
- Data collection and integration
- Data quality standards
- Historical analysis and trends
- Forecasting and predictions
- Performance visualization
- Anomaly detection and alerts
- Analytics models and algorithms
- Business intelligence

**Does NOT Own**:
- How to execute work (that's Operations domain)
- How to improve based on data (that's Operations + Memory domain)
- What to measure (that's each domain deciding; Analytics implements)
- How to automate data collection (that's Automation domain)
- Data privacy rules (that's Platform domain)

**Boundary Check**:
- If it's "how do we measure and visualize" → Analytics
- If it's "what should we do about what we see" → Operations or Leadership
- If it's "how do we collect this data" → Platform + Automation
- If it's "why is this metric important" → Organisation or Operations or People

---

## Domain 7: AUTOMATION

**Owns**:
- Workflow and process automation design
- RPA (Robotic Process Automation) implementation
- AI and machine learning applications
- Intelligent automation with AI
- Automation of decision-making (within authority)
- Integration between systems
- Automation governance and rules
- ROI analysis for automation
- Automation strategy and prioritization
- AI employee design and deployment

**Does NOT Own**:
- Core processes being automated (that's Operations domain)
- Documentation of processes (that's Knowledge domain)
- Who makes decisions (that's Governance domain)
- How to measure impact (that's Analytics domain)
- Technical infrastructure (that's Platform domain)

**Boundary Check**:
- If it's "how can we automate this work" → Automation
- If it's "should we automate this work" → Operations/Leadership (decision)
- If it's "what is the work we're automating" → Operations
- If it's "how well did automation work" → Analytics

---

## Domain 8: PLATFORM

**Owns**:
- System architecture and design
- Data model and database schema
- API specifications and interfaces
- Integration architecture
- Security architecture and standards
- Infrastructure and deployment
- Technology stack and tools
- Performance and reliability
- Monitoring and observability
- Scalability and capacity planning
- Disaster recovery and backup
- Vendor relationships and tools

**Does NOT Own**:
- What information to collect (that's each domain)
- How to use the platform (that's domain owners)
- Business rules (that's Governance/Operations domain)
- How data is processed (that's Automation/Operations domain)
- What to display to users (that's Experience domain)

**Boundary Check**:
- If it's "how do we build and maintain the technical foundation" → Platform
- If it's "what should we do with the platform" → Domain owners
- If it's "how do we show this to users" → Experience

---

## Domain 9: EXPERIENCE

**Owns**:
- User interface design and usability
- Navigation and wayfinding
- Search functionality
- Dashboard visualizations
- User experience and accessibility
- Mobile and alternative interfaces
- Help and support documentation
- User training and onboarding UI
- Adoption and engagement metrics
- User feedback collection

**Does NOT Own**:
- Data or calculations behind UI (that's other domains)
- Business logic (that's Governance/Operations/Automation)
- Technical infrastructure (that's Platform domain)
- How to measure if users are using this (that's Analytics + Experience)
- Policies about what users can see (that's Permissions domain)

**Boundary Check**:
- If it's "how do we show this to users" → Experience
- If it's "what data is being shown" → Other domains
- If it's "who can see this" → Permissions domain

---

## Cross-Domain Relationships

### Knowledge → Memory
- Knowledge documents "what we know about how to do this"
- Memory documents "what we learned from doing this"
- Knowledge answers "how do we do X?"
- Memory answers "how have we improved X?"

### Operations → Analytics
- Operations defines "what we do and how we do it"
- Analytics measures "how well we do it"
- Operations decides what to measure
- Analytics implements measurement

### Automation → Operations
- Operations owns the process
- Automation automates the process
- Operations stays responsible for results
- Automation is a tool Operations uses

### All → Governance
- Governance sets rules all must follow
- Other domains implement within rules
- Constitution cannot be overridden
- Other domains can be more specific

---

## Ownership and Authority

| Domain | Owner | Approves Changes | Reviews | Escalates To |
|--------|-------|-----------------|---------|--------------|
| Governance | CEO/Compliance | Board | Audit | Board |
| Organisation | CEO/COO | CEO | Board | Board |
| People | CHRO | CEO | CEO | Board |
| Knowledge | CKO/COO | Governance | Owners | COO |
| Operations | COO | CEO | Governance | CEO |
| Analytics | CIO/Analytics Lead | Domain Owners | Analytics | CIO |
| Automation | CAO/CIO | Operations | Governance | CEO |
| Platform | CTO | Governance | Security | CIO |
| Experience | CPO/Head of Design | Users | Analytics | CPO |

---

## Adding New Information

When deciding where new information belongs, ask:

1. **Is it a rule or principle?** → Governance
2. **Is it about organization or strategy?** → Organisation
3. **Is it about people?** → People
4. **Is it about how to do something?** → Knowledge (or Operations if it's the doing)
5. **Is it about doing the work?** → Operations
6. **Is it about measuring?** → Analytics
7. **Is it about automating?** → Automation
8. **Is it about the technical foundation?** → Platform
9. **Is it about how users interact?** → Experience

If still unclear: belongs to the domain that is most responsible for it.

---

## Handling Overlaps

If information could belong to multiple domains:

1. **Identify primary ownership** - Which domain is most responsible?
2. **Document there** - Put information in primary domain
3. **Cross-reference elsewhere** - Link from other domains to primary
4. **Clarify relationship** - Document how domains relate
5. **Single source of truth** - Only one authoritative version

Example:
- "How to hire" → People domain (primary)
- Operations references: "See People domain for hiring procedures"
- Only People domain updates this information

---

## Reviewing Boundaries

Quarterly review:

- [ ] Are any concepts documented in multiple domains?
- [ ] Is ownership of each piece of information clear?
- [ ] Are boundaries still making sense?
- [ ] Do domain owners agree with their scope?
- [ ] Are there orphaned pieces of information?
- [ ] Are any domains overloaded?

If issues found:
1. Clarify with domain owner
2. Update documentation
3. Consolidate if needed
4. Communicate changes

---

## Key Principle

Clear boundaries reduce:
- Duplication
- Confusion about who owns what
- Inconsistency
- Maintenance burden
- Rework

Clear boundaries enable:
- Independent domain evolution
- Clear responsibility
- Easy delegation
- Scalability
- Maintainability

---

**System boundaries are the foundation of architecture clarity. Each piece of information lives in one domain; other domains reference it.**

