"use client";

import { useAppContext } from "@/contexts/app-context";
import { Logo } from "@/components/Logo";
import ConnectButton from "@/components/ConnectButton";
import ProfileManager from "@/components/ProfileManager";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

export default function Header() {
  const { isEditMode, setIsEditMode } = useAppContext();
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/80 bg-background/50 px-4 backdrop-blur-sm sm:px-6">
      <Logo />
      <div className="flex items-center gap-4">
        <div className="flex items-center space-x-2">
          <Switch 
            id="edit-mode" 
            checked={isEditMode}
            onCheckedChange={setIsEditMode}
          />
          <Label htmlFor="edit-mode">Edit Mode</Label>
        </div>
        <ProfileManager />
        <ConnectButton />
      </div>
    </header>
  );
}
