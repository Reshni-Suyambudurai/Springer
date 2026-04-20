# KA25-Springer

**Springer** is a full-stack Talent Acquisition Management System that covers the entire hiring lifecycle — from raising hiring demands and scheduling campus drives, to evaluating candidates, collecting documents, generating offer letters, and onboarding into a training academy.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Backend** | Java 21, Spring Boot 3.5, Spring Security (JWT), Spring Data JPA, MySQL, WebSocket, Apache POI, Swagger/OpenAPI |
| **Frontend** | React 19, TypeScript, Vite, MUI 7, Axios, React Router, Day.js |

---

## Roles & Capabilities

### TA Head
- View and manage hiring cycles
- Approve or reject hiring demands raised by managers
- Access drive calendar and scheduling
- View academy dashboard and analytics
- Configure system settings (eligibility rules, round templates, skills)

### TA Recruiter
- Manage partner institutes and TPO contacts
- Add candidates individually or via bulk Excel upload
- Schedule campus drives (on-campus / off-campus) with calendar view
- Allot candidates to drives, assign panel members across multiple rounds
- Score and evaluate candidates round-wise (PASS / FAIL / ABSENT / HOLD / SKIP)
- Override application statuses with audit trail
- Manage document collection — generate submission links, verify documents
- Generate and track offer letters
- Configure round templates, eligibility rules, skills, and document types

### Hiring Manager
- Create and manage hiring demands within cycles
- View hiring cycle details and demand statuses
- Track demand approval workflow

### Panel Member
- View assigned panel duties per drive
- Score candidates in assigned evaluation rounds
- View past panel assignment history

### Training Coordinator (Academy)
- Create and manage training programs linked to hiring cycles
- Define training courses with min scores and weightage
- Map courses to batches and assign trainers
- Schedule batch timelines
- Allocate candidates to training batches
- Mark daily attendance (individual or bulk)
- Record course scores and reviews
- Track candidate performance and joining status
- Academy calendar view

### System Admin
- Admin dashboard for system management

---

## Key Features

| Feature | Description |
|---------|-------------|
| Hiring Cycle Management | Create yearly cycles with budgets, compensation bands, JD uploads |
| Hiring Demand Workflow | Managers raise demands → TA Head approves/rejects |
| Institute Management | Tiered institute database with TPO contacts |
| Candidate Management | Individual or bulk Excel upload with eligibility validation |
| Drive Scheduling | Calendar-based campus drive scheduling |
| Multi-Round Evaluation | Configurable round templates with section-wise scoring |
| Multi-Panel Allocation | Multiple panel members per candidate per round with individual scores |
| Document Collection | Unique links for candidates to upload documents |
| Document Verification | Review and approve/reject submitted documents |
| Offer Letter Tracking | Generate offers, track acceptance/decline |
| Academy Training | Full training program — courses, batches, attendance, scores |
| Manual Override Audit | All status overrides logged with reason and change history |
| Real-time Notifications | WebSocket-based notifications per user |
| Role-Based Access Control | Route protection with role-specific dashboards and menus |
| Dark/Light Theme | User-selectable theme preference |

---

## Project Structure

```
springer/                          # Spring Boot backend
├── controller/                    # REST endpoints (by module)
├── service/                       # Business logic (interface + impl)
├── repository/                    # Spring Data JPA repositories
├── entity/                        # JPA entities
├── dto/                           # Request/Response DTOs
├── mapper/                        # Entity ↔ DTO mappers
├── config/                        # Security, WebSocket, Swagger, JWT
├── exception/                     # Global exception handler
└── specification/                 # JPA Specifications for dynamic queries

springer_frontend/                 # React + TypeScript frontend
├── src/components/                # Role-organized UI components
│   ├── Admin/
│   ├── TA_Head/
│   ├── TA_Recruiter/
│   ├── HiringManager/
│   ├── Panel_Member/
│   ├── Academy/TrainingCoordinator/
│   └── Common/
├── src/services/                  # Axios-based API layer
├── src/types/                     # TypeScript interfaces
├── src/auth/                      # Token storage, protected routes
├── src/hooks/                     # Custom React hooks
├── src/css/                       # Stylesheets (role-organized)
└── src/pages/                     # Standalone pages (404, Unauthorized)
```

---
