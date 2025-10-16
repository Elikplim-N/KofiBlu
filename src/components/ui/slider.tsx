"use client"

import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"

import { cn } from "@/lib/utils"

const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={cn(
      "relative flex w-full touch-none select-none items-center",
      props.orientation === "vertical" && "h-full flex-col w-auto",
      className
    )}
    {...props}
  >
    <SliderPrimitive.Track className={cn("relative h-2 w-full grow overflow-hidden rounded-full bg-secondary",  props.orientation === "vertical" && "w-2 h-full")}>
      <SliderPrimitive.Range className={cn("absolute h-full bg-primary",  props.orientation === "vertical" && "w-full")} />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className={cn("block h-5 w-5 rounded-full border-2 border-primary bg-background ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50", props.orientation === "vertical" && "h-5 w-5")} />
  </SliderPrimitive.Root>
))
Slider.displayName = SliderPrimitive.Root.displayName

export { Slider }
