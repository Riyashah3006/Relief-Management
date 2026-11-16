# Vanguard Ops: Disaster Relief Management Platform
## Academic Viva & PPT Presentation Master Guide (Assignments 3 to 9)

**Course:** TY SEM-1 (Third Year Semester 1) DevOps & Agile Software Engineering  
**Project:** Vanguard Ops — Real-Time Disaster Relief & Resource Coordination Platform  
**GitHub Repository:** [https://github.com/Riyashah3006/Relief-Management](https://github.com/Riyashah3006/Relief-Management)  

---

## 👥 Scrum Team Roster & Roles (Assignment 3)

| Team Member | Scrum Role | Primary Responsibilities | Deliverables Handled |
|---|---|---|---|
| **Riya Shah** | **Scrum Master** | Facilitated sprint ceremonies (Sprint Planning, Daily Standup, Sprint Review, Retrospective), cleared blockers, enforced timeboxing, managed Jira project board & burndown velocity. | Jira Sprint Setup, Board Configuration, CI/CD Jenkins Pipeline integration, Final Deployment. |
| **Aarya Shendaware** | **Product Owner (PO)** | Defined product vision, authored User Stories with BDD acceptance criteria (`SCRUM-33` to `SCRUM-42`), prioritized backlog based on business & humanitarian urgency, accepted completed user stories. | Product Backlog grooming, Acceptance Criteria definition, Stakeholder requirement alignment. |
| **Prisha Bankar** | **Lead Developer** | Architecture design, database schema (`node:sqlite`), Express REST API controllers, React frontend components, Docker multi-stage build, and Kubernetes manifests. | Core codebase, RBAC implementation, GIS Leaflet map integration, `Dockerfile`, `k8s/` manifests. |
| **Shweta Pawar** | **QA / Test Engineer** | Test case design (`TC-AUTH-01` to `TC-INV-01`), automated test script execution (`server/tests/api.test.js`), defect logging in Jira (`BUG-VO-001`), regression testing. | Test Specification Matrix, Automated test suite (17/17 passed), Jira Bug lifecycle tracking. |

---

## 🏗️ Assignment 3: Scrum Team & Real-Time Disaster Scenario

### Real-Time Scenario
In a catastrophic disaster (e.g., Mumbai Monsoon Floods, Uttarakhand Landslides), delayed communication and uncoordinated supply drops lead to resource wastage and lost lives. **Vanguard Ops** solves this by providing a unified digital response platform connecting 6 actors: *Citizens, Relief Coordinators, Field Volunteers, Donors, Disaster Authorities, and System Administrators*.

### How the Scrum Team Collaborated:
1. **Sprint Duration:** 2-week timeboxed sprint.
2. **Sprint Planning:** Product Owner (Aarya) presented prioritized backlog items. The team estimated effort using Planning Poker (Story Points: Fibonacci scale 1, 2, 3, 5, 8).
3. **Daily Scrum (Standup):** 15-minute sync answering:
   - What did I do yesterday?
   - What will I do today?
   - Are there any impediments? (Riya Shah resolved roadblocks such as Docker network ports and Windows PowerShell execution policies).
4. **Sprint Review & Demo:** Live demonstration of the working software to stakeholders.
5. **Sprint Retrospective:** Analyzed what went well (fast test execution) and what to improve (handling null emails in audit logging).

---

## 📐 Assignment 4: Design Principles & Refactoring for Agility

To achieve agility, scalability, and maintainability, the codebase was developed and refactored using industry-standard architectural principles:

### 1. SOLID Principles Applied
- **Single Responsibility Principle (SRP):** Each route file (`auth.js`, `disasters.js`, `requests.js`, `inventory.js`, `sos.js`) has one single responsibility. The Express app configuration (`app.js`) was decoupled from server listening (`index.js`) to allow test suites to import the app without port collision.
- **Open/Closed Principle (OCP):** Middleware pipeline is open for extension (e.g., adding rate-limiting or audit logging) without modifying core route handlers.
- **Liskov Substitution Principle (LSP):** Standardized JSON response envelope across all endpoints: `{ success: boolean, message: string, data/user/request?: object }`.
- **Interface Segregation Principle (ISP):** Role-Based Access Control (RBAC) ensures distinct user roles only access interfaces and endpoints relevant to them (Citizen cannot access Coordinator queue; returns HTTP 403).
- **Dependency Inversion Principle (DIP):** Database access is abstracted through standardized query models rather than hardcoding queries inside controllers.

### 2. DRY (Don't Repeat Yourself) & Separation of Concerns
- Common authentication validation extracted to `middleware/auth.js` (JWT token verification).
- Reusable React components: `StatusBadge.jsx` handles dynamic color-coding across requests, severities, and inventory; `GISMap.jsx` centralizes Leaflet map logic.

### 3. Refactoring Case Study (Achieving Agility)
- **Initial Code:** The monolithic server had inline SQL queries, hardcoded port binding, and lacked error handling for unauthenticated users.
- **Refactoring:** Decoupled `app.js` and `index.js`, encapsulated audit logging into `middleware/audit.js`, and migrated to `node:sqlite` (Node's native relational SQLite engine) eliminating native C++ compiler dependencies.

---

## 📊 Assignment 5: Jira Implementation & Project Management

### 1. Jira Project Structure
- **Project Key:** `SCRUM` | **Project Name:** `Relief_Management`
- **Total Work Items:** 42 tickets structured across 3 tiers:
  1. **Epics (16 Epics):**
     - Milestone Epics: `SCRUM-6` (Goal 1: UI Design), `SCRUM-7` (Goal 2: Backend APIs), `SCRUM-8` (Goal 3: Database), `SCRUM-9` (Goal 4: System Testing), `SCRUM-10` (Goal 5: Final Deployment).
     - Functional Epics: `SCRUM-22` (User & Auth), `SCRUM-23` (Disaster Incidents), `SCRUM-24` (Relief Requests), `SCRUM-25` (Inventory), `SCRUM-26` (Distribution), `SCRUM-27` (Volunteers), `SCRUM-28` (Donations), `SCRUM-29` (Notifications), `SCRUM-30` (GIS Tracking), `SCRUM-31` (Analytics), `SCRUM-32` (Admin).
  2. **User Stories (`SCRUM-33` to `SCRUM-42`):** Core user requirements written with story points and BDD acceptance criteria.
  3. **Tasks & Subtasks:** Milestone deliverables and integration tasks.

### 2. User Story Estimation & Story Points
Story Points were assigned based on complexity, uncertainty, and effort:
- `SCRUM-33: Citizen Registration` &rarr; **3 Story Points**
- `SCRUM-34: User Login (with 5-strike lockout)` &rarr; **2 Story Points**
- `SCRUM-35: Password Reset (30-min token)` &rarr; **2 Story Points**
- `SCRUM-36: Role-Based Access Control (6 roles)` &rarr; **5 Story Points**
- `SCRUM-37: Create Disaster Incident (Authority)` &rarr; **5 Story Points**
- `SCRUM-38: View Active Disasters (Filters)` &rarr; **3 Story Points**
- `SCRUM-39: Submit Relief Request (Citizen)` &rarr; **5 Story Points**
- `SCRUM-40: View My Relief Requests (Status filter)` &rarr; **3 Story Points**
- `SCRUM-41: Review & Prioritize Requests (Coordinator)` &rarr; **5 Story Points**
- `SCRUM-42: Approve or Reject Request (Mandatory reason)` &rarr; **3 Story Points**

### 3. Workflow States & Metrics
- **States:** `Backlog` &rarr; `To Do` &rarr; `In Progress` &rarr; `In Review / Testing` &rarr; `Done`.
- **Burndown Chart:** Demonstrated steady velocity drop from 36 committed story points to 0 story points by sprint close.

---

## 🌐 Assignment 6: Case Study — Agile in Software vs. Other Industries

| Dimension | Software Development (Vanguard Ops) | Manufacturing (Automobile / Electronics) | Healthcare (Hospitals / Surgery) | Education (Schools / Universities) |
|---|---|---|---|---|
| **Iteration Length** | 1–2 weeks (Rapid software increments) | Months to years (Rigid tooling & assembly setup) | Shift-based / protocol-driven (Clinical trials take years) | Semesters / Academic quarters (3–6 months) |
| **Cost of Change** | **Near Zero** (Refactor code, redeploy container via CI/CD) | **Extremely High** (Retooling factories, physical mold recasting) | **Life-Critical** (Cannot change drug dosage on trial-and-error in live patient) | **Moderate to High** (Curriculum revisions require regulatory board approvals) |
| **Deliverable Nature** | Intangible digital code (web/mobile app) | Physical tangible goods (cars, appliances) | Patient outcomes, care procedures | Knowledge transfer, student grading |
| **Customer Feedback Loop** | Real-time telemetry, user feedback, analytics | Post-market surveys, recall notices | Clinical recovery, patient feedback | Exam results, semester-end evaluations |
| **Applicability of Agile** | **Native & Optimal** (Scrum, Kanban, XP) | Hybrid (Lean Manufacturing / Six Sigma, Kanban inventory) | Agile in administrative workflows; Waterfall in drug protocols | Agile in curriculum sprint design and project-based learning |

### Why Agile Was Essential for Vanguard Ops:
Disaster relief requirements are volatile. In early sprints, citizens only needed food drops; by Sprint 2, flooding required GPS-tagged SOS emergency rescue beacons and volunteer boat pilots. Agile allowed the team to pivot backlog priorities in 24 hours without breaking architectural stability.

---

## 🐳 Assignment 7: Automated Build Tool (Docker & Kubernetes)

### 1. Docker Multi-Stage Optimization
- **Stage 1 (Builder):** Uses `node:22-alpine`, installs full dependencies, compiles React with Vite into optimized static assets (`client/dist`).
- **Stage 2 (Production Runner):** Uses a lean Alpine runtime, installs only production backend modules (`npm ci --only=production`), copies `client/dist`, runs as non-root user `node`.
- **Result:** Image size reduced from ~1.2 GB down to **~165 MB** (86% footprint reduction).

### 2. Docker Compose
- `docker-compose.yml` configures service container `vanguard-ops-app`, binds port `5000:5000`, implements container health check (`/api/health` every 30s), and maps persistent named volume `vanguard_relief_data` to `/app/data`.

### 3. Kubernetes / OpenShift Orchestration Manifests (`k8s/`)
- `namespace.yaml`: Isolates the workload in `relief-system`.
- `pvc.yaml`: 2 GiB Persistent Volume Claim for SQLite data.
- `deployment.yaml`: Manages 2 replica pods with zero-downtime rolling updates, resource constraints (100m CPU / 128Mi RAM requests), and automated Liveness/Readiness HTTP probes.
- `service.yaml`: Exposes port 5000 externally via NodePort 30500.
- `ingress.yaml` & `openshift/route.yaml`: Handles host-based routing.

---

## ⚙️ Assignment 8: Continuous Integration using Jenkins

### 1. Enterprise 8-Stage Declarative Pipeline (`Jenkinsfile`)
1. **Stage 1: Checkout SCM** &rarr; Clones branch `main` from `https://github.com/Riyashah3006/Relief-Management.git`.
2. **Stage 2: Environment Check** &rarr; Validates Node.js (v24), npm, Git, and Docker daemon.
3. **Stage 3: Install Dependencies** &rarr; Deterministic `npm ci` for server and client.
4. **Stage 4: Automated Testing** &rarr; Executes `npm test` verifying all 17 Jira acceptance criteria.
5. **Stage 5: Build Frontend** &rarr; Vite bundles HTML/CSS/JS into `client/dist`.
6. **Stage 6: Build Docker Image** &rarr; Tags `riyashah3006/relief-management:${BUILD_NUMBER}`.
7. **Stage 7: Smoke & Health Test** &rarr; Boots transient container, probes `/api/health` HTTP 200, and cleans up.
8. **Stage 8: Deploy Application** &rarr; Deploys with Docker Compose on port 5000.

### 2. GitHub Webhook Automation
- Configured repository webhook: `http://<jenkins-url>:8080/github-webhook/` triggering automated builds on every `git push`.

---

## 🧪 Assignment 9: Agile Testing Activities in Jira

### 1. Test Specification Matrix (100% Jira Traceability)

| Test ID | Jira Story | Objective | Expected Result | Status |
|---|---|---|---|:---:|
| `TC-AUTH-01` | `SCRUM-33` | Citizen Registration (Valid input) | HTTP 201; Role defaulted to `Citizen`; verification notice sent | **PASS** |
| `TC-AUTH-02` | `SCRUM-33` | Registration Validation (Missing fields) | HTTP 400; "Name, email, and password are mandatory" | **PASS** |
| `TC-AUTH-03` | `SCRUM-33` | Registration Duplicate Check | HTTP 400; "Email already registered" error | **PASS** |
| `TC-AUTH-04` | `SCRUM-34` | User Login (Valid credentials) | HTTP 200; JWT token returned; redirect to role dashboard | **PASS** |
| `TC-AUTH-05` | `SCRUM-34` | Login Invalid Password | HTTP 400; "Invalid email or password"; strike incremented | **PASS** |
| `TC-AUTH-06` | `SCRUM-34` | 5-Strike Account Lockout | HTTP 403; Account locked for 15 minutes on 6th attempt | **PASS** |
| `TC-AUTH-07` | `SCRUM-35` | Password Reset Token | HTTP 200; 30-min secure reset token generated | **PASS** |
| `TC-RBAC-01` | `SCRUM-36` | RBAC Route Protection | HTTP 403 Forbidden when Citizen accesses Coordinator queue | **PASS** |
| `TC-DIS-01` | `SCRUM-38` | View Active Disasters | HTTP 200; Returns array of active incidents with coordinates | **PASS** |
| `TC-DIS-02` | `SCRUM-37` | Create Disaster Incident | HTTP 201; Unique ID `DIS-XXX` generated; coordinators notified | **PASS** |
| `TC-REQ-01` | `SCRUM-39` | Submit Relief Request | HTTP 201; Status `Submitted`; unique request ID generated | **PASS** |
| `TC-REQ-02` | `SCRUM-40` | View My Requests | HTTP 200; Citizen retrieves their submissions & status | **PASS** |
| `TC-REQ-03` | `SCRUM-41` | Review & Prioritize Request | HTTP 200; Priority set; status changes to `Under Review` | **PASS** |
| `TC-REQ-04` | `SCRUM-42` | Reject Request (Mandatory reason) | HTTP 400 when reason is missing; rejection requires note | **PASS** |
| `TC-REQ-05` | `SCRUM-42` | Approve Request | HTTP 200; Status changes to `Approved`; moves to allocation queue | **PASS** |
| `TC-SOS-01` | `SCRUM-17` | Emergency SOS Beacon | HTTP 201; Status `Active`; GPS coordinates broadcast | **PASS** |
| `TC-INV-01` | `SCRUM-25/26`| Resource Allocation | HTTP 201; Warehouse inventory stock decremented | **PASS** |

### 2. Automated Test Suite Execution
- **File:** `server/tests/api.test.js`
- **Execution Command:** `npm test`
- **Telemetry:** **17 passed, 0 failed, duration 1.44s (100% Pass Rate)**.

### 3. Defect Lifecycle Case Study (`BUG-VO-001`)
- **Found During:** Unauthenticated emergency SOS testing.
- **Defect:** SQLite parameter binding error when `req.body.email` was undefined.
- **Workflow:** `Open` &rarr; `In Progress` &rarr; `Resolved` &rarr; `Done`.
- **Resolution:** Refactored `server/middleware/audit.js` with fallback: `(req.user?.email || req.body?.email || 'Anonymous')`.

---

## 🎯 Viva Q&A Cheat Sheet (Top 10 Examiner Questions)

1. **Q: What was your specific role in the Scrum team?**  
   *A:* "I was the **Scrum Master**. I facilitated sprint planning, daily standups, sprint reviews, and retrospectives. I resolved blockers (such as Docker network binding and PowerShell script execution permissions), tracked team velocity via Jira burndown charts, and coordinated between the Product Owner and Developers."

2. **Q: How did you implement Role-Based Access Control (RBAC)?**  
   *A:* "We enforced RBAC at two levels: on the backend using custom Express middleware (`server/middleware/rbac.js`) that checks the JWT user role and returns HTTP 403 Forbidden if unauthorized; and on the frontend using React `ProtectedRoute.jsx` that conditionally renders the portal or an access-restricted page."

3. **Q: Why did you use a Multi-Stage Dockerfile instead of a single-stage one?**  
   *A:* "A single-stage build carries build dependencies, compilers, and Vite development packages, bloating the image to ~1.2 GB. Our multi-stage build discards the development toolchain after building assets, resulting in a clean, production-hardened Alpine runtime of only **~165 MB**."

4. **Q: What happens when 5 consecutive failed login attempts occur?**  
   *A:* "Under `SCRUM-34`, the backend increments a `failed_attempts` counter. On the 5th failed attempt, it sets `locked_until` to `now + 15 minutes`. Any subsequent login attempt returns HTTP 403 with the remaining lockout minutes. Successful login resets the counter."

5. **Q: What are the stages in your Jenkins pipeline?**  
   *A:* "Our declarative `Jenkinsfile` has 8 stages: Checkout SCM, Environment Check, Install Dependencies, Automated Unit/API Testing, Build Frontend, Build Docker Image, Smoke & Health Test, and Deploy Application via Docker Compose."

6. **Q: How does your application handle database persistence in Docker and Kubernetes?**  
   *A:* "In Docker Compose, we mount a named volume `vanguard_relief_data` to `/app/data`. In Kubernetes, we define a 2 GiB `PersistentVolumeClaim` (`k8s/pvc.yaml`) mounted into the pod specification, ensuring data survives pod restarts and rolling updates."

7. **Q: How did you calculate Story Points in Jira?**  
   *A:* "We used the Fibonacci sequence (1, 2, 3, 5, 8) based on complexity, uncertainty, and effort. Low-complexity items like Password Reset were 2 points, whereas full RBAC and Request Prioritization were estimated at 5 points each."

8. **Q: What is the difference between Scrum and Kanban?**  
   *A:* "Scrum is timeboxed into fixed sprints (typically 2 weeks) with defined roles (Scrum Master, Product Owner, Dev team) and ceremonies. Kanban is continuous flow with no fixed timeboxes, focusing on visualizing work and limiting Work-In-Progress (WIP)."

9. **Q: How does Agile in software differ from Agile in healthcare or manufacturing?**  
   *A:* "In software, the cost of change is nearly zero because code can be refactored and redeployed in seconds. In manufacturing, changing a physical mold costs millions; in healthcare, clinical trials must adhere to rigid waterfall safety protocols because human life is on the line."

10. **Q: Can you show a real bug you found and resolved during sprint testing?**  
    *A:* "Yes, defect `BUG-VO-001`: during unauthenticated SOS beacon calls, SQLite threw a parameter binding error because the email field was undefined. We resolved it in `server/middleware/audit.js` using fallback coalescing, verified it with automated test `TC-SOS-01`, and marked it Done in Jira."
