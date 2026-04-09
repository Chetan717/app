import { useState, useRef, useEffect, useCallback } from "react";
import { useGeneralData } from "../../.././Context/GeneralContext";
import "./stylec.css";
import { Alltemplateservice } from "./Services/Alltemplateservice";
import { useNavigate } from "react-router";

const SkeletonCard = () => (
  <div className="flex-shrink-0 h-[100px] w-[90px] rounded-xl overflow-hidden animate-pulse">
    <div className="w-full h-full bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
      <div
        className="absolute inset-0 -translate-x-full animate-[shimmer_1.5s_infinite]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)",
        }}
      />
    </div>
  </div>
);

// Helper to get selType with localStorage fallback
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
  const navigate = useNavigate()

  const { selType: contextSelType } = useGeneralData();
  const selType = getSelType(contextSelType);

  const [tempdata, setTempData] = useState([]);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);

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
      const {
        templates,
        lastDoc: newLastDoc,
        hasMore: more,
      } = await Alltemplateservice(activeType.type, lastDocRef, pageSize);

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

  const onImageSelect = () => {
    const Profile = JSON.parse(localStorage.getItem("mlmProfile") || "{}");

    if (Profile?.companyId) {
      // trigger model of mlm form 
      const GENERAL_SELECT_TYPES = [
        { name: "Trending", value: "Trending" },
        { name: "Festival", value: "Festival" },
        { name: "Motivational", value: "Motivational" },
        { name: "Good Morning", value: "Good_Morning" },
        { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
        { name: "Leader Quotes", value: "Leader_Quotes" },
        { name: "Health Tips", value: "Health_Tips" },
        // { name: "Bonanza", value: "Bonanza" },
        // { name: "Achievements", value: "Achievements" },
        // { name: "Achievements B", value: "Achievements_B" },
        // { name: "Income", value: "Income" },
        // { name: "Welcome / Closing", value: "Welcome_Closing" },
        { name: "Meeting", value: "Meeting" },
        // { name: "Anniversary & Birthday", value: "Anniversary_Birthday" },
        { name: "Greeting & Wishes", value: "Greeting_Wishes" },
        { name: "Thank You (Birthday & Anniversary)", value: "ThankYou_Birthday_Anniversary" },
        // { name: "Capping", value: "Capping" },
      ];

      const isGeneralType = GENERAL_SELECT_TYPES.some(t => t.value === selType?.type);
      if (isGeneralType) {
        navigate("/Editor")
      } else {
        navigate("/mlmform")
      }

    } else {
      navigate("/mlmprofile")
    }

  }
  return (
    <div className="relative rounded-lg p-1.5 flex flex-col items-center justify-start h-full overflow-y-auto">
      <div className="flex items-center w-full gap-2 mb-1 px-1">
        <button
          onClick={() => window.history.back()}
          className="flex items-center justify-center w-7 h-7 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200 flex-shrink-0"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-bold truncate">
          {selType?.type?.replaceAll("_", " ")}
        </h3>
      </div>
      <div className="grid grid-cols-3 gap-4 px-1 py-2">
        {tempdata?.map((card) => (
          <div
            key={card.id}
            className="flex-shrink-0 h-[90px] w-[90px] rounded-xl overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105"
          >
            <img
              onClick={() => onImageSelect()}
              src={card.image}
              alt="template"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ))}

        {isInitialLoading &&
          Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={`init-skel-${i}`} />
          ))}

        {isFetchingMore &&
          Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={`more-skel-${i}`} />
          ))}
      </div>

      <div ref={sentinelRef} className="h-4 w-full" />

      {!hasMore && !isInitialLoading && tempdata.length > 0 && (
        <p className="text-center text-xs text-gray-400 py-3">
          No more templates
        </p>
      )}

      {!isInitialLoading && tempdata.length === 0 && (
        <p className="text-center text-sm text-gray-400 py-6">
          No templates found
        </p>
      )}
    </div>
  );
}
