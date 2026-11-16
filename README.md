# Vanguard Ops: Disaster Relief Management System

> **Third Year Semester 1 (TY SEM-1) Capstone Engineering Project**  
> Complete Full-Stack Working Application mapped 100% to **Jira Scrum Board (SCRUM-1 through SCRUM-42)**.  
> Containerized for **Docker**, with Kubernetes/OpenShift deployment assets and persistent storage.

---

## 🚀 Quick Start Guide

### Option A: Run Directly with Node.js (Zero external setup)
```bash
# 1. From the project root, start the full-stack application:
npm start

# Open your browser at:
# http://localhost:5000
```
*Note: The frontend is pre-built into `client/dist`. The Node server serves both the REST API and the React frontend on port `5000` with the SQLite database auto-seeded!*

---

### Option B: Deploy with Docker & Docker Compose (Containerized)
Ensure Docker Desktop is running on your machine, then run:

```bash
# Create a local environment file and replace the JWT_SECRET placeholder
cp .env.example .env
# Generate a secret with: node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"

# Build and launch the container in the background
docker compose up --build -d

# Check container status
docker compose ps

# View live container logs
docker compose logs -f

# Stop container
docker compose down
```

- **Application URL**: `http://localhost:5000`
- **Health Check**: `http://localhost:5000/api/health`
- **Persistent Volume**: Database is preserved inside Docker named volume `vanguard_relief_data`.
- **Secret**: Production mode requires `JWT_SECRET`; do not commit `.env` or use the development-only fallback.

### Option C: Deploy to Kubernetes

The manifests in `k8s/app.yaml` create a single-replica Deployment, Service,
ConfigMap, and persistent claim for SQLite. Create the namespace and secret
before applying them:

```bash
kubectl create namespace relief-management
kubectl create secret generic relief-management --from-literal=jwt-secret="<generated-random-secret>" --namespace relief-management
kubectl apply --namespace relief-management -f k8s/app.yaml
kubectl rollout status deployment/relief-management --namespace relief-management
kubectl get service,pods --namespace relief-management
```

Port-forward the internal service to test it:

```bash
kubectl port-forward service/relief-management 5000:80 --namespace relief-management
```

The SQLite database requires persistent storage; the supplied claim requests
1 GiB and may need a storage-class adjustment for your cluster. Keep one
replica because SQLite is not a shared multi-replica database. Update the image
tag in the Deployment to the commit tag published by Jenkins before rollout.

### Option D: Deploy to OpenShift

`openshift/` provides a patch for the OpenShift-assigned filesystem group and a
TLS-terminating Route. Log in with `oc`, select the target project, create the
secret, apply the Kubernetes resources, then apply the OpenShift patch and
Route:

```bash
oc project <project-name>
oc create secret generic relief-management --from-literal=jwt-secret="<generated-random-secret>"
oc apply -f k8s/app.yaml
oc patch deployment relief-management --type=json --patch-file=openshift/fs-group-patch.yaml
oc apply -f openshift/route.yaml
oc rollout status deployment/relief-management
oc get route relief-management
```

The OpenShift cluster must provide a persistent-volume storage class. If the
image package is private in GHCR, configure an image-pull secret for the project
and reference it from the Deployment.

### Continuous Integration with Jenkins

The root `Jenkinsfile` installs locked dependencies, runs the API smoke test,
builds the Vite frontend, and builds the container. On the `main` branch it
publishes both `latest` and the commit-SHA tag to GHCR. Configure a
Docker-capable Jenkins agent with Node.js 22, Docker, and Pipeline support; add
a Jenkins username/password credential named `ghcr-credentials` with permission
to publish the package. Configure the GitHub repository webhook or poll SCM to
trigger branch builds. Runtime `JWT_SECRET` is supplied by Compose/Kubernetes,
not embedded in the image.

### Agile Testing in Jira

Use the existing SCRUM stories and acceptance criteria to create test subtasks,
record sprint test execution, link defects, and attach CI/evidence. The test
workflow, coverage matrix, and execution record template are in
[`docs/AGILE_TESTING.md`](docs/AGILE_TESTING.md). Run the automated checks with
`npm test` and `npm run build:client`; actual Jira execution results must be
entered by the project team in Jira.

