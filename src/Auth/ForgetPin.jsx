import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
  InputOTP,
} from "@heroui/react";
import { useNavigate } from "react-router";
import { useState } from "react";
import axios from "axios";
import {
  collection,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../Firebase";

export function Forgetpin() {
  const navigate = useNavigate();

  // ── Step control ──────────────────────────────────────────────
  // step 1 = enter mobile, step 2 = verify OTP, step 3 = set new PIN
  const [step, setStep] = useState(1);

  // ── Shared state ──────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ── Step 1 state ──────────────────────────────────────────────
  const [mobile, setMobile] = useState("");

  // ── Step 2 state ──────────────────────────────────────────────
  const [sentOtp, setSentOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");

  // ── Step 3 state ──────────────────────────────────────────────
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");

  // ── Firestore user doc id (used in step 3) ────────────────────
  const [userId, setUserId] = useState("");

  // ── Helpers ───────────────────────────────────────────────────
  const generateOTP = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  const sendOtp = async (phoneNumber) => {
    const otp = generateOTP();
    await axios({
      method: "get",
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/3b24364e-e422-11ee-8cbb-0200cd936042/SMS/${"91" + phoneNumber}/${otp}/ADSMAKER365`,
      headers: {},
    });
    return otp;
  };

  // ── STEP 1 : Send OTP ─────────────────────────────────────────
  const onSendOtp = async (e) => {
    e.preventDefault();
    setError("");

    if (!/^[0-9]{10}$/.test(mobile)) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }

    try {
      setLoading(true);

      // Check if mobile exists in Firestore
      const q = query(
        collection(db, "users"),
        where("mobileNo", "==", mobile)
      );
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("No account found with this mobile number");
        return;
      }

      // Save user doc id for step 3
      setUserId(snapshot.docs[0].id);

      // Send OTP
      const otp = await sendOtp(mobile);
      setSentOtp(otp);

      // Save OTP in Firestore
      await updateDoc(doc(db, "users", snapshot.docs[0].id), {
        otp: otp,
      });

      setStep(2);
    } catch (err) {
      console.error("Send OTP Error:", err);
      setError("Failed to send OTP. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 : Verify OTP ───────────────────────────────────────
  const onVerifyOtp = async () => {
    setError("");

    if (enteredOtp.length < 4) {
      setError("Please enter the 4-digit OTP");
      return;
    }

    if (enteredOtp !== sentOtp) {
      setError("Incorrect OTP. Please try again.");
      setEnteredOtp("");
      return;
    }

    try {
      setLoading(true);

      // Clear OTP from Firestore after successful verify
      await updateDoc(doc(db, "users", userId), {
        otp: "",
      });

      setStep(3);
    } catch (err) {
      console.error("Verify OTP Error:", err);
      setError("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 3 : Set New PIN ──────────────────────────────────────
  const onSetNewPin = async () => {
    setError("");

    if (!/^[0-9]{4}$/.test(newPin)) {
      setError("PIN must be exactly 4 digits");
      return;
    }

    if (newPin !== confirmPin) {
      setError("PINs do not match");
      return;
    }

    try {
      setLoading(true);

      // Update PIN in Firestore
      await updateDoc(doc(db, "users", userId), {
        password: newPin,
      });

      alert("✅ PIN changed successfully! Please login.");
      navigate("/login");
    } catch (err) {
      console.error("Set PIN Error:", err);
      setError("Failed to update PIN. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const onResendOtp = async () => {
    try {
      setLoading(true);
      setError("");
      const otp = await sendOtp(mobile);
      setSentOtp(otp);

      await updateDoc(doc(db, "users", userId), { otp: otp });

      alert("OTP resent successfully!");
    } catch {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen">

      {/* ── STEP 1 : Enter Mobile ── */}
      {step === 1 && (
        <Form className="flex w-[290px] flex-col gap-4" onSubmit={onSendOtp}>

          <div className="text-center">
            <h2 className="text-xl font-bold text-[#5865f2]">Forgot PIN</h2>
            <p className="text-sm text-gray-500 mt-1">
              Enter your registered mobile number
            </p>
          </div>

          <TextField name="mobile" type="tel">
            <Label className="font-bold text-[#5865f2]">Mobile No.</Label>
            <Input
              className="size-12 border-2 border-gray-200 w-[290px]"
              maxLength={10}
              value={mobile}
              onChange={(e) => setMobile(e.target.value.trim())}
            />
            <FieldError />
          </TextField>

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            className="w-[290px] size-12"
            type="submit"
            isLoading={loading}
          >
            {loading ? "Sending..." : "Send OTP"}
          </Button>

          <Button
            className="w-[290px] size-12"
            type="button"
            variant="secondary"
            onClick={() => navigate("/login")}
          >
            Back
          </Button>

        </Form>
      )}

      {/* ── STEP 2 : Verify OTP ── */}
      {step === 2 && (
        <div className="flex w-[290px] flex-col gap-6">

          <div className="text-center">
            <h2 className="text-xl font-bold text-[#5865f2]">Verify OTP</h2>
            <p className="text-sm text-gray-500 mt-1">
              OTP sent to{" "}
              <span className="font-semibold text-gray-700">
                +91 {mobile}
              </span>
            </p>
          </div>

          <div className="flex flex-col gap-2 items-start">
            <Label className="font-bold text-[#5865f2]">Enter OTP</Label>
            <InputOTP
              maxLength={4}
              value={enteredOtp}
              onChange={(val) => setEnteredOtp(val)}
            >
              <InputOTP.Group className="gap-6">
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

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            className="w-[290px] size-12"
            onClick={onVerifyOtp}
            isLoading={loading}
          >
            {loading ? "Verifying..." : "Verify OTP"}
          </Button>

          <div className="flex justify-between items-center">
            <span
              onClick={onResendOtp}
              className="text-sm text-[#5865f2] font-semibold cursor-pointer"
            >
              Resend OTP
            </span>
            <span
              onClick={() => setStep(1)}
              className="text-sm text-gray-500 font-semibold cursor-pointer"
            >
              ← Back
            </span>
          </div>

        </div>
      )}

      {/* ── STEP 3 : Set New PIN ── */}
      {step === 3 && (
        <div className="flex w-[290px] flex-col gap-6">

          <div className="text-center">
            <h2 className="text-xl font-bold text-[#5865f2]">Set New PIN</h2>
            <p className="text-sm text-gray-500 mt-1">
              Choose a new 4-digit PIN
            </p>
          </div>

          {/* New PIN */}
          <div className="flex flex-col gap-2 items-start">
            <Label className="font-bold text-[#5865f2]">New PIN</Label>
            <InputOTP
              maxLength={4}
              value={newPin}
              onChange={(val) => setNewPin(val)}
            >
              <InputOTP.Group className="gap-6">
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
          <div className="flex flex-col gap-2 items-start">
            <Label className="font-bold text-[#5865f2]">Confirm PIN</Label>
            <InputOTP
              maxLength={4}
              value={confirmPin}
              onChange={(val) => setConfirmPin(val)}
            >
              <InputOTP.Group className="gap-6">
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

          {error && (
            <p className="text-red-500 text-sm text-center">{error}</p>
          )}

          <Button
            className="w-[290px] size-12"
            onClick={onSetNewPin}
            isLoading={loading}
          >
            {loading ? "Saving..." : "Change PIN"}
          </Button>

        </div>
      )}

    </div>
  );
}