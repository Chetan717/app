import React, { useState, useEffect, useRef, useMemo } from "react";
import { db } from "../../../Firebase";
import { collection, getDocs } from "firebase/firestore";
import MlmEditPage from "./MlmEditPage";
import GeneralEditPage from "./GenralEditPage";

export const GENERAL_SELECT_TYPES = [
  { name: "Trending", value: "Trending" },
  { name: "Festival", value: "Festival" },
  { name: "Motivational", value: "Motivational" },
  { name: "Good Morning", value: "Good_Morning" },
  { name: "Devotional / Spiritual", value: "Devotional_Spiritual" },
  { name: "Leader Quotes", value: "Leader_Quotes" },
  { name: "Health Tips", value: "Health_Tips" },
  { name: "Anniversary & Birthday", value: "Anniversary_Birthday" },
  { name: "Greeting & Wishes", value: "Greeting_Wishes" },
  {
    name: "Thank You (Birthday & Anniversary)",
    value: "ThankYou_Birthday_Anniversary",
  },
];

// ── Module-level cache — persists across re-mounts ─────────────────
const collectionCache = {
  data: null,
  isFetched: false,
};

// ── Pure helper — group active docs by GraphicsType ────────────────
// Returns: { TopUplineFrames: [...], Footers: [...], ... }
function groupByGraphicsType(data) {
  return data.reduce((acc, item) => {
    if (!item.Active) return acc; // skip inactive
    const type = item.GraphicsType;
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {});
}

function MainEditor() {
  const [collectionData, setCollectionData] = useState(collectionCache.data);
  const [loading, setLoading] = useState(!collectionCache.isFetched);
  const [error, setError] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    if (collectionCache.isFetched) return;

    const fetchMlmGraphics = async () => {
      try {
        setLoading(true);

        const snapshot = await getDocs(collection(db, "mlmgraphics"));
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        if (isMounted.current) {
          collectionCache.data = data;
          collectionCache.isFetched = true;
          setCollectionData(data);
        }
      } catch (err) {
        if (isMounted.current) setError(err.message);
      } finally {
        if (isMounted.current) setLoading(false);
      }
    };

    fetchMlmGraphics();

    return () => {
      isMounted.current = false;
    };
  }, []);

  // ── Grouped map — recomputes only when collectionData changes ─────
  // graphicsMap = { TopUplineFrames: [...], Footers: [...] }
  const graphicsMap = useMemo(
    () => (collectionData ? groupByGraphicsType(collectionData) : {}),
    [collectionData]
  );

  function getSelType() {
    try {
      return JSON.parse(localStorage.getItem("selType")) || {};
    } catch {
      return {};
    }
  }

  const selll = getSelType();

  const isGeneralType = GENERAL_SELECT_TYPES.some(
    (t) => t.value === selll?.type
  );

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <>
      {isGeneralType ? (
        <GeneralEditPage graphicsMap={graphicsMap} />
      ) : (
        <MlmEditPage graphicsMap={graphicsMap} />
      )}
    </>
  );
}

export default MainEditor;