---

## 👥 Demo Accounts (All 6 RBAC Roles Pre-Seeded)

The application includes a **1-Click Persona Switcher** in the top navigation bar to test all 6 roles without repeatedly logging out.

| Role | Name | Email | Password | Primary Capabilities |
|---|---|---|---|---|
| **Citizen** | Amit Kumar | `citizen@relief.org` | `Password@123` | Submit requests (SCRUM-39), track requests (SCRUM-40), trigger SOS beacon |
| **Coordinator** | Vikram Malhotra | `coordinator@relief.org` | `Password@123` | Review & prioritize queue (SCRUM-41), approve/reject (SCRUM-42), allocate stock (SCRUM-26) |
| **Volunteer** | Rohan Verma | `volunteer@relief.org` | `Password@123` | Profile skills, accept dispatch missions, submit delivery proof (SCRUM-27) |
| **Donor** | Pooja Patel | `donor@relief.org` | `Password@123` | Fund campaigns, pledge supplies, instant verified receipts (SCRUM-28) |
| **Authority** | Comm. Ananya Deshmukh | `authority@relief.org` | `Password@123` | Declare disaster incidents & perimeters (SCRUM-37), broadcast alerts (SCRUM-29) |
| **Admin** | Dr. Rajesh Sharma | `admin@relief.org` | `Password@123` | System admin, RBAC role management, audit trail logs (SCRUM-32, 36) |

---

## 📋 Jira Scrum Requirements Traceability Matrix

Every single ticket from `Jira.csv` is fully fulfilled in the codebase:

### 1. User Stories & Acceptance Criteria (SCRUM-33 to SCRUM-42)

