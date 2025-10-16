"use client";

import { useState } from "react";
import BaseControl from "./BaseControl";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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
import { Button } from "@/components/ui/button";

interface SwitchControlProps extends ControlComponent {
  onCommand?: string;
  offCommand?: string;
}

export default function SwitchControl(props: SwitchControlProps) {
  const { sendSerial, isEditMode, updateControl } = useAppContext();
  const [isChecked, setIsChecked] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  
  const [label, setLabel] = useState(props.label);
  const [onCommand, setOnCommand] = useState(props.onCommand ?? `SW:${props.id}:1`);
  const [offCommand, setOffCommand] = useState(props.offCommand ?? `SW:${props.id}:0`);

  const handleCheckedChange = (checked: boolean) => {
    if (!isEditMode) {
      setIsChecked(checked);
      sendSerial(checked ? onCommand : offCommand);
    }
  };
  
  const handleSave = () => {
    updateControl(props.id, { label, onCommand, offCommand });
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <BaseControl {...props} label={label} onEdit={() => setIsEditDialogOpen(true)}>
        <div className="flex items-center space-x-2">
          <Switch
            id={props.id}
            checked={isChecked}
            onCheckedChange={handleCheckedChange}
          />
          <Label htmlFor={props.id}>{isChecked ? "On" : "Off"}</Label>
        </div>
      </BaseControl>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Switch Control</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">Label</Label>
              <Input id="label" value={label} onChange={(e) => setLabel(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="on-command" className="text-right">On Command</Label>
              <Input id="on-command" value={onCommand} onChange={(e) => setOnCommand(e.target.value)} className="col-span-3"/>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="off-command" className="text-right">Off Command</Label>
              <Input id="off-command" value={offCommand} onChange={(e) => setOffCommand(e.target.value)} className="col-span-3"/>
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
