import { clsx, type ClassValue } from "clsx";
import { parse } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDisplayName(username: string) {
  return username.charAt(0).toUpperCase() + username.slice(1).toLowerCase();
}

export function buildDateFromSlot(date: string, timeSlot: string) {
  return parse(`${date} ${timeSlot}`, "yyyy-MM-dd h:mm a", new Date());
}

export function slugifyLabel(value: string) {
  return value.toLowerCase().replace(/\s+/g, "-");
}
