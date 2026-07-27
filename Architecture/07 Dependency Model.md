# Dependency Model: How Systems Depend on Each Other

The nine domains depend on each other in specific ways. Understanding these dependencies is critical for making changes safely, planning implementations, and identifying risks.

---

## Dependency Principle

**Lower layers are depended on; higher layers depend on them.**

```
GOVERNANCE (depended on by all)
    ↑
ORGANISATION (depended on by Operations, People, Analytics)
    ↑
KNOWLEDGE, OPERATIONS, PEOPLE (middle layer)
    ↑
AUTOMATION, ANALYTICS (use middle layer)
    ↑
PLATFORM (supports all)
    ↑
EXPERIENCE (consumes all)
```

---

## Dependency Matrix

### What Each Domain Depends On

| Domain | Depends On | Strength | Impact if Missing |
|--------|-----------|----------|-------------------|
| **Governance** | Nothing | — | CRITICAL - foundation breaks |
| **Organisation** | Governance | Hard | HIGH - strategy not constrained |
| **People** | Governance, Organisation | Hard | HIGH - hiring not aligned |
| **Knowledge** | Governance | Medium | MEDIUM - documentation not ruled |
| **Operations** | Governance, Organisation, Knowledge | Hard | CRITICAL - execution unclear |
| **Analytics** | Operations, Knowledge, Governance | Medium | MEDIUM - metrics not meaningful |
| **Automation** | Operations, Knowledge, Governance | Hard | HIGH - automation not aligned |
| **Platform** | Governance | Hard | CRITICAL - infrastructure fails |
| **Experience** | All others | Soft | MEDIUM - UI lacks content |

---

## Critical Path Dependencies

### Governance (Depended on by ALL)
**No domain works without Governance layer.**

All other domains must:
- Follow constitutional rules
- Respect governance framework
- Implement oversight
- Maintain audit trails

**Impact of change**: Any change to Governance affects all other domains.

### Organisation → Execution Path
```
Governance (rules)
    ↓ (constrains)
Organisation (strategy)
    ↓ (directs)
Operations (execution)
    ↓ (implements through)
Automation (workflow efficiency)
    ↓ (measured by)
Analytics (performance)
```

If Organisation strategy changes:
- Operations must adapt procedures
- Automation must adapt workflows
- Analytics must track new metrics

### Knowledge → Execution Path
```
Governance (rules)
    ↓ (constrain)
Knowledge (how to do things)
    ↓ (enables)
Operations (actual execution)
    ↓ (learns from)
Memory (improvement)
```

If Knowledge is incomplete:
- Operations has gaps in procedures
- Automation cannot automate incomplete procedures
- Memory cannot capture what wasn't documented

---

## Specific Dependencies

### Operations Depends On

1. **Governance** (Hard dependency)
   - Constitutional rules for operations
   - Compliance requirements
   - Authority levels
   - Cannot operate outside governance

2. **Organisation** (Hard dependency)
   - Strategic direction
   - Organizational structure
   - Departmental objectives
   - Operations must support strategy

3. **Knowledge** (Hard dependency)
   - Process documentation
   - Best practices
   - Standards and procedures
   - Operations implements documented knowledge

4. **Platform** (Hard dependency)
   - Infrastructure to run operations
   - Data systems
   - Integrations
   - Without platform, operations cannot execute

5. **Memory** (Soft dependency)
   - Lessons from past operations
   - Continuous improvement insights
   - Without memory, operations don't improve

### Automation Depends On

1. **Operations** (Hard dependency)
   - Core processes to automate
   - Without clear operations, automation unclear
   - Automation serves operations, not reverse

2. **Knowledge** (Hard dependency)
   - Documented procedures to automate
   - Without documentation, automation cannot model procedures
   - Automation cannot improve what's not documented

3. **Governance** (Hard dependency)
   - Rules for what can be automated
   - Authority limits for automation
   - Compliance requirements

4. **Platform** (Hard dependency)
   - Technical infrastructure
   - APIs and integrations
   - Without platform, automation has nowhere to run

### Analytics Depends On

1. **Operations** (Hard dependency)
   - Data from actual execution
   - Metrics to measure
   - Without operations, nothing to measure

2. **Knowledge** (Medium dependency)
   - Context for interpreting metrics
   - What metrics mean
   - Without context, metrics are meaningless

3. **Platform** (Hard dependency)
   - Data systems
   - Integrations to collect data
   - Computational power
   - Without platform, cannot analyze

4. **Governance** (Medium dependency)
   - Rules about what data to collect
   - Compliance and privacy rules
   - Who can see what

### Experience Depends On

1. **All other domains** (Soft dependency)
   - Content to display
   - Data to visualize
   - Processes to surface
   - Without other domains, UI has nothing to show

2. **Platform** (Hard dependency)
   - Technical infrastructure
   - APIs to fetch data
   - Performance requirements

---

## Circular Dependencies (Must Manage)

### Operations → Memory → Operations
```
Operations executes work
    ↓
Memory captures what was learned
    ↓
Operations improves based on learning
    ↓
(back to Operations)
```

