"use client";

import { Calendar } from "@/components/ui/calendar";

type UpcomingCalendarProps = {
  dates: string[];
};

export function UpcomingCalendar({ dates }: UpcomingCalendarProps) {
  const parsedDates = dates.map((date) => new Date(date));

  return (
    <Calendar
      mode="single"
      selected={parsedDates[0]}
      modifiers={{ booked: parsedDates }}
      modifiersClassNames={{
        booked: "bg-primary text-white hover:bg-primary"
      }}
    />
  );
}
