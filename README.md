# Floor Plan Management System - Boilerplate

Real floor plan-based cubicle management system with bulk operations.

## Quick Start

**For detailed setup instructions, see [docs/Setup.md](./docs/Setup.md)**

### Prerequisites
- SQL Server 2019+
- Node.js v18+

### Quick Setup (5 minutes)

1. Clone and install:
   ```bash
   git clone https://github.com/gopinathdee-ai/PlanMatrix.git
   cd PlanMatrix
   npm install
   ```

2. Configure `.env.local` with your SQL Server credentials (see [docs/Setup.md](./docs/Setup.md#step-2-configure-environment-variables))

3. Setup database and migrations:
   ```bash
   npm run db:initialize
   npm run db:migrate
   ```

4. Start development:
   ```bash
   npm run dev
   ```

5. Login at http://localhost:3000 with your admin credentials

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

Follow the complete setup guide in **[docs/Setup.md](./docs/Setup.md)** which includes:
- Environment configuration
- SQL Server database setup
- Running migrations
- Starting the development server

## Available Scripts

For all available npm scripts and database commands, see [docs/Setup.md#available-npm-scripts](./docs/Setup.md#available-npm-scripts).

Common scripts:
```bash
npm run dev          # Start development server (port 3000)
npm run build        # Build for production
npm run db:migrate   # Run database migrations
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

For detailed troubleshooting steps, see [docs/Setup.md#troubleshooting](./docs/Setup.md#troubleshooting).

Common issues:
- **SQL Server connection errors** → Check credentials and TCP/IP settings
- **Database doesn't exist** → Run `npm run db:initialize`
- **API errors** → Verify `.env.local` is configured and migrations ran
- **Port already in use** → Use `npm run dev -- -p 3001`

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
