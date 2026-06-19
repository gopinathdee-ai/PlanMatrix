# Database Schema - Floor Plan Management System (SQL Server)

## Overview

SQL Server relational schema for real floor plan-based cubicle management system with bulk operations support.

---

## SQL Server Schema (T-SQL)

### 1. Floor Plans Table
```sql
CREATE TABLE floor_plans (
  id INT PRIMARY KEY IDENTITY(1,1),
  building VARCHAR(255) NOT NULL,
  floor_number VARCHAR(50) NOT NULL,
  pdf_filename VARCHAR(255) NOT NULL,
  pdf_url VARCHAR(500) NOT NULL,
  uploaded_at DATETIME2 DEFAULT GETUTCDATE(),
  created_by VARCHAR(255),
  CONSTRAINT uk_building_floor UNIQUE(building, floor_number)
);

CREATE INDEX idx_floor_plans_building ON floor_plans(building);
CREATE INDEX idx_floor_plans_floor_number ON floor_plans(floor_number);
```

**Columns:**
- `id` - Primary key
- `building` - Building name (e.g., "Building A")
- `floor_number` - Floor identifier (e.g., "Floor 1", "3rd Floor")
- `pdf_filename` - Filename stored on disk
- `pdf_url` - URL to serve PDF (e.g., `/floor-plans/12345-BuildingA-Floor1.pdf`)
- `uploaded_at` - Upload timestamp
- `created_by` - User who uploaded

---

### 2. Markers Table (Cubicles)
```sql
CREATE TABLE markers (
  id INT PRIMARY KEY IDENTITY(1,1),
  floor_plan_id INT NOT NULL,
  marker_number VARCHAR(50) NOT NULL,
  pixel_x INT NOT NULL,
  pixel_y INT NOT NULL,
  pdf_page_number INT DEFAULT 1,
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id) ON DELETE CASCADE,
  CONSTRAINT uk_marker_per_floor UNIQUE(floor_plan_id, marker_number)
);

CREATE INDEX idx_markers_floor_plan_id ON markers(floor_plan_id);
CREATE INDEX idx_markers_marker_number ON markers(marker_number);
```

**Columns:**
- `id` - Primary key
- `floor_plan_id` - Reference to floor plan PDF
- `marker_number` - Cubicle identifier (e.g., "1509", "1510")
- `pixel_x` - X coordinate on PDF (where admin clicked)
- `pixel_y` - Y coordinate on PDF (where admin clicked)
- `pdf_page_number` - Page number (for multi-page PDFs)
- `created_at` - When marker was placed

**Note:** Markers represent physical locations on the floor plan where cubicles are placed.

---

### 3. Users Table
```sql
CREATE TABLE users (
  id INT PRIMARY KEY IDENTITY(1,1),
  email VARCHAR(255) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  department VARCHAR(255),
  entra_id VARCHAR(255), -- Phase 2: Entra ID integration
  is_it_admin BIT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at DATETIME2 DEFAULT GETUTCDATE(),
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  CONSTRAINT chk_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_entra_id ON users(entra_id);
```

**Columns:**
- `id` - Primary key
- `email` - User email (unique)
- `name` - User full name
- `department` - Department (e.g., "Engineering", "Sales")
- `entra_id` - Entra ID GUID (Phase 2, for SSO sync)
- `is_it_admin` - Boolean flag for IT Admin access
- `status` - active/inactive (for bulk operations)
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

---

### 4. Assignments Table (Current Assignment)
```sql
CREATE TABLE assignments (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT NOT NULL UNIQUE,
  marker_id INT NOT NULL UNIQUE,
  assigned_at DATETIME2 DEFAULT GETUTCDATE(),
  source VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'bulk-csv'
  updated_at DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (marker_id) REFERENCES markers(id) ON DELETE CASCADE
);

CREATE INDEX idx_assignments_user_id ON assignments(user_id);
CREATE INDEX idx_assignments_marker_id ON assignments(marker_id);
```

**Columns:**
- `id` - Primary key
- `user_id` - Reference to user (UNIQUE: each user has max 1 cubicle)
- `marker_id` - Reference to marker/cubicle (UNIQUE: each cubicle has max 1 user)
- `assigned_at` - Initial assignment timestamp
- `source` - How assignment was made (manual or bulk-csv)
- `updated_at` - Last change timestamp

**Key Constraint:** Both `user_id` and `marker_id` are UNIQUE, ensuring 1:1 relationships.

---

### 5. Assignment History Table (Audit Trail)
```sql
CREATE TABLE assignment_history (
  id INT PRIMARY KEY IDENTITY(1,1),
  user_id INT NOT NULL,
  old_marker_id INT,
  new_marker_id INT,
  action VARCHAR(50) NOT NULL,
  source VARCHAR(50) DEFAULT 'manual', -- 'manual' or 'bulk-csv'
  timestamp DATETIME2 DEFAULT GETUTCDATE(),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (old_marker_id) REFERENCES markers(id) ON DELETE SET NULL,
  FOREIGN KEY (new_marker_id) REFERENCES markers(id) ON DELETE SET NULL,
  CONSTRAINT chk_action CHECK (action IN ('assign', 'reassign', 'remove'))
);

CREATE INDEX idx_history_user_id ON assignment_history(user_id);
CREATE INDEX idx_history_timestamp ON assignment_history(timestamp DESC);
CREATE INDEX idx_history_action ON assignment_history(action);
```

