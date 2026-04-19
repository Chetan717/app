import React, { useEffect, useState, useCallback } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination, Autoplay } from "swiper/modules";
import { Skeleton } from "@heroui/react";
import { db } from "../../../Firebase";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import { CheckoutModal } from "./CheckoutModal";
import { PlanModal } from "./PlanModal";
import "swiper/css";
import "swiper/css/pagination";

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatDate = (ts) => {
  if (!ts) return "N/A";
  const d = ts?.seconds ? new Date(ts.seconds * 1000) : new Date(ts);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const daysLeft = (expiryStr) => {
  const today = new Date();
  const expiry = new Date(expiryStr);
  const diff = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  return diff;
};

// ─── Active Subscription Card ─────────────────────────────────────────────────
function ActiveSubscriptionCard({ sub }) {
  const days = daysLeft(sub.expirydate);
  const totalDays = sub.duration ?? 1;
  const usedDays = totalDays - days;
  const progress = Math.min(100, Math.max(0, (usedDays / totalDays) * 100));

  return (
    <div className="mx-3 space-y-4">
      {/* Header badge */}
      <div className="flex items-center gap-2">
        <span className="flex h-2 w-2 rounded-full bg-green-400 animate-pulse" />
        <p className="text-xs font-semibold text-green-500 uppercase tracking-wider">
          Active Subscription
        </p>
      </div>

      {/* Main card */}
      <div className="relative rounded-2xl overflow-hidden border dark:border-white/10 border-black/10 shadow-lg dark:shadow-black/40">
        {/* Top gradient bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-accent via-purple-500 to-accent" />

        <div className="p-5 space-y-5 dark:bg-[#0f1117] bg-white">
          {/* Plan name + type */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xl font-extrabold dark:text-white text-gray-900">
                {sub.plan || "Subscription"}
              </p>
              <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide">
                {sub.planType || "Plan"}
              </p>
            </div>
            <div className="bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-500/40 rounded-full px-3 py-1">
              <p className="text-[11px] font-bold text-green-600 dark:text-green-400">
                ✓ Active
              </p>
            </div>
          </div>

          {/* Date strip */}
          <div className="flex items-center justify-between gap-2 rounded-xl dark:bg-white/5 bg-black/5 px-4 py-3">
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase mb-0.5">Start</p>
              <p className="text-xs font-bold dark:text-white text-gray-800">
                {formatDate(sub.startdate)}
              </p>
            </div>
            <div className="flex-1 flex flex-col items-center gap-1">
              <div className="relative w-full h-1.5 rounded-full dark:bg-white/10 bg-black/10 overflow-hidden">
                <div
                  className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-accent to-purple-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-accent font-semibold">
                {days > 0 ? `${days} days left` : "Expired"}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[10px] text-gray-400 uppercase mb-0.5">Expiry</p>
              <p className="text-xs font-bold text-red-500 dark:text-red-400">
                {formatDate(sub.expirydate)}
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Downloads", value: sub.download ?? 0, icon: "⬇️" },
              { label: "Duration", value: `${sub.duration ?? 0}d`, icon: "📅" },
              {
                label: "Amount Paid",
                value: `₹${sub.PaymentAmount ?? 0}`,
                icon: "💳",
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 p-3 text-center"
              >
                <p className="text-base mb-1">{s.icon}</p>
                <p className="text-sm font-bold dark:text-white text-gray-900">
                  {s.value}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* UTR / Order ID */}
          {sub.UTRID && (
            <div className="rounded-xl dark:bg-white/5 bg-black/5 border dark:border-white/10 border-black/10 px-3 py-2 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 uppercase tracking-wide">
                Order ID
              </p>
              <p className="text-[11px] font-mono font-semibold dark:text-gray-300 text-gray-600 truncate max-w-[180px]">
                {sub.UTRID}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton Loader ──────────────────────────────────────────────────────────
function PlanSkeleton() {
  return (
    <div className="flex gap-4 overflow-hidden px-2 py-2">
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

function SubSkeleton() {
  return (
    <div className="mx-3 space-y-4">
      <Skeleton className="h-4 w-36 rounded-full" />
      <div className="rounded-2xl overflow-hidden border dark:border-white/10 border-black/10">
        <Skeleton className="h-1.5 w-full rounded-none" />
        <div className="p-5 space-y-4 dark:bg-[#0f1117] bg-white">
          <Skeleton className="h-7 w-1/2 rounded-xl" />
          <Skeleton className="h-16 w-full rounded-xl" />
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Placeholder Slide ────────────────────────────────────────────────────────
function PlaceholderSlide({ plan, onClick }) {
  return (
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
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MainSubscription() {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openPlanModal, setOpenPlanModal] = useState(false);
  const [openCheckoutModal, setOpenCheckoutModal] = useState(false);

  // Subscription states
  const [subscription, setSubscription] = useState(null);
  const [subLoading, setSubLoading] = useState(true);

  // Fetch active subscription for logged-in user
  const fetchSubscription = useCallback(async () => {
    try {
      setSubLoading(true);
      const raw = localStorage.getItem("mlmuser");
      if (!raw) return;
      const user = JSON.parse(raw);
      const mobileNo = user?.mobileNo;
      if (!mobileNo) return;

      const q = query(
        collection(db, "subscription"),
        where("mobileNo", "==", mobileNo),
        where("Active", "==", true),
        where("Expire", "==", false),
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        // Pick the most recent subscription
        const subs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        subs.sort((a, b) => {
          const aDate = a.PurchaseAt?.seconds ?? 0;
          const bDate = b.PurchaseAt?.seconds ?? 0;
          return bDate - aDate;
        });
        setSubscription(subs[0]);
      }
    } catch (err) {
      console.error("Error fetching subscription:", err);
    } finally {
      setSubLoading(false);
    }
  }, []);

  // Fetch available plans
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const raw = localStorage.getItem("selectedCompany");
      if (!raw) throw new Error("No company data found.");
      const company = JSON.parse(raw);
      if (!company?.id) throw new Error("Company ID not found.");
      const docRef = doc(db, "mlmcomp", company.id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) throw new Error("Company not found in Firestore.");
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
  }, []);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Only fetch plans if no active subscription
  useEffect(() => {
    if (!subLoading && !subscription) {
      fetchPlans();
    } else if (!subLoading && subscription) {
      setLoading(false);
    }
  }, [subLoading, subscription, fetchPlans]);

  const handleSlideClick = (plan) => {
    setSelectedPlan(plan);
    setOpenPlanModal(true);
  };

  // Called after successful payment — re-fetch subscription
  const handlePaymentSuccess = useCallback(() => {
    setOpenCheckoutModal(false);
    setOpenPlanModal(false);
    fetchSubscription();
  }, [fetchSubscription]);

  // ── Loading state ─────────────────────────────────────────────────────────
  if (subLoading) {
    return (
      <div className="w-full mt-10 dark:bg-[#0a0c10] bg-gray-50 transition-colors duration-300">
        <div className="mt-5" />
        <SubSkeleton />
      </div>
    );
  }

  // ── Active subscription view ───────────────────────────────────────────────
  if (subscription) {
    return (
      <div className="w-full mt-10 dark:bg-[#0a0c10] bg-gray-50 transition-colors duration-300">
        <div className="mt-5" />
        <ActiveSubscriptionCard sub={subscription} />
      </div>
    );
  }

  // ── Plans view ────────────────────────────────────────────────────────────
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
        openA={openPlanModal}
        setOpenA={setOpenPlanModal}
        onProceedToCheckout={() => {
          setOpenPlanModal(false);
          setOpenCheckoutModal(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        plan={selectedPlan}
        isOpen={openCheckoutModal}
        setIsOpen={setOpenCheckoutModal}
        onBack={() => {
          setOpenCheckoutModal(false);
          setOpenPlanModal(true);
        }}
        onPaymentSuccess={handlePaymentSuccess}
      />
    </div>
  );
}