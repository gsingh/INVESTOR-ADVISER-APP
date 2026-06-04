# PRD Quality Rubric Review

**PRD**: Investor Adviser App (`prd.md`)
**Review date**: 2026-06-03
**Context**: Hobby/solo private-use web application for personal mutual fund investing.

---

## Dimension 1: Decision-readiness

**Score: 3 / 10**

The PRD is not decision-ready. Three foundational Open Questions (tech stack, hosting model, data refresh schedule) remain unresolved. The decision log (`.decision-log.md`) contains only a session-start timestamp with no recorded trade-offs, rejected alternatives, or rationale. A decision-maker cannot approve this PRD today because:

- **OQ-1 (Tech stack)** — The entire dev plan, dependency tree, and deployment strategy hinge on this. Suggesting "React/Next.js + Node.js + SQLite" is a starting point but no rationale or alternatives are evaluated.
- **OQ-2 (Hosting)** — Local-only vs personal domain is a binary with vastly different auth, infra, and data persistence requirements.
- **OQ-3 (Data refresh)** — Manual vs scheduled changes the architecture (cron job, background worker, or user-initiated).

Until these three are resolved, no downstream work (architecture, sprint planning, story creation) can begin with confidence.

---

## Dimension 2: Substance over theater

**Score: 8 / 10**

The PRD is commendably lean. No padding, no buzzword salad, no generic mission statements. The 136 lines are dense with specific, actionable content:

- Numbered functional requirements (FR-1 through FR-13) provide a clear feature inventory.
- User journeys (UJ-1, UJ-2, UJ-3) are concrete walkthroughs rather than abstract personas.
- Non-goals and assumptions are explicit and referenced by section.
- Success metrics are present, though imprecise (see Dimension 4).

Minor criticism: the Glossary duplicates concepts already defined inline (e.g., "Goal" is obvious from context). The Vision paragraph could be tightened by 20% without losing meaning.

---

## Dimension 3: Strategic coherence

**Score: 7 / 10**

The vision — "private decision-support web app" that "does not predict returns" and "reduces impulsive switching" — is internally consistent. The feature set flows logically from this vision:

| Vision element | Supporting features |
|---|---|
| Goal planning | FR-3, FR-4, FR-5 |
| Fund research & screening | FR-6, FR-7, FR-8 |
| Portfolio tracking | FR-9, FR-10 |
| Periodic review & journal | FR-11, FR-12, FR-13 |

Non-goals reinforce the boundaries — no predictive AI, no broker integration, no tax filing. This is a coherent product scope.

**However**, there is a foundational strategic tension: the PRD defines itself as a "web app" but punts authentication to "out of scope for MVP." A deployed web app requires auth. A local-only tool is not a web app — it's a desktop application served over HTTP. This ambiguity undermines strategic coherence and must be resolved.

---

## Dimension 4: Done-ness clarity

**Score: 4 / 10**

The FRs tell *what* but not *how well* or *when done*. No FR has acceptance criteria, edge-case notes, or validation rules.

Pain points:

- **FR-1 (Risk Profile Assessment)**: How many questions? What algorithm maps answers to Conservative/Moderate/Aggressive? What happens on a tie? Can the user skip?
- **FR-3 (Goal CRUD)**: What validation rules apply to target amounts (min/max)? What date formats? What happens when a goal target date passes? Can goals be reopened?
- **FR-7 (Custom Scoring)**: What happens when weights don't sum to 100%? What happens when data for a chosen criterion is missing for a fund?
- **FR-12 (Review Flow)**: What constitutes a "passing" review? Is drift > 10% a hard blocker or a warning?

Success metrics are aspirational rather than measurable:

| Metric | Problem |
|---|---|
| SM-1: "use app at least once per review cycle" | Self-referential — the review cycle *is* the app feature. No objective measurement. |
| SM-2: "log at least one review per quarter" | Actionable but doesn't capture *quality* of review. |
| SM-3: "drift stays within 10%" | Unclear who is responsible — the app or the user's rebalancing discipline. |

**Recommendation**: Add a "Definition of Done" section with per-FR acceptance criteria, or add a "Validation" column to the FR table.

---

## Dimension 5: Scope honesty

**Score: 7 / 10**

The PRD is refreshingly honest about what it is *not* doing. Section 5 (Non-Goals) and Section 6.2 (Out of Scope for MVP) are clearly delineated. The Assumptions Index (Section 9) cross-references back to source sections.

Critical scope honesty failure:

> **§6.2**: "User authentication / multi-user (single-user, local or password-protected) [ASSUMPTION]" — listed as "Out of Scope for MVP"

