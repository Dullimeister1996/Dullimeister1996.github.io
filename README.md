# Schönsaufen — Bier-Routenplaner

React/Leaflet application published at https://www.schoensaufen.at.
Find beer spots within a radius or calculate routes through groups of bars.

## Development

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

## Build and publish

```sh
npm run build
npm run check:build
npm run preview
```

Vite builds into `docs/`. Commit the generated `docs/` changes together with
source changes. The existing GitHub Pages branch deployment can continue serving
`main` → `/docs`; no hosting migration is required. The CI workflow rebuilds
and verifies that the committed output matches the source, including new files.
CI verifies builds; it does not replace the existing Pages deployment mechanism.

`public/CNAME` is the single source for the custom domain and is copied by Vite.
The build works on Windows, macOS and Linux without shell-specific copy commands.

## Project layout

- `src/main.jsx`: map, controls, spot queries and route ranking.
- `src/styles.css`: application styling, including the published mobile layout.
- `public/`: favicon and domain configuration.
- `docs/`: generated GitHub Pages output; do not edit manually.
- `scripts/check-build.mjs`: deployment artifact smoke checks.

## Recovery provenance

The published JavaScript at main commit
`cd12acb92d1fd294f1a82b7032a3bb0972e37c3f` was byte-identical to the build on
`routfinder` commit `b06d6fb7b8b0922fec88172568958b5bc2c96737`.
The editable planner source was restored from that branch. The application CSS
was recovered from the published stylesheet because it includes newer responsive
rules than the branch. Leaflet's CSS remains imported from its package.
Dependencies are pinned to the versions in the original planner lockfile.
The obsolete landing page, sample chart, video and unused toolchains were removed.

## Existing behavior and limitations

This cleanup preserves the published application's behavior. OSRM currently uses
its driving profile; displayed routes and durations are not walking directions.
Map tiles, spot searches and routing need external OpenStreetMap, Overpass and
OSRM services. Routing requests currently have no application timeout or cancel
control. Source recovery does not address those separate functional changes.

## Location and city search

On first load the browser asks for location permission. On success, the location
becomes both the route start and the radius-search center. Permission denial,
unavailable geolocation and timeouts leave manual map and city selection usable.
A city selection resets old results and centers the map; select a destination on
the map for a route, or run the radius search directly. Delayed location callbacks
cannot overwrite a later city selection or manual map interaction.

City searches use Photon (https://photon.komoot.io/) with OpenStreetMap data,
only on explicit submission, a ten-second timeout and session caching. Matching
places include region/country to disambiguate names. Browser coordinates are not
sent to the city geocoder. Photon is a public service without an availability
guarantee; an error leaves manual map selection available.
