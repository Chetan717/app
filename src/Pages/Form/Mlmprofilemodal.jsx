import { useState, useRef, useEffect, useCallback } from "react";
import { db, app } from "../../../Firebase";
import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  serverTimestamp, query, where, getDocs,
} from "firebase/firestore";
import {
  getStorage, ref as storageRef,
  uploadBytes, getDownloadURL,
} from "firebase/storage";
import MultiImagePicker from "./MultiImagePicker";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { toast } from "@heroui/react";
import { useNavigate } from "react-router";

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
// DELETE CONFIRMATION MODAL
// ════════════════════════════════════════════════════════════
function DeleteConfirmModal({ userMobile, onConfirm, onCancel, deleting }) {
  const [inputMobile, setInputMobile] = useState("");
  const isMatch = inputMobile.trim() === userMobile.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-4">
        {/* Icon + Title */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-white">Delete Profile?</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
            This action is <span className="font-semibold text-red-500">Permanent</span> and cannot be undone.
            Your entire MLM profile will be deleted.
          </p>
        </div>

        {/* Mobile confirmation input */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wide">
            Confirm by entering your mobile number
          </label>
          <input
            type="tel"
            placeholder={`Enter Mobile Number`}
            value={inputMobile}
            onChange={(e) => setInputMobile(e.target.value)}
            className={`w-full border rounded-xl px-4 py-2.5 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition dark:bg-zinc-800 dark:text-white
              ${inputMobile.length > 0
                ? isMatch
                  ? "border-green-400 focus:ring-green-300 bg-green-50"
                  : "border-red-300 focus:ring-red-200 bg-red-50"
                : "border-slate-300 focus:ring-red-300"
              }`}
          />
          {inputMobile.length > 0 && !isMatch && (
            <p className="text-xs text-red-500">Mobile number doesn't match</p>
          )}
          {isMatch && (
            <p className="text-xs text-green-600 font-medium">✓ Mobile number confirmed</p>
          )}
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={deleting}
            className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 text-sm font-medium hover:bg-slate-50 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!isMatch || deleting}
            className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-md"
          >
            {deleting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Deleting…
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
                Delete Profile
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
// PAGE COMPONENT
// ════════════════════════════════════════════════════════════
export default function MLMProfilePage() {
  const navigate = useNavigate();
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

  // Delete states
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  // ── fetchProfile (extracted so it can be called after save too) ──
  const fetchProfile = useCallback(async () => {
    if (!userMobile) { setLoadingProfile(false); return; }
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
  }, [userMobile]);

  // ── Fetch on mount ─────────────────────────────────────────
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

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
    const file = e.target.files[0];
    if (!file) return;
    setRemovingBg(true);
    try {
      const noBgBlob = await removeBackground(file);
      const blob = noBgBlob || file;
      setEditorSrc(URL.createObjectURL(blob));
      setEditingProfileIndex("new");
      setForm((f) => ({ ...f, _pendingProfileBlobs: [] }));
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
        await updateDoc(doc(db, "mlmprofiles", existingDocId), profileData);
        localStorage.setItem(
          "mlmProfile",
          JSON.stringify({ id: existingDocId, ...profileData })
        );
      } else {
        const newDoc = await addDoc(collection(db, "mlmprofiles"), {
          ...profileData,
          createdAt: serverTimestamp(),
        });
        localStorage.setItem(
          "mlmProfile",
          JSON.stringify({ id: newDoc.id, ...profileData })
        );
      }

      toast.success(isEditMode ? "Profile updated successfully!" : "Profile saved successfully!");

      // ✅ Re-fetch from Firestore and update state — no page reload needed
      await fetchProfile();

    } catch (err) {
      console.error("Save error:", err);
      setSaveError(err?.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────
  const handleDeleteConfirm = async () => {
    if (!existingDocId) return;
    setDeleting(true);
    try {
      const q = query(collection(db, "mlmprofiles"), where("mobile", "==", userMobile));
      const snap = await getDocs(q);

      if (!snap.empty) {
        await deleteDoc(doc(db, "mlmprofiles", snap.docs[0].id));
      }

      localStorage.removeItem("mlmProfile");

      toast.success("Profile deleted successfully.");
      setShowDeleteModal(false);

      setTimeout(() => navigate("/logout"), 800);
    } catch (err) {
      console.error("Delete error:", err);
      toast.error("Failed to delete profile. Please try again.");
    } finally {
      setDeleting(false);
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
    <>
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          userMobile={userMobile}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setShowDeleteModal(false)}
          deleting={deleting}
        />
      )}

      <div className="max-w-lg mx-auto p-2">

        {/* Page header */}
        <div className="mb-2">
          <h1 className="text-md dark:text-white font-bold text-slate-800">
            {isEditMode ? "Profile" : "Create Profile"}
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
                          className="w-20 h-20 rounded-xl object-contain border-2 border bg-slate-100"
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
                          className=" w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow "
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
              <input ref={profileInputRef} type="file" accept="image/*" onChange={handleProfileFileSelect} className="hidden" />
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
                    <div key={i} className="relative group">
                      <img
                        src={link}
                        alt="Topup"
                        className="w-14 h-14 rounded-full object-contain border-2 border bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => handleTopupToggleLink(link)}
                        className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow "
                        title="Deselect"
                      >
                        ✕
                      </button>
                    </div>
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

          {/* ── DELETE PROFILE SECTION ────────────────────────── */}
          {isEditMode && (
            <div className="rounded-2xl border border-red-100 bg-red-50/60 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs text-red-500 mt-0.5 leading-relaxed">
                    Permanently delete your MLM profile. This cannot be undone and you will be logged out.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(true)}
                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-600 hover:text-white hover:border-red-600 transition shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                    </svg>
                    Delete My Profile
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* bottom spacing for mobile nav bars */}
          <div className="h-6" />
        </div>
      </div>
    </>
  );
}