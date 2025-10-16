"use client";

import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { CaseSensitive, Pilcrow, SlidersHorizontal, ToggleRight } from "lucide-react";

const controlTypes = [
  { type: "button", label: "Button", icon: CaseSensitive },
  { type: "slider", label: "Slider", icon: SlidersHorizontal },
  { type: "textInput", label: "Text Input", icon: Pilcrow },
  { type: "switch", label: "Switch", icon: ToggleRight },
];

export default function ControlPalette() {
  const { addControl } = useAppContext();

  return (
    <aside className="w-64 border-r border-border/80 bg-background/50 p-4">
      <h2 className="mb-4 text-lg font-semibold tracking-tight">Controls</h2>
      <div className="flex flex-col gap-2">
        {controlTypes.map(({ type, label, icon: Icon }) => (
          <Button
            key={type}
            variant="ghost"
            className="justify-start gap-2"
            onClick={() => addControl(type as any, label)}
          >
            <Icon className="h-5 w-5 text-primary" />
            {label}
          </Button>
        ))}
      </div>
    </aside>
  );
}
