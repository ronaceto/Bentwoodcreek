# Bentwood Creek Admin Guide

## Admin Login
1. Visit `/admin`.
2. Enter the admin PIN.
3. Default PIN is `2468` unless overridden by `window.BWC_ADMIN_PIN` in page template.

## Managing Content
- **About, Events, Projects, Resources, Map Lots** are editable in the dashboard as JSON blocks.
- Save each section with its corresponding **Save** button.
- Resident submissions (contacts, subscribers, RSVPs) are visible as counts.

## Data Model
Primary data source: `app-data.json` (seed) copied into browser localStorage key `bwcDataV1` for runtime edits.
