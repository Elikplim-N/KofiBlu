"use client";

import BaseControl from "./BaseControl";
import { Button } from "@/components/ui/button";
import { ControlComponent } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import { Send } from "lucide-react";

export default function ButtonControl(props: ControlComponent) {
  const { sendSerial } = useAppContext();
  
  const handleClick = () => {
    sendSerial(`BTN:${props.id}:1`);
  };

  return (
    <BaseControl {...props}>
      <Button className="w-full" onClick={handleClick}>
        <Send className="mr-2 h-4 w-4" />
        Send
      </Button>
    </BaseControl>
  );
}
