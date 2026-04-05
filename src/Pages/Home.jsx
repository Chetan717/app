import Carosel from "../Pages/Homepage/Component/Carosel";
import Festival from "../Pages/Homepage/Component/Festival";
import ListOfGenaraltemp from "../Pages/Homepage/Component/ListOfGenaraltemp";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { fetchGeneralTemplates } from "../Pages/Homepage/Component/Services/GeneralTemplateService";
import { useGeneralData } from "../Context/GeneralContext";
import { db } from "../../firebase"; 
import { doc, getDoc } from "firebase/firestore";

const TOTAL_GROUPS = 4;

function Home() {
  const { cachedTemplates, setCachedTemplates, cachedGroupIndex, setCachedGroupIndex } = useGeneralData();

  const [loading, setLoading] = useState(false);
  const loadingRef = useRef(false);
  const groupIndexRef = useRef(cachedGroupIndex);
  const loadTemplatesRef = useRef(null);

  const loadTemplates = useCallback(async () => {
    if (loadingRef.current || groupIndexRef.current >= TOTAL_GROUPS) return;

    loadingRef.current = true;
    setLoading(true);

    const data = await fetchGeneralTemplates(groupIndexRef.current);

    setCachedTemplates((prev) => {
      const existingTypes = new Set(prev.map((g) => g.type));
      return [...prev, ...data.filter((g) => !existingTypes.has(g.type))];
    });

    groupIndexRef.current += 1;
    setCachedGroupIndex(groupIndexRef.current);

    loadingRef.current = false;
    setLoading(false);
  }, [setCachedTemplates, setCachedGroupIndex]); // ✅ correct deps

  // ✅ Keep ref in sync with latest loadTemplates
  useEffect(() => {
    loadTemplatesRef.current = loadTemplates;
  }, [loadTemplates]);

  // ✅ Initial load — skip if already cached
  useEffect(() => {
    groupIndexRef.current = cachedGroupIndex; // ✅ Seed from context on mount
    if (cachedTemplates.length === 0) {
      loadTemplates();
    }
  }, []);

  // ✅ Scroll listener — registers only once
  useEffect(() => {
    const scrollEl = document.querySelector(".layout-scroll-container");
    if (!scrollEl) return;

    const handleScroll = () => {
      if (groupIndexRef.current >= TOTAL_GROUPS || loadingRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollEl;
      if (scrollHeight - scrollTop <= clientHeight + 200) {
        loadTemplatesRef.current();
      }
    };

    scrollEl.addEventListener("scroll", handleScroll);
    return () => scrollEl.removeEventListener("scroll", handleScroll);
  }, []);

  // ✅ Moved here but ideally put in App.jsx or GeneralContext to run once globally
  useEffect(() => {
    const fetchAndSaveCompany = async () => {
      try {
        if (localStorage.getItem("selectedCompany")) return; // ✅ Guard first
        
        const datamlm = JSON.parse(localStorage.getItem("mlmProfile") || "{}");
        if (!datamlm.companyId) return;

        const companyRef = doc(db, "mlmcomp", datamlm.companyId);
        const companySnap = await getDoc(companyRef);

        if (companySnap.exists()) {
          localStorage.setItem(
            "selectedCompany",
            JSON.stringify({ id: companySnap.id, ...companySnap.data() })
          );
        } else {
          console.warn("No company found for ID:", datamlm.companyId);
        }
      } catch (error) {
        console.error("Failed to fetch company:", error);
      }
    };

    fetchAndSaveCompany();
  }, []);

  return (
    <div className="flex flex-col h-full justify-start items-center w-full gap-3">
      <Carosel />
      <Festival />
      <ListOfGenaraltemp templates={cachedTemplates} loading={loading} />
    </div>
  );
}

export default Home;