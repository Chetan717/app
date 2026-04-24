import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useGeneralData } from "../../../Context/GeneralContext";
import { useNavigate } from "react-router";
import { Alltemplateservice } from "./Services/Alltemplateservice";

// ── Constants ─────────────────────────────────────────────────────────────────
const GENERAL_SELECT_TYPES = new Set([
  "Trending",
  "Festival",
  "Motivational",
  "Good_Morning",
  "Devotional_Spiritual",
  "Leader_Quotes",
  "Health_Tips",
  "Meeting",
  "Greeting_Wishes",
  "ThankYou_Birthday_Anniversary",
]);

const GRID_TYPES = new Set([
  "Welcome_Closing",
  "Anniversary_Birthday",
  "ThankYou_Birthday_Anniversary",
]);

// ── Reusable debounce hook ────────────────────────────────────────────────────
function useDebounce(fn, delay) {
  const timerRef = useRef(null);

  const debounced = useCallback(
    (...args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay],
  );

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(timerRef.current), []);

  return debounced;
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
const SkeletonCard = React.memo(() => (
  <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 dark:bg-gray-700 aspect-square w-full relative">
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
      }}
    />
  </div>
));

// ── Template card (memoized to prevent unnecessary re-renders) ────────────────
const TemplateCard = React.memo(({ card, isSelected, onSelect }) => (
  <div
    onClick={() => onSelect(card)}
    className={`relative rounded-2xl overflow-hidden cursor-pointer aspect-square
      transition-all duration-200 active:scale-95 group
      ${
        isSelected
          ? "ring-2 ring-indigo-500 ring-offset-2 shadow-lg"
          : "ring-1 ring-gray-100 dark:ring-gray-800 shadow-sm hover:shadow-md"
      }`}
  >
    <img
      src={card.image}
      alt="template"
      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />
    {isSelected && (
      <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
        <svg
          className="w-3 h-3 text-white"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
    )}
  </div>
));

