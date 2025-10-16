"use client";

import { useEffect, useRef } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Terminal, Trash2 } from "lucide-react";

export default function SerialMonitor() {
  const { serialData, clearSerial } = useAppContext();
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [serialData]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" className="fixed bottom-4 right-4 z-10 rounded-full h-12 w-12 shadow-lg bg-primary hover:bg-primary/90 text-primary-foreground">
          <Terminal className="h-6 w-6" />
          <span className="sr-only">Open Serial Monitor</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-2/5 flex flex-col">
        <SheetHeader>
          <SheetTitle>Serial Monitor</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-hidden py-4">
            <ScrollArea className="h-full rounded-md border" ref={scrollAreaRef}>
                 <pre className="p-4 text-sm font-mono whitespace-pre-wrap">
                    {serialData.length > 0 ? serialData.join('\n') : "No data received."}
                </pre>
            </ScrollArea>
        </div>
        <SheetFooter>
            <Button variant="outline" onClick={clearSerial}>
                <Trash2 className="mr-2 h-4 w-4" /> Clear Log
            </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
