import { useState, useEffect, useRef, useCallback } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "../../../../Firebase";

// ─── Constants ────────────────────────────────────────────────────────────────
const BATCH_SIZE = 20;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getSelType() {
  try {
    return JSON.parse(localStorage.getItem("selType")) || {};
  } catch {
    return {};
  }
}

// Strip _template before exposing to parent — parent gets only the GraphicsLink object
function cleanItem(item) {
  if (!item) return null;
  const { _template, ...clean } = item;
  return clean;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function EmptyState({ type }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-default-400">
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
        <rect
          x="4"
          y="4"
          width="32"
          height="32"
          rx="8"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeDasharray="4 3"
        />
        <path
          d="M14 20h12M20 14v12"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
      <p className="text-sm">
        No templates found for type <strong>{type}</strong>
      </p>
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="aspect-square rounded-xl bg-default-100 animate-pulse"
          style={{ animationDelay: `${i * 40}ms` }}
        />
      ))}
    </div>
  );
}

function Tile({ item, isSelected, onSelect }) {
  return (
    <button
      onClick={() => onSelect(item)}
      className={[
        "relative aspect-square rounded-xl overflow-hidden border-2 transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
        isSelected
          ? "border-primary scale-95 shadow-md shadow-primary/20"
          : "border-default-200 hover:border-primary/50 hover:scale-95",
      ].join(" ")}
    >
      {item.suggestionImage ? (
        <img
          src={item.suggestionImage}
          alt="template graphic"
          loading="lazy"
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-default-100 flex items-center justify-center">
          <svg
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
            className="text-default-300"
          >
            <rect
              x="2"
              y="2"
              width="16"
              height="16"
              rx="4"
              stroke="currentColor"
              strokeWidth="1.2"
            />
            <path
              d="M2 13l4-4 3 3 3-4 6 6"
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Selected checkmark */}
      {isSelected && (
        <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <polyline
              points="1.5,5 4,7.5 8.5,2.5"
              stroke="white"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )}

      {/* Position badge */}
      {item.position && (
        <div className="absolute bottom-1 left-1 text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-black/50 text-white backdrop-blur-sm">
          {item.position}
        </div>
      )}

      {/* Locked indicator */}
      {item.pass && item.pass !== "" && (
        <div className="absolute top-1.5 left-1.5">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect
              x="1.5"
              y="5"
              width="9"
              height="6.5"
              rx="1.5"
              fill="white"
              fillOpacity="0.85"
            />
            <path
              d="M3.5 5V3.5a2.5 2.5 0 015 0V5"
              stroke="white"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </button>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
// Props:
//   selected    — clean GraphicsLink object (no _template), controlled by parent
//   setSelected — parent setter; receives clean GraphicsLink object only
export default function ListOfTemplates({ selected, setSelected }) {
  const selType = getSelType();
  const filterType = selType?.type || "";
  const filterSubType = selType?.Subtype || "";
  const filterMainType = selType?.MainType || "";

  // allItems / visibleItems keep _template internally for isSelected matching
  const [allItems, setAllItems] = useState([]);
  const [visibleItems, setVisibleItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const sentinelRef = useRef(null);
  const renderedCount = useRef(0);

  // ── Fetch ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!filterType) {
      setLoading(false);
      return;
    }

    async function fetchTemplates() {
      setLoading(true);
      setError(null);
      try {
        const q = query(
          collection(db, "mlmtemplate"),
          where("SelectType", "==", filterType),
          where("Subtype", "==", filterSubType),
          where("Active", "==", true),
          orderBy("serial"),
        );
        const snap = await getDocs(q);

        const items = [];
        snap.forEach((doc) => {
          const t = { id: doc.id, ...doc.data() };
          (t.GraphicsLink || []).forEach((g) => {
            items.push({ ...g, _template: t }); // _template is INTERNAL only
          });
        });

        setAllItems(items);
        renderedCount.current = 0;

        const firstBatch = items.slice(0, BATCH_SIZE);
        setVisibleItems(firstBatch);
        renderedCount.current = firstBatch.length;

        // Auto-select first GraphicsLink — send clean object to parent
        if (items.length > 0) {
          setSelected(cleanItem(items[0]));
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load templates");
      } finally {
        setLoading(false);
      }
    }

    fetchTemplates();
  }, [filterType]);

  // ── Infinite scroll ───────────────────────────────────────────────────────
  const loadMore = useCallback(() => {
    if (renderedCount.current >= allItems.length) return;
    setLoadingMore(true);
    setTimeout(() => {
      const next = allItems.slice(
        renderedCount.current,
        renderedCount.current + BATCH_SIZE,
      );
      setVisibleItems((prev) => [...prev, ...next]);
      renderedCount.current += next.length;
      setLoadingMore(false);
    }, 150);
  }, [allItems]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loadingMore) loadMore();
      },
      { rootMargin: "120px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, loadingMore]);

  // ── Selection ─────────────────────────────────────────────────────────────
  const handleSelect = (item) => {
    const alreadySelected = selected?.id === item.id;
    if (alreadySelected) {
      // Deselecting — fall back to first item, never leave parent with null
      setSelected(allItems.length > 0 ? cleanItem(allItems[0]) : null);
    } else {
      setSelected(cleanItem(item)); // clean: no _template
    }
  };

  // Compare using only id since selected (in parent) has no _template
  const isItemSelected = (item) => selected?.id === item.id;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="w-full h-[400px] overflow-y-auto mx-auto p-2 pb-6 ">
      {/* Header */}
      {/* <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground">Templates</span>
                    {filterType && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
                            {filterType}
                        </span>
                    )}
                </div>
                {!loading && (
                    <span className="text-xs text-default-400">
                        {visibleItems.length}
                        {allItems.length > visibleItems.length ? ` / ${allItems.length}` : ""} items
                    </span>
                )}
            </div> */}

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-danger-50 border border-danger-200 p-3 text-xs text-danger-700">
          {error}
        </div>
      )}

      {/* No selType */}
      {!filterType && !loading && (
        <div className="rounded-xl bg-warning-50 border border-warning-200 p-3 text-xs text-warning-700">
          No <code>selType</code> found in localStorage.
        </div>
      )}

      {/* Skeleton */}
      {loading && <LoadingGrid />}

      {/* Empty */}
      {!loading && !error && filterType && allItems.length === 0 && (
        <EmptyState type={filterType} />
      )}

      {/* Grid */}
      {!loading && visibleItems.length > 0 && (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {visibleItems.map((item, idx) => (
            <Tile
              key={`${item._template?.serial}-${item.id}-${idx}`}
              item={item}
              isSelected={isItemSelected(item)}
              onSelect={handleSelect}
            />
          ))}
        </div>
      )}

      {/* Sentinel */}
      <div ref={sentinelRef} className="h-1" />

      {/* Loading more */}
      {loadingMore && (
        <div className="flex justify-center py-3">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-bounce"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        </div>
      )}

      {/* End of list */}
      {!loading &&
        !loadingMore &&
        visibleItems.length > 0 &&
        renderedCount.current >= allItems.length && (
          <p className="text-center text-xs text-default-300 py-2">
            {/* All {allItems.length} items loaded */}
          </p>
        )}
    </div>
  );
}
