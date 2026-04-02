# Academy + Document Collection Demo Test Guide

Date: 2026-04-02
Owner: Academy + Document Collection

## 1. Pre-Check (2 minutes)

1. Ensure MySQL is running.
2. Backend should be reachable at `http://localhost:8080`.
3. Frontend should be reachable at `http://localhost:5173` or `http://localhost:5174`.
4. Confirm login works for at least one Academy user and one Document user.

## 2. Start Commands

Open terminal 1:

```powershell
cd springer
.\mvnw.cmd spring-boot:run
```

Open terminal 2:

```powershell
cd springer_frontend
npm run dev
```

If port 5173 is busy, use the URL Vite prints (for example `http://localhost:5174`).

## 3. Demo Login Users

Use these demo users:

- `lavanya@kanini.com` / `password123` (TRAINING_COORDINATOR)
- `mozhi@kanini.com` / `password123` (TA_RECRUITER)
- `sudha@kanini.com` / `password123` (TA_HEAD)

## 4. Academy Module Test Cases

Navigate to Academy dashboard.

### 4.1 Training Programs tab

1. Verify dashboard top title shows active tab name.
2. Verify no duplicate internal title inside tab card.
3. Verify Add Program button appears in filter row right side.
4. Verify table scrollbar works when rows increase.
5. Create one program and verify it appears in list.

Expected:

- API calls for programs and years should succeed.
- Program should save and render without refresh issues.

### 4.2 Courses tab

1. Open Add Course form.
2. Check trainer/member dropdowns load values.
3. Create course with valid data.
4. Edit course status and verify update.
5. Confirm button is in filter row right side and table scroll works.

Expected:

- Trainer and member lists load correctly (fixed endpoint mapping).
- No repeated 500 for role-based user fetch.

### 4.3 Batch Courses tab

1. Link course to batch.
2. Filter by program/batch.
3. Verify row appears.

Expected:

- Save succeeds and list refreshes.

### 4.4 Batch Allocations tab

1. Allocate candidates to batch.
2. Filter by cycle/program/batch.
3. Verify allocated candidates are visible.

Expected:

- Allocation rows persist and reload correctly.

### 4.5 Training Scores tab

1. Add score for an allocated candidate.
2. Verify score appears with review/status.
3. Validate role-based action visibility.

Expected:

- Score save succeeds.
- Role-restricted buttons behave correctly.

### 4.6 Attendance tab

1. Mark attendance for a batch/date.
2. Verify attendance percentage displays.
3. Check table scrolling and filter behavior.

Expected:

- Attendance saves and stats refresh.

## 5. Document Collection Module Test Cases

Navigate to Document Processing dashboard.

### 5.1 Setup (Document Types)

1. Verify active tab title appears in top dashboard header.
2. Confirm Add Document Type action is in table header actions area.
3. Add a new document type.

Expected:

- New type appears in list.

### 5.2 Send Links tab

1. Select cycle (`2026 Campus Hiring` if available).
2. Verify candidate rows are visible.
3. Send document link for one candidate.
4. Use refresh button.

Expected:

- Send operation succeeds and status updates.

### 5.3 Verify Documents tab

1. Open pending submission.
2. Approve one and mark another as collected/pending.
3. Use refresh and verify counts in top-right stats.

Expected:

- Status transitions are reflected immediately.

### 5.4 Offers tab

1. Generate offer for eligible candidate.
2. Verify offer status values (ACCEPTED/PENDING) are visible.
3. Use refresh and confirm data remains consistent.

Expected:

- Offer records persist and display correctly.

## 6. UI Regression Checks (Very Important)

1. Navbar height looks compact (50px).
2. Sidebar starts exactly below navbar (no top gap).
3. No duplicate per-tab header text in Academy and Document tabs.
4. Action buttons are in filter row/right-side positions as requested.
5. Tables have working vertical scrollbars.

## 7. Quick API Failure Checklist

If you see `ERR_CONNECTION_REFUSED`:

1. Backend is not running or wrong port.
2. Confirm `http://localhost:8080` is up.
3. Restart backend and refresh frontend page.

If you see repeated 500 for user-role fetch in Courses tab:

1. Re-login once.
2. Verify token exists in browser storage.
3. Retry Add Course popup.

## 8. 10-Minute Demo Flow (Suggested)

1. Login as TRAINING_COORDINATOR.
2. Show Academy tabs in order: Programs -> Courses -> Batch Courses -> Allocations -> Scores -> Attendance.
3. Highlight dynamic header title and filter-row action buttons.
4. Login as TA_RECRUITER or TA_HEAD.
5. Show Document tabs: Setup -> Send Links -> Verify -> Offers.
6. Show mixed statuses and seeded realistic data.

## 9. Sign-off Checklist

Mark each item before demo:

- [ ] Backend running on 8080
- [ ] Frontend running and page loads
- [ ] Academy create/edit actions work
- [ ] Courses user dropdowns load
- [ ] Document send/verify/offer actions work
- [ ] No blocking console errors
- [ ] UI layout matches requested demo format
