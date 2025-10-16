"use client";

import { useState } from "react";
import BaseControl from "./BaseControl";
import { Slider } from "@/components/ui/slider";
import { ControlComponent } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";

export default function SliderControl(props: ControlComponent) {
  const { sendSerial } = useAppContext();
  const [value, setValue] = useState([50]);

  const handleValueChange = (newValue: number[]) => {
    setValue(newValue);
    sendSerial(`SLD:${props.id}:${newValue[0]}`);
  };

  return (
    <BaseControl {...props}>
      <div className="flex items-center gap-4">
        <Slider
          defaultValue={[50]}
          max={100}
          step={1}
          onValueChange={handleValueChange}
        />
        <span className="w-12 text-center font-mono text-primary">{value[0]}</span>
      </div>
    </BaseControl>
  );
}