| Jira Key | Summary & Epic | Implementation Details | Acceptance Criteria Verification |
|---|---|---|---|
| **SCRUM-33** | **Citizen Registration**<br>*(User & Auth Management)* | `server/routes/auth.js` (`/api/auth/register`)<br>`client/src/pages/Register.jsx` | ✅ Name, email, phone, password, location captured.<br>✅ Validation on missing mandatory fields.<br>✅ Duplicate check: "Email already registered" error.<br>✅ Default assigned role: **Citizen**.<br>✅ Verification email simulated. |
| **SCRUM-34** | **User Login**<br>*(User & Auth Management)* | `server/routes/auth.js` (`/api/auth/login`)<br>`client/src/pages/Login.jsx` | ✅ Authenticates credentials and issues JWT token.<br>✅ Role-based redirect to dedicated portal.<br>✅ "Invalid email or password" error.<br>✅ **Account lockout for 15 minutes after 5 consecutive failed attempts** (6th attempt locked). |
| **SCRUM-35** | **Password Reset**<br>*(User & Auth Management)* | `server/routes/auth.js` (`/api/auth/forgot-password`, `/reset-password`)<br>`client/src/pages/ForgotPassword.jsx` | ✅ "Forgot Password" creates secure 30-min token.<br>✅ Reset link allows setting new password.<br>✅ Rejects expired tokens with "Link expired, request a new one". |
| **SCRUM-36** | **Role-Based Access Control**<br>*(User & Auth Management)* | `server/middleware/rbac.js`<br>`client/src/components/ProtectedRoute.jsx` | ✅ 6 distinct roles enforced.<br>✅ Menus and navigation adapt to user role.<br>✅ Unauthorized direct URL navigation returns **HTTP 403 Forbidden** page. |
| **SCRUM-37** | **Create Disaster Incident**<br>*(Disaster Incident Management)* | `server/routes/disasters.js` (`POST /api/disasters`)<br>`client/src/pages/Disasters.jsx` | ✅ Authority/Admin creates incident (type, severity, coordinates, radius, area, desc).<br>✅ Generates unique incident ID (`DIS-XXX`) with status `Active`.<br>✅ Validation on missing fields.<br>✅ Auto-triggers notification alert to all Relief Coordinators. |
| **SCRUM-38** | **View Active Disasters**<br>*(Disaster Incident Management)* | `server/routes/disasters.js` (`GET /api/disasters`)<br>`client/src/pages/Disasters.jsx`<br>`client/src/pages/DisasterDetail.jsx` | ✅ Displays active incidents with type, severity, location, radius, date.<br>✅ Filters by disaster type and severity.<br>✅ Incident detail view with affected area, request counters, and GIS map. |
| **SCRUM-39** | **Submit Relief Request**<br>*(Relief Request Management)* | `server/routes/requests.js` (`POST /api/requests`)<br>`client/src/pages/CitizenPortal.jsx` | ✅ Citizen selects disaster, need (Food, Shelter, Medical, Clothing, Rescue), urgency, people affected, address.<br>✅ Generates unique request ID (`REQ-XXXX`) with status `Submitted`.<br>✅ Confirmation notification with request ID sent to citizen.<br>✅ Missing mandatory fields prevented. |
| **SCRUM-40** | **View My Relief Requests**<br>*(Relief Request Management)* | `server/routes/requests.js` (`GET /api/requests/my`)<br>`client/src/pages/CitizenPortal.jsx` | ✅ Displays citizen's requests with ID, type, status, submission date.<br>✅ Filter by status: `Submitted`, `Under Review`, `Approved`, `Rejected`, `Completed`.<br>✅ Detail popup shows timeline, coordinator notes, and allocated supplies. |
| **SCRUM-41** | **Review & Prioritize Requests**<br>*(Relief Request Management)* | `server/routes/requests.js` (`/coordinator/queue`, `PATCH /:id/prioritize`)<br>`client/src/pages/CoordinatorPortal.jsx` | ✅ Queue lists submitted requests with citizen details, location, affected count, urgency.<br>✅ Default sorting by urgency weight and submission timestamp.<br>✅ Coordinator assigns priority (`Critical`, `High`, `Medium`, `Low`) &rarr; status updates to **"Under Review"**. |
| **SCRUM-42** | **Approve or Reject Request**<br>*(Relief Request Management)* | `server/routes/requests.js` (`POST /:id/approve`, `POST /:id/reject`)<br>`client/src/pages/CoordinatorPortal.jsx` | ✅ Approve with comments &rarr; status changes to **"Approved"**, citizen notified, pushes to **Resource Allocation** queue.<br>✅ Reject requires **mandatory rejection reason** &rarr; status changes to **"Rejected"**, citizen notified with reason. |

---

### 2. Core Functional Epics (SCRUM-22 to SCRUM-32)

- **SCRUM-22: User & Authentication Management**: Full JWT + bcrypt authentication, profile management, and session handling.
- **SCRUM-23: Disaster Incident Management**: Multi-incident tracking with GIS coordinates, affected radii, and severity grading.
- **SCRUM-24: Relief Request Management**: Complete citizen-to-coordinator pipeline.
- **SCRUM-25: Resource & Inventory Management**: Stock tracking across categories (`Food & Water`, `Medical`, `Bedding & Shelter`, `Clothing`, `Sanitation`), warehouse locations, and low-stock threshold alerts.
- **SCRUM-26: Relief Distribution Management**: Stock deduction upon allocation to approved requests, volunteer mission assignment, and delivery lifecycle (`Allocated` &rarr; `Dispatched` &rarr; `In Transit` &rarr; `Delivered` &rarr; `Completed`).
- **SCRUM-27: Volunteer Management**: Volunteer skill profiling, deployment area, availability status, mission task acceptance, and on-ground completion reporting.
- **SCRUM-28: Donation Management**: Active fundraising appeals, monetary and in-kind donation checkout simulation, and generated verifiable receipts (`RCP-2026-XXXX`).
- **SCRUM-29: Notification & Alert Management**: Real-time notification center for all actors with role-targeted broadcasts, unread badges, and mark-as-read.
- **SCRUM-30: Tracking & Monitoring**: Live GIS map with interactive disaster perimeters, relief request pins, and distress signals.
- **SCRUM-31: Reports & Analytics**: Operational metrics, breakdown by request type, urgency distribution bars, warehouse inventory levels, and relief fund KPIs.
- **SCRUM-32: Administration & Security**: User role promotion/demotion, account unlock controls, system health diagnostics, and tamper-evident audit logs.

