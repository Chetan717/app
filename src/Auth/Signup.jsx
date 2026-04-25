"use client";
import { useState } from "react";
import {
  Button,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import { InputOTP } from "@heroui/react";
import { useNavigate } from "react-router";
import { Check } from "@gravity-ui/icons";
import logo from "../../public/mlmboo2.ico";
import axios from "axios";

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db } from "../../Firebase";

export function Signup() {
  const navigate = useNavigate();

  // ── Step control ──────────────────────────────────────────────
  const [step, setStep] = useState(1); // 1 = signup form, 2 = OTP screen

  // ── Form state ────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  // ── OTP state ─────────────────────────────────────────────────
  const [sentOtp, setSentOtp] = useState("");
  const [enteredOtp, setEnteredOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [userId, setUserId] = useState("");
  const [userMobile, setUserMobile] = useState("");

  // ── Refer state ───────────────────────────────────────────────
  const [referInput, setReferInput] = useState("");
  const [referMsg, setReferMsg] = useState(""); // green success msg

  // ── Helpers ───────────────────────────────────────────────────

  /**
   * Generates refer code: 4 random CAPITAL letters + last 4 digits of mobile
   * e.g. mobile = "9876543210" → "XKQT3210"
   */
  const generateReferCode = (mobile) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const randomPart = Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join("");
    const mobilePart = mobile.slice(-4); // last 4 digits
    return randomPart + mobilePart;
  };

  const generateOTP = () =>
    Math.floor(1000 + Math.random() * 9000).toString();

  const sendOtp = async (phoneNumber) => {
    const otp = generateOTP();
    await axios({
      method: "get",
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/3b24364e-e422-11ee-8cbb-0200cd936042/SMS/${"91" + phoneNumber}/${otp}/MLMBOOSTER`,
      headers: {},
    });
    return otp;
  };

  const validateData = (data) => {
    if (!data.name || data.name.trim().length < 3)
      return "Name must be at least 3 characters";
    if (!/^[0-9]{10}$/.test(data.mobile))
      return "Mobile number must be exactly 10 digits";
    if (!/^[0-9]{4}$/.test(data.pin))
      return "PIN must be exactly 4 digits";
    return null;
  };

  // ── STEP 1 : Create account + send OTP ───────────────────────
  const onSignupSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {};
    formData.forEach((value, key) => {
      data[key] = value.toString().trim();
    });

    const validationError = validateData(data);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setLoading(true);
      setFormError("");
      setReferMsg("");

      // ── Check duplicate mobile ──────────────────────────────
      const q = query(
        collection(db, "users"),
        where("mobileNo", "==", data.mobile)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setFormError("Mobile number already registered");
        return;
      }

      // ── Validate refer code if entered ──────────────────────
      let referredByDocId = null;
      const trimmedRefer = referInput.trim().toUpperCase();

      if (trimmedRefer !== "") {
        // Refer code format: 4 CAPS + 4 digits = 8 chars
        if (!/^[A-Z]{4}[0-9]{4}$/.test(trimmedRefer)) {
          setFormError("Invalid refer code format");
          return;
        }

        const referQuery = query(
          collection(db, "users"),
          where("referCode", "==", trimmedRefer)
        );
        const referSnap = await getDocs(referQuery);

        if (referSnap.empty) {
          setFormError("Refer code not found");
          return;
        }

        referredByDocId = referSnap.docs[0].id; // save referrer's doc id
      }

      // ── Generate refer code for new user ───────────────────
      const referCode = generateReferCode(data.mobile);

      // ── Send OTP ────────────────────────────────────────────
      const otp = await sendOtp(data.mobile);

      // ── Save user to Firestore ──────────────────────────────
      const docRef = await addDoc(collection(db, "users"), {
        name: data.name,
        mobileNo: data.mobile,
        password: data.pin,
        createdAt: new Date(),
        isverified: false,
        otp: otp,
        referCode: referCode,       // ✅ their own refer code
        referredBy: trimmedRefer || null,  // ✅ who referred them (null if none)
        referCredit: 0,             // ✅ starts at 0
      });

      // ── Save states for step 2 ──────────────────────────────
      setSentOtp(otp);
      setUserId(docRef.id);
      setUserMobile(data.mobile);

      // Store referrer doc id temporarily in state for credit after verify
      if (referredByDocId) {
        sessionStorage.setItem("referredByDocId", referredByDocId);
      }

      setStep(2);
    } catch (error) {
      console.error("Signup Error:", error);
      setFormError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── STEP 2 : Verify OTP ───────────────────────────────────────
  const onVerifyOtp = async () => {
    if (enteredOtp.length < 4) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }

    if (enteredOtp !== sentOtp) {
      setOtpError("Incorrect OTP. Please try again.");
      setEnteredOtp("");
      return;
    }

    try {
      setLoading(true);
      setOtpError("");

      // ── Mark user as verified + clear OTP ──────────────────
      await updateDoc(doc(db, "users", userId), {
        isverified: true,
        otp: "",
        referCredit: referInput.trim() !== "" ? 5 : 0,
      });

      // ── Give 10 referCredit to referrer ─────────────────────
      const referredByDocId = sessionStorage.getItem("referredByDocId");
      if (referredByDocId) {
        // Fetch current credits of referrer
        const referrerSnap = await getDocs(
          query(collection(db, "users"), where("__name__", "==", referredByDocId))
        );

        if (!referrerSnap.empty) {
          const currentCredits = referrerSnap.docs[0].data().referCredit || 0;
          await updateDoc(doc(db, "users", referredByDocId), {
            referCredit: currentCredits + 10,
          });
        }

        sessionStorage.removeItem("referredByDocId");
      }

      // alert("🎉 Account created successfully! Please login.");

      navigate("/login");
    } catch (error) {
      console.error("Verify Error:", error);
      setOtpError("Verification failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Resend OTP ────────────────────────────────────────────────
  const onResendOtp = async () => {
    try {
      setLoading(true);
      setOtpError("");
      const otp = await sendOtp(userMobile);
      setSentOtp(otp);

      // Update new OTP in Firestore too
      await updateDoc(doc(db, "users", userId), { otp: otp });

      alert("OTP resent successfully!");
    } catch {
      setOtpError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ─────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen">
      <img src={logo} className="w-[120px] h-[120px]" />

      {/* ── STEP 1 : Signup Form ── */}
      {step === 1 && (
        <Form
          className="flex w-[290px] flex-col gap-4"
          onSubmit={onSignupSubmit}
        >
          {/* Name */}
          <TextField name="name" type="text">
            <Label className="font-bold text-[#5865f2]">Name</Label>
            <Input className="size-12 border-2 border-gray-200 w-[290px]" />
            <FieldError />
          </TextField>

          {/* Mobile */}
          <TextField name="mobile" type="tel">
            <Label className="font-bold text-[#5865f2]">Mobile No.</Label>
            <Input
              className="size-12 border-2 border-gray-200 w-[290px]"
              maxLength={10}
            />
            <FieldError />
          </TextField>

          {/* PIN */}
          <div className="flex flex-col gap-2">
            <Label className="font-bold text-[#5865f2]">Enter Pin</Label>
            <InputOTP name="pin" maxLength={4}>
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

          {/* Refer Code (optional) */}
          <div className="flex flex-col gap-1">
            <Label className="font-bold text-[#5865f2]">
              Refer Code{" "}
              <span className="text-gray-400 font-normal text-xs">
                (optional)
              </span>
            </Label>
            <input
              type="text"
              placeholder="e.g. ABCD1234"
              maxLength={8}
              value={referInput}
              onChange={(e) => {
                setReferInput(e.target.value.toUpperCase());
                setReferMsg("");
                setFormError("");
              }}
              className="h-12 px-3 border-2 border-gray-200 rounded-md w-[290px] text-sm tracking-widest font-mono uppercase outline-none focus:border-[#5865f2] transition"
            />
            {referMsg && (
              <p className="text-green-500 text-xs mt-1">{referMsg}</p>
            )}
          </div>

          {/* Error */}
          {formError && (
            <p className="text-red-500 text-sm text-center">{formError}</p>
          )}

          {/* Submit */}
          <Button
            className="w-[290px] size-12"
            type="submit"
            isLoading={loading}
          >
            {loading ? "Creating..." : "Create Account"}
          </Button>

          {/* Login link */}
          <p className="text-center font-bold text-gray-700">
            Have An Account?
            <span
              onClick={() => navigate("/login")}
              className="ml-1 text-[#5865f2] cursor-pointer"
            >
              Login
            </span>
          </p>
        </Form>
      )}

      {/* ── STEP 2 : OTP Verification ── */}
      {step === 2 && (
        <div className="flex w-[290px] flex-col gap-6">
          {/* Heading */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-[#5865f2]">Verify OTP</h2>
            <p className="text-sm text-gray-500 mt-1">
              OTP sent to{" "}
              <span className="font-semibold text-gray-700">
                +91 {userMobile}
              </span>
            </p>
          </div>

          {/* OTP Input */}
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

          {/* OTP Error */}
          {otpError && (
            <p className="text-red-500 text-sm text-center">{otpError}</p>
          )}

          {/* Verify Button */}
          <Button
            className="w-[290px] size-12"
            onClick={onVerifyOtp}
            isLoading={loading}
          >
            <Check />
            {loading ? "Verifying..." : "Verify Now"}
          </Button>

          {/* Resend + Back row */}
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
    </div>
  );
}