// ── Inline expanded grid with debounced IntersectionObserver ──────────────────
function InlineTemplateGrid({ group, onSelect, selectedId }) {
  const [tempdata, setTempData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Keep latest state in refs so debounced callback always sees fresh values
  const stateRef = useRef({ hasMore, isFetchingMore, isInitialLoading, lastDoc });
  useEffect(() => {
    stateRef.current = { hasMore, isFetchingMore, isInitialLoading, lastDoc };
  }, [hasMore, isFetchingMore, isInitialLoading, lastDoc]);

  const loadTemplates = useCallback(
    async (lastDocRef = null, isInitial = false) => {
      const pageSize = isInitial ? 12 : 6;
      try {
        const { templates, lastDoc: newLastDoc, hasMore: more } =
          await Alltemplateservice(group.type, lastDocRef, pageSize);
        setTempData((prev) =>
          isInitial ? templates : [...prev, ...templates],
        );
        setLastDoc(newLastDoc);
        setHasMore(more);
      } catch (err) {
        console.error(err);
      } finally {
        setIsInitialLoading(false);
        setIsFetchingMore(false);
      }
    },
    [group.type],
  );

  useEffect(() => {
    setTempData([]);
    setLastDoc(null);
    setHasMore(true);
    setIsInitialLoading(true);
    loadTemplates(null, true);
  }, [loadTemplates]);

  // Raw handler — will be debounced below
  const rawObserverHandler = useCallback(
    (entries) => {
      const [entry] = entries;
      const { hasMore, isFetchingMore, isInitialLoading, lastDoc } =
        stateRef.current;
      if (
        entry.isIntersecting &&
        hasMore &&
        !isFetchingMore &&
        !isInitialLoading
      ) {
        setIsFetchingMore(true);
        loadTemplates(lastDoc, false);
      }
    },
    [loadTemplates],
  );

  // Debounce: wait 150 ms after scroll stops before triggering fetch
  const handleObserver = useDebounce(rawObserverHandler, 150);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "150px",
      threshold: 0.1,
    });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  return (
    <div className="mt-2">
      <div className="grid grid-cols-3 gap-2.5">
        {tempdata.map((card) => (
          <TemplateCard
            key={card.id}
            card={card}
            isSelected={selectedId === card.id}
            onSelect={onSelect}
          />
        ))}

        {isInitialLoading &&
          Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
        {isFetchingMore &&
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={`skm-${i}`} />)}
      </div>

      <div ref={sentinelRef} className="h-4 w-full" />

      {!hasMore && !isInitialLoading && tempdata.length > 0 && (
        <div className="flex items-center gap-3 py-3 px-2">
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
            All templates loaded
          </p>
          <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
function ListOfGenaraltemp({ templates, loading }) {
  const [selectedTemp, setSelectedTemp] = useState(null);
  const navigate = useNavigate();
  const { selType: contextSelType, setSelType } = useGeneralData();

  // Derived once, not on every render
  const selType = useMemo(() => {
    if (contextSelType?.type) {
      localStorage.setItem("selType", JSON.stringify(contextSelType));
      return contextSelType;
    }
    try {
      const stored = localStorage.getItem("selType");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }, [contextSelType]);

  const handleViewAll = useCallback(
    (group) => {
      const selttype = {
        type: group.type,
        id: group.templates?.[0]?.id,
        serial: group.templates?.[0]?.serial,
        ShowCaseForm: group.templates?.[0]?.ShowCaseForm,
        Subtype: group.templates?.[0]?.Subtype,
      };
      setSelType(selttype);
      navigate("/alltemp");
    },
    [navigate, setSelType],
  );

  const handleImagePress = useCallback(
    (item) => {
      setSelectedTemp(item);

      const selttype = {
        id: item.id,
        type: item.type,
        serial: item.serial,
        ShowCaseForm: item.ShowCaseForm,
        Subtype: item.Subtype,
      };

      setSelType(selttype);
      localStorage.setItem("selType", JSON.stringify(selttype));

      const Profile = JSON.parse(localStorage.getItem("mlmProfile") || "{}");
      if (Profile?.companyId) {
        navigate(GENERAL_SELECT_TYPES.has(selttype.type) ? "/Editor" : "/mlmform");
      } else {
        navigate("/mlmprofile");
      }
    },
    [navigate, setSelType],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
        <p className="text-sm text-gray-400 font-medium tracking-wide">
          Loading templates...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center w-full max-w-sm mx-auto p-1 pb-6">
      {templates?.map((group) => {
        const isGrid = GRID_TYPES.has(group.type);

        return (
          <div key={group.type} className="w-full mb-4">
            {/* Section header */}
            {!isGrid && (
              <div className="flex items-center justify-between mb-2 px-1">
                <div className="flex items-center gap-2">
                  <span className="w-1 h-4 rounded-full bg-accent inline-block" />
                  <h2 className="text-xs font-bold uppercase  text-accent dark:text-white">
                    {group.type.replaceAll("_", " ")}
                  </h2>
                </div>
                <button
                  onClick={() => handleViewAll(group)}
                  className="text-[9px] bg-accent/10 font-bold p-2 touchable rounded-2xl text-accent/90 hover:text-accent/90 dark:text-white transition-colors duration-150"
                >
                  View All
                </button>
              </div>
            )}

            {/* Grid layout for special types */}
            {isGrid ? (
              <div className="grid grid-cols-2 gap-2">
                {group?.templates?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImagePress(item)}
                    className={`relative rounded-2xl overflow-hidden cursor-pointer group
                      shadow-sm transition-all duration-200 active:scale-95
                      `}
                  >
                    <img
                      src={item.image}
                      className="w-full h-[60px] object-cover transition-transform duration-300 group-hover:scale-105"
                      alt={item.Subtype || "template"}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-2xl" />
                    {selectedTemp?.id === item?.id && (
                      <div className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-2.5 h-2.5 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Horizontal scroll preview */
              <div className="flex flex-row gap-2.5 overflow-x-auto pb-1 hide-scrollbar">
                {group?.templates?.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleImagePress(item)}
                    className="flex-shrink-0 h-full flex flex-col items-center gap-1 cursor-pointer group transition-all duration-200 active:scale-95"
                  >
                    <div className="rounded-xl overflow-hidden transition-all duration-200">
                      <img
                        src={item.image}
                        className={`w-[75px] h-[75px] object-cover transition-transform duration-300 group-hover:scale-105
                          ${selectedTemp?.id === item?.id ? "ring-2 ring-indigo-500" : ""}`}
                        alt={item.Subtype || "template"}
                        loading="lazy"
                      />
                    </div>
                    {item.Subtype && (
                      <p className="text-[10px] font-medium text-accent/70 dark:text-gray-100 capitalize text-center w-[82px] truncate">
                        {item.Subtype}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      <div className="mt-4 w-full bg-gray-50 border border-gray-100 rounded-2xl px-4 py-3">
        <p className="text-center text-[11px] text-gray-400 leading-relaxed">
          🎨 More templates coming soon — thank you for your patience!
        </p>
      </div>
    </div>
  );
}

export default ListOfGenaraltemp;