This is not scope management; it's an unresolved design constraint. If the app is deployed (even on a personal domain), authentication is required. If it runs on `localhost` only, calling it a "web app" in the Vision is misleading. This needs to be a resolved decision, not an MVP deferral. The phrase "or password-protected" reveals uncertainty.

Minor issues:
- "Automated data refresh scheduling (manual trigger initially)" — fine as an MVP deferral.
- Data sources (mfapi.in / mfdata.in) are assumed free and keyless. This should be validated before development begins, as upstream API changes or rate limits could block the screener feature — which is core to the app.

---

## Dimension 6: Downstream usability

**Score: 4 / 10**

An architect, developer, UX designer, and QA engineer each lack critical information to start work:

| Role | What's missing |
|---|---|
| **Architect** | Tech stack not decided. Data model not outlined. No mention of state management, persistence layer, or API structure. No non-functional requirements (page load targets, data freshness SLA, offline support). |
| **Developer** | No API contracts, no data schema, no error handling philosophy, no logging/observability needs. FRs lack acceptance criteria. "Live data from mfapi.in / mfdata.in" — no sample response, no rate-limit discussion, no fallback strategy. |
| **UX Designer** | No wireframes, no page inventory, no component hierarchy. User journeys are textual flows but lack screen states, empty states, error states, loading states. No mobile responsiveness consideration. |
| **QA** | No acceptance criteria. No edge cases documented. No performance benchmarks. No data quality expectations (what if mfapi.in returns stale data?). |

What *is* usable downstream: the FR numbering is stable and can be traced into epics/stories. The glossary is sufficient. The non-goals prevent wasted work.

---

## Dimension 7: Shape fit

**Score: 9 / 10**

For a hobby/solo project, this PRD is appropriately scaled. It is not over-engineered. It avoids enterprise ceremony (RACI charts, cost projections, market sizing, go-to-market plans) that would be wasteful here. The structure follows a logical progression:
Vision → Target User → Glossary → Features → Non-Goals → Scope → Success Metrics → Open Questions → Assumptions.

The length (136 lines) is proportionate to the ambition. The UX is conversational-level rather than pixel-perfect spec-level, which is correct for a solo project. The open questions serve as a natural pre-development checklist.

Minor shape improvement: Section 8 (Open Questions) could include a "Resolved" sub-section or a status column (Pending / Proposed / Decided) to track progress.

---

## Summary Scores

| Dimension | Score | Verdict |
|---|---|---|
| 1. Decision-readiness | 3/10 | Blocked by 3 unresolved open decisions |
| 2. Substance over theater | 8/10 | Lean, dense, no fluff |
| 3. Strategic coherence | 7/10 | Internally consistent; web-app-vs-local ambiguity undermines |
| 4. Done-ness clarity | 4/10 | No acceptance criteria; metrics are squishy |
| 5. Scope honesty | 7/10 | Transparent about limits; auth deferral is a gap not a scope call |
| 6. Downstream usability | 4/10 | Every role is missing essential inputs |
| 7. Shape fit | 9/10 | Right-size for a solo/hobby project |

**Overall: C (Needs Revision)**

---

## Consolidated Action Items

### Critical (must fix before progressing)

1. **CI-1: Resolve auth + hosting model.** Decide: is this `localhost`-only (no auth, treat-as-local-device) or deployed to a domain (requires auth, HTTPS, domain registration). This one decision cascades into tech stack, security model, and deployment pipeline. **Owner**: PRD author. **Target**: before architecture planning.

2. **CI-2: Add acceptance criteria to all 13 FRs.** Each FR needs at minimum: (a) success condition, (b) one happy-path scenario, (c) one edge case, (d) error/empty state behavior. Without this, stories cannot be estimated or verified. **Owner**: PRD author + developer review.

3. **CI-3: Close the three Open Questions (OQ-1, OQ-2, OQ-3).** Document the decision and rationale in `.decision-log.md`. Each closed decision should include: chosen option, rejected alternatives (with rationale), and known risks. **Owner**: PRD author.

### High (strongly recommended before MVP start)

4. **HI-1: Validate upstream data availability.** Confirm mfapi.in and mfdata.in are still operational, document their rate limits, response format (link to sample JSON), and have a fallback for API downtime.

5. **HI-2: Add empty/loading/error state expectations per FR.** E.g., "Fund Detail View with no data yet" or "Screener when API is unreachable."

6. **HI-3: Document the risk-profile scoring algorithm.** Three lines of logic — even pseudocode — would prevent interpretation drift between developer and product intent.

### Medium (nice-to-have before formal review)

7. **MI-1: Tighten Vision paragraph** (cut ~20%).
8. **MI-2: Add "Resolved" column/status to Open Questions section.**
9. **MI-3: Add a one-paragraph Data Model overview** (entities: User, Goal, Fund, Transaction, Review) to aid downstream planning.
