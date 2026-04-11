import { useState, useEffect, useRef } from "react";
import {
  Person,
  PersonPlus,
  PersonGear,
  Persons,
  LocationArrow,
  Handset,
  CircleDollar,
  Picture,
  Briefcase,
  Medal,
  TriangleRightFill,
  CircleCheck,
  TriangleExclamationFill,
  TriangleRight,
} from "@gravity-ui/icons";
import {
  Button,
  Card,
  Input,
  Label,
  TextField,
  FieldError,
  InputGroup,
  Select,
  ListBox,
  Tabs,
  Modal,
} from "@heroui/react";
import MultiImagePicker from "./MultiImagePicker";
import ImageUploadWithBgRemove from "./ImageUploadWithBgRemove";
import { ImageEditorCanvas } from "./ImageEditorCanvas";
import { useNavigate } from "react-router";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert a base64 data-URL back to a Blob so image state stays consistent */
function base64ToBlob(dataUrl) {
  if (!dataUrl) return null;
  try {
    const [header, data] = dataUrl.split(",");
    const mime = header.match(/:(.*?);/)[1];
    const binary = atob(data);
    const arr = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
    return new Blob([arr], { type: mime });
  } catch {
    return null;
  }
}

const toBase64 = (blob) =>
  new Promise((res) => {
    if (!blob) return res(null);
    // Already a data-URL string (restored from storage)
    if (typeof blob === "string") return res(blob);
    const reader = new FileReader();
    reader.onloadend = () => res(reader.result);
    reader.readAsDataURL(blob);
  });

// ─── Inline field error ───────────────────────────────────────────────────────
function InlineError({ message }) {
  if (!message) return null;
  return (
    <div className="flex items-center gap-1 mt-1">
      <TriangleExclamationFill
        width={12}
        height={12}
        className="text-danger flex-shrink-0"
      />
      <p className="text-danger text-xs">{message}</p>
    </div>
  );
}

// ─── Upload zone ─────────────────────────────────────────────────────────────
function UploadZone({ label, hasError, onClick }) {
  return (
    <div
      onClick={onClick}
      className={[
        "flex flex-col items-center justify-center gap-2 py-5 px-4",
        "border-2 border-dashed rounded-xl cursor-pointer transition-colors",
        hasError
          ? "border-danger bg-danger-50"
          : "border-default-300 bg-default-50 hover:border-primary hover:bg-primary-50",
      ].join(" ")}
    >
      <Picture
        width={28}
        height={28}
        className={hasError ? "text-danger" : "text-primary"}
      />
      <p className="text-sm text-default-600 font-medium">{label}</p>
      <p className="text-xs text-default-400">
        PNG, JPG · Background removal supported
      </p>
    </div>
  );
}

// ─── Upload success row ───────────────────────────────────────────────────────
function UploadedRow({ onRemove }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-success-50 border border-success-200">
      <CircleCheck width={18} height={18} className="text-success" />
      <p className="text-sm text-success-700 font-medium">Photo uploaded</p>
      <button
        className="ml-auto text-xs text-default-500 underline"
        onClick={onRemove}
      >
        Remove
      </button>
    </div>
  );
}

