# 🎓 CampusMart — College-Exclusive Recommerce Platform

**CampusMart** is a full-stack, college-exclusive recommerce platform built specifically for college campuses. Students can buy and sell verified campus essentials (scientific calculators, engineering textbooks, keyboards, and lab gear) within their college community with fixed fair pricing, zero haggling, and hyper-local pickup.

---

## 📸 Key Features & Visual Identity

- **College-Exclusive & Immutable**: Every student account is bound permanently to **ONE college** upon registration (e.g. `📍 BPIT`, `📍 MAIT`, `📍 MSIT`, `📍 USAR`). The backend strictly enforces college immutability and never trusts client-supplied college parameters.
- **Dynamic College Availability**: Products are marked **`✓ Available on your campus`** *only* if an approved active sell request exists for that specific college and product. Otherwise, it shows **`Currently unavailable at your college`**.
- **Admin-Controlled Pricing**: Students cannot set or negotiate prices. Admins determine:
  - **Buying Price**: What the platform pays students when acquiring items (e.g. ₹550).
  - **Selling Price**: What buyers pay to purchase the item (e.g. ₹799).
- **"We Are Buying This" Demand Control**: Admins can toggle `is_buying_enabled` on any product in real time. If enabled, students can submit sell requests; if disabled, students see *"Currently not accepting this item"*.
- **Campus Heroes Ambassador Program**: Dedicated onboarding flow and admin review for campus representatives.
- **Modern Student-Centric Aesthetics**:
  - Primary Green: `#00A878`
  - Dark Slate Green: `#063B32`
  - Soft Light Mint: `#D9F7EF`
  - Clean typography (Plus Jakarta Sans), rounded cards, subtle shadows, and mobile bottom navigation.

---

## 🏗️ Architecture & Tech Stack

```text
/kampus mart
├── client/                     # Vite + React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/         # Navbar, Footer, ProductCard
│   │   ├── context/            # AuthContext (JWT session, locked college)
│   │   ├── pages/              # Home, BuyPage, ProductDetailPage, SellPage,
│   │   │                       # CampusHeroesPage, ProfilePage, LoginPage, SignupPage
│   │   │   └── admin/          # AdminDashboard, AdminProducts, AdminBuyingQueue,
│   │   │                       # AdminSellRequests, AdminBuyRequests, AdminCampusHeroes
│   │   └── services/           # api.ts (REST API client)
│   ├── vite.config.ts
│   └── tailwind.config.js
│
├── server/                     # Node.js + Express + TypeScript REST API
│   ├── src/
│   │   ├── routes/             # auth, products, sellRequests, buyRequests, campusHeroes, admin, colleges
│   │   ├── middleware/         # auth (JWT & Role verification), upload (Multer)
│   │   ├── config/             # environment variables
│   │   ├── db.ts               # PrismaClient instance
│   │   └── index.ts            # Express server initialization
│   ├── uploads/                # Local configurable static image uploads
│   └── .env.example
│
└── database/                   # Database Assets, Schemas & Migrations
    ├── schema.prisma           # Zero-config SQLite / Universal schema for instant local dev
    ├── schema.postgresql.prisma# PostgreSQL production Prisma schema
    ├── seed.ts                 # Database seed script
    └── migrations/
        └── 20261001000000_init/
            └── migration.sql   # PostgreSQL initial DDL migration
```

---

## ⚡ Quick Start & Setup Instructions

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22.18)
- **npm**

### 2. Install Dependencies
From the repository root, install dependencies across all workspaces:
```bash
npm run install:all
```
*(Or run `npm install` inside `/server` and `/client` respectively).*

### 3. Database Initialization & Seeding
CampusMart supports **zero-config local SQLite** out-of-the-box for instant local testing, as well as **PostgreSQL** for production.

To generate the Prisma client, push tables, and seed the demo data:
```bash
cd server
npm run db:setup
```

This runs:
1. `prisma generate`
2. `prisma db push`
3. `tsx src/seed.ts`

### 4. Running the Development Servers
From the root directory, start both the Express REST API and Vite frontend with a single command:
```bash
npm run dev
```

