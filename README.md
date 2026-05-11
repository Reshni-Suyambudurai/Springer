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

## Prerequisites

### Required Software

| Software | Version | Download Link |
|----------|---------|---------------|
| **Java JDK** | 21 or higher | [Oracle JDK](https://www.oracle.com/java/technologies/downloads/) / [OpenJDK](https://adoptium.net/) |
| **Node.js** | 18 or higher | [Node.js Official](https://nodejs.org/) |
| **MySQL** | 8.0 or higher | [MySQL Community](https://dev.mysql.com/downloads/mysql/) |
| **Maven** (optional) | 3.9+ | Included via `mvnw` wrapper |

---

## Installation Steps

### 1. Install Java 21+

**Windows:**
1. Download JDK 21 from [Oracle](https://www.oracle.com/java/technologies/downloads/#jdk21-windows) or [Adoptium](https://adoptium.net/)
2. Run the installer and follow the wizard
3. Add Java to PATH:
   - Right-click **This PC** → **Properties** → **Advanced system settings**
   - Click **Environment Variables**
   - Add `C:\Program Files\Java\jdk-21\bin` to **Path**
4. Verify: `java -version` in Command Prompt

**macOS/Linux:**
```bash
# Using SDKMAN (recommended)
curl -s "https://get.sdkman.io" | bash
sdk install java 21.0.1-tem

# Or using Homebrew (macOS)
brew install openjdk@21
```

### 2. Install Node.js 18+

**Windows:**
1. Download installer from [Node.js](https://nodejs.org/)
2. Run installer (select "Automatically install necessary tools")
3. Verify: `node -v` and `npm -v`

**macOS/Linux:**
```bash
# Using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
nvm install 18
nvm use 18
```

### 3. Install MySQL 8.0+

**Windows:**
1. Download MySQL Installer from [MySQL Downloads](https://dev.mysql.com/downloads/installer/)
2. Run installer → Choose "Developer Default" or "Server only"
3. During configuration:
   - Set root password (e.g., `admin` or as per your preference)
   - Use default port `3306`
   - Start MySQL as Windows Service
4. Verify: Open Services (`services.msc`) → ensure `MySQL80` is running

**macOS:**
```bash
brew install mysql@8.0
brew services start mysql@8.0
mysql_secure_installation
```

**Linux:**
```bash
sudo apt update
sudo apt install mysql-server
sudo systemctl start mysql
sudo mysql_secure_installation
```

### 4. (Optional) Add MySQL CLI to PATH

**Windows:**
- Add `C:\Program Files\MySQL\MySQL Server 8.0\bin` to system PATH
- This allows the startup script to auto-create the database
- If not in PATH, manually create database before first run:
  ```sql
  CREATE DATABASE Springer;
  ```

---

## Quick Start (Automated)

### Step 1: Configure Database Credentials

Edit `config.bat` at the project root:

```batch
set DB_USER=root
set DB_PASS=your_mysql_password
set MYSQL_SERVICE=MySQL80
```

### Step 2: Start the Application

Double-click **`start-springer.bat`**

The script will automatically:
- ✅ Check Java, Node.js, and Maven installations
- ✅ Start MySQL service if stopped
- ✅ Create `Springer` database if it doesn't exist (requires mysql CLI in PATH)
- ✅ Build backend (first run only)
- ✅ Install frontend dependencies (first run only)
- ✅ Start Spring Boot backend on port `8080`
- ✅ Start React frontend on port `5173`
- ✅ Open browser at `http://localhost:5173`

**Backend auto-seeding:**
- On first run, `DataLoader.java` seeds:
  - Roles (TA_HEAD, TA_MANAGER, HIRING_MANAGER, PANEL_MEMBER, etc.)
  - Demo users (see credentials below)
  - Hiring cycles (2024, 2025, 2026)
  - Institutes (Anna University, PSG, VIT, SRM, etc.)
  - Skills (Java, Python, React, etc.)
  - Round templates (Aptitude, Communication, Technical)
  - Email templates (document submission, rejection, drive invites, etc.)

### Step 3: Stop the Application

Double-click **`stop-springer.bat`** to stop all services.

---

## Manual Setup (Without .bat files)

### Backend Setup

```bash
cd springer
mvn clean install -DskipTests
mvn spring-boot:run
```

Backend will start on **http://localhost:8080**  
Swagger UI: **http://localhost:8080/swagger-ui.html** (disabled in production profile)

### Frontend Setup

```bash
cd springer_frontend
npm install
npm run dev
```

Frontend will start on **http://localhost:5173**

### Database Setup (Manual)

If mysql CLI is not in PATH, create the database manually:

```sql
CREATE DATABASE Springer;
```

Tables and data will be created automatically by Hibernate and DataLoader on first backend startup.

---

## Default Login Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| **TA Head** | sudha@kanini.com | password123 | Approve demands, manage cycles |
| **TA Recruiter** | mozhi@kanini.com | password123 | Manage institutes, drives, candidates |
| **Hiring Manager** | parthiban@kanini.com | password123 | Raise hiring demands |
| **Panel Member** | ramesh@kanini.com | password123 | Score candidates in rounds |
| **Training Coordinator** | lavanya@kanini.com | password123 | Manage academy training programs |
| **System Admin** | admin@kanini.com | admin@123 | Admin dashboard and user management |

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

## Recent Updates

- ✅ **Admin User Management** — Create users, toggle status, manage roles
- ✅ **Hiring Cycle Edit** — Edit cycle info (name, year, budget, total intake, JD) via dialog
- ✅ **Multi-Template Email Support** — SendEmail component now supports multiple template selection
- ✅ **Email Templates** — 5 templates seeded (document submission, rejection, on-campus drive, off-campus drive, shortlist invite, round selection)
- ✅ **Automated Deployment Scripts** — `.bat` files for one-click setup and teardown
- ✅ **Enhanced .gitignore** — Proper exclusion of logs, node_modules, build artifacts

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

---

## Contributors

Kanini Team - Talent Acquisition Module Development (2026)
