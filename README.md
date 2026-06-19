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
floorplan-system/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── components/        # React components
│   ├── dashboard/         # Dashboard page
│   ├── floor-plans/       # Floor plan pages
│   ├── users/            # User management
│   ├── assignments/      # Assignment management
│   ├── history/          # Audit trail
│   ├── admin/            # IT Admin settings
│   ├── login/            # Login page
│   ├── layout.tsx        # Root layout
│   ├── page.tsx          # Home (redirects to /dashboard)
│   └── globals.css       # Global styles
├── db/                    # Database
│   ├── schema.ts         # Drizzle ORM schema
│   └── migrations/       # Generated migrations
├── lib/                   # Utilities
│   ├── db.ts            # Database connection
│   ├── upload.ts        # File upload config
│   └── csv-parser.ts    # CSV parsing
├── public/
│   └── floor-plans/     # PDF storage directory
├── .env.local           # Environment variables
├── drizzle.config.ts    # Drizzle configuration
├── next.config.js       # Next.js configuration
├── tsconfig.json        # TypeScript configuration
├── package.json         # Dependencies
└── README.md            # This file
```

## Key Features (To Be Implemented)

- ✅ Database schema and connections
- ✅ NextAuth authentication setup
- ✅ File upload configuration
- ✅ CSV parsing utilities
- 🔄 PDF floor plan viewer (Claude Code)
- 🔄 Interactive marker placement (Claude Code)
- 🔄 User management (Claude Code)
- 🔄 Cubicle assignments (Claude Code)
- 🔄 Bulk import/export (Claude Code)
- 🔄 Audit trail (Claude Code)
- 🔄 IT Admin settings (Claude Code)

## Next Steps

1. **Install dependencies**: `npm install`
2. **Configure `.env.local`** with your SQL Server details
3. **Setup database**: `npm run db:push`
4. **Start dev server**: `npm run dev`
5. **Follow CLAUDE_CODE_PROMPT_FINAL.md** to build remaining features with Claude Code

## Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm run lint         # Run ESLint
npm run db:generate  # Generate Drizzle migrations
npm run db:push      # Push migrations to database
npm run db:studio    # Open Drizzle Studio (GUI)
```

## Technology Stack

- **Frontend**: Next.js 14, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: SQL Server, Drizzle ORM
- **Auth**: NextAuth.js
- **PDF**: pdfjs-dist (Mozilla)
- **Canvas**: fabric.js
- **UI**: Tailwind CSS, shadcn/ui components
- **Notifications**: Sonner (toast)

## Documentation

- `RAD_STRATEGY_FINAL.md` - Project overview and architecture
- `CLAUDE_CODE_PROMPT_FINAL.md` - Implementation guide for Claude Code
- `DATABASE_SCHEMA_FINAL.md` - Database schema documentation
- `FEATURES_CHECKLIST_FINAL.md` - Complete feature checklist
- `BOILERPLATE_CODE_FINAL.md` - Setup instructions

## Troubleshooting

**Q: SQL Server connection refused?**
A: Check connection string, verify SQL Server is running, check firewall rules

**Q: Database push fails?**
A: Ensure SQL Server is accessible, check credentials, verify database exists

**Q: Port 3000 already in use?**
A: Run on different port: `next dev -p 3001`

## Support

Refer to the documentation files included for:
- Complete feature list
- API endpoint documentation
- Database schema details
- Deployment instructions

---

**Ready to build!** 🚀

Use `CLAUDE_CODE_PROMPT_FINAL.md` with Claude Code to complete the implementation.
