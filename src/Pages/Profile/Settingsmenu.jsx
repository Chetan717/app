import { useState } from "react";
import { useGeneralData } from "../../Context/GeneralContext";
import InvoicePopup from "./utils/InvoicePopup";
import { useNavigate,Link } from "react-router";
import ChangePin from "./utils/ChangePin";
import DeleteAcc from "./utils/DeleteAcc";
/* ─────────────────────────────────────────
   Gravity UI – inline SVG icon components
   Paths sourced from @gravity-ui/icons v2
───────────────────────────────────────── */
const Icon = ({ d, size = 16, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {Array.isArray(d) ? (
      d.map((path, i) => (
        <path
          key={i}
          d={path}
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))
    ) : (
      <path
        d={d}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )}
  </svg>
);

// Gravity UI – Globe (Languages)
const GlobeIcon = () => (
  <Icon
    d={[
      "M8 1.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13Z",
      "M8 1.5C6.343 1.5 5 4.462 5 8s1.343 6.5 3 6.5 3-2.962 3-6.5-1.343-6.5-3-6.5Z",
      "M1.5 8h13",
      "M2.5 5h11M2.5 11h11",
    ]}
  />
);

// Gravity UI – Moon (Dark Mode)
const MoonIcon = () => (
  <Icon d={["M13.5 9.5A5.5 5.5 0 0 1 6.5 2.5a5.5 5.5 0 1 0 7 7Z"]} />
);

// Gravity UI – FileArrowDown (Invoice)
const InvoiceIcon = () => (
  <Icon
    d={[
      "M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9.5 1.5Z",
      "M9.5 1.5V6H13",
      "M8 8.5v4M6 10.5l2 2 2-2",
    ]}
  />
);

// Gravity UI – Gear (Banner Setting)
const GearIcon = () => (
  <Icon
    d={[
      "M8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
      "M13.196 6A5.977 5.977 0 0 0 12.5 4.928l-.768.768a.75.75 0 0 1-1.06-1.06l.768-.769A6 6 0 0 0 6 3.804V4.5a.75.75 0 0 1-1.5 0v-.696A6 6 0 0 0 3.804 4.5l.768.768a.75.75 0 1 1-1.06 1.06l-.769-.768A5.977 5.977 0 0 0 1.5 10h.696a.75.75 0 0 1 0 1.5H1.5a5.977 5.977 0 0 0 .696 2 5.977 5.977 0 0 0 1.072.696l.768-.768a.75.75 0 1 1 1.06 1.06l-.768.769A6 6 0 0 0 9.5 15.196V14.5a.75.75 0 0 1 1.5 0v.696a5.977 5.977 0 0 0 1.196-1.072l-.768-.768a.75.75 0 1 1 1.06-1.06l.769.768A5.977 5.977 0 0 0 14.5 10h-.696a.75.75 0 0 1 0-1.5h.696A5.977 5.977 0 0 0 13.196 6Z",
    ]}
  />
);

// Gravity UI – CircleQuestion (Learn How)
const CircleQuestionIcon = () => (
  <Icon
    d={[
      "M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Z",
      "M6.25 6.25a1.75 1.75 0 0 1 3.25.875C9.5 8.5 8 8.75 8 10",
      "M8 12h.01",
    ]}
  />
);

// Gravity UI – Person (Customer Care)
const PersonIcon = () => (
  <Icon
    d={[
      "M8 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
      "M2.5 13.5a5.5 5.5 0 0 1 11 0",
    ]}
  />
);

// Gravity UI – Comment (Chat with Expert)
const CommentIcon = () => (
  <Icon
    d={[
      "M2 3.5A1.5 1.5 0 0 1 3.5 2h9A1.5 1.5 0 0 1 14 3.5v7A1.5 1.5 0 0 1 12.5 12H8l-3.5 2.5V12H3.5A1.5 1.5 0 0 1 2 10.5v-7Z",
    ]}
  />
);

// Gravity UI – Key (Change Password)
const KeyIcon = () => (
  <Icon
    d={[
      "M5.5 9.5a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
      "M8.5 7.5 14 13",
      "M12 11.5l1.5 1.5-1 1",
      "M13.5 13l1.5 1.5",
    ]}
  />
);

// Gravity UI – PersonXmark (Delete Account)
const PersonXmarkIcon = () => (
  <Icon
    d={[
      "M7 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
      "M1.5 13.5a5.502 5.502 0 0 1 8.536-4.579",
      "M11 12l2 2m0 0 2 2m-2-2 2-2m-2 2-2 2",
    ]}
  />
);

// Gravity UI – Star (Feedback & Review)
const StarIcon = () => (
  <Icon
    d={[
      "m8 1.5 1.945 3.942 4.348.633-3.146 3.066.743 4.33L8 11.355l-3.89 2.116.743-4.33L1.707 6.075l4.348-.633L8 1.5Z",
    ]}
  />
);

// Gravity UI – Shield (Privacy Policy)
const ShieldIcon = () => (
  <Icon
    d={[
      "M8 1.5 2 4v4c0 3.314 2.686 6 6 6s6-2.686 6-6V4L8 1.5Z",
      "M5.5 8l1.75 1.75L10.5 6",
    ]}
  />
);

// Gravity UI – FileText (Term & Condition)
const FileTextIcon = () => (
  <Icon
    d={[
      "M9.5 1.5H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V6L9.5 1.5Z",
      "M9.5 1.5V6H13",
      "M5.5 9h5M5.5 11.5h3",
    ]}
  />
);

// Gravity UI – ChevronRight
const ChevronRightIcon = () => <Icon d="M6 3.5 10.5 8 6 12.5" />;

/* ─────────────────────────────────────────
   Toggle Switch (HeroUI-style)
───────────────────────────────────────── */
const Toggle = ({ checked, onChange }) => (
  <button
    role="switch"
    aria-checked={checked}
    onClick={onChange}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
      checked ? "bg-blue-500" : "bg-gray-200"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

/* ─────────────────────────────────────────
   Section Header
───────────────────────────────────────── */
const SectionHeader = ({ title }) => (
  <div className="px-4 pt-6 pb-1">
    <span className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
      {title}
    </span>
  </div>
);

/* ─────────────────────────────────────────
   Menu Row
───────────────────────────────────────── */
const MenuRow = ({
  icon: IconComp,
  label,
  rightContent,
  showArrow = true,
  danger = false,
  onClick,
}) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 px-4 py-3 transition-colors hover:bg-gray-50 active:bg-gray-100 focus:outline-none text-left ${
      danger ? "text-red-500" : "text-gray-800"
    }`}
  >
    <span
      className={`flex-shrink-0 ${danger ? "text-red-400" : "text-gray-500"}`}
    >
      <IconComp />
    </span>
    <span
      className={`flex-1 text-[15px] font-medium ${danger ? "text-red-500" : "text-gray-800"}`}
    >
      {label}
    </span>
    {rightContent && (
      <span className="ml-auto flex items-center gap-2">{rightContent}</span>
    )}
    {showArrow && (
      <span className="text-gray-300 flex-shrink-0">
        <ChevronRightIcon />
      </span>
    )}
  </button>
);

/* ─────────────────────────────────────────
   Divider
───────────────────────────────────────── */
const Divider = () => <div className="mx-4 border-t border-gray-100" />;

/* ─────────────────────────────────────────
   Main Settings Menu
───────────────────────────────────────── */
export default function SettingsMenu() {
  const [darkMode, setDarkMode] = useState(false);
  const [invShow, setInvShow] = useState(false);
  const [chngePin, setChngePin] = useState(false);
  const [deleteAcc, setDeleteAcc] = useState(false);
  const [language, setLanguage] = useState("English");
  const navigate = useNavigate();
  const { theme, toggleTheme } = useGeneralData();
  const chngetheme = () => {
    toggleTheme();
    setDarkMode((v) => !v);
  };

  return (
    <>
      {/* <InvoicePopup show={invShow} setInvShow={setInvShow} /> */}
      <ChangePin show={chngePin} setChngePin={setChngePin} />
      <DeleteAcc show={deleteAcc} setDeleteAcc={setDeleteAcc} />
      <div className=" bg-gray-50 dark:bg-black w-full flex items-start justify-center p-2">
        <div className="w-full bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100">
          {/* ── PREFERENCES ── */}
          <SectionHeader title="Preferences" />

          <MenuRow
            icon={MoonIcon}
            label="Dark Mode"
            showArrow={false}
            rightContent={<Toggle checked={darkMode} onChange={chngetheme} />}
          />
          <Divider />

          {/* ── HELP & SUPPORT ── */}
          <SectionHeader title="Help & Support" />

          <MenuRow onClick={() => navigate("/mlmprofile")} icon={GearIcon} label="Banner Setting" />
          <Divider />
          <MenuRow
            onClick={() => window.open("https://youtube.com/@mlmboosterapp?si=4AQiHvcR8x6CmOHX", "_blank")}
            icon={CircleQuestionIcon}
            label="Learn How to use apps"
          />
          <Divider />
          <MenuRow
            onClick={() => window.open("tel:9229885383")}
            icon={PersonIcon}
            label="Customer Care"
          />
          <Divider />
          <MenuRow
            onClick={() => window.open("https://wa.me/919229885383", "_blank")}
            icon={CommentIcon}
            label="Chat with an Expert"
          />

          {/* ── SECURITY ── */}
          <SectionHeader title="Security" />

          <MenuRow onClick={() => setChngePin(true)} icon={KeyIcon} label="Change Password" />
          <Divider />
          <MenuRow onClick={() => setDeleteAcc(true)} icon={PersonXmarkIcon} label="Delete My Account" danger />

          {/* ── ABOUT ── */}
          <SectionHeader title="About" />

          <MenuRow icon={StarIcon} label="Feedback & Review" />
          <Divider />
          <MenuRow icon={ShieldIcon}  onClick={() => window.open("https://mlmbooster.net/Privacy.html", "_blank")} label="Privacy Policy" />
          <Divider />
          <MenuRow icon={FileTextIcon} onClick={() => window.open("https://mlmbooster.net/Term.html", "_blank")} label="Term & Condition" />

          <div className="h-4" />
        </div>
      </div>
    </>
  );
}