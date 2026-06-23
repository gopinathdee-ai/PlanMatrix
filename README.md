# Floor Plan Management System - Boilerplate

Real floor plan-based cubicle management system with bulk operations.

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env.local` with your SQL Server connection details:
```env
DATABASE_URL="Server=localhost;Database=floorplan_db;User Id=sa;Password=YourPassword123;Encrypt=false;"
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="Password123"
PDF_STORAGE_PATH="./public/floor-plans"
```

Generate NEXTAUTH_SECRET:
```bash
openssl rand -base64 32
```

### 3. Setup Database
```bash
# Generate migrations
npm run db:generate

# Push schema to SQL Server
npm run db:push
```

### 4. Start Development
```bash
npm run dev
```

Visit http://localhost:3000 → Login with `admin` / `Password123`

## Project Structure

```
PlanMatrix/
├── app/                      # Next.js App Router pages
│   ├── api/                 # API routes
│   ├── components/          # React components
│   ├── dashboard/           # Dashboard page
│   ├── floor-plans/         # Floor plan pages
│   │   ├── [id]/           # Floor plan detail, markers, assignments, print
│   │   └── upload/         # Floor plan upload
│   ├── users/              # User management (add, bulk import)
│   ├── assignments/        # Assignment management & viewing
│   ├── login/              # Login page
│   ├── layout.tsx          # Root layout
│   ├── page.tsx            # Home (redirects to /dashboard)
│   └── globals.css         # Global styles
├── components/              # Reusable components
│   └── navbar.tsx          # Navigation bar with hamburger menu
├── db/                      # Database
│   ├── schema.ts           # Database schema (Drizzle ORM)
│   └── migrations/         # SQL Server migrations
├── lib/                     # Utilities
│   ├── db.ts               # Knex.js query builder
│   ├── markerDisplay.ts    # Marker display utilities
│   ├── upload.ts           # File upload config
│   └── csv-parser.ts       # CSV parsing
├── docs/                    # Documentation
│   ├── FEATURES_CHECKLIST_FINAL.md    # Complete feature list
│   ├── DATABASE_SCHEMA_FINAL.md       # Schema documentation
│   └── RAD_STRATEGY_FINAL.md          # Architecture overview
├── public/
│   ├── images/             # Logo and assets
│   └── pdfs/               # Uploaded floor plans (PDFs)
├── .env.local              # Environment variables
├── next.config.js          # Next.js configuration
├── tsconfig.json           # TypeScript configuration
├── package.json            # Dependencies
└── README.md               # This file
```

## Key Features

✅ **Core Features (MVP Complete)**
- Floor plan PDF upload and management
- Interactive marker placement on PDFs with zoom support
- User management (manual add & bulk CSV import)
- Cubicle assignment (manual & bulk CSV import)
- Assignment reassignment and removal
- Print floor plans with legends (A3 format)
- Dashboard with occupancy metrics
- Full mobile responsiveness (responsive navbar, card views, mobile-friendly modals)

📚 **Complete Feature List**
See [docs/FEATURES_CHECKLIST_FINAL.md](./docs/FEATURES_CHECKLIST_FINAL.md) for:
- All completed features with detailed descriptions
- In-progress items
- Phase 2 enhancements and Phase 3 roadmap
- MVP success criteria

## Getting Started

1. **Install dependencies**: 
   ```bash
   npm install
   ```

2. **Configure `.env.local`** with your SQL Server connection:
   ```env
   DATABASE_HOST=localhost
   DATABASE_PORT=1433
   DATABASE_NAME=floorplan_db
   DATABASE_USER=sa
   DATABASE_PASSWORD=YourPassword
   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>
   NEXTAUTH_URL=http://localhost:3000
   PDF_STORAGE_PATH=./public/pdfs
   ```

3. **Ensure database exists** (create manually or via SQL Server Management Studio)

4. **Start dev server**: 
   ```bash
   npm run dev
   ```

5. **Login** at http://localhost:3000 with:
   - Username: `admin@planmatrix.local`
   - Password: `Password123`

## Available Scripts

```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
```

## Database Setup

Database tables are created automatically on first run via migrations in `db/migrations/`.

To manually check database connection:
```bash
node -e "require('./lib/db').db('users').select('*').then(r => console.log(r))"
```

## Technology Stack

- **Frontend**: Next.js 16.2.9, TypeScript, Tailwind CSS with Kodchasan font
- **Backend**: Next.js API Routes, NextAuth.js v4.24.14
- **Database**: SQL Server (MSSQL), Knex.js 3.2.10 (query builder & migrations)
- **Auth**: NextAuth.js with session management
- **PDF**: pdfjs-dist (Mozilla) for viewing
- **Canvas**: fabric.js for interactive marker placement
- **Marker Display**: Custom zoom-responsive markers with initials
- **UI Components**: Tailwind CSS, Lucide icons
- **Notifications**: Sonner (toast)
- **File Handling**: Multer for uploads, CSV parsing utilities

## Documentation

See the `docs/` directory for complete documentation:

- **[FEATURES_CHECKLIST_FINAL.md](./docs/FEATURES_CHECKLIST_FINAL.md)** - Complete feature list, status tracking, MVP criteria, and testing checklist
- **[DATABASE_SCHEMA_FINAL.md](./docs/DATABASE_SCHEMA_FINAL.md)** - Database schema, tables, and relationships
- **[RAD_STRATEGY_FINAL.md](./docs/RAD_STRATEGY_FINAL.md)** - Project overview, architecture, and design decisions

## Architecture Overview

**Frontend:**
- Next.js App Router with TypeScript
- Responsive design (mobile-first approach)
- Tailwind CSS for styling

**Backend:**
- Next.js API Routes
- Knex.js for SQL Server queries
- NextAuth.js for authentication

**Database:**
- SQL Server with Knex.js migrations
- Tables: floor_plans, markers, users, assignments, assignment_history, settings, import_logs

**Key Workflows:**
1. Upload PDF → Place markers → Assign users → View assignments
2. Bulk import users via CSV
3. Bulk assign cubicles via CSV
4. Print floor plans with legends

## Troubleshooting

**Q: "Cannot connect to SQL Server"**
A: 
- Verify SQL Server is running (`services.msc` on Windows)
- Check `DATABASE_HOST`, `DATABASE_USER`, `DATABASE_PASSWORD` in `.env.local`
- Ensure database exists and is accessible
- On Windows: SQL Server should be set to TCP/IP enabled

**Q: "Database doesn't exist"**
A:
- Manually create database in SQL Server Management Studio
- Database name should match `DATABASE_NAME` in `.env.local`
- Run migrations automatically on first connection

**Q: "Users fetch error" or similar API errors**
A:
- Check browser console for specific error message
- Verify all database tables exist
- Check `.env.local` credentials are correct
- Restart dev server: `npm run dev`

**Q: Port 3000 already in use?**
A: Run on different port: `npm run dev -- -p 3001`

**Q: Mobile view looks broken**
A: Clear browser cache and hard refresh (Ctrl+Shift+R or Cmd+Shift+R)

## Support & Contributing

For issues:
1. Check FEATURES_CHECKLIST_FINAL.md for known limitations
2. Review Troubleshooting section above
3. Check browser DevTools console for errors
4. Verify `.env.local` is configured correctly

For questions about features and status, see [FEATURES_CHECKLIST_FINAL.md](./docs/FEATURES_CHECKLIST_FINAL.md).

---

**Project Status:** MVP Complete (Phase 1) ✅

**Next Phase:** Phase 2 enhancements planned (Entra ID, auto-assignment, advanced features)
