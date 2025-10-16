"use client";

import { Logo } from "@/components/Logo";
import ConnectButton from "@/components/ConnectButton";
import ProfileManager from "@/components/ProfileManager";

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b border-border/80 bg-background/50 px-4 backdrop-blur-sm sm:px-6">
      <Logo />
      <div className="flex items-center gap-2 sm:gap-4">
        <ProfileManager />
        <ConnectButton />
      </div>
    </header>
  );
}
