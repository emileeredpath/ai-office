# Repository Structure: How Documentation and Code Are Organized

The repository is organized hierarchically to make documentation discoverable, maintainable, and useful as the single source of truth. Architecture documents, domain references, decision records, and implementation code follow clear patterns.

---

## Repository Root Structure

```
ai-office/
├─ README.md (navigation and overview)
├─ Architecture/ (governing documentation)
├─ SYSTEM-01-Sandy/ (user-facing system 1)
├─ SYSTEM-02-Company/ (user-facing system 2)
├─ SYSTEM-03-Employees/ (user-facing system 3)
├─ SYSTEM-04-Knowledge/ (user-facing system 4)
├─ SYSTEM-05-Operations/ (user-facing system 5)
├─ SYSTEM-06-Dashboard/ (user-facing system 6)
├─ SYSTEM-07-Memory/ (user-facing system 7)
├─ SYSTEM-08-Automation/ (user-facing system 8)
├─ Domains/ (optional - domain-specific content as repository grows)
├─ Implementation/ (code, databases, deployment)
├─ Docs/ (user-facing documentation)
└─ .github/ (GitHub workflows, issue templates)
```

---

## Architecture/ Directory Structure

The architecture layer is the governing documentation:

```
Architecture/
├─ README.md (navigation, status, key concepts)
├─ 00 North Star.md (vision and roadmap)
├─ 01 Architectural Principles.md (10 governing principles)
├─ 02 Platform Overview.md (high-level architecture)
├─ 03 Layer Model.md (4-layer architecture detail)
├─ 04 Domain Model.md (9-domain architecture detail)
├─ 05 Organisational Hierarchy.md (org structure flexibility)
├─ 06 System Boundaries.md (clear domain separation)
├─ 07 Dependency Model.md (how systems depend on each other)
├─ 08 Information Architecture.md (4 information systems)
├─ 09 [Future]
├─ 10 Information Lifecycle.md (capture to learning phases)
├─ 11 Systems of Record.md (external authoritative sources)
├─ 12 Ownership Model.md (who owns what)
├─ 13 Permissions and Authority.md (authority hierarchy)
├─ 14 AI Interaction Model.md (how AI components work)
├─ 15 AI Employee Contract.md (AI role definitions)
├─ 16 [Future]
├─ 17 [Future]
├─ 18 Integration Model.md (system integrations)
├─ 19 [Future]
├─ 20 [Future]
├─ 21 [Future]
├─ 22 Multi-Company Architecture.md (supporting multiple companies)
├─ 23 Configuration and Inheritance.md (settings cascade)
├─ 24 Security and Privacy.md (protecting data and authority)
├─ 25 [Future]
├─ 26 [Future]
├─ 27 [Future]
├─ 28 Repository Structure.md (this document)
├─ 29 [Future]
├─ 30 [Future]
├─ 31 [Future]
├─ 32 [Future]
├─ 33 Migration Strategy.md (moving from current state)
├─ 34 Platform Roadmap.md (2-5 year evolution)
├─ 35 Architecture Decision Log.md (index of all ADRs)
│
├─ Decisions/ (Architectural Decision Records)
│  ├─ ADR-000 ADR Template.md (empty template)
│  ├─ ADR-001 Documentation as Source of Truth.md
│  ├─ ADR-002 Nine-Domain Model.md
│  ├─ ADR-003 [Future]
│  ├─ ADR-004 [Future]
│  ├─ ADR-005 [Future]
│  ├─ ADR-006 [Future]
│  ├─ ADR-007 Constitution Immutability.md
│  └─ ADR-008 [Future]
│
├─ EXECUTIVE_ARCHITECTURE_REVIEW.md (status, risks, recommendations)
└─ [Status Indicators]
   ├─ _PHASE1_COMPLETE (Phase 1 foundation complete)
   ├─ _PHASE2_IN_PROGRESS (Batch 1-6 documentation underway)
   └─ [Batch indicators as phases progress]
```

---

## System Directories (SYSTEM-01 through SYSTEM-08)

Each system directory contains:

```
SYSTEM-02-Company/
├─ README.md (System overview, navigation)
├─ 01 Purpose and Scope.md
├─ 02 Core Concepts.md
├─ 03 Organizational Structure.md
├─ 04 Key Processes.md
├─ 05 Performance Management.md
├─ 06 Strategic Planning.md
├─ 07 API and Integration.md
├─ Reference/ (external reference material)
│  └─ [External links, third-party docs]
└─ Implementation/
   ├─ Datamodel.md
   ├─ APIs.md
   └─ Deployment.md
```

---

## Architecture Document Naming

**Standard format**:
```
NN Name of Document.md
```

Where:
- `NN` = two-digit number (00-99)
- Number determines sequence in Architecture/ directory
- Numbers allow future insertion without renaming