---

### 3. Timeline Goals & Milestones (SCRUM-6 to SCRUM-21)

- **SCRUM-6 / 11 / 12 (Goal 1: Complete UI Design)**: Modern, responsive UI with Tailwind CSS, custom status badges, modal dialogs, and emergency design system.
- **SCRUM-7 / 13 / 15 (Goal 2: Backend APIs & Auth)**: Modular Express REST API with input validation, JWT token security, and RBAC authorization guards.
- **SCRUM-14 (GIS & Maps integration)**: Leaflet OpenStreetMap integration with custom markers and interactive radius circles.
- **SCRUM-8 / 16 (Goal 3: Database Integration)**: High-performance relational schema powered by Node built-in SQLite (`node:sqlite`) with pre-seeded demo records.
- **SCRUM-9 / 17 (Goal 4: SOS Module)**: Live emergency SOS distress button with GPS geolocation and instant coordinator alerting.
- **SCRUM-18 (Shelter & Resource Module)**: Dedicated warehouse stockpile management with low-stock warnings.
- **SCRUM-19 / 20 (Testing & Bug Fixes)**: Validated endpoints, zero build errors, and tested state flows.
- **SCRUM-10 / 21 (Goal 5: Final Deployment)**: Production multi-stage `Dockerfile` and `docker-compose.yml` for turnkey deployment.

---

## 🛠️ Architecture & Technology Stack

```
Relief_Management/
├── Dockerfile                      # Multi-stage production container build
├── docker-compose.yml              # Single-command Docker orchestration
├── .dockerignore
├── Jenkinsfile                     # CI test, build, and GHCR publish pipeline
├── k8s/                             # Kubernetes deployment and persistent storage
├── openshift/                       # OpenShift security patch and secure Route
├── docs/AGILE_TESTING.md            # Jira sprint testing workflow and coverage
├── package.json                    # Root scripts for build & run
├── Jira.csv                        # Source Jira Scrum export
├── server/                         # Express.js Backend REST API
│   ├── index.js                    # Database seeding and server entrypoint
│   ├── app.js                       # Express app, API routes, and static serving
│   ├── test/                        # Node built-in test runner checks
│   ├── config/
│   │   ├── database.js             # SQLite relational schema & tables
│   │   └── seed.js                 # Realistic disaster & user demo seeder
│   ├── middleware/
│   │   ├── auth.js                 # JWT bearer token verification
│   │   ├── rbac.js                 # Role authorization & HTTP 403 guard
│   │   └── audit.js                # Security audit logging engine
│   └── routes/                     # REST API modules (auth, disasters, requests, etc.)
└── client/                         # React 18 + Vite + Tailwind CSS Frontend
    ├── vite.config.js              # Vite bundler & API proxy
    ├── tailwind.config.js          # Disaster color extensions
    ├── src/
    │   ├── context/                # AuthContext (6 roles) & NotificationContext
    │   ├── components/             # Navbar, GISMap, SOSModal, StatusBadge, QuickRoleSwitcher
    │   └── pages/                  # Portals for Citizen, Coordinator, Volunteer, Donor, Admin, GIS
```

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons, Leaflet (OpenStreetMap).
- **Backend**: Node.js v22/24, Express.js, JWT, bcryptjs, CORS.
- **Database**: `node:sqlite` (native relational SQLite with zero native compilation dependencies).
- **Containerization**: Docker, Docker Compose, Alpine Linux images.

---

## 🧪 Development Commands

If you want to run the client and server separately during development with live reload:

```bash
# Terminal 1: Backend with auto-reload
cd server
npm run dev

# Terminal 2: Frontend with Vite HMR
cd client
npm run dev
```

Frontend will run at `http://localhost:3000` and automatically proxy `/api` requests to `http://localhost:5000`.
