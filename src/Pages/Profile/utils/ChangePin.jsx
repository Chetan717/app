import React, { useState } from "react";
import { Modal, Button, Label, InputOTP } from "@heroui/react";
import { useNavigate } from "react-router";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../../../Firebase";

function ChangePin({ show, setChngePin }) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [oldPin, setOldPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  const resetState = () => {
    setOldPin("");
    setNewPin("");
    setConfirmPin("");
    setError("");
  };

  const onChangePin = async () => {
    setError("");

    // ── Validation ──────────────────────────────────────────
    if (oldPin.length < 4) {
      setError("Please enter your current 4-digit PIN");
      return;
    }
    if (newPin.length < 4) {
      setError("Please enter a new 4-digit PIN");
      return;
    }
    if (confirmPin.length < 4) {
      setError("Please confirm your new PIN");
      return;
    }
    if (newPin !== confirmPin) {
      setError("New PIN and Confirm PIN do not match");
      return;
    }
    if (oldPin === newPin) {
      setError("New PIN must be different from current PIN");
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

      // ── Find user in Firestore by mobile ────────────────────
      const q = query(
        collection(db, "users"),
        where("mobileNo", "==", localUser.mobileNo),
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("User not found. Please login again.");
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // ── Verify old PIN ──────────────────────────────────────
      if (userData.password !== oldPin) {
        setError("Current PIN is incorrect");
        setOldPin("");
        return;
      }

      // ── Update PIN in Firestore ─────────────────────────────
      await updateDoc(doc(db, "users", userDoc.id), {
        password: newPin,
      });

      resetState();
      setChngePin(false);
      navigate("/logout");
    } catch (err) {
      console.error("Change PIN Error:", err);
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
            <Modal.Header>
              <Modal.Heading className="font-bold  text-accent">
                Change Pin
              </Modal.Heading>
            </Modal.Header>

            <Modal.Body>
              <div className="flex flex-col gap-5 justify-center items-center py-2">
                {/* Current PIN */}
                <div className="flex flex-col gap-2 items-center w-full">
                  <Label className="font-bold text-accent text-sm">
                    Current Pin
                  </Label>
                  <InputOTP
                    maxLength={4}
                    value={oldPin}
                    onChange={(val) => {
                      setOldPin(val);
                      setError("");
                    }}
                  >
                    <InputOTP.Group className="gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTP.Slot
                          key={i}
                          index={i}
                          className="size-12 border-2 border-gray-200"
                        />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                </div>

                {/* New PIN */}
                <div className="flex flex-col gap-2 items-center w-full">
                  <Label className="font-bold text-accent text-sm">
                    New Pin
                  </Label>
                  <InputOTP
                    maxLength={4}
                    value={newPin}
                    onChange={(val) => {
                      setNewPin(val);
                      setError("");
                    }}
                  >
                    <InputOTP.Group className="gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTP.Slot
                          key={i}
                          index={i}
                          className="size-12 border-2 border-gray-200"
                        />
                      ))}
                    </InputOTP.Group>
                  </InputOTP>
                </div>

                {/* Confirm PIN */}
                <div className="flex flex-col gap-2 items-center w-full">
                  <Label className="font-bold  text-accent text-sm">
                    Confirm New Pin
                  </Label>
                  <InputOTP
                    maxLength={4}
                    value={confirmPin}
                    onChange={(val) => {
                      setConfirmPin(val);
                      setError("");
                    }}
                  >
                    <InputOTP.Group className="gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <InputOTP.Slot
                          key={i}
                          index={i}
                          className="size-12 border-2 border-gray-200"
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
              {/* Save */}
              <Button
                className="w-full"
                onClick={onChangePin}
                isLoading={loading}
              >
                {loading ? "Saving..." : "Create New Pin"}
              </Button>

              {/* Cancel */}
              <Button
                className="w-full"
                variant="secondary"
                onClick={() => {
                  resetState();
                  setChngePin(false);
                }}
              >
                Cancel
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

export default ChangePin;
