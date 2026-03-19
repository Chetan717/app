import { useState, useCallback } from "react";
import { useNavigate } from "react-router";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../../../../Firebase";
import {
  CirclePlus,
  TrashBin,
  ArrowLeft,
  Factory,
  TriangleThunderbolt,
  CircleCheck,
} from "@gravity-ui/icons";

// ── Helpers ───────────────────────────────────────────────────────────────────
const uid            = () => Math.random().toString(36).slice(2, 9);
const emptyLink      = () => ({ id: uid(), link: "" });
const emptyProfile   = () => ({ id: uid(), profilename: "" });

const INITIAL_STATE = {
  name:        "",
  address:     "",
  owner:       "",
  designation: "",
  logos:       [emptyLink()],
  topuplines:  [emptyLink()],
  profile:     [emptyProfile()],
  active:      false,
  launched:    false,
};

// ── InputField ────────────────────────────────────────────────────────────────
function InputField({ label, id, value, onChange, placeholder, required }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      <input
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
      />
    </div>
  );
}

// ── ToggleSwitch ──────────────────────────────────────────────────────────────
function ToggleSwitch({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-800/40">
      <div>
        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{label}</p>
        {description && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{description}</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-11 h-6 rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 ${
          checked ? "bg-violet-600" : "bg-gray-300 dark:bg-gray-600"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

// ── ImagePreview ──────────────────────────────────────────────────────────────
function ImagePreview({ url }) {
  const [status, setStatus] = useState("loading");
  if (!url.trim()) return null;
  return (
    <div className="relative w-10 h-10 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 flex-shrink-0 overflow-hidden">
      <img
        key={url}
        src={url}
        alt="preview"
        onLoad={() => setStatus("ok")}
        onError={() => setStatus("error")}
        className={`w-full h-full object-contain transition-opacity duration-200 ${status === "ok" ? "opacity-100" : "opacity-0"}`}
      />
      {status === "loading" && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="w-4 h-4 border-2 border-violet-300 border-t-violet-500 rounded-full animate-spin" />
        </div>
      )}
      {status === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-500/10">
          <span className="text-[9px] font-bold text-red-400 leading-none select-none">ERR</span>
        </div>
      )}
    </div>
  );
}

// ── LinkArrayField (logos / topuplines) ──────────────────────────────────────
function LinkArrayField({ label, items, onChange }) {
  const handleLinkChange = useCallback(
    (id, value) => onChange(items.map((item) => (item.id === id ? { ...item, link: value } : item))),
    [items, onChange]
  );
  const handleAdd    = useCallback(() => onChange([...items, emptyLink()]), [items, onChange]);
  const handleRemove = useCallback((id) => onChange(items.filter((item) => item.id !== id)), [items, onChange]);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
        <button type="button" onClick={handleAdd} className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline">
          <CirclePlus className="w-3.5 h-3.5" />
          Add {label}
        </button>
      </div>
      <div className="space-y-2.5">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-5 text-right flex-shrink-0">{idx + 1}.</span>
            <ImagePreview url={item.link} />
            <input
              type="url"
              value={item.link}
              onChange={(e) => handleLinkChange(item.id, e.target.value)}
              placeholder="https://example.com/image.png"
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
            />
            {items.length > 1 && (
              <button type="button" onClick={() => handleRemove(item.id)} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0">
                <TrashBin className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── JobProfilesField ──────────────────────────────────────────────────────────
function JobProfilesField({ items, onChange }) {
  const handleNameChange = useCallback(
    (id, value) =>
      onChange(items.map((item) => (item.id === id ? { ...item, profilename: value } : item))),
    [items, onChange]
  );
  const handleAdd    = useCallback(() => onChange([...items, emptyProfile()]), [items, onChange]);
  const handleRemove = useCallback((id) => onChange(items.filter((item) => item.id !== id)), [items, onChange]);

  return (
    <div className="flex flex-col gap-2">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Job Profiles
        </label>
        <button
          type="button"
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs text-violet-600 dark:text-violet-400 font-medium hover:underline"
        >
          <CirclePlus className="w-3.5 h-3.5" />
          Add Profile
        </button>
      </div>

      {/* Profile rows */}
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            {/* Index badge */}
            <span className="min-w-[22px] h-6 rounded-md bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
              {idx + 1}
            </span>

            {/* Profile name input */}
            <input
              type="text"
              value={item.profilename}
              onChange={(e) => handleNameChange(item.id, e.target.value)}
              placeholder={`e.g. Sales Executive, Team Leader…`}
              className="flex-1 px-3.5 py-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/60 text-gray-800 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400 transition-all"
            />

            {/* Remove */}
            {items.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemove(item.id)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex-shrink-0"
              >
                <TrashBin className="w-4 h-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tag preview of filled profiles */}
      {items.some((i) => i.profilename.trim()) && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {items
            .filter((i) => i.profilename.trim())
            .map((i) => (
              <span
                key={i.id}
                className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-violet-50 dark:bg-violet-500/10 text-violet-700 dark:text-violet-300 border border-violet-100 dark:border-violet-500/20"
              >
                {i.profilename}
              </span>
            ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function AddCompanies() {
  const navigate = useNavigate();
  const [form,    setForm]    = useState(INITIAL_STATE);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);

  const setField   = useCallback((key) => (value) => setForm((prev) => ({ ...prev, [key]: value })), []);
  const handleText = useCallback((key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value })), []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!form.name.trim()) { setError("Company name is required."); return; }
      setLoading(true);
      setError(null);
      try {
        await addDoc(collection(db, "mlmcomp"), {
          ...form,
          name:        form.name.trim(),
          address:     form.address.trim(),
          owner:       form.owner.trim(),
          designation: form.designation.trim(),
          logos:       form.logos.filter((l) => l.link.trim()),
          topuplines:  form.topuplines.filter((t) => t.link.trim()),
          profile:     form.profile.filter((p) => p.profilename.trim()),
          createdAt:   serverTimestamp(),
          updatedAt:   serverTimestamp(),
        });
        setSuccess(true);
        setTimeout(() => navigate("/companies"), 1200);
      } catch (err) {
        console.error(err);
        setError("Failed to save company. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [form, navigate]
  );

  return (
    <div className="p-4 md:p-6 max-w-2xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={() => navigate("/companies")} className="w-9 h-9 flex items-center justify-center rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Add Company
          </h1>
          <p className="text-sm text-gray-400 dark:text-gray-500">Fill in the details below to create a new company</p>
        </div>
      </div>

      {/* Success */}
      {success && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
          <CircleCheck className="w-4 h-4 flex-shrink-0" />
          Company created successfully! Redirecting…
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm">
          <TriangleThunderbolt className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Basic info */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2 mb-1">
            <Factory className="w-4 h-4 text-violet-500" />
            <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Basic Information</h2>
          </div>
          <InputField label="Company Name" id="name"        value={form.name}        onChange={handleText("name")}        placeholder="e.g. Vestige Marketing"       required />
          <InputField label="Address"      id="address"     value={form.address}     onChange={handleText("address")}     placeholder="e.g. 123 Main Street, Mumbai" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <InputField label="Owner"       id="owner"       value={form.owner}       onChange={handleText("owner")}       placeholder="Owner full name" />
            <InputField label="Designation" id="designation" value={form.designation} onChange={handleText("designation")} placeholder="e.g. CEO / Founder" />
          </div>
        </div>

        {/* Job Profiles */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-1">
          <JobProfilesField items={form.profile} onChange={setField("profile")} />
          <p className="text-xs text-gray-400 pt-2">
            Add all job roles / designations available in this company.
          </p>
        </div>

        {/* Logos */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-1">
          <LinkArrayField label="Logo" items={form.logos} onChange={setField("logos")} />
          <p className="text-xs text-gray-400 pt-1">Paste public image URLs. A preview appears instantly beside each input.</p>
        </div>

        {/* Topup lines */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-1">
          <LinkArrayField label="Topup Line" items={form.topuplines} onChange={setField("topuplines")} />
          <p className="text-xs text-gray-400 pt-1">Add topup / referral image links for this company.</p>
        </div>

        {/* Status */}
        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 space-y-3">
          <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</h2>
          <ToggleSwitch label="Active"   description="Company is currently active and visible"     checked={form.active}   onChange={setField("active")} />
          <ToggleSwitch label="Launched" description="Company has officially launched its program" checked={form.launched} onChange={setField("launched")} />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button type="button" onClick={() => navigate("/companies")} className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
            Cancel
          </button>
          <button type="submit" disabled={loading || success} className="px-6 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors shadow-lg shadow-violet-500/20 flex items-center gap-2">
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {loading ? "Saving…" : "Save Company"}
          </button>
        </div>
      </form>
    </div>
  );
}