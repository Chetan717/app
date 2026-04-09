import { useState, useRef, useEffect } from "react";
import { db, app } from "../../../Firebase";
import {
  collection, addDoc, updateDoc, doc,
  serverTimestamp, query, where, getDocs,
} from "firebase/firestore";
import {
  getStorage, ref as storageRef,
  uploadBytes, getDownloadURL,
} from "firebase/storage";
import MultiImagePicker from "./MultiImagePicker";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { toast } from "@heroui/react"; // ✅ added

const storage = getStorage(app);

// ════════════════════════════════════════════════════════════
// REMOVE.BG
// ════════════════════════════════════════════════════════════
export const REMOVE_BG_API_KEYS = [
  "e69bj6px7qJKw5x4N1XepLM9",
  "YOUR_KEY_2",
  "YOUR_KEY_3",
];

export async function removeBackground(file) {
  for (const key of REMOVE_BG_API_KEYS) {
    const fd = new FormData();
    fd.append("image_file", file);
    fd.append("size", "auto");
    const res = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: { "X-Api-Key": key },
      body: fd,
    });
    if (res.ok) return await res.blob();
    if (res.status !== 402 && res.status !== 429) {
      console.warn("remove.bg error", res.status);
      return null;
    }
  }
  return null;
}

// ════════════════════════════════════════════════════════════
// SOCIAL ICONS
// ════════════════════════════════════════════════════════════
const SocialIcon = ({ name, active }) => {
  const icons = {
    Facebook: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#1877F2"} className="w-6 h-6">
        <path d="M22 12a10 10 0 1 0-11.56 9.87V14.89h-2.9V12h2.9v-1.8c0-2.87 1.7-4.45 4.32-4.45 1.25 0 2.56.22 2.56.22v2.82h-1.44c-1.42 0-1.86.88-1.86 1.79V12h3.17l-.5 2.89h-2.67v6.98A10 10 0 0 0 22 12z" />
      </svg>
    ),
    Instagram: (
      <svg viewBox="0 0 24 24" className="w-6 h-6">
        <defs>
          <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={active ? "#fff" : "#f09433"} />
            <stop offset="50%" stopColor={active ? "#fff" : "#e6683c"} />
            <stop offset="100%" stopColor={active ? "#fff" : "#bc1888"} />
          </linearGradient>
        </defs>
        <path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 1.17.053 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.058 1.265.07 1.645.07 4.849s-.012 3.584-.07 4.85c-.053 1.17-.249 1.805-.413 2.227-.217.562-.477.96-.896 1.382-.42.419-.82.679-1.382.896-.422.164-1.057.36-2.227.413-1.265.058-1.645.07-4.85.07s-3.584-.012-4.849-.07c-1.17-.053-1.805-.249-2.227-.413a3.7 3.7 0 0 1-1.381-.896 3.7 3.7 0 0 1-.896-1.382c-.164-.422-.36-1.057-.413-2.227C2.175 15.584 2.163 15.204 2.163 12s.012-3.584.07-4.849c.053-1.17.249-1.805.413-2.227a3.7 3.7 0 0 1 .896-1.382 3.7 3.7 0 0 1 1.381-.896c.422-.164 1.057-.36 2.227-.413C8.416 2.175 8.796 2.163 12 2.163zM12 0C8.741 0 8.332.014 7.052.072c-1.28.058-2.155.261-2.918.558a5.9 5.9 0 0 0-2.126 1.384A5.9 5.9 0 0 0 .63 4.134C.333 4.897.13 5.772.072 7.052.014 8.332 0 8.741 0 12c0 3.259.014 3.668.072 4.948.058 1.28.261 2.155.558 2.918a5.9 5.9 0 0 0 1.384 2.126 5.9 5.9 0 0 0 2.126 1.384c.763.297 1.638.5 2.918.558C8.332 23.986 8.741 24 12 24s3.668-.014 4.948-.072c1.28-.058 2.155-.261 2.918-.558a5.9 5.9 0 0 0 2.126-1.384 5.9 5.9 0 0 0 1.384-2.126c.297-.763.5-1.638.558-2.918.058-1.28.072-1.689.072-4.948s-.014-3.668-.072-4.948c-.058-1.28-.261-2.155-.558-2.918a5.9 5.9 0 0 0-1.384-2.126A5.9 5.9 0 0 0 19.866.63C19.103.333 18.228.13 16.948.072 15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
      </svg>
    ),
    Youtube: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#FF0000"} className="w-6 h-6">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
      </svg>
    ),
    X: (
      <svg viewBox="0 0 24 24" fill={active ? "#fff" : "#000"} className="w-6 h-6">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.748l7.73-8.835L2.125 2.25H8.06l4.264 5.633 5.92-5.633zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  };
  return icons[name] || null;
};

