# Ownership Model: Clear Responsibility for All Information

Every piece of information in AI Office has a clear owner. The owner is responsible for accuracy, currency, and compliance. Clear ownership prevents duplication and confusion.

---

## Core Principle

**Every document, dataset, process, and system has exactly one owner.**

---

## What Ownership Means

An owner is responsible for:

✅ **Accuracy** - Information is correct  
✅ **Currency** - Information is up-to-date  
✅ **Completeness** - Information is not missing key details  
✅ **Clarity** - Information is clear and unambiguous  
✅ **Compliance** - Information meets governance requirements  
✅ **Accessibility** - Right people can access it  
✅ **Maintenance** - Updates happen when things change  
✅ **Retirement** - Old information is archived appropriately  

**NOT responsible for**:
- Reviewing every use (that's the user's responsibility)
- Controlling how information is used
- Ownership of derived/copied content
- Changes made by others (unless approved)

---

## Domain Ownership

| Domain | Owner | Authority Level | Reviews | Escalates To |
|--------|-------|-----------------|---------|--------------|
| **Governance** | Chief Governance Officer (or CEO/Compliance) | Executive | Board/Legal | Board |
| **Organisation** | Chief Operating Officer | Executive | CEO/Board | CEO/Board |
| **People** | Chief Human Resources Officer | Executive | CEO | CEO |
| **Knowledge** | Chief Knowledge Officer (or COO) | Senior Manager | Governance Officer | COO |
| **Operations** | Chief Operating Officer | Executive | Governance Officer | CEO |
| **Analytics** | Chief Analytics Officer (or CIO) | Senior Manager | Domain Owners | CIO |
| **Automation** | Chief Automation Officer (or CIO) | Senior Manager | Operations/Governance | CIO |
| **Platform** | Chief Technology Officer | Executive | Governance Officer | CIO/CEO |
| **Experience** | Chief Product Officer (or VP Design) | Senior Manager | Users/Analytics | CPO/CEO |

---

## Information Ownership Within Domains

### Governance Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Constitution | CEO with Board approval | Can only change by constitutional amendment |
| Governance Framework | CGO/CEO | Governance changes |
| Compliance Requirements | Legal Officer | Ensures regulatory compliance |
| Risk Framework | Chief Risk Officer | Risk management |
| Audit Requirements | Internal Audit | Audit standards |
| Ethical Guidelines | Ethics Officer | Ethical standards |

### Organisation Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Org Structure | COO | Organizational changes |
| Strategic Plan | CEO/Strategy Officer | Strategic decisions |
| Quarterly Objectives | COO/CEO | Performance management |
| Business Plan | CFO/CEO | Financial planning |
| Departmental Charter | Department Head | Department definition |

### People Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Hiring Policy | CHRO | Recruitment standards |
| Compensation Plan | CFO/CHRO | Pay structure |
| Performance System | CHRO | Evaluation process |
| Development Plans | CHRO | Career development |
| Culture Guidelines | CHRO | Culture standards |
| Benefits Policy | CHRO | Benefits administration |

### Knowledge Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Process Documentation | Process Owner (Operations) | Process definition |
| Best Practices | Knowledge Officer | Learning/improvement |
| Lessons Learned | Knowledge Officer | Institutional memory |
| Product Knowledge | Product Manager | Product information |
| Customer Knowledge | Customer Officer | Customer understanding |
| Decision Records | Decision Maker | Why decisions were made |

### Operations Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Core Processes | Department Head | Process design |
| Quality Standards | Operations Manager | Quality definition |
| Procedures | Process Owner | How things are done |
| SLAs | Operations Head | Service levels |
| Incident Procedures | Incident Commander | Incident response |
| Performance Targets | Operations Head | Efficiency targets |

### Analytics Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Metrics Definitions | Analytics Lead | What we measure |
| Dashboard Definitions | Analytics Lead | How we display data |
| Data Standards | Data Steward | Data quality |
| Historical Data | Data Steward | Historical records |
| Models & Algorithms | Data Scientist | Analysis methods |
| Forecasts | Analytics Lead | Predictions |

### Automation Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| Automation Strategy | Automation Lead | What to automate |
| Workflow Definitions | Automation Engineer | Automated processes |
| AI Employee Contracts | Automation Lead | AI authority |
| Integration Specs | Integration Engineer | System connections |
| ROI Analysis | Automation Lead | Automation value |
| Automation Rules | Automation Lead | Automation logic |

