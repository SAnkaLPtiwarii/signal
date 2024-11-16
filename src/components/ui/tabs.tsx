import * as React from "react"
import * as TabsPrimitive from "@radix-ui/react-tabs"
import { cn } from "@/lib/utils"

const Tabs = TabsPrimitive.Root

interface TabsProps extends TabsPrimitive.TabsProps {
    className?: string;
}

const TabsList = React.forwardRef<HTMLDivElement, TabsProps>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.List
            ref={ref}
            className={cn("inline-flex h-9 items-center justify-center rounded-lg bg-muted p-1", className)}
            {...props}
        />
    )
);

const TabsTrigger = React.forwardRef<HTMLButtonElement, TabsPrimitive.TabsTriggerProps>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.Trigger
            ref={ref}
            className={cn("inline-flex items-center justify-center px-3 py-1", className)}
            {...props}
        />
    )
);

const TabsContent = React.forwardRef<HTMLDivElement, TabsPrimitive.TabsContentProps>(
    ({ className, ...props }, ref) => (
        <TabsPrimitive.Content
            ref={ref}
            className={cn("mt-2", className)}
            {...props}
        />
    )
);

TabsList.displayName = "TabsList";
TabsTrigger.displayName = "TabsTrigger";
TabsContent.displayName = "TabsContent";

export { Tabs, TabsList, TabsTrigger, TabsContent };