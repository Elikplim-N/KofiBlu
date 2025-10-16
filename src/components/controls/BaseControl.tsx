"use client";

import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X, Settings } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { ControlComponent } from "@/lib/types";

interface BaseControlProps extends ControlComponent {
  children: ReactNode;
  onEdit?: () => void;
}

export default function BaseControl({ id, label, children, onEdit }: BaseControlProps) {
  const { removeControl, isEditMode } = useAppContext();

  return (
    <Card className="w-full max-w-sm relative group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      {isEditMode && (
         <div className="absolute top-2 right-2 flex gap-1">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={onEdit}
              >
                <Settings className="h-4 w-4" />
                <span className="sr-only">Edit</span>
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={() => removeControl(id)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Remove</span>
            </Button>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-base font-medium pr-10">{label}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