**Examples**:
```
00 North Star.md (foundational vision)
01 Architectural Principles.md
02 Platform Overview.md
...
33 Migration Strategy.md
34 Platform Roadmap.md
35 Architecture Decision Log.md
```

---

## Document Status Tracking

Each document has a status block at top:

```markdown
---
Owner: [Role/Name]
Domain: [Domain Name]
Status: [Not Started|In Progress|Draft Complete|Under Review|Approved|Implemented]
Last Updated: [Date]
Next Review: [Date]
Approval: [Who approved this version]
---
```

**Status Values**:
- **Not Started**: Planned but work hasn't begun
- **In Progress**: Work underway
- **Draft Complete**: Content written, needs review
- **Under Review**: Submitted for approval
- **Approved**: Approved (architectural or formal)
- **Implemented**: Implemented in code/systems
- **Deprecated**: Superseded, kept for historical reference

---

## Cross-Reference Patterns

Documents link to each other using:

**Relative Links** (within Architecture/):
```markdown
[ADR-001: Documentation as Source of Truth](Decisions/ADR-001%20Documentation%20as%20Source%20of%20Truth.md)

[Domain Model](04%20Domain%20Model.md)
```

**Absolute Links** (to Systems):
```markdown
[SYSTEM-02: Company Structure](../SYSTEM-02-Company/README.md)

[SYSTEM-05: Operations Processes](../SYSTEM-05-Operations/README.md)
```

**Anchor Links** (within same document):
```markdown
[See Configuration Inheritance](#configuration-inheritance)
```

---

## Document Metadata

Each document maintains metadata section:

```markdown
# Document Title

**Status**: [Approval status]  
**Owner**: [Role responsible]  
**Domain**: [Nine-domain classification]  
**Last Updated**: [Date]  
**Next Review**: [Date]  
**Version**: [Number]  
**Related Documents**:
- [ADR-001: Documentation as Source of Truth](Decisions/ADR-001%20Documentation%20as%20Source%20of%20Truth.md)
- [Document 02: Platform Overview](02%20Platform%20Overview.md)

---
```

---

## Implementation Directory Structure

As code is written, it follows domains underneath:

```
Implementation/
├─ src/
│  ├─ governance/ (Constitution, policies, standards)
│  │  ├─ constitution.ts
│  │  ├─ authority.ts
│  │  └─ compliance.ts
│  │
│  ├─ knowledge/ (Documentation, processes, reference)
│  │  ├─ documentation.ts
│  │  ├─ memory.ts
│  │  └─ learning.ts
│  │
│  ├─ people/ (Talent, culture, HR)
│  │  ├─ employment.ts
│  │  ├─ development.ts
│  │  └─ culture.ts
│  │
│  ├─ operations/ (Processes, execution)
│  │  ├─ workflow.ts
│  │  ├─ sla.ts
│  │  └─ incident.ts
│  │
│  ├─ analytics/ (Metrics, intelligence)
│  │  ├─ dashboard.ts
│  │  ├─ metrics.ts
│  │  └─ forecasting.ts
│  │
│  ├─ automation/ (AI, workflows)
│  │  ├─ sandy/ (Central orchestrator)
│  │  ├─ workflows/
│  │  └─ ai-employees/
│  │
│  ├─ platform/ (Infrastructure, APIs)
│  │  ├─ api.ts
│  │  ├─ database.ts
│  │  └─ infrastructure.ts
│  │
│  ├─ experience/ (UI, dashboards)
│  │  ├─ ui.ts
│  │  ├─ dashboards.ts
│  │  └─ navigation.ts
│  │
│  └─ shared/ (Cross-cutting)
│     ├─ auth.ts
│     ├─ logging.ts
│     └─ errors.ts
│
├─ tests/ (Tests organized by domain)
│  └─ [mirrors src/ structure]
│
├─ database/
│  ├─ migrations/
│  ├─ schemas/
│  └─ seeds/
│
└─ deployment/
   ├─ kubernetes/
   ├─ docker/
   └─ terraform/
```

---

## Special Files and Directories

### Key Status Documents

```
Architecture/
├─ README.md (navigation and status)
├─ EXECUTIVE_ARCHITECTURE_REVIEW.md (comprehensive status)
├─ _PHASE1_COMPLETE (marker file for phase completion)
├─ _PHASE2_BATCH1_COMPLETE (marker file for batch completion)
└─ Decisions/
   ├─ ADR-000 ADR Template.md (template for new ADRs)
   └─ ADR-### [Decisions].md (approved decisions)
```

---

### .github/ Directory

GitHub-specific files:

```
.github/
├─ workflows/
│  ├─ ci.yml (continuous integration)
│  ├─ validation.yml (document validation)
│  └─ deployment.yml (deployment automation)
│
├─ ISSUE_TEMPLATE/
│  ├─ bug.md
│  ├─ feature.md
│  └─ architecture-decision.md
│
├─ pull_request_template.md
└─ README.md (GitHub-specific setup)
```