// ════════════════════════════════════════════════════════════
// HELPERS
// ════════════════════════════════════════════════════════════
function getUserMlm() {
  try { return JSON.parse(localStorage.getItem("usermlm") || "{}"); }
  catch { return {}; }
}

const SOCIAL_PLATFORMS = ["Facebook", "Instagram", "Youtube", "X"];

const initialForm = (mobile = "") => ({
  logoSelectedLinks: [],
  logoCustomFiles: [],
  salutation: "Mr",
  name: "",
  mobile,
  designation: "",
  profileImageBlobs: [],
  profileImageBlobPreviews: [],
  existingProfileImageURLs: [],
  _pendingProfileBlobs: [],
  topupSelectedLinks: [],
  topupCustomFiles: [],
  socials: { Facebook: "", Instagram: "", Youtube: "", X: "" },
  socialSameId: "",
  socialSameSelected: [],
});

// ════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════
export default function MLMProfilePage() {
  const userMlm = getUserMlm();
  const userMobile = (userMlm.mobileNo || "").trim();

  const [form, setForm] = useState(initialForm(userMobile));
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState("form");
  const [editorSrc, setEditorSrc] = useState(null);
  const [editingProfileIndex, setEditingProfileIndex] = useState(null);
  const [removingBg, setRemovingBg] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [existingDocId, setExistingDocId] = useState(null);

  const profileInputRef = useRef(null);
  const logoInputRef = useRef(null);
  const topupInputRef = useRef(null);

  const isEditMode = !!existingDocId;

  const company = (() => {
    try { return JSON.parse(localStorage.getItem("selectedCompany") || "{}"); }
    catch { return {}; }
  })();

  const logos = Array.isArray(company?.logos) ? company.logos : [];
  const topuplines = Array.isArray(company?.topuplines) ? company.topuplines : [];
  const designations = Array.isArray(company?.designation) ? company.designation : [];

  // ── Fetch existing profile on mount ────────────────────────
  useEffect(() => {
    if (!userMobile) { setLoadingProfile(false); return; }

    const fetchProfile = async () => {
      setLoadingProfile(true);
      try {
        const q = query(collection(db, "mlmprofiles"), where("mobile", "==", userMobile));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const docSnap = snap.docs[0];
          const data = docSnap.data();
          setExistingDocId(docSnap.id);

          const fullName = data.fullName || "";
          const dotIdx = fullName.indexOf(".");
          const salutation = dotIdx !== -1 ? fullName.slice(0, dotIdx) : "Mr";
          const name = dotIdx !== -1 ? fullName.slice(dotIdx + 1) : fullName;

          setForm({
            logoSelectedLinks: data.logoURLs || [],
            logoCustomFiles: [],
            salutation,
            name,
            mobile: userMobile,
            designation: data.designation || "",
            profileImageBlobs: [],
            profileImageBlobPreviews: [],
            existingProfileImageURLs: data.profileImageURLs || [],
            _pendingProfileBlobs: [],
            topupSelectedLinks: data.topuplineURLs || [],
            topupCustomFiles: [],
            socials: data.socials || { Facebook: "", Instagram: "", Youtube: "", X: "" },
            socialSameId: "",
            socialSameSelected: [],
          });
        } else {
          setExistingDocId(null);
          setForm(initialForm(userMobile));
        }
      } catch (err) {
        console.error("Failed to fetch profile:", err);
        setForm(initialForm(userMobile));
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [userMobile]);

  const setField = (key, val) => setForm((f) => ({ ...f, [key]: val }));
  const clearError = (key) => setErrors((prev) => ({ ...prev, [key]: undefined }));

  // ── Logo ───────────────────────────────────────────────────
  const handleLogoToggleLink = (link) =>
    setForm((f) => ({
      ...f,
      logoSelectedLinks: f.logoSelectedLinks.includes(link)
        ? f.logoSelectedLinks.filter((l) => l !== link)
        : [...f.logoSelectedLinks, link],
    }));

  const handleLogoAddCustomFiles = (files) =>
    setForm((f) => ({
      ...f,
      logoCustomFiles: [
        ...f.logoCustomFiles,
        ...files.map((file) => ({ file, previewURL: URL.createObjectURL(file) })),
      ],
    }));

  const handleLogoRemoveCustomFile = (index) =>
    setForm((f) => ({ ...f, logoCustomFiles: f.logoCustomFiles.filter((_, i) => i !== index) }));

  // ── Topupline ──────────────────────────────────────────────
  const handleTopupToggleLink = (link) =>
    setForm((f) => ({
      ...f,
      topupSelectedLinks: f.topupSelectedLinks.includes(link)
        ? f.topupSelectedLinks.filter((l) => l !== link)
        : [...f.topupSelectedLinks, link],
    }));

  const handleTopupAddCustomFiles = (files) =>
    setForm((f) => ({
      ...f,
      topupCustomFiles: [
        ...f.topupCustomFiles,
        ...files.map((file) => ({ file, previewURL: URL.createObjectURL(file) })),
      ],
    }));

  const handleTopupRemoveCustomFile = (index) =>
    setForm((f) => ({ ...f, topupCustomFiles: f.topupCustomFiles.filter((_, i) => i !== index) }));

  // ── Profile photo ──────────────────────────────────────────
  const handleProfileFileSelect = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setRemovingBg(true);
    try {
      const blobs = await Promise.all(
        files.map(async (file) => {
          const noBgBlob = await removeBackground(file);
          return noBgBlob || file;
        })
      );
      setEditorSrc(URL.createObjectURL(blobs[0]));
      setEditingProfileIndex("new");
      setForm((f) => ({ ...f, _pendingProfileBlobs: blobs.slice(1) }));
      setStep("editor");
    } catch (err) {
      console.error(err);
    } finally {
      setRemovingBg(false);
      e.target.value = "";
    }
  };

  const handleEditorDone = (blob) => {
    setForm((f) => {
      if (editingProfileIndex === "new") {
        const pending = f._pendingProfileBlobs || [];
        const newBlobs = [blob, ...pending];
        const newPreviews = newBlobs.map((b) => URL.createObjectURL(b));
        return {
          ...f,
          profileImageBlobs: [...f.profileImageBlobs, ...newBlobs],
          profileImageBlobPreviews: [...f.profileImageBlobPreviews, ...newPreviews],
          _pendingProfileBlobs: [],
        };
      } else if (typeof editingProfileIndex === "number") {
        const existingCount = f.existingProfileImageURLs.length;
        if (editingProfileIndex < existingCount) {
          const urls = [...f.existingProfileImageURLs];
          urls.splice(editingProfileIndex, 1);
          return {
            ...f,
            existingProfileImageURLs: urls,
            profileImageBlobs: [...f.profileImageBlobs, blob],
            profileImageBlobPreviews: [...f.profileImageBlobPreviews, URL.createObjectURL(blob)],
          };
        } else {
          const blobIdx = editingProfileIndex - existingCount;
          const blobs = [...f.profileImageBlobs];
          const previews = [...f.profileImageBlobPreviews];
          blobs[blobIdx] = blob;
          previews[blobIdx] = URL.createObjectURL(blob);
          return { ...f, profileImageBlobs: blobs, profileImageBlobPreviews: previews };
        }
      }
      return f;
    });
    setEditingProfileIndex(null);
    setStep("form");
    setEditorSrc(null);
  };

  const handleRemoveProfileImage = (combinedIdx) => {
    setForm((f) => {
      const existingCount = f.existingProfileImageURLs.length;
      if (combinedIdx < existingCount) {
        return { ...f, existingProfileImageURLs: f.existingProfileImageURLs.filter((_, i) => i !== combinedIdx) };
      }
      const blobIdx = combinedIdx - existingCount;
      return {
        ...f,
        profileImageBlobs: f.profileImageBlobs.filter((_, i) => i !== blobIdx),
        profileImageBlobPreviews: f.profileImageBlobPreviews.filter((_, i) => i !== blobIdx),
      };
    });
  };

  const handleEditProfileImage = async (combinedIdx) => {
    const existingCount = form.existingProfileImageURLs.length;
    if (combinedIdx < existingCount) {
      setRemovingBg(true);
      try {
        const res = await fetch(form.existingProfileImageURLs[combinedIdx]);
        if (!res.ok) throw new Error("Fetch failed");
        const blob = await res.blob();
        const blobURL = URL.createObjectURL(blob);
        setEditingProfileIndex(combinedIdx);
        setEditorSrc(blobURL);
        setStep("editor");
      } catch (err) {
        console.error("Failed to load image for editing:", err);
      } finally {
        setRemovingBg(false);
      }
    } else {
      const blobIdx = combinedIdx - existingCount;
      const blobURL = form.profileImageBlobPreviews[blobIdx];
      setEditingProfileIndex(combinedIdx);
      setEditorSrc(blobURL);
      setStep("editor");
    }
  };

  const allProfileImages = [
    ...form.existingProfileImageURLs.map((url) => ({ url, isExisting: true })),
    ...form.profileImageBlobPreviews.map((url) => ({ url, isExisting: false })),
  ];

  // ── Social ─────────────────────────────────────────────────
  const handleSocialSameToggle = (platform) => {
    setForm((f) => {
      const sel = f.socialSameSelected.includes(platform)
        ? f.socialSameSelected.filter((p) => p !== platform)
        : [...f.socialSameSelected, platform];
      const socials = { ...f.socials };
      sel.forEach((p) => (socials[p] = f.socialSameId));
      return { ...f, socialSameSelected: sel, socials };
    });
  };

  const handleSocialSameIdChange = (val) => {
    setForm((f) => {
      const socials = { ...f.socials };
      f.socialSameSelected.forEach((p) => (socials[p] = val));
      return { ...f, socialSameId: val, socials };
    });
  };

  // ── Validation ─────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.designation) e.designation = "Select a designation";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── Firebase helpers ───────────────────────────────────────
  const uploadFile = async (file, path) => {
    const r = storageRef(storage, path);
    await uploadBytes(r, file);
    return getDownloadURL(r);
  };

  const uploadBlob = async (blob, path) => {
    const r = storageRef(storage, path);
    await uploadBytes(r, blob);
    return getDownloadURL(r);
  };

  // ── Save ───────────────────────────────────────────────────
  const handleSave = async () => {
    if (!validate()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const uid = existingDocId || Date.now().toString(36);

      const uploadedLogoURLs = await Promise.all(
        form.logoCustomFiles.map((item, i) =>
          uploadFile(item.file, `mlmprofiles/${uid}/logo_custom_${i}.png`)
        )
      );
      const allLogoURLs = [...form.logoSelectedLinks, ...uploadedLogoURLs];

      const newlyUploadedProfileURLs = await Promise.all(
        form.profileImageBlobs.map((blob, i) =>
          uploadBlob(blob, `mlmprofiles/${uid}/profile_${Date.now()}_${i}.png`)
        )
      );
      const allProfileImageURLs = [...form.existingProfileImageURLs, ...newlyUploadedProfileURLs];

      const uploadedTopupURLs = await Promise.all(
        form.topupCustomFiles.map((item, i) =>
          uploadFile(item.file, `mlmprofiles/${uid}/topup_custom_${i}.png`)
        )
      );
      const allTopupURLs = [...form.topupSelectedLinks, ...uploadedTopupURLs];

      const profileData = {
        fullName: `${form.salutation}.${form.name.trim()}`,
        mobile: userMobile,
        designation: form.designation,
        logoURLs: allLogoURLs,
        profileImageURLs: allProfileImageURLs,
        topuplineURLs: allTopupURLs,
        socials: form.socials,
        companyId: company?.id || null,
        updatedAt: serverTimestamp(),
      };

      if (isEditMode) {
        // ── Update existing doc ──────────────────────────────
        await updateDoc(doc(db, "mlmprofiles", existingDocId), profileData);

        // ✅ Update localStorage with latest data
        localStorage.setItem(
          "mlmProfile",
          JSON.stringify({ id: existingDocId, ...profileData })
        );
      } else {
        // ── Create new doc ───────────────────────────────────
        const newDoc = await addDoc(collection(db, "mlmprofiles"), {
          ...profileData,
          createdAt: serverTimestamp(),
        });

        // ✅ Save new profile to localStorage so route guards work
        localStorage.setItem(
          "mlmProfile",
          JSON.stringify({ id: newDoc.id, ...profileData })
        );
      }

      // ✅ Toast on screen
      toast.success(isEditMode ? "Profile updated successfully!" : "Profile saved successfully!");

      // ✅ Reload after short delay so toast is visible
      setTimeout(() => window.location.reload(), 1000);

    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════

  // ── Editor view ────────────────────────────────────────────
  if (step === "editor" && editorSrc) {
    return (
      <div className="flex flex-col dark:bg-black items-center justify-start min-h-screen p-2 bg-slate-50">
        <div className="w-full dark:bg-black max-w-full bg-white rounded-2xl shadow-lg p-6">
          <h2 className="text-base dark:text-white font-semibold text-slate-700 mb-4 text-center">
            Crop & Edit Photo
          </h2>
          <ImageEditorCanvas
            key={editorSrc}
            src={editorSrc}
            onDone={handleEditorDone}
            onCancel={() => {
              setStep("form");
              setEditorSrc(null);
              setEditingProfileIndex(null);
            }}
          />
        </div>
      </div>
    );
  }

  // ── Loading skeleton ───────────────────────────────────────
  if (loadingProfile) {
    return (
      <div className="max-w-lg mx-auto px-4 py-8 flex flex-col gap-4 animate-pulse">
        <div className="h-8 w-48 bg-slate-200 rounded-xl" />
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl" />
        ))}
      </div>
    );
  }

  // ── Main form ──────────────────────────────────────────────
  return (
    <div className="max-w-lg mx-auto p-2">

      {/* Page header */}
      <div className="mb-2">
        <h1 className="text-md dark:text-white font-bold text-slate-800">
          {isEditMode ? "Edit Profile" : "Create Profile"}
        </h1>
      </div>

      <div className="flex flex-col gap-6">

        {/* ── LOGO ──────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <label className="block dark:text-black text-sm font-semibold text-slate-700 mb-3">
            Company Logo
          </label>
          <div className="flex flex-col gap-2 items-center">
            {form.logoSelectedLinks.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {form.logoSelectedLinks.map((link, i) => (
                  <img key={i} src={link} alt="Logo" className="w-14 h-14 rounded-full object-contain border-2 border bg-slate-100" />
                ))}
              </div>
            )}
            <MultiImagePicker
              companyImages={logos}
              selectedLinks={form.logoSelectedLinks}
              onToggleLink={handleLogoToggleLink}
              customFiles={form.logoCustomFiles}
              onAddCustomFiles={handleLogoAddCustomFiles}
              onRemoveCustomFile={handleLogoRemoveCustomFile}
              inputRef={logoInputRef}
              companyGridCols={4}
              thumbHeight="h-14"
            />
          </div>
        </div>

        {/* ── FULL NAME + MOBILE + DESIGNATION ─────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">

          {/* Full Name */}
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Full Name <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2 mb-3">
            <select
              value={form.salutation}
              onChange={(e) => setField("salutation", e.target.value)}
              className="border dark:text-black border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              {["Mr", "Mrs", "Ms", "Dr"].map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <input
              type="text"
              placeholder="Enter name"
              value={form.name}
              onChange={(e) => { setField("name", e.target.value); clearError("name"); }}
              className={`flex-1 dark:text-black border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.name ? "border-red-400 bg-red-50" : "border-slate-300"}`}
            />
          </div>
          {errors.name && <p className="text-xs text-red-500 mt-1 mb-2">{errors.name}</p>}

          {/* Mobile */}
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Mobile Number
            <span className="ml-2 text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">🔒 Locked</span>
          </label>
          <div className="relative mb-3">
            <input
              type="tel"
              value={userMobile}
              readOnly
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">from account</span>
          </div>

          {/* Designation */}
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            Designation <span className="text-red-500">*</span>
          </label>
          <select
            value={form.designation}
            onChange={(e) => { setField("designation", e.target.value); clearError("designation"); }}
            className={`w-full border dark:text-black rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 ${errors.designation ? "border-red-400 bg-red-50" : "border-slate-300"}`}
          >
            <option value="">Select designation…</option>
            {designations.length > 0
              ? designations.map((d) => <option key={d.id} value={d.profilename}>{d.profilename}</option>)
              : <option disabled>No designations in company data</option>}
          </select>
          {errors.designation && <p className="text-xs text-red-500 mt-1">{errors.designation}</p>}

        </div>

        {/* ── PROFILE PHOTO ─────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Profile Photo
          </label>
          <div className="flex flex-col items-center gap-3">
            <div className="flex flex-wrap items-start gap-3 w-full">
              {allProfileImages.length > 0 ? (
                allProfileImages.map(({ url, isExisting }, idx) => (
                  <div key={idx} className="flex flex-col items-center gap-1">
                    <div className="relative">
                      <img
                        src={url}
                        alt={`Profile ${idx + 1}`}
                        className="w-20 h-20 rounded-xl object-cover border-2 border bg-slate-100"
                      />
                      {isExisting && (
                        <span className="absolute -top-1 -right-1 bg-green-500 text-white text-[9px] px-1.5 py-0.5 rounded-full leading-tight">
                          saved
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleRemoveProfileImage(idx); }}
                        className="px-2 py-1 text-xs rounded-lg bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 transition"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="w-20 h-20 rounded-full border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center text-slate-400 text-xs text-center px-2">
                  No photo
                </div>
              )}
            </div>
            <div
              onClick={() => !removingBg && profileInputRef.current?.click()}
              className={`text-sm w-full flex justify-center items-center gap-2 p-2.5 rounded-lg bg-slate-100 border text-gray-600 hover:bg-indigo-50 transition ${removingBg ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            >
              {removingBg ? (
                <>
                  <svg className="animate-spin w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Removing BG…
                </>
              ) : (
                <>
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent">
                    <path d="M4 5a2 2 0 012-2h2l1-1h2l1 1h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
                  </svg>
                  Upload Profile Image
                </>
              )}
            </div>
            <input ref={profileInputRef} type="file" accept="image/*" multiple onChange={handleProfileFileSelect} className="hidden" />
          </div>
        </div>

        {/* ── TOPUP LINE ────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Topup Line Images
          </label>
          <div className="flex flex-col gap-2 items-center">
            {form.topupSelectedLinks.length > 0 && (
              <div className="flex gap-2 flex-wrap justify-center">
                {form.topupSelectedLinks.map((link, i) => (
                  <img key={i} src={link} alt="Topup" className="w-14 h-14 rounded-full object-contain border-2 border bg-slate-100" />
                ))}
              </div>
            )}
            <MultiImagePicker
              companyImages={topuplines}
              selectedLinks={form.topupSelectedLinks}
              onToggleLink={handleTopupToggleLink}
              customFiles={form.topupCustomFiles}
              onAddCustomFiles={handleTopupAddCustomFiles}
              onRemoveCustomFile={handleTopupRemoveCustomFile}
              inputRef={topupInputRef}
              companyGridCols={3}
              thumbHeight="h-16"
            />
          </div>
        </div>

        {/* ── SOCIAL MEDIA ──────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Social Media Links{" "}
            <span className="text-slate-400 font-normal">(Optional)</span>
          </label>
          <div className="flex flex-col gap-3">
            {SOCIAL_PLATFORMS.map((platform) => (
              <div key={platform} className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
                  <SocialIcon name={platform} active={false} />
                </div>
                <input
                  type="text"
                  placeholder={`${platform} user ID`}
                  maxLength={60}
                  value={form.socials[platform]}
                  onChange={(e) => setForm((f) => ({ ...f, socials: { ...f.socials, [platform]: e.target.value } }))}
                  className="flex-1 dark:text-black border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <p className="text-sm font-medium text-slate-700 mb-2">Same ID across platforms?</p>
            <input
              type="text"
              placeholder="Shared user ID"
              maxLength={40}
              value={form.socialSameId}
              onChange={(e) => handleSocialSameIdChange(e.target.value)}
              className="w-full border dark:text-black border-indigo-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-3"
            />
            <p className="text-xs text-slate-500 mb-2">Select platforms to apply:</p>
            <div className="flex gap-3 flex-wrap">
              {SOCIAL_PLATFORMS.map((platform) => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handleSocialSameToggle(platform)}
                  className={`flex items-center justify-center w-12 h-12 rounded-full border-2 transition ${form.socialSameSelected.includes(platform)
                      ? "border-indigo-500 bg-indigo-500"
                      : "border-slate-300 bg-white hover:border-indigo-400"
                    }`}
                >
                  <SocialIcon name={platform} active={form.socialSameSelected.includes(platform)} />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── ERROR FEEDBACK ────────────────────────────────── */}
        {saveError && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
            ⚠️ {saveError}
          </div>
        )}

        {/* ── SAVE BUTTON ───────────────────────────────────── */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 rounded-xl bg-accent text-white text-sm font-semibold hover:bg-indigo-700 transition disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
        >
          {saving ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              {isEditMode ? "Updating…" : "Saving…"}
            </>
          ) : isEditMode ? " Update Profile" : " Save Profile"}
        </button>

        {/* bottom spacing for mobile nav bars */}
        <div className="h-6" />
      </div>
    </div>
  );
}