# Database migrations

Run `npm run db:migrate` from the project root. Set `DATABASE_URL` in local `.env` first. Use the Session pooler connection string if your network cannot resolve/reach the direct database host. Keep credentials local.

`001_wallets.sql` creates the storage used by the implemented app:

- `public.wallets`: one wallet per Supabase Auth user. Its JSON data contains categories, targets and all transactions. Person balances and kameti totals are calculated from these entries by `ledger.js`.
- Row-level security: members can read/write only their wallet; administrators can additionally read all wallets.
- The foreign key to existing Supabase `auth.users` deletes a user's wallet when their login is deleted.

Supabase already owns `auth.users`; the app uses its email/password authentication and trusted `app_metadata.role` for admin authorization. It does not need duplicate password, categories, debt or profile tables with its current JSON storage API.

The runner maintains `wallet_internal.migrations` outside the public API schema, locks concurrent migration runs, verifies file checksums, and applies pending migrations in one transaction. Repeat runs skip applied files. Do not change an applied SQL file; add a new numbered migration. No user data is cleared.

`supabase/schema.sql` remains a standalone SQL Editor version of the initial schema. If it was run manually already, migration 001 can still safely apply and establish migration history.