// ─── Reusable text field with icon prefix ─────────────────────────────────────
function IconTextField({
  label,
  placeholder,
  type = "text",
  icon: Icon,
  value,
  onChange,
  error,
}) {
  return (
    <div>
      <TextField isInvalid={!!error} className="w-full">
        <Label className="text-sm font-medium">{label}</Label>
        <InputGroup>
          <InputGroup.Prefix className="pl-3">
            <Icon width={15} height={15} className="text-primary" />
          </InputGroup.Prefix>
          <InputGroup.Input
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="pl-2"
          />
        </InputGroup>
        <FieldError />
      </TextField>
      <InlineError message={error} />
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function SalesExecutiveForm() {
  const [tab, setTab] = useState("team");
  const [company, setCompany] = useState(null);
  const [open, setOpen] = useState(false);

  const navigate = useNavigate();
  const [selectedLinks, setSelectedLinks] = useState([]);
  const [customFiles, setCustomFiles] = useState([]);
  const inputRef = useRef();

  const [editingImage, setEditingImage] = useState(null);
  const [onImageDone, setOnImageDone] = useState(null);

  const [achiever, setAchiever] = useState({});
  const [promoter, setPromoter] = useState({});
  const [errors, setErrors] = useState({});

  // ── Restore state from localStorage on mount ──────────────────────────────
  useEffect(() => {
    // 1. Company
    const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
    if (companyData) setCompany(companyData);

    // 2. mlmProfile (top-upline URLs set externally, e.g. from profile page)
    const mlmProfile = JSON.parse(localStorage.getItem("mlmProfile"));

    // 3. Previously saved form — takes priority over mlmProfile for selectedLinks
    const saved = JSON.parse(localStorage.getItem("mlmform"));

    if (saved) {
      // Restore tab
      if (saved.tab) setTab(saved.tab);

      // Restore achiever (image stays as base64 string; components handle both Blob & string)
      if (saved.achiever) {
        setAchiever({
          ...saved.achiever,
          // Keep as base64 string; ImageUploadWithBgRemove should accept it via currentImage
          image: saved.achiever.image || null,
        });
      }

      // Restore promoter
      if (saved.promoter) {
        setPromoter({
          ...saved.promoter,
          image: saved.promoter.image || null,
        });
      }

      // Restore selected upline links (saved form overrides mlmProfile)
      if (saved.selectedLinks?.length) {
        setSelectedLinks(saved.selectedLinks);
      } else if (mlmProfile?.topuplineURLs?.length) {
        setSelectedLinks(mlmProfile.topuplineURLs);
      }
    } else if (mlmProfile?.topuplineURLs?.length) {
      // No saved form yet — seed from mlmProfile
      setSelectedLinks(mlmProfile.topuplineURLs);
    }
  }, []);

  // ─── Validation ────────────────────────────────────────────────────────────
  const validate = () => {
    const newErrors = {};
    if (!achiever.name?.trim()) newErrors.achieverName = "Name is required";
    if (!achiever.city?.trim()) newErrors.achieverCity = "City is required";
    if (!achiever.amount?.toString().trim())
      newErrors.achieverAmount = "Amount is required";
    if (!achiever.image) newErrors.achieverImage = "Photo is required";
    if (tab === "self") {
      if (!promoter.name?.trim()) newErrors.promoterName = "Name is required";
      if (!promoter.role) newErrors.promoterRole = "Role is required";
      if (!promoter.mobile?.trim())
        newErrors.promoterMobile = "Mobile is required";
      if (!promoter.image) newErrors.promoterImage = "Photo is required";
    }
    if (selectedLinks.length === 0 && customFiles.length === 0)
      newErrors.topupline = "Select at least 1 image";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const clearError = (key) => {
    if (errors[key])
      setErrors((prev) => {
        const e = { ...prev };
        delete e[key];
        return e;
      });
  };

  const toggleLink = (link) => {
    setSelectedLinks((prev) =>
      prev.includes(link) ? prev.filter((l) => l !== link) : [...prev, link],
    );
  };

  // ─── Submit & persist ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!validate()) return;

    const formData = {
      tab,
      achiever: {
        ...achiever,
        // If image is already a base64 string (restored), keep it; else convert Blob
        image: achiever.image ? await toBase64(achiever.image) : null,
      },
      promoter:
        tab === "self"
          ? {
              ...promoter,
              image: promoter.image ? await toBase64(promoter.image) : null,
            }
          : null,
      selectedLinks,
    };

    localStorage.setItem("mlmform", JSON.stringify(formData));
    navigate("/Editor");
  };

  // ─── Clear saved form (optional reset button) ──────────────────────────────
  const handleReset = () => {
    localStorage.removeItem("mlmform");
    setTab("team");
    setAchiever({});
    setPromoter({});
    setSelectedLinks(() => {
      const mlmProfile = JSON.parse(localStorage.getItem("mlmProfile"));
      return mlmProfile?.topuplineURLs || [];
    });
    setCustomFiles([]);
    setErrors({});
  };

  return (
    <div className="w-full mx-auto p-2 pb-10 space-y-4">
      {/* ── Tabs ── */}
      <Tabs selectedKey={tab} onSelectionChange={setTab} className="w-full">
        <Tabs.ListContainer>
          <Tabs.List
            aria-label="Form type"
            className="bg-slate-100 p-1 rounded-xl w-full *:text-sm *:data-[selected=true]:text-accent-foreground"
          >
            <Tabs.Tab
              id="team"
              className="flex-1 flex items-center justify-center gap-2 font-medium text-sm h-9"
            >
              <Persons width={15} height={15} />
              For Team
              <Tabs.Indicator className="bg-accent text-white" />
            </Tabs.Tab>
            <Tabs.Tab
              id="self"
              className="flex-1 flex items-center justify-center gap-2 font-medium text-sm h-9"
            >
              <Person width={15} height={15} />
              For Self
              <Tabs.Indicator className="bg-accent text-white" />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>
      </Tabs>

      {/* ── Top Upline Images ── */}
      {company && (
        <Card className="border border-default-200 shadow-none">
          <Card.Content className="p-2">
            <p className="p-2 text-sm text-accent font-bold">
              Top Upline Images
            </p>
            <div className="flex flex-col gap-2 items-center">
              {selectedLinks?.length > 0 && (
                <div className="flex gap-2 flex-wrap justify-center">
                  {selectedLinks?.map((link, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={link}
                        alt="Logo"
                        className="w-14 h-14 rounded-full object-contain border-2 border bg-slate-100"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          toggleLink(link);
                          clearError("topupline");
                        }}
                        className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center shadow"
                        title="Deselect"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <MultiImagePicker
                companyImages={company.topuplines || []}
                selectedLinks={selectedLinks}
                onToggleLink={(link) => {
                  toggleLink(link);
                  clearError("topupline");
                }}
                customFiles={customFiles}
                onAddCustomFiles={(files) => {
                  setCustomFiles(files);
                  clearError("topupline");
                }}
                onRemoveCustomFile={(i) =>
                  setCustomFiles((prev) => prev.filter((_, idx) => idx !== i))
                }
                inputRef={inputRef}
              />
            </div>
            <InlineError message={errors.topupline} />
          </Card.Content>
        </Card>
      )}

      {/* ── Achiever Details ── */}
      <Card className="border border-default-200 shadow-none">
        <Card.Content className="p-4 space-y-3">
          <p className="text-sm text-accent font-bold">Achiever details</p>
          <div className="flex w-full flex-col gap-3 justify-start items-start">
            <div className="flex flex-col gap-3">
              <IconTextField
                label="Name"
                placeholder="Full name"
                icon={Person}
                value={achiever.name || ""}
                onChange={(v) => {
                  setAchiever((p) => ({ ...p, name: v }));
                  clearError("achieverName");
                }}
                error={errors.achieverName}
              />

              <IconTextField
                label="From team / City"
                placeholder="City or team name"
                icon={LocationArrow}
                value={achiever.city || ""}
                onChange={(v) => {
                  setAchiever((p) => ({ ...p, city: v }));
                  clearError("achieverCity");
                }}
                error={errors.achieverCity}
              />

              <IconTextField
                label="Amount (₹)"
                placeholder="e.g. 50000"
                type="number"
                icon={CircleDollar}
                value={achiever.amount || ""}
                onChange={(v) => {
                  setAchiever((p) => ({ ...p, amount: v }));
                  clearError("achieverAmount");
                }}
                error={errors.achieverAmount}
              />
            </div>

            {/* Achiever Photo */}
            <div className="h-full w-full">
              <p className="text-sm font-medium text-foreground mb-1.5">
                Achiever Photo
              </p>
              <ImageUploadWithBgRemove
                onImageReady={(img) => {
                  setAchiever((p) => ({ ...p, image: img }));
                  clearError("achieverImage");
                }}
                setEditingImage={setEditingImage}
                setOnImageDone={setOnImageDone}
                // Pass base64 string so the component shows the restored preview
                currentImage={achiever.image}
                trigger={
                  <UploadZone
                    label="Upload achiever photo"
                    hasError={!!errors.achieverImage}
                  />
                }
                setOpen={setOpen}
                open={open}
              />
              <InlineError message={errors.achieverImage} />
            </div>
          </div>
        </Card.Content>
      </Card>

      {/* ── Promoter Details (For Self only) ── */}
      {tab === "self" && company && (
        <Card className="border border-default-200 shadow-none">
          <Card.Content className="p-4 space-y-3">
            <p className="text-sm text-accent font-bold">Promoter details</p>
            <div className="flex w-full flex-col gap-3 justify-start items-start">
              <div className="flex flex-col gap-3">
                <IconTextField
                  label="Name"
                  placeholder="Promoter full name"
                  icon={PersonPlus}
                  value={promoter.name || ""}
                  onChange={(v) => {
                    setPromoter((p) => ({ ...p, name: v }));
                    clearError("promoterName");
                  }}
                  error={errors.promoterName}
                />

                {/* Role select */}
                <div>
                  <Select
                    placeholder="Select role"
                    isInvalid={!!errors.promoterRole}
                    selectedKey={promoter.role || null}
                    onSelectionChange={(key) => {
                      setPromoter((p) => ({ ...p, role: key }));
                      clearError("promoterRole");
                    }}
                    className="w-full"
                  >
                    <Label className="text-sm font-medium">Role</Label>
                    <Select.Trigger>
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {(company.profile || []).map((p) => (
                          <ListBox.Item
                            key={p.profilename}
                            id={p.profilename}
                            textValue={p.profilename}
                          >
                            <Briefcase
                              width={14}
                              height={14}
                              className="text-primary mr-2 flex-shrink-0"
                            />
                            {p.profilename}
                            <ListBox.ItemIndicator />
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                  <InlineError message={errors.promoterRole} />
                </div>

                <IconTextField
                  label="Mobile"
                  placeholder="+91 00000 00000"
                  type="tel"
                  icon={Handset}
                  value={promoter.mobile || ""}
                  onChange={(v) => {
                    setPromoter((p) => ({ ...p, mobile: v }));
                    clearError("promoterMobile");
                  }}
                  error={errors.promoterMobile}
                />
              </div>

              {/* Promoter Photo */}
              <div className="h-full w-full">
                <p className="text-sm font-medium text-foreground mb-1.5">
                  Promoter Photo
                </p>
                <ImageUploadWithBgRemove
                  onImageReady={(img) => {
                    setPromoter((p) => ({ ...p, image: img }));
                    clearError("promoterImage");
                  }}
                  setEditingImage={setEditingImage}
                  setOnImageDone={setOnImageDone}
                  currentImage={promoter.image}
                  trigger={
                    <UploadZone
                      label="Upload promoter photo"
                      hasError={!!errors.promoterImage}
                    />
                  }
                  setOpen={setOpen}
                  open={open}
                />
              </div>
              <InlineError message={errors.promoterImage} />
            </div>
          </Card.Content>
        </Card>
      )}

      {/* ── Actions ── */}
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          className="w-full font-semibold text-base mt-2"
          onPress={handleSubmit}
        >
          <CircleCheck width={18} height={18} className="mr-1" />
          Save & Create
        </Button>

        {/* Reset button — clears saved form data */}
        <Button
          size="md"
          variant="light"
          className="w-full text-sm text-default-500"
          onPress={handleReset}
        >
          Reset Form
        </Button>
      </div>

      {/* ── Image Editor Canvas ── */}
      <Modal isOpen={open}>
        <Modal.Backdrop>
          <Modal.Container placement="center">
            <Modal.Dialog className="sm:max-w-[360px]">
              <Modal.CloseTrigger />
              <Modal.Header>
                <Modal.Icon className="bg-default text-foreground" />
              </Modal.Header>
              <Modal.Body>
                <ImageEditorCanvas
                  src={editingImage}
                  onDone={(blob) => {
                    onImageDone(blob);
                    setEditingImage(null);
                  }}
                  onCancel={() => setEditingImage(null)}
                  setOpen={setOpen}
                />
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal>
    </div>
  );
}
