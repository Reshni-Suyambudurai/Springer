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

### TA Manager
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
- Create users, toggle status, manage roles *(Recent)*

### Recent Updates
- **Admin User Management** — Create users, toggle status, manage roles
- **Hiring Cycle Edit** — Edit cycle info (name, year, budget, total intake, JD) via dialog
- **Multi-Template Email Support** — SendEmail component now supports multiple template selection
- **Email Templates** — 5 templates seeded (document submission, rejection, on-campus drive, off-campus drive, shortlist invite, round selection)
- **Automated Deployment Scripts** — `.bat` files for one-click setup and teardown
- **Enhanced .gitignore** — Proper exclusion of logs, node_modules, build artifacts

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

## Installation Steps

| Software | Version | Download |
|----------|---------|----------|
| **Java JDK** | 21+ | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) / [Adoptium](https://adoptium.net/) |
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **MySQL** | 8.0+ | [MySQL Community](https://dev.mysql.com/downloads/mysql/) |

Ensure `java`, `node`, and `mysql` are available in your system PATH after installation.

---

## Running the Application

### Using `.bat` files (Windows — Recommended)

1. Edit `config.bat` with your MySQL credentials:
   ```batch
   set DB_USER=root
   set DB_PASS=your_mysql_password
   set MYSQL_SERVICE=MySQL80
   ```
2. Double-click **`start-springer.bat`** to start backend + frontend.
3. Double-click **`stop-springer.bat`** to stop all services.

App opens at **http://localhost:5173**

### Manual Setup

**Backend:**
```bash
cd springer
mvn clean install -DskipTests
mvn spring-boot:run
```
Runs on **http://localhost:8080** | Swagger: **http://localhost:8080/swagger-ui.html**

**Frontend:**
```bash
cd springer_frontend
npm install
npm run dev
```
Runs on **http://localhost:5173**

**Database:** If MySQL CLI is not in PATH, manually create the DB first:
```sql
CREATE DATABASE Springer;
```
Tables and seed data are created automatically on first backend startup.

---

## Default Login Credentials

| Name | Role | Email | Password | Department | Location |
|------|------|-------|----------|------------|----------|
| **Sudha** | TA Head | sudha@kanini.com | password123 | Talent Acquisition | Chennai |
| **Mozhi** | TA Manager | mozhi@kanini.com | password123 | Talent Acquisition | Bangalore |
| **Priya** | TA Manager | priya@kanini.com | password123 | Talent Acquisition | Chennai |
| **Parthiban** | Hiring Manager | parthiban@kanini.com | password123 | Product Engineering | Bangalore |
| **Ramesh** | Panel Member | ramesh@kanini.com | password123 | Product Engineering | Coimbatore |
| **Priya Rajagopalan** | Panel Member | priya@kanini.com | password@123 | Product Engineering | Coimbatore |
| **Mozhiarasan** | Panel Member | mozhi@kanini.com | password@123 | Product Engineering | Coimbatore |
| **Praveen Kumar** | Panel Member | praveen@kanini.com | password123 | Product Engineering | Coimbatore |
| **Admin** | System Admin | admin@kanini.com | password123 | Data Analytics & AI | Coimbatore |
| **Lavanya** | Training Coordinator | lavanya@kanini.com | password123 | Data Analytics & AI | Coimbatore |
| **John** | Intern | john@kanini.com | password123 | Training | Coimbatore |
| **Joe** | Intern | joe@kanini.com | password123 | Training | Coimbatore |

---

## Environment Profiles

| Profile | Active By | Purpose | Config File |
|---------|-----------|---------|-------------|
| **prod** | Default (`application.properties`) | Production deployment | `application-prod.properties` |
| **test** | Maven test / IDE | H2 in-memory DB for unit tests | `application-test.properties` |
| **dev** | Override via `-Dspring.profiles.active=dev` | Development (if needed) | N/A (uses base config) |

**To switch profiles:**
```bash
java -jar springer.jar --spring.profiles.active=prod
```

---

## Port Configuration

| Service | Port | Override In |
|---------|------|-------------|
| Backend | 8080 | `config.bat` / `application.properties` |
| Frontend | 5173 | `config.bat` / `vite.config.ts` |
| MySQL | 3306 | `config.bat` |

---

## Troubleshooting

**Backend won't start:**
- Ensure MySQL is running: `services.msc` → check `MySQL80` status
- Verify DB credentials in `config.bat` or `application.properties`
- Check port 8080 is not in use: `netstat -ano | findstr :8080`

**Frontend won't start:**
- Delete `node_modules` and run `npm install` again
- Check port 5173 is not in use
- Clear npm cache: `npm cache clean --force`

**Database not created:**
- If mysql CLI not in PATH, manually create: `CREATE DATABASE Springer;`
- Verify MySQL credentials are correct

**"Hibernate ddl-auto update failed":**
- Ensure MySQL user has `CREATE`, `ALTER`, `INSERT` privileges
- Run: `GRANT ALL PRIVILEGES ON Springer.* TO 'root'@'localhost';`

---

## License

Proprietary — Internal project for Kanini Software Solutions

Kanini Team - Talent Enblement Module Development (2026)
