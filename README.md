# E-Commerce Frontend

A modern, portfolio-worthy e-commerce frontend built with Next.js 14+, Redux Toolkit, shadcn/ui, and TypeScript. This frontend provides full feature parity with the Express backend, including both customer and admin interfaces.

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **UI Components**: shadcn/ui + Tailwind CSS (dark mode support)
- **State Management**: Redux Toolkit (RTK Query for server state, Redux for client state)
- **Forms**: React Hook Form + Zod validation
- **HTTP Client**: Axios with interceptors for token refresh
- **Charts**: Recharts for analytics visualizations
- **Testing**: Vitest + React Testing Library (unit), Playwright (E2E)
- **Code Quality**: Husky (pre-commit hooks), lint-staged, Commitlint
- **Icons**: Lucide React
- **Image Uploads**: Cloudinary SDK
- **Payments**: Razorpay integration
- **Type Safety**: TypeScript strict mode

## Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # Auth layout group
│   │   ├── (customer)/        # Customer layout group
│   │   ├── (admin)/           # Admin layout group
│   │   ├── api/               # API routes (webhook handlers)
│   │   ├── layout.tsx         # Root layout
│   │   └── page.tsx           # Landing page
│   ├── components/
│   │   ├── ui/                # shadcn/ui components
│   │   ├── charts/            # Recharts wrappers
│   │   ├── auth/              # Auth-specific components
│   │   ├── products/          # Product cards, filters
│   │   ├── cart/              # Cart items, summary
│   │   ├── orders/            # Order cards, status badges
│   │   ├── admin/             # Admin-specific components
│   │   └── common/            # Shared components
│   ├── lib/
│   │   ├── api/               # API client setup
│   │   ├── axiosBaseQuery.ts  # Single unified base query for RTK Query
│   │   ├── redux/             # Redux setup
│   │   ├── cloudinary/        # Cloudinary helpers
│   │   ├── validators/        # Zod schemas
│   │   └── utils/             # Utility functions
│   ├── services/
│   │   ├── api/               # RTK Query API slices
│   │   └── razorpay/          # Razorpay integration
│   ├── types/                 # TypeScript types
│   ├── hooks/                 # Custom React hooks
│   └── middleware.ts          # Next.js middleware for auth
├── public/
├── .github/
│   └── workflows/
│       └── ci.yml             # GitHub Actions pipeline
├── .husky/                    # Pre-commit hooks
├── playwright/                # E2E tests
└── package.json
```

## Architecture Decisions

1. **httpOnly cookies over localStorage** — XSS protection for token storage
2. **axiosBaseQuery as single HTTP layer** — no dual Axios/RTK overlap
3. **RTK Query for all server state** — automatic caching and invalidation
4. **Redux only for client state** — auth shape, optimistic cart UI
5. **App Router with layout groups** — clean separation of customer/admin/auth shells
6. **Zod schemas shared** — between form validation and API response parsing
7. **Mobile-first CSS** — no retrofitting responsiveness later

## Local Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables (copy `.env.example` to `.env.local`):
```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
NEXT_PUBLIC_RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3333
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3333](http://localhost:3333) in your browser.

## Available Scripts

- `npm run dev` — Start development server
- `npm run build` — Build for production
- `npm run start` — Start production server
- `npm run lint` — Run ESLint
- `npm run format` — Format code with Prettier
- `npm run format:check` — Check code formatting
- `npm run type-check` — Run TypeScript type checking
- `npm run test:unit` — Run unit tests with Vitest
- `npm run test:e2e` — Run E2E tests with Playwright

## Features

### Customer Features
- Product browsing with search, filters, and sorting
- Product detail pages with reviews
- Shopping cart management
- Multi-step checkout with Razorpay integration
- Order history and tracking
- Wishlist management
- Profile management
- Address management
- Notification preferences

### Admin Features
- Dashboard with analytics (Recharts visualizations)
- Product management (CRUD, stock, images)
- Category management
- Order management (status updates, payment tracking)
- User management (role management)
- Coupon management
- Review moderation

## Testing

- **Unit Tests**: Vitest + React Testing Library for components and hooks
- **E2E Tests**: Playwright for critical user flows (auth, checkout, cart)
- **CI/CD**: GitHub Actions pipeline runs lint, type-check, tests on every PR

## Accessibility & Performance

- Mobile-first responsive design
- WCAG AA compliance (keyboard navigable, ARIA labels, color contrast)
- Lighthouse audit targets (90+ Performance, Accessibility, Best Practices)
- next/image for optimized images
- Lazy loading for below-fold content
- Dark mode support

## Deployment

This frontend is designed to work with the existing Express backend. Configure CORS on the backend to allow the frontend origin.

Recommended deployment: Vercel for easy Next.js deployment.
