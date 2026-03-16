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
import { useGeneralData } from "../Context/GeneralContext";

export function Forgetpin() {
    const {FORGET_PASS_URL} = useGeneralData
  const navigate = useNavigate();
  const [tab, setTab] = useState("send");

  const onSubmit = (e) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const data = {};

    formData.forEach((value, key) => {
      data[key] = value.toString();
    });

    console.log(data);
  };

  return (
    <div className="flex flex-col gap-10 justify-center items-center h-screen">
      <Form className="flex w-[290px] flex-col gap-4" onSubmit={onSubmit}>
        
        {/* SEND OTP */}
        {tab === "send" && (
          <>
            <TextField
              name="mobile"
              type="number"
              validate={(value) => {
                if (!value || value.length !== 10) {
                  return "Please enter valid Mobile Number";
                }
                return null;
              }}
            >
              <Label className="font-bold text-[#5865f2]">Mobile No.</Label>
              <Input
                className="size-12 border-2 border-gray-200 w-[290px]"
                placeholder="Enter mobile number"
              />
              <FieldError />
            </TextField>

            <Button  onClick={() => {
          navigate("/verifyotp");
        }} className="w-[290px] size-12" type="submit">
              Send OTP
            </Button>
             <Button  onClick={() => {
              navigate("/signup");
            }} type="reset" className={`size-12 w-[290px]`} variant="secondary">
          Back
        </Button>
          </>
        )}
       
      </Form>
    </div>
  );
}