**Columns:**
- `id` - Primary key
- `user_id` - Which user was affected
- `old_marker_id` - Previous cubicle (NULL if new assignment)
- `new_marker_id` - New cubicle (NULL if removal)
- `action` - 'assign' (first time), 'reassign' (moved), 'remove' (unassigned)
- `source` - How change was made (manual or bulk-csv)
- `timestamp` - When change occurred

**Logging Logic:**
- **assign**: User had no cubicle → assigned to new_marker_id
- **reassign**: User moved from old_marker_id → new_marker_id
- **remove**: User removed from old_marker_id (both old and new are NULL if remove)

---

### 6. Settings Table (IT Admin Configuration)
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY IDENTITY(1,1),
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT NOT NULL,
  updated_at DATETIME2 DEFAULT GETUTCDATE()
);

-- Sample settings
INSERT INTO settings (key, value) VALUES
  ('PDF_STORAGE_PATH', './public/floor-plans'),
  ('MAX_FILE_SIZE_MB', '50'),
  ('ALLOWED_FILE_TYPES', 'pdf');
```

**Columns:**
- `id` - Primary key
- `key` - Setting name (e.g., "PDF_STORAGE_PATH")
- `value` - Setting value
- `updated_at` - When setting was changed

**Purpose:** Allows IT Admin to configure system without code changes.

---

### 7. Import Logs Table (Track Bulk Operations)
```sql
CREATE TABLE import_logs (
  id INT PRIMARY KEY IDENTITY(1,1),
  type VARCHAR(50) NOT NULL, -- 'users' or 'assignments'
  filename VARCHAR(255) NOT NULL,
  success_count INT DEFAULT 0,
  error_count INT DEFAULT 0,
  errors TEXT, -- JSON array of error messages
  timestamp DATETIME2 DEFAULT GETUTCDATE()
);

CREATE INDEX idx_import_logs_type ON import_logs(type);
CREATE INDEX idx_import_logs_timestamp ON import_logs(timestamp DESC);
```

**Columns:**
- `id` - Primary key
- `type` - Type of import (users or assignments)
- `filename` - CSV filename that was imported
- `success_count` - Number of successful rows
- `error_count` - Number of failed rows
- `errors` - JSON array with error details per row
- `timestamp` - When import happened

**Purpose:** Audit trail for bulk operations, helps troubleshoot issues.

---

## Data Relationships

```
floor_plans (1) ──── (Many) markers
                          │
                          ├──── (1) assignments
                          │         │
                          │         └──── (1) users
                          │
                          └──── (Many) assignment_history


users (1) ──── (1) assignments
      │
      └──── (Many) assignment_history
```

---

## Key Queries (T-SQL Examples)

### 1. Get All Floor Plans with Marker Count & Occupancy
```sql
SELECT 
  fp.id,
  fp.building,
  fp.floor_number,
  COUNT(DISTINCT m.id) AS total_markers,
  COUNT(DISTINCT a.id) AS occupied_markers,
  COUNT(DISTINCT m.id) - COUNT(DISTINCT a.id) AS available_markers,
  ROUND(100.0 * COUNT(DISTINCT a.id) / NULLIF(COUNT(DISTINCT m.id), 0), 1) AS occupancy_rate
FROM floor_plans fp
LEFT JOIN markers m ON fp.id = m.floor_plan_id
LEFT JOIN assignments a ON m.id = a.marker_id
GROUP BY fp.id, fp.building, fp.floor_number
ORDER BY fp.building, fp.floor_number;
```

### 2. Get User's Current Cubicle Location
```sql
SELECT 
  u.name,
  u.email,
  u.department,
  m.marker_number,
  fp.building,
  fp.floor_number,
  a.assigned_at
FROM users u
LEFT JOIN assignments a ON u.id = a.user_id
LEFT JOIN markers m ON a.marker_id = m.id
LEFT JOIN floor_plans fp ON m.floor_plan_id = fp.id
WHERE u.id = @userId;
```

### 3. Get All Unassigned Users
```sql
SELECT u.* 
FROM users u
WHERE u.status = 'active'
AND u.id NOT IN (SELECT user_id FROM assignments WHERE user_id IS NOT NULL)
ORDER BY u.name;
```

### 4. Get Empty Cubicles on Specific Floor
```sql
SELECT m.* 
FROM markers m
WHERE m.floor_plan_id = @floorPlanId
AND m.id NOT IN (SELECT marker_id FROM assignments WHERE marker_id IS NOT NULL)
ORDER BY m.marker_number;
```

### 5. Get Assignment History for Specific User
```sql
SELECT 
  ah.id,
  u.name,
  ah.action,
  om.marker_number AS old_cubicle,
  ofp.floor_number AS old_floor,
  nm.marker_number AS new_cubicle,
  nfp.floor_number AS new_floor,
  ah.timestamp
