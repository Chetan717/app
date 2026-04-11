import { useState, useRef, useEffect, useCallback } from "react";
import { useGeneralData } from "../../.././Context/GeneralContext";
import "./stylec.css";
import { Alltemplateservice } from "./Services/Alltemplateservice";
import { useNavigate } from "react-router";

const SkeletonCard = () => (
  <div className="rounded-2xl overflow-hidden animate-pulse bg-gray-200 dark:bg-gray-700 aspect-square w-full relative">
    <div
      className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
      style={{
        background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
      }}
    />
  </div>
);

const getSelType = (selType) => {
  if (selType?.type) {
    localStorage.setItem("selType", JSON.stringify(selType));
    return selType;
  }
  try {
    const stored = localStorage.getItem("selType");
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
};

export default function AllTemplates() {
  const navigate = useNavigate();
  const { selType: contextSelType, setSelType } = useGeneralData();
  const selType = getSelType(contextSelType);

  const [tempdata, setTempData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  useEffect(() => {
    setTempData([]);
    setLastDoc(null);
    setHasMore(true);
    setIsInitialLoading(true);
    loadTemplates(null, true);
  }, [contextSelType]);

  const loadTemplates = async (lastDocRef = null, isInitial = false) => {
    const activeType = getSelType(contextSelType);
    if (!activeType?.type) return;
    const pageSize = isInitial ? 12 : 6;
    try {
      const { templates, lastDoc: newLastDoc, hasMore: more } =
        await Alltemplateservice(activeType.type, lastDocRef, pageSize);
      setTempData((prev) => (isInitial ? templates : [...prev, ...templates]));
      setLastDoc(newLastDoc);
      setHasMore(more);
    } catch (err) {
      console.error(err);
    } finally {
      setIsInitialLoading(false);
      setIsFetchingMore(false);
    }
  };

  const handleObserver = useCallback(
    (entries) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && !isFetchingMore && !isInitialLoading) {
        setIsFetchingMore(true);
        loadTemplates(lastDoc, false);
      }
    },
    [hasMore, isFetchingMore, isInitialLoading, lastDoc],
  );

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: "100px",
      threshold: 0.1,
    });
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [handleObserver]);

  const onImageSelect = (item) => {
    setSelectedId(item.id);
    const Profile = JSON.parse(localStorage.getItem("mlmProfile") || "{}");
    if (Profile?.companyId) {
      const GENERAL_SELECT_TYPES = [
        { name: "Trending", value: "Trending" },
        { name: "Festival", value: "Festival" },
        { name: "Motivational", value: "Motivational" },
        { name: "Good Morning", value: "Good_Morning" },
        { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
        { name: "Leader Quotes", value: "Leader_Quotes" },
        { name: "Health Tips", value: "Health_Tips" },
        { name: "Meeting", value: "Meeting" },
        { name: "Greeting & Wishes", value: "Greeting_Wishes" },
        { name: "Thank You (Birthday & Anniversary)", value: "ThankYou_Birthday_Anniversary" },
      ];
      const isGeneralType = GENERAL_SELECT_TYPES.some((t) => t.value === selType?.type);
      const seltype = {
        id: item.id,
        type: item.type,
        serial: item.serial,
        ShowCaseForm: item.ShowCaseForm,
        Subtype: item.Subtype,
      };
      setSelType(seltype);
      localStorage.setItem("selType", JSON.stringify(seltype));
      navigate(isGeneralType ? "/Editor" : "/mlmform");
    } else {
      navigate("/mlmprofile");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-950">

      {/* ── Header ── */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white  z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0 active:scale-95"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4 text-gray-700 dark:text-gray-200"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>

        <div className="flex flex-col">
          <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-tight truncate">
            {selType?.type?.replaceAll("_", " ")}
          </h3>
          {!isInitialLoading && tempdata.length > 0 && (
            <span className="text-[10px] text-gray-400 font-medium">
              {tempdata.length}+ templates
            </span>
          )}
        </div>
      </div>

      {/* ── Grid ── */}
      <div className="flex-1 overflow-y-auto px-3 py-3">
        {/* Empty state */}
        {!isInitialLoading && tempdata.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg className="w-7 h-7 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-400">No templates found</p>
          </div>
        )}

        <div className="grid grid-cols-3 gap-2.5">
          {/* Template cards */}
          {tempdata?.map((card) => (
            <div
              key={card.id}
              onClick={() => onImageSelect(card)}
              className={`relative rounded-2xl overflow-hidden cursor-pointer aspect-square
                transition-all duration-200 active:scale-95 group
                ${selectedId === card.id
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
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200" />

              {/* Selected check */}
              {selectedId === card.id && (
                <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-indigo-500 rounded-full flex items-center justify-center shadow-md">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          ))}

          {/* Skeleton — initial load */}
          {isInitialLoading &&
            Array.from({ length: 12 }).map((_, i) => (
              <SkeletonCard key={`init-skel-${i}`} />
            ))}

          {/* Skeleton — load more */}
          {isFetchingMore &&
            Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={`more-skel-${i}`} />
            ))}
        </div>

        {/* Sentinel */}
        <div ref={sentinelRef} className="h-4 w-full" />

        {/* End of list */}
        {!hasMore && !isInitialLoading && tempdata.length > 0 && (
          <div className="flex items-center gap-3 py-4 px-2">
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <p className="text-[11px] text-gray-400 font-medium whitespace-nowrap">
              All templates loaded
            </p>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
          </div>
        )}
      </div>
    </div>
  );
}