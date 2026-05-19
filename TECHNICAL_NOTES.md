# Bentwood Creek Resident Portal MVP Technical Notes (Rework)

## Low-cost Architecture
- **Hosting**: Netlify or Vercel free tier static hosting.
- **Data/Auth target**: Google Sheets + Apps Script API endpoints.
- **Document storage**: Google Drive folders, storing file IDs + metadata in Sheets.
- **Current MVP**: Front-end prototype with localStorage persistence for rapid iteration.

## Phase 1 Scope (MVP)
Implemented in current rework:
- Authenticated sign-in and registration request flow.
- Admin approval/suspension workflow for residents.
- Resident dashboard with announcements, events/RSVP, documents, and requests.
- Resident directory opt-in behavior.
- Admin announcement publishing from portal.
- Audit logging for key actions.
- Input sanitization and validation.
- Role-based action gating in shared client services.

## Payment Support Planning (Phase 2)
Evaluate providers before go-live:
- **Stripe**: cards + Apple Pay + ACH; no native Venmo.
- **Braintree/PayPal**: cards + PayPal + Venmo; Apple Pay support depends on setup.
- Decision criteria:
  - Effective transaction cost for HOA dues size.
  - Wallet support coverage (Venmo + Apple Pay priority).
  - Dispute workflow simplicity for volunteer admins.
  - Reconciliation exports to accounting workflows.

## Security Hardening Before Production
Required prior to launch:
- Move auth and all writes to server-side endpoints (Apps Script/serverless).
- Replace client-trusted roles with backend-verified session/claims.
- Keep salted password hashes server-side only.
- Add CSRF protections, rate limiting, and abuse controls.
- Persist immutable audit logs server-side.
