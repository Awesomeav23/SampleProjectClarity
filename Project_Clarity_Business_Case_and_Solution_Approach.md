# Project Clarity: Business Pain Points, Scope & Solution Approach

**Document Version:** 1.0  
**Date:** April 13, 2026  
**Project:** DynPro Project Clarity  
**Status:** Active Development

---

## Table of Contents

1. [Executive Overview](#executive-overview)
2. [Current Business Pain Points](#current-business-pain-points)
3. [Business Impact Analysis](#business-impact-analysis)
4. [Project Scope](#project-scope)
5. [Solution Approach](#solution-approach)
   
   

---

## Executive Overview

### Project Charter

Project Clarity is a board-chartered initiative to deliver end-to-end visibility into time tracking, resource allocation, and skill management at DynPro. The project directly targets profitability improvements by eliminating manual, error-prone back-office processes that currently consume 100% of leadership capacity and create critical single points of failure.

### Strategic Objectives

1. **Transform reactive capacity management** into proactive, automated resource optimization
2. **Eliminate manual SOW preparation workflows** that waste leadership time
3. **Establish automation-ready data architecture** with relational integrity across all operational entities
4. **Enable intelligent capacity alerts** (e.g., utilization exceeding 120%)
5. **Improve profitability** through accurate margin tracking and role-based standard rates

### Current Operational Scale

- **~250 resources** across onshore (US) and offshore (India) locations
- **~50 active customers** with diverse contractual requirements
- **50-75 active SOWs** at any given time
- **Multiple billing models**: Time & Material (Lean/Elaborate), Fixed Fee, Milestone-based
- **Geographic complexity**: US and India (Pune/Mohali) with distinct holiday calendars

---

## Current Business Pain Points

### 1. SOW Management Critical Failures

#### 1.1 Manual Document Creation

**Pain Point:**

- SOWs created manually in Word without standardized templates
- No workflow automation or approval routing
- Single point of failure: 100% of Sharath's capacity consumed by routine SOW preparation
- No version control or audit trail

**Business Impact:**

- Scalability bottleneck preventing business growth
- High error rates in contract documentation
- Legal and compliance risks from inconsistent terminology
- Revenue recognition delays due to slow contract execution

#### 1.2 Lack of Template Standardization

**Pain Point:**

- No standardized SOW formats across different contract types
- Legal-approved sections (e.g., Change Request Process) not systematically reused
- Customer-specific variations handled ad-hoc without structured approach
- Field sequences vary across SOWs creating confusion

**Business Impact:**

- Inconsistent customer experience
- Extended contract negotiation cycles
- Increased legal review time and costs
- Lost competitive opportunities due to slow response times

#### 1.3 No End-to-End Lineage

**Pain Point:**

- Broken linkage between: Opportunity → SOW → Resource Plan → Timesheet → Invoice
- Manual tracking across disconnected systems (JobDiva, Excel, SharePoint)
- No automated data flow between contract creation and execution

**Business Impact:**

- Revenue leakage from unbilled hours
- Inability to track project profitability accurately
- Manual reconciliation errors in monthly reporting
- Poor visibility into pipeline-to-revenue conversion

---

### 2. Resource Management Chaos

#### 2.1 No Standardized Roles or Skills Framework

**Pain Point:**

- Outdated job titles not aligned with current market or delivery needs
- Inconsistent role/skill tracking across projects
- No hierarchical structure: Practice → Sub-Practice → Competency → Skills
- Skills taxonomy fragmented and unmaintained

**Business Impact:**

- Difficulty matching resources to project requirements
- Suboptimal resource allocation leading to project delays
- Inability to identify skills gaps for hiring/training
- Poor utilization of bench resources due to skills mismatch

#### 2.2 Reactive Capacity Management

**Pain Point:**

- No proactive capacity planning or utilization tracking
- Manual Excel-based resource allocation across 30-100 resources
- Weekly capacity views not available—only annual aggregates
- No automated alerts for over-allocation (>100%) or underutilization (<60%)

**Business Impact:**

- **Employee burnout** from sustained over-allocation (e.g., Romy at 122% utilization)
- **Bench inefficiency** from undetected underutilization
- **Reactive hiring decisions** instead of proactive pipeline-based planning
- **Revenue loss** from inability to quickly deploy available resources

#### 2.3 Isolated Resource Plans

**Pain Point:**

- Resource plans exist in isolation per project
- Difficult to link specific resource plan to parent SOW
- No consolidated view of employee allocation across all projects
- Baseline plan vs. execution plan disconnect

**Business Impact:**

- Inability to prevent double-booking of resources
- No visibility into resource contention across projects
- Poor forecasting for resource needs
- Difficulty responding to urgent staffing requests

#### 2.4 Lack of Organizational Structure

**Pain Point:**

- No formalized people management layer or reporting hierarchy
- Business unit/practice assignments not systematically tracked
- Manager relationships not captured in operational systems

**Business Impact:**

- Inefficient escalation paths during project issues
- Difficulty with performance management and capacity planning
- Unclear accountability for resource development and career growth

---

### 3. Time Management and Tracking Deficiencies

#### 3.1 Manual Assignment Records

**Pain Point:**

- Sharad manually emails back office (Ash, Ankit, HR, Naveen, PM, BU Lead, PMO, Sales CS)
- Back office manually creates JobDiva assignment records
- No automated workflow triggering timesheet enablement
- Email-based process prone to delays and errors

**Business Impact:**

- Project start delays waiting for assignment record creation
- Revenue leakage from missed billable hours during setup period
- Administrative overhead consuming 5-10% of project management capacity
- Error-prone manual data entry causing billing disputes

#### 3.2 Troublesome Legacy Timesheet Process

**Pain Point:**

- Self-reported timesheets with manual approval workflows
- No integration between resource planning and time tracking
- Manual updates to burnt reports from JobDiva data by back office
- Color-coded status (Green/Yellow) managed manually

**Business Impact:**

- Timesheet inaccuracies affecting billing and revenue recognition
- Delayed cost tracking (back office bottleneck)
- Inability to detect allocation vs. actual hours variance in real-time
- Poor project financial visibility until month-end

#### 3.3 No Proactive Time Management

**Pain Point:**

- No capacity alerts or utilization thresholds
- No automated notification when resource approaches over-allocation
- No visibility into underutilization until monthly reporting
- Reactive reallocation only after problems surface

**Business Impact:**

- Missed opportunities to reallocate underutilized resources
- Employee dissatisfaction from unmanaged overwork
- Reduced team productivity and quality issues from fatigue
- Inability to optimize revenue per resource

---

### 4. Financial Tracking and Margin Management Failures

#### 4.1 FLC-Based Pricing Creating Margin Leakage

**Pain Point:**

- Current pricing model: Cost (FLC) + Margin → Bill Rate
- FLC visibility to sales team encourages cost-focused negotiations
- Mid-project salary increases (appraisals) erode margins without bill rate adjustments
- No standard market rates by role and location

**Business Impact:**

- **Margin erosion**: Projects planned at 49% margin executing at 40.3% actual
- **Uncompetitive pricing**: Cost-plus approach misaligned with market rates
- **Revenue loss**: Underpriced roles in high-demand markets
- **Profitability unpredictability**: Margin varies significantly project-to-project

**Example Impact:**

```
Original Plan:
- FLC: $68/hr
- Bill Rate: $130/hr  
- Margin: $62/hr (47.7%)

After Mid-Project Appraisal:
- FLC: $75/hr (increased 10%)
- Bill Rate: $130/hr (unchanged)
- Margin: $55/hr (42.3%)
- Erosion: -5.4 percentage points
```

#### 4.2 No Proactive Margin Threshold Management

**Pain Point:**

- Operating margin <40% requires SLT approval (BU Head, CRO, Shiv)
- Approval workflow handled via email—no systematic routing
- No automated calculation of operating margin during SOW creation
- Margin impacts not visible until after SOW signed

**Business Impact:**

- Low-margin deals approved without proper scrutiny
- Cash flow challenges from unprofitable projects
- Resource allocation to low-margin work reduces overall company profitability
- Lack of data to negotiate better terms with customers

#### 4.3 Manual Burnt Report Variance Tracking

**Pain Point:**

- Burnt reports manually maintained in Excel
- Top section (baseline plan) vs. Bottom section (actuals) reconciliation done manually
- Back office manually enters JobDiva timesheet data
- Variance analysis (hours, cost, margin) calculated in spreadsheets

**Business Impact:**

- **Delayed financial visibility**: Month-end only, not real-time
- **Error-prone calculations**: Manual formulas and data entry mistakes
- **Inability to course-correct**: Problems identified too late
- **Executive reporting delays**: Finance waits for manual consolidation

---

### 5. Reporting and Business Intelligence Gaps

#### 5.1 Manual Monthly Reporting

**Pain Point:**

- Monthly reporting requires extensive manual Excel consolidation
- Data pulled from multiple sources: JobDiva, SharePoint, email, spreadsheets
- No automated dashboards or real-time KPIs
- Different stakeholders maintain separate "versions of truth"

**Business Impact:**

- **10-15 hours/month** of senior leadership time on reporting
- Inconsistent metrics across departments
- Inability to make data-driven decisions in real-time
- Board reporting delays and quality issues

#### 5.2 No Capacity Utilization Visibility

**Pain Point:**

- No real-time dashboard showing resource utilization
- Weekly capacity views not available—only annual (2,080 hrs/year assumption)
- No drill-down by employee, project, practice, or location
- Over-allocation and underutilization discovered reactively

**Business Impact:**

- Missed revenue opportunities from idle bench resources
- Employee retention issues from unmanaged overwork
- Inability to forecast hiring needs accurately
- Poor bench management leading to workforce reduction decisions

#### 5.3 Lack of Predictive Analytics

**Pain Point:**

- No forecasting capability for capacity needs based on pipeline
- No margin trend analysis across project types or customers
- No skills gap identification for hiring planning
- Historical performance data not leveraged for future planning

**Business Impact:**

- Reactive hiring causing project delays
- Inability to prioritize high-margin opportunities
- Skills shortages discovered during project staffing
- Lost competitive advantage from data-driven insights

---

### 6. Change Order and Contract Amendment Complexity

#### 6.1 Manual Change Order Processing

**Pain Point:**

- Change orders created manually in Word/Excel
- Financial impact calculations (additions - credits) done in spreadsheets
- No systematic tracking of change order reasons or patterns
- Revised SOW values manually updated

**Business Impact:**

- **Calculation errors** in financial impacts affecting profitability
- **Delayed customer invoicing** due to change order processing bottlenecks
- **Scope creep** without corresponding revenue capture
- **Audit risks** from incomplete change documentation

**Example Complexity:**

```
SurveyMonkey Change Order #1:
- Timeline Extension: Mar 27 → Apr 10
- Additions: +170 hours across multiple resources = +$17,407
- Credits: Workato Engineer underutilized = -$5,200
- Net Change Value: $17,407 - $5,200 = $12,207
- Manual reconciliation required across 5+ resources
```

#### 6.2 No Change Order Pattern Analysis

**Pain Point:**

- No centralized repository of change order triggers and outcomes
- Inability to identify customers/projects with frequent changes
- Root cause analysis (scope creep vs. valid changes) not performed
- Lessons learned not systematically captured

**Business Impact:**

- Repeated mistakes in SOW scoping
- Inability to improve estimation accuracy
- Customer relationship risks from frequent renegotiations
- Lost opportunity to productize common change patterns

---

### 7. Master Service Agreement (MSA) and Legal Compliance Risks

#### 7.1 Disconnected MSA-SOW Linkage

**Pain Point:**

- MSAs stored in JobDiva but not systematically linked to SOWs
- Legal clauses not automatically applied during SOW creation
- Payment terms conflicts between MSA and SOW not detected
- MSA signature dates and renewal tracking manual

**Business Impact:**

- **Legal compliance risks** from inconsistent contract terms
- **Payment disputes** due to conflicting payment terms
- **Liability exposure** from missing insurance/indemnification clauses
- **Enterprise client loss** due to poor contract governance

#### 7.2 Holiday Calendar Impact on T&M Billing

**Pain Point:**

- Customer-specific holiday calendars not systematically captured
- T&M hour estimates don't account for customer holidays
- Annual calendar updates required but not tracked
- Fixed-fee vs. T&M holiday treatment inconsistent

**Business Impact:**

- **Revenue shortfalls** from overestimated billable hours
- **Customer disputes** over expected vs. delivered hours
- **Resource planning errors** due to incorrect working day assumptions
- **Cash flow issues** from unexpected billing adjustments

---

## 

## Project Scope

### Phase 1: Foundation (April - June 2026)

#### In-Scope Deliverables

**1. Data Architecture**

- Clean-sheet data model with relational integrity across all entities
- Master data tables: Resources, Customers, Roles, Skills, Locations, Calendars
- Transactional tables: SOWs, Resource Plans, Assignments, Timesheets
- Integration schema for JobDiva, SharePoint, DocuSign

**2. SOW Management System**

- Automated SOW creation with template-based approach
  - Template types: Generic, Customer-specific, Prior SOW reuse
  - SOW formats: Lean T&M, Elaborate T&M, Fixed Fee
- MSA integration with automatic clause application
- SOW approval workflow with <40% margin threshold routing (BU Head → CRO → Shiv)
- Customer-specific holiday calendar integration
- Role-location-based billing rate calculation
- DocuSign integration for e-signature and effective date capture

**3. Resource Planning Automation**

- Baseline Resource Plan (immutable after SOW signing)
- Execution Resource Plan (mutable throughout project lifecycle)
- Role-based planning with TBD → Named resource transition
- Capacity validation at assignment time
- Hiring workflow trigger when no capacity exists

**4. Capacity Management Dashboard**

- **Weekly granularity** resource utilization tracking (not annual)
- Real-time capacity calculation: Total (40 hrs/week) - Booked = Available
- Utilization alerts: >100% over-allocation, <60% underutilization
- Multi-view dashboards:
  - Resource view: Employee × Week × Allocation %
  - Project view: Project × Week × Resources
  - Practice view: BU Practice × Capacity × Utilization
- Location-specific calendar integration (US, India-Pune, India-Mohali)

**5. Change Order Management**

- Automated change order creation workflows
- Financial impact calculation: (Additions - Credits) = Net Impact
- SOW value update automation
- Change order approval routing based on financial threshold
- Variance tracking vs. baseline plan

**6. JobDiva Integration**

- Automated assignment record creation (eliminating manual email workflow)
- Live timesheet data feed for burnt report automation
- Customer and Employee ID synchronization
- Opportunity data pull for SOW pipeline visibility

#### Explicitly Out-of-Scope (Phase 1)

- Invoicing and payment processing
- Accounts payable functionality
- Purchase order management
- Advanced AI/ML for predictive capacity planning
- Mobile application development
- Third-party vendor management beyond JobDiva integration

### Phase 2: Intelligence Layer (July - September 2026)

**Planned Capabilities:**

- Predictive capacity forecasting based on pipeline data
- Margin optimization recommendations using historical performance
- Skills gap analysis and hiring forecasting
- Automated resource reallocation suggestions
- Advanced analytics dashboards (Power BI integration)

### Phase 3: Scale and Optimize (October - December 2026)

**Planned Capabilities:**

- Invoice generation and revenue recognition automation
- Purchase order linkage and tracking
- Customer portal for SOW visibility and approval
- Mobile app for timesheet entry and approval
- Advanced workflow automation with AI-assisted decision support

---

## Solution Approach

### 1. Architectural Principles

#### Clean-Sheet Data Model

**Approach:**

- Build automation-ready architecture from ground up, not retrofitting existing systems
- Prioritize relational integrity and data quality over quick fixes
- Design for scalability: 250 → 500+ resources without redesign
- Establish single source of truth for operational data

**Rationale:**

- JobDiva and existing Excel processes not designed for DynPro's specific workflows
- Technical debt from retrofitting would exceed clean build costs within 18 months
- Modern cloud and AI technologies require proper data foundations
- Competitive differentiation through superior operational intelligence

#### Integration, Not Replacement

**Approach:**

- Leverage existing data warehouses (JobDiva) as source systems
- Enhance, don't replace, working components (e.g., India digital offer letters)
- Build abstraction layer for future system flexibility
- Preserve historical data and reporting continuity

**Rationale:**

- Minimize change management resistance
- Reduce implementation risk by incremental transition
- Protect existing investment in JobDiva and CRM infrastructure
- Enable parallel operation during transition period

### 2. Core System Components

#### Component 1: SOW Creation Engine

**Functionality:**

- Guided questionnaire workflow for SOW data capture
- Template library management (generic, customer-specific, reusable)
- Auto-population from opportunity data and customer master
- MSA clause injection based on customer linkage
- Real-time operating margin calculation
- Conditional approval routing (<40% threshold → SLT workflow)
- SOW document generation in multiple formats (Word, PDF)

**Technical Approach:**

- React-based UI for questionnaire workflow
- PostgreSQL database for template and SOW storage
- Node.js backend for business logic and calculations
- Integration APIs: JobDiva (customer/opportunity)
- Template engine: Handlebars or similar for document generation

#### Component 2: Resource Planning and Capacity Engine

**Functionality:**

- Baseline plan creation during SOW sales cycle
- Execution plan management post-SOW signing
- Weekly capacity booking with allocation percentage
- Real-time utilization calculation across all projects
- Over-allocation alerts with threshold configuration
- Underutilization identification for reallocation
- Location-specific working day calculations
- Role-based standard rate application with customer discounts

**Technical Approach:**

- PostgreSQL database with optimized indexing for time-series queries
- Calculation engine: 
  
  ```
  Total Capacity = 40 hrs/week (adjustable per resource)
  Booked = SUM(allocations across all projects)
  Available = Total - Booked
  Utilization % = (Booked / Total) × 100
  ```
- Alert engine with configurable thresholds (>100%, <60%)
- Location calendar integration for accurate working day calculation
- Real-time dashboard updates using WebSocket connections

#### Component 3: Burnt Report Automation

**Functionality:**

- Automated baseline plan capture (locked after SOW signing)
- Live actual hours feed from JobDiva timesheets
- Variance calculation: Hours, Cost, Margin (Planned vs. Actual)
- Color-coded status based on data freshness
- Drill-down capability by resource, project, practice
- Export to Excel/PDF for stakeholder distribution

**Technical Approach:**

- JobDiva API integration for timesheet data pull (hourly sync)
- Calculation engine for variance analysis
- Redis cache for real-time dashboard performance
- Scheduled jobs for FLC updates from Finance system
- Margin erosion alerts when variance exceeds thresholds (e.g., >10%)

#### Component 4: Change Order Workflow

**Functionality:**

- Change request initiation with type classification (timeline, resource, scope)
- Financial impact calculator: Additions, Credits, Net Value
- Line-item detail tracking for multi-resource changes
- Approval routing based on financial magnitude
- SOW value update automation
- Change order document generation
- Integration with execution resource plan updates

**Technical Approach:**

- Workflow engine: Temporal.io or similar for complex approval routing
- Financial calculator with configurable pricing rules
- Document generation engine reusing SOW template infrastructure
- Audit trail for all approvals and rejections
- Email notifications at each workflow stage

#### Component 5: Master Data Management

**Functionality:**

- Customer master with MSA linkage and holiday calendars
- Employee master with FLC tracking and location assignment
- Role library with standard market rates by location
- Skills taxonomy: Practice → Sub-Practice → Competency → Skills
- Location master with calendar and timezone management
- BU Practice hierarchy for organizational structure

**Technical Approach:**

- Daily data refresh from JobDiva for employees and opportunities
- Versioned data model to track FLC changes over time
- Hierarchical data structures for organization and skills
- Data quality rules and validation at entry points
- Master data stewardship roles and workflows

### 3. Integration Architecture

#### JobDiva Integration Points

**Data Flows:**

1. **Inbound to Project Clarity:**
   
   - Customer master (customer_id, name, contacts)
   - Employee master (resource_id, name, location, role)
   - Opportunity data (pipeline for SOW creation)
   - Timesheet data (actual hours for burnt reports)
   - MSA repository (legal clauses and signature dates)

2. **Outbound from Project Clarity:**
   
   - Assignment records (project, resource, dates, allocation %, bill rate, approver)
   - Resource allocation updates
   - SOW metadata for reporting integration

**Technical Approach:**

- REST API integration with JobDiva
- ETL jobs using Airflow or similar orchestration
- Incremental sync for real-time updates (timesheets, opportunities)
- Full refresh overnight for master data
- Error handling and retry logic for data quality

#### SharePoint Integration

**Use Cases:**

- SOW document storage and version control
- Resource plan document repository
- Project Clarity design documentation
- Stakeholder collaboration on templates

**Technical Approach:**

- SharePoint Online REST API
- Document upload automation after SOW generation
- Metadata tagging for searchability
- Folder structure: PMO/Project Clarity/[SOWs|ResourcePlans|Documentation]

#### DocuSign Integration

**Use Cases:**

- SOW signature workflow initiation
- Effective date and signature date capture
- Multi-signer routing (customer, DynPro leadership)
- Signature status tracking

**Technical Approach:**

- DocuSign REST API
- Webhook subscriptions for signature event notifications
- Envelope data capture (signer details, timestamps)
- PDF storage of signed SOWs in SharePoint

### 4. User Experience Design

#### User Personas

**Persona 1: Finance Head**

- **Needs:** Fast SOW creation, template selection, pricing calculator
- **Workflows:** Opportunity → SOW template selection → Data capture → Submit for approval
- **Pain Point Addressed:** Accelerate contract creation from days to hours

**Persona 2: Project Manager (Sharad)**

- **Needs:** Resource planning, capacity visibility, change order creation
- **Workflows:** SOW review → Execution plan creation → Resource assignment → Change order management
- **Pain Point Addressed:** Eliminate manual Excel-based resource planning

**Persona 3: Finance/Operations (Madhup, Aishwarya)**

- **Needs:** Margin visibility, burnt report automation, utilization tracking
- **Workflows:** SOW approval, financial reporting, capacity dashboards
- **Pain Point Addressed:** Real-time financial visibility, eliminate manual reporting

**Persona 4: Resource (Employee)**

- **Needs:** Timesheet entry, assignment visibility, utilization awareness
- **Workflows:** View assignments → Enter time → Submit for approval
- **Pain Point Addressed:** Simplified timesheet process, visibility into allocation

**Persona 5: Executive Leadership**

- **Needs:** KPI dashboards, margin trend analysis, capacity forecasting
- **Workflows:** Review dashboards → Approve low-margin SOWs → Strategic capacity planning
- **Pain Point Addressed:** Data-driven decision making, eliminate manual reporting delays

#### Wireframe Workflows

**SOW Creation Workflow:**

```
Step 1: Select Customer → Auto-populate MSA, holiday calendar
Step 2: Select SOW Template → Lean T&M | Elaborate T&M | Fixed Fee
Step 3: Enter Scope → Auto-suggest from prior SOWs
Step 4: Resource Planning → Roles, hours, rates → Calculate margin
Step 5: Review → Operating margin check → Alert if <40%
Step 6: Submit → Conditional routing (>40% → Sales approval | <40% → SLT workflow)
Step 7: DocuSign → Multi-party signature → Capture effective date
Step 8: Activate → Create execution plan → Trigger assignment records
```

**Capacity Dashboard Workflow:**

```
View: Select Resource | Project | Practice
Timeframe: This Week | Next 4 Weeks | Quarter
Filters: Location, Utilization Threshold (>100%, <60%)
Display:
- Resource List with Utilization %
- Color Coding: Red (>100%) | Yellow (80-100%) | Green (<80%)
- Drill-Down: Click resource → See all project allocations by week
- Action: Reallocate | Extend SOW | Hire Request
```

### 5. Technology Stack

**Frontend:**

- React 18+ with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for SPA navigation
- Axios for API communication

**Backend:**

- Node.js with Express framework
- PostgreSQL 14+ for relational database
- Redis for caching and session management
- Temporal.io for workflow orchestration
- Docker for containerization

**Integration:**

- JobDiva REST API
- DocuSign REST API
- SharePoint Online REST API
- Microsoft Graph API (potential future use)

**Infrastructure:**

- AWS or Azure cloud hosting
- CI/CD: GitHub Actions
- Monitoring: DataDog or New Relic
- Security: OAuth 2.0, JWT tokens, row-level security

**Development Tools:**

- Git/GitHub for version control
- Jira for project management
- Confluence for documentation
- Postman for API testing

### 
