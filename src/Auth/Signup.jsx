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
import { useGeneralData } from "../Context/GeneralContext";
import axios from "axios";
import logo from "../../public/mlmboo2.ico";

export function Signup() {
  const { SIGNUP_URL } = useGeneralData();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");

  const validateData = (data) => {
    if (!data.name || data.name.length < 3) {
      return "Name must be at least 3 characters";
    }

    if (!data.mobile || data.mobile.length !== 10) {
      return "Mobile number must be 10 digits";
    }

    if (!data.pin || data.pin.length !== 4) {
      return "Pin must be 4 digits";
    }

    return null;
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    const validationError = validateData(data);
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const payload = {
      name: data.name,
      mobileNo: data.mobile,
      password: data.pin,
    };

    try {
      setLoading(true);
      setFormError("");

      const response = await axios.put(SIGNUP_URL, payload);

      console.log("API Response:", response.data);

      alert("Account Created Successfully");

      navigate("/verifyotp", {
        state: { mobile: data.mobile },
      });

    } catch (error) {
      console.error(error);

      if (error.response) {
        setFormError(error.response.data?.message || "Signup failed");
      } else {
        setFormError("Server not reachable");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen">
      <img src={logo} className="w-[120px] h-[120px]" />

      <Form className="flex w-[290px] flex-col gap-4" onSubmit={onSubmit}>
        
        {/* Name */}
        <TextField name="name" type="text">
          <Label className="font-bold text-[#5865f2]">Name</Label>
          <Input className="size-12 border border-2 border-gray-200 w-[290px]" />
          <FieldError />
        </TextField>

        {/* Mobile */}
        <TextField name="mobile" type="number">
          <Label className="font-bold text-[#5865f2]">Mobile No.</Label>
          <Input className="size-12 border border-2 border-gray-200 w-[290px]" />
          <FieldError />
        </TextField>

        {/* PIN */}
        <div className="flex flex-col gap-2">
          <Label className="font-bold text-[#5865f2]">Enter Pin</Label>

          <InputOTP name="pin" maxLength={4}>
            <InputOTP.Group className="gap-8">
              <InputOTP.Slot className="size-12 border border-2 border-gray-200" index={0} />
              <InputOTP.Slot className="size-12 border border-2 border-gray-200" index={1} />
              <InputOTP.Slot className="size-12 border border-2 border-gray-200" index={2} />
              <InputOTP.Slot className="size-12 border border-2 border-gray-200" index={3} />
            </InputOTP.Group>
          </InputOTP>
        </div>

        {/* Error Message */}
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

        {/* Login */}
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
    </div>
  );
}