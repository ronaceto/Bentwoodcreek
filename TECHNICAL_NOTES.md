# Bentwood Creek Resident Portal MVP Technical Notes

## Architecture (Low-cost / Free-tier)
- **Frontend/hosting**: Static HTML/CSS/JS deployable to Netlify or Vercel free tier.
- **Primary datastore/auth source of truth**: Google Sheets tabs (Residents, Announcements, Events, RSVPs, Documents, Requests, Directory, AuditLogs).
- **File storage**: Google Drive folder hierarchy with file IDs tracked in Sheets.
- **Integration layer**: Apps Script Web App or serverless function proxy (Netlify/Vercel) for validated CRUD.
- **Payments (Phase 2)**: Stripe Connect or Braintree/PayPal after fee comparison and board policy decision.

## Phase Plan
### Phase 1 (implemented in this MVP shell)
- Resident registration/login flow with pending admin approval state.
- Role-based portal behavior (`resident`, `admin`).
- Dashboard cards for announcements, events/RSVP, document library, requests.
- Resident request submission workflow with status tracking fields.
- Directory opt-in toggle and public list filtered to active opted-in residents.
- Admin approval workflow and lightweight admin snapshot.
- Audit log capture for auth, approvals, directory changes, and submissions.
- Client-side validation/sanitization for core text/email/password inputs.

### Phase 2
- Replace localStorage persistence with Google Sheets + Apps Script API.
- Google Drive signed/link-safe document access patterns.
- Payment checkout integration and ledger sync.
- Notification automation (email/SMS).

### Phase 3
- Interactive neighborhood map with lot metadata editing pipeline.
- Full admin dashboard with filters, exports, SLA tracking, and moderation.

## Security Notes
- Current MVP is a functional prototype; production launch requires:
  - Server-side auth and password hashing.
  - CSRF/rate-limits and bot protection.
  - Least-privilege service account access to Sheets/Drive.
  - Immutable audit logs persisted server-side.
