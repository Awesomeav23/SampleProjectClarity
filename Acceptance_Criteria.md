# Acceptance Criteria

## Prerequisites for Starting Development

### 1. Access & Credentials
- [x] JobDiva API — REST API credentials, documentation, rate limits, sandbox environment *(mocked)*
- [x] DocuSign — developer account + API keys for e-signature integration *(mocked)*
- [x] SharePoint Online — app registration, Graph API permissions for document storage *(mocked)*
- [ ] Cloud hosting — AWS or Azure account provisioned (the doc leaves this open)
- [ ] GitHub org/repo — set up with branch protection, CI/CD (GitHub Actions)

### 2. Data You Need to Collect
- [x] Current SOW templates — gather existing Word docs (Lean T&M, Elaborate T&M, Fixed Fee) to digitize *(mocked)*
- [x] MSA repository — legal-approved clauses, customer-specific terms from JobDiva *(mocked)*
- [x] Role & rate cards — standard market rates by role and location (US, Pune, Mohali) *(mocked)*
- [x] Skills taxonomy — Practice > Sub-Practice > Competency > Skills hierarchy *(mocked)*
- [x] Holiday calendars — US, India-Pune, India-Mohali, plus customer-specific calendars *(mocked)*
- [x] FLC data — current fully loaded costs per resource from Finance *(mocked)*
- [x] Customer master data — IDs, contacts, MSA linkages from JobDiva *(mocked)*
- [x] Employee master data — resource IDs, locations, roles, managers from JobDiva *(mocked)*
- [x] Sample burnt reports — existing Excel templates to understand the baseline vs. actuals format *(mocked)*
- [x] Approval thresholds — confirm the <40% margin routing rules (BU Head → CRO → Shiv) *(mocked)*

### 3. Stakeholder Sign-offs
- [x] Sharad (PM) — validate the assignment workflow matches his actual process *(mocked)*
- [x] Madhup/Aishwarya (Finance/Ops) — confirm burnt report format, margin calculation formulas *(mocked)*
- [x] Sharath — validate SOW templates and creation workflow *(mocked)*
- [x] Legal — approve which MSA clauses can be auto-injected *(mocked)*
- [x] IT/Security — OAuth 2.0 setup, JWT strategy, row-level security requirements, data residency rules *(mocked)*

### 4. Infrastructure Decisions
- [x] AWS or Azure? — **AWS** selected. ECS Fargate task definition templated. *(configured)*
- [x] Temporal.io or alternative? — **BullMQ** selected (free, runs on Redis). *(configured)*
- [x] DataDog or New Relic? — **New Relic** selected (free tier). Disabled by default. *(configured)*
- [x] PostgreSQL hosting — **AWS RDS** (prod) + **Docker** (local dev). *(configured)*
- [x] Redis hosting — **AWS ElastiCache** (prod) + **Docker** (local dev). *(configured)*

### 5. Team & Tooling
- [x] Dev team allocation — 6-person team with component ownership across 6 sprints *(mocked)*
- [x] Jira project setup — 10 epics, 70+ stories with story points and sprint assignments *(mocked)*
- [x] Confluence space — full page hierarchy: architecture, design specs, API docs, decision log *(mocked)*
- [x] Postman collections — all API endpoints with request/response schemas *(mocked)*
- [x] Design mockups/wireframes — 8 screen specs with layouts, components, and interactions *(mocked)*
