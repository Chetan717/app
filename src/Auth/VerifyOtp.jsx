"use client";
import { Check } from "@gravity-ui/icons";
import {
  Button,
  Description,
  FieldError,
  Form,
  Input,
  Label,
  TextField,
} from "@heroui/react";
import logo from "../../public/mlmboo2.ico"
import { Router } from "react-router";
import { InputOTP } from "@heroui/react";
import { useNavigate } from "react-router";
import { useGeneralData } from "../Context/GeneralContext";

export function VerifyOtp() {

  const {VERIFY_OTP_URL} = useGeneralData()
let navigate = useNavigate();


  const onSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {};

    // Convert FormData to plain object
    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    alert(`Form submitted with: ${JSON.stringify(data, null, 2)}`);
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen ">
        {/* <img src={logo} className="w-[120px] border border-none h-[120px] "/> */}
      <Form className="flex w-[290px] flex-col gap-4" onSubmit={onSubmit}>
        {/* <TextField
          name="mobile"
          type="number"
          validate={(value) => {
            if (value.length < 10) {
              return "Please enter a valid Mobile Number";
            }
            return null;
          }}
        >
          <Label  className={`font-bold text-[#5865f2]`}>Mobile No.</Label>
          <Input
            className="size-12 border border-2 border-gray-200 w-[290px]"
            placeholder=""
          />
          <FieldError />
        </TextField> */}

        <div className="flex justiify-start items-start w-full flex-col gap-2">
          <Label  className={`font-bold text-[#5865f2]`}>Enter Pin</Label>
          <InputOTP name="otp"  maxLength={12}>
            <InputOTP.Group className="gap-8">
              <InputOTP.Slot
                className="size-12 border border-2 border-gray-200"
                index={0}
              />
              <InputOTP.Slot
                className="size-12 border border-2 border-gray-200"
                index={1}
              />
              <InputOTP.Slot
                className="size-12 border border-2 border-gray-200"
                index={2}
              />
              <InputOTP.Slot
                className="size-12 border border-2 border-gray-200"
                index={3}
              />
              {/* <InputOTP.Slot className="size-12" index={5} /> */}
            </InputOTP.Group>
          </InputOTP>
        </div>

        <div className="flex justify-center mt-2 item-center gap-2">
          <Button  onClick={() => {
              navigate("/lastuppin");
            }} className={`w-[270px] size-12`} type="submit">
            <Check />
            Verify Now
          </Button>
          <Button  onClick={() => {
              navigate("/signup");
            }} type="reset" className={`size-12`} variant="secondary">
          Back
        </Button>
        </div>

      </Form>
    </div>
  );
}


// payload_of_forgetpass = {
//   mobileNo: `${loginData.Mobile}`,

// };