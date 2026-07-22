# Phase 2: Refactoring Plan - Applying Architecture Blueprint

**Status**: In Progress  
**Start Date**: 2026-07-17  
**Target Duration**: Q2-Q3 2026 (8-12 weeks)  
**Owner**: Architecture Team  

---

## Overview

Phase 2 transforms the Architecture Blueprint from specification into operational reality. The focus is applying the nine-domain model and four-layer architecture to the existing eight systems (SYSTEM 01-08) without disrupting users.

**Goal**: Make the Architecture Blueprint the governing structure for how AI Office operates.

---

## Phase 2 Objectives

### Objective 1: Domain Ownership Established
**Timeline**: Weeks 1-2  
**Effort**: Small

- [ ] Assign domain leaders for all 9 domains
- [ ] Document reporting structure
- [ ] Publish domain owner directory
- [ ] Schedule quarterly domain reviews

**Ownership by Domain**:
```
Governance Domain → Chief Governance Officer (or CEO/Compliance)
Organisation Domain → Chief Operating Officer
People Domain → Chief Human Resources Officer
Knowledge Domain → Chief Knowledge Officer (or COO)
Operations Domain → Chief Operating Officer
Analytics Domain → Chief Analytics Officer (or CIO)
Automation Domain → Chief Automation Officer (or CIO)
Platform Domain → Chief Technology Officer
Experience Domain → Chief Product Officer (or VP Design)
```

**Deliverable**: Domain Ownership Roster document

---

### Objective 2: Information Reorganized by Domain
**Timeline**: Weeks 3-6  
**Effort**: Large

Within each SYSTEM, reorganize documentation to reflect domain ownership:

**SYSTEM 02 - Company** (Primary: Organisation Domain)
- [ ] Move org structure docs to Organisation domain section
- [ ] Move strategy docs to Organisation domain section
- [ ] Cross-reference with Governance (authority) and People (roles)
- [ ] Verify single ownership (no duplication)

**SYSTEM 03 - Employees** (Primary: People Domain)
- [ ] Move talent/hiring docs to People domain section
- [ ] Move culture docs to People domain section
- [ ] Cross-reference with Knowledge (training) and Operations (assignments)

**SYSTEM 04 - Knowledge** (Primary: Knowledge Domain)
- [ ] Move learning docs to Knowledge domain section
- [ ] Move decision records framework to Knowledge domain
- [ ] Move lessons learned to Knowledge domain
- [ ] Cross-reference all other domains

**SYSTEM 05 - Operations** (Primary: Operations Domain)
- [ ] Move process docs to Operations domain section
- [ ] Move SLA docs to Operations domain section
- [ ] Move quality standards to Operations domain
- [ ] Cross-reference Automation and Analytics

**SYSTEM 06 - Dashboard** (Primary: Analytics Domain)
- [ ] Move metrics/KPI docs to Analytics domain section
- [ ] Move reporting frameworks to Analytics domain
- [ ] Move data definitions to Analytics domain
- [ ] Cross-reference all other domains (all provide data)

**SYSTEM 07 - Memory** (Primary: Knowledge Domain)
- [ ] Consolidate with SYSTEM 04 Knowledge if duplicate
- [ ] Or establish as specialized Memory section within Knowledge
- [ ] Document relationship with Analytics (measures outcomes)

**SYSTEM 08 - Automation** (Primary: Automation Domain)
- [ ] Move workflow automation docs to Automation domain
- [ ] Move AI employee framework to Automation domain
- [ ] Move automation strategy to Automation domain
- [ ] Cross-reference Operations (what to automate) and Platform (how)

**SYSTEM 01 - Sandy** (Cross-Domain: Automation + Operations + Governance)
- [ ] Document Sandy's role as orchestrator across domains
- [ ] Reference authority contracts in Automation domain
- [ ] Reference operational directives in Operations domain
- [ ] Reference Constitutional constraints in Governance domain

**Deliverable**: Reorganized SYSTEM 01-08 documentation by domain

---

### Objective 3: Ownership Model Implemented
**Timeline**: Weeks 7-8  
**Effort**: Medium

- [ ] Add ownership metadata to all documents
  ```
  ---
  Owner: [Role/Name]
  Domain: [Domain Name]
  Last Updated: [Date]
  Next Review: [Date]
  Approval: [Who approved]
  ---
  ```

- [ ] Create ownership matrix for each domain
- [ ] Establish change approval process by domain
- [ ] Document who approves what type of changes

**Deliverable**: Complete ownership documentation for all information

---

### Objective 4: Authority Matrix Activated
**Timeline**: Weeks 9-10  
**Effort**: Medium

- [ ] Implement authority matrix in decision workflows
- [ ] Create approval templates by decision type
- [ ] Set up escalation paths in systems
- [ ] Train teams on authority levels

**Key Authority Levels** to formalize:
```
Constitutional (Managing Director + Board)
├─ Can: Change Constitution
├─ Cannot: Violate law or ethics
└─ Timeline: 4+ weeks (formal amendment)

Executive (CEO, CFO, COO, CHRO, CTO)
├─ Can: Strategic decisions, major changes
├─ Cannot: Override Constitution
└─ Timeline: 1-4 weeks

Domain (Domain Leaders)
├─ Can: Decisions within domain
├─ Cannot: Override executive decisions
└─ Timeline: Days to 1 week

Team (Managers)
├─ Can: Routine operational decisions
├─ Cannot: Override domain decisions
└─ Timeline: Same day

Individual
├─ Can: Execute assigned work
├─ Cannot: Exceed authority level
└─ Timeline: Immediate
```

