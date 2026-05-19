# Resident Portal Specification for Bentwood Creek HOA Website

## 1. Introduction and Objectives

The goal of the Resident Portal is to provide a secure, user-friendly interface for homeowners to interact with the HOA online. It will enhance communication, streamline administrative tasks, and foster community engagement by centralizing information, services, and collaboration tools.

This specification defines the functional and technical requirements the engineering team should follow to build the portal.

### 1.1 Scope

The Resident Portal will be an authenticated area of the HOA website accessible only to verified homeowners. It will integrate with existing HOA content (events, projects, resources) and introduce new capabilities, including account management, document access, online payments, requests, and community interaction.

## 2. User Roles and Permissions

The portal must support distinct roles with granular, configurable permissions:

- **Resident/User**: Homeowners with accounts. They can view personal information, HOA documents, the community calendar, pay dues, submit requests, and participate in discussions.
- **Board Member/Admin**: Authorized administrators (board members, committee chairs, or property manager). They can manage portal content, approve residents, moderate discussions, and respond to requests.
- **System Administrator**: Technical personnel with full access to portal settings, user management, and configuration (often outside the HOA board).

Role management must support adding or removing privileges without code changes.

## 3. Functional Requirements

### 3.1 Authentication and User Management

#### Registration

- Residents sign up using email address and a strong password.
- Implement email verification to ensure only valid residents gain access.
- Optionally require admin approval (e.g., property manager verifies property ownership before account activation).
- Allow the system administrator to invite users via email.

#### Login

- Support secure login with username/email and password.
- Use HTTPS and store passwords hashed and salted.
- Include password recovery (email reset link with expiration).
- Consider two-factor authentication (2FA) for additional security.

#### Profile Management

Residents can view and edit:

- Name
- Phone
- Email
- Mailing address
- Emergency contacts
- Communication preferences (email/SMS opt-in)

Optional: allow profile photo upload.

#### Account Status

Provide account status indicators:

- Active
- Pending approval
- Suspended

Admins can deactivate accounts if residents move away.

### 3.2 Dashboard and Home Page

Upon login, residents should see a personalized dashboard with:

- **Announcements & News**: Latest HOA announcements, meeting minutes, and board messages (admin-managed).
- **Upcoming Events**: Upcoming events and neighborhood projects from the events module. Residents can RSVP, volunteer, or add events to personal calendars.
- **Personal Dues Summary**: Current balance, upcoming assessments, and payment history, plus quick link to pay dues.
- **Quick Links**: Shortcuts to key features (documents, forms, contact board members, directory, forum).

### 3.3 Calendar and Events

#### Community Calendar

- Monthly and weekly views.
- Color coding by category (social events, board meetings, project milestones).
- Category filters.
- Add-to-calendar links (iCal/Google Calendar).

#### RSVPs and Sign-ups

- RSVP options: Yes / Maybe / No.
- Number of attendees.
- Volunteer slots (e.g., potluck contributions, setup/cleanup crews).
- Admin-defined volunteer slot limits.
- Residents can modify or cancel RSVP.

Optional: event-level discussion threads moderated by admins.

### 3.4 Payments and Financials

#### Online Dues Payments

- Integrate a payment gateway supporting multiple methods with low fees.
- Must support:
  - Credit/debit cards
  - ACH/bank transfer
  - Venmo
  - Apple Pay
- Residents can view invoice details and pay full or partial amounts.
- Support recurring payments (monthly/quarterly) with user consent.
- Display payment history with dates, amounts, and transaction IDs.

#### Secure Handling

- Use PCI-compliant processors.
- Do **not** store credit card details on HOA servers.
- Send payment confirmation emails and update resident account balance.

### 3.5 Document Library

The HOA prefers a low-cost file storage approach.

#### Centralized Repository

- Provide a document library where admins upload and categorize PDFs:
  - Bylaws
  - Covenants
  - Minutes
  - Budget reports
  - Architectural guidelines
  - Forms
- Use Google Drive as storage backend.
- Upload files to a dedicated Drive folder.
- Store Drive file ID and metadata in portal database:
  - Name
  - Category
  - Upload date
  - Permissions
- Generate secure links (or use Drive sharing) for resident preview/download.
- Allow resident search, filtering, and download without exposing Drive folder structure.

#### Version Control

- Track versions via version numbers or timestamps.
- Optionally keep prior versions in an **Archive** subfolder in Google Drive.
- Allow admins to mark documents as obsolete/archived to hide from default listing while preserving access.

### 3.6 Directory and Interactive Map

#### Resident Directory (Opt-in)

- Residents can opt into listing.
- Directory fields may include name, address, phone, email, household info.
- Residents control field-level visibility.
- Search and sort by name, address, street.

#### Interactive Map

- Use Leaflet or Mapbox with lot markers.
- Marker details (if opted in): resident names, address, selected details.
- Include directions and neighborhood boundary outlines.
- Admins can update markers/addresses; residents cannot edit map data.

### 3.7 Requests and Work Orders

#### Architectural Change Requests

- Online form for architecture/landscaping modifications.
- Fields include:
  - Description
  - Plan/photo upload
  - Requested start date
- System generates case number and notifies committee.
- Resident can track status:
  - Submitted
  - Under review
  - Approved
  - Declined
- Email status updates.

#### Maintenance or Complaint Requests

- Form for issues such as common area maintenance, nuisances, rule violations.
- Admin can categorize, assign, and respond.

#### Approval Workflow

