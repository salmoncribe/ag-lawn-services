"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-[28px] border border-white/50 bg-white/85 p-4", className)}
      classNames={{
        root: cn("w-full", defaultClassNames.root),
        months: "flex w-full flex-col gap-4 sm:flex-row",
        month: "w-full space-y-4",
        nav: "flex items-center gap-1",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-9 w-9 border border-border bg-white/70 text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "h-9 w-9 border border-border bg-white/70 text-foreground"
        ),
        month_caption:
          "flex h-9 items-center justify-center text-sm font-semibold text-foreground",
        weekdays: "grid grid-cols-7 gap-1",
        weekday:
          "text-center text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground",
        week: "mt-1 grid grid-cols-7 gap-1",
        day: "h-10 w-10",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 rounded-2xl p-0 font-medium text-foreground aria-selected:bg-primary aria-selected:text-white hover:bg-primary/10"
        ),
        today: "bg-secondary text-accent",
        outside: "text-muted-foreground/40",
        disabled: "text-muted-foreground/30",
        selected: "bg-primary text-white hover:bg-primary",
        hidden: "invisible",
        ...classNames
      }}
      components={{
        Chevron: ({ orientation, className: iconClassName, ...iconProps }) =>
          orientation === "left" ? (
            <ChevronLeft className={cn("h-4 w-4", iconClassName)} {...iconProps} />
          ) : (
            <ChevronRight className={cn("h-4 w-4", iconClassName)} {...iconProps} />
          )
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
