# Design Harmony

Premium full-stack interior design website and operations portal for Design Harmony, Hyderabad.

## Run locally

```bash
pnpm install
pnpm dev
```

- Website: `http://127.0.0.1:5173`
- API: `http://127.0.0.1:4000`
- Local JSON data: `server/data/db.json` (created automatically)

## Demo accounts

- Admin: `admin@designharmony.com` / `admin123`
- Staff: `staff@designharmony.com` / `staff123`
- Customer: `customer@designharmony.com` / `customer123`

## Included

Responsive public website, interactive Three.js room preview, consultation/contact forms, role-based authentication, admin/staff/customer dashboards, local persistence, project and booking updates, uploads, payments, notifications, testimonials, and invoice download.

For production, set `JWT_SECRET`, replace the JSON store with MongoDB or Supabase, and connect `/api/upload` to Cloudinary or Supabase Storage.
