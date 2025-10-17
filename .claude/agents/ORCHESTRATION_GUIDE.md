# 🎭 Agent Orchestration Guide

## Mastering the Four-Agent Symphony

### Quick Reference Card

```
┌────────────────────────────────────────────────────┐
│              AGENT ORCHESTRATION FLOW              │
├────────────────────────────────────────────────────┤
│                                                    │
│   Requirements ──► Claude-Architect                │
│                         │                          │
│                         ▼                          │
│                    Architecture                    │
│                         │                          │
│                         ▼                          │
│                   Claude-Coder                     │
│                         │                          │
│                         ▼                          │
│                      Code                          │
│                         │                          │
│                         ▼                          │
│                  Claude-Reviewer                   │
│                         │                          │
│                    Pass │ Fail                     │
│                         │  │                       │
│                         ▼  └──────┐                │
│                  Claude-Documenter │                │
│                         │          ▼                │
│                         ▼     Back to Coder        │
│                  Final Delivery                    │
│                                                    │
└────────────────────────────────────────────────────┘
```

## 🚀 Launch Commands

### Sequential Orchestration (Standard Flow)

```bash
# Step 1: Architecture
/agent claude-architect "Create a script to automatically reconcile bank transactions with NetSuite records, handling exceptions and generating reconciliation reports"

# Step 2: Development (after reviewing architecture)
/agent claude-coder "Implement this architecture: [paste architecture output]"

# Step 3: Review (after code is complete)
/agent claude-reviewer "Review this code: [paste code]"

# Step 4: Documentation (after approval)
/agent claude-documenter "Document this solution: [paste code + architecture]"
```

### Parallel Orchestration (Advanced)

For independent components, launch multiple agents simultaneously:

```bash
# Launch all agents for different modules in parallel
/agent claude-architect "Design customer portal integration"
/agent claude-architect "Design inventory sync module"
/agent claude-architect "Design reporting dashboard"
```

## 📚 Use Case Scenarios

### Scenario 1: New Feature Development

**Request**: "Build a custom approval workflow for purchase orders over $10,000"

**Orchestration**:
```
1. Claude-Architect:
   - Input: Business requirements
   - Output: Complete technical design
   - Time: 30 minutes

2. Claude-Coder:
   - Input: Architecture document
   - Output: User Event + Workflow scripts
   - Time: 1 hour

3. Claude-Reviewer:
   - Input: Generated code
   - Output: Audit report
   - Time: 15 minutes

4. Claude-Documenter:
   - Input: All artifacts
   - Output: Full documentation suite
   - Time: 30 minutes

Total Time: 2.25 hours
```

### Scenario 2: Performance Optimization

**Request**: "Optimize slow-running invoice processing script"

**Orchestration**:
```
1. Claude-Reviewer (First):
   - Analyze existing code
   - Identify bottlenecks

2. Claude-Architect:
   - Design optimization strategy
   - Propose new architecture

3. Claude-Coder:
   - Implement optimizations
   - Refactor code

4. Claude-Reviewer (Second):
   - Validate improvements
   - Confirm governance reduction

5. Claude-Documenter:
   - Document changes
   - Create migration guide
```

### Scenario 3: Emergency Bug Fix

**Request**: "Critical: Order sync failing in production"

**Fast Track Orchestration**:
```
1. Claude-Reviewer (Immediate):
   - Diagnose issue
   - Identify root cause
   - Time: 5 minutes

2. Claude-Coder (Priority):
   - Implement fix
   - Add error handling
   - Time: 15 minutes

3. Claude-Documenter (Concurrent):
   - Create incident report
   - Update runbooks
   - Time: 10 minutes

Total Resolution: 30 minutes
```

## 🎯 Agent Specialization Matrix

| Task Type | Primary Agent | Supporting Agents | Order |
|-----------|--------------|-------------------|--------|
| New Development | Architect | Coder → Reviewer → Documenter | Sequential |
| Code Review | Reviewer | Coder → Documenter | Sequential |
| Optimization | Reviewer | Architect → Coder → Reviewer | Sequential |
| Documentation | Documenter | - | Independent |
| Bug Fix | Reviewer | Coder → Documenter | Sequential |
| Migration | Architect | Coder → Reviewer → Documenter | Sequential |

## 🔄 Iteration Patterns

### Pattern 1: Review-Fix Loop
```
Code → Reviewer → [Fail] → Coder → Reviewer → [Pass] → Documenter
```

### Pattern 2: Architecture Refinement
```
Architect → [Complex] → Architect (refine) → Coder → Reviewer
```

### Pattern 3: Progressive Enhancement
```
Basic Implementation → Review → Enhancement → Review → Documentation
```

## 💡 Best Practices

### 1. When to Use Each Agent

