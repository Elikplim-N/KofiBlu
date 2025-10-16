"use client";

import { useAppContext } from "@/contexts/app-context";
import ButtonControl from "./controls/ButtonControl";
import SliderControl from "./controls/SliderControl";
import InputControl from "./controls/InputControl";
import { Dices } from "lucide-react";

export default function ControlCanvas() {
  const { controls } = useAppContext();

  if (controls.length === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <Dices className="h-16 w-16 mb-4"/>
        <h2 className="text-2xl font-semibold">Empty Canvas</h2>
        <p>Add controls from the palette on the left to get started.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start gap-4 p-4">
      {controls.map((control) => {
        switch (control.type) {
          case "button":
            return <ButtonControl key={control.id} {...control} />;
          case "slider":
            return <SliderControl key={control.id} {...control} />;
          case "textInput":
            return <InputControl key={control.id} {...control} />;
          default:
            return null;
        }
      })}
    </div>
  );
}
