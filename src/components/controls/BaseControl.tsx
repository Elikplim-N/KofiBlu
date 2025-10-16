"use client";

import type { ReactNode } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { useAppContext } from "@/contexts/app-context";
import { ControlComponent } from "@/lib/types";

interface BaseControlProps extends ControlComponent {
  children: ReactNode;
}

export default function BaseControl({ id, label, children }: BaseControlProps) {
  const { removeControl } = useAppContext();

  return (
    <Card className="w-full max-w-sm relative group transition-all duration-300 hover:shadow-lg hover:shadow-primary/10">
      <Button
        variant="ghost"
        size="icon"
        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => removeControl(id)}
      >
        <X className="h-4 w-4" />
        <span className="sr-only">Remove</span>
      </Button>
      <CardHeader>
        <CardTitle className="text-base font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
