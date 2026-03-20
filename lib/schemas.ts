import { addDays, endOfDay, format, isWithinInterval, startOfDay } from "date-fns";
import { z } from "zod";
import { addonIds, bookingTimeSlots, serviceIds } from "@/lib/site-data";

const today = startOfDay(new Date());
const finalBookingDate = endOfDay(addDays(today, 6));

export const loginSchema = z.object({
  username: z.string().trim().min(1, "Enter your username."),
  password: z.string().min(1, "Enter your password.")
});

export const bookingSchema = z.object({
  serviceId: z.enum(serviceIds, {
    message: "Choose a service."
  }),
  addons: z.array(z.enum(addonIds)),
  serviceDate: z
    .string()
    .refine((value) => {
      const parsed = new Date(`${value}T12:00:00`);
      return !Number.isNaN(parsed.getTime()) &&
        isWithinInterval(parsed, { start: today, end: finalBookingDate });
    }, "Choose a date within the next 7 days."),
  timeSlot: z.enum(bookingTimeSlots, {
    message: "Pick a time slot."
  }),
  address: z.string().trim().min(8, "Enter the service address."),
  city: z.string().trim().min(1, "City is required."),
  lawnSizeNote: z
    .string()
    .trim()
    .min(6, "Add a quick note about the lawn size or gate access.")
});

export type LoginValues = z.infer<typeof loginSchema>;
export type BookingValues = z.infer<typeof bookingSchema>;

export function getDefaultBookingDate() {
  return format(today, "yyyy-MM-dd");
}
