# Technical Notes

- Dynamic modules are powered by `assets/hoa-app.js` and `app-data.json`.
- Pages `upcoming-events`, `neighborhood-projects`, `neighborhood-map`, and `contacts` load the centralized data via `BWC.getData()`.
- Event list sorts by event datetime; projects sort by status order.
- Map uses Leaflet with OpenStreetMap tiles and markers generated from `mapLots` JSON coordinates.
- Admin route `/admin` gates dashboard rendering behind PIN validation.
