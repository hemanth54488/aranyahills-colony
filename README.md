# Aranya Hills Colony Welfare Association

Official website for Aranya Hills Colony Welfare Association, Badangpet, Hyderabad — 500058, Telangana, India.

## Live Website
- Production: https://aranyahillscolony.in
- Staging: https://aranyahills-colony.vercel.app

## Documentation
| Document | Description |
|---|---|
| [Architecture](docs/ARCHITECTURE.md) | System design, component structure, data flow |
| [Database Design](docs/DATABASE.md) | Schema, ERD, tables, RLS policies |
| [Tech Stack](docs/TECH_STACK.md) | All technologies, libraries and versions |
| [Deployment Guide](docs/DEPLOYMENT.md) | Step-by-step deployment instructions |
| [Admin Guide](docs/ADMIN_GUIDE.md) | How to manage the website (for Secretary) |
| [User Guide](docs/USER_GUIDE.md) | How residents use the portal |

## Quick Start (Development)

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase account (free)

### Setup
```
git clone https://github.com/hemanth54488/aranyahills-colony.git
cd aranyahills-colony
npm install
cp .env.example .env
# Fill in your Supabase credentials in .env
npm run dev
```
Open http://localhost:5173 in your browser.

### Environment Variables
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_GOOGLE_MAPS_API_KEY=your-maps-key
```

## Project Structure
```
aranyahills-colony/
+-- public/
+-- src/
|   +-- components/layout/     Navbar, Footer
|   +-- context/               Auth context
|   +-- i18n/locales/          EN, TE, HI translations
|   +-- lib/                   Supabase client, notify utility
|   +-- pages/
|   |   +-- admin/             Admin panel pages
|   |   +-- Home.jsx
|   |   +-- Login.jsx
|   |   +-- Register.jsx
|   |   +-- Committee.jsx
|   |   +-- Plots.jsx
|   |   +-- ColonyInfo.jsx
|   |   +-- Notices.jsx
|   |   +-- Services.jsx
|   +-- App.jsx
|   +-- main.jsx
|   +-- index.css
+-- supabase/schema.sql
+-- docs/
+-- vercel.json
+-- vite.config.js
+-- package.json
```

## Multi-language Support
- English (EN)
- Telugu (TE) - ananya hills
- Hindi (HI)

## User Roles
| Role | Permissions |
|---|---|
| Admin | Full access - manage all data |
| Committee | Post notices, view all data |
| Resident | View colony info, manage own plot |
| Security | Log visitors |

## Contact
- Colony: Aranya Hills Colony Welfare Association
- Location: Badangpet, Hyderabad - 500058, Telangana
- Email: aranyahillscolony@gmail.com
