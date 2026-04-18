import { useState, useEffect } from "react";
import { Moon, Sun, ListUl, Gear } from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";
import { useNavigate, useLocation } from "react-router";
// ── Read localStorage once at module level (outside component) ──
// This runs synchronously before the first render, so data is
// available immediately — no blank flash, no need for a refresh.
function getStoredHeaderData() {
  const selectedCompany = JSON.parse(
    localStorage.getItem("selectedCompany") || "{}",
  );
  const mlmProfile = JSON.parse(localStorage.getItem("mlmProfile") || "{}");
  const userMlm = JSON.parse(localStorage.getItem("usermlm") || "{}");

  return {
    companyLogo: selectedCompany?.logos?.[0]?.link || null,
    userName: mlmProfile?.name || userMlm?.name || "",
  };
}

export default function TabBar({
  collapsed,
  setCollapsed,
  setMobileOpen,
  darkMode,
  setDarkMode,
  activeLabel,
}) {
  const { theme, toggleTheme } = useGeneralData();
  const isDark = theme === "dark";
  const navigate = useNavigate();
  const location = useLocation();

  const [companyLogo, setCompanyLogo] = useState(
    () => getStoredHeaderData().companyLogo,
  );
  const [userName, setUserName] = useState(
    () => getStoredHeaderData().userName,
  );

  useEffect(() => {
    const { companyLogo: logo, userName: name } = getStoredHeaderData();
    setCompanyLogo(logo);
    setUserName(name);
  }, []);

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <>
      {location.pathname === "/Editor"|| location.pathname === "/profile" || location.pathname === "/subscription" ? null : (
        <header className="sticky bottom-0 z-20 h-16 flex items-center px-2 gap-1 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/70"></header>
      )}
    </>
  );
}
