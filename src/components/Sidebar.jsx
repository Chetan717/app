import {
  Dots9,
  Hand,
  PersonWorker,
  Gem,
  ChartAreaStacked,
  Person,
  LogoMicrosoftOffice,
  Sack,
  ArrowChevronRight
} from "@gravity-ui/icons";
import { useNavigate } from "react-router";
import logo from "../../public/mlmboo2.ico";
import { useGeneralData } from "../Context/GeneralContext";
const NAV_ITEMS = [
  { icon: Dots9, label: "Home", id: "Home", link: "/" },
  {
    icon: Gem,
    label: "My Subscriptions",
    id: "Subscriptions",
    link: "/Subscription",
  },
  {
    icon: Person,
    label: "My MLM Profile",
    id: "MyMLMProfile",
    link: "/mlmprofile",
  },
];

const BOTTOM_ITEMS = [
  //   { icon: Hand, label: "Settings", id: "settings" },
  { icon: ArrowChevronRight, label: "Logout", id: "logout", link: "/logout" },
];

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen, active, setActive }) {
  const navigate = useNavigate();
  const { theme, theame_color } = useGeneralData();

  // ✅ Parse the JSON string from localStorage safely
  const selectedCompany = JSON.parse(localStorage.getItem("selectedCompany") || "{}");

  const handleNav = (id) => {
    setActive(id);
    setMobileOpen(false);
  };

  const hanClick = (id, link) => {
    navigate(link);
    handleNav(id);
  };

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 border z-40 bg-black/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={[
        "fixed md:relative top-0 left-0 z-50 md:z-auto",
        "h-full flex flex-col",
        "bg-white dark:bg-[#0f1117]",
        "border-r border-gray-100 dark:border-gray-800/70",
        "transition-all duration-300 ease-in-out",
        "shadow-xl md:shadow-none overflow-hidden",
        collapsed ? "md:w-[72px]" : "md:w-60",
        mobileOpen ? "w-60 translate-x-0" : "w-60 -translate-x-full md:translate-x-0",
      ].join(" ")}>

        {/* Logo row */}
        <div className="flex items-center gap-3 px-4 py-[18px] dark:border-gray-800/70">
          <div className={`min-w-[36px] w-10 h-10 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0`}>
            {/* ✅ Safe optional chaining on parsed object */}
            {selectedCompany?.logos?.[0] ? (
              <img src={selectedCompany.logos[0]?.link} alt="Company Logo" className="w-full h-full object-contain rounded-xl" />
            ) : (
              <span className="text-white font-bold text-sm">M</span>
            )}
          </div>

          <span className={[
            "font-bold text-[17px] text-gray-900 dark:text-white tracking-tight whitespace-nowrap transition-all duration-300",
            collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100",
          ].join(" ")} style={{ fontFamily: "'Syne', sans-serif" }}>
            {/* ✅ Use company name from localStorage if available */}
            <span className={`text-[${theame_color}] text-[15px]`}>
              {selectedCompany?.name || "VSTAR PVT LTD"}
            </span>
          </span>

          <button
            className="ml-auto md:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={() => setMobileOpen(false)}
          />
          
          
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
          <p className={[
            "text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-gray-600 px-3 mb-2 transition-all duration-200 whitespace-nowrap",
            collapsed ? "md:opacity-0 md:h-0 md:mb-0 md:overflow-hidden" : "opacity-100",
          ].join(" ")}>
            Menu
          </p>
         
          {NAV_ITEMS.map(({ icon: Icon, label, id, badge, link }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => hanClick(id, link)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isActive
                    ? `bg-[${theame_color}] dark:bg-[${theame_color}] text-white dark:text-white`
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-800 dark:hover:text-gray-200",
                ].join(" ")}
              >
                <span className={["min-w-[20px] flex-shrink-0 transition-colors", isActive ? "text-white" : "group-hover:text-violet-400"].join(" ")}>
                  <Icon className="w-5 h-5" />
                </span>

                <span className={[
                  "flex-1 text-left whitespace-nowrap transition-all duration-300",
                  collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100",
                ].join(" ")}>
                  {label}
                </span>

                {badge && !collapsed && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-violet-500 text-white min-w-[18px] text-center leading-none">
                    {badge}
                  </span>
                )}

                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg hidden md:flex items-center gap-1.5">
                    {label}
                    {badge && (
                      <span className="px-1 py-0.5 bg-violet-500 rounded-full text-[9px] leading-none">{badge}</span>
                    )}
                  </span>
                )}
              </button>
            );
          })}
          
        </nav>

        {/* Bottom actions */}
        <div className="dark:border-gray-800/70 px-2 py-3 space-y-0.5">
          {BOTTOM_ITEMS.map(({ icon: Icon, label, id, link }) => {
            const isActive = active === id;
            const isLogout = id === "logout";
            return (
              <button
                key={id}
                onClick={() => link ? hanClick(id, link) : handleNav(id)}
                className={[
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group relative",
                  isLogout
                    ? "text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-500"
                    : isActive
                      ? "bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/60 hover:text-gray-700 dark:hover:text-gray-200",
                ].join(" ")}
              >
                <span className={["min-w-[20px] flex-shrink-0 transition-colors", isLogout ? "text-red-400 group-hover:text-red-500" : ""].join(" ")}>
                  <Icon className="w-5 h-5" />
                </span>
                <span className={[
                  "flex-1 text-left whitespace-nowrap transition-all duration-300",
                  collapsed ? "md:opacity-0 md:w-0 md:overflow-hidden" : "opacity-100",
                ].join(" ")}>
                  {label}
                </span>
                {collapsed && (
                  <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-700 text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50 shadow-lg hidden md:block">
                    {label}
                  </span>
                )}
              </button>
            );
          })}

          {/* User strip */}
          {/* <div className="flex items-center gap-3 px-3 py-2 mt-1">
            <div className="min-w-[36px] w-9 h-9 rounded-xl bg-[#0e245c] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              A
            </div>
            <div className={["overflow-hidden transition-all duration-300", collapsed ? "md:opacity-0 md:w-0" : "opacity-100"].join(" ")}>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight whitespace-nowrap">User</p>
              <p className="text-[11px] text-gray-400 dark:text-gray-500 whitespace-nowrap">user@mlm.com</p>
            </div>
          </div> */}
        </div>
      </aside>
    </>
  );
}
