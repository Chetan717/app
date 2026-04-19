import React, { useRef, useState, useCallback } from "react";
import { Modal } from "@heroui/react";
import { db } from "../../../Firebase";
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

// ─── IMPORTANT: Add to your .env → REACT_APP_RAZORPAY_KEY_ID=rzp_live_xxx ───
const RAZORPAY_KEY_ID = "rzp_live_8Jx7RC30uLKlPJ";

const CREATE_ORDER_URL =
  "https://cvmhznb2u7.execute-api.ap-south-1.amazonaws.com/createOrder/?API_KEY=ADS360KEY";

// ─── Load Razorpay SDK dynamically ───────────────────────────────────────────
const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// ─── Storage helpers ──────────────────────────────────────────────────────────
const getUserFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("mlmuser") || "{}");
  } catch {
    return {};
  }
};

const getCompanyFromStorage = () => {
  try {
    return JSON.parse(localStorage.getItem("selectedCompany") || "{}");
  } catch {
    return {};
  }
};

const formatDateForDB = (date) =>
  date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

const fmtDisplay = (date) =>
  date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

// ─── CheckoutModal ────────────────────────────────────────────────────────────
export function CheckoutModal({
  plan,
  isOpen,
  setIsOpen,
  onBack,
  onPaymentSuccess,
}) {
  // ════════════════════════════════════════════════════════════════════════════
  // ALL HOOKS MUST BE HERE — before any conditional return
  // ════════════════════════════════════════════════════════════════════════════
  const [coupon, setCoupon] = useState(["", "", "", "", "", ""]);
  const [couponStatus, setCouponStatus] = useState(null); // null | "valid" | "invalid" | "inactive"
  const [couponLoading, setCouponLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [couponData, setCouponData] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState(null);
  const inputRefs = useRef([]);

  const handleConfirmPurchase = useCallback(async () => {
    if (!plan || paymentLoading) return;
    setPaymentError(null);
    setPaymentLoading(true);

    // Snapshot values at call time (avoid stale closure issues)
    const baseAmt = plan.PlanAmount ?? 0;
    const discount = Math.floor((baseAmt * discountPercent) / 100);
    const payableAmount = baseAmt - discount;

    const today = new Date();
    const expiryDate = new Date(today);
    expiryDate.setDate(expiryDate.getDate() + (plan.Day_value ?? 0));

    let orderId = null;

    try {
      // 1. Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded)
        throw new Error(
          "Payment gateway failed to load. Check your connection.",
        );

      // 2. Create order on backend (amount in paise)
      const res = await fetch(CREATE_ORDER_URL, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: payableAmount * 100 }),
      });
      console.log(res, "response");
      
      if (!res.ok) throw new Error(`Order creation failed: ${res.status}`);
      const orderData = await res.json();
      orderId =
        orderData?.data?.order_id ?? orderData?.order_id ?? orderData?.id;
      if (!orderId) throw new Error("Invalid order response from server.");

      const user = getUserFromStorage();
      const company = getCompanyFromStorage();

      // Helper to build log document
      const buildLogDoc = (status) => ({
        OrderId: orderId,
        payment: status,
        plan: plan.PlanName || "",
        planType: plan.Type || "",
        company: company?.name || company?.id || "",
        startdate: formatDateForDB(today),
        expirydate: formatDateForDB(expiryDate),
        download: plan.downloads ?? 0,
        PurchaseAt: serverTimestamp(),
        PaymentAmount: payableAmount,
        duration: plan.Day_value ?? 0,
        mobileNo: user?.mobileNo || "",
        UserName: user?.name || "",
        Active: status === "Success",
        Expire: status !== "Success",
        UTRID: orderId,
      });

      // 3. Open Razorpay Checkout
      await new Promise((resolve, reject) => {
        const options = {
          key: RAZORPAY_KEY_ID,
          amount: payableAmount * 100,
          currency: "INR",
          name: company?.name || "Subscription",
          description: plan.PlanName || "Plan Purchase",
          order_id: orderId,
          prefill: {
            name: user?.name || "",
            contact: user?.mobileNo || "",
            email: user?.email || "",
          },
          notes: {
            plan: plan.PlanName || "",
            planType: plan.Type || "",
            company: company?.name || "",
          },
          theme: { color: "#6366f1" },
          modal: {
            ondismiss: () => reject(new Error("DISMISSED")),
          },
          handler: async (response) => {
            try {
              // 4a. Save subscription on success
              await addDoc(collection(db, "subscription"), {
                ...buildLogDoc("Success"),
                couponApplied:
                  couponStatus === "valid" ? coupon.join("") : null,
                discountPercent,
              });
              // 4b. Log success
              await addDoc(
                collection(db, "paymentlog"),
                buildLogDoc("Success"),
              ).catch(() => {});
              resolve(response);
            } catch (saveErr) {
              console.error("Firestore save error:", saveErr);
              resolve(response); // payment succeeded — still resolve
            }
          },
        };

        const rzp = new window.Razorpay(options);

        rzp.on("payment.failed", async (failRes) => {
          const failedId = failRes?.error?.metadata?.order_id || orderId;
          const failDoc = {
            ...buildLogDoc("Failed"),
            OrderId: failedId,
            UTRID: failedId,
          };
          await addDoc(collection(db, "paymentlog"), failDoc).catch(() => {});
          reject(
            new Error(
              failRes?.error?.description || "Payment failed. Please retry.",
            ),
          );
        });

        rzp.open();
      });

      // 5. Success — notify parent to refresh subscription view
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      if (err.message === "DISMISSED") {
        // Log dismissed payment if we have an orderId
        if (orderId) {
          const u = getUserFromStorage();
          const c = getCompanyFromStorage();
          const t = new Date();
          const e = new Date(t);
          e.setDate(e.getDate() + (plan.Day_value ?? 0));
          await addDoc(collection(db, "paymentlog"), {
            OrderId: orderId,
            payment: "Failed",
            plan: plan.PlanName || "",
            planType: plan.Type || "",
            company: c?.name || c?.id || "",
            startdate: formatDateForDB(t),
            expirydate: formatDateForDB(e),
            download: plan.downloads ?? 0,
            PurchaseAt: serverTimestamp(),
            PaymentAmount: payableAmount,
            duration: plan.Day_value ?? 0,
            mobileNo: u?.mobileNo || "",
            UserName: u?.name || "",
            Active: false,
            Expire: true,
            UTRID: orderId,
          }).catch(() => {});
        }
        setPaymentError("Payment cancelled. You can try again anytime.");
      } else {
        setPaymentError(
          err.message || "Something went wrong. Please try again.",
        );
      }
    } finally {
      setPaymentLoading(false);
    }
  }, [
    plan,
    discountPercent,
    couponStatus,
    coupon,
    paymentLoading,
    onPaymentSuccess,
  ]);

  // ════════════════════════════════════════════════════════════════════════════
  // GUARD — safe here because all hooks are already called above
  // ════════════════════════════════════════════════════════════════════════════
  if (!plan) return null;

  // ── Derived values (plain JS — not hooks) ─────────────────────────────────
  const baseAmount = plan.PlanAmount ?? 0;
  const discountAmount = Math.floor((baseAmount * discountPercent) / 100);
  const finalAmount = baseAmount - discountAmount;

  const today = new Date();
  const expiryDate = new Date(today);
  expiryDate.setDate(expiryDate.getDate() + (plan.Day_value ?? 0));

  const couponString = coupon.join("");
  const isCouponFilled = couponString.length === 6;

  // ── Coupon input handlers (plain functions — not hooks) ───────────────────
  const handleCouponChange = (val, idx) => {
    const char = val
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase()
      .slice(-1);
    const next = [...coupon];
    next[idx] = char;
    setCoupon(next);
    setCouponStatus(null);
    setDiscountPercent(0);
    setCouponData(null);
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
      setDiscountPercent(0);
      setCouponData(null);
      inputRefs.current[5]?.focus();
    }
    e.preventDefault();
  };

  const handleApplyCoupon = async () => {
    if (!isCouponFilled || couponLoading) return;
    setCouponLoading(true);
    setPaymentError(null);
    try {
      const q = query(
        collection(db, "couponcode"),
        where("code", "==", couponString),
      );
      const snap = await getDocs(q);
      if (snap.empty) {
        setCouponStatus("invalid");
        setDiscountPercent(0);
        setCouponData(null);
        return;
      }
      const data = snap.docs[0].data();
      if (data.active === false) {
        setCouponStatus("inactive");
        setDiscountPercent(0);
        setCouponData(null);
        return;
      }
      setCouponStatus("valid");
      setDiscountPercent(Number(data.user_discount ?? 0));
      setCouponData(data);
    } catch (err) {
      console.error("Coupon validation error:", err);
      setCouponStatus("invalid");
      setDiscountPercent(0);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleClearCoupon = () => {
    setCoupon(["", "", "", "", "", ""]);
    setCouponStatus(null);
    setDiscountPercent(0);
    setCouponData(null);
    setPaymentError(null);
    inputRefs.current[0]?.focus();
  };

  // ── Render ────────────────────────────────────────────────────────────────
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
                    {plan.Type || "—"}&nbsp;·&nbsp;{plan.Day_value ?? 0} Days
                  </p>
                </div>
                <p className="text-lg font-extrabold text-accent shrink-0">
                  ₹{baseAmount}
                </p>
              </div>

              {/* ── Validity strip ── */}
              <div className="rounded-xl bg-black/5 dark:bg-white/5 border dark:border-white/10 border-black/10 px-4 py-3 flex items-center justify-between gap-2">
                <div className="text-center">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">
                    Start
                  </p>
                  <p className="text-xs font-semibold dark:text-white text-gray-800">
                    {fmtDisplay(today)}
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
                    {fmtDisplay(expiryDate)}
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
                      disabled={couponLoading || couponStatus === "valid"}
                      onChange={(e) => handleCouponChange(e.target.value, idx)}
                      onKeyDown={(e) => handleCouponKeyDown(e, idx)}
                      className={[
                        "w-10 h-11 text-center text-sm font-bold rounded-xl border-2 outline-none",
                        "transition-all duration-150 dark:bg-white/5 bg-black/5",
                        "dark:text-white text-gray-900 focus:border-accent focus:bg-accent/5",
                        "disabled:opacity-60 disabled:cursor-not-allowed",
                        couponStatus === "valid"
                          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
                          : couponStatus === "invalid" ||
                              couponStatus === "inactive"
                            ? "border-red-400 bg-red-50 dark:bg-red-900/20 text-red-500"
                            : "dark:border-white/10 border-black/15",
                      ].join(" ")}
                    />
                  ))}
                </div>

                <div className="flex items-center justify-between px-1 min-h-[20px]">
                  <span className="text-xs font-medium">
                    {couponStatus === "valid" && (
                      <span className="text-green-500">
                        ✅ {discountPercent}% discount applied!
                      </span>
                    )}
                    {couponStatus === "invalid" && (
                      <span className="text-red-500">❌ Coupon not found</span>
                    )}
                    {couponStatus === "inactive" && (
                      <span className="text-orange-500">
                        ⛔ Coupon is no longer active
                      </span>
                    )}
                  </span>
                  <div className="flex items-center gap-3">
                    {couponLoading && (
                      <span className="text-xs text-gray-400 animate-pulse">
                        Checking…
                      </span>
                    )}
                    {!couponLoading &&
                      isCouponFilled &&
                      couponStatus !== "valid" && (
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
                    ₹{baseAmount}
                  </span>
                </div>
                {couponStatus === "valid" && discountAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-green-500">
                      Coupon Discount ({discountPercent}%)
                    </span>
                    <span className="text-green-500 font-medium">
                      − ₹{discountAmount}
                    </span>
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
                  <span className="text-accent">₹{finalAmount}</span>
                </div>
              </div>

              {/* ── Error message ── */}
              {paymentError && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 px-4 py-3">
                  <p className="text-xs text-red-600 dark:text-red-400 text-center">
                    ⚠️ {paymentError}
                  </p>
                </div>
              )}
            </Modal.Body>

            {/* ── Footer ── */}
            <Modal.Footer className="flex flex-col gap-2 pt-2">
              <button
                onClick={handleConfirmPurchase}
                disabled={paymentLoading}
                className={[
                  "w-full py-3.5 rounded-xl font-bold text-sm text-white",
                  "flex items-center justify-center gap-2 shadow-lg shadow-accent/25",
                  "transition-all duration-150",
                  paymentLoading
                    ? "bg-accent/60 cursor-not-allowed"
                    : "bg-accent hover:opacity-90 active:scale-[0.98]",
                ].join(" ")}
              >
                {paymentLoading ? (
                  <>
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                    Processing…
                  </>
                ) : (
                  <>
                    <span>🔒</span> Confirm Purchase &nbsp;·&nbsp; ₹
                    {finalAmount}
                  </>
                )}
              </button>

              <button
                disabled={paymentLoading}
                onClick={() => {
                  if (paymentLoading) return;
                  setIsOpen(false);
                  if (onBack) onBack();
                }}
                className="w-full py-2.5 rounded-xl text-sm font-medium
                  dark:text-gray-400 text-gray-500
                  dark:hover:bg-white/5 hover:bg-black/5
                  disabled:opacity-50 disabled:cursor-not-allowed
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
