import { useState, useEffect } from "react";
import { Modal } from "@heroui/react";

export default function MultiImagePicker({
  companyImages,
  selectedLinks,
  onToggleLink,
  customFiles,
  onAddCustomFiles,
  onRemoveCustomFile,
  inputRef,
  companyGridCols = 4,
  thumbHeight = "h-10",
  maxImages = 7, // ✅ max limit
}) {
  const [tab, setTab] = useState("company");
  const [open, setOpen] = useState(false);

  const handleClose = () => {
    setOpen(false);
  };

  const colClass = {
    3: "grid-cols-3",
    4: "grid-cols-4",
  }[companyGridCols] || "grid-cols-4";

  // ✅ total count
  const totalSelected = selectedLinks.length + customFiles.length;
  console.log(totalSelected);
  
  const isLimitReached = totalSelected >= maxImages;

  // ✅ auto close modal when limit reached (nice UX)
  useEffect(() => {
    if (isLimitReached) {
      setTimeout(() => setOpen(false), 400);
    }
  }, [isLimitReached]);

  return (
    <>
      {/* Open Picker Button */}
      <div
        onClick={() => setOpen(true)}
        className="text-white flex gap-1 border justify-center items-center font-semibold bg-slate-100 p-3 rounded-xl w-full transition"
      >
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 text-accent">
          <path d="M4 5a2 2 0 012-2h2l1-1h2l1 1h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
        </svg>
        <p className="text-gray-600 text-xs">Upload Image</p>
      </div>

      {/* Modal */}
      <Modal isOpen={open} onOpenChange={handleClose}>
        <Modal.Backdrop>
          <Modal.Container className="w-full">
            <Modal.Dialog className="rounded-2xl shadow-2xl bg-white">
              <Modal.CloseTrigger />

              <Modal.Header>
                <Modal.Heading className="text-xl font-bold mb-5 text-slate-800">
                  Select Images
                </Modal.Heading>
              </Modal.Header>

              <div className="flex flex-col gap-2 justify-center items-center">

                {/* Tabs */}
                <div className="flex justify-center items-center gap-3 mb-3">
                  {[
                    { key: "company", label: "From company" },
                    { key: "upload", label: "Upload manually" },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setTab(key)}
                      className={`px-4 py-1.5 rounded-full text-xs font-medium border transition ${
                        tab === key
                          ? "bg-accent text-white border-accent"
                          : "bg-white border-slate-300 text-slate-600 hover:border-indigo-400"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* ── Company Images ── */}
                {tab === "company" && (
                  <>
                    {companyImages.length === 0 ? (
                      <p className="text-xs text-slate-400">
                        No images found in company data.
                      </p>
                    ) : (
                      <div className={`grid ${colClass} gap-3`}>
                        {companyImages.map((img) => {
                          const selected = selectedLinks.includes(img.link);

                          return (
                            <button
                              key={img.id}
                              type="button"
                              onClick={() => {
                                if (!selected && isLimitReached) return;
                                onToggleLink(img.link);
                              }}
                              className={`relative border-2 rounded-xl p-1 w-[70px] h-[70px] transition overflow-hidden bg-slate-50 ${
                                selected
                                  ? "border-accent shadow-md"
                                  : isLimitReached
                                  ? "border-slate-200 opacity-50 cursor-not-allowed"
                                  : "border-slate-200 hover:border-accent"
                              }`}
                            >
                              {img.link ? (
                                <img
                                  src={img.link}
                                  alt=""
                                  className="w-[70px] h-[70px] object-contain rounded-lg"
                                />
                              ) : (
                                <div className="w-full h-full bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs">
                                  No image
                                </div>
                              )}

                              {/* Selected Tick */}
                              {selected && (
                                <span className="absolute top-1 right-1 w-5 h-5 bg-accent rounded-full flex items-center justify-center shadow">
                                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                                    <path
                                      d="M2 6l3 3 5-5"
                                      stroke="#fff"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* ── Upload Tab ── */}
                {tab === "upload" && (
                  <>
                    <button
                      type="button"
                      disabled={isLimitReached}
                      onClick={() => inputRef.current?.click()}
                      className={`mb-3 px-2 py-2 text-xs rounded-lg shadow-sm font-bold transition flex items-center gap-1 ${
                        isLimitReached
                          ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                          : "bg-slate-100 text-gray-600 hover:bg-indigo-100"
                      }`}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-accent">
                        <path d="M4 5a2 2 0 012-2h2l1-1h2l1 1h2a2 2 0 012 2v9a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm6 3a3 3 0 100 6 3 3 0 000-6z" />
                      </svg>
                      Upload Images
                    </button>

                    <input
                      ref={inputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={(e) => {
                        const files = Array.from(e.target.files || []);
                        if (!files.length) return;

                        const remaining = maxImages - totalSelected;
                        const allowedFiles = files.slice(0, remaining);

                        onAddCustomFiles(allowedFiles);
                        e.target.value = "";
                      }}
                    />

                    {customFiles.length > 0 && (
                      <div className={`grid ${colClass} gap-3`}>
                        {customFiles.map((item, i) => (
                          <div
                            key={i}
                            className="relative border-2 border-indigo-400 rounded-xl p-1.5 bg-slate-50 overflow-hidden"
                          >
                            <img
                              src={item.previewURL}
                              alt=""
                              className={`w-full ${thumbHeight} object-contain rounded-lg`}
                            />

                            <button
                              type="button"
                              onClick={() => onRemoveCustomFile(i)}
                              className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition shadow"
                            >
                              <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                                <path
                                  d="M2 2l8 8M10 2l-8 8"
                                  stroke="#fff"
                                  strokeWidth="1.8"
                                  strokeLinecap="round"
                                />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}

                {/* Count Indicator */}
                <p
                  className={`text-xs mt-2 font-medium ${
                    isLimitReached ? "text-red-500" : "text-accent"
                  }`}
                >
                  {totalSelected} / {maxImages} image(s) selected
                </p>
              </div>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </>
  );
}