# My Wallet

Personal finance tracking in PKR, with separate member accounts and an administrator dashboard.

## Run locally

Requires Node.js 22 or newer. Run `npm install` to install the database setup driver. Copy `.env.example` to `.env` and fill in the project configuration, then run:

```sh
npm run dev
```

The terminal prints the local URL. `npm test` runs ledger and access-control tests. `npm run build` creates the static frontend in `dist/`.

## Vercel

Import this repository with Framework preset Other, build command `npm run build`, output `dist`. The `/api/admin` function runs on the server. Configure `SUPABASE_URL`, `SUPABASE_ANON_KEY` (publishable key), and `SUPABASE_SERVICE_ROLE_KEY` in Vercel environment variables. Local `.env` is excluded from Git. `DATABASE_URL` is only needed to apply SQL directly; the app uses Supabase APIs at runtime.

## Money tracking

Add existing cash once as Money in with note Opening balance. Expenses reduce cash; category targets are plans and do not reserve cash. Kameti installments are Expenses and its payout is Money in; remaining is target minus contributions paid. Money lent/borrowed moves cash and updates debt. Opening loan entries record existing debt without changing cash. Loan recovered/repaid settles the named person's debt. Money is stored in integer paisa.

Wallets save to Supabase before the display updates. Refresh before editing after another device makes changes: simultaneous edits are not merged and the last saved wallet wins. Offline edits are not supported. Backup/restore exports and imports a wallet as JSON.

## Admin and member accounts (updated login flow)

The app now opens with a sign-in screen; there is no Cloud login or public create-account button. Each member has a separate wallet. Administrators can open Manage users to create a login, view any user's wallet (read-only), and delete member accounts. Deleting an account permanently deletes its wallet through the database foreign key. Profile lets each user change their password, sign out, or delete their own wallet records.

Deployment setup:

1. Apply the current `supabase/schema.sql` (safe to rerun). It includes the administrator read policy.
2. Create the first account in Supabase Authentication → Users → Add user. Set its administrator role using `supabase/make-admin.sql`, replacing the email placeholder. A database administrator must perform this bootstrap; users cannot grant themselves admin through profile metadata.
3. Set `SUPABASE_SERVICE_ROLE_KEY` in local `.env` and in Vercel's server environment variables. It is used only by `/api/admin`, never included in generated browser config. This is in addition to the public URL and key.
4. Disable public signup in Supabase Authentication settings for an administrator-provisioned application. The admin endpoint can still create accounts.
5. Restart the local server or redeploy after changing environment variables. Sign in as the administrator, then use Manage users → Add user. Share the initial password with that user; they can change it through Profile.

Existing browser backups can be restored after login. Admin viewing does not permit editing another user's wallet. Categories can be deleted with linked transactions moved to another category or deleted explicitly. Deletions that would leave loan repayments without sufficient originating debt are rejected; move the entries instead or remove the related repayments first.

## Remembered login

Keep me signed in stores the authentication session on this device and refreshes it when required. Uncheck it to use tab session storage instead. Signing out clears both stores. The app never stores the password; the password field also supports browser password managers.

Apply the schema directly with `node scripts/setup-database.mjs` after setting DATABASE_URL. If the direct host cannot resolve or requires unavailable IPv6, use the Session pooler connection string from Supabase Connect.

## Separate administrator workspace

Administrators land on a user-management dashboard, create/delete member accounts, and view member wallets read-only. They do not have a personal finance dashboard or wallet write controls. Migration `002_admin_read_only.sql` also denies administrator wallet inserts, updates and deletes at the database layer. Members retain all personal finance tools and cannot manage logins. Existing records are preserved.

## Installable mobile app and browser routes

- `/` shows the install page, with a visible Continue in browser link. Nothing downloads automatically.
- `/web` opens the wallet login/dashboard. The installed PWA starts here too.
- Android/compatible desktop browsers can show a native install prompt when the browser makes one available. iPhone/iPad instructions explain Safari → Share → Add to Home Screen. Actual installation depends on the browser and OS.
- `manifest.webmanifest` includes standalone display and PNG icons; `sw.js` caches only the generic offline page. Authentication, API responses, wallet data and app scripts are never cached by the service worker. Internet is required for transactions.
- Deploy the updated project to Vercel to enable this on your real HTTPS domain. No fixed BASE_URL is required: paths automatically use the current origin. Environment variables remain the same.
- Browser checks: `node tests/pwa.mjs` and `node tests/responsive.mjs` use local Chrome and a running development server on port 3001. Native installation on a physical iPhone/Android device must be checked on the deployed HTTPS site.

## Monthly PDF reports

Use Reports, choose From month and To month (both inclusive), and click View report. Download PDF saves the previewed range directly. Opening/closing cash and outstanding loans use history up to the selected boundaries; only transactions within the range are listed. Cash received/paid includes loan cash movements, while Expenses excludes loan principal. Admins can report on the member wallet they are viewing. PDFs are generated locally with browser-rendered fonts to preserve Unicode names; pages are rasterized, so text is not selectable. Reports do not modify wallet records.
