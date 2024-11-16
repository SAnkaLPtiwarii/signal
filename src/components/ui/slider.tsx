import * as React from "react"
import * as SliderPrimitive from "@radix-ui/react-slider"
import { cn } from "@/lib/utils"

interface SliderProps extends SliderPrimitive.SliderProps {
    className?: string;
}

const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
    ({ className, ...props }, ref) => (
        <SliderPrimitive.Root
            ref={ref}
            className={cn("relative flex w-full touch-none select-none items-center", className)}
            {...props}
        >
            <SliderPrimitive.Track className="relative h-1.5 w-full grow overflow-hidden rounded-full bg-primary/20">
                <SliderPrimitive.Range className="absolute h-full bg-primary" />
            </SliderPrimitive.Track>
            <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full border border-primary/50 bg-background shadow" />
        </SliderPrimitive.Root>
    )
);

Slider.displayName = "Slider";

export { Slider };