**Deliverable**: Operational authority matrix with approval workflows

---

### Objective 5: Information Lifecycle Process Active
**Timeline**: Weeks 11-12  
**Effort**: Small

- [ ] Implement capture process (documents new info with source)
- [ ] Implement organization process (structure and enrich data)
- [ ] Implement analysis process (derive insights)
- [ ] Implement decision recording (capture what was decided and why)
- [ ] Implement learning process (track outcomes, extract lessons)

**Deliverable**: Operating information lifecycle across all domains

---

## Implementation Approach

### Change Strategy: Non-Disruptive Reorganization

**Key Principle**: Users don't see disruption. Systems remain familiar entry points while architecture improves underneath.

**Implementation Pattern**:
1. Create new domain-organized structure alongside existing systems
2. Keep existing system structure intact initially
3. Add cross-references between system and domain views
4. Gradually migrate users to domain-aware navigation
5. Eventually phase out system-only navigation (optional)

**Timeline**:
```
Weeks 1-4:  Ownership + initial reorganization
Weeks 5-8:  Complete reorganization + authority setup
Weeks 9-12: Lifecycle + training + stabilization
```

---

## Work Breakdown Structure

### Batch 1: Foundation (Weeks 1-2)
- Assign domain owners
- Publish organization structure
- Set up domain review schedule
- **Effort**: Small | **Owner**: Architecture Team

### Batch 2: Documentation (Weeks 3-6)
- Reorganize SYSTEM 01-08 by domain
- Add ownership metadata
- Create domain cross-reference maps
- **Effort**: Large | **Owner**: Domain Leads + Content Team

### Batch 3: Governance (Weeks 7-10)
- Implement ownership model
- Activate authority matrix
- Set up approval workflows
- Train teams
- **Effort**: Medium | **Owner**: Governance Lead + Domain Leads

### Batch 4: Operations (Weeks 11-12)
- Activate information lifecycle
- Verify consistency
- Complete training
- Final stabilization
- **Effort**: Small | **Owner**: Operations Lead

---

## Success Criteria

### By End of Week 2
- [ ] All 9 domain owners assigned
- [ ] Reporting structure documented
- [ ] Domain owner directory published

### By End of Week 6
- [ ] All SYSTEM 01-08 documentation reorganized by domain
- [ ] Ownership metadata on all documents
- [ ] Domain cross-reference maps created

### By End of Week 10
- [ ] Authority matrix operational
- [ ] Approval workflows functioning
- [ ] Teams trained on new structure

### By End of Week 12
- [ ] Information lifecycle active
- [ ] Domain reviews scheduled and happening
- [ ] Phase 2 considered complete and operational

---

## Key Dependencies

**Must Have**:
- Domain owners willing and able to lead
- Access to all documentation/systems
- Time for training and transition
- Executive sponsorship

**Should Have**:
- Clear communication plan
- Change management support
- Documentation tools/templates
- Training materials

---

## Risks and Mitigation

### Risk 1: User Confusion During Reorganization
**Impact**: High | **Probability**: Medium

**Mitigation**:
- Keep both system and domain navigation during transition
- Clear communication about "why" we're reorganizing
- Training before and during transition
- Support team ready for questions

---

### Risk 2: Ownership Conflicts
**Impact**: Medium | **Probability**: Medium

**Mitigation**:
- Clear domain definitions from Blueprint
- Single owner rule enforced
- Conflict resolution process documented
- Architecture team available to mediate

---

### Risk 3: Incomplete Domain Reorganization
**Impact**: Medium | **Probability**: High

**Mitigation**:
- Phased approach (one system at a time)
- Clear ownership of each phase
- Checkpoint reviews
- Don't move to next phase until current complete

---

### Risk 4: Authority Matrix Not Adopted
**Impact**: High | **Probability**: Medium

**Mitigation**:
- Build into systems/workflows (enforce technically)
- Training and communication
- Executive model adherence
- Regular review and adjustment

---

## Communication Plan

### Weekly
- Domain leads sync (15 min)
- Architecture team standup (30 min)
- Status updates to leadership

### Bi-Weekly
- All-hands update on Phase 2 progress
- Q&A session for teams

### Monthly
- Executive steering committee review
- Adjust plan if needed

---

## Next Steps (Immediate)

1. **This Week**:
   - Confirm domain owner assignments
   - Schedule initial domain lead meeting
   - Publish Phase 2 schedule

2. **Next Week**:
   - Domain owners review their domain documentation
   - Identify reorganization priorities
   - Begin documentation audit

3. **Week 3+**:
   - Begin SYSTEM 01 reorganization (Sandy)
   - Continue with other systems
   - Establish new processes

---

## Phase 3 Readiness

By end of Phase 2:
- ✓ Architecture Blueprint is operational reality
- ✓ Domain ownership established and working
- ✓ Authority matrix functioning
- ✓ Information organized by domain
- ✓ Teams understand new structure

**Phase 3 can then begin**: Building new platform capabilities (Sandy orchestrator, AI employees, automation, unified UI) using the foundation Phase 2 has created.

---

## Success Definition

**Phase 2 is successful when**:

1. All information is organized by domain with single ownership
2. Domain leaders are actively managing their domains
3. Authority matrix is operational and understood
4. Information lifecycle process is active
5. Teams can answer "who owns this information?" for anything
6. No duplicate ownership or information duplication
7. Cross-domain dependencies are clear and managed
8. Users understand the new structure (with support)

---

**Phase 2 transforms the Architecture Blueprint from specification into operational governance.**
