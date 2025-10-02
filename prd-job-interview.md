# PRD evaluation rubric for candidate interviews

This document provides five criteria for evaluating product requirement documents on a 1–10 scale. Use this rubric during technical interviews to assess a candidate's ability to write clear, actionable, and complete PRDs.

---

## Response formatting checklist

- Return a single JSON object that matches the schema exactly; do not add extra properties or reorder keys.
- The first character of the response must be `{` and the last character must be `}` with no leading or trailing whitespace.
- Never include Markdown fences, prose (for example "Thinking" or "Analysis"), or apologies.
- If you cannot comply, return `{"error":"formatting"}` so downstream tooling can detect the failure.
- Keep every rationale under 400 characters and cite at least one concrete reference (quote, metric, or section name).

## Criterion 1: Problem definition & user understanding

### What this measures
How well the PRD articulates the problem being solved, demonstrates deep understanding of target users, and communicates a compelling value proposition.

### Scoring guidance

**1–3 (Weak)**
- Problem statement is vague, generic, or missing entirely
- No clear identification of target users or personas
- Value proposition is unclear or unconvincing
- No evidence of user research or understanding of pain points
- Example: "Users want a better app for learning" without explaining why existing solutions fail

**4–6 (Adequate)**
- Problem is stated but lacks depth or specificity
- Target users are mentioned but not deeply characterized
- Some attempt at value proposition, but differentiation is unclear
- Limited evidence of understanding actual user workflows or pain points
- Example: Mentions students need flashcards but doesn't explain time burden or specific frustrations

**7–9 (Strong)**
- Clear, specific problem statement with measurable impact
- Well-defined personas with realistic needs, constraints, and contexts
- Compelling value proposition with clear differentiation from alternatives
- Demonstrates understanding of user workflows and pain points
- Example: Identifies that manual flashcard creation takes 2–3 minutes per card, cites specific personas with time constraints, explains why existing tools fall short

**10 (Exceptional)**
- All of the above, plus:
- Quantifies problem magnitude (time wasted, money lost, opportunities missed)
- Maps problem to specific user journeys with concrete scenarios
- Articulates second-order effects of the problem (stress, poor outcomes, abandonment)
- Shows competitive analysis with nuanced understanding of trade-offs

### Red flags
- No mention of who the users are
- Problem statement could apply to any product in the category
- No explanation of why existing solutions are insufficient
- Confuses features with problems ("users need AI" vs "users spend too much time creating flashcards")

---

## Criterion 2: Functional requirements clarity

### What this measures
Whether functional requirements are specific, unambiguous, implementable, and provide sufficient detail for engineering teams to build the product.

### Scoring guidance

**1–3 (Weak)**
- Requirements are vague feature lists ("user can create flashcards")
- No technical details, constraints, or specifications
- Missing critical flows (error handling, edge cases, validation)
- No consideration of limits, performance, or scale
- Example: "AI generates flashcards from text" without specifying input limits, output format, or error handling

**4–6 (Adequate)**
- Requirements describe what should happen but lack implementation detail
- Some constraints mentioned but incomplete (e.g., character limits without validation rules)
- Basic happy path covered but edge cases and error states are sparse
- Limited technical specifications (API contracts, data models, UI states)
- Example: Specifies 10,000 character limit but doesn't explain what happens at 10,001 or how validation errors are shown

**7–9 (Strong)**
- Requirements are specific and actionable with clear inputs/outputs
- Constraints, limits, and validation rules are explicit
- Error handling, edge cases, and degradation paths are documented
- Technical details support implementation (field lengths, rate limits, timeouts, retry logic)
- Example: Defines exact timeout (12s), retry strategy (2 attempts with backoff), fallback model, and user messaging for each failure mode

**10 (Exceptional)**
- All of the above, plus:
- Anticipates scalability and performance requirements (P95 latencies, throughput)
- Specifies security, privacy, and compliance requirements inline with features
- Includes state machines or flow diagrams where complexity warrants
- Covers observability (logging, telemetry, feature flags for A/B testing)

### Red flags
- Requirements read like user stories without technical depth
- No mention of validation, error states, or limits
- Ambiguous language ("should be fast," "user-friendly") without concrete criteria
- Missing infrastructure, security, or operational requirements

---

## Criterion 3: Scope & boundaries

### What this measures
How clearly the PRD defines what is explicitly out of scope for the MVP, with well-reasoned justifications and awareness of trade-offs.

### Scoring guidance

**1–3 (Weak)**
- No "out of scope" section or boundaries mentioned
- Attempts to include everything without prioritization
- No rationale for what's deferred or excluded
- Unclear what constitutes the MVP vs future phases
- Example: PRD includes native mobile apps, advanced algorithms, social features, and integrations without acknowledging this is too much for an MVP

**4–6 (Adequate)**
- Some features marked as out of scope but list feels arbitrary
- Limited or weak justification for exclusions
- Boundaries exist but MVP still feels bloated or under-scoped
- Doesn't address dependencies or assumptions clearly
- Example: "Mobile apps not in MVP" without explaining why or when they'd be considered

**7–9 (Strong)**
- Clear, comprehensive list of out-of-scope features
- Thoughtful rationale for each exclusion (de-risk, validate core hypothesis, resource constraints)
- MVP scope is focused and testable
- Explicitly states assumptions and external dependencies
- Example: Excludes advanced spaced repetition algorithms in favor of simple SM-2 to ship faster, with clear criteria for when to revisit

**10 (Exceptional)**
- All of the above, plus:
- Articulates risk/reward trade-offs for scope decisions
- Identifies "decision points" or "TBDs" that need resolution before implementation
- Proposes phased rollout or feature flags for incremental validation
- Balances user needs against technical/business constraints transparently

