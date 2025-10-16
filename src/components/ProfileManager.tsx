"use client";

import { useState } from "react";
import { useAppContext } from "@/contexts/app-context";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ChevronDown, Plus, Trash2 } from "lucide-react";

export default function ProfileManager() {
  const { profiles, saveProfile, loadProfile, deleteProfile } = useAppContext();
  const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
  const [profileName, setProfileName] = useState("");

  const handleSave = () => {
    saveProfile(profileName);
    setIsSaveDialogOpen(false);
    setProfileName("");
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Profiles
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Load Profile</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {profiles.length > 0 ? (
              profiles.map((profile) => (
                <DropdownMenuItem
                  key={profile.name}
                  className="flex justify-between items-center"
                  onSelect={(e) => e.preventDefault()}
                >
                  <span onClick={() => loadProfile(profile.name)} className="flex-1">{profile.name}</span>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => deleteProfile(profile.name)}>
                    <Trash2 className="h-4 w-4 text-destructive/70" />
                  </Button>
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No profiles saved</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        <Button size="icon" variant="outline" onClick={() => setIsSaveDialogOpen(true)} aria-label="Save Profile">
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <Dialog open={isSaveDialogOpen} onOpenChange={setIsSaveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Control Profile</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="profile-name" className="text-right">
                Name
              </Label>
              <Input
                id="profile-name"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="col-span-3"
                placeholder="e.g., Robot Arm"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleSave}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
