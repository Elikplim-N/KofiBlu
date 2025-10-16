"use client";

import { useState } from "react";
import BaseControl from "./BaseControl";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ControlComponent } from "@/lib/types";
import { useAppContext } from "@/contexts/app-context";
import { Send } from "lucide-react";

export default function InputControl(props: ControlComponent) {
  const { sendSerial } = useAppContext();
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (value.trim()) {
      sendSerial(`TXT:${props.id}:${value}`);
      setValue("");
    }
  };
  
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSend();
    }
  };

  return (
    <BaseControl {...props}>
      <div className="flex w-full items-center space-x-2">
        <Input
          type="text"
          placeholder="Enter text..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <Button onClick={handleSend} size="icon" aria-label="Send Text">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </BaseControl>
  );
}
