# Deploying Tena to Vercel

Tena builds with Nitro's `vercel` preset (`vite.config.ts`), so Vercel only
needs to run `npm run build` (see `vercel.json`). The build also applies any
new `migrations/*.sql` to the database in `DATABASE_URL`.

## 1. Put the code on GitHub
Vercel deploys from a Git repository. `.gitignore` already keeps `.env`,
`node_modules` and build output out of it.

```sh
git init && git add -A && git commit -m "Tena"
# create an empty repo on github.com, then:
git remote add origin https://github.com/<you>/tena-app.git
git push -u origin main
```

## 2. Import the project in Vercel
vercel.com → Add New… → Project → import the repo. Leave Framework Preset as
**Other**; the build and install commands come from `vercel.json`.

## 3. Environment variables (Project → Settings → Environment Variables)
Use `.env.example` as the checklist. Required for production:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase **Transaction pooler** string (port **6543**), password URL-encoded (`@` → `%40`), ending `?sslmode=require&uselibpqcompat=true` |
| `BETTER_AUTH_SECRET` | New random value: `openssl rand -hex 32`. Don't reuse your local one |
| `BETTER_AUTH_URL` | Your public address, e.g. `https://tena-app.vercel.app` or `https://tena.co.ke` (no trailing slash) |
| `TENA_ADMIN_EMAILS` | Owner admin emails, comma-separated |
| `TENA_BILLING_MODE` | `manual` |
| `TENA_MPESA_PAY_TO` | e.g. `Till 123456` |
| `RESEND_API_KEY`, `EMAIL_FROM` | From resend.com (needed for password resets and admin invites) |

Optional: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `VITE_GOOGLE_AUTH_ENABLED=true`
(redirect URI `<BETTER_AUTH_URL>/api/auth/callback/google`), `VITE_GROK_EXTENSIONS=0`.

If the site answers on more than one address (e.g. `tena.co.ke` and
`www.tena.co.ke`), list the extras in `TENA_TRUSTED_ORIGINS`, comma-separated.

Then **Deploy**. After the first deploy, if you change `BETTER_AUTH_URL` or add a
custom domain, redeploy so sign-in uses the new address.

## 4. After it's live
1. Open `<your address>/login`, create the account for an email in
   `TENA_ADMIN_EMAILS`, then go to `/ops` → **Open Tena HQ**.
2. Invite other admins from **Team**. They get an email (with Resend set up),
   or use **Copy link** and send it yourself.

## Notes
- Nothing needs configuring in Supabase's Auth settings (redirect URLs, email
  templates). Tena's sign-in runs inside the app, not on Supabase Auth.
- Supabase's REST API is locked for Tena's tables (row-level security, see
  `migrations/0005_supabase_rls.sql`); new tables must enable RLS too.

## Troubleshooting
- **"Invalid origin" when signing in:** the address in the browser isn't one
  Tena trusts. Check `BETTER_AUTH_URL` is the exact address you open (with
  `https://`), not `http://localhost:8080` copied from your local `.env`. Add
  any other address you use to `TENA_TRUSTED_ORIGINS`, then redeploy;
  environment variable changes only apply to new deployments.
- **"Invalid email or password" with an account that works locally:** the
  deployment's `DATABASE_URL` points to a different database than your local
  `.env`.
