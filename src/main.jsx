import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMapEvents,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles.css";

const DEFAULT_CENTER = [48.3069, 14.2858];
const ROUTE_COLORS = [
  "#ef4444",
  "#3b82f6",
  "#22c55e",
  "#a855f7",
  "#f97316",
  "#14b8a6",
  "#eab308",
  "#ec4899",
  "#64748b",
  "#84cc16",
];

const BAR_GROUPS = [
  { label: "1–5 Bars", min: 1, max: 5 },
  { label: "6–10 Bars", min: 6, max: 10 },
  { label: "11–15 Bars", min: 11, max: 15 },
  { label: "16–20 Bars", min: 16, max: 20 },
];

const radiusIcon = createDivIcon("radius-marker", "◎");
const startIcon = createDivIcon("start-marker", "S");
const endIcon = createDivIcon("end-marker", "Z");
const barIcon = createDivIcon("bar-marker", "🍺");
const inactiveBarIcon = createDivIcon("bar-marker inactive", "🍺");

function createDivIcon(className, html) {
  return L.divIcon({
    className,
    html: `<span>${html}</span>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -16],
  });
}

function MapClickHandler({ onMapClick }) {
  useMapEvents({
    click(event) {
      onMapClick(event.latlng);
    },
  });

  return null;
}

function FitMapToData({ activeTab, start, end, routes, bars, radiusCenter, radiusBars, radiusMeters }) {
  const map = useMap();

  React.useEffect(() => {
    const points = [];

    if (activeTab === "routes") {
      if (start) points.push([start.lat, start.lng]);
      if (end) points.push([end.lat, end.lng]);
      for (const route of routes) {
        for (const position of route.positions) points.push(position);
      }
      for (const bar of bars) points.push([bar.lat, bar.lon]);
    } else {
      if (radiusCenter) points.push([radiusCenter.lat, radiusCenter.lng]);
      for (const bar of radiusBars) points.push([bar.lat, bar.lon]);
    }

    if (points.length >= 2) {
      map.fitBounds(points, { padding: [45, 45] });
    } else if (activeTab === "radius" && radiusCenter) {
      map.setView([radiusCenter.lat, radiusCenter.lng], radiusMeters <= 1000 ? 15 : 14);
    }
  }, [map, activeTab, start, end, routes, bars, radiusCenter, radiusBars, radiusMeters]);

  return null;
}

function formatPoint(point) {
  if (!point) return "nicht gesetzt";
  return `${point.lat.toFixed(5)}, ${point.lng.toFixed(5)}`;
}

function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

function haversineMeters(a, b) {
  const earthRadius = 6371000;
  const toRad = (value) => (value * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad((b.lng ?? b.lon) - (a.lng ?? a.lon));
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * earthRadius * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function progressOnLine(point, start, end) {
  const latScale = 111320;
  const lonScale = 111320 * Math.cos(((start.lat + end.lat) / 2) * (Math.PI / 180));

  const px = (point.lon - start.lng) * lonScale;
  const py = (point.lat - start.lat) * latScale;
  const ex = (end.lng - start.lng) * lonScale;
  const ey = (end.lat - start.lat) * latScale;
  const lenSq = ex * ex + ey * ey;

  if (lenSq === 0) return 0;
  return Math.max(0, Math.min(1, (px * ex + py * ey) / lenSq));
}

function pointLineDistanceMeters(point, start, end) {
  const latScale = 111320;
  const lonScale = 111320 * Math.cos(((start.lat + end.lat) / 2) * (Math.PI / 180));

  const px = (point.lon - start.lng) * lonScale;
  const py = (point.lat - start.lat) * latScale;
  const ex = (end.lng - start.lng) * lonScale;
  const ey = (end.lat - start.lat) * latScale;
  const lenSq = ex * ex + ey * ey;

  if (lenSq === 0) return Math.sqrt(px * px + py * py);

  const t = Math.max(0, Math.min(1, (px * ex + py * ey) / lenSq));
  const dx = px - t * ex;
  const dy = py - t * ey;
  return Math.sqrt(dx * dx + dy * dy);
}

function buildBoundingBox(start, end, paddingKm) {
  const latPadding = paddingKm / 111.32;
  const avgLat = ((start.lat + end.lat) / 2) * (Math.PI / 180);
  const lonPadding = paddingKm / (111.32 * Math.cos(avgLat));

  return {
    south: Math.min(start.lat, end.lat) - latPadding,
    west: Math.min(start.lng, end.lng) - lonPadding,
    north: Math.max(start.lat, end.lat) + latPadding,
    east: Math.max(start.lng, end.lng) + lonPadding,
  };
}

const BEER_PLACE_SELECTORS = [
  '["amenity"="bar"]',
  '["amenity"="pub"]',
  '["amenity"="biergarten"]',
  '["craft"="brewery"]',
  '["amenity"="restaurant"]["drink:beer"="yes"]',
  '["amenity"="restaurant"]["brewery"="yes"]',
  '["amenity"="restaurant"]["microbrewery"="yes"]',
];

function buildOverpassBBoxQuery(bbox) {
  const box = `${bbox.south},${bbox.west},${bbox.north},${bbox.east}`;
  const clauses = [];

  for (const selector of BEER_PLACE_SELECTORS) {
    clauses.push(`node${selector}(${box});`);
    clauses.push(`way${selector}(${box});`);
    clauses.push(`relation${selector}(${box});`);
  }

  return `[out:json][timeout:30];(${clauses.join(" ")});out center tags;`;
}

function buildOverpassRadiusQuery(center, radiusMeters) {
  const clauses = [];

  for (const selector of BEER_PLACE_SELECTORS) {
    clauses.push(`node${selector}(around:${radiusMeters},${center.lat},${center.lng});`);
    clauses.push(`way${selector}(around:${radiusMeters},${center.lat},${center.lng});`);
    clauses.push(`relation${selector}(around:${radiusMeters},${center.lat},${center.lng});`);
  }

  return `[out:json][timeout:30];(${clauses.join(" ")});out center tags;`;
}

function getElementCoordinates(element) {
  if (typeof element.lat === "number" && typeof element.lon === "number") {
    return { lat: element.lat, lon: element.lon };
  }
  if (element.center) {
    return { lat: element.center.lat, lon: element.center.lon };
  }
  return null;
}

function getBeerPlaceType(tags = {}) {
  if (tags.amenity === "restaurant") {
    if (tags.microbrewery === "yes") return "Restaurant mit Microbrewery";
    if (tags.brewery === "yes") return "Restaurant mit Brauerei";
    if (tags["drink:beer"] === "yes") return "Restaurant mit Bier-Ausschank";
    return "Restaurant";
  }

  if (tags.amenity === "biergarten") return "Biergarten";
  if (tags.amenity === "pub") return "Pub";
  if (tags.amenity === "bar") return "Bar";
  if (tags.craft === "brewery") return "Brauerei";
  return tags.amenity || tags.craft || "Bier-Spot";
}

function normalizeBar(element, start, end) {
  const coordinates = getElementCoordinates(element);
  if (!coordinates) return null;

  const lat = coordinates.lat;
  const lon = coordinates.lon;
  const distanceFromLine = pointLineDistanceMeters({ lat, lon }, start, end);
  const distanceFromStart = haversineMeters(start, { lat, lon });
  const distanceToEnd = haversineMeters({ lat, lng: lon }, end);
  const progress = progressOnLine({ lat, lon }, start, end);

  return {
    id: `${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: element.tags?.name || "Unbenannter Bier-Spot",
    type: getBeerPlaceType(element.tags),
    lat,
    lon,
    distanceFromLine,
    distanceFromStart,
    distanceToEnd,
    progress,
    website: element.tags?.website || element.tags?.["contact:website"] || "",
  };
}

function normalizeRadiusBar(element, center) {
  const coordinates = getElementCoordinates(element);
  if (!coordinates) return null;

  const lat = coordinates.lat;
  const lon = coordinates.lon;

  return {
    id: `${element.type}-${element.id}`,
    osmType: element.type,
    osmId: element.id,
    name: element.tags?.name || "Unbenannter Bier-Spot",
    type: getBeerPlaceType(element.tags),
    lat,
    lon,
    distanceFromCenter: haversineMeters(center, { lat, lon }),
    website: element.tags?.website || element.tags?.["contact:website"] || "",
    address: [
      element.tags?.["addr:street"],
      element.tags?.["addr:housenumber"],
      element.tags?.["addr:city"],
    ].filter(Boolean).join(" "),
  };
}

function selectCandidateBars(bars, maxBars) {
  return [...bars]
    .sort((a, b) => {
      const byProgress = Math.abs(a.progress - 0.5) - Math.abs(b.progress - 0.5);
      const byLine = a.distanceFromLine - b.distanceFromLine;
      if (Math.abs(byLine) > 250) return byLine;
      return byProgress;
    })
    .slice(0, maxBars)
    .sort((a, b) => a.progress - b.progress);
}

function pickBalancedBars(sortedBars, targetCount, variant) {
  const chosen = [];
  const used = new Set();
  const jitterBase = ((variant % 5) - 2) * 0.025;

  for (let i = 0; i < targetCount; i += 1) {
    const baseProgress = (i + 1) / (targetCount + 1);
    const wave = Math.sin((i + 1) * (variant + 1) * 1.7) * 0.035;
    const targetProgress = Math.max(0.03, Math.min(0.97, baseProgress + jitterBase + wave));

    const candidate = sortedBars
      .filter((bar) => !used.has(bar.id))
      .map((bar) => ({
        bar,
        score:
          Math.abs(bar.progress - targetProgress) * 100000 +
          bar.distanceFromLine * 1.8 +
          (variant % 3) * Math.abs(bar.progress - 0.5) * 500,
      }))
      .sort((a, b) => a.score - b.score)[0]?.bar;

    if (candidate) {
      chosen.push(candidate);
      used.add(candidate.id);
    }
  }

  return chosen.sort((a, b) => a.progress - b.progress);
}

function getSpacingQuality(bars) {
  if (bars.length <= 1) return 1;
  const progressValues = [0, ...bars.map((bar) => bar.progress), 1].sort((a, b) => a - b);
  const gaps = [];

  for (let i = 1; i < progressValues.length; i += 1) {
    gaps.push(progressValues[i] - progressValues[i - 1]);
  }

  const idealGap = 1 / (bars.length + 1);
  const totalDeviation = gaps.reduce((sum, gap) => sum + Math.abs(gap - idealGap), 0);
  return Math.max(0, 1 - totalDeviation / 1.6);
}

function createBalancedRoutePlans(bars, wantedRoutes, group) {
  const sortedBars = [...bars].sort((a, b) => a.progress - b.progress);
  const targetCount = Math.min(group.max, sortedBars.length);
  const minimumCount = Math.min(group.min, sortedBars.length);
  const plans = [];
  const seen = new Set();

  function addPlan(barList, label) {
    if (barList.length < minimumCount) return;
    const ordered = [...barList].sort((a, b) => a.progress - b.progress);
    const key = ordered.map((bar) => bar.id).join("|");
    if (!key || seen.has(key)) return;
    seen.add(key);
    plans.push({ bars: ordered, label, spacingQuality: getSpacingQuality(ordered) });
  }

  for (let variant = 0; variant < 80 && plans.length < wantedRoutes * 4; variant += 1) {
    addPlan(pickBalancedBars(sortedBars, targetCount, variant), `gleichmäßig verteilt ${variant + 1}`);
  }

  for (let count = targetCount - 1; count >= minimumCount && plans.length < wantedRoutes * 5; count -= 1) {
    for (let variant = 0; variant < 20 && plans.length < wantedRoutes * 5; variant += 1) {
      addPlan(pickBalancedBars(sortedBars, count, variant + count * 11), `${count} Bars gleichmäßig`);
    }
  }

  return plans
    .sort((a, b) => {
      const byCount = b.bars.length - a.bars.length;
      if (byCount !== 0) return byCount;
      return b.spacingQuality - a.spacingQuality;
    })
    .slice(0, wantedRoutes * 3);
}

function buildOsrmUrl(start, end, routeBars) {
  const coordinates = [
    `${start.lng},${start.lat}`,
    ...routeBars.map((bar) => `${bar.lon},${bar.lat}`),
    `${end.lng},${end.lat}`,
  ].join(";");

  return `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson&steps=false&continue_straight=false`;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function routeScore(route) {
  return route.barCount * 100000 + route.spacingQuality * 25000 - route.distanceKm * 850 - route.durationMin * 20;
}

function routeSimilarityKey(route) {
  return route.barIds.slice().sort().join("|");
}

function RoutePlannerTab({
  start,
  end,
  routes,
  bars,
  selectedRoute,
  selectedRouteId,
  selectedBarIds,
  bboxPaddingKm,
  barGroupIndex,
  maxCandidateBars,
  loading,
  status,
  onBboxPaddingChange,
  onBarGroupIndexChange,
  onMaxCandidateBarsChange,
  onCalculate,
  onReset,
  onSelectRoute,
}) {
  return (
    <>
      <div className="control-group">
        <label>Start</label>
        <div className="value-box">{formatPoint(start)}</div>
      </div>

      <div className="control-group">
        <label>Ziel</label>
        <div className="value-box">{formatPoint(end)}</div>
      </div>

      <div className="control-group">
        <label>Korridor um Start-Ziel-Bereich: {bboxPaddingKm.toFixed(1)} km</label>
        <input
          type="range"
          min="0.5"
          max="10"
          step="0.5"
          value={bboxPaddingKm}
          onChange={(event) => onBboxPaddingChange(Number(event.target.value))}
        />
        <small>Dieser Wert sucht mögliche Bars im Start-Ziel-Bereich. Die späteren Routen laufen direkt über ausgewählte Bars.</small>
      </div>

      <div className="control-group two-cols">
        <div>
          <label>Bar-Gruppe</label>
          <select value={barGroupIndex} onChange={(event) => onBarGroupIndexChange(Number(event.target.value))}>
            {BAR_GROUPS.map((group, index) => (
              <option key={group.label} value={index}>{group.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Kandidaten</label>
          <select value={maxCandidateBars} onChange={(event) => onMaxCandidateBarsChange(Number(event.target.value))}>
            <option value="25">25</option>
            <option value="35">35</option>
            <option value="45">45</option>
            <option value="60">60</option>
            <option value="80">80</option>
          </select>
        </div>
      </div>

      <button className="primary-button" disabled={loading} onClick={onCalculate}>
        {loading ? "Berechne ..." : "10 Bar-Gruppen-Routen berechnen"}
      </button>
      <button className="secondary-button" disabled={loading} onClick={onReset}>
        Zurücksetzen
      </button>

      <div className="status-box">{status}</div>

      {routes.length > 0 && (
        <div className="routes-list">
          <h2>Top-Routen</h2>
          {routes.map((route, index) => (
            <button
              key={route.id}
              className={`route-card ${selectedRoute?.id === route.id ? "active" : ""}`}
              onClick={() => onSelectRoute(route.id)}
            >
              <div className="route-title">
                <span className="color-dot" style={{ background: ROUTE_COLORS[index % ROUTE_COLORS.length] }} />
                Route {index + 1}
              </div>
              <div className="route-meta">
                {route.barCount} Bars · {route.distanceKm.toFixed(1)} km · {Math.round(route.durationMin)} min · Verteilung {Math.round(route.spacingQuality * 100)}%
              </div>
              <ol>
                {route.bars.map((bar) => (
                  <li key={bar.id}>{bar.name}</li>
                ))}
              </ol>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

function RadiusSearchTab({
  radiusCenter,
  radiusMeters,
  radiusBars,
  radiusLoading,
  radiusStatus,
  onRadiusMetersChange,
  onSearch,
  onReset,
}) {
  return (
    <>
      <div className="control-group">
        <label>Suchpunkt</label>
        <div className="value-box">{formatPoint(radiusCenter)}</div>
        <small>Klicke im Tab „Bier-Spots im Radius“ auf die Karte, um den Mittelpunkt zu setzen.</small>
      </div>

      <div className="control-group">
        <label>Radius: {formatDistance(radiusMeters)}</label>
        <input
          type="range"
          min="250"
          max="5000"
          step="250"
          value={radiusMeters}
          onChange={(event) => onRadiusMetersChange(Number(event.target.value))}
        />
      </div>

      <button className="primary-button" disabled={radiusLoading} onClick={onSearch}>
        {radiusLoading ? "Suche ..." : "Bier-Spots im Radius suchen"}
      </button>
      <button className="secondary-button" disabled={radiusLoading} onClick={onReset}>
        Radius-Suche zurücksetzen
      </button>

      <div className="status-box">{radiusStatus}</div>

      {radiusBars.length > 0 && (
        <div className="bar-list">
          <h2>Bier-Spots im Radius</h2>
          {radiusBars.map((bar, index) => (
            <div key={bar.id} className="bar-card">
              <div className="bar-card-header">
                <strong>{index + 1}. {bar.name}</strong>
                <span>{formatDistance(bar.distanceFromCenter)}</span>
              </div>
              <div className="route-meta">
                {bar.type}{bar.address ? ` · ${bar.address}` : ""}
              </div>
              {bar.website && (
                <a href={bar.website} target="_blank" rel="noreferrer">Website öffnen</a>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState("routes");

  const [start, setStart] = useState(null);
  const [end, setEnd] = useState(null);
  const [routes, setRoutes] = useState([]);
  const [bars, setBars] = useState([]);
  const [selectedRouteId, setSelectedRouteId] = useState(null);
  const [bboxPaddingKm, setBboxPaddingKm] = useState(2);
  const [barGroupIndex, setBarGroupIndex] = useState(1);
  const [maxCandidateBars, setMaxCandidateBars] = useState(45);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("Klick 1 = Start, Klick 2 = Ziel. Danach werden 10 gleichmäßig verteilte Bar-Routen berechnet.");

  const [radiusCenter, setRadiusCenter] = useState(null);
  const [radiusMeters, setRadiusMeters] = useState(1500);
  const [radiusBars, setRadiusBars] = useState([]);
  const [radiusLoading, setRadiusLoading] = useState(false);
  const [radiusStatus, setRadiusStatus] = useState("Klicke auf die Karte, wähle einen Radius und suche alle Bier-Spots in diesem Bereich.");

  const selectedRoute = useMemo(
    () => routes.find((route) => route.id === selectedRouteId) || routes[0] || null,
    [routes, selectedRouteId]
  );

  const selectedBarIds = useMemo(
    () => new Set(selectedRoute?.barIds || []),
    [selectedRoute]
  );

  const selectedGroup = BAR_GROUPS[barGroupIndex];

  function handleMapClick(latlng) {
    if (loading || radiusLoading) return;

    const point = { lat: latlng.lat, lng: latlng.lng };

    if (activeTab === "radius") {
      setRadiusCenter(point);
      setRadiusBars([]);
      setRadiusStatus("Suchpunkt gesetzt. Jetzt Bier-Spots im Radius suchen.");
      return;
    }

    if (!start || end) {
      setStart(point);
      setEnd(null);
      setRoutes([]);
      setBars([]);
      setSelectedRouteId(null);
      setStatus("Start gesetzt. Klicke jetzt auf den Zielpunkt.");
      return;
    }

    setEnd(point);
    setRoutes([]);
    setBars([]);
    setSelectedRouteId(null);
    setStatus("Ziel gesetzt. Jetzt Bar-Routen berechnen.");
  }

  async function calculateBarRoutes() {
    if (!start || !end) {
      setStatus("Bitte zuerst Start und Ziel auf der Karte anklicken.");
      return;
    }

    setLoading(true);
    setRoutes([]);
    setBars([]);
    setSelectedRouteId(null);

    try {
      setStatus("Suche Bars, Pubs, Biergärten, Brauereien und Restaurants mit Bier-Ausschank im Start-Ziel-Korridor ...");
      const bbox = buildBoundingBox(start, end, bboxPaddingKm);
      const overpassQuery = buildOverpassBBoxQuery(bbox);
      const overpassJson = await fetchJson("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: overpassQuery,
      });

      const foundBars = Array.from(
        new Map(
          overpassJson.elements
            .map((element) => normalizeBar(element, start, end))
            .filter(Boolean)
            .map((bar) => [bar.id, bar])
        ).values()
      );

      if (!foundBars.length) {
        throw new Error("Keine Bier-Spots im gewählten Start-Ziel-Bereich gefunden. Erhöhe den Korridor.");
      }

      const candidates = selectCandidateBars(foundBars, maxCandidateBars);
      setBars(candidates);

      if (candidates.length < selectedGroup.min) {
        throw new Error(`Nur ${candidates.length} Bier-Spots gefunden. Für die Gruppe ${selectedGroup.label} bitte Korridor oder Kandidatenanzahl erhöhen.`);
      }

      setStatus(`${foundBars.length} Bier-Spots gefunden. Erzeuge 10 Routen mit ${selectedGroup.label}, möglichst gleichmäßig verteilt ...`);

      const routePlans = createBalancedRoutePlans(candidates, 10, selectedGroup);
      const calculatedRoutes = [];

      for (let i = 0; i < routePlans.length && calculatedRoutes.length < 24; i += 1) {
        const plan = routePlans[i];
        try {
          const routeJson = await fetchJson(buildOsrmUrl(start, end, plan.bars));
          const osrmRoute = routeJson.routes?.[0];
          if (!osrmRoute) continue;

          const route = {
            id: calculatedRoutes.length,
            label: plan.label,
            bars: plan.bars,
            barIds: plan.bars.map((bar) => bar.id),
            barCount: plan.bars.length,
            spacingQuality: plan.spacingQuality,
            distanceKm: osrmRoute.distance / 1000,
            durationMin: osrmRoute.duration / 60,
            positions: osrmRoute.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
          };

          calculatedRoutes.push(route);
          setStatus(`${calculatedRoutes.length} Bar-Route(n) berechnet ...`);
        } catch (error) {
          console.warn("Route konnte nicht berechnet werden", error);
        }
      }

      const uniqueRoutes = Array.from(
        new Map(calculatedRoutes.map((route) => [routeSimilarityKey(route), route])).values()
      )
        .sort((a, b) => routeScore(b) - routeScore(a))
        .slice(0, 10)
        .map((route, index) => ({ ...route, id: index }));

      if (!uniqueRoutes.length) {
        throw new Error("Keine Bar-Routen berechenbar. Versuche eine kleinere Bar-Gruppe oder einen größeren Korridor.");
      }

      setRoutes(uniqueRoutes);
      setSelectedRouteId(uniqueRoutes[0].id);
      setStatus(`${uniqueRoutes.length} Bar-Routen berechnet. Sortierung: viele Bars, gleichmäßige Verteilung, dann kürzere Strecke.`);
    } catch (error) {
      setStatus(error.message || "Unbekannter Fehler bei der Routensuche.");
    } finally {
      setLoading(false);
    }
  }

  async function searchRadiusBars() {
    if (!radiusCenter) {
      setRadiusStatus("Bitte zuerst einen Suchpunkt auf der Karte anklicken.");
      return;
    }

    setRadiusLoading(true);
    setRadiusBars([]);

    try {
      setRadiusStatus(`Suche Bier-Spots im Radius von ${formatDistance(radiusMeters)} ...`);
      const overpassQuery = buildOverpassRadiusQuery(radiusCenter, radiusMeters);
      const overpassJson = await fetchJson("https://overpass-api.de/api/interpreter", {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=UTF-8" },
        body: overpassQuery,
      });

      const foundBars = Array.from(
        new Map(
          overpassJson.elements
            .map((element) => normalizeRadiusBar(element, radiusCenter))
            .filter(Boolean)
            .map((bar) => [bar.id, bar])
        ).values()
      )
        .sort((a, b) => a.distanceFromCenter - b.distanceFromCenter);

      setRadiusBars(foundBars);
      setRadiusStatus(`${foundBars.length} Bier-Spots im Radius von ${formatDistance(radiusMeters)} gefunden.`);
    } catch (error) {
      setRadiusStatus(error.message || "Unbekannter Fehler bei der Radius-Suche.");
    } finally {
      setRadiusLoading(false);
    }
  }

  function resetRoutes() {
    setStart(null);
    setEnd(null);
    setRoutes([]);
    setBars([]);
    setSelectedRouteId(null);
    setStatus("Klick 1 = Start, Klick 2 = Ziel. Danach werden 10 gleichmäßig verteilte Bar-Routen berechnet.");
  }

  function resetRadius() {
    setRadiusCenter(null);
    setRadiusBars([]);
    setRadiusStatus("Klicke auf die Karte, wähle einen Radius und suche alle Bier-Spots in diesem Bereich.");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">🍺</div>
          <div>
            <h1>Bier-Routenplaner</h1>
            <p>Routen über Bar-Gruppen oder freie Radius-Suche rund um einen Punkt.</p>
          </div>
        </div>

        <div className="tabs">
          <button className={activeTab === "routes" ? "active" : ""} onClick={() => setActiveTab("routes")}>
            Bar-Routen
          </button>
          <button className={activeTab === "radius" ? "active" : ""} onClick={() => setActiveTab("radius")}>
            Bier-Spots im Radius
          </button>
        </div>

        {activeTab === "routes" ? (
          <RoutePlannerTab
            start={start}
            end={end}
            routes={routes}
            bars={bars}
            selectedRoute={selectedRoute}
            selectedRouteId={selectedRouteId}
            selectedBarIds={selectedBarIds}
            bboxPaddingKm={bboxPaddingKm}
            barGroupIndex={barGroupIndex}
            maxCandidateBars={maxCandidateBars}
            loading={loading}
            status={status}
            onBboxPaddingChange={setBboxPaddingKm}
            onBarGroupIndexChange={setBarGroupIndex}
            onMaxCandidateBarsChange={setMaxCandidateBars}
            onCalculate={calculateBarRoutes}
            onReset={resetRoutes}
            onSelectRoute={setSelectedRouteId}
          />
        ) : (
          <RadiusSearchTab
            radiusCenter={radiusCenter}
            radiusMeters={radiusMeters}
            radiusBars={radiusBars}
            radiusLoading={radiusLoading}
            radiusStatus={radiusStatus}
            onRadiusMetersChange={setRadiusMeters}
            onSearch={searchRadiusBars}
            onReset={resetRadius}
          />
        )}
      </aside>

      <main className="map-panel">
        <MapContainer center={DEFAULT_CENTER} zoom={13} className="map">
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapClickHandler onMapClick={handleMapClick} />
          <FitMapToData
            activeTab={activeTab}
            start={start}
            end={end}
            routes={routes}
            bars={bars}
            radiusCenter={radiusCenter}
            radiusBars={radiusBars}
            radiusMeters={radiusMeters}
          />

          {activeTab === "routes" && start && (
            <Marker position={[start.lat, start.lng]} icon={startIcon}>
              <Popup>Start</Popup>
            </Marker>
          )}

          {activeTab === "routes" && end && (
            <Marker position={[end.lat, end.lng]} icon={endIcon}>
              <Popup>Ziel</Popup>
            </Marker>
          )}

          {activeTab === "routes" && routes.map((route, index) => (
            <Polyline
              key={route.id}
              positions={route.positions}
              pathOptions={{
                color: ROUTE_COLORS[index % ROUTE_COLORS.length],
                weight: selectedRoute?.id === route.id ? 8 : 4,
                opacity: selectedRoute?.id === route.id ? 0.95 : 0.35,
              }}
              eventHandlers={{ click: () => setSelectedRouteId(route.id) }}
            >
              <Popup>
                Route {index + 1}<br />
                {route.barCount} Bars<br />
                Verteilung: {Math.round(route.spacingQuality * 100)}%<br />
                {route.distanceKm.toFixed(1)} km · {Math.round(route.durationMin)} min
              </Popup>
            </Polyline>
          ))}

          {activeTab === "routes" && bars.map((bar) => (
            <Marker
              key={bar.id}
              position={[bar.lat, bar.lon]}
              icon={selectedBarIds.has(bar.id) ? barIcon : inactiveBarIcon}
              opacity={selectedBarIds.has(bar.id) ? 1 : 0.5}
            >
              <Popup>
                <strong>{bar.name}</strong>
                <br />
                Typ: {bar.type}
                <br />
                Position auf Strecke: {Math.round(bar.progress * 100)}%
                <br />
                Abstand Luftlinie: {Math.round(bar.distanceFromLine)} m
                {bar.website && (
                  <>
                    <br />
                    <a href={bar.website} target="_blank" rel="noreferrer">Website</a>
                  </>
                )}
              </Popup>
            </Marker>
          ))}

          {activeTab === "radius" && radiusCenter && (
            <>
              <Marker position={[radiusCenter.lat, radiusCenter.lng]} icon={radiusIcon}>
                <Popup>Suchpunkt</Popup>
              </Marker>
              <Circle
                center={[radiusCenter.lat, radiusCenter.lng]}
                radius={radiusMeters}
                pathOptions={{ color: "#2563eb", fillColor: "#93c5fd", fillOpacity: 0.16, weight: 2 }}
              />
            </>
          )}

          {activeTab === "radius" && radiusBars.map((bar) => (
            <Marker key={bar.id} position={[bar.lat, bar.lon]} icon={barIcon}>
              <Popup>
                <strong>{bar.name}</strong>
                <br />
                Typ: {bar.type}
                <br />
                Entfernung: {formatDistance(bar.distanceFromCenter)}
                {bar.address && (
                  <>
                    <br />
                    {bar.address}
                  </>
                )}
                {bar.website && (
                  <>
                    <br />
                    <a href={bar.website} target="_blank" rel="noreferrer">Website</a>
                  </>
                )}
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </main>
    </div>
  );
}

createRoot(document.getElementById("root")).render(<App />);