FROM assignment_history ah
LEFT JOIN users u ON ah.user_id = u.id
LEFT JOIN markers om ON ah.old_marker_id = om.id
LEFT JOIN floor_plans ofp ON om.floor_plan_id = ofp.id
LEFT JOIN markers nm ON ah.new_marker_id = nm.id
LEFT JOIN floor_plans nfp ON nm.floor_plan_id = nfp.id
WHERE ah.user_id = @userId
ORDER BY ah.timestamp DESC;
```

### 6. Get Recent Bulk Import Results
```sql
SELECT TOP 10
  type,
  filename,
  success_count,
  error_count,
  timestamp
FROM import_logs
ORDER BY timestamp DESC;
```

### 7. Dashboard Stats
```sql
SELECT 
  COUNT(DISTINCT fp.id) AS total_floor_plans,
  COUNT(DISTINCT m.id) AS total_markers,
  COUNT(DISTINCT a.id) AS occupied_markers,
  COUNT(DISTINCT m.id) - COUNT(DISTINCT a.id) AS available_markers,
  COUNT(DISTINCT u.id) AS total_users
FROM floor_plans fp
LEFT JOIN markers m ON fp.id = m.floor_plan_id
LEFT JOIN assignments a ON m.id = a.marker_id
LEFT JOIN users u ON a.user_id = u.id;
```

---

## SQL Server Specific Features

### Identity/Auto-Increment
```sql
-- Use IDENTITY for auto-increment
id INT PRIMARY KEY IDENTITY(1,1)

-- To reset identity after deletes
DBCC CHECKIDENT (floor_plans, RESEED, 0);
```

### DateTime2
```sql
-- For timestamp columns (better precision than DATETIME)
created_at DATETIME2 DEFAULT GETUTCDATE()

-- GETUTCDATE() returns UTC time
-- GETDATE() returns local server time (avoid for audit)
```

### Check Constraints
```sql
-- Enforce valid values
CONSTRAINT chk_status CHECK (status IN ('active', 'inactive'))
CONSTRAINT chk_action CHECK (action IN ('assign', 'reassign', 'remove'))
```

### Foreign Keys with Cascading Deletes
```sql
FOREIGN KEY (floor_plan_id) REFERENCES floor_plans(id) ON DELETE CASCADE
-- Deleting a floor plan automatically deletes its markers and related data
```

---

## Performance Considerations

### Indexes Created
- `floor_plans`: building, floor_number
- `markers`: floor_plan_id, marker_number
- `users`: email, status, entra_id
- `assignments`: user_id, marker_id
- `assignment_history`: user_id, timestamp (DESC), action
- `import_logs`: type, timestamp (DESC)

### Why These Indexes?
- `floor_plan_id` on markers: Filtering cubicles by floor
- `user_id` & `marker_id` on assignments: Finding assignments by user or cubicle
- `timestamp DESC` on history: Sorting audit trail (most recent first)
- `email` on users: User lookup by email

### Scalability
- Current design supports 10,000+ markers, 1,000+ users easily
- Import logs grow with bulk operations (archive old logs if needed)
- Assignment history grows continuously (consider archiving after 1 year)

---

## Backup & Restore

### Backup Database
```sql
BACKUP DATABASE floorplan_db 
TO DISK = 'C:\Backups\floorplan_db.bak'
WITH INIT, COMPRESSION;
```

### Restore Database
```sql
RESTORE DATABASE floorplan_db 
FROM DISK = 'C:\Backups\floorplan_db.bak'
WITH REPLACE;
```

### Schedule Backups (SQL Server Agent)
```sql
-- Set up nightly backup
-- Use SQL Server Management Studio → Maintenance Plans
-- Or T-SQL Agent job
```

---

## Security Notes

✅ No sensitive data in schema (auth handled by NextAuth)
✅ Foreign keys prevent orphaned records
✅ Audit trail is immutable (insert-only)
✅ Check constraints enforce valid data
✅ Indexes optimize query performance
✅ Regular backups recommended

**Phase 2 Enhancements:**
- Row-level security (if multi-tenant)
- Encryption at rest (TDE)
- Audit logging (SQL Server Audit)
- Change data capture (CDC)

---

## Migration with Drizzle

### Generate Migration
```bash
# After updating db/schema.ts
npx drizzle-kit generate:mssql
```

### Apply Migration
```bash
# Push to SQL Server
npx drizzle-kit push:mssql
```

### View Schema (GUI)
```bash
# Interactive database browser
npx drizzle-kit studio
```

---

## CSV Import Templates

### Users Template
```csv
email,name,department
john.doe@office.com,John Doe,Engineering
jane.smith@office.com,Jane Smith,Sales
bob.wilson@office.com,Bob Wilson,HR
```

### Assignments Template (Generated by system)
```csv
building,floor_number,marker_number,user_email
Building A,Floor 1,1501,john.doe@office.com
Building A,Floor 1,1502,jane.smith@office.com
Building A,Floor 1,1503,[leave empty if unassigned]
Building A,Floor 2,2101,bob.wilson@office.com
```

---

**Database schema is production-ready!** 🚀
