import { Moon, Sun, ListUl } from "@gravity-ui/icons";
import { useGeneralData } from "../Context/GeneralContext";

export default function Header({
  collapsed,
  setCollapsed,
  setMobileOpen,
  darkMode,
  setDarkMode,
  activeLabel,
}) {
  const { theme, toggleTheme } = useGeneralData();
  const isDark = theme === "dark";

  // ✅ Parse localStorage data safely
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany") || "{}");
  const userMlm = JSON.parse(localStorage.getItem("usermlm") || "{}");

  const companyLogo = selectedCompany?.logos?.[0]?.link;
  const userName = userMlm?.name;

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      setMobileOpen((prev) => !prev);
    } else {
      setCollapsed((prev) => !prev);
    }
  };

  return (
    <header className="sticky top-0 z-20 h-16 flex items-center px-2 gap-1 bg-white/80 dark:bg-[#0f1117]/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800/70">

      {/* Sidebar toggle */}
      <button
        onClick={handleMenuClick}
        aria-label="Toggle sidebar"
        className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
      >
        <ListUl className="w-5 h-5"/>
      </button>

      {/* ✅ Company logo + user name — visible only on mobile (md:hidden) */}
      <div className="flex items-center gap-2 md:hidden">
        {companyLogo ? (
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-8 h-8 rounded-lg object-contain"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">

          </div>
        )}
        {userName && (
          <span className="text-sm capitalize font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap max-w-[120px] ">
            {userName}
          </span>
        )}
      </div>

      {/* Page title — hidden on mobile since we show logo+name instead */}
      {/* <h1
        className="hidden md:block text-base font-semibold text-gray-800 dark:text-gray-100 capitalize select-none"
        style={{ fontFamily: "'Syne', sans-serif" }}
      >
        {activeLabel}
      </h1> */}
      <div className="flex lg:block hidden md:hidden items-center gap-2 ">
        {/* {companyLogo ? (
          <img
            src={companyLogo}
            alt="Company Logo"
            className="w-8 h-8 rounded-lg object-contain"
          />
        ) : (
          <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500">
            
          </div>
        )} */}
        {userName && (
          <span className="text-sm capitalize font-semibold text-gray-800 dark:text-gray-100 whitespace-nowrap max-w-[120px] ">
            {userName}
          </span>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 ml-auto flex-shrink-0">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full transition-all duration-300 hover:bg-default"
          aria-label="Toggle theme"
        >
          {isDark ? (
            <Sun className="size-5 text-foreground" />
          ) : (
            <Moon className="size-5 text-foreground" />
          )}
        </button>

        <button className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group">
          <div className="w-7 h-7 rounded-lg bg-[#0e245c] flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
            {/* ✅ Show first letter of user name */}
            {userName?.[0]?.toUpperCase() || "A"}
          </div>
        </button>
      </div>
    </header>
  );
}