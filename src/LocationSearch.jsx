import { useEffect, useRef, useState } from "react";

// Explicit searches only; cache repeated queries for this session.
const cityCache = new Map();
export default function LocationSearch({
  onSelect,
  disabled,
  interactionVersion,
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const request = useRef(0);
  const controller = useRef(null);
  const select = useRef(onSelect);
  select.current = onSelect;

  function locate() {
    const id = ++request.current;
    controller.current?.abort();
    setResults([]);
    if (!navigator.geolocation) {
      setMessage("Standort nicht verfügbar. Bitte eine Stadt eingeben.");
      return;
    }
    setBusy(true);
    setMessage("Browserstandort wird ermittelt …");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        if (request.current !== id) return;
        setBusy(false);
        setQuery("");
        setMessage(
          "Browserstandort übernommen. Du kannst auch eine Stadt wählen.",
        );
        select.current(
          { lat: coords.latitude, lng: coords.longitude },
          "Browserstandort",
        );
      },
      (error) => {
        if (request.current !== id) return;
        setBusy(false);
        setMessage(
          error.code === 1
            ? "Standortfreigabe abgelehnt. Bitte eine Stadt eingeben."
            : "Standort konnte nicht ermittelt werden. Bitte eine Stadt eingeben.",
        );
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  // A manual map action or running spot search wins over a delayed location result.
  useEffect(() => {
    ++request.current;
    controller.current?.abort();
    setBusy(false);
    setResults([]);
    setMessage("");
  }, [interactionVersion, disabled]);

  useEffect(() => {
    locate();
    return () => {
      ++request.current;
      controller.current?.abort();
    };
  }, []);

  async function search(event) {
    event.preventDefault();
    const term = query.trim();
    if (disabled || term.length < 2) return;
    const id = ++request.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    const timer = setTimeout(() => abort.abort(), 10000);
    setBusy(true);
    setResults([]);
    setMessage("Städte werden gesucht …");
    try {
      const key = term.toLocaleLowerCase();
      let found = cityCache.get(key);
      if (!found) {
        const params = new URLSearchParams({ q: term, lang: "de", limit: "6" });
        for (const place of ["city", "town", "village", "hamlet"])
          params.append("osm_tag", `place:${place}`);
        const response = await fetch(
          `https://photon.komoot.io/api/?${params}`,
          { signal: abort.signal },
        );
        if (!response.ok) throw new Error("search failed");
        const data = await response.json();
        found = (data.features || []).flatMap((feature) => {
          const [lng, lat] = feature.geometry?.coordinates || [];
          if (
            !Number.isFinite(lat) ||
            !Number.isFinite(lng) ||
            Math.abs(lat) > 90 ||
            Math.abs(lng) > 180
          )
            return [];
          const p = feature.properties || {};
          const label = [
            ...new Set([p.name, p.state, p.country].filter(Boolean)),
          ].join(", ");
          return label ? [{ lat, lng, label }] : [];
        });
        cityCache.set(key, found);
      }
      if (request.current !== id) return;
      setResults(found);
      setMessage(
        found.length
          ? "Bitte den passenden Ort auswählen."
          : "Keine Stadt gefunden. Versuche es mit Stadt und Land.",
      );
    } catch {
      if (request.current === id)
        setMessage(
          "Stadtsuche derzeit nicht erreichbar. Bitte erneut versuchen oder die Karte verwenden.",
        );
    } finally {
      clearTimeout(timer);
      if (request.current === id) setBusy(false);
    }
  }

  return (
    <section className="control-group location-search" aria-label="Suchgebiet">
      <form onSubmit={search}>
        <label htmlFor="city-search">Stadt oder Ort</label>
        <div className="city-search-row">
          <input
            id="city-search"
            type="search"
            placeholder="z. B. Wien, Österreich"
            value={query}
            disabled={disabled}
            onChange={(event) => {
              ++request.current;
              controller.current?.abort();
              setBusy(false);
              setResults([]);
              setMessage("");
              setQuery(event.target.value);
            }}
          />
          <button
            className="primary-button"
            disabled={disabled || busy || query.trim().length < 2}
          >
            Suchen
          </button>
        </div>
      </form>
      <button
        type="button"
        className="secondary-button"
        disabled={disabled || busy}
        onClick={locate}
      >
        Meinen Standort verwenden
      </button>
      <p className="location-message" role="status">
        {message}
      </p>
      {results.length > 0 && (
        <ul className="city-results">
          {results.map((place, index) => (
            <li key={`${place.lat}-${place.lng}-${index}`}>
              <button
                type="button"
                className="secondary-button"
                disabled={disabled}
                onClick={() => {
                  ++request.current;
                  setResults([]);
                  setQuery(place.label);
                  setMessage(`${place.label} übernommen.`);
                  onSelect(place, place.label);
                }}
              >
                {place.label}
              </button>
            </li>
          ))}
        </ul>
      )}
      <small>
        Setzt Routenstart und Mittelpunkt der Radius-Suche. Das Ziel wählst du
        auf der Karte.
      </small>
      <small>
        Ortssuche:{" "}
        <a href="https://photon.komoot.io/" target="_blank" rel="noreferrer">
          Photon
        </a>{" "}
        ·{" "}
        <a
          href="https://www.openstreetmap.org/copyright"
          target="_blank"
          rel="noreferrer"
        >
          © OpenStreetMap
        </a>
      </small>
    </section>
  );
}
