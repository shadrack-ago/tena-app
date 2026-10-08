# Tena: accounts & keys checklist

Put each value in Vercel → Settings → Environment Variables (and in `.env` for local runs), then redeploy.

## Already done
| Account | Gives you |
|---|---|
| **GitHub** | Code hosting |
| **Vercel** | Hosting |
| **Supabase** | `DATABASE_URL` (Connect → Transaction pooler, port 6543) |

## To create
| # | Account | Link | Gives you | Needed for |
|---|---|---|---|---|
| 1 | **Domain** (e.g. `tena.co.ke`) | Any .co.ke registrar (Truehost, HostPinnacle…) or Namecheap | Your web address, plus a domain to send email from | Professional URL; Resend needs it |
| 2 | **Resend** | resend.com | `RESEND_API_KEY`, `EMAIL_FROM` (e.g. `Tena <no-reply@tena.co.ke>`) | Password resets, admin invites. Verify your domain in Resend first |
| 3 | **Anthropic (Claude)** | console.anthropic.com | `ANTHROPIC_API_KEY` | AI follow-up drafts, coach. ⚠️ The app still calls xAI (`XAI_API_KEY`) until the switch to Claude is done; until then it uses built-in templates |
| 4 | **M-Pesa Till or Paybill** | Safaricom (M-Pesa for Business) | `TENA_MPESA_PAY_TO` (e.g. `Till 123456`) | Shops paying for Tena |
| 5 | **Google Cloud** *(optional)* | console.cloud.google.com → APIs & Services → Credentials → OAuth client | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, then set `VITE_GOOGLE_AUTH_ENABLED=true` | "Continue with Google". Redirect URI: `<your URL>/api/auth/callback/google` |
| 6 | **Safaricom Daraja** *(later)* | developer.safaricom.co.ke | Consumer key/secret, passkey | Automatic M-Pesa (STK push). Paused for now |
| 7 | **Qwen / Alibaba Cloud** *(later)* | modelstudio.console.alibabacloud.com | API key | Optional second AI model |

## No account needed (you set these yourself)
| Variable | Value |
|---|---|
| `BETTER_AUTH_SECRET` | Run `openssl rand -hex 32` (use a different one on Vercel and locally) |
| `BETTER_AUTH_URL` | Your live address, e.g. `https://tena.co.ke` |
| `TENA_ADMIN_EMAILS` | Your admin email(s), comma-separated |
| `TENA_BILLING_MODE` | `manual` |
| `TENA_TRUSTED_ORIGINS` | Extra addresses only, e.g. `https://www.tena.co.ke` |

## Don't add to Vercel
`SUPABASE_URL`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` and `SUPABASE_SERVICE_ROLE_KEY` aren't used by the app. Keep the service-role key out of Vercel especially: it bypasses all database protections.
