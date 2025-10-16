"use client";

import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bluetooth, BluetoothConnected, X } from "lucide-react";

export default function ConnectButton() {
  const { isConnected, deviceName, connect, disconnect } = useAppContext();

  if (isConnected) {
    return (
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="border-primary/50 text-primary">
          <BluetoothConnected className="mr-2 h-4 w-4" />
          {deviceName || "Connected"}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          onClick={disconnect}
          aria-label="Disconnect"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={connect}>
      <Bluetooth className="mr-2 h-4 w-4" />
      Connect
    </Button>
  );
}
