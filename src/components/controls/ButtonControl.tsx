"use client";

import { useState } from "react";
import BaseControl from "./BaseControl";
import { Button } from "@/components/ui/button";
import { ControlComponent } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import { Send } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ButtonControlProps extends ControlComponent {
  command?: string;
}

export default function ButtonControl(props: ButtonControlProps) {
  const { sendSerial, isEditMode, updateControl } = useAppContext();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [label, setLabel] = useState(props.label);
  const [command, setCommand] = useState(props.command ?? `BTN:${props.id}:1`);

  const handleClick = () => {
    if (!isEditMode) {
      sendSerial(command);
    }
  };

  const handleSave = () => {
    updateControl(props.id, { label, command });
    setIsEditDialogOpen(false);
  };

  return (
    <>
      <BaseControl {...props} label={label} onEdit={() => setIsEditDialogOpen(true)}>
        <Button className="w-full" onClick={handleClick}>
          <Send className="mr-2 h-4 w-4" />
          Send
        </Button>
      </BaseControl>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Button Control</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="label" className="text-right">
                Label
              </Label>
              <Input
                id="label"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="command" className="text-right">
                Command
              </Label>
              <Input
                id="command"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
