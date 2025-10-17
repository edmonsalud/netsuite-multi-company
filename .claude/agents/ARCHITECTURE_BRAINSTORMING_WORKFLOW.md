# 🧠 3-Architect Brainstorming Workflow

## Overview

This document explains the **3-Architect Brainstorming** process for NetSuite solution architecture design. This approach ensures every architecture is analyzed from three critical perspectives: **Governance/Performance**, **Security/Compliance**, and **Business Value/Innovation**.

## The Three Architects

### 1. ⚡ Architect-Governance
**Specialty:** Performance, Scalability, Governance Optimization

**Key Questions:**
- What's the worst-case governance scenario?
- Can we reduce the governance footprint?
- What are the performance bottlenecks?
- How does this scale?

**Outputs:**
- Governance budget analysis
- Performance recommendations
- Scalability assessment
- Optimization techniques

**File:** `.claude/agents/architect-governance.md`

---

### 2. 🔒 Architect-Security
**Specialty:** Security, Compliance, Data Integrity

**Key Questions:**
- Who can execute this and what can they access?
- What if malicious/bad data enters?
- How do we maintain audit trail?
- What's the failure/rollback strategy?

**Outputs:**
- Security architecture
- Compliance requirements (SOX, GDPR, PCI-DSS)
- Data validation framework
- Audit trail design
- Risk assessment

**File:** `.claude/agents/architect-security.md`

---

### 3. 💡 Architect-Innovation
**Specialty:** Business Value, User Experience, Modern Patterns

**Key Questions:**
- What's the business value delivered?
- Can users understand what's happening?
- Is this the simplest solution?
- How maintainable is this?

**Outputs:**
- Business impact analysis with ROI
- User experience design
- Alternative approaches
- Modern pattern recommendations
- Maintainability considerations

**File:** `.claude/agents/architect-innovation.md`

---

## Workflow Process

### Step 1: Trigger Detection

When user requests architecture/planning, **AUTOMATICALLY** start 3-architect brainstorming:

**Trigger Keywords:**
- "create a script"
- "build a feature"
- "implement [anything]"
- "develop [anything]"
- "design [anything]"
- "architect [anything]"
- "plan [solution]"

### Step 2: Parallel Launch

**Launch all 3 architects in PARALLEL using ONE message with 3 Task calls:**

```javascript
// CORRECT: Single message with 3 parallel Task calls
Task 1: architect-governance.md + user requirements
Task 2: architect-security.md + user requirements
Task 3: architect-innovation.md + user requirements
```

**DO NOT launch sequentially** - this defeats the purpose of independent perspectives.

### Step 3: Individual Analysis

Each architect analyzes the requirements from their specialty:

**Architect-Governance produces:**
- Governance budget (units per execution)
- Script type recommendation (Scheduled, Map/Reduce, User Event, etc.)
- Performance bottlenecks identified
- Scaling strategy
- Optimization techniques

**Architect-Security produces:**
- Access control requirements
- Input validation rules
- Audit trail design
- Compliance checklist (SOX, GDPR, etc.)
- Risk matrix

**Architect-Innovation produces:**
- Business impact analysis (time saved, error reduction, ROI)
- User journey mapping
- Alternative approaches considered
- Modern pattern recommendations
- Maintainability strategy

### Step 4: Synthesis

**After all 3 architects complete**, synthesize their insights into a unified architecture blueprint:

```markdown
## Final Architecture Blueprint for [Feature Name]

### Executive Summary
**Business Context:** [From Innovation]
**Technical Approach:** [Synthesized from all 3]
**Expected ROI:** [From Innovation]
**Complexity Rating:** [Simple/Moderate/Complex]

### System Design

#### Script Type Selection
**Recommendation:** [Type]
**Justification:** [Combines Governance's performance analysis + Security's access control needs]

#### Data Flow
[ASCII diagram showing data movement]

#### Integration Points
[From all 3 architects]

### Governance & Performance Strategy

#### Estimated Units
[From Governance architect]

#### Optimization Techniques
[From Governance architect]

#### Scalability Assessment
[From Governance architect]

### Security & Compliance

#### Access Control
[From Security architect]

#### Input Validation
[From Security architect]

#### Audit Trail
[From Security architect]

#### Compliance Requirements
[From Security architect]

### User Experience Design

#### User Journey
[From Innovation architect]

#### Error Handling
[From Innovation architect with Security's validation rules]

#### Progress Feedback
[From Innovation architect]

### Implementation Approach

#### Module Structure
[Synthesized from all 3]

#### Key Functions
[Detailed breakdown for coder agent]

#### Configuration Points
[From Innovation architect]

### Trade-offs & Decisions

#### Decisions Made
[What was chosen]

#### Alternatives Considered
[From Innovation architect]

#### Rationale
[Why this approach - combines all 3 perspectives]

#### Trade-offs
[What we sacrifice for what we gain]

### Quality Checklist
- [ ] Governance optimized (<5000 units for complex scripts)
- [ ] Security requirements met
- [ ] Audit trail comprehensive
- [ ] User experience intuitive
- [ ] Maintainable by mid-level developer
- [ ] Scales for 3 years of growth

### Next Steps
1. Proceed to /coder for implementation
2. /reviewer for code audit
3. /documenter for complete documentation
```

### Step 5: Present to User

Present the **synthesized architecture** with clear indication that it combines all 3 perspectives:

```
✅ Architecture Design Complete

I've collaborated with 3 specialist architects to design a comprehensive solution:

⚡ Governance Analysis:
- Estimated governance: [X] units per execution
- Script type: [Type] (optimal for performance)
- Scales to [Y] records with [optimization techniques]

🔒 Security Analysis:
- Access control: [Role restrictions]
- Audit trail: [Logging strategy]
- Compliance: [SOX/GDPR requirements met]

💡 Business Value Analysis:
- Time savings: [X hours/day]
- Error reduction: [Y%]
- ROI: [Financial impact]

📋 Final Architecture Blueprint:
[Present synthesized architecture]

Ready to proceed with implementation?
```

