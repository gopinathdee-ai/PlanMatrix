# CLAUDE CODE PROMPT - Floor Plan Management System (Real PDF + Bulk Operations)

**IMPORTANT**: Use this as your guide to build the Floor Plan Management System. Claude Code will help implement step-by-step.

---

## PROJECT OVERVIEW

You are building a **Real Floor Plan Cubicle Management System** for managing office cubicles using interactive PDF floor plans.

**Core Features:**
- Upload and manage PDF floor plans
- Place interactive markers (cubicles) on floor plans
- Manually assign employees to cubicles
- Bulk import users and assignments via CSV
- Track all assignment changes in audit trail
- Dashboard with occupancy statistics

**User Base:** Small team (10-50 users), IT Admin makes all changes

---

## CURRENT TECH STACK

- **Frontend:** Next.js 16.2.9, TypeScript, Tailwind CSS, Kodchasan font
- **Backend:** Next.js API Routes, NextAuth.js v4.24.14
- **Database:** SQL Server (MSSQL), Knex.js 3.2.10 for migrations & queries
- **PDF Handling:** pdfjs-dist (viewer), fabric.js (interactive markers)
- **File Uploads:** Multer for PDF/CSV uploads
- **UI:** Sonner for toast notifications, Tailwind CSS for styling

**Status:** Auth & database infrastructure complete. Need to build features.

---

## DATABASE SCHEMA

The following tables are already created via Knex migrations:

**floor_plans** - PDF floor plan metadata
- id, building, floor_number, pdf_filename, pdf_url, uploaded_at, created_by

**markers** - Cubicle locations on floor plans
- id, floor_plan_id, marker_number, pixel_x, pixel_y, pdf_page_number, created_at

**users** - Employee records
- id, email, name, department, entra_id, is_it_admin, status, created_at, updated_at

**assignments** - User-to-marker relationships
- id, user_id, marker_id, assigned_at, source (manual/bulk-csv), updated_at

**assignment_history** - Audit trail
- id, user_id, old_marker_id, new_marker_id, action (assign/reassign/remove), source, timestamp

**settings** - System configuration
- id, key, value, updated_at

**import_logs** - Track bulk operations
- id, type (users/assignments), filename, success_count, error_count, errors, timestamp

---

## PHASE 1: MVP FEATURES

### 1. DASHBOARD (Priority: SHOULD)

**Goal:** Display key occupancy metrics at a glance.

**What to show:**
- Total floor plans uploaded
- Total cubicles (marker count)
- Occupied cubicles
- Available cubicles
- Occupancy rate (%)
- Total users

**How it works:**
- Query counts from floor_plans, markers, assignments tables
- Display as cards/boxes with large numbers
- Update on page load (or auto-refresh every 30 seconds)

**Route:** `/dashboard`

---

### 2. FLOOR PLAN MANAGEMENT (Priority: MUST)

**Goal:** Upload and manage PDF floor plans.

**Features needed:**
- **Upload page** (`/floor-plans/upload`)
  - Form to select PDF file + building name + floor number
  - File validation: PDF only, max 50MB
  - Display upload progress
  - Success message with floor plan ID
  - Error messages if upload fails

- **List page** (`/floor-plans`)
  - Table/card view of all floor plans
  - Show: building, floor, upload date, marker count, edit/delete buttons
  - Delete button with confirmation
  - Click to view/edit floor plan

**Validation:**
- Building and floor number required
- PDF file required
- No duplicate building/floor combinations

**API Endpoints Needed:**
- `POST /api/floor-plans/upload` - Save PDF and metadata
- `GET /api/floor-plans` - List all floor plans
- `DELETE /api/floor-plans/[id]` - Delete floor plan (cascade to markers)

---

### 3. PDF VIEWER WITH MARKER PLACEMENT (Priority: MUST)

**Goal:** View floor plan PDF and place/manage cubicle markers interactively.

**Features needed:**
- **Viewer page** (`/floor-plans/[id]`)
  - Display PDF using pdfjs-dist
  - Show page 1 (no multi-page support yet)
  - Zoom in/out buttons (25%, 50%, 100%, 150%)
  - Pan support (drag to move around)
  - Display all existing markers on the PDF

