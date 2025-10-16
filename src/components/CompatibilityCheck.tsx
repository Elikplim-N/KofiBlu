"use client";

import { useAppContext } from "@/contexts/app-context";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function CompatibilityCheck() {
  const { isBluetoothSupported } = useAppContext();

  if (isBluetoothSupported) {
    return null;
  }

  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Browser Not Supported</AlertTitle>
        <AlertDescription>
          Your browser does not support the Web Bluetooth API. Please use a
          compatible browser like Google Chrome or Microsoft Edge for this app to
          work.
        </AlertDescription>
      </Alert>
    </div>
  );
}