### Platform Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| System Architecture | CTO | Technical design |
| Data Model | Data Architect | Data structure |
| API Specifications | API Manager | Integration interface |
| Security Architecture | Chief Security Officer | Security standards |
| Infrastructure Code | Infrastructure Lead | Infrastructure definition |
| Performance Standards | Platform Lead | Technical requirements |

### Experience Domain

| Information | Owner | Authority |
|-------------|-------|-----------|
| UI/UX Standards | Chief Design Officer | Design standards |
| Navigation Structure | Product Manager | How to find things |
| Dashboard UI | UI Designer | Dashboard design |
| Help Documentation | Technical Writer | User help |
| Training Materials | Learning & Development | Training content |
| Accessibility Standards | Accessibility Officer | Accessibility requirements |

---

## Individual Document Ownership

For each document in the repository:

```markdown
---
Owner: [Name/Role]
Domain: [Domain Name]
Last Updated: [Date]
Next Review: [Date]
Approval: [Who approved this version]
---
```

Example:
```markdown
---
Owner: Chief Operating Officer
Domain: Operations
Last Updated: 2026-07-17
Next Review: 2026-10-17 (quarterly)
Approval: CEO (strategic changes), COO (operational changes)
---
```

---

## Updating Owned Information

### Minor Updates (Typos, Clarity)
- **Approval**: Owner can approve
- **Process**: Update document, note change, commit
- **Communication**: Notify stakeholders if important

### Substantive Changes (Policy changes, new procedures)
- **Approval**: Owner approves, Governance may need to review
- **Process**: Draft change, get approval, update, communicate
- **Communication**: All stakeholders must be notified
- **Timing**: Allow review period before implementation

### Major Changes (Framework changes, new systems)
- **Approval**: Multiple approvers (owner + executive leadership)
- **Process**: Formal change request, review period, approval, implementation
- **Communication**: Widespread notification, training if needed
- **Record**: Create ADR or change log entry

---

## Handling Absentee Owners

If an owner leaves or is unavailable:

1. **Identify backup owner** (documented in role)
2. **Notify stakeholders** of temporary change
3. **Review for accuracy** (backup may need to refresh)
4. **Assign permanent owner** (if needed)
5. **Update ownership documentation**

---

## Shared Information

Some information is shared by multiple domains:

**Example**: "Customer Data"
- **Primary Owner**: Customer Domain (or Sales)
- **Secondary Users**: Operations (service), Analytics (metrics), Platform (storage)

**Pattern**:
- One primary owner (responsible)
- Secondary users reference primary
- Primary owner notified of changes affecting secondaries
- Changes go through primary owner, not directly

---

## Access Control and Ownership

**Ownership ≠ Access Control**

- **Owner**: Responsible for accuracy and maintenance
- **Access**: Governed separately by Permissions domain
- **Read-only access**: Many may have read-only access
- **Edit authority**: Owner and approved editors
- **Delete authority**: Typically owner + governance

---

## Reviewing Ownership

Quarterly ownership review:

- [ ] Is every document/dataset owned?
- [ ] Are owners accurate (person still in role)?
- [ ] Are owners responsive (updating as needed)?
- [ ] Are there orphaned pieces of information?
- [ ] Are there contested ownerships?
- [ ] Do owners know they are owners?
- [ ] Are backup owners documented?

If issues found:
1. Clarify ownership with leadership
2. Document clearly
3. Notify owner of responsibility
4. Provide support if needed
5. Update this document

---

## Owner Responsibilities Checklist

Each owner should:

- [ ] Understand what information they own
- [ ] Know who depends on it
- [ ] Review regularly for accuracy
- [ ] Update when things change
- [ ] Notify stakeholders of changes
- [ ] Archive when no longer needed
- [ ] Have backup owner
- [ ] Know escalation path

---

## Key Principle

**Clear ownership prevents duplication, ensures accuracy, and enables accountability.**

When you know who owns something, you know:
- Who to ask for clarification
- Who to notify of changes
- Who is responsible if it's wrong
- Who approves updates
- Who maintains it over time

---

**Every piece of information in AI Office has a clear owner responsible for its accuracy and maintenance.**

