# GTM Frontend

Frontend for the GTM (Go To Market) Account Mapper application, built with [Next.js](https://nextjs.org/) and [React](https://react.dev/).

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4, Framer Motion
- **Data Fetching**: Axios, TanStack React Query
- **File Upload**: react-dropzone
- **Notifications**: react-hot-toast
- **Language**: TypeScript

## Prerequisites

- **Node.js** >= 18
- **npm** >= 9
- The **backend** server must be running (see [backend README](../backend/README.md))

## Getting Started

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Copy the example env file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` if the backend runs on a different URL:

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

| Variable               | Description                  | Default                    |
|------------------------|------------------------------|----------------------------|
| `NEXT_PUBLIC_API_URL`  | Backend API base URL         | `http://localhost:3001`    |

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:3000**.

## Available Scripts

| Script           | Description                         |
|------------------|-------------------------------------|
| `npm run dev`    | Start dev server with hot reload    |
| `npm run build`  | Create production build             |
| `npm run start`  | Start production server             |
| `npm run lint`   | Run ESLint                          |

## Project Structure

```
frontend/
├── public/                        # Static assets
├── src/
│   ├── app/                       # Next.js App Router pages
│   │   ├── page.tsx               # Landing page
│   │   ├── layout.tsx             # Root layout (providers, fonts)
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx     # Login page
│   │   │   └── signup/page.tsx    # Signup page
│   │   └── dashboard/
│   │       ├── page.tsx           # Dashboard home
│   │       ├── upload/page.tsx    # Upload account lists
│   │       ├── connections/page.tsx # Manage connections
│   │       ├── matches/page.tsx   # View matched accounts
│   │       └── lists/[id]/page.tsx # Account list detail
│   ├── components/
│   │   └── ui/                    # Reusable UI components (Button, Card, Input)
│   ├── contexts/
│   │   └── AuthContext.tsx        # Auth state provider (login, signup, logout)
│   ├── features/
│   │   ├── auth/                  # Auth API calls & types
│   │   ├── accountLists/          # Account list API calls & types
│   │   ├── connections/           # Connection API calls & types
│   │   └── matching/              # Matching API calls & types
│   └── lib/
│       ├── axios.ts               # Axios instance with auth interceptor
│       └── health/                # Health check API
├── .env.local.example             # Environment template
├── next.config.ts                 # Next.js configuration
├── tsconfig.json                  # TypeScript configuration
├── postcss.config.mjs             # PostCSS (Tailwind) configuration
└── package.json
```

## Pages Overview

| Route                     | Description                                      |
|---------------------------|--------------------------------------------------|
| `/`                       | Landing page (redirects to dashboard if logged in)|
| `/login`                  | User login                                       |
| `/signup`                 | User registration                                |
| `/dashboard`              | Dashboard with stats and quick actions           |
| `/dashboard/upload`       | Upload CSV/Excel account lists                   |
| `/dashboard/connections`  | Manage connection requests                       |
| `/dashboard/matches`      | View matched accounts across connections         |
| `/dashboard/lists/[id]`   | View and edit a specific account list            |

## How Authentication Works

1. User signs up or logs in via `/signup` or `/login`.
2. The backend returns a JWT token and user object.
3. Token and user data are stored in `localStorage`.
4. The Axios interceptor automatically attaches the token to every API request.
5. On a `401` response, the user is logged out and redirected to `/login`.

## Troubleshooting

- **API calls failing**: Make sure the backend is running on `http://localhost:3001` (or the URL set in `NEXT_PUBLIC_API_URL`).
- **CORS errors**: The backend only allows requests from `localhost:3000` and `127.0.0.1:3000`. Ensure the frontend runs on port 3000.
- **Blank page after login**: Clear `localStorage` and try again — stale tokens can cause issues.
