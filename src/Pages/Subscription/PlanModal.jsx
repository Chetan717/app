import React from "react";
import { Modal, Button, Chip } from "@heroui/react";

export function PlanModal({ plan, openA, setOpenA, onProceedToCheckout }) {
  if (!plan) return null;

  const details = [
    { label: "Plan Amount", value: `₹${plan.PlanAmount ?? 0}` },
    { label: "Duration", value: plan.Day_value ? `${plan.Day_value} Days` : "—" },
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
                {details.map((detail) => (
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
                      {formatDate(today)}
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
                      {formatDate(expiryDate)}
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