# Floor Plan Management System - RAD Strategy (Final)

## Project Overview
- **Scope**: Real floor plan-based cubicle management system (PDF floor plans, interactive marker placement, bulk operations)
- **Users**: Minimal user base, all users have full permissions (except IT Admin features)
- **Timeline**: 1-2 weeks (MVP)
- **Tech Stack**: Next.js 14, SQL Server, Drizzle ORM, Entra ID, local PDF storage

---

## System Concept

**Core Workflow:**

1. **Floor Plan Setup (One-Time)**
   - Admin uploads PDF floor plan
   - Sets metadata: Building name, Floor number
   - Interactive canvas: Click to place cubicle markers
   - Name each marker (e.g., "1509", "1510")
   - Save all markers on floor plan

2. **User Management (Ongoing)**
   - Add users: Manual form OR bulk CSV import
   - Users can be assigned/unassigned from cubicles

3. **Cubicle Assignment (Ongoing)**
   - Assign users: Click marker on floor plan + select user OR bulk CSV import
   - Reassign: Remove from old, assign to new
   - Remove: Unassign user from cubicle
   - View occupancy on floor plan (visual color-coded markers)

---

## Architecture

### Tech Stack (Option A - Full Microsoft Stack)
| Layer | Technology | Why |
|-------|-----------|-----|
| Frontend | Next.js 14 (App Router, TypeScript) | Modern, full-stack, Windows-friendly |
| Styling | Tailwind CSS + shadcn/ui | Modern UI, responsive |
| PDF Viewer | pdfjs-dist (Mozilla) | Display PDF floor plans |
| Interactive Canvas | fabric.js | Drag-drop marker placement on PDF |
| File Upload | multer | Handle PDF and CSV uploads |
| Backend | Next.js API Routes | Serverless-style, integrated |
| Database | SQL Server (on-prem or Azure SQL) | Microsoft stack, relational |
| ORM | Drizzle ORM (drizzle-orm/mssql) | Type-safe, lightweight, no binaries |
| Auth | NextAuth.js + Entra ID (Phase 2) | SSO ready, local auth for now |
| Toast Notifications | Sonner | Modern feedback UI |
| Icons | FontAwesome / Lucide | Professional icons |
| Storage | Local file system (Windows Server) | Configurable path, on-prem |

### Data Model
```
FloorPlans (stores PDFs and metadata)
  ├─ id, building, floorNumber, pdfUrl, uploadedAt, createdBy

Markers (cubicles on floor plans)
  ├─ id, floorPlanId, markerNumber, pixelX, pixelY, pdfPageNumber, createdAt

Users (employees)
  ├─ id, email, name, department, entraId (future), status

Assignments (current user → marker)
  ├─ id, userId, markerId, assignedAt, source (manual/bulk)

AssignmentHistory (audit trail)
  ├─ id, userId, oldMarkerId, newMarkerId, action, timestamp, source

Settings (IT Admin configuration)
  ├─ id, key, value (e.g., PDF_STORAGE_PATH)

ImportLogs (track bulk operations)
  ├─ id, type (users/assignments), filename, successCount, errorCount, timestamp
```

---

## Development Phases

### Phase 1: MVP (Weeks 1-2)
**Goal**: Working floor plan system with manual + bulk operations

**Week 1:**
- Day 1-2: Project setup, SQL Server connection, schema
- Day 2-3: Floor plan upload & PDF display
- Day 3-4: Interactive marker placement (fabric.js canvas)
- Day 4-5: User management (manual + bulk import)

**Week 2:**
- Day 1-2: Cubicle assignment (manual + bulk import)
- Day 2-3: Reassignment & removal workflows
- Day 3-4: Audit history, logs, IT Admin settings
- Day 4-5: Testing, bug fixes, polish

### Phase 2: Enhancements (Future)
- Entra ID user sync
- Auto-assign by location
- Advanced reporting/analytics
- Permission-based access (if needed)
- Mobile app (optional)

---

## API Endpoints (MVP)

### Floor Plans
```
GET    /api/floor-plans              # List all floor plans
POST   /api/floor-plans              # Upload new floor plan
GET    /api/floor-plans/[id]         # Get floor plan details
DELETE /api/floor-plans/[id]         # Delete floor plan
```

