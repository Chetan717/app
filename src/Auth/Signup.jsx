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
  const [sentOtp, setSentOtp] = useState(""); // OTP we sent
  const [enteredOtp, setEnteredOtp] = useState(""); // OTP user types
  const [otpError, setOtpError] = useState("");
  const [userId, setUserId] = useState(""); // Firestore doc id
  const [userMobile, setUserMobile] = useState(""); // for resend

  // ── Helpers ───────────────────────────────────────────────────
  const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

  const sendOtp = async (phoneNumber) => {
    const otp = generateOTP();

    await axios({
      method: "get",
      maxBodyLength: Infinity,
      url: `https://2factor.in/API/V1/3b24364e-e422-11ee-8cbb-0200cd936042/SMS/${
        "91" + phoneNumber
      }/${otp}/MLMBOOSTER`,
      headers: {},
    });

    return otp;
  };

  const validateData = (data) => {
    if (!data.name || data.name.trim().length < 3)
      return "Name must be at least 3 characters";
    if (!/^[0-9]{10}$/.test(data.mobile))
      return "Mobile number must be exactly 10 digits";
    if (!/^[0-9]{4}$/.test(data.pin)) return "PIN must be exactly 4 digits";
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

      // Check duplicate mobile
      const q = query(
        collection(db, "users"),
        where("mobileNo", "==", data.mobile),
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setFormError("Mobile number already registered");
        return;
      }

      const otp = await sendOtp(data.mobile);
      const docRef = await addDoc(collection(db, "users"), {
        name: data.name,
        mobileNo: data.mobile,
        password: data.pin,
        createdAt: new Date(),
        isverified: false,
        otp: otp, // ✅ store OTP
      });

      // Send OTP

      // Store in state so Step 2 can use them
      setSentOtp(otp);
      setUserId(docRef.id);
      setUserMobile(data.mobile);

      // Move to OTP step
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

      // Mark user as verified in Firestore
      await updateDoc(doc(db, "users", userId), {
        isverified: true,
        otp: "", // ✅ clear OTP after use
      });

      // ✅ Success — show alert and go to login
      alert("🎉 Account created successfully! Please login.");
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
