import { memo, useMemo } from "react";
import {
  PencilToSquare,
  TrashBin,
  ArrowUpRightFromSquare,
  Person,
  MapPin,
  Briefcase,
  Factory,
} from "@gravity-ui/icons";

// ── Single company card (memoized to avoid re-renders) ───────────────────────
const CompanyCard = memo(function CompanyCard({ company, onEdit, onDelete, isDeleting }) {
  const { id, name, address, owner, designation, logos, topuplines, active, launched } = company;

  // Count valid logos/topuplines
  const logoCount   = useMemo(() => (logos   || []).filter((l) => l.link).length, [logos]);
  const topupCount  = useMemo(() => (topuplines || []).filter((t) => t.link).length, [topuplines]);

  // First logo for avatar
  const firstLogo = useMemo(
    () => (logos || []).find((l) => l.link)?.link || null,
    [logos]
  );

  return (
    <div className="group relative bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col gap-4">

      {/* ── Status badges ── */}
      <div className="absolute top-4 right-4 flex items-center gap-1.5">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          active
            ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
            : "bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-gray-300 dark:bg-gray-600"}`} />
          {active ? "Active" : "Inactive"}
        </span>
        {launched && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
            Launched
          </span>
        )}
      </div>

      {/* ── Header: logo + name ── */}
      <div className="flex items-center gap-3 pr-24">
        {firstLogo ? (
          <img
            src={firstLogo}
            alt={name}
            className="w-12 h-12 rounded-xl object-contain border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 flex-shrink-0"
            onError={(e) => { e.target.style.display = "none"; }}
          />
        ) : (
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center flex-shrink-0">
            <Factory className="w-6 h-6 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h3
            className="font-bold text-gray-900 dark:text-white truncate text-base"
            style={{ fontFamily: "'Syne', sans-serif" }}
          >
            {name || "—"}
          </h3>
          {designation && (
            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{designation}</p>
          )}
        </div>
      </div>

      {/* ── Details ── */}
      <div className="space-y-2 text-sm flex-1">
        {owner && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Person className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{owner}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{address}</span>
          </div>
        )}
        {designation && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Briefcase className="w-3.5 h-3.5 flex-shrink-0 text-gray-400" />
            <span className="truncate">{designation}</span>
          </div>
        )}
      </div>

      {/* ── Counts row ── */}
      <div className="flex items-center gap-3 pt-1 border-t border-gray-50 dark:border-gray-800">
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <ArrowUpRightFromSquare className="w-3.5 h-3.5" />
          <span>{logoCount} logo{logoCount !== 1 ? "s" : ""}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
          <ArrowUpRightFromSquare className="w-3.5 h-3.5" />
          <span>{topupCount} topup line{topupCount !== 1 ? "s" : ""}</span>
        </div>

        {/* ── Actions ── */}
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => onEdit(id)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-500/10 transition-colors"
            title="Edit company"
          >
            <PencilToSquare className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(id)}
            disabled={isDeleting}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
            title="Delete company"
          >
            {isDeleting ? (
              <span className="w-4 h-4 border-2 border-red-300 border-t-red-500 rounded-full animate-spin inline-block" />
            ) : (
              <TrashBin className="w-4 h-4" />
          
            )}
          </button>
        </div>
      </div>
    </div>
  );
});

// ── List wrapper ─────────────────────────────────────────────────────────────
export default function ListOfCompanie({ companies, onEdit, onDelete, deletingId }) {
  if (companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
          <Factory className="w-7 h-7 text-gray-400" />
        </div>
        <h3 className="text-base font-semibold text-gray-600 dark:text-gray-400 mb-1">
          No companies found
        </h3>
        <p className="text-sm text-gray-400 dark:text-gray-500">
          Click <span className="font-semibold text-violet-500">Add Company</span> to create your first one.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {companies.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onEdit={onEdit}
          onDelete={onDelete}
          isDeleting={deletingId === company.id}
        />
      ))}
    </div>
  );
}