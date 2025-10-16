"use client";

import { AppProvider } from "@/contexts/app-context";
import Header from "@/components/Header";
import ControlPalette from "@/components/ControlPalette";
import ControlCanvas from "@/components/ControlCanvas";
import SerialMonitor from "@/components/SerialMonitor";

export default function Home() {
  return (
    <AppProvider>
      <div className="flex h-screen w-full flex-col bg-background text-foreground">
        <Header />
        <main className="flex flex-1 overflow-hidden">
          <ControlPalette />
          <div className="flex-1 overflow-y-auto">
            <ControlCanvas />
          </div>
        </main>
        <SerialMonitor />
      </div>
    </AppProvider>
  );
}