- **Frontend Client**: [http://localhost:5173](http://localhost:5173)
- **Backend API**: [http://localhost:5000/api](http://localhost:5000/api)
- **Health Check**: [http://localhost:5000/api/health](http://localhost:5000/api/health)

---

## 🐘 PostgreSQL Configuration (Production)

To point to a live PostgreSQL database:
1. In `server/.env`, set your connection string:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/campusmart?schema=public"
   ```
2. Switch `database/schema.prisma` datasource provider to `postgresql`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
   *(Or use `database/schema.postgresql.prisma`)*
3. Apply migrations and seed:
   ```bash
   npx prisma migrate deploy --schema=../database/schema.postgresql.prisma
   npm run db:seed
   ```

---

## 🔑 Demo Accounts & Admin Login Instructions

The seed script creates the following ready-to-test accounts. Instant 1-click login buttons are also provided on the `/login` page:

| Role | Name | Email | Password | College | Description |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **ADMIN** | CampusMart Admin | `admin@campusmart.in` | `admin123` | BPIT | Full access to `/admin` dashboard, approval queue, catalog management, pricing controls. |
| **USER** | Rahul Sharma | `rahul@bpit.ac.in` | `student123` | **BPIT** | Student from BPIT. Demonstrates BPIT availability (Calculator & Book available). |
| **USER** | Priya Singh | `priya@mait.ac.in` | `student123` | **MAIT** | Student from MAIT. Demonstrates MAIT availability (Keyboard & Book available, Calculator unavailable). |
| **USER** | Arjun Verma | `arjun@msit.ac.in` | `student123` | **MSIT** | Student from MSIT. |

---

## 🧠 How College-Specific Availability Works

The core business logic dynamically computes inventory availability without complicated warehouse systems:

```text
                  Logged-in Student (e.g. BPIT)
                                ↓
                      GET /api/products
                                ↓
       For each product in active catalog:
       Query `sell_requests` table:
       WHERE product_id = product.id
         AND college_id = student.college_id (BPIT)
         AND status = 'APPROVED'
                                ↓
           ┌────────────────────┴────────────────────┐
           ↓                                         ↓
     Count > 0                                 Count = 0
  available = true                          available = false
  "✓ Available at BPIT"                     "Currently unavailable at BPIT"
  [Request to Buy]                          [Notify / Request Interest]
```

### Seeded Demonstration Matrix:
- **BPIT**:
  - `Casio FX-991ES Plus`: **✓ Available** (Approved sell request from Rahul)
  - `Engineering Mathematics Book`: **✓ Available** (Approved sell request from Rahul)
  - `Mechanical Keyboard`: **Unavailable** (No approved sell request for BPIT)
- **MAIT**:
  - `Casio FX-991ES Plus`: **Unavailable**
  - `Engineering Mathematics Book`: **✓ Available** (Approved sell request from Priya)
  - `Mechanical Keyboard`: **✓ Available** (Approved sell request from Priya)

---

## 🔒 Security & College Immutability Rules

1. **One-Time College Selection**: The user selects their college only once during signup. The frontend shows a mandatory warning:
   > *"Choose your college carefully. Your college can only be selected once and cannot be changed later."*
2. **Backend Enforcement**: When creating a `SellRequest`, `BuyRequest`, or `CampusHeroApplication`, the backend reads `req.user.college_id` directly from the authenticated JWT session. Any `college_id` passed in the request body is discarded.
3. **No College Mutation**: There is no API route or UI button allowing a regular user to modify their `college_id`.

---

## 📡 REST API Specification

### Authentication
- `POST /api/auth/register` — Register a student with permanent `college_id`.
- `POST /api/auth/login` — Login with `email` and `password` (no college dropdown).
- `GET /api/auth/me` — Retrieve authenticated user profile with locked college details.

### Catalog & Availability
- `GET /api/products` — List catalog products with dynamic `is_available` computed for current college.
- `GET /api/products/:id` — Get single product detail and availability status.

### Sell Requests
- `POST /api/sell-requests` — Submit item for sale (inherits `college_id`). Validates `is_buying_enabled === true`.
- `GET /api/sell-requests/my` — List current student's submitted sell requests with status.

### Buy Requests
- `POST /api/buy-requests` — Submit a purchase inquiry or express interest for out-of-stock campus items.
- `GET /api/buy-requests/my` — List current student's purchase requests.

### Campus Heroes
- `POST /api/campus-heroes/apply` — Submit application to represent your college.
- `GET /api/campus-heroes/my` — Get status of current student's application.

### Admin (`requireAuth` + `requireAdmin`)
- `GET /api/admin/stats` — High-level metric counters.
- `GET /api/admin/sell-requests` — List sell requests with filters.
- `PUT /api/admin/sell-requests/:id` — Review, approve, reject, and adjust buying/selling price.
- `GET /api/admin/buy-requests` — List student purchase requests.
- `PUT /api/admin/buy-requests/:id` — Update status (`PENDING`, `APPROVED`, `COMPLETED`, `REJECTED`).
- `GET /api/admin/products` — Product catalog with request counts.
- `POST /api/admin/products` — Create new product with buying/selling price and buying toggle.
- `PUT /api/admin/products/:id` — Update product details or toggle `is_buying_enabled` / `is_active`.
- `GET /api/admin/campus-heroes` — List hero applications.
- `PUT /api/admin/campus-heroes/:id` — Approve / reject hero application.
- `POST /api/upload` — Configurable image upload using Multer.

---

## 🧪 Verified Browser Test Run

The full end-to-end user experience was verified using automated browser testing:
1. **Homepage Loaded**: Clean header, `#00A878` brand theme, campus badges, product cards.
2. **Student Flow**: Logged in as Rahul (BPIT), checked dynamic availability, placed buy request for Casio calculator with campus pickup notes, submitted sell request for calculator with ₹550 valuation.
3. **Profile Flow**: Verified locked college `📍 BPIT`, viewed active requests under "My Sell Requests" and "My Buy Requests".
4. **Admin Flow**: Authenticated as Admin, navigated through stats dashboard, reviewed pending sell requests with pricing controls, and viewed live buyer demand.