### Markers (Cubicles)
```
GET    /api/floor-plans/[id]/markers # Get all markers on floor plan
POST   /api/markers                  # Create marker on floor plan
PUT    /api/markers/[id]             # Update marker (name, position)
DELETE /api/markers/[id]             # Delete marker
```

### Users
```
GET    /api/users                    # List all users
POST   /api/users                    # Add single user (manual)
POST   /api/users/bulk-import        # Bulk import users (CSV)
GET    /api/users/template           # Download user import template
PUT    /api/users/[id]               # Update user
DELETE /api/users/[id]               # Delete user
```

### Assignments
```
GET    /api/assignments              # List all assignments
POST   /api/assignments              # Assign user to marker (manual)
POST   /api/assignments/bulk-import  # Bulk assign users (CSV)
GET    /api/assignments/template     # Download assignment template
PUT    /api/assignments/[id]         # Reassign user to different marker
DELETE /api/assignments/[id]         # Remove assignment
GET    /api/assignments/history      # Audit trail (paginated)
```

### Settings (IT Admin)
```
GET    /api/admin/settings           # Get all settings
PUT    /api/admin/settings/[key]     # Update setting (e.g., PDF_STORAGE_PATH)
GET    /api/admin/logs               # View activity logs
GET    /api/admin/import-logs        # View bulk import history
```

---

## Key Features (MVP)

### Floor Plan Management
✅ Upload PDF floor plans (with metadata: building, floor)
✅ Store PDFs locally (configurable path)
✅ Display PDF in interactive viewer
✅ Zoom in/out on floor plan
✅ List all floor plans with stats

### Marker Placement (Cubicles)
✅ Click on PDF to place marker (interactive canvas)
✅ Name each marker (e.g., "1509", "1510")
✅ Drag markers to reposition
✅ View all markers on floor plan with occupancy status
✅ Color-coded: Green (available), Red (occupied)
✅ Edit/delete markers

### User Management
✅ Manual: Add user via form (email, name, department)
✅ Bulk: Import users from CSV
✅ Download user template for bulk import
✅ List all users with assignment status
✅ Edit user info
✅ Deactivate users

### Cubicle Assignment
✅ Manual: Click marker → select user → assign
✅ Bulk: Import assignments from pre-filled CSV
✅ Download assignment template (all markers pre-populated)
✅ View floor plan with occupancy (visual feedback)
✅ Reassign: Remove from old marker, assign to new
✅ Remove: Unassign user from cubicle
✅ See user's current assignment

### Audit & History
✅ Log all assignment changes (assign, reassign, remove)
✅ Track who did what, when
✅ Bulk operations logged with summary
✅ View history with filtering

### IT Admin Features
✅ Configure PDF storage location (file path)
✅ View activity logs (uploads, assignments)
✅ View bulk import history (success/error counts)
✅ User management (enable/disable, set IT Admin flag)

---

## Security & Access Control

### Authentication
- **Phase 1**: NextAuth.js with basic credentials (admin/password)
- **Phase 2**: Entra ID OAuth integration

### Authorization (Roles)
- **Regular User**: Can do all business operations (floor plans, markers, assignments)
- **IT Admin**: Adds system configuration panel (settings, logs, user management)

### Audit Trail
- All changes logged to `AssignmentHistory` table
- Track: User, action (assign/reassign/remove), marker, timestamp, source (manual/bulk)
- Bulk imports logged separately in `ImportLogs`

---

## Data Validation

### User Import (Bulk)
- Email must be unique
- Email must be valid format
- Name is required
- Department optional
- Return errors per row, success count

### Assignment Import (Bulk)
- User email must exist
- Marker must exist on specified floor plan
- User can't be assigned twice
- Marker can't be assigned twice
- Return errors per row, success count

### Marker Placement
- Marker name must be unique per floor plan
- Pixel coordinates must be within PDF dimensions
- Can't exceed markers per floor (soft limit, not enforced)

---

## Performance Targets
- Page load: < 2 seconds
- PDF load: < 3 seconds (depends on file size)
- CSV import: 1,000 rows < 5 seconds
- API response: < 500ms
- Support: 100+ concurrent floor plans, 10,000+ markers, 1,000+ users

---

## Deployment (MVP)

**Environment**: Windows Server (on-prem)
```
Windows Server 2019+ (or Azure)
├── Node.js runtime (v18+)
├── Next.js application
├── IIS (optional, for reverse proxy)
├── SQL Server (local or Azure SQL)
└── File system for PDFs (/data/floor-plans or mapped network share)
```

