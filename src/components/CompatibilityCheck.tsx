"use client";

import { useState, useEffect } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { Code } from "lucide-react";

export default function CompatibilityCheck() {
  const [isSupported, setIsSupported] = useState(true);

  useEffect(() => {
    // This check runs only on the client side.
    if (typeof window !== 'undefined' && !navigator.bluetooth) {
      setIsSupported(false);
    }
  }, []);

  if (isSupported) {
    return null;
  }

  return (
    <div className="p-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Web Bluetooth API Not Available</AlertTitle>
        <AlertDescription>
          <p className="mb-2">Your browser does not support the Web Bluetooth API or it is not enabled. Please try the following:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>Ensure you are using a compatible browser like Google Chrome or Microsoft Edge.</li>
            <li>
              <span className="font-semibold">Enable the Experimental Web Platform features flag:</span>
              <ol className="list-decimal pl-5 mt-1">
                <li>
                  Navigate to <code className="font-mono bg-muted px-1 py-0.5 rounded">chrome://flags/#enable-experimental-web-platform-features</code> in your Chrome address bar.
                </li>
                <li>
                  Find the "Experimental Web Platform features" flag and set it to "Enabled".
                </li>
                <li>
                  Relaunch your browser.
                </li>
              </ol>
            </li>
            <li>
              The Web Bluetooth API requires a secure context. Ensure you are accessing this page via <span className="font-semibold">HTTPS</span> or from <span className="font-semibold">localhost</span>.
            </li>
          </ul>
        </AlertDescription>
      </Alert>
    </div>
  );
}