- **Marker placement mode** (`/floor-plans/[id]/markers`)
  - Click on PDF to place marker
  - Prompt for marker name (e.g., "1509")
  - Store pixel coordinates (x, y) where clicked
  - Show marker on PDF with label
  - List all markers below PDF (table)
  - Edit marker name
  - Delete marker with confirmation
  - Show which user is assigned (if any)

**Marker appearance:**
- Circle with border and label
- Color: green if empty, red if occupied
- Hover shows full details
- fabric.js handles interactive placement

**API Endpoints Needed:**
- `POST /api/floor-plans/[id]/markers` - Create marker
- `PUT /api/floor-plans/[id]/markers/[markerId]` - Update marker
- `DELETE /api/floor-plans/[id]/markers/[markerId]` - Delete marker

---

### 4. USER MANAGEMENT (Priority: MUST)

**Goal:** Add users manually and via bulk CSV import.

**Manual add** (`/users/add`):
- Form with: email, name, department
- Email validation + duplicate check
- Submit creates user in database
- Success toast notification
- List updated immediately

**Bulk import** (`/users/import`):
- Download CSV template
- User uploads filled CSV
- Columns: email, name, department
- Validation:
  - Email format check
  - Duplicate email detection
  - Name required
- Display results: X users created, Y errors
- Error details per row (show in modal or table)
- Log import to import_logs table

**List users** (`/users`):
- Table showing: email, name, department, status, assigned cubicle, actions
- Edit button (update name/department)
- Deactivate button (soft delete)
- Delete button

**API Endpoints Needed:**
- `POST /api/users` - Create single user
- `POST /api/users/bulk-import` - CSV bulk import
- `GET /api/users` - List all users
- `PUT /api/users/[id]` - Update user
- `DELETE /api/users/[id]` - Delete user

---

### 5. CUBICLE ASSIGNMENTS (Priority: MUST)

**Goal:** Assign users to cubicles (manually and via bulk).

**Manual assign** (`/floor-plans/[id]/assign`):
- Show floor plan with all markers
- Click marker → modal opens
- If empty: dropdown to select unassigned user + assign button
- If occupied: show current user + reassign/remove buttons
- Reassign: remove old assignment, create new
- Remove: unassign user, marker becomes empty
- Log all changes to assignment_history
- Toast notifications on success/error

**Bulk assign** (`/assignments/bulk-import`):
- Download assignment template (pre-filled with all markers)
- CSV columns: building, floor, marker_number, user_email
- User fills in emails
- Upload and validate:
  - Marker exists (by number + building/floor)
  - User exists (by email)
  - User not already assigned
  - Marker not already occupied
- Show results: X assigned, Y errors
- Error details per row
- Log import to import_logs table
- All changes logged to assignment_history with source="bulk-csv"

**List assignments** (`/assignments`):
- Table: user email, cubicle location (building/floor/marker), assigned date, source
- Edit button (reassign)
- Remove button (unassign)

**API Endpoints Needed:**
- `POST /api/assignments` - Create assignment
- `PUT /api/assignments/[id]` - Reassign user
- `DELETE /api/assignments/[id]` - Remove assignment
- `POST /api/assignments/bulk-import` - CSV bulk import
- `GET /api/assignments` - List all assignments

---

### 6. AUDIT TRAIL (Priority: MUST)

**Goal:** Track all assignment changes for compliance.

**History page** (`/history`):
- Table showing all assignment changes
- Columns: timestamp, user email, action (assign/reassign/remove), old cubicle, new cubicle, source (manual/bulk-csv)
- Sort by timestamp DESC (most recent first)
- Pagination (top 100 per page)
- Filter by user email (optional for Phase 1)
- Export to CSV button (Phase 2)

**What gets logged:**
- Every assignment creation (action="assign")
- Every reassignment (action="reassign", log old & new marker)
- Every removal (action="remove", log old marker)
- Source: "manual" or "bulk-csv"
- Timestamp: auto-generated

**API Endpoints Needed:**
- `GET /api/history` - Fetch assignment history with pagination

---

### 7. ERROR HANDLING & VALIDATION

**For all forms:**
- Email format validation
- Required field checks
- Duplicate detection
- File type validation (PDF only)
- File size limit (50MB)

**For all uploads:**
- Show row-by-row errors
- Continue processing even if some rows fail
- Display summary: X succeeded, Y failed
- List failed rows with reason

