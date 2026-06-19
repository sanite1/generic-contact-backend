# Generic Contact Backend

A reusable, **multi-tenant contact-form backend** built with Express, TypeScript and Mongoose. Connect it to any company's website: each submission is stored and triggers two emails: a **notification to the company** and an **auto-reply to the sender** confirming receipt. Branding, recipient address and (optionally) SMTP credentials are configured **per company profile**, so one deployment serves many companies.

## How it works

1. You create a **company profile** (admin, JWT-protected) holding the company name, the email that should receive submissions, branding (logo/colour) and an optional auto-reply message.
2. A website embeds a form that POSTs to `POST /api/contact/:companyId` (public, rate-limited).
3. The backend stores the message, then:
   - emails the company's `contactEmail` (Reply-To set to the sender, so they can reply directly), and
   - sends a branded auto-reply to the sender.
4. **Email transport:** if the company profile has its own SMTP credentials, those are used; otherwise the server's **default SMTP** (`AUTH_EMAIL` / `AUTH_PASS`) is used as a fallback.

## Tech stack

- **Runtime:** Node.js + Express 4 + TypeScript (dev: `nodemon src/index.ts`; prod: `tsc` → `node dist/index.js`)
- **Database:** MongoDB + Mongoose
- **Validation:** `express-validation` (Joi)
- **Email:** Nodemailer + Handlebars templates
- **Auth (admin):** JWT (`jsonwebtoken`)

## Installation

```bash
npm install
cp .env.example .env   # then fill in the values
npm run seed           # create a pre-verified admin user (configurable via SEED_ADMIN_*)
npm run dev            # development (ts-node + nodemon)
# or
npm run build && npm start   # production
```

Required env vars: `MONGODB_URI`, `JWT_SECRET`, `AUTH_EMAIL`, `AUTH_PASS`. See `.env.example` for the full list.

After seeding, log in via `POST /api/users/login` with the seeded credentials to get a JWT for the admin endpoints.

## Access control

- `POST /api/contact/:companyId` is **public** and uses **open CORS** (any company website may submit), protected only by per-IP rate limiting.
- All other `/api/contact/*` routes and **all** `/api/companies` routes require an authenticated user with the **`admin`** role (`Authorization: Bearer <token>`). Non-admin tokens get `403`.
- Admin-bound CORS uses the `CORS_ORIGINS` allowlist.

## API Endpoints

### Health

- `GET /api/health`: liveness probe.

### Contact (public)

- `POST /api/contact/:companyId`: submit a message. Rate-limited to 5/15 min per IP.
  ```json
  {
    "name": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1 555 0100", // optional
    "subject": "Quote request", // optional
    "message": "Hi, I'd like a quote.",
    "metadata": { "company": "Acme", "budget": "$5k" } // optional extra fields
  }
  ```

### Companies (admin, `Authorization: Bearer <token>`)

- `POST /api/companies`: create a company profile.
- `GET /api/companies`: list (paginated; `?page`, `?pageSize`, `?isActive`, `?search`).
- `GET /api/companies/:id`: get one.
- `PATCH /api/companies/:id`: update.
- `DELETE /api/companies/:id`: delete.

Company profile body:

```json
{
  "name": "Acme Inc.",
  "slug": "acme-inc",
  "contactEmail": "hello@acme.com",
  "fromName": "Acme Support", // optional From display name
  "replyToEmail": "support@acme.com", // optional
  "supportEmail": "support@acme.com", // optional, shown in auto-reply
  "autoReplyMessage": "Thanks! We reply within 24h.", // optional
  "branding": {
    "logoUrl": "https://...",
    "primaryColor": "#4f46e5",
    "websiteUrl": "https://acme.com"
  },
  "smtp": {
    "host": "...",
    "port": 465,
    "secure": true,
    "user": "...",
    "pass": "..."
  } // optional; falls back to default SMTP
}
```

> SMTP passwords are stored on the profile but are **never returned** by the API (stripped in `toJSON`).

### Messages (admin, `Authorization: Bearer <token>`)

- `GET /api/contact/:companyId/messages`: list a company's messages (paginated; `?status=new|read|resolved`).
- `GET /api/contact/messages/:id`: get one message.
- `PATCH /api/contact/messages/:id`: update status (`{ "status": "read" }`).

### Users / auth (admin login)

The inherited user feature provides admin accounts and JWT issuance:

- `POST /api/users`: create user.
- `POST /api/users/login`: login → `{ accessToken, refreshToken }`.
- `POST /api/users/refresh`: refresh access token.

## Response envelope

- **Success:** `{ "message": string, "data": T }`
- **Paginated:** `{ "message", "data": T[], "pagination": { page, pageSize, totalItems, totalPages, hasNextPage, hasPrevPage } }`
- **Error:** `{ "error", "status", "message", "fields"? }`

## Project structure

```
src/
  index.ts            # bootstrap: env validation → middleware → routes → error handler
  config/             # db, logger, validateEnv, upload
  errors/             # ApiError, ApiResponse, PaginatedResponse
  helpers/            # sendResponse
  interfaces/         # TS interfaces & DTOs
  models/             # CompanyProfile, ContactMessage, User
  validations/        # express-validation (Joi) factories
  services/           # business logic (+ nodemailer/ mail subsystem & templates)
  controllers/        # request handlers
  routes/             # express routers
  middlewares/        # auth, rate limiter, request logger, global error handler
```
