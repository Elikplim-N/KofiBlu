import { Bluetooth } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Bluetooth className="h-6 w-6 text-primary" />
      <h1 className="text-xl font-bold tracking-tight">KofiBlu</h1>
    </div>
  );
}