### Red flags
- Everything is "must have" with no prioritization
- No mention of what's deferred or why
- MVP includes unvalidated, complex features (social sharing, advanced analytics)
- Ignores dependencies or assumes third-party services will "just work"

---

## Criterion 4: User stories & acceptance criteria

### What this measures
Whether user stories are well-structured, testable, complete, and cover critical user journeys including happy paths, alternative flows, and error scenarios.

### Scoring guidance

**1–3 (Weak)**
- User stories are missing or poorly formatted
- Acceptance criteria are vague or untestable ("user is happy")
- Only happy paths covered; no error handling or edge cases
- Stories don't cover a complete, functional user journey
- Example: "As a user I want to log in" with criterion "login works"

**4–6 (Adequate)**
- User stories follow basic format (As/I want/So that)
- Some acceptance criteria are testable but many are ambiguous
- Primary happy paths covered but alternative flows and errors are sparse
- Gaps in end-to-end flows (e.g., can create flashcards but no way to review them)
- Example: Login story has criteria for success but doesn't address password reset, rate limiting, or account lockout

**7–9 (Strong)**
- Well-structured user stories with clear role, goal, and motivation
- Acceptance criteria are specific, measurable, and testable
- Covers happy paths, alternative flows, validation, and error states
- Stories collectively represent a complete, usable product
- Example: Login story includes success, wrong password, account lockout, rate limiting, session timeout, and multi-device considerations

**10 (Exceptional)**
- All of the above, plus:
- Stories address accessibility, internationalization, and edge cases (network failure, conflicts)
- Includes admin/operational stories (moderation, GDPR requests, export)
- Cross-references related stories and dependencies
- Anticipates user behavior patterns (undo, autosave, session recovery)

### Red flags
- No user stories or only technical tasks listed
- Acceptance criteria like "button works" or "looks good"
- No coverage of authentication, authorization, or data access control
- Missing critical flows (account creation, data export, error recovery)

---

## Criterion 5: Measurability & success criteria

### What this measures
Whether the PRD defines clear, actionable metrics that enable the team to validate hypotheses, measure success, and make data-driven decisions.

### Scoring guidance

**1–3 (Weak)**
- No metrics or success criteria defined
- Vague goals ("increase engagement," "improve satisfaction") without targets
- Metrics are not measurable or lack instrumentation plan
- No connection between product goals and metrics
- Example: "Users will love the AI feature" with no way to measure

**4–6 (Adequate)**
- Some metrics defined but incomplete or poorly chosen
- Targets exist but lack timeframes or baselines
- Metrics focus on vanity indicators (signups) rather than value delivery
- Limited instrumentation plan (what events to track, how)
- Example: "Track number of flashcards created" without context on why or what success looks like

**7–9 (Strong)**
- Clear success metrics tied to product hypotheses
- Specific targets with timeframes (e.g., "75% AI acceptance rate within 30 days")
- Instrumentation plan with event names, properties, and analysis approach
- Mix of business, engagement, and quality metrics
- Example: Defines AI acceptance rate, cost per generation, P95 latency, with formulas and tracking strategy

**10 (Exceptional)**
- All of the above, plus:
- Metrics cover full funnel (acquisition, activation, retention, revenue)
- Includes counter-metrics to avoid gaming (e.g., engagement up but quality down)
- Proposes A/B testing framework for validating key decisions
- Defines SLOs for reliability and performance, with monitoring and alerting

### Red flags
- No metrics section
- Metrics that can't be measured with planned instrumentation
- Only output metrics (features shipped) without outcome metrics (user value)
- No targets, baselines, or timeframes for evaluation

---

## Using this rubric

### During the interview
1. **Review the PRD** before the interview and score each criterion independently
2. **Prepare specific examples** from the document to discuss (both strengths and gaps)
3. **Ask follow-up questions** to probe understanding: "How did you decide X was out of scope?" or "What happens if Y fails?"
4. **Look for thinking process**, not just the final artifact—can they explain trade-offs?

### Scoring interpretation
- **40–50**: Exceptional PRD writer, demonstrates senior/staff-level product thinking
- **30–39**: Strong, hire-worthy candidate with minor gaps to coach
- **20–29**: Adequate foundation but needs development in several areas
- **10–19**: Significant gaps, may lack experience or structured thinking
- **Below 10**: Does not meet bar for role

### Calibration notes
- A score of 7 in any category represents a solid, hire-worthy baseline for mid-level roles
- Exceptional scores (9–10) should be rare and indicate true depth, not just completeness
- Balance scores across criteria—a 10 in one area doesn't compensate for a 3 in another for critical roles
- Adjust expectations by seniority: junior candidates may score 5–6 and still be strong hires with coaching potential

---

## Interview discussion prompts

Use these questions to dig deeper after evaluating the PRD:

1. **Problem definition**: "Walk me through how you identified this problem. What research or evidence informed your understanding?"

2. **Requirements**: "I noticed you specified a 12-second timeout for AI generation. How did you arrive at that number?"

3. **Scope**: "You excluded [feature X] from the MVP. What would need to be true for you to revisit that decision?"

4. **User stories**: "This story covers the happy path. What happens if the user loses network connectivity mid-session?"

5. **Metrics**: "You've defined a 75% acceptance rate for AI-generated flashcards. What would you do if you hit 60% instead?"

---

## Revision history
- 2025-10-02: Initial version created based on analysis of FlashAI, Fiszki AI, and FiszkaBot PRDs