---

### Docs/ Directory

User-facing documentation (separate from Architecture):

```
Docs/
├─ Getting Started/ (onboarding docs)
├─ User Guides/ (how to use systems)
├─ Admin Guides/ (administration)
├─ API Reference/ (technical API docs)
└─ Glossary.md (terms and definitions)
```

---

## Document Discovery

### Architecture README Navigation

Architecture/README.md serves as primary navigation:

```markdown
# Architecture Layer

**Current Status**: Phase 2 (Batch 1-3 in progress)

## Navigation by Purpose

### If you want to understand the vision...
- [00 North Star](00%20North%20Star.md) - 10-year vision
- [01 Architectural Principles](01%20Architectural%20Principles.md) - Governing principles

### If you want to understand the structure...
- [02 Platform Overview](02%20Platform%20Overview.md) - High-level architecture
- [03 Layer Model](03%20Layer%20Model.md) - Four-layer architecture
- [04 Domain Model](04%20Domain%20Model.md) - Nine-domain model

### If you want to understand governance...
- [13 Permissions and Authority](13%20Permissions%20and%20Authority.md)
- [Decisions/ADR-007 Constitution Immutability](Decisions/ADR-007%20Constitution%20Immutability.md)

### If you want to understand operations...
- [08 Information Architecture](08%20Information%20Architecture.md)
- [18 Integration Model](18%20Integration%20Model.md)
- [28 Repository Structure](28%20Repository%20Structure.md)

## Architecture Decision Records

All significant architectural decisions are recorded as ADRs:
- [ADR Index](35%20Architecture%20Decision%20Log.md) (complete list)
```

---

## Naming Conventions

### Documents

```
Architecture/
├─ NN Name of Topic.md
├─ Decisions/
│  └─ ADR-### Topic.md
└─ No spaces except: between number and name
```

**Rules**:
- Use descriptive names (not "Document 1", but "Domain Model")
- Number documents for ordering
- Use sentence case (not Title Case)
- Add domain in metadata, not filename

---

### Code

```
src/
├─ governance/
├─ knowledge/
└─ people/

Each domain is lowercase, hyphenated if multiple words:
├─ ai_interaction/ ✓
├─ customer_data/ ✓
├─ AIInteraction/ ✗ (use snake_case)
└─ customerData/ ✗ (use snake_case)
```

---

### Commits

Architecture document commits follow pattern:

```
docs: add Architecture Document 10 - Information Lifecycle

- Document information lifecycle phases (capture, organization, analysis, decision, learning)
- Define responsibilities at each phase
- Provide examples and lifecycle diagrams
- Add quality standards and retention rules

Status: Draft Complete
Domain: Knowledge
```

---

## Documentation Quality Standards

Every document should:

- ✅ Have clear purpose (stated in opening)
- ✅ Be discoverable (linked from navigation)
- ✅ Include metadata (owner, status, dates)
- ✅ Have table of contents (for long docs)
- ✅ Use consistent heading levels
- ✅ Include diagrams/visualizations
- ✅ Provide examples
- ✅ State key principles clearly
- ✅ Link to related documents
- ✅ Specify review/update frequency

---

## Repository Maintenance

### Quarterly Tasks

- [ ] Update status documents (README, EXECUTIVE_ARCHITECTURE_REVIEW)
- [ ] Verify all cross-references work
- [ ] Check for outdated information
- [ ] Update document owner if roles changed
- [ ] Review broken links
- [ ] Merge any draft content into finalized docs
- [ ] Clean up deprecated content

### Annual Tasks

- [ ] Review entire Architecture layer
- [ ] Update vision (North Star) if needed
- [ ] Consolidate lessons learned
- [ ] Plan next year's focus areas
- [ ] Archive completed initiatives
- [ ] Refresh decision log

---

## Tools and Automation

### Document Validation

Automated checks:
- Links are valid (no broken references)
- Metadata present and accurate
- No duplicate document names/numbers
- Status values are valid
- Required sections present

**Automated via**: GitHub Actions, pre-commit hooks

---

### Version Control

Repository uses:
- **Main**: Always represents approved architecture
- **Feature branches**: For work in progress
- **Pull requests**: All changes go through review
- **Commit messages**: Descriptive and linked to work

---

## Key Principle

**The repository is organized to make the architecture the single source of truth. Documentation follows clear patterns, is discoverable, and is maintainable long-term.**

When repository is well-organized:
- Documents are easy to find
- Cross-references work
- Status is always current
- Changes are tracked
- Architecture evolves intentionally

---

**Clear repository structure makes documentation discoverable and maintainable as the system's source of truth.**
