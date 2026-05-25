# Google Sheets Backend Setup

Sheet:
https://docs.google.com/spreadsheets/d/1ai9SncQwuchov4HyiuDBFnTUirgexUwIWMPnm2WsCPk/edit

## Setup

If **Extensions > Apps Script** gives a Google Drive error, use this standalone path:

1. Go to https://script.google.com/home/projects/create while signed in as `bentwoodcreek1@gmail.com`.
2. Name the project `Bentwood Creek HOA Portal Data API`.
3. Replace the script contents with `google-apps-script/Code.gs`.
4. Change `EXPECTED_TOKEN` to a long random value.
5. Save the project.
6. Click **Deploy > New deployment**.
7. Select **Web app**.
8. Execute as: **Me**.
9. Who has access: **Anyone**.
10. Approve the permissions when Google asks.
11. Copy the Web App URL.

The script uses this Sheet ID directly:
`1ai9SncQwuchov4HyiuDBFnTUirgexUwIWMPnm2WsCPk`

## Netlify Environment Variables

Set these in Netlify project settings:

- `GOOGLE_APPS_SCRIPT_URL`: the deployed Apps Script Web App URL
- `BWC_API_TOKEN`: the exact same token used in `EXPECTED_TOKEN`

After saving environment variables, trigger a new Netlify deploy.

## Data Flow

The browser calls `/api/hoa-data`. The Netlify Function adds the private token and calls Apps Script. Apps Script stores the full app state in `app_state` and mirrors key collections into:

- `residents`
- `requests`
- `documents`
- `audit_logs`
- `directory`
- `map_lots`

Browser `localStorage` is now only a fallback cache when the Sheets backend is unavailable, plus the current login session.
