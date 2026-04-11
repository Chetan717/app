import React, { useState } from "react";
import { Modal, Button, Label, InputOTP } from "@heroui/react";
import { useNavigate } from "react-router";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "../../../../Firebase";

function DeleteAcc({ show, setDeleteAcc }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step control ──────────────────────────────────────────────
  // step 1 = first confirm, step 2 = second confirm, step 3 = enter PIN
  const [step, setStep] = useState(1);

  // ── PIN state ─────────────────────────────────────────────────
  const [pin, setPin] = useState("");

  const resetState = () => {
    setStep(1);
    setPin("");
    setError("");
  };

  const onClose = () => {
    resetState();
    setDeleteAcc(false);
  };

  // ── STEP 3 : Verify PIN + Delete ──────────────────────────────
  const onDeleteAccount = async () => {
    setError("");

    if (pin.length < 4) {
      setError("Please enter your 4-digit PIN to confirm");
      return;
    }

    try {
      setLoading(true);

      // ── Get user from localStorage ──────────────────────────
      const stored = localStorage.getItem("usermlm");
      if (!stored) {
        setError("Session expired. Please login again.");
        return;
      }
      const localUser = JSON.parse(stored);

      // ── Find user in Firestore ──────────────────────────────
      const q = query(
        collection(db, "users"),
        where("mobileNo", "==", localUser.mobileNo)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("User not found. Please login again.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // ── Verify PIN ──────────────────────────────────────────
      if (userData.password !== pin) {
        setError("Incorrect PIN. Account not deleted.");
        setPin("");
        return;
      }

      // ── Delete user doc from Firestore ──────────────────────
      await deleteDoc(doc(db, "users", userDoc.id));

      // ── Clear localStorage ──────────────────────────────────
      localStorage.removeItem("usermlm");
      localStorage.removeItem("mlmProfile");

      resetState();
      setDeleteAcc(false);
      navigate("/logout");

    } catch (err) {
      console.error("Delete Account Error:", err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={show}>
      <Modal.Backdrop>
        <Modal.Container>
          <Modal.Dialog className="sm:max-w-[360px]">

            {/* ── STEP 1 : First Confirmation ── */}
            {step === 1 && (
              <>
                <Modal.Header>
                  <Modal.Heading className="font-bold text-red-500">
                    Delete Account
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  <div className="flex flex-col gap-3 items-center py-2 text-center">
                    {/* Warning Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-3xl">⚠️</span>
                    </div>

                    <p className="font-bold text-gray-800 text-base">
                      Are you sure you want to delete your account?
                    </p>
                    <p className="text-gray-500 text-sm">
                      This action is permanent and cannot be undone. All your
                      data will be lost forever.
                    </p>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-red-500 text-white"
                    onClick={() => setStep(2)}
                  >
                    Yes, Delete My Account
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </Modal.Footer>
              </>
            )}

            {/* ── STEP 2 : Second Confirmation ── */}
            {step === 2 && (
              <>
                <Modal.Header>
                  <Modal.Heading className="font-bold text-red-500">
                    Final Warning
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  <div className="flex flex-col gap-3 items-center py-2 text-center">
                    {/* Warning Icon */}
                    <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">
                      <span className="text-3xl">🗑️</span>
                    </div>

                    <p className="font-bold text-gray-800 text-base">
                      This is your last chance!
                    </p>
                    <p className="text-gray-500 text-sm">
                      Your account, refer credits, and all associated data will
                      be permanently deleted. There is no way to recover it.
                    </p>
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-red-500 text-white"
                    onClick={() => setStep(3)}
                  >
                    I Understand, Delete It
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={onClose}
                  >
                    No, Keep My Account
                  </Button>
                </Modal.Footer>
              </>
            )}

            {/* ── STEP 3 : Enter PIN to confirm ── */}
            {step === 3 && (
              <>
                <Modal.Header>
                  <Modal.Heading className="font-bold text-red-500">
                    Enter PIN to Delete
                  </Modal.Heading>
                </Modal.Header>

                <Modal.Body>
                  <div className="flex flex-col gap-5 items-center py-2">
                    <p className="text-gray-500 text-sm text-center">
                      Enter your 4-digit PIN to permanently delete your account.
                    </p>

                    {/* PIN Input */}
                    <div className="flex flex-col gap-2 items-center w-full">
                      <Label className="font-bold text-red-500 text-sm">
                        Your PIN
                      </Label>
                      <InputOTP
                        maxLength={4}
                        value={pin}
                        onChange={(val) => {
                          setPin(val);
                          setError("");
                        }}
                      >
                        <InputOTP.Group className="gap-4">
                          {[0, 1, 2, 3].map((i) => (
                            <InputOTP.Slot
                              key={i}
                              index={i}
                              className="size-12 border-2 border-red-200"
                            />
                          ))}
                        </InputOTP.Group>
                      </InputOTP>
                    </div>

                    {/* Error */}
                    {error && (
                      <p className="text-red-500 text-sm text-center w-full">
                        {error}
                      </p>
                    )}
                  </div>
                </Modal.Body>

                <Modal.Footer className="flex flex-col gap-2">
                  <Button
                    className="w-full bg-red-500 text-white"
                    onClick={onDeleteAccount}
                    isLoading={loading}
                  >
                    {loading ? "Deleting..." : "Delete My Account"}
                  </Button>
                  <Button
                    className="w-full"
                    variant="secondary"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                </Modal.Footer>
              </>
            )}

          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default DeleteAcc;