- Admin/committee members can view all requests, comment, set status, and attach documents.
- Residents see updates in portal and via email notifications.

### 3.8 Discussion Forum / Community Board (Optional)

- Categories:
  - General Discussion
  - Buy/Sell/Trade
  - Lost & Found
  - Recommendations
- Residents can create topics, reply, and like posts.
- Include search and moderation tools.
- Admins/board members can edit/remove posts and ban abusive users.

### 3.9 Notifications and Communication

#### Email/SMS Notifications

Automated notifications for:

- Registration confirmation
- Password reset
- Payment receipts
- Event RSVP confirmations
- Request status changes
- Important HOA announcements

Residents choose channels (email/SMS).

Recommended integrations:

- Email: SendGrid or AWS SES/Postmark
- SMS: Twilio or Nexmo

#### In-Portal Notifications

- Notification bell or dashboard feed for recent messages, request changes, and reminders.
- Mark read/unread.

### 3.10 Mobile Responsiveness

- Fully responsive across mobile devices.
- Use modern frontend framework (React, Vue, Angular) or responsive framework (Tailwind, Bootstrap).
- Consider PWA support for app-like UX, offline capabilities, and push notifications.

### 3.11 Accessibility

- Meet WCAG 2.1 AA.
- Include:
  - Alt text for images
  - Keyboard navigation
  - Screen-reader compatibility
  - Adequate color contrast
  - Accessible text sizing
  - “Skip to main content” links
  - Appropriate ARIA labels

### 3.12 Logging and Auditing

- Record user actions with timestamps and user IDs:
  - Login
  - Payments
  - Form submissions
  - Document downloads
- Provide an audit log accessible to system administrators.

## 4. Non-Functional Requirements

- **Security**: HTTPS everywhere, input sanitization, SQL injection/XSS protections, dependency patching, vulnerability scanning.
- **Performance**: Typical page loads under 2 seconds on broadband; use caching/CDN/lazy loading.
- **Scalability**: Support additional modules and user growth using scalable services/serverless patterns.
- **Maintainability**: Modular codebase, Git-based version control, coding standards, documented APIs/components.
- **Data Privacy**: Comply with applicable laws (e.g., GDPR/CCPA where relevant), collect minimum necessary data, maintain clear privacy policy.
- **Disaster Recovery**: Automated backups for database and file storage; tested restore procedures.

## 5. Technical Architecture Suggestions

### Backend

Use a modern framework, such as:

- Node.js (Express/NestJS)
- Python (Django/Flask)
- Ruby on Rails

Use relational storage (PostgreSQL/MySQL) for core data with ORM. Consider NoSQL (MongoDB/DynamoDB) for unstructured forum-like content.

### Authentication

- JWT or session-based auth.
- Example libraries:
  - Passport.js (Node)
  - Devise (Rails)
- 2FA integrations: Google Authenticator or Authy.

### Frontend

- Component framework: React, Vue, or Angular.
- UI framework: Material UI, Vuetify, Tailwind.
- State management: Redux/Vuex for complex interactions.

### File Storage

- Use Google Drive API as primary storage for documents and uploaded images.
- Upload to designated Drive folder and store file ID + metadata in DB.
- Generate secure authenticated links for preview/download.
- Serve small static assets (profile pictures/icons) from server or CDN.

### Database

Prefer cost-effective services with free tiers; evaluate fit for expected workload:

- Firebase Firestore (NoSQL)
- Supabase (PostgreSQL)
- Google Sheets API (small/simple datasets only)

### Payment Integration

Use processors with multi-wallet support and no monthly platform fee. Stripe and PayPal/Braintree can support:

- Cards
- ACH/bank transfer
- Venmo
- Apple Pay

Use webhooks for real-time payment status updates. Ensure payment data is sent directly to provider for PCI compliance.

### Map Integration

- Mapbox GL JS or Leaflet.
- Geocoding via Mapbox Geocoding API or Google Geocoding API (watch limits/fees).

### Notification Services

- Email: SendGrid / Postmark / AWS SES
- SMS: Twilio / Nexmo

### Hosting and Deployment

- Host backend on AWS, Azure, GCP, or serverless platforms.
- Use CI/CD (GitHub Actions, GitLab CI) for testing and deployment.
- Use CDN for static assets.

## 6. Project Planning and Milestones

- **Requirements Refinement (2 weeks)**: Review and prioritize features with HOA board; define MVP.
- **Design Phase (3 weeks)**: Wireframes, high-fidelity UI, schema and API contract, design review.
- **Development Phase (8–12 weeks)**:
  - Sprint 1: Authentication, registration, profile management, DB/API foundation.
  - Sprint 2: Dashboard, calendar, RSVPs, document library.
  - Sprint 3: Payments, directory, interactive map.
  - Sprint 4: Requests/work orders, optional forum.
  - Sprint 5: Notifications, admin tools, accessibility, mobile responsiveness.
- **Testing & QA (3 weeks)**: Unit, integration, security/penetration, and pilot user acceptance testing.
- **Deployment & Training (1 week)**: Production release, initial data migration, admin/resident training, support docs.
- **Maintenance & Iteration (ongoing)**: Monitor usage, collect feedback, quarterly updates, security patches.

## 7. Conclusion

A comprehensive Resident Portal will significantly improve Bentwood Creek HOA operations and resident experience by centralizing communications, financial workflows, documents, and collaboration in a secure and scalable platform.

This specification provides an implementation roadmap while leaving room for phased delivery and iterative improvements based on board and resident feedback.
