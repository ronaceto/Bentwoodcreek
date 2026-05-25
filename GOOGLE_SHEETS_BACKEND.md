# Google Sheets Backend Setup

Sheet:
https://docs.google.com/spreadsheets/d/1ai9SncQwuchov4HyiuDBFnTUirgexUwIWMPnm2WsCPk/edit

## Setup

1. Open the Sheet while signed in as `bentwoodcreek1@gmail.com`.
2. Go to **Extensions > Apps Script**.
3. Replace the script contents with `google-apps-script/Code.gs`.
4. Change `EXPECTED_TOKEN` to a long random value.
5. Click **Deploy > New deployment**.
6. Select **Web app**.
7. Execute as: **Me**.
8. Who has access: **Anyone**.
9. Copy the Web App URL.

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
