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

import { InputOTP } from "@heroui/react";
export function Login() {
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
    <div className="flex flex-col gap-10 justify-center items-center ">
        <img src={logo} className="w-[120px] border border-none h-[120px] "/>
      <Form className="flex w-[290px] flex-col gap-4" onSubmit={onSubmit}>
        <TextField
          name="mobile"
          type="number"
          validate={(value) => {
            if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value)) {
              return "Please enter a valid email address";
            }

            return null;
          }}
        >
          <Label>Mobile No.</Label>
          <Input
            className="size-12 border border-2 border-gray-200 w-[290px]"
            placeholder="+91XXXXXXXXXX"
          />
          <FieldError />
        </TextField>

        <div className="flex justiify-start items-start w-full flex-col gap-2">
          <Label className="">Enter Pin</Label>
          <InputOTP maxLength={12}>
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
          <Button className={`w-[290px] size-12`} type="submit">
            <Check />
            Login Now
          </Button>
          {/* <Button type="reset" variant="secondary">
          Reset
        </Button> */}
        </div>
      </Form>
    </div>
  );
}
