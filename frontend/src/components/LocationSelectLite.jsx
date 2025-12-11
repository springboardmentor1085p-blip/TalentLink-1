import { useEffect, useMemo, useRef, useState } from 'react';
import { MapPin, X } from 'lucide-react';

function filterLocations(list, q, limit = 50) {
  const s = q.trim().toLowerCase();
  if (!s) return [];
  const hits = [];
  for (const item of list) {
    const t = item.toLowerCase();
    const idx = t.indexOf(s);
    if (idx !== -1) {
      const score = idx * 2 + t.length * 0.01;
      hits.push({ item, score });
      if (hits.length > limit * 3) break;
    }
  }
  hits.sort((a, b) => a.score - b.score);
  return hits.slice(0, limit).map(h => h.item);
}

export default function LocationSelectLite({
  value,
  onChange,               // (string) => void
  placeholder = "City, State",
  maxSuggestions = 50
}) {
  const [query, setQuery] = useState(value || "");
  const [open, setOpen] = useState(false);
  const [allLocations, setAllLocations] = useState(null);   
  const [results, setResults] = useState([]);
  const wrapRef = useRef(null);

  // keep input synced with external value
  useEffect(() => { setQuery(value || ""); }, [value]);

  // close on outside click
  useEffect(() => {
    function onDoc(e) {
      if (!open) return;
      if (wrapRef.current?.contains(e.target)) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  async function ensureLoaded() {
    if (allLocations) return;
    const mod = await import("../data/india-locations.json");
    setAllLocations(mod.default || mod);
  }

  // When query changes, (debounced) filter
  useEffect(() => {
    const t = setTimeout(async () => {
      const q = query.trim();
      if (!q) { setResults([]); return; }
      if (!allLocations) await ensureLoaded();
      const list = allLocations || [];
      const filtered = filterLocations(list, q, maxSuggestions);
      setResults(filtered);
      setOpen(true);
    }, 150);
    return () => clearTimeout(t);
  }, [query]); 

  function pick(str) {
    onChange?.(str);
    setQuery(str);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative">
        <input
          className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
          placeholder={placeholder}
          value={query}
          onChange={(e) => { setQuery(e.target.value); onChange?.(e.target.value); }}
          onFocus={async () => {
            if (query) {
              if (!allLocations) await ensureLoaded();
              const filtered = filterLocations(allLocations || [], query, maxSuggestions);
              setResults(filtered);
              setOpen(true);
            }
          }}
        />
        <MapPin size={16} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-600" />
        {query && (
          <button
            type="button"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
            onClick={() => { setQuery(""); onChange?.(""); }}
            aria-label="Clear location"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 mt-1 w-full max-h-64 overflow-auto bg-white border rounded-xl shadow">
          {results.map((r, i) => (
            <button
              key={`${r}-${i}`}
              type="button"
              onClick={() => pick(r)}
              className="w-full text-left px-3 py-2 text-sm hover:bg-purple-50"
            >
              {r}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