**For all API calls:**
- Return 401 if not authenticated
- Return 400 for validation errors
- Return 404 if resource not found
- Return 500 with error message if server error
- Never expose internal errors to frontend

**Toast notifications:**
- Success toast on completed actions
- Error toast with clear message on failures
- Info toast for important updates

---

### 8. NAVIGATION & PAGES

Required pages:
- `/` → Redirect to `/login`
- `/login` → Login (already done)
- `/dashboard` → Overview stats (TODO)
- `/floor-plans` → List all floor plans (TODO)
- `/floor-plans/upload` → Upload new PDF (TODO)
- `/floor-plans/[id]` → View floor plan PDF (TODO)
- `/floor-plans/[id]/markers` → Manage markers on plan (TODO)
- `/floor-plans/[id]/assign` → Assign users to markers (TODO)
- `/users` → Manage users (TODO)
- `/assignments` → List assignments (TODO)
- `/history` → View audit trail (TODO)
- `/admin/settings` → Admin settings (Phase 2)

All pages need:
- Navbar with logout button
- Breadcrumb or title
- Back button where appropriate

---

## IMPLEMENTATION ORDER

**Recommended build sequence:**

1. **Dashboard** (metrics queries)
2. **Floor Plans** (upload, list, delete)
3. **PDF Viewer** (display + zoom/pan)
4. **Marker Placement** (click to add, edit, delete)
5. **User Management** (manual add, list, edit)
6. **User Bulk Import** (CSV template, upload, validate)
7. **Manual Assignment** (click marker, select user, assign)
8. **Bulk Assignment** (CSV template with markers, upload, validate)
9. **Audit Trail** (history view, pagination)
10. **Polish & Testing** (error messages, edge cases, UI refinement)

---

## KEY REQUIREMENTS

**Security:**
- All routes require authentication
- Check session before returning data
- No credentials in logs or error messages

**Performance:**
- Paginate large lists (100 items per page)
- Index queries on frequently searched columns (email, status, timestamp)
- No N+1 queries (use eager loading for relationships)

**UX:**
- Loading spinners on async operations
- Disabled buttons while loading
- Clear error messages (not generic "Error occurred")
- Success confirmations
- Undo/warning for destructive actions

**Data Integrity:**
- Email uniqueness in users table
- No duplicate marker numbers per floor plan
- One user = one cubicle (via unique constraint)
- One marker = one user (via unique constraint)
- Cascading deletes (delete floor plan → delete markers → delete assignments)

---

## TESTING CHECKLIST

Before marking feature complete:

**Happy path:**
- Can upload valid PDF
- Can place multiple markers on PDF
- Can add user and see in list
- Can assign user to marker
- Can reassign user to different marker
- Can remove assignment
- Can bulk import users from CSV
- Can bulk import assignments from CSV
- Can view history of all changes
- Can delete floor plan (markers and assignments cascade)

**Error cases:**
- Upload non-PDF file → Error message
- Upload oversized file → Error message
- Add user with invalid email → Error message
- Add duplicate email → Error message
- Assign non-existent user → Error message
- Assign to non-existent marker → Error message
- Assign to occupied marker → Error message
- Bulk import with errors → Show detailed errors per row

**UI/UX:**
- All buttons have hover effects
- Forms show validation errors inline
- Toast notifications appear and auto-dismiss
- Loading states visible during async operations
- Mobile responsive (test on phone/tablet)
- Navbar works on all pages

---

## NOTES FOR CLAUDE

- Use Knex for all database queries (already configured)
- Use NextAuth session for authentication (already set up)
- Use Sonner for toast notifications
- Use fabric.js for PDF marker placement (draggable, clickable)
- Use Tailwind CSS for all styling (consistent with existing UI)
- Keep API routes simple and focused
- Validate at API boundary, not just frontend
- Log all errors to console for debugging
- Test each feature before moving to next

---

## SUCCESS CRITERIA

MVP is complete when:
- Can upload floor plan PDF
- Can place markers interactively on PDF
- Can add users (manual + bulk CSV)
- Can assign users to markers (manual + bulk CSV)
- Can view and manage assignments
- All changes logged to audit trail
- No critical bugs
- Responsive on desktop & mobile

---

**Ready to build!** Start with the Dashboard, then work through the implementation order above.