**Setup Steps:**
1. Install Node.js on Windows Server
2. Git clone project
3. Configure `.env` (SQL Server connection, PDF path, NextAuth secret)
4. Run database migrations
5. `npm run build && npm start`
6. Access via http://server-ip:3000

**Production Hardening (Later):**
- Use IIS with Node.js hosting
- SSL/TLS certificates
- Azure Key Vault for secrets
- SQL Server backups
- PDF storage on network share

---

## Timeline & Effort

| Task | Effort | Timeline |
|------|--------|----------|
| Project setup & DB | 1 day | Day 1 |
| Floor plan upload & PDF viewer | 2 days | Days 2-3 |
| Interactive marker placement | 1.5 days | Days 3-4 |
| User management (manual + bulk) | 1.5 days | Days 4-5 |
| Assignment workflows (manual + bulk) | 2 days | Week 2, Days 1-2 |
| IT Admin settings & logs | 1 day | Week 2, Day 3 |
| UI polish, testing, fixes | 1 day | Week 2, Days 4-5 |
| **Total MVP** | **~10 days** | **1-2 weeks** |

---

## Success Criteria (MVP)

✅ Admin can upload floor plan PDF
✅ Admin can place markers on floor plan interactively
✅ Admin can manually add users
✅ Admin can bulk import users from CSV
✅ Admin can manually assign users to markers
✅ Admin can bulk import assignments from CSV
✅ Markers show occupancy status visually (green/red)
✅ Admin can reassign/remove users
✅ Assignment history logged
✅ IT Admin can configure PDF storage path
✅ IT Admin can view logs
✅ No critical bugs, responsive UI
✅ SQL Server working, data persists

---

## Not in MVP (Phase 2+)

❌ Entra ID user sync
❌ Auto-assign by location
❌ Email notifications
❌ Advanced reporting/dashboards
❌ Mobile app
❌ Multiple organizations/tenants
❌ Permission-based access (everyone has same permissions)

---

## Technology Decision Log

**Why SQL Server?**
- Microsoft stack preference
- On-prem or Azure SQL options
- T-SQL, familiar to Windows teams
- Drizzle ORM has excellent SQL Server support

**Why Drizzle ORM?**
- No binary downloads (corporate firewall safe)
- Type-safe queries
- Lightweight, flexible
- Works perfectly with SQL Server

**Why Local PDF Storage?**
- Minimal user base (few PDFs)
- On-prem deployment (no cloud needed)
- Simpler than S3/Azure Blob
- Easier to backup and secure

**Why PDF.js + fabric.js?**
- PDF.js: Standard Mozilla library, reliable
- fabric.js: Excellent for interactive canvas placement
- No complex CAD parsing needed
- User-friendly interface

**Why Bulk CSV Instead of Entra ID (Phase 1)?**
- Faster MVP
- More control
- Works without Entra integration
- Easier testing
- Entra ID sync is Phase 2 enhancement

---

## Known Limitations (MVP)

- Single floor plan upload at a time (batch later)
- No drag-reorder of markers (recreate if needed)
- No marker templates or presets
- No cost/capacity planning features
- No multi-site management (Phase 2)
- No real-time sync across users (works for small team)

---

## Next Steps (Post-MVP)

1. **Phase 2**: Entra ID sync, auto-assign by location
2. **Phase 3**: Advanced reporting, department analytics
3. **Phase 4**: Mobile app, push notifications
4. **Phase 5**: Multi-tenant, advanced permissions

---

## Questions Answered

**Q: SQL Server support?**
A: Yes, via Drizzle ORM drizzle-orm/mssql. On-prem or Azure SQL.

**Q: Local PDF storage?**
A: Yes, configured via environment variable (e.g., `PDF_STORAGE_PATH=C:\FloorPlans` or UNC path).

**Q: Bulk operations?**
A: Yes, CSV import for users and assignments. Templates provided.

**Q: Entra ID?**
A: Phase 2. Phase 1 uses basic auth. Phase 2 adds SSO.

**Q: Roles?**
A: Two roles only - User (full permissions) + IT Admin (settings/logs).

**Q: Timeline?**
A: 1-2 weeks MVP with Claude Code.