## When to Use 3-Architect Brainstorming

### ✅ ALWAYS Use For:

1. **New Features/Scripts** (Moderate to Complex)
   - Custom record processing
   - Batch operations
   - Integration scripts
   - Workflow automations

2. **System Integrations**
   - RESTlet APIs
   - External system connections
   - Data synchronization

3. **Performance-Critical Solutions**
   - High-volume data processing
   - Real-time operations
   - Map/Reduce scripts

4. **Compliance-Sensitive Implementations**
   - Financial transactions
   - Audit-required processes
   - SOX-controlled operations

5. **User-Facing Automations**
   - Suitelets
   - Client scripts
   - User event scripts

### ⏭️ Skip Brainstorming For:

1. **Simple Utility Scripts** (<50 lines)
   - Basic calculations
   - Simple lookups
   - One-off data fixes

2. **Code Reviews**
   - Use /reviewer directly

3. **Documentation Tasks**
   - Use /documenter directly

4. **Bug Fixes with Clear Solution**
   - Known issue with obvious fix

## Benefits of 3-Architect Brainstorming

### 🎯 Better Architectures
- **No blind spots**: Every major concern addressed
- **Balanced design**: Not over-optimized in one dimension
- **Trade-offs explicit**: Clear rationale for decisions

### ⚡ Faster Implementation
- **Clear requirements**: Coder has detailed specifications
- **Fewer revisions**: Issues caught in architecture phase
- **Better code quality**: Implementation follows proven patterns

### 🔒 Reduced Risk
- **Security built-in**: Not bolted on later
- **Compliance verified**: Requirements met from start
- **Governance optimized**: No surprises in production

### 💡 Higher Business Value
- **ROI quantified**: Clear value proposition
- **User-centered**: UX considered upfront
- **Maintainable**: Future developers can understand it

## Example Brainstorming Session

### User Request:
> "Create a script to automatically process vendor bill approvals based on amount thresholds for HBNO"

### Brainstorming Output:

**⚡ Architect-Governance says:**
> This should be a User Event script (afterSubmit) on Vendor Bill for real-time processing. Estimated governance: 150 units per execution. For 100 bills/day = 15,000 units, well within limits. Potential bottleneck: approval routing search if large approval matrix. Recommend caching approval rules in script scope.

**🔒 Architect-Security says:**
> Critical security concerns: (1) Segregation of duties - script must respect role-based approval limits, (2) Audit trail required - log every approval decision with user, amount, rule matched, (3) SOX compliance - financial threshold changes must be logged, (4) Input validation - verify bill amount is numeric and positive. Recommend custom record for approval audit trail.

**💡 Architect-Innovation says:**
> Business value: Saves 2 hours/day in manual routing (500 hours/year = $25K savings). User experience: Email notifications must clearly state approval reason and next steps. Alternative approach: Could use native NetSuite approval routing workflow instead of script - recommend evaluating if sufficient. If scripting, make threshold configurable via custom record (no redeployment needed).

**✅ Synthesized Architecture:**
```
Hybrid Approach: Native workflow for simple routing + User Event for complex rules

Script: User Event (afterSubmit) on Vendor Bill
Purpose: Handle complex approval routing beyond native capabilities
Governance: 150 units/execution, 15K units/day (safe)
Security: SOX-compliant audit trail via custom record
Business Value: $25K/year savings, 95% error reduction
Configuration: Custom record for thresholds (admin-managed)
```

---

## Orchestration Integration

The 3-architect brainstorming fits into the overall orchestration:

```
📊 Full Development Pipeline:

Phase 1: 3-Architect Brainstorming (PARALLEL)
  ⚡ Architect-Governance
  🔒 Architect-Security
  💡 Architect-Innovation
  ↓
  Synthesize → Final Architecture Blueprint

Phase 2: Code Implementation (SEQUENTIAL)
  💻 /coder (implements blueprint)

Phase 3: Code Review (SEQUENTIAL)
  🔍 /reviewer (audits implementation)

Phase 4: Documentation (SEQUENTIAL)
  🧾 /documenter (creates complete docs)
```

**Parallel Opportunities:**
- Multiple independent features: Run 3 brainstorming sessions in parallel
- Multiple companies: Run architecture for each company in parallel

---

## Quality Assurance

Every brainstorming session must produce:

1. ✅ **Governance Budget** - Specific unit estimates
2. ✅ **Security Requirements** - Access control, validation, audit
3. ✅ **Business Value** - Quantified ROI and time savings
4. ✅ **User Experience** - Error handling and feedback design
5. ✅ **Trade-off Analysis** - What we're optimizing for and why
6. ✅ **Implementation Clarity** - Coder can start immediately

**Quality Check Questions:**
- [ ] Can coder implement without asking questions?
- [ ] Are all three perspectives represented in final design?
- [ ] Is the solution over-engineered or under-engineered?
- [ ] Are trade-offs explicitly documented?
- [ ] Will this pass reviewer audit on first try?

---

## Summary

The 3-Architect Brainstorming workflow ensures **bulletproof architectures** by analyzing every solution from three critical angles: performance, security, and business value. This collaborative approach catches issues early, produces better designs, and accelerates overall development.

**Key Principle:** Three perspectives are better than one. Every architect brings unique expertise, and synthesis produces architectures stronger than any single viewpoint.

---

**Last Updated:** 2025-10-15
**Process Owner:** Claude Code Orchestration System
**Review Frequency:** After every 10 brainstorming sessions (continuous improvement)
