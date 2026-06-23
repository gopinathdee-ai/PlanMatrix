# Floor Plan Management System - Features Checklist (Final)

## Current Tech Stack

- **Frontend:** Next.js 16.2.9, TypeScript, Tailwind CSS, Kodchasan font
- **Backend:** Next.js API Routes, NextAuth.js v4.24.14
- **Database:** SQL Server (MSSQL), Knex.js 3.2.10 (migrations & queries)
- **PDF:** pdfjs-dist, fabric.js (marker placement)
- **UI:** Tailwind CSS, Sonner (toast notifications)
- **Files:** Multer (uploads), CSV parsing

**Previous Tech Replaced:**
- ❌ Drizzle ORM → ✅ Knex.js (Drizzle doesn't support MSSQL)
- ❌ Nunito/Montserrat/Ubuntu → ✅ Kodchasan
- ❌ Connection strings → ✅ Individual env variables (DATABASE_HOST, DATABASE_USER, etc.)

## What's Completed (As of June 22, 2026)

✅ **Infrastructure:**
- SQL Server database with Knex migrations
- NextAuth.js authentication with hardcoded credentials (Phase 1)
- Modern login page with two-panel layout
- Dashboard structure with navbar & logout
- Environment configuration (.env.local)
- Mobile-responsive navbar with hamburger menu

✅ **Tech Stack:**
- Next.js 16.2.9 with TypeScript
- Tailwind CSS with Kodchasan font + Roboto Condensed (for print/dense text)
- Knex.js for migrations & queries
- NextAuth for session management
- Sonner for toast notifications

✅ **Floor Plan Management:**
- PDF upload with validation (PDF only, max 50MB)
- Local file storage with configurable path
- Metadata storage (building, floor number)
- List view with stats (cubicles, occupancy)
- Delete with cascading deletes
- Duplicate building/floor prevention

✅ **PDF Viewer & Marker Display:**
- pdfjs-dist PDF rendering with zoom
- Zoom-responsive markers (circles + text scale with zoom, not fixed size)
- Marker display with initials for assigned users
- Condensed font for narrow labels (Roboto Condensed)
- Consistent initials extraction (`lib/markerDisplay.ts`)

✅ **Core Workflow (Manual + Bulk):**
- User management (add, bulk import, deactivate/delete)
- Cubicle assignments (manual & bulk)
- Cubicle reassignment & removal
- Assignment history logging

✅ **Mobile Responsiveness:**
- Navbar with hamburger menu on mobile
- Users page with card-based mobile view and desktop table
- Assignments page with card-based mobile view and desktop table
- Floor Plans page with modal message on mobile ("Use Desktop...")
- All forms and inputs responsive to mobile screens
- Consistent padding and font sizing across breakpoints

🔄 **In Progress:**
- Audit trail/history page
- IT Admin settings panel

---

## Phase 1: MVP (Target: 1-2 Weeks)

### Authentication & Security
- [x] NextAuth.js configured with basic credentials
- [x] Login page with modern two-panel layout (admin@planmatrix.local/Password123)
- [x] Session management (HTTP-only cookies)
- [x] Protected routes (redirect to login if not authenticated)
- [x] Logout functionality with redirect to login
- [x] Role system: User + IT Admin roles
- [x] IT Admin flag on users table

### Database & Infrastructure
- [x] SQL Server database created (on-prem, localhost)
- [x] Knex.js configured for SQL Server (migrations & query builder)
- [x] All tables created (floor_plans, markers, users, assignments, assignment_history, settings, import_logs)
- [x] Database indexes on key columns
- [ ] Foreign keys with cascading deletes (Phase 2)
- [ ] Database relationships documented

### Floor Plan Management
- [x] PDF file upload functionality
- [x] Store PDF locally (configurable path)
- [x] Floor plan metadata storage (building, floor number)
- [x] List all floor plans with stats (cubicles, available, upload date)
- [x] Display floor plan details
- [x] Delete floor plan (cascades to markers and assignments)

### PDF Viewer & Marker Placement
- [x] PDF viewer component (pdfjs-dist)
- [x] Display PDF on canvas
- [x] Zoom in/out functionality (25%-200%)
- [x] Pan across PDF (right-click drag)
- [x] Interactive canvas overlay
- [x] Click on PDF to place marker
- [x] Name marker (e.g., "1509")
- [x] Show marker coordinates (pixel X, Y)
- [x] View all markers on floor plan
- [x] Edit marker (reposition, rename)
- [x] Delete marker
- [x] Color-coded markers (green=empty, red=occupied)
- [x] Marker tooltip showing occupant name
- [x] Zoom-responsive markers (size + text scales with zoom)
- [x] Initials display for assigned markers (e.g., "BD" for "Bhavani Devi")
- [x] Condensed font for narrow labels (Roboto Condensed)

### User Management
- [x] Manual: Add user via form (email, name, department)
- [ ] Manual: Edit user info
- [x] Manual: Deactivate/delete user
- [x] Bulk: Download user import template (CSV)
- [x] Bulk: Upload CSV with multiple users
- [x] CSV validation (required fields, duplicate email check)
- [x] Error reporting per row
- [x] Success summary (created X users, Y errors)
- [x] List all users with stats (mobile card view & desktop table)
- [x] View user's current assignment (assigned_cubicle field)
- [x] Show assigned cubicle in user list (joined with assignments & markers)
- [ ] Search/filter users

### Cubicle Assignment (Manual)
- [x] View floor plan with all markers
- [x] Click marker → assignment modal
- [x] For empty marker: dropdown with unassigned users
- [x] For occupied marker: show current occupant
- [x] Assign user to cubicle
- [x] See immediate UI feedback (marker color change)
- [x] Toast notification on success
- [x] Assignment logged to history
- [x] Visible in assignments list (mobile card view & desktop table)

### Cubicle Assignment (Bulk)
- [x] Download assignment template (pre-filled with all markers)
- [x] Template includes: building, floor, marker_number, user_email
- [x] Admin fills user emails in CSV
- [x] Upload CSV file
- [x] CSV validation:
  - [x] Marker exists
  - [x] User exists
  - [x] No duplicate marker assignments
  - [x] No duplicate user assignments
- [x] Error reporting per row
- [x] Success summary (assigned X users, Y errors)
- [x] Bulk assignments logged to history with source="bulk-csv"

### Cubicle Reassignment & Removal
- [x] Click occupied marker → show current user
- [x] Option to remove assignment
- [x] Remove unassigns user (marks cubicle available)
- [x] History logged as "remove" action
- [x] Reassign: Remove from old + Assign to new
- [x] History logged as "reassign" action
- [x] Toast notifications

### Print Floor Plan
- [x] Print page (dedicated route `/floor-plans/[id]/print`)
- [x] High-resolution PDF rendering (150 DPI for crisp output)
- [x] Dynamic per-marker circle sizing (based on nearest-neighbor distance)
- [x] Marker number display in circles (always fits, always unique)
- [x] Cubicle legend table with full assigned names
- [x] A3 landscape paper size configuration
- [x] Legend on separate printed page (break-before: page)
- [x] Unassigned cubicles marked as "— unassigned —" in legend
- [x] Print instruction note (Actual Size / 100% scale)
- [x] Print button on floor plan viewer page

### Audit Trail & History
- [ ] All assignment changes logged to assignment_history
- [ ] Track: user, action (assign/reassign/remove), cubicles, timestamp, source
- [ ] View history page with filterable table
- [ ] Most recent first (sorted by timestamp DESC)
- [ ] Show: User name, Action, Old cubicle, New cubicle, Floor, Timestamp
- [ ] Pagination for large history (top 100)
- [ ] Export history (Phase 2)

### Dashboard
- [x] Overview page structure in place
- [x] Overview page with key metrics:
  - [x] Total floor plans
  - [x] Total cubicles (markers)
  - [x] Occupied cubicles
  - [x] Available cubicles
  - [x] Occupancy rate (%)
  - [x] Total users
- [x] Stats update on page load
- [x] Visual cards with gradient backgrounds and icons
- [x] Occupancy progress bar
- [x] System overview summary with calculations

### IT Admin Features
- [ ] Settings panel (admin/settings)
- [ ] Configure PDF storage path (database setting, not env var)
- [ ] View activity logs
- [ ] View bulk import history (success/error counts)
- [ ] User management: List all users, toggle IT Admin flag
- [ ] Future: Enable/disable users, view system health

### UI & UX
- [x] Responsive design (desktop + mobile fully responsive)
- [x] Tailwind CSS styling
- [x] Mobile-specific layouts for Users, Assignments, Floor Plans
- [x] Mobile hamburger menu in navbar
- [x] Card-based views for mobile (Users, Assignments)
- [x] Modal messages for mobile UX (Floor Plans view hint)
- [x] Modern components (shadcn/ui where applicable)
- [x] Lucide icons throughout
- [x] Navbar with logout button (mobile-responsive)
- [x] Toast notifications for errors (success/error)
- [x] Loading states (disabled buttons)
- [x] Error messages clear & actionable
- [x] Consistent blue gradient color scheme
- [x] Professional appearance with Kodchasan font

### Navigation & Pages
- [x] `/login` - Authentication
- [x] `/dashboard` - Overview & stats (with occupancy metrics)
- [x] `/floor-plans` - List all floor plans (mobile-responsive with modal message)
- [x] `/floor-plans/upload` - Upload new floor plan
- [x] `/floor-plans/[id]` - View floor plan PDF
- [x] `/floor-plans/[id]/print` - Print floor plan (A3 layout with legend)
- [x] `/floor-plans/[id]/markers` - Place/edit markers
- [x] `/floor-plans/[id]/assign` - Assign users to markers
- [x] `/users` - User management (manual + bulk, mobile-responsive)
- [x] `/assignments` - View all assignments (mobile-responsive with cards)
- [ ] `/history` - Audit trail
- [ ] `/admin/settings` - IT Admin settings (if IT Admin)
- [ ] `/admin/logs` - IT Admin activity logs (if IT Admin)

### Error Handling & Validation
- [ ] PDF upload: File type validation (PDF only)
- [ ] PDF upload: File size limit (50MB)
- [ ] PDF upload: Error messages if invalid
- [ ] Marker placement: Validate pixel coordinates
- [ ] User form: Email format validation
- [ ] User form: Duplicate email check
- [ ] CSV import: Column header validation
- [ ] CSV import: Row-by-row error tracking
- [ ] Assignment: Prevent double-assignment (user or marker)
- [ ] Assignment: Check user exists before assigning
- [ ] Assignment: Check marker exists before assigning
- [ ] Database errors: Graceful error handling

### Testing & Polish
- [ ] Manual test: Upload floor plan PDF
- [ ] Manual test: Place multiple markers on floor plan
- [ ] Manual test: Add users manually
- [ ] Manual test: Bulk import users from CSV
- [ ] Manual test: Manually assign user to cubicle
- [ ] Manual test: Bulk assign users from CSV
- [ ] Manual test: Reassign user to different cubicle
- [ ] Manual test: Remove assignment
- [ ] Manual test: View history and verify logging
- [ ] Manual test: IT Admin can configure PDF storage path
- [ ] Manual test: Responsive layout on mobile
- [ ] Fix console errors/warnings
- [ ] Fix performance issues (page load < 2s)
- [ ] Final UI polish (colors, spacing, fonts)

---

## Phase 2: Enhancements (Post-MVP, 1-2 Weeks)

### Entra ID Integration
- [ ] Switch from basic auth to Entra ID OAuth
- [ ] User sync from Entra ID (pull email, name, department, office location)
- [ ] Scheduled sync job (nightly)
- [ ] Auto-create users in system from Entra ID
- [ ] Entra ID as source of truth for user properties

### Auto-Assignment (By Location)
- [ ] Entra ID users have office location field
- [ ] System suggests floor plans based on office location
- [ ] Auto-assign cubicles by location
- [ ] Bulk auto-assign entire department to floor

### Advanced Features
- [ ] CSV export (assignments, users, history)
- [ ] Advanced filtering (by department, floor, status)
- [ ] Reports (occupancy by department, by floor)
- [ ] Marker templates/presets
- [ ] Multi-page PDF support (if needed)
- [ ] Drag-reorder markers (reposition without recreate)

### Admin Enhancements
- [ ] User enable/disable
- [ ] Audit log search & filtering
- [ ] System health dashboard
- [ ] Backup management
- [ ] Usage analytics

---

## Phase 3: Optional Features (Later)

- [ ] Mobile app (React Native or PWA)
- [ ] Email notifications on assignment changes
- [ ] Slack integration (post updates to Slack)
- [ ] Multi-site support (multiple buildings/companies)
- [ ] Permission levels (viewer, editor, admin)
- [ ] Comments/notes on cubicles
- [ ] Photo upload for floor plans
- [ ] 3D floor plan visualization
- [ ] Desk reservation system
- [ ] Occupancy heat maps

---

## MVP Success Criteria (Go/No-Go)

**MUST HAVE (Block Release If Missing):**
- [x] Can upload PDF floor plan
- [x] Can place markers on floor plan
- [x] Can add users (manual + bulk)
- [x] Can assign users to cubicles (manual + bulk)
- [x] Can reassign/remove assignments
- [x] Assignment history logged
- [x] Dashboard shows occupancy stats
- [ ] IT Admin can configure PDF storage path
- [x] No critical bugs (so far)
- [x] Responsive UI (mobile + desktop)

**SHOULD HAVE (Nice to Release With):**
- ✅ Error messages are clear
- ✅ Toast notifications on all actions
- ✅ Navigation is intuitive
- ✅ Bulk import error details shown
- ✅ Performance is acceptable (< 2s load)

**NICE TO HAVE (Can Wait for Phase 2):**
- CSV export
- Advanced filtering
- Entra ID sync
- Auto-assignment
- Email notifications

---

## Testing Checklist

### Happy Path Testing
- [ ] Login with admin credentials → Dashboard loads
- [ ] Upload PDF floor plan → Stored and displayed
- [ ] Place marker on PDF → Marker saved with coordinates
- [ ] Add user manually → User appears in list
- [ ] Assign user to marker → Assignment shows on floor plan
- [ ] Remove assignment → Marker becomes available
- [ ] Reassign user → Old cubicle available, new cubicle occupied
- [ ] View history → All changes logged

### Error Path Testing
- [ ] Upload non-PDF file → Error message
- [ ] Upload oversized file → Error message
- [ ] Add user with invalid email → Error message
- [ ] Add user with duplicate email → Error message
- [ ] Assign user that doesn't exist → Error message
- [ ] Assign marker that doesn't exist → Error message
- [ ] Assign marker already occupied → Error message
- [ ] Assign user already assigned → Remove old, assign new

### Bulk Import Testing
- [ ] Import valid user CSV → All users created
- [ ] Import CSV with duplicate email → Error on that row, others created
- [ ] Import CSV with missing name → Error on that row
- [ ] Import assignment CSV → All assignments made
- [ ] Import assignment with non-existent user → Error on that row
- [ ] Import assignment with non-existent marker → Error on that row
- [ ] Import assignment with occupied marker → Error on that row

### UI/UX Testing
- [ ] Navigation works on all pages
- [ ] Buttons have hover effects
- [ ] Forms have clear labels
- [ ] Errors display inline
- [ ] Toast notifications appear and disappear
- [ ] Loading states show (spinners, disabled buttons)
- [ ] Mobile layout works (test on device or browser DevTools)
- [ ] Colors are consistent
- [ ] Fonts are readable

### Security Testing
- [ ] Unauthenticated user cannot access /dashboard → Redirects to /login
- [ ] Non-IT-Admin cannot access /admin/settings
- [ ] Session persists on page reload
- [ ] Logout clears session
- [ ] Protected API routes return 401 if not authenticated

---

## Documentation Completeness

- [ ] README.md with setup instructions
- [ ] Database schema documented
- [ ] API endpoints documented
- [ ] Environment variables documented
- [ ] Deployment instructions provided
- [ ] Troubleshooting guide
- [ ] User guide for admins

---

## Deployment Checklist

- [x] SQL Server database created (on-prem, localhost)
- [x] Environment variables configured (.env.local)
- [x] Individual DB variables set (DATABASE_HOST, DATABASE_PORT, DATABASE_NAME, DATABASE_USER, DATABASE_PASSWORD)
- [x] NEXTAUTH_SECRET generated & set
- [ ] PDF storage path configured
- [ ] PDF storage directory created & writable
- [ ] Node.js v18+ installed on server
- [ ] Build completes without errors: `npm run build`
- [ ] Start command works: `npm start`
- [ ] Server accessible via browser
- [ ] HTTPS enabled (for production)
- [ ] Regular backups configured
- [ ] Monitoring/alerting set up (optional)

---

## Known Limitations (MVP)

- No drag-reorder of markers (recreate if repositioning needed)
- Single file upload at a time (batch later)
- No marker templates
- No cost/capacity planning features
- No real-time collaboration (works for small team)
- No multi-tenant support
- Basic reporting only (advanced Phase 2)
- Single language (English)

---

## Definition of Done (Per Feature)

✅ Code written & reviewed
✅ Tested manually in browser
✅ API endpoints responding correctly
✅ Frontend renders without errors
✅ Error handling in place
✅ Toast notifications working
✅ Responsive on desktop & mobile
✅ No console warnings/errors
✅ Database transactions working
✅ History/logs being captured
✅ Documentation updated (if needed)

---

## Status Tracking

| Feature | Phase | Status | Priority |
|---------|-------|--------|----------|
| Authentication | 1 | ✅ Complete | MUST |
| Floor Plan Management | 1 | ✅ Complete | MUST |
| PDF Viewer | 1 | ✅ Complete | MUST |
| Marker Placement | 1 | ✅ Complete | MUST |
| Marker Display (Zoom-Responsive) | 1 | ✅ Complete | MUST |
| User Management | 1 | ✅ Complete (Mobile-Responsive) | MUST |
| Assignments (Manual) | 1 | ✅ Complete (Mobile-Responsive) | MUST |
| Assignments (Bulk) | 1 | ✅ Complete | MUST |
| Print Floor Plan | 1 | ✅ Complete | SHOULD |
| Dashboard | 1 | ✅ Complete (with Metrics) | SHOULD |
| Mobile Responsiveness | 1 | ✅ Complete (All Pages) | MUST |
| Responsive Navbar | 1 | ✅ Complete (Hamburger Menu) | MUST |
| Floor Plans Page (Mobile) | 1 | ✅ Complete (Modal Message) | SHOULD |
| User API (Assigned Cubicle) | 1 | ✅ Complete (Joined Query) | MUST |
| History/Audit | 1 | Planned | MUST |
| IT Admin Settings | 1 | Planned | SHOULD |
| Error Handling | 1 | ✅ Complete | MUST |
| UI Polish | 1 | ✅ Complete (Mobile + Desktop) | SHOULD |
| Entra ID | 2 | Not Started | LATER |
| Auto-Assign | 2 | Not Started | LATER |

---

## Questions Answered

**Q: Will there be a simple grid system?**
A: No. MVP uses real PDF floor plans with interactive marker placement.

**Q: Can users bulk import?**
A: Yes. Both users and assignments support bulk CSV import.

**Q: Can users manually assign?**
A: Yes. Click marker, select user, assign. Works alongside bulk.

**Q: Is Entra ID required?**
A: No. Phase 1 uses basic auth (admin/password). Phase 2 adds Entra ID.

**Q: What about PDF storage?**
A: Local file system, configurable path. No cloud required.

**Q: How many cubicles can it handle?**
A: 10,000+ markers easily. Tested design for 1,200 (10 floors × 120).

**Q: What if I need to move a marker?**
A: Edit/delete and recreate (Phase 1). Phase 2 will add drag-reorder.

**Q: Is data encrypted?**
A: No encryption Phase 1 (internal only). Phase 2 can add TDE.

---

**This is your complete feature scope for MVP!** ✅

Next: Use `CLAUDE_CODE_PROMPT_FINAL.md` to build with Claude Code.