**Claude-Architect**:
- Starting new projects
- Major refactoring
- Integration design
- Performance re-architecture
- Before any complex implementation

**Claude-Coder**:
- After architecture approval
- Bug fixes with clear requirements
- Feature implementation
- Code generation from specs
- Script optimization

**Claude-Reviewer**:
- Before any production deployment
- After significant changes
- Performance validation
- Security assessment
- Code quality checks

**Claude-Documenter**:
- After code approval
- Project completion
- API documentation
- User guide creation
- Training material development

### 2. Information Flow

```yaml
optimal_flow:
  architect_output:
    - Technical specifications
    - Data flow diagrams
    - Module descriptions
    - Governance estimates

  coder_requires:
    - Architecture document
    - Specific requirements
    - Error handling needs
    - Performance targets

  reviewer_needs:
    - Complete code
    - Architecture context
    - Performance requirements
    - Security constraints

  documenter_inputs:
    - Final approved code
    - Architecture document
    - Review report
    - Deployment requirements
```

### 3. Communication Between Agents

Always pass complete context:

```bash
# Good: Full context
/agent claude-coder "Based on this architecture [paste full architecture],
implement with these specific requirements:
- Handle null values
- Log all errors
- Support batch processing
- Optimize for <1000 governance units"

# Bad: Incomplete context
/agent claude-coder "Write the code"
```

## 🛠️ Advanced Orchestration

### Multi-Module Projects

```python
# Orchestration Script Example
modules = [
    "customer_sync",
    "order_processing",
    "inventory_update",
    "reporting_dashboard"
]

for module in modules:
    # Phase 1: Design all architectures
    architect_task = f"Design {module} module architecture"

    # Phase 2: Implement all modules
    coder_task = f"Implement {module} based on architecture"

    # Phase 3: Review all code
    reviewer_task = f"Review {module} implementation"

    # Phase 4: Document everything
    documenter_task = f"Create documentation for {module}"
```

### Conditional Orchestration

```yaml
orchestration_rules:
  if_complexity: high
    then:
      - Use Architect twice (initial + refined)
      - Add performance specialist
      - Increase review iterations

  if_criticality: production
    then:
      - Mandatory security review
      - Double code review
      - Comprehensive documentation

  if_governance: >5000_units
    then:
      - Architect optimization pass
      - Performance-focused coding
      - Governance audit review
```

## 📊 Metrics & Monitoring

### Success Indicators

```markdown
✅ Architecture approved without major changes
✅ Code passes review first time
✅ Documentation complete and clear
✅ Governance under budget
✅ No security vulnerabilities
✅ Performance targets met
```

### Warning Signs

```markdown
⚠️ Multiple review failures
⚠️ Architecture requires redesign
⚠️ Governance exceeding estimates
⚠️ Missing error handling
⚠️ Incomplete documentation
⚠️ Performance degradation
```

## 🎬 Example Complete Orchestration

### Project: Customer Portal Integration

```bash
# 1. ARCHITECTURE PHASE
/agent claude-architect "Design a customer portal integration that:
- Syncs customer data bi-directionally
- Handles 10,000 daily transactions
- Provides real-time order status
- Includes error recovery
- Maintains audit trail"

# [Review architecture output]

# 2. DEVELOPMENT PHASE
/agent claude-coder "Implement the customer portal integration:
Architecture: [paste architecture]
Priority: Governance optimization
Include: Comprehensive logging
Target: <5000 units per execution"

# [Receive code output]

# 3. REVIEW PHASE
/agent claude-reviewer "Perform comprehensive review:
Code: [paste code]
Focus areas: Security, governance, error handling
Performance target: 1000 records/minute"

# [If review fails, return to step 2 with fixes]

# 4. DOCUMENTATION PHASE
/agent claude-documenter "Create complete documentation:
Solution: Customer Portal Integration
Code: [paste final code]
Architecture: [paste architecture]
Review findings: [paste review]
Audience: Technical team, business users, support staff"

# [Receive complete documentation package]
```

## 🔑 Key Takeaways

1. **Always start with Claude-Architect** for non-trivial tasks
2. **Pass complete context** between agents
3. **Don't skip Claude-Reviewer** before production
4. **Claude-Documenter completes** the delivery
5. **Iterate when necessary** but aim for first-pass success
6. **Use parallel execution** when possible
7. **Maintain quality gates** at each stage

## 📈 Continuous Improvement

Track and optimize:
- Time per phase
- Iteration count
- First-pass success rate
- Defect escape rate
- Documentation completeness
- User satisfaction

---

*Master this orchestration, and you'll deliver world-class NetSuite solutions with consistency, quality, and speed.*

**The symphony of four agents, perfectly orchestrated, creates excellence.**