**Management**: Clear that this is healthy cycle, not deadlock. Memory doesn't depend on Operations completing perfectly; learns from experience.

### Analytics → Decisions → Analytics
```
Analytics measures performance
    ↓
Leaders make decisions based on analytics
    ↓
Operations changes based on decisions
    ↓
Analytics measures new performance
    ↓
(back to Analytics)
```

**Management**: Healthy feedback loop. No deadlock if Analytics has initial baseline data.

### Knowledge → Operations → Knowledge
```
Knowledge documents how to do things
    ↓
Operations executes and discovers better ways
    ↓
Knowledge captures improvements
    ↓
(back to Knowledge)
```

**Management**: This is learning cycle. Knowledge is starting point; improvements are learned.

---

## Breaking Dependencies (Risk Assessment)

### What Breaks If Governance Changes?
- Everything is impacted
- Must validate all domains still comply
- Cannot break constitutional rules in one domain without affecting all

### What Breaks If Operations Changes?
- Automation must adapt
- Analytics metrics may change
- Memory captures new learning
- Other domains see operational impact

### What Breaks If Knowledge Changes?
- Operations procedures must adapt
- Automation retrains on new procedures
- Training materials update
- Memory compares old vs. new approach

### What Breaks If Platform Changes?
- All execution affected
- Performance may change
- Integrations may break
- Analytics must revalidate

---

## Adding New Functionality

### Impact Assessment Framework

When adding new functionality, ask:

1. **What domain does it belong to?** (Use System Boundaries)
2. **What does it depend on?** (Answer using this model)
3. **What depends on it?** (Reverse dependencies)
4. **What breaks if it's not implemented correctly?** (Impact analysis)
5. **What breaks if it fails?** (Failure analysis)
6. **Can it wait for dependencies?** (Sequencing)
7. **What must be done first?** (Critical path)

### Example: Adding New Metric

New metric: "Customer satisfaction score"

**Depends On**:
- Knowledge: Definition of customer satisfaction
- Operations: Customer touchpoints to measure
- Platform: Data collection infrastructure
- Analytics: Visualization and reporting

**Depended On By**:
- Organisation: Uses for strategic decisions
- Operations: Uses to improve processes
- People: Uses for performance evaluation
- Experience: Displays in dashboard

**Can be built if**:
- Definition exists (Knowledge)
- Data collection possible (Platform)
- Touchpoints identified (Operations)

**Breaks if**:
- Definition is unclear → wrong metric
- Data collection fails → no metric
- Governance rules prohibit collecting data → cannot measure

---

## Safe Change Sequencing

### Rule 1: Change Dependencies Before Dependents

```
1. Change Governance (if needed)
2. Update Organisation (if affected)
3. Update Knowledge (if affected)
4. Adapt Operations (if affected)
5. Adjust Automation (if affected)
6. Update Analytics (if affected)
7. Refresh Experience (if affected)
```

### Rule 2: Cannot Break Upward Dependencies

Cannot:
- Automation can break Operations (its dependency)
- Analytics can break Operations (its dependency)
- Experience can break any domain (violates separation)

Can:
- Operations can be enhanced without affecting Governance
- Domain can improve without affecting all dependents

### Rule 3: When Dependencies Unclear

1. Check if going both directions
2. If both directions, it's a feedback loop (manage carefully)
3. If unclear, ask domain owner
4. Document the decision

---

## Handling Dependency Failures

### If Governance Fails
**Impact**: CRITICAL  
**Action**: All other systems must stop or operate in safe mode  
**Owner**: Executive leadership  

### If Operations Fails
**Impact**: CRITICAL  
**Action**: Automation stops, Analytics goes stale, Memory can't capture  
**Owner**: COO  

### If Knowledge is Incomplete
**Impact**: HIGH  
**Action**: Operations has gaps, Automation cannot automate  
**Owner**: Knowledge steward  

### If Platform Fails
**Impact**: CRITICAL  
**Action**: Entire system cannot execute  
**Owner**: CTO  

### If Analytics Fails
**Impact**: MEDIUM  
**Action**: Leadership blind to performance  
**Owner**: Analytics team  

---

## Quarterly Dependency Review

Every quarter, review:

- [ ] Are dependencies still accurate?
- [ ] Have new dependencies emerged?
- [ ] Are any dependencies broken?
- [ ] Are circular dependencies healthy?
- [ ] Can any dependencies be reduced?
- [ ] Are all dependencies documented?
- [ ] Do domain owners understand their dependencies?

If issues found:
1. Update this document
2. Alert affected domains
3. Plan mitigation if critical
4. Document the decision

---

## Key Insight

**Dependencies flow from Governance down.** Each layer depends on those below it. Changes in lower layers must flow upward carefully to avoid breaking upper layers.

Circular dependencies are okay when they represent healthy feedback loops (learning, improvement, adaptation).

---

**Understanding dependencies enables safe change, prevents unintended consequences, and supports successful scaling.**

