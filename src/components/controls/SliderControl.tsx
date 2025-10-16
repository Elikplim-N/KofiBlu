"use client";

import { useState } from "react";
import BaseControl from "./BaseControl";
import { Slider } from "@/components/ui/slider";
import { ControlComponent } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

interface SliderControlProps extends ControlComponent {
  orientation?: "horizontal" | "vertical";
  min?: number;
  max?: number;
  prefix?: string;
}

export default function SliderControl(props: SliderControlProps) {
  const { sendSerial, updateControl } = useAppContext();
  const { min = 0, max = 100, orientation = "horizontal", prefix = `SLD:${props.id}` } = props;

  const [value, setValue] = useState([(min + max) / 2]);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [label, setLabel] = useState(props.label);
  const [localPrefix, setLocalPrefix] = useState(prefix);
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);
  const [localOrientation, setLocalOrientation] = useState(orientation);
  
  const handleValueChange = (newValue: number[]) => {
    setValue(newValue);
    sendSerial(`${localPrefix}:${newValue[0]}`);
  };
  
  const handleSave = () => {
    updateControl(props.id, { 
      label, 
      prefix: localPrefix,
      min: localMin,
      max: localMax,
      orientation: localOrientation
    });
    setIsEditDialogOpen(false);
  };

  const isVertical = localOrientation === "vertical";

  return (
    <>
      <BaseControl {...props} label={label} onEdit={() => setIsEditDialogOpen(true)}>
        <div className={cn(
          "flex items-center gap-4",
           isVertical && "flex-col h-48 w-auto"
        )}>
          <Slider
            value={value}
            min={localMin}
            max={localMax}
            step={1}
            onValueChange={handleValueChange}
            orientation={localOrientation}
            className={cn(isVertical ? "w-2 h-full" : "w-full h-2")}
          />
          <span className="w-12 text-center font-mono text-primary">{value[0]}</span>
        </div>
      </BaseControl>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Slider Control</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Label</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="prefix" className="text-right">Prefix</Label>
              <Input id="prefix" value={localPrefix} onChange={(e) => setLocalPrefix(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="min" className="text-right">Min</Label>
              <Input id="min" type="number" value={localMin} onChange={(e) => setLocalMin(Number(e.target.value))} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="max" className="text-right">Max</Label>
              <Input id="max" type="number" value={localMax} onChange={(e) => setLocalMax(Number(e.target.value))} className="col-span-3" />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Orientation</Label>
              <RadioGroup defaultValue={localOrientation} onValueChange={(v) => setLocalOrientation(v as any)} className="col-span-3 flex gap-4">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="horizontal" id="h" />
                  <Label htmlFor="h">Horizontal</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="vertical" id="v" />
                  <Label htmlFor="v">Vertical</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
