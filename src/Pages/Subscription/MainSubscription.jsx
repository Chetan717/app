import React, { useEffect, useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { Modal, Button, Chip, Skeleton } from "@heroui/react";
import { db } from "../../../Firebase";
import { doc, getDoc } from "firebase/firestore";
import "swiper/css";
import "swiper/css/pagination";

// ─── Helper: convert Firestore timestamp object ───────────────────────────────
const formatTimestamp = (ts) => {
  if (!ts) return "N/A";
  const date = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// Razorpay Payment Function — ready to wire up later, not called yet
// ─────────────────────────────────────────────────────────────────────────────
const initiateRazorpayPayment = ({
  plan,
  couponCode,
  userInfo,
  onSuccess,
  onFailure,
}) => {
  const options = {
    key: process.env.REACT_APP_RAZORPAY_KEY_ID, // set in .env
    amount: (plan.PlanAmount ?? 0) * 100, // Razorpay expects paise
    currency: "INR",
    name: "Subscription",
    description: plan.PlanName || "Plan Purchase",
    handler: function (response) {
      // response contains: razorpay_payment_id, razorpay_order_id, razorpay_signature
      if (onSuccess) onSuccess(response);
    },
    prefill: {
      name: userInfo?.name || "",
      email: userInfo?.email || "",
      contact: userInfo?.phone || "",
    },
    notes: {
      plan_id: plan.id || "",
      coupon_code: couponCode || "",
    },
    theme: {
      color: "var(--color-accent, #6366f1)",
    },
    modal: {
      ondismiss: function () {
        if (onFailure) onFailure({ reason: "Payment dismissed by user" });
      },
    },
  };

  if (!window.Razorpay) {
    console.error("Razorpay SDK not loaded. Add the script tag to index.html.");
    return;
  }

  const rzp = new window.Razorpay(options);
  rzp.on("payment.failed", function (response) {
    if (onFailure) onFailure(response.error);
  });

  rzp.open(); // ← This line triggers the Razorpay popup
};

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Modal
// ─────────────────────────────────────────────────────────────────────────────
export function CheckoutModal({ plan, isOpen, setIsOpen, onBack }) {
  const [coupon, setCoupon] = useState(["", "", "", "", "", ""]);
  const [couponStatus, setCouponStatus] = useState(null); // null | "valid" | "invalid"
  const inputRefs = useRef([]);

  if (!plan) return null;

  const today = new Date();
  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + (plan.Day_value ?? 0));

  const couponString = coupon.join("");
  const isCouponFilled = couponString.length === 6;

  // OTP-style coupon handlers
  const handleCouponChange = (val, idx) => {
    const char = val
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(-1);
    const next = [...coupon];
    next[idx] = char;
    setCoupon(next);
    setCouponStatus(null);
    if (char && idx < 5) inputRefs.current[idx + 1]?.focus();
  };

  const handleCouponKeyDown = (e, idx) => {
    if (e.key === "Backspace" && !coupon[idx] && idx > 0) {
      inputRefs.current[idx - 1]?.focus();
    }
  };

  const handleCouponPaste = (e) => {
    const text = e.clipboardData
      .getData("text")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(0, 6);
    if (text.length === 6) {
      setCoupon(text.split(""));
      setCouponStatus(null);
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleApplyCoupon = () => {
    // TODO: validate against Firestore/API — mocked for now
    if (couponString === "TEST01") {
      setCouponStatus("valid");
    } else {
      setCouponStatus("invalid");
    }
  };

  const handleClearCoupon = () => {
    setCoupon(["", "", "", "", "", ""]);
    setCouponStatus(null);
    inputRefs.current[0]?.focus();
  };

  const handleConfirmPurchase = () => {
    initiateRazorpayPayment({
      plan,
      couponCode: isCouponFilled ? couponString : "",
      userInfo: {}, // TODO: pass real user info here
      onSuccess: (response) => {
        console.log("✅ Payment success:", response);
        // TODO: update Firestore subscription, show success screen
      },
      onFailure: (error) => {
        console.error("❌ Payment failed:", error);
        // TODO: show error toast
      },
    });
  };

  return (
    <Modal isOpen={isOpen}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-md rounded-2xl border dark:border-white/10 border-black/10 shadow-2xl bg-white dark:bg-[#0f1117] overflow-hidden">
            <Modal.Body className="space-y-4 pt-0">
              {/* ── Plan card ── */}
              <div className="rounded-xl border border-accent/25 bg-accent/5 p-4 flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center text-xl shrink-0">
                  📋
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold dark:text-white text-gray-900 text-sm truncate">
                    {plan.PlanName || "Unnamed Plan"}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-0.5">
                    {plan.Type || "—"} &nbsp;·&nbsp; {plan.Day_value ?? 0} Days
                  </p>
                </div>
                <p className="text-lg font-extrabold text-accent shrink-0">
                  ₹{plan.PlanAmount ?? 0}
                </p>
              </div>

              {/* ── Validity strip ── */}
              <div className="rounded-xl bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10 px-4 py-3 flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                    Start
                  </p>
                  <p className="text-xs font-semibold dark:text-white text-gray-800">
                    {formatDate(today)}
                  </p>
                </div>
                <div className="flex-1 flex flex-col items-center gap-0.5">
                  <div className="w-full flex items-center gap-1">
                    <div className="flex-1 h-px bg-accent/30" />
                    <div className="w-2 h-2 rounded-full bg-accent" />
                    <div className="flex-1 h-px bg-accent/30" />
                  </div>
                  <p className="text-[10px] text-accent font-semibold">
                    {plan.Day_value ?? 0} Days
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                    Expiry
                  </p>
                  <p className="text-xs font-semibold text-red-500 dark:text-red-400">
                    {formatDate(expiryDate)}
                  </p>
                </div>
              </div>

              {/* ── Coupon section ── */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest flex items-center gap-1">
                    <span>🏷️</span> Coupon Code
                  </p>
                  <div className="flex-1 h-px dark:bg-white/10 bg-black/10" />
                </div>

                {/* 6-box OTP input */}
                <div
                  className="flex items-center justify-center gap-2"
                  onPaste={handleCouponPaste}
                >
                  {coupon.map((char, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (inputRefs.current[idx] = el)}
                      type="text"
                      inputMode="text"
                      maxLength={1}
                      value={char}
                      onChange={(e) => handleCouponChange(e.target.value, idx)}
                      onKeyDown={(e) => handleCouponKeyDown(e, idx)}
                      className={[
                        "w-10 h-11 text-center text-sm font-bold rounded-xl border-2 outline-none",
                        "transition-all duration-150 dark:bg-white/5 bg-black/5",
                        "dark:text-white text-gray-900 focus:border-accent focus:bg-accent/5",
                        couponStatus === "valid"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          : couponStatus === "invalid"
                            ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
                            : "dark:border-white/10 border-black/15",
                      ].join(" ")}
                    />
                  ))}
                </div>

                {/* Status + actions */}
                <div className="flex items-center justify-between px-1 min-h-[20px]">
                  <span className="text-xs font-medium">
                    {couponStatus === "valid" && (
                      <span className="text-green-500 flex items-center gap-1">
                        ✅ Coupon applied!
                      </span>
                    )}
                    {couponStatus === "invalid" && (
                      <span className="text-red-500 flex items-center gap-1">
                        ❌ Invalid coupon code
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {isCouponFilled && couponStatus !== "valid" && (
                      <button
                        onClick={handleApplyCoupon}
                        className="text-xs font-bold text-accent underline underline-offset-2"
                      >
                        Apply
                      </button>
                    )}
                    {couponString && (
                      <button
                        onClick={handleClearCoupon}
                        className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Price breakdown ── */}
              <div className="rounded-xl bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    Plan Amount
                  </span>
                  <span className="dark:text-white text-gray-800 font-medium">
                    ₹{plan.PlanAmount ?? 0}
                  </span>
                </div>
                {couponStatus === "valid" && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">Coupon Discount</span>
                    <span className="text-green-500 font-medium">— ₹0</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400">
                    GST / Taxes
                  </span>
                  <span className="dark:text-white text-gray-800 font-medium">
                    Included
                  </span>
                </div>
                <div className="h-px dark:bg-white/10 bg-black/10 my-1" />
                <div className="flex justify-between text-base font-bold">
                  <span className="dark:text-white text-gray-900">
                    Total Payable
                  </span>
                  <span className="text-accent">₹{plan.PlanAmount ?? 0}</span>
                </div>
              </div>
            </Modal.Body>

            {/* Footer */}
            <Modal.Footer className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleConfirmPurchase}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-white bg-accent
                  hover:opacity-90 active:scale-[0.98] transition-all duration-150
                  flex items-center justify-center gap-2 shadow-lg shadow-accent/25"
              >
                <span>🔒</span>
                Confirm Purchase &nbsp;·&nbsp; ₹{plan.PlanAmount ?? 0}
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onBack) onBack();
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium
                  dark:text-gray-400 text-gray-500
                  dark:hover:bg-white/5 hover:bg-black/5
                  transition-colors duration-150"
              >
                ← Back to Plan Details
              </button>

              <p className="text-center text-[10px] text-gray-400 pb-1">
                🔐 Secured by Razorpay &nbsp;·&nbsp; 256-bit SSL Encryption
              </p>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ─── Plan Details Modal ───────────────────────────────────────────────────────
export function PlanModal({
  plan,
  isOpen,
  openA,
  setOpenA,
  onProceedToCheckout,
}) {
  if (!plan) return null;

  const details = [
    { label: "Plan Amount", value: `₹${plan.PlanAmount ?? 0}` },
    { label: "Duration", value: `${plan.Day_value} Days` || "—" },
    { label: "Type", value: plan.Type || "—" },
    { label: "Downloads", value: plan.downloads ?? 0 },
  ];

  const today = new Date();
  const formatDate = (date) =>
    date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + (plan.Day_value ?? 0));

  const startStr = formatDate(today);
  const expiryStr = formatDate(expiryDate);

  return (
    <Modal isOpen={openA}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="max-w-lg rounded-2xl border dark:border-white/10 border-black/10 shadow-2xl bg-white dark:bg-[#0f1117]">
            <Modal.Header>
              <div className="flex flex-col gap-1">
                <span className="text-xl font-bold dark:text-white text-gray-900">
                  {plan.PlanName || "Unnamed Plan"}
                </span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={plan.Launch ? "success" : "danger"}
                  className="w-fit"
                >
                  {plan.Launch ? "Active" : "Inactive"}
                </Chip>
              </div>
            </Modal.Header>

            <Modal.Body className="space-y-4">
              {plan.Description && (
                <p className="text-sm dark:text-gray-400 text-gray-600 border-l-2 border-accent pl-3">
                  {plan.Description}
                </p>
              )}

              <div className="grid grid-cols-2 gap-3">
                {details?.map((detail) => (
                  <div
                    key={detail.label}
                    className="rounded-xl p-3 bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10"
                  >
                    <p className="text-xs text-gray-400 uppercase mb-1">
                      {detail.label}
                    </p>
                    <p className="font-semibold text-sm dark:text-white text-gray-900">
                      {detail.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* If Purchased Today banner */}
              <div className="rounded-xl border border-accent dark:bg-slate-200 bg-slate-200 overflow-hidden">
                <div className="flex items-center gap-2 px-3 py-2 border-b border-accent dark:bg-accent bg-accent">
                  <span className="text-base">🛒</span>
                  <p className="text-xs font-semibold text-white uppercase tracking-wide">
                    If Purchased Today
                  </p>
                </div>
                <div className="flex items-center bg-slate-100 justify-between px-4 py-3 gap-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Start Date
                    </p>
                    <p className="text-sm font-bold dark:text-white text-gray-800">
                      {startStr}
                    </p>
                  </div>
                  <div className="flex flex-col items-center gap-1 flex-1">
                    <div className="flex items-center w-full gap-1">
                      <div className="flex-1 h-px bg-slate-300" />
                      <span className="text-accent text-xs">▶</span>
                    </div>
                    <span className="text-[10px] text-accent font-medium whitespace-nowrap">
                      {plan.Day_value ?? 0} Days
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-0.5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                      Expiry Date
                    </p>
                    <p className="text-sm font-bold dark:text-red-400 text-red-500">
                      {expiryStr}
                    </p>
                  </div>
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button onClick={() => setOpenA(false)} variant="secondary">
                Close
              </Button>
              <Button
                color="primary"
                onClick={() => {
                  setOpenA(false);
                  if (onProceedToCheckout) onProceedToCheckout();
                }}
              >
                Subscribe Now →
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function PlanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-1 py-2">
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="min-w-[220px] rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 overflow-hidden"
        >
          <Skeleton className="w-full h-36 rounded-none" />
          <div className="p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded-lg" />
            <Skeleton className="h-3 w-1/2 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MainSubscription() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [openCheckoutModal, setOpenCheckoutModal] = useState(false);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoading(true);
        setError(null);
        const raw = localStorage.getItem("selectedCompany");
        if (!raw) throw new Error("No company data found in localStorage.");
        const company = JSON.parse(raw);
        const companyId = company?.id;
        if (!companyId) throw new Error("Company ID not found.");
        const docRef = doc(db, "mlmcomp", companyId);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists())
          throw new Error("Company not found in Firestore.");
        const data = docSnap.data();
        const fetchedPlans = (data?.Plans ?? []).filter(
          (p) => p.PlanName || p.image_url,
        );
        setPlans(fetchedPlans);
      } catch (err) {
        console.error("Error fetching plans:", err);
        setError(err.message || "Failed to load plans.");
      } finally {
        setLoading(false);
      }
    };
    fetchPlans();
  }, []);

  const handleSlideClick = (plan) => {
    setSelectedPlan(plan);
    setOpenPlanModal(true);
  };

  const PlaceholderSlide = ({ plan, onClick }) => (
    <div
      onClick={onClick}
      className="relative w-full h-full cursor-pointer group rounded-2xl overflow-hidden
        dark:bg-gradient-to-br dark:from-indigo-900/60 dark:to-purple-900/60
        bg-gradient-to-br from-indigo-100 to-purple-100
        border dark:border-white/10 border-black/10
        flex flex-col items-center justify-center gap-2 select-none"
    >
      <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full dark:bg-indigo-500/10 bg-indigo-300/30" />
      <div className="absolute -bottom-6 -left-6 w-24 h-24 rounded-full dark:bg-purple-500/10 bg-purple-300/30" />
      <div className="z-10 flex flex-col items-center gap-2 p-4 text-center">
        <div className="w-12 h-12 rounded-full dark:bg-accent/20 bg-accent/10 flex items-center justify-center text-2xl">
          📋
        </div>
        <p className="font-bold dark:text-white text-gray-800 text-sm leading-tight">
          {plan.PlanName || "View Plan"}
        </p>
        <p className="text-xs dark:text-accent text-accent font-semibold">
          ₹{plan.PlanAmount ?? 0}
        </p>
      </div>
      <div className="absolute inset-0 dark:bg-white/5 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
    </div>
  );

  return (
    <div className="w-full mt-10 dark:bg-[#0a0c10] bg-gray-50 transition-colors duration-300">
      <div className="mt-5" />

      <div className="m-0 p-0">
        {loading && <PlanSkeleton />}

        {!loading && error && (
          <div className="mx-4 p-4 rounded-2xl dark:bg-red-900/20 bg-red-50 border dark:border-red-500/30 border-red-200 text-center">
            <p className="text-2xl mb-2">⚠️</p>
            <p className="text-sm dark:text-red-400 text-red-600 font-medium">
              {error}
            </p>
          </div>
        )}

        {!loading && !error && plans.length === 0 && (
          <div className="mx-4 p-8 rounded-2xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="font-semibold dark:text-white text-gray-800 mb-1">
              No Plans Available
            </p>
            <p className="text-sm dark:text-gray-500 text-gray-400">
              Check back later for subscription options.
            </p>
          </div>
        )}

        {!loading && !error && plans.length > 0 && (
          <div className="w-full">
            <Swiper
              pagination={{ dynamicBullets: true }}
              modules={[Pagination, Autoplay]}
              spaceBetween={10}
              slidesPerView={1}
              centeredSlides={false}
              autoplay={{ delay: 4000, disableOnInteraction: false }}
              breakpoints={{
                480: { slidesPerView: 1.5 },
                768: { slidesPerView: 2.2 },
                1024: { slidesPerView: 3 },
              }}
              className="!px-2"
            >
              {plans.map((plan, index) => (
                <SwiperSlide key={index}>
                  <div
                    className="relative rounded-2xl overflow-hidden cursor-pointer group
                      border dark:border-white/10 border-black/10
                      shadow-md dark:shadow-black/40
                      transition-transform duration-200 active:scale-95"
                    style={{ height: "550px" }}
                    onClick={() => handleSlideClick(plan)}
                  >
                    {plan.image_url ? (
                      <>
                        <img
                          src={plan.image_url}
                          alt={plan.PlanName || `Plan ${index + 1}`}
                          className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-0.5 text-white text-[10px] font-medium">
                            Tap to view
                          </div>
                        </div>
                      </>
                    ) : (
                      <PlaceholderSlide
                        plan={plan}
                        onClick={() => handleSlideClick(plan)}
                      />
                    )}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        )}
      </div>

      {/* Plan Details Modal */}
      <PlanModal
        plan={selectedPlan}
        isOpen={false}
        openA={openPlanModal}
        setOpenA={setOpenPlanModal}
        onProceedToCheckout={() => setOpenCheckoutModal(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlan}
        isOpen={openCheckoutModal}
        setIsOpen={setOpenCheckoutModal}
        onBack={() => setOpenPlanModal(true)}
      />
    </div